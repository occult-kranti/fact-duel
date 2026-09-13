/**
 * lib/fx/bus.ts — tiny typed event bus for the juice system.
 *
 * Non-React code (game engines, timers, network handlers) can request feedback without
 * knowing about the DOM layer: `fx.emit('confetti', { from: 'top' })`. `<FxProvider>`
 * subscribes to every kind and routes it to the particle engine, the toast stack, the
 * ceremony host or the shake helper. Handlers are invoked synchronously, in registration
 * order; a throwing handler never prevents the others from running.
 *
 * Payload types for the React-facing layers (toast / ceremony) live here too so that the bus
 * stays React-free: icons are plain strings (emoji or short text) at this level — the React
 * hook `useJuice()` widens them to `ReactNode`.
 */
import type {
  BurstOptions,
  CoinFountainOptions,
  ConfettiOptions,
  FloatTextOptions,
  Point,
  RingPulseOptions,
  SparkleOptions,
} from './particles';

export type ToastKind = 'xp' | 'quest' | 'achievement' | 'streak' | 'gem' | 'info';

export interface ToastOptions {
  /** Stable id; a toast with the same id replaces the previous one instead of stacking. */
  id?: string;
  title: string;
  body?: string;
  kind: ToastKind;
  /** Emoji / short text icon. React callers can pass any ReactNode through `useJuice()`. */
  icon?: string;
  /** Auto-dismiss delay in ms (default 3200). */
  duration?: number;
  /** Skip the sound + haptic that normally accompany the toast. */
  silent?: boolean;
}

export type CeremonyKind = 'level' | 'achievement' | 'stamp' | 'streak';

export interface CeremonyReward {
  label: string;
  /** Emoji / short text icon. */
  icon?: string;
  /** Optional value shown after the label, e.g. `+250`. */
  value?: string | number;
}

export interface CeremonyOptions {
  kind: CeremonyKind;
  /** Small uppercase line above the title, e.g. "LEVEL UP". Defaults per kind. */
  kicker?: string;
  title?: string;
  subtitle?: string;
  rewards?: CeremonyReward[];
  continueLabel?: string;
  /** Skip the sound, haptic and confetti that normally accompany the ceremony. */
  silent?: boolean;
}

export interface ShakeEvent {
  /** Element to shake; defaults to the document body. */
  target?: Element;
  /** 1 = default amplitude (~6px). */
  intensity?: number;
}

export interface FxEventMap {
  burst: BurstOptions;
  confetti: ConfettiOptions;
  sparkle: SparkleOptions;
  floatText: FloatTextOptions;
  ringPulse: RingPulseOptions;
  coinFountain: CoinFountainOptions;
  shake: ShakeEvent;
  toast: ToastOptions;
  ceremony: CeremonyOptions;
}

export type FxKind = keyof FxEventMap;
export type FxHandler<K extends FxKind> = (payload: FxEventMap[K]) => void;

type HandlerSets = { [K in FxKind]?: Set<FxHandler<K>> };

const handlers: HandlerSets = {};

function setFor<K extends FxKind>(kind: K): Set<FxHandler<K>> {
  let set = handlers[kind] as Set<FxHandler<K>> | undefined;
  if (!set) {
    set = new Set<FxHandler<K>>();
    (handlers as Record<string, unknown>)[kind] = set;
  }
  return set;
}

export const fx = {
  /** Broadcast an event to every handler registered for `kind`. */
  emit<K extends FxKind>(kind: K, payload: FxEventMap[K]): void {
    const set = handlers[kind] as Set<FxHandler<K>> | undefined;
    if (!set || set.size === 0) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[fx] handler for "${kind}" failed`, err);
      }
    }
  },
  /** Register a handler; returns an unsubscribe function. */
  on<K extends FxKind>(kind: K, handler: FxHandler<K>): () => void {
    const set = setFor(kind);
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  },
  /** Number of handlers currently listening for `kind` (mainly for diagnostics). */
  count(kind: FxKind): number {
    return handlers[kind]?.size ?? 0;
  },
} as const;

/** Viewport-space centre of an element — the natural origin for bursts and float text. */
export function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Resolve an `Element | Point` target into a viewport point. */
export function pointOf(target: Element | Point): Point {
  return 'getBoundingClientRect' in target ? centerOf(target) : { x: target.x, y: target.y };
}
