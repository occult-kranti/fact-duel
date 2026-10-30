# JHK Club Wars — six perspectives, three review rounds

30 October 2026. Six AI review roles worked on shared implementation artifacts, moderated by the release owner. These are structured design and engineering reviews, not interviews with six human specialists or evidence of player satisfaction. Each role completed three bounded rounds: source/contract critique, changed-artifact critique and final evidence review.

| Perspective | Round 1 — contract | Round 2 — changed artifact | Round 3 — evidence and decision |
| --- | --- | --- | --- |
| 1. Game systems, motivation and retention | Official CoC war/roles/timing, dated player criticism, scoped motivation and UX sources. Chose a 22-member club separate from playing size. | Found two blockers: weekly draft lacked fresh home consent; incomplete preparation could leave a cup locked. | Reviewed fixes and directly read 20/20 executed focused tests, including incomplete final and real old-to-new upgrade. Both blockers resolved. Accepted scoped mechanics and consent. |
| 2. Multiplayer authority and reliability | Separate club pool, selected side, immutable battle IDs, legacy preservation and service-only command boundary. | Implemented and exercised actual Postgres lifecycle; revised recurrence and whole-cup cancellation. | 16 SQL cases plus Edge/input coverage passed; membership/roles/timing/retry/privacy and upgrade checked. Accepted server contract. |
| 3. Mobile flows, content and accessibility | Match action before roster, explicit 22 vs playing5/XI, reserves and separate functional/fun roles. | Repaired default-sheet editing while locked; disclosed replacement of prior VC/Coach; refined weekly send/accept states. | TypeScript and focused UI tests passed. Actual components checked at390/320; substitute callback and reserve tab exercised without real accounts. Accepted scoped UI; live multi-account browser journey remains unmeasured. |
| 4. Cricket art, animation and feedback | Original bat/ball, wicket, run-out and draw metaphors; respectful losses; bounded feedback after settlement. | Integrated results only; suppressed cancelled/no-contest outcomes; reused sound and motion preferences. | Classification/deduplication and motion persistence checks passed; mobile/static/reduced-motion/Skip inspection recorded in ART.md. Accepted outcome feedback. |
| 5. Visual system, canvas and responsive layout | Warm paper/ink, turf teal and saffron, pavilion banners and honours. Nine mobile states plus desktop adaptation. | Fixed illustrative local timestamps; separated role authority from recipient-consented fun tags. | Canvas interaction/390/320/desktop checks passed; actual UI layout reviewed. Accepted visual specification with illustrative data labels. |
| 6. Positioning, pitch and claim discipline | Audit historical26-slide investor deck; remove stale product and unsupported commercial assumptions. | Rebuilt14-slide editable PPTX and responsive deck around club game, onboarding, voluntary sharing and validation. | All14 slides inspected, editable text and native tables verified, package/layout checks zero findings;390/1440 web overflow/assets checked. Accepted scoped pitch. |

## Moderator decisions

- Use official23h preparation +24h battle as the initial adaptation; validate the47h commitment with actual players. CoC inspiration informs structure, not copied assets or exact combat rules.
- Keep22 club slots and fixed playing format5 or11. Reserves never add to a match score unless selected before battle. No emergency battle substitute ships.
- Captain administers; VC arranges; Coach selects. Cosmetic Bottle boy/Analyst/Keeper/Finisher/Cheer captain tags are recipient-consented, revocable and give no authority.
- Either sheet changing clears **both** early-start readiness flags. Both Captain/VC sides must reaffirm.
- Weekly drafts remain inert until fresh home send and fresh away acceptance. No silent enrollment, notification promise or scheduler claim.
- Incomplete preparation cancels a friendly or the whole cup, releases locks and awards no result. Existing live fixtures retain original clocks and frozen lineups.
- Use original cricket imagery and synthesized sounds. No purchased advantage, compulsory streak, loss humiliation or fabricated reward/return claim.

## Final release gates

- Full Node suite:1124/1124 passed,0 failures,0 skipped with PGlite enabled.
- TypeScript: passed. New components pass targeted ESLint; comparison against baseline finds no added rule findings in edited existing screens (repository-wide historical lint findings remain).
- Production static build: passed; Teams remains separately loaded.
- Backend: additive migration applied; Edge version7 active. Nine private team tables retain RLS; public/anon and authenticated callers cannot execute private team functions; service role can reach the command boundary.
- Browser: managed preview covers actual component phone widths and canvas/desktop; synthetic QA data is explicitly labelled and excluded from publication. Final live entry/links/asset smoke is recorded in DEPLOYMENT.md.

No panel vote substitutes for real target-player research. Physical-device usability, measured customer satisfaction, retention uplift, load capacity and a full live multi-account club match are not claimed.
