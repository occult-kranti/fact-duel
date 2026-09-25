---
name: hisaab-design
description: The HISAAB DO "LAL FEETA" design system (the politics & public-money edition) — tokens, fonts, surfaces, answer-button coding, the quiet live-question rules, the notification budget, 3D physics rules, `h-` class conventions and verification steps. Load before writing or restyling any HISAAB DO screen, component, share card or CSS under editions/hisaab/.
---

# LAL FEETA — HISAAB DO design card

Full rationale and every screen spec: `docs/hisaab/design-bible.md` (the charter `docs/hisaab/CHARTER.md`
wins on conflict). Tokens: `editions/hisaab/theme/tokens.css`. This is the working card. Do **not** reuse
JHK's Floodlight look (`fd-` classes, volt/ember, Bricolage) in the edition.

**Identity in one line:** a sarkari file reprinted as a pop poster. Manila **files** are the tappable things,
**red tape** marks what is unopened, **stamps** are verdicts, **receipts** are evidence, the green **noting sheet**
holds explanations, and a **tijori** holds your collection, all under big Devanagari + Latin poster type and
one hot accent, **syahi violet**.

## Tokens (never raw hex in edition components)
- Grounds: `--h-ground` (page), `--h-ground-2` (wells), `--h-paper` (cards/options), `--h-sheet` (noting),
  `--h-receipt`, `--h-manila` / `-2` / `-ink` (files).
- Ink: `--h-ink`, `--h-ink-2` (secondary, ≥ 4.5:1 everywhere), `--h-ink-3` (**UI-only**, never words to read),
  `--h-line` (2px outlines), `--h-hair` (decorative only).
- Accent: `--h-syahi` (fill), `--h-syahi-text` (violet words), `--h-syahi-soft` (tint), `--h-syahi-ink` (text on fill).
- Verdicts: `--h-pass` / `--h-fail` / `--h-wait` with `-text`, `-soft`, `-ink`; `--h-noted` = syahi.
- **Legal status: `--h-legal` / `--h-legal-ink` for EVERY status.** Never red for "alleged", never green for "acquitted".
- Props (never meaning alone): `--h-tape`, `--h-marker`, `--h-brass` (`-text`, `-ink`), `--h-margin-rule`.
- Slots: `--h-slot-a…d`. Radii `--h-r-xs/s/m/l/xl/pill`. Shadows are hard: `--h-shadow-1/2/3`; `--h-shadow-float`
  is for overlays only. Motion: `--h-dur-*`, `--h-ease-*`, and multiply distances by `--h-travel` (0 under reduced motion).
- Theme: `<html data-theme="light|dark">`; no attribute follows the OS. `data-motion="reduced"` mirrors the Effects setting.
- Adding or changing a colour token? Re-check contrast (snippet below) and update the bible §3.4 table.

## Type
- `--h-font-display` **Akshar Variable** 600/700: titles, labels, stamps, verdict words, the poster line.
  Latin display is UPPERCASE with `--h-lh-caps`; any line with Devanagari uses `--h-lh-display-deva` (1.25).
  Its digits are proportional, so never use it for counters.
- `--h-font-ui` **Mukta** 400/600: body, options, stems, buttons. Scores use `font-variant-numeric: tabular-nums`.
- `--h-font-mono` **Sometype Mono** 400/700: file numbers, receipts, timers, ₹ amounts. **Latin, digits and ₹
  only; never Devanagari** (no mono on Fontsource covers it).
- `--h-font-hand` **Kalam** (lazy): one marginal note per screen at most (certificate, share cards, noting).
- Sizes: sentences ≥ `--h-fs-xs` (14px); inputs ≥ 16px; `--h-fs-2xs` (12) only for caps/mono chips and kickers.
- **Devanagari:** no letter-spacing (`:lang(hi) { letter-spacing: 0 }`); `lang="hi"` on Devanagari spans in
  English screens; don't set `line-height` on strings that wrap in Hindi; never `overflow:hidden` a text-tight
  box; Latin digits with `Intl.NumberFormat('en-IN')`; lakh/crore; Hinglish copy lines are in Latin script.
- Fonts come from `@fontsource-variable/akshar`, `@fontsource/mukta`, `@fontsource/sometype-mono` and
  `@fontsource/kalam` (see bible §4.2). Import the weight CSS (`400.css`), not per-subset files, so ₹
  resolves to the small latin-ext file.

## Surfaces and components (class prefix `h-`)
- Objects: rounded (`--h-r-m` controls, `--h-r-l` files/cards), 2px `--h-line`, `--h-shadow-2`. No page grain,
  no hairline grids, no serif, no zero-radius editorial look.
- **One `h-btn--primary` (violet fill) per screen, and it is that screen's primary action.** Others are
  `--paper` or `--ghost`. Press = print down: `pointerdown` → translate(2px,2px) and shadow to
  `--h-shadow-0`, within `--h-dur-tap`. It never delays the click.
- `h-file` (manila, `F.No.` tab, optional `h-tape`, meter), `h-stamp`, `h-receipt` (mono rows, zig-zag mask),
  `h-sheet` (noting, red margin rule), `h-chip--legal|source|govt|kind`, `h-meter`, `h-tile` (cartogram),
  `h-cert`, `h-top`, `h-nav`, `h-toast`, `h-ceremony`, `h-skeleton`. One CSS file per component. No `!important`.
- Stamps: a word plus an icon, rotated by a **seeded** angle (item id), ≥ 20px bold, ≥ 24px on manila;
  `mix-blend-mode: multiply` (light) / `screen` (dark).
- Receipt rows in order: RECEIPT # · XP / SOURCE (label + ↗) / STATUS (legal chip + "as of") / OTHER SIDE /
  GOVT THEN (neutral chip). **Nothing funny inside a receipt.**
- Layout: mobile first, breakpoints 600 / 900 (bottom bar ↔ 88px rail) / 1200; `dvh` not `vh`; gutters 16px;
  safe-area insets on the top bar and bottom bar; no horizontal scroll.

## Answer buttons (`h-opt`): shape + letter + tint, colour-blind safe
| slot | letter EN / HI | shape | tab tint |
|---|---|---|---|
| 1 | A / क | ▲ triangle | `--h-slot-a` |
| 2 | B / ख | ◆ diamond | `--h-slot-b` |
| 3 | C / ग | ● circle | `--h-slot-c` |
| 4 | D / घ | ■ square | `--h-slot-d` |
- 60px min height, full-width paper row, 52px left tab (letter over shape), label Mukta 18px. Keys 1–4 / A–D.
  `touch-action: manipulation`, `user-select: none`. Accessible name: "Option A, triangle: …".
- States: `locked` = 3px syahi ring + lock icon + "Locked". `correct` = 3px pass outline, tab pass-filled with ✓.
  `wrong-chosen` = tab fail-filled with ✕, body hatched `--h-fail-soft`. `correct-unchosen` = dashed pass outline + ✓.
  Others go to opacity .55. **Colour never works alone.**

## The LIVE (timed) question: the quiet surface
- The card mounts `visibility:hidden` until the double-rAF reveal marker. No entrance animation, no layout
  shift, no work before it.
- Fixed option order. No correctness styling before `round.result`. The timer is a 6px ink bar directly above
  the answers, driven continuously by rAF with `transition: none`; never red, never shaking.
- **Forbidden while live:** WebGL/canvas, particles, halftone, tape, stamps, marker, toasts, ceremonies, nav,
  share buttons, and any sound except `tap`/`select`. Call `setQuiet(true)` on the overlay budget from the
  countdown until `round.result`.
- A Surprise Audit (wild round) is announced on the between-round receipt, never on the question card.
- Untimed route cards (daily, Rajya, Sector, Kiska Media?, Forward Court) stay quiet too: stamp, receipt and
  tape snap happen only after the answer locks.

## Notification budget (charter §7)
- **Toasts: ≤ 1 per screen visit.** Extra requests merge into it or go unshown to Profile › Activity.
- **Ceremonies: only `label` (new band) and `file` (first clear of a state/sector/Kiska/Forward file).** If both
  fire, show one ceremony with two stamps. Level-ups inside a band, XP, quests, achievements (Stamp Register),
  streak and Babu rank all update **in place**.
- Inline, not toast: "Copied ✓" on the button, offline banners, errors.
- **Never:** push notifications, e-mail, icon badges, "come back" or streak-risk copy, sound before the
  first tap, auto-queued next duel. Decline buttons say "Not now"; labels are never used to shame a choice.
- Per-screen table: bible §9.

## 3D physics set pieces (R3F + @react-three/rapier)
- There are four: **TIJORI** (Home panel on tap / Vault header), **TARAZU** (match result, after the verdict text),
  **THAPPA** (Aaj finish, label ceremony, certificate), **FILE PILE** (route finish). Specs and body budgets
  are in bible §10; `components/three/gem-vault.tsx` is the working Rapier reference.
- Lazy and client-only (`React.lazy`), never on first paint. `SceneFrame` with dpr `[1, 1.5]`, offscreen pause,
  `frameloop="demand"` once bodies sleep, one canvas at a time, no network textures.
- Load only with Effects = Full, no `saveData`, and `deviceMemory ≥ 4` where reported. Otherwise render the
  2D fallback, which carries the same numbers and `aria-label`.
- Reduced motion: step the world to rest off-screen, render one frame, then `frameloop="never"`.
- **Never mounted from countdown to `round.result`**: the host checks the overlay-budget quiet flag and
  unmounts. TARAZU unmounts before a rematch countdown.
- The final state is the **true number** (receipts count, round score, file score). Physics only decorates it.

## Honesty and legal (blocking in review)
- N1–N14 (gamification-advisor) apply: Babu-Bot is always labelled BOT and its random play is disclosed; no
  fake presence, near-misses or countdowns; no currency (tijori coins are receipts, "Not money"); no forced
  account; vocabulary never includes bet, wager, odds, jackpot or casino.
- Art: no State Emblem or Chakra, no tricolour identity, no "Government of India" styling (certificates say
  "Satire. Not a government document."), no party symbols **including emoji** (🪷 ✋ 🧹 🚲 🐘 ⏰ 🏹 🏮 ☭ 🌅 🪁 🌿),
  no party colours, no media logos or masthead styling, no India outline (use the 7×7 cartogram in bible §11.3),
  no real faces.
- Shares: items with `status` carry the status line + as of; a share never states a wrong option as fact; the
  certificate name falls back to "Anonymous Janta" if it matches anyone in the bank's `people` lists.

## Verify before you finish
1. `grep -rnE '#[0-9a-fA-F]{3,8}\b' editions/hisaab --include=*.css --include=*.tsx | grep -v theme/tokens.css`
   returns nothing (tokens only). Also `grep -rn 'fd-' editions/hisaab` returns nothing.
2. Contrast for any new or changed pair (text ≥ 4.5, UI/stamps ≥ 3):
   ```js
   // node -e "<paste>" '#fg' '#bg'
   const L=h=>{const c=[1,3,5].map(k=>parseInt(h.slice(k,k+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
   const [a,b]=process.argv.slice(1).map(L).sort((x,y)=>y-x);console.log(((a+.05)/(b+.05)).toFixed(2));
   ```
3. `pnpm exec tsc --noEmit`, `node --test tests/hisaab-*.test.mjs`, and `pnpm build:hisaab` (the JHK suite
   must stay green too: `node --test tests/*.test.mjs`).
4. Run `pnpm dev:hisaab` (or `pnpm preview:hisaab` for the built base path). Check each screen at **360 / 390 / 414
   and 1440**, in **light and dark**, in **en and hi**: no horizontal overflow, targets ≥ 44px, sentences ≥ 14px,
   inputs ≥ 16px, safe areas, no clipped matras. Point `scripts/mobile-gate.mjs` at the edition URL where its
   screen list covers it, then **read the PNGs**, because the gate measures and does not judge.
5. Checklist per screen: exactly one violet primary; ≤ 1 toast; no WebGL in a live round; every colour has a
   shape, icon or word twin; the legal chip is neutral with an as-of date; Devanagari is untracked; the reduced
   motion and Effects = Off paths render.
