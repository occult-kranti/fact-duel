/**
 * The Vault's review schedule, and R4 from the writer's side.
 *
 * The ladder, the lapse rule and the retire rule are the only thing standing between "the Vault pays"
 * and "the Vault is a tap-for-XP button", so each of them is pinned here against the numbers §3.4
 * names rather than against whatever lib/journal-review.mjs currently returns. The cap tests exist
 * because R4 says a cap the sanitiser applies and the writer does not is not a cap: it is a silent
 * rewrite of the profile on the next load, and the identity contract goes with it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTEMPTS_PER_FACT,
  ATTEMPTS_TOTAL,
  BOX_DAYS,
  MAX_BOX,
  dueAfter,
  dueToday,
  emptySchedule,
  isDue,
  nextSchedule,
  trimAttempts,
} from '../lib/journal-review.mjs';
import { readJournalValue } from '../lib/journal.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { EXPEDITIONS } from '../lib/expeditions.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';

const route = EXPEDITIONS[0];
const DAY = 86_400_000;
/** 10:02 local on an ordinary Sunday. Late enough in the day that a +24h ladder would visibly differ. */
const MORNING = new Date(2026, 8, 13, 10, 2).getTime();

/** One expedition run answered all-correct at Steady: six facts met, six attempts, no box moved. */
async function metSixFacts(at = MORNING) {
  const { cards } = await dispatch(null, { action: 'expedition', routeId: route.id });
  let clock = at;
  let p = emptyProfile();
  const act = (a) => (p = reduceProfile(p, { epoch: p.epoch, at: (clock += 1000), routeId: route.id, ...a }));
  act({ type: 'journey-start', runId: 'seed', cards, previousRunId: null });
  for (let i = 0; i < 6; i++) {
    const f = p.journeys[route.key].run.cards[i];
    act({ type: 'journey-answer', index: i, runId: 'seed', choice: f.correctIndex, confidence: 'steady' });
    act({ type: 'journey-next', index: i, runId: 'seed' });
  }
  return p;
}

test('the box ladder is 1, 3, 7, 16 and 35 days, and every step lands on a local midnight', () => {
  let fact = { ...emptySchedule() };
  let at = MORNING;
  for (let step = 0; step < MAX_BOX; step += 1) {
    // `days: 0` keeps the fact off the retire rule so the whole ladder is walked, not just its first
    // four rungs — retirement is the next test's subject, not this one's.
    const next = nextSchedule(fact, { correct: true, days: 0 }, at);
    assert.equal(next.box, step + 1, `step ${step} moved to box ${next.box}`);
    assert.equal(next.due, dueAfter(at, BOX_DAYS[step]), `box ${next.box} is not ${BOX_DAYS[step]} days out`);
    const midnight = new Date(next.due);
    assert.equal(midnight.getHours(), 0);
    assert.equal(midnight.getMinutes(), 0);
    fact = next;
    at = next.due + 9 * 3_600_000;
  }
  // Box 5 is the top of the ladder: a correct answer there repeats 35 days, it does not overflow.
  const beyond = nextSchedule(fact, { correct: true, days: 0 }, at);
  assert.equal(beyond.box, MAX_BOX);
  assert.equal(beyond.due, dueAfter(at, 35));
});

test('a miss drops exactly two boxes, never past zero, and puts the card back tomorrow', () => {
  const lapsed = nextSchedule(
    { box: 4, due: MORNING, lapses: 1, retiredAt: null },
    { correct: false },
    MORNING,
  );
  assert.deepEqual(lapsed, { box: 2, due: dueAfter(MORNING, 1), lapses: 2, retiredAt: null });

  const floored = nextSchedule(
    { box: 1, due: MORNING, lapses: 0, retiredAt: null },
    { correct: false },
    MORNING,
  );
  assert.equal(floored.box, 0, 'a box-1 miss went below zero');
  assert.equal(floored.lapses, 1);
});

test('box 5 on three distinct days retires the fact to one audit, and passing the audit closes the queue', () => {
  const ready = { box: 4, due: MORNING, lapses: 0, retiredAt: null };
  const retired = nextSchedule(ready, { correct: true, days: 3 }, MORNING);
  assert.equal(retired.box, MAX_BOX);
  assert.equal(retired.retiredAt, MORNING);
  assert.equal(retired.due, dueAfter(MORNING, 90), 'the single audit is not 90 days out');
  assert.equal(isDue(retired, MORNING + 89 * DAY), false);
  assert.equal(isDue(retired, retired.due), true, 'the audit never came due');

  // Two distinct correct days is not three: the fact keeps cycling at 35 days until it earns the third.
  const notYet = nextSchedule(ready, { correct: true, days: 2 }, MORNING);
  assert.equal(notYet.retiredAt, null);
  assert.equal(notYet.due, dueAfter(MORNING, 35));

  const audit = retired.due;
  const passed = nextSchedule(retired, { correct: true, days: 4 }, audit);
  assert.equal(passed.due, null, 'a passed audit left a next look on the clock');
  assert.equal(isDue(passed, audit + 365 * DAY), false, 'a passed audit came back');
});

test('a failed audit un-retires the fact and returns it to the queue tomorrow', () => {
  const retired = { box: MAX_BOX, due: MORNING, lapses: 0, retiredAt: MORNING - 90 * DAY };
  const failed = nextSchedule(retired, { correct: false }, MORNING);
  assert.equal(failed.retiredAt, null, 'a fact that failed its audit stayed retired');
  assert.equal(failed.box, MAX_BOX - 2);
  assert.equal(failed.due, dueAfter(MORNING, 1));
  assert.equal(isDue(failed, failed.due), true);
});

test('showing yourself the answer never moves the box', () => {
  const fact = { box: 3, due: MORNING - DAY, lapses: 1, retiredAt: null };
  assert.deepEqual(nextSchedule(fact, { correct: true, revealed: true }, MORNING), fact);
  // A reveal is not a miss either: it must not cost a box or bank a lapse.
  assert.deepEqual(nextSchedule(fact, { correct: false, revealed: true }, MORNING), fact);
});

test('dueToday turns over at local midnight, not 24 hours after the answer', async () => {
  let p = await metSixFacts();
  const [first] = Object.keys(p.journal.facts);
  p = reduceProfile(p, {
    epoch: p.epoch,
    at: MORNING + 60_000,
    type: 'review',
    factId: first,
    correct: true,
  });
  const due = p.journal.facts[first].due;
  assert.equal(due, dueAfter(MORNING, 1), 'box 1 is not tomorrow morning');

  // 23:59 tonight: the other five are unscheduled and still due, the reviewed one is not.
  const tonight = due - 60_000;
  assert.equal(dueToday(p.journal, tonight).includes(first), false, 'a box-1 card came due the same day');
  assert.equal(dueToday(p.journal, tonight).length, 5);
  // One minute later it is a new day, and the card is back.
  assert.equal(dueToday(p.journal, due).includes(first), true, 'the card did not turn over at midnight');
  assert.equal(dueToday(p.journal, due).length, 6);
});

test('dueToday spends its cap on the calls the player was sure about and wrong about', async () => {
  const p = await metSixFacts();
  const ids = Object.keys(p.journal.facts);
  const facts = { ...p.journal.facts };
  // Same topic throughout, so this reads pure priority order — the topic round-robin only decides the
  // order of the cards the cap has already chosen.
  facts[ids[4]] = { ...facts[ids[4]], boldWrong: 1, lastCorrect: false };
  facts[ids[2]] = { ...facts[ids[2]], lastCorrect: false };
  const journal = { ...p.journal, facts };
  assert.deepEqual(dueToday(journal, MORNING + DAY, 2), [ids[4], ids[2]]);
  assert.equal(dueToday(journal, MORNING + DAY, Infinity).length, 6, 'the uncapped count is the backlog');
});

test('R4: the review writer enforces the per-fact attempt cap the sanitiser enforces', async () => {
  let p = await metSixFacts();
  const [first] = Object.keys(p.journal.facts);
  // A repeat-until-correct loop reaches thirteen in under a minute, which is the whole reason the cap
  // has to hold at write time: the thirteenth attempt must be dropped now, not silently on next load.
  for (let i = 0; i < ATTEMPTS_PER_FACT + 3; i += 1) {
    p = reduceProfile(p, {
      epoch: p.epoch,
      at: MORNING + DAY + i * 1000,
      type: 'review',
      factId: first,
      correct: i % 2 === 0,
    });
  }
  const mine = p.journal.attempts.filter((a) => a.factId === first);
  assert.equal(mine.length, ATTEMPTS_PER_FACT, `the writer stored ${mine.length} attempts for one fact`);
  // Newest first, and the survivors are the newest ones — not the first twelve the player gave.
  assert.equal(mine[0].at, MORNING + DAY + (ATTEMPTS_PER_FACT + 2) * 1000);
  assert.equal(p.journal.attempts.filter((a) => a.factId !== first).length, 5, 'other facts were trimmed');

  // The identity contract: what the writer wrote is exactly what the sanitiser would keep.
  const round = readProfile(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(round.journal, p.journal, 'a round-tripped journal no longer equals the written one');
});

test('R4: the writer enforces the global attempt cap too, and the new attempt survives it', async () => {
  const p = await metSixFacts();
  const [first] = Object.keys(p.journal.facts);
  // A full tail, spread thin enough that the per-fact cap is not what does the work here.
  const filler = Array.from({ length: ATTEMPTS_TOTAL }, (_, i) => ({
    id: `filler-${i}`,
    factId: `q${String((i % 50) + 100).padStart(3, '0')}`,
    at: MORNING - i * 1000,
    surface: 'recall',
    contextId: 'filler',
    index: 0,
    chose: null,
    correct: true,
    elapsedMs: null,
    confidence: null,
    stake: null,
    opponent: null,
    revealed: false,
  }));
  const loaded = readProfile(
    JSON.parse(JSON.stringify({ ...p, journal: { ...p.journal, attempts: filler } })),
  );
  assert.equal(loaded.journal.attempts.length, ATTEMPTS_TOTAL, 'the fixture did not survive the sanitiser');

  const after = reduceProfile(loaded, {
    epoch: loaded.epoch,
    at: MORNING + DAY,
    type: 'review',
    factId: first,
    correct: true,
  });
  assert.equal(after.journal.attempts.length, ATTEMPTS_TOTAL, 'the writer let the tail grow past its cap');
  assert.equal(after.journal.attempts[0].factId, first, 'the new attempt was not prepended');
  assert.equal(
    after.journal.attempts.at(-1).id,
    `filler-${ATTEMPTS_TOTAL - 2}`,
    'the oldest was not the one dropped',
  );
});

test('R4: the sanitiser applies the per-fact cap before the global one, and is identity when neither bites', () => {
  const attempt = (i, factId) => ({
    id: `a-${i}`,
    factId,
    at: MORNING - i * 1000,
    surface: 'recall',
    contextId: 'ctx',
    index: 0,
    chose: null,
    correct: true,
    elapsedMs: null,
    confidence: null,
    stake: null,
    opponent: null,
    revealed: false,
  });
  // Twenty of one fact at the head of a full tail. Per-fact first drops eight of them, and eight
  // entries the global cap alone would have thrown off the end survive instead.
  const hot = Array.from({ length: 20 }, (_, i) => attempt(i, 'q001'));
  const rest = Array.from({ length: ATTEMPTS_TOTAL }, (_, i) =>
    attempt(100 + i, `q${String(100 + (i % 100)).padStart(3, '0')}`),
  );
  const kept = readJournalValue({ version: 1, attempts: [...hot, ...rest] }).attempts;
  assert.equal(kept.length, ATTEMPTS_TOTAL);
  assert.equal(kept.filter((a) => a.factId === 'q001').length, ATTEMPTS_PER_FACT);
  assert.equal(kept.at(-1).id, `a-${100 + ATTEMPTS_TOTAL - ATTEMPTS_PER_FACT - 1}`, 'the cap order changed');

  const fine = rest.slice(0, 20);
  assert.strictEqual(trimAttempts(fine), fine, 'a list inside both caps was copied rather than handed back');
});
