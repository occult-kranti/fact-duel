'use client';
import { useMemo } from 'react';
import { useJuice, type Cue, type HapticKind, type Juice } from '@/components/fx';

export type PlayJuice = {
  juice: Juice;
  /** Spread onto any control: tap cue + light haptic on pointerdown (never delays the click). */
  press: { onPointerDown: () => void };
  /** A named cue with an optional haptic twin (select on a mode, tick on a stepper, …). */
  cue: (cue: Cue, haptic?: HapticKind) => void;
};

/* One hook for every control on Play: press feedback plus the occasional louder cue.
 * Every helper is a no-op on the server and respects the sound / haptics / motion prefs. */
export function usePlayJuice(): PlayJuice {
  const juice = useJuice();
  return useMemo(
    () => ({
      juice,
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
