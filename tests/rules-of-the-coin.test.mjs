/**
 * The "Rules of the coin" page and its change log.
 *
 * What matters: the log validates (every change after the first gives one matchweek of notice);
 * upcoming/latest answer from a passed-in clock; every key of DEFAULT_CONFIG is described, with
 * the fee and prize lines agreeing with the reducer's own feeFor/prizeFor; and the page sources
 * carry none of the ruled-out vocabulary and no config number typed by hand — every number the
 * player reads comes from the config at render time.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_CONFIG, feeFor, prizeFor, readConfig, adRewardFor } from '../lib/economy/economy.mjs';
import {
  CHANGELOG,
  KEY_LABELS,
  NOTICE_DAYS,
  REGION_NAMES,
  changelogNewestFirst,
  dayMs,
  describeConfig,
  formatDay,
  latestChange,
  noticeDays,
  pct,
  upcomingChanges,
  validateChangelog,
} from '../lib/economy/changelog.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const DAY = 86_400_000;
const T0 = Date.parse('2026-09-16T12:00:00Z');

/* ------------------------------------------------------------------ the log */

test('the change log validates: dated, keyed, chronological, one matchweek of notice', () => {
  assert.deepEqual(validateChangelog(), []);
  assert.equal(NOTICE_DAYS, 7);
  const first = CHANGELOG[0];
  assert.equal(first.date, '2026-09-16');
  assert.equal(first.effective, '2026-09-16');
  assert.equal(noticeDays(first), 0, 'the initial entry is the one exception to the notice rule');
  assert.deepEqual([...first.keys].sort(), Object.keys(DEFAULT_CONFIG).sort());
  assert.ok(Object.isFrozen(CHANGELOG) && CHANGELOG.every(Object.isFrozen));
});

test('validateChangelog names every violation and lets a compliant change through', () => {
  const ok = { date: '2026-10-01', effective: '2026-10-08', title: 'Daily grant raised', body: 'x', keys: ['daily'] };
  assert.deepEqual(validateChangelog([...CHANGELOG, ok]), []);
  const short = { ...ok, effective: '2026-10-07' };
  const errs = validateChangelog([...CHANGELOG, short]);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /only 6 days notice/);
  assert.match(validateChangelog([...CHANGELOG, { ...ok, effective: '2026-09-30' }])[0], /before it was announced/);
  assert.match(validateChangelog([...CHANGELOG, { ...ok, keys: ['difficulty'] }])[0], /unknown config key "difficulty"/);
  assert.match(validateChangelog([...CHANGELOG, { ...ok, keys: [] }])[0], /keys missing/);
  assert.match(validateChangelog([...CHANGELOG, { ...ok, date: '1 Oct' }])[0], /date must be YYYY-MM-DD/);
  assert.match(validateChangelog([...CHANGELOG, { ...ok, title: ' ' }])[0], /title missing/);
  assert.ok(validateChangelog([ok, ...CHANGELOG]).some((e) => /out of order/.test(e)));
  assert.match(validateChangelog([...CHANGELOG, ok, { ...ok }])[0], /duplicate/);
  assert.deepEqual(validateChangelog([]), ['the change log is empty']);
  assert.match(validateChangelog([null])[0], /not an object/);
});

test('upcomingChanges and latestChange answer from the clock they are given', () => {
  const later = { date: '2026-10-01', effective: '2026-10-08', title: 'Later', body: 'x', keys: ['daily'] };
  const soon = { date: '2026-10-01', effective: '2026-10-09', title: 'Soon', body: 'x', keys: ['softCap'] };
  const log = [...CHANGELOG, soon, later];
  assert.deepEqual(upcomingChanges(T0, log).map((e) => e.title), ['Later', 'Soon'], 'soonest first');
  assert.equal(latestChange(T0, log).title, 'Coin rules published');
  assert.equal(latestChange(dayMs('2026-09-16') - 1, log), null, 'nothing is in force before the first entry');
  assert.equal(latestChange(dayMs('2026-10-08'), log).title, 'Later', 'in force from midnight UTC of its day');
  assert.deepEqual(upcomingChanges(dayMs('2026-10-08'), log).map((e) => e.title), ['Soon']);
  assert.equal(latestChange(dayMs('2026-10-09') + 5 * DAY, log).title, 'Soon');
  assert.deepEqual(upcomingChanges(T0), [], 'the real log has nothing pending at launch');
  assert.equal(latestChange(T0), CHANGELOG[0]);
  assert.deepEqual(changelogNewestFirst(log).map((e) => e.title), ['Soon', 'Later', 'Coin rules published']);
});

test('formatDay is locale-free and dayMs rejects anything that is not an ISO day', () => {
  assert.equal(formatDay('2026-09-16'), '16 September 2026');
  assert.equal(formatDay('2027-01-01'), '1 January 2027');
  assert.equal(formatDay('nope'), '');
  assert.ok(Number.isNaN(dayMs('16/09/2026')));
  assert.ok(Number.isNaN(dayMs(undefined)));
});

/* ------------------------------------------------------------------ the describer */

test('describeConfig covers every DEFAULT_CONFIG key, and nothing outside it', () => {
  const lines = describeConfig(DEFAULT_CONFIG);
  const keys = new Set(lines.map((l) => l.key));
  for (const k of Object.keys(DEFAULT_CONFIG)) assert.ok(keys.has(k), `no rule line for "${k}"`);
  for (const k of keys) assert.ok(k in DEFAULT_CONFIG, `line for a key that is not config: "${k}"`);
  for (const k of Object.keys(DEFAULT_CONFIG)) assert.equal(typeof KEY_LABELS[k], 'string', `no label for "${k}"`);
  for (const l of lines) {
    assert.ok(['earn', 'cost', 'limits'].includes(l.section), `bad section on ${l.key}`);
    assert.ok(l.label && l.text, `empty line for ${l.key}`);
    assert.ok(Object.isFrozen(l));
  }
  assert.ok(Object.isFrozen(lines));
});

test('the earn table names every region in the reward table, floored to the smallest entry', () => {
  const rows = describeConfig().filter((l) => l.key === 'adReward');
  assert.deepEqual(rows.map((r) => r.region), Object.keys(DEFAULT_CONFIG.adReward));
  for (const r of rows) {
    assert.equal(r.label, REGION_NAMES[r.region]);
    assert.equal(r.value, adRewardFor(r.region));
    assert.match(r.text, new RegExp(`^${r.value} coins per completed ad\\.$`));
  }
  assert.equal(REGION_NAMES['*'], 'Everywhere else');
});

test('fee and prize lines agree with feeFor and prizeFor for every tier', () => {
  const fees = describeConfig().filter((l) => l.key === 'feeBps');
  assert.deepEqual(fees.map((l) => l.amount), [...DEFAULT_CONFIG.stakes]);
  for (const l of fees) {
    assert.equal(l.fee, feeFor(l.amount));
    assert.equal(l.prize, prizeFor(l.amount));
    assert.ok(l.text.includes(`Play for ${l.amount.toLocaleString('en-US')} → prize ${l.prize.toLocaleString('en-US')}`), l.text);
    assert.ok(l.text.includes(`Pot ${(2 * l.amount).toLocaleString('en-US')}`), l.text);
    if (l.fee === 0) assert.match(l.text, /no fee/);
    else assert.ok(l.text.includes(`${pct(l.bps)} (${l.fee} coins)`), l.text);
  }
  assert.equal(pct(1_000), '10%');
  assert.equal(pct(1_500), '15%');
  assert.equal(pct(250), '2.5%');
  const unlocks = describeConfig().filter((l) => l.key === 'tierUnlock');
  assert.deepEqual(
    Object.fromEntries(unlocks.map((l) => [l.amount, l.unlock])),
    Object.fromEntries(Object.entries(DEFAULT_CONFIG.tierUnlock).map(([k, v]) => [Number(k), v])),
  );
});

test('every number in the copy comes from the config it was given', () => {
  const custom = readConfig({
    ...DEFAULT_CONFIG,
    adReward: { US: 77, '*': 33 },
    adDailyCap: 4,
    adCooldownMs: 90_000,
    daily: 11,
    practiceEntry: 7,
    stakes: [7, 70],
    tierUnlock: { 70: 700 },
    feeBps: { 7: 0, 70: 2_000 },
    floor: { coins: 9, everyMs: 3_600_000 },
    softCap: 999,
    questBudgetPerDay: 13,
    doubleAdAfterLosses: 1,
  });
  const text = describeConfig(custom).map((l) => `${l.label} ${l.text}`).join('\n');
  for (const want of [
    '77 coins per completed ad',
    '33 coins per completed ad',
    'Up to 4 ads',
    '90 seconds',
    '11 coins once per local day',
    'costs 7 coins',
    'Play for 7, 70 coins',
    'reaches 700 coins',
    'Pot 140, fee 20% (28 coins). Play for 70 → prize 112',
    'Below 9 coins your wallet is topped up to 9, at most once every 1 hour.',
    'Above 999 coins',
    'at most 13 coins per local day',
    'After 1 staked loss in a row',
  ])
    assert.ok(text.includes(want), `missing "${want}" in\n${text}`);
  // And none of the defaults leak through when they are not in the config.
  for (const stale of ['50 coins per completed ad', 'Up to 20 ads', '45 seconds', '5,000 coins']) assert.ok(!text.includes(stale), stale);
});

/* ------------------------------------------------------------------ the page sources */

const BANNED = /\b(bet|bets|betting|wager|wagers|wagering|odds|jackpot|jackpots|casino|casinos|slots|multiplier|multipliers|gamble|gambling)\b/i;
const CONFIG_NUMBERS = new Set();
(function collect(v) {
  if (typeof v === 'number') CONFIG_NUMBERS.add(v);
  else if (Array.isArray(v)) v.forEach(collect);
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      collect(x);
      if (/^\d+$/.test(k)) CONFIG_NUMBERS.add(Number(k));
    }
})(DEFAULT_CONFIG);
// A zero is "no fee" in the config and a plain default (`?? 0`, `length === 0`) in code; it is not a
// number a player reads, so it is the one config value the grep lets through.
CONFIG_NUMBERS.delete(0);
CONFIG_NUMBERS.add(DEFAULT_CONFIG.adCooldownMs / 1000);
CONFIG_NUMBERS.add(DEFAULT_CONFIG.floor.everyMs / 3_600_000);
const NUMBER_RE = new RegExp(`\\b(${[...CONFIG_NUMBERS].sort((a, b) => b - a).join('|')})\\b`);

const pageSources = () => {
  const dir = join(ROOT, 'app/screens/rules');
  return [
    ...readdirSync(dir)
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => ({ file: `app/screens/rules/${f}`, text: readFileSync(join(dir, f), 'utf8') })),
    { file: 'lib/economy/changelog.mjs', text: readFileSync(join(ROOT, 'lib/economy/changelog.mjs'), 'utf8') },
  ];
};

test('the rules pages and the change log carry none of the ruled-out vocabulary', () => {
  const sources = pageSources();
  assert.ok(sources.length >= 3, 'coin-rules.tsx, trust.tsx and changelog.mjs exist');
  for (const { file, text } of sources) {
    const hit = text.match(BANNED);
    assert.equal(hit, null, `${file} contains "${hit?.[0]}"`);
  }
});

test('the rules pages type no config number by hand: every one is read from the config', () => {
  assert.ok(CONFIG_NUMBERS.has(50) && CONFIG_NUMBERS.has(5_000) && CONFIG_NUMBERS.has(45) && CONFIG_NUMBERS.has(6));
  for (const { file, text } of pageSources().filter((s) => s.file.endsWith('.tsx'))) {
    const lines = text
      .split('\n')
      .filter((l) => !/^\s*import\b/.test(l))
      .filter((l) => !/^\s*(\/\*|\*|\/\/)/.test(l));
    for (const l of lines) {
      const hit = l.match(NUMBER_RE);
      assert.equal(hit, null, `${file} types ${hit?.[0]} by hand: ${l.trim()}`);
    }
  }
});

test('the change log module types no config number into its copy either', () => {
  const text = readFileSync(join(ROOT, 'lib/economy/changelog.mjs'), 'utf8');
  const copy = text
    .split('\n')
    .filter((l) => !/^\s*import\b/.test(l))
    .filter((l) => !/^\s*(\/\*|\*|\/\/)/.test(l))
    .map((l) => l.replace(/'\d{4}-\d{2}-\d{2}'/g, "''"))
    // the unit conversions are the one place a constant belongs
    .filter((l) => !/3_600_000|86_400_000|\/ 1000|\/ 10\)/.test(l));
  for (const l of copy) {
    const hit = l.match(NUMBER_RE);
    assert.equal(hit, null, `changelog.mjs types ${hit?.[0]} by hand: ${l.trim()}`);
  }
});
