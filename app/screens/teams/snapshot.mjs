/** Monotonic authority snapshots for a player's team contribution. No score is computed here. */
const PHASE = Object.freeze({ question: 0, result: 1, finished: 2 });
/** @typedef {{identityId:string|null,serverNow:number,run:null|{fixtureId:string,round:number,phase:string}}} TeamSnapshotGuard */
/** @param {string|null} identityId @returns {TeamSnapshotGuard} */
export function createTeamSnapshotGuard(identityId = null) { return { identityId, serverNow: -Infinity, run: null }; }
/**
 * A slower question poll may arrive after an answer or next-round response. Reject it even if
 * the authority stamps two responses in the same millisecond. Reading a scorecard never starts
 * or replaces the visible contribution; only explicit play/answer/next and run polling can.
 * @param {TeamSnapshotGuard} previous
 * @param {{serverNow:number,run?:null|{fixtureId:string,round:number,phase:string}}} incoming
 * @param {{identityId:string|null,includeRun?:boolean}} options
 */
export function considerTeamSnapshot(previous, incoming, { identityId, includeRun = true }) {
  const before = previous.identityId === identityId ? previous : createTeamSnapshotGuard(identityId);
  if (!Number.isFinite(incoming?.serverNow) || incoming.serverNow < before.serverNow) return { accepted: false, guard: previous };
  const next = includeRun ? incoming.run : null;
  const prior = before.run;
  if (next) {
    if (!Object.hasOwn(PHASE, next.phase) || !Number.isSafeInteger(next.round) || next.round < 1) return { accepted: false, guard: previous };
    if (prior?.fixtureId === next.fixtureId) {
      if (next.round < prior.round || (prior.phase === 'finished' && next.phase !== 'finished')) return { accepted: false, guard: previous };
      if (next.round === prior.round && PHASE[next.phase] < PHASE[prior.phase]) return { accepted: false, guard: previous };
    }
  }
  return { accepted: true, guard: { identityId, serverNow: incoming.serverNow, run: next ? { fixtureId: next.fixtureId, round: next.round, phase: next.phase } : prior } };
}
