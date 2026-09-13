'use client';
import { useSyncExternalStore } from 'react';

// `lib/fx/prefs.ts` did not exist when the 3D layer was written, so this is the
// matchMedia fallback the spec allows. Swap the implementation for the shared
// preference hook once it lands; the signature is intentionally trivial.
const QUERY = '(prefers-reduced-motion: reduce)';

function canQuery(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function subscribe(onChange: () => void): () => void {
  if (!canQuery()) return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return canQuery() && window.matchMedia(QUERY).matches;
}

const getServerSnapshot = () => false;

/** True when the visitor asked for reduced motion. Server snapshot is always false. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** One-off read (for non-React code paths). */
export function prefersReducedMotion(): boolean {
  return getSnapshot();
}
