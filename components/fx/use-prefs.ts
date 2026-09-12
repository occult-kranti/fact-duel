/**
 * components/fx/use-prefs.ts — React hooks over `lib/fx/prefs`.
 *
 * All three hooks are built on `useSyncExternalStore`, so they are hydration-safe: the server
 * snapshot is the default prefs (sound on, volume 0.35, haptics on, full motion) and the client
 * snapshot is read from localStorage after hydration — no set-state-in-effect, no mismatch.
 */
'use client';
import { useSyncExternalStore } from 'react';
import { getPrefs, getServerPrefs, reducedMotion, subscribePrefs, type FxPrefs } from '@/lib/fx/prefs';

const noopSubscribe = () => () => {};
const yes = () => true;
const no = () => false;

/** Live preferences (re-renders on change). */
export function usePrefs(): FxPrefs {
  return useSyncExternalStore(subscribePrefs, getPrefs, getServerPrefs);
}

/** True when the pref OR the OS asks for reduced motion. Always false during SSR. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribePrefs, reducedMotion, no);
}

/** False on the server and during hydration, true afterwards. */
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, yes, no);
}
