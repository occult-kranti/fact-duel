# Trophy Road: independent review and verification ledger

Date: 29 October 2026. Root agent moderates implementation. This squad owns independent research and browser QA. The user explicitly requested **three changed-artifact design rounds**, overriding the skill's default two-pass workflow. Image-generation and Figma iterations are recorded separately by their owners: an iteration is not counted here merely because a prompt or a test was repeated.

## Panel boundaries

These are **AI expert and player-perspective critiques**, not interviews, recruited focus groups, professional endorsements or population evidence. Published player evidence is recorded separately in `RESEARCH.md`. A hypothesis remains a hypothesis until source review, automated validation or observed browser interaction supplies the stated evidence.

| Perspective | Question put to the candidate | Failure that blocks acceptance |
| --- | --- | --- |
| First-time mobile player | Can I start without choosing settings or answering a rules quiz? | More than three actions to playable answers, forced intro, or an offscreen primary action at smallest target viewport. |
| Returning trivia player | Why should I return when I know yesterday's questions? | Random-only selection, repeats while unseen eligible questions remain, or reset on ordinary reload. |
| Competitive player | Did the arena change the match and can purchases affect it? | Cosmetic-only unlock, unlabelled bot, mutable local progress presented as ranked authority, or paid answer advantage. |
| Slow reader / access perspective | Can I understand feedback and operate this without decorative motion? | Unusable controls, clipped text, art-only labels, lost keyboard focus, inaccessible mandatory animation. |
| Game systems reviewer | Can a player farm trophies by opening/abandoning matches? | Reward before settled attempted round, duplicate settlement rewards, or match-count-only trophy bonus. |
| Mobile performance reviewer | Will the game survive missing art, weak connectivity or rotation? | Decorative image failure prevents play; offline loaded practice fails; horizontal page overflow hides choices. |
| Trust/content reviewer | Are question facts, privacy and online claims credible? | Inventory totals leaking from catalog/labels, uncited new claims, fabricated live player counts or bot-as-human presentation. |

## Round 1 — evidence and system contract

**Artifact reviewed:** baseline `9614d05` Pocket Stadium source, existing browser harness, official progression help and nine dated public review observations. Root also supplied the first generated three-arena concept (`generated_images/exec-3fca4862-db30-4d0b-aa3a-1738d378ecc4.png`, outside the repository). No new-candidate browser screenshots were captured during this round.

**Findings:** the baseline already had a direct cricket launch and semantic four-answer controls, but no three-arena progression. Reported repetition and long inter-round waits map to concrete rotation and timing requirements. Trophy progression needs a different contract from spendable Club points. Borrowing permanent arena gates does not justify borrowing punitive losses or paid stats. A pure scenery unlock would fail the requested gameplay change.

**Decisions sent to root:** retain one-action home play and optional road; use clear 0/60/180 gates, no loss/decay or paid power; each gate names its actual mode. Root revised the initial per-match reward to **4 trophies per attempted settled answer, plus 2 when correct**, removing the incentive to farm short match completions. Legacy unknown wrong-attempt totals migrate conservatively. Show bank inventory nowhere in category UI; distinguish it from legitimate match length. Bot delay must be measured from the first accepted answer, with duplicate submissions unable to reschedule it.

**Actual art critique sent for the next generation:** the warm Gully / river pavilion / violet Crown silhouette sequence is recognisable. Dense foliage and narrow bridges become texture at mobile scale; the Riverside palace competes with its playable island, and Crown's lower entrance consumes height. Isolate each ground, enlarge pitch and main landmark, reduce distant architecture and reserve quiet edges for HTML labels. Three Riverside lanterns and six Crown roof fins can be memorable motifs, but precise rules and ball counts remain semantic UI, never inferred from generated art.

**Change required before Round 2:** implement these contracts, add three distinct arena artworks and mode feedback, then expose a candidate for real mobile browser checks. Status: source-reviewed; implementation and observed checks pending.

## Round 2 — implemented candidate

**Artifacts reviewed:** mounted candidate with real home/map/match controls; generated concept from Round 1; actual six-state open-source design board `design/round-2-board.png`; source-linked question expansion. Root authorised functional checks before final art was ready, so this functional pass deliberately did not capture missing-art screenshots as aesthetic evidence.

**Observed failures that changed the artifact:**

1. Gauntlet bot commitment occurred at about 3.76 seconds, but the next question never arrived. Gameplay review traced this to programmatic result-heading focus being treated as deliberate review interaction. The capture handler was narrowed to actual controls; the corrected run completed five Gauntlet balls, three correct Chase balls and six Super Over balls without a Next tap.
2. Real browser catalogue access still returned `catalogue.count` and seven `catalogue.topics[].count` fields, despite visible map copy hiding inventory. This was reported to root as a public-response leak. The corrected functional run therefore remained **205/206**, not a claimed pass; root owns the response fix.
3. The design board's locked “Play to unlock” wording could imply immediate Crown access, separate Local/Human totals could suggest addition, and “five played” did not reflect zero reward for timeouts. The design owner received precise wording corrections, canonical Riverside Park naming and a mode-matched home CTA request. The board's overflowing Super Over headline was already queued for correction.
4. An independent content spot check confirmed the three 1973 facts, three USA–Pakistan facts and three pioneers' answers against ICC sources. Betty Wilson's extra explanation date/opponent was unsupported by its displayed link; the content owner removed that detail in Round 3. This is a bounded nine-answer spot check, not a re-audit of every new question.

**Harness corrections, not product defects:** profile fixture imports incorrectly assumed Vite's root was the repository; the runner now reads/writes the actual IndexedDB profile for explicit fixtures. A Hindi init script now catches blocked access on opaque documents. Initial failures remain in `verification/round-2-functional/results.json`; the corrected run is `verification/round-2-functional-corrected/results.json`.

**Observed successes:** all four viewports fit and show primary Play; all gate fixtures and semantic states pass; one actual correct Quick answer earns six trophies, a replay earns another six, and twelve persist after reload. New questions appear on replay and reload. Two concurrently launched tabs reserve disjoint five-card decks; actual exposed-question history survives reload and isolates a new profile epoch. Every measured bot response in this corrected run is within the requested 3–4 seconds. Keyboard answer focus, optional reading pause, missing art, loaded offline play, enlarged text, Hindi, reduced motion and disabled-ad behavior pass.

## Round 3 — corrected candidate

**Artifacts reviewed:** installed final original Gully/Riverside/Crown assets; actual day/night mobile and desktop renders; `design/round-3-board.png`; real local match interactions. The native Figma round reached its provider quota; the design owner completed rounds two and three in installed open-source Excalidraw. Those are real changed design artifacts, **not three completed native Figma iterations**. See `FIGMA.md` for tool provenance.

**Visual findings and correction:** the warm ground, river island and illuminated crown remain distinct at mobile size; HTML labels communicate mode and unlock state independently of art. The compact three-node road precedes its large artwork, and keyboard order now follows that visual order. The gameplay reviewer spotted an actual CSS-specificity defect: the new Pause control appeared as unstyled text. Scoping the styles to the room restored the intended control. A fresh-server pass verifies its ≥44px touch target at all four viewports, and refreshed screenshots show the corrected button.

**Final bounded results:** the full final-art snapshot completed **214 of 215 checks**; the sole failure was the still-cached public catalogue totals. After root removed those fields and the Pause styling changed, a fresh server ran **78 of 78 targeted checks successfully**, including that precise privacy assertion, all four viewport/day/night renders, pause target size, keyboard/banter focus holds and resilience. These overlap; they are not 293 independent tests. Earlier failed results remain available rather than being overwritten or silently excluded.

Sixteen actual rendered answer-to-bot-commitment measurements ranged from **3,562 to 3,948 ms**, with normal clocks and no mocked delay. The longest observed automatic result-to-next-question/finish transition was **1,231 ms**. Gauntlet completed five deliveries; all-correct Chase ended at three; six fast correct Super Over answers produced 36 runs. These are observed local-browser outcomes, not claims about all network conditions or real-device frame rates.

**Remaining usability boundary:** at 320×568, longer question stems require vertical scrolling to reach later answers. Text and 44px answer targets are preserved rather than compressed into unreadability. The main Home Play remains visible without scrolling, and the direct launch requires one action. The optional road's launch button can require scrolling on a short screen. Physical Android/iOS hardware, VoiceOver/TalkBack, real thumb reach, thermal behavior and recruited-player comprehension remain untested.

Evidence:

- [Full final-art run](verification/round-3/results.json): 214/215 before the last catalogue correction.
- [Fresh-server final corrections](verification/round-3-final-corrections/results.json): 78/78.
- [320px home](verification/round-3-final-corrections/home-320.png), [320px road](verification/round-3-final-corrections/road-gully-320.png), [390px night road](verification/round-3-final-corrections/night-road-gully-390.png).
- [Corrected 320px question/Pause control](verification/round-3-final-corrections/question-320.png), [Chase](verification/round-3/chase-question.png), [Super Over](verification/round-3/superover-question.png).
- [Final native design board export](design/round-3-board.png): confirms corrected labels, truthful locked action, higher-record rule and reward breakdown. It is a design artifact, not a browser screenshot.
- [Production build smoke](verification/production-smoke.json): **3/3** against `dist-static` at `/fact-duel/`; final arena art loads from the correct base path, one tap exposes four enabled choices, and no JavaScript error occurs. This uses a local static server, not production hosting.
- [Root release checks](verification/root-checks.json): **1,042/1,042 deterministic tests**, TypeScript, production static build, Pages assembly and whitespace checks pass. These are root's recorded release results. The existing optional gem-vault chunk-size advisory remains; the build succeeds.

## Browser gate

Runner: `scripts/trophy-road-browser-check.mjs`. The runner operates a Vite candidate and Chromium in one process, collecting runtime errors, actual wall-clock phase timing, screenshots and structured results. It does not change the configured bot delay or fake timers for pacing. Explicit seeded profiles are used only for labelled arena-boundary fixtures; completed real sessions separately demonstrate earned progression. Local counters only produce even trophy totals, so browser fixtures use 0/58/60/178/180; pure helper tests separately cover literal 59/179 via the authoritative-human-total argument.

Covered checks: arena boundaries; one-to-three-click launch; distinct Chase/Super Over behavior; rapid input idempotency; actual 3–4 second bot response; automatic next round; replay; source-bank answer mapping after option shuffle; persistent rotation including concurrent tabs and profile epochs; no visible/catalog question inventory; 320×568 and 390×844 portrait, 844×390 landscape and 1440×1000 desktop overflow; reduced-motion fallback; reload; offline after loaded practice; missing-art fallback; no disabled-ad requests. Static build, online deployment and broader deterministic test suites are owned and reported by root and siblings.

The gameplay lane's deterministic coverage, included in root's release suite, handles cases impractical to infer from screenshots: 10,000 rapid polls, duplicate and replacement submissions, late accepted answers, no-answer fallback, Chase simultaneous target/draw, Super Over exact 5s/10s scoring boundaries, invalid timing, conservative counter migration and sibling-edition compatibility. See `GAMEPLAY.md` and `tests/trophy-gameplay.test.mjs`. Their fake-clock/engine checks complement the real-clock browser measurements; neither is presented as the other.

## Requirement outcome ledger

| Requirement | Implemented evidence | Validation type / current status | Remaining risk |
| --- | --- | --- | --- |
| TR01 permanent arena gates | `lib/stadium-road.mjs`, `app/screens/stadium-road.tsx`; all boundary fixture states and ordinary reload passed | Automated-tested + observed-tested | Device-local play progress is not trusted ranked evidence; device reset removes local history. |
| TR02 direct launch | Home Play in all four viewports; actual one-action questions, three-action map launch and one-action replay | Observed-tested | Mobile emulation is not physical touch testing; optional road scrolls on short screens. |
| TR03 meaningful arena modes | `lib/server/room-engine.mjs`; completed five-ball Gauntlet, three-correct Chase, six-ball/36-run Super Over | Automated-tested + observed-tested | Novelty/value needs real player observation; all-correct browser samples do not replace edge-case unit tests. |
| TR04 legible reward economy | `lib/progression.mjs`; two real settled correct answers produce twelve persisted trophies; visible Local/Verified distinction and higher-total rule | Source-reviewed + observed-tested | Migration cannot recover unknown old attempts; legibility is not measured comprehension. |
| TR05 rival pacing | `lib/server/duel-service.mjs`, `app/screens/room-screen.tsx`; sixteen real timing samples, fast auto-next, explicit pause/keyboard/banter holds | Automated-tested + observed-tested | Browser scheduling and online latency vary; no physical-device timing claim. |
| TR06 rotation and inventory privacy | `lib/question-rotation.mjs`, `lib/local-question-history.mjs`, catalogue projection; real replay/reload and two-tab nonoverlap; fresh catalogue privacy pass | Source-reviewed + automated-tested + observed-tested | A finite bank must eventually repeat. A static client bundle is not a secret inventory vault; user-facing totals are suppressed. |
| TR07 resilient mobile access | Actual day/night four-viewport renders, ≥44px answer/Play/Pause targets, enlarged text, Hindi, offline/missing-art and reduced-motion checks | Observed-tested | Vertical scrolling remains on short screens; full screen-reader/device testing outstanding. |
| TR08 voluntary play | Repeated free local starts and one-action replay; no ad network requests; unlock helper independent of spendable cosmetics | Source-reviewed + observed-tested | No wellbeing or retention claim follows; expiry regression belongs to existing Club suites. |

## Reproduction

```sh
TROPHY_PASS=review node scripts/trophy-road-browser-check.mjs
TROPHY_PASS=targeted TROPHY_ONLY='viewport 320|viewport 390|viewport 844|viewport 1440|resilience privacy and reduced motion|pause for reading and keyboard' node scripts/trophy-road-browser-check.mjs
```

Set `CHROMIUM_PATH` if Chromium is not at `/tmp/chromium`. Set `TROPHY_NO_SCREENSHOTS=1` for functional-only checks. Each run preserves its own `results.json`; failure sets a nonzero exit code. The runner serves source from the static Vite configuration, so a separate production static build remains required.
