# Executive product decision record

## The release we are making

FACT//DUEL is a private knowledge club built around short, four-choice duels and explanations worth keeping. The core proposition is specialist identity, friendly rivalry and curiosity. The creative direction is an original editorial arena: midnight navy, pale cobalt actions, warm sports accents and lavender science accents. A cool light theme offers a second reading environment. Generic original illustrations carry the subjects without borrowing club badges, athlete likenesses or institutional logos.

This is an implemented product iteration with an evidence-gathering plan. It is not demonstrated product-market fit. Practice bots, internal simulations and automated tests cannot establish human demand. The current private access boundary remains in place. Coins are optional, free, non-transferable, reset to 1,000 per seat in each new room and cannot be bought or redeemed. Free entry is the default, and no global balance or paid advantage is implied.

The executive choice is to recruit three future pilot wedges separately: India cricket, European football and US-led space/science. The market brief explains the evidence and its limits. All nine current sample collections remain playable, including basketball, American football, tennis, physics, biology and computing. A promoted narrow collection eventually needs at least 40 independently reviewed fact families; the current six questions per topic are visibly a sample, not comprehensive expert coverage.

## What is implemented

| Destination or state | Current behavior | Product reason and boundary |
|---|---|---|
| Play | Bot, friend and invitation entry; name; three modes; selected collection; optional detailed filters, timer and demo entry | Match setup comes first in mobile document order. Bot practice starts a countdown from the primary action. The stay-on-screen rule is disclosed beside it. |
| Collections | Sports/science discovery, topic search, nine count-labelled cards and a mixed selection | Selecting a collection returns to setup with explicit filters. A narrow pool that cannot fill the chosen mode offers a broader reset or Quick Draw. There is no empty public queue. |
| Waiting and between rounds | Real occupied seats and readiness; copy invite; add bot to an empty seat; explicit next-round action | No fabricated searching, online counts or live opponents. A room invite still requires private Site access. Between-round explanations stay available before the next action. |
| Countdown and question | Stable four-option question region, visible timer, first-attempt lock, numeric keyboard route and assistive click | Optional audio duplicates text. The chosen answer stays visible during sending, retry and settlement. Touch answers intentionally register on press; actual scroll/input usability remains a device-test gate. |
| Result | Outcome, score, demo settlement, correct answer, original explanation, source and both response times | Human reported duration and server envelope are distinguished from scheduled bot time. Another match requires a deliberate action; there is no automatic rematch. |
| Journal | Revealed round facts, distinct encountered facts, completed matches, bookmarks, source links and export | Real observations only, capped at 200 round records and 100 match records. Local storage is validated before rendering. Use one playing tab per browser; it is not a synchronized account. |
| Recall Lab | Untimed four-choice retrieval of facts already encountered, feedback and a bounded finish | No coins, rank or mastery estimate. Alphabetic labels distinguish it from the timed numeric-shortcut interface. |
| Preferences | Remembered name, light/dark theme, sound and volume; journal deletion with confirmation | Sound begins off. Mute remains accessible during a timed round. Reduced-motion follows the browser/OS preference. A system-theme selector is not implemented. |
| Product Studio | Decisions, 40-issue roadmap, two research briefs, source ledger and advisor records | Status and evidence notes are editable locally and exportable. Role names assign accountability; the board is not live analytics or an unattended agent swarm. |

## Game design choices

Quick Draw settles a one-question match. Triple Threat plays at most three questions and stops when a player wins two; otherwise final score decides. The Gauntlet plays all five questions even when a lead is decisive, giving it a longer knowledge-sampling objective. Tied final scores return the demo entries. The optional entry is reserved once for the whole match, never once per round. All modes use the same one-attempt and settlement rules, and all support the random practice bot.

The bot commits its choice and delay before play, independently of the correct answer and human input. Each of four options has a 25% chance. Its delay is sampled from one second to half a second before the selected limit. A delayed state request materializes the scheduled attempt using that committed duration; the bot does not need a continuously running background worker. This is a disclosed simulation, not an estimate of human ability. Difficulty settings change the question pool, not the bot's hidden accuracy.

For honest clients, comparing locally reported durations can reduce the effect of different delivery delays. Both correct answers within 150 milliseconds draw; a single correct answer wins. A capped transport envelope rejects inconsistent reports. This cannot prove when a physical screen displayed the question or whether a modified client lied. Inconsistent timing, leaving or interrupting an active match cancels and refunds it. That conservative behavior can itself be abused by deliberate disconnects and must be revisited before any ranked service. The Timing Lab keeps this trade-off inspectable.

The server remains authoritative for accepted answers and settlement through atomic database writes. Answers and bot plans remain sealed until the round is resolved. Existing retry identities and revision checks are retained. The new mode extends deck length and completion rules without a schema migration or a second settlement system. This keeps a product experiment small enough to inspect while avoiding an unsupported claim that the current transport is ready for a mass audience.

## Psychology, hooks and sound

The repeat loop is choose a subject, attempt a duel, understand the result, save a fact and return voluntarily. That is a design hypothesis informed by autonomy, feedback and retrieval research, not a measured retention effect for this product. The journal shows encountered facts and completed matches; neither is renamed mastery. The market and experience briefs distinguish original research from practitioner advice and product precedents.

We chose three coherent competitive lengths and an untimed review experience over a large launch catalog. Creative expansion candidates include a maintained weekly collection, a consensual friend ritual, a historical era ladder and a source-detective mode. These are gated proposals. A source-detective mode would need a new question format and evaluation contract; it must not reuse an ordinary recall item under a misleading label. A weekly ritual should have a stopping point and no penalty for missing a week. None of these future hooks is shown as playable today.

There are no punitive streak resets, fake scarcity, fake users, near-miss manipulation or purchased advantages. The visual emphasis belongs to the question and explanation. Optional demo stakes let the POC retain its original duel idea without a dominant wallet interface. These choices express the intended experience; they are not a claim that all other monetization or game patterns are harmful.

Original synthesized cues mark countdown, local answer lock and outcome. A short ascending phrase accompanies a win; a gentle descending pair accompanies a loss; a balanced pair accompanies a draw. The cue describes the visible round outcome, not just whether the player answered correctly. No sound announces a server receipt before it exists. Sound is off by default, user-adjustable, suppressed when the page is hidden and guarded against replay when preferences change. There is no urgency ticking or continuous soundtrack. Phone speakers, hearing differences and audio/screen-reader coexistence remain observed-test work.

## Artistic and accessibility decisions

The design research proposed an ivory/deep-green system. The executive adaptation is a navy/cobalt knowledge club that accommodates the original generic sport and science covers, with a cool light mode. This is artistic judgment, not a claim that a color produces a universal emotion or conversion uplift. The color-association research in the brief measured associations, not this interface's performance.

Core opaque text and action pairs were calculated separately from real-device verification. Form-control outlines were strengthened after the advisor found insufficient boundary contrast. Labels, icons, pressed states and explicit outcomes provide information alongside color. Focus moves on real destination or phase changes, rather than every state poll. Questions use wrapping answer labels and a single column on narrow phones. The timer is visually secondary, and the untimed Recall Lab offers a distinct way to revisit content.

These source-level provisions do not establish complete WCAG conformance. Physical touch, zoom, high contrast, long localized strings, screen-reader output, native dialogs and audio behavior still need observation. Registering a timed answer on pointer-down reduces variation from release gestures but raises an accidental-selection risk while scrolling; retain the disclosed behavior for this casual pilot and use the device results to decide whether click-release should become the common policy. A faster interaction is not automatically a more usable interaction.

## Team and critique record

| Workstream | Completed bounded assignment | How the output influenced the product |
|---|---|---|
| Market researcher | Current competitor audit, audience evidence, TAM/SAM/SOM assumptions and pilot gates | Three separate launch experiments; no addition of incomparable fan counts; no revenue forecast from free coins |
| Game psychology researcher | Primary research, accessible book material, 12 screen contracts and sound guidance | Optional social play, explanations, untimed recall, visible limits and non-punitive hooks |
| Artist | Two original generic covers and recorded prompts | Cohesive sports/science identity with lightweight WebP assets |
| Independent advisor | First source review, then a second review of implemented changes plus direct invariant checks | Mobile action hierarchy, persistent chosen answer, empty-pool recovery, journal validation, focus and stronger outlines |
| Root product/development lead | Executive decisions, all Site code changes, integration, release verification and roadmap ownership | One controlled implementation path and an explicit record of unresolved empirical questions |

Two critique loops are completed as source reviews, with repair dispositions recorded alongside the second report. This does not mean two rounds of user research occurred. The agents performed bounded assignments during this work; they are not running an ongoing monitoring service. The roadmap captures dependencies and acceptance evidence so the next work can be assigned deliberately.

## Release evidence and next gate

The release passes 39 automated tests covering the existing HTTP and atomic settlement paths, random bots across three modes and all timers, five-round leads and draws, rejected malformed modes, revealed-only journal records, duplicate snapshots, corrupt saved data and storage bounds. TypeScript checking and the production build pass. Two independent source-review passes are complete, and the advisor re-inspected the main fixes without finding another source-level blocker for this private free-coin playtest. No browser, physical-device, assistive-technology or real cross-location test is claimed.

| Calculated opaque color pair | Contrast ratio |
|---|---:|
| Dark body text / background | 17.18:1 |
| Dark muted text / card | 8.64:1 |
| Dark primary action text / fill | 9.00:1 |
| Light body text / background | 14.73:1 |
| Light muted text / card | 6.29:1 |
| Light primary action text / fill | 6.55:1 |
| Updated dark input edge / card | 4.59:1 |
| Updated light input edge / card | 3.69:1 |

These are exact token-pair calculations, not a rendered accessibility certification. The release roadmap marks 13 foundation issues done and leaves 27 pilot, content, demand and scale issues open. Task percentages are counts, not estimates of elapsed effort.

The immediate next gate is an observed private pilot: permitted testers, actual mobile flows, assistive checks and two geographically separated screens. The current private access list is not widened by a room invitation. Do not begin paid acquisition or rank audience wedges from a handful of bot sessions. The roadmap proposes ten moderated sessions, then at least 100 activated participants per wedge before a directional investment decision, with recruitment bias and uncertainty visible.

At scale, measure active rooms, request rates, database contention, latency percentiles, timing refunds and correction workload before changing architecture. Two humans polling every 500 milliseconds imply roughly four state requests per active room per second, plus mutations; 1,000 simultaneously active rooms would therefore imply roughly 4,000 state requests per second under that simplified load model. This arithmetic is not a tested capacity ceiling. Idle polling, hidden tabs, round durations and bot rooms change the mix. Push transport and per-room actors are candidate responses to measured costs, not shortcuts to physical zero latency.

A future account system, cross-device journal, durable ledger, regional service, ranked integrity model, public matchmaking, moderation console and expanded bank each have separate gates. The practical decision is whether a small audience voluntarily chooses a second and third session while understanding the rules and trusting the facts. The market model supplies context; those observations decide the next investment.
