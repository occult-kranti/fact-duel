/**
 * lib/duel-client.ts — the browser's side of `/api/duel` (lib/server/http-handler.mjs).
 *
 * Every request presents the guest principal this device minted (`anon_` + 32 hex, kept in
 * localStorage 'fd-principal' — the key the wallet and auth clients share) as the `x-fd-principal`
 * header, and sends the session cookie when one exists so a signed-in principal wins on the
 * server (`resolvePrincipal`). That is what lets a room entry be staked on the player's real coin
 * balance: the server refuses an entry for coins from a request with no principal at all.
 */
const PRINCIPAL_KEY = 'fd-principal';
const PRINCIPAL = /^[a-z]{1,8}_[A-Za-z0-9_-]{16,58}$/;

/** The guest id this device presents; minted once, null only when storage is unavailable. */
export function principalId(): string | null {
  try {
    const existing = localStorage.getItem(PRINCIPAL_KEY);
    if (existing && PRINCIPAL.test(existing)) return existing;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const minted = 'anon_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(PRINCIPAL_KEY, minted);
    return minted;
  } catch {
    return null;
  }
}

/** Where the client points a player whose coins do not cover the entry. */
export const COINS_CARD_HINT = 'The coins card in the top bar shows how to earn more.';

/** The `{ error, code }` envelope every non-2xx answer carries (lib/server/http-handler.mjs). */
type Envelope = { error?: string; code?: string } & Record<string, unknown>;
/** What every caller in app/ catches: a message, the service's code and the HTTP status. */
export type DuelClientError = Error & { code?: string; status?: number };

// The answer is the service's own projection (lib/server/room-engine.mjs `projection`), which the
// screens read as-is; typing it here would only duplicate that shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function request(body: Record<string, unknown>): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const who = principalId();
    const res = await fetch('/api/duel', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(who ? { 'x-fd-principal': who } : {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'include',
    });
    const data = (await res.json()) as Envelope;
    if (!res.ok) {
      const message = data.error || 'Connection interrupted. Try again.';
      const error: DuelClientError = new Error(
        data.code === 'insufficient_coins' ? `${message} ${COINS_CARD_HINT}` : message,
      );
      error.code = data.code;
      error.status = res.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
