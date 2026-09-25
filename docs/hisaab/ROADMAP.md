# HISAAB DO — release roadmap

Team lead: Claude (this session). Branch: `claude/loving-pasteur-s8xwtf`. Charter: `CHARTER.md`.
Each lane below is one subagent with a written brief. A lane is done only when its acceptance
checks pass; the lead merges, reviews and deploys.

## Phase 0 — Charter (lead) ✅
- `docs/hisaab/CHARTER.md` — product, label ladder, legal gates, schema, lanes, modes, notification budget.
- `editions/hisaab/bank/schema.mjs` + `scripts/hisaab-validate.mjs` — the bank contract as code.

## Phase 1 — Research, content, design, engine (parallel)

| # | lane | owner | output | acceptance |
|---|---|---|---|---|
| 1.1 | Schemes & benefits | content agent A | `bank/schemes.mjs` (60) | validator clean; every fact fetched; notes file |
| 1.2 | Budget & spending | content agent B | `bank/spending.mjs` (50) | same |
| 1.3 | Scams & accountability | content agent C | `bank/scams.mjs` (60) | same + status on every named person |
| 1.4 | States — North | content agent D | `bank/states-north.mjs` (60) | ≥ 6 per state |
| 1.5 | States — West & South | content agent E | `bank/states-west-south.mjs` (60) | ≥ 6 per state |
| 1.6 | States — East & NE | content agent F | `bank/states-east.mjs` (50) | ≥ 4 per state, ≥ 6 WB/OD/AS |
| 1.7 | Media & speech | content agent G | `bank/media.mjs` (45) | ownership links sourced to filings/major outlets |
| 1.8 | Elections & money | content agent H | `bank/elections.mjs` (50) | ECI/ADR primary data |
| 1.9 | Forward Court | content agent I | `bank/forwards.mjs` (40) | claims from all sides; fact-checker source each |
| 1.10 | Discourse research | research agent | `research/discourse.md`, `scripts/research/reddit-pulse.mjs` | 20–30 subreddits mapped; topics ranked; lexicon; no usernames, no slurs quoted |
| 1.11 | Design bible | design/psychology/marketing agent | `design-bible.md`, `editions/hisaab/theme/tokens.css`, skill | every screen specified; notification budget; 3D physics specs |
| 1.12 | Engine scaffold | engine agent | `vite.config.hisaab.ts`, `editions/hisaab/{main.tsx,edition.*}`, storage isolation, P2P transport, `ENGINE.md` | edition builds; JHK tests unchanged and green |

## Phase 2 — Build (after 1.11 + 1.12)

| # | lane | output | acceptance |
|---|---|---|---|
| 2.1 | Shell + Home + onboarding + label ladder | screens | mobile gate clean at 360/390/414 |
| 2.2 | Modes: Rajya map, Sector files, Kiska Media, Forward Court, daily | screens | every state/sector route playable |
| 2.3 | Duels: bot, P2P friend, pass & play; receipt screen | screens | verdict rules identical to JHK engine |
| 2.4 | 3D physics set pieces (Rapier): Tijori, Tarazu, stamp | scenes | lazy, dpr-capped, static fallback, never in a live round |
| 2.5 | Profile, Vault (receipts), certificate share card | screens | share works without server |

## Phase 3 — Review and harden

| # | lane | output |
|---|---|---|
| 3.1 | Fact-check audit (independent agent re-fetches a sample of every lane, 100% of `scam` items naming people) | `review/fact-audit.md` + fixes |
| 3.2 | Balance audit (govt × kind distribution, framing) | `review/balance.md` |
| 3.3 | Gamification advisor loop (skill `gamification-advisor`) | `review/advisor-loop1.md` |
| 3.4 | Code review + tests + mobile gate | green suite |

## Phase 4 — Release
- `.github/workflows/pages-hisaab.yml` builds on push to this branch and to `main`, publishes into
  `gh-pages/hisaab/` without touching the JHK files around it.
- `pages.yml` keeps `hisaab/` when it republishes JHK from `main`.
- Live check of `https://occult-kranti.github.io/fact-duel/hisaab/`.

## Phase 5 — After launch (not in this release)
- **Server PvP and matchmaking on the shared Worker**: register the civics bank in the Worker behind
  an edition flag, allow the Pages origin by CORS, and point the edition's duel client at it. Needs
  a `main` merge and the Cloudflare secrets; D1 tables are shared, rooms carry the edition.
- **Reddit pulse refresh**: run `scripts/research/reddit-pulse.mjs` monthly (needs Reddit access,
  which this build environment's network policy blocks) and fold new topics into Forward Court.
- **Content cadence**: 25 new items a month; re-verify every `status` line older than 6 months.
- **Hindi bank**: translate stems/options (the UI ships bilingual; the bank ships English first).
