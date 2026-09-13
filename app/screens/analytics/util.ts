/**
 * app/screens/analytics/util.ts — pure helpers for the measurement screen.
 *
 * No I/O and no clock of its own: every formatter takes what it prints, exactly like
 * ../events/util.ts. Dates come from a fixed English table rather than `toLocaleDateString`,
 * because the server and the browser can resolve different locales and the resulting text
 * mismatch lands in the console as a hydration error.
 */
import { useSyncExternalStore } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 'YYYY-MM-DD' → a local Date at midnight. `new Date('2026-09-13')` would read back as UTC
 * midnight and print as the day before for anyone west of Greenwich, so the parts are passed
 * separately, the way lib/analytics.mjs writes the key in the first place.
 */
export function localDate(iso: string | null): Date | null {
  const m = ISO.exec(iso ?? '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** '2026-09-13' → '13 Sep 2026' (or '13 Sep' without the year). */
export function formatDay(iso: string | null, withYear = true): string {
  const m = ISO.exec(iso ?? '');
  if (!m) return '';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}${withYear ? ` ${m[1]}` : ''}`;
}

/** '2026-09-13' → 'Sun 13 Sep' — the form the activity chart's readout uses. */
export function formatWeekday(iso: string | null): string {
  const date = localDate(iso);
  return date ? `${WEEKDAYS[date.getDay()]} ${formatDay(iso, false)}` : '';
}

/**
 * A stored epoch stamp → '13 Sep 2026'. `0` is the engine's "never happened" and returns '',
 * so a funnel step can print "Not yet" instead of 1 Jan 1970.
 */
export function formatStamp(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return '';
  const d = new Date(at);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** A duration in the smallest honest unit: '—', '42 s', '6 min', '2 h 10 min'. */
export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return '—';
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 90) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** 'day', '2 days' — used wherever a count of whole days is printed beside a number. */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- the screen's clock ---------- */

const TICK_MS = 60_000;
let cached = 0;
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
};
const snapshot = () => {
  const now = Date.now();
  if (now - cached >= 30_000) cached = now;
  return cached;
};
/**
 * The server has no device to measure, so its snapshot is 0 and the screen renders its loading
 * state for that frame — the same markup the browser hydrates, and never a fabricated "today".
 */
const serverSnapshot = () => 0;

export const useMeasurementNow = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot);

/* ---------- downloads ---------- */

/**
 * Hand the player a file built here in the browser. Same shape as the profile export in
 * app/use-player.ts: a Blob, an object URL, a synthetic click, and a revoke on the next tick.
 * Nothing is sent anywhere — there is no endpoint in this path at all.
 */
export function downloadText(filename: string, text: string, type: string) {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
