# Pocket stadium — visual and physics panel

29 October 2026. AI design review, not a study with human participants. Baseline: `71c017e1b31c17c6bf4b43b601395830d5dd294e`.

## Round 1: diagnosis and implementation

The baseline home used a single risograph illustration and a paper match-poster layout. Source inspection found a fast primary action and protected timed-answer surface, but no stadium environment, spatial response or direct manipulation of cricket objects. The user asked for a stronger mobile stadium world. The redesign keeps the fast action while replacing the scenery.

| Finding | Evidence | Decision and owner | Acceptance |
| --- | --- | --- | --- |
| Hero feels like a poster rather than a place | `home-screen.tsx` used a single static `gully-cricket.webp` figure | Visual squad builds `StadiumScene`; root supplies new day/night art and mounts it | Scene changes with existing saved day/night setting; failed image does not prevent play |
| Heavy 3D would put rendering ahead of the first question | Existing optional Three/physics dependencies are already substantial | Use native CSS perspective, geometric pitch objects and requestAnimationFrame only during an explicitly started shot | No new WebGL, physics package, device sensor or permission required |
| Motion must not compete with answering | Baseline `QuestionStage` deliberately has no decorative live animation | Full scene and toy stay outside timed play; compact `StadiumOutcome` appears only after a final result | No moving scenery over options, timer or answer lock |
| Physics needs an understandable input and feedback | A scenery-only scene would not satisfy requested interaction | Optional Net practice: Start delivery, then Swing near the highlighted timing zone | Actual elapsed contact time determines launch energy and a ballistic trajectory; result is labelled simulated and never writes quiz score |
| Reduced-motion users need the same toy outcome | W3C motion guidance and existing app motion settings | OS preference or in-app reduced/off shows a timing slider and Play shot | Keyboard-adjustable slider around65% gives a six without animation; preference changes are observed live |

## What is implemented

`app/screens/stadium-scene.tsx` exports:

- `StadiumScene({className?, compact?, interactive?})`: original day/night art, small CSS 3D pitch, stumps, bat and ball, restrained mouse-only perspective. `compact` fits a home hero; `interactive={false}` removes the optional toy completely.
- `StadiumOutcome({correct, roundKey?})`: a small after-answer cricket flourish. It is illustrative feedback; it does not add six to the quiz score.

`lib/stadium-physics.mjs` models launch speed from contact accuracy, a38° launch angle and gravity9.81m/s². It samples a closed-form ballistic trajectory with bounded time. Timing accuracy produces zero, one, four or six simulated runs. This is an arcade model, not a validated cricket-ball aerodynamic simulator. No real-world fourth spatial dimension is claimed: the requested “4D” feel is implemented as depth plus time and response to input.

The scene is still until direct interaction. Mouse perspective ignores touch, so mobile scrolling is not captured. There is no device orientation listener. Shot frames stop when complete, when the disclosure closes, when the tab becomes hidden, or when the component unmounts. Hiding the tab resets the shot and announces that a new delivery is needed. OS and in-app motion preferences are combined; reduced/off cancels movement and offers a static, keyboard-operable timing input. No animation runs in a live quiz question.

Artwork is decorative, empty-alt and sized to preserve the scene footprint. Existing static-build URL rewriting handles `/art/stadium-day.webp` and `/art/stadium-night.webp` under the project path. Images can fail without disabling either the quiz or the warm-up controls. Native `img` is deliberate for this static deployment; lint reports the normal Next image-optimization advisory.

## Source-informed design judgments

These primary sources inform the choices; they do not certify this particular design or prove retention improvements.

1. Don Norman, [The Design of Everyday Things, Revised and Expanded](https://jnd.org/books/the-design-of-everyday-things-revised-and-expanded-edition/) and [author's preface](https://jnd.org/preface-design-of-everyday-things-revised-edition/). The author's contents explicitly cover signifiers, constraints, discoverability and feedback; the preface includes pleasure and emotion in product experience. Application here: a visible Swing button and highlighted target explain the action, while a stadium and direct feedback provide enjoyment.
2. Steve Krug, [Don't Make Me Think, Revisited — author's page](https://sensible.com/dont-make-me-think/). The third edition explicitly extends usability to mobile and desktop applications. Application here: the practice toy is secondary and optional, leaving the main play route visible and direct. This is a design interpretation, not a quantitative claim from the book.
3. W3C, [Understanding SC2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) and [C39 reduced-motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html). These support suppressing non-essential motion when requested. Application here: CSS and JavaScript both honor reduced motion and a no-animation input preserves the interaction.

## Verification and round 2

Unit tests in `tests/stadium-physics.test.mjs` verify the ballistic apex/ground point, the relationship between contact accuracy and energy, finite bounded positions and invalid timing inputs. Both pass. The scene has zero ESLint errors (two native-img advisories). Integrated mobile browser review belongs to the shared verification panel and is recorded separately; unit tests are not a physical-device usability study.

Round2 source review caught one integration issue before browser capture: the first reduced-motion subscription only followed the operating system. The verifier identified the app's additional `data-motion` preference. The implementation now observes both, updates live, and applies the same suppression in CSS. This correction was made in the actual component, not only in a report.

Round2 integrated screenshot review inspected `verification/pass1/day-home-390.png`, `night-home-320.png`, `day-home-1440.png`, `question-320.png` and `nets-reduced-390.png`. The stadium reads as a place on both phone themes; the primary action is distinct, and the live-question view contains no scenery. The Net practice controls fit the narrow screen, and the result identifies its separate simulated distance. The verification squad confirmed65% timing yields six with reduced motion and toggling the app motion preference cancels an active delivery. Its first Nets full-page capture includes a fixed-header capture artifact caused by taking the screenshot after automatic control scrolling; that artifact is not treated as layout evidence. A missing chilli glyph in the separate home Spicy panel and the stale Art collection route label were reported to root for correction. No further scene styling changes were justified by the bounded review.
