'use client';
/**
 * lib/fx/press-gate.ts — decide whether a pointerdown is a press or the start of a scroll.
 *
 * Every press helper in the app fired its cue straight from `onPointerDown`. On a touch screen the
 * pointerdown that *begins a scroll fling* lands on whatever card is under the finger, so the app
 * clicked at you on every swipe — which is what reads as a fake, machine-generated interaction
 * sound. The synthesis was only half the problem; this is the other half.
 *
 *   pointerdown    remember where and when. A mouse-down is never a scroll, so it plays at once.
 *   pointermove    more than TRAVEL_PX from the origin — that is a drag. Cancel.
 *   pointerup      inside HOLD_MS and still near the origin — that is a press. Play.
 *   pointercancel  the browser took the gesture (scroll, back-swipe). Cancel.
 *
 * The cost is 40-90 ms of *cue* latency on touch. The **click** is untouched: it still fires from
 * React's own `onClick`, so nothing about activation timing moves. Listeners are attached to the
 * window, not the element, so a helper that call sites already bind as a bare `onPointerDown`
 * handler can adopt this without touching the hundred bindings that use it.
 */

/** Travel, in CSS pixels, past which the gesture is a drag rather than a press. */
const TRAVEL_PX = 10;
/** A press held longer than this is a long-press or a stall; its cue is dropped. */
const HOLD_MS = 600;

/** The subset of a pointer event this gate reads — React synthetic or native, both fit. */
type Pointerish = {
  pointerType?: string;
  pointerId?: number;
  clientX?: number;
  clientY?: number;
};

/**
 * Run `play` only if this gesture turns out to be a press. Callers pass whatever their handler
 * received; anything without usable pointer coordinates (a keyboard activation, a direct call,
 * a test) plays immediately, because there is no gesture to wait for.
 */
export function gatePress(event: unknown, play: () => void): void {
  if (typeof window === 'undefined') return;
  const e = (event ?? {}) as Pointerish;
  if (e.pointerType === 'mouse' || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') {
    play();
    return;
  }
  const id = e.pointerId;
  const x = e.clientX;
  const y = e.clientY;
  const started = performance.now();
  let settled = false;
  const mine = (ev: PointerEvent) => id === undefined || ev.pointerId === id;
  const done = () => {
    if (settled) return;
    settled = true;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', done);
    clearTimeout(expiry);
  };
  const onMove = (ev: PointerEvent) => {
    if (!mine(ev)) return;
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > TRAVEL_PX) done();
  };
  const onUp = (ev: PointerEvent) => {
    if (!mine(ev)) return;
    const travelled = Math.hypot(ev.clientX - x, ev.clientY - y);
    const held = performance.now() - started;
    done();
    if (travelled <= TRAVEL_PX && held < HOLD_MS) play();
  };
  // A pointer that never lifts (the page navigated away under the finger) must not leak listeners.
  const expiry = setTimeout(done, HOLD_MS + 200);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', done, { passive: true });
}
