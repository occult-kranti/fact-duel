/**
 * The boundary a ledger store must satisfy, stated as an executable contract rather than as prose.
 *
 * This exists because the persistence design bets on a platform behaviour we do not control: that a
 * D1 batch executes as one transaction and rolls back when a statement errors. Every guard in the
 * store is built to fail as an exception for exactly that reason. If that behaviour ever changes,
 * the ledger has to be able to move behind a single-threaded store without the calling code noticing,
 * and a contract both implementations are tested against is what makes that a small change instead of
 * a rewrite.
 *
 * `M3` implements this twice — once over D1 and once in memory — and `tests/ledger-store.test.mjs`
 * will run the same suite against both, the way `tests/duel-memory.test.mjs` already does for rooms.
 */
import { LedgerError } from './accounts.mjs';

/**
 * Required methods:
 *
 *  post(transaction)          Persist a planned transaction atomically. MUST throw `duplicate` when
 *                             the transaction id already exists, MUST throw `conflict` when a
 *                             concurrent post won the account's sequence, and MUST throw `overdraft`
 *                             when a non-negative account would go below zero. MUST write nothing on
 *                             any of these. Returns the stored transaction.
 *  balances(accountIds)       Map of account id to integer balance. Missing accounts read as 0.
 *  entriesFor(accountId, o)   Page of entries, oldest first, for reconstructing a statement.
 *  transaction(txId)          One transaction with its entries, or null.
 */
export const REQUIRED = Object.freeze(['post', 'balances', 'entriesFor', 'transaction']);

/** Codes `post` must use, so callers can branch on cause without matching on message text. */
export const POST_ERRORS = Object.freeze(['duplicate', 'conflict', 'overdraft']);

export function assertStore(store) {
  const missing = REQUIRED.filter((name) => typeof store?.[name] !== 'function');
  if (missing.length) {
    throw new LedgerError(`ledger store is missing: ${missing.join(', ')}`, 'bad_store');
  }
  return store;
}
