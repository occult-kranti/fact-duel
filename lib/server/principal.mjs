/**
 * Who is asking. One function every ingress calls, so "who" has one definition.
 *
 * There are two answers. A session cookie (`auth-service.mjs`, stored only as its sha256) names a
 * principal that has signed in; a guest header names the id the device minted (`wallet-service.mjs` validates
 * its shape). The session wins when both are present. Neither is proof of anything beyond "this
 * request presented this id" — a guest id is a bearer token by design (a stolen one can spend that
 * guest's coins and nothing else), and a session is a bearer token with a server-side row behind it.
 *
 * `resolvePrincipal` never throws for an absent identity: a request with neither is anonymous and
 * the caller decides whether that is allowed for the action at hand.
 */
import { readPrincipalId } from './wallet-service.mjs';

export const GUEST_HEADER = 'x-fd-principal';
export const SESSION_COOKIE = 'fd_session';

/** The cookie jar as a map; tolerant of junk. */
export function readCookies(request) {
  const out = new Map();
  const raw = request?.headers?.get?.('cookie') ?? '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    out.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return out;
}

/**
 * @param {Request} request
 * @param {{ sessionLookup?: (sessionId: string) => Promise<{principalId: string}|null> }} [deps]
 *   `sessionLookup` is `sessionLookupFor(db)` from auth-service; without it only the guest path runs.
 * @returns {Promise<{ principalId: string|null, kind: 'session'|'guest'|'anonymous' }>}
 */
export async function resolvePrincipal(request, { sessionLookup = null } = {}) {
  const cookie = readCookies(request).get(SESSION_COOKIE);
  if (cookie && sessionLookup) {
    const session = await sessionLookup(cookie);
    if (session?.principalId) return { principalId: session.principalId, kind: 'session' };
  }
  const guest = request?.headers?.get?.(GUEST_HEADER);
  if (guest) {
    try {
      return { principalId: readPrincipalId(guest), kind: 'guest' };
    } catch {
      return { principalId: null, kind: 'anonymous' };
    }
  }
  return { principalId: null, kind: 'anonymous' };
}
