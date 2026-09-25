/**
 * ui/toast.tsx — `h-toast` host (bible §5, §9). The shell mounts <ToastHost/> once; screens never
 * render toasts themselves — they ask the budget (`useBudget().toast(…)`), which allows ONE per
 * screen visit. Top-centre under the top bar, max 360px, 4 s (paused on hover/focus), swipe or × to
 * close, role="status". Never during a live question (the budget holds them).
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CalendarCheck, Info, ScrollText, Sparkles, X } from 'lucide-react';
import { sound } from '@/lib/fx/sound';
import { budget, TOAST_MS, useBudgetSnapshot, type BudgetToast } from '../budget';
import { cx } from './cx';
import './toast.css';

const ICON = { info: Info, quest: ScrollText, streak: CalendarCheck, xp: Sparkles } as const;

function ToastCard({ toast }: { toast: BudgetToast }) {
  const [paused, setPaused] = useState(false);
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const Icon = ICON[toast.tone] ?? Info;

  useEffect(() => {
    if (toast.tone === 'quest') sound.play('quest');
  }, [toast.id, toast.tone]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => budget.dismissToast(toast.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.count]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    start.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (start.current !== null) setDx(e.clientX - start.current);
  };
  const onUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (Math.abs(dx) > 64) budget.dismissToast(toast.id);
    else setDx(0);
  };

  return (
    <div
      className={cx('h-toast', `h-toast--${toast.tone}`)}
      style={dx ? { transform: `translateX(${dx}px)`, opacity: Math.max(0.2, 1 - Math.abs(dx) / 200) } : undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <span className="h-toast__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2.4} />
      </span>
      <span className="h-toast__text">
        <span className="h-toast__title">{toast.title}</span>
        {toast.body ? <span className="h-toast__body">{toast.body}</span> : null}
      </span>
      <button type="button" className="h-toast__close" aria-label="Dismiss" onClick={() => budget.dismissToast(toast.id)}>
        <X aria-hidden="true" size={18} strokeWidth={2.6} />
      </button>
    </div>
  );
}

export function ToastHost() {
  const { toasts } = useBudgetSnapshot();
  return (
    <div className="h-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
