#!/usr/bin/env node
// Find cross-item answer giveaways in the HISAAB DO bank: an item whose correct answer appears, word
// for word, in ANOTHER item's stem, explanation, outcome, otherSide, status or enactedBy. A player
// who meets the second card first is handed the first card's answer.
//
//   node scripts/hisaab-giveaways.mjs            # summary + every pair
//   node scripts/hisaab-giveaways.mjs --json     # machine-readable pairs
//
// Only distinctive answers count (a number of 3+ digits, a number with a unit or %, or 12+ letters of
// text), and only when the leaking item is about the same subject: it shares the answer item's
// subtopic, or at least one distinctive subtopic word. Bare small numbers, years and institution
// names appear everywhere by nature and are skipped.
import { LANES } from '../editions/hisaab/bank/index.mjs';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[₹,]/g, '').replace(/rs\.?\s*/g, '').replace(/\s+/g, ' ').trim();
const GENERIC = new Set(['supreme court', 'enforcement directorate', 'central bureau of investigation', 'election commission of india', 'comptroller and auditor general', 'rajya sabha', 'lok sabha', 'president\'s rule']);
const items = Object.entries(LANES).flatMap(([lane, arr]) => arr.map((q) => ({ lane, q })));
const textOf = (q) =>
  norm([q.question, q.explanation, q.outcome, q.otherSide, q.status, ...(q.enactedBy ?? []).map((e) => `${e.name} ${e.role}`)].join(' | '));

const STOP = new Set(['scheme', 'yojana', 'case', 'cases', 'fund', 'funds', 'india', 'indian', 'state', 'government', 'relief', 'budget', 'bill', 'report', 'audit', 'election', 'elections', 'assembly', 'mission', 'national', 'central', 'union', 'pradesh', 'scam', 'party', 'poll', 'polls', 'mantri', 'mukhyamantri', 'pradhan', 'with', 'from', 'after', 'before']);
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP.has(w));
const pairs = [];
for (const a of items) {
  const ans = norm(a.q.options[a.q.correctIndex]);
  const bigNumber = /\d{3,}|\d[\d.]*\s*(%|kg|days|crore|lakh|per cent|km|seats|months|years)/.test(ans.replace(/\s+/g, ' '));
  const letters = ans.replace(/[^a-z]/g, '').length;
  if (/^(19|20)\d\d$/.test(ans) || GENERIC.has(ans)) continue;
  if (!bigNumber && letters < 12) continue;
  const subject = new Set(words(a.q.subtopic));
  for (const b of items) {
    if (b === a) continue;
    const t = textOf(b.q);
    const sameSubject = norm(b.q.subtopic) === norm(a.q.subtopic) || words(b.q.subtopic + ' ' + b.q.question).some((w) => subject.has(w));
    if (!sameSubject) continue;
    // Word-boundary match so "25" doesn't match "250".
    const re = new RegExp(`(^|[^a-z0-9.])${ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
    if (re.test(t)) pairs.push({ answerOf: a.q.id, answerLane: a.lane, answer: a.q.options[a.q.correctIndex], leakedIn: b.q.id, leakLane: b.lane });
  }
}
if (process.argv.includes('--json')) console.log(JSON.stringify(pairs, null, 1));
else {
  const byLeakLane = pairs.reduce((m, p) => ((m[p.leakLane] = (m[p.leakLane] ?? 0) + 1), m), {});
  console.log(`${pairs.length} giveaway pairs across ${items.length} items`);
  console.log('by lane holding the leak:', JSON.stringify(byLeakLane));
  for (const p of pairs) console.log(`  ${p.leakedIn} (${p.leakLane}) gives away ${p.answerOf}: "${p.answer}"`);
}
