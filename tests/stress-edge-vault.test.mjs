/**
 * Vault regressions from the branch stress hunt, pinned so they cannot come back.
 *
 * Everything here belongs to lib/passport.mjs's two write paths into the review schedule — the seeded
 * deck §3.5 hands over out of a bad run (`applySeed`) and the schedule half a non-recall answer writes
 * (`nextFact`). Both defects were invisible to tests/review.test.mjs because its fixtures never put the
 * two surfaces in the same day: its seed fixtures build profiles out of expedition replays alone (no
 * fact has ever been reviewed) and `parkDeep` deliberately stops reviewing the day before the seed.
 * The normal state of a returning player — a card reviewed in the Vault last week and missed in a run
 * today — is exactly the state neither covered.
 *
 * A separate file rather than tests/stress-edge.test.mjs: that file is being written by another agent
 * in this same wave, and a new file cannot collide with an edit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTEMPTS_PER_FACT,
  dueAfter,
  dueToday,
  isDue,
  nextAudit,
  sessionOrder,
} from '../lib/journal-review.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { CONFIDENCE, EXPEDITIONS } from '../lib/expeditions.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';

const route = EXPEDITIONS[0];
/** 10:02 local on an ordinary Sunday, the hour tests/review.test.mjs sits on. */
const MORNING = new Date(2026, 8, 13, 10, 2).getTime();
const ALL_STEADY = Array.from({ length: 6 }, () => ['steady', true]);

/** One run of route 0 answered to `plan` ([tier, correct] per card), starting at `at`. */
async function runSix(plan, at, start = null, runId = 'run') {
  const { cards } = await dispatch(null, { action: 'expedition', routeId: route.id });
  let clock = at;
  let p = start ?? emptyProfile();
  const act = (a) => (p = reduceProfile(p, { epoch: p.epoch, at: (clock += 1000), routeId: route.id, ...a }));
  act({ type: 'journey-start', runId, cards, previousRunId: p.journeys?.[route.key]?.run?.id ?? null });
  plan.forEach(([confidence, correct], i) => {
    const f = p.journeys[route.key].run.cards[i];
    act({
      type: 'journey-answer',
      index: i,
      runId,
      choice: correct ? f.correctIndex : (f.correctIndex + 1) % 4,
      confidence,
    });
    act({ type: 'journey-next', index: i, runId });
  });
  return { p, clock };
}

/** The deck app/screens/expeditions/finish.tsx builds out of a finished run, field for field. */
function missedDeck(profile) {
  const run = profile.journeys[route.key].run;
  const deck = [];
  run.cards.forEach((f, i) => {
    const a = run.answers[i];
    if (a && a.choice !== f.correctIndex)
      deck.push({ factId: f.factId, order: CONFIDENCE[a.confidence]?.order ?? 0 });
  });
  return deck;
}

/** Review `id` correctly on each of the next `n` days its own ladder asks for. */
function reviewOnLadder(profile, id, n, from) {
  let p = profile;
  let day = from;
  for (let i = 0; i < n; i += 1) {
    day = (p.journal.facts[id].due ?? day) + 10 * 3_600_000;
    p = reduceProfile(p, { epoch: p.epoch, at: day, type: 'review', factId: id, correct: true });
  }
  return { p, at: day };
}

test('a run’s miss reaches the Vault even when the player has reviewed that card before', async () => {
  // The seed's rate limit used to read `facts[id].lastAt`, which EVERY surface writes. The expedition
  // answer that produced the miss stamps it seconds before the deck is dispatched, so the guard fired
  // on precisely the cards the hand-off exists for — and a card parked up the ladder is not in
  // `dueToday` either, so it reached the Vault by no route at all.
  const met = await runSix(ALL_STEADY, MORNING, null, 'met');
  const ids = Object.keys(met.p.journal.facts);
  const [id] = ids;
  const parked = reviewOnLadder(met.p, id, 4, MORNING);
  const before = parked.p.journal.facts[id];
  assert.ok(before.box >= 4, `the card should be well up the ladder, got box ${before.box}`);

  const runAt = dueAfter(parked.at, 5) + 10 * 3_600_000;
  assert.equal(isDue(before, runAt), false, 'the fixture needs a card that is NOT already due');

  const plan = ALL_STEADY.map((x, i) => (i === 0 ? ['called', false] : x));
  const out = await runSix(plan, runAt, parked.p, 'bad');
  assert.deepEqual(missedDeck(out.p), [{ factId: id, order: CONFIDENCE.called.order }]);

  const seedAt = out.clock + 1000;
  const p = reduceProfile(out.p, {
    epoch: out.p.epoch,
    at: seedAt,
    type: 'review-seed',
    factIds: missedDeck(out.p),
  });
  assert.deepEqual(
    p.journal.seed,
    { at: seedAt, factIds: [id] },
    'the Called miss was dropped from the deck',
  );
  assert.equal(p.journal.facts[id].due, seedAt, 'the seed did not make the missed card due');
  assert.ok(isDue(p.journal.facts[id], seedAt), 'the card the run just handed over is not in the queue');
  assert.equal(sessionOrder(p.journal, seedAt)[0], id, 'the fresh Called miss does not lead the session');
  assert.ok(dueToday(p.journal, seedAt).includes(id));
  // The seed moves a due date and nothing else: no box, no lapse, no counter.
  const after = p.journal.facts[id];
  for (const k of ['box', 'lapses', 'retiredAt', 'seen', 'correct', 'days', 'boldWrong'])
    assert.deepEqual(after[k], out.p.journal.facts[id][k], `the seed moved ${k}`);
  assert.deepEqual(
    readProfile(JSON.parse(JSON.stringify(p))),
    p,
    'the seeded profile stopped round-tripping',
  );
});

test('the stored deck keeps this run’s whole ranking, not just its never-reviewed cards', async () => {
  // The milder half of the same defect: with two of three misses refused, `journal.seed` shrinks to
  // one id, so app/journal.tsx prints "the 1 card you just missed" and the order reverts to the
  // LIFETIME bold-miss sort the deck exists to override.
  const met = await runSix(ALL_STEADY, MORNING, null, 'met');
  let p = met.p;
  const ids = Object.keys(p.journal.facts);
  const day2 = dueAfter(MORNING, 1) + 10 * 3_600_000;
  for (const id of ids.slice(0, 2))
    p = reduceProfile(p, { epoch: p.epoch, at: day2, type: 'review', factId: id, correct: true });

  const runAt = dueAfter(MORNING, 9) + 10 * 3_600_000;
  const plan = ALL_STEADY.map((x, i) => (i < 3 ? [i === 1 ? 'bold' : 'called', false] : x));
  const out = await runSix(plan, runAt, p, 'bad');
  const seedAt = out.clock + 1000;
  p = reduceProfile(out.p, {
    epoch: out.p.epoch,
    at: seedAt,
    type: 'review-seed',
    factIds: missedDeck(out.p),
  });

  // Called, Called, Bold — the tier's own order, ties broken by card order, exactly seedDeck's rule.
  assert.deepEqual(p.journal.seed.factIds, [ids[0], ids[2], ids[1]], 'the run’s ranking was lost');
  assert.deepEqual(sessionOrder(p.journal, seedAt).slice(0, 3), [ids[0], ids[2], ids[1]]);
});

test('the seed still pays one look per card per local day, even with the attempt tail emptied', async () => {
  // The limit has to key on the last RECALL attempt rather than the last answer — but `attempts` is a
  // capped tail (R4), so the recall attempt it looks for can be EVICTED by later answers on other
  // surfaces. When the log can no longer prove a review did not happen today, the seed must refuse:
  // the other direction is seed -> answer -> seed -> answer paying XP.reviewCorrect for ever.
  const met = await runSix(ALL_STEADY, MORNING, null, 'met');
  let p = met.p;
  const [id] = Object.keys(p.journal.facts);
  let clock = dueAfter(MORNING, 1) + 10 * 3_600_000;
  const act = (a) => (p = reduceProfile(p, { epoch: p.epoch, at: (clock += 1000), ...a }));

  act({ type: 'review-seed', factIds: [id] });
  act({ type: 'review', factId: id, correct: true });
  const paid = p.progression.counters.reviews;
  assert.equal(paid, 1, 'the first seeded look did not pay');

  // Flood this fact's slice of the tail with same-day answers on another surface.
  for (let i = 0; i < ATTEMPTS_PER_FACT; i += 1) {
    const flood = await runSix(ALL_STEADY, clock, p, `flood${i}`);
    p = flood.p;
    clock = flood.clock;
  }
  const mine = p.journal.attempts.filter((a) => a.factId === id);
  assert.equal(mine.length, ATTEMPTS_PER_FACT, 'the fixture must saturate the per-fact attempt cap');
  assert.equal(
    mine.filter((a) => a.surface === 'recall').length,
    0,
    'the fixture must actually evict the recall attempt, or it proves nothing',
  );

  for (let i = 0; i < 3; i += 1) {
    act({ type: 'review-seed', factIds: [id] });
    act({ type: 'review', factId: id, correct: true });
  }
  assert.equal(
    p.progression.counters.reviews,
    paid,
    'the XP tap reopened once the recall attempt was evicted',
  );

  // And it stays a DAY limit, not a lifetime one.
  const tomorrow = dueAfter(clock, 1) + 9 * 3_600_000;
  const next = reduceProfile(p, { epoch: p.epoch, at: tomorrow, type: 'review-seed', factIds: [id] });
  assert.equal(next.journal.facts[id].due, tomorrow, 'the rate limit outlived its local day');
});

test('a fact that has passed its audit never returns to the queue', async () => {
  const met = await runSix(ALL_STEADY, MORNING, null, 'met');
  let p = met.p;
  const [id] = Object.keys(p.journal.facts);
  let day = MORNING;
  for (let i = 0; i < 5; i += 1) {
    day = dueAfter(day, 1) + 10 * 3_600_000;
    p = reduceProfile(p, { epoch: p.epoch, at: day, type: 'review', factId: id, correct: true });
  }
  const retired = p.journal.facts[id];
  assert.equal(typeof retired.retiredAt, 'number', 'the fixture never retired the fact');
  assert.ok(Number.isFinite(retired.due), 'a retirement leaves exactly one look: the audit');

  // A retirement whose audit is still PENDING is not what this closes: it still seeds.
  const beforeAudit = dueAfter(day, 1) + 9 * 3_600_000;
  const pending = reduceProfile(p, { epoch: p.epoch, at: beforeAudit, type: 'review-seed', factIds: [id] });
  assert.equal(pending.journal.facts[id].due, beforeAudit, 'a pending audit stopped seeding');

  const auditAt = retired.due + 3_600_000;
  p = reduceProfile(p, { epoch: p.epoch, at: auditAt, type: 'review', factId: id, correct: true });
  const audited = p.journal.facts[id];
  assert.equal(audited.due, null, 'passing the audit must close the queue on the fact');
  assert.equal(isDue(audited, auditAt + 1000), false);
  assert.equal(nextAudit(p.journal, auditAt + 1000), null, 'the terminal empty state must stay terminal');
  const settled = { xp: p.progression.xp, reviews: p.progression.counters.reviews };

  // Door one: any non-recall answer. `due: prior.due ?? at` used to read the audited `null` as
  // "never scheduled" and make the card due at that instant, retirement and all.
  const replay = await runSix(ALL_STEADY, auditAt + 30 * 86_400_000, p, 'replay');
  p = replay.p;
  const met2 = p.journal.facts[id];
  assert.equal(met2.due, null, 'an expedition answer put an audited fact back in the queue');
  assert.equal(met2.retiredAt, retired.retiredAt, 'the audit record must stand');
  assert.equal(isDue(met2, replay.clock), false);
  assert.ok(!dueToday(p.journal, replay.clock).includes(id));

  // Door two: the seed. A deck moves a due date; it does not overrule the ladder's terminal state.
  const seedAt = replay.clock + 1000;
  const seeded = reduceProfile(p, { epoch: p.epoch, at: seedAt, type: 'review-seed', factIds: [id] });
  assert.equal(seeded.journal.facts[id].due, null, 'a seed resurrected an audited fact');
  assert.equal(seeded.journal, p.journal, 'a seed that can change nothing must be identity');

  // And neither door pays: an off-queue re-answer is recorded in full and earns nothing.
  p = reduceProfile(p, { epoch: p.epoch, at: seedAt + 1000, type: 'review', factId: id, correct: true });
  assert.equal(p.progression.counters.reviews, settled.reviews, 'a closed fact paid review XP again');
  assert.equal(p.journal.facts[id].due, null, 'the closed fact did not stay closed');
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
});
