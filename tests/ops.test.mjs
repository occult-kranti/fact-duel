/**
 * The ops surface: the heartbeat that makes a stopped sweep visible, the attributed kill switch,
 * and the door they are both reached through.
 *
 * Two of these tests exist because of a specific way this can go wrong in production rather than in
 * review. `an unset OPS_TOKEN refuses every request` pins that a misconfigured deployment fails
 * CLOSED with a 503 and not open — the 401/503 distinction is the whole assertion, because a route
 * that can stop the money layer must never be reachable by accident. And `a failed sweep still
 * closes its row` pins that the evidence survives the failure: a sweep that throws and leaves no
 * trace is indistinguishable from a sweep that was never scheduled, which is exactly the state this
 * milestone exists to make impossible.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalD1 } from './d1-local.mjs';
import { D1OpsStore, OPS, getFlags, health, reconcileLedger, setFlag, sweep } from '../lib/server/ops-service.mjs';
import { D1LedgerStore } from '../lib/server/ledger-store-d1.mjs';
import { grant } from '../lib/ledger/intents.mjs';
import { constantTimeEqual, handleOpsRequest } from '../lib/server/http-ops.mjs';

const TOKEN = 'o'.repeat(48);

const request = (body, { token = TOKEN, ...headers } = {}) =>
  new Request('https://duel.example/api/ops', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const opened = (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  return db;
};

const runs = async (db) => (await db.prepare('SELECT * FROM ops_runs ORDER BY started_at').all()).results;

test('an empty sweep still writes one closed heartbeat row', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);
  const result = await sweep({ store, now: 1_700_000_000_000, clock: () => 1_700_000_000_040 });

  assert.equal(result.ok, true);
  assert.equal(result.kind, 'sweep');
  assert.equal(result.finishedAt - result.startedAt, 40);

  const rows = await runs(db);
  assert.equal(rows.length, 1, 'nothing to clean is still a run that happened');
  assert.equal(rows[0].id, result.runId);
  assert.equal(rows[0].kind, 'sweep');
  assert.equal(rows[0].started_at, 1_700_000_000_000);
  assert.equal(rows[0].finished_at, 1_700_000_000_040);
  assert.equal(rows[0].ok, 1);
  assert.ok(rows[0].detail.includes('rooms'));
});

test('a sweep removes expired rooms through the store the duel path already uses', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);
  await db
    .prepare('INSERT INTO rooms (id,revision,state,expires_at,created_at) VALUES (?,0,?,?,?)')
    .bind('stale', '{}', 500, 0)
    .run();
  await db
    .prepare('INSERT INTO rooms (id,revision,state,expires_at,created_at) VALUES (?,0,?,?,?)')
    .bind('live', '{}', 9_999_999_999_999, 0)
    .run();

  await sweep({ store, now: 1_000 });

  const left = (await db.prepare('SELECT id FROM rooms ORDER BY id').all()).results.map((r) => r.id);
  assert.deepEqual(left, ['live']);
});

test('a failed sweep still closes its row, marked not ok, and re-throws', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);
  store.cleanup = async () => {
    throw new Error('D1_ERROR: network');
  };

  await assert.rejects(sweep({ store, now: 10, clock: () => 20 }), /network/);

  const rows = await runs(db);
  assert.equal(rows.length, 1, 'exactly one row, even on failure');
  assert.equal(rows[0].ok, 0);
  assert.equal(rows[0].finished_at, 20, 'outcome is recorded, not left open');
  // The driver string is never copied into the row; only the class of failure.
  assert.equal(rows[0].detail, 'unexpected: Error');
  assert.ok(!rows[0].detail.includes('network'));
});

test('a flag write records who set it and a read sees it', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);

  const written = await setFlag({
    store,
    key: 'money.hard_stop',
    value: 'on',
    updatedBy: 'founder',
    now: 4_000,
  });
  assert.deepEqual(
    { ...written },
    { key: 'money.hard_stop', value: 'on', updatedBy: 'founder', updatedAt: 4_000 },
  );

  const flags = await getFlags({ store });
  assert.equal(flags.length, 1);
  assert.equal(flags[0].key, 'money.hard_stop');
  assert.equal(flags[0].value, 'on');
  assert.equal(flags[0].updatedBy, 'founder', 'attribution is the point of the table');
  assert.equal(flags[0].updatedAt, 4_000);

  // Clearing it is another attributed write, not a delete: the trail has to show who cleared it.
  await setFlag({
    store,
    key: 'money.hard_stop',
    value: 'off',
    updatedBy: 'second-pair-of-eyes',
    now: 9_000,
  });
  const after = await getFlags({ store });
  assert.equal(after.length, 1);
  assert.equal(after[0].value, 'off');
  assert.equal(after[0].updatedBy, 'second-pair-of-eyes');
});

test('a flag cannot be written anonymously or with junk', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);
  const base = { store, key: 'money.hard_stop', value: 'on', now: 1 };

  await assert.rejects(setFlag({ ...base }), /Name who is setting this flag/);
  await assert.rejects(setFlag({ ...base, updatedBy: '   ' }), /Name who is setting this flag/);
  await assert.rejects(setFlag({ ...base, key: 'Money Hard Stop', updatedBy: 'x' }), /Invalid flag key/);
  await assert.rejects(setFlag({ ...base, value: 'v'.repeat(400), updatedBy: 'x' }), /Invalid flag value/);
  assert.equal((await getFlags({ store })).length, 0, 'a rejected flag leaves no row');
});

test('health reports a never-run kind, a fresh run and a stale one', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);

  const cold = await health({ store, now: 0 });
  assert.equal(cold.healthy, false);
  assert.deepEqual(cold.runs.map((r) => r.kind), ['reconcile', 'sweep']);
  assert.ok(cold.runs.every((r) => r.everRan === false && r.stale === true), 'no heartbeat yet reads the same as no heartbeat any more');

  const at = 1_800_000_000_000;
  await reconcileLedger({ store, now: at, clock: () => at + 5 });
  await sweep({ store, now: at, clock: () => at + 5 });

  const fresh = await health({ store, now: at + OPS.staleAfterMs });
  assert.equal(fresh.runs[1].stale, false, 'exactly at the threshold is not yet stale');
  assert.equal(fresh.runs[1].ok, true);
  assert.equal(fresh.runs[1].ageMs, OPS.staleAfterMs);
  assert.equal(fresh.healthy, true);

  const late = await health({ store, now: at + OPS.staleAfterMs + 1 });
  assert.equal(late.runs[1].stale, true);
  assert.equal(late.healthy, false, 'one stale kind is enough to say the switch is dead');
});

test('health reports the newest run per kind, and a run that never closed as stuck', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);
  await sweep({ store, now: 1_000, clock: () => 1_100 });
  await store.openRun({ runId: 'open-one', kind: 'sweep', startedAt: 5_000 });
  await store.openRun({ runId: 'other', kind: 'reconcile', startedAt: 5_000 });
  await store.closeRun({ runId: 'other', finishedAt: 5_010, ok: 1, detail: 'nothing to reconcile' });

  const now = 5_000 + OPS.stuckAfterMs + 1;
  const state = await health({ store, now });
  const byKind = Object.fromEntries(state.runs.map((r) => [r.kind, r]));

  assert.deepEqual(Object.keys(byKind).sort(), ['reconcile', 'sweep']);
  assert.equal(byKind.sweep.runId, 'open-one', 'the newest row wins, not the newest closed one');
  assert.equal(byKind.sweep.finishedAt, null);
  assert.equal(byKind.sweep.stuck, true);
  assert.equal(byKind.reconcile.stuck, false);
  assert.equal(byKind.reconcile.detail, 'nothing to reconcile');
  assert.equal(state.healthy, false, 'a stuck run is not health');
});

test('the constant-time compare answers correctly for equal, same-length and different-length input', () => {
  assert.equal(constantTimeEqual('s3cret-token', 's3cret-token'), true);
  assert.equal(constantTimeEqual('s3cret-token', 's3cret-tokeN'), false, 'same length, different content');
  assert.equal(constantTimeEqual('s3cret-token', 's3cret-toke'), false, 'a prefix is not a match');
  assert.equal(constantTimeEqual('s3cret-token', 's3cret-token '), false, 'nor is a longer string');
  assert.equal(constantTimeEqual('', ''), true);
  assert.equal(constantTimeEqual('a', ''), false);
  // A non-string can never be a token, and must not throw on the way to being refused.
  assert.equal(constantTimeEqual(undefined, 'x'), false);
  assert.equal(constantTimeEqual('x', null), false);
});

test('an unset OPS_TOKEN refuses every request with 503, never 401, and never falls open', async (t) => {
  const db = opened(t);

  for (const env of [{ DB: db }, { DB: db, OPS_TOKEN: '' }, { DB: db, OPS_TOKEN: undefined }]) {
    const response = await handleOpsRequest(request({ action: 'sweep' }), env);
    assert.equal(response.status, 503, 'a misconfigured deployment is an outage, not an auth failure');
    assert.equal((await response.json()).code, 'service_unavailable');
  }
  // Even a caller who happens to present something is refused: there is nothing to be right about.
  const guess = await handleOpsRequest(request({ action: 'sweep' }, { token: 'anything' }), { DB: db });
  assert.equal(guess.status, 503);
  assert.equal((await runs(db)).length, 0, 'and no work was done');
});

test('the ops route rejects a missing and a wrong token with 401', async (t) => {
  const db = opened(t);
  const env = { DB: db, OPS_TOKEN: TOKEN };

  const missing = await handleOpsRequest(request({ action: 'sweep' }, { token: null }), env);
  assert.equal(missing.status, 401);
  assert.equal((await missing.json()).code, 'unauthorized');

  const wrong = await handleOpsRequest(request({ action: 'sweep' }, { token: 'o'.repeat(47) + 'x' }), env);
  assert.equal(wrong.status, 401);

  const wrongScheme = await handleOpsRequest(
    request({ action: 'sweep' }, { authorization: `Basic ${TOKEN}` }),
    env,
  );
  assert.equal(wrongScheme.status, 401);

  assert.equal((await runs(db)).length, 0, 'an unauthenticated request never reaches the database');
});

test('the ops route mirrors the duel ingress on origin, size, type and a missing database', async (t) => {
  const db = opened(t);
  const env = { DB: db, OPS_TOKEN: TOKEN };

  const cross = await handleOpsRequest(
    request({ action: 'sweep' }, { origin: 'https://other.example' }),
    env,
  );
  assert.equal(cross.status, 403);
  assert.equal(
    (await handleOpsRequest(request({ action: 'sweep' }, { 'content-type': 'text/plain' }), env)).status,
    415,
  );
  assert.equal((await handleOpsRequest(request('{invalid'), env)).status, 400);
  assert.equal(
    (await handleOpsRequest(request(JSON.stringify({ action: 'sweep', pad: 'a'.repeat(5000) })), env)).status,
    413,
  );
  const noDb = await handleOpsRequest(request({ action: 'sweep' }), { OPS_TOKEN: TOKEN });
  assert.equal(noDb.status, 503);
  assert.equal((await noDb.json()).code, 'service_unavailable');
});

test('an authenticated sweep runs, and the response never contains the token', async (t) => {
  const db = opened(t);
  const env = { DB: db, OPS_TOKEN: TOKEN };

  const response = await handleOpsRequest(
    request({ action: 'sweep' }, { origin: 'https://duel.example' }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.ok(!JSON.stringify(body).includes(TOKEN));
  assert.equal((await runs(db)).length, 1);

  const state = await (await handleOpsRequest(request({ action: 'health' }), env)).json();
  assert.equal(state.runs.find((r) => r.kind === 'sweep').ok, true);

  const unknown = await handleOpsRequest(request({ action: 'reboot-everything' }), env);
  assert.equal(unknown.status, 400);
});

test('the kill switch can be set and read back over the route, with the setter named', async (t) => {
  const db = opened(t);
  const env = { DB: db, OPS_TOKEN: TOKEN };

  const set = await handleOpsRequest(
    request({ action: 'set-flag', key: 'money.hard_stop', value: 'on', updatedBy: 'oncall' }),
    env,
  );
  assert.equal(set.status, 200);
  assert.equal((await set.json()).flag.updatedBy, 'oncall');

  const read = await (await handleOpsRequest(request({ action: 'flags' }), env)).json();
  assert.deepEqual(read.flags.map((f) => [f.key, f.value, f.updatedBy]), [
    ['money.hard_stop', 'on', 'oncall'],
  ]);

  const anonymous = await handleOpsRequest(
    request({ action: 'set-flag', key: 'money.hard_stop', value: 'off' }),
    env,
  );
  assert.equal(anonymous.status, 400, 'a kill switch nobody signed for is not a control');
});

test('a reconcile run records a balanced ledger as ok, and drift as a failed run that throws', async (t) => {
  const db = opened(t);
  const store = new D1OpsStore(db);
  const books = new D1LedgerStore(db);
  await books.post(grant({ principalId: 'p_a', amount: 50, opKey: 'grant:ad:p_a:n1', at: 1_800_000_000_000 }));

  const at = 1_800_000_000_500;
  const good = await reconcileLedger({ store, now: at, clock: () => at + 7 });
  assert.equal(good.ok, true);
  assert.equal(good.report.transactions, 1);
  assert.match(good.detail, /transactions: 1; issued: 50/);

  await db.prepare("UPDATE ledger_accounts SET balance = 9999 WHERE account_id = 'play:user:p_a'").run();
  await assert.rejects(reconcileLedger({ store, now: at + 10, clock: () => at + 20 }), /did not reconcile/);
  const rows = await runs(db);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].ok, 0, 'the drift is recorded, not hidden');
  assert.match(rows[1].detail, /FAILED: cached_balance play:user:p_a/);
  assert.equal((await health({ store, now: at + 20 })).runs.find((r) => r.kind === 'reconcile').ok, false);

  // Over the route: the failed reconcile is a non-2xx, so the workflow goes red.
  const env = { DB: db, OPS_TOKEN: TOKEN };
  const response = await handleOpsRequest(request({ action: 'reconcile' }), env);
  assert.equal(response.status, 500);
  assert.ok(!JSON.stringify(await response.json()).includes(TOKEN));
});
