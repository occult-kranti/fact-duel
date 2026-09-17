/**
 * The Hindi chrome: the two dictionaries hold the same keys, the Hindi copy is Hindi (not a copy
 * of the English, not empty, no exclamation marks, none of the gambling vocabulary), lookups
 * interpolate and pluralise, the locale sanitiser never returns an unknown tag, and numbers keep
 * Latin digits in both languages so a coin amount reads the same everywhere.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BANNED_HINDI,
  DEFAULT_LOCALE,
  DICTIONARIES,
  LOCALES,
  SAME_IN_HINDI,
  bind,
  bindFormat,
  detectLocale,
  formatDate,
  formatIsoDay,
  formatMonth,
  formatNumber,
  interpolate,
  localizeWhen,
  plural,
  pluralCategory,
  readLocale,
  splitAt,
  translate,
  whenKey,
} from '../lib/i18n/index.mjs';
import { BANNED } from '../lib/seo/intents.mjs';

const { en, hi } = DICTIONARIES;
const DEVANAGARI = /[ऀ-ॿ]/;

/* ------------------------------------------------------------------ the dictionaries */

test('both dictionaries are frozen, flat, string-valued and hold exactly the same keys', () => {
  assert.ok(Object.isFrozen(en) && Object.isFrozen(hi));
  const enKeys = Object.keys(en).sort();
  const hiKeys = Object.keys(hi).sort();
  assert.ok(enKeys.length > 400, `the chrome has ${enKeys.length} keys`);
  assert.deepEqual(hiKeys, enKeys, 'key parity');
  for (const k of enKeys) {
    assert.equal(typeof en[k], 'string', `${k} en is a string`);
    assert.equal(typeof hi[k], 'string', `${k} hi is a string`);
    assert.match(k, /^[a-z]+(\.[A-Za-z0-9 ]+)+$/, `${k} is a dotted key`);
  }
});

test('every plural key has both one and other forms in both dictionaries', () => {
  for (const dict of [en, hi]) {
    for (const k of Object.keys(dict)) {
      if (k.endsWith('.one')) assert.ok(`${k.slice(0, -4)}.other` in dict, `${k} has .other`);
    }
  }
});

test('no Hindi value is empty or identical to the English one, except the listed proper nouns', () => {
  for (const k of Object.keys(en)) {
    assert.ok(hi[k].trim().length > 0, `${k} hi is not empty`);
    if (SAME_IN_HINDI.includes(k)) continue;
    assert.notEqual(hi[k], en[k], `${k} hi differs from en`);
    assert.match(hi[k], DEVANAGARI, `${k} hi carries Devanagari`);
  }
  for (const k of SAME_IN_HINDI) assert.ok(k in en, `${k} in the allowlist exists`);
});

test('the Hindi copy carries no exclamation mark, no banned Hindi word and none of the English ban list', () => {
  for (const [k, v] of Object.entries(hi)) {
    assert.doesNotMatch(v, /!/, `${k}: no exclamation mark`);
    assert.doesNotMatch(v, BANNED_HINDI, `${k}: banned Hindi word`);
    assert.doesNotMatch(v, BANNED, `${k}: banned English word`);
  }
  for (const [k, v] of Object.entries(en)) {
    assert.doesNotMatch(v, /!/, `${k}: no exclamation mark`);
    assert.doesNotMatch(v, BANNED, `${k}: banned English word`);
  }
});

test('the hi.mjs source itself contains no exclamation mark', () => {
  const src = readFileSync(new URL('../lib/i18n/hi.mjs', import.meta.url), 'utf8');
  assert.equal(src.includes('!'), false);
});

test('placeholders agree between the two languages, so no Hindi line loses a number', () => {
  const slots = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const k of Object.keys(en)) assert.deepEqual(slots(hi[k]), slots(en[k]), `${k} placeholders`);
});

test('the brand stays Latin in the wordmark keys and Devanagari in running Hindi copy', () => {
  assert.equal(hi['room.brand'], 'Jaanta Hai Kya · {topic}');
  assert.match(hi['rules.title'], /जानता है क्या/);
  assert.match(hi['trust.title'], /जानता है क्या/);
  assert.doesNotMatch(hi['rules.title'], /Jaanta/);
});

/* ------------------------------------------------------------------ the lookups */

test('translate interpolates {name} slots, leaves unknown slots alone and returns the key when missing', () => {
  const dict = { greet: 'Hi {name}, {n} coins', plain: 'x' };
  assert.equal(translate(dict, 'greet', { name: 'Asha', n: 40 }), 'Hi Asha, 40 coins');
  assert.equal(translate(dict, 'greet', { name: 'Asha' }), 'Hi Asha, {n} coins');
  assert.equal(translate(dict, 'greet'), 'Hi {name}, {n} coins');
  assert.equal(translate(dict, 'plain', { name: 'x' }), 'x');
  assert.equal(translate(dict, 'missing'), 'missing');
  assert.equal(translate(null, 'missing'), 'missing');
  assert.equal(interpolate('{a}{a}', { a: 1 }), '11');
  assert.equal(interpolate(42, { a: 1 }), 42);
});

test('plural picks one/other by the locale rules: Hindi counts zero as one, English does not', () => {
  assert.equal(pluralCategory('en', 1), 'one');
  assert.equal(pluralCategory('en', 0), 'other');
  assert.equal(pluralCategory('en', 2), 'other');
  assert.equal(pluralCategory('hi', 0), 'one');
  assert.equal(pluralCategory('hi', 1), 'one');
  assert.equal(pluralCategory('hi', 2), 'other');
  assert.equal(plural(en, 'en', 'launch.rounds', 1), '1 round');
  assert.equal(plural(en, 'en', 'launch.rounds', 3), '3 rounds');
  assert.equal(plural(hi, 'hi', 'boards.duels', 1), '1 मुकाबला');
  assert.equal(plural(hi, 'hi', 'boards.duels', 5), '5 मुकाबले');
  assert.equal(plural(en, 'en', 'hero.landed', 1, { landed: 1 }), '1 of your last 1 expedition call landed above Steady');
  assert.equal(plural({ 'x.other': '{count}' }, 'en', 'x', 1), '1', 'falls back to other');
  assert.equal(plural({}, 'en', 'x', 1), 'x.one', 'missing shows the key');
  assert.equal(plural(en, 'en', 'launch.rounds', NaN), '0 rounds');
});

test('bind returns t and n over one dictionary; splitAt cuts a template around a slot', () => {
  const { t, n } = bind(hi, 'hi');
  assert.equal(t('nav.home'), 'होम');
  assert.equal(n('strip.modesOpen', 2), '2 मोड खुले');
  assert.deepEqual(splitAt('{n} points to {label}.', 'n'), ['', ' points to {label}.']);
  assert.deepEqual(splitAt('no slot', 'n'), ['no slot', null]);
});

test('every English key still reads as the screens printed it: a few spot checks pin the contract', () => {
  assert.equal(en['nav.journeys'], 'Expeditions');
  assert.equal(en['home.playNow'], 'Play now');
  assert.equal(en['launch.createFriend'], 'Create friend duel');
  assert.equal(en['ad.notNow'], 'Not now');
  assert.equal(en['rules.title'], 'How a Jaanta Hai Kya duel works.');
  assert.equal(en['finish.simNoValue'], 'Free simulated coins. No monetary value.');
});

/* ------------------------------------------------------------------ the locale */

test('readLocale accepts supported tags in any shape and falls back to English for everything else', () => {
  assert.deepEqual([...LOCALES], ['en', 'hi']);
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(readLocale('hi'), 'hi');
  assert.equal(readLocale('hi-IN'), 'hi');
  assert.equal(readLocale(' HI_in '), 'hi');
  assert.equal(readLocale('en-GB'), 'en');
  assert.equal(readLocale('fr'), 'en');
  assert.equal(readLocale(''), 'en');
  assert.equal(readLocale(null), 'en');
  assert.equal(readLocale(42), 'en');
  assert.equal(readLocale({ toString: () => 'hi' }), 'en');
  for (const v of ['en', 'hi']) assert.equal(readLocale(JSON.parse(JSON.stringify(v))), v, 'round trip');
});

test('detectLocale reads the first supported entry of a browser language list', () => {
  assert.equal(detectLocale(['hi-IN', 'en-US']), 'hi');
  assert.equal(detectLocale(['fr-FR', 'hi']), 'hi');
  assert.equal(detectLocale(['fr-FR', 'de']), 'en');
  assert.equal(detectLocale('hi'), 'hi');
  assert.equal(detectLocale([]), 'en');
  assert.equal(detectLocale(undefined), 'en');
  assert.equal(detectLocale([null, 'HI']), 'hi');
});

/* ------------------------------------------------------------------ the formats */

test('numbers keep Latin digits in Hindi, with the locale grouping; dates follow the locale', () => {
  assert.equal(formatNumber('en', 1000), '1,000');
  assert.equal(formatNumber('hi', 1000), '1,000');
  assert.equal(formatNumber('hi', 100000), '1,00,000');
  assert.equal(formatNumber('en', 100000), '100,000');
  assert.doesNotMatch(formatNumber('hi', 1234567), /[०-९]/, 'no Devanagari digits');
  assert.equal(formatNumber('hi', NaN), '0');
  assert.equal(formatNumber('xx', 12), '12', 'unknown locale falls back to the default');
  const iso = formatIsoDay('hi', '2026-09-16');
  assert.match(iso, /^16 /);
  assert.match(iso, /सितंबर|सितम्बर/);
  assert.match(iso, /2026$/);
  assert.equal(formatIsoDay('en', '2026-09-16'), 'September 16, 2026');
  assert.equal(formatIsoDay('en', 'nope'), '');
  assert.equal(formatIsoDay('en', '2026-09-16', { day: 'numeric', month: 'short' }), 'Sep 16');
  assert.match(formatMonth('hi', '2026-09'), /सितंबर|सितम्बर/);
  assert.match(formatMonth('en', '2026-09'), /^September 2026$/);
  assert.equal(formatMonth('en', '2026'), '');
  assert.equal(formatDate('en', Date.UTC(2026, 8, 16, 12), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }), 'Sep 16, 2026');
  assert.equal(formatDate('en', 'garbage'), '');
  const f = bindFormat('hi');
  assert.equal(f.number(2500), '2,500');
  assert.equal(f.isoDay('2026-01-01', { month: 'short', day: 'numeric' }).length > 0, true);
});

/* ------------------------------------------------------------------ the calendar lines */

test('whenKey turns the English day lines back into keys and counts, and localizeWhen renders them', () => {
  assert.deepEqual(whenKey('Starts in 3 days'), { key: 'when.startsIn', count: 3 });
  assert.deepEqual(whenKey('Starts tomorrow'), { key: 'when.startsTomorrow', count: null });
  assert.deepEqual(whenKey('Ended 2 days ago'), { key: 'when.endedAgo', count: 2 });
  assert.deepEqual(whenKey('In 3 weeks'), { key: 'when.inWeeks', count: 3 });
  assert.deepEqual(whenKey('Just finished'), { key: 'when.justFinished', count: null });
  assert.equal(whenKey('Kick-off at 3pm'), null);
  assert.equal(whenKey(''), null);
  assert.equal(whenKey(null), null);
  const { t, n } = bind(hi, 'hi');
  assert.equal(localizeWhen('Starts in 3 days', t, n), '3 दिन में शुरू');
  assert.equal(localizeWhen('On now', t, n), 'अभी चालू');
  assert.equal(localizeWhen('unknown text', t, n), 'unknown text');
  const e = bind(en, 'en');
  for (const line of ['Starts in 3 days', 'Starts tomorrow', 'Ends in 2 days', 'In 5 days', '4 weeks ago', 'Yesterday', 'Ended 1 day ago'])
    assert.equal(localizeWhen(line, e.t, e.n), line, `${line} round-trips in English`);
});
