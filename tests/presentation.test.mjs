import test from 'node:test';
import assert from 'node:assert/strict';
import { matchVerdict, roundReason, completedRounds, FORMAT_COPY } from '../lib/duel-presentation.mjs';
const room = {
  seat: 0,
  phase: 'complete',
  winner: 0,
  scores: [3, 2],
  config: { mode: 'gauntlet', stake: 25 },
  roundIndex: 4,
  round: {
    id: 'm:4',
    result: { winner: 1, reason: 'correct' },
    receipts: [
      { correct: false, elapsedMs: 2000 },
      { correct: true, elapsedMs: 3000 },
    ],
  },
};
test('the whole-match verdict does not attribute a multi-round win to its losing last round', () => {
  assert.equal(matchVerdict(room).title, 'YOU WIN');
  assert.match(matchVerdict(room).subtitle, /3–2/);
  assert.match(roundReason(room.round, 0), /rival had the only correct/);
  assert.match(matchVerdict({ ...room, seat: 1 }).title, /RIVAL WINS/);
  assert.match(FORMAT_COPY.trilogy.rule, /otherwise.*after three/);
});
test('refunds, close draws and missing legacy history are described without invented results', () => {
  assert.equal(matchVerdict({ ...room, phase: 'cancelled', reason: 'player-left' }).title, 'MATCH REFUNDED');
  assert.equal(matchVerdict({ ...room, winner: null, scores: [2, 2] }).title, 'IT’S A DRAW');
  assert.match(roundReason({ result: { reason: 'close-result', tieMs: 150 } }, 0), /150 ms draw band/);
  assert.equal(completedRounds({ ...room, round: null }).length, 0);
  assert.equal(completedRounds(room)[0].index, 4);
});
