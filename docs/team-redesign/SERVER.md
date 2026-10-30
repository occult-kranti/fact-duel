# Team cricket server contract

Prepared October 29, 2026. This is JHK's separate, asynchronous team competition. It uses the existing email-free server player and custom bearer authentication. It does not widen the two-seat human room protocol, import browser scores, or change the sibling game.

## A squad and its identity

Each player may belong to one active squad, with a fixed capacity of **5 or 11**. The captain chooses a name, base emblem and palette. The server generates an immutable public tag, such as `GULL-12AB`, from an ASCII name prefix and random suffix; names without an ASCII prefix use `JHK`. The tag identifies a team for challenges. It is not a joining credential.

The distinct, random, 16-character hexadecimal invite code appears only in the authenticated team's own roster view. Anyone holding that code can join while invites are open, there is capacity, and the roster is not locked. Captains can rotate it. A global transaction advisory lock plus the unique player-membership constraint serializes short changes and prevents overfilling or two simultaneous memberships. This is a bounded casual beta, not a demonstrated large-scale concurrency design.

Captains can rename the team, select an unlocked emblem and palette, open/close joining, remove a member, rotate the invite, and transfer captaincy. Capacity and tag stay fixed. A captain with teammates must transfer before leaving. The final departure archives the empty team. Active fixture/cup rosters cannot be changed through ordinary join, leave or removal operations.

## Matches

One captain challenges another team's public tag. Both teams must have the same capacity. The other captain accepts only after **both rosters are full**. Acceptance freezes their participants and creates a server-only cricket deck: Mini over has 3 questions; Full over has 6. No bots fill team seats.

Each frozen member gets one run and may contribute within **24 hours of fixture acceptance**. The first `play` call issues their first question. The server starts a 30-second deadline at question release, accepts one first answer, and measures arrival time itself. The member can read their receipt and tap Next immediately; there is no enforced result delay. The next question's clock begins when it is requested. Polling, reload and repeated `play` calls do not restart a clock. Expired questions lock a missed-answer receipt. The fixture's deadline takes precedence over any remaining personal questions.

The server returns a question without its correct index, explanation or source until that member has their own accepted or timeout receipt. Another player's answers and keys never appear in this protocol. The same deck is used by both teams. Teammates can communicate outside the product, and device identities are not verified people; this is casual competition rather than a claim of collusion resistance or calibrated latency fairness.

| Decision | Rule |
| --- | --- |
| Team score | Total correct answers across the frozen roster |
| First tiebreak | Lowest total elapsed time |
| Wrong or missing ball | 30,000 milliseconds in that total |
| Direct match exact tie | Draw |
| Cup exact tie | Lower original entry seed advances, disclosed before entry/start |
| Finish | All runs finish, or the 24-hour deadline is reconciled |

Runs and accepted answers use unique keys. A repeated answer for the same round returns the original lock; reuse of a request ID on a different round or fixture is rejected. Neither a retry nor a repeated settlement grants another contribution or team award.

Deadlines reconcile on team requests, including the other semifinal in a cup. A captain does not have to wait for an idle opponent to reopen the page. Pending friendly invitations expire after 48 hours. Time passing alone does not execute SQL: no new background scheduler is claimed or required for correctness on the next request.

## Four-team cup

A captain hosts an invitation-only cup; four different teams of the same capacity enter. Seeds follow entry order. The host starts only when all four rosters are complete and no team is already in an active fixture/cup. The semifinal pairs are **1 vs 4** and **2 vs 3**. Once both finish, the authority creates exactly one final with the original frozen winning rosters. Each fixture has its own 24-hour window; a cup can therefore span roughly 48 hours after its start.

An exact tie uses the lower original entry seed, including the final. The rule is deterministic and is not a random reward. Correct answers and measured time take priority. An all-idle cup can advance under that rule but grants no participation points.

Before starting, a captain can leave a cup; the host's same action cancels it and releases all entrants. Remaining seeds compact after a withdrawal. Open cups expire after 48 hours. Archiving an empty host team cancels its open cup; an empty entrant withdraws. Active rosters remain locked until their fixtures/cup settle.

## Benefits

Team points unlock cosmetic identity, without modifying personal XP, the coin wallet, question difficulty, answer time, odds or global rank. Each fully attempted run supplies **10 points at fixture settlement**. A team that has at least one such run receives a further 30 for a win or 15 for a direct draw. Teams with no fully attempted run get zero, including on idle expiry. A permanent `(team_id, fixture_id)` award key prevents repeat settlement from granting again.

| Team level | Total points | Available emblem |
| --- | ---: | --- |
| 1 | 0 | Bat, bolt |
| 2 | 100 | Star |
| 3 | 300 | Crown |
| 4 | 700 | Established club tier; existing emblems stay owned |

The four palettes (`teal`, `saffron`, `berry`, `blue`) are available immediately. Progress is cumulative and has no daily attendance condition or punitive expiration.

## HTTP and projection

`POST jhk-game` retains the existing headers, custom bearer, request-size limit and noncacheable response. The unified action is `{"action":"team","op":"dashboard"}`. The browser convenience method is `online.team(op, args)`.

All successful team operations return `{ok, serverNow, session, team, fixtures, tournaments, run, catalog}`. `team` is null before joining/after leaving. `run` is the requesting player's run for the selected fixture, or null. Public `session` identity now includes nullable `teamTag`, `teamName`, `teamSize`; it never contains a team invite code.

| Operation | Arguments |
| --- | --- |
| `dashboard` | none |
| `create` | `name, capacity:5|11, emblem, palette` |
| `join` | private `code` |
| `settings` | optional `name, emblem, palette, joinOpen` |
| `rotateInvite` / `leave` | none |
| `transfer` / `kick` | `memberId` |
| `challenge` | `targetTag, format:'mini'|'full'` |
| `accept` / `decline` / `fixture` / `play` / `next` | `fixtureId` |
| `answer` | `fixtureId, round, choice, requestId:UUID` |
| `tournamentCreate` | `name, format` |
| `tournamentJoin` | private cup `code` |
| `tournamentStart` / `tournamentLeave` | `tournamentId` |

Settings and captain actions verify the authenticated caller's membership and captain role on the server. Client identity, tag, points, level, winner, clocks and stake assertions cannot change authority. The existing explicit age/terms gate remains required for creating the server player.

## Data, deletion and upgrade

Nine new tables remain in unexposed `jhk_private`: `teams`, `team_members`, `team_tournaments`, `team_tournament_entries`, `team_fixtures`, `team_lineups`, `team_runs`, `team_answers`, `team_awards`. RLS is enabled, browser-role privileges are revoked, and only the service role can execute the command. The current two-seat command body is retained once as the service-only `jhk_command_before_teams`; the public command dispatches team actions and otherwise delegates to it. Team actions reuse its bearer, expiry, complete-profile and rate checks.

Authenticated export includes the current team and the player's own team answer contributions. Account deletion removes live membership, transfers captaincy to the oldest remaining member (or archives an empty team), and replaces frozen nickname snapshots with `Deleted player`. Historical participant IDs and game results remain for fixture integrity; deleted bearer/recovery access is revoked by the existing deletion path. Deleted or missing members score no unplayed questions. This exceptional deletion can reduce an active roster; ordinary membership changes remain blocked.

Install the canonical JHK schema and bank first, then apply `migrations/20261030003000_jhk_teams.sql`. The team migration is idempotent and does not reseed or rewrite existing rooms, wallets, answers or XP. Reapplying an older canonical command after this addon would replace its dispatcher; always apply this migration last when rehearsing a complete install. Deploy the adjacent Edge `core.mjs` with `index.ts` so the HTTP allowlist accepts `team`. Keep the existing custom bearer authentication and function configuration. No service key belongs in the browser.

## Executed verification

`tests/jhk-teams.test.mjs` uses actual PostgreSQL via PGlite, with the team migration applied twice. Fifteen integration tests cover browser-role denial/RLS, service authentication, old human-format compatibility, both capacities, captain controls, immutable tags and separate invites, frozen full rosters, both over lengths, hidden keys, server timing, first-answer/request replay, missing-ball penalties, real score settlement, idempotent cosmetic awards, cup bracket/tie progression, open-cup withdrawal/cancellation and deadline recovery, deletion and captain transfer. The fully played cup case submits all 90 answers across both semifinals and the final, proves that seed four can win on correctness, and verifies that repeated final reads cannot mint more team points or create another final.

`tests/jhk-team-input.test.mjs` covers protocol input bounds and forged authority fields. A focused run of these with the existing server tests passed **21 tests, zero failures/skips**; the additional fully played cup test passed separately. This is local, single-connection SQL/transport evidence. It does not establish physical-phone usability, WAN timing, simultaneous production load, real-player retention, or a live deployment; those need the corresponding release checks.
