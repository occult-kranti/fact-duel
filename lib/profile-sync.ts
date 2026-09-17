/**
 * lib/profile-sync.ts — the client half of cross-device profile sync (M4).
 *
 * THE MERGE RULE, AND WHY IT IS THIS ONE. A profile is the single reducer state `lib/passport.mjs`
 * owns: journal, passport, progression, analytics, supporter and journeys are all derived by one
 * ordered reducer from one action stream. Two copies of it cannot be merged field by field — the
 * result would be a state no sequence of actions could have produced (a streak that never
 * happened next to XP that did). So the unit of sync is the WHOLE document, and the copy with the
 * higher `revision` wins outright. `revision` is bumped by every effective local write, so it is a
 * count of what a device has done since the last common copy; the higher one is the copy that has
 * moved further. A stale device cannot clobber a newer one because the server refuses a push whose
 * revision is below what it holds (`lib/server/profile-service.mjs`) and hands back its copy, which
 * this module writes over the local one. Ties keep the local copy: the next local write bumps it
 * and the push lands. Two devices that diverge from the same revision are last-writer-wins for
 * that one step — a known limit of a whole-document sync, and the honest one for a reducer state.
 *
 * WHEN IT RUNS. Only for a signed-in principal (a guest profile lives on its device by design), and
 * only where `/api/profile` answers with our JSON: in the server-free static build the request
 * comes back as an HTML 404 or not at all, and every function here resolves quietly to "no server"
 * rather than throwing. Nothing in this module can break play.
 *
 * WHO IS SIGNED IN is asked of `/api/auth` directly with `{ action: 'whoami' }` so this module has
 * no dependency on the auth client; the answer is only ever used as a yes/no.
 */
import { readProfile } from './passport.mjs';

export type SyncState = 'off' | 'idle' | 'pushing' | 'stale' | 'error';
export type ServerProfile = { revision: number; state: Record<string, unknown> };
export type Whoami = { signedIn: boolean; session: boolean; principalId: string | null };
export type PullResult = { ok: true; profile: ServerProfile | null } | { ok: false; code: string };
export type PushResult =
  | { ok: true; revision: number }
  | { ok: false; code: 'stale'; server: ServerProfile }
  | { ok: false; code: string };
/** The reducer's profile shape is owned by lib/passport.mjs; only `revision` matters here. */
type ProfileLike = { revision?: unknown; version?: unknown } & Record<string, unknown>;

/** A push lands this long after the last local write, so a burst of taps is one request. */
export const PUSH_DEBOUNCE_MS = 2000;
/** Where the device keeps its guest id (the wallet client writes it); sent so a promotion can find it. */
export const GUEST_STORAGE_KEY = 'fd-principal';
const PROFILE_API = '/api/profile';
const AUTH_API = '/api/auth';
const TIMEOUT_MS = 8000;
/** `fetch({ keepalive })` refuses bodies above 64 KiB; below this the hidden-tab flush survives unload. */
const KEEPALIVE_MAX_BYTES = 60_000;

type Reply = { status: number; data: Record<string, unknown> } | null;

function guestHeader(): Record<string, string> {
  try {
    const id = localStorage.getItem(GUEST_STORAGE_KEY);
    return id ? { 'x-fd-principal': id } : {};
  } catch {
    return {};
  }
}

/**
 * One POST with the session cookie attached. Resolves `null` for anything that is not our JSON —
 * offline, a timeout, a static host's HTML error page — so callers read "null" as "no server".
 */
async function post(url: string, body: unknown, { keepalive = false } = {}): Promise<Reply> {
  if (typeof fetch !== 'function') return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const text = JSON.stringify(body);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...guestHeader() },
      body: text,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
      keepalive: keepalive && text.length < KEEPALIVE_MAX_BYTES,
    });
    if (!res.headers.get('content-type')?.includes('application/json')) return null;
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') return null;
    return { status: res.status, data: data as Record<string, unknown> };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** What the server says a `{ revision, state }` is, or null when it is not one. */
function readServerProfile(value: unknown): ServerProfile | null {
  if (!value || typeof value !== 'object') return null;
  const { revision, state } = value as { revision?: unknown; state?: unknown };
  if (!Number.isSafeInteger(revision) || (revision as number) < 0) return null;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  return { revision: revision as number, state: state as Record<string, unknown> };
}

/** Signed in or not. `null` means there is no auth service to ask, which reads as "not signed in". */
export async function whoami(): Promise<Whoami | null> {
  const reply = await post(AUTH_API, { action: 'whoami' });
  if (!reply || reply.status !== 200) return null;
  const { signedIn, principalId, session } = reply.data;
  return {
    signedIn: signedIn === true,
    // A claimed (unverified) profile is not a sign-in, but it does hold a session, and the profile
    // API only needs a session. An older server that sends no `session` falls back to `signedIn`.
    session: session === true || signedIn === true,
    principalId: typeof principalId === 'string' ? principalId : null,
  };
}

export async function pullProfile(): Promise<PullResult> {
  const reply = await post(PROFILE_API, { action: 'get' });
  if (!reply) return { ok: false, code: 'unavailable' };
  if (reply.status !== 200 || reply.data.ok !== true)
    return { ok: false, code: typeof reply.data.code === 'string' ? reply.data.code : 'error' };
  return { ok: true, profile: readServerProfile(reply.data.profile) };
}

export async function pushProfile(profile: ProfileLike, { keepalive = false } = {}): Promise<PushResult> {
  const revision = Number.isSafeInteger(profile?.revision) ? (profile.revision as number) : 0;
  const reply = await post(PROFILE_API, { action: 'put', revision, state: profile }, { keepalive });
  if (!reply) return { ok: false, code: 'unavailable' };
  if (reply.status !== 200) return { ok: false, code: typeof reply.data.code === 'string' ? reply.data.code : 'error' };
  if (reply.data.ok === true)
    return { ok: true, revision: Number.isSafeInteger(reply.data.revision) ? (reply.data.revision as number) : revision };
  if (reply.data.reason === 'stale') {
    const server = readServerProfile(reply.data.server);
    if (server) return { ok: false, code: 'stale', server };
  }
  return { ok: false, code: 'error' };
}

/**
 * The pure merge: which whole copy to keep at sign-in. The higher revision wins (see the header);
 * ties and an absent or malformed server copy keep the local one, and `profile` is then the very
 * object passed in so a caller can tell "nothing changed" by identity. A server copy that wins is
 * returned sanitised with its revision pinned to the row's, exactly as the store will keep it.
 */
export function mergeOnSignIn(
  local: ProfileLike,
  server: ServerProfile | null,
): { source: 'local' | 'server'; profile: ProfileLike } {
  const mine = Number.isSafeInteger(local?.revision) ? (local.revision as number) : -1;
  if (!server || server.state.version !== 2 || !(server.revision > mine)) return { source: 'local', profile: local };
  const theirs = readProfile(server.state) as ProfileLike;
  theirs.revision = server.revision;
  return { source: 'server', profile: theirs };
}

/** True when the page was opened by the sign-in redirect; the hook re-asks `whoami` then. */
export function arrivedSignedIn(): boolean {
  try {
    return new URLSearchParams(location.search).get('signed-in') === '1';
  } catch {
    return false;
  }
}

export type Pusher = {
  /** Sync is on only while signed in; off drops any pending push and reports 'off'. */
  enable(on: boolean): void;
  readonly enabled: boolean;
  /** Called after every effective local write: a push follows `PUSH_DEBOUNCE_MS` after the last one. */
  schedule(): void;
  /** Push now (the hidden-tab path). Resolves when the push has settled; a no-op with nothing new. */
  flush(keepalive?: boolean): Promise<void>;
  /** The local copy was just replaced by the server's at this revision: nothing to push until it moves. */
  markPushed(revision: number): void;
  dispose(): void;
};

/**
 * The debounced pusher. One push in flight at a time; a write that lands mid-push is pushed after.
 * A refused (stale) push hands the server copy to `onStale`, which the hook writes over the local
 * profile, and the state reads 'stale' until the next push lands. A failed push leaves the local
 * revision unmarked so the next write, or the next hidden tab, retries it.
 */
export function createProfilePusher({
  current,
  onState,
  onStale,
}: {
  current: () => ProfileLike | null;
  onState: (state: SyncState) => void;
  onStale: (server: ServerProfile) => Promise<void> | void;
}): Pusher {
  let enabled = false,
    timer: ReturnType<typeof setTimeout> | null = null,
    inFlight: Promise<void> | null = null,
    again = false,
    lastPushed = -1;
  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const flush = (keepalive = false): Promise<void> => {
    clear();
    if (!enabled) return Promise.resolve();
    if (inFlight) {
      again = true;
      return inFlight;
    }
    const profile = current();
    const revision = Number.isSafeInteger(profile?.revision) ? (profile!.revision as number) : -1;
    if (!profile || revision <= lastPushed) return Promise.resolve();
    onState('pushing');
    inFlight = pushProfile(profile, { keepalive })
      .then(async (result) => {
        if (!enabled) return;
        if (result.ok) {
          lastPushed = Math.max(lastPushed, revision);
          onState('idle');
        } else if ('server' in result) {
          lastPushed = Math.max(lastPushed, result.server.revision);
          await onStale(result.server);
          if (enabled) onState('stale');
        } else if (result.code === 'sign_in_required') {
          enabled = false;
          onState('off');
        } else onState('error');
      })
      .catch(() => {
        if (enabled) onState('error');
      })
      .finally(() => {
        inFlight = null;
        if (again) {
          again = false;
          if (enabled) schedule();
        }
      });
    return inFlight;
  };
  const schedule = () => {
    if (!enabled) return;
    clear();
    timer = setTimeout(() => void flush(), PUSH_DEBOUNCE_MS);
  };
  const onVisibility = () => {
    if (enabled && document.visibilityState === 'hidden') void flush(true);
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
  return {
    get enabled() {
      return enabled;
    },
    enable(on) {
      if (on === enabled) return;
      enabled = on;
      if (!on) clear();
      onState(on ? 'idle' : 'off');
    },
    schedule,
    flush,
    markPushed(revision) {
      if (Number.isSafeInteger(revision)) lastPushed = Math.max(lastPushed, revision);
    },
    dispose() {
      enabled = false;
      clear();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
