'use client';
import Expeditions from '../expeditions';
import type { ExpeditionsScreenProps } from './types';

/* Expeditions tab: atlas, brief, run and finish views live inside the Expeditions module. */
export function ExpeditionsScreen({
  player,
  selected,
  onSelect,
  onDuel,
  signal,
  go,
}: ExpeditionsScreenProps) {
  return (
    <Expeditions
      selected={selected}
      onSelect={onSelect}
      player={player}
      onDuel={onDuel}
      onBack={() => go('home')}
      signal={signal}
    />
  );
}
