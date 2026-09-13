'use client';
/**
 * app/screens/home/press.ts — one press feel for every pressable on the Arena Hub.
 * `onPointerDown` only: the tap cue + light haptic land immediately and never delay the click.
 * Navigation itself stays silent — the press is the whole cue.
 */
import { useCallback } from 'react';
import { useJuice } from '@/components/fx';

export function usePress(): () => void {
  const juice = useJuice();
  return useCallback(() => {
    juice.sound('tap');
    juice.haptic('light');
  }, [juice]);
}
