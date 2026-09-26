# HISAAB DO: design fidelity review (LAL FEETA)

Reviewer: design lens. Date: 26 Sep 2026. Build: the working tree on top of `4878295` (uncommitted lane work included).
Measured against `docs/hisaab/design-bible.md` §2–§12, the `hisaab-design` skill card, the `juice` rules and
`CHARTER.md` §2, §6 and §7. Nothing in the app was edited.

**Verdict: fix first.** I found no P0: no legal or honesty gate fails, no flow is broken, the timing contract
holds and nothing crashed. There are **7 P1s**. Two of them are honesty or tone problems: the match-result round
receipts leave out the legal status, and the label chip shows "ANDHBHAKT" before the player has seen the reveal.
Three are gaps against a screen spec (Vault primary, Forward Court bubble, font budget), and two are Hindi-locale
Devanagari rules. There are also **15 P2s**. The identity is plainly LAL FEETA, and none of the rejected looks
has come back.

## How this was checked

- **Screenshots.** I read the integrator's set (`scratchpad/ui/integrate/final/**`) and made my own, 360 of them, by running the
  integrator walker against my dev server on :5196: 360×740, 390×844, 414×896 and 1440×900, light and dark, plus
  Hindi at 390 in both themes, and the 11 end-to-end flows. They are in
  `scratchpad/ui/design-review/walk/<cell>/NN-step.png`. The phone gate is green on this build too: 0 overflow, target, text
  or input failures, 0 console errors and 11 of 11 flows passing.
- **Design audit.** I ran my own audit in every one of those 360 steps (`scratchpad/ui/design-review/design-audit.js`,
  grafted onto a copy of the walker). It counts poster lines and Kalam lines per screen. It checks Devanagari for
  letter-spacing, `lang`, the mono face, tight line-height and clipping. It also flags words set in `--h-ink-3`,
  blur shadows outside overlays, stamp sizes (≥ 20px, ≥ 24px on manila), whether legal blocks use the neutral token,
  the banned party emoji, text in a face outside the four families, lowercase Latin display text, sentences under
  14px, page-wide texture, toast count, canvas count and which font files load.
  The results are in `walk/report.json` under `steps[].design`.
- **Targeted probe.** A second script (`scratchpad/ui/design-review/probe.mjs`, notes in `probe/notes.json`) covers what
  the walker does not reach: the first-run top bar at 700 and 1440, the Forward Court and Kiska Media play cards at
  390 and 1440, Effects = Off at the match result, and the Aaj finish after THAPPA has left. A third script
  (`canvas.mjs`) identifies every mounted canvas.
- **Static checks.** `pnpm exec tsc --noEmit` shows 0 errors and `node --test tests/hisaab-*.test.mjs` passes 40 of 40.
  I grepped for raw hex, `fd-`, `!important`, bare `vh` and Tailwind utilities, went through the lucide icon set
  against the §2.4 banned list, and grepped the copy for dark-pattern words.

## Findings

### P0: none

I checked every gate in the brief:
- **Live question.** The card mounts `visibility:hidden` until `data-shown` (`room/live.css:138`). The timer is
  written from rAF with `transition: none`. Option order is fixed, and there is no key in the projection before the result.
- **Quiet during the round.** The walker's quiet check passes in all 10 cells (no toast, ceremony, nav or scene canvas).
- **Canvases.** Effects = Off leaves only the idle fx particle canvas, which is 2D and has no rAF when idle. With
  Effects = Full the match result has exactly one scene canvas (TARAZU).
- **Legal status.** Every status renders verbatim in the neutral `--h-legal` block with its as-of date. The audit
  found 0 non-neutral legal blocks.
- **Shares.** Share texts and PNGs carry the status line and "Satire. Every question sourced.". The certificate reads
  "Satire. Not a government document." and its name goes through `certificateName`.
- **Bot and art.** Babu-Bot · BOT is labelled on setup, lobby, round header, receipts and result. The audit found no
  party emoji or symbols, and neither the favicon nor the manifest carries an emblem, party colour or map.

### P1: must fix before launch

**P1-1. The match-result round receipts drop the legal status.**
- **File:** `editions/hisaab/app/screens/room/result.tsx` (the `h-result__mini` list, around lines 346–392).
- **What happens:** Each mini shows the stem, a ✓ answer, both seat lines and the source link, but never the STATUS
  row. The audit counts `legal=0` on `duel-result` in all 10 cells, against `legal=1` on `duel-receipt`.
- **Why it matters:** It is the only list of receipts in the app that leaves the status out. The route finish and Aaj
  finish carousels (`route/receipt-strip.tsx`) both carry it. Duel items include arrests and chargesheets (Siddique
  Kappan, the PNB fraud), and the result screen is the one players screenshot. Bible §0.6 says every answer closes
  with a receipt that includes the status, and §8.5 refuses any card that drops the status line.
- **Fix:**
  - Import `itemById` and `statusLine` from `../../data` and `LegalStatus` from `../../ui/chip`.
  - After `h-result__answer`, render
    `{(() => { const it = itemById(r.question.factId); return it && statusLine(it) ? <LegalStatus status={it.status!} asOf={it.asOf} /> : null; })()}`.
    This is the same pattern `route/receipt-strip.tsx:97` uses.

**P1-2. The top-bar label chip names a brand-new visitor "ANDHBHAKT" before the reveal.**
- **File:** `editions/hisaab/app/shell/top-bar.tsx:34-44` (foundation).
- **What happens:** At 600px and wider, the chip prints `labelDisplay(band)` from the first paint. The probe shows
  "LV 1 · Andhbhakt" on `#/start` and on a fresh `#/q/:id` taster at both 700 and 1440 (`probe/first-run-top-1440.png`).
- **Why it matters:** Bible §11.1 makes the label reveal an inline card after the first receipt. §4.5 says "a label
  always appears with its one-liner", and the first sighting must add "Everyone starts here — of anyone, for
  anything." A bare slur-shaped tag on the WhatsApp landing, with no context, is the tone risk the charter guards against.
- **Fix:** Render `h-levelchip__label` only when the player has filed at least one receipt:
  `const seen = !isFreshProfile(player.profile)`, reusing the check from `screens/start/first-run.ts`, or
  `countReceipts(player.journal) > 0`. Until then show "LV 1" alone and put the label in the aria text only after the
  reveal. Also hide the label whenever `route.name` is `start` or `taster` and no receipt exists yet.

**P1-3. The Vault's violet primary points at the wrong "due".**
- **File:** `editions/hisaab/app/screens/receipts/index.tsx:115, 183-221` (me lane).
- **What happens:**
  - `due` counts rows whose status `asOf` is more than six months old. On this data that is always 0, so the primary
    falls back to "Open today's file" even when Aaj is already filed.
  - Meanwhile the real recall queue, "Dobara Jaanch · 12 cards", sits as a paper secondary (`walk/*/22-receipts.png`).
  - The same screen then uses "due for re-check" for two different things: status staleness and the recall queue.
- **Why it matters:** Bible §11.15 and §9 say the primary is "Re-check N due", and that Dobara Jaanch runs the due items.
- **Fix:**
  - Make the primary `Re-check ${queue.length} due` → `setDobara([...queue])` when `queue.length > 0`, else
    "Open today's file". When today's file is done, use "Duel Babu-Bot", as Home does.
  - Rename the status-staleness line and chip to "Status older than 6 months" (a neutral note, not a call to action).
    Keep its filter, but drop the word "due" from it.

**P1-4. The Forward Court play card has no forwarded-message bubble.**
- **File:** `editions/hisaab/app/screens/route/card.tsx` (route lane), the question card.
- **What happens:** The claim is set as a plain stem (`probe/forward-court-card-{390,1440}.png`). The bubble exists
  only in the Files docket (`files/forwards.tsx:103`).
- **Why it matters:** Bible §11.6 says "The claim sits in a generic paper chat bubble tagged '↪ Forwarded many
  times' … 1440: bubble left, options right." The bubble is what separates the forward's voice from ours. Without it,
  "BJP is giving every Indian a free 3-month mobile recharge" reads as a stem we wrote.
- **Fix:**
  - When `route.kind === 'forward'` (or `item.kind === 'forward'`), wrap the stem in the same paper bubble markup
    `forwards.tsx` uses: `CornerUpRight` icon + italic "Forwarded many times" + claim.
  - Lift that markup into a small shared piece inside `screens/route/`. Don't import from `screens/files`, which
    would break the CSS block-ownership rule; copy the classes under an `h-play`-scoped name.
  - At ≥ 900 the grid already puts the card on the left.

**P1-5. The English session downloads Mukta's Devanagari file on the first screen (~100 KB).**
- **Files:** `editions/hisaab/app/screens/start/start.css` `.h-start__langbtn` (home lane) and
  `editions/hisaab/app/screens/settings/settings.css` `.h-choice__label` (me lane).
- **What happens:** The walker logs `mukta-devanagari-600-normal.woff2` on `start` in every English cell. The only
  Devanagari set in Mukta in English is "हिं" on the EN/हिं toggle, and "हिन्दी" in Settings (`deva-mukta.mjs`).
- **Why it matters:** Bible §2.3 and §4.2 say "the English locale never loads Mukta's Devanagari file". The budget is
  ≈ 143 KB, and this adds about 70% on the first-run screen.
- **Fix:** Set these labels in the display face, whose Devanagari subset is already loaded for poster lines:
  - `start.css`: `.h-start__langbtn:lang(hi), .h-start__langbtn [lang='hi'] { font-family: var(--h-font-display); font-weight: var(--h-wght-display-2); }`
  - `settings.css`: `.h-choice__label:lang(hi) { font-family: var(--h-font-display); }`
  - Make sure the element carries `lang="hi"`. Settings already passes `lang: 'hi'` (`settings/index.tsx:139`).
  - Re-run the walker and confirm no `mukta-devanagari-*` request appears in an English cell.

**P1-6. Devanagari is letter-spaced in four places in the Hindi locale.**
- **What happens:** The audit flags `deva-tracked` only in the `-hi` cells. Bible §4.4 rule 1 says never track
  Devanagari, because it breaks the shirorekha.
- **Fixes, one per file:**
  - `screens/start/start.css:181`: add `letter-spacing: 0;` to `.h-start__h2:lang(hi)`. It is 0.48px on "अकाउंट? ज़रूरत नहीं…".
  - `screens/files/rajya.css:85`: add `.h-rajya__centrename:lang(hi) { letter-spacing: 0; text-transform: none; }` for "केंद्र".
  - `screens/receipts/receipts.css:385`: add `:root[lang='hi'] .h-rdetail__k { letter-spacing: 0; text-transform: none; font-family: var(--h-font-ui); font-size: var(--h-fs-xs); }`.
    "जवाब" is tracked 1.68px here.
  - `screens/rules/rules.css:220`: the same override for `.h-rules__table th` ("लेबल" and "लेवल" at 1.68px).

**P1-7. Hindi locale: mono-styled Devanagari at 12px, falling back through the mono face.**
- **File:** `editions/hisaab/app/base.css:126` (foundation), plus these screens: `receipts/receipts.css`,
  `room/receipt.css` (`.h-pick__letter`) and `me/me.css`.
- **What happens:** The audit reports 75 `deva-mono` hits per Hindi cell. Kickers ("F.No. S/UP · क्लियर", "आप हो · लेवल 2"),
  legal as-of text ("Sep 2026 तक"), chips ("क़ानूनी स्थिति · Sep 2026 तक", "पहली बार क्लियर"), sheet titles ("नोटिंग")
  and pick letters (क / घ) are all declared in Sometype Mono at 12px/700. The glyphs fall back to Mukta at 12px
  bold, which is below the 14px sentence floor. The Vault's legal chip is part of the legal gate.
- **Why:** The `.h-kicker[lang='hi']` rule only matches when the kicker element itself carries `lang`, and it doesn't
  in the Hindi locale. Bible §4.4 rule 2 says no Devanagari in mono; §4.3 says 12px is for caps and mono labels only.
- **Fix:** In `base.css`, replace `.h-kicker[lang='hi']` with
  `:root[lang='hi'] :is(.h-kicker, .h-chip, .h-legal__asof, .h-sheet__title, .h-sheet__summary, .h-ceremony__kicker, .h-receipt__k, .h-pick__letter), .h-kicker:lang(hi) { font-family: var(--h-font-ui); font-size: var(--h-fs-xs); letter-spacing: 0; }`.
  Also add `lang="en"` to `F.No.` and Latin code fragments that should stay in mono.

### P2: backlog

**P2-1. Selected states use a solid violet fill that competes with the one primary.**
- **Files:** `ui/confidence-switch.css:50` (`.h-conf__opt--on`) and `screens/duel/setup.css:180` (`.h-topicchip--on`).
- **What happens:** On every route card, "Shayad" is a violet-filled block right above the answers, and on the duel
  setup "Mixed" is a violet-filled pill. The opponent cards and the Files segmented control already select with the tint.
- **Why it matters:** Bible §0.2 says one violet-filled control per screen.
- **Fix:** Use `background: var(--h-syahi-soft); color: var(--h-syahi-text); border-color: var(--h-syahi);` plus the
  existing ✓, keeping the solid fill for `h-btn--primary`.

**P2-2. Mini stamps are 16px, below the 20px floor.**
- **Where:** 438 hits in `ui/stamp.tsx` size `s`, used by the Vault rows, the route and Aaj share strips, and the result minis.
- **Contrast is fine:** measured on paper, pass is 5.22, fail 5.39, wait 5.37 and noted 8.19, and the dark theme is ≥ 5.66.
- **Fix:** Amend bible §5 `h-stamp`: "`s` = 16px for list minis, paper or receipt surfaces only, never manila." Or
  switch the minis to `size="m"`.

**P2-3. The receipt's OTHER SIDE row never renders.**
- **What happens:** `ui/receipt.tsx` shows the row only when an `otherSide` prop is passed, and no bank item has the
  field (`grep otherSide editions/hisaab/bank` finds 0). The counterpoint lives inside `explanation`, in the noting.
- **Fix:** Ask the editorial lane to add an optional `otherSide` (≤ 160 chars) to the charter §3 schema for items with
  `status` or `people`. Until then, `Receipt` should render `OTHER SIDE → "In the noting ↓"` when `item.status` is set,
  so the row order in bible §5 holds.

**P2-4. The Kiska Media ownership chain (`h-own`) is missing.**
- **What happens:** Bible §11.5 puts Owner → Holding → Outlet in the noting, and nothing renders it (`grep h-own` finds 0).
- **Fix:** This needs structured data. Ask the editorial lane for `ownership: [{ name, role }]` on `media` items, then
  add `screens/route/ownership.tsx` (text boxes + arrows, horizontal at ≥ 900).

**P2-5. Latin display text isn't uppercase in the Hindi locale.**
- **Where:** `screens/files/rajya.css:249` (`.h-rajya__brieftitle:lang(hi)`) and `screens/files/brief.css:51-52`.
- **What happens:** They remove `text-transform` for the whole element, so "Uttar Pradesh", "Kiska Media?" and
  "Forward Court" print in mixed case. Bible §4.3 says Latin display is always uppercase.
- **Fix:** Put `lang="en"` on the Latin title spans, as `ScreenHeader` does, and scope the override to `[lang='hi']` spans.

**P2-6. The first-label note stays in English in the Hindi locale.**
- **File:** `screens/me/ladder.tsx:84` uses `FIRST_LABEL_NOTE`.
- **Fix:** Use `isHi ? FIRST_LABEL_NOTE_HI : FIRST_LABEL_NOTE` and put `lang="hi"` on it. While there, localise
  "Levels 1–4" / "Level 40+" and the Activity lines.

**P2-7. The "You · Babu-Bot · BOT" line under the score pill is 12px mixed-case UI text.**
- **Where:** `room/live.css` `.h-roundhead__who`, which is also used on the receipt and result.
- **Why it matters:** It is the BOT disclosure in the round header.
- **Fix:** Either `font-size: var(--h-fs-xs)`, or keep 12px and make it a mono caps kicker (`text-transform: uppercase; letter-spacing: var(--h-track-kicker)`).

**P2-8. The result share text says "Beat Babu-Bot 2–1" without "· BOT".**
- **File:** `screens/room/result.tsx:171-178`.
- **Fix:** Use `BOT_NAME` from `data.ts`: "Beat Babu-Bot · BOT 2–1 on HISAAB DO."

**P2-9. Settings is a full page on both phone and desktop.** Bible §11.16 calls for a sheet on phone and a panel on
desktop. It works, and the sticky "Done" handles the flow. Either amend the bible or render `settings/index.tsx`
inside the `h-vsheet` pattern the Vault already uses.

**P2-10. The format radio cards have no print-down press.**
- **Where:** `screens/duel/friend.css` (`.h-friend__fmt`) and `screens/pass/pass.css` (`.h-pass__fmt`). The duel
  setup's `.h-pickcard:active` has one.
- **Fix:** Add `:active { transform: translate(var(--h-press-shift), var(--h-press-shift)); box-shadow: var(--h-shadow-0); }`.

**P2-11. The Kiska outlet chips are 12px mixed-case mono.** Bible §5 says chips are caps.
- **Where:** `screens/files/media.css` `.h-media__outlet`.
- **Fix:** Add `text-transform: uppercase`, or raise to `--h-fs-xs` if the case should stay.

**P2-12. File titles are 24px on phones.** Bible §5 `h-file` says 30px (`--h-fs-2xl`).
- **Where:** `ui/file-card.css`, `.h-file__title` is `--h-fs-xl` below 600px.
- **Fix:** It reads fine in the 2-column Home grid. Either amend bible §5 to "24px phone / 30px ≥ 600", or use 2xl
  on single-column lists.

**P2-13. Raw hex in a dev file.** `app/dev-shell.tsx:19` has `'1px solid #8886'`, so the skill's grep does not come
back clean. Replace it with `var(--h-hair)`.

**P2-14. The ceremony's 3D slot is 200px.** The spec is 240px (`ui/ceremony.css` `.h-ceremony__slot`,
`ceremony.tsx` `height={200}`). Set 240, or amend bible §5.

**P2-15. The daily reset copy differs from the bible.** Aaj says "New file at midnight, your time." while bible
§11.7 says "New file at 00:00 IST". The engine keys the day to local time (`engine/daily.mjs:21`), so the copy is the
honest one. Amend bible §11.7 instead of changing the copy.

## What is faithful (keep)

- **Identity:** the rejected looks have not come back.
  - The grey-green ground, flat paper and manila files with typed `F.No.` tabs are all there, with red tape on
    sealed files and tiles, rotated double-border stamps with a seeded tilt, and receipts with a zig-zag mask.
  - The green noting sheet has its red margin rule, and there are hard offset shadows everywhere except overlays
    (the audit found 0 blur shadows).
  - There is no page grain, serif, hairline grid or zero-radius layout. Only the four families render, and
    `fd-`, `!important` and bare `vh` are all absent.
- **Tokens:** no raw hex in any `.css` or `.tsx` except P2-13, and the legal block uses one neutral pair everywhere.
- **One primary:** exactly one visible `h-btn--primary` on every one of the 360 screens (ceremonies make the page behind them inert).
- **Live surface (§11.10):**
  - The header shows format, round and score pill (aria "Score: you 1, Babu-Bot · BOT 0").
  - The stem is at the top and the answers sit in the thumb zone.
  - The 6px ink timer sits directly above the answers, and the card shows "First tap locks." / "Locked · waiting for the clock".
  - At 1440 it is a centred 560px column with key hints.
  - There is no nav, stamp, tape or toast, and no Surprise Audit on the card.
- **Answer buttons:** letter + shape + tint, 60px, the full set of states. Wrong-chosen is hatched with an ✕ tab and
  correct-unchosen gets a dashed pass outline, so colour never works alone.
- **Receipts:** printed rows in bible order (RECEIPT # · XP with a plain-words breakdown, SOURCE chip + link ↗,
  STATUS with as-of, GOVT THEN as a neutral chip, then ENACTED BY and RESULT for money-trail items). Nothing funny is
  inside one: "Galat. Par receipt toh le lo." sits outside it.
- **Notification budget:** ceremonies appear only for a file's first clear and a label promotion. Level-ups, Stamp
  Register entries, rank and streak update in place (visible in Me › Activity). The audit never saw more than one
  toast on a screen, and the copy has no "come back", streak-risk, bet or jackpot language.
- **3D:** TARAZU mounts 250 ms after the verdict text and tips to the true score, with pans labelled
  "YOU / BABU-BOT · BOT" and the numbers printed. FILE PILE edges follow the true results (6 GALAT, −3/24).
  THAPPA leaves and its 2D stamp "FILED · 2/5" remains. There is one canvas at a time, and Effects = Off gives 2D only.
- **Growth and honesty:**
  - The certificate matches §11.14 line for line: typed header, "Anonymous Janta" fallback, ISSUED stamp, one
    Kalam note, rung dots, and the "Satire. Not a government document." footer.
  - The daily grid text uses ✅ ❌ only.
  - The P2P lobby shows only the real peer state ("Waiting…"), with a disclosure that the host's browser runs the match.
  - Pass & Play has a hand-over cover.
- **Layout:**
  - Rajya uses the 7×7 cartogram with the 4-wide Centre drawer, a glyph legend and a sticky brief at 1440.
  - Home at 1440 follows the 12-column plan (poster + label | today's file; tijori | files).
  - Match result, route card and round receipt are two-column at 1440.
  - Safe-area insets are on the top bar, bottom nav, play bar, launch bar and result bar.

## Screen-by-screen against §11

| § | screen | status | notes |
|---|---|---|---|
| 11.1 | First run | ✓ with P1-2 and P1-5 | poster on a halftone patch + static TIJORI (1440), typed lines, EN/हिं toggle, footer; label card after the first receipt ✓ |
| 11.2 | Home | ✓ | primary logic today → resume → duel ✓; the money trail replaces "resume + duel" in the 1440 grid, a sensible extension from charter §4a |
| 11.3 | Files hub + Rajya | ✓ | segmented control gains a "Paisa" tab (money trail); list view ✓; P2-5 in Hindi |
| 11.4 | Sector Files | ✓ | 13 stacked files with the next one pre-expanded; Media & Speech appears as the Kiska file, as charter §6 has it |
| 11.5 | Kiska Media? | partial | mono outlet chips ✓; ownership chain missing (P2-4); outlet chip case (P2-11) |
| 11.6 | Forward Court | partial | docket bubble ✓; play card bubble missing (P1-4) |
| 11.7 | Aaj + route card | ✓ | confidence switch with visible points, "No timer — take your time. First answer locks.", tape snaps after the lock, done grid, static reset line (P2-15); P2-1 |
| 11.8 | Duel setup | ✓ | radio cards, real format numbers, topic chips with counts, rank strip, 0.15 s rule line, sticky launch bar; P2-1 |
| 11.9 | P2P lobby | ✓ | mono room code, WhatsApp / Copy link / Share, honest seats |
| 11.10 | LIVE question | ✓ | timing contract and quiet surface verified; P2-7 |
| 11.11 | Round receipt | ✓ | the sequence, Surprise Audit chip off the card, "Read the noting" collapsed |
| 11.12 | Match result | ✓ with P1-1 | JEET/HAAR/BARABAR 48px, TARAZU, XP count in mono, rank delta in place, Rematch as a tap |
| 11.13 | Route finish | ✓ | FILE PILE + first-clear ceremony, calibration line, share carousel with status; "Next file: <neighbour>" + "Choose another" |
| 11.14 | Profile + certificate | ✓ | ladder as hero, current rung expanded with meter + certificate thumb, silent Stamp Register, Activity; P2-6 |
| 11.15 | Receipts Vault | partial | TIJORI header, filters, minis, sheet ✓; primary logic (P1-3) |
| 11.16 | Settings | ✓ with P2-9 | all controls, "We never send notifications.", Quiet everything, Delete → confirm |
| 11.17 | Rules & Corrections | ✓ | TOC, all ten sections, "Nobody named here is guilty unless convicted." in the neutral chip, corrections log |

## Requests to other lanes (I did not touch these)

- **Foundation (`shell/`, `ui/`, `base.css`):** P1-2, P1-7, P2-1 (confidence switch), P2-2 (stamp `s` or a bible
  amendment), P2-3 (the fallback OTHER SIDE row), P2-12, P2-13, P2-14.
- **Duel lane (`screens/room`, `screens/duel`, `screens/pass`):** P1-1, P2-1 (topic chip), P2-7, P2-8, P2-10.
- **Route lane (`screens/route`):** P1-4.
- **Home lane (`screens/start`):** P1-5 (toggle), P1-6 (`.h-start__h2`).
- **Files lane:** P1-6 (`.h-rajya__centrename`), P2-5, P2-11.
- **Me lane:** P1-3, P1-5 (Settings), P1-6 (`.h-rdetail__k`, `.h-rules__table th`), P2-6, P2-9.
- **Editorial / charter §3:** optional `otherSide` and `ownership` fields (P2-3, P2-4).
- **Design bible amendments:** §5 `h-stamp` `s` size (P2-2), §5 `h-file` phone title size (P2-12), §11.7 local-time reset (P2-15),
  §11.16 Settings as a page (P2-9, if accepted).
