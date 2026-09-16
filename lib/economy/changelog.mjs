/**
 * The "Rules of the coin" page, as data: a change log for the economy config and a describer that
 * turns a config into plain-English rule lines.
 *
 * Why this exists (docs/money/ads/synthesis.json feature 17, lane-gamification.json "Rules of the
 * coin"): the one complaint every long-lived quiz competitor collects is a rule that changed
 * without notice — "they continue to add changes almost weekly". So the rules page never carries a
 * number of its own. Every line here is computed from the config the reducer runs on, at render
 * time, so the page cannot drift from the code; and every change to that config has to be logged
 * here, dated, with an effective date at least one matchweek (`NOTICE_DAYS`) after it was
 * announced. `validateChangelog` is the test that enforces the notice period.
 *
 * Pure: no clock, no I/O. `at` is epoch milliseconds, passed in.
 */
import { DEFAULT_CONFIG, adRewardFor, feeFor, prizeFor } from './economy.mjs';

/** One matchweek. Every economy change is announced at least this many days before it applies. */
export const NOTICE_DAYS = 7;

const DAY = 86_400_000;

/** Region code → the name the rules page prints. The wildcard row is everyone not listed. */
export const REGION_NAMES = Object.freeze({
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IN: 'India',
  BR: 'Brazil',
  '*': 'Everywhere else',
});

/** Config key → the label a change-log entry prints for it. Every DEFAULT_CONFIG key has one. */
export const KEY_LABELS = Object.freeze({
  adReward: 'Coins per ad',
  adDailyCap: 'Daily ad limit',
  adCooldownMs: 'Gap between ads',
  daily: 'Daily grant',
  practiceEntry: 'Practice entry',
  stakes: 'Entry tiers',
  tierUnlock: 'Tier unlocks',
  feeBps: 'Arena fee',
  floor: 'The floor',
  softCap: 'Soft cap',
  questBudgetPerDay: 'Quest budget',
  doubleAdAfterLosses: 'Double-coin ad',
});

/**
 * The log. Newest LAST in source (chronological), so a new entry is appended; the page sorts.
 * `date` is the day the change was announced, `effective` the day it applies, both local calendar
 * days as 'YYYY-MM-DD'. `keys` names the config keys the change touched.
 */
export const CHANGELOG = Object.freeze([
  Object.freeze({
    date: '2026-09-16',
    effective: '2026-09-16',
    title: 'Coin rules published',
    body: 'The first version. Earn rates, stakes, fee, floor, caps as listed.',
    keys: Object.freeze(Object.keys(DEFAULT_CONFIG)),
  }),
]);

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Epoch ms at UTC midnight of an ISO day, or NaN. */
export const dayMs = (iso) => (typeof iso === 'string' && ISO_DAY.test(iso) ? Date.parse(`${iso}T00:00:00Z`) : NaN);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** '2026-09-16' → '16 September 2026'. Locale-free so a test and a screen agree. */
export function formatDay(iso) {
  const ms = dayMs(iso);
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Whole days between two ISO days (effective − announced). */
export const noticeDays = (entry) => Math.floor((dayMs(entry.effective) - dayMs(entry.date)) / DAY);

/**
 * Every problem with a log, as strings; an empty list means it validates. The rule that matters:
 * a change takes effect no sooner than `NOTICE_DAYS` after it was announced, except the initial
 * entry (the first one, which published the rules rather than changing them).
 */
export function validateChangelog(log = CHANGELOG, config = DEFAULT_CONFIG) {
  const errors = [];
  if (!Array.isArray(log) || log.length === 0) return ['the change log is empty'];
  const known = new Set(Object.keys(config));
  const seen = new Set();
  log.forEach((entry, i) => {
    const where = `entry ${i} (${entry?.title ?? 'untitled'})`;
    if (!entry || typeof entry !== 'object') return errors.push(`${where}: not an object`);
    if (Number.isNaN(dayMs(entry.date))) errors.push(`${where}: date must be YYYY-MM-DD`);
    if (Number.isNaN(dayMs(entry.effective))) errors.push(`${where}: effective must be YYYY-MM-DD`);
    if (typeof entry.title !== 'string' || !entry.title.trim()) errors.push(`${where}: title missing`);
    if (typeof entry.body !== 'string' || !entry.body.trim()) errors.push(`${where}: body missing`);
    if (!Array.isArray(entry.keys) || entry.keys.length === 0) errors.push(`${where}: keys missing`);
    else for (const k of entry.keys) if (!known.has(k)) errors.push(`${where}: unknown config key "${k}"`);
    const notice = noticeDays(entry);
    if (!Number.isNaN(notice)) {
      if (notice < 0) errors.push(`${where}: effective before it was announced`);
      else if (i > 0 && notice < NOTICE_DAYS)
        errors.push(`${where}: only ${notice} days notice, the rule is ${NOTICE_DAYS} (one matchweek)`);
    }
    if (i > 0 && dayMs(entry.date) < dayMs(log[i - 1].date)) errors.push(`${where}: out of order, log is chronological`);
    const id = `${entry.date}|${entry.title}`;
    if (seen.has(id)) errors.push(`${where}: duplicate of an earlier entry`);
    seen.add(id);
  });
  return errors;
}

/** Changes announced but not yet in force at `at`, soonest first. */
export function upcomingChanges(at, log = CHANGELOG) {
  return Object.freeze(
    log.filter((e) => dayMs(e.effective) > at).sort((a, b) => dayMs(a.effective) - dayMs(b.effective)),
  );
}

/** The change most recently in force at `at`, or null before the first one. */
export function latestChange(at, log = CHANGELOG) {
  let best = null;
  for (const e of log) {
    const ms = dayMs(e.effective);
    if (ms <= at && (!best || ms >= dayMs(best.effective))) best = e;
  }
  return best;
}

/** Every entry, newest announcement first, for the page's change log. */
export const changelogNewestFirst = (log = CHANGELOG) =>
  Object.freeze([...log].sort((a, b) => dayMs(b.date) - dayMs(a.date)));

const n = (v) => Number(v).toLocaleString('en-US');
const coins = (v) => `${n(v)} ${Number(v) === 1 ? 'coin' : 'coins'}`;
const plural = (v, one, many = `${one}s`) => `${n(v)} ${Number(v) === 1 ? one : many}`;
/** @returns {RuleLine} */
const line = (key, section, label, text, extra = {}) => Object.freeze({ key, section, label, text, ...extra });

/** Basis points → '10%' (or '2.5%'). */
export const pct = (bps) => `${Math.round(bps / 10) / 10}%`;

/**
 * One rule line. `region`/`value` are set on the per-region ad rows, `amount`/`fee`/`prize`/`bps`
 * on the per-tier fee rows and `amount`/`unlock` on the tier-unlock rows.
 * @typedef {Readonly<{
 *   key: keyof typeof DEFAULT_CONFIG,
 *   section: 'earn' | 'cost' | 'limits',
 *   label: string,
 *   text: string,
 *   region?: string,
 *   value?: number,
 *   amount?: number,
 *   fee?: number,
 *   prize?: number,
 *   bps?: number,
 *   unlock?: number,
 * }>} RuleLine
 */

/**
 * The rules, in words, from a config. Each line carries the config `key` it was derived from
 * (so a test can prove every key is described), a `section` for the page ('earn', 'cost',
 * 'limits'), a short `label` and the sentence itself. No number in any line comes from anywhere
 * but `config`.
 * @returns {readonly RuleLine[]}
 */
export function describeConfig(config = DEFAULT_CONFIG) {
  /** @type {RuleLine[]} */
  const out = [];
  const regions = Object.keys(config.adReward ?? {});
  for (const code of regions) {
    const name = REGION_NAMES[code] ?? code;
    out.push(
      line('adReward', 'earn', name, `${coins(adRewardFor(code, config))} per completed ad.`, {
        region: code,
        value: adRewardFor(code, config),
      }),
    );
  }
  out.push(line('daily', 'earn', KEY_LABELS.daily, `${coins(config.daily)} once per local day, for showing up.`));
  out.push(
    line(
      'floor',
      'earn',
      KEY_LABELS.floor,
      `Below ${coins(config.floor.coins)} your wallet is topped up to ${n(config.floor.coins)}, at most once every ${plural(config.floor.everyMs / 3_600_000, 'hour')}.`,
    ),
  );
  out.push(
    line(
      'questBudgetPerDay',
      'earn',
      KEY_LABELS.questBudgetPerDay,
      `Quests and streaks pay at most ${coins(config.questBudgetPerDay)} per local day.`,
    ),
  );
  out.push(
    line(
      'doubleAdAfterLosses',
      'earn',
      KEY_LABELS.doubleAdAfterLosses,
      `After ${plural(config.doubleAdAfterLosses, 'staked loss', 'staked losses')} in a row, one ad pays double, once per local day. The questions, the bot and the opponent do not change.`,
    ),
  );

  out.push(
    line(
      'practiceEntry',
      'cost',
      KEY_LABELS.practiceEntry,
      `A practice drill costs ${coins(config.practiceEntry)}. Practice coins are spent, not staked.`,
    ),
  );
  out.push(line('stakes', 'cost', KEY_LABELS.stakes, `Play for ${config.stakes.map(n).join(', ')} coins.`));
  for (const amount of config.stakes) {
    const fee = feeFor(amount, config),
      prize = prizeFor(amount, config),
      bps = config.feeBps?.[amount] ?? 0;
    out.push(
      line(
        'feeBps',
        'cost',
        `Play for ${n(amount)}`,
        fee === 0
          ? `Pot ${n(2 * amount)}, no fee. Play for ${n(amount)} → prize ${n(prize)}.`
          : `Pot ${n(2 * amount)}, fee ${pct(bps)} (${coins(fee)}). Play for ${n(amount)} → prize ${n(prize)}.`,
        { amount, fee, prize, bps },
      ),
    );
  }
  for (const [amount, unlock] of Object.entries(config.tierUnlock ?? {})) {
    out.push(
      line(
        'tierUnlock',
        'cost',
        `The ${n(amount)}-coin tier`,
        `Opens once your balance reaches ${coins(unlock)}.`,
        { amount: Number(amount), unlock },
      ),
    );
  }

  out.push(
    line(
      'adDailyCap',
      'limits',
      KEY_LABELS.adDailyCap,
      `Up to ${plural(config.adDailyCap, 'ad')} pay per local day. The counter starts again tomorrow.`,
    ),
  );
  out.push(
    line(
      'adCooldownMs',
      'limits',
      KEY_LABELS.adCooldownMs,
      `At least ${plural(config.adCooldownMs / 1000, 'second')} between two paid ads.`,
    ),
  );
  out.push(
    line(
      'softCap',
      'limits',
      KEY_LABELS.softCap,
      `Above ${coins(config.softCap)} the daily grant and the floor pause. Ads still pay.`,
    ),
  );
  return Object.freeze(out);
}
