/** Small, deterministic practice-shot model. Metres, seconds, m/s; no quiz rewards. */
export const DELIVERY_MS = 1800;
export const CONTACT_MS = 1180;
export const GRAVITY = 9.81;

export function shotForTiming(elapsedMs) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const accuracy = Math.max(0, 1 - Math.abs(elapsed - CONTACT_MS) / 680);
  const speed = 9 + accuracy * 16;
  const angle = 38 * Math.PI / 180;
  const vx = speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);
  const flight = 2 * vy / GRAVITY;
  const distance = vx * flight;
  const runs = accuracy < .15 ? 0 : distance >= 53 ? 6 : distance >= 35 ? 4 : 1;
  return Object.freeze({accuracy, vx, vy, flight, distance, runs});
}

export function sampleFlight(shot, seconds) {
  const t = Math.min(shot.flight, Math.max(0, Number.isFinite(seconds) ? seconds : 0));
  return { x: shot.vx * t, height: Math.max(0, shot.vy * t - .5 * GRAVITY * t * t), done: t >= shot.flight };
}
