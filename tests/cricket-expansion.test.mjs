import test from 'node:test';
import assert from 'node:assert/strict';
import { CRICKET_EXPANSION, CRICKET_EXPANSION_SOURCES } from '../lib/server/questions/cricket-expansion.mjs';
import { QUESTIONS } from '../lib/server/bank.mjs';
import { rotationKey } from '../lib/question-rotation.mjs';

test('the reviewed expansion is complete, uniquely selectable and in the served bank', () => {
  assert.equal(CRICKET_EXPANSION.length, 48);
  assert.deepEqual(CRICKET_EXPANSION.map(q => q.id), Array.from({ length: 48 }, (_, i) => `cr${624 + i}`));
  assert.equal(new Set(CRICKET_EXPANSION.map(rotationKey)).size, 48);
  for (const q of CRICKET_EXPANSION) assert.ok(QUESTIONS.includes(q), `${q.id}: missing from served bank`);
  for (const difficulty of ['simple', 'expert', 'extreme']) assert.equal(CRICKET_EXPANSION.filter(q => q.difficulty === difficulty).length, 16);
});

test('every expansion card links to an inspected primary source and fits mobile copy bounds', () => {
  const sources = new Map(Object.values(CRICKET_EXPANSION_SOURCES).map(source => [source.url, source]));
  const hosts = new Set(['www.icc-cricket.com', 'www.nzc.nz', 'www.iplt20.com']);
  for (const q of CRICKET_EXPANSION) {
    assert.ok(sources.has(q.sourceUrl), `${q.id}: missing source ledger`);
    assert.ok(hosts.has(new URL(q.sourceUrl).hostname), `${q.id}: not a primary source`);
    assert.ok(q.question.length <= 120, `${q.id}: long stem`);
    assert.ok(q.options.every(option => option.length <= 40), `${q.id}: long option`);
  }
  for (const source of sources.values()) {
    assert.match(source.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(source.locator.length > 10);
  }
});
