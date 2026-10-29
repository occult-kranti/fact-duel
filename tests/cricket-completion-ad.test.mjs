import test from 'node:test';
import assert from 'node:assert/strict';
import { roomAdCompletion } from '../lib/completion-ad.mjs';
import { emptyCadence, reduceCompletion } from '../editions/hisaab/app/ads/cadence.mjs';

const result = (id, winner = 0) => ({ id, seat: 0, winner, phase: 'complete', settled: true, config: { opponent: 'bot' } });
const cadenceCompletion = (room) => { const c = roomAdCompletion(room); return c && { id: c.completionId, outcome: c.outcome, kind: 'duel' }; };

test('bot results offer the same spaced natural break and never one for every practice run', () => {
  const first = reduceCompletion(emptyCadence(), cadenceCompletion(result('first')));
  assert.equal(first.due, false);
  const second = reduceCompletion(first.state, cadenceCompletion(result('second')));
  assert.equal(second.due, true);
  assert.equal(reduceCompletion(second.state, cadenceCompletion(result('second'))).recorded, false, 'reloaded result cannot count twice');
  assert.equal(reduceCompletion(second.state, cadenceCompletion(result('third'))).due, false);
});

test('active, unfinished and cancelled rooms never count toward an ad', () => {
  for (const patch of [{ phase: 'playing' }, { phase: 'between' }, { phase: 'cancelled' }, { settled: false }, { seat: -1 }, { winner: undefined }])
    assert.equal(roomAdCompletion({ ...result('bad'), ...patch }), null);
  assert.equal(roomAdCompletion(null), null);
  const draw = roomAdCompletion(result('draw', null));
  assert.equal(draw.outcome, 'draw');
  assert.equal(reduceCompletion(emptyCadence(), cadenceCompletion(result('draw', null))).due, false);
});
