/**
 * lib/server/ops-service.mjs — the maintenance pass, the kill switch, and the heartbeat.
 *
 * WHY THIS EXISTS. Nothing in this deployment can schedule itself. The manifest is generated from
 * `.openai/hosting.json` and the resulting `dist/server/wrangler.json` carries `triggers:{}`,
 * `kv_namespaces:[]`, empty queues and no Durable Object bindings, so there is no Cron Trigger, no
 * queue consumer and no alarm to hang a background job on. The only recurring work the repository
 * can actually declare is a GitHub Actions `schedule:` calling an authenticated route — which is
 * what `.github/workflows/sweep.yml` does, and this module is what it calls into.
 *
 * TWO CONSEQUENCES, BOTH LOAD-BEARING.
 *
 * 1. A GitHub Actions schedule is best-effort: delayed by minutes to hours under load, and disabled
 *    entirely after 60 days of repository inactivity. So no invariant may DEPEND on a sweep running.
 *    The sweep is a backstop and a reconciler, never a correctness component. Anything that must be
 *    true has to be made true synchronously in the request that changes the world.
 *
 * 2. A driver that lives outside the system can simply stop calling, and a job that stops running
 *    looks exactly like a job with nothing to do. `sweep()` therefore ALWAYS writes an `ops_runs`
 *    row — opened before any work, closed after it, closed even when the work throws — so that
 *    silence becomes detectable. `health()` is the reader of that evidence: it reports the newest
 *    run per kind and whether it has gone quiet. That pair is the dead man's switch.
 *
 * WHY THE FLAGS ARE HERE AND NOT IN `admission_limits`. The kill switch needs somewhere durable to
 * live. `admission_limits` is a per-minute rate-limit counter whose rows are DELETED once their
 * `expires_at` passes (`D1RoomStore.cleanup`), so a flag parked there would silently evaporate —
 * the one failure mode a kill switch may never have. `ops_flags` is its own tiny table, and
 * `updated_by` is NOT NULL and actually written on every set: the architecture decision calls out
 * that every proposal declared an attribution column and none supplied a writer for it. After a
 * hard stop the first runbook question is "who stopped it, and when"; the answer has to be a row.
 *
 * This module is server-only. It is never imported by a client component and never reaches the
 * static bundle, which has no server and therefore no ops surface at all.
 */
import { GameError, requireValue } from './room-engine.mjs';
import { D1RoomStore } from './duel-service.mjs';
import { D1LedgerStore } from './ledger-store-d1.mjs';
import { reconcile } from './reconcile.mjs';
import { D1WalletStore, cleanupWallet } from './wallet-service.mjs';
import { cleanupAuth } from './auth-service.mjs';

export const OPS = Object.freeze({
  /** Every kind the heartbeat expects to see; `health` reports on all of them. */
  kinds: Object.freeze(['sweep', 'reconcile']),
  /** What `.github/workflows/sweep.yml` asks for. Actions will not honour it precisely. */
  intervalMs: 3_600_000,
  /**
   * Three missed hours before a kind reads as stale. Deliberately loose: Actions schedules run late
   * under load, and a staleness alarm that cries wolf every week is an alarm people mute.
   */
  staleAfterMs: 3 * 3_600_000,
  /** A run that opened this long ago and never closed is stuck, not slow. */
  stuckAfterMs: 900_000,
  /** Detail is an operator's breadcrumb, not a log sink. */
  maxDetailLength: 1000,
  maxFlagKeyLength: 64,
  maxFlagValueLength: 256,
  maxActorLength: 64,
});

const SWEEP = 'sweep';
const RECONCILE = 'reconcile';
const FLAG_KEY = /^[a-z][a-z0-9_.-]{0,63}$/;

/** Same scrub `nameOf` applies to player names: control characters never reach a stored string. */
function printable(value, limit, message) {
  requireValue(typeof value === 'string', message);
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  requireValue(clean.length > 0 && clean.length <= limit, message);
  return clean;
}

/**
 * What a failed sweep is allowed to record. A `GameError` carries an operator-facing message and is
 * safe; anything else could be a driver string containing a bound value, so only its class name is
 * kept. The run is still marked failed either way — the row's existence is the signal.
 */
function describeFailure(error) {
  const text =
    error instanceof GameError
      ? `${error.code}: ${error.message}`
      : `unexpected: ${error?.constructor?.name ?? typeof error}`;
  return text.slice(0, OPS.maxDetailLength);
}

function newRunId() {
  return crypto.randomUUID().replaceAll('-', '');
}

/**
 * The ops tables over the SAME D1 session as the room store it extends.
 *
 * Extending rather than composing is the point: `D1RoomStore`'s constructor opens a
 * `withSession('first-primary')` handle, and a separately constructed store over the same `env.DB`
 * would get an INDEPENDENT session with an independent bookmark — no read-your-writes relationship
 * between the cleanup it performs and the heartbeat it records. One store, one session, one
 * consistent view.
 */
export class D1OpsStore extends D1RoomStore {
  /** Opens the heartbeat. Written BEFORE any work, so a crash mid-sweep still leaves a trace. */
  async openRun({ runId, kind, startedAt }) {
    await this.db
      .prepare(
        'INSERT INTO ops_runs (id,kind,started_at,finished_at,ok,detail) VALUES (?,?,?,NULL,0,NULL)',
      )
      .bind(runId, kind, startedAt)
      .run();
  }
  /** Closes it. `ok` is 1 or 0; a row that never reaches here is the stuck case `health` reports. */
  async closeRun({ runId, finishedAt, ok, detail }) {
    await this.db
      .prepare('UPDATE ops_runs SET finished_at=?,ok=?,detail=? WHERE id=?')
      .bind(finishedAt, ok ? 1 : 0, detail ?? null, runId)
      .run();
  }
  /**
   * The newest run per kind, in one statement. `MAX(started_at)` decides the winner and the
   * remaining columns come from that same row, which is bare-column-with-MAX — a documented SQLite
   * guarantee, not an accident.
   */
  async readLastRuns() {
    const out = await this.db
      .prepare(
        'SELECT kind,MAX(started_at) AS started_at,id,finished_at,ok,detail FROM ops_runs GROUP BY kind ORDER BY kind',
      )
      .all();
    return out.results ?? [];
  }
  /** Last-writer-wins, with the writer's name. There is no version guard: a kill switch must land. */
  async writeFlag({ key, value, updatedBy, updatedAt }) {
    await this.db
      .prepare(
        `INSERT INTO ops_flags (key,value,updated_by,updated_at) VALUES (?,?,?,?)
   ON CONFLICT(key) DO UPDATE SET
   value=excluded.value,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
      )
      .bind(key, value, updatedBy, updatedAt)
      .run();
  }
  async readFlags() {
    const out = await this.db
      .prepare('SELECT key,value,updated_by,updated_at FROM ops_flags ORDER BY key')
      .all();
    return out.results ?? [];
  }
}

/**
 * One maintenance pass, and one `ops_runs` row for it — always, including when there was nothing to
 * do and including when the work throws. The heartbeat is the product here; the work is incidental
 * and, today, is exactly the room/rate-limit cleanup that `D1RoomStore.cleanup` already performs.
 * It is called rather than reimplemented: two copies of a bounded DELETE would drift, and the
 * version in the store is the one the duel path exercises on every room creation.
 *
 * `now` stamps the start; `clock` is read again at the end, because a sweep's DURATION is the thing
 * an operator watches and a single stamp cannot show it. A failure is recorded and then re-thrown:
 * the caller must see a non-2xx, or the workflow goes green on a broken sweep.
 */
export async function sweep({ store, now = Date.now(), clock = Date.now } = {}) {
  requireValue(
    store && typeof store.openRun === 'function' && typeof store.closeRun === 'function',
    'The operations service is unavailable.',
    503,
    'service_unavailable',
  );
  requireValue(Number.isFinite(now), 'Invalid request.');
  const runId = newRunId();
  await store.openRun({ runId, kind: SWEEP, startedAt: now });
  try {
    // The only real work today. Bounded to 100 rows per table by the store, so a sweep is cheap
    // and a large backlog drains over several runs rather than blocking one.
    if (typeof store.cleanup === 'function') await store.cleanup(now);
    // Expired ad nonces are noise; redemptions are evidence and are never touched.
    await cleanupWallet({ store: new D1WalletStore(store.db), now });
    // Expired magic links and dead sessions: bounded per run, evidence rows untouched.
    await cleanupAuth(store.db, { now });
    const finishedAt = clock();
    const detail = 'cleanup: rooms, admission_limits, ad_nonces, magic_links, sessions';
    await store.closeRun({ runId, finishedAt, ok: 1, detail });
    return Object.freeze({ runId, kind: SWEEP, startedAt: now, finishedAt, ok: true, detail });
  } catch (error) {
    // Best effort: if the database is the thing that broke, this write fails too and the run stays
    // open — which `health` reports as stuck, which is the honest description of what happened.
    try {
      await store.closeRun({ runId, finishedAt: clock(), ok: 0, detail: describeFailure(error) });
    } catch {
      /* the original failure is the one worth propagating */
    }
    throw error;
  }
}

/**
 * Replays the ledger through the pure invariants and compares it with the cached heads. The run
 * row is the evidence: `ok` is 0 when the books do not balance, and `detail` says why in the
 * operator's words. Drift is NOT repaired here — a job that silently fixes a ledger is a job that
 * silently hides a bug — so a failed reconcile throws after recording itself, and the workflow
 * goes red, which is the whole point.
 */
export async function reconcileLedger({ store, now = Date.now(), clock = Date.now, ledger = null } = {}) {
  requireValue(
    store && typeof store.openRun === 'function' && typeof store.closeRun === 'function',
    'The operations service is unavailable.',
    503,
    'service_unavailable',
  );
  requireValue(Number.isFinite(now), 'Invalid request.');
  const runId = newRunId();
  await store.openRun({ runId, kind: RECONCILE, startedAt: now });
  try {
    const books = ledger ?? new D1LedgerStore(store.db);
    const report = await reconcile(books);
    const finishedAt = clock();
    const detail = describeReport(report);
    await store.closeRun({ runId, finishedAt, ok: report.ok ? 1 : 0, detail });
    requireValue(report.ok, `The ledger did not reconcile: ${detail}`, 500, 'ledger_drift');
    return Object.freeze({ runId, kind: RECONCILE, startedAt: now, finishedAt, ok: true, detail, report });
  } catch (error) {
    if (error instanceof GameError && error.code === 'ledger_drift') throw error;
    try {
      await store.closeRun({ runId, finishedAt: clock(), ok: 0, detail: describeFailure(error) });
    } catch {
      /* the original failure is the one worth propagating */
    }
    throw error;
  }
}

function describeReport(report) {
  const head = `transactions: ${report.transactions}; issued: ${report.issued}; open escrows: ${report.openEscrows.length}`;
  if (report.ok) return head.slice(0, OPS.maxDetailLength);
  const problems = [
    ...report.violations.map((v) => `${v.rule} (${v.txId ?? '-'})`),
    ...report.drift.map((d) => `${d.rule} ${d.account}`),
  ];
  return `${head}; FAILED: ${problems.join(', ')}`.slice(0, OPS.maxDetailLength);
}

/**
 * Sets one flag and records who set it. Validation is deliberately narrow — a lowercase dotted key,
 * a short printable value, a named actor — because this table is read by humans under pressure and
 * an unreadable row is worse than no row.
 */
export async function setFlag({ store, key, value, updatedBy, now = Date.now() } = {}) {
  requireValue(
    store && typeof store.writeFlag === 'function',
    'The operations service is unavailable.',
    503,
    'service_unavailable',
  );
  requireValue(Number.isFinite(now), 'Invalid request.');
  const flagKey = printable(key, OPS.maxFlagKeyLength, 'Invalid flag key.');
  requireValue(FLAG_KEY.test(flagKey), 'Invalid flag key.');
  const flagValue = printable(value, OPS.maxFlagValueLength, 'Invalid flag value.');
  // NOT NULL in the schema, and enforced here so the constraint is never the thing that finds out.
  const actor = printable(updatedBy, OPS.maxActorLength, 'Name who is setting this flag.');
  await store.writeFlag({ key: flagKey, value: flagValue, updatedBy: actor, updatedAt: now });
  return Object.freeze({ key: flagKey, value: flagValue, updatedBy: actor, updatedAt: now });
}

/** Every flag, with its attribution. Small by construction; there is no pagination and none needed. */
export async function getFlags({ store } = {}) {
  requireValue(
    store && typeof store.readFlags === 'function',
    'The operations service is unavailable.',
    503,
    'service_unavailable',
  );
  const rows = await store.readFlags();
  return Object.freeze(
    rows.map((row) =>
      Object.freeze({
        key: row.key,
        value: row.value,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      }),
    ),
  );
}

/**
 * The dead man's switch, read back. For every kind this repository expects to run — plus any kind
 * already present in the table, so a retired job still reports — this answers with the newest run
 * and whether it has gone quiet. A kind that has NEVER run is reported as stale rather than
 * omitted: "no heartbeat yet" and "no heartbeat any more" are the same operational fact.
 */
export async function health({ store, now = Date.now() } = {}) {
  requireValue(
    store && typeof store.readLastRuns === 'function',
    'The operations service is unavailable.',
    503,
    'service_unavailable',
  );
  requireValue(Number.isFinite(now), 'Invalid request.');
  const rows = await store.readLastRuns();
  const byKind = new Map(rows.map((row) => [row.kind, row]));
  const kinds = [...new Set([...OPS.kinds, ...byKind.keys()])].sort();
  const runs = kinds.map((kind) => {
    const row = byKind.get(kind);
    if (!row)
      return Object.freeze({
        kind,
        runId: null,
        startedAt: null,
        finishedAt: null,
        ok: false,
        detail: null,
        ageMs: null,
        stale: true,
        stuck: false,
        everRan: false,
      });
    const ageMs = now - row.started_at;
    const open = row.finished_at === null || row.finished_at === undefined;
    return Object.freeze({
      kind,
      runId: row.id,
      startedAt: row.started_at,
      finishedAt: open ? null : row.finished_at,
      ok: row.ok === 1,
      detail: row.detail ?? null,
      ageMs,
      stale: ageMs > OPS.staleAfterMs,
      stuck: open && ageMs > OPS.stuckAfterMs,
      everRan: true,
    });
  });
  return Object.freeze({
    now,
    staleAfterMs: OPS.staleAfterMs,
    intervalMs: OPS.intervalMs,
    runs: Object.freeze(runs),
    // One boolean for a pager to watch. False means: a sweep is overdue, stuck, or last failed.
    healthy: runs.every((run) => run.everRan && !run.stale && !run.stuck && run.ok),
  });
}
