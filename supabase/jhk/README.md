# Jaanta Hai Kya server beta

GitHub Pages serves the JHK UI. The independent `jhk-game` Supabase Edge Function and `jhk_private` PostgreSQL schema own guest identity, human rooms, timing, answers, coins and standings. They do not share identities, balances, question banks or titles with AYD/HISAAB. This is an adaptation of the repository's verified private Postgres authority, not the legacy in-browser `MemoryRoomStore` or Cloudflare/D1 API.

## Rules and boundary

- Two human seats, five rounds, four choices, 30 seconds each; 2.5-second server countdown. No bot is inserted by matchmaking.
- Match winner: most correct answers, then lowest sum of server-measured answer times. Incorrect/missing answers count as 30 seconds. Differences at or below 120 ms are draws.
- The server records each player's first question release and first accepted answer. Polling/reconnection never resets the release timestamp. Client identity, correctness, score, XP, balance and timing assertions are ignored.
- Measurement includes response/answer network delivery. The dead-heat band reduces close-call noise; this is not latency-neutral or a calibrated reaction-time instrument.
- Topic choices: `all`, `sports`, `science`, `cricket`, `football`, `basketball`, `baseball`, `formula-1`, `space`, `physics`, `biology`, `computing`. The seed is generated only from existing source-backed JHK sports/science items. Filters are exact; unavailable pools return an error, never secretly widen.
- Guest identity is a 256-bit random bearer credential stored on that browser, expiring in 30 days. It is not verified account login. Only its SHA-256 hash reaches Postgres. Never merge a local wallet/XP assertion into server standings.

## Coins

All coins are free simulated units with no purchase, redemption, cash value or payment integration. A guest starts with 100. A stake is optional, defaults to zero, and may be a whole number from 0 through 10,000 subject to the spendable balance. Zero-balance guests can still duel for zero.

A stake applies once to the whole match. Both seats must confirm the same disclosed stake using `ready`; reservation happens before play. The winner gets the reserved two-seat pot. A draw, prestart cancellation, both players absent after grace, or absolute room expiry refunds the appropriate reserves. Explicit leaving/deleting a guest after both players ready—including the countdown—forfeits to the rival. One absent seat beyond 90 seconds forfeits if the other remains active. Forfeits create no ranked result or completion reward.

An eligible participant earns a separate 10-coin completion reward when both humans answered at least three questions and that participant answered at least one correctly. The reward is capped once per guest/topic/UTC day. It never multiplies the pot. Disposable identities/collusion remain abuse limits of this casual beta.

Row locks, sorted wallet locks and unique ledger/claim keys enforce atomic reservations and idempotent settlement. `economy.payout` reports a returned own stake or awarded pot; `economy.reward` reports separately minted completion coins. Balance plus one's reserved stake is `savings`, an internal API name meaning owned coins. No political currency or role appears in JHK.

## HTTP contract

POST `/functions/v1/jhk-game`, JSON `{action,...payload}`, `Content-Type: application/json`, optional publishable/anon project key headers, and `x-jhk-session: <guest token>` except when creating a session. Responses are noncacheable. Success: `{ok:true,serverNow,...}`; failure: `{ok:false,error:{code,message}}`. The Edge uses a server-only service key to invoke `public.jhk_command`; browser roles cannot invoke that RPC or access private tables.

| Action | Payload | Response data |
| --- | --- | --- |
| `session` | `{nickname}` | `{token,session}` |
| `profile` | `{nickname?}` | `{session}` |
| `deleteSession` | `{}` | `{deleted:true}` |
| `queue` | `{mode:'ranked'\|'tournament',file?,stake?}` | `{match}` with exact topic/stake queue |
| `create` | `{file?,stake?}` | `{match}` with private invitation code |
| `join` | `{code}` | `{match}`; reveals terms without charging |
| `ready` | `{roomId,stake}` | `{match}`; confirms and reserves |
| `snapshot` / `next` / `leave` | `{roomId}` | `{match}` |
| `answer` | `{roomId,round,choice,requestId}` | `{match}`; choice 0–3, requestId UUID |
| `leaderboards` | `{period:'daily'\|'weekly'\|'savings'}` | `{rows,self,startsAt,endsAt,...}` |
| `tournaments` | `{}` | `{tournaments,standings}` |

`session` contains `id,nickname,expiresAt,onlineXp,balance,savings,title?`. `match` contains `id,code,mode,file,stake,rewardMultiplier:1,phase,round,roundCount:5,startsAt,deadlineAt,nextAt,serverNow,selfId,players,question,receipt,result,winnerId,reason,economy`.

Phases are `waiting`, `countdown`, `question`, `result`, `finished`, `cancelled`. Question projection is `{id,prompt:{en},options:[{en}],category,domain,topic,subtopic,difficulty,...}`. Answer keys/explanation/source are hidden until the requesting player's receipt; opponent answers remain hidden until round settlement. `receipt` includes locked `choice,correct,correctIndex,elapsedMs,xp,explanation,sourceUrl`. Correct XP is 30 below 8 seconds, 20 below 15 seconds, else 10. Wrong answers receive zero. Match snapshots are authority; local display clocks are estimates only.

`economy` contains `status:'pending'|'reserved'|'settled'|'refunded',balance,savings,reserved,payout,reward`. Forfeits use phase `cancelled` plus `winnerId` and reason `player-left-forfeit`, `profile-deleted-forfeit` or `disconnect-forfeit`. Show the reason rather than presenting every cancellation as a refund.

Daily/weekly top-ten standings use neutral `ranked-contender` / “Top Ten”; the current owned-coins leader uses `coin-champion` / “Coin Champion”. Standings require three eligible matches and three distinct rivals, count one match/rival/UTC day, exclude private games, and expire with their UTC window. Coin ranking includes escrow and excludes starter-only guests. Refresh profile/leaderboards before displaying a grant; cached grants are not authoritative.

## Deployment order

1. Review/apply `schema.sql` as a transaction to the intended Supabase project. The canonical file is idempotent. Keep `jhk_private` outside exposed schemas.
2. Run `node supabase/jhk/seed-bank.mjs --check`, then apply `seed-bank.sql` using a privileged connection.
3. Run `tests/jhk-online-security.sql` and `tests/jhk-online-economy.sql`, one complete file per SQL transaction. Both roll back fixtures. The economy suite also checks sibling-schema identity isolation and assumes the HISAAB schema is installed on this shared project.
4. Deploy `functions/jhk-game/index.ts` and adjacent `core.mjs` as `jhk-game`, with `verify_jwt=false` from `config.toml`. The function performs its own guest authentication. Never place the service-role key in Pages or the browser.
5. Configure JHK's browser endpoint `https://<project-ref>.supabase.co/functions/v1/jhk-game` and the project's publishable key, with distinct localStorage keys for JHK. Build/publish the JHK Pages entry, preserving AYD at its standalone path.
6. Run the live two-session harness below and check Supabase advisors/logs before releasing the URL. This creates synthetic QA guests, finishes a real five-round match on the deployed authority, tests concurrent duplicate readiness/answers, reservation/retry/refund/forfeit/zero stake, and deletes the guest profiles afterward.

Every authenticated action reconciles up to 100 expired rooms. For unattended expiry, schedule privileged SQL once per minute:

```sql
select jhk_private.expire_rooms(clock_timestamp());
```

If Supabase Cron is enabled, use its dashboard or `cron.schedule` to run that command. Use a distinct `jhk-expire-rooms` job name; do not replace AYD's job. Without a scheduler or subsequent request, wall time alone does not run reconciliation. Private schema helpers remain inaccessible to public browser roles.

## Verification

```sh
npm install --prefix /tmp/jhk-pg --no-audit --no-fund --save-exact @electric-sql/pglite@0.3.14
PGLITE_MODULE_PATH=/tmp/jhk-pg/node_modules/@electric-sql/pglite/dist/index.js node tests/jhk-postgres-runner.mjs
node --test tests/jhk-server.test.mjs
JHK_GAME_URL=https://PROJECT.supabase.co/functions/v1/jhk-game SIBLING_GAME_URL=https://PROJECT.supabase.co/functions/v1/hisaab-game node supabase/jhk/live-check.mjs
```

The local runner executes actual PostgreSQL functions, constraints, permissions and rollback transactions through PGlite. Its single connection is not a concurrency/load test. The live harness exercises independent HTTP sessions and real server state; it does not establish internet-wide timing fairness, production capacity, verified personhood, ad-provider readiness or resistance to collusion.

References: [Supabase changelog](https://supabase.com/changelog.md), [database functions](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Edge authentication](https://supabase.com/docs/guides/functions/auth), [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html). Reviewed September 27, 2026; the September pgcrypto legacy-cipher change does not affect these SHA-256 guest hashes.
