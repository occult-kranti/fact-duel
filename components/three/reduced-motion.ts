'use client';
import { useSyncExternalStore } from 'react';
import { reducedMotion, subscribePrefs } from '@/lib/fx/prefs';

// `lib/fx/prefs.ts` has landed, so the 3D layer now reads the same source of truth as the CSS
// guards, `useReducedMotion()` and the orb parallax: the in-app Motion setting OR the OS query.
// Reading the media query alone left a player who picked Reduced/Off in-app with a brain still
// on `frameloop='always'` — the one motion in the app their own setting could not stop.
// `prefs` is pure TS with no three/React import, so there is no cycle through `index.ts`.

const off = () => false;

/** True when the in-app Motion setting (reduced/off) OR the OS query asks for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribePrefs, reducedMotion, off);
}

/** One-off read (for non-React code paths). */
export const prefersReducedMotion = reducedMotion;
