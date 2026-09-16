/**
 * The device wallet's own IndexedDB store, and the small client-side policy that sits over it.
 *
 * WHY A SEPARATE DATABASE. The profile blob (lib/passport.mjs, persisted by lib/profile-store.mjs)
 * is exported unfiltered to disk by `exportAll`, is versioned by the most destructive line in the
 * repo, and is read at ten sites that must never learn a new shape. The architecture plan
 * (docs/money/architecture-plan.json, "FIFTH, AND THE BIGGEST SIMPLIFICATION") therefore rules
 * that server-held value never enters the profile: coins live in their own object store, in their
 * own database, keyed 'wallet'. Today that store IS the wallet (docs/money/ads/decision.md §1: on
 * the web a server wallet buys no integrity, so the reducer runs on the device); when accounts land
 * it becomes a cache of the ledger balance, and nothing in the profile has to move.
 *
 * WHAT THIS FILE DOES. Open, read, write — one transaction per step, in the identity-preserving
 * style of transactProfile: the step is a pure function `wallet -> wallet` from lib/economy, and a
 * step that hands back the same object is not written. The reducer never reads the clock; the
 * caller passes `at`. Below the store are the three pure pieces the React hook needs and that a
 * node test can reach without a DOM: the region placeholder, the visit step (floor, then the daily
 * grant — reciprocity before any ad is offered) and the floor's next due time.
 */
import { emptyWallet, readWallet, applyFloor, claimDaily, DEFAULT_CONFIG } from './economy/economy.mjs';

const DB_NAME = 'fact-duel-wallet',
  STORE = 'wallet',
  KEY = 'wallet';

let databasePromise;

function openDatabase() {
  if (!databasePromise)
    databasePromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('Browser storage unavailable'));
        return;
      }
      let finished = false;
      const fail = (error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        reject(error);
      };
      const timeout = setTimeout(() => fail(new Error('Browser storage did not open in time')), 4000);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (finished) {
          request.transaction?.abort();
          return;
        }
        request.result.createObjectStore(STORE);
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(new Error('Close older tabs to open wallet storage'));
      request.onsuccess = () => {
        const db = request.result;
        if (finished) {
          db.close();
          return;
        }
        finished = true;
        clearTimeout(timeout);
        db.onversionchange = () => {
          db.close();
          databasePromise = undefined;
        };
        resolve(db);
      };
    }).catch((e) => {
      databasePromise = undefined;
      throw e;
    });
  return databasePromise;
}

/**
 * Read the wallet, apply one pure step to it, and write the result back in the same transaction.
 * A `null` step is a plain read. A wallet that has never been stored is an `emptyWallet()`, and is
 * written on that first read so the row exists; after that a step whose output is the very object
 * it was given (every reducer no-op) is skipped, so a same-day visit costs no write.
 *
 * @template {object} W
 * @param {((wallet: W) => W) | null} step
 * @returns {Promise<W>} the wallet after the step
 */
export async function transactWallet(step = null) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite'),
      store = tx.objectStore(STORE);
    let output;
    const read = store.get(KEY);
    read.onsuccess = () => {
      try {
        const before = read.result ? readWallet(read.result) : emptyWallet();
        output = step ? step(before) : before;
        if (!read.result || output !== before) store.put(output, KEY);
      } catch (e) {
        tx.abort();
        reject(e);
      }
    };
    tx.oncomplete = () => resolve(output);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Wallet update interrupted'));
  });
}

/* ------------------------------------------------------------------ the client-side policy */

/**
 * The region the ad reward table is read for. PLACEHOLDER: this parses the region subtag of a BCP
 * 47 language tag (`en-IN` -> 'IN'), which is the device's locale, not its location, and is one
 * settings change away from any value. The real region arrives with accounts, from the server's
 * `cf` request headers, and replaces this at the one call site in app/use-wallet.ts. Anything the
 * parse cannot place falls to '*', the reducer's wildcard row.
 *
 * @param {string | undefined | null} language
 */
export function regionOf(language) {
  if (typeof language !== 'string') return '*';
  const part = language
    .split(/[-_]/)
    .slice(1)
    .find((p) => /^[A-Za-z]{2}$/.test(p));
  return part ? part.toUpperCase() : '*';
}

/**
 * What arrives on a visit, in the order the gamification lane requires (rule (d), reciprocity
 * first): the floor lifts a broke wallet, then the daily grant lands — both before any ad is on
 * the screen. Both reducers are identity when nothing is owed, so this step is a no-op on every
 * repeat visit inside a day and the store skips the write.
 *
 * @param {{ at: number, tzOffsetMinutes: number }} when
 * @param {typeof DEFAULT_CONFIG} [config]
 */
export const visitStep =
  ({ at, tzOffsetMinutes }, config = DEFAULT_CONFIG) =>
  (wallet) =>
    claimDaily(applyFloor(wallet, { at }, config).wallet, { at, tzOffsetMinutes }, config).wallet;

/**
 * When the floor next tops this wallet up, for the honest line on the ad card ("Floor top-up in
 * 2h 10m"). `0` when the wallet is at or above the floor (nothing to top up) — the card then says
 * the floor is there for when it is needed rather than counting down to nothing.
 *
 * @param {object} wallet
 * @param {typeof DEFAULT_CONFIG} [config]
 */
export function floorDueAt(wallet, config = DEFAULT_CONFIG) {
  if (wallet.coins >= config.floor.coins || wallet.coins >= config.softCap) return 0;
  return wallet.lastFloorAt ? wallet.lastFloorAt + config.floor.everyMs : 1;
}
