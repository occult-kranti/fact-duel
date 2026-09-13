'use client';
/**
 * app/screens/home/use-now.ts — a coarse clock for relative stamps.
 * `useSyncExternalStore` with a cached snapshot: stable across renders (no snapshot loop), 0 on
 * the server, and nudged once a minute so "12m ago" does not go stale on an idle tab.
 */
import { useSyncExternalStore } from 'react';

const TICK_MS = 60_000;
let cached = 0;

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
};
const snapshot = () => {
  const now = Date.now();
  if (now - cached >= 30_000) cached = now;
  return cached;
};
const serverSnapshot = () => 0;

export const useNow = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot);
