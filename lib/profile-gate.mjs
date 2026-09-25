/**
 * lib/profile-gate.mjs — when the profile gate may ask, and the record it asks against.
 *
 * The gate asks for a display name and an email on a first landing. It is skippable by design, and
 * the one rule that keeps it from becoming a dark pattern lives here: after a skip the gate stays
 * quiet for three more VISITS AND at least half an hour, and once a profile is claimed it never
 * asks again. A visit is a session, not a page load: a landing counts only when it is at least
 * `GATE.sessionGapMs` after the one counted before it, so three reloads in a minute are one visit
 * and the skipped gate cannot come back seconds later. There is no countdown, no penalty for
 * skipping and no second ask inside the same visit.
 *
 * The record is persisted on the device (localStorage `fd-gate`), so it goes through `readGate`:
 * a good record round-trips (`readGate(JSON.parse(JSON.stringify(g)))` deep-equals `g`) and any
 * garbage yields `emptyGate()` rather than throwing. The reducers are identity-preserving — a
 * landing inside the sitting already counted, a skip after a claim, or a re-claim of the same
 * address returns the object it was given.
 *
 * Pure: every timestamp is passed in, nothing here reads a clock or storage.
 */

import { STORAGE } from './storage-names.mjs';

export const GATE = Object.freeze({
  /** localStorage key the mount in app/arena.tsx reads and writes. */
  storageKey: STORAGE.gate,
  /** Visits that must pass after a skip before the gate asks again. */
  askAgainAfterVisits: 3,
  /** A landing counts as a new visit only this long after the previously counted one. */
  sessionGapMs: 30 * 60_000,
  /** ...and this much has to have passed since the skip itself, whatever the counter says. */
  askAgainAfterMs: 30 * 60_000,
  /** The record is a tail, not a log: only the most recent stamps are worth keeping. */
  maxVisits: 32,
  maxSkips: 8,
});

/**
 * The display name a player has until they choose one. It lives here, next to the record the gate
 * writes, so `app/arena.tsx` (which seeds its state with it) and `app/shell/profile-gate.tsx`
 * (which must not pre-fill the field with it) agree on one string instead of two copies.
 */
export const DEFAULT_NAME = 'Challenger';

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

/**
 * One landing. Called once per mount, before `gateDecision`, so the current visit is counted.
 *
 * A reload is not a visit: the stamp is kept only when it is at least `GATE.sessionGapMs` after
 * the last one kept (and never before it — a clock that went backwards is ignored), so "3 visits"
 * means three sittings rather than three presses of the reload key. The record is returned
 * unchanged in every other case, which is what makes a reload storm free.
 */
export function noteVisit(gate, now) {
  if (!isStamp(now)) return gate;
  const last = gate.visits[gate.visits.length - 1];
  if (isStamp(last) && now - last < GATE.sessionGapMs) return gate;
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
 * Show it when the profile was never claimed AND (it was never skipped, or BOTH at least
 * `GATE.askAgainAfterVisits` visits have been counted since the last skip AND at least
 * `GATE.askAgainAfterMs` has passed since that skip). Both clauses are needed: the counter alone
 * would let three quick landings re-open the sheet, and the clock alone would re-open it for
 * somebody who never came back.
 *
 * `visits` is the list of landing timestamps this device kept, oldest first — `noteVisit` has
 * already appended the current one. A plain number is accepted too and read as "visits recorded
 * since the last skip", which is all a device that keeps a bare counter has; with a bare counter
 * there is nothing to check the elapsed time against, so `now - lastSkip` still has to clear
 * `GATE.askAgainAfterMs`. Stamps after `now` (a clock that moved, or a tampered record) are
 * ignored rather than trusted.
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
  const waited = isStamp(now) ? now - lastSkip >= GATE.askAgainAfterMs : false;
  const show = waited && sinceSkip >= GATE.askAgainAfterVisits;
  return Object.freeze({ show, reason: show ? 'ask-again' : 'waiting', sinceSkip });
}
