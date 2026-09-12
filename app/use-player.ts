'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyProfile, reduceProfile, passportSummary } from '@/lib/passport.mjs';
import { transactProfile } from '@/lib/profile-store.mjs';
import { readJournal } from '@/lib/journal.mjs';
export function usePlayer(room: any, roomEpoch?: string) {
  const [profile, setProfile] = useState<any>(() => emptyProfile()),
    [loaded, setLoaded] = useState(false),
    [persistent, setPersistent] = useState(true),
    [storageError, setStorageError] = useState('');
  const current = useRef<any>(profile),
    channel = useRef<BroadcastChannel | null>(null),
    queue = useRef<Promise<any>>(Promise.resolve()),
    storage = useRef(true),
    everStored = useRef(false),
    live = useRef(true);
  const accept = useCallback((value: any, authoritativeReset = false) => {
    if (!live.current || (!authoritativeReset && value.revision < current.current.revision)) return;
    current.current = value;
    setProfile(value);
  }, []);
  useEffect(() => {
    live.current = true;
    let legacy: string | null = null;
    try {
      legacy = localStorage.getItem('fact-duel-journal-v1');
    } catch {}
    const load = transactProfile(null, legacy)
      .then((value) => {
        everStored.current = true;
        accept(value);
        try {
          localStorage.removeItem('fact-duel-journal-v1');
        } catch {}
      })
      .catch(() => {
        storage.current = false;
        setPersistent(false);
        const fallback = emptyProfile();
        fallback.journal = readJournal(legacy);
        accept(fallback);
        setStorageError(
          'Browser storage is unavailable. Play still works; export your activity before leaving.',
        );
      })
      .finally(() => {
        if (live.current) setLoaded(true);
      });
    queue.current = load;
    const refresh = () => {
      if (storage.current)
        void transactProfile(null)
          .then(accept)
          .catch(() => {});
    };
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('fact-duel-player');
      channel.current.onmessage = refresh;
    }
    window.addEventListener('focus', refresh);
    return () => {
      live.current = false;
      channel.current?.close();
      channel.current = null;
      window.removeEventListener('focus', refresh);
    };
  }, [accept]);
  const dispatch = useCallback(
    (input: any) => {
      const action = { ...input, epoch: input.epoch ?? current.current.epoch, at: Date.now() };
      queue.current = queue.current.then(async () => {
        if (storage.current || action.type === 'reset') {
          try {
            const value = await transactProfile(action);
            everStored.current = true;
            storage.current = true;
            setPersistent(true);
            accept(value, action.type === 'reset');
            channel.current?.postMessage('updated');
            setStorageError('');
            return true;
          } catch {
            if (action.type === 'reset' && everStored.current) {
              setStorageError(
                'Reset could not be saved. Stored activity has not been cleared. Export your activity and try again.',
              );
              return false;
            }
            storage.current = false;
            setPersistent(false);
            setStorageError(
              'Saving is unavailable. Activity lasts for this visit; export it before leaving.',
            );
          }
        }
        accept(reduceProfile(current.current, action));
        return true;
      });
      return queue.current;
    },
    [accept],
  );
  // Bind activity to the seat generation, never compare browser and server clocks.
  useEffect(() => {
    if (loaded && roomEpoch && (room?.round?.result || room?.completedRounds?.length))
      void dispatch({ type: 'room', room, epoch: roomEpoch });
  }, [loaded, roomEpoch, room?.id, room?.revision, dispatch]);
  const epoch = useCallback(() => current.current.epoch, []);
  const open = useCallback((roundId: string) => void dispatch({ type: 'open', roundId }), [dispatch]);
  const recall = useCallback((roundId: string) => void dispatch({ type: 'recall', roundId }), [dispatch]);
  const save = useCallback((question: string) => void dispatch({ type: 'save', question }), [dispatch]);
  const clear = useCallback(async () => {
    const ok = await dispatch({ type: 'reset', newEpoch: crypto.randomUUID() });
    if (ok)
      try {
        localStorage.removeItem('fact-duel-journal-v1');
      } catch {}
  }, [dispatch]);
  const report = useCallback(
    async (roundId: string, reason: string, note: string) => {
      await dispatch({ type: 'report', roundId, reason, note });
      return current.current.issues.some(
        (i: any) => i.fact.id === roundId && i.reason === reason && i.note === note.trim(),
      );
    },
    [dispatch],
  );
  const skin = useCallback((skin: string) => void dispatch({ type: 'skin', skin }), [dispatch]);
  const exportAll = useCallback(() => {
    // A backup is a queued operation: flush initialization and writes, then include other-tab commits.
    queue.current = queue.current
      .then(async () => {
        if (storage.current)
          try {
            accept(await transactProfile(null));
          } catch {
            setStorageError(
              'Could not refresh storage. This export contains the activity currently loaded in this tab.',
            );
          }
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(current.current, null, 2)], { type: 'application/json' }),
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fact-duel-player.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => {
        setStorageError('The export could not be created. Keep this page open and try again.');
      });
    return queue.current;
  }, [accept]);
  return {
    dispatch,
    epoch,
    profile,
    journal: profile.journal,
    passport: profile.passport,
    summary: passportSummary(profile.passport),
    loaded,
    persistent,
    storageError,
    open,
    recall,
    save,
    clear,
    skin,
    exportAll,
    report,
  };
}
