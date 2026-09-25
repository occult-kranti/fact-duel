/**
 * HISAAB DO — the bank registry against the charter contract, and the bank module the duel service
 * reads in the edition build. See docs/hisaab/CHARTER.md §3 and docs/hisaab/ENGINE.md.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { checkBank, checkItem, SECTORS, STATES } from '../editions/hisaab/bank/schema.mjs';
import { LANES, BANK } from '../editions/hisaab/bank/index.mjs';
import { QUESTIONS, ALL_QUESTIONS, HIDDEN_COUNT } from '../editions/hisaab/server/bank.mjs';

// Everything imported dynamically below sees the edition's module graph (editions/hisaab/aliases.mjs).
register('../editions/hisaab/node-aliases.mjs', import.meta.url);

test('every registered lane passes the charter contract (checkBank)', () => {
  assert.ok(Object.keys(LANES).length > 0, 'at least one lane is registered');
  assert.deepEqual(checkBank(LANES), []);
});

test('BANK is every lane flattened in registry order, frozen, ids unique', () => {
  assert.deepEqual(
    BANK.map((q) => q.id),
    Object.values(LANES).flatMap((lane) => lane.map((q) => q.id)),
  );
  assert.ok(Object.isFrozen(BANK) && Object.isFrozen(LANES));
  for (const lane of Object.values(LANES)) assert.ok(Object.isFrozen(lane), 'each lane array is frozen');
  assert.equal(new Set(BANK.map((q) => q.id)).size, BANK.length);
});

test('the edition bank module exports what the duel service needs', () => {
  assert.ok(QUESTIONS.length > 0);
  assert.ok(Object.isFrozen(QUESTIONS));
  assert.equal(ALL_QUESTIONS, BANK);
  assert.equal(HIDDEN_COUNT, ALL_QUESTIONS.length - QUESTIONS.length);
  for (const q of QUESTIONS) {
    // The fields lib/server/room-engine.mjs (normalizeConfig, chooseDeck, projection) and the
    // expedition/practice dealers in lib/server/duel-service.mjs read.
    for (const key of ['id', 'domain', 'region', 'topic', 'subtopic', 'difficulty', 'question', 'explanation', 'sourceUrl', 'sourceLabel'])
      assert.equal(typeof q[key], 'string', `${q.id}.${key}`);
    assert.equal(q.options.length, 4);
    assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4);
    assert.equal(q.domain, 'civics');
    assert.ok(SECTORS.includes(q.topic));
    assert.ok(Object.hasOwn(STATES, q.state));
    assert.deepEqual(checkItem(q), []);
  }
});

test('through the alias table the duel service serves the civics bank: catalogue, practice, expeditions, a bot room', async () => {
  const { dispatch, catalogue } = await import('../lib/server/duel-service.mjs');
  const { MemoryRoomStore } = await import('../lib/duel-memory-store.mjs');
  const { ACTIVE_EXPEDITIONS, validExpeditionCards } = await import('../lib/expeditions.mjs');
  const served = await import('../lib/server/bank.mjs');
  assert.equal(served.QUESTIONS, QUESTIONS, 'lib/server/bank.mjs resolves to the edition bank');

  const cat = catalogue();
  assert.equal(cat.count, QUESTIONS.length);
  assert.ok(cat.topics.every((t) => t.domain === 'civics' && SECTORS.includes(t.topic)));

  const practice = await dispatch(null, { action: 'practice' });
  const ids = new Set(QUESTIONS.map((q) => q.id));
  assert.ok(practice.cards.length > 0 && practice.cards.every((c) => ids.has(c.factId)));

  assert.ok(ACTIVE_EXPEDITIONS.length > 0, 'the bank supports at least one route');
  for (const route of ACTIVE_EXPEDITIONS) {
    const data = await dispatch(null, { action: 'expedition', routeId: route.id });
    assert.ok(validExpeditionCards(data.cards, route), `${route.id} deals six valid cards`);
  }

  let t = 1_800_000_000_000;
  const store = new MemoryRoomStore({ clock: () => t });
  const seat = { roomId: 'a'.repeat(32), token: 'T'.repeat(40) };
  const created = await dispatch(
    store,
    {
      action: 'create',
      ...seat,
      invite: 'I'.repeat(40),
      name: 'Tester',
      config: { mode: 'quick', stake: 0, duration: 10, opponent: 'bot' },
    },
    { now: t, useDatabaseClock: true },
  );
  assert.equal(created.room.players[1].kind, 'bot');
  await dispatch(store, { action: 'ready', ...seat, roundId: null }, { now: t, useDatabaseClock: true });
  t += 3000;
  const shown = await dispatch(store, { action: 'reveal', ...seat, roundId: `${seat.roomId}:0` }, { now: t, useDatabaseClock: true });
  assert.ok(
    QUESTIONS.some((q) => q.question === shown.room.round.question.question),
    'the dealt question is a civics bank item',
  );
});
