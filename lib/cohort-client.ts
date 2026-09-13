/**
 * lib/cohort-client.ts — the one caller of the opt-in `cohort-ping` action.
 *
 * What it sends, and nothing else: the device's own random `anonId`, its install day key, and up to
 * the last 40 day rows of `{ day, sessions, ms, rounds, matches }` from lib/analytics.mjs. No name,
 * no account, no identifier of any other kind, no free text, no room token, no timestamps beyond
 * whole calendar days. The server writes no IP or header and never echoes the payload back.
 *
 * What it refuses to do: run without `consent === 'granted'` and an `anonId`, throw, or matter. A
 * measurement beacon that can break a duel is not worth having, so every failure path — offline, a
 * 4xx, a 503, a rate limit, an HTML error page from a static host, a non-JSON body, an aborted
 * fetch — resolves to 0 and is otherwise silent. Safe to call in the server-free static build,
 * where the request either never reaches an API or comes back as something that is not our JSON.
 *
 * This module is deliberately not wired into any screen: consent and the UI live elsewhere.
 */

/** Day rows are exactly the columns `cohort_days` holds. */
type CohortDay = { day: string; sessions: number; ms: number; rounds: number; matches: number };
type AnalyticsLike = {
  consent?: unknown;
  anonId?: unknown;
  installDay?: unknown;
  days?: unknown;
} | null;
/** The transport shape of `request` in lib/duel-client.ts: resolves with parsed JSON, or throws. */
type Transport = (body: unknown) => Promise<unknown>;

/** Mirrors COHORT.maxDays in lib/server/duel-service.mjs; more than this is rejected server-side. */
export const COHORT_PING_DAYS = 40;
const ANON_ID = /^[a-f0-9]{32}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const COUNTERS = ['sessions', 'ms', 'rounds', 'matches'] as const;

const isDay = (value: unknown): value is string => typeof value === 'string' && DAY.test(value);
const count = (value: unknown): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0;

/**
 * The last `COHORT_PING_DAYS` real calendar days held by the analytics state, oldest first, with
 * every counter coerced to a non-negative integer. Days before the install day are dropped rather
 * than sent for the server to reject.
 */
function recentDays(state: AnalyticsLike, installDay: string): CohortDay[] {
  const days =
    state && typeof state.days === 'object' && state.days ? (state.days as Record<string, unknown>) : {};
  return Object.keys(days)
    .filter((day) => isDay(day) && day >= installDay)
    .sort()
    .slice(-COHORT_PING_DAYS)
    .map((day) => {
      const entry = (days[day] ?? {}) as Record<string, unknown>;
      const row: CohortDay = { day, sessions: 0, ms: 0, rounds: 0, matches: 0 };
      for (const key of COUNTERS) row[key] = count(entry[key]);
      return row;
    });
}

/**
 * sendCohortPing(analytics, request) -> the number of day rows the server accepted, or 0.
 *
 * Resolves 0 and sends nothing at all when consent is not 'granted', when the device has no
 * `anonId` or install day, or when there is no day worth reporting. Never rejects.
 */
export async function sendCohortPing(analytics: AnalyticsLike, request: Transport): Promise<number> {
  try {
    const state = analytics && typeof analytics === 'object' ? analytics : null;
    if (!state || state.consent !== 'granted') return 0;
    const anonId = state.anonId;
    const installDay = state.installDay;
    if (typeof anonId !== 'string' || !ANON_ID.test(anonId)) return 0;
    if (!isDay(installDay)) return 0;
    if (typeof request !== 'function') return 0;
    const days = recentDays(state, installDay);
    if (days.length === 0) return 0;
    const reply = (await request({ action: 'cohort-ping', anonId, installDay, days })) as {
      ok?: unknown;
      stored?: unknown;
    } | null;
    // A static build, an HTML error page or any older server answers with something that is not
    // this exact shape; that is not an error to report, it is simply nothing measured.
    if (!reply || typeof reply !== 'object' || reply.ok !== true) return 0;
    return Number.isSafeInteger(reply.stored) && (reply.stored as number) > 0 ? (reply.stored as number) : 0;
  } catch {
    return 0;
  }
}
