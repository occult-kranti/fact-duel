/**
 * lib/presence-client-static.ts — the presence client of the server-free (static) build.
 *
 * `vite.config.static.ts` aliases `@/lib/presence-client` to this file, the way it swaps the duel
 * transport and the wallet client. There is no `/api/queue` on a static host, so this twin never
 * polls, never mounts a timer and never adds a visibility listener: `usePresence()` is `null`
 * forever and `ModeCards` therefore prints no presence line at all.
 *
 * That is the honest answer rather than an empty one. "Nobody in queue" would be a claim about the
 * live game made by a build that cannot see it; no line makes no claim. The live counts appear
 * when the app is served by the Worker, which is the only place they are real.
 */
import type {
  Presence,
  PresenceDeps,
  PresenceHandle,
  PresenceLineKey,
  PresenceView,
  QueuedSearch,
} from './presence-client';

export type {
  ModePresence,
  Presence,
  PresenceDeps,
  PresenceHandle,
  PresenceLineKey,
  PresenceView,
  QueuedSearch,
} from './presence-client';

export const PRESENCE_ENDPOINT = '/api/queue';
/** No server, so nothing to count and no box to keep for a line that can never arrive. */
export const PRESENCE_LIVE = false;
export const PRESENCE_POLL_MS = 0;
export const PRESENCE_BACKOFF_MS = 0;
export const PRESENCE_FAILURES_BEFORE_BACKOFF = 0;
export const PRESENCE_FRESH_MS = 0;

/** Nothing in this build is ever live, so nothing is ever fresh. */
export const isFresh = (): boolean => false;

/** No answer can arrive here, so no answer is ever read. */
export function readPresence(): Presence | null {
  return null;
}

/** No server to ask. */
export async function requestPresence(): Promise<Presence | null> {
  return null;
}

/**
 * A loop that never runs: no request, no timer, no visibility listener, no call to `onChange`.
 * Both arguments are accepted and deliberately ignored — the twin keeps the real client's
 * signature so the alias is a drop-in, but there is nothing here to call and nothing to report.
 */
export function startPresence(onChange: (view: PresenceView | null) => void, deps: PresenceDeps = {}): PresenceHandle {
  void onChange;
  void deps;
  return { stop: () => {} };
}

/**
 * The copy rules are about words, not about servers, so the twin answers them the same way the
 * real client does rather than importing it (a relative import would pull the polling client, its
 * fetch and its hooks back into a bundle that has no server to call). `tests/presence.test.mjs`
 * pins the two implementations against the same table, so they cannot drift apart in silence.
 * Nothing in this build ever reaches them: `usePresence()` is null, so no line is rendered at all.
 */
export function presenceLineKey(inQueue: number, queuedHere: boolean): PresenceLineKey {
  if (!(inQueue > 0)) return 'presence.lineZero';
  return queuedHere ? 'presence.lineYou' : 'presence.line';
}

/** The format the viewer's own live queue row sits in, or null when there is no such row. */
export function queuedFormat(search: QueuedSearch, selected: string): string | null {
  if (!search || search.phase !== 'searching') return null;
  return search.lane?.mode ?? selected;
}

/** Always null: the static build has no presence to report, so `ModeCards` prints no line. */
export function usePresence(deps: PresenceDeps = {}): PresenceView | null {
  void deps;
  return null;
}
