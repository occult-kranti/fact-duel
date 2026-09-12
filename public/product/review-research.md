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


# FACT//DUEL: inspectable competitor review evidence

Research date: 12 September 2026. This is a deliberately small convenience sample of **16 distinct public reviews across four products**: Trivia Crack, Sporcle, Quiz Planet and QuizDuel. Ten reviews display 2025–2026 dates; six older reviews supply specific interaction, fairness or purchase-history lessons. The selection supports design hypotheses and acceptance criteria. It does not estimate complaint prevalence, compare overall customer satisfaction or establish that any reported defect remains reproducible.

The strongest direction for FACT//DUEL is a short path to a duel, a stable question surface, explicit timing and a recoverable explanation of the result. Positive observations also matter: players value variety, playing with friends, fast matching and learning from answers. Those are reasons to preserve the core quiz experience while simplifying its surrounding interactions.

## How to inspect and interpret the records

Each ID corresponds to one review, including its attached developer response where visible. Store pages repeat some review text in their expanded rendering; those repetitions were deduplicated. Use the linked page and displayed date to locate the review; the JSON also records its title or distinguishing topic. The accessible pages did not expose stable individual review permalinks or review-level app versions. “US” identifies the requested storefront, not the reviewer's residence, game language or device configuration. Google Play's extracted star graphics did not reliably identify each review's rating, so individual star counts are omitted.

Severity is my inference about a comparable failure in FACT//DUEL: **high** means losing access, distorting an answer/result or undermining a purchase promise; **medium** means avoidable friction, uncertainty or unwanted social action; **positive** marks a behavior worth preserving. These are product priorities, not a clinical or statistical scale. Developer acknowledgment is not independent reproduction; generic invitations to contact support are not evidence that an issue was fixed.

## Sixteen review observations

**TC01 — Trivia Crack; Google Play; 2 April 2025.** A returning player reports ad-related freezing disrupting play with a distant friend. Etermax's 7 April reply asks for diagnostic details. **Category/severity:** reliability, high. **Requirement:** make returning to an interrupted duel deterministic, with the last accepted answer and current state restored. **Limit:** historical client version unknown; the ad connection is the reviewer's attribution. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=com.etermax.preguntados.lite)

**TC02 — Trivia Crack; Google Play; 6 September 2026.** A reviewer distinguishes distracting reward/event prompts from ads; the reply promotes Prime's trial. **Category/severity:** navigation and attention, medium. **Requirement:** put “Play duel” directly on the home screen; keep event, reward and subscription prompts outside setup and active questions. **Limit:** this reports an experience, not a measured session trace; removing ads alone is not demonstrated to solve it. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=com.etermax.preguntados.lite)

**TC03 — Trivia Crack; Google Play; 21 August 2026.** A reviewer reports black ad screens and losing the ability to spend coins on a second chance. No reply is visible. **Category/severity:** recovery and economy clarity, high. **Requirement:** show what every currency buys before commitment and explain any change to its utility. **Limit:** the purchase entitlement and app variant are unknown; official documentation distinguishes variants below. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=com.etermax.preguntados.lite)

**SP01 — Sporcle; Google Play; 4 September 2026.** A reviewer praises puzzle variety but reports unclosable ads and a black results screen. **Category/severity:** completion reliability, high. **Requirement:** save a result receipt before presenting optional follow-on content; provide a history route back to it. **Limit:** Sporcle includes many single-player formats, so the relevant transfer is completion confidence, not its scoring system. No developer reply is visible. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=com.sporcle.geneva)

**SP02 — Sporcle; Google Play; 26 August 2026.** A long-time recommender reports ads now interrupting active quizzes. **Category/severity:** interruption during play, high for a timed duel. **Requirement:** prohibit interstitial overlays between question readiness and answer lock; delay optional notices until a safe boundary. **Limit:** the public text does not identify a quiz, ad creative or installed version. No reply is visible. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=com.sporcle.geneva)

**SP03 — Sporcle; Google Play; 21 August 2026.** A reviewer alleges a shorter geography timer and badges unavailable with timing disabled. **Category/severity:** rules and accessibility, medium. **Requirement:** publish each mode's timer and achievement eligibility before entry; offer clearly labeled untimed practice. **Limit:** the alleged timer change, monetization motive and badge rule were not independently confirmed; the reviewer also refers to the website. No reply is visible. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=com.sporcle.geneva)

**QP01 — Quiz Planet; Google Play; 8 August 2026.** A reviewer reports round losses after setting the phone aside during an ad and unresolved question reports. Lotum's 12 August reply confirms inactivity timeout and says corrections take time. **Category/severity:** timing and content trust, high. **Requirement:** show interruption rules and a question-report receipt with review status. **Limit:** no disputed question text is supplied; neither its correctness nor the exact timeout was verified. [Review and reply](https://play.google.com/store/apps/details?hl=en_US&id=com.lotum.quizplanet)

**QP02 — Quiz Planet; Google Play; 27 August 2026.** A reviewer cannot identify opponents after generic profile images appear. Lotum's 3 September reply attributes this to Facebook-only friends' visibility restrictions. **Category/severity:** opponent identity, medium. **Requirement:** retain a recognizable in-product opponent identifier; explain unavailable external profile data. **Limit:** the Facebook explanation is Lotum's statement, not independently verified Meta policy; relevance is strongest if FACT//DUEL adds external sign-in. [Review and reply](https://play.google.com/store/apps/details?hl=en_US&id=com.lotum.quizplanet)

**QP03 — Quiz Planet; US App Store; 29 March 2025.** Friend play is praised; abandoned opponents clutter turns. **Category/severity:** match lifecycle, medium. **Requirement:** distinguish active, waiting, finished and abandoned matches; allow archiving without requesting a rematch. **Limit:** reply date “Mar 18” lacks a year; feedback was forwarded, chronology unresolved. [Review page](https://apps.apple.com/us/app/quiz-planet/id1466208181?platform=iphone&see-all=reviews)

**QP04 — Quiz Planet; US App Store; 25 September 2023.** Continue taps reportedly select the next answer; comparisons are praised. **Category/severity:** input integrity, high; feedback, positive. **Requirement:** require a fresh input after transition; reveal comparative answers only after commitment. **Limit:** older iOS evidence; the 5 October reply acknowledges feedback without confirming a fix. [Review page](https://apps.apple.com/us/app/quiz-planet/id1466208181?platform=iphone&see-all=reviews)

**QP05 — Quiz Planet; US App Store; 18 October 2023.** History and ad-funded retries draw criticism; ads reportedly close. **Category/severity:** competitive transparency, medium; ad behavior, counterexample. **Requirement:** expose historical results and keep competitive answer opportunities equal. **Limit:** the 23 October reply describes Facebook statistics testing; neither experience generalizes across variants. [Review page](https://apps.apple.com/us/app/quiz-planet/id1466208181?platform=iphone&see-all=reviews)

**QP06 — Quiz Planet; US App Store; 14 January 2024.** An enthusiastic reviewer reports score checks sending nudges. **Category/severity:** social consent, medium. **Requirement:** viewing a profile must be read-only; put reminders behind a separate, labeled action. **Limit:** the 23 January reply acknowledges feedback without confirming notification logic or a repair. [Review page](https://apps.apple.com/us/app/quiz-planet/id1466208181?platform=iphone&see-all=reviews)

**QD01 — QuizDuel; US App Store; 10 June 2025.** The reviewer praises fast matching and variety, and requests clubs. **Category/severity:** matchmaking, positive. **Requirement:** preserve a clear, fast route to an appropriate opponent while exposing their type honestly. **Limit:** their belief that opponents are real is not a bot audit. Their club request is historical: current official help describes Teams. No reply is visible. [Review page](https://apps.apple.com/us/app/quizduel-trivia-quiz-game/id1484354626?platform=iphone&see-all=reviews)

**QD02 — QuizDuel; US App Store; 17 September 2021.** A reviewer says close repeats reward remembered button presses; the 23 September reply acknowledges feedback. **Category/severity:** question freshness and fairness, high. **Requirement:** track per-player exposure and prevent near-term repeats in competitive play. **Limit:** frequency is a personal estimate, and this old review does not establish the current pool or selection algorithm. [Review and reply](https://apps.apple.com/us/app/quizduel-trivia-quiz-game/id1484354626?platform=iphone&see-all=reviews)

**QD03 — QuizDuel; Google Play; 17 June 2021.** A broadly positive reviewer dislikes waiting for an opponent and appreciates modes that avoid the wait. **Category/severity:** synchronous expectations, medium. **Requirement:** label “live” versus “take your turn later” before matching, with visible waiting status and a bounded exit. **Limit:** this is dissatisfaction with a mode's pacing, not evidence of broken matchmaking. No reply is visible. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=se.maginteractive.quizduel2)

**QD04 — QuizDuel; Google Play; 7 December 2020.** A reviewer says an update replaced previously paid ad removal with renewed ads and subscription demands. **Category/severity:** entitlement trust, high. **Requirement:** describe purchase duration and scope plainly and preserve recorded entitlements through migrations. **Limit:** this is a historical allegation, not a current price or verified contract breach. No reply is visible. [Review page](https://play.google.com/store/apps/details?hl=en_US&id=se.maginteractive.quizduel2)

## Official checks that change the interpretation

The currently inspected US Android listing is titled **Trivia Crack by The Floor** and advertises a dedicated The Floor channel and recurring episodes. That confirms the current branding and product context. It does not identify any sampled review as a review of that particular mode, nor establish when a reviewer installed the current release. [Current listing](https://play.google.com/store/apps/details?hl=en_US&id=com.etermax.preguntados.lite)

Etermax's 9 June 2026 Prime help states that optional rewarded ads remain and that the subscription includes a first Classic second chance. Separately, its 15 June power-up article describes tickets for repeated chances in the ad-supported version and a coin option in the ad-free version. Therefore TC03 cannot support the blanket claim that coins never buy retries. These distinctions strengthen the requirement for visible, mode-specific benefit terms. [Prime help](https://triviacrack.help.etermax.com/hc/en-us/articles/52447169396243-Trivia-Crack-Prime), [Power-up help](https://triviacrack.help.etermax.com/hc/en-us/articles/360024775733-Power-ups)

Sporcle's current developer description confirms both free score/history tracking and Orange ad removal. A 2023 Google publisher case study describes the company's commercial reliance on advertising. Neither source confirms the alleged mid-quiz placement or timer change. Direct Sporcle help/blog searches were blocked by robots rules, so those allegations remain unverified. [Developer listing](https://play.google.com/store/apps/details?hl=en_US&id=com.sporcle.geneva), [2023 publisher case study](https://www.google.com/ads/publisher/stories/sporcle/)

QuizDuel's current help describes Teams and says its question workshop is unavailable, qualifying both the clubs request and the 2025 reviewer's assertion about submitting questions. Its ad-removal help distinguishes renewing VIP from a single 30-day offer. Another help page explicitly withholds points when an opponent quits before round three to discourage manipulation. These are documented rules, not proof of unfair settlement. The pages display relative update ages, which are preserved in the source ledger rather than converted into falsely precise dates. [Teams](https://magsupport.helpshift.com/hc/en/5-quizduel/faq/409-teams-and-team-events/), [Workshop](https://magsupport.helpshift.com/hc/en/5-quizduel/faq/118-when-will-the-question-workshop-be-activated-again/), [Ad removal](https://magsupport.helpshift.com/hc/en/5-quizduel/faq/122-how-can-i-remove-ads/), [Early quits](https://magsupport.helpshift.com/hc/en/5-quizduel/faq/116-why-am-i-not-getting-any-points-when-a-user-quits-the-game/)

## Implementation priorities and limits

For FACT//DUEL, prioritize acceptance checks in this order:

1. **Answer and result integrity:** a transition cannot accept an old tap; a question receives at most one committed answer; revisiting results reproduces the same outcome and any coin movement. Verify interrupted, expired and completed paths separately.
2. **A comprehensible duel contract:** before starting, show question count, category, timer behavior, opponent type and tie/quit handling. During play, show whose turn it is and whether the timer is running. A decorative countdown cannot substitute for defined rules.
3. **A compact play loop:** reach setup directly, finish without an overlay chain, then offer result review and rematch. Archive old matches independently of opponent contact. If a mode is asynchronous, make that expectation unmistakable.
4. **Credible questions and learning:** retain stable question IDs, sources, editorial status and exposure history. Let a player report ambiguity from the result view without losing the match receipt. Show the accepted answer and a concise explanation after commitment; do not fabricate population answer percentages.
5. **Measured optional features:** add cosmetics, clubs or reminders only once core completion works. Keep notifications intentional and competitive opportunities consistent. If payments ever exist, validate the entitlement contract independently of this review exercise.

These are proposed design requirements, not statements about FACT//DUEL's current implementation. The convenience sample is biased by English search terms, storefront selection, search ranking and whatever reviews each store exposes publicly. It overrepresents problems because searches deliberately included ads and bugs. Some older positive and mixed reviews were retained to counterbalance that focus, but this does not remove the selection bias. No authenticated play, device reproduction, private analytics, proprietary code, browser interaction or bulk scraping was used. A future validation pass should recruit actual users of the implemented modes, observe completed duels and test the specific failures above; it should not turn this sample into a market-wide complaint ranking.


# Learning-product review panel for FACT//DUEL

Research date: 12 September 2026. Scope: Duolingo, Kahoot!, Quizlet and Brilliant. This is a bounded qualitative design input, not a product ranking or estimate of how frequently users experience problems.

The strongest design opportunity is a dependable learning loop: enter a match without confusion, answer with accessible controls, understand the result, and continue practicing without an interruption that feels like a penalty. The material supports retaining competition and playful feedback while giving learners control over pressure, keeping progress intelligible, and making content corrections visible.

## Method and interpretation

I searched public reviews using product names and task-relevant friction terms, opened customer-review listings and first-person commentary, and checked the associated mechanics against official help. The final panel contains 16 distinct observations: four Duolingo, three Kahoot!, five Quizlet and four Brilliant. Every observation has a named author or handle and a visible date. Dates below distinguish publication from the reported experience when both are shown. App versions are unavailable throughout; platform is only recorded when the reviewer identifies it or the source establishes an app-store context.

Selection was purposive: detailed, actionable complaints and useful positive counterexamples were favored. This overweights problems by design. Trustpilot, public help comments, an App Store selection and an opinion article are all self-selected or editorially selected sources. Neither ratings, votes, apparent repetition nor this panel's product counts establish prevalence. No aggregate star ratings or satisfaction percentages are used. The Android Authority article is a substantial first-person critique, not an independent controlled evaluation. Its reader poll was excluded.

Trustpilot listing text was accessible, but attempts to follow individual review links returned retrieval errors; one direct HTML fetch returned HTTP 403. The citation therefore identifies the exact listing plus reviewer, a short title excerpt and dates, rather than inventing a permalink. Listings can move as reviews arrive. The JSON retains these locators and access limits. The App Store repeats some review text in its rendering; the repeated copies were counted once. Reviews about the separately operated Duolingo English Test, vague abuse, speculative company motives and competitor marketing summaries were excluded.

## Individually inspectable observations

### Duolingo: make motivation compatible with learner agency

**L01 — Megan Ellis, 1 October 2025; first-person commentary; free account, Android context, build unknown.** Ellis describes Energy running out during a third full lesson despite correct answers, and course changes introducing unfamiliar material into an existing path. She reports preserving a long streak through narrower practice rather than advancing. This is one person's experience of a rollout, not a universal lesson allowance. [Android Authority: Megan Ellis](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/).

**L02 — Logophilelass, published 6 June 2026; experience 3 May 2026; mixed, two stars.** The reviewer welcomes Energy's mistake tolerance but reports difficulty with typed answers and speech substitution. Input symptoms were not independently tested. [Trustpilot review: Logophilelass](https://www.trustpilot.com/review/duolingo.com?page=9).

**L03 — Claire Komives, published 6 June 2026; experience 5 June 2026; negative, two stars.** Repeated vocabulary allegedly appears as new. No course items are supplied for verification. [Trustpilot review: Claire Komives](https://www.trustpilot.com/review/duolingo.com?page=9).

**L04 — Mary Allan, 3 June 2026; mixed, two stars.** The reviewer credits language improvement but dislikes competitive and distressed-mascot cues. This is a preference mismatch. [Trustpilot review: Mary Allan](https://www.trustpilot.com/review/duolingo.com?page=9).

The official Energy explanation confirms that lessons consume energy, consecutive correct answers can restore it, end-of-lesson mistake review is exempt, and ads or gems can provide refills. It explicitly describes ongoing testing; it does not guarantee Ellis's three-lesson experience for every account. Duolingo's 2024 introduction also defines streaks as consecutive practice days and explains gem-purchased freezes. These are activity mechanics, not independent evidence of mastery. [Duolingo Energy](https://blog.duolingo.com/duolingo-energy/), [Duolingo introduction](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/).

For FACT//DUEL, preserve the useful part of a habit cue—a clear invitation to resume—and avoid charging a learner to recover status after an ordinary break. A duel game can still celebrate wins. A separate practice route should let someone work through mistakes without managing an energy budget. Any course or question-pack update should explain what changed and which material merits another look.

### Kahoot!: expose useful controls before the match

**L05 — Jessly Estrada, 2 March 2026; mixed, three stars.** The reviewer struggles to read a distant host's screen while playing with friends. Kahoot's contemporaneous reply explains that the host can enable questions and answers on participant devices. This is a discoverability case. [Trustpilot review: Jessly Estrada](https://www.trustpilot.com/review/kahoot.com?page=7).

**L06 — Ingrid Webster, published 3 March 2026; experience 27 February 2026; positive, five stars.** Easy setup and the competitive podium are specifically enjoyable. Competitive feedback is therefore something to preserve as an option, rather than assume every learner rejects. [Trustpilot review: Ingrid Webster](https://www.trustpilot.com/review/kahoot.com?page=7).

**L07 — cmunoz1885, 6 February 2025; critical public help comment, no star rating.** This teacher needs access for a single trimester and cannot justify an annual commitment despite liking the product. The pain concerns purchase duration and total cost, not only the monthly-equivalent figure. [Kahoot help comment: cmunoz1885](https://support.kahoot.com/hc/en-us/articles/360060150353-What-are-my-payment-and-billing-options).

Current help gives the lobby steps for showing questions and answers on participants' screens; assignments already show them by default. Kahoot also documents keyboard navigation, read aloud, extended/no-timer options and an Accuracy experience. These documents establish feature availability, not a completed accessibility audit. [Player-screen help, updated 9 September 2026](https://support.kahoot.com/hc/en-us/articles/115003197928-How-to-enable-See-questions-on-participant-s-screen-in-Kahoot-live-games), [Kahoot accessibility](https://kahoot.com/accessibility/).

Billing history requires caution: staff replies on the same help page describe annual educational billing, while another reply directs a customer to a monthly/annual toggle. Dates and contexts differ. The defensible lesson is to disclose the actual commitment and entitlements for the selected plan; the panel does not establish that Kahoot currently offers no monthly option anywhere. [Official billing discussion](https://support.kahoot.com/hc/en-us/articles/360060150353-What-are-my-payment-and-billing-options).

FACT//DUEL should make the lobby a usable readiness check: question visibility on each screen, chosen timer, scoring rule and player readiness should be obvious before the host starts. A short preview should demonstrate the selected mode. A join failure should offer a specific recovery route while retaining the player's place. Network recovery is a proposed requirement; this panel does not establish a measured Kahoot connection-failure rate.

### Quizlet: defend attention and show who owns the answer

**L08 — William Hemberg, 20 May 2026; negative, one star.** A Plus subscriber reports an unexpected test limit. Exact plan revision and test type are unknown. [Trustpilot review: William Hemberg](https://www.trustpilot.com/review/www.quizlet.com?page=2).

**L09 — Parker Parker, published 19 May 2026; experience 17 May 2026; negative, one star.** Video interruptions and sluggish scrolling disrupt assigned study. Their cause was not independently tested. [Trustpilot review: Parker Parker](https://www.trustpilot.com/review/www.quizlet.com?page=2).

**L10 — Awel, 15 May 2026; negative, one star.** Welsh study material allegedly contains errors. No disputed items are supplied, and AI involvement is unestablished. [Trustpilot review: Awel](https://www.trustpilot.com/review/www.quizlet.com?page=2).

**L11 — Charlotte Watteau, 11 December 2025; negative, one star; website context.** The reviewer describes video-ad loading delays, freezes and lost set progress. These are reported symptoms, not reproduced performance measurements. [Trustpilot review: Charlotte Watteau](https://www.trustpilot.com/review/www.quizlet.com?page=4).

**L12 — ImakeHELPFULreviews, 29 July 2025; positive with reservations; US App Store.** The reviewer values sorting known/unknown cards, folders and AI study-guide rewording, reports no personally noticed AI mistakes, but mentions initial navigation difficulty and missing Q-Chat. The historical feature-removal claim was not independently verified here. [App Store: ImakeHELPFULreviews](https://apps.apple.com/us/app/quizlet-more-than-flashcards/id546473125?see-all=reviews).

Quizlet's subscription help describes monthly usage limits for Plus and a separate Unlimited tier, supporting the distinction between paying and having unlimited access. A study-guide help page separately says Plus and Unlimited subscribers have unlimited guide access. These descriptions should not be flattened into a single universal cap or used to verify the precise three-test allegation. [Subscriptions](https://help.quizlet.com/hc/en-us/articles/360041181691-Subscribing-to-Quizlet), [Study Guides](https://help.quizlet.com/hc/en-us/articles/18312306436365-Studying-with-Study-Guides).

Official help acknowledges that student/teacher-created sets can contain errors and suggests copying and correcting a set; it also recognizes that this does not inform other learners of the mistake. AI study guides can be generated from notes and edited, but that does not establish the origin of Awel's material. [Incorrect-information help](https://help.quizlet.com/hc/en-us/articles/360030894831-Typos-or-incorrect-information), [Study Guides](https://help.quizlet.com/hc/en-us/articles/18312306436365-Studying-with-Study-Guides).

For FACT//DUEL, source provenance and corrections should travel with a question version. A report action should capture the disputed item and reason, acknowledge receipt, and support correction across future matches. A friendly AI explanation is useful only if the learner can inspect its basis. Do not display a claim as verified merely because it was generated fluently. Keep saved-question review and known/unknown organization direct and stable.

### Brilliant: preserve understanding and make recovery straightforward

**L13 — Falcon Argenteus, published 10 September 2026; experience 10 November 2025; negative, two stars.** Short explanations and hard-to-find instruction frustrate a returning mathematics learner. The experience predates the current interface. [Trustpilot review: Falcon Argenteus](https://www.trustpilot.com/review/brilliant.org).

**L14 — Rudi Grobler, 10 September 2026; positive, five stars.** Practical examples and prompt support are praised. [Trustpilot review: Rudi Grobler](https://www.trustpilot.com/review/brilliant.org).

**L15 — Wojtek Hernat, published 12 September 2026; experience 11 September 2026; negative, one star.** Mobile subscription management reportedly fails. Device and transaction details are absent. [Trustpilot review: Wojtek Hernat](https://www.trustpilot.com/review/brilliant.org).

**L16 — Dylan Maki, 9 September 2026; positive, five stars.** The reviewer reports prompt refund support after missing renewal reminders. Account circumstances differ. [Trustpilot review: Dylan Maki](https://www.trustpilot.com/review/brilliant.org).

Brilliant's current Learning Paths help describes sequenced courses mixing explanations and practice checkpoints, with more ordering freedom for Premium users. This confirms the intended structure; it does not refute an individual learner's difficulty finding sufficient help. [Learning Paths, updated 3 August 2026](https://brilliant.org/help/features/what-are-learning-paths/).

## Proposed requirements and acceptance evidence

These requirements are design inferences for FACT//DUEL. Their priority reflects the cost of a failure in a knowledge duel, not the number of reviews found.

| Priority / ID | Requirement | Concrete acceptance evidence | Inputs |
|---|---|---|---|
| P0 / LR1 | Complete the core practice loop without energy or advertising interruptions. | A fresh user finishes a declared practice set, opens explanations and retries mistakes without a purchase gate; saved answers survive a refresh. | L01, L08–L11 |
| P0 / LR2 | Make every scored answer auditable. | Each result exposes the answer, useful explanation, source, question version and report action; the correction process can identify affected matches. | L03, L10, L13 |
| P0 / LR3 | Support accessible participation before starting. | Keyboard-only completion, visible focus, readable question text on every player device, zoom and reduced-motion checks; lobby explains time and scoring settings. | L02, L05 |
| P1 / LR4 | Separate activity rewards from knowledge progress. | Results distinguish match score/XP from reviewed topics, accuracy and later recall; repeat questions do not become newly learned facts. | L01, L03, L12–L14 |
| P1 / LR5 | Offer control over competitive pressure. | A learner can enter untimed practice, suppress competitive reminders and resume after a break without losing access or buying restoration. | L02, L04, L06 |
| P1 / LR6 | Make hosting and recovery understandable. | First-time players can identify the room, see readiness and recover from a failed join; the host can preview the player view. | L05, L06; recovery is a design inference |
| P1 / LR7 | Disclose entitlements and support account recovery. | Before any future purchase, show total price, billing period, allowance and renewal date; account management works on mobile with a visible support route. | L07, L08, L15, L16 |
| P1 / LR8 | Keep navigation stable as content evolves. | Saved questions and mistake review remain one clear destination; changed content shows what changed and offers targeted review. | L01, L12, L13 |

The next validation step is task-based testing on FACT//DUEL with new players and people using keyboard, zoom or slower devices. Measure successful task completion, explanation usefulness and recovery from interruption; test later recall only with an explicit study design. This evidence panel justifies those questions and candidate safeguards. It does not establish learning gains, retention improvements, accessibility conformance or competitor failure rates.


# FACT//DUEL: Curiosity Arcade experience direction

Research reviewed 12 September 2026. This is a bounded, eight-source design review: three primary studies, two accessible book excerpts, one official open-source renderer reference, and two W3C accessibility explanations. It is not a claim to have read complete books, a systematic review, or a validation of this game. The existing game description supplied for this review is the implementation baseline; the recommendations below require integration checks against its actual state model.

## The experience to build

Make FACT//DUEL a small arcade of things worth knowing. A duel creates an encounter; a collectible card makes the encounter inspectable; optional Journal recall gives the player another way to engage with it. A persistent Passport connects these activities and supplies a satisfying end. Competition remains a short, clearly bounded option inside a wider experience of curiosity.

Preserve Quick1, Triple up to three questions, and Gauntlet5. Preserve private friends, explicitly identified random bots, and optional free room coins. The refresh should not change question timing, settlement, option positions during a question, or competitive selection rules. Home, setup, results, Journal, and collections carry the new personality. The timed answer surface stays visually quiet and predictable.

The core promise is **“Play a little. Leave with something interesting.”** This is a design hypothesis, not an experimentally established retention strategy. It gives each addition a purpose: missions connect existing activities; cards expose knowledge and provenance; cosmetics allow expression; session summaries make stopping feel complete.

## What the evidence supports—and its limits

Sailer and colleagues tested groups of game elements in a simulation. The badge/leaderboard/performance-feedback group improved reported competence and task meaningfulness; the avatar/story/team group improved relatedness. Intended decision-freedom effects were absent. Their analysis excluded 88 participants who failed manipulation checks, leaving 331, and grouped features cannot identify an isolated badge effect. Use specific, legible feedback; do not assume a pile of rewards produces motivation. The proposed Passport remains a product inference. [Sailer et al., 2017](https://doi.org/10.1016/j.chb.2016.12.033)

Roediger and Karpicke’s experiments found that free-recall testing of prose improved delayed retention relative to restudy, while immediate performance favored restudy. That supports making an opportunity to recall available. Their materials, tests, and setting differ from timed four-choice sports/science duels; this does not establish that FACT//DUEL teaches, that every repeated answer is learning, or that a single success proves mastery. [Roediger & Karpicke, 2006, publisher abstract](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/)

Moldon, Strohmaier, and Wachs studied GitHub’s removal of public streak counters as a natural experiment. Changes included fewer long streaks, less weekend activity, and fewer single-contribution days. This is software-development behavior, not a randomized game study or proof that all streaks cause harm. It illustrates that visible counters can redirect activity toward the counter. Therefore omit daily-loss mechanics and measure whether players value their activity. [Moldon et al., 2021, author manuscript abstract](https://arxiv.org/abs/2006.02371v3)

The accessible Chapter 16 excerpt of Celia Hodent’s *The Gamer’s Brain* argues for coordinated UX work and asking why players would care about a proposed feature. Cheryl Platz’s publisher-hosted Chapter 1 of *The Game Development Strategy Guide* distinguishes enjoyable, purposeful obstacles from interface friction. These are practitioner frameworks, not causal studies. Here they suggest improving the meaning of the existing loop before adding modes, and removing unnecessary navigation around review. [Hodent, Chapter 16 excerpt](https://gamesbeat.com/the-gamers-brain-excerpt-good-ux-is-key-to-crafting-fun/), [Platz, Chapter 1 sample](https://rosenfeldmedia.com/sample-chapter-game-development-strategy-guide/)

## Three connected loops

**One sitting: choose, play, inspect, finish.** Home offers the three existing formats with their question bounds and a prominent untimed Journal entry. After a match, show the actual outcome, questions answered, and newly encountered cards. Offer “Review a fact” and “Finish session” as plainly available actions; rematch requires an explicit press. A summary might say “1 duel completed · 3 cards encountered · 1 card opened.” It must be assembled from real session events. Do not autoplay another match, stage an expiring bonus, or require a reward animation to finish.

**Across visits: an optional Passport.** Start with “First Visit,” a three-stamp mission: complete a duel or an untimed practice activity; open an encountered card’s explanation; attempt recall for a previously encountered card. Show all conditions and the guaranteed reward before enrollment. Steps persist indefinitely and may be completed in any order. An eligible event may satisfy more than one plainly stated condition; do not force duplicate actions to manufacture length. Completing the Passport unlocks the Paper Orbit card back automatically. “Equip” is optional, with no claim timer.

Offer two more finite missions after onboarding, with no calendar dependency: “Double Lens” asks for three distinct Sports encounters and three Science encounters; “Field Notes” asks for explanations opened on six distinct cards and recall attempted on three distinct encountered cards. Bind topic conditions to verified source metadata. Missions remain voluntary, can be hidden, and never block play or reading. Completed missions stay visible as souvenirs. Do not generate an endless replacement queue in this release.

**Across the sample pack: a cabinet of knowledge.** Show “54 sample facts available” only while that is the live catalog size; calculate it from eligible records. Browse by subject and existing audited tags. Cards carry a concise fact, explanation, source link, relevant date/scope, and a local activity history. Reading is freely available. Cosmetic collection progress can mark encounter, opening, and recall events without locking the source material behind competition.

Use independent badges such as “Encountered,” “Opened,” and “Recall tried,” with counts or dates where useful. A player can open a card before encountering it in a duel, so these should not be a compulsory linear ladder. Show a scored recall result only when an actual answer was scored. If Journal asks users to judge their own recall, label that result “Self-reported.” Never convert any of these states into “Mastered,” “Expert,” or an invented percentile.

## Progression and reward contracts

Keep stamps as visual confirmations, not a spendable economy. Ship three guaranteed rewards: Paper Orbit for First Visit; Twin Stripe for Double Lens; Field Dot for Field Notes. All are inspectable before unlocking and available indefinitely. The default card back and both light/dark reading themes are available immediately. A cosmetic may change a card border, back, or decorative cabinet accent; it must not change answer contrast, hit areas, timer behavior, difficulty, rewards, or question selection.

Match coins remain the existing optional free per-room mechanism. They do not buy cards, mission steps, cosmetic chances, retries, or learning claims. A loss still creates legitimate encounters and can satisfy a participation step. Quitting before settlement does not become a completed match; already recorded encounters need not disappear. Once all initial missions are complete, say “Your first three Passports are complete” and offer browsing, voluntary play, or leaving. Do not imply more content exists than the catalog contains.

## Screens and states to implement

| Surface/state | Concrete interface | State contract and exit |
|---|---|---|
| Home, new visitor | Curiosity Press artifact, three format tickets, optional Passport, Journal link | Counters start at zero; no fictional activity feed. Every destination works without 3D. |
| Home, returning | Current Passport, last local session, recently opened cards | “On this device” scopes local history. Missing history has an honest empty state. |
| Setup | Subject, existing format, friend/bot choice, free coin setting, rules | Clearly label random bot behavior. Preview bounds before starting; preserve existing configuration defaults. |
| Private lobby | Real room status, ready controls, copy/join affordances | Distinguish waiting, connected, disconnected, and expired states. No fabricated opponent presence. |
| Timed question | Stable prompt, four options, progress, readable time | No decorative canvas, card flips, mission banners, shifting answers, or reward overlays. Existing adjudication owns timing. |
| Reveal/results | Correct answer and explanation, actual settlement, new local activity | Persist once before presentation. Review, finish, and deliberate rematch remain available. |
| Passport | Explicit conditions, stamp count, reward preview | Locked/unlocked/equipped are distinct. Completion survives reload and has no deadline. |
| Collection | Subject/tag filters, card count, independent activity badges | All source cards remain readable. Empty filters can be reset; count uses actual records. |
| Card/Journal | Fact context, source, hidden-answer recall, reveal and optional self-rating | Untimed; keyboard usable. Attempt/reveal/rating are distinct events. Back returns to the prior card/filter. |
| Session finish/settings | Factual receipt, “Done for now,” theme/motion controls, local reset | Ending stops timers and decorative work. Reset only affects described local data and uses the existing confirmation pattern. |

## Honest local persistence

Use a versioned local record with catalog version, session IDs, settled match IDs, question IDs, card events, mission definitions/progress, unlocked cosmetics, and preferences. A settled match is idempotent by match ID. A question encounter is idempotent by match/question occurrence; unique-card milestones derive from a set of stable card IDs. Source edits need a content version so historical events do not silently endorse rewritten facts.

Keep `cardOpened`, `recallAttempted`, `answerRevealed`, and `selfRatingSubmitted` separate. An answer reveal is not evidence of an attempt. Match success is not a source-read event. Deduplicate repeated callbacks and derive progress from accepted records rather than incrementing arbitrary counters on render. Record only this player’s activity; a friend’s clicks or bot answers do not advance the local Passport.

If storage is unavailable, permit play and state “Progress is available for this visit only.” Do not promise synchronization or recovery across devices. A browser-local record is user-editable and cannot support a trusted competitive rank. Session duration, if displayed, needs a definition that excludes hidden/background time; omit it until that behavior is implemented reliably.

## Accessibility, motion, and 3D

W3C’s timing guidance describes ways to disable, adjust, or extend content-set time limits and defines narrow exceptions. A simulated bot is not automatically a real-time-event exception. Keep an untimed route reachable before play and review the timed duel’s conformance separately; Journal alone does not certify the entire product. Setup, sources, collection, results, and reward choices should have no expiry. [W3C: Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)

Respect the operating-system reduced-motion preference and expose a persistent control. Remove decorative rotations, parallax, stamp bounce, and card flips when motion is reduced. W3C’s interaction-animation criterion is Level AAA; meeting it is not a claim of overall AAA conformance. Use text and symbols as well as color for outcomes, visible keyboard focus, and semantic HTML for all actions. [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

The original Curiosity Press is a decorative, tactile desktop object on Home and the cabinet. Three.js’s current renderer uses WebGL2, exposes pixel-ratio control and renderer statistics, and documents resource disposal. Those capabilities support a conservative implementation; they do not establish acceptable performance on a particular device. Provide a static fallback, cap render resolution, stop work when hidden, dispose resources on removal, and keep all information in HTML. [Three.js: WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)

## What can ship, and what needs evidence

Implement the Passport, three deterministic cosmetics, collection inspection, event-based receipts, honest empty states, motion preference, and static fallback now. Verify the meaningful risks: duplicate settlement/reload must not duplicate progress; free-coin losses must not erase earned cosmetics; one device’s activity must not become another player’s statistics; the no-WebGL and reduced-motion paths must remain functional; keyboard users must reach every essential action.

Treat richer bot personalities, adaptive difficulty, ranked comparisons, spaced scheduling, and “learning effectiveness” as deferred work. Random bots do not become skill-calibrated because they have names. Adaptive matching needs observed item and player behavior plus an explicit fairness model. A durable-learning claim needs delayed recall measurement, a suitable comparison, and a predefined analysis; engagement counts cannot substitute.

Run a small formative playtest before expanding rewards. Ask players to explain their progress labels, locate a source, complete one loop, and stop when they intend to. Include keyboard-only and motion-sensitive use. Record comprehension failures and whether people felt free to leave. This can identify usability problems; it cannot estimate population retention or prove accessibility. Expand the catalog only after provenance and answer-quality review, and expand progression only when participants can describe why it adds value.
