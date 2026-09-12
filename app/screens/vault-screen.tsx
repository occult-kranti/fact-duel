'use client';
import { Journal } from '../journal';
import type { VaultScreenProps } from './types';

/* Vault tab: the journal (facts, recall lab, flagged questions, match history). */
export function VaultScreen({ player, go }: VaultScreenProps) {
  return (
    <Journal
      journal={player.journal}
      issues={player.profile.issues}
      storageOK={player.persistent}
      onSave={player.save}
      onOpen={player.open}
      onRecall={player.recall}
      onExport={player.exportAll}
      epoch={player.profile.epoch}
      loaded={player.loaded}
      onPlay={() => go('discovery')}
    />
  );
}
