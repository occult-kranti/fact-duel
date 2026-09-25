/**
 * editions/hisaab/engine/profile-sync-static.ts — the edition's stand-in for lib/profile-sync.ts.
 *
 * The real module asks `/api/auth` who is signed in and syncs the profile through `/api/profile`.
 * The edition is served from GitHub Pages with no server behind it, where those POSTs come back as
 * 404/405 pages: harmless to play (the real module reads them as "no server") but each one is a
 * console error and a wasted request on every load. vite.config.hisaab.ts aliases the module here:
 * the network calls answer "no server" without a request, and everything pure is the real code.
 * With `whoami()` always null, `app/use-player.ts` never enables the pusher, so sync stays 'off'.
 */
import type { PullResult, PushResult, Whoami } from '../../../lib/profile-sync';

export type { Pusher, PullResult, PushResult, ServerProfile, SyncState, Whoami } from '../../../lib/profile-sync';
export {
  GUEST_STORAGE_KEY,
  PUSH_DEBOUNCE_MS,
  arrivedSignedIn,
  createProfilePusher,
  mergeOnSignIn,
} from '../../../lib/profile-sync';

/** No auth service on a static host: never signed in. */
export async function whoami(): Promise<Whoami | null> {
  return null;
}

export async function pullProfile(): Promise<PullResult> {
  return { ok: false, code: 'unavailable' };
}

export async function pushProfile(): Promise<PushResult> {
  return { ok: false, code: 'unavailable' };
}
