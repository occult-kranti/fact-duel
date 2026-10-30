import test from 'node:test';
import assert from 'node:assert/strict';
import { cricketOutcome, createCricketMomentGate, CRICKET_MOMENT_MS } from '../lib/cricket-outcomes.mjs';

test('only settled ordinary results can trigger cricket feedback', () => {
  for (const input of [{ outcome:'win' }, { outcome:'win',settled:false }, { outcome:'cancelled',settled:true }, { outcome:'win',settled:true,forfeit:true }, { outcome:'loss',settled:true,forfeit:true }]) assert.equal(cricketOutcome(input), null);
  assert.equal(cricketOutcome({ outcome:'win',settled:true }), 'boundary');
  assert.equal(cricketOutcome({ outcome:'draw',settled:true }), 'level');
});
test('a one-point or tied-score loss gets the near-crease metaphor without changing its loss', () => {
  assert.equal(cricketOutcome({ outcome:'loss',settled:true,ourScore:2,theirScore:3 }), 'run-out');
  assert.equal(cricketOutcome({ outcome:'loss',settled:true,ourScore:4,theirScore:4 }), 'run-out');
  assert.equal(cricketOutcome({ outcome:'loss',settled:true,ourScore:0,theirScore:0 }), 'run-out');
  assert.equal(cricketOutcome({ outcome:'loss',settled:true,ourScore:1,theirScore:4 }), 'wicket');
});
test('unknown, malformed or contradictory score inputs do not manufacture a close finish', () => {
  for (const pair of [[undefined,4],[2,undefined],[NaN,2],[-1,0],[2.5,3],[5,2],['2',3]]) assert.equal(cricketOutcome({ outcome:'loss',settled:true,ourScore:pair[0],theirScore:pair[1] }), 'wicket');
});
test('result re-mount and simultaneous scorecards can claim only one automatic moment', () => {
  const gate=createCricketMomentGate(3);
  assert.equal(gate.claim('fixture-a:player-a'), true);
  assert.equal(gate.claim('fixture-a:player-a'), false);
  assert.equal(gate.claim('fixture-a:player-b'), true);
  assert.equal(gate.claim('fixture-b:player-a'), true);
  assert.equal(gate.claim('fixture-c:player-a'), false, 'capacity never evicts old receipt IDs');
  assert.equal(gate.claim('fixture-a:player-a'), false);
});
test('invalid event IDs cannot consume a moment and animation duration stays bounded', () => {
  const gate=createCricketMomentGate();
  for (const id of [null,'','x'.repeat(201),{},1]) assert.equal(gate.claim(id), false);
  assert.equal(gate.claim('real-result'), true);
  assert.ok(CRICKET_MOMENT_MS > 0 && CRICKET_MOMENT_MS <= 3000);
});
