/**
 * lib/server/matchmaking.mjs — find a human rival.
 *
 * One row per waiting principal in `match_queue` (db/schema.ts, drizzle/0005_accounts.sql). A lane
 * is (sport, mode, stake): two players pair only when all three agree, and the rating the client
 * sends is a HINT that narrows who they meet first, never a gate — the window opens 50 points a
 * minute so nobody waits forever for a perfect match.
 *
 * HONESTY. Nothing here invents company. `waiting` is `COUNT(*)` of live rows in the caller's lane
 * (the caller included), no bot is ever enqueued or paired, and a search that finds nobody says so:
 * the client offers a free practice duel after 90 s, and the player chooses. No stake is taken by
 * the queue: coins move only when the room is created and joined, on the duel-service path.
 *
 * WHO CREATES THE ROOM. The poller that finds a partner is the host: it calls `dispatch('create')`
 * itself (seat 0) and leaves its partner a note to `join` (seat 1). The partner's next poll returns
 * that note once the room exists; the partner's own device then joins with its own credentials.
 * Neither device ever holds the other's token.
 *
 * THE ASSIGNMENT COLUMN (documented hack). The table has no room/credential columns, so a paired
 * row carries its assignment in `ticket` as `paired:` + JSON — see scratchpad/requests/matchmaking.md
 * for the `room_id` / `credential` columns that would replace it. Every reader of `ticket` goes
 * through `readAssignment` or the `NOT LIKE 'paired:%'` predicate, so swapping the encoding for real columns touches only
 * this file.
 *
 * PAIRED AT MOST ONCE. The queue row's primary key is the principal, and every claim is a compare-
 * and-swap on (principal_id, ticket): `UPDATE … WHERE principal_id = ? AND ticket = ?`. A row that
 * was already claimed, re-enqueued (new ticket) or deleted matches nothing, so two pollers racing
 * for the same partner cannot both win, and the poller claims ITS OWN row the same way so it cannot
 * be claimed by a third poller while it is claiming someone else. Order: claim the partner, claim
 * self, create the room; a lost claim or a refused create restores the rows it changed. The
 * tradeoff: three short statements instead of one transaction (D1's batch does not roll back on a
 * zero-row update), and a partner that sees its note before the host's create lands is told to
 * keep waiting until the room exists.
 */
import { D1RoomStore, dispatch as duelDispatch, hash } from './duel-service.mjs';
import { QUESTIONS } from './bank.mjs';
import { GameError, MODE_DURATION, MODE_ROUNDS, normalizeConfig, requireValue } from './room-engine.mjs';
import { readPrincipalId } from './wallet-service.mjs';
import { SPORTS } from '../season.mjs';

export const QUEUE = Object.freeze({
  /** A row not touched for this long is neither pairable nor counted, and the next poll sweeps it. */
  staleMs: 30000,
  /** Stale rows deleted per poll; the sweep is bounded so no poll pays for a pile-up. */
  sweepLimit: 50,
  /** Rating window at t = 0 … */
  baseWindow: 100,
  /** … plus this per minute waited. */
  widenPerMinute: 50,
  /** Rating hints outside this range are clamped, not rejected. */
  ratingMin: 0,
  ratingMax: 4000,
  defaultRating: 1000,
  /** After this the client offers a free practice duel. Copy lives in the launch panel. */
  offerPracticeAfterMs: 90000,
  /** The client's poll interval, here so the tests and the UI agree. */
  pollMs: 2000,
});

const ASSIGNED = 'paired:';
const TICKET = /^[a-f0-9]{32}$/;
const NOT_YOURS = 'That queue ticket is not yours.';

const session = (db) => (typeof db?.withSession === 'function' ? db.withSession('first-primary') : db);
const hex = (bytes) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
const newTicket = () => hex(16);
const newRoomId = () => hex(16);
const newToken = () => hex(24);

/** |rating gap| a poller accepts after waiting `waitedMs`: 100 at once, 150 after a minute, and so on. */
export function ratingWindow(waitedMs) {
  const minutes = Math.max(0, Number.isFinite(waitedMs) ? waitedMs : 0) / 60000;
  return Math.round(QUEUE.baseWindow + QUEUE.widenPerMinute * minutes);
}

/** The client's rating is a hint: any finite number is clamped, anything else is the start rating. */
export function readRatingHint(value) {
  if (!Number.isFinite(value)) return QUEUE.defaultRating;
  return Math.round(Math.max(QUEUE.ratingMin, Math.min(QUEUE.ratingMax, value)));
}

/** The room config a lane produces. `normalizeConfig` then applies every rule the engine has. */
export function laneConfig({ sport, mode, stake }) {
  return {
    opponent: 'friend',
    mode,
    stake,
    duration: MODE_DURATION[mode],
    domain: 'all',
    region: 'all',
    topic: sport,
    subtopic: 'all',
    difficulty: 'all',
  };
}

/**
 * A lane the engine can make a room for: a served sport, a real mode, an accepted entry and enough
 * questions. Refusals carry the engine's own messages, so the queue never accepts a lane a room
 * would refuse a minute later.
 */
export function readLane(input) {
  const lane = input && typeof input === 'object' ? input : {};
  requireValue(SPORTS.includes(lane.sport), 'Choose a sport to find a rival.');
  requireValue(typeof lane.mode === 'string' && Object.hasOwn(MODE_ROUNDS, lane.mode), 'Choose a valid mode.');
  requireValue(Number.isSafeInteger(lane.stake) && lane.stake >= 0, 'Choose a valid entry.');
  normalizeConfig(laneConfig(lane), QUESTIONS);
  return { sport: lane.sport, mode: lane.mode, stake: lane.stake };
}

function readTicket(value) {
  requireValue(typeof value === 'string' && TICKET.test(value), 'Missing queue ticket.', 400, 'invalid_request');
  return value;
}
function readNow(now) {
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  return now;
}
function readName(value) {
  requireValue(typeof value === 'string', 'Enter a player name.');
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  requireValue(name.length > 0 && name.length <= 24, 'Enter a name up to 24 characters.');
  return name;
}

/** The assignment a paired row carries, or null for a waiting row. */
export function readAssignment(ticket) {
  if (typeof ticket !== 'string' || !ticket.startsWith(ASSIGNED)) return null;
  try {
    const a = JSON.parse(ticket.slice(ASSIGNED.length));
    if (!a || typeof a !== 'object') return null;
    if (!TICKET.test(a.ticket) || !/^[a-f0-9]{32}$/.test(a.roomId)) return null;
    if (typeof a.token !== 'string' || typeof a.invite !== 'string') return null;
    if (a.seat !== 0 && a.seat !== 1) return null;
    return { ticket: a.ticket, roomId: a.roomId, token: a.token, invite: a.invite, seat: a.seat, at: a.at };
  } catch {
    return null;
  }
}
const encodeAssignment = (a) => ASSIGNED + JSON.stringify(a);
const lanePart = (row) => ({ sport: row.sport, mode: row.mode, stake: row.stake });

/** Bounded sweep of rows nobody has touched for `staleMs`. The caller's own row is spared: it is being touched. */
async function sweep(d, principalId, now) {
  await d
    .prepare(
      'DELETE FROM match_queue WHERE principal_id IN (SELECT principal_id FROM match_queue WHERE last_seen_at < ? AND principal_id <> ? LIMIT ?)',
    )
    .bind(now - QUEUE.staleMs, principalId, QUEUE.sweepLimit)
    .run();
}
async function liveCount(d, lane, now) {
  const row = await d
    .prepare(
      "SELECT COUNT(*) AS n FROM match_queue WHERE sport=? AND mode=? AND stake=? AND ticket NOT LIKE 'paired:%' AND last_seen_at>=?",
    )
    .bind(lane.sport, lane.mode, lane.stake, now - QUEUE.staleMs)
    .first();
  return Number(row?.n) || 0;
}
/** Compare-and-swap on (principal, ticket). True when this call moved the row. */
async function swapTicket(d, principalId, from, to, now) {
  const out = await d
    .prepare('UPDATE match_queue SET ticket=?, last_seen_at=? WHERE principal_id=? AND ticket=?')
    .bind(to, now, principalId, from)
    .run();
  return out.meta.changes === 1;
}
async function touch(d, principalId, ticket, now) {
  await d
    .prepare('UPDATE match_queue SET last_seen_at=? WHERE principal_id=? AND ticket=? AND last_seen_at<?')
    .bind(now, principalId, ticket, now)
    .run();
}
async function waitingView(d, row, ticket, now) {
  const lane = lanePart(row);
  const waitedMs = Math.max(0, now - Number(row.enqueued_at));
  return {
    state: 'waiting',
    ticket,
    lane,
    waiting: await liveCount(d, lane, now),
    waitedMs,
    window: ratingWindow(waitedMs),
  };
}
const pairedView = (a) => ({
  state: 'paired',
  roomId: a.roomId,
  join: { roomId: a.roomId, token: a.token, invite: a.invite, seat: a.seat },
});

/**
 * Take a place in a lane. Re-enqueueing in the same lane keeps the wait already served (the window
 * keeps widening); a different lane, a stale row or a paired row starts over. The ticket returned
 * is what every later `poll` and `leave` must present.
 */
export async function enqueue(db, { principalId, sport, mode, stake, rating, now }) {
  const id = readPrincipalId(principalId);
  const lane = readLane({ sport, mode, stake });
  const at = readNow(now);
  const ticket = newTicket();
  const d = session(db);
  await d
    .prepare(
      `INSERT INTO match_queue (principal_id,sport,mode,stake,rating,enqueued_at,last_seen_at,ticket) VALUES (?,?,?,?,?,?,?,?)
   ON CONFLICT(principal_id) DO UPDATE SET
   sport=excluded.sport, mode=excluded.mode, stake=excluded.stake, rating=excluded.rating,
   enqueued_at=CASE WHEN match_queue.sport=excluded.sport AND match_queue.mode=excluded.mode AND match_queue.stake=excluded.stake
     AND match_queue.ticket NOT LIKE 'paired:%' AND match_queue.last_seen_at>=? THEN match_queue.enqueued_at ELSE excluded.enqueued_at END,
   last_seen_at=excluded.last_seen_at, ticket=excluded.ticket`,
    )
    .bind(id, lane.sport, lane.mode, lane.stake, readRatingHint(rating), at, at, ticket, at - QUEUE.staleMs)
    .run();
  const row = await d.prepare('SELECT enqueued_at FROM match_queue WHERE principal_id=?').bind(id).first();
  const waitedMs = Math.max(0, at - Number(row?.enqueued_at ?? at));
  return {
    state: 'waiting',
    ticket,
    lane,
    waiting: await liveCount(d, lane, at),
    waitedMs,
    window: ratingWindow(waitedMs),
  };
}

/**
 * One heartbeat. Sweeps stale rows, keeps the caller's row alive, and either returns the caller's
 * assignment, pairs the caller with the oldest live partner inside the rating window, or reports
 * the honest waiting state. `name` is the caller's display name for the room it may create.
 *
 * `deps.store` is the room store `dispatch` writes to (defaults to a D1RoomStore over `db`);
 * `deps.dispatch` is the duel service (injectable for tests); `deps.actor` feeds the room
 * admission limiter exactly as the duel ingress does.
 */
export async function poll(db, { principalId, ticket, name, now }, deps = {}) {
  const id = readPrincipalId(principalId);
  const mine = readTicket(ticket);
  const at = readNow(now);
  const hostName = readName(name);
  const d = session(db);
  const store = deps.store ?? new D1RoomStore(db);
  const dispatch = deps.dispatch ?? duelDispatch;
  const ctx = {
    now: at,
    actor: deps.actor ?? (await hash(id)),
    principalId: id,
    rng: deps.rng ?? Math.random,
    useDatabaseClock: deps.useDatabaseClock ?? false,
  };
  await sweep(d, id, at);
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await d
      .prepare('SELECT principal_id,sport,mode,stake,rating,enqueued_at,last_seen_at,ticket FROM match_queue WHERE principal_id=?')
      .bind(id)
      .first();
    if (!row) return { state: 'expired' };
    const assigned = readAssignment(row.ticket);
    if (assigned) {
      requireValue(assigned.ticket === mine, NOT_YOURS, 403, 'unauthorized');
      await touch(d, id, row.ticket, at);
      // The guest's note can land a few milliseconds before the host's create: wait for the room.
      if (assigned.seat === 1 && !(await store.read(assigned.roomId))) return waitingView(d, row, mine, at);
      return pairedView(assigned);
    }
    requireValue(row.ticket === mine, NOT_YOURS, 403, 'unauthorized');
    await touch(d, id, mine, at);
    const lane = lanePart(row);
    const waitedMs = Math.max(0, at - Number(row.enqueued_at));
    const window = ratingWindow(waitedMs);
    const partner = await d
      .prepare(
        `SELECT principal_id,ticket,rating FROM match_queue
   WHERE sport=? AND mode=? AND stake=? AND principal_id<>? AND ticket NOT LIKE 'paired:%' AND last_seen_at>=? AND abs(rating-?)<=?
   ORDER BY enqueued_at ASC, principal_id ASC LIMIT 1`,
      )
      .bind(lane.sport, lane.mode, lane.stake, id, at - QUEUE.staleMs, Number(row.rating), window)
      .first();
    if (!partner) return waitingView(d, row, mine, at);
    const roomId = newRoomId(),
      invite = newToken();
    const forPartner = { ticket: partner.ticket, roomId, token: newToken(), invite, seat: 1, at };
    const forMe = { ticket: mine, roomId, token: newToken(), invite, seat: 0, at };
    const theirs = encodeAssignment(forPartner),
      ours = encodeAssignment(forMe);
    // Claim the partner; another poller may have got there first.
    if (!(await swapTicket(d, partner.principal_id, partner.ticket, theirs, at))) continue;
    // Claim self; a third poller may have taken this row while the partner was being claimed.
    if (!(await swapTicket(d, id, mine, ours, at))) {
      await swapTicket(d, partner.principal_id, theirs, partner.ticket, at);
      continue;
    }
    try {
      await dispatch(
        store,
        { action: 'create', roomId, token: forMe.token, invite, name: hostName, config: laneConfig(lane) },
        ctx,
      );
    } catch (error) {
      // The room was refused (an entry the wallet cannot cover, a rate limit): both go back to waiting.
      await swapTicket(d, id, ours, mine, at);
      await swapTicket(d, partner.principal_id, theirs, partner.ticket, at);
      throw error;
    }
    return pairedView(forMe);
  }
  const row = await d
    .prepare('SELECT sport,mode,stake,enqueued_at FROM match_queue WHERE principal_id=?')
    .bind(id)
    .first();
  if (!row) return { state: 'expired' };
  return waitingView(d, row, mine, at);
}

/** Leave the lane. Idempotent: a row already gone, or held under another ticket, changes nothing. */
export async function leave(db, { principalId, ticket }) {
  const id = readPrincipalId(principalId);
  const mine = readTicket(ticket);
  const d = session(db);
  const row = await d.prepare('SELECT ticket FROM match_queue WHERE principal_id=?').bind(id).first();
  if (!row) return { ok: true, removed: false };
  const held = readAssignment(row.ticket)?.ticket ?? row.ticket;
  if (held !== mine) return { ok: true, removed: false };
  const out = await d
    .prepare('DELETE FROM match_queue WHERE principal_id=? AND ticket=?')
    .bind(id, row.ticket)
    .run();
  return { ok: true, removed: out.meta.changes === 1 };
}

// -------------------------------------------------------------------------------------------
// PRESENCE — how many real people are in each format right now.
//
// Two counts per mode, and both of them are PEOPLE, because the region that carries them is
// announced as "Players in each format right now":
//  - `inQueue`: live `match_queue` rows, i.e. last seen inside `QUEUE.staleMs` and NOT carrying an
//    assignment (`ticket NOT LIKE 'paired:%'`), because a paired row has left the queue for a room.
//  - `inGame`: the seated players of rooms that are actually mid-match — phase scheduled, playing
//    or between, not expired, created inside `PRESENCE_ROOM_WINDOW_MS`, and not a practice duel
//    against the house bot. Two humans in one room count as two, because they are two people.
//
// WHAT THIS NUMBER IS NOT. It is grouped by MODE ALONE. Pairing happens in a lane — (sport, mode,
// stake) — so `liveCount` (the number the launch panel prints during a search) binds all three and
// is a strict subset of this one. They are different questions and they will legitimately differ:
// four people queued for Quick Draw across three sports is "4" here and "1 in your lane" there.
// The copy under the card says "this format" for exactly that reason (lib/i18n/en.mjs
// `presence.line`); do not reword it as rivals you can meet, and do not claim parity with
// `liveCount` — there is none.
//
// THE ACTIVITY WINDOW. Nothing settles a room whose players simply close the tab: the row lives
// until `RULES.ttlMs` (2 h) sweeps it, so without a window one abandoned Quick Draw room would be
// reported as a live match for roughly five hundred times its real length. `created_at` inside
// `PRESENCE_ROOM_WINDOW_MS` is the cheap, index-friendly bound: 45 minutes covers an invited friend arriving late and is still a fraction of the
// longest Gauntlet, so a real match is never dropped, and an abandoned one stops being company.
//
// HONESTY. Nothing is padded, rounded up, smoothed or held over: a mode nobody is playing reports
// zero, and the client prints that zero rather than a "busy" word. No identity of any kind leaves
// this function — a count per mode and the clock it was taken at, nothing else — which is why the
// ingress serves it without a principal.
// -------------------------------------------------------------------------------------------

/** The formats presence reports, in the engine's own order. */
export const PRESENCE_MODES = Object.freeze(Object.keys(MODE_ROUNDS));
/** A room in one of these phases is a match in progress; `waiting`, `complete` and `cancelled` are not. */
export const IN_GAME_PHASES = Object.freeze(['scheduled', 'playing', 'between']);
/**
 * How long after it was created a room may still be counted as a match in progress. Nothing marks
 * a room abandoned, so this is the only thing between a closed tab and a fabricated live match.
 */
export const PRESENCE_ROOM_WINDOW_MS = 45 * 60 * 1000;

const IN_GAME_LIST = IN_GAME_PHASES.map((p) => `'${p}'`).join(',');

/**
 * Live counts per mode. Never throws for an empty database: every mode is present at zero, so the
 * client can print a line for a format nobody has ever played.
 */
export async function presence(db, { now } = {}) {
  const at = readNow(now);
  const d = session(db);
  const modes = {};
  for (const mode of PRESENCE_MODES) modes[mode] = { inQueue: 0, inGame: 0 };
  const queued = await d
    .prepare(
      "SELECT mode AS mode, COUNT(*) AS n FROM match_queue WHERE ticket NOT LIKE 'paired:%' AND last_seen_at>=? GROUP BY mode",
    )
    .bind(at - QUEUE.staleMs)
    .all();
  for (const row of queued?.results ?? []) if (modes[row.mode]) modes[row.mode].inQueue = Number(row.n) || 0;
  // Seats, not rooms. A bot room is excluded by `config.opponent`, which `attachBot` sets at the
  // moment it takes the empty seat, so every room left here holds two humans and every filled seat
  // below is a person. Summing the two seats rather than multiplying by two keeps the SQL honest
  // if a future format ever seats a different number.
  const playing = await d
    .prepare(
      `SELECT json_extract(state,'$.config.mode') AS mode,
   SUM((json_extract(state,'$.players[0]') IS NOT NULL)+(json_extract(state,'$.players[1]') IS NOT NULL)) AS n
   FROM rooms
   WHERE expires_at>=? AND created_at>=? AND json_extract(state,'$.phase') IN (${IN_GAME_LIST})
     AND json_extract(state,'$.config.opponent')<>'bot'
   GROUP BY mode`,
    )
    .bind(at, at - PRESENCE_ROOM_WINDOW_MS)
    .all();
  for (const row of playing?.results ?? []) if (modes[row.mode]) modes[row.mode].inGame = Number(row.n) || 0;
  for (const mode of PRESENCE_MODES) Object.freeze(modes[mode]);
  return Object.freeze({ asOf: at, modes: Object.freeze(modes) });
}

export { GameError };
