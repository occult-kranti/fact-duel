/**
 * The coin economy and the ad seam.
 *
 * The properties that matter: an ad is paid exactly once; the daily counters roll on the player's
 * local day, not UTC; the floor prevents lockout without becoming a faucet; the soft cap stops
 * hoarding without ever refusing to honour attention; and every no-op returns the same wallet
 * object, so persistence can key on identity like the rest of the profile layer does.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG,
  emptyWallet,
  readWallet,
  dayKeyOf,
  adRewardFor,
  earnFromAd,
  claimDaily,
  applyFloor,
  canStake,
  stake,
  receivePayout,
  enterPractice,
  affordability,
  ltvCents,
} from '../lib/economy/economy.mjs';
import { NullAdProvider, RecordingAdProvider, assertProvider, validReceipt, adOpKey, PLACEMENTS } from '../lib/ads/provider.mjs';

const T0 = Date.parse('2026-09-16T10:00:00Z');
const MIN = 60_000;
const cfg = DEFAULT_CONFIG;

/* ------------------------------------------------------------------ wallet hygiene */

test('a clean wallet round-trips by identity; a dirty one is repaired', () => {
  const w = emptyWallet();
  assert.equal(readWallet(w), w);
  const dirty = { coins: -5, lifetimeEarned: 'x', adsToday: 2.5, dayKey: 12, adIds: ['a', 7, 'b'], extra: 1 };
  const clean = readWallet(dirty);
  assert.notEqual(clean, dirty);
  assert.equal(clean.coins, 0);
  assert.equal(clean.lifetimeEarned, 0);
  assert.equal(clean.adsToday, 0);
  assert.equal(clean.dayKey, '');
  assert.deepEqual([...clean.adIds], ['a', 'b']);
  assert.equal('extra' in clean, false);
  assert.ok(Object.isFrozen(clean));
  assert.equal(readWallet(clean), clean, 'and the repaired wallet is itself clean');
});

test('the local day is the player’s, not the server’s', () => {
  const late = Date.parse('2026-09-16T23:30:00Z');
  assert.equal(dayKeyOf(late, 0), '2026-09-16');
  assert.equal(dayKeyOf(late, -330), '2026-09-17', 'India (UTC+5:30) is already tomorrow');
  assert.equal(dayKeyOf(late, 420), '2026-09-16', 'Los Angeles is still today');
});

/* ------------------------------------------------------------------ ads */

test('an ad pays the regional rate, exactly once, with a cooldown and a daily cap', () => {
  let w = emptyWallet();
  const r1 = earnFromAd(w, { adId: 'ad-1', region: 'US', at: T0 }, cfg);
  assert.equal(r1.ok, true);
  assert.equal(r1.granted, adRewardFor('US'));
  assert.equal(r1.wallet.coins, 50);
  w = r1.wallet;

  const replay = earnFromAd(w, { adId: 'ad-1', region: 'US', at: T0 + 10 * MIN }, cfg);
  assert.equal(replay.ok, false);
  assert.equal(replay.reason, 'already_paid');
  assert.equal(replay.wallet, w, 'a refusal returns the same wallet object');

  const tooSoon = earnFromAd(w, { adId: 'ad-2', region: 'US', at: T0 + 10_000 }, cfg);
  assert.equal(tooSoon.reason, 'cooldown');

  const r2 = earnFromAd(w, { adId: 'ad-2', region: 'IN', at: T0 + MIN }, cfg);
  assert.equal(r2.granted, adRewardFor('IN'), 'a different region pays a different coin amount');
  assert.equal(r2.wallet.adsToday, 2);

  // Walk to the cap.
  w = r2.wallet;
  let n = 2;
  for (; n < cfg.adDailyCap; n++) {
    const r = earnFromAd(w, { adId: `ad-${n + 1}`, region: 'US', at: T0 + (n + 1) * MIN }, cfg);
    assert.equal(r.ok, true, `ad ${n + 1} should pay`);
    w = r.wallet;
  }
  const capped = earnFromAd(w, { adId: 'ad-over', region: 'US', at: T0 + (n + 2) * MIN }, cfg);
  assert.equal(capped.reason, 'daily_cap');
  assert.equal(w.adsToday, cfg.adDailyCap);
});

test('the daily ad counter rolls on the local day and unknown regions fall to the wildcard', () => {
  let w = emptyWallet();
  for (let i = 0; i < cfg.adDailyCap; i++) w = earnFromAd(w, { adId: `d-${i}`, region: 'US', at: T0 + i * MIN }, cfg).wallet;
  const nextDay = Date.parse('2026-09-17T00:05:00Z');
  const r = earnFromAd(w, { adId: 'd-new', region: 'ZZ', at: nextDay }, cfg);
  assert.equal(r.ok, true);
  assert.equal(r.wallet.adsToday, 1, 'the counter rolled');
  assert.equal(r.granted, cfg.adReward['*']);
  assert.equal(adRewardFor(undefined), cfg.adReward['*']);
  assert.equal(adRewardFor('us'), cfg.adReward.US, 'case-insensitive');
});

test('a completion stamped before the last paid one is refused', () => {
  const w = earnFromAd(emptyWallet(), { adId: 'a', region: 'US', at: T0 }, cfg).wallet;
  assert.equal(earnFromAd(w, { adId: 'b', region: 'US', at: T0 - 5 * MIN }, cfg).reason, 'out_of_order');
  assert.equal(earnFromAd(w, { adId: '', region: 'US', at: T0 + MIN }, cfg).reason, 'bad_ad_id');
  assert.equal(earnFromAd(w, { adId: 'c', region: 'US', at: -1 }, cfg).reason, 'bad_time');
});

/* ------------------------------------------------------------------ daily and floor */

test('the daily grant is once per local day and withheld above the soft cap', () => {
  let w = emptyWallet();
  const first = claimDaily(w, { at: T0 }, cfg);
  assert.equal(first.granted, cfg.daily);
  const again = claimDaily(first.wallet, { at: T0 + 2 * 3_600_000 }, cfg);
  assert.equal(again.reason, 'already_claimed');
  assert.equal(again.wallet, first.wallet);
  const tomorrow = claimDaily(first.wallet, { at: T0 + 24 * 3_600_000 }, cfg);
  assert.equal(tomorrow.ok, true);

  const rich = Object.freeze({ ...emptyWallet(), coins: cfg.softCap });
  assert.equal(claimDaily(rich, { at: T0 }, cfg).reason, 'soft_cap');
  // But attention is always honoured: an ad still pays above the cap.
  assert.equal(earnFromAd(rich, { adId: 'x', region: 'US', at: T0 }, cfg).ok, true);
});

test('the floor lifts a broke wallet to the floor, rate-limited, and never above it', () => {
  const broke = Object.freeze({ ...emptyWallet(), coins: 3 });
  const lifted = applyFloor(broke, { at: T0 }, cfg);
  assert.equal(lifted.ok, true);
  assert.equal(lifted.wallet.coins, cfg.floor.coins);
  assert.equal(lifted.granted, cfg.floor.coins - 3);
  const soon = applyFloor(Object.freeze({ ...lifted.wallet, coins: 0 }), { at: T0 + 3_600_000 }, cfg);
  assert.equal(soon.reason, 'floor_cooldown');
  const later = applyFloor(Object.freeze({ ...lifted.wallet, coins: 0 }), { at: T0 + cfg.floor.everyMs }, cfg);
  assert.equal(later.ok, true);
  const fine = applyFloor(Object.freeze({ ...emptyWallet(), coins: cfg.floor.coins }), { at: T0 }, cfg);
  assert.equal(fine.reason, 'above_floor');
  assert.equal(fine.wallet.coins, cfg.floor.coins);
});

/* ------------------------------------------------------------------ sinks */

test('stakes must be a listed tier and affordable; a payout is zero-sum', () => {
  const w = Object.freeze({ ...emptyWallet(), coins: 60 });
  assert.deepEqual(canStake(w, 7, cfg), { ok: false, reason: 'bad_tier' });
  assert.deepEqual(canStake(w, 100, cfg), { ok: false, reason: 'insufficient' });
  assert.deepEqual(canStake(w, 50, cfg), { ok: true, reason: 'ok' });
  const staked = stake(w, 50, cfg);
  assert.equal(staked.wallet.coins, 10);
  assert.equal(staked.spent, 50);
  const won = receivePayout(staked.wallet, 100);
  assert.equal(won.wallet.coins, 110);
  assert.equal(receivePayout(w, 0).reason, 'bad_amount');
  assert.equal(stake(w, 100, cfg).wallet, w);
});

test('practice is a pure sink, refused rather than floored when unaffordable', () => {
  const w = Object.freeze({ ...emptyWallet(), coins: 15 });
  const one = enterPractice(w, cfg);
  assert.equal(one.wallet.coins, 15 - cfg.practiceEntry);
  const two = enterPractice(one.wallet, cfg);
  assert.equal(two.reason, 'insufficient');
  assert.equal(two.wallet, one.wallet);
});

test('affordability says exactly how many ads a player is away from each thing', () => {
  const w = Object.freeze({ ...emptyWallet(), coins: 5, adsToday: 3 });
  const a = affordability(w, { region: 'IN' }, cfg);
  assert.equal(a.perAd, 20);
  assert.equal(a.practice.adsNeeded, 1, '5 + 20 >= 10');
  assert.equal(a.stakes.find((s) => s.amount === 100).adsNeeded, 5, '5 + 5*20 >= 100');
  assert.equal(a.stakes.find((s) => s.amount === 10).adsNeeded, 1);
  assert.equal(a.adsLeftToday, cfg.adDailyCap - 3);
  const rich = affordability(Object.freeze({ ...w, coins: 1000 }), { region: 'IN' }, cfg);
  assert.ok(rich.stakes.every((s) => s.adsNeeded === 0));
});

/* ------------------------------------------------------------------ the engine cannot rig */

test('the economy has no idea what a question, a bot or an outcome is', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../lib/economy/economy.mjs', import.meta.url), 'utf8');
  // Strip comments; the header explains the rule and may name what it forbids.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const word of ['difficulty', 'skill', 'correct', 'winner', 'question', 'Math.random', 'Date.now']) {
    assert.ok(!code.includes(word), `economy.mjs must not know about "${word}"`);
  }
});

/* ------------------------------------------------------------------ revenue arithmetic */

test('ltv is ads per DAU x eCPM x lifetime days, in cents', () => {
  const r = ltvCents({ adsPerDau: 4, ecpmCents: 1200, retention: [1, 0.4, 0.3, 0.2, 0.1] });
  assert.equal(r.arpdauCents, 4.8);
  assert.equal(r.lifetimeDays, 2);
  assert.equal(r.ltvCents, 9.6);
  assert.equal(ltvCents({ adsPerDau: -1, ecpmCents: 1, retention: [] }), null);
});

/* ------------------------------------------------------------------ the ad seam */

test('the null provider is honest about having nothing to show', async () => {
  const p = assertProvider(new NullAdProvider());
  assert.equal(await p.available(), false);
  const out = await p.show({ placement: 'coins' });
  assert.equal(out.completed, false);
  assert.equal(out.receipt, null);
  assert.equal(p.serverVerified, false);
});

test('a scripted provider drives the economy end to end, and a bad receipt is caught', async () => {
  const now = (() => {
    let t = T0;
    return () => (t += MIN);
  })();
  const p = new RecordingAdProvider([true, false, 'network_error', true, { adId: 'forged', placement: 'nope', at: 1, region: 'US' }], { region: 'US', now });
  assert.equal(await p.available(), true);

  let w = emptyWallet();
  const first = await p.show({ placement: 'coins' });
  assert.equal(first.completed, true);
  assert.ok(validReceipt(first.receipt));
  assert.equal(adOpKey(first.receipt), 'ad:rec-1');
  w = earnFromAd(w, { adId: first.receipt.adId, region: first.receipt.region, at: first.receipt.at }, cfg).wallet;
  assert.equal(w.coins, 50);

  assert.equal((await p.show({ placement: 'practice-entry' })).reason, 'skipped');
  assert.equal((await p.show({ placement: 'practice-entry' })).reason, 'network_error');
  assert.equal(w.coins, 50, 'a skip and a failure pay nothing');

  const second = await p.show({ placement: 'coins' });
  assert.equal(await p.verify(second.receipt), true);
  w = earnFromAd(w, { adId: second.receipt.adId, region: 'US', at: second.receipt.at }, cfg).wallet;
  assert.equal(w.coins, 100);

  const forged = await p.show({ placement: 'coins' });
  assert.equal(validReceipt(forged.receipt), false, 'placement is not a known placement');
  assert.equal(await p.verify({ adId: 'rec-99', placement: 'coins', at: T0, region: 'US' }), false, 'never issued');

  assert.deepEqual(p.shown, ['coins', 'practice-entry', 'practice-entry', 'coins', 'coins']);
  assert.equal((await p.show({ placement: 'coins' })).reason, 'unavailable', 'past the script');
});

test('a provider must implement the contract, and placements are a closed list', () => {
  assert.throws(() => assertProvider({ name: 'x' }), /missing: available, show/);
  assert.throws(() => assertProvider({ name: 'x', available() {}, show() {}, verify: 1 }), /verify must be a function/);
  assert.deepEqual([...PLACEMENTS], ['coins', 'practice-entry', 'duel-entry', 'continue']);
  assert.equal(validReceipt({ adId: 'a', placement: 'coins', at: 1, region: 'US' }), true);
  assert.equal(validReceipt({ adId: 'a', placement: 'coins', at: 0, region: 'US' }), false);
});
