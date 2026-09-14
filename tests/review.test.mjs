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
  seedDeck,
  sessionOrder,
  trimAttempts,
} from '../lib/journal-review.mjs';
import { readJournalValue } from '../lib/journal.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { CONFIDENCE, EXPEDITIONS } from '../lib/expeditions.mjs';
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

/**
 * One expedition run answered to a plan: `[confidence, correct]` per card, in card order. The all-Steady
 * all-correct case above stays as it is; this exists for the seeded-deck tests, which need misses at
 * different tiers to have anything to order. `start` replays the route on an existing profile, which is
 * how a card accumulates the LIFETIME `boldWrong` count that the deck's this-run ranking has to beat.
 * Card order is the route's own and is stable across runs (`q001..q006`), so index i is always ids[i].
 */
async function runSix(plan, at = MORNING, start = null, runId = 'plan') {
  const { cards } = await dispatch(null, { action: 'expedition', routeId: route.id });
  let clock = at;
  let p = start ?? emptyProfile();
  const act = (a) => (p = reduceProfile(p, { epoch: p.epoch, at: (clock += 1000), routeId: route.id, ...a }));
  act({ type: 'journey-start', runId, cards, previousRunId: p.journeys?.[route.key]?.run?.id ?? null });
  plan.forEach(([confidence, correct], i) => {
    const f = p.journeys[route.key].run.cards[i];
    const choice = correct ? f.correctIndex : (f.correctIndex + 1) % 4;
    act({ type: 'journey-answer', index: i, runId, choice, confidence });
    act({ type: 'journey-next', index: i, runId });
  });
  return p;
}

/**
 * Park every card well out of the queue, with real schedule state to protect: the first id is MISSED on
 * day one and correct after, so it ends a box behind the others and carrying a lapse.
 *
 * Three Vault days rather than one because the seed tests need a day on which NOTHING is due — one
 * correct review is due again tomorrow — and because a seed refuses a card already answered in the Vault
 * that same local day, so the parking has to end before the day the seed lands on. Returns the profile
 * and the instant of the day after the last review.
 */
function parkDeep(profile, ids, at) {
  let p = profile;
  let day = at;
  for (let round = 0; round < 3; round += 1) {
    let clock = day;
    for (const factId of ids) {
      p = reduceProfile(p, {
        epoch: p.epoch,
        at: (clock += 1000),
        type: 'review',
        factId,
        correct: round > 0 || factId !== ids[0],
      });
    }
    day = dueAfter(day, 1) + 10 * 3_600_000;
  }
  return { profile: p, at: day };
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
/* --------------------------------------------------------------------------------------------------
 * §3.5's seeded deck: "Take your {n} misses to the Vault" -> precisely those facts, due = now, in the
 * order they are worth re-reading.
 *
 * The constraint under test is what the seed does NOT do. It is the primary action out of a run that
 * finished below zero, pressed by a player who has just lost points, and it must not pay them for
 * pressing it: a seed that advanced a box would hand out the box ladder for reading an answer, which is
 * the exploit `revealed` already closes on the attempt side. So every one of these pins a field that
 * must not have moved, not just the one that must have.
 *
 * `due` is itself the gate lib/progression.mjs pays a review against (`e.due && e.advanced`), so the
 * seed is ALSO rate limited to one look per card per local day — without that, seed -> answer -> seed
 * -> answer is an unbounded XP tap and the button is a reward after all.
 * ------------------------------------------------------------------------------------------------ */

test('a seeded deck makes precisely those facts due, and moves `due` and nothing else', async () => {
  let p = await metSixFacts();
  const ids = Object.keys(p.journal.facts);
  // Real schedule state to protect: the first card lapsed on its first look and is a box behind.
  const parked = parkDeep(p, ids, MORNING + 3_600_000);
  p = parked.profile;
  assert.deepEqual(dueToday(p.journal, parked.at), [], 'a reviewed card is still in today’s queue');
  const before = structuredClone(p.journal.facts);
  const priorJournal = p.journal;
  assert.equal(before[ids[0]].lapses, 1);
  assert.equal(before[ids[0]].box, 2);
  assert.equal(before[ids[3]].box, 3);

  const at = parked.at + 1000;
  p = reduceProfile(p, { epoch: p.epoch, at, type: 'review-seed', factIds: [ids[0], ids[3]] });
  // Precisely the named two, and the lapsed one first — the queue's own priority, not the deck's.
  assert.deepEqual(dueToday(p.journal, at), [ids[0], ids[3]]);
  for (const id of ids) {
    const seeded = id === ids[0] || id === ids[3];
    assert.equal(p.journal.facts[id].due, seeded ? at : before[id].due, `${id} has the wrong due date`);
    // Field for field against the record as it was, with only `due` neutralised: box, lapses,
    // retiredAt, seen, correct, streak, days and the rest all have to be untouched.
    assert.deepEqual(
      { ...p.journal.facts[id], due: 0 },
      { ...before[id], due: 0 },
      `the seed moved more than the due date on ${id}`,
    );
  }
  // And nothing outside `facts` and the deck itself: no attempt minted, no card store touched, no round.
  for (const key of Object.keys(p.journal)) {
    if (key === 'facts' || key === 'seed') continue;
    assert.equal(p.journal[key], priorJournal[key], `the seed moved journal.${key}`);
  }
  assert.deepEqual(p.journal.seed, { at, factIds: [ids[0], ids[3]] });
});

test('a seed is identity for an unknown fact, and for a re-seed at the same instant', async () => {
  const p = await metSixFacts();
  const [id] = Object.keys(p.journal.facts);
  const at = MORNING + 10 * DAY;
  const unknown = reduceProfile(p, {
    epoch: p.epoch,
    at,
    type: 'review-seed',
    factIds: ['fact-nobody-has-met'],
  });
  assert.equal(unknown, p, 'a seed invented a fact the journal has never met');

  const once = reduceProfile(p, { epoch: p.epoch, at, type: 'review-seed', factIds: [id] });
  assert.notEqual(once, p, 'the seed did not write');
  assert.equal(once.revision, p.revision + 1);
  assert.equal(once.journal.facts[id].due, at);
  const twice = reduceProfile(once, { epoch: once.epoch, at, type: 'review-seed', factIds: [id] });
  assert.equal(twice, once, 're-seeding the same ids at the same instant wrote a second time');
  assert.equal(twice.revision, once.revision, 'a seed that changed nothing bumped the revision');
  // The tripwire five suites assert: a seeded profile still round-trips through the sanitiser — which
  // now has one more field to carry, and a deck it dropped would be an order silently lost on reload.
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(once))), once);
  assert.deepEqual(readJournalValue(JSON.parse(JSON.stringify(once.journal))).seed, { at, factIds: [id] });
});

test('an explicit seed resurfaces a retired fact, and leaves it retired', async () => {
  let p = await metSixFacts();
  const [id] = Object.keys(p.journal.facts);
  let day = MORNING;
  // Five correct reviews on five distinct local days: box 5 and days >= 3, which is the retire rule.
  for (let i = 0; i < MAX_BOX; i += 1) {
    day = dueAfter(day, 1) + 10 * 3_600_000;
    p = reduceProfile(p, { epoch: p.epoch, at: day, type: 'review', factId: id, correct: true });
  }
  const retired = p.journal.facts[id];
  assert.equal(retired.box, MAX_BOX);
  assert.equal(typeof retired.retiredAt, 'number', 'the fact never retired');
  assert.equal(isDue(retired, day + 1000), false, 'a retired fact is in the queue without a seed');
  // A minute after the audit was answered the seed refuses: that look has been paid for today, and
  // re-opening it is how a retired card becomes the cheapest tap in the game.
  const sameDay = reduceProfile(p, { epoch: p.epoch, at: day + 60_000, type: 'review-seed', factIds: [id] });
  assert.equal(sameDay, p, 'a card answered in the Vault today was re-seeded');

  const at = dueAfter(day, 1) + 9 * 3_600_000;
  p = reduceProfile(p, { epoch: p.epoch, at, type: 'review-seed', factIds: [id] });
  assert.ok(dueToday(p.journal, at).includes(id), 'an explicit seed did not resurface a retired fact');
  // Resurfacing is a due date, not a promotion and not a demotion: the audit record stands.
  assert.equal(p.journal.facts[id].retiredAt, retired.retiredAt);
  assert.equal(p.journal.facts[id].box, MAX_BOX);
  assert.equal(p.journal.facts[id].lapses, retired.lapses);
});

test('seed -> answer -> seed -> answer pays once, not once per cycle', async () => {
  let p = await metSixFacts();
  const ids = Object.keys(p.journal.facts);
  const [id] = ids;
  let clock = MORNING + 3_600_000;
  const act = (a) => (p = reduceProfile(p, { epoch: p.epoch, at: (clock += 1000), ...a }));

  act({ type: 'review-seed', factIds: [id] });
  act({ type: 'review', factId: id, correct: true });
  const paid = { xp: p.progression.xp, reviews: p.progression.counters.reviews };
  assert.equal(paid.reviews, 1, 'the first seeded look did not pay');

  // Twelve more cycles. Before the rate limit each one paid XP.reviewCorrect and ticked `reviews`: the
  // box freezes at MAX_BOX but `due` still moves from the seeded instant out to the ladder's next look,
  // so `advanced` never goes false and the gate never closes.
  const settled = p;
  for (let i = 0; i < 12; i += 1) {
    act({ type: 'review-seed', factIds: [id] });
    act({ type: 'review', factId: id, correct: true });
  }
  assert.equal(p.progression.xp, paid.xp, 'the seed paid a second time — the XP tap is open');
  assert.equal(p.progression.counters.reviews, paid.reviews, 'the review counter ticked a second time');

  // The refusal is per card, not per press: a card the player has NOT answered in the Vault today still
  // seeds in the same dispatch, which is the real §3.5 hand-off out of a bad run.
  const mixed = reduceProfile(settled, {
    epoch: settled.epoch,
    at: clock + 1000,
    type: 'review-seed',
    factIds: [id, ids[1]],
  });
  assert.equal(mixed.journal.facts[id].due, settled.journal.facts[id].due, 'the spent card was re-seeded');
  assert.equal(mixed.journal.facts[ids[1]].due, clock + 1000, 'the fresh card did not seed');
  assert.deepEqual(mixed.journal.seed.factIds, [ids[1]], 'a refused card was still put in the played deck');

  // And it is a DAY limit, not a lifetime one: tomorrow the same card seeds again.
  const tomorrow = dueAfter(clock, 1) + 9 * 3_600_000;
  const next = reduceProfile(settled, {
    epoch: settled.epoch,
    at: tomorrow,
    type: 'review-seed',
    factIds: [id],
  });
  assert.equal(next.journal.facts[id].due, tomorrow, 'the rate limit outlived its local day');
});

test('the Vault plays the seeded deck’s order, not the lifetime bold-miss counter', async () => {
  // Bold, Called, Steady in CARD order, so the deck's ranking (Called, Bold, Steady) and the journal's
  // insertion order (0, 1, 2) disagree. That is the whole point: `Array.prototype.sort` is stable, so a
  // plan whose insertion order already matches the deck certifies nothing.
  const plan = [
    ['bold', false],
    ['called', false],
    ['steady', false],
    ['steady', true],
    ['steady', true],
    ['steady', true],
  ];
  let p = await runSix(plan);
  const ids = Object.keys(p.journal.facts);
  const parked = parkDeep(p, ids, MORNING + 3_600_000);
  p = parked.profile;
  const at = parked.at + 1000;
  assert.deepEqual(dueToday(p.journal, parked.at), []);

  // What app/screens/expeditions/finish.tsx hands the dispatcher: the missed factIds, each carrying
  // the `order` of the tier it was called at. In card order, so the sort has something to do.
  const deck = [0, 1, 2].map((i) => ({ factId: ids[i], order: CONFIDENCE[plan[i][0]].order }));
  const wanted = [ids[1], ids[0], ids[2]]; // Called, Bold, Steady
  assert.deepEqual(seedDeck(deck, at).factIds, wanted, 'the deck is not calls-above-Steady-first');

  const seeded = reduceProfile(p, { epoch: p.epoch, at, type: 'review-seed', factIds: deck });
  assert.deepEqual(seeded.journal.seed.factIds, wanted, 'the deck’s order was not persisted');
  assert.deepEqual(sessionOrder(seeded.journal, at), wanted, 'the Vault did not play the deck it was seeded');
  // The tripwire. `dueToday` sorts on the lifetime `boldWrong` counter and CANNOT produce this order, so
  // the assertion above can only pass because the deck was stored and played.
  assert.notDeepEqual(
    dueToday(seeded.journal, at),
    wanted,
    'dueToday reproduces the deck on its own — this test proves nothing',
  );
  // The same entries fed in reverse still come back in deck order: the `order` field decides, never the
  // array position and never the journal's insertion order.
  const reversed = reduceProfile(p, {
    epoch: p.epoch,
    at,
    type: 'review-seed',
    factIds: [...deck].reverse(),
  });
  assert.deepEqual(sessionOrder(reversed.journal, at), wanted, 'the array order decided the queue');
  // And with `order` stripped the deck must NOT arrive sorted by tier — proof the field carries it.
  const bare = reduceProfile(p, { epoch: p.epoch, at, type: 'review-seed', factIds: ids.slice(0, 3) });
  assert.notDeepEqual(
    sessionOrder(bare.journal, at),
    wanted,
    'a deck with no tier order still sorted by tier',
  );
  // A deck is one run's hand-off, not a standing preference: tomorrow the queue is the queue again.
  const tomorrow = dueAfter(at, 1) + 9 * 3_600_000;
  assert.deepEqual(sessionOrder(seeded.journal, tomorrow), dueToday(seeded.journal, tomorrow));
});

test('this run’s Called miss leads a card that has been missed confidently for weeks', async () => {
  // q001 is Called-and-missed in two earlier runs (boldWrong 2). In today's run it is only a Steady miss
  // and q002 is the fresh Called miss (boldWrong 1). The Vault's lifetime sort puts q001 first; §3.5
  // asks for the call the player just blew.
  const earlier = [
    ['called', false],
    ['steady', true],
    ['steady', true],
    ['steady', true],
    ['steady', true],
    ['steady', true],
  ];
  let p = await runSix(earlier, MORNING);
  p = await runSix(earlier, MORNING + DAY, p, 'run2');
  const today = MORNING + 2 * DAY;
  p = await runSix(
    [
      ['steady', false],
      ['called', false],
      ['steady', true],
      ['steady', true],
      ['steady', true],
      ['steady', true],
    ],
    today,
    p,
    'run3',
  );
  const ids = Object.keys(p.journal.facts);
  assert.deepEqual(
    p.journeys[route.key].run.cards.map((c) => c.factId),
    ids,
    'the route reordered its cards between runs — the plan indexes are no longer the ids',
  );
  assert.equal(p.journal.facts[ids[0]].boldWrong, 2, 'the stale counter is not what the test assumes');
  assert.equal(p.journal.facts[ids[1]].boldWrong, 1);

  const at = today + 60_000;
  const deck = [
    { factId: ids[0], order: CONFIDENCE.steady.order },
    { factId: ids[1], order: CONFIDENCE.called.order },
  ];
  const seeded = reduceProfile(p, { epoch: p.epoch, at, type: 'review-seed', factIds: deck });
  assert.deepEqual(sessionOrder(seeded.journal, at).slice(0, 2), [ids[1], ids[0]]);
  assert.equal(
    dueToday(seeded.journal, at)[0],
    ids[0],
    'the lifetime counter no longer leads dueToday — this test has stopped discriminating',
  );
});
