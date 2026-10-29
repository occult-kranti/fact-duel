# Two-round design and implementation panel

Baseline: main d1eed51fce9ca981b569014fa5cd9cb1f774f6fc. Three independent AI reviewers: task flow/cognition, gameplay/edge cases/advertising, visual/accessibility/mobile performance. Root moderated and implemented shared components; reviewers owned isolated navigation, ad and design-tool files. These perspectives are AI reviews, not licensed professional endorsements or observed user research.

## Round 1: diagnose→implement

| Finding / evidence | Impact | Decision and owner | Acceptance |
| --- | --- | --- | --- |
| Home→live desk→checkbox→Play now | Exceeds under-two-click start | Root: primary direct zero-stake local cricket; explicit human secondary | One click reaches four answer options without modal |
| Fragmented route links and duplicate footer content | Tools hard to find; labels do not match destination | Flow reviewer: five task groups, contextual directories, distinct online rules/coin/trust/timing | Every route reachable and selected group accurate |
| React busy state alone protects create | Same-render rapid input can clear drafts twice | Root: synchronous createFlight before draft reset/await | Rapid launch/replay yields one active game |
| H5 disposer reloads in-memory result | Could erase local result upon future ad activation | Gameplay reviewer: remove local H5; default-off display-only previews; document lifecycle | Local result cannot load SDK; human gates retained |
| Generic live heading selector overrides question title | Long mobile questions are oversized | Root: scoped working-screen typography and full-width answer buttons | No overflow or covered controls |
| 38px appearance target, AT-hidden clock | Harder input and missing timed status | Root:44 px chrome, discrete start/10s/5s notices | Keyboard/AT structure retained |
| Figma unavailable per user | Need editable design artifact | Visual reviewer: real MIT Excalidraw package, native scene and genuine SVG export | Scene opens in actual editor |

## Round 2: changed artifact→correct→verify

Reviewed changed source and desktop/phone/landscape screenshots. Root fixed the following in one bounded batch:

| Finding | Decision | Acceptance |
| --- | --- | --- |
| First-play inherited5-second Gauntlet clock with extreme questions |30-second bot-only reading timers, simple cricket opening pool; speed settings retained | Actual UI30s + simple; full five-round service test; competitive timers unchanged |
| Event mode selection still routed through arena→human desk | Route selected events to custom practice | Event and topic choice preserve local configuration |
| Progress rendered all collections/quests | Visual reviewer grouped optional data under native details | Core record visible; five collapsed categories open by keyboard |
| Short landscape hid first CTA below fold | Compact short-height hero |844×390 primary visible without scrolling |
| Directory detail text ran into its label | Stack detail under label; retain44 px controls | Labels readable, no overflow |

Gameplay reviewer found no remaining concrete blocker in duplicate-input guard, answer-lock preservation or disabled ads. Flow reviewer confirmed all existing routes remain reachable. Visual reviewer calculated day body 13.96:1, muted 5.55:1, CTA 4.84:1, accent text 5.40:1 and night muted 8.45:1/CTA 7.97:1 for the specified tokens. These are token calculations, not a complete WCAG conformance audit.

Browser tests and release checks are recorded separately in VERIFICATION.md. No third aesthetic review loop is planned. Human usability studies, physical mobile/audio devices, real publisher inventory and large live human concurrency are outside this verification.
