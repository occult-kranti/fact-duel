/**
 * components/fx/use-juice.ts — `useJuice()`: one hook, every layer of feedback.
 *
 * Each helper combines the right layers for the moment: e.g. `burst(el, 'correct')` fires a
 * particle burst + ring pulse at the element, the `correct` cue and a success haptic;
 * `burst(el, 'wrong')` adds a shake. Sound / haptics / particles run through the shared engines
 * (so they work anywhere), while toasts and ceremonies go to the nearest `<FxProvider>` (or,
 * without one, over the `fx` bus so a provider elsewhere in the tree can pick them up).
 *
 * `createJuice()` is the non-hook variant for imperative code.
 */
'use client';
import { useMemo, type ReactNode } from 'react';
import { fx, pointOf, type CeremonyOptions, type ToastOptions } from '@/lib/fx/bus';
import { haptic as vibrate, type HapticKind } from '@/lib/fx/haptics';
import { fxColors, particles, type ParticleShape, type Point } from '@/lib/fx/particles';
import { sound as engine, type Cue, type PlayOptions } from '@/lib/fx/sound';
import type { CeremonyInput } from './ceremony';
import { useFx, type FxContextValue } from './fx-provider';
import { shake as shakeEl } from './shake';
import type { ToastInput } from './toast-stack';

export type BurstPreset = 'correct' | 'wrong' | 'win' | 'gem' | 'levelUp' | 'stamp' | 'combo';
export type ConfettiPreset = 'win' | 'levelUp' | 'achievement' | 'stamp' | 'streak' | 'rain';
export type JuiceTarget = Element | Point;

export interface BurstExtra {
  /** Combo depth (for the `combo` preset). */
  n?: number;
}

export interface Juice {
  /** Play a sound cue. Returns the cue length in seconds (0 if skipped). */
  sound: (cue: Cue, opts?: PlayOptions) => number;
  /** Vibrate (no-op when unsupported or disabled). */
  haptic: (kind: HapticKind) => boolean;
  /** Particles + cue + haptic at an element or point. */
  burst: (target: JuiceTarget, preset: BurstPreset, extra?: BurstExtra) => void;
  /** Rising, fading label at an element or point (plays the `xp` cue, pitch from any number in the text). */
  floatText: (target: JuiceTarget, text: string, color?: string) => void;
  /** Full-screen confetti (ring pulse under reduced motion) + success haptic. */
  confetti: (preset?: ConfettiPreset) => void;
  /**
   * The loss counterpart to `confetti`: a card being placed on a table, not a consolation prize.
   * One cyan ring pulse and the `kept` cue, no confetti path at any intensity, no downward motion.
   */
  settle: (target?: JuiceTarget) => void;
  /** Shake an element (default: the page) + medium haptic. */
  shake: (target?: Element | null, intensity?: number) => void;
  /** Show a toast; returns its id. Sound + haptic play when it becomes visible. */
  toast: (input: ToastInput) => string;
  /** Open a ceremony overlay; returns its id. Cue + haptic + confetti play on open. */
  ceremony: (input: CeremonyInput) => string;
  dismissToast: (id: string) => void;
  closeCeremony: () => void;
}

const numberIn = (text: string): number | undefined => {
  const m = /-?\d+(?:[.,]\d+)?/.exec(text);
  return m ? Math.abs(Number(m[0].replace(',', '.'))) : undefined;
};

let warnedNoProvider = false;
function warnNoProvider(): void {
  if (warnedNoProvider || process.env.NODE_ENV === 'production') return;
  warnedNoProvider = true;
  console.warn('[fx] useJuice(): no <FxProvider> found — toasts/ceremonies were sent over the fx bus.');
}

function stringIcon(icon: ReactNode): string | undefined {
  return typeof icon === 'string' || typeof icon === 'number' ? String(icon) : undefined;
}

/** Build a Juice API bound to an optional provider context. */
export function createJuice(ctx: FxContextValue | null): Juice {
  const burst: Juice['burst'] = (target, preset, extra) => {
    const { x, y } = pointOf(target);
    const c = fxColors();
    const el = 'getBoundingClientRect' in target ? target : null;
    switch (preset) {
      case 'correct':
        particles.burst({
          x,
          y,
          count: 26,
          colors: [c[0], c[2], c[4]],
          shapes: ['circle', 'star', 'spark'],
          speed: 380,
          gravity: 900,
          life: 0.85,
        });
        particles.ringPulse({ x, y, color: c[0] });
        engine.play('correct');
        vibrate('success');
        break;
      case 'wrong':
        particles.burst({
          x,
          y,
          count: 10,
          colors: [c[3], '#8a8794'],
          shapes: ['square', 'circle'],
          speed: 220,
          gravity: 700,
          life: 0.6,
          spread: Math.PI * 1.2,
        });
        shakeEl(el, 1);
        engine.play('wrong');
        vibrate('error');
        break;
      case 'win':
        particles.confetti({ from: 'point', x, y, count: 90 });
        particles.burst({
          x,
          y,
          count: 20,
          colors: [c[1], c[4]],
          shapes: ['star'],
          speed: 420,
          gravity: 800,
        });
        engine.play('win');
        vibrate('success');
        break;
      case 'gem':
        particles.sparkle({ x, y, count: 16, colors: [c[2], c[4], c[0]] });
        particles.burst({ x, y, count: 8, colors: [c[2], c[4]], shapes: ['star'], speed: 260, life: 0.7 });
        engine.play('gem');
        vibrate('light');
        break;
      case 'levelUp':
        particles.burst({
          x,
          y,
          count: 44,
          colors: [c[0], c[1], c[4]],
          shapes: ['star', 'spark', 'circle'],
          speed: 480,
          gravity: 700,
          life: 1.1,
        });
        particles.ringPulse({ x, y, color: c[1], radius: 80 });
        setTimeout(() => particles.ringPulse({ x, y, color: c[0], radius: 120 }), 120);
        engine.play('levelUp');
        vibrate('combo');
        break;
      case 'stamp':
        particles.burst({
          x,
          y,
          count: 24,
          colors: [c[1], c[3], c[4]],
          shapes: ['square', 'coin'],
          speed: 300,
          gravity: 1100,
          life: 0.8,
          spread: Math.PI * 1.3,
        });
        particles.ringPulse({ x, y, color: c[1], radius: 70 });
        engine.play('stamp');
        vibrate('heavy');
        break;
      case 'combo': {
        const n = Math.max(1, Math.round(extra?.n ?? 1));
        const shapes: ParticleShape[] = ['spark', 'circle'];
        particles.burst({
          x,
          y,
          count: 10 + Math.min(n, 8) * 3,
          colors: [c[0], c[1], c[2]],
          shapes,
          speed: 300 + Math.min(n, 10) * 25,
          gravity: 800,
          life: 0.7,
        });
        engine.play('combo', { n });
        vibrate(n >= 3 ? 'combo' : 'light');
        break;
      }
    }
  };

  const floatText: Juice['floatText'] = (target, text, color) => {
    const { x, y } = pointOf(target);
    particles.floatText({ x, y, text, color });
    engine.play('xp', { n: numberIn(text) ?? 25 });
    vibrate('tick');
  };

  const confetti: Juice['confetti'] = (preset = 'rain') => {
    const c = fxColors();
    const w = typeof window === 'undefined' ? 0 : window.innerWidth;
    const h = typeof window === 'undefined' ? 0 : window.innerHeight;
    switch (preset) {
      case 'win':
        particles.confetti({ from: 'top', count: 160 });
        break;
      case 'levelUp':
        particles.confetti({ from: 'point', x: w / 2, y: h * 0.35, count: 120, colors: [c[0], c[1], c[4]] });
        particles.sparkle({ x: w / 2, y: h * 0.35, count: 16 });
        break;
      case 'achievement':
        particles.confetti({ from: 'top', count: 120, colors: [c[1], c[4], c[0]] });
        break;
      case 'stamp':
        particles.confetti({ from: 'point', x: w / 2, y: h * 0.4, count: 70, colors: [c[1], c[3], c[4]] });
        break;
      case 'streak':
        particles.confetti({ from: 'top', count: 100, colors: ['#ff7a3d', c[1], c[3]] });
        break;
      default:
        particles.confetti({ from: 'top', count: 140 });
    }
    vibrate('success');
  };

  /**
   * A win interrupts you; a loss hands you something and gets out of the way. So this is
   * deliberately the quietest thing in the FX vocabulary that is still a beat: one expanding cyan
   * ring — the learning temperature, never gold, never a medal — and the `kept` cue, which is
   * trimmed below `win` and measured to stay there (lib/fx/sound-levels.ts). A celebratory sound on
   * a loss is the mechanism behind losses-disguised-as-wins, so the ceiling is enforced by test,
   * not by taste.
   */
  const settle: Juice['settle'] = (target) => {
    const { x, y } = target
      ? pointOf(target)
      : {
          x: typeof window === 'undefined' ? 0 : window.innerWidth / 2,
          y: typeof window === 'undefined' ? 0 : window.innerHeight * 0.42,
        };
    particles.ringPulse({ x, y, radius: 70, color: fxColors()[2] });
    engine.play('kept');
    vibrate('light');
  };

  const shake: Juice['shake'] = (target, intensity = 1) => {
    if (typeof document === 'undefined') return;
    shakeEl(target ?? document.body, intensity);
    vibrate('medium');
  };

  const toast: Juice['toast'] = (input) => {
    if (ctx) return ctx.toast(input);
    warnNoProvider();
    const payload: ToastOptions = { ...input, icon: stringIcon(input.icon) };
    fx.emit('toast', payload);
    return input.id ?? '';
  };

  const ceremony: Juice['ceremony'] = (input) => {
    if (ctx) return ctx.openCeremony(input);
    warnNoProvider();
    const payload: CeremonyOptions = {
      kind: input.kind,
      kicker: input.kicker,
      title: input.title,
      subtitle: input.subtitle,
      rewards: input.rewards,
      continueLabel: input.continueLabel,
      silent: input.silent,
    };
    fx.emit('ceremony', payload);
    return '';
  };

  return {
    sound: (cue, opts) => engine.play(cue, opts),
    haptic: (kind) => vibrate(kind),
    burst,
    floatText,
    confetti,
    settle,
    shake,
    toast,
    ceremony,
    dismissToast: (id) => ctx?.dismissToast(id),
    closeCeremony: () => ctx?.closeCeremony(),
  };
}

/** Layered feedback helpers bound to the nearest `<FxProvider>`. Stable between renders. */
export function useJuice(): Juice {
  const ctx = useFx();
  return useMemo(() => createJuice(ctx), [ctx]);
}
