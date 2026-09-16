# Money runbook

Operational card for the server-authoritative value layer. Terse on purpose — read it during an
incident, not before one. Design rationale lives in `docs/money/architecture-plan.json`.

**Status: nothing is live.** There is no ledger, no purchase path and no `OPS_TOKEN` deployed yet.
This card exists from M0 so the controls are written before the thing they control.

---

## The door

`POST /api/ops`, bearer token, `Authorization: Bearer $OPS_TOKEN`.

| action | does |
| --- | --- |
| `{"action":"sweep"}` | run the maintenance pass, write an `ops_runs` heartbeat |
| `{"action":"reconcile"}` | replay every ledger transaction through the invariants, compare with the cached balances, write an `ops_runs` row of kind `reconcile`; **500 on drift**, never a repair |
| `{"action":"health"}` | newest run per kind, plus `stale` / `stuck` / `healthy` |
| `{"action":"flags"}` | every flag with `updatedBy` and `updatedAt` |
| `{"action":"set-flag","key":…,"value":…,"updatedBy":"your name"}` | set one flag |

`updatedBy` is mandatory and is stored. If `OPS_TOKEN` is unset or empty the route answers **503 to
everything**, including a correct token. It never falls open.

Driven hourly by `.github/workflows/sweep.yml`. That schedule is **best-effort**: late by minutes to
hours, dropped under load, and disabled after 60 days of repository inactivity. **No money invariant
may depend on it.** It is a backstop and a heartbeat, nothing more.

---

## The four counters to alert on

Nothing here has a metrics sink yet — today these are read by hand from `/api/ops` and D1. Wiring
them to a real alert channel is unfinished work, and until it is done the kill switch can stop the
money layer but cannot wake anyone.

1. **Sweep heartbeat age.** `health().runs[kind].stale` — no successful sweep for 3h, or `stuck`
   (a run opened and never closed). This is the dead man's switch: if it is quiet, assume the other
   three counters are also not being read.
2. **Value resting in open holds.** Total minor units held, and the age of the oldest hold. A number
   that only goes up means holds are being taken and never released.
3. **Terminated matches with no settlement transaction.** Settlement is synchronous in the request
   that ends the room; a non-zero count here means that guarantee broke.
4. **Reconciler drift.** `{"action":"reconcile"}` — `lib/server/reconcile.mjs` replays the whole
   `ledger_transactions` + `ledger_entries` log through `lib/ledger/invariants.mjs` (balanced legs,
   derived ids, no overdraft in the middle of the sequence, per-ledger trial balance) and then
   compares the replay with the cached `ledger_accounts.balance` / `entry_seq` heads. Expected
   `drift: []` and `violations: []`. Any entry is a hard stop, not a warning: the run row is written
   with `ok = 0` and a `detail` that names the account and rule, the route answers 500, and the
   sweep workflow goes red. The reconciler never writes to the ledger.

### How a ledger post is guarded (M3)

A post is one D1 batch and every guard is a constraint the database raises, because a batch rolls
back on a statement error and on nothing else (`tests/d1-batch-semantics.test.mjs`):

| refusal | mechanism |
| --- | --- |
| `duplicate` | `ledger_transactions.tx_id` is sha256(op_key): a replay collides on the primary key |
| `conflict` | `ledger_entries` UNIQUE(account_id, seq): a post that read a stale head loses the race |
| `overdraft` | `ledger_accounts` CHECK: a flagged account's balance update may not go below zero |

Nothing inspects `meta.changes`. A refused post writes nothing. The same suite runs against the
memory store and the D1 store (`tests/ledger-store.test.mjs`). A `conflict` is the caller's to
retry after re-reading the head; `duplicate` and `overdraft` are final.

---

## Who is paged

**TO BE NAMED BY THE FOUNDER.** — primary, 24/7, for counters 2, 3 and 4.

**TO BE NAMED BY THE FOUNDER.** — secondary / business-hours, for counter 1.

There is no rotation and no paging tool in this repository. Until two real names and one real
contact method are written on these two lines, treat the value layer as not launchable.

---

## Hard stop

A hard stop disables the value layer. Play (`ledger='play'`, free, non-withdrawable) keeps running;
so does the rest of the game.

```
POST /api/ops  {"action":"set-flag","key":"money.hard_stop","value":"on","updatedBy":"<your name>"}
```

### First three steps after a hard stop

1. **Confirm it landed.** `{"action":"flags"}` — `money.hard_stop` reads `on`, with your name and a
   timestamp. If the write did not land, the route is down; that is itself the incident.
2. **Freeze the provider.** Disable the payment provider's live keys from the provider dashboard.
   The flag stops this deployment from accepting money; it does not stop webhooks, retries or a
   second deployment. Until the provider is quiet, the outside world is still pushing.
3. **Snapshot before touching anything.** Record the current trial-balance delta per ledger, the
   open-hold total, and the newest `ops_runs` row. Whatever you do next changes these numbers, and
   the pre-incident values are not recoverable afterwards.

### Who can clear it

Only the named primary above, and only after a second person has seen the reconciler report zero
drift. Clearing is another attributed write (`"value":"off"`), never a row delete — the trail has to
show who cleared it as well as who set it.

---

## The guest wallet door (`POST /api/wallet`)

No bearer token: the caller is a guest, identified only by the id its device minted
(`[a-z]{1,8}_[A-Za-z0-9_-]{16,58}`). A stolen guest id can spend that guest's coins and nothing
else. M4 promotes the guest principal in place under a real session.

| action | does |
| --- | --- |
| `{"action":"wallet","principalId":…}` | server balance (play ledger) and today's redeemed-ad count |
| `{"action":"issue-nonce","principalId":…,"placement":"coins"}` | refuses on `daily_cap` or `cooldown`; otherwise a nonce bound to principal, placement, edge region and the reward at issue time |
| `{"action":"redeem-nonce","principalId":…,"nonceId":…,"placement":"coins"}` | pure window check (`lib/ads/nonce.mjs`), then the two constraints: `ad_redemptions.nonce_id` PK and the grant's ledger id derived from the nonce |

The region is the edge's word (`request.cf.country`, then `cf-ipcountry`), never the body's. A
redeem that arrives twice gets the same answer twice (`replayed: true`, `granted: 0`). A crash
between the redemption row and the grant is healed by the retry: the grant's id does not depend on
when it is posted. The sweep deletes expired nonces a day after they expire; redemptions are never
deleted. `tests/wallet-service.test.mjs` attacks the ceiling (one payout per issued nonce) the ways
a client would.

Not reachable from the static GitHub Pages build, which has no Worker: that build keeps the device
wallet, and the server wallet becomes the authority when the Worker deployment carries the game.

---

## D1 Time Travel is dangerous here — do not use it to fix the money layer

A Time Travel restore is **whole-database**. The ledger shares one D1 binding with live rooms and the
rate limiter, so there is no restore that rewinds a bad ledger deploy without also rewinding duels
in progress.

Worse: a restore rewinds `money_ops` (the idempotency table) alongside `ledger_transactions`. Every
webhook and every provider retry that arrives afterwards re-executes against keys that no longer
record their first execution. **The restore becomes a double-post event on the exact table whose job
is to prevent double posts.**

If a restore is genuinely the only option:

1. Hard stop first (above), and **quarantine the provider** — keys disabled, webhook endpoint
   returning non-2xx — before the restore begins.
2. Restore.
3. Export the post-restore ledger and diff it against the provider's own transaction list. Replay by
   hand what the provider recorded and the ledger no longer does.
4. Only then re-enable the provider, then clear the flag.

Until the ledger has its own database or an R2 export exists, step 1 is not optional.
