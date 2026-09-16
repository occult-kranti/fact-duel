/**
 * The seam between the game and whoever shows the ads.
 *
 * The game never talks to an ad SDK directly. It asks a provider for a rewarded ad at a named
 * placement, gets back a completion RECEIPT or a refusal, and hands the receipt to the economy —
 * `earnFromAd` keys on `receipt.adId`, so the same completion is never paid twice however many
 * times a callback fires. The provider is the only thing that knows whether an ad actually ran.
 *
 * Why an interface rather than an import: the web app and a store-wrapped build will use different
 * networks with different guarantees (a browser rewarded ad may have no server-side verification;
 * AdMob's does), the static build and local dev have no ads at all, and tests need scripted
 * outcomes. All four must be swappable without the game noticing, and the NULL provider must be the
 * default — a build that cannot show ads says so honestly rather than pretending one played.
 *
 * Placements are named so the economy and the analytics can reason about where the ad was asked
 * for, and so a screen can never invent a new reason to show one.
 */

export const PLACEMENTS = Object.freeze(['coins', 'practice-entry', 'duel-entry', 'continue']);

/** What a completed ad hands back. `adId` must be unique per completion; it is the idempotency key. */
export const receiptShape = Object.freeze({ adId: 'string', placement: 'string', at: 'number', region: 'string' });

export function validReceipt(r) {
  return (
    !!r &&
    typeof r === 'object' &&
    typeof r.adId === 'string' &&
    r.adId.length > 0 &&
    r.adId.length <= 128 &&
    PLACEMENTS.includes(r.placement) &&
    Number.isSafeInteger(r.at) &&
    r.at > 0 &&
    typeof r.region === 'string'
  );
}

/** Every provider exposes these. `verify` is optional: only a provider with a server-side callback can offer it. */
export const REQUIRED = Object.freeze(['name', 'available', 'show']);

export function assertProvider(p) {
  const missing = REQUIRED.filter((k) => (k === 'name' ? typeof p?.name !== 'string' : typeof p?.[k] !== 'function'));
  if (missing.length) throw new Error(`ad provider is missing: ${missing.join(', ')}`);
  if (p.verify !== undefined && typeof p.verify !== 'function') throw new Error('ad provider verify must be a function');
  return p;
}

/**
 * No ads. The default everywhere an ad network is not configured — local dev, the static build, a
 * region the network will not serve. `show` resolves (never rejects) with `completed: false` and a
 * reason the UI can put in words, because "watch an ad to continue" with no ad to watch is a locked
 * door, and the screen must know to offer the other way in.
 */
export class NullAdProvider {
  name = 'null';
  serverVerified = false;
  async available() {
    return false;
  }
  async show() {
    return Object.freeze({ completed: false, reason: 'unavailable', receipt: null });
  }
}

/**
 * Scripted outcomes for tests: each call to `show` consumes the next entry of `script`. An entry of
 * `true` completes with a fresh receipt, `false` is a skip, a string is a failure reason, and an
 * object is used as the receipt verbatim (to test bad receipts). Running past the script refuses.
 */
export class RecordingAdProvider {
  name = 'recording';
  serverVerified = true;
  constructor(script = [], { region = 'US', now = () => 1 } = {}) {
    this.script = [...script];
    this.region = region;
    this.now = now;
    this.shown = [];
    this.counter = 0;
  }
  async available() {
    return this.script.length > 0;
  }
  async show({ placement } = {}) {
    this.shown.push(placement);
    if (!this.script.length) return Object.freeze({ completed: false, reason: 'unavailable', receipt: null });
    const next = this.script.shift();
    if (next === true) {
      this.counter += 1;
      const receipt = Object.freeze({ adId: `rec-${this.counter}`, placement, at: this.now(), region: this.region });
      return Object.freeze({ completed: true, reason: 'completed', receipt });
    }
    if (next === false) return Object.freeze({ completed: false, reason: 'skipped', receipt: null });
    if (typeof next === 'string') return Object.freeze({ completed: false, reason: next, receipt: null });
    return Object.freeze({ completed: true, reason: 'completed', receipt: next });
  }
  /** A recording provider "verifies" any receipt it issued itself. */
  async verify(receipt) {
    return validReceipt(receipt) && /^rec-\d+$/.test(receipt.adId) && Number(receipt.adId.slice(4)) <= this.counter;
  }
}

/** The receipt's operation key on the play ledger: one ad completion, paid exactly once. */
export const adOpKey = (receipt) => `ad:${receipt.adId}`;
