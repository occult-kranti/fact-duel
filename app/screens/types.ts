import type { RefObject } from 'react';
import { Zap, Swords, Rocket, type LucideIcon } from 'lucide-react';
import type { usePlayer } from '../use-player';
import { MODE_DURATION } from '@/lib/server/room-engine.mjs';

/* ---------- shared value types ---------- */
export type Config = {
  opponent: 'bot' | 'friend';
  mode: string;
  stake: number;
  duration: number;
  domain: string;
  region: string;
  topic: string;
  subtopic: string;
  difficulty: string;
};
export type Credentials = { roomId: string; token: string; invite?: string; profileEpoch?: string };
export type Mode = { id: string; name: string; short: string; rounds: number; icon: LucideIcon };
export type StartMark = { roundId: string; at: number };
export type PendingAnswer = { roundId: string; attemptId: string; choice: number; elapsedMs: number };
export type Player = ReturnType<typeof usePlayer>;
export type Tab =
  | 'home'
  | 'journeys'
  | 'arena'
  | 'passport'
  | 'journal'
  | 'events'
  | 'analytics'
  | 'collections'
  | 'discovery'
  | 'showroom'
  | 'rules'
  | 'timing';

/* ---------- the curated calendar (lib/events.mjs, which is plain JS) ---------- */
/** One sanitised entry from `readEvents`. Nothing is optional except the verified `headline`. */
export type CalendarEvent = {
  id: string;
  name: string;
  domain: string;
  topic: string;
  /** ISO 'YYYY-MM-DD' ends, inclusive. */
  start: string;
  end: string;
  startDay: number;
  endDay: number;
  blurb: string;
  whyQuiz: string;
  sourceUrl: string;
  /** The only field allowed to carry a result, and only when the dataset supplies it. */
  headline?: string;
};
/** One limited-time mode from `monthlyModes`: an event, a template, a window and a duel config. */
export type EventMode = {
  id: string;
  monthKey: string;
  event: CalendarEvent;
  template: { id: string; name: string; tagline: string; when: string; domain: string };
  window: { start: string; end: string };
  duel: { mode: string; duration: number; topic: string; domain: string };
  xpBonus: number;
  badge: string;
};
/** What arena.tsx keeps armed while a limited mode is being played. */
export type ArmedMode = {
  id: string;
  name: string;
  badge: string;
  xpBonus: number;
  duel: EventMode['duel'];
};

export const INITIAL_CONFIG: Config = {
  opponent: 'bot',
  mode: 'quick',
  stake: 0,
  duration: MODE_DURATION.quick,
  domain: 'all',
  region: 'all',
  topic: 'all',
  subtopic: 'all',
  difficulty: 'all',
};
export const MODES: Mode[] = [
  { id: 'quick', name: 'Quick Draw', short: 'One question. Make it count.', rounds: 1, icon: Zap },
  { id: 'trilogy', name: 'Triple Threat', short: 'Up to three. First to two wins.', rounds: 3, icon: Swords },
  {
    id: 'gauntlet',
    name: 'The Gauntlet',
    short: 'Five questions. Highest score wins.',
    rounds: 5,
    icon: Rocket,
  },
];

/* ---------- DuelController: everything the Play and Room screens need ---------- */
export type DuelActions = {
  /** Lock an answer (0–3). Ignored unless the reveal marker is set and the round is open. */
  answer: (choice: number) => void;
  /** Calibrate the clock, then send `ready` for the current round. */
  ready: () => Promise<void>;
  copyInvite: () => Promise<void>;
  /** Host adds the practice bot to the empty seat (`mutate('add_bot')`). */
  addBot: () => void;
  /** Settled room → local reset; otherwise opens the leave confirmation. */
  leaveOrBack: () => void;
  /** Forget the room, credentials, marker and pending answer without a server call. */
  resetLocal: () => void;
  create: (config?: Config) => Promise<void>;
  join: () => Promise<void>;
  mutate: (action: string, extra?: any) => Promise<void>;
  /** Re-send the locked answer after a transport failure. */
  sendPending: () => Promise<void>;
  /** RoundClock hit zero on this screen. */
  expire: () => void;
  go: (tab: string) => void;
  signal: (type: string) => void;
  setConfig: (config: Config) => void;
  /** Patch the configurator (also invalidates the create draft). */
  change: (patch: Partial<Config>) => void;
  /** Set the player name; `draft` names which room draft the edit invalidates. */
  setName: (name: string, draft?: 'create' | 'join') => void;
  setJoinView: (open: boolean) => void;
  setJoinLink: (link: string) => void;
  clearFilters: () => void;
  chooseCollection: (domain: string, topic: string) => void;
  /**
   * Arm a limited-time event mode: writes its duel config through `change`, moves to Play and
   * brings the launch control into view. `null` disarms without touching the config.
   */
  chooseEventMode: (mode: EventMode | null) => void;
};

export type DuelController = {
  room: any;
  /** `room?.phase` — '' when no room is open. */
  phase: string;
  rd: any;
  question: any;
  /** Reveal marker reached (double rAF): the question card is visible and the clock runs. */
  shown: boolean;
  chosen: number | null;
  isLocked: boolean;
  answerPending: boolean;
  remaining: number;
  countdown: number;
  connected: boolean;
  busy: boolean;
  error: string;
  copied: boolean;
  name: string;
  config: Config;
  /** Mode selected in the configurator. */
  modeInfo: Mode;
  /** Mode of the open room (falls back to MODES[0]). */
  matchMode: Mode;
  MODES: Mode[];
  credentials: Credentials | null;
  /** The armed limited-time mode's id, or '' — the Play row marks it as chosen. */
  eventModeId: string;
  /** Reveal marker ref read by RoundClock every 50 ms. */
  startMark: RefObject<StartMark | null>;
  /** The locked-but-unsent answer, if any (drives the retry button). */
  pendingAnswer: RefObject<PendingAnswer | null>;
  actions: DuelActions;
};

/* ---------- screen props ---------- */
export type HomeScreenProps = {
  player: Player;
  name: string;
  ready: boolean;
  busy: boolean;
  onRoute: (id: string | null) => void;
  onDuel: (mode: string, topic?: string) => void;
  onSetup: (intent?: 'friend' | 'join' | 'settings') => void;
  go: (tab: string) => void;
};
export type PlayScreenProps = {
  duel: DuelController;
  player: Player;
  catalogue: any;
  joinView: boolean;
  joinLink: string;
};
export type RoomScreenProps = {
  duel: DuelController;
  player: Player;
};
export type PlayerScreenProps = {
  player: Player;
  catalogue: any;
  onOpenExpedition: (id: string | null) => void;
  onMissionAction: (action: string) => void;
  go: (tab: string) => void;
};
export type AnalyticsScreenProps = {
  player: Player;
  /**
   * Opens the one confirmation that erases the measurement record — the same profile reset the
   * Settings sheet opens, because that reset is the only path that clears it.
   */
  onErase: () => void;
  go: (tab: string) => void;
};
export type VaultScreenProps = {
  player: Player;
  go: (tab: string) => void;
};
export type DiscoveryScreenProps = {
  player: Player;
  topic: string;
  go: (tab: string) => void;
};
export type CollectionsScreenProps = {
  player: Player;
  catalogue: any;
  onChoose: (domain: string, topic: string) => void;
};
export type ExpeditionsScreenProps = {
  player: Player;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onDuel: (mode: string, topic?: string) => void;
  signal: (type: string) => void;
  go: (tab: string) => void;
};
export type EventsScreenProps = {
  player: Player;
  /** The player can start a duel right now (catalogue loaded, name set) — same gate as Home. */
  ready: boolean;
  busy: boolean;
  /** Quick Draw on a topic: the path Home's quest cards already use. */
  onDuel: (mode: string, topic?: string) => void;
  /** Arm a limited-time mode and move to Play. */
  onMode: (mode: EventMode) => void;
  /** The armed mode's id, or '' when nothing is armed. */
  activeModeId: string;
  go: (tab: string) => void;
};
export type RulesScreenProps = {
  view: 'rules' | 'timing';
  go: (tab: string) => void;
};
export type ShowroomScreenProps = {
  showArt: boolean;
  onShowArt: (on: boolean) => void;
  go: (tab: string) => void;
};
