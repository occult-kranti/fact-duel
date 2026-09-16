import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers/promises';

/**
 * Every drizzle migration, in the order drizzle-kit recorded them in the journal, so a new table
 * ships as a new numbered file (the way `pnpm db:generate` emits it) and the tests still see the
 * whole schema without anyone editing the loader again.
 */
const MIGRATIONS = JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8'))
  .entries.sort((a, b) => a.idx - b.idx)
  .map((entry) => readFileSync(new URL(`../drizzle/${entry.tag}.sql`, import.meta.url), 'utf8'));

/** A statement returns rows when it selects them, or when it asks for them back with RETURNING. */
const RETURNS_ROWS = /^\s*(?:SELECT|WITH)\b/i;
const HAS_RETURNING = /\bRETURNING\b/i;

/**
 * Test-only D1 interface over real SQLite. This is not Cloudflare's network/runtime.
 *
 * `batch()` is a REAL transaction here, and that is the whole point of this class. D1 runs a batch
 * as one transaction and rolls it back when a statement *errors* — but an UPDATE that matches zero
 * rows is a successful statement returning `changes: 0`, so a batch guarded only by a `WHERE
 * version = ?` clause commits its other statements anyway. A harness that ran a batch as
 * `Promise.all(statements.map((s) => s.run()))` (as this one once did) models neither half: it has
 * no rollback at all, and with `yieldIO` on it lets two concurrent batches interleave
 * statement-by-statement, which D1 never does. Concurrency tests written against that harness pass
 * for the wrong reason, which is worse than not having them.
 *
 * So: the batch body below is entirely synchronous. Node runs it to completion before any other
 * task, which is exactly the serialisation a transaction gives you — no mutex required. The only
 * yield happens *before* `BEGIN`, so callers still race for the transaction, which is the race that
 * actually exists. `tests/d1-batch-semantics.test.mjs` pins both halves of the contract.
 */
export class LocalD1 {
  constructor({ yieldIO = true } = {}) {
    this.sqlite = new DatabaseSync(':memory:');
    for (const sql of MIGRATIONS) this.sqlite.exec(sql);
    this.yieldIO = yieldIO;
    this.metrics = { statements: 0, conflicts: 0, guardedWriteMisses: 0, batches: 0, rollbacks: 0 };
  }
  withSession() {
    return this;
  }
  prepare(sql) {
    return statement(this, sql);
  }
  /**
   * One transaction. Rolls back when a statement throws — and, faithfully to D1, does NOT roll back
   * when a statement merely affects zero rows, because that is a success.
   */
  async batch(statements) {
    if (this.yieldIO) await setImmediate();
    this.metrics.batches++;
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {
      const out = statements.map((s) => s.exec());
      this.sqlite.exec('COMMIT');
      return out;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      this.metrics.rollbacks++;
      throw error;
    }
  }
  close() {
    this.sqlite.close();
  }
}

/** A prepared statement, taking its database explicitly so nothing has to alias `this`. */
function statement(db, sql) {
  let args = [];
  return {
      sql,
      bind(...values) {
        args = values;
        return this;
      },
      /** Synchronous execution, D1-shaped. Safe to call inside a transaction; never yields. */
      exec() {
        db.metrics.statements++;
        const stmt = db.sqlite.prepare(sql);
        if (RETURNS_ROWS.test(sql) || HAS_RETURNING.test(sql)) {
          const results = stmt.all(...args);
          if (sql.startsWith('WITH clock') && !results.length) db.metrics.guardedWriteMisses++;
          return { success: true, results, meta: { changes: 0, rows_read: results.length } };
        }
        const result = stmt.run(...args);
        const changes = Number(result.changes);
        if (sql.startsWith('UPDATE rooms') && changes === 0) db.metrics.conflicts++;
        return {
          success: true,
          results: [],
          meta: { changes, last_row_id: Number(result.lastInsertRowid) },
        };
      },
      async first() {
        if (db.yieldIO) await setImmediate();
        const out = this.exec();
        return out.results[0] ?? null;
      },
      async run() {
        if (db.yieldIO) await setImmediate();
        return this.exec();
      },
      async all() {
        if (db.yieldIO) await setImmediate();
        return this.exec();
      },
  };
}
