import test from 'node:test';
import assert from 'node:assert/strict';
import { D1RoomStore, dispatch } from '../lib/server/duel-service.mjs';
import {
  QUEUE,
  enqueue,
  laneConfig,
  leave,
  poll,
  ratingWindow,
  readAssignment,
  readLane,
  readRatingHint,
} from '../lib/server/matchmaking.mjs';
import { handleQueueRequest } from '../lib/server/http-queue.mjs';
import { issueSession } from '../lib/server/auth-service.mjs';
import { LocalD1 } from './d1-local.mjs';
import { QUEUE_OFFER_PRACTICE_MS, QUEUE_POLL_MS, startSearch } from '../lib/queue-client.ts';

const pid = (letter) => `anon_${letter.repeat(24)}`;
const LANE = { sport: 'Football', mode: 'quick', stake: 0 };
const T0 = 1_700_000_000_000;

function fixture(t) {
  const db = new LocalD1(),
    store = new D1RoomStore(db);
  t.after(() => db.close());
  const deps = { store, actor: 'test' };
  const join = (principalId, lane = LANE, rating = 1000, now = T0) =>
    enqueue(db, { principalId, rating, now, ...lane });
  const beat = (principalId, ticket, now, name = principalId.slice(5, 6).toUpperCase()) =>
    poll(db, { principalId, ticket, name, now }, deps);
  const rows = async () =>
    (await db.prepare('SELECT principal_id, ticket, last_seen_at FROM match_queue ORDER BY principal_id').all()).results;
  return { db, store, deps, join, beat, rows };
}

test('pure helpers: the window widens with time and the rating hint is clamped', () => {
  assert.equal(ratingWindow(0), 100);
  assert.equal(ratingWindow(60_000), 150);
  assert.equal(ratingWindow(120_000), 200);
  assert.equal(ratingWindow(-5), 100);
  assert.equal(readRatingHint(undefined), 1000);
  assert.equal(readRatingHint('x'), 1000);
  assert.equal(readRatingHint(1234.6), 1235);
  assert.equal(readRatingHint(-50), 0);
  assert.equal(readRatingHint(99_999), 4000);
  assert.equal(readAssignment('abc'), null);
  assert.equal(readAssignment('paired:{"nope":1}'), null);
  assert.deepEqual(readLane({ sport: 'Cricket', mode: 'trilogy', stake: 25, extra: 1 }), {
    sport: 'Cricket',
    mode: 'trilogy',
    stake: 25,
  });
  assert.throws(() => readLane({ sport: 'Tennis', mode: 'quick', stake: 0 }), /Choose a sport/);
  assert.throws(() => readLane({ sport: 'Football', mode: 'marathon', stake: 0 }), /valid mode/);
  assert.throws(() => readLane({ sport: 'Football', mode: 'quick', stake: 7 }), /valid/);
  assert.equal(laneConfig(LANE).opponent, 'friend');
  assert.equal(laneConfig(LANE).topic, 'Football');
});

test('two principals in one lane pair exactly once and both land in the same room', async (t) => {
  const { store, join, beat, rows } = fixture(t);
  const a = await join(pid('a'));
  const b = await join(pid('b'));
  assert.equal(a.state, 'waiting');
  assert.equal(a.waiting, 1);
  assert.equal(b.waiting, 2);
  assert.match(a.ticket, /^[a-f0-9]{32}$/);
  // A polls first: it is the host and creates the room.
  const pairedA = await beat(pid('a'), a.ticket, T0 + 2000);
  assert.equal(pairedA.state, 'paired');
  assert.equal(pairedA.join.seat, 0);
  assert.equal(pairedA.join.roomId, pairedA.roomId);
  const hostRow = await store.read(pairedA.roomId);
  assert.ok(hostRow, 'the host created the room');
  const room = JSON.parse(hostRow.state);
  assert.equal(room.config.opponent, 'friend');
  assert.equal(room.config.topic, 'Football');
  assert.equal(room.players[0].name, 'A');
  assert.equal(room.players[1], null, 'nobody is seated for the guest by proxy');
  // B polls and finds its note; it joins with its own credentials.
  const pairedB = await beat(pid('b'), b.ticket, T0 + 3000);
  assert.equal(pairedB.state, 'paired');
  assert.equal(pairedB.roomId, pairedA.roomId);
  assert.equal(pairedB.join.seat, 1);
  assert.notEqual(pairedB.join.token, pairedA.join.token);
  assert.equal(pairedB.join.invite, pairedA.join.invite);
  const joined = await dispatch(
    store,
    { action: 'join', roomId: pairedB.roomId, token: pairedB.join.token, invite: pairedB.join.invite, name: 'B' },
    { now: T0 + 3000, actor: 'b' },
  );
  assert.equal(joined.room.seat, 1);
  assert.equal(joined.room.players.length, 2);
  // Idempotent: both get the same assignment back on a later poll, and nobody pairs again.
  const againA = await beat(pid('a'), a.ticket, T0 + 5000);
  const againB = await beat(pid('b'), b.ticket, T0 + 5000);
  assert.deepEqual(againA, pairedA);
  assert.deepEqual(againB, pairedB);
  assert.equal((await rows()).length, 2);
  for (const row of await rows()) assert.ok(readAssignment(row.ticket));
});

test('a third player stays waiting with the real count and cannot take a paired seat', async (t) => {
  const { join, beat } = fixture(t);
  const a = await join(pid('a'));
  const b = await join(pid('b'));
  const c = await join(pid('c'));
  assert.equal(c.waiting, 3);
  assert.equal((await beat(pid('a'), a.ticket, T0 + 1000)).state, 'paired');
  const wait = await beat(pid('c'), c.ticket, T0 + 2000);
  assert.equal(wait.state, 'waiting');
  assert.equal(wait.waiting, 1, 'the two paired rows are no longer live in the lane');
  assert.equal(wait.waitedMs, 2000);
  assert.equal(wait.window, 102);
  assert.deepEqual(wait.lane, LANE);
  assert.equal((await beat(pid('b'), b.ticket, T0 + 2500)).state, 'paired');
  assert.equal((await beat(pid('c'), c.ticket, T0 + 4000)).state, 'waiting');
});

test('the rating window widens with the wait', async (t) => {
  const { join, beat } = fixture(t);
  const a = await join(pid('a'), LANE, 1000);
  const b = await join(pid('b'), LANE, 1180);
  // Both keep polling (every 30 s here; every 2 s in the client), so both stay live.
  for (const at of [1000, 30_000, 60_000, 90_000]) {
    const va = await beat(pid('a'), a.ticket, T0 + at);
    assert.equal(va.state, 'waiting', `A at ${at}`);
    assert.equal(va.window, ratingWindow(at));
    assert.equal(va.waiting, 2);
    assert.equal((await beat(pid('b'), b.ticket, T0 + at + 500)).state, 'waiting', `B at ${at}`);
  }
  // 120 s in: A's window is 200 ≥ the 180 gap.
  const paired = await beat(pid('a'), a.ticket, T0 + 120_000);
  assert.equal(paired.state, 'paired');
  assert.equal((await beat(pid('b'), b.ticket, T0 + 121_000)).roomId, paired.roomId);
});

test('stale rows are skipped for pairing and swept by the next poll', async (t) => {
  const { join, beat, rows } = fixture(t);
  await join(pid('a'), LANE, 1000, T0);
  const b = await join(pid('b'), LANE, 1000, T0 + 40_000);
  assert.equal(b.waiting, 1, 'A has not been seen for 40 s and is not counted');
  const view = await beat(pid('b'), b.ticket, T0 + 41_000);
  assert.equal(view.state, 'waiting');
  assert.equal(view.waiting, 1);
  assert.deepEqual(
    (await rows()).map((r) => r.principal_id),
    [pid('b')],
  );
});

test('leave removes the row; a later poll reports the place expired', async (t) => {
  const { db, join, beat, rows } = fixture(t);
  const a = await join(pid('a'));
  assert.equal((await rows()).length, 1);
  // The wrong ticket changes nothing.
  assert.deepEqual(await leave(db, { principalId: pid('a'), ticket: 'f'.repeat(32) }), { ok: true, removed: false });
  assert.equal((await rows()).length, 1);
  assert.deepEqual(await leave(db, { principalId: pid('a'), ticket: a.ticket }), { ok: true, removed: true });
  assert.equal((await rows()).length, 0);
  assert.deepEqual(await beat(pid('a'), a.ticket, T0 + 1000), { state: 'expired' });
  assert.deepEqual(await leave(db, { principalId: pid('a'), ticket: a.ticket }), { ok: true, removed: false });
});

test('a paired principal can leave the queue with its original ticket', async (t) => {
  const { db, join, beat, rows } = fixture(t);
  const a = await join(pid('a'));
  await join(pid('b'));
  assert.equal((await beat(pid('a'), a.ticket, T0 + 1000)).state, 'paired');
  assert.deepEqual(await leave(db, { principalId: pid('a'), ticket: a.ticket }), { ok: true, removed: true });
  assert.deepEqual((await rows()).map((r) => r.principal_id), [pid('b')]);
});

test('different lanes never pair', async (t) => {
  const { join, beat } = fixture(t);
  const a = await join(pid('a'), { sport: 'Football', mode: 'quick', stake: 0 });
  const b = await join(pid('b'), { sport: 'Cricket', mode: 'quick', stake: 0 });
  const c = await join(pid('c'), { sport: 'Football', mode: 'trilogy', stake: 0 });
  const d = await join(pid('d'), { sport: 'Football', mode: 'quick', stake: 25 });
  for (const [who, ticket] of [[pid('a'), a.ticket], [pid('b'), b.ticket], [pid('c'), c.ticket], [pid('d'), d.ticket]]) {
    const view = await beat(who, ticket, T0 + 1000);
    assert.equal(view.state, 'waiting');
    assert.equal(view.waiting, 1, `${who} is alone in its lane`);
  }
});

test('the wrong ticket is refused and a re-enqueue in the same lane keeps the wait served', async (t) => {
  const { db, join, beat } = fixture(t);
  const a = await join(pid('a'));
  await assert.rejects(beat(pid('a'), 'e'.repeat(32), T0 + 1000), { status: 403, code: 'unauthorized' });
  assert.equal((await beat(pid('a'), a.ticket, T0 + 20_000)).state, 'waiting');
  const again = await enqueue(db, { principalId: pid('a'), ...LANE, rating: 1000, now: T0 + 40_000 });
  assert.notEqual(again.ticket, a.ticket);
  assert.equal(again.waitedMs, 40_000, 'same lane, still live: the clock keeps running');
  assert.equal(again.window, 133);
  await assert.rejects(beat(pid('a'), a.ticket, T0 + 41_000), { status: 403 }, 'the old ticket is dead');
  const moved = await enqueue(db, { principalId: pid('a'), sport: 'Cricket', mode: 'quick', stake: 0, now: T0 + 50_000 });
  assert.equal(moved.waitedMs, 0, 'a new lane starts over');
  const back = await enqueue(db, { principalId: pid('a'), ...LANE, rating: 1000, now: T0 + 100_000 });
  assert.equal(back.waitedMs, 0, 'a row gone stale starts over too');
});

test('a lost claim leaves both rows waiting and a refused room restores them', async (t) => {
  const { db, store, join, beat, rows } = fixture(t);
  const a = await join(pid('a'));
  const b = await join(pid('b'));
  // A refused create (here: the duel service throws) puts both players back in the lane.
  const refusing = { store, actor: 'test', dispatch: async () => { throw new Error('refused'); } };
  await assert.rejects(poll(db, { principalId: pid('a'), ticket: a.ticket, name: 'A', now: T0 + 1000 }, refusing), /refused/);
  for (const row of await rows()) assert.equal(readAssignment(row.ticket), null);
  assert.equal((await beat(pid('b'), b.ticket, T0 + 2000)).state, 'paired', 'B can still pair afterwards');
  assert.equal((await beat(pid('a'), a.ticket, T0 + 2500)).state, 'paired');
});

test('two pollers racing for the same partner pair exactly once', async (t) => {
  const { db, join, beat } = fixture(t);
  const a = await join(pid('a'));
  const b = await join(pid('b'));
  const c = await join(pid('c'));
  // A and C both want B (the oldest live row besides themselves); only one claim can win, and the
  // loser may pair with whoever is still free. Whatever the interleaving: one room, two seats.
  await Promise.all([beat(pid('a'), a.ticket, T0 + 1000), beat(pid('c'), c.ticket, T0 + 1000)]);
  const views = await Promise.all([
    beat(pid('a'), a.ticket, T0 + 2000),
    beat(pid('b'), b.ticket, T0 + 2000),
    beat(pid('c'), c.ticket, T0 + 2000),
  ]);
  const paired = views.filter((v) => v.state === 'paired');
  assert.equal(paired.length, 2);
  assert.equal(views.filter((v) => v.state === 'waiting').length, 1);
  assert.equal(new Set(paired.map((v) => v.roomId)).size, 1, 'one room');
  assert.deepEqual(paired.map((v) => v.join.seat).sort(), [0, 1]);
  const rooms = (await db.prepare('SELECT id FROM rooms').all()).results;
  assert.equal(rooms.length, 1, 'no orphan room was created by the losing claim');
});

test('ingress: anonymous is 401 sign_in_required, a guest header or session cookie is enough', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const env = { DB: db };
  const call = (body, headers = {}) =>
    handleQueueRequest(
      new Request('https://duel.test/api/queue', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
      }),
      env,
    );
  const anon = await call({ action: 'enqueue', ...LANE });
  assert.equal(anon.status, 401);
  assert.equal((await anon.json()).code, 'sign_in_required');
  const guest = await call({ action: 'enqueue', ...LANE, rating: 1000 }, { 'x-fd-principal': pid('g') });
  assert.equal(guest.status, 200);
  const view = await guest.json();
  assert.equal(view.state, 'waiting');
  assert.equal(view.waiting, 1);
  const sessionId = await issueSession(db, { principalId: pid('s'), now: Date.now() });
  const signed = await call({ action: 'enqueue', ...LANE, rating: 1000 }, { cookie: `fd_session=${sessionId.sessionId}` });
  assert.equal(signed.status, 200);
  assert.equal((await signed.json()).waiting, 2);
  const unknown = await call({ action: 'dance' }, { 'x-fd-principal': pid('g') });
  assert.equal(unknown.status, 400);
  const bad = await call({ action: 'enqueue', sport: 'Tennis', mode: 'quick', stake: 0 }, { 'x-fd-principal': pid('g') });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /Choose a sport/);
  const left = await call({ action: 'leave', ticket: view.ticket }, { 'x-fd-principal': pid('g') });
  assert.deepEqual(await left.json(), { ok: true, removed: true });
  const noDb = await handleQueueRequest(
    new Request('https://duel.test/api/queue', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-fd-principal': pid('g') },
      body: JSON.stringify({ action: 'enqueue', ...LANE }),
    }),
    {},
  );
  assert.equal(noDb.status, 503);
});

test('ingress: the poll pairs through the real duel service and hands back join credentials', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const env = { DB: db };
  const call = async (body, who) => {
    const res = await handleQueueRequest(
      new Request('https://duel.test/api/queue', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-fd-principal': who },
        body: JSON.stringify(body),
      }),
      env,
    );
    return { status: res.status, body: await res.json() };
  };
  const a = await call({ action: 'enqueue', ...LANE, rating: 1000 }, pid('a'));
  const b = await call({ action: 'enqueue', ...LANE, rating: 1000 }, pid('b'));
  const pa = await call({ action: 'poll', ticket: a.body.ticket, name: 'Ana' }, pid('a'));
  assert.equal(pa.status, 200);
  assert.equal(pa.body.state, 'paired');
  const pb = await call({ action: 'poll', ticket: b.body.ticket, name: 'Ben' }, pid('b'));
  assert.equal(pb.body.state, 'paired');
  assert.equal(pb.body.roomId, pa.body.roomId);
  const store = new D1RoomStore(db);
  const joined = await dispatch(
    store,
    { action: 'join', roomId: pb.body.roomId, token: pb.body.join.token, invite: pb.body.join.invite, name: 'Ben' },
    { now: Date.now(), actor: 'b', principalId: pid('b') },
  );
  assert.deepEqual(joined.room.players.map((p) => p.name), ['Ana', 'Ben']);
});

/* ---------- the client loop (lib/queue-client.ts), scripted without a browser ---------- */

function loopHarness(answers) {
  const calls = [];
  const timers = [];
  let clock = 0;
  const request = async (body) => {
    calls.push(body);
    const next = answers.shift();
    if (typeof next === 'function') return next(body);
    if (next instanceof Error) throw next;
    return next;
  };
  const deps = {
    request,
    now: () => clock,
    setTimeout: (fn, ms) => {
      const handle = { fn, ms, live: true };
      timers.push(handle);
      return handle;
    },
    clearTimeout: (h) => {
      h.live = false;
    },
  };
  const events = { waiting: [], paired: [], errors: [] };
  const listeners = {
    onWaiting: (v) => events.waiting.push(v),
    onPaired: (j) => events.paired.push(j),
    onError: (e) => events.errors.push(e),
  };
  const flush = () => new Promise((r) => setImmediate(r));
  const fire = async (ms = QUEUE_POLL_MS) => {
    clock += ms;
    const due = timers.filter((t) => t.live);
    for (const t of due) t.live = false;
    for (const t of due) t.fn();
    await flush();
    await flush();
  };
  return { calls, deps, events, listeners, flush, fire, timers, tick: () => clock };
}
const WAIT = (n, ticket = 'a'.repeat(32)) => ({
  state: 'waiting',
  ticket,
  lane: LANE,
  waiting: n,
  waitedMs: 0,
  window: 100,
});

test('client loop: enqueue, poll every interval, hand over the seat on paired', async () => {
  const join = { roomId: 'b'.repeat(32), token: 'c'.repeat(48), invite: 'd'.repeat(48), seat: 1 };
  const h = loopHarness([WAIT(1), WAIT(2), { state: 'paired', roomId: join.roomId, join }]);
  startSearch({ lane: LANE, rating: 1000, name: 'Ana' }, h.listeners, h.deps);
  await h.flush();
  assert.deepEqual(h.calls[0], { action: 'enqueue', ...LANE, rating: 1000 });
  assert.equal(h.events.waiting.length, 1);
  assert.equal(h.events.waiting[0].waiting, 1);
  assert.equal(h.events.waiting[0].elapsedMs, 0);
  await h.fire();
  assert.deepEqual(h.calls[1], { action: 'poll', ticket: 'a'.repeat(32), name: 'Ana' });
  assert.equal(h.events.waiting[1].waiting, 2);
  assert.equal(h.events.waiting[1].elapsedMs, QUEUE_POLL_MS);
  await h.fire();
  assert.deepEqual(h.events.paired, [join]);
  assert.equal(h.timers.filter((t) => t.live).length, 0, 'nothing left scheduled');
  assert.equal(h.calls.length, 3, 'no leave after a pairing: the row is the seat note');
});

test('client loop: cancel stops the clock and leaves the lane; errors end the search', async () => {
  const h = loopHarness([WAIT(1), { ok: true, removed: true }]);
  const handle = startSearch({ lane: LANE, rating: 1000, name: 'Ana' }, h.listeners, h.deps);
  await h.flush();
  await handle.cancel();
  assert.deepEqual(h.calls[1], { action: 'leave', ticket: 'a'.repeat(32) });
  assert.equal(h.timers.filter((t) => t.live).length, 0);
  await handle.cancel();
  assert.equal(h.calls.length, 2, 'a second cancel sends nothing');
  const failing = loopHarness([Object.assign(new Error('Sign in first.'), { status: 401, code: 'sign_in_required' })]);
  startSearch({ lane: LANE, rating: 1000, name: 'Ana' }, failing.listeners, failing.deps);
  await failing.flush();
  assert.equal(failing.events.errors[0].status, 401);
  assert.equal(failing.events.waiting.length, 0);
});

test('client loop: an expired place is re-enqueued, and the practice offer threshold is 90 s', async () => {
  const h = loopHarness([WAIT(1, 'a'.repeat(32)), { state: 'expired' }, WAIT(1, 'e'.repeat(32)), WAIT(1, 'e'.repeat(32))]);
  startSearch({ lane: LANE, rating: 1000, name: 'Ana' }, h.listeners, h.deps);
  await h.flush();
  await h.fire();
  assert.equal(h.calls[2].action, 'enqueue', 'expired → enqueue again');
  await h.fire();
  assert.equal(h.calls[3].ticket, 'e'.repeat(32), 'the new ticket is the one polled');
  assert.equal(QUEUE_OFFER_PRACTICE_MS, 90_000);
  assert.equal(QUEUE_POLL_MS, QUEUE.pollMs);
  assert.equal(QUEUE_OFFER_PRACTICE_MS, QUEUE.offerPracticeAfterMs);
});
