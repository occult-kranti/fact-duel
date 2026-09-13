/**
 * app/screens/home/util.ts — pure helpers for the Arena Hub.
 * No React, no I/O: accent/frame mapping, relative time, quest routing and the daily reset clock.
 */
import { MODE_NAMES } from '@/lib/progression.mjs';

const MODE_LABEL = MODE_NAMES as Record<string, string>;

/* ---------- cosmetics ---------- */
/** Equipped accent id → the Floodlight token that paints the card, and the hex the 3D orb needs. */
export const ACCENTS: Record<string, { token: string; hex: string; soft: string }> = {
  volt: { token: 'var(--volt)', hex: '#d4ff3a', soft: 'var(--volt-soft)' },
  coral: { token: 'var(--ember)', hex: '#ff7a2f', soft: 'var(--ember-soft)' },
  cyan: { token: 'var(--cyan)', hex: '#4ee1ff', soft: 'var(--cyan-soft)' },
  magenta: { token: 'var(--magenta)', hex: '#ff5ea8', soft: 'var(--magenta-soft)' },
  gold: { token: 'var(--gold)', hex: '#ffc83d', soft: 'var(--gold-soft)' },
};
export const accentOf = (id: string | undefined) => ACCENTS[id ?? 'volt'] ?? ACCENTS.volt;

/** Frames are drawn in CSS from `data-frame`; this is only the human label for the card. */
export const FRAME_LABELS: Record<string, string> = {
  default: 'Standard frame',
  'chartreuse-ring': 'Chartreuse ring',
  'gold-laurel': 'Gold laurel',
  ember: 'Ember frame',
  prism: 'Prism frame',
  obsidian: 'Obsidian frame',
};

/* ---------- time ---------- */
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;

/** Short, non-alarming relative stamp for the XP log ("just now", "12m", "3h", "yesterday"). */
export function relativeTime(at: number, now = Date.now()): string {
  const d = Math.max(0, now - at);
  if (d < MIN) return 'just now';
  if (d < HOUR) return `${Math.floor(d / MIN)}m ago`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h ago`;
  if (d < 2 * DAY) return 'yesterday';
  if (d < 7 * DAY) return `${Math.floor(d / DAY)}d ago`;
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Hours/minutes until the next local midnight, when the three daily quests roll over. */
export function untilReset(now = Date.now()): string {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const left = next.getTime() - now;
  const h = Math.floor(left / HOUR);
  return h >= 1 ? `${h}h` : `${Math.max(1, Math.round(left / MIN))}m`;
}

/* ---------- quests ---------- */
export type QuestItem = {
  id: string;
  template: string;
  label: string;
  target: number;
  progress: number;
  xp: number;
  gems: number;
  done: boolean;
  topic?: string;
  mode?: string;
};

export type QuestRoute =
  | { kind: 'duel'; mode: string; topic?: string }
  | { kind: 'expedition' }
  | { kind: 'tab'; tab: string }
  | { kind: 'setup'; intent: 'friend' | 'join' | 'settings' };

const EXPEDITION_QUESTS = new Set(['expedition-cards-2', 'expedition-finish-1', 'bold-4']);
const MODE_QUESTS: Record<string, string> = { 'win-gauntlet': 'gauntlet', 'perfect-trilogy': 'trilogy' };

/** Where a quest card sends you: the shortest honest path to finishing it. */
export function questRoute(item: QuestItem): QuestRoute {
  if (item.template === 'topic-play') return { kind: 'duel', mode: 'quick', topic: item.topic };
  if (item.template === 'mode-play') return { kind: 'duel', mode: item.mode ?? 'quick' };
  if (MODE_QUESTS[item.template]) return { kind: 'duel', mode: MODE_QUESTS[item.template] };
  if (EXPEDITION_QUESTS.has(item.template)) return { kind: 'expedition' };
  if (item.template === 'open-2' || item.template === 'save-2') return { kind: 'tab', tab: 'journal' };
  if (item.template === 'discovery-1') return { kind: 'tab', tab: 'discovery' };
  if (item.template === 'human-1') return { kind: 'setup', intent: 'friend' };
  return { kind: 'setup', intent: 'settings' };
}

/** One line of goal-gradient copy per quest: what is left, never what was missed. */
export function questHint(item: QuestItem): string {
  if (item.done) return 'Done — reward banked';
  const left = Math.max(0, item.target - item.progress);
  if (item.template === 'topic-play' && item.topic) return `Opens a ${item.topic} duel`;
  if (item.template === 'mode-play' && item.mode) return `Opens ${MODE_LABEL[item.mode] ?? 'a duel'}`;
  if (item.target === 1) return 'One run away';
  return left === 1 ? '1 more to go' : `${left} more to go`;
}
