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

/**
 * Record a duel room to the profile: pass the room you render and the `player.epoch()` you captured
 * when you created it. Settled rounds and the match are filed once, however often the room re-polls.
 * Pass-and-play never records (two people share one phone).
 */
export function useRecordRoom(room: { id?: string; revision?: number } | null | undefined, epoch: string | undefined) {
  const record = useContext(RecordContext);
  useEffect(() => {
    record(room ?? null, epoch);
  }, [record, room, room?.id, room?.revision, epoch]);
  useEffect(() => () => record(null, undefined), [record]);
}
