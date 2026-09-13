# Advisor loop 1 — independent review of the "Floodlight" gamification release

**Reviewer:** independent advisor (did not build any of this).
**Method:** read the design bible, roadmap and both skills, then walked the running build with Playwright
at 390×844 and 1440×900 — Home, Play, Expeditions (atlas → brief → run → finish), Player (incl. the
Locker), Vault, Discovery, Collections, the Settings sheet, a full Quick Draw bot duel, a Triple Threat
for the between-rounds panel, a five-round Gauntlet, a complete expedition, `/fx-lab` and `/three-lab`,
plus light theme and `reducedMotion: 'reduce'` passes. Screenshots were read, not just taken. Code was
read where the pixels raised a question.

**Gates as found:** `node --test tests/*.test.mjs` → 94/94 pass. Zero horizontal overflow and zero
console errors on all five tabs at both widths, dark and light. One console **warning** that turns out
to be the single most damaging bug in the release (P0-2).

---

## Verdict: **FIX FIRST**

This is a genuinely good build. The timing contract is intact and I could verify every clause of it. The
honesty layer is the best I have reviewed in a gamified product — the bot's actual algorithm is printed
on the lobby card, receipts distinguish "Browser-reported time" from "Scheduled bot time", and the match
margin is computed from real rounds. The Play funnel is two taps. The answer buttons carry shape +
colour + position + keyboard hint + a screen-reader shape name.

It is not shippable yet, because **the reward layer — the thing this whole release exists to add — is
broken in the two places a player actually meets it**: full-screen ceremonies land on top of the
correct-answer reveal, and none of them render the 3D medal they were built around. Neither is visible
in code review or in the test suite; both are obvious the moment you play a round.

### The three biggest wins to make

1. **Let the reveal finish before anything celebrates, and stop stacking modals.** A five-round bot match
   currently opens **six** full-screen ceremonies, two of them while the question card is still on
   screen showing the result. Gate ceremonies on the room screen's reveal hold, and collapse a burst of
   rewards into one summary ceremony plus toasts.
2. **Move `useProgressionFeedback` inside `<FxProvider>`.** It sits one level above the provider, so
   `useJuice()` silently falls back to the raw event bus, which drops the `slot` prop. Every level-up,
   achievement, rank-up and streak ceremony therefore renders a flat lucide icon instead of the
   `LazyRewardMedal` — while the expedition stamp ceremony, which *is* inside the provider, renders its
   medal perfectly. One import move restores the entire R3F ceremony layer (G20).
3. **Unblock the expedition run on a phone.** After every answer the primary CTA is rendered under the
   fixed tab bar with 41 of its 54 px covered; a tap at its centre activates the **Play** tab and
   abandons the run. Expeditions are unusable at 390 px today.

---

## Scores (1–5)

| Screen | Hook | Feedback | Progress | Autonomy | Honesty | Craft | Mobile | A11y | Perf | Timing | Avg |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Home** (Arena Hub) | 5 | 3 | 4 | 4 | 5 | 3 | 4 | 4 | 4 | — | **4.0** |
| **Play** (Duels) | 5 | 4 | 3 | 5 | 5 | 4 | 3 | 4 | 5 | — | **4.2** |
| **Room** (live match) | 5 | 3 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | **5** | **4.3** |
| **Expeditions** | 4 | 4 | 4 | 5 | 5 | 3 | **2** | 3 | 5 | — | **3.9** |
| **Player** (+ Locker) | **2** | 3 | 3 | 5 | 5 | **2** | 3 | 3 | 3 | — | **3.2** |
| **Vault** (+ Discovery, Collections) | 4 | 3 | 3 | 5 | 4 | 3 | 4 | 3 | 5 | — | **3.8** |
| **Settings sheet** | 4 | 4 | — | 5 | **3** | 3 | 4 | 4 | 5 | — | **4.0** |

Criteria: 1 Hook · 2 Feedback · 3 Progress · 4 Autonomy & ownership · 5 Honesty · 6 Craft · 7 Mobile ·
8 A11y · 9 Performance · 10 Timing contract (scored only where a timed surface exists).

**Timing contract: 5/5, verified in the DOM.** The question card mounts `visibility: hidden` and is
revealed by the double-rAF marker in `app/arena.tsx:421-441`; `.fd-track.timer-track` and its fill both
carry `transition: none` (`app/screens/room/room.css:672-687`), as does the speed bar; `.fd-qcard` sets
`animation: none; transform: none`; option order is a plain `question.options.map` with stable keys and
no shuffle; `data-state` is `'live'` for every option until `rd.result` exists. The only canvas in a
room is the Canvas2D particle layer, whose rAF loop is only scheduled while live particles exist — no
WebGL context is created in a room. **This part of the release is exemplary; do not let the fixes below
regress it.**

---

## Prioritised fix list

### P0 — blocks ship

**P0-1 · Progression ceremonies and toasts fire on top of the correct-answer reveal**
- **Where:** `app/arena.tsx:97-102` (the `quiet` gate) against `app/screens/room-screen.tsx:23,60-70`
  (`REVEAL_MS = 1900`, `revealing`).
- **Why:** Design bible §6 and the comment on the gate itself both say ceremonies must be held through
  the live round *including the reveal window*; the room screen keeps the question stage mounted for
  1.9 s after a result precisely so the correct answer, the XP float and the burst land on the button
  that was pressed. The gate is `!!room && !room.settled && room.phase !== 'between'`, and the server
  flips `settled`/`phase` on the same tick the result arrives — so the gate opens *before* the reveal
  hold ends. Measured: `stage=question` with a `BRONZE BADGE` ceremony already open at +300 ms after
  the answer, and a `LEVEL UP` ceremony over the reveal at +900 ms. The player never sees which answer
  was right. Game Feel: the single most important feedback moment in the product is covered by a modal.
- **How:** have the room expose its reveal state (it already computes `revealing`) and feed it into the
  quiet gate — e.g. lift `holdId`/`revealing` into the controller and use
  `ceremonies: !!room && (revealing || (!room.settled && room.phase !== 'between'))`, with the same
  term added to `toasts`. Add a test that a diff produced during a round does not flush until
  `revealing` is false.

**P0-2 · `useProgressionFeedback` runs outside `<FxProvider>`, so every ceremony loses its 3D medal**
- **Where:** `app/arena.tsx:18,97` calls the hook; `app/shell/app-shell.tsx` mounts `<FxProvider>`
  *inside* `AppShell`, which `arena.tsx` renders. `components/fx/use-juice.ts:227-241` is the fallback
  path; `app/screens/use-progression-feedback.tsx:29,56-64` passes `slot: <LazyRewardMedal …/>`.
- **Why:** with no context, `juice.ceremony()` takes the bus path, which rebuilds the payload from
  `{kind, kicker, title, subtitle, rewards, continueLabel, silent}` and **drops `slot`**. Confirmed
  three ways: the console logs `[fx] useJuice(): no <FxProvider> found`; the open ceremony's hero
  contains `lucide-chevrons-up` and `canvases: 0` even after 4 s; and in the same session the expedition
  stamp ceremony (raised from `app/screens/expeditions/finish.tsx`, which *is* inside the provider)
  reports `canvases: 1` and shows its medal. So roadmap item G20 (Reward Medal in ceremonies) ships dead
  for level-ups, achievements, rank-ups and streak milestones — every reward except stamps. `stringIcon`
  silently drops non-string toast icons on the same path.
- **How:** move `<FxProvider>` up so it wraps `arena.tsx`'s tree (or move the `useProgressionFeedback`
  call into a small component rendered as a child of `AppShell`). Then make the fallback loud: in dev,
  `console.error` and throw in tests rather than `console.warn` once, so this class of bug fails a gate.

**P0-3 · Expedition run: the primary CTA renders under the fixed bottom tab bar on phones**
- **Where:** `app/screens/expeditions/run.tsx:108-117` (`scrollIntoView({ block: 'nearest' })`) and
  `:313-330` (`.fd-exp-next`); nav height is `--nav-h: 56px`.
- **Why:** measured at 390×844 after answering card 1: the CTA occupies y 775–829 and the nav occupies
  y 788–844 — **41 of 54 px covered**. `document.elementFromPoint` at the button's centre returns a nav
  tab icon, and a tap there navigates to **Play**, destroying the run. Reproduced every time on phone;
  the same flow completes all six cards at 1440×900, where there is no bottom bar. Design bible §5:
  "side gutters 16px minimum; no horizontal scroll ever" and thumb-zone CTAs — a CTA you cannot press is
  worse than one off-screen. The code comment claims it brings the Next button "into the thumb zone".
- **How:** scroll the CTA (not the feedback block) into view with `block: 'end'`, and give
  `.fd-exp-next` `scroll-margin-bottom: calc(var(--nav-h) + var(--gutter) + env(safe-area-inset-bottom))`.
  Also raise the button to `min-height: 56px` (it is 54 px) to match the bible's control floor.

**P0-4 · Ceremony pile-up: six full-screen modals in one five-round bot match**
- **Where:** `app/screens/use-progression-feedback.tsx:53-124` (one `ceremonyQueue` push per event) and
  `components/fx/fx-provider.tsx:92-105` (queue, one at a time).
- **Why:** a single Gauntlet against Lucky Guess produced, in order: `Night owl` badge, `Level 2`,
  then at the finish `Level 3`, `First duel`, `First win`, `Speed demon` — four of them stacked back to
  back *before the match result is visible at all*. Each needs its own Continue tap. Two of the six
  landed mid-reveal (P0-1). Octalysis/Game Feel: reward salience collapses when rewards queue; the match
  verdict, XP count-up and rank bar — the actual payoff — are buried under four modals. Worse, the level
  ceremonies are near-identical: `xpToNext` (`lib/progression.mjs:65`) and the 5-level title band
  (`:83`) mean a new player levels 1→4 in one session and reads "Rookie · keep the floodlights on"
  three times.
- **How:** cap ceremonies at one per "moment". Fire a ceremony only for the headline event (highest
  level reached, or a gold badge) and render the rest as reward chips inside that one card
  (`CeremonyOptions.rewards` already supports this) or as toasts. Coalesce multi-level gains into a
  single "Level 2 → 4" ceremony — `diff.leveledUp` already carries `{from, to}`.

### P1 — before advisor loop 2

**P1-1 · Player XP card says "into level 1" when you are working toward level 2**
`app/screens/player/level-card.tsx:86` renders `{into} / {toNext} into level {level.level}` → "10 / 80
into level 1". Home says "XP to level 2 — 10/80" for the same state. Use `level.level + 1`. While there,
drop one of the three restatements of the same number ("10 XP", "10/80 into level…", "70 XP to level 2",
"13%" all in one card).

**P1-2 · Light theme turns every accent into a fill colour it was not designed for**
`app/theme/tokens.css:94-150` drops all accents to ~58 % lightness so they pass as *text*. But the same
token paints surfaces: the "Play now" CTA becomes a dark olive slab with white ink, the timer track
becomes olive, `--gold` becomes brown so answer option 3's chip no longer reads as gold and sits too
close to option 1's ember. Design bible §5 explicitly says light theme should "keep accents". Split the
token: keep `--volt` etc. bright for fills and add `--volt-text` / `--gold-text` (the current dark
values) for text-on-light, then audit which of the two each rule wants. Also check the Home hero: the
dark poster/orb composite reads as a dark rectangle pasted onto a light page.

**P1-3 · On desktop, the progression toast covers the exact topbar chips it is reporting**
`components/fx/fx.css:56-65` pins the toast stack to `top: 20px; right: 20px`; the topbar is 0–60 px and
the toast is 20–80 px with an opaque background. A "Day 1 streak +10 XP" toast therefore hides the
streak flame, gems and level ring for its whole lifetime. Move the stack below the topbar
(`top: calc(var(--topbar-h) + 12px)`), or anchor it bottom-right on desktop too.

**P1-4 · Play: the sticky launch bar and the tab bar cover "Pick your subject"**
At 390 px, `elementFromPoint` on the first topic chips returns `fd-launch-btn` / `fd-nav-btn`
(`app/screens/play/play.css`, `launch-panel`). The chips are reachable after scrolling, but the section
heading and first row are occluded at the default position. Add bottom padding to the Play column equal
to the launch bar height + `--nav-h`, the way the other four tabs already do.

**P1-5 · The between-rounds "moment to learn" puts the CTA between the headline and the fact**
`app/screens/room-screen.tsx:74-101` + `RoundReview`. The panel says "The explanation is right below.
Take it in, then start the next round", but at 390 px the sticky "Start round 2" bar sits over the
rival's receipt and the explanation card is a full screen below it. Either move the fact above the
receipts so it is the first thing under the headline, or make the CTA non-sticky on this phase.

**P1-6 · Match finish: "Play again" is below the fold**
`app/rivalry-widgets.tsx:248-260`. At 390×844 only ~19 px of the primary CTA is visible under four stat
tiles and a note. This is the highest-intent moment in the loop (Hooked: the variable reward is the
trigger for the next action). Move the action row directly under the verdict/score block, or make it a
sticky bar for the finish stage.

**P1-7 · Duplicate coins disclaimer on the finish screen**
`app/rivalry-widgets.tsx:225-245`: the COINS tile says "Free simulated coins. No monetary value." and
`v.detail` immediately under it says "Free match. No coins spent." Bible §9: one disclaimer slot per
screen. Keep the tile, drop the repeat from the verdict detail.

**P1-8 · Broken copy in the Vault header**
`app/journal.tsx:320`: "Activity is not measured mastery." Intended, presumably, "Activity is not a
measure of mastery." It is the first paragraph on the screen.

**P1-9 · The Settings sheet describes storage using names the product no longer uses**
`app/shell/settings-sheet.tsx:165`: "Expedition progress and stamps, **journal**, saved question issues,
**passport points**, **missions** and **card finishes** stay in this browser." The UI calls these Vault,
XP, quests and Locker frames. This is the one place a player goes to understand what is kept on their
device, so the drift is an honesty problem, not just a naming one. Rewrite in current names; also rename
the "Showroom artwork" toggle, which points at a screen that is not in the nav.

**P1-10 · Expedition brief: the stamp line breaks into a three-line column**
`app/screens/expeditions/brief.tsx:55-58` inside `.fd-exp-contract` (`app/expeditions.css:808-819`),
which is `display: flex`. The `<strong>{route.stamp}</strong>` becomes its own flex item and collapses
to a narrow column ("World / Cup / stories") with "stamp." stranded beside it. Wrap the sentence in a
single `<span>`, or use `display: grid; grid-template-columns: auto 1fr`.

**P1-11 · The achievements gallery is thirty identical grey discs with no progress**
`app/screens/player/*` + `lib/progression.mjs:380-417`. Locked badges all render the same silhouette;
tier is text only (`BRONZE · +50 XP · +10 GEMS`), and nothing shows how close you are ("Win 200 duels"
reads the same at 0 and at 199). Octalysis drive 2 / goal-gradient: show tier in the silhouette (bronze
/ silver / gold rim), and add a progress bar to the countable ones — the predicate closures already have
the profile, so most can expose `current/target` cheaply. Leave the two hidden ones as `???`.

**P1-12 · Tap targets under the 44 px the bible claims (WCAG 2.5.8)**
Measured at 390 px: Expeditions filter segments `.fd-exp-seg-btn` 116×**40**; Player chips
`.fd-chip` 68×**36**, 105×36, 98×36; `.fd-cos-action` 178×**40**; the footer "Research & roadmap" link
115×**19** on every screen. Raise to 44 px minimum (padding, not font size).

**P1-13 · Expedition and Discovery answers lack the a11y and keyboard affordances the room has**
`app/screens/expeditions/run.tsx:217-244` and `app/discovery.tsx`: the shape glyph is there, but there
is no `<span class="fd-sr">Triangle, option 1</span>` twin and no `1–4` `kbd` hint — both of which the
room provides (`app/screens/room/question-stage.tsx:196-220`). A screen-reader user gets colour-and-shape
coding they cannot perceive on two of the three answering surfaces. Extract the room's answer button
into a shared component and use it on all three.

**P1-14 · The expedition economy pays more for clicking through than for playing well**
`lib/progression.mjs:30-35`: `expeditionComplete: 100` + `expeditionStamp: 150` + `5/point`. Observed:
**+260 XP for answering 1 of 6 correctly** — more than double a Gauntlet *win* (`matchWin.gauntlet: 120`).
Combined with `xpToNext` (80, 234, 436, 686…) a new player reaches level 3–4 in ten minutes without
knowing anything, then hits a wall. SDT: competence feedback that does not track competence stops
meaning anything. Rebalance so completion is a modest floor and score/boldness carries the payout, and
flatten the first four level steps so the three level-up ceremonies are not all "Rookie".

**P1-15 · The Locker downloads the Rapier physics chunk to render an empty bowl**
`app/screens/player/locker.tsx:117-131` mounts `LazyGemVault` whenever the disclosure opens, including at
`gems === 0`. That is ~2.2 MB (decision record §10) to show nothing. Gate on `gems > 0` and render
`GemVaultFallback` (or a static poster) otherwise. Also, cosmetics are bought blind — the preview is a
small coloured ring with no live preview on the player card; add one before asking for 60 gems.

### P2 — backlog

- **Desktop rail is 224 px with labels**, not the specified 76 px icon rail that expands at 1200 px
  (`app/shell/shell.css`, bible §5). It also leaves ~3,900 px of empty column on Player.
- **Home player card has ~100 px of dead space** between "Level 1 · Rookie" and the XP bar at 1440 px —
  the card stretches to the hero's height and the content does not redistribute.
- **The hero poster stays visible behind the orb** (`app/screens/home/hero-stage.tsx:17-24`): the WebGL
  core floats over a dark basketball photograph, so two hero images compete. Fade the poster out once
  `onReady` fires.
- **Route maps draw five waypoints for three chapters** (Expeditions atlas cards) — the graphic
  contradicts "Three chapters. Six cards." right beside it.
- **Chapter labels truncate on desktop** ("BEYOND THE HIG…", "OLD-SCHOOL DET…") where there is room.
- **Six different back-button labels** for the same gesture: "Home", "All expeditions", "Pause & browse",
  "Leave", "Back to play.", "Back to Play". Pick one pattern; on phone, drop the redundant ones entirely
  (the tab bar is right there) — on Expeditions the "← Home" button takes the top 60 px of the screen.
- **Five names for reward tracks** across two screens: "Daily quests" (Home), "Side quests & finishes"
  and "Continue mission" (Player), "Achievements", "Card finishes". Bible §"Copy tone": same words
  everywhere.
- **Score and timer are never announced.** `.fd-clock` and `.fd-speed-row` are `aria-hidden`, the HUD
  score has no live region, and the only `aria-live="polite"` region (`app/arena.tsx:822`) carries errors
  only. Bible §9 asks for score via `aria-live`. Announce the score on change, and the clock at 10/5/3 s.
- **Expeditions and Vault card titles are not headings** — the atlas has exactly one heading for nine
  route cards, the Vault two for a long card list. Make card titles `h3`.
- **Combo has no hit-stop and does not sit next to the answers.** Bible §4: "the combo meter sits next to
  the answers; at 3 and 5 the screen hit-stops 80 ms and bursts." Today it is a HUD chip
  (`app/rivalry-widgets.tsx:109-114`) and `question-stage.tsx:130-135` fires a ring pulse, cue and haptic
  but no hit-stop.
- **Player is 8,096 px tall at 390 px** with no section nav or collapse. Consider tabs (Record /
  Mastery / Badges / Stamps / Locker).
- **Two stamp cases on Player**: an unlabelled 3D case (which renders an empty box at 0/9) directly above
  the 2D stamp grid that carries the actual information. Keep one.
- **Vault fact cards reveal the answer immediately**, which undercuts the recall framing; consider
  blurring it behind a tap on the default tab.
- **Raw hex in `app/screens/player/player.css`** (`--tier-bronze/silver/platinum/diamond`,
  `--fd-accent: #ff8a6b`, `#11151c/#05070a` gradients) and `accent="#ffc83d"` in `locker.tsx:124`.
  Promote the tier ramp into `app/theme/tokens.css`.
- **Quest cards lead with a bare numeral** ("0") that reads as an orphan until you have progress; make it
  a ring or `0/1`.
- **Topic label truncates in the room** ("GREEN BAY PACK…") — allow two lines or shorten the subtopic.
- **The 54-question sample bank skews hard.** Five consecutive facts in my Vault were EXPERT/EXTREME; a
  new player loses most rounds to a 25 % random bot, which reads as unfair rather than difficult. Worth a
  difficulty ramp for the first N rounds (the difficulty field is already plumbed).
- **`.fd-exp-answer` has a staggered entrance animation** (`animationDelay: i*45ms`) while the room's does
  not. Correct per the timing contract, but it makes the two surfaces feel like different products; make
  the difference deliberate rather than incidental.

---

## What is genuinely good — keep it

- **The timing contract is real, and it is defended in code and in comments.** Double-rAF reveal marker,
  `visibility: hidden` mount, `transition: none` on both the timer track and the speed bar,
  `animation: none; transform: none` on the card, fixed option order, correctness styling that cannot
  exist before `rd.result`, no WebGL in a room and a particle loop that only runs when particles exist.
  The `REVEAL_MS` hold in `room-screen.tsx` — keeping the card mounted so the burst lands on the button
  that was pressed — is a genuinely thoughtful piece of game feel.
- **The honesty layer is exceptional.** "Random 25% guesser · answers after 1–14.5s and never reacts to
  yours" on the lobby card; "Browser-reported time" vs "Scheduled bot time" on receipts; "Rank points are
  counted on this device and never verify skill"; "Only today and your last credited day are stored, so
  earlier dots stay hollow" under a streak calendar that will never fill; "Scores describe local
  practice; stamps do not certify expertise"; Wild Rounds announced in the countdown, never after the
  fact; a margin line computed from real rounds. Nothing here is fabricated presence and nothing is
  oversold.
- **Answer coding.** Triangle/diamond/circle/square × ember/cyan/gold/magenta × fixed position × `1–4`
  keyboard hint × an `fd-sr` shape name, plus a check/cross icon on the result. Four redundant channels;
  colour is never load-bearing alone.
- **The Play funnel.** Format → opponent → subject → one sticky launch control, with the reward preview
  ("Win: +120 XP · +40 RP") on the card you are choosing. Two taps from lobby to question, exactly as the
  bible promised.
- **The room's status line** carries the whole XP breakdown as text — "+65 XP · speed +15 · ×1.5 combo" —
  which is simultaneously the visual twin for the audio cue and the accessible announcement. Focus moving
  to it on lock (instead of falling to `<body>`) is a nice catch.
- **Reduced motion is genuinely respected**: no confetti, no sunburst rays, 3D poses a static frame, and
  the `scrollIntoView` behaviour switches to `auto`. Three independent controls (OS, in-app Effects,
  sound/haptics) rather than one blunt switch.
- **The Knowledge Core hero and the stamp medal** are lovely, and the Rapier gem tray genuinely delights
  once it has gems in it. The `SceneFrame` wrapper — WebGL probe, dpr clamp, IntersectionObserver pause,
  error boundary to fallback, context disposal on unmount — is the right abstraction.
- **Autonomy is well protected.** Nothing is auto-spent, the Locker states its price and its lock reason,
  export and reset are one tap from Settings, and there is no dark pattern anywhere in the funnel.
- **Craft floor:** zero horizontal overflow and zero console errors at both widths in both themes, one
  `h1` per screen, no duplicate ids, no missing `alt`, a visible 3 px volt focus ring with offset, and a
  ceremony dialog with a real focus trap, Escape, scroll lock and focus restore.
