/**
 * The platform contract every later money milestone rests on.
 *
 * D1 runs a batch as one transaction and rolls it back when a statement ERRORS. It does not roll
 * back when a statement merely matches zero rows, because that is a successful statement. The
 * difference decides how a ledger post must be guarded: a `WHERE version = ?` clause is not a guard
 * inside a batch (the other statements commit anyway), while a constraint violation is, because it
 * raises.
 *
 * These tests pin both halves against the local harness so that a harness regression fails here
 * rather than silently making every ledger concurrency test pass for the wrong reason. They are
 * also the executable statement of the rule `lib/server/ledger-store-d1.mjs` will be written to:
 * every guard must be expressible as a constraint violation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalD1 } from './d1-local.mjs';

const room = (db, id, revision = 0) =>
  db
    .prepare('INSERT INTO rooms (id, revision, state, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, revision, '{}', 9_999_999_999, 1);

const count = async (db) => (await db.prepare('SELECT COUNT(*) AS n FROM rooms').first()).n;
const revisionOf = async (db, id) =>
  (await db.prepare('SELECT revision FROM rooms WHERE id = ?').bind(id).first())?.revision ?? null;

test('a batch rolls back completely when a statement errors', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());

  await assert.rejects(
    db.batch([room(db, 'aaa'), room(db, 'bbb'), room(db, 'aaa')]),
    'the duplicate primary key must reject the batch',
  );

  assert.equal(await count(db), 0, 'the two statements before the failing one must not survive');
  assert.equal(db.metrics.rollbacks, 1);
});

test('a batch does NOT roll back when a statement matches zero rows', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  await room(db, 'aaa', 5).run();

  // This is the exact shape all three architecture proposals assumed was a guard. It is not.
  const out = await db.batch([
    room(db, 'bbb'),
    db.prepare('UPDATE rooms SET revision = 99 WHERE id = ? AND revision = ?').bind('aaa', 4321),
  ]);

  assert.equal(out[1].meta.changes, 0, 'the guarded update matched nothing');
  assert.equal(await revisionOf(db, 'aaa'), 5, 'and so changed nothing');
  assert.equal(await count(db), 2, 'but the rest of the batch committed anyway — this is the trap');
  assert.equal(db.metrics.rollbacks, 0);
});

test('a primary key collision is a usable guard: the loser writes nothing', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());

  // Two concurrent batches derive the same id — a replay, or a lost race. Exactly one may land,
  // and the loser must leave no partial trace behind. This is the mechanism that replaces
  // `meta.changes` inspection in the ledger.
  const results = await Promise.allSettled([
    db.batch([room(db, 'shared'), room(db, 'only-a')]),
    db.batch([room(db, 'shared'), room(db, 'only-b')]),
  ]);

  const landed = results.filter((r) => r.status === 'fulfilled');
  assert.equal(landed.length, 1, 'exactly one batch may commit');
  assert.equal(await count(db), 2, 'the winner wrote both its rows; the loser wrote neither');

  const a = await revisionOf(db, 'only-a');
  const b = await revisionOf(db, 'only-b');
  assert.ok((a === null) !== (b === null), 'never a mixture of the two batches');
});

test('a batch is atomic against concurrent single statements', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());

  // A reader racing a batch must never observe it half-applied.
  const observations = [];
  const watcher = (async () => {
    for (let i = 0; i < 8; i++) observations.push(await count(db));
  })();
  await Promise.all([db.batch([room(db, 'x1'), room(db, 'x2'), room(db, 'x3')]), watcher]);

  assert.ok(
    observations.every((n) => n === 0 || n === 3),
    `a partial batch was observed: ${observations.join(',')}`,
  );
});
