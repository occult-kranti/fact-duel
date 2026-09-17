/**
 * lib/server/http-auth.mjs — the accounts ingress.
 *
 * Same edge as `http-wallet.mjs`: same headers, same cross-origin refusal, same 4 KiB cap, same
 * `{ error, code }` envelope, same 503 on anything unexpected. Two doors on top of it:
 *
 *   POST /api/auth  { action: 'whoami' | 'request-link' | 'google' | 'signout', ... }
 *   GET  /api/auth?token=…   the click on a magic link: consume, set the cookie, redirect home.
 *
 * Who is asking is `resolvePrincipal`'s answer — the session cookie first, the guest header
 * second — and that principal is the one a sign-in promotes, so a guest keeps every coin.
 *
 * `request-link` is always `{ ok: true }`. An address that is not one, an address past its hourly
 * budget and an address that was mailed a link all get the same answer, so the endpoint cannot be
 * used to learn who plays here. The real outcome exists only in the service's return value.
 *
 * Google sign-in without a `GOOGLE_CLIENT_ID` is a 503 for that action alone: the rest of the door
 * stays open, and the UI never shows a Google button it cannot back.
 */
import {
  AUTH,
  GameError,
  clearSessionCookie,
  consumeMagicLink,
  isLocalOrigin,
  requestMagicLink,
  revokeSession,
  sessionCookie,
  sessionLookupFor,
  signInWithGoogle,
  whoami,
} from './auth-service.mjs';
import { mailerFor } from './mailer.mjs';
import { readCookies, resolvePrincipal } from './principal.mjs';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
const MAX_BODY = 4096;
const UNAVAILABLE = 'The sign-in service is unavailable.';
const fail = (error, status, code) => new Response(JSON.stringify({ error, code }), { status, headers });
const ok = (body, cookie = null) => {
  const h = new Headers(headers);
  if (cookie) h.append('set-cookie', cookie);
  return new Response(JSON.stringify(body), { headers: h });
};

/** Where links point and where the click lands: the configured app origin, else this request's. */
function appOrigin(request, env) {
  const configured = typeof env?.APP_ORIGIN === 'string' ? env.APP_ORIGIN.trim().replace(/\/+$/, '') : '';
  return /^https?:\/\/[^/]+$/.test(configured) ? configured : new URL(request.url).origin;
}

async function readBody(request) {
  const reader = request.body?.getReader();
  let raw = '',
    size = 0;
  const decoder = new TextDecoder();
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        break;
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  }
  return { raw, size };
}

export async function handleAuthRequest(request, env, { now = Date.now, fetchImpl, mailer, keyCache } = {}) {
  try {
    if (request.method === 'GET') return await handleLink(request, env, { now });
    if (request.method !== 'POST') return fail('Method not allowed.', 405, 'invalid_request');
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin)
      return fail('Cross-origin requests are not allowed.', 403, 'forbidden');
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return fail('JSON request required.', 415, 'invalid_request');
    const { raw, size } = await readBody(request);
    if (size > MAX_BODY) return fail('Request too large.', 413, 'invalid_request');
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail('Invalid JSON.', 400, 'invalid_request');
    }
    if (!env?.DB) return fail(UNAVAILABLE, 503, 'service_unavailable');
    const db = env.DB;
    const at = now();
    const secure = !isLocalOrigin(new URL(request.url).origin);
    const who = await resolvePrincipal(request, { sessionLookup: sessionLookupFor(db, { now }) });
    const action = body?.action;

    if (action === 'whoami') return ok(await whoami(db, who));

    if (action === 'request-link') {
      // The outcome is deliberately not in the response; see the header comment.
      await requestMagicLink(db, mailer ?? mailerFor(env, { fetchImpl }), {
        email: body?.email,
        principalHint: who.principalId,
        origin: appOrigin(request, env),
        now: at,
      });
      return ok({ ok: true });
    }

    if (action === 'google') {
      if (typeof env?.GOOGLE_CLIENT_ID !== 'string' || !env.GOOGLE_CLIENT_ID.trim())
        return fail('Google sign-in is not set up on this deployment.', 503, 'service_unavailable');
      const result = await signInWithGoogle(
        db,
        { idToken: body?.idToken, guestPrincipalId: who.principalId, now: at },
        { clientId: env.GOOGLE_CLIENT_ID.trim(), fetchImpl, cache: keyCache },
      );
      return ok(
        { ok: true, principalId: result.principalId, merged: result.merged, abandonedGuest: result.abandonedGuest },
        sessionCookie(result.session.sessionId, { secure }),
      );
    }

    if (action === 'signout') {
      const cookie = readCookies(request).get(AUTH.cookie);
      if (cookie) await revokeSession(db, { sessionId: cookie, now: at });
      return ok({ ok: true }, clearSessionCookie({ secure }));
    }

    return fail('Unknown action.', 400, 'invalid_request');
  } catch (error) {
    if (error instanceof GameError) return fail(error.message, error.status ?? 400, error.code ?? 'invalid_request');
    return fail(UNAVAILABLE, 503, 'service_unavailable');
  }
}

/** The click. A bad or spent link lands on the same page with `signed-in=0`, never on an error body. */
async function handleLink(request, env, { now }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return fail('Unknown action.', 400, 'invalid_request');
  if (!env?.DB) return fail(UNAVAILABLE, 503, 'service_unavailable');
  const home = appOrigin(request, env);
  const secure = !isLocalOrigin(url.origin);
  const who = await resolvePrincipal(request, { sessionLookup: sessionLookupFor(env.DB, { now }) });
  const result = await consumeMagicLink(env.DB, { token, now: now(), guestPrincipalId: who.principalId });
  const h = new Headers({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
  if (!result.ok) {
    h.set('location', `${home}/?signed-in=0`);
    return new Response(null, { status: 302, headers: h });
  }
  h.set('location', `${home}/?signed-in=1`);
  h.append('set-cookie', sessionCookie(result.session.sessionId, { secure }));
  return new Response(null, { status: 302, headers: h });
}
