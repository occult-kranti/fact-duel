'use client';
/**
 * Small shared pieces for the Room screen: the shared press-feedback handler and the
 * ready/connection indicators.
 *
 * The answer button, its glyphs and the shape names now live in `app/screens/answer-button.tsx`
 * so the expedition run and the learning surfaces can carry the same a11y coding; they are
 * re-exported here because the room modules have always imported them from this file.
 */
import { useCallback } from 'react';
import { useJuice } from '@/components/fx';

export {
  AnswerButton,
  AnswerGlyph,
  AnswerShapeName,
  OPTION_ACCENTS,
  OPTION_SHAPES,
  OPTION_SHAPE_NAMES,
} from '../answer-button';

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
