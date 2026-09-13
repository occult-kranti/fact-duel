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
