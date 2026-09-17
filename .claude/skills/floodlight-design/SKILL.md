---
name: floodlight-design
description: The FACT//DUEL "Floodlight" design system — tokens, type, surfaces, answer-shape coding, mobile shell rules, motion vocabulary and verification steps. Load before writing or restyling any screen, component or CSS in this repo.
---

# Floodlight design system (FACT//DUEL)

Full rationale: `public/product/gamification/design-bible.md`. This skill is the working card.

## Tokens (defined in `app/theme/tokens.css`; use them, never raw hex in components)
- Grounds: `--bg-0` (page), `--bg-1` (panel), `--bg-2` (raised card), `--line` (hairline), `--text`, `--muted`.
- Accents: `--volt` (brand energy, primary CTA, correct), `--ember` (competition, wrong), `--cyan` (learning), `--gold` (rewards/gems/level), `--magenta` (streak/rare), `--danger` (destructive only).
- Each accent has `--<name>-soft` (12% tint for fills) and `--<name>-ink` (text on the accent).
- Legacy aliases kept during migration: `--primary`→volt, `--background`→bg-0, `--card`→bg-1, `--border`→line, `--muted-foreground`→muted, `--rival`→cyan, `--science`→cyan, `--sport`→ember.
- FX palette for particles: `--fx-1..--fx-5` = volt, gold, cyan, magenta, text.
- Radii: `--r-control: 10px`, `--r-card: 16px`, `--r-hero: 24px`, pill `999px`. Shadows: `--shadow-card`, `--shadow-lift`, `--glow-volt`, `--glow-ember`, `--glow-gold`.
- Type: `--font-display` (Bricolage Grotesque), `--font-ui` (Instrument Sans), `--font-mono` (JetBrains Mono, tabular nums). Scale vars `--fs-12 … --fs-64`.
- Layout: `--nav-h: 56px` (bottom tab bar), `--rail-w: 76px` (desktop rail), `--topbar-h: 60px`, `--gutter: 16px`, safe areas via `env(safe-area-inset-*)`.

## Surfaces & temperature
- Competition surfaces (Play, Room, Rank): warm — ember accents, volt CTAs.
- Learning surfaces (Expeditions, Vault, Discovery): cool — cyan accents.
- Rewards (XP, gems, level, quests): gold. Streak: magenta flame.
- Cards: `bg-1`, 1px `--line`, `--r-card`; hover lift `translateY(-2px)` + `--shadow-lift`; never scale layout.
- Glass (`backdrop-filter: blur(12px)`) only on overlays/sheets/toasts with a solid fallback.

## Class conventions
- New CSS classes are prefixed `fd-` (e.g. `fd-card`, `fd-btn`, `fd-answer`, `fd-meter`). One CSS file per screen/component next to it, imported from the component. No `!important` unless overriding shadcn base.
- Mobile-first; breakpoints: 600 (phone landscape), 900 (nav switches rail↔bottom bar), 1200 (rail expands).
- Never set `min-width` wider than the viewport; only tables/code may scroll horizontally inside `overflow-x:auto`.

## Answer buttons (shape + colour coding, colour-blind safe)
Option 1 = triangle/ember, 2 = diamond/cyan, 3 = circle/gold, 4 = square/magenta. Shapes are inline SVG glyphs in the button. Correct state adds a check icon + volt outline; wrong adds a cross icon + desaturation. Height ≥ 56px, gap 8px, `touch-action: manipulation`, `user-select: none`, feedback on `pointerdown` (scale .97) that never delays the click.

## The timed question surface (hard rules)
- The question card mounts with `visibility:hidden` until the reveal marker (double rAF in arena.tsx). No entrance animation, no layout shift, no extra work before the marker. Timer track has `transition:none`.
- No canvas/WebGL, no decorative particles, no card flips while a question is live. Juice happens on lock (press feedback) and on the result (correct/wrong burst), not on mount.
- Fixed option order during a round; never reveal correctness styling before `round.result` exists.

## Motion vocabulary
- Press: scale .97 → spring back. Enter: 180–260ms ease-out. Exit: 120ms ease-in. Use `motion/react` (`motion.div`, `AnimatePresence`) or CSS.
- Counters count up (NumberCounter). Meters animate width via transform/`width` with 400ms ease-out.
- Reduced motion (`lib/fx/prefs.ts` `reducedMotion()` or `@media (prefers-reduced-motion)`): fades only, no shake/confetti/parallax.

## Copy tone
- Confident, warm, short. Losses are "next time" moments. One disclaimer slot per screen max ("on this device", "free simulated coins"); the rest lives in Rules.
- Names: Home, Play, Expeditions, Player, Vault (nav) — use the same words everywhere.

## Verify before you finish
1. `pnpm exec tsc --noEmit` and `node --test tests/*.test.mjs`.
2. Dev server on :5173 (`node scripts/run-framework.mjs dev` in background), then `node scripts/screens.mjs <outDir>` — zero horizontal overflow, zero console errors, then READ the PNGs and fix what looks wrong at 390px and 1440px.
3. `pnpm build` for the release gate when you touched imports, dynamic imports or anything client-only.

## Mobile gate (run it before you call a screen done)

`scripts/mobile-gate.mjs` drives the real app with playwright-core across four phone widths, two
locales and both themes, then writes PNGs and a `report.json`. It is the phone half of "Verify
before you finish": `scripts/screens.mjs` says the page renders, this says it is usable by a thumb.

```sh
node scripts/run-framework.mjs dev &                     # :5173
node scripts/mobile-gate.mjs outputs/mobile-gate         # every screen but the live duel
# the question stage and the finish receipt need a build that can create a room (dev has no D1,
# so /api/duel answers 503); on the dev server both are recorded as ALLOWED skips, nothing else is:
pnpm build:static && pnpm exec vite preview --config vite.config.static.ts --port 5174 &
node scripts/mobile-gate.mjs outputs/mobile-gate-static http://localhost:5174/fact-duel/
```

Exit code 1 on: any screen failure, any static-check failure, any skip that is not on `SKIP_ALLOW`,
any page/console error or failed request that is not on `CONSOLE_ALLOW`. Then READ the PNGs — the
gate measures, it does not have taste. Quote counts from `report.json` (`summary`, and
`static[].checked`), never from memory: `pass` with nothing inspected is the failure mode these
checks have.

**Matrix.** 320x568 (top bar only), 360x740, 390x844, 414x896 x `en`/`hi` x dark/light, over 19
screens: the profile gate, Home, Expeditions (the atlas and a route's brief), Play with each of the
three formats selected, Player, Vault, Collections, Events, Play rules / Rules of the coin / Trust,
the coins card, the settings sheet open, Play > Join with the name field focused, a LIVE question
stage (the duel is paused at `[data-stage="question"]` with the answers enabled and nothing is
tapped), and the finish receipt reached by playing that duel out. 232 runs.

**NOT covered**, so nobody reads a green run as the whole app: Discovery, Analytics, Showroom, the
ops dashboard, the expedition run and finish views, the rewarded state of the ad card (it needs a
live ad), and Play's rival-search state (it needs a second human in the queue — the queue itself is
503 on dev and absent on the static build). Landscape is not in the matrix either; the fixes that
must survive a turned phone are written `@media (pointer: coarse)` instead of a width step.

**Thresholds** (`THRESHOLDS` in the script — change them there, not per screen):

| what | number | why |
| --- | --- | --- |
| horizontal overflow | `scrollWidth <= innerWidth + 1` | the 1px is sub-pixel rounding, not a budget |
| tap target | 44 x 44 CSS px | WCAG 2.5.5 Target Size (Enhanced). 2.5.8 (Minimum) is 24 x 24; this product holds 44 because every control is a thumb target |
| body text | >= 14px | an element carrying >= 25 characters of its OWN text, not ALL-CAPS, not inside a button/link/label. Chips, counters and tab labels stay at `--fs-12`; sentences do not. Hindi counts characters too: a 22-character English readout can be a 30-character Devanagari sentence |
| inputs | >= 16px | iOS Safari zooms the page when a focused control computes under 16px |
| bottom bars | `env(safe-area-inset-bottom)` | read from the CSS, not the box: headless Chromium reports every inset as 0 and a notch cannot be emulated, so a runtime check would pass vacuously |
| top bars | `env(safe-area-inset-top)` | same reading, for "no text under the notch" |
| full-height panels | `dvh`/`svh`, never bare `vh` | `vh` == `lvh`, the LARGE viewport: a `100vh` panel overshoots the screen while the URL bar is showing |

**How the three CSS checks read a sheet.** `blocks()` is a brace parser, not a regex: it sees nested
rules (`& .kid`), composes their selectors, and keeps each block's OWN declarations. `position` is
resolved PER SELECTOR across every sheet, because this repo writes its viewport steps as
`@media { .fd-nav { bottom: … } }`; a bottom offset is read from `bottom`, `inset-block-end`,
`inset-block` or the `inset` shorthand, which is how the settings sheet pins itself
(`inset: auto 0 0 0`). Three things are recorded rather than required, and the report names each:
a layer pinned at BOTH edges (`inset: 0`) is full-bleed and pads its own content; a `sticky` box at
the TOP edge sticks inside its scroller (`env(safe-area-inset-top)` on a sticky table header would
open a 47px hole inside the table), so only the page-level bars in `PAGE_STICKY` are gated there;
and an off-screen parking offset (`.skip-link` at `top: -100px`) is checked on the rule that moves
it. A bar whose `position` lives in a Tailwind class list rather than in CSS goes in
`PINNED_BY_MARKUP` with the file that pins it — today the Radix sheet.

**What is NOT checked, and why.** The Devanagari line height. The gate reads computed `font-size`,
never leading, and a correct leading check needs the rendered glyph boxes, not a number: Devanagari
matras sit above and below the line, and `1.55` in `app/locale.css` is a typographic judgement, not
a threshold. The rule that stands instead is a review one — **do not declare `line-height` on a
string that wraps in Hindi**; let `:root[lang='hi'] body { line-height: 1.55 }` reach it.

**Named exceptions — the cap is two.** A third means fix the control, not the list.
1. `[data-slot='switch']` — the Radix switch track is 32x18 by design; its 56x44 hit area is a
   `::after` pseudo-element (`app/shell/shell.css`) and a pseudo-element has no box
   `getBoundingClientRect` can report.
2. `[data-slot='slider'] [role='slider']` — the thumb is one end of a continuous control whose real
   target is the 44px track; growing it would cover the value it points at.

**Allow-lists, both with a reason per entry.** `SKIP_ALLOW`: a screen the gate could not reach
fails the run unless it is named here AND the app's own notice matches AND nothing else failed on
that run — an unreachable screen is what a renamed `data-nav` or a disabled button looks like from
here. Today it holds one entry: the two duel screens against a build with no room service.
`CONSOLE_ALLOW`: `/api/*` answering 503 (dev, no D1) or 404 (the static preview has no API at
all), the Google Fonts fetch that this sandbox's proxy CA breaks, requests the gate itself
cancelled by navigating, and Chromium's URL-less "Failed to load resource" duplicate. A React
render crash, a 404 on an app asset, or a 401/403/500 on `/api/*` is not on it and fails.

**When a screen hangs.** Each screen, and the walk out of a live room after it, runs under
`SCREEN_TIMEOUT_MS` (90s). `page.evaluate` has no timeout of its own, and one unresponsive page
used to hang the whole run with no report written at all; now that screen fails with
`driver timed out after …` and the run carries on to the end.

**When it fails.** Fix in CSS first, appended at the END of the sheet that already styles the
selector (same selector, later source order — no specificity war, no `!important`). Every fix in
this repo carries a `/* mobile gate (scripts/mobile-gate.mjs) */` header saying which rule it
answers. Only reach for markup when CSS cannot: an inline `style={{fontSize}}` or a sentence with
no class of its own (`fd-launch-fine` in `launch-panel.tsx` is the one of those).

**The CSS layer is unit-tested.** `tests/mobile-gate.test.mjs` exercises `blocks`, `checkDvh`,
`checkSafeArea`, `checkSafeTop` and the two allow-lists on fixture CSS, and asserts the repo's own
sheets pass with a non-zero inspected count. Importing the script must never launch a browser: the
run lives behind `if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)`.

**Sources.** MDN, [CSS length](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (svh/lvh/dvh
and the scroll-resize warning) and [env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
(safe-area insets are 0 unless `viewport-fit=cover`; the `padding: 1em 1em calc(1em + env(...))`
pattern for a fixed footer — `app/layout.tsx` already sets `viewportFit: 'cover'`).
W3C, [Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
for the 24px floor and the five exceptions, with 2.5.5 Enhanced as the 44px we actually hold.
web.dev, [forms design basics](https://web.dev/learn/forms/design-basics) for "use at least 1rem"
on controls and a 48px tap-target recommendation. Playwright,
[emulation](https://playwright.dev/docs/emulation) for `browser.newContext({ viewport, isMobile,
hasTouch, colorScheme, locale })` — the gate sets these itself rather than taking a device
descriptor, because `devices['iPhone 13']` carries `defaultBrowserType: 'webkit'` and the only
browser installed here is Chromium.
