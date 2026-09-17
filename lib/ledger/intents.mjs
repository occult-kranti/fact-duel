/**
 * The complete vocabulary of things that may move value. If an operation is not here, it cannot
 * happen — and the list is deliberately short.
 *
 * Every function returns a planned transaction from `posting.plan`, so each one is a pure mapping
 * from a domain event to a balanced set of legs. The operation key of each names the real-world
 * occurrence exactly once, which is what makes a retry a no-op rather than a second payment.
 *
 * Note what is NOT here:
 *
 *  - There is no cash-out, at any milestone. `lib/policy/policy-engine.mjs` refuses the question at
 *    the compiled-in ceiling, and there is no intent here that could serve it even if the policy
 *    said yes. The liability account exists so the books can express money owed to players; nothing
 *    pays it out.
 *  - There is no `mint` on the value ledger. Purchased value enters only through `purchase`, only
 *    against a provider reference, and only after the provider has confirmed — you do not credit
 *    coins you have not been paid for.
 *  - There is no `stake` on the value ledger. `stake` names the play treasury's currency explicitly
 *    and `plan()` would refuse a cross-ledger transaction anyway. Both facts are tested.
 */
import { plan } from './posting.mjs';
import {
  LedgerError,
  PLAY_TREASURY,
  VALUE_LIABILITY,
  VALUE_REVENUE,
  escrowAccount,
  parseAccount,
  userAccount,
} from './accounts.mjs';

const positive = (amount, what) => {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new LedgerError(`${what} must be a positive integer, got ${amount}`, 'bad_amount');
  }
  return amount;
};

/** The server observed something worth rewarding. Play ledger only — this is where free coins come from. */
export function grant({ principalId, amount, opKey, at, reason }) {
  positive(amount, 'a grant');
  return plan({
    opKey,
    kind: 'grant',
    at,
    memo: reason ?? null,
    legs: [
      { account: PLAY_TREASURY, amount: -amount },
      { account: userAccount('play', principalId), amount },
    ],
  });
}

/**
 * A player commits coins to a match. The escrow is a real account, owned by neither seat, so
 * committed value is visible in the books for as long as it is in play rather than vanishing into a
 * room blob and reappearing on settlement.
 */
export function stake({ principalId, roomId, amount, opKey, at }) {
  positive(amount, 'a stake');
  return plan({
    opKey,
    kind: 'stake',
    at,
    meta: { roomId },
    legs: [
      { account: userAccount('play', principalId), amount: -amount },
      { account: escrowAccount(roomId), amount },
    ],
  });
}

/**
 * A match ends. `payouts` is the whole distribution — one entry for the winner, or two for a draw —
 * and it must exhaust the escrow exactly, because an escrow that settles to less than its balance
 * leaves value stranded in a match that no longer exists and one that settles to more overdraws it.
 */
export function settle({ roomId, payouts, opKey, at, reason, fee = 0 }) {
  if (!Array.isArray(payouts) || !payouts.length) {
    throw new LedgerError('a settlement must say who is paid', 'bad_payouts');
  }
  if (!Number.isSafeInteger(fee) || fee < 0) throw new LedgerError('a fee must be a non-negative integer', 'bad_amount');
  // Payouts are netted per principal before they become legs. `plan()` refuses two legs against one
  // account — correctly, because elsewhere that is always a caller bug — but here it is legitimate:
  // one player can hold both sides of a settlement (both seats of a practice match, or a draw that
  // returns each seat its own stake), and paying the same person twice in one settlement is one
  // payment of the sum. Netting here keeps that fact in the layer that understands it.
  const net = new Map();
  let total = 0;
  for (const { principalId, amount } of payouts) {
    positive(amount, 'a payout');
    total += amount;
    const account = userAccount('play', principalId);
    net.set(account, (net.get(account) ?? 0) + amount);
  }
  const legs = [...net].map(([account, amount]) => ({ account, amount }));
  // The disclosed arena fee is a burn: it leaves the escrow and returns to the treasury, which
  // reduces lifetime issuance rather than enriching anyone. Payouts plus fee must exhaust the
  // escrow exactly, and `plan()` enforces that by refusing legs that do not sum to zero.
  if (fee > 0) legs.push({ account: PLAY_TREASURY, amount: fee });
  return plan({
    opKey,
    kind: 'settle',
    at,
    memo: reason ?? null,
    meta: { roomId, fee },
    legs: [{ account: escrowAccount(roomId), amount: -(total + fee) }, ...legs],
  });
}

/**
 * Coins leave a player and return to the treasury: a sink. This is the drill entry and any other
 * priced-in-coins thing the house offers. Nothing is paid to anyone; lifetime issuance falls by the
 * amount, which is the honest accounting of a coin that has been used up.
 */
export function burn({ principalId, amount, opKey, at, reason }) {
  positive(amount, 'a burn');
  return plan({
    opKey,
    kind: 'burn',
    at,
    memo: reason ?? null,
    legs: [
      { account: userAccount('play', principalId), amount: -amount },
      { account: PLAY_TREASURY, amount },
    ],
  });
}

/**
 * Real money confirmed by the provider becomes spendable value. The operator now owes the player
 * something, which is what the liability account records — this is a debt, not income, and it only
 * becomes income when the player spends it.
 */
export function purchase({ principalId, amount, providerRef, at }) {
  positive(amount, 'a purchase');
  if (!providerRef) throw new LedgerError('a purchase must cite the provider reference that confirmed it', 'no_provider_ref');
  return plan({
    opKey: `purchase:${providerRef}`,
    kind: 'purchase',
    at,
    meta: { providerRef },
    legs: [
      { account: VALUE_LIABILITY, amount: -amount },
      { account: userAccount('value', principalId), amount },
    ],
  });
}

/** Purchased value leaves the player and becomes the operator's. The only exit for the value ledger. */
export function spend({ principalId, amount, opKey, at, item }) {
  positive(amount, 'a spend');
  return plan({
    opKey,
    kind: 'spend',
    at,
    memo: item ?? null,
    legs: [
      { account: userAccount('value', principalId), amount: -amount },
      { account: VALUE_REVENUE, amount },
    ],
  });
}

/** The provider reversed a payment. Unwinds a purchase; the player's balance may not go negative. */
export function reverse({ principalId, amount, providerRef, at }) {
  positive(amount, 'a reversal');
  if (!providerRef) throw new LedgerError('a reversal must cite the provider reference', 'no_provider_ref');
  return plan({
    opKey: `reverse:${providerRef}`,
    kind: 'reverse',
    at,
    meta: { providerRef },
    legs: [
      { account: userAccount('value', principalId), amount: -amount },
      { account: VALUE_LIABILITY, amount },
    ],
  });
}

/**
 * Which intents exist, and on which ledger each is allowed to operate. Exported so a test can assert
 * the list has not silently grown, and so the answer to "can purchased value be staked?" is one
 * readable table rather than a search through call sites.
 */
export const INTENTS = Object.freeze({
  grant: { ledger: 'play', fn: grant },
  stake: { ledger: 'play', fn: stake },
  settle: { ledger: 'play', fn: settle },
  burn: { ledger: 'play', fn: burn },
  purchase: { ledger: 'value', fn: purchase },
  spend: { ledger: 'value', fn: spend },
  reverse: { ledger: 'value', fn: reverse },
});

/** The ledger an intent kind is permitted to touch, or null if the kind is not an intent at all. */
export const ledgerFor = (kind) => INTENTS[kind]?.ledger ?? null;

/** True when a planned transaction is on the ledger its kind is allowed to touch. */
export function wellFormed(transaction) {
  const expected = ledgerFor(transaction?.kind);
  if (!expected) return false;
  if (transaction.ledger !== expected) return false;
  return transaction.entries.every((e) => parseAccount(e.account).ledger === expected);
}
