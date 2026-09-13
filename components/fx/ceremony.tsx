/**
 * components/fx/ceremony.tsx — full-screen celebration overlay (level-up / achievement / stamp /
 * streak).
 *
 * Dimmed, blurred backdrop; hero card springs in; kicker, title, subtitle, reward chips and a
 * "Continue" button. Accessible: `role="dialog"`, `aria-modal`, focus moved in on open and
 * trapped (Tab / Shift+Tab cycle, focus that escapes is pulled back), Escape closes, body scroll
 * locked, focus restored on close. On open it plays the kind's cue, a success haptic and confetti
 * (particles + a burst behind the hero) — unless `silent`. `slot` renders custom children inside
 * the hero circle (e.g. a 3D scene later). Reduced motion → opacity fades only, no rays spin.
 */
'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, ChevronsUp, Flame, Stamp } from 'lucide-react';
import type { CeremonyKind, CeremonyOptions } from '@/lib/fx/bus';
import { haptic } from '@/lib/fx/haptics';
import { fxColors, particles } from '@/lib/fx/particles';
import { sound, type Cue } from '@/lib/fx/sound';
import { useReducedMotion } from './use-prefs';

/** Ceremony as accepted by React callers. */
export interface CeremonyInput extends CeremonyOptions {
  /** Custom hero content (e.g. a 3D scene). Defaults to a kind icon. */
  slot?: ReactNode;
  /** Called once the ceremony has been dismissed (Continue, Escape or backdrop). */
  onClose?: () => void;
}

export interface CeremonyItem extends CeremonyInput {
  id: string;
}

const KIND_META: Record<CeremonyKind, { kicker: string; title: string; cue: Cue; colors: number[] }> = {
  level: { kicker: 'Level up', title: 'New level reached', cue: 'levelUp', colors: [0, 1, 4] },
  achievement: { kicker: 'Achievement unlocked', title: 'Achievement', cue: 'unlock', colors: [1, 4, 0] },
  stamp: { kicker: 'Stamp collected', title: 'Stamped!', cue: 'stamp', colors: [3, 1, 4] },
  streak: { kicker: 'On fire', title: 'Streak extended', cue: 'streak', colors: [1, 3, 4] },
};

function HeroIcon({ kind }: { kind: CeremonyKind }) {
  const props = { size: 66, strokeWidth: 2.2, 'aria-hidden': true } as const;
  switch (kind) {
    case 'level':
      return <ChevronsUp {...props} />;
    case 'achievement':
      return <Award {...props} />;
    case 'stamp':
      return <Stamp {...props} />;
    default:
      return <Flame {...props} />;
  }
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  item: CeremonyItem;
  reduced: boolean;
  onClose: () => void;
}

function CeremonyDialog({ item, reduced, onClose }: DialogProps) {
  const meta = KIND_META[item.kind];
  const cardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const subtitleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const onCloseCb = item.onClose;

  // Focus management, Escape, focus trap, scroll lock, restore.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const focusFirst = () => (buttonRef.current ?? cardRef.current)?.focus();
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !cardRef.current) return;
      const nodes = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        cardRef.current.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !cardRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !cardRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      if (!cardRef.current || cardRef.current.contains(e.target as Node)) return;
      // Another ceremony may be mounted at the same time (two badges at once). Whoever the focus
      // lands in keeps it; pulling it back here would make the two handlers recurse forever.
      const target = e.target as Element | null;
      if (target?.closest?.('.fx-ceremony-card')) return;
      focusFirst();
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
      onCloseCb?.();
    };
  }, [onCloseCb]);

  // Celebration layers on open.
  useEffect(() => {
    if (item.silent) return;
    sound.play(meta.cue);
    haptic('success');
    const palette = fxColors();
    const colors = meta.colors.map((i) => palette[i]);
    particles.confetti({ from: 'top', count: 150, colors });
    const t = setTimeout(() => {
      const hero = heroRef.current;
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      particles.burst({
        x,
        y,
        count: 34,
        colors,
        shapes: ['star', 'spark', 'circle'],
        speed: 520,
        gravity: 800,
      });
      particles.ringPulse({ x, y, color: colors[0], radius: 110 });
    }, 180);
    return () => clearTimeout(t);
  }, [item.id, item.silent, meta]);

  const spring = { type: 'spring', stiffness: 340, damping: 24, mass: 0.9 } as const;
  const fade = { duration: 0.22 } as const;

  return (
    <>
      <motion.div
        className="fx-ceremony-backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
      />
      <div
        className="fx-ceremony"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={cardRef}
          className="fx-ceremony-card"
          data-kind={item.kind}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={item.subtitle ? subtitleId : undefined}
          tabIndex={-1}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 40 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
          transition={reduced ? fade : spring}
        >
          {!reduced && <div className="fx-ceremony-rays" aria-hidden="true" />}
          <div className="fx-ceremony-kicker">{item.kicker ?? meta.kicker}</div>
          <motion.div
            ref={heroRef}
            className="fx-ceremony-hero"
            initial={reduced ? { opacity: 0 } : { scale: 0, rotate: -18 }}
            animate={reduced ? { opacity: 1 } : { scale: 1, rotate: 0 }}
            transition={reduced ? fade : { type: 'spring', stiffness: 300, damping: 17, delay: 0.12 }}
          >
            {item.slot ?? <HeroIcon kind={item.kind} />}
          </motion.div>
          <h2 id={titleId} className="fx-ceremony-title">
            {item.title ?? meta.title}
          </h2>
          {item.subtitle ? (
            <p id={subtitleId} className="fx-ceremony-subtitle">
              {item.subtitle}
            </p>
          ) : null}
          {item.rewards && item.rewards.length > 0 ? (
            <ul className="fx-ceremony-rewards" aria-label="Rewards">
              {item.rewards.map((r, i) => (
                <motion.li
                  key={`${r.label}-${i}`}
                  className="fx-chip"
                  initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduced ? fade : { delay: 0.28 + i * 0.06, duration: 0.25 }}
                >
                  {r.icon ? <span aria-hidden="true">{r.icon}</span> : null}
                  <span>{r.label}</span>
                  {r.value !== undefined ? <span className="fx-chip-value">{r.value}</span> : null}
                </motion.li>
              ))}
            </ul>
          ) : null}
          <button ref={buttonRef} type="button" className="fx-btn" onClick={onClose}>
            {item.continueLabel ?? 'Continue'}
          </button>
        </motion.div>
      </div>
    </>
  );
}

export interface CeremonyProps {
  ceremony: CeremonyItem | null;
  onClose: () => void;
}

/** Host component rendered by `<FxProvider>`; shows the active ceremony, if any. */
export function Ceremony({ ceremony, onClose }: CeremonyProps) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {ceremony ? (
        <CeremonyDialog key={ceremony.id} item={ceremony} reduced={reduced} onClose={onClose} />
      ) : null}
    </AnimatePresence>
  );
}
