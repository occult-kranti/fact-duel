/**
 * The served question bank as a whole. The QA pass that admitted the sport banks checked these
 * things once; this keeps them true as banks grow, because a duplicate id or a malformed entry
 * would not throw anywhere — it would quietly deal a broken card under a five-second timer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, ALL_QUESTIONS } from '../lib/server/bank.mjs';
import { TOPIC_DOMAINS } from '../lib/journal.mjs';
import { ENABLED_DOMAINS } from '../lib/content.mjs';

const LEVELS = ['simple', 'expert', 'extreme'];
const REGIONS = ['US', 'India', 'Europe', 'Global'];
const SPORTS = ['Football', 'Cricket', 'Baseball', 'Formula 1', 'Basketball'];

test('every question is well formed and its id is unique across every file', () => {
  const ids = new Set();
  const texts = new Set();
  for (const q of ALL_QUESTIONS) {
    assert.match(q.id, /^(q|fb|cr|bb|f1|bk)\d{3}$/, q.id);
    assert.equal(ids.has(q.id), false, `duplicate id ${q.id}`);
    ids.add(q.id);
    assert.equal(TOPIC_DOMAINS[q.topic], q.domain, `${q.id}: ${q.topic} is not a ${q.domain} topic`);
    assert.ok(LEVELS.includes(q.difficulty), `${q.id}: difficulty ${q.difficulty}`);
    assert.ok(REGIONS.includes(q.region), `${q.id}: region ${q.region}`);
    assert.ok(typeof q.question === 'string' && q.question.length > 10, `${q.id}: question`);
    assert.equal(q.options.length, 4, `${q.id}: four options`);
    assert.equal(new Set(q.options).size, 4, `${q.id}: distinct options`);
    assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4, `${q.id}: correctIndex`);
    assert.ok(typeof q.explanation === 'string' && q.explanation.length > 0, `${q.id}: explanation`);
    assert.match(q.sourceUrl, /^https:\/\//, `${q.id}: source`);
    assert.ok(typeof q.sourceLabel === 'string' && q.sourceLabel.length > 0, `${q.id}: sourceLabel`);
    const key = q.question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    assert.equal(texts.has(key), false, `${q.id}: duplicate question text`);
    texts.add(key);
  }
});

test('the served bank is sports only, and every one of the five sports is deep and balanced', () => {
  assert.ok(QUESTIONS.every((q) => ENABLED_DOMAINS.includes(q.domain)));
  // 30 sports questions in the original sample plus five authored banks; the sample's 24 science
  // questions are hidden, not served, so this is 329 today and only ever grows.
  assert.ok(QUESTIONS.length >= 829, `served ${QUESTIONS.length}`);
  for (const sport of SPORTS) {
    const mine = QUESTIONS.filter((q) => q.topic === sport);
    assert.ok(mine.length >= 59, `${sport}: ${mine.length} questions`);
    for (const level of LEVELS) {
      const n = mine.filter((q) => q.difficulty === level).length;
      // Each authored bank is 20/20/20; the sample adds a few to football, cricket and basketball.
      // Each tier holds at least a quarter of the sport's pool: a lopsided tier makes a mode unplayable at that level.
      assert.ok(n >= Math.floor(mine.length / 4), `${sport} ${level}: ${n} of ${mine.length}`);
    }
  }
});

test('no question gives its own answer away, and no correct option is always in the same slot', () => {
  const slots = [0, 0, 0, 0];
  for (const q of QUESTIONS) {
    const answer = q.options[q.correctIndex].toLowerCase();
    if (answer.length > 3) assert.equal(q.question.toLowerCase().includes(answer), false, `${q.id}: answer text appears in the question`);
    slots[q.correctIndex] += 1;
  }
  // Options are reshuffled per deal, but an authored bias would still show up in analytics.
  for (const n of slots) assert.ok(n > QUESTIONS.length / 8, `correctIndex distribution is skewed: ${slots.join('/')}`);
});
