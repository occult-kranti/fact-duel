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
