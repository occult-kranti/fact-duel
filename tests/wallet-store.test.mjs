/**
 * The wallet's own IndexedDB store.
 *
 * What matters: the wallet lives in a database of its own (never the profile's); a first read hands
 * back a clean empty wallet and the visit step makes it playable at once; concurrent steps are
 * serialised so a balance can never be spent twice; and whatever junk lands in the row is repaired
 * on the way out, with a clean wallet round-tripping unchanged.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { transactWallet, visitStep } from '../lib/wallet-store.mjs';
import { DEFAULT_CONFIG, emptyWallet, enterPractice, readWallet } from '../lib/economy/economy.mjs';

const cfg = DEFAULT_CONFIG;
const T0 = Date.parse('2026-09-16T10:00:00Z');
const reset = () => transactWallet(() => emptyWallet());

test('the wallet has its own database, and a first visit makes a new player playable at once', async () => {
  await reset();
  const fresh = await transactWallet(null);
  assert.deepEqual(fresh, emptyWallet());
  assert.equal(readWallet(fresh), fresh, 'what comes out of the store is already clean');

  const visited = await transactWallet(visitStep({ at: T0, tzOffsetMinutes: 0 }, cfg));
  assert.equal(visited.coins, cfg.floor.coins + cfg.daily, 'the floor, then the daily grant');
  assert.equal(visited.lastFloorAt, T0);
  assert.equal(visited.lastDailyKey, '2026-09-16');
  assert.ok(visited.coins >= cfg.practiceEntry, 'a drill is affordable without watching anything');

  const names = await new Promise((resolve, reject) => {
    const req = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);
    req.then((list) => resolve(list.map((d) => d.name))).catch(reject);
  });
  assert.ok(names.includes('fact-duel-wallet'));
  assert.ok(!names.includes('fact-duel-player'), 'this test never touched the profile database');
});

test('a same-day visit is identity for the reducer, so the store has nothing to write', async () => {
  await reset();
  const first = await transactWallet(visitStep({ at: T0, tzOffsetMinutes: 0 }, cfg));
  let seen;
  const again = await transactWallet((w) => {
    seen = w;
    return visitStep({ at: T0 + 3_600_000, tzOffsetMinutes: 0 }, cfg)(w);
  });
  assert.equal(again, seen, 'the step handed back the very object it was given');
  assert.deepEqual(again, first);
});

test('concurrent entries are serialised: fifty coins buy exactly five drills, never six', async () => {
  await reset();
  await transactWallet(visitStep({ at: T0, tzOffsetMinutes: 0 }, cfg));
  const outcomes = await Promise.all(
    Array.from({ length: 30 }, () => {
      let result;
      return transactWallet((w) => {
        result = enterPractice(w, cfg);
        return result.wallet;
      }).then(() => result);
    }),
  );
  const paid = outcomes.filter((o) => o.ok).length;
  assert.equal(paid, Math.floor((cfg.floor.coins + cfg.daily) / cfg.practiceEntry));
  assert.equal(outcomes.filter((o) => o.reason === 'insufficient').length, 30 - paid);
  const after = await transactWallet(null);
  assert.equal(after.coins, 0);
  assert.equal(after.lifetimeSpent, paid * cfg.practiceEntry);
});

test('junk in the row is repaired on read; a failing step writes nothing', async () => {
  await reset();
  await transactWallet(() => ({ coins: -5, lifetimeEarned: 'x', adIds: ['a', 7], extra: true }));
  const repaired = await transactWallet(null);
  assert.equal(repaired.coins, 0);
  assert.equal(repaired.lifetimeEarned, 0);
  assert.deepEqual([...repaired.adIds], ['a']);
  assert.equal('extra' in repaired, false);

  const before = await transactWallet((w) => ({ ...w, coins: 40 }));
  await assert.rejects(
    transactWallet(() => {
      throw new Error('boom');
    }),
    /boom/,
  );
  assert.deepEqual(await transactWallet(null), before, 'the aborted transaction left the row alone');
});

test('the server view is the same wallet shape: the server’s three numbers, nothing device-side', async () => {
  const { serverWalletView } = await import('../lib/wallet-store.mjs');
  const view = serverWalletView({ principalId: 'anon_x', coins: 75, adsToday: 2, adDailyCap: 20, dayKey: '2026-09-16' });
  assert.equal(view.coins, 75);
  assert.equal(view.adsToday, 2);
  assert.equal(view.dayKey, '2026-09-16');
  assert.equal(readWallet(view), view, 'clean by identity, like everything the store hands out');
  assert.equal(view.lastDailyKey, '', 'the daily grant is not on the server yet, so it is not claimed');
  assert.equal(view.lastFloorAt, 0);
  assert.deepEqual(serverWalletView(undefined), emptyWallet(), 'garbage in, empty wallet out');
  assert.deepEqual(serverWalletView({ coins: 1.5, adsToday: 'two', dayKey: 9 }), emptyWallet());
  assert.deepEqual(serverWalletView(JSON.parse(JSON.stringify(view))), view, 'round-trips');

  // A stored device wallet is untouched by the view: the two balances never merge.
  await reset();
  const stored = await transactWallet(visitStep({ at: T0, tzOffsetMinutes: 0 }, cfg));
  assert.notEqual(stored.coins, view.coins);
  assert.deepEqual(await transactWallet(null), stored);
});
