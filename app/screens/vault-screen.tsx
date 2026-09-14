'use client';
import { Journal } from '../journal';
import type { VaultScreenProps } from './types';

/* Vault tab: the journal (facts, Recall Lab, flagged questions, match history). */
export function VaultScreen({ player, go }: VaultScreenProps) {
  // Both dispatchers: `review` moves the box ladder and pays, while `recall` still covers legacy
  // entries that carry no factId, where there is no schedule to move.
  return (
    <Journal
      journal={player.journal}
      issues={player.profile.issues}
      storageOK={player.persistent}
      onSave={player.save}
      onOpen={player.open}
      onRecall={player.recall}
      onReview={player.review}
      onExport={player.exportAll}
      epoch={player.profile.epoch}
      loaded={player.loaded}
      passport={player.passport}
      summary={player.summary}
      onPlay={() => go('discovery')}
    />
  );
}
