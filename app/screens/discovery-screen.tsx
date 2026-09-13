'use client';
import Discovery from '../discovery';
import type { DiscoveryScreenProps } from './types';

/* Discovery: three untimed teaching cards for the configured topic. */
export function DiscoveryScreen({ player, topic, go }: DiscoveryScreenProps) {
  return <Discovery topic={topic} player={player} onBack={() => go('arena')} onVault={() => go('journal')} />;
}
