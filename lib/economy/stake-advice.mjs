/**
 * Stake advice: what the entry picker should suggest, and what it should say, from the wallet
 * and the economy config alone.
 *
 * Three things live here, all pure and all read from `DEFAULT_CONFIG` (stakes, tierUnlock,
 * feeBps, doubleAdAfterLosses) so a server bundle retunes them without touching this file:
 *
 *  - the picker DEFAULT: the highest open tier the wallet covers five times over, else the lowest
 *    tier it can afford, else free. Five entries of runway is the audited line under which a fair
 *    duel puts a bankroll at real risk of no longer affording its tier (docs/money/ads/
 *    audit-2-economy.json, the gambler's-ruin table);
 *  - the LOSS-STREAK lever that touches nothing about the contest: after the configured run of
 *    staked losses, a wallet with fewer than five entries left is pointed one tier down, with the
 *    runway at both tiers spelled out;
 *  - the honest note about expectation: two equal players split wins evenly, and the disclosed
 *    fee makes every staked tier a small loss over time. No stake is positive-expected-value at
 *    p = 0.5 (Kelly with the fee is f* = p − (1 − p)·stake/prize-gain, negative below p = 5/9).
 *
 * The copy is neutral by rule. Nothing here says a win is owed, frames a loss as nearly a win, or
 * hurries anyone: those are the gamification lane's blocking findings, and `tests/
 * stake-advice.test.mjs` greps this file for them.
 */
import { DEFAULT_CONFIG, canStake, feeFor, openTiers, prizeFor } from './economy.mjs';

/** Entries of runway under which the loss-streak advice speaks, and over which the default sits. */
export const RUNWAY_DUELS = 5;

/** Whole duels a bankroll covers at a tier. Zero when the tier is more than the balance. */
export function runwayDuels(coins, stake) {
  if (!(stake > 0) || !(coins >= 0)) return 0;
  return Math.floor(coins / stake);
}

/**
 * The tier the picker opens on. The highest open tier with `RUNWAY_DUELS` entries of cover; failing
 * that, the lowest tier the wallet can afford; failing that, 0 (a free duel). Never a tier the
 * wallet cannot enter (`canStake`), so `tierUnlock` is respected by construction.
 */
export function defaultStake(wallet, config = DEFAULT_CONFIG) {
  const open = openTiers(wallet, config);
  if (open.length === 0) return 0;
  const covered = open.filter((tier) => wallet.coins >= RUNWAY_DUELS * tier);
  return covered.length ? Math.max(...covered) : Math.min(...open);
}

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/**
 * Gambler's ruin: the probability of no longer being able to afford this tier before the bankroll
 * has doubled, when each duel is won with probability `p`.
 *
 * A win moves the balance by the prize less the entry (the entry back, plus the other entry, less
 * the fee); a loss moves it by the entry. Without a fee the two steps are equal and the textbook
 * closed form applies: at a fair p it is simply 1 − start/target = 1/2. With a fee the up-step is
 * shorter than the down-step, so the chain is solved numerically: the absorbing equations
 * f(x) = p·f(x + up) + (1 − p)·f(x − down) over the balances between "cannot afford one entry"
 * (f = 1) and "doubled" (f = 0), as a banded linear system. Balances are counted in units of
 * gcd(up, down) and the start is rounded DOWN to a whole unit, which errs towards ruin.
 *
 * Returns 1 when the tier is more than the balance, and a number in [0, 1] otherwise.
 */
export function ruinOdds(coins, stake, p = 0.5, config = DEFAULT_CONFIG) {
  if (!(stake > 0) || !(coins >= 0)) return 1;
  if (coins < stake) return 1;
  if (!(p > 0)) return 1;
  if (!(p < 1)) return 0;
  const down = stake;
  const up = prizeFor(stake, config) - stake;
  if (!(up > 0)) return 1;
  const q = 1 - p;
  if (up === down) {
    // Even steps: the classic result, in units of one entry.
    const start = Math.floor(coins / stake);
    const target = 2 * start;
    if (p === q) return 1 - start / target;
    const r = q / p;
    return (r ** start - r ** target) / (1 - r ** target);
  }
  const unit = gcd(up, down);
  const U = up / unit,
    D = down / unit,
    start = Math.floor(coins / unit),
    target = 2 * start;
  // Unknowns: f(x) for x in [D, target − 1]; below D is ruin (1), at or above target is doubled (0).
  const n = target - D;
  if (n <= 0) return 1;
  const width = D + U + 1;
  const band = new Float64Array(n * width);
  const rhs = new Float64Array(n);
  const at = (row, col) => row * width + (col - row + D);
  for (let i = 0; i < n; i++) {
    band[at(i, i)] = 1;
    if (i + U < n) band[at(i, i + U)] = -p;
    if (i - D >= 0) band[at(i, i - D)] = -q;
    else rhs[i] = q;
  }
  // Banded Gaussian elimination. The matrix is a diagonally dominant M-matrix, so no pivoting.
  for (let i = 0; i < n; i++) {
    const pivot = band[at(i, i)];
    for (let j = i + 1; j <= Math.min(i + D, n - 1); j++) {
      const factor = band[at(j, i)] / pivot;
      if (factor === 0) continue;
      for (let c = i; c <= Math.min(i + U, n - 1); c++) band[at(j, c)] -= factor * band[at(i, c)];
      rhs[j] -= factor * rhs[i];
    }
  }
  const f = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let acc = rhs[i];
    for (let c = i + 1; c <= Math.min(i + U, n - 1); c++) acc -= band[at(i, c)] * f[c];
    f[i] = acc / band[at(i, i)];
  }
  const value = f[start - D];
  return Math.min(1, Math.max(0, value));
}

/**
 * The audited table's quantity: the probability that within `n` duels at this tier the balance
 * drops below one entry — "can no longer afford the same tier" — when each duel is won with
 * probability `p` and a win nets the prize less the entry. Exact dynamic programming over the
 * reachable balances, so it reproduces docs/money/ads/audit-2-economy.json (k = 1: 75% in 2 duels,
 * 87.7% in 10; k = 2: 25% and 68.6%; k = 5: 21.7% in 10). Unlike `ruinOdds` this rises with the
 * stake at a fixed balance, because a bigger entry is fewer duels of runway.
 */
export function ruinWithin(coins, stake, n, p = 0.5, config = DEFAULT_CONFIG) {
  if (!(stake > 0) || !(coins >= 0)) return 1;
  if (coins < stake) return 1;
  if (!(n >= 1)) return 0;
  const up = prizeFor(stake, config) - stake;
  const q = 1 - p;
  let alive = new Map([[coins, 1]]);
  let ruined = 0;
  for (let step = 0; step < n; step++) {
    const next = new Map();
    for (const [balance, mass] of alive) {
      const won = balance + up,
        lost = balance - stake;
      next.set(won, (next.get(won) ?? 0) + mass * p);
      if (lost < stake) ruined += mass * q;
      else next.set(lost, (next.get(lost) ?? 0) + mass * q);
    }
    alive = next;
  }
  return Math.min(1, Math.max(0, ruined));
}

const duels = (n) => `${n} ${n === 1 ? 'duel' : 'duels'}`;

/**
 * The loss-streak lever. After `config.doubleAdAfterLosses` straight staked losses, a wallet with
 * fewer than `RUNWAY_DUELS` entries left at this tier is pointed at the next tier down, with the
 * runway at each spelled out — or at a free duel when no lower tier is open. Everything else is
 * 'ok'. The contest itself is never touched; this only changes what the picker suggests.
 */
export function advise(wallet, stake, config = DEFAULT_CONFIG) {
  const ok = Object.freeze({ kind: 'ok', suggested: stake, reason: '' });
  if (!(stake > 0) || !config.stakes.includes(stake)) return ok;
  if (wallet.lossStreak < config.doubleAdAfterLosses) return ok;
  const left = runwayDuels(wallet.coins, stake);
  if (left >= RUNWAY_DUELS) return ok;
  const lower = openTiers(wallet, config).filter((tier) => tier < stake);
  if (lower.length === 0) {
    return Object.freeze({
      kind: 'free',
      suggested: 0,
      reason: `At ${stake} a duel you have ${duels(left)} left. A free duel costs nothing and still counts.`,
    });
  }
  const next = Math.max(...lower);
  return Object.freeze({
    kind: 'tier-down',
    suggested: next,
    reason: `At ${stake} a duel you have ${duels(left)} left; at ${next} you have ${runwayDuels(wallet.coins, next)}.`,
  });
}

/** "10%" from basis points, without a stray decimal. */
export function feePercent(stake, config = DEFAULT_CONFIG) {
  const bps = config.feeBps?.[stake] ?? 0;
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

/**
 * The expectation note under the picker. Two equal players split wins evenly, so at a tier with a
 * fee every entry is a small loss over time; at a fee-free tier the coins only move back and
 * forth. The percentage is the config's, never a literal.
 */
export function evCopy(stake, config = DEFAULT_CONFIG) {
  if (!(stake > 0) || feeFor(stake, config) === 0)
    return 'Two equal players split wins evenly. With no fee at this entry the coins go back and forth and nobody comes out ahead over time — play for the contest, not the coins.';
  return `Two equal players split wins evenly. The ${feePercent(stake, config)} fee makes every stake a small loss over time — play for the contest, not the coins.`;
}

/** Why a tier is closed to this wallet, in words, or '' when it is open. */
export function closedReason(wallet, stake, config = DEFAULT_CONFIG) {
  const check = canStake(wallet, stake, config);
  if (check.ok) return '';
  if (check.reason === 'tier_locked') return `Opens at ${config.tierUnlock[stake].toLocaleString()} coins.`;
  if (check.reason === 'insufficient') return `You have ${wallet.coins} coins. This entry is ${stake}.`;
  return 'Not an entry tier.';
}
