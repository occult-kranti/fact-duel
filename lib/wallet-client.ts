/**
 * lib/wallet-client.ts — the browser's side of `/api/wallet` (lib/server/http-wallet.mjs).
 *
 * WHAT IT IS. A guest principal and three calls. The principal is an id this device mints once
 * (`anon_` + 32 hex, kept in localStorage 'fd-principal' — the key the auth and duel clients share)
 * and presents on every request twice: as the `x-fd-principal` header, which `resolvePrincipal`
 * reads, and in the body as `principalId`, which the wallet service validates. `credentials:
 * 'include'` rides along so that once a session cookie exists the server lets it win. The three
 * calls are the contract in wallet-service.mjs: `wallet` (balance and today's ad count),
 * `issue-nonce {placement}` before the ad, `redeem-nonce {nonceId, placement}` after it.
 *
 * WHAT IT DECIDES. Only whether a server wallet exists: `probe()` resolves the server's wallet on a
 * 200 with the right shape and `null` on anything else — a 404 HTML page from a static host, a 503
 * from a worker with no database, a network error, a malformed body. The hook (app/use-wallet.ts)
 * turns that into 'server' or 'device' mode; nothing here reads the DOM, the clock or the ad SDK,
 * and everything injectable (fetch, storage, sleep, the clock) is, so a node test can script it.
 *
 * THE ONE HARD CASE. A nonce was issued and the ad played, but `redeem-nonce` cannot reach the
 * server. The reward is owed — the server already agreed to it — so the nonce id is written to
 * localStorage 'fd-pending-nonce' BEFORE the first attempt, the redeem is retried three times with
 * a backoff, and if every attempt fails the caller gets `reason: 'pending'` and the id stays put
 * for `settlePending()` on the next mount. The server side is idempotent (one payout per nonce,
 * a `replayed: true` reply is "already paid, here is the balance"), so a retry can never pay twice,
 * and a crash between the server's two writes is healed by the retry itself (wallet-service.mjs).
 *
 * The static build swaps this module for lib/wallet-client-static.ts, which has no server at all.
 */

export type WalletMode = 'device' | 'server';
export type WalletPlacement = 'coins' | 'practice-entry' | 'duel-entry' | 'continue';

/** The `wallet` reply, as the hook consumes it. */
export type ServerWallet = Readonly<{
  principalId: string;
  coins: number;
  adsToday: number;
  adDailyCap: number;
  dayKey: string;
  /** The edge's word for where the player is, and what one ad pays there. Absent on older servers. */
  region?: string;
  perAd?: number;
  /** When the current floor window ends. Absent on older servers. */
  floorNextAt?: number;
}>;

/** The reply to a grant or an entry: the balance after, and why nothing moved when it did not. */
export type ServerOutcome = Readonly<{
  ok: boolean;
  reason?: string;
  granted?: number;
  spent?: number;
  replayed?: boolean;
  coins: number;
  nextAt?: number;
}>;

export type IssueReply =
  | Readonly<{
      ok: true;
      nonce: Readonly<{ id: string; placement: string; expiresAt: number; minMs: number }>;
      reward: number;
      region: string;
      ttlMs: number;
    }>
  | Readonly<{ ok: false; reason: string; retryAt?: number; adsToday?: number; adDailyCap?: number }>;

export type RedeemReply =
  | Readonly<{ ok: true; granted: number; replayed: boolean; adId: string; coins: number }>
  /** 'pending' is this module's word: every attempt failed to reach the server; the nonce is kept. */
  | Readonly<{ ok: false; reason: string }>;

export type PendingNonce = Readonly<{ nonceId: string; placement: WalletPlacement; at: number }>;

/** The subset of Storage this module touches; localStorage by default, a Map-backed fake in tests. */
export type KeyStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type WalletClient = Readonly<{
  /** The guest id this device presents. Stable across calls and reloads. */
  principalId: string;
  /** False only in the static build's twin: there is no server to probe. */
  serverCapable: boolean;
  /** The server wallet, or null when no server wallet answers (device mode). Never rejects. */
  probe(): Promise<ServerWallet | null>;
  /** Re-read the balance. Null on any failure; the caller keeps what it had. Never rejects. */
  readWallet(): Promise<ServerWallet | null>;
  /** Ask for a nonce before the ad. A refusal carries the service's reason ('daily_cap' | 'cooldown'). */
  issueNonce(placement: WalletPlacement): Promise<IssueReply>;
  /** Report the ad finished. Retries with backoff; 'pending' when the server stayed out of reach. */
  redeemNonce(nonceId: string, placement: WalletPlacement): Promise<RedeemReply>;
  /** The nonce a previous visit could not redeem, if any. */
  pending(): PendingNonce | null;
  /** Retry the pending nonce. Null when there is none. Clears it on any definitive answer. */
  settlePending(): Promise<RedeemReply | null>;
  /** The daily grant. Refusals: 'already_claimed' | 'soft_cap' | 'unavailable'. */
  grantDaily(): Promise<ServerOutcome>;
  /** The floor top-up. Refusals: 'above_floor' | 'floor_cooldown' | 'unavailable'. */
  applyFloor(): Promise<ServerOutcome>;
  /** A drill entry keyed by its session id (idempotent). Refusals: 'insufficient' | 'unavailable'. */
  enterPractice(sessionId: string): Promise<ServerOutcome>;
  /** The free daily recap. Refusals: 'recap_played' | 'unavailable'. */
  enterRecap(): Promise<ServerOutcome>;
}>;

export const WALLET_ENDPOINT = '/api/wallet';
export const PRINCIPAL_KEY = 'fd-principal';
export const PENDING_NONCE_KEY = 'fd-pending-nonce';
export const GUEST_HEADER = 'x-fd-principal';
/** Mirrors the server's guest-id shape (wallet-service.mjs PRINCIPAL). */
export const PRINCIPAL_SHAPE = /^[a-z]{1,8}_[A-Za-z0-9_-]{16,58}$/;
/** How long a probe may take before the hook settles for the device wallet. */
export const PROBE_TIMEOUT_MS = 4_000;
const CALL_TIMEOUT_MS = 8_000;
/** Redeem attempts and the waits between them: three tries, about two seconds in all. */
export const REDEEM_ATTEMPTS = 3;
export const REDEEM_BACKOFF_MS: readonly number[] = Object.freeze([500, 1_500]);
const PLACEMENTS: readonly string[] = Object.freeze(['coins', 'practice-entry', 'duel-entry', 'continue']);
const NONCE_ID = /^[A-Za-z0-9_-]{16,128}$/;

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

const int = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;

/* ------------------------------------------------------------------ the principal */

/** The browser's localStorage when it works; null in a server render or a locked-down profile. */
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

/** For a page whose storage is unavailable: one id per page load, still stable across calls. */
let memoryPrincipal: string | null = null;

/**
 * The guest principal: minted once as `anon_` + 32 hex, then read back on every call. A stored
 * value that does not fit the server's shape is replaced rather than sent to be refused.
 */
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

/* ------------------------------------------------------------------ the pending nonce */

export function readPendingNonce(raw: unknown): PendingNonce | null {
  if (typeof raw !== 'string' || !raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  const v = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  if (!v || typeof v.nonceId !== 'string' || !NONCE_ID.test(v.nonceId)) return null;
  if (typeof v.placement !== 'string' || !PLACEMENTS.includes(v.placement)) return null;
  return Object.freeze({ nonceId: v.nonceId, placement: v.placement as WalletPlacement, at: int(v.at) ? v.at : 0 });
}

/* ------------------------------------------------------------------ the transport */

/** Parsed JSON with the HTTP status, or a thrown error for anything that is not a JSON answer. */
async function call(fetchImpl: FetchLike, id: string, body: Record<string, unknown>, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(WALLET_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [GUEST_HEADER]: id },
      body: JSON.stringify({ ...body, principalId: id }),
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
    const data: unknown = await res.json();
    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function readServerWallet(data: unknown): ServerWallet | null {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  if (!d || typeof d.principalId !== 'string' || !int(d.coins) || !int(d.adsToday)) return null;
  return Object.freeze({
    principalId: d.principalId,
    coins: d.coins,
    adsToday: d.adsToday,
    adDailyCap: int(d.adDailyCap) ? d.adDailyCap : 0,
    dayKey: typeof d.dayKey === 'string' ? d.dayKey.slice(0, 10) : '',
    ...(typeof d.region === 'string' ? { region: d.region } : {}),
    ...(int(d.perAd) ? { perAd: d.perAd } : {}),
    ...(int(d.floorNextAt) ? { floorNextAt: d.floorNextAt } : {}),
  });
}

/** A grant or entry reply as the hook consumes it; a bad shape reads as a failure with coins unknown. */
function readOutcome(status: number, data: unknown): ServerOutcome {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  if (status >= 500 || !d) return Object.freeze({ ok: false, reason: 'unavailable', coins: -1 });
  if (status !== 200) return Object.freeze({ ok: false, reason: codeOf(data) ?? 'failed', coins: -1 });
  return Object.freeze({
    ok: d.ok === true,
    ...(typeof d.reason === 'string' ? { reason: d.reason } : {}),
    ...(int(d.granted) ? { granted: d.granted } : {}),
    ...(int(d.spent) ? { spent: d.spent } : {}),
    ...(d.replayed === true ? { replayed: true } : {}),
    coins: int(d.coins) ? d.coins : -1,
    ...(int(d.nextAt) ? { nextAt: d.nextAt } : {}),
  });
}

const refusal = (reason: string): Readonly<{ ok: false; reason: string }> => Object.freeze({ ok: false, reason });

/** A reply's error code when the server answered with its `{ error, code }` envelope. */
const codeOf = (data: unknown): string | null => {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  return d && typeof d.code === 'string' ? d.code : null;
};

export type WalletClientOptions = {
  fetch?: FetchLike;
  storage?: KeyStorage | null;
  tzOffsetMinutes?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export function createWalletClient({
  fetch: fetchImpl = (input, init) => fetch(input, init),
  storage = browserStorage(),
  tzOffsetMinutes = 0,
  now = () => Date.now(),
  sleep = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
}: WalletClientOptions = {}): WalletClient {
  const id = principalId(storage);
  const tz = Number.isInteger(tzOffsetMinutes) ? tzOffsetMinutes : 0;

  const read = async (timeoutMs: number): Promise<ServerWallet | null> => {
    try {
      const { status, data } = await call(fetchImpl, id, { action: 'wallet', tzOffsetMinutes: tz }, timeoutMs);
      return status === 200 ? readServerWallet(data) : null;
    } catch {
      return null;
    }
  };

  const pending = (): PendingNonce | null => {
    try {
      return readPendingNonce(storage?.getItem(PENDING_NONCE_KEY) ?? null);
    } catch {
      return null;
    }
  };
  const remember = (value: PendingNonce | null) => {
    try {
      if (value) storage?.setItem(PENDING_NONCE_KEY, JSON.stringify(value));
      else storage?.removeItem(PENDING_NONCE_KEY);
    } catch {
      /* without storage the pending nonce lives only for this call's retries */
    }
  };

  /** One redeem attempt: `null` means the server could not be reached and a retry is worth it. */
  const attempt = async (nonceId: string, placement: WalletPlacement): Promise<RedeemReply | null> => {
    let status: number, data: unknown;
    try {
      ({ status, data } = await call(
        fetchImpl,
        id,
        { action: 'redeem-nonce', nonceId, placement, tzOffsetMinutes: tz },
        CALL_TIMEOUT_MS,
      ));
    } catch {
      return null;
    }
    if (status >= 500) return null;
    const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    if (status !== 200 || !d) return refusal(codeOf(data) ?? 'failed');
    if (d.ok === true && int(d.granted) && int(d.coins))
      return Object.freeze({
        ok: true as const,
        granted: d.granted,
        replayed: d.replayed === true,
        adId: typeof d.adId === 'string' ? d.adId : `nonce:${nonceId}`,
        coins: d.coins,
      });
    return refusal(typeof d.reason === 'string' ? d.reason : 'failed');
  };

  const redeem = async (nonceId: string, placement: WalletPlacement): Promise<RedeemReply> => {
    remember({ nonceId, placement, at: now() });
    for (let i = 0; i < REDEEM_ATTEMPTS; i += 1) {
      if (i > 0) await sleep(REDEEM_BACKOFF_MS[Math.min(i - 1, REDEEM_BACKOFF_MS.length - 1)]);
      const reply = await attempt(nonceId, placement);
      if (reply) {
        remember(null);
        return reply;
      }
    }
    return refusal('pending');
  };

  /** One grant-or-entry call; the network failing reads as 'unavailable', never as a throw. */
  const outcome = async (body: Record<string, unknown>): Promise<ServerOutcome> => {
    try {
      const { status, data } = await call(fetchImpl, id, { ...body, tzOffsetMinutes: tz }, CALL_TIMEOUT_MS);
      return readOutcome(status, data);
    } catch {
      return Object.freeze({ ok: false, reason: 'unavailable', coins: -1 });
    }
  };

  return Object.freeze({
    principalId: id,
    serverCapable: true,
    probe: () => read(PROBE_TIMEOUT_MS),
    grantDaily: () => outcome({ action: 'grant-daily' }),
    applyFloor: () => outcome({ action: 'apply-floor' }),
    enterPractice: (sessionId: string) => outcome({ action: 'enter-practice', sessionId }),
    enterRecap: () => outcome({ action: 'enter-recap' }),
    readWallet: () => read(CALL_TIMEOUT_MS),
    async issueNonce(placement) {
      let status: number, data: unknown;
      try {
        ({ status, data } = await call(
          fetchImpl,
          id,
          { action: 'issue-nonce', placement, tzOffsetMinutes: tz },
          CALL_TIMEOUT_MS,
        ));
      } catch {
        return refusal('unavailable');
      }
      const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
      if (status !== 200 || !d) return refusal(status >= 500 ? 'unavailable' : (codeOf(data) ?? 'failed'));
      if (d.ok === true) {
        const n = d.nonce && typeof d.nonce === 'object' ? (d.nonce as Record<string, unknown>) : null;
        if (!n || typeof n.id !== 'string' || !NONCE_ID.test(n.id) || !int(d.reward)) return refusal('failed');
        return Object.freeze({
          ok: true as const,
          nonce: Object.freeze({
            id: n.id,
            placement: typeof n.placement === 'string' ? n.placement : placement,
            expiresAt: int(n.expiresAt) ? n.expiresAt : 0,
            minMs: int(n.minMs) ? n.minMs : 0,
          }),
          reward: d.reward,
          region: typeof d.region === 'string' ? d.region : '*',
          ttlMs: int(d.ttlMs) ? d.ttlMs : 0,
        });
      }
      return Object.freeze({
        ok: false as const,
        reason: typeof d.reason === 'string' ? d.reason : 'failed',
        ...(int(d.retryAt) ? { retryAt: d.retryAt } : {}),
        ...(int(d.adsToday) ? { adsToday: d.adsToday } : {}),
        ...(int(d.adDailyCap) ? { adDailyCap: d.adDailyCap } : {}),
      });
    },
    redeemNonce: redeem,
    pending,
    async settlePending() {
      const p = pending();
      if (!p) return null;
      return redeem(p.nonceId, p.placement);
    },
  });
}
