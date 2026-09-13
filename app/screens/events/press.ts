'use client';
/**
 * app/screens/events/press.ts — press feel for every control on the Events surfaces.
 * Bound to `onPointerDown` and gated through lib/fx/press-gate, so a scroll fling is silent and
 * the click is never delayed. Navigation stays silent (the press is the whole cue); arming a
 * limited mode gets the louder `select` cue.
 */
import { useMemo } from 'react';
import { useJuice, type Cue, type HapticKind } from '@/components/fx';
import { gatePress } from '@/lib/fx/press-gate';

export type EventsPress = {
  press: { onPointerDown: (event?: unknown) => void };
  cue: (cue: Cue, haptic?: HapticKind) => void;
};

export function useEventsPress(): EventsPress {
  const juice = useJuice();
  return useMemo(
    () => ({
      press: {
        onPointerDown: (event?: unknown) =>
          gatePress(event, () => {
            juice.sound('tap');
            juice.haptic('light');
          }),
      },
      cue: (cue: Cue, haptic?: HapticKind) => {
        juice.sound(cue);
        if (haptic) juice.haptic(haptic);
      },
    }),
    [juice],
  );
}
