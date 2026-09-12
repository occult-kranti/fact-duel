# FACT//DUEL — second-loop source review

Review date: 2026-09-12. Read-only inspection of `arena.tsx`, `rivalry-widgets.tsx`, `rivalry.css`, `duel-presentation.mjs`, the room engine, journal/profile reducers, storage hook, optional 3D lifecycle and new targeted test source. No Site mutation, browser test, physical-device test, screen-reader test or GPU benchmark was performed.

## Assessment

The redesign makes the competitive intent materially clearer. The default button names the actual bot; selected format, timer and entry match the create payload. Format cards leave the first-play critical path. The active HUD removes the old coin balances; match verdicts are now literal. Learning and optional 3D are secondary destinations. This addresses hierarchy rather than merely adding more features.

Source review found the following repairs to make before declaring the pass complete. This record describes the inspected state; the root's subsequent repair record must distinguish addressed items from remaining empirical gates.

| ID | Priority | Finding | Required repair / gate |
|---|---|---|---|
| L2-01 | P1 | `MatchFinish` says **Play again**, but `Arena.onReplay` only returns to setup. | Implement one explicit same-config bot restart, or name the action **Set up rematch**. Do not imply immediate play when a second launch click is required. |
| L2-02 | P0 | Local report reducer ignores a second note for the same fact/reason; the hook still returns success. A user can therefore type a different note and be told it was saved although the old note remains. The dialog also retains `saved=true` on reopening, hiding the form. | Distinguish created/existing/updated results; either show the existing immutable note or support an explicit update. Reopening must let the user inspect their saved content or choose another concern. Test changed-note semantics and duplicate identical clicks separately. |
| L2-03 | P1 | Primary answer receipts show plain seconds, and `roundReason` calls bot times **reported**. | Show **Browser reported** versus **Scheduled bot** in the primary receipt. A bot comparison must not describe a scheduled number as a browser report. Keep diagnostics collapsed. |
| L2-04 | P1 | Answer receipts show Correct/Incorrect but omit the actual selected option. | Render the settled snapshot's `question.options[receipt.choice]`, preserving that round's shuffled order. This is available only after closure and does not require new protocol data. |
| L2-05 | P1 | Match summary divides correct answers by submitted receipts. One correct submission plus four timeouts appears as **1 / 1 correct**. | Use resolved-round count and explicitly account for unanswered rounds, or label the denominator **submitted answers**. For legacy rooms, say when earlier receipts are unavailable. |
| L2-06 | P1 | Final RoundReview is gated by `room.round.result`, so cancellation during round 2+ hides valid earlier recaps held in `completedRounds`. The activity hook uses the same gate when recovering such a room. | Gate historical review/recovery on a nonempty completed-round history as well as a current resolved round. Do not reveal the cancelled unresolved current question's answer. |
| L2-07 | P1 | Recap tabs render a timing-inconsistent round as **D**, while the HUD correctly renders it as void. | Use **Void** or a clearly named dash consistently; a refunded invalid round is not a regular draw. |
| L2-08 | P0 | Light-theme draw title inherits fixed `#fbad7e` over white. Direct WCAG luminance computation gives **1.85:1**. | Add a dark-enough light-theme verdict token, e.g. the existing `#a34713` family; large text needs at least 3:1. Keep a textual verdict so color is not the sole cue. |
| L2-09 | P1 · empirical follow-up | Source layout still spends substantial mobile height on header, room bar, multi-line HUD rules, topic/timer, mode metadata and four 66px options. A typical two-line question may push the fourth answer below a 390×844 viewport. | Reduce repeated format/rule labels and active HUD/vertical spacing. Keep four stable targets at least 44px tall, 16px answer text and unrestricted wrapping. Actual mobile rendering and long-name/long-option interaction remain pending device/visual QA; do not claim a measured fit from source inspection. |

## Checked boundaries with no blocker found in inspected source

- `retainRound` is called only after `round.result` is established. Active projections still omit current answer keys, receipts and future deck contents. Historical snapshots contain the settled option ordering and are bounded by the existing maximum five-round match.
- `matchVerdict` uses aggregate match scores and overall winner. `roundReason` handles individual round causes separately. A lost last round does not explain away a legitimate whole-match win.
- New and older version-2 profiles get an empty `issues` list when absent. Issue snapshots are included in full activity export and empty-profile reset. Invalid reasons, absent facts and oversized notes are rejected. Reports are explicitly local, not sent to support.
- Existing activity epoch binding remains in place; the new issue path does not compare browser and server wall clocks or authorize a stale seat to restore reset progress.
- Creation preserves the chosen configuration and saved theme preference. The fresh profile defaults to dark, with a usable default player name and random bot. Loading the player disables launch visibly.
- Optional 3D is behind a separate showroom destination and a separate activation click. It is not mounted while a room exists. Its cleanup retains AbortController cancellation, renderer disposal and reduced-motion controls.
- Active choices retain ordinary click release and keyboard activation, immutable local locking, separate Sending/Received status and same-attempt retry. Result and source UI is after closure.

## Tests and source follow-up requested

1. Completed-history test: settle round one, start round two, assert only round one is present in projections and current/future keys remain absent; cancel round two and retain round one.
2. Presentation cases: aggregate winner with losing last round; both wrong; both absent; close result; invalid timing void; timeout denominator; legacy partial history.
3. Report cases: missing fact, valid snapshot, same fact/reason with identical note, changed note, reason change, reset, old profile without issues, bounded note and cap behavior.
4. Reinspect root repairs for correct button names and local-save status. Production type/build tests do not establish mobile fit, touch behavior, assistive-technology performance or cross-location latency.

## Deferred product opportunities

Issue snapshots currently keep source, options, accepted answer, local correctness and elapsed time, but not necessarily the submitted choice or format. Those fields would help future content triage; add them when expanding the journal schema rather than implying the current export contains them. Profile tier names and side-quest copy still retain the earlier curiosity vocabulary; acceptable as a secondary learning area, but the core competitive identity should remain FACT//DUEL.

## Repair reinspection and closeout

The root subsequently repaired the implementation. A short read-only reinspection verified:

| Finding | Reinspection result |
|---|---|
| L2-01 | **Addressed.** Bot replay now captures the completed room configuration and invokes a new create operation; friend replay is labelled **Set up rematch**. The reinspection caught the temporary direct-click-handler regression after `create` gained an optional config argument. Root changed the lobby handler to `onClick={() => create()}`, so a React click event cannot become the configuration. |
| L2-02 | **Addressed.** Reports now identify the exact encountered round plus reason; an identical note is idempotent, a changed note replaces the existing note, the hook checks the actual saved text, and reopening/category change prefills the existing note with an explicit **Update saved issue** action. |
| L2-03 | **Addressed in the primary receipt.** Each time is labelled **Browser-reported time** or **Scheduled bot time**. Faster-time copy identifies the winner's actual timing type. Requested a final small copy adjustment from **Reported times** to **Compared times** in the close-result sentence so bot comparisons use the same terminology. |
| L2-04 | **Addressed.** The primary receipt shows each selected option from the settled round's own shuffled options. |
| L2-05 | **Addressed in calculation.** Denominator now counts valid resolved rounds, and missing submissions are explicitly counted. Requested a final label **CORRECT ANSWERS** to make the numerator unambiguous. Invalid timing rounds are excluded. |
| L2-06 | **Addressed.** Completed-history presence now gates final review and activity recovery even when the cancelled current round has no result. |
| L2-07 | **Addressed.** Invalid timing tabs use a dash rather than **D**. Their review reason explicitly states that the match was refunded. |
| L2-08 | **Addressed.** Light-theme draw color is `#a34713`; direct contrast recomputation against white is **6.06:1**. |
| L2-09 | **Source mitigation implemented; empirical gate remains.** Active mobile play removes repeated HUD captions, compresses gaps/card spacing and uses 60px minimum answer areas while keeping 16px answer text. No observed viewport-fit or physical-touch claim is made. |

No remaining code blocker was identified in this bounded reinspection after the root fixed the click-handler regression. This is source-review closeout, conditional on the root's final affected tests, type-check and production build. It is not browser, assistive-technology, physical-device or cross-location certification.

### Final lead integration

The final copy uses CORRECT ANSWERS for the summary numerator and Compared times for close-result wording. A cancelled unfinished round is excluded from the expected completed-history count, so it does not falsely trigger the older-room history warning. Current decisions and roadmap supersede the prior Curiosity Arcade presentation while preserving the research. These final integrations were made by the lead after the bounded source reinspection.
