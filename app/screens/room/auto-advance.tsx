'use client';
import { useEffect, useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { usePress } from './room-bits';
import { useLocale } from '../../use-locale';

/**
 * The between-rounds clock: a multi-round match advances itself, so nobody has to click through
 * Triple Threat or the Gauntlet.
 *
 * It is mounted only while the window is armed, which is the whole design — mounting is arming and
 * unmounting is cancelling, so there is no effect left having to work out whether its timers should
 * still be running. It owns exactly two: the hand-off to `onFire`, and the visible count.
 *
 * Mounted is not the same as watched, though, so the window is also gated on page visibility: a
 * hidden tab holds it shut and a return restarts it, because a round that begins on a hidden page is
 * played without its player and the match-level refund cannot reach it.
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
  const { t } = useLocale();
  const [left, setLeft] = useState(() => Math.ceil(totalMs / 1000));
  /* `onFire` closes over the orchestrator's current state and is a new function every poll; the ref
   * keeps the timeout on the latest one without restarting the window. */
  const fire = useRef(onFire);
  useEffect(() => {
    fire.current = onFire;
  });
  /* One round per armed window, ever: `onFire` sends `ready` asynchronously and the unmount that
   * follows is a render away, so without this a re-arm inside that gap would send a second one. */
  const fired = useRef(false);
  useEffect(() => {
    let tick: ReturnType<typeof setInterval> | undefined;
    let start: ReturnType<typeof setTimeout> | undefined;
    const disarm = () => {
      if (tick !== undefined) clearInterval(tick);
      if (start !== undefined) clearTimeout(start);
      tick = undefined;
      start = undefined;
    };
    const arm = () => {
      if (fired.current) return;
      const deadline = Date.now() + totalMs;
      tick = setInterval(() => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 250);
      start = setTimeout(() => {
        fired.current = true;
        disarm();
        fire.current();
      }, totalMs);
    };
    /* Never start a round the player cannot see. The match-level refund in app/arena.tsx only runs
     * at the moment of hiding and only for a live round, so a round begun on a hidden page is played
     * and lost with nothing to undo it; the window is held shut while hidden and restarted in full
     * when the page comes back, which keeps that refund the only path out of a round. */
    const hidden = () => typeof document !== 'undefined' && document.hidden;
    const onVisibility = () => {
      disarm();
      setLeft(Math.ceil(totalMs / 1000));
      if (!hidden()) arm();
    };
    if (!hidden()) arm();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disarm();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [totalMs]);
  return (
    <div className="fd-auto">
      <p className="fd-note fd-auto-note" aria-hidden="true">
        {t('auto.nextIn', { s: left })}
      </p>
      <span className="fd-sr" role="status">
        {t('auto.sr')}
      </span>
      <button type="button" className="fd-auto-hold" onPointerDown={press} onClick={onHold}>
        <BookOpen size={14} aria-hidden="true" />
        {t('auto.keepReading')}
      </button>
    </div>
  );
}
