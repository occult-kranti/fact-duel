# Advertising review: gully redesign

## Round 1: code-derived findings and decisions

Reviewed the baseline local `RoomScreen`, human `LiveDuelScreen`, shared H5 provider, completion cadence, static transport and existing ad gates. This is an AI technical review, not observed participant research or publisher certification.

| Finding | Evidence | Impact | Decision / owner | Acceptance check |
| --- | --- | --- | --- | --- |
| H5 disposal reloads, but local practice rooms exist only in memory | `lib/duel-client-static.ts`, `editions/hisaab/app/ads/game-runtime.mjs`, `app/screens/room-screen.tsx` | Closing an activated bot ad could discard the result while claiming it was saved | Remove H5 invocation from local `RoomScreen`; gameplay/ad reviewer | Local result cannot mount completion break; human server screen retains its gated break |
| Future display locations need review without accidental activation | User brief; existing JHK build has H5 configuration but no manual display adapter | Adding a global SDK could leak activity into timed play | Add pure semantic development preview; gameplay/ad reviewer | Default and production render null; explicit dev preview has no network element, interactive CTA or executable dependency |
| Mobile ad placement can conflict with bottom navigation or replay | Design inference from persistent mobile controls | Accidental clicks and displaced controls | Specify normal-flow footer slots, 150px separation, no active-game serving; integration owner | Later browser geometry and network checks on actual provider test inventory |

## Implementation

- Added `app/ads/display-placement.tsx` and CSS: `home-footer`, `learn-footer`, `results-footer`; no SDK or real unit; opt-in development preview only; absent DOM/gap by default.
- Preview sizes: below 360px 250×250; 360–767px 300×250; desktop up to 728×90; widths bounded by container. Actual inventory must fit without scaling or cropping.
- Removed local-result completion-break import and mount. Human results remain server-recoverable and retain existing default-off gates.
- Added root `ad_placement.md` with official Google sources, exact flags, placement map, display/H5 distinction, root `ads.txt`, CMP, Auto ads, no-fill, recoverability and rollout QA.

## Verification scope

`tests/gully-ad-placement.test.mjs` executes the real transpiled display component. It checks default-off output, production suppression even with preview requested, semantic noninteractive previews for the three valid slots, invalid-slot rejection, no advertising/network elements or executable ad imports, local H5 removal and human-path preservation. Relevant existing completion-cadence and ad tests remain applicable; server recovery with real provider inventory remains a future integration gate.

Executed `node --test tests/gully-ad-placement.test.mjs tests/cricket-completion-ad.test.mjs tests/hisaab-game-break.test.mjs`: **16 passed, 0 failed**. This includes consent/approval denial, duplicate cadence, no-fill, SDK timeout, consent revocation and late-callback lifecycle tests using simulated providers.

## Round 2

The gameplay reviewer inspected the integrated changed source and confirmed: both display mounts omit preview and render null; no local completion H5 path remains; the human-result path retains its existing approval/consent gates. No remaining concrete ad blocker was found for the default-disabled release. Browser zero-network verification is recorded in VERIFICATION.md. No real ad account or consent configuration was activated.
