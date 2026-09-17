/**
 * components/fx/fx-provider.tsx — `<FxProvider>`: mounts the juice system.
 *
 * Wrap the app once, near the root (it renders fixed-position layers, so avoid ancestors with
 * `transform`/`filter`). It:
 * - renders children immediately (SSR-friendly) and, only after mounting on the client, the
 *   particle canvas, the toast stack and the ceremony host — nothing of its own on the server;
 * - installs a capturing pointerdown/keydown/touchend listener that unlocks the AudioContext;
 * - subscribes to the `fx` bus so non-React code can trigger particles, shakes, toasts and
 *   ceremonies;
 * - runs every overlay through the pop-up budget (`./overlay-budget.ts`), which is the single
 *   answer to "how many pop-ups may the player see": at most two on screen, never two in the same
 *   instant, a ceremony takes the whole budget, same-kind toasts in one burst merge, and nothing
 *   at all opens while `setQuiet(true)` is on (a live question). A ceremony also outranks a toast:
 *   it jumps queued toasts and sends on-screen ones back to the queue (they return, unchanged,
 *   once it closes), because a full-screen moment belongs to the screen that raised it;
 * - exposes `FxContext` (`useFx()`) with the toast / ceremony state and controls.
 */
'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { fx } from '@/lib/fx/bus';
import { particles } from '@/lib/fx/particles';
import { sound } from '@/lib/fx/sound';
import { Ceremony, type CeremonyInput, type CeremonyItem } from './ceremony';
import { FxCanvas } from './fx-canvas';
import { createOverlayBudget, type OverlayBudget, type OverlayGrant } from './overlay-budget';
import { shake } from './shake';
import { ToastStack, TOAST_MAX_VISIBLE, type ToastInput, type ToastItem } from './toast-stack';
import { useMounted, useReducedMotion } from './use-prefs';
import './fx.css';

export interface FxContextValue {
  /** True once the client overlays are mounted. */
  ready: boolean;
  /** The toasts the budget has let on screen (at most two). */
  toasts: ToastItem[];
  /**
   * Ask for a toast; returns the id of the overlay it will appear under — its own, or the id of
   * the burst it merged into. A toast with an id that is already live updates that toast instead.
   */
  toast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  /** The ceremony the budget has let on screen, if any. */
  ceremony: CeremonyItem | null;
  /**
   * Ask for a ceremony; returns its id. It needs the whole budget, so it opens as soon as the
   * budget can be cleared for it: ahead of any queued toast, and without waiting out the 1200 ms
   * gap when nothing is on screen. Only another open ceremony makes it wait.
   */
  openCeremony: (input: CeremonyInput) => string;
  closeCeremony: () => void;
  /** Overlays waiting for a slot. */
  pendingOverlays: number;
  /** Hold every overlay back — a live question. Anything already on screen stays. */
  setQuiet: (quiet: boolean) => void;
}

export const FxContext = createContext<FxContextValue | null>(null);

/** Access the provider state; null when rendered outside `<FxProvider>`. */
export function useFx(): FxContextValue | null {
  return useContext(FxContext);
}

let seq = 0;
const nextId = (prefix: string): string => `${prefix}-${++seq}-${Date.now().toString(36)}`;

export interface FxProviderProps {
  children?: ReactNode;
  /** Max toasts visible at once (default 2, and the budget will not hand out more anyway). */
  maxToasts?: number;
}

/** What the budget carries: a toast, or a ceremony. `grant.type` says which. */
type OverlayPayload = ToastItem | CeremonyItem;

/**
 * One grant becomes one toast. When a burst merged, the first item's `merge` writes the combined
 * copy — the budget groups, the caller owns the words — and the group's id is the dismiss handle.
 */
function toastFromGrant(grant: OverlayGrant<OverlayPayload>): ToastItem {
  const items = grant.items as readonly ToastItem[];
  const head = items[0];
  const copy = items.length > 1 && head.merge ? head.merge(items.slice()) : head;
  return { ...copy, id: grant.id };
}

export function FxProvider({ children, maxToasts = TOAST_MAX_VISIBLE }: FxProviderProps) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  // One budget per provider, created on first render and never swapped (its identity is what the
  // `useSyncExternalStore` subscription and every callback below hang off).
  const [budget] = useState<OverlayBudget<OverlayPayload>>(() => createOverlayBudget<OverlayPayload>());

  const snapshot = useSyncExternalStore(budget.subscribe, budget.getSnapshot, budget.getSnapshot);
  const toasts = useMemo(
    () => snapshot.active.filter((g) => g.type === 'toast').map(toastFromGrant),
    [snapshot],
  );
  const ceremony = useMemo(() => {
    const grant = snapshot.active.find((g) => g.type === 'ceremony');
    return grant ? (grant.items[0] as CeremonyItem) : null;
  }, [snapshot]);

  const toast = useCallback(
    (input: ToastInput): string => {
      const id = input.id ?? nextId('toast');
      const item: ToastItem = { ...input, id };
      return budget.request({ id, type: 'toast', mergeKey: input.mergeKey, payload: item });
    },
    [budget],
  );

  const dismissToast = useCallback(
    (id: string) => {
      budget.release(id);
    },
    [budget],
  );

  const clearToasts = useCallback(() => budget.clear('toast'), [budget]);

  // A single commit can raise several ceremonies (a stamp plus a level-up, two badges at once).
  // The budget queues them and plays one at a time instead of overwriting each other — in ask
  // order, since one ceremony never jumps another.
  const openCeremony = useCallback(
    (input: CeremonyInput): string => {
      const id = nextId('ceremony');
      const item: CeremonyItem = { ...input, id };
      budget.request({ id, type: 'ceremony', payload: item });
      return id;
    },
    [budget],
  );

  const closeCeremony = useCallback(() => {
    const open = budget.getSnapshot().active.find((g) => g.type === 'ceremony');
    if (open) budget.release(open.id);
  }, [budget]);

  const setQuiet = useCallback((quiet: boolean) => budget.setQuiet(quiet), [budget]);

  // Unlock audio on the first user gesture (and re-resume after interruptions).
  useEffect(() => {
    const unlock = () => sound.unlock();
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('pointerdown', unlock, opts);
    window.addEventListener('keydown', unlock, opts);
    window.addEventListener('touchend', unlock, opts);
    return () => {
      window.removeEventListener('pointerdown', unlock, opts);
      window.removeEventListener('keydown', unlock, opts);
      window.removeEventListener('touchend', unlock, opts);
    };
  }, []);

  // Route bus events to the engines and overlays.
  useEffect(() => {
    const offs = [
      fx.on('burst', (o) => particles.burst(o)),
      fx.on('confetti', (o) => particles.confetti(o)),
      fx.on('sparkle', (o) => particles.sparkle(o)),
      fx.on('floatText', (o) => particles.floatText(o)),
      fx.on('ringPulse', (o) => particles.ringPulse(o)),
      fx.on('coinFountain', (o) => particles.coinFountain(o)),
      fx.on('shake', (o) => shake(o.target ?? document.body, o.intensity)),
      fx.on('toast', (o) => toast(o)),
      fx.on('ceremony', (o) => openCeremony(o)),
    ];
    return () => offs.forEach((off) => off());
  }, [toast, openCeremony]);

  // Let CSS know about the reduced-motion decision (pref OR media query).
  useEffect(() => {
    document.documentElement.classList.toggle('fx-reduced', reduced);
    return () => document.documentElement.classList.remove('fx-reduced');
  }, [reduced]);

  const value = useMemo<FxContextValue>(
    () => ({
      ready: mounted,
      toasts,
      toast,
      dismissToast,
      clearToasts,
      ceremony,
      openCeremony,
      closeCeremony,
      pendingOverlays: snapshot.queued.length,
      setQuiet,
    }),
    [
      mounted,
      toasts,
      toast,
      dismissToast,
      clearToasts,
      ceremony,
      openCeremony,
      closeCeremony,
      snapshot.queued.length,
      setQuiet,
    ],
  );

  return (
    <FxContext.Provider value={value}>
      {children}
      {mounted ? (
        <>
          <FxCanvas elevated={ceremony !== null} />
          <ToastStack toasts={toasts} onDismiss={dismissToast} max={maxToasts} />
          <Ceremony ceremony={ceremony} onClose={closeCeremony} />
        </>
      ) : null}
    </FxContext.Provider>
  );
}
