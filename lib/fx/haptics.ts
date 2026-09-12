/**
 * lib/fx/haptics.ts — vibration feedback via `navigator.vibrate`.
 *
 * `haptic(kind)` maps a semantic kind to a short vibration pattern (milliseconds on/off).
 * It is a silent no-op when the API is unsupported (iOS Safari, desktop), when the user has
 * turned haptics off (`fact-duel-haptics`), or on the server. Patterns are deliberately short
 * so they read as "feel" rather than "alarm".
 */
import { getPrefs } from './prefs';

export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'combo' | 'tick';

/** Vibration patterns in ms: [on, off, on, ...]. */
export const HAPTIC_PATTERNS: Readonly<Record<HapticKind, readonly number[]>> = Object.freeze({
  light: [8],
  medium: [16],
  heavy: [32],
  success: [10, 30, 20],
  error: [40, 20, 40],
  combo: [6, 10, 6, 10, 12],
  tick: [4],
});

/** True when this browser exposes a usable vibration API. */
export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Trigger a vibration. Returns true when a pattern was handed to the browser (which may
 * still ignore it — e.g. before any user activation).
 */
export function haptic(kind: HapticKind): boolean {
  if (!hapticsSupported() || !getPrefs().haptics) return false;
  const pattern = HAPTIC_PATTERNS[kind];
  if (!pattern) return false;
  try {
    return Boolean(navigator.vibrate(pattern as number[]));
  } catch {
    return false;
  }
}

/** Cancel any ongoing vibration. */
export function stopHaptics(): void {
  if (!hapticsSupported()) return;
  try {
    navigator.vibrate(0);
  } catch {
    /* ignore */
  }
}
