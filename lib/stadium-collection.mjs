/** Device-local stadium collectibles. Club points are free play credits, never match coins. */
import { STORAGE } from './storage-names.mjs';
import { readOverRewards } from './over-rewards.mjs';
export const CLUB_DB = STORAGE.stadiumClubDb;
export const CLUB_POINT_RULES = Object.freeze({ match: 30, correct: 3 });
const DAY = 86_400_000;
const MAX_POINTS = 1_000_000_000;
const item = (id, slot, name, price, description) => Object.freeze({ id, slot, name, price, description });
export const CLUB_ITEMS = Object.freeze([
  item('title-rookie', 'title', 'Gully captain', 0, 'Every big ground starts in a small gully.'),
  item('title-menace', 'title', 'Matchday menace', 45, 'All confidence. Now bring the answers.'),
  item('title-pundit', 'title', 'Pavilion pundit', 120, 'A title for a well-stocked cricket brain.'),
  item('card-turf', 'card', 'Turf edition', 0, 'Deep green. Clean whites. Yours from day one.'),
  item('card-sunset', 'card', 'Sunset foil', 90, 'Apricot light across your player card.'),
  item('card-night', 'card', 'Floodlight chrome', 180, 'Midnight blue with an electric-lime edge.'),
  item('stand-terrace', 'stand', 'Gully terrace', 0, 'A little home ground with a lot of heart.'),
  item('stand-pavilion', 'stand', 'The pavilion', 90, 'Build a two-tier pavilion beside your pitch.'),
  item('light-day', 'light', 'Day session', 0, 'Sun on the wicket. No lights needed.'),
  item('light-floodlights', 'light', 'Floodlight towers', 120, 'Raise four light towers around your ground.'),
  item('board-manual', 'board', 'Scorekeeper stand', 0, 'The original hand-kept scorecard.'),
  item('board-screen', 'board', 'The big screen', 150, 'Put your club initials up in lights.'),
]);
export const CLUB_SLOTS = Object.freeze(['title', 'card', 'stand', 'light', 'board']);
const STARTERS = CLUB_ITEMS.filter((i) => i.price === 0).map((i) => i.id);
const BY_ID = new Map(CLUB_ITEMS.map((i) => [i.id, i]));
const nat = (v, max = MAX_POINTS) => Number.isSafeInteger(v) && v > 0 ? Math.min(v, max) : 0;
const epochOf = (profile) => typeof profile?.epoch === 'string' && profile.epoch.length <= 100 ? profile.epoch : 'initial';

export function createClubRecord(epoch = 'initial') {
  return { version: 1, epoch, earned: 0, owned: [...STARTERS], equipped: Object.fromEntries(CLUB_ITEMS.filter((i) => !i.price).map((i) => [i.slot, i.id])), badge: 'fresh-win' };
}

/** Rebuild from catalogue truth: unknown ids, wrong-slot equipment and overspent saves are rejected. */
export function readClubRecord(value, epoch = 'initial') {
  const next = createClubRecord(epoch);
  if (!value || value.version !== 1 || value.epoch !== epoch) return next;
  next.earned = nat(value.earned);
  let spent = 0;
  for (const id of Array.isArray(value.owned) ? value.owned : []) {
    const entry = BY_ID.get(id);
    if (!entry || next.owned.includes(id) || spent + entry.price > next.earned) continue;
    next.owned.push(id);
    spent += entry.price;
  }
  for (const slot of CLUB_SLOTS) {
    const id = value.equipped?.[slot];
    if (BY_ID.get(id)?.slot === slot && next.owned.includes(id)) next.equipped[slot] = id;
  }
  next.badge = ['fresh-win', 'hot-hand', 'none'].includes(value.badge) ? value.badge : 'fresh-win';
  return next;
}

export function clubBalance(record) {
  return Math.max(0, record.earned - record.owned.reduce((sum, id) => sum + (BY_ID.get(id)?.price ?? 0), 0));
}

/** Cumulative counters already deduplicate room events. Reading or reopening never grants again. */
export function reconcileClub(record, profile) {
  const next = readClubRecord(record, epochOf(profile));
  const c = profile?.progression?.counters;
  const total = Math.min(MAX_POINTS, nat(c?.matches, 1_000_000) * CLUB_POINT_RULES.match + Math.min(nat(c?.correct, 10_000_000), nat(c?.rounds, 10_000_000)) * CLUB_POINT_RULES.correct + readOverRewards(profile?.progression?.overRewards).clubPoints);
  next.earned = Math.max(next.earned, total);
  return next;
}

export function buyClubItem(record, id) {
  const next = readClubRecord(record, record.epoch);
  const entry = BY_ID.get(id);
  if (!entry) return { record: next, status: 'unknown' };
  if (next.owned.includes(id)) return { record: next, status: 'owned' };
  if (clubBalance(next) < entry.price) return { record: next, status: 'insufficient' };
  next.owned.push(id);
  next.equipped[entry.slot] = id;
  return { record: next, status: 'bought' };
}

export function equipClubItem(record, id) {
  const next = readClubRecord(record, record.epoch);
  const entry = BY_ID.get(id);
  if (!entry || !next.owned.includes(id)) return { record: next, status: 'locked' };
  next.equipped[entry.slot] = id;
  return { record: next, status: 'equipped' };
}

/** No client badge is a server rank. Clock-based flexes have visible expiry and no reward attached. */
export function activeClubBadges(profile, now = Date.now()) {
  const seen = new Set();
  const matches = (Array.isArray(profile?.journal?.matches) ? profile.journal.matches : [])
    .filter((m) => {
      if (!m || typeof m.id !== 'string' || seen.has(m.id) || !Number.isFinite(m.at) || m.at > now || m.at <= now - DAY || !['win', 'loss', 'draw'].includes(m.outcome)) return false;
      seen.add(m.id); return true;
    }).sort((a, b) => b.at - a.at);
  const badges = [];
  const win = matches.find((m) => m.outcome === 'win');
  if (win) badges.push({ id: 'fresh-win', name: 'Fresh victory', expiresAt: win.at + DAY, detail: 'A match win in the past 24 hours' });
  if (matches.length >= 3 && matches.slice(0, 3).every((m) => m.outcome === 'win')) badges.push({ id: 'hot-hand', name: 'Hat-trick heat', expiresAt: matches[2].at + DAY, detail: 'Your latest three matches were wins, all within 24 hours' });
  return badges;
}

let database;
function openClubDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Club storage unavailable')); return; }
    let finished = false;
    const timer = setTimeout(() => fail(new Error('Club storage timed out')), 4000);
    const fail = (error) => { if (finished) return; finished = true; clearTimeout(timer); reject(error); };
    const request = indexedDB.open(CLUB_DB, 1);
    request.onupgradeneeded = () => {
      if (finished) { request.transaction?.abort(); return; }
      request.result.createObjectStore('club');
    };
    request.onerror = () => fail(request.error);
    request.onblocked = () => fail(new Error('Close older tabs to open club storage'));
    request.onsuccess = () => {
      const db = request.result;
      if (finished) { db.close(); return; }
      finished = true; clearTimeout(timer);
      db.onversionchange = () => { db.close(); database = undefined; };
      resolve(db);
    };
  }).catch((error) => { database = undefined; throw error; });
  return database;
}

/** @param {{ type: string, id: string } | null} action */
export function reduceClub(record, profile, action = null) {
  const current = reconcileClub(record, profile);
  if (action?.type === 'buy') return buyClubItem(current, action.id);
  if (action?.type === 'equip') return equipClubItem(current, action.id);
  if (action?.type === 'badge' && ['fresh-win', 'hot-hand', 'none'].includes(action.id)) return { record: { ...current, badge: action.id }, status: 'equipped' };
  return { record: current, status: 'ready' };
}

/** One read/write transaction per action serializes two tabs as well as a rapid double tap.
 * @param {{ type: string, id: string } | null} action
 */
export async function transactClub(profile, action = null) {
  const db = await openClubDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('club', 'readwrite');
    const store = tx.objectStore('club');
    const key = epochOf(profile);
    let result;
    const request = store.get(key);
    request.onsuccess = () => {
      try { result = reduceClub(request.result, profile, action); store.put(result.record, key); }
      catch (error) { tx.abort(); reject(error); }
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Club update interrupted'));
  });
}

const sessionRecords = new Map();
/** Storage-denied mode lasts only for this page session, including component remounts.
 * @param {{ type: string, id: string } | null} action
 * @param {ReturnType<typeof createClubRecord> | null} seed
 */
export function transactClubMemory(profile, action = null, seed = null) {
  const epoch = epochOf(profile);
  const result = reduceClub(sessionRecords.get(epoch) ?? seed, profile, action);
  sessionRecords.set(epoch, result.record);
  return result;
}
