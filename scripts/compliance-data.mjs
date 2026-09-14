/* Assemble public/product/compliance/compliance.json from the researched, audited and corrected
   lane files under docs/money/.

   Six research lanes map onto three regions plus one cross-cutting gate:
     lane 1 US federal  + lane 2 US states   -> region "us"
     lane 3 EU gambling + lane 4 EU horizontal -> region "eu"
     lane 5 India                              -> region "in"
     lane 6 payments / KYC / AML / tax         -> the common gate, because it applies everywhere

   Where two lanes answer the same question about the same region, the MORE RESTRICTIVE answer wins.
   That is not pessimism; it is the only safe merge rule. A lane that cleared a model looked at one
   body of law, and a lane that closed it looked at another — both are true at once, and the founder
   is bound by both. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const LANES = 'docs/money/lanes';
const OUT = 'public/product/compliance/compliance.json';
const AS_OF = process.env.COMPLIANCE_AS_OF ?? new Date().toISOString().slice(0, 10);

/** The corrected lane if the correction pass produced one, else the original brief. */
function lane(n) {
  const corrected = `${LANES}/lane-${n}.corrected.json`;
  if (existsSync(corrected)) {
    try {
      return { ...JSON.parse(readFileSync(corrected, 'utf8')), corrected: true };
    } catch (error) {
      console.warn(`lane ${n}: corrected file is not valid JSON (${error.message}); falling back to the brief`);
    }
  }
  const brief = readFileSync('docs/money/legal-lanes.ndjson', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))[n - 1];
  return { ...brief, corrected: false };
}

const merge = existsSync('docs/money/legal-merge.json')
  ? JSON.parse(readFileSync('docs/money/legal-merge.json', 'utf8'))
  : {};

/** Most restrictive first. A merge never softens a verdict. */
const RANK = { unlawful: 0, 'licence-required': 1, unsettled: 2, lawful: 3 };
const stricter = (a, b) => ((RANK[a?.verdict] ?? 9) <= (RANK[b?.verdict] ?? 9) ? a : b);

function mergeVerdicts(...lists) {
  const out = new Map();
  for (const list of lists) {
    for (const v of list ?? []) {
      const key = String(v.model).toUpperCase();
      const next = { model: key, verdict: v.verdict, summary: v.summary ?? v.reasoning, authority: v.authority };
      out.set(key, out.has(key) ? stricter(out.get(key), next) : next);
    }
  }
  return ['A', 'B', 'C', 'D'].map(
    (m) => out.get(m) ?? { model: m, verdict: 'unsettled', summary: 'No lane settled this model for this region.' },
  );
}

const items = (l) => (l.checklist ?? []).map((i) => ({ ...i }));
const subs = (...ls) => {
  const out = new Map();
  for (const l of ls) for (const s of l.subdivisions ?? []) if (s?.name && !out.has(s.name)) out.set(s.name, s);
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const [usFed, usState, euGam, euHor, india, pay] = [1, 2, 3, 4, 5, 6].map(lane);

const MODELS = [
  { id: 'A', name: 'Closed-loop cosmetic', blurb: 'Buy coins; coins buy cosmetics only; never convert back to money or a prize of value; nothing staked player-v-player.' },
  { id: 'B', name: 'Dual currency / sweepstakes', blurb: 'Buy coins; stake them player-v-player; winnings redeemable for cash or prizes of value.' },
  { id: 'C', name: 'Paid-entry skill contest', blurb: 'Fixed entry fee; prize pool fixed, announced in advance and operator-funded, not dependent on entrant count.' },
  { id: 'D', name: 'Subscription', blurb: 'Recurring fee for features and cosmetics. No stake, no prize of value.' },
];

const regions = [
  {
    id: 'us',
    name: 'United States',
    short: 'USA',
    matrixKey: 'us',
    gridLabel: 'States and the District of Columbia',
    posture: usState.headline ?? usFed.headline,
    verdicts: mergeVerdicts(usFed.modelVerdicts, usState.modelVerdicts),
    subdivisions: subs(usState, usFed),
    checklist: [...items(usFed), ...items(usState)],
    risks: [...(usFed.risks ?? []), ...(usState.risks ?? [])],
  },
  {
    id: 'eu',
    name: 'European Union',
    short: 'EU',
    matrixKey: 'eu',
    gridLabel: 'Member states',
    posture: euGam.headline,
    verdicts: mergeVerdicts(euGam.modelVerdicts, euHor.modelVerdicts),
    subdivisions: subs(euGam, euHor),
    checklist: [...items(euGam), ...items(euHor)],
    risks: [...(euGam.risks ?? []), ...(euHor.risks ?? [])],
  },
  {
    id: 'in',
    name: 'India',
    short: 'India',
    matrixKey: 'india',
    gridLabel: 'States and union territories',
    posture: india.headline,
    verdicts: mergeVerdicts(india.modelVerdicts),
    subdivisions: subs(india),
    checklist: items(india),
    risks: india.risks ?? [],
  },
];

/** The matrix the merge produced, or one derived from the regions when the merge is unavailable. */
/* The merge labels its cells descriptively — "A — closed-loop cosmetic" against "USA (federal + 50
   states + DC)" — so both axes are normalised back to the keys the page joins on. Without this every
   cell silently falls through to an em-dash, which reads as "not researched" rather than "not joined". */
const modelKey = (m) => String(m ?? '').trim().charAt(0).toUpperCase();
const regionKey = (r) => {
  const s = String(r ?? '').toLowerCase();
  return s.includes('ind') ? 'india' : s.includes('eu') || s.includes('europ') ? 'eu' : 'us';
};

const matrix =
  merge.modelMatrix?.length >= 12
    ? merge.modelMatrix.map((c) => ({ ...c, model: modelKey(c.model), region: regionKey(c.region) }))
    : regions.flatMap((r) => r.verdicts.map((v) => ({ model: v.model, region: r.matrixKey, verdict: v.verdict, summary: v.summary })));

if (!['A', 'B', 'C', 'D'].every((m) => ['us', 'eu', 'india'].every((r) => matrix.some((c) => c.model === m && c.region === r)))) {
  console.warn('WARNING: the 4x3 matrix has a gap; some cells will render as unresearched');
}

const sources = [...new Set([usFed, usState, euGam, euHor, india, pay].flatMap((l) => l.sources ?? []))].sort();

const data = {
  asOf: AS_OF,
  summary:
    merge.recommendation?.split('\n\n')[0] ??
    'Six research lanes, each adversarially audited, on whether and how this product can lawfully take money in the USA, the EU and India.',
  disclaimer:
    'No money is taken by FACT//DUEL today and no code in this repository can take any. Every figure below was researched and then checked by a second pass whose job was to refute it; figures marked UNVERIFIED survived neither and must be confirmed before they enter a budget or a geofence. Ticks are this browser’s local record and are not a legal record.',
  models: MODELS,
  regions,
  common: items(pay),
  matrix,
  criticalFindings: merge.criticalFindings ?? [],
  affectsProductToday: merge.affectsProductToday ?? [],
  closed: merge.closed ?? [],
  sequencing: merge.sequencing ?? [],
  /* Deduplicated: six lanes independently flagged several of the same unknowns, and a counsel list
     that asks the same question four times invites being billed for it four times. */
  questions: (() => {
    const seen = new Set();
    const out = [];
    const push = (text, region) => {
      const key = String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 90);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push({ text, region });
    };
    for (const t of merge.openQuestionsForCounsel ?? []) push(t);
    for (const l of [usFed, usState, euGam, euHor, india, pay]) {
      for (const t of l.uncertain ?? []) push(t, l.jurisdiction?.split('—')[0]?.trim());
    }
    return out;
  })(),
  sources,
  provenance: {
    lanes: [usFed, usState, euGam, euHor, india, pay].map((l, n) => ({
      lane: n + 1,
      jurisdiction: l.jurisdiction,
      corrected: l.corrected,
      checklistItems: (l.checklist ?? []).length,
      subdivisions: (l.subdivisions ?? []).length,
    })),
    mergePresent: Boolean(merge.recommendation),
  },
};

mkdirSync('public/product/compliance', { recursive: true });
writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
const uncorrected = data.provenance.lanes.filter((l) => !l.corrected).map((l) => l.lane);
console.log(
  `compliance.json: ${regions.length} regions, ${data.common.length} common items, ` +
    `${regions.reduce((a, r) => a + r.checklist.length, 0)} regional items, ` +
    `${regions.reduce((a, r) => a + r.subdivisions.length, 0)} subdivisions, ${sources.length} sources` +
    (uncorrected.length ? `\nWARNING: lanes ${uncorrected.join(', ')} fell back to the uncorrected brief` : ''),
);
