/**
 * lib/auth-client.ts — the browser's side of `/api/auth`.
 *
 * Four calls, one transport. Every request carries the session cookie (`credentials: 'include'`)
 * and the guest id this device minted (header `x-fd-principal`, read from localStorage
 * `fd-principal` — the key the wallet client owns), so the server knows which guest to promote in
 * place when a sign-in lands. Nothing else about the device is sent.
 *
 * The static build has no server. There `/api/auth` is a 404 page, an HTML body or a network
 * error, and every helper here resolves to a plain "not available" value rather than throwing —
 * the account panel turns that into honest copy. The one exception is `signInWithGoogle`, which
 * throws with the server's reason so the panel can show it.
 */

export const PRINCIPAL_KEY = 'fd-principal';
export const AUTH_CHANGED_EVENT = 'fd-auth-change';

export type Whoami =
  | { available: true; signedIn: boolean; principalId: string | null; email: string | null; providers: string[] }
  | { available: false };

export type GoogleSignIn = { ok: true; principalId: string; merged: boolean; abandonedGuest: string | null };

type Envelope = { status: number; body: Record<string, unknown> | null };

/** The guest id the wallet client keeps; absent until the wallet has minted one. */
export function readGuestPrincipal(): string | null {
  try {
    const value = window.localStorage.getItem(PRINCIPAL_KEY);
    return typeof value === 'string' && /^[a-z]{1,8}_[A-Za-z0-9_-]{16,58}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

async function post(body: Record<string, unknown>, timeoutMs = 8000): Promise<Envelope> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const guest = readGuestPrincipal();
    if (guest) headers['x-fd-principal'] = guest;
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.headers.get('content-type')?.includes('application/json')) return { status: res.status, body: null };
    const data = (await res.json()) as unknown;
    return { status: res.status, body: data && typeof data === 'object' ? (data as Record<string, unknown>) : null };
  } catch {
    return { status: 0, body: null };
  } finally {
    clearTimeout(timeout);
  }
}

const announce = () => {
  try {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  } catch {
    /* a page without CustomEvent has nothing listening either */
  }
};

/** Who this browser is to the server, or `{ available: false }` when there is no server. */
export async function whoami(): Promise<Whoami> {
  const { status, body } = await post({ action: 'whoami' });
  if (status !== 200 || !body || typeof body.signedIn !== 'boolean') return { available: false };
  return {
    available: true,
    signedIn: body.signedIn,
    principalId: typeof body.principalId === 'string' ? body.principalId : null,
    email: typeof body.email === 'string' ? body.email : null,
    providers: Array.isArray(body.providers) ? body.providers.filter((p): p is string => typeof p === 'string') : [],
  };
}

/**
 * Ask for a sign-in link. The server answers the same whatever it did with the address, so `true`
 * means "the request reached a server that accepted it", nothing more.
 */
export async function requestMagicLink(email: string): Promise<boolean> {
  const { status, body } = await post({ action: 'request-link', email });
  return status === 200 && body?.ok === true;
}

/** Hand the server a Google ID token. Throws with the server's message when it is refused. */
export async function signInWithGoogle(idToken: string): Promise<GoogleSignIn> {
  const { status, body } = await post({ action: 'google', idToken });
  if (status === 200 && body?.ok === true && typeof body.principalId === 'string') {
    announce();
    return {
      ok: true,
      principalId: body.principalId,
      merged: body.merged === true,
      abandonedGuest: typeof body.abandonedGuest === 'string' ? body.abandonedGuest : null,
    };
  }
  const error = new Error(typeof body?.error === 'string' ? body.error : 'Google sign-in did not go through.') as Error & {
    status: number;
    code: string;
  };
  error.status = status;
  error.code = typeof body?.code === 'string' ? body.code : 'unavailable';
  throw error;
}

/** Revoke the session behind the cookie and clear it. Quiet when there is nothing to sign out of. */
export async function signOut(): Promise<boolean> {
  const { status, body } = await post({ action: 'signout' });
  const ok = status === 200 && body?.ok === true;
  if (ok) announce();
  return ok;
}
