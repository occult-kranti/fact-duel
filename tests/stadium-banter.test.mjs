import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import { BANTER_STORAGE_KEY, STADIUM_STICKERS, createBanterGate, visibleBanter, readBanterMute, writeBanterMute } from '../lib/stadium-banter.mjs';
import { validateInput } from '../supabase/jhk/functions/jhk-game/core.mjs';
import { createOnlineClient } from '../lib/jhk-online/client.mjs';

test('fixed sticker gate locks synchronous double taps, cooldown and the whole break', () => {
 const gate=createBanterGate();
 assert.equal(gate.take('invented','round1',10000),false);
 assert.equal(gate.take('nice-shot','round1',10000),true);
 assert.equal(gate.take('all-talk','round1',10000),false);
 assert.equal(gate.take('all-talk','round1',999999),false);
 assert.equal(gate.take('all-talk','round2',17999),false);
 assert.equal(gate.take('all-talk','round2',18000),true);
 assert.equal(gate.take('all-talk','round3',NaN),false);
});
test('banter projection discards invalid/stale events and stays bounded', () => {
 const row={id:'a',playerId:'player',sticker:'nice-shot',at:20000};
 assert.equal(visibleBanter([row],20000).length,1);
 assert.equal(visibleBanter([row],32001).length,0);
 assert.equal(visibleBanter([{...row,sticker:'<script>'}],20000).length,0);
 assert.equal(visibleBanter([{...row,at:22000}],20000).length,0);
 assert.equal(visibleBanter([row,row,row],20000).length,2);
});
test('mute persists when available and survives denied storage', () => {
 const data=new Map(); const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 writeBanterMute(storage,true); assert.equal(readBanterMute(storage),true); assert.equal(data.get(BANTER_STORAGE_KEY),'true');
 const denied={getItem(){throw new Error('denied')},setItem(){throw new Error('denied')}};
 assert.equal(readBanterMute(denied),false); assert.doesNotThrow(()=>writeBanterMute(denied,true));
});
test('Edge validates only fixed stickers with valid room and request IDs', () => {
 const roomId=crypto.randomUUID(),requestId=crypto.randomUUID();
 for(const sticker of STADIUM_STICKERS) assert.equal(validateInput({action:'reaction',roomId,requestId,sticker:sticker.id}).payload.sticker,sticker.id);
 assert.throws(()=>validateInput({action:'reaction',roomId,requestId,sticker:'user text'}),{code:'BAD_STICKER'});
 assert.throws(()=>validateInput({action:'reaction',requestId,sticker:'nice-shot'}),{code:'BAD_ROOM'});
 assert.throws(()=>validateInput({action:'reaction',roomId,sticker:'nice-shot'}),{code:'BAD_STICKER'});
 assert.deepEqual(validateInput({action:'presence'}),{action:'presence',payload:{}});
});
test('presence transport creates no identity and sends no bearer',async()=>{
 let calls=0,writes=0;
 const client=createOnlineClient({url:'https://game.example.test/game',storage:{getItem:()=>null,setItem(){writes++}},fetcher:async(_url,init)=>{calls++;assert.equal(init.headers['x-jhk-session'],undefined);assert.deepEqual(JSON.parse(init.body),{action:'presence'});return {ok:true,json:async()=>({ok:true,serverNow:1000,presence:{activeHumans:0,windowSeconds:120,expiresAt:31000}})}}});
 assert.equal((await client.request('presence')).presence.activeHumans,0); assert.equal(client.session,null);assert.equal(writes,0);assert.equal(calls,1);assert.ok(client.now()>100000,'cached aggregate must not calibrate the competitive clock');
});

test('database banter is member-only, idempotent, bounded, phase-gated and rate limited; presence is anonymous read only', {skip:!process.env.PGLITE_MODULE_PATH},async()=>{
 const {PGlite}=await import(pathToFileURL(process.env.PGLITE_MODULE_PATH).href); const db=new PGlite();
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  const schema=fs.readFileSync(new URL('../supabase/jhk/schema.sql',import.meta.url),'utf8');
  await db.exec(schema);
  // Additive migration can be applied twice, preserving active rows.
  const migration=fs.readFileSync(new URL('../supabase/jhk/migrations/20261029_stadium_banter_presence.sql',import.meta.url),'utf8');
  const query=async(hash,action,payload={})=>(await db.query('select public.jhk_command($1,$2,$3::jsonb,$4) response',[hash,action,JSON.stringify(payload),'qa-banter'])).rows[0].response;
  const tokens=['a'.repeat(64),'b'.repeat(64),'c'.repeat(64)];
  const sessions=[];
  for(let i=0;i<3;i++) sessions.push((await query(tokens[i],'session',{nickname:`Banter ${i}`,adultConfirmed:true,termsVersion:'beta-1',_recoveryHash:String(i+1).repeat(64)})).session.id);
  const roomId=crypto.randomUUID();
  await db.query("insert into jhk_private.rooms(id,mode,deck) values($1,'private','[]'::jsonb)",[roomId]);
  for(const id of sessions.slice(0,2))await db.query('insert into jhk_private.members(room_id,session_id) values($1,$2)',[roomId,id]);
  await db.exec(migration);await db.exec(migration);
  const requestId=crypto.randomUUID(); const payload={roomId,requestId,sticker:'nice-shot'};
  assert.equal((await query(tokens[2],'reaction',payload)).error.code,'FORBIDDEN');
  assert.equal((await query(tokens[0],'reaction',{...payload,sticker:'custom'})).error.code,'BAD_STICKER');
  const first=await query(tokens[0],'reaction',payload); assert.equal(first.ok,true);assert.equal(first.match.reactionsEnabled,true);assert.equal(first.match.reactions.length,1);
  const other=await query(tokens[1],'snapshot',{roomId});assert.equal(other.match.reactions[0].playerId,sessions[0]);assert.equal(other.match.reactions[0].sticker,'nice-shot');
  const duplicate=await query(tokens[0],'reaction',payload);assert.deepEqual(duplicate.match.reactions,first.match.reactions);
  assert.equal((await query(tokens[0],'reaction',{...payload,requestId:crypto.randomUUID()})).error.code,'BANTER_COOLDOWN');
  await db.query("update jhk_private.rooms set phase='question',round=1,starts_at=now()-interval '1 second',deadline_at=now()+interval '30 seconds' where id=$1",[roomId]);
  assert.equal((await query(tokens[1],'reaction',{...payload,requestId:crypto.randomUUID()})).error.code,'BANTER_CLOSED');
  await db.query("update jhk_private.rooms set phase='result',next_at=now()+interval '30 seconds' where id=$1",[roomId]);
  assert.equal((await query(tokens[0],'reaction',{...payload,requestId:crypto.randomUUID()})).error.code,'BANTER_COOLDOWN');
  await db.query("update jhk_private.members set last_reaction=jsonb_set(last_reaction,'{at}',to_jsonb(jhk_private.ms(now())-9000)) where room_id=$1 and session_id=$2",[roomId,sessions[0]]);
  assert.equal((await query(tokens[0],'reaction',{...payload,requestId:crypto.randomUUID(),sticker:'all-talk'})).ok,true);
  assert.equal((await db.query('select count(*)::int n from jhk_private.members where room_id=$1 and last_reaction is not null',[roomId])).rows[0].n,1);
  await db.query("update jhk_private.sessions set last_seen=now()-interval '3 minutes' where id=$1",[sessions[2]]);
  const before=await db.query('select id,last_seen,rate_count from jhk_private.sessions order by id');
  const presence=await query(null,'presence');assert.equal(presence.ok,true);assert.equal(presence.presence.activeHumans,2);assert.equal(presence.presence.windowSeconds,120);assert.equal(presence.session,undefined);
  assert.deepEqual((await db.query('select id,last_seen,rate_count from jhk_private.sessions order by id')).rows,before.rows);
  await db.query("update jhk_private.members set last_reaction=jsonb_set(last_reaction,'{at}',to_jsonb(jhk_private.ms(now())-13000)) where room_id=$1",[roomId]);
  assert.equal((await query(tokens[1],'snapshot',{roomId})).match.reactions.length,0);
 }finally{await db.close()}
});
