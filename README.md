# Jaanta Hai Kya — the cricket club

A new Gully Club design: original cricket poster artwork, paper-and-ink day mode, navy night mode, and one-tap five-question practice. Opening practice uses simple cricket questions with 30 seconds to read and answer. Human duels, source-backed sports/science learning and existing records remain available.

**Play:** https://occult-kranti.github.io/fact-duel/

**Political-satire sister game:** https://occult-kranti.github.io/andhbhakt-ya-deshbhakt/

GitHub Pages serves the frontend; Supabase referees live human matches. `jhk-game` and `jhk_private` are separate from the sister game: identities, balances, questions and honours never cross between them. No ChatGPT-hosted site is used.

## Human beta and practice

Play practice immediately without signup. The human desk asks once for the existing 18+/beta-terms confirmation, creates an email-free device profile, and looks for a human. If none is found within five seconds, a clearly labelled zero-stake practice bot starts on this device. Cancellation and late server responses cannot revive an abandoned search. Friend invitations remain human-only. Email and profile setup are optional, accessible from Player → Optional player card / restore. Each live match has five rounds with a 30-second answer deadline, four choices and one locked answer. Most correct answers wins, then server-measured answer time; a 120 ms dead heat draws. Network delivery remains part of the timing.

Free game-coin stakes are optional and default to zero. A zero balance never blocks a zero-stake duel. Both players confirm the disclosed stake. The server reserves it once, pays the pot once, refunds draws and system/prestart cancellations, and applies the disclosed forfeit rule after both players ready. Earned completion rewards are separate and capped. There is no payment, cash-out, or actual money.

Expeditions, the Fact Vault, quests, stamps, medals and personal practice XP remain available. These device-local learning records are distinct from server-owned online XP, coin balances and standings. The live deployment offers human-first duels and local bot practice. Bot scores never enter the human server leaderboard or wallet. Untimed expeditions and recall remain available for solo learning. The current sports/science bank is source-backed editorial material, not a secret anti-cheat asset.

## Development

```sh
pnpm install --frozen-lockfile
VITE_JHK_SERVER_URL=https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game pnpm exec vite --config vite.config.static.ts --host 127.0.0.1
```

```sh
pnpm exec tsc --noEmit
PGLITE_MODULE_PATH="$PWD/node_modules/@electric-sql/pglite/dist/index.js" node --test tests/*.test.mjs
VITE_JHK_SERVER_URL=https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game STATIC_BASE=/fact-duel/ APP_URL= pnpm build:static
node scripts/jhk-assemble-pages.mjs
```

`.github/workflows/pages.yml` validates and publishes from `main` using GitHub Pages artifacts. The site’s `release.json` identifies the source commit. The former `/hisaab/` entry redirects to the standalone sister game. The original investor deck remains at `/deck/` and is historical planning material.

For a future custom domain, set `STATIC_BASE=/`, update the canonical/share URL and GitHub Pages DNS settings. The Supabase endpoint remains the same. No domain purchase is required for beta testing.

## Server and operations

See [Supabase API, rules and deployment](supabase/jhk/README.md) and [beta operations](docs/beta-release/OPERATIONS.md). A private once-per-minute scheduler settles abandoned rooms. Human profiles use self-attested 18+ access and optional private, unverified email. No password or email verification is required; email alone never opens an existing profile. Browser bearer sessions last 30 days. A separate recovery code restores access and can be rotated; save it before clearing storage. Player → Human Duel Progress offers profile editing, private export and deactivation. Verified identity, anti-collusion, wider load validation and approved advertising remain future launch work.

Unsolicited reward toasts and ceremonies are suppressed. Results prioritize score and replay; stats and source receipts expand on request. Operational messages remain visible, one toast at a time. Both games schedule ad opportunities after two wins or three losses, resetting both counters at either threshold. Ads stay disabled until the operator configures approved delivery and consent. No fill never blocks a duel.

See the [profile release panel](docs/profile-release/PANEL.md), [verification record](docs/profile-release/VERIFICATION.md), and [owner launch checklist](docs/profile-release/LAUNCH-CHECKLIST.md).

Historical Cloudflare/D1 and local-only behavior is documented in [the archived README](docs/legacy-cloudflare-preview.md). It is not the deployment path for this release.

## Gully Club redesign

Home opens directly into a labelled, zero-stake practice game in one tap. Human duel is a separate action and preserves the existing explicit age/terms confirmation. The human server retains its own rules. Bot custom practice adds 20/30-second reading timers alongside the original speed timers. Bot answers remain preplanned independently of player input; their scheduled wait is capped at 9.5 seconds.

Home / Explore / Play / Progress / Answers organize the existing routes. Custom settings and optional progress categories use native disclosures, preserving selections and mounted content. Day/night share the same control order. Active questions use fixed-order stacked answer buttons, visible lock/correctness feedback and discrete screen-reader clock notices. Original home art is a 216kB WebP; decorative art never blocks gameplay.

- [Product context](PRODUCT.md) and [design system](DESIGN.md)
- [Two panel rounds](docs/gully-redesign/PANELS.md), [research rationale](docs/gully-redesign/RESEARCH.md) and [verification](docs/gully-redesign/VERIFICATION.md)
- [Advertising setup and placement guide](ad_placement.md): all new placements default off; no local-result H5 reload
- [Editable Excalidraw board](docs/gully-redesign/design-board/gully-club.excalidraw), [SVG export](docs/gully-redesign/design-board/gully-club.svg) and [tooling record](docs/gully-redesign/TOOLING.md)
- [Artwork prompts and provenance](docs/gully-redesign/ART.md)

Run `CHROMIUM_PATH=/path/to/chromium node scripts/gully-browser-check.mjs` for the bounded mobile/desktop and interaction suite. The script launches its own local Vite server. It uses mocked unavailable-human networking for cancellation/fallback checks; it does not generate real human matches or ad impressions.

Earlier [cricket redesign notes](docs/cricket-redesign/) remain historical. The user reported Figma unavailable and directed local implementation; this revision used the actual MIT Excalidraw editor for its editable specification.
