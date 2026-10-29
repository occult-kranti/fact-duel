# Flow review, round 1

The launch path previously stopped the whole app behind a required profile and recovery-code acknowledgement. After each completed match, progression could queue a fullscreen level/badge/streak ceremony and several reward toasts. This obscured the next-play action even though the scorecard already reported results.

Implemented decisions:

- Opening the app never opens a signup or recovery modal. An optional Player card action opens setup/recovery; Back and Escape return to the game.
- Email is optional in setup and player editing. A saved code can restore an existing identity; neither entering email nor acknowledging a code is necessary to play.
- Age/terms attestation remains explicit for online server play. Local bot practice has no profile requirement.
- XP, quest, badge, rank and streak overlays are suppressed in the game. Their underlying records and inline screens remain available. Operational information can still show a single toast; playgrounds may explicitly enable reward overlays.
- Ad entry says “Watch optional ad”. Ads remain outside active questions, and no-fill does not block play. Existing provider consent and approval gates remain intact.

Source guidance checked on 2026-10-29:

- W3C ARIA APG, Dialog (Modal) Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ . Apply focus trapping only when a user-requested modal is open, close with Escape, restore focus to the triggering control.
- W3C H102, HTML dialog technique: https://www.w3.org/WAI/WCAG22/Techniques/html/H102 . Supports expected modal focus and close behavior.
- Google Ad Placement API placement types: https://developers.google.com/ad-placement/docs/placement-types . Mark actual game boundaries using the matching placement context.
- Google H5 Games Ads practices: https://services.google.com/fh/files/helpcenter/h5_games_policy_best_practices_infographic.pdf . Natural game breaks and pause/mute coordination guide ad timing.

Verification: `node --test tests/cricket-notification-policy.test.mjs` passes two behavioral tests covering reward suppression and operational visibility. Full UI validation belongs to the integrated round 2 pass.

# Flow review, round 2

Integrated review found three remaining result-flow distractions: the room still inserted a coin-earning ad upsell, a fixture promotion, and four expanded reward-stat tiles after the score. It also sent Done into the progression screen rather than home.

Resolved in the integrated pass:

- Bot/local result now leads with score and Play again. Done returns home. Current-match questions and sources remain available in a collapsed review; earned stats remain in a separate optional disclosure.
- Removed the coin-earning ad upsell and fixture promotion from the result page. Events remain available from navigation.
- Compact results skip automatic win/loss celebration effects. The existing inline result and answer feedback remain.
- A completed, settled bot match can use the same optional ad cadence as a human duel. The local match passes `kind: duel`, so practice does not offer an ad after every run. Two wins or three losses offer one natural break, and reloads cannot count the same result twice. Active/cancelled/unfinished rooms are excluded. Approved delivery and consent remain required.
- Reviewed the optional profile route: root exposes Player card/restore, no launch gate opens, Escape/Back remain available, and no email is mandatory. Matchmaking round 2 corrected the expired-session restore action to open this optional dialog and corrected stale profile-first copy.
- Bot rematch resets the settled room and retains its config before creating another local match. Human Play again uses the matchmaking controller; private rooms stay human-only.

Validation: the completion, notification, and existing ad-runtime suites pass 15/15 behavioral tests. Full project `tsc --noEmit` passes. Final visual verification of mobile/desktop themes remains part of the root integration pass.
