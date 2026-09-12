'use client';
import { ExpeditionCase } from '../expeditions';
import { Passport } from '../passport';
import type { PlayerScreenProps } from './types';

/* Player tab: stamp case + passport. */
export function PlayerScreen({ player, catalogue, onOpenExpedition, onMissionAction }: PlayerScreenProps) {
  return (
    <>
      <ExpeditionCase player={player} onOpen={onOpenExpedition} />
      <Passport player={player} catalogue={catalogue} onAction={onMissionAction} />
    </>
  );
}
