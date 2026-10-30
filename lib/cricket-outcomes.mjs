/** Cricket visual metaphors for settled quiz results. This never decides a match or score. */
export const CRICKET_MOMENT_MS = 2600;
const score = value => Number.isSafeInteger(value) && value >= 0 ? value : null;

/**
 * Close means one correct-answer point apart, or an equal score decided by the authority's
 * time tiebreak. Run-out is a visual metaphor, never a claim about why the quiz was lost.
 * @param {{outcome?:string,settled?:boolean,ourScore?:number,theirScore?:number,forfeit?:boolean}} input
 * @returns {'boundary'|'wicket'|'run-out'|'level'|null}
 */
export function cricketOutcome({ outcome, settled = false, ourScore, theirScore, forfeit = false } = {}) {
  if (!settled || forfeit || !['win', 'loss', 'draw'].includes(outcome)) return null;
  if (outcome === 'win') return 'boundary';
  if (outcome === 'draw') return 'level';
  const mine = score(ourScore), theirs = score(theirScore);
  return mine !== null && theirs !== null && theirs >= mine && theirs - mine <= 1 ? 'run-out' : 'wicket';
}

/** One automatic moment per settled result in this page session; bounded and fail-closed. */
export function createCricketMomentGate(limit = 512) {
  const shown = new Set();
  const cap = Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 2048) : 512;
  return {
    claim(eventId) {
      if (typeof eventId !== 'string' || !eventId || eventId.length > 200 || shown.has(eventId) || shown.size >= cap) return false;
      shown.add(eventId); return true;
    },
  };
}
