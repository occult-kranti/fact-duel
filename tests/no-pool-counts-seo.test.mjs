import test from 'node:test';
import assert from 'node:assert/strict';
import { INTENTS, selectQuestions, fallbackLine } from '../lib/seo/intents.mjs';
import { QUESTIONS } from '../lib/server/bank.mjs';
import { renderPage, renderHub } from '../scripts/seo-pages.mjs';

test('every public SEO page keeps available inventory out of HTML, metadata and JSON-LD', () => {
  for (const intent of INTENTS) {
    const selection = selectQuestions(intent, QUESTIONS);
    // Keep the visible sample unchanged while varying the private eligible-match total.
    // Comparing the entire output also checks meta tags, accessible copy and structured data.
    const small = renderPage(intent, { ...selection, matched: 1, filled: true });
    const large = renderPage(intent, { ...selection, matched: 982173, filled: true });
    assert.equal(small, large, `${intent.slug}: available inventory leaked into rendered output`);
    assert.doesNotMatch(large, /982173|The bank holds \d+/);
  }
  assert.doesNotMatch(renderHub(), /\b\d+\s+(?:available questions|questions available)\b/i);
});

test('a real sparse IPL selection explains the wider sample without revealing the pool total', () => {
  const intent = INTENTS.find(intent => intent.slug === 'ipl-quiz-2026');
  const cricket = QUESTIONS.filter(q => q.topic === 'Cricket');
  const exact = cricket.find(q => intent.match.test(q.question));
  const others = cricket.filter(q => !intent.match.test([q.question, q.subtopic, q.explanation].join(' '))).slice(0, 20);
  const selection = selectQuestions(intent, [exact, ...others]);
  assert.equal(selection.filled, true);
  assert.equal(selection.matched, 1);
  assert.equal(selection.questions.length, 10);
  assert.match(fallbackLine(intent, selection), /wider cricket bank/);
  assert.doesNotMatch(fallbackLine(intent, selection), /\d|\{n\}/);
  assert.ok(renderPage(intent, selection).includes(fallbackLine(intent, selection)));
});
