# Money-layer research and planning artifacts

The evidence base behind `public/product/compliance/` and
`public/product/compliance/roadmap.md`. These files are inputs to a build step, not prose — a fresh
clone needs them to regenerate the compliance page:

```
node scripts/compliance-data.mjs   # lanes/*.corrected.json + legal-merge.json -> compliance.json
node scripts/compliance-html.mjs   # compliance.json -> checklist.site.html
```

## What each file is

| File | What it is | Authoritative? |
|---|---|---|
| `lanes/lane-N.corrected.json` | The six research lanes **after** their adversarial audit was applied. | **Yes.** These are what the page is built from. |
| `legal-merge.json` | The decision document merged from all six corrected lanes: recommendation, 4×3 model matrix, what is closed, sequencing, questions for counsel. | **Yes.** |
| `legal-lanes.ndjson` | The six lanes **before** correction, one per line, in lane order. | No — kept as the audit trail showing what changed. |
| `legal-audits.ndjson` | The adversarial audit of each lane, same order. Each lists the defects found and their corrections. | No — evidence, not conclusions. |
| `architecture-plan.json` | The senior-tech-lead plan: the chosen architecture, milestones M0–M7, what was rejected and why, open risks. | Yes, for engineering. |
| `compliance-page-design.json` | The design specification the checklist page was built to. | Reference. |

## Two things to know before reading any of it

**The uncorrected briefs contain fabricated citations.** The audit pass found roughly one in four
load-bearing citations to be invented, misnumbered or superseded — among them a Maltese regulation
repealed in 2018 presented as the live regime, and a Montana statute cited five times for a
proposition it does not contain. That is why `legal-lanes.ndjson` is marked *not* authoritative. Read
the corrected lanes; use the raw ones only to see what was wrong.

**A first merge was produced from truncated input and has been deleted.** It claimed the India lane
and one other "arrived missing" and left every India cell blank. All six lanes did arrive; the
synthesiser was handed a 300,000-character slice of ~460,000 characters of lane data and correctly
reported that it could not see them. `legal-merge.json` is the re-run, which reads each lane from
disk. If you find a copy of the old `legal-synthesis.json` anywhere, discard it.

## Status

None of this is legal advice, and several figures in it are marked `UNVERIFIED` — meaning the
research could not confirm them and they must not enter a budget or a geofence until someone does.
The open questions are collected, numbered and deduplicated in the generated page.

The generated page is **deliberately not published**. It carries candid adverse assessments of this
product written to be useful internally, not safe at a public URL. `.github/workflows/pages.yml` has
no copy step for it, and the comment there explains why.

## Build status, 17 September 2026

Shipped on the feature branch after the ad-funded pivot, in the order of `ads/synthesis.json`
`features`:

| # | feature | where |
| --- | --- | --- |
| 7 | economy config, burn leg, structural honesty rule | `lib/economy/economy.mjs`, `lib/ledger/intents.mjs` |
| 10 | reward nonce, completion window, caps — pure half and **server half** | `lib/ads/nonce.mjs`, `lib/server/wallet-service.mjs`, `app/api/wallet/route.ts` |
| 11 | priced ad card, `duel-entry` placement retired from the UI | `app/screens/economy/ad-card.tsx` |
| 12 | drills, Yesterday recap, friendly duel | `lib/fixtures.mjs`, `app/discovery.tsx` |
| 13 | kick-off and full-time sets, next-fixture hook | `lib/fixtures.mjs`, `app/screens/events/fixture-card.tsx`, `app/screens/room/next-fixture.tsx` |
| 14 | stake picker default, tier-down suggestion, EV note | `lib/economy/stake-advice.mjs`, `app/screens/play/match-settings.tsx` |
| 15 | per-sport rating, seasons on the real calendars, matchweek streaks with free shields | `lib/season.mjs`, `lib/passport.mjs` (`supporter`) |
| 16 | leagues engine (bracketed, promotion, percentile, neighbourhood); rivals and you-vs-you boards from real duels | `lib/leagues.mjs`, `app/screens/player/boards.tsx` |
| 17 | Rules of the coin and Trust pages, change log with the one-matchweek rule | `lib/economy/changelog.mjs`, `app/screens/rules/` |
| 8 (part) | Supporter Card, guest-first, age band with no pre-selection | `app/screens/player/supporter-card.tsx` |
| — | gems retired: one currency, cosmetics unlock by play | `lib/progression.mjs` v2 |
| M3 | ledger persisted, every guard a constraint violation, reconcile on the hourly sweep | `lib/server/ledger-store-d1.mjs`, `lib/ledger-memory-store.mjs`, `lib/server/reconcile.mjs`, `drizzle/0003_ledger.sql` |

Not built, and said so in the UI: accounts and sign-in (M4; the guest principal is promoted in place
when they arrive), public leagues and the global board (open with accounts; no placeholder table),
the matchmaking queue, server-verified ad completion (store builds only). The static GitHub Pages
build carries none of the server half; it keeps the device wallet.
