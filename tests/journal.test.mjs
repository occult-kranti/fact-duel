import test from 'node:test';
import assert from 'node:assert/strict';
import { readJournal, recordRoom, uniqueFacts } from '../lib/journal.mjs';
const fresh = () => readJournal(null);
function result() {
  return {
    id: 'match-1',
    phase: 'between',
    seat: 0,
    config: { mode: 'gauntlet' },
    players: [{ kind: 'human' }, { kind: 'bot' }],
    scores: [1, 0],
    winner: 0,
    round: {
      id: 'round-1',
      result: { winner: 0 },
      receipts: [{ correct: true, elapsedMs: 1600 }, null],
      question: {
        question: 'Which answer?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        explanation: 'An original explanation.',
        topic: 'Space',
        subtopic: 'Orbits',
        sourceUrl: 'https://example.org/fact',
        sourceLabel: 'Primary source',
      },
    },
  };
}
test('journal saves only revealed rounds and completed matches and deduplicates repeated snapshots', () => {
  const room = result(),
    empty = fresh();
  assert.strictEqual(recordRoom(empty, { ...room, round: { ...room.round, result: null } }), empty);
  const first = recordRoom(empty, room, 1000);
  assert.equal(first.rounds.length, 1);
  assert.equal(first.matches.length, 0);
  assert.strictEqual(recordRoom(first, room, 2000), first);
  assert.equal(recordRoom(first, { ...room, phase: 'cancelled' }, 2000).matches.length, 0);
  const complete = recordRoom(first, { ...room, phase: 'complete' }, 3000);
  assert.equal(complete.matches.length, 1);
  assert.equal(complete.matches[0].bot, true);
  assert.strictEqual(recordRoom(complete, { ...room, phase: 'complete' }, 4000), complete);
  assert.deepEqual(readJournal(JSON.stringify(complete)), complete);
});
test('round observations count separately while repeat facts are deduplicated in review', () => {
  const room = result(),
    a = recordRoom(fresh(), room, 1000);
  const b = recordRoom(a, { ...room, id: 'match-2', round: { ...room.round, id: 'round-2' } }, 2000);
  assert.equal(b.rounds.length, 2);
  assert.equal(uniqueFacts(b.rounds).length, 1);
  assert.equal(uniqueFacts(b.rounds)[0].id, 'round-2');
});
test('malformed persisted facts and matches are filtered before React rendering', () => {
  const valid = recordRoom(fresh(), { ...result(), phase: 'complete' }, 1000),
    fact = valid.rounds[0],
    match = valid.matches[0];
  const badFacts = [
    { ...fact, topic: {} },
    { ...fact, explanation: [] },
    { ...fact, sourceLabel: {} },
    { ...fact, correctAnswer: 'Z' },
    { ...fact, options: ['A'] },
    { ...fact, options: ['A', 'A', 'B', 'C'] },
    { ...fact, sourceUrl: 'javascript:alert(1)' },
    { ...fact, at: 'yesterday' },
    { ...fact, elapsedMs: -1 },
  ];
  const badMatches = [
    { ...match, mode: {} },
    { ...match, mode: 'unknown' },
    { ...match, at: null },
    { ...match, scores: [9, 0] },
  ];
  const out = readJournal(
    JSON.stringify({
      ...valid,
      rounds: [fact, ...badFacts],
      matches: [match, ...badMatches],
      saved: ['Which answer?', {}],
    }),
  );
  assert.deepEqual(out.rounds, [fact]);
  assert.deepEqual(out.matches, [match]);
  assert.deepEqual(out.saved, ['Which answer?']);
  assert.deepEqual(readJournal('{bad json'), fresh());
  assert.deepEqual(readJournal('{"version":2}'), fresh());
});
test('local history is bounded as more rounds and matches arrive', () => {
  const room = result();
  let journal = fresh();
  for (let i = 0; i < 220; i++)
    journal = recordRoom(
      journal,
      { ...room, id: `match-${i}`, phase: 'complete', round: { ...room.round, id: `round-${i}` } },
      i,
    );
  assert.equal(journal.rounds.length, 200);
  assert.equal(journal.matches.length, 100);
  assert.equal(journal.rounds[0].id, 'round-219');
});
