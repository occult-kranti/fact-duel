/**
 * tests/duel-memory.test.mjs — proves `MemoryRoomStore` (the store the static build runs on) is
 * equivalent to `D1RoomStore` (the store the deployed worker runs on).
 *
 * Equivalence is not asserted by reading the code: every test below runs the SAME script against
 * BOTH stores and compares the transcripts — the rows a store returns, the projections
 * `dispatch()` returns, the errors it throws, and the rows left in storage afterwards. A guard that
 * silently went missing in the memory implementation (the revision compare-and-swap, the reveal
 * window, the receipt deadline, insert-or-ignore, the admission limit, the expiry sweep) shows up
 * as a diff in the transcript rather than as a surprise offline.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { D1RoomStore, dispatch } from '../lib/server/duel-service.mjs';
import { MemoryRoomStore } from '../lib/duel-memory-store.mjs';
import { DURATIONS, MODE_ROUNDS, RULES, makeRoom } from '../lib/server/room-engine.mjs';
import { QUESTIONS } from '../lib/server/bank.mjs';
import { LocalD1 } from './d1-local.mjs';

/* ------------------------------------------------------------------------------ harness ----- */

/** Deterministic rng so both stores see identical decks, shuffles and bot plans. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const roomId = (seed) => (seed >>> 0).toString(16).padStart(8, '0').repeat(4);
const tokenOf = (label) => `${label}_abcdefghijklmnopqrstuvwxyz0123456789`.slice(0, 40);
const CONFIG = { mode: 'quick', stake: 25, duration: 10, opponent: 'friend' };

/** Both implementations, plus a way to read what each one actually stored. */
function pair(t, { yieldIO = false } = {}) {
  const db = new LocalD1({ yieldIO });
  t.after(() => db.close());
  return [
    {
      name: 'D1RoomStore',
      store: new D1RoomStore(db),
      rooms: () => db.sqlite.prepare('SELECT id,revision,state,expires_at FROM rooms ORDER BY id').all(),
      limits: () => db.sqlite.prepare('SELECT key,count,expires_at FROM admission_limits ORDER BY key').all(),
    },
    {
      name: 'MemoryRoomStore',
      // The SQLite adapter yields with setImmediate; matching it keeps concurrent interleavings
      // comparable instead of merely similar.
      store: new MemoryRoomStore({ yieldIO: yieldIO ? () => setImmediate() : false }),
      rooms() {
        return [...this.store.rooms.values()]
          .map(({ id, revision, state, expires_at }) => ({ id, revision, state, expires_at }))
          .sort((a, b) => (a.id < b.id ? -1 : 1));
      },
      limits() {
        return [...this.store.limits.values()]
          .map(({ key, count, expires_at }) => ({ key, count, expires_at }))
          .sort((a, b) => (a.key < b.key ? -1 : 1));
      },
    },
  ];
}

/**
 * Comparable form of any store or dispatch result. Room state is compared as parsed JSON, not as
 * text: SQLite serializes a bound JS number as `1100000.0` where `JSON.stringify` writes
 * `1100000`, and every reader of `state` goes through `JSON.parse`.
 */
const plain = (value) =>
  JSON.parse(JSON.stringify(value ?? null), (key, v) =>
    key === 'state' && typeof v === 'string' ? JSON.parse(v) : v,
  );

/** One step's outcome — a value or a thrown GameError — in a comparable, clock-free form. */
async function record(label, run) {
  try {
    return { label, ok: true, value: plain(await run()) };
  } catch (error) {
    return { label, ok: false, message: error.message, code: error.code, status: error.status };
  }
}

/**
 * Run one script against both stores and assert the two transcripts are identical.
 * `script(store, step)` drives the duel; `step(label, run)` records one outcome and returns it.
 */
async function differential(t, script, { yieldIO = false, sortEvents = false } = {}) {
  const sides = pair(t, { yieldIO });
  const logs = [];
  for (const side of sides) {
    const log = [];
    const step = async (label, run) => {
      const entry = await record(label, run);
      log.push(entry);
      return entry;
    };
    await script(side.store, step);
    // SQLite hands back null-prototype rows; compare contents, not prototypes.
    log.push({ label: 'stored rooms', rows: plain(side.rooms()) });
    log.push({ label: 'stored admissions', rows: plain(side.limits()) });
    logs.push(sortEvents ? canonicalEvents(log) : log);
  }
  assert.deepEqual(logs[1], logs[0], 'MemoryRoomStore diverged from D1RoomStore');
  return logs[0];
}

/**
 * Two requests that arrive at the same instant may be applied in either order — by SQLite or by
 * the memory store — so an event log can hold the same events at the same timestamp in either
 * order. Sorting event lists canonically keeps the comparison about WHAT happened.
 */
function canonicalEvents(value) {
  if (Array.isArray(value)) return value.map(canonicalEvents);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [
      key,
      key === 'events' && Array.isArray(v)
        ? [...v].map(canonicalEvents).sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1))
        : canonicalEvents(v),
    ]),
  );
}

/** A duel driver that speaks only through `dispatch`, so both stores run the identical script. */
function table(store, { seed = 7, start = 1_000_000, rooms = 1, actor = null } = {}) {
  const rng = seeded(seed);
  const seats = Array.from({ length: rooms }, (_, i) => ({
    host: { roomId: roomId(i + 1), token: tokenOf(`host${i}`), invite: tokenOf(`invite${i}`) },
    guest: { roomId: roomId(i + 1), token: tokenOf(`guest${i}`), invite: tokenOf(`invite${i}`) },
  }));
  let now = start;
  return {
    seats,
    host: seats[0].host,
    guest: seats[0].guest,
    at: () => now,
    advance(ms) {
      return (now += ms);
    },
    setTime(value) {
      return (now = value);
    },
    call: (seat, action, extra = {}) =>
      dispatch(store, { ...seat, action, ...extra }, { now, actor: actor ?? seat.token, rng }),
    raw: async (seat = seats[0].host) => JSON.parse((await store.read(seat.roomId)).state),
  };
}

/** The stored columns of a room row, without the live `db_now` clock the two stores cannot share. */
const storedRow = async (store, id) => {
  const row = await store.read(id);
  return row && { revision: row.revision, state: row.state, expires_at: row.expires_at };
};

/** A room object shaped like one mid-duel, for the store-level tests. */
function roomFixture({ id, opponent = 'friend', now = 1_000_000 }) {
  const room = makeRoom({
    id,
    hostHash: 'a'.repeat(64),
    inviteHash: 'b'.repeat(64),
    name: 'A',
    config: { ...CONFIG, opponent },
    deck: [QUESTIONS[0]],
    now,
  });
  room.players[1] =
    opponent === 'bot'
      ? { hash: null, name: 'Lucky Guess · BOT', kind: 'bot', ready: true, rttMs: 0, jitterMs: 0 }
      : { hash: 'c'.repeat(64), name: 'B', ready: true, rttMs: 0, jitterMs: 0 };
  return room;
}

/* -------------------------------------------------------------------- store-level contracts - */

test('read, insert and compareSwap return the same rows and keep the same revision guard', async (t) => {
  await differential(t, async (store, step) => {
    const base = roomFixture({ id: roomId(3) });
    await step('a missing room reads null', () => store.read(base.id));
    await step('the first insert wins', () => store.insert(base));
    await step('a second insert for the same id is ignored', () => store.insert({ ...base, createdAt: 5 }));
    await step('the row after insert', async () => {
      const live = await store.read(base.id);
      assert.ok(
        Number.isInteger(live.db_now) && Math.abs(live.db_now - Date.now()) < 5000,
        'db_now is a live clock',
      );
      return storedRow(store, base.id);
    });
    await step('a stale revision cannot swap', () => store.compareSwap(base.id, 7, { ...base, phase: 'x' }));
    await step('the matching revision swaps', () =>
      store.compareSwap(base.id, 0, { ...base, phase: 'between' }),
    );
    await step('the same revision cannot swap twice', () =>
      store.compareSwap(base.id, 0, { ...base, phase: 'complete' }),
    );
    await step('the row after the swap', () => storedRow(store, base.id));
    await step('a swap against a missing room', () => store.compareSwap(roomId(99), 0, base));
  });
});

test('commitReveal applies only inside the release window and shares the bot stamp', async (t) => {
  await differential(t, async (store, step) => {
    const scheduledAt = 1_100_000;
    const room = roomFixture({ id: roomId(4), opponent: 'bot' });
    room.phase = 'scheduled';
    room.round = {
      id: `${room.id}:0`,
      scheduledAt,
      issuedAt: [null, null],
      answers: [null, null],
      question: room.deck[0],
      result: null,
    };
    await store.insert(room);
    const reveal = (revision, seat, now) =>
      store.commitReveal(room.id, revision, room, seat, { databaseClock: false, now });
    await step('one millisecond early is refused', () => reveal(0, 0, scheduledAt - 1));
    await step('the closing edge is refused', () => reveal(0, 0, scheduledAt + RULES.showWindowMs));
    await step('a stale revision is refused inside the window', () => reveal(5, 0, scheduledAt + 10));
    await step('the opening edge applies and stamps the bot too', () => reveal(0, 0, scheduledAt));
    await step('the last millisecond of the window applies', () =>
      reveal(1, 1, scheduledAt + RULES.showWindowMs - 1),
    );
    await step('the row after the reveals', () => storedRow(store, room.id));
  });
});

test('commitAttempt stamps the receipt, scores plausibility and stops at the deadline', async (t) => {
  await differential(t, async (store, step) => {
    const issued = 1_200_000;
    const room = roomFixture({ id: roomId(5) });
    room.phase = 'playing';
    room.round = {
      id: `${room.id}:0`,
      scheduledAt: issued - 3000,
      issuedAt: [issued, issued],
      answers: [null, null],
      question: room.deck[0],
      result: null,
    };
    await store.insert(room);
    const attempt = async (revision, seat, now) => {
      room.round.answers[seat] = {
        attemptId: 'a'.repeat(20),
        choice: 1,
        elapsedMs: 1000,
        receivedAt: 0,
        serverElapsedMs: 0,
        residualMs: 0,
        graceMs: 500,
        timingOK: false,
        correct: true,
      };
      const out = await store.commitAttempt(room.id, revision, room, seat, { databaseClock: false, now });
      room.round.answers[seat] = null;
      return out;
    };
    const deadline = issued + CONFIG.duration * 1000 + 500;
    await step('at the deadline the write is refused', () => attempt(0, 0, deadline));
    await step('past the deadline the write is refused', () => attempt(0, 0, deadline + 1));
    await step('a stale revision is refused before the deadline', () => attempt(4, 0, issued + 1200));
    await step('one millisecond before the deadline applies', () => attempt(0, 0, deadline - 1));
    await step('plausible timing is accepted', () => attempt(1, 1, issued + 1200));
    await step('the -100ms edge stays plausible', () => attempt(2, 0, issued + 900));
    await step('101ms early is implausible', () => attempt(3, 0, issued + 899));
    await step('the grace edge stays plausible', () => attempt(4, 0, issued + 1500));
    await step('one millisecond past grace is implausible', () => attempt(5, 0, issued + 1501));
    await step('the row after the attempts', () => storedRow(store, room.id));
  });
});

test('the database clock stamps reveals and receipts with wall time in both stores', async (t) => {
  for (const side of pair(t)) {
    const room = roomFixture({ id: roomId(6), now: Date.now() });
    room.phase = 'playing';
    room.round = {
      id: `${room.id}:0`,
      scheduledAt: Date.now() - 1000,
      issuedAt: [null, null],
      answers: [null, null],
      question: room.deck[0],
      result: null,
    };
    await side.store.insert(room);
    const before = Date.now();
    assert.ok((await side.store.clock()).db_now >= before - 2, `${side.name} clock()`);
    const revealed = await side.store.commitReveal(room.id, 0, room, 0, { databaseClock: true, now: 0 });
    const stampedAt = JSON.parse(revealed.state).round.issuedAt[0];
    assert.ok(stampedAt >= before - 2 && stampedAt <= Date.now(), `${side.name} reveal stamp`);

    const issued = Date.now() - 1200;
    room.round.issuedAt = [issued, issued];
    room.round.answers[0] = {
      attemptId: 'a'.repeat(20),
      choice: 1,
      elapsedMs: 1000,
      receivedAt: 0,
      serverElapsedMs: 0,
      residualMs: 0,
      graceMs: 500,
      timingOK: false,
      correct: true,
    };
    const saved = await side.store.commitAttempt(room.id, 1, room, 0, { databaseClock: true, now: 0 });
    const answer = JSON.parse(saved.state).round.answers[0];
    assert.ok(answer.receivedAt >= issued + 1200 - 2, `${side.name} receipt stamp`);
    assert.equal(answer.serverElapsedMs, answer.receivedAt - issued, `${side.name} server elapsed`);
    assert.equal(answer.residualMs, answer.serverElapsedMs - 1000, `${side.name} residual`);
    assert.equal(answer.timingOK, true, `${side.name} plausibility`);

    // The same write, one second past the acceptance deadline, is refused by both stores.
    const late = Date.now() - 11_000;
    room.round.issuedAt = [late, late];
    room.round.answers[0].elapsedMs = 9900;
    assert.equal(
      await side.store.commitAttempt(room.id, 2, room, 0, { databaseClock: true, now: 0 }),
      null,
      `${side.name} refuses a late receipt`,
    );
  }
});

test('admission counts per actor per minute and expires the buckets it wrote', async (t) => {
  await differential(t, async (store, step) => {
    const minute = 1_000_000;
    for (let i = 0; i < 30; i++) await store.admit('actor-a', minute);
    await step('the thirty-first request in a minute is refused', () => store.admit('actor-a', minute));
    await step('the refusal still counted', () => store.admit('actor-a', minute));
    await step('another actor is unaffected', () => store.admit('actor-b', minute));
    await step('the next minute starts a new bucket', () => store.admit('actor-a', minute + 60_000));
    await step('cleanup keeps live buckets', () => store.cleanup(minute));
    await step('cleanup drops buckets past their expiry', () => store.cleanup(minute + 10 * 60_000));
  });
});

test('cleanup drops expired rooms and keeps live ones', async (t) => {
  await differential(t, async (store, step) => {
    const now = 2_000_000;
    for (const [i, expiresAt] of [now - 1, now, now + 1].entries()) {
      const room = roomFixture({ id: roomId(20 + i) });
      room.expiresAt = expiresAt;
      await store.insert(room);
    }
    await step('sweep', () => store.cleanup(now));
    await step('the expired room is gone', () => store.read(roomId(20)));
    await step('the room expiring exactly now survives', () => storedRow(store, roomId(21)));
  });
});

/* ----------------------------------------------------------------- dispatch-level behaviour - */

test('a full bot duel is identical on both stores in all three modes', async (t) => {
  for (const mode of ['quick', 'trilogy', 'gauntlet']) {
    await differential(t, async (store, step) => {
      const f = table(store, { seed: mode.length * 13 });
      await step('create', () =>
        f.call(f.host, 'create', { name: 'Human', config: { ...CONFIG, mode, opponent: 'bot' } }),
      );
      let rounds = 0;
      for (let guard = 0; guard < 12; guard++) {
        const before = await f.raw();
        if (before.settled) break;
        rounds++;
        await step(`ready ${rounds}`, () => f.call(f.host, 'ready', { roundId: before.round?.id ?? null }));
        const scheduled = await f.raw();
        f.setTime(scheduled.round.scheduledAt);
        await step(`reveal ${rounds}`, () => f.call(f.host, 'reveal', { roundId: scheduled.round.id }));
        const issued = await f.raw();
        const plan = issued.botPlans[issued.roundIndex];
        f.setTime(issued.round.issuedAt[0] + 600);
        await step(`answer ${rounds}`, () =>
          f.call(f.host, 'answer', {
            roundId: issued.round.id,
            attemptId: `attempt-${mode}-${rounds}-xxxxxxxx`,
            choice: issued.round.question.correctIndex,
            elapsedMs: 600,
          }),
        );
        f.setTime(issued.round.issuedAt[1] + plan.elapsedMs - 1);
        await step(`the bot is not locked yet ${rounds}`, () => f.call(f.host, 'state'));
        f.setTime(issued.round.issuedAt[1] + plan.elapsedMs);
        await step(`the bot locks on schedule ${rounds}`, () => f.call(f.host, 'state'));
        await step(`a later poll changes nothing ${rounds}`, () => f.call(f.host, 'state'));
      }
      const end = await f.raw();
      await step('final room', async () => end);
      assert.equal(end.settled, true);
      assert.equal(end.phase, 'complete');
      assert.equal(end.balances[0] + end.balances[1] + end.escrow, 2000, 'coins are conserved');
      assert.equal(end.events.filter((e) => e.type === 'settled').length, 1, 'the entry settles once');
      assert.ok(rounds >= 1 && rounds <= MODE_ROUNDS[mode]);
    });
  }
});

test('a two-human trilogy, its receipts and its recap are identical on both stores', async (t) => {
  await differential(t, async (store, step) => {
    const f = table(store, { seed: 42 });
    await step('create', () =>
      f.call(f.host, 'create', { name: 'A', config: { ...CONFIG, mode: 'trilogy' } }),
    );
    await step('join', () => f.call(f.guest, 'join', { name: 'B' }));
    for (let round = 0; round < 2; round++) {
      const before = await f.raw();
      await step(`host ready ${round}`, () =>
        f.call(f.host, 'ready', { roundId: before.round?.id ?? null, rttMs: 40, jitterMs: 10 }),
      );
      await step(`guest ready ${round}`, () =>
        f.call(f.guest, 'ready', { roundId: before.round?.id ?? null, rttMs: 90, jitterMs: 30 }),
      );
      const scheduled = await f.raw();
      f.setTime(scheduled.round.scheduledAt + 20);
      await step(`host reveal ${round}`, () => f.call(f.host, 'reveal', { roundId: scheduled.round.id }));
      await step(`guest reveal ${round}`, () => f.call(f.guest, 'reveal', { roundId: scheduled.round.id }));
      const issued = await f.raw();
      f.advance(1200);
      const attempt = `host-attempt-${round}-xxxxxxxxx`;
      await step(`host answers ${round}`, () =>
        f.call(f.host, 'answer', {
          roundId: issued.round.id,
          attemptId: attempt,
          choice: issued.round.question.correctIndex,
          elapsedMs: 1000,
        }),
      );
      await step(`the same attempt retried is idempotent ${round}`, () =>
        f.call(f.host, 'answer', {
          roundId: issued.round.id,
          attemptId: attempt,
          choice: issued.round.question.correctIndex,
          elapsedMs: 1000,
        }),
      );
      await step(`a changed payload under that attempt is rejected ${round}`, () =>
        f.call(f.host, 'answer', {
          roundId: issued.round.id,
          attemptId: attempt,
          choice: (issued.round.question.correctIndex + 1) % 4,
          elapsedMs: 999,
        }),
      );
      await step(`guest answers 151ms slower ${round}`, () =>
        f.call(f.guest, 'answer', {
          roundId: issued.round.id,
          attemptId: `guest-attempt-${round}-xxxxxxxx`,
          choice: issued.round.question.correctIndex,
          elapsedMs: 1151,
        }),
      );
      await step(`state after round ${round}`, () => f.call(f.host, 'state'));
    }
    const end = await f.raw();
    await step('final room', async () => end);
    assert.equal(end.balances[0] + end.balances[1] + end.escrow, 2000);
    assert.equal(end.winner, 0);
    assert.deepEqual(end.balances, [1025, 975]);
    assert.equal(end.completedRounds.length, 2);
  });
});

test('the reveal window, the receipt deadline and room expiry cancel the same way', async (t) => {
  await differential(t, async (store, step) => {
    const f = table(store, { seed: 5, rooms: 3 });
    const [a, b, c] = f.seats;

    // 1. Nobody opens the question inside the release window.
    await step('create a', () => f.call(a.host, 'create', { name: 'A', config: CONFIG }));
    await step('join a', () => f.call(a.guest, 'join', { name: 'B' }));
    await step('ready a host', () => f.call(a.host, 'ready', { roundId: null }));
    const startA = await step('ready a guest', () => f.call(a.guest, 'ready', { roundId: null }));
    const roundA = startA.value.room.round.id;
    await step('opening before the countdown is refused', () =>
      f.call(a.host, 'reveal', { roundId: roundA }),
    );
    f.advance(3000 + RULES.showWindowMs);
    await step('the closed window cancels the room', () => f.call(a.host, 'state'));

    // 2. One answer lands inside the deadline, the other one millisecond of grace too late.
    await step('create b', () => f.call(b.host, 'create', { name: 'A', config: CONFIG }));
    await step('join b', () => f.call(b.guest, 'join', { name: 'B' }));
    await step('ready b host', () => f.call(b.host, 'ready', { roundId: null }));
    const startB = await step('ready b guest', () => f.call(b.guest, 'ready', { roundId: null }));
    const roundB = startB.value.room.round.id;
    f.advance(3000);
    await step('reveal b host', () => f.call(b.host, 'reveal', { roundId: roundB }));
    await step('reveal b guest', () => f.call(b.guest, 'reveal', { roundId: roundB }));
    f.advance(9_600);
    await step('an answer inside the timer is accepted', () =>
      f.call(b.host, 'answer', {
        roundId: roundB,
        attemptId: 'b-host-attempt-xxxxxxxxxx',
        choice: 0,
        elapsedMs: 9_500,
      }),
    );
    f.advance(1_000);
    await step('an answer past the receipt deadline is refused', () =>
      f.call(b.guest, 'answer', {
        roundId: roundB,
        attemptId: 'b-guest-attempt-xxxxxxxxx',
        choice: 0,
        elapsedMs: 9_999,
      }),
    );
    f.advance(1_000);
    await step('the round closes on the receipts it has', () => f.call(b.host, 'state'));

    // 3. A room that outlives its TTL refunds both players.
    await step('create c', () => f.call(c.host, 'create', { name: 'A', config: CONFIG }));
    await step('join c', () => f.call(c.guest, 'join', { name: 'B' }));
    await step('ready c host', () => f.call(c.host, 'ready', { roundId: null }));
    await step('ready c guest', () => f.call(c.guest, 'ready', { roundId: null }));
    f.advance(RULES.ttlMs);
    await step('the expired room refunds', () => f.call(c.host, 'state'));
  });
});

test('eight racing joins seat exactly one guest on both stores', async (t) => {
  for (const side of pair(t, { yieldIO: true })) {
    const host = { roomId: roomId(77), token: tokenOf('racehost'), invite: tokenOf('raceinvite') };
    await dispatch(side.store, { ...host, action: 'create', name: 'Host', config: CONFIG }, { now: 1 });
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) =>
        dispatch(
          side.store,
          { ...host, token: tokenOf(`racer${i}`), action: 'join', name: `G${i}` },
          { now: 1, actor: `racer${i}` },
        ),
      ),
    );
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1, `${side.name} seats one guest`);
    for (const rejected of results.filter((r) => r.status === 'rejected'))
      assert.equal(rejected.reason.code, 'room_full', `${side.name} rejects the rest as full`);
    const room = JSON.parse((await side.store.read(host.roomId)).state);
    assert.equal(room.players.filter(Boolean).length, 2, `${side.name} keeps two seats`);
    assert.equal(room.balances[0] + room.balances[1] + room.escrow, 2000);
  }
});

test('concurrent readiness, reveals, answers and polling resolve identically', async (t) => {
  await differential(
    t,
    async (store, step) => {
      const f = table(store, { seed: 11 });
      await step('create', () => f.call(f.host, 'create', { name: 'A', config: CONFIG }));
      await step('join', () => f.call(f.guest, 'join', { name: 'B' }));
      // Which of two simultaneous requests wins a revision is the scheduler's choice, not the
      // store's contract: compare how many were accepted and how the room ended up, not the order.
      const race = async (label, calls) => {
        const out = await Promise.allSettled(calls);
        return step(label, async () => ({
          fulfilled: out.filter((r) => r.status === 'fulfilled').length,
          codes: out
            .filter((r) => r.status === 'rejected')
            .map((r) => r.reason.code)
            .sort(),
          room: plain(await f.raw()),
        }));
      };
      await race('both ready at once', [
        f.call(f.host, 'ready', { roundId: null }),
        f.call(f.guest, 'ready', { roundId: null }),
      ]);
      const scheduled = await f.raw();
      f.setTime(scheduled.round.scheduledAt);
      await race('both reveal at once', [
        f.call(f.host, 'reveal', { roundId: scheduled.round.id }),
        f.call(f.guest, 'reveal', { roundId: scheduled.round.id }),
      ]);
      f.advance(1200);
      await race('both answers race', [
        f.call(f.host, 'answer', {
          roundId: scheduled.round.id,
          attemptId: 'race-host-attempt-xxxxxxx',
          choice: 0,
          elapsedMs: 1000,
        }),
        f.call(f.guest, 'answer', {
          roundId: scheduled.round.id,
          attemptId: 'race-guest-attempt-xxxxxx',
          choice: 1,
          elapsedMs: 1151,
        }),
      ]);
      await step('ten concurrent polls', async () => {
        const out = await Promise.all(Array.from({ length: 10 }, () => f.call(f.host, 'state')));
        return out.map((x) => [x.room.phase, x.room.settled, x.room.balances, x.room.winner]);
      });
      const end = await f.raw();
      await step('final room', async () => end);
      assert.equal(end.balances[0] + end.balances[1] + end.escrow, 2000);
      assert.equal(end.events.filter((e) => e.type === 'settled').length, 1);
      assert.equal(end.round.answers.filter(Boolean).length, 2, 'both attempts were sealed');
    },
    { yieldIO: true, sortEvents: true },
  );
});

test('room creation is rate limited per actor identically through dispatch', async (t) => {
  await differential(t, async (store, step) => {
    const f = table(store, { seed: 9, rooms: 32, actor: 'one-device' });
    for (let i = 0; i < 30; i++)
      await f.call(f.seats[i].host, 'create', { name: `P${i}`, config: { ...CONFIG, opponent: 'bot' } });
    await step('the thirty-first room in a minute is refused', () =>
      f.call(f.seats[30].host, 'create', { name: 'P30', config: { ...CONFIG, opponent: 'bot' } }),
    );
    await step('reopening an existing room needs no admission', () =>
      f.call(f.seats[0].host, 'create', { name: 'P0', config: { ...CONFIG, opponent: 'bot' } }),
    );
    await step('a different actor is unaffected', () =>
      dispatch(
        store,
        { ...f.seats[31].host, action: 'create', name: 'P31', config: { ...CONFIG, opponent: 'bot' } },
        { now: f.at(), actor: 'another-device', rng: seeded(2) },
      ),
    );
  });
});

test('a randomized duel fuzz produces identical transcripts on both stores', async (t) => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    await differential(t, async (store, step) => {
      const pick = seeded(seed * 977);
      const mode = ['quick', 'trilogy', 'gauntlet'][Math.floor(pick() * 3)];
      const duration = DURATIONS[Math.floor(pick() * DURATIONS.length)];
      const withBot = pick() < 0.5;
      const f = table(store, { seed });
      await step('create', () =>
        f.call(f.host, 'create', {
          name: 'A',
          config: { ...CONFIG, mode, duration, opponent: withBot ? 'bot' : 'friend' },
        }),
      );
      if (!withBot) await step('join', () => f.call(f.guest, 'join', { name: 'B' }));
      const players = withBot ? [f.host] : [f.host, f.guest];
      for (let turn = 0; turn < 24; turn++) {
        const room = await f.raw();
        if (room.settled) break;
        const roundId = room.round?.id ?? null;
        const roll = pick();
        if (room.phase === 'waiting' || room.phase === 'between') {
          for (const p of players)
            await step(`t${turn} ready`, () => f.call(p, 'ready', { roundId, rttMs: 60, jitterMs: 20 }));
        } else if (room.round && room.round.issuedAt.some((x) => x === null)) {
          // Open the question at a random point around the release window — sometimes too late.
          f.setTime(room.round.scheduledAt + Math.floor(roll * (RULES.showWindowMs + 2000)));
          for (const p of players) await step(`t${turn} reveal`, () => f.call(p, 'reveal', { roundId }));
        } else {
          // Answer somewhere around the timer — sometimes past the receipt deadline.
          const seat = players[Math.floor(pick() * players.length)];
          const elapsed = Math.floor(roll * duration * 1000 * 1.1);
          f.setTime(room.round.issuedAt[0] + elapsed + Math.floor(pick() * 900));
          await step(`t${turn} answer`, () =>
            f.call(seat, 'answer', {
              roundId,
              attemptId: `fuzz-${seed}-${turn}-xxxxxxxxxxxx`,
              choice: Math.floor(pick() * 4),
              elapsedMs: elapsed,
            }),
          );
          await step(`t${turn} poll`, () => f.call(f.host, 'state'));
        }
        f.advance(Math.floor(pick() * 500));
      }
      const end = await f.raw();
      await step('final room', async () => end);
      assert.equal(end.balances[0] + end.balances[1] + end.escrow, 2000, 'coins are conserved');
      assert.ok(end.events.filter((e) => e.type === 'settled').length <= 1);
    });
  }
});

/* ----------------------------------------------------------------------- the static client -- */

test('the static client maps service results and errors the way the worker does', async () => {
  const { request, OFFLINE_BUILD } = await import('../lib/duel-client-static.ts');
  assert.equal(OFFLINE_BUILD, true);
  const catalogue = await request({ action: 'catalogue' });
  assert.equal(catalogue.catalogue.count, QUESTIONS.length);
  assert.equal((await request({ action: 'practice', topic: 'Cricket' })).cards.length, 3);
  const clock = await request({ action: 'clock' });
  assert.ok(Math.abs(clock.serverNow - Date.now()) < 5000);
  assert.equal(clock.clockSource, 'primary-database');

  // Two-device play is the one thing this build cannot do: it says so instead of hanging.
  const seat = { roomId: roomId(31), token: tokenOf('client'), invite: tokenOf('clientinvite') };
  await assert.rejects(
    request({ action: 'join', ...seat, name: 'A' }),
    (e) => e.status === 501 && e.code === 'offline_build' && /friend duels/i.test(e.message),
  );
  await assert.rejects(
    request({ action: 'create', ...seat, name: 'A', config: { ...CONFIG, opponent: 'friend' } }),
    (e) => e.status === 501 && e.code === 'offline_build',
  );

  // Cohort retention is an aggregate across devices; offline there is nothing to add to.
  for (const action of ['cohort-ping', 'cohort-report'])
    await assert.rejects(
      request({ action, anonId: roomId(2), installDay: '2026-09-01', days: [] }),
      (e) => e.status === 501 && /measurement/i.test(e.message),
    );

  // Everything else keeps the worker's `{message, code, status}` contract.
  await assert.rejects(request({ action: 'state', roomId: 'nope', token: seat.token }), (e) => {
    assert.equal(e.status, 400);
    assert.equal(e.code, 'invalid_request');
    assert.equal(e.message, 'Invalid room link.');
    return true;
  });
  await assert.rejects(request({ action: 'state', roomId: roomId(9), token: seat.token }), (e) => {
    assert.equal(e.status, 404);
    assert.equal(e.code, 'not_found');
    return true;
  });

  const created = await request({
    action: 'create',
    ...seat,
    name: 'Solo',
    config: { ...CONFIG, opponent: 'bot' },
  });
  assert.equal(created.room.players[1].kind, 'bot');
  assert.equal(created.room.round, null);
  const ready = await request({ action: 'ready', ...seat, roundId: null, rttMs: 0, jitterMs: 0 });
  assert.equal(ready.room.phase, 'scheduled');
  // Opening before the shared countdown is the arena's normal early poll, not a user-facing error.
  await assert.rejects(
    request({ action: 'reveal', ...seat, roundId: ready.room.round.id }),
    (e) => e.code === 'too_early' && e.status === 409,
  );
});
