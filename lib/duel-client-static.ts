/**
 * lib/duel-client-static.ts — the transport for the server-free (static) build.
 *
 * `lib/duel-client.ts` POSTs to `/api/duel`, where `handleDuelRequest` runs `dispatch()` against a
 * D1-backed store and turns thrown `GameError`s into HTTP statuses. Here the very same `dispatch()`
 * runs in the page, against a module-level `MemoryRoomStore`, and this module reproduces the
 * response and error contract byte for byte: resolve with the service result, or throw an `Error`
 * carrying `.message`, `.code` and `.status` the way the fetch client does after a non-2xx body.
 *
 * The Vite config for the static build aliases `@/lib/duel-client` to this file, so no screen,
 * hook or component changes.
 */
import { dispatch } from './server/duel-service.mjs';
import { MemoryRoomStore } from './duel-memory-store.mjs';

/** True in this build only. The static entry reads it to render the offline notice. */
export const OFFLINE_BUILD = true;

export const OFFLINE_NOTICE = {
  title: 'Offline demo',
  body: 'No server: the whole game runs in this browser, progress is saved on this device only, and friend duels are off.',
};

/** The single room table of this tab. It is gone when the tab is closed — same as a room TTL. */
const store = new MemoryRoomStore();

/** Rooms are per-device here, so the rate limiter has exactly one actor to count. */
const ACTOR = 'this-device';

/**
 * The same guest id the worker build sends as `x-fd-principal`, read from the same localStorage
 * key. There is no ledger behind the memory store, so it is only recorded on the room's seat;
 * the demo coins and the device wallet carry on exactly as before.
 */
const PRINCIPAL_KEY = 'fd-principal';
function principalId(): string | null {
  try {
    const existing = localStorage.getItem(PRINCIPAL_KEY);
    return existing && /^[a-z]{1,8}_[A-Za-z0-9_-]{16,58}$/.test(existing) ? existing : null;
  } catch {
    return null;
  }
}

type ClientError = Error & { code?: string; status?: number };

/** `handleDuelRequest`'s catch block, minus the Response wrapper. */
function toClientError(error: unknown): ClientError {
  const thrown = (error ?? {}) as Partial<ClientError>;
  const status = thrown.status || 503;
  const message =
    status === 503
      ? 'The room service is busy or unavailable. Your accepted answer remains locked; retry safely.'
      : thrown.message;
  const clientError: ClientError = new Error(message || 'Connection interrupted. Try again.');
  clientError.code = thrown.code || 'service_unavailable';
  clientError.status = status;
  return clientError;
}

function offlineError(message: string): ClientError {
  const error: ClientError = new Error(message);
  error.code = 'offline_build';
  error.status = 501;
  return error;
}

/**
 * Cohort retention (`cohort-ping` / `cohort-report`) is an aggregate across devices: there is no
 * shared table to add a row to and no cohort to divide by, so this build measures nothing at all.
 */
const MEASUREMENT_DISABLED =
  'Anonymous retention measurement needs the shared server, so this offline build collects and reports nothing.';

const FRIEND_DISABLED =
  'Friend duels need a server to pass the room between two devices, so they are off in this offline demo build. Play Lucky Guess (bot), an expedition or an event instead.';

type Body = { action?: string; config?: { opponent?: string } } & Record<string, unknown>;

export async function request(body: Body) {
  try {
    if (body?.action === 'cohort-ping' || body?.action === 'cohort-report')
      throw offlineError(MEASUREMENT_DISABLED);
    if (body?.action === 'join') throw offlineError(FRIEND_DISABLED);
    if (body?.action === 'create' && (body?.config?.opponent ?? 'friend') !== 'bot')
      throw offlineError(FRIEND_DISABLED);
    // The worker answers `clock` from the primary database; here that is the same wall clock the
    // store stamps writes with, which is what the arena calibrates against.
    if (body?.action === 'clock') {
      const stamp = await store.clock();
      return { serverNow: stamp.db_now, clockSource: 'primary-database' };
    }
    if (['catalogue', 'practice', 'expedition', 'fixture'].includes(body?.action ?? ''))
      return await dispatch(null, body, { now: Date.now() });
    return await dispatch(store, body, {
      now: Date.now(),
      actor: ACTOR,
      useDatabaseClock: true,
      principalId: principalId(),
    });
  } catch (error) {
    throw toClientError(error);
  }
}
