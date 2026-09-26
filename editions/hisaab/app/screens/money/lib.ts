/**
 * screens/money/lib.ts — read helpers for the money-trail screens (files lane): file groups, scope
 * names, the poll countdown chip and per-year counts. Nothing here writes; every number is counted
 * from the registered bank (editions/hisaab/bank/index.mjs) or the routes derived from it.
 */
import { MONEY_ERAS, MONEY_YEARS, type MoneyTag, type Route } from '../../../edition';
import { BANK_ITEMS, formatNumber, stateName, stateNameHi, type BankItem } from '../../data';
import { fileStatus, leaksAnswer, routeItems, type FileStatus, type Journeys } from '../files/lib';

export type MoneyView = MoneyTag | 'years';

/** The typed code on a mode's files (engine/routes.mjs): KHAATA, RAHAT, CHUNAV. */
const CODES: Readonly<Record<MoneyTag, string>> = { distribution: 'KHAATA', relief: 'RAHAT', 'pre-election': 'CHUNAV' };
export const modeCode = (tag: MoneyTag) => CODES[tag];

/** How a group of files stands: cleared / started counts and the open run, if any. */
export type GroupStatus = Readonly<{ total: number; cleared: number; started: number; running: Route | null }>;

export function groupStatus(routes: readonly Route[], journeys: Journeys): GroupStatus {
  let cleared = 0;
  let started = 0;
  let running: Route | null = null;
  let at = 0;
  for (const r of routes) {
    const s = fileStatus(r, journeys);
    if (s.state === 'cleared') cleared++;
    if (s.state !== 'sealed' || s.running) started++;
    if (s.running && s.at >= at) {
      at = s.at;
      running = r;
    }
  }
  return { total: routes.length, cleared, started, running };
}

/** The FileCard / FileBrief state for a group of files. */
export const groupState = (g: GroupStatus): 'sealed' | 'open' | 'cleared' =>
  g.total > 0 && g.cleared === g.total ? 'cleared' : g.started > 0 ? 'open' : 'sealed';

/** Items carrying a money-trail tag (the real pool, registered lanes only). */
export const tagged = (tag: MoneyTag): BankItem[] => BANK_ITEMS.filter((q) => q.tags?.includes(tag));

/** The span of the money trail: '2000–2026'. */
export const TRAIL_SPAN = `${MONEY_YEARS.from}–${MONEY_YEARS.to}`;

/** What slice of a mode a file covers, in words: 'All years', '2000–04', 'Centre', 'Uttar Pradesh'. */
export function scopeTitle(route: Route): string {
  if (route.scope === 'era') return MONEY_ERAS.find((e) => e.id === route.era)?.label ?? route.title.split('·').pop()?.trim() ?? route.title;
  if (route.scope === 'state' && route.state) return stateName(route.state);
  return `All years · ${TRAIL_SPAN}`;
}
/** A file's full name for a Resume button: 'Seedha Khaate Mein · Centre', 'Saal-dar-Saal · 2019'. */
export const fileName = (route: Route) => (route.kind === 'year' ? `Saal-dar-Saal · ${route.title}` : route.title);

/** The Devanagari twin of scopeTitle for state files ('उत्तर प्रदेश'), else undefined. */
export const scopeTitleHi = (route: Route) => (route.scope === 'state' && route.state ? stateNameHi(route.state) : undefined);

// ---- Chunav Se Pehle: the poll countdown ----------------------------------------------------------

/**
 * The countdown chip for one pre-election card: '47 days before UP Assembly 2022'. The charter's
 * `gapDays` runs from the announcement OR the first payment to polling day, so the chip states the
 * gap, not which of the two it was. If naming the poll would hint at the card's answer (a card whose
 * answer is the state), the chip drops the poll name: '3 days before polling'. Null without `poll`.
 */
export function pollChip(item: BankItem): string | null {
  const p = item.poll;
  if (!p) return null;
  const days = typeof p.gapDays === 'number' ? `${formatNumber(p.gapDays)} ${p.gapDays === 1 ? 'day' : 'days'}` : null;
  const full = days ? `${days} before ${p.label}` : `Before ${p.label}`;
  if (!leaksAnswer(full, item)) return full;
  return days ? `${days} before polling` : null;
}

export type PollSummary = Readonly<{
  /** The chip for the card announced or paid closest to its poll (the smallest gap). */
  chip: string;
  /** Smallest and largest gap among the file's cards that record one. */
  min: number | null;
  max: number | null;
  /** How many different polls the file's cards lead up to. */
  polls: number;
  /** Cards in the file carrying a poll. */
  cards: number;
}>;

/** The countdown summary for a file's six cards, or null when none carries a poll. */
export function pollSummary(route: Route): PollSummary | null {
  const items = routeItems(route).filter((q) => q.poll);
  if (!items.length) return null;
  const gaps = items.map((q) => q.poll?.gapDays).filter((g): g is number => typeof g === 'number');
  const sorted = [...items].sort((a, b) => (a.poll?.gapDays ?? Infinity) - (b.poll?.gapDays ?? Infinity));
  const chip = sorted.map(pollChip).find((c): c is string => !!c);
  if (!chip) return null;
  return {
    chip,
    min: gaps.length ? Math.min(...gaps) : null,
    max: gaps.length ? Math.max(...gaps) : null,
    polls: new Set(items.map((q) => q.poll?.label)).size,
    cards: items.length,
  };
}

// ---- Saal-dar-Saal ---------------------------------------------------------------------------------

/** Every year of the trail, 2000 → 2026. */
export const TRAIL_YEARS: readonly number[] = Object.freeze(
  Array.from({ length: MONEY_YEARS.to - MONEY_YEARS.from + 1 }, (_, i) => MONEY_YEARS.from + i),
);

/** Cards on file per year, across every registered lane (the real count; 0 for an empty year). */
export function yearCounts(): ReadonlyMap<number, number> {
  const counts = new Map<number, number>(TRAIL_YEARS.map((y) => [y, 0]));
  for (const q of BANK_ITEMS) if (counts.has(q.year)) counts.set(q.year, (counts.get(q.year) ?? 0) + 1);
  return counts;
}

/** '2019' or '2004–2010' for a year file. */
export const yearFileLabel = (route: Route) =>
  route.years ? (route.years[0] === route.years[1] ? `${route.years[0]}` : `${route.years[0]}–${route.years[1]}`) : route.title;

export type { FileStatus };
