'use client';
/**
 * Small shared pieces for the Room screen: the colour-blind-safe answer glyphs, the shared
 * press-feedback handler and the ready/connection indicators.
 *
 * Shape coding (design bible §"Answer buttons"): 1 triangle/ember, 2 diamond/cyan,
 * 3 circle/gold, 4 square/magenta — inline SVG so the shape survives a colour-blind palette.
 */
import { useCallback } from 'react';
import { useJuice } from '@/components/fx';

export const OPTION_SHAPES = ['triangle', 'diamond', 'circle', 'square'] as const;
export const OPTION_ACCENTS = ['ember', 'cyan', 'gold', 'magenta'] as const;
export const OPTION_SHAPE_NAMES = ['Triangle', 'Diamond', 'Circle', 'Square'] as const;

/** Inline glyph for answer option `index` (0–3). Decorative: the option text carries the meaning. */
export function AnswerGlyph({ index, size = 20 }: { index: number; size?: number }) {
  const i = ((index % 4) + 4) % 4;
  return (
    <svg
      className="fd-glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {i === 0 && <path d="M12 3.2 22 20.4H2Z" />}
      {i === 1 && <path d="M12 2.2 21.8 12 12 21.8 2.2 12Z" />}
      {i === 2 && <circle cx="12" cy="12" r="9.2" />}
      {i === 3 && <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3" />}
    </svg>
  );
}

/**
 * Press feedback for any control: a tap cue plus a light haptic on pointer *down*.
 * Never call preventDefault here — the click must not be deferred or swallowed.
 */
export function usePress(): (event?: unknown) => void {
  const juice = useJuice();
  return useCallback(() => {
    juice.sound('tap');
    juice.haptic('light');
  }, [juice]);
}

/** Filled dot when a seat is ready, hollow ring when it is not. */
export function ReadyDot({ ready }: { ready: boolean }) {
  return (
    <span className="fd-ready-dot" data-on={ready ? 'true' : 'false'} aria-hidden="true">
      {ready ? (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.4">
          <path d="m4 12.6 5.2 5.2L20 6.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}
