// Client-local progression: XP, levels, streaks, daily quests, achievements, arena rank and cosmetics.
// Pure and I/O-free like lib/expeditions.mjs. XP is only ever earned from typed events that
// deriveEvents() reads out of a before/after profile diff, so re-polled room snapshots, replayed
// expeditions and repeated open/recall toggles can never award twice. Same honesty stance as the
// README: this is an editable device-local record with no monetary value, never a trusted rank.
import { TOPIC_DOMAINS, DIFFICULTIES } from './journal.mjs';
import { expeditionById } from './expeditions.mjs';
export const PROGRESSION_VERSION = 1;
export const TOPICS = Object.freeze(Object.keys(TOPIC_DOMAINS));
export const MODES = Object.freeze(['quick', 'trilogy', 'gauntlet']);
export const MODE_NAMES = Object.freeze({
  quick: 'Quick Draw',
  trilogy: 'Triple Threat',
  gauntlet: 'The Gauntlet',
});
export const DIFFICULTY_MULTIPLIER = Object.freeze({ simple: 1, expert: 1.3, extreme: 1.6 });
export const LOG_LIMIT = 40;
// Every tunable in one place so the UI can quote the same numbers the reducer uses.
export const XP = Object.freeze({
  roundCorrectBot: 20,
  roundCorrectHuman: 30,
  roundWrong: 5,
  speedFast: 15, // correct under 2000 ms
  speedQuick: 8, // correct under 4000 ms
  matchWin: Object.freeze({ quick: 50, trilogy: 80, gauntlet: 120 }),
  matchLoss: 15,
  matchDraw: 25,
  humanMultiplier: 1.5,
  perfectGauntlet: 100,
  expeditionCorrect: 12,
  expeditionBoldCorrect: 18,
  expeditionWrong: 3,
  expeditionComplete: 100,
  expeditionScorePoint: 5,
  expeditionStamp: 150,
  fact: 10,
  open: 5,
  recall: 5,
  save: 4,
  discovery: 8,
  discoveryCorrect: 12,
  questBonus: 100,
  questBonusGems: 20,
  streakPerDay: 10,
  streakCap: 7,
  levelGems: 25,
  rankWin: Object.freeze({ quick: 20, trilogy: 30, gauntlet: 40 }),
  rankLoss: -10,
  rankDraw: 5,
});
// ---------------------------------------------------------------------------------------------
// Level curve
export const LEVEL_TITLES = Object.freeze([
  'Rookie',
  'Contender',
  'Challenger',
  'Scholar',
  'Strategist',
  'Sage',
  'Virtuoso',
  'Oracle',
  'Legend',
]);
/** XP needed to go from `level` to `level + 1`: round(80 * level^1.55). */
export function xpToNext(level) {
  return Math.round(80 * Math.pow(Math.max(1, Math.floor(level)), 1.55));
}
/** Cumulative XP at which `level` begins (level 1 = 0). */
export function xpForLevel(level) {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNext(l);
  return total;
}
/** Level, XP into it, XP still needed, 0..1 progress, band title and band index for an XP total. */
export function levelForXp(xp) {
  let level = 1,
    into = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  while (into >= xpToNext(level)) {
    into -= xpToNext(level);
    level += 1;
  }
  const toNext = xpToNext(level),
    band = Math.min(LEVEL_TITLES.length - 1, Math.floor(level / 5)); // Rookie 1-4, Contender 5-9, ... Legend 40+
  return { level, into, toNext, progress: into / toNext, title: LEVEL_TITLES[band], band };
}
/** In-match multiplier for `combo` consecutive correct rounds (1 for a single correct answer). */
export function comboMultiplier(combo) {
  return combo >= 5 ? 2 : combo === 4 ? 1.75 : combo === 3 ? 1.5 : combo === 2 ? 1.25 : 1;
}
// ---------------------------------------------------------------------------------------------
// Days, hashing and the deterministic PRNG behind daily quests / wild rounds
const pad = (n) => String(n).padStart(2, '0');
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Local calendar date of a timestamp as YYYY-MM-DD (zero padded, local getters). */
export function dayKey(at) {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Whole days from one day key to another (DST-safe, local midnights). */
export function dayDiff(from, to) {
  const [a, b] = [from, to].map((k) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  });
  return Math.round((b - a) / 864e5);
}
export function fnv1a32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Variable-ratio bonus for a duel round id: x3 about 1 in 36, x2 about 1 in 6, otherwise x1. */
export function wildRound(roundId) {
  const h = fnv1a32(String(roundId));
  return h % 36 === 1 ? 3 : h % 6 === 0 ? 2 : 1;
}
// ---------------------------------------------------------------------------------------------
// Arena rank
export const RANK_TIERS = Object.freeze(
  [
    { id: 'bronze', label: 'Bronze', min: 0 },
    { id: 'silver', label: 'Silver', min: 100 },
    { id: 'gold', label: 'Gold', min: 250 },
    { id: 'platinum', label: 'Platinum', min: 500 },
    { id: 'diamond', label: 'Diamond', min: 900 },
  ].map(Object.freeze),
);
const rankIndex = (id) =>
  Math.max(
    0,
    RANK_TIERS.findIndex((t) => t.id === id),
  );
/** Tier for a points total, with progress towards the next tier (progress 1 at the top tier). */
export function rankForPoints(points) {
  const p = Number.isFinite(points) && points > 0 ? Math.floor(points) : 0;
  const i = RANK_TIERS.reduce((best, t, j) => (p >= t.min ? j : best), 0);
  const tier = RANK_TIERS[i],
    next = RANK_TIERS[i + 1] ?? null;
  const into = p - tier.min,
    toNext = next ? next.min - tier.min : 0;
  return {
    tier: tier.id,
    label: tier.label,
    into,
    toNext,
    progress: next ? into / toNext : 1,
  };
}
// ---------------------------------------------------------------------------------------------
// Daily quests
const correctAnswer = (e) =>
  (e.kind === 'round' || e.kind === 'discovery' || e.kind === 'expedition-answer') && e.correct;
const won = (e) => e.kind === 'match' && e.outcome === 'win';
const quest = (id, tier, label, target, source, advances, pick) =>
  Object.freeze({
    id,
    tier,
    label,
    target,
    xp: { easy: 30, medium: 50, hard: 80 }[tier],
    gems: { easy: 5, medium: 10, hard: 15 }[tier],
    source,
    advances,
    ...(pick ? { pick } : {}),
  });
export const QUEST_TEMPLATES = Object.freeze([
  quest('answer-3', 'easy', 'Answer 3 questions correctly', 3, 'correct answer', correctAnswer),
  quest('open-2', 'easy', 'Open 2 explanations', 2, 'first open of a fact', (e) => e.kind === 'open'),
  quest('save-2', 'easy', 'Save 2 facts to your Vault', 2, 'save to vault', (e) => e.kind === 'save'),
  quest('discovery-1', 'easy', 'Try a Discovery card', 1, 'discovery attempt', (e) => e.kind === 'discovery'),
  quest('play-1', 'easy', 'Play any duel', 1, 'finished duel', (e) => e.kind === 'match'),
  quest(
    'expedition-cards-2',
    'easy',
    'Answer 2 expedition cards',
    2,
    'expedition answer',
    (e) => e.kind === 'expedition-answer',
  ),
  quest('win-2', 'medium', 'Win 2 duels', 2, 'duel win', won),
  quest(
    'topic-play',
    'medium',
    'Play a {topic} duel',
    1,
    'finished duel on the topic',
    (e, item) => e.kind === 'match' && (e.topic === item.topic || e.topics.includes(item.topic)),
    'topic',
  ),
  quest(
    'mode-play',
    'medium',
    'Play {mode}',
    1,
    'finished duel in the mode',
    (e, item) => e.kind === 'match' && e.mode === item.mode,
    'mode',
  ),
  quest(
    'combo-3',
    'medium',
    'Get a 3-answer combo in one match',
    1,
    'round with combo >= 3',
    (e) => e.kind === 'round' && e.combo >= 3,
  ),
  quest(
    'expedition-finish-1',
    'medium',
    'Finish an expedition',
    1,
    'expedition completion',
    (e) => e.kind === 'expedition-complete',
  ),
  quest('correct-6', 'medium', 'Answer 6 correctly', 6, 'correct answer', correctAnswer),
  quest(
    'win-gauntlet',
    'hard',
    'Win The Gauntlet',
    1,
    'gauntlet win',
    (e) => won(e) && e.mode === 'gauntlet',
  ),
  quest('win-3', 'hard', 'Win 3 duels', 3, 'duel win', won),
  quest(
    'speed-2',
    'hard',
    'Answer 2 correctly under 3 seconds',
    2,
    'correct duel round under 3000 ms',
    (e) => e.kind === 'round' && e.correct && e.elapsedMs !== null && e.elapsedMs < 3000,
  ),
  quest(
    'bold-4',
    'hard',
    'Answer 4 bold expedition cards correctly',
    4,
    'correct bold expedition answer',
    (e) => e.kind === 'expedition-answer' && e.correct && e.confidence === 'bold',
  ),
  quest(
    'human-1',
    'hard',
    'Duel a friend',
    1,
    'finished duel vs a human',
    (e) => e.kind === 'match' && !e.bot,
  ),
  quest(
    'perfect-trilogy',
    'hard',
    'Win Triple Threat 2-0',
    1,
    'trilogy win 2-0',
    (e) => won(e) && e.mode === 'trilogy' && e.scores[0] === 2 && e.scores[1] === 0,
  ),
]);
const questTemplate = (id) => QUEST_TEMPLATES.find((t) => t.id === id);
const questLabel = (t, item) =>
  t.label.replace('{topic}', item.topic ?? '').replace('{mode}', MODE_NAMES[item.mode] ?? '');
/** The three quests (easy, medium, hard) for a profile epoch on a day; deterministic per seed. */
export function dailyQuests(epoch, day) {
  const seed = `${epoch}:${day}`,
    rng = mulberry32(fnv1a32(seed));
  const pick = (list) => list[Math.floor(rng() * list.length)];
  const items = ['easy', 'medium', 'hard'].map((tier) => {
    const t = pick(QUEST_TEMPLATES.filter((q) => q.tier === tier));
    const item = {
      id: `${day}:${t.id}`,
      template: t.id,
      label: t.label,
      target: t.target,
      progress: 0,
      xp: t.xp,
      gems: t.gems,
      done: false,
      claimedAt: null,
    };
    if (t.pick === 'topic') item.topic = pick(TOPICS);
    if (t.pick === 'mode') item.mode = pick(MODES);
    item.label = questLabel(t, item);
    return item;
  });
  return { day, seed, items };
}
// ---------------------------------------------------------------------------------------------
// Achievements: check(prog, events, ctx) runs after this reduce's counters are applied.
const REWARD = Object.freeze({
  bronze: { xp: 50, gems: 10 },
  silver: { xp: 120, gems: 25 },
  gold: { xp: 300, gems: 50 },
});
const domainCorrect = (prog, domain) =>
  TOPICS.filter((t) => TOPIC_DOMAINS[t] === domain).reduce((n, t) => n + prog.counters.byTopic[t].correct, 0);
const nightHour = (h) => h >= 23 || h < 4,
  dawnHour = (h) => h >= 5 && h < 8;
const ach = (id, name, description, tier, check, hidden = false) =>
  Object.freeze({ id, name, description, tier, xp: REWARD[tier].xp, gems: REWARD[tier].gems, hidden, check });
export const ACHIEVEMENTS = Object.freeze([
  ach('first-duel', 'First duel', 'Finish your first duel.', 'bronze', (p) => p.counters.matches >= 1),
  ach('first-win', 'First win', 'Win a duel.', 'bronze', (p) => p.counters.wins >= 1),
  ach('wins-10', 'Ten up', 'Win 10 duels.', 'bronze', (p) => p.counters.wins >= 10),
  ach('wins-50', 'Half century', 'Win 50 duels.', 'silver', (p) => p.counters.wins >= 50),
  ach('wins-200', 'Double century', 'Win 200 duels.', 'gold', (p) => p.counters.wins >= 200),
  ach('streak-3', 'Three in a row', 'Play three days running.', 'bronze', (p) => p.streak.best >= 3),
  ach('streak-7', 'Full week', 'Play seven days running.', 'silver', (p) => p.streak.best >= 7),
  ach('streak-30', 'Monthly regular', 'Play thirty days running.', 'gold', (p) => p.streak.best >= 30),
  ach(
    'combo-3',
    'Hat-trick',
    'Three correct answers in a row in one match.',
    'bronze',
    (p) => p.counters.bestCombo >= 3,
  ),
  ach(
    'combo-5',
    'Clean sweep',
    'Five correct answers in a row in one match.',
    'silver',
    (p) => p.counters.bestCombo >= 5,
  ),
  ach(
    'speed-demon',
    'Speed demon',
    'A correct answer in under 1.5 seconds.',
    'silver',
    (p) => p.counters.fastestCorrectMs !== null && p.counters.fastestCorrectMs < 1500,
  ),
  ach(
    'perfect-gauntlet',
    'Perfect gauntlet',
    'Win The Gauntlet 5-0.',
    'gold',
    (p) => p.counters.perfectGauntlets >= 1,
  ),
  ach('comeback', 'Comeback', 'Win Triple Threat after losing the first round.', 'silver', (p, events) =>
    events.some((e) => e.kind === 'match' && e.comeback),
  ),
  ach('mode-tour', 'Mode tour', 'Finish all three duel modes.', 'bronze', (p) =>
    MODES.every((m) => p.counters.byMode[m].played >= 1),
  ),
  ach(
    'friend-rival',
    'Friendly rival',
    'Finish a duel against a friend.',
    'bronze',
    (p) => p.counters.humanMatches >= 1,
  ),
  ach(
    'all-routes',
    'Every stamp',
    'Complete all nine expedition routes.',
    'gold',
    (p) => p.counters.stamps >= 9,
  ),
  ach('bold-master', 'Bold master', 'Finish an expedition with a perfect 18.', 'gold', (p, events) =>
    events.some((e) => e.kind === 'expedition-complete' && e.score === 18),
  ),
  ach('scholar-50', 'Scholar', 'Encounter 50 distinct facts.', 'silver', (p) => p.counters.facts >= 50),
  ach('scholar-200', 'Polymath', 'Encounter 200 distinct facts.', 'gold', (p) => p.counters.facts >= 200),
  ach('vault-25', 'Vault keeper', 'Save 25 facts to your Vault.', 'silver', (p) => p.counters.saves >= 25),
  ach('curious-25', 'Curious', 'Open 25 explanations.', 'silver', (p) => p.counters.opens >= 25),
  ach(
    'night-owl',
    'Night owl',
    'Play a duel round between 23:00 and 04:00.',
    'bronze',
    (p, events) => events.some((e) => e.kind === 'round' && nightHour(e.hour)),
    true,
  ),
  ach(
    'early-bird',
    'Early bird',
    'Play a duel round between 05:00 and 08:00.',
    'bronze',
    (p, events) => events.some((e) => e.kind === 'round' && dawnHour(e.hour)),
    true,
  ),
  ach(
    'sports-fan',
    'Sports fan',
    '50 correct answers in sports topics.',
    'silver',
    (p) => domainCorrect(p, 'sports') >= 50,
  ),
  ach(
    'lab-coat',
    'Lab coat',
    '50 correct answers in science topics.',
    'silver',
    (p) => domainCorrect(p, 'science') >= 50,
  ),
  ach(
    'quest-streak-10',
    'Quest regular',
    'Complete 10 daily quests.',
    'silver',
    (p) => p.counters.questsDone >= 10,
  ),
  ach('level-10', 'Level 10', 'Reach level 10.', 'bronze', (p) => levelForXp(p.xp).level >= 10),
  ach('level-25', 'Level 25', 'Reach level 25.', 'silver', (p) => levelForXp(p.xp).level >= 25),
  ach('level-40', 'Level 40', 'Reach level 40.', 'gold', (p) => levelForXp(p.xp).level >= 40),
  ach('gem-hoarder', 'Gem hoarder', 'Earn 500 gems in total.', 'silver', (p) => p.wallet.lifetimeGems >= 500),
]);
export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id);
// ---------------------------------------------------------------------------------------------
// Cosmetics
export const COSMETIC_KINDS = Object.freeze(['frame', 'title', 'banner', 'accent']);
export const DEFAULT_COSMETICS = Object.freeze({
  frame: 'default',
  title: 'challenger',
  banner: 'midnight',
  accent: 'volt',
});
const cos = (kind, id, name, description, price = null, unlock = {}) =>
  Object.freeze({ id, kind, name, description, price, unlock: Object.freeze(unlock) });
export const COSMETICS = Object.freeze([
  cos('frame', 'default', 'Standard', 'The plain card frame.'),
  cos('frame', 'chartreuse-ring', 'Chartreuse ring', 'A thin chartreuse halo.', 60),
  cos('frame', 'gold-laurel', 'Gold laurel', 'Laurels for a seasoned player.', null, { level: 10 }),
  cos('frame', 'ember', 'Ember', 'Glows for fifty wins.', null, { achievement: 'wins-50' }),
  cos('frame', 'prism', 'Prism', 'Refracts at level 25.', null, { level: 25 }),
  cos('frame', 'obsidian', 'Obsidian', 'Dark glass, sharp edge.', 300),
  cos('title', 'challenger', 'Challenger', 'Everyone starts here.'),
  cos('title', 'quiz-hound', 'Quiz hound', 'Follows every clue.', 40),
  cos('title', 'speedster', 'Speedster', 'For a sub-1.5 s answer.', null, { achievement: 'speed-demon' }),
  cos('title', 'stampsmith', 'Stampsmith', 'Every expedition stamped.', null, { achievement: 'all-routes' }),
  cos('title', 'sage', 'Sage', 'Level 25 and counting.', null, { level: 25 }),
  cos('title', 'gauntlet-runner', 'Gauntlet runner', 'A perfect 5-0 Gauntlet.', null, {
    achievement: 'perfect-gauntlet',
  }),
  cos('title', 'platinum', 'Platinum', 'Reached Platinum in the arena.', null, { rank: 'platinum' }),
  cos('banner', 'midnight', 'Midnight', 'The default banner.'),
  cos('banner', 'stadium-lights', 'Stadium lights', 'Floodlit turf.', 80),
  cos('banner', 'nebula', 'Nebula', 'Deep-field colour.', 80),
  cos('banner', 'lab-glass', 'Lab glass', 'Beakers and bench light.', 120),
  cos('banner', 'championship', 'Championship', 'Confetti for level 15.', null, { level: 15 }),
  cos('accent', 'volt', 'Volt', 'The default accent hue.'),
  cos('accent', 'coral', 'Coral', 'Warm coral accent.', 50),
  cos('accent', 'cyan', 'Cyan', 'Cool cyan accent.', 50),
  cos('accent', 'magenta', 'Magenta', 'Loud magenta accent.', 90),
  cos('accent', 'gold', 'Gold', 'Gold accent for level 20.', null, { level: 20 }),
]);
export const cosmeticById = (id) => COSMETICS.find((c) => c.id === id);
/** True when a cosmetic can be equipped: owned, or free and every unlock condition is met. */
export function canEquip(prog, cosmetic) {
  const c = typeof cosmetic === 'string' ? cosmeticById(cosmetic) : cosmetic;
  if (!c) return false;
  if (prog.cosmetics.owned.includes(c.id)) return true;
  if (c.price !== null) return false;
  const u = c.unlock;
  if (u.level && levelForXp(prog.xp).level < u.level) return false;
  if (u.achievement && !Object.hasOwn(prog.achievements, u.achievement)) return false;
  if (u.rank && rankIndex(prog.rank.best) < rankIndex(u.rank)) return false;
  return true;
}
/** 'equipped' | 'owned' | 'available' (free/unlocked) | 'buyable' | 'locked' for the UI. */
export function cosmeticStatus(prog, id) {
  const c = cosmeticById(id);
  if (!c) return 'locked';
  if (prog.cosmetics.equipped[c.kind] === c.id) return 'equipped';
  if (prog.cosmetics.owned.includes(c.id)) return 'owned';
  if (canEquip(prog, c)) return 'available';
  return c.price !== null && prog.wallet.gems >= c.price ? 'buyable' : 'locked';
}
// ---------------------------------------------------------------------------------------------
// State
const COUNTER_KEYS = Object.freeze([
  'rounds',
  'correct',
  'matches',
  'wins',
  'losses',
  'draws',
  'humanMatches',
  'expeditions',
  'stamps',
  'facts',
  'opens',
  'recalls',
  'saves',
  'discoveries',
  'questsDone',
  'bestCombo',
  'perfectGauntlets',
]);
export const LOG_KINDS = Object.freeze([
  'round',
  'match',
  'discovery',
  'expedition-answer',
  'expedition-complete',
  'fact',
  'open',
  'recall',
  'save',
  'streak',
  'quest',
  'quests-bonus',
  'level',
  'achievement',
  'rank',
  'cosmetic',
]);
export function emptyProgression() {
  return {
    version: PROGRESSION_VERSION,
    xp: 0,
    counters: {
      ...Object.fromEntries(COUNTER_KEYS.map((k) => [k, 0])),
      fastestCorrectMs: null,
      byTopic: Object.fromEntries(TOPICS.map((t) => [t, { rounds: 0, correct: 0 }])),
      byMode: Object.fromEntries(MODES.map((m) => [m, { played: 0, wins: 0 }])),
    },
    streak: { current: 0, best: 0, lastDay: null, shields: 0, frozenDays: 0 },
    achievements: {},
    quests: { day: null, seed: null, items: [] },
    rank: { points: 0, tier: 'bronze', best: 'bronze', floor: 0 },
    wallet: { gems: 0, lifetimeGems: 0 },
    cosmetics: { owned: [], equipped: { ...DEFAULT_COSMETICS } },
    log: [],
  };
}
const nat = (v, max = Number.MAX_SAFE_INTEGER) => (Number.isSafeInteger(v) && v > 0 ? Math.min(v, max) : 0);
const str = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const META_KEY = /^[a-zA-Z][a-zA-Z0-9]{0,30}$/;
function readMeta(meta) {
  const out = {};
  for (const [k, v] of Object.entries(obj(meta)).slice(0, 12))
    if (
      META_KEY.test(k) &&
      (v === null ||
        typeof v === 'boolean' ||
        (typeof v === 'number' && Number.isFinite(v)) ||
        (typeof v === 'string' && v.length <= 200))
    )
      out[k] = v;
  return Object.keys(out).length ? out : null;
}
function readLogEntry(e) {
  if (
    !e ||
    !str(e.id, 120) ||
    !Number.isFinite(e.at) ||
    !LOG_KINDS.includes(e.kind) ||
    !Number.isSafeInteger(e.xp) ||
    e.xp < 0 ||
    !str(e.label, 200)
  )
    return null;
  const out = { id: e.id, at: e.at, kind: e.kind, xp: e.xp, label: e.label };
  if (Number.isSafeInteger(e.gems) && e.gems !== 0) out.gems = e.gems;
  const meta = readMeta(e.meta);
  if (meta) out.meta = meta;
  return out;
}
function readQuestItem(i) {
  const t = i && questTemplate(i.template);
  if (!t || !str(i.id, 120)) return null;
  if (t.pick === 'topic' && !TOPICS.includes(i.topic)) return null;
  if (t.pick === 'mode' && !MODES.includes(i.mode)) return null;
  const done = i.done === true;
  const item = {
    id: i.id,
    template: t.id,
    label: '',
    target: t.target,
    progress: done ? t.target : Math.min(t.target, nat(i.progress)),
    xp: t.xp,
    gems: t.gems,
    done,
    claimedAt: done && Number.isFinite(i.claimedAt) ? i.claimedAt : null,
  };
  if (t.pick === 'topic') item.topic = i.topic;
  if (t.pick === 'mode') item.mode = i.mode;
  item.label = questLabel(t, item);
  return item;
}
/** Sanitizer: clamps ints, whitelists ids, drops unknown keys, caps arrays. Identity on valid state. */
export function readProgression(value) {
  const next = emptyProgression();
  if (!value || typeof value !== 'object' || value.version !== PROGRESSION_VERSION) return next;
  next.xp = nat(value.xp);
  const c = obj(value.counters);
  for (const k of COUNTER_KEYS) next.counters[k] = nat(c[k]);
  next.counters.fastestCorrectMs =
    Number.isSafeInteger(c.fastestCorrectMs) && c.fastestCorrectMs >= 0 ? c.fastestCorrectMs : null;
  for (const t of TOPICS) {
    const v = obj(obj(c.byTopic)[t]);
    next.counters.byTopic[t] = { rounds: nat(v.rounds), correct: Math.min(nat(v.correct), nat(v.rounds)) };
  }
  for (const m of MODES) {
    const v = obj(obj(c.byMode)[m]);
    next.counters.byMode[m] = { played: nat(v.played), wins: Math.min(nat(v.wins), nat(v.played)) };
  }
  const s = obj(value.streak);
  const lastDay = typeof s.lastDay === 'string' && DAY_RE.test(s.lastDay) ? s.lastDay : null;
  const current = lastDay ? nat(s.current) : 0;
  next.streak = {
    current,
    best: Math.max(current, nat(s.best)),
    lastDay,
    shields: Math.min(2, nat(s.shields)),
    frozenDays: nat(s.frozenDays),
  };
  const a = obj(value.achievements);
  for (const item of ACHIEVEMENTS) if (Number.isFinite(a[item.id])) next.achievements[item.id] = a[item.id];
  const q = obj(value.quests);
  if (typeof q.day === 'string' && DAY_RE.test(q.day)) {
    next.quests.day = q.day;
    next.quests.seed = str(q.seed, 200) ? q.seed : null;
    next.quests.items = (Array.isArray(q.items) ? q.items : [])
      .map(readQuestItem)
      .filter(Boolean)
      .slice(0, 3);
  }
  const r = obj(value.rank);
  let points = nat(r.points),
    best = RANK_TIERS.some((t) => t.id === r.best) ? r.best : 'bronze';
  if (rankIndex(rankForPoints(points).tier) > rankIndex(best)) best = rankForPoints(points).tier;
  const floor = RANK_TIERS[rankIndex(best)].min;
  points = Math.max(points, floor);
  next.rank = { points, tier: rankForPoints(points).tier, best, floor };
  const w = obj(value.wallet);
  next.wallet = { gems: nat(w.gems), lifetimeGems: Math.max(nat(w.gems), nat(w.lifetimeGems)) };
  const co = obj(value.cosmetics);
  next.cosmetics.owned = [
    ...new Set(
      (Array.isArray(co.owned) ? co.owned : []).filter(
        (id) => cosmeticById(id)?.price !== null && cosmeticById(id),
      ),
    ),
  ].slice(0, COSMETICS.length);
  for (const kind of COSMETIC_KINDS) {
    const id = obj(co.equipped)[kind],
      item = cosmeticById(id);
    next.cosmetics.equipped[kind] =
      item && item.kind === kind && canEquip(next, item) ? id : DEFAULT_COSMETICS[kind];
  }
  next.log = (Array.isArray(value.log) ? value.log : [])
    .map(readLogEntry)
    .filter(Boolean)
    .slice(0, LOG_LIMIT);
  return next;
}
// ---------------------------------------------------------------------------------------------
// Events: a pure diff of two profiles (plus the action that produced the change) into typed events.
const clip = (v) => (typeof v === 'string' ? v.slice(0, 200) : v);
/**
 * deriveEvents(before, after, action) -> events. Kinds: round, match, discovery, expedition-answer,
 * expedition-complete, fact, open, recall, save, visit. Every source is exactly-once by construction
 * (new journal ids, new fact ids, false->true flags, completion deltas), so repeated snapshots yield [].
 */
export function deriveEvents(before, after, action) {
  const events = [];
  if (!before || !after || !action) return events;
  const at = Number.isFinite(action.at) ? action.at : Date.now(),
    hour = new Date(at).getHours();
  const bj = before.journal,
    aj = after.journal;
  if (action.type === 'room' && action.room && aj !== bj) {
    const room = action.room,
      seat = room.seat === 1 ? 1 : 0;
    const known = new Set(bj.rounds.map((r) => r.id));
    const fresh = aj.rounds.filter((r) => r.matchId === room.id && !known.has(r.id));
    if (fresh.length) {
      const order = (Array.isArray(room.completedRounds) ? room.completedRounds : [])
        .filter((r) => r && r.result)
        .map((r) => ({ id: r.id, index: r.index, correct: r.receipts?.[seat]?.correct === true }));
      const live = room.round;
      if (live?.result && !order.some((r) => r.id === live.id))
        order.push({ id: live.id, index: room.roundIndex, correct: live.receipts?.[seat]?.correct === true });
      order.sort((x, y) => (x.index ?? 0) - (y.index ?? 0));
      const combos = new Map();
      let run = 0;
      for (const r of order) {
        run = r.correct ? run + 1 : 0;
        combos.set(r.id, { combo: run, index: Number.isInteger(r.index) ? r.index : 0 });
      }
      for (const r of [...fresh].reverse()) {
        const meta = combos.get(r.id);
        events.push({
          kind: 'round',
          correct: r.correct === true,
          elapsedMs: Number.isFinite(r.elapsedMs) ? r.elapsedMs : null,
          bot: r.bot === true,
          topic: r.topic,
          difficulty: DIFFICULTIES.includes(r.difficulty) ? r.difficulty : null,
          matchId: r.matchId,
          roundId: r.id,
          index: meta?.index ?? 0,
          combo: r.correct === true ? Math.max(1, meta?.combo ?? 1) : 0,
          wild: wildRound(r.id),
          hour,
        });
      }
    }
    const knownMatches = new Set(bj.matches.map((m) => m.id));
    const match = aj.matches.find((m) => m.id === room.id && !knownMatches.has(m.id));
    if (match) {
      const opener = (Array.isArray(room.completedRounds) ? room.completedRounds : []).find(
        (r) => r && r.index === 0 && r.result,
      );
      const first = opener ?? (room.roundIndex === 0 && room.round?.result ? room.round : null);
      const scores = Array.isArray(match.scores)
        ? [match.scores[seat] ?? 0, match.scores[1 - seat] ?? 0]
        : [0, 0];
      events.push({
        kind: 'match',
        mode: match.mode,
        outcome: match.outcome,
        bot: match.bot === true,
        scores,
        comeback: match.outcome === 'win' && match.mode === 'trilogy' && first?.result?.winner === 1 - seat,
        topic: typeof room.config?.topic === 'string' ? room.config.topic : 'all',
        topics: [...new Set(aj.rounds.filter((r) => r.matchId === room.id).map((r) => r.topic))],
        matchId: match.id,
      });
    }
  }
  if (action.type === 'practice' && aj !== bj) {
    const known = new Set(bj.rounds.map((r) => r.id));
    const r = aj.rounds.find((x) => x.id === action.roundId && !known.has(x.id));
    if (r) events.push({ kind: 'discovery', correct: r.correct === true, topic: r.topic, roundId: r.id });
  }
  if (action.type === 'journey-answer' || action.type === 'journey-next') {
    const route = expeditionById(action.routeId);
    const b = route ? before.journeys?.[route.key] : null,
      a = route ? after.journeys?.[route.key] : null;
    if (route && a && a !== b) {
      const run = a.run,
        prior = b?.run && b.run.id === run?.id ? b.run.answers.length : 0;
      if (action.type === 'journey-answer' && run && run.answers.length > prior) {
        const i = run.answers.length - 1,
          ans = run.answers[i];
        events.push({
          kind: 'expedition-answer',
          correct: ans.choice === run.cards[i].correctIndex,
          confidence: ans.confidence,
          routeId: route.id,
          topic: route.topic,
          index: i,
        });
      }
      if (action.type === 'journey-next' && (a.completions || 0) > (b?.completions || 0) && a.last)
        events.push({
          kind: 'expedition-complete',
          routeId: route.id,
          topic: route.topic,
          score: a.last.score,
          correct: a.last.correct,
          bold: a.last.bold,
          first: !b?.first,
        });
    }
  }
  const bf = before.passport?.facts ?? {},
    af = after.passport?.facts ?? {};
  if (af !== bf)
    for (const [id, f] of Object.entries(af)) {
      const prev = bf[id];
      if (!prev) events.push({ kind: 'fact', factId: id, topic: f.topic });
      if (f.opened && !prev?.opened) events.push({ kind: 'open', factId: id, topic: f.topic });
      if (f.recalled && !prev?.recalled) events.push({ kind: 'recall', factId: id, topic: f.topic });
    }
  if (action.type === 'save' && aj !== bj && aj.saved.length > bj.saved.length)
    events.push({ kind: 'save', question: clip(aj.saved[0]) });
  if (action.type === 'visit') events.push({ kind: 'visit' });
  return events;
}
// ---------------------------------------------------------------------------------------------
// Reducer
function logEntry(at, kind, xp, label, meta, gems = 0) {
  const entry = { at, kind, xp, label };
  if (gems) entry.gems = gems;
  const clean = meta ? readMeta(meta) : null;
  if (clean) entry.meta = clean;
  return entry;
}
function prependLog(log, entries) {
  const taken = new Set(log.map((e) => e.id));
  const stamped = entries.map((e) => {
    let n = 0,
      id;
    do id = `${e.at}:${e.kind}:${n++}`;
    while (taken.has(id));
    taken.add(id);
    return { id, ...e };
  });
  return [...stamped.reverse(), ...log].slice(0, LOG_LIMIT);
}
function mapSame(list, fn) {
  let out = list;
  list.forEach((x, i) => {
    const y = fn(x);
    if (y !== x) {
      if (out === list) out = [...list];
      out[i] = y;
    }
  });
  return out;
}
/** Purchases and equips. Same reference when the action is not allowed or changes nothing. */
export function reduceCosmetics(prog, action, at = Date.now()) {
  const c = cosmeticById(action?.id);
  if (!c) return prog;
  if (action.type === 'cosmetic-buy') {
    if (c.price === null || prog.cosmetics.owned.includes(c.id) || prog.wallet.gems < c.price) return prog;
    return {
      ...prog,
      wallet: { ...prog.wallet, gems: prog.wallet.gems - c.price },
      cosmetics: { ...prog.cosmetics, owned: [...prog.cosmetics.owned, c.id] },
      log: prependLog(prog.log, [
        logEntry(
          Number.isFinite(at) ? at : Date.now(),
          'cosmetic',
          0,
          `Unlocked ${c.name}`,
          { id: c.id, kind: c.kind },
          -c.price,
        ),
      ]),
    };
  }
  if (action.type === 'cosmetic-equip') {
    if (!canEquip(prog, c) || prog.cosmetics.equipped[c.kind] === c.id) return prog;
    return {
      ...prog,
      cosmetics: { ...prog.cosmetics, equipped: { ...prog.cosmetics.equipped, [c.kind]: c.id } },
    };
  }
  return prog;
}
/**
 * reduceProgression(prog, events, at, ctx) applies exactly-once events: XP, counters, quest roll +
 * progress + auto-claim, streak credit, level-up gems, achievements, rank. ctx = { epoch, profile }.
 * Returns the same reference when nothing changes (no events, or a same-day visit).
 */
export function reduceProgression(prog, events, at = Date.now(), ctx = {}) {
  if (!prog) prog = emptyProgression();
  if (!Array.isArray(events) || !events.length) return prog;
  if (!Number.isFinite(at)) at = Date.now();
  const today = dayKey(at),
    rolled = prog.quests.day !== today;
  const quests = rolled ? dailyQuests(ctx.epoch ?? 'initial', today) : prog.quests;
  const allDoneBefore = quests.items.length > 0 && quests.items.every((i) => i.done);
  let items = quests.items;
  const counters = {
    ...prog.counters,
    byTopic: { ...prog.counters.byTopic },
    byMode: { ...prog.counters.byMode },
  };
  let xp = prog.xp,
    gems = prog.wallet.gems,
    lifetime = prog.wallet.lifetimeGems,
    rank = prog.rank,
    dirty = rolled;
  const entries = [];
  const award = (kind, amount, label, meta, gemAmount = 0) => {
    xp += amount;
    gems += gemAmount;
    lifetime += Math.max(0, gemAmount);
    entries.push(logEntry(at, kind, amount, label, meta, gemAmount));
    dirty = true;
  };
  // Small, frequent sources are aggregated into one log line per reduce.
  const small = { fact: 0, open: 0, recall: 0, save: 0 };
  for (const e of events) if (Object.hasOwn(small, e.kind)) small[e.kind] += 1;
  if (small.fact) {
    counters.facts += small.fact;
    award('fact', small.fact * XP.fact, small.fact === 1 ? 'New fact' : `${small.fact} new facts`, {
      count: small.fact,
    });
  }
  if (small.open) {
    counters.opens += small.open;
    award(
      'open',
      small.open * XP.open,
      small.open === 1 ? 'Explanation opened' : `${small.open} explanations opened`,
      {
        count: small.open,
      },
    );
  }
  if (small.recall) {
    counters.recalls += small.recall;
    award(
      'recall',
      small.recall * XP.recall,
      small.recall === 1 ? 'Untimed recall' : `${small.recall} untimed recalls`,
      {
        count: small.recall,
      },
    );
  }
  if (small.save) {
    counters.saves += small.save;
    award(
      'save',
      small.save * XP.save,
      small.save === 1 ? 'Saved to Vault' : `${small.save} saved to Vault`,
      {
        count: small.save,
      },
    );
  }
  for (const e of events) {
    if (e.kind === 'round') {
      counters.rounds += 1;
      if (e.correct) counters.correct += 1;
      if (Object.hasOwn(counters.byTopic, e.topic)) {
        const t = counters.byTopic[e.topic];
        counters.byTopic[e.topic] = { rounds: t.rounds + 1, correct: t.correct + (e.correct ? 1 : 0) };
      }
      const combo = e.correct ? Math.max(1, Number.isInteger(e.combo) ? e.combo : 1) : 0;
      if (combo > counters.bestCombo) counters.bestCombo = combo;
      const ms = e.correct && Number.isFinite(e.elapsedMs) ? Math.round(e.elapsedMs) : null;
      if (ms !== null && (counters.fastestCorrectMs === null || ms < counters.fastestCorrectMs))
        counters.fastestCorrectMs = ms;
      const base = e.correct ? (e.bot ? XP.roundCorrectBot : XP.roundCorrectHuman) : XP.roundWrong;
      const speed = ms === null ? 0 : ms < 2000 ? XP.speedFast : ms < 4000 ? XP.speedQuick : 0;
      const difficulty = DIFFICULTY_MULTIPLIER[e.difficulty] ?? 1,
        multiplier = comboMultiplier(combo),
        wild = e.wild === 2 || e.wild === 3 ? e.wild : 1;
      const amount = Math.round((base + speed) * difficulty * multiplier) * wild;
      const label = [
        e.correct ? 'Correct answer' : 'Missed answer',
        speed ? 'fast' : null,
        e.difficulty && e.difficulty !== 'simple' ? e.difficulty : null,
        combo >= 2 ? `x${multiplier} combo` : null,
        wild > 1 ? `Wild round x${wild}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      award('round', amount, label, {
        matchId: clip(e.matchId),
        index: e.index,
        combo,
        elapsedMs: ms,
        difficulty: e.difficulty ?? null,
        wild,
        topic: clip(e.topic),
      });
    } else if (e.kind === 'match') {
      counters.matches += 1;
      counters[e.outcome === 'win' ? 'wins' : e.outcome === 'loss' ? 'losses' : 'draws'] += 1;
      if (!e.bot) counters.humanMatches += 1;
      if (Object.hasOwn(counters.byMode, e.mode)) {
        const m = counters.byMode[e.mode];
        counters.byMode[e.mode] = { played: m.played + 1, wins: m.wins + (e.outcome === 'win' ? 1 : 0) };
      }
      let amount =
        e.outcome === 'win'
          ? (XP.matchWin[e.mode] ?? XP.matchWin.quick)
          : e.outcome === 'loss'
            ? XP.matchLoss
            : XP.matchDraw;
      if (!e.bot) amount = Math.round(amount * XP.humanMultiplier);
      const perfect = e.outcome === 'win' && e.mode === 'gauntlet' && e.scores[0] === 5 && e.scores[1] === 0;
      if (perfect) {
        amount += XP.perfectGauntlet;
        counters.perfectGauntlets += 1;
      }
      const word = e.outcome === 'win' ? 'Won' : e.outcome === 'loss' ? 'Lost' : 'Drew';
      award(
        'match',
        amount,
        [`${word} ${MODE_NAMES[e.mode] ?? e.mode}`, perfect ? 'perfect' : null, e.bot ? null : 'vs friend']
          .filter(Boolean)
          .join(' · '),
        {
          matchId: clip(e.matchId),
          mode: e.mode,
          outcome: e.outcome,
          bot: e.bot,
          score: `${e.scores[0]}-${e.scores[1]}`,
          perfect,
        },
      );
      // Arena rank: demotion protection keeps points at or above the floor of the best tier reached.
      let delta =
        e.outcome === 'win'
          ? (XP.rankWin[e.mode] ?? XP.rankWin.quick)
          : e.outcome === 'loss'
            ? XP.rankLoss
            : XP.rankDraw;
      if (!e.bot && delta > 0) delta = Math.round(delta * XP.humanMultiplier);
      const points = Math.max(rank.floor, rank.points + delta);
      if (points !== rank.points) {
        const tier = rankForPoints(points).tier;
        const promoted = rankIndex(tier) > rankIndex(rank.best);
        const best = promoted ? tier : rank.best;
        rank = { points, tier, best, floor: RANK_TIERS[rankIndex(best)].min };
        if (promoted)
          entries.push(
            logEntry(at, 'rank', 0, `Promoted to ${RANK_TIERS[rankIndex(tier)].label}`, {
              from: prog.rank.tier,
              to: tier,
              points,
            }),
          );
        dirty = true;
      }
    } else if (e.kind === 'discovery') {
      counters.discoveries += 1;
      award(
        'discovery',
        e.correct ? XP.discoveryCorrect : XP.discovery,
        e.correct ? 'Discovery · correct' : 'Discovery attempt',
        {
          correct: e.correct,
          topic: clip(e.topic),
        },
      );
    } else if (e.kind === 'expedition-answer') {
      const bold = e.confidence === 'bold';
      award(
        'expedition-answer',
        e.correct ? (bold ? XP.expeditionBoldCorrect : XP.expeditionCorrect) : XP.expeditionWrong,
        [
          `Expedition card ${(e.index ?? 0) + 1}`,
          e.correct ? (bold ? 'bold hit' : 'correct') : 'missed',
        ].join(' · '),
        { routeId: clip(e.routeId), index: e.index ?? 0, confidence: e.confidence, correct: e.correct },
      );
    } else if (e.kind === 'expedition-complete') {
      counters.expeditions += 1;
      let amount = XP.expeditionComplete + Math.max(0, e.score) * XP.expeditionScorePoint;
      if (e.first) {
        counters.stamps += 1;
        amount += XP.expeditionStamp;
      }
      award('expedition-complete', amount, e.first ? 'Expedition stamped' : 'Expedition finished', {
        routeId: clip(e.routeId),
        score: e.score,
        first: e.first === true,
      });
    }
    // Quest progress counts every event of this reduce, including the one that rolled the day.
    items = mapSame(items, (i) => {
      const t = questTemplate(i.template);
      if (i.done || !t || !t.advances(e, i)) return i;
      return { ...i, progress: Math.min(i.target, i.progress + 1) };
    });
  }
  // Streak: any event credits today; a same-day repeat changes nothing.
  let streak = prog.streak;
  if (streak.lastDay !== today) {
    const gap = streak.lastDay ? dayDiff(streak.lastDay, today) : 1;
    if (gap >= 1) {
      let { current, best, shields, frozenDays } = streak;
      const missed = gap - 1;
      if (!streak.lastDay) current = 1;
      else if (missed === 0) current += 1;
      else if (shields >= missed) {
        shields -= missed;
        frozenDays += missed;
        current += 1;
      } else current = 1;
      best = Math.max(best, current);
      if (current % 7 === 0) shields = Math.min(2, shields + 1);
      streak = { current, best, lastDay: today, shields, frozenDays };
      award('streak', XP.streakPerDay * Math.min(current, XP.streakCap), `Day ${current} streak`, {
        streak: current,
      });
    }
  }
  // Auto-claim finished quests, then the once-per-day bonus when all three are done.
  items = mapSame(items, (i) => {
    if (i.done || i.progress < i.target) return i;
    counters.questsDone += 1;
    award('quest', i.xp, i.label, { quest: i.id, template: i.template }, i.gems);
    return { ...i, done: true, claimedAt: at };
  });
  if (!allDoneBefore && items.length > 0 && items.every((i) => i.done))
    award('quests-bonus', XP.questBonus, 'All daily quests complete', { day: today }, XP.questBonusGems);
  // Level-up gems and achievements to a fixed point (achievement XP/gems can unlock more).
  let level = levelForXp(prog.xp).level;
  const achievements = { ...prog.achievements };
  for (let guard = 0; guard < 128; guard++) {
    const now = levelForXp(xp);
    if (now.level > level) {
      award(
        'level',
        0,
        `Level ${now.level} · ${now.title}`,
        { from: level, to: now.level },
        XP.levelGems * (now.level - level),
      );
      level = now.level;
    }
    const draft = {
      ...prog,
      xp,
      counters,
      streak,
      achievements,
      quests: { ...quests, items },
      rank,
      wallet: { gems, lifetimeGems: lifetime },
    };
    const hit = ACHIEVEMENTS.find((a) => !Object.hasOwn(achievements, a.id) && a.check(draft, events, ctx));
    if (!hit) break;
    achievements[hit.id] = at;
    award('achievement', hit.xp, hit.name, { achievement: hit.id, tier: hit.tier }, hit.gems);
  }
  if (!dirty && streak === prog.streak && items === prog.quests.items) return prog;
  return {
    ...prog,
    xp,
    counters,
    streak,
    achievements,
    quests: items === quests.items ? quests : { ...quests, items },
    rank,
    wallet: { gems, lifetimeGems: lifetime },
    log: entries.length ? prependLog(prog.log, entries) : prog.log,
  };
}
/** What changed between two progression states, so the UI can drive toasts and ceremonies. */
export function progressionDiff(before, after) {
  const from = levelForXp(before.xp),
    to = levelForXp(after.xp);
  const seen = new Set(before.log.map((e) => e.id));
  const doneBefore = new Set(
    before.quests.day === after.quests.day ? before.quests.items.filter((i) => i.done).map((i) => i.id) : [],
  );
  return {
    xpGained: after.xp - before.xp,
    gemsGained: after.wallet.lifetimeGems - before.wallet.lifetimeGems,
    leveledUp: to.level > from.level ? { from: from.level, to: to.level } : null,
    newAchievements: Object.keys(after.achievements).filter((id) => !Object.hasOwn(before.achievements, id)),
    questsCompleted: after.quests.items.filter((i) => i.done && !doneBefore.has(i.id)).map((i) => i.id),
    streakChanged:
      before.streak.current !== after.streak.current || before.streak.lastDay !== after.streak.lastDay,
    rankUp:
      rankIndex(after.rank.tier) > rankIndex(before.rank.tier)
        ? { from: before.rank.tier, to: after.rank.tier }
        : null,
    logEntries: after.log.filter((e) => !seen.has(e.id)),
  };
}
