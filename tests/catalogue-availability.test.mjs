import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDuelRequest } from '../lib/server/http-handler.mjs';
import { QUESTIONS } from '../lib/server/bank.mjs';

test('the public HTTP catalogue gives availability, not bank totals, and preserves filter gating', async () => {
  const response = await handleDuelRequest(new Request('https://duel.example/api/duel', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'catalogue' }),
  }), {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const { catalogue } = await response.json();
  assert.equal(catalogue.available, true);
  assert.ok(catalogue.topics.every(topic => topic.available === true));
  const banned = new Set(['count', 'questionCount', 'question_count', 'poolSize', 'poolCount', 'totalQuestions']);
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      assert.ok(!banned.has(key), `public catalogue has inventory field ${key}`);
      visit(item);
    }
  };
  visit(catalogue);
  // Facets remain internal UI input for combined-filter launch eligibility. They contain no keys.
  for (const topic of catalogue.topics) for (const difficulty of catalogue.levels) {
    const eligible = QUESTIONS.filter(q => q.topic === topic.topic && q.difficulty === difficulty);
    const facets = catalogue.facets.filter(q => q.topic === topic.topic && q.difficulty === difficulty);
    for (const roundCount of [1, 3, 5, 6]) assert.equal(facets.length >= roundCount, eligible.length >= roundCount);
  }
  assert.ok(!JSON.stringify(catalogue).includes('correctIndex'));
});
