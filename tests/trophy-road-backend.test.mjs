import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const migration=read('supabase/jhk/migrations/20261029222841_jhk_trophy_road_rotation.sql');

test('human rotation, actual exposures, upgrade idempotence, private projection and earned trophies',async()=>{
 const db=new PGlite();
 try {
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  await db.exec(read('supabase/jhk/schema.sql'));
  const call=async(hash,action,payload={})=>(await db.query('select public.jhk_command($1,$2,$3::jsonb,$4) response',[hash,action,JSON.stringify(payload),'road-qa'])).rows[0].response;
  const hashes=['a','b','c'].map(x=>x.repeat(64));const players=[];
  for(let i=0;i<3;i++) players.push((await call(hashes[i],'session',{nickname:`Road ${i}`,adultConfirmed:true,termsVersion:'beta-1',_recoveryHash:String(i+1).repeat(64)})).session.id);
  const pool=Array.from({length:12},(_,i)=>({id:`qa${i}`,familyKey:`family${i}`,prompt:{en:`Card ${i}`},options:['correct','b','c','d'].map(en=>({en})),correctIndex:0,explanation:{en:'why'},sourceUrl:'https://example.test',files:['cricket']}));
  for(const q of [...pool,{...pool[0],id:'qa-alias'}]) await db.query('insert into jhk_private.questions values($1,$2::jsonb)',[q.id,JSON.stringify(q)]);
  await db.query("insert into jhk_private.question_seen values($1,'family0',now()),($2,'family1',now())",players.slice(0,2));
  let deck=(await db.query("select jhk_private.make_rotated_deck('cricket',$1::uuid[],now()) deck",[players.slice(0,2)])).rows[0].deck;
  assert.equal(deck.length,5);assert.equal(new Set(deck.map(q=>q.familyKey)).size,5);
  assert.ok(deck.every(q=>!['family0','family1'].includes(q.familyKey)));
  assert.ok(deck.every(q=>q.options[q.correctIndex].en==='correct'));
  // Exhaustion falls back to oldest latest exposure; a rival's recent view wins over an old host view.
  await db.query('delete from jhk_private.question_seen');
  for(let i=0;i<12;i++) await db.query('insert into jhk_private.question_seen values($1,$2,to_timestamp($3))',[players[0],`family${i}`,1000+i]);
  await db.query("insert into jhk_private.question_seen values($1,'family0',to_timestamp(9000))",[players[1]]);
  deck=(await db.query("select jhk_private.make_rotated_deck('cricket',$1::uuid[],now()) deck",[players.slice(0,2)])).rows[0].deck;
  assert.deepEqual(deck.map(q=>q.familyKey),['family1','family2','family3','family4','family5']);
  await db.query('delete from jhk_private.question_seen');
  await db.query("insert into jhk_private.question_seen values($1,'family0',now()),($2,'family1',now())",players.slice(0,2));
  const room=crypto.randomUUID();
  await db.query("insert into jhk_private.rooms(id,mode,file,deck) values($1,'private','cricket',$2::jsonb)",[room,JSON.stringify(pool.slice(0,5))]);
  for(const p of players.slice(0,2)) await db.query('insert into jhk_private.members(room_id,session_id) values($1,$2)',[room,p]);
  await call(hashes[0],'ready',{roomId:room,stake:0});
  const start=await call(hashes[1],'ready',{roomId:room,stake:0});assert.equal(start.match.phase,'countdown');assert.equal(start.match.question,null);
  deck=(await db.query('select deck from jhk_private.rooms where id=$1',[room])).rows[0].deck;
  assert.ok(deck.every(q=>!['family0','family1'].includes(q.familyKey)),'final selection includes both histories');
  await db.query("update jhk_private.rooms set starts_at=now()-interval '1 second',deadline_at=now()+interval '30 seconds' where id=$1",[room]);
  const shown=await call(hashes[0],'snapshot',{roomId:room});
  assert.equal(shown.match.question.correctIndex,undefined);assert.equal(shown.match.question.explanation,undefined);assert.equal(shown.match.question.sourceUrl,undefined);
  assert.equal((await call(hashes[2],'snapshot',{roomId:room})).error.code,'FORBIDDEN');
  const exposure=(await db.query('select * from jhk_private.question_seen where session_id=$1 and family_key=$2',[players[0],deck[0].familyKey])).rows[0];
  assert.ok(exposure);
  await Promise.all([call(hashes[0],'snapshot',{roomId:room}),call(hashes[0],'snapshot',{roomId:room})]);
  assert.deepEqual((await db.query('select * from jhk_private.question_seen where session_id=$1 and family_key=$2',[players[0],deck[0].familyKey])).rows[0],exposure,'retry polls do not refresh recency');
  const before=(await db.query('select deck,phase,round from jhk_private.rooms where id=$1',[room])).rows[0];
  await db.query('delete from jhk_private.question_seen where session_id=$1 and family_key=$2',[players[0],deck[0].familyKey]);
  await db.exec(migration);await db.exec(migration);
  assert.deepEqual((await db.query('select deck,phase,round from jhk_private.rooms where id=$1',[room])).rows[0],before);
  assert.ok((await db.query('select 1 from jhk_private.question_seen where session_id=$1 and family_key=$2',[players[0],deck[0].familyKey])).rows.length,'existing releases backfilled');
  assert.equal((await db.query("select count(*)::int n from jhk_private.question_seen where session_id=$1 and family_key not in ('family0',$2)",[players[0],deck[0].familyKey])).rows[0].n,0,'future deck cards are not exposed');
  assert.equal((await call(hashes[0],'profile',{trophies:999999,humanRoad:{trophies:999999}})).session.humanRoad.trophies,0);
  await call(hashes[0],'leave',{roomId:room});
  async function completed(mode='ranked', answers=5) {
   const id=crypto.randomUUID();
   await db.query("insert into jhk_private.rooms(id,mode,phase,round,starts_at,deadline_at,deck) values($1,$2,'question',5,now()-interval '31 seconds',now()-interval '1 second',$3::jsonb)",[id,mode,JSON.stringify(pool.slice(0,5))]);
   for(const p of players.slice(0,2)) {
    await db.query('insert into jhk_private.members(room_id,session_id) values($1,$2)',[id,p]);
    for(let round=1;round<=answers;round++) await db.query('insert into jhk_private.answers values($1,$2,$3,$4,0,true,1000,30,now())',[id,round,p,crypto.randomUUID()]);
   }
   await db.query('select jhk_private.settle($1,now())',[id]);await db.query('select jhk_private.settle($1,now())',[id]);return id;
  }
  await completed('private');await completed('ranked',2);
  assert.equal((await call(hashes[0],'profile')).session.humanRoad.trophies,0,'private and low-participation matches do not earn human trophies');
  for(let n=1;n<=6;n++) {
   await completed();const road=(await call(hashes[0],'profile')).session.humanRoad;
   assert.equal(road.trophies,n*30);assert.equal(road.answeredRounds,n*5);assert.equal(road.correctAnswers,n*5);assert.equal(road.eligibleMatches,n);
   assert.equal(road.stadiumId,n>=6?'crown':n>=2?'riverside':'gully');
  }
  const exported=await call(hashes[0],'exportProfile');assert.ok(exported.questionHistory[deck[0].familyKey]);assert.equal(exported.questionHistory.family1,undefined);
  assert.equal((await call(hashes[2],'profile')).session.humanRoad.trophies,0);
  const secured=(await db.query("select relrowsecurity from pg_class where oid='jhk_private.question_seen'::regclass")).rows[0];assert.equal(secured.relrowsecurity,true);
  for(const role of ['anon','authenticated']) {
   assert.equal((await db.query("select has_table_privilege($1,'jhk_private.question_seen','select') allowed",[role])).rows[0].allowed,false);
   assert.equal((await db.query("select has_function_privilege($1,'jhk_private.human_road(uuid)','execute') allowed",[role])).rows[0].allowed,false);
  }
  await call(hashes[0],'deleteSession');await db.exec(migration);
  assert.equal((await db.query('select count(*)::int n from jhk_private.question_seen where session_id=$1',[players[0]])).rows[0].n,0,'upgrade never resurrects deleted history');
  const delta=read('supabase/jhk/migrations/20261029223049_jhk_cricket_expansion.sql');
  const oldPayload=(await db.query("select payload from jhk_private.questions where id='qa1'")).rows[0].payload;
  await db.exec(delta);await db.exec(delta);
  assert.equal((await db.query("select count(*)::int n from jhk_private.questions where id between 'cr624' and 'cr671'")).rows[0].n,48);
  assert.equal((await db.query('select count(*)::int n from jhk_private.questions')).rows[0].n,61);
  assert.deepEqual((await db.query("select payload from jhk_private.questions where id='qa1'")).rows[0].payload,oldPayload);

 } finally { await db.close(); }
});
