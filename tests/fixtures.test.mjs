/**
 * Fixture mode: the Kick-off set, the Full-time set, the free "Yesterday" recap and the next-fixture
 * hook, all cut from the static calendar with the player's own timezone offset passed in.
 *
 * What matters: the windows are exact at their boundaries in any timezone; the recap is for
 * yesterday, never the day before; served sports come first; the deals are deterministic and disjoint
 * per event; the duel service refuses a hidden, unknown or out-of-window set with one message; and
 * the wallet's free recap is once per local day and survives a round trip.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KICKOFF_WINDOW_MS,
  FULLTIME_WINDOW_MS,
  RECAP_WINDOW_DAYS,
  FIXTURE_KINDS,
  FIXTURE_SIZE,
  SERVED_TOPICS,
  localDay,
  startAt,
  endAt,
  fixtureOpen,
  fixturesAt,
  fixtureSet,
  fixtureEventById,
  fixtureLabel,
  countdownCopy,
} from '../lib/fixtures.mjs';
import { ACTIVE_EVENTS, EVENTS, dayIndex, dayIso, readEvents } from '../lib/events.mjs';
import { QUESTIONS } from '../lib/server/bank.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';
import { DEFAULT_CONFIG, emptyWallet, enterRecap, enterPractice, readWallet, recapFreeToday } from '../lib/economy/economy.mjs';

const DAY = 864e5,
  HOUR = 36e5;
const IST = -330, // India, UTC+5:30, as getTimezoneOffset reports it
  LA = 420; // Los Angeles in summer, UTC-7

/* ------------------------------------------------------------------ synthetic calendar */

const TODAY = dayIndex('2026-06-15');
const D = (offset) => dayIso(TODAY + offset);
const ev = (id, over = {}) => ({
  id,
  name: `Fixture ${id}`,
  domain: 'sports',
  topic: 'Cricket',
  start: D(0),
  end: D(0),
  blurb: 'Synthetic.',
  whyQuiz: 'Synthetic.',
  sourceUrl: 'https://example.org/fixture',
  ...over,
});
const one = (id, over) => readEvents([ev(id, over)])[0];

/* ------------------------------------------------------------------ windows */

test('the windows are what the constants say', () => {
  assert.equal(KICKOFF_WINDOW_MS, 24 * HOUR);
  assert.equal(FULLTIME_WINDOW_MS, 24 * HOUR);
  assert.equal(RECAP_WINDOW_DAYS, 1);
  assert.deepEqual([...FIXTURE_KINDS], ['kickoff', 'fulltime', 'recap']);
  assert.deepEqual({ ...FIXTURE_SIZE }, { kickoff: 10, fulltime: 10, recap: 5 });
});

test('kick-off and full-time are exact at both ends, in the player’s own local time', () => {
  const e = one('single', { start: '2026-06-20', end: '2026-06-20' });
  for (const tz of [0, IST, LA]) {
    const start = startAt(e, tz),
      end = endAt(e, tz);
    assert.equal(start, dayIndex('2026-06-20') * DAY + tz * 60_000, 'local midnight');
    assert.equal(end - start, DAY, 'a one-day event ends at the next local midnight');
    const o = (kind, at) => fixtureOpen(e, kind, at, { tzOffsetMinutes: tz });
    assert.equal(o('kickoff', start - KICKOFF_WINDOW_MS - 1), false, 'a millisecond too early');
    assert.equal(o('kickoff', start - KICKOFF_WINDOW_MS), true, 'exactly 24h before');
    assert.equal(o('kickoff', start - 1), true, 'the last millisecond before kick-off');
    assert.equal(o('kickoff', start), false, 'closed the instant the day begins');
    assert.equal(o('fulltime', end - 1), false, 'not yet over');
    assert.equal(o('fulltime', end), true, 'open the instant the last day ends');
    assert.equal(o('fulltime', end + FULLTIME_WINDOW_MS - 1), true);
    assert.equal(o('fulltime', end + FULLTIME_WINDOW_MS), false, 'closed 24h later');
  }
  // The same instant is a different local day in India and in Los Angeles.
  const late = Date.UTC(2026, 5, 19, 20, 0); // 19 Jun 20:00 UTC = 20 Jun 01:30 IST = 19 Jun 13:00 LA
  assert.equal(fixtureOpen(e, 'kickoff', late, { tzOffsetMinutes: IST }), false, 'already started in India');
  assert.equal(fixtureOpen(e, 'kickoff', late, { tzOffsetMinutes: LA }), true, 'still the day before in LA');
  assert.equal(localDay(late, IST), dayIndex('2026-06-20'));
  assert.equal(localDay(late, LA), dayIndex('2026-06-19'));
  assert.equal(fixtureOpen(e, 'sideways', late, {}), false, 'an unknown kind is never open');
  assert.equal(fixtureOpen(null, 'kickoff', late, {}), false);
});

test('the recap is for yesterday in the local day, not today and not two days ago', () => {
  const e = one('ended', { start: '2026-06-10', end: '2026-06-14' });
  const at = (iso, hour, tz) => dayIndex(iso) * DAY + hour * HOUR + tz * 60_000;
  for (const tz of [0, IST, LA]) {
    assert.equal(fixtureOpen(e, 'recap', at('2026-06-14', 23, tz), { tzOffsetMinutes: tz }), false, 'still on');
    assert.equal(fixtureOpen(e, 'recap', at('2026-06-15', 0, tz), { tzOffsetMinutes: tz }), true, 'from midnight');
    assert.equal(fixtureOpen(e, 'recap', at('2026-06-15', 23.99, tz), { tzOffsetMinutes: tz }), true, 'all day');
    assert.equal(fixtureOpen(e, 'recap', at('2026-06-16', 0, tz), { tzOffsetMinutes: tz }), false, 'two days ago');
  }
  const list = [
    ev('yesterday', { start: D(-3), end: D(-1) }),
    ev('two-days', { start: D(-5), end: D(-2) }),
    ev('today', { start: D(-1), end: D(0) }),
  ];
  const f = fixturesAt(TODAY * DAY + 9 * HOUR, { tzOffsetMinutes: 0, list });
  assert.equal(f.recap.id, 'yesterday');
  assert.deepEqual(
    f.fulltime.map((x) => x.id),
    ['yesterday'],
    'the full-time set and the recap share the day after',
  );
});

test('fixturesAt prefers served sports and lists what is open, soonest first', () => {
  const list = [
    ev('tennis-yesterday', { topic: 'Tennis', start: D(-2), end: D(-1) }),
    ev('cricket-yesterday', { topic: 'Cricket', start: D(-6), end: D(-1) }),
    ev('f1-yesterday', { topic: 'Formula 1', start: D(-1), end: D(-1) }),
    ev('kick-tomorrow', { topic: 'Football', start: D(1), end: D(1) }),
    ev('tennis-tomorrow', { topic: 'Tennis', start: D(1), end: D(3) }),
    ev('later', { topic: 'Baseball', start: D(9), end: D(12) }),
    ev('science', { domain: 'science', topic: 'Space', start: D(1), end: D(1) }),
  ];
  const f = fixturesAt(TODAY * DAY + 9 * HOUR, { tzOffsetMinutes: 0, list });
  assert.equal(f.recap.id, 'f1-yesterday', 'served sport first, then the shorter entry');
  assert.deepEqual(f.kickoff.map((x) => x.id), ['kick-tomorrow'], 'tennis and science never get a set');
  assert.deepEqual(f.fulltime.map((x) => x.id), ['f1-yesterday', 'cricket-yesterday']);
  assert.equal(f.next.id, 'kick-tomorrow');
  assert.ok(Object.isFrozen(f) && Object.isFrozen(f.kickoff));

  const onlyTennis = fixturesAt(TODAY * DAY, { list: [ev('t', { topic: 'Tennis', start: D(-2), end: D(-1) })] });
  assert.equal(onlyTennis.recap.id, 't', 'an unserved sport is still a recap of last resort');
  assert.equal(onlyTennis.next, null);
  assert.deepEqual(fixturesAt(NaN, { list }), { kickoff: [], fulltime: [], recap: null, next: null });
  assert.deepEqual(fixturesAt(TODAY * DAY, { list: 'junk' }), { kickoff: [], fulltime: [], recap: null, next: null });
});

test('the real calendar: the Madrid GP recap the morning after, and Baku as the next fixture', () => {
  const at = Date.UTC(2026, 8, 14, 12); // 14 Sep 2026 noon UTC
  const f = fixturesAt(at, { tzOffsetMinutes: 0 });
  assert.equal(f.recap.id, 'f1-2026-spanish-gp-madrid');
  assert.ok(f.fulltime.some((x) => x.id === 'f1-2026-spanish-gp-madrid'));
  assert.ok(f.fulltime.some((x) => x.id === 'womens-t20-asia-cup-2026'));
  assert.ok(!f.fulltime.some((x) => x.id === 'us-open-tennis-2026'), 'tennis has no served bank');
  assert.equal(f.next.id, 'f1-2026-azerbaijan-gp');
  assert.equal(countdownCopy(f.next, at, { tzOffsetMinutes: 0 }), 'Starts in 10 days');
  assert.equal(fixtureEventById('f1-2026-azerbaijan-gp').topic, 'Formula 1');
  assert.equal(fixtureEventById('nobel-physics-2026'), undefined, 'hidden domain');
  assert.equal(fixtureEventById('no-such-event'), undefined);
  assert.equal(fixtureEventById(['f1-2026-azerbaijan-gp']), undefined);
  assert.ok(EVENTS.some((e) => e.id === 'nobel-physics-2026'), 'the science entry exists, it is just not served');
  for (const e of readEvents(ACTIVE_EVENTS)) assert.equal(e.domain, 'sports');
});

/* ------------------------------------------------------------------ copy */

test('labels and countdown copy are honest whole days, never a ticking clock', () => {
  const e = one('c', { name: 'The Cup', start: '2026-06-20', end: '2026-06-22' });
  assert.equal(fixtureLabel(e, 'kickoff'), 'Kick-off set · The Cup');
  assert.equal(fixtureLabel(e, 'fulltime'), 'Full-time set · The Cup');
  assert.equal(fixtureLabel(e, 'recap'), 'Yesterday · The Cup');
  assert.equal(fixtureLabel(null, 'recap'), 'Yesterday');
  const at = (iso) => dayIndex(iso) * DAY + 15 * HOUR;
  assert.equal(countdownCopy(e, at('2026-06-17')), 'Starts in 3 days');
  assert.equal(countdownCopy(e, at('2026-06-19')), 'Starts tomorrow');
  assert.equal(countdownCopy(e, at('2026-06-20')), 'Starts today');
  assert.equal(countdownCopy(e, at('2026-06-21')), 'On now');
  assert.equal(countdownCopy(e, at('2026-06-23')), 'Ended yesterday');
  assert.equal(countdownCopy(e, at('2026-06-24')), 'Ended 2 days ago');
  assert.equal(countdownCopy(e, NaN), '');
  // India is a day ahead of LA at this instant, and the copy follows the player's day.
  const late = Date.UTC(2026, 5, 19, 20, 0);
  assert.equal(countdownCopy(e, late, { tzOffsetMinutes: IST }), 'Starts today');
  assert.equal(countdownCopy(e, late, { tzOffsetMinutes: LA }), 'Starts tomorrow');
  for (const text of [countdownCopy(e, at('2026-06-17')), fixtureLabel(e, 'kickoff')])
    assert.ok(!/\d+:\d+|second|min/i.test(text), 'no seconds, minutes or clock faces');
});

/* ------------------------------------------------------------------ the deal */

test('every served sport can fill all three sets from the bank, disjointly', () => {
  for (const topic of SERVED_TOPICS) {
    const pool = QUESTIONS.filter((q) => q.topic === topic);
    assert.ok(pool.length >= 25, `${topic} holds ${pool.length} cards`);
    const e = one(`t-${topic.toLowerCase().replace(/\W+/g, '-')}`, { topic });
    const sets = Object.fromEntries(FIXTURE_KINDS.map((kind) => [kind, fixtureSet(e, QUESTIONS, { kind })]));
    assert.equal(sets.kickoff.length, 10);
    assert.equal(sets.fulltime.length, 10);
    assert.equal(sets.recap.length, 5);
    const all = [...sets.kickoff, ...sets.fulltime, ...sets.recap];
    assert.equal(new Set(all).size, 25, 'the three sets never share a card');
    for (const id of all) assert.equal(QUESTIONS.find((q) => q.id === id).topic, topic);
  }
});

test('a deal is deterministic per (event, kind), different across events, and frozen', () => {
  const a = one('alpha', { topic: 'Football' }),
    b = one('beta', { topic: 'Football' });
  const first = fixtureSet(a, QUESTIONS, { kind: 'kickoff' }),
    again = fixtureSet(a, QUESTIONS, { kind: 'kickoff' });
  assert.deepEqual([...first], [...again]);
  assert.ok(Object.isFrozen(first));
  assert.notDeepEqual([...first], [...fixtureSet(b, QUESTIONS, { kind: 'kickoff' })], 'another event, another deal');
  assert.notDeepEqual([...first], [...fixtureSet(a, QUESTIONS, { kind: 'fulltime' })]);
  // A caller's rng only changes the order, never the membership: the slice is the event's.
  const seeded = fixtureSet(a, QUESTIONS, { kind: 'kickoff', rng: () => 0.999 });
  assert.deepEqual([...seeded].sort(), [...first].sort());
  assert.deepEqual([...fixtureSet(a, QUESTIONS, { kind: 'kickoff', size: 4 })].length, 4);
});

test('a small pool fills what it can and wraps rather than dealing an empty set', () => {
  const tiny = Array.from({ length: 6 }, (_, i) => ({ id: `q${i}`, topic: 'Tennis' }));
  const e = one('t', { topic: 'Tennis' });
  const kick = fixtureSet(e, tiny, { kind: 'kickoff' }),
    full = fixtureSet(e, tiny, { kind: 'fulltime' }),
    recap = fixtureSet(e, tiny, { kind: 'recap' });
  assert.equal(kick.length, 6, 'all six, not ten');
  assert.equal(full.length, 6);
  assert.equal(recap.length, 5);
  assert.equal(new Set(kick).size, 6, 'no card twice inside one set');
  assert.equal(new Set(recap).size, 5);
  assert.deepEqual([...fixtureSet(e, [], { kind: 'kickoff' })], []);
  assert.deepEqual([...fixtureSet(e, QUESTIONS, { kind: 'nope' })], []);
  assert.deepEqual([...fixtureSet(null, QUESTIONS, { kind: 'kickoff' })], []);
  assert.deepEqual([...fixtureSet(e, 'junk', { kind: 'kickoff' })], []);
  // The wrap keeps the twenty-five-card partition: a 30-card pool is still disjoint.
  const thirty = Array.from({ length: 30 }, (_, i) => ({ id: `c${i}`, topic: 'Tennis' }));
  const all = FIXTURE_KINDS.flatMap((kind) => [...fixtureSet(e, thirty, { kind })]);
  assert.equal(new Set(all).size, 25);
});

/* ------------------------------------------------------------------ the duel service */

const BAKU = 'f1-2026-azerbaijan-gp'; // 24–26 Sep 2026
const bakuStart = dayIndex('2026-09-24') * DAY,
  bakuEnd = dayIndex('2026-09-27') * DAY;

test('the fixture action deals the set with shuffled options and no room, and honours the offset', async () => {
  const out = await dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'kickoff' }, { now: bakuStart - HOUR, rng: () => 0.51 });
  assert.equal(out.practice, true);
  assert.equal(out.eventId, BAKU);
  assert.equal(out.kind, 'kickoff');
  assert.equal(out.room, undefined);
  assert.equal(out.cards.length, 10);
  assert.equal(new Set(out.cards.map((q) => q.factId)).size, 10);
  const expected = fixtureSet(fixtureEventById(BAKU), QUESTIONS, { kind: 'kickoff' });
  assert.deepEqual(out.cards.map((q) => q.factId), [...expected], 'the same deal the pure module makes');
  for (const q of out.cards) {
    assert.equal(q.topic, 'Formula 1');
    assert.equal(new Set(q.options).size, 4);
    const source = QUESTIONS.find((x) => x.id === q.factId);
    assert.equal(q.options[q.correctIndex], source.options[source.correctIndex], 'the right answer survives the shuffle');
    assert.ok(q.sourceUrl.startsWith('https://'));
  }
  const full = await dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'fulltime' }, { now: bakuEnd + HOUR });
  assert.equal(full.cards.length, 10);
  assert.equal(new Set([...out.cards, ...full.cards].map((q) => q.factId)).size, 20, 'disjoint from the kick-off set');
  const recap = await dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'recap' }, { now: bakuEnd + 9 * HOUR });
  assert.equal(recap.cards.length, 5);
  // 26 Sep 20:00 UTC is 27 Sep in India (full-time open) but still 26 Sep in Los Angeles.
  const late = Date.UTC(2026, 8, 26, 20);
  const india = await dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'fulltime', tzOffsetMinutes: IST }, { now: late });
  assert.equal(india.cards.length, 10);
  await assert.rejects(
    dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'fulltime', tzOffsetMinutes: LA }, { now: late }),
    (e) => e.status === 400 && e.message === 'Choose an available fixture set.',
  );
});

test('hidden, unknown and out-of-window sets are refused with one and the same message', async () => {
  const refusal = (e) => e.status === 400 && e.message === 'Choose an available fixture set.';
  const nobel = EVENTS.find((e) => e.id === 'nobel-physics-2026');
  const nobelStart = dayIndex(nobel.start) * DAY;
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: 'nobel-physics-2026', kind: 'kickoff' }, { now: nobelStart - HOUR }), refusal, 'hidden domain, inside its window');
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: 'no-such-fixture', kind: 'kickoff' }, { now: bakuStart - HOUR }), refusal, 'unknown');
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'fulltime' }, { now: bakuStart - HOUR }), refusal, 'wrong kind for the moment');
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'kickoff' }, { now: bakuStart - 2 * DAY }), refusal, 'too early');
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'recap' }, { now: bakuEnd + 2 * DAY }), refusal, 'recap two days later');
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'constructor' }, { now: bakuStart - HOUR }), refusal, 'unknown kind');
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: BAKU }, { now: bakuStart - HOUR }), refusal, 'no kind');
  // +99,999 minutes is clamped to UTC-14, where an hour before Baku's UTC midnight is still the day
  // before; -99,999 is clamped to UTC+14, where the day has already begun. Neither is trusted as is.
  const west = await dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'kickoff', tzOffsetMinutes: 99_999 }, { now: bakuStart - HOUR });
  assert.equal(west.cards.length, 10, 'an absurd offset is clamped to a real timezone, not trusted');
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'kickoff', tzOffsetMinutes: -99_999 }, { now: bakuStart - HOUR }), refusal);
  await assert.rejects(dispatch(null, { action: 'fixture', eventId: BAKU, kind: 'kickoff', tzOffsetMinutes: 'IST' }, { now: bakuStart - 30 * HOUR }), refusal, 'a non-number reads as UTC');
});

/* ------------------------------------------------------------------ the wallet */

test('the recap is free once per local day, charges nothing, and the wallet round-trips', () => {
  const cfg = DEFAULT_CONFIG;
  const T0 = Date.UTC(2026, 8, 16, 10);
  const w0 = { ...emptyWallet(), coins: 25 };
  assert.equal(recapFreeToday(w0, { at: T0 }), true);
  const first = enterRecap(w0, { at: T0, tzOffsetMinutes: 0 });
  assert.equal(first.ok, true);
  assert.equal(first.reason, 'recap');
  assert.equal(first.spent, 0);
  assert.equal(first.granted, 0);
  assert.equal(first.wallet.coins, 25, 'no coins moved');
  assert.equal(first.wallet.recapKey, '2026-09-16');
  assert.equal(recapFreeToday(first.wallet, { at: T0 + HOUR }), false);

  const again = enterRecap(first.wallet, { at: T0 + 5 * HOUR, tzOffsetMinutes: 0 });
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'recap_played');
  assert.equal(again.wallet, first.wallet, 'a refusal returns the same wallet object');
  // The second run the same day is the ordinary practice entry, at the config's price.
  const paid = enterPractice(again.wallet, cfg);
  assert.equal(paid.ok, true);
  assert.equal(paid.spent, cfg.practiceEntry);
  assert.equal(paid.wallet.coins, 25 - cfg.practiceEntry);
  assert.equal(paid.wallet.recapKey, '2026-09-16', 'the day stamp is untouched by the paid entry');

  // The day rolls on the player's clock: 23:30 UTC is tomorrow in India already.
  const late = Date.UTC(2026, 8, 16, 23, 30);
  assert.equal(enterRecap(first.wallet, { at: late, tzOffsetMinutes: 0 }).ok, false, 'still the 16th in London');
  assert.equal(enterRecap(first.wallet, { at: late, tzOffsetMinutes: IST }).ok, true, 'the 17th in India');
  assert.equal(enterRecap(first.wallet, { at: 0 }).reason, 'bad_time');
  assert.equal(recapFreeToday(first.wallet, { at: NaN }), false);

  // Round trip, identity, repair.
  const stored = JSON.parse(JSON.stringify(paid.wallet));
  assert.deepEqual(readWallet(stored), paid.wallet);
  assert.equal(readWallet(paid.wallet), paid.wallet, 'a clean wallet is itself');
  assert.equal(readWallet({ ...emptyWallet(), recapKey: 42 }).recapKey, '');
  assert.equal(readWallet({ ...emptyWallet(), recapKey: '2026-09-16T10:00:00Z' }).recapKey, '2026-09-16');
  const legacy = { ...emptyWallet() };
  delete legacy.recapKey;
  const repaired = readWallet(legacy);
  assert.equal(repaired.recapKey, '', 'a wallet stored before the recap existed reads as never played');
  assert.equal(readWallet(repaired), repaired, 'and the repaired wallet is itself clean');
});
