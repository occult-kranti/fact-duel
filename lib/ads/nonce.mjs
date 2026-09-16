/**
 * The reward nonce: the only integrity a server can add to a web rewarded ad.
 *
 * No web ad network verifies completion server-side (Google: "server-side verification is an app
 * only feature"). A server therefore cannot know an ad played. What it can do is refuse to pay for
 * one it did not first agree to: it issues a short-lived nonce BEFORE the ad, binds it to the
 * player, the placement and the moment, and pays only when the completion arrives citing that
 * nonce, not before the ad could possibly have finished, not after the nonce has expired, and never
 * twice. A client that fabricates completions is then limited to one payout per nonce, at the
 * server's issuing rate, inside the daily caps — which is the ceiling on what spoofing can earn.
 *
 * Pure: the clock is passed in, the nonce id is passed in (the caller mints it with real
 * randomness; this module never does), and every check is a function of its arguments. The store
 * that remembers issued nonces is the caller's — this file only says what a valid one looks like.
 */

/** A rewarded ad is at least this long; a completion arriving sooner is not one. */
export const MIN_AD_MS = 5_000;
/** A nonce that has not been redeemed within this window is dead; the player asks for a new one. */
export const NONCE_TTL_MS = 3 * 60_000;

const ID = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Issue: bind a fresh id to who, where and when. `minMs` is the shortest plausible ad for this
 * placement (a provider may know its creative length; default to the floor).
 */
export function issueNonce({ id, principalId, placement, at, minMs = MIN_AD_MS }) {
  if (!ID.test(String(id ?? ''))) throw new Error('nonce id must be 16-128 url-safe characters');
  if (typeof principalId !== 'string' || !principalId) throw new Error('nonce needs a principal');
  if (typeof placement !== 'string' || !placement) throw new Error('nonce needs a placement');
  if (!Number.isSafeInteger(at) || at <= 0) throw new Error('nonce needs a timestamp');
  return Object.freeze({
    id,
    principalId,
    placement,
    issuedAt: at,
    expiresAt: at + NONCE_TTL_MS,
    minMs: Math.max(MIN_AD_MS, Number.isSafeInteger(minMs) ? minMs : MIN_AD_MS),
    redeemedAt: null,
  });
}

/** Every reason a redemption can fail. Fixed vocabulary, so a log can be counted. */
export const REDEEM_REASONS = Object.freeze([
  'ok',
  'unknown_nonce',
  'wrong_principal',
  'wrong_placement',
  'already_redeemed',
  'expired',
  'too_soon',
  'before_issue',
]);

/**
 * Check a completion against the nonce it cites. Returns `{ ok, reason }` and, on success, the
 * redeemed nonce to store back. Never throws on bad input — a hostile client must get a refusal,
 * not a stack trace.
 */
export function redeemNonce(nonce, { principalId, placement, at }) {
  if (!nonce || typeof nonce !== 'object') return refusal('unknown_nonce');
  if (nonce.principalId !== principalId) return refusal('wrong_principal');
  if (nonce.placement !== placement) return refusal('wrong_placement');
  if (nonce.redeemedAt !== null && nonce.redeemedAt !== undefined) return refusal('already_redeemed');
  if (!Number.isSafeInteger(at)) return refusal('before_issue');
  if (at < nonce.issuedAt) return refusal('before_issue');
  if (at > nonce.expiresAt) return refusal('expired');
  if (at - nonce.issuedAt < nonce.minMs) return refusal('too_soon');
  return Object.freeze({ ok: true, reason: 'ok', nonce: Object.freeze({ ...nonce, redeemedAt: at }) });
}

const refusal = (reason) => Object.freeze({ ok: false, reason, nonce: null });

/** The receipt's ad id, when a nonce protocol is in use: the nonce IS the completion id. */
export const nonceAdId = (nonce) => `nonce:${nonce.id}`;
