/**
 * editions/hisaab/edition.ts — the edition's configuration, typed, in one import for the screens.
 *
 *   import { EDITION, ROUTES, standing, todaysFive } from '@/editions/hisaab/edition';
 *
 * Brand strings, the label ladder over the engine's title bands, the routes (derived from the bank —
 * they are the same objects lib/expeditions.mjs runs, because this build aliases its catalogue), the
 * daily five, and the duel formats. The logic lives in plain modules under engine/ (tested in node);
 * this file only types and gathers it. Only meaningful inside the edition build (vite.config.hisaab.ts):
 * outside it, '@/lib/expeditions.mjs' would be JHK's sports routes.
 */
import { ACTIVE_EXPEDITIONS } from '@/lib/expeditions.mjs';
import { levelForXp, MODE_NAMES } from '@/lib/progression.mjs';
import { MODE_DURATION, MODE_ROUNDS, RULES } from '@/lib/server/room-engine.mjs';
import { QUESTIONS } from './server/bank.mjs';
import { LABELS, labelFor, labelForLevel } from './engine/labels.mjs';
import { DAILY_SIZE, dailyRoundId, dealDaily, localDay } from './engine/daily.mjs';
import { ROUTE_KINDS, ROUTE_MIN } from './engine/routes.mjs';

/** The deployment base, frozen in by vite.config.hisaab.ts ('/fact-duel/hisaab/' by default). */
declare const __HISAAB_BASE__: string;

export const EDITION = Object.freeze({
  id: 'hisaab',
  name: 'HISAAB DO',
  nameDevanagari: 'हिसाब दो',
  tagline: 'Show us the accounts.',
  motto: 'Janta ka paisa. Janta ka sawaal.',
  mottoGloss: "The people's money. The people's question.",
  description:
    'A quiz duel about Indian public money: schemes, spending, scams, media and elections — every answer sourced.',
  base: typeof __HISAAB_BASE__ === 'string' ? __HISAAB_BASE__ : '/',
  /** Engine facts a screen quotes. */
  tieMs: RULES.tieMs,
  questionCount: QUESTIONS.length,
});

// ---------------------------------------------------------------------------------------------
// Labels (charter §1): the engine's nine title bands, shown as the edition's nine rungs.

export type Label = { band: number; from: number; to: number | null; label: string; line: string };
export const LADDER = LABELS as readonly Label[];
export { labelFor, labelForLevel };

/** Everything a level badge needs: the engine's level maths plus the edition's label for the band. */
export function standing(xp: number) {
  const level = levelForXp(xp);
  return { ...level, label: labelFor(level.band) as Label };
}

// ---------------------------------------------------------------------------------------------
// Routes (charter §6): Rajya Rounds, Sector Files, Kiska Media, Forward Court.

export type RouteKind = 'state' | 'sector' | 'media' | 'forward';
export type Route = Readonly<{
  id: string;
  kind: RouteKind;
  key: string;
  version: number;
  title: string;
  subtitle: string;
  code: string;
  stamp: string;
  chapters: readonly string[];
  domain: 'civics';
  /** The dominant sector (what the engine's per-topic counters file the route under). */
  topic: string;
  /** Every sector the six cards come from. */
  topics: readonly string[];
  ids: readonly string[];
  /** Cards from the route's own pool; the rest (`padded`) are Centre items topping up a small state. */
  ownCount: number;
  padded: readonly string[];
  poolSize: number;
  state?: string;
  sector?: string;
}>;

/** Every playable route, in display order. Grows as lanes are registered in bank/index.mjs. */
export const ROUTES = ACTIVE_EXPEDITIONS as unknown as readonly Route[];
export const ROUTE_RULES = Object.freeze({ kinds: ROUTE_KINDS as readonly RouteKind[], min: ROUTE_MIN });
export const routeById = (id: string) => ROUTES.find((r) => r.id === id) ?? null;
export const routesOfKind = (kind: RouteKind) => ROUTES.filter((r) => r.kind === kind);

// ---------------------------------------------------------------------------------------------
// Aaj Ka Hisaab: five a day, same for everyone on the same local date.

export type Card = {
  factId: string;
  domain: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceUrl: string;
  sourceLabel: string;
};

/** Today's five as playable cards (`{ id, day, cards }`). */
export function todaysFive(at: number = Date.now()): { id: string; day: string; cards: Card[] } {
  return dealDaily(localDay(at), QUESTIONS);
}
export { DAILY_SIZE, dailyRoundId, localDay };

// ---------------------------------------------------------------------------------------------
// Duel formats: the engine's own (lib/server/room-engine.mjs). Names from lib/progression.mjs.

export const DUEL_FORMATS = Object.freeze(
  (['quick', 'trilogy', 'gauntlet'] as const).map((mode) =>
    Object.freeze({ mode, name: MODE_NAMES[mode], rounds: MODE_ROUNDS[mode], duration: MODE_DURATION[mode] }),
  ),
);

/**
 * Achievements the engine defines that this edition cannot award (they count sports or science
 * answers). Screens listing achievements should leave them out.
 */
export const UNREACHABLE_ACHIEVEMENTS = Object.freeze(['sports-fan', 'lab-coat']);
