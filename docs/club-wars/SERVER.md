# Club war server contract

Implemented in `20261030020000_jhk_club_wars.sql`, additive to the canonical schema and team migration. Apply in that order. Applying the club migration twice is tested. Existing fixture `war_version=0` keeps accepted roster, deck and deadline; an already running legacy cup final continues with the frozen semifinal roster and immediate 24-hour battle.

## Membership and authority

A club has at most 22 members. `capacity` remains the playing side, exactly 5 or 11, independently selected using `selectedMemberIds`. Reserves may join and leave throughout cups and battles. A selected member cannot leave or be kicked during battle; privacy deletion remains available and preserves a pseudonymized, zero-for-missing contribution receipt. Default side changes wait until the active fixture/cup finishes; during preparation use the fixture sheet.

Captain controls settings, captain transfer, membership and authority roles. Exactly one vice captain may arrange friendly matches and cups and manage lineups. Exactly one coach may manage lineups. Roles never force playing selection. Fun badges have no authority, require each member's explicit consent, and can be removed by that member. Consent withdrawal removes the badge from current and historical lineup snapshots too.

## State and clocks

A new accepted friendly or each new cup stage enters `preparation` for 23 hours. The battle lasts 24 hours from the preparation boundary, even when the next request arrives late. Early battle requires both captains/vice captains to mark their current sheets ready. Any sheet change, substitution, selected departure or deletion clears **both** readiness receipts. Battle lineups cannot change and contributions cannot be duplicated.

If a side is incomplete at preparation expiry, its unplayed fixture is declined with `incomplete-lineup`, no fixture awards, and a cup cancels all unfinished stages and releases every club lock. Completed earlier-stage receipts and already earned marks remain. A finished battle with no submitted answers has `settlementReason='no-contest'` and zero marks. Other finished battles use `completed`; existing correctness/time/seed scoring and once-per-fixture mark awards remain unchanged. No club operation changes personal XP or the simulated wallet.

## Weekly rematch drafts

Weekly is optional and requires both sides to opt in. A finished friendly creates at most one pending draft at the next future seven-day boundary measured from its preparation start; missed boundaries are skipped. A draft is not sent and commits neither club. At/after `availableAt`, the home captain/vice captain explicitly calls `sendRematch`, snapshotting the freshly confirmed current playing side. The away side must then accept; it can decline weekly recurrence. Acceptance rejects an unsent draft or a home snapshot whose member has since departed. The home side can send again to confirm a repaired sheet. Each accepted cycle has fresh preparation and no early-start readiness carried forward. Either club's captain/vice captain can stop the series. Archived clubs stop drafts. Cancelled preparation creates no follow-up. Recurring cups and external notifications are not implemented.

## Additive command API

| Operation | Payload | Authority |
| --- | --- | --- |
| `selectLineup` | `memberIds` exactly 5/11 UUIDs | Captain, VC, Coach |
| `assignRole` | `memberId`, `role`: member / vice-captain / coach | Captain |
| `roleConsent` | `consent` boolean | Self |
| `assignBadge` | `memberId`, `badge`: none / bottle-boy / analyst / keeper / finisher / cheer-captain | Captain; self may remove |
| `fixtureLineup` | `fixtureId`, `memberIds` exactly 5/11 UUIDs | Captain, VC, Coach; preparation |
| `substitute` | `fixtureId`, `outMemberId`, `inMemberId` | Captain, VC, Coach; preparation |
| `readyLineup` | `fixtureId`, `ready` boolean | Captain, VC |
| `startBattle` | `fixtureId` | Captain, VC; both ready |
| `sendRematch` | `fixtureId` | Home Captain, VC; scheduled draft |
| `stopRecurrence` | `fixtureId` | Either Captain, VC |

`challenge` and `accept` add `recurrence: 'none'|'weekly'`; omission means none. Existing operations and response fields remain.

Team adds `rosterLimit`, `selectedCount`, `selectedMemberIds`, `permissions` (`manageClub`, `manageLineup`, `arrangeMatches`), and member `role`, `funBadge`, `funBadgeConsent`, `isSelected`, `isReserve`. Fixture adds `warVersion`, `prepEndsAt`, `battleStartsAt`, `availableAt`, `draftSentAt`, `ready`, `lineups`, `settlementReason` and recurrence `{cadence,confirmed,stopped,isDraft,homeConfirmed,nextDraftAt,nextFixtureId}`. Time fields are server milliseconds. Fixture participation uses its own `lineups`, not the club's later default selection.

## Security and operational limit

The existing opaque device bearer is validated by the Edge wrapper before the service-only Postgres command. Clients cannot assert authority, IDs, deadlines, scores, mark awards or readiness snapshots. Club helpers remain private security-invoker functions with an empty search path; `anon` and `authenticated` have no private-schema/table/function access. All nine team tables retain RLS. The existing global transaction advisory lock serializes short beta team mutations, not the thinking interval. This is a beta throughput limit, not a horizontally scaled matchmaking queue.

Reconciliation runs on requests; there is no background scheduler or push notification promise. UI uses server timestamps to show clocks, while API actions reconcile due states. Expired invitations, archived clubs and stopped series close honestly. Release requires additive SQL migration and Edge validator deployment together before client promotion.

## Executed verification

Run with a local PGlite dependency, without a remote service key:

```sh
PGLITE_MODULE_PATH="$PWD/node_modules/@electric-sql/pglite/dist/index.js" node --test tests/club-wars.test.mjs tests/club-war-input.test.mjs tests/jhk-team-input.test.mjs
```

Coverage includes both roster sizes and 22-slot limits; private grants/RLS/auth; authority escalation and optional badge consent; scheduled and early clocks; readiness invalidation; pre-battle substitutions; reserve joins/leaves during battle and cup; incomplete friendly, semifinal and final cancellation; weekly consent, one-draft idempotence, skipped cycles, opt-out and archive; actual answer replay locks; profile deletion/captain replacement; new cup final preparation; and a real legacy active fixture migrated twice without changing its deck, clock or roster. Tests time-travel through the private server command only in test code; the Edge protocol strips client time assertions.
