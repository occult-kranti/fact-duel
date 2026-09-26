/**
 * screens/start/first-run.ts — who sees the first-run poster (design bible §11.1).
 *
 * A player is "fresh" when the profile holds no activity: no round in the journal (duels, today's five,
 * file cards all journal a round), no per-fact record, no match and no file ever started. XP is NOT a
 * signal: the engine pays a streak day (10 XP) for simply opening the app (`visit`), so a brand-new
 * profile already has XP before anything was answered.
 *
 * Home sends a fresh player to #/start once per page session; after that the wordmark and the nav reach
 * Home normally (its empty states take over). Nothing here is persisted: the edition may not write
 * literal storage keys (ENGINE §13), and the profile itself already says whether the player has started.
 * The "shown this session" flag lives in module memory, so a reload of a still-empty profile shows the
 * poster again — which is right, the player still has not started.
 */

type ProfileLike = {
  journal?: {
    rounds?: ReadonlyArray<unknown>;
    matches?: ReadonlyArray<unknown>;
    facts?: Readonly<Record<string, unknown>> | null;
  } | null;
  journeys?: Readonly<Record<string, { run?: unknown; first?: unknown } | null | undefined>> | null;
  progression?: { counters?: { rounds?: number; matches?: number } | null } | null;
} | null | undefined;

/** True when this profile has never answered a question, played a match or opened a file. */
export function isFreshProfile(profile: ProfileLike): boolean {
  if (!profile) return true;
  const j = profile.journal;
  if ((j?.rounds?.length ?? 0) > 0) return false;
  if ((j?.matches?.length ?? 0) > 0) return false;
  if (j?.facts && Object.keys(j.facts).length > 0) return false;
  for (const rec of Object.values(profile.journeys ?? {})) if (rec && (rec.run || rec.first)) return false;
  const c = profile.progression?.counters;
  if ((c?.rounds ?? 0) > 0 || (c?.matches ?? 0) > 0) return false;
  return true;
}

let shownThisSession = false;

/** The first-run screen marks itself shown when it mounts. */
export function markStartShown() {
  shownThisSession = true;
}

/** Has the first-run screen been shown in this page session? */
export const startShown = () => shownThisSession;
