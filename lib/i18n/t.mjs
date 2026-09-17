/**
 * lib/i18n/t.mjs — dictionary lookup, `{name}` interpolation and one/other plurals.
 *
 * Pure. A dictionary is a flat object of key → string. Plural keys are `<key>.one` and
 * `<key>.other`, chosen with Intl.PluralRules for the locale (Hindi counts 0 as "one", which is
 * why the category is asked for rather than compared against 1). A missing key returns the key
 * itself so a gap is visible on screen and in a test, never a blank.
 */
import { DEFAULT_LOCALE, INTL_TAGS } from './locales.mjs';

const PLACEHOLDER = /\{(\w+)\}/g;

/** Replace every `{name}` that `vars` knows; unknown names are left as written. */
export function interpolate(text, vars) {
  if (!vars || typeof text !== 'string') return text;
  return text.replace(PLACEHOLDER, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** The string for `key`, with `{name}` placeholders filled from `vars`; the key itself when absent. */
export function translate(dict, key, vars) {
  const text = dict && typeof dict === 'object' ? dict[key] : undefined;
  return typeof text === 'string' ? interpolate(text, vars) : key;
}

const rules = new Map();
function pluralRules(locale) {
  const tag = INTL_TAGS[locale] ?? INTL_TAGS[DEFAULT_LOCALE];
  let r = rules.get(tag);
  if (!r) {
    r = new Intl.PluralRules(tag);
    rules.set(tag, r);
  }
  return r;
}

/** The CLDR category ('one' | 'other', …) `count` falls in for the locale. */
export function pluralCategory(locale, count) {
  return pluralRules(locale).select(Number.isFinite(count) ? count : 0);
}

/**
 * The plural form for `key` and `count`: `<key>.<category>`, falling back to `<key>.other`, with
 * `{count}` (and any extra vars) filled in. The count is printed as given: callers format it
 * first when they want locale grouping.
 */
export function plural(dict, locale, key, count, vars) {
  if (!Number.isFinite(count)) count = 0;
  const category = pluralCategory(locale, count);
  const exact = dict?.[`${key}.${category}`];
  const text = typeof exact === 'string' ? exact : dict?.[`${key}.other`];
  return typeof text === 'string' ? interpolate(text, { count, ...vars }) : `${key}.${category}`;
}

/** Split `text` around `{slot}` so a caller can put a node where the placeholder was. */
export function splitAt(text, slot) {
  const marker = `{${slot}}`;
  const at = typeof text === 'string' ? text.indexOf(marker) : -1;
  return at < 0 ? [text, null] : [text.slice(0, at), text.slice(at + marker.length)];
}

/** Bind a dictionary and locale into the `t` / `n` pair the React hook exposes. */
export function bind(dict, locale) {
  return {
    t: (key, vars) => translate(dict, key, vars),
    n: (key, count, vars) => plural(dict, locale, key, count, vars),
  };
}
