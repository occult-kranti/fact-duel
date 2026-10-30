import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamSnapshotGuard, considerTeamSnapshot } from '../app/screens/teams/snapshot.mjs';
const snap = (serverNow, fixtureId = 'fixture-a', round = 1, phase = 'question') => ({ serverNow, run: { fixtureId, round, phase } });
const accept = (previous, incoming, options = {}) => considerTeamSnapshot(previous, incoming, { identityId: 'player-a', ...options });

test('an older question poll cannot replace a later answer receipt or unlock its round', () => {
  const receipt = accept(createTeamSnapshotGuard('player-a'), snap(200, 'fixture-a', 1, 'result')).guard;
  assert.equal(accept(receipt, snap(199)).accepted, false);
  assert.equal(accept(receipt, snap(200)).accepted, false, 'same-millisecond question response also regresses phase');
  assert.equal(accept(receipt, snap(201, 'fixture-a', 1, 'result')).accepted, true);
});
test('next-round and finished responses are monotonic even when a delayed poll has a newer clock', () => {
  const next = accept(createTeamSnapshotGuard('player-a'), snap(200, 'fixture-a', 2)).guard;
  assert.equal(accept(next, snap(201, 'fixture-a', 1, 'result')).accepted, false);
  const finished = accept(next, snap(202, 'fixture-a', 3, 'finished')).guard;
  assert.equal(accept(finished, snap(203, 'fixture-a', 3, 'question')).accepted, false);
  assert.equal(accept(finished, snap(203, 'fixture-a', 3, 'finished')).accepted, true);
});
test('scorecard reads preserve the contribution scope without activating a returned run', () => {
  const current = accept(createTeamSnapshotGuard('player-a'), snap(200, 'fixture-a', 2, 'result')).guard;
  const scorecard = accept(current, snap(201, 'fixture-b', 1), { includeRun: false });
  assert.equal(scorecard.accepted, true);
  assert.deepEqual(scorecard.guard.run, current.run);
  const initialRead = accept(createTeamSnapshotGuard('player-a'), snap(202), { includeRun: false });
  assert.equal(initialRead.guard.run, null);
});
test('a new fixture or identity has a fresh round scope; the old identity clock is not carried across', () => {
  const completed = accept(createTeamSnapshotGuard('player-a'), snap(400, 'fixture-a', 6, 'finished')).guard;
  const differentFixture = accept(completed, snap(401, 'fixture-b', 1));
  assert.equal(differentFixture.accepted, true);
  assert.equal(differentFixture.guard.run.round, 1);
  const differentPlayer = accept(completed, snap(100), { identityId: 'player-b' });
  assert.equal(differentPlayer.accepted, true);
  assert.equal(differentPlayer.guard.identityId, 'player-b');
  assert.equal(differentPlayer.guard.run.phase, 'question');
});
test('invalid timestamps or run phases never advance the authority guard', () => {
  const previous = createTeamSnapshotGuard('player-a');
  for (const incoming of [{ serverNow: NaN }, snap(100, 'fixture-a', 0), snap(100, 'fixture-a', 1, 'unknown')]) {
    const result = accept(previous, incoming);
    assert.equal(result.accepted, false);
    assert.strictEqual(result.guard, previous);
  }
});
