/**
 * Deterministic identifiers, which are the anti-double-post mechanism rather than decoration.
 *
 * `tests/d1-batch-semantics.test.mjs` pins the platform fact this exists for: a D1 batch rolls back
 * when a statement ERRORS and does not roll back when a statement matches zero rows. So a guard
 * written as `WHERE version = ?` is not a guard inside a batch — the UPDATE quietly no-ops and the
 * INSERTs around it commit. Every guard must therefore be expressible as a constraint violation.
 *
 * Deriving the transaction id from the operation key turns "has this already been posted?" into a
 * PRIMARY KEY collision, which raises, which rolls the batch back. The question stops being asked at
 * all — it is answered by the shape of the data. Same for each entry, whose id is derived from the
 * transaction id and its position, so a partially-retried post cannot interleave legs from two
 * attempts.
 *
 * The operation key is supplied by the caller and must name the real-world event exactly once:
 * `settle:<roomId>` for a match settlement, `stake:<roomId>:<seat>` for a stake, `purchase:<providerRef>`
 * for a confirmed payment. A key that varies per attempt (a timestamp, a random value) defeats the
 * whole mechanism, so `assertOpKey` rejects the shapes that most obviously do.
 */
import { sha256 } from './sha256.mjs';
import { LedgerError } from './accounts.mjs';

const OP_KEY = /^[a-z][a-z0-9_]*(?::[A-Za-z0-9_-]{1,64})+$/;

/**
 * An operation key names an event, not an attempt. It must be stable across every retry of the same
 * real-world occurrence, because that stability IS the idempotency.
 */
export function assertOpKey(opKey) {
  const key = String(opKey ?? '');
  if (!OP_KEY.test(key)) {
    throw new LedgerError(
      `operation key must look like "verb:subject" using [A-Za-z0-9_-]: ${JSON.stringify(opKey)}`,
      'bad_op_key',
    );
  }
  if (key.length > 200) throw new LedgerError('operation key is too long', 'bad_op_key');
  return key;
}

/** Stable across processes, runtimes and retries — the same key always yields the same id. */
export const transactionId = (opKey) => `tx_${sha256(assertOpKey(opKey)).slice(0, 32)}`;

/**
 * Entry ids hang off the transaction id rather than off the operation key, so two legs of one
 * transaction cannot collide with each other and a retry reproduces both ids exactly.
 */
export const entryId = (txId, legIndex) => {
  if (!Number.isInteger(legIndex) || legIndex < 0) throw new LedgerError('leg index must be a non-negative integer', 'bad_leg');
  return `en_${sha256(`${txId}:${legIndex}`).slice(0, 32)}`;
};
