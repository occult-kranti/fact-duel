/**
 * The founder dashboard's readers and their door.
 *
 * The test that matters most is the shape contract: every adapter answers `{ connected:false }`
 * with the secret's NAME when it is unset, `{ connected:true, error }` when the vendor fails or
 * stalls, and real numbers only when the vendor actually said them. A dashboard that printed a 0
 * for a source it never reached would be a lie the founder would make decisions on. The route
 * tests pin the same fail-closed 503/401 pair as `/api/ops`, and the cache test pins that a page
 * reloaded twice in a minute costs the vendors one call.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { LocalD1 } from './d1-local.mjs';
import {
  STATS,
  adsenseReport,
  clampDays,
  cloudflareTraffic,
  dayWindow,
  fillDays,
  gameOps,
  overview,
  searchConsole,
  signServiceAccountJwt,
} from '../lib/server/stats-service.mjs';
import { CACHE_TTL_MS, handleStatsRequest } from '../lib/server/http-stats.mjs';
import { D1OpsStore, sweep } from '../lib/server/ops-service.mjs';

/** 2026-09-17T12:00:00Z — a fixed clock so every window is deterministic. */
const NOW = Date.UTC(2026, 8, 17, 12);
const now = () => NOW;
const DAY = 86_400_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** A fetch that answers from a routing table and records what it was asked. */
function fakeFetch(routes) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url: String(url), init });
    for (const [match, answer] of routes) if (String(url).includes(match)) return typeof answer === 'function' ? answer(url, init) : answer();
    throw new Error(`unexpected fetch ${url}`);
  };
  impl.calls = calls;
  return impl;
}

/** A fetch that honours its abort signal and otherwise never answers. */
const stalledFetch = () =>
  (_url, init) =>
    new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });

/** A fetch that ignores its signal entirely — the deadline must still fire. */
const deafFetch = () => () => new Promise(() => {});

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PRIVATE_PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const SERVICE_ACCOUNT = JSON.stringify({ client_email: 'stats@example.iam.gserviceaccount.com', private_key: PRIVATE_PEM });

/* ---------- helpers ---------- */

test('clampDays defaults, floors and caps', () => {
  assert.equal(clampDays(undefined), STATS.defaultDays);
  assert.equal(clampDays('abc'), STATS.defaultDays);
  assert.equal(clampDays(0), STATS.defaultDays);
  assert.equal(clampDays(3.9), 3);
  assert.equal(clampDays(10_000), STATS.maxDays);
});

test('dayWindow ends today (UTC) and fillDays zero-fills without inventing values', () => {
  const window = dayWindow(NOW, 3);
  assert.deepEqual(window, ['2026-09-15', '2026-09-16', '2026-09-17']);
  const rows = fillDays(window, new Map([['2026-09-16', { n: '4' }]]), ['n']);
  assert.deepEqual(rows, [
    { day: '2026-09-15', n: 0 },
    { day: '2026-09-16', n: 4 },
    { day: '2026-09-17', n: 0 },
  ]);
});

/* ---------- Cloudflare ---------- */

const CF_BODY = {
  data: {
    viewer: {
      zones: [
        {
          days: [
            { dimensions: { date: '2026-09-16' }, sum: { requests: 120, pageViews: 80, bytes: 5000 }, uniq: { uniques: 30 } },
            { dimensions: { date: '2026-09-17' }, sum: { requests: 200, pageViews: 150, bytes: 9000 }, uniq: { uniques: 45 } },
          ],
          countries: [
            {
              sum: {
                countryMap: [
                  { clientCountryName: 'IN', requests: 200, bytes: 9000 },
                  { clientCountryName: 'GB', requests: 120, bytes: 5000 },
                ],
              },
            },
          ],
        },
      ],
    },
  },
};

test('cloudflareTraffic: missing secrets name the secret and make no network call', async () => {
  const fetchImpl = fakeFetch([]);
  const a = await cloudflareTraffic({ token: '', zoneTag: 'z', fetchImpl, now });
  assert.deepEqual(a, { connected: false, secret: 'CF_ANALYTICS_TOKEN', reason: 'Not connected — set CF_ANALYTICS_TOKEN.' });
  const b = await cloudflareTraffic({ token: 't', zoneTag: undefined, fetchImpl, now });
  assert.equal(b.secret, 'CF_ZONE_TAG');
  assert.equal(fetchImpl.calls.length, 0);
});

test('cloudflareTraffic: happy path fills the window, sums totals and ranks countries', async () => {
  const fetchImpl = fakeFetch([['api.cloudflare.com/client/v4/graphql', () => json(CF_BODY)]]);
  const out = await cloudflareTraffic({ token: 'cf-token', zoneTag: 'zone1', days: 3, fetchImpl, now });
  assert.equal(out.connected, true);
  assert.equal(out.asOf, NOW);
  assert.equal(out.series.length, 3);
  assert.deepEqual(out.series[0], { day: '2026-09-15', requests: 0, pageViews: 0, bytes: 0, uniques: 0 });
  assert.equal(out.series[2].pageViews, 150);
  assert.deepEqual(out.totals, { requests: 320, pageViews: 230, bytes: 14000, peakUniques: 45 });
  assert.deepEqual(out.countries[0], { country: 'IN', requests: 200, bytes: 9000 });
  const sent = JSON.parse(fetchImpl.calls[0].init.body);
  assert.deepEqual(sent.variables, { zoneTag: 'zone1', since: '2026-09-15', until: '2026-09-17' });
  assert.equal(fetchImpl.calls[0].init.headers.authorization, 'Bearer cf-token');
  assert.ok(!JSON.stringify(out).includes('cf-token'));
});

test('cloudflareTraffic: an upstream 500 and a GraphQL error both become { connected, error }', async () => {
  const boom = await cloudflareTraffic({ token: 't', zoneTag: 'z', fetchImpl: fakeFetch([['graphql', () => json({}, 500)]]), now });
  assert.equal(boom.connected, true);
  assert.equal(boom.error, 'Cloudflare answered 500.');
  assert.equal(boom.series, undefined);
  const refused = await cloudflareTraffic({
    token: 't',
    zoneTag: 'z',
    fetchImpl: fakeFetch([['graphql', () => json({ errors: [{ message: 'zone not found' }] })]]),
    now,
  });
  assert.match(refused.error, /zone not found/);
});

test('cloudflareTraffic: a stalled vendor times out, whether or not it honours the abort', async () => {
  const polite = await cloudflareTraffic({ token: 't', zoneTag: 'z', fetchImpl: stalledFetch(), now, timeoutMs: 20 });
  assert.equal(polite.connected, true);
  assert.match(polite.error, /Timed out/);
  const deaf = await cloudflareTraffic({ token: 't', zoneTag: 'z', fetchImpl: deafFetch(), now, timeoutMs: 20 });
  assert.match(deaf.error, /Timed out/);
});

/* ---------- Google auth ---------- */

test('signServiceAccountJwt produces a verifiable RS256 JWT with the right claims', async () => {
  const jwt = await signServiceAccountJwt({
    clientEmail: 'stats@example.iam.gserviceaccount.com',
    privateKeyPem: PRIVATE_PEM,
    scope: 'scope-x',
    now: NOW,
  });
  const [h, c, s] = jwt.split('.');
  const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  assert.deepEqual(decode(h), { alg: 'RS256', typ: 'JWT' });
  const claims = decode(c);
  assert.equal(claims.iss, 'stats@example.iam.gserviceaccount.com');
  assert.equal(claims.scope, 'scope-x');
  assert.equal(claims.aud, 'https://oauth2.googleapis.com/token');
  assert.equal(claims.iat, Math.floor(NOW / 1000));
  assert.equal(claims.exp, claims.iat + 3600);
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const key = await crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, Buffer.from(s, 'base64url'), Buffer.from(`${h}.${c}`));
  assert.equal(ok, true);
});

/* ---------- Search Console ---------- */

const gscRoutes = (calls = {}) => [
  [
    'oauth2.googleapis.com/token',
    (_url, init) => {
      calls.token = Object.fromEntries(new URLSearchParams(init.body));
      return json({ access_token: 'gsc-access', expires_in: 3600 });
    },
  ],
  [
    'searchAnalytics/query',
    (_url, init) => {
      const body = JSON.parse(init.body);
      calls[body.dimensions[0]] = { body, auth: init.headers.authorization };
      if (body.dimensions[0] === 'date')
        return json({
          rows: [
            { keys: ['2026-09-15'], clicks: 10, impressions: 100, ctr: 0.1, position: 8 },
            { keys: ['2026-09-16'], clicks: 30, impressions: 300, ctr: 0.1, position: 4 },
          ],
        });
      if (body.dimensions[0] === 'query')
        return json({ rows: [{ keys: ['cricket quiz'], clicks: 25, impressions: 200, ctr: 0.125, position: 3.2 }] });
      return json({ rows: [{ keys: ['https://factduel.example/'], clicks: 40, impressions: 400, ctr: 0.1, position: 5 }] });
    },
  ],
];

test('searchConsole: missing secrets name the secret; a malformed key is an error, not a crash', async () => {
  const fetchImpl = fakeFetch([]);
  assert.equal((await searchConsole({ serviceAccountJson: '', siteUrl: 'x', fetchImpl, now })).secret, 'GSC_SERVICE_ACCOUNT_JSON');
  assert.equal((await searchConsole({ serviceAccountJson: '{}', siteUrl: '', fetchImpl, now })).secret, 'GSC_SITE_URL');
  assert.equal(fetchImpl.calls.length, 0);
  const bad = await searchConsole({ serviceAccountJson: 'not json', siteUrl: 'https://x/', fetchImpl, now });
  assert.equal(bad.connected, true);
  assert.match(bad.error, /not valid JSON/);
  const partial = await searchConsole({ serviceAccountJson: '{"client_email":"a"}', siteUrl: 'https://x/', fetchImpl, now });
  assert.match(partial.error, /missing client_email or private_key/);
});

test('searchConsole: happy path exchanges the JWT, runs three queries and weights the totals', async () => {
  const calls = {};
  const fetchImpl = fakeFetch(gscRoutes(calls));
  const out = await searchConsole({ serviceAccountJson: SERVICE_ACCOUNT, siteUrl: 'https://factduel.example/', days: 3, fetchImpl, now });
  assert.equal(out.connected, true);
  assert.equal(calls.token.grant_type, 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  assert.equal(calls.token.assertion.split('.').length, 3);
  assert.equal(calls.date.auth, 'Bearer gsc-access');
  assert.ok(fetchImpl.calls.some((c) => c.url.includes(encodeURIComponent('https://factduel.example/'))));
  assert.deepEqual(calls.query.body, { startDate: '2026-09-15', endDate: '2026-09-17', dimensions: ['query'], rowLimit: STATS.topRows });
  assert.equal(out.series.length, 3);
  assert.deepEqual(out.series[2], { day: '2026-09-17', clicks: 0, impressions: 0, ctr: 0, position: 0 });
  assert.equal(out.totals.clicks, 40);
  assert.equal(out.totals.impressions, 400);
  assert.equal(out.totals.ctr, 0.1);
  assert.equal(out.totals.position, 5); // (8*100 + 4*300) / 400
  assert.equal(out.lastReportedDay, '2026-09-16');
  assert.deepEqual(out.queries, [{ key: 'cricket quiz', clicks: 25, impressions: 200, ctr: 0.125, position: 3.2 }]);
  assert.equal(out.pages[0].key, 'https://factduel.example/');
  assert.ok(!JSON.stringify(out).includes('gsc-access'));
});

test('searchConsole: a failing token exchange, a 500 report and a timeout are all errors', async () => {
  const args = { serviceAccountJson: SERVICE_ACCOUNT, siteUrl: 'https://x/', now };
  const noToken = await searchConsole({ ...args, fetchImpl: fakeFetch([['oauth2', () => json({ error: 'invalid_grant' }, 400)]]) });
  assert.equal(noToken.error, 'Google token endpoint answered 400.');
  const report500 = await searchConsole({
    ...args,
    fetchImpl: fakeFetch([
      ['oauth2', () => json({ access_token: 'a' })],
      ['searchAnalytics', () => json({}, 500)],
    ]),
  });
  assert.equal(report500.error, 'Search Console answered 500.');
  const stalled = await searchConsole({ ...args, fetchImpl: stalledFetch(), timeoutMs: 20 });
  assert.match(stalled.error, /Timed out/);
});

/* ---------- AdSense ---------- */

const ADSENSE_CREDS = { clientId: 'cid', clientSecret: 'csec', refreshToken: 'rtok', account: 'pub-123' };

const adsenseBody = (dimension, rows) => ({
  headers: [
    { name: dimension, type: 'DIMENSION' },
    { name: 'ESTIMATED_EARNINGS', type: 'METRIC_CURRENCY', currencyCode: 'USD' },
    { name: 'PAGE_VIEWS', type: 'METRIC_TALLY' },
    { name: 'IMPRESSIONS', type: 'METRIC_TALLY' },
    { name: 'PAGE_VIEWS_RPM', type: 'METRIC_DECIMAL' },
    { name: 'CLICKS', type: 'METRIC_TALLY' },
  ],
  rows: rows.map((cells) => ({ cells: cells.map((value) => ({ value: String(value) })) })),
});

const adsenseRoutes = (calls = {}) => [
  [
    'oauth2.googleapis.com/token',
    (_url, init) => {
      calls.token = Object.fromEntries(new URLSearchParams(init.body));
      return json({ access_token: 'ads-access' });
    },
  ],
  [
    'reports:generate',
    (url, init) => {
      const u = new URL(url);
      calls[u.searchParams.get('dimensions')] = { url: u, auth: init.headers.authorization };
      if (u.searchParams.get('dimensions') === 'DATE')
        return json(adsenseBody('DATE', [['2026-09-16', '1.50', 1000, 2000, '1.50', 3], ['2026-09-17', '3.00', 1000, 2500, '3.00', 5]]));
      return json(adsenseBody('COUNTRY_CODE', [['IN', '3.00', 1500, 3000, '2.00', 6], ['GB', '1.50', 500, 1500, '3.00', 2]]));
    },
  ],
];

test('adsenseReport: each missing secret is named in order and nothing is fetched', async () => {
  const fetchImpl = fakeFetch([]);
  for (const [key, secret] of [
    ['clientId', 'ADSENSE_CLIENT_ID'],
    ['clientSecret', 'ADSENSE_CLIENT_SECRET'],
    ['refreshToken', 'ADSENSE_REFRESH_TOKEN'],
    ['account', 'ADSENSE_ACCOUNT'],
  ]) {
    const out = await adsenseReport({ ...ADSENSE_CREDS, [key]: '  ', fetchImpl, now });
    assert.deepEqual(out, { connected: false, secret, reason: `Not connected — set ${secret}.` });
  }
  assert.equal(fetchImpl.calls.length, 0);
});

test('adsenseReport: happy path refreshes the token, asks by DATE and COUNTRY_CODE and recomputes RPM', async () => {
  const calls = {};
  const fetchImpl = fakeFetch(adsenseRoutes(calls));
  const out = await adsenseReport({ ...ADSENSE_CREDS, days: 3, fetchImpl, now });
  assert.equal(out.connected, true);
  assert.deepEqual(calls.token, { client_id: 'cid', client_secret: 'csec', refresh_token: 'rtok', grant_type: 'refresh_token' });
  assert.equal(calls.DATE.auth, 'Bearer ads-access');
  assert.ok(calls.DATE.url.pathname.endsWith('/v2/accounts/pub-123/reports:generate'));
  assert.deepEqual(calls.DATE.url.searchParams.getAll('metrics'), ['ESTIMATED_EARNINGS', 'PAGE_VIEWS', 'IMPRESSIONS', 'PAGE_VIEWS_RPM', 'CLICKS']);
  assert.equal(calls.DATE.url.searchParams.get('startDate.year'), '2026');
  assert.equal(calls.DATE.url.searchParams.get('startDate.day'), '15');
  assert.equal(calls.DATE.url.searchParams.get('endDate.day'), '17');
  assert.equal(out.currency, 'USD');
  assert.equal(out.series.length, 3);
  assert.deepEqual(out.series[0], { day: '2026-09-15', earnings: 0, pageViews: 0, impressions: 0, rpm: 0, clicks: 0 });
  assert.equal(out.series[2].earnings, 3);
  assert.equal(out.totals.earnings, 4.5);
  assert.equal(out.totals.pageViews, 2000);
  assert.equal(out.totals.impressions, 4500);
  assert.equal(out.totals.clicks, 8);
  assert.equal(out.totals.rpm, 2.25);
  assert.deepEqual(out.countries[0], { country: 'IN', earnings: 3, pageViews: 1500, impressions: 3000, rpm: 2, clicks: 6 });
  assert.ok(!JSON.stringify(out).includes('ads-access'));
  assert.ok(!JSON.stringify(out).includes('rtok'));
});

test('adsenseReport: an "accounts/" prefix is not doubled', async () => {
  const calls = {};
  await adsenseReport({ ...ADSENSE_CREDS, account: 'accounts/pub-9', fetchImpl: fakeFetch(adsenseRoutes(calls)), now });
  assert.ok(calls.DATE.url.pathname.endsWith('/v2/accounts/pub-9/reports:generate'));
});

test('adsenseReport: a 500 report, a tokenless refresh and a timeout are errors, never numbers', async () => {
  const r500 = await adsenseReport({
    ...ADSENSE_CREDS,
    now,
    fetchImpl: fakeFetch([
      ['oauth2', () => json({ access_token: 'a' })],
      ['reports:generate', () => json({}, 500)],
    ]),
  });
  assert.equal(r500.error, 'AdSense answered 500.');
  assert.equal(r500.totals, undefined);
  const noToken = await adsenseReport({ ...ADSENSE_CREDS, now, fetchImpl: fakeFetch([['oauth2', () => json({})]]) });
  assert.match(noToken.error, /no access token/);
  const stalled = await adsenseReport({ ...ADSENSE_CREDS, now, fetchImpl: stalledFetch(), timeoutMs: 20 });
  assert.match(stalled.error, /Timed out/);
});

/* ---------- the game's own numbers ---------- */

const opened = (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  return db;
};

async function seed(db) {
  const today = NOW;
  const yesterday = NOW - DAY;
  const lastMonth = NOW - 40 * DAY;
  const p = db.prepare('INSERT INTO principals (id, kind, created_at, last_seen_at, promoted_to) VALUES (?,?,?,?,NULL)');
  await p.bind('p1', 'anon', today, today).run();
  await p.bind('p2', 'anon', today, today).run();
  await p.bind('p3', 'anon', yesterday, today).run();
  await p.bind('p4', 'anon', lastMonth, today).run();
  const r = db.prepare('INSERT INTO rooms (id, revision, state, expires_at, created_at) VALUES (?,0,?,?,?)');
  await r.bind('r1', '{}', today + DAY, today).run();
  await r.bind('r2', '{}', today + DAY, yesterday).run();
  const a = db.prepare('INSERT INTO ad_redemptions (nonce_id, principal_id, day_key, amount, at) VALUES (?,?,?,?,?)');
  await a.bind('n1', 'p1', '2026-09-17', 20, today).run();
  await a.bind('n2', 'p2', '2026-09-17', 20, today).run();
  await a.bind('n3', 'p3', '2026-09-16', 15, yesterday).run();
  await a.bind('n4', 'p4', '2026-08-08', 15, lastMonth).run();
  await db
    .prepare('INSERT INTO ledger_accounts (account_id, ledger, kind, owner, flags, balance, entry_seq, opened_at) VALUES (?,?,?,?,0,?,0,?)')
    .bind('play:treasury:mint', 'play', 'treasury', 'mint', -1234, lastMonth)
    .run();
}

test('gameOps: no database is "not connected", named', async () => {
  const out = await gameOps(null, { now });
  assert.equal(out.connected, false);
  assert.equal(out.secret, 'DB');
  assert.match(out.reason, /Not connected/);
});

test('gameOps: counts per UTC day over the window and reads issuance off the treasury', async (t) => {
  const db = opened(t);
  await seed(db);
  await sweep({ store: new D1OpsStore(db), now: NOW - 600_000, clock: () => NOW - 599_000 });
  const out = await gameOps(db, { days: 3, now });
  assert.equal(out.connected, true);
  assert.equal(out.asOf, NOW);
  assert.deepEqual(out.series, [
    { day: '2026-09-15', guests: 0, rooms: 0, ads: 0, coins: 0 },
    { day: '2026-09-16', guests: 1, rooms: 1, ads: 1, coins: 15 },
    { day: '2026-09-17', guests: 2, rooms: 1, ads: 2, coins: 40 },
  ]);
  assert.equal(out.totals.guests, 3);
  assert.equal(out.totals.rooms, 2);
  assert.equal(out.totals.ads, 3);
  assert.equal(out.totals.coins, 55);
  assert.equal(out.totals.principalsAllTime, 4);
  assert.equal(out.totals.roomsLive, 2);
  assert.equal(out.totals.issuedAllTime, 1234);
  assert.equal(out.totals.treasuryOpened, true);
  const byKind = Object.fromEntries(out.heartbeat.runs.map((run) => [run.kind, run]));
  assert.equal(byKind.sweep.ok, true);
  assert.equal(byKind.sweep.ageMs, 600_000);
  assert.equal(byKind.reconcile.everRan, false);
  assert.equal(out.heartbeat.healthy, false);
});

test('gameOps: an empty database reports zeros, no treasury and no heartbeat — honestly', async (t) => {
  const db = opened(t);
  const out = await gameOps(db, { days: 2, now });
  assert.equal(out.connected, true);
  assert.equal(out.totals.issuedAllTime, 0);
  assert.equal(out.totals.treasuryOpened, false);
  assert.ok(out.heartbeat.runs.every((run) => !run.everRan));
});

test('gameOps: a broken database is an error, not a throw', async () => {
  const broken = { prepare: () => ({ bind: () => ({ all: async () => { throw new Error('D1_ERROR'); }, first: async () => { throw new Error('D1_ERROR'); } }), all: async () => { throw new Error('D1_ERROR'); }, first: async () => { throw new Error('D1_ERROR'); } }) };
  const out = await gameOps(broken, { now });
  assert.equal(out.connected, true);
  assert.match(out.error, /Database request failed/);
});

/* ---------- overview ---------- */

test('overview: every source unset gives four named not-connected panels and no numbers', async () => {
  const out = await overview({ env: {}, days: 7, fetchImpl: fakeFetch([]), now });
  assert.equal(out.days, 7);
  assert.equal(out.asOf, NOW);
  assert.equal(out.traffic.secret, 'CF_ANALYTICS_TOKEN');
  assert.equal(out.search.secret, 'GSC_SERVICE_ACCOUNT_JSON');
  assert.equal(out.adsense.secret, 'ADSENSE_CLIENT_ID');
  assert.equal(out.game.secret, 'DB');
  assert.ok(!JSON.stringify(out).includes('"totals"'));
});

/* ---------- the door ---------- */

const TOKEN = 's'.repeat(48);
const request = (body, { token = TOKEN, ...headers } = {}) =>
  new Request('https://duel.example/api/stats', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('an unset OPS_TOKEN refuses every request with 503, even a correct one', async () => {
  for (const env of [{}, { OPS_TOKEN: '' }, { OPS_TOKEN: undefined }]) {
    const response = await handleStatsRequest(request({ action: 'overview' }), env);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'service_unavailable');
  }
});

test('a wrong or missing bearer is 401 and never echoes the configured token', async () => {
  const env = { OPS_TOKEN: TOKEN };
  for (const token of [null, '', 'x', TOKEN.slice(0, -1), `${TOKEN}x`]) {
    const response = await handleStatsRequest(request({ action: 'overview' }, { token }), env);
    assert.equal(response.status, 401, `token ${JSON.stringify(token)}`);
    assert.ok(!(await response.text()).includes(TOKEN));
  }
});

test('the door rejects cross-origin, non-JSON, oversized and unknown-action requests like its siblings', async () => {
  const env = { OPS_TOKEN: TOKEN };
  assert.equal((await handleStatsRequest(request({}, { origin: 'https://other.example' }), env)).status, 403);
  assert.equal((await handleStatsRequest(request('x', { 'content-type': 'text/plain' }), env)).status, 415);
  assert.equal((await handleStatsRequest(request('{nope'), env)).status, 400);
  assert.equal((await handleStatsRequest(request({ pad: 'a'.repeat(5000) }), env)).status, 413);
  const unknown = await handleStatsRequest(request({ action: 'sweep' }), env);
  assert.equal(unknown.status, 400);
  assert.equal((await unknown.json()).code, 'invalid_request');
});

test('a correct token returns the overview envelope with no-store headers', async () => {
  const response = await handleStatsRequest(request({ action: 'overview', days: 3 }), { OPS_TOKEN: TOKEN }, { cache: new Map(), now, fetchImpl: fakeFetch([]) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.days, 3);
  assert.equal(body.traffic.connected, false);
  assert.equal(body.game.connected, false);
});

test('the overview is cached for 60 s per days value, and a failure is not cached', async () => {
  let clock = NOW;
  const tick = () => clock;
  const fetchImpl = fakeFetch([['graphql', () => json(CF_BODY)]]);
  const env = { OPS_TOKEN: TOKEN, CF_ANALYTICS_TOKEN: 't', CF_ZONE_TAG: 'z' };
  const cache = new Map();
  const deps = { cache, now: tick, fetchImpl };
  const call = (days) => handleStatsRequest(request({ action: 'overview', days }), env, deps);
  assert.equal((await call(7)).status, 200);
  assert.equal(fetchImpl.calls.length, 1);
  await call(7);
  await call(7);
  assert.equal(fetchImpl.calls.length, 1, 'reloads inside the TTL cost the vendor nothing');
  await call(30);
  assert.equal(fetchImpl.calls.length, 2, 'a different window is its own entry');
  clock += CACHE_TTL_MS - 1;
  await call(7);
  assert.equal(fetchImpl.calls.length, 2);
  clock += 1;
  const fresh = await (await call(7)).json();
  assert.equal(fetchImpl.calls.length, 3, 'the TTL boundary refetches');
  assert.equal(fresh.asOf, clock);
  // Two overlapping callers share one fan-out.
  clock += CACHE_TTL_MS;
  await Promise.all([call(7), call(7)]);
  assert.equal(fetchImpl.calls.length, 4);
  // A vendor error is a cached *result* (it is a panel state, not a throw); a thrown fan-out is not.
  const throwingCache = new Map();
  let attempts = 0;
  const throwingNow = () => {
    attempts++;
    // The first read stamps the cache entry; the second is inside the fan-out and breaks it.
    if (attempts === 2) throw Object.assign(new Error('clock broke'), { status: 503 });
    return clock;
  };
  const first = await handleStatsRequest(request({ action: 'overview', days: 7 }), env, { cache: throwingCache, now: throwingNow, fetchImpl });
  assert.equal(first.status, 503);
  assert.equal(throwingCache.size, 0, 'a failed fan-out leaves no entry to serve for 60 s');
});
