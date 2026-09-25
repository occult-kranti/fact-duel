/**
 * ui/seed.ts — deterministic numbers from a string (a stamp's tilt, a skeleton's line lengths).
 * "Seeded by item id, never random per render" (bible §5).
 */

/** FNV-1a, 32-bit. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A stamp's rotation for a seed: −6° … +8° in half-degree steps (bible §5 h-stamp). */
export function stampAngle(seed: string): number {
  const steps = 28; // (8 − (−6)) / 0.5
  return -6 + (hash32(`stamp:${seed}`) % (steps + 1)) * 0.5;
}
