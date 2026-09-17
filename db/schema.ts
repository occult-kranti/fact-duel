import { sqliteTable, text, integer, index, primaryKey, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
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
/**
 * The ledger, persisted the way `lib/ledger/store-contract.mjs` demands: every guard is a constraint
 * violation, because a D1 batch rolls back on a statement ERROR and on nothing else
 * (`tests/d1-batch-semantics.test.mjs`). Amounts are signed integers exactly as the pure planner
 * emits them; the cached `balance` is Square Books' decision — a wallet read must not GROUP BY a
 * growing entry log — and `tests/ledger-store.test.mjs` proves the cache and the entries agree.
 *
 *  - `ledger_transactions.tx_id` is sha256(op_key): a replay of the same real-world event collides
 *    on the primary key and the whole batch is refused → `duplicate`.
 *  - `ledger_entries` UNIQUE(account_id, seq): a post that read a stale head loses the race on the
 *    account's sequence and is refused whole → `conflict`.
 *  - `ledger_accounts` CHECK: an account flagged must-not-go-negative (bit 1) that would be
 *    overdrawn trips the CHECK on its balance update and the batch is refused whole → `overdraft`.
 */
export const ledgerAccounts = sqliteTable(
  'ledger_accounts',
  {
    accountId: text('account_id').primaryKey(),
    ledger: text('ledger').notNull(),
    kind: text('kind').notNull(),
    owner: text('owner').notNull(),
    flags: integer('flags').notNull().default(0),
    balance: integer('balance').notNull().default(0),
    entrySeq: integer('entry_seq').notNull().default(0),
    openedAt: integer('opened_at').notNull(),
  },
  (t) => [
    index('ledger_accounts_owner_idx').on(t.ledger, t.owner),
    check('ledger_accounts_no_overdraft', sql`(${t.flags} & 1) = 0 OR ${t.balance} >= 0`),
  ],
);
export const ledgerTransactions = sqliteTable(
  'ledger_transactions',
  {
    txId: text('tx_id').primaryKey(),
    opKey: text('op_key').notNull().unique(),
    ledger: text('ledger').notNull(),
    kind: text('kind').notNull(),
    memo: text('memo'),
    meta: text('meta').notNull().default('{}'),
    effectiveAt: integer('effective_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('ledger_transactions_created_idx').on(t.createdAt)],
);
export const ledgerEntries = sqliteTable(
  'ledger_entries',
  {
    entryId: text('entry_id').primaryKey(),
    txId: text('tx_id').notNull(),
    accountId: text('account_id').notNull(),
    leg: integer('leg').notNull(),
    amount: integer('amount').notNull(),
    seq: integer('seq').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('ledger_entries_account_seq_uq').on(t.accountId, t.seq),
    index('ledger_entries_tx_idx').on(t.txId),
    check('ledger_entries_nonzero', sql`${t.amount} <> 0`),
  ],
);
/**
 * The guest principal and the rewarded-ad nonce, the server half of `lib/ads/nonce.mjs`.
 *
 * A principal today is anonymous: an id the device minted, promoted in place when accounts arrive
 * (M4) so nothing earned as a guest is lost. `ad_nonces` is issued before an ad plays and read back
 * when the client says the ad finished; `ad_redemptions` is the guard — its primary key is the
 * nonce id, so a second redemption of the same nonce collides and the batch is refused, and the
 * grant itself is a ledger post whose id is derived from the nonce, so it is refused as a duplicate
 * too. Two independent constraints, either of which alone caps a lying client at one payout per
 * nonce the server chose to issue.
 */
export const principals = sqliteTable('principals', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull().default('anon'),
  createdAt: integer('created_at').notNull(),
  lastSeenAt: integer('last_seen_at').notNull(),
  promotedTo: text('promoted_to'),
});
export const adNonces = sqliteTable(
  'ad_nonces',
  {
    id: text('id').primaryKey(),
    principalId: text('principal_id').notNull(),
    placement: text('placement').notNull(),
    region: text('region').notNull(),
    reward: integer('reward').notNull(),
    issuedAt: integer('issued_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    minMs: integer('min_ms').notNull(),
    redeemedAt: integer('redeemed_at'),
  },
  (t) => [index('ad_nonces_principal_idx').on(t.principalId, t.issuedAt), index('ad_nonces_expiry_idx').on(t.expiresAt)],
);
export const adRedemptions = sqliteTable(
  'ad_redemptions',
  {
    nonceId: text('nonce_id').primaryKey(),
    principalId: text('principal_id').notNull(),
    dayKey: text('day_key').notNull(),
    amount: integer('amount').notNull(),
    at: integer('at').notNull(),
  },
  (t) => [index('ad_redemptions_day_idx').on(t.principalId, t.dayKey)],
);
/**
 * Accounts (M4). Identity lives in the same database as the ledger on purpose: promoting a guest
 * principal to a named one, or merging two, is one batch here — hosted auth would make it a
 * distributed operation across exactly the boundary that loses value in the failure case.
 *
 *  - `identities`: one row per (provider, subject) — a Google account or a verified email — pointing
 *    at the principal it signs in as. UNIQUE(principal_id, provider) so a principal has one of each.
 *  - `sessions`: opaque random id kept in an HttpOnly cookie; stored hashed. Sliding expiry.
 *  - `magic_links`: single-use, short-lived, stored hashed; `principal_hint` is the guest id the
 *    device presented when it asked, so the promotion targets the right principal.
 *  - `profile_blobs`: the device profile mirrored to the server for cross-device play; a revision
 *    the client compares before it overwrites.
 *  - `match_queue`: one row per waiting principal; pairing is a delete of both rows plus a room
 *    create in one batch, so a principal can be paired at most once.
 */
export const identities = sqliteTable(
  'identities',
  {
    id: text('id').primaryKey(),
    principalId: text('principal_id').notNull(),
    provider: text('provider').notNull(),
    subject: text('subject').notNull(),
    email: text('email'),
    createdAt: integer('created_at').notNull(),
    lastUsedAt: integer('last_used_at').notNull(),
  },
  (t) => [uniqueIndex('identities_principal_provider_uq').on(t.principalId, t.provider), index('identities_principal_idx').on(t.principalId)],
);
export const sessions = sqliteTable(
  'sessions',
  {
    idHash: text('id_hash').primaryKey(),
    principalId: text('principal_id').notNull(),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    lastSeenAt: integer('last_seen_at').notNull(),
    revokedAt: integer('revoked_at'),
  },
  (t) => [index('sessions_principal_idx').on(t.principalId), index('sessions_expiry_idx').on(t.expiresAt)],
);
export const magicLinks = sqliteTable(
  'magic_links',
  {
    tokenHash: text('token_hash').primaryKey(),
    email: text('email').notNull(),
    principalHint: text('principal_hint'),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    consumedAt: integer('consumed_at'),
  },
  (t) => [index('magic_links_email_idx').on(t.email, t.createdAt), index('magic_links_expiry_idx').on(t.expiresAt)],
);
export const profileBlobs = sqliteTable('profile_blobs', {
  principalId: text('principal_id').primaryKey(),
  revision: integer('revision').notNull().default(0),
  state: text('state').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
export const matchQueue = sqliteTable(
  'match_queue',
  {
    principalId: text('principal_id').primaryKey(),
    sport: text('sport').notNull(),
    mode: text('mode').notNull(),
    stake: integer('stake').notNull(),
    rating: integer('rating').notNull().default(1000),
    enqueuedAt: integer('enqueued_at').notNull(),
    lastSeenAt: integer('last_seen_at').notNull(),
    ticket: text('ticket').notNull(),
  },
  (t) => [index('match_queue_lane_idx').on(t.sport, t.mode, t.stake, t.enqueuedAt)],
);
/**
 * One row per (principal, kind, key) that may happen once: the free daily recap today. A second
 * attempt collides on the primary key, which is the guard — no zero-row UPDATE, no flag column.
 */
export const dailyMarks = sqliteTable('daily_marks', {
  key: text('key').primaryKey(),
  principalId: text('principal_id').notNull(),
  kind: text('kind').notNull(),
  at: integer('at').notNull(),
});
