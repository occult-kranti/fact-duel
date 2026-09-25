import { emptyProfile, readProfile, reduceProfile } from './passport.mjs';
import { readJournal } from './journal.mjs';
import { STORAGE } from './storage-names.mjs';
let databasePromise;
const DB_NAME = STORAGE.playerDb,
  KEY = 'player';
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
        request.result.createObjectStore('profile');
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(new Error('Close older tabs to open player storage'));
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
function migrated(legacy) {
  const profile = emptyProfile();
  profile.journal = readJournal(legacy);
  return profile;
}
/**
 * `{ type: 'replace', state }` swaps the whole stored profile for `state` — the one write that does
 * not go through `reduceProfile`. It exists for cross-device sync (lib/profile-sync.ts): a copy
 * pulled from the server is a complete reducer state that already carries its own `revision`
 * (bumped on the device that produced it, or higher), so it is stored as-is after `readProfile`
 * — the same sanitiser the load path applies — and its revision is kept, never bumped. Bumping it
 * here would make the next push claim a revision no device ever wrote. A malformed `state` is
 * refused rather than replacing the profile with the empty record.
 */
function replacement(action) {
  const state = action?.state;
  if (!state || typeof state !== 'object' || state.version !== 2) throw new Error('Not a profile');
  return readProfile(state);
}
/** @param {any} action @param {string|null} legacy */
export async function transactProfile(action, legacy = null) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profile', 'readwrite'),
      store = tx.objectStore('profile');
    let output;
    const read = store.get(KEY);
    read.onsuccess = () => {
      try {
        const before = read.result ? readProfile(read.result) : migrated(legacy);
        output = !action ? before : action.type === 'replace' ? replacement(action) : reduceProfile(before, action);
        if (!read.result || output !== before) store.put(output, KEY);
      } catch (e) {
        tx.abort();
        reject(e);
      }
    };
    tx.oncomplete = () => resolve(output);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Player data update interrupted'));
  });
}
