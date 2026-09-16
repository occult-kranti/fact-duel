import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCOUNTS_LIVE,
  LEAGUE_SIZE,
  PROMOTE_TOP,
  RELEGATE_BOTTOM,
  RELEGATION_MIN,
  boardsAvailable,
  bracket,
  cleanOpponentName,
  fnv1a32,
  lastWeekKey,
  neighbourhood,
  percentile,
  rivals,
  settleWeek,
  standings,
  weekKey,
  youVsYou,
} from '../lib/leagues.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';

const T = (s) => Date.parse(s);

// ---------------------------------------------------------------------------------------------
// weekKey

test('weekKey is ISO, Monday-start, and follows the Thursday rule across the 2026/2027 boundary', () => {
  assert.equal(weekKey(T('2026-12-28T00:00:00Z')), '2026-W53');
  assert.equal(weekKey(T('2027-01-03T23:59:59Z')), '2026-W53');
  assert.equal(weekKey(T('2027-01-04T00:00:00Z')), '2027-W01');
  assert.equal(weekKey(T('2024-12-30T00:00:00Z')), '2025-W01');
  assert.equal(weekKey(T('2021-01-03T00:00:00Z')), '2020-W53');
  assert.equal(weekKey(T('2026-09-16T12:00:00Z')), '2026-W38');
  assert.match(weekKey(0), /^\d{4}-W\d{2}$/);
  assert.match(weekKey(NaN), /^\d{4}-W\d{2}$/);
});

test('weekKey honours the local offset: the same instant is Sunday in UTC and Monday in UTC+2', () => {
  const sundayNight = T('2026-09-13T23:30:00Z');
  assert.equal(weekKey(sundayNight, 0), '2026-W37');
  assert.equal(weekKey(sundayNight, -120), '2026-W38');
  assert.equal(weekKey(T('2026-12-28T00:00:00Z'), 600), '2026-W52');
  assert.equal(lastWeekKey(T('2027-01-04T12:00:00Z')), '2026-W53');
  assert.equal(lastWeekKey(T('2026-09-16T12:00:00Z')), '2026-W37');
});

// ---------------------------------------------------------------------------------------------
// bracket

const entries = (n, tier = 'silver', active = true, prefix = 'p') =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${String(i).padStart(3, '0')}`,
    tier,
    weeklyPoints: (i * 7) % 50,
    duels: i % 4,
    active,
  }));

test('bracket is deterministic, bounded by LEAGUE_SIZE and covers every entrant exactly once', () => {
  const pool = entries(95);
  const a = bracket(pool, { weekKey: '2026-W38' });
  const b = bracket([...pool].reverse(), { weekKey: '2026-W38' });
  assert.deepEqual(a, b);
  assert.equal(a.length, Math.ceil(95 / LEAGUE_SIZE));
  const ids = a.flatMap((l) => l.entries.map((e) => e.id));
  assert.equal(ids.length, 95);
  assert.equal(new Set(ids).size, 95);
  for (const l of a) {
    assert.ok(l.entries.length <= LEAGUE_SIZE);
    assert.ok(l.entries.length >= Math.floor(95 / 4));
    assert.equal(l.tier, 'silver');
    assert.equal(l.weekKey, '2026-W38');
  }
  // A different week is a different draw, but still one league per 30 and the same membership.
  const c = bracket(pool, { weekKey: '2026-W39' });
  assert.notDeepEqual(
    a.map((l) => l.entries.map((e) => e.id)),
    c.map((l) => l.entries.map((e) => e.id)),
  );
  assert.equal(c.flatMap((l) => l.entries).length, 95);
  assert.equal(fnv1a32('2026-W38:p000'), fnv1a32('2026-W38:p000'));
});

test('bracket groups by tier then activity, keeps a league of one, and drops garbage and duplicates', () => {
  const pool = [
    ...entries(3, 'gold'),
    ...entries(2, 'gold', false, 'd'),
    ...entries(1, 'bronze', true, 'b'),
    // A duplicate id is dropped, first sighting kept — the 999 never lands.
    { id: 'p000', tier: 'gold', weeklyPoints: 999 },
    { id: '', tier: 'gold' },
    null,
    { id: 'x', tier: 7 },
  ];
  const leagues = bracket(pool, { weekKey: 'w' });
  assert.deepEqual(
    leagues.map((l) => [l.tier, l.active, l.entries.length]),
    [
      ['gold', true, 3],
      ['gold', false, 2],
      ['bronze', true, 1],
    ],
  );
  assert.equal(leagues[0].entries.find((e) => e.id === 'p000').weeklyPoints, 0);
  assert.deepEqual(
    bracket(pool, { weekKey: 'w', tier: 'bronze' }).map((l) => l.id),
    ['w:bronze:active:1'],
  );
  assert.deepEqual(bracket([], { weekKey: 'w' }), []);
  assert.deepEqual(bracket(undefined), []);
  // Exactly 30 is one league; 31 is two of near-equal size.
  assert.equal(bracket(entries(30), { weekKey: 'w' }).length, 1);
  assert.deepEqual(
    bracket(entries(31), { weekKey: 'w' }).map((l) => l.entries.length),
    [16, 15],
  );
});

// ---------------------------------------------------------------------------------------------
// settleWeek

test('settleWeek promotes the top ten scorers and relegates five from a league of twenty or more', () => {
  const league = { entries: entries(30) };
  const s = settleWeek(league);
  assert.equal(s.promoted.length, PROMOTE_TOP);
  assert.equal(s.relegated.length, RELEGATE_BOTTOM);
  assert.equal(s.stayed.length, 30 - PROMOTE_TOP - RELEGATE_BOTTOM);
  assert.equal(new Set([...s.promoted, ...s.relegated, ...s.stayed]).size, 30);
  assert.deepEqual(
    s.promoted,
    s.standings.slice(0, PROMOTE_TOP).map((e) => e.id),
  );
  assert.deepEqual(
    s.relegated,
    s.standings.slice(-RELEGATE_BOTTOM).map((e) => e.id),
  );
  for (let i = 1; i < s.standings.length; i++)
    assert.ok(s.standings[i - 1].weeklyPoints >= s.standings[i].weeklyPoints);
});

test('settleWeek: a small league has no relegation zone, and a zero-point week is never a promotion', () => {
  const small = settleWeek({ entries: entries(RELEGATION_MIN - 1) });
  assert.deepEqual(small.relegated, []);
  assert.equal(small.promoted.length + small.stayed.length, RELEGATION_MIN - 1);
  const edge = settleWeek({ entries: entries(RELEGATION_MIN) });
  assert.equal(edge.relegated.length, RELEGATE_BOTTOM);
  const idle = settleWeek({
    entries: [
      { id: 'a', tier: 't', weeklyPoints: 12 },
      { id: 'b', tier: 't', weeklyPoints: 0 },
      { id: 'c', tier: 't', weeklyPoints: 0 },
    ],
  });
  assert.deepEqual(idle.promoted, ['a']);
  assert.deepEqual(idle.stayed, ['b', 'c']);
  assert.deepEqual(settleWeek(null), { standings: [], promoted: [], relegated: [], stayed: [] });
});

test('standings break ties by fewer duels, then by id', () => {
  const table = standings([
    { id: 'grinder', tier: 't', weeklyPoints: 40, duels: 12 },
    { id: 'zed', tier: 't', weeklyPoints: 40, duels: 4 },
    { id: 'amy', tier: 't', weeklyPoints: 40, duels: 4 },
    { id: 'top', tier: 't', weeklyPoints: 41, duels: 30 },
  ]);
  assert.deepEqual(
    table.map((e) => [e.rank, e.id]),
    [
      [1, 'top'],
      [2, 'amy'],
      [3, 'zed'],
      [4, 'grinder'],
    ],
  );
});

// ---------------------------------------------------------------------------------------------
// percentile / neighbourhood

test('percentile uses mid-rank, so a lone entrant is 50 and ties share a rank; delta needs a previous', () => {
  assert.deepEqual(percentile(10, [10]), { pct: 50, delta: null, population: 1 });
  assert.deepEqual(percentile(10, [10, 10, 10]), { pct: 50, delta: null, population: 3 });
  assert.equal(percentile(30, [10, 20, 30, 40]).pct, 63);
  assert.equal(percentile(40, [10, 20, 30, 40]).pct, 88);
  assert.equal(percentile(10, [10, 20, 30, 40]).pct, 13);
  assert.equal(percentile(5, [10, 20]).pct, 0);
  assert.equal(percentile(50, [10, 20]).pct, 100);
  assert.deepEqual(percentile(30, [10, 20, 30, 40], { previous: 50 }), { pct: 63, delta: 13, population: 4 });
  assert.deepEqual(percentile(30, []), { pct: null, delta: null, population: 0 });
  assert.equal(percentile(NaN, [1, 2]).pct, null);
  assert.equal(percentile(1, [1, 'x', null, 2]).population, 2);
});

test('neighbourhood is the unpadded ±2 window with ranks, and empty for an unknown id', () => {
  const table = standings(entries(7).map((e, i) => ({ ...e, weeklyPoints: 100 - i })));
  const mid = neighbourhood(table, 'p003');
  assert.equal(mid.rank, 4);
  assert.equal(mid.total, 7);
  assert.deepEqual(
    mid.entries.map((e) => [e.rank, e.id]),
    [
      [2, 'p001'],
      [3, 'p002'],
      [4, 'p003'],
      [5, 'p004'],
      [6, 'p005'],
    ],
  );
  const top = neighbourhood(table, 'p000');
  assert.deepEqual(
    top.entries.map((e) => e.id),
    ['p000', 'p001', 'p002'],
  );
  const bottom = neighbourhood(table, 'p006', 1);
  assert.deepEqual(
    bottom.entries.map((e) => e.id),
    ['p005', 'p006'],
  );
  assert.deepEqual(neighbourhood([{ id: 'solo' }], 'solo'), {
    index: 0,
    rank: 1,
    total: 1,
    entries: [{ id: 'solo', rank: 1 }],
  });
  assert.deepEqual(neighbourhood(table, 'nobody'), { index: -1, rank: null, total: 7, entries: [] });
  assert.deepEqual(neighbourhood(null, 'x'), { index: -1, rank: null, total: 0, entries: [] });
});

// ---------------------------------------------------------------------------------------------
// The device-local boards, built from real rooms through the profile reducer

const fact = (id, topic = 'Football') => ({
  factId: id,
  question: `Question ${id}?`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Original explanation.',
  topic,
  subtopic: 'History',
  sourceUrl: 'https://example.org/source',
  sourceLabel: 'Primary source',
});
/** A completed one-round room. `friend` seats a human opponent (optionally named); default is the bot. */
const room = (id, { friend = false, name, outcome = 'win', correct = true, topic = 'Football' } = {}) => ({
  id,
  createdAt: 1000,
  phase: 'complete',
  seat: 0,
  config: { mode: 'quick', stake: 0 },
  players: [{ kind: 'human', name: 'Me' }, friend ? { kind: 'human', name } : { kind: 'bot', name: 'Coach' }],
  scores: outcome === 'win' ? [1, 0] : outcome === 'loss' ? [0, 1] : [0, 0],
  winner: outcome === 'win' ? 0 : outcome === 'loss' ? 1 : null,
  round: {
    id: `${id}:0`,
    index: 0,
    result: { winner: 0 },
    question: fact(`q-${id}`, topic),
    receipts: [{ correct, elapsedMs: 1200, choice: correct ? 0 : 1 }, null],
  },
});
const play = (p, r, at) => reduceProfile(p, { epoch: p.epoch, at, type: 'room', room: r });

test('rivals: the journal now carries the opponent name, and a record without one is reported, never guessed', () => {
  const none = rivals(emptyProfile());
  assert.deepEqual(none, { rows: [], unnamed: 0, friendDuels: 0, reason: 'no-friend-duels' });
  let p = emptyProfile();
  p = play(p, room('m1', { friend: true, name: 'Sam' }), T('2026-09-14T10:00:00Z'));
  p = play(p, room('m2'), T('2026-09-14T11:00:00Z'));
  assert.equal(p.journal.matches.length, 2);
  assert.equal(p.journal.matches.find((m) => m.id === 'm1').opponentName, 'Sam', 'recordRoom stores the other seat');
  assert.equal(p.journal.matches.find((m) => m.id === 'm2').opponentName, undefined, 'a bot room stores no name');
  const r = rivals(p);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].name, 'Sam');
  assert.equal(r.friendDuels, 1);
  assert.equal(boardsAvailable(p).friends, true);
  // A record written before the field existed (or a name the sanitiser dropped) is counted as unnamed.
  const stripped = { ...p, journal: { ...p.journal, matches: p.journal.matches.map(({ opponentName: _n, ...m }) => m) } };
  assert.deepEqual(rivals(stripped), { rows: [], unnamed: 1, friendDuels: 1, reason: 'no-opponent-identity' });
  assert.equal(boardsAvailable(stripped).friends, false);
});

test('rivals: once the match record carries opponentName, head-to-head rows are built from friend duels only', () => {
  let p = emptyProfile();
  p = play(p, room('m1', { friend: true, name: 'Sam' }), T('2026-09-14T10:00:00Z'));
  p = play(p, room('m2', { friend: true, name: 'Sam', outcome: 'loss' }), T('2026-09-15T10:00:00Z'));
  p = play(p, room('m3', { friend: true, name: 'Priya', outcome: 'draw' }), T('2026-09-13T10:00:00Z'));
  p = play(p, room('m4', { outcome: 'win' }), T('2026-09-16T10:00:00Z'));
  p = play(p, room('m5', { friend: true }), T('2026-09-12T10:00:00Z'));
  // Simulate the requested journal change: the field the lead will add to recordRoom.
  const named = {
    ...p,
    journal: {
      ...p.journal,
      matches: p.journal.matches.map((m) => {
        const r = { m1: 'Sam', m2: '  sam ', m3: 'Priya', m4: 'Coach' }[m.id];
        return r ? { ...m, opponentName: r } : m;
      }),
    },
  };
  // The sanitiser keeps the extra field, so the rows survive a reload.
  const reloaded = readProfile(JSON.parse(JSON.stringify(named)));
  assert.equal(reloaded.journal.matches.find((m) => m.id === 'm1').opponentName, 'Sam');
  const r = rivals(reloaded);
  assert.equal(r.reason, null);
  assert.equal(r.friendDuels, 4);
  assert.equal(r.unnamed, 1);
  // Case-folded to one rival, shown with the spelling from the most recent duel.
  assert.deepEqual(r.rows, [
    {
      name: 'sam',
      wins: 1,
      losses: 1,
      draws: 0,
      played: 2,
      lastAt: T('2026-09-15T10:00:00Z'),
      lastOutcome: 'loss',
    },
    {
      name: 'Priya',
      wins: 0,
      losses: 0,
      draws: 1,
      played: 1,
      lastAt: T('2026-09-13T10:00:00Z'),
      lastOutcome: 'draw',
    },
  ]);
  // The bot duel named "Coach" is not a rival, however it is labelled.
  assert.ok(!r.rows.some((row) => row.name === 'Coach'));
  const avail = boardsAvailable(reloaded);
  assert.equal(avail.friends, true);
  assert.equal(avail.rivalCount, 2);
  assert.equal(avail.friendDuels, 4);
});

test('cleanOpponentName trims, collapses whitespace, caps at 24 chars and refuses non-strings', () => {
  assert.equal(cleanOpponentName('  Sam   Jones '), 'Sam Jones');
  assert.equal(cleanOpponentName('x'.repeat(40)).length, 24);
  assert.equal(cleanOpponentName('   '), null);
  assert.equal(cleanOpponentName(42), null);
  assert.equal(cleanOpponentName(undefined), null);
});

test('youVsYou compares this ISO week with last week from real journal data, with honest deltas', () => {
  const now = T('2026-09-16T12:00:00Z'); // Wednesday, 2026-W38
  let p = emptyProfile();
  // Last week (W37): two duels, one win, 1/2 correct, Cricket.
  p = play(p, room('l1', { outcome: 'win', correct: true, topic: 'Cricket' }), T('2026-09-08T10:00:00Z'));
  p = play(p, room('l2', { outcome: 'loss', correct: false, topic: 'Cricket' }), T('2026-09-10T10:00:00Z'));
  // This week (W38): three duels, two wins, 3/3 correct, Football twice + Cricket once, one friend duel.
  p = play(p, room('t1', { outcome: 'win', topic: 'Football' }), T('2026-09-14T09:00:00Z'));
  p = play(p, room('t2', { outcome: 'win', topic: 'Football', friend: true, name: 'Sam' }), T('2026-09-15T09:00:00Z'));
  p = play(p, room('t3', { outcome: 'draw', topic: 'Cricket' }), T('2026-09-16T09:00:00Z'));
  // Two weeks ago: must not count anywhere.
  p = play(p, room('old', { outcome: 'win' }), T('2026-09-01T09:00:00Z'));
  const y = youVsYou(p, { at: now, tzOffsetMinutes: 0 });
  assert.equal(y.weekKey, '2026-W38');
  assert.equal(y.lastWeekKey, '2026-W37');
  assert.equal(y.empty, false);
  assert.deepEqual(y.week, {
    weekKey: '2026-W38',
    played: 3,
    wins: 2,
    losses: 0,
    draws: 1,
    friendDuels: 1,
    answered: 3,
    correct: 3,
    accuracy: 100,
    bestSport: { topic: 'Football', correct: 2, answered: 2 },
  });
  assert.deepEqual(y.last, {
    weekKey: '2026-W37',
    played: 2,
    wins: 1,
    losses: 1,
    draws: 0,
    friendDuels: 0,
    answered: 2,
    correct: 1,
    accuracy: 50,
    bestSport: { topic: 'Cricket', correct: 1, answered: 2 },
  });
  assert.deepEqual(y.delta, { played: 1, wins: 1, friendDuels: 1, answered: 1, accuracy: 50 });
  // An empty profile compares nothing to nothing: accuracy delta is null, not zero.
  const blank = youVsYou(emptyProfile(), { at: now });
  assert.equal(blank.empty, true);
  assert.equal(blank.delta.accuracy, null);
  assert.equal(blank.week.bestSport, null);
  // The local offset moves a Sunday-night duel into the next week.
  let q = emptyProfile();
  q = play(q, room('s1'), T('2026-09-13T23:30:00Z'));
  assert.equal(youVsYou(q, { at: now, tzOffsetMinutes: 0 }).week.played, 0);
  assert.equal(youVsYou(q, { at: now, tzOffsetMinutes: -120 }).week.played, 1);
});

test('boardsAvailable is honest: leagues and global stay off until accounts are live', () => {
  assert.equal(ACCOUNTS_LIVE, false);
  const a = boardsAvailable(emptyProfile());
  assert.equal(a.friends, false);
  assert.equal(a.leagues, false);
  assert.equal(a.global, false);
  assert.equal(a.friendDuels, 0);
  assert.match(a.reason, /accounts/);
  assert.deepEqual(boardsAvailable(null).rivalCount, 0);
});
