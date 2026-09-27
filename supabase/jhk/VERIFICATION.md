# JHK beta verification — September 27, 2026

Executed against the shared Supabase project after root applied the isolated JHK schema/seed and deployed `jhk-game` v1. This note covers server evidence; GitHub Pages/browser verification is tracked by the release owner.

| Check | Result |
| --- | --- |
| Isolated PostgreSQL WASM SQL suites | 51 security + 32 economy/isolation + 3 upgrade/role checks passed |
| JHK transport/schema unit tests | 3 passed |
| Actual deployed PostgreSQL rollback suites | 51 security + 32 economy/isolation checks passed; fixtures rolled back |
| Deployed HTTP test with independent guest credentials | 17 checks passed; process exit 0; QA guests deleted |
| Expiry scheduler | `jhk-expire-rooms`, active every minute; actual run succeeded at 2026-09-27 03:23:00 UTC, returning one SQL result row |
| Seed consistency | Regenerated seed equals existing repository sports/science source items |

The HTTP harness finished a five-round science match. It exercised concurrent duplicate readiness, concurrent duplicate answer requests from one seat alongside the rival answer, locked receipts, authoritative cumulative XP, one 40-coin pot plus a separately earned 10-coin reward, terminal replay, a zero-stake human room, prestart refund, poststart forfeiture, and rejection of sibling-game guest tokens in both directions. It ran without an API key using the deployed custom guest-token authentication boundary.

The initial harness attempt stopped at a test assertion because a late retry after the 10-second result break returned an automatically advanced current-round snapshot with no current receipt. The harness now accepts that documented behavior and checks final XP/balance for duplicate credit. The second complete run passed. No server behavior was changed to satisfy that assertion.

Supabase security advisors reported intentional INFO notices for private RLS tables without client policies. Existing project warnings concern `public.set_updated_at` search path, public execution of `public.rls_auto_enable()` as SECURITY DEFINER, and disabled leaked-password protection. They are outside the new JHK namespace and were reported to the release owner without silently changing unrelated project behavior.

This is finite integration evidence, not a load test, an internet-wide latency/fairness guarantee, proof of verified human identity, or an ad-provider readiness claim. Guest accounts and public learning banks retain the documented casual-beta anti-abuse limits.

Reproduce local verification with `tests/jhk-postgres-runner.mjs` and `tests/jhk-server.test.mjs`. Reproduce authorized deployed verification with `supabase/jhk/live-check.mjs`; it creates disposable synthetic QA guests and cleans them up in `finally`. Do not present synthetic test clients as real player adoption.
