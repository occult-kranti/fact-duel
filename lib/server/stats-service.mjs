/**
 * lib/server/stats-service.mjs — the founder dashboard's four readers.
 *
 * Four adapters, one contract. Each takes its credentials as plain arguments (never reads `env`
 * or `process`), takes `fetchImpl` and `now` so a test can stand in for the network and the
 * clock, and ALWAYS resolves to one of three shapes:
 *
 *   { connected: false, reason, secret }        — the credential is not set. `secret` names the
 *                                                 variable to set; `reason` is the sentence the
 *                                                 dashboard prints. No numbers, ever.
 *   { connected: true, error, asOf }            — the credential is set and the upstream failed
 *                                                 (HTTP error, bad JSON, timeout). No numbers.
 *   { connected: true, asOf, ... real data }    — what the upstream actually said.
 *
 * Nothing here throws to its caller. The dashboard is a founder looking at a page, and a page that
 * dies because one of four vendors is having a bad morning is a page that gets ignored. But the
 * honesty rule cuts the other way too: an adapter that cannot reach its source says so, in words,
 * and never emits a zero that could be mistaken for "nothing happened".
 *
 * Every number the dashboard shows is either a vendor's own figure or a COUNT/SUM over a D1 table.
 * There is no estimate, no extrapolation and no sample data in this file.
 */
import { D1OpsStore, health } from './ops-service.mjs';

export const STATS = Object.freeze({
  /** The dashboard asks for 7 by default; 90 is as far back as the cheapest sources go. */
  defaultDays: 7,
  maxDays: 90,
  /** One vendor's bad morning must not hold the page. Per-adapter, in the handler and here. */
  timeoutMs: 6_000,
  /** How many query/page rows the search panel shows. */
  topRows: 10,
  /** How many countries the traffic and AdSense panels show. */
  topCountries: 10,
});

const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GSC_API = 'https://www.googleapis.com/webmasters/v3/sites';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const ADSENSE_API = 'https://adsense.googleapis.com/v2';

/* ------------------------------------------------------------------------------------------ */
/* shared plumbing                                                                             */
/* ------------------------------------------------------------------------------------------ */

const isBlank = (value) => typeof value !== 'string' || value.trim().length === 0;

/** `days` from the outside world → an integer in [1, maxDays]. */
export function clampDays(days) {
  const n = Math.trunc(Number(days));
  if (!Number.isFinite(n) || n < 1) return STATS.defaultDays;
  return Math.min(n, STATS.maxDays);
}

/** Epoch ms → 'YYYY-MM-DD' in UTC. Every source here reports in whole UTC days. */
export function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The `days` ISO days that end today (UTC), oldest first. */
export function dayWindow(now, days) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) out.push(isoDay(now - i * 86_400_000));
  return out;
}

/**
 * Zero-fills a day-keyed map over the window so a chart never shows a gap where the source
 * reported nothing. A missing day IS a zero for a count of requests, clicks or rooms — the
 * source was reached and said nothing happened — which is different from the source being
 * unreachable, and that difference is what the three-shape contract at the top is for.
 */
export function fillDays(window, byDay, fields) {
  return window.map((day) => {
    const row = byDay.get(day);
    const out = { day };
    for (const field of fields) out[field] = Number(row?.[field]) || 0;
    return out;
  });
}

const sumBy = (rows, field) => rows.reduce((n, row) => n + (Number(row[field]) || 0), 0);

class UpstreamError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status ?? null;
  }
}

/**
 * `fetch` with a deadline. Aborts the underlying request AND resolves the race, because a fake
 * or a buggy fetch that ignores its signal must still not hold the page.
 */
async function timedFetch(fetchImpl, url, init, timeoutMs) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      // Reject first, then abort: the race must report the deadline, not the abort it caused.
      reject(new UpstreamError(`Timed out after ${Math.round(timeoutMs / 1000)} s.`, 504));
      controller?.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      fetchImpl(url, controller ? { ...init, signal: controller.signal } : init),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** A JSON round trip that turns every non-2xx into an UpstreamError carrying the status only. */
async function fetchJson(fetchImpl, url, init, timeoutMs, label) {
  const response = await timedFetch(fetchImpl, url, init, timeoutMs);
  if (!response.ok) throw new UpstreamError(`${label} answered ${response.status}.`, response.status);
  try {
    return await response.json();
  } catch {
    throw new UpstreamError(`${label} returned something that was not JSON.`, response.status);
  }
}

/** The operator-facing sentence for a failure. Never a vendor body, which may echo a token. */
function describe(error, label) {
  if (error instanceof UpstreamError) return error.message;
  if (error?.name === 'AbortError') return `${label} request was aborted.`;
  return `${label} request failed: ${error?.constructor?.name ?? typeof error}.`;
}

const notConnected = (secret, reason) => Object.freeze({ connected: false, secret, reason });

/**
 * Runs one adapter body inside the contract: a missing secret short-circuits before any network
 * call, and any throw becomes `{ connected: true, error }`.
 */
async function guarded({ missing, label, now }, body) {
  if (missing) return notConnected(missing.secret, missing.reason);
  const asOf = now();
  try {
    return Object.freeze({ connected: true, asOf, ...(await body()) });
  } catch (error) {
    return Object.freeze({ connected: true, asOf, error: describe(error, label) });
  }
}

/* ------------------------------------------------------------------------------------------ */
/* Cloudflare traffic — GraphQL Analytics API, httpRequests1dGroups                             */
/* ------------------------------------------------------------------------------------------ */

const CF_QUERY = `query FactDuelTraffic($zoneTag: string, $since: Date, $until: Date) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      days: httpRequests1dGroups(limit: 100, orderBy: [date_ASC], filter: { date_geq: $since, date_leq: $until }) {
        dimensions { date }
        sum { requests pageViews bytes }
        uniq { uniques }
      }
      countries: httpRequests1dGroups(limit: 1, filter: { date_geq: $since, date_leq: $until }) {
        sum { countryMap { clientCountryName requests bytes } }
      }
    }
  }
}`;

/**
 * Requests, page views, uniques and bytes per day, plus the top countries by requests. Uniques
 * are per day and are NOT summed into a window total — Cloudflare's daily uniques do not add
 * (the same visitor on two days is two uniques), so the tile shows the peak day and says so.
 */
export async function cloudflareTraffic({
  token,
  zoneTag,
  days = STATS.defaultDays,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  timeoutMs = STATS.timeoutMs,
} = {}) {
  const missing = isBlank(token)
    ? { secret: 'CF_ANALYTICS_TOKEN', reason: 'Not connected — set CF_ANALYTICS_TOKEN.' }
    : isBlank(zoneTag)
      ? { secret: 'CF_ZONE_TAG', reason: 'Not connected — set CF_ZONE_TAG.' }
      : null;
  return guarded({ missing, label: 'Cloudflare', now }, async () => {
    const span = clampDays(days);
    const window = dayWindow(now(), span);
    const body = await fetchJson(
      fetchImpl,
      CF_GRAPHQL,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          query: CF_QUERY,
          variables: { zoneTag, since: window[0], until: window[window.length - 1] },
        }),
      },
      timeoutMs,
      'Cloudflare',
    );
    if (Array.isArray(body?.errors) && body.errors.length)
      throw new UpstreamError(`Cloudflare refused the query: ${String(body.errors[0]?.message ?? 'unknown').slice(0, 120)}`);
    const zone = body?.data?.viewer?.zones?.[0];
    if (!zone) throw new UpstreamError('Cloudflare returned no zone for CF_ZONE_TAG.');
    const byDay = new Map(
      (zone.days ?? []).map((group) => [
        group.dimensions?.date,
        {
          requests: group.sum?.requests,
          pageViews: group.sum?.pageViews,
          bytes: group.sum?.bytes,
          uniques: group.uniq?.uniques,
        },
      ]),
    );
    const series = fillDays(window, byDay, ['requests', 'pageViews', 'bytes', 'uniques']);
    const countries = (zone.countries?.[0]?.sum?.countryMap ?? [])
      .map((row) => ({
        country: String(row.clientCountryName ?? '??'),
        requests: Number(row.requests) || 0,
        bytes: Number(row.bytes) || 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, STATS.topCountries);
    return {
      days: span,
      series,
      countries,
      totals: {
        requests: sumBy(series, 'requests'),
        pageViews: sumBy(series, 'pageViews'),
        bytes: sumBy(series, 'bytes'),
        peakUniques: series.reduce((n, row) => Math.max(n, row.uniques), 0),
      },
    };
  });
}

/* ------------------------------------------------------------------------------------------ */
/* Google auth — a service-account JWT, and a refresh-token exchange                            */
/* ------------------------------------------------------------------------------------------ */

const base64url = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};
const utf8 = (text) => new TextEncoder().encode(text);

/** PEM (PKCS#8, the shape Google's JSON key carries) → DER bytes for `importKey`. */
function pemToDer(pem) {
  const body = String(pem)
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * A signed RS256 JWT for Google's service-account flow. Pure WebCrypto so it runs unchanged on
 * Workers and under `node --test`. `iat` is `now`, `exp` one hour later — the longest Google
 * accepts.
 */
export async function signServiceAccountJwt({ clientEmail, privateKeyPem, scope, now, subtle = globalThis.crypto?.subtle }) {
  if (!subtle) throw new UpstreamError('WebCrypto is unavailable in this runtime.');
  const iat = Math.floor(now / 1000);
  const header = base64url(utf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = base64url(
    utf8(JSON.stringify({ iss: clientEmail, scope, aud: GOOGLE_TOKEN, iat, exp: iat + 3600 })),
  );
  const unsigned = `${header}.${claims}`;
  const key = await subtle.importKey(
    'pkcs8',
    pemToDer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(unsigned)));
  return `${unsigned}.${base64url(signature)}`;
}

/** One POST to Google's token endpoint; returns the bearer or throws with the status only. */
async function googleToken(fetchImpl, params, timeoutMs) {
  const body = await fetchJson(
    fetchImpl,
    GOOGLE_TOKEN,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    },
    timeoutMs,
    'Google token endpoint',
  );
  if (isBlank(body?.access_token)) throw new UpstreamError('Google token endpoint returned no access token.');
  return body.access_token;
}

/** The service-account JSON, parsed and checked, or the reason it cannot be used. */
function readServiceAccount(json) {
  try {
    const parsed = JSON.parse(json);
    if (isBlank(parsed?.client_email) || isBlank(parsed?.private_key)) return { error: 'missing client_email or private_key' };
    return { clientEmail: parsed.client_email, privateKeyPem: parsed.private_key };
  } catch {
    return { error: 'not valid JSON' };
  }
}

/* ------------------------------------------------------------------------------------------ */
/* Google Search Console                                                                       */
/* ------------------------------------------------------------------------------------------ */

const gscRow = (row) => ({
  clicks: Number(row.clicks) || 0,
  impressions: Number(row.impressions) || 0,
  ctr: Number(row.ctr) || 0,
  position: Number(row.position) || 0,
});

/**
 * Clicks, impressions, CTR and position by day, plus the top queries and pages. Search Console
 * data runs two to three days behind, so the window is asked for as-is and the last days simply
 * come back empty; the dashboard prints the last day the source actually reported.
 */
export async function searchConsole({
  serviceAccountJson,
  siteUrl,
  days = STATS.defaultDays,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  timeoutMs = STATS.timeoutMs,
  subtle,
} = {}) {
  const missing = isBlank(serviceAccountJson)
    ? { secret: 'GSC_SERVICE_ACCOUNT_JSON', reason: 'Not connected — set GSC_SERVICE_ACCOUNT_JSON.' }
    : isBlank(siteUrl)
      ? { secret: 'GSC_SITE_URL', reason: 'Not connected — set GSC_SITE_URL.' }
      : null;
  return guarded({ missing, label: 'Search Console', now }, async () => {
    const account = readServiceAccount(serviceAccountJson);
    if (account.error) throw new UpstreamError(`GSC_SERVICE_ACCOUNT_JSON is ${account.error}.`);
    const span = clampDays(days);
    const window = dayWindow(now(), span);
    const assertion = await signServiceAccountJwt({ ...account, scope: GSC_SCOPE, now: now(), subtle });
    const accessToken = await googleToken(
      fetchImpl,
      { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion },
      timeoutMs,
    );
    const query = async (dimension, rowLimit) => {
      const body = await fetchJson(
        fetchImpl,
        `${GSC_API}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            startDate: window[0],
            endDate: window[window.length - 1],
            dimensions: [dimension],
            rowLimit,
          }),
        },
        timeoutMs,
        'Search Console',
      );
      return Array.isArray(body?.rows) ? body.rows : [];
    };
    const [byDate, byQuery, byPage] = await Promise.all([
      query('date', span),
      query('query', STATS.topRows),
      query('page', STATS.topRows),
    ]);
    const byDay = new Map(byDate.map((row) => [row.keys?.[0], gscRow(row)]));
    const series = fillDays(window, byDay, ['clicks', 'impressions', 'ctr', 'position']);
    const clicks = sumBy(series, 'clicks');
    const impressions = sumBy(series, 'impressions');
    // Window CTR and position are impression-weighted over the days that had any.
    const weighted = series.reduce((n, row) => n + row.position * row.impressions, 0);
    const top = (rows) => rows.map((row) => ({ key: String(row.keys?.[0] ?? ''), ...gscRow(row) }));
    const reported = byDate.map((row) => row.keys?.[0]).filter(Boolean).sort();
    return {
      days: span,
      series,
      queries: top(byQuery),
      pages: top(byPage),
      totals: {
        clicks,
        impressions,
        ctr: impressions > 0 ? clicks / impressions : 0,
        position: impressions > 0 ? weighted / impressions : 0,
      },
      lastReportedDay: reported.length ? reported[reported.length - 1] : null,
    };
  });
}

/* ------------------------------------------------------------------------------------------ */
/* Google AdSense — Management API v2, reports:generate                                        */
/* ------------------------------------------------------------------------------------------ */

const ADSENSE_METRICS = ['ESTIMATED_EARNINGS', 'PAGE_VIEWS', 'IMPRESSIONS', 'PAGE_VIEWS_RPM', 'CLICKS'];

/** `accounts/pub-…` as the API wants it, whichever of the two spellings the operator stored. */
const adsenseAccountPath = (account) => (account.startsWith('accounts/') ? account : `accounts/${account}`);

const dateParts = (iso, prefix) => {
  const [year, month, day] = iso.split('-');
  return [
    [`${prefix}.year`, year],
    [`${prefix}.month`, String(Number(month))],
    [`${prefix}.day`, String(Number(day))],
  ];
};

/** A `reports:generate` body → rows keyed by the dimension column, metrics by name. */
function adsenseRows(body, dimension) {
  const headers = (body?.headers ?? []).map((h) => h.name);
  const pick = (cells, name) => {
    const i = headers.indexOf(name);
    return i >= 0 ? cells[i]?.value : undefined;
  };
  return (body?.rows ?? []).map((row) => {
    const cells = row.cells ?? [];
    return {
      key: String(pick(cells, dimension) ?? ''),
      earnings: Number(pick(cells, 'ESTIMATED_EARNINGS')) || 0,
      pageViews: Number(pick(cells, 'PAGE_VIEWS')) || 0,
      impressions: Number(pick(cells, 'IMPRESSIONS')) || 0,
      rpm: Number(pick(cells, 'PAGE_VIEWS_RPM')) || 0,
      clicks: Number(pick(cells, 'CLICKS')) || 0,
    };
  });
}

/**
 * Earnings, page views, impressions, RPM and clicks by day and by country. Earnings are in the
 * account's reporting currency, which the API names in the `ESTIMATED_EARNINGS` header; the
 * dashboard prints that code rather than assuming a symbol.
 */
export async function adsenseReport({
  clientId,
  clientSecret,
  refreshToken,
  account,
  days = STATS.defaultDays,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  timeoutMs = STATS.timeoutMs,
} = {}) {
  const missing = [
    ['ADSENSE_CLIENT_ID', clientId],
    ['ADSENSE_CLIENT_SECRET', clientSecret],
    ['ADSENSE_REFRESH_TOKEN', refreshToken],
    ['ADSENSE_ACCOUNT', account],
  ].find(([, value]) => isBlank(value));
  return guarded(
    {
      missing: missing ? { secret: missing[0], reason: `Not connected — set ${missing[0]}.` } : null,
      label: 'AdSense',
      now,
    },
    async () => {
      const span = clampDays(days);
      const window = dayWindow(now(), span);
      const accessToken = await googleToken(
        fetchImpl,
        { client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' },
        timeoutMs,
      );
      const report = async (dimension) => {
        const params = new URLSearchParams([
          ['dateRange', 'CUSTOM'],
          ...dateParts(window[0], 'startDate'),
          ...dateParts(window[window.length - 1], 'endDate'),
          ...ADSENSE_METRICS.map((metric) => ['metrics', metric]),
          ['dimensions', dimension],
          ['orderBy', dimension === 'DATE' ? '+DATE' : '-ESTIMATED_EARNINGS'],
        ]);
        const body = await fetchJson(
          fetchImpl,
          `${ADSENSE_API}/${adsenseAccountPath(account)}/reports:generate?${params}`,
          { method: 'GET', headers: { authorization: `Bearer ${accessToken}` } },
          timeoutMs,
          'AdSense',
        );
        const currency = (body?.headers ?? []).find((h) => h.name === 'ESTIMATED_EARNINGS')?.currencyCode ?? null;
        return { rows: adsenseRows(body, dimension), currency };
      };
      const [byDate, byCountry] = await Promise.all([report('DATE'), report('COUNTRY_CODE')]);
      const fields = ['earnings', 'pageViews', 'impressions', 'rpm', 'clicks'];
      const series = fillDays(window, new Map(byDate.rows.map((row) => [row.key, row])), fields);
      const earnings = sumBy(series, 'earnings');
      const pageViews = sumBy(series, 'pageViews');
      return {
        days: span,
        currency: byDate.currency ?? byCountry.currency,
        series,
        countries: byCountry.rows.slice(0, STATS.topCountries).map(({ key, ...rest }) => ({ country: key, ...rest })),
        totals: {
          earnings,
          pageViews,
          impressions: sumBy(series, 'impressions'),
          clicks: sumBy(series, 'clicks'),
          // Window RPM is recomputed from the totals; averaging daily RPMs would weight a quiet
          // day the same as a busy one.
          rpm: pageViews > 0 ? (earnings / pageViews) * 1000 : 0,
        },
      };
    },
  );
}

/* ------------------------------------------------------------------------------------------ */
/* The game's own numbers — D1                                                                  */
/* ------------------------------------------------------------------------------------------ */

const TREASURY = 'play:treasury:mint';

/**
 * New guests, rooms created, ads redeemed and coins granted per UTC day, lifetime coin issuance
 * read off the treasury's debit balance, and the sweep/reconcile heartbeat from `health()`.
 *
 * "Not connected" here means there is no `env.DB`, which is true in local development and in
 * the static build. Rooms are counted from the rows that still exist: `D1RoomStore.cleanup`
 * deletes expired rooms, so a count over a window longer than the room TTL undercounts and the
 * panel says so.
 */
export async function gameOps(db, { days = STATS.defaultDays, now = Date.now } = {}) {
  const missing = db ? null : { secret: 'DB', reason: 'Not connected — no D1 binding (DB) on this deployment.' };
  return guarded({ missing, label: 'Database', now }, async () => {
    const span = clampDays(days);
    const at = now();
    const window = dayWindow(at, span);
    const since = Date.parse(`${window[0]}T00:00:00Z`);
    const perDay = async (sql) => {
      const out = await db.prepare(sql).bind(since).all();
      return new Map((out.results ?? []).map((row) => [row.day, row]));
    };
    const [guests, rooms, ads, treasury, principalsTotal, roomsTotal, heartbeat] = await Promise.all([
      perDay("SELECT date(created_at/1000,'unixepoch') AS day, COUNT(*) AS n FROM principals WHERE created_at >= ? GROUP BY day"),
      perDay("SELECT date(created_at/1000,'unixepoch') AS day, COUNT(*) AS n FROM rooms WHERE created_at >= ? GROUP BY day"),
      perDay("SELECT date(at/1000,'unixepoch') AS day, COUNT(*) AS n, SUM(amount) AS coins FROM ad_redemptions WHERE at >= ? GROUP BY day"),
      db.prepare('SELECT balance FROM ledger_accounts WHERE account_id = ?').bind(TREASURY).first(),
      db.prepare('SELECT COUNT(*) AS n FROM principals').first(),
      db.prepare('SELECT COUNT(*) AS n FROM rooms').first(),
      health({ store: new D1OpsStore(db), now: at }),
    ]);
    const series = window.map((day) => ({
      day,
      guests: Number(guests.get(day)?.n) || 0,
      rooms: Number(rooms.get(day)?.n) || 0,
      ads: Number(ads.get(day)?.n) || 0,
      coins: Number(ads.get(day)?.coins) || 0,
    }));
    return {
      days: span,
      series,
      totals: {
        guests: sumBy(series, 'guests'),
        rooms: sumBy(series, 'rooms'),
        ads: sumBy(series, 'ads'),
        coins: sumBy(series, 'coins'),
        principalsAllTime: Number(principalsTotal?.n) || 0,
        roomsLive: Number(roomsTotal?.n) || 0,
        // The treasury only ever goes negative; its debit balance is lifetime issuance.
        issuedAllTime: treasury ? -Number(treasury.balance) : 0,
        treasuryOpened: Boolean(treasury),
      },
      heartbeat,
    };
  });
}

/**
 * All four, in parallel, each behind its own deadline so the slowest source decides only its own
 * panel. `env` is read here and nowhere else in this module, so every adapter above stays
 * testable with plain arguments.
 */
export async function overview({ env, days, fetchImpl = globalThis.fetch, now = Date.now, timeoutMs = STATS.timeoutMs } = {}) {
  const span = clampDays(days);
  const shared = { days: span, fetchImpl, now, timeoutMs };
  const [traffic, search, adsense, game] = await Promise.all([
    cloudflareTraffic({ token: env?.CF_ANALYTICS_TOKEN, zoneTag: env?.CF_ZONE_TAG, ...shared }),
    searchConsole({ serviceAccountJson: env?.GSC_SERVICE_ACCOUNT_JSON, siteUrl: env?.GSC_SITE_URL, ...shared }),
    adsenseReport({
      clientId: env?.ADSENSE_CLIENT_ID,
      clientSecret: env?.ADSENSE_CLIENT_SECRET,
      refreshToken: env?.ADSENSE_REFRESH_TOKEN,
      account: env?.ADSENSE_ACCOUNT,
      ...shared,
    }),
    gameOps(env?.DB ?? null, { days: span, now }),
  ]);
  return Object.freeze({ days: span, asOf: now(), traffic, search, adsense, game });
}
