# Team Pavilion release

Prepared 29 October 2026. JHK expands with mobile team play while solo Mini / Full practice stays immediately available.

## Delivered behavior

- Fixed squads of 5 or 11, one membership per player, an automatic public tag, distinct private invite, captain transfer and shared banner settings.
- Full-roster 5-v-5 or 11-v-11 fixtures. Every frozen member plays one server-timed Mini / Full over in a 24-hour window. Correct answers decide score; wrong or missing answers each add 30 seconds to the time tiebreak.
- Four-team cups with two semi-finals and one final. Entry order supplies disclosed seeds for an exact score-and-time tie. Recruiting cups support withdrawal, host cancellation and 48-hour expiry.
- Shared team points and permanent identity: Star crest at 100, Crown at 300, Legacy frame at 700. Points are cosmetic; quiz rules and personal economies stay independent.
- Play / Teams / Explore / My club / Answers navigation, warm paper and ink colour system, saffron play controls, teal team identity, updated screen headings/captions, compact mobile layout and desktop columns.
- An editable HTML/SVG design canvas, original vector crest, documented research and three review rounds. Figma created a blank project but its Starter tool quota blocked design editing; the canvas is the delivered design artifact.

## Executed checks

- Full project suite: **1,092 passed, zero failed, zero skipped** with PGlite enabled.
- TypeScript, production static build and Pages assembly passed. The optional existing 3D collection chunk still triggers the large-chunk warning. The new Teams route is loaded separately: about 14 kB gzipped JavaScript and 6.3 kB gzipped CSS in this build.
- Fifteen team PostgreSQL cases cover the migration applied twice, privileges/authentication, both capacities, captain controls, immutable tags/invites, full frozen rosters, both over lengths, hidden answer keys, first-answer/request locking, deadlines, scoring, cosmetic awards, deletion, cup recruitment recovery and advancement. A fully played cup submits 90 accepted answers and verifies one final, the winning team and unchanged rewards on retry.
- Five race regressions protect older polls, same-millisecond phase rollback, next rounds, identity changes and scorecard/run separation.
- Independent security review reports four selected PostgreSQL cases passed and no remaining publication blocker in that selected scope.
- Browser checks used actual app iframes at 390px and 320px, and desktop at 1348px. Create-team names and capacity previews update, consent stays unchecked with submit disabled, one page h1 is retained and selected layouts have no horizontal overflow. Day/night colour roles and Play/Teams navigation were inspected.

## Deployment

The additive Supabase migration `jhk_teams_5_11` is installed and Edge function `jhk-game` version 6 is active. The existing custom bearer authentication and runtime entrypoint are preserved. A live read verified all nine new tables use RLS with no direct anonymous/authenticated reads, and only the service role can execute the public command. An unauthenticated team HTTP request returned 401.

The frontend is published from the reviewed branch through the existing main / GitHub Pages pipeline. `release.json` identifies its commit. The published editable canvas is assembled at `design/teams/` under the same deployment base.

## Limits and next observed study

These checks do not establish physical-phone touch ergonomics, authenticated browser team play, real-team satisfaction, WAN fairness, multi-device race load or retention lift. The real-time authority is tested through actual PostgreSQL, including full competition execution, rather than a manufactured live-user population. Captains enter squads; separate individual event enrollment is deferred and that commitment is disclosed before joining.

Short team mutations use one transaction advisory lock, appropriate to the bounded beta but not evidence of high production throughput. Results and expiry reconcile on authenticated team requests; no continuous settlement scheduler is claimed. Same-deck casual play is not collusion-resistant or verified-person competition. A small consented study with first-time phone users should measure first action, invitation comprehension, completing a contribution, finding the next fixture, voluntary replay and satisfaction separately.
