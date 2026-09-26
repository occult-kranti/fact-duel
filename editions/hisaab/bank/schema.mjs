// The HISAAB DO bank contract (docs/hisaab/CHARTER.md §3–§5), as data and one pure checker.
// Imported by the lane validator (scripts/hisaab-validate.mjs), the edition tests and the edition
// build. Dependency-free on purpose: it runs in node, in tests and in the browser alike.

export const SECTORS = Object.freeze([
  'Welfare & Subsidies',
  'Farm & Food',
  'Health',
  'Education & Exams',
  'Infrastructure',
  'Banking & Finance',
  'Energy & Mining',
  'Defence & Security',
  'Elections & Funding',
  'Media & Speech',
  'Governance & Institutions',
  'Jobs & Economy',
  'Environment & Land',
]);

/** State codes with their display names. 'IN' is the Union (national/central). */
export const STATES = Object.freeze({
  IN: 'India (Centre)',
  UP: 'Uttar Pradesh',
  UT: 'Uttarakhand',
  HP: 'Himachal Pradesh',
  PB: 'Punjab',
  HR: 'Haryana',
  DL: 'Delhi',
  JK: 'Jammu & Kashmir',
  RJ: 'Rajasthan',
  BR: 'Bihar',
  JH: 'Jharkhand',
  GJ: 'Gujarat',
  MH: 'Maharashtra',
  GA: 'Goa',
  MP: 'Madhya Pradesh',
  CT: 'Chhattisgarh',
  KA: 'Karnataka',
  KL: 'Kerala',
  TN: 'Tamil Nadu',
  AP: 'Andhra Pradesh',
  TG: 'Telangana',
  WB: 'West Bengal',
  OD: 'Odisha',
  AS: 'Assam',
  AR: 'Arunachal Pradesh',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  SK: 'Sikkim',
  TR: 'Tripura',
});

export const KINDS = Object.freeze(['scheme', 'spend', 'scam', 'media', 'funding', 'forward', 'institution']);
export const LEVELS = Object.freeze(['simple', 'expert', 'extreme']);
export const GOVTS = Object.freeze([
  'NDA', 'UPA', 'BJP', 'INC', 'AAP', 'TMC', 'DMK', 'AIADMK', 'YSRCP', 'TDP', 'BRS', 'BJD', 'JMM', 'RJD',
  'JDU', 'SP', 'BSP', 'SS', 'NCP', 'LDF', 'UDF', 'SKM', 'MNF', 'NDPP', 'NPP', 'ZPM', 'CPI(M)',
  "President's Rule", 'Other',
]);

/**
 * Mode tags (charter §6): an item may belong to any of the three money-trail modes on top of its
 * lane. Modes are built from these tags, so an item written in a state lane (e.g. a Ladli Behna
 * question) can also be dealt in Seedha Khaate Mein without being written twice.
 */
export const TAGS = Object.freeze(['distribution', 'relief', 'pre-election']);

/** Party names allowed in `enactedBy[].party` — the GOVTS list minus the non-party entries. */
const PARTY_OK = (p) => typeof p === 'string' && p.length >= 2 && p.length <= 40;

export const ID_PATTERN = /^h[a-z]{2}\d{3}$/;
export const AS_OF_PATTERN = /^20\d\d-(0[1-9]|1[0-2])$/;

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, ' ').trim();

/**
 * Check one item against the per-item rules. Returns a list of problems (empty when clean).
 * Cross-item rules (uniqueness, spreads) live in `checkLane` and `checkBank`.
 */
export function checkItem(q) {
  const p = [];
  const id = q?.id ?? '(no id)';
  const need = (cond, msg) => {
    if (!cond) p.push(`${id}: ${msg}`);
  };
  need(typeof q?.id === 'string' && ID_PATTERN.test(q.id), `id must match ${ID_PATTERN}`);
  need(q.domain === 'civics', `domain must be 'civics'`);
  need(q.region === 'India', `region must be 'India'`);
  need(Object.hasOwn(STATES, q.state), `state '${q.state}' not in STATES`);
  need(SECTORS.includes(q.topic), `topic '${q.topic}' not in SECTORS`);
  need(typeof q.subtopic === 'string' && q.subtopic.length > 0 && q.subtopic.length <= 60, 'subtopic 1–60 chars');
  need(KINDS.includes(q.kind), `kind '${q.kind}' not in KINDS`);
  need(LEVELS.includes(q.difficulty), `difficulty '${q.difficulty}'`);
  need(Number.isInteger(q.year) && q.year >= 1990 && q.year <= 2026, 'year 1990–2026');
  need(typeof q.asOf === 'string' && AS_OF_PATTERN.test(q.asOf), 'asOf YYYY-MM');
  need(GOVTS.includes(q.govt), `govt '${q.govt}' not in GOVTS`);
  need(typeof q.question === 'string' && q.question.length > 15 && q.question.length <= 220, 'question 16–220 chars');
  need(Array.isArray(q.options) && q.options.length === 4, 'four options');
  if (Array.isArray(q.options)) {
    need(new Set(q.options.map(norm)).size === 4, 'options must be distinct');
    need(q.options.every((o) => typeof o === 'string' && o.length > 0 && o.length <= 90), 'each option 1–90 chars');
  }
  need(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4, 'correctIndex 0–3');
  if (Array.isArray(q.options) && Number.isInteger(q.correctIndex)) {
    const answer = norm(q.options[q.correctIndex] ?? '');
    if (answer.length > 3) need(!norm(q.question).includes(answer), 'answer text appears in the question');
  }
  need(typeof q.explanation === 'string' && q.explanation.length >= 40 && q.explanation.length <= 420, 'explanation 40–420 chars');
  need(typeof q.sourceUrl === 'string' && /^https:\/\/[^\s]+\.[^\s]+/.test(q.sourceUrl), 'https sourceUrl');
  need(typeof q.sourceLabel === 'string' && q.sourceLabel.length > 3, 'sourceLabel');
  if (q.sources !== undefined) {
    need(Array.isArray(q.sources) && q.sources.every((u) => /^https:\/\//.test(u)), 'sources must be https URLs');
  }
  if (q.people !== undefined) {
    need(Array.isArray(q.people) && q.people.every((n) => typeof n === 'string' && n.length > 1), 'people must be names');
  }
  if (q.tags !== undefined) {
    need(Array.isArray(q.tags) && q.tags.length > 0 && q.tags.every((t) => TAGS.includes(t)), `tags must be from ${TAGS.join('/')}`);
    need(new Set(q.tags).size === (q.tags?.length ?? 0), 'tags must not repeat');
  }
  // Who announced, presented or passed a scheme, budget or bill — a public act, not an allegation.
  if (q.enactedBy !== undefined) {
    need(
      Array.isArray(q.enactedBy) &&
        q.enactedBy.length > 0 &&
        q.enactedBy.every(
          (e) =>
            e && typeof e.name === 'string' && e.name.length > 1 &&
            typeof e.role === 'string' && e.role.length > 1 && e.role.length <= 80 &&
            PARTY_OK(e.party),
        ),
      'enactedBy must be [{ name, role, party }]',
    );
  }
  // The other side's answer in one clause (charter §2.3): a denial, clearance, acquittal or official
  // reply. The receipt prints it as its OTHER SIDE row and the share card carries it.
  if (q.otherSide !== undefined) {
    need(typeof q.otherSide === 'string' && q.otherSide.length >= 10 && q.otherSide.length <= 240, 'otherSide 10–240 chars');
  }
  // Results: reach, cost, audit findings, what happened at the next election.
  if (q.outcome !== undefined) {
    need(typeof q.outcome === 'string' && q.outcome.length >= 20 && q.outcome.length <= 320, 'outcome 20–320 chars');
  }
  // The election a pre-poll measure preceded, and how far ahead of it the measure came.
  if (q.poll !== undefined) {
    const p = q.poll;
    need(p && typeof p.label === 'string' && p.label.length > 3 && p.label.length <= 80, 'poll.label 4–80 chars');
    need(p && typeof p.month === 'string' && AS_OF_PATTERN.test(p.month), 'poll.month YYYY-MM');
    if (p?.gapDays !== undefined) need(Number.isInteger(p.gapDays) && p.gapDays >= 0 && p.gapDays <= 800, 'poll.gapDays 0–800');
    if (p?.result !== undefined) need(typeof p.result === 'string' && p.result.length > 3 && p.result.length <= 160, 'poll.result 4–160 chars');
  }
  if (Array.isArray(q.tags) && q.tags.includes('pre-election')) {
    need(q.poll !== undefined, "items tagged 'pre-election' need poll { label, month }");
  }
  const named = Array.isArray(q.people) && q.people.length > 0;
  if (q.kind === 'scam' || named) {
    need(typeof q.status === 'string' && q.status.length >= 10, 'status is required on scam items and items naming people');
  }
  if (/wikipedia\.org/.test(q.sourceUrl ?? '') && named) {
    need(Array.isArray(q.sources) && q.sources.some((u) => !/wikipedia\.org/.test(u)), 'an item naming a person needs a non-Wikipedia source');
  }
  return p;
}

/** Per-lane rules: every item clean, unique ids/texts, correct-slot and difficulty spread. */
export function checkLane(items, { name = 'lane', minSpread = true } = {}) {
  const p = [];
  const ids = new Set();
  const texts = new Set();
  for (const q of items) {
    p.push(...checkItem(q));
    if (ids.has(q.id)) p.push(`${name}: duplicate id ${q.id}`);
    ids.add(q.id);
    const key = norm(q.question);
    if (texts.has(key)) p.push(`${name}: duplicate question text at ${q.id}`);
    texts.add(key);
  }
  if (minSpread && items.length >= 12) {
    const slots = [0, 0, 0, 0];
    for (const q of items) if (Number.isInteger(q.correctIndex)) slots[q.correctIndex] += 1;
    if (slots.some((n) => n <= items.length / 8)) p.push(`${name}: correctIndex spread skewed ${slots.join('/')}`);
    for (const level of LEVELS) {
      const n = items.filter((q) => q.difficulty === level).length;
      if (n < Math.floor(items.length / 4)) p.push(`${name}: ${level} is ${n} of ${items.length} (< 25%)`);
    }
  }
  return p;
}

/** Whole-bank rules: lanes clean and nothing duplicated across lanes. */
export function checkBank(lanes) {
  const p = [];
  const ids = new Map();
  const texts = new Map();
  for (const [name, items] of Object.entries(lanes)) {
    p.push(...checkLane(items, { name }));
    for (const q of items) {
      if (ids.has(q.id)) p.push(`${q.id} in both ${ids.get(q.id)} and ${name}`);
      ids.set(q.id, name);
      const key = norm(q.question);
      if (texts.has(key)) p.push(`${q.id} (${name}) duplicates question text in ${texts.get(key)}`);
      texts.set(key, name);
    }
  }
  return p;
}
