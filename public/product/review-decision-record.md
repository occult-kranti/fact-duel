# Curiosity Arcade: review-led product direction

Research and implementation record · 12 September 2026.

## The decision

Make the website an arcade of sports and science curiosity: a fast duel, an untimed three-card Discovery, an inspectable Fact Vault, and a browser-local Passport. Choose warm cream, ink, coral, yellow and plum, with an optional original 3D lobby. Keep competition short, all activity voluntary, and stopping easy. This is the fourth private prototype release, not evidence of product-market fit.

The panel inspected **32 distinct review observations across eight selected apps**, using **35 source records** for reviews and official checks. A separate design workstream consulted **eight sources**, including three primary studies and two bounded book excerpts. Counts describe this research corpus; they do not rank products or estimate complaint prevalence. Source URLs, dates, locators, unknown app versions, positive counterexamples and access limits remain in the downloadable ledgers.

## What players' criticism changes here

| Product | Selected criticism / positive signal | Decision for this release | Remaining evidence or work |
|---|---|---|---|
| Trivia Crack | Reward prompts obstructing play; reports of ad freezes; friend play valued. TC01–03. | Home opens directly into setup; no reward-overlay sequence; results have a Vault destination. | Interrupted remote play must be observed on real networks. No ad SDK is installed. |
| Sporcle | Reports of active-quiz interruptions and missing result screens; variety valued. SP01–03. | Static timed surface; explicit mode/timer preview; three modes and untimed Discovery. | Actual touch, zoom and completion observations remain pending. |
| Quiz Planet | Reported timeout confusion and transition taps; answer comparison appreciated. QP01–06. | Background/reload cancellation is disclosed; one answer; tap/click release; comparative receipts after closure. | Physical input testing; question-report and correction workflow still planned. |
| QuizDuel | Historic complaints about repeated questions and waiting; fast matching valued. QD01–04. | Clearly labeled random bot; explicit friend waiting; stable fact IDs prevent duplicate collection credit. | Across-room exposure-aware deck selection is not implemented; sample repeats remain possible. Current official Teams docs qualify old club requests. |
| Duolingo | Energy/progression confusion and dislike of pressure, with mixed preferences. L01–04. | Finite missions without daily decay; no energy gate; local activity titles; untimed entry before a first duel. | Activity points do not establish mastery or retention improvement. |
| Kahoot! | Player-screen visibility was hard to discover; easy competition enjoyed. L05–07. | Full prompt and all answers on each screen; readiness and rules visible; competition remains optional. | Official player-screen and accessibility controls already exist in Kahoot; this is a discoverability lesson. |
| Quizlet | Reported interruptions, lost progress and ambiguous paid limits; organization valued. L08–12. | Atomic browser writes, unified export/reset, stable recall deck, saved facts, explanation/source links. | Versioned corrections and cloud recovery remain planned. Alleged Welsh errors do not establish AI authorship. |
| Brilliant | Some want deeper explanations; others value examples and support. L13–16. | Keep a source and explanation with every encountered fact; make review and ending direct. | Explanation usefulness and learning outcomes require user observation. No subscription is offered. |

Read the two review briefs for the direct citations and official counterchecks behind each row. A reported symptom is not an independently reproduced competitor defect. Severity is the panel's inference about the consequence of an equivalent failure here.

## What is implemented

| Surface | Implemented interaction | Gamification purpose and boundary |
|---|---|---|
| Play lobby | Bot, Friend and Join; three format tickets; selected topic; CTA before advanced filters and art on mobile. | Begin promptly; no fabricated activity or human presence. |
| Original 3D stage | Static artwork first; explicit Explore in 3D; rotate buttons, optional spin, return to static. | Express curiosity. Loaded on demand, capped resolution, removed before create/join; no answer depends on WebGL. |
| Explore | Nine collection cards and actual sample counts; collection choice clears incompatible filters. | Pick an interest; stamps count encountered facts, never expertise. |
| Discovery | Three sourced, untimed four-choice cards; explicit answer, explanation, save, next and finish. | First-time visitors can complete a full learning-oriented loop without a duel. Open teaching content shares the sample bank. |
| Timed duel | Quick Draw, Triple Threat and five-round Gauntlet; unchanged random bots and settlement. | Correctness first, then reported screen duration with a 150 ms draw band. Casual simulation only. |
| Results | Shared outcome and timing receipt; optional explanation opening, bookmark, Vault and finish. | Feedback has an exit; no automatic rematch or pop-up reward chain. |
| Passport | Five activity titles, three finite missions, four previewable card finishes including the default. | Guaranteed cosmetic rewards. No timer, answer, coin or content advantage. |
| Fact Vault | Encountered facts, saved filter, frozen untimed recall deck, sources, recent completed matches and export. | Revisit material without implying durable learning from a click. |
| Settings | Optional synthesized sounds/volume, two themes, lobby artwork, unified export and confirmed reset. | User control. Reset describes all affected local activity; coins are separate room simulations. |
| Product Studio | Current decisions, searchable review table, detailed briefs, source ledger and editable issue plan. | Operational clarity; statuses are plans and evidence, not live analytics or running agents. |

## Exact activity contract

A new stable fact ID earns 10 activity points. The first explicit explanation opening earns 5. The first untimed attempt on that fact, whether in Discovery or Vault recall, earns 5. Correctness is feedback and does not change this cosmetic award. Replays and duplicated callbacks do not multiply the award. The internal `recalled` field covers either untimed route; the interface calls the combined measure “untimed attempts.” The Vault deliberately draws from encountered facts; Discovery can also repeat the shared sample.

First expedition requires a completed duel or an untimed attempt, an opened explanation, and an untimed attempt; it unlocks Orbit. One eligible Discovery answer may satisfy both matching attempt conditions. Field notes requires five distinct facts, three explanations opened and three distinct untimed attempts; it unlocks Grid. The mode tour requires one completed match in each existing mode; it unlocks Rally. All conditions are visible, indefinite and optional. Cosmetic finishes never alter timed controls. There is no daily streak loss, random reward purchase, global rank or paid restoration.

IndexedDB serializes local profile changes, with a BroadcastChannel/focus refresh across tabs. A separate bounded stable-ID ledger preserves awards beyond the rolling 200-round/100-match journal. The ledger accepts at most 1,200 fact IDs; this is a private-sample bound, not an account-scale design. Existing v3 journal entries migrate without inventing historical activity credit. New settled results expose stable IDs; active competitive questions do not expose them. Reset uses seat generations, not comparisons between browser and server clocks. Exports wait for pending writes and refresh persistent state. Storage failures are disclosed; this browser's record is editable and is not trusted competitive state. There is no cross-device sync or import/restore UI.

## Advisor panel and two loops

| Workstream | Assignment completed | Output / integration |
|---|---|---|
| Team lead | Own implementation, reconcile evidence, make tradeoffs and integrate review fixes. | This decision record, source, issue baseline and private release. |
| Trivia review panel | Inspect four direct trivia competitors and official qualifications. | 16 observations; 17 sources; dated review brief and JSON. |
| Learning review panel | Inspect four adjacent learning products and help documentation. | 16 observations; 18 sources; dated review brief and JSON. |
| Experience panel | Translate primary studies, book excerpts and accessibility guidance. | Eight-source experience direction and screen contracts. |
| Art specialist | Create an original tactile sports/science still for static fallback. | One generated image; WebP asset; recorded prompt. Procedural Three.js scene implemented by lead. |
| Skill application panel | Forward-test the installed Review-led Game Design skill on the raw evidence. | Six prioritized requirements with explicit unverified/observed gates. |
| Independent advisor | Critique before implementation, then inspect changed source and targeted regressions. | Two review reports; fixes for reset clocks, queued export, stable recall, mission routing, labels and target sizes. |

Loop 1 identified 11 implementation hazards, including text-based identity, rolling-history award loss, replay inflation, reset scope, timed input, 3D overhead and stale Studio claims. The lead implemented stable settled IDs, a transactional profile, bounded persistent awards, finite cosmetics, untimed first-use content and opt-in 3D outside rooms.

Loop 2 inspected the implementation. Reset clock dependence was replaced with a generation captured before create/join requests. Exports now queue behind load/writes and read current storage. A successful reset can replace an ahead-of-storage temporary branch; failed durable deletion reports failure. Vault recall uses a snapshot deck so other-tab inserts cannot change a question under a chosen answer. Mode-mission navigation exits Join view. First-time Discovery activity is called an untimed attempt, and mobile control targets were restored to at least 44 CSS pixels. See the advisor report for exact review scope and final disposition.

The reusable Review-led Game Design skill was created, validated, installed and exercised on the evidence. It encodes source limits, review-to-requirement translation, state contracts and separate automated/observed gates. It does not run continuously. The panel was bounded delegated work during this session, with the lead integrating all code.

## Execution order and evidence gates

1. Complete review research and official checks; retain positive and mixed counterexamples. Done in this session.
2. Choose the product promise, palette, screen contracts and activity definitions. Done; hypotheses remain labeled.
3. Add stable identities, persistence and reset/export behavior before cosmetic progression. Done; targeted reducer and database tests.
4. Build Discovery, Passport, Vault and game-first responsive lobby; add optional static/3D artwork. Done in source.
5. Run advisor loop 2 and resolve concrete defects; update current Studio and preserve historical v3 work. Done after final reinspection; exact results live in the review record.
6. Run engine/HTTP/bot/journal/profile tests, TypeScript and the production build; save and publish the private version. Release evidence is recorded with the build.
7. Observe permitted testers on 320–430px phones, keyboard, screen reader, 200% zoom, reduced motion and weak WebGL devices. Pending; source checks are not these observations.
8. Observe two distant screens, hidden/reloaded pages, delayed receipt and reconnection; document the causal timing limits. Pending; current local tests are not WAN measurements.
9. Build question reporting, versioned corrections and exposure-aware selection; research 120 approved fact families before expanding rewards. Pending with editorial and content gates.
10. Run a consented first-session cohort, separate bot and human return, then decide content/account/transport investment. Pending; no retention, TAM conversion or commercial performance is measured by this redesign.

The detailed issue plan supplies role owner, priority, dependencies, acceptance evidence, current evidence and next action per issue. Status/notes can be edited and exported in Studio. Local edits are not a promise that a team or automation is running in the background.

## Resource use and limits

The interface uses open-source Three.js 0.185.0 (MIT), the existing React/Radix stack and Lucide icons. The scene is procedural; no commercial model, copied competitor layout or third-party sound library was imported. Sound cues are synthesized with Web Audio and off by default. The static composition is original generated artwork. Licenses for new runtime/test dependencies are included with the project; the image prompt is retained.

Only accessible book excerpts and source passages were read. The panel did not read every book, inspect all apps, access proprietary competitor code, reproduce competitors' complaints, or measure the new interface on physical devices. The outcome is a research-informed implementation with transparent limitations, not a proven best-in-class or zero-latency system. A 150 ms draw band and transport checks cannot authenticate an unmodified browser; the 54-question teaching sample is not secret. The existing market model remains an illustrative future scenario.
