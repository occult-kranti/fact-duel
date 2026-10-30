import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';

// Execute the actual Postgres command boundary, not an in-memory copy of team rules.
// CI supplies PGLITE_MODULE_PATH; local runs without the database dependency report a skip.
const databaseEnabled = !!process.env.PGLITE_MODULE_PATH;
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
let databasePromise;
let database;
async function getDatabase() {
  if (!databasePromise) databasePromise = (async () => {
    const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE_PATH).href);
    database = new PGlite();
    await database.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await database.exec(read('supabase/jhk/schema.sql'));
    await database.exec(read('supabase/jhk/seed-bank.sql'));
    await database.exec(read('supabase/jhk/migrations/20261030003000_jhk_teams.sql'));
    await database.exec(read('supabase/jhk/migrations/20261030003000_jhk_teams.sql'));
    await database.exec(read('supabase/jhk/migrations/20261030020000_jhk_club_wars.sql'));
    await database.exec(read('supabase/jhk/migrations/20261030020000_jhk_club_wars.sql'));
    return database;
  })();
  return databasePromise;
}

async function transaction(run) {
  const db = await getDatabase();
  await db.exec('begin');
  try { await run(db); }
  finally { await db.exec('rollback'); }
}
async function command(db, token, action, payload = {}) {
  await db.exec('set local role service_role');
  try {
    const result = await db.query('select public.jhk_command($1,$2,$3::jsonb,$4) as response', [token, action, JSON.stringify(payload), `team-test-${token}`]);
    return result.rows[0].response;
  } finally { await db.exec('reset role'); }
}
async function ok(db, token, action, payload = {}) {
  const response = await command(db, token, action, payload);
  assert.equal(response.ok, true, JSON.stringify(response));
  return response;
}
async function player(db, nickname = 'Team player') {
  const token = randomBytes(32).toString('hex');
  const response = await ok(db, token, 'session', { nickname, adultConfirmed: true, termsVersion: 'beta-1', _recoveryHash: randomBytes(32).toString('hex') });
  return { token, id: response.session.id };
}

const team = (db, self, op, payload = {}) => ok(db, self.token, 'team', { op, ...payload });
async function createTeam(db, { capacity = 5, name = 'Gully Stars' } = {}) {
  const captain = await player(db, `${name.slice(0, 15)} captain`);
  const response = await team(db, captain, 'create', { name, capacity, emblem: 'bat', palette: 'teal' });
  assert.ok(response.team?.id, JSON.stringify(response));
  return { captain, members: [captain], team: response.team };
}
async function fillTeam(db, group, count = group.team.capacity) {
  while (group.members.length < count) {
    const member = await player(db, `Member ${group.members.length + 1}`);
    const response = await team(db, member, 'join', { code: group.team.inviteCode });
    group.team = response.team;
    group.members.push(member);
  }
  return group;
}
function rejected(response) {
  assert.equal(response.ok, false, JSON.stringify(response));
  assert.equal(typeof response.error?.code, 'string');
}
function fixtureFrom(response, id) {
  const fixture = response.fixtures.find(item => !id || item.id === id);
  assert.ok(fixture, JSON.stringify(response));
  return fixture;
}
async function fixturePair(db, format = 'mini', capacity = 5) {
  const home = await fillTeam(db, await createTeam(db, { name: 'Home Stars', capacity }));
  const away = await fillTeam(db, await createTeam(db, { name: 'Away Stars', capacity }));
  const challenge = await team(db, home.captain, 'challenge', { targetTag: away.team.tag, format });
  const pending = fixtureFrom(challenge);
  const accepted = await team(db, away.captain, 'accept', { fixtureId: pending.id });
  return { home, away, fixture: fixtureFrom(accepted, pending.id) };
}
async function finishRun(db, self, fixtureId, { correct = true, checkLocks = false } = {}) {
  let response = await team(db, self, 'play', { fixtureId });
  let run = response.run;
  assert.ok(run?.question, JSON.stringify(response));
  assert.equal(Object.hasOwn(run.question, 'correctIndex'), false);
  assert.equal(Object.hasOwn(run.question, 'explanation'), false);
  assert.equal(Object.hasOwn(run.question, 'sourceUrl'), false);
  const fixture = fixtureFrom(response, fixtureId);
  let previousRequestId;
  for (let round = 1; round <= fixture.roundCount; round += 1) {
    assert.equal(run.round, round);
    const result = await db.query("select (deck->($2::int-1)->>'correctIndex')::int answer from jhk_private.team_fixtures where id=$1", [fixtureId, round]);
    const answer = result.rows[0].answer;
    await db.query("update jhk_private.team_runs set issued_at=clock_timestamp()-interval '1 second',deadline_at=clock_timestamp()+interval '29 seconds' where fixture_id=$1 and session_id=$2", [fixtureId, self.id]);
    const requestId = randomUUID();
    const choice = correct ? answer : (answer + 1) % 4;
    if (checkLocks && previousRequestId) {
      const reused = await command(db, self.token, 'team', { op: 'answer', fixtureId, round, choice, requestId: previousRequestId });
      rejected(reused);
      assert.equal(reused.error.code, 'REQUEST_REUSED');
    }
    previousRequestId = requestId;
    response = await team(db, self, 'answer', { fixtureId, round, choice, requestId });
    assert.equal(response.run.receipt.correct, correct);
    if (checkLocks) {
      const repeated = await team(db, self, 'answer', { fixtureId, round, choice, requestId });
      assert.deepEqual(repeated.run.receipt, response.run.receipt);
      const changed = await team(db, self, 'answer', { fixtureId, round, choice: (choice + 1) % 4, requestId: randomUUID() });
      assert.deepEqual(changed.run.receipt, response.run.receipt, 'first answer remains locked');
    }
    run = response.run;
    if (round < fixture.roundCount) {
      // The first Mini continuation uses the real server clock: no artificial result delay.
      if (!(fixture.roundCount === 3 && round === 1)) {
        await db.query("update jhk_private.team_runs set next_at=clock_timestamp()-interval '1 second' where fixture_id=$1 and session_id=$2", [fixtureId, self.id]);
      }
      response = await team(db, self, 'next', { fixtureId });
      run = response.run;
    }
  }
  assert.equal(run.phase, 'finished');
  assert.equal(run.correct, correct ? fixture.roundCount : 0);
  return response;
}

async function at(db, self, op, payload, now) {
  await db.exec('set local role service_role');
  try { return (await db.query('select jhk_private.team_command($1,$2::jsonb,$3::timestamptz) response', [self.id, JSON.stringify({op,...payload}),now])).rows[0].response; }
  finally { await db.exec('reset role'); }
}
async function atOk(db,self,op,payload,now) { const r=await at(db,self,op,payload,now);assert.equal(r.ok,true,JSON.stringify(r));return r; }
const row=async(db,id)=>(await db.query('select * from jhk_private.team_fixtures where id=$1',[id])).rows[0];
const advance=async(db,id,hours)=>{ const f=await row(db,id);return new Date(new Date(f.accepted_at).getTime()+hours*3600000).toISOString(); };
async function battle(db,pair) {
  await team(db,pair.home.captain,'readyLineup',{fixtureId:pair.fixture.id,ready:true});
  const r=await team(db,pair.away.captain,'readyLineup',{fixtureId:pair.fixture.id,ready:true});
  pair.fixture=fixtureFrom(r,pair.fixture.id);return pair;
}
async function cup4(db) {
 const groups=[]; for(let i=0;i<4;i++)groups.push(await fillTeam(db,await createTeam(db,{name:`Club ${i}`})));
 let r=await team(db,groups[0].captain,'tournamentCreate',{name:'Pavilion Cup',format:'mini'});
 let c=r.tournaments[0]; for(let i=1;i<4;i++)await team(db,groups[i].captain,'tournamentJoin',{code:c.code});
 r=await team(db,groups[0].captain,'tournamentStart',{tournamentId:c.id});return {groups,cup:r.tournaments[0],fixtures:r.fixtures};
}

test.after(async()=>{if(database)await database.close();});

test('club migration is repeatable and preserves private service authority', {skip:!databaseEnabled},async()=>transaction(async db=>{
 for(const role of ['anon','authenticated']) {
  assert.equal((await db.query("select has_schema_privilege($1,'jhk_private','USAGE') allowed",[role])).rows[0].allowed,false);
  assert.equal((await db.query("select has_function_privilege($1,'public.jhk_command(text,text,jsonb,text)','EXECUTE') allowed",[role])).rows[0].allowed,false);
  const f=await db.query("select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='jhk_private' and has_function_privilege($1,p.oid,'EXECUTE')",[role]);assert.deepEqual(f.rows,[]);
  const tables=await db.query("select c.relname,c.relrowsecurity,has_table_privilege($1,c.oid,'SELECT') allowed from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='jhk_private' and c.relkind='r' and (c.relname='teams' or c.relname like 'team_%')",[role]);assert.equal(tables.rows.length,9);assert.ok(tables.rows.every(t=>t.relrowsecurity&&!t.allowed));
 }
 rejected(await command(db,randomBytes(32).toString('hex'),'team',{op:'dashboard'}));
}));

test('22 club slots are distinct from exactly five or eleven selected players', {skip:!databaseEnabled},async()=>transaction(async db=>{
 for(const capacity of [5,11]) {
  const g=await fillTeam(db,await createTeam(db,{capacity,name:`Side ${capacity}`}),22);
  assert.equal(g.team.capacity,capacity);assert.equal(g.team.rosterLimit,22);assert.equal(g.team.selectedCount,capacity);assert.equal(g.team.members.filter(m=>m.isReserve).length,22-capacity);
  const x=await player(db,'Twenty third');const r=await command(db,x.token,'team',{op:'join',code:g.team.inviteCode});assert.equal(r.error.code,'TEAM_FULL');
  const members=g.members.slice(-capacity).map(m=>m.id);const selected=await team(db,g.captain,'selectLineup',{memberIds:members});assert.deepEqual(new Set(selected.team.selectedMemberIds),new Set(members));
  rejected(await command(db,g.captain.token,'team',{op:'selectLineup',memberIds:members.slice(1)}));
  rejected(await command(db,g.captain.token,'team',{op:'selectLineup',memberIds:members.map(()=>members[0])}));
 }
}));

test('captain, one vice captain and one coach have bounded permissions; fun badges require consent', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const g=await fillTeam(db,await createTeam(db),6);const vc=g.members[1],coach=g.members[2],member=g.members[3];
 await team(db,g.captain,'assignRole',{memberId:vc.id,role:'vice-captain'});await team(db,g.captain,'assignRole',{memberId:coach.id,role:'coach'});
 let r=await team(db,vc,'dashboard');assert.deepEqual(r.team.permissions,{manageClub:false,manageLineup:true,arrangeMatches:true});
 r=await team(db,coach,'dashboard');assert.deepEqual(r.team.permissions,{manageClub:false,manageLineup:true,arrangeMatches:false});
 await team(db,coach,'selectLineup',{memberIds:g.members.slice(1).map(m=>m.id)});
 for(const self of [vc,coach,member])for(const op of ['settings','assignRole','transfer','kick'])rejected(await command(db,self.token,'team',{op,name:'No',memberId:member.id,role:'coach'}));
 rejected(await command(db,coach.token,'team',{op:'tournamentCreate',name:'No cup'}));
 await team(db,vc,'tournamentCreate',{name:'Delegated cup'});
 let badge=await command(db,g.captain.token,'team',{op:'assignBadge',memberId:member.id,badge:'bottle-boy'});assert.equal(badge.error.code,'BADGE_CONSENT_REQUIRED');
 await team(db,member,'roleConsent',{consent:true});await team(db,g.captain,'assignBadge',{memberId:member.id,badge:'bottle-boy'});
 r=await team(db,member,'dashboard');assert.equal(r.team.members.find(m=>m.id===member.id).funBadge,'bottle-boy');assert.deepEqual(r.team.permissions,{manageClub:false,manageLineup:false,arrangeMatches:false});
 await team(db,member,'assignBadge',{memberId:member.id,badge:'none'});await team(db,g.captain,'assignBadge',{memberId:member.id,badge:'analyst'});
 r=await team(db,member,'roleConsent',{consent:false});assert.equal(r.team.members.find(m=>m.id===member.id).funBadge,'none');
 await team(db,g.captain,'assignRole',{memberId:member.id,role:'vice-captain'});r=await team(db,vc,'dashboard');assert.equal(r.team.permissions.arrangeMatches,false);assert.equal(r.team.members.filter(m=>m.role==='vice-captain').length,1);
}));

test('new wars prepare 23 hours, substitutions clear both readiness receipts, then lock battle', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const pair=await fixturePair(db);const {home,away}=pair;let f=pair.fixture;assert.equal(f.status,'preparation');assert.equal(f.prepEndsAt-f.acceptedAt,23*3600000);assert.equal(f.deadlineAt-f.prepEndsAt,24*3600000);
 const reserve=await player(db,'Reserve');await team(db,reserve,'join',{code:home.team.inviteCode});
 const before=await command(db,home.captain.token,'team',{op:'play',fixtureId:f.id});assert.equal(before.error.code,'FIXTURE_CLOSED');
 await team(db,home.captain,'readyLineup',{fixtureId:f.id,ready:true});
 let r=await team(db,home.captain,'substitute',{fixtureId:f.id,outMemberId:home.members[4].id,inMemberId:reserve.id});f=fixtureFrom(r,f.id);assert.deepEqual(f.ready,{home:false,away:false});assert.ok(f.lineups.home.some(m=>m.id===reserve.id));
 await team(db,away.captain,'readyLineup',{fixtureId:f.id,ready:true});r=await team(db,home.captain,'fixtureLineup',{fixtureId:f.id,memberIds:[...home.members.slice(0,4).map(m=>m.id),reserve.id]});assert.deepEqual(fixtureFrom(r,f.id).ready,{home:false,away:false});
 await battle(db,pair);assert.equal(pair.fixture.status,'active');assert.equal(pair.fixture.deadlineAt-pair.fixture.battleStartsAt,24*3600000);
 rejected(await command(db,home.captain.token,'team',{op:'substitute',fixtureId:f.id,outMemberId:reserve.id,inMemberId:home.members[4].id}));
 rejected(await command(db,home.captain.token,'team',{op:'selectLineup',memberIds:home.members.map(m=>m.id)}));
 const late=await player(db,'New reserve');r=await team(db,late,'join',{code:home.team.inviteCode});assert.equal(r.team.members.find(m=>m.id===late.id).isReserve,true);
 await team(db,late,'leave');await team(db,home.members[4],'leave');
 rejected(await command(db,reserve.token,'team',{op:'leave'}));
 assert.equal((await db.query('select count(*) n from jhk_private.team_runs where fixture_id=$1',[f.id])).rows[0].n,0);
}));

test('scheduled battle uses the original clock even on late reconciliation', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const pair=await fixturePair(db);const f=pair.fixture;
 const r=await atOk(db,pair.home.captain,'fixture',{fixtureId:f.id},await advance(db,f.id,24));const live=fixtureFrom(r,f.id);assert.equal(live.status,'active');assert.equal(live.battleStartsAt,f.prepEndsAt);assert.equal(live.deadlineAt,f.deadlineAt);
 const expired=await atOk(db,pair.home.captain,'fixture',{fixtureId:f.id},await advance(db,f.id,48));const done=fixtureFrom(expired,f.id);assert.equal(done.status,'finished');assert.equal(done.settlementReason,'no-contest');assert.equal(done.homeScore.completed,0);assert.equal(done.awayScore.completed,0);
 assert.equal((await db.query('select coalesce(sum(points),0) n from jhk_private.team_awards where fixture_id=$1',[f.id])).rows[0].n,0);
}));

test('incomplete preparation cancels a friendly and a whole cup without awards or roster locks', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const pair=await fixturePair(db);await team(db,pair.home.members[4],'leave');
 let r=await atOk(db,pair.home.captain,'fixture',{fixtureId:pair.fixture.id},await advance(db,pair.fixture.id,24));let f=fixtureFrom(r,pair.fixture.id);assert.equal(f.status,'declined');assert.equal(f.settlementReason,'incomplete-lineup');assert.equal((await db.query('select jhk_private.team_locked($1) locked',[pair.home.team.id])).rows[0].locked,false);
 const c=await cup4(db);const own=c.fixtures.find(f=>[f.homeTeam.id,f.awayTeam.id].includes(c.groups[0].team.id));await team(db,c.groups[0].members[4],'leave');
 await atOk(db,c.groups[0].captain,'fixture',{fixtureId:own.id},await advance(db,own.id,24));
 assert.equal((await db.query('select status from jhk_private.team_tournaments where id=$1',[c.cup.id])).rows[0].status,'cancelled');
 const fixtures=(await db.query('select status,settlement_reason from jhk_private.team_fixtures where tournament_id=$1',[c.cup.id])).rows;assert.ok(fixtures.every(f=>f.status==='declined'&&f.settlement_reason==='incomplete-lineup'));
 for(const g of c.groups)assert.equal((await db.query('select jhk_private.team_locked($1) locked',[g.team.id])).rows[0].locked,false);
 assert.equal((await db.query('select count(*) n from jhk_private.team_awards a join jhk_private.team_fixtures f on f.id=a.fixture_id where f.tournament_id=$1',[c.cup.id])).rows[0].n,0);
}));

async function weekly(db) {
 const h=await fillTeam(db,await createTeam(db,{name:'Weekly Home'})),a=await fillTeam(db,await createTeam(db,{name:'Weekly Away'}));
 const c=await team(db,h.captain,'challenge',{targetTag:a.team.tag,recurrence:'weekly'});const f=fixtureFrom(c);const accepted=await team(db,a.captain,'accept',{fixtureId:f.id,recurrence:'weekly'});
 return {home:h,away:a,fixture:fixtureFrom(accepted,f.id)};
}
test('weekly recurrence creates one scheduled draft needing fresh home send and away acceptance', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const p=await weekly(db),id=p.fixture.id;const end=await advance(db,id,48);
 let r=await atOk(db,p.home.captain,'fixture',{fixtureId:id},end);let original=fixtureFrom(r,id);assert.equal(original.recurrence.confirmed,true);const draftId=original.recurrence.nextFixtureId;assert.ok(draftId);
 await atOk(db,p.home.captain,'fixture',{fixtureId:id},end);assert.equal((await db.query('select count(*) n from jhk_private.team_fixtures where previous_fixture_id=$1',[id])).rows[0].n,1);
 let draft=await row(db,draftId);assert.equal(new Date(draft.available_at).getTime(),p.fixture.acceptedAt+7*86400000);assert.equal(draft.draft_sent_at,null);
 let fail=await at(db,p.away.captain,'accept',{fixtureId:draftId,recurrence:'weekly'},end);assert.equal(fail.error.code,'FIXTURE_NOT_AVAILABLE');
 fail=await at(db,p.home.captain,'sendRematch',{fixtureId:draftId},end);assert.equal(fail.error.code,'FIXTURE_NOT_AVAILABLE');
 const scheduled=new Date(draft.available_at).toISOString();fail=await at(db,p.away.captain,'accept',{fixtureId:draftId,recurrence:'weekly'},scheduled);assert.equal(fail.error.code,'REMATCH_NOT_SENT');
 fail=await at(db,p.away.captain,'sendRematch',{fixtureId:draftId},scheduled);assert.equal(fail.error.code,'FORBIDDEN');
 r=await atOk(db,p.home.captain,'sendRematch',{fixtureId:draftId},scheduled);assert.equal(fixtureFrom(r,draftId).recurrence.homeConfirmed,true);assert.equal((await row(db,draftId)).status,'pending');
 r=await atOk(db,p.away.captain,'accept',{fixtureId:draftId,recurrence:'weekly'},scheduled);assert.equal(fixtureFrom(r,draftId).status,'preparation');assert.equal(fixtureFrom(r,draftId).ready.home,false);
 await atOk(db,p.away.captain,'stopRecurrence',{fixtureId:draftId},scheduled);draft=await row(db,draftId);assert.equal(draft.recurrence_stopped,true);assert.equal(draft.recurrence,'none');
}));

test('weekly draft skips missed cycles, can be stopped by either club, and never silently commits deleted lineup', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const p=await weekly(db),id=p.fixture.id;let r=await atOk(db,p.home.captain,'fixture',{fixtureId:id},await advance(db,id,24*23));const draftId=fixtureFrom(r,id).recurrence.nextFixtureId;let draft=await row(db,draftId);assert.equal(new Date(draft.available_at).getTime(),p.fixture.acceptedAt+28*86400000);
 const scheduled=new Date(draft.available_at).toISOString();await atOk(db,p.home.captain,'sendRematch',{fixtureId:draftId},scheduled);
 await atOk(db,p.home.members[4],'leave',{},scheduled);const no=await at(db,p.away.captain,'accept',{fixtureId:draftId},scheduled);assert.equal(no.error.code,'TEAM_ROSTER_REQUIRED');
 await atOk(db,p.away.captain,'stopRecurrence',{fixtureId:draftId},scheduled);assert.equal((await row(db,draftId)).status,'declined');assert.equal((await row(db,draftId)).settlement_reason,'series-stopped');
}));

test('a real prepared battle keeps one contribution per selected player and repeat answers stay locked', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const p=await battle(db,await fixturePair(db,'full'));
 const reserve=await player(db,'Spectator');await team(db,reserve,'join',{code:p.home.team.inviteCode});const no=await command(db,reserve.token,'team',{op:'play',fixtureId:p.fixture.id});assert.equal(no.error.code,'NOT_IN_LINEUP');
 await finishRun(db,p.home.captain,p.fixture.id,{correct:true,checkLocks:true});
 const future=new Date(p.fixture.deadlineAt+1000).toISOString();const r=await atOk(db,p.home.captain,'fixture',{fixtureId:p.fixture.id},future);const f=fixtureFrom(r,p.fixture.id);assert.equal(f.status,'finished');assert.equal(f.settlementReason,'completed');assert.equal(f.homeScore.correct,6);assert.equal(f.homeScore.completed,1);assert.equal(f.winnerTeamId,p.home.team.id);
 assert.equal((await db.query('select count(*) n from jhk_private.team_answers where fixture_id=$1 and session_id=$2',[f.id,p.home.captain.id])).rows[0].n,6);
 assert.equal((await db.query('select points from jhk_private.team_awards where fixture_id=$1 and team_id=$2',[f.id,p.home.team.id])).rows[0].points,40);
}));

test('new cup finals get fresh preparation; legacy finals keep frozen previous rosters and immediate battle', {skip:!databaseEnabled},async()=>transaction(async db=>{
 for(const legacy of [false,true]) {
  const c=await cup4(db);const fs=(await db.query('select * from jhk_private.team_fixtures where tournament_id=$1 order by slot',[c.cup.id])).rows;
  if(legacy)await db.query('update jhk_private.team_fixtures set war_version=0 where tournament_id=$1',[c.cup.id]);
  for(const f of fs) {await db.query("update jhk_private.team_fixtures set status='finished',winner_team_id=home_team_id where id=$1",[f.id]);}
  const time=new Date().toISOString();await db.query('select jhk_private.team_advance_tournament($1,$2)',[c.cup.id,time]);const f=(await db.query("select * from jhk_private.team_fixtures where tournament_id=$1 and stage='final'",[c.cup.id])).rows[0];
  assert.equal(f.status,legacy?'active':'preparation');assert.equal(f.war_version,legacy?0:1);
  assert.equal((await db.query('select count(*) n from jhk_private.team_lineups where fixture_id=$1',[f.id])).rows[0].n,10);
  assert.equal(new Date(f.deadline_at).getTime()-new Date(f.accepted_at).getTime(),(legacy?24:47)*3600000);
 }
}));

test('badge opt-out removes optional labels from current and historical lineup receipts', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const p=await fixturePair(db);const member=p.home.members[1];await team(db,member,'roleConsent',{consent:true});await team(db,p.home.captain,'assignBadge',{memberId:member.id,badge:'bottle-boy'});
 await team(db,p.home.captain,'fixtureLineup',{fixtureId:p.fixture.id,memberIds:p.home.members.map(m=>m.id)});
 let f=fixtureFrom(await team(db,member,'fixture',{fixtureId:p.fixture.id}),p.fixture.id);assert.equal(f.lineups.home.find(m=>m.id===member.id).funBadge,'bottle-boy');
 await team(db,member,'roleConsent',{consent:false});f=fixtureFrom(await team(db,member,'fixture',{fixtureId:p.fixture.id}),p.fixture.id);assert.equal(f.lineups.home.find(m=>m.id===member.id).funBadge,'none');
}));

test('profile deletion clears prep readiness and promotes a captain; battle receipt stays frozen', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const p=await fixturePair(db);await team(db,p.home.captain,'assignRole',{memberId:p.home.members[1].id,role:'vice-captain'});await team(db,p.home.captain,'readyLineup',{fixtureId:p.fixture.id,ready:true});
 await ok(db,p.home.captain.token,'deleteSession');let r=await team(db,p.home.members[1],'dashboard');assert.equal(r.team.captainId,p.home.members[1].id);assert.equal(r.team.role,'captain');assert.equal(r.team.selectedCount,4);assert.deepEqual(fixtureFrom(r,p.fixture.id).ready,{home:false,away:false});
 const substitute=await player(db,'Replacement');await team(db,substitute,'join',{code:p.home.team.inviteCode});
 await team(db,p.home.members[1],'fixtureLineup',{fixtureId:p.fixture.id,memberIds:[...p.home.members.slice(1).map(m=>m.id),substitute.id]});
 await team(db,p.home.members[1],'readyLineup',{fixtureId:p.fixture.id,ready:true});await team(db,p.away.captain,'readyLineup',{fixtureId:p.fixture.id,ready:true});
 await ok(db,p.home.members[2].token,'deleteSession');r=await team(db,p.home.members[1],'fixture',{fixtureId:p.fixture.id});const f=fixtureFrom(r,p.fixture.id);assert.equal(f.lineups.home.length,5);assert.equal(f.lineups.home.find(m=>m.id===p.home.members[2].id).nickname,'Deleted player');
 assert.equal((await db.query('select role_tag from jhk_private.team_members where session_id=$1',[p.home.members[1].id])).rows[0].role_tag,'member');
}));

test('weekly invitation opt-out prevents recurrence and archived clubs stop future drafts', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const home=await fillTeam(db,await createTeam(db,{name:'Single Home'})),away=await fillTeam(db,await createTeam(db,{name:'Single Away'}));
 let r=await team(db,home.captain,'challenge',{targetTag:away.team.tag,recurrence:'weekly'});const id=fixtureFrom(r).id;
 r=await team(db,away.captain,'accept',{fixtureId:id});assert.equal(fixtureFrom(r,id).recurrence.cadence,'none');
 r=await atOk(db,home.captain,'fixture',{fixtureId:id},await advance(db,id,48));assert.equal(fixtureFrom(r,id).recurrence.nextFixtureId,null);
 const p=await weekly(db);r=await atOk(db,p.home.captain,'fixture',{fixtureId:p.fixture.id},await advance(db,p.fixture.id,48));const draftId=fixtureFrom(r,p.fixture.id).recurrence.nextFixtureId;
 for(const member of p.home.members.slice(1))await team(db,p.home.captain,'kick',{memberId:member.id});await team(db,p.home.captain,'leave');
 const draft=await row(db,draftId);assert.equal(draft.status,'declined');
 await team(db,p.away.captain,'dashboard');assert.equal((await row(db,draftId)).recurrence_stopped,true);
}));

test('new four-club cup reconciles semifinal clocks, fresh final preparation and terminal cup', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const c=await cup4(db);const fs=(await db.query('select * from jhk_private.team_fixtures where tournament_id=$1 order by slot',[c.cup.id])).rows;
 const reserve=await player(db,'Cup reserve');let r=await team(db,reserve,'join',{code:c.groups[0].team.inviteCode});assert.equal(r.team.members.find(m=>m.id===reserve.id).isReserve,true);
 const own=fs.find(f=>[f.home_team_id,f.away_team_id].includes(c.groups[0].team.id));await team(db,c.groups[0].captain,'substitute',{fixtureId:own.id,outMemberId:c.groups[0].members[4].id,inMemberId:reserve.id});
 const afterSemi=new Date(Math.max(...fs.map(f=>new Date(f.deadline_at).getTime()))+1000).toISOString();await atOk(db,c.groups[0].captain,'dashboard',{},afterSemi);
 const final=(await db.query("select * from jhk_private.team_fixtures where tournament_id=$1 and stage='final'",[c.cup.id])).rows[0];assert.equal(final.status,'preparation');assert.equal(new Date(final.prep_ends_at).getTime()-new Date(final.accepted_at).getTime(),23*3600000);
 if([final.home_team_id,final.away_team_id].includes(c.groups[0].team.id))assert.ok((await db.query('select session_id from jhk_private.team_lineups where fixture_id=$1 and team_id=$2',[final.id,c.groups[0].team.id])).rows.some(m=>m.session_id===reserve.id));
 await atOk(db,c.groups[0].captain,'dashboard',{},new Date(new Date(final.deadline_at).getTime()+1000).toISOString());assert.equal((await db.query('select status from jhk_private.team_tournaments where id=$1',[c.cup.id])).rows[0].status,'finished');
 assert.equal((await db.query('select coalesce(sum(points),0) n from jhk_private.team_awards a join jhk_private.team_fixtures f on f.id=a.fixture_id where f.tournament_id=$1',[c.cup.id])).rows[0].n,0);
}));

test('upgrade of a real legacy active fixture preserves its deadline, deck and frozen rosters', {skip:!databaseEnabled},async()=>{
 const {PGlite}=await import(pathToFileURL(process.env.PGLITE_MODULE_PATH).href);const db=new PGlite();
 try {
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');await db.exec(read('supabase/jhk/schema.sql'));await db.exec(read('supabase/jhk/seed-bank.sql'));await db.exec(read('supabase/jhk/migrations/20261030003000_jhk_teams.sql'));
  const p=await fixturePair(db,'full');assert.equal(p.fixture.status,'active');const before=await row(db,p.fixture.id);const lineups=(await db.query('select session_id from jhk_private.team_lineups where fixture_id=$1 order by session_id',[p.fixture.id])).rows;
  await db.exec(read('supabase/jhk/migrations/20261030020000_jhk_club_wars.sql'));await db.exec(read('supabase/jhk/migrations/20261030020000_jhk_club_wars.sql'));
  const after=await row(db,p.fixture.id);assert.equal(after.war_version,0);assert.equal(after.status,'active');assert.equal(new Date(after.deadline_at).getTime(),new Date(before.deadline_at).getTime());assert.deepEqual(after.deck,before.deck);assert.deepEqual((await db.query('select session_id from jhk_private.team_lineups where fixture_id=$1 order by session_id',[p.fixture.id])).rows,lineups);
  const r=await team(db,p.home.captain,'dashboard');assert.equal(r.team.selectedCount,5);assert.equal(r.team.rosterLimit,22);assert.equal(fixtureFrom(r,p.fixture.id).warVersion,0);
 } finally {await db.close();}
});

test('an incomplete FINAL cancels and releases all four clubs instead of trapping an active cup', {skip:!databaseEnabled},async()=>transaction(async db=>{
 const c=await cup4(db);const fs=(await db.query('select * from jhk_private.team_fixtures where tournament_id=$1',[c.cup.id])).rows;
 const afterSemi=new Date(Math.max(...fs.map(f=>new Date(f.deadline_at).getTime()))+1000).toISOString();await atOk(db,c.groups[0].captain,'dashboard',{},afterSemi);
 const final=(await db.query("select * from jhk_private.team_fixtures where tournament_id=$1 and stage='final'",[c.cup.id])).rows[0];
 const g=c.groups.find(g=>g.team.id===final.home_team_id);await atOk(db,g.members[4],'leave',{},afterSemi);
 await atOk(db,g.captain,'fixture',{fixtureId:final.id},new Date(new Date(final.prep_ends_at).getTime()+1000).toISOString());
 assert.equal((await row(db,final.id)).status,'declined');assert.equal((await row(db,final.id)).settlement_reason,'incomplete-lineup');assert.equal((await db.query('select status from jhk_private.team_tournaments where id=$1',[c.cup.id])).rows[0].status,'cancelled');
 for(const g of c.groups)assert.equal((await db.query('select jhk_private.team_locked($1) locked',[g.team.id])).rows[0].locked,false);
 assert.equal((await db.query('select count(*) n from jhk_private.team_awards where fixture_id=$1',[final.id])).rows[0].n,0);
}));
