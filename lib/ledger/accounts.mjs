/**
 * The account namespace, and the two-ledger partition that carries the legal guarantee.
 *
 * There are two ledgers and value never crosses between them:
 *
 *   'play'  — earned, server-authoritative, free. Stakeable. Cannot be purchased, cannot be
 *             withdrawn, and is worth nothing.
 *   'value' — purchased with real money. SPEND-ONLY: it buys things from the operator and it can
 *             never be staked against another player.
 *
 * That split is not bookkeeping tidiness, it is the fix for a specific legal exposure. Washington
 * RCW 9.46.0285 and New York Penal Law s.225.00(6) treat a credit extending the privilege of play as
 * a thing of value, and Kater v. Churchill Downs, 886 F.3d 784 (9th Cir. 2018) applied that to
 * virtual chips — so a coin that is BOUGHT and can then be STAKED and LOST supplies both the
 * consideration limb and the prize limb with no cash-out anywhere in the product. Keeping purchased
 * coins structurally incapable of entering a stake is what keeps the closed-loop model closed.
 *
 * "Structurally incapable" means exactly that: `posting.mjs` refuses a transaction whose entries do
 * not all share one ledger, and `intents.mjs` only ever emits a stake on the play ledger. There is
 * no code path, including a buggy one, that moves a purchased coin into an escrow — a caller would
 * have to express a cross-ledger transaction, and the planner throws on it. A policy note in a
 * README would not survive a refactor; this does.
 */

export const LEDGERS = Object.freeze(['play', 'value']);

/**
 * Account kinds and whether they may hold a negative balance.
 *
 * A source account is *expected* to go negative — it is where value is minted from, and its debit
 * balance is the running total of everything ever issued, which is exactly the number you want to be
 * able to read. Everything a user or a match can hold must never go negative; that is the overdraft
 * guard, and at M3 it becomes a CHECK constraint so the failure is an exception rather than a
 * silently wrong balance.
 */
export const KINDS = Object.freeze({
  user: { mayGoNegative: false, note: 'A player’s spendable balance.' },
  escrow: { mayGoNegative: false, note: 'Value committed to one match, owned by neither seat until it settles.' },
  treasury: { mayGoNegative: true, note: 'Source of minted play coins. Its negative balance is lifetime issuance.' },
  liability: { mayGoNegative: true, note: 'What the operator owes players for money already taken.' },
  revenue: { mayGoNegative: false, note: 'Value the operator has earned and players can no longer spend.' },
});

export const KIND_NAMES = Object.freeze(Object.keys(KINDS));

const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

/** `play:user:p_abc`. Parsing and formatting live together so the two can never drift apart. */
export function accountId(ledger, kind, owner) {
  if (!LEDGERS.includes(ledger)) throw new LedgerError(`unknown ledger: ${ledger}`, 'bad_ledger');
  if (!KIND_NAMES.includes(kind)) throw new LedgerError(`unknown account kind: ${kind}`, 'bad_kind');
  if (!SEGMENT.test(String(owner ?? ''))) throw new LedgerError(`bad account owner: ${owner}`, 'bad_owner');
  return `${ledger}:${kind}:${owner}`;
}

export function parseAccount(id) {
  const parts = String(id ?? '').split(':');
  if (parts.length !== 3) throw new LedgerError(`malformed account id: ${id}`, 'bad_account');
  const [ledger, kind, owner] = parts;
  if (!LEDGERS.includes(ledger)) throw new LedgerError(`unknown ledger in ${id}`, 'bad_ledger');
  if (!KIND_NAMES.includes(kind)) throw new LedgerError(`unknown kind in ${id}`, 'bad_kind');
  if (!SEGMENT.test(owner)) throw new LedgerError(`bad owner in ${id}`, 'bad_owner');
  return Object.freeze({ id, ledger, kind, owner, mayGoNegative: KINDS[kind].mayGoNegative });
}

export const ledgerOf = (id) => parseAccount(id).ledger;
export const mayGoNegative = (id) => parseAccount(id).mayGoNegative;

/** The well-known singleton accounts. */
export const PLAY_TREASURY = accountId('play', 'treasury', 'mint');
export const VALUE_LIABILITY = accountId('value', 'liability', 'players');
export const VALUE_REVENUE = accountId('value', 'revenue', 'operator');

export const userAccount = (ledger, principalId) => accountId(ledger, 'user', principalId);
export const escrowAccount = (roomId) => accountId('play', 'escrow', roomId);

/** One error type, carrying a stable machine-readable code so callers never match on message text. */
export class LedgerError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'LedgerError';
    this.code = code;
  }
}
