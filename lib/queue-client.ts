/**
 * lib/queue-client.ts — the browser's side of `/api/queue` (lib/server/http-queue.mjs).
 *
 * WHAT IT IS. One transport and one search loop. The transport carries the session cookie
 * (`credentials: 'include'`) and the guest id this device minted (header `x-fd-principal`, the key
 * the wallet and auth clients share), exactly as lib/auth-client.ts does, and reproduces the duel
 * client's error contract: resolve with the JSON, or throw an Error carrying `.status` and `.code`.
 *
 * WHAT THE LOOP DOES. `startSearch` enqueues once, then polls every `QUEUE_POLL_MS` until the server
 * answers `paired`, the caller cancels, or a request fails. Every `waiting` answer is handed to the
 * caller as it came from the server — the lane, the real number of live rows in it (the caller
 * included), the wait served and the rating window — so the launch panel never shows a number the
 * server did not count. `cancel()` stops the loop and leaves the lane; a `paired` answer stops it and
 * hands over the seat credentials, and the caller enters the room on the duel transport.
 *
 * WHEN IT IS OFFERED. The queue lives behind the same database as the server wallet, so a page
 * offers "Find a rival" only while the wallet hook reports server mode. The static build never
 * gets there (its wallet twin never answers the probe), so the option is simply absent — no
 * server, no queue, no copy pretending otherwise.
 *
* Everything injectable is (the transport, timers, the clock), so a node test can script the loop.
 * The guest id read is inlined rather than imported so this module loads in node without a bundler.
 */
/** The guest id the wallet client keeps under lib/auth-client.ts's PRINCIPAL_KEY; absent until minted. */
const PRINCIPAL_KEY = 'fd-principal';
const PRINCIPAL = /^[a-z]{1,8}_[A-Za-z0-9_-]{16,58}$/;
function readGuestPrincipal(): string | null {
  try {
    const value = globalThis.localStorage?.getItem(PRINCIPAL_KEY);
    return typeof value === 'string' && PRINCIPAL.test(value) ? value : null;
  } catch {
    return null;
  }
}

export type QueueLane = { sport: string; mode: string; stake: number };
export type QueueJoin = { roomId: string; token: string; invite: string; seat: 0 | 1 };
export type QueueWaiting = {
  state: 'waiting';
  ticket: string;
  lane: QueueLane;
  /** Live rows in this lane right now, this player included. The server's count, never inferred. */
  waiting: number;
  waitedMs: number;
  /** The rating gap the server currently accepts for this player. */
  window: number;
};
export type QueuePaired = { state: 'paired'; roomId: string; join: QueueJoin };
export type QueueView = QueueWaiting | QueuePaired | { state: 'expired' };
export type QueueError = Error & { status?: number; code?: string };

/** Mirrors QUEUE.pollMs / QUEUE.offerPracticeAfterMs in lib/server/matchmaking.mjs. */
export const QUEUE_POLL_MS = 2000;
export const QUEUE_OFFER_PRACTICE_MS = 90_000;

const QUEUE_API = '/api/queue';

/** The transport shape: resolves with the parsed body, or throws a `QueueError`. */
export type QueueTransport = (body: Record<string, unknown>) => Promise<QueueView>;

export async function queueRequest(body: Record<string, unknown>, timeoutMs = 8000): Promise<QueueView> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const guest = readGuestPrincipal();
    if (guest) headers['x-fd-principal'] = guest;
    const res = await fetch(QUEUE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
    let data: Record<string, unknown> | null = null;
    try {
      const parsed: unknown = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
      data = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      const error: QueueError = new Error(
        (data && typeof data.error === 'string' && data.error) || 'Connection interrupted. Try again.',
      );
      error.code =
        (data && typeof data.code === 'string' && data.code) || (res.ok ? 'invalid_response' : 'service_unavailable');
      error.status = res.status;
      throw error;
    }
    return data as unknown as QueueView;
  } finally {
    clearTimeout(timeout);
  }
}

export type SearchParams = {
  lane: QueueLane;
  /** The player's per-sport rating on this device: a hint to the server, never a gate. */
  rating: number;
  /** The display name the room is created with when this player turns out to be the host. */
  name: string;
};
export type SearchEvents = {
  /** Every server answer while waiting. `elapsedMs` is this device's own stopwatch since `startSearch`. */
  onWaiting: (view: QueueWaiting & { elapsedMs: number }) => void;
  onPaired: (join: QueueJoin) => void;
  onError: (error: QueueError) => void;
};
export type SearchDeps = {
  request?: QueueTransport;
  pollMs?: number;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
};
export type SearchHandle = {
  /** Stop polling and leave the lane. Safe to call more than once, and after `paired`. */
  cancel: () => Promise<void>;
};

/**
 * Enqueue, then poll until paired, cancelled or failed. A row the server reports as `expired` (the
 * device slept past the stale limit) is re-enqueued once per answer, so a laptop lid closing does
 * not silently end the search.
 */
export function startSearch(params: SearchParams, events: SearchEvents, deps: SearchDeps = {}): SearchHandle {
  const request = deps.request ?? queueRequest;
  const pollMs = deps.pollMs ?? QUEUE_POLL_MS;
  const now = deps.now ?? Date.now;
  const schedule = deps.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const unschedule = deps.clearTimeout ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const startedAt = now();
  let stopped = false,
    paired = false,
    ticket: string | null = null,
    timer: unknown = null;
  const enqueue = async () => {
    const view = await request({ action: 'enqueue', ...params.lane, rating: params.rating });
    if (view.state !== 'waiting') throw Object.assign(new Error('Unexpected queue answer.'), { code: 'invalid_response' });
    ticket = view.ticket;
    return view;
  };
  const tick = async () => {
    timer = null;
    if (stopped) return;
    try {
      let view = ticket ? await request({ action: 'poll', ticket, name: params.name }) : await enqueue();
      if (view.state === 'expired' && !stopped) view = await enqueue();
      // A `paired` answer is never dropped, even after cancel: the server has already created the
      // room (or left the partner a note), so the honest thing is to enter it and leave from there,
      // which refunds both seats — silently vanishing would strand a real person in a lobby.
      if (view.state === 'paired') {
        paired = true;
        stopped = true;
        events.onPaired(view.join);
        return;
      }
      if (stopped) return;
      if (view.state === 'waiting') events.onWaiting({ ...view, elapsedMs: Math.max(0, now() - startedAt) });
      timer = schedule(() => void tick(), pollMs);
    } catch (error) {
      if (stopped) return;
      stopped = true;
      events.onError(error as QueueError);
    }
  };
  void tick();
  return {
    cancel: async () => {
      stopped = true;
      if (timer !== null) unschedule(timer);
      timer = null;
      if (paired || ticket === null) return;
      const held = ticket;
      ticket = null;
      try {
        await request({ action: 'leave', ticket: held });
      } catch {
        /* the row goes stale and is swept by the next poll from anyone */
      }
    },
  };
}
