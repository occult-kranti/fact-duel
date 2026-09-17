import test from 'node:test';
import assert from 'node:assert/strict';
import { D1RoomStore, dispatch } from '../lib/server/duel-service.mjs';
import {
  DURATIONS,
  MODE_DURATION,
  MODE_ROUNDS,
  RULES,
  normalizeConfig,
  planBotAttempt,
} from '../lib/server/room-engine.mjs';
import { QUESTIONS } from '../lib/server/questions.mjs';
import { grant } from '../lib/ledger/intents.mjs';
import { escrowAccount } from '../lib/ledger/accounts.mjs';
import { LocalD1 } from './d1-local.mjs';

const token = () => crypto.randomUUID().replaceAll('-', '') + '1234567890abcdef';
const id = () => crypto.randomUUID().replaceAll('-', '');
const principal = () => `anon_${id()}`;
const config = { mode: 'quick', stake: 25, duration: 10 };
/** Every D1 room plays on the real ledger, so a seat that pays an entry needs a funded principal. */
async function fund(store, principalId, amount = 1000) {
  await store.ledger.post(grant({ principalId, amount, opKey: `grant:seed:${principalId}`, at: 1, reason: 'test seed' }));
}
async function fixture(t, overrides = {}) {
  const db = new LocalD1(),
    store = new D1RoomStore(db);
  t.after(() => db.close());
  let now = 1_000_000;
  const host = { roomId: id(), token: token(), invite: token(), principalId: principal() };
  const guest = { roomId: host.roomId, token: token(), invite: host.invite, principalId: principal() };
  await fund(store, host.principalId);
  await fund(store, guest.principalId);
  const call = (seat, action, extra = {}) =>
    dispatch(
      store,
      { ...seat, principalId: undefined, action, ...extra },
      { now, actor: seat.token, principalId: seat.principalId },
    );
  await call(host, 'create', { name: 'A', config: { ...config, ...overrides } });
  await call(guest, 'join', { name: 'B' });
  const raw = async () => JSON.parse((await store.read(host.roomId)).state);
  const prepare = async () => {
    const previous = await raw();
    const roundId = previous.round?.id ?? null;
    await Promise.all([call(host, 'ready', { roundId }), call(guest, 'ready', { roundId })]);
    now += 3000;
    const r = await raw();
    await Promise.all([
      call(host, 'reveal', { roundId: r.round.id }),
      call(guest, 'reveal', { roundId: r.round.id }),
    ]);
    return raw();
  };
  const answer = async (seat, r, elapsedMs, choice = r.round.question.correctIndex, attemptId = token()) => {
    await call(seat, 'answer', { roundId: r.round.id, attemptId, choice, elapsedMs });
    return call(seat, 'state');
  };
  return {
    db,
    store,
    host,
    guest,
    call,
    raw,
    prepare,
    answer,
    advance: (ms) => (now += ms),
    setTime: (value) => (now = value),
  };
}
/**
 * Coins are conserved: the two balance snapshots plus the room's escrow are the 2,000 seeded
 * (the 25 tier carries no fee). Once the room has settled, the escrow ACCOUNT must be empty too.
 */
function coins(r) {
  assert.equal(r.balances[0] + r.balances[1] + r.escrow, 2000);
}
async function escrowEmpty(f) {
  const held = await f.store.ledger.balances([escrowAccount(f.host.roomId)]);
  assert.equal(held.get(escrowAccount(f.host.roomId)), 0);
}

test('catalogue does not send stems, options or answer keys', async () => {
  const out = JSON.stringify(await dispatch(null, { action: 'catalogue' }));
  for (const word of ['correctIndex', 'options', 'explanation', 'sourceUrl']) assert.ok(!out.includes(word));
});
test('concurrent ready/reveal reserve exactly once and hide opponent data', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  assert.deepEqual(r.balances, [975, 975]);
  assert.equal(r.escrow, 50);
  coins(r);
  const visible = (await f.call(f.host, 'state')).room;
  assert.equal(visible.round.question.correctIndex, undefined);
  assert.equal(visible.deck, undefined);
  assert.equal(visible.inviteHash, undefined);
  assert.equal(visible.players[0].hash, undefined);
  assert.equal(visible.round.receipts, null);
});
test('different network receipt times do not decide the winning honest screen duration', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  f.advance(1100);
  await f.answer(f.guest, r, 1000);
  f.advance(300);
  const out = await f.answer(f.host, r, 800);
  // 600ms residual exceeds the minimum 500ms envelope, so a suspicious report is refunded.
  assert.equal(out.room.reason, 'timing-inconsistent');
  coins(await f.raw());
});
test('later packet with faster plausible local duration wins', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  f.advance(1100);
  await f.answer(f.guest, r, 1000);
  f.advance(150);
  const out = await f.answer(f.host, r, 800);
  assert.equal(out.room.winner, 0);
  assert.equal(out.room.phase, 'complete');
  assert.deepEqual(out.room.balances, [1025, 975]);
  coins(await f.raw());
  await escrowEmpty(f);
});
test('150ms boundary is a draw; 151ms is a win', async (t) => {
  for (const gap of [150, 151]) {
    const f = await fixture(t),
      r = await f.prepare();
    f.advance(1300);
    await Promise.all([f.answer(f.host, r, 1000), f.answer(f.guest, r, 1000 + gap)]);
    const out = await f.raw();
    assert.equal(out.winner, gap === 150 ? null : 0);
    coins(out);
  }
});
test('same attempt retry settles once; changed payload or second attempt is rejected', async (t) => {
  const f = await fixture(t),
    r = await f.prepare(),
    a = token();
  f.advance(1200);
  await f.answer(f.host, r, 1000, r.round.question.correctIndex, a);
  await f.answer(f.host, r, 1000, r.round.question.correctIndex, a);
  await assert.rejects(
    f.answer(f.host, r, 999, r.round.question.correctIndex, a),
    (e) => e.code === 'attempt_conflict',
  );
  await assert.rejects(f.answer(f.host, r, 1000), (e) => e.code === 'already_answered');
  await f.answer(f.guest, r, 1151);
  await f.answer(f.host, r, 1000, r.round.question.correctIndex, a);
  const out = await f.raw();
  assert.equal(out.events.filter((e) => e.type === 'settled').length, 1);
  coins(out);
});
test('invalid credentials, wrong invitation and a third player cannot take a seat', async (t) => {
  const f = await fixture(t),
    stranger = { roomId: f.host.roomId, token: token(), invite: token() };
  await assert.rejects(f.call(stranger, 'state'), (e) => e.status === 403);
  await assert.rejects(f.call(stranger, 'join', { name: 'C' }), (e) => e.code === 'invalid_invite');
  await assert.rejects(
    f.call({ ...stranger, invite: f.host.invite }, 'join', { name: 'C' }),
    (e) => e.code === 'room_full',
  );
  assert.equal((await f.raw()).players.length, 2);
});
test('concurrent join race has only one guest, and every loser gets its entry straight back', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const store = new D1RoomStore(db);
  const host = { roomId: id(), token: token(), invite: token() };
  const hostId = principal();
  await fund(store, hostId);
  await dispatch(store, { ...host, action: 'create', name: 'Host', config }, { principalId: hostId });
  const guests = Array.from({ length: 8 }, () => principal());
  for (const g of guests) await fund(store, g);
  const results = await Promise.allSettled(
    guests.map((principalId, i) =>
      dispatch(store, { ...host, token: token(), action: 'join', name: `G${i}` }, { actor: `g${i}`, principalId }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const room = JSON.parse((await store.read(host.roomId)).state);
  assert.equal(room.players.filter(Boolean).length, 2);
  // Exactly two entries sit in the escrow: the host's and the seated guest's. The seven who lost
  // the seat were released on the spot, whether or not their stake had already landed.
  const balances = await store.ledger.balances([escrowAccount(host.roomId), ...guests.map((g) => `play:user:${g}`)]);
  assert.equal(balances.get(escrowAccount(host.roomId)), 50);
  const seated = room.principals[1];
  for (const g of guests) assert.equal(balances.get(`play:user:${g}`), g === seated ? 975 : 1000, g);
});
test('missing answer closes after persisted deadline; later polling cannot pay again', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  f.advance(1200);
  await f.answer(f.host, r, 1000);
  f.advance(10_000);
  const out = (await f.call(f.host, 'state')).room;
  assert.equal(out.winner, 0);
  assert.equal(out.round.receipts[1], null);
  await Promise.all(Array.from({ length: 10 }, () => f.call(f.host, 'state')));
  assert.equal((await f.raw()).events.filter((e) => e.type === 'settled').length, 1);
  coins(await f.raw());
});
test('both wrong or both absent draw and refund', async (t) => {
  for (const absent of [false, true]) {
    const f = await fixture(t),
      r = await f.prepare();
    if (absent) {
      f.advance(11_001);
      await f.call(f.host, 'state');
    } else {
      f.advance(1200);
      await Promise.all([
        f.answer(f.host, r, 1000, (r.round.question.correctIndex + 1) % 4),
        f.answer(f.guest, r, 1100, (r.round.question.correctIndex + 2) % 4),
      ]);
    }
    const out = await f.raw();
    assert.equal(out.winner, null);
    assert.deepEqual(out.balances, [1000, 1000]);
    coins(out);
  }
});
test('unopened question cancels; early reveal and stale rounds are rejected', async (t) => {
  const f = await fixture(t);
  await f.call(f.host, 'ready');
  const start = await f.call(f.guest, 'ready');
  await assert.rejects(
    f.call(f.host, 'reveal', { roundId: start.room.round.id }),
    (e) => e.code === 'too_early',
  );
  f.advance(3000);
  await assert.rejects(f.call(f.host, 'reveal', { roundId: 'wrong' }), (e) => e.code === 'stale_round');
  await f.call(f.host, 'reveal', { roundId: start.room.round.id });
  f.advance(RULES.showWindowMs);
  const out = (await f.call(f.host, 'state')).room;
  assert.equal(out.reason, 'player-not-connected');
  coins(await f.raw());
});
test('leave racing second answer has one final settlement and conserves coins', async (t) => {
  for (let i = 0; i < 20; i++) {
    const f = await fixture(t),
      r = await f.prepare();
    f.advance(1200);
    await f.answer(f.host, r, 1000);
    await Promise.allSettled([f.call(f.host, 'leave'), f.answer(f.guest, r, 1151)]);
    const out = await f.raw();
    assert.ok(out.settled);
    assert.equal(out.events.filter((e) => e.type === 'settled').length, 1);
    coins(out);
    // Whichever verdict won the revision race is the one the ledger paid: the snapshot agrees
    // with the room and the escrow is empty either way.
    await f.call(f.host, 'state');
    const paid = await f.raw();
    assert.equal(paid.ledgerSettled, true);
    assert.deepEqual(paid.balances, paid.winner === null ? [1000, 1000] : paid.winner === 0 ? [1025, 975] : [975, 1025]);
    await escrowEmpty(f);
  }
});
test('trilogy keeps the original pot and prevents replaying readiness from an old round', async (t) => {
  const f = await fixture(t, { mode: 'trilogy' });
  const first = await f.prepare();
  f.advance(1200);
  await Promise.all([f.answer(f.host, first, 1000), f.answer(f.guest, first, 1151)]);
  assert.equal((await f.raw()).phase, 'between');
  coins(await f.raw());
  const second = await f.prepare();
  await assert.rejects(f.call(f.host, 'ready', { roundId: first.round.id }), (e) => e.code === 'stale_round');
  f.advance(1200);
  await Promise.all([f.answer(f.host, second, 1000), f.answer(f.guest, second, 1151)]);
  const out = await f.raw();
  assert.equal(out.winner, 0);
  assert.equal(out.roundIndex, 1);
  assert.deepEqual(out.balances, [1025, 975]);
  coins(out);
  assert.notEqual(first.round.question.id, second.round.question.id);
});
test('room expiration refunds unsettled entries', async (t) => {
  const f = await fixture(t);
  await f.prepare();
  f.advance(RULES.ttlMs);
  const r = (await f.call(f.host, 'state')).room;
  assert.equal(r.reason, 'room-expired');
  assert.deepEqual(r.balances, [1000, 1000]);
  await escrowEmpty(f);
});
test('names must remain nonempty after normalization', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    dispatch(
      f.store,
      {
        roomId: id(),
        token: token(),
        invite: token(),
        action: 'create',
        name: '\u0001',
        config,
      },
      { principalId: f.host.principalId },
    ),
    /name/i,
  );
});
test('clock mode obtains timestamp from the primary store rather than the edge clock', async (t) => {
  const f = await fixture(t);
  const actual = Date.now();
  const out = await dispatch(f.store, { ...f.host, action: 'state' }, { now: 0, useDatabaseClock: true });
  assert.ok(out.room.serverNow >= actual - 2);
  assert.ok(out.room.serverNow < actual + 1000);
});
test('input constraints block missing token, impossible choice, negative times and late receipt', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  await assert.rejects(f.call({ ...f.host, token: '' }, 'state'), (e) => e.status === 401);
  f.advance(1000);
  await assert.rejects(f.answer(f.host, r, -1));
  await assert.rejects(f.answer(f.host, r, 500, 4));
  f.advance(9600);
  await assert.rejects(f.answer(f.host, r, 9999), (e) => e.code === 'deadline');
});
test('room admission is bounded at thirty requests per actor per minute', async (t) => {
  const f = await fixture(t);
  for (let i = 0; i < 30; i++) await f.store.admit('rate-test', 1_000_000);
  await assert.rejects(f.store.admit('rate-test', 1_000_000), (e) => e.status === 429);
});

test('successful atomic answer write stamps receipt and plausibility from the database clock', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  const issued = Date.now() - 1200;
  r.round.issuedAt = [issued, issued];
  r.round.answers[0] = {
    attemptId: token(),
    choice: r.round.question.correctIndex,
    correct: true,
    elapsedMs: 1000,
    receivedAt: 0,
    serverElapsedMs: 0,
    residualMs: 0,
    graceMs: 500,
    timingOK: false,
  };
  const row = await f.store.read(f.host.roomId);
  const out = await f.store.commitAttempt(f.host.roomId, row.revision, r, 0, { databaseClock: true, now: 0 });
  const durable = JSON.parse(out.state),
    answer = durable.round.answers[0];
  assert.ok(answer.receivedAt >= issued + 1200 - 2);
  assert.equal(answer.serverElapsedMs, answer.receivedAt - issued);
  assert.equal(answer.residualMs, answer.serverElapsedMs - 1000);
  assert.equal(answer.timingOK, true);
  assert.equal(durable.settled, false);
});
test('atomic SQL write refuses a receipt at or beyond the acceptance deadline', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  const issued = Date.now() - 11_000;
  r.round.issuedAt = [issued, issued];
  r.round.answers[0] = { attemptId: token(), choice: 0, correct: true, elapsedMs: 9900, graceMs: 500 };
  const row = await f.store.read(f.host.roomId);
  const out = await f.store.commitAttempt(f.host.roomId, row.revision, r, 0, {
    databaseClock: true,
    now: issued + 10_000,
  });
  assert.equal(out, null);
  assert.equal(JSON.parse((await f.store.read(f.host.roomId)).state).round.answers[0], null);
});
test('timeout racing a stalled proposed write cannot create a backdated accepted answer', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  f.advance(10_000);
  await f.answer(f.guest, r, 9800);
  const original = f.store.commitAttempt.bind(f.store);
  let release, entered;
  const held = new Promise((resolve) => (release = resolve)),
    reached = new Promise((resolve) => (entered = resolve));
  f.store.commitAttempt = async (...args) => {
    entered();
    await held;
    return original(...args);
  };
  const delayed = f.call(f.host, 'answer', {
    roundId: r.round.id,
    attemptId: token(),
    choice: r.round.question.correctIndex,
    elapsedMs: 9600,
  });
  await reached;
  f.advance(4000);
  await f.call(f.guest, 'state');
  release();
  await assert.rejects(delayed, (e) => e.code === 'round_closed');
  const out = await f.raw();
  assert.equal(out.round.answers[0], null);
  assert.equal(out.winner, 1);
  coins(out);
});

test('committed answer is visible before finalization and cannot be erased by timeout', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  f.advance(10_000);
  const body = {
    roundId: r.round.id,
    attemptId: token(),
    choice: r.round.question.correctIndex,
    elapsedMs: 9600,
  };
  const locked = (await f.call(f.host, 'answer', body)).room;
  assert.equal(locked.round.answerLocked[0], true);
  assert.equal(locked.round.result, null);
  f.advance(4000);
  const out = (await f.call(f.guest, 'state')).room;
  assert.equal(out.winner, 0);
  assert.equal(out.round.receipts[0].elapsedMs, 9600);
  coins(await f.raw());
});

test('atomic reveal uses database write time and refuses stale release windows', async (t) => {
  const f = await fixture(t),
    r = await f.prepare(),
    time = Date.now();
  r.round.scheduledAt = time - 1000;
  r.round.issuedAt = [null, null];
  let row = await f.store.read(f.host.roomId);
  const saved = await f.store.commitReveal(f.host.roomId, row.revision, r, 0, {
    databaseClock: true,
    now: 0,
  });
  assert.ok(JSON.parse(saved.state).round.issuedAt[0] >= time - 2);
  row = await f.store.read(f.host.roomId);
  r.round.scheduledAt = time - RULES.showWindowMs - 1000;
  const late = await f.store.commitReveal(f.host.roomId, row.revision, r, 1, {
    databaseClock: true,
    now: time - 5000,
  });
  assert.equal(late, null);
});

test('the timer is 5, 7 or 10 seconds and every format opens on one of them', () => {
  assert.deepEqual([...DURATIONS], [5, 7, 10]);
  // Every format's opening clock must itself be selectable, or the launch screen would ship a
  // config the server rejects.
  for (const mode of Object.keys(MODE_ROUNDS)) {
    assert.ok(DURATIONS.includes(MODE_DURATION[mode]), mode);
    assert.equal(
      normalizeConfig({ ...config, mode, duration: MODE_DURATION[mode] }, QUESTIONS).duration,
      MODE_DURATION[mode],
    );
  }
  assert.equal(MODE_DURATION.quick, 10);
  // The retired timers, and everything else that could arrive over the wire, are refused.
  for (const duration of [15, 30, 0, -5, 4, 11, 7.5, '7', null, [7], { valueOf: () => 7 }])
    assert.throws(() => normalizeConfig({ ...config, duration }, QUESTIONS), /valid timer/);
});
test('the bot still answers inside the shortest timer', () => {
  // planBotAttempt samples 1000..duration*1000-500, which is only a range if the timer clears 1.5s.
  for (const duration of DURATIONS)
    for (const roll of [0, 0.5, 1 - Number.EPSILON]) {
      const { elapsedMs } = planBotAttempt(duration, () => roll);
      assert.ok(elapsedMs >= 1000 && elapsedMs < duration * 1000, `${duration}s -> ${elapsedMs}ms`);
    }
});
test('mode validation rejects coercible arrays and objects', () => {
  for (const mode of [['gauntlet'], { toString: () => 'quick' }, null, 4, 'constructor', 'toString']) {
    assert.throws(() => normalizeConfig({ ...config, mode }, QUESTIONS));
  }
  assert.equal(normalizeConfig({ ...config, mode: 'gauntlet' }, QUESTIONS).mode, 'gauntlet');
});
test('Gauntlet plays all five rounds including decisive leads and draws; entry settles once', async (t) => {
  for (const draw of [false, true]) {
    const f = await fixture(t, { mode: 'gauntlet' }),
      questionIds = new Set();
    for (let i = 0; i < 5; i++) {
      const r = await f.prepare();
      questionIds.add(r.round.question.id);
      assert.equal(r.escrow, 50);
      assert.deepEqual(r.balances, [975, 975]);
      f.advance(1200);
      await Promise.all([
        f.answer(
          f.host,
          r,
          1000,
          draw ? (r.round.question.correctIndex + 1) % 4 : r.round.question.correctIndex,
        ),
        f.answer(f.guest, r, 1151, (r.round.question.correctIndex + 2) % 4),
      ]);
      const after = await f.raw();
      coins(after);
      assert.equal(after.phase, i === 4 ? 'complete' : 'between');
      assert.equal(after.settled, i === 4);
    }
    const end = await f.raw();
    assert.equal(questionIds.size, 5);
    assert.equal(end.winner, draw ? null : 0);
    assert.deepEqual(end.balances, draw ? [1000, 1000] : [1025, 975]);
    assert.equal(end.events.filter((e) => e.type === 'settled').length, 1);
  }
});

test('stable fact identity is disclosed only after settlement and matches the source card', async (t) => {
  const f = await fixture(t),
    r = await f.prepare();
  const playing = (await f.call(f.host, 'state')).room;
  assert.equal(playing.round.question.factId, undefined);
  assert.equal(playing.round.question.id, r.round.id);
  f.advance(1200);
  await Promise.all([f.answer(f.host, r, 1000), f.answer(f.guest, r, 1151)]);
  const ended = (await f.call(f.host, 'state')).room;
  assert.equal(ended.round.question.factId, r.round.question.id);
  assert.equal(ended.createdAt, 1000000);
});
test('open untimed practice returns three distinct sourced cards without touching a room or coins', async () => {
  const out = await dispatch(null, { action: 'practice', topic: 'Cricket' }, { rng: () => 0.51 });
  assert.equal(out.practice, true);
  assert.equal(out.cards.length, 3);
  assert.equal(new Set(out.cards.map((q) => q.factId)).size, 3);
  assert.equal(out.room, undefined);
  for (const q of out.cards) {
    assert.equal(q.topic, 'Cricket');
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.sourceUrl.startsWith('https://'));
    assert.ok(Number.isInteger(q.correctIndex));
  }
  await assert.rejects(dispatch(null, { action: 'practice', topic: ['Space'] }));
});

test('five-round recap persists closed snapshots once without exposing active answers or credentials', async (t) => {
  const f = await fixture(t, { mode: 'gauntlet' });
  for (let i = 0; i < 5; i++) {
    const r = await f.prepare(),
      active = (await f.call(f.host, 'state')).room;
    assert.equal(active.completedRounds.length, i);
    assert.equal(active.round.question.correctIndex, undefined);
    f.advance(2200);
    await f.answer(f.host, r, 2100);
    assert.equal((await f.call(f.guest, 'state')).room.completedRounds.length, i);
    const closed = (await f.answer(f.guest, r, 2100, (r.round.question.correctIndex + 1) % 4)).room;
    assert.equal(closed.completedRounds.length, i + 1);
    assert.equal(closed.completedRounds[i].index, i);
    assert.equal(closed.completedRounds[i].question.factId, r.round.question.id);
    assert.equal(closed.completedRounds[i].result.winner, 0);
    const history = JSON.stringify(closed.completedRounds);
    for (const secret of ['attemptId', 'receivedAt', 'inviteHash', 'hostHash', f.host.token, f.guest.token])
      assert.equal(history.includes(secret), false);
    await f.call(f.host, 'state');
    assert.equal((await f.call(f.host, 'state')).room.completedRounds.length, i + 1);
    coins(closed);
  }
  const final = (await f.call(f.host, 'state')).room;
  assert.equal(final.phase, 'complete');
  assert.equal(final.completedRounds.length, 5);
  assert.equal(new Set(final.completedRounds.map((x) => x.id)).size, 5);
});
