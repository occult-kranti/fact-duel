/**
 * Accounts (M4). The claim under test is the one that matters to a player: signing in never moves
 * a coin, because a guest is promoted in place. Around it: the session is a bearer whose raw id
 * the database never holds, a magic link works exactly once and only for 15 minutes, a Google
 * token is accepted only when Google's key, our client id and the clock all agree, and the
 * ingress leaks nothing about who has asked for a link.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { LocalD1 } from './d1-local.mjs';
import {
  AUTH,
  base64url,
  cleanupAuth,
  consumeMagicLink,
  createKeyCache,
  issueSession,
  newPrincipalId,
  normaliseEmail,
  quickProfile,
  readDisplayName,
  requestMagicLink,
  revokeSession,
  sessionCookie,
  sessionLookupFor,
  signIn,
  signInWithGoogle,
  verifyGoogleIdToken,
  whoami,
} from '../lib/server/auth-service.mjs';
import { NullMailer, mailerFor, HttpMailer } from '../lib/server/mailer.mjs';
import { handleAuthRequest } from '../lib/server/http-auth.mjs';
import { resolvePrincipal } from '../lib/server/principal.mjs';
import { D1LedgerStore } from '../lib/server/ledger-store-d1.mjs';
import { grant } from '../lib/ledger/intents.mjs';
import { userAccount } from '../lib/ledger/accounts.mjs';
import { sha256 } from '../lib/ledger/sha256.mjs';

const T0 = Date.parse('2026-09-16T10:00:00Z');
const HOUR = 3_600_000;
const GUEST = 'anon_0123456789abcdef0123456789abcdef';
const OTHER = 'anon_fedcba9876543210fedcba9876543210';
const ORIGIN = 'https://duel.example';

const opened = (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  return db;
};
const count = async (db, sql, ...args) => Number((await db.prepare(sql).bind(...args).first()).n);
const linkFrom = (mailer) => {
  const m = mailer.last.text.match(/https?:\/\/\S+/);
  assert.ok(m, 'the mail carries a link');
  return new URL(m[0]);
};
const tokenFrom = (mailer) => linkFrom(mailer).searchParams.get('token');

/* ---------- sessions ---------- */

test('a session is issued, looked up, slides once an hour, expires and can be revoked; the DB never holds the raw id', async (t) => {
  const db = opened(t);
  const { sessionId, expiresAt } = await issueSession(db, { principalId: GUEST, now: T0 });
  assert.match(sessionId, /^[A-Za-z0-9_-]{48}$/);
  assert.equal(expiresAt, T0 + AUTH.sessionTtlMs);

  const row = await db.prepare('SELECT id_hash, principal_id, expires_at FROM sessions').first();
  assert.equal(row.id_hash, sha256(sessionId));
  assert.notEqual(row.id_hash, sessionId);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM sessions WHERE id_hash = ?', sessionId), 0, 'the raw id is not a key');

  let clock = T0 + 1000;
  const lookup = sessionLookupFor(db, { now: () => clock });
  assert.deepEqual(await lookup(sessionId), { principalId: GUEST });
  assert.equal(await lookup('x'.repeat(48)), null, 'a wrong id of the right shape');
  assert.equal(await lookup('short'), null);
  assert.equal(await lookup(null), null);
  assert.equal(Number((await db.prepare('SELECT expires_at FROM sessions').first()).expires_at), expiresAt, 'no bump within the hour');

  clock = T0 + HOUR + 5;
  assert.deepEqual(await lookup(sessionId), { principalId: GUEST });
  const slid = Number((await db.prepare('SELECT expires_at FROM sessions').first()).expires_at);
  assert.equal(slid, clock + AUTH.sessionTtlMs, 'sliding expiry after an hour of use');

  clock = slid + 1;
  assert.equal(await lookup(sessionId), null, 'expired');

  clock = slid - HOUR;
  assert.deepEqual(await lookup(sessionId), { principalId: GUEST });
  assert.equal(await revokeSession(db, { sessionId, now: clock }), true);
  assert.equal(await revokeSession(db, { sessionId, now: clock }), false, 'revoking twice is a quiet no-op');
  assert.equal(await lookup(sessionId), null, 'revoked');
});

test('the cookie is HttpOnly, SameSite=Lax, Path=/, 30 days, Secure except on plain-http localhost', () => {
  const c = sessionCookie('a'.repeat(48));
  assert.equal(c, `fd_session=${'a'.repeat(48)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
  assert.doesNotMatch(sessionCookie('a'.repeat(48), { secure: false }), /Secure/);
});

test('resolvePrincipal prefers a live session over the guest header and ignores a dead one', async (t) => {
  const db = opened(t);
  const { sessionId } = await issueSession(db, { principalId: OTHER, now: T0 });
  const lookup = sessionLookupFor(db, { now: () => T0 + 1 });
  const req = (cookie) =>
    new Request(ORIGIN + '/api/wallet', { headers: { cookie: `fd_session=${cookie}; other=1`, 'x-fd-principal': GUEST } });
  assert.deepEqual(await resolvePrincipal(req(sessionId), { sessionLookup: lookup }), { principalId: OTHER, kind: 'session' });
  await revokeSession(db, { sessionId, now: T0 + 2 });
  assert.deepEqual(await resolvePrincipal(req(sessionId), { sessionLookup: lookup }), { principalId: GUEST, kind: 'guest' });
});

/* ---------- magic links ---------- */

test('a magic link signs in once: the second click, and an expired one, are refused', async (t) => {
  const db = opened(t);
  const mailer = new NullMailer();
  const asked = await requestMagicLink(db, mailer, { email: 'Pat@Example.com ', principalHint: GUEST, origin: ORIGIN, now: T0 });
  assert.equal(asked.ok, true);
  assert.equal(asked.email, 'pat@example.com', 'normalised');
  assert.equal(mailer.last.to, 'pat@example.com');
  const link = linkFrom(mailer);
  assert.equal(link.origin + link.pathname, ORIGIN + '/api/auth');
  const token = link.searchParams.get('token');
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  const stored = await db.prepare('SELECT token_hash, email, principal_hint FROM magic_links').first();
  assert.equal(stored.token_hash, sha256(token), 'only the hash is stored');
  assert.equal(stored.principal_hint, GUEST);

  const first = await consumeMagicLink(db, { token, now: T0 + 60_000 });
  assert.equal(first.ok, true);
  assert.equal(first.principalId, GUEST, 'the device that asked is the one promoted');
  assert.equal(first.email, 'pat@example.com');
  assert.equal(first.created, true);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM magic_links'), 0, 'consumed by deletion');

  const second = await consumeMagicLink(db, { token, now: T0 + 61_000 });
  assert.deepEqual(second, { ok: false, reason: 'invalid_token' });

  await requestMagicLink(db, mailer, { email: 'late@example.com', origin: ORIGIN, now: T0 });
  const late = await consumeMagicLink(db, { token: tokenFrom(mailer), now: T0 + AUTH.magicLinkTtlMs + 1 });
  assert.deepEqual(late, { ok: false, reason: 'invalid_token' });
  assert.deepEqual(await consumeMagicLink(db, { token: 'nope', now: T0 }), { ok: false, reason: 'invalid_token' });
  assert.deepEqual(await consumeMagicLink(db, { token: 'A'.repeat(43), now: T0 }), { ok: false, reason: 'invalid_token' });
});

test('five links an hour per address, counted on the normalised address; the sixth is not sent', async (t) => {
  const db = opened(t);
  const mailer = new NullMailer();
  for (let i = 0; i < 5; i++) {
    const r = await requestMagicLink(db, mailer, { email: i % 2 ? 'SAME@x.io' : 'same@x.io', origin: ORIGIN, now: T0 + i * 60_000 });
    assert.equal(r.ok, true);
  }
  assert.equal(mailer.sent, 5);
  const sixth = await requestMagicLink(db, mailer, { email: 'same@x.io', origin: ORIGIN, now: T0 + 6 * 60_000 });
  assert.deepEqual(sixth, { ok: false, reason: 'rate_limited' });
  assert.equal(mailer.sent, 5);
  const later = await requestMagicLink(db, mailer, { email: 'same@x.io', origin: ORIGIN, now: T0 + HOUR + 1 });
  assert.equal(later.ok, true, 'the window slides');
  const other = await requestMagicLink(db, mailer, { email: 'other@x.io', origin: ORIGIN, now: T0 + 6 * 60_000 });
  assert.equal(other.ok, true, 'another address has its own budget');
});

test('email normalisation', () => {
  assert.equal(normaliseEmail('  A.B@Example.COM '), 'a.b@example.com');
  assert.equal(normaliseEmail('no-at'), null);
  assert.equal(normaliseEmail('a@b'), null);
  assert.equal(normaliseEmail('a b@c.d'), null);
  assert.equal(normaliseEmail(42), null);
  assert.equal(normaliseEmail('x'.repeat(300) + '@a.b'), null);
});

test('a bad address or a broken mailer never records a link; a mailer is required', async (t) => {
  const db = opened(t);
  const mailer = new NullMailer();
  assert.deepEqual(await requestMagicLink(db, mailer, { email: 'nope', origin: ORIGIN, now: T0 }), { ok: false, reason: 'invalid_email' });
  assert.equal(mailer.sent, 0);
  await assert.rejects(requestMagicLink(db, null, { email: 'a@b.co', origin: ORIGIN, now: T0 }), { status: 503 });
  await assert.rejects(requestMagicLink(db, mailer, { email: 'a@b.co', origin: 'javascript:alert(1)', now: T0 }), { status: 400 });
});

/* ---------- promotion ---------- */

const balance = async (db, who) => (await new D1LedgerStore(db).balances([userAccount('play', who)])).get(userAccount('play', who)) ?? 0;

test('(a) a guest with coins signs in and keeps every coin: the id does not change', async (t) => {
  const db = opened(t);
  const ledger = new D1LedgerStore(db);
  await ledger.post(grant({ principalId: GUEST, amount: 120, opKey: 'grant:test:1', at: T0, reason: 'earned as a guest' }));
  await db.prepare('INSERT INTO principals (id, kind, created_at, last_seen_at, promoted_to) VALUES (?, ?, ?, ?, NULL)').bind(GUEST, 'anon', T0, T0).run();
  assert.equal(await balance(db, GUEST), 120);

  const result = await signIn(db, { provider: 'email', subject: 'pat@example.com', email: 'pat@example.com', guestPrincipalId: GUEST, now: T0 + 1 });
  assert.equal(result.principalId, GUEST);
  assert.equal(result.created, true);
  assert.equal(result.merged, false);
  assert.equal(result.abandonedGuest, null);
  assert.equal(await balance(db, GUEST), 120, 'nothing moved');
  assert.equal((await db.prepare('SELECT kind FROM principals WHERE id = ?').bind(GUEST).first()).kind, 'named');
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM principals'), 1, 'no second principal');
  const identity = await db.prepare('SELECT id, principal_id, provider, subject, email FROM identities').first();
  assert.deepEqual({ ...identity }, { id: 'email:pat@example.com', principal_id: GUEST, provider: 'email', subject: 'pat@example.com', email: 'pat@example.com' });
  assert.deepEqual(await whoami(db, { principalId: GUEST, kind: 'session' }), {
    signedIn: true,
    principalId: GUEST,
    email: 'pat@example.com',
    providers: ['email'],
  });
  assert.deepEqual(await whoami(db, { principalId: GUEST, kind: 'guest' }), { signedIn: false, principalId: GUEST, email: null, providers: [] });
});

test('(a) also holds when the guest never touched the server before', async (t) => {
  const db = opened(t);
  const result = await signIn(db, { provider: 'email', subject: 'new@example.com', email: 'new@example.com', guestPrincipalId: GUEST, now: T0 });
  assert.equal(result.principalId, GUEST);
  assert.equal((await db.prepare('SELECT kind FROM principals WHERE id = ?').bind(GUEST).first()).kind, 'named');
});

test('(b) no guest presented mints a server principal and names it', async (t) => {
  const db = opened(t);
  const result = await signIn(db, { provider: 'email', subject: 'solo@example.com', email: 'solo@example.com', now: T0 });
  assert.match(result.principalId, /^p_[0-9a-f]{32}$/);
  assert.equal(result.created, true);
  const row = await db.prepare('SELECT kind FROM principals WHERE id = ?').bind(result.principalId).first();
  assert.equal(row.kind, 'named');
  const garbage = await signIn(db, { provider: 'email', subject: 'junk@example.com', email: 'junk@example.com', guestPrincipalId: 'not a principal', now: T0 });
  assert.match(garbage.principalId, /^p_[0-9a-f]{32}$/, 'a malformed guest id is treated as none');
  assert.match(newPrincipalId(), /^p_[0-9a-f]{32}$/);
});

test('(c) a known identity signs in to its own principal; a different guest is reported, never merged', async (t) => {
  const db = opened(t);
  const ledger = new D1LedgerStore(db);
  const first = await signIn(db, { provider: 'email', subject: 'pat@example.com', email: 'pat@example.com', guestPrincipalId: GUEST, now: T0 });
  await ledger.post(grant({ principalId: OTHER, amount: 40, opKey: 'grant:test:other', at: T0 + 1, reason: 'a second device' }));

  const again = await signIn(db, { provider: 'email', subject: 'pat@example.com', email: 'pat@example.com', guestPrincipalId: OTHER, now: T0 + 2 });
  assert.equal(again.principalId, GUEST);
  assert.equal(again.created, false);
  assert.equal(again.merged, false);
  assert.equal(again.abandonedGuest, OTHER);
  assert.equal(await balance(db, OTHER), 40, 'the abandoned guest keeps its own coins');
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities'), 1);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM sessions'), 2, 'two sessions, one principal');
  assert.notEqual(again.session.sessionId, first.session.sessionId);
  const used = await db.prepare('SELECT last_used_at FROM identities').first();
  assert.equal(Number(used.last_used_at), T0 + 2);

  const same = await signIn(db, { provider: 'email', subject: 'pat@example.com', email: 'pat@example.com', guestPrincipalId: GUEST, now: T0 + 3 });
  assert.equal(same.abandonedGuest, null, 'the same device presenting its own id abandons nothing');
});

test('a second provider links to the same principal; a second identity of the same provider is refused by the constraint', async (t) => {
  const db = opened(t);
  await signIn(db, { provider: 'email', subject: 'pat@example.com', email: 'pat@example.com', guestPrincipalId: GUEST, now: T0 });
  const linked = await signIn(db, { provider: 'google', subject: '1234567890', email: 'pat@gmail.com', guestPrincipalId: GUEST, now: T0 + 1 });
  assert.equal(linked.principalId, GUEST);
  assert.deepEqual((await whoami(db, { principalId: GUEST, kind: 'session' })).providers, ['email', 'google']);
  await assert.rejects(
    signIn(db, { provider: 'email', subject: 'second@example.com', email: 'second@example.com', guestPrincipalId: GUEST, now: T0 + 2 }),
    { status: 409, code: 'conflict' },
  );
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities'), 2);
  await assert.rejects(signIn(db, { provider: 'facebook', subject: 'x', now: T0 }), { status: 400 });
});

test('two racing sign-ins of a new identity: one creates, the other lands on the same principal', async (t) => {
  const db = opened(t);
  const args = { provider: 'email', subject: 'race@example.com', email: 'race@example.com', now: T0 };
  const [a, b] = await Promise.all([signIn(db, { ...args, guestPrincipalId: GUEST }), signIn(db, { ...args, guestPrincipalId: OTHER })]);
  assert.equal(a.principalId, b.principalId);
  assert.equal([a, b].filter((r) => r.created).length, 1);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities'), 1);
});

/* ---------- Google ---------- */

const CLIENT_ID = '123-test.apps.googleusercontent.com';

async function googleKeys() {
  const pair = await webcrypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const jwk = await webcrypto.subtle.exportKey('jwk', pair.publicKey);
  const kid = 'kid-' + Math.random().toString(36).slice(2, 10);
  const publicJwk = { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', use: 'sig', kid };
  let fetches = 0;
  const fetchImpl = async () => {
    fetches += 1;
    return new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const sign = async (claims, { key = pair.privateKey, header = { alg: 'RS256', kid, typ: 'JWT' } } = {}) => {
    const enc = new TextEncoder();
    const h = base64url(enc.encode(JSON.stringify(header)));
    const p = base64url(enc.encode(JSON.stringify(claims)));
    const sig = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(`${h}.${p}`));
    return `${h}.${p}.${base64url(new Uint8Array(sig))}`;
  };
  return { sign, fetchImpl, fetches: () => fetches, kid, privateKey: pair.privateKey };
}

const claimsFor = (over = {}) => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  sub: '10769150350006150715113082367',
  email: 'Pat@Gmail.com',
  email_verified: true,
  iat: Math.floor(T0 / 1000),
  exp: Math.floor(T0 / 1000) + 3600,
  ...over,
});

test('Google: a token signed by the published key for our client id signs the guest in, and the key set is cached', async (t) => {
  const db = opened(t);
  const g = await googleKeys();
  const cache = createKeyCache();
  const token = await g.sign(claimsFor());
  const result = await signInWithGoogle(db, { idToken: token, guestPrincipalId: GUEST, now: T0 + 1000 }, { clientId: CLIENT_ID, fetchImpl: g.fetchImpl, cache });
  assert.equal(result.principalId, GUEST);
  assert.equal(result.created, true);
  const identity = await db.prepare('SELECT id, provider, subject, email FROM identities').first();
  assert.deepEqual({ ...identity }, { id: 'google:10769150350006150715113082367', provider: 'google', subject: '10769150350006150715113082367', email: 'pat@gmail.com' });
  assert.equal(g.fetches(), 1);
  await signInWithGoogle(db, { idToken: token, guestPrincipalId: GUEST, now: T0 + 2000 }, { clientId: CLIENT_ID, fetchImpl: g.fetchImpl, cache });
  assert.equal(g.fetches(), 1, 'the JWKS is served from the cache');
  await verifyGoogleIdToken(await g.sign(claimsFor({ exp: Math.floor(T0 / 1000) + 30 * 3600 })), { clientId: CLIENT_ID, fetchImpl: g.fetchImpl, cache, now: T0 + 25 * HOUR });
  assert.equal(g.fetches(), 2, 'after 24 hours the set is fetched again');
  const okIss = await verifyGoogleIdToken(await g.sign(claimsFor({ iss: 'accounts.google.com', email_verified: 'true' })), { clientId: CLIENT_ID, fetchImpl: g.fetchImpl, cache, now: T0 });
  assert.deepEqual(okIss, { sub: '10769150350006150715113082367', email: 'pat@gmail.com' });
});

test('Google: wrong audience, expired, bad signature, unknown key, wrong issuer, unverified email are all 401', async (t) => {
  const db = opened(t);
  const g = await googleKeys();
  const other = await googleKeys();
  const cache = createKeyCache();
  const opts = { clientId: CLIENT_ID, fetchImpl: g.fetchImpl, cache };
  const refused = async (idToken, why) =>
    assert.rejects(signInWithGoogle(db, { idToken, guestPrincipalId: GUEST, now: T0 }, opts), { status: 401, code: 'unauthorized' }, why);

  await refused(await g.sign(claimsFor({ aud: 'someone-else.apps.googleusercontent.com' })), 'wrong aud');
  await refused(await g.sign(claimsFor({ exp: Math.floor(T0 / 1000) - 1 })), 'expired');
  await refused(await g.sign(claimsFor(), { key: other.privateKey, header: { alg: 'RS256', kid: g.kid } }), 'signed by another key under our kid');
  await refused(await other.sign(claimsFor()), 'unknown kid');
  await refused(await g.sign(claimsFor({ iss: 'https://evil.example' })), 'wrong issuer');
  await refused(await g.sign(claimsFor({ email_verified: false })), 'unverified email');
  await refused(await g.sign(claimsFor(), { header: { alg: 'none', kid: g.kid } }), 'alg none');
  const good = await g.sign(claimsFor());
  await refused(good.slice(0, -4) + 'AAAA', 'tampered signature');
  await refused('not.a.jwt', 'garbage');
  await refused(null, 'nothing');
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities'), 0);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM sessions'), 0);

  await assert.rejects(signInWithGoogle(db, { idToken: good, now: T0 }, { fetchImpl: g.fetchImpl, cache }), { status: 503 }, 'no client id');
  const down = async () => new Response('nope', { status: 500 });
  await assert.rejects(signInWithGoogle(db, { idToken: good, now: T0 }, { clientId: CLIENT_ID, fetchImpl: down, cache: createKeyCache() }), { status: 503 }, 'JWKS unreachable');
});

/* ---------- the mailer ---------- */

test('mailerFor: HTTP sender when configured, NullMailer otherwise; the HTTP sender posts the Resend shape', async () => {
  assert.ok(mailerFor({}) instanceof NullMailer);
  assert.ok(mailerFor({ MAIL_API_KEY: 'k' }) instanceof NullMailer, 'a key without a sender is not configured');
  let seen = null;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 });
  };
  const mailer = mailerFor({ MAIL_API_KEY: 'key_123', MAIL_FROM: 'FACT//DUEL <hello@duel.example>' }, { fetchImpl });
  assert.ok(mailer instanceof HttpMailer);
  assert.deepEqual(await mailer.send({ to: 'pat@example.com', subject: 's', text: 't', html: '<p>t</p>' }), { ok: true, id: 'msg_1' });
  assert.equal(seen.url, 'https://api.resend.com/emails');
  assert.equal(seen.init.headers.authorization, 'Bearer key_123');
  assert.deepEqual(JSON.parse(seen.init.body), { from: 'FACT//DUEL <hello@duel.example>', to: ['pat@example.com'], subject: 's', text: 't', html: '<p>t</p>' });
  const failing = new HttpMailer({ apiKey: 'k', from: 'f', fetchImpl: async () => new Response('', { status: 429 }) });
  await assert.rejects(failing.send({ to: 'a@b.co', subject: 's', text: 't' }), { status: 503 });
});

/* ---------- the quick profile (the gate's claim) ---------- */

test('quick-profile claims an address without verifying it: one identity per principal, a session, and never a link between two', async (t) => {
  const db = opened(t);
  const first = await quickProfile(db, { principalId: GUEST, email: ' Pat@Example.com ', name: '  Pat  ', now: T0 });
  assert.equal(first.principalId, GUEST);
  assert.equal(first.email, 'pat@example.com', 'normalised');
  assert.equal(first.name, 'Pat', 'trimmed');
  assert.match(first.session.sessionId, /^[A-Za-z0-9_-]{48}$/);

  const row = await db.prepare('SELECT * FROM identities WHERE principal_id = ?').bind(GUEST).first();
  assert.equal(row.id, `claimed-email:${GUEST}`, 'keyed by the principal, never by the address');
  assert.equal(row.provider, 'claimed-email');
  assert.equal(row.subject, 'pat@example.com');
  assert.equal(row.email, 'pat@example.com');
  assert.equal(Number(row.created_at), T0);
  const principal = await db.prepare('SELECT kind, last_seen_at FROM principals WHERE id = ?').bind(GUEST).first();
  assert.equal(principal.kind, 'anon', 'touched, not promoted: nothing has been proved');
  assert.equal(Number(principal.last_seen_at), T0);

  // Idempotent per principal: a re-claim moves the address on the SAME row and adds no second one.
  const again = await quickProfile(db, { principalId: GUEST, email: 'sam@example.com', name: 'Sam', now: T0 + HOUR });
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities WHERE principal_id = ?', GUEST), 1);
  const updated = await db.prepare('SELECT subject, email, created_at, last_used_at FROM identities WHERE id = ?').bind(`claimed-email:${GUEST}`).first();
  assert.equal(updated.subject, 'sam@example.com');
  assert.equal(updated.email, 'sam@example.com');
  assert.equal(Number(updated.created_at), T0, 'the first claim is when this identity began');
  assert.equal(Number(updated.last_used_at), T0 + HOUR);
  assert.notEqual(again.session.sessionId, first.session.sessionId, 'each claim mints its own session');

  // The same address from ANOTHER principal. Nothing is looked up by subject, so nothing merges.
  const other = await quickProfile(db, { principalId: OTHER, email: 'SAM@example.com', name: 'Sam too', now: T0 + 2 * HOUR });
  assert.equal(other.principalId, OTHER);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities WHERE subject = ?', 'sam@example.com'), 2);
  const owners = (await db.prepare('SELECT principal_id FROM identities WHERE subject = ? ORDER BY principal_id').bind('sam@example.com').all()).results;
  assert.deepEqual(owners.map((r) => r.principal_id), [GUEST, OTHER], 'two principals, two ledgers, one typed address');
  const lookup = sessionLookupFor(db, { now: () => T0 + 2 * HOUR + 1 });
  assert.deepEqual(await lookup(again.session.sessionId), { principalId: GUEST });
  assert.deepEqual(await lookup(other.session.sessionId), { principalId: OTHER }, 'each session stays on its own principal');

  assert.deepEqual(await whoami(db, { principalId: GUEST, kind: 'session' }), {
    signedIn: true,
    principalId: GUEST,
    email: 'sam@example.com',
    providers: ['claimed-email'],
  });
});

test('quick-profile refuses what it cannot use, and writes nothing when it refuses', async (t) => {
  const db = opened(t);
  const refused = (patch, why) =>
    assert.rejects(
      () => quickProfile(db, { principalId: GUEST, email: 'pat@example.com', name: 'Pat', now: T0, ...patch }),
      (error) => error?.status === 400 && typeof error.message === 'string' && error.message.length > 0,
      why,
    );
  await refused({ email: 'not an address' }, 'no @');
  await refused({ email: 'pat@example' }, 'no dot');
  await refused({ email: '' }, 'empty');
  await refused({ email: 42 }, 'not a string');
  await refused({ email: `${'x'.repeat(250)}@example.com` }, 'absurd length');
  await refused({ name: '   ' }, 'blank once trimmed');
  await refused({ name: 'x'.repeat(25) }, 'past 24 characters');
  await refused({ name: 7 }, 'not a string');
  await refused({ principalId: 'nope' }, 'not a principal id');
  await refused({ now: 0 }, 'no clock');
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities'), 0);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM sessions'), 0);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM principals'), 0);

  const edge = await quickProfile(db, { principalId: GUEST, email: 'pat@example.com', name: ` ${'x'.repeat(24)} `, now: T0 });
  assert.equal(edge.name, 'x'.repeat(24), 'exactly 24 characters is a name');
  assert.equal(readDisplayName('Pat  the\tGreat'), 'Pat the Great', 'runs of space fold');
  assert.equal(readDisplayName('x'.repeat(25)), null);
  assert.equal(readDisplayName(null), null);
  assert.equal(readDisplayName(''), null);
});

/* ---------- the route ---------- */

const post = (body, { env, headers = {}, url = ORIGIN + '/api/auth' } = {}) =>
  handleAuthRequest(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env,
    { now: () => T0 + 5 },
  );
const cookieOf = (res) => res.headers.get('set-cookie');
const sessionIdOf = (res) => cookieOf(res).match(/^fd_session=([^;]*)/)[1];

test('route: whoami for a guest, a sign-in link, the click, whoami for the session, signout', async (t) => {
  const db = opened(t);
  const mailer = new NullMailer();
  const env = { DB: db };
  const opts = { env, headers: { 'x-fd-principal': GUEST } };

  const guest = await post({ action: 'whoami' }, opts);
  assert.equal(guest.status, 200);
  assert.deepEqual(await guest.json(), { signedIn: false, principalId: GUEST, email: null, providers: [] });
  assert.equal(guest.headers.get('cache-control'), 'no-store');

  const asked = await handleAuthRequest(
    new Request(ORIGIN + '/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-fd-principal': GUEST },
      body: JSON.stringify({ action: 'request-link', email: 'pat@example.com' }),
    }),
    env,
    { now: () => T0, mailer },
  );
  assert.deepEqual(await asked.json(), { ok: true });
  assert.equal(cookieOf(asked), null, 'asking sets no cookie');
  const link = linkFrom(mailer);
  assert.equal(link.origin, ORIGIN, 'the link points at the request origin when APP_ORIGIN is unset');

  const clicked = await handleAuthRequest(new Request(link.toString(), { method: 'GET' }), env, { now: () => T0 + 1000 });
  assert.equal(clicked.status, 302);
  assert.equal(clicked.headers.get('location'), ORIGIN + '/?signed-in=1');
  const cookie = cookieOf(clicked);
  assert.match(cookie, /^fd_session=[A-Za-z0-9_-]{48}; HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=2592000$/);
  assert.equal(await clicked.text(), '', 'no body carries anything');
  const sessionId = sessionIdOf(clicked);

  const twice = await handleAuthRequest(new Request(link.toString(), { method: 'GET' }), env, { now: () => T0 + 1001 });
  assert.equal(twice.status, 302);
  assert.equal(twice.headers.get('location'), ORIGIN + '/?signed-in=0');
  assert.equal(cookieOf(twice), null, 'a spent link sets nothing');

  const me = await post({ action: 'whoami' }, { env, headers: { cookie: `fd_session=${sessionId}`, 'x-fd-principal': OTHER } });
  assert.deepEqual(await me.json(), { signedIn: true, principalId: GUEST, email: 'pat@example.com', providers: ['email'] });

  const out = await post({ action: 'signout' }, { env, headers: { cookie: `fd_session=${sessionId}` } });
  assert.deepEqual(await out.json(), { ok: true });
  assert.equal(cookieOf(out), 'fd_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  const after = await post({ action: 'whoami' }, { env, headers: { cookie: `fd_session=${sessionId}` } });
  assert.deepEqual(await after.json(), { signedIn: false, principalId: null, email: null, providers: [] });
  const outAgain = await post({ action: 'signout' }, { env });
  assert.equal(outAgain.status, 200, 'signing out with no session is fine');
});

test('route: request-link answers the same to a bad address, a good one and a rate-limited one', async (t) => {
  const db = opened(t);
  const mailer = new NullMailer();
  const env = { DB: db };
  const ask = (email, at = T0) =>
    handleAuthRequest(
      new Request(ORIGIN + '/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ action: 'request-link', email }),
      }),
      env,
      { now: () => at, mailer },
    );
  const bodies = [];
  bodies.push(await (await ask('not an address')).text());
  bodies.push(await (await ask(42)).text());
  for (let i = 0; i < 5; i++) bodies.push(await (await ask('busy@example.com', T0 + i)).text());
  bodies.push(await (await ask('busy@example.com', T0 + 10)).text());
  assert.equal(new Set(bodies).size, 1, 'one answer for every case');
  assert.equal(bodies[0], '{"ok":true}');
  assert.equal(mailer.sent, 5);
});

test('route: the Google action is 503 without a client id, 401 on a bad token, a cookie on a good one; on localhost the cookie is not Secure', async (t) => {
  const db = opened(t);
  const g = await googleKeys();
  const keyCache = createKeyCache();
  const call = (env, idToken, url = ORIGIN + '/api/auth', origin = ORIGIN) =>
    handleAuthRequest(
      new Request(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin, 'x-fd-principal': GUEST },
        body: JSON.stringify({ action: 'google', idToken }),
      }),
      env,
      { now: () => T0 + 5, fetchImpl: g.fetchImpl, keyCache },
    );
  const token = await g.sign(claimsFor());
  const unset = await call({ DB: db }, token);
  assert.equal(unset.status, 503);
  assert.equal((await unset.json()).code, 'service_unavailable');
  const bad = await call({ DB: db, GOOGLE_CLIENT_ID: CLIENT_ID }, await g.sign(claimsFor({ aud: 'x' })));
  assert.equal(bad.status, 401);
  assert.equal(cookieOf(bad), null);
  const good = await call({ DB: db, GOOGLE_CLIENT_ID: CLIENT_ID }, token);
  assert.equal(good.status, 200);
  assert.deepEqual(await good.json(), { ok: true, principalId: GUEST, merged: false, abandonedGuest: null });
  assert.match(cookieOf(good), /^fd_session=[A-Za-z0-9_-]{48}; HttpOnly; Secure; SameSite=Lax/);
  const local = await call({ DB: db, GOOGLE_CLIENT_ID: CLIENT_ID }, token, 'http://localhost:5173/api/auth', 'http://localhost:5173');
  assert.equal(local.status, 200);
  assert.doesNotMatch(cookieOf(local), /Secure/);
});

test('route: cross-origin 403, non-JSON 415, oversized 413, bad JSON 400, unknown action 400, no DB 503, other methods 405', async (t) => {
  const db = opened(t);
  const env = { DB: db };
  assert.equal((await post({ action: 'whoami' }, { env, headers: { origin: 'https://evil.example' } })).status, 403);
  const notJson = await handleAuthRequest(new Request(ORIGIN + '/api/auth', { method: 'POST', body: 'x' }), env);
  assert.equal(notJson.status, 415);
  assert.equal((await post({ pad: 'x'.repeat(5000) }, { env })).status, 413);
  assert.equal((await post('{nope', { env })).status, 400);
  assert.equal((await post({ action: 'teleport' }, { env })).status, 400);
  const noDb = await post({ action: 'whoami' }, { env: {} });
  assert.equal(noDb.status, 503);
  assert.deepEqual(await noDb.json(), { error: 'The sign-in service is unavailable.', code: 'service_unavailable' });
  const noDbLink = await handleAuthRequest(new Request(ORIGIN + '/api/auth?token=' + 'a'.repeat(43)), {});
  assert.equal(noDbLink.status, 503);
  const noToken = await handleAuthRequest(new Request(ORIGIN + '/api/auth'), env);
  assert.equal(noToken.status, 400);
  assert.equal((await handleAuthRequest(new Request(ORIGIN + '/api/auth', { method: 'DELETE' }), env)).status, 405);
  const broken = await post({ action: 'whoami' }, { env: { DB: { prepare: () => { throw new Error('boom'); } } }, headers: { cookie: 'fd_session=' + 'a'.repeat(48) } });
  assert.equal(broken.status, 503, 'the unexpected is a 503, never a stack');
});

test('route: APP_ORIGIN wins for the link and the redirect', async (t) => {
  const db = opened(t);
  const mailer = new NullMailer();
  const env = { DB: db, APP_ORIGIN: 'https://play.example/' };
  await handleAuthRequest(
    new Request('https://api.example/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://api.example' },
      body: JSON.stringify({ action: 'request-link', email: 'pat@example.com' }),
    }),
    env,
    { now: () => T0, mailer },
  );
  const link = linkFrom(mailer);
  assert.equal(link.origin, 'https://play.example');
  const clicked = await handleAuthRequest(new Request(link.toString()), env, { now: () => T0 + 1 });
  assert.equal(clicked.headers.get('location'), 'https://play.example/?signed-in=1');
});

test('route: quick-profile sets the cookie, answers the normalised address, and whoami then says claimed-email', async (t) => {
  const db = opened(t);
  const env = { DB: db };
  const claim = await post({ action: 'quick-profile', name: ' Pat ', email: 'PAT@example.com' }, { env, headers: { 'x-fd-principal': GUEST } });
  assert.equal(claim.status, 200);
  assert.deepEqual(await claim.json(), { ok: true, principalId: GUEST, email: 'pat@example.com' });
  assert.match(cookieOf(claim), /^fd_session=[A-Za-z0-9_-]{48}; HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=2592000$/);
  const sessionId = sessionIdOf(claim);

  const me = await post({ action: 'whoami' }, { env, headers: { cookie: `fd_session=${sessionId}` } });
  assert.deepEqual(await me.json(), { signedIn: true, principalId: GUEST, email: 'pat@example.com', providers: ['claimed-email'] });

  const junk = await post({ action: 'quick-profile', name: '', email: 'pat@example.com' }, { env, headers: { 'x-fd-principal': GUEST } });
  assert.equal(junk.status, 400);
  assert.equal((await junk.json()).code, 'invalid_request');
  assert.equal(cookieOf(junk), null, 'a refusal sets nothing');

  // A first landing can arrive before the wallet minted a guest id; the door mints one instead of
  // refusing, and the new principal is the one behind the cookie.
  const fresh = await post({ action: 'quick-profile', name: 'Sam', email: 'sam@example.com' }, { env });
  assert.equal(fresh.status, 200);
  const minted = (await fresh.json()).principalId;
  assert.match(minted, /^p_[0-9a-f]{32}$/);
  assert.notEqual(minted, GUEST);
  assert.deepEqual(await sessionLookupFor(db, { now: () => T0 + 6 })(sessionIdOf(fresh)), { principalId: minted });
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM identities WHERE principal_id = ?', minted), 1);
});

/* ---------- housekeeping ---------- */

test('cleanupAuth drops expired links and dead sessions, keeps live ones', async (t) => {
  const db = opened(t);
  const mailer = new NullMailer();
  await requestMagicLink(db, mailer, { email: 'a@example.com', origin: ORIGIN, now: T0 });
  await requestMagicLink(db, mailer, { email: 'b@example.com', origin: ORIGIN, now: T0 + 10 * 60_000 });
  const live = await issueSession(db, { principalId: GUEST, now: T0 });
  const dead = await issueSession(db, { principalId: OTHER, now: T0 - AUTH.sessionTtlMs - 1 });
  await cleanupAuth(db, { now: T0 + AUTH.magicLinkTtlMs + 1 });
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM magic_links'), 1);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM sessions WHERE id_hash = ?', sha256(live.sessionId)), 1);
  assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM sessions WHERE id_hash = ?', sha256(dead.sessionId)), 0);
});
