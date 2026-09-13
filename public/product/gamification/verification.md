# Gamification release ("Floodlight") — verification and limits

13 September 2026. Recorded by the advisor at the end of review loop 2, against the working tree at
`5221371` (loop-1 P1 fixes) on Node v22.22.2 / pnpm 11.25.0. Every row below is a command that was
actually run this turn and its actual output. The release is **not** cleared to publish: loop 2 found
two P0s (see `advisor-loop2.md`), so this record describes what has been verified, not a green gate.

| Gate | Command | Result |
|---|---|---|
| Automated suite | `node --test tests/*.test.mjs` | **94 pass, 0 fail**, 0 skipped, 0 todo, 0 cancelled, `duration_ms 636.96`, exit 0. 9 test files. Covers the duel engine, bot scheduling, timing and coin invariants, HTTP and profile paths, the expedition progression paths and the journal/difficulty additions. |
| TypeScript | `pnpm exec tsc --noEmit` | **Clean.** No diagnostics, exit 0. |
| Production build | `pnpm build` | **Succeeds**, exit 0. Five environments built (`✓ built in 1.20s / 4.58s / 815ms / 5.11s / 2.80s`), 1147 modules transformed for SSR, "Build complete." One standing warning: `(!) Some chunks are larger than 500 kB after minification` — the Rapier/Three chunks. Routes classified: `/`, `/api/duel`, `/fx-lab`, `/studio`, `/three-lab`. |
| Lint | `pnpm lint` (`eslint . --ignore-pattern dist --ignore-pattern .next`) | **Red, and redder than before the release: 259 problems (237 errors, 22 warnings)**, exit 1. Baseline measured this turn by extracting `76f16aa` — the last commit before any gamification source — into a clean tree and running the same eslint binary: **183 problems (145 errors, 38 warnings)**. So the release added **+76 problems / +92 errors** and resolved 16 warnings. 188 of the 259 are `@typescript-eslint/no-explicit-any`; 220 of the errors are under `app/`, 13 under `components/`, 3 under `lib/`, 2 under `tests/`. Lint was already failing before this release and still fails; nothing in this release was gated on it. |
| Screenshots (default motion) | `node scripts/screens.mjs <dir>` | 24 PNGs (6 screens × phone 390×844 and desktop 1440×900, fold and full-page). Script output: `phone: horizontal overflow 0px; console errors: 0` / `desktop: horizontal overflow 0px; console errors: 0`. |
| Screenshots (reduced motion) | `REDUCED=1 node scripts/screens.mjs <dir>` | 24 PNGs. `phone: horizontal overflow 0px; console errors: 0` / `desktop: horizontal overflow 0px; console errors: 0`. |
| Screenshots (light theme) | Advisor script, same five tabs at both sizes with `data-theme=light` | `light phone: overflow 0px errors 0` / `light desktop: overflow 0px errors 0`. |
| End-to-end bot duel — Quick Draw | Playwright, 390×844, dark | Completed Home → "Play now" → countdown → question → reveal → finish. Result screen rendered a real verdict ("YOU WIN · You take the match 1–0", `+10 XP`, `ARENA RANK Bronze +20`), both receipts ("Browser-reported time" 0.612 s vs "Scheduled bot time" 8.330 s) and the explanation. **0** ceremonies opened while the room was open; **0** toasts while a question was live; **1** ceremony + **4** toasts after leaving. Console errors: 0. |
| End-to-end bot duel — Triple Threat | Playwright, 390×844, dark | Three rounds plus the between-rounds panel. **0** ceremonies in-room, **0** over a question. Between-rounds order verified: headline → verdict → "The answer and its explanation are right below" → question → explanation → receipts → CTA. After leaving: **1** ceremony (LEVEL UP, with a WebGL canvas) + **4** toasts. Console errors: 0. |
| End-to-end expedition | Playwright, 390×844, dark | Full six-card run of "World Cup folklore" (brief → chapters 1–3 → finish → stamp). Finish screen showed stamp earned, run score, first-vs-best and the six-fact recap. The Next/Finish CTA cleared the tab bar on every card without a ceremony open (settled y ≈ 716–772 against nav top 788, 0 px covered); it did **not** clear it on the card where a ceremony opened (see the P0-B finding in `advisor-loop2.md`). |
| Timing contract | Per-frame Playwright sampling in a live room | Question card hidden for the first 2 frames (≈19 ms) then visible; `animationName: none`, `transform: none` on the card; `transitionProperty: none` on the timer track, its fill and the speed-bar fill; option order stable with `animationName: none` and `animationDelay: 0s`; **0** WebGL contexts in a room (1 Canvas2D particle canvas); click → locked in 17 ms. |
| Client bundle — lazy 3D | `find dist/client -name "*.js"` | 36 JS files, 4,601,271 bytes total. Largest: **`gem-vault` 2,264,122 B (2.16 MiB)** — lazy; **`three.module` 734,640 B (717 KiB)** — reached only through a lazy scene; `studio` 344,990 B; `arena` 301,997 B; `shared` (R3F + drei) 216,827 B — statically imports `three.module` and is itself only reachable from a lazy scene; `framework` 190,154 B; `index` 181,401 B; `fx` 162,247 B; `input` 81,403 B. The four scene chunks are each behind `lazyScene(() => import(…))` in `components/three/index.ts`: **`gem-vault` 2,264,122 B**, **`reward-medal` 10,102 B**, **`hero-orb` 7,927 B**, **`stamp-case-3d` 5,723 B**. Verified at runtime on the dev server that opening the Locker at `gems === 0` requests only the 2D fallback and never the physics module. |

## What these numbers do and do not mean

- The suite count (94) is the same as at loop 1. **No test was added for either class of bug loop 1
  found**, and none covers the two P0s loop 2 found. A green suite here is evidence about the engine,
  not about the reward layer.
- `pnpm build` succeeding is a packaging result. It is not a performance measurement and the large-chunk
  warning is not a device measurement.
- The lint baseline was reconstructed from a git archive of `76f16aa` with the repo's own eslint and
  config, in a tree with `node_modules` symlinked. It is a like-for-like comparison of the same rules,
  not of the same files: the release adds most of `app/screens/**`, so part of the +92 is volume rather
  than a drop in standards. It is still a doubling of the error count and it is reported as such.
- The bundle figures are the built artefacts' byte sizes on disk, uncompressed. No transfer size, no
  parse/execute time, no measurement of what any of it costs on a phone.

## Explicitly NOT verified

- **Physical devices.** Everything was measured in headless Chromium at emulated viewports with
  `isMobile`/`hasTouch` set. No real phone, no real touch, no real thumb, no notch or home-indicator
  safe area, no on-screen keyboard, no browser chrome resizing the viewport, no iOS Safari, no Android
  Chrome, no Firefox, no desktop Safari.
- **Assistive technology.** No screen reader was run. Screen-reader affordances were verified as DOM
  facts (`.fd-sr` shape twins, `kbd` hints, `aria-live` regions, `role="dialog" aria-modal="true"`,
  heading counts, focus order and the focus ring) — not as announcements a VoiceOver, NVDA, JAWS or
  TalkBack user would actually hear. No switch-control, voice-control or 200 % zoom testing. The
  contrast figures come from computed styles converted from OKLCH plus reading the screenshots, not from
  a certified contrast tool.
- **Real GPUs.** All 3D ran on SwiftShader (`--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader`). The "scene stuck at `data-scene-frame=loading`" finding in
  `advisor-loop2.md` (P1-A) is reported under that caveat. No frame rate, no thermal behaviour, no
  measurement on integrated or mobile GPUs, no WebGL-context-limit testing, and no verification of the
  dpr clamp on a high-DPI display.
- **Wide-area network.** Everything ran against `localhost:5173` on the dev server. No latency, no
  packet loss, no two-device match across a WAN, no measurement of the bot's scheduled times against a
  real human's round trip, no offline or flaky-connection behaviour, no production build served through
  Wrangler.
- **Cloudflare D1 at scale.** No D1 instance was exercised in this pass, at any size. No concurrency
  testing, no migration rehearsal, no quota or throughput measurement, no multi-tab or multi-device
  contention on the local stores either.
- **Observed player behaviour.** No user session, no retention or learning study, no A/B test, no
  telemetry. Every claim about hooks, goal-gradient, reward salience or "the player never sees which
  answer was right" is an inference from the design literature plus what the instrumented DOM did — not
  an observation of a person.
- **Content.** No question-bank audit, no fact-checking of the 54 questions, no editorial or source
  review beyond noticing that difficulty still skews hard for a new player.
- **Security and privacy.** No review of export/reset completeness against real stored data, no storage
  quota testing, no audit of what a shared device leaks between profiles.
- **Sound and haptics.** Audio was never unlocked (headless Chromium logged
  `The AudioContext was not allowed to start` throughout). The procedural cue layer and
  `navigator.vibrate` were not heard or felt; only their call sites were read.
