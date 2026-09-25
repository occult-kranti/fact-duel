/**
 * screens/home/press-cue.ts — the press cue for a whole screen, delegated (bible §6 #1, skill `juice`).
 *
 *   const onPointerDown = usePressCue();
 *   <div onPointerDown={onPointerDown}>…links and buttons…</div>
 *
 * Any link or button pressed inside gets `tap` + a light haptic — but only once the gesture proves to
 * be a press, not the start of a scroll (lib/fx/press-gate). The visual twin is the print-down press
 * every h-btn / h-file already draws. Sound stays silent until the first tap by construction (this IS
 * the first tap), and prefs (mute, haptics off, Quiet everything) are respected by useJuice.
 */
import { useCallback, type PointerEvent } from 'react';
import { useJuice } from '@/components/fx';
import { gatePress } from '@/lib/fx/press-gate';

export function usePressCue() {
  const juice = useJuice();
  return useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const target = event.target as Element | null;
      const control = target?.closest?.('a[href], button:not(:disabled)');
      if (!control || control.getAttribute('aria-disabled') === 'true') return;
      gatePress(event, () => {
        juice.sound('tap');
        juice.haptic('light');
      });
    },
    [juice],
  );
}
