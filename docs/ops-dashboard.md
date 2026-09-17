# Ops dashboard (`/ops`)

One page, four panels: Cloudflare traffic, Google Search Console, Google AdSense and the game's own
counters out of D1. It lives at `/ops` on the Worker deployment and reads `POST /api/stats`.

**Honesty rule.** A panel shows a number only when its source answered. A source with no secret
renders *"Not connected — set `<NAME>`"*; a source that failed renders the failure sentence and the
time it was tried. There is no placeholder, sample or estimated figure anywhere on the page.

**Static build caveat.** The GitHub Pages build (`pnpm build:static`) bundles only the game client.
It has no server, no `/api/stats` and no `/ops`. The dashboard exists on the Cloudflare Worker
deployment alone.

## Access

The route is gated by the same bearer secret as `/api/ops`:

```sh
wrangler secret put OPS_TOKEN
```

If `OPS_TOKEN` is unset or empty the route answers **503 to everyone**, including a correct caller.
It never falls open. A wrong token is 401. The page asks for the token once and keeps it in the
tab's `sessionStorage` only — never in the address bar, never in a cookie — and forgets it when the
tab closes or when a request comes back 401.

The server keeps one overview per window (7 / 30 / 90 days) in memory for 60 seconds, so however
often the page is reloaded, each vendor sees at most one call a minute per window.

## Secrets, and how to mint each one

Store every secret on the Worker with `wrangler secret put <NAME>` (run from the repository root
against the generated `dist/server/wrangler.json`, or from the Cloudflare dashboard under
*Workers → your worker → Settings → Variables and Secrets*). Nothing below is read from a file or
from `process.env`; the adapters in `lib/server/stats-service.mjs` take only what the Worker
binding gives them.

| Panel | Secrets |
|---|---|
| Traffic | `CF_ANALYTICS_TOKEN`, `CF_ZONE_TAG` |
| Search | `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL` |
| Ad revenue | `ADSENSE_CLIENT_ID`, `ADSENSE_CLIENT_SECRET`, `ADSENSE_REFRESH_TOKEN`, `ADSENSE_ACCOUNT` |
| Game | the `DB` D1 binding (already part of the deployment) |

### Cloudflare traffic

Reads the GraphQL Analytics API (`httpRequests1dGroups`): requests, page views, uniques and bytes
per UTC day, and the top countries by requests.

1. Cloudflare dashboard → *My Profile → API Tokens → Create Token → Custom token*.
2. Permissions: **Zone → Analytics → Read**. Zone resources: *Include → Specific zone → your zone*.
   Nothing else. The dashboard only ever reads.
3. Copy the token once; it is not shown again.
4. The zone tag is the *Zone ID* on the zone's *Overview* page (right-hand column).

```sh
wrangler secret put CF_ANALYTICS_TOKEN
wrangler secret put CF_ZONE_TAG
```

Notes: `httpRequests1dGroups` counts every request at the edge, including bots and cached
responses; page views are Cloudflare's own filtered figure. Daily uniques do not add across days,
so the tile shows the peak day rather than a sum. Free zones keep a limited history, so the 90-day
window may come back partly empty on those plans — the missing days render as zero because the
source was reached and reported nothing for them.

### Google Search Console

Reads `searchanalytics/query` for clicks, impressions, CTR and position by date, plus the top ten
queries and pages. Search Console data runs two to three days behind; the panel prints the last day
it actually reported.

1. Google Cloud console → create (or pick) a project → *APIs & Services → Enable APIs* → enable the
   **Google Search Console API**.
2. *IAM & Admin → Service Accounts → Create service account*. No project roles are needed.
3. On the new account: *Keys → Add key → Create new key → JSON*. Download the file.
4. Search Console → your property → *Settings → Users and permissions → Add user*. Paste the
   service account's email (`…@…iam.gserviceaccount.com`) with **Full** or **Restricted** — both
   can read. Without this step the API answers 403.
5. The site URL is the property exactly as Search Console lists it: a URL-prefix property is
   `https://example.com/` (trailing slash included); a domain property is `sc-domain:example.com`.

```sh
wrangler secret put GSC_SERVICE_ACCOUNT_JSON < service-account.json
wrangler secret put GSC_SITE_URL
```

The Worker signs an RS256 JWT with the key's `private_key` (WebCrypto, no library), exchanges it at
`oauth2.googleapis.com/token` for a one-hour access token, and calls the API with that. The key
never leaves the Worker; the dashboard response contains no token.

### Google AdSense

Reads the AdSense Management API v2 (`reports:generate`) for estimated earnings, page views, ad
impressions, page RPM and clicks by date and by country. Earnings are AdSense's *estimated* figure,
before end-of-month adjustments, in the account's reporting currency; the panel prints the currency
code the API returns rather than assuming a symbol.

The Management API has no service-account path — it needs an OAuth refresh token minted by the
AdSense account holder. Once, on your own machine:

1. Google Cloud console → the same project → *Enable APIs* → **AdSense Management API**.
2. *APIs & Services → OAuth consent screen*. External, add yourself as a test user (the app can
   stay in testing; only your account will ever use it).
3. *Credentials → Create credentials → OAuth client ID → Desktop app*. Note the client ID and
   secret.
4. Open this URL in a browser, signed in as the AdSense account holder (replace `CLIENT_ID`):

   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=CLIENT_ID&redirect_uri=http://localhost&response_type=code&scope=https://www.googleapis.com/auth/adsense.readonly&access_type=offline&prompt=consent
   ```

   Approve. The browser lands on `http://localhost/?code=…` (a connection error is fine); copy the
   `code` from the address bar.
5. Exchange it once:

   ```sh
   curl -s https://oauth2.googleapis.com/token \
     -d client_id=CLIENT_ID -d client_secret=CLIENT_SECRET \
     -d code=THE_CODE -d grant_type=authorization_code -d redirect_uri=http://localhost
   ```

   The JSON answer carries `refresh_token`. That is the secret; it does not expire while the app is
   in use (a consent screen in *testing* status expires tokens after 7 days — publish the app, or
   move to *In production* with only the `adsense.readonly` scope, to make it permanent).
6. The account name is `accounts/pub-XXXXXXXXXXXXXXXX` (the publisher ID is under *AdSense →
   Account → Settings → Account information*). `pub-…` alone is also accepted.

```sh
wrangler secret put ADSENSE_CLIENT_ID
wrangler secret put ADSENSE_CLIENT_SECRET
wrangler secret put ADSENSE_REFRESH_TOKEN
wrangler secret put ADSENSE_ACCOUNT
```

The Worker refreshes an access token on every read (cached with the overview for 60 s) and asks for
`ESTIMATED_EARNINGS, PAGE_VIEWS, IMPRESSIONS, PAGE_VIEWS_RPM, CLICKS` by `DATE` and by
`COUNTRY_CODE`. The window RPM tile is recomputed from the totals (earnings ÷ page views × 1000),
not averaged over days.

### The game (D1)

No secret: the `DB` binding the duel and wallet routes already use. Per UTC day, from the tables:

- **New guests** — `principals` rows by `created_at`. Permanent rows; exact.
- **Rooms created** — `rooms` rows by `created_at`. The sweep deletes expired rooms, so a window
  longer than the room lifetime undercounts; the panel says so.
- **Ads redeemed / coins from ads** — `ad_redemptions` count and `SUM(amount)` by `at`. Permanent.
- **Coins issued** — the play treasury's debit balance (`-balance` of `play:treasury:mint`), which
  is lifetime issuance by construction (`lib/ledger/invariants.mjs`). Shown as `—` until the
  treasury account has been opened by a first grant.
- **Heartbeat** — `health()` from `lib/server/ops-service.mjs`: the newest `ops_runs` row per kind
  (`sweep`, `reconcile`), its age, and whether it is stale, stuck or failed. `never ran` is a real
  state and is shown as one.

## Reading the panels

- The window selector (7 / 30 / 90 days) scopes every panel. Days are UTC everywhere.
- A refetch dims the previous render rather than clearing it; the *as of* stamp is the last
  successful read.
- Each chart is one series, with a crosshair on hover, arrow keys when focused, and the same days
  as a table under *Show these N days as a table*.
- Vendor totals can disagree with each other by design: Cloudflare counts edge requests, AdSense
  counts pages that rendered an ad, Search Console counts Google results. None of them is
  "the" traffic number.

## Failure modes, in the words the page uses

| Page says | Meaning | Do |
|---|---|---|
| `This deployment has no OPS_TOKEN` | `/api/stats` answered 503 | `wrangler secret put OPS_TOKEN` |
| `That token was not accepted` | 401; the token was cleared from the tab | paste the right one |
| `Not connected — set X` | the secret `X` is unset on the Worker | mint it, per the section above |
| `Connected, but the source did not answer` | the secret is set; the vendor returned an error, non-JSON, or took over 6 s | read the sentence: a 401/403 from Google is a permissions step missed; a 500 or timeout is theirs |
| `Search Console returned no rows` | reachable, but empty | check `GSC_SITE_URL` matches the property exactly |

## Where the code is

- `lib/server/stats-service.mjs` — the four adapters and `overview()`. Pure: credentials, `fetchImpl`
  and `now` are arguments.
- `lib/server/http-stats.mjs` — the bearer gate and the 60 s cache.
- `app/api/stats/route.ts` — the route.
- `app/ops/` — the page, the panels, the chart and the stylesheet.
- `tests/stats-service.test.mjs` — every adapter against a fake fetch, the JWT, the D1 counts, the
  door and the cache.
