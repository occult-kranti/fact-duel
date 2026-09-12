# FACT DUEL Game and Experience Design

## Product decision

Build a welcoming knowledge arena around **“Know your world. Play your people.”** The distinctive promise is a short challenge about something a person already cares about, followed by a fact worth keeping. Topic identity, understandable rules, trustworthy explanations, and easy repeat play should carry the experience. Demo coins provide optional match stakes; they should not dominate the navigation, resemble a cash balance, or imply that buying an advantage is possible.

For the first product release, concentrate the interaction model into three destinations: **Play**, **Explore**, and **Notebook**. Play contains the existing Quick Draw and Triple Threat, with a clearly labelled practice bot as the quickest entry and private friend rooms as the social path. Explore selects a field and a precise question pool. Notebook is proposed personal review, initially stored on this device with that limitation visible. An untimed solo practice path is a launch priority; it is a separate experience, not a claim that a reflex race measures knowledge equally for everyone.

This is a recommendation for the private, free-coin product. The existing 150 ms draw band and browser-reported local duration are casual fairness rules, not proof of physical simultaneity or cheat resistance. A random bot has a 25% chance of choosing the correct option only when all four choices are sampled uniformly. Its choice and delay must remain independent of the human response, and it must never appear as a real person.

## Evidence translated into design

Ryan, Rigby, and Przybylski’s four studies linked perceived autonomy, competence, and, in multiplayer settings, relatedness with enjoyment and future play. The authors also identified limits in sampled genres, assigned laboratory play, and measurement generalizability. Use this as a design hypothesis: offer meaningful topic choice, legible feedback, and voluntary social play. It does not establish a retention uplift for trivia. Avoid describing a cosmetic badge as psychological need satisfaction. [1]

Roediger and Karpicke found benefits of retrieval over restudy on delayed tests of studied prose; their experiments used free recall rather than this timed four-choice game. Butler and Roediger more directly examined multiple-choice testing: feedback increased later correct recall and reduced intrusion of wrong alternatives compared with no feedback. The product inference is to show the correct answer and an original explanation after settlement, then offer later retrieval. Faster tapping is not evidence of durable learning. [2, 3]

The book material inspected is limited to accessible author excerpts, descriptions, and tables of contents. Norman’s author page emphasizes signifiers, feedback, conceptual models, and designing for error. Krug’s publisher overview and contents emphasize intuitive navigation, concise copy, mobile usability, and inexpensive usability testing. Translate those ideas into plainly named controls, one main action per state, visible pending/accepted distinctions, and recovery that preserves selections. No complete book-reading claim is warranted. [4, 5]

Schell’s publisher description recommends examining a game through many perspectives and iterating; use a player, rules, aesthetics, and fairness review for every feature. Koster’s published first-chapter excerpt describes disengagement when a challenge is too difficult, too easy, or exhausted. These are useful practitioner lenses, not validated difficulty thresholds. Keep variety in question families and let people choose challenge depth; do not silently alter the competitive question to engineer a win. [6, 7]

## Artistic direction and color

Use an editorial sports almanac crossed with a modern science journal: oversized numerals, confident typography, generous breathing room, small diagram-like topic illustrations, and a restrained arena motif. A persistent cyan-versus-magenta split would overemphasize competition; use player initials and explicit labels instead. Avoid unlicensed team crests or photos as identity shortcuts. The visual direction is an original creative decision rather than a neuroscience claim.

| Role | Proposed colors | Application |
|---|---|---|
| Main light theme | Ivory `#F4F2E9`, ink `#16241E` | Reading, exploration, explanation |
| Arena dark theme | Deep green `#0D1512`, pale text `#E8EFE6` | Focused timed play |
| Primary action | Lime `#D3F26B`, ink text | Play, ready, next round |
| Sports identity | Amber `#F4BE71` on dark | Topic illustration and labelled category accent |
| Science identity | Blue `#88C8E0` on dark | Topic illustration and labelled category accent |
| Error state | Coral `#F48C85` on dark | Error icon and explanatory text, never color alone |

Calculated opaque sRGB contrast is 14.35:1 for ink on ivory, 12.78:1 for ink on lime, and 15.82:1 for pale text on arena green. Blue, amber, and coral against arena green calculate to 10.05:1, 10.99:1, and 7.89:1 respectively. These checks cover these pairs only; actual rendered hover, disabled, translucent, and light-theme variants still need verification. Dark text on blue or amber chips is preferable to pale text.

A 4,598-person, 30-nation color-association study found shared patterns with linguistic and geographical variation. It measured associations with color terms, not this interface’s conversion, trust, or reaction speed. Therefore, do not promise that a hue makes users calmer, smarter, or more likely to pay. Test recognition, readability, and preference across target cohorts. [8]

## Screen-by-screen contract

| Screen or state | Layout and behavior | Feedback and next action |
|---|---|---|
| Home / Play | A compact promise, remembered topic, two mode cards, visible bot/friend selection. Avoid a long carousel before play. | Primary “Play a practice bot”; secondary “Challenge a friend.” Clearly state free coins and bot randomness. |
| Explore | Start with Sports / Science; then field, competition or concept, entity/era, and depth. Show breadcrumb, exact available count, and sample scope. | Empty pools explain what is missing; offer an explicit broader filter rather than silently broadening. |
| Match setup | Show mode length, timer, single-attempt rule, optional coin stake, and close-answer policy in a compact summary. | One “Create match” action. Keep advanced timing explanation behind a labelled disclosure. |
| Lobby | Two seat cards, initials, human/bot badge, actual readiness, room code and copy action. Do not fabricate searching players or queue activity. | “I’m ready”; copy confirmation as text. Explain a room invite does not bypass private site access. |
| Countdown | Stable question region and answer placeholders; large countdown without zooming or flashing. | A visible start cue. A pre-round cancel remains distinct from an active-round exit. |
| Live question | Question above four full-width answers on small phones; 2×2 answers only when labels fit comfortably. Fixed option order during the round. | “One answer. Tap to lock.” Timer is readable but visually secondary to the question. |
| Attempt pending | Immediately mark the chosen option and prevent a second choice. Keep the same question visible. | “Sending your answer…” is distinct from “Answer received.” Retry the immutable attempt automatically where safe. |
| Waiting for settlement | Retain the selected answer and calm status; do not reveal an opponent’s choice, correctness, or answer event prematurely. | “Comparing answers…”; explain delay if necessary without asserting an unconfirmed result. |
| Result | Outcome, each player’s correctness and reported duration, draw explanation when relevant, coin settlement, then the sourced explanation. | “Next round” or “Play again,” alongside “Save fact” and “Finish.” No automatic rematch countdown. |
| Notebook / review | Saved facts with topic, source, date, and optional later four-choice review. Label local storage and offer clear/delete controls. | “Review 3 facts” is a bounded session. Never equate saved or seen facts with mastery. |
| Preferences | Light/dark/system, sound, motion preference, shortcut guidance, and input/accessibility information. | Show sound preview only after an explicit action. Preserve choices without mandatory registration. |
| Errors / interruption | Specific room full, expired invite, offline, or session-cancelled message, with any refund status taken from confirmed state. | Preserve setup where possible; use “Retry,” “Return to room,” or “Create another room,” rather than one generic error. |

These are screen contracts, not a statement that every destination is implemented. The roadmap should track each capability separately from its visual mockup.

## Sound, motion, and input

Brewster, Wright, and Edwards’ research-based earcon guidance recommends recognizably different rhythm and timbre, short cues, and controlled intensity; pitch alone can be a poor identifier. Their work concerns interface communication, not evidence that an audio flourish improves trivia retention. Use a tiny original synthesized family and test it on phone speakers. All cues remain optional and duplicate visible information. [9]

| Event | Proposed optional cue | Guardrail |
|---|---|---|
| Ready accepted | One soft wooden click, around 80–120 ms | Once per actual transition |
| Question available | Two short, distinct plucked notes, around 220 ms total | No timing depends on audio playback |
| Answer accepted | Muted single tick, around 90 ms | Server acceptance cue; pending state stays visually distinct |
| Correct answer | Short three-note phrase, around 350 ms | Outcome shown simultaneously in text |
| Incorrect answer | Gentle low double pulse, around 200 ms | No buzzer, insult, or volume jump |
| Draw | Balanced two-note chord, around 250 ms | Explicit draw text explains rule |
| Interruption | Optional soft neutral pulse | Never repeat in a loop |

Keep sound off initially, provide an always-reachable mute, and suppress cues on hidden tabs. No background music, accelerating final-second ticks, coin-machine cascades, or flashing confetti in the initial release. Reduced motion replaces ornamental movement with instant state changes; do not remove information with the animation. These durations and timbres are design proposals requiring listening tests, not validated thresholds.

Set answer pads to at least 56 CSS px high where content permits, with wrapping and 8–12 px separation; ordinary controls should target at least 44×44. WCAG 2.2’s AA target minimum is 24×24 with exceptions, so the larger product targets deliberately exceed that floor. Preserve 320 CSS px reflow, zoom, visible focus, meaningful headings, and textual status changes; never announce every timer tick. WCAG’s contrast requirement for ordinary text is 4.5:1 and 3:1 for large text. [10, 11]

Use ordinary release/click behavior outside the timed answer pad. W3C permits essential down-event interactions in limited cases; a timing-sensitive pad needs its rationale documented and accessible activation tested. Do not treat every game control as exempt. Keyboard shortcuts must ignore text fields and repeated keydown, with equivalent visible controls. Timed competition may depend on an essential timer, but this does not justify timed menus, vanishing explanations, or excluding an untimed practice path. [12, 13]

## Hooks and roadmap gates

Launch with intrinsic hooks: a remembered favorite field, a satisfying fact explanation, optional collection, and deliberate rematch. Add themed editorial packs after the question pool is deep enough. A later “Rivalry Card” can summarize a friend series without publicly exposing opponents’ identities. A later “Same Question, Your Time” asynchronous challenge can compare independently recorded attempts, but must be labelled differently from simultaneous live play and needs spoiler/replay controls.

Defer leaderboards, seasons, confidence stakes, tournaments, and collectible economies until content calibration, identity, anti-cheat, and sustainable operations exist. Never display invented popularity, expert percentages, learning scores, scarcity, or “people waiting.” A visit counter is a visit counter, not mastery. Offer finishing points instead of a streak penalty or a reward contingent on staying longer.

| Gate | Owner | Evidence required before claiming complete |
|---|---|---|
| First-session clarity | Product + UX | New players can identify opponent type, start, answer, and explain result; record observed failures |
| Responsive control | Frontend + accessibility reviewer | Small phone, large text, keyboard, screen reader, reduced motion, both themes |
| Rule honesty | Gameplay engineer + skeptic | Pending/accepted states, bot independence, source reveal timing, draw and interruption copy match engine |
| Useful replay | Content editor + researcher | Source-backed explanation and non-repeating family coverage; saved review never leaks active answers |
| Retention hypothesis | Product analyst | Cohort return and satisfaction alongside regret, accidental inputs, and disputed outcomes |

Treat completion rate, voluntary second match, question-report rate, and later fact recall as separate measures. No numeric conversion or retention target is established by the cited studies. Start with observed private pilots; use small qualitative rounds to find comprehension failures, not to estimate population prevalence. Assign every issue an owner, severity, dependency, acceptance evidence, and status; a passed code test does not close a human usability issue.

## Two critique loops

**Loop 1 — contract critique before release.** Independently inspect each state for an obvious main action, truthful copy, recoverable errors, contrast, keyboard behavior, source timing, and a bot label. Challenge the most attractive features: does a coin animation obscure correctness, does an identity badge imply expertise, and can pressing Back lose an accepted attempt? Record defects, implement bounded corrections, then recheck affected flows and settlement invariants.

**Loop 2 — field critique after those fixes.** Observe consenting testers across target geographies, phones, connection qualities, and accessibility settings completing bot play, a friend room, a close result, and an interruption. Ask them to explain what happened before explaining the rules yourself. Compare accidental selection, abandonment point, rule comprehension, and satisfaction with the previous build. Mark unresolved device or timing limitations explicitly; do not label a design “validated” because an advisor approved a screenshot.

## Sources

1. Ryan, Rigby, and Przybylski. “The Motivational Pull of Video Games: A Self-Determination Theory Approach.” 2006. [Author-hosted paper](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf).
2. Roediger and Karpicke. “Test-enhanced learning: taking memory tests improves long-term retention.” 2006. [Original abstract](https://pubmed.ncbi.nlm.nih.gov/16507066/).
3. Butler and Roediger. “Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing.” 2008. [Original abstract](https://pubmed.ncbi.nlm.nih.gov/18491500/).
4. Norman. *The Design of Everyday Things*, revised edition, 2013. [Author synopsis and contents](https://jnd.org/books/the-design-of-everyday-things-revised-and-expanded-edition/).
5. Krug. *Don’t Make Me Think, Revisited*, third edition, 2014. [Publisher overview and contents](https://www.pearson.com/en-us/subject-catalog/p/don-t-make-me-think-revisited-a-common-sense-approach-to-web-usability/P200000000385/9780133597264).
6. Schell. *The Art of Game Design*, third edition, 2019. [Publisher featured-book description](https://www.routledge.com/about-us/crc-press).
7. Koster. *A Theory of Fun for Game Design*. [Author-published first-chapter excerpt](https://www.theoryoffun.com/excerpt.shtml).
8. Jonauskaite et al. “Universal Patterns in Color-Emotion Associations Are Further Shaped by Linguistic and Geographic Proximity.” 2020. [Original abstract](https://journals.sagepub.com/doi/10.1177/0956797620948810).
9. Brewster, Wright, and Edwards. “Guidelines for the Creation of Earcons.” [Author research guidance](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml).
10. W3C. *WCAG 2.2*, Recommendation, 12 December 2024. [Normative standard](https://www.w3.org/TR/WCAG22/).
11. W3C. [Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
12. W3C. [Understanding Pointer Cancellation](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html).
13. W3C. [Understanding Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).

