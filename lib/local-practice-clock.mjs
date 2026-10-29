/** Map the local engine's wall-clock issue stamp onto the monotonic UI clock.
 * Used only by static JHK bot practice. Server and Hisaab timing keep their contracts.
 * Rendering/storage delay consumes the same clock budget already enforced by the engine.
 */
export function localPracticeStartAt({ now, wallNow, issuedAt, useIssueTime }) {
  if (!useIssueTime || !Number.isFinite(issuedAt) || !Number.isFinite(wallNow)) return now;
  return now - Math.max(0, wallNow - issuedAt);
}

/** Best-effort bookkeeping must never block a timed question response.
 * One in-flight task per key; failures are handled and may be retried by a later snapshot.
 * Success deduplication remains with the caller's exposure/reservation records.
 */
export function createBackgroundTaskQueue() {
  const pending = new Map();
  return (key, work) => {
    if (pending.has(key)) return pending.get(key);
    const task = Promise.resolve().then(work).then(() => true, () => false)
      .finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  };
}
