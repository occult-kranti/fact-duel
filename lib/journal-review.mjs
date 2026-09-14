// The review schedule. It sits apart from lib/journal.mjs so that the sanitiser and every writer can
// share one copy of the ladder and of the attempt caps: R4 says a cap enforced in only one of the two
// places is a cap that does not hold, and the cheapest way to guarantee the two agree is to leave them
// nowhere to disagree. Pure and I/O-free; `at` is a parameter everywhere so a test can sit on any day.
//
// lib/journal.mjs imports trimAttempts back out of here, which closes an import cycle. It holds only
// because both sides are hoisted function declarations that run at call time — never call a journal
// helper at module scope in this file.
import { dayKey } from './journal.mjs';

/** Days to the next look, by box: box 1 -> 1 day, box 5 -> 35. A fixed ladder, not an SM-2 clone. */
export const BOX_DAYS = Object.freeze([1, 3, 7, 16, 35]);
export const MAX_BOX = BOX_DAYS.length;
export const LAPSE_DROP = 2; // a miss drops two boxes, never back to zero
export const RETIRE_DAYS = 3; // correct on three DISTINCT local days, not three answers
export const AUDIT_DAYS = 90; // a retired fact resurfaces once, then leaves the queue for good
export const REVIEW_CAP = 12; // product judgement: an uncapped queue in a game becomes homework
export const ATTEMPTS_PER_FACT = 12;
export const ATTEMPTS_TOTAL = 600;

const nat = (v) => (Number.isSafeInteger(v) && v > 0 ? v : 0);
const date = (n) => Number.isFinite(n) && n >= 0 && n <= 8.64e15;
const boxOf = (fact) => Math.min(MAX_BOX, nat(fact?.box));
const dueOf = (fact) => (date(fact?.due) ? fact.due : null);

/**
 * Local midnight `days` days on from `at`. The ladder is a DAY ladder, so a card answered at 23:50 is
 * due tomorrow morning rather than at 23:50 tomorrow, and the Date constructor absorbs the DST hour.
 */
export function dueAfter(at, days) {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

/** The schedule half of a fact record, for a fact that has been met but never reviewed. */
export const emptySchedule = () => ({ box: 0, due: null, lapses: 0, retiredAt: null });

/**
 * The new count of distinct local days this fact has been answered correctly. Days, not attempts, so a
 * five-card cram session is worth one day against RETIRE_DAYS.
 *
 * `correctDay` is used when the record carries it. Without it the last correct day is inferred from
 * `lastAt` + `lastCorrect`, which is exact except for correct -> miss -> correct inside one local day,
 * where the day is counted twice.
 */
export function nextDays(fact, correct, at = Date.now()) {
  const days = nat(fact?.days);
  if (!correct) return days;
  const last =
    typeof fact?.correctDay === 'string'
      ? fact.correctDay
      : fact?.lastCorrect === true && date(fact?.lastAt)
        ? dayKey(fact.lastAt)
        : null;
  return last === dayKey(at) ? days : days + 1;
}

/**
 * The ladder, the lapse and the retire rule in one place: given a fact record and how the attempt went,
 * the four schedule fields it should now carry. Counts, streak, firstMissAt and the rest of the record
 * belong to the writer; this returns only what the schedule owns.
 *
 * `revealed` hands the schedule straight back. Showing yourself the answer is allowed and is recorded
 * as an attempt, but it must never move a box or the Vault becomes a one-tap XP tap.
 */
export function nextSchedule(fact, { correct, revealed = false, days } = {}, at = Date.now()) {
  const box = boxOf(fact);
  const lapses = nat(fact?.lapses);
  const retiredAt = date(fact?.retiredAt) ? fact.retiredAt : null;
  if (revealed) return { box, due: dueOf(fact), lapses, retiredAt };
  if (!correct) {
    // Two boxes rather than back to zero: a lapse on a box-5 card is a slip, and wiping five weeks of
    // schedule for it is the kind of punishment that stops people answering honestly. A failed audit
    // also un-retires the fact — it clearly still needs looking at.
    return { box: Math.max(0, box - LAPSE_DROP), due: dueAfter(at, 1), lapses: lapses + 1, retiredAt: null };
  }
  // A retired fact is only ever due once more, for its audit. Passing the audit closes the queue on it
  // permanently; `due: null` is how a fact says it has no next look.
  if (retiredAt !== null) return { box, due: null, lapses, retiredAt };
  const next = Math.min(MAX_BOX, box + 1);
  const counted = days === undefined ? nextDays(fact, true, at) : nat(days);
  if (next === MAX_BOX && counted >= RETIRE_DAYS) {
    return { box: next, due: dueAfter(at, AUDIT_DAYS), lapses, retiredAt: at };
  }
  return { box: next, due: dueAfter(at, BOX_DAYS[next - 1]), lapses, retiredAt: null };
}

/** Is this fact in the queue right now? A fact met but never scheduled is due immediately. */
export function isDue(fact, at = Date.now()) {
  if (!fact || typeof fact !== 'object') return false;
  const due = dueOf(fact);
  // Retired facts are out of the queue; their single exception is the +90 day audit that retirement
  // wrote into `due`. Once that audit is answered `due` is null and the fact never comes back.
  if (date(fact.retiredAt)) return due !== null && due <= at;
  return due === null || due <= at;
}

// Bold and Called misses first — those are the cards the player was sure about and wrong about, which
// is the most valuable thing in the queue. Then anything whose last answer was wrong, then whatever has
// been waiting longest; an unscheduled fact counts as having waited forever.
const priority = (a, b) =>
  nat(b.boldWrong) - nat(a.boldWrong) ||
  Number(a.lastCorrect !== false) - Number(b.lastCorrect !== false) ||
  (dueOf(a) ?? 0) - (dueOf(b) ?? 0);

/**
 * Round-robin a queue across topics instead of blocking by topic (§3.4's judgement call). Topics are
 * visited in the order their first member appears, so the card that most needs the player is still
 * first out and the order inside a topic never changes. Identity when there is only one topic.
 */
export function interleaveTopics(items, topicOf = (x) => x?.topic) {
  const lanes = new Map();
  for (const item of items) {
    const key = topicOf(item) ?? '';
    if (!lanes.has(key)) lanes.set(key, []);
    lanes.get(key).push(item);
  }
  if (lanes.size < 2) return items;
  const queues = [...lanes.values()];
  const out = [];
  for (let i = 0; out.length < items.length; i += 1) {
    for (const q of queues) if (i < q.length) out.push(q[i]);
  }
  return out;
}

/**
 * Today's queue as factIds. Priority spends the cap on the cards that need it most; the interleave then
 * decides only the order those chosen cards are played in. Pass `cap: Infinity` for the true count
 * behind the Vault tab and the Home hero.
 */
export function dueToday(journal, at = Date.now(), cap = REVIEW_CAP) {
  const facts = journal?.facts;
  if (!facts || typeof facts !== 'object') return [];
  const rows = Object.entries(facts)
    .filter(([, fact]) => isDue(fact, at))
    .map(([id, fact]) => ({ id, fact }));
  rows.sort((a, b) => priority(a.fact, b.fact));
  const n = Number.isFinite(cap) ? Math.max(0, Math.trunc(cap)) : rows.length;
  return interleaveTopics(rows.slice(0, n), (r) => r.fact.topic).map((r) => r.id);
}

/**
 * The deck §3.5 hands the Vault out of a bad run: precisely these facts, every one of them due at `at`
 * whatever its stored schedule says, calls above Steady first. Entries are plain factIds or
 * `{ factId, order }`, where `order` is CONFIDENCE[tier].order — the tier's own rank, so this module
 * never names a tier and never has to import the expedition rules to sort by one. The cap is here for
 * symmetry with the daily queue; a six-card run cannot reach it.
 */
export function seedDeck(factIds, at = Date.now(), cap = REVIEW_CAP) {
  const seen = new Set();
  const rows = [];
  (Array.isArray(factIds) ? factIds : []).forEach((entry, i) => {
    const id = typeof entry === 'string' ? entry : entry?.factId;
    if (typeof id !== 'string' || !id || id.length > 80 || seen.has(id)) return;
    seen.add(id);
    rows.push({ id, order: Number.isFinite(entry?.order) ? entry.order : 0, i });
  });
  rows.sort((a, b) => b.order - a.order || a.i - b.i);
  const n = Number.isFinite(cap) ? Math.max(0, Math.trunc(cap)) : rows.length;
  return Object.freeze({ at, factIds: Object.freeze(rows.slice(0, n).map((r) => r.id)) });
}

/**
 * The date §3.4's terminal empty state prints. Null when no retired fact has a look left, which is the
 * honest end of a 54-fact bank: the queue is finite by design against the current bank.
 */
export function nextAudit(journal, at = Date.now()) {
  const facts = journal?.facts;
  if (!facts || typeof facts !== 'object') return null;
  let soonest = null;
  for (const fact of Object.values(facts)) {
    const due = dueOf(fact);
    if (!date(fact?.retiredAt) || due === null || due <= at) continue;
    if (soonest === null || due < soonest) soonest = due;
  }
  return soonest;
}

/**
 * R4's shared trim: at most ATTEMPTS_PER_FACT for any one fact, then ATTEMPTS_TOTAL overall, applied in
 * that order over a newest-first list. Every writer prepends the new attempt and calls this; readJournal
 * calls the same function on the stored array, which is exactly what a correct writer already produced.
 * Enforce it in only one of the two and the identity contract breaks the first time a player answers one
 * fact thirteen times — trivial in a repeat-until-correct review loop.
 *
 * There is deliberately no sort. Whole runs are dispatched with a single `at`, so ties are routine and
 * no sort is stable across engines; the order is the order the writer wrote. Returns the list unchanged
 * when nothing is dropped, so a sanitised journal stays reference-identical to a valid stored one.
 */
export function trimAttempts(list) {
  if (!Array.isArray(list)) return [];
  const perFact = new Map();
  const kept = [];
  for (const attempt of list) {
    if (kept.length >= ATTEMPTS_TOTAL) break;
    const id = typeof attempt?.factId === 'string' ? attempt.factId : '';
    const n = perFact.get(id) ?? 0;
    if (n >= ATTEMPTS_PER_FACT) continue;
    perFact.set(id, n + 1);
    kept.push(attempt);
  }
  return kept.length === list.length ? list : kept;
}
