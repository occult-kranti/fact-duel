---
name: gamification-advisor
description: Review checklist for the FACT//DUEL advisor loop — scores a build against the Floodlight design bible, gamification theory (Octalysis/Hooked/SDT/Game Feel), honesty guardrails, mobile, accessibility and performance, and produces a prioritised fix list. Use when asked to review, audit or advise on the gamified app.
---

# Gamification advisor loop

Inputs: the design bible (`public/product/gamification/design-bible.md`), the roadmap (`public/product/gamification/roadmap.md`), fresh screenshots from `node scripts/screens.mjs <dir>` (phone + desktop), and the code.

## Score each screen 1–5 on
1. **Hook** — is the next action obvious within 2 s? One primary CTA? (Hooked: trigger→action)
2. **Feedback** — does every action answer back (motion + sound + haptic + numbers)? (Game Feel / Juice)
3. **Progress** — is progress visible (XP bar, quests, streak, rank) with goal-gradient copy? (Octalysis drive 2; endowed progress)
4. **Autonomy & ownership** — choices, cosmetics, nothing auto-spent (SDT).
5. **Honesty** — bots labelled, "on this device", no fabricated presence/near-misses/rarity, one disclaimer max per screen.
   **Release gate (added 16 Sep 2026, from the dark-pattern audit in `docs/money/ads/lane-gamification.json`):** any
   screen exhibiting one of these is a BLOCKING finding, scored 1, regardless of the other criteria —
   N1 fabricated near-miss · N2 fake countdown or scarcity · N3 streak repair for coins/ads, alarmist streak pushes
   without a shield · N4 unclosable or fake-close ad, an ad inside a live round, an ad before the result receipt ·
   N5 confirmshaming decline · N6 silent devaluation of coins/entitlements, hidden rule changes · N7 randomised
   ad rewards, hidden bot fills, undisclosed matchmaking · N8 auto-queued next duel, overlay chains, nags ·
   N9 fake presence/activity, unconsented nudges · N10 hidden cost at the entry tap, currency bundles, a second
   currency · N11 child-directed exhortation, profiled ads to minors · N12 loss-streak difficulty rigging or any
   undisclosed "mercy" · N13 pre-selected opt-ins · N14 forced account creation before first play.
   Each maps to a competitor complaint and an enforcement authority (FTC Act §5 / Epic and Cognosphere orders,
   EU UCPD Annex I and DSA Art 25, India DPDP and the 2026 Online Gaming Rules). Vocabulary is part of the gate:
   "bet", "wager", "odds", "jackpot", "casino" on any surface is a finding.
6. **Craft** — tokens used, type scale, spacing rhythm, contrast ≥ 4.5:1, no orphan components, consistent naming.
7. **Mobile** — no overflow at 390px, ≥44px targets, thumb-zone CTAs, safe areas, bottom nav.
8. **A11y** — focus visible, dialogs trap focus, live regions for score/timer, shape+icon twins for colour.
9. **Performance** — no WebGL in rooms, lazy 3D, dpr cap, no layout thrash, bundle sanity.
10. **Timing contract** — question card untouched before the reveal marker; option order fixed; no delayed clicks.

## Output format (write `public/product/gamification/advisor-loopN.md`)
- Summary verdict (ship / fix-first / rethink) with the three biggest wins to make.
- Table: screen × criteria scores.
- Prioritised fix list: P0 (blocks ship), P1 (before advisor loop N+1), P2 (backlog). Each item: what, where (file), why (rule), how (concrete change).
- What is genuinely good (so the team keeps it).
