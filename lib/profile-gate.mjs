/**
 * lib/profile-gate.mjs — when the profile gate may ask, and the record it asks against.
 *
 * The gate asks for a display name and an email on a first landing. It is skippable by design, and
 * the one rule that keeps it from becoming a dark pattern lives here: after a skip the gate stays
 * quiet for three more visits, and once a profile is claimed it never asks again. There is no
 * countdown, no penalty for skipping and no second ask inside the same visit.
 *
 * The record is persisted on the device (localStorage `fd-gate`), so it goes through `readGate`:
 * a good record round-trips (`readGate(JSON.parse(JSON.stringify(g)))` deep-equals `g`) and any
 * garbage yields `emptyGate()` rather than throwing. The reducers are identity-preserving — a
 * repeated visit at the same millisecond, a skip after a claim, or a re-claim of the same address
 * returns the object it was given.
 *
 * Pure: every timestamp is passed in, nothing here reads a clock or storage.
 */

export const GATE = Object.freeze({
  /** localStorage key the mount in app/arena.tsx reads and writes. */
  storageKey: 'fd-gate',
  /** Visits that must pass after a skip before the gate asks again. */
  askAgainAfterVisits: 3,
  /** The record is a tail, not a log: only the most recent stamps are worth keeping. */
  maxVisits: 32,
  maxSkips: 8,
});

const isStamp = (value) => Number.isSafeInteger(value) && value > 0;

/** The record a device that has never been asked anything holds. */
export function emptyGate() {
  return { claimed: false, email: null, skippedAt: [], visits: [] };
}

const stamps = (value, limit) =>
  (Array.isArray(value) ? value.filter(isStamp) : []).sort((a, b) => a - b).slice(-limit);

/** The sanitiser for the persisted record. Anything unexpected is an empty record, never a throw. */
export function readGate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyGate();
  const email = typeof value.email === 'string' && value.email.length > 0 && value.email.length <= 254 ? value.email : null;
  return {
    claimed: value.claimed === true,
    email,
    skippedAt: stamps(value.skippedAt, GATE.maxSkips),
    visits: stamps(value.visits, GATE.maxVisits),
  };
}

/** One landing. Called once per mount, before `gateDecision`, so the current visit is counted. */
export function noteVisit(gate, now) {
  if (!isStamp(now) || gate.visits[gate.visits.length - 1] === now) return gate;
  return { ...gate, visits: [...gate.visits, now].slice(-GATE.maxVisits) };
}

/** "Play as guest". A claimed profile is never re-opened, so a skip after a claim changes nothing. */
export function noteSkip(gate, now) {
  if (!isStamp(now) || gate.claimed || gate.skippedAt[gate.skippedAt.length - 1] === now) return gate;
  return { ...gate, skippedAt: [...gate.skippedAt, now].slice(-GATE.maxSkips) };
}

/**
 * The claim. The address is what the person typed — nothing about it has been verified, and this
 * record never pretends otherwise; it exists so Settings can show the address and offer the link.
 */
export function noteClaim(gate, email) {
  const address = typeof email === 'string' && email.trim() ? email.trim().toLowerCase().slice(0, 254) : null;
  if (gate.claimed && gate.email === address) return gate;
  return { ...gate, claimed: true, email: address };
}

/**
 * Should the gate be on screen?
 *
 * Show it when the profile was never claimed AND (it was never skipped, or at least
 * `GATE.askAgainAfterVisits` visits have been recorded since the last skip).
 *
 * `visits` is the list of landing timestamps this device kept, oldest first — `noteVisit` has
 * already appended the current one. A plain number is accepted too and read as "visits recorded
 * since the last skip", which is all a device that keeps a bare counter has. Stamps after `now`
 * (a clock that moved, or a tampered record) are ignored rather than trusted.
 *
 * @returns {{ show: boolean, reason: 'claimed'|'first'|'waiting'|'ask-again', sinceSkip: number }}
 */
export function gateDecision({ claimed = false, skippedAt = [], visits = [], now = 0 } = {}) {
  if (claimed === true) return Object.freeze({ show: false, reason: 'claimed', sinceSkip: 0 });
  const bounded = (value) => isStamp(value) && (!isStamp(now) || value <= now);
  const skips = Array.isArray(skippedAt) ? skippedAt.filter(bounded) : [];
  if (!skips.length) return Object.freeze({ show: true, reason: 'first', sinceSkip: 0 });
  const lastSkip = Math.max(...skips);
  const sinceSkip = Array.isArray(visits)
    ? visits.filter((value) => bounded(value) && value > lastSkip).length
    : Number.isFinite(visits) && visits > 0
      ? Math.trunc(visits)
      : 0;
  const show = sinceSkip >= GATE.askAgainAfterVisits;
  return Object.freeze({ show, reason: show ? 'ask-again' : 'waiting', sinceSkip });
}
