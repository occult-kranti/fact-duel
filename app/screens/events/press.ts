'use client';
/**
 * app/screens/events/press.ts — press feel for every control on the Events surfaces.
 * `onPointerDown` only, so the cue lands immediately and never delays the click. Navigation stays
 * silent (the press is the whole cue); arming a limited mode gets the louder `select` cue.
 */
import { useMemo } from 'react';
import { useJuice, type Cue, type HapticKind } from '@/components/fx';

export type EventsPress = {
  press: { onPointerDown: () => void };
  cue: (cue: Cue, haptic?: HapticKind) => void;
};

export function useEventsPress(): EventsPress {
  const juice = useJuice();
  return useMemo(
    () => ({
      press: {
        onPointerDown: () => {
          juice.sound('tap');
          juice.haptic('light');
        },
      },
      cue: (cue: Cue, haptic?: HapticKind) => {
        juice.sound(cue);
        if (haptic) juice.haptic(haptic);
      },
    }),
    [juice],
  );
}
