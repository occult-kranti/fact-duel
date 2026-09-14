/**
 * The fold guard — §1.4's honest exit, and the half of it the UI has to read.
 *
 * `tests/betting-audit.test.mjs` already pins that a folded run banks nothing and cannot be answered
 * on. What is pinned here is the other half, which shipped broken: folding is supposed to RELEASE the
 * route so a fresh run can start, and the record it leaves behind — `run` still present, `folded`
 * true — is the only thing that tells a screen which of the two states it is in. A container that
 * gates on `record.run` alone soft-locks the route for ever, so the shape of that record is a
 * contract, not an implementation detail.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPEDITIONS, expeditionStatus, readExpeditions } from '../lib/expeditions.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';

const route = EXPEDITIONS[0];
const DAY = 86_400_000;
const NOON = new Date(2026, 8, 13, 12, 0).getTime();

async function cards() {
  return (await dispatch(null, { action: 'expedition', routeId: route.id })).cards;
}

/** Start a run and answer `n` cards of it, leaving the run live at cursor `n`. */
function partial(p, runId, deck, n, at) {
  let clock = at;
  const act = (a) => (p = reduceProfile(p, { epoch: p.epoch, at: (clock += 1000), routeId: route.id, ...a }));
  act({
    type: 'journey-start',
    runId,
    cards: deck,
    previousRunId: p.journeys[route.key]?.run?.id ?? null,
  });
  for (let i = 0; i < n; i += 1) {
    const f = p.journeys[route.key].run.cards[i];
    act({ type: 'journey-answer', index: i, runId, choice: f.correctIndex, confidence: 'called' });
    act({ type: 'journey-next', index: i, runId });
  }
  return p;
}

test('folding releases the route: a fresh run starts where a partial run would have been refused', async () => {
  const deck = await cards();
  let p = partial(emptyProfile(), 'fold-1', deck, 3, NOON);

  // The refusal that closes the answer-one-card-and-restart farm, still in force before the fold.
  const refused = reduceProfile(p, {
    epoch: p.epoch,
    at: NOON + 10_000,
    routeId: route.id,
    type: 'journey-start',
    runId: 'fold-2',
    cards: deck,
    previousRunId: 'fold-1',
  });
  assert.strictEqual(refused, p, 'a partial run was silently replaced');

  p = reduceProfile(p, {
    epoch: p.epoch,
    at: NOON + 20_000,
    routeId: route.id,
    type: 'journey-fold',
    runId: 'fold-1',
  });
  assert.equal(p.journeys[route.key].folded, true);

  const restarted = reduceProfile(p, {
    epoch: p.epoch,
    at: NOON + 30_000,
    routeId: route.id,
    type: 'journey-start',
    runId: 'fold-2',
    cards: deck,
    previousRunId: 'fold-1',
  });
  assert.notStrictEqual(restarted, p, 'the fold did not release the route');
  assert.equal(restarted.journeys[route.key].run.id, 'fold-2');
  assert.equal(restarted.journeys[route.key].run.cursor, 0, 'the fresh run inherited the folded cursor');
  assert.equal(restarted.journeys[route.key].folded, false, 'the fresh run started already folded');
  // The day cap has to survive the restart, or fold-and-restart is itself the farm it closes.
  assert.equal(restarted.journeys[route.key].foldedDay, p.journeys[route.key].foldedDay);
});

test('a folded record keeps its run, so a screen that gates on `run` alone shows a dead run', async () => {
  const deck = await cards();
  let p = partial(emptyProfile(), 'fold-1', deck, 3, NOON);
  p = reduceProfile(p, {
    epoch: p.epoch,
    at: NOON + 20_000,
    routeId: route.id,
    type: 'journey-fold',
    runId: 'fold-1',
  });
  const record = p.journeys[route.key];

  // Both halves of the contract the expeditions container reads: the run survives so late dispatches
  // can be refused by id, and `folded` is the only flag that says the route is open again.
  assert.ok(record.run, 'the run was dropped, so a late dispatch has nothing to be refused against');
  assert.equal(record.run.cursor, 3);
  assert.equal(record.folded, true);
  // The atlas reads this: a folded route must not still be offering "continue", or the only control
  // that reaches `start()` never renders and the route is soft-locked.
  assert.notEqual(expeditionStatus(record), 'continue', 'a folded route still reports a run in progress');
  assert.equal(expeditionStatus(record), 'new');

  // And it survives a reload: a sanitised record cannot come back with `folded` quietly dropped.
  const reloaded = readProfile(JSON.parse(JSON.stringify(p))).journeys[route.key];
  assert.equal(reloaded.folded, true);
  assert.equal(reloaded.foldedDay, record.foldedDay);
  assert.equal(
    readExpeditions(undefined)[route.key]?.folded ?? false,
    false,
    'an empty record is not folded',
  );
});

test('one fold per route per local day, and the cap does not spill onto other routes', async () => {
  const deck = await cards();
  let p = partial(emptyProfile(), 'fold-1', deck, 2, NOON);
  p = reduceProfile(p, {
    epoch: p.epoch,
    at: NOON + 1000,
    routeId: route.id,
    type: 'journey-fold',
    runId: 'fold-1',
  });
  p = partial(p, 'fold-2', deck, 2, NOON + 2000);

  const again = reduceProfile(p, {
    epoch: p.epoch,
    at: NOON + 60_000,
    routeId: route.id,
    type: 'journey-fold',
    runId: 'fold-2',
  });
  assert.strictEqual(again, p, 'a second fold landed on the same local day');

  const tomorrow = reduceProfile(p, {
    epoch: p.epoch,
    at: NOON + DAY,
    routeId: route.id,
    type: 'journey-fold',
    runId: 'fold-2',
  });
  assert.equal(tomorrow.journeys[route.key].folded, true, 'the cap did not lift the next day');

  // A second route carries its own cap: folding one must not spend the other's.
  const other = EXPEDITIONS[1];
  let q = partial(emptyProfile(), 'a-1', deck, 2, NOON);
  q = reduceProfile(q, {
    epoch: q.epoch,
    at: NOON + 1000,
    routeId: route.id,
    type: 'journey-fold',
    runId: 'a-1',
  });
  const otherDeck = (await dispatch(null, { action: 'expedition', routeId: other.id })).cards;
  let clock = NOON + 2000;
  const act = (a) => (q = reduceProfile(q, { epoch: q.epoch, at: (clock += 1000), routeId: other.id, ...a }));
  act({ type: 'journey-start', runId: 'b-1', cards: otherDeck, previousRunId: null });
  const f = q.journeys[other.key].run.cards[0];
  act({ type: 'journey-answer', index: 0, runId: 'b-1', choice: f.correctIndex, confidence: 'steady' });
  act({ type: 'journey-next', index: 0, runId: 'b-1' });
  act({ type: 'journey-fold', runId: 'b-1' });
  assert.equal(q.journeys[other.key].folded, true, 'one route spent another route\u2019s fold');
});

test('there is nothing to fold before the first answer, and nothing to fold after the last', async () => {
  const deck = await cards();
  const started = partial(emptyProfile(), 'fold-1', deck, 0, NOON);
  assert.strictEqual(
    reduceProfile(started, {
      epoch: started.epoch,
      at: NOON + 1000,
      routeId: route.id,
      type: 'journey-fold',
      runId: 'fold-1',
    }),
    started,
    'a run with no answers was foldable, which is a free restart',
  );

  const done = partial(emptyProfile(), 'fold-1', deck, 6, NOON);
  assert.equal(done.journeys[route.key].completions, 1);
  assert.strictEqual(
    reduceProfile(done, {
      epoch: done.epoch,
      at: NOON + 1000,
      routeId: route.id,
      type: 'journey-fold',
      runId: 'fold-1',
    }),
    done,
    'a completed run was foldable',
  );
});
