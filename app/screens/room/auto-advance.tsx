'use client';
import { useEffect, useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { usePress } from './room-bits';

/**
 * The between-rounds clock: a multi-round match advances itself, so nobody has to click through
 * Triple Threat or the Gauntlet.
 *
 * It is mounted only while the window is armed, which is the whole design — mounting is arming and
 * unmounting is cancelling, so there is no effect left having to work out whether its timers should
 * still be running. It owns exactly two: the hand-off to `onFire`, and the visible count.
 *
 * The ticking number is decorative. Announcing a new value every second would talk over the round
 * review a player is reading, so the seconds are aria-hidden and one status line says the same
 * thing once, when the window opens.
 */
export function AutoAdvance({
  totalMs,
  onFire,
  onHold,
}: {
  totalMs: number;
  onFire: () => void;
  onHold: () => void;
}) {
  const press = usePress();
  const [left, setLeft] = useState(() => Math.ceil(totalMs / 1000));
  /* `onFire` closes over the orchestrator's current state and is a new function every poll; the ref
   * keeps the timeout on the latest one without restarting the window. */
  const fire = useRef(onFire);
  useEffect(() => {
    fire.current = onFire;
  });
  useEffect(() => {
    const deadline = Date.now() + totalMs;
    const tick = setInterval(() => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 250);
    const start = setTimeout(() => fire.current(), totalMs);
    return () => {
      clearInterval(tick);
      clearTimeout(start);
    };
  }, [totalMs]);
  return (
    <div className="fd-auto">
      <p className="fd-note fd-auto-note" aria-hidden="true">
        Next round starts on its own in {left}s.
      </p>
      <span className="fd-sr" role="status">
        The next round starts on its own in a few seconds. Choose Start now to begin immediately, or Keep
        reading to stay on this fact.
      </span>
      <button type="button" className="fd-auto-hold" onPointerDown={press} onClick={onHold}>
        <BookOpen size={14} aria-hidden="true" />
        Keep reading
      </button>
    </div>
  );
}
