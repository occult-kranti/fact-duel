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
4. **Reconciler drift.** Trial-balance delta across each ledger. Expected value is exactly zero.
   Any non-zero value is a hard stop, not a warning.

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
