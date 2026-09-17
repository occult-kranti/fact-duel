/**
 * lib/i18n/locales.mjs — the locales the chrome can speak, and the sanitiser for a stored choice.
 *
 * Pure. The app stores the chosen locale under localStorage['fd-locale'] (app/use-locale.tsx);
 * `readLocale` turns whatever comes back — a stored value, a `navigator.language`, garbage — into
 * one of LOCALES, so nothing downstream ever sees an unknown tag. Only the chrome is translated:
 * the question bank stays English and every page that carries Hindi chrome says so.
 */

/** The locales in the order the settings control lists them. */
export const LOCALES = Object.freeze(['en', 'hi']);

export const DEFAULT_LOCALE = 'en';

/** BCP 47 tags for Intl, and the `lang` attribute each locale sets on <html>. */
export const INTL_TAGS = Object.freeze({ en: 'en-US', hi: 'hi-IN' });

/** What the settings control prints for each locale, in that locale's own script. */
export const LOCALE_NAMES = Object.freeze({ en: 'English', hi: 'हिन्दी' });

/**
 * A stored or detected value → a supported locale. Accepts an exact tag ('hi'), a regional tag
 * ('hi-IN', 'en_GB'), any case, surrounding whitespace; everything else is the default.
 */
export function readLocale(value) {
  if (typeof value !== 'string') return DEFAULT_LOCALE;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return LOCALES.includes(base) ? base : DEFAULT_LOCALE;
}

/** The locale a browser language list implies: the first entry that is supported, else the default. */
export function detectLocale(languages) {
  const list = Array.isArray(languages) ? languages : [languages];
  for (const lang of list) {
    if (typeof lang !== 'string') continue;
    const base = lang.trim().toLowerCase().split(/[-_]/)[0];
    if (LOCALES.includes(base)) return base;
  }
  return DEFAULT_LOCALE;
}
