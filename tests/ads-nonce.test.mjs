/**
 * The reward nonce. The property under test is the ceiling it puts on a lying client: one payout
 * per nonce, never before the ad could have finished, never after the nonce died, never for someone
 * else's nonce or a different placement, and never twice.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { issueNonce, redeemNonce, MIN_AD_MS, NONCE_TTL_MS, REDEEM_REASONS, nonceAdId } from '../lib/ads/nonce.mjs';
import { earnFromAd, emptyWallet } from '../lib/economy/economy.mjs';

const T0 = Date.parse('2026-09-16T10:00:00Z');
const ID = 'n_0123456789abcdefXYZ';
const issue = (over = {}) => issueNonce({ id: ID, principalId: 'p_a', placement: 'coins', at: T0, ...over });

test('issue binds who, where and when, and refuses garbage', () => {
  const n = issue();
  assert.equal(n.expiresAt, T0 + NONCE_TTL_MS);
  assert.equal(n.minMs, MIN_AD_MS);
  assert.equal(n.redeemedAt, null);
  assert.ok(Object.isFrozen(n));
  assert.throws(() => issueNonce({ id: 'short', principalId: 'p', placement: 'coins', at: T0 }), /16-128/);
  assert.throws(() => issueNonce({ id: ID, principalId: '', placement: 'coins', at: T0 }), /principal/);
  assert.throws(() => issueNonce({ id: ID, principalId: 'p', placement: '', at: T0 }), /placement/);
  assert.throws(() => issueNonce({ id: ID, principalId: 'p', placement: 'coins', at: 0 }), /timestamp/);
  assert.equal(issue({ minMs: 1 }).minMs, MIN_AD_MS, 'a provider cannot shorten the floor');
  assert.equal(issue({ minMs: 30_000 }).minMs, 30_000, 'but may lengthen it');
});

test('a completion is accepted only inside the window, once', () => {
  const n = issue();
  const good = redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 + 20_000 });
  assert.equal(good.ok, true);
  assert.equal(good.nonce.redeemedAt, T0 + 20_000);
  assert.ok(Object.isFrozen(good.nonce));

  assert.equal(redeemNonce(good.nonce, { principalId: 'p_a', placement: 'coins', at: T0 + 40_000 }).reason, 'already_redeemed');
  assert.equal(redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 + 1_000 }).reason, 'too_soon');
  assert.equal(redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 + MIN_AD_MS }).ok, true, 'exactly the floor is fine');
  assert.equal(redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 + NONCE_TTL_MS + 1 }).reason, 'expired');
  assert.equal(redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 - 1 }).reason, 'before_issue');
  assert.equal(redeemNonce(n, { principalId: 'p_b', placement: 'coins', at: T0 + 20_000 }).reason, 'wrong_principal');
  assert.equal(redeemNonce(n, { principalId: 'p_a', placement: 'practice-entry', at: T0 + 20_000 }).reason, 'wrong_placement');
  assert.equal(redeemNonce(null, { principalId: 'p_a', placement: 'coins', at: T0 }).reason, 'unknown_nonce');
  assert.equal(redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: 'now' }).reason, 'before_issue');
});

test('every refusal reason is in the fixed vocabulary', () => {
  const n = issue();
  const cases = [
    redeemNonce(undefined, { principalId: 'p_a', placement: 'coins', at: T0 }),
    redeemNonce(n, { principalId: 'x', placement: 'coins', at: T0 }),
    redeemNonce(n, { principalId: 'p_a', placement: 'x', at: T0 }),
    redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 + 1 }),
    redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 + NONCE_TTL_MS + 1 }),
  ];
  for (const c of cases) assert.ok(REDEEM_REASONS.includes(c.reason), c.reason);
});

test('a redeemed nonce feeds the economy as a completion id, and a replay is caught twice over', () => {
  const n = issue();
  const r = redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: T0 + 15_000 });
  const adId = nonceAdId(r.nonce);
  assert.equal(adId, `nonce:${ID}`);
  const paid = earnFromAd(emptyWallet(), { adId, region: 'US', at: T0 + 15_000 });
  assert.equal(paid.ok, true);
  // The nonce store refuses the second redemption; even if it did not, the wallet would.
  assert.equal(redeemNonce(r.nonce, { principalId: 'p_a', placement: 'coins', at: T0 + 16_000 }).reason, 'already_redeemed');
  assert.equal(earnFromAd(paid.wallet, { adId, region: 'US', at: T0 + 16_000 }).reason, 'already_paid');
});

test('the ceiling on a lying client is one payout per issued nonce', () => {
  // A client that fabricates completions can only redeem nonces the server chose to issue.
  let wallet = emptyWallet();
  const nonces = Array.from({ length: 3 }, (_, i) => issue({ id: `${ID}${i}`, at: T0 + i * 60_000 }));
  let paid = 0;
  for (const n of nonces) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = redeemNonce(n, { principalId: 'p_a', placement: 'coins', at: n.issuedAt + 20_000 + attempt });
      if (!r.ok) continue;
      const e = earnFromAd(wallet, { adId: nonceAdId(r.nonce), region: 'US', at: n.issuedAt + 20_000 });
      if (e.ok) {
        wallet = e.wallet;
        paid++;
      }
    }
  }
  assert.equal(paid, 3, 'fifteen attempts, three nonces, three payouts');
});
