'use client';
import Expeditions from './expeditions';
import type { ExpeditionsScreenProps } from './types';

/* Expeditions tab: atlas, brief, run and finish views live in app/screens/expeditions/. */
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
      /* §3.5's primary action out of a bad run needs a route, and the Vault is the `journal` tab.
         Without one the finish screen falls back to re-reading the misses where they already are. */
      onVault={() => go('journal')}
      signal={signal}
    />
  );
}
