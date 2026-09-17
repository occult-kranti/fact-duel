import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { transactProfile } from '../lib/profile-store.mjs';
import { passportSummary, reduceProfile } from '../lib/passport.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';
const card = (i) => ({
  factId: `q${i}`,
  question: `Question ${i}?`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Explanation.',
  topic: 'Space',
  subtopic: 'Orbits',
  sourceUrl: 'https://example.org/fact',
  sourceLabel: 'Source',
});
test('browser database serializes independent updates, immutable retries and stale writes after reset', async () => {
  await transactProfile({ type: 'reset', newEpoch: 'test-1', at: 0 });
  await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      transactProfile({
        type: 'practice',
        epoch: 'test-1',
        at: 1000,
        fact: card(i),
        choice: 1,
        roundId: `practice:${i}`,
      }),
    ),
  );
  const before = await transactProfile(null);
  assert.equal(before.journal.rounds.length, 30);
  assert.equal(passportSummary(before.passport).points, 450);
  await Promise.all(
    Array.from({ length: 10 }, () =>
      transactProfile({ type: 'open', epoch: 'test-1', at: 2000, roundId: 'practice:0' }),
    ),
  );
  const after = await transactProfile(null);
  assert.equal(passportSummary(after.passport).points, 455);
  await transactProfile({ type: 'reset', newEpoch: 'test-2', at: 3000 });
  await transactProfile({
    type: 'practice',
    epoch: 'test-1',
    at: 4000,
    fact: card(40),
    choice: 0,
    roundId: 'stale',
  });
  const reset = await transactProfile(null);
  assert.equal(reset.journal.rounds.length, 0);
  assert.equal(passportSummary(reset.passport).points, 0);
  assert.equal(reset.epoch, 'test-2');
  const legacy = { version: 1, rounds: [before.journal.rounds[0]], matches: [], saved: [] };
  const reloaded = await transactProfile(null, JSON.stringify(legacy));
  assert.equal(reloaded.journal.rounds.length, 0, 'old localStorage cannot resurrect after DB reset');
});

test('two browser transactions cannot overwrite expedition choices, skip a card or duplicate its stamp', async () => {
  const epoch = 'journey-race';
  await transactProfile({ type: 'reset', newEpoch: epoch, at: 0 });
  const { cards } = await dispatch(null, { action: 'expedition', routeId: 'cricket' });
  const event = { epoch, routeId: 'cricket', runId: 'race-run', at: 1000 };
  await Promise.all(
    ['race-run', 'other-run'].map((runId) =>
      transactProfile({ ...event, type: 'journey-start', runId, cards, previousRunId: null }),
    ),
  );
  let p = await transactProfile(null);
  assert.equal(p.journeys['cricket:1'].run.id, 'race-run');
  for (let i = 0; i < 6; i++) {
    await Promise.all([
      transactProfile({
        ...event,
        type: 'journey-answer',
        index: i,
        choice: cards[i].correctIndex,
        confidence: 'bold',
      }),
      transactProfile({
        ...event,
        type: 'journey-answer',
        index: i,
        choice: (cards[i].correctIndex + 1) % 4,
        confidence: 'steady',
      }),
    ]);
    await Promise.all([
      transactProfile({ ...event, type: 'journey-next', index: i }),
      transactProfile({ ...event, type: 'journey-next', index: i }),
    ]);
  }
  p = await transactProfile(null);
  assert.equal(p.journeys['cricket:1'].first.score, 18);
  assert.equal(p.journeys['cricket:1'].completions, 1);
  assert.equal(p.journal.rounds.length, 6);
  await transactProfile({ type: 'reset', newEpoch: 'journey-reset', at: 3000 });
  await transactProfile({ ...event, type: 'journey-start', runId: 'late-load', cards, previousRunId: null });
  assert.deepEqual((await transactProfile(null)).journeys, {});
});

test("'replace' stores a server copy whole through the sanitiser, keeps its revision, and refuses a non-profile", async () => {
  await transactProfile({ type: 'reset', newEpoch: 'device-a', at: 0 });
  await transactProfile({ type: 'practice', epoch: 'device-a', at: 1000, fact: card(1), choice: 0, roundId: 'practice:1' });
  const mine = await transactProfile(null);
  assert.equal(mine.journal.rounds.length, 1);

  // A copy from another device: further along, a different epoch, and carrying junk a sanitiser drops.
  let theirs = { ...(await transactProfile({ type: 'reset', newEpoch: 'device-b', at: 0 })) };
  for (let i = 10; i < 14; i++)
    theirs = reduceProfile(theirs, { type: 'practice', epoch: 'device-b', at: 2000 + i, fact: card(i), choice: 1, roundId: `practice:${i}` });
  theirs = { ...theirs, revision: 500, passport: { ...theirs.passport, skin: 'gold', facts: { ...theirs.passport.facts, bad: { topic: 'Nope' } } }, extra: 1 };
  // Back to the device-a copy so the replace has something real to overwrite.
  await transactProfile({ type: 'replace', state: mine });
  assert.equal((await transactProfile(null)).epoch, 'device-a');

  const replaced = await transactProfile({ type: 'replace', state: JSON.parse(JSON.stringify(theirs)) });
  assert.equal(replaced.revision, 500, 'the incoming revision is kept, not bumped');
  assert.equal(replaced.epoch, 'device-b');
  assert.equal(replaced.journal.rounds.length, 4);
  assert.equal(replaced.passport.skin, 'classic');
  assert.equal('bad' in replaced.passport.facts, false);
  assert.equal('extra' in replaced, false);
  const reread = await transactProfile(null);
  assert.deepEqual(reread, replaced, 'round-trips through the store unchanged');

  for (const state of [null, 'x', 7, [], { version: 1 }, {}])
    await assert.rejects(transactProfile({ type: 'replace', state }), /Not a profile/);
  assert.deepEqual(await transactProfile(null), replaced, 'a refused replace changes nothing');

  // Writes continue from the replaced copy: its epoch, its revision.
  const next = await transactProfile({ type: 'practice', epoch: 'device-b', at: 9000, fact: card(20), choice: 0, roundId: 'practice:20' });
  assert.equal(next.revision, 501);
  assert.equal(next.journal.rounds.length, 5);
  const stale = await transactProfile({ type: 'practice', epoch: 'device-a', at: 9001, fact: card(21), choice: 0, roundId: 'practice:21' });
  assert.equal(stale.revision, 501, 'an action from the old epoch is dropped');
});
