# JHK — Play for your club

Product release and validation plan · 2026-10-30

No measured traction, revenue or retention is represented. This pitch separates the release scope from the validation and season roadmap.

## 1. Play for your club.

A quick cricket quiz. A shared team story.

- Mobile-first cricket trivia with solo overs, club rivalries and a reason to meet again.


Notes: JHK release positioning. No traction, market-size or revenue claim. Target audience and return behavior remain hypotheses to validate.

## 2. A quick game can start a lasting rivalry.

The hypothesis: friends make the next match meaningful.

- Start with a short, understandable over.
- Give every player a club identity and a useful role.
- End with a result to share and a next match they choose.


Notes: Audience hypothesis: mobile cricket fans who want a short challenge with friends. This is not a finding from user interviews. Motivation reference: autonomy, competence and relatedness; https://repository.essex.ac.uk/7228/ . Validate using first-match completion and voluntary club return.

## 3. 22 belong. 5 or 11 take the field.

The club roster is bigger than the playing side.

- Pick a lineup during preparation. Keep reserves involved without putting them in the playing XI.
- Substitutions close when the lineup locks; reserves do not add match attempts.

| Format | Playing side | Reserve places |
| --- | --- | --- |
| Five-a-side | 5 players | Up to 17 |
| Playing XI | 11 players | Up to 11 |


Notes: JHK design contract: total club membership cap22. Playing side5 or11; remaining members are reserves. A reserve only becomes active through an authorized preparation-stage lineup change. Match participation eligibility is fixed after lock. Not Supercell artwork or mechanics copied verbatim.

## 4. Mini over. Full over. Clear choice.

Choose the time you have before you start.

- Mini over — 3 rounds.
- Full over — 6 rounds.
- Keep the result receipt simple: score, XP and any simulated-coin return.


Notes: Mode names and round counts are user requirements. Exact match rules and XP values belong to the server and visible game rules; this deck does not promise a payout or XP multiplier. Coins are simulated, with no cash value.

## 5. Prepare together. Play on your time.

A shared clock gives the rivalry a clear beginning and end.

- Both sides can confirm readiness to begin early. Existing live fixtures keep their original deadline.

- **23h PREPARATION** — Invite, choose the playing 5 or 11 and arrange reserves.
- **24h BATTLE** — The locked lineup plays within the battle window.
- **Next FRESH CHOICE** — Both captains opt in. A new weekly draft needs fresh acceptance.

Notes: Official reference: https://support.supercell.com/clash-of-clans/en/articles/about-clan-wars-2.html . CoC has23h preparation and24h battle. JHK adaptation uses trivia matches, playing 5 or 11, club cap22 and fresh weekly draft confirmation. The home side sends; the away side accepts. Recurrence is off by default and needs both captains to opt in; neither side is automatically enrolled. Early start requires the current authorized lineup leadership on both sides; server remains authoritative. Old active fixtures keep their original24h deadline.

## 6. Useful roles. Playful badges.

Authority and personality are separate.

- A badge never grants permission, better answers or extra playing slots.

| Role | Purpose |
| --- | --- |
| Captain / Vice-captain | Lead the club and confirm match decisions. |
| Coach | Help arrange the lineup; limited authority. |
| Member / Reserve | Belong to the roster; play when selected. |
| Bottle boy & fun badges | Opt-in identity; remove your own badge. |


Notes: Permissions are enforced on the server. Coach has limited lineup authority, not full club administration. Captain/VC powers remain explicit. Fun badges require player opt-in and self-removal. Avoid making a disparaging role mandatory.

## 7. One opponent now. A cup to chase next.

Team fixtures build toward small, understandable tournaments.

- Challenge another club with a visible format and deadline.
- A four-team cup gives each match a place in the bracket.
- Show who is playing, what is locked and what happens next.


Notes: Club challenge and four-team cup are the scoped product release. Recurring fixtures remain opt-in drafts. Larger leagues, automated seasons and scheduling orchestration remain roadmap work until implemented and verified. No claim of existing tournament participation.

## 8. The first tap should start the story.

Teach through the first over, then reveal the wider club game.

- Play, Teams, Explore, My club and Answers stay easy to reach. My club holds personal progress; desktop uses the same hierarchy.

- **01 START** — Choose a Mini over with a visible time commitment.
- **02 LEARN** — Answer, see cricket feedback and understand the result.
- **03 BELONG** — Save progress, create or join a club, then meet the next rival.

Notes: Mobile-first intended information architecture. First-time player flow and target audience are design assumptions requiring usability testing. No claim of measured onboarding improvement. Implementation details, guest/account restrictions and eligibility should remain visible where relevant.

## 9. Make the finish feel like cricket.

Joy when you win. Dignity when you lose.

- Victory: bat, ball and a short cricket cheer.
- Loss: wicket gone; a useful prompt for the next over.
- Close finish: a run-out moment, followed by a clear score.


Notes: Original JHK cricket art direction. Feedback must match the actual result; a close finish is determined from the game rules, not manufactured. Sound starts only after a user gesture, can be muted, and motion respects reduced-motion preferences. Loss feedback avoids shaming and false rewards.

## 10. Earn a reputation people recognise.

Progress should explain what the player did well.

- XP makes completed play and improvement visible.
- Club tags, banners and local titles build a shared identity.
- Cosmetic recognition keeps match outcomes fair.


Notes: Visible XP, club tags, banners and title direction. Do not imply that all future title ladders, seasonal unlocks or banner editors already ship; see the release/roadmap slide. Local labels should follow the player’s chosen location or club identity, never precise undisclosed location. No evidence yet of improved retention.

## 11. Share the story. Choose the rematch.

A scorecard is the invitation.

- Share a cricket result with a club tag and the actual score.
- Let the recipient understand the game before asking them to join.
- Offer the next match as an opt-in draft with a clear deadline.

- **Share RESULT** — The actual score and club tag become a cricket story.
- **Try FIRST OVER** — The recipient understands the game before joining.
- **Return FRESH DRAFT** — The next match is a choice, with a clear deadline.

Notes: Growth design hypothesis. No viral coefficient or retention promise. Use native share when available and a copy/download fallback. Exclude private member information from public scorecards. Invites must not automatically accept challenges or enroll players into recurring matches. Future attribution should be consent-aware.

## 12. Prove the loop with real clubs.

Measure whether the experience earns another visit.

- Use cohort denominators. Claim improvement only after a fair comparison.

| Hypothesis | Evidence to collect | Guardrail |
| --- | --- | --- |
| First play feels clear | First-over completion; task observation | Errors, confusion, early exits |
| Club identity adds value | Voluntary club join and second fixture | Reserve exclusion; admin effort |
| Sharing invites useful play | Shared result → first completed over | Spam reports; privacy complaints |
| The clock supports return | Opt-in rematch acceptance and completion | Missed windows; reminder opt-outs |


Notes: Measurement plan, not measured results. There are no fabricated cohort sizes, retention rates, revenues, market totals or launch dates. A pilot should include first-time users, captains and reserves across common mobile screens. Consent and privacy guardrails accompany any later analytics implementation.

## 13. Release the core. Earn the season layer.

Keep the next investment tied to observed player needs.

- Seasons and scale are roadmap work; outcomes still need validation.

| Stage | Scope | Exit evidence |
| --- | --- | --- |
| Core release | 22-player clubs; 5/11 lineups; roles, clocks, cups and results | Server, mobile and accessibility checks |
| Club pilot | Onboarding; captain and reserve journeys | Observed task completion; reliable settlement |
| Season layer | Richer banners, local ladders and season rewards | Fair rules; progression comprehension |
| Scale decision | Notifications, recurring drafts and larger leagues | Repeat play plus operational capacity |


Notes: Release scope described in current repository; publication is contingent on verification and deployment. Future stages are direction, not promised dates. An investor should request evidence of current build, pilot results and costs before financial modeling. No revenue, market-size or fundraising valuation is asserted.

## 14. Let the clubs play.

Learn what earns the next over.

- Pilot with new players, captains and reserves.
- Observe the first match, substitution and rematch.
- Expand after the flow is clear, fair and reliable.


Notes: This deck proposes a pilot and validation sequence. It does not imply that recruitment, retention, monetization or funding has been secured. Updated product pitch replaces historical FACT//DUEL assumptions; older research files remain in Git history and are not current product evidence.

## Sources

- [CoC regular wars](https://support.supercell.com/clash-of-clans/en/articles/about-clan-wars-2.html) — 23h preparation, 24h battle and selected lineups.
- [CoC league lineups](https://support.supercell.com/clash-of-clans/en/articles/cwl-week-of-wars.html) — Lineup changes during preparation.
- [CoC club roles](https://sc-clashofclans.zendesk.com/hc/en-us/articles/49529121959323-Clan-Roles) — Permission roles as a reference; JHK uses its own role model.
- [Player motivation](https://repository.essex.ac.uk/7228/) — Autonomy, competence and relatedness; does not establish JHK retention.
