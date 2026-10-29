/** Human-first quick play. Bots are local practice and never enter the ranked room. */
export const BOT_FALLBACK_MS = 5000;

/**
 * Keep the deadline independent of network latency. A queue response may arrive after
 * cancellation; retain it long enough to leave its room instead of reviving the search.
 */
export function startMatchSearch({ queue, snapshot, leave, onHuman, onBot, onWaiting = () => {}, onError = () => {},
  setTimer = setTimeout, clearTimer = clearTimeout, timeoutMs = BOT_FALLBACK_MS, pollMs = 500 }) {
  let state = 'searching', roomId = null, pollTimer = null;
  const abandoned = new Set();
  const cleanup = id => {
    if (!id || abandoned.has(id)) return;
    abandoned.add(id);
    Promise.resolve().then(() => leave(id)).catch(() => {});
  };
  const stopTimers = () => { clearTimer(deadline); if (pollTimer !== null) clearTimer(pollTimer); };
  const finish = next => {
    if (state !== 'searching') return false;
    state = next; stopTimers();
    return true;
  };
  const deadline = setTimer(() => {
    if (!finish('bot')) return;
    cleanup(roomId);
    onBot();
  }, timeoutMs);
  const accept = data => {
    const match = data?.match;
    if (!match?.id) return false;
    if (state !== 'searching') { if (state !== 'human') cleanup(match.id); return false; }
    roomId = match.id;
    if (match.players?.length > 1 && !['finished', 'cancelled'].includes(match.phase)) {
      if (finish('human')) onHuman(data);
      return true;
    }
    onWaiting(data);
    return false;
  };
  const poll = async () => {
    if (state !== 'searching' || !roomId) return;
    try { if (accept(await snapshot(roomId))) return; }
    catch (error) { if (state === 'searching') onError(error); }
    if (state === 'searching') pollTimer = setTimer(poll, pollMs);
  };
  Promise.resolve().then(() => queue(() => state === 'searching')).then(data => {
    if (!accept(data) && state === 'searching' && roomId) pollTimer = setTimer(poll, pollMs);
  }).catch(error => { if (state === 'searching') onError(error); });
  return {
    get state() { return state; },
    cancel() { if (finish('cancelled')) cleanup(roomId); },
  };
}
