/**
 * editions/hisaab/engine/daily.mjs — Aaj Ka Hisaab, the daily five.
 *
 * Five questions, the same for everyone on the same local calendar day: the seed is the day key
 * ('YYYY-MM-DD', local time), so two players in one timezone see the same five cards in the same
 * option order. Picks prefer five different sectors and at most two of any difficulty, then fill.
 * Deterministic for a given bank; when lanes are registered the set for a future day can change.
 *
 * Playing it: the cards are in the expedition/practice card shape. Record each answer with the
 * passport's `practice` action (`usePlayer().dispatch({ type: 'practice', fact: card, choice,
 * roundId: dailyRoundId(day, i) })`), which journals the card and pays the Discovery XP once — a
 * repeated round id is ignored by the reducer, so replaying today's five cannot farm XP.
 *
 * Pure: pass the bank in; `now` only ever arrives as an argument.
 */
export const DAILY_SIZE = 5;

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar day of a Date or timestamp as 'YYYY-MM-DD' (the same key lib/journal.mjs uses). */
export function localDay(at = Date.now()) {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fnv1a32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The same generator as lib/progression.mjs `mulberry32`, inlined to keep this module standalone. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEVELS = ['simple', 'expert', 'extreme'];

/** The day's five bank items (fewer only if the bank has fewer than five), easiest first. */
export function dailyFive(day, bank) {
  const rng = mulberry32(fnv1a32(`hisaab-daily:${day}`));
  const pool = shuffled(
    [...(bank ?? [])].filter((q) => q && q.domain === 'civics').sort((a, b) => (a.id < b.id ? -1 : 1)),
    rng,
  );
  const chosen = [];
  const topics = new Set();
  const perLevel = new Map();
  for (const q of pool) {
    if (chosen.length >= DAILY_SIZE) break;
    if (topics.has(q.topic) || (perLevel.get(q.difficulty) ?? 0) >= 2) continue;
    chosen.push(q);
    topics.add(q.topic);
    perLevel.set(q.difficulty, (perLevel.get(q.difficulty) ?? 0) + 1);
  }
  for (const q of pool) if (chosen.length < DAILY_SIZE && !chosen.includes(q)) chosen.push(q);
  return chosen.sort((a, b) => LEVELS.indexOf(a.difficulty) - LEVELS.indexOf(b.difficulty));
}

/**
 * The day's five as playable cards: the practice/expedition card shape, options shuffled by the
 * day's seed (so everyone gets the same order) with `correctIndex` remapped.
 */
export function dealDaily(day, bank) {
  const rng = mulberry32(fnv1a32(`hisaab-daily-options:${day}`));
  const cards = dailyFive(day, bank).map((q) => {
    const order = shuffled([0, 1, 2, 3], rng);
    return {
      factId: q.id,
      domain: q.domain,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      question: q.question,
      options: order.map((i) => q.options[i]),
      correctIndex: order.indexOf(q.correctIndex),
      explanation: q.explanation,
      sourceUrl: q.sourceUrl,
      sourceLabel: q.sourceLabel,
    };
  });
  return { id: `daily-${day}`, day, cards };
}

/** The passport round id for card `index` of `day` — `practice:<session>:<index>`, as Discovery uses. */
export const dailyRoundId = (day, index) => `practice:daily-${day}:${index}`;
