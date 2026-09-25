/**
 * editions/hisaab/engine/routes.mjs — expedition routes derived from the bank.
 *
 * JHK hand-writes nine routes. This edition's routes are DATA-DRIVEN: they are recomputed from
 * whatever lanes are registered in editions/hisaab/bank/index.mjs, so a lane landing adds routes with
 * no code change. `deriveRoutes(bank)` returns routes in exactly the shape lib/expeditions.mjs's rules
 * consume (`id, topic, domain, title, subtitle, code, stamp, chapters, version, key, ids`), plus
 * edition fields a screen can use (`kind`, `state`, `sector`, `topics`, `ownCount`, `padded`,
 * `poolSize`). editions/hisaab/engine/expedition-routes.mjs feeds it the served bank and the build
 * aliases lib/expedition-routes.mjs to that module, so the shared reducer runs these routes unchanged.
 *
 * The routes (charter §6):
 *  - Rajya Rounds: one route per STATE (not 'IN') with at least ROUTE_MIN.state items. A route is
 *    always six cards (the engine's run length); a state with 4–5 items of its own is topped up with
 *    Centre ('IN') items, preferring the sectors the state's items are in. `ownCount` / `padded` say
 *    so, and a screen must say so too ("4 from Assam, 2 from the Centre").
 *  - Sector Files: one route per SECTOR with at least ROUTE_MIN.sector items, except 'Media & Speech',
 *    which is Kiska Media.
 *  - Kiska Media?: topic 'Media & Speech'. Forward Court: kind 'forward'. Each needs six items.
 *
 * The money trail (charter §4a, §6), derived from item `tags` and `year` and appended after those:
 *  - Seedha Khaate Mein / Rahat Kosh / Chunav Se Pehle (`kind` = the tag: 'distribution' | 'relief' |
 *    'pre-election'): one 'all' route per tag, one per five-year ERA (2000–04 … 2020–26) and one per
 *    state (the Centre, 'IN', included) whenever that slice holds at least MONEY_MIN items. A money
 *    route is never topped up: a slice below six has no route.
 *  - Saal-dar-Saal (`kind: 'year'`): one route per year (2000–2026) with at least YEAR_MIN items,
 *    across every lane. Thinner adjacent years are merged into a labelled range ('2004–2010') — the
 *    title and subtitle say so — and never padded with items from other years. See `yearGroups`.
 *
 * Which six: two per difficulty where the pool allows (topped up from the rest), chosen in a stable
 * hash order salted by the route id — so picks spread across lanes rather than favouring whichever id
 * prefix sorts first — then ordered simple → expert → extreme across the three chapters. The choice is
 * deterministic for a given bank. When the bank changes, a route's six can change: a finished stamp is
 * kept (results are not tied to card ids) but an unfinished run whose cards no longer match is dropped
 * by lib/expeditions.mjs `readExpeditions`, and the player starts that route afresh.
 *
 * Pure and dependency-free apart from the vocabulary; tests call it with synthetic banks.
 */
import { SECTORS, STATES } from '../bank/schema.mjs';

/** Cards in a run. lib/expeditions.mjs hard-codes six; this is the same number, named. */
export const ROUTE_CARDS = 6;
/** Items a pool needs before its route exists. A state below six is topped up from the Centre. */
export const ROUTE_MIN = Object.freeze({ state: 4, sector: 6, media: 6, forward: 6 });
export const ROUTE_KINDS = Object.freeze(['state', 'sector', 'media', 'forward', 'distribution', 'relief', 'pre-election', 'year']);

// ---- The money trail (charter §4a, §6) --------------------------------------------------------
/** The three money-trail modes, in display order. Same values as schema.mjs TAGS. */
export const MONEY_TAGS = Object.freeze(['distribution', 'relief', 'pre-election']);
/** Items a money-trail slice (all / era / state) needs before it gets a route. Never topped up. */
export const MONEY_MIN = 6;
/** Items a single year needs for a route of its own; thinner adjacent years are merged into a range. */
export const YEAR_MIN = 6;
/** The span the money trail and Saal-dar-Saal cover (charter §4a: 26 years). */
export const YEAR_SPAN = Object.freeze({ from: 2000, to: 2026 });
/** Five-year eras for the money-trail modes; the last runs to the end of the span. */
export const ERAS = Object.freeze(
  [
    [2000, 2004],
    [2005, 2009],
    [2010, 2014],
    [2015, 2019],
    [2020, 2026],
  ].map(([from, to]) => Object.freeze({ id: `${from}-${to}`, from, to, label: yearLabel(from, to) })),
);
/** Draft route copy per mode (the design lane may restyle; ids and codes are stable). */
const MONEY_COPY = Object.freeze({
  distribution: { title: 'Seedha Khaate Mein', code: 'KHAATA', about: 'money handed out directly' },
  relief: { title: 'Rahat Kosh', code: 'RAHAT', about: 'relief funds and disaster money' },
  'pre-election': { title: 'Chunav Se Pehle', code: 'CHUNAV', about: 'what came in the months before a vote' },
});

/** '2004–2010' (en dash), or '2019' for a single year. Short form for eras: '2000–04'. */
function yearLabel(from, to, short = true) {
  if (from === to) return String(from);
  const tail = short && Math.floor(from / 100) === Math.floor(to / 100) ? String(to).slice(2) : String(to);
  return `${from}–${tail}`;
}
/** The sector Kiska Media covers, so it has no separate Sector File. */
export const MEDIA_SECTOR = 'Media & Speech';
/** Chapters of every route: two cards each, in difficulty order. Draft copy; the design lane may polish. */
export const CHAPTERS = Object.freeze(['The headline', 'The follow-up', 'The fine print']);
const LEVELS = ['simple', 'expert', 'extreme'];

/** FNV-1a, 32-bit. Copied (as lib/fixtures.mjs does) so this module pulls in no progression graph. */
function fnv1a32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 'Welfare & Subsidies' → 'welfare-subsidies'. */
export const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Short display codes for the sector files ("FILE / FARM"). */
const SECTOR_CODES = Object.freeze({
  'Welfare & Subsidies': 'WELFARE',
  'Farm & Food': 'FARM',
  Health: 'HEALTH',
  'Education & Exams': 'EXAMS',
  Infrastructure: 'INFRA',
  'Banking & Finance': 'BANKS',
  'Energy & Mining': 'ENERGY',
  'Defence & Security': 'DEFENCE',
  'Elections & Funding': 'POLLS',
  'Media & Speech': 'MEDIA',
  'Governance & Institutions': 'GOVT',
  'Jobs & Economy': 'JOBS',
  'Environment & Land': 'LAND',
});

const levelIndex = (q) => {
  const i = LEVELS.indexOf(q.difficulty);
  return i < 0 ? LEVELS.length : i;
};

/** The pool ordered by the route's salted hash, id as the tiebreak. */
function ranked(pool, salt) {
  return [...pool]
    .map((q) => ({ q, h: fnv1a32(`${salt}:${q.id}`) }))
    .sort((a, b) => a.h - b.h || (a.q.id < b.q.id ? -1 : a.q.id > b.q.id ? 1 : 0))
    .map((x) => x.q);
}

/**
 * Six cards out of `pool` (two per difficulty where possible, then the rest of the pool), topped up
 * from `fill` — taken in the order given — when the pool is short. Returns the chosen items in
 * chapter order and which were fill.
 */
export function pickCards(pool, salt, fill = []) {
  const order = ranked(pool, salt);
  const chosen = [];
  for (const level of LEVELS) chosen.push(...order.filter((q) => q.difficulty === level).slice(0, 2));
  for (const q of order) if (chosen.length < ROUTE_CARDS && !chosen.includes(q)) chosen.push(q);
  const padded = [];
  for (const q of fill) {
    if (chosen.length >= ROUTE_CARDS) break;
    if (!chosen.some((c) => c.id === q.id)) {
      chosen.push(q);
      padded.push(q.id);
    }
  }
  // Within a chapter: the route's own items in hash order, then any Centre top-up.
  const rank = new Map(order.map((q, i) => [q.id, i]));
  const place = (q) => rank.get(q.id) ?? order.length + padded.indexOf(q.id);
  const cards = chosen.slice(0, ROUTE_CARDS).sort((a, b) => levelIndex(a) - levelIndex(b) || place(a) - place(b));
  return { cards, padded: padded.filter((id) => cards.some((q) => q.id === id)) };
}

/** The most frequent topic among the cards; ties go to the earlier SECTOR. */
function dominantTopic(cards) {
  const count = new Map();
  for (const q of cards) count.set(q.topic, (count.get(q.topic) ?? 0) + 1);
  return [...count.entries()].sort(
    (a, b) => b[1] - a[1] || SECTORS.indexOf(a[0]) - SECTORS.indexOf(b[0]),
  )[0][0];
}

function route({ id, kind, title, subtitle, code, stamp, cards, padded, poolSize, extra = {} }) {
  const topics = [...new Set(cards.map((q) => q.topic))];
  return Object.freeze({
    id,
    kind,
    topic: dominantTopic(cards),
    topics: Object.freeze(topics),
    domain: 'civics',
    title,
    subtitle,
    code,
    stamp,
    chapters: CHAPTERS,
    version: 1,
    key: `${id}:1`,
    ids: Object.freeze(cards.map((q) => q.id)),
    ownCount: cards.length - padded.length,
    padded: Object.freeze(padded),
    poolSize,
    ...extra,
  });
}

/**
 * Every route the bank supports, in display order: states (charter order), sectors, Kiska Media,
 * Forward Court. Items outside the civics domain are ignored.
 */
export function deriveRoutes(bank) {
  const items = (bank ?? []).filter((q) => q && q.domain === 'civics' && typeof q.id === 'string');
  const routes = [];
  const centre = items.filter((q) => q.state === 'IN');
  for (const [code, name] of Object.entries(STATES)) {
    if (code === 'IN') continue;
    const pool = items.filter((q) => q.state === code);
    if (pool.length < ROUTE_MIN.state) continue;
    const sectors = new Set(pool.map((q) => q.topic));
    // Top-up order: Centre items in the state's own sectors first, then any Centre item.
    const salt = `state-${code.toLowerCase()}`;
    const fill = [
      ...ranked(centre.filter((q) => sectors.has(q.topic)), `${salt}:fill`),
      ...ranked(centre.filter((q) => !sectors.has(q.topic)), `${salt}:fill`),
    ];
    const { cards, padded } = pickCards(pool, salt, fill);
    if (cards.length < ROUTE_CARDS) continue;
    const own = cards.length - padded.length;
    routes.push(
      route({
        id: salt,
        kind: 'state',
        title: name,
        subtitle: padded.length
          ? `${own} receipts from ${name}, ${padded.length} from the Centre.`
          : `Six receipts from ${name}.`,
        code: `RAJYA / ${code}`,
        stamp: `${name} file`,
        cards,
        padded,
        poolSize: pool.length,
        extra: { state: code },
      }),
    );
  }
  for (const sector of SECTORS) {
    if (sector === MEDIA_SECTOR) continue;
    const pool = items.filter((q) => q.topic === sector);
    if (pool.length < ROUTE_MIN.sector) continue;
    const id = `sector-${slug(sector)}`;
    const { cards, padded } = pickCards(pool, id);
    routes.push(
      route({
        id,
        kind: 'sector',
        title: sector,
        subtitle: `Six receipts from the ${sector} file.`,
        code: `FILE / ${SECTOR_CODES[sector] ?? slug(sector).toUpperCase()}`,
        stamp: `${sector} file`,
        cards,
        padded,
        poolSize: pool.length,
        extra: { sector },
      }),
    );
  }
  const media = items.filter((q) => q.topic === MEDIA_SECTOR);
  if (media.length >= ROUTE_MIN.media) {
    const { cards, padded } = pickCards(media, 'kiska-media');
    routes.push(
      route({
        id: 'kiska-media',
        kind: 'media',
        title: 'Kiska Media?',
        subtitle: 'Who owns the news, and who pays for it.',
        code: 'KISKA / MEDIA',
        stamp: 'Kiska Media file',
        cards,
        padded,
        poolSize: media.length,
        extra: { sector: MEDIA_SECTOR },
      }),
    );
  }
  const forwards = items.filter((q) => q.kind === 'forward');
  if (forwards.length >= ROUTE_MIN.forward) {
    const { cards, padded } = pickCards(forwards, 'forward-court');
    routes.push(
      route({
        id: 'forward-court',
        kind: 'forward',
        title: 'Forward Court',
        subtitle: 'Rule on the forwards. The fact-checkers testify.',
        code: 'COURT / FWD',
        stamp: 'Forward Court file',
        cards,
        padded,
        poolSize: forwards.length,
      }),
    );
  }
  routes.push(...moneyRoutes(items), ...yearRoutes(items));
  return Object.freeze(routes);
}

const inYears = (q, from, to) => Number.isInteger(q.year) && q.year >= from && q.year <= to;
const tagged = (q, tag) => Array.isArray(q.tags) && q.tags.includes(tag);

/**
 * The money-trail routes: for each tag, 'all', then each era, then each state (charter order, the
 * Centre first) — only where the slice holds MONEY_MIN items. Six cards, never padded.
 */
export function moneyRoutes(items) {
  const routes = [];
  for (const tag of MONEY_TAGS) {
    const pool = items.filter((q) => tagged(q, tag));
    if (pool.length < MONEY_MIN) continue;
    const copy = MONEY_COPY[tag];
    const slice = (id, sub, scope, cards, title, subtitle, code, extra) =>
      route({
        id,
        kind: tag,
        title,
        subtitle,
        code,
        stamp: `${title} file`,
        cards,
        padded: [],
        poolSize: sub.length,
        extra: { tag, scope, ...extra },
      });
    const all = pickCards(pool, `money-${tag}`).cards;
    routes.push(
      slice(`money-${tag}`, pool, 'all', all, copy.title, `Six receipts on ${copy.about}, from ${pool.length} on file.`, `${copy.code} / ALL`, {}),
    );
    for (const era of ERAS) {
      const sub = pool.filter((q) => inYears(q, era.from, era.to));
      if (sub.length < MONEY_MIN) continue;
      const id = `money-${tag}-${era.id}`;
      routes.push(
        slice(id, sub, 'era', pickCards(sub, id).cards, `${copy.title} · ${era.label}`, `Six receipts from ${era.label}.`, `${copy.code} / ${era.label.replace('–', '-')}`, {
          era: era.id,
          years: Object.freeze([era.from, era.to]),
        }),
      );
    }
    for (const [code, name] of Object.entries(STATES)) {
      const sub = pool.filter((q) => q.state === code);
      if (sub.length < MONEY_MIN) continue;
      const id = `money-${tag}-${code.toLowerCase()}`;
      const place = code === 'IN' ? 'the Centre' : name;
      routes.push(
        slice(id, sub, 'state', pickCards(sub, id).cards, `${copy.title} · ${code === 'IN' ? 'Centre' : name}`, `Six receipts from ${place}.`, `${copy.code} / ${code}`, {
          state: code,
        }),
      );
    }
  }
  return routes;
}

/**
 * Saal-dar-Saal groups over YEAR_SPAN: `[{ from, to, count }]`, chronological, covering every year
 * that has items (as long as the whole span has YEAR_MIN). A year with YEAR_MIN items stands alone.
 * A run of thinner years between two such years is cut, left to right, into ranges of at least
 * YEAR_MIN; a thin remainder joins the range before it in the run. A run too thin for any range of
 * its own joins the neighbouring group before it (else after it), which then becomes a range. `from`
 * and `to` are the first and last years that actually have items, so the label never claims an
 * empty year.
 */
export function yearGroups(items) {
  const count = new Map();
  for (const q of items) if (inYears(q, YEAR_SPAN.from, YEAR_SPAN.to)) count.set(q.year, (count.get(q.year) ?? 0) + 1);
  const total = [...count.values()].reduce((a, b) => a + b, 0);
  if (total < YEAR_MIN) return [];
  // Blocks, in order: a full year, or a run of thin years (empty years included).
  const blocks = [];
  let run = null;
  for (let y = YEAR_SPAN.from; y <= YEAR_SPAN.to; y++) {
    const n = count.get(y) ?? 0;
    if (n >= YEAR_MIN) {
      run = null;
      blocks.push({ full: true, years: [y] });
    } else {
      if (!run) blocks.push((run = { full: false, years: [] }));
      run.years.push(y);
    }
  }
  const sum = (years) => years.reduce((a, y) => a + (count.get(y) ?? 0), 0);
  const groups = [];
  const orphans = []; // runs too thin to stand alone: { at: index in groups, years }
  for (const block of blocks) {
    if (block.full) {
      groups.push(block.years);
      continue;
    }
    if (sum(block.years) === 0) continue;
    const chunks = [];
    let chunk = [];
    for (const y of block.years) {
      chunk.push(y);
      if (sum(chunk) >= YEAR_MIN) {
        chunks.push(chunk);
        chunk = [];
      }
    }
    if (sum(chunk) > 0) {
      if (chunks.length) chunks[chunks.length - 1].push(...chunk);
      else orphans.push({ at: groups.length, years: chunk });
    }
    groups.push(...chunks);
  }
  // Fold each orphan run into the group before it (else the one after it). Walk from the end so the
  // recorded positions stay valid.
  for (const orphan of orphans.reverse()) {
    const target = orphan.at > 0 ? orphan.at - 1 : 0;
    groups[target] = [...groups[target], ...orphan.years].sort((a, b) => a - b);
  }
  return groups.map((years) => {
    const has = years.filter((y) => (count.get(y) ?? 0) > 0);
    return Object.freeze({ from: has[0], to: has[has.length - 1], count: sum(years) });
  });
}

/** One Saal-dar-Saal route per year group (see `yearGroups`), chronological. */
export function yearRoutes(items) {
  return yearGroups(items).map(({ from, to, count }) => {
    const single = from === to;
    const id = single ? `year-${from}` : `year-${from}-${to}`;
    const pool = items.filter((q) => inYears(q, from, to));
    const label = yearLabel(from, to, false);
    return route({
      id,
      kind: 'year',
      title: label,
      subtitle: single
        ? `Six receipts from ${from}, across every file.`
        : `${from} to ${to} share one file: ${count} cards between them.`,
      code: `SAAL / ${single ? from : yearLabel(from, to).replace('–', '-')}`,
      stamp: `${label} file`,
      cards: pickCards(pool, id).cards,
      padded: [],
      poolSize: pool.length,
      extra: { years: Object.freeze([from, to]), merged: !single },
    });
  });
}
