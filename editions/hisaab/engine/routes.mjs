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
export const ROUTE_KINDS = Object.freeze(['state', 'sector', 'media', 'forward']);
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
  return Object.freeze(routes);
}
