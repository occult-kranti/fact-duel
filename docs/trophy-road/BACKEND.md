# Trophy road backend

The release adds question memory and permanent cosmetic stadium access. Existing human rules, coins, leaderboards and temporary titles are preserved. No practice points are imported into the server record.

## Three engineering review rounds

| Round | Finding | Resolution/evidence |
| --- | --- | --- |
| 1 — model | Random decks forgot previous play and were selected before a rival was known. Flat completion rewards favour short modes. | Fact families, both-seat history and least-recent exposure; trophies are four per actual answered round plus two per correct answer. Gates: 0/60/180. |
| 2 — implementation | Selection, reloads, retries and private answers need separate controls. | Room locks finalize both-seat decks; a private indexed table records first delivery; IndexedDB and Web Locks protect local history and reservations. Focused tests pass. |
| 3 — adversarial integration | Polls must not refresh history; migrations must preserve active games; deleting a profile must survive migration replay. | PostgreSQL tests verify these boundaries, aliases, forged totals, exact gates, export isolation and permissions. Independent content/gameplay and real-browser review evidence is appended below. |

These are engineering panel reviews, not a recruited user focus group.

## Human trophies

The own-profile response includes `humanRoad: {trophies, stadiumId, level, answeredRounds, correctAnswers, eligibleMatches, source:'server-human-results'}`. Stadium IDs are `gully`, `riverside`, `crown`; levels are 1–3.

Trophies are `4 × answeredRounds + 2 × correctAnswers`, derived from permanent eligible results and actual accepted answers. Existing historical eligible results receive their corresponding progression automatically. Private, cancelled and low-participation matches earn no human trophies; eligibility requires at least three actual answers from each human. A five-correct, five-answer match earns 30; two unlock Riverside at 60, six unlock Crown at 180. Repeated settlement cannot duplicate this projection.

This is cosmetic participation progress, not a competitive rank or cash balance. Existing anti-farming leaderboard limits and coin settlement stay intact. The UI may compare the greater of practice and server totals for a local challenge; it never adds them together or sends a trophy total for server acceptance. Forged profile trophy fields have no effect.

## Human rotation and privacy

`jhk_private.question_seen(session_id,family_key,seen_at)` is RLS-enabled, indexed by its composite primary key and inaccessible to anon/authenticated. Existing bearer-authenticated Edge commands remain the only access route.

The initial deck validates availability. Once both humans are ready, the room lock protects final selection using both histories. Existing question/result/finished decks are not replaced. A family unseen by both humans precedes every seen family; otherwise older latest exposure wins. Ties and answer positions are shuffled. Filters remain intact; correctness never influences selection. Only one card per equivalent-fact family is dealt.

The six IDs in the three reviewed alias pairs share family keys. Explicit metadata has priority; ID aliases also cover old immutable room snapshots. Every first delivered live question or opened result card inserts a unique room/round/player release and advances history. Polling or retrying an existing release cannot move its timestamp. Backfill uses actual releases only, never future deck cards, and excludes deleted profiles. Export returns only the caller’s history. Opponent history and future decks are never projected, and live choices still omit correctIndex, explanation and sourceUrl.

Least-recent repetition becomes necessary when a filtered pool is exhausted. Rotation is not a promise of infinite unique content.

## Local memory

`lib/local-question-history.mjs` uses edition-namespaced `STORAGE.questionHistoryDb`, version 1, store `epochs`. Every reset epoch owns separate memory; each room keeps its starting epoch. Old responses cannot contaminate a new profile.

The static adapter records actual exposure before resolving a revealed question to the screen. It reads the private in-memory room internally for its fact ID without adding that fact ID or answer key to a live projection. Leaving a game halfway through still remembers its revealed cards.

Web Locks serialize history read, creation and temporary deck reservation across tabs. Reservations prevent concurrent decks overlapping when enough eligible families exist. They expire at room expiry or after 20 minutes, whichever is sooner; finishing releases unused cards immediately. Reservations are distinct from actual permanent exposure. Bounds: 16 live reservations, 256 recent exposure retry markers, 10,000 fact families per epoch. IndexedDB read/write transactions prevent lost exposure updates.

Without Web Locks, creation is serialized within a tab; separate tabs can overlap. With denied/blocked/unavailable IndexedDB, memory-only rotation keeps play available until the tab closes. Clearing browser data clears local memory. These limitations do not affect server human history.

## Deployment

Apply in order:

1. `supabase/jhk/migrations/20261029222841_jhk_trophy_road_rotation.sql`
2. `supabase/jhk/migrations/20261029223049_jhk_cricket_expansion.sql`

Both filenames were created by `supabase migration new` and placed beside this app’s existing migrations. Rotation is additive: history table, helper/command replacement, release backfill. The content delta upserts exactly cr624–cr671 (48 cards) and annotates six aliases; it touches no unrelated questions, rooms, answers, users or wallets. Complete rebuild seed: 921 reviewed cards. The historical Spicy migration remains byte-unchanged.

No new Edge action or secret is needed. Older clients tolerate the additive profile field. An interface rollback can leave these additive records intact. Do not reapply an older command-function migration after this one; that would remove the new hook/projection.

## Verification

- `node tests/jhk-postgres-runner.mjs`: 51 security, 33 economy and 3 upgrade/service-role checks pass.
- `node --test tests/trophy-road-backend.test.mjs`: both-seat unseen/LRU rotation, family uniqueness, shuffled-key integrity, hidden answers, release dedup, future-card exclusion, active-deck preservation, migration replay/backfill, exact trophy gates/provenance, private/idle exclusion, export isolation, deletion, RLS/function privileges and twice-applied 48-card delta preserving unrelated rows.
- `node --test tests/local-question-history.test.mjs`: interruption, reload serialization, retry dedup, reservation expiry/completion, denied-storage fallback, concurrent creation and reset-epoch separation.
- Storage-isolation tests, seed `--check`, TypeScript check pass.

PGlite uses a single PostgreSQL connection. Concurrent promises check retry ordering, not multi-connection database contention or production capacity. Existing row/advisory locks and unique constraints protect human commands; production load capacity is not claimed.

Primary documentation checked: Supabase skill, current changelog and API security guidance. The feature uses ordinary PostgreSQL tables, ON CONFLICT, invoker functions and explicit privileges. No new extension is introduced. September’s ltree/legacy PGP/btree_gist/custom-operator changes and October’s deprecated HTTP TLS ciphers do not change this implementation.

- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated

### Round 3 returned evidence

Content reviewer confirmed exact parity of all six alias mappings, metadata precedence and both-seat maximum recency. Gameplay reviewer accepted the static adapter authority boundary, epoch capture and reservation/exposure separation. Their performance observation was addressed: repeated visible-question polls now skip already recorded IndexedDB writes inside the same tab; database deduplication remains the fallback for overlapping requests.

Chromium QA exercised two real concurrently started UI matches: two distinct five-card reservations, first two exposures persisted, full reload retained history, and a new fixture profile epoch isolated memory. See `verification/round-2-functional-corrected/results.json`. This is desktop Chromium emulating mobile dimensions, not a physical-phone claim.

The bounded deployed check is `scripts/trophy-road-live-check.mjs`, run only after applying migrations with `JHK_GAME_URL` set. It creates two synthetic profiles and two zero-stake private rooms, reveals a card without submitting any answers, checks next-game rotation, private answer projection, stable exposure timestamps, unchanged banter and zero trophies/rewards, then deletes both profiles in `finally`. Output `verification/live-rotation.json` omits credentials, IDs and invitation codes. Live execution status is established by that report, not by this document.

### Deployed verification — 2026-10-29

Both migrations are live, recorded remotely as `20261029223909 jhk_trophy_road_rotation` and `20261029223935 jhk_cricket_expansion`. The bounded live script passed 20 checks and deleted both synthetic profiles successfully. It submitted no answers, awarded no trophies/rewards, and modified no real player. Evidence: `verification/live-rotation.json`.

Read-only production metadata confirms 48 expansion cards, 921 total cards, history RLS enabled, browser roles denied table reads, anonymous helper execution denied, and the own-profile trophy projection installed. Evidence: `verification/database-postdeploy.json`.

Security advisors report the expected informational “RLS enabled, no policy” notice for this private service-role-only table; no browser policy is intended. Unrelated project warnings concern `public.set_updated_at`, `public.rls_auto_enable` and Supabase Auth leaked-password settings. They were not altered by this feature; their official remediation links are recorded in the metadata evidence.
