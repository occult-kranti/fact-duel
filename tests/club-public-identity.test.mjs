import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
const enabled=!!process.env.PGLITE_MODULE_PATH;
const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const migration=read('supabase/jhk/migrations/20261030040000_jhk_public_club_identity.sql');
const identityKeys=['teamTag','teamName','teamPalette','teamSize'];
const withoutIdentity=value=>{
 if(Array.isArray(value))return value.map(withoutIdentity);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!identityKeys.includes(key)).map(([key,item])=>[key,withoutIdentity(item)]));return value;
};

test('public club identity migration preserves authoritative projections and reveals only current display identity', {skip:!enabled},async()=>{
 const {PGlite}=await import(pathToFileURL(process.env.PGLITE_MODULE_PATH).href);const db=new PGlite();
 try {
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  for(const file of ['supabase/jhk/schema.sql','supabase/jhk/seed-bank.sql','supabase/jhk/migrations/20261030003000_jhk_teams.sql','supabase/jhk/migrations/20261030020000_jhk_club_wars.sql'])await db.exec(read(file));
  const command=async(token,action,payload={})=>{
   await db.exec('set role service_role');try {const r=(await db.query('select public.jhk_command($1,$2,$3::jsonb,$4) r',[token,action,JSON.stringify(payload),token])).rows[0].r;assert.equal(r.ok,true,JSON.stringify(r));return r;}finally{await db.exec('reset role');}
  };
  const player=async nickname=>{const token=randomBytes(32).toString('hex'),recovery=randomBytes(32).toString('hex');const r=await command(token,'session',{nickname,adultConfirmed:true,termsVersion:'beta-1',_recoveryHash:recovery});return {token,id:r.session.id,recovery};};
  const host=await player('Rani'),opponent=await player('Asha'),guests=[];for(let i=0;i<3;i++)guests.push(await player(`Guest ${i}`));
  let r=await command(opponent.token,'team',{op:'create',name:'Indigo Club',capacity:5,palette:'blue'});const club=r.team;
  r=await command(host.token,'create',{format:'full',file:'cricket'});const room=r.match.id;await command(opponent.token,'join',{code:r.match.code});await command(host.token,'ready',{roomId:room});await command(opponent.token,'ready',{roomId:room});
  const now=new Date().toISOString();await db.query("update jhk_private.rooms set starts_at=$2::timestamptz-interval '1 second',deadline_at=$2::timestamptz+interval '29 seconds' where id=$1",[room,now]);
  await db.query("update jhk_private.members set last_reaction=jsonb_build_object('id','banter-one','playerId',session_id,'sticker','well-played','at',jhk_private.ms($2::timestamptz),'round',1) where room_id=$1 and session_id=$3",[room,now,opponent.id]);
  const rooms=[];for(const other of guests){const rid=randomUUID();rooms.push(rid);await db.query("insert into jhk_private.rooms(id,mode,phase,deck,round_count) values($1,'ranked','finished','[]',6)",[rid]);await db.query("insert into jhk_private.results(room_id,session_id,opponent_id,mode,completed_at,points,correct,elapsed_ms) values($1,$2,$3,'ranked',$4,3,6,4000)",[rid,opponent.id,other.id,now]);}
  await db.query("insert into jhk_private.reward_claims(session_id,file,day,room_id,amount) values($1,'cricket',$2::timestamptz::date,$3,10)",[opponent.id,now,rooms[0]]);
  const snapshot=async()=> (await db.query('select jhk_private.snapshot($1,$2,$3) r',[room,host.id,now])).rows[0].r;
  const board=async()=> (await db.query("select jhk_private.board($1,'weekly',$2) r",[opponent.id,now])).rows[0].r;
  const savings=async()=> (await db.query('select jhk_private.savings_board($1,$2) r',[opponent.id,now])).rows[0].r;
  const profile=async()=> (await db.query('select jhk_private.profile_json(s,$2) r from jhk_private.sessions s where id=$1',[opponent.id,now])).rows[0].r;
  const sources=async()=>Object.fromEntries((await db.query("select proname,prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='jhk_private' and proname in('snapshot','board','savings_board','profile_json')")).rows.map(row=>[row.proname,row.prosrc]));
  const before={snapshot:await snapshot(),board:await board(),savings:await savings(),profile:await profile()},oldSources=await sources();
  await db.exec(migration);await db.exec(migration);const after={snapshot:await snapshot(),board:await board(),savings:await savings(),profile:await profile()},newSources=await sources();
  // The exact pre-migration SQL bodies survive: only the display-only concatenation is added.
  for(const [name,id] of [['snapshot','s.id'],['board','session_id'],['savings_board','id']])assert.equal(newSources[name].replace(`||jhk_private.public_club_identity(${id})`,''),oldSources[name],`${name} has no timing/scoring/reaction/rotation edits`);
  const compact=value=>value.replace(/\s+/g,' ').trim();assert.equal(compact(newSources.profile_json.split('||jhk_private.public_club_identity')[0]),compact(oldSources.profile_json.split('||coalesce((select')[0]));
  assert.deepEqual(withoutIdentity(after),withoutIdentity(before),'questions, timers, XP, economics, reactions, scores and leaderboard calculations unchanged');
  assert.equal(after.snapshot.roundCount,6);assert.equal(after.snapshot.reactionsEnabled,true);assert.equal(after.snapshot.reactions.length,1);assert.equal(after.snapshot.question.correctIndex,undefined);assert.ok(after.snapshot.question.options.length===4);
  const opponentDto=after.snapshot.players.find(p=>p.id===opponent.id);assert.equal(opponentDto.nickname,'Asha');assert.equal(opponentDto.teamTag,club.tag);assert.equal(opponentDto.teamPalette,'blue');assert.equal(after.snapshot.players.find(p=>p.id===host.id).teamTag,null);
  assert.equal(after.board.rows[0].teamTag,club.tag);assert.equal(after.board.self.teamTag,club.tag);assert.equal(after.savings.self.teamTag,club.tag);assert.equal(after.profile.teamPalette,'blue');
  const publicIdentity=(await db.query('select jhk_private.public_club_identity($1) r',[opponent.id])).rows[0].r;assert.deepEqual(Object.keys(publicIdentity).sort(),identityKeys.sort());assert.ok(!JSON.stringify(after).includes(club.inviteCode));
  // Live membership, not frozen room nickname or a cached badge, controls a displayed tag.
  await command(opponent.token,'team',{op:'leave'});assert.equal((await snapshot()).players.find(p=>p.id===opponent.id).teamTag,null);assert.equal((await board()).self.teamTag,null);assert.equal((await savings()).self.teamTag,null);
  r=await command(opponent.token,'team',{op:'create',name:'Berry Club',capacity:11,palette:'berry'});assert.notEqual(r.team.tag,club.tag);const newTag=r.team.tag;
  assert.equal((await snapshot()).players.find(p=>p.id===opponent.id).teamTag,newTag);assert.equal((await board()).self.teamPalette,'berry');
  const recovered=await command(randomBytes(32).toString('hex'),'recover',{_recoveryHash:opponent.recovery});assert.equal(recovered.session.teamTag,newTag);assert.equal(recovered.session.teamPalette,'berry');assert.equal(recovered.session.nickname,'Asha');
  await db.query('update jhk_private.teams set archived_at=now() where id=$1',[r.team.id]);assert.equal((await snapshot()).players.find(p=>p.id===opponent.id).teamTag,null);
  for(const role of ['anon','authenticated']) {
   assert.equal((await db.query("select has_schema_privilege($1,'jhk_private','USAGE') allowed",[role])).rows[0].allowed,false);
   assert.equal((await db.query("select has_function_privilege($1,'jhk_private.public_club_identity(uuid)','EXECUTE') allowed",[role])).rows[0].allowed,false);
   assert.equal((await db.query("select has_function_privilege($1,'public.jhk_command(text,text,jsonb,text)','EXECUTE') allowed",[role])).rows[0].allowed,false);
  }
 }finally{await db.close();}
});
