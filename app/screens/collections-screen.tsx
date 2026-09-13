'use client';
import Collections from '../collections';
import type { CollectionsScreenProps } from './types';

/* Collections: topic tickets that feed the duel configurator. */
export function CollectionsScreen({ player, catalogue, onChoose }: CollectionsScreenProps) {
  return <Collections catalogue={catalogue} passport={player.passport} onChoose={onChoose} />;
}
