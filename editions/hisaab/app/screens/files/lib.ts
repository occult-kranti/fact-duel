/**
 * screens/files/lib.ts — read helpers shared by the Files and money-trail screens (files lane).
 *
 * Nothing here writes. A route's state on the player's device comes from
 * `player.profile.journeys[route.key]` (lib/expeditions.mjs readExpeditions); which receipts the player
 * holds comes from the journal's per-fact stores. Both are read through the app's one player
 * (shell/player.tsx) — never a second usePlayer().
 */
import { useMemo, useSyncExternalStore } from 'react';
import { expeditionStatus } from '@/lib/expeditions.mjs';
import type { Route } from '../../../edition';
import { BANK_ITEMS, itemById, stateName, type BankItem } from '../../data';
import { useAppPlayer } from '../../shell/player';

// ---- the player's files ---------------------------------------------------------------------------

type RunResult = { runId: string; at: number; score: number; correct: number };
type JourneyRecord = {
  run: { id: string; cursor: number; startedAt: number; answers: readonly unknown[] } | null;
  first: RunResult | null;
  best: RunResult | null;
  last: RunResult | null;
  bestScore: number | null;
  completions: number;
  folded: boolean;
};
export type Journeys = Readonly<Record<string, JourneyRecord | undefined>>;

/** Where one file stands on this device. */
export type FileStatus = Readonly<{
  /** sealed: never started (or the last run was folded); progress: a run is open; cleared: finished once. */
  state: 'sealed' | 'progress' | 'cleared';
  /** Answers placed in the open run (0–6). */
  done: number;
  /** A run is open (a first run, or a replay of a cleared file). */
  running: boolean;
  best: { correct: number; score: number } | null;
  completions: number;
  /** Last touch (run start or last finish), for "last opened". 0 when never opened. */
  at: number;
}>;

export const CARDS = 6;
const SEALED: FileStatus = Object.freeze({ state: 'sealed', done: 0, running: false, best: null, completions: 0, at: 0 });

export function fileStatus(route: Route | null | undefined, journeys: Journeys): FileStatus {
  if (!route) return SEALED;
  const record = journeys[route.key];
  if (!record) return SEALED;
  const status = expeditionStatus(record) as 'new' | 'continue' | 'complete';
  const running = status === 'continue' && !!record.run;
  const done = running && record.run ? Math.min(CARDS, record.run.answers.length) : 0;
  const best = record.best ?? record.first;
  const at = Math.max(record.run?.startedAt ?? 0, record.last?.at ?? 0, record.first?.at ?? 0);
  return Object.freeze({
    state: record.first ? 'cleared' : running ? 'progress' : 'sealed',
    done,
    running,
    best: best ? { correct: best.correct, score: Math.max(best.score, record.bestScore ?? best.score) } : null,
    completions: record.completions ?? 0,
    at,
  });
}

/** The app player's journeys and journal, typed for the file screens. */
export function usePlayerFiles() {
  const player = useAppPlayer();
  const profile = player.profile as { journeys?: Journeys; journal?: { facts?: object; cards?: object } } | null;
  const journeys: Journeys = profile?.journeys ?? {};
  const journal = profile?.journal;
  const held = useMemo(() => {
    const ids = new Set<string>();
    for (const store of [journal?.facts, journal?.cards]) if (store) for (const id of Object.keys(store)) ids.add(id);
    return ids;
  }, [journal?.facts, journal?.cards]);
  return { journeys, held, loaded: !!player.loaded };
}

/** The file the player touched last among `routes`, or null. */
export function lastOpened(routes: readonly Route[], journeys: Journeys): Route | null {
  let pick: Route | null = null;
  let at = 0;
  for (const r of routes) {
    const s = fileStatus(r, journeys);
    if (s.at > at) {
      at = s.at;
      pick = r;
    }
  }
  return pick;
}

/** The first file that is not cleared (an open run first), else the first file. */
export function nextUnfinished(routes: readonly Route[], journeys: Journeys): Route | null {
  const statuses = routes.map((r) => [r, fileStatus(r, journeys)] as const);
  return (
    statuses.find(([, s]) => s.state === 'progress')?.[0] ??
    statuses.find(([, s]) => s.state === 'sealed')?.[0] ??
    routes[0] ??
    null
  );
}

// ---- copy ----------------------------------------------------------------------------------------------

/** The typed file number on a cover: 'F.No. S/UP', 'F.No. X/FARM', 'F.No. KHAATA/2020-26'. */
export function fileNo(route: Route): string {
  const tail = route.code.split('/').pop()?.trim() ?? route.code;
  if (route.kind === 'state' && route.state) return `F.No. S/${route.state}`;
  if (route.kind === 'sector') return `F.No. X/${tail}`;
  return `F.No. ${route.code.replace(/\s*\/\s*/g, '/')}`;
}

/** 'Best 5/6 · 18 pts' (Latin digits). */
export const bestText = (best: FileStatus['best']) => (best ? `Best ${best.correct}/${CARDS} · ${best.score} pts` : '');

/** The primary-button words for a file, by where the player stands. */
export function openWords(status: FileStatus, t: (en: string, hi?: string) => string): string {
  if (status.running) return t(`Resume file · ${status.done} of ${CARDS}`, `फ़ाइल जारी रखो · ${status.done}/${CARDS}`);
  if (status.state === 'cleared') return t('Replay file', 'फ़ाइल दोबारा खोलो');
  return t('Open file', 'फ़ाइल खोलो');
}

/** One status line in words (never colour alone). */
export function statusWords(status: FileStatus, t: (en: string, hi?: string) => string): string {
  if (status.state === 'cleared')
    return status.running
      ? t(`Cleared · replay open, ${status.done} of ${CARDS} answered`, `क्लियर · दोबारा: ${status.done}/${CARDS}`)
      : t('Cleared', 'क्लियर');
  if (status.state === 'progress') return t(`${status.done} of ${CARDS} answered`, `${status.done}/${CARDS} जवाब`);
  return t('Sealed. Tape cut on first card.', 'सील। पहले कार्ड पर फ़ीता कटेगा।');
}

/**
 * The honest card line for a state file (bible §11.3, ENGINE §7): "4 receipts from Assam, 2 from the
 * Centre." when topped up, else "6 cards · 8 on file".
 */
export function stateCardsLine(route: Route): string {
  const name = stateName(route.state ?? '');
  if (route.padded.length) return `${route.ownCount} receipts from ${name}, ${route.padded.length} from the Centre.`;
  return `${CARDS} cards · ${route.poolSize} on file`;
}

// ---- bank slices -------------------------------------------------------------------------------------

/** Items of a route, in card order (missing ids dropped). */
export const routeItems = (route: Route): BankItem[] => route.ids.map((id) => itemById(id)).filter((q): q is BankItem => !!q);

/** Every registered item carrying a money-trail tag. */
export const taggedItems = (tag: string): BankItem[] => BANK_ITEMS.filter((q) => q.tags?.includes(tag as never));

/** The publisher half of a sourceLabel: 'Alt News — title (date)' → 'Alt News'. */
export function publisher(label: string): string {
  const cut = label.split(/\s[—–-]\s/)[0]?.trim() ?? '';
  return cut.length > 0 && cut.length <= 48 ? cut : '';
}

/** Distinct values, sorted with the locale collator. */
export function distinctSorted(values: Iterable<string>): string[] {
  const set = new Set<string>();
  for (const v of values) if (v) set.add(v);
  return [...set].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

// ---- layout ------------------------------------------------------------------------------------------

const noopSubscribe = () => () => {};
/** A CSS media query as React state (SSR-safe; follows resizes). */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    typeof window === 'undefined'
      ? noopSubscribe
      : (fn) => {
          const mq = window.matchMedia(query);
          mq.addEventListener('change', fn);
          return () => mq.removeEventListener('change', fn);
        },
    () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches),
    () => false,
  );
}

/** Scroll an element into view only if it is off screen (smooth unless reduced motion). */
export function revealIfHidden(el: Element | null) {
  if (!el || typeof window === 'undefined') return;
  const rect = el.getBoundingClientRect();
  const viewH = window.innerHeight || document.documentElement.clientHeight;
  if (rect.top >= 56 && rect.top < viewH - 80) return;
  const reduced =
    document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
