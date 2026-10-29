import test from 'node:test';
import assert from 'node:assert/strict';
import { STADIUM_LEVELS, TROPHY_RULES, canPlayStadiumMode, clubTrophyProgress, eligibleStadiumSelection, stadiumById, stadiumForMode, stadiumRoad } from '../lib/stadium-road.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';

const profile = (answered = 0, correct = 0, rounds = answered) => ({ progression: { counters: { rounds, attemptedRounds: answered, correct } } });
const act = (state, action) => reduceProfile(state, { epoch: state.epoch, at: 1_000, ...action });
function room(id, choices = [0], phase = 'complete') {
  const rounds = choices.map((choice, index) => ({
    id: `${id}:${index}`, index,
    question: { factId: `${id}-q${index}`, question: 'Which option?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'A is correct.', topic: 'Cricket', subtopic: 'History', sourceUrl: 'https://example.org/source', sourceLabel: 'Source' },
    receipts: [{ choice, correct: choice === null ? null : choice === 0, elapsedMs: choice === null ? null : 2_000 }, null],
    result: { winner: choice === 0 ? 0 : null },
  }));
  return { id, createdAt: 1_000, phase, seat: 0, roundIndex: rounds.length - 1, config: { mode: choices.length === 1 ? 'quick' : 'gauntlet', topic: 'Cricket' }, players: [{ kind: 'human' }, { kind: 'bot' }], scores: [choices.filter((c) => c === 0).length, 0], winner: 0, round: rounds.at(-1), completedRounds: rounds };
}

test('three original grounds have exact 0/60/180 gates and meaningful formats', () => {
  assert.deepEqual(STADIUM_LEVELS.map(({ id, threshold, mode }) => [id, threshold, mode]), [['gully', 0, 'gauntlet'], ['riverside', 60, 'chase'], ['crown', 180, 'superover']]);
  assert.deepEqual(TROPHY_RULES, { attemptedRound: 4, correctAnswer: 2 });
  assert.equal(stadiumById('unknown'), null);
  assert.equal(stadiumForMode('quick').id, 'gully');
  assert.equal(stadiumForMode('trilogy').id, 'gully');
  assert.equal(stadiumForMode('unknown'), null);
});

test('local gates open exactly at achievable practice totals, with bounded progress', () => {
  for (const [state, total, current, remaining] of [
    [profile(), 0, 'gully', 60], [profile(10, 9), 58, 'gully', 2],
    [profile(10, 10), 60, 'riverside', 120], [profile(30, 29), 178, 'riverside', 2],
    [profile(30, 30), 180, 'crown', 0],
  ]) {
    const road = stadiumRoad(state);
    assert.equal(road.trophies, total);
    assert.equal(road.current.id, current);
    assert.equal(road.remaining, remaining);
    assert.ok(road.fraction >= 0 && road.fraction <= 1);
  }
  assert.equal(stadiumRoad(profile(30, 30)).next, null);
});

test('literal odd boundaries are exercised through the independent server total, never impossible local fixtures', () => {
  for (const [human, ground] of [[0, 'gully'], [59, 'gully'], [60, 'riverside'], [179, 'riverside'], [180, 'crown']]) {
    assert.equal(stadiumRoad(profile(), human).current.id, ground);
  }
});

test('independent paths use their higher total without summing, transferring or mutating records', () => {
  const local = profile(10, 9);
  const snapshot = JSON.stringify(local);
  const road = stadiumRoad(local, 59);
  assert.equal(road.trophies, 59);
  assert.equal(road.practiceTrophies, 58);
  assert.equal(road.humanTrophies, 59);
  assert.equal(road.unlockSource, 'human');
  assert.equal(road.current.id, 'gully', '58 local plus 59 server must never open the 60 gate');
  assert.equal(stadiumRoad(profile(30, 30), 59).unlockSource, 'practice');
  assert.equal(JSON.stringify(local), snapshot);
});

test('answered deliveries earn four, correct earns two more, and timeouts or match farming add nothing', () => {
  assert.deepEqual(clubTrophyProgress(profile(2, 1, 5)), { trophies: 10, answeredRounds: 2, correctAnswers: 1 });
  assert.equal(clubTrophyProgress(profile(0, 0, 100)).trophies, 0);
  const a = profile(10, 5); a.progression.counters.matches = 2;
  const b = profile(10, 5); b.progression.counters.matches = 10_000;
  assert.equal(stadiumRoad(a).trophies, stadiumRoad(b).trophies);
});

test('legacy records seed only provable correct attempts and survive export-style round trips', () => {
  const original = emptyProfile('legacy');
  original.progression.counters.rounds = 100;
  original.progression.counters.correct = 10;
  delete original.progression.counters.attemptedRounds;
  const migrated = readProfile(JSON.parse(JSON.stringify(original)));
  assert.equal(migrated.progression.counters.attemptedRounds, 10);
  assert.equal(stadiumRoad(migrated).trophies, 60);
  assert.equal(stadiumRoad(readProfile(JSON.parse(JSON.stringify(migrated)))).trophies, 60);
});

test('settled receipts award once on normal duplicate snapshots and wrong answers remain distinguishable from timeouts', () => {
  let state = emptyProfile('receipts');
  const complete = room('one', [0, 1, null]);
  state = act(state, { type: 'room', room: complete });
  assert.equal(state.progression.counters.rounds, 3);
  assert.equal(state.progression.counters.attemptedRounds, 2);
  assert.equal(stadiumRoad(state).trophies, 10);
  const again = act(state, { type: 'room', room: { ...complete, revision: 99 } });
  assert.strictEqual(again, state);
  assert.equal(stadiumRoad(again).trophies, 10);
  const reloaded = readProfile(JSON.parse(JSON.stringify(state)));
  assert.equal(stadiumRoad(act(reloaded, { type: 'room', room: complete })).trophies, 10);
});

test('an unsettled answer never earns a trophy, and complete-match duplicate settlement does not pay twice', () => {
  const finished = room('progress', [0]);
  const playing = { ...finished, phase: 'playing', completedRounds: [], round: { ...finished.round, result: null } };
  let state = act(emptyProfile('progress'), { type: 'room', room: playing });
  assert.equal(stadiumRoad(state).trophies, 0);
  state = act(state, { type: 'room', room: { ...finished, phase: 'between' } });
  assert.equal(stadiumRoad(state).trophies, 6);
  state = act(state, { type: 'room', room: finished });
  assert.equal(stadiumRoad(state).trophies, 6);
});

test('earned totals outlive capped journal records; epoch reset clears local progression and rejects stale writes', () => {
  let state = emptyProfile('old');
  for (let i = 0; i < 205; i++) state = act(state, { type: 'room', room: room(`history-${i}`) });
  assert.equal(state.journal.rounds.length, 200);
  assert.equal(state.journal.matches.length, 100);
  assert.equal(stadiumRoad(state).trophies, 1_230);
  state = act(state, { type: 'reset', newEpoch: 'new', at: 2_000 });
  assert.equal(stadiumRoad(state).trophies, 0);
  const stale = reduceProfile(state, { type: 'room', epoch: 'old', room: room('history-204'), at: 3_000 });
  assert.strictEqual(stale, state);
  assert.equal(stadiumRoad(state, 180).current.id, 'crown', 'device reset does not falsify the independent human record');
});

test('unlock guards reject locked and unknown modes while selection can replay earned earlier grounds', () => {
  assert.equal(canPlayStadiumMode(profile(), 'quick'), true);
  assert.equal(canPlayStadiumMode(profile(), 'gauntlet'), true);
  assert.equal(canPlayStadiumMode(profile(), 'chase'), false);
  assert.equal(canPlayStadiumMode(profile(), 'chase', 60), true);
  assert.equal(canPlayStadiumMode(profile(10, 10), 'superover'), false);
  assert.equal(canPlayStadiumMode(profile(30, 30), 'superover'), true);
  assert.equal(canPlayStadiumMode(profile(30, 30), 'invented'), false);
  assert.equal(eligibleStadiumSelection(profile(), 'crown').id, 'gully');
  assert.equal(eligibleStadiumSelection(profile(30, 30), 'gully').id, 'gully');
  assert.equal(eligibleStadiumSelection(profile(30, 30), 'invalid').id, 'crown');
});

test('malformed local or server values cannot produce NaN, negative progress or fractional gates', () => {
  for (const value of [undefined, null, NaN, Infinity, -1, 59.5, '180']) assert.equal(stadiumRoad(profile(), value).trophies, 0);
  for (const value of [undefined, null, NaN, Infinity, -1, 1.5, '180']) assert.equal(stadiumRoad(profile(value, value, value)).trophies, 0);
  assert.equal(stadiumRoad(profile(100, 100, 2)).trophies, 12);
  assert.equal(stadiumRoad(null).trophies, 0);
  assert.equal(stadiumRoad(profile(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).trophies, 60_000_000);
});
