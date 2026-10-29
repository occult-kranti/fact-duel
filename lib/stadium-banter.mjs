/** Fixed cricket sledges. No user text, score effects, purchases or gameplay interruption. */
import { STORAGE } from './storage-names.mjs';
export const BANTER_COOLDOWN_MS = 8000;
export const BANTER_VISIBLE_MS = 12000;
export const BANTER_STORAGE_KEY = STORAGE.stadiumBanterMute;
export const STADIUM_STICKERS = Object.freeze([
  { id: 'all-talk', glyph: '📣', en: 'All talk!', hi: 'बातें बड़ी!' },
  { id: 'appeal-rejected', glyph: '☝️', en: 'Appeal rejected.', hi: 'अपील खारिज।' },
  { id: 'brain-duck', glyph: '🦆', en: 'Brain duck.', hi: 'दिमाग़ का डक।' },
  { id: 'nice-shot', glyph: '🏏', en: 'Nice shot!', hi: 'शानदार शॉट!' },
  { id: 'check-replay', glyph: '📺', en: 'Check the replay.', hi: 'रीप्ले देखो।' },
  { id: 'too-easy', glyph: '😎', en: 'Too easy.', hi: 'बहुत आसान।' },
].map(sticker => Object.freeze(sticker)));
export const stickerById = id => STADIUM_STICKERS.find(sticker => sticker.id === id) ?? null;
export const BOT_REPLY = Object.freeze({ 'all-talk': 'check-replay', 'appeal-rejected': 'all-talk', 'brain-duck': 'too-easy', 'nice-shot': 'nice-shot', 'check-replay': 'appeal-rejected', 'too-easy': 'brain-duck' });

/** Independent of UI rendering: synchronous guard rejects double taps before a promise yields. */
export function createBanterGate() {
  let lastAt = -Infinity, lastRound = null;
  return {
    take(sticker, roundKey, now) {
      if (!stickerById(sticker) || typeof roundKey !== 'string' || !roundKey || !Number.isFinite(now)) return false;
      if (lastRound === roundKey || now - lastAt < BANTER_COOLDOWN_MS) return false;
      lastAt = now; lastRound = roundKey; return true;
    },
    available(roundKey, now) { return lastRound !== roundKey && now - lastAt >= BANTER_COOLDOWN_MS; },
  };
}

export function visibleBanter(events, now) {
  if (!Array.isArray(events) || !Number.isFinite(now)) return [];
  return events.filter(event => event && typeof event.id === 'string' && typeof event.playerId === 'string' && stickerById(event.sticker) && Number.isFinite(event.at) && event.at <= now + 1000 && now - event.at <= BANTER_VISIBLE_MS).slice(-2);
}

export function readBanterMute(storage) { try { return storage?.getItem(BANTER_STORAGE_KEY) === 'true'; } catch { return false; } }
export function writeBanterMute(storage, muted) { try { storage?.setItem(BANTER_STORAGE_KEY, String(!!muted)); } catch { /* Still works in this tab. */ } }
