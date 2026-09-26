# HISAAB DO — gamification advisor loop 1

Reviewer: gamification lane (skill `gamification-advisor`, read with `hisaab-design` and `juice`).
Date: 26 Sep 2026. Build reviewed: the working tree at about 03:15 IST, frozen into a scratch build
(`HISAAB_OUT=… pnpm build:hisaab`) so that other agents' edits could not reload the page mid-walk.
Inputs: CHARTER §1, §2, §4a/§4b, §6, §7 · design-bible §2–§12 · ENGINE.md · `editions/hisaab/app/README.md`
· the code under `editions/hisaab/app/` · screenshots.

**Evidence**
- `node scripts/hisaab-screens.mjs` over the frozen build covered 360×740, 390×844, 414×896 and 1440×900
  in light and dark, plus Hindi at 390. That is 9 cells × 36 screens. Result: 0 failures, 0 console
  errors and 0 failed requests. The live-round quiet audit (no toast, ceremony, nav or canvas while the
  clock runs) passed in every cell. All 11 end-to-end flows passed: three bot formats with Rematch,
  Pass & Play, P2P host and guest, every Home link, Settings, certificate PNG, the report link and the
  3D lab.
  - A first walk against a live dev server failed 22 checks in one cell. Parallel agents' edits caused
    Vite full reloads during that walk. On the frozen build the same cell had 0 failures.
- `pnpm exec tsc --noEmit`: 0 errors. `node --test tests/hisaab-*.test.mjs`: 40 of 40 pass.
- The PNGs I read are in
  `/tmp/claude-0/-home-user-fact-duel/4f9f5da0-78f8-567b-872f-cf9ad0f26ac3/scratchpad/ui/advisor/`
  (`walk/`, `walk2-*`, `walk3-hi-flows/`).
- Simulations run in node against `lib/progression.mjs`:
  - 30 daily app opens with no answers give 2,360 XP, level 5 and band 1, which is a label promotion.
  - A route answered 0 of 6 pays 208 XP.
  - Wrong answers on new cards pay about two thirds of right ones.

---

## Summary verdict: **FIX-FIRST**

The quiet live surface, the notification budget, the receipts and the refusals are in very good
shape. No timing-contract, presence, currency or share-honesty gate fails. One honesty gate does fail:
N6, on the Rules page. P1 items also break the promise that the label ladder is "receipt by receipt".
Both need fixing before launch.

**The three biggest wins**
1. **Make Rules & Sources the complete, true rulebook (P0, N6).** Three problems:
   - It says "A day counts when you play", but the engine credits the streak for opening the app.
   - It omits three XP sources that every receipt or match shows: New receipt +10, First attempt +5,
     and Stamp Register +50/+120/+300.
   - It says a Surprise Audit is "announced on the receipt before the round", but round 1 can be an
     audit with no receipt before it.
2. **Earn labels by receipts, not by opening the app (P1).** The `visit` event credits streak days,
   their XP and the streak Stamp Register entries. Thirty app opens with zero answers promote a player
   to *WhatsApp University Fresher*, with a ceremony and a certificate. That undoes the charter's core
   joke.
3. **Close the dead ends and keep the status line on every recap (P1).**
   - The `save-2` quest cannot be completed: the edition has no save action.
   - The `open-2` quest ("Read 2 notings") links to Aaj, where reading a noting does not count.
   - The match result's "Round receipts" and the Vault list show case stems without the legal status
     line.

---

## Scores (1–5; "–" = not applicable)

| Screen | Hook | Feedback | Progress | Autonomy | Honesty | Craft | Mobile | A11y | Perf | Timing |
|---|---|---|---|---|---|---|---|---|---|---|
| First run `#/start` | 5 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 4 | – |
| Home `#/` | 3 | 4 | 5 | 5 | 3 | 4 | 5 | 4 | 4 | – |
| Files hub, Rajya, Sector, Kiska Media?, Forward Court | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 5 | 5 | – |
| Money trail hub, 3 modes, Saal-dar-Saal | 3 | 4 | 3 | 5 | 5 | 5 | 5 | 5 | 5 | – |
| Untimed card (route, Aaj, taster) + its receipt | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| Route finish | 5 | 4 | 4 | 5 | 4 | 4 | 5 | 5 | 3 | – |
| Aaj Ka Hisaab finish | 5 | 4 | 3 | 5 | 4 | 5 | 5 | 5 | 3 | – |
| Taster `#/q/:id` | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 5 |
| Duel setup (Muqabla) | 5 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | – |
| P2P lobby | 4 | 4 | – | 5 | 5 | 4 | 5 | 5 | 5 | – |
| LIVE question | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 4 | 5 |
| Round receipt | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 5 |
| Match result | 5 | 5 | 5 | 5 | 3 | 5 | 5 | 5 | 3 | – |
| Pass & Play* | 4 | 4 | – | 5 | 5 | 4 | 5 | 5 | 4 | 5 |
| Profile (Me) + certificate | 4 | 4 | 5 | 5 | 3 | 5 | 5 | 5 | 5 | – |
| Receipts Vault + Dobara Jaanch | 4 | 4 | 4 | 5 | 3 | 4 | 5 | 5 | 4 | 5 |
| Settings | 4 | 4 | – | 3 | 3 | 5 | 5 | 5 | 5 | – |
| Rules & Sources / Corrections | 4 | – | – | 5 | **1 (N6)** | 4 | 5 | 5 | 5 | – |

\* Pass & Play is scored from the code, the setup screenshots and the passing end-to-end flow. The
walker takes no mid-game PNGs.

**Where the scores come from**
- *Home Hook 3:* once today's file is done and nothing is left to resume, the screen's only violet
  button ("Duel Babu-Bot") sits at the bottom of a page about 2,800 px tall on a phone. It is not
  visible in the first viewport.
- *Money trail 3:* three of the four modes show "Being typed · 0 cards so far". The lanes exist but are
  not registered yet.
- *Perf 3 on the finishes:* capable devices auto-load the 1.09 MB (gzip) 3D chunk on a route finish, an
  Aaj finish and a match result.
- *Honesty 3:* each is explained in the fix list below.

### Gate audit N1–N14 (skill; bible §8.5)

| Gate | Status | Evidence |
|---|---|---|
| N1 fabricated near-miss | pass | `room/lib.ts` `roundLine` and `marginLine` return a line only for `screen-time`, from the receipts' `elapsedMs`. TARAZU settles to the true score. |
| N2 fake countdown / scarcity | pass | "New file at midnight, your time." is static. No limited-time labels. |
| N3 streak repair for money/ads, alarmist nags | pass | CL is automatic. Copy only reassures ("Missed a day. 1 CL used. Streak safe."). No streak-risk copy anywhere (grep). |
| N4 ads | pass | The edition has no ads. |
| N5 confirmshaming | pass | Decline and leave buttons are neutral ("Stay" / "Leave", "Keep going"). |
| **N6 hidden rules** | **FAIL → P0-1** | The Rules page misstates the streak and Surprise Audit rules and omits three XP sources (bible §8.5 N6 row: "every XP number is on the Rules page"). |
| N7 hidden bot fills | pass | `seatName()` always gives "Babu-Bot · BOT". "Picks at random. Can't see the question." shows on setup, countdown, receipt and result. |
| N8 auto-queued next duel, overlay chains | pass | Rematch and Next are taps, and the P2P rematch needs a tap on both phones (`friend.tsx` `rematch()`). |
| N9 fake presence | pass | No counts. The lobby shows the real transport, hello and seat state only. |
| N10 hidden cost / second currency | pass | The tijori says "1 coin = 1 sourced receipt. Not money." No wallet, gems or shop is surfaced (grep). |
| N11 child-directed exhortation | pass | See P2-4 on the `night-owl` register entry. |
| N12 rigging / mercy | pass | The bot is uniform-random, disclosed on the Rules page, with "no hidden difficulty setting". |
| N13 pre-selected opt-ins | pass | The name is empty ("Anonymous Janta" is a placeholder). Nothing is pre-ticked. |
| N14 forced account | pass | First run → today's file with no name. The taster works without an account. |
| Vocabulary (bet, wager, odds, jackpot, casino) | pass | Only in code comments ("never a bet"). |

**Edition-specific refusals (§8.5).**
- There are no party leaderboards, no pick-your-side onboarding and no outrage-ranked feeds. The
  Forward Court docket is in bank order.
- There is no "dunk" share copy.
- No label is applied to a real person: `certificateName()` guards certificates and share cards, and
  duel seats carry no labels.
- No party emoji or symbols appear (grep for the bible's list).
- Every share carries the status line in both variants (`share/index.ts` `receiptShareText`).
- One item is flagged for the editorial lane (P2-12).

### Notification budget audit (bible §9)

| Screen | Verdict |
|---|---|
| First run | Silent until the first tap ✓ |
| Home | The one toast is only the watcher's CL notice **or** the quests summary ✓. The label ceremony opens only for a `pending:label` ✓. No "come back" copy ✓. |
| Files hubs | Silent ✓ |
| Route card, Aaj card, taster | `useHoldToasts` while a card is up ✓. Tape, stamp and print happen only after the lock ✓. |
| Route finish | `file` ceremony only on the first clear, only for state, sector, media or forward files (`CEREMONY_KINDS`) ✓. Replays and money/year files update in place ✓. It celebrates 0 of 6 with confetti (P2-3). |
| Aaj finish | `label` only ✓. No countdown ✓. |
| Duel setup, lobby | Silent ✓ |
| LIVE | Quiet from the countdown to `round.result` ✓ (walker-asserted in 9 cells). Only `select` sound and a light haptic ✓. |
| Round receipt | The arena holds toasts for the whole match ✓ |
| Match result | Toasts held 1.2 s after it renders, then the watcher ✓. Babu rank updates in place ✓. |
| Profile, Vault, Settings, Rules | Silent ✓. Dobara holds toasts ✓. |
| Settings › Quiet everything | ✗ The toasts-off half is not persisted, so the switch silently reverts on reload (P1-4). |
| Never | No Push, Notification, badge or service-worker API in the edition (grep) ✓ |

---

## Prioritised fix list

Each item gives what, where (file and owning lane per `app/README.md`), why (rule) and how.

### P0 — blocks ship

**P0-1. The Rules page misstates two rules and omits three XP sources (gate N6).**
Where: `editions/hisaab/app/screens/rules/index.tsx` lines 366, 391 and 394–397 (me lane).

Why: bible §8.5 turns N6 into a concrete rule: "every XP number is on the Rules page; rule changes are
logged in Corrections". The skill makes N-gates blocking. Three problems:
- *Streak.* Line 391 says "A day counts when you play". In fact `lib/progression.mjs:1366` says
  "any event credits today", and `app/use-player.ts:232–245` dispatches `{ type: 'visit' }` on load and
  on focus. Opening the app is a streak day, worth 10 XP × the day, up to 70.
- *Missing XP.* Every receipt prints "New receipt +10" (`XP.fact`) and "First attempt +5"
  (`XP.recall`). Every match breakdown prints "Stamp Register: … +50 / +120 / +300" (the `ACHIEVEMENTS`
  `xp` tiers). None of the three is on the page.
- *Surprise Audit.* Line 366 says it "is announced on the receipt before the round". Round 1 of every
  match (and Quick Draw's only round) can be an audit with no receipt before it: the 390-dark walk shows
  "Round 1 · receipt … Surprise Audit ×2".

How:
- In the Streaks list, add `<li>` lines for `xpNum('fact')` ("each new receipt"), `xpNum('recall')`
  ("first attempt at a card") and the register tiers. The tiers can come from
  `[...new Set(ACHIEVEMENTS.map(a => a.xp))]` (`ACHIEVEMENTS` is exported by `lib/progression.mjs`).
- Replace line 391 with the true rule. Until P1-1 lands, that is "A day counts when you open HISAAB DO".
  After P1-1, it is "…when you answer a question".
- Replace the audit sentence with "Round 1's audit, if any, shows on its own receipt; every later
  round's audit is announced on the receipt before it. Never on the question."
- Log the change in `screens/rules/corrections.ts` with today's date, as N6 requires.

### P1 — before advisor loop 2 and before launch

**P1-1. Opening the app earns streak days, streak XP and streak Stamp Register entries, so labels rise
without receipts.**
Where: `lib/progression.mjs:1366–1386` (streak credit on any event) and `app/use-player.ts:232–245`
(`visit` on load and focus). Both are shared, so this goes to the engine lane / lead as a request.

Why:
- Charter §1 says "receipt by receipt, you earn your way". Bible §8.2 says "labels are identity, not
  points".
- Simulated: 30 daily opens with zero answers give 2,360 XP and band 1. The player gets the *label*
  ceremony and a certificate reading "after 0 sourced receipts". `streak-3/7/30` pay 50/120/300 for
  presence.
- This is the Hooked "open the app" pattern the bible rejects in §8.3: loss aversion is meant to cushion
  real play, not to reward presence.

How: add a default-preserving option (JHK keeps its behaviour), for example
`reduceProgression(prog, events, at, { streakFrom: (e) => e.kind !== 'visit' })`, or a module setting
`setProgressionOptions({ visitCreditsStreak: false })` called from `editions/hisaab/main.tsx`. `visit`
should still roll the daily quests. Then set Rules line 391 to "a day counts when you answer a
question". Add a test in `tests/hisaab-edition.test.mjs`: 30 visit-only days leave `streak.current === 0`
and `xp === 0`.

**P1-2. Two of the 18 quest templates dead-end on Home.**
Where: `editions/hisaab/app/screens/home/home-data.ts` lines 147–148 and 168–169 (home lane), and
`screens/receipts/detail.tsx` (me lane).

Why: "Aaj ke 3 kaam" promises XP (Progress, Honesty).
- `save-2` ("Keep 2 receipts in your Vault", 1 of the 6 easy templates, so about 1 day in 6) can never
  complete. No screen calls `player.save()`, and `screens/me/lib.ts:148` already hides `vault-25` as
  unreachable for the same reason.
- `open-2` ("Read 2 notings") links to `#/aaj`. The `open` event is dispatched only by
  `receipts/index.tsx:133` (opening a receipt in the Vault), so reading notings in Aaj never moves it.

How:
- `open-2`: set the words to "Open 2 receipts in the Vault" / "वॉल्ट में 2 रसीदें खोलो" and the link to
  `href.receipts()`.
- `save-2`: add a "Keep a copy" paper button to the receipt detail sheet. It calls
  `player.save(item.question)` (ENGINE §10; `app/use-player.ts:319`) and confirms inline ("Kept ✓").
  That also makes `vault-25` reachable, so remove it from `HIDDEN_HERE`. Alternatively, the engine lane
  replaces `save-2` for the edition with a same-tier template so the daily seed sequence is unchanged.

**P1-3. Recap surfaces show case stems without the legal status line.**
Where: `editions/hisaab/app/screens/room/result.tsx:346–392` (round receipt minis; duel lane) and
`screens/receipts/index.tsx:84–88` (Vault rows; me lane).

Why: charter §2.2 and the computed brief say legal status lines render verbatim with their as-of date.
- The match result's minis are titled "Round receipts". They show the stem and answer (for example the
  ED/PMLA item) but no STATUS row.
- The Vault row shows only a chip reading "Legal status · as of Sep 2026", with no words, under stems
  such as "…was arrested by Uttar Pradesh Police…".

How:
- In `result.tsx`, resolve `const item = itemById(r.question.factId)` and, when `statusLine(item)` is
  not null, render `<LegalStatus status={statusLine(item)!} asOf={item.asOf} />` under the answer.
- In `receipts/index.tsx`, render `row.status` verbatim (`<span className="h-vrow__status" lang="en">`)
  beside the chip. Let it wrap. Do not clamp with `overflow: hidden` (bible §4.4).

**P1-4. "Quiet everything" silently reverts on reload.**
Where: `editions/hisaab/app/screens/settings/prefs.ts:9–12, 48` (me lane) and `app/budget.ts`
`setToastsOff` plus `lib/storage-names.mjs` (foundation request).

Why: bible §9 rule 6 and SDT autonomy.
- The toasts-off half is held in memory only. After a reload `isQuiet()` is false, the master switch
  reads OFF, and toasts return.
- Only the secondary "Pop-up notes" switch says "Comes back on when you reopen the app". The master
  switch says nothing.

How: the foundation adds `toasts` to `storageNames()` (never a literal key, ENGINE §13), and
`createHisaabBudget` reads it at start. `setToastsOff` writes it. Then drop the "Comes back on…" line.

**P1-5. Home advertises three money-trail modes that cannot be played yet.**
Where: `editions/hisaab/bank/index.mjs` (lead) and `screens/home/file-entries.tsx` (home lane).

Why: Hook. On Home and on the Paisa tab, *Seedha Khaate Mein*, *Rahat Kosh* and *Chunav Se Pehle* read
"No files yet" or "Being typed · 0 cards so far". The lanes exist (`dist-*.mjs`, `relief-*.mjs`,
`poll-*.mjs`) but are not registered. The copy is honest. This is expected mid-build, so it is a
launch gate rather than a code bug.

How: register the lanes once `hisaab-validate` passes. Until then, show an entry only when
`files > 0`, or collapse the three into one "Coming: the money trail" line.

### P2 — backlog

**P2-1. Home hook once today's file is done (Hook).**
Where: `screens/home/index.tsx:185, 244`.

When `primary === 'duel'`, the only violet button is the last block on a phone page about 2,800 px
tall. Render a compact "Next: Duel Babu-Bot →" primary inside `TodayCard`'s done state, and make the
strip's button paper. Or move `DuelStrip` above the tijori when it holds the primary.

**P2-2. Competence signal is weak on the identity ladder (SDT competence).**
Where: `lib/progression.mjs` `XP`, and the Profile and Home label blocks.

A wrong answer on a new card pays 3 + 10 + 5 = 18 XP against 27 for a right one, and a 0/6 file pays
208 XP. Speed XP pays under 2 s (+15), and "Speed demon" pays under 1.5 s. Stems here run 20–35 words,
so sub-2 s answers are mostly guesses. The pattern rewards volume and guessing over reading.
- Show accuracy beside the label ("64% right across 214 receipts") on Profile and Home.
- Consider an edition alias that pays `XP.fact` only on a right answer or on opening the source.
- Consider hiding `speed-demon` in the edition's register (`screens/me/lib.ts` `HIDDEN_HERE`, and ask
  the engine lane to stop awarding it here).

**P2-3. The first-clear file ceremony celebrates 0 of 6 with confetti (feedback honesty).**
Where: `screens/route/finish.tsx:91–101`, `ui/ceremony.tsx:30`.

"FILE CLEARED · −3/24" with confetti reads as a trophy for finishing. Keep the ceremony. Add the true
tally to the subtitle ("0 of 6 right · Feeta khul gaya."), and pass a `quiet` flag to skip
`juice.confetti` when `score <= 0`. That needs a foundation prop on `budget.ceremony`.

**P2-4. The `night-owl` register entry rewards play between 23:00 and 04:00 (wellbeing; audience includes
teens).**
Where: `screens/me/lib.ts:148`, plus an engine-lane request.

The 1440 walk paid "Stamp Register: Night owl +50". Add `'night-owl'` to `HIDDEN_HERE`, and ask the
engine lane to skip awarding it in the edition. (`early-bird`, for 05:00–08:00, is harmless and can
stay.)

**P2-5. Activity and XP lines use JHK achievement names.**
Where: `shell/progression-watch.tsx:87–90`, `data.ts:412–413` (foundation).

Activity says "Stamp Register: Every stamp" or "Clean sweep" while the Register says "Nine files" or
"Clean file". Move `EDITION_WORDS` from `screens/me/lib.ts` into `data.ts` as `achievementWords(id)`,
and use it in both places.

**P2-6. Certificate dates and counts on older rungs.**
Where: `screens/me/certificate-view.tsx:49`, `screens/me/profile.tsx:80`.

`issuedOn = dates.get(band) ?? Date.now()` prints today as "ISSUED" when the promotion fell out of the
40-line log. An older rung's certificate says "after {today's count} sourced receipts, been labelled
ANDHBHAKT". When the date is unknown, print "PRINTED 26 SEP 2026" instead of "ISSUED". For
`band < current`, say "{n} receipts to date".

**P2-7. Every set-piece finish downloads 1.09 MB gzip of 3D (Perf).**
Where: `three/runtime.ts:31–39` (three lane).

Capable phones fetch `kit-*.js` (3.16 MB raw) on the first route finish, Aaj finish or match result.
Add `navigator.connection.effectiveType` of `'2g'`, `'slow-2g'` or `'3g'` to `sceneCapability()`
returning `{ ok: false, reason: 'slow-network' }`. On mobile data in India that is most sessions. The
2D art already carries the true numbers.

**P2-8. The live surface re-renders every 150 ms (Perf, on the timing-critical path).**
Where: `engine/duel-controller.mjs:142` (`else changed()` in `tick`) and `app/use-duel.ts` (foundation).

The whole Arena → LiveQuestion → OptionList tree re-renders about 7 times a second during the round,
although the timer bar reads the controller from rAF. In `useDuel`, skip `setSnapshot` when only
`remainingMs` or `countdownMs` changed and the view is `live`. Also wrap `Option` in `React.memo`.

**P2-9. Screen readers get no score in the round header (A11y).**
Where: `screens/room/live.tsx:51–66`.

`aria-label` sits on a `<p>` whose children are `aria-hidden`. A generic role takes no name, so screen
readers hear nothing. Replace it with a visible-hidden `<span className="h-sr">Score: you 1, Babu-Bot
0</span>`. Same pattern at `screens/home/index.tsx:497` (quest count).

**P2-10. "Same for everyone today" uses the local date (honesty, minor).**
Where: `engine/daily.mjs` (engine), copy in `home/index.tsx:341` and `aaj/index.tsx:365`.

The bible says "New file at 00:00 IST", but `todaysFive()` keys on the local day, so the diaspora gets
a different five. Either seed on the IST date, or change the copy to "same for everyone on the same
date", which is the Rules wording.

**P2-11. A share can claim "text copied" when the copy failed.**
Where: `share/index.ts:163–166`.

`shareImage` returns `{ ok: true, method: 'download' }` even when `copyText` failed, so the button says
"Image saved · text copied ✓". Return `method: 'download'` with a `copied: boolean`, and word it "Image
saved ✓" when the copy failed.

**P2-12. Editorial flag (editorial lane; bank is not ours to edit): `hel048` (Surat 2024).**
Where: `editions/hisaab/bank/elections.mjs`.

One distractor is "He had a criminal conviction", about an identifiable real nominee. It is not a
person-as-answer, but it floats a criminal record next to a real candidate on the live card. Swap it
for a neutral ground ("His deposit was not paid").

**P2-13. The Forward Court docket shows unrebutted claims (screenshot risk).**
Where: `screens/files/forwards.tsx` (files lane).

Sealed rows print the viral claim verbatim with no ruling. Add a neutral "Ruling sealed — answer to
open" chip on each sealed row so a cropped screenshot never reads as the app asserting the claim.

**P2-14. The Aaj finish shows the label without its goal gradient (Progress).**
Where: `screens/aaj/index.tsx:313–325`.

Add the `<Meter … copy={goalCopy(xp)} />` that the taster's `LabelReveal` already uses.

**P2-15. Quest rows could deep-link (Hook).**
Where: `screens/home/home-data.ts:174–175`.

`topic-play` and `mode-play` link to a bare `#/duel`. Pass
`href.duel({ vs: 'bot', topic: q.topic })` and `href.duel({ vs: 'bot', mode: q.mode })`.

**P2-16. The Hindi locale keeps the label one-liners in English.**
Where: `data.ts` `LADDER_DISPLAY` (foundation).

In Hindi, Home's label block reads "Forwards first. Reads never.". Add a Devanagari `lineHi` for the
Hindi locale (the Hindi reviewer writes the strings) and use it where `isHi`.

---

## What is genuinely good (keep it)

- **The live surface is textbook quiet.**
  - The card mounts `visibility:hidden` and flips `data-shown` in the same rAF frame as `markShown()`
    (`live.tsx:176–193`).
  - Options stay in dealt order, with no key in the projection before the result.
  - The 6px ink bar is driven from rAF with `transition: none`.
  - Screen readers hear the time only at 5 s and 2 s.
  - Taps are disabled until shown, and keys stand down behind modals.
  - The walker asserts quiet in every cell.
- **The notification budget is a real mechanism, not a promise.** `app/budget.ts` enforces one toast
  per visit with merge-then-log, two ceremony kinds merged into one with two stamps, a live quiet flag
  that SceneHost obeys, and holds for untimed cards and Dobara. The watcher chooses the CL notice *or*
  the quests toast, never both.
- **Honest margins and verdicts.** `roundLine` and `marginLine` speak only when the receipts support
  them. TARAZU is clamped to the true difference. The bot's randomness and timing window are on the
  Rules page, and "scheduled · picks at random" sits on every bot seat line.
- **The receipt as the variable reward.** Stamp → answer → your call and points → receipt (#, XP
  breakdown, source, neutral legal block with as-of, govt chip) → noting. Every answer closes with
  evidence, and nothing funny appears inside the receipt.
- **Confidence calls done right.** Shayad is the safe default, the points are visible, XP is identical
  at every tier, and the finish gives a calibration line ("Pakka calls: 0 of 1 landed. Shayad kept you
  safe on 5.").
- **Endowed progress and goal gradient.** "Tape cut. 1 of 6.", the first receipt reveals *Andhbhakt*
  inline (not a ceremony), and band meters use tightening copy ("2 levels to …").
- **Share honesty is enforced in one place.** `share/index.ts` gives both variants the status line and
  as-of, the challenge variant has no answer, the footer reads "Satire. Every question sourced.",
  `certificateName()` blocks certifying anyone in the bank, and outcomes appear inline on the button.
- **Duel setup honesty.** Real pool counts on every sector chip ("Numbers are the questions in each
  file"), the tie rule stated, and "Babu rank · on this device".
- **The Forward Court's generic bubble.** No messenger green, and the docket is in bank order, not
  outrage order.
- **Mobile craft.** 0 overflow, tap-target, text-size or input-size failures across 360/390/414/1440 ×
  light and dark plus Hindi. Sticky primary bars sit above the nav, and the rail appears at ≥ 900.
