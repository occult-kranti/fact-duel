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
import { parseApp } from './redirect-target.mjs';

/** True in this build only. The static entry reads it to render the preview notice. */
export const OFFLINE_BUILD = true;

/**
 * The label every visitor sees first. It says what this build is — a preview with no server — and
 * names the two things that need one, rather than calling itself a demo and leaving the player to
 * find out which half works.
 *
 * Both halves of the sentence have to stay true in the build that shows it. Say "open on the live
 * site" with no live site and no link and the player goes looking for something that is not there;
 * so the wording is future tense until there is an address to give, and names the host when there
 * is one. `liveUrl` is where the live game runs, validated by `parseApp` — anything that is not an
 * absolute http(s) URL is treated as no live site at all, because a broken link is worse than none.
 */
export function offlineNotice(liveUrl: string | null | undefined = '') {
  const live = parseApp(liveUrl);
  return {
    title: 'Preview build',
    body: live
      ? `This preview has no server: friend duels and finding a rival are on the live site, ${live.host}. Everything else runs in this browser, and progress is saved on this device only.`
      : 'This preview has no server: friend duels and finding a rival will open once the live site is up. Everything else runs in this browser, and progress is saved on this device only.',
    /** Where to send a player who wants the real thing, or null while there is no real thing. */
    href: live ? live.href : null,
  };
}

/**
 * What this build actually shows. `static/main.tsx` only mounts the arena (and therefore this
 * banner) when the hand-off target is null — no `APP_URL`, or one that does not parse, or one
 * pointing back at this page — so by construction there is no live site to name here. The linked
 * form above exists for the day the preview is served next to a live game, and is pinned by
 * `tests/offline-copy.test.mjs` so the two branches cannot drift.
 */
export const OFFLINE_NOTICE = offlineNotice();

/** The single room table of this tab. It is gone when the tab is closed — same as a room TTL. */
const store = new MemoryRoomStore();

/** Rooms are per-device here, so the rate limiter has exactly one actor to count. */
const ACTOR = 'this-device';

/**
 * The same guest id the worker build sends as `x-fd-principal`, read from the same localStorage
 * key. There is no ledger behind the memory store, so it is only recorded on the room's seat;
 * the free coins and the device wallet carry on exactly as before.
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
  'Anonymous retention measurement needs the shared server, so this preview collects and reports nothing.';

const FRIEND_DISABLED =
  'This preview has no server: friend duels and finding a rival will open once the live site is up. Play Lucky Guess (bot), an expedition or an event instead.';

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
