/**
 * Stake advice: the picker default, the gambler's-ruin arithmetic, the loss-streak lever and the
 * expectation note. Every number here is checked against the config it comes from, and the copy is
 * grepped for the words the gamification lane rules out.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_CONFIG, emptyWallet, readConfig } from '../lib/economy/economy.mjs';
import {
  RUNWAY_DUELS,
  advise,
  closedReason,
  defaultStake,
  evCopy,
  feePercent,
  ruinOdds,
  ruinWithin,
  runwayDuels,
} from '../lib/economy/stake-advice.mjs';

const wallet = (coins, extra = {}) => Object.freeze({ ...emptyWallet(), coins, ...extra });
const NO_FEE = readConfig({ feeBps: {} });
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} should be within ${eps} of ${b}`);

/* ------------------------------------------------------------------ the default tier */

test('defaultStake: the highest open tier covered five times over, else the lowest affordable, else free', () => {
  assert.equal(RUNWAY_DUELS, 5);
  assert.equal(defaultStake(wallet(0)), 0, 'nothing affordable: free');
  assert.equal(defaultStake(wallet(9)), 0, 'below the smallest tier: free');
  assert.equal(defaultStake(wallet(49)), 10, 'no tier covered five times: the lowest affordable');
  assert.equal(defaultStake(wallet(50)), 10, 'five entries of 10');
  assert.equal(defaultStake(wallet(125)), 25);
  assert.equal(defaultStake(wallet(250)), 50, 'five entries of 50');
  assert.equal(defaultStake(wallet(1249)), 100, '250 needs 1,250 of cover');
  assert.equal(defaultStake(wallet(1250)), 250, 'unlocked at 1,000 and covered at 1,250');
  assert.equal(defaultStake(wallet(2500)), 250, '500 is covered but locked below the soft cap');
  assert.equal(defaultStake(wallet(4999)), 250);
  assert.equal(defaultStake(wallet(5000)), 500, 'the top tier opens at 5,000 and is covered');
  assert.equal(defaultStake(wallet(20_000)), 500);
});

test('defaultStake respects tierUnlock even when the balance would cover the tier', () => {
  const gated = readConfig({ tierUnlock: { 50: 10_000 } });
  assert.equal(defaultStake(wallet(1249), gated), 100, '50 is gated; 100 is the highest covered open tier');
  assert.equal(defaultStake(wallet(260), gated), 25, '50 gated, 100 not covered: 25 is the highest covered');
  const narrow = readConfig({ stakes: [10, 25, 50, 100] });
  assert.equal(defaultStake(wallet(9000), narrow), 100, 'only the tiers on offer count');
});

test('defaultStake never picks a tier the wallet cannot enter', () => {
  for (let coins = 0; coins <= 6000; coins += 7) {
    const tier = defaultStake(wallet(coins));
    if (tier === 0) assert.ok(coins < DEFAULT_CONFIG.stakes[0]);
    else {
      assert.ok(coins >= tier);
      const unlock = DEFAULT_CONFIG.tierUnlock[tier];
      if (unlock) assert.ok(coins >= unlock);
    }
  }
});

/* ------------------------------------------------------------------ ruin arithmetic */

test('runwayDuels is whole duels of cover', () => {
  assert.equal(runwayDuels(150, 50), 3);
  assert.equal(runwayDuels(149, 50), 2);
  assert.equal(runwayDuels(49, 50), 0);
  assert.equal(runwayDuels(100, 0), 0);
});

test('ruinOdds: a fair, fee-free duel loses the bankroll before doubling it exactly half the time', () => {
  near(ruinOdds(100, 50, 0.5, NO_FEE), 0.5);
  near(ruinOdds(50, 25), 0.5, 1e-12, 'the 25 tier carries no fee in the default config');
  near(ruinOdds(1000, 10), 0.5);
  near(ruinOdds(100, 50, 0.6, NO_FEE), ((2 / 3) ** 2 - (2 / 3) ** 4) / (1 - (2 / 3) ** 4), 1e-12);
  assert.equal(ruinOdds(40, 50), 1, 'cannot afford one entry');
  assert.equal(ruinOdds(100, 0), 1);
});

test('ruinOdds: the numeric fee solver agrees with the closed form and moves the right way', () => {
  // A fee too small to matter reproduces the closed form to within the unit rounding.
  near(ruinOdds(1000, 50, 0.6, readConfig({ feeBps: { 50: 1 } })), ruinOdds(1000, 50, 0.6, NO_FEE), 1e-9);
  // With the disclosed fee every staked tier is a losing game: ruin is more likely than not, and
  // more so the longer the bankroll plays (the fee compounds).
  for (const tier of [50, 100, 250]) {
    const short = ruinOdds(5 * tier, tier);
    const long = ruinOdds(20 * tier, tier);
    assert.ok(short > 0.5 && short < 1, `${tier}: ${short}`);
    assert.ok(long > short, `${tier}: a longer game at a fee is a surer loss (${long} > ${short})`);
  }
  // A better player at the same fee is less likely to be ruined.
  assert.ok(ruinOdds(500, 50, 0.6) < ruinOdds(500, 50, 0.5));
  assert.ok(ruinOdds(500, 50, 0.7) < ruinOdds(500, 50, 0.6));
  for (const v of [ruinOdds(500, 50), ruinOdds(1000, 100), ruinOdds(5000, 500)]) assert.ok(v >= 0 && v <= 1);
});

test('ruinWithin reproduces the audited gambler’s-ruin table (docs/money/ads/audit-2-economy.json)', () => {
  // p = 0.5, a win nets +0.8 entries after the 10% pot fee; "ruin" is no longer affording the tier.
  const pct = (k, n) => Number((100 * ruinWithin(k * 50, 50, n)).toFixed(1));
  assert.equal(pct(1, 2), 75.0);
  assert.equal(pct(1, 10), 87.7);
  assert.equal(pct(2, 2), 25.0);
  assert.equal(pct(2, 10), 68.6);
  assert.equal(pct(5, 10), 21.7);
  assert.equal(pct(10, 10), 0.1);
  // The fee-free micro tiers step evenly, so a win then a loss lands back where it started: a
  // 1-entry bankroll is out within 2 duels half the time (not the fee table's 75%), 2 entries 25%.
  assert.equal(Number((100 * ruinWithin(10, 10, 2)).toFixed(1)), 50.0);
  assert.equal(Number((100 * ruinWithin(20, 10, 2)).toFixed(1)), 25.0);
});

test('ruinWithin rises with the stake at a fixed balance (fewer duels of runway)', () => {
  for (const coins of [100, 250, 1000]) {
    let last = -1;
    for (const tier of DEFAULT_CONFIG.stakes) {
      const v = ruinWithin(coins, tier, 10);
      assert.ok(v >= last, `${coins} coins: ruin within 10 at ${tier} (${v}) >= at the tier below (${last})`);
      assert.ok(v >= 0 && v <= 1);
      last = v;
    }
  }
  assert.equal(ruinWithin(100, 50, 0), 0);
  assert.equal(ruinWithin(40, 50, 10), 1);
});

/* ------------------------------------------------------------------ the loss-streak lever */

test('advise is quiet below the configured run of losses, at a free entry, and with runway to spare', () => {
  assert.deepEqual(advise(wallet(150, { lossStreak: 2 }), 50), { kind: 'ok', suggested: 50, reason: '' });
  assert.deepEqual(advise(wallet(150, { lossStreak: 3 }), 0), { kind: 'ok', suggested: 0, reason: '' });
  assert.deepEqual(advise(wallet(250, { lossStreak: 3 }), 50), { kind: 'ok', suggested: 50, reason: '' });
  assert.deepEqual(advise(wallet(150, { lossStreak: 3 }), 33), { kind: 'ok', suggested: 33, reason: '' });
});

test('advise points one tier down after the run of losses with fewer than five duels left, with the runway spelled out', () => {
  const a = advise(wallet(150, { lossStreak: 3 }), 50);
  assert.equal(a.kind, 'tier-down');
  assert.equal(a.suggested, 25);
  assert.equal(a.reason, 'At 50 a duel you have 3 duels left; at 25 you have 6.');
  const b = advise(wallet(120, { lossStreak: 7 }), 100);
  assert.equal(b.suggested, 50, 'the next open tier down, not the bottom');
  assert.equal(b.reason, 'At 100 a duel you have 1 duel left; at 50 you have 2.');
  // The run length is the config's, not a literal.
  const patient = readConfig({ doubleAdAfterLosses: 5 });
  assert.equal(advise(wallet(150, { lossStreak: 4 }), 50, patient).kind, 'ok');
  assert.equal(advise(wallet(150, { lossStreak: 5 }), 50, patient).kind, 'tier-down');
});

test('advise points at a free duel when no lower tier is open', () => {
  const a = advise(wallet(15, { lossStreak: 3 }), 10);
  assert.equal(a.kind, 'free');
  assert.equal(a.suggested, 0);
  assert.match(a.reason, /^At 10 a duel you have 1 duel left\./);
  assert.ok(Object.isFrozen(a));
});

/* ------------------------------------------------------------------ the expectation note */

test('evCopy carries the fee percentage from feeBps and nothing else numeric', () => {
  assert.equal(feePercent(50), '10%');
  assert.equal(feePercent(500), '15%');
  assert.equal(feePercent(10), '0%');
  assert.equal(feePercent(50, readConfig({ feeBps: { 50: 1_250 } })), '12.5%');
  assert.equal(
    evCopy(50),
    'Two equal players split wins evenly. The 10% fee makes every stake a small loss over time — play for the contest, not the coins.',
  );
  assert.ok(evCopy(500).includes('The 15% fee'));
  assert.ok(evCopy(50, readConfig({ feeBps: { 50: 500 } })).includes('The 5% fee'));
  assert.ok(evCopy(10).startsWith('Two equal players split wins evenly. With no fee at this entry'));
  assert.equal(evCopy(0), evCopy(10));
  for (const tier of DEFAULT_CONFIG.stakes) assert.ok(evCopy(tier).endsWith('play for the contest, not the coins.'));
});

test('closedReason says why a tier is closed, in the wallet’s numbers', () => {
  assert.equal(closedReason(wallet(500), 50), '');
  assert.equal(closedReason(wallet(30), 50), 'You have 30 coins. This entry is 50.');
  assert.equal(closedReason(wallet(900), 250), 'Opens at 1,000 coins.');
  assert.equal(closedReason(wallet(900), 33), 'Not an entry tier.');
});

/* ------------------------------------------------------------------ vocabulary gate */

test('the advice module and the picker use none of the ruled-out words', () => {
  const files = ['../lib/economy/stake-advice.mjs', '../app/screens/play/match-settings.tsx'];
  const banned = [
    /\bbets?\b/i,
    /\bwagers?\b/i,
    /\bodds\b/i,
    /\bjackpot/i,
    /\bcasino/i,
    /\bslots?\b/i,
    /\bmultiplier/i,
    /\bgambl/i,
    /\bdue\b/i,
    /\blucky\b/i,
    /\bhot streak/i,
    /\bnearly\b/i,
    /\bhurry\b/i,
    /\bnow or never/i,
  ];
  for (const file of files) {
    const src = readFileSync(new URL(file, import.meta.url), 'utf8');
    // Strip comments, and the identifiers this test itself names: the check is on what a player
    // could read (copy and attributes), and the comments explain the rules they enforce.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const rule of banned) {
      const hit = code.match(rule);
      assert.equal(hit, null, `${file} must not contain ${rule} (found "${hit?.[0]}")`);
    }
    // No exclamation marks in anything a player reads (the product voice), checked on the string
    // literals alone since `!` is an operator everywhere else.
    const strings = code.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g) ?? [];
    for (const s of strings) assert.ok(!s.includes('!'), `${file}: no exclamation marks in copy (${s})`);
  }
});
