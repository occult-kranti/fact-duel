# Launch roadmap — the money layer

**As of 14 September 2026.** This file sequences the engineering against the law, so that no
code capable of taking money ships ahead of the paperwork that makes taking it lawful.

It is a working record, not legal advice. The evidence behind every legal statement is in
`checklist.site.html` (published at `/fact-duel/compliance/`), which carries the citation, the
regulator, and — where the research could not confirm something — an explicit `UNVERIFIED` marker
and a numbered question for counsel.

---

## The shape of the problem

Three facts set the whole sequence.

**One.** Today the device is the authority on everything. Coins live in IndexedDB, the profile is
local, and the live deployment is a static build with no server at all. That is entirely fine while
coins are free and simulated. The moment a coin costs money, every mint site becomes a hole. So the
backend is not a scheduling prerequisite — it is the thing that makes the money question answerable.

**Two.** The law is not uniform and is not stable. India prohibits online money games outright, skill
included, from 1 May 2026. US states are banning the buy-currency-and-stake structure one legislature
at a time, and several of those statutes reach payment processors and affiliates rather than only
operators. The EU has no single licence to apply for. A build constant would mean a deploy per
legislature, and a deploy someone has to remember.

**Three.** Only one milestone below actually needs legal clearance. Everything else takes no money
and stakes no real value, and can be built on engineering judgement alone.

---

## The gates

| Gate | What must be true | What it blocks |
|---|---|---|
| G1 | The chosen model is lawful in at least one identified jurisdiction, in writing, from counsel | M7 only |
| G2 | A payment processor has accepted the business in writing after seeing the actual mechanic | M7 only |
| G3 | An operating entity, bank account and tax registration exist | M7 only |
| G4 | Whatever fills a duel is audited and disclosed | Any staking of value, including simulated |

G4 is the one that does not wait. A US district court entered a nine-figure judgment in July 2026
over real-money head-to-head matches secretly filled with bots. This product fills matches with bots
today and labels them, which is the right instinct; before value is ever staked the disclosure needs
to be verified rather than assumed.

---

## Milestones

`safe now` means it can be built, merged and shipped today. `gated` means it cannot.

### M0 — Platform truth and harness atomicity · **safe now** · landed

Two things every later milestone assumed and none had checked.

The test harness ran `batch()` as `Promise.all(statements.map((s) => s.run()))` — no transaction, and
with I/O yielding on, two concurrent batches interleaved statement by statement. Every ledger
concurrency test written against that would have passed for the wrong reason. It is now a real
transaction, and `tests/d1-batch-semantics.test.mjs` pins both halves of D1's actual contract: a
batch rolls back when a statement **errors**, and does **not** roll back when a statement merely
matches zero rows.

That second half is the trap. A `WHERE version = ?` clause is not a guard inside a batch, because a
zero-row UPDATE is a successful statement and the rest of the batch commits anyway. Every ledger
guard must therefore be a constraint violation.

And there is no scheduler: the generated worker manifest has `triggers:{}` and empty queue, KV and
Durable Object bindings. The sweep runs from a GitHub Actions schedule, which is best-effort — which
is precisely why **no money invariant may depend on it**.

### M1 — Jurisdiction policy engine · **safe now** · engine landed, rules pending

A decision is the AND of three terms, and only one can permit:

```
allow = ceiling(question) AND rule(question) AND flag(question)
```

`ceiling` is compiled in and answers "has this codebase built the thing at all" — cash-out is `false`
at every milestone, so no row and no flag can enable a withdrawal that does not exist. `rule` is a
dated database row and is the only term that can say yes. `flag` is the operator kill switch, and is
deny-only by construction: it can stop money in seconds without a deploy and can never start it.

Three terms that can only subtract means the failure direction of every bug in the gate is refusal.

Rules are dated rows, so India's prohibition lands on its own date without anyone remembering to
ship, and a new state ban is an `INSERT`. Remaining work: seed the rows from the compliance file,
persist them, and log every decision — **including the allows**, since allows-as-well-as-denies is
what makes it evidence rather than a log.

### M2 — Ledger core, pure · **safe now**

Double-entry as pure `.mjs` reducers, no I/O, testable beside the existing suite. Double-entry is
enforced at the API boundary: you cannot express a money move without naming both sides. The ledger
partition is enforced here too, which is what makes "payments are off" an invariant of a pure
function rather than a flag someone must remember — no path, not even a buggy one, turns a free play
coin into a purchasable one, because the planner would have to emit a cross-ledger transaction and it
refuses.

### M3 — Ledger persisted · **safe now**

Every guard expressed as a constraint violation, per M0's finding: deterministic transaction and
entry IDs derived from the idempotency key so a replay collides on `PRIMARY KEY`; `UNIQUE(account_id,
seq)` so a lost race collides; a `CHECK` so an overdraft raises. Double-spend becomes structurally
impossible rather than transactionally prevented — the correct posture on a platform with no
interactive transactions. Nothing inspects `meta.changes`.

### M4 — Principals · **safe now**

A server-minted anonymous principal on first server contact, promoted to a named account by an
`INSERT` against the *same* principal id, so nothing in the ledger ever moves. Identity lives in the
same database as the ledger, because hosted auth would make every promotion a distributed operation
across exactly the boundary you do not want to cross while someone is holding value.

The duel hot path deliberately does not resolve a principal: polling is 500 ms per seat against a
single-threaded instance, so a session lookup on every poll would roughly halve concurrent capacity.
Only money-shaped requests resolve one.

**The profile never changes.** Gems stay device-local, offline-earnable, cosmetic-only and worth
nothing. Server-held value never enters the profile blob, so there is no migration, no legacy import
and no hostile-claim path — at the cost of one honest sentence in the UI.

### M5 — Free-play economy becomes server-authoritative · **safe now**

Editing IndexedDB stops minting anything the server recognises. The real point is that the exact code
path money will later use runs in production at precisely zero financial risk first. Grants are keyed
on server-minted identifiers only; anything keyed on a client-minted id is handing the client the
mint.

### M6 — Payment seam · **safe now**

The complete purchase → stake → settle → refund → reverse → reconcile arc, demonstrable end to end to
an underwriting team or a regulator, with no merchant account and no cent. Production runs
provider-null: every purchase attempt returns `503 payments_disabled`. Enabling requires **both** the
master flag *and* a bound provider secret, so a leaked flag alone cannot turn payments on and a
leaked secret alone cannot either. Purchase credits are never posted before the provider confirms.

This is the last milestone that needs no legal clearance.

### M7 — Real money, one jurisdiction · **gated on G1, G2, G3**

A provider binding, one rule row flipped with a citation and a named reviewer, and a low daily cap so
the worst single-account exposure is small. By construction the smallest milestone of the eight: no
code changes from M6, because everything hard already shipped. India cannot be this jurisdiction, and
the resolver will refuse regardless of what anyone flips.

Engineering preconditions, all independently checkable: the reconciler has run clean for 30
consecutive days; a kill-switch drill has been timed end to end and the number written down; an
operator has reconstructed every movement for one principal from ledger entries alone with no
application code involved.

---

## What is not in this plan, and why

**Cash-out, in any form, at any milestone.** The ledger supports it structurally and nothing
implements it. It is a compiled-in `false`.

**An offline queue for money intents.** An offline stake is simply unavailable with honest copy. An
offline money queue means reconciling conflicting wallet state on reconnect, which is the hardest
problem in the design, bought for a feature nobody asked for.

**Durable Objects, Queues and KV.** Not declarable in this deployment. The manifest is generated from
`.openai/hosting.json`, which exposes only `d1` and `r2`.

---

## The dependency nobody can code around

Legal facts move faster than code. Dated rows with a citation and a named reviewer make an unreviewed
market impossible to enable quietly — but a named owner and a review cadence are not engineering
artefacts. That is the single highest-risk non-engineering dependency here, and it needs a person's
name against it.

Three things need the founder and cannot be resolved from the code:

1. **The rake question, which is larger than the timer.** Whether a commission is taken from a
   player-funded pot or a fixed announced prize is paid from the operator's own treasury changes the
   legal characterisation in several jurisdictions at once, and decides whether money-transmitter
   obligations attach at all. Decide it before deciding anything about gameplay.
2. **Which single jurisdiction M7 targets**, since the plan deliberately enables exactly one.
3. **Who is paged** when the money layer hard-stops. `money-runbook.md` carries a placeholder.
