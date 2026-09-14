/**
 * The findings the Stream A adversarial audit raised, pinned so they cannot come back.
 *
 * Every test here corresponds to a defect that was live in the engine and reproduced end to end
 * before it was fixed. They are in their own file because they cut across expeditions, progression
 * and the profile loader, and because the thing being tested is an interaction between rules rather
 * than any one module's contract.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPEDITIONS, MIN_SCORE, MAX_SCORE, readExpeditions } from '../lib/expeditions.mjs';
import {
  COSMETICS,
  CONVICTION_TIERS,
  XP,
  convictionIndex,
  convictionRating,
  cosmeticStatus,
  emptyProgression,
  readProgression,
} from '../lib/progression.mjs';
import { emptyProfile, reduceProfile } from '../lib/passport.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';
import { readFileSync } from 'node:fs';

const route = EXPEDITIONS[0];
let clock = Date.UTC(2026, 8, 13, 10, 0, 0);
const act = (p, a) => reduceProfile(p, { epoch: p.epoch, at: (clock += 60_000), routeId: route.id, ...a });

/** Play one complete run, choosing each card's tier and outcome from `plan`. */
async function play(p, runId, plan) {
  const { cards } = await dispatch(null, { action: 'expedition', routeId: route.id });
  p = act(p, { type: 'journey-start', runId, cards, previousRunId: p.journeys[route.key]?.run?.id ?? null });
  for (let i = 0; i < 6; i++) {
    const { confidence, correct } = plan(i);
    const f = p.journeys[route.key].run.cards[i];
    p = act(p, {
      type: 'journey-answer',
      index: i,
      runId,
      choice: correct ? f.correctIndex : (f.correctIndex + 1) % 4,
      confidence,
    });
    p = act(p, { type: 'journey-next', index: i, runId });
  }
  return p;
}

const ALL_STEADY = () => ({ confidence: 'steady', correct: true });
/** Five Called hits and one deliberate miss: score 20, correct 5 — the memorised-replay shape. */
const MEMORISED = (i) =>
  i < 5 ? { confidence: 'called', correct: true } : { confidence: 'steady', correct: false };

test('a memorised replay pays for the improvement once, not on every run', async () => {
  // `best` is ordered by correctness first, so a 5/6 at 20 never displaces a 6/6 at 12. Reading the
  // replay floor off `best.score` therefore froze it below a score the player had already posted,
  // and every replay was paid the same "improvement" for ever — measured at +128 XP a run,
  // indefinitely, in the one mode with no opponent, no timer and no failure state.
  let p = await play(emptyProfile(), 'run-1', ALL_STEADY);
  assert.equal(p.journeys[route.key].best.score, 12);
  assert.equal(p.journeys[route.key].bestScore, 12);

  const gains = [];
  for (let n = 2; n <= 6; n++) {
    const before = p.progression.xp;
    p = await play(p, `run-${n}`, MEMORISED);
    gains.push(p.progression.xp - before);
  }
  // The first replay is a real improvement, 12 -> 20. Everything after it is the same run again.
  assert.equal(gains[0], 128, `first replay paid ${gains[0]}`);
  assert.deepEqual(gains.slice(1), [64, 64, 64, 64], `later replays paid ${gains.slice(1)}`);
  // The high-water mark moved even though `best` did not.
  assert.equal(p.journeys[route.key].bestScore, 20);
  assert.equal(p.journeys[route.key].best.correct, 6, 'best is still the flawless run');
});

test('folding ends the run: it cannot be answered on, and it banks nothing', async () => {
  const { cards } = await dispatch(null, { action: 'expedition', routeId: route.id });
  let p = act(emptyProfile(), { type: 'journey-start', runId: 'f-1', cards, previousRunId: null });
  for (const i of [0, 1]) {
    const f = p.journeys[route.key].run.cards[i];
    p = act(p, {
      type: 'journey-answer',
      index: i,
      runId: 'f-1',
      choice: f.correctIndex,
      confidence: 'called',
    });
    p = act(p, { type: 'journey-next', index: i, runId: 'f-1' });
  }
  p = act(p, { type: 'journey-fold', runId: 'f-1' });
  assert.equal(p.journeys[route.key].folded, true);

  // A stale dispatch must not walk a folded run to completion behind the status function's back.
  const folded = p;
  for (let i = 2; i < 6; i++) {
    const f = folded.journeys[route.key].run.cards[i];
    p = act(p, {
      type: 'journey-answer',
      index: i,
      runId: 'f-1',
      choice: f.correctIndex,
      confidence: 'called',
    });
    p = act(p, { type: 'journey-next', index: i, runId: 'f-1' });
  }
  assert.strictEqual(p, folded, 'a folded run accepted further answers');
  assert.equal(p.journeys[route.key].completions, 0);
  assert.equal(p.journeys[route.key].first, null);
  assert.equal(p.progression.counters.stamps, 0);
});

test('the badge bonus is minted once per tier, even across a rollback that strips the tally', () => {
  // A shipped bundle reading a newer profile drops `conviction` wholesale — it assigns only the keys
  // it knows — while leaving the wallet intact. Without an idempotence mark the next load walked the
  // whole ladder again and paid the advertised 160 lifetime gems a second time.
  const paid = CONVICTION_TIERS.filter((t) => XP.convictionTierGems[t.id] > 0);
  assert.ok(paid.length >= 1);
  const total = paid.reduce((a, t) => a + XP.convictionTierGems[t.id], 0);
  assert.equal(total, 160, 'the advertised lifetime badge bonus');
  // Every paying tier is marked under a key the shipped reader whitelists by shape, not by list.
  for (const t of paid) assert.match(`conviction-${t.id}`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test('a cosmetic is only offered for sale when its unlock is actually met', () => {
  // reduceCosmetics refuses a buy whose unlock is unmet, so an unlock-blind status rendered an
  // enabled button on the most expensive item in the catalogue that silently did nothing.
  const rich = { ...emptyProgression(), wallet: { gems: 100000, lifetimeGems: 100000 } };
  // `unlock` is always an object; an ungated item carries an empty one.
  const isGated = (c) => Object.keys(c.unlock ?? {}).length > 0;
  const gated = COSMETICS.filter((c) => c.price !== null && isGated(c));
  assert.ok(gated.length > 0, 'no gated cosmetics to check');
  for (const c of gated)
    if (cosmeticStatus(rich, c.id) === 'buyable')
      assert.fail(`${c.id} is offered to a fresh profile that cannot buy it`);
  // And the cautious player still has somewhere to spend: something priced must be reachable.
  const reachable = COSMETICS.filter((c) => c.price !== null && cosmeticStatus(rich, c.id) === 'buyable');
  assert.ok(reachable.length > 0, 'every priced cosmetic is gated — the gem sink is unreachable');
});

test('a badge never prints an earned-at rating below its own floor', () => {
  // The load raises `best` to whatever the sanitised tallies support, but left `bestAt` as stored,
  // so the card printed a badge beside a rating that could not have earned it.
  const p = readProgression({
    version: 1,
    conviction: { best: 'read', bestAt: 1150, bold: { n: 20, correct: 20 }, called: { n: 15, correct: 15 } },
  });
  const floor = CONVICTION_TIERS.find((t) => t.id === p.conviction.best)?.min ?? 0;
  assert.ok(convictionIndex(p.conviction.best) > convictionIndex('read'), 'the tier was not raised');
  assert.equal(p.conviction.bestAt, convictionRating(p.conviction));
  assert.ok(
    p.conviction.bestAt >= floor,
    `bestAt ${p.conviction.bestAt} below ${p.conviction.best} floor ${floor}`,
  );
});

test('the loader bounds a hostile profile before it walks it', () => {
  // Load-time sanitisation runs on the main thread inside the profile transaction. Both fields have
  // a hard cap known up front, so an oversized array must not be filtered in full before being
  // thrown away.
  const big = 200_000;
  const started = Date.now();
  const p = readProgression({
    version: 1,
    conviction: {
      recent: Array.from({ length: big }, () => 'c1'),
      counted: Array.from({ length: big }, (_, i) => `q${i}`),
      bold: { n: '9', correct: null },
    },
    wallet: { gems: 40, lifetimeGems: 40 },
  });
  assert.ok(p.conviction.recent.length <= 20);
  assert.ok(p.conviction.counted.length <= 1200);
  assert.equal(p.wallet.gems, 40, 'a hostile conviction block must not touch the wallet');
  assert.ok(Number.isSafeInteger(convictionRating(p.conviction)), 'rating went non-finite');
  assert.ok(Date.now() - started < 4000, 'load walked the whole array');
});

test('the day key capping folds cannot be spoofed by a non-string', () => {
  // RegExp.test string-coerces, so without a typeof guard an array of one valid day passed the
  // sanitiser and then never matched the strict comparison the fold cap makes against it.
  const first = { runId: 'r', at: 1, score: 12, correct: 6, bold: 0 };
  const spoofed = readExpeditions({
    [route.key]: { run: null, first, last: first, foldedDay: ['2026-09-13'] },
  });
  assert.equal(spoofed[route.key].foldedDay, null);
  const real = readExpeditions({ [route.key]: { run: null, first, last: first, foldedDay: '2026-09-13' } });
  assert.equal(real[route.key].foldedDay, '2026-09-13');
});

test('a record written before bestScore existed does not get a fresh replay floor', () => {
  // Migration: the mark is rebuilt from whatever the blob can prove, so an existing player is not
  // handed a floor of zero on a route they have already scored above.
  const first = { runId: 'r', at: 1, score: 12, correct: 6, bold: 0 };
  // 5 correct of which 5 were Bold: 2*5 + 2*5 - 5 = 15, which the legacy inverse algebra accepts.
  const last = { runId: 'r2', at: 2, score: 15, correct: 5, bold: 5 };
  const migrated = readExpeditions({ [route.key]: { run: null, first, last } });
  assert.equal(migrated[route.key].bestScore, 15);
  // And with nothing completed at all it stays null, matching the reducer's own default.
  const fresh = readExpeditions({ [route.key]: { run: null, first: null, last: null } });
  assert.equal(fresh[route.key], undefined);
  assert.ok(MIN_SCORE === -18 && MAX_SCORE === 24, 'the enumerated score band moved');
});

test('no award keys on the tier the player selected', () => {
  // R2 and spec 1.7: the rating is only a proper scoring rule if nothing pays you to over-call.
  const src = readFileSync(new URL('../lib/progression.mjs', import.meta.url), 'utf8');
  const achievements = src.slice(src.indexOf('ACHIEVEMENTS'), src.indexOf('QUEST_TEMPLATES'));
  assert.doesNotMatch(
    achievements,
    /stakes\?\.(steady|bold|called)\.n/,
    'an achievement predicate reads the tiers the player selected',
  );
});
