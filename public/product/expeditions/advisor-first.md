# Product challenge — independent advisor, pass 1

Date: 12 September 2026. Scope: source inspection of Arena, Collections, Discovery, Passport, result widgets, local progression and current decision records. No rendered browser, user study or new empirical retention evidence is claimed.

## Diagnosis

The user is rejecting the product's ambition, not asking for another color palette. The current app improves presentation and receipts, but its central loop still offers little agency beyond choosing a filter and pressing the fastest correct option. Quick Draw, Triple Threat and Gauntlet vary series length, while local missions largely reward opening explanations and attempting cards. Discovery serves three arbitrary questions and ends with generic encouragement. None of these supplies a memorable objective for the visit.

The next release should make a concrete promise: **choose a knowledge expedition, make deliberate decisions, finish a short run, and take away a visible record of what happened.** This needs a real rules/state layer. A path illustration around the existing Discovery component would not satisfy that promise.

## Recommended bounded product core

Keep live duels intact and add one coherent untimed solo system. Choose a route before play, see three named stops, answer a fixed small number of sourced questions, and finish with an inspectable run card. Show the length and exact content scope before starting. The 54-question sample contains six items per topic and often one narrow event/concept family per topic. Three stops with two questions each is a defensible maximum for a single-topic sample. Multi-topic routes can use distinct topic stops, but must promise the actual families, not broad expertise.

| Player need | Concrete mechanism | Acceptance gate |
|---|---|---|
| Agency | Choose the route; optionally choose an explicit scoring stance before each question, such as normal versus a clearly priced confidence choice. | The choice changes a declared scoring consequence, never the question/accepted answer. If confidence is omitted, do not market topic selection as a tactical mechanic. |
| Competence | Lock the first answer, explain the correct answer, show correct count and per-question record. | Reading an explanation or retrying a revealed item never becomes proof of mastery. |
| Finite purpose | Three visible stops and a completion card that names the route and result. | A run ends. Replay is deliberate and labeled as practice with possibly repeated questions. |
| Rivalry | A clear separate path to the existing random bot or private friend duel; finished run may offer a matching-topic duel. | No solo score is portrayed as a win over another player, no invented rank or global percentile. |
| Identity | Equip the route's completion emblem or display best run on a local player card. | Completion, best score and accuracy are separate concepts; cosmetic rewards never affect duel fairness. |

Do not add all suggested mechanics at once. The route, durable first-answer state, clear finish and replay distinction are essential. Confidence is the best bounded addition if implementation time permits because it adds a decision beyond answer selection. It must remain optional and explained before lock-in. A deterministic stake such as normal +1/0 versus confident +2/−1 is understandable; an integer floor or negative-total rule must be specified before play. No random loot, fake crowd, streak pressure or invented competitor score is needed.

## Home and screen hierarchy

The home must answer “what can I do here?” in seconds. Give a new visitor one featured expedition with the actual length, one route choice area, and one immediately accessible Quick Duel action. A returning player should see **Continue [route], stop 2 of 3**, or their actual completed run card. Put configuration behind the duel path instead of placing nine filters in the product's front window.

A route map should expose real state: completed, current, upcoming. Use ordinary buttons and text, with a small number of meaningful labels. On a phone, route title, current objective and Continue must precede decorative art. During a question, the route rail must be quieter than the question and four answer controls. Result feedback should connect directly to the scoring rule and the next stop. Finish should offer Review answers, Try this topic in a duel and Done; no automatic restart.

Use the existing identity and original artwork. Add compositional hierarchy and stateful game objects, not another skin name. Expose unlocked emblems on an actual home/player card rather than leaving rewards buried in Passport. Show unfinished objectives without flooding the main page with all missions and reports.

## Correctness and honesty gates

1. **One source of run truth.** Store a run ID, route/version, question IDs, current position, immutable choices, scoring stance, timestamps, phase and any completion reward in the existing transaction-backed profile. UI state alone cannot claim resume after refresh or concurrent tabs.
2. **Content identity.** Freeze the manifest for an active run. Handle a removed or changed question with an explicit incompatible-run outcome; never silently swap it while retaining its score. A route revision creates a new score identity.
3. **Idempotence.** Double taps, stale tabs, retried writes and remounts cannot answer twice, advance past unanswered questions, complete twice or farm permanent activity points. The reducer must enforce this, not only disabled buttons.
4. **Practice trust boundary.** If the API returns accepted answers to the client, this is a local solo challenge. Scores are inspectable client activity, not validated competitive skill. Do not reuse solo scores in a leaderboard or coin settlement.
5. **No collateral leaks.** Keep active/future live-duel answers protected. Importing the server question bank into a client component would break that existing boundary; the solo endpoint may expose only its explicit teaching pack.
6. **Storage recovery.** Loading state disables starting, score-changing actions and route reset until profile load is settled. Failed storage distinguishes visit-only play from persisted resume. Export/reset include expedition records; reset epochs stop stale actions reviving a cleared run.
7. **Meaningful score.** Total score must recompute from stored choices and the manifest/rule. Include unanswered and incorrect counts. Best score updates only on a completed valid run and never relies on the final question alone.
8. **Replay honesty.** Preserve first completed result versus personal best if showing improvement. Repeated identical six-question content trains recognition; call it replay/practice, not a new assessment or fresh expedition.
9. **Reward honesty.** A completion emblem may be earned by finishing; say so. A perfect-run emblem may require every first answer correct; don't award it for re-answering after explanation. All reward effects are cosmetic.
10. **Boundedness.** Limit stored histories and embedded question snapshots. Avoid creating an ever-growing profile or polling the server for untimed local progression.
11. **Abandon versus resume.** Leaving the route view should preserve the unfinished run. Starting a replacement route needs an explicit, understandable choice when progress would be discarded; preferably keep one resumable run per route.
12. **Race with live play.** The live room remains the top-level activity while active. Starting an expedition must not orphan a live match or hide a running timer.

## Review priorities after implementation

Inspect the pure run reducer first, then its hook/transaction integration, then screen labels. Exercise all-correct, all-wrong, mixed, exact scoring boundaries, duplicate action, out-of-order advance, refresh, two-tab stale write, storage fallback, reset while pending and older profile migration. Inspect enough narrow-layout source to detect obvious overflow and hidden actions, while keeping rendered/device verification as a separate evidence gate.

This is a product bet, not a measured retention improvement. Success for the bounded release is observable: a new player can name their objective, choose a route, explain how the score works, finish a run and identify what changed on their player card. The full market/content/latency roadmap remains necessary, but should support this experience rather than become the experience.
