# FACT//DUEL product UX review — loop 2

Date: 12 September 2026. Independent advisor review of the in-progress implementation in `/workspace/sites/fact-duel-online`. Files inspected: `app/arena.tsx`, `app/journal.tsx`, `lib/journal.mjs`, `app/collections.tsx`, `app/globals.css`, `lib/server/room-engine.mjs`, existing test references and package metadata. Product Studio was intentionally excluded because the root agent was still implementing it.

**Scope:** read-only source review plus direct, deterministic Node checks of existing functions. No Site code was edited. No browser, rendered screenshots, actual sound output, assistive technology, physical phone, cross-location connection or managed-hosting load was tested. Findings below describe the snapshot inspected; root may subsequently fix them. Final publication evidence should identify those follow-up fixes separately.

## Decision

The implementation removes the major structural obstacles identified in loop 1: the mobile configuration precedes discovery, the bot can start from the main action, answer selection survives network wait, mode/coin controls expose selected state, random bots are explicit, source-backed facts enter a deduplicated local journal, and mobile mute remains visible. Gauntlet is now a real five-round backend mode rather than a planned-card placeholder.

Before calling the redesign ready for a wider accessibility or resilience pilot, fix the malformed mode acceptance, add intentional focus transitions, put the active-page cancellation rule beside the start action, and strengthen local-journal deserialization. Device usability and actual latency remain separate gates.

## Remaining findings sent to root

| Priority | Evidence | Consequence | Bounded correction / acceptance gate |
|---|---|---|---|
| P1 — new validation regression | `normalizeConfig` uses `Object.hasOwn(MODE_ROUNDS, c.mode)` without a string type check. Direct execution accepted `mode: ['gauntlet']`. | Server mode keys coerce arrays/objects, while client mode lookup uses strict string equality; malformed requests can produce inconsistent labels and break a clean protocol contract. | Require `typeof c.mode === 'string'` before the allowlist check. Reject arrays, null, objects and unsupported strings. Keep the 1/3/5 deck requirement unchanged. |
| P1 — navigation/accessibility | No `focus()` / heading refs / phase-dependent focus logic occurs in the inspected arena or journal. The new bot path removes the clicked start control; question reveal replaces the countdown. | Keyboard and screen-reader users can be left at a removed control or have to rediscover the question during a timer. A skip link alone does not solve phase transitions. | Programmatically focus a focusable phase heading or question container on actual screen changes, using `preventScroll` where appropriate. Do not refocus on polling revisions. Give journal recall a meaningful focus target after Next fact. Verify by keyboard and screen reader in the field pilot. |
| P1 — informed start | Bot creation now automatically readies the human seat; the start area discloses random choice/time but the leave/background cancellation rule is only in the Playbook. | An ordinary mobile app switch can unexpectedly cancel and refund an active round without the player having seen that behavior. | Add concise nearby copy: “Stay on this screen during the round. Leaving or switching away cancels it.” Keep one-attempt and close-result rules easy to inspect before the explicit start action. |
| P2 — journal corruption resilience | `readJournal` validates some primitives but permits object-valued `topic`, `explanation`, `sourceLabel`, and match `mode`; it also accepts a correct answer absent from options. A direct fixture confirmed these values survive parsing. | Persisted malformed data can be rendered as React object children or produce invalid recall content. This is local-data robustness, not evidence of a remote attack. | Validate every rendered field, finite timestamps, allowed modes and `correctAnswer` membership in four distinct options. Sanitize or drop bad entries while preserving valid records. Preserve the readable storage-unavailable route. |
| P2 — field boundary contrast | Source-token contrast calculation gives `--input` versus `--card` 1.99:1 in dark and 2.69:1 in light theme. Decorative `--border` is about 1.6:1 in both. | Input boundaries that rely on those edges alone may be hard to identify. Decorative separators need not all become heavier. | Make essential form-control edges or equivalent fill contrast at least 3:1 against the adjoining background. Evaluate final rendered controls; text contrast alone is not an accessibility audit. |
| P2 — touch input risk retained | Timed answers still commit on `pointerdown`; the UI now states “register on press”. Narrow phone layout stacks all four answers and can exceed one viewport with a long stem. | Starting a scroll over an answer can submit accidentally. Source inspection cannot estimate the real rate. | Keep the current timing contract explicit; run physical-phone long-question and scroll-start cases. If input events change, update timing semantics and tests with the change. Do not claim this risk is resolved by CSS alone. |
| P2 — multiple-tab local history | Journal loads once and writes the entire local-storage snapshot. There is no cross-tab merge or `storage` listener. | Two simultaneous tabs on the same browser can overwrite each other’s new journal entries or saved-state changes. Separate devices already have separate journals. | For this private pilot, state that the history is a local browser convenience and avoid a cross-device/sync promise. Before relying on durable history, use a shared IndexedDB transaction/explicit synchronization design and test concurrent updates. |
| P3 — recall shortcut affordance | Recall renders numbered `<kbd>` markers but has no numeric-key handler of its own; the global duel handler operates only while a room is playing. | Users may infer 1–4 shortcuts work in untimed recall when only Tab/Enter/click currently do. | Either add a properly scoped recall key handler with lock and input-field guards, or render neutral option labels rather than keyboard keycaps. |

## Loop 1 issue disposition

| Loop 1 target | Source review outcome | What is still unverified |
|---|---|---|
| Put play before the collection catalogue | Resolved structurally. `.match-builder` is before discovery in DOM, and mobile stacks that order. Editable default name removes mandatory typing. Bot start calls ready automatically. | The stricter “primary CTA visible without scrolling at 390 × 844” criterion was not measured. Three mode rows plus configuration still occupy substantial vertical space. Do not report an above-the-fold pass without rendering. |
| Preserve the selected answer through retries | Resolved in source: `chosen` state, `.chosen` styling, pressed state and lock icon persist while immutable pending payload is retried. | Actual tap/keyboard/failed-network visual sequence. |
| Truthful pool availability and recovery | Resolved in source: actual intersection count, mode-specific requirement, explicit “Use all topics” and “Switch to Quick Draw”. Catalogue load failure has Retry. | Long labels, open select portals and empty-state layout on phones. |
| Do not expose an unimplemented Gauntlet | Resolved by implementing it. Backend deck length and completion use a shared 1/3/5 mapping; client and WebMCP list the new mode. All nine existing topics have six questions each. | Persistent API bot/friend Gauntlet regressions should be added by the root test pass. |
| Programmatic selection and phase focus | Selection semantics resolved for mode, rival, coin and collection domain controls. Phase focus remains open. | Keyboard/screen-reader navigation through every phase. |
| Compact mobile answers and safe touch | Mobile answer grid becomes one column below 680 px; minimum answer height is 62 px; reduced motion remains present. Press semantics are stated. | Longest content at 320/390/768 px, scrolling, orientation change, zoom and safe-area effects. |
| Move technical diagnostics out of core play | Improved: connection status replaces lobby RTT, Timing Lab is secondary, explanations precede result diagnostics. | Pre-start cancellation warning remains absent in the reviewed snapshot. Result diagnostics remain expanded rather than an optional disclosure. |
| Genuine local journal and learning loop | Implemented: facts are collected at completed round observations, matches only for phase `complete`; records dedupe by round or room ID; unique recall facts dedupe by question text; export, save and explicit clear exist. No mastery or global-rank claim. | Corruption handling and simultaneous-tab writes; recall rendering and actual file export. |
| Event-based audio and mobile mute | Resolved in source: cue keys are consumed once even with sound off; enabling sound does not replay an already encountered result. Active CSS leaves header/mute present; settings are disabled during active play. Different win/loss/draw/count cues exist. | Audible loudness, browser audio unlock/resume, physical-device behavior. Volume 0 currently still schedules a very quiet minimum-gain envelope; sound-off is the reliable mute. |
| Honest roadmap stages | Not reviewed here; root was still implementing Product Studio. | Verify root’s final Studio evidence and statuses separately. |

## Direct checks executed

These checks invoked imported functions without modifying Site files. They are deterministic model/function checks, not browser or production service benchmarks.

| Check | Method | Result |
|---|---|---|
| Gauntlet plays all five even after a decisive lead | Create a 5-card room, attach deterministic bot, reveal and answer five rounds, assert phase after each | Passed: phases `between` for first four, then `complete`; final score 5–0 |
| Gauntlet draw and one-time entry scope | Same sequence with equal correct response times and 25 coins each | Passed: all five rounds played; final 0–0; balances 1000/1000; escrow 0 |
| Gauntlet winner settlement | Human wins every round with one 25-coin match entry | Passed: balances 1025/975, total 2000, escrow 0 |
| Repeated journal terminal observation | Call `recordRoom` twice with the same completed room/round | Passed: one fact record and one match record |
| Malformed mode input | Normalize config with array-valued `['gauntlet']` | Failed contract: accepted; sent to root for correction |
| Malformed journal rendering fields | Feed object-valued fields and answer outside options into `readJournal` | Failed robustness gate: retained; sent to root for correction |
| Current topic counts | Count server questions per topic | All nine topics have six questions; 54 total |
| Core text token contrast | Compute sRGB luminance ratios for final CSS foreground/background token pairs | Checked foreground, muted text, primary button text, sports/science and positive text. Lowest checked ratio 5.52:1; no blanket WCAG-conformance claim |

### Checked contrast values

| Token pairing | Dark | Light |
|---|---:|---:|
| Foreground / background | 17.18:1 | 14.73:1 |
| Muted foreground / card | 8.64:1 | 6.29:1 |
| Primary foreground / primary | 9.00:1 | 6.55:1 |
| Sports accent / card | 10.29:1 | 6.50:1 |
| Science accent / card | 9.17:1 | 6.75:1 |
| Positive / card | 11.58:1 | 5.52:1 |
| Input edge / card | 1.99:1 | 2.69:1 |

## Release statement this evidence supports

“The product redesign has received two source-review passes. Core Gauntlet and journal logic were checked with deterministic function-level cases. Root’s automated service tests, build checks and subsequent fixes are reported separately. Physical-device usability, assistive technology, actual audio behavior and real cross-location timing have not been verified by this advisor.”

It does not support calling the product production-ready, claiming empirical bot difficulty or mastery, claiming the journal is cloud-synchronized, or describing the local timing comparison as provably fair against a modified client.

## Root-fix disposition — subsequent inspection, 12 September 2026

The root agent implemented the targeted corrections after the snapshot above. This addendum supersedes the “remaining” status of the listed fixes, while preserving the original critique as an audit trail.

| Finding | Final source inspection / targeted verification | Disposition |
|---|---|---|
| Coercible array/object mode accepted | Normalization now requires a string before checking the mode mapping. Direct checks reject `['gauntlet']`, `{}` and `null`. | Resolved |
| Missing phase and destination focus | Arena now keys heading focus by room, phase, round and destination state, excludes ordinary polling revisions, waits for the question to be shown and avoids modal/hidden-page focus theft. Recall also focuses its question on study entry and next-fact changes. | Implemented; actual assistive-technology behavior remains a field gate |
| Start path lacked cancellation warning | The main start control now has nearby text stating that switching tabs, locking the phone or reloading cancels and refunds an active match. | Resolved in the start flow |
| Journal could render malformed data | Deserialization now checks all rendered text fields, finite dates, allowed modes, score shape/range, answer membership, source scheme and outcome/timing types. Independently ran all four `tests/journal.test.mjs` cases; 4 passed, 0 failed. | Rendering robustness blocker resolved |
| Essential input outline contrast | New input tokens are `#7187ad` dark and `#7486a5` light. Recomputed input/card ratios: **4.59:1 dark** and **3.69:1 light**. | Source-token contrast gate resolved; rendered-control QA remains separate |
| Recall keycaps implied numeric shortcuts | Recall now uses alphabetic labels marked `aria-hidden`, with pressed state on the actual answer controls. | Resolved |
| Background sound | Sound generation now returns when `document.hidden`; per-event duplicate guards remain. | Source behavior improved; actual audio playback remains untested |
| Concurrent-tab journal limitation | Journal visibly says to use one playing tab per browser to avoid overlapping writes. | Truthful scope for the private pilot; synchronization remains future work |

Root reported a complete 39-test pass and clean TypeScript check. This advisor independently reran the four journal cases and malformed-mode checks; it did not rerun the entire test suite or TypeScript.

### Bounded Product Studio inspection

Inspected `app/studio/studio.tsx` and its roadmap/source metadata after completion. The source contains an explicit private-playtest scope, separates research proposals from executive decisions, marks SAM as an assumed future scenario, describes local editable planning status as neither telemetry nor an unattended agent service, and retains current evidence/acceptance criteria/dependencies for each issue. Checked **40 issues, 5 milestones, 29 sources, 11 baseline items marked done**, with no missing dependency IDs. Every `/product/…` download linked from Studio exists in the source tree. The 11 completed baseline issues describe research or implementation work; mobile/WAN evidence is not represented as complete. The percentage explicitly measures tracked issues and notes that tasks differ in size, rather than claiming product readiness.

This was a bounded integrity and presentation-source check, not an independent re-verification of every research claim or a rendered Studio usability test. After this addendum is copied into the public downloads, the downloadable second review will include the final disposition.

**Release conclusion:** no remaining source-level blocker identified for the existing private, free-coin playtest. Carry the retained pointerdown scroll risk, mobile/assistive/audio behavior, real cross-location timing, journal synchronization and broader anti-abuse requirements into their explicit field/scale gates. The evidence still does not justify public production-readiness or verified competitive fairness claims.
