'use client';
/**
 * app/screens/events/clock.ts — the one clock every Events surface reads.
 *
 * `useSyncExternalStore` with a cached snapshot, like app/screens/home/use-now.ts, with one extra
 * job: the *server* snapshot is local noon on CALENDAR_ASOF rather than 0. React uses the server
 * snapshot for the hydration render too, so the markup the server sent and the markup the browser
 * hydrates are identical (no mismatch in the console), and the calendar it shows for that one frame
 * is the day the data was actually verified — never a fabricated "today". The real clock takes over
 * on the first commit after hydration.
 */
import { useSyncExternalStore } from 'react';
import { CALENDAR_ASOF } from '@/lib/events.mjs';

const TICK_MS = 60_000;

/** Local noon on the as-of day: the same calendar day in every timezone, on the server and here. */
function asofAt(): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(CALENDAR_ASOF as string);
  if (!m) return 0;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0).getTime();
}
const ASOF_AT = asofAt();

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
const serverSnapshot = () => ASOF_AT;

export const useCalendarNow = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot);
