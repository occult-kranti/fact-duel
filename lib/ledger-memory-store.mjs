/**
 * The ledger store in memory: the reference implementation of `lib/ledger/store-contract.mjs`.
 *
 * It exists for two reasons. The tests in `tests/ledger-store.test.mjs` run one suite against this
 * and against the D1 store, so a behaviour the two disagree on is a failing test rather than a
 * production surprise. And it is what the app runs on when there is no database at all (the
 * static build, a unit test, a stress run), which is what keeps the calling code free of any
 * knowledge of D1.
 *
 * It mirrors the D1 store's shape on purpose: the head of each touched account is read first, the
 * post is then applied as one synchronous step, and the three refusals — duplicate, conflict,
 * overdraft — are decided in the same order and with the same codes. The one yield before the
 * apply step is what lets two concurrent posts race for an account's sequence, which is the race
 * that exists against D1.
 */
import { setImmediate } from 'node:timers/promises';
import { LedgerError, parseAccount } from './ledger/accounts.mjs';
import { effects } from './ledger/posting.mjs';
import { assertStore } from './ledger/store-contract.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));

export class MemoryLedgerStore {
  constructor({ yieldIO = true } = {}) {
    this.accounts = new Map(); // account id -> { balance, entrySeq, openedAt }
    this.transactions = new Map(); // tx id -> stored transaction (in posting order)
    this.entriesByAccount = new Map(); // account id -> entries oldest first
    this.yieldIO = yieldIO;
    this.metrics = { posts: 0, duplicates: 0, conflicts: 0, overdrafts: 0 };
    assertStore(this);
  }

  async post(transaction) {
    const touched = [...effects(transaction).keys()];
    // The head read is separate from the apply step, as it is against D1, so a stale head is a
    // thing that can actually happen here and the conflict path gets exercised.
    const heads = new Map(touched.map((id) => [id, this.accounts.get(id)?.entrySeq ?? 0]));
    if (this.yieldIO) await setImmediate();
    this.metrics.posts++;

    if (this.transactions.has(transaction.id)) {
      this.metrics.duplicates++;
      throw new LedgerError(`${transaction.id} is already posted (${transaction.opKey})`, 'duplicate');
    }
    for (const id of touched) {
      if ((this.accounts.get(id)?.entrySeq ?? 0) !== heads.get(id)) {
        this.metrics.conflicts++;
        throw new LedgerError(`a concurrent post won the sequence on ${id}`, 'conflict');
      }
    }
    for (const [id, delta] of effects(transaction)) {
      const balance = (this.accounts.get(id)?.balance ?? 0) + delta;
      if (!parseAccount(id).mayGoNegative && balance < 0) {
        this.metrics.overdrafts++;
        throw new LedgerError(`${id} would fall to ${balance}`, 'overdraft');
      }
    }

    // Nothing above wrote. Everything below is synchronous, so it is atomic.
    const stored = clone({ ...transaction, postedAt: transaction.at });
    const seqs = new Map(heads);
    for (const entry of stored.entries) {
      const seq = seqs.get(entry.account) + 1;
      seqs.set(entry.account, seq);
      entry.seq = seq;
      const list = this.entriesByAccount.get(entry.account) ?? [];
      list.push(entry);
      this.entriesByAccount.set(entry.account, list);
    }
    for (const [id, delta] of effects(transaction)) {
      const before = this.accounts.get(id) ?? { balance: 0, entrySeq: 0, openedAt: transaction.at };
      this.accounts.set(id, { ...before, balance: before.balance + delta, entrySeq: seqs.get(id) });
    }
    this.transactions.set(stored.id, Object.freeze(stored));
    return stored;
  }

  async balances(accountIds) {
    if (this.yieldIO) await setImmediate();
    return new Map(accountIds.map((id) => [id, this.accounts.get(id)?.balance ?? 0]));
  }

  async entriesFor(accountId, { afterSeq = 0, limit = 100 } = {}) {
    if (this.yieldIO) await setImmediate();
    return (this.entriesByAccount.get(accountId) ?? []).filter((e) => e.seq > afterSeq).slice(0, limit).map(clone);
  }

  async transaction(txId) {
    if (this.yieldIO) await setImmediate();
    const tx = this.transactions.get(txId);
    return tx ? clone(tx) : null;
  }

  /** Every transaction in posting order — the reconciler's input. */
  async scan({ limit = 1000, offset = 0 } = {}) {
    if (this.yieldIO) await setImmediate();
    return [...this.transactions.values()].slice(offset, offset + limit).map(clone);
  }

  /** The cached heads, so the reconciler can compare them to a replay of the entries. */
  async heads() {
    if (this.yieldIO) await setImmediate();
    return new Map([...this.accounts].map(([id, a]) => [id, { balance: a.balance, entrySeq: a.entrySeq }]));
  }
}
