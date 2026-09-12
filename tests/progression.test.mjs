import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyProgression,
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
import { EXPEDITIONS } from '../lib/expeditions.mjs';
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
const logGems = (prog, kind) =>
  prog.log.filter((e) => e.kind === kind).reduce((n, e) => n + (e.gems ?? 0), 0);
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
  assert.deepEqual(p.wallet, { gems: 40, lifetimeGems: 40 });
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
  p = act(p, { type: 'cosmetic-buy', id: 'coral' });
  p = act(p, { type: 'cosmetic-equip', id: 'coral' });
  const prog = p.progression;
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
    gemsGained: 0,
    leveledUp: null,
    newAchievements: [],
    questsCompleted: [],
    streakChanged: false,
    rankUp: null,
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
  assert.equal(logXp(p.progression, 'expedition-answer'), 18);
  assert.equal(p.progression.counters.recalls, 1);
  assert.equal(passportSummary(p.passport).points, 15);
  assert.equal(p.journal.rounds[0].difficulty, cards[0].difficulty);
  p = next(p, 0, 'run-1');
  p = answer(p, 1, true, 'steady', 'run-1');
  p = next(p, 1, 'run-1');
  p = answer(p, 2, false, 'bold', 'run-1');
  p = next(p, 2, 'run-1');
  assert.equal(logXp(p.progression, 'expedition-answer'), 18 + 12 + 3);
  for (let i = 3; i < 6; i++) {
    p = answer(p, i, true, 'bold', 'run-1');
    p = next(p, i, 'run-1');
  }
  const score = p.journeys[route.key].last.score; // 3 + 2 - 1 + 9 = 13
  assert.equal(score, 13);
  assert.equal(logXp(p.progression, 'expedition-complete'), 100 + 13 * 5 + 150);
  assert.equal(p.progression.counters.stamps, 1);
  assert.equal(p.progression.counters.expeditions, 1);
  p = start(p, 'run-2');
  for (let i = 0; i < 6; i++) {
    p = answer(p, i, true, 'bold', 'run-2');
    p = next(p, i, 'run-2');
  }
  assert.equal(p.progression.counters.stamps, 1);
  assert.equal(p.progression.counters.expeditions, 2);
  assert.equal(logXp(p.progression, 'expedition-complete'), 100 + 13 * 5 + 150 + 100 + 18 * 5);
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
          gems: t.gems,
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
test('quest progress auto-claims with XP and gems, and the all-three bonus is paid once per day', () => {
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
  assert.equal(prog.wallet.gems, 0);
  prog = reduceProgression(prog, [roundEvent(), roundEvent(), roundEvent()], DAY1);
  assert.deepEqual(prog.quests.items[0], {
    ...prog.quests.items[0],
    progress: 3,
    done: true,
    claimedAt: DAY1,
  });
  assert.equal(logXp(prog, 'quest'), 30);
  assert.equal(prog.wallet.gems, 5 + logGems(prog, 'level'));
  assert.equal(prog.wallet.lifetimeGems, prog.wallet.gems);
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
  assert.equal(logGems(prog, 'quests-bonus'), 20);
  assert.equal(prog.wallet.gems, 5 + 10 + 15 + 20 + logGems(prog, 'level') + logGems(prog, 'achievement'));
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
test('achievements unlock once with their rewards, hidden ones stay hidden, level and gem checks fire', () => {
  assert.equal(ACHIEVEMENTS.length, 30);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 30);
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.xp >= 25 && a.xp <= 300 && a.gems >= 10 && a.gems <= 50, a.id);
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
  assert.equal(logGems(prog, 'achievement'), firstWin.gems + 10);
  const before = prog;
  prog = reduceProgression(prog, [matchEvent()], DAY1);
  assert.equal(prog.achievements['first-win'], DAY1);
  assert.equal(logXp(prog, 'achievement'), logXp(before, 'achievement'));
  const night = reduceProgression(emptyProgression(), [roundEvent({ hour: 23 })], T(2026, 1, 5, 23));
  assert.ok(night.achievements['night-owl']);
  assert.ok(!night.achievements['early-bird']);
  const dawn = reduceProgression(emptyProgression(), [roundEvent({ hour: 6 })], T(2026, 1, 5, 6));
  assert.ok(dawn.achievements['early-bird']);
  const rich = reduceProgression(
    { ...emptyProgression(), xp: xpForLevel(10) - 1, wallet: { gems: 0, lifetimeGems: 499 } },
    [{ kind: 'fact' }],
    DAY1,
  );
  assert.ok(rich.achievements['level-10']);
  assert.ok(rich.achievements['gem-hoarder']);
  assert.equal(rich.wallet.lifetimeGems, 499 + 25 + 10 + 25);
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
test('level-ups pay 25 gems per level gained, including several levels in one reduce', () => {
  const prog = reduceProgression(
    emptyProgression(),
    [{ kind: 'expedition-complete', routeId: 'space', score: 18, first: true }],
    DAY1,
  );
  assert.equal(logXp(prog, 'expedition-complete'), 100 + 90 + 150);
  const level = levelForXp(prog.xp).level;
  assert.ok(level >= 3);
  assert.equal(logGems(prog, 'level'), 25 * (level - 1));
  assert.deepEqual(prog.log.find((e) => e.kind === 'level').meta, { from: 1, to: level });
  assert.equal(prog.wallet.gems, prog.wallet.lifetimeGems);
});
test('cosmetics: buy and equip guards, level, achievement and rank unlocks, sanitized on reload', () => {
  assert.equal(COSMETICS.length, 23);
  assert.equal(new Set(COSMETICS.map((c) => c.id)).size, 23);
  let prog = emptyProgression();
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-buy', id: 'coral' }, DAY1), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-buy', id: 'default' }, DAY1), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'coral' }, DAY1), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'gold-laurel' }, DAY1), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'volt' }, DAY1), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'nope' }, DAY1), prog);
  assert.equal(cosmeticStatus(prog, 'coral'), 'locked');
  prog = { ...prog, wallet: { gems: 60, lifetimeGems: 60 } };
  assert.equal(cosmeticStatus(prog, 'coral'), 'buyable');
  prog = reduceCosmetics(prog, { type: 'cosmetic-buy', id: 'coral' }, DAY1);
  assert.equal(prog.wallet.gems, 10);
  assert.equal(prog.wallet.lifetimeGems, 60);
  assert.deepEqual(prog.cosmetics.owned, ['coral']);
  assert.deepEqual(prog.log[0], { ...prog.log[0], kind: 'cosmetic', xp: 0, gems: -50 });
  assert.equal(cosmeticStatus(prog, 'coral'), 'owned');
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-buy', id: 'coral' }, DAY1), prog);
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-buy', id: 'cyan' }, DAY1), prog);
  prog = reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'coral' }, DAY1);
  assert.equal(prog.cosmetics.equipped.accent, 'coral');
  assert.equal(cosmeticStatus(prog, 'coral'), 'equipped');
  assert.strictEqual(reduceCosmetics(prog, { type: 'cosmetic-equip', id: 'coral' }, DAY1), prog);
  const leveled = { ...prog, xp: xpForLevel(10) };
  assert.ok(canEquip(leveled, 'gold-laurel'));
  assert.equal(cosmeticStatus(leveled, 'gold-laurel'), 'available');
  assert.equal(
    reduceCosmetics(leveled, { type: 'cosmetic-equip', id: 'gold-laurel' }, DAY1).cosmetics.equipped.frame,
    'gold-laurel',
  );
  assert.ok(!canEquip(leveled, 'prism'));
  const speedy = { ...prog, achievements: { 'speed-demon': 1 } };
  assert.equal(
    reduceCosmetics(speedy, { type: 'cosmetic-equip', id: 'speedster' }, DAY1).cosmetics.equipped.title,
    'speedster',
  );
  assert.ok(!canEquip(prog, 'speedster'));
  const platinum = { ...prog, rank: { points: 500, tier: 'platinum', best: 'platinum', floor: 500 } };
  assert.ok(canEquip(platinum, 'platinum'));
  assert.ok(!canEquip(prog, 'platinum'));
  const equipped = reduceCosmetics(leveled, { type: 'cosmetic-equip', id: 'gold-laurel' }, DAY1);
  const demoted = readProgression(JSON.parse(JSON.stringify({ ...equipped, xp: 0 })));
  assert.equal(demoted.cosmetics.equipped.frame, 'default');
  assert.equal(demoted.cosmetics.equipped.accent, 'coral');
  let p = act(emptyProfile(), {
    type: 'room',
    room: multi('g1', 'gauntlet', Array(5).fill({ correct: true })),
  });
  assert.ok(p.progression.wallet.gems >= 40);
  const gems = p.progression.wallet.gems;
  p = act(p, { type: 'cosmetic-buy', id: 'quiz-hound' });
  assert.equal(p.progression.wallet.gems, gems - 40);
  assert.strictEqual(act(p, { type: 'cosmetic-equip', id: 'obsidian' }), p);
  p = act(p, { type: 'cosmetic-equip', id: 'quiz-hound' });
  assert.equal(p.progression.cosmetics.equipped.title, 'quiz-hound');
  assert.equal(
    p.progression.cosmetics.equipped.title,
    readProfile(JSON.parse(JSON.stringify(p))).progression.cosmetics.equipped.title,
  );
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
  const out = await dispatch(null, { action: 'practice', topic: 'Space' }, { rng: () => 0.51 });
  for (const card of out.cards) assert.ok(['simple', 'expert', 'extreme'].includes(card.difficulty));
});
