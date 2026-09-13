'use client';
/**
 * usePress() — the shared press cue for the learning surfaces.
 *
 * Returns a `pointerdown` handler that plays the `tap` cue and a light haptic once the gesture
 * has proved to be a press rather than the start of a scroll (lib/fx/press-gate). The action is
 * never delayed — it fires from onClick. Both layers are no-ops when sound or haptics are muted.
 */
import { useCallback } from 'react';
import { useJuice } from '@/components/fx';
import { gatePress } from '@/lib/fx/press-gate';

export function usePress(): (event?: unknown) => void {
  const juice = useJuice();
  return useCallback(
    (event?: unknown) =>
      gatePress(event, () => {
        juice.sound('tap');
        juice.haptic('light');
      }),
    [juice],
  );
}
