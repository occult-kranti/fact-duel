import { emptyProfile, readProfile, reduceProfile } from './passport.mjs';
import { readJournal } from './journal.mjs';
let databasePromise;
const DB_NAME = 'fact-duel-player',
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
        output = action ? reduceProfile(before, action) : before;
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
