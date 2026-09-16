/**
 * What must be true of the books, expressed once and used twice.
 *
 * The reason this is a module rather than a set of assertions inside a test file is that the
 * reconciler in production and the property test in CI have to check *the same* things. A ledger
 * fails silently: a subtly wrong posting does not throw, it just makes the books wrong, and you find
 * out months later. The only defence is to state the invariants in one place and then run them
 * continuously against real data as well as against generated data.
 *
 * `check()` takes transactions in the order they were posted and replays them, so it catches an
 * account that dipped negative in the middle of a sequence and recovered — which a final-balance
 * check would miss entirely, and which is exactly what a double-spend looks like after the fact.
 */
import { parseAccount } from './accounts.mjs';
import { transactionId, entryId } from './entry-id.mjs';
import { wellFormed } from './intents.mjs';

/**
 * @param {Array<object>} transactions in posting order
 * @returns {{ok: boolean, violations: Array<{rule: string, detail: string, txId?: string}>, balances: Map<string, number>, perLedger: Record<string, number>}}
 */
export function check(transactions) {
  const violations = [];
  const balances = new Map();
  const seenTx = new Set();
  const seenEntry = new Set();
  const fail = (rule, detail, txId) => violations.push({ rule, detail, txId });

  for (const tx of transactions ?? []) {
    if (seenTx.has(tx.id)) fail('unique_transaction', `${tx.id} posted more than once`, tx.id);
    seenTx.add(tx.id);

    // An id that is not the derived id of its own operation key means someone bypassed the planner,
    // and with it the idempotency guarantee the whole design rests on.
    if (tx.id !== transactionId(tx.opKey)) {
      fail('derived_id', `${tx.id} is not the derived id of ${tx.opKey}`, tx.id);
    }
    if (!wellFormed(tx)) {
      fail('well_formed', `${tx.kind} on ledger ${tx.ledger} is not a permitted combination`, tx.id);
    }

    let sum = 0;
    for (const entry of tx.entries ?? []) {
      if (entry.id !== entryId(tx.id, entry.leg)) {
        fail('derived_id', `entry ${entry.id} is not the derived id of leg ${entry.leg}`, tx.id);
      }
      if (seenEntry.has(entry.id)) fail('unique_entry', `${entry.id} appears twice`, tx.id);
      seenEntry.add(entry.id);

      sum += entry.amount;
      const next = (balances.get(entry.account) ?? 0) + entry.amount;
      balances.set(entry.account, next);

      const meta = parseAccount(entry.account);
      if (!meta.mayGoNegative && next < 0) {
        fail('no_overdraft', `${entry.account} fell to ${next}`, tx.id);
      }
    }
    if (sum !== 0) fail('balanced', `entries sum to ${sum}, not zero`, tx.id);
  }

  // Trial balance, per ledger. Every ledger must sum to zero independently, which is a stronger
  // statement than the global sum being zero — a cross-ledger leak would net out globally.
  const perLedger = {};
  for (const [account, amount] of balances) {
    const { ledger } = parseAccount(account);
    perLedger[ledger] = (perLedger[ledger] ?? 0) + amount;
  }
  for (const [ledger, total] of Object.entries(perLedger)) {
    if (total !== 0) fail('trial_balance', `ledger ${ledger} sums to ${total}, not zero`);
  }

  return { ok: violations.length === 0, violations, balances, perLedger };
}

/** Escrows that still hold value. A non-empty escrow for a finished match is stranded value. */
export function openEscrows(balances) {
  const out = [];
  for (const [account, amount] of balances) {
    const meta = parseAccount(account);
    if (meta.kind === 'escrow' && amount !== 0) out.push({ account, roomId: meta.owner, amount });
  }
  return out;
}

/** Lifetime issuance of play coins, read straight off the treasury's debit balance. */
export const issued = (balances) => -(balances.get('play:treasury:mint') ?? 0);

/** What the operator owes players for money already taken. */
export const outstandingLiability = (balances) => -(balances.get('value:liability:players') ?? 0);
