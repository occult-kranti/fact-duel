/**
 * The ledger store over D1, written to the rule `tests/d1-batch-semantics.test.mjs` pins: a batch
 * rolls back on a statement ERROR and on nothing else. So every guard here is a constraint the
 * database raises, and nothing anywhere inspects `meta.changes`.
 *
 * One post is one `db.batch()` of:
 *
 *   INSERT ledger_transactions        deterministic tx_id — a replay collides on the PK      → duplicate
 *   INSERT ledger_entries (per leg)   deterministic entry_id, and (account_id, seq) UNIQUE —
 *                                     a post that read a stale head loses the race on seq    → conflict
 *   INSERT OR IGNORE ledger_accounts  opens the row if this is the account's first movement
 *   UPDATE ledger_accounts (per acct) balance = balance + delta, entry_seq = new head; the
 *                                     CHECK on flagged accounts refuses an overdraft         → overdraft
 *
 * Any of those errors aborts the whole batch, so a refused post writes nothing. The cached balance
 * is relative (`balance + ?`), so it is right even when this post's head read was stale — the seq
 * collision is what serialises posts, the balance never depends on what was read.
 *
 * The error codes are recovered from SQLite's own constraint messages, which D1 passes through.
 * That mapping is the one place this module knows anything about message text, and
 * `tests/ledger-store.test.mjs` checks each code against the local D1 harness.
 */
import { LedgerError, parseAccount } from '../ledger/accounts.mjs';
import { effects } from '../ledger/posting.mjs';
import { assertStore } from '../ledger/store-contract.mjs';

const NO_NEGATIVE = 1; // flags bit: the CHECK refuses a negative balance

export function codeForSqlError(error) {
  const text = String(error?.message ?? error ?? '');
  if (/ledger_transactions\.tx_id|ledger_transactions\.op_key|ledger_transactions_op_key_unique/.test(text)) return 'duplicate';
  if (/ledger_entries\.entry_id/.test(text)) return 'duplicate';
  if (/ledger_entries\.account_id, ledger_entries\.seq|ledger_entries_account_seq_uq/.test(text)) return 'conflict';
  if (/CHECK constraint failed/.test(text)) return 'overdraft';
  return null;
}

const placeholders = (n) => Array.from({ length: n }, () => '?').join(',');

export class D1LedgerStore {
  constructor(db) {
    this.db = typeof db.withSession === 'function' ? db.withSession('first-primary') : db;
    assertStore(this);
  }

  async #heads(accountIds) {
    const rows = accountIds.length
      ? (
          await this.db
            .prepare(`SELECT account_id, entry_seq FROM ledger_accounts WHERE account_id IN (${placeholders(accountIds.length)})`)
            .bind(...accountIds)
            .all()
        ).results
      : [];
    const heads = new Map(accountIds.map((id) => [id, 0]));
    for (const row of rows) heads.set(row.account_id, Number(row.entry_seq));
    return heads;
  }

  async post(transaction) {
    const deltas = effects(transaction);
    const touched = [...deltas.keys()];
    const heads = await this.#heads(touched);
    const now = transaction.at;

    const statements = [
      this.db
        .prepare(
          'INSERT INTO ledger_transactions (tx_id, op_key, ledger, kind, memo, meta, effective_at, created_at) VALUES (?,?,?,?,?,?,?,?)',
        )
        .bind(
          transaction.id,
          transaction.opKey,
          transaction.ledger,
          transaction.kind,
          transaction.memo ?? null,
          JSON.stringify(transaction.meta ?? {}),
          transaction.at,
          now,
        ),
    ];
    const seqs = new Map(heads);
    const stored = [];
    for (const entry of transaction.entries) {
      const seq = seqs.get(entry.account) + 1;
      seqs.set(entry.account, seq);
      stored.push({ ...entry, seq });
      statements.push(
        this.db
          .prepare('INSERT INTO ledger_entries (entry_id, tx_id, account_id, leg, amount, seq, created_at) VALUES (?,?,?,?,?,?,?)')
          .bind(entry.id, entry.txId, entry.account, entry.leg, entry.amount, seq, now),
      );
    }
    for (const id of touched) {
      const meta = parseAccount(id);
      statements.push(
        this.db
          .prepare(
            'INSERT OR IGNORE INTO ledger_accounts (account_id, ledger, kind, owner, flags, balance, entry_seq, opened_at) VALUES (?,?,?,?,?,0,0,?)',
          )
          .bind(id, meta.ledger, meta.kind, meta.owner, meta.mayGoNegative ? 0 : NO_NEGATIVE, now),
      );
      statements.push(
        this.db
          .prepare('UPDATE ledger_accounts SET balance = balance + ?, entry_seq = ? WHERE account_id = ?')
          .bind(deltas.get(id), seqs.get(id), id),
      );
    }

    try {
      await this.db.batch(statements);
    } catch (error) {
      const code = codeForSqlError(error);
      if (!code) throw error;
      throw new LedgerError(`${code}: ${transaction.id} (${transaction.opKey}) — ${error.message}`, code);
    }
    return { ...transaction, postedAt: now, entries: stored };
  }

  async balances(accountIds) {
    if (!accountIds.length) return new Map();
    const { results } = await this.db
      .prepare(`SELECT account_id, balance FROM ledger_accounts WHERE account_id IN (${placeholders(accountIds.length)})`)
      .bind(...accountIds)
      .all();
    const out = new Map(accountIds.map((id) => [id, 0]));
    for (const row of results) out.set(row.account_id, Number(row.balance));
    return out;
  }

  async entriesFor(accountId, { afterSeq = 0, limit = 100 } = {}) {
    const { results } = await this.db
      .prepare(
        'SELECT entry_id, tx_id, account_id, leg, amount, seq FROM ledger_entries WHERE account_id = ? AND seq > ? ORDER BY seq ASC LIMIT ?',
      )
      .bind(accountId, afterSeq, Math.max(1, Math.min(1000, limit)))
      .all();
    return results.map(rowToEntry);
  }

  async transaction(txId) {
    const tx = await this.db
      .prepare('SELECT tx_id, op_key, ledger, kind, memo, meta, effective_at, created_at FROM ledger_transactions WHERE tx_id = ?')
      .bind(txId)
      .first();
    if (!tx) return null;
    const { results } = await this.db
      .prepare('SELECT entry_id, tx_id, account_id, leg, amount, seq FROM ledger_entries WHERE tx_id = ? ORDER BY leg ASC')
      .bind(txId)
      .all();
    return rowToTransaction(tx, results.map(rowToEntry));
  }

  /** Transactions in posting order (created_at, then tx_id for a stable tie), with their entries. */
  async scan({ limit = 1000, offset = 0 } = {}) {
    const { results } = await this.db
      .prepare(
        'SELECT tx_id, op_key, ledger, kind, memo, meta, effective_at, created_at FROM ledger_transactions ORDER BY created_at ASC, rowid ASC LIMIT ? OFFSET ?',
      )
      .bind(Math.max(1, Math.min(1000, limit)), Math.max(0, offset))
      .all();
    const out = [];
    for (const tx of results) {
      const entries = (
        await this.db
          .prepare('SELECT entry_id, tx_id, account_id, leg, amount, seq FROM ledger_entries WHERE tx_id = ? ORDER BY leg ASC')
          .bind(tx.tx_id)
          .all()
      ).results.map(rowToEntry);
      out.push(rowToTransaction(tx, entries));
    }
    return out;
  }

  async heads() {
    const { results } = await this.db.prepare('SELECT account_id, balance, entry_seq FROM ledger_accounts').all();
    return new Map(results.map((r) => [r.account_id, { balance: Number(r.balance), entrySeq: Number(r.entry_seq) }]));
  }
}

const rowToEntry = (r) => ({
  id: r.entry_id,
  txId: r.tx_id,
  leg: Number(r.leg),
  account: r.account_id,
  amount: Number(r.amount),
  seq: Number(r.seq),
});

function rowToTransaction(tx, entries) {
  let meta = {};
  try {
    meta = JSON.parse(tx.meta || '{}');
  } catch {
    meta = {};
  }
  return {
    id: tx.tx_id,
    opKey: tx.op_key,
    ledger: tx.ledger,
    kind: tx.kind,
    memo: tx.memo ?? null,
    meta,
    at: Number(tx.effective_at),
    postedAt: Number(tx.created_at),
    entries,
  };
}
