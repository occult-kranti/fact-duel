// Calendar of curated sports and science events, plus the limited-time modes derived from them.
// Pure and I/O-free like lib/expeditions.mjs: the data is a static, hand-checked list in
// lib/events-data.mjs (see CALENDAR_ASOF), there is no live feed, no scores service and no result
// lookup, and the UI must say so. Every function takes the current time as a parameter — Date.now()
// only ever appears as a default argument — so the whole module is deterministic under test.
// Dates are compared as whole calendar days: ISO strings are parsed component-wise and timestamps
// are read with local getters, so nothing here drifts with the viewer's timezone.
import { TOPIC_DOMAINS } from './journal.mjs';
import { fnv1a32, mulberry32, MODES } from './progression.mjs';
import { MODE_DURATION } from './server/room-engine.mjs';
import { EVENTS, CALENDAR_ASOF } from './events-data.mjs';
export { EVENTS, CALENDAR_ASOF };
export const EVENT_DOMAINS = Object.freeze(['sports', 'science']);
/** How far back a finished event still counts as "recent", and how far ahead as "upcoming". */
export const RECENT_DAYS = 120;
export const UPCOMING_DAYS = 240;
/** Caps: entries kept by readEvents, entries per group, and limited modes offered in a month. */
export const EVENT_LIMIT = 200;
export const GROUP_LIMIT = 12;
export const MONTHLY_MODE_LIMIT = 4;
const NAME_MAX = 80,
  TEXT_MAX = 160,
  URL_MAX = 2000;
const pad = (n) => String(n).padStart(2, '0');
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const str = (v, max) => (typeof v === 'string' && v.length > 0 ? v.slice(0, max) : '');
/** Day number for a Y/M/D triple, via setUTCFullYear so years below 100 are not remapped to 19xx. */
function utcDay(y, m, d) {
  const t = new Date(0);
  t.setUTCFullYear(y, m - 1, d);
  t.setUTCHours(0, 0, 0, 0);
  return t;
}
/**
 * dayIndex('2026-06-11') -> integer day number, or null when the string is not a real calendar date.
 * Parses the components itself: `new Date('2026-06-11')` is parsed as UTC midnight and would put the
 * whole calendar a day out for anyone west of Greenwich.
 */
export function dayIndex(iso) {
  const m = typeof iso === 'string' ? ISO_DAY.exec(iso) : null;
  if (!m) return null;
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]);
  const t = utcDay(y, mo, d);
  if (t.getUTCFullYear() !== y || t.getUTCMonth() + 1 !== mo || t.getUTCDate() !== d) return null;
  return Math.round(t.getTime() / 864e5);
}
/** The inverse of dayIndex: an integer day number back to 'YYYY-MM-DD'. */
export function dayIso(index) {
  if (!Number.isSafeInteger(index)) return null;
  const t = new Date(index * 864e5);
  return `${String(t.getUTCFullYear()).padStart(4, '0')}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
/** The viewer's own calendar day for a timestamp, as the same integer scale as dayIndex(). */
function todayIndex(at) {
  if (!Number.isFinite(at)) return null;
  const d = new Date(at),
    y = d.getFullYear();
  if (!Number.isFinite(y)) return null;
  return Math.round(utcDay(y, d.getMonth() + 1, d.getDate()).getTime() / 864e5);
}
/**
 * eventStatus(event, at) -> 'live' | 'upcoming' | 'past'. Whole days are compared, so an event whose
 * end is today is still live. Anything unparsable reads as 'past' rather than claiming to be on now.
 */
export function eventStatus(event, at = Date.now()) {
  const start = dayIndex(event?.start);
  if (start === null) return 'past';
  const end = Math.max(start, dayIndex(event?.end) ?? start);
  const today = todayIndex(at);
  if (today === null) return 'past';
  if (today < start) return 'upcoming';
  return today > end ? 'past' : 'live';
}
/** 'YYYY-MM' for the month containing a timestamp, in local time; null for a non-finite timestamp. */
export function monthKey(at = Date.now()) {
  if (!Number.isFinite(at)) return null;
  const d = new Date(at),
    y = d.getFullYear();
  if (!Number.isFinite(y)) return null;
  return `${String(y).padStart(4, '0')}-${pad(d.getMonth() + 1)}`;
}
/** First and last day index of the local month containing `at`, with its key. */
function monthBounds(at) {
  const key = monthKey(at);
  if (!key) return null;
  const d = new Date(at),
    y = d.getFullYear(),
    m = d.getMonth() + 1;
  return {
    key,
    start: Math.round(utcDay(y, m, 1).getTime() / 864e5),
    end: Math.round(utcDay(y, m + 1, 1).getTime() / 864e5) - 1,
  };
}
function readEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { id, domain, topic } = raw;
  if (typeof id !== 'string' || id.length > 64 || !KEBAB.test(id)) return null;
  if (!EVENT_DOMAINS.includes(domain)) return null;
  // The topic must be one the rest of the profile layer knows, and must agree with the domain:
  // a contradictory entry would file the event under the wrong half of the app.
  if (!Object.hasOwn(TOPIC_DOMAINS, topic) || TOPIC_DOMAINS[topic] !== domain) return null;
  const start = dayIndex(raw.start),
    end = dayIndex(raw.end);
  if (start === null || end === null || end < start) return null;
  const name = str(raw.name, NAME_MAX);
  if (!name) return null;
  const sourceUrl = str(raw.sourceUrl, URL_MAX);
  if (!/^https:\/\//.test(sourceUrl)) return null;
  const headline = str(raw.headline, TEXT_MAX);
  return {
    id,
    name,
    domain,
    topic,
    start: raw.start,
    end: raw.end,
    startDay: start,
    endDay: end,
    blurb: str(raw.blurb, TEXT_MAX),
    whyQuiz: str(raw.whyQuiz, TEXT_MAX),
    sourceUrl,
    ...(headline ? { headline } : {}),
  };
}
/**
 * readEvents(list) -> frozen, sanitised calendar. Drops anything with a bad id, domain, topic, date
 * range or non-https source, clamps the prose, dedupes by id (first wins) and sorts by start date.
 * Same defensive posture as readProgression: never trust the stored shape, never throw.
 */
export function readEvents(list = EVENTS) {
  const seen = new Set(),
    out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const event = readEvent(raw);
    if (!event || seen.has(event.id)) continue;
    seen.add(event.id);
    out.push(Object.freeze(event));
    if (out.length >= EVENT_LIMIT) break;
  }
  out.sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay || (a.id < b.id ? -1 : 1));
  return Object.freeze(out);
}
/**
 * groupEvents(at, list) -> { live, upcoming, recent }, each frozen and capped at GROUP_LIMIT.
 * `upcoming` starts within UPCOMING_DAYS and is soonest first; `recent` ended within RECENT_DAYS and
 * is newest first; `live` is on right now, finishing soonest first.
 */
export function groupEvents(at = Date.now(), list = EVENTS) {
  const today = todayIndex(at),
    live = [],
    upcoming = [],
    recent = [];
  if (today !== null)
    for (const event of readEvents(list)) {
      if (today < event.startDay) {
        if (event.startDay - today <= UPCOMING_DAYS) upcoming.push(event);
      } else if (today > event.endDay) {
        if (today - event.endDay <= RECENT_DAYS) recent.push(event);
      } else live.push(event);
    }
  live.sort((a, b) => a.endDay - b.endDay || (a.id < b.id ? -1 : 1));
  recent.sort((a, b) => b.endDay - a.endDay || (a.id < b.id ? -1 : 1));
  return Object.freeze({
    live: Object.freeze(live.slice(0, GROUP_LIMIT)),
    upcoming: Object.freeze(upcoming.slice(0, GROUP_LIMIT)),
    recent: Object.freeze(recent.slice(0, GROUP_LIMIT)),
  });
}
// -----------------------------------------------------------------------------------------------
// Limited-time modes
const template = (id, name, tagline, when, domain, mode, xpBonus, badge) =>
  Object.freeze({
    id,
    name,
    tagline,
    when,
    domain,
    duel: Object.freeze({ mode, duration: MODE_DURATION[mode] }),
    xpBonus,
    badge,
  });
/**
 * The shapes a limited-time mode can take. `when` is matched against the event's standing in the
 * month and `domain` against the event's own domain, so every (when, domain) pair is covered.
 * The timer is not a free parameter: it comes from the format via MODE_DURATION, so a limited mode
 * can never offer a clock the duel rules would reject. `xpBonus` is a multiplier in [1, 2] on the
 * flat XP.eventMode bonus.
 */
export const MODE_TEMPLATES = Object.freeze([
  template(
    'final-whistle',
    'Final whistle',
    'While it is on.',
    'live',
    'sports',
    'quick',
    1.5,
    'final-whistle',
  ),
  template(
    'mission-window',
    'Mission window',
    'The window is open right now.',
    'live',
    'science',
    'quick',
    1.4,
    'mission-window',
  ),
  template(
    'countdown',
    'Countdown',
    'Before the first whistle.',
    'upcoming',
    'sports',
    'trilogy',
    1.25,
    'countdown-clock',
  ),
  template(
    'form-guide',
    'Form guide',
    'Everything that led up to it.',
    'upcoming',
    'sports',
    'quick',
    1.2,
    'form-guide',
  ),
  template(
    'prize-watch',
    'Prize watch',
    'Read up before the announcement.',
    'upcoming',
    'science',
    'trilogy',
    1.2,
    'prize-watch',
  ),
  template('replay', 'Replay', 'Settle what happened.', 'past', 'sports', 'gauntlet', 1.15, 'instant-replay'),
  template(
    'post-mortem',
    'Post-mortem',
    'Three rounds on how it ended.',
    'past',
    'sports',
    'trilogy',
    1.15,
    'post-mortem',
  ),
  template(
    'field-report',
    'Field report',
    'Go through the findings.',
    'past',
    'science',
    'gauntlet',
    1.1,
    'field-report',
  ),
]);
export const modeTemplateById = (id) => MODE_TEMPLATES.find((t) => t.id === id) ?? null;
/**
 * Where an event stands relative to a whole month rather than to a single day: overlapping the month
 * is 'live', starting after it is 'upcoming', ending before it is 'past'. Judging by the month is
 * what makes monthlyModes() give the same answer on every day of that month.
 */
function monthStanding(event, month) {
  if (event.startDay > month.end) return 'upcoming';
  if (event.endDay < month.start) return 'past';
  return 'live';
}
/** The slice of the month during which a mode is worth playing, clamped to the event's relevance. */
function modeWindow(event, standing, month) {
  if (standing === 'live')
    return { start: Math.max(month.start, event.startDay), end: Math.min(month.end, event.endDay) };
  if (standing === 'upcoming')
    return { start: Math.max(month.start, event.startDay - UPCOMING_DAYS), end: month.end };
  return { start: month.start, end: Math.min(month.end, event.endDay + RECENT_DAYS) };
}
/**
 * monthlyModes(at, list) -> up to MONTHLY_MODE_LIMIT limited modes for the month containing `at`.
 * Deterministic for a given (month, dataset): the events are ranked by relevance to the month (live
 * first, then soonest upcoming, then most recent past) and a mulberry32 stream seeded from the month
 * key and the dataset size picks each event's template from the ones matching its standing and
 * domain. Nothing here reads the clock beyond the month `at` falls in.
 */
export function monthlyModes(at = Date.now(), list = EVENTS) {
  const month = monthBounds(at);
  if (!month) return Object.freeze([]);
  const events = readEvents(list);
  const live = [],
    upcoming = [],
    past = [];
  for (const event of events) {
    const standing = monthStanding(event, month);
    if (standing === 'live') live.push(event);
    else if (standing === 'upcoming') {
      if (event.startDay - month.end <= UPCOMING_DAYS) upcoming.push(event);
    } else if (month.start - event.endDay <= RECENT_DAYS) past.push(event);
  }
  live.sort((a, b) => a.endDay - b.endDay || (a.id < b.id ? -1 : 1));
  upcoming.sort((a, b) => a.startDay - b.startDay || (a.id < b.id ? -1 : 1));
  past.sort((a, b) => b.endDay - a.endDay || (a.id < b.id ? -1 : 1));
  const rng = mulberry32(fnv1a32(`${month.key}:${events.length}`));
  const used = new Set(),
    modes = [];
  for (const event of [...live, ...upcoming, ...past].slice(0, MONTHLY_MODE_LIMIT)) {
    const standing = monthStanding(event, month);
    const matching = MODE_TEMPLATES.filter((t) => t.when === standing && t.domain === event.domain);
    if (!matching.length) continue;
    const fresh = matching.filter((t) => !used.has(t.id));
    const pool = fresh.length ? fresh : matching;
    const picked = pool[Math.floor(rng() * pool.length)] ?? pool[0];
    used.add(picked.id);
    const window = modeWindow(event, standing, month);
    modes.push(
      Object.freeze({
        id: `${month.key}:${event.id}:${picked.id}`,
        monthKey: month.key,
        event,
        template: picked,
        window: Object.freeze({ start: dayIso(window.start), end: dayIso(window.end) }),
        duel: Object.freeze({
          mode: picked.duel.mode,
          duration: picked.duel.duration,
          topic: event.topic,
          domain: event.domain,
        }),
        xpBonus: picked.xpBonus,
        badge: picked.badge,
      }),
    );
  }
  return Object.freeze(modes);
}
/** True while `at` falls inside a mode's window, comparing whole local days at both ends. */
export function isModeOpen(mode, at = Date.now()) {
  const start = dayIndex(mode?.window?.start),
    end = dayIndex(mode?.window?.end),
    today = todayIndex(at);
  if (start === null || end === null || today === null) return false;
  return today >= start && today <= end;
}
/** The month's modes that are playable today. */
export function activeModes(at = Date.now(), list = EVENTS) {
  return Object.freeze(monthlyModes(at, list).filter((mode) => isModeOpen(mode, at)));
}
/** Sanity check used by the tests: every duel config a template can produce is a legal duel config. */
export const validModeDuel = (duel) =>
  !!duel && MODES.includes(duel.mode) && duel.duration === MODE_DURATION[duel.mode];
