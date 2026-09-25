// lib/journal-review.mjs imports dayKey back out of this file, so the two modules are a cycle. It holds
// only because neither side touches the other at module scope: keep every use of an imported binding
// inside a function body.
import { trimAttempts, nextDays, emptySchedule, MAX_BOX, REVIEW_CAP } from './journal-review.mjs';
import { TOPIC_DOMAINS } from './content.mjs';
/**
 * The journal is two records with two jobs. `rounds` / `matches` / `saved` are the duel replay log and
 * are unchanged. `cards` / `facts` / `attempts` are the learning store the Vault and the review schedule
 * run on: one content snapshot per fact instead of a full copy of the question in every round, one
 * aggregate per fact, and a rolling tail of individual answers, newest first.
 *
 * A factory rather than a shared literal. `cards` and `facts` are keyed maps whose natural write is
 * `journal.cards[factId] = snap`, and a shallow spread of a module-level singleton would hand every
 * profile minted in a page session the same two objects — including the one `emptyProfile()` mints on a
 * reset, which would then inherit the previous player's card store.
 */
export const emptyJournal = () => ({
  version: 1,
  rounds: [],
  matches: [],
  saved: [],
  cards: {},
  facts: {},
  attempts: [],
  // §3.5's deck out of a bad run: `{ at, factIds }`, the misses in the order they are worth re-reading.
  // It is an ORDER, not a membership — every id in it is also carried by `facts` with its own `due`, so
  // a journal that loses this field loses the ranking and nothing else. Null until a run seeds one.
  seed: null,
});
// Kept for the lib/passport.mjs import. Frozen at the top level so the next caller tempted to spread it
// finds out at the write rather than three profiles later; anyone needing a journal calls emptyJournal().
export const EMPTY_JOURNAL = Object.freeze(emptyJournal());
// Shared vocabulary for the whole profile layer (journal, passport, progression), re-exported here so the
// progression module can import it without a passport <-> progression import cycle. The table itself
// lives in lib/content.mjs (dependency-free, so no new cycle), because which topics exist is a content
// decision and an edition build swaps that one module for its own.
export { TOPIC_DOMAINS };
export const DIFFICULTIES = Object.freeze(['simple', 'expert', 'extreme']);
// Every surface that can answer a card. `bySurface` carries all five, always, so a stored fact record
// and a freshly written one have the same shape and the profile identity contract survives a reload.
export const SURFACES = Object.freeze(['duel', 'expedition', 'discovery', 'recall', 'event']);
// The duel entry fee, mirrored from lib/server/room-engine.mjs:37. Simulated coins, and the attempt
// records which one was on the table so the history can say so without a second lookup.
export const STAKES = Object.freeze([0, 10, 25, 50, 100]);
// The three confidence tiers, spelled out rather than imported from lib/expeditions.mjs: that module
// already imports this one, and a second cycle would put CONFIDENCE in the temporal dead zone for
// whichever of the two a test loads first. Keep this list in step with CONFIDENCE there.
const TIERS = Object.freeze(['steady', 'bold', 'called']);
// One cap for both keyed stores. They are keyed by the same ids, so a fact with a snapshot and a fact
// with an aggregate are the same 300 facts.
export const STORE_LIMIT = 300;
// Day keys live here rather than in lib/progression.mjs because lib/expeditions.mjs needs them too,
// and progression already imports expeditions — importing back would close the cycle.
const pad = (n) => String(n).padStart(2, '0');
export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Local calendar date of a timestamp as YYYY-MM-DD (zero padded, local getters). */
export function dayKey(at) {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Whole days from one day key to another (DST-safe, local midnights). */
export function dayDiff(from, to) {
  const [a, b] = [from, to].map((k) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  });
  return Math.round((b - a) / 864e5);
}
const validDate = (value) => Number.isFinite(value) && Math.abs(value) <= 8.64e15;
const date = (value) => (validDate(value) ? value : null);
const nat = (value) => (Number.isSafeInteger(value) && value > 0 ? value : 0);
const capped = (value, n) => typeof value === 'string' && value.length <= n;
const day = (value) => (typeof value === 'string' && DAY_RE.test(value) ? value : null);
/**
 * The key rule for `cards`, `facts` and `attempts`. Prototype keys are refused outright: a stored
 * journal is player-editable through the export/import path, and these maps are spread and indexed.
 */
export const factKey = (id) =>
  typeof id === 'string' &&
  /^[a-zA-Z0-9:_-]{1,80}$/.test(id) &&
  !['__proto__', 'constructor', 'prototype'].includes(id);
const validFact = (r) =>
  r &&
  (r.factId === undefined || (typeof r.factId === 'string' && /^[a-zA-Z0-9:_-]{1,80}$/.test(r.factId))) &&
  (r.difficulty === undefined || DIFFICULTIES.includes(r.difficulty)) &&
  [
    'id',
    'matchId',
    'question',
    'correctAnswer',
    'explanation',
    'topic',
    'subtopic',
    'sourceUrl',
    'sourceLabel',
  ].every((k) => typeof r[k] === 'string') &&
  validDate(r.at) &&
  Array.isArray(r.options) &&
  r.options.length === 4 &&
  r.options.every((x) => typeof x === 'string') &&
  new Set(r.options).size === 4 &&
  r.options.includes(r.correctAnswer) &&
  /^https?:\/\//.test(r.sourceUrl) &&
  typeof r.bot === 'boolean' &&
  (r.correct === null || typeof r.correct === 'boolean') &&
  (r.elapsedMs === null || (Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0));
// The opponent's name is user-authored text from the Play name field: bounded, rendered only as
// React text, and optional so every match written before it existed still validates.
export const OPPONENT_NAME_MAX = 24;
const validOpponentName = (v) => v === undefined || (typeof v === 'string' && v.length > 0 && v.length <= OPPONENT_NAME_MAX);
/** The other seat's name as the room carried it; null for a bot seat or when the room has no such seat. */
export function opponentName(room) {
  const seat = Number.isInteger(room?.seat) ? room.seat : null;
  const other = seat === null ? null : room?.players?.[1 - seat];
  const raw = other && other.kind !== 'bot' ? other.name : null;
  if (typeof raw !== 'string') return null;
  const clean = raw.replace(/\s+/g, ' ').trim().slice(0, OPPONENT_NAME_MAX);
  return clean.length ? clean : null;
}
const validMatch = (m) =>
  m &&
  typeof m.id === 'string' &&
  validOpponentName(m.opponentName) &&
  validDate(m.at) &&
  ['quick', 'trilogy', 'gauntlet'].includes(m.mode) &&
  ['win', 'loss', 'draw'].includes(m.outcome) &&
  typeof m.bot === 'boolean' &&
  Array.isArray(m.scores) &&
  m.scores.length === 2 &&
  m.scores.every((n) => Number.isInteger(n) && n >= 0 && n <= 5);
// The content snapshot, checked to the same standard as a round entry: four distinct options, a real
// correct index, an http source and bounded text. A card that fails is dropped whole rather than
// repaired — a half-invented question is worse than a missing one on a surface that claims to be a
// truthful history.
const validCard = (c) =>
  c &&
  typeof c === 'object' &&
  capped(c.question, 1000) &&
  c.question.length > 0 &&
  capped(c.explanation, 2000) &&
  ['topic', 'subtopic', 'sourceLabel'].every((k) => capped(c[k], 200)) &&
  capped(c.sourceUrl, 1000) &&
  /^https?:\/\//.test(c.sourceUrl) &&
  Array.isArray(c.options) &&
  c.options.length === 4 &&
  c.options.every((o) => capped(o, 500) && o.length > 0) &&
  new Set(c.options).size === 4 &&
  Number.isInteger(c.correctIndex) &&
  c.correctIndex >= 0 &&
  c.correctIndex <= 3 &&
  (c.difficulty === undefined || DIFFICULTIES.includes(c.difficulty));
// Attempts are dropped on any bad field, never clamped: an attempt is a claim about what the player did,
// and a repaired one is a fabricated one. `chose` is the option TEXT because every surface reshuffles
// the options per presentation, so an index would name a different answer on the next run.
const validAttempt = (a) =>
  a &&
  typeof a === 'object' &&
  capped(a.id, 120) &&
  a.id.length > 0 &&
  factKey(a.factId) &&
  validDate(a.at) &&
  SURFACES.includes(a.surface) &&
  (a.contextId === null || capped(a.contextId, 64)) &&
  Number.isInteger(a.index) &&
  a.index >= 0 &&
  a.index <= 31 &&
  (a.chose === null || capped(a.chose, 500)) &&
  typeof a.correct === 'boolean' &&
  (a.elapsedMs === null || (Number.isFinite(a.elapsedMs) && a.elapsedMs >= 0)) &&
  (a.confidence === null || TIERS.includes(a.confidence)) &&
  (a.stake === null || STAKES.includes(a.stake)) &&
  (a.opponent === null || a.opponent === 'bot' || a.opponent === 'human') &&
  typeof a.revealed === 'boolean';
function readCards(value) {
  const out = {};
  if (!value || typeof value !== 'object') return out;
  let kept = 0;
  for (const [id, card] of Object.entries(value)) {
    if (kept >= STORE_LIMIT) break;
    if (!factKey(id) || !validCard(card)) continue;
    out[id] = card;
    kept += 1;
  }
  return out;
}
function readFacts(value) {
  const out = {};
  if (!value || typeof value !== 'object') return out;
  let kept = 0;
  for (const [id, f] of Object.entries(value)) {
    if (kept >= STORE_LIMIT) break;
    if (!factKey(id) || !f || typeof f !== 'object' || !Object.hasOwn(TOPIC_DOMAINS, f.topic)) continue;
    // Aggregates are clamped rather than dropped: they are never evicted, so the statistics behind the
    // Vault's claim tile stay complete long after the individual attempts have rolled out.
    const seen = nat(f.seen);
    out[id] = {
      topic: f.topic,
      ...(DIFFICULTIES.includes(f.difficulty) ? { difficulty: f.difficulty } : {}),
      seen,
      correct: Math.min(seen, nat(f.correct)),
      firstAt: date(f.firstAt),
      lastAt: date(f.lastAt),
      lastCorrect: f.lastCorrect === true,
      correctDay: day(f.correctDay),
      streak: nat(f.streak),
      days: nat(f.days),
      bySurface: Object.fromEntries(SURFACES.map((s) => [s, nat(f.bySurface?.[s])])),
      boldWrong: nat(f.boldWrong),
      firstMissAt: date(f.firstMissAt),
      recoveredAt: date(f.recoveredAt),
      box: Math.min(MAX_BOX, nat(f.box)),
      due: date(f.due),
      lapses: nat(f.lapses),
      retiredAt: date(f.retiredAt),
    };
    kept += 1;
  }
  return out;
}
/**
 * The stored seed deck. Kept whole or dropped whole: a deck with one unreadable id is a deck whose order
 * is already wrong, and half an order is worse than none. Ids are checked to `factKey` but NOT against
 * `facts` — eviction is allowed to outlive a deck, and app/journal.tsx plays only the ids still due.
 */
function validSeed(value) {
  if (!value || typeof value !== 'object') return null;
  if (!validDate(value.at) || value.at < 0) return null;
  if (!Array.isArray(value.factIds) || value.factIds.length === 0) return null;
  if (!value.factIds.every((id) => factKey(id))) return null;
  return { at: value.at, factIds: value.factIds.slice(0, REVIEW_CAP) };
}
/**
 * The sanitiser, taking a parsed object. lib/profile-store.mjs runs a read inside every readwrite
 * transaction and lib/passport.mjs used to hand it `JSON.stringify(value.journal)`, so a heartbeat paid
 * for a full stringify + parse of the journal every fifteen seconds — mid-duel, against a 50 ms timer
 * tick on a track with no CSS transition. Measured on a saturated journal: 1.03 ms here against 1.55 ms
 * through the string path.
 *
 * The try/catch is what makes it safe on a structured-clone value out of IndexedDB: a cycle or an exotic
 * type degrades to the empty journal exactly as a bad JSON string does.
 */
export function readJournalValue(value) {
  try {
    if (value?.version !== 1) return emptyJournal();
    return {
      version: 1,
      rounds: (Array.isArray(value.rounds) ? value.rounds : []).filter(validFact).slice(0, 200),
      matches: (Array.isArray(value.matches) ? value.matches : []).filter(validMatch).slice(0, 100),
      saved: (Array.isArray(value.saved) ? value.saved : [])
        .filter((x) => typeof x === 'string')
        .slice(0, 200),
      cards: readCards(value.cards),
      facts: readFacts(value.facts),
      // Stored newest first, so walking front to back and applying the two caps in that order is exactly
      // what a correct writer already produced. No sort: whole runs share one `at`.
      attempts: trimAttempts((Array.isArray(value.attempts) ? value.attempts : []).filter(validAttempt)),
      seed: validSeed(value.seed),
    };
  } catch {
    return emptyJournal();
  }
}
export function readJournal(raw) {
  try {
    return readJournalValue(JSON.parse(raw || 'null'));
  } catch {
    return emptyJournal();
  }
}
/** The content snapshot, stored once per fact by whichever presentation journalled it first. */
const cardOf = (c) => ({
  question: c.question,
  options: [...c.options],
  correctIndex: c.correctIndex,
  explanation: c.explanation,
  topic: c.topic,
  subtopic: c.subtopic,
  sourceUrl: c.sourceUrl,
  sourceLabel: c.sourceLabel,
  ...(DIFFICULTIES.includes(c.difficulty) ? { difficulty: c.difficulty } : {}),
});
const emptyBySurface = () => ({ duel: 0, expedition: 0, discovery: 0, recall: 0, event: 0 });
/**
 * The learning record after one duel answer. Field for field the record lib/passport.mjs writes for the
 * other three surfaces — the sanitiser above is the contract both sides are held to, and a profile that
 * round-trips through it is the test that catches either one drifting.
 */
function nextFact(prior, { topic, difficulty, correct, at }) {
  const days = nextDays(prior, correct, at);
  const firstMissAt = prior?.firstMissAt ?? (correct ? null : at);
  const kind = DIFFICULTIES.includes(difficulty) ? difficulty : prior?.difficulty;
  // The ladder belongs to the Vault alone: a card met in a duel records in full and sits due
  // immediately, but only an answer given in the review deck may move a box. `due: at` rather than null
  // because the progression diff pays a review against a finite `due` it can compare.
  const schedule = prior
    ? {
        box: prior.box ?? 0,
        due: prior.due ?? at,
        lapses: prior.lapses ?? 0,
        retiredAt: prior.retiredAt ?? null,
      }
    : { ...emptySchedule(), due: at };
  return {
    topic,
    ...(kind ? { difficulty: kind } : {}),
    seen: (prior?.seen ?? 0) + 1,
    correct: (prior?.correct ?? 0) + (correct ? 1 : 0),
    firstAt: prior?.firstAt ?? at,
    lastAt: at,
    lastCorrect: correct,
    // The day of the last correct answer, so `days` counts distinct days exactly rather than inferring
    // the last one from `lastAt` — an inference that double-counts a correct, miss, correct inside one day.
    correctDay: correct ? dayKey(at) : (prior?.correctDay ?? null),
    streak: correct ? (prior?.streak ?? 0) + 1 : 0,
    days,
    bySurface: { ...emptyBySurface(), ...prior?.bySurface, duel: (prior?.bySurface?.duel ?? 0) + 1 },
    // A duel card carries no bet, so a duel miss is never a high-confidence one and `boldWrong` — the
    // review queue's first sort key — stays where the expedition put it.
    boldWrong: prior?.boldWrong ?? 0,
    firstMissAt,
    recoveredAt:
      prior?.recoveredAt ??
      (correct && firstMissAt !== null && dayDiff(dayKey(firstMissAt), dayKey(at)) > 0 ? at : null),
    ...schedule,
  };
}
/**
 * The duel half of the capture contract, and the reason `recordRoom` now reads `.choice`. Attempts are
 * PREPENDED and handed to the same `trimAttempts` the sanitiser calls (R4): a cap enforced on one side
 * only stops a round-tripped profile deep-equalling the one it came from. Identity when the attempt is
 * malformed or its id is already stored, so a re-dispatched room costs nothing.
 */
function recordAttempt(journal, attempt, card) {
  if (!validAttempt(attempt) || journal.attempts.some((a) => a.id === attempt.id)) return journal;
  const id = attempt.factId;
  const snap = validCard(card) ? card : null;
  const cards = journal.cards,
    facts = journal.facts;
  const prior = Object.hasOwn(facts, id) ? facts[id] : null;
  const topic = prior ? prior.topic : snap?.topic;
  return {
    ...journal,
    cards:
      snap && !Object.hasOwn(cards, id) && Object.keys(cards).length < STORE_LIMIT
        ? { ...cards, [id]: cardOf(snap) }
        : cards,
    facts:
      Object.hasOwn(TOPIC_DOMAINS, topic) && (prior || Object.keys(facts).length < STORE_LIMIT)
        ? {
            ...facts,
            [id]: nextFact(prior, {
              topic,
              difficulty: snap?.difficulty,
              correct: attempt.correct,
              at: attempt.at,
            }),
          }
        : facts,
    attempts: trimAttempts([attempt, ...journal.attempts]),
  };
}
export function recordRoom(journal, room, now = Date.now()) {
  if (Array.isArray(room?.completedRounds) && room.completedRounds.length) {
    for (const r of room.completedRounds) {
      journal = recordRoom(journal, { ...room, completedRounds: [], phase: 'between', round: r }, now);
    }
  }
  const rd = room?.round,
    q = rd?.question;
  let next = journal;
  if (rd?.result && Number.isInteger(q?.correctIndex) && !journal.rounds.some((r) => r.id === rd.id)) {
    const a = rd.receipts?.[room.seat];
    const fact = {
      id: rd.id,
      ...(typeof q.factId === 'string' ? { factId: q.factId } : {}),
      ...(DIFFICULTIES.includes(q.difficulty) ? { difficulty: q.difficulty } : {}),
      matchId: room.id,
      at: now,
      question: q.question,
      options: q.options,
      correctAnswer: q.options[q.correctIndex],
      explanation: q.explanation,
      topic: q.topic,
      subtopic: q.subtopic,
      sourceUrl: q.sourceUrl,
      sourceLabel: q.sourceLabel,
      correct: a?.correct ?? null,
      elapsedMs: a?.elapsedMs ?? null,
      bot: room.players.some((p) => p?.kind === 'bot'),
    };
    next = { ...next, rounds: [fact, ...next.rounds].slice(0, 200) };
    // A round nobody answered is a round, not an answer: it stays in `rounds` and mints no attempt, so
    // `facts.seen` keeps meaning "times you answered this" and a timeout is never filed as a wrong call.
    if (typeof a?.correct === 'boolean' && factKey(q.factId)) {
      const chose = Number.isInteger(a.choice) ? q.options?.[a.choice] : null;
      next = recordAttempt(
        next,
        {
          id: rd.id,
          factId: q.factId,
          at: now,
          surface: 'duel',
          contextId: capped(room.id, 64) ? room.id : null,
          index: Number.isInteger(rd.index) && rd.index >= 0 && rd.index <= 31 ? rd.index : 0,
          chose: capped(chose, 500) ? chose : null,
          correct: a.correct,
          elapsedMs: Number.isFinite(a.elapsedMs) && a.elapsedMs >= 0 ? a.elapsedMs : null,
          confidence: null,
          stake: STAKES.includes(room.config?.stake) ? room.config.stake : null,
          opponent: room.players.some((p) => p?.kind === 'bot') ? 'bot' : 'human',
          revealed: false,
        },
        q,
      );
    }
  }
  if (room?.phase === 'complete' && !next.matches.some((m) => m.id === room.id)) {
    next = {
      ...next,
      matches: [
        {
          id: room.id,
          at: now,
          mode: room.config.mode,
          bot: room.players.some((p) => p?.kind === 'bot'),
          outcome: room.winner === null ? 'draw' : room.winner === room.seat ? 'win' : 'loss',
          scores: room.scores,
          ...(opponentName(room) ? { opponentName: opponentName(room) } : {}),
        },
        ...next.matches,
      ].slice(0, 100),
    };
  }
  return next;
}
/**
 * One entry per fact, most recently answered first. `rounds` arrives newest first, so keeping the first
 * sighting of each key keeps both the newest snapshot and recency order — the previous pass keyed off
 * the oldest sighting, which sorted a fact answered seconds ago behind one last seen a week back.
 */
export function uniqueFacts(rounds) {
  const aliases = new Map(rounds.filter((r) => r.factId).map((r) => [r.question, r.factId]));
  const out = new Map();
  for (const r of rounds) {
    const key = r.factId || aliases.get(r.question) || r.question;
    if (!out.has(key)) out.set(key, r);
  }
  return [...out.values()];
}
