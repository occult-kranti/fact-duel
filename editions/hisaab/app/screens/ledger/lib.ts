/**
 * screens/ledger/lib.ts — the data shaping behind "Paisa Kahan Gaya?", the money ledger (#/money/ledger).
 *
 * Pure functions over the rows of editions/hisaab/data/money-ledger.json (field reference:
 * money-ledger.schema.md). Nothing here fetches, writes or invents: every count is counted from the
 * rows it is given, every string is the row's own. tests/hisaab-ledger.test.mjs runs all of it in node.
 *
 *   filters  ← parseFilters(route.query, rows)        unknown values are reported, never guessed
 *   rows     ← filterRows(all, filters) → sortRows(…, 'new')
 *   facets   ← facetCounts(all, filters)              each option's count under the OTHER filters
 *   chart    ← yearModeCounts(rows, yearsFor(filters)) measures per year, one series per mode
 *   vote     ← pollGroups(rows), gapBins(rows)         timing before a poll + the official result
 *
 * Charter §4b: timing is a fact, motive is not, and nothing here says what caused a result. `party` is
 * who governed at that level when the measure came — a label for filtering, never a colour.
 */
import { MONEY_ERAS, MONEY_YEARS } from '../../../edition';
import { stateName, type EnactedBy } from '../../data';

// ---- the row ----------------------------------------------------------------------------------------

export type LedgerMode = 'distribution' | 'relief' | 'pre-election';
export const LEDGER_MODES: readonly LedgerMode[] = Object.freeze(['distribution', 'relief', 'pre-election']);
export type LedgerLevel = 'Centre' | 'State';
export const LEDGER_LEVELS: readonly LedgerLevel[] = Object.freeze(['Centre', 'State']);

export type LedgerPoll = Readonly<{ label: string; month: string; gapDays?: number; result: string }>;

export type LedgerRow = Readonly<{
  id: string;
  name: string;
  mode: LedgerMode;
  level: LedgerLevel;
  state: string;
  /** 'YYYY' or 'YYYY-MM'. */
  launched: string;
  /** The bank gives no launch date: `launched` is the earliest date it gives ("active by"). */
  launchedApprox?: boolean;
  enactedBy: readonly EnactedBy[];
  party: string;
  benefit: string;
  reach?: string;
  annualCost?: string;
  poll?: LedgerPoll;
  outcome: string;
  /** A bundle whose parts have rows of their own (its costs overlap theirs). */
  package?: boolean;
  tags: readonly string[];
  itemIds: readonly string[];
  sourceUrl: string;
  sourceLabel: string;
}>;

// ---- dates ------------------------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const launchYear = (row: Pick<LedgerRow, 'launched'>) => Number(row.launched.slice(0, 4));

/** A sort key where a year-only date sorts before the months of that year: '2023' → '2023-00'. */
export const launchKey = (row: Pick<LedgerRow, 'launched'>) => (row.launched.length === 4 ? `${row.launched}-00` : row.launched);

/** 'Jun 2023', '2023', or 'by 2000' for a row the bank gives no launch date for. */
export function launchedText(row: Pick<LedgerRow, 'launched' | 'launchedApprox'>): string {
  const [y, m] = row.launched.split('-');
  const month = m ? MONTHS[Number(m) - 1] : undefined;
  const text = month ? `${month} ${y}` : y;
  return row.launchedApprox ? `by ${text}` : text;
}

/** 'Nov 2023' for a poll month. */
export function monthText(ym: string): string {
  const [y, m] = ym.split('-');
  const month = m ? MONTHS[Number(m) - 1] : undefined;
  return month ? `${month} ${y}` : y;
}

export type SortOrder = 'new' | 'old';

/** The schema's order (launched, then state, then id); 'new' flips the dates and keeps the tie-breaks. */
export function sortRows(rows: readonly LedgerRow[], order: SortOrder = 'old'): LedgerRow[] {
  const sign = order === 'new' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const k = launchKey(a).localeCompare(launchKey(b));
    if (k) return k * sign;
    return a.state.localeCompare(b.state) || a.id.localeCompare(b.id);
  });
}

/** Consecutive rows of one launch year, in the order given. */
export function groupByYear(rows: readonly LedgerRow[]): { year: number; rows: LedgerRow[] }[] {
  const out: { year: number; rows: LedgerRow[] }[] = [];
  for (const r of rows) {
    const y = launchYear(r);
    const last = out[out.length - 1];
    if (last && last.year === y) last.rows.push(r);
    else out.push({ year: y, rows: [r] });
  }
  return out;
}

// ---- words ------------------------------------------------------------------------------------------

/** "Shivraj Singh Chouhan · Chief Minister, Madhya Pradesh · BJP" (the public act of passing it). */
export const enactedText = (e: EnactedBy) => `${e.name} · ${e.role} · ${e.party}`;

/** "Centre · Uttar Pradesh", "State · Kerala", "Centre · India-wide". */
export function placeText(row: Pick<LedgerRow, 'level' | 'state'>): string {
  const where = row.state === 'IN' ? 'India-wide' : stateName(row.state);
  return `${row.level} · ${where}`;
}

/** "160 days before polling", "1 day before polling", or null when the bank records no gap. */
export function gapText(gap: number | null | undefined): string | null {
  if (typeof gap !== 'number') return null;
  return `${new Intl.NumberFormat('en-IN').format(gap)} ${gap === 1 ? 'day' : 'days'} before polling`;
}

// ---- filters ----------------------------------------------------------------------------------------

export type LedgerFilters = Readonly<{
  mode: LedgerMode | null;
  level: LedgerLevel | null;
  /** A state code as in the data ('UP'; 'IN' = India-wide). */
  state: string | null;
  /** The governing party or coalition, as in the data ('BJP', 'NDA', 'JD(U)'). */
  party: string | null;
  /** An era id from edition.ts MONEY_ERAS ('2020-2026'). */
  era: string | null;
  /** Free text (every word must appear somewhere in the row). */
  q: string;
}>;

export type FilterKey = keyof LedgerFilters;
export const FILTER_KEYS: readonly FilterKey[] = Object.freeze(['mode', 'level', 'state', 'party', 'era', 'q']);

export const NO_FILTERS: LedgerFilters = Object.freeze({ mode: null, level: null, state: null, party: null, era: null, q: '' });

/** The query-string key for each filter: #/money/ledger?mode=relief&level=state&s=UP&p=BJP&era=2020-2026&q=… */
export const QUERY_KEYS: Readonly<Record<FilterKey, string>> = Object.freeze({
  mode: 'mode',
  level: 'level',
  state: 's',
  party: 'p',
  era: 'era',
  q: 'q',
});

export const Q_MAX = 80;

export type ParsedFilters = Readonly<{
  filters: LedgerFilters;
  /** Query pairs that named no known value ('s=XX'): shown to the reader, not silently dropped. */
  ignored: readonly string[];
}>;

/** Filters from a route query. Values are matched against what the rows actually hold. */
export function parseFilters(query: Readonly<Record<string, string>>, rows: readonly LedgerRow[]): ParsedFilters {
  const ignored: string[] = [];
  const pick = <T extends string>(key: FilterKey, known: readonly T[]): T | null => {
    const raw = query[QUERY_KEYS[key]];
    if (raw === undefined || raw === '') return null;
    const hit = known.find((k) => k.toLowerCase() === raw.trim().toLowerCase());
    if (!hit) ignored.push(`${QUERY_KEYS[key]}=${raw}`);
    return hit ?? null;
  };
  const states = [...new Set(rows.map((r) => r.state))];
  const parties = [...new Set(rows.map((r) => r.party))];
  const q = (query[QUERY_KEYS.q] ?? '').replace(/\s+/g, ' ').trim().slice(0, Q_MAX);
  return {
    filters: {
      mode: pick('mode', LEDGER_MODES),
      level: pick('level', LEDGER_LEVELS),
      state: pick('state', states),
      party: pick('party', parties),
      era: pick('era', MONEY_ERAS.map((e) => e.id)),
      q,
    },
    ignored,
  };
}

/** The route query for a set of filters (empty values left out; level in lower case). */
export function filtersQuery(f: LedgerFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.mode) out[QUERY_KEYS.mode] = f.mode;
  if (f.level) out[QUERY_KEYS.level] = f.level.toLowerCase();
  if (f.state) out[QUERY_KEYS.state] = f.state;
  if (f.party) out[QUERY_KEYS.party] = f.party;
  if (f.era) out[QUERY_KEYS.era] = f.era;
  if (f.q) out[QUERY_KEYS.q] = f.q;
  return out;
}

export const activeFilters = (f: LedgerFilters): FilterKey[] => FILTER_KEYS.filter((k) => (k === 'q' ? !!f.q : f[k] !== null));

/** The era a year falls in. */
export const eraOf = (year: number) => MONEY_ERAS.find((e) => year >= e.from && year <= e.to) ?? null;

/** The years the chart spans for these filters: the era's, else 2000–2026. */
export function yearsFor(f: Pick<LedgerFilters, 'era'>): number[] {
  const era = f.era ? MONEY_ERAS.find((e) => e.id === f.era) : null;
  const from = era?.from ?? MONEY_YEARS.from;
  const to = era?.to ?? MONEY_YEARS.to;
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Everything a search can find in a row: its words, people, parties, place and poll. */
export function searchBlob(row: LedgerRow): string {
  return fold(
    [
      row.id,
      row.name,
      row.benefit,
      row.reach,
      row.annualCost,
      row.outcome,
      row.party,
      row.level,
      row.state,
      stateName(row.state, { long: true }),
      ...row.enactedBy.flatMap((e) => [e.name, e.role, e.party]),
      row.poll?.label,
      row.poll?.result,
      row.sourceLabel,
    ]
      .filter(Boolean)
      .join(' \u0001 '),
  );
}

const blobs = new WeakMap<LedgerRow, string>();
const blobOf = (row: LedgerRow) => {
  let b = blobs.get(row);
  if (b === undefined) {
    b = searchBlob(row);
    blobs.set(row, b);
  }
  return b;
};

/** Does a row pass every filter (optionally ignoring one, for facet counts and hints)? */
export function matches(row: LedgerRow, f: LedgerFilters, skip?: FilterKey): boolean {
  if (skip !== 'mode' && f.mode && row.mode !== f.mode) return false;
  if (skip !== 'level' && f.level && row.level !== f.level) return false;
  if (skip !== 'state' && f.state && row.state !== f.state) return false;
  if (skip !== 'party' && f.party && row.party !== f.party) return false;
  if (skip !== 'era' && f.era && eraOf(launchYear(row))?.id !== f.era) return false;
  if (skip !== 'q' && f.q) {
    const blob = blobOf(row);
    for (const word of fold(f.q).split(' ')) if (word && !blob.includes(word)) return false;
  }
  return true;
}

export const filterRows = (rows: readonly LedgerRow[], f: LedgerFilters) => rows.filter((r) => matches(r, f));

export type Facets = Readonly<{
  mode: ReadonlyMap<LedgerMode, number>;
  level: ReadonlyMap<LedgerLevel, number>;
  state: ReadonlyMap<string, number>;
  party: ReadonlyMap<string, number>;
  era: ReadonlyMap<string, number>;
  /** Rows matching every filter but the one being counted, per dimension ("All" option counts). */
  all: Readonly<Record<'mode' | 'level' | 'state' | 'party' | 'era', number>>;
}>;

/**
 * Each option's count under the OTHER active filters, so a menu says what picking it would show.
 * Every value present in the whole ledger is listed (a zero is a real zero, not a missing option).
 */
export function facetCounts(rows: readonly LedgerRow[], f: LedgerFilters): Facets {
  const zero = <K>(keys: readonly K[]) => new Map<K, number>(keys.map((k) => [k, 0]));
  const mode = zero(LEDGER_MODES);
  const level = zero(LEDGER_LEVELS);
  const state = zero([...new Set(rows.map((r) => r.state))]);
  const party = zero([...new Set(rows.map((r) => r.party))]);
  const era = zero(MONEY_ERAS.map((e) => e.id));
  const all = { mode: 0, level: 0, state: 0, party: 0, era: 0 };
  for (const r of rows) {
    if (matches(r, f, 'mode')) {
      all.mode++;
      mode.set(r.mode, (mode.get(r.mode) ?? 0) + 1);
    }
    if (matches(r, f, 'level')) {
      all.level++;
      level.set(r.level, (level.get(r.level) ?? 0) + 1);
    }
    if (matches(r, f, 'state')) {
      all.state++;
      state.set(r.state, (state.get(r.state) ?? 0) + 1);
    }
    if (matches(r, f, 'party')) {
      all.party++;
      party.set(r.party, (party.get(r.party) ?? 0) + 1);
    }
    if (matches(r, f, 'era')) {
      const e = eraOf(launchYear(r));
      if (e) {
        all.era++;
        era.set(e.id, (era.get(e.id) ?? 0) + 1);
      }
    }
  }
  return { mode, level, state, party, era, all };
}

/** State codes for a menu: India-wide first, then states by name. */
export function stateOptions(rows: readonly LedgerRow[]): string[] {
  const codes = [...new Set(rows.map((r) => r.state))];
  return codes.sort((a, b) => (a === 'IN' ? -1 : b === 'IN' ? 1 : stateName(a).localeCompare(stateName(b))));
}

/** Parties for a menu, alphabetical (case-insensitive). */
export function partyOptions(rows: readonly LedgerRow[]): string[] {
  return [...new Set(rows.map((r) => r.party))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

/**
 * For an empty result: the one filter whose removal brings back the most rows, with that count — so the
 * empty state can say "Without the party filter: 12 measures". Null when nothing is active or nothing helps.
 */
export function relaxHint(rows: readonly LedgerRow[], f: LedgerFilters): { key: FilterKey; count: number } | null {
  let best: { key: FilterKey; count: number } | null = null;
  for (const key of activeFilters(f)) {
    let count = 0;
    for (const r of rows) if (matches(r, f, key)) count++;
    if (count > 0 && (!best || count > best.count)) best = { key, count };
  }
  return best;
}

// ---- the year chart ---------------------------------------------------------------------------------

export type YearCounts = Readonly<{ year: number; total: number; by: Readonly<Record<LedgerMode, number>> }>;

/** Measures per launch year, split by mode, for each of `years` (a year with none is a real 0). */
export function yearModeCounts(rows: readonly LedgerRow[], years: readonly number[]): YearCounts[] {
  const out = new Map<number, { year: number; total: number; by: Record<LedgerMode, number> }>(
    years.map((y) => [y, { year: y, total: 0, by: { distribution: 0, relief: 0, 'pre-election': 0 } }]),
  );
  for (const r of rows) {
    const c = out.get(launchYear(r));
    if (!c) continue;
    c.total++;
    c.by[r.mode]++;
  }
  return [...out.values()];
}

// ---- before the vote --------------------------------------------------------------------------------

export function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** The gap bands (days before the first polling day), the same as docs/hisaab/research/money-trail.md §2. */
export const GAP_BANDS: ReadonlyArray<Readonly<{ id: string; from: number; to: number; label: string }>> = Object.freeze([
  { id: 'd30', from: 0, to: 30, label: 'Within 30 days' },
  { id: 'd90', from: 31, to: 90, label: '31–90 days' },
  { id: 'd180', from: 91, to: 180, label: '91–180 days' },
  { id: 'd365', from: 181, to: 365, label: '181–365 days' },
  { id: 'd366', from: 366, to: Infinity, label: 'Over a year' },
]);

export type GapSummary = Readonly<{
  /** Rows carrying a poll (the measure preceded an election). */
  withPoll: number;
  /** …of which the bank records the gap in days. */
  withGap: number;
  median: number | null;
  min: number | null;
  max: number | null;
  bands: ReadonlyArray<Readonly<{ id: string; label: string; from: number; to: number; count: number }>>;
}>;

export function gapSummary(rows: readonly LedgerRow[]): GapSummary {
  const polled = rows.filter((r) => r.poll);
  const gaps = polled.map((r) => r.poll?.gapDays).filter((g): g is number => typeof g === 'number');
  return {
    withPoll: polled.length,
    withGap: gaps.length,
    median: median(gaps),
    min: gaps.length ? Math.min(...gaps) : null,
    max: gaps.length ? Math.max(...gaps) : null,
    bands: GAP_BANDS.map((b) => ({ ...b, count: gaps.filter((g) => g >= b.from && g <= b.to).length })),
  };
}

/** Words that do not change what a result line says ("won", "seats", "(ECI)", "Hung House"). */
const RESULT_FILLER = new Set(['a', 'the', 'of', 'won', 'seats', 'seat', 'with', 'and', 'house', 'eci', 'formed', 'government', 'govt', 'its']);

/** The facts in a result line: its party names and numbers, as a set of lower-case tokens. */
const resultTokens = (s: string) =>
  new Set(
    fold(s)
      .replace(/[’']/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w && !RESULT_FILLER.has(w)),
  );

/**
 * The distinct official-result lines of a poll, verbatim. A line that says nothing another line does not
 * (its parties and numbers are all in the other: "BJP won 312 of 403 seats" beside "BJP won 312 of 403
 * seats; SP 47", or "TVK won 108 of 234 (ECI)" beside "TVK won 108 of 234 seats") is dropped, keeping
 * the fuller line; lines that differ in any party or number are all kept, so a difference between two
 * bank items stays visible (Maharashtra 2024: 235 "with allies" and 230).
 */
export function distinctResults(results: readonly string[]): string[] {
  const lines = [...new Set(results.filter(Boolean))];
  const toks = lines.map(resultTokens);
  const covers = (a: Set<string>, b: Set<string>) => [...b].every((w) => a.has(w));
  return lines.filter((line, i) =>
    !lines.some((other, j) => {
      if (j === i || !covers(toks[j], toks[i])) return false;
      // `other` says everything `line` does: drop `line` unless it is the fuller (or, if equal, the first) of the two.
      if (!covers(toks[i], toks[j])) return true;
      return other.length > line.length || (other.length === line.length && j < i);
    }),
  );
}

export type PollMeasure = Readonly<{ row: LedgerRow; gapDays: number | null }>;
export type PollGroup = Readonly<{
  key: string;
  label: string;
  month: string;
  results: readonly string[];
  /** Nearest to polling day first; a measure with no recorded gap last. */
  measures: readonly PollMeasure[];
}>;

/** One group per poll (label + month) that a filtered row preceded; the newest poll first. */
export function pollGroups(rows: readonly LedgerRow[]): PollGroup[] {
  const groups = new Map<string, { key: string; label: string; month: string; results: string[]; measures: PollMeasure[] }>();
  for (const row of rows) {
    const p = row.poll;
    if (!p) continue;
    const key = `${p.month}|${p.label}`;
    let g = groups.get(key);
    if (!g) {
      g = { key, label: p.label, month: p.month, results: [], measures: [] };
      groups.set(key, g);
    }
    g.results.push(p.result);
    g.measures.push({ row, gapDays: typeof p.gapDays === 'number' ? p.gapDays : null });
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      results: distinctResults(g.results),
      measures: [...g.measures].sort((a, b) => (a.gapDays ?? Infinity) - (b.gapDays ?? Infinity) || a.row.id.localeCompare(b.row.id)),
    }))
    .sort((a, b) => b.month.localeCompare(a.month) || a.label.localeCompare(b.label));
}

/**
 * The shared day axis for the before-the-vote strips: the band edges that the data reaches, so a view
 * whose longest gap is 160 days is not squeezed into a 600-day axis. Always ends on a band edge.
 */
export function gapDomain(maxGap: number | null): number {
  const edges = [30, 90, 180, 365, 600];
  const m = maxGap ?? 0;
  return edges.find((e) => m <= e) ?? Math.ceil(m / 100) * 100;
}

/** Tick marks for a day axis ending at `domain`: 0 (polling day) and every band edge inside it. */
export const gapTicks = (domain: number) => [0, 30, 90, 180, 365].filter((t) => t <= domain).concat(domain > 365 ? [domain] : []);
