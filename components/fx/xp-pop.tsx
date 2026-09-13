/**
 * components/fx/xp-pop.tsx — small inline "+N XP" pill that pops next to an element.
 *
 * Place it inside a `position: relative` parent. Each time `popKey` changes (e.g. pass the new
 * XP total or `Date.now()`), the pill springs in, plays the `xp` cue (pitch scales with the
 * amount) and a tick haptic, then fades out after `duration` ms. Reduced motion → opacity only.
 * The pill is `aria-hidden` (pair it with a toast or a counter for the announcement).
 */
'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { haptic } from '@/lib/fx/haptics';
import { sound } from '@/lib/fx/sound';
import { useReducedMotion } from './use-prefs';

export interface XpPopProps {
  amount: number;
  /** Suffix after the number (default "XP"). */
  label?: string;
  /** Change this value to trigger a pop. Undefined = never shown. */
  popKey?: string | number;
  placement?: 'top' | 'right' | 'left';
  /** Visible time in ms (default 1100). */
  duration?: number;
  /** Skip the sound + haptic. */
  silent?: boolean;
  className?: string;
}

export function XpPop({
  amount,
  label = 'XP',
  popKey,
  placement = 'right',
  duration = 1100,
  silent = false,
  className,
}: XpPopProps) {
  const reduced = useReducedMotion();
  const [hiddenKey, setHiddenKey] = useState<string | number | undefined>(undefined);
  const visible = popKey !== undefined && popKey !== hiddenKey && amount !== 0;

  useEffect(() => {
    if (popKey === undefined) return;
    if (!silent) {
      sound.play('xp', { n: Math.abs(amount) });
      haptic('tick');
    }
    const id = setTimeout(() => setHiddenKey(popKey), duration);
    return () => clearTimeout(id);
    // `amount` intentionally excluded: a pop is keyed by popKey only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popKey, duration, silent]);

  const sign = amount > 0 ? '+' : '';
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          key={String(popKey)}
          className={['fx-xp-pop', className].filter(Boolean).join(' ')}
          data-placement={placement}
          aria-hidden="true"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 6 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -14 }}
          transition={reduced ? { duration: 0.18 } : { type: 'spring', stiffness: 520, damping: 22 }}
        >
          {sign}
          {Math.round(amount).toLocaleString()} {label}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
