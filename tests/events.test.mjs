import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  EVENTS,
  CALENDAR_ASOF,
  MODE_TEMPLATES,
  EVENT_DOMAINS,
  RECENT_DAYS,
  UPCOMING_DAYS,
  GROUP_LIMIT,
  MONTHLY_MODE_LIMIT,
  dayIndex,
  dayIso,
  eventStatus,
  monthKey,
  readEvents,
  groupEvents,
  monthlyModes,
  isModeOpen,
  activeModes,
  modeTemplateById,
  validModeDuel,
} from '../lib/events.mjs';
import {
  emptyProgression,
  readProgression,
  reduceProgression,
  eventModeEvent,
  XP,
  LOG_KINDS,
  EVENT_BADGE_LIMIT,
} from '../lib/progression.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { TOPIC_DOMAINS } from '../lib/journal.mjs';
// Local-time timestamps keep the calendar stable in any timezone, as in tests/progression.test.mjs.
const T = (y, m, d, h = 12, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();
const NOW = T(2026, 6, 15); // every fixture below is positioned relative to this day
const TODAY = dayIndex('2026-06-15');
const D = (offset) => dayIso(TODAY + offset);
// -----------------------------------------------------------------------------------------------
// Synthetic fixtures. Nothing here describes a real event: the engine must never depend on one.
const ev = (id, over = {}) => ({
  id,
  name: `Fixture ${id}`,
  domain: 'sports',
  topic: 'Cricket',
  start: D(-2),
  end: D(2),
  blurb: 'Synthetic fixture for the engine tests.',
  whyQuiz: 'Synthetic fixture for the engine tests.',
  sourceUrl: 'https://example.org/fixture',
  ...over,
});
// A June 2026 calendar that exercises every standing a month can give an event.
const CALENDAR = [
  ev('live-sports', { topic: 'Cricket', domain: 'sports', start: '2026-06-10', end: '2026-06-20' }),
  ev('live-science', { topic: 'Space', domain: 'science', start: '2026-06-25', end: '2026-07-05' }),
  ev('soon-sports', { topic: 'Football', domain: 'sports', start: '2026-08-01', end: '2026-08-10' }),
  ev('past-science', { topic: 'Physics', domain: 'science', start: '2026-05-01', end: '2026-05-02' }),
  ev('old-sports', { topic: 'Tennis', domain: 'sports', start: '2025-01-01', end: '2025-01-02' }),
  ev('far-sports', { topic: 'Basketball', domain: 'sports', start: '2028-01-01', end: '2028-01-02' }),
];
const byId = (list) => Object.fromEntries(list.map((m) => [m.event.id, m]));
// -----------------------------------------------------------------------------------------------
test('dayIndex parses ISO components and refuses anything that is not a real calendar day', () => {
  assert.equal(dayIndex('1970-01-01'), 0);
  assert.equal(dayIndex('1970-01-02') - dayIndex('1970-01-01'), 1);
  assert.equal(dayIndex('2026-03-01') - dayIndex('2026-02-28'), 1); // 2026 is not a leap year
  assert.equal(dayIndex('2028-03-01') - dayIndex('2028-02-28'), 2); // 2028 is
  for (const bad of [
    '2026-02-30',
    '2026-13-01',
    '2026-00-10',
    '2026-06-00',
    '2026-6-11',
    '26-06-11',
    '2026-06-11T00:00:00Z',
    '',
    'tomorrow',
    null,
    20615,
    {},
  ])
    assert.equal(dayIndex(bad), null, String(bad));
});
test('dayIso is the exact inverse of dayIndex across a long run of days', () => {
  for (let i = 0; i < 900; i++) {
    const iso = dayIso(TODAY - 400 + i);
    assert.match(iso, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(dayIndex(iso), TODAY - 400 + i);
  }
  assert.equal(dayIso(1.5), null);
  assert.equal(dayIso('0'), null);
});
test('eventStatus switches exactly on the day before, first, last and day after', () => {
  const e = { start: '2026-06-11', end: '2026-06-20' };
  assert.equal(eventStatus(e, T(2026, 6, 10, 23, 59)), 'upcoming');
  assert.equal(eventStatus(e, T(2026, 6, 11, 0, 0)), 'live');
  assert.equal(eventStatus(e, T(2026, 6, 15)), 'live');
  assert.equal(eventStatus(e, T(2026, 6, 20, 23, 59)), 'live'); // ends today, still on
  assert.equal(eventStatus(e, T(2026, 6, 21, 0, 0)), 'past');
  const oneDay = { start: '2026-06-11', end: '2026-06-11' };
  assert.equal(eventStatus(oneDay, T(2026, 6, 10, 23, 59)), 'upcoming');
  assert.equal(eventStatus(oneDay, T(2026, 6, 11, 0, 0)), 'live');
  assert.equal(eventStatus(oneDay, T(2026, 6, 11, 23, 59)), 'live');
  assert.equal(eventStatus(oneDay, T(2026, 6, 12)), 'past');
});
test('eventStatus never claims a broken or missing date is live', () => {
  for (const e of [
    null,
    {},
    { start: 'soon', end: 'later' },
    { start: '2026-02-30', end: '2026-03-01' },
    { start: 123, end: 456 },
  ])
    assert.equal(eventStatus(e, NOW), 'past');
  // A missing or reversed end falls back to the start day rather than widening the window.
  assert.equal(eventStatus({ start: '2026-06-15' }, NOW), 'live');
  assert.equal(eventStatus({ start: '2026-06-15', end: 'nope' }, NOW), 'live');
  assert.equal(eventStatus({ start: '2026-06-15', end: '2026-01-01' }, NOW), 'live');
  assert.equal(eventStatus({ start: '2026-06-15' }, T(2026, 6, 16)), 'past');
  assert.equal(eventStatus({ start: '2026-06-15', end: '2026-06-20' }, Number.NaN), 'past');
});
test('the calendar reads the same in every timezone, east and west of UTC', () => {
  const moduleUrl = new URL('../lib/events.mjs', import.meta.url).href;
  const probe = `
    import { dayIndex, eventStatus, monthKey } from ${JSON.stringify(moduleUrl)};
    const at = (y, m, d, h, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();
    const e = { start: '2026-06-11', end: '2026-06-20' };
    process.stdout.write(
      JSON.stringify({
        offset: new Date(at(2026, 6, 15, 12)).getTimezoneOffset(),
        index: dayIndex('2026-06-11'),
        beforeStart: eventStatus(e, at(2026, 6, 10, 23, 59)),
        firstDay: eventStatus(e, at(2026, 6, 11, 0, 0)),
        lastDay: eventStatus(e, at(2026, 6, 20, 23, 59)),
        afterEnd: eventStatus(e, at(2026, 6, 21, 0, 0)),
        month: monthKey(at(2026, 6, 30, 23, 30)),
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
    index: 20615,
    beforeStart: 'upcoming',
    firstDay: 'live',
    lastDay: 'live',
    afterEnd: 'past',
    month: '2026-06',
  };
  for (const [i, got] of seen.entries()) {
    const { offset, ...rest } = got;
    assert.deepEqual(rest, expected, zones[i]);
    assert.equal(typeof offset, 'number');
  }
  // The zones really do disagree about local time, so the agreement above is not a coincidence.
  assert.ok(new Set(seen.map((s) => s.offset)).size >= 4);
});
test('readEvents drops every malformed entry and keeps the good one beside it', () => {
  const good = ev('keeper');
  const list = readEvents([
    null,
    'not an event',
    42,
    ev('Not Kebab'),
    ev('trailing-'),
    ev(''),
    ev('x'.repeat(65)),
    ev('bad-domain', { domain: 'music' }),
    ev('no-domain', { domain: undefined }),
    ev('bad-topic', { topic: 'Chess' }),
    ev('topic-domain-mismatch', { topic: 'Space', domain: 'sports' }),
    ev('bad-start', { start: '2026-13-01' }),
    ev('bad-end', { end: '2026-02-30' }),
    ev('reversed', { start: '2026-06-20', end: '2026-06-10' }),
    ev('insecure-source', { sourceUrl: 'http://example.org/fixture' }),
    ev('no-source', { sourceUrl: undefined }),
    ev('no-name', { name: '' }),
    good,
  ]);
  assert.deepEqual(
    list.map((e) => e.id),
    ['keeper'],
  );
});
test('readEvents clamps prose, defaults optional prose, dedupes by id and sorts by start date', () => {
  const list = readEvents([
    ev('b-later', { start: '2026-07-01', end: '2026-07-02' }),
    ev('a-earlier', {
      start: '2026-06-01',
      end: '2026-06-02',
      name: 'N'.repeat(200),
      blurb: 'B'.repeat(400),
      whyQuiz: 'W'.repeat(400),
      headline: 'H'.repeat(400),
    }),
    ev('b-later', { start: '2026-01-01', end: '2026-01-02', name: 'duplicate' }),
    ev('c-empty-prose', { start: '2026-06-05', end: '2026-06-06', blurb: undefined, whyQuiz: 7 }),
  ]);
  assert.deepEqual(
    list.map((e) => e.id),
    ['a-earlier', 'c-empty-prose', 'b-later'],
  );
  const first = list[0];
  assert.equal(first.name.length, 80);
  assert.equal(first.blurb.length, 160);
  assert.equal(first.whyQuiz.length, 160);
  assert.equal(first.headline.length, 160);
  assert.equal(list[1].blurb, '');
  assert.equal(list[1].whyQuiz, '');
  assert.ok(!('headline' in list[1]));
  assert.equal(list[2].name, 'Fixture b-later'); // first entry with the id wins
  assert.equal(list[0].startDay, dayIndex('2026-06-01'));
  assert.equal(list[0].endDay, dayIndex('2026-06-02'));
  assert.ok(Object.isFrozen(list) && list.every(Object.isFrozen));
  assert.throws(() => list.push(ev('extra')), TypeError);
  assert.deepEqual(readEvents(null), []);
  assert.deepEqual(readEvents('nope'), []);
});
test('groupEvents splits live, upcoming and recent on the exact window boundaries', () => {
  const list = [
    ev('on-now', { start: D(-1), end: D(1) }),
    ev('ends-today', { start: D(-9), end: D(0) }),
    ev('starts-today', { start: D(0), end: D(3) }),
    ev('soon', { start: D(1), end: D(2) }),
    ev('edge-upcoming', { start: D(UPCOMING_DAYS), end: D(UPCOMING_DAYS + 1) }),
    ev('too-far', { start: D(UPCOMING_DAYS + 1), end: D(UPCOMING_DAYS + 2) }),
    ev('just-gone', { start: D(-3), end: D(-1) }),
    ev('edge-recent', { start: D(-RECENT_DAYS - 1), end: D(-RECENT_DAYS) }),
    ev('too-old', { start: D(-RECENT_DAYS - 2), end: D(-RECENT_DAYS - 1) }),
  ];
  const g = groupEvents(NOW, list);
  assert.deepEqual(
    g.live.map((e) => e.id),
    ['ends-today', 'on-now', 'starts-today'], // finishing soonest first
  );
  assert.deepEqual(
    g.upcoming.map((e) => e.id),
    ['soon', 'edge-upcoming'], // soonest first
  );
  assert.deepEqual(
    g.recent.map((e) => e.id),
    ['just-gone', 'edge-recent'], // newest first
  );
  assert.ok(Object.isFrozen(g) && Object.isFrozen(g.live));
  assert.deepEqual(groupEvents(Number.NaN, list), { live: [], upcoming: [], recent: [] });
});
test('groupEvents caps each group at a dozen and still sanitises', () => {
  const many = [];
  for (let i = 0; i < 20; i++) {
    many.push(ev(`up-${String(i).padStart(2, '0')}`, { start: D(i + 1), end: D(i + 2) }));
    many.push(ev(`old-${String(i).padStart(2, '0')}`, { start: D(-i - 3), end: D(-i - 2) }));
    many.push(ev(`now-${String(i).padStart(2, '0')}`, { start: D(-1), end: D(i + 1) }));
  }
  many.push(ev('rubbish', { domain: 'music' }));
  const g = groupEvents(NOW, many);
  assert.equal(g.live.length, GROUP_LIMIT);
  assert.equal(g.upcoming.length, GROUP_LIMIT);
  assert.equal(g.recent.length, GROUP_LIMIT);
  assert.equal(g.upcoming[0].id, 'up-00');
  assert.equal(g.recent[0].id, 'old-00');
  assert.ok(!JSON.stringify(g).includes('rubbish'));
});
test('monthKey reads local date parts and covers the month edges', () => {
  assert.equal(monthKey(T(2026, 6, 1, 0, 0)), '2026-06');
  assert.equal(monthKey(T(2026, 6, 30, 23, 59)), '2026-06');
  assert.equal(monthKey(T(2026, 12, 31, 23, 59)), '2026-12');
  assert.equal(monthKey(T(2027, 1, 1, 0, 0)), '2027-01');
  assert.equal(monthKey(Number.NaN), null);
  assert.equal(monthKey('now'), null);
});
test('MODE_TEMPLATES cover every standing and domain with legal duel configs', () => {
  assert.ok(MODE_TEMPLATES.length >= 6);
  assert.ok(Object.isFrozen(MODE_TEMPLATES) && MODE_TEMPLATES.every(Object.isFrozen));
  assert.equal(new Set(MODE_TEMPLATES.map((t) => t.id)).size, MODE_TEMPLATES.length);
  assert.equal(new Set(MODE_TEMPLATES.map((t) => t.badge)).size, MODE_TEMPLATES.length);
  for (const when of ['live', 'upcoming', 'past'])
    for (const domain of EVENT_DOMAINS)
      assert.ok(
        MODE_TEMPLATES.some((t) => t.when === when && t.domain === domain),
        `${when}/${domain}`,
      );
  for (const t of MODE_TEMPLATES) {
    assert.match(t.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(t.badge, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(t.name.length > 0 && t.tagline.length > 0);
    assert.ok(t.xpBonus >= 1 && t.xpBonus <= 2, t.id);
    assert.ok(validModeDuel(t.duel), t.id);
    assert.equal(modeTemplateById(t.id), t);
  }
  assert.equal(modeTemplateById('nope'), null);
});
test('monthlyModes picks the month, the most relevant events and a matching template', () => {
  const modes = monthlyModes(NOW, CALENDAR);
  assert.equal(modes.length, MONTHLY_MODE_LIMIT);
  assert.deepEqual(
    modes.map((m) => m.event.id),
    ['live-sports', 'live-science', 'soon-sports', 'past-science'],
  );
  for (const m of modes) {
    assert.equal(m.monthKey, '2026-06');
    assert.equal(m.id, `2026-06:${m.event.id}:${m.template.id}`);
    assert.equal(m.template.domain, m.event.domain);
    assert.equal(m.duel.topic, m.event.topic);
    assert.equal(m.duel.domain, m.event.domain);
    assert.equal(m.duel.mode, m.template.duel.mode);
    assert.equal(m.duel.duration, m.template.duel.duration);
    assert.equal(m.xpBonus, m.template.xpBonus);
    assert.equal(m.badge, m.template.badge);
    assert.ok(validModeDuel(m.duel));
    assert.ok(Object.isFrozen(m) && Object.isFrozen(m.window) && Object.isFrozen(m.duel));
  }
  const picked = byId(modes);
  assert.equal(picked['live-sports'].template.when, 'live');
  assert.equal(picked['live-science'].template.when, 'live');
  assert.equal(picked['soon-sports'].template.when, 'upcoming');
  assert.equal(picked['past-science'].template.when, 'past');
  // Events far outside the recent/upcoming windows are never dressed up as a mode.
  assert.ok(!modes.some((m) => m.event.id === 'old-sports' || m.event.id === 'far-sports'));
  assert.deepEqual(monthlyModes(NOW, []), []);
  assert.deepEqual(monthlyModes(Number.NaN, CALENDAR), []);
});
test('monthlyModes is identical on every day of the same month and for a shuffled dataset', () => {
  const first = monthlyModes(T(2026, 6, 1, 0, 1), CALENDAR);
  for (const at of [T(2026, 6, 2, 8), NOW, T(2026, 6, 30, 23, 30)])
    assert.deepEqual(monthlyModes(at, CALENDAR), first);
  assert.deepEqual(monthlyModes(NOW, [...CALENDAR].reverse()), first);
  // Relevance is judged against the month, not the day, so a mid-month switch cannot reshuffle it.
  assert.deepEqual(
    monthlyModes(T(2026, 6, 26), CALENDAR).map((m) => m.id),
    first.map((m) => m.id),
  );
});
test('monthlyModes moves on with the calendar as events change standing', () => {
  const june = monthlyModes(NOW, CALENDAR);
  const july = monthlyModes(T(2026, 7, 15), CALENDAR);
  assert.equal(new Set([...june, ...july].map((m) => m.id)).size, june.length + july.length);
  assert.ok(july.every((m) => m.monthKey === '2026-07'));
  // The June-live sports fixture is settled history by July, so it gets a 'past' template instead.
  assert.equal(byId(june)['live-sports'].template.when, 'live');
  assert.equal(byId(july)['live-sports'].template.when, 'past');
  assert.notEqual(byId(june)['live-sports'].template.id, byId(july)['live-sports'].template.id);
  // A month with nothing in range offers nothing rather than reaching for a stale event.
  assert.deepEqual(monthlyModes(T(2027, 1, 15), CALENDAR), []);
  // The far-off fixture only becomes a countdown once it is inside the upcoming window.
  assert.deepEqual(
    monthlyModes(T(2027, 6, 15), CALENDAR).map((m) => [m.event.id, m.template.when]),
    [['far-sports', 'upcoming']],
  );
});
test('a mode window is the month clamped to the event, and isModeOpen respects both ends', () => {
  const modes = byId(monthlyModes(NOW, CALENDAR));
  assert.deepEqual(modes['live-sports'].window, { start: '2026-06-10', end: '2026-06-20' });
  assert.deepEqual(modes['live-science'].window, { start: '2026-06-25', end: '2026-06-30' });
  assert.deepEqual(modes['soon-sports'].window, { start: '2026-06-01', end: '2026-06-30' });
  assert.deepEqual(modes['past-science'].window, { start: '2026-06-01', end: '2026-06-30' });
  const live = modes['live-sports'];
  assert.equal(isModeOpen(live, T(2026, 6, 9, 23, 59)), false);
  assert.equal(isModeOpen(live, T(2026, 6, 10, 0, 0)), true);
  assert.equal(isModeOpen(live, NOW), true);
  assert.equal(isModeOpen(live, T(2026, 6, 20, 23, 59)), true);
  assert.equal(isModeOpen(live, T(2026, 6, 21, 0, 0)), false);
  for (const bad of [null, {}, { window: {} }, { window: { start: 'x', end: 'y' } }])
    assert.equal(isModeOpen(bad, NOW), false);
  assert.equal(isModeOpen(live, Number.NaN), false);
});
test('activeModes is the open subset of the month and shrinks as windows close', () => {
  const open = activeModes(NOW, CALENDAR);
  assert.deepEqual(
    open.map((m) => m.event.id),
    ['live-sports', 'soon-sports', 'past-science'], // the science window has not opened yet
  );
  const later = activeModes(T(2026, 6, 26), CALENDAR);
  assert.deepEqual(
    later.map((m) => m.event.id),
    ['live-science', 'soon-sports', 'past-science'], // and the sports window has closed
  );
  for (const at of [T(2026, 6, 1, 0, 30), NOW, T(2026, 6, 30, 23, 0)]) {
    const month = monthlyModes(at, CALENDAR);
    const active = activeModes(at, CALENDAR);
    assert.ok(active.every((m) => month.some((x) => x.id === m.id) && isModeOpen(m, at)));
    assert.ok(month.filter((m) => isModeOpen(m, at)).length === active.length);
  }
  assert.ok(Object.isFrozen(open));
});
// -----------------------------------------------------------------------------------------------
// Progression hook
const DAY = T(2026, 6, 15, 9);
const NEXT_DAY = T(2026, 6, 16, 9);
const clear = (badge, xpBonus = 1, modeId = '2026-06:live-sports:final-whistle') =>
  eventModeEvent({ badge, modeId, xpBonus });
test('clearing a limited mode pays the flat bonus scaled by the multiplier and stamps the badge', () => {
  const start = emptyProgression();
  assert.deepEqual(start.eventBadges, {});
  assert.equal(start.counters.eventModes, 0);
  assert.ok(LOG_KINDS.includes('event'));
  const prog = reduceProgression(start, [clear('final-whistle', 1.5)], DAY);
  const entry = prog.log.find((e) => e.kind === 'event');
  assert.equal(entry.xp, Math.round(XP.eventMode * 1.5));
  assert.equal(entry.xp, 60);
  assert.deepEqual(entry.meta, {
    badge: 'final-whistle',
    modeId: '2026-06:live-sports:final-whistle',
    xpBonus: 1.5,
  });
  assert.deepEqual(prog.eventBadges, { 'final-whistle': DAY });
  assert.equal(prog.counters.eventModes, 1);
  assert.equal(prog.xp, 60 + XP.streakPerDay); // the mode bonus plus the day's first streak credit
});
test('a badge pays once: replaying the same mode is a no-op, a different badge still pays', () => {
  let prog = reduceProgression(emptyProgression(), [clear('final-whistle', 1.5)], DAY);
  const after = reduceProgression(prog, [clear('final-whistle', 2)], DAY);
  assert.strictEqual(after, prog); // identity preserved, nothing to write
  assert.equal(after.xp, prog.xp);
  assert.equal(after.counters.eventModes, 1);
  const xpBefore = prog.xp;
  prog = reduceProgression(prog, [clear('mission-window', 1.4)], DAY);
  assert.equal(prog.xp - xpBefore, Math.round(XP.eventMode * 1.4));
  assert.equal(prog.counters.eventModes, 2);
  assert.deepEqual(Object.keys(prog.eventBadges).sort(), ['final-whistle', 'mission-window']);
  // Not even a new day re-opens a badge that has already been earned.
  const tomorrow = reduceProgression(prog, [clear('final-whistle', 2)], NEXT_DAY);
  assert.equal(tomorrow.counters.eventModes, 2);
  assert.equal(tomorrow.eventBadges['final-whistle'], DAY);
  assert.ok(!tomorrow.log.slice(0, 2).some((e) => e.kind === 'event'));
});
test('the mode multiplier is clamped to [1, 2] and a bad badge earns nothing', () => {
  const at = DAY;
  const gain = (event) => {
    const before = reduceProgression(emptyProgression(), [{ kind: 'visit' }], at);
    return reduceProgression(before, [event], at).xp - before.xp;
  };
  assert.equal(gain(clear('huge', 9)), XP.eventMode * 2);
  assert.equal(gain(clear('tiny', 0.1)), XP.eventMode);
  assert.equal(gain(clear('missing', Number.NaN)), XP.eventMode);
  assert.equal(gain({ kind: 'event-mode', badge: 'raw', modeId: 'm', xpBonus: 9 }), XP.eventMode * 2);
  assert.equal(gain({ kind: 'event-mode', badge: 'raw' }), XP.eventMode);
  for (const badge of ['Not Kebab', 'trailing-', '', 'a'.repeat(65), 7, null, undefined])
    assert.equal(gain({ kind: 'event-mode', badge, xpBonus: 2 }), 0, String(badge));
  const before = reduceProgression(emptyProgression(), [{ kind: 'visit' }], at);
  assert.strictEqual(reduceProgression(before, [{ kind: 'event-mode', badge: 'Bad Id' }], at), before);
  assert.deepEqual(eventModeEvent(), { kind: 'event-mode', badge: undefined, modeId: undefined, xpBonus: 1 });
  assert.deepEqual(eventModeEvent({ badge: 'b', modeId: 'm', xpBonus: 5 }), {
    kind: 'event-mode',
    badge: 'b',
    modeId: 'm',
    xpBonus: 2,
  });
});
test('every badge a template can mint survives a full round trip through readProgression', () => {
  let prog = emptyProgression();
  for (const t of MODE_TEMPLATES) prog = reduceProgression(prog, [clear(t.badge, t.xpBonus)], DAY);
  assert.equal(prog.counters.eventModes, MODE_TEMPLATES.length);
  assert.deepEqual(Object.keys(prog.eventBadges).sort(), MODE_TEMPLATES.map((t) => t.badge).sort());
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(prog))), prog);
});
test('readProgression whitelists badge ids, demands positive timestamps and caps the map', () => {
  const p = readProgression({
    ...emptyProgression(),
    eventBadges: {
      'final-whistle': DAY,
      'Not Kebab': DAY,
      'trailing-': DAY,
      ['a'.repeat(65)]: DAY,
      zero: 0,
      negative: -1,
      fractional: 1.5,
      wordy: 'yesterday',
      nested: { at: DAY },
    },
  });
  assert.deepEqual(p.eventBadges, { 'final-whistle': DAY });
  assert.deepEqual(readProgression({ ...emptyProgression(), eventBadges: 'nope' }).eventBadges, {});
  assert.deepEqual(readProgression(null).eventBadges, {});
  const huge = Object.fromEntries(
    Array.from({ length: EVENT_BADGE_LIMIT + 50 }, (_, i) => [`badge-${i}`, DAY]),
  );
  assert.equal(
    Object.keys(readProgression({ ...emptyProgression(), eventBadges: huge }).eventBadges).length,
    EVENT_BADGE_LIMIT,
  );
});
test('a profile reset clears earned badges and the mode counter', () => {
  const progression = reduceProgression(emptyProgression(), [clear('final-whistle', 1.5)], DAY);
  const profile = readProfile({ ...emptyProfile(), progression });
  assert.deepEqual(profile.progression.eventBadges, { 'final-whistle': DAY });
  const fresh = reduceProfile(profile, { type: 'reset', newEpoch: 'fresh', at: NEXT_DAY });
  assert.deepEqual(fresh.progression.eventBadges, {});
  assert.equal(fresh.progression.counters.eventModes, 0);
  assert.deepEqual(fresh.progression, emptyProgression());
  assert.equal(fresh.version, 2);
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(profile))), profile);
});
test('the shipped calendar matches the contract without the engine knowing anything about it', () => {
  assert.ok(Array.isArray(EVENTS));
  assert.equal(dayIndex(CALENDAR_ASOF) !== null, true, 'CALENDAR_ASOF must be an ISO date');
  const list = readEvents();
  assert.equal(list.length, EVENTS.length, 'every shipped entry must survive sanitisation');
  assert.equal(new Set(list.map((e) => e.id)).size, list.length);
  for (const e of list) {
    assert.ok(Object.hasOwn(TOPIC_DOMAINS, e.topic));
    assert.equal(TOPIC_DOMAINS[e.topic], e.domain);
    assert.ok(e.startDay <= e.endDay);
    assert.match(e.sourceUrl, /^https:\/\//);
  }
  // The engine works the same whether the dataset is empty or full.
  const at = T(2026, 9, 13);
  assert.deepEqual(groupEvents(at), groupEvents(at, EVENTS));
  assert.deepEqual(monthlyModes(at), monthlyModes(at, EVENTS));
  assert.ok(monthlyModes(at).length <= MONTHLY_MODE_LIMIT);
  assert.ok(activeModes(at).every((m) => isModeOpen(m, at)));
});
