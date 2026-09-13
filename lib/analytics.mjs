// Device-local analytics: sessions, engaged time, a day-by-day activity record and an honest
// retention answer. Pure and I/O-free like lib/progression.mjs and lib/events.mjs — no network call,
// no storage, no third-party SDK, nothing personal, and `Date.now()` only ever as a default argument
// so every function is deterministic under test.
//
// The rule this module exists to keep: one device is a sample of one. It can say whether THIS player
// came back on day 1, 7 or 30 — true, false, or `null` for "that day has not finished yet" — and it
// can never produce a retention RATE, because a rate needs a cohort. No export here is named or
// shaped like a rate, `summary()` ships `sampleSize: 1` and the caveat string inside the payload, and
// every window that has not elapsed reads `null` rather than a misleading 0.
import { dayIndex, dayIso } from './events.mjs';
export { dayIndex };
export const ANALYTICS_VERSION = 1;
/**
 * A session ends after 30 minutes without activity. This is a chosen convention, not a standard or a
 * measurement: any screen quoting session counts must name the threshold (see SESSION_NOTE).
 */
export const SESSION_GAP_MS = 30 * 60 * 1000;
/** Caps: day-entries retained, and the default width of dailySeries(). */
export const DAY_LIMIT = 120;
export const SERIES_DAYS = 30;
export const CONSENT_STATES = Object.freeze(['unset', 'granted', 'denied']);
/** Counters a screen may report via the `count` action. */
export const COUNT_KEYS = Object.freeze(['rounds', 'matches', 'cards', 'quests']);
const DAY_FIELDS = Object.freeze(['sessions', 'ms', ...COUNT_KEYS]);
export const FUNNEL_KEYS = Object.freeze([
  'firstOpenAt',
  'firstAnswerAt',
  'firstMatchAt',
  'firstExpeditionAt',
  'firstReturnAt',
]);
// Which counter stamps which funnel step the first time it is non-zero. `quests` has no step.
const FUNNEL_OF = Object.freeze({
  rounds: 'firstAnswerAt',
  matches: 'firstMatchAt',
  cards: 'firstExpeditionAt',
});
export const SAMPLE_CAVEAT =
  'This is one device, a sample of one: it can only say whether you came back on day 1, 7 or 30 — ' +
  'yes, no, or not yet. A retention rate needs a cohort of devices, which this app does not collect.';
export const SESSION_NOTE =
  `A session ends after ${SESSION_GAP_MS / 60000} minutes without activity, and engaged time is only ` +
  'counted while the app is on screen. Both are chosen conventions, not standards.';
const ANON_ID = /^[a-f0-9]{32}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n) => String(n).padStart(2, '0');
const nat = (v, max = Number.MAX_SAFE_INTEGER) => (Number.isSafeInteger(v) && v > 0 ? Math.min(v, max) : 0);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
/** A stored day key is kept only when it is a real calendar day; 'YYYY-MM-DD' also sorts in order. */
const validDay = (v) => (typeof v === 'string' && DAY_RE.test(v) && dayIndex(v) !== null ? v : null);
const zeros = () => Object.fromEntries(DAY_FIELDS.map((k) => [k, 0]));
/**
 * dayKey(at) -> the viewer's own calendar day as 'YYYY-MM-DD', null for a non-finite timestamp.
 * lib/events.mjs keeps this conversion private (monthKey/todayIndex use it internally), so it is
 * re-implemented here identically: local getters only. `toISOString()` would put everyone east or
 * west of Greenwich on the wrong day for part of every day, and `new Date('YYYY-MM-DD')` reads back
 * as UTC midnight — dayIndex() below is imported from events.mjs for exactly that reason.
 */
export function dayKey(at = Date.now()) {
  if (!Number.isFinite(at)) return null;
  const d = new Date(at),
    y = d.getFullYear();
  if (!Number.isFinite(y)) return null;
  return `${String(y).padStart(4, '0')}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Whole local days between two day keys, or null when either is not a real calendar day. */
export function daysBetween(from, to) {
  const a = dayIndex(from),
    b = dayIndex(to);
  return a === null || b === null ? null : b - a;
}
// ---------------------------------------------------------------------------------------------
// State
export function emptyAnalytics() {
  return Object.freeze({
    version: ANALYTICS_VERSION,
    installDay: null,
    installedAt: 0,
    lastDay: null,
    lastBeatAt: 0,
    days: Object.freeze({}),
    totals: Object.freeze(zeros()),
    funnel: Object.freeze(Object.fromEntries(FUNNEL_KEYS.map((k) => [k, 0]))),
    consent: 'unset',
    anonId: null,
  });
}
const readDay = (days, key) => {
  const e = obj(obj(days)[key]),
    out = zeros();
  for (const f of DAY_FIELDS) out[f] = nat(e[f]);
  return out;
};
const alive = (entry) => DAY_FIELDS.some((f) => entry[f] > 0);
/** Day keys held by a state, oldest first, dropping anything that is not a real calendar day. */
const dayKeys = (days) => Object.keys(obj(days)).filter(validDay).sort();
/**
 * Sanitizer: clamps every int to a safe non-negative integer, drops unknown keys and unreal days,
 * keeps the most recent DAY_LIMIT day-entries, drops all-zero entries (the reducer never writes one),
 * refuses an anonId that is not 32 hex characters or that is held without consent, and freezes the
 * result. Stable through a JSON round trip, and idempotent.
 */
export function readAnalytics(value) {
  const v = value && typeof value === 'object' && value.version === ANALYTICS_VERSION ? value : null;
  if (!v) return emptyAnalytics();
  const days = {},
    sums = zeros();
  for (const key of dayKeys(v.days).slice(-DAY_LIMIT)) {
    const entry = readDay(v.days, key);
    if (!alive(entry)) continue;
    for (const f of DAY_FIELDS) sums[f] += entry[f];
    days[key] = Object.freeze(entry);
  }
  const installDay = validDay(v.installDay);
  const totals = zeros();
  // Lifetime totals outlive the 120-day window, so they are only ever raised to the retained sum.
  for (const f of DAY_FIELDS) totals[f] = Math.max(nat(obj(v.totals)[f]), sums[f]);
  const funnel = {};
  for (const k of FUNNEL_KEYS) funnel[k] = nat(obj(v.funnel)[k]);
  const consent = CONSENT_STATES.includes(v.consent) ? v.consent : 'unset';
  return Object.freeze({
    version: ANALYTICS_VERSION,
    installDay,
    installedAt: installDay ? nat(v.installedAt) : 0,
    lastDay: validDay(v.lastDay),
    lastBeatAt: nat(v.lastBeatAt),
    days: Object.freeze(days),
    totals: Object.freeze(totals),
    funnel: Object.freeze(funnel),
    consent,
    // The id only exists for the separate, opt-in cohort beacon; without consent it is never kept.
    anonId: consent === 'granted' && typeof v.anonId === 'string' && ANON_ID.test(v.anonId) ? v.anonId : null,
  });
}
/** Rebuilds the day map with `key` replaced, sorted oldest first and capped at the most recent 120. */
function writeDays(days, key, entry) {
  const out = {},
    keys = [...new Set([...dayKeys(days), key])].sort();
  for (const k of keys.slice(-DAY_LIMIT)) {
    const value = k === key ? entry : readDay(days, k);
    if (alive(value)) out[k] = Object.freeze(value);
  }
  return Object.freeze(out);
}
// ---------------------------------------------------------------------------------------------
// Reducer
/**
 * reduceAnalytics(analytics, action, at) applies one of three actions and returns the SAME reference
 * when nothing changed:
 *  - { type: 'open' }  start or continue a session; sets install day and funnel stamps.
 *  - { type: 'beat', ms }  add engaged milliseconds to today, at most SESSION_GAP_MS per beat so a
 *    backgrounded or throttled tab can never inflate the number.
 *  - { type: 'count', rounds?, matches?, cards?, quests? }  increment today's counters and totals.
 * A non-finite `at` records nothing rather than silently reading the clock.
 */
export function reduceAnalytics(analytics, action, at = Date.now()) {
  const state = analytics || emptyAnalytics();
  const day = dayKey(at);
  if (!day || !action || typeof action.type !== 'string') return state;
  const stamp = nat(Math.round(at));
  const entry = readDay(state.days, day),
    totals = zeros(),
    funnel = {};
  for (const f of DAY_FIELDS) totals[f] = nat(obj(state.totals)[f]);
  for (const k of FUNNEL_KEYS) funnel[k] = nat(obj(state.funnel)[k]);
  let installDay = validDay(state.installDay),
    installedAt = nat(state.installedAt),
    lastBeatAt = nat(state.lastBeatAt),
    lastDay = validDay(state.lastDay),
    changed = false;
  const add = (field, n) => {
    if (n <= 0) return;
    entry[field] += n;
    totals[field] += n;
    changed = true;
  };
  const stampFunnel = (key) => {
    if (funnel[key] === 0 && stamp > 0) {
      funnel[key] = stamp;
      changed = true;
    }
  };
  if (action.type === 'open') {
    if (!installDay) {
      installDay = day;
      installedAt = stamp;
      changed = true;
    }
    stampFunnel('firstOpenAt');
    // A new session when the gap has elapsed, or when this device has not opened at all today.
    if (lastBeatAt === 0 || at - lastBeatAt > SESSION_GAP_MS || entry.sessions === 0) add('sessions', 1);
    // Coming back on any later day is the whole point of the record; it is stamped once, ever.
    if (day !== installDay) stampFunnel('firstReturnAt');
    if (lastBeatAt !== stamp) {
      lastBeatAt = stamp;
      changed = true;
    }
  } else if (action.type === 'beat') {
    const ms = Number.isFinite(action.ms) ? Math.min(SESSION_GAP_MS, Math.floor(action.ms)) : 0;
    if (ms <= 0) return state;
    add('ms', ms);
    lastBeatAt = stamp;
  } else if (action.type === 'count') {
    for (const k of COUNT_KEYS) {
      const n = Number.isFinite(action[k]) ? Math.floor(action[k]) : 0;
      if (n <= 0) continue;
      add(k, n);
      if (FUNNEL_OF[k]) stampFunnel(FUNNEL_OF[k]);
    }
  } else return state;
  if (!changed) return state;
  const days = writeDays(state.days, day, entry);
  // Lifetime totals outlive the retained days but must never read below their sum, which is also
  // what readAnalytics() enforces, so a reduced state sanitises back to itself.
  const sums = zeros();
  for (const e of Object.values(days)) for (const f of DAY_FIELDS) sums[f] += e[f];
  for (const f of DAY_FIELDS) if (totals[f] < sums[f]) totals[f] = sums[f];
  return Object.freeze({
    version: ANALYTICS_VERSION,
    installDay,
    installedAt,
    lastDay: day === lastDay ? lastDay : day,
    lastBeatAt,
    days,
    totals: Object.freeze(totals),
    funnel: Object.freeze(funnel),
    consent: CONSENT_STATES.includes(state.consent) ? state.consent : 'unset',
    anonId:
      typeof state.anonId === 'string' && ANON_ID.test(state.anonId) && state.consent === 'granted'
        ? state.anonId
        : null,
  });
}
// ---------------------------------------------------------------------------------------------
// Reading the record
const median = (list) => {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b),
    mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
/**
 * retention(analytics, at) -> the device's own comeback record. `d1`/`d7`/`d30` are
 * `true | false | null`: true when this device was active on that day after installing, false only
 * once the day is definitely over, and **null while the window has not elapsed** — the common case,
 * which must never be rendered as 0%. It is null too when the day has aged out of the 120-day
 * record, because "not stored" is not "did not happen". These are booleans for one device and are
 * never a rate: see SAMPLE_CAVEAT.
 * `medianSessionMs` is the median of each active day's average session, since only day totals are
 * kept — it is an estimate of a typical session, not a measurement of one.
 */
export function retention(analytics, at = Date.now()) {
  const a = readAnalytics(analytics);
  const todayIdx = dayIndex(dayKey(at)),
    installIdx = dayIndex(a.installDay);
  const entries = Object.values(a.days),
    indexes = new Set(Object.keys(a.days).map(dayIndex));
  const earliest = indexes.size ? Math.min(...indexes) : null;
  const sessions = entries.reduce((n, e) => n + e.sessions, 0);
  const activeDays = entries.length;
  const perSession = entries.filter((e) => e.sessions > 0).map((e) => e.ms / e.sessions);
  const came = (n) => {
    if (installIdx === null || todayIdx === null || earliest === null) return null;
    const target = installIdx + n;
    if (indexes.has(target)) return true;
    if (todayIdx <= target) return null; // that day is not over yet
    if (earliest > target) return null; // trimmed out of the retained window
    return false;
  };
  const ms = median(perSession);
  return Object.freeze({
    installDay: a.installDay,
    daysSinceInstall: installIdx !== null && todayIdx !== null ? Math.max(0, todayIdx - installIdx) : 0,
    activeDays,
    d1: came(1),
    d7: came(7),
    d30: came(30),
    sessionsPerActiveDay: activeDays ? Math.round((sessions / activeDays) * 100) / 100 : 0,
    medianSessionMs: ms === null ? null : Math.round(ms),
    totalMs: a.totals.ms,
  });
}
/**
 * dailySeries(analytics, at, days) -> one row per local day ending today, oldest first, with absent
 * days filled with zeros so a chart cannot imply activity it does not have.
 */
export function dailySeries(analytics, at = Date.now(), days = SERIES_DAYS) {
  const a = readAnalytics(analytics);
  const todayIdx = dayIndex(dayKey(at));
  if (todayIdx === null) return Object.freeze([]);
  const width = Number.isSafeInteger(days) && days > 0 ? Math.min(days, DAY_LIMIT) : SERIES_DAYS;
  const out = [];
  for (let i = width - 1; i >= 0; i--) {
    const day = dayIso(todayIdx - i);
    const e = Object.hasOwn(a.days, day) ? a.days[day] : null;
    out.push(
      Object.freeze({
        day,
        sessions: e ? e.sessions : 0,
        ms: e ? e.ms : 0,
        rounds: e ? e.rounds : 0,
        active: e !== null,
      }),
    );
  }
  return Object.freeze(out);
}
/**
 * summary(analytics, at) -> the small object a dashboard renders. It carries `sampleSize: 1` and the
 * caveat with it, so no screen can quote the numbers without the sentence that qualifies them, and
 * it reports comebacks under `returned`, never under anything that reads like a rate.
 */
export function summary(analytics, at = Date.now()) {
  const a = readAnalytics(analytics);
  const r = retention(a, at);
  return Object.freeze({
    sampleSize: 1,
    caveat: SAMPLE_CAVEAT,
    sessionGapMs: SESSION_GAP_MS,
    sessionNote: SESSION_NOTE,
    installDay: r.installDay,
    installedAt: a.installedAt,
    lastDay: a.lastDay,
    daysSinceInstall: r.daysSinceInstall,
    activeDays: r.activeDays,
    returned: Object.freeze({ d1: r.d1, d7: r.d7, d30: r.d30 }),
    sessions: a.totals.sessions,
    sessionsPerActiveDay: r.sessionsPerActiveDay,
    medianSessionMs: r.medianSessionMs,
    totalMs: r.totalMs,
    totals: a.totals,
    funnel: a.funnel,
    consent: a.consent,
  });
}
/** Everything recorded about this device, as a plain (unfrozen) JSON-safe object the player can keep. */
export function exportAnalytics(analytics) {
  const a = readAnalytics(analytics);
  return {
    version: a.version,
    installDay: a.installDay,
    installedAt: a.installedAt,
    lastDay: a.lastDay,
    lastBeatAt: a.lastBeatAt,
    days: Object.fromEntries(Object.entries(a.days).map(([day, e]) => [day, { ...e }])),
    totals: { ...a.totals },
    funnel: { ...a.funnel },
    consent: a.consent,
    anonId: a.anonId,
  };
}
/**
 * toCsv(analytics) -> a header row plus one row per retained day, oldest first. Every cell is either
 * a 'YYYY-MM-DD' key or a non-negative integer, so nothing here can need quoting or escaping.
 */
export function toCsv(analytics) {
  const a = readAnalytics(analytics);
  const rows = Object.entries(a.days).map(([day, e]) => [day, ...DAY_FIELDS.map((f) => e[f])].join(','));
  return [['day', ...DAY_FIELDS].join(','), ...rows].join('\n') + '\n';
}
