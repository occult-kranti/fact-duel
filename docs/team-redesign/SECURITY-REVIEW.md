# Team authority: independent corrective review

Reviewed 29 October 2026 against the Team Pavilion working candidate: `supabase/jhk/migrations/20261030003000_jhk_teams.sql`, the Edge validation boundary, the existing canonical schema and the prior Mini/Full migration. This is an independent AI source review with selected executed database checks, not a production penetration test or real-team study.

## Findings and changes

| Finding | Evidence and impact | Corrective implementation | Acceptance evidence |
|---|---|---|---|
| An old pending challenge could be accepted before a dashboard reconciled its 48-hour expiry | The original `accept` path checked `pending` and activated directly; lazy settlement ran afterward | `team_reconcile` now runs before team mutations and lock/readiness decisions | Executed SQL regression: accepting an invitation aged 49 hours returns `FIXTURE_CLOSED`; the next challenge can start; an expired active match releases a member on their next leave action |
| An abandoned recruiting cup could block a team's future cups indefinitely | Original creation/join refused an existing open entry, but there was no leave/cancel operation or recruiting deadline | Captain `tournamentLeave`; host cancellation; ascending reseeding after withdrawal; 48-hour recruiting expiry; open-entry retirement when a team archives or its last profile deactivates | Executed SQL regression: leave/reseed and host cancel release future entry. Independent additional probe: another entrant's refresh cancels a 49-hour-old cup, allows a new cup, and last-member archival cancels the new recruiting cup |
| Cup entry wording overstated roster readiness, and cancellation copy attributed every closure to the host | The server allows recruiting teams to enter, requires full rosters to start, and can close recruitment on expiry | Sent to the interface owner: distinguish entry from start and use neutral closure copy | Interface correction reviewed separately by the UI owner; backend semantics are explicit here |

Both backend lifecycle findings are resolved in the reviewed candidate. No remaining publication blocker was found within this bounded review.

## Authority and persistence checks

- Team tables remain inside `jhk_private`, with RLS enabled and table/function access revoked from `public`, `anon` and `authenticated`. Only the existing service role can execute the command boundary. The previous installed command is retained once as `jhk_command_before_teams`; replaying the migration preserves that call chain.
- The team wrapper reuses the existing bearer, expiry, rate-limit and completed-profile checks. Identity and timing assertions from browser payloads are ignored. A team action cannot select another player's session through a payload field.
- The server generates immutable public tags. Private membership invite codes are absent from the public profile and fixture projections; membership views disclose them to teammates. Tournament codes are separate from membership and player recovery credentials.
- A unique session membership plus the short global team advisory lock serializes membership/capacity changes. Competitive activation requires equal full 5-player or 11-player rosters, then freezes the lineup. Active-cup roster locks span the semifinal/final transition. Deactivation removes live membership, transfers captaincy and pseudonymizes the retained historical nickname.
- Runs are unique per fixture/player. Answers are unique per fixture/player/round, and request IDs cannot be reused for another ball. Correct answers, explanations and source URLs are withheld until that player's own receipt exists. Late answers reconcile to the timeout receipt. Question and fixture clocks are server timestamps.
- Accuracy is primary; incorrect and missing balls retain their 30-second penalty. Exact direct-match ties draw. The cup's disclosed lower-original-seed fallback prevents an exact tie from leaving a bracket unresolved. Final creation and fixture awards have uniqueness boundaries.
- Team marks are cosmetic and awarded once per team/fixture. An idle fixture awards zero marks. The team implementation does not add personal XP, stake reservations, wallet payouts or ranked points.

## Executed coverage

The reviewer ran the actual migration and command boundary with PGlite, including reapplying the migration, rather than a duplicate JavaScript rules engine:

1. Service-only permissions and existing human-over API compatibility.
2. Recruiting-cup withdrawal, reseeding, cancellation and future-entry recovery.
3. Expired-invitation rejection and stale roster-lock release.
4. An additional independent recruiting-expiry and last-member-archive probe.

All four selected cases passed without skips or failures. The server implementation owner runs the wider team SQL/Edge suite; the integrating owner runs the full project and publication gates.

These checks do not establish WAN timing fairness, physical-phone usability, adversarial collusion resistance or multi-process production load behavior. The global advisory lock is a deliberate beta throughput limit. Settlement is reconciled by authenticated requests; this review does not claim a newly deployed background team scheduler.
