# JHK Club Wars — delivery roadmap

Prepared 30 October 2026. Gates 1–6 are implemented and passed the scoped release checks recorded in PANEL.md and SERVER.md; publication status is recorded in DEPLOYMENT.md. Gate 7 requires actual target-player research. Durations below are product rules or proposed experiments, not delivery promises.

| Gate | Product outcome | Required evidence |
| --- | --- | --- |
| 1 — Club foundation | Existing teams become clubs with capacity 22; playing size remains 5 or 11; public automatic tag stays distinct from private invite. Captain/VC authority and Coach's limited lineup function are separate from cosmetic tags. | Migration/legacy fixture checks; membership limits; role authorization and invite secrecy checks. |
| 2 — Prepare, select, substitute | Each side explicitly confirms its playing lineup. Reserves substitute during the 23-hour preparation period; the server freezes the playing identities at play. Captains/VCs can choose early play only when both current lineups are ready. | Duplicate/foreign member rejection; before/at/after deadline checks; immutable run eligibility; mobile lineup/reserve clarity; a changed lineup invalidates both sides' prior readiness. |
| 3 — Play and settle | A 24-hour play window preserves Mini over 3 and Full over 6, with existing authoritative timing and scoring. Outcome and contribution rewards settle once. | Real fixture completion, timeout and exact draw; replay/idempotence; missing-run treatment matches visible rules. |
| 4 — Cricket identity and feedback | Original banner art, readable mobile navigation, earned local titles, optional share card and truthful bat/ball/wicket/run-out feedback. | Narrow-screen screenshots, keyboard controls, contrast review, reduced motion, opt-in sound and an ordinary static result path. Share payload contains no invite secret. |
| 5 — Weekly rhythm | A voluntary series creates one upcoming draft; captain/VC selects a fresh lineup and can pause. No missed-cycle backlog or silent enrollment. | Retry and overdue-cycle checks, paused series check, visible next date and availability state. |
| 6 — Team tournaments and presentation | Existing team cup path and new club rules are coherent. Roadmap, design canvas and pitch deck distinguish shipped capabilities from planned research and expanded formats. | Cup progression and roster-snapshot checks; links to current production; deck claims reconciled with actual release evidence. |
| 7 — Audience validation | Run first-time mobile tasks with actual target players, then evaluate completion and return behavior. | Consent-based real observations, task success and confusion notes. Establish baseline analytics before making improvement claims. |

## Review cadence

- Round 1: official mechanics, dated player accounts, scoped psychology and UX sources; choose the contract and acceptance cards.
- Round 2: inspect the changed implementation and canvas; resolve permission, time, first-run and roster confusion before final checks.
- Round 3: run selected fixture, boundary, result and mobile checks; correct the deck and deployment claims to match observed evidence.

## Later experiments, separated from this release

Validate the 47-hour default fixture commitment and the clearly marked “start when both ready” option with actual players; do not silently shorten production war timing. Test whether local titles and a simple invitation card improve voluntary club formation using a predefined metric and baseline. Add emergency play-window substitution only after proving that both the outgoing and incoming player have never opened that fixture's questions. Expand tournament sizes only after checking bracket, expiry, reserve and reward settlement at the existing size. Do not introduce purchased scoring advantages, compulsory streaks, expiring earned identity or unverified promotional claims.


## Release schedule and operating rules

| Moment | Window | Action and owner | End condition |
| --- | --- | --- | --- |
| Club formation | No forced countdown | Captain recruits up to 22; selects a default playing 5 or XI; assigns one VC and one Coach if useful | A complete selected side can challenge an equal-size club |
| Invitation | 48 hours after availability/send | Home Captain/VC sends; away Captain/VC accepts or declines | Unaccepted invitations expire when reconciled |
| Preparation | 23 hours after acceptance | Captain/VC/Coach chooses substitutes; Captain/VC may mark early readiness | Both sides ready starts early; otherwise server opens at the scheduled boundary. Any sheet edit clears both readiness flags |
| Battle | 24 hours from actual scheduled/early start | Every frozen selected player plays one 3- or 6-question over; reserves follow results | Everyone finishes or deadline closes; no in-battle replacements |
| Cup | Four clubs; semi-finals then final | Host opens preparation; each new stage has its own 23h/24h clock | Cup settles once; incomplete prep cancels/unlocks all entrants without a result award |
| Weekly rematch | One draft on the next future 7-day cycle | Home freshly sends a selected side; away freshly accepts. Either can stop | No backlog, automatic entry or unattended acceptance |

Dates use local time and relative remaining time. The database reconciles phase changes on authenticated team requests; no push alert or always-running scheduler is included. Existing live fixtures keep their old deadline and selected identities.

## Next research sequence

1. **Before expansion:** observe first-time mobile players finding Mini over, joining a club, distinguishing reserves, substituting during preparation, and finding the next match. Include Captain/VC/Coach and reserve perspectives; record task completion, mis-taps and unclear wording.
2. **After a baseline exists:** measure first-over completion, voluntary club creation/join, selected-player contribution, reserve participation, accepted rematches and return visits by cohort. Define consent and event retention before instrumentation; do not infer retention gains from this redesign.
3. **After stable club cycles:** test alternative invitation copy and a lighter default competition cadence with clear opt-in. Preserve a control and report uncertainty; do not silently alter running clocks.
4. **Only after demand and correctness are demonstrated:** evaluate larger brackets, additional club honours, reserve availability declarations and carefully constrained emergency substitution. These are roadmap items, not current controls.
