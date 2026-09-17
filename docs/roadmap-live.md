# Roadmap: from demo to live — Jaanta Hai Kya

Written 17 September 2026 by the lead (Fable). Executed by Opus agents under the ownership table
below. Every item is a change a player can see or a founder can verify; nothing here is aspirational.

## 0. Where things stand, honestly

| surface | what it is | can two people play? |
| --- | --- | --- |
| https://occult-kranti.github.io/fact-duel/ (GitHub Pages) | the STATIC build: no server, device wallet, bots, expeditions, drills, the SEO quiz pages, the deck | **No.** Friend rooms and matchmaking need a server; this build says "offline demo" for them |
| the Worker build (`pnpm build` → Cloudflare Workers + D1) | the full game: accounts, profile sync, server wallet, ledger duels, matchmaking, `/ops` | **Yes**, once deployed. It is NOT deployed yet |

What exists in the Cloudflare account now: the D1 database `jhk-db` (id `2c74ea74-4d0f-492a-9b21-6e29393bfb4b`,
APAC) with all 19 tables and wrangler's migration ledger already applied. No Worker yet: publishing
one needs an API token, which only the founder can mint. The deploy workflow is in the repo.

External services needed, and their cost:

| need | service | cost |
| --- | --- | --- |
| host the live game | Cloudflare Workers + D1 (this account) | free tier is enough for a soft launch |
| a first-party domain (AdSense, cookies, brand) | Cloudflare Registrar for jaantahaikya.com | about $10 a year |
| sign-in links by email (optional, later) | Resend or any HTTP mail API | free tier (thousands a month) |
| ads | Google AdSense, then H5 Games Ads | free; approval not guaranteed |
| Supabase | connected, **not needed**: identity lives next to the ledger in D1 by design | nothing |

Until the domain is bought the Worker is reachable at `https://jaanta-hai-kya.<account-subdomain>.workers.dev`.

## 1. The work in this round

### W1 — Live presence over each game mode ("in queue · in game")
- Server: `POST /api/queue {action:'presence'}` → `{ asOf, modes: { quick:{inQueue,inGame}, trilogy:{…}, gauntlet:{…} } }`.
  `inQueue` = live `match_queue` rows (last_seen within 30 s) grouped by mode; `inGame` = `rooms` whose state
  `phase` is one of scheduled/playing/between and `config.mode` matches, using SQLite `json_extract` on the
  state column; expired rooms excluded. Cached 5 s in module memory. No auth needed (counts only, never ids).
- Client: `lib/presence-client.ts` polls every 10 s while the Play tab is visible (Page Visibility API), backs
  off to 30 s after two failures, never polls in the static build (no server → no line at all; never a fake
  number). `ModeCards` renders one muted line under each card: `In queue 3 · In game 12` — zero reads as
  `Nobody in queue · In game 0`; while loading, nothing (no skeleton numbers). `aria-live="polite"` on the
  container so screen readers hear changes at most once per poll.
- UX rules: text only, one line, `--fs-12`, muted colour, a 6 px live dot that is volt only when the last
  poll succeeded within 15 s; no animation on number changes (honesty over excitement).
- Tests: presence SQL over LocalD1 with seeded queue rows and rooms in each phase; the 5 s cache; the client
  poll cadence, visibility pause and back-off; the static twin returns null.

### W2 — Overlay budget: never more than two pop-ups, and never at once
- One scheduler in `components/fx/overlay-budget.ts`: every toast, ceremony and modal-like reward reveal
  asks the budget for a slot. Rules: at most 2 overlays visible; a ceremony counts as 2 (nothing else while
  it is open); the next item waits `1200 ms` after the previous one settles; toasts of the same kind within
  a burst merge into one ("+3 quests · 140 XP"); nothing opens while a question is live (existing `quiet`).
- `ToastStack` max visible becomes 2 and reads from the budget; `use-progression-feedback` hands its queues
  to the budget instead of splicing them all at once. The wallet's `notice`, the account panel's status
  line and the sign-in toast go through the same budget.
- Tests: a synthetic burst of 7 rewards produces at most 2 visible at any instant, in a deterministic order,
  with ≥ 1200 ms spacing (fake timers); a ceremony blocks toasts; identical kinds merge.

### W3 — The profile gate: name and email on first landing (no verification)
- On first landing (no `fd-profile-claimed` flag) a full-screen, single-step sheet asks for a display name
  and an email. Copy: "Jaanta Hai Kya keeps your coins and card under this profile. No password, no link
  to click." Both fields required; email checked for shape only. A "Play as guest" text link stays
  available (never a dark pattern; the gate can be skipped, and it asks again after 3 sessions, not on
  every visit).
- Worker build: `POST /api/auth {action:'quick-profile', name, email}` → validates, `touchPrincipal`,
  inserts identity `id = 'claimed-email:' + principalId` (provider `claimed-email`, subject = email; several
  principals may claim the same address because nothing is verified — documented), stores the name in
  `profile_blobs`? NO: the name lives in the profile's settings (localStorage) and, once a session exists, in
  the synced profile; the server keeps only the identity row. Then issues a SESSION for that principal
  (`issueSession`) so profile sync turns on. Never merges principals on a claimed email.
- Static build: the same sheet, stored locally only, with the honest line "This build keeps it on this
  device." Settings shows the claimed email with "Verify by link" (magic link, existing) as the upgrade.
- Tests: quick-profile creates identity + session, rejects junk, is idempotent per principal, never links
  two principals; the sheet's skip/ask-again rule (pure function over a visit counter).

### W4 — Retire the offline demo
- The static build gains an optional `APP_URL` (build env). When set: the app root renders a small
  interstitial "Jaanta Hai Kya now runs at <host>. Taking you there…" with a 3 s auto-redirect and a
  button; the SEO pages' "Play this as a duel" links point at `APP_URL`; the deck and quiz pages stay on
  Pages. When unset: today's behaviour, but every "offline demo" string is rewritten to say what it is:
  "This preview has no server: friend duels and finding a rival open on the live site." The Worker build
  never shows any of these strings (test: the Worker bundle contains no "offline").
- `pages.yml` reads `APP_URL` from a repo variable (`vars.APP_URL`) — the founder sets it once the Worker
  is live.

### W5 — Mobile QA and the skill upgrade
- Playwright pass at 360×740, 390×844 and 414×896 (plus 320 for the top bar) on: home, play (all three
  modes, rival search state), lobby, question stage, finish + ad card, coins card, rules, trust, player,
  events, settings sheet, the new profile gate, in English and Hindi, dark and light. Checks: horizontal
  overflow 0, every tap target ≥ 44×44 CSS px, body text ≥ 14 px, inputs ≥ 16 px (iOS zoom), `100dvh`
  not `100vh` for full-height panels, safe-area insets on fixed bars, no text under the notch, the
  Devanagari line height, sticky launch bar above the keyboard when an input is focused.
- Fix what fails; record each fix. Add the checklist to `.claude/skills/floodlight-design/SKILL.md` as
  "Mobile gate" with the exact script to run (`scripts/mobile-gate.mjs`, new, based on scripts/screens.mjs).
- Sources to consult: MDN on `dvh` and `env(safe-area-inset-*)`; WCAG 2.5.8 target size (24 px minimum,
  44 px recommended); Apple HIG layout; web.dev mobile form best practices; the Playwright device
  descriptors.

### W6 — Deploy: one dispatch away
- `deploy.config.json` at the repo root carries the database id and name and the worker name; the
  workflow and `scripts/deploy-prepare.mjs` read it when the repo variables are absent. The founder adds two
  secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and runs "Deploy Worker". Migrations are
  already applied (the workflow's `migrations apply` is a no-op thanks to the `d1_migrations` rows).
- `docs/deploy-cloudflare.md` gets a "Ten-minute path" at the top: token template, where the account id is,
  the workers.dev URL, then `APP_URL`.

### W7 — Verify before merge
- Full suite, typecheck, static build, Worker build (`pnpm build` + `wrangler deploy --dry-run`), the mobile
  gate, and an adversarial review of W1–W4 diffs (three lenses: correctness, honesty rules, mobile).

## 2. Ownership (no two agents touch one file)

| lane | owns |
| --- | --- |
| W1 presence | lib/server/matchmaking.mjs (presence fn only, additive), lib/server/http-queue.mjs, NEW lib/presence-client.ts (+ static twin, vite alias), app/screens/play/mode-cards.tsx, app/screens/play/play.css (presence rules only), NEW tests/presence.test.mjs, lib/i18n/en.mjs + hi.mjs (presence keys only, additive) |
| W2 overlay budget | NEW components/fx/overlay-budget.ts, components/fx/toast-stack.tsx, components/fx/fx-provider.tsx, app/screens/use-progression-feedback.tsx, NEW tests/overlay-budget.test.mjs |
| W3 profile gate | lib/server/auth-service.mjs (quick-profile fn, additive), lib/server/http-auth.mjs (one action), lib/auth-client.ts (one call), NEW app/shell/profile-gate.tsx (+ profile-gate.css), app/arena.tsx (mount only), app/shell/settings-sheet.tsx (claimed email line), NEW lib/profile-gate.mjs (pure ask-again rule), tests/auth-service.test.mjs (extend), NEW tests/profile-gate.test.mjs, lib/i18n/en.mjs + hi.mjs (gate keys only, additive — coordinate: W1 appends presence.* keys, W3 appends gate.* keys; append at the END of each file) |
| W4 offline retirement | lib/duel-client-static.ts (copy), static/index.html, static/main.tsx, vite.config.static.ts (APP_URL define), NEW app/redirect-notice.tsx, scripts/seo-pages.mjs + lib/seo/intents.mjs (CTA URL), .github/workflows/pages.yml (APP_URL var), NEW tests/offline-copy.test.mjs |
| W5 mobile | NEW scripts/mobile-gate.mjs, .claude/skills/floodlight-design/SKILL.md, and CSS-only fixes in any *.css file plus minimal markup fixes in files NOT owned above; write requests for owned files |
| W6 deploy | deploy.config.json, scripts/deploy-prepare.mjs, .github/workflows/deploy-worker.yml, docs/deploy-cloudflare.md, tests/deploy-prepare.test.mjs |

## 3. Out of scope this round (named so nobody assumes)
Verified email sign-in stays as the magic link (built, needs a mail API key). Cross-device merge of a
claimed email is not done without verification. Translating question text. The domain purchase.
