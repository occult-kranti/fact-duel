import test from 'node:test';
import assert from 'node:assert/strict';
import { shareMoment, JHK_SHARE_URL } from '../lib/share-moment.mjs';
test('public sharing distinguishes bot practice and never retains private source fields', () => {
  const moment = shareMoment({ rounds: 3, correct: 3, xp: 240, nickname: 'Captain', roomId: 'private-room', recoveryCode: 'secret-code', url: 'https://example.com/#token=secret' });
  assert.equal(moment.mode, 'Mini over'); assert.equal(moment.headline, 'Perfect answers.');
  assert.match(moment.text, /Practice bot/); assert.match(moment.text, /240 XP/);
  assert.equal(moment.url, JHK_SHARE_URL); assert.doesNotMatch(JSON.stringify(moment), /private-room|secret-code|token=secret/);
});
test('full over, malformed data and empty answers produce honest cards', () => {
  assert.equal(shareMoment({ rounds: 6, human: true }).rival, 'Human duel');
  assert.equal(shareMoment({ rounds: 6, correct: 0 }).headline, 'One over wiser.');
  const bad = shareMoment({ rounds: 1000, correct: 1000, xp: Infinity, nickname: '\u0000A\nB' });
  assert.equal(bad.rounds, 3); assert.equal(bad.correct, 3); assert.equal(bad.xp, 0); assert.equal(bad.nickname, 'AB');
});

test('stadium variants and legacy rooms retain their actual format and round counts', () => {
  assert.equal(shareMoment({ mode: 'superover', rounds: 6, correct: 5 }).mode, 'Superover');
  for (const rounds of [2, 3, 4, 5]) {
    const moment = shareMoment({ mode: 'chase', rounds, correct: rounds });
    assert.equal(moment.mode, 'The Chase'); assert.equal(moment.correct, rounds); assert.equal(moment.rounds, rounds);
  }
  assert.equal(shareMoment({ mode: 'gauntlet', rounds: 5, correct: 5 }).mode, 'Cricket duel');
});
