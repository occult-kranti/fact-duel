# Decision record — Floodlight gamification release

Each decision lists the choice, the alternatives considered, the reason, and the guardrail that keeps it honest.

1. **Evolve, don't replace, the brand.** Kept FACT//DUEL, the lightning bolt and volt/midnight; rebuilt
   everything else. Alternatives: "Liquid Lab" glass (contrast/perf risk on low-end Android) and a
   full "Field Notes" light theme (would lose the arena energy). Guardrail: contrast ≥ 4.5:1, solid fallbacks.
2. **Two temperatures, one system.** Warm ember for competition, cool cyan for learning, gold for
   rewards (colour psychology in the brief). Guardrail: never hue alone — icons and shapes always accompany.
3. **Streaks and daily quests are in.** The v6 record declined streaks citing coercion. This release
   adopts Duolingo's finding that shields/freezes keep the retention benefit while removing the anxiety.
   Guardrail: shields are earned automatically, copy always offers the shield, no notifications.
4. **Progression is device-local and says so.** XP, level, rank, gems and badges live in the
   IndexedDB profile (version 2, default-filled, sanitised). Alternatives: server accounts (no identity
   exists yet). Guardrail: "on this device" labels in comparative contexts; no client value reaches the server.
5. **Exactly-once economy.** XP derives from before/after profile diffs, not from raw actions, because
   the room projection is re-delivered on every poll. Guardrail: tests apply the same snapshot twice.
6. **Arena Rank instead of a fake league.** A ladder computed from your own results with tier floors.
   Alternative: simulated competitors (rejected as fabricated presence). Guardrail: server leagues are
   a roadmap item gated on identity.
7. **Variable reward, but transparent.** Wild Rounds (×2/×3 XP, deterministic from the round id) are
   announced during the countdown, never revealed after the fact. Guardrail: the multiplier is client XP only.
8. **Sound defaults on, silent until the first tap.** Half of game feel is sound; the mute toggle is
   always one tap away and every cue has a visual twin. Alternative: keep default off (v6).
9. **Procedural everything.** No audio or image assets for feedback: Web Audio synthesis, Canvas2D
   particles, geometry-only 3D emblems. Reason: zero asset pipeline, tiny bundle, no network fetches on Workers.
10. **3D where it delights, never where it competes.** R3F hero on Home after a static poster, medals
    in ceremonies, rapier gems only inside the Locker on demand (about 820 kB gz). A live room never
    mounts WebGL. Guardrail: dpr ≤ 1.5, offscreen pause, reduced-motion static frame, WebGL fallback.
11. **The timing contract is untouchable.** The question card mounts hidden until the double-rAF reveal
    marker, timer track has no transition, answers lock on release or keys 1–4, option order is fixed.
    All juice happens on lock and on `round.result`.
12. **Shape-coded answers.** Triangle/diamond/circle/square with four hues (Kahoot lesson) for
    colour-blind safety and faster recognition; keyboard hints stay.
13. **Mobile is the primary layout.** Bottom tab bar, answers in the thumb zone, ≥ 56 px answer
    buttons, safe areas, `100dvh`. Desktop gets a rail and a bento Home.
14. **Format the codebase.** The dense single-line style blocked parallel work; prettier now governs
    app, lib, hooks and tests. Verified token-equivalent; tests and types unchanged.
15. **Decompose before restyling.** The monolith becomes an orchestrator plus presentational screens so
    six screen agents can work at once without touching networking or timing code.
16. **Two advisor loops.** An independent reviewer scores every screen against the bible and theory
    before the release gate; fixes are dispatched, not deferred.
