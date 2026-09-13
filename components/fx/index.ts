/**
 * components/fx/index.ts — public entry point for the juice system.
 *
 *   import { FxProvider, useJuice, NumberCounter, XpPop } from '@/components/fx';
 *
 * Re-exports the React layer (provider, hooks, components) and the pure engines from `lib/fx`
 * (sound, haptics, particles, bus, prefs) so consumers need a single import path.
 */
export { FxProvider, FxContext, useFx, type FxContextValue, type FxProviderProps } from './fx-provider';
export {
  useJuice,
  createJuice,
  type Juice,
  type BurstPreset,
  type ConfettiPreset,
  type JuiceTarget,
  type BurstExtra,
} from './use-juice';
export { NumberCounter, type NumberCounterProps } from './number-counter';
export { XpPop, type XpPopProps } from './xp-pop';
export {
  ToastStack,
  TOAST_DURATION_MS,
  TOAST_MAX_VISIBLE,
  type ToastInput,
  type ToastItem,
  type ToastStackProps,
} from './toast-stack';
export { Ceremony, type CeremonyInput, type CeremonyItem, type CeremonyProps } from './ceremony';
export { FxCanvas, type FxCanvasProps } from './fx-canvas';
export { shake, SHAKE_DURATION_MS } from './shake';
export { usePrefs, useReducedMotion, useMounted } from './use-prefs';

export { sound, SoundEngine, CUES, CUE_THROTTLE_MS, TRIM, type Cue, type PlayOptions } from '@/lib/fx/sound';
export {
  haptic,
  stopHaptics,
  hapticsSupported,
  hapticsUnlocked,
  HAPTIC_PATTERNS,
  type HapticKind,
} from '@/lib/fx/haptics';
export {
  particles,
  ParticleEngine,
  fxColors,
  FX_FALLBACK_COLORS,
  type Particle,
  type ParticleShape,
  type Point,
  type BurstOptions,
  type ConfettiOptions,
  type SparkleOptions,
  type FloatTextOptions,
  type RingPulseOptions,
  type CoinFountainOptions,
} from '@/lib/fx/particles';
export {
  fx,
  centerOf,
  pointOf,
  type FxEventMap,
  type FxKind,
  type FxHandler,
  type ToastKind,
  type ToastOptions,
  type CeremonyKind,
  type CeremonyOptions,
  type CeremonyReward,
  type ShakeEvent,
} from '@/lib/fx/bus';
export {
  getPrefs,
  setPref,
  subscribePrefs,
  reducedMotion,
  systemReducedMotion,
  PREF_STORAGE_KEYS,
  DEFAULT_PREFS,
  type FxPrefs,
  type PrefKey,
  type MotionPref,
} from '@/lib/fx/prefs';
