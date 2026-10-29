/** Device-only question memory. Never synchronised into human server results or trophies. */
import { STORAGE } from './storage-names.mjs';
import { mergeRotationHistories, readRotationHistory, recordQuestionSeen } from './question-rotation.mjs';
const fallback = new Map();
let databasePromise;
let createQueue = Promise.resolve();
const RESERVATION_MS = 20 * 60 * 1000;
const MAX_FAMILIES = 10000;
function cleanRecord(value, now) {
  const history = readRotationHistory(value?.history);
  const reservations = Object.fromEntries(Object.entries(value?.reservations || {}).filter(([, r]) => r?.expiresAt > now).slice(-16));
  const exposures = Object.fromEntries(Object.entries(value?.exposures || {}).filter(([, at]) => at > now - 2 * 86400000).slice(-256));
  return { version: 1, history, reservations, exposures };
}
export function localRotationHistory(record, now = Date.now()) {
  const clean = cleanRecord(record, now);
  return mergeRotationHistories([clean.history, ...Object.values(clean.reservations).map(r => r.history)]);
}
export function reserveLocalDeck(record, { roomId, deck, at = Date.now(), expiresAt = at + RESERVATION_MS }) {
  const clean = cleanRecord(record, at);
  if (!roomId || clean.reservations[roomId]) return clean;
  let history = {};
  for (const question of deck || []) history = recordQuestionSeen(history, question, { at });
  clean.reservations[roomId] = { expiresAt: Math.min(expiresAt, at + RESERVATION_MS), history };
  return clean;
}
export function exposeLocalQuestion(record, { roomId, roundId, question, at = Date.now(), finished = false }) {
  const clean = cleanRecord(record, at), event = `${roomId}/${roundId}`;
  if (question && roomId && roundId && !clean.exposures[event]) {
    clean.history = recordQuestionSeen(clean.history, question, { at });
    clean.exposures[event] = at;
    if (Object.keys(clean.history).length > MAX_FAMILIES) clean.history = Object.fromEntries(Object.entries(clean.history).sort((a, b) => b[1] - a[1]).slice(0, MAX_FAMILIES));
  }
  if (finished) delete clean.reservations[roomId];
  return clean;
}
function openDatabase() {
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Browser storage unavailable')); return; }
    let done = false;
    const fail = error => { if (done) return; done = true; clearTimeout(timer); reject(error); };
    const timer = setTimeout(() => fail(new Error('Question memory could not open')), 4000);
    const request = indexedDB.open(STORAGE.questionHistoryDb, 1);
    request.onupgradeneeded = () => {
      if (done) { request.transaction?.abort(); return; }
      request.result.createObjectStore('epochs');
    };
    request.onerror = () => fail(request.error);
    request.onblocked = () => fail(new Error('Question memory is blocked'));
    request.onsuccess = () => {
      const db = request.result;
      if (done) { db.close(); return; }
      done = true; clearTimeout(timer);
      db.onversionchange = () => { db.close(); databasePromise = undefined; };
      resolve(db);
    };
  }).catch(error => { databasePromise = undefined; throw error; });
  return databasePromise;
}
/** A single read/write transaction prevents two tabs losing exposure writes. */
async function transact(epoch, update = value => value) {
  const key = typeof epoch === 'string' && epoch ? epoch : 'initial';
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('epochs', 'readwrite'), store = tx.objectStore('epochs');
      let output;
      const read = store.get(key);
      read.onsuccess = () => {
        try { output = update(read.result); if (output) store.put(output, key); }
        catch (error) { tx.abort(); reject(error); }
      };
      tx.oncomplete = () => resolve(output);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Question memory interrupted'));
    });
  } catch {
    // Storage-denied browsers remain playable; this tab still rotates until it closes.
    const result = update(fallback.get(key)); fallback.set(key, result); return result;
  }
}
/** Web Locks serialize selection + reservation across tabs; fallback serializes this tab. */
export async function withLocalQuestionHistory(epoch, create) {
  const work = async () => {
    const record = await transact(epoch);
    const made = await create(localRotationHistory(record));
    await transact(epoch, current => reserveLocalDeck(current, made));
    return made.result;
  };
  if (globalThis.navigator?.locks?.request) return navigator.locks.request(`${STORAGE.questionHistoryDb}/${epoch}`, work);
  const pending = createQueue.then(work, work);
  createQueue = pending.catch(() => {});
  return pending;
}
export async function recordLocalQuestionExposure(epoch, event) {
  return transact(epoch, record => exposeLocalQuestion(record, event));
}
