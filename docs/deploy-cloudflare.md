# Deploying the server build to Cloudflare

The founder's checklist for putting the real game — the Worker with accounts, the server wallet,
the ledger, matchmaking and the ops door — on Cloudflare, on a domain the founder owns. Terse on
purpose. Do the steps in order; each one is safe to repeat.

Why this and not GitHub Pages: AdSense reviews a first-party domain that serves the real product,
and the money layer needs a server. Pages (`.github/workflows/pages.yml`) has neither. See
[What runs where](#what-runs-where) at the end for the split, and the tradeoff after it.

In a hurry: the [Ten-minute path](#ten-minute-path) is the whole live launch. The long
[One-time setup](#one-time-setup) below it explains each piece and covers a fresh account.

---

## Ten-minute path

Everything that can be committed already is. `deploy.config.json` at the repo root carries the
Worker name and the live database:

```json
{ "workerName": "jaanta-hai-kya", "d1": { "name": "jhk-db", "id": "2c74ea74-4d0f-492a-9b21-6e29393bfb4b" } }
```

`jhk-db` exists in the Cloudflare account (APAC) with migrations 0000–0006 applied and recorded in
its `d1_migrations` table, so the deploy's migration step applies nothing. Repository variables are
no longer needed: what is left is two secrets, because only the account owner can mint them.

### 1. Create the API token — about four minutes

Dashboard > My Profile > API Tokens > **Create Token** > **Edit Cloudflare Workers** > Use template.

Before saving, check the permission rows. The deploy needs exactly these three:

| scope | permission | level | what it is for |
| --- | --- | --- | --- |
| Account | Workers Scripts | **Edit** | upload the Worker and its assets, `wrangler secret put` |
| Account | D1 | **Edit** | bind the database and apply migrations |
| Account | Account Settings | **Read** | wrangler resolves the account |

`D1 · Edit` is the row to check for: add it if the template did not. Everything else the template
adds (Workers KV Storage, Workers R2 Storage, Workers Tail, User Details, Memberships) is harmless;
leave it. Under **Account Resources** pick the account that owns `jhk-db`.

Leave **Zone Resources** alone for now. The two zone rows — `Zone · Workers Routes · Edit` and
`Zone · Zone · Read` — are needed only for the custom domain in step 7, and the token can be edited
later to add them.

Continue to summary > Create Token > copy the value. It is shown once.

### 2. Find the account id — thirty seconds

Two places, same 32 hex characters:

- the dashboard URL while any account page is open: `https://dash.cloudflare.com/<account-id>/…`
- Workers & Pages > Overview, right-hand column, **Account ID**, with a copy button

### 3. Add the two repository secrets — one minute

GitHub repo > Settings > Secrets and variables > Actions > **New repository secret**, twice:

| name | value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | the id from step 2 |

That is the whole configuration. Until both are set the deploy workflow exits green with a message
marking which of the two is missing; it never fails red for being unconfigured.

### 4. Run the deploy — about six minutes, unattended

Actions > **Deploy the Worker to Cloudflare** > Run workflow > branch `main` > Run workflow.

The log to read, in order: "Check the deployment is configured" says where the database id came
from; "Prepare the deploy manifest" prints the Worker name, the database and the assets it will
skip; "Apply D1 migrations" reports nothing to apply; "Deploy the Worker" prints the URL.

### 5. The URL

```
https://jaanta-hai-kya.<your-subdomain>.workers.dev
```

`<your-subdomain>` is the account's workers.dev subdomain — Workers & Pages > Overview shows it,
and the deploy step prints the full URL. Open it and play one duel end to end.

### 6. Point the Pages build at it

GitHub repo > Settings > Secrets and variables > Actions > **Variables** > New repository variable:

| name | value |
| --- | --- |
| `APP_URL` | the URL from step 5 |

Then re-run the Pages workflow. The static build stops calling itself a demo and hands players over
to the live game; the quiz pages' "Play this as a duel" links point at the Worker.

### 7. Later: the domain

Buy `jaantahaikya.com` at Cloudflare Registrar (about $10 a year) — bought there, the zone is active
immediately and the nameserver step disappears. Then set the repository variable `CF_CUSTOM_DOMAIN`
to the hostname and re-run the deploy; wrangler creates the DNS record and the certificate. The
detail, including the nameserver route for a domain bought elsewhere, is in
[step 4 of the one-time setup](#4-point-the-domain-at-cloudflare). AdSense wants that first-party
domain, so this is the step before applying, not after.

---

## What runs where

| | GitHub Pages (`pages.yml`, `pnpm build:static`) | Cloudflare Worker (`deploy-worker.yml`, `pnpm build`) |
| --- | --- | --- |
| Server | none, fully static | Worker + D1 (`DB` binding) |
| Wallet | device wallet, in the browser | server wallet: `/api/wallet`, ledger in D1 |
| Duels | bot duels in-process | bot duels, two-device friend duels, matchmaking (`/api/duel`) |
| Accounts | none | `/api/auth` — guest promotion, magic link, Google |
| Ledger, holds, settlement | none | `ledger_*` tables, settlement in the ending request |
| Ops door and sweep | none | `/api/ops` behind `OPS_TOKEN`, driven by `sweep.yml` |
| Quiz SEO pages (`/quiz/*`) | yes (`pnpm seo:pages`) | yes, same static assets |
| Investor deck (`/deck/`) | yes | no |
| Domain | `<owner>.github.io/fact-duel/` | the founder's own domain, or `<name>.workers.dev` |

---

## The pieces

`pnpm build` produces `dist/server/` (the Worker: `index.js`, `no_bundle`, `nodejs_compat`) and
`dist/client/` (static assets), plus `dist/server/wrangler.json` — a manifest generated by
`vite.config.ts` from `.openai/hosting.json`. That manifest is right about the code and blank
about the account: Worker name = package name, D1 = a placeholder id, no route.

`pnpm deploy:prepare` (`scripts/deploy-prepare.mjs`) fills the blanks from `deploy.config.json` and
the environment — the environment wins, the file fills the gaps — and writes
`dist/server/wrangler.deploy.json` beside it. The generated file is never edited. It also
writes `dist/client/.assetsignore` with `product/` in it: the Worker build copies all of
`public/` into the assets, and `public/product/` is internal documentation — including the
compliance checklist that `pages.yml` refuses to publish, for the reasons in its header. The
workflow dry-runs the upload and fails if that file would go out.

| env | file field | required | meaning |
| --- | --- | --- | --- |
| `CF_D1_DATABASE_ID` | `d1.id` | yes, from one of the two | the uuid from step 1 below |
| `CF_D1_DATABASE_NAME` | `d1.name` | no (default `jhk-db`) | the database's name, as created |
| `CF_WORKER_NAME` | `workerName` | no (default `jaanta-hai-kya`) | the Worker's name in the dashboard |
| `CF_CUSTOM_DOMAIN` | — | no | e.g. `play.example.com`; emits a `custom_domain` route |

Nothing in `deploy.config.json` is secret: a database id is a locator and does nothing without
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, which are repository secrets and never written
to a file. A repository variable of the same name still overrides the file, so a staging deploy
needs no edit to the tree. Deploying the local placeholder id is refused outright.

`pnpm db:migrate:remote` applies `drizzle/*.sql` (0000–0006 today, all already applied to `jhk-db`)
to the live database through that deploy config. wrangler keeps a `d1_migrations` table so
re-running applies nothing twice.

The workflow `.github/workflows/deploy-worker.yml` runs all of the above on every push to `main`
that touches app, lib, db, drizzle, scripts, `deploy.config.json` or the package files, and on
demand from the Actions tab. Until the two secrets are set it exits green with a "not configured"
message naming them, exactly like the sweep.

---

## One-time setup

### 1. Create the D1 database

Already done for this repo: `jhk-db`, id `2c74ea74-4d0f-492a-9b21-6e29393bfb4b`, APAC, in
`deploy.config.json`. Skip to step 2 unless you are standing up a second account or a staging copy.

Either in the dashboard (Storage & Databases > D1 > Create) or locally, logged in as the account:

```
npx wrangler login
npx wrangler d1 create jhk-db
```

Copy the `database_id` it prints into `deploy.config.json` (`d1.id`), or set it as the repository
variable `CF_D1_DATABASE_ID`. If you pick another name, that name is `d1.name` /
`CF_D1_DATABASE_NAME`.

### 2. Create the API token

Dashboard > My Profile > API Tokens > Create Token. Start from the **Edit Cloudflare Workers**
template and make sure the token carries:

- Account · Workers Scripts · **Edit**
- Account · D1 · **Edit** (not in the template; add it)
- Zone · Workers Routes · **Edit** and Zone · Zone · **Read**, with the Zone Resources scoped to
  your domain — needed only for the Custom Domain in step 4

Copy the token once; it is not shown again. Copy the Account ID too (Workers & Pages > Overview,
right-hand column).

### 3. Set the repository secrets and variables

GitHub repo > Settings > Secrets and variables > Actions.

Secrets:

| name | value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | the account id |

Variables — all optional, each one overriding `deploy.config.json`:

| name | value |
| --- | --- |
| `CF_D1_DATABASE_ID` | only to point at a database other than the file's |
| `CF_D1_DATABASE_NAME` | only if not `jhk-db` |
| `CF_WORKER_NAME` | only if not `jaanta-hai-kya` |
| `CF_CUSTOM_DOMAIN` | leave unset for the first deploy; set in step 4 |
| `APP_URL` | the Worker's URL, read by the Pages build so the static site hands players over |

### 4. Point the domain at Cloudflare

Workers Custom Domains only work on a zone whose nameservers are Cloudflare's. Two ways:

- **Cloudflare Registrar**: buy or transfer the domain there; the zone is active at once.
- **Nameservers**: add the domain as a site in the dashboard (Free plan is fine), then set the two
  nameservers it gives you at your current registrar. Wait for the zone to show **Active**.

Then set the repository variable `CF_CUSTOM_DOMAIN` to the hostname (`play.example.com` or the
apex `example.com`) and re-run the workflow; wrangler creates the DNS record and certificate. The
same thing can be done by hand in Worker > Settings > Domains & Routes > Add > Custom Domain, but
then the variable stays unset so a deploy never fights the dashboard. Pick one.

Note the hostname must not already have a CNAME record; delete it first if it does.

### 5. Set the Worker's secrets

Optional, all of them. Each is a repository secret with the same name; the workflow pushes every
one that is set with `wrangler secret put` and skips the rest. What they do is in
`cloudflare-env.d.ts`:

| secret | without it |
| --- | --- |
| `OPS_TOKEN` | `/api/ops` answers 503 to everything; the sweep does nothing |
| `SESSION_SECRET` | reserved; nothing reads it yet |
| `GOOGLE_CLIENT_ID` | no Google sign-in button, the `google` action is 503 |
| `MAIL_API_KEY`, `MAIL_FROM` | magic links are minted but never sent |
| `APP_ORIGIN` | magic links point at the request's own origin (fine once the domain is live) |

Generate `OPS_TOKEN` as 48+ random characters (`openssl rand -hex 32`). The same value goes in
the repository secret `OPS_TOKEN` that `sweep.yml` reads, and `OPS_URL` becomes
`https://<your domain>/api/ops`.

### 6. First deploy

Actions > "Deploy the Worker to Cloudflare" > Run workflow. Read the log: the "Prepare the deploy
manifest" step prints the Worker name, database and domain it resolved, and which of those came
from `deploy.config.json`; "Apply D1 migrations" reports 0000–0006 already applied, so nothing
runs; "Deploy the Worker" prints the URL.

Locally, the same thing is (the database id comes from `deploy.config.json`; set
`CF_D1_DATABASE_ID` only to override it):

```
SITE_BASE=https://play.example.com pnpm seo:pages   # canonical URLs on your domain
pnpm build
CF_CUSTOM_DOMAIN=play.example.com pnpm deploy:prepare
pnpm db:migrate:remote
WRANGLER_LOG=debug npx wrangler deploy --dry-run --config dist/server/wrangler.deploy.json \
  | grep -x 'Ignoring asset: product/compliance/checklist.site.html'   # must print one line
npx wrangler deploy --config dist/server/wrangler.deploy.json
```

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment, or `npx wrangler login`.

### 7. Verify

```
# Before OPS_TOKEN is set on the Worker: 503, and the body says the service is unavailable.
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<domain>/api/ops \
  -H 'content-type: application/json' -d '{"action":"health"}'
# After it is set, a wrong token: 401.
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<domain>/api/ops \
  -H 'content-type: application/json' -H 'authorization: Bearer wrong' -d '{"action":"health"}'
# The right one: 200 and the heartbeat.
```

Then open the game, play a bot duel, watch an ad card, and check the D1 console shows rows in
`ledger_transactions`. Run the sweep workflow by hand once and confirm it goes green.

---

## Pages: keep it or retire it

Both deployments serve the same game. Keeping Pages means two copies of the quiz SEO pages on two
hosts, and AdSense (and search engines) want the first-party domain to be *the* site. Two honest
options:

1. **Retire Pages for the game.** Keep `pages.yml` for the deck only, or stop it. The domain is the
   single canonical home. Simplest and what AdSense expects.
2. **Keep Pages as an offline mirror.** Fine for demos, but add a `<link rel="canonical">` pointing
   at the domain on every static page so the mirror never outranks the real site, and do not put
   ads on the mirror.

Do not run ads on both. The AdSense review looks at the domain in the application, and the copy
that carries the ledger is the one that should carry the ads.

---

## Gotchas

- **`triggers: {}`.** The generated manifest has no cron slot, so the sweep stays on GitHub
  Actions (`sweep.yml`), best-effort. If a later vinext writes a `triggers` block, move it.
- **Migrations run before code.** Every migration is additive, so old code keeps working against
  the new schema while the upload finishes. Keep it that way: never drop a column in the same
  deploy that stops writing it.
- **Do not change the database id casually** — in `deploy.config.json` or as
  `CF_D1_DATABASE_ID`. Pointing the Worker at a different database is
  a fresh ledger with a zero balance for everyone. See the Time Travel warning in
  `docs/money-runbook.md` before restoring anything.
- **Secrets survive deploys.** `wrangler deploy` never clears a secret; only `wrangler secret
  delete` does. Rotating `OPS_TOKEN` is: change the repository secret, re-run the workflow, change
  the sweep's copy.
- **Size.** Today's Worker uploads at about 5.4 MB raw / 1.8 MB gzipped, under the free plan's
  3 MB compressed limit. If a deploy starts failing on size, that is the first thing to check.
- **workers.dev.** The Worker is also reachable at `<name>.<account>.workers.dev`. Once the domain
  is live, turn that off in Worker > Settings > Domains & Routes so there is one origin.
