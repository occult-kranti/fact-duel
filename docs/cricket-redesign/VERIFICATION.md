# Cricket redesign verification

Checked October 29, 2026 against the shared implementation during panel round 2.

| Check | Evidence | Result |
| --- | --- | --- |
| Complete Node test suite | `PGLITE_MODULE_PATH="$PWD/node_modules/@electric-sql/pglite/dist/index.js" node --test --test-concurrency=4 tests/*.test.mjs` | 974 passed; 0 failed; 0 skipped; 25.9 seconds |
| Real PostgreSQL security suite | `node tests/jhk-postgres-runner.mjs` with the same `PGLITE_MODULE_PATH` | 51 checks passed |
| Real PostgreSQL economy suite | Same runner; sibling schema installed separately | 33 checks passed |
| Schema upgrade and service role | Same runner; canonical JHK schema applied twice | 3 checks passed |
| Minimal optional-email migration | Applied the new migration to the previous committed schema containing an existing profile | 7 checks passed; existing player ID, wallet, contact and RPC permissions retained |
| Email-free guest contract | Client, Edge and real SQL coverage included in complete Node suite | Creates no fabricated address; consent retained; guest can queue cricket, add/remove contact, and recover the same player ID |
| Five-second fallback | Six deterministic matchmaking tests included in complete suite | Deadline, human-first result, late room cleanup, cancellation, network failure, slow identity creation pass |
| Notification/ad policy | Targeted policy tests included in complete suite | Progression overlays suppressed; repeat-play action remains available during optional ad opportunity |

Full logs: [Node tests](verification/node-tests.log), [PostgreSQL checks](verification/postgres-tests.log).

## Panel rounds

Round 1 inspected the existing authority boundary and found mandatory email enforced independently in Edge validation, Postgres profile completeness, and the new-session command. The email column was already nullable. Implementation now permits omitted/blank/null email, validates any supplied address, retains explicit human-match age/terms confirmation, and preserves the browser bearer/recovery mechanism. `ensureGuest` shares concurrent entry requests and resumes or upgrades the same identity.

Round 2 reviewed integration with the human-search timer and local practice route, then executed the complete Node and PostgreSQL suites. The standalone SQL runner initially revealed stale happy-path fixtures from before the existing age/terms/recovery requirement. Those fixtures now explicitly supply consent and recovery credentials while omitting email for JHK. The sibling fixture still supplies its required email and additionally asserts a real sibling session was created. No authority, isolation, idempotency, anti-forgery, reservation, reward-cap, or refund assertion was removed.

## Deployment scope and limits

The minimal `supabase/jhk/migrations/20261029_optional_email_guests.sql` replaces two function definitions without resetting tables or records. Deploy the matching Edge `index.ts` and `core.mjs` after the migration. Until that deployment succeeds, an older backend may reject email-free human entry; the client must still deliver the labelled bot fallback after five seconds.

These local checks use a single-connection PostgreSQL WASM runtime. They verify SQL execution and application behavior, not production traffic capacity, cross-region timing fairness, or live deployment status. Browser layout, keyboard interaction, mobile screenshots, and production smoke checks are recorded by the main implementation review separately. Bots remain on-device practice and cannot enter human server standings or change a server wallet.


## Final browser and production checks

- Both worlds checked at 320, 390 and 1440 CSS pixels: no horizontal overflow, no automatic signup modal, persisted appearance selection and correct friend intent. The first desktop pass revealed artwork overflow and oversized Pavilion type; one CSS correction batch fixed both.
- The browser test forced the authority connection to fail: fallback began after five seconds and delivered a playable four-choice question. A cancelled search did not start a bot later.
- A guest completed and replayed a local match without email. Stats and sources were collapsed, the coin-ad promotion was absent, and the full mode launcher also started local practice. No runtime errors were observed.
- UI feedback was reduced further after review: no progression-feedback presenter is mounted in the main flow; question feedback no longer floats XP, promotes speed bonuses or triggers combo celebrations. Timing, scoring and saved progression remain in the underlying engine.
- Final TypeScript and static production build passed. An existing optional 3D collection chunk still exceeds the build warning threshold; it is not a failure. This is not a measured performance/load claim.
- Supabase migration `jhk_optional_email_guests` applied successfully. Edge function `jhk-game` version 3 is active. A real HTTPS smoke test created two no-email profiles, joined a private cricket room, started a zero-stake human match, left safely and deactivated both QA profiles. RPC execute permissions remain service-role only.
- Figma draft: https://www.figma.com/design/6IRTmI9Fc3xv6J62EoCnPy . Ten editable screen compositions were created, but their auto-layout heights need correction. The Starter-plan MCP call limit blocked that correction and canvas screenshots. This draft is incomplete; it is not the verified website implementation.

Browser entry point: `CHROMIUM_PATH=/path/to/chromium node scripts/cricket-browser-check.mjs`. Layout evidence is in the desktop/mobile PNGs; behavior evidence is in `browser-checks.json` and `browser-results-checks.json`. The script can skip previously verified layout/search batches using `CRICKET_SKIP_LAYOUT=1` and `CRICKET_SKIP_SEARCH=1` when only a changed result flow needs checking.

Final phone play-area correction: compacted the timed HUD and question type so a sampled long cricket question keeps all four 48px answer targets in the 390×844 viewport (last answer bottom 816.9px). The question and result screens were visually inspected after behavior tests. No source facts or answer content were shortened.
