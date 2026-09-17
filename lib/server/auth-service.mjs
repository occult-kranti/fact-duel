/**
 * Accounts (M4): sessions, email magic links, Google sign-in, and the promotion of a guest
 * principal IN PLACE.
 *
 * The one idea that matters. A guest is a principal the device minted; every coin it earned is a
 * ledger entry on `play:user:<that id>`. Signing in must not move any of it, so promotion is not a
 * re-key: it is an INSERT into `identities` pointing at the SAME principal id, plus `UPDATE
 * principals SET kind = 'named'`, in one batch. The id does not change, so nothing in the ledger,
 * the nonces or the redemptions is touched and nothing can be lost between two writes. This is why
 * identity lives in the same D1 as the money.
 *
 * What is never stored. The session id in the cookie and the token in the magic link are random
 * bearer secrets; only their sha256 is written (`sessions.id_hash`, `magic_links.token_hash`), so a
 * database read never yields a usable cookie or link. Nothing here logs either.
 *
 * Guards are constraints, per `lib/ledger/store-contract.mjs` and `tests/d1-batch-semantics.test.mjs`:
 * a batch rolls back on a statement ERROR and on nothing else. So a magic link is consumed with
 * `DELETE … RETURNING` (zero rows back = invalid, and two racing clicks cannot both get a row),
 * and a racing promotion collides on `identities.id` and is re-read as the known-identity path —
 * never a `WHERE … = ?` UPDATE whose zero-row "failure" would commit the rest of the batch.
 *
 * Merging is deliberately absent. When a known identity signs in on a device that presented a
 * DIFFERENT guest, the session is for the identity's principal and the guest is reported as
 * `abandonedGuest`: there is no cross-principal ledger intent, and a silent auto-merge is where
 * every implementation of this loses somebody's value (`docs/money/architecture-plan.json`, M4).
 */
import { sha256 } from '../ledger/sha256.mjs';
import { GameError, requireValue } from './room-engine.mjs';
import { readPrincipalId } from './wallet-service.mjs';

export const AUTH = Object.freeze({
  sessionTtlMs: 30 * 24 * 3_600_000,
  /** The sliding bump happens at most this often, so a busy session is not a write per request. */
  sessionSlideMs: 3_600_000,
  magicLinkTtlMs: 15 * 60_000,
  magicLinksPerHour: 5,
  cookie: 'fd_session',
  googleJwks: 'https://www.googleapis.com/oauth2/v3/certs',
  googleIssuers: Object.freeze(['accounts.google.com', 'https://accounts.google.com']),
  jwksCacheMs: 24 * 3_600_000,
  /** A kid the cache does not know refetches the set, but not more often than this. */
  jwksRefetchMs: 60_000,
});

const SESSION_ID = /^[A-Za-z0-9_-]{48}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;
const UNAVAILABLE = 'The sign-in service is unavailable.';

const sessionOf = (db) => (typeof db?.withSession === 'function' ? db.withSession('first-primary') : db);

/* ---------- bytes ---------- */

export function base64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function fromBase64url(text) {
  const padded = text.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (text.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
const randomHex = (n) => Array.from(randomBytes(n), (b) => b.toString(16).padStart(2, '0')).join('');

/** 36 random bytes → 48 url-safe characters. */
export const newSessionId = () => base64url(randomBytes(36));
/** 32 random bytes → 43 url-safe characters. */
export const newMagicToken = () => base64url(randomBytes(32));
/** A server-minted principal: `p_` then 32 hex, which `readPrincipalId` accepts. */
export const newPrincipalId = () => `p_${randomHex(16)}`;

/* ---------- sessions ---------- */

/**
 * The lookup every money-shaped ingress passes to `resolvePrincipal`. Slides the expiry on use,
 * at most once an hour. Anything that is not a well-formed, live, unrevoked session is `null`.
 */
export function sessionLookupFor(db, { now = Date.now } = {}) {
  const d = sessionOf(db);
  return async (sessionId) => {
    if (typeof sessionId !== 'string' || !SESSION_ID.test(sessionId)) return null;
    const at = now();
    const hash = sha256(sessionId);
    const row = await d
      .prepare('SELECT principal_id, expires_at, revoked_at, last_seen_at FROM sessions WHERE id_hash = ?')
      .bind(hash)
      .first();
    if (!row || row.revoked_at != null || Number(row.expires_at) <= at) return null;
    if (at - Number(row.last_seen_at) >= AUTH.sessionSlideMs) {
      await d
        .prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id_hash = ? AND revoked_at IS NULL')
        .bind(at, at + AUTH.sessionTtlMs, hash)
        .run();
    }
    return { principalId: row.principal_id };
  };
}

/** Mint a session for a principal. The raw id is returned once, to go into the cookie, and never stored. */
export async function issueSession(db, { principalId, now, newId = newSessionId } = {}) {
  const id = readPrincipalId(principalId);
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  const sessionId = newId();
  const expiresAt = now + AUTH.sessionTtlMs;
  await sessionOf(db)
    .prepare('INSERT INTO sessions (id_hash, principal_id, created_at, expires_at, last_seen_at, revoked_at) VALUES (?,?,?,?,?,NULL)')
    .bind(sha256(sessionId), id, now, expiresAt, now)
    .run();
  return Object.freeze({ sessionId, principalId: id, expiresAt });
}

/** Idempotent: revoking an unknown or already-revoked session is a quiet no-op. */
export async function revokeSession(db, { sessionId, now } = {}) {
  if (typeof sessionId !== 'string' || !SESSION_ID.test(sessionId)) return false;
  const result = await sessionOf(db)
    .prepare('UPDATE sessions SET revoked_at = ? WHERE id_hash = ? AND revoked_at IS NULL')
    .bind(now, sha256(sessionId))
    .run();
  return Number(result?.meta?.changes ?? 0) > 0;
}

/**
 * The cookie. HttpOnly so a script never reads it, SameSite=Lax so the magic-link navigation
 * from a mail client still carries it, Secure everywhere except plain-http localhost.
 */
export function sessionCookie(sessionId, { secure = true } = {}) {
  const maxAge = Math.floor(AUTH.sessionTtlMs / 1000);
  return `${AUTH.cookie}=${sessionId}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie({ secure = true } = {}) {
  return `${AUTH.cookie}=; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=0`;
}

/** Plain http on a loopback host is the one place a Secure cookie would simply never be sent. */
export function isLocalOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname);
  } catch {
    return false;
  }
}

/* ---------- identities and promotion ---------- */

/**
 * What the client may know about who it is. `providers` lists the sign-in methods on the
 * principal; the email shown is the one the person typed or Google verified, never a hash.
 */
export async function whoami(db, { principalId = null, kind = 'anonymous' } = {}) {
  if (!principalId) return Object.freeze({ signedIn: false, principalId: null, email: null, providers: [] });
  const { results } = await sessionOf(db)
    .prepare('SELECT provider, email FROM identities WHERE principal_id = ? ORDER BY created_at ASC')
    .bind(principalId)
    .all();
  const email = results.find((r) => r.email)?.email ?? null;
  return Object.freeze({
    signedIn: kind === 'session',
    principalId,
    email: kind === 'session' ? email : null,
    providers: kind === 'session' ? results.map((r) => r.provider) : [],
  });
}

const isIdentityCollision = (error) => /UNIQUE constraint failed: identities\./.test(String(error?.message ?? ''));

/**
 * The promotion. Three outcomes, none of which moves a coin:
 *  (a) unknown identity, a guest presented → the guest principal becomes this identity, in place;
 *  (b) unknown identity, nobody presented → a fresh server-minted principal, then as (a);
 *  (c) known identity → a session for its principal; a different guest presented is reported, not merged.
 */
export async function signIn(db, { provider, subject, email = null, guestPrincipalId = null, now } = {}) {
  requireValue(provider === 'email' || provider === 'google', 'Unknown sign-in provider.');
  requireValue(typeof subject === 'string' && subject.length > 0 && subject.length <= 254, 'Invalid request.');
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  const d = sessionOf(db);
  const identityId = `${provider}:${subject}`;
  let guest = null;
  try {
    guest = guestPrincipalId ? readPrincipalId(guestPrincipalId) : null;
  } catch {
    guest = null;
  }

  const known = async () => d.prepare('SELECT principal_id FROM identities WHERE id = ?').bind(identityId).first();

  let row = await known();
  let created = false;
  if (!row) {
    const principalId = guest ?? newPrincipalId();
    try {
      await d.batch([
        d
          .prepare('INSERT OR IGNORE INTO principals (id, kind, created_at, last_seen_at, promoted_to) VALUES (?, ?, ?, ?, NULL)')
          .bind(principalId, 'anon', now, now),
        d.prepare("UPDATE principals SET kind = 'named', last_seen_at = ? WHERE id = ?").bind(now, principalId),
        d
          .prepare('INSERT INTO identities (id, principal_id, provider, subject, email, created_at, last_used_at) VALUES (?,?,?,?,?,?,?)')
          .bind(identityId, principalId, provider, subject, email, now, now),
      ]);
      row = { principal_id: principalId };
      created = true;
    } catch (error) {
      if (!isIdentityCollision(error)) throw error;
      // Either a racing sign-in of the same identity landed first (re-read → path c), or this
      // principal already has an identity from this provider and the person is adding a second
      // one under the same provider, which the UNIQUE(principal_id, provider) index refuses.
      row = await known();
      if (!row) throw new GameError('This account already has a sign-in of that kind.', 409, 'conflict');
    }
  }
  const principalId = row.principal_id;
  if (!created) {
    await d.batch([
      d.prepare('UPDATE identities SET last_used_at = ? WHERE id = ?').bind(now, identityId),
      d.prepare('UPDATE principals SET last_seen_at = ? WHERE id = ?').bind(now, principalId),
    ]);
  }
  const session = await issueSession(d, { principalId, now });
  return Object.freeze({
    principalId,
    session,
    created,
    merged: false,
    abandonedGuest: guest && guest !== principalId ? guest : null,
  });
}

/* ---------- the quick profile: a claimed, unverified email ---------- */

/** A display name: 1–24 characters once trimmed, with control characters and runs of space folded. */
export function readDisplayName(value) {
  if (typeof value !== 'string') return null;
  const name = value.replace(/[ -]/g, ' ').replace(/\s+/g, ' ').trim();
  return name.length >= 1 && name.length <= 24 ? name : null;
}

/**
 * The profile gate's claim (roadmap W3). Somebody typed a name and an email on their first landing
 * and nothing about that address has been checked — no password, no link clicked. This function is
 * built so it cannot pretend otherwise:
 *
 *  - the identity's id is `claimed-email:<principalId>`: keyed by the PRINCIPAL, never by the
 *    address. SEVERAL PRINCIPALS MAY CLAIM THE SAME ADDRESS, because anyone can type anyone's
 *    email, and they stay entirely separate — nothing is ever looked up by `subject`, so two
 *    claims of one address can never meet, and no ledger is merged or moved.
 *  - `INSERT OR REPLACE` on that id, so a re-claim from the same principal simply updates the
 *    address (the sub-select carries `created_at` over). The row can only ever name this principal,
 *    and the `UNIQUE(principal_id, provider)` index points at the very same row, so there is
 *    nothing for a racing claim to collide with.
 *  - the principal is TOUCHED, not promoted: it stays `kind = 'anon'` (the same two statements
 *    `D1WalletStore.touchPrincipal` runs, batched here with the identity write). Promotion to
 *    'named' is what `signIn` does once Google or a magic link has PROVED the address; the upgrade
 *    path from here is Settings → "Verify by link", which is exactly that.
 *
 * A session is issued so profile sync turns on for this device, which is the whole and honest
 * benefit of the claim: a name, a card that syncs, and an address to send the link to later.
 */
export async function quickProfile(db, { principalId, email, name, now } = {}) {
  const id = readPrincipalId(principalId);
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  const subject = normaliseEmail(email);
  requireValue(subject, 'Enter an email address that works.');
  const display = readDisplayName(name);
  requireValue(display, 'Enter a name, up to 24 characters.');
  const d = sessionOf(db);
  const identityId = `claimed-email:${id}`;
  await d.batch([
    d
      .prepare('INSERT OR IGNORE INTO principals (id, kind, created_at, last_seen_at, promoted_to) VALUES (?, ?, ?, ?, NULL)')
      .bind(id, 'anon', now, now),
    d.prepare('UPDATE principals SET last_seen_at = ? WHERE id = ?').bind(now, id),
    d
      .prepare(
        'INSERT OR REPLACE INTO identities (id, principal_id, provider, subject, email, created_at, last_used_at)' +
          ' VALUES (?,?,?,?,?, COALESCE((SELECT created_at FROM identities WHERE id = ?), ?), ?)',
      )
      .bind(identityId, id, 'claimed-email', subject, subject, identityId, now, now),
  ]);
  const session = await issueSession(d, { principalId: id, now });
  return Object.freeze({ principalId: id, email: subject, name: display, session });
}

/* ---------- email magic links ---------- */

export function normaliseEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

/**
 * Ask for a link. The result is for the caller's logs, never the response: the ingress answers
 * `{ ok: true }` whatever happened, so nobody learns which addresses exist or are rate-limited.
 */
export async function requestMagicLink(db, mailer, { email, principalHint = null, origin, now, newToken = newMagicToken } = {}) {
  requireValue(mailer && typeof mailer.send === 'function', UNAVAILABLE, 503, 'service_unavailable');
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  requireValue(typeof origin === 'string' && /^https?:\/\/[^/]+$/.test(origin), 'Invalid request.');
  const to = normaliseEmail(email);
  if (!to) return Object.freeze({ ok: false, reason: 'invalid_email' });
  let hint = null;
  try {
    hint = principalHint ? readPrincipalId(principalHint) : null;
  } catch {
    hint = null;
  }
  const d = sessionOf(db);
  const recent = await d
    .prepare('SELECT COUNT(*) AS n FROM magic_links WHERE email = ? AND created_at > ?')
    .bind(to, now - 3_600_000)
    .first();
  if (Number(recent?.n ?? 0) >= AUTH.magicLinksPerHour) return Object.freeze({ ok: false, reason: 'rate_limited' });

  const token = newToken();
  const expiresAt = now + AUTH.magicLinkTtlMs;
  await d
    .prepare('INSERT INTO magic_links (token_hash, email, principal_hint, created_at, expires_at, consumed_at) VALUES (?,?,?,?,?,NULL)')
    .bind(sha256(token), to, hint, now, expiresAt)
    .run();
  const link = `${origin}/api/auth?token=${token}`;
  await mailer.send({
    to,
    subject: 'Your Jaanta Hai Kya sign-in link',
    text: `Open this link to sign in. It works once and stops working in 15 minutes.\n\n${link}\n\nIf you did not ask for it, ignore this message.`,
    html: `<p>Open this link to sign in. It works once and stops working in 15 minutes.</p><p><a href="${link}">Sign in to Jaanta Hai Kya</a></p><p>If you did not ask for it, ignore this message.</p>`,
  });
  return Object.freeze({ ok: true, email: to, expiresAt });
}

/**
 * Click the link. Single use by construction: the row is deleted and returned in one statement,
 * so a second click, or a racing one, gets nothing back. The device that asked is the one that is
 * promoted (`principal_hint`); the principal presented on the click is the fallback.
 */
export async function consumeMagicLink(db, { token, now, guestPrincipalId = null } = {}) {
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  if (typeof token !== 'string' || !TOKEN.test(token)) return Object.freeze({ ok: false, reason: 'invalid_token' });
  const { results } = await sessionOf(db)
    .prepare('DELETE FROM magic_links WHERE token_hash = ? AND expires_at > ? RETURNING email, principal_hint')
    .bind(sha256(token), now)
    .all();
  const row = results?.[0];
  if (!row) return Object.freeze({ ok: false, reason: 'invalid_token' });
  const signedIn = await signIn(db, {
    provider: 'email',
    subject: row.email,
    email: row.email,
    guestPrincipalId: row.principal_hint ?? guestPrincipalId,
    now,
  });
  return Object.freeze({ ok: true, email: row.email, ...signedIn });
}

/* ---------- Google ---------- */

/**
 * A JWKS cache keyed by kid. One per process by default; tests hand in their own so a fake key
 * set never leaks between cases. `fetchImpl` is injectable for the same reason.
 */
export function createKeyCache() {
  return { keys: new Map(), fetchedAt: 0 };
}
const googleKeys = createKeyCache();

async function keyFor(kid, { fetchImpl, cache, now }) {
  const stale = now - cache.fetchedAt >= AUTH.jwksCacheMs;
  const mayRefetch = now - cache.fetchedAt >= AUTH.jwksRefetchMs;
  if ((stale || !cache.keys.has(kid)) && (stale || mayRefetch)) {
    const res = await fetchImpl(AUTH.googleJwks, { cache: 'no-store' });
    if (!res?.ok) throw new GameError(UNAVAILABLE, 503, 'service_unavailable');
    const body = await res.json();
    const fresh = new Map();
    for (const jwk of Array.isArray(body?.keys) ? body.keys : []) {
      if (jwk?.kty === 'RSA' && typeof jwk.kid === 'string') fresh.set(jwk.kid, jwk);
    }
    cache.keys = fresh;
    cache.fetchedAt = now;
  }
  return cache.keys.get(kid) ?? null;
}

const decodeJson = (part) => {
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64url(part)));
  } catch {
    return null;
  }
};

/**
 * Verify a Google ID token: RS256 against Google's published keys, then the claims that make it
 * OUR token for THIS person — issuer, audience (the client id), not expired, verified email.
 * Returns the claims or throws a 401; never distinguishes why in the message.
 */
export async function verifyGoogleIdToken(idToken, { clientId, fetchImpl = globalThis.fetch, cache = googleKeys, now = Date.now() } = {}) {
  requireValue(typeof clientId === 'string' && clientId.length > 0, UNAVAILABLE, 503, 'service_unavailable');
  const reject = () => new GameError('Google sign-in was not accepted.', 401, 'unauthorized');
  if (typeof idToken !== 'string' || idToken.length > 4096) throw reject();
  const parts = idToken.split('.');
  if (parts.length !== 3) throw reject();
  const header = decodeJson(parts[0]);
  const claims = decodeJson(parts[1]);
  if (!header || !claims || header.alg !== 'RS256' || typeof header.kid !== 'string') throw reject();
  const jwk = await keyFor(header.kid, { fetchImpl, cache, now });
  if (!jwk) throw reject();
  let ok = false;
  try {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      fromBase64url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    ok = false;
  }
  if (!ok) throw reject();
  if (!AUTH.googleIssuers.includes(claims.iss)) throw reject();
  if (claims.aud !== clientId) throw reject();
  if (!Number.isFinite(Number(claims.exp)) || Number(claims.exp) * 1000 <= now) throw reject();
  if (typeof claims.sub !== 'string' || !claims.sub) throw reject();
  if (claims.email_verified !== true && claims.email_verified !== 'true') throw reject();
  const email = normaliseEmail(claims.email);
  if (!email) throw reject();
  return Object.freeze({ sub: claims.sub, email });
}

export async function signInWithGoogle(db, { idToken, guestPrincipalId = null, now } = {}, { clientId, fetchImpl, cache } = {}) {
  const claims = await verifyGoogleIdToken(idToken, { clientId, fetchImpl, cache, now });
  return signIn(db, { provider: 'google', subject: claims.sub, email: claims.email, guestPrincipalId, now });
}

/* ---------- housekeeping ---------- */

/** For the sweep: dead links and dead sessions are noise. Bounded, like every other cleanup. */
export async function cleanupAuth(db, { now } = {}) {
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  const d = sessionOf(db);
  await d.batch([
    d.prepare('DELETE FROM magic_links WHERE token_hash IN (SELECT token_hash FROM magic_links WHERE expires_at < ? LIMIT 200)').bind(now),
    d
      .prepare(
        'DELETE FROM sessions WHERE id_hash IN (SELECT id_hash FROM sessions WHERE expires_at < ? OR revoked_at IS NOT NULL AND revoked_at < ? LIMIT 200)',
      )
      .bind(now, now - 24 * 3_600_000),
  ]);
}

export { GameError };
