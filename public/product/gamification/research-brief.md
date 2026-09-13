# Fact Duel redesign — research brief (Sept 2026)

Project facts verified in repo: Next 16.2.6 running on **vinext** + `@cloudflare/vite-plugin` (Workers, `nodejs_compat`), React 19.2.6, three 0.185.0 installed but unused, Tailwind 4.2. Sizes below are min+gzip, measured locally with esbuild (peers externalized) unless marked "bundlephobia".

---

## A. Gamification theory digest

**Octalysis (Yu-kai Chou)** — 8 core drives: Epic Meaning, Accomplishment, Empowerment/Feedback, Ownership, Social Influence, Scarcity, Unpredictability, Loss & Avoidance. Drives 1–3 are White Hat (empowering, slow), 6–8 Black Hat (urgent, anxiety-inducing). [framework](https://yukaichou.com/gamification-examples/octalysis-gamification-framework/) · [white vs black hat](https://yukaichou.com/gamification-video-course/beginners-guide-gamification-19-90-white-hat-black-hat-gamification/)
- Rule: use Black Hat (timer, streak-at-risk, mystery box) only to create urgency at onboarding/daily-return moments; make the long-term loop White Hat (mastery stats, expedition narrative, creative loadouts).
- Rule: every screen should hit at least one intrinsic drive (3, 5, 7) so it doesn't feel like a points treadmill (drives 2, 4, 6 alone = extrinsic burnout).
- Rule: audit each feature for "drift" — if a feature only works via loss/scarcity, add an accomplishment or social payoff to it.

**Hooked (Nir Eyal)** — Trigger → Action → Variable Reward → Investment. [nirandfar.com](https://www.nirandfar.com/how-to-manufacture-desire/)
- Pair every external trigger (push "Your rival answered", daily expedition) with an internal one (boredom, curiosity) — copy should name the feeling.
- The Action must be the simplest possible behaviour: one tap from lobby into a question in <2 s; no lobby modals before first play.
- Rewards of the Tribe (rank, rival reactions), Hunt (coins, rare questions), Self (mastery %); the Investment step (naming a rival, building a streak, customizing a deck) must load the next trigger.

**Reality is Broken (McGonigal)** — 4 traits of a game: goal, rules, feedback system, voluntary participation; 4 intrinsic rewards: satisfying work, hope of success, social connection, meaning ("part of something bigger" / epic wins). [SuperSummary](https://www.supersummary.com/reality-is-broken/summary/) · [NWP review](https://archive.nwp.org/cs/public/print/resource/3654)
- Make expeditions collective: "The community has mapped 61% of Astronomy" — epic meaning with zero extra content.
- Feedback must be instant and visible per question (traits 3) — never wait for server confirmation to show "correct".
- Voluntary participation: no forced daily punishment beyond streak; opt-in leagues.

**Art of Game Design (Schell)** — Lens of Flow: clear goals, no distractions, direct feedback, continuous challenge. Interest curve: hook, rising beats, climax at the end. Reward lens: right rewards, right amount, right time. [notes](https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell) · [interest curve](https://game-studies.fandom.com/wiki/Interest_Curve)
- Design a duel as an interest curve: Q1 easy hook, difficulty rises, final question double points (QuizUp does this) as the climax.
- Adaptive difficulty per category keeps players in the flow channel; expose it as "level 3 Physics" for competence feedback.
- Mix fixed rewards (XP per correct) with variable ones (rare bonus question) — fixed = fairness, variable = excitement.

**Game Feel (Swink)** — three blocks: real-time control (respond within ~100 ms), simulated space, polish. [ch.1 PDF](http://mycours.es/gamedesign2014/files/2014/10/Game-Feel-Steve-Swink-chapter-1.pdf)
- Rule: answer tap gets visual+audio+haptic acknowledgement in the same frame (optimistic UI); the server result arrives later and only *upgrades* the state.
- Rule: timers and counters must animate continuously (no 1 s jumps) — perception of a live system.

**Juice it or lose it (Jonasson & Purho, GDC 2012)** — [GDC Vault](https://www.gdcvault.com/play/1016487/Juice-It-or-Lose) · [summary](https://roblog.co.uk/2024/03/juicy-games/) · [web adaptation](https://valdemird.com/blog/game-feel-on-the-web/)
- Concrete techniques: tween everything (ease-out on entry, ease-in on exit), squash & stretch on press/land, screen shake scaled to event and settling fast (<300 ms), impact flash on the hit target, particle burst + trail, hit-stop (freeze 60–100 ms on big hits), layered SFX per action, colour flash on state change.
- For trivia: correct = green flash + pop-scale 1→1.08→1 + 12-particle burst + rising chirp; wrong = 4 px horizontal shake + red desaturate + low thud; streak milestone = confetti + hit-stop + bass hit.

**Self-Determination Theory / PENS (Ryan, Rigby, Przybylski 2006)** — autonomy, competence, relatedness independently predict enjoyment and return play. [PENS](https://selfdeterminationtheory.org/player-experience-of-needs-satisfaction-pens/) · [paper](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf)
- Autonomy: let players choose category weighting, expedition route, and cosmetics; never auto-spend their currency.
- Competence: per-category mastery bars, "personal best", clear cause of loss ("you were 0.8 s slower on Q5").
- Relatedness: rematch button, emoji reactions in duels, small friend leagues (5–10 people) rather than global boards.

**Duolingo learnings** (Jorge Mazal, ex-CPO): leaderboards raised learning time 17% and tripled highly-engaged users, auto-opt-in; streak-saver notifications and streak freeze/repair drove a ~3x rise in 7+-day-streak DAU to >50% of DAU; CURR +21% ≈ 40% less daily churn. Gems earned via specific actions and spent on streak freezes / hearts. Engineering auto-freezes streaks during outages ("Big Red Button", 2M+ streaks protected). [Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) · [Duolingo blog](https://blog.duolingo.com/protecting-streaks-from-site-issues/)
- Rules: streak = the retention core; sell/earn freezes (reduces anxiety, keeps loss aversion); weekly small leagues with promotion/relegation; protect streaks from your own bugs.

**Trivia mechanics that work**
- Kahoot: points = 1000 × (1 − (responseTime/timer)/2), max points if <0.5 s; answer-streak bonus; answers encoded by shape **and** colour. [How points work](https://support.kahoot.com/hc/en-us/articles/115002303908-How-points-work)
- QuizUp: 7 questions, 10 s each, 20 pts minus 1 per second, last question double. [review](https://www.gamezebo.com/reviews/quizup-review/)
- Trivia Crack: category wheel (chance), 3 lives refilling 1/hr, power-ups (Bomb 50/50, Double Chance, Skip, Extra Time) bought with coins, crowns as progression. [Play Store](https://play.google.com/store/apps/details?id=com.etermax.preguntados.lite) · [Grokipedia](https://grokipedia.com/page/Trivia_Crack)
- Trivia Royale (QuizUp team): daily 10-round elimination, one wrong = out, limited revives, Hint/50-50/Time Freeze, daily streak + leaderboards. [App Store](https://apps.apple.com/us/app/trivia-royale-quiz-game/id6766182512) · [Engadget](https://www.engadget.com/battle-royale-quiz-game-trivia-royale-quizup-130038696.html)
- HQ Trivia: 12 Qs, 10 s, extra lives via referral, live-show framing + chat. [UsabilityGeek](https://medium.com/usabilitygeek/what-hq-trivia-can-teach-us-about-ux-fdbefb60782e)
- Rules for Fact Duel: speed-weighted scoring with a visible decaying bar; combos at 3/5/7 correct; 2–3 power-ups max, earned not only bought; expeditions use lives + elimination tension; final-question multiplier.

**Behavioural effects → one implementation each**
- Variable-ratio reinforcement (Skinner): a "Wild Question" appears on a random ~1-in-6 basis with a random 2–5× multiplier. [review](https://www.teachboston.org/variable-reward-schedules-gambling/)
- Loss aversion (Kahneman & Tversky): hearts in expeditions + a purchasable/earnable streak freeze; copy frames risk ("12-day streak at stake") but always offers the freeze.
- Endowed progress (Nunes & Drèze 2006: 34% vs 19% completion with 2 free stamps): new accounts start the weekly league meter at 2/10 and expedition maps with camp 1 already reached. [study](https://siliconcanals.com/t-car-wash-loyalty-cards-endowed-progress/)
- Goal-gradient (Kivetz, Urminsky & Zheng 2006): as the expedition nears its end, ticks get louder/faster, the map zooms in, and the lobby shows "2 wins to promote". [summary](https://yukaichou.com/behavioral-analysis/goal-gradient-hypothesis-hull-kivetz-motivation-acceleration/)
- Zeigarnik effect (1927): allow quitting mid-expedition and pin a "Resume — 3/7 answered" card at the top of the lobby. [Product Philosophy](https://productphilosophy.com/articles/goal-gradient-progress-mechanics)
- Near-miss effect (slot research; Clark et al.): post-duel screen shows margin ("Lost by 1 pt — Q3 cost you 0.9 s") with a one-tap rematch. Use only as honest feedback; fabricated near-misses are a gambling technique. [J. Gambling Studies](https://link.springer.com/article/10.1007/s10899-019-09891-8)

---

## B. Web 3D / physics / motion stack (2026)

| Package | Latest | License | Size (gz) | React 19 / Next 16 |
|---|---|---|---|---|
| `three` | 0.186.0 (0.185 installed) | MIT | 180 kB full (bundlephobia); ~128 kB for a renderer+mesh subset | fine; client-only |
| `@react-three/fiber` | 9.7.0 | MIT | 52 kB | peer `react >=19 <19.3` — **do not bump to React 19.3 until fiber updates** |
| `@react-three/drei` | 10.7.8 | MIT | tree-shakes: `Float` 0.8 kB; Float+Environment+ContactShadows+Text 64 kB | peer react ^19, fiber ^9 |
| `@react-three/rapier` | 2.2.0 | MIT ([repo](https://github.com/pmndrs/react-three-rapier)) | **~820 kB incl. inlined WASM** | fiber 9 / React 19 ok — but too heavy for a trivia game |
| `@react-three/postprocessing` | 3.1.1 | MIT | EffectComposer+Bloom 28 kB | peer fiber ≥9.7 |
| `cannon-es` | 0.20.0 (2022) | MIT | 34 kB | unmaintained-ish; skip |
| `matter-js` | 0.20.0 | MIT | 25 kB | 2D physics; ok for coin drops if needed |
| `motion` (`motion/react`) | 13.2.0 | MIT | full `motion`+`AnimatePresence` 42 kB; `LazyMotion`+`m`+`domAnimation` 27 kB; vanilla `animate` 23 kB; `motion/mini` animate 3 kB | peer react ^18‖^19; v13 only breaking change: dropped `@emotion/is-prop-valid` ([upgrade guide](https://motion.dev/docs/react-upgrade-guide)) |
| `gsap` + `@gsap/react` | 3.15.0 / 2.1.2 | free "no-charge" standard licence incl. all plugins since 3.13 ([CSS-Tricks](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/)) | 27 kB core + 0.7 kB hook | fine |
| `lenis` | 1.3.26 | MIT | 5 kB | fine; not needed for an app-shell game |
| `@rive-app/react-canvas` (-lite) | 4.34.2 | MIT | 65 kB (lite 58 kB), files 10–15× smaller than Lottie, state machines ([Rive](https://rive.app/blog/rive-as-a-lottie-alternative)) | react ^19 ok |
| `lottie-web` / `@lottiefiles/dotlottie-react` | 5.13.0 / 0.19.16 | MIT | 79 kB / 37 kB | playback only, no state machine |
| `@theatre/core` | 0.7.2 (2024) | Apache-2.0 | 31 kB | 1.0 being built in a private repo ([GitHub](https://github.com/theatre-js/theatre)); skip |
| `@react-spring/web` | 10.1.2 | MIT | 20 kB | fine, redundant with motion |
| `@formkit/auto-animate` | 0.10.0 | MIT | 3 kB | nice for list reorders (leaderboards) |
| `canvas-confetti` | 1.9.4 | ISC | 4 kB | fine; `disableForReducedMotion: true` option |
| `@tsparticles/confetti` / `slim` | 4.4.0 | MIT | 37 kB / 30 kB | overkill |
| `howler` | 2.2.4 (2023) | MIT | 10 kB | file-oriented; skip |
| `tone` | 15.1.22 | MIT | 60 kB (Synth+Transport) | only if you want music |
| `zzfx` | 1.3.2 | MIT | **1 kB**, 20-param procedural SFX ([GitHub](https://github.com/KilledByAPixel/ZzFX)) | fine |
| raw Web Audio | — | — | 0 kB | fine |

CSS usable now ([webstatus.dev](https://webstatus.dev), [MDN @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)): container queries (widely, Aug 2025), `color-mix()` (widely, Nov 2025), `oklch()` (Chrome 111/Firefox 113/Safari 15.4), `@property` (Baseline Jul 2024), `dvh/svh` (Chrome 108/Safari 15.4/Firefox 101), same-document View Transitions (Baseline newly Oct 2025, Firefox 144). **Not** Baseline: cross-document view transitions (no Firefox), scroll-driven animations (Safari 26 only, Firefox behind flag) — use motion's `useScroll` if needed.

### Recommended minimal stack
1. **Hero 3D (home/lobby):** `@react-three/fiber` 9.7 + drei `Float`/`ContactShadows` (+`MeshTransmissionMaterial` only on desktop) on the already-installed three. ~55 kB over three. `frameloop="demand"` when idle; `dpr={[1, 1.5]}`; no postprocessing on touch devices (Bloom is a full-screen pass). Under `prefers-reduced-motion`: render one static frame or the SVG poster. Skip Rapier (820 kB); fake "physics" with motion springs; if a real coin-drop is needed, matter-js on a 2D canvas (25 kB) lazily loaded.
2. **Juice:** `motion/react` via `LazyMotion` + `m` (27 kB) for presence/layout/springs; CSS keyframes + `@property` for screen shake (`translate` on the game wrapper, 180 ms, amplitude by event), card flips (`transform-style: preserve-3d; backface-visibility`), number counters (`@property --n; transition: --n 600ms; counter-reset: n var(--n)` or `animate()` from `motion/mini`, 3 kB); `canvas-confetti` (4 kB); `auto-animate` for leaderboard reorders. Don't ship GSAP *and* motion; pick GSAP only if you need complex timeline sequencing.
3. **Sound without files:** a `useSfx()` hook over raw Web Audio: `OscillatorNode` + `GainNode` with 5 ms ramps (avoids clicks), white-noise buffer through a swept lowpass for whooshes; or `zzfx` (1 kB) with presets tuned in the ZzFX designer. Create the `AudioContext` lazily and `resume()` inside the first `pointerdown`/`keydown` (iOS suspends until a gesture); re-resume on `visibilitychange`. [Web Audio unlock](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos) · [procedural cues](https://velocaption.com/blog/procedural-audio-in-the-browser/)
4. **Haptics:** `navigator.vibrate?.([10])` on correct, `[30,40,30]` on wrong — Android Chrome/Samsung only; Safari/iOS and Firefox 129+ do not support it ([caniuse](https://caniuse.com/vibration), [W3C thread](https://lists.w3.org/Archives/Public/public-css-archive/2026Mar/0919.html)). Optional iOS hack: toggling a hidden `<input type="checkbox" switch>` via its label fires a system haptic (Safari 17.4+/iOS 18; `ios-haptics` / `web-haptics` on npm), reportedly patched in iOS 26.5 — treat as best-effort. [ios-haptics](https://github.com/tijnjh/ios-haptics) · [Ionic issue](https://github.com/ionic-team/ionic-framework/issues/29942)

### Cloudflare Workers / SSR gotchas
- This repo deploys via vinext + Cloudflare Vite plugin (`nodejs_compat`), not OpenNext; same rules apply: no `window`/`document`/`AudioContext`/`matchMedia` at module scope, only in effects/handlers. `'use client'` components still render on the server.
- Load the R3F scene with `next/dynamic(() => import('./Hero'), { ssr: false })` **from a client component** (Next 16 disallows `ssr:false` in Server Components); render a CSS/SVG poster as `loading`. [FlowQL guide](https://www.flowql.com/en/blog/guides/nextjs-window-is-not-defined-fix/)
- Keep three out of the server bundle entirely: Workers script limits are 3 MiB gz free / 10 MiB paid ([OpenNext docs](https://opennext.js.org/cloudflare)); client chunks are static assets and don't count, but SSR-importing three inflates the Worker.
- Avoid libraries that need WASM at SSR time; Rapier's `-compat` build inlines WASM as base64 (that's why it's 820 kB).
- Web Audio/vibrate need a user gesture; gate them behind the first tap and a persisted user toggle.

---

## C. Visual direction

**2026 trends:** Apple's *Liquid Glass* (WWDC25) made refraction/translucency the default premium look ([Apple](https://developer.apple.com/videos/play/wwdc2025/219/)); glassmorphism returned but restrained (overlays, menus); neo-brutalism = bold type, stark contrast, visible grid; bento grids as "active" interactive tiles; kinetic/viewport-scaled typography replacing hero images; oklch-native palettes. [Pixelmatters](https://www.pixelmatters.com/insights/7-UI-design-trends-to-watch-in-2026) · [Fireart](https://fireart.studio/blog/the-best-web-design-trends/)

**Colour psychology:** displays of red increase the actor's competitive approach and the perceiver's withdrawal ([Ten Velden et al. 2012](https://www.sciencedirect.com/science/article/abs/pii/S0022103112000698)); warm hues prompt fast decisions, cool blues/greens promote calm and focus for learning ([Affective](https://weareaffective.com/learning-centre/what-colours-psychology-should-i-use-in-my-app-design), [eLearning](https://www.dyndevice.com/en/news/color-psychology-in-elearning-how-colors-influence-learning-ELN-2141/)). → Warm accents for duel/arena surfaces; cool accents for expedition/learning surfaces; never rely on hue alone (see E).

**Trivia UIs to learn from:** Kahoot (shape+colour answer buttons, giant countdown, podium), QuizUp (dark, typographic, 10 s decay bar, topic tiles), Trivia Crack (mascots per category, wheel spin), HQ Trivia (TV-show framing, 3D animated transitions, chat), Trivia Royale (elimination tension, revive moment), Duolingo (mascot reactions, streak flame, calendar).

### Three candidate art directions (all fonts verified on Google Fonts)

1. **Stadium Lights** — broadcast scoreboard × neo-brutalism. Dark court `oklch(18% 0.02 260)`, surface `oklch(24% 0.03 260)`, hot orange `oklch(72% 0.19 45)` (sport), electric teal `oklch(80% 0.14 200)` (science), lime win `oklch(88% 0.22 130)`, magenta streak `oklch(65% 0.24 350)`, text `oklch(96% 0.01 90)`. Type: **Anton** (display, all-caps scores) + **Instrument Sans** (UI) + **JetBrains Mono** (timers/points, `font-variant-numeric: tabular-nums`). Mood: ticker tape, chunky borders, kinetic type slams, crowd-noise SFX. Why: warm competitive arousal, scoreboard literacy for sports users, thick strokes survive low-end screens and need no blur.
2. **Field Notes** — expedition journal. Paper `oklch(97% 0.01 85)`, ink `oklch(25% 0.02 60)`, forest `oklch(45% 0.12 155)`, ochre `oklch(75% 0.15 80)`, rust danger `oklch(58% 0.18 35)`, sky `oklch(70% 0.10 230)`. Type: **Fraunces** (variable, optical-size display) + **Plus Jakarta Sans** (UI) + **Space Mono** (numbers). Mood: maps, stamps, badges, torn-paper reveals, pencil-line progress. Why: cool/earthy focus for learning, light theme readable outdoors, tactile "collectible" juice (stamps, badges) with cheap CSS; distinct from every dark neon quiz app.
3. **Liquid Lab** — liquid-glass sci-arena. Void `oklch(14% 0.03 280)`, glass panels `color-mix(in oklch, white 8%, transparent)` + 12 px backdrop blur, violet `oklch(65% 0.25 300)`, cyan `oklch(85% 0.15 200)`, hot pink `oklch(68% 0.25 350)`, gold `oklch(85% 0.17 90)`. Type: **Syne** (display) + **Geist** (UI) + **Geist Mono** (numbers). Mood: refracting 3D hero (`MeshTransmissionMaterial`), gradient meshes, particle trails. Why: showcases the three.js investment and the 2026 zeitgeist; risk: backdrop-filter cost on low-end Android and contrast on glass — needs a "solid" fallback for reduced-data/low-end.

Recommendation: Stadium Lights for duels, with Field Notes texture for expeditions (one type system: Anton/Instrument Sans/JetBrains Mono; only palette shifts by mode) — keeps one design system while encoding "compete" vs "learn" in colour temperature.

---

## D. Mobile game UX rules
- Thumb zones: Hoober's 1,333-user field study — 49% one-handed thumb, 36% cradled, 15% two thumbs; put answer buttons and primary CTA in the bottom third, secondary actions top. [UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php) · [Smashing](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- Targets: Apple HIG 44×44 pt, Material 48×48 dp, WCAG 2.5.8 AA floor 24 px (2.5.5 AAA 44 px). Answer buttons ≥56 px tall, 8 px gaps. [TestParty](https://testparty.ai/blog/wcag-target-size-guide)
- Bottom nav / bottom sheets (vaul is already installed); keep the timer near the answers, not the top.
- Safe areas: `viewport-fit=cover` + `padding-bottom: env(safe-area-inset-bottom)`; full-height screens use `min-height: 100dvh` with a `100vh` fallback first (`svh` for stable lobby, `dvh` for game). [OpenReplay](https://blog.openreplay.com/fix-100vh-mobile-viewport/) · [modern-css](https://modern-css.com/mobile-viewport-height-without-100vh-hack/)
- Touch latency: `touch-action: manipulation` on buttons (kills 300 ms delay), respond on `pointerdown` for scoring, `user-select: none`, `-webkit-tap-highlight-color: transparent`, avoid layout-triggering animations (only `transform`/`opacity`).
- Haptics: see B4; always paired with a user toggle.
- Reduced data: `prefers-reduced-data` has no browser implementation ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data)); use the `Save-Data` request header / `navigator.connection.saveData` + `deviceMemory`/`hardwareConcurrency` to skip the 3D hero and HDR maps.

## E. Accessibility for juicy UIs
- Reduced motion: WCAG 2.3.3 (AAA) — under `@media (prefers-reduced-motion: reduce)` replace shake/parallax/zoom with opacity/colour changes, cut durations, stop the 3D loop, pass `disableForReducedMotion` to canvas-confetti, `MotionConfig reducedMotion="user"` in motion. Provide an in-app "Effects: full / reduced / off" setting that overrides the OS. [Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) · [OpenReplay](https://blog.openreplay.com/prefers-reduced-motion-accessible-animation/)
- Sound: default off until first gesture; separate SFX/music toggles persisted; every audio cue has a visual twin.
- Colour-blind safety: never encode correct/wrong by red/green alone — add icon (check/cross), shape (Kahoot-style triangle/diamond/circle/square per option), and motion; test palettes with Okabe-Ito references (e.g. `#E69F00` orange vs `#0072B2` blue instead of red/green). [Okabe-Ito](https://scifig.ai/blog/okabe-ito-color-palette-hex-codes) · [Game Accessibility Guidelines](https://www.abratabia.com/game-accessibility/accessibility-guidelines.php)
- Focus management for result overlays/power-up sheets: use native `<dialog>` (`showModal()` traps focus, Escape closes, background inert) or `role="dialog" aria-modal="true"` + `inert` on the app root; move focus to the heading on open, return it to the trigger on close; announce score changes via `aria-live="polite"`, and the countdown via a throttled live region (every 5 s, then each of the last 3). [MDN aria-modal](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-modal) · [accessibility.build](https://accessibility.build/guides/accessible-dialog)
- Contrast on glass/dark: check text on glass panels at ≥4.5:1 in oklch; provide a high-contrast/solid-surface toggle.
