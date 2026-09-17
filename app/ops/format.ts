/**
 * app/ops/format.ts — pure formatters for the founder dashboard.
 *
 * Fixed English tables rather than `toLocaleString`, for the same reason app/screens/analytics/util.ts
 * gives: the server and the browser can resolve different locales and the mismatch is a hydration
 * error. Every function takes what it prints; none reads a clock.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Thousands-grouped integer: 1284 → '1,284'. */
export function grouped(n: number): string {
  const whole = Math.round(Math.abs(n));
  const text = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? `-${text}` : text;
}

/** Auto-compact for tiles: 1,284 / 12.9K / 4.2M. */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${(n / 1000).toFixed(abs >= 100_000 ? 0 : 1)}K`;
  return grouped(n);
}

/** A money amount with its ISO code beside it: '4.50 USD'. Never a symbol the code did not earn. */
export function money(n: number, currency: string | null): string {
  if (!Number.isFinite(n)) return '—';
  const text = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return currency ? `${text} ${currency}` : text;
}

/** 0.1234 → '12.3%'. */
export function percent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Bytes in the smallest honest unit. */
export function bytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

/** '2026-09-13' → 'Sun 13 Sep'. */
export function weekday(iso: string): string {
  const m = ISO.exec(iso);
  if (!m) return iso;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return `${WEEKDAYS[date.getUTCDay()]} ${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}`;
}

/** '2026-09-13' → '13 Sep'. */
export function shortDay(iso: string): string {
  const m = ISO.exec(iso);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : iso;
}

/** An age in ms → '42 s ago', '6 min ago', '2 h 10 min ago', '3 d ago'. */
export function ago(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return 'never';
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} s ago`;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 90) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min ago` : `${hours} h ago`;
  }
  return `${Math.floor(hours / 24)} d ago`;
}

/** An epoch stamp → '13 Sep 14:05 UTC'. Stamps here are server times, so UTC is the honest zone. */
export function stampUtc(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return '';
  const d = new Date(at);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${hh}:${mm} UTC`;
}

/** A URL shortened to its path for a table cell: 'https://a.b/c/d?x' → '/c/d'. */
export function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname === '/' && !u.search ? u.host : u.pathname;
  } catch {
    return url;
  }
}

/**
 * A "nice" axis ceiling: the smallest of 1·10ⁿ, 2·10ⁿ, 2.5·10ⁿ, 5·10ⁿ at or above `max`, so the
 * ticks read as round numbers (0 / 500 / 1,000) rather than the data's own peak.
 */
export function niceCeiling(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1;
  const exponent = Math.floor(Math.log10(max));
  const base = 10 ** exponent;
  for (const step of [1, 2, 2.5, 5, 10]) if (step * base >= max) return step * base;
  return 10 * base;
}
