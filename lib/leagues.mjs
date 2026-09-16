/**
 * Leagues — the leaderboard engine, pure and device-agnostic.
 *
 * Two kinds of board live here. The bracket/settle half (`bracket`, `settleWeek`, `percentile`,
 * `neighbourhood`) is the Duolingo-style weekly league of 30 the research lane asked for
 * (docs/money/ads/lane-gamification.json recommendations[2]; synthesis feature 16). It is complete
 * and tested, but it cannot be shown to a player until accounts exist: a league needs other people,
 * and this build has no server to find them. `ACCOUNTS_LIVE` is the single switch the UI reads.
 *
 * The other half is what CAN be honest on a device-local product today: `rivals` (head-to-head
 * records against the real people this device has duelled) and `youVsYou` (this week against last
 * week, from the journal). No entry on any board is ever invented. No bots, no fabricated counts,
 * no "N playing now" — the dark-pattern gate in .claude/skills/gamification-advisor/SKILL.md (N7, N9).
 *
 * Purity: no Date.now(), no Math.random(); every timestamp is passed in. Nothing here imports
 * lib/progression.mjs (it would close an import cycle through passport), so the FNV-1a hash is a
 * local copy of the one there.
 */

export const LEAGUE_SIZE = 30;
export const PROMOTE_TOP = 10;
export const RELEGATE_BOTTOM = 5;
/** A league smaller than this has no relegation zone: with 12 people, sending 5 down is a purge. */
export const RELEGATION_MIN = 20;
/**
 * Leagues and the percentile global view need accounts (milestone M4 in docs/money/ads/synthesis.json:
 * accounts + server-verified results). Until then `boardsAvailable` reports them as off and the UI
 * says so in plain words. Flip this only when the account service is deployed and the DSA scoping
 * review in lane-gamification.json recommendations[2] has been done.
 */
export const ACCOUNTS_LIVE = false;
export const NEIGHBOURHOOD_RADIUS = 2;
export const OPPONENT_NAME_MAX = 24;

const WEEK_MS = 7 * 864e5;

/** 32-bit FNV-1a. A copy of lib/progression.mjs fnv1a32 — see the header for why it is not imported. */
export function fnv1a32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const finite = (n) => typeof n === 'number' && Number.isFinite(n);
const validDate = (n) => finite(n) && Math.abs(n) <= 8.64e15;
const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------------------------
// Weeks

/**
 * ISO week key, Monday start, as `YYYY-Www` — the convention lib/season.mjs shares. The offset is
 * what `Date.prototype.getTimezoneOffset` returns (minutes, sign included), passed in rather than
 * read so a server can compute a player's week from a stored offset and the function stays pure.
 * ISO rule: the week belongs to the year that holds its Thursday, so 2026-12-28 (Mon) is 2026-W53
 * and 2027-01-04 (Mon) is 2027-W01.
 */
export function weekKey(at, tzOffsetMinutes = 0) {
  const tz = finite(tzOffsetMinutes) ? tzOffsetMinutes : 0;
  const local = new Date((validDate(at) ? at : 0) - tz * 60_000);
  // Shift to the Thursday of this week (Mon=0 … Sun=6 → +3 from Monday).
  const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const isoYear = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4dow = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = Date.UTC(isoYear, 0, 4) - jan4dow * 864e5;
  const week = 1 + Math.round((d.getTime() - 3 * 864e5 - week1Monday) / WEEK_MS);
  return `${isoYear}-W${pad(week)}`;
}

/** The week key seven days before `at` — last week, in the same local offset. */
export const lastWeekKey = (at, tzOffsetMinutes = 0) =>
  weekKey((validDate(at) ? at : 0) - WEEK_MS, tzOffsetMinutes);

// ---------------------------------------------------------------------------------------------
// Bracketing

const validEntry = (e) =>
  e &&
  typeof e === 'object' &&
  typeof e.id === 'string' &&
  e.id.length > 0 &&
  e.id.length <= 120 &&
  typeof e.tier === 'string' &&
  e.tier.length > 0;

const entryPoints = (e) => (finite(e.weeklyPoints) && e.weeklyPoints > 0 ? e.weeklyPoints : 0);
const entryDuels = (e) => (Number.isSafeInteger(e.duels) && e.duels > 0 ? e.duels : 0);

/**
 * Deterministic assignment of entries into leagues of at most LEAGUE_SIZE. Entries are grouped by
 * tier and then by activity (active players bracket with active players, dormant with dormant, so
 * nobody wins a league of ghosts), shuffled by a hash of `weekKey:id` (a different draw each week,
 * the same draw for everyone who computes it), and cut into leagues of near-equal size. Malformed
 * entries and duplicate ids are dropped, first sighting kept. `tier` restricts the run to one tier.
 *
 * Returns an array of leagues `{ id, tier, active, weekKey, entries }`, tiers in first-seen order,
 * active leagues before dormant ones inside each tier.
 * @param {any[]} entries
 * @param {{ tier?: string | null, weekKey?: string }} [options]
 */
export function bracket(entries, { tier = null, weekKey: wk = '' } = {}) {
  const key = typeof wk === 'string' ? wk : '';
  const seen = new Set();
  const groups = new Map();
  for (const e of Array.isArray(entries) ? entries : []) {
    if (!validEntry(e) || seen.has(e.id)) continue;
    if (tier !== null && e.tier !== tier) continue;
    seen.add(e.id);
    const active = e.active !== false;
    const gk = JSON.stringify([e.tier, active]);
    if (!groups.has(gk)) groups.set(gk, { tier: e.tier, active, list: [] });
    groups.get(gk).list.push({
      id: e.id,
      tier: e.tier,
      active,
      weeklyPoints: entryPoints(e),
      duels: entryDuels(e),
    });
  }
  const tiers = [];
  for (const g of groups.values()) if (!tiers.includes(g.tier)) tiers.push(g.tier);
  const out = [];
  for (const t of tiers) {
    for (const active of [true, false]) {
      const g = groups.get(JSON.stringify([t, active]));
      if (!g) continue;
      const sorted = g.list
        .map((e) => ({ e, h: fnv1a32(`${key}:${e.id}`) }))
        .sort((a, b) => a.h - b.h || (a.e.id < b.e.id ? -1 : a.e.id > b.e.id ? 1 : 0))
        .map((x) => x.e);
      const count = Math.ceil(sorted.length / LEAGUE_SIZE);
      const base = Math.floor(sorted.length / count);
      let extra = sorted.length - base * count;
      let cursor = 0;
      for (let n = 0; n < count; n++) {
        const size = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra -= 1;
        out.push({
          id: `${key}:${t}:${active ? 'active' : 'dormant'}:${n + 1}`,
          tier: t,
          active,
          weekKey: key,
          entries: sorted.slice(cursor, cursor + size),
        });
        cursor += size;
      }
    }
  }
  return out;
}

/** Best first: points desc, then fewer duels (the efficient player ranks above the grinder), then id. */
export function standings(entries) {
  return (Array.isArray(entries) ? entries : [])
    .filter(validEntry)
    .map((e) => ({ id: e.id, weeklyPoints: entryPoints(e), duels: entryDuels(e) }))
    .sort(
      (a, b) =>
        b.weeklyPoints - a.weeklyPoints ||
        a.duels - b.duels ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
    .map((e, i) => ({ rank: i + 1, ...e }));
}

/**
 * The end-of-week settle for one league. The top PROMOTE_TOP go up, provided they scored at all — a
 * zero-point week is a week off, not a promotion. The bottom RELEGATE_BOTTOM go down only when the
 * league had at least RELEGATION_MIN entrants. Everyone else stays. Which tier "up" and "down" map
 * to is the caller's business; this module does not know the tier ladder.
 */
export function settleWeek(league) {
  const table = standings(league?.entries);
  const promoted = table.slice(0, PROMOTE_TOP).filter((e) => e.weeklyPoints > 0);
  const relegated = table.length >= RELEGATION_MIN ? table.slice(-RELEGATE_BOTTOM) : [];
  const moved = new Set([...promoted, ...relegated].map((e) => e.id));
  return {
    standings: table,
    promoted: promoted.map((e) => e.id),
    relegated: relegated.map((e) => e.id),
    stayed: table.filter((e) => !moved.has(e.id)).map((e) => e.id),
  };
}

/**
 * Percentile rank of `value` inside `population` (numbers), 0–100, using the mid-rank definition
 * `(below + equal / 2) / n`: a lone entrant sits at 50, not at a flattering 100. `delta` is the
 * change against `previous` (last week's pct) when one is supplied. Empty population → null pct.
 * @param {number} value
 * @param {number[]} population
 * @param {{ previous?: number | null }} [options]
 */
export function percentile(value, population, { previous = null } = {}) {
  const pop = (Array.isArray(population) ? population : []).filter(finite);
  if (!pop.length || !finite(value)) return { pct: null, delta: null, population: pop.length };
  let below = 0,
    equal = 0;
  for (const v of pop) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  const pct = Math.round(((below + equal / 2) / pop.length) * 100);
  return { pct, delta: finite(previous) ? pct - previous : null, population: pop.length };
}

/**
 * The ±radius window around one player in a best-first table. The window is not padded at the
 * edges: a leader sees themselves and the two below, nothing invented above. Unknown id → empty.
 */
export function neighbourhood(sortedEntries, id, radius = NEIGHBOURHOOD_RADIUS) {
  const list = Array.isArray(sortedEntries) ? sortedEntries : [];
  const r = Number.isSafeInteger(radius) && radius >= 0 ? radius : NEIGHBOURHOOD_RADIUS;
  const index = list.findIndex((e) => e?.id === id);
  if (index < 0) return { index: -1, rank: null, total: list.length, entries: [] };
  const from = Math.max(0, index - r);
  return {
    index,
    rank: index + 1,
    total: list.length,
    entries: list.slice(from, index + r + 1).map((e, i) => ({ ...e, rank: from + i + 1 })),
  };
}

// ---------------------------------------------------------------------------------------------
// The boards that are honest today

/** The opponent name as the journal should carry it: trimmed, one space between words, ≤ 24 chars. */
export function cleanOpponentName(value) {
  if (typeof value !== 'string') return null;
  const s = value.replace(/\s+/g, ' ').trim().slice(0, OPPONENT_NAME_MAX).trim();
  return s.length ? s : null;
}

const matches = (profile) =>
  Array.isArray(profile?.journal?.matches) ? profile.journal.matches.filter((m) => m && typeof m === 'object') : [];
const rounds = (profile) =>
  Array.isArray(profile?.journal?.rounds) ? profile.journal.rounds.filter((r) => r && typeof r === 'object') : [];

/**
 * Head-to-head records from real friend duels (`bot === false`) on this device. A rival is keyed by
 * the sanitised `opponentName` on the match record — case-folded so "Sam" and "sam" are one person,
 * shown with the spelling from the most recent duel (the journal stores matches newest first). Matches without a name (every friend duel recorded before the
 * journal carried the field) are counted in `unnamed` and never guessed at.
 *
 * `reason` says why `rows` is empty: 'no-friend-duels' (nothing to build from) or
 * 'no-opponent-identity' (friend duels exist but none names the opponent). Null when rows exist.
 */
export function rivals(profile) {
  const human = matches(profile).filter((m) => m.bot === false);
  const byKey = new Map();
  let unnamed = 0;
  for (const m of human) {
    const name = cleanOpponentName(m.opponentName);
    if (!name) {
      unnamed += 1;
      continue;
    }
    const key = name.toLocaleLowerCase();
    const at = validDate(m.at) ? m.at : 0;
    const row = byKey.get(key) ?? {
      name,
      wins: 0,
      losses: 0,
      draws: 0,
      played: 0,
      lastAt: at,
      lastOutcome: m.outcome,
    };
    row.played += 1;
    if (m.outcome === 'win') row.wins += 1;
    else if (m.outcome === 'loss') row.losses += 1;
    else row.draws += 1;
    if (at >= row.lastAt) {
      row.lastAt = at;
      row.lastOutcome = m.outcome;
    }
    byKey.set(key, row);
  }
  const rows = [...byKey.values()].sort(
    (a, b) => b.lastAt - a.lastAt || b.played - a.played || a.name.localeCompare(b.name),
  );
  return {
    rows,
    unnamed,
    friendDuels: human.length,
    reason: rows.length ? null : human.length ? 'no-opponent-identity' : 'no-friend-duels',
  };
}

const emptyWeek = (key) => ({
  weekKey: key,
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  friendDuels: 0,
  answered: 0,
  correct: 0,
  accuracy: null,
  bestSport: null,
});

function weekSlice(profile, key, tz) {
  const w = emptyWeek(key);
  for (const m of matches(profile)) {
    if (!validDate(m.at) || weekKey(m.at, tz) !== key) continue;
    w.played += 1;
    if (m.bot === false) w.friendDuels += 1;
    if (m.outcome === 'win') w.wins += 1;
    else if (m.outcome === 'loss') w.losses += 1;
    else if (m.outcome === 'draw') w.draws += 1;
  }
  const byTopic = new Map();
  for (const r of rounds(profile)) {
    if (typeof r.correct !== 'boolean' || !validDate(r.at) || weekKey(r.at, tz) !== key) continue;
    w.answered += 1;
    if (r.correct) w.correct += 1;
    if (typeof r.topic === 'string' && r.topic) {
      const t = byTopic.get(r.topic) ?? { topic: r.topic, answered: 0, correct: 0 };
      t.answered += 1;
      if (r.correct) t.correct += 1;
      byTopic.set(r.topic, t);
    }
  }
  w.accuracy = w.answered ? Math.round((w.correct / w.answered) * 100) : null;
  const best = [...byTopic.values()]
    .filter((t) => t.correct > 0)
    .sort((a, b) => b.correct - a.correct || b.answered - a.answered || a.topic.localeCompare(b.topic))[0];
  w.bestSport = best ? { topic: best.topic, correct: best.correct, answered: best.answered } : null;
  return w;
}

const diff = (a, b) => (finite(a) && finite(b) ? a - b : null);

/**
 * You against you: this ISO week beside last week, every figure from the journal on this device.
 * Duels count every completed match (practice-bot duels included — they are real rounds you
 * answered — with friend duels broken out); accuracy is correct ÷ answered over duel rounds with a
 * recorded answer, as a whole percentage; best sport is the topic with the most correct answers.
 * Deltas are this week minus last week, null when either side has nothing to compare.
 * @param {any} profile
 * @param {{ at: number, tzOffsetMinutes?: number }} when
 */
export function youVsYou(profile, { at, tzOffsetMinutes = 0 } = {}) {
  const now = validDate(at) ? at : 0;
  const tz = finite(tzOffsetMinutes) ? tzOffsetMinutes : 0;
  const thisKey = weekKey(now, tz),
    lastKey = lastWeekKey(now, tz);
  const week = weekSlice(profile, thisKey, tz);
  const last = weekSlice(profile, lastKey, tz);
  return {
    weekKey: thisKey,
    lastWeekKey: lastKey,
    week,
    last,
    delta: {
      played: week.played - last.played,
      wins: week.wins - last.wins,
      friendDuels: week.friendDuels - last.friendDuels,
      answered: week.answered - last.answered,
      accuracy: diff(week.accuracy, last.accuracy),
    },
    empty: week.played === 0 && last.played === 0 && week.answered === 0 && last.answered === 0,
  };
}

/**
 * Which boards can be shown truthfully right now. `friends` needs at least one named rival on this
 * device; `leagues` and `global` need accounts (see ACCOUNTS_LIVE). `reason` is the one-line
 * explanation the UI prints when a board is off.
 */
export function boardsAvailable(profile) {
  const r = rivals(profile);
  return {
    friends: r.rows.length >= 1,
    leagues: ACCOUNTS_LIVE,
    global: ACCOUNTS_LIVE,
    friendDuels: r.friendDuels,
    rivalCount: r.rows.length,
    reason: ACCOUNTS_LIVE
      ? null
      : 'Leagues and the global view need accounts, which this build does not have. Rivals and your own week are real and on this device.',
  };
}
