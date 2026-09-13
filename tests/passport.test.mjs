import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, readProfile, reduceProfile, passportSummary, FACT_LIMIT } from '../lib/passport.mjs';
const fact = (id = 'q001') => ({
  factId: id,
  question: `Question ${id}?`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Original explanation.',
  topic: 'Space',
  subtopic: 'Missions',
  sourceUrl: 'https://example.org/source',
  sourceLabel: 'Primary source',
});
const room = (id = 'match-1', f = fact(), phase = 'complete') => ({
  id,
  createdAt: 1000,
  phase,
  seat: 0,
  config: { mode: 'quick' },
  players: [{ kind: 'human' }, { kind: 'bot' }],
  scores: [1, 0],
  winner: 0,
  round: {
    id: `${id}:0`,
    result: phase === 'playing' ? null : { winner: 0 },
    question: f,
    receipts: [{ correct: true, elapsedMs: 1200 }, null],
  },
});
const act = (p, a) => reduceProfile(p, { epoch: p.epoch, at: 2000, ...a });
test('stable fact IDs award once across rounds, changed stems and shuffled options', () => {
  let p = act(emptyProfile(), { type: 'room', room: room() });
  assert.equal(passportSummary(p.passport).points, 10);
  const same = act(p, { type: 'room', room: room() });
  assert.strictEqual(same, p);
  p = act(p, {
    type: 'room',
    room: room('match-2', {
      ...fact(),
      question: 'Edited wording?',
      options: ['B', 'A', 'C', 'D'],
      correctIndex: 1,
    }),
  });
  assert.equal(p.journal.rounds.length, 2);
  assert.equal(passportSummary(p.passport).facts, 1);
  assert.equal(passportSummary(p.passport).points, 10);
});
test('open and recall points are idempotent; unknown facts cannot earn points', () => {
  let p = act(emptyProfile(), { type: 'room', room: room() });
  assert.strictEqual(act(p, { type: 'recall', roundId: 'missing' }), p);
  for (let i = 0; i < 8; i++) {
    p = act(p, { type: 'open', roundId: 'match-1:0' });
    p = act(p, { type: 'recall', roundId: 'match-1:0' });
  }
  assert.equal(passportSummary(p.passport).points, 20);
  assert.equal(passportSummary(p.passport).missions[0].complete, true);
  assert.equal(act(p, { type: 'skin', skin: 'orbit' }).passport.skin, 'orbit');
  assert.equal(act(p, { type: 'skin', skin: 'rally' }).passport.skin, 'classic');
});
test('active or interrupted rounds do not create earned match completion', () => {
  const p = emptyProfile();
  assert.strictEqual(act(p, { type: 'room', room: room('active', fact(), 'playing') }), p);
  const cancelled = {
    ...room('cancelled'),
    phase: 'cancelled',
    round: { ...room('cancelled').round, result: null },
  };
  assert.strictEqual(act(p, { type: 'room', room: cancelled }), p);
  const invalid = { ...room(), round: { ...room().round, question: { ...fact(), correctIndex: undefined } } };
  const out = act(p, { type: 'room', room: { ...invalid, phase: 'between' } });
  assert.equal(Object.keys(out.passport.facts).length, 0);
});
test('earned fields and cosmetics survive rolling journal history caps', () => {
  let p = emptyProfile();
  for (let i = 0; i < 220; i++) {
    p = act(p, { type: 'room', room: room(`match-${i}`, fact(`q${String(i).padStart(3, '0')}`)) });
    p = act(p, { type: 'open', roundId: `match-${i}:0` });
    p = act(p, { type: 'recall', roundId: `match-${i}:0` });
  }
  p = act(p, { type: 'skin', skin: 'grid' });
  assert.equal(p.journal.rounds.length, 200);
  assert.equal(p.journal.matches.length, 100);
  assert.equal(passportSummary(p.passport).points, 4400);
  assert.equal(p.passport.skin, 'grid');
  assert.equal(Object.keys(p.passport.facts).length, 220);
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
});
test('corrupted progress is sanitized and locked cosmetics cannot survive reload', () => {
  const p = readProfile({
    version: 2,
    epoch: 3,
    revision: -2,
    passport: {
      skin: 'rally',
      facts: { x: { topic: {} }, q001: { topic: 'Space', opened: 'yes', recalled: [] } },
      modes: ['bad', {}, 'quick', 'quick'],
    },
  });
  assert.equal(p.epoch, 'initial');
  assert.equal(p.revision, 0);
  assert.equal(p.passport.skin, 'classic');
  assert.deepEqual(p.passport.facts, { q001: { topic: 'Space', opened: false, recalled: false } });
  assert.deepEqual(p.passport.modes, ['quick']);
  assert.deepEqual(readProfile({ version: 55 }), emptyProfile());
});
test('reset clears progress and journal; stale seat generations cannot restore them, regardless of clock skew', () => {
  let p = act(emptyProfile(), { type: 'room', room: room() });
  const oldEpoch = p.epoch;
  p = act(p, { type: 'reset', newEpoch: 'reset-2', at: 3000 });
  assert.equal(p.journal.rounds.length, 0);
  assert.equal(passportSummary(p.passport).points, 0);
  assert.strictEqual(reduceProfile(p, { type: 'room', room: room(), epoch: oldEpoch, at: 4000 }), p);
  const after = act(p, { type: 'room', room: { ...room('fresh'), createdAt: -5000 } });
  assert.equal(passportSummary(after.passport).points, 10);
});
test('untimed discovery can earn the first expedition without a duel or a win', () => {
  let p = act(emptyProfile(), { type: 'practice', fact: fact(), choice: 2, roundId: 'practice:1' });
  assert.equal(p.journal.rounds[0].correct, false);
  assert.equal(p.journal.matches.length, 0);
  assert.equal(passportSummary(p.passport).points, 15);
  p = act(p, { type: 'open', roundId: 'practice:1' });
  assert.equal(passportSummary(p.passport).missions[0].complete, true);
  assert.equal(p.passport.played, false);
  const again = act(p, { type: 'practice', fact: fact(), choice: 0, roundId: 'practice:2' });
  assert.equal(passportSummary(again.passport).points, 20);
});
test('invalid practice choices and malformed facts cannot generate activity', () => {
  const p = emptyProfile();
  for (const choice of [-1, 4, 0.5, '1'])
    assert.strictEqual(act(p, { type: 'practice', fact: fact(), choice, roundId: 'test' }), p);
  assert.strictEqual(
    act(p, {
      type: 'practice',
      fact: { ...fact(), options: ['A', 'A', 'B', 'C'] },
      choice: 0,
      roundId: 'test',
    }),
    p,
  );
});
test('passport ledger stops accepting new IDs at its declared bound without reducing earlier points', () => {
  const p = emptyProfile();
  for (let i = 0; i < FACT_LIMIT; i++)
    p.passport.facts[`q${i}`] = { topic: 'Space', opened: false, recalled: false };
  const out = act(p, { type: 'room', room: room('new', fact('q99999')) });
  assert.equal(Object.keys(out.passport.facts).length, FACT_LIMIT);
  assert.equal(passportSummary(out.passport).points, FACT_LIMIT * 10);
  assert.equal(out.journal.rounds.length, 1);
});

test('one practice attempt cannot be mutated into a second fact or corrected answer', () => {
  const p = act(emptyProfile(), { type: 'practice', fact: fact(), choice: 2, roundId: 'attempt:1' });
  const same = act(p, { type: 'practice', fact: fact('q002'), choice: 0, roundId: 'attempt:1' });
  assert.strictEqual(same, p);
  assert.equal(p.journal.rounds[0].correct, false);
});

test('recovered multi-round snapshots record every sourced fact once and preserve completed-match count', () => {
  const round1 = room('recovered', fact('q001')).round,
    round2 = { ...room('recovered', fact('q002')).round, id: 'recovered:1' };
  const match = {
    ...room('recovered'),
    round: round2,
    completedRounds: [
      { ...round1, index: 0 },
      { ...round2, index: 1 },
    ],
  };
  let p = act(emptyProfile(), { type: 'room', room: match });
  assert.equal(p.journal.rounds.length, 2);
  assert.equal(p.journal.matches.length, 1);
  assert.equal(passportSummary(p.passport).facts, 2);
  assert.strictEqual(act(p, { type: 'room', room: match }), p);
  const cancelled = {
    ...match,
    phase: 'cancelled',
    round: { ...round2, result: null },
    completedRounds: [{ ...round1, index: 0 }],
  };
  const recovered = act(emptyProfile(), { type: 'room', room: cancelled });
  assert.equal(recovered.journal.rounds.length, 1);
  assert.equal(recovered.journal.matches.length, 0);
  assert.equal(passportSummary(recovered.passport).facts, 1);
});
test('question issues require an encountered fact, deduplicate and remain in export state until reset', () => {
  let p = act(emptyProfile(), { type: 'room', room: room() });
  assert.strictEqual(act(p, { type: 'report', roundId: 'missing', reason: 'incorrect', note: '' }), p);
  assert.strictEqual(act(p, { type: 'report', roundId: 'match-1:0', reason: 'bad', note: '' }), p);
  p = act(p, { type: 'report', roundId: 'match-1:0', reason: 'ambiguous', note: ' Scope needs a date. ' });
  assert.equal(p.issues.length, 1);
  assert.equal(p.issues[0].note, 'Scope needs a date.');
  assert.equal(p.issues[0].fact.sourceUrl, fact().sourceUrl);
  assert.strictEqual(
    act(p, { type: 'report', roundId: 'match-1:0', reason: 'ambiguous', note: 'Scope needs a date.' }),
    p,
  );
  p = act(p, { type: 'report', roundId: 'match-1:0', reason: 'ambiguous', note: 'Updated concern.' });
  assert.equal(p.issues.length, 1);
  assert.equal(p.issues[0].note, 'Updated concern.');
  const reloaded = readProfile(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(reloaded.issues, p.issues);
  const snapshot = reloaded.issues[0].fact.question;
  p = act(p, { type: 'room', room: room('edited', { ...fact(), question: 'Edited question' }) });
  assert.equal(p.issues[0].fact.question, snapshot);
  p = act(p, { type: 'reset', newEpoch: 'after-report-reset' });
  assert.equal(p.issues.length, 0);
  assert.equal(p.journal.rounds.length, 0);
});
test('corrupt issue storage is discarded and old profiles initialize an empty issue list', () => {
  const legacy = emptyProfile();
  delete legacy.issues;
  assert.deepEqual(readProfile(legacy).issues, []);
  assert.deepEqual(
    readProfile({
      ...emptyProfile(),
      issues: [null, { id: 'fake', reason: 'incorrect', note: 'bad', at: 3, fact: {} }],
    }).issues,
    [],
  );
});
