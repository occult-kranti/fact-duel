/**
 * shell/player.tsx — ONE player store for the whole app.
 *
 *   const player = useAppPlayer();        // usePlayer()'s API: profile, progression, journal, dispatch, …
 *   useRecordRoom(room, epoch);           // a duel screen files its settled rounds/match to the profile
 *
 * Screens must NOT call `usePlayer()` from '@/app/use-player' themselves: every instance runs its own
 * visit + engaged-time heartbeat (so two instances double-count analytics) and its own IndexedDB
 * reads. The provider holds the single instance; `useRecordRoom` hands it the room to record, which is
 * exactly what `usePlayer(room, epoch)` does (docs/hisaab/ENGINE.md §6.5).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePlayer } from '@/app/use-player';
import { setProgressionOptions } from '@/lib/progression.mjs';

// The edition's two engine switches (lib/progression.mjs; JHK keeps both defaults):
//  - the ladder is climbed receipt by receipt (charter §1; bible §8.2 "labels are identity, not
//    points"): opening the app earns no streak day, streak XP or streak stamps — a day with play does.
//    A visit still rolls the daily quests.
//  - friend duels are peer-to-peer and self-timed, and promised unranked (P2P_TRUST): a match against
//    a person pays XP but never moves the Babu rank. (Pass & Play never records at all.)
setProgressionOptions({ visitCreditsStreak: false, rankHumanMatches: false });

export type AppPlayer = ReturnType<typeof usePlayer>;

type Recorder = (room: unknown, epoch: string | undefined) => void;

const PlayerContext = createContext<AppPlayer | null>(null);
const RecordContext = createContext<Recorder>(() => {});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [rec, setRec] = useState<{ room: unknown; epoch?: string }>({ room: null });
  const player = usePlayer(rec.room, rec.epoch);
  // usePlayer returns a fresh object each render; its state lives in these fields.
  const value = useMemo(
    () => player,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player.profile, player.loaded, player.persistent, player.storageError, player.syncState],
  );
  const record = useCallback<Recorder>((room, epoch) => {
    setRec((prev) => (prev.room === room && prev.epoch === epoch ? prev : { room, epoch }));
  }, []);
  return (
    <RecordContext.Provider value={record}>
      <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
    </RecordContext.Provider>
  );
}

/** The app's player (profile, progression, journal, dispatch…). Throws outside the provider. */
export function useAppPlayer(): AppPlayer {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('useAppPlayer() outside <PlayerProvider> (editions/hisaab/app/app.tsx mounts it).');
  return player;
}

type RecordableRoom = {
  id?: string;
  revision?: number;
  phase?: string;
  round?: { id?: string; result?: unknown } | null;
  completedRounds?: ReadonlyArray<unknown> | null;
};

/**
 * What the profile can file from a room: its settled rounds (completed ones, and the current one once
 * it has a result) and the finished match. The reveal, the bot's answer and your own lock each bump
 * `revision` but change none of this, so they are not forwarded.
 */
export function recordKey(room: RecordableRoom | null | undefined): string {
  if (!room) return '';
  // Distinct rounds settled so far. The engine lists a round in `completedRounds` as soon as it has its
  // result, while it is still the current `round`; counting ids keeps the next countdown from looking new.
  const ids = new Set<unknown>();
  (room.completedRounds ?? []).forEach((r, i) => ids.add((r as { id?: unknown } | null)?.id ?? `#${i}`));
  if (room.round?.result) ids.add(room.round.id ?? 'current');
  return `${room.id ?? ''}:${ids.size}:${room.phase === 'complete' ? 'complete' : ''}`;
}

/**
 * Record a duel room to the profile: pass the room you render and the `player.epoch()` you captured
 * when you created it. Settled rounds and the match are filed once, however often the room re-polls.
 * Pass-and-play never records (two people share one phone).
 *
 * Only a change the profile can file is forwarded (a round settling, the match completing): every
 * other revision (the reveal, the bot's answer, your lock) would otherwise open a profile write and
 * re-render every player consumer on the quiet live surface, inside the reveal window (ENGINE §6.3).
 */
export function useRecordRoom(room: RecordableRoom | null | undefined, epoch: string | undefined) {
  const record = useContext(RecordContext);
  const key = recordKey(room);
  useEffect(() => {
    // `room` is the one rendered when `key` last changed: exactly the state to file.
    record(key ? (room ?? null) : null, epoch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, key, epoch]);
  useEffect(() => () => record(null, undefined), [record]);
}
