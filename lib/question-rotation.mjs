/** Least-recently-exposed question selection. Persistence belongs to the serving authority. */
export const QUESTION_FAMILIES = Object.freeze({
  cr042: 'cricket-ipl-suspension-seasons-2016-17', cr473: 'cricket-ipl-suspension-seasons-2016-17',
  cr056: 'cricket-yuvraj-broad-six-sixes-2007', cr291: 'cricket-yuvraj-broad-six-sixes-2007',
  cr244: 'cricket-afridi-chennai-141-1999', cr566: 'cricket-afridi-chennai-141-1999',
});
const validKey = (key) => typeof key === 'string' && key.length > 0 && key.length <= 200 && !['__proto__', 'prototype', 'constructor'].includes(key);
export function rotationKey(question) {
  if (!question || typeof question !== 'object') return null;
  const key = question.familyKey || question.familyId || QUESTION_FAMILIES[question.id] || question.id;
  return validKey(key) ? key : null;
}
/** Imported history is data. Zero/nonfinite/negative values do not count as a prior exposure. */
export function readRotationHistory(value) {
  const clean = Object.create(null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  for (const [key, seen] of Object.entries(value)) if (validKey(key) && Number.isFinite(seen) && seen > 0) clean[key] = seen;
  return clean;
}
export function mergeRotationHistories(histories) {
  const combined = Object.create(null);
  for (const history of Array.isArray(histories) ? histories : []) {
    for (const [key, at] of Object.entries(readRotationHistory(history))) combined[key] = Math.max(combined[key] || 0, at);
  }
  return combined;
}
/** History may still be keyed by old card IDs. Family recency includes every equivalent old ID. */
export function questionLastSeen(question, history) {
  const key = rotationKey(question);
  if (!key) return 0;
  let seen = Math.max(history?.[key] || 0, history?.[question.id] || 0);
  for (const [id, family] of Object.entries(QUESTION_FAMILIES)) if (family === key) seen = Math.max(seen, history?.[id] || 0);
  return Number.isFinite(seen) && seen > 0 ? seen : 0;
}
function sample(rng) { const n = Number(rng()); return Number.isFinite(n) ? Math.max(0, Math.min(1 - Number.EPSILON, n)) : 0; }
/**
 * pool must already satisfy all chosen filters. No widening, no mutation, no answer inspection.
 * Unseen-by-all families precede seen families; among seen families, oldest latest exposure wins.
 * Repeats are necessary only after this eligible family pool is exhausted. Ties are randomized.
 */
export function selectRotatedQuestions(pool, { count = 5, history = {}, participants = [], rng = Math.random } = {}) {
  const wanted = Number.isSafeInteger(count) && count > 0 ? count : 0;
  if (!wanted || !Array.isArray(pool)) return [];
  const merged = mergeRotationHistories([history, ...(Array.isArray(participants) ? participants : [])]);
  const draw = typeof rng === 'function' ? rng : Math.random;
  const families = new Map();
  for (const question of pool) {
    const key = rotationKey(question);
    if (!key) continue;
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(question);
  }
  return [...families].map(([key, variants]) => ({
    key,
    question: variants[Math.floor(sample(draw) * variants.length)],
    seen: variants.reduce((latest, question) => Math.max(latest, questionLastSeen(question, merged)), 0),
    tie: sample(draw),
  })).sort((a, b) => a.seen - b.seen || a.tie - b.tie || a.key.localeCompare(b.key)).slice(0, wanted).map(entry => entry.question);
}
/** Call once per new exposure; the caller deduplicates retries. Older writes cannot roll recency back. */
export function recordQuestionSeen(history, question, { at = Date.now() } = {}) {
  const next = readRotationHistory(history);
  const key = rotationKey(question);
  if (!key || !Number.isFinite(at) || at <= 0) return next;
  next[key] = Math.max(next[key] || 0, at);
  return next;
}
