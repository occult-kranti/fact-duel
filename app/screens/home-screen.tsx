'use client';
import { Clubhouse } from '../expeditions';
import type { HomeScreenProps } from './types';

/* Home tab: wraps the Clubhouse. */
export function HomeScreen({ player, name, ready, busy, onRoute, onDuel, onSetup, go }: HomeScreenProps) {
  return (
    <Clubhouse
      player={player}
      name={name}
      ready={ready}
      busy={busy}
      onRoute={onRoute}
      onDuel={onDuel}
      onSetup={onSetup}
      onExplore={() => go('collections')}
      onPassport={() => go('passport')}
      onVault={() => go('journal')}
      onDiscovery={() => go('discovery')}
      onShowroom={() => go('showroom')}
    />
  );
}
