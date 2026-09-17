/**
 * lib/duel-memory-store.mjs — the room store for the server-free (static) build.
 *
 * `dispatch()` in lib/server/duel-service.mjs only ever touches a store through eight methods.
 * `D1RoomStore` implements them as single SQL statements whose WHERE clauses are the atomicity
 * guards of the whole game: a write only lands if the revision still matches, a reveal only lands
 * inside the release window, an answer only lands before the receipt deadline. This module
 * reimplements the same eight methods over two Maps with the same return shapes, so the duel
 * engine cannot tell the difference. Every guard below names the SQL clause it mirrors.
 *
 * Atomicity: each method checks and writes inside one synchronous block (the body of an async
 * function runs to completion before any other task on the single browser thread), which is what
 * makes "read current revision, compare, swap" as indivisible here as the equivalent
 * `UPDATE ... WHERE revision=?` is in SQLite. Never introduce an `await` between a guard and its
 * write, or concurrent polling would be able to interleave and double-apply a round.
 */
import { RULES, readRoom, requireValue } from './server/room-engine.mjs';
import { settleExpiredRoom } from './server/duel-service.mjs';

const ADMISSION_LIMIT = 30;
const CLEANUP_LIMIT = 100;

/** `json_set(?, path, value)` over a room object: clone, stamp, serialize. */
function stamp(room, apply) {
  const next = JSON.parse(JSON.stringify(room));
  apply(next);
  return JSON.stringify(next);
}

export class MemoryRoomStore {
  /**
   * @param {object} [options]
   * @param {() => number} [options.clock] Stands in for SQLite's `julianday('now')` clock.
   * @param {boolean | (() => Promise<unknown>)} [options.yieldIO] Await before each call, the way
   *   real I/O does. Off in the browser (there is no I/O); tests pass the same yield the SQLite
   *   adapter uses, so concurrent callers interleave identically on both stores.
   * @param {object | null} [options.ledger] A play ledger (lib/ledger-memory-store.mjs) to stake
   *   entries and pay prizes on, the way every D1RoomStore does over its D1LedgerStore. The static
   *   build passes none: with no ledger the room keeps its demo coins (1,000 simulated a seat,
   *   moved inside the room blob), and the device wallet gates the entry on the client.
   */
  constructor({ clock = Date.now, yieldIO = false, ledger = null } = {}) {
    this.rooms = new Map();
    this.limits = new Map();
    this.now = clock;
    this.yieldIO = yieldIO;
    this.ledger = ledger;
    this.metrics = { statements: 0, conflicts: 0, guardedWriteMisses: 0 };
  }
  async #begin() {
    if (this.yieldIO)
      await (typeof this.yieldIO === 'function'
        ? this.yieldIO()
        : new Promise((resolve) => setTimeout(resolve, 0)));
    this.metrics.statements++;
  }
  /** SELECT CAST((julianday('now')-2440587.5)*86400000 AS INTEGER) AS db_now */
  async clock() {
    await this.#begin();
    return { db_now: Math.floor(this.now()) };
  }
  /** SELECT revision,state,expires_at,<db clock> FROM rooms WHERE id=? */
  async read(id) {
    await this.#begin();
    const row = this.rooms.get(id);
    if (!row) return null;
    return {
      revision: row.revision,
      state: row.state,
      expires_at: row.expires_at,
      db_now: Math.floor(this.now()),
    };
  }
  /** INSERT OR IGNORE INTO rooms ... → true only when this call created the row. */
  async insert(room) {
    await this.#begin();
    if (this.rooms.has(room.id)) return false;
    this.rooms.set(room.id, {
      id: room.id,
      revision: 0,
      state: JSON.stringify(room),
      expires_at: room.expiresAt,
      created_at: room.createdAt,
    });
    return true;
  }
  /** UPDATE rooms SET state=?,revision=revision+1 WHERE id=? AND revision=? */
  async compareSwap(id, revision, room) {
    await this.#begin();
    const row = this.rooms.get(id);
    if (!row || row.revision !== revision) {
      this.metrics.conflicts++;
      return false;
    }
    row.state = JSON.stringify(room);
    row.revision = revision + 1;
    return true;
  }
  /**
   * The reveal's durable issue time is stamped inside the successful write, and only while the
   * shared release window is open:
   *   WHERE id=? AND revision=? AND t>=scheduledAt AND t<scheduledAt+showWindowMs
   */
  async commitReveal(id, revision, room, seat, { databaseClock, now }) {
    await this.#begin();
    const t = databaseClock ? Math.floor(this.now()) : now;
    const row = this.rooms.get(id);
    const open = t >= room.round.scheduledAt && t < room.round.scheduledAt + RULES.showWindowMs;
    if (!row || row.revision !== revision || !open) {
      this.metrics.guardedWriteMisses++;
      return null;
    }
    row.state = stamp(room, (next) => {
      next.round.issuedAt[seat] = t;
      // The bot shares the host's issue stamp, exactly as the `botStamp` fragment of the SQL does.
      if (seat === 0 && room.players[1]?.kind === 'bot') next.round.issuedAt[1] = t;
    });
    row.revision = revision + 1;
    return { revision: row.revision, state: row.state, expires_at: row.expires_at };
  }
  /**
   * The answer's durable acceptance time is stamped inside the successful write, and only before
   * the receipt deadline: WHERE id=? AND revision=? AND t < issuedAt+duration*1000+graceMs
   */
  async commitAttempt(id, revision, room, seat, { databaseClock, now }) {
    await this.#begin();
    const a = room.round.answers[seat],
      issued = room.round.issuedAt[seat];
    const t = databaseClock ? Math.floor(this.now()) : now;
    const row = this.rooms.get(id);
    const inTime = t < issued + room.config.duration * 1000 + a.graceMs;
    if (!row || row.revision !== revision || !inTime) {
      this.metrics.guardedWriteMisses++;
      return null;
    }
    const residual = t - issued - a.elapsedMs;
    row.state = stamp(room, (next) => {
      const answer = next.round.answers[seat];
      answer.receivedAt = t;
      answer.serverElapsedMs = t - issued;
      answer.residualMs = residual;
      // SQLite BETWEEN is inclusive at both ends.
      answer.timingOK = residual >= -100 && residual <= a.graceMs;
    });
    row.revision = revision + 1;
    return { revision: row.revision, state: row.state, expires_at: row.expires_at };
  }
  /** INSERT ... ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count, then the 429 guard. */
  async admit(actor, now) {
    await this.#begin();
    const bucket = Math.floor(now / 60000),
      key = `${actor}:${bucket}`;
    const existing = this.limits.get(key);
    // On conflict only `count` moves; the row keeps the expiry written when it was created.
    if (existing) existing.count++;
    else this.limits.set(key, { key, count: 1, expires_at: (bucket + 2) * 60000 });
    const count = this.limits.get(key).count;
    requireValue(
      count <= ADMISSION_LIMIT,
      'Too many room requests. Please wait a minute.',
      429,
      'rate_limited',
    );
  }
  /**
   * The two bounded DELETEs (LIMIT 100 each) that the create path runs — and, with a ledger, the
   * same duty D1RoomStore.cleanup has first: an expired room still holding entries is settled
   * before its row goes, and one whose settlement fails is kept for the next sweep.
   */
  async cleanup(now) {
    await this.#begin();
    let rooms = 0;
    for (const [id, row] of this.rooms) {
      if (rooms >= CLEANUP_LIMIT) break;
      if (row.expires_at < now) {
        rooms++;
        if (this.ledger) {
          try {
            await settleExpiredRoom(this.ledger, readRoom(row.state), now);
          } catch {
            continue;
          }
        }
        this.rooms.delete(id);
      }
    }
    let limits = 0;
    for (const [key, row] of this.limits) {
      if (limits >= CLEANUP_LIMIT) break;
      if (row.expires_at < now) {
        this.limits.delete(key);
        limits++;
      }
    }
  }
}
