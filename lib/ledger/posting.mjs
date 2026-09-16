/**
 * The posting planner: the only way to express a movement of value, and a pure function.
 *
 * Nothing here touches a database. `plan()` takes an intent's legs and returns a frozen, fully
 * identified transaction, or throws. That matters for two reasons.
 *
 * First, double-entry is enforced at the API boundary rather than checked afterwards: you cannot
 * express a move without naming both sides, because a set of legs that does not sum to zero is not a
 * transaction and never becomes one. There is no "fix up the balance later" path, so the books
 * cannot be made wrong by forgetting a step — only by never starting.
 *
 * Second, the ledger partition is enforced here, which is what makes "payments are off" an invariant
 * of a pure function rather than a flag someone has to remember. A purchased coin cannot reach a
 * match escrow because moving it there would require a transaction spanning the value ledger and the
 * play ledger, and `plan()` throws on that before anything is written. See `accounts.mjs` for why
 * that specific guarantee is the one worth building the module around.
 *
 * Amounts are integers in the smallest unit of their ledger — whole coins on 'play', minor currency
 * units on 'value'. There is no floating point anywhere in this directory, on purpose.
 */
import { LedgerError, parseAccount } from './accounts.mjs';
import { assertOpKey, transactionId, entryId } from './entry-id.mjs';

const isAmount = (n) => Number.isSafeInteger(n) && n !== 0;

/**
 * @param {{opKey: string, kind: string, legs: Array<{account: string, amount: number}>, memo?: string, at: number, meta?: object}} intent
 * @returns {Readonly<{id: string, ledger: string, kind: string, opKey: string, at: number, entries: ReadonlyArray<object>}>}
 */
export function plan(intent) {
  const opKey = assertOpKey(intent?.opKey);
  const kind = String(intent?.kind ?? '');
  if (!kind) throw new LedgerError('a transaction must say what kind of event it records', 'bad_kind');

  const at = intent?.at;
  if (!Number.isSafeInteger(at) || at <= 0) throw new LedgerError('a transaction must carry a timestamp', 'bad_time');

  const legs = intent?.legs;
  if (!Array.isArray(legs) || legs.length < 2) {
    throw new LedgerError('a transaction needs at least two legs — name both sides of the move', 'unbalanced');
  }

  const seen = new Set();
  let ledger = null;
  let sum = 0;
  const parsed = legs.map((leg, index) => {
    const account = parseAccount(leg?.account);
    if (!isAmount(leg?.amount)) {
      throw new LedgerError(`leg ${index}: amount must be a non-zero safe integer, got ${leg?.amount}`, 'bad_amount');
    }
    // One account per transaction. Two legs against the same account are always a caller bug, and
    // netting them silently would hide it while still balancing.
    if (seen.has(account.id)) throw new LedgerError(`leg ${index}: ${account.id} appears twice`, 'duplicate_account');
    seen.add(account.id);

    if (ledger === null) ledger = account.ledger;
    else if (account.ledger !== ledger) {
      throw new LedgerError(
        `a transaction may not span ledgers: ${ledger} and ${account.ledger} in ${opKey}. ` +
          'Purchased value and earned play value are separate books by design.',
        'cross_ledger',
      );
    }
    sum += leg.amount;
    return { account: account.id, amount: leg.amount };
  });

  if (sum !== 0) {
    throw new LedgerError(`legs must sum to zero, got ${sum} in ${opKey}`, 'unbalanced');
  }

  const id = transactionId(opKey);
  return Object.freeze({
    id,
    ledger,
    kind,
    opKey,
    at,
    memo: intent?.memo ?? null,
    meta: Object.freeze({ ...(intent?.meta ?? {}) }),
    entries: Object.freeze(
      parsed.map((leg, index) =>
        Object.freeze({ id: entryId(id, index), txId: id, leg: index, account: leg.account, amount: leg.amount }),
      ),
    ),
  });
}

/** Net effect on each account, for applying a planned transaction to a balance map. */
export function effects(transaction) {
  const out = new Map();
  for (const entry of transaction.entries) out.set(entry.account, (out.get(entry.account) ?? 0) + entry.amount);
  return out;
}

/**
 * Would this transaction overdraw an account that must never go negative? Returns the offending
 * account ids, so the caller can refuse before writing. At M3 the same rule also exists as a CHECK
 * constraint, and the constraint is the authority — this is the early, friendlier refusal, not the
 * guarantee.
 */
export function overdrafts(transaction, balances) {
  const bad = [];
  for (const [account, delta] of effects(transaction)) {
    const meta = parseAccount(account);
    if (meta.mayGoNegative) continue;
    const next = (balances?.get?.(account) ?? balances?.[account] ?? 0) + delta;
    if (next < 0) bad.push(account);
  }
  return bad;
}
