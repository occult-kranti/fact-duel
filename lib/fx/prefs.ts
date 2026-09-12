/**
 * lib/fx/prefs.ts — user preferences for the juice system (sound, volume, haptics, motion).
 *
 * Reads and writes the SAME localStorage keys the existing settings dialog already uses
 * (`fact-duel-online-sound`, `fact-duel-volume`) plus two new ones (`fact-duel-haptics`,
 * `fact-duel-motion`), so the current UI keeps working unchanged.
 *
 * - Pure TypeScript, no React, SSR-safe: every access to `window` / `localStorage` /
 *   `matchMedia` is guarded, and on the server `getPrefs()` returns the defaults.
 * - `getPrefs()` re-reads storage on every call (four cheap `getItem`s) so writes made by
 *   other code in the same tab (e.g. the arena settings dialog) are always honoured, but it
 *   returns a referentially-stable object while nothing changed — safe for
 *   `useSyncExternalStore`.
 * - `subscribePrefs(cb)` fires on cross-tab `storage` events, on in-tab `setPref()` calls and
 *   when the OS `prefers-reduced-motion` media query flips.
 */

export type MotionPref = 'full' | 'reduced';

export interface FxPrefs {
  /** Sound effects enabled. Key `fact-duel-online-sound` ('on' | 'off'), default on. */
  sound: boolean;
  /** Master volume 0..1. Key `fact-duel-volume` (stringified number), default 0.35. */
  volume: number;
  /** Vibration enabled. Key `fact-duel-haptics` ('on' | 'off'), default on. */
  haptics: boolean;
  /** Motion preference. Key `fact-duel-motion` ('full' | 'reduced'); default follows the OS. */
  motion: MotionPref;
}

export type PrefKey = keyof FxPrefs;

/** localStorage keys, exported so other code can react to them if it needs to. */
export const PREF_STORAGE_KEYS: Record<PrefKey, string> = {
  sound: 'fact-duel-online-sound',
  volume: 'fact-duel-volume',
  haptics: 'fact-duel-haptics',
  motion: 'fact-duel-motion',
};

export const DEFAULT_PREFS: Readonly<FxPrefs> = Object.freeze({
  sound: true,
  volume: 0.35,
  haptics: true,
  motion: 'full',
});

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type Listener = (prefs: FxPrefs) => void;

const listeners = new Set<Listener>();
let cached: FxPrefs = { ...DEFAULT_PREFS };
let globalHooksInstalled = false;

const hasWindow = (): boolean => typeof window !== 'undefined';

function readItem(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — prefs simply don't persist */
  }
}

/** True when the OS asks for reduced motion (false on the server). */
export function systemReducedMotion(): boolean {
  if (!hasWindow() || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch {
    return false;
  }
}

function readPrefs(): FxPrefs {
  const soundRaw = readItem(PREF_STORAGE_KEYS.sound);
  const volumeRaw = readItem(PREF_STORAGE_KEYS.volume);
  const hapticsRaw = readItem(PREF_STORAGE_KEYS.haptics);
  const motionRaw = readItem(PREF_STORAGE_KEYS.motion);
  const volumeNum = volumeRaw === null ? NaN : Number(volumeRaw);
  return {
    sound: soundRaw === null ? DEFAULT_PREFS.sound : soundRaw !== 'off',
    volume: Number.isFinite(volumeNum) ? Math.min(1, Math.max(0, volumeNum)) : DEFAULT_PREFS.volume,
    haptics: hapticsRaw === null ? DEFAULT_PREFS.haptics : hapticsRaw !== 'off',
    motion:
      motionRaw === 'reduced' || motionRaw === 'full'
        ? motionRaw
        : systemReducedMotion()
          ? 'reduced'
          : 'full',
  };
}

function same(a: FxPrefs, b: FxPrefs): boolean {
  return a.sound === b.sound && a.volume === b.volume && a.haptics === b.haptics && a.motion === b.motion;
}

/**
 * Current preferences. Always fresh (re-reads storage), but the returned object is the same
 * reference as the previous call when nothing changed.
 */
export function getPrefs(): FxPrefs {
  if (!hasWindow()) return cached;
  const next = readPrefs();
  if (!same(cached, next)) cached = next;
  return cached;
}

/** Server snapshot for `useSyncExternalStore` — the defaults, never touches storage. */
export function getServerPrefs(): FxPrefs {
  return DEFAULT_PREFS as FxPrefs;
}

function notify(): void {
  const prefs = getPrefs();
  for (const cb of Array.from(listeners)) {
    try {
      cb(prefs);
    } catch (err) {
      console.error('[fx/prefs] listener failed', err);
    }
  }
}

function installGlobalHooks(): void {
  if (globalHooksInstalled || !hasWindow()) return;
  globalHooksInstalled = true;
  window.addEventListener('storage', (e) => {
    if (e.key === null || Object.values(PREF_STORAGE_KEYS).includes(e.key)) notify();
  });
  if (typeof window.matchMedia === 'function') {
    try {
      const mql = window.matchMedia(REDUCED_MOTION_QUERY);
      const onChange = () => notify();
      if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
      else mql.addListener(onChange);
    } catch {
      /* matchMedia unsupported */
    }
  }
}

/** Persist one preference and notify in-tab subscribers. */
export function setPref<K extends PrefKey>(key: K, value: FxPrefs[K]): void {
  let raw: string;
  switch (key) {
    case 'sound':
    case 'haptics':
      raw = value ? 'on' : 'off';
      break;
    case 'volume':
      raw = String(Math.min(1, Math.max(0, Number(value) || 0)));
      break;
    case 'motion':
      raw = value === 'reduced' ? 'reduced' : 'full';
      break;
    default:
      return;
  }
  writeItem(PREF_STORAGE_KEYS[key], raw);
  notify();
}

/**
 * Subscribe to preference changes (storage event from other tabs, in-tab `setPref()`, and OS
 * reduced-motion changes). Returns an unsubscribe function. No-op on the server.
 */
export function subscribePrefs(cb: Listener): () => void {
  installGlobalHooks();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Reduced motion is honoured when EITHER the user pref OR the OS media query asks for it. */
export function reducedMotion(): boolean {
  return getPrefs().motion === 'reduced' || systemReducedMotion();
}
