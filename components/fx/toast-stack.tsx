/**
 * components/fx/toast-stack.tsx — stacked, queued notification toasts.
 *
 * Rendered by `<FxProvider>`; you normally push toasts via `useJuice().toast(...)` or
 * `fx.emit('toast', ...)`. Max 3 visible (the rest wait in order), auto-dismiss after 3.2 s,
 * timer pauses while hovered or focused. Bottom-centre on ≤ 768 px (with safe-area inset),
 * top-right on desktop. The container is `aria-live="polite"`; every toast has a 44 px close
 * button. Enter/exit animation via `motion/react`; reduced motion → opacity fades only.
 */
'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Flame, Gem, Info, ScrollText, Sparkles, Trophy, X } from 'lucide-react';
import type { ToastKind, ToastOptions } from '@/lib/fx/bus';
import { haptic } from '@/lib/fx/haptics';
import { sound, type Cue } from '@/lib/fx/sound';
import { useReducedMotion } from './use-prefs';

/** Toast as accepted by React callers: `icon` may be any ReactNode. */
export interface ToastInput extends Omit<ToastOptions, 'icon'> {
  icon?: ReactNode;
}

/** Toast as stored in the provider (always has an id). */
export interface ToastItem extends ToastInput {
  id: string;
}

export const TOAST_DURATION_MS = 3200;
export const TOAST_MAX_VISIBLE = 3;

const KIND_CUE: Record<ToastKind, Cue> = {
  xp: 'xp',
  quest: 'quest',
  achievement: 'unlock',
  streak: 'streak',
  gem: 'gem',
  info: 'tap',
};

function KindIcon({ kind }: { kind: ToastKind }) {
  const props = { size: 20, strokeWidth: 2.2, 'aria-hidden': true } as const;
  switch (kind) {
    case 'xp':
      return <Sparkles {...props} />;
    case 'quest':
      return <ScrollText {...props} />;
    case 'achievement':
      return <Trophy {...props} />;
    case 'streak':
      return <Flame {...props} />;
    case 'gem':
      return <Gem {...props} />;
    default:
      return <Info {...props} />;
  }
}

interface ToastCardProps {
  toast: ToastItem;
  reduced: boolean;
  onDismiss: () => void;
}

function ToastCard({ toast, reduced, onDismiss }: ToastCardProps) {
  const [paused, setPaused] = useState(false);
  const duration = toast.duration ?? TOAST_DURATION_MS;
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  // Sound + haptic when the toast becomes visible (which is when it mounts).
  useEffect(() => {
    if (toast.silent) return;
    sound.play(KIND_CUE[toast.kind] ?? 'tap');
    haptic('light');
  }, [toast.kind, toast.silent]);

  // Auto-dismiss timer that can be paused/resumed.
  useEffect(() => {
    if (paused) return;
    startedAt.current = performance.now();
    const id = setTimeout(() => dismissRef.current(), remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
    };
  }, [paused]);

  return (
    <motion.div
      layout={!reduced}
      className="fx-toast"
      data-kind={toast.kind}
      data-paused={paused ? 'true' : 'false'}
      style={{ '--_dur': `${duration}ms` } as React.CSSProperties}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.96 }}
      transition={reduced ? { duration: 0.18 } : { type: 'spring', stiffness: 420, damping: 30 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="fx-toast-icon">{toast.icon ?? <KindIcon kind={toast.kind} />}</div>
      <div className="fx-toast-text">
        <div className="fx-toast-title">{toast.title}</div>
        {toast.body ? <div className="fx-toast-body">{toast.body}</div> : null}
      </div>
      <button type="button" className="fx-toast-close" aria-label="Dismiss notification" onClick={onDismiss}>
        <X size={18} aria-hidden="true" />
      </button>
      {!reduced && <div className="fx-toast-bar" aria-hidden="true" />}
    </motion.div>
  );
}

export interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  /** Visible at once; the rest queue (default 3). */
  max?: number;
}

export function ToastStack({ toasts, onDismiss, max = TOAST_MAX_VISIBLE }: ToastStackProps) {
  const reduced = useReducedMotion();
  const visible = toasts.slice(0, max);
  return (
    <div className="fx-toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((t) => (
          <ToastCard key={t.id} toast={t} reduced={reduced} onDismiss={() => onDismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
