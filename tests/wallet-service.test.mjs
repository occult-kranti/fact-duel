/**
 * The server wallet: the only way a web client mints a coin is a nonce this service issued, and the
 * ceiling on a lying client is one payout per nonce. These tests attack that ceiling the ways a
 * client would — replay, a forged nonce, someone else's nonce, too fast, too late, past the cap —
 * and check that the two constraints (redemption PK, ledger tx PK) hold with the D1 harness whose
 * batch semantics are pinned in `tests/d1-batch-semantics.test.mjs`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalD1 } from './d1-local.mjs';
import { D1WalletStore, issueAdNonce, redeemAdNonce, readWallet, cleanupWallet, WALLET } from '../lib/server/wallet-service.mjs';
import { handleWalletRequest } from '../lib/server/http-wallet.mjs';
import { DEFAULT_CONFIG } from '../lib/economy/economy.mjs';
import { MIN_AD_MS, NONCE_TTL_MS } from '../lib/ads/nonce.mjs';
import { reconcile } from '../lib/server/reconcile.mjs';

const T0 = Date.parse('2026-09-16T10:00:00Z');
const ME = 'anon_0123456789abcdef0123456789abcdef';
const YOU = 'anon_fedcba9876543210fedcba9876543210';

const opened = (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  return { db, store: new D1WalletStore(db) };
};
let n = 0;
const newId = () => `nonce_${String(++n).padStart(28, '0')}`;

const watch = async (store, { who = ME, at = T0, region = 'US', placement = 'coins' } = {}) => {
  const issued = await issueAdNonce({ store, principalId: who, placement, region, now: at, newId });
  assert.equal(issued.ok, true, JSON.stringify(issued));
  return issued;
};

test('issue then redeem pays the region reward once, as a ledger grant the reconciler accepts', async (t) => {
  const { store } = opened(t);
  const issued = await watch(store);
  assert.equal(issued.reward, DEFAULT_CONFIG.adReward.US);
  assert.equal(issued.nonce.minMs, MIN_AD_MS);
  assert.equal(issued.nonce.expiresAt, T0 + NONCE_TTL_MS);

  const paid = await redeemAdNonce({ store, principalId: ME, nonceId: issued.nonce.id, placement: 'coins', now: T0 + 20_000 });
  assert.equal(paid.ok, true, JSON.stringify(paid));
  assert.equal(paid.granted, 50);
  assert.equal(paid.coins, 50);
  assert.equal(paid.replayed, false);

  const wallet = await readWallet({ store, principalId: ME, now: T0 + 21_000 });
  assert.equal(wallet.coins, 50);
  assert.equal(wallet.adsToday, 1);
  assert.equal(wallet.adDailyCap, DEFAULT_CONFIG.adDailyCap);

  const tx = await store.ledger.transaction((await store.ledger.entriesFor('play:user:' + ME))[0].txId);
  assert.equal(tx.kind, 'grant');
  assert.match(tx.memo, /rewarded ad · coins · US/);
  assert.equal((await reconcile(store.ledger)).ok, true);
});

test('a replay of the same completion is answered, not paid again', async (t) => {
  const { store } = opened(t);
  const issued = await watch(store);
  const args = { store, principalId: ME, nonceId: issued.nonce.id, placement: 'coins', now: T0 + 20_000 };
  await redeemAdNonce(args);
  for (let i = 0; i < 5; i++) {
    const again = await redeemAdNonce({ ...args, now: T0 + 25_000 + i });
    assert.equal(again.ok, true, 'the retry gets the answer it missed');
    assert.equal(again.granted, 0);
    assert.equal(again.replayed, true);
    assert.equal(again.coins, 50);
  }
  assert.equal((await readWallet({ store, principalId: ME, now: T0 + 30_000 })).adsToday, 1);
});

test('a redemption recorded but never paid is paid by the retry — the crash between the two constraints heals', async (t) => {
  const { store } = opened(t);
  const issued = await watch(store);
  // Simulate the crash: the redemption row lands, the grant never does.
  await store.recordRedemption({ nonceId: issued.nonce.id, principalId: ME, dayKey: '2026-09-16', amount: 50, at: T0 + 20_000 });
  assert.equal((await readWallet({ store, principalId: ME, now: T0 + 20_000 })).coins, 0);
  const retry = await redeemAdNonce({ store, principalId: ME, nonceId: issued.nonce.id, placement: 'coins', now: T0 + 21_000 });
  assert.equal(retry.ok, true);
  assert.equal(retry.granted, 50, 'the retry completes the payout');
  assert.equal(retry.coins, 50);
});

test('the pure window rules hold on the server: too soon, expired, wrong principal, wrong placement, unknown', async (t) => {
  const { store } = opened(t);
  const issued = await watch(store);
  const id = issued.nonce.id;
  const go = (over) => redeemAdNonce({ store, principalId: ME, nonceId: id, placement: 'coins', now: T0 + 20_000, ...over });
  assert.equal((await go({ now: T0 + 1_000 })).reason, 'too_soon');
  assert.equal((await go({ now: T0 + NONCE_TTL_MS + 1 })).reason, 'expired');
  assert.equal((await go({ principalId: YOU })).reason, 'wrong_principal');
  assert.equal((await go({ placement: 'practice-entry' })).reason, 'wrong_placement');
  assert.equal((await go({ nonceId: 'nonce_forged_0000000000000000000' })).reason, 'unknown_nonce');
  assert.equal((await readWallet({ store, principalId: ME, now: T0 + 20_000 })).coins, 0, 'none of those paid');
  assert.equal((await go({})).ok, true, 'and the honest completion still does');
});

test('the daily cap and the cooldown are enforced at issue time, per local day', async (t) => {
  const { store } = opened(t);
  const cap = DEFAULT_CONFIG.adDailyCap;
  let at = T0;
  for (let i = 0; i < cap; i++) {
    const issued = await watch(store, { at });
    const paid = await redeemAdNonce({ store, principalId: ME, nonceId: issued.nonce.id, placement: 'coins', now: at + 30_000 });
    assert.equal(paid.ok, true, `ad ${i}: ${JSON.stringify(paid)}`);
    at += DEFAULT_CONFIG.adCooldownMs + 30_000;
  }
  const over = await issueAdNonce({ store, principalId: ME, placement: 'coins', region: 'US', now: at, newId });
  assert.equal(over.reason, 'daily_cap');
  assert.equal(over.adsToday, cap);
  // A new local day opens the cap again; the cooldown still applies to a redemption a second ago.
  const nextDay = Date.parse('2026-09-17T00:00:01Z');
  const fresh = await watch(store, { at: nextDay });
  await redeemAdNonce({ store, principalId: ME, nonceId: fresh.nonce.id, placement: 'coins', now: nextDay + 10_000 });
  const soon = await issueAdNonce({ store, principalId: ME, placement: 'coins', region: 'US', now: nextDay + 11_000, newId });
  assert.equal(soon.reason, 'cooldown');
  assert.equal(soon.retryAt, nextDay + 10_000 + DEFAULT_CONFIG.adCooldownMs);
  assert.equal((await readWallet({ store, principalId: ME, now: nextDay + 11_000 })).coins, cap * 50 + 50);
});

test('the reward is bound at issue time: a redeem cannot change the region, and an unknown region pays the floor', async (t) => {
  const { store } = opened(t);
  const de = await watch(store, { region: 'DE' });
  const paid = await redeemAdNonce({ store, principalId: ME, nonceId: de.nonce.id, placement: 'coins', now: T0 + 20_000 });
  assert.equal(paid.granted, DEFAULT_CONFIG.adReward.DE);
  const nowhere = await issueAdNonce({ store, principalId: YOU, placement: 'coins', region: 'ZZ', now: T0, newId });
  assert.equal(nowhere.region, 'ZZ');
  assert.equal(nowhere.reward, DEFAULT_CONFIG.adReward['*']);
  const garbage = await issueAdNonce({ store, principalId: YOU, placement: 'coins', region: 'us-ny', now: T0 + 60_000, newId });
  assert.equal(garbage.region, '*');
});

test('two guests cannot see or spend each other, and a bad guest id or placement is refused', async (t) => {
  const { store } = opened(t);
  const mine = await watch(store);
  await redeemAdNonce({ store, principalId: ME, nonceId: mine.nonce.id, placement: 'coins', now: T0 + 20_000 });
  assert.equal((await readWallet({ store, principalId: YOU, now: T0 })).coins, 0);
  await assert.rejects(readWallet({ store, principalId: 'root', now: T0 }), /guest id/);
  await assert.rejects(issueAdNonce({ store, principalId: ME, placement: 'jackpot-spin', now: T0, newId }), /placement/);
  await assert.rejects(issueAdNonce({ store: null, principalId: ME, placement: 'coins', now: T0 }), /unavailable/);
});

test('the sweep drops stale nonces but keeps every redemption', async (t) => {
  const { store, db } = opened(t);
  const a = await watch(store, { at: T0 });
  await redeemAdNonce({ store, principalId: ME, nonceId: a.nonce.id, placement: 'coins', now: T0 + 20_000 });
  await watch(store, { who: YOU, at: T0 + 1000 });
  await cleanupWallet({ store, now: T0 + NONCE_TTL_MS + WALLET.nonceRetentionMs + 5_000 });
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM ad_nonces').first()).n, 0);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM ad_redemptions').first()).n, 1);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM principals').first()).n, 2);
});

test('the route: region comes from the edge, the body cannot name it, and the envelope matches the other doors', async (t) => {
  const { db } = opened(t);
  const env = { DB: db };
  const call = (body, extra = {}) =>
    handleWalletRequest(
      new Request('https://duel.example/api/wallet', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...extra },
        body: JSON.stringify(body),
      }),
      env,
    );
  const issued = await (await call({ action: 'issue-nonce', principalId: ME, placement: 'coins', region: 'US' }, { 'cf-ipcountry': 'IN' })).json();
  assert.equal(issued.ok, true);
  assert.equal(issued.region, 'IN', 'the edge wins over the body');
  assert.equal(issued.reward, DEFAULT_CONFIG.adReward.IN);

  const early = await (await call({ action: 'redeem-nonce', principalId: ME, placement: 'coins', nonceId: issued.nonce.id })).json();
  assert.equal(early.ok, false);
  assert.equal(early.reason, 'too_soon');

  const wallet = await (await call({ action: 'wallet', principalId: ME })).json();
  assert.equal(wallet.coins, 0);
  assert.equal(wallet.adsToday, 0);

  const bad = await call({ action: 'wallet', principalId: 'nope' });
  assert.equal(bad.status, 400);
  assert.deepEqual(Object.keys(await bad.json()).sort(), ['code', 'error']);
  assert.equal((await call({ action: 'wallet', principalId: ME }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await call({ action: 'nope', principalId: ME })).status, 400);
  const noDb = await handleWalletRequest(
    new Request('https://duel.example/api/wallet', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"action":"wallet"}' }),
    {},
  );
  assert.equal(noDb.status, 503);
  const notJson = await handleWalletRequest(new Request('https://duel.example/api/wallet', { method: 'POST', body: 'x' }), env);
  assert.equal(notJson.status, 415);
  const huge = await handleWalletRequest(
    new Request('https://duel.example/api/wallet', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pad: 'x'.repeat(5000) }) }),
    env,
  );
  assert.equal(huge.status, 413);
});

test('fifteen concurrent redeems of five nonces pay exactly five times', async (t) => {
  const { store } = opened(t);
  const nonces = [];
  let at = T0;
  for (let i = 0; i < 5; i++) {
    nonces.push(await watch(store, { at }));
    await redeemAdNonce({ store, principalId: ME, nonceId: nonces[i].nonce.id, placement: 'coins', now: at + MIN_AD_MS });
    // Issue spacing respects the cooldown, so all five nonces are legitimately issued.
    at += MIN_AD_MS + DEFAULT_CONFIG.adCooldownMs + 1;
  }
  // Now hammer every nonce three times concurrently.
  const results = await Promise.all(
    nonces.flatMap((n) => [0, 1, 2].map((k) => redeemAdNonce({ store, principalId: ME, nonceId: n.nonce.id, placement: 'coins', now: at + k }))),
  );
  assert.ok(results.every((r) => r.ok));
  assert.equal(results.reduce((s, r) => s + r.granted, 0), 0, 'every one was already paid');
  assert.equal((await readWallet({ store, principalId: ME, now: at })).coins, 250);
  assert.equal((await reconcile(store.ledger)).ok, true);
});

test('a session cookie names the wallet owner and beats a guest header or a body id', async (t) => {
  const { db, store } = opened(t);
  const { issueSession, sessionCookie } = await import('../lib/server/auth-service.mjs');
  const issued = await watch(store, { who: YOU });
  await redeemAdNonce({ store, principalId: YOU, nonceId: issued.nonce.id, placement: 'coins', now: T0 + 20_000 });
  const session = await issueSession(db, { principalId: YOU, now: T0 });
  const cookie = sessionCookie(session.sessionId, { secure: false }).split(';')[0];
  // The ingress checks the session against the real clock; hold it inside the session's life.
  t.mock.method(Date, 'now', () => T0 + 21_000);
  const res = await handleWalletRequest(
    new Request('https://duel.example/api/wallet', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, 'x-fd-principal': ME },
      body: JSON.stringify({ action: 'wallet', principalId: ME }),
    }),
    { DB: db },
  );
  const wallet = await res.json();
  assert.equal(wallet.principalId, YOU, 'the signed-in principal, not the guest header or the body');
  assert.equal(wallet.coins, 50);
});

test('the daily grant pays once per local day, never above the soft cap', async (t) => {
  const { store } = opened(t);
  const { grantDaily } = await import('../lib/server/wallet-service.mjs');
  const first = await grantDaily({ store, principalId: ME, now: T0 });
  assert.equal(first.ok, true);
  assert.equal(first.granted, DEFAULT_CONFIG.daily);
  assert.equal(first.coins, DEFAULT_CONFIG.daily);
  const again = await grantDaily({ store, principalId: ME, now: T0 + 3_600_000 });
  assert.equal(again.reason, 'already_claimed');
  assert.equal(again.coins, DEFAULT_CONFIG.daily);
  const tomorrow = await grantDaily({ store, principalId: ME, now: Date.parse('2026-09-17T00:00:01Z') });
  assert.equal(tomorrow.ok, true);
  // Above the soft cap nothing is paid.
  for (let i = 0; i < 200; i++) await store.ledger.post((await import('../lib/ledger/intents.mjs')).grant({ principalId: YOU, amount: 100, opKey: `grant:seed:${YOU}:${i}`, at: T0 + i }));
  assert.equal((await grantDaily({ store, principalId: YOU, now: T0 + 1_000 })).reason, 'soft_cap');
});

test('the floor tops up to the floor once per window, and the drill entry burns after lifting it', async (t) => {
  const { store } = opened(t);
  const { applyFloor, enterPractice } = await import('../lib/server/wallet-service.mjs');
  const lifted = await applyFloor({ store, principalId: ME, now: T0 });
  assert.equal(lifted.ok, true);
  assert.equal(lifted.coins, DEFAULT_CONFIG.floor.coins);
  assert.equal(lifted.nextAt, (Math.floor(T0 / DEFAULT_CONFIG.floor.everyMs) + 1) * DEFAULT_CONFIG.floor.everyMs);
  assert.equal((await applyFloor({ store, principalId: ME, now: T0 + 1 })).reason, 'above_floor');
  const drill = await enterPractice({ store, principalId: ME, sessionId: 'sess_0001', now: T0 + 2 });
  assert.equal(drill.ok, true);
  assert.equal(drill.spent, DEFAULT_CONFIG.practiceEntry);
  assert.equal(drill.coins, DEFAULT_CONFIG.floor.coins - DEFAULT_CONFIG.practiceEntry);
  const replay = await enterPractice({ store, principalId: ME, sessionId: 'sess_0001', now: T0 + 3 });
  assert.equal(replay.spent, 0);
  assert.equal(replay.replayed, true);
  await enterPractice({ store, principalId: ME, sessionId: 'sess_0002', now: T0 + 4 });
  // Now at 0 inside the same floor window: the floor is on cooldown, so the third drill is refused.
  const broke = await enterPractice({ store, principalId: ME, sessionId: 'sess_0003', now: T0 + 5 });
  assert.equal(broke.reason, 'insufficient');
  assert.equal(broke.coins, 0);
  // Next window: the floor lifts again and the drill goes through.
  const later = T0 + DEFAULT_CONFIG.floor.everyMs;
  assert.equal((await enterPractice({ store, principalId: ME, sessionId: 'sess_0004', now: later })).ok, true);
  assert.equal((await reconcile(store.ledger)).ok, true);
});

test('the free recap is once per local day and moves no coins; the wallet reply prices the ad', async (t) => {
  const { store, db } = opened(t);
  const { enterRecap } = await import('../lib/server/wallet-service.mjs');
  assert.equal((await enterRecap({ store, principalId: ME, now: T0 })).ok, true);
  assert.equal((await enterRecap({ store, principalId: ME, now: T0 + 60_000 })).reason, 'recap_played');
  assert.equal((await enterRecap({ store, principalId: ME, now: Date.parse('2026-09-17T00:00:01Z') })).ok, true);
  assert.equal((await readWallet({ store, principalId: ME, now: T0 })).coins, 0);
  const priced = await readWallet({ store, principalId: ME, region: 'IN', now: T0 });
  assert.equal(priced.region, 'IN');
  assert.equal(priced.perAd, DEFAULT_CONFIG.adReward.IN);
  // The ingress reads the real clock; hold it on the same UTC day as the last recap above.
  t.mock.method(Date, 'now', () => Date.parse('2026-09-17T00:00:02Z'));
  const res = await handleWalletRequest(
    new Request('https://duel.example/api/wallet', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-ipcountry': 'DE' }, body: JSON.stringify({ action: 'enter-recap', principalId: ME }) }),
    { DB: db },
  );
  assert.equal((await res.json()).reason, 'recap_played');
});
