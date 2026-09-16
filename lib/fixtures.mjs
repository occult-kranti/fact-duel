/**
 * Fixture mode — the Kick-off set, the Full-time set and the free "Yesterday" recap, driven by the
 * verified static calendar (lib/events-data.mjs) and nothing else.
 *
 * THERE IS NO LIVE FEED. Nothing here knows a score, a result or a whistle. A "fixture" is a calendar
 * entry with whole-day `start` and `end`; the windows are cut from those days in the PLAYER'S local
 * time (the offset is passed in, as `getTimezoneOffset` reports it, so the module stays pure and a
 * test can stand in any timezone). Every function takes `at`; none reads the clock.
 *
 *  - kick-off  : the 24 hours before the first day of the event begins (local midnight).
 *  - full-time : the 24 hours after the last day of the event ends (local midnight after `end`).
 *  - recap     : the local day after the event's last day — one free five-card set a day.
 *
 * Sets are dealt deterministically per (event, kind) from the served bank, and are disjoint from
 * one another for the same event whenever the topic's pool is big enough: the pool is ordered by a
 * per-event hash, each kind owns its own slice of that order, and the slice is then shuffled by a
 * stream seeded from `${event.id}:${kind}`. The two tiny helpers below are copied from
 * lib/progression.mjs on purpose — this module must not pull the progression graph into the server.
 */
import { ACTIVE_EVENTS, readEvents } from './events.mjs';

const HOUR = 3_600_000,
  DAY = 86_400_000;

/** A kick-off set is open this long before the event's first local midnight. */
export const KICKOFF_WINDOW_MS = 24 * HOUR;
/** A full-time set is open this long after the event's last day ends. */
export const FULLTIME_WINDOW_MS = 24 * HOUR;
/** The recap is for an event whose last day was this many local days ago. */
export const RECAP_WINDOW_DAYS = 1;

export const FIXTURE_KINDS = Object.freeze(['kickoff', 'fulltime', 'recap']);
/** Cards per set. Recap is short on purpose: it is the free morning-after ritual, not a drill. */
export const FIXTURE_SIZE = Object.freeze({ kickoff: 10, fulltime: 10, recap: 5 });

/**
 * The sports with a served bank big enough for a full set (lib/server/bank.mjs holds 60+ cards for
 * each). Other sports on the calendar exist (Tennis, American football) but their banks are stubs,
 * so they are never dealt a kick-off or full-time set and are only a recap of last resort.
 */
export const SERVED_TOPICS = Object.freeze(['Football', 'Cricket', 'Baseball', 'Formula 1', 'Basketball']);
export const isServedTopic = (topic) => SERVED_TOPICS.includes(topic);

/* ------------------------------------------------------------------ tiny deterministic helpers */

function fnv1a32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ local time */

const offsetMs = (tzOffsetMinutes) => (Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0) * 60_000;

/** The player's local calendar day for a timestamp, on the same integer scale as `dayIndex`. */
export function localDay(at, tzOffsetMinutes = 0) {
  if (!Number.isFinite(at)) return null;
  return Math.floor((at - offsetMs(tzOffsetMinutes)) / DAY);
}
/** Epoch ms at which the event's first day begins, in the player's local time. */
export const startAt = (event, tzOffsetMinutes = 0) => event.startDay * DAY + offsetMs(tzOffsetMinutes);
/** Epoch ms at which the event's last day is over (the midnight after `end`), in local time. */
export const endAt = (event, tzOffsetMinutes = 0) => (event.endDay + 1) * DAY + offsetMs(tzOffsetMinutes);

/**
 * fixtureOpen(event, kind, at, { tzOffsetMinutes }) -> whether that set is open right now.
 * Boundaries are half-open on the far side: the kick-off set closes the instant the event's first
 * day begins, the full-time set the instant its 24 hours are up.
 */
export function fixtureOpen(event, kind, at, { tzOffsetMinutes = 0 } = {}) {
  if (!event || !Number.isFinite(at) || !Number.isSafeInteger(event.startDay) || !Number.isSafeInteger(event.endDay))
    return false;
  if (kind === 'kickoff') {
    const start = startAt(event, tzOffsetMinutes);
    return at >= start - KICKOFF_WINDOW_MS && at < start;
  }
  if (kind === 'fulltime') {
    const end = endAt(event, tzOffsetMinutes);
    return at >= end && at < end + FULLTIME_WINDOW_MS;
  }
  if (kind === 'recap') {
    const today = localDay(at, tzOffsetMinutes);
    return today !== null && today - event.endDay === RECAP_WINDOW_DAYS;
  }
  return false;
}

/** Served sports first, then the shorter (more specific) entry, then the id — a total order. */
function relevance(a, b) {
  const served = Number(isServedTopic(b.topic)) - Number(isServedTopic(a.topic));
  if (served) return served;
  const length = a.endDay - a.startDay - (b.endDay - b.startDay);
  if (length) return length;
  return a.id < b.id ? -1 : 1;
}

/** The calendar entry behind an id, or undefined when it is unknown or in a hidden domain. */
export const fixtureEventById = (id, list = ACTIVE_EVENTS) =>
  typeof id === 'string' ? readEvents(list).find((event) => event.id === id) : undefined;

/**
 * fixturesAt(at, { tzOffsetMinutes, list }) -> { kickoff, fulltime, recap, next }.
 * `kickoff` and `fulltime` are the served-sport events whose set is open at `at`, soonest first.
 * `recap` is the one event whose last day was yesterday (served sports preferred, then any sport
 * on the calendar), or null. `next` is the soonest served-sport event that has not started, or
 * null. Everything is read through `readEvents`, so a malformed entry can never surface.
 */
export function fixturesAt(at, { tzOffsetMinutes = 0, list = ACTIVE_EVENTS } = {}) {
  const events = readEvents(list),
    today = localDay(at, tzOffsetMinutes),
    kickoff = [],
    fulltime = [],
    recaps = [];
  let next = null;
  if (today !== null)
    for (const event of events) {
      const served = isServedTopic(event.topic);
      if (served && fixtureOpen(event, 'kickoff', at, { tzOffsetMinutes })) kickoff.push(event);
      if (served && fixtureOpen(event, 'fulltime', at, { tzOffsetMinutes })) fulltime.push(event);
      if (fixtureOpen(event, 'recap', at, { tzOffsetMinutes })) recaps.push(event);
      if (served && event.startDay > today && (!next || event.startDay < next.startDay)) next = event;
    }
  kickoff.sort((a, b) => a.startDay - b.startDay || relevance(a, b));
  fulltime.sort((a, b) => a.endDay - b.endDay || relevance(a, b));
  recaps.sort(relevance);
  return Object.freeze({
    kickoff: Object.freeze(kickoff),
    fulltime: Object.freeze(fulltime),
    recap: recaps[0] ?? null,
    next,
  });
}

/* ------------------------------------------------------------------ the deal */

const slot = (kind) => {
  let offset = 0;
  for (const k of FIXTURE_KINDS) {
    if (k === kind) return offset;
    offset += FIXTURE_SIZE[k];
  }
  return 0;
};

/**
 * fixtureSet(event, questions, { kind, size, rng }) -> frozen list of card ids, up to `size`.
 * The topic's pool is ordered by a hash of `${event.id}:${id}` (so every kind sees the same order
 * for the same event), each kind takes the slice that starts at its own offset (kick-off 0..9,
 * full-time 10..19, recap 20..24 — disjoint whenever the pool holds 25 or more), and the slice is
 * shuffled by `rng`, which defaults to a stream seeded from `${event.id}:${kind}`. A pool smaller
 * than a set still fills as much as it can; a pool smaller than the offsets wraps around, so a
 * small topic is dealt overlapping sets rather than empty ones.
 */
export function fixtureSet(event, questions, { kind = 'kickoff', size = FIXTURE_SIZE[kind], rng } = {}) {
  if (!event || !FIXTURE_KINDS.includes(kind) || !Array.isArray(questions)) return Object.freeze([]);
  const want = Number.isSafeInteger(size) && size > 0 ? size : FIXTURE_SIZE[kind];
  const pool = questions
    .filter((q) => q && typeof q.id === 'string' && q.topic === event.topic)
    .map((q) => ({ id: q.id, key: fnv1a32(`${event.id}:${q.id}`) }))
    .sort((a, b) => a.key - b.key || (a.id < b.id ? -1 : 1));
  if (!pool.length) return Object.freeze([]);
  const count = Math.min(want, pool.length),
    offset = slot(kind),
    picked = [];
  for (let i = 0; i < count; i++) picked.push(pool[(offset + i) % pool.length].id);
  const random = typeof rng === 'function' ? rng : mulberry32(fnv1a32(`${event.id}:${kind}`));
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return Object.freeze(picked);
}

/* ------------------------------------------------------------------ copy */

const KIND_LABEL = Object.freeze({ kickoff: 'Kick-off set', fulltime: 'Full-time set', recap: 'Yesterday' });

/** "Kick-off set · Name" / "Full-time set · Name" / "Yesterday · Name". */
export function fixtureLabel(event, kind) {
  const head = KIND_LABEL[kind] ?? 'Fixture';
  const name = typeof event?.name === 'string' && event.name ? event.name : '';
  return name ? `${head} · ${name}` : head;
}

/**
 * countdownCopy(event, at, { tzOffsetMinutes }) -> one honest line in whole local days: "Starts in
 * 3 days", "Starts tomorrow", "On now", "Ended yesterday", "Ended 2 days ago". Days, never a ticking
 * clock: the calendar knows dates, not kick-off times, and a seconds counter would be invented.
 */
export function countdownCopy(event, at, { tzOffsetMinutes = 0 } = {}) {
  const today = localDay(at, tzOffsetMinutes);
  if (!event || today === null || !Number.isSafeInteger(event.startDay) || !Number.isSafeInteger(event.endDay))
    return '';
  const until = event.startDay - today;
  if (until > 0) return until === 1 ? 'Starts tomorrow' : `Starts in ${until} days`;
  const since = today - event.endDay;
  if (since <= 0) return until === 0 ? 'Starts today' : 'On now';
  return since === 1 ? 'Ended yesterday' : `Ended ${since} days ago`;
}
