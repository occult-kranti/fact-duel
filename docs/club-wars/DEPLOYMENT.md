# Club Wars release evidence

30 October2026. Source changes are committed in the existing fact-duel repository; GitHub Pages publishes the frontend and an isolated Supabase function serves club commands.

## Backend

- Applied additive migration `jhk_club_wars_22_preparation_reserves` after the existing teams migration. Source `20261030020000_jhk_club_wars.sql`, SHA256 `bc8f718894d4e1351b0b1e3726c63c5197683b3ca883f7a35aeca7ce2e6dd8c8`. No existing fixtures are rewritten into preparation.
- Deployed `jhk-game` version7. Existing custom256-bit bearer authentication and `verify_jwt:false` are retained. `index.ts` is unchanged; only validated team operations expand.
- Post-deployment read query: nine team tables have RLS; anon cannot call public.jhk_command; authenticated cannot call private.team_command; service_role retains command execution. No version0 fixture is in preparation.
- Live HTTP smoke: public presence200, team dashboard without session401 UNAUTHORIZED, forged lineup request without session401. No production player profiles were created for QA.

## Application checks

- Full Node test suite with actual PGlite command execution:1124 passed,0 failed,0 skipped.
- TypeScript passed. New UI/FX modules passed targeted lint; no added rule counts in edited existing screens against baseline. Historical lint findings remain outside this release.
- Production static build and Pages assembly passed. Existing large3D cosmetic chunks still produce a build-size advisory; Teams remains a separately loaded screen.
- Managed browser preview: actual roster/preparation components at390/320, substitution payload/reserve tabs, role-specific controls, calendar consent, result/static/Skip behavior and desktop canvas/deck. QA harness uses synthetic local data and is excluded from the published output.
-14-slide editable PPTX checked, reimported and visually inspected; responsive deck checked at390/1440.

## Links and operational limits

Game: https://occult-kranti.github.io/fact-duel/
Canvas: https://occult-kranti.github.io/fact-duel/design/club-wars/
Pitch: https://occult-kranti.github.io/fact-duel/deck/

Phase boundaries reconcile on authenticated requests. No unattended scheduler, push alert, physical-device study, measured retention uplift, load test or full live multi-account match is claimed. Current acceptance evidence is bounded to the checks above.

The project security advisor has pre-existing warnings outside the private club boundary: public.set_updated_at mutable search path, public.rls_auto_enable default execution, and Supabase Auth leaked-password protection off. RLS-without-policy INFO entries are intentional for service-only private tables. This release adds no public grants or policy bypass. Remediation references: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable ; https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable ; https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
