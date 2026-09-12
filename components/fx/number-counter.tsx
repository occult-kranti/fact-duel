/**
 * components/fx/number-counter.tsx — eased count-up number with tabular digits.
 *
 * `<NumberCounter value={1250} />` animates from the previously displayed number (or `from`
 * on first mount) to `value` over `duration` ms with an ease-out cubic. `to` is accepted as an
 * alias of `value`. With `tick`, a tiny tick cue plays as the integer part changes (throttled).
 * Reduced motion → the number jumps immediately. Renders a `<span class="fx-counter">`.
 */
'use client';
import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { sound } from '@/lib/fx/sound';
import { useReducedMotion } from './use-prefs';

export interface NumberCounterProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Target number. */
  value?: number;
  /** Alias of `value`. */
  to?: number;
  /** Starting number on first mount (defaults to the target, i.e. no initial animation). */
  from?: number;
  /** Animation length in ms (default 900). */
  duration?: number;
  /** Formatter for the displayed number (default: rounded, locale-grouped). */
  format?: (n: number) => string;
  /** Play the `tick` cue while counting. */
  tick?: boolean;
}

const defaultFormat = (n: number): string => Math.round(n).toLocaleString();

export function NumberCounter({
  value,
  to,
  from,
  duration = 900,
  format = defaultFormat,
  tick = false,
  className,
  ...rest
}: NumberCounterProps) {
  const target = to ?? value ?? 0;
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState<number>(from ?? target);
  const current = useRef(display);

  useEffect(() => {
    const start = current.current;
    const end = target;
    if (start === end) return;
    const t0 = performance.now();
    let raf = 0;
    let lastInt = Math.round(start);
    const step = (now: number) => {
      const t = reduced || duration <= 0 ? 1 : Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = t >= 1 ? end : start + (end - start) * eased;
      current.current = v;
      setDisplay(v);
      if (tick) {
        const i = Math.round(v);
        if (i !== lastInt) {
          lastInt = i;
          sound.play('tick', { gain: 0.7 });
        }
      }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced, tick]);

  return (
    <span className={['fx-counter', className].filter(Boolean).join(' ')} {...rest}>
      {format(display)}
    </span>
  );
}
