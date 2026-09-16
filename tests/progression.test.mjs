import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  emptyProgression,
  DEFAULT_COSMETICS,
  readProgression,
  levelForXp,
  xpToNext,
  xpForLevel,
  LEVEL_TITLES,
  comboMultiplier,
  dayKey,
  dayDiff,
  dailyQuests,
  QUEST_TEMPLATES,
  LOG_KINDS,
  ACHIEVEMENTS,
  COSMETICS,
  RANK_TIERS,
  rankForPoints,
  wildRound,
  fnv1a32,
  deriveEvents,
  reduceProgression,
  reduceCosmetics,
  canEquip,
  cosmeticStatus,
  progressionDiff,
  unlockMet,
  PROGRESSION_VERSION,
  CONVICTION_TIERS,
  CONVICTION_WINDOW,
  CONVICTION_MIN_CARDS,
  CONVICTION_MIN_CALLS,
  convictionPoints,
  convictionCalls,
  convictionRiskCalls,
  convictionRiskLanded,
  convictionRating,
  convictionTier,
  XP,
} from '../lib/progression.mjs';
import {
  emptyProfile,
  readProfile,
  reduceProfile,
  applyPractice,
  passportSummary,
} from '../lib/passport.mjs';
import { readJournal, recordRoom } from '../lib/journal.mjs';
import { EXPEDITIONS, CONFIDENCE } from '../lib/expeditions.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';
// Local-time timestamps keep dayKey() stable in any timezone.
const T = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const DAY1 = T(2026, 1, 5),
  DAY2 = T(2026, 1, 6);
const fact = (id = 'q001', extra = {}) => ({
  factId: id,
  question: `Question ${id}?`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Original explanation.',
  topic: 'Space',
  subtopic: 'Missions',
  sourceUrl: 'https://example.org/source',
  sourceLabel: 'Primary source',
  ...extra,
});
const room = (id = 'match-1', f = fact(), phase = 'complete', extra = {}) => ({
  id,
  createdAt: 1000,
  phase,
  seat: 0,
  roundIndex: 0,
  config: { mode: 'quick', topic: 'all' },
  players: [{ kind: 'human' }, { kind: 'bot' }],
  scores: [1, 0],
  winner: 0,
  round: {
    id: `${id}:0`,
    result: phase === 'playing' ? null : { winner: 0 },
    question: f,
    receipts: [{ correct: true, elapsedMs: 1200 }, null],
  },
  ...extra,
});
// A multi-round match: `rounds` is a list of { correct, elapsedMs?, winner?, difficulty? } in order.
function multi(id, mode, rounds, { scores, winner = 0, human = false, topic = 'all' } = {}) {
  const completed = rounds.map((r, i) => ({
    id: `${id}:${i}`,
    index: i,
    question: fact(`${id}-q${i}`, r.difficulty ? { difficulty: r.difficulty } : {}),
    result: { winner: r.winner ?? (r.correct ? 0 : 1) },
    receipts: [
      { correct: r.correct, elapsedMs: r.elapsedMs ?? 5000 },
      { correct: !r.correct, elapsedMs: 5000 },
    ],
  }));
  const last = completed[completed.length - 1];
  return {
    ...room(id),
    roundIndex: completed.length - 1,
    config: { mode, topic },
    players: [{ kind: 'human' }, { kind: human ? 'human' : 'bot' }],
    scores: scores ?? [rounds.filter((r) => r.correct).length, rounds.filter((r) => !r.correct).length],
    winner,
    round: { ...last },
    completedRounds: completed,
  };
}
const act = (p, a) => reduceProfile(p, { epoch: p.epoch, at: DAY1, ...a });
const logXp = (prog, kind) => prog.log.filter((e) => e.kind === kind).reduce((n, e) => n + e.xp, 0);
const totalLogXp = (prog) => prog.log.reduce((n, e) => n + e.xp, 0);
const roundXp = (prog) =>
  prog.log
    .filter((e) => e.kind === 'round')
    .map((e) => e.xp)
    .reverse();
const wildFor = (ids) => ids.map(wildRound);
test('level curve is monotonic, boundaries land on whole levels and bands map to titles', () => {
  assert.equal(xpToNext(1), 80);
  assert.equal(xpToNext(2), 234);
  for (let l = 1; l < 60; l++) assert.ok(xpToNext(l + 1) > xpToNext(l));
  assert.deepEqual(levelForXp(0), { level: 1, into: 0, toNext: 80, progress: 0, title: 'Rookie', band: 0 });
  assert.equal(levelForXp(79).level, 1);
  assert.equal(levelForXp(80).level, 2);
  assert.equal(levelForXp(80).into, 0);
  assert.equal(levelForXp(313).level, 2);
  assert.equal(levelForXp(314).level, 3);
  assert.equal(xpForLevel(3), 314);
  for (const level of [5, 10, 15, 20, 25, 30, 35, 40, 57])
    assert.equal(levelForXp(xpForLevel(level)).title, LEVEL_TITLES[Math.min(8, Math.floor(level / 5))]);
  assert.equal(levelForXp(xpForLevel(4)).title, 'Rookie');
  assert.equal(levelForXp(xpForLevel(5)).title, 'Contender');
  assert.equal(levelForXp(xpForLevel(40)).title, 'Legend');
  assert.equal(LEVEL_TITLES.length, 9);
  assert.equal(levelForXp(-5).level, 1);
  assert.equal(levelForXp(NaN).level, 1);
});
test('combo multipliers, day keys and wild rounds are pure and deterministic', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map(comboMultiplier), [1, 1, 1.25, 1.5, 1.75, 2, 2]);
  assert.equal(dayKey(T(2026, 3, 7, 0)), '2026-03-07');
  assert.equal(dayKey(T(2026, 12, 31, 23)), '2026-12-31');
  assert.equal(dayDiff('2026-01-31', '2026-02-01'), 1);
  assert.equal(dayDiff('2026-03-01', '2026-04-01'), 31);
  assert.equal(dayDiff('2026-02-02', '2026-02-01'), -1);
  assert.equal(wildRound('abc'), wildRound('abc'));
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(wildRound(`room:${i}`));
  assert.deepEqual([...seen].sort(), [1, 2, 3]);
  const id = 'x';
  const h = fnv1a32(id);
  assert.equal(wildRound(id), h % 36 === 1 ? 3 : h % 6 === 0 ? 2 : 1);
});
test('readProgression sanitizes garbage, clamps, whitelists ids and default-fills', () => {
  assert.deepEqual(readProgression(null), emptyProgression());
  assert.deepEqual(readProgression({ version: 7, xp: 900 }), emptyProgression());
  assert.deepEqual(readProgression({ version: 0, xp: 900 }), emptyProgression());
  assert.equal(PROGRESSION_VERSION, 2);
  // A version 1 record (the last one with a wallet) is read and migrated; see the migration test.
  const p = readProgression({
    version: 1,
    xp: -20,
    counters: {
      rounds: 3.5,
      correct: 'many',
      bogus: 1,
      byTopic: { Space: { rounds: 2, correct: 9 }, Nope: { rounds: 1 } },
    },
    streak: { current: 4, best: 1, lastDay: 'yesterday', shields: 9, frozenDays: -1 },
    achievements: { 'first-win': 5, fake: 1, 'wins-10': 'x' },
    quests: {
      day: '2026-01-05',
      seed: 's',
      items: [
        { id: 'a', template: 'answer-3', progress: 99 },
        { id: 'b', template: 'nope', progress: 1 },
        { id: 'c', template: 'topic-play', topic: 'Mars' },
        { id: 'd', template: 'mode-play', mode: 'trilogy', done: true },
        { id: 'e', template: 'open-2' },
      ],
    },
    rank: { points: 120, tier: 'diamond', best: 'gold', floor: 4 },
    wallet: { gems: 40, lifetimeGems: 3 },
    cosmetics: {
      owned: ['default', 'coral', 'coral', 'nope'],
      equipped: { frame: 'gold-laurel', accent: 'coral', title: 'coral' },
    },
    log: [
      { id: 'l1', at: 1, kind: 'round', xp: 5, label: 'ok', gems: 0, meta: { a: 1, nested: {}, list: [] } },
      { id: 'l2', at: 1, kind: 'bad', xp: 5, label: 'x' },
      null,
    ],
    extra: true,
  });
  assert.equal(p.xp, 0);
  assert.equal(p.counters.rounds, 0);
  assert.equal(p.counters.correct, 0);
  assert.ok(!('bogus' in p.counters));
  assert.deepEqual(p.counters.byTopic.Space, { rounds: 2, correct: 2 });
  assert.ok(!('Nope' in p.counters.byTopic));
  assert.deepEqual(p.streak, { current: 0, best: 1, lastDay: null, shields: 2, frozenDays: 0 });
  assert.deepEqual(p.achievements, { 'first-win': 5 });
  assert.deepEqual(
    p.quests.items.map((i) => [i.template, i.progress, i.done]),
    [
      ['answer-3', 3, false],
      ['mode-play', 1, true],
      ['open-2', 0, false],
    ],
  );
  assert.equal(p.quests.items[1].label, 'Play Triple Threat');
  assert.deepEqual(p.rank, { points: 250, tier: 'gold', best: 'gold', floor: 250 });
  assert.equal(p.version, 2);
  assert.ok(!('wallet' in p));
  assert.deepEqual(p.cosmetics.owned, ['coral']);
  assert.deepEqual(p.cosmetics.equipped, {
    frame: 'default',
    title: 'challenger',
    banner: 'midnight',
    accent: 'coral',
  });
  assert.deepEqual(p.log, [{ id: 'l1', at: 1, kind: 'round', xp: 5, label: 'ok', meta: { a: 1 } }]);
  assert.ok(!('extra' in p));
});
test('readProgression round-trips a populated state through JSON', () => {
  let p = act(emptyProfile(), {
    type: 'room',
    room: multi('g1', 'gauntlet', Array(5).fill({ correct: true })),
  });
  p = act(p, { type: 'open', roundId: 'g1:0' });
  p = act(p, { type: 'save', question: 'Question g1-q0?' });
  // Nothing is for sale any more: the old action is a no-op on the profile too.
  assert.strictEqual(act(p, { type: 'cosmetic-buy', id: 'coral' }), p);
  assert.ok(p.progression.cosmetics.owned.includes('coral'), 'level 3 owns coral automatically');
  p = act(p, { type: 'cosmetic-equip', id: 'coral' });
  const prog = p.progression;
  assert.equal(prog.cosmetics.equipped.accent, 'coral');
  assert.ok(prog.log.length > 5);
  assert.ok(Object.keys(prog.achievements).length >= 3);
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(prog))), prog);
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
});
test('no-op identity: empty events, same-day visits and unrelated actions return the same reference', () => {
  const prog = emptyProgression();
  assert.strictEqual(reduceProgression(prog, [], DAY1), prog);
  const visited = reduceProgression(prog, [{ kind: 'visit' }], DAY1);
  assert.notStrictEqual(visited, prog);
  assert.equal(visited.streak.current, 1);
  assert.equal(visited.quests.day, '2026-01-05');
  assert.strictEqual(reduceProgression(visited, [{ kind: 'visit' }], DAY1 + 3600e3), visited);
  let p = act(emptyProfile(), { type: 'visit' });
  assert.strictEqual(act(p, { type: 'visit' }), p);
  assert.strictEqual(act(p, { type: 'skin', skin: 'classic' }), p);
  assert.strictEqual(act(p, { type: 'open', roundId: 'missing' }), p);
  p = act(p, { type: 'room', room: room() });
  assert.strictEqual(act(p, { type: 'save', question: 'nope' }), p);
});
test('a quick duel awards round, fact, match and streak XP exactly once across repeated snapshots', () => {
  const before = emptyProfile();
  const p = act(before, { type: 'room', room: room() });
  const prog = p.progression;
  const wild = wildRound('match-1:0');
  assert.equal(logXp(prog, 'round'), (20 + 15) * wild);
  assert.equal(logXp(prog, 'fact'), 10);
  assert.equal(logXp(prog, 'match'), 50);
  assert.equal(logXp(prog, 'streak'), 10);
  assert.equal(prog.xp, totalLogXp(prog));
  assert.equal(prog.counters.rounds, 1);
  assert.equal(prog.counters.correct, 1);
  assert.equal(prog.counters.matches, 1);
  assert.equal(prog.counters.wins, 1);
  assert.equal(prog.counters.facts, 1);
  assert.equal(prog.counters.fastestCorrectMs, 1200);
  assert.deepEqual(prog.counters.byTopic.Space, { rounds: 1, correct: 1 });
  assert.deepEqual(prog.counters.byMode.quick, { played: 1, wins: 1 });
  assert.ok(prog.achievements['first-duel']);
  assert.ok(prog.achievements['first-win']);
  assert.ok(prog.achievements['speed-demon']);
  assert.strictEqual(act(p, { type: 'room', room: room() }), p);
  assert.strictEqual(act(p, { type: 'room', room: { ...room(), revision: 99 } }), p);
  const diff = progressionDiff(before.progression, prog);
  assert.equal(diff.xpGained, prog.xp);
  assert.ok(diff.newAchievements.includes('first-win'));
  assert.equal(diff.streakChanged, true);
  assert.equal(diff.logEntries.length, prog.log.length);
  assert.equal(diff.leveledUp?.from, 1);
  assert.deepEqual(progressionDiff(prog, prog), {
    xpGained: 0,
    leveledUp: null,
    newAchievements: [],
    questsCompleted: [],
    streakChanged: false,
    rankUp: null,
    convictionUp: null,
    logEntries: [],
  });
});
test('polling the same match through between and complete phases never double-awards a round', () => {
  const between = room('poll', fact(), 'between', { winner: null, scores: [1, 0] });
  let p = act(emptyProfile(), { type: 'room', room: between });
  assert.equal(p.progression.counters.rounds, 1);
  assert.equal(p.progression.counters.matches, 0);
  assert.strictEqual(act(p, { type: 'room', room: { ...between, revision: 2 } }), p);
  const complete = { ...room('poll'), completedRounds: [{ ...between.round, index: 0 }] };
  const done = act(p, { type: 'room', room: complete });
  assert.equal(done.progression.counters.rounds, 1);
  assert.equal(done.progression.counters.matches, 1);
  assert.equal(
    done.progression.xp - p.progression.xp,
    50 + ACHIEVEMENTS.find((a) => a.id === 'first-duel').xp + achievementXpFor(done, p),
  );
  assert.strictEqual(act(done, { type: 'room', room: complete }), done);
  assert.strictEqual(act(done, { type: 'room', room: { ...complete, revision: 5 } }), done);
});
function achievementXpFor(after, before) {
  return (
    Object.keys(after.progression.achievements)
      .filter((id) => !before.progression.achievements[id] && id !== 'first-duel')
      .reduce((n, id) => n + ACHIEVEMENTS.find((a) => a.id === id).xp, 0) + questXpFor(after, before)
  );
}
function questXpFor(after, before) {
  const seen = new Set(before.progression.quests.items.filter((i) => i.done).map((i) => i.id));
  const done = after.progression.quests.items.filter((i) => i.done && !seen.has(i.id));
  const all =
    after.progression.quests.items.every((i) => i.done) &&
    !before.progression.quests.items.every((i) => i.done);
  return done.reduce((n, i) => n + i.xp, 0) + (all ? XP.questBonus : 0);
}
test('combo multipliers come from completedRounds order and a perfect gauntlet pays its bonus', () => {
  const match = multi('g1', 'gauntlet', Array(5).fill({ correct: true }));
  const p = act(emptyProfile(), { type: 'room', room: match });
  const prog = p.progression;
  const wild = wildFor(['g1:0', 'g1:1', 'g1:2', 'g1:3', 'g1:4']);
  assert.deepEqual(
    roundXp(prog),
    [20, 25, 30, 35, 40].map((x, i) => x * wild[i]),
  );
  assert.equal(prog.counters.bestCombo, 5);
  assert.equal(prog.counters.perfectGauntlets, 1);
  assert.equal(logXp(prog, 'match'), 120 + 100);
  assert.ok(prog.achievements['combo-3']);
  assert.ok(prog.achievements['combo-5']);
  assert.ok(prog.achievements['perfect-gauntlet']);
  assert.ok(!prog.achievements['speed-demon']);
  assert.equal(prog.counters.fastestCorrectMs, 5000);
  const broken = multi('g2', 'gauntlet', [
    { correct: true },
    { correct: true },
    { correct: false },
    { correct: true },
    { correct: true },
  ]);
  const q = act(p, { type: 'room', room: broken });
  const wild2 = wildFor(['g2:0', 'g2:1', 'g2:2', 'g2:3', 'g2:4']);
  assert.deepEqual(
    roundXp(q.progression).slice(-5),
    [20, 25, 5, 20, 25].map((x, i) => x * wild2[i]),
  );
  assert.equal(q.progression.counters.perfectGauntlets, 1);
  assert.equal(q.progression.counters.bestCombo, 5);
});
test('speed, difficulty and human multipliers round to whole XP and wrong answers still pay 5', () => {
  const cases = [
    [{ correct: true, elapsedMs: 1999 }, 35],
    [{ correct: true, elapsedMs: 2000 }, 28],
    [{ correct: true, elapsedMs: 3999 }, 28],
    [{ correct: true, elapsedMs: 4000 }, 20],
    [{ correct: false, elapsedMs: 900 }, 5],
    [{ correct: true, elapsedMs: 1000, difficulty: 'expert' }, Math.round(35 * 1.3)],
    [{ correct: true, elapsedMs: 1000, difficulty: 'extreme' }, 56],
    [{ correct: false, elapsedMs: 1000, difficulty: 'extreme' }, 8],
  ];
  cases.forEach(([r, expected], i) => {
    const id = `speed-${i}`;
    const p = act(emptyProfile(), {
      type: 'room',
      room: multi(id, 'quick', [r], { scores: [1, 0], winner: r.correct ? 0 : 1 }),
    });
    assert.equal(logXp(p.progression, 'round'), expected * wildRound(`${id}:0`), JSON.stringify(r));
  });
  const human = act(emptyProfile(), {
    type: 'room',
    room: multi('h1', 'quick', [{ correct: true, elapsedMs: 5000 }], { human: true }),
  });
  assert.equal(logXp(human.progression, 'round'), 30 * wildRound('h1:0'));
  assert.equal(logXp(human.progression, 'match'), 75);
  assert.equal(human.progression.counters.humanMatches, 1);
  assert.ok(human.progression.achievements['friend-rival']);
});
test('match outcomes: losses, draws, trilogy wins, comebacks and mode tour', () => {
  const loss = act(emptyProfile(), {
    type: 'room',
    room: multi('l1', 'quick', [{ correct: false }], { winner: 1, scores: [0, 1] }),
  });
  assert.equal(logXp(loss.progression, 'match'), 15);
  assert.equal(loss.progression.counters.losses, 1);
  const draw = act(emptyProfile(), {
    type: 'room',
    room: multi('d1', 'quick', [{ correct: false }], { winner: null, scores: [0, 0] }),
  });
  assert.equal(logXp(draw.progression, 'match'), 25);
  assert.equal(draw.progression.counters.draws, 1);
  const comeback = multi('t1', 'trilogy', [{ correct: false }, { correct: true }, { correct: true }], {
    scores: [2, 1],
  });
  let p = act(emptyProfile(), { type: 'room', room: comeback });
  assert.equal(logXp(p.progression, 'match'), 80);
  assert.ok(p.progression.achievements.comeback);
  assert.ok(!p.progression.achievements['mode-tour']);
  p = act(p, { type: 'room', room: multi('t2', 'quick', [{ correct: true }]) });
  p = act(p, {
    type: 'room',
    room: multi('t3', 'gauntlet', Array(5).fill({ correct: false }), { winner: 1, scores: [0, 5] }),
  });
  assert.ok(p.progression.achievements['mode-tour']);
  assert.deepEqual(p.progression.counters.byMode, {
    quick: { played: 1, wins: 1 },
    trilogy: { played: 1, wins: 1 },
    gauntlet: { played: 1, wins: 0 },
  });
  assert.equal(p.progression.counters.matches, 3);
});
test('wild rounds multiply the round XP and are announced in the log label', () => {
  let two = null,
    three = null;
  for (let i = 0; i < 5000 && !(two && three); i++) {
    const id = `wild-${i}`;
    if (!two && wildRound(`${id}:0`) === 2) two = id;
    if (!three && wildRound(`${id}:0`) === 3) three = id;
  }
  assert.ok(two && three);
  const p2 = act(emptyProfile(), {
    type: 'room',
    room: multi(two, 'quick', [{ correct: true, elapsedMs: 5000 }]),
  });
  assert.equal(logXp(p2.progression, 'round'), 40);
  assert.match(p2.progression.log.find((e) => e.kind === 'round').label, /Wild round x2/);
  const p3 = act(emptyProfile(), {
    type: 'room',
    room: multi(three, 'quick', [{ correct: true, elapsedMs: 5000 }]),
  });
  assert.equal(logXp(p3.progression, 'round'), 60);
  const events = deriveEvents(emptyProfile(), p3, {
    type: 'room',
    room: multi(three, 'quick', [{ correct: true }]),
    at: DAY1,
  });
  assert.equal(events.find((e) => e.kind === 'round').wild, 3);
});
test('arena rank: points per outcome, promotions, floor protection and exactly-once', () => {
  assert.deepEqual(
    RANK_TIERS.map((t) => [t.id, t.min]),
    [
      ['bronze', 0],
      ['silver', 100],
      ['gold', 250],
      ['platinum', 500],
      ['diamond', 900],
    ],
  );
  assert.deepEqual(rankForPoints(120), {
    tier: 'silver',
    label: 'Silver',
    into: 20,
    toNext: 150,
    progress: 20 / 150,
  });
  assert.equal(rankForPoints(950).progress, 1);
  const win = (id, mode, human = false) => ({
    type: 'room',
    room: multi(id, mode, [{ correct: true }], { human }),
  });
  let p = act(emptyProfile(), win('r1', 'quick'));
  assert.equal(p.progression.rank.points, 20);
  p = act(p, win('r2', 'trilogy'));
  p = act(p, win('r3', 'gauntlet', true));
  assert.equal(p.progression.rank.points, 20 + 30 + 60);
  assert.deepEqual(p.progression.rank, { points: 110, tier: 'silver', best: 'silver', floor: 100 });
  assert.equal(p.progression.log.filter((e) => e.kind === 'rank').length, 1);
  assert.equal(progressionDiff(emptyProgression(), p.progression).rankUp?.to, 'silver');
  const lose = (id) => ({
    type: 'room',
    room: multi(id, 'quick', [{ correct: false }], { winner: 1, scores: [0, 1] }),
  });
  p = act(p, lose('r4'));
  assert.equal(p.progression.rank.points, 100);
  const floored = act(p, lose('r5'));
  assert.equal(floored.progression.rank.points, 100);
  assert.equal(floored.progression.rank.tier, 'silver');
  assert.strictEqual(act(floored, lose('r5')), floored);
  const drawn = act(floored, {
    type: 'room',
    room: multi('r6', 'quick', [{ correct: false }], { winner: null, scores: [0, 0] }),
  });
  assert.equal(drawn.progression.rank.points, 105);
  assert.equal(progressionDiff(p.progression, drawn.progression).rankUp, null);
});
test('expeditions: per-card XP, completion bonus, stamp paid once, and no double-run of the practice hook', async () => {
  const route = EXPEDITIONS[0];
  const { cards } = await dispatch(null, { action: 'expedition', routeId: route.id });
  assert.ok(['simple', 'expert', 'extreme'].includes(cards[0].difficulty));
  const start = (p, runId) =>
    act(p, {
      type: 'journey-start',
      routeId: route.id,
      runId,
      cards,
      previousRunId: p.journeys[route.key]?.run?.id ?? null,
    });
  const answer = (p, i, correct, confidence, runId) =>
    act(p, {
      type: 'journey-answer',
      routeId: route.id,
      runId,
      index: i,
      choice: correct ? cards[i].correctIndex : (cards[i].correctIndex + 1) % 4,
      confidence,
    });
  const next = (p, i, runId) => act(p, { type: 'journey-next', routeId: route.id, runId, index: i });
  let p = start(emptyProfile(), 'run-1');
  assert.equal(p.progression.xp, 0);
  p = answer(p, 0, true, 'bold', 'run-1');
  const kinds = p.progression.log.map((e) => e.kind).sort();
  assert.deepEqual(kinds, ['expedition-answer', 'fact', 'recall', 'streak']);
  assert.equal(logXp(p.progression, 'expedition-answer'), XP.expeditionCorrect);
  assert.equal(p.progression.counters.recalls, 1);
  assert.equal(passportSummary(p.passport).points, 15);
  assert.equal(p.journal.rounds[0].difficulty, cards[0].difficulty);
  p = next(p, 0, 'run-1');
  p = answer(p, 1, true, 'steady', 'run-1');
  p = next(p, 1, 'run-1');
  p = answer(p, 2, false, 'bold', 'run-1');
  p = next(p, 2, 'run-1');
  assert.equal(logXp(p.progression, 'expedition-answer'), XP.expeditionCorrect * 2 + XP.expeditionWrong);
  for (let i = 3; i < 6; i++) {
    p = answer(p, i, true, 'bold', 'run-1');
    p = next(p, i, 'run-1');
  }
  const score = p.journeys[route.key].last.score; // 3 + 2 - 1 + 9 = 13
  assert.equal(score, 13);
  assert.equal(
    logXp(p.progression, 'expedition-complete'),
    XP.expeditionComplete + 13 * XP.expeditionScorePoint + XP.expeditionStamp,
  );
  assert.equal(p.progression.counters.stamps, 1);
  assert.equal(p.progression.counters.expeditions, 1);
  p = start(p, 'run-2');
  for (let i = 0; i < 6; i++) {
    p = answer(p, i, true, 'bold', 'run-2');
    p = next(p, i, 'run-2');
  }
  assert.equal(p.progression.counters.stamps, 1);
  assert.equal(p.progression.counters.expeditions, 2);
  assert.equal(
    logXp(p.progression, 'expedition-complete'),
    XP.expeditionComplete +
      13 * XP.expeditionScorePoint +
      XP.expeditionStamp +
      XP.expeditionComplete +
      5 * XP.expeditionScorePoint,
  );
  assert.ok(p.progression.achievements['bold-master']);
  assert.equal(p.progression.counters.facts, 6);
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
});
test('discovery, open, recall and save pay once each; removing a save pays nothing', () => {
  let p = act(emptyProfile(), {
    type: 'practice',
    fact: fact('q001', { difficulty: 'expert' }),
    choice: 0,
    roundId: 'practice:1',
  });
  assert.equal(logXp(p.progression, 'discovery'), 12);
  assert.equal(logXp(p.progression, 'fact'), 10);
  assert.equal(logXp(p.progression, 'recall'), 5);
  assert.equal(p.journal.rounds[0].difficulty, 'expert');
  p = act(p, { type: 'practice', fact: fact('q002'), choice: 1, roundId: 'practice:2' });
  assert.equal(logXp(p.progression, 'discovery'), 20);
  assert.equal(p.progression.counters.discoveries, 2);
  p = act(p, { type: 'open', roundId: 'practice:1' });
  assert.equal(logXp(p.progression, 'open'), 5);
  assert.strictEqual(act(p, { type: 'open', roundId: 'practice:1' }), p);
  assert.strictEqual(act(p, { type: 'recall', roundId: 'practice:1' }), p);
  p = act(p, { type: 'save', question: 'Question q001?' });
  assert.equal(logXp(p.progression, 'save'), 4);
  assert.equal(p.progression.counters.saves, 1);
  const removed = act(p, { type: 'save', question: 'Question q001?' });
  assert.equal(removed.journal.saved.length, 0);
  assert.equal(removed.progression.counters.saves, 1);
  assert.equal(removed.progression.xp, p.progression.xp);
  assert.equal(p.progression.xp, totalLogXp(p.progression));
});
test('applyPractice is exported, journals once and never runs the progression hook itself', () => {
  const p = emptyProfile();
  const out = applyPractice(p, { at: DAY1, fact: fact(), choice: 0, roundId: 'practice:x' });
  assert.equal(out.journal.rounds.length, 1);
  assert.strictEqual(out.progression, p.progression);
  assert.equal(out.revision, 0);
  assert.strictEqual(applyPractice(out, { at: DAY1, fact: fact(), choice: 0, roundId: 'practice:x' }), out);
});
test('daily quests are deterministic per seed, one per tier, and re-roll on the day change', () => {
  const a = dailyQuests('epoch-a', '2026-01-05'),
    b = dailyQuests('epoch-a', '2026-01-05');
  assert.deepEqual(a, b);
  assert.equal(a.seed, 'epoch-a:2026-01-05');
  assert.deepEqual(
    a.items.map((i) => QUEST_TEMPLATES.find((t) => t.id === i.template).tier),
    ['easy', 'medium', 'hard'],
  );
  assert.equal(new Set(a.items.map((i) => i.template)).size, 3);
  const many = Array.from({ length: 40 }, (_, i) =>
    dailyQuests('epoch-a', `2026-02-${String((i % 28) + 1).padStart(2, '0')}`),
  );
  assert.ok(many.some((q) => JSON.stringify(q.items) !== JSON.stringify(a.items)));
  for (const q of many)
    for (const i of q.items) {
      const t = QUEST_TEMPLATES.find((x) => x.id === i.template);
      if (t.pick === 'topic') assert.match(i.label, new RegExp(`Play a ${i.topic} duel`));
      if (t.pick === 'mode')
        assert.ok(['Play Quick Draw', 'Play Triple Threat', 'Play The Gauntlet'].includes(i.label));
      assert.ok(!i.label.includes('{'));
    }
  const day1 = reduceProgression(emptyProgression(), [{ kind: 'visit' }], DAY1, { epoch: 'epoch-a' });
  assert.deepEqual(day1.quests, dailyQuests('epoch-a', '2026-01-05'));
  const day2 = reduceProgression(day1, [{ kind: 'visit' }], DAY2, { epoch: 'epoch-a' });
  assert.equal(day2.quests.day, '2026-01-06');
  assert.deepEqual(day2.quests, dailyQuests('epoch-a', '2026-01-06'));
  const byProfile = act(emptyProfile(), { type: 'visit' });
  assert.equal(byProfile.progression.quests.seed, 'initial:2026-01-05');
});
function questState(templates, day = '2026-01-05') {
  return {
    ...emptyProgression(),
    quests: {
      day,
      seed: 'fixed',
      items: templates.map(([template, extra = {}]) => {
        const t = QUEST_TEMPLATES.find((q) => q.id === template);
        const item = {
          id: `${day}:${template}`,
          template,
          label: t.label,
          target: t.target,
          progress: 0,
          xp: t.xp,
          done: false,
          claimedAt: null,
          ...extra,
        };
        if (extra.topic) item.label = t.label.replace('{topic}', extra.topic);
        if (extra.mode)
          item.label = t.label.replace(
            '{mode}',
            { quick: 'Quick Draw', trilogy: 'Triple Threat', gauntlet: 'The Gauntlet' }[extra.mode],
          );
        return item;
      }),
    },
  };
}
const roundEvent = (extra = {}) => ({
  kind: 'round',
  correct: true,
  elapsedMs: 5000,
  bot: true,
  topic: 'Space',
  difficulty: null,
  matchId: 'm',
  roundId: 'm:0',
  index: 0,
  combo: 1,
  wild: 1,
  hour: 12,
  ...extra,
});
const matchEvent = (extra = {}) => ({
  kind: 'match',
  mode: 'quick',
  outcome: 'win',
  bot: true,
  scores: [1, 0],
  comeback: false,
  topic: 'all',
  topics: ['Space'],
  matchId: 'm',
  ...extra,
});
test('quest progress auto-claims with XP, and the all-three bonus is paid once per day', () => {
  let prog = questState([['answer-3'], ['topic-play', { topic: 'Cricket' }], ['win-3']]);
  prog = reduceProgression(prog, [roundEvent(), roundEvent({ correct: false })], DAY1);
  assert.deepEqual(
    prog.quests.items.map((i) => [i.progress, i.done]),
    [
      [1, false],
      [0, false],
      [0, false],
    ],
  );
  assert.ok(!('wallet' in prog));
  prog = reduceProgression(prog, [roundEvent(), roundEvent(), roundEvent()], DAY1);
  assert.deepEqual(prog.quests.items[0], {
    ...prog.quests.items[0],
    progress: 3,
    done: true,
    claimedAt: DAY1,
  });
  assert.equal(logXp(prog, 'quest'), 30);
  assert.equal(prog.counters.questsDone, 1);
  prog = reduceProgression(prog, [matchEvent({ topic: 'Space', topics: ['Space'] })], DAY1);
  assert.equal(prog.quests.items[1].progress, 0);
  prog = reduceProgression(prog, [matchEvent({ topics: ['Space', 'Cricket'] })], DAY1);
  assert.equal(prog.quests.items[1].done, true);
  assert.equal(prog.quests.items[2].progress, 2);
  assert.equal(logXp(prog, 'quests-bonus'), 0);
  const before = prog;
  prog = reduceProgression(prog, [matchEvent()], DAY1);
  assert.ok(prog.quests.items.every((i) => i.done));
  assert.equal(logXp(prog, 'quest'), 30 + 50 + 80);
  assert.equal(logXp(prog, 'quests-bonus'), 100);
  assert.ok(
    prog.log.every((e) => !('gems' in e)),
    'no log line carries a second currency',
  );
  assert.deepEqual(progressionDiff(before, prog).questsCompleted, ['2026-01-05:win-3']);
  const again = reduceProgression(prog, [matchEvent()], DAY1);
  assert.equal(logXp(again, 'quests-bonus'), 100);
  assert.equal(again.counters.questsDone, 3);
  const speed = reduceProgression(
    questState([['speed-2'], ['combo-3'], ['perfect-trilogy']]),
    [
      roundEvent({ elapsedMs: 2999 }),
      roundEvent({ elapsedMs: 3000 }),
      roundEvent({ elapsedMs: 100, combo: 3 }),
      matchEvent({ mode: 'trilogy', scores: [2, 0] }),
    ],
    DAY1,
  );
  assert.deepEqual(
    speed.quests.items.map((i) => i.done),
    [true, true, true],
  );
});
test('streak: today, yesterday, gaps, shields and the seven-day shield award', () => {
  let prog = reduceProgression(emptyProgression(), [{ kind: 'visit' }], DAY1);
  assert.deepEqual(prog.streak, { current: 1, best: 1, lastDay: '2026-01-05', shields: 0, frozenDays: 0 });
  assert.equal(logXp(prog, 'streak'), 10);
  assert.strictEqual(reduceProgression(prog, [{ kind: 'visit' }], T(2026, 1, 5, 23)), prog);
  prog = reduceProgression(prog, [{ kind: 'visit' }], DAY2);
  assert.equal(prog.streak.current, 2);
  assert.equal(logXp(prog, 'streak'), 30);
  prog = reduceProgression(prog, [{ kind: 'visit' }], T(2026, 1, 9));
  assert.deepEqual(prog.streak, { current: 1, best: 2, lastDay: '2026-01-09', shields: 0, frozenDays: 0 });
  for (let d = 10; d <= 15; d++) prog = reduceProgression(prog, [{ kind: 'visit' }], T(2026, 1, d));
  assert.deepEqual(prog.streak, { current: 7, best: 7, lastDay: '2026-01-15', shields: 1, frozenDays: 0 });
  assert.ok(prog.achievements['streak-7']);
  assert.ok(prog.achievements['streak-3']);
  assert.equal(prog.log.find((e) => e.kind === 'streak').xp, 70);
  const frozen = reduceProgression(prog, [{ kind: 'visit' }], T(2026, 1, 17));
  assert.deepEqual(frozen.streak, { current: 8, best: 8, lastDay: '2026-01-17', shields: 0, frozenDays: 1 });
  assert.equal(frozen.log.find((e) => e.kind === 'streak').xp, 70);
  const tooLong = reduceProgression(prog, [{ kind: 'visit' }], T(2026, 1, 18));
  assert.deepEqual(tooLong.streak, { current: 1, best: 7, lastDay: '2026-01-18', shields: 1, frozenDays: 0 });
  let two = frozen;
  for (let d = 18; d <= 30; d++) two = reduceProgression(two, [{ kind: 'visit' }], T(2026, 1, d));
  assert.equal(two.streak.current, 21);
  assert.equal(two.streak.shields, 2);
  // A clock that went backwards never credits or breaks the streak (quests may re-roll for that day).
  const clockBack = reduceProgression(two, [{ kind: 'visit' }], T(2026, 1, 20));
  assert.deepEqual(clockBack.streak, two.streak);
  assert.equal(clockBack.xp, two.xp);
});
test('achievements unlock once with their rewards, hidden ones stay hidden, level checks fire', () => {
  assert.equal(ACHIEVEMENTS.length, 29);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 29);
  assert.ok(!ACHIEVEMENTS.some((a) => a.id === 'gem-hoarder'));
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.xp >= 25 && a.xp <= 300, a.id);
    assert.ok(!('gems' in a), a.id);
    assert.ok(['bronze', 'silver', 'gold'].includes(a.tier));
  }
  assert.deepEqual(
    ACHIEVEMENTS.filter((a) => a.hidden).map((a) => a.id),
    ['night-owl', 'early-bird'],
  );
  let prog = reduceProgression(emptyProgression(), [matchEvent()], DAY1);
  const firstWin = ACHIEVEMENTS.find((a) => a.id === 'first-win');
  assert.equal(prog.achievements['first-win'], DAY1);
  assert.equal(logXp(prog, 'achievement'), firstWin.xp + ACHIEVEMENTS.find((a) => a.id === 'first-duel').xp);
  const before = prog;
  prog = reduceProgression(prog, [matchEvent()], DAY1);
  assert.equal(prog.achievements['first-win'], DAY1);
  assert.equal(logXp(prog, 'achievement'), logXp(before, 'achievement'));
  const night = reduceProgression(emptyProgression(), [roundEvent({ hour: 23 })], T(2026, 1, 5, 23));
  assert.ok(night.achievements['night-owl']);
  assert.ok(!night.achievements['early-bird']);
  const dawn = reduceProgression(emptyProgression(), [roundEvent({ hour: 6 })], T(2026, 1, 5, 6));
  assert.ok(dawn.achievements['early-bird']);
  const rich = reduceProgression({ ...emptyProgression(), xp: xpForLevel(10) - 1 }, [{ kind: 'fact' }], DAY1);
  assert.ok(rich.achievements['level-10']);
  assert.equal(levelForXp(rich.xp).level, 10);
  const sporty = { ...emptyProgression() };
  sporty.counters = {
    ...sporty.counters,
    byTopic: { ...sporty.counters.byTopic, Cricket: { rounds: 49, correct: 49 } },
  };
  const fan = reduceProgression(sporty, [roundEvent({ topic: 'Cricket' })], DAY1);
  assert.ok(fan.achievements['sports-fan']);
  assert.ok(!fan.achievements['lab-coat']);
});
test('level-ups log one line per level gained, including several levels in one reduce', () => {
  const prog = reduceProgression(
    emptyProgression(),
    [{ kind: 'expedition-complete', routeId: 'space', score: 18, first: true }],
    DAY1,
  );
  assert.equal(
    logXp(prog, 'expedition-complete'),
    XP.expeditionComplete + 18 * XP.expeditionScorePoint + XP.expeditionStamp,
  );
  const level = levelForXp(prog.xp).level;
  assert.ok(level >= 3);
  assert.equal(logXp(prog, 'level'), 0);
  // One entry per level crossed, newest first: together they must span the whole climb.
  const levels = prog.log.filter((e) => e.kind === 'level').map((e) => e.meta);
  assert.equal(levels.at(-1).from, 1);
  assert.equal(levels[0].to, level);
  assert.equal(levels.length, level - 1);
  assert.ok(!('wallet' in prog));
});
test('cosmetics: equip guards, level, achievement and rank unlocks, sanitized on reload', () => {
  assert.equal(COSMETICS.length, 29);
  assert.equal(new Set(COSMETICS.map((c) => c.id)).size, 29);
  let prog = emptyProgression();
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'coral' }), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'gold-laurel' }), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'volt' }), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'nope' }), prog);
  assert.equal(cosmeticStatus(prog, 'coral'), 'locked');
  assert.equal(cosmeticStatus(prog, 'volt'), 'equipped');
  assert.equal(cosmeticStatus(prog, 'default'), 'equipped');
  assert.equal(cosmeticStatus(prog, 'nope'), 'locked');
  // A state built by hand with the rule met but nothing materialised reads as 'unlocked'.
  const level3 = { ...prog, xp: xpForLevel(3) };
  assert.equal(cosmeticStatus(level3, 'coral'), 'unlocked');
  assert.ok(canEquip(level3, 'coral'));
  // The reducer materialises ownership the moment the rule is met, with one log line per item.
  prog = reduceProgression(
    prog,
    [{ kind: 'expedition-complete', routeId: 'space', score: 18, first: true }],
    DAY1,
  );
  assert.ok(levelForXp(prog.xp).level >= 3);
  assert.ok(prog.cosmetics.owned.includes('coral'));
  assert.equal(cosmeticStatus(prog, 'coral'), 'owned');
  const unlocked = prog.log.filter((e) => e.kind === 'cosmetic');
  assert.ok(
    unlocked.some((e) => e.label === 'Unlocked Coral' && e.meta.id === 'coral' && e.meta.kind === 'accent'),
  );
  assert.ok(unlocked.every((e) => e.xp === 0 && !('gems' in e)));
  assert.equal(new Set(prog.cosmetics.owned).size, prog.cosmetics.owned.length);
  // Owned once is owned for good: the same reduce again adds nothing and logs nothing.
  const again = reduceProgression(prog, [{ kind: 'visit' }], DAY1);
  assert.strictEqual(again, prog);
  prog = reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'coral' });
  assert.equal(prog.cosmetics.equipped.accent, 'coral');
  assert.equal(cosmeticStatus(prog, 'coral'), 'equipped');
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'coral' }), prog);
  const leveled = { ...prog, xp: xpForLevel(10) };
  assert.ok(canEquip(leveled, 'gold-laurel'));
  assert.equal(cosmeticStatus(leveled, 'gold-laurel'), 'unlocked');
  assert.equal(
    reduceCosmetics(leveled, { type: 'cosmetic-equip', id: 'gold-laurel' }).cosmetics.equipped.frame,
    'gold-laurel',
  );
  assert.ok(!canEquip(leveled, 'prism'));
  const speedy = { ...prog, achievements: { 'speed-demon': 1 } };
  assert.equal(
    reduceCosmetics(speedy, { type: 'cosmetic-equip', id: 'speedster' }).cosmetics.equipped.title,
    'speedster',
  );
  assert.ok(!canEquip(prog, 'speedster'));
  const platinum = { ...prog, rank: { points: 500, tier: 'platinum', best: 'platinum', floor: 500 } };
  assert.ok(canEquip(platinum, 'platinum'));
  assert.ok(!canEquip(prog, 'platinum'));
  // A reload keeps what was owned, materialises what the sanitised state has unlocked, and drops an
  // equipped item whose rule the sanitised state no longer meets and that was never owned.
  const equipped = reduceCosmetics(leveled, { type: 'cosmetic-equip', id: 'gold-laurel' });
  const reloaded = readProgression(JSON.parse(JSON.stringify(equipped)));
  assert.ok(reloaded.cosmetics.owned.includes('gold-laurel'));
  assert.equal(reloaded.cosmetics.equipped.frame, 'gold-laurel');
  const demoted = readProgression(JSON.parse(JSON.stringify({ ...reloaded, xp: 0 })));
  assert.equal(demoted.cosmetics.equipped.frame, 'gold-laurel', 'listed as owned, so it stays');
  // `equipped` was built by hand, so gold-laurel was never materialised into its owned list.
  const never = readProgression(JSON.parse(JSON.stringify({ ...equipped, xp: 0 })));
  assert.equal(never.cosmetics.equipped.frame, 'default');
  assert.equal(never.cosmetics.equipped.accent, 'coral', 'materialised by the reducer, so owned for good');
  let p = act(emptyProfile(), {
    type: 'room',
    room: multi('g1', 'gauntlet', Array(5).fill({ correct: true })),
  });
  assert.ok(p.progression.cosmetics.owned.includes('quiz-hound'), 'the first duel pays the title');
  assert.strictEqual(act(p, { type: 'cosmetic-buy', id: 'quiz-hound' }), p);
  assert.strictEqual(act(p, { type: 'cosmetic-equip', id: 'obsidian' }), p);
  p = act(p, { type: 'cosmetic-equip', id: 'quiz-hound' });
  assert.equal(p.progression.cosmetics.equipped.title, 'quiz-hound');
  assert.equal(
    p.progression.cosmetics.equipped.title,
    readProfile(JSON.parse(JSON.stringify(p))).progression.cosmetics.equipped.title,
  );
});
test('a version 1 record migrates: the wallet is dropped, bought cosmetics stay owned, equipped is kept', () => {
  const v1 = {
    ...JSON.parse(JSON.stringify(emptyProgression())),
    version: 1,
    xp: xpForLevel(6),
    wallet: { gems: 120, lifetimeGems: 640 },
    achievements: { 'first-duel': DAY1, 'first-win': DAY1, 'gem-hoarder': DAY1 },
    cosmetics: {
      // obsidian and nebula were bought with the old currency; neither rule is met at level 6.
      owned: ['obsidian', 'nebula', 'coral'],
      equipped: { frame: 'obsidian', title: 'challenger', banner: 'nebula', accent: 'coral' },
    },
    log: [
      {
        id: 'a',
        at: 1,
        kind: 'cosmetic',
        xp: 0,
        label: 'Unlocked Obsidian',
        gems: -300,
        meta: { id: 'obsidian' },
      },
      { id: 'b', at: 2, kind: 'level', xp: 0, label: 'Level 2 · Rookie', gems: 25 },
    ],
  };
  const p = readProgression(v1);
  assert.equal(p.version, 2);
  assert.ok(!('wallet' in p));
  assert.ok(!Object.hasOwn(p.achievements, 'gem-hoarder'), 'a retired badge is not carried over');
  assert.equal(p.achievements['first-win'], DAY1);
  // Bought items first, in stored order, then what level 6 and the first duel unlock, in catalogue order.
  assert.deepEqual(p.cosmetics.owned, ['obsidian', 'nebula', 'coral', 'chartreuse-ring', 'quiz-hound']);
  assert.deepEqual(p.cosmetics.equipped, {
    frame: 'obsidian',
    title: 'challenger',
    banner: 'nebula',
    accent: 'coral',
  });
  assert.deepEqual(p.log, [
    { id: 'a', at: 1, kind: 'cosmetic', xp: 0, label: 'Unlocked Obsidian', meta: { id: 'obsidian' } },
    { id: 'b', at: 2, kind: 'level', xp: 0, label: 'Level 2 · Rookie' },
  ]);
  assert.equal(JSON.stringify(p).includes('gems'), false);
  // The migrated record is a fixed point: it round-trips and a reduce on it adds no unlock lines.
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(p))), p);
  const reduced = reduceProgression(p, [{ kind: 'visit' }], DAY1);
  assert.equal(reduced.log.filter((e) => e.kind === 'cosmetic').length, 1);
  assert.strictEqual(reduced.cosmetics, p.cosmetics);
  // Owned for good: equipping a bought item whose rule is unmet still works after migration.
  const swapped = reduceCosmetics(
    { ...p, cosmetics: { ...p.cosmetics, equipped: { ...p.cosmetics.equipped, frame: 'default' } } },
    { type: 'cosmetic-equip', id: 'obsidian' },
  );
  assert.equal(swapped.cosmetics.equipped.frame, 'obsidian');
});
test('cosmetic-buy is a no-op that returns the same object, whatever the state', () => {
  for (const prog of [
    emptyProgression(),
    { ...emptyProgression(), xp: xpForLevel(30) },
    reduceProgression(emptyProgression(), [matchEvent()], DAY1),
  ])
    for (const id of ['coral', 'obsidian', 'default', 'nope', undefined]) {
      assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-buy', id }), prog);
      assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-buy', id, at: DAY1 }), prog);
    }
});
test('every cosmetic is unpriced and every non-default one has a reachable unlock rule', () => {
  const defaults = new Set(Object.values(DEFAULT_COSMETICS));
  const achievementIds = new Set(ACHIEVEMENTS.map((a) => a.id));
  const rankIds = new Set(RANK_TIERS.map((t) => t.id));
  const convictionIds = new Set(CONVICTION_TIERS.map((t) => t.id));
  for (const c of COSMETICS) {
    assert.strictEqual(c.price, null, c.id);
    assert.ok(!('gems' in c), c.id);
    const keys = Object.keys(c.unlock);
    if (defaults.has(c.id)) {
      assert.deepEqual(keys, [], `${c.id} is a default and carries no rule`);
      assert.equal(cosmeticStatus(emptyProgression(), c.id), 'equipped');
      continue;
    }
    assert.equal(keys.length, 1, `${c.id} has exactly one unlock rule`);
    const [key] = keys;
    const value = c.unlock[key];
    if (key === 'level')
      assert.ok(Number.isInteger(value) && value >= 2 && value <= 40, `${c.id} level ${value}`);
    else if (key === 'achievement') assert.ok(achievementIds.has(value), `${c.id} names badge ${value}`);
    else if (key === 'rank') assert.ok(rankIds.has(value), `${c.id} names rank ${value}`);
    else if (key === 'conviction') assert.ok(convictionIds.has(value) && value !== 'provisional', c.id);
    else assert.fail(`${c.id} has an unknown rule ${key}`);
    assert.equal(cosmeticStatus(emptyProgression(), c.id), 'locked', `${c.id} is locked on a fresh record`);
  }
  // The first evening: a duel, a win, a hat-trick and level 3 already dress the card.
  const evening = {
    ...emptyProgression(),
    xp: xpForLevel(3),
    achievements: { 'first-duel': DAY1, 'first-win': DAY1, 'combo-3': DAY1 },
  };
  assert.deepEqual(
    COSMETICS.filter((c) => !defaults.has(c.id) && unlockMet(evening, c)).map((c) => c.id),
    ['quiz-hound', 'coral', 'cyan'],
  );
  // A week of daily play: level 8 or so, ten wins, three modes, seven days running.
  const week = {
    ...emptyProgression(),
    xp: xpForLevel(8),
    streak: { current: 7, best: 7, lastDay: '2026-01-11', shields: 1, frozenDays: 0 },
    achievements: {
      'first-duel': DAY1,
      'first-win': DAY1,
      'combo-3': DAY1,
      'wins-10': DAY1,
      'mode-tour': DAY1,
      'streak-3': DAY1,
      'streak-7': DAY1,
    },
  };
  const afterWeek = COSMETICS.filter((c) => !defaults.has(c.id) && unlockMet(week, c)).map((c) => c.id);
  for (const id of [
    'chartreuse-ring',
    'obsidian',
    'quiz-hound',
    'stadium-lights',
    'nebula',
    'field-notes',
    'coral',
    'cyan',
    'magenta',
  ])
    assert.ok(afterWeek.includes(id), `${id} is not reachable in a week`);
  // Every kind has something to earn inside that week.
  for (const kind of ['frame', 'title', 'banner', 'accent'])
    assert.ok(
      afterWeek.some((id) => COSMETICS.find((c) => c.id === id).kind === kind),
      kind,
    );
});
test('emptyProgression carries no second currency anywhere in its tree', () => {
  const walk = (v, path, out) => {
    if (!v || typeof v !== 'object') return out;
    for (const [k, x] of Object.entries(v)) {
      if (/gem|wallet/i.test(k)) out.push(`${path}.${k}`);
      walk(x, `${path}.${k}`, out);
    }
    return out;
  };
  assert.deepEqual(walk(emptyProgression(), 'progression', []), []);
  assert.deepEqual(walk(XP, 'XP', []), []);
  assert.ok(
    !Object.hasOwn(XP, 'questBonusGems') &&
      !Object.hasOwn(XP, 'levelGems') &&
      !Object.hasOwn(XP, 'convictionTierGems'),
  );
  assert.deepEqual(walk(dailyQuests('e', '2026-01-05'), 'quests', []), []);
  assert.deepEqual(walk(reduceProgression(emptyProgression(), [matchEvent()], DAY1), 'reduced', []), []);
  assert.ok(!('gemsGained' in progressionDiff(emptyProgression(), emptyProgression())));
});
test('lib/progression.mjs has no gems identifier outside comments', () => {
  const src = readFileSync(new URL('../lib/progression.mjs', import.meta.url), 'utf8');
  const code = src
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  assert.equal(code.match(/gem/gi), null, 'a currency word survives in code');
  assert.equal(code.match(/wallet/gi), null, 'the wallet survives in code');
  assert.equal(code.match(/cosmetic-buy/g), null);
  assert.equal(code.match(/lifetime/gi), null);
});
test('reset yields emptyProgression and stale epochs cannot write progression', () => {
  let p = act(emptyProfile(), { type: 'room', room: room() });
  assert.ok(p.progression.xp > 0);
  const oldEpoch = p.epoch;
  p = act(p, { type: 'reset', newEpoch: 'fresh', at: DAY2 });
  assert.deepEqual(p.progression, emptyProgression());
  assert.strictEqual(reduceProfile(p, { type: 'visit', epoch: oldEpoch, at: DAY2 }), p);
  assert.strictEqual(reduceProfile(p, { type: 'cosmetic-buy', id: 'coral', epoch: oldEpoch, at: DAY2 }), p);
  const legacy = emptyProfile();
  delete legacy.progression;
  assert.deepEqual(readProfile(legacy).progression, emptyProgression());
  assert.deepEqual(readProfile({ ...emptyProfile(), progression: 'nope' }).progression, emptyProgression());
});
test('log is newest-first, capped at 40 and keeps ids unique even at one timestamp', () => {
  let prog = emptyProgression();
  for (let i = 0; i < 30; i++) prog = reduceProgression(prog, [{ kind: 'fact' }, { kind: 'open' }], DAY1);
  assert.equal(prog.log.length, 40);
  assert.equal(new Set(prog.log.map((e) => e.id)).size, 40);
  assert.equal(prog.log[0].kind, 'open');
  assert.equal(prog.counters.facts, 30);
  assert.equal(prog.xp, 30 * 15 + 10 + ACHIEVEMENTS.find((a) => a.id === 'curious-25').xp);
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(prog))), prog);
});
test('deriveEvents is a pure diff: unchanged profiles yield nothing, and rounds carry order, combo and hour', () => {
  const p = emptyProfile();
  assert.deepEqual(deriveEvents(p, p, { type: 'room', room: room(), at: DAY1 }), []);
  assert.deepEqual(deriveEvents(p, p, { type: 'visit', at: DAY1 }), [{ kind: 'visit' }]);
  const match = multi(
    'e1',
    'trilogy',
    [{ correct: true }, { correct: false }, { correct: true, elapsedMs: 1500 }],
    { scores: [2, 1] },
  );
  const after = act(p, { type: 'room', room: match });
  const events = deriveEvents(p, after, { type: 'room', room: match, at: T(2026, 1, 5, 7) });
  assert.deepEqual(
    events.filter((e) => e.kind === 'round').map((e) => [e.index, e.correct, e.combo, e.hour, e.elapsedMs]),
    [
      [0, true, 1, 7, 5000],
      [1, false, 0, 7, 5000],
      [2, true, 1, 7, 1500],
    ],
  );
  const m = events.find((e) => e.kind === 'match');
  assert.deepEqual(
    [m.mode, m.outcome, m.bot, m.scores, m.comeback, m.topics],
    ['trilogy', 'win', true, [2, 1], false, ['Space']],
  );
  assert.equal(events.filter((e) => e.kind === 'fact').length, 3);
  const seat1 = { ...match, seat: 1, winner: 1, scores: [1, 2] };
  const mirrored = deriveEvents(p, act(p, { type: 'room', room: seat1 }), {
    type: 'room',
    room: seat1,
    at: DAY1,
  });
  assert.deepEqual(mirrored.find((e) => e.kind === 'match').scores, [2, 1]);
  assert.deepEqual(
    mirrored.filter((e) => e.kind === 'round').map((e) => e.correct),
    [false, true, false],
  );
});
test('journal keeps a validated optional difficulty on duel and practice rounds', () => {
  const withDifficulty = recordRoom(
    readJournal(null),
    room('d1', fact('q001', { difficulty: 'extreme' })),
    DAY1,
  );
  assert.equal(withDifficulty.rounds[0].difficulty, 'extreme');
  const without = recordRoom(readJournal(null), room('d2'), DAY1);
  assert.ok(!('difficulty' in without.rounds[0]));
  const bogus = recordRoom(readJournal(null), room('d3', fact('q001', { difficulty: 'brutal' })), DAY1);
  assert.ok(!('difficulty' in bogus.rounds[0]));
  const reloaded = readJournal(
    JSON.stringify({ version: 1, rounds: [{ ...withDifficulty.rounds[0], difficulty: 'brutal' }] }),
  );
  assert.equal(reloaded.rounds.length, 0);
  assert.deepEqual(readJournal(JSON.stringify(withDifficulty)), withDifficulty);
});
test('practice cards from the service expose difficulty for XP weighting', async () => {
  const out = await dispatch(null, { action: 'practice', topic: 'Cricket' }, { rng: () => 0.51 });
  for (const card of out.cards) assert.ok(['simple', 'expert', 'extreme'].includes(card.difficulty));
});
// ---------------------------------------------------------------------------------------------
// Conviction, the first-encounter ledger and the betting XP contract (spec 1.6, 2.2-2.4)
const cv = (steady = [0, 0], bold = [0, 0], called = [0, 0]) => ({
  ...emptyProgression().conviction,
  steady: { n: steady[0], correct: steady[1] },
  bold: { n: bold[0], correct: bold[1] },
  called: { n: called[0], correct: called[1] },
});
const card = (factId, correct, confidence) => ({
  kind: 'expedition-answer',
  correct,
  confidence,
  factId,
  routeId: 'cricket',
  topic: 'Cricket',
  index: 0,
});
/** Entries of one kind added by a single reduce. The log is capped at LOG_LIMIT, so totals across
 * several reduces have to be summed step by step rather than read off the tail. */
const newLog = (before, after, kind) =>
  progressionDiff(before, after).logEntries.filter((e) => e.kind === kind);
/** n fresh expedition cards at one tier, `hits` of them correct. */
const cards = (prefix, n, hits, confidence) =>
  Array.from({ length: n }, (_, i) => card(`${prefix}-${i}`, i < hits, confidence));
test('conviction rating ties exactly where expected run score ties', () => {
  assert.equal(convictionRating(emptyProgression().conviction), 1000);
  assert.equal(convictionRating(cv([0, 0], [0, 0], [0, 0])), 1000);
  // p = 1/2: Steady and Bold are worth the same bet, Called is not.
  assert.equal(convictionRating(cv([30, 15])), 1200);
  assert.equal(convictionRating(cv([0, 0], [30, 15])), 1200);
  assert.equal(convictionRating(cv([0, 0], [0, 0], [30, 15])), 1100);
  // p = 2/3: Bold and Called are worth the same bet, Steady is not.
  assert.equal(convictionRating(cv([30, 20])), 1267);
  assert.equal(convictionRating(cv([0, 0], [30, 20])), 1333);
  assert.equal(convictionRating(cv([0, 0], [0, 0], [30, 20])), 1333);
  // p = 1: honest calling is what pays, and only calling above Steady reaches the top tiers.
  assert.equal(convictionRating(cv([30, 30])), 1400);
  assert.equal(convictionRating(cv([0, 0], [30, 30])), 1600);
  assert.equal(convictionRating(cv([0, 0], [0, 0], [30, 30])), 1800);
  assert.equal(convictionPoints(cv([1, 1], [2, 1], [2, 1])), 2 + (3 - 1) + (4 - 3));
  assert.equal(convictionCalls(cv([1, 1], [2, 1], [3, 1])), 6);
  assert.equal(convictionRiskCalls(cv([1, 1], [2, 1], [3, 1])), 5);
  assert.equal(convictionRiskLanded(cv([1, 1], [2, 1], [3, 1])), 2);
});
test('XP never prefers a confidence tier, and the crossovers are exactly 1/2 and 2/3 (R2)', () => {
  // The central honesty claim: the tier moves run score and nothing else. Per-card XP is identical.
  for (const correct of [true, false]) {
    const paid = ['steady', 'bold', 'called'].map((tier) =>
      logXp(reduceProgression(emptyProgression(), [card('q001', correct, tier)], DAY1), 'expedition-answer'),
    );
    assert.equal(new Set(paid).size, 1);
    assert.equal(paid[0], correct ? XP.expeditionCorrect : XP.expeditionWrong);
  }
  assert.equal(XP.expeditionBoldCorrect, undefined);
  assert.equal(XP.expeditionCalledCorrect, undefined);
  assert.ok(XP.expeditionWrong > 0, 'a confident miss is never punished twice');
  // Total XP EV at hit-rate p, from the exported constants alone. Flat per-card XP is what keeps the
  // crossovers where the run-score crossovers are, which is what STAKE_COPY advertises.
  const ev = (tier, p) =>
    XP.expeditionCorrect * p +
    XP.expeditionWrong * (1 - p) +
    XP.expeditionScorePoint * (CONFIDENCE[tier].correct * p + CONFIDENCE[tier].wrong * (1 - p));
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
  near(ev('steady', 1 / 2), ev('bold', 1 / 2));
  near(ev('bold', 2 / 3), ev('called', 2 / 3));
  assert.ok(ev('steady', 0.49) > ev('bold', 0.49) && ev('bold', 0.51) > ev('steady', 0.51));
  assert.ok(ev('bold', 0.66) > ev('called', 0.66) && ev('called', 0.67) > ev('bold', 0.67));
});
test('only a fact first expedition answer moves the badge or pays in full (R1)', async () => {
  const route = EXPEDITIONS[0];
  const { cards: pack } = await dispatch(null, { action: 'expedition', routeId: route.id });
  const play = (p, runId, at) => {
    p = act(p, {
      type: 'journey-start',
      routeId: route.id,
      runId,
      at,
      cards: pack,
      previousRunId: p.journeys[route.key]?.run?.id ?? null,
    });
    for (let i = 0; i < 6; i++) {
      p = act(p, {
        type: 'journey-answer',
        routeId: route.id,
        runId,
        at,
        index: i,
        choice: pack[i].correctIndex,
        confidence: 'called',
      });
      p = act(p, { type: 'journey-next', routeId: route.id, runId, at, index: i });
    }
    return p;
  };
  let p = emptyProfile();
  const firstRun = play(emptyProfile(), 'run-1', DAY1);
  assert.deepEqual(
    newLog(emptyProfile().progression, firstRun.progression, 'expedition-answer').map((e) => e.xp),
    Array(6).fill(XP.expeditionCorrect),
  );
  p = firstRun;
  for (let run = 2; run <= 6; run++) {
    const before = p;
    p = play(p, `run-${run}`, DAY1 + run * 60e3);
    const paid = newLog(before.progression, p.progression, 'expedition-answer');
    assert.deepEqual(
      paid.map((e) => e.xp),
      Array(6).fill(XP.expeditionRepeat),
    );
    assert.ok(paid.every((e) => e.meta.fresh === false));
  }
  const c = p.progression.conviction;
  // Six plays, thirty-six cards, six distinct facts: the replay farm mints nothing.
  assert.equal(p.journeys[route.key].completions, 6);
  assert.equal(convictionCalls(c), 6);
  assert.deepEqual(c.called, { n: 6, correct: 6 });
  assert.equal(c.counted.length, 6);
  assert.deepEqual([...c.counted].sort(), [...route.ids].sort());
  assert.equal(convictionRating(c), 1800);
  assert.equal(convictionTier(c).id, 'provisional', 'six distinct facts is under the card minimum');
  assert.equal(c.best, 'provisional');
  // The recency window still moves on every answer: it is a display, not a claim.
  assert.equal(c.recent.length, CONVICTION_WINDOW);
  assert.ok(c.recent.every((code) => code === 'c1'));
  // The same ledger, in one reduce so the whole total is visible: six fresh cards then six repeats.
  const ledger = reduceProgression(
    emptyProgression(),
    [...cards('r', 6, 6, 'called'), ...cards('r', 6, 6, 'called')],
    DAY1,
  );
  assert.equal(logXp(ledger, 'expedition-answer'), 6 * XP.expeditionCorrect + 6 * XP.expeditionRepeat);
  assert.equal(convictionCalls(ledger.conviction), 6);
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
});
test('a replayed route pays completion score XP only for the improvement', () => {
  const complete = (extra) => ({
    kind: 'expedition-complete',
    routeId: 'cricket',
    topic: 'Cricket',
    correct: 6,
    bold: 0,
    stakes: null,
    ...extra,
  });
  const first = reduceProgression(
    emptyProgression(),
    [complete({ score: 13, previousBest: 0, first: true })],
    DAY1,
  );
  assert.equal(
    logXp(first, 'expedition-complete'),
    XP.expeditionComplete + 13 * XP.expeditionScorePoint + XP.expeditionStamp,
  );
  assert.equal(first.counters.stamps, 1);
  const flat = reduceProgression(first, [complete({ score: 13, previousBest: 13, first: false })], DAY1);
  assert.equal(
    logXp(flat, 'expedition-complete') - logXp(first, 'expedition-complete'),
    XP.expeditionComplete,
  );
  const worse = reduceProgression(flat, [complete({ score: -18, previousBest: 13, first: false })], DAY1);
  assert.equal(
    logXp(worse, 'expedition-complete') - logXp(flat, 'expedition-complete'),
    XP.expeditionComplete,
  );
  const better = reduceProgression(worse, [complete({ score: 18, previousBest: 13, first: false })], DAY1);
  assert.equal(
    logXp(better, 'expedition-complete') - logXp(worse, 'expedition-complete'),
    XP.expeditionComplete + 5 * XP.expeditionScorePoint,
  );
  assert.equal(better.counters.stamps, 1);
  assert.equal(better.counters.expeditions, 4);
});
test('the badge needs thirty distinct cards and twenty real calls before it says anything', () => {
  assert.equal(CONVICTION_MIN_CARDS, 30);
  assert.equal(CONVICTION_MIN_CALLS, 20);
  // Twenty-nine perfect Called cards rate 1800 and still say nothing.
  const twentyNine = cv([0, 0], [0, 0], [29, 29]);
  assert.equal(convictionRating(twentyNine), 1800);
  assert.equal(convictionTier(twentyNine).id, 'provisional');
  // Thirty cards but only nineteen at risk: capped at Hunch however good the rating is.
  const nineteen = cv([11, 11], [0, 0], [19, 19]);
  assert.equal(convictionCalls(nineteen), 30);
  assert.ok(convictionRating(nineteen) >= CONVICTION_TIERS.find((t) => t.id === 'sharp').min);
  assert.equal(convictionTier(nineteen).id, 'hunch');
  // The twentieth call at risk is what promotes.
  const twenty = cv([10, 10], [0, 0], [20, 20]);
  assert.equal(convictionCalls(twenty), 30);
  assert.equal(convictionTier(twenty).id, 'sharp');
  // A player who never calls above Steady is capped at Hunch, however accurate.
  assert.equal(convictionRating(cv([54, 54])), 1400);
  assert.equal(convictionTier(cv([54, 54])).id, 'hunch');
  // A tally rated exactly 1150 is Read; one card worse is Hunch. The minimum is inclusive.
  assert.equal(convictionRating(cv([12, 12], [20, 5])), 1150);
  assert.equal(convictionTier(cv([12, 12], [20, 5])).id, 'read');
  assert.equal(convictionRating(cv([12, 11], [20, 5])), 1138);
  assert.equal(convictionTier(cv([12, 11], [20, 5])).id, 'hunch');
  // Every reachable rating lands in the tier whose band contains it, across the whole ladder.
  const band = (rating) =>
    [...CONVICTION_TIERS].reverse().find((t) => rating >= t.min && t.id !== 'provisional').id;
  for (let hits = 0; hits <= 40; hits++) {
    const c = cv([10, 10], [40, hits]);
    assert.equal(convictionCalls(c), 50);
    assert.equal(convictionTier(c).id, band(convictionRating(c)));
  }
});
test('a conviction promotion logs once, pays no XP, and a replay pays nothing', () => {
  // Straight to Dead eye on card thirty: one promotion line, whatever the tiers crossed.
  const jump = reduceProgression(emptyProgression(), cards('deadeye', 30, 30, 'called'), DAY1);
  assert.equal(jump.conviction.best, 'deadeye');
  assert.equal(jump.conviction.bestAt, 1800);
  const promotions = jump.log.filter((e) => e.kind === 'rank');
  assert.equal(promotions.length, 1);
  assert.equal(promotions[0].xp, 0);
  assert.ok(!('gems' in promotions[0]));
  assert.deepEqual(promotions[0].meta, { from: 'provisional', to: 'deadeye', rating: 1800 });
  // The badge is what unlocks its cosmetics, and they are owned the moment it lands.
  for (const id of ['caller', 'called-halo', 'called-it', 'sharp', 'deadeye'])
    assert.ok(jump.cosmetics.owned.includes(id), id);
  // No bonus, so no idempotence marks are written for it.
  assert.ok(!Object.keys(jump.eventBadges).some((k) => k.startsWith('conviction-')));
  // Replaying the same cards is a repeat under R1: no tally, no promotion.
  const again = reduceProgression(jump, cards('deadeye', 30, 30, 'called'), DAY1);
  assert.equal(newLog(jump, again, 'rank').length, 0);
  assert.deepEqual(again.conviction.called, jump.conviction.called);
  // Crossing the lines one at a time logs one line per promotion.
  let slow = reduceProgression(
    emptyProgression(),
    [...cards('a', 10, 10, 'steady'), ...cards('b', 20, 12, 'called')],
    DAY1,
  );
  assert.equal(slow.conviction.best, 'read');
  let lines = newLog(emptyProgression(), slow, 'rank').length;
  assert.equal(lines, 1);
  for (const [prefix, n, expected] of [
    ['c', 5, 'edge'],
    ['d', 20, 'sharp'],
    ['e', 97, 'deadeye'],
  ]) {
    const before = slow;
    slow = reduceProgression(slow, cards(prefix, n, n, 'called'), DAY1);
    assert.equal(slow.conviction.best, expected);
    lines += newLog(before, slow, 'rank').length;
  }
  assert.equal(lines, 4);
  // A version 1 record may still carry the old bonus marks; they are inert and survive the load.
  const marked = readProgression({
    ...JSON.parse(JSON.stringify(slow)),
    version: 1,
    eventBadges: { 'conviction-read': 5, 'conviction-edge': 6 },
  });
  assert.deepEqual(marked.eventBadges, { 'conviction-read': 5, 'conviction-edge': 6 });
  assert.equal(marked.conviction.best, 'deadeye');
  const hunch = reduceProgression(emptyProgression(), cards('s', 30, 30, 'steady'), DAY1);
  assert.equal(hunch.conviction.best, 'hunch');
  assert.equal(hunch.conviction.bestAt, 1400);
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(hunch))), hunch);
});
test('the badge label never demotes, the rating beside it does, and bestAt is kept', () => {
  const earned = reduceProgression(emptyProgression(), cards('x', 30, 25, 'called'), DAY1);
  assert.equal(earned.conviction.best, 'sharp');
  assert.equal(earned.conviction.bestAt, 1567);
  assert.equal(convictionRating(earned.conviction), 1567);
  const slumped = reduceProgression(earned, cards('y', 40, 0, 'called'), DAY1);
  assert.equal(convictionRating(slumped.conviction), 900);
  assert.equal(convictionTier(slumped.conviction).id, 'hunch');
  assert.equal(slumped.conviction.best, 'sharp');
  assert.equal(slumped.conviction.bestAt, 1567);
  assert.equal(newLog(earned, slumped, 'rank').length, 0);
  assert.equal(progressionDiff(earned, slumped).convictionUp, null);
  // A missed call never pays negative XP: the bet lives in run score and nowhere else.
  const missed = reduceProgression(emptyProgression(), cards('z', 6, 0, 'called'), DAY1);
  assert.ok(missed.log.every((e) => e.xp >= 0 && !('gems' in e)));
  assert.equal(logXp(missed, 'expedition-answer'), 6 * XP.expeditionWrong);
  // The high-water mark survives a reload even when the live tallies no longer support it.
  const reloaded = readProgression(JSON.parse(JSON.stringify(slumped)));
  assert.equal(reloaded.conviction.best, 'sharp');
  assert.equal(reloaded.conviction.bestAt, 1567);
  assert.deepEqual(reloaded, slumped);
});
test('conviction survives the reduce, the diff reports promotions, and the profile stays version 2', () => {
  const prog = reduceProgression(emptyProgression(), cards('p', 30, 30, 'called'), DAY1);
  // The regression test for the draft / return-literal omission: both enumerate their keys.
  assert.deepEqual(prog.conviction.called, { n: 30, correct: 30 });
  assert.equal(prog.conviction.counted.length, 30);
  const diff = progressionDiff(emptyProgression(), prog);
  assert.deepEqual(diff.convictionUp, { from: 'provisional', to: 'deadeye', rating: 1800 });
  assert.equal(progressionDiff(prog, prog).convictionUp, null);
  const flat = reduceProgression(emptyProgression(), cards('q', 6, 6, 'called'), DAY1);
  assert.equal(progressionDiff(emptyProgression(), flat).convictionUp, null);
  assert.equal(PROGRESSION_VERSION, 2);
  assert.equal(prog.version, 2);
  const p = { ...emptyProfile(), progression: prog };
  const round = readProfile(JSON.parse(JSON.stringify(p)));
  assert.equal(round.version, 2);
  assert.deepEqual(round.progression.conviction, prog.conviction);
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(prog))), prog);
});
test('a hand-edited conviction block normalises without inventing a badge', () => {
  const prog = reduceProgression(emptyProgression(), cards('h', 30, 30, 'called'), DAY1);
  const raw = JSON.parse(JSON.stringify(prog));
  raw.conviction = {
    steady: { n: -4, correct: 2 },
    bold: { n: 3, correct: 99 },
    called: { n: 'many', correct: Infinity },
    counted: ['q001', 'q001', '__proto__', 'constructor', 'has spaces', 42, 'q002'],
    recent: ['c1', 'nope', 's0', { evil: true }],
    best: 'grandmaster',
    bestAt: 99999,
  };
  const out = readProgression(raw);
  assert.deepEqual(out.conviction.steady, { n: 0, correct: 0 });
  assert.deepEqual(out.conviction.bold, { n: 3, correct: 3 });
  assert.deepEqual(out.conviction.called, { n: 0, correct: 0 });
  assert.deepEqual(out.conviction.counted, ['q001', 'q002']);
  assert.deepEqual(out.conviction.recent, ['c1', 's0']);
  assert.equal(out.conviction.best, 'provisional');
  assert.equal(out.conviction.bestAt, null);
  assert.equal(Object.hasOwn(out.conviction.counted, '__proto__'), false);
  // A `best` below what the sanitised tallies support is raised, never lowered; bestAt is repaired
  // to the live rating rather than invented.
  const understated = JSON.parse(JSON.stringify(prog));
  understated.conviction.best = 'hunch';
  understated.conviction.bestAt = 'yesterday';
  const raised = readProgression(understated);
  assert.equal(raised.conviction.best, 'deadeye');
  assert.equal(raised.conviction.bestAt, 1800);
  // A missing block default-fills and an old profile with no conviction and no reviews counter loads.
  const old = JSON.parse(JSON.stringify(emptyProgression()));
  delete old.conviction;
  delete old.counters.reviews;
  const filled = readProgression(old);
  assert.deepEqual(filled.conviction, emptyProgression().conviction);
  assert.equal(filled.counters.reviews, 0);
  assert.deepEqual(filled, emptyProgression());
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(filled))), filled);
});
test('conviction-gated cosmetics cannot be equipped before the badge is earned', () => {
  let prog = emptyProgression();
  for (const id of ['called-halo', 'called-it', 'deadeye', 'caller', 'sharp']) {
    assert.equal(unlockMet(prog, id), false);
    assert.equal(canEquip(prog, id), false);
    assert.equal(cosmeticStatus(prog, id), 'locked');
    assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id }), prog);
  }
  // After the promotion the same calls succeed, and the items are already owned.
  prog = reduceProgression(emptyProgression(), cards('k', 30, 30, 'called'), DAY1);
  assert.equal(prog.conviction.best, 'deadeye');
  for (const id of ['called-halo', 'called-it', 'deadeye']) {
    assert.equal(unlockMet(prog, id), true);
    assert.equal(cosmeticStatus(prog, id), 'owned');
    const kind = COSMETICS.find((c) => c.id === id).kind;
    assert.equal(reduceCosmetics(prog, { type: 'cosmetic-equip', id }).cosmetics.equipped[kind], id);
  }
  for (const id of ['caller', 'sharp']) {
    assert.equal(canEquip(prog, id), true);
    assert.equal(reduceCosmetics(prog, { type: 'cosmetic-equip', id }).cosmetics.equipped.title, id);
  }
});
test('a Vault review pays only when the card was due and the answer moved its box', () => {
  const review = (extra) => ({
    kind: 'review',
    factId: 'q001',
    correct: true,
    due: true,
    advanced: true,
    ...extra,
  });
  assert.ok(LOG_KINDS.includes('review'));
  const paid = reduceProgression(emptyProgression(), [review()], DAY1);
  assert.equal(logXp(paid, 'review'), XP.reviewCorrect);
  assert.equal(paid.counters.reviews, 1);
  const missed = reduceProgression(emptyProgression(), [review({ correct: false })], DAY1);
  assert.equal(logXp(missed, 'review'), XP.review);
  assert.equal(missed.counters.reviews, 1);
  // An off-queue re-attempt and one the schedule refused to move are both recorded elsewhere and
  // pay nothing here, so re-answering the same card cannot be farmed.
  for (const off of [{ due: false }, { advanced: false }, { due: false, advanced: false }]) {
    const out = reduceProgression(emptyProgression(), [review(off)], DAY1);
    assert.equal(logXp(out, 'review'), 0);
    assert.equal(out.counters.reviews, 0);
  }
  // Below the expedition rate, so the Recall Lab never becomes the cheapest XP in the game.
  assert.ok(XP.reviewCorrect < XP.expeditionCorrect && XP.review < XP.expeditionCorrect);
  const ceiling = reduceProgression(
    emptyProgression(),
    Array.from({ length: 12 }, () => review()),
    DAY1,
  );
  assert.equal(logXp(ceiling, 'review'), 12 * XP.reviewCorrect);
  assert.equal(ceiling.counters.reviews, 12);
  assert.deepEqual(readProgression(JSON.parse(JSON.stringify(ceiling))), ceiling);
});
