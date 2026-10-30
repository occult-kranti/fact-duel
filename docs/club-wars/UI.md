# Mobile club interaction review

Expert role 3: mobile interaction and club UX. These are three rounds of AI design review and implementation checks, not interviews or approval by independent human experts. Review date: 30 October 2026.

## Round 1 — diagnose the first visit

The earlier team sheet treated membership count and playing size as the same limit. Raising it to 22 would have put reserves into competition, made readiness incorrect and lengthened the first screen. A member could also receive a Play button without a place on a fixture's frozen team sheet. Authority roles, optional identity tags, preparation and recurring fixtures needed distinct explanations and controls.

Decisions:

- Keep `capacity` as playing 5 or XI. A club has a separate maximum of 22 members.
- Show one next action before the roster. Battle and preparation take priority over recruitment. A reserve follows the scorecard rather than receiving an unusable Play action.
- Show three actual members first, with separate Playing 5/XI and Reserves toggles and disclosures for the rest. Empty capacity is a count, not invented people.
- Give preparation, battle and result distinct named steps. Use the user's local lock time and state the duration of battle.
- Keep functional roles separate from consented fun tags. Explain who can change a sheet, arrange a fixture or administer the club.
- Require a fresh home send and away acceptance for weekly drafts. Do not equate a planned slot with an accepted match.

## Round 2 — implementation and cross-role critique

The implemented UI uses the server contract agreed with the backend role. Club membership, default selection and each fixture's selected side remain separate. Captain, vice captain and coach have distinct controls. All fun tags, including Bottle boy, require the member's opt-in, and the member can remove them.

Preparation allows an exact-size replacement sheet or one-for-one substitution. The screen explains the 23-hour preparation, 24-hour battle, immediate start when both sides choose Ready, and reset of both readiness flags when either sheet changes. There are no battle substitutions. Club membership can expand with reserves during battle.

The source review caught and resolved additional mismatches:

| Finding | Resulting change |
| --- | --- |
| Server pauses default selection during preparation, battle or an active cup | Default editor pauses with an explanation; preparation offers the appropriate fixture action. New challenges and cup entry also explain the current lock. |
| Assigning a new vice captain or coach replaces the current holder | The role form names the previous holder and explains that they return to club member before Save. |
| A selected battle player cannot leave or be removed | Leave and removal controls respect the frozen side; the copy distinguishes reserves. |
| “Shared honours” could imply a draw in every result | The phase strip now says “Final scorecard.” |
| Weekly drafts could look automatically accepted | The home club explicitly sends the current side; away acceptance stays disabled until that send, and weekly renewal remains an unchecked choice. |
| The isolated night fixture lacked production semantic colours | The fixture imports `team-theme.css` and uses the real pavilion/floodlights attributes. Production tokens were already correct. |

Original cricket crests and the shared warm paper, ink, saffron and teal visual system are retained. The new camp styling is in the separate club theme. No Supercell artwork or interface assets are copied.

## Round 3 — verification

Actual components were bundled into a clearly labelled local QA fixture using `scripts/jhk-club-ui-preview.mjs`. The managed preview used synthetic QA entries and in-memory responses. It did not create accounts, accept terms, post content or call the game server. Generated fixture output is temporary and must be excluded from production.

| Check | Observed evidence |
| --- | --- |
| 390-pixel preparation and 320-pixel club roster | Managed CUA review, with no horizontal overflow. Inner document widths were 375/375 and 305/305 client/scroll pixels respectively, accounting for scrollbars. |
| Mobile touch targets | Both Playing XI and Reserves toggle buttons measured 48 pixels high. |
| Preparation substitution | Root CUA review selected QA player 11 out and QA player 12 in; the callback used `outMemberId: qa-10`, `inMemberId: qa-11`. |
| Coach permission boundary | Coach can edit a fixture sheet and substitute; the Ready action is absent, with captain/vice captain guidance. |
| Home weekly confirmation | Actual TeamsScreen: Review weekly draft → Send this weekly rematch emitted `sendRematch` for the fixture, then showed Challenge sent. |
| Away draft before home sends | Actual TeamsScreen showed Waiting for the host to send, with Accept disabled. |
| One-off acceptance | After a sent draft, the weekly checkbox began unchecked. Accept emitted `recurrence: none` and opened preparation. |
| Floodlights colours | Actual 390- and 320-pixel frames showed readable preparation amber and roster teal. Production DOM tokens were background `#10272f` and gold text `#ffca7a`. |
| UI authority/state logic | 14 targeted tests passed across `jhk-club-ui-state`, team snapshots and team input validation. Includes reserve eligibility against a frozen fixture, explicit empty selection and legacy fixtures. |
| Source validation | TypeScript `--noEmit` passed after final UI changes. The two new interactive components passed scoped ESLint. |

The backend role separately tests and owns server permissions, races, timing, settlement and recurrence. This UI fixture verifies rendering, visible state and callback payloads; it is not a claim that simulated responses exercised the live database.

No measured retention, satisfaction or conversion uplift is claimed. First-time usability with representative people and field performance on low-end mobile devices remain post-release validation work in the roadmap. Within the reviewed interaction scope, no blocking issue remained after these checks.
