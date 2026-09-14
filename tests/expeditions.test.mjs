import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPEDITIONS,
  CONFIDENCE,
  runResult,
  runTally,
  validExpeditionCards,
  expeditionStatus,
} from '../lib/expeditions.mjs';
import { dayKey } from '../lib/journal.mjs';
import { emptyProfile, readProfile, reduceProfile, passportSummary } from '../lib/passport.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';
import { handleDuelRequest } from '../lib/server/http-handler.mjs';
const route = EXPEDITIONS[0];
const act = (p, a) => reduceProfile(p, { epoch: p.epoch, at: 1000, routeId: route.id, ...a });
async function begin(p = emptyProfile(), runId = 'run-1', r = route) {
  const { cards } = await dispatch(null, { action: 'expedition', routeId: r.id });
  return act(p, {
    type: 'journey-start',
    routeId: r.id,
    runId,
    cards,
    previousRunId: p.journeys[r.key]?.run?.id ?? null,
  });
}
function answer(p, index, correct = true, confidence = 'steady', runId = 'run-1') {
  const f = p.journeys[route.key].run.cards[index];
  return act(p, {
    type: 'journey-answer',
    index,
    runId,
    choice: correct ? f.correctIndex : (f.correctIndex + 1) % 4,
    confidence,
  });
}
function next(p, index, runId = 'run-1') {
  return act(p, { type: 'journey-next', index, runId });
}
function finish(p, correct = true, confidence = 'steady', runId = 'run-1') {
  for (let i = 0; i < 6; i++) {
    p = answer(p, i, correct, confidence, runId);
    p = next(p, i, runId);
  }
  return p;
}
test('all nine packs match finite manifests, preserve sources and leave catalogue answer-free', async () => {
  const ids = [];
  for (const r of EXPEDITIONS) {
    const pack = await dispatch(null, { action: 'expedition', routeId: r.id });
    assert.equal(pack.practice, true);
    assert.equal(pack.version, 1);
    assert.ok(validExpeditionCards(pack.cards, r));
    assert.deepEqual(
      pack.cards.map((f) => f.factId),
      r.ids,
    );
    ids.push(...r.ids);
  }
  assert.equal(new Set(ids).size, 54);
  assert.ok(!JSON.stringify(await dispatch(null, { action: 'catalogue' })).includes('correctIndex'));
  await assert.rejects(
    dispatch(null, { action: 'expedition', routeId: 'constructor' }),
    (e) => e.status === 400,
  );
  const res = await handleDuelRequest(
    new Request('https://example.test/api/duel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'expedition', routeId: route.id }),
    }),
    {},
  );
  assert.equal(res.status, 200);
  assert.equal((await res.json()).cards.length, 6);
});
test('signed confidence scoring is exact; scoring stance and first choice cannot change', async () => {
  let p = await begin();
  p = answer(p, 0, false, 'bold');
  assert.deepEqual(runResult(p.journeys[route.key].run), { score: -1, correct: 0, bold: 1 });
  assert.strictEqual(answer(p, 0, true, 'steady'), p);
  assert.equal(p.journal.rounds.length, 1);
  assert.equal(p.journal.rounds[0].correct, false);
  p = next(p, 0);
  p = answer(p, 1, true, 'steady');
  assert.deepEqual(runResult(p.journeys[route.key].run), { score: 1, correct: 1, bold: 1 });
  assert.equal(CONFIDENCE.steady.correct * 0.5, CONFIDENCE.bold.correct * 0.5 + CONFIDENCE.bold.wrong * 0.5);
});
test('all correct and all wrong runs earn one completion stamp with truthful scores', async () => {
  for (const hit of [true, false]) {
    let p = finish(await begin(), hit, 'bold');
    const r = p.journeys[route.key];
    assert.equal(r.first.score, hit ? 18 : -6);
    assert.equal(r.first.correct, hit ? 6 : 0);
    assert.equal(r.completions, 1);
    assert.equal(r.run.cursor, 6);
    assert.equal(expeditionStatus(r), 'complete');
    assert.strictEqual(next(p, 5), p);
    assert.equal(p.journal.matches.length, 0);
    assert.equal(p.journal.rounds.length, 6);
  }
});
test('cannot skip unanswered cards, replace partial runs or apply stale answer/advance', async () => {
  let p = await begin();
  assert.strictEqual(next(p, 0), p);
  assert.strictEqual(answer(p, 1), p);
  assert.strictEqual(answer(p, 0, true, 'bold', 'wrong-run'), p);
  assert.strictEqual(await begin(p, 'replacement'), p);
  p = answer(p, 0);
  p = next(p, 0);
  assert.strictEqual(next(p, 0), p);
  assert.strictEqual(answer(p, 0), p);
  for (const confidence of ['unknown', 'constructor', '__proto__'])
    assert.strictEqual(answer(p, 1, true, confidence), p);
});
test('resume preserves selected answer before advancing and all answered before explicit finish', async () => {
  let p = await begin();
  p = answer(p, 0, false, 'bold');
  p = readProfile(JSON.parse(JSON.stringify(p)));
  assert.equal(p.journeys[route.key].run.answers[0].confidence, 'bold');
  assert.equal(p.journeys[route.key].run.cursor, 0);
  assert.equal(p.journeys[route.key].first, null);
  p = next(p, 0);
  for (let i = 1; i < 6; i++) {
    p = answer(p, i, true, 'steady');
    if (i < 5) p = next(p, i);
  }
  p = readProfile(JSON.parse(JSON.stringify(p)));
  assert.equal(p.journeys[route.key].run.cursor, 5);
  assert.equal(p.journeys[route.key].run.answers.length, 6);
  assert.equal(p.journeys[route.key].first, null);
  assert.equal(expeditionStatus(p.journeys[route.key]), 'continue');
  p = next(p, 5);
  assert.equal(p.journeys[route.key].first.score, 9);
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
});
test('replay retains immutable first result and caps activity awards to distinct content', async () => {
  let p = finish(await begin(), false, 'bold');
  const first = p.journeys[route.key].first,
    points = passportSummary(p.passport).points;
  p = await begin(p, 'run-2');
  p = finish(p, true, 'bold', 'run-2');
  assert.deepEqual(p.journeys[route.key].first, first);
  assert.equal(p.journeys[route.key].best.score, 18);
  assert.equal(p.journeys[route.key].completions, 2);
  assert.equal(passportSummary(p.passport).points, points);
  assert.equal(p.journal.rounds.length, 12);
  assert.strictEqual(
    act(p, {
      type: 'journey-start',
      runId: 'run-3',
      cards: p.journeys[route.key].run.cards,
      previousRunId: 'run-1',
    }),
    p,
  );
});
test('independent routes resume without replacement; reset epoch rejects delayed work', async () => {
  let p = await begin();
  p = answer(p, 0);
  p = await begin(p, 'space-run', EXPEDITIONS[5]);
  assert.equal(Object.keys(p.journeys).length, 2);
  assert.equal(p.journeys[route.key].run.answers.length, 1);
  const oldEpoch = p.epoch,
    cards = p.journeys[route.key].run.cards;
  p = act(p, { type: 'reset', newEpoch: 'new-generation' });
  assert.deepEqual(p.journeys, {});
  assert.strictEqual(
    act(p, { type: 'journey-start', epoch: oldEpoch, runId: 'delayed', cards, previousRunId: null }),
    p,
  );
  assert.strictEqual(
    act(p, {
      type: 'journey-answer',
      epoch: oldEpoch,
      runId: 'run-1',
      index: 0,
      choice: 0,
      confidence: 'bold',
    }),
    p,
  );
});
test('older profiles migrate without invented history; malformed route snapshots are discarded', async () => {
  const old = emptyProfile();
  delete old.journeys;
  assert.deepEqual(readProfile(old).journeys, {});
  let p = await begin();
  const altered = JSON.parse(JSON.stringify(p));
  altered.journeys[route.key].run.cards[0].factId = 'q999';
  assert.deepEqual(readProfile(altered).journeys, {});
  const bad = JSON.parse(JSON.stringify(p));
  bad.journeys[route.key].run.cards[0].correctIndex = 9;
  assert.deepEqual(readProfile(bad).journeys, {});
  const copy = JSON.parse(JSON.stringify(p));
  copy.journeys['unknown:2'] = copy.journeys[route.key];
  assert.equal(Object.keys(readProfile(copy).journeys).length, 1);
});
test('corrupted completion summaries cannot invent impossible scores or contradictory earned screens', async () => {
  const p = finish(await begin(), true, 'bold');
  for (const tuple of [
    { score: 18, correct: 0, bold: 0 },
    { score: 1, correct: 1, bold: 0 },
    { score: -6, correct: 0, bold: 0 },
  ]) {
    const bad = JSON.parse(JSON.stringify(p));
    Object.assign(bad.journeys[route.key].first, tuple);
    assert.deepEqual(readProfile(bad).journeys, {});
  }
  const missing = JSON.parse(JSON.stringify(p));
  delete missing.journeys[route.key].first;
  assert.deepEqual(readProfile(missing).journeys, {});
  const wrongLast = JSON.parse(JSON.stringify(p));
  wrongLast.journeys[route.key].last.runId = 'other';
  const out = readProfile(wrongLast).journeys[route.key];
  assert.equal(out.run, null);
  assert.equal(out.first.score, 18);
  const corruptBest = JSON.parse(JSON.stringify(p));
  corruptBest.journeys[route.key].best.correct = 0;
  assert.equal(readProfile(corruptBest).journeys[route.key].best.correct, 6);
});
// ---------------------------------------------------------------------------------------------
// Betting: the three-tier table, the fold guard and correctness-first ordering (spec 1.3-1.5)
const TIERS = ['steady', 'bold', 'called'];
/** Every run the three-tier table can produce: 3^6 tier choices x 2^6 hit patterns. */
function everyRun(visit) {
  const cards = Array.from({ length: 6 }, () => ({ correctIndex: 0 }));
  for (let t = 0; t < 3 ** 6; t++) {
    for (let h = 0; h < 2 ** 6; h++) {
      const answers = Array.from({ length: 6 }, (_, i) => ({
        choice: (h >> i) & 1 ? 0 : 1,
        confidence: TIERS[Math.floor(t / 3 ** i) % 3],
      }));
      visit({ cards, answers });
    }
  }
}
test('the three-tier table lands exactly on the enumerated score bands and ties where EV ties', () => {
  // Spec 1.3, enumerated exhaustively rather than trusted: the 5/6 and 6/6 bands overlap by eight
  // points, which is the whole reason record.best orders by correctness (R3).
  const bands = Array.from({ length: 7 }, () => ({ min: Infinity, max: -Infinity }));
  everyRun((run) => {
    const r = runResult(run);
    const t = runTally(run);
    const band = bands[r.correct];
    band.min = Math.min(band.min, r.score);
    band.max = Math.max(band.max, r.score);
    // The tally is the only thing validResult can recompute a three-tier score from, so it has to
    // agree with runResult on every run the game can produce.
    assert.equal(
      2 * t.steady.correct +
        (3 * t.bold.correct - (t.bold.n - t.bold.correct)) +
        (4 * t.called.correct - 3 * (t.called.n - t.called.correct)),
      r.score,
    );
    assert.equal(t.steady.correct + t.bold.correct + t.called.correct, r.correct);
    assert.equal(t.bold.n, r.bold);
    assert.equal(t.steady.n + t.bold.n + t.called.n, 6);
  });
  assert.deepEqual(bands, [
    { min: -18, max: 0 },
    { min: -13, max: 4 },
    { min: -8, max: 8 },
    { min: -3, max: 12 },
    { min: 2, max: 16 },
    { min: 7, max: 20 },
    { min: 12, max: 24 },
  ]);
  assert.equal(Math.min(...bands.map((b) => b.min)), -18);
  assert.equal(Math.max(...bands.map((b) => b.max)), 24);
  // A proper scoring rule: Bold overtakes Steady at exactly p = 1/2 and Called overtakes Bold at 2/3.
  const ev = (tier, p) => CONFIDENCE[tier].correct * p + CONFIDENCE[tier].wrong * (1 - p);
  assert.equal(ev('steady', 1 / 2), ev('bold', 1 / 2));
  assert.equal(ev('bold', 2 / 3), ev('called', 2 / 3));
  assert.ok(ev('steady', 0.49) > ev('bold', 0.49));
  assert.ok(ev('bold', 0.51) > ev('steady', 0.51));
  assert.ok(ev('bold', 0.66) > ev('called', 0.66));
  assert.ok(ev('called', 0.67) > ev('bold', 0.67));
});
test('runTally counts every tier and leaves the run untouched', async () => {
  let p = await begin();
  for (const [i, tier] of ['steady', 'steady', 'bold', 'bold', 'called', 'called'].entries()) {
    p = answer(p, i, i % 2 === 0, tier);
    p = next(p, i);
  }
  const run = p.journeys[route.key].run;
  const snapshot = JSON.parse(JSON.stringify(run));
  assert.deepEqual(runTally(run), {
    steady: { n: 2, correct: 1 },
    bold: { n: 2, correct: 1 },
    called: { n: 2, correct: 1 },
  });
  assert.deepEqual(run, snapshot);
  assert.deepEqual(runTally({ cards: [], answers: [] }), {
    steady: { n: 0, correct: 0 },
    bold: { n: 0, correct: 0 },
    called: { n: 0, correct: 0 },
  });
});
test('Called scores the full -18..24 spread and the stored stakes must agree with it', async () => {
  const perfect = finish(await begin(), true, 'called');
  assert.equal(perfect.journeys[route.key].first.score, 24);
  assert.deepEqual(perfect.journeys[route.key].first.stakes, {
    steady: { n: 0, correct: 0 },
    bold: { n: 0, correct: 0 },
    called: { n: 6, correct: 6 },
  });
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(perfect))), perfect);
  const worst = finish(await begin(), false, 'called');
  assert.equal(worst.journeys[route.key].first.score, -18);
  assert.equal(worst.journeys[route.key].completions, 1);
  // A stakes block that disagrees by one card invalidates the whole result, never just the field.
  for (const mutate of [
    (s) => (s.called.correct -= 1),
    (s) => (s.called.n += 1),
    (s) => (s.steady.correct = 1),
    (s) => (s.called.correct = 'six'),
    (s) => delete s.bold,
  ]) {
    const bad = JSON.parse(JSON.stringify(perfect));
    mutate(bad.journeys[route.key].first.stakes);
    assert.deepEqual(readProfile(bad).journeys, {});
  }
});
test('legacy results with no stakes keep the shipped two-tier algebra and bounds', async () => {
  const p = finish(await begin(), true, 'bold'); // 6/6, all Bold, score 18 on both tables
  const legacy = () => {
    const copy = JSON.parse(JSON.stringify(p));
    for (const k of ['first', 'best', 'last']) delete copy.journeys[route.key][k].stakes;
    return copy;
  };
  const survived = readProfile(legacy()).journeys[route.key];
  assert.equal(survived.first.score, 18);
  assert.equal(survived.first.stakes, undefined);
  const over = legacy();
  for (const k of ['first', 'best', 'last']) over.journeys[route.key][k].score = 19;
  assert.deepEqual(readProfile(over).journeys, {});
  // Reachable under three tiers (4 Steady wrong + 1 Called correct + 1 Called wrong) but impossible
  // under the two-tier algebra a stakes-free record was written on.
  const impossible = legacy();
  Object.assign(impossible.journeys[route.key].first, { score: 1, correct: 1, bold: 0 });
  assert.deepEqual(readProfile(impossible).journeys, {});
});
test('record.best orders by correctness first, so a 5/6 never outranks a flawless 6/6 (R3)', async () => {
  let p = finish(await begin(), true, 'bold'); // 6/6 at 18
  assert.equal(p.journeys[route.key].best.score, 18);
  p = await begin(p, 'run-2');
  for (let i = 0; i < 6; i++) {
    p = answer(p, i, i < 5, i < 5 ? 'called' : 'steady', 'run-2'); // 5/6 at 20
    p = next(p, i, 'run-2');
  }
  assert.equal(p.journeys[route.key].last.score, 20);
  assert.equal(p.journeys[route.key].last.correct, 5);
  assert.equal(p.journeys[route.key].best.score, 18);
  assert.equal(p.journeys[route.key].best.correct, 6);
  // The loader picks the same winner from the raw record, not just the reducer.
  assert.equal(readProfile(JSON.parse(JSON.stringify(p))).journeys[route.key].best.score, 18);
  const nulled = JSON.parse(JSON.stringify(p));
  delete nulled.journeys[route.key].best;
  assert.equal(readProfile(nulled).journeys[route.key].best.correct, 6);
});
test('folding releases a route once a day, keeps what was resolved and settles nothing', async () => {
  const fold = (p, runId = 'run-1', at = 1000) =>
    act(p, { type: 'journey-fold', runId, at, routeId: route.id });
  let p = await begin();
  assert.strictEqual(fold(p), p); // nothing answered yet
  p = answer(p, 0, true, 'called');
  assert.strictEqual(fold(p, 'other-run'), p);
  assert.strictEqual(fold(p, 'run-1', NaN), p);
  const beforeFold = p;
  p = fold(p);
  assert.notStrictEqual(p, beforeFold);
  const folded = p.journeys[route.key];
  assert.equal(folded.folded, true);
  assert.equal(folded.foldedDay, dayKey(1000));
  assert.equal(folded.first, null);
  assert.equal(folded.last, null);
  assert.equal(folded.completions, 0);
  assert.equal(expeditionStatus(folded), 'new');
  // Resolved cards keep everything they earned; a fold is not a settlement.
  assert.equal(p.journal.rounds.length, 1);
  assert.equal(p.progression.counters.stamps, 0);
  assert.equal(p.progression.counters.expeditions, 0);
  assert.equal(p.progression.log.filter((e) => e.kind === 'expedition-complete').length, 0);
  assert.equal(p.progression.conviction.called.n, 1);
  assert.strictEqual(fold(p), p); // one fold per route per day
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
  // The released route accepts a fresh run, and that run must be resumable.
  p = await begin(p, 'run-2');
  assert.equal(p.journeys[route.key].folded, false);
  assert.equal(p.journeys[route.key].foldedDay, dayKey(1000));
  p = answer(p, 0, true, 'steady', 'run-2');
  p = next(p, 0, 'run-2');
  p = answer(p, 1, true, 'steady', 'run-2');
  assert.equal(expeditionStatus(p.journeys[route.key]), 'continue');
  assert.strictEqual(await begin(p, 'run-3'), p);
  assert.strictEqual(fold(p, 'run-2'), p); // still today's fold
  const tomorrow = fold(p, 'run-2', 1000 + 2 * 86400e3);
  assert.notStrictEqual(tomorrow, p);
  assert.equal(tomorrow.journeys[route.key].foldedDay, dayKey(1000 + 2 * 86400e3));
  // A completed run has nothing to fold.
  const done = finish(await begin(), true, 'steady');
  assert.strictEqual(fold(done), done);
});
