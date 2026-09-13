'use client';
/**
 * usePress() — the shared press cue for the learning surfaces.
 *
 * Returns a `pointerdown` handler that plays the `tap` cue and a light haptic. Pointer events
 * fire before click, so the feedback never delays the action; both layers are no-ops when the
 * player has muted sound or haptics.
 */
import { useCallback } from 'react';
import { useJuice } from '@/components/fx';

export function usePress(): (event: { currentTarget: unknown }) => void {
  const juice = useJuice();
  return useCallback(() => {
    juice.sound('tap');
    juice.haptic('light');
  }, [juice]);
}
