'use client';
/**
 * app/screens/home/press.ts — one press feel for every pressable on the Arena Hub.
 * Bound to `onPointerDown`, but gated through lib/fx/press-gate: the tap cue + light haptic land
 * on the release of a real press and stay silent through a scroll fling. The click itself still
 * fires from React's own onClick and is not delayed. Navigation stays silent — the press is the
 * whole cue.
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
