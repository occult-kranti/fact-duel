# JHK Club Wars design specification

Updated 30 October 2026. This extends the existing Team Pavilion system. The companion [editable HTML canvas](design-board/index.html) and [editable SVG flow](design-board/flow.svg) are the visual specification. Every player, club, score, countdown, role assignment and calendar date in the canvas is illustrative. Preview controls never change an account or competition.

## Visual direction

The cricket pavilion grows into a team camp: warm paper, an ink scoreboard, a cloth pennant, a ruled team sheet and a marked pitch. The app is an **Operate** surface: the valid next action, current phase and deadline lead. The canvas is a **Read / Experience** surface: it makes the relationship between screens visible and allows copy editing, width selection and outcome previews. Celebration supports a settled result; it does not compete with a question.

The original generated cricket triptych is `public/art/cricket-outcomes.webp`, with provenance in the project's art documentation. It sets the boundary / wicket / close run-out mood. Exact animated equipment positions use original SVG geometry in the game. No Supercell character, screenshot, logo or copied UI asset is used.

Primary composition reference: [MCC's Pavilion heritage page](https://www.lords.org/mcc/heritage-collections/heritage-trail/pavilion). Its pavilion and honours-board context informs the club metaphor. The artwork search was a reference for cricket equipment, spacing and visual rhythm; none of those search images is embedded. The [Club Wars research record](RESEARCH.md) identifies the official Supercell mechanics and the scope of the psychology, UX and player evidence. These are source-led design judgements, not a claim to have read entire books or tested a representative JHK audience.

## Palette and typography

Use the established semantic tokens rather than a new theme for each screen. Saffron identifies a primary commitment or the preparation stage. Teal identifies selection, shared club identity and the battle stage. Coral explains an error or a literal wicket outcome. Muted text stays readable and is never the only indication of a disabled control.

| Role | Pavilion token | Usage |
| --- | --- | --- |
| Paper | `#f7f1e6` | Main canvas and page surface |
| Card | `#fffdf8` | Input, team sheet and readable detail |
| Ink | `#122c35` | Text and scoreboard |
| Muted | `#53656a` | Supporting information |
| Saffron | `#ffbd59` | Primary button with ink text; preparation rule |
| Teal | `#076f6b` text, `#087f7a` fill | Club identity and selected status |
| Rule | `#d9d9cc` | Dividers and restrained borders |
| Error | `#a33229` text | Actionable errors |

Calculated sRGB contrast: ink/paper **13.00:1**, muted/paper **5.43:1**, teal text/paper **5.34:1**, ink/saffron **8.82:1**. Floodlights uses the existing dark tokens: muted `#b9c9c9`, teal `#8dded3`, amber `#ffca7a` on card `#17343c` give **7.70:1**, **8.49:1**, **8.78:1** respectively. These values describe the token pairs; browser review is still required for actual composited surfaces, borders and states.

Bricolage Grotesque provides expressive cricket headings. Instrument Sans carries actions and readable body copy. JetBrains Mono supports exact counts and clocks. The theme extension is limited to `app/club-wars-theme.css`; layout and interaction geometry remain owned by the Teams components.

## Product contract visible in the design

| Relationship | Required presentation |
| --- | --- |
| Membership | Up to 22 club members, distinct from a playing format of 5 or 11. A public club tag remains separate from the private invite. |
| Selection | Exactly 5 or 11 eligible identities on a fixture sheet. Remaining members are reserves. Role and selection are independent. |
| Reserve | Belongs to the club and may be selected before lock. No extra scoring attempts and no substitution during battle. |
| Captain | Club administration, functional roles, team sheets and fixtures. |
| Vice captain | Team sheets and fixtures; one VC per club. |
| Coach | Team sheets only; one Coach per club. |
| Fun tag | Cosmetic only. Recipient opts in on their own account and can remove it or revoke consent. Bottle boy never grants authority. |
| Preparation | Default 23 hours. Show a local absolute lock time, countdown, selected count and permitted substitution action. |
| Early start | Both captains/VCs mark the current full sides ready. Any preparation change clears readiness. Both sheets lock together when battle opens. |
| Battle | 24 hours. Frozen identities, one accepted over per selected player, existing Mini over 3 / Full over 6 and authoritative scoring. |
| Existing live match | Preserve its original deadline and eligibility contract. |
| Weekly rhythm | Both clubs opt in. After settlement, at most one future pending draft on a 7-day anchor. Fresh cycle acceptance and line-up confirmation; missed weeks do not queue. Either Captain/VC can stop future drafts. |
| Cup | Existing four-club bracket. Each fixture uses its own preparation and battle window; selection is reconfirmed for the next fixture. The exact tie rule stays disclosed. |

The source of truth is the server. The canvas is intentionally unable to grant roles, enroll players, score an answer, send an invitation or simulate a real opponent.

## Screen hierarchy

1. **Club camp:** banner and member count, current fixture and next valid action, then the rest of the clubhouse. Solo Mini over remains easy to reach.
2. **Team sheet:** club pool / selected side / reserves are separate counts and filters. Do not suggest an empty reserve slot is a missing playing answer.
3. **Roles:** explain powers before assigning them. Functional roles and voluntary fun tags have separate controls.
4. **Preparation:** deadline, full side, substitutes, readiness. Selection must stay an exact-size operation.
5. **Calendar:** show the present fixture and one next opportunity. “Draft” is visible before a user commits to a weekly rhythm.
6. **Battle:** phase, locked side and contributions above a stable timed question. No art, modal or animation shifts an answer target.
7. **Result:** truthful score and outcome first; cricket motion and optional cues follow. Replay, return and sharing remain optional.
8. **Cup:** current fixture state and bracket progression. Do not make the future final look playable before both semi-finals settle.
9. **Preferences:** personal fun-tag consent, sound/motion and authorized recurrence controls. A normal member can understand the controls without being shown captain-only actions.
10. **Desktop:** the same hierarchy, with the team sheet beside the fixture. The larger viewport is useful space rather than a new navigation model.

The canvas supports 390px mobile, 320px compact and a desktop adaptation. The long horizontal board is deliberate; individual phone frames scroll vertically. Jump controls restore visible mobile frames when leaving desktop-only mode. Native buttons, inputs and selects retain keyboard focus. Copy edits are preview-only and do not save to app data. The editable SVG explains the flow without relying on a raster diagram.

## Motion and feedback

Boundary win, literal wicket loss and a defined close run-out have different equipment movement and copy. They never disguise a loss as a win. A draw retains a neutral truthful result. Close-loss classification belongs to the result model; the demo's outcome switch is explicitly illustrative.

The canvas has a finite **1.2-second replay**, a global pause and a static reduced-motion fallback. The game uses its own bounded post-settlement moment, never an infinite animation. Sound is opt-in in the actual app, with mute available. Neither cue blocks a question or hides ordinary result navigation. There is no automatic share prompt, absence debt or loss of earned identity for declining a future draft.

## Delivery and review ledger

Figma's existing Starter MCP file quota was exhausted in the preceding design pass; the editable source canvas is the concrete fallback. A previously created Figma file is not evidence of successful design-layer delivery. The HTML and SVG are maintained with the application source and published at `/design/club-wars/`.

| Round | Evidence | Status |
| --- | --- | --- |
| 1 — Contract and first implementation | Read existing PRODUCT/DESIGN context; reviewed pavilion reference and official mechanics supplied by the research perspective; implemented nine mobile screens, desktop adaptation, exact flow SVG and scoped theme. Checked module syntax and SVG XML. | Complete |
| 2 — Cross-role critique | Research perspective inspected canvas contract; corrected date/time visibility and separated functional roles from recipient-approved fun tags. Moderator confirmed both readiness flags reset. | Complete |
| 3 — Confirmation | Managed preview: compact/mobile/desktop frame overflow, original image loading, reserve filter, recipient consent isolation, draft stop, finite result replay and rendered SVG. Actual desktop preparation and 390px/320px floodlights components inspected after the fixture imported production theme tokens. Final module syntax and SVG XML checks passed. | Complete |

Round 2 corrections: removed infinite result motion in favour of a deliberate finite replay; made Coach powers concrete; clarified that role and selection are independent; coordinated the readiness-reset wording across the app and canvas; added an explicit illustrative local lock and battle-end timestamp; separated functional-role editing from optional fun tags; and gated cosmetic tags on the chosen recipient’s consent. The self-consent checkbox affects only the preview’s own player. Captain self-selection shows a disabled Captain control rather than a Member role. The research perspective also requires actual per-cycle confirmation for generated drafts, and a truthful cup terminal state when a selected side becomes incomplete. Those server corrections are owned by the relevant implementation perspective.

Observed managed-browser measurements: every 390px and 320px phone frame had `scrollWidth === clientWidth`; desktop canvas frame was 1210px with no internal horizontal overflow. The actual desktop preparation card was 1178px within a 1348px viewport, also without horizontal overflow. Browser interaction confirmed exactly 11 reserve rows, desktop navigation restoring mobile targets, the recipient remaining blocked despite own-card consent, a one-iteration close-run-out animation and a stopped-drafts state. Original cricket artwork loaded successfully. The isolated QA fixture initially omitted production semantic colors; after it imported `team-theme.css` and set `data-theme="dark"` / `data-cricket-theme="floodlights"`, the actual 390px preparation stage and 320px Captain/VC/Coach badges displayed readable amber/teal text. Night preparation resolved to `#ffca7a` on its amber-tinted dark surface; roster width was 305px and preparation width 375px, both equal to their scroll widths. The SVG return path was moved away from the acceptance caption during the confirmation pass. All three bounded review rounds are complete. These checks establish rendered fit and local preview behavior, not server authorization.

This is an AI-assisted six-perspective review, not human panel testing, audience unanimity, measured satisfaction or a demonstrated retention lift. Physical phones, actual target-user task completion, runtime screen readers and audio listening require separate evidence. The final release record should distinguish executed acceptance checks from design inspection and later audience-validation plans.
