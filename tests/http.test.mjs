import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDuelRequest } from '../lib/server/http-handler.mjs';
import { D1LedgerStore } from '../lib/server/ledger-store-d1.mjs';
import { grant } from '../lib/ledger/intents.mjs';
import { LocalD1 } from './d1-local.mjs';
const GUEST = 'anon_0123456789abcdef0123456789abcdef';
const request = (body, headers = {}) =>
  new Request('https://duel.example/api/duel', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('HTTP clock and catalogue need no database and are never cached', async () => {
  const response = await handleDuelRequest(request({ action: 'clock', now: 1 }), {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok((await response.json()).serverNow > 1_000_000); // User cannot inject a clock.
});
test('HTTP parser rejects cross-origin, oversized and non-JSON requests', async () => {
  assert.equal((await handleDuelRequest(request({}, { origin: 'https://other.example' }), {})).status, 403);
  assert.equal((await handleDuelRequest(request('x', { 'content-type': 'text/plain' }), {})).status, 415);
  assert.equal((await handleDuelRequest(request('{invalid'), {})).status, 400);
  assert.equal(
    (await handleDuelRequest(request(JSON.stringify({ data: 'a'.repeat(5000) })), {})).status,
    413,
  );
});
test('unavailable storage returns a recoverable error without a local payout', async () => {
  const r = await handleDuelRequest(request({ action: 'state' }), {});
  assert.equal(r.status, 503);
  assert.equal((await r.json()).code, 'service_unavailable');
});
test('HTTP create and idempotent retry return the same room without exposing secrets', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  // A room for coins is staked on the guest the `x-fd-principal` header names, so it needs coins.
  await new D1LedgerStore(db).post(grant({ principalId: GUEST, amount: 100, opKey: `grant:seed:${GUEST}`, at: 1 }));
  const body = {
    action: 'create',
    roomId: crypto.randomUUID().replaceAll('-', ''),
    token: 'a'.repeat(48),
    invite: 'b'.repeat(48),
    name: 'Player',
    config: { mode: 'quick', stake: 25, duration: 10 },
  };
  const guest = { 'x-fd-principal': GUEST };
  const first = await handleDuelRequest(request(body, { origin: 'https://duel.example', ...guest }), { DB: db });
  assert.equal(first.status, 200);
  const a = await first.json();
  const b = await (await handleDuelRequest(request(body, guest), { DB: db })).json();
  assert.equal(a.room.id, b.room.id);
  assert.equal(a.room.revision, b.room.revision);
  // One entry taken, however many times the create is replayed; the snapshot shows it.
  assert.deepEqual(b.room.balances, [75, 0]);
  assert.deepEqual(b.room.staked, [true, false]);
  const text = JSON.stringify(a);
  assert.ok(!text.includes('correctIndex'));
  assert.ok(!text.includes(body.token));
  assert.ok(!text.includes(body.invite));
  assert.ok(!text.includes(GUEST), 'a guest id is a bearer token and never leaves the server');
});
test('HTTP create for coins without any principal is refused; a free room is not', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const body = {
    action: 'create',
    roomId: crypto.randomUUID().replaceAll('-', ''),
    token: 'a'.repeat(48),
    invite: 'b'.repeat(48),
    name: 'Player',
    config: { mode: 'quick', stake: 25, duration: 10 },
  };
  const refused = await handleDuelRequest(request(body), { DB: db });
  assert.equal(refused.status, 401);
  assert.deepEqual(await refused.json(), {
    error: 'Play for coins needs a guest or signed-in profile.',
    code: 'sign_in_required',
  });
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM rooms').first()).n, 0, 'no room was written');
  const free = await handleDuelRequest(request({ ...body, config: { ...body.config, stake: 0 } }), { DB: db });
  assert.equal(free.status, 200);
});

test('connection calibration uses the primary database pipeline when available', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const before = db.metrics.statements;
  const response = await handleDuelRequest(request({ action: 'clock', now: 0 }), { DB: db });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.clockSource, 'primary-database');
  assert.equal(db.metrics.statements, before + 1);
  assert.ok(Math.abs(Date.now() - data.serverNow) < 1000);
});
