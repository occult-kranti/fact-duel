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
    await database.exec(read('supabase/jhk/migrations/20261030040000_jhk_public_club_identity.sql'));
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

test('team support preserves the service-only command boundary and existing human over API', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  assert.equal((await db.query("select has_function_privilege('anon','public.jhk_command(text,text,jsonb,text)','EXECUTE') as allowed")).rows[0].allowed, false);
  assert.equal((await db.query("select has_function_privilege('authenticated','public.jhk_command(text,text,jsonb,text)','EXECUTE') as allowed")).rows[0].allowed, false);
  assert.equal((await db.query("select has_schema_privilege('anon','jhk_private','USAGE') as allowed")).rows[0].allowed, false);
  const privateTables = await db.query("select c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') as anon_read,has_table_privilege('authenticated',c.oid,'SELECT') as user_read from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='jhk_private' and c.relkind='r' and (c.relname='teams' or c.relname like 'team_%')");
  assert.equal(privateTables.rows.length, 9);
  assert.ok(privateTables.rows.every(row => row.relrowsecurity && !row.anon_read && !row.user_read));
  const unauthorized = await command(db, randomBytes(32).toString('hex'), 'team', { op: 'dashboard' });
  rejected(unauthorized);

  const self = await player(db, 'Legacy retained');
  const legacy = await ok(db, self.token, 'create');
  assert.equal(legacy.match.roundCount, 5);
  await ok(db, self.token, 'leave', { roomId: legacy.match.id });
  const mini = await ok(db, self.token, 'create', { format: 'mini', file: 'cricket' });
  assert.equal(mini.match.roundCount, 3);
}));

test.after(async () => { if (database) await database.close(); });

test('server teams enforce 5/11 capacity, immutable automatic tags and one active team per player', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const five = await fillTeam(db, await createTeam(db));
  assert.equal(five.team.capacity, 5);
  assert.equal(five.team.members.length, 5);
  assert.ok(five.team.tag.length >= 4);
  assert.notEqual(five.team.tag, five.team.inviteCode);
  const duplicate = await team(db, five.members[1], 'join', { code: five.team.inviteCode });
  assert.equal(duplicate.team.members.length, 5, 'retry does not create a second membership');
  const extra = await player(db, 'Extra member');
  rejected(await command(db, extra.token, 'team', { op: 'join', code: five.team.inviteCode }));
  const eleven = await fillTeam(db, await createTeam(db, { capacity: 11, name: 'Full Eleven' }));
  assert.equal(eleven.team.capacity, 11);
  assert.equal(eleven.team.members.length, 11);
  assert.notEqual(eleven.team.tag, five.team.tag);
  rejected(await command(db, extra.token, 'team', { op: 'join', code: eleven.team.inviteCode }));
  rejected(await command(db, five.members[1].token, 'team', { op: 'join', code: eleven.team.inviteCode }));
  const invalid = await player(db, 'Wrong size');
  rejected(await command(db, invalid.token, 'team', { op: 'create', name: 'Wrong Size', capacity: 6 }));
  const outsider = await team(db, extra, 'dashboard');
  assert.equal(outsider.team, null);
  assert.deepEqual(outsider.fixtures, []);
}));

test('only the captain changes team settings, rotates invites, removes members or transfers captaincy', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const group = await fillTeam(db, await createTeam(db), 2);
  const originalTag = group.team.tag;
  rejected(await command(db, group.members[1].token, 'team', { op: 'settings', name: 'Unauthorized' }));
  const updated = await team(db, group.captain, 'settings', { name: 'Renamed Stars', emblem: 'bolt', palette: 'berry', joinOpen: false });
  assert.equal(updated.team.name, 'Renamed Stars');
  assert.equal(updated.team.tag, originalTag);
  assert.equal(updated.team.emblem, 'bolt');
  rejected(await command(db, group.captain.token, 'team', { op: 'settings', emblem: 'crown' }));
  assert.equal(updated.team.palette, 'berry');
  const newcomer = await player(db, 'Newcomer');
  rejected(await command(db, newcomer.token, 'team', { op: 'join', code: group.team.inviteCode }));
  await team(db, group.captain, 'settings', { joinOpen: true });
  const rotated = await team(db, group.captain, 'rotateInvite');
  assert.notEqual(rotated.team.inviteCode, group.team.inviteCode);
  rejected(await command(db, newcomer.token, 'team', { op: 'join', code: group.team.inviteCode }));
  await team(db, newcomer, 'join', { code: rotated.team.inviteCode });
  rejected(await command(db, group.captain.token, 'team', { op: 'leave' }));
  await team(db, group.captain, 'transfer', { memberId: group.members[1].id });
  rejected(await command(db, group.captain.token, 'team', { op: 'settings', name: 'Former captain' }));
  const kicked = await team(db, group.members[1], 'kick', { memberId: newcomer.id });
  assert.equal(kicked.team.members.length, 2);
  const departed = await team(db, group.captain, 'leave');
  assert.equal(departed.team, null);
  const closed = await team(db, group.members[1], 'leave');
  assert.equal(closed.team, null, 'last member can close the empty team');
}));

test('team fixtures require equal full rosters and freeze participating membership', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const home = await createTeam(db, { name: 'Home Five' });
  const away = await createTeam(db, { name: 'Away Five' });
  const eleven = await createTeam(db, { name: 'Other Eleven', capacity: 11 });
  rejected(await command(db, home.captain.token, 'team', { op: 'challenge', targetTag: eleven.team.tag, format: 'mini' }));
  const created = await team(db, home.captain, 'challenge', { targetTag: away.team.tag, format: 'mini' });
  const pending = fixtureFrom(created);
  rejected(await command(db, away.captain.token, 'team', { op: 'accept', fixtureId: pending.id }));
  await fillTeam(db, home);
  await fillTeam(db, away);
  const accepted = await team(db, away.captain, 'accept', { fixtureId: pending.id });
  const active = fixtureFrom(accepted, pending.id);
  assert.equal(active.status, 'active');
  assert.equal(active.roundCount, 3);
  assert.ok(active.deadlineAt > accepted.serverNow);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_lineups where fixture_id=$1', [active.id])).rows[0].n, 10);
  assert.equal(JSON.stringify(active).includes(home.team.inviteCode), false, 'public fixture projection excludes join secrets');
  rejected(await command(db, home.members[1].token, 'team', { op: 'leave' }));
  rejected(await command(db, home.captain.token, 'team', { op: 'kick', memberId: home.members[1].id }));
  const outsider = await player(db, 'Fixture outsider');
  rejected(await command(db, outsider.token, 'team', { op: 'fixture', fixtureId: active.id }));
  rejected(await command(db, away.captain.token, 'team', { op: 'accept', fixtureId: randomUUID() }));
}));

for (const format of ['mini', 'full']) {
  test(`${format} team overs keep answer keys private and lock one server-measured first answer per round`, { skip: !databaseEnabled }, async () => transaction(async (db) => {
    const { home, fixture } = await fixturePair(db, format);
    rejected(await command(db, home.captain.token, 'team', { op: 'answer', fixtureId: fixture.id, round: 1, choice: 0, requestId: randomUUID() }));
    await finishRun(db, home.captain, fixture.id, { checkLocks: true });
    const answered = await db.query('select count(*)::int n,count(*) filter(where correct)::int correct from jhk_private.team_answers where fixture_id=$1 and session_id=$2', [fixture.id, home.captain.id]);
    assert.equal(answered.rows[0].n, format === 'mini' ? 3 : 6);
    assert.equal(answered.rows[0].correct, answered.rows[0].n);
    const resumed = await team(db, home.captain, 'play', { fixtureId: fixture.id });
    assert.equal(resumed.run.phase, 'finished', 'reopening never creates a second run');
    const profile = await ok(db, home.captain.token, 'profile');
    assert.equal(profile.session.onlineXp, 0, 'team cosmetic benefits do not mint personal ranked XP');
    assert.equal(profile.session.balance, 100, 'team play never reserves a wager');
  }));
}

test('server expiry rejects late correctness and settles missing contributions without a fake winner', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const { home, fixture } = await fixturePair(db);
  await team(db, home.captain, 'play', { fixtureId: fixture.id });
  const answer = (await db.query("select (deck->0->>'correctIndex')::int answer from jhk_private.team_fixtures where id=$1", [fixture.id])).rows[0].answer;
  await db.query("update jhk_private.team_runs set issued_at=clock_timestamp()-interval '40 seconds',deadline_at=clock_timestamp()-interval '1 second' where fixture_id=$1 and session_id=$2", [fixture.id, home.captain.id]);
  const late = await command(db, home.captain.token, 'team', { op: 'answer', fixtureId: fixture.id, round: 1, choice: answer, requestId: randomUUID() });
  if (late.ok) assert.equal(late.run.receipt.correct, false);
  const scores = await db.query('select count(*) filter(where correct)::int correct from jhk_private.team_answers where fixture_id=$1', [fixture.id]);
  assert.equal(scores.rows[0].correct, 0);
  await db.query("update jhk_private.team_fixtures set deadline_at=clock_timestamp()-interval '1 second' where id=$1", [fixture.id]);
  const settled = fixtureFrom(await team(db, home.captain, 'fixture', { fixtureId: fixture.id }), fixture.id);
  assert.equal(settled.status, 'finished');
  assert.equal(settled.winnerTeamId, null, 'equally missing contributions draw in a direct match');
  assert.equal(settled.homeScore.elapsedMs, 5 * 3 * 30000);
  assert.equal(settled.awayScore.elapsedMs, 5 * 3 * 30000);
  assert.equal((await team(db, home.captain, 'dashboard')).team.points, 0, 'idle fixtures cannot farm cosmetic marks');
  const repeated = fixtureFrom(await team(db, home.captain, 'fixture', { fixtureId: fixture.id }), fixture.id);
  assert.equal(repeated.winnerTeamId, null);
}));

test('a fully played team fixture settles once from accepted answers and awards only cosmetic team progress', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const { home, away, fixture } = await fixturePair(db);
  for (const member of home.members) await finishRun(db, member, fixture.id);
  for (const member of away.members) await finishRun(db, member, fixture.id, { correct: false });
  const complete = await team(db, home.captain, 'fixture', { fixtureId: fixture.id });
  const final = fixtureFrom(complete, fixture.id);
  assert.equal(final.status, 'finished');
  assert.equal(final.winnerTeamId, home.team.id);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_answers where fixture_id=$1', [fixture.id])).rows[0].n, 30);
  const points = complete.team.points;
  assert.ok(points > 0, 'played fixture has an explicit collective cosmetic benefit');
  const awarded = (await db.query('select count(*)::int n from jhk_private.team_awards')).rows[0].n;
  for (let repeat = 0; repeat < 3; repeat += 1) {
    const again = await team(db, home.captain, 'fixture', { fixtureId: fixture.id });
    assert.equal(again.team.points, points);
  }
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_awards')).rows[0].n, awarded);
  const profile = await ok(db, home.captain.token, 'profile');
  assert.equal(profile.session.onlineXp, 0);
  assert.equal(profile.session.balance, 100);
}));

test('four-team cups enforce entry rules and create one final with the disclosed seed fallback on exact ties', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const groups = [];
  for (let seed = 1; seed <= 4; seed += 1) groups.push(await createTeam(db, { name: `Cup Team ${seed}` }));
  const created = await team(db, groups[0].captain, 'tournamentCreate', { name: 'Four Team Cup', format: 'mini' });
  const cup = created.tournaments.find(item => item.name === 'Four Team Cup');
  assert.ok(cup?.id && cup.code, JSON.stringify(created));
  for (const group of groups.slice(1)) await team(db, group.captain, 'tournamentJoin', { code: cup.code });
  rejected(await command(db, groups[0].captain.token, 'team', { op: 'tournamentStart', tournamentId: cup.id }));
  for (const group of groups) await fillTeam(db, group);
  const fifth = await createTeam(db, { name: 'Fifth Team' });
  rejected(await command(db, fifth.captain.token, 'team', { op: 'tournamentJoin', code: cup.code }));
  rejected(await command(db, groups[1].captain.token, 'team', { op: 'tournamentStart', tournamentId: cup.id }));
  const started = await team(db, groups[0].captain, 'tournamentStart', { tournamentId: cup.id });
  assert.equal(started.tournaments.find(item => item.id === cup.id).status, 'active');
  const semifinals = (await db.query('select id,home_team_id,away_team_id from jhk_private.team_fixtures where tournament_id=$1 order by id', [cup.id])).rows;
  assert.equal(semifinals.length, 2);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_tournament_entries where tournament_id=$1', [cup.id])).rows[0].n, 4);
  for (const fixture of semifinals) {
    await db.query("update jhk_private.team_fixtures set deadline_at=clock_timestamp()-interval '1 second' where id=$1", [fixture.id]);
    const captain = groups.find(group => group.team.id === fixture.home_team_id).captain;
    const settled = fixtureFrom(await team(db, captain, 'fixture', { fixtureId: fixture.id }), fixture.id);
    assert.equal(settled.status, 'finished');
    assert.ok(settled.winnerTeamId, 'cup exact tie advances one team under the declared rule');
  }
  const all = (await db.query('select id,home_team_id,away_team_id from jhk_private.team_fixtures where tournament_id=$1 order by id', [cup.id])).rows;
  assert.equal(all.length, 3, 'exactly one final is created after two semifinal results');
  const final = all.find(item => !semifinals.some(semi => semi.id === item.id));
  assert.ok(final);
  await db.query("update jhk_private.team_fixtures set deadline_at=clock_timestamp()-interval '1 second' where id=$1", [final.id]);
  const host = groups.find(group => group.team.id === final.home_team_id).captain;
  const complete = await team(db, host, 'fixture', { fixtureId: final.id });
  assert.equal(fixtureFrom(complete, final.id).winnerTeamId, groups[0].team.id, 'lowest entry seed advances on an exact score/time tie');
  assert.equal(complete.tournaments.find(item => item.id === cup.id).status, 'finished');
  await team(db, groups[0].captain, 'dashboard');
  await team(db, groups[0].captain, 'dashboard');
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_fixtures where tournament_id=$1', [cup.id])).rows[0].n, 3);
}));

test('a fully played four-team cup advances on accepted answers and settles its final and cosmetic marks once', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const groups = [];
  for (let seed = 1; seed <= 4; seed += 1) groups.push(await fillTeam(db, await createTeam(db, { name: `Played Cup ${seed}` })));
  const created = await team(db, groups[0].captain, 'tournamentCreate', { name: 'Played Team Cup', format: 'mini' });
  const cup = created.tournaments.find(item => item.name === 'Played Team Cup');
  assert.ok(cup);
  for (const group of groups.slice(1)) await team(db, group.captain, 'tournamentJoin', { code: cup.code });
  const started = await team(db, groups[0].captain, 'tournamentStart', { tournamentId: cup.id });
  const semifinals = started.tournaments.find(item => item.id === cup.id).fixtures;
  assert.equal(semifinals.length, 2);
  assert.ok(semifinals.every(fixture => fixture.status === 'active' && fixture.stage === 'semifinal'));

  // Higher original seeds win by correctness, overriding the lower-seed exact-tie fallback.
  const semifinalWinners = [groups[3], groups[2]];
  for (const fixture of semifinals) {
    const home = groups.find(group => group.team.id === fixture.homeTeam.id);
    const away = groups.find(group => group.team.id === fixture.awayTeam.id);
    const winner = semifinalWinners.find(group => [home.team.id, away.team.id].includes(group.team.id));
    for (const group of [home, away]) {
      for (const member of group.members) await finishRun(db, member, fixture.id, { correct: group.team.id === winner.team.id });
    }
    const settled = fixtureFrom(await team(db, winner.captain, 'fixture', { fixtureId: fixture.id }), fixture.id);
    assert.equal(settled.status, 'finished');
    assert.equal(settled.winnerTeamId, winner.team.id);
    assert.equal(settled.tieBreak, null);
  }

  const advanced = (await team(db, groups[3].captain, 'dashboard')).tournaments.find(item => item.id === cup.id);
  assert.equal(advanced.fixtures.length, 3, 'two played semifinals create exactly one final automatically');
  const final = advanced.fixtures.find(fixture => fixture.stage === 'final');
  assert.ok(final && final.status === 'active');
  assert.deepEqual(new Set([final.homeTeam.id, final.awayTeam.id]), new Set(semifinalWinners.map(group => group.team.id)));
  for (const group of semifinalWinners) {
    for (const member of group.members) await finishRun(db, member, final.id, { correct: group.team.id === groups[3].team.id });
  }

  const complete = await team(db, groups[3].captain, 'fixture', { fixtureId: final.id });
  const settledFinal = fixtureFrom(complete, final.id);
  assert.equal(settledFinal.status, 'finished');
  assert.equal(settledFinal.winnerTeamId, groups[3].team.id, 'seed four wins the cup on correctness rather than the lower-seed fallback');
  assert.equal(settledFinal.tieBreak, null);
  const completedCup = complete.tournaments.find(item => item.id === cup.id);
  assert.equal(completedCup.status, 'finished');
  assert.equal(completedCup.winnerTeamId, groups[3].team.id);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_answers a join jhk_private.team_fixtures f on f.id=a.fixture_id where f.tournament_id=$1', [cup.id])).rows[0].n, 90);
  assert.equal(complete.team.points, 160, 'five completed runs and a win award 80 marks in each played round');
  assert.equal(complete.team.level, 2);
  const awards = (await db.query('select count(*)::int n from jhk_private.team_awards a join jhk_private.team_fixtures f on f.id=a.fixture_id where f.tournament_id=$1', [cup.id])).rows[0].n;
  assert.equal(awards, 6, 'each of the two participating teams receives one award record per fixture');
  for (let retry = 0; retry < 3; retry += 1) {
    const repeated = await team(db, groups[3].captain, 'fixture', { fixtureId: final.id });
    assert.equal(repeated.team.points, 160);
    assert.equal(repeated.tournaments.find(item => item.id === cup.id).winnerTeamId, groups[3].team.id);
  }
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_fixtures where tournament_id=$1', [cup.id])).rows[0].n, 3);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_awards a join jhk_private.team_fixtures f on f.id=a.fixture_id where f.tournament_id=$1', [cup.id])).rows[0].n, awards);
}));

test('profile deletion removes live membership and transfers captaincy without erasing a frozen fixture', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const { home, fixture } = await fixturePair(db);
  const deleted = await ok(db, home.captain.token, 'deleteSession');
  assert.equal(deleted.deleted, true);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_members where session_id=$1', [home.captain.id])).rows[0].n, 0);
  const remaining = await team(db, home.members[1], 'dashboard');
  assert.notEqual(remaining.team.captainId, home.captain.id);
  assert.equal(remaining.team.members.length, 4);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_lineups where fixture_id=$1', [fixture.id])).rows[0].n, 10, 'historical lineup IDs remain for missing-contribution accounting');
  assert.equal((await db.query('select nickname_snapshot from jhk_private.team_lineups where fixture_id=$1 and session_id=$2', [fixture.id, home.captain.id])).rows[0].nickname_snapshot, 'Deleted player');
  const serialized = JSON.stringify(fixtureFrom(remaining, fixture.id));
  assert.equal(serialized.includes('Home Stars captain'), false, 'deleted public nickname is not retained in the fixture projection');
  rejected(await command(db, home.captain.token, 'team', { op: 'dashboard' }));
}));

test('11-a-side fixtures lock 22 players and account for every missing Full-over ball', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const { home, fixture } = await fixturePair(db, 'full', 11);
  assert.equal(fixture.capacity, 11);
  assert.equal(fixture.roundCount, 6);
  assert.equal((await db.query('select count(*)::int n from jhk_private.team_lineups where fixture_id=$1', [fixture.id])).rows[0].n, 22);
  await db.query("update jhk_private.team_fixtures set deadline_at=clock_timestamp()-interval '1 second' where id=$1", [fixture.id]);
  const settled = fixtureFrom(await team(db, home.captain, 'fixture', { fixtureId: fixture.id }), fixture.id);
  assert.equal(settled.homeScore.elapsedMs, 11 * 6 * 30000);
  assert.equal(settled.awayScore.elapsedMs, 11 * 6 * 30000);
  assert.equal(settled.homeScore.rosterSize, 11);
  assert.equal(settled.winnerTeamId, null);
}));

test('captains can leave or cancel an open cup and retained entries never trap teams in abandoned recruitment', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const groups = [];
  for (let seed = 1; seed <= 3; seed += 1) groups.push(await createTeam(db, { name: `Recruit Team ${seed}` }));
  const created = await team(db, groups[0].captain, 'tournamentCreate', { name: 'Recruiting Cup', format: 'mini' });
  const cup = created.tournaments.find(item => item.name === 'Recruiting Cup');
  assert.ok(cup);
  for (const group of groups.slice(1)) await team(db, group.captain, 'tournamentJoin', { code: cup.code });
  const left = await team(db, groups[1].captain, 'tournamentLeave', { tournamentId: cup.id });
  assert.equal(left.tournaments.some(item => item.id === cup.id), false);
  const entries = (await team(db, groups[0].captain, 'dashboard')).tournaments.find(item => item.id === cup.id).entries;
  assert.deepEqual(entries.map(entry => entry.seed), [1, 2]);
  assert.equal(entries[1].team.id, groups[2].team.id);
  const cancelled = await team(db, groups[0].captain, 'tournamentLeave', { tournamentId: cup.id });
  assert.equal(cancelled.tournaments.find(item => item.id === cup.id).status, 'cancelled');
  const replacement = await team(db, groups[2].captain, 'tournamentCreate', { name: 'Replacement Cup', format: 'full' });
  assert.ok(replacement.tournaments.some(item => item.name === 'Replacement Cup' && item.status === 'open'));
}));

test('expired invitations cannot be accepted and expired matches release rosters on the next mutation', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const home = await fillTeam(db, await createTeam(db, { name: 'Deadline Home' }));
  const away = await fillTeam(db, await createTeam(db, { name: 'Deadline Away' }));
  const pending = fixtureFrom(await team(db, home.captain, 'challenge', { targetTag: away.team.tag, format: 'mini' }));
  await db.query("update jhk_private.team_fixtures set created_at=clock_timestamp()-interval '49 hours' where id=$1", [pending.id]);
  const expired = await command(db, away.captain.token, 'team', { op: 'accept', fixtureId: pending.id });
  rejected(expired);
  assert.equal(expired.error.code, 'FIXTURE_CLOSED');
  const created = await team(db, home.captain, 'challenge', { targetTag: away.team.tag, format: 'mini' });
  const invitation = created.fixtures.find(item => item.status === 'pending');
  assert.ok(invitation && invitation.id !== pending.id);
  const active = fixtureFrom(await team(db, away.captain, 'accept', { fixtureId: invitation.id }), invitation.id);
  await db.query("update jhk_private.team_fixtures set deadline_at=clock_timestamp()-interval '1 second' where id=$1", [active.id]);
  const left = await team(db, home.members[1], 'leave');
  assert.equal(left.team, null, 'expiry is reconciled before checking the old roster lock');
}));

test('expired recruiting cups and archived hosts release every team for a fresh competition', { skip: !databaseEnabled }, async () => transaction(async (db) => {
  const host = await createTeam(db, { name: 'Recruiting Host' });
  const guest = await createTeam(db, { name: 'Recruiting Guest' });
  const created = await team(db, host.captain, 'tournamentCreate', { name: 'Expired Recruiting Cup', format: 'mini' });
  const cup = created.tournaments.find(item => item.name === 'Expired Recruiting Cup');
  assert.ok(cup);
  await team(db, guest.captain, 'tournamentJoin', { code: cup.code });
  await db.query("update jhk_private.team_tournaments set created_at=clock_timestamp()-interval '49 hours' where id=$1", [cup.id]);
  const reconciled = await team(db, guest.captain, 'dashboard');
  assert.equal(reconciled.tournaments.find(item => item.id === cup.id).status, 'cancelled');
  const replacement = await team(db, guest.captain, 'tournamentCreate', { name: 'Fresh Full Cup', format: 'full' });
  assert.ok(replacement.tournaments.some(item => item.name === 'Fresh Full Cup' && item.status === 'open'));
  await team(db, guest.captain, 'leave');
  const archivedCup = (await db.query('select status from jhk_private.team_tournaments where owner_team_id=$1 and name=$2', [guest.team.id, 'Fresh Full Cup'])).rows[0];
  assert.equal(archivedCup.status, 'cancelled');
}));
