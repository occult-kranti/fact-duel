# Advisor loop 2 — re-review of the "Floodlight" gamification release

**Reviewer:** the same independent advisor as loop 1 (did not build any of this).
**Scope:** verify every loop-1 P0 and P1 fix **in the running app**, then hunt for what the fix wave
broke or what loop 1 missed.
**Method:** read `advisor-loop1.md`, the design bible, the advisor skill and the two fix commits
(`9334d2a` P0s, `5221371` P1s), then drove `http://localhost:5173` with Playwright at **390×844** and
**1440×900**, in **dark and light**, and with **`reducedMotion: 'reduce'`**. Two complete bot duels
(Quick Draw, Triple Threat), two complete expeditions, the five tabs, the Settings sheet, the Locker
and the ceremony overlay. Measurements are DOM/geometry probes (`getBoundingClientRect`,
`getComputedStyle`, `document.elementFromPoint`, real `mouse.click` at measured coordinates,
per-frame `requestAnimationFrame` sampling), plus screenshots that were **read, not just taken**.

---

## Verdict: **FIX FIRST**

All four loop-1 P0s are genuinely fixed, and 14 of the 15 loop-1 P1s are fixed or materially improved.
The timing contract survived a 30-file CSS-and-component rewrite intact — I re-verified every clause of
it at runtime and it is still exemplary. The light theme is now a real light theme. The reward burst is
now one ceremony plus toasts instead of six modals. This is a much better build than loop 1.

It still cannot ship, because **fixing P0-2 exposed a worse bug in the same component**: the 3D medal
now renders — at almost three times the size of the slot it was given. It covers the ceremony's title,
covers the reward chips, and sits on top of the **Continue** button, where it eats the tap. A player
who levels up sees a giant coin, cannot read what level they reached, and taps Continue in the middle
with nothing happening. This is the release's centrepiece screen and it is broken on both viewports, in
both themes, and with reduced motion on.

### The three biggest wins to make

1. **Give the ceremony medal the height of its slot, and stop it eating the tap.**
   `.fx-ceremony-hero` is `132 × 132` (`components/fx/fx.css:246-249`). `RewardMedal` defaults to
   `height = 380` (`components/three/reward-medal.tsx:404`) and
   `app/screens/use-progression-feedback.tsx:69,98,114,137` passes no `height` — so the canvas measures
   **135 × 384**. `finish.tsx:89` passes `height={132}`, which is exactly why the stamp ceremony looked
   right in loop 1 and the level ceremony did not once it started rendering.
2. **Extend the ceremony quiet gate beyond rooms.** A "LEVEL UP" ceremony still opens on top of a live
   expedition card. Its body scroll lock also defeats the new Next-button scroll, which is the one way
   the P0-3 fix still fails.
3. **Add the gate test loop 1 asked for.** `tests/` has no test that a progression diff raised during a
   round does not flush, and none that a ceremony's slot survives the provider. Both P0s of loop 1 were
   invisible to 94 passing tests; so is the new one.

---

## Scores (1–5) — loop 2, with loop 1 in brackets

| Screen | Hook | Feedback | Progress | Autonomy | Honesty | Craft | Mobile | A11y | Perf | Timing | Avg |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Home** (Arena Hub) | 5 (5) | 3 (3) | 4 (4) | 4 (4) | 5 (5) | **4** (3) | 4 (4) | 4 (4) | 4 (4) | — | **4.1** (4.0) |
| **Play** (Duels) | 5 (5) | 4 (4) | **4** (3) | 5 (5) | 5 (5) | 4 (4) | **4** (3) | 4 (4) | 5 (5) | — | **4.4** (4.2) |
| **Room** (live match) | 5 (5) | **4** (3) | 4 (4) | 4 (4) | 5 (5) | 4 (4) | 4 (4) | 4 (4) | 5 (5) | **5** (5) | **4.4** (4.3) |
| **Expeditions** | 4 (4) | 4 (4) | 4 (4) | 5 (5) | 5 (5) | **4** (3) | **4** (2) | **4** (3) | 5 (5) | — | **4.3** (3.9) |
| **Player** (+ Locker) | **3** (2) | 3 (3) | **4** (3) | 5 (5) | 5 (5) | **3** (2) | 3 (3) | **4** (3) | **4** (3) | — | **3.8** (3.2) |
| **Vault** (+ Discovery) | 4 (4) | 3 (3) | 3 (3) | 5 (5) | **5** (4) | **4** (3) | 4 (4) | **4** (3) | 5 (5) | — | **4.1** (3.8) |
| **Settings sheet** | 4 (4) | 4 (4) | — | 5 (5) | **4** (3) | 3 (3) | **2** (4) | **3** (4) | 5 (5) | — | **3.8** (4.0) |
| **Ceremony overlay** *(new row)* | 3 | **2** | 3 | **2** | 5 | **1** | **1** | 3 | 3 | — | **2.6** |

Criteria: 1 Hook · 2 Feedback · 3 Progress · 4 Autonomy & ownership · 5 Honesty · 6 Craft · 7 Mobile ·
8 A11y · 9 Performance · 10 Timing contract (scored only where a timed surface exists).

The ceremony overlay gets its own row this loop because it is no longer a component detail: it is now
the surface every reward lands on, and it is the worst screen in the product. Settings drops because
the P1-12 target sweep stopped at the tab screens and never entered the sheet.

### Timing contract: still 5/5, re-verified at runtime

Every clause, measured in the running app rather than read in the source:

| Clause | Measurement |
|---|---|
| Hidden mount | Per-frame sampling of `.fd-qcard` caught it at `visibility: hidden` for the first **2 frames (≈19 ms)**, then `visible` — the double-rAF marker in `app/arena.tsx:415-435` driving the inline style at `question-stage.tsx:165`. |
| No entrance animation | `.fd-qcard` `animationName: none`, `transform: none`, `transitionDuration: 0s`. |
| Timer track | `.fd-track.timer-track` and its fill: `transitionProperty: none`, `transitionDuration: 0s`. Speed-bar fill `.fd-speed > span`: `transitionProperty: none`. |
| Fixed option order | Option text read in DOM order across rounds, `data-state` `live` on all four until a result exists; `animationName: none`, `animationDelay: 0s` on every option. |
| No WebGL in a room | Max canvases while a question was on screen: **1**, and `getContext('webgl2'‖'webgl')` on it: **false** (the Canvas2D particle layer). Max WebGL contexts in a room across two full matches: **0**. |
| Click not deferred | Real click → buttons `disabled` and the status line reading "Received. Your answer is sealed." in **17 ms** (one frame). |
| Answer height | 56 px on all four options at 390 px. |

**Do not let the ceremony fix regress this.** The room's DOM is byte-for-byte what it was; the shared
`AnswerButton` refactor (`app/screens/answer-button.tsx`) kept that promise and I could not find a
single regression in the room.

---

## Loop-1 P0s — all four fixed

| Item | Status | Evidence in the running app |
|---|---|---|
| **P0-1** ceremonies/toasts over the reveal | **Fixed** | Gate is now `ceremonies: !!room` (`app/arena.tsx:788`), i.e. held for the *whole* room rather than only the reveal window. Quick Draw: **0** ceremonies in-room, **0** over a question, **0** toasts while a question was live. Triple Threat (3 rounds): the same, **0/0/0**. |
| **P0-2** `useProgressionFeedback` outside `<FxProvider>` | **Fixed** | `AppShell` now takes an `effects` slot rendered inside the provider (`app/shell/app-shell.tsx:21-23,55-58`) and `arena.tsx` passes `<ProgressionFeedback>`. The open ceremony contains **1 canvas, 132 × 378, `getContext('webgl2') === true`, `data-scene-frame="ready"`** — a real 3D medal, not a lucide icon. No `[fx] useJuice(): no <FxProvider> found` warning anywhere. *(But see P0-A: the medal that now renders is the new bug.)* |
| **P0-3** expedition CTA under the tab bar | **Fixed, with one exception** | `scroll-margin-bottom: calc(var(--nav-h) + var(--gutter) + env(safe-area-inset-bottom))` (`app/expeditions.css:1924-1928`) plus `block: 'end'` (`run.tsx:110-121`). Measured on every card of a six-card run at 390×844: CTA settles at **y 716–772**, nav top **788**, **0 px covered**, and `elementFromPoint` at the button's centre returns `.fd-exp-next` itself. Exception in P0-B below. |
| **P0-4** six modals per match | **Fixed** | `ceremonyQueue` is ranked `level > badge > rank > streak` and only the headline opens; the rest become silent toasts (`use-progression-feedback.tsx:168-176`). Measured after a Quick Draw and after a Triple Threat: **exactly 1 ceremony + 4 toasts** each ("Play any duel", "First duel", "First win", "Speed demon"). |

---

## P0 — blocks ship

### P0-A · The 3D medal is 3× its slot: it hides the ceremony title and swallows the Continue tap

- **Where:** `components/fx/fx.css:246-249` (`.fx-ceremony-hero` is `width: 132px; height: 132px;
  display: grid; place-items: center`, no `overflow`), `components/three/reward-medal.tsx:404`
  (`height = 380` default), `app/screens/use-progression-feedback.tsx:69, 98, 114, 137` (four
  `LazyRewardMedal` slots, none passing `height`).
- **Why it matters:** measured on the LEVEL UP ceremony at **1440×900**: hero box `132 px` tall, scene
  wrapper `380 px`, canvas `135 × 384`. Overlap with the title **28 px (100 % of it)**, with the reward
  chips **36 px (100 %)**, with the Continue button **48 px (100 %)**. `document.elementFromPoint` at
  the Continue button's centre returns **`CANVAS`**, and a real `mouse.click` there **does not close the
  ceremony**; a click 18 px in from the button's left edge does. Identical at **390×844**, and identical
  with `reducedMotion: 'reduce'` (the medal poses a static frame — at the same wrong size). Reading the
  screenshot: the words "Level 2" are completely invisible behind the coin, and the subtitle reads
  "Rookie · kee———odlights on". Design bible §6 asks for "a full-screen ceremony with a 3D medal,
  confetti and **a single Continue button**"; §9 asks for 4.5:1 text contrast — text hidden behind a
  canvas has no contrast at all. WCAG 2.5.8 as well: the only control on the dialog is unreachable
  across the middle 132 px of its 376 px width.
- **Why loop 1 did not see it:** the medal never rendered. The one ceremony that did render its medal
  in loop 1 — the expedition stamp — is raised from `app/screens/expeditions/finish.tsx:89`, which is
  the only call site that passes `height={132}`. So the release has always had exactly one correctly
  sized ceremony and four wrongly sized ones; P0-2 made the other four visible.
- **How:** pass `height={132}` (and drop `size` to match) on all four `LazyRewardMedal` slots in
  `use-progression-feedback.tsx`; then make the slot defensive so this cannot recur — add
  `overflow: hidden` and `pointer-events: none` to `.fx-ceremony-hero`, and give `.fx-ceremony-card
  button` a `position: relative; z-index: 1`. Add a test or a screenshot check that the ceremony's
  Continue button is the top element at its own centre.

### P0-B · Ceremonies still open on top of a live expedition card, and their scroll lock strands the CTA

- **Where:** `app/arena.tsx:784-789` — `ceremonies: !!room` covers rooms only; the expedition run is a
  tab screen, not a room. `components/fx/fx-provider.tsx` `CeremonyDialog` sets
  `document.body.style.overflow = 'hidden'` for its lifetime.
- **Why:** measured on a six-card expedition at 390×844: after answering card 4 a full-screen
  **"LEVEL UP · Level 2"** ceremony opened with the answered card and its explanation still mounted
  behind it (`runVisible: true`, `document.body.style.overflow === 'hidden'`). Because the body was
  locked, the `scrollIntoView` at `run.tsx:110-121` did nothing: the "Begin chapter 3" CTA stayed at
  **y 1127–1181** in an 844 px viewport — 339 px below the fold — with `scrollY` pinned at 0, exactly
  the P0-3 failure mode. It recovers only after the player finds and taps Continue (which, per P0-A,
  does not work at the button's centre). Cards 1, 2, 3 and 6 — with no ceremony — all settled correctly
  at y ≈ 718. This is loop-1 P0-1 on the other answering surface: the bible's rule is that a ceremony
  never covers the moment a player is learning from, not that it never covers a *room*.
- **How:** make the quiet gate name the surface, not the room — e.g. `ceremonies: !!room ||
  expeditionRunActive`, flushed when the player reaches the finish screen (where the stamp ceremony
  already lives). While there, re-run the deferred `scrollIntoView` when a ceremony closes.

---

## P1 — before ship

**P1-A · The ceremony scene never leaves `loading` for the second and later ceremonies of a session.**
At the expedition finish, both the LEVEL UP and the STAMP COLLECTED cards held
`data-scene-frame="loading"` for the whole of their life (sampled to 3.4 s), with a stale 150 px canvas
and **no medal drawn** — the card shows only the flat gradient disc. The first ceremony of a session
(after a duel) reached `ready` in ~1.8 s. Observed under software WebGL (SwiftShader), so the timing
may differ on a real GPU, but the state machine sticking at `loading` is not a frame-rate artefact.
Worth an explicit timeout → `SceneSkeleton`/fallback in `components/three/lazy-scene.tsx` so a stuck
scene degrades to the 2D medal instead of an empty disc.

**P1-B · The Settings sheet was not part of the P1-12 target sweep.** Measured at 390 px inside
`.fd-sheet`: **Close 16 × 16**, four switches **32 × 18**, the Effects segment "Full" **132 × 36**, the
name field **356 × 36**. The five tab screens are now clean (0 targets under 44 px at 390 px), which
makes the sheet the last WCAG 2.5.8 hole — and the 16 × 16 close control is the worst target in the
product. `app/shell/settings-sheet.tsx` + the `Switch`/`SheetContent` primitives.

**P1-C · The expedition economy is unchanged (loop-1 P1-14, not attempted).**
`lib/progression.mjs:30-35` still has `expeditionComplete: 100`, `expeditionStamp: 150`,
`expeditionScorePoint: 5`. Measured this loop: **+250 XP for 0 of 6 correct** and **+260 XP for 1 of 6**
— still more than double a Gauntlet *win* (`matchWin.gauntlet: 120`). Combined with `xpToNext`, a player
who guesses their way through two expeditions is level 3 before they have answered a question correctly,
which is precisely why the level-up ceremonies I triggered all read "Rookie". SDT: competence feedback
that does not track competence stops meaning anything. This was the one loop-1 P1 the fix wave did not
touch, and it is the one that most affects what the numbers mean.

**P1-D · Play: the sticky launch bar still covers "Pick your subject" at the default scroll position.**
The fix added `padding-bottom: 84px` to the Play column, so the chips are now reachable — but at
`scrollY: 0` on a 390 px phone, `elementFromPoint` on the "Pick your subject" heading returns
`.fd-launch-btn` and on the first two subject chips returns `.fd-nav-btn`. Loop-1 P1-4 is half fixed:
reachability yes, first impression no. Either shorten the format/opponent blocks or let the launch bar
collapse to a compact pill once the player scrolls past the opponent picker.

**P1-E · The expedition CTA is 54 px, not the 56 px control floor.** `app/expeditions.css:1276-1280`
still sets `min-height: 54px` on `.fd-exp-next` while the answer buttons on the same screen are 56 px
(measured). Bible §5. One line.

**P1-F · Settings storage copy is current but still not the product's vocabulary.**
`app/shell/settings-sheet.tsx:160-168` now reads "your Vault of facts and saved question issues,
expedition progress and stamps, XP, gems and activity points, side quests and card finishes" — the
"journal / passport points / missions" drift loop 1 flagged is gone. Remaining: "activity points",
"side quests" and "card finishes" are not names the UI uses (it says XP, Achievements/Daily quests and
Locker frames), and the toggle is now "Arena object in 3D", which is clearer but still names nothing a
player has seen. This is the screen where a player learns what is kept on their device, so vocabulary
here is an honesty question.

**P1-G · Still no live region for score or timer.** `app/arena.tsx` exposes two `aria-live="polite"`
regions; in a live match both were empty for the whole round and the only content either ever carried
was a progression toast. The clock and speed row remain `aria-hidden`. Bible §9 asks for score via
`aria-live`. Carried from loop-1 P2 — promoted, because it is now the largest remaining a11y gap after
the target sweep landed.

**P1-H · No test covers either failure class.** 94 tests pass and none of them would have caught
P0-1, P0-2, P0-A or P0-B. Two cheap ones: (a) a progression diff raised while `quiet.ceremonies` is true
does not call `juice.ceremony` until the gate opens; (b) a rendered ceremony's Continue button is the
element returned by `elementFromPoint` at its own centre.

---

## Loop-1 P1s — item by item

| # | Loop-1 item | Status | Evidence |
|---|---|---|---|
| P1-1 | "into level 1" | **Fixed** | Player level card reads "10 XP · **10 / 80 to level 2**"; the three restatements are down to two. |
| P1-2 | Light theme kills accents | **Fixed** | Tokens split into fill and text (`--volt` `oklch(92% .23 125)` stays vivid; `--volt-text` `oklch(46% .115 125)` for ink). Light "Play now" is bright volt with dark ink; the hero is a light surface, not a dark slab. Contrast sweep over the five tabs in light: no confirmed failure. |
| P1-3 | Desktop toast covers the topbar chips | **Fixed** | Topbar 0–60 px, toast 63–121 px, overlap **0 px** at 1440×900. |
| P1-4 | Launch bar covers the subject picker | **Partial** | 84 px bottom padding added; chips reachable by scroll, heading and first row still occluded at rest. See P1-D. |
| P1-5 | CTA between headline and fact | **Fixed** | Between-rounds DOM order is now: "A MOMENT TO LEARN" → verdict → "The answer and its explanation are right below" → question → explanation → "Here's how it was decided." → receipts → CTA. |
| P1-6 | "Play again" below the fold | **Fixed** | At 390×844 the primary CTA sits at **y 570–624** of 844, fully visible without scrolling. |
| P1-7 | Duplicate coins disclaimer | **Fixed** | One tile disclaimer ("Free simulated coins. No monetary value."); the verdict detail now reads "Free play". |
| P1-8 | "Activity is not measured mastery" | **Fixed** | Now "Meeting a fact is not the same as knowing it." |
| P1-9 | Settings storage names | **Mostly** | See P1-F. |
| P1-10 | Stamp line breaks into a column | **Fixed** | Renders as one sentence: "Complete six cards, at any score, to collect the World Cup stories stamp." |
| P1-11 | Thirty identical grey discs | **Fixed** | 30 badges, `data-tier` bronze/silver/gold with **3 distinct rim colours**, and **21 of 30** locked badges now show progress ("0 / 10 wins", "0 / 50 wins"). |
| P1-12 | Sub-44 px targets | **Fixed on the five tabs**, missed in the Settings sheet — see P1-B. |
| P1-13 | Expedition/Discovery answers lack a11y twins | **Fixed** | One shared `app/screens/answer-button.tsx` used by the room, `expeditions/run.tsx:248` and `vault/choices.tsx:74` (Discovery + Recall Lab). Measured on an expedition card: `.fd-sr` twins "Triangle, option 1"…"Square, option 4", `kbd` hints 1–4, 56 px tall, inline shape SVG. The room's markup is unchanged. |
| P1-14 | Expedition economy | **Not attempted** — see P1-C. |
| P1-15 | Locker downloads Rapier at 0 gems | **Fixed** | Opening the Locker at `gems === 0` requests only `gem-vault-fallback`; the physics module is not fetched. |

---

## P2 — backlog (carried and new)

Carried from loop 1, still true:

- Desktop rail is 224 px with labels at 1440 px (bible: 76 px icon rail that expands **on hover** ≥ 1200).
- Home player card still has ~100 px of dead space between "Level 1 · Rookie" and the XP bar at 1440 px.
- The hero poster is still visible behind the orb in dark theme (a basketball on the right edge).
- Route maps still draw five waypoints for three chapters.
- Six back-button labels for the same gesture; on Expeditions "← Home" still takes the top ~60 px of a
  phone screen while the tab bar is right there.
- Expeditions and Vault card titles are still not headings (Expeditions: 72 card elements, **0 `h3`**).
- Combo has no 80 ms hit-stop and still sits in the HUD rather than beside the answers (bible §4).
- Two stamp cases on Player (an unlabelled 3D case above the 2D grid that carries the information).
- Vault fact cards still reveal the answer immediately.
- Raw hex remains in `app/screens/player/player.css` (tier ramp) and `locker.tsx`.
- Quest cards still lead with a bare "0".
- The 54-question bank still skews hard for a new player against a 25 % bot.
- `.fd-exp-answer` keeps its 45 ms staggered entrance while the room's has none — still incidental
  rather than deliberate.

New this loop:

- **Player is now 8,623 px tall at 390 px** (8,096 px in loop 1) with no section nav — the achievements
  and progress work made a long screen longer. Tabs (Record / Mastery / Badges / Stamps / Locker) would
  pay for themselves.
- **`lint` is red and got redder.** 259 problems (237 errors, 22 warnings) against a pre-gamification
  baseline of 183 (145 errors, 38 warnings): +92 errors, 188 of the 259 are
  `@typescript-eslint/no-explicit-any`, 220 of the errors are in `app/`. It was already red, so this is
  not a regression *of policy* — but the release roughly doubled the debt, and `progression: any`
  threaded through every screen is the reason.
- **The expedition finish can still stack two ceremonies** (LEVEL UP, then STAMP COLLECTED). That is by
  design — `finish.tsx:55-59` deliberately waits for a free overlay — and two is not six, but it is two
  Continue taps between the player and their scorecard.

---

## What is genuinely good — keep it

- **The timing contract survived the rewrite.** Thirty files changed under it, including a full
  extraction of the answer button into a shared component, and every clause still measures clean. The
  comment block at the top of `answer-button.tsx` explaining *why* the room's DOM must not move is the
  reason it survived; keep writing those.
- **The reward-burst coalescing is exactly right.** Ranked `level > badge > rank > streak`, one
  ceremony, the rest as silent toasts. One ceremony and four toasts after a match is the correct shape,
  and the toasts now clear the topbar chips they are reporting.
- **The honesty layer is still the best I have reviewed, and the fix wave did not erode it.**
  Re-verified in this pass: "Random 25% guesser · answers after 1–14.5s and never reacts to yours" on
  the lobby card; "VS BOT" on the HUD; "Browser-reported time" vs "Scheduled bot time" on both receipts;
  "Rank points are counted on this device and never verify skill"; "Free simulated coins. No monetary
  value."; "Your stamp marks completion, regardless of score… scores are local practice, not a ranking";
  "Meeting a fact is not the same as knowing it." I searched the running DOM for fabricated presence
  ("N players online") and manufactured near-misses ("you almost won") and found **none**. The margin
  line is still computed from real rounds ("Both correct. Your reported time was 7.718 s faster. The bot
  time is a simulation.").
- **The light theme is now a design, not an inversion.** Splitting each accent into a fill token and a
  text token was the right call and it shows: the CTA is vivid volt with dark ink, the timer bar keeps
  its colour, and the four answer accents are still four distinguishable hues.
- **The achievements gallery went from a wall of grey discs to a readable ladder** — tiered rims and
  21 of 30 locked badges showing `current / target`. Goal-gradient, cheaply earned.
- **Reduced motion is still honoured end to end.** With `prefers-reduced-motion: reduce`: 0 animated
  elements on Home, 0 confetti nodes and 0 shake animations across a whole match, 3D posed as a static
  frame, `scrollIntoView` switched to `auto`.
- **Craft floor held:** 0 px horizontal overflow and 0 console errors on all five tabs at 390 and 1440,
  in dark **and** light, and in the reduced-motion pass; one `h1` per screen; a 3 px volt focus ring with
  4 px offset on keyboard focus; the ceremony is a real `role="dialog" aria-modal="true"` with a focus
  trap, Escape, scroll lock and focus restore (which is the only reason P0-A is not a dead end — a
  keyboard user can still press Escape).
