# Cricket art and sound provenance

JHK's cricket result moments are original artwork and synthesis. No Clash of Clans, Clash Royale, Supercell characters, logos, effects, music or broadcast clips are included.

## Runtime result moments

`app/cricket-fx/cricket-outcome-moment.tsx` contains original SVG bat, red leather ball, three stumps, two bails, crease, boundary rope and pennants. Four finite CSS scenes represent a win, loss, close loss and draw. These are visual metaphors; the component never decides or changes a quiz result. Scores remain in the authoritative result card.

The inline scene lasts at most 2.6 seconds, includes Skip, and leaves result actions available immediately. It runs only after settlement, excludes forfeits/cancellations, and deduplicates a stable result ID within the page session. Reduced-motion and effects-off preferences show the final static scene. No artwork moves answer controls or animates during a live question.

`app/cricket-fx/cricket-audio.ts` synthesizes a bat/leather crack, wooden bails, applause and an abstract filtered-noise stadium cheer. It uses the existing gesture-unlocked game audio context, sound/volume settings, visibility checks, and a compressor. It never starts audio without an already running context. There are no samples or recorded voices. Losing scenes use quiet bails and a sympathetic stadium breath, without a victory fanfare or shaming language.

## Generated editorial illustration

`public/art/cricket-outcomes.webp` is an original image generated for this JHK release with OpenAI ImageGen, then resized to 1600 pixels wide and encoded as WebP with alpha transparency. The three independent vignettes show a boundary shot, broken bails, and a close run-out at the crease. It is used for the canvas and pitch presentation; exact gameplay graphics use SVG geometry.

Direction: original miniature clay and painted wood, warm ivory, petrol ink `#122c35`, teal `#087f7a`, saffron `#ffbd59`, red stitched cricket leather. No people, lettering, logos, watermarks, trophies, broadcast footage or game characters. The generation prompt explicitly required original art without imitation of a specific artist or existing Clash assets.

## Visual research references

The following primary collection pages informed the pavilion, honours-board, crafted-wood and cricket-equipment direction. They are references only: no images from them are downloaded, traced or redistributed.

- [MCC Heritage and Collections](https://www.lords.org/mcc/heritage-collections/what-we-do)
- [Lord's Craft and Arts Collection](https://www.lords.org/lords/lord-s-experience/tours/craft-and-arts-collection)
- [Lord's Originals](https://inside.lords.org/lords-originals)

An image search for cricket bat/ball/wicket museum illustration was used to inspect equipment silhouettes. Stock image results were not downloaded or used. This document grants no licence to external source images.

## Review criteria

1. Cricket semantics: three stumps and two bails; near-loss bat stops short of the crease; no invented score labels.
2. Player dignity: warm acknowledgement after loss, no mocking voice or animation, immediate next-action access.
3. Accessibility/performance: finite transforms, static reduced-motion state, 44-pixel Skip target, no autoplay context creation, sound preference and hidden-tab cleanup.

## Three review rounds completed

1. Source and game semantics: implemented authority-separated outcome classification, cancellation/forfeit suppression, a bounded deduplication gate, and finite inline art. Five Node tests cover unfinished results, valid and invalid close-loss scores, duplicate receipts and the duration cap.
2. Cross-role review: the game-design/research role passed loss dignity, voluntary retry language, no fake consolation rewards and preference-aware playback. UI review replaced the phase-strip phrase “Shared honours” with “Final scorecard” to avoid implying every team result was a draw. Server review identified `no-contest` as the empty-fixture suppression value.
3. Executed browser review: CUA used the actual component inside the actual `FxProvider`, in a 390-pixel iframe with synthetic fixtures and no profile, consent or server operations. Boundary, wicket, run-out and raised-bats draw art were visually inspected. A content-box overflow found in this pass was fixed in the component; the resulting card measured 358 pixels wide, ending at x=374 inside the 390-pixel viewport. Skip was clicked successfully. Replay was clicked while the moment still had its running class and visible Skip. Reduced motion produced computed `animation-name: none`, no running class and hidden Skip. Effects off was selected through the real preferences setter; its persistence regression was fixed and covered by an additional round-trip test. Cancelled, forfeited and unsettled cases each rendered zero moments. Sound mute/unmute controls responded, and the existing audio context became running only after a gesture. Auditory loudness was not measured in this browser review.

Validation: `node --test tests/cricket-outcomes.test.mjs tests/cricket-prefs.test.mjs` passed 6/6. The FX TypeScript and targeted ESLint checks passed. The isolated QA harness is excluded from production publication.
