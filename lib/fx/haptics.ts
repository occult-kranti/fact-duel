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
 * Browsers reject `navigator.vibrate` until the document has seen a real user gesture, and
 * Chromium logs a console error for every rejected call. We therefore stay silent until the
 * first trusted pointer/key/touch event, which costs nothing: no haptic is wanted before the
 * player has touched the page anyway.
 */
let gestureSeen = false;

function armGestureListener(): void {
  if (typeof window === 'undefined' || gestureSeen) return;
  const arm = () => {
    gestureSeen = true;
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
      window.removeEventListener(type, arm, true);
    }
  };
  for (const type of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(type, arm, { capture: true, passive: true });
  }
}

armGestureListener();

/** True once the document has seen a user gesture, so vibration calls are allowed. */
export function hapticsUnlocked(): boolean {
  return gestureSeen;
}

/**
 * Trigger a vibration. Returns true when a pattern was handed to the browser (which may
 * still ignore it — e.g. before any user activation).
 */
export function haptic(kind: HapticKind): boolean {
  if (!gestureSeen || !hapticsSupported() || !getPrefs().haptics) return false;
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
  if (!gestureSeen || !hapticsSupported()) return;
  try {
    navigator.vibrate(0);
  } catch {
    /* ignore */
  }
}
