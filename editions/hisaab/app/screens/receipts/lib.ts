/**
 * screens/receipts/lib.ts — the Receipts Vault's data (design bible §11.15), pure: which receipts the
 * player holds, what each one says now, filters, and the one thing that is "due".
 *
 *  - DUE (Dobara Jaanch, review): the engine's spaced-repetition queue (lib/journal-review.mjs `isDue`),
 *    run as untimed cards. XP for it is the engine's own review rate. This is the Vault's primary.
 *  - STATUS OLDER THAN SIX MONTHS (`stale`): the receipt's legal/editorial status was last verified
 *    (`asOf`) more than six months ago. A neutral note about the bank, never called "due": the player
 *    can open the source and tell us if it changed (Rules › Report). Not a game mechanic.
 *  - WITHDRAWN: the item has left the bank. It is never dealt again, and its detail shows only that it
 *    was withdrawn (charter §2.2/§2.3: what a withdrawal pulls stops being shown).
 *
 * A receipt is a bank fact the journal holds (journal.facts, journal.cards and duel rounds) — the same
 * count Home's tijori shows. What it SAYS is the bank's current item; the snapshot the journal took at
 * collection time is kept to show "updated since you collected it", and to show a receipt whose item
 * has since been withdrawn from the bank.
 */
import { isDue, REVIEW_CAP, sessionOrder } from '@/lib/journal-review.mjs';
import { dayKey } from '@/lib/journal.mjs';
import { itemById, sourceKind, type BankItem, type SourceKind } from '../../data';

export type Surface = 'duel' | 'expedition' | 'discovery' | 'recall' | 'event';

type FactRecord = {
  topic: string;
  seen?: number;
  correct?: number;
  firstAt?: number | null;
  lastAt?: number | null;
  lastCorrect?: boolean;
  bySurface?: Partial<Record<Surface, number>>;
  due?: number | null;
  retiredAt?: number | null;
};
type CardSnap = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  subtopic: string;
  sourceUrl: string;
  sourceLabel: string;
};
type RoundEntry = {
  factId?: string;
  /** A duel room id, or 'practice' for route cards and Aaj Ka Hisaab (both journal a round too). */
  matchId?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  subtopic: string;
  sourceUrl: string;
  sourceLabel: string;
  at: number;
  correct: boolean | null;
};
export type JournalLike = {
  facts?: Record<string, FactRecord>;
  cards?: Record<string, CardSnap>;
  rounds?: RoundEntry[];
  seed?: unknown;
} | null | undefined;

export type ReceiptRow = Readonly<{
  id: string;
  /** The bank item as it stands now (null when it has been withdrawn from the bank). */
  item: BankItem | null;
  question: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  subtopic: string;
  sourceUrl: string;
  sourceLabel: string;
  sourceKind: SourceKind;
  state: string | null;
  year: number | null;
  asOf: string | null;
  status: string | null;
  firstAt: number | null;
  lastAt: number | null;
  seen: number;
  right: number;
  lastCorrect: boolean | null;
  surfaces: readonly Surface[];
  /** In the engine's review queue now (Dobara Jaanch). */
  reviewDue: boolean;
  /** asOf older than STALE_MONTHS: "Status older than 6 months" (a neutral note, not a task). */
  stale: boolean;
  /** The bank's noting changed since this receipt was collected. */
  updated: boolean;
  /** What the noting said when collected (only when `updated`). */
  oldExplanation: string | null;
  withdrawn: boolean;
}>;

/** A status verified longer ago than this many months is noted "Status older than N months". */
export const STALE_MONTHS = 6;

/** Whole months from an 'YYYY-MM' asOf to `now` (0 in the same month). */
export function monthsSince(asOf: string | null | undefined, now: number = Date.now()): number {
  const m = /^(\d{4})-(\d{2})$/.exec(asOf ?? '');
  if (!m) return 0;
  const d = new Date(now);
  return d.getFullYear() * 12 + d.getMonth() - (Number(m[1]) * 12 + Number(m[2]) - 1);
}
export const isStale = (asOf: string | null | undefined, now: number = Date.now()) => monthsSince(asOf, now) > STALE_MONTHS;

/** Every fact id the journal holds (facts ∪ duel rounds) — the tijori count. */
export function receiptIds(journal: JournalLike): string[] {
  const ids = new Set<string>(Object.keys(journal?.facts ?? {}));
  for (const r of journal?.rounds ?? []) if (r.factId) ids.add(r.factId);
  return [...ids];
}
export const countReceipts = (journal: JournalLike) => receiptIds(journal).length;

/** Every receipt, newest answer first. */
export function collectReceipts(journal: JournalLike, now: number = Date.now()): ReceiptRow[] {
  const facts = journal?.facts ?? {};
  const cards = journal?.cards ?? {};
  const rounds = journal?.rounds ?? [];
  const byRound = new Map<string, RoundEntry[]>();
  for (const r of rounds) {
    if (!r.factId) continue;
    const list = byRound.get(r.factId) ?? [];
    list.push(r);
    byRound.set(r.factId, list);
  }
  const rows: ReceiptRow[] = [];
  for (const id of receiptIds(journal)) {
    const item = itemById(id);
    const fact = facts[id] ?? null;
    const snap = cards[id] ?? null;
    const all = byRound.get(id) ?? [];
    const duel = all.filter((r) => r.matchId !== 'practice');
    const lastRound = duel.reduce<RoundEntry | null>((a, b) => (!a || b.at > a.at ? b : a), null);
    const firstRound = duel.reduce<RoundEntry | null>((a, b) => (!a || b.at < a.at ? b : a), null);
    // What it says: the bank now, else the journal's own copy.
    const content =
      item ??
      (snap
        ? { ...snap, correctIndex: snap.correctIndex }
        : all[0]
          ? { ...all[0], correctIndex: Math.max(0, all[0].options.indexOf(all[0].correctAnswer)) }
          : null);
    if (!content) continue;
    const surfaces = new Set<Surface>();
    for (const [s, n] of Object.entries(fact?.bySurface ?? {})) if ((n ?? 0) > 0) surfaces.add(s as Surface);
    if (duel.length) surfaces.add('duel');
    const firstAt = fact?.firstAt ?? firstRound?.at ?? null;
    const lastAt = Math.max(fact?.lastAt ?? 0, lastRound?.at ?? 0) || null;
    const seen = fact ? (fact.seen ?? 0) : duel.length;
    const right = fact ? (fact.correct ?? 0) : duel.filter((r) => r.correct === true).length;
    const lastCorrect =
      fact && typeof fact.lastCorrect === 'boolean' && (fact.lastAt ?? 0) >= (lastRound?.at ?? 0)
        ? fact.lastCorrect
        : (lastRound?.correct ?? null);
    const oldText = snap?.explanation ?? all.reduce<RoundEntry | null>((a, b) => (!a || b.at < a.at ? b : a), null)?.explanation ?? null;
    const updated = !!item && oldText !== null && oldText.trim() !== item.explanation.trim();
    rows.push(
      Object.freeze({
        id,
        item,
        question: content.question,
        options: content.options,
        correctIndex: content.correctIndex,
        explanation: content.explanation,
        topic: content.topic,
        subtopic: content.subtopic,
        sourceUrl: content.sourceUrl,
        sourceLabel: content.sourceLabel,
        sourceKind: sourceKind(content),
        state: item?.state ?? null,
        year: item?.year ?? null,
        asOf: item?.asOf ?? null,
        status: item?.status ?? null,
        firstAt,
        lastAt,
        seen,
        right,
        lastCorrect,
        surfaces: [...surfaces],
        reviewDue: !!fact && isDue(fact, now),
        stale: !!item && isStale(item.asOf, now),
        updated,
        oldExplanation: updated ? oldText : null,
        withdrawn: !item,
      }),
    );
  }
  rows.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0) || a.id.localeCompare(b.id));
  return rows;
}

// ---- filters -------------------------------------------------------------------------------------------

export type StatusFilter = 'due' | 'legal' | 'right' | 'missed' | 'updated';
export type ModeFilter = 'files' | 'aaj' | 'duel' | 'recheck' | 'forward' | 'media' | 'distribution' | 'relief' | 'pre-election';

export type Filters = Readonly<{
  q: string;
  sector: string;
  state: string;
  mode: ModeFilter | '';
  status: StatusFilter | '';
  src: SourceKind | '';
}>;

export const EMPTY_FILTERS: Filters = Object.freeze({ q: '', sector: '', state: '', mode: '', status: '', src: '' });

export const STATUS_FILTERS: ReadonlyArray<{ id: StatusFilter; en: string; hi: string }> = Object.freeze([
  { id: 'due', en: `Status older than ${STALE_MONTHS} months`, hi: `${STALE_MONTHS} महीने से पुरानी स्थिति` },
  { id: 'legal', en: 'Has a legal status', hi: 'क़ानूनी स्थिति वाली' },
  { id: 'right', en: 'Answered right', hi: 'सही जवाब' },
  { id: 'missed', en: 'Missed', hi: 'छूटे' },
  { id: 'updated', en: 'Updated since collected', hi: 'बाद में बदली' },
]);

export const MODE_FILTERS: ReadonlyArray<{ id: ModeFilter; en: string; group: 'played' | 'file' }> = Object.freeze([
  { id: 'files', en: 'Files (Rajya, Sector and the rest)', group: 'played' },
  { id: 'aaj', en: 'Aaj Ka Hisaab and one-card links', group: 'played' },
  { id: 'duel', en: 'Duels', group: 'played' },
  { id: 'recheck', en: 'Dobara Jaanch', group: 'played' },
  { id: 'forward', en: 'Forward Court', group: 'file' },
  { id: 'media', en: 'Kiska Media?', group: 'file' },
  { id: 'distribution', en: 'Seedha Khaate Mein', group: 'file' },
  { id: 'relief', en: 'Rahat Kosh', group: 'file' },
  { id: 'pre-election', en: 'Chunav Se Pehle', group: 'file' },
]);

const SURFACE_OF: Partial<Record<ModeFilter, Surface>> = { files: 'expedition', aaj: 'discovery', duel: 'duel', recheck: 'recall' };

function matchesMode(row: ReceiptRow, mode: ModeFilter): boolean {
  const surface = SURFACE_OF[mode];
  if (surface) return row.surfaces.includes(surface);
  if (mode === 'forward') return row.item?.kind === 'forward';
  if (mode === 'media') return row.topic === 'Media & Speech';
  return !!row.item?.tags?.includes(mode as 'distribution' | 'relief' | 'pre-election');
}

function matchesStatus(row: ReceiptRow, status: StatusFilter): boolean {
  switch (status) {
    case 'due':
      return row.stale;
    case 'legal':
      return !!row.status;
    case 'right':
      return row.lastCorrect === true;
    case 'missed':
      return row.lastCorrect === false;
    case 'updated':
      return row.updated || row.withdrawn;
  }
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function applyFilters(rows: readonly ReceiptRow[], f: Filters): ReceiptRow[] {
  const q = norm(f.q.trim());
  return rows.filter(
    (r) =>
      (!f.sector || r.topic === f.sector) &&
      (!f.state || r.state === f.state) &&
      (!f.mode || matchesMode(r, f.mode)) &&
      (!f.status || matchesStatus(r, f.status)) &&
      (!f.src || r.sourceKind === f.src) &&
      // A withdrawn receipt is found by its id only: its stem and answer are no longer shown anywhere.
      (!q || norm(r.withdrawn ? r.id : `${r.id} ${r.question} ${r.subtopic} ${r.topic} ${r.sourceLabel} ${r.options[r.correctIndex] ?? ''}`).includes(q)),
  );
}

/** Filters from the route query (unknown values are dropped). */
export function filtersFromQuery(query: Readonly<Record<string, string>>): Filters {
  const status = STATUS_FILTERS.some((s) => s.id === query.status) ? (query.status as StatusFilter) : '';
  const mode = MODE_FILTERS.some((m) => m.id === query.mode) ? (query.mode as ModeFilter) : '';
  return Object.freeze({
    q: (query.q ?? '').slice(0, 80),
    sector: query.sector ?? '',
    state: query.state ?? '',
    mode,
    status,
    src: (query.src as SourceKind) ?? '',
  });
}

export function filtersToQuery(f: Filters, extra: Record<string, string | undefined> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...f, ...extra })) if (v) out[k] = String(v);
  return out;
}

export const activeFilterCount = (f: Filters) => [f.sector, f.state, f.mode, f.src].filter(Boolean).length;

/** Distinct values with counts, for the select options (only values the player actually holds). */
export function facet<T extends string>(rows: readonly ReceiptRow[], pick: (r: ReceiptRow) => T | null | undefined): Array<{ value: T; count: number }> {
  const map = new Map<T, number>();
  for (const r of rows) {
    const v = pick(r);
    if (v) map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()].map(([value, count]) => ({ value, count }));
}

// ---- Dobara Jaanch -----------------------------------------------------------------------------------

/**
 * Today's review queue (the engine's order, capped at 12), limited to receipts with a playable card that
 * is still in the bank: a withdrawn item is never dealt as a quiz again.
 *
 * A receipt first filed TODAY and never yet answered in the Vault is not "due": the engine files a
 * fact met in a file, Aaj or a duel as due the moment it is met (`due: at`, box 0), which on day one
 * turned every card the player had just answered into "Re-check 12 due" minutes later. Its first look
 * is tomorrow, as the ladder's first box (1 day) intends. A deck §3.5 seeded today (after a bad run)
 * is dealt as seeded.
 */
export function reviewQueue(journal: JournalLike, rows: readonly ReceiptRow[], now: number = Date.now()): string[] {
  const playable = new Set(rows.filter((r) => r.options.length === 4 && !r.withdrawn).map((r) => r.id));
  const today = dayKey(now);
  const seed = journal?.seed as { at?: unknown; factIds?: unknown } | undefined;
  const seeded = new Set<string>(
    seed && typeof seed.at === 'number' && dayKey(seed.at) === today && Array.isArray(seed.factIds)
      ? (seed.factIds.filter((x) => typeof x === 'string') as string[])
      : [],
  );
  const facts = journal?.facts ?? {};
  const filedToday = (id: string) => {
    const f = facts[id];
    return !!f && typeof f.firstAt === 'number' && dayKey(f.firstAt) === today && !((f.bySurface?.recall ?? 0) > 0);
  };
  return (sessionOrder(journal, now, Infinity) as string[])
    .filter((id) => playable.has(id) && (seeded.has(id) || !filedToday(id)))
    .slice(0, REVIEW_CAP);
}
