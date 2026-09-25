/**
 * editions/hisaab/app/data.ts — read helpers over the bank and the edition facade, for every screen.
 *
 *   import { itemById, statusLine, sourceKind, stateName, labelDisplay, seatName } from '@/editions/hisaab/app/data';
 *
 * Nothing here writes anything or holds state. Copy that is a legal or honesty rule (status lines,
 * the BOT label, the certificate name rule) lives here once, so no screen re-implements it.
 * Loads in node too (tests/hisaab-ui-foundation.test.mjs): no JSX, no DOM.
 */
import { CONFIDENCE, CONFIDENCE_ORDER } from '@/lib/expeditions.mjs';
import { RANK_TIERS } from '@/lib/progression.mjs';
import { BANK } from '../bank/index.mjs';
import { SECTORS, STATES } from '../bank/schema.mjs';
import { LADDER, labelFor, standing, type Label, type MoneyTag } from '../edition';

/** The label maths from edition.ts, re-exported so screens need one import for label copy. */
export { LADDER, labelFor, labelForLevel, standing, type Label } from '../edition';

// ---- the bank ---------------------------------------------------------------------------------------

export type EnactedBy = Readonly<{ name: string; role: string; party: string }>;
export type Poll = Readonly<{ label: string; month: string; gapDays?: number; result?: string }>;
export type ItemKind = 'scheme' | 'spend' | 'scam' | 'media' | 'funding' | 'forward' | 'institution';
export type Difficulty = 'simple' | 'expert' | 'extreme';

/** One bank item (docs/hisaab/CHARTER.md §3, §3a). Optional fields are absent, never null. */
export type BankItem = Readonly<{
  id: string;
  domain: 'civics';
  region: string;
  state: string;
  topic: string;
  subtopic: string;
  kind: ItemKind;
  difficulty: Difficulty;
  year: number;
  asOf: string;
  govt: string;
  question: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
  sourceUrl: string;
  sourceLabel: string;
  sources?: readonly string[];
  status?: string;
  people?: readonly string[];
  tags?: readonly MoneyTag[];
  enactedBy?: readonly EnactedBy[];
  outcome?: string;
  poll?: Poll;
}>;

/** Every registered item (editions/hisaab/bank/index.mjs), typed. */
export const BANK_ITEMS = BANK as unknown as readonly BankItem[];

let byId: Map<string, BankItem> | null = null;
/** A bank item by id (`hsc001`), or null. */
export function itemById(id: string | null | undefined): BankItem | null {
  if (!id) return null;
  if (!byId) byId = new Map(BANK_ITEMS.map((q) => [q.id, q]));
  return byId.get(id) ?? null;
}
/** The bank item behind a dealt card or a revealed duel question (`factId`), or null. */
export const itemForCard = (card: { factId?: string | null } | null | undefined) => itemById(card?.factId ?? null);

// ---- dates and numbers ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-09' → 'Sep 2026' (Latin digits in both locales, bible §4.4). Unknown input comes back as is. */
export function monthLabel(ym: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym ?? '');
  if (!m) return String(ym ?? '');
  const i = Number(m[2]) - 1;
  return i >= 0 && i < 12 ? `${MONTHS[i]} ${m[1]}` : String(ym);
}

/** 'as of Sep 2026' (en) / 'Sep 2026 तक' (hi). */
export function asOfText(asOf: string, locale: 'en' | 'hi' = 'en'): string {
  return locale === 'hi' ? `${monthLabel(asOf)} तक` : `as of ${monthLabel(asOf)}`;
}

const numberFormat = new Intl.NumberFormat('en-IN');
/** Indian digit grouping (12,34,567), Latin digits in both locales. */
export const formatNumber = (n: number) => numberFormat.format(n);

// ---- legal status (charter §2.2) ---------------------------------------------------------------

/** The item's legal status line, VERBATIM, or null. Never paraphrase, shorten or colour it. */
export const statusLine = (item: BankItem | null | undefined): string | null => item?.status ?? null;

/**
 * The status line with its date, as it must travel in a share or an aria-label:
 * 'Accused in CBI/ED cases, not tried; … (as of Sep 2026)'. Null when the item has no status.
 */
export function statusWithAsOf(item: BankItem | null | undefined): string | null {
  const line = statusLine(item);
  return line && item ? `${line} (${asOfText(item.asOf)})` : null;
}

// ---- sources ---------------------------------------------------------------------------------------

/**
 * The source-type chip on a receipt (bible §5 `h-chip--source`). The bible's nine, plus OFFICIAL
 * (ministry and scheme portals that are not PIB), FILING (company disclosures, Kiska Media §11.5) and
 * RESEARCH (PRS, ADR, RSF, Media Ownership Monitor…), so no NGO or portal is passed off as a court or
 * a newspaper.
 */
export type SourceKind =
  | 'COURT'
  | 'CAG'
  | 'SANSAD'
  | 'PIB'
  | 'ECI'
  | 'RBI'
  | 'AGENCY'
  | 'OFFICIAL'
  | 'FILING'
  | 'RESEARCH'
  | 'FACT-CHECK'
  | 'PRESS';

export const SOURCE_KINDS: readonly SourceKind[] = Object.freeze([
  'COURT',
  'CAG',
  'SANSAD',
  'PIB',
  'ECI',
  'RBI',
  'AGENCY',
  'OFFICIAL',
  'FILING',
  'RESEARCH',
  'FACT-CHECK',
  'PRESS',
]);

/** What each chip means, for its title/aria text and the Rules page. */
export const SOURCE_KIND_TEXT: Readonly<Record<SourceKind, string>> = Object.freeze({
  COURT: 'A court judgment, order or cause list',
  CAG: 'A Comptroller and Auditor General report',
  SANSAD: 'A Parliament record or answer',
  PIB: 'A Press Information Bureau release',
  ECI: 'Election Commission of India data',
  RBI: 'Reserve Bank of India data',
  AGENCY: 'An investigating or regulating agency (CBI, ED, SEBI, Lokpal)',
  OFFICIAL: 'An official government portal or document',
  FILING: 'A company or stock-exchange filing',
  RESEARCH: 'An independent research or monitoring organisation',
  'FACT-CHECK': 'A fact-checker',
  PRESS: 'A news report',
});

/** 'https://www.thehindu.com/…' → 'thehindu.com' ('' for an unparsable URL). */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(www|m)\./, '');
  } catch {
    return '';
  }
}

const HOSTS: ReadonlyArray<[RegExp, SourceKind]> = [
  [/(^|\.)sci\.gov\.in$|(^|\.)ecourts\.gov\.in$|highcourt|(^|\.)hc[a-z]*\.(nic|gov)\.in$|(^|\.)nclt\.gov\.in$|(^|\.)greentribunal\.gov\.in$/, 'COURT'],
  [/(^|\.)cag\.gov\.in$/, 'CAG'],
  [/(^|\.)sansad\.in$|(^|\.)loksabha\.nic\.in$|(^|\.)rajyasabha\.nic\.in$|(^|\.)eparlib\.nic\.in$|(^|\.)loksabhadocs\.nic\.in$/, 'SANSAD'],
  [/(^|\.)pib\.gov\.in$|(^|\.)pib\.nic\.in$/, 'PIB'],
  [/(^|\.)eci\.gov\.in$/, 'ECI'],
  [/(^|\.)rbi\.org\.in$/, 'RBI'],
  [/(^|\.)cbi\.gov\.in$|(^|\.)enforcementdirectorate\.gov\.in$|(^|\.)ed\.gov\.in$|(^|\.)sebi\.gov\.in$|(^|\.)lokpal\.gov\.in$|(^|\.)cvc\.gov\.in$/, 'AGENCY'],
  [/(^|\.)altnews\.in$|(^|\.)boomlive\.in$|(^|\.)factly\.in$|(^|\.)newschecker\.in$|(^|\.)vishvasnews\.com$|(^|\.)factchecker\.in$|(^|\.)newsmeter\.in$/, 'FACT-CHECK'],
  [/(^|\.)bseindia\.com$|(^|\.)nseindia\.com$|(^|\.)mca\.gov\.in$|(^|\.)ril\.com$|(^|\.)jiostar\.com$/, 'FILING'],
  [/(^|\.)prsindia\.org$|(^|\.)adrindia\.org$|(^|\.)rsf\.org$|mom-gmr\.org$|(^|\.)internetfreedom\.in$|(^|\.)cmsindia\.org$/, 'RESEARCH'],
  // Public broadcasters' news desks are news reports, not government documents.
  [/(^|\.)newsonair\.gov\.in$|(^|\.)ddnews\.gov\.in$/, 'PRESS'],
  [/\.gov\.in$|\.nic\.in$/, 'OFFICIAL'],
];

/** Fact-check sections inside a general outlet (The Quint's WebQoof, India Today's fact check…). */
const FACT_CHECK_PATH = /\/(webqoof|fact-?check|factcheck)(\/|$)/i;

/**
 * The source-type chip for an item (or any `{ sourceUrl, sourceLabel }`), from the URL first; a
 * sourceLabel starting with 'PIB', 'CAG', 'Lok Sabha', 'Rajya Sabha' or 'ECI' decides only when the
 * URL is itself an official host.
 */
export function sourceKind(source: { sourceUrl: string; sourceLabel?: string } | null | undefined): SourceKind {
  if (!source) return 'PRESS';
  const host = sourceHost(source.sourceUrl);
  for (const [pattern, kind] of HOSTS) {
    if (!pattern.test(host)) continue;
    if (kind === 'OFFICIAL') {
      const label = source.sourceLabel ?? '';
      if (/^PIB\b/.test(label)) return 'PIB';
      if (/^CAG\b/.test(label)) return 'CAG';
      if (/^(Lok Sabha|Rajya Sabha|Parliament)\b/.test(label)) return 'SANSAD';
      if (/^(ECI|Election Commission)\b/.test(label)) return 'ECI';
    }
    return kind;
  }
  try {
    if (FACT_CHECK_PATH.test(new URL(source.sourceUrl).pathname)) return 'FACT-CHECK';
  } catch {
    /* unparsable URL: a news report by default */
  }
  return 'PRESS';
}

// ---- states, sectors, the cartogram ------------------------------------------------------------

export type StateCode = keyof typeof STATES;
/** The 30 state codes (charter order), without the Centre. */
export const STATE_CODES = Object.freeze(Object.keys(STATES).filter((c) => c !== 'IN')) as readonly string[];
/** 'UP' → 'Uttar Pradesh'; 'IN' → 'Centre'. Unknown codes come back as given. */
export const stateName = (code: string, opts: { long?: boolean } = {}) =>
  code === 'IN' ? (opts.long ? STATES.IN : 'Centre') : ((STATES as Record<string, string>)[code] ?? code);

/** Devanagari state names for the file brief (draft — a Hindi reader reviews before release). */
export const STATE_NAMES_HI: Readonly<Record<string, string>> = Object.freeze({
  IN: 'केंद्र',
  UP: 'उत्तर प्रदेश',
  UT: 'उत्तराखंड',
  HP: 'हिमाचल प्रदेश',
  PB: 'पंजाब',
  HR: 'हरियाणा',
  DL: 'दिल्ली',
  JK: 'जम्मू-कश्मीर',
  RJ: 'राजस्थान',
  BR: 'बिहार',
  JH: 'झारखंड',
  GJ: 'गुजरात',
  MH: 'महाराष्ट्र',
  GA: 'गोवा',
  MP: 'मध्य प्रदेश',
  CT: 'छत्तीसगढ़',
  KA: 'कर्नाटक',
  KL: 'केरल',
  TN: 'तमिलनाडु',
  AP: 'आंध्र प्रदेश',
  TG: 'तेलंगाना',
  WB: 'पश्चिम बंगाल',
  OD: 'ओडिशा',
  AS: 'असम',
  AR: 'अरुणाचल प्रदेश',
  MN: 'मणिपुर',
  ML: 'मेघालय',
  MZ: 'मिज़ोरम',
  NL: 'नागालैंड',
  SK: 'सिक्किम',
  TR: 'त्रिपुरा',
});
export const stateNameHi = (code: string) => STATE_NAMES_HI[code] ?? stateName(code);

/** The 13 sectors (charter §5), in order. */
export const SECTOR_LIST = SECTORS as readonly string[];
/** Devanagari sector names (draft — a Hindi reader reviews before release). */
export const SECTOR_NAMES_HI: Readonly<Record<string, string>> = Object.freeze({
  'Welfare & Subsidies': 'कल्याण और सब्सिडी',
  'Farm & Food': 'खेती और खाद्य',
  Health: 'स्वास्थ्य',
  'Education & Exams': 'शिक्षा और परीक्षाएँ',
  Infrastructure: 'बुनियादी ढाँचा',
  'Banking & Finance': 'बैंकिंग और वित्त',
  'Energy & Mining': 'ऊर्जा और खनन',
  'Defence & Security': 'रक्षा और सुरक्षा',
  'Elections & Funding': 'चुनाव और चंदा',
  'Media & Speech': 'मीडिया और अभिव्यक्ति',
  'Governance & Institutions': 'शासन और संस्थाएँ',
  'Jobs & Economy': 'रोज़गार और अर्थव्यवस्था',
  'Environment & Land': 'पर्यावरण और ज़मीन',
});

/**
 * The records-room cartogram (bible §11.3): 7 × 7, row by row, `null` for an empty cell. Not a map —
 * it makes no boundary claim. The Centre is a 4-wide drawer at the end of the last row
 * (`CARTOGRAM_CENTRE`), so row 6 lists only its first three cells.
 */
export const CARTOGRAM: ReadonlyArray<ReadonlyArray<string | null>> = Object.freeze([
  [null, null, 'JK', null, null, null, null],
  [null, 'PB', 'HP', 'UT', null, null, 'AR'],
  ['RJ', 'HR', 'DL', 'UP', 'BR', 'SK', 'AS'],
  ['GJ', 'MP', 'CT', 'JH', 'WB', 'ML', 'NL'],
  [null, 'MH', 'TG', 'OD', null, 'TR', 'MN'],
  ['GA', 'KA', 'AP', null, null, null, 'MZ'],
  [null, 'KL', 'TN'],
].map((row) => Object.freeze(row)));
/** Where the Centre drawer sits: row 6, columns 3–6 (0-based), 4 wide. */
export const CARTOGRAM_CENTRE = Object.freeze({ code: 'IN', row: 6, col: 3, span: 4 });

// ---- labels and levels (charter §1, bible §4.5) ------------------------------------------------

export type LabelDisplay = Readonly<{
  band: number;
  /** Devanagari (for the poster line; wrap it in lang="hi"). */
  hi: string;
  /** Latin, as written in the charter (display it uppercase with CSS). */
  en: string;
  /** Aside printed after the Latin label, if any: '(as per the forwards)'. */
  aside?: string;
  line: string;
  /** The Hinglish line, Latin script. */
  hinglish: string;
  from: number;
  to: number | null;
}>;

const LABEL_EXTRA: ReadonlyArray<{ hi: string; en: string; aside?: string; hinglish: string }> = [
  { hi: 'अंधभक्त', en: 'Andhbhakt', hinglish: 'Forward pehle, padhna kabhi nahi.' },
  { hi: 'व्हाट्सऐप यूनिवर्सिटी फ़्रेशर', en: 'WhatsApp University Fresher', hinglish: 'Admission ho gaya. Har group mein hazri.' },
  { hi: 'प्राइम-टाइम लॉयलिस्ट', en: 'Prime-Time Loyalist', hinglish: 'Anchor ki awaaz yaad, budget nahi.' },
  { hi: 'न्यूट्रल अंकल', en: 'Neutral Uncle', hinglish: 'Sab chor hain — kaun, yeh check nahi kiya.' },
  { hi: 'रसीद माँगो', en: 'Receipt Maango', hinglish: 'Ab bill maangne lage ho.' },
  { hi: 'आरटीआई योद्धा', en: 'RTI Warrior', hinglish: 'Sawaal file karo. 30 din ruko.' },
  { hi: 'अर्बन नक्सल', en: 'Urban Naxal', aside: '(as per the forwards)', hinglish: 'Metro mein CAG report padhta hai.' },
  { hi: 'टुकड़े-टुकड़े गैंग', en: 'Tukde-Tukde Gang', hinglish: 'Crore ko tukdon mein ginta hai.' },
  { hi: 'सर्टिफ़ाइड एंटी-नेशनल', en: 'Certified Anti-National', hinglish: 'Paisa kahan gaya, pata hai. Phir bhi poochta hai.' },
];

/** Everything a label display needs for a band (clamped to the ladder). */
export function labelDisplay(band: number): LabelDisplay {
  const rung = labelFor(band) as Label;
  const extra = LABEL_EXTRA[rung.band];
  return Object.freeze({ band: rung.band, from: rung.from, to: rung.to, line: rung.line, ...extra });
}
/** The whole ladder for display, band 0 → 8. */
export const LADDER_DISPLAY: readonly LabelDisplay[] = Object.freeze(LADDER.map((r) => labelDisplay(r.band)));

/** The first-sighting line under Andhbhakt (bible §4.5). */
export const FIRST_LABEL_NOTE = 'Everyone starts here — of anyone, for anything. Receipts get you out.';

/**
 * Goal-gradient copy for the band meter (bible §8.2): "2 levels to Receipt Maango" → "180 XP to
 * Receipt Maango" → "One good file away." At the top rung: "Top rung. Keep asking."
 */
export function goalCopy(xp: number): string {
  const s = standing(xp);
  if (s.band >= LADDER.length - 1) return 'Top rung. Keep asking.';
  const next = labelDisplay(s.band + 1);
  const levelsLeft = next.from - s.level;
  if (levelsLeft >= 2) return `${levelsLeft} levels to ${next.en}`;
  const xpLeft = Math.max(0, s.toNext - s.into);
  return xpLeft <= ONE_FILE_XP ? 'One good file away.' : `${formatNumber(xpLeft)} XP to ${next.en}`;
}
/** A first run of six cards answered well pays at least this much XP (lib/progression.mjs XP table). */
const ONE_FILE_XP = 100;

/**
 * Progress through the current band for a five-tick meter: `{ value, max: 5 }`, where each tick is a
 * level of the band (bands are five levels wide; the top band is open-ended and shows full).
 */
export function bandProgress(xp: number): { value: number; max: number } {
  const s = standing(xp);
  if (s.band >= LADDER.length - 1) return { value: 5, max: 5 };
  const first = labelDisplay(s.band).from;
  return { value: Math.min(5, s.level - first + s.progress), max: 5 };
}

// ---- duels: seats, the bot, Babu rank ---------------------------------------------------------

/** The practice bot's display name everywhere in this edition (bible §2.1). Always with BOT. */
export const BOT_NAME = 'Babu-Bot · BOT';
/** Its disclosure line — shown wherever the bot is offered or plays. */
export const BOT_LINE = "Picks at random. Can't see the question.";
/** The name used when a player has not given one (and on certificates matching a real person). */
export const ANONYMOUS = 'Anonymous Janta';

/** A seat's display name: the bot is always Babu-Bot · BOT, whatever the engine calls it. */
export function seatName(player: { kind?: string; name?: string | null } | null | undefined): string {
  if (!player) return ANONYMOUS;
  if (player.kind === 'bot') return BOT_NAME;
  const name = (player.name ?? '').trim();
  return name || ANONYMOUS;
}

/** Arena rank tiers renamed for the edition (bible §2.1, §12). "On this device" goes beside it. */
export const BABU_RANKS: Readonly<Record<string, string>> = Object.freeze({
  bronze: 'LDC',
  silver: 'Section Officer',
  gold: 'Under Secretary',
  platinum: 'Joint Secretary',
  diamond: 'Secretary',
});
export const babuRank = (tier: string | null | undefined) => BABU_RANKS[tier ?? 'bronze'] ?? BABU_RANKS.bronze;
/** The engine's tiers with the edition's names, low to high. */
export const BABU_RANK_LADDER = Object.freeze(
  (RANK_TIERS as ReadonlyArray<{ id: string; min: number }>).map((t) => Object.freeze({ id: t.id, min: t.min, label: babuRank(t.id) })),
);

// ---- confidence calls (bible §2.1) --------------------------------------------------------------

export type ConfidenceId = 'steady' | 'bold' | 'called';
export type ConfidenceDisplay = Readonly<{ id: ConfidenceId; en: string; hi: string; correct: number; wrong: number; points: string }>;
const SIGNED = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
const CONFIDENCE_NAMES: Record<ConfidenceId, { en: string; hi: string }> = {
  steady: { en: 'Shayad', hi: 'शायद' },
  bold: { en: 'Lagta hai', hi: 'लगता है' },
  called: { en: 'Pakka', hi: 'पक्का' },
};
/** Shayad / Lagta hai / Pakka with the engine's own points (lib/expeditions.mjs CONFIDENCE). */
export const CONFIDENCE_DISPLAY: readonly ConfidenceDisplay[] = Object.freeze(
  (CONFIDENCE_ORDER as readonly ConfidenceId[]).map((id) => {
    const tier = (CONFIDENCE as Record<ConfidenceId, { correct: number; wrong: number }>)[id];
    return Object.freeze({
      id,
      ...CONFIDENCE_NAMES[id],
      correct: tier.correct,
      wrong: tier.wrong,
      points: `${SIGNED(tier.correct)}/${SIGNED(tier.wrong)}`,
    });
  }),
);

// ---- the money trail (charter §3a, §4b) -------------------------------------------------------

/** 'Shivraj Singh Chouhan · Chief Minister, Madhya Pradesh · BJP' — a public act, not an allegation. */
export const enactedLine = (e: EnactedBy) => `${e.name} · ${e.role} · ${e.party}`;

/**
 * The poll line for a pre-election item: 'MP Assembly 2023 · 160 days before polling · BJP won 163 of
 * 230'. Timing is a fact; the line never characterises motive (charter §4b.2). Null without `poll`.
 */
export function pollLine(item: BankItem | null | undefined): string | null {
  const p = item?.poll;
  if (!p) return null;
  const parts = [p.label];
  if (typeof p.gapDays === 'number') parts.push(p.gapDays === 1 ? '1 day before polling' : `${formatNumber(p.gapDays)} days before polling`);
  if (p.result) parts.push(p.result);
  return parts.join(' · ');
}

/** 'Govt then: NDA' — the neutral govt chip text (never a party colour). */
export const govtText = (govt: string) => `Govt then: ${govt}`;

// ---- the certificate name rule (bible §8.4) -------------------------------------------------------

const HONORIFICS = new Set(['shri', 'sri', 'shree', 'smt', 'shrimati', 'kumari', 'km', 'dr', 'mr', 'mrs', 'ms', 'prof', 'justice', 'late', 'sir']);

/**
 * Normalise a person's name for comparison: Unicode NFKD, accents stripped, lower case, punctuation
 * to spaces, honorifics (Shri, Smt, Dr…) dropped. Devanagari letters are kept, so a Devanagari name
 * compares with itself. 'Dr. N. Chandrababu  Naidu' → 'n chandrababu naidu'.
 */
export function normalizePersonName(name: string): string {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ]+/g, ' ')
    .trim()
    .split(' ')
    .filter((t) => t && !HONORIFICS.has(t))
    .join(' ');
}

/** Order-free key without initials: 'Modi Narendra' and 'Narendra D. Modi' both → 'modi narendra'. */
const looseKey = (normalised: string) =>
  normalised
    .split(' ')
    .filter((t) => t.length > 1)
    .sort()
    .join(' ');

let peopleKeys: { exact: Set<string>; loose: Set<string>; full: string[][] } | null = null;
function people() {
  if (peopleKeys) return peopleKeys;
  const exact = new Set<string>();
  const loose = new Set<string>();
  const full: string[][] = [];
  for (const q of BANK_ITEMS) {
    const names = [...(q.people ?? []), ...(q.enactedBy ?? []).map((e) => e.name)];
    for (const n of names) {
      const key = normalizePersonName(n);
      if (!key) continue;
      exact.add(key);
      const l = looseKey(key);
      // Two or more real tokens: a full name, not a lone first name ('Rahul' alone is anyone).
      if (l.includes(' ') && !loose.has(l)) {
        loose.add(l);
        full.push(l.split(' '));
      }
    }
  }
  peopleKeys = { exact, loose, full };
  return peopleKeys;
}

/** True when `name` is (normalised) a person named anywhere in the bank's `people` / `enactedBy`. */
export function isBankPerson(name: string): boolean {
  const key = normalizePersonName(name);
  if (!key) return false;
  const { exact, loose } = people();
  return exact.has(key) || loose.has(looseKey(key));
}

/**
 * True when `name` is a bank person or contains one's full name ('Rahul Gandhi fan', 'Team Mamata
 * Banerjee'): every name token of some person appears in it. A lone first or last name does not count.
 */
export function mentionsBankPerson(name: string): boolean {
  if (isBankPerson(name)) return true;
  const tokens = new Set(normalizePersonName(name).split(' ').filter((t) => t.length > 1));
  if (tokens.size < 2) return false;
  return people().full.some((person) => person.every((t) => tokens.has(t)));
}

/** Longest name printed on a certificate or a share (bible §8.4). */
export const NAME_MAX = 20;

/**
 * The name a certificate or share card may print: the player's name trimmed to NAME_MAX, or
 * 'Anonymous Janta' when it is empty or matches anyone in the bank — so nobody can "certify" a real
 * politician (labels never apply to real people).
 */
export function certificateName(name: string | null | undefined): string {
  const clean = String(name ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
    .trim();
  if (!clean || mentionsBankPerson(clean) || mentionsBankPerson(String(name ?? ''))) return ANONYMOUS;
  return clean;
}
