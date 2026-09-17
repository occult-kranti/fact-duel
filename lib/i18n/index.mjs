/**
 * lib/i18n/index.mjs — one door for the hook and the tests.
 */
import { en } from './en.mjs';
import { hi } from './hi.mjs';

export { LOCALES, DEFAULT_LOCALE, INTL_TAGS, LOCALE_NAMES, readLocale, detectLocale } from './locales.mjs';
export { translate, interpolate, plural, pluralCategory, splitAt, bind } from './t.mjs';
export { formatNumber, formatDate, formatIsoDay, formatMonth, bindFormat } from './format.mjs';
export { whenKey, localizeWhen } from './when.mjs';

/** Dictionary per locale. */
export const DICTIONARIES = Object.freeze({ en, hi });

/**
 * Keys whose Hindi value is allowed to equal the English one: proper nouns, symbols and the
 * language control's own labels, which are written in their own script in both locales.
 */
export const SAME_IN_HINDI = Object.freeze([
  'settings.language',
  'settings.langEn',
  'settings.langHi',
  'lobby.vs',
  'boards.wld',
  'room.brand',
  'opp.lucky',
]);

/** Words that must never appear in Hindi copy as a stand-in for entry, prize or play. */
export const BANNED_HINDI = /सट्टा|सट्टे|जुआ|जुए|दांव|दाँव|बाज़ी|बाजी|कैसीनो|जैकपॉट/u;
