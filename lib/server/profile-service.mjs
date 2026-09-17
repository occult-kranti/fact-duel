/**
 * Cross-device profile sync (M4): the device profile blob mirrored to the server for a SIGNED-IN
 * principal, one row per principal in `profile_blobs`.
 *
 * What a profile is here: the single reducer state `lib/passport.mjs` owns (journal, passport,
 * progression, analytics, supporter, journeys), carried whole. It is not field-mergeable — every
 * sub-record is derived by one ordered reducer from the same action stream, so merging two of them
 * field by field would produce a state no sequence of actions could have produced. The unit of
 * sync is therefore the WHOLE document, ordered by the profile's own `revision` (bumped by every
 * effective local write) and the server keeps the highest one it has seen.
 *
 * Why the guard is a read, not a zero-row write. D1 rolls a batch back on a statement ERROR only;
 * an upsert whose `WHERE excluded.revision > profile_blobs.revision` clause matches nothing is a
 * success with `changes: 0`. So `putProfile` runs the upsert and then READS the row: if the stored
 * revision is above the one offered, the offer was stale and the caller is handed the server copy
 * to replace its own with. Equal revisions are accepted as a no-op — the retry of a push that
 * already landed must not look like a conflict.
 *
 * What is stored is what `readProfile` accepts, never the raw body: the blob is played back into
 * the reducer on another device, so it is sanitised on the way in exactly as IndexedDB input is.
 *
 * Only a session principal may read or write here. A guest profile lives on its device by design:
 * a guest id is a bearer token anybody could present, and the profile is the one record that is
 * worth more than the coins.
 */
import { readProfile } from '../passport.mjs';
import { GameError, requireValue } from './room-engine.mjs';
import { readPrincipalId } from './wallet-service.mjs';

export const PROFILE = Object.freeze({
  /** The serialised profile a put may carry, in UTF-8 bytes. `FACT_LIMIT` profiles fit with room. */
  maxBytes: 256 * 1024,
});

const sessionOf = (db) => (typeof db?.withSession === 'function' ? db.withSession('first-primary') : db);
const encoder = new TextEncoder();

/** The stored JSON, read back through the sanitiser so an old row never crashes a newer reader. */
function parseState(text) {
  try {
    return readProfile(JSON.parse(text));
  } catch {
    return readProfile(null);
  }
}

/**
 * The gate every profile action passes: `resolvePrincipal`'s answer must be a session. A guest or
 * an anonymous request gets 401 `sign_in_required`, which the client reads as "stay device-local".
 */
export function requireSession(principal) {
  if (principal?.kind !== 'session' || typeof principal.principalId !== 'string')
    throw new GameError('Sign in to keep your profile across devices.', 401, 'sign_in_required');
  return readPrincipalId(principal.principalId);
}

/** @returns {Promise<{ revision: number, state: object, updatedAt: number } | null>} */
export async function getProfile(db, principalId) {
  const id = readPrincipalId(principalId);
  const row = await sessionOf(db)
    .prepare('SELECT revision, state, updated_at FROM profile_blobs WHERE principal_id = ?')
    .bind(id)
    .first();
  if (!row) return null;
  return { revision: Number(row.revision), state: parseState(row.state), updatedAt: Number(row.updated_at) };
}

/**
 * Offer a profile at `revision`. Accepted when the server holds nothing or something older (or the
 * same revision, as a no-op); refused as `stale` with the server copy otherwise.
 *
 * The stored blob's own `revision` field is pinned to the offered `revision`, so the number the row
 * is ordered by and the number inside the document a device reads back are always the same one.
 *
 * @returns {Promise<{ ok: true, revision: number } | { ok: false, reason: 'stale', server: { revision: number, state: object } }>}
 */
export async function putProfile(db, { principalId, revision, state, now } = {}) {
  const id = readPrincipalId(principalId);
  requireValue(Number.isSafeInteger(revision) && revision >= 0, 'A profile revision is required.');
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  requireValue(state && typeof state === 'object' && !Array.isArray(state), 'A profile is required.');
  let raw;
  try {
    raw = JSON.stringify(state);
  } catch {
    throw new GameError('A profile is required.');
  }
  requireValue(typeof raw === 'string' && encoder.encode(raw).byteLength <= PROFILE.maxBytes, 'Profile too large.', 413, 'too_large');
  const clean = readProfile(state);
  clean.revision = revision;
  const json = JSON.stringify(clean);
  const d = sessionOf(db);
  await d
    .prepare(
      'INSERT INTO profile_blobs (principal_id, revision, state, updated_at) VALUES (?,?,?,?) ' +
        'ON CONFLICT(principal_id) DO UPDATE SET revision = excluded.revision, state = excluded.state, updated_at = excluded.updated_at ' +
        'WHERE excluded.revision > profile_blobs.revision',
    )
    .bind(id, revision, json, now)
    .run();
  // The decision is the row, never the upsert's change count (see the header).
  const row = await d.prepare('SELECT revision, state FROM profile_blobs WHERE principal_id = ?').bind(id).first();
  if (!row) throw new GameError('The profile service is unavailable.', 503, 'service_unavailable');
  const stored = Number(row.revision);
  if (stored > revision) return { ok: false, reason: 'stale', server: { revision: stored, state: parseState(row.state) } };
  return { ok: true, revision: stored };
}

export { GameError };
