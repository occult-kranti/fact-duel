# FACT//DUEL Design Bible — "Floodlight" (gamification release, September 2026)

This is the executive design record for the gamified FACT//DUEL. Every screen, component, sound and
motion decision in this release traces back to a rule here. Sources: the research brief
(`research-brief.md`), the UI and engine audits, and the books/talks cited in the brief (Octalysis,
Hooked, Reality is Broken, The Art of Game Design, Game Feel, "Juice it or lose it", PENS/SDT,
Duolingo's growth notes, Kahoot/QuizUp/Trivia Royale mechanics).

## 1. Promise and posture

- **Promise:** "Know it. Prove it." — a private knowledge arena where every answer feels like a play in a
  floodlit stadium and every fact you keep becomes part of your record.
- **Posture:** white-hat first. Progress, mastery, ownership and curiosity drive the long loop. Urgency
  (timers, streak-at-risk) is used only at the moment of play and at the daily return, never as punishment.
  Everything remains honest: bots are labelled bots, ranks and XP are "on this device", coins are free
  simulated coins, no fabricated near-misses, no fake competitors.

## 2. The player fantasy

You are a **Challenger** stepping onto a floodlit court. The arena hums (3D "knowledge core" hero); the
scoreboard is alive (kinetic numbers); every correct answer lands like a point on a broadcast board.
Between matches you run **Expeditions** into sports and science stories (field-notes texture, cool
focus colours), collect **stamps**, fill your **Vault**, level up your **Passport**, climb the **Arena
Rank** and dress your player card in the **Locker**.

## 3. Core loops (Hooked → Octalysis mapping)

| Loop | Trigger | Action (≤ 2 taps) | Variable reward | Investment |
|---|---|---|---|---|
| Daily return | Streak flame + 3 daily quests on Home | "Play now" (Quick Draw vs bot) | XP, gems, quest completion, occasional Wild Round (2–3× XP, ~1 in 6) | Streak grows, quests reset tomorrow |
| Duel | "Your next match" card | Choose mode/opponent → Ready | Round win, combo, speed bonus, rank points, near-miss margin | Rematch, add fact to Vault, rank tier |
| Expedition | "Continue — 3/6 answered" (Zeigarnik) | Resume route | Bold/steady payoff, chapter camps, stamp ceremony | Stamp case, best score, next route |
| Collection | Vault count, achievement silhouettes | Open explanation, save, recall | +XP, badge unlocks, cosmetics | Passport level, titles, frames |

Octalysis coverage per screen (minimum one intrinsic drive on every screen): Home = Accomplishment +
Unpredictability (Wild Round) + Ownership (player card). Play/Room = Empowerment (choice of mode, combo
mastery) + Loss avoidance (timer decay, streak). Expeditions = Epic meaning (mapping the stories) +
Empowerment (steady/bold). Player = Ownership + Accomplishment. Vault = Ownership + Curiosity.

## 4. Progression systems (implemented in `lib/progression.mjs`)

- **XP & Levels**: curve `xpToNext(l) = round(80·l^1.55)`; titles per 5-level band (Rookie → Legend).
  Level-up = ceremony (3D medal, confetti, fanfare) + gems.
- **Streak**: local calendar days with any XP event; shields earned every 7 days (max 2) auto-protect
  missed days (Duolingo learning: freezes reduce anxiety while keeping loss aversion).
- **Daily quests**: three per day (easy/medium/hard), seeded by profile epoch + date, auto-claimed,
  bonus for all three. Quests name topics and modes to spread play (goal-gradient copy: "1 more win").
- **Combos**: consecutive correct answers in a match multiply round XP (×1.25 … ×2 at 5). The combo
  meter sits next to the answers; at 3 and 5 the screen "hit-stops" 80 ms and bursts.
- **Speed**: correct under 2 s = +15, under 4 s = +8 — shown as a decaying speed bar under the timer.
- **Arena Rank** (device-local): rank points from duel results (+wins, −small on losses, floor per tier
  once reached); tiers Bronze → Silver → Gold → Platinum → Diamond; promotion ceremony.
- **Achievements**: ~30 badges in bronze/silver/gold, silhouettes for locked, two hidden.
- **Gems & Locker**: soft currency from quests, levels and achievements; spend on frames, titles,
  banners and accent colours. Nothing is ever auto-spent (autonomy). No real money anywhere.
- **Endowed progress**: a new player's first quest starts at 1/3 done after their first answer, and
  expedition routes show "Camp 1 reached" after the first card.
- **Near-miss, honestly**: match finish shows the true margin ("Lost by one round — Q3 was 0.9 s slower")
  with one-tap rematch. Never fabricated.

## 5. Visual system — "Floodlight"

One system, two temperatures: **warm ember** for competition surfaces (duel lobby, room, rank), **cool
cyan/teal** for learning surfaces (expeditions, vault, discovery). Volt stays the brand energy colour.

### Palette (oklch, with hex fallbacks)
| Token | Value | Use |
|---|---|---|
| `--bg-0` | `oklch(13% 0.02 255)` / `#0a0e14` | page ground (midnight court) |
| `--bg-1` | `oklch(18% 0.025 255)` / `#121821` | panels |
| `--bg-2` | `oklch(23% 0.03 255)` / `#1a222e` | raised cards |
| `--line` | `oklch(35% 0.03 255 / .6)` | hairlines |
| `--text` | `oklch(97% 0.01 95)` / `#f7f6ef` | primary text |
| `--muted` | `oklch(72% 0.02 255)` / `#a6adba` | secondary text |
| `--volt` | `oklch(92% 0.23 125)` / `#d4ff3a` | brand energy, primary CTA, correct |
| `--ember` | `oklch(72% 0.19 45)` / `#ff7a2f` | competition accent, wrong (with icon), heat |
| `--cyan` | `oklch(85% 0.14 200)` / `#4ee1ff` | learning accent, expeditions |
| `--gold` | `oklch(86% 0.17 90)` / `#ffc83d` | rewards, gems, level |
| `--magenta` | `oklch(68% 0.24 350)` / `#ff5ea8` | streak flame, rare |
| `--danger` | `oklch(62% 0.2 25)` / `#ff4d4d` | destructive only |
| Light theme | invert grounds to `oklch(97% 0.01 95)` / `oklch(93% 0.015 95)`, keep accents, raise text to `oklch(20% 0.02 255)` | |

Answer options are encoded by **shape + colour + position** (Kahoot lesson, colour-blind safe):
1 = triangle/ember, 2 = diamond/cyan, 3 = circle/gold, 4 = square/magenta. Correct always adds a check
icon and volt outline; wrong adds a cross icon and a desaturated fill. Never hue alone.

### Type
- Display: **Bricolage Grotesque** (variable, 700–800, opsz) — headlines, mode names, ceremonies.
- UI/body: **Instrument Sans** (variable) — everything else.
- Numbers/timers/points: **JetBrains Mono**, `font-variant-numeric: tabular-nums`.
- Loaded from Google Fonts with `preconnect`; system fallback stacks (`Impact`-free: use
  `"Bricolage Grotesque", "Archivo Black", system-ui`), `font-display: swap`.
- Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64 (clamp with `vw` for hero display).

### Shape & surface
- Radius: 10 (controls) / 16 (cards) / 24 (hero panels) / pill for chips.
- Borders: 1px `--line`; hover/active lift via `translateY(-2px)` + shadow, never scale on layout.
- Glow: accent glows via `box-shadow: 0 0 0 1px accent/40, 0 8px 32px accent/25` used sparingly (CTA, combo).
- Glass: only for overlays (sheets, toasts): `backdrop-filter: blur(12px)` with a solid fallback.
- Bento grid on Home (desktop 12 col, gap 16; mobile single column).

### Layout & mobile
- App shell: top bar (brand, streak flame, gems, level ring, settings) + **bottom tab bar on ≤ 900px**
  (5 tabs, 56px tall + safe-area) / **left rail on desktop** (72px icon rail, expands on hover ≥ 1200px).
- Room (live match) hides the nav; answers live in the bottom third (thumb zone); timer sits directly
  above the answers; ≥ 56px tall answer buttons with 8px gaps; `touch-action: manipulation`.
- Heights use `100dvh` with `100vh` fallback; side gutters 16px minimum; no horizontal scroll ever.

## 6. Motion & juice ("Juice it or lose it" applied)

- Every press: scale 0.97 on `pointerdown`, spring back; every enter: ease-out 180–260 ms; every exit: ease-in 120 ms.
- Correct: pop 1 → 1.06 → 1, volt flash, 14-particle burst from the button, rising chirp, light haptic.
- Wrong: 4px horizontal shake 300 ms, ember desaturate, soft thud, error haptic — gentle, not humiliating.
- Combo 3 / 5: 80 ms hit-stop, ring pulse, pitch-rising combo cue.
- Match win: confetti from the top, fanfare, score numbers count up (eased), rank bar animates.
- Level-up / stamp / achievement: full-screen ceremony with a 3D medal, confetti and a single Continue button.
- Timers count continuously (rAF), never in 1 s jumps; the speed bar decays smoothly.
- Reduced motion (OS or in-app "Effects: full / reduced / off"): no shake/parallax/confetti; fades only;
  3D scenes render one static frame; sound stays unless muted.

## 7. Sound (procedural, no files) & haptics

All cues are synthesised in `lib/fx/sound.ts` (Web Audio): tap, correct (major arpeggio), wrong (soft
descend), combo (pitch rises with n), countdown/go, reveal whoosh, win fanfare, loss, draw, level-up run,
quest bell, gem ping, stamp thump, streak crackle, unlock chime, XP tick. Audio unlocks on the first
gesture. Decision: sound defaults **on** for this release (it was off before) because the sound layer is
half of the game feel; it stays silent until the first tap, and the top bar always shows a one-tap mute.
Haptics (`navigator.vibrate`, Android) mirror the sound layer and have their own toggle.

## 8. 3D (React Three Fiber)

- Home hero: the **Knowledge Core** (glowing sphere, wire icosahedron, orbit rings with sport/science
  satellites) — grows rings and brightness with level; parallax to pointer; pauses offscreen.
- Ceremonies: **Reward Medal** (gold/silver/bronze/enamel stamp) flips in.
- Locker showpiece: **Gem Vault** — Rapier physics gems dropping into a tray; loaded only when opened.
- Rules: client-only dynamic import, dpr ≤ 1.5, low poly, no network assets, WebGL/reduced-motion fallbacks.

## 9. Accessibility & honesty guardrails

- WCAG 2.5.8 targets, 4.5:1 text contrast on all surfaces, focus rings visible (volt outline).
- Overlays are `role="dialog" aria-modal` with focus trap and Escape; score changes via `aria-live="polite"`.
- Every audio cue has a visual twin; every colour meaning has an icon or shape twin.
- Copy never shames: losses are "next time" moments; streak-loss copy always offers the shield.
- "On this device" labels wherever XP/rank/gems appear in a comparative context.

## 10. Screen-by-screen brief

1. **Home (Arena Hub)**: hero row (3D core + player card with level ring, XP bar, streak flame, gems),
   primary CTA "Play now", daily quests (3 cards with progress), Continue expedition (if any), featured
   expedition, Arena Rank strip, recent XP log.
2. **Play (Duels)**: mode cards (Quick Draw / Triple Threat / The Gauntlet) with rewards preview, opponent
   picker (Lucky Guess bot / Friend / Join), topic chips, launch CTA fixed to the bottom on mobile.
3. **Room**: lobby (ready states), countdown (giant kinetic numerals), question (timer + speed bar,
   shape-coded answers, combo meter), reveal (correct/wrong juice, explanation card, XP pop), match finish
   (verdict, margin, XP & rank deltas counting up, rematch / vault / quests touched).
4. **Expeditions**: route cards as field-notes with chapter camps; run screen with confidence toggle
   (steady/bold) as a satisfying switch, camp progress, finish ceremony with stamp.
5. **Player**: level card, Arena Rank, streak calendar (last 14 days), mastery bars per topic, achievements
   gallery, stamp case, **Locker** (cosmetics + gems).
6. **Vault**: fact cards (difficulty-tinted finishes), recall lab with juice, saved and reported facts.
7. **Settings sheet**: name, sound/volume/haptics/effects, theme.
8. **Studio**: adds the gamification decision record, roadmap and advisor loops.
