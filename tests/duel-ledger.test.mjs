/**
 * Duel entries and prizes on the real ledger (M4).
 *
 * Every room on a D1RoomStore plays for real coins: the entry is a `stake` into the room's escrow
 * account posted before the seat is written, the payout is one `settle` posted after the settled
 * room is durable. These tests drive whole matches through `dispatch` against the local D1 harness
 * (whose batch semantics `tests/d1-batch-semantics.test.mjs` pins) with a D1LedgerStore over the
 * SAME database, and check the books after every terminal path: a win at a fee tier, a draw, a
 * leave, an expiry swept by cleanup, a seat that never filled — and that the escrow account reads
 * zero after each one. The reconciler gets the last word.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { D1RoomStore, dispatch, heldInEscrow, ledgerFor } from '../lib/server/duel-service.mjs';
import { handleDuelRequest } from '../lib/server/http-handler.mjs';
import { RULES, STAKES } from '../lib/server/room-engine.mjs';
import { MemoryRoomStore } from '../lib/duel-memory-store.mjs';
import { D1LedgerStore } from '../lib/server/ledger-store-d1.mjs';
import { reconcile } from '../lib/server/reconcile.mjs';
import { grant } from '../lib/ledger/intents.mjs';
import { PLAY_TREASURY, escrowAccount, userAccount } from '../lib/ledger/accounts.mjs';
import { sha256 } from '../lib/ledger/sha256.mjs';
import { DEFAULT_CONFIG, feeFor, prizeFor } from '../lib/economy/economy.mjs';
import { LocalD1 } from './d1-local.mjs';

const token = () => crypto.randomUUID().replaceAll('-', '') + '1234567890abcdef';
const id = () => crypto.randomUUID().replaceAll('-', '');
const principal = () => `anon_${id()}`;
const T0 = 1_000_000;
const SEED = 1000;

/** A store over a fresh database, the ledger behind it, and a way to seed and read coins. */
function opened(t) {
  const db = new LocalD1();
  t.after(() => db.close());
  const store = new D1RoomStore(db);
  const ledger = ledgerFor(store);
  const fund = async (principalId, amount = SEED) => {
    await ledger.post(grant({ principalId, amount, opKey: `grant:seed:${principalId}`, at: 1, reason: 'test seed' }));
  };
  const coins = async (principalId) => (await ledger.balances([userAccount('play', principalId)])).get(userAccount('play', principalId));
  const escrow = async (roomId) => (await ledger.balances([escrowAccount(roomId)])).get(escrowAccount(roomId));
  const treasury = async () => (await ledger.balances([PLAY_TREASURY])).get(PLAY_TREASURY);
  return { db, store, ledger, fund, coins, escrow, treasury };
}

/** Two funded seats in one room, and the moves of a match. */
async function fixture(t, { stake = 50, mode = 'quick', join = true } = {}) {
  const ctx = opened(t);
  let now = T0;
  const host = { roomId: id(), token: token(), invite: token(), principalId: principal() };
  const guest = { roomId: host.roomId, token: token(), invite: host.invite, principalId: principal() };
  await ctx.fund(host.principalId);
  await ctx.fund(guest.principalId);
  const call = (seat, action, extra = {}) =>
    dispatch(
      ctx.store,
      { roomId: seat.roomId, token: seat.token, invite: seat.invite, action, ...extra },
      { now, actor: seat.token, principalId: seat.principalId },
    );
  await call(host, 'create', { name: 'A', config: { mode, stake, duration: 10 } });
  if (join) await call(guest, 'join', { name: 'B' });
  const raw = async () => JSON.parse((await ctx.store.read(host.roomId)).state);
  const prepare = async () => {
    const previous = await raw();
    const roundId = previous.round?.id ?? null;
    await Promise.all([call(host, 'ready', { roundId }), call(guest, 'ready', { roundId })]);
    now += 3000;
    const r = await raw();
    await Promise.all([call(host, 'reveal', { roundId: r.round.id }), call(guest, 'reveal', { roundId: r.round.id })]);
    return raw();
  };
  const answer = async (seat, r, elapsedMs, choice = r.round.question.correctIndex) => {
    await call(seat, 'answer', { roundId: r.round.id, attemptId: token(), choice, elapsedMs });
    return call(seat, 'state');
  };
  return { ...ctx, host, guest, stake, call, raw, prepare, answer, advance: (ms) => (now += ms), at: () => now };
}

/** Both seats staked, the escrow holds the pot, the snapshots show the entries gone. */
async function staked(f) {
  const r = await f.raw();
  assert.equal(r.ledger, true);
  assert.deepEqual(r.staked, [true, true]);
  assert.equal(r.escrow, 2 * f.stake);
  assert.deepEqual(r.balances, [SEED - f.stake, SEED - f.stake]);
  assert.equal(await f.escrow(f.host.roomId), 2 * f.stake);
  return r;
}

async function booksBalance(ledger) {
  const report = await reconcile(ledger);
  assert.equal(report.ok, true, JSON.stringify(report.violations.concat(report.drift)));
  assert.deepEqual(report.openEscrows, [], 'no escrow is left holding value');
  return report;
}

test('the engine accepts every economy tier and nothing else', () => {
  assert.deepEqual([...STAKES], [0, ...DEFAULT_CONFIG.stakes]);
  assert.ok(STAKES.includes(250) && STAKES.includes(500), 'the two gated tiers are room entries too');
});

test('a completed match pays the winner the tier prize, burns the disclosed fee, and empties the escrow', async (t) => {
  const f = await fixture(t, { stake: 50 });
  const issuedBefore = await f.treasury();
  await staked(f);
  const r = await f.prepare();
  f.advance(1200);
  await f.answer(f.host, r, 1000);
  const out = await f.answer(f.guest, r, 1151);
  assert.equal(out.room.winner, 0);
  assert.equal(out.room.ledgerSettled, true);
  const fee = feeFor(50),
    prize = prizeFor(50);
  assert.equal(fee, 10, 'the 50 tier carries the researched 10% fee');
  assert.equal(prize + fee, 100, 'prize plus fee is exactly the pot');
  assert.equal(await f.coins(f.host.principalId), SEED - 50 + prize);
  assert.equal(await f.coins(f.guest.principalId), SEED - 50);
  assert.deepEqual(out.room.balances, [SEED - 50 + prize, SEED - 50], 'the snapshot is refreshed on settlement');
  assert.equal(await f.escrow(f.host.roomId), 0);
  // The fee is a burn: it returns to the treasury, so lifetime issuance falls by exactly the fee.
  assert.equal(await f.treasury(), issuedBefore + fee);
  const report = await booksBalance(f.ledger);
  assert.equal(report.issued, 2 * SEED - fee);
  // Polling a settled room posts nothing new: one settle per room, however often it is read.
  const before = f.db.metrics.batches;
  await f.call(f.host, 'state');
  await f.call(f.guest, 'state');
  assert.equal(f.db.metrics.batches, before);
  assert.equal((await f.ledger.scan()).filter((tx) => tx.kind === 'settle').length, 1);
});

test('a draw refunds both entries whole with no fee', async (t) => {
  const f = await fixture(t, { stake: 100 });
  await staked(f);
  const r = await f.prepare();
  f.advance(1200);
  await f.answer(f.host, r, 1000, (r.round.question.correctIndex + 1) % 4);
  const out = await f.answer(f.guest, r, 1100, (r.round.question.correctIndex + 2) % 4);
  assert.equal(out.room.winner, null);
  assert.equal(await f.coins(f.host.principalId), SEED);
  assert.equal(await f.coins(f.guest.principalId), SEED);
  assert.equal(await f.escrow(f.host.roomId), 0);
  const settle = (await f.ledger.scan()).find((tx) => tx.kind === 'settle');
  assert.equal(settle.meta.fee, 0);
  await booksBalance(f.ledger);
});

test('leaving before completion refunds both entries', async (t) => {
  const f = await fixture(t, { stake: 25 });
  await staked(f);
  const out = await f.call(f.guest, 'leave');
  assert.equal(out.room.reason, 'player-left');
  assert.deepEqual(out.room.balances, [SEED, SEED]);
  assert.equal(await f.coins(f.host.principalId), SEED);
  assert.equal(await f.coins(f.guest.principalId), SEED);
  assert.equal(await f.escrow(f.host.roomId), 0);
  await booksBalance(f.ledger);
});

test('a room that expires is refunded by advance on the next read, and its escrow is empty', async (t) => {
  const f = await fixture(t, { stake: 10 });
  await staked(f);
  f.advance(RULES.ttlMs);
  const out = await f.call(f.host, 'state');
  assert.equal(out.room.reason, 'room-expired');
  assert.equal(await f.coins(f.host.principalId), SEED);
  assert.equal(await f.coins(f.guest.principalId), SEED);
  assert.equal(await f.escrow(f.host.roomId), 0);
  await booksBalance(f.ledger);
});

test('the sweep settles a staked, unsettled room before deleting it — a refund, or its own verdict', async (t) => {
  const f = await fixture(t, { stake: 50 });
  await staked(f);
  // A second room, complete with a winner but whose payout never landed (a crash between the two
  // writes): the sweep must pay the verdict, not refund it.
  const g = await fixture(t, { stake: 50 });
  await staked(g);
  const r = await g.prepare();
  g.advance(1200);
  await g.answer(g.host, r, 1000);
  const originalPost = g.ledger.post.bind(g.ledger);
  g.ledger.post = async () => {
    throw new Error('network');
  };
  await assert.rejects(g.answer(g.guest, r, 1151), /network/);
  g.ledger.post = originalPost;
  const stale = await g.raw();
  assert.equal(stale.settled, true);
  assert.equal(stale.ledgerSettled, false, 'the verdict is durable, the payout is not');
  assert.equal(await g.escrow(g.host.roomId), 100);

  // Nothing is deleted while the rooms are live.
  await f.store.cleanup(f.at());
  assert.ok(await f.store.read(f.host.roomId));
  // Past expiry, cleanup refunds the unsettled room and deletes it.
  await f.store.cleanup(f.at() + RULES.ttlMs + 1);
  assert.equal(await f.store.read(f.host.roomId), null);
  assert.equal(await f.coins(f.host.principalId), SEED);
  assert.equal(await f.coins(f.guest.principalId), SEED);
  assert.equal(await f.escrow(f.host.roomId), 0);
  await booksBalance(f.ledger);

  await g.store.cleanup(g.at() + RULES.ttlMs + 1);
  assert.equal(await g.store.read(g.host.roomId), null);
  assert.equal(await g.coins(g.host.principalId), SEED - 50 + prizeFor(50));
  assert.equal(await g.coins(g.guest.principalId), SEED - 50);
  assert.equal(await g.escrow(g.host.roomId), 0);
  await booksBalance(g.ledger);
});

test('a payout that failed to post is repaired by the next read of the room', async (t) => {
  const f = await fixture(t, { stake: 50 });
  await staked(f);
  const r = await f.prepare();
  f.advance(1200);
  await f.answer(f.host, r, 1000);
  const originalPost = f.ledger.post.bind(f.ledger);
  f.ledger.post = async () => {
    throw new Error('network');
  };
  await assert.rejects(f.answer(f.guest, r, 1151), /network/);
  f.ledger.post = originalPost;
  assert.equal((await f.raw()).ledgerSettled, false);
  const out = await f.call(f.guest, 'state');
  assert.equal(out.room.ledgerSettled, true);
  assert.equal(out.room.winner, 0);
  assert.deepEqual(out.room.balances, [SEED - 50 + prizeFor(50), SEED - 50]);
  assert.equal(await f.escrow(f.host.roomId), 0);
  await booksBalance(f.ledger);
});

test('an entry the wallet cannot cover is refused and the room is not created', async (t) => {
  const ctx = opened(t);
  const poor = principal();
  await ctx.fund(poor, 40);
  const host = { roomId: id(), token: token(), invite: token() };
  await assert.rejects(
    dispatch(ctx.store, { ...host, action: 'create', name: 'A', config: { mode: 'quick', stake: 50, duration: 10 } }, { principalId: poor }),
    (e) => e.code === 'insufficient_coins' && e.status === 400 && e.message === 'Not enough coins for this entry.',
  );
  assert.equal(await ctx.store.read(host.roomId), null);
  assert.equal(await ctx.coins(poor), 40);
  assert.equal(await ctx.escrow(host.roomId), 0);
  // A joiner without the coins is refused the same way and the seat stays open.
  const rich = principal();
  await ctx.fund(rich);
  await dispatch(ctx.store, { ...host, action: 'create', name: 'A', config: { mode: 'quick', stake: 50, duration: 10 } }, { principalId: rich });
  await assert.rejects(
    dispatch(ctx.store, { ...host, token: token(), action: 'join', name: 'B' }, { principalId: poor }),
    (e) => e.code === 'insufficient_coins',
  );
  const room = JSON.parse((await ctx.store.read(host.roomId)).state);
  assert.equal(room.players[1], null);
  assert.equal(await ctx.escrow(host.roomId), 50);
  assert.equal(await ctx.coins(poor), 40);
});

test('an entry for coins needs a principal; a free room does not', async (t) => {
  const ctx = opened(t);
  const host = { roomId: id(), token: token(), invite: token() };
  await assert.rejects(
    dispatch(ctx.store, { ...host, action: 'create', name: 'A', config: { mode: 'quick', stake: 10, duration: 10 } }),
    (e) => e.code === 'sign_in_required' && e.status === 401,
  );
  assert.equal(await ctx.store.read(host.roomId), null);
  const free = await dispatch(ctx.store, { ...host, action: 'create', name: 'A', config: { mode: 'quick', stake: 0, duration: 10 } });
  assert.equal(free.room.ledger, true);
  assert.deepEqual(free.room.staked, [false, false]);
  assert.deepEqual(free.room.balances, [0, 0]);
  assert.equal((await ctx.ledger.scan()).length, 0, 'a free room posts nothing');
});

test('a replayed create takes one entry; the room reports the seat as staked once', async (t) => {
  const f = await fixture(t, { stake: 100, join: false });
  const again = await f.call(f.host, 'create', { name: 'A', config: { mode: 'quick', stake: 100, duration: 10 } });
  assert.deepEqual(again.room.staked, [true, false]);
  assert.equal(again.room.escrow, 100);
  assert.equal(await f.coins(f.host.principalId), SEED - 100);
  assert.equal(await f.escrow(f.host.roomId), 100);
  assert.equal((await f.ledger.scan()).filter((tx) => tx.kind === 'stake').length, 1);
  // The seat never fills. Expiry refunds the one staker only — one leg, nothing invented for the empty seat.
  f.advance(RULES.ttlMs);
  const out = await f.call(f.host, 'state');
  assert.equal(out.room.reason, 'room-expired');
  assert.equal(await f.coins(f.host.principalId), SEED);
  assert.equal(await f.escrow(f.host.roomId), 0);
  const settle = (await f.ledger.scan()).find((tx) => tx.kind === 'settle');
  assert.equal(settle.entries.filter((e) => e.account.startsWith('play:user:')).length, 1);
  await booksBalance(f.ledger);
});

test('a bot room never touches the ledger', async (t) => {
  const ctx = opened(t);
  const me = principal();
  await ctx.fund(me);
  const host = { roomId: id(), token: token(), invite: token() };
  let now = T0;
  const call = (action, extra = {}) =>
    dispatch(ctx.store, { ...host, action, ...extra }, { now, actor: host.token, rng: () => 0.51, principalId: me });
  await call('create', { name: 'Human', config: { mode: 'quick', stake: 0, duration: 10, opponent: 'bot' } });
  // A staked bot room is refused before anything could be posted.
  await assert.rejects(
    dispatch(ctx.store, { ...host, roomId: id(), action: 'create', name: 'H', config: { mode: 'quick', stake: 25, duration: 10, opponent: 'bot' } }, { principalId: me }),
    /Practice bots play for free/,
  );
  const start = (await call('ready', { roundId: null })).room;
  now = start.round.scheduledAt;
  await call('reveal', { roundId: start.round.id });
  now += 1200;
  await call('answer', { roundId: start.round.id, attemptId: token(), choice: 0, elapsedMs: 1000 });
  now += 12_000;
  const end = (await call('state')).room;
  assert.equal(end.settled, true);
  assert.equal(end.escrow, 0);
  assert.deepEqual(end.staked, [false, false]);
  assert.deepEqual(end.balances, [SEED, 0], 'the snapshot shows the real balance; the bot has none');
  const scan = await ctx.ledger.scan();
  assert.deepEqual(
    scan.map((tx) => tx.kind),
    ['grant'],
    'only the seed grant exists',
  );
  assert.equal(await ctx.coins(me), SEED);
});

test('the same principal cannot take both seats of a room for coins, but may in a free one', async (t) => {
  const f = await fixture(t, { stake: 25, join: false });
  await assert.rejects(
    f.call({ ...f.guest, principalId: f.host.principalId }, 'join', { name: 'Me again' }),
    (e) => e.code === 'same_player' && e.status === 409,
  );
  assert.equal(await f.coins(f.host.principalId), SEED - 25, 'the second entry was never taken');
  const ctx = opened(t);
  const host = { roomId: id(), token: token(), invite: token() };
  const me = principal();
  await dispatch(ctx.store, { ...host, action: 'create', name: 'A', config: { mode: 'quick', stake: 0, duration: 10 } }, { principalId: me });
  const joined = await dispatch(ctx.store, { ...host, token: token(), action: 'join', name: 'B' }, { principalId: me });
  assert.equal(joined.room.players[1].name, 'B');
});

test('a guest header and a session cookie both name the player over HTTP', async (t) => {
  const ctx = opened(t);
  const guest = principal();
  const named = `p_${id()}`;
  await ctx.fund(guest);
  await ctx.fund(named);
  // A session row the way auth-service writes it: only the sha256 of the cookie's id is stored.
  const sessionId = 'S'.repeat(48);
  await ctx.db
    .prepare('INSERT INTO sessions (id_hash, principal_id, created_at, expires_at, last_seen_at, revoked_at) VALUES (?,?,?,?,?,NULL)')
    .bind(sha256(sessionId), named, Date.now(), Date.now() + 3_600_000, Date.now())
    .run();
  const request = (body, headers = {}) =>
    new Request('https://duel.example/api/duel', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  const roomId = id(),
    hostToken = token(),
    invite = token();
  const created = await handleDuelRequest(
    request(
      { action: 'create', roomId, token: hostToken, invite, name: 'Guest', config: { mode: 'quick', stake: 25, duration: 10 } },
      { 'x-fd-principal': guest },
    ),
    { DB: ctx.db },
  );
  assert.equal(created.status, 200, await created.text());
  const joined = await handleDuelRequest(
    request({ action: 'join', roomId, token: token(), invite, name: 'Named' }, { cookie: `fd_session=${sessionId}` }),
    { DB: ctx.db },
  );
  assert.equal(joined.status, 200, await joined.text());
  const room = JSON.parse((await ctx.store.read(roomId)).state);
  assert.deepEqual(room.principals, [guest, named]);
  assert.deepEqual(room.staked, [true, true]);
  assert.equal(await ctx.coins(guest), SEED - 25);
  assert.equal(await ctx.coins(named), SEED - 25);
  assert.equal(await ctx.escrow(roomId), 50);
  // The session wins when both are presented; a revoked session falls back to the header.
  await ctx.db.prepare('UPDATE sessions SET revoked_at = ? WHERE id_hash = ?').bind(Date.now(), sha256(sessionId)).run();
  const other = principal();
  await ctx.fund(other);
  const fresh = id();
  const fallback = await handleDuelRequest(
    request(
      { action: 'create', roomId: fresh, token: token(), invite: token(), name: 'Other', config: { mode: 'quick', stake: 10, duration: 10 } },
      { cookie: `fd_session=${sessionId}`, 'x-fd-principal': other },
    ),
    { DB: ctx.db },
  );
  assert.equal(fallback.status, 200);
  assert.equal(JSON.parse((await ctx.store.read(fresh)).state).principals[0], other);
  // The projection never carries a principal id: a guest id is a bearer token.
  const text = await (await handleDuelRequest(request({ action: 'state', roomId, token: hostToken }, { 'x-fd-principal': guest }), { DB: ctx.db })).text();
  assert.ok(!text.includes(guest) && !text.includes(named));
});

test('what the escrow holds is read from the ledger, so an unseated entry is still refunded', async (t) => {
  const f = await fixture(t, { stake: 25 });
  await staked(f);
  // An entry that landed in this room's escrow from a principal the room never seated — the
  // residue of a crash between a stake and its seat write.
  const stray = principal();
  await f.fund(stray);
  const { stake } = await import('../lib/ledger/intents.mjs');
  await f.ledger.post(stake({ principalId: stray, roomId: f.host.roomId, amount: 25, opKey: `stake:${f.host.roomId}:${stray}`, at: 5 }));
  const held = await heldInEscrow(f.ledger, f.host.roomId);
  assert.deepEqual([...held].sort(), [[f.host.principalId, 25], [f.guest.principalId, 25], [stray, 25]].sort());
  const r = await f.raw();
  const out = await f.call(f.host, 'leave');
  assert.equal(out.room.settled, true);
  assert.equal(await f.coins(stray), SEED, 'the stray entry went back to whoever paid it');
  assert.equal(await f.coins(f.host.principalId), SEED);
  assert.equal(await f.escrow(r.id), 0);
  await booksBalance(f.ledger);
});

test('a memory store without a ledger keeps the demo coins; with one it plays the same game as D1', async (t) => {
  const demo = new MemoryRoomStore();
  assert.equal(ledgerFor(demo), null);
  const host = { roomId: id(), token: token(), invite: token() };
  const created = await dispatch(demo, { ...host, action: 'create', name: 'A', config: { mode: 'quick', stake: 50, duration: 10 } }, { now: T0 });
  assert.equal(created.room.ledger, false);
  assert.deepEqual(created.room.balances, [1000, 1000]);
  assert.equal(ledgerFor(opened(t).store) instanceof D1LedgerStore, true);
});

test('the reconciler passes after a full trilogy at the top tier', async (t) => {
  const f = await fixture(t, { stake: 500, mode: 'trilogy' });
  await staked(f);
  for (let round = 0; round < 2; round++) {
    const r = await f.prepare();
    f.advance(1200);
    await Promise.all([f.answer(f.host, r, 1000), f.answer(f.guest, r, 1151)]);
  }
  const end = await f.raw();
  assert.equal(end.winner, 0);
  assert.equal(end.ledgerSettled, true);
  assert.equal(feeFor(500), 150);
  assert.equal(await f.coins(f.host.principalId), SEED - 500 + prizeFor(500));
  assert.equal(await f.coins(f.guest.principalId), SEED - 500);
  assert.equal(await f.escrow(f.host.roomId), 0);
  const report = await booksBalance(f.ledger);
  assert.equal(report.issued, 2 * SEED - 150);
});
