import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    revision: integer('revision').notNull().default(0),
    state: text('state').notNull(),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('rooms_expiry_idx').on(t.expiresAt)],
);
export const admissionLimits = sqliteTable(
  'admission_limits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('admission_expiry_idx').on(t.expiresAt)],
);
/**
 * Opt-in, anonymous cohort retention. One row per (anonymous device id, local calendar day).
 * `anon_id` is a random 32-hex value minted on the device and has no relationship to any identity,
 * account, address or IP; nothing else about a device is stored here. Counters are only ever raised
 * (MAX upsert), and nothing in this table is ever read back out per device — only in aggregate.
 */
export const cohortDays = sqliteTable(
  'cohort_days',
  {
    anonId: text('anon_id').notNull(),
    installDay: text('install_day').notNull(),
    day: text('day').notNull(),
    sessions: integer('sessions').notNull().default(0),
    ms: integer('ms').notNull().default(0),
    rounds: integer('rounds').notNull().default(0),
    matches: integer('matches').notNull().default(0),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.anonId, t.day] })],
);
/**
 * The dead man's switch for every scheduled maintenance pass.
 *
 * This deployment can declare no cron trigger, no queue and no Durable Object — the generated
 * `dist/server/wrangler.json` has `triggers:{}` and empty bindings — so the sweep is driven from
 * outside, by `.github/workflows/sweep.yml` calling `/api/ops`. An external driver can simply stop
 * calling, and a sweep that silently stops running is indistinguishable from a healthy one unless
 * something records the fact that it ran. Every sweep therefore opens a row here before it does any
 * work and closes it afterwards, so silence has a shape: the newest row for a kind stops moving,
 * or stops closing. Because GitHub Actions schedules are best-effort, nothing here is a correctness
 * component — it is the evidence that lets a human notice.
 */
export const opsRuns = sqliteTable(
  'ops_runs',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    startedAt: integer('started_at').notNull(),
    finishedAt: integer('finished_at'),
    ok: integer('ok').notNull().default(0),
    detail: text('detail'),
  },
  (t) => [index('ops_runs_kind_idx').on(t.kind, t.startedAt)],
);
/**
 * The kill switch. Flags deliberately do NOT live in `admission_limits`: that table is a per-minute
 * rate-limit counter whose rows are deleted once `expires_at` passes, so a flag stored there would
 * quietly expire — the one failure mode a kill switch may never have. `updated_by` is NOT NULL and
 * is always written, because a control nobody can attribute is not a control: after a hard stop the
 * runbook asks who stopped it and when, and the answer has to be in the database.
 */
export const opsFlags = sqliteTable('ops_flags', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedBy: text('updated_by').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
