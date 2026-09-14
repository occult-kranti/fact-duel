'use client';
import { useMemo } from 'react';
import { useJuice, type Cue, type HapticKind, type Juice } from '@/components/fx';
import { gatePress } from '@/lib/fx/press-gate';

export type PlayJuice = {
  juice: Juice;
  /** Spread onto any control: tap cue + light haptic on a press, silent on a scroll. */
  press: { onPointerDown: (event?: unknown) => void };
  /** A named cue with an optional haptic twin (select on a mode, tick on a stepper, …). */
  cue: (cue: Cue, haptic?: HapticKind) => void;
};

/* One hook for every control on Play: press feedback plus the occasional louder cue. The press
 * cue is gated (lib/fx/press-gate) so a scroll fling does not click at you; the click is never
 * delayed. Every helper is a no-op on the server and respects the sound / haptics / motion prefs. */
export function usePlayJuice(): PlayJuice {
  const juice = useJuice();
  return useMemo(
    () => ({
      juice,
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
