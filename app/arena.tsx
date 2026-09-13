'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { usePlayer } from './use-player';
import { request } from '@/lib/duel-client';
import { AppShell } from './shell/app-shell';
import { ProgressionFeedback } from './screens/use-progression-feedback';
import { GemsChip, LevelRing, StreakChip } from './screens/player/topbar-chips';
import { SettingsSheet, SETTINGS_KEYS, type MotionPref } from './shell/settings-sheet';
import { HomeScreen } from './screens/home-screen';
import { PlayScreen } from './screens/play-screen';
import { RoomScreen } from './screens/room-screen';
import { PlayerScreen } from './screens/player-screen';
import { VaultScreen } from './screens/vault-screen';
import { DiscoveryScreen } from './screens/discovery-screen';
import { CollectionsScreen } from './screens/collections-screen';
import { ExpeditionsScreen } from './screens/expeditions-screen';
import { EventsScreen } from './screens/events-screen';
import { AnalyticsScreen } from './screens/analytics-screen';
import { RulesScreen } from './screens/rules-screen';
import { ShowroomScreen } from './screens/showroom-screen';
import { eventModeEvent } from '@/lib/progression.mjs';
import {
  INITIAL_CONFIG,
  MODES,
  type ArmedMode,
  type Config,
  type Credentials,
  type DuelController,
  type EventMode,
  type PendingAnswer,
  type StartMark,
} from './screens/types';

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join(
    '',
  );
}
function roomId() {
  return crypto.randomUUID().replaceAll('-', '');
}
function safeSave(value: Credentials | null) {
  try {
    if (value) sessionStorage.setItem('fact-duel-online-seat', JSON.stringify(value));
    else sessionStorage.removeItem('fact-duel-online-seat');
  } catch {}
}
function parseInvite(text: string) {
  const url = new URL(text, window.location.origin);
  const id = url.searchParams.get('room'),
    invite = new URLSearchParams(url.hash.slice(1)).get('invite');
  if (!id || !invite || !/^[a-f0-9]{32}$/.test(id) || !/^[A-Za-z0-9_-]{32,64}$/.test(invite))
    throw new Error('Paste the complete invitation link, including its ending.');
  return { roomId: id, invite };
}

/* Orchestrator: owns state, networking, clock calibration, polling, the reveal marker, keyboard
 * handling, WebMCP registration, sound and every dialog. Screens under ./screens are presentational. */
/**
 * `initialTab` is how the `/analytics` route enters: app/analytics/page.tsx renders this same
 * orchestrator with the measurement screen already selected. Everything else routes as a tab.
 */
export default function Arena({ initialTab = 'home' }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab),
    [catalogue, setCatalogue] = useState<any>(null),
    [config, setConfig] = useState<Config>(INITIAL_CONFIG),
    [name, setName] = useState('Challenger'),
    [joinLink, setJoinLink] = useState(''),
    [joinView, setJoinView] = useState(false),
    [room, setRoom] = useState<any>(null),
    [credentials, setCredentials] = useState<Credentials | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [note, setNote] = useState(''),
    [light, setLight] = useState(false),
    [sound, setSound] = useState(true),
    [leaveOpen, setLeaveOpen] = useState(false),
    [metrics, setMetrics] = useState({ rttMs: 0, jitterMs: 0, offset: 0, samples: 0 }),
    [remaining, setRemaining] = useState(0),
    [shown, setShown] = useState(false),
    [answerPending, setAnswerPending] = useState(false),
    [countdown, setCountdown] = useState(3),
    [connected, setConnected] = useState(true),
    [copied, setCopied] = useState(false);
  const [selectedExpedition, setSelectedExpedition] = useState<string | null>(null);
  /* The limited-time event mode currently armed, if any. It holds the duel it stands for so the
   * settle handler can check the match that actually ran was that duel before paying the badge. */
  const [eventMode, setEventMode] = useState<ArmedMode | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false),
    [clearOpen, setClearOpen] = useState(false),
    [chosen, setChosen] = useState<number | null>(null),
    [volume, setVolume] = useState(0.35),
    [showArt, setShowArt] = useState(true),
    [haptics, setHaptics] = useState(true),
    [motion, setMotion] = useState<MotionPref>('full');
  const player = usePlayer(room, credentials?.profileEpoch);
  const { clear: clearJournal } = player;
  const playedCues = useRef(new Set<string>()),
    lastFocusKey = useRef<string | null>(null);
  const roomRef = useRef<any>(null),
    credRef = useRef<Credentials | null>(null),
    clock = useRef(metrics),
    audio = useRef<AudioContext | null>(null),
    startMark = useRef<StartMark | null>(null),
    pending = useRef<PendingAnswer | null>(null),
    locked = useRef(false),
    mutation = useRef(false),
    revealing = useRef(false),
    createDraft = useRef<any>(null),
    joinDraft = useRef<any>(null),
    alive = useRef(true),
    recovered = useRef(false),
    eventPaid = useRef<string | null>(null),
    countedRounds = useRef(new Set<string>()),
    countedMatch = useRef<string | null>(null),
    countedQuests = useRef<number | null>(null);
  const signal = useCallback(
    (type: string) => {
      if (!sound || volume <= 0 || document.hidden) return;
      try {
        audio.current = audio.current || new AudioContext();
        const ac = audio.current;
        void ac.resume();
        const notes =
          type === 'stamp'
            ? [392, 523.25, 659.25, 783.99]
            : type === 'correct'
              ? [523.25, 659.25]
              : type === 'learn'
                ? [392, 440]
                : type === 'win'
                  ? [523.25, 659.25, 783.99]
                  : type === 'loss'
                    ? [392, 329.63]
                    : type === 'draw'
                      ? [440, 440]
                      : type === 'count'
                        ? [523.25]
                        : [440];
        notes.forEach((frequency, i) => {
          const o = ac.createOscillator(),
            g = ac.createGain();
          o.type = type === 'count' ? 'sine' : 'triangle';
          o.connect(g);
          g.connect(ac.destination);
          o.frequency.value = frequency;
          const t = ac.currentTime + i * 0.095;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.1 * volume), t + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
          o.start(t);
          o.stop(t + 0.14);
        });
      } catch {}
    },
    [sound, volume],
  );
  const accept = useCallback((data: any) => {
    const next = data.room;
    if (!next || !alive.current || credRef.current?.roomId !== next.id) return;
    const prev = roomRef.current;
    if (prev?.id === next.id && prev.revision > next.revision) return;
    roomRef.current = next;
    if (!prev || next.revision !== prev.revision || next.round?.question?.id !== prev.round?.question?.id)
      setRoom(next);
    setConnected(true);
  }, []);
  const remember = useCallback(
    (c: Credentials | null) => {
      const bound = c ? { ...c, profileEpoch: c.profileEpoch ?? player.epoch() } : null;
      credRef.current = bound;
      setCredentials(bound);
      safeSave(bound);
    },
    [player.epoch],
  );
  useEffect(() => {
    alive.current = true;
    request({ action: 'catalogue' })
      .then((data) => setCatalogue(data.catalogue))
      .catch((e) => setError(e.message));
    try {
      setLight(localStorage.getItem(SETTINGS_KEYS.theme) === 'light');
      setShowArt(localStorage.getItem(SETTINGS_KEYS.art) !== 'off');
      setSound(localStorage.getItem(SETTINGS_KEYS.sound) !== 'off');
      const savedName = localStorage.getItem(SETTINGS_KEYS.name);
      if (savedName) setName(savedName.slice(0, 24));
      const v = Number(localStorage.getItem(SETTINGS_KEYS.volume) ?? '.35');
      if (Number.isFinite(v)) setVolume(Math.max(0, Math.min(1, v)));
      const h = localStorage.getItem(SETTINGS_KEYS.haptics);
      if (h === 'on' || h === 'off') setHaptics(h === 'on');
      const m = localStorage.getItem(SETTINGS_KEYS.motion);
      if (m === 'full' || m === 'reduced' || m === 'off') setMotion(m);
      else if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setMotion('reduced');
    } catch {}
    try {
      const url = new URL(window.location.href);
      if (url.hash.includes('invite=')) {
        setTab('arena');
        setJoinView(true);
        setJoinLink(url.toString());
        history.replaceState({}, '', url.pathname);
      } else {
        const saved = JSON.parse(sessionStorage.getItem('fact-duel-online-seat') || 'null');
        if (saved?.roomId && saved?.token) {
          recovered.current = true;
          remember({ ...saved, profileEpoch: saved.profileEpoch ?? 'initial' });
        }
      }
    } catch {}
    return () => {
      alive.current = false;
    };
  }, [remember]);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    try {
      localStorage.setItem(SETTINGS_KEYS.theme, light ? 'light' : 'dark');
      localStorage.setItem(SETTINGS_KEYS.sound, sound ? 'on' : 'off');
    } catch {}
  }, [light, sound]);
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEYS.name, name);
      localStorage.setItem(SETTINGS_KEYS.volume, String(volume));
    } catch {}
  }, [name, volume]);
  useEffect(() => {
    document.documentElement.dataset.motion = motion;
  }, [motion]);
  const changeHaptics = (on: boolean) => {
    setHaptics(on);
    try {
      localStorage.setItem(SETTINGS_KEYS.haptics, on ? 'on' : 'off');
    } catch {}
  };
  const changeMotion = (pref: MotionPref) => {
    setMotion(pref);
    try {
      localStorage.setItem(SETTINGS_KEYS.motion, pref);
    } catch {}
  };
  const changeShowArt = (on: boolean) => {
    setShowArt(on);
    try {
      localStorage.setItem(SETTINGS_KEYS.art, on ? 'on' : 'off');
    } catch {}
  };
  const calibrate = useCallback(async () => {
    const samples: { rtt: number; offset: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const before = performance.now();
      const data = await request({ action: 'clock' });
      const after = performance.now();
      samples.push({ rtt: after - before, offset: data.serverNow - (before + after) / 2 });
    }
    const sorted = [...samples].sort((a, b) => a.rtt - b.rtt);
    const m = {
      rttMs: Math.round(sorted[0].rtt),
      jitterMs: Math.round(sorted[6].rtt - sorted[0].rtt),
      offset: sorted[0].offset,
      samples: samples.length,
    };
    clock.current = m;
    setMetrics(m);
    return m;
  }, []);
  useEffect(() => {
    void calibrate().catch(() => {});
  }, [calibrate]);
  useEffect(() => {
    if (!credentials) return;
    let stopped = false,
      timer: any;
    const poll = async () => {
      try {
        const data = await request({ action: 'state', ...credentials });
        if (stopped) return;
        accept(data);
        if (
          recovered.current &&
          data.room.round?.issuedAt !== null &&
          data.room.round?.issuedAt !== undefined &&
          !data.room.round?.result
        ) {
          recovered.current = false;
          await request({ action: 'leave', ...credentials }).then(accept);
          setNote(
            'The page reloaded after the question appeared. The match was refunded to avoid restarting the timer.',
          );
        } else recovered.current = false;
      } catch (e: any) {
        if (stopped) return;
        setConnected(false);
        if ([403, 404, 410].includes(e.status)) {
          setError(e.message);
          remember(null);
          roomRef.current = null;
          setRoom(null);
          return;
        }
      } finally {
        if (!stopped && !roomRef.current?.settled) {
          const phase = roomRef.current?.phase;
          timer = setTimeout(
            poll,
            document.hidden ? 3000 : ['playing', 'scheduled'].includes(phase) ? 500 : 1500,
          );
        }
      }
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [credentials, accept, remember]);
  const mutate = useCallback(
    async (action: string, extra: any = {}) => {
      if (mutation.current || !credRef.current) return;
      mutation.current = true;
      setBusy(true);
      setError('');
      try {
        const data = await request({ action, ...credRef.current, ...extra });
        accept(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        mutation.current = false;
        setBusy(false);
      }
    },
    [accept],
  );
  const resetLocal = useCallback(() => {
    remember(null);
    roomRef.current = null;
    setRoom(null);
    startMark.current = null;
    pending.current = null;
    locked.current = false;
    setChosen(null);
    revealing.current = false;
    setShown(false);
    setAnswerPending(false);
    setError('');
    createDraft.current = null;
    joinDraft.current = null;
  }, [remember]);
  const leave = useCallback(async () => {
    await mutate('leave');
    setLeaveOpen(false);
  }, [mutate]);
  useEffect(() => {
    const visibility = () => {
      const r = roomRef.current,
        c = credRef.current;
      if (document.hidden && c && r && ['playing', 'scheduled'].includes(r.phase)) {
        void request({ action: 'leave', ...c })
          .then(accept)
          .catch(() => setError('Connection lost while leaving. Reconnect to check the match status.'));
      }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [accept]);
  const phase = room?.phase,
    rd = room?.round,
    question = rd?.question;
  useEffect(() => {
    const key = room ? `${room.id}:${phase}:${rd?.id}:${question && shown ? 'question' : 'state'}` : tab;
    if (lastFocusKey.current === null) {
      lastFocusKey.current = key;
      return;
    }
    if (lastFocusKey.current === key || document.hidden || settingsOpen || leaveOpen || clearOpen) return;
    if (question && !rd?.result && !shown) return;
    lastFocusKey.current = key;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(
        question && shown && !rd?.result ? '.question-card h1' : '#main-content h1, #main-content h2',
      );
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: false });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [tab, room?.id, phase, rd?.id, !!question, !!rd?.result, shown, settingsOpen, leaveOpen, clearOpen]);
  useEffect(() => {
    if (!room || !['scheduled', 'playing'].includes(room.phase)) return;
    let running = true;
    const check = async () => {
      const r = roomRef.current,
        c = credRef.current;
      if (!r?.round || !c || !running) return;
      const until = r.round.scheduledAt - (performance.now() + clock.current.offset);
      setCountdown(Math.max(0, Math.ceil(until / 1000)));
      if (until <= 0 && r.round.issuedAt === null && !revealing.current) {
        revealing.current = true;
        try {
          const data = await request({ action: 'reveal', ...c, roundId: r.round.id });
          accept(data);
        } catch (e: any) {
          if (e.code !== 'too_early') setError(e.message);
        } finally {
          revealing.current = false;
        }
      }
    };
    const id = setInterval(check, 150);
    void check();
    return () => {
      running = false;
      clearInterval(id);
    };
  }, [room?.id, phase, rd?.id, accept]);
  useLayoutEffect(() => {
    if (!question || rd?.result) return;
    if (startMark.current?.roundId === rd.id) return;
    setShown(false);
    setChosen(null);
    setAnswerPending(false);
    locked.current = false;
    pending.current = null;
    let a = 0,
      b = 0;
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => {
        startMark.current = { roundId: rd.id, at: performance.now() };
        setShown(true);
        setRemaining(room.config.duration * 1000);
      });
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [question?.id, rd?.result, rd?.id, room?.config.duration]);
  const expire = useCallback(() => setRemaining(0), []);
  useEffect(() => {
    if (rd?.result) {
      locked.current = true;
      setAnswerPending(false);
      const key = `result-${rd.id}`;
      if (!playedCues.current.has(key)) {
        playedCues.current.add(key);
        signal(rd.result.winner === null ? 'draw' : rd.result.winner === room.seat ? 'win' : 'loss');
      }
    }
  }, [rd?.id, rd?.result, room?.seat, signal]);
  useEffect(() => {
    if (!rd || question || !['scheduled', 'playing'].includes(phase) || ![1, 2, 3].includes(countdown))
      return;
    const key = `count-${rd.id}-${countdown}`;
    if (!playedCues.current.has(key)) {
      playedCues.current.add(key);
      signal('count');
    }
  }, [rd?.id, question?.id, phase, countdown, signal]);
  const sendPending = useCallback(async () => {
    const p = pending.current,
      c = credRef.current;
    if (!p || !c) return;
    setAnswerPending(true);
    setError('');
    try {
      const data = await request({ action: 'answer', ...c, ...p });
      accept(data);
      setAnswerPending(false);
    } catch (e: any) {
      setAnswerPending(false);
      setError(
        e.status === 409 ? e.message : 'Your choice is locked on this screen. Retry sending the same answer.',
      );
    }
  }, [accept]);
  const answer = useCallback(
    (choice: number) => {
      const r = roomRef.current,
        start = startMark.current;
      if (
        !r?.round ||
        r.round.result ||
        locked.current ||
        r.round.answerLocked[r.seat] ||
        !start ||
        start.roundId !== r.round.id ||
        !shown
      )
        return;
      const elapsedMs = performance.now() - start.at;
      if (elapsedMs >= r.config.duration * 1000) return;
      locked.current = true;
      setChosen(choice);
      pending.current = { roundId: r.round.id, attemptId: randomToken(), choice, elapsedMs };
      signal('lock');
      void sendPending();
    },
    [shown, signal, sendPending],
  );
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target.isContentEditable ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
        leaveOpen ||
        settingsOpen
      )
        return;
      if (['1', '2', '3', '4'].includes(e.key) && roomRef.current?.phase === 'playing') {
        e.preventDefault();
        answer(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answer, leaveOpen, settingsOpen]);
  async function create(forcedConfig?: Config) {
    if (busy || !player.loaded) return;
    if (!name.trim()) {
      setError('Choose a player name first.');
      return;
    }
    setBusy(true);
    setError('');
    setShowArt(false);
    const draft =
      createDraft.current ||
      (createDraft.current = {
        roomId: roomId(),
        token: randomToken(),
        invite: randomToken(),
        name,
        profileEpoch: player.epoch(),
        config: { ...(forcedConfig || config) },
      });
    try {
      const data = await request({ action: 'create', ...draft });
      remember({
        roomId: draft.roomId,
        token: draft.token,
        invite: draft.invite,
        profileEpoch: draft.profileEpoch,
      });
      accept(data);
      createDraft.current = null;
      if (draft.config.opponent === 'bot' && data.room.phase === 'waiting') {
        const m = clock.current.samples ? clock.current : await calibrate();
        accept(
          await request({
            action: 'ready',
            roomId: draft.roomId,
            token: draft.token,
            roundId: null,
            rttMs: m.rttMs,
            jitterMs: m.jitterMs,
          }),
        );
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function join() {
    if (busy || !player.loaded) return;
    if (!name.trim()) {
      setError('Choose a player name first.');
      return;
    }
    setShowArt(false);
    setBusy(true);
    setError('');
    try {
      const info = parseInvite(joinLink);
      const draft =
        joinDraft.current ||
        (joinDraft.current = { ...info, token: randomToken(), name, profileEpoch: player.epoch() });
      const data = await request({ action: 'join', ...draft });
      remember({ roomId: draft.roomId, token: draft.token, profileEpoch: draft.profileEpoch });
      accept(data);
      joinDraft.current = null;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function ready() {
    setBusy(true);
    setError('');
    try {
      const m = await calibrate();
      setBusy(false);
      await mutate('ready', {
        roundId: roomRef.current?.round?.id || null,
        rttMs: m.rttMs,
        jitterMs: m.jitterMs,
      });
    } catch (e: any) {
      setError('Could not check the connection. Try ready again.');
      setBusy(false);
    }
  }
  async function copyInvite() {
    const c = credentials;
    if (!c?.invite) return;
    const link = `${window.location.origin}/?room=${c.roomId}#invite=${c.invite}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNote(link);
    }
  }
  const change = (patch: Partial<Config>) => {
    createDraft.current = null;
    setConfig((c) => ({ ...c, ...patch }));
  };
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: any) => {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
      } catch {}
    };
    register({
      name: 'read_duel_status',
      description:
        'Read the visible room phase, scores, and demo coin balances. Does not reveal private answers or access tokens.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input: any) {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length)
          throw new Error('Expected an empty object.');
        const r = roomRef.current;
        return r
          ? { phase: r.phase, scores: r.scores, balances: r.balances, round: r.roundIndex + 1 }
          : { phase: 'lobby' };
      },
    });
    register({
      name: 'configure_duel_mode',
      description:
        'Choose Quick Draw, Triple Threat or The Gauntlet in the lobby. Does not create a room or reserve coins.',
      inputSchema: {
        type: 'object',
        properties: { mode: { type: 'string', enum: ['quick', 'trilogy', 'gauntlet'] } },
        required: ['mode'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: any) {
        if (
          !input ||
          Object.keys(input).length !== 1 ||
          !['quick', 'trilogy', 'gauntlet'].includes(input.mode)
        )
          throw new Error('Choose quick, trilogy or gauntlet.');
        if (roomRef.current) throw new Error('Leave the current room before changing mode.');
        createDraft.current = null;
        setConfig((c) => ({ ...c, mode: input.mode }));
        setTab('arena');
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        return { mode: input.mode, roomCreated: false };
      },
    });
    return () => lifecycle.abort();
  }, []);
  const active = !!room && ['playing', 'scheduled'].includes(phase),
    isLocked = !!rd?.answerLocked?.[room?.seat] || locked.current;
  const modeInfo = MODES.find((m) => m.id === config.mode) || MODES[0];
  const matchMode = MODES.find((m) => m.id === room?.config.mode) || MODES[0];
  const chooseCollection = (domain: string, topic: string) => {
    change({ domain, topic, subtopic: 'all', region: 'all', difficulty: 'all' });
    setJoinView(false);
    setTab('arena');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const go = (next: string) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const missionAction = (action: string) => {
    if (action.startsWith('topic:')) {
      const topic = action.slice(6),
        item = catalogue?.topics.find((t: any) => t.topic === topic);
      if (item) chooseCollection(item.domain, topic);
      return;
    }
    if (['quick', 'trilogy', 'gauntlet'].includes(action)) {
      setJoinView(false);
      change({ mode: action });
      go('arena');
    } else go(action === 'play' ? 'discovery' : action === 'recall' ? 'discovery' : 'journal');
  };
  const clearFilters = () =>
    change({ domain: 'all', topic: 'all', subtopic: 'all', region: 'all', difficulty: 'all' });
  const leaveOrBack = () => (room?.settled ? resetLocal() : setLeaveOpen(true));
  const openExpedition = (id: string | null) => {
    setSelectedExpedition(id);
    go('journeys');
  };
  const quickDuel = (mode: string, topic = 'all') => {
    const chosenTopic = catalogue?.topics.find((t: any) => t.topic === topic);
    const next = { ...INITIAL_CONFIG, mode, topic, domain: chosenTopic?.domain || 'all' };
    createDraft.current = null;
    setConfig(next);
    setJoinView(false);
    go('arena');
    void create(next);
  };
  const setupDuel = (intent: 'friend' | 'join' | 'settings' = 'settings') => {
    setJoinView(intent === 'join');
    if (intent === 'friend') change({ opponent: 'friend' });
    go('arena');
  };
  /* Arming a limited-time mode is a configurator change and nothing else: the same `change` the
   * mode cards and topic chips use, then Play with the launch control in view. No new networking
   * path, no room, no timing involved. */
  const chooseEventMode = (mode: EventMode | null) => {
    if (!mode) {
      setEventMode(null);
      return;
    }
    setEventMode({
      id: mode.id,
      name: mode.template.name,
      badge: mode.badge,
      xpBonus: mode.xpBonus,
      duel: mode.duel,
    });
    change({
      mode: mode.duel.mode,
      duration: mode.duel.duration,
      topic: mode.duel.topic,
      domain: mode.duel.domain,
      subtopic: 'all',
      region: 'all',
      difficulty: 'all',
    });
    setJoinView(false);
    go('arena');
    requestAnimationFrame(() => {
      const bar = document.querySelector<HTMLElement>('.fd-play .fd-launch');
      if (!bar) return;
      const box = bar.getBoundingClientRect();
      // On a phone the launch bar is fixed above the tab bar and already in view; only scroll
      // when it genuinely is not (the desktop right column).
      if (box.top >= 0 && box.bottom <= window.innerHeight) return;
      bar.scrollIntoView({
        block: 'center',
        behavior: document.documentElement.dataset.motion === 'full' ? 'smooth' : 'instant',
      });
    });
  };
  /* One settled match pays one event badge, at most once per room. The config check keeps it
   * honest: if the player re-picked the format or the topic after arming a mode, the match that
   * ran was not that mode and nothing is claimed. The reducer then pays a badge only once ever. */
  useEffect(() => {
    const armed = eventMode;
    if (!room?.settled || !armed || !player.loaded || eventPaid.current === room.id) return;
    const c = room.config || {};
    if (c.mode !== armed.duel.mode || c.duration !== armed.duel.duration || c.topic !== armed.duel.topic)
      return;
    eventPaid.current = room.id;
    void player.dispatch({
      type: 'event-mode',
      ...eventModeEvent({ badge: armed.badge, modeId: armed.id, xpBonus: armed.xpBonus }),
    });
  }, [room?.settled, room?.id, room?.config, eventMode, player.loaded, player.dispatch]);
  /* ---------- measurement (lib/analytics.mjs) ----------
   * The counters are recorded here, where the events actually happen, each behind the same kind of
   * once-per-event guard the rest of this file uses: a round when its result lands (keyed by round
   * id), a match when the room settles (keyed by room id), and a quest when progression's own
   * `questsDone` counter moves. Expedition cards are counted in the expedition run, where the card
   * is answered. None of it earns XP, none of it re-fires on a re-render, and none of it leaves the
   * device — `player.noteCount` writes into the device-local analytics record and nothing else. */
  const { noteCount } = player;
  useEffect(() => {
    if (!player.loaded || !rd?.id || !rd.result || countedRounds.current.has(rd.id)) return;
    countedRounds.current.add(rd.id);
    noteCount({ rounds: 1 });
  }, [player.loaded, rd?.id, rd?.result, noteCount]);
  useEffect(() => {
    if (!player.loaded || !room?.settled || !room.id || countedMatch.current === room.id) return;
    countedMatch.current = room.id;
    noteCount({ matches: 1 });
  }, [player.loaded, room?.settled, room?.id, noteCount]);
  useEffect(() => {
    if (!player.loaded) return;
    const done = player.progression?.counters?.questsDone ?? 0;
    const seen = countedQuests.current;
    // The first pass after load only marks where this device already was; a reset lowers the
    // counter and re-marks rather than counting backwards.
    countedQuests.current = done;
    if (seen !== null && done > seen) noteCount({ quests: done - seen });
  }, [player.loaded, player.progression?.counters?.questsDone, noteCount]);
  /* The address bar follows the measurement screen when the app is served from its own root, where
   * /analytics is a real route (app/analytics/page.tsx). The path guard keeps the static build — it
   * is served under a base path and has no server to answer a reloaded /analytics — out of this. */
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (pathname !== '/' && pathname !== '/analytics') return;
    const want = tab === 'analytics' && !room ? '/analytics' : '/';
    if (pathname !== want) history.replaceState({}, '', `${want}${search}${hash}`);
  }, [tab, !!room]);
  const duel: DuelController = {
    room,
    phase: phase ?? '',
    rd,
    question,
    shown,
    chosen,
    isLocked,
    answerPending,
    remaining,
    countdown,
    connected,
    busy,
    error,
    copied,
    name,
    config,
    modeInfo,
    matchMode,
    MODES,
    credentials,
    eventModeId: eventMode?.id ?? '',
    startMark,
    pendingAnswer: pending,
    actions: {
      answer,
      ready,
      copyInvite,
      addBot: () => void mutate('add_bot'),
      leaveOrBack,
      resetLocal,
      create,
      join,
      mutate,
      sendPending,
      expire,
      go,
      signal,
      setConfig,
      change,
      setName: (value, draft) => {
        setName(value);
        if (draft === 'create') createDraft.current = null;
        if (draft === 'join') joinDraft.current = null;
      },
      setJoinView,
      setJoinLink: (value) => {
        setJoinLink(value);
        joinDraft.current = null;
      },
      clearFilters,
      chooseCollection,
      chooseEventMode,
    },
  };
  return (
    <>
      <AppShell
        effects={
          <ProgressionFeedback
            progression={player.progression}
            quiet={{
              // Toasts stay out of the way while a question is on screen; full-screen ceremonies
              // wait until the player is off every playing surface, so nothing ever covers a round,
              // a reveal or an expedition card (a ceremony also locks body scroll while open).
              toasts: !!room && ['scheduled', 'playing'].includes(room.phase) && !room.round?.result,
              ceremonies: !!room || tab === 'journeys',
            }}
          />
        }
        tab={tab}
        inRoom={!!room}
        active={active}
        skin={player.passport.skin}
        onNavigate={go}
        topbar={{
          streak: <StreakChip progression={player.progression} />,
          gems: <GemsChip progression={player.progression} />,
          level: <LevelRing progression={player.progression} level={player.level} />,
          sound,
          onToggleSound: () => setSound((v) => !v),
          onOpenSettings: () => setSettingsOpen(true),
          onBrand: () => {
            if (room) leaveOrBack();
            else go('home');
          },
        }}
        footer={
          <footer className="fd-footer">
            <span>KNOW IT. PROVE IT.</span>
            <span>
              <button className="footer-rules" onClick={() => go('rules')}>
                Play rules
              </button>{' '}
              · Free simulated coins · Private playtest
            </span>
            <a href="/studio">Research & roadmap</a>
          </footer>
        }
      >
        {!room && player.storageError && (
          <p className="notice-box" role="status">
            {player.storageError}
          </p>
        )}
        <div className="announcements" aria-live="polite">
          {error && (
            <div role="alert" className="error-box">
              {error}
              {!catalogue && !room && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setError('');
                    request({ action: 'catalogue' })
                      .then((d) => setCatalogue(d.catalogue))
                      .catch((e) => setError(e.message));
                  }}
                >
                  Retry loading
                </Button>
              )}
            </div>
          )}
          {note && (
            <div className="notice-box">
              <span>{note}</span>
              <Button variant="ghost" size="icon" aria-label="Dismiss notice" onClick={() => setNote('')}>
                <X />
              </Button>
            </div>
          )}
        </div>
        {!room && tab === 'home' && (
          <HomeScreen
            player={player}
            name={name}
            ready={player.loaded && !!catalogue && !!name.trim()}
            busy={busy}
            onRoute={openExpedition}
            onDuel={quickDuel}
            onSetup={setupDuel}
            go={go}
          />
        )}
        {!room && tab === 'journeys' && (
          <ExpeditionsScreen
            player={player}
            selected={selectedExpedition}
            onSelect={openExpedition}
            onDuel={quickDuel}
            signal={signal}
            go={go}
          />
        )}
        {!room && tab === 'arena' && (
          <PlayScreen
            duel={duel}
            player={player}
            catalogue={catalogue}
            joinView={joinView}
            joinLink={joinLink}
          />
        )}
        {!room && tab === 'events' && (
          <EventsScreen
            player={player}
            ready={player.loaded && !!catalogue && !!name.trim()}
            busy={busy}
            onDuel={quickDuel}
            onMode={chooseEventMode}
            activeModeId={eventMode?.id ?? ''}
            go={go}
          />
        )}
        {!room && tab === 'analytics' && (
          <AnalyticsScreen player={player} go={go} onErase={() => setClearOpen(true)} />
        )}
        {!room && tab === 'showroom' && <ShowroomScreen showArt={showArt} onShowArt={setShowArt} go={go} />}
        {!room && tab === 'collections' && (
          <CollectionsScreen player={player} catalogue={catalogue} onChoose={chooseCollection} />
        )}
        {!room && tab === 'passport' && (
          <PlayerScreen
            player={player}
            catalogue={catalogue}
            onOpenExpedition={openExpedition}
            onMissionAction={missionAction}
            go={go}
          />
        )}
        {!room && tab === 'discovery' && <DiscoveryScreen player={player} topic={config.topic} go={go} />}
        {!room && tab === 'journal' && <VaultScreen player={player} go={go} />}
        {!room && (tab === 'rules' || tab === 'timing') && <RulesScreen view={tab} go={go} />}
        {room && <RoomScreen duel={duel} player={player} />}
      </AppShell>
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        name={name}
        onNameChange={(value) => {
          setName(value);
          createDraft.current = null;
          joinDraft.current = null;
        }}
        sound={sound}
        onSoundChange={setSound}
        volume={volume}
        onVolumeChange={setVolume}
        onPreviewSound={() => signal('win')}
        haptics={haptics}
        onHapticsChange={changeHaptics}
        motion={motion}
        onMotionChange={changeMotion}
        light={light}
        onLightChange={setLight}
        showArt={showArt}
        onShowArtChange={changeShowArt}
        canExport={player.loaded}
        onExport={player.exportAll}
        onOpenMeasurement={() => {
          setSettingsOpen(false);
          go('analytics');
        }}
        onReset={() => {
          setSettingsOpen(false);
          setClearOpen(true);
        }}
      />
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this match?</AlertDialogTitle>
            <AlertDialogDescription>
              The room ends for both players. Unsettled entries are refunded; completed payouts remain final.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep playing</AlertDialogCancel>
            <AlertDialogAction onClick={leave}>Leave & refund</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset your local activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your Vault of facts and saved question issues, expedition progress, scores and
              stamps, XP, gems and activity points, side quests and earned card finishes in this browser — and
              the measurement record behind the Analytics screen: sessions, active days, the day-by-day
              activity and the retention answer. Export first to keep a copy. Theme, sound preferences and
              room coins are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep activity</AlertDialogCancel>
            <AlertDialogAction disabled={!player.loaded} onClick={clearJournal}>
              Reset local activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
