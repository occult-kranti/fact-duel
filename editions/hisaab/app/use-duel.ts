'use client';
/**
 * editions/hisaab/app/use-duel.ts — the duel controller (engine/duel-controller.mjs) as a React hook.
 *
 *   const { controller, snapshot } = useDuel(request);   // request from '@/lib/duel-client' or a P2P session
 *   useQuestionShown(controller, snapshot);              // starts the reveal-to-input clock after paint
 *
 * `snapshot` re-renders on every change (room, countdown, remaining time, error).
 */
import { useEffect, useLayoutEffect, useState } from 'react';
import { createDuelController } from '../engine/duel-controller.mjs';

export type DuelController = ReturnType<typeof createDuelController>;
export type DuelSnapshot = ReturnType<DuelController['snapshot']>;
// The duel service's results are the room projections documented in docs/hisaab/ENGINE.md.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DuelRequest = (body: Record<string, unknown>) => Promise<any>;

/**
 * One controller per mounted component, bound to the `request` it was first rendered with (key the
 * component to switch transports, e.g. `<FriendDuel key={session.code} />`).
 */
export function useDuel(request: DuelRequest) {
  const [snapshot, setSnapshot] = useState<DuelSnapshot | null>(null);
  const [controller] = useState(() => createDuelController({ request, onChange: setSnapshot }));
  useEffect(() => {
    controller.resume();
    return () => controller.dispose();
  }, [controller]);
  return { controller, snapshot };
}

/**
 * Start the answer clock only once the question is on screen: the arena's rule is two animation
 * frames after the question mounts (the first lets React commit, the second lets the browser paint).
 */
export function useQuestionShown(controller: DuelController | null, snapshot: DuelSnapshot | null) {
  const round = snapshot?.room?.round;
  const visible = !!round?.question && !round?.result;
  const roundId = round?.id ?? null;
  useLayoutEffect(() => {
    if (!controller || !visible || !roundId) return;
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => controller.markShown());
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [controller, visible, roundId]);
}
