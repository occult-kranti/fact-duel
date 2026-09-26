# HISAAB DO: mobile and accessibility review (loop 1)

Reviewer lane: **mobile-a11y**. Date: 26 Sep 2026. Build: a `pnpm build:hisaab` of the working tree at review
time, served with `vite preview` on port 4195. Binding references: design bible §7 (accessibility), §9
(notification budget), §11.10–§11.12 (the live round, round receipt and match result), and ENGINE §6.3 (timing contract).

**Verdict: fix first.** No P0: every legal and honesty gate I could observe holds, nothing crashes, and
the live round stays quiet. There are **8 P1s**, all in how assistive tech and keyboards reach the timed
duel, plus page-wide focus that ends up hidden under the fixed bars. **12 P2s** go to the backlog.

---

## 1. What was run

| check | how | result |
|---|---|---|
| Screen walker | `node scripts/hisaab-screens.mjs <out> http://localhost:4195/fact-duel/hisaab/` (10 cells: 360/390/414/1440 × light/dark + Hindi at 390 × both) | **360 screens, 0 failures, 0 console errors, 0 failed requests, 11/11 flows ok**, and the live-round quiet audit passed in every cell. I read the PNGs for the duel live/receipt/result, the route receipt (1440 dark), the Rajya cartogram, the Vault (dark), Settings (Hindi dark) and the Hindi live question |
| Reflow, WCAG 1.4.10 | 21 screens at **320×568** with a seeded profile | no horizontal overflow and no clipped text |
| 200% zoom, WCAG 1.4.4 | a 1280×900 laptop at 200% = **640×450 CSS px at DPR 2**, 21 screens | no overflow; the fixed chrome takes 27% of the height (12% on play screens) |
| Text spacing, WCAG 1.4.12 | the standard bookmarklet (line-height 1.5, letter-spacing .12em, word-spacing .16em, paragraph spacing 2em) on 21 screens at 390 | no overflow and no clipping |
| Keyboard-only route | `#/route/state-up`: keys `1–4`, then `N`, all six cards, then the first-clear ceremony | works. Focus moves to the result and then to the next stem |
| Keyboard-only duel | `#/duel`: Tab to the primary, Enter, the countdown, the live round (keys), the receipt, the verdict | playable, but see P1-1 to P1-4 |
| AX tree | CDP `Accessibility.getFullAXTree` on start, route card, duel setup, duel receipt and duel result | 0 unnamed controls, 0 duplicate ids, 0 focusable-inside-`aria-hidden`, exactly one `h1` per screen |
| Focus visibility | Tab tour recording the computed ring on every stop | every stop tested shows the 2px ground + 3px syahi ring |
| Focus not obscured, WCAG 2.4.11 | Tab tour at 390×844, 360×740, 844×390 and 740×360, checking the focused rect against the fixed and sticky bars | **fails**: P1-5 |
| Dialogs | ceremony, Vault receipt sheet, "Leave the room?" | trap and Esc work in all three; focus return and default focus have bugs (P1-6, P2-2, P2-3) |
| `lang` coverage | text-node walk in both locales, 21 screens | English locale: no Devanagari outside `lang="hi"`. Hindi locale: English bank text is marked as Hindi (P1-8) |
| Reduced motion + Effects Off | OS `reduce` plus `hisaab-motion=off` (through `storageNames`) | `data-motion="reduced"` and `data-effects="off"` are set, stamps fade in 120 ms, and there is no WebGL anywhere. TARAZU and TIJORI render as 2D with true-number labels. One gap: P2-4 |
| Scroll across arena views | Gauntlet at 360×740: scroll the receipt to the bottom, tap Next, measure | every live question renders at `scrollY 0`. **The match result does not** (P1-3) |
| Contrast | the bible's WCAG script on the placeholder and faded pairs | dark placeholder at 4.23:1 (P2-5) |
| `tsc --noEmit` / `node --test tests/hisaab-*.test.mjs` | — | 0 errors / 40 of 40 pass (I own no code; this is the baseline) |

Not available here: real screen readers (VoiceOver, TalkBack, NVDA). The screen-reader findings come from
Chromium's accessibility tree and from reading the code, and each names the standard behaviour it relies on.
A device pass with TalkBack and VoiceOver should confirm P1-1, P1-2 and P1-4 once they are fixed.

Artefacts (scratch): `…/scratchpad/ui/mobile-a11y/{walker,kbd,scroll,zoom,land}/`, with `walker/report.json`,
`kbd/kbd.json` and `zoom/zoom.json`.

---

## 2. P1: must fix before launch

### P1-1 · The live question is never announced, and focus falls to `<body>` while the clock runs
- **Files:** `editions/hisaab/app/screens/room/live.tsx` (reveal effect at lines 174–193, stem at line 251);
  `editions/hisaab/app/screens/room/arena.tsx` (lines 99–111).
- **What:** at the countdown, focus sits on the sr-only "Get ready" `h1`. That section unmounts at the reveal, so
  `document.activeElement` becomes `BODY` (measured). No live region carries the stem: the only live text at the
  reveal is "First tap locks. Keys 1–4 or A–D." The arena skips the live view on purpose ("the live card
  announces itself; focus would steal the keys"), but the card does not announce itself. The keys are not
  stolen either: `ui/option.tsx` listens on `window` and ignores only form fields.
- **Why it matters:** a screen-reader player's answer clock (`markShown`) starts while they hear nothing. The
  first thing they hear is "5 seconds left". The timed duel can't be played on equal terms, which is an access
  problem and not a timing-contract violation.
- **Fix:** give the stem `tabIndex={-1}`. In the reveal frame, right after `el.dataset.shown = ''` (line 186, and
  in the already-shown branch at line 180), call
  `document.getElementById(\`h-live-stem-${rd.id}\`)?.focus({ preventScroll: true })`. The focus happens *at*
  the reveal marker, so the quiet surface and the timing contract are unchanged. Add
  `.h-live__stem:focus { box-shadow: none }` to `live.css`, because the stem is not a control and a ring on it
  would be a visual change on the live card. Update the comment at `arena.tsx:110`.

### P1-2 · The score in the round header has no accessible name (live round, receipt and result; Pass & Play too)
- **Files:** `editions/hisaab/app/screens/room/live.tsx:51–66` (`RoundHead`),
  `editions/hisaab/app/screens/pass/index.tsx:290–302`.
- **What:** `<p className="h-roundhead__score" aria-label="Score: you 0, Babu-Bot · BOT 0">` has only
  `aria-hidden` children. ARIA 1.2 prohibits naming the paragraph role, and Chromium's tree exposes it as
  `- paragraph` with no name (Playwright `ariaSnapshot`, both views). The bible (§7, §11.10) requires the aria
  text "You 1, Babu-Bot 0".
- **Fix:** drop the `aria-label` and add a real sr-only child:
  `<span className="h-sr">{t(\`Score: you ${mine}, ${names[them]} ${theirs}\`, …)}</span>`. Keep `.h-roundhead__pill`
  and `.h-roundhead__who` `aria-hidden`. Make the same change in `pass/index.tsx`.

### P1-3 · The match result opens scrolled past the verdict: JEET/HAAR, TARAZU and the bot disclosure are off-screen
- **File:** `editions/hisaab/app/screens/room/arena.tsx:99–111`.
- **What:** the arena swaps views without resetting the scroll. A player who reads the last round receipt to
  its end (it is 1,300–1,500px tall at 360) and taps "See the verdict" lands at `scrollY 554`. There, the verdict
  `h1` is at `top −429`, and the first thing on screen is "XP FROM THIS MATCH"
  (`scroll/result.png`). Focus goes to that off-screen `h1` with `preventScroll: true`, so keyboard users can't
  see where they are either. TARAZU settles out of view, against bible §11.12 (verdict text first, scale after).
  The countdown screens are shorter than the viewport, so every live question still starts at `scrollY 0`
  (measured); the timing contract is intact.
- **Fix:** in the view-change effect, when the key changes and `view !== 'live'`, call
  `window.scrollTo({ top: 0, left: 0 })` before focusing the heading. Also do it for `countdown`, so a long
  receipt can never leave the page scrolled when the question appears.

### P1-4 · The round verdict is not reliably announced: focus re-reads the question, and the status region is inserted already filled
- **Files:** `editions/hisaab/app/screens/room/receipt.tsx:278–280`; `editions/hisaab/app/screens/room/arena.tsx:106–110`.
- **What:** on the receipt, the arena focuses the first `.h-arena h1`, which is the **stem**, so a screen reader
  re-reads the question. The verdict line ("Wrong. Answer: … Level at 0–0.") sits only in a
  `<p class="h-sr" role="status">` that mounts with its text already in it. Live regions announce *changes*, and
  a region inserted with content is dropped by NVDA and JAWS and is inconsistent in VoiceOver. Bible §7 requires
  the round verdict and the score change to be polite.
- **Fix:** mount one persistent `<p className="h-sr" aria-live="polite" ref={announce} />` in `Arena` (outside
  `body`, so it lives from the countdown to the result). Have `RoundReceipt` hand its `said` text to the arena
  (a callback prop), and have the arena write it ~150 ms after the receipt mounts. Delete the `role="status"`
  paragraph at `receipt.tsx:278`. Then focus the verdict block instead of the stem: give
  `.h-rreceipt__verdict` `tabIndex={-1}` and an sr heading ("Round 1: correct"), and change the arena selector
  to `.h-arena [data-autofocus]`, marking that block.

### P1-5 · Keyboard focus lands fully hidden under the bottom nav and the sticky action bars (WCAG 2.4.11)
- **Files:** `editions/hisaab/app/base.css:13` (`html`); sticky bars in `screens/settings/settings.css:91`,
  `screens/duel/setup.css:234`, `screens/route/card.css:274`, `screens/room/receipt.css:~140` and
  `screens/room/result.css:~237`.
- **What:** nothing sets `scroll-padding`. When Tab moves to an element below the fold, the browser scrolls it to
  the viewport's bottom edge, which is behind the fixed 64px nav. Measured, with the element **fully covered**:
  Home at 390×844 ("All files", "Duel a friend", "Pass & Play"); Rules at 390×844 and 360×740 ("Report an error
  in a question"); Home at 844×390 and 740×360 (quest rows, "Open the money trail"); Settings at 844×390 and
  740×360 (switches, Rules/Corrections links, under the nav *and* the sticky Done bar). Screenshot:
  `kbd/home-focus-under-nav.png` shows focus on "All files" with nothing visible focused.
- **Fix (foundation, `base.css`):**
  ```css
  html {
    scroll-padding-top: calc(var(--h-top-h) + env(safe-area-inset-top, 0px) + var(--h-s-2));
    scroll-padding-bottom: calc(var(--h-nav-h) + env(safe-area-inset-bottom, 0px) + var(--h-s-2));
  }
  :root:has(.h-set__done-bar, .h-setup__launch, .h-playbar, .h-rreceipt__bar, .h-result__bar) {
    scroll-padding-bottom: calc(var(--h-nav-h) + env(safe-area-inset-bottom, 0px) + var(--h-s-16) + var(--h-s-8));
  }
  @media (min-width: 900px) { html { scroll-padding-bottom: var(--h-s-2); } }
  ```
  (At ≥ 900 the nav is the rail. Keep the `:has` rule for the sticky bars there.)

### P1-6 · "Leave the room?" opens with focus on the destructive **Leave**, not Stay
- **File:** `editions/hisaab/app/screens/room/arena.tsx:210–246` (`ConfirmLeave`, also used by the P2P lobby).
- **What:** React applies `autoFocus` to Stay on commit, and then the effect's `d.showModal()` moves focus to the
  dialog's first focusable element, which is **Leave** (measured: `leave dialog focus: BUTTON "Leave"`). A
  keyboard player who presses Enter on ✕ and then Enter again ends a live match. Esc = Stay works, and the
  answer keys are correctly blocked under the dialog.
- **Fix:** keep a ref to Stay and call `stay.current?.focus()` right after `d.showModal()`, then drop `autoFocus`.
  (Or put Stay first in DOM order and reverse it visually with `flex-direction: row-reverse`.)

### P1-7 · The single-character shortcuts are global, and nothing turns them off (WCAG 2.1.4, level A)
- **Files:** `editions/hisaab/app/ui/option.tsx:166–185` (`1–4`, `A–D` on `window`);
  `editions/hisaab/app/screens/route/card.tsx:358–374` (`N` and `→` on `window`).
- **What:** any bare `a`, `b`, `c`, `d` or `1–4` keystroke anywhere on the page locks an answer, and `n`/`→`
  moves to the next card. Speech-input users (dictated words become keystrokes) and players with tremor can lock
  a timed answer by accident, and a lock is irreversible. 2.1.4 requires the shortcut to be switchable off,
  remappable, or active only while its component has focus.
- **Fix (preferred, and it builds on P1-1):** act only while focus is inside the question. In the `OptionList`
  listener, return unless `document.activeElement?.closest('.h-qcard, .h-live__card, .h-pass__play')`. Focus the
  stem on the live reveal (P1-1) and on every route card mount, including the first card:
  `route/index.tsx` already does this for cards 2–6 at line 255, so apply it to the first card too. Apply the
  same focus-within guard to `useNextKey`, scoped to `.h-play`. **Alternative:** a Settings switch "Keyboard
  shortcuts (1–4, A–D, N)", default on. That needs a new `storageNames()` entry (shared
  `lib/storage-names.mjs`; foundation/engine request). Never write a literal key.

### P1-8 · The Hindi locale marks English bank text as Hindi (WCAG 3.1.2): options, receipts, Vault stems, forwards, Rules
- **Files:** `editions/hisaab/app/ui/option.tsx:128` (`.h-opt__label`); `ui/receipt.tsx:55` (`section.h-receipt`);
  `screens/receipts/index.tsx:81` (`.h-vrow__q`); `screens/me/ladder.tsx:63` (`.h-rung__line`, English in
  Hindi); `screens/files/*` (`.h-fwd__claim`, `.h-reg__claim`, `.h-media__outlet`); `screens/money/*`
  (`.h-file__extra` English subtitles); `screens/rules/index.tsx` (83 English sentences under `lang="hi"`).
- **What:** the stems already carry `lang="en"`, but the four **answer options** don't, and neither does the
  receipt (SOURCE/STATUS rows and the status line, apart from the legal line at `chip.tsx:77`). Measured in the
  Hindi locale: Aaj and route options, every Vault stem, 10 forward claims, 20 ladder lines and the whole Rules
  body are exposed as `hi`. A Hindi TTS voice reads them with Hindi phonology. The bank stays English until
  phase 5 (bible §2.3), so the markup has to say so.
- **Fix:** `lang="en"` on `.h-opt__label` (always; options are bank text), on `section.h-receipt`, on
  `.h-vrow__q`, on forward/outlet/claim spans, on the money-hub English subtitles, and on the Rules long-read
  container while it has no Hindi text. The ladder's `rung.line` in Hindi should show the Hinglish line from
  `LADDER_DISPLAY` or carry `lang="en"`.

---

## 3. P2: backlog

| id | file · line | what | fix |
|---|---|---|---|
| P2-1 | `app/shell/shell.tsx:120–122` | No skip link, and `<Nav>` comes before `<main>` in the DOM. On first load a phone keyboard user tabs through the top bar and then the five bottom-bar items (which sit visually *below* the content) before reaching content. Landmarks exist, so 2.4.1 passes; this is ergonomics | Add a first-child `<a className="h-skip" href="#h-main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>Skip to content</a>` (the hash router means it must `preventDefault`), visually hidden until `:focus-visible`, `z-index: var(--h-z-skip)`. Render `<Nav>` after `</main>` (it is `position: fixed`, so nothing moves) |
| P2-2 | `app/ui/ceremony.tsx:31` | After a first-clear or label ceremony, focus goes back to the opener. At a route finish the opener ("Close the file") has unmounted, so focus drops to `<body>` (measured) | `return () => { const back = before?.isConnected ? before : document.getElementById('h-main'); back?.focus?.({ preventScroll: true }); };` |
| P2-3 | `app/screens/receipts/sheet.tsx:37–69` | The Vault sheet is portalled to `<body>` with `aria-modal`, but `#h-main`, `.h-top` and `.h-nav` stay interactive to swipe-navigation screen readers (measured `inert: false`). The Tab trap, Esc and focus return work | On open, set `inert` on `#h-main`, `.h-top` and `.h-nav`, and remove it in the cleanup. Or render the panel in a native `<dialog>` with `showModal()` like `ConfirmLeave` |
| P2-4 | `app/ui/ceremony.tsx:30` | Effects = **Off** still plays particles: `juice.confetti('stamp')` goes through `lib/fx/particles.ts`'s reduced path (a ring pulse), but Settings promises "No 3D, no confetti, no particles." | `if (getPrefs().motion !== 'off') juice.confetti('stamp');` (import `getPrefs` from `@/lib/fx/prefs`) |
| P2-5 | `screens/me/name-field.css:27`, `screens/receipts/receipts.css:138`, `screens/rules/rules.css:293` | The placeholder uses `--h-ink-3`, which on `--h-receipt` in **dark** is **4.23:1** (placeholder text counts as text; 4.5 floor). Visible on Settings › Name in dark | `color: var(--h-ink-2)`, as `pass.css:52` and `friend.css:95` already do. (`rajya.css:360` is on paper at 4.68 and is fine, but align it too) |
| P2-6 | `screens/duel/setup.css:234`, `screens/settings/settings.css:91`, `screens/route/card.css:274` | On landscape phones (844×390, 740×360) the top bar, nav and a sticky action bar take **51–56%** of the height; 160–190px is left for content | `@media (max-height: 480px) { .h-setup__launch, .h-set__done-bar, .h-playbar { position: static; } }` in each lane's file; foundation: `.h-top { position: static }` under the same query |
| P2-7 | `app/ui/option.tsx:126`, `app/ui/tile.tsx:33–38`, `app/shell/top-bar.tsx:34`, `app/ui/confidence-switch.tsx:50–52`, `app/ui/receipt.tsx` default `label` | Screen-reader names stay English in the Hindi locale: an option shows **क** but is named "Option A, triangle"; tiles say "Uttar Pradesh, sealed"; the level chip uses `label.en`; the confidence points text is English | Use `t()`/`isHi` for each: `विकल्प क, त्रिभुज:` (a shape map: त्रिभुज · हीरा · गोला · चौकोर); `tileLabel(name, state, progress, locale)` using `stateNameHi`; `isHi ? label.hi : label.en`; the confidence sr text through `t()` |
| P2-8 | `app/ui/tile.tsx:45`, `app/shell/top-bar.tsx:34` | Label in name (WCAG 2.5.3): the tile's visible text is "UP" but its name "Uttar Pradesh, sealed" does not contain it; the chip shows "LV 1" and is named "Level 1, …". Voice control ("click UP") fails | `aria-label={\`${code} · ${tileLabel(…)}\`}` → "UP · Uttar Pradesh, sealed"; chip → "LV 1 · Level 1, Andhbhakt. Your profile" |
| P2-9 | `screens/home/index.tsx:497`, `app/ui/certificate.tsx:82`, `screens/duel/friend.tsx:843` | More `aria-label`s on generic `span`/`p`, which screen readers ignore: the quest count "1/3" is read as "one third"; the certificate rung dots read nothing; the lobby code is read as a word | Put the visible text in `aria-hidden` and add `<span className="h-sr">1 of 3 done</span>`, `…Rung 5 of 9`, and the spaced code `7 K 2 Q, 9 F` |
| P2-10 | `screens/files/rajya.tsx:241–270` (+ `ui/tile.tsx`) | The cartogram puts **31 tiles in the Tab order**. Arrow keys already walk the almirah, so a roving tabindex costs nothing | Add a `tabIndex` prop to `Tile` (foundation). In the grid, `tabIndex={code === selected ? 0 : -1}`; `onArrow` already moves focus |
| P2-11 | `screens/room/result.tsx:424` | The share outcome ("Copied ✓", "Couldn't share") changes the button text silently; the route card wraps it in `aria-live` (`route/card.tsx:288`) but the result screen doesn't | `<span aria-live="polite">{shareWord}</span>` inside the Button |
| P2-12 | `theme/tokens.css:111–122` | Every `--h-fs-*` is in px, so the browser's default font size (Chrome Settings › Font size, Firefox "zoom text only") has no effect. Page zoom works (1.4.4 passes, measured), and the tokens are the design lane's | Convert to rem (12px → `0.75rem` … 64px → `4rem`; poster `clamp(2.75rem, 13vw, 6rem)`); recheck the 320 and 200% passes |

---

## 4. What is good (keep it)

- **The phone gate is green across the matrix:** 360 screens, 0 overflow/target/text/input failures, 0
  console errors, 11/11 end-to-end flows, and one violet primary per screen.
- **Reflow at 320, 200% zoom and WCAG text spacing** pass on all 21 screens tested, with no clipped matras and
  no horizontal scroll.
- **The focus ring is consistent and visible** on every stop measured (2px ground gap + 3px syahi), including
  options, files, tiles, radios inside cards, switches and the range input.
- **Keyboard route play is good:** keys lock, focus moves to the verdict section, `N` advances and focus lands on
  the next stem, the confidence call is a native radio fieldset with its points spelled out for screen readers,
  and the answer keys stand down under modal dialogs.
- **Colour twins everywhere:** options are letter + shape + tint; verdicts are icon + word, with hatching on
  wrong-chosen; tiles have a glyph and a legend; FILE PILE and TARAZU carry words and the true numbers.
- **Accessible names are right** where set: "Option A, triangle: …", the tile states, the scene boxes
  (`role="img"` with true numbers, e.g. "Tijori: 6 receipts. 1 coin = 1 sourced receipt. Not money."), and the
  legal status in the neutral chip with "as of".
- **Live-round announcements are restrained:** one polite countdown line per round; the timer speaks only at 5 s
  and 2 s (only 2 s on 5 s rounds); lock state goes to `role="status"`.
- **The ceremony dialog** traps focus, closes on Esc, and makes the top bar and main `inert`. The Vault sheet
  traps, closes on Esc and returns focus. The leave dialog's Esc = Stay.
- **Reduced motion and Effects Off:** `data-motion`/`data-effects` mirror the setting, stamps fade (120 ms)
  instead of slamming, the receipt print is off, no WebGL canvas mounts, and the 2D art carries the same labels.
- **Language:** `<html lang>` follows the locale; every Devanagari string in the English locale sits under
  `lang="hi"`; stems carry `lang="en"`.

## 5. Requests to the lanes (reviewers do not edit code)

- **foundation:** P1-5 (`base.css`); P1-7 guard in `ui/option.tsx`; P1-8 `lang="en"` in `ui/option.tsx` and
  `ui/receipt.tsx`; P2-1, P2-2, P2-4, P2-7 (option, tile, top bar, confidence switch), P2-8, P2-10 (`Tile` `tabIndex`
  prop); and a `storageNames()` key if the Settings-switch route is chosen for P1-7.
- **duel:** P1-1, P1-2, P1-3, P1-4, P1-6 (`screens/room`, `screens/pass`); P2-6 (`setup.css`); P2-9 (lobby code);
  P2-11.
- **route:** P1-7 (`useNextKey` guard; focus the stem on the first card); P2-6 (`.h-playbar`).
- **me:** P1-8 (Vault stems, ladder lines, Rules body); P2-3; P2-5 (name field, Vault search, report input);
  P2-6 (Settings Done bar).
- **files:** P1-8 (forward claims, outlets, money-hub subtitles); P2-10.
- **home:** P2-9 (quest count).
- **design:** P2-12 (rem type tokens).
