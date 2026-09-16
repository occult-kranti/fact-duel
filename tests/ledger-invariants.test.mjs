/**
 * Property tests over generated activity.
 *
 * The example tests in `ledger-core.test.mjs` prove the cases someone thought of. This file exists
 * for the ones nobody thought of, because a ledger's characteristic failure is silent: a subtly wrong
 * posting does not throw, it makes the books wrong, and you find out months later from a number that
 * does not add up. So: generate a long, plausible sequence of play, run the real invariants after
 * every step, and assert they never break.
 *
 * The generator is seeded rather than random so a failure is reproducible from the seed printed in
 * the assertion message — an unreproducible property failure is close to useless.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { escrowAccount, userAccount, PLAY_TREASURY } from '../lib/ledger/accounts.mjs';
import { overdrafts, effects } from '../lib/ledger/posting.mjs';
import { grant, stake, settle, purchase, spend, reverse } from '../lib/ledger/intents.mjs';
import { check, openEscrows, issued, outstandingLiability } from '../lib/ledger/invariants.mjs';

/** A small deterministic PRNG, so every run explores the same sequence for a given seed. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const PLAYERS = ['p_a', 'p_b', 'p_c', 'p_d', 'p_e'];

/**
 * Plays a plausible economy: players are granted coins, pair off into matches, stake, and settle to
 * a winner or a draw; separately they buy value, spend it, and occasionally get charged back. Every
 * operation is refused rather than applied when it would overdraw, which is what the real service
 * does — so a violation appearing anyway means the ledger itself is wrong.
 */
function simulate(seed, steps) {
  const random = rng(seed);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const log = [];
  const balances = new Map();
  const openRooms = new Map(); // roomId -> [{ principalId, amount }]
  const purchases = [];
  let at = Date.parse('2026-01-01T00:00:00Z');
  let room = 0;
  let op = 0;

  const apply = (tx) => {
    const bad = overdrafts(tx, balances);
    if (bad.length) return false;
    for (const [account, delta] of effects(tx)) balances.set(account, (balances.get(account) ?? 0) + delta);
    log.push(tx);
    return true;
  };

  for (let i = 0; i < steps; i++) {
    at += 1 + Math.floor(random() * 1000);
    op += 1;
    const roll = random();

    if (roll < 0.25) {
      apply(grant({ principalId: pick(PLAYERS), amount: 1 + Math.floor(random() * 100), opKey: `grant:op:${op}`, at }));
    } else if (roll < 0.55) {
      // Open a match and stake both seats. A half-staked room is a legitimate state and is left open.
      const id = `r_${room++}`;
      const amount = pick([10, 25, 50, 100]);
      const first = pick(PLAYERS);
      const seats = [first, pick(PLAYERS.filter((p) => p !== first))];
      const staked = [];
      seats.forEach((principalId, seat) => {
        if (apply(stake({ principalId, roomId: id, amount, opKey: `stake:${id}:${seat}`, at }))) {
          staked.push({ principalId, amount });
        }
      });
      if (staked.length) openRooms.set(id, staked);
    } else if (roll < 0.8) {
      const ids = [...openRooms.keys()];
      if (!ids.length) continue;
      const id = pick(ids);
      const staked = openRooms.get(id);
      const pot = staked.reduce((a, s) => a + s.amount, 0);
      openRooms.delete(id);
      // A winner takes the pot; a draw returns each seat its own stake. Either way the escrow must
      // be exhausted exactly — that is the property under test, not an implementation detail.
      const draw = random() < 0.25 && staked.length === 2 && staked[0].amount === staked[1].amount;
      const payouts = draw
        ? staked.map((s) => ({ principalId: s.principalId, amount: s.amount }))
        : [{ principalId: pick(staked).principalId, amount: pot }];
      apply(settle({ roomId: id, payouts, opKey: `settle:${id}`, at, reason: draw ? 'draw' : 'complete' }));
    } else if (roll < 0.92) {
      const ref = `pi_${op}`;
      const principalId = pick(PLAYERS);
      const amount = 100 + Math.floor(random() * 900);
      if (apply(purchase({ principalId, amount, providerRef: ref, at }))) purchases.push({ ref, principalId, amount });
    } else if (roll < 0.98) {
      apply(spend({ principalId: pick(PLAYERS), amount: 1 + Math.floor(random() * 200), opKey: `spend:op:${op}`, at }));
    } else if (purchases.length) {
      const p = purchases.splice(Math.floor(random() * purchases.length), 1)[0];
      apply(reverse({ principalId: p.principalId, amount: p.amount, providerRef: p.ref, at }));
    }
  }
  return { log, balances, openRooms };
}

for (const seed of [1, 7, 42, 1337, 20260916]) {
  test(`10,000 generated operations keep the books balanced (seed ${seed})`, () => {
    const { log, openRooms } = simulate(seed, 10_000);
    assert.ok(log.length > 2000, `seed ${seed}: generator produced only ${log.length} postings`);

    const result = check(log);
    assert.deepEqual(
      result.violations,
      [],
      `seed ${seed}: ${result.violations.length} violation(s), first: ${JSON.stringify(result.violations[0])}`,
    );

    // Each ledger balances independently — a cross-ledger leak would net out globally.
    assert.equal(result.perLedger.play ?? 0, 0, `seed ${seed}: play ledger does not balance`);
    assert.equal(result.perLedger.value ?? 0, 0, `seed ${seed}: value ledger does not balance`);

    // Every coin in existence was issued by the treasury, and nothing was created anywhere else.
    const held = [...result.balances]
      .filter(([account]) => account.startsWith('play:') && account !== PLAY_TREASURY)
      .reduce((a, [, amount]) => a + amount, 0);
    assert.equal(held, issued(result.balances), `seed ${seed}: play coins exist that were never issued`);

    // Value still sitting with players is exactly what the operator still owes them.
    const playerValue = [...result.balances]
      .filter(([account]) => account.startsWith('value:user:'))
      .reduce((a, [, amount]) => a + amount, 0);
    const revenue = result.balances.get('value:revenue:operator') ?? 0;
    assert.equal(
      playerValue + revenue,
      outstandingLiability(result.balances),
      `seed ${seed}: purchased value does not reconcile against the liability`,
    );

    // Every escrow still holding value belongs to a match the simulation never settled.
    for (const { roomId, amount } of openEscrows(result.balances)) {
      assert.ok(openRooms.has(roomId), `seed ${seed}: ${roomId} settled but still holds ${amount}`);
      assert.ok(amount > 0, `seed ${seed}: ${roomId} holds a negative escrow`);
    }
  });
}

test('the invariants are not vacuous: every injected corruption is caught', () => {
  const { log } = simulate(99, 400);
  const at = Date.parse('2026-06-01T00:00:00Z');

  const corruptions = [
    [
      'an entry amount edited after the fact',
      (l) => {
        const i = l.findIndex((t) => t.kind === 'grant');
        const tx = l[i];
        const copy = { ...tx, entries: [tx.entries[0], { ...tx.entries[1], amount: tx.entries[1].amount + 1 }] };
        return l.map((t, n) => (n === i ? copy : t));
      },
      'balanced',
    ],
    [
      'a transaction posted twice',
      (l) => [...l, l[0]],
      'unique_transaction',
    ],
    [
      'a leg pointed at another ledger',
      (l) => {
        const i = l.findIndex((t) => t.kind === 'grant');
        const tx = l[i];
        const copy = { ...tx, entries: [tx.entries[0], { ...tx.entries[1], account: userAccount('value', 'p_a') }] };
        return l.map((t, n) => (n === i ? copy : t));
      },
      'trial_balance',
    ],
    [
      'a payout from an escrow that was never staked',
      (l) => [...l, settle({ roomId: 'r_ghost', payouts: [{ principalId: 'p_a', amount: 10 }], opKey: 'settle:r_ghost', at })],
      'no_overdraft',
    ],
    [
      'an identifier that does not derive from its operation key',
      (l) => l.map((t, n) => (n === 0 ? { ...t, id: 'tx_00000000000000000000000000000000' } : t)),
      'derived_id',
    ],
  ];

  for (const [name, corrupt, expected] of corruptions) {
    const result = check(corrupt(log.slice()));
    assert.equal(result.ok, false, `${name}: should have been caught`);
    assert.ok(
      result.violations.some((v) => v.rule === expected),
      `${name}: expected rule ${expected}, got ${[...new Set(result.violations.map((v) => v.rule))].join(', ')}`,
    );
  }

  // And the uncorrupted log still passes, so the checks above are not just always failing.
  assert.deepEqual(check(log).violations, []);
});

test('a replayed operation key is the same transaction, never a second one', () => {
  const at = Date.parse('2026-06-01T00:00:00Z');
  const first = stake({ principalId: 'p_a', roomId: 'r_1', amount: 25, opKey: 'stake:r_1:0', at });
  const retry = stake({ principalId: 'p_a', roomId: 'r_1', amount: 25, opKey: 'stake:r_1:0', at: at + 5_000 });

  assert.equal(first.id, retry.id, 'a retry derives the same id, so the database rejects it on the primary key');
  assert.deepEqual(
    first.entries.map((e) => e.id),
    retry.entries.map((e) => e.id),
    'and the same entry ids, so a partial retry cannot interleave legs from two attempts',
  );
  assert.notEqual(first.at, retry.at, 'even though the attempts happened at different times');

  assert.ok(check([first, retry]).violations.some((v) => v.rule === 'unique_transaction'));
});

test('no generated sequence can produce an escrow that outlives its settlement', () => {
  for (const seed of [3, 11, 500]) {
    const { log, openRooms } = simulate(seed, 2000);
    const { balances } = check(log);
    const settled = new Set(log.filter((t) => t.kind === 'settle').map((t) => t.meta.roomId));
    for (const roomId of settled) {
      assert.equal(
        balances.get(escrowAccount(roomId)) ?? 0,
        0,
        `seed ${seed}: settled room ${roomId} still holds value`,
      );
      assert.equal(openRooms.has(roomId), false);
    }
  }
});
