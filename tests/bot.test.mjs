import test from 'node:test';
import assert from 'node:assert/strict';
import { D1RoomStore, dispatch } from '../lib/server/duel-service.mjs';
import { DURATIONS, planBotAttempt } from '../lib/server/room-engine.mjs';
import { LocalD1 } from './d1-local.mjs';

const token = () => crypto.randomUUID().replaceAll('-', '') + '1234567890abcdef';
async function fixture(t, config = {}) {
  const db = new LocalD1(),
    store = new D1RoomStore(db);
  t.after(() => db.close());
  let now = 1_000_000;
  const host = { roomId: crypto.randomUUID().replaceAll('-', ''), token: token(), invite: token() };
  const call = (action, extra = {}) =>
    dispatch(store, { ...host, action, ...extra }, { now, actor: host.token, rng: () => 0.51 });
  await call('create', {
    name: 'Human',
    config: { mode: 'quick', stake: 25, duration: 10, opponent: 'bot', ...config },
  });
  const raw = async () => JSON.parse((await store.read(host.roomId)).state);
  const prepare = async () => {
    const prior = await raw();
    const start = (await call('ready', { roundId: prior.round?.id ?? null })).room;
    assert.equal(start.phase, 'scheduled');
    now = start.round.scheduledAt;
    await call('reveal', { roundId: start.round.id });
    return raw();
  };
  return { host, store, raw, call, prepare, setTime: (t) => (now = t) };
}
const conserved = (r) => assert.equal(r.balances[0] + r.balances[1] + r.escrow, 2000);

test('bot planner samples each choice and both delay endpoints without question inputs', () => {
  for (const duration of DURATIONS)
    for (const choice of [0, 1, 2, 3])
      for (const timeSample of [0, 1 - Number.EPSILON]) {
        const samples = [(choice + 0.5) / 4, timeSample];
        assert.deepEqual(
          planBotAttempt(duration, () => samples.shift()),
          { choice, elapsedMs: timeSample === 0 ? 1000 : duration * 1000 - 500 },
        );
      }
});

test('bots finish all three modes with every timer; readiness, secrecy and coins survive retries', async (t) => {
  for (const mode of ['quick', 'trilogy', 'gauntlet'])
    for (const duration of DURATIONS) {
      const f = await fixture(t, { mode, duration }),
        plans = (await f.raw()).botPlans;
      let rounds = 0;
      do {
        const r = await f.prepare(),
          plan = plans[r.roundIndex];
        rounds++;
        assert.equal(r.round.issuedAt[0], r.round.issuedAt[1]);
        const before = (await f.call('state')).room;
        assert.equal(before.players[1].kind, 'bot');
        assert.equal(before.botPlans, undefined);
        assert.equal(before.round.receipts, null);
        assert.equal(before.round.question.correctIndex, undefined);
        f.setTime(r.round.issuedAt[0] + 500);
        await f.call('answer', {
          roundId: r.round.id,
          attemptId: token(),
          choice: (r.round.question.correctIndex + 1) % 4,
          elapsedMs: 500,
        });
        f.setTime(r.round.issuedAt[1] + plan.elapsedMs - 1);
        assert.equal((await f.call('state')).room.round.answerLocked[1], false);
        f.setTime(r.round.issuedAt[1] + plan.elapsedMs);
        await Promise.all(Array.from({ length: 6 }, () => f.call('state')));
        const after = await f.raw();
        assert.equal(after.round.answers[1].choice, plan.choice);
        assert.equal(after.round.answers[1].elapsedMs, plan.elapsedMs);
        assert.equal(after.round.answers[1].simulated, true);
        assert.deepEqual(after.botPlans, plans);
        conserved(after);
        assert.equal(after.events.filter((e) => e.type === 'bot_attempt_locked').length, rounds);
        if (after.phase === 'between') assert.equal(after.players[1].ready, true);
      } while (!(await f.raw()).settled);
      const end = await f.raw();
      assert.equal(end.phase, 'complete');
      assert.equal(end.events.filter((e) => e.type === 'settled').length, 1);
      assert.ok(
        mode === 'quick' ? rounds === 1 : mode === 'gauntlet' ? rounds === 5 : rounds === 2 || rounds === 3,
      );
    }
});

test('a delayed poll preserves the scheduled bot time and closes a human timeout once', async (t) => {
  const f = await fixture(t),
    r = await f.prepare(),
    plan = r.botPlans[0];
  f.setTime(r.round.issuedAt[0] + 40_000);
  const out = (await f.call('state')).room;
  assert.equal(out.phase, 'complete');
  assert.equal(out.round.receipts[0], null);
  assert.equal(out.round.receipts[1].elapsedMs, plan.elapsedMs);
  assert.equal(out.round.receipts[1].simulated, true);
  await Promise.all(Array.from({ length: 8 }, () => f.call('state')));
  const end = await f.raw();
  assert.equal(end.events.filter((e) => e.type === 'settled').length, 1);
  conserved(end);
});

test('adding a bot is idempotent and cannot replace a human racing to join', async (t) => {
  const f = await fixture(t, { opponent: 'friend' });
  await f.call('add_bot');
  const first = await f.raw();
  await f.call('add_bot');
  assert.deepEqual((await f.raw()).botPlans, first.botPlans);
  const g = await fixture(t, { opponent: 'friend' });
  const results = await Promise.allSettled([
    g.call('add_bot'),
    g.call('join', { token: token(), name: 'Friend' }),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const room = await g.raw();
  assert.equal(room.players.filter(Boolean).length, 2);
  conserved(room);
  if (room.players[1].kind !== 'bot') assert.equal(room.botPlans, undefined);
});

test('bot reveal shares the atomic database timestamp; cancelling prevents its scheduled answer', async (t) => {
  const f = await fixture(t),
    r = await f.prepare(),
    time = Date.now();
  r.round.scheduledAt = time - 1000;
  r.round.issuedAt = [null, null];
  const row = await f.store.read(f.host.roomId);
  const saved = await f.store.commitReveal(f.host.roomId, row.revision, r, 0, {
    databaseClock: true,
    now: 0,
  });
  const durable = JSON.parse(saved.state);
  assert.ok(durable.round.issuedAt[0] >= time - 2);
  assert.equal(durable.round.issuedAt[0], durable.round.issuedAt[1]);
  f.setTime(time + 100);
  await f.call('leave');
  f.setTime(time + 40_000);
  await f.call('state');
  const end = await f.raw();
  assert.equal(end.phase, 'cancelled');
  assert.equal(end.round.answers[1], null);
  assert.deepEqual(end.balances, [1000, 1000]);
  conserved(end);
});
