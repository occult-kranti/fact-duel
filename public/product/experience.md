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
