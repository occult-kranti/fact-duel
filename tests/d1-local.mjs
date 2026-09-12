import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers/promises';

/** Test-only D1 interface over real SQLite. This is not Cloudflare's network/runtime. */
export class LocalD1 {
  constructor({ yieldIO = true } = {}) {
    this.sqlite = new DatabaseSync(':memory:');
    this.sqlite.exec(readFileSync(new URL('../drizzle/0000_natural_venus.sql', import.meta.url), 'utf8'));
    this.yieldIO = yieldIO;
    this.metrics = { statements: 0, conflicts: 0, guardedWriteMisses: 0 };
  }
  withSession() {
    return this;
  }
  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) {
        args = values;
        return this;
      },
      async first() {
        if (db.yieldIO) await setImmediate();
        db.metrics.statements++;
        const row = db.sqlite.prepare(sql).get(...args) ?? null;
        if (sql.startsWith('WITH clock') && !row) db.metrics.guardedWriteMisses++;
        return row;
      },
      async run() {
        if (db.yieldIO) await setImmediate();
        db.metrics.statements++;
        const result = db.sqlite.prepare(sql).run(...args);
        if (sql.startsWith('UPDATE rooms') && result.changes === 0) db.metrics.conflicts++;
        return { meta: { changes: Number(result.changes) } };
      },
    };
  }
  async batch(statements) {
    return Promise.all(statements.map((s) => s.run()));
  }
  close() {
    this.sqlite.close();
  }
}
