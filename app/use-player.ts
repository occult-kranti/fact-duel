'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyProfile, reduceProfile, passportSummary } from '@/lib/passport.mjs';
import { transactProfile } from '@/lib/profile-store.mjs';
import { readJournal } from '@/lib/journal.mjs';
import { levelForXp } from '@/lib/progression.mjs';
const VISIT_THROTTLE_MS = 60_000;
// Engaged time is sampled every 15 s and only while the tab is on screen, so a tab left open in the
// background adds nothing. lib/analytics.mjs clamps a single sample to its 30-minute session gap.
const HEARTBEAT_MS = 15_000;
type CountDelta = { rounds?: number; matches?: number; cards?: number; quests?: number };
/**
 * One entry of a seeded review deck: a bare factId, or a factId carrying the `order` of the
 * confidence tier the player called it at, so the deck can put the calls above Steady first without
 * the caller having to sort — or this module having to know what a tier is.
 */
export type SeedEntry = string | { factId: string; order: number };
// `chose` is the option text, never the index: every surface reshuffles a card's options per
// presentation, so an index stored today points somewhere else tomorrow.
type ReviewAttempt = {
  factId: string;
  roundId: string | null;
  choice: number;
  chose: string;
  correct: boolean;
  revealed: boolean;
};
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
    live = useRef(true),
    lastVisit = useRef(0),
    lastBeat = useRef(0);
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
  // A visit credits the day streak and rolls daily quests: once after load, then on focus at most
  // once a minute. Same-day repeats are no-ops in the reducer, so this never writes needlessly.
  const visit = useCallback(() => {
    lastVisit.current = Date.now();
    return dispatch({ type: 'visit' });
  }, [dispatch]);
  useEffect(() => {
    if (!loaded) return;
    void visit();
    const onFocus = () => {
      if (Date.now() - lastVisit.current >= VISIT_THROTTLE_MS) void visit();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loaded, visit]);
  // Measurement, kept device-local: an open starts or continues a session, a beat credits engaged
  // milliseconds, and a count records what a screen just did. None of it earns XP or leaves the device.
  const noteOpen = useCallback(() => {
    lastBeat.current = Date.now();
    return dispatch({ type: 'analytics-open' });
  }, [dispatch]);
  const noteBeat = useCallback((ms: number) => dispatch({ type: 'analytics-beat', ms }), [dispatch]);
  const noteCount = useCallback(
    (delta: CountDelta) => void dispatch({ type: 'analytics-count', ...delta }),
    [dispatch],
  );
  useEffect(() => {
    if (!loaded) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const flush = () => {
      const now = Date.now(),
        ms = now - lastBeat.current;
      lastBeat.current = now;
      if (ms > 0) void noteBeat(ms);
    };
    const start = () => {
      if (timer !== null) return;
      lastBeat.current = Date.now();
      timer = setInterval(flush, HEARTBEAT_MS);
    };
    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
      flush(); // credit the part-interval up to the moment the tab went away
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void noteOpen();
        start();
      } else stop();
    };
    void noteOpen();
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timer !== null) clearInterval(timer);
    };
  }, [loaded, noteOpen, noteBeat]);
  const buyCosmetic = useCallback((id: string) => void dispatch({ type: 'cosmetic-buy', id }), [dispatch]);
  const equipCosmetic = useCallback(
    (id: string) => void dispatch({ type: 'cosmetic-equip', id }),
    [dispatch],
  );
  const epoch = useCallback(() => current.current.epoch, []);
  // The run id travels with the fold so a button left on screen across a restart cannot end the run
  // that replaced it — reduceExpeditions is identity when the ids disagree.
  const fold = useCallback(
    (routeId: string, runId: string) => dispatch({ type: 'journey-fold', routeId, runId }),
    [dispatch],
  );
  const open = useCallback((roundId: string) => void dispatch({ type: 'open', roundId }), [dispatch]);
  const recall = useCallback((roundId: string) => void dispatch({ type: 'recall', roundId }), [dispatch]);
  // What the Recall Lab dispatches instead of `recall`: this one moves the review schedule and pays,
  // so the promise is handed back and the caller fires its reward juice only once it has resolved.
  const review = useCallback(
    (attempt: ReviewAttempt) => dispatch({ type: 'review', ...attempt }),
    [dispatch],
  );
  // §3.5's deck out of a bad run: precisely these facts, due now. It moves `due` and nothing else and
  // so pays nothing; the promise comes back only so the caller can navigate once the write has landed,
  // never onto a Vault whose queue does not hold them yet. `at` pins the instant — `dispatch` stamps
  // its own `at` from the clock, so an explicit one has to travel beside it.
  const seedReview = useCallback(
    (entries: SeedEntry[], at?: number) => dispatch({ type: 'review-seed', factIds: entries, seedAt: at }),
    [dispatch],
  );
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
    progression: profile.progression,
    analytics: profile.analytics,
    level: levelForXp(profile.progression?.xp ?? 0),
    loaded,
    persistent,
    storageError,
    fold,
    open,
    recall,
    review,
    seedReview,
    save,
    clear,
    skin,
    exportAll,
    report,
    visit,
    noteOpen,
    noteBeat,
    noteCount,
    buyCosmetic,
    equipCosmetic,
  };
}
