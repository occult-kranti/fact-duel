# Verification — Pocket Stadium

Verified29October2026. Local candidate builds on71c017e; final release SHA is reported by the deployed release.json and Git history.

| Check | Result |
|---|---|
| Full Node test suite, both game editions and PGlite authority |1005pass,0fail,0skip |
| TypeScript `pnpm exec tsc --noEmit` |Pass |
| Independent browser pass1 |72/73; the remaining close/reset assertion raced the native details event; awaited actual state in pass2 |
| Independent browser pass2 |75/75pass;0runtimeerrors,0adrequests |
| Focused final behavioural checks |15/15real collection checks and10/10SVG sticker/mute/phase checks; no new visual-polish loop |
| Static production under real `/fact-duel/` base |Pass; oneclick,4answers,30secondtimer,4×CPUthrottle,0HTTPfailures,0runtimeerrors,0ads |
| Live server feature smoke |14/14pass; real two-way stickers, idempotency, rate/phase gates, privacy, cleanup |
| Live content table |Fourretired IDs absent;24Spicy questions present |
| Figma |Five native editable mobile frames created on Primary account; two visual reviews |

Browser coverage:320×568,390×844,844×390,1440×1000; day/night, primary above fold, source-backed Spicy exact selection, rapid launch/answer/purchase, real match rewards, equipment persistence, badge expiry, native disclosure cleanup, keyboard focus, enlarged text, Hindi chrome, missing art/offline after load, blocked local storage, reduced motion from OS and in-app preference, bot banter/cooldown/mute/hiding during questions. No ad impressions or real ad clicks were generated.

Backend activation: applied `stadium_banter_presence` and `spicy_content_curation` migrations to the existing JHK authority, then deployed `jhk-game` Edge v4. Existing custom bearer authentication remains; presence is aggregate-only. Both synthetic live QA profiles were deleted in the harness finally block. Existing rooms preserve their question snapshots.

Known limits: emulated browsers, not physical iOS/Android devices; no participant usability or screen-reader study; no broad live-load/anti-collusion certification. The optional legacy gem-vault/Three.js route still has a large bundle warning; the stadium, question and timing toy do not depend on it. Existing repository-wide lint debt remains; TypeScript and changed-component focused checks pass. No claim of real4D hardware, real money commerce, server-authoritative local cosmetics or active advertising.

Artifact evidence: `verification/pass1`, `verification/pass2`, `verification/production-check.json`, `verification/live-banter.json`, `verification/node-tests.log`. The Figma board is linked in FIGMA.md. Current source and data are persisted in Git; old Gully reports remain historical.
