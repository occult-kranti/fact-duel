# Jaanta Hai Kya — human-duel beta

Sports and science questions, human rivals, source receipts and a personal learning record.

**Play:** https://occult-kranti.github.io/fact-duel/

**Political-satire sister game:** https://occult-kranti.github.io/andhbhakt-ya-deshbhakt/

GitHub Pages serves the frontend; Supabase referees live human matches. `jhk-game` and `jhk_private` are separate from the sister game: identities, balances, questions and honours never cross between them. No ChatGPT-hosted site is used.

## Human beta and practice

The primary duel desk finds a human or creates an invitation for a friend. Each live match has five rounds with a 30-second answer deadline, four choices and one locked answer. Most correct answers wins, then server-measured answer time; a 120 ms dead heat draws. Network delivery remains part of the timing.

Free game-coin stakes are optional and default to zero. A zero balance never blocks a zero-stake duel. Both players confirm the disclosed stake. The server reserves it once, pays the pot once, refunds draws and system/prestart cancellations, and applies the disclosed forfeit rule after both players ready. Earned completion rewards are separate and capped. There is no payment, cash-out, or actual money.

Expeditions, the Fact Vault, quests, stamps, medals and personal practice XP remain available. These device-local learning records are distinct from server-owned online XP, coin balances and standings. The live deployment routes competitive entry points to human duels. Untimed expeditions and recall remain available for solo learning; the legacy bot engine is retained only for the separate offline build. The current sports/science bank is source-backed editorial material, not a secret anti-cheat asset.

## Development

```sh
pnpm install --frozen-lockfile
VITE_JHK_SERVER_URL=https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game pnpm exec vite --config vite.config.static.ts --host 127.0.0.1
```

```sh
pnpm exec tsc --noEmit
node --test tests/*.test.mjs
VITE_JHK_SERVER_URL=https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game STATIC_BASE=/fact-duel/ APP_URL= pnpm build:static
node scripts/jhk-assemble-pages.mjs
```

`.github/workflows/pages.yml` validates and publishes from `main` using GitHub Pages artifacts. The site’s `release.json` identifies the source commit. The former `/hisaab/` entry redirects to the standalone sister game. The original investor deck remains at `/deck/` and is historical planning material.

For a future custom domain, set `STATIC_BASE=/`, update the canonical/share URL and GitHub Pages DNS settings. The Supabase endpoint remains the same. No domain purchase is required for beta testing.

## Server and operations

See [Supabase API, rules and deployment](supabase/jhk/README.md) and [beta operations](docs/beta-release/OPERATIONS.md). A private once-per-minute scheduler settles abandoned rooms. Browser credentials identify a guest for 30 days; clearing storage loses that identity. Verified account recovery, anti-collusion, wider load validation and approved advertising remain future launch work.

Historical Cloudflare/D1 and local-only behavior is documented in [the archived README](docs/legacy-cloudflare-preview.md). It is not the deployment path for this release.
