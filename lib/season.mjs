// Per-sport rating tiers, seasons on the real sport calendar, matchweek streaks with free shields,
// and the Supporter Card record. Everything here is device-local and pure: timestamps are passed in
// as `at` (ms) with `tzOffsetMinutes` (minutes EAST of UTC, i.e. `-new Date().getTimezoneOffset()`),
// nothing reads Date.now() or Math.random(), and every reducer returns the same object when nothing
// changed. Nothing in this module takes coins or an ad: a streak is kept by playing or by a shield
// that was earned by playing, and there is deliberately no function that repairs one.
import { EVENTS } from './events-data.mjs';

export const SPORTS = Object.freeze(['Football', 'Cricket', 'Baseball', 'Formula 1', 'Basketball']);
export function sportOfTopic(topic) {
  return SPORTS.includes(topic) ? topic : null;
}

// ---------------------------------------------------------------------------------------------------
// Rating: Elo-style, per sport. Only duels against a human are rated; the practice bot answers from a
// plan, so a result against it says nothing about the player that a rating should carry.
export const START_RATING = 1000;
export const PROVISIONAL_DUELS = 10;
export const K_EARLY = 40;
export const K_SETTLED = 20;
export const OUTCOMES = Object.freeze(['win', 'loss', 'draw']);
const SCORE = Object.freeze({ win: 1, loss: 0, draw: 0.5 });

export const SEASON_TIERS = Object.freeze([
  Object.freeze({ id: 'rookie', label: 'Rookie', min: 0 }),
  Object.freeze({ id: 'squad', label: 'Squad', min: 950 }),
  Object.freeze({ id: 'starter', label: 'Starter', min: 1050 }),
  Object.freeze({ id: 'captain', label: 'Captain', min: 1150 }),
  Object.freeze({ id: 'legend', label: 'Legend', min: 1300 }),
]);
const TIER_IDS = SEASON_TIERS.map((t) => t.id);
export function tierById(id) {
  return SEASON_TIERS.find((t) => t.id === id) || SEASON_TIERS[0];
}
export function tierFor(rating) {
  const r = Number.isFinite(rating) ? rating : START_RATING;
  let tier = SEASON_TIERS[0];
  for (const t of SEASON_TIERS) if (r >= t.min) tier = t;
  return tier;
}
export function nextTier(rating) {
  return SEASON_TIERS.find((t) => t.min > (Number.isFinite(rating) ? rating : START_RATING)) || null;
}
const tierIndex = (id) => Math.max(0, TIER_IDS.indexOf(id));
const higherTier = (a, b) => (tierIndex(a) >= tierIndex(b) ? a : b);

export function expectedScore(rating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}
export function kFor(ratedGames) {
  return ratedGames < PROVISIONAL_DUELS ? K_EARLY : K_SETTLED;
}
export function emptyRating() {
  return {
    rating: START_RATING,
    ratedGames: 0,
    provisional: true,
    floorTier: 'rookie',
    seasonId: null,
    duels: 0,
    lastAt: null,
  };
}
/**
 * One rated result. `opponent` defaults to 'human'; a bot result is returned untouched. An unknown
 * opponent rating (a friend room carries none today) counts as 1000, and `provisional` stays true
 * until ten rated duels have been played so the card can say the number is still settling.
 */
export function rateDuel(sport, record, { opponentRating, outcome, opponent = 'human' } = {}) {
  if (!sportOfTopic(sport) || !OUTCOMES.includes(outcome) || opponent === 'bot') return record;
  const base = { ...emptyRating(), ...record };
  const opp = Number.isFinite(opponentRating) ? opponentRating : START_RATING;
  const k = kFor(base.ratedGames);
  const rating = Math.round(base.rating + k * (SCORE[outcome] - expectedScore(base.rating, opp)));
  const ratedGames = base.ratedGames + 1;
  return {
    ...base,
    rating,
    ratedGames,
    provisional: ratedGames < PROVISIONAL_DUELS,
    floorTier: higherTier(base.floorTier, tierFor(rating).id),
  };
}
/**
 * Season start: pull the rating half way back to 1000, but never below the floor of the best tier
 * reached last season (or in the off-season between — those duels count toward this floor). The new
 * season's floor starts where the reset lands.
 */
export function softReset(record, seasonId) {
  const base = { ...emptyRating(), ...record };
  const pulled = Math.round(START_RATING + (base.rating - START_RATING) / 2);
  const rating = Math.max(pulled, tierById(base.floorTier).min);
  return { ...base, rating, seasonId, floorTier: tierFor(rating).id };
}

// ---------------------------------------------------------------------------------------------------
// Seasons: one FACT//DUEL season per real season. Bounds come from the verified calendar in
// lib/events-data.mjs where an entry exists, so the two files cannot drift apart silently.
const eventById = (id) => EVENTS.find((e) => e.id === id);
const bounds = (id, start, end) => {
  const e = eventById(id);
  return { start: e?.start || start, end: e?.end || end };
};
const f1_26 = bounds('f1-2026-season', '2026-03-08', '2026-12-06');
const f1_27 = bounds('f1-2027-season', '2027-03-14', '2027-12-12');
const mlb_26 = {
  start: bounds('mlb-2026-regular-season', '2026-03-26', '2026-09-27').start,
  end: bounds('world-series-2026', '2026-10-23', '2026-10-31').end,
};
const cwc_27 = bounds('cricket-world-cup-2027', '2027-10-04', '2027-11-21');
export const SEASONS = Object.freeze(
  [
    { sport: 'Football', id: 'football-2026-27', label: 'Football 2026–27', start: '2026-08-21', end: '2027-05-30' },
    { sport: 'Basketball', id: 'basketball-2026-27', label: 'Basketball 2026–27', start: '2026-10-20', end: '2027-04-11' },
    { sport: 'Formula 1', id: 'f1-2026', label: 'Formula 1 2026', ...f1_26 },
    { sport: 'Formula 1', id: 'f1-2027', label: 'Formula 1 2027', ...f1_27 },
    { sport: 'Baseball', id: 'baseball-2026', label: 'Baseball 2026', ...mlb_26 },
    {
      sport: 'Baseball',
      id: 'baseball-2027',
      label: 'Baseball 2027',
      start: '2027-03-25',
      end: '2027-10-30',
      note: 'The CBA expires 1 December 2026. If a lockout moves the season, this window moves with it.',
    },
    { sport: 'Cricket', id: 'cricket-wc-2027', label: 'Cricket World Cup 2027', ...cwc_27 },
  ].map((s) => Object.freeze(s)),
);
export const OFF_SEASON_LABEL = Object.freeze({ Football: 'Transfer window', Baseball: 'Hot Stove' });

// Local calendar arithmetic without Date-object timezones: shift the instant by the offset and read
// it as UTC. `dayIndex` is whole days since 1970-01-01 (a Thursday), so Monday is index % 7 === 4.
const DAY_MS = 86_400_000;
export function localDayIndex(at, tzOffsetMinutes = 0) {
  const off = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0;
  return Math.floor((at + off * 60_000) / DAY_MS);
}
export function dayIso(index) {
  return new Date(index * DAY_MS).toISOString().slice(0, 10);
}
export function dayIndexOf(iso) {
  return Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
}
export function localDay(at, tzOffsetMinutes = 0) {
  return dayIso(localDayIndex(at, tzOffsetMinutes));
}
/** ISO week (Monday to Sunday) as a whole number of weeks since the Monday before the epoch. */
export function weekIndexOf(dayIndex) {
  return Math.floor((dayIndex + 3) / 7);
}
export function localWeek(at, tzOffsetMinutes = 0) {
  return weekIndexOf(localDayIndex(at, tzOffsetMinutes));
}
/** The Monday that starts an ISO week, as 'YYYY-MM-DD'. */
export function weekStartIso(weekIndex) {
  return dayIso(weekIndex * 7 - 3);
}
/**
 * The season containing `at` for this sport, with `daysLeft` (inclusive of today); otherwise an
 * off-season record naming the next season when the calendar has one.
 */
export function seasonFor(sport, at, tzOffsetMinutes = 0) {
  if (!sportOfTopic(sport)) return null;
  const day = localDayIndex(at, tzOffsetMinutes);
  const own = SEASONS.filter((s) => s.sport === sport);
  const current = own.find((s) => day >= dayIndexOf(s.start) && day <= dayIndexOf(s.end));
  if (current) return { ...current, offSeason: false, daysLeft: dayIndexOf(current.end) - day + 1 };
  const next = own.filter((s) => dayIndexOf(s.start) > day).sort((a, b) => (a.start < b.start ? -1 : 1))[0] || null;
  return {
    sport,
    offSeason: true,
    label: OFF_SEASON_LABEL[sport] || 'Off-season',
    next,
    daysUntil: next ? dayIndexOf(next.start) - day : null,
  };
}

// ---------------------------------------------------------------------------------------------------
// Matchweek streak: one duel of the sport in an ISO week (Monday to Sunday, local) keeps it alive. A
// missed week spends a shield if one is held, otherwise the streak starts over. Shields are earned
// only by seven consecutive local days with a duel in this sport, two held at most.
export const MAX_SHIELDS = 2;
export const SHIELD_DAYS = 7;
export function emptyStreak() {
  return { current: 0, best: 0, lastWeek: null, lastDay: null, shields: 0, shieldProgressDays: 0 };
}
export function advanceStreak(streak, { at, tzOffsetMinutes = 0 } = {}) {
  if (!Number.isFinite(at)) return streak;
  const s = { ...emptyStreak(), ...streak };
  const day = localDayIndex(at, tzOffsetMinutes),
    week = weekIndexOf(day);
  let { current, best, shields, shieldProgressDays } = s;
  // Shield progress: consecutive local days, any duel in this sport.
  if (s.lastDay === null) shieldProgressDays = 1;
  else if (day === s.lastDay) shieldProgressDays = s.shieldProgressDays;
  else if (day === s.lastDay + 1) shieldProgressDays = s.shieldProgressDays + 1;
  else if (day > s.lastDay) shieldProgressDays = 1;
  else return streak; // a duel recorded out of order changes nothing
  if (shieldProgressDays >= SHIELD_DAYS) {
    shields = Math.min(MAX_SHIELDS, shields + 1);
    shieldProgressDays = 0;
  }
  // Week streak.
  if (s.lastWeek === null) current = 1;
  else if (week === s.lastWeek) current = s.current;
  else {
    const missed = week - s.lastWeek - 1;
    if (missed === 0) current = s.current + 1;
    else if (shields >= missed) {
      shields -= missed;
      current = s.current + 1;
    } else current = 1;
  }
  best = Math.max(best, current);
  const next = { current, best, lastWeek: week, lastDay: day, shields, shieldProgressDays };
  const same = !!streak && Object.keys(next).every((k) => streak[k] === next[k]);
  return same ? streak : next;
}

// ---------------------------------------------------------------------------------------------------
// The Supporter Card record.
export const AGE_BANDS = Object.freeze(['under-18', '18-plus', 'prefer-not']);
export const HANDLE_RE = /^[A-Za-z0-9_]{1,24}$/;
export const ALLEGIANCE_MAX = 40;
export function emptySupporter() {
  return { version: 1, allegiance: {}, ratings: {}, streaks: {}, ageBand: null, handle: null, completedAt: null };
}
const nat = (x) => (Number.isInteger(x) && x >= 0 ? x : 0);
const stamp = (x) => (Number.isFinite(x) ? x : null);
const cleanTeam = (x) => (typeof x === 'string' ? x.trim().slice(0, ALLEGIANCE_MAX).trim() : '');
function readRating(r) {
  if (!r || typeof r !== 'object') return null;
  const ratedGames = nat(r.ratedGames);
  return {
    rating: Number.isFinite(r.rating) ? Math.round(r.rating) : START_RATING,
    ratedGames,
    provisional: ratedGames < PROVISIONAL_DUELS,
    floorTier: TIER_IDS.includes(r.floorTier) ? r.floorTier : 'rookie',
    seasonId: typeof r.seasonId === 'string' && r.seasonId.length <= 40 ? r.seasonId : null,
    duels: nat(r.duels),
    lastAt: stamp(r.lastAt),
  };
}
function readStreak(s) {
  if (!s || typeof s !== 'object') return null;
  const current = nat(s.current);
  return {
    current,
    best: Math.max(current, nat(s.best)),
    lastWeek: Number.isInteger(s.lastWeek) ? s.lastWeek : null,
    lastDay: Number.isInteger(s.lastDay) ? s.lastDay : null,
    shields: Math.min(MAX_SHIELDS, nat(s.shields)),
    shieldProgressDays: Math.min(SHIELD_DAYS - 1, nat(s.shieldProgressDays)),
  };
}
/** Sanitiser: `readSupporter(JSON.parse(JSON.stringify(x)))` deep-equals `x`; garbage reads as empty. */
export function readSupporter(value) {
  const out = emptySupporter();
  if (!value || typeof value !== 'object' || value.version !== 1) return out;
  for (const sport of SPORTS) {
    const team = cleanTeam(value.allegiance?.[sport]);
    if (team) out.allegiance[sport] = team;
    const rating = readRating(value.ratings?.[sport]);
    if (rating) out.ratings[sport] = rating;
    const streak = readStreak(value.streaks?.[sport]);
    if (streak) out.streaks[sport] = streak;
  }
  out.ageBand = AGE_BANDS.includes(value.ageBand) ? value.ageBand : null;
  out.handle = typeof value.handle === 'string' && HANDLE_RE.test(value.handle) ? value.handle : null;
  out.completedAt = stamp(value.completedAt);
  return out;
}
/**
 * Actions: allegiance, age-band, handle, duel-result, complete. Identity-preserving. `at` is the
 * profile action's timestamp; a duel-result may carry its own `at` and `tzOffsetMinutes`.
 */
export function reduceSupporter(sup, action, at) {
  if (!action || typeof action !== 'object') return sup;
  const base = sup && typeof sup === 'object' ? sup : emptySupporter();
  switch (action.type) {
    case 'allegiance': {
      const sport = sportOfTopic(action.sport);
      if (!sport) return sup;
      const team = cleanTeam(action.team);
      const prior = base.allegiance?.[sport] || '';
      if (team === prior) return sup;
      const allegiance = { ...base.allegiance };
      if (team) allegiance[sport] = team;
      else delete allegiance[sport];
      return { ...base, allegiance };
    }
    case 'age-band': {
      if (!AGE_BANDS.includes(action.band) || base.ageBand === action.band) return sup;
      return { ...base, ageBand: action.band };
    }
    case 'handle': {
      const raw = typeof action.handle === 'string' ? action.handle.trim() : '';
      const handle = raw ? (HANDLE_RE.test(raw) ? raw : null) : null;
      if (raw && !handle) return sup; // a handle that breaks the rule is refused, not silently edited
      if (handle === base.handle) return sup;
      return { ...base, handle };
    }
    case 'duel-result': {
      const sport = sportOfTopic(action.sport);
      const when = Number.isFinite(action.at) ? action.at : at;
      if (!sport || !OUTCOMES.includes(action.outcome) || !Number.isFinite(when)) return sup;
      const opponent = action.opponent === 'bot' ? 'bot' : 'human';
      const tz = Number.isFinite(action.tzOffsetMinutes) ? action.tzOffsetMinutes : 0;
      let rating = base.ratings?.[sport] || emptyRating();
      const season = seasonFor(sport, when, tz);
      if (!season.offSeason && rating.seasonId !== season.id) rating = softReset(rating, season.id);
      rating = rateDuel(sport, rating, { opponentRating: action.opponentRating, outcome: action.outcome, opponent });
      rating = { ...rating, duels: rating.duels + 1, lastAt: when };
      const streak = advanceStreak(base.streaks?.[sport] || emptyStreak(), { at: when, tzOffsetMinutes: tz });
      return {
        ...base,
        ratings: { ...base.ratings, [sport]: rating },
        streaks: { ...base.streaks, [sport]: streak },
      };
    }
    case 'complete': {
      if (base.completedAt !== null || !Number.isFinite(at)) return sup;
      return { ...base, completedAt: at };
    }
    default:
      return sup;
  }
}

// ---------------------------------------------------------------------------------------------------
// Card completeness: seven steps. The two the card starts with are the two that are genuinely done
// the moment a profile exists; nothing is shown as done that did not happen on this device.
export const CARD_STEPS = 7;
export function cardProgress(sup, profile) {
  const s = sup && typeof sup === 'object' ? sup : emptySupporter();
  const hasProfile = !!profile && typeof profile === 'object';
  const duels = Object.values(s.ratings || {}).reduce((n, r) => n + nat(r?.duels), 0);
  const rated = Object.values(s.ratings || {}).filter((r) => nat(r?.ratedGames) > 0).length;
  const steps = [
    { id: 'profile', label: 'Profile created', done: true },
    { id: 'wallet', label: 'Wallet opened', done: hasProfile },
    { id: 'duel', label: 'First duel played', done: duels > 0 || profile?.passport?.played === true },
    { id: 'allegiance', label: 'Picked a side in one sport', done: Object.keys(s.allegiance || {}).length > 0 },
    { id: 'handle', label: 'Chose a handle', done: typeof s.handle === 'string' && s.handle.length > 0 },
    { id: 'age', label: 'Answered the age question', done: AGE_BANDS.includes(s.ageBand) },
    { id: 'rated', label: 'Rated in three sports', done: rated >= 3 },
  ];
  return { done: steps.filter((x) => x.done).length, total: CARD_STEPS, steps };
}
