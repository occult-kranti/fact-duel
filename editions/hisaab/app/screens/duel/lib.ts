/**
 * screens/duel/lib.ts — what the Muqabla setup, the P2P lobby, the room and Pass & Play share:
 * format copy with the engine's real numbers, the sector pools a duel may be filtered to, the
 * player's optional display name, the one-shot "start" intents that carry a tap from the setup screen
 * into the room, and the words for P2P errors.
 */
import { MODE_ROUNDS } from '@/lib/server/room-engine.mjs';
import { STORAGE } from '@/lib/storage-names.mjs';
import { DUEL_FORMATS } from '../../../edition';
import { ANONYMOUS, BANK_ITEMS, impersonatesBot, SECTOR_LIST, SECTOR_NAMES_HI } from '../../data';
import type { DuelMode } from '../room/lib';

export type Opponent = 'bot' | 'friend' | 'pass';
export const OPPONENTS: readonly Opponent[] = ['bot', 'friend', 'pass'];

// ---- formats (the engine's own: lib/server/room-engine.mjs via edition.ts DUEL_FORMATS) ------------------

export type Format = (typeof DUEL_FORMATS)[number];
export const FORMATS = DUEL_FORMATS as readonly Format[];
export const MODES = FORMATS.map((f) => f.mode) as readonly DuelMode[];
export const formatOf = (mode: string | null | undefined): Format =>
  FORMATS.find((f) => f.mode === mode) ?? FORMATS[0];

/** Devanagari names for the formats (Hindi locale; drafts for the Hindi review). */
const FORMAT_HI: Record<DuelMode, string> = {
  quick: 'क्विक ड्रॉ',
  trilogy: 'ट्रिपल थ्रेट',
  gauntlet: 'द गॉन्टलेट',
};
export const formatNameHi = (mode: DuelMode) => FORMAT_HI[mode];

/** "1 question · 10 s" · "Best of 3 · 7 s" · "5 questions · 5 s" (untimed for Pass & Play). */
export function formatLine(mode: DuelMode, untimed = false, isHi = false): string {
  const f = formatOf(mode);
  const clock = untimed ? (isHi ? 'बिना टाइमर' : 'untimed') : `${f.duration} s`;
  if (isHi) {
    const n = mode === 'quick' ? '1 सवाल' : mode === 'trilogy' ? '3 में से 2' : `${f.rounds} सवाल`;
    return `${n} · ${clock}`;
  }
  const n = mode === 'quick' ? '1 question' : mode === 'trilogy' ? 'Best of 3' : `${f.rounds} questions`;
  return `${n} · ${clock}`;
}

/** How a format ends, in one line (the engine's rules: ENGINE §6.2). */
export function formatRule(mode: DuelMode, isHi = false): string {
  if (isHi)
    return mode === 'quick'
      ? 'एक सवाल। तेज़ सही जवाब जीतता है।'
      : mode === 'trilogy'
        ? 'पहले 2 राउंड जीतो।'
        : 'पाँचों सवाल। ज़्यादा राउंड जीतने वाला जीतता है।';
  return mode === 'quick'
    ? 'One question. The faster correct answer wins.'
    : mode === 'trilogy'
      ? 'First to win 2 rounds.'
      : 'All five questions. Most rounds won wins.';
}

export const roundsFor = (mode: DuelMode) => (MODE_ROUNDS as Record<DuelMode, number>)[mode];

/** "Round 2 of 3" — Triple Threat can end after two. */
export function roundOf(mode: DuelMode, index: number, isHi = false): string {
  const total = roundsFor(mode);
  if (isHi) return total === 1 ? 'एक राउंड' : `राउंड ${index + 1}/${total}`;
  if (total === 1) return 'One round';
  return mode === 'trilogy' ? `Round ${index + 1} · best of ${total}` : `Round ${index + 1} of ${total}`;
}

// ---- sector filter (the engine filters by topic; ENGINE §6.1) ----------------------------------------------

export type Pool = { topic: string; count: number };

/** Items per sector in the served bank, in the charter's sector order. */
export function sectorPools(): Pool[] {
  const counts = new Map<string, number>();
  for (const q of BANK_ITEMS) if (q.domain === 'civics') counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
  return SECTOR_LIST.map((topic) => ({ topic, count: counts.get(topic) ?? 0 }));
}
export const totalPool = () => BANK_ITEMS.filter((q) => q.domain === 'civics').length;

/** A filter is playable only when its pool holds at least one question per round of the format. */
export const poolFits = (count: number, mode: DuelMode) => count >= roundsFor(mode);

export const sectorName = (topic: string, isHi: boolean) =>
  isHi ? (SECTOR_NAMES_HI[topic] ?? topic) : topic;

// ---- query parsing (setup → room / lobby / pass) -----------------------------------------------------------

export const parseMode = (v: string | undefined): DuelMode =>
  MODES.includes(v as DuelMode) ? (v as DuelMode) : 'quick';
export const parseOpponent = (v: string | undefined): Opponent =>
  OPPONENTS.includes(v as Opponent) ? (v as Opponent) : 'bot';
export function parseTopic(v: string | undefined, mode: DuelMode): string {
  if (!v || v === 'all') return 'all';
  const pool = sectorPools().find((p) => p.topic === v);
  return pool && poolFits(pool.count, mode) ? v : 'all';
}

// ---- the player's display name (optional; N13/N14: never pre-filled with anything but their own) ---------

export const NAME_LIMIT = 24;

export function readName(): string {
  try {
    return (localStorage.getItem(STORAGE.name) ?? '').trim().slice(0, NAME_LIMIT);
  } catch {
    return '';
  }
}

/** Keep a name the player typed for next time (blank clears it). */
export function saveName(name: string) {
  const clean = name.trim().slice(0, NAME_LIMIT);
  try {
    if (clean) localStorage.setItem(STORAGE.name, clean);
    else localStorage.removeItem(STORAGE.name);
  } catch {
    /* storage blocked: the name lives for this match only */
  }
}

/**
 * The seat name sent to the engine (1–24 chars): the typed name, else "Anonymous Janta". A name that
 * would pass for the bot on the other screen ('Babu-Bot · BOT') is sent as "Anonymous Janta" too.
 */
export const seatNameFor = (name: string) => {
  const clean = name.trim().slice(0, NAME_LIMIT);
  return clean && !impersonatesBot(clean) ? clean : ANONYMOUS;
};

// ---- one-shot intents: a tap on the setup screen, carried into the next screen once ----------------------

export type DuelConfig = { mode: DuelMode; duration: number; topic: string };
export type BotIntent = { kind: 'bot'; config: DuelConfig; name: string };
export type HostIntent = { kind: 'host'; config: DuelConfig; name: string; via: 'net' | 'tab' };

let botIntent: BotIntent | null = null;
let hostIntent: HostIntent | null = null;

export function configFor(mode: DuelMode, topic: string): DuelConfig {
  return { mode, duration: formatOf(mode).duration, topic };
}

/** The setup screen's "Start vs Babu-Bot" tap. The room takes it exactly once (never auto-requeued). */
export function startBot(config: DuelConfig, name: string) {
  botIntent = { kind: 'bot', config, name };
}
export function takeBotIntent(): BotIntent | null {
  const i = botIntent;
  botIntent = null;
  return i;
}

/** The setup screen's "Create room" tap, taken once by the P2P lobby. */
export function startHost(config: DuelConfig, name: string, via: 'net' | 'tab' = 'net') {
  hostIntent = { kind: 'host', config, name, via };
}
export function takeHostIntent(): HostIntent | null {
  const i = hostIntent;
  hostIntent = null;
  return i;
}

// ---- P2P words -------------------------------------------------------------------------------------------------

export type P2PError = { code?: string; message?: string } | null | undefined;

/** A P2P error in words, keyed by the protocol's error codes (ENGINE §12). */
export function p2pErrorText(e: P2PError, t: (en: string, hi?: string) => string): string {
  switch (e?.code) {
    case 'invalid_code':
      return t(
        'Enter the 8-character room code, like 7K2Q-9FHM.',
        '8 अक्षरों का रूम कोड डालें, जैसे 7K2Q-9FHM।',
      );
    case 'p2p_timeout':
      return t(
        'Could not reach your friend’s browser. Check the code, and that your friend has the room open.',
        'दोस्त के ब्राउज़र तक नहीं पहुँच पाए। कोड जाँचें, और देखें कि दोस्त ने रूम खोला हुआ है।',
      );
    case 'p2p_mismatch':
      return (
        e.message ||
        t(
          'Your friend is on a different version. Both of you reload and try again.',
          'दोस्त दूसरे वर्ज़न पर है। दोनों पेज रीलोड करके फिर कोशिश करें।',
        )
      );
    case 'p2p_disconnected':
      return t('Your friend’s browser disconnected.', 'दोस्त का ब्राउज़र डिस्कनेक्ट हो गया।');
    case 'room_full':
      return t('This room already has two players.', 'इस रूम में पहले से दो खिलाड़ी हैं।');
    case 'p2p_unavailable':
      return t(
        'Couldn’t open a direct connection in this browser — some networks block this.',
        'इस ब्राउज़र में सीधा कनेक्शन नहीं खुला — कुछ नेटवर्क इसे रोकते हैं।',
      );
    default:
      return e?.message || t('Something went wrong with the connection.', 'कनेक्शन में कुछ गड़बड़ हुई।');
  }
}

// Rematch codes come from the room's stretched secret: `rematchCode` in p2p/protocol.mjs.
