# Stadium gameplay and pacing

This change adds two local practice formats to the existing Quick Draw, Triple Threat, and Gauntlet rules. The stadium road gates their launch in the client using the actual local profile. These are free practice games against an explicitly labelled random bot. They do not spend coins, change the competitive human room contract, or represent a server-verified rank.

## Formats

| Format | Maximum balls | Answer clock | Score | Match ends |
| --- | --- | --- | --- | --- |
| Gauntlet / starter stadium | 5 | Launch preset: 30 seconds | Existing round-win scoring | After all five balls |
| Riverside Chase / 60 Club trophies | 5 | 30 seconds | Each correct answer adds one for that seat | Either seat reaches three correct; otherwise compare totals after five |
| Crown Super Over / 180 Club trophies | 6 | 15 seconds | A correct answer earns six runs below 5,000 ms, four below 10,000 ms, then two; wrong/absent earns zero | After all six balls; higher total wins |

Chase scores both seats independently. If both reach three on the same ball the match is a draw. Speed does not decide a Chase tie. Super Over also scores both seats independently. Exactly 5,000 ms earns four, and exactly 10,000 ms earns two. Its maximum score is 36. Equal final totals are a draw. Both new formats require a free bot room and their fixed clock; the engine rejects a human opponent, paid entry, or other timer. They are not exposed as ungated custom settings.

## Honest bot and the reply clock

`attachBot` commits one choice and a simulated response time for every question before readiness. The planner receives only the round duration and whether the full Super Over clock applies. It receives no question, correct answer, human choice, profile, score, or balance. The choice is sampled uniformly from four options. The existing short-format simulated-time distribution stays intact; Super Over samples across its whole clock so all three run bands are possible.

The visible JHK bot turn locks at the first durable human answer receipt plus **3,500 ms**. This is derived from the persisted receipt, not a poll counter or a client timeout. A repeated identical request cannot change it. A replacement answer is refused. The projection exposes only `botReplyAt`, never the planned choice or scoring time before the result.

The simulated bot elapsed time is separate from its visible reply delay. Legacy faster-correct scoring and Super Over runs use the precommitted simulated time. Human runs use the accepted receipt's elapsed time after the existing timing plausibility checks. Reviews explicitly label bot times as simulated. A timing-inconsistent round is void: no points, no Club attempt/correct credit, and no round XP.

If the human never answers, the bot resolves after the answer clock, permitted transport grace, and settlement buffer. This avoids deadlock without replying before a late but still valid human answer. If a valid human receipt arrives close to the deadline, the bot still gets its full 3.5-second reply; the ordinary deadline cannot settle that round early. A delayed poll preserves the scheduled receipt time and settles once. Real rendering can be later under a backgrounded tab, slow device, or network delay; the engine does not promise a hard wall-clock browser SLA.

HISAAB retains its immediate-feedback branch and original mode/clock exports. Human versus human room deadlines, release countdown, tie band, receipt validation, escrow, and settlement are unchanged.

## Flow and control

Local bot readiness schedules a question 100 ms ahead. On a visible device, a resolved answer remains visible for 900 ms; then the next ball is requested directly. There is no mandatory five-second review panel or repeated three-second countdown between practice balls. This applies to the original bot formats as well as Chase and Super Over.

The player can use **Pause after this ball** while a question is active. Interacting with revealed content, focusing a review control, opening banter, or hiding the tab pauses automatic progression. The paused between-round panel retains a manual Next control and optional source review. Automatic readiness fires at most once per round; a failed request leaves manual recovery available. Full question and source reviews remain accessible after the match. Pause and Next are regular keyboard-accessible buttons with at least 44 px control height.

The relevant UI observability attributes are on `.fd-room`: `data-room-phase`, `data-round-id`, `data-human-locked`, and `data-bot-locked`. `data-stage` continues to distinguish question/countdown/finish/lobby.

## Question rotation and progress integration

The engine first filters the bank to the selected category and difficulty. It then chooses unique question families using the rotation helper: unseen families first, followed by the least recently reserved families. Answer options are independently shuffled afterward. A format must have enough distinct eligible families; it never silently broadens the chosen filters or repeats a family inside one match. The service accepts trusted adapter history as the `questionHistory` dispatch option; browser payload fields do not supply this history. The local adapter and Supabase implementation own persistence and concurrency.

Journal sanitation records the new mode IDs and accepts Super Over scores up to 36. Permanent progression records both new modes without introducing them into rookie daily-mode quests. `attemptedRounds` is a cumulative count of settled rounds with an actual choice from 0 to 3. Timeout rounds do not earn this attempt credit. Old profiles without the counter migrate conservatively to `min(rounds, correct)` because old totals cannot distinguish misses from no answer. The road computes Club trophies as four per attempted round plus two per correct answer. The counter is independent of the rolling journal length.

Progress remains an editable local play record. The inherited journal's idempotence history is bounded to 200 rounds. Ordinary local room state exists only in memory and cannot be reopened after reload, but manually replaying an old fabricated snapshot after journal eviction could credit local counters again. No competitive or economic authority trusts Club trophies; this work does not add an unbounded receipt ledger.

## Three review rounds

1. **Diagnosis, before changes:** bot scheduling was anchored to reveal and could happen before the human or up to 9.5 seconds later. Local rounds added a 1.9-second reveal, five-second review, and three-second countdown. Reviewed the engine, atomic dispatch path, room states, HUD, journal, and progression counters. Chose fixed independent bot plans, first-receipt reply scheduling, separate score units, and an optional review flow.
2. **Changed candidate review:** implemented the two formats and direct practice advancement. Reviewed late receipts, duplicate requests, no-answer closure, independent seat scoring, private question keys, pause controls, and the local profile boundary. Preserved human contracts and sibling-edition immediate feedback. Added UI observation attributes for mobile browser tests.
3. **Edge improvement review:** tests exposed the need to preserve HISAAB's exact exported mode map and to exclude void timing rounds from progression. Expanded the Super Over bot's committed time across all run bands. Mobile browser QA found programmatic result-heading focus was being misclassified as deliberate review, which stopped auto-next; focus pause now applies only to actual review controls. Banter focus/pointer interaction also pauses before its action fires. Visual review of actual 320 px and 390 px screenshots found the room's generic reset had overridden the new pause-button CSS; the controls now use room-scoped selectors, shared theme tokens, and the intended 44 px minimum height. Verified strict score boundaries, simultaneous Chase finish, capped round counts, reload sanitation, conservative progress migration, and persistent controls. Mobile timing/layout measurements are recorded separately by the QA panel; their numbers must not be represented as human focus-group results.

## Verification

Focused tests are in `tests/trophy-gameplay.test.mjs`, with updated bot schedule assertions in `tests/bot.test.mjs` and the memory/D1 differential suite. They cover all original timers plus reading-friendly practice, 10,000 rapid polls, no early bot answer, identical retries, replacement rejection, key secrecy, late accepted answers beyond the normal deadline, no-answer fallback, Chase early/final finishes, six-ball Super Over, 5s/10s score boundaries, invalid timing, family rotation, journal reload, and attempt-counter migration.

The focused engine, progression, journal, presentation, bot, and HISAAB compatibility run passes **116 tests**. The separate presence/matchmaking, memory/D1 equivalence, ledger and rotation integration run passes **80 tests**. Presence and human matchmaking retain only the three competitive formats; local stadium modes are explicitly excluded. Runtime mobile tap-to-reply and result-to-next measurements belong in the QA report because scheduling constants alone are not browser performance evidence.
