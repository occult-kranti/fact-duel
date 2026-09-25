/**
 * ui/fonts.ts — the lazy Kalam hand (bible §4.2). Only the certificate, share cards and the noting
 * margin use it, so it is fetched on first use, never on first paint.
 */
let hand: Promise<void> | null = null;

/** Load Kalam 400 once; resolves when the face is usable (or after a failed load, so callers never hang). */
export function loadHandFont(): Promise<void> {
  if (!hand) {
    hand = import('@fontsource/kalam/400.css')
      .then(() => (typeof document !== 'undefined' && document.fonts ? document.fonts.load('400 18px Kalam') : undefined))
      .then(
        () => undefined,
        () => undefined,
      );
  }
  return hand;
}
