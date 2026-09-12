# Floodlight gamification — roadmap and execution plan

Status legend: ✅ done · 🔄 in progress · ⏳ planned · ⛔ blocked. Item ids (G01–G33) match the
Studio roadmap (`lib/product/roadmap.json`, milestone "Floodlight gamification"), where status and
evidence notes can be edited and exported.

## Operating model

- **Team lead / advisor** (this record's author) owns executive decisions, the design bible, the
  roadmap, dispatch of swarms, review loops and the release gate.
- **Swarms** are parallel agents with isolated file ownership: research, audit, engine, juice, 3D,
  foundation, screens (one per screen), integration, advisor, docs. Every swarm reads the skills
  in `.claude/skills/` (floodlight-design, juice, gamification-advisor) before writing code.
- **Loops**: build wave → advisor review → fix wave → verification. Two advisor loops are planned.
- **Gates** (must be green before any commit that touches app code): `node --test tests/*.test.mjs`
  (68 baseline + progression tests), `pnpm exec tsc --noEmit`, `pnpm build`, and
  `node scripts/screens.mjs` (zero horizontal overflow, zero console errors at 390 px and 1440 px).

## Phase 0 — Recon and research ✅ (G01, G02)

1. Three parallel audits: UI/UX screens and design debt; engine/data layer and tests; research brief
   (theory + stack + art directions). Baseline screenshots captured with headless Chromium.
2. Findings that shaped everything: one 2,000-line monolith with three CSS generations; zero
   keyframes; sound off by default; desktop nav rendering as a stacked column; profile is a pure
   reducer with an identity contract; timing contract forbids animation on the question card before
   the reveal marker; no server identity for leaderboards.

## Phase 1 — Design bible, roadmap, skills ✅ (G03, G04)

- Executive decisions: keep the midnight/volt brand but rebuild it as "Floodlight" (warm competition,
  cool learning, gold rewards); Bricolage Grotesque / Instrument Sans / JetBrains Mono; shape-coded
  answers; streaks with shields; daily quests; combos; Arena Rank; gems + Locker; procedural sound
  default on; R3F hero and ceremonies; rapier only for the Locker showpiece.
- Deliberate changes to the v6 guardrails: streaks and daily quests are now in (white-hat, shielded);
  the Home hero may mount WebGL after a static poster; a live room still never mounts a renderer.

## Phase 2 — Foundation 🔄 (G05–G07)

1. Tokens + fonts + Tailwind bridge; remove dead root palettes.
2. App shell: top bar with streak/gems/level slots, bottom tab bar ≤ 900 px, rail ≥ 900 px, settings
   sheet with sound/volume/haptics/effects/theme, hidden nav during a room.
3. Decompose `app/arena.tsx` into `app/screens/*` with a typed `DuelController`; no behaviour change;
   end-to-end bot duel screenshots as proof.

## Phase 3 — Progression engine 🔄 (G08–G14)

Pure `lib/progression.mjs` hooked into the profile reducer tail (with the journey-answer recursion
fixed via `applyPractice`), exactly-once XP from before/after diffs, streaks with shields, seeded daily
quests, achievements, Arena Rank, gems and cosmetics, Wild Round multipliers, difficulty plumbing,
`progressionDiff` for UI feedback. 20+ new tests.

## Phase 4 — Juice 🔄 (G15–G18)

Procedural Web Audio cues, pooled particle engine, confetti, shake, counters, float text, toasts,
ceremonies, haptics, preferences (sound/volume/haptics/effects) and an `/fx-lab` audition page.

## Phase 5 — 3D 🔄 (G19–G21)

Knowledge Core hero, Reward Medal, Gem Vault (rapier, lazy), all client-only with WebGL and
reduced-motion fallbacks, verified by build and headless screenshots on `/three-lab`.

## Phase 6 — Screen rebuilds ⏳ (G22–G27)

Parallel screen agents, one directory each, all reading the skills:
Home · Play · Room · Expeditions · Player (Passport, Rank, Locker) · Vault/Discovery/Collections.
Each ships its own `fd-` CSS, uses `useJuice`, mounts lazy 3D where the bible says, and verifies with
`scripts/screens.mjs` plus a screen-specific Playwright flow.

## Phase 7 — Integration and advisor loop 1 ⏳ (G28, G29)

Progression feedback wiring (diff → toasts/ceremonies exactly once), then an independent advisor
review (`gamification-advisor` skill) with scores per screen and a P0/P1/P2 fix list; fixes dispatched.

## Phase 8 — Verification and advisor loop 2 ⏳ (G30)

Release gate plus a screenshot sweep with and without reduced motion, end-to-end bot duel, bundle
sizes; `verification.md`; advisor sign-off.

## Phase 9 — Docs ⏳ (G31)

README, decision record, roadmap sync, Studio rendering of the gamification record.

## Deferred (needs server work) ⛔ (G32, G33)

Server-backed leagues/leaderboards (identity + settlement write) and bot personas with accuracy tiers.
