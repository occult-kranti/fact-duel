/**
 * lib/i18n/format.mjs — numbers and dates per locale.
 *
 * Pure. Numbers go through Intl.NumberFormat with the Latin numbering system in every locale:
 * coin amounts, XP and scores must read the same in Hindi and in English, so Devanagari digits
 * are never used. Hindi grouping (1,00,000) is the locale's own and is kept. Dates go through
 * Intl.DateTimeFormat; `isoDay` prints a 'YYYY-MM-DD' string as a date without constructing a
 * local Date (it is parsed as UTC noon so no timezone can move it a day).
 */
import { DEFAULT_LOCALE, INTL_TAGS } from './locales.mjs';

const numbers = new Map();
const dates = new Map();

function tagOf(locale) {
  return INTL_TAGS[locale] ?? INTL_TAGS[DEFAULT_LOCALE];
}

function numberFormatter(locale, options) {
  const key = `${locale}|${JSON.stringify(options ?? {})}`;
  let f = numbers.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tagOf(locale), { numberingSystem: 'latn', ...options });
    numbers.set(key, f);
  }
  return f;
}

function dateFormatter(locale, options) {
  const key = `${locale}|${JSON.stringify(options ?? {})}`;
  let f = dates.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(tagOf(locale), { numberingSystem: 'latn', ...options });
    dates.set(key, f);
  }
  return f;
}

/** A number in the locale's grouping, Latin digits always. Non-numbers print as '0'. */
export function formatNumber(locale, value, options) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return numberFormatter(locale, options).format(n);
}

/** A timestamp or Date, in the locale. Default: day, short month, year. */
export function formatDate(locale, value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter(locale, options).format(date);
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 'YYYY-MM-DD' → a date in the locale, with the month spelled out by default. Parsed as UTC noon
 * and printed in UTC, so the day never shifts with the viewer's zone. Malformed input → ''.
 */
export function formatIsoDay(locale, iso, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const m = ISO.exec(typeof iso === 'string' ? iso : '');
  if (!m) return '';
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter(locale, { ...options, timeZone: 'UTC' }).format(date);
}

/** The month of a 'YYYY-MM' key, spelled out with its year. */
export function formatMonth(locale, key) {
  const m = /^(\d{4})-(\d{2})$/.exec(typeof key === 'string' ? key : '');
  if (!m) return '';
  return formatIsoDay(locale, `${m[1]}-${m[2]}-01`, { month: 'long', year: 'numeric' });
}

/** The formatters bound to one locale, as the React hook exposes them. */
export function bindFormat(locale) {
  return {
    number: (value, options) => formatNumber(locale, value, options),
    date: (value, options) => formatDate(locale, value, options),
    isoDay: (iso, options) => formatIsoDay(locale, iso, options),
    month: (key) => formatMonth(locale, key),
  };
}
