# Mini over and Full over

Prepared 29 October 2026. JHK only; Hisaab retains its rules. Backend is deployed; the user explicitly approved the GitHub push and JHK publication on 29 October 2026.

| Format | Fixed rounds | Completion XP | Perfect-answer XP | Extra local Club points |
|---|---:|---:|---:|---:|
| Mini over | 3 | 60 | 30 | 15 |
| Full over | 6 | 150 | 60 | 45 |

Completion requires an answer on every round; a win is not required. Perfect means every answer correct, independent of speed or match winner. These are additional rewards; existing answer and outcome XP continue. Club points are cosmetic play credits. Human simulated-coin stakes and payouts are unchanged. No real-money return is offered.

Practice titles: Gully Starter (0 completed overs), Mohalla Captain (3), Maidan Star (10), Maidan Veteran (25), Cricket Ustaad (60). The count proves fully attempted new overs, not mastery or geographic ranking. No location permission or daily expiration. Human XP is separate and server-authoritative.

The main loop is home → one-tap Mini/Full practice → automatic next rounds → result with replay, done, rewards and voluntary share card. Human play and topics remain available in an optional disclosure. Full over and Mini over human matchmaking never mix lengths; friend invites retain host format. Existing five-round rooms and clients finish with legacy rules.

## Data and reward contract

New local rooms carry overRewardsVersion=1. Old history stays intact without retroactive bonuses. New completion receipt IDs are stored separately from the rolling journal, inside the existing atomic profile transaction. Repeat snapshots and concurrent tabs cannot grant again. Export/import preserves receipts; resetting creates a new profile epoch and blocks old in-flight events. At 20,000 receipts new over bonuses stop safely rather than dropping deduplication IDs. Other historical progression systems retain their existing storage contracts. Browser-local data is user-editable and is not competitive authority.

Share cards contain only nickname, earned display title, format, correct/played rounds, earned match XP and a public game URL. Bot practice is labelled. No email, room code, recovery code or bearer token. Sharing is opt-in, has PNG download/copy/manual-copy fallback, and cancellation leaves results intact. Native share completion means a handoff, not proof of a social post.

## Verification

- Full Node suite with PGlite enabled: 1,057 passed, zero failures/skips on the main integration pass. An additional explicit Chase/Superover/legacy share regression passed with the three share tests after that pass.
- PostgreSQL checks: 51 security, 33 economy, 36 over rules, 3 role/upgrade checks. Old-schema upgrade applied twice with an existing five-round room preserved.
- TypeScript passed. Production static build and Pages assembly passed. Existing large optional 3D bundle warning remains.
- Independent design/research, UX, engine, progression and server reviewers completed three rounds: proposal, implementation critique, corrective verification. Findings repaired included misleading share labels, hidden filter repair, browser-local title scope and stale-response XP regression.
- Local browser rendered entry and configuration, but its HTTP preview cannot start the secure-context crypto API. This is a preview verification limit; no production security setting was weakened to work around it.
- Supabase migration and Edge function version 5 deployed. Read-only production query verified legacy default5, reward RLS, denied anonymous reward-table access and denied direct anonymous command execution.

Live HTTPS gameplay verification follows the approved Pages publication. The previous approval block has been resolved by the user. Physical-phone usability, real-player satisfaction and measured retention are not established by these tests or panel agreement.

## Measurement follow-up

Run a consented first-time-player study on real small-screen phones: observe first question within two deliberate clicks, completion, confusion points and voluntary next action. Separately measure first-question activation, completion by format, voluntary replay, returning players, sharing intent versus handoff, and a brief optional satisfaction rating. Compare with a dated baseline; do not equate more XP or play time with satisfaction. No third-party tracking or additional notification permission was added in this change.

The project-wide Supabase advisor reported pre-existing notices outside this migration, including public.set_updated_at search_path, public.rls_auto_enable execute grants, and password leak protection. No new public access was added. Relevant reference: https://supabase.com/docs/guides/database/database-linter

## HTTPS verification timing repair

Live browser verification reproduced an honest bot-practice cancellation: a 2.033-second delay between the local engine issuing the question and the UI starting its clock exceeded the unchanged 500ms timing allowance. Question-history IndexedDB writes now run as deduplicated background bookkeeping. Static JHK bot timing and its displayed remaining time use the projected engine issue stamp, so rendering delay cannot create a contradictory elapsed-time claim. The timer budget includes that delay; no timing tolerance, human-server rule or Hisaab behavior is relaxed. Regression tests cover the observed delay, nonblocking/deduplicated writes, failure/retry and unchanged alternate-transport clocks.


## HTTPS verification receipt recovery

The deployed timing repair (43bb6c) completed both a three-round Mini and a six-round Full over in live HTTPS play. The 60/150 completion XP bonuses were verified, and Save card produced a 1080×1350 PNG. A separate persistence fault reproduced in a fresh sole tab: completion XP logs survived while the new receipt ledger disappeared after reload. Current source and extracted deployed sanitizers preserve the ledger in isolated checks; the exact writer cause is not established.

Profile loading now reconstructs missing receipt IDs only from sanitized, exact `over-completion-v1` bonus logs with known format, completion/perfect XP and Club amounts. It merges IDs once, respects the permanent receipt cap, changes no XP, and preserves reset isolation. Regression coverage includes sequential Mini/Full completion, a missing-field reload, repeat result delivery after journal trimming, invalid proofs and capacity. A lost receipt whose supporting log has already been trimmed cannot be recovered; intact permanent receipts remain independent of that log. Final live reload verification of this recovery is pending publication.
