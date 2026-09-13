import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as analytics from '../lib/analytics.mjs';
import {
  emptyAnalytics,
  readAnalytics,
  reduceAnalytics,
  retention,
  dailySeries,
  summary,
  exportAnalytics,
  toCsv,
  dayKey,
  dayIndex,
  daysBetween,
  SESSION_GAP_MS,
  DAY_LIMIT,
  SAMPLE_CAVEAT,
  SESSION_NOTE,
  ANALYTICS_VERSION,
} from '../lib/analytics.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { emptyProgression } from '../lib/progression.mjs';
// Local-time timestamps keep every day key stable in any timezone, as in tests/events.test.mjs.
const T = (y, m, d, h = 12, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();
const DAY0 = T(2026, 1, 5, 9);
const open = (a, at) => reduceAnalytics(a, { type: 'open' }, at);
const beat = (a, ms, at) => reduceAnalytics(a, { type: 'beat', ms }, at);
const count = (a, delta, at) => reduceAnalytics(a, { type: 'count', ...delta }, at);
const day = (a, key) => a.days[key] ?? null;
/** A device that opened on 5 Jan 2026 at 09:00 and nothing else. */
const installed = () => open(emptyAnalytics(), DAY0);
// -----------------------------------------------------------------------------------------------
test('dayKey reads the local calendar day and lines up with the events.mjs day index', () => {
  assert.equal(dayKey(T(2026, 1, 5, 9)), '2026-01-05');
  assert.equal(dayKey(T(2026, 1, 5, 0, 0)), '2026-01-05');
  assert.equal(dayKey(T(2026, 1, 5, 23, 59)), '2026-01-05');
  assert.equal(dayKey(T(2026, 1, 6, 0, 1)), '2026-01-06');
  assert.equal(dayIndex(dayKey(T(2026, 1, 6))) - dayIndex(dayKey(T(2026, 1, 5))), 1);
  assert.equal(daysBetween('2026-01-05', '2026-02-04'), 30);
  assert.equal(daysBetween('2026-02-30', '2026-03-01'), null);
  for (const bad of [Number.NaN, Infinity, null, 'today']) assert.equal(dayKey(bad), null);
});
test('the first open records the install day, the first session and the first-open stamp', () => {
  const a = installed();
  assert.equal(a.installDay, '2026-01-05');
  assert.equal(a.installedAt, DAY0);
  assert.equal(a.lastDay, '2026-01-05');
  assert.equal(a.lastBeatAt, DAY0);
  assert.deepEqual(day(a, '2026-01-05'), { sessions: 1, ms: 0, rounds: 0, matches: 0, cards: 0, quests: 0 });
  assert.equal(a.totals.sessions, 1);
  assert.equal(a.funnel.firstOpenAt, DAY0);
  assert.equal(a.funnel.firstReturnAt, 0, 'installing is not a return');
  assert.ok(Object.isFrozen(a) && Object.isFrozen(a.days) && Object.isFrozen(a.days['2026-01-05']));
});
test('a session splits on the 30-minute gap and not one millisecond before', () => {
  const a = installed();
  const edge = open(a, DAY0 + SESSION_GAP_MS);
  assert.equal(day(edge, '2026-01-05').sessions, 1, 'exactly the gap is still the same session');
  const split = open(edge, DAY0 + SESSION_GAP_MS + SESSION_GAP_MS + 1);
  assert.equal(day(split, '2026-01-05').sessions, 2);
  assert.equal(split.totals.sessions, 2);
});
test('a heartbeat keeps one long session from being counted twice', () => {
  let a = installed();
  for (let i = 1; i <= 240; i++) a = beat(a, 15_000, DAY0 + i * 15_000); // one hour of 15 s beats
  a = open(a, DAY0 + 60 * 60 * 1000 + 1000);
  assert.equal(day(a, '2026-01-05').sessions, 1);
  assert.equal(day(a, '2026-01-05').ms, 240 * 15_000);
});
test('a backgrounded beat can never add more than the session gap', () => {
  const a = beat(installed(), 8 * 60 * 60 * 1000, DAY0 + 8 * 60 * 60 * 1000);
  assert.equal(day(a, '2026-01-05').ms, SESSION_GAP_MS);
  assert.equal(a.totals.ms, SESSION_GAP_MS);
  // Fractions are floored and nothing negative or unreal is ever credited.
  assert.equal(day(beat(a, 1500.9, DAY0), '2026-01-05').ms, SESSION_GAP_MS + 1500);
  for (const bad of [0, -1, Number.NaN, Infinity, '5000', null, undefined])
    assert.strictEqual(beat(a, bad, DAY0), a);
});
test('a day rolls over at local midnight, and the new day starts a new session', () => {
  let a = open(emptyAnalytics(), T(2026, 1, 5, 23, 50));
  a = beat(a, 300_000, T(2026, 1, 5, 23, 55));
  a = open(a, T(2026, 1, 6, 0, 5)); // 15 minutes later: inside the gap, but a different day
  assert.equal(day(a, '2026-01-05').sessions, 1);
  assert.equal(day(a, '2026-01-06').sessions, 1);
  assert.equal(a.totals.sessions, 2);
  a = beat(a, 60_000, T(2026, 1, 6, 0, 6));
  assert.equal(day(a, '2026-01-05').ms, 300_000);
  assert.equal(day(a, '2026-01-06').ms, 60_000);
  assert.equal(a.lastDay, '2026-01-06');
});
test('the install day and its timestamp are set once and never move', () => {
  let a = installed();
  a = open(a, T(2026, 1, 9, 10));
  a = open(a, T(2026, 2, 1, 10));
  assert.equal(a.installDay, '2026-01-05');
  assert.equal(a.installedAt, DAY0);
  assert.equal(a.funnel.firstOpenAt, DAY0);
});
test('firstReturnAt is stamped on the first later day only', () => {
  let a = open(installed(), DAY0 + 3 * SESSION_GAP_MS);
  assert.equal(a.funnel.firstReturnAt, 0, 'a second session on the install day is not a return');
  const returned = T(2026, 1, 6, 9);
  a = open(a, returned);
  assert.equal(a.funnel.firstReturnAt, returned);
  a = open(a, T(2026, 1, 7, 9));
  assert.equal(a.funnel.firstReturnAt, returned, 'later returns never overwrite the first');
});
test('counters add to the day and to lifetime totals, and stamp each funnel step once', () => {
  const first = T(2026, 1, 5, 10);
  let a = count(installed(), { rounds: 3, matches: 1 }, first);
  assert.equal(day(a, '2026-01-05').rounds, 3);
  assert.equal(day(a, '2026-01-05').matches, 1);
  assert.equal(a.funnel.firstAnswerAt, first);
  assert.equal(a.funnel.firstMatchAt, first);
  assert.equal(a.funnel.firstExpeditionAt, 0);
  const later = T(2026, 1, 6, 10);
  a = count(a, { rounds: 2, cards: 4, quests: 1 }, later);
  assert.equal(a.funnel.firstAnswerAt, first, 'the first answer stamp never moves');
  assert.equal(a.funnel.firstExpeditionAt, later);
  assert.deepEqual(a.totals, { sessions: 1, ms: 0, rounds: 5, matches: 1, cards: 4, quests: 1 });
  assert.deepEqual(day(a, '2026-01-06'), {
    sessions: 0,
    ms: 0,
    rounds: 2,
    matches: 0,
    cards: 4,
    quests: 1,
  });
});
test('counts ignore anything that is not a positive number', () => {
  const a = installed();
  for (const bad of [{}, { rounds: 0 }, { rounds: -5 }, { rounds: Number.NaN }, { matches: '2' }, { xp: 9 }])
    assert.strictEqual(count(a, bad, DAY0), a);
  assert.equal(day(count(a, { rounds: 2.9 }, DAY0), '2026-01-05').rounds, 2);
});
test('d1, d7 and d30 read null until their day is over, then true or false', () => {
  const a = installed();
  const at = (n, h = 9) => T(2026, 1, 5 + n, h);
  assert.deepEqual(pick(retention(a, DAY0)), { d1: null, d7: null, d30: null });
  assert.deepEqual(pick(retention(a, at(1))), { d1: null, d7: null, d30: null }, 'day 1 is not over');
  assert.deepEqual(pick(retention(a, at(2))), { d1: false, d7: null, d30: null });
  const back = open(a, at(1));
  assert.deepEqual(pick(retention(back, at(1))), { d1: true, d7: null, d30: null });
  assert.deepEqual(pick(retention(back, at(9))), { d1: true, d7: false, d30: null });
  const week = open(back, at(7));
  assert.deepEqual(pick(retention(week, at(9))), { d1: true, d7: true, d30: null });
  const month = open(week, at(30));
  assert.deepEqual(pick(retention(month, at(30))), { d1: true, d7: true, d30: true });
  assert.deepEqual(pick(retention(open(week, at(31)), at(40))), { d1: true, d7: true, d30: false });
  // Never an implicit answer: no install day, or an unusable clock, is unknown rather than false.
  assert.deepEqual(pick(retention(emptyAnalytics(), DAY0)), { d1: null, d7: null, d30: null });
  assert.deepEqual(pick(retention(a, Number.NaN)), { d1: null, d7: null, d30: null });
});
const pick = (r) => ({ d1: r.d1, d7: r.d7, d30: r.d30 });
test('a day that has aged out of the 120-day record reads null, never false', () => {
  const a = readAnalytics({
    ...emptyAnalytics(),
    installDay: '2026-01-05',
    installedAt: DAY0,
    days: { '2026-06-01': { sessions: 1 } },
  });
  assert.deepEqual(pick(retention(a, T(2026, 6, 2))), { d1: null, d7: null, d30: null });
});
test('retention counts active days, sessions per active day and a median session estimate', () => {
  let a = installed();
  a = beat(a, 600_000, T(2026, 1, 5, 9, 10));
  a = open(a, T(2026, 1, 5, 12));
  a = open(a, T(2026, 1, 6, 9));
  a = beat(a, 100_000, T(2026, 1, 6, 9, 2));
  const r = retention(a, T(2026, 1, 6, 18));
  assert.equal(r.installDay, '2026-01-05');
  assert.equal(r.daysSinceInstall, 1);
  assert.equal(r.activeDays, 2);
  assert.equal(r.sessionsPerActiveDay, 1.5);
  assert.equal(r.medianSessionMs, 200_000, 'median of each day average: 600000/2 and 100000/1');
  assert.equal(r.totalMs, 700_000);
  const fresh = retention(emptyAnalytics(), DAY0);
  assert.deepEqual(
    { ...fresh },
    {
      installDay: null,
      daysSinceInstall: 0,
      activeDays: 0,
      d1: null,
      d7: null,
      d30: null,
      sessionsPerActiveDay: 0,
      medianSessionMs: null,
      totalMs: 0,
    },
  );
});
test('the day record keeps the most recent 120 days and the lifetime totals survive the trim', () => {
  let a = emptyAnalytics();
  for (let i = 0; i < 130; i++) a = open(a, T(2026, 1, 5, 9) + i * 864e5);
  const keys = Object.keys(a.days);
  assert.equal(keys.length, DAY_LIMIT);
  assert.deepEqual(keys, [...keys].sort(), 'kept oldest first so a CSV or a chart reads in calendar order');
  assert.equal(keys[0], '2026-01-15', '10 days trimmed from the front');
  assert.equal(keys[keys.length - 1], '2026-05-14');
  assert.equal(a.totals.sessions, 130);
  assert.equal(a.installDay, '2026-01-05', 'the install day outlives its day entry');
  assert.equal(retention(a, T(2026, 5, 14)).activeDays, DAY_LIMIT);
});
test('readAnalytics fills defaults, clamps every integer and drops anything unrecognised', () => {
  assert.deepEqual(readAnalytics(null), emptyAnalytics());
  assert.deepEqual(readAnalytics('nope'), emptyAnalytics());
  assert.deepEqual(readAnalytics({ version: 2 }), emptyAnalytics());
  assert.deepEqual(readAnalytics({ ...emptyAnalytics(), days: 'nope' }), emptyAnalytics());
  const a = readAnalytics({
    version: ANALYTICS_VERSION,
    installDay: '2026-01-05',
    installedAt: -12,
    lastDay: 'yesterday',
    lastBeatAt: 1.5,
    days: {
      '2026-01-05': { sessions: 2, ms: 5000, rounds: -3, matches: 1.5, cards: null, quests: 2, evil: 9 },
      '2026-02-30': { sessions: 9 },
      __proto__: { sessions: 9 },
      nope: { sessions: 9 },
      '2026-01-06': { sessions: 0, ms: 0, rounds: 0, matches: 0, cards: 0, quests: 0 },
    },
    totals: { sessions: 1, ms: 'lots' },
    funnel: { firstOpenAt: 100, firstAnswerAt: -1, nonsense: 5 },
    consent: 'maybe',
    anonId: 'NOTHEX',
    evil: true,
  });
  assert.deepEqual(Object.keys(a.days), ['2026-01-05'], 'unreal and all-zero days are dropped');
  assert.deepEqual(a.days['2026-01-05'], {
    sessions: 2,
    ms: 5000,
    rounds: 0,
    matches: 0,
    cards: 0,
    quests: 2,
  });
  assert.equal(a.installedAt, 0);
  assert.equal(a.lastDay, null);
  assert.equal(a.lastBeatAt, 0);
  assert.equal(a.totals.sessions, 2, 'totals are raised to what the retained days show');
  assert.equal(a.totals.ms, 5000);
  assert.equal(a.funnel.firstAnswerAt, 0);
  assert.equal(a.consent, 'unset');
  assert.equal(a.anonId, null);
  assert.ok(!('evil' in a) && !('nonsense' in a.funnel) && !('evil' in a.days['2026-01-05']));
  assert.equal(Object.getPrototypeOf(a.days['2026-01-05']), Object.prototype);
});
test('the anonymous cohort id is only ever kept alongside consent, and only as 32 hex characters', () => {
  const id = 'a'.repeat(32);
  const withConsent = (consent, anonId) => readAnalytics({ ...emptyAnalytics(), consent, anonId }).anonId;
  assert.equal(withConsent('granted', id), id);
  assert.equal(withConsent('denied', id), null);
  assert.equal(withConsent('unset', id), null);
  assert.equal(withConsent('granted', 'A'.repeat(32)), null);
  assert.equal(withConsent('granted', 'a'.repeat(31)), null);
  assert.equal(withConsent('granted', 123), null);
  assert.equal(readAnalytics({ ...emptyAnalytics(), consent: 'granted' }).consent, 'granted');
  // Nothing in this module can grant consent or mint an id: that belongs to the opt-in cohort beacon.
  assert.equal(
    reduceAnalytics(emptyAnalytics(), { type: 'consent', consent: 'granted' }, DAY0).consent,
    'unset',
  );
});
test('a recorded state survives a JSON round trip and sanitises back to itself', () => {
  let a = installed();
  a = beat(a, 90_000, DAY0 + 60_000);
  a = count(a, { rounds: 4, matches: 1, cards: 2, quests: 1 }, DAY0 + 120_000);
  a = open(a, T(2026, 1, 8, 9));
  assert.deepEqual(readAnalytics(JSON.parse(JSON.stringify(a))), a);
  assert.deepEqual(readAnalytics(a), a);
  assert.deepEqual(readAnalytics(readAnalytics(a)), readAnalytics(a));
});
test('the reducer returns the same reference whenever nothing was recorded', () => {
  const a = installed();
  assert.strictEqual(open(a, DAY0), a, 'a repeated open inside the same session changes nothing');
  assert.strictEqual(reduceAnalytics(a, { type: 'nope' }, DAY0 + 1), a);
  assert.strictEqual(reduceAnalytics(a, null, DAY0 + 1), a);
  assert.strictEqual(reduceAnalytics(a, { type: 'open' }, Number.NaN), a, 'a bad clock records nothing');
  assert.strictEqual(reduceAnalytics(a, { type: 'open' }, 'now'), a);
  assert.strictEqual(count(a, {}, DAY0), a);
  assert.strictEqual(beat(a, 0, DAY0), a);
  // A later open inside the same session still moves the gap marker, so it is a real change.
  assert.notStrictEqual(open(a, DAY0 + 1000), a);
});
test('dailySeries runs oldest first, fills the quiet days with zeros and never runs past the cap', () => {
  let a = installed();
  a = count(a, { rounds: 4 }, DAY0);
  a = open(a, T(2026, 1, 7, 9));
  const series = dailySeries(a, T(2026, 1, 7, 20), 5);
  assert.deepEqual(
    series.map((d) => d.day),
    ['2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07'],
  );
  assert.deepEqual(
    series.map((d) => d.active),
    [false, false, true, false, true],
  );
  assert.deepEqual(series[2], { day: '2026-01-05', sessions: 1, ms: 0, rounds: 4, active: true });
  assert.deepEqual(series[3], { day: '2026-01-06', sessions: 0, ms: 0, rounds: 0, active: false });
  assert.equal(dailySeries(a, DAY0).length, 30, 'the default window is 30 days');
  assert.equal(dailySeries(a, DAY0, 9999).length, DAY_LIMIT);
  assert.equal(dailySeries(a, DAY0, 0).length, 30);
  assert.equal(dailySeries(a, Number.NaN).length, 0);
  assert.ok(Object.isFrozen(series) && Object.isFrozen(series[0]));
});
test('summary states its sample size of one and never offers a rate', () => {
  const a = open(installed(), T(2026, 1, 6, 9));
  const s = summary(a, T(2026, 1, 6, 20));
  assert.equal(s.sampleSize, 1);
  assert.equal(s.caveat, SAMPLE_CAVEAT);
  assert.match(s.caveat, /sample of one/);
  assert.match(s.caveat, /rate needs a cohort/);
  assert.equal(s.sessionGapMs, SESSION_GAP_MS);
  assert.match(s.sessionNote, /30 minutes/);
  assert.equal(s.sessionNote, SESSION_NOTE);
  assert.deepEqual(s.returned, { d1: true, d7: null, d30: null });
  assert.equal(s.installDay, '2026-01-05');
  assert.equal(s.activeDays, 2);
  assert.equal(s.sessions, 2);
  assert.equal(s.consent, 'unset');
  assert.ok(!('anonId' in s), 'the dashboard never needs the cohort id');
  for (const value of Object.values(s.returned))
    assert.ok(value === true || value === false || value === null);
  // No export, and no key the dashboard reads, may be named like a rate or a percentage.
  for (const name of [...Object.keys(analytics), ...Object.keys(s)])
    assert.doesNotMatch(name, /rate|percent|churn/i, name);
});
test('the player can export everything recorded about them, as data and as a CSV', () => {
  let a = installed();
  a = beat(a, 60_000, DAY0 + 60_000);
  a = count(a, { rounds: 2, cards: 1 }, DAY0 + 120_000);
  a = open(a, T(2026, 1, 6, 9));
  const dump = exportAnalytics(a);
  assert.deepEqual(readAnalytics(dump), a, 'the export is the record, not a summary of it');
  assert.deepEqual(dump, JSON.parse(JSON.stringify(dump)));
  assert.ok(!Object.isFrozen(dump), 'the export is the player copy, theirs to edit');
  const lines = toCsv(a).trim().split('\n');
  assert.equal(lines[0], 'day,sessions,ms,rounds,matches,cards,quests');
  assert.equal(lines.length, 1 + Object.keys(a.days).length);
  assert.equal(lines[1], '2026-01-05,1,60000,2,0,1,0');
  assert.equal(lines[2], '2026-01-06,1,0,0,0,0,0');
  assert.equal(toCsv(emptyAnalytics()), 'day,sessions,ms,rounds,matches,cards,quests\n');
  for (const line of lines) assert.doesNotMatch(line, /[";]/, 'every cell is a day key or an integer');
});
test('the profile carries the record, sanitises it and clears it on reset', () => {
  const act = (p, a) => reduceProfile(p, { epoch: p.epoch, at: DAY0, ...a });
  assert.deepEqual(emptyProfile().analytics, emptyAnalytics());
  assert.equal(emptyProfile().version, 2);
  let p = act(emptyProfile(), { type: 'analytics-open' });
  assert.equal(p.analytics.totals.sessions, 1);
  assert.equal(p.revision, 1);
  assert.deepEqual(p.progression, emptyProgression(), 'measurement never pays XP');
  assert.strictEqual(act(p, { type: 'analytics-open' }), p, 'an unchanged record keeps the profile');
  assert.strictEqual(
    reduceProfile(p, { type: 'analytics-open', epoch: 'other-epoch', at: DAY0 + 60_000 }),
    p,
    'the epoch guard holds for analytics too',
  );
  p = act(p, { type: 'analytics-beat', ms: 15_000 });
  p = act(p, { type: 'analytics-count', rounds: 3, matches: 1, cards: 2, quests: 1 });
  assert.deepEqual(p.analytics.totals, {
    sessions: 1,
    ms: 15_000,
    rounds: 3,
    matches: 1,
    cards: 2,
    quests: 1,
  });
  assert.equal(p.analytics.funnel.firstMatchAt, DAY0);
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
  assert.deepEqual(readProfile({ ...emptyProfile(), analytics: 'nope' }).analytics, emptyAnalytics());
  assert.deepEqual(
    readProfile({ ...emptyProfile(), analytics: { version: 9, days: { '2026-01-05': { sessions: 5 } } } })
      .analytics,
    emptyAnalytics(),
  );
  const fresh = reduceProfile(p, { type: 'reset', newEpoch: 'fresh', at: T(2026, 1, 6) });
  assert.deepEqual(fresh.analytics, emptyAnalytics(), 'a reset erases the record with everything else');
  assert.equal(fresh.version, 2);
});
test('the record reads the same in every timezone, east and west of UTC', () => {
  const moduleUrl = new URL('../lib/analytics.mjs', import.meta.url).href;
  const probe = `
    import { emptyAnalytics, reduceAnalytics, retention, dayKey } from ${JSON.stringify(moduleUrl)};
    const at = (y, m, d, h, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();
    const open = (a, t) => reduceAnalytics(a, { type: 'open' }, t);
    let a = open(emptyAnalytics(), at(2026, 1, 5, 23, 50));
    a = reduceAnalytics(a, { type: 'beat', ms: 60000 }, at(2026, 1, 5, 23, 55));
    a = open(a, at(2026, 1, 6, 0, 5));
    a = open(a, at(2026, 1, 12, 9));
    const r = retention(a, at(2026, 1, 14, 9));
    process.stdout.write(
      JSON.stringify({
        offset: new Date(at(2026, 1, 5, 12)).getTimezoneOffset(),
        installDay: a.installDay,
        days: Object.keys(a.days),
        sessions: a.totals.sessions,
        midnightMs: a.days['2026-01-05'].ms,
        boundary: [dayKey(at(2026, 1, 5, 23, 59)), dayKey(at(2026, 1, 6, 0, 0))],
        d1: r.d1,
        d7: r.d7,
        d30: r.d30,
        daysSinceInstall: r.daysSinceInstall,
      }),
    );
  `;
  const zones = ['UTC', 'Pacific/Kiritimati', 'Pacific/Niue', 'Asia/Kolkata', 'America/Los_Angeles'];
  const seen = zones.map((TZ) =>
    JSON.parse(
      execFileSync(process.execPath, ['--input-type=module', '-e', probe], {
        env: { ...process.env, TZ },
        encoding: 'utf8',
      }),
    ),
  );
  const expected = {
    installDay: '2026-01-05',
    days: ['2026-01-05', '2026-01-06', '2026-01-12'],
    sessions: 3,
    midnightMs: 60_000,
    boundary: ['2026-01-05', '2026-01-06'],
    d1: true,
    d7: true,
    d30: null,
    daysSinceInstall: 9,
  };
  for (const [i, got] of seen.entries()) {
    const { offset, ...rest } = got;
    assert.deepEqual(rest, expected, zones[i]);
    assert.equal(typeof offset, 'number');
  }
  assert.ok(new Set(seen.map((s) => s.offset)).size >= 4, 'the zones really do disagree about local time');
});
test('the module talks to nobody: no network, no storage, no clock inside a function body', () => {
  const source = readFileSync(new URL('../lib/analytics.mjs', import.meta.url), 'utf8');
  // Comments may discuss the clock and the network; the code may not touch either.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
  for (const forbidden of [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /sendBeacon/,
    /WebSocket/,
    /EventSource/,
    /localStorage/,
    /sessionStorage/,
    /indexedDB/,
    /document\./,
    /navigator\./,
    /require\s*\(/,
    /process\./,
  ])
    assert.doesNotMatch(code, forbidden, String(forbidden));
  // Date.now() appears only as a default argument, so every function is deterministic under test.
  assert.doesNotMatch(code.replaceAll('= Date.now()', ''), /Date\.now\s*\(/);
  assert.match(source, /import \{ dayIndex, dayIso \} from '\.\/events\.mjs'/);
});
