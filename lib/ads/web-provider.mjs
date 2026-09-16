/**
 * The web ad provider: the NULL provider with a door for a real integration.
 *
 * WHY. The game must build and run with no ad network at all (local dev, the static build, a
 * region nothing will serve), and a real H5 Games Ads / GPT integration must be droppable later
 * without touching a screen, a hook or the economy. So this provider makes NO network calls and
 * imports NO SDK. It looks for one thing, a window-level hook the host page may install:
 *
 *   window.__fdAds = {
 *     available(): boolean | Promise<boolean>,
 *     show({ placement }): Promise<{ completed: boolean, adId?: string, reason?: string }>,
 *   };
 *
 * With no hook installed it answers exactly as NullAdProvider does — `available()` is false and
 * `show()` refuses with `unavailable` — so the card says "No ads in this build" and never pretends
 * one played. With a hook installed, `show` returns a completion RECEIPT stamped by this module
 * (adId from the host, `at` from the injected clock, the region the wallet was opened with), which
 * the economy pays exactly once via `earnFromAd`. A hook that throws, hangs past the timeout, or
 * returns a malformed answer is a `failed` refusal, never a payment: the reducer's caps and
 * cooldowns still apply on top, and on the web nothing here is server-verified (decision.md §1).
 *
 * Refusal reasons the UI puts in words: 'unavailable' (no hook, or the network had nothing),
 * 'skipped' (the player closed the ad early), 'failed' (the hook errored or lied).
 */
import { PLACEMENTS } from './provider.mjs';

const refusal = (reason) => Object.freeze({ completed: false, reason, receipt: null });

/** Whatever the host page installed, or nothing. Read on every call, never cached, so an
 *  integration that loads late is picked up the next time a card is opened. */
const hook = () => (typeof window !== 'undefined' ? window.__fdAds : undefined);

/** A show that never resolves is a black ad screen; the card must get its refusal. */
const SHOW_TIMEOUT_MS = 60_000;

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('ad timed out')), ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });

export class WebAdProvider {
  name = 'web';
  serverVerified = false;

  /** @param {{ region?: string, now?: () => number }} [options] */
  constructor({ region = '*', now = () => Date.now() } = {}) {
    this.region = region;
    this.now = now;
    this.counter = 0;
  }

  async available() {
    const h = hook();
    if (!h || typeof h.show !== 'function') return false;
    try {
      return typeof h.available === 'function' ? !!(await h.available()) : true;
    } catch {
      return false;
    }
  }

  /** @param {{ placement: string }} request */
  async show({ placement } = {}) {
    const h = hook();
    if (!h || typeof h.show !== 'function') return refusal('unavailable');
    if (!PLACEMENTS.includes(placement)) return refusal('failed');
    let out;
    try {
      out = await withTimeout(h.show({ placement }), SHOW_TIMEOUT_MS);
    } catch {
      return refusal('failed');
    }
    if (!out || typeof out !== 'object') return refusal('failed');
    if (out.completed !== true) return refusal(typeof out.reason === 'string' ? out.reason : 'skipped');
    // The host's id is the idempotency key; a host that returns none gets a per-session one, which
    // still stops a double-firing callback from paying twice within this page.
    const adId =
      typeof out.adId === 'string' && out.adId.length > 0 && out.adId.length <= 128
        ? out.adId
        : `web-${++this.counter}-${this.now()}`;
    return Object.freeze({
      completed: true,
      reason: 'completed',
      receipt: Object.freeze({ adId, placement, at: this.now(), region: this.region }),
    });
  }
}
