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
 * - exposes `FxContext` (`useFx()`) with the toast / ceremony state and controls.
 */
'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fx } from '@/lib/fx/bus';
import { particles } from '@/lib/fx/particles';
import { sound } from '@/lib/fx/sound';
import { Ceremony, type CeremonyInput, type CeremonyItem } from './ceremony';
import { FxCanvas } from './fx-canvas';
import { shake } from './shake';
import { ToastStack, TOAST_MAX_VISIBLE, type ToastInput, type ToastItem } from './toast-stack';
import { useMounted, useReducedMotion } from './use-prefs';
import './fx.css';

export interface FxContextValue {
  /** True once the client overlays are mounted. */
  ready: boolean;
  toasts: ToastItem[];
  /** Push a toast; returns its id. A toast with an existing id replaces that toast. */
  toast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  ceremony: CeremonyItem | null;
  /** Open a ceremony (replaces any open one); returns its id. */
  openCeremony: (input: CeremonyInput) => string;
  closeCeremony: () => void;
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
  /** Max toasts visible at once (default 3). */
  maxToasts?: number;
}

export function FxProvider({ children, maxToasts = TOAST_MAX_VISIBLE }: FxProviderProps) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ceremony, setCeremony] = useState<CeremonyItem | null>(null);

  const toast = useCallback((input: ToastInput): string => {
    const id = input.id ?? nextId('toast');
    const item: ToastItem = { ...input, id };
    setToasts((list) => {
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) return [...list, item];
      const next = list.slice();
      next[idx] = item;
      return next;
    });
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  const openCeremony = useCallback((input: CeremonyInput): string => {
    const id = nextId('ceremony');
    setCeremony({ ...input, id });
    return id;
  }, []);

  const closeCeremony = useCallback(() => setCeremony(null), []);

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
    }),
    [mounted, toasts, toast, dismissToast, clearToasts, ceremony, openCeremony, closeCeremony],
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
