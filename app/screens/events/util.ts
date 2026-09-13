/**
 * app/screens/events/util.ts — pure helpers for every Events surface (screen, Home strip, Play row).
 *
 * No React, no I/O, no clock: every function takes `now` so the whole file is deterministic, exactly
 * like the engine in lib/events.mjs. Dates are printed from a fixed English table rather than
 * `toLocaleDateString`, because the server and the browser can resolve different locales and the
 * resulting text mismatch lands in the console as a hydration error.
 */
import { dayIndex, isModeOpen } from '@/lib/events.mjs';
import { MODE_NAMES, XP } from '@/lib/progression.mjs';
import type { CalendarEvent, EventMode } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

type Parts = { y: number; m: number; d: number };
const parts = (iso: string): Parts | null => {
  const m = ISO.exec(iso ?? '');
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
};

/** '2026-09-13' → '13 Sep 2026' (or '13 Sep' without the year). */
export function formatDay(iso: string, withYear = true): string {
  const p = parts(iso);
  if (!p) return '';
  return `${p.d} ${MONTHS[p.m - 1]}${withYear ? ` ${p.y}` : ''}`;
}

/**
 * A date range in as few words as the two ends allow:
 * '13 Sep 2026' · '8–13 Sep 2026' · '30 Aug – 13 Sep 2026' · '21 Nov 2025 – 8 Jan 2026'.
 */
export function formatRange(start: string, end: string): string {
  const a = parts(start),
    b = parts(end);
  if (!a) return '';
  if (!b || (a.y === b.y && a.m === b.m && a.d === b.d)) return formatDay(start);
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
  if (a.y === b.y) return `${formatDay(start, false)} – ${formatDay(end)}`;
  return `${formatDay(start)} – ${formatDay(end)}`;
}

/** 'YYYY-MM' → 'September 2026'. */
export function monthLabel(key: string | null): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key ?? '');
  return m ? `${MONTHS_LONG[Number(m[2]) - 1]} ${Number(m[1])}` : '';
}

/** Whole calendar days between an ISO day and the viewer's day; positive means the ISO day is later. */
export function daysFrom(iso: string, now: number): number | null {
  const day = dayIndex(iso),
    today = dayIndex(isoOf(now));
  return day === null || today === null ? null : day - today;
}

/** The viewer's own calendar day as 'YYYY-MM-DD' (local getters, so no timezone drift). */
export function isoOf(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(d.getFullYear()).padStart(4, '0')}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const weeks = (days: number) => {
  const n = Math.max(1, Math.round(days / 7));
  return n === 1 ? '1 week' : `${n} weeks`;
};

/**
 * The short "when" line beside a card's dates. Live events only get one while the end is close
 * enough to matter — a season running to next May does not need "ends in 259 days".
 */
export function whenLabel(event: CalendarEvent, status: string, now: number): string {
  if (status === 'live') {
    const left = daysFrom(event.end, now);
    if (left === null || left > 14) return '';
    return left <= 0 ? 'Ends today' : left === 1 ? 'Ends tomorrow' : `Ends in ${left} days`;
  }
  if (status === 'upcoming') {
    const until = daysFrom(event.start, now);
    if (until === null) return '';
    if (until <= 1) return 'Tomorrow';
    return until <= 21 ? `In ${until} days` : `In ${weeks(until)}`;
  }
  const since = daysFrom(event.end, now);
  if (since === null) return '';
  const ago = -since;
  if (ago <= 0) return 'Just finished';
  if (ago === 1) return 'Yesterday';
  return ago <= 21 ? `${ago} days ago` : `${weeks(ago)} ago`;
}

/* ---------- limited-time modes ---------- */

export type ModeState = {
  open: boolean;
  /** 'open' now, 'before' the window starts, 'after' it has closed. */
  phase: 'open' | 'before' | 'after';
  /** One short reason, ready to print on a locked card: "Opens 25 Sep", "Closed 3 Sep". */
  reason: string;
  /** The whole window, e.g. "1–13 Sep 2026". */
  window: string;
};

export function modeState(mode: EventMode, now: number): ModeState {
  const window = formatRange(mode.window.start, mode.window.end);
  if (isModeOpen(mode, now))
    return { open: true, phase: 'open', reason: `Open until ${formatDay(mode.window.end, false)}`, window };
  const until = daysFrom(mode.window.start, now);
  if (until !== null && until > 0)
    return { open: false, phase: 'before', reason: `Opens ${formatDay(mode.window.start, false)}`, window };
  return { open: false, phase: 'after', reason: `Closed ${formatDay(mode.window.end, false)}`, window };
}

/** What clearing a mode pays: the flat bonus from lib/progression.mjs scaled by the template. */
export function modeXp(xpBonus: number) {
  const base = XP.eventMode as number;
  return { base, bonus: xpBonus, total: Math.round(base * Math.min(2, Math.max(1, xpBonus))) };
}

/** The duel a mode sets up, in the words the rest of the app uses. */
export function modeDuel(mode: EventMode) {
  const names = MODE_NAMES as Record<string, string>;
  return {
    name: names[mode.duel.mode] ?? mode.duel.mode,
    timer: `${mode.duel.duration}s`,
    topic: mode.duel.topic,
  };
}

const BADGE_NAMES: Record<string, string> = {
  'final-whistle': 'Final whistle',
  'mission-window': 'Mission window',
  'countdown-clock': 'Countdown clock',
  'form-guide': 'Form guide',
  'prize-watch': 'Prize watch',
  'instant-replay': 'Instant replay',
  'post-mortem': 'Post-mortem',
  'field-report': 'Field report',
};

/** A badge id as a name. Unknown ids are de-kebabed rather than invented. */
export function badgeLabel(id: string): string {
  if (BADGE_NAMES[id]) return BADGE_NAMES[id];
  const words = String(id ?? '')
    .replace(/-/g, ' ')
    .trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Badge';
}

/** The month's mode built on a given event, if the generator picked one. */
export const modeForEvent = (modes: readonly EventMode[], eventId: string) =>
  modes.find((m) => m.event.id === eventId) ?? null;
