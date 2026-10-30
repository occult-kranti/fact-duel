import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { emptyOverRewards, recoverOverRewards, OVER_RECEIPT_LIMIT } from '../lib/over-rewards.mjs';

const now = 1_800_000_000_000;
function proof(id, mode = 'trilogy', perfect = false) {
  const full = mode === 'gauntlet';
  const completionXp = full ? 150 : 60, precisionXp = perfect ? (full ? 60 : 30) : 0;
  return { id: `${id}:bonus`, at: now, kind: 'match', xp: completionXp + precisionXp,
    label: 'Over completed', meta: { matchId: id, mode, bonus: 'over-completion-v1', completionXp, precisionXp, clubPoints: full ? 45 : 15 } };
}
function room(id, mode) {
  const count = mode === 'gauntlet' ? 6 : 3;
  const completedRounds = Array.from({ length: count }, (_, index) => ({
    id: `${id}:${index}`, index, result: { winner: 1 },
    receipts: [{ choice: 1, correct: false, elapsedMs: 4000 }, { choice: 0, correct: true, elapsedMs: 3000 }],
    question: { factId: `${id}-q${index}`, question: 'Which option?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Verified answer.', topic: 'Cricket', subtopic: 'International', sourceUrl: 'https://example.org', sourceLabel: 'Primary' },
  }));
  return { id, config: { mode, topic: 'Cricket', overRewardsVersion: 1 }, phase: 'complete', seat: 0, roundIndex: count - 1, completedRounds, round: completedRounds.at(-1), players: [{ kind: 'human' }, { kind: 'bot' }], scores: [0, count], winner: 1 };
}
const play = (profile, value) => reduceProfile(profile, { type: 'room', room: value, epoch: profile.epoch, at: now });

test('Mini then Full receipts survive a missing-field reload without changing awarded XP', () => {
  let profile = emptyProfile('receipt-recovery', now);
  const rooms = [room('mini-recovery', 'trilogy'), room('full-recovery', 'gauntlet')];
  for (const [index, value] of rooms.entries()) {
    profile = play(profile, value);
    const xp = profile.progression.xp, counters = structuredClone(profile.progression.counters);
    const stored = JSON.parse(JSON.stringify(profile));
    delete stored.progression.overRewards;
    profile = readProfile(stored);
    assert.equal(profile.progression.overRewards.completed, index + 1);
    assert.equal(profile.progression.xp, xp);
    assert.deepEqual(profile.progression.counters, counters);
    assert.deepEqual(readProfile(JSON.parse(JSON.stringify(profile))), profile);
  }
  assert.deepEqual([profile.progression.overRewards.mini, profile.progression.overRewards.full, profile.progression.overRewards.clubPoints], [1, 1, 60]);
  const trimmed = { ...profile, journal: { ...profile.journal, matches: [], rounds: [] } };
  for (const value of rooms) {
    const replay = play(trimmed, value);
    assert.equal(replay.progression.xp, profile.progression.xp);
    assert.deepEqual(replay.progression.overRewards, profile.progression.overRewards);
  }
});

test('only exact v1 completion proofs reconstruct missing IDs; perfect and ordinary bonuses qualify', () => {
  const entries = [proof('mini'), proof('mini-perfect', 'trilogy', true), proof('full', 'gauntlet'), proof('full-perfect', 'gauntlet', true)];
  const recovered = recoverOverRewards(undefined, entries);
  assert.deepEqual([recovered.completed, recovered.mini, recovered.full, recovered.clubPoints], [4, 2, 2, 120]);
  assert.deepEqual(recoverOverRewards(recovered, [...entries, ...entries]), recovered);
});

test('malformed, unrelated and conflicting proof records cannot reconstruct a receipt', () => {
  const base = proof('invalid');
  const patches = [
    { kind: 'round' }, { id: '' }, { at: NaN }, { xp: 61 }, { xp: '60' },
    ...[{ bonus: 'over-completion-v2' }, { matchId: '' }, { matchId: 'x'.repeat(101) }, { mode: 'quick' },
      { completionXp: 150 }, { completionXp: '60' }, { precisionXp: 1 }, { precisionXp: 60 }, { clubPoints: 45 }]
      .map(meta => ({ meta: { ...base.meta, ...meta } })),
  ];
  for (const patch of patches) assert.deepEqual(recoverOverRewards(undefined, [{ ...base, ...patch }]), emptyOverRewards());
  assert.deepEqual(recoverOverRewards(undefined, [proof('conflict'), proof('conflict', 'gauntlet')]), emptyOverRewards());
  const profile = emptyProfile();
  profile.progression.log = [{ ...base, label: '' }];
  assert.deepEqual(readProfile(profile).progression.overRewards, emptyOverRewards(), 'profile sanitizer rejects malformed logs before recovery');
});

test('existing receipts survive expired logs and recovery never evicts IDs at capacity', () => {
  const existing = { version: 1, ids: ['older-than-log'], full: 1 };
  const restored = recoverOverRewards(existing, [proof('recent'), proof('recent')]);
  assert.deepEqual(restored.ids, ['older-than-log', 'recent']);
  assert.equal(restored.full, 1);
  assert.deepEqual(recoverOverRewards(restored, []), restored);
  const ids = Array.from({ length: OVER_RECEIPT_LIMIT }, (_, i) => `known-${i}`);
  assert.deepEqual(recoverOverRewards({ version: 1, ids, full: 0 }, [proof('overflow')]).ids, ids);
});

test('reset clears proofs and stale epoch actions cannot recover or repay the previous profile', () => {
  const value = room('before-reset', 'trilogy');
  const old = play(emptyProfile('old', now), value);
  const reset = reduceProfile(old, { type: 'reset', newEpoch: 'new', at: now + 1 });
  assert.deepEqual(readProfile(reset).progression.overRewards, emptyOverRewards());
  assert.strictEqual(reduceProfile(reset, { type: 'room', room: value, epoch: 'old', at: now + 2 }), reset);
});
