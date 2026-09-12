/**
 * components/fx/shake.ts — decaying x/y jitter via the Web Animations API (~350 ms).
 *
 * Animates the independent `translate` property (falls back to `transform` with additive
 * compositing) so any transform the element already has is preserved. Returns the Animation,
 * or null when reduced motion is on, WAAPI is missing, or no element was given.
 */
import { reducedMotion } from '@/lib/fx/prefs';

export const SHAKE_DURATION_MS = 350;

let translateSupported: boolean | null = null;

function supportsTranslate(): boolean {
  if (translateSupported !== null) return translateSupported;
  try {
    translateSupported = typeof CSS !== 'undefined' && CSS.supports('translate', '1px 1px');
  } catch {
    translateSupported = false;
  }
  return translateSupported;
}

export function shake(el: Element | null | undefined, intensity = 1): Animation | null {
  if (!el || typeof window === 'undefined') return null;
  if (reducedMotion()) return null;
  const target = el as HTMLElement;
  if (typeof target.animate !== 'function') return null;
  const amp = Math.max(0, 6 * intensity);
  const steps = 10;
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < steps; i++) {
    const decay = 1 - i / steps;
    const sign = i % 2 === 0 ? 1 : -1;
    points.push({
      x: sign * amp * decay * (0.7 + Math.random() * 0.3),
      y: (Math.random() - 0.5) * amp * 0.5 * decay,
    });
  }
  points.push({ x: 0, y: 0 });
  const useTranslate = supportsTranslate();
  const frames: Keyframe[] = points.map(({ x, y }) =>
    useTranslate
      ? { translate: `${x.toFixed(2)}px ${y.toFixed(2)}px` }
      : { transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` },
  );
  const options: KeyframeAnimationOptions = { duration: SHAKE_DURATION_MS, easing: 'ease-out' };
  if (!useTranslate) options.composite = 'add';
  try {
    return target.animate(frames, options);
  } catch {
    return null;
  }
}
