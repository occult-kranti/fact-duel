import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validateInput,hashRecovery} from '../supabase/jhk/functions/jhk-game/core.mjs';

const h=(value)=>createHash('sha256').update(value).digest('hex');
const enabled=Boolean(process.env.PGLITE_MODULE_PATH);

test('JHK Edge validation separates recovery and profile secrets', async()=>{
 assert.throws(()=>validateInput({action:'session',nickname:'Player',email:'p@example.test'}),{code:'PROFILE_REQUIRED'});
 assert.throws(()=>validateInput({action:'recover',recoveryCode:'weak'}),{code:'BAD_RECOVERY'});
 assert.equal(validateInput({action:'recover',recoveryCode:'a'.repeat(64)}).payload.recoveryCode,undefined);
 assert.equal(await hashRecovery('a'.repeat(64)),h('jhk:recovery:'+'a'.repeat(64)));
 assert.notEqual(await hashRecovery('a'.repeat(64)),h('hisaab:recovery:'+'a'.repeat(64)));
});

test('legacy session upgrades in place, keeping XP and wallet, and recovery rotates bearer', {skip:!enabled},async()=>{
 const {PGlite}=await import(pathToFileURL(process.env.PGLITE_MODULE_PATH).href);
 const db=new PGlite();
 try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema jhk_private;');
  await db.exec(`create table jhk_private.sessions (
   id uuid primary key default gen_random_uuid(),token_hash text not null unique check(length(token_hash)=64),
   nickname text not null check(char_length(nickname) between 2 and 24),created_at timestamptz not null default now(),
   expires_at timestamptz not null default(now()+interval '30 days'),last_seen timestamptz not null default now(),
   rate_start timestamptz not null default now(),rate_count integer not null default 0,deleted boolean not null default false);
   create table jhk_private.wallets(session_id uuid primary key references jhk_private.sessions(id),balance bigint not null default 100 check(balance>=0));`);
  const oldHash=h('old-token');
  const guest=(await db.query('insert into jhk_private.sessions(token_hash,nickname) values($1,$2) returning id',[oldHash,'Legacy Player'])).rows[0].id;
  await db.query('insert into jhk_private.wallets(session_id,balance) values($1,345)',[guest]);
  await db.exec(fs.readFileSync(new URL('../supabase/jhk/schema.sql',import.meta.url),'utf8'));
  const query=async(tokenHash,action,payload={})=>(await db.query('select public.jhk_command($1,$2,$3::jsonb,$4) as result',[tokenHash,action,JSON.stringify(payload),'network'])).rows[0].result;
  const pre=await query(oldHash,'profile');
  assert.equal(pre.session.profileComplete,false); assert.equal(pre.session.balance,345);
  assert.equal((await query(oldHash,'queue')).error.code,'PROFILE_REQUIRED');
  const room=crypto.randomUUID();
  await db.query(`insert into jhk_private.rooms(id,mode,deck) values($1,'private','[]'::jsonb)`,[room]);
  await db.query('insert into jhk_private.members(room_id,session_id) values($1,$2)',[room,guest]);
  await db.query(`insert into jhk_private.answers(room_id,round,session_id,request_id,choice,correct,elapsed_ms,xp,received_at)
   values($1,1,$2,$3,0,true,1000,30,now())`,[room,guest,crypto.randomUUID()]);
  assert.equal((await query(oldHash,'snapshot',{roomId:room})).ok,true);
  assert.equal((await query(oldHash,'ready',{roomId:room,stake:0})).error.code,'PROFILE_REQUIRED');
  assert.equal((await query(oldHash,'leave',{roomId:room})).ok,true);
  const recoveryCode='c'.repeat(64), recoveryHash=await hashRecovery(recoveryCode);
  const upgraded=await query(oldHash,'profile',{email:'LEGACY@example.test',adultConfirmed:true,termsVersion:'beta-1',_recoveryHash:recoveryHash});
  assert.equal(upgraded.session.id,guest); assert.equal(upgraded.session.profileComplete,true);
  assert.equal(upgraded.session.balance,345); assert.equal(upgraded.session.onlineXp,30);
  assert.equal(upgraded.session.email,'legacy@example.test'); assert.equal(upgraded.recoveryIssued,true);
  await db.query("update jhk_private.sessions set expires_at=now()-interval '1 minute' where id=$1",[guest]);
  assert.equal((await query(oldHash,'profile')).error.code,'SESSION_EXPIRED');
  assert.equal((await query(h('cross-game-token'),'recover',{_recoveryHash:h('hisaab:recovery:'+recoveryCode)})).error.code,'BAD_RECOVERY');
  const restored=await query(h('new-token'),'recover',{_recoveryHash:recoveryHash});
  assert.equal(restored.session.id,guest); assert.equal(restored.session.balance,345); assert.equal(restored.session.onlineXp,30);
  assert.equal((await query(oldHash,'profile')).error.code,'UNAUTHORIZED');
  assert.equal((await query(h('new-token'),'rotateRecovery',{_recoveryHash:await hashRecovery('d'.repeat(64))})).ok,true);
  assert.equal((await query(h('third-token'),'recover',{_recoveryHash:recoveryHash})).error.code,'BAD_RECOVERY');
  assert.equal((await query(h('new-token'),'deleteSession')).deleted,true);
  assert.equal((await query(h('fourth-token'),'recover',{_recoveryHash:await hashRecovery('d'.repeat(64))})).error.code,'BAD_RECOVERY');
  const deleted=(await db.query('select email,recovery_hash,adult_confirmed,preferences from jhk_private.sessions where id=$1',[guest])).rows[0];
  assert.deepEqual(deleted,{email:null,recovery_hash:null,adult_confirmed:false,preferences:{}});
 } finally {await db.close()}
});


test('email-free human guest keeps consent and validates optional contact data',()=>{
 const guest={action:'session',nickname:'Cricket fan',adultConfirmed:true,termsVersion:'beta-1'};
 assert.equal(validateInput(guest).payload.email,undefined);
 assert.equal(validateInput({...guest,email:'  '}).payload.email,null);
 assert.equal(validateInput({...guest,email:null}).payload.email,null);
 assert.equal(validateInput({...guest,email:'Fan@Example.test'}).payload.email,'fan@example.test');
 for (const email of ['bad',123,{},'@example.test']) assert.throws(()=>validateInput({...guest,email}),{code:'BAD_EMAIL'});
 assert.throws(()=>validateInput({...guest,adultConfirmed:false}),{code:'AGE_CONFIRMATION_REQUIRED'});
 assert.throws(()=>validateInput({...guest,adultConfirmed:undefined}),{code:'PROFILE_REQUIRED'});
 assert.throws(()=>validateInput({...guest,termsVersion:'old'}),{code:'TERMS_REQUIRED'});
});

test('SQL no-email guest can queue, preserve identity after email removal, and recover', {skip:!enabled},async()=>{
 const {PGlite}=await import(pathToFileURL(process.env.PGLITE_MODULE_PATH).href);
 const db=new PGlite();
 try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(fs.readFileSync(new URL('../supabase/jhk/schema.sql',import.meta.url),'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/jhk/seed-bank.sql',import.meta.url),'utf8'));
  const query=async(tokenHash,action,payload={})=>(await db.query('select public.jhk_command($1,$2,$3::jsonb,$4) as result',[tokenHash,action,JSON.stringify(payload),'guest-network'])).rows[0].result;
  const guestHash=h('email-free'), recoveryHash=await hashRecovery('e'.repeat(64));
  const created=await query(guestHash,'session',{nickname:'Cricket fan',adultConfirmed:true,termsVersion:'beta-1',_recoveryHash:recoveryHash});
  assert.equal(created.ok,true); assert.equal(created.session.email,null); assert.equal(created.session.profileComplete,true);
  const id=created.session.id;
  const queued=await query(guestHash,'queue',{mode:'ranked',file:'cricket',stake:0});
  assert.equal(queued.ok,true); assert.equal(queued.match.phase,'waiting');
  assert.equal((await query(guestHash,'leave',{roomId:queued.match.id})).ok,true);
  const withEmail=await query(guestHash,'profile',{email:'fan@example.test'});
  assert.equal(withEmail.session.id,id); assert.equal(withEmail.session.email,'fan@example.test');
  const cleared=await query(guestHash,'profile',{email:null});
  assert.equal(cleared.session.id,id); assert.equal(cleared.session.email,null); assert.equal(cleared.session.profileComplete,true);
  const recovered=await query(h('restored-email-free'),'recover',{_recoveryHash:recoveryHash});
  assert.equal(recovered.session.id,id); assert.equal(recovered.session.email,null);
  assert.equal((await query(guestHash,'profile')).error.code,'UNAUTHORIZED');
 } finally {await db.close()}
});
