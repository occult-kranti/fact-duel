/**
 * screens/start/first-run.ts — who sees the first-run poster (design bible §11.1).
 *
 * A player is "fresh" when the profile holds nothing at all: no receipt in the journal, no XP and no
 * file ever opened. Home sends a fresh player to #/start once per page session; after that the
 * wordmark and the nav reach Home normally (its empty states take over).
 *
 * Nothing here is persisted: the edition may not write literal storage keys (ENGINE §13), and the
 * profile itself already says whether the player has started. The "shown this session" flag lives in
 * module memory, so a reload of a still-empty profile shows the poster again — which is right, the
 * player still has not started.
 */

type ProfileLike = {
  journal?: { rounds?: ReadonlyArray<unknown>; facts?: Readonly<Record<string, unknown>> } | null;
  journeys?: Readonly<Record<string, unknown>> | null;
  progression?: { xp?: number } | null;
} | null;

/** True when this profile has never answered, earned or opened anything. */
export function isFreshProfile(profile: ProfileLike): boolean {
  if (!profile) return true;
  const rounds = profile.journal?.rounds?.length ?? 0;
  const facts = profile.journal?.facts ? Object.keys(profile.journal.facts).length : 0;
  const journeys = profile.journeys ? Object.keys(profile.journeys).length : 0;
  const xp = profile.progression?.xp ?? 0;
  return rounds === 0 && facts === 0 && journeys === 0 && xp <= 0;
}

let shownThisSession = false;

/** The first-run screen marks itself shown when it mounts. */
export function markStartShown() {
  shownThisSession = true;
}

/** Has the first-run screen been shown in this page session? */
export const startShown = () => shownThisSession;
