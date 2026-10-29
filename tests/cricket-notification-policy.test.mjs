import test from 'node:test';
import assert from 'node:assert/strict';
import { allowCeremonyOverlay, allowToastOverlay } from '../lib/fx/notification-policy.mjs';

test('reward bursts never interrupt the next game, including progression disguised as info', () => {
  for (const kind of ['xp', 'quest', 'achievement', 'streak', 'gem']) {
    assert.equal(allowToastOverlay({ kind, title: 'Saved reward' }), false);
    assert.equal(allowToastOverlay({ kind, title: 'Saved reward', roundFeedback: true }), false);
  }
  assert.equal(allowToastOverlay({ kind: 'info', roundFeedback: true }), false);
  assert.equal(allowCeremonyOverlay(), false);
});

test('operational feedback remains visible and demos can deliberately enable reward overlays', () => {
  assert.equal(allowToastOverlay({ kind: 'info', title: 'Connection interrupted' }), true);
  assert.equal(allowToastOverlay({ kind: 'info', title: 'Copied' }), true);
  assert.equal(allowToastOverlay({ kind: 'quest' }, { rewardOverlays: true }), true);
  assert.equal(allowCeremonyOverlay({ rewardOverlays: true }), true);
  assert.equal(allowToastOverlay(null), false);
});
