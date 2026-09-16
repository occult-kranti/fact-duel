/**
 * One suite, two stores. The D1 store and the memory store must refuse the same posts for the same
 * reasons with the same codes, and write nothing when they refuse — that is the contract in
 * `lib/ledger/store-contract.mjs`, and running the same assertions against both is what makes it a
 * contract rather than a hope.
 *
 * The D1 half runs against the local harness whose batch semantics are pinned in
 * `tests/d1-batch-semantics.test.mjs`: a batch rolls back on a statement error and on nothing else.
 * Every refusal below therefore has to surface as a constraint violation, and the assertions that
 * nothing was written are the ones that would catch a guard that only *looked* like one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalD1 } from './d1-local.mjs';
import { D1LedgerStore, codeForSqlError } from '../lib/server/ledger-store-d1.mjs';
import { MemoryLedgerStore } from '../lib/ledger-memory-store.mjs';
import { grant, stake, settle, purchase, spend } from '../lib/ledger/intents.mjs';
import { userAccount, escrowAccount, PLAY_TREASURY, LedgerError } from '../lib/ledger/accounts.mjs';
import { POST_ERRORS } from '../lib/ledger/store-contract.mjs';
import { reconcile } from '../lib/server/reconcile.mjs';

const AT = Date.parse('2026-09-16T10:00:00Z');
const ALICE = 'p_alice';
const BOB = 'p_bob';
const alice = userAccount('play', ALICE);
const bob = userAccount('play', BOB);

const codeOf = async (promise) => {
  try {
    await promise;
    return null;
  } catch (error) {
    assert.ok(error instanceof LedgerError, `expected a LedgerError, got ${error?.stack ?? error}`);
    assert.ok(POST_ERRORS.includes(error.code), `code ${error.code} is not in the contract`);
    return error.code;
  }
};

const STORES = [
  ['memory', () => ({ store: new MemoryLedgerStore(), close() {} })],
  [
    'd1',
    () => {
      const db = new LocalD1();
      return { store: new D1LedgerStore(db), db, close: () => db.close() };
    },
  ],
];

for (const [name, open] of STORES) {
  const suite = (title, fn) =>
    test(`${name}: ${title}`, async (t) => {
      const ctx = open();
      t.after(() => ctx.close());
      await fn(ctx);
    });

  suite('a grant lands, the balance reads back, and the entries carry a dense sequence', async ({ store }) => {
    const tx = grant({ principalId: ALICE, amount: 50, opKey: `grant:ad:${ALICE}:n1`, at: AT, reason: 'rewarded ad' });
    const stored = await store.post(tx);
    assert.equal(stored.id, tx.id);
    assert.deepEqual([...(await store.balances([alice, PLAY_TREASURY]))], [
      [alice, 50],
      [PLAY_TREASURY, -50],
    ]);
    const entries = await store.entriesFor(alice);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].seq, 1);
    assert.equal(entries[0].amount, 50);
    const back = await store.transaction(tx.id);
    assert.equal(back.opKey, tx.opKey);
    assert.equal(back.entries.length, 2);
    assert.equal(back.memo, 'rewarded ad');
    assert.equal(await store.transaction('tx_nope'), null);
  });

  suite('a replay of the same operation is refused as a duplicate and writes nothing', async ({ store }) => {
    const tx = grant({ principalId: ALICE, amount: 50, opKey: `grant:ad:${ALICE}:n1`, at: AT });
    await store.post(tx);
    assert.equal(await codeOf(store.post(tx)), 'duplicate');
    // Same op key, retried a second later, is the same event: same id, same refusal.
    const retry = grant({ principalId: ALICE, amount: 50, opKey: `grant:ad:${ALICE}:n1`, at: AT + 1000 });
    assert.equal(await codeOf(store.post(retry)), 'duplicate');
    assert.equal((await store.balances([alice])).get(alice), 50, 'paid exactly once');
    assert.equal((await store.entriesFor(alice)).length, 1);
  });

  suite('an overdraft is refused whole: no entry, no balance change, no transaction row', async ({ store }) => {
    await store.post(grant({ principalId: ALICE, amount: 30, opKey: `grant:ad:${ALICE}:n1`, at: AT }));
    const big = stake({ principalId: ALICE, roomId: 'r_1', amount: 50, opKey: `stake:r_1:${ALICE}`, at: AT + 1 });
    assert.equal(await codeOf(store.post(big)), 'overdraft');
    assert.equal((await store.balances([alice])).get(alice), 30);
    assert.equal((await store.balances([escrowAccount('r_1')])).get(escrowAccount('r_1')), 0);
    assert.equal(await store.transaction(big.id), null, 'the refused transaction left no row');
    assert.equal((await store.entriesFor(escrowAccount('r_1'))).length, 0);
    // A refusal does not poison the account: the affordable stake still goes through.
    const ok = stake({ principalId: ALICE, roomId: 'r_1', amount: 30, opKey: `stake:r_1:${ALICE}`, at: AT + 2 });
    await store.post(ok);
    assert.equal((await store.balances([alice])).get(alice), 0);
  });

  suite('the treasury may go negative; a user account may not — flags follow the account kind', async ({ store }) => {
    await store.post(grant({ principalId: ALICE, amount: 1, opKey: `grant:x:${ALICE}:a`, at: AT }));
    assert.equal((await store.balances([PLAY_TREASURY])).get(PLAY_TREASURY), -1);
    const purchaseTx = purchase({ principalId: BOB, amount: 500, providerRef: 'pi_1', at: AT });
    await store.post(purchaseTx);
    const spendTx = spend({ principalId: BOB, amount: 501, opKey: 'spend:item:1', at: AT + 1, item: 'frame' });
    assert.equal(await codeOf(store.post(spendTx)), 'overdraft');
  });

  suite('a full duel — two stakes, one settlement with a fee — leaves the escrow empty and the books balanced', async ({ store }) => {
    await store.post(grant({ principalId: ALICE, amount: 100, opKey: `grant:seed:${ALICE}`, at: AT }));
    await store.post(grant({ principalId: BOB, amount: 100, opKey: `grant:seed:${BOB}`, at: AT }));
    await store.post(stake({ principalId: ALICE, roomId: 'r_9', amount: 50, opKey: `stake:r_9:${ALICE}`, at: AT + 1 }));
    await store.post(stake({ principalId: BOB, roomId: 'r_9', amount: 50, opKey: `stake:r_9:${BOB}`, at: AT + 2 }));
    const escrow = escrowAccount('r_9');
    assert.equal((await store.balances([escrow])).get(escrow), 100);
    await store.post(settle({ roomId: 'r_9', payouts: [{ principalId: ALICE, amount: 90 }], fee: 10, opKey: 'settle:r_9', at: AT + 3, reason: 'win' }));
    const b = await store.balances([alice, bob, escrow, PLAY_TREASURY]);
    assert.equal(b.get(alice), 140);
    assert.equal(b.get(bob), 50);
    assert.equal(b.get(escrow), 0);
    assert.equal(b.get(PLAY_TREASURY), -190, 'issuance net of the burned fee');
    // A second settlement of the same room is the same event: refused, and the escrow stays at 0.
    assert.equal(
      await codeOf(store.post(settle({ roomId: 'r_9', payouts: [{ principalId: BOB, amount: 90 }], fee: 10, opKey: 'settle:r_9', at: AT + 4 }))),
      'duplicate',
    );
    const report = await reconcile(store);
    assert.equal(report.ok, true, JSON.stringify(report));
    assert.equal(report.transactions, 5);
    assert.deepEqual(report.openEscrows, []);
    assert.equal(report.issued, 190);
  });

  suite('two posts that read the same head race for the sequence: exactly one lands, the loser is a conflict', async ({ store }) => {
    await store.post(grant({ principalId: ALICE, amount: 100, opKey: `grant:seed:${ALICE}`, at: AT }));
    const a = stake({ principalId: ALICE, roomId: 'r_a', amount: 60, opKey: `stake:r_a:${ALICE}`, at: AT + 1 });
    const b = stake({ principalId: ALICE, roomId: 'r_b', amount: 60, opKey: `stake:r_b:${ALICE}`, at: AT + 1 });
    // Both read head=1 before either applies. Whichever applies second collides on (account, seq)
    // — which is also what saves the balance: 60 + 60 > 100, and the loser never reached the CHECK.
    const results = await Promise.allSettled([store.post(a), store.post(b)]);
    const landed = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    assert.equal(landed.length, 1, JSON.stringify(results.map((r) => r.status)));
    assert.equal(failed.length, 1);
    assert.ok(['conflict', 'overdraft'].includes(failed[0].reason.code), failed[0].reason.message);
    assert.equal((await store.balances([alice])).get(alice), 40);
    const report = await reconcile(store);
    assert.equal(report.ok, true, JSON.stringify(report));
    // The loser, retried with a fresh head read, is now an honest overdraft.
    const loser = failed[0].reason.code === 'conflict' ? (landed[0].value.id === a.id ? b : a) : null;
    if (loser) assert.equal(await codeOf(store.post(loser)), 'overdraft');
  });

  suite('many concurrent grants to one account all land, in some order, with a dense sequence', async ({ store }) => {
    const txs = Array.from({ length: 12 }, (_, i) => grant({ principalId: ALICE, amount: 5, opKey: `grant:ad:${ALICE}:n${i}`, at: AT + i }));
    let pending = txs;
    let rounds = 0;
    // Conflicts are the caller's to retry: keep going until every grant is in. Each round can only
    // fail on a stale head, so the loop terminates.
    while (pending.length && rounds < 30) {
      rounds++;
      const results = await Promise.allSettled(pending.map((tx) => store.post(tx)));
      pending = pending.filter((tx, i) => results[i].status === 'rejected' && results[i].reason.code === 'conflict');
      for (const r of results) if (r.status === 'rejected' && r.reason.code !== 'conflict') throw r.reason;
    }
    assert.equal(pending.length, 0, `unfinished after ${rounds} rounds`);
    assert.equal((await store.balances([alice])).get(alice), 60);
    const entries = await store.entriesFor(alice, { limit: 100 });
    assert.deepEqual(entries.map((e) => e.seq), Array.from({ length: 12 }, (_, i) => i + 1));
    const report = await reconcile(store);
    assert.equal(report.ok, true, JSON.stringify(report.drift));
  });

  suite('entriesFor pages by sequence and balances reads a missing account as zero', async ({ store }) => {
    for (let i = 0; i < 5; i++) await store.post(grant({ principalId: ALICE, amount: 1, opKey: `grant:ad:${ALICE}:n${i}`, at: AT + i }));
    const page1 = await store.entriesFor(alice, { limit: 2 });
    const page2 = await store.entriesFor(alice, { afterSeq: page1.at(-1).seq, limit: 2 });
    assert.deepEqual(page1.map((e) => e.seq), [1, 2]);
    assert.deepEqual(page2.map((e) => e.seq), [3, 4]);
    assert.equal((await store.balances([userAccount('play', 'p_nobody')])).get(userAccount('play', 'p_nobody')), 0);
    assert.deepEqual(await store.balances([]), new Map());
  });
}

test('the D1 store recovers each contract code from the constraint SQLite names, and nothing else', () => {
  assert.equal(codeForSqlError(new Error('D1_ERROR: UNIQUE constraint failed: ledger_transactions.tx_id')), 'duplicate');
  assert.equal(codeForSqlError(new Error('UNIQUE constraint failed: ledger_entries.account_id, ledger_entries.seq')), 'conflict');
  assert.equal(codeForSqlError(new Error('CHECK constraint failed: ledger_accounts_no_overdraft')), 'overdraft');
  assert.equal(codeForSqlError(new Error('no such table: ledger_entries')), null, 'an infrastructure error is not a ledger refusal');
});

test('the reconciler catches a cached balance that the entries do not support', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const store = new D1LedgerStore(db);
  await store.post(grant({ principalId: ALICE, amount: 50, opKey: `grant:ad:${ALICE}:n1`, at: AT }));
  // Someone edits a balance by hand. Nothing in the app can do this; the reconciler exists for it.
  await db.prepare('UPDATE ledger_accounts SET balance = 500 WHERE account_id = ?').bind(alice).run();
  const report = await reconcile(store);
  assert.equal(report.ok, false);
  assert.deepEqual(report.drift, [{ account: alice, rule: 'cached_balance', cached: 500, replayed: 50 }]);
});

test('the D1 schema itself refuses an overdraft and a duplicate sequence, with no application code involved', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  await db
    .prepare("INSERT INTO ledger_accounts (account_id, ledger, kind, owner, flags, balance, entry_seq, opened_at) VALUES ('play:user:p_x','play','user','p_x',1,10,0,1)")
    .run();
  await assert.rejects(db.prepare("UPDATE ledger_accounts SET balance = balance - 11 WHERE account_id = 'play:user:p_x'").run(), /CHECK constraint failed/);
  await assert.rejects(db.prepare("UPDATE ledger_accounts SET balance = balance - 10 WHERE account_id = 'play:user:p_x'").run().then(() => Promise.reject(new Error('should pass'))), /should pass/);
  const ins = (id, seq) =>
    db.prepare("INSERT INTO ledger_entries (entry_id, tx_id, account_id, leg, amount, seq, created_at) VALUES (?, 'tx_1', 'play:user:p_x', 0, 1, ?, 1)").bind(id, seq).run();
  await ins('en_1', 1);
  await assert.rejects(ins('en_2', 1), /UNIQUE constraint failed: ledger_entries.account_id, ledger_entries.seq/);
  await assert.rejects(
    db.prepare("INSERT INTO ledger_entries (entry_id, tx_id, account_id, leg, amount, seq, created_at) VALUES ('en_3','tx_1','play:user:p_x',0,0,2,1)").run(),
    /CHECK constraint failed/,
  );
});
