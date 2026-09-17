/**
 * The wallet client (lib/wallet-client.ts) against a scripted fetch.
 *
 * What matters: a server wallet is recognised only by a 200 with the right shape, and everything
 * else — a 404 page, a 503, a network error, junk — means device mode; the guest principal is
 * minted once in the server's shape and presented on every call, in the header and the body,
 * with credentials; the issue and redeem replies pass through in the service's own words, a
 * replay is success with nothing granted; and a redeem that cannot reach the server is retried
 * with a backoff, left pending on disk when every try fails, and settled on the next mount. The
 * static twin (lib/wallet-client-static.ts) never answers the probe.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { serverWalletView } from '../lib/wallet-store.mjs';
import { emptyWallet, readWallet } from '../lib/economy/economy.mjs';

const {
  createWalletClient,
  principalId,
  readPendingNonce,
  PRINCIPAL_SHAPE,
  PRINCIPAL_KEY,
  PENDING_NONCE_KEY,
  GUEST_HEADER,
  WALLET_ENDPOINT,
  REDEEM_ATTEMPTS,
  REDEEM_BACKOFF_MS,
} = await import('../lib/wallet-client.ts');
const staticClient = await import('../lib/wallet-client-static.ts');

const NONCE = 'a'.repeat(32);
const T0 = Date.parse('2026-09-16T10:00:00Z');

/** A Map-backed Storage. */
const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    map: m,
  };
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const html = (status = 404) => new Response('<!doctype html><h1>Not found</h1>', { status, headers: { 'content-type': 'text/html' } });

/**
 * A fetch that answers from a script keyed by action; each entry is a Response, an Error to throw,
 * or a function of the parsed body. Every call is recorded with its url, init and parsed body.
 */
function fakeFetch(script) {
  const calls = [];
  const fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, init, body });
    const list = script[body.action] ?? [];
    const next = list.length > 1 ? list.shift() : list[0];
    if (next === undefined) return html(404);
    const out = typeof next === 'function' ? next(body) : next;
    if (out instanceof Error) throw out;
    return out;
  };
  return { fetch, calls };
}

const client = (script, storage = memory(), extra = {}) => {
  const { fetch, calls } = fakeFetch(script);
  const sleeps = [];
  const c = createWalletClient({
    fetch,
    storage,
    tzOffsetMinutes: -330,
    now: () => T0,
    sleep: async (ms) => void sleeps.push(ms),
    ...extra,
  });
  return { c, calls, sleeps, storage };
};

/* ------------------------------------------------------------------ the principal */

test('the guest principal is minted once, in the server’s shape, and read back thereafter', () => {
  const storage = memory();
  const first = principalId(storage);
  assert.match(first, /^anon_[0-9a-f]{32}$/);
  assert.match(first, PRINCIPAL_SHAPE, 'what wallet-service.mjs accepts');
  assert.equal(principalId(storage), first, 'stable across calls');
  assert.equal(storage.getItem(PRINCIPAL_KEY), first, 'kept under the shared key');
  assert.equal(createWalletClient({ storage, fetch: async () => html() }).principalId, first, 'and the client uses it');

  storage.setItem(PRINCIPAL_KEY, 'not a principal');
  const replaced = principalId(storage);
  assert.match(replaced, PRINCIPAL_SHAPE, 'junk under the key is replaced, never sent');
  assert.equal(storage.getItem(PRINCIPAL_KEY), replaced);

  const a = principalId(null),
    b = principalId(null);
  assert.equal(a, b, 'without storage, one id per page load');
});

/* ------------------------------------------------------------------ the probe */

test('probe: a 200 with the wallet shape means server mode, and the call carries the principal twice', async () => {
  const { c, calls } = client({ wallet: [json({ principalId: 'x', coins: 120, adsToday: 3, adDailyCap: 20, dayKey: '2026-09-16' })] });
  const wallet = await c.probe();
  assert.deepEqual(wallet, { principalId: 'x', coins: 120, adsToday: 3, adDailyCap: 20, dayKey: '2026-09-16' });
  assert.ok(Object.isFrozen(wallet));

  assert.equal(calls.length, 1);
  const [{ url, init, body }] = calls;
  assert.equal(url, WALLET_ENDPOINT);
  assert.equal(init.method, 'POST');
  assert.equal(init.credentials, 'include', 'a session cookie, when there is one, wins server-side');
  assert.equal(init.headers[GUEST_HEADER], c.principalId, 'the header resolvePrincipal reads');
  assert.equal(init.headers['content-type'], 'application/json');
  assert.equal(body.principalId, c.principalId, 'and the body the service validates');
  assert.equal(body.action, 'wallet');
  assert.equal(body.tzOffsetMinutes, -330);
});

test('probe: a 404 page, a 503, a network error or a malformed body all mean device mode', async () => {
  assert.equal(await client({ wallet: [html(404)] }).c.probe(), null, 'static host');
  assert.equal(await client({ wallet: [json({ error: 'x', code: 'service_unavailable' }, 503)] }).c.probe(), null, 'no database');
  assert.equal(await client({ wallet: [new TypeError('fetch failed')] }).c.probe(), null, 'offline');
  assert.equal(await client({ wallet: [json({ principalId: 'x', coins: -1, adsToday: 0 })] }).c.probe(), null, 'bad coins');
  assert.equal(await client({ wallet: [json({ coins: 5, adsToday: 0 })] }).c.probe(), null, 'no principal');
  assert.equal(await client({ wallet: [json('nope')] }).c.probe(), null, 'not an object');
  assert.equal(await client({ wallet: [new Response('not json', { status: 200 })] }).c.probe(), null, 'not json');
});

/* ------------------------------------------------------------------ issue */

test('issue-nonce: a refusal comes back in the service’s words; a grant carries the nonce and the price', async () => {
  const refused = client({ 'issue-nonce': [json({ ok: false, reason: 'daily_cap', adsToday: 20, adDailyCap: 20 })] });
  assert.deepEqual(await refused.c.issueNonce('coins'), { ok: false, reason: 'daily_cap', adsToday: 20, adDailyCap: 20 });
  assert.equal(refused.calls[0].body.placement, 'coins');
  assert.equal(refused.calls[0].body.principalId, refused.c.principalId);

  const cooled = client({ 'issue-nonce': [json({ ok: false, reason: 'cooldown', retryAt: T0 + 30_000 })] });
  assert.deepEqual(await cooled.c.issueNonce('coins'), { ok: false, reason: 'cooldown', retryAt: T0 + 30_000 });

  const issued = client({
    'issue-nonce': [json({ ok: true, nonce: { id: NONCE, placement: 'coins', expiresAt: T0 + 180_000, minMs: 5000 }, reward: 35, region: 'GB', ttlMs: 180_000 })],
  });
  const reply = await issued.c.issueNonce('coins');
  assert.equal(reply.ok, true);
  assert.equal(reply.nonce.id, NONCE);
  assert.equal(reply.reward, 35);
  assert.equal(reply.region, 'GB');

  assert.deepEqual(await client({ 'issue-nonce': [new Error('offline')] }).c.issueNonce('coins'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await client({ 'issue-nonce': [json({ error: 'x', code: 'invalid_request' }, 400)] }).c.issueNonce('coins'), {
    ok: false,
    reason: 'invalid_request',
  });
  assert.deepEqual(await client({ 'issue-nonce': [json({ ok: true, nonce: { id: 'short' }, reward: 1 })] }).c.issueNonce('coins'), {
    ok: false,
    reason: 'failed',
  });
});

/* ------------------------------------------------------------------ redeem */

test('redeem-nonce: success and replay pass through, and neither leaves a nonce pending', async () => {
  const paid = client({ 'redeem-nonce': [json({ ok: true, granted: 35, replayed: false, adId: `nonce:${NONCE}`, coins: 155 })] });
  assert.deepEqual(await paid.c.redeemNonce(NONCE, 'coins'), { ok: true, granted: 35, replayed: false, adId: `nonce:${NONCE}`, coins: 155 });
  assert.equal(paid.calls[0].body.nonceId, NONCE);
  assert.equal(paid.calls[0].body.placement, 'coins');
  assert.equal(paid.c.pending(), null, 'cleared once the server answered');
  assert.equal(paid.storage.getItem(PENDING_NONCE_KEY), null);
  assert.deepEqual(paid.sleeps, [], 'no backoff on a first-try success');

  const replay = client({ 'redeem-nonce': [json({ ok: true, granted: 0, replayed: true, adId: `nonce:${NONCE}`, coins: 155 })] });
  const again = await replay.c.redeemNonce(NONCE, 'coins');
  assert.equal(again.ok, true, 'a replay is success');
  assert.equal(again.granted, 0, 'with nothing new granted');
  assert.equal(again.replayed, true);

  const refused = client({ 'redeem-nonce': [json({ ok: false, reason: 'too_soon' })] });
  assert.deepEqual(await refused.c.redeemNonce(NONCE, 'coins'), { ok: false, reason: 'too_soon' });
  assert.equal(refused.c.pending(), null, 'a definitive refusal is not retried');

  const bad = client({ 'redeem-nonce': [json({ error: 'x', code: 'invalid_request' }, 400)] });
  assert.deepEqual(await bad.c.redeemNonce(NONCE, 'coins'), { ok: false, reason: 'invalid_request' });
  assert.equal(bad.c.pending(), null);
});

test('redeem-nonce: the server out of reach is retried with a backoff and paid on the try that lands', async () => {
  const flaky = client({
    'redeem-nonce': [new TypeError('fetch failed'), json({ error: 'x', code: 'service_unavailable' }, 503), json({ ok: true, granted: 35, replayed: false, adId: 'a', coins: 35 })],
  });
  const reply = await flaky.c.redeemNonce(NONCE, 'coins');
  assert.equal(reply.ok, true);
  assert.equal(reply.granted, 35);
  assert.equal(flaky.calls.length, 3);
  assert.deepEqual(flaky.sleeps, [...REDEEM_BACKOFF_MS]);
  assert.equal(flaky.c.pending(), null);
});

test('redeem-nonce: when every try fails the reward is pending, on disk, and settles on the next mount', async () => {
  const storage = memory();
  const down = client({ 'redeem-nonce': [new TypeError('fetch failed')] }, storage);
  assert.deepEqual(await down.c.redeemNonce(NONCE, 'practice-entry'), { ok: false, reason: 'pending' });
  assert.equal(down.calls.length, REDEEM_ATTEMPTS);
  assert.equal(down.sleeps.length, REDEEM_ATTEMPTS - 1);
  assert.deepEqual(down.c.pending(), { nonceId: NONCE, placement: 'practice-entry', at: T0 });
  assert.deepEqual(readPendingNonce(storage.getItem(PENDING_NONCE_KEY)), { nonceId: NONCE, placement: 'practice-entry', at: T0 });

  // The next visit: same storage, a server that answers. The pending nonce is redeemed as issued.
  const up = client({ 'redeem-nonce': [json({ ok: true, granted: 0, replayed: true, adId: 'a', coins: 90 })] }, storage);
  assert.deepEqual(up.c.pending(), { nonceId: NONCE, placement: 'practice-entry', at: T0 }, 'read from the shared storage');
  const settled = await up.c.settlePending();
  assert.equal(settled.ok, true);
  assert.equal(settled.coins, 90);
  assert.equal(up.calls[0].body.nonceId, NONCE);
  assert.equal(up.calls[0].body.placement, 'practice-entry');
  assert.equal(up.c.pending(), null);
  assert.equal(await up.c.settlePending(), null, 'nothing left to settle');

  // A nonce that died while the connection was down is dropped on the server’s word, not kept forever.
  const dead = client({ 'redeem-nonce': [new TypeError('fetch failed')] }, storage);
  await dead.c.redeemNonce(NONCE, 'coins');
  const expired = client({ 'redeem-nonce': [json({ ok: false, reason: 'expired' })] }, storage);
  assert.deepEqual(await expired.c.settlePending(), { ok: false, reason: 'expired' });
  assert.equal(expired.c.pending(), null);
});

test('the pending record tolerates junk', () => {
  assert.equal(readPendingNonce(null), null);
  assert.equal(readPendingNonce(''), null);
  assert.equal(readPendingNonce('{'), null);
  assert.equal(readPendingNonce(JSON.stringify({ nonceId: 'short', placement: 'coins' })), null);
  assert.equal(readPendingNonce(JSON.stringify({ nonceId: NONCE, placement: 'popup' })), null);
  assert.deepEqual(readPendingNonce(JSON.stringify({ nonceId: NONCE, placement: 'coins', at: 'x' })), { nonceId: NONCE, placement: 'coins', at: 0 });
});

/* ------------------------------------------------------------------ the static twin */

test('the static build’s client never finds a server, and still mints the same principal', async () => {
  const storage = memory();
  const c = staticClient.createWalletClient({ storage });
  assert.equal(c.serverCapable, false);
  assert.equal(await c.probe(), null, 'device mode, always');
  assert.equal(await c.readWallet(), null);
  assert.deepEqual(await c.issueNonce('coins'), { ok: false, reason: 'offline_build' });
  assert.deepEqual(await c.redeemNonce(NONCE, 'coins'), { ok: false, reason: 'offline_build' });
  assert.equal(c.pending(), null);
  assert.equal(await c.settlePending(), null);
  assert.match(c.principalId, /^anon_[0-9a-f]{32}$/);
  assert.equal(storage.getItem(staticClient.PRINCIPAL_KEY), c.principalId);
  assert.equal(staticClient.PRINCIPAL_KEY, PRINCIPAL_KEY, 'one key, both builds');
  assert.equal(staticClient.GUEST_HEADER, GUEST_HEADER);
  assert.equal(principalId(storage), c.principalId, 'the server build reads the id the static build minted');
});

/* ------------------------------------------------------------------ the server view */

test('a server reply reads as the reducer’s wallet shape, clean by identity, with nothing device-side copied in', () => {
  const view = serverWalletView({ principalId: 'x', coins: 120, adsToday: 3, adDailyCap: 20, dayKey: '2026-09-16' });
  assert.equal(view.coins, 120);
  assert.equal(view.adsToday, 3);
  assert.equal(view.dayKey, '2026-09-16');
  assert.equal(view.lastDailyKey, '', 'no daily on the server yet');
  assert.equal(view.lastFloorAt, 0);
  assert.equal(view.recapKey, '');
  assert.equal(readWallet(view), view, 'already clean');
  assert.ok(Object.isFrozen(view));
  assert.deepEqual(serverWalletView(null), emptyWallet());
  assert.deepEqual(serverWalletView({ coins: 'x', adsToday: -1 }), emptyWallet());
});

test('the four grant-and-entry calls carry the guest header and read the reply shape; the network failing is "unavailable"', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    seen.push({ action: body.action, header: init.headers['x-fd-principal'], sessionId: body.sessionId });
    const reply = {
      'grant-daily': { ok: true, granted: 30, coins: 30 },
      'apply-floor': { ok: false, reason: 'above_floor', coins: 30, nextAt: 1_800_000_000_000 },
      'enter-practice': { ok: true, spent: 10, replayed: false, coins: 20 },
      'enter-recap': { ok: false, reason: 'recap_played', coins: 20 },
    }[body.action];
    return new Response(JSON.stringify(reply), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const client = createWalletClient({ fetch: fetchImpl, storage: memory(), sleep: async () => {} });
  assert.deepEqual(await client.grantDaily(), { ok: true, granted: 30, coins: 30 });
  assert.deepEqual(await client.applyFloor(), { ok: false, reason: 'above_floor', coins: 30, nextAt: 1_800_000_000_000 });
  assert.deepEqual(await client.enterPractice('sess0001'), { ok: true, spent: 10, coins: 20 });
  assert.deepEqual(await client.enterRecap(), { ok: false, reason: 'recap_played', coins: 20 });
  assert.deepEqual(seen.map((s) => s.action), ['grant-daily', 'apply-floor', 'enter-practice', 'enter-recap']);
  assert.ok(seen.every((s) => s.header === client.principalId));
  assert.equal(seen[2].sessionId, 'sess0001');
  const down = createWalletClient({ fetch: async () => { throw new Error('offline'); }, storage: memory(), sleep: async () => {} });
  assert.deepEqual(await down.grantDaily(), { ok: false, reason: 'unavailable', coins: -1 });
});
