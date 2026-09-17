/**
 * lib/wallet-client-static.ts — the wallet client of the server-free (static) build.
 *
 * `vite.config.static.ts` aliases `@/lib/wallet-client` to this file, the way it swaps the duel
 * transport for `lib/duel-client-static.ts`. There is no `/api/wallet` on a static host, so this
 * twin never fetches anything: `probe()` resolves null, which keeps `useWallet` in device mode
 * (the IndexedDB wallet, lib/wallet-store.mjs), and the nonce calls refuse with `offline_build`
 * — a reason the hook never has to put into words, because it never issues one in device mode.
 *
 * The guest principal is still minted, under the same key and in the same shape, so a device that
 * later meets a server (or the auth client) presents the id it already had.
 */
import type {
  IssueReply,
  KeyStorage,
  PendingNonce,
  RedeemReply,
  ServerWallet,
  WalletClient,
  WalletClientOptions,
} from './wallet-client';

export type {
  IssueReply,
  KeyStorage,
  PendingNonce,
  RedeemReply,
  ServerWallet,
  WalletClient,
  WalletClientOptions,
  WalletMode,
  WalletPlacement,
} from './wallet-client';

export const WALLET_ENDPOINT = '/api/wallet';
export const PRINCIPAL_KEY = 'fd-principal';
export const PENDING_NONCE_KEY = 'fd-pending-nonce';
export const GUEST_HEADER = 'x-fd-principal';
export const PRINCIPAL_SHAPE = /^[a-z]{1,8}_[A-Za-z0-9_-]{16,58}$/;
export const PROBE_TIMEOUT_MS = 0;
export const REDEEM_ATTEMPTS = 0;
export const REDEEM_BACKOFF_MS: readonly number[] = Object.freeze([]);

function browserStorage(): KeyStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function hex(bytes: number): string {
  const out = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(out);
  else for (let i = 0; i < out.length; i += 1) out[i] = Math.floor(Math.random() * 256);
  return Array.from(out, (b) => b.toString(16).padStart(2, '0')).join('');
}

let memoryPrincipal: string | null = null;

/** Same minting as lib/wallet-client.ts: `anon_` + 32 hex, once, under 'fd-principal'. */
export function principalId(storage: KeyStorage | null = browserStorage()): string {
  let stored: string | null = null;
  try {
    stored = storage?.getItem(PRINCIPAL_KEY) ?? null;
  } catch {
    stored = null;
  }
  if (typeof stored === 'string' && PRINCIPAL_SHAPE.test(stored)) return stored;
  if (!memoryPrincipal) memoryPrincipal = `anon_${hex(16)}`;
  try {
    storage?.setItem(PRINCIPAL_KEY, memoryPrincipal);
  } catch {
    /* storage refused; the in-memory id serves this page */
  }
  return memoryPrincipal;
}

/** No storage is read: nothing in this build can leave a nonce pending. */
export function readPendingNonce(): PendingNonce | null {
  return null;
}

const OFFLINE: Readonly<{ ok: false; reason: string }> = Object.freeze({ ok: false, reason: 'offline_build' });

export function createWalletClient({ storage = browserStorage() }: WalletClientOptions = {}): WalletClient {
  return Object.freeze({
    principalId: principalId(storage),
    serverCapable: false,
    probe: async (): Promise<ServerWallet | null> => null,
    readWallet: async (): Promise<ServerWallet | null> => null,
    issueNonce: async (): Promise<IssueReply> => OFFLINE,
    redeemNonce: async (): Promise<RedeemReply> => OFFLINE,
    pending: (): PendingNonce | null => null,
    settlePending: async (): Promise<RedeemReply | null> => null,
  });
}
