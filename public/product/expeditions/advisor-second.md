# Product challenge — independent advisor, pass 2

Date: 12 September 2026. Source inspected: `lib/expeditions.mjs`, `app/expeditions.tsx`, `app/expeditions.css`, the profile reducer/store/hook, Arena integration, explicit expedition API, question manifests and expedition tests. This is a source/state review. No browser, device or usability observation occurred.

## Verdict

This is a substantive product change. The confidence choice changes the player's signed score; it is locked with the first answer. Nine narrow routes each have six fixed questions, three named chapters, resumable progress and a completion stamp. The home exposes unfinished progress, direct bot play and a visible collection case. That is a genuine additional play loop rather than another coat of paint.

The implementation remains one solo confidence-scoring mode with nine content packs. Three chapters organize the experience but do not introduce three distinct mechanics or branching narrative. The stamps are completion records, not earned evidence of expertise. These boundaries should remain explicit in the release description.

## Findings requiring lead attention

| ID | Priority | Finding and concrete repair |
|---|---|---|
| A01 | P1 feedback correctness | `ExpeditionRun.act` plays success/failure from `extra.choice` after any resolved dispatch. The profile transaction can reject that request because another tab answered first, advanced or reset the profile. The sound can therefore contradict the committed answer that appears on screen. Return/read the committed profile and emit the cue only when the exact run, index, choice and confidence were accepted in the same epoch. Completion sound likewise requires a newly committed completion. |
| A02 | P2 navigation intent | Clubhouse's **Topics, timer & match settings** and **Invite friend** both call `onSetup(false)`. Arena's `setupDuel(false)` forces `opponent:'friend'`. A player trying to adjust a bot's settings silently lands in friend setup. Separate generic configuration from explicit friend invitation; generic settings should preserve the current opponent. |
| A03 | P2 persisted-data truth | `validResult` independently bounds totals but accepts impossible combinations. A direct read check preserved `{score:18,correct:0,bold:0}` as a completed stamp. Validate that the tuple is achievable by six answers under the scoring rules. A completed current run can also be cross-checked/reconciled against `runResult`; inconsistent summary data should not produce an authoritative-looking result card. This is corruption resilience, not anti-cheat. |
| A04 | P2 completion consistency | The persisted reader can retain a run with cursor 6 but no valid `first` summary. The finish screen then announces an earned stamp while the case/home has no earned stamp. Treat a completed run and its completion record as one invariant when loading: either reconstruct the deterministic result from that completed snapshot under an explicit repair rule or reject the inconsistent record. Do not show contradictory ownership. |

A01 is the main runtime feedback defect. A02 is a direct navigation mismatch. A03–A04 concern malformed persisted records rather than a failure reproduced by ordinary valid play.

For A03, one exact feasibility check is to derive `boldCorrect = (score - 2 * correct + bold) / 2`; it must be an integer in `[max(0, bold - (6 - correct)), min(correct, bold)]`. Current UI-generated scores satisfy this because the reducer recomputes from actual answers.

## State and concurrency assessment

The core reducer guards are well chosen. A start checks the previous run ID, prevents overwriting a partial run and validates all six cards against a versioned route manifest. Answer and advance actions require the exact run ID and cursor. An answer must precede advance; duplicate answers and stale advance requests are no-ops. Finish occurs only on an explicit final advance, with first/best/last result updates and bounded completion count.

The enclosing profile reducer checks reset epochs before entering journey logic. It saves journal activity and the journey transition together in the existing read-write transaction. Per-route records allow multiple partial routes without one replacing another. Loading, export, reset and storage fallback reuse existing profile machinery. The runtime score is recomputed from immutable answers rather than accumulated independently in UI state.

The API exposes the selected solo teaching pack explicitly, and the client imports only public route metadata/rules. This avoids importing the whole server question bank into live components. The existing practice trust boundary remains important: the accepted answers are available to solo clients, so these are local practice scores and cannot support a verified leaderboard or coin prize.

Boundedness is credible: nine current route records, one six-card current snapshot per route, summary records for earlier runs, and the existing bounded journal. Replay preserves first result, updates best only on score improvement and does not farm permanent passport points because those are tied to distinct fact identities.

## Gameplay and presentation assessment

The two confidence stances are mathematically meaningful: Steady has expected score `2p`; Bold has `4p - 1`, so the preference changes at a subjective correctness probability of one half. The interface shows both consequences before answering and explicitly permits negative scores. The safest stance resets for each question. No subjective confidence is presented as measured ability.

The end screen separately shows run score, correct count and Bold picks; it labels repeated content as practice and awards completion at any score. The per-question recap shows choice, stance, accepted answer, points, explanation and source. The stamp is visible in the home case and player page, so the reward has a persistent destination.

The direct-duel path preserves the original user's competitive goal. Solo progress should continue to complement it: a local expedition result is not a victory over an opponent. The nine route names mostly reflect the actual six-question content rather than claiming an entire discipline; for example, the Football route is explicitly Istanbul 2005 and the Computing route is Web origins plus Python.

The remaining product limitation is content, not color. Most routes exhaust their narrow six-item sample in one visit, and replay can be solved through recognition. There is no spaced retrieval scheduler, calibrated adaptive challenge, branching route, personal friend rivalry history or new competitive mode in this pass. Do not imply otherwise. A future expansion should add deeper editorial packs and measured learning/replay goals before adding more economy systems.

## Verification boundaries and next checks

The lead reports 66 passing tests and TypeScript at the start of this review. I inspected the new cases and independently reproduced A03 with a direct module call; I did not rerun the whole suite. Tests cover manifest integrity, all-correct/all-wrong scores, duplicate/stale actions, inability to skip, partial resume, explicit finish, repeat activity awards, independent routes, reset epochs and basic migration/corruption cases. Add meaningful cases for A03–A04 and retain the lead's transaction concurrency checks.

Responsive CSS provides narrow-layout stacking, ordinary answer buttons, wrapping text and reduced-motion behavior. Those source rules do not establish actual phone fit, focus order, dialog accessibility or visual quality. The unresolved empirical gate is still to observe a full expedition and duel on real narrow and desktop screens, including a long question, source opening, pause/resume, feedback, finish and replay.

Release can describe the implemented mechanics after the concrete findings are repaired and the required automated/build gates pass. It should not call the experience visually validated or claim retention improvement.

## Bounded repair reinspection

The lead repaired A01–A04 and requested a check of those changes only. I re-read the affected sound effect, navigation intent union, persisted-result feasibility check, completed-snapshot consistency guard and new regression cases.

| Finding | Repair status |
|---|---|
| A01 | Resolved in source. Sounds now derive from newly observed committed answers, with a per-run deduplication set initialized from already-present answers. Resume does not replay prior answer cues, and completion sound requires reaching the completed cursor after mount. The dispatch request itself no longer emits success/failure. |
| A02 | Resolved in source. Explicit `friend`, `join` and `settings` intents are separate. Only the friend action forces the friend opponent. |
| A03 | Resolved. The reader applies the exact feasible-score formula and correct/Bold intersection bounds. Impossible tuples are rejected. A corrupt best summary falls back to a valid historical baseline. |
| A04 | Resolved for the reported invariant. A completed current snapshot requires a valid first result and a matching last result with the same run ID and recomputed score/correct/Bold totals. An inconsistent snapshot is removed; valid historical stamp data may survive separately. |

I ran the focused expedition test file after these repairs: all nine tests passed, including impossible score tuples and inconsistent completion records. I also inspected the added transaction test covering competing starts, contradictory answers, duplicate advance/finish and an old-epoch start after reset. No remaining concrete blocker was found within these four repairs. This does not expand the review to browser/device validation or replace the lead's final suite, TypeScript and production-build gates.
