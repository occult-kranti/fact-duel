/**
 * The coin economy, as a pure reducer over a wallet and a config.
 *
 * Coins are earned by attention (a rewarded ad), by showing up (a daily grant), by winning a staked
 * duel (from the other player, never from the house), and by a small floor that stops anyone being
 * locked out. They are spent on duel stakes and on practice entries. They never convert to money,
 * to a prize, or to anything outside the game — which is the whole reason the product is lawful
 * where the staked-money version was not (see docs/money/legal-merge.json).
 *
 * Every transition here is integer arithmetic on a plain object and returns the SAME wallet object
 * when nothing changed, in the identity-preserving style of lib/progression.mjs, so a caller can
 * `if (next.wallet !== wallet)` to know whether to persist. Nothing reads the clock, nothing is
 * random, nothing does I/O: the same inputs give the same wallet everywhere, which is what lets the
 * exact same reducer run on a device today and on a server behind an account tomorrow.
 *
 * TWO THINGS THIS FILE CANNOT DO, BY CONSTRUCTION. It has no notion of question difficulty, bot
 * skill or match outcome, so it cannot be used to rig a game against a player's balance — a
 * loss-streak "mercy" that quietly softens the questions would be both a lie to the player and the
 * exact conduct the FTC's dark-pattern orders describe. And it has no notion of money: the config
 * carries an ad reward in COINS per region, and the reason those differ by region is that a
 * rewarded ad pays a different eCPM in each, so one ad watched is worth roughly the same revenue
 * everywhere even though it pays a different number of coins. That mapping is a product decision
 * recorded in the config; the engine only applies it.
 *
 * Amounts: whole coins. Times: epoch milliseconds, always passed in. Regions: ISO-3166 alpha-2
 * country codes, upper case, with '*' as the fallback.
 */

const HOUR = 3_600_000;

/**
 * The tunables. Defaults are deliberately conservative placeholders pending the economy research
 * (docs/money/... when it lands); every one is meant to be overridden by a bundle the server hands
 * the client, never edited in source per market.
 */
export const DEFAULT_CONFIG = Object.freeze({
  /**
   * Coins per completed rewarded ad, by region, derived by the economy research from the only
   * verifiable per-country rewarded eCPMs (Tenjin/CAS.AI 2024, US anchored at 50 coins ≈ 0.055¢
   * per coin): US 50, GB 35, DE 25, FR 20. India and Brazil are FLOORED at the smallest stake tier
   * — "one ad always buys one duel, in every geo" — because their eCPMs are either unverified (IN)
   * or too low for a revenue-flat table to leave the game playable. The wildcard is the floor too.
   * A weekly server job is meant to re-derive these from realised eCPM (EMA, alpha 0.3); until it
   * exists, these are the researched values, not measurements.
   */
  adReward: Object.freeze({ US: 50, GB: 35, DE: 25, FR: 20, IN: 10, BR: 10, '*': 10 }),
  /** Rewarded ads a wallet may be paid for in one local day, and the minimum gap between two. */
  adDailyCap: 20,
  adCooldownMs: 45_000,
  /** Daily grant for showing up, once per local day. */
  daily: 30,
  /** Entry to a practice drill. A sink: the coins leave the player and are burned. */
  practiceEntry: 10,
  /**
   * Duel entry tiers, in ad-equivalents of the US reward: 0.2, 0.5, 1, 2, 5 and 10. Entries go to
   * the house and the prize comes from the house (see docs/money/ads/decision.md §2) — no coin ever
   * moves between players. The two largest tiers are gated on balance (`tierUnlock`), which is the
   * research's answer to hoarding: do not punish a full wallet, give it something worth spending on.
   */
  stakes: Object.freeze([10, 25, 50, 100, 250, 500]),
  tierUnlock: Object.freeze({ 250: 1_000, 500: 5_000 }),
  /**
   * The disclosed arena fee, in basis points of the pot, by entry tier: none on the two micro tiers
   * (so "one ad, one duel" stays exactly that), 10% from 50 up, 15% on the hoarder tier. It exists
   * because the economy is otherwise faucet-only — grants are not zero-sum even though duels are —
   * and a steady-state balance needs a sink that scales with play. It is DISCLOSED on the entry card
   * ("Pot 100 · prize 90") because a hidden rake is the exact mechanic reviewers call rigged.
   */
  feeBps: Object.freeze({ 10: 0, 25: 0, 50: 1_000, 100: 1_000, 250: 1_000, 500: 1_500 }),
  /** Below `coins`, a wallet is topped up TO `coins` — at most once per `everyMs`. Prevents lockout
      without being a faucet. 20 covers two micro entries: in a fair duel a 1-entry bankroll has a
      50% chance of no longer affording that tier within two duels at the fee-free micro tiers (75%
      at a fee tier, where a win nets less than a loss costs), a 2-entry bankroll 25% — the audited
      figures, pinned by `ruinWithin` in tests/stake-advice.test.mjs. */
  floor: Object.freeze({ coins: 20, everyMs: 6 * HOUR }),
  /** Above this, the daily grant and the floor stop (ads still pay: attention is always honoured). */
  softCap: 5_000,
  /** Grants from quests and streaks are capped per local day, and every one is meant to be paired
      with a sink. Without a budget the non-zero-sum faucets outrun the fee and the supply inflates. */
  questBudgetPerDay: 30,
  /**
   * Loss-streak protection that touches nothing about the contest: after this many consecutive
   * staked losses, one double-coin ad per local day. Three straight losses is not a signal of
   * anything — at p = 0.5 it happens to half of all players inside ten duels — so the lever is a
   * consolation on the FAUCET side, never a change to the questions, the bot or the opponent.
   */
  doubleAdAfterLosses: 3,
});

/** The keys a config may carry. Anything else is dropped — see `readConfig` for why that matters. */
const CONFIG_KEYS = Object.freeze(Object.keys(DEFAULT_CONFIG));

/**
 * Sanitise a config bundle a server hands the client. Unknown keys are DROPPED, not merged, and that
 * is the honesty rule made structural: there is no key in which a difficulty, a bot accuracy or a
 * balance-conditioned selection could travel, so the economy cannot be steered against a player
 * through configuration any more than through code. Tested by attempting exactly that.
 */
export function readConfig(value) {
  const c = value && typeof value === 'object' ? value : {};
  const out = { ...DEFAULT_CONFIG };
  for (const k of CONFIG_KEYS) if (k in c) out[k] = c[k];
  return Object.freeze(out);
}

/** A fresh wallet. `dayKey` is the local day the daily counters belong to; see `sameDay`. */
export const emptyWallet = () =>
  Object.freeze({
    coins: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    adsToday: 0,
    dayKey: '',
    lastAdAt: 0,
    lastDailyKey: '',
    lastFloorAt: 0,
    questToday: 0,
    lossStreak: 0,
    lastDoubleKey: '',
    recapKey: '',
    adIds: Object.freeze([]),
  });

/**
 * Local calendar day, from a timestamp and the viewer's UTC offset in minutes (what
 * `Date.prototype.getTimezoneOffset` returns, sign included). Passed in rather than read, so the
 * reducer stays pure and a server can compute a player's day from a stored offset.
 */
export function dayKeyOf(at, tzOffsetMinutes = 0) {
  const local = new Date(at - tzOffsetMinutes * 60_000);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`;
}

const int = (n) => Number.isSafeInteger(n) && n >= 0;

/**
 * Sanitise a stored wallet: every counter a non-negative safe integer, the recent ad ids a bounded
 * list of strings, unknown keys dropped. Returns the input itself when it was already clean, so a
 * clean wallet round-trips by identity — the same contract readProfile keeps.
 */
export function readWallet(value) {
  const w = value && typeof value === 'object' ? value : {};
  const clean = {
    coins: int(w.coins) ? w.coins : 0,
    lifetimeEarned: int(w.lifetimeEarned) ? w.lifetimeEarned : 0,
    lifetimeSpent: int(w.lifetimeSpent) ? w.lifetimeSpent : 0,
    adsToday: int(w.adsToday) ? w.adsToday : 0,
    dayKey: typeof w.dayKey === 'string' ? w.dayKey.slice(0, 10) : '',
    lastAdAt: int(w.lastAdAt) ? w.lastAdAt : 0,
    lastDailyKey: typeof w.lastDailyKey === 'string' ? w.lastDailyKey.slice(0, 10) : '',
    lastFloorAt: int(w.lastFloorAt) ? w.lastFloorAt : 0,
    questToday: int(w.questToday) ? w.questToday : 0,
    lossStreak: int(w.lossStreak) ? w.lossStreak : 0,
    lastDoubleKey: typeof w.lastDoubleKey === 'string' ? w.lastDoubleKey.slice(0, 10) : '',
    recapKey: typeof w.recapKey === 'string' ? w.recapKey.slice(0, 10) : '',
    adIds: Array.isArray(w.adIds)
      ? Object.freeze(w.adIds.filter((s) => typeof s === 'string' && s.length <= 128).slice(-64))
      : Object.freeze([]),
  };
  const same =
    Object.keys(clean).every((k) => (k === 'adIds' ? sameList(clean.adIds, w.adIds) : clean[k] === w[k])) &&
    Object.keys(w).length === Object.keys(clean).length;
  return same ? value : Object.freeze(clean);
}

const sameList = (a, b) => Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Coins one completed ad pays in a region. Unknown or malformed region falls to the '*' row, and
 * nothing pays less than the smallest entry tier: one ad always buys one duel, everywhere.
 */
export function adRewardFor(region, config = DEFAULT_CONFIG) {
  const key = String(region ?? '').toUpperCase();
  const table = config.adReward ?? DEFAULT_CONFIG.adReward;
  const raw = int(table[key]) ? table[key] : (table['*'] ?? 0);
  return Math.max(raw, config.stakes?.[0] ?? 0);
}

/** The house's disclosed cut of a pot at an entry tier, in coins. Zero on the micro tiers. */
export function feeFor(amount, config = DEFAULT_CONFIG) {
  const bps = config.feeBps?.[amount] ?? 0;
  return Math.floor((2 * amount * bps) / 10_000);
}

/** What the winner receives: the pot less the disclosed fee. A draw returns each entry whole. */
export const prizeFor = (amount, config = DEFAULT_CONFIG) => 2 * amount - feeFor(amount, config);

/** Roll the per-day counters when the local day has changed. Identity when it has not. */
function rollDay(wallet, dayKey) {
  if (wallet.dayKey === dayKey) return wallet;
  return { ...wallet, dayKey, adsToday: 0, questToday: 0 };
}

const done = (wallet, extra) => Object.freeze({ wallet: Object.freeze(wallet), ...extra });
const refuse = (wallet, reason) => Object.freeze({ wallet, ok: false, granted: 0, spent: 0, reason });

/**
 * A rewarded ad completed. `adId` is the provider's completion id and is the idempotency key: the
 * same ad can never be paid twice, however many times the completion callback fires.
 */
export function earnFromAd(wallet, { adId, region, at, tzOffsetMinutes = 0, double = false }, config = DEFAULT_CONFIG) {
  if (typeof adId !== 'string' || !adId || adId.length > 128) return refuse(wallet, 'bad_ad_id');
  if (!Number.isSafeInteger(at) || at <= 0) return refuse(wallet, 'bad_time');
  if (wallet.adIds.includes(adId)) return refuse(wallet, 'already_paid');

  const rolled = rollDay(wallet, dayKeyOf(at, tzOffsetMinutes));
  // A completion stamped before the last one we paid is a replay or a clock lie. Checked before
  // the cooldown on purpose: a negative gap would otherwise read as "too soon", and a lying clock
  // deserves its own name in the log.
  if (at < rolled.lastAdAt) return refuse(wallet, 'out_of_order');
  if (rolled.adsToday >= config.adDailyCap) return refuse(wallet, 'daily_cap');
  if (rolled.lastAdAt && at - rolled.lastAdAt < config.adCooldownMs) return refuse(wallet, 'cooldown');

  const base = adRewardFor(region, config);
  if (base <= 0) return refuse(wallet, 'no_reward_for_region');
  // The double-coin ad is a consolation offered once per local day after a run of staked losses.
  // Asking for it without being owed it is not an error, it is just an ordinary ad.
  const key = dayKeyOf(at, tzOffsetMinutes);
  const owed = double && doubleAdAvailable(rolled, { at, tzOffsetMinutes }, config);
  const granted = owed ? base * 2 : base;
  return done(
    {
      ...rolled,
      coins: rolled.coins + granted,
      lifetimeEarned: rolled.lifetimeEarned + granted,
      adsToday: rolled.adsToday + 1,
      lastAdAt: at,
      lastDoubleKey: owed ? key : rolled.lastDoubleKey,
      lossStreak: owed ? 0 : rolled.lossStreak,
      adIds: Object.freeze([...rolled.adIds, adId].slice(-64)),
    },
    { ok: true, granted, spent: 0, reason: owed ? 'ad_double' : 'ad' },
  );
}

/** Whether the once-a-day double-coin ad is owed right now. */
export function doubleAdAvailable(wallet, { at, tzOffsetMinutes = 0 }, config = DEFAULT_CONFIG) {
  if (wallet.lossStreak < config.doubleAdAfterLosses) return false;
  return wallet.lastDoubleKey !== dayKeyOf(at, tzOffsetMinutes);
}

/**
 * A quest or streak grant, held to the daily budget. Over budget it grants the remainder, or
 * nothing, rather than failing the quest — the player did the thing; the economy just stops paying
 * for it past the line.
 */
export function grantQuest(wallet, { amount, at, tzOffsetMinutes = 0 }, config = DEFAULT_CONFIG) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return refuse(wallet, 'bad_amount');
  if (!Number.isSafeInteger(at) || at <= 0) return refuse(wallet, 'bad_time');
  const rolled = rollDay(wallet, dayKeyOf(at, tzOffsetMinutes));
  const room = Math.max(0, config.questBudgetPerDay - rolled.questToday);
  const granted = Math.min(amount, room);
  if (granted === 0) return refuse(rolled === wallet ? wallet : Object.freeze(rolled), 'quest_budget');
  return done(
    { ...rolled, coins: rolled.coins + granted, lifetimeEarned: rolled.lifetimeEarned + granted, questToday: rolled.questToday + granted },
    { ok: true, granted, spent: 0, reason: 'quest' },
  );
}

/** The daily grant, once per local day, withheld above the soft cap. */
export function claimDaily(wallet, { at, tzOffsetMinutes = 0 }, config = DEFAULT_CONFIG) {
  if (!Number.isSafeInteger(at) || at <= 0) return refuse(wallet, 'bad_time');
  const key = dayKeyOf(at, tzOffsetMinutes);
  if (wallet.lastDailyKey === key) return refuse(wallet, 'already_claimed');
  const rolled = rollDay(wallet, key);
  if (rolled.coins >= config.softCap) return refuse(rolled === wallet ? wallet : Object.freeze(rolled), 'soft_cap');
  const granted = config.daily;
  return done(
    { ...rolled, coins: rolled.coins + granted, lifetimeEarned: rolled.lifetimeEarned + granted, lastDailyKey: key },
    { ok: true, granted, spent: 0, reason: 'daily' },
  );
}

/**
 * The floor. If the wallet is below it and the floor has not fired within `everyMs`, top up TO the
 * floor. Fires from the server on a money-shaped request, never from a timer, so it is rate-limited
 * by construction. Identity when nothing is owed.
 */
export function applyFloor(wallet, { at }, config = DEFAULT_CONFIG) {
  if (!Number.isSafeInteger(at) || at <= 0) return refuse(wallet, 'bad_time');
  const { coins, everyMs } = config.floor;
  if (wallet.coins >= coins) return refuse(wallet, 'above_floor');
  if (wallet.coins >= config.softCap) return refuse(wallet, 'soft_cap');
  if (wallet.lastFloorAt && at - wallet.lastFloorAt < everyMs) return refuse(wallet, 'floor_cooldown');
  const granted = coins - wallet.coins;
  return done(
    { ...wallet, coins, lifetimeEarned: wallet.lifetimeEarned + granted, lastFloorAt: at },
    { ok: true, granted, spent: 0, reason: 'floor' },
  );
}

/** Whether an entry is legal for this wallet: a listed tier, unlocked at this balance, affordable. */
export function canStake(wallet, amount, config = DEFAULT_CONFIG) {
  if (!config.stakes.includes(amount)) return { ok: false, reason: 'bad_tier' };
  const unlock = config.tierUnlock?.[amount];
  if (unlock && wallet.coins < unlock) return { ok: false, reason: 'tier_locked' };
  if (wallet.coins < amount) return { ok: false, reason: 'insufficient' };
  return { ok: true, reason: 'ok' };
}

/** The tiers this wallet may enter right now, for the entry card. */
export const openTiers = (wallet, config = DEFAULT_CONFIG) =>
  Object.freeze(config.stakes.filter((amount) => canStake(wallet, amount, config).ok));

/** Commit a stake. The coins leave the wallet; where they go (an escrow) is the ledger's business. */
export function stake(wallet, amount, config = DEFAULT_CONFIG) {
  const check = canStake(wallet, amount, config);
  if (!check.ok) return refuse(wallet, check.reason);
  return done(
    { ...wallet, coins: wallet.coins - amount, lifetimeSpent: wallet.lifetimeSpent + amount },
    { ok: true, granted: 0, spent: amount, reason: 'stake' },
  );
}

/** A prize paid to this wallet by the house at the end of a duel it entered. Resets the loss streak. */
export function receivePayout(wallet, amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return refuse(wallet, 'bad_amount');
  return done(
    { ...wallet, coins: wallet.coins + amount, lossStreak: 0 },
    { ok: true, granted: amount, spent: 0, reason: 'payout' },
  );
}

/** A staked duel lost. The entry already left at `stake`; this only counts the streak. */
export function recordLoss(wallet) {
  return done({ ...wallet, lossStreak: wallet.lossStreak + 1 }, { ok: true, granted: 0, spent: 0, reason: 'loss' });
}

/** Enter a practice drill. A pure sink. Refused, not floored, when unaffordable — the floor is a separate, rate-limited grant. */
export function enterPractice(wallet, config = DEFAULT_CONFIG) {
  const price = config.practiceEntry;
  if (wallet.coins < price) return refuse(wallet, 'insufficient');
  return done(
    { ...wallet, coins: wallet.coins - price, lifetimeSpent: wallet.lifetimeSpent + price },
    { ok: true, granted: 0, spent: price, reason: 'practice' },
  );
}

/** Whether today's free recap is still unplayed, for the "Free today" tag. */
export function recapFreeToday(wallet, { at, tzOffsetMinutes = 0 }) {
  return Number.isSafeInteger(at) && at > 0 && wallet.recapKey !== dayKeyOf(at, tzOffsetMinutes);
}

/**
 * Enter the "Yesterday" recap: free once per local day, the reciprocity path that comes before any
 * priced drill. It moves no coins; it only stamps the day, so a second run the same day is refused
 * with 'recap_played' and the caller routes it through the ordinary practice entry instead.
 */
export function enterRecap(wallet, { at, tzOffsetMinutes = 0 }) {
  if (!Number.isSafeInteger(at) || at <= 0) return refuse(wallet, 'bad_time');
  const key = dayKeyOf(at, tzOffsetMinutes);
  if (wallet.recapKey === key) return refuse(wallet, 'recap_played');
  return done({ ...wallet, recapKey: key }, { ok: true, granted: 0, spent: 0, reason: 'recap' });
}

/**
 * What a player can afford right now, for an honest screen: which stakes, whether a drill, and if
 * not, exactly how many ads would get them there. The UI shows the ad as a choice with a known
 * price, never as a toll sprung mid-flow — that is the line between a rewarded ad and a dark pattern.
 */
export function affordability(wallet, { region }, config = DEFAULT_CONFIG) {
  const perAd = adRewardFor(region, config);
  const adsFor = (cost) => (wallet.coins >= cost ? 0 : perAd > 0 ? Math.ceil((cost - wallet.coins) / perAd) : null);
  return Object.freeze({
    coins: wallet.coins,
    perAd,
    practice: Object.freeze({ cost: config.practiceEntry, adsNeeded: adsFor(config.practiceEntry) }),
    stakes: Object.freeze(
      config.stakes.map((amount) =>
        Object.freeze({
          amount,
          adsNeeded: adsFor(amount),
          locked: !!(config.tierUnlock?.[amount] && wallet.coins < config.tierUnlock[amount]),
          unlockAt: config.tierUnlock?.[amount] ?? 0,
          fee: feeFor(amount, config),
          prize: prizeFor(amount, config),
        }),
      ),
    ),
    adsLeftToday: Math.max(0, config.adDailyCap - wallet.adsToday),
    questLeftToday: Math.max(0, config.questBudgetPerDay - wallet.questToday),
  });
}

/**
 * Revenue model. Standard ad-funded arithmetic: ARPDAU = ads per DAU × eCPM / 1000; LTV over a
 * horizon = ARPDAU × Σ retention(day). `retention` is an array of survival fractions by day
 * (index 0 = day 0 = 1.0). Inputs come from the research; this only does the sums, in cents.
 */
export function ltvCents({ adsPerDau, ecpmCents, retention }) {
  if (!(adsPerDau >= 0) || !(ecpmCents >= 0) || !Array.isArray(retention)) return null;
  const arpdauCents = (adsPerDau * ecpmCents) / 1000;
  const lifetimeDays = retention.reduce((a, r) => a + (r >= 0 && r <= 1 ? r : 0), 0);
  return Object.freeze({
    arpdauCents,
    lifetimeDays,
    ltvCents: arpdauCents * lifetimeDays,
  });
}
