'use client';
import { useEffect, useRef, useState } from 'react';
import { Bird, Clapperboard, Glasses, Megaphone, MessageCircle, ShieldX, Trophy, VolumeX } from 'lucide-react';
import { BANTER_COOLDOWN_MS, BOT_REPLY, STADIUM_STICKERS, createBanterGate, readBanterMute, stickerById, visibleBanter, writeBanterMute } from '@/lib/stadium-banter.mjs';
import { useLocale } from '../../use-locale';
import './banter-tray.css';

export type BanterEvent = { id: string; playerId: string; sticker: string; at: number; round?: number };
type Props = {
  active: boolean; matchKey: string; roundKey: string; mode: 'bot' | 'human';
  peerName?: string; selfId?: string; events?: BanterEvent[]; serverNow?: number;
  enabled?: boolean; onSend?: (sticker: string, requestId: string) => Promise<void>; onInteract?: () => void;
};
const STICKER_ICONS = { 'all-talk': Megaphone, 'appeal-rejected': ShieldX, 'brain-duck': Bird, 'nice-shot': Trophy, 'check-replay': Clapperboard, 'too-easy': Glasses };
function StickerGlyph({ id }: { id: string }) {
  const Icon = STICKER_ICONS[id as keyof typeof STICKER_ICONS] || MessageCircle;
  return <Icon size={26} strokeWidth={1.8} aria-hidden="true" />;
}

/** Lives below the whole round, never over answers. Remains mounted but absent during timed play. */
export function BanterTray({ active, matchKey, roundKey, mode, peerName = 'Opponent', selfId = 'self', events = [], serverNow, enabled = true, onSend, onInteract }: Props) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [muted, setMuted] = useState(() => { try { return readBanterMute(window.localStorage); } catch { return false; } });
  const [note, setNote] = useState({ round: '', text: '' });
  const [sentRound, setSentRound] = useState('');
  const [mutedAt, setMutedAt] = useState(0);
  const [speech, setSpeech] = useState<(BanterEvent & { roundKey: string }) | null>(null);
  const [cooling, setCooling] = useState(false);
  const gate = useRef(createBanterGate());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const flight = useRef(false);
  const current = useRef({ active, muted, matchKey });
  useEffect(() => { current.current = { active, muted, matchKey }; }, [active, muted, matchKey]);
  useEffect(() => () => { current.current.active = false; timers.current.forEach(clearTimeout); timers.current = []; }, []);
  useEffect(() => {
    if (!speech) return;
    const timer = setTimeout(() => setSpeech(previous => previous?.id === speech.id ? null : previous), 6000);
    return () => clearTimeout(timer);
  }, [speech]);

  function toggleMute() {
    const value = !muted; setMuted(value); setSpeech(null); setNote({ round: roundKey, text: '' }); setMutedAt(serverNow ?? Date.now());
    try { writeBanterMute(window.localStorage, value); } catch { /* Restricted storage: current tab only. */ }
    onInteract?.();
  }
  async function handleSend(sticker: string, eventTime: number) {
    if (!active || muted || !enabled || flight.current || (mode === 'human' && !onSend)) return;
    if (!gate.current.take(sticker, roundKey, eventTime)) return;
    flight.current = true; setCooling(true); setSentRound(roundKey); onInteract?.();
    const targetMatch = matchKey;
    const requestId = crypto.randomUUID();
    setNote({ round: roundKey, text: '' });
    try {
      if (mode === 'human') await onSend!(sticker, requestId);
      else {
        setSpeech({ id: requestId, playerId: selfId, sticker, at: eventTime, roundKey });
        timers.current.push(setTimeout(() => {
          if (!current.current.active || current.current.muted || current.current.matchKey !== targetMatch) return;
          setSpeech({ id: `${requestId}:bot`, playerId: 'practice-bot', sticker: BOT_REPLY[sticker as keyof typeof BOT_REPLY], at: Date.now(), roundKey });
        }, 1100));
      }
      if (current.current.matchKey === targetMatch) setNote({ round: roundKey, text: text('One sledge per break. Make it count.', 'हर ब्रेक में एक तंज। सोचकर बोलो।') });
    } catch {
      if (current.current.matchKey === targetMatch) setNote({ round: roundKey, text: text('Sticker was not confirmed. Keep playing.', 'स्टिकर की पुष्टि नहीं हुई। खेलते रहें।') });
    } finally {
      flight.current = false;
      timers.current.push(setTimeout(() => setCooling(false), BANTER_COOLDOWN_MS));
    }
  }
  if (!active) return null;
  const incoming = visibleBanter(events, serverNow ?? 0).filter((event: BanterEvent) => event.at > mutedAt && `${matchKey}:${event.round}` === roundKey).at(-1) as BanterEvent | undefined;
  const displayed = mode === 'human' ? incoming : speech?.roundKey === roundKey ? speech : null;
  const sticker = displayed && stickerById(displayed.sticker);
  const canSend = enabled && !muted && !cooling && sentRound !== roundKey;
  return <section className="stadium-banter" aria-label={text('Boundary banter', 'बाउंड्री की बातें')} data-mode={mode}>
    <div className="stadium-banter-head"><span><MessageCircle size={17} aria-hidden="true" />{text('Boundary banter', 'बाउंड्री की बातें')}</span><button type="button" aria-pressed={muted} onClick={toggleMute} aria-label={text('Mute reactions', 'रिएक्शन म्यूट करें')}><VolumeX size={15} aria-hidden="true" />{muted ? text('Muted', 'म्यूट') : text('Mute', 'म्यूट करें')}</button></div>
    <p className="stadium-banter-scope">{mode === 'bot' ? text('Practice bot · playful, automatic replies', 'अभ्यास बॉट · मज़ेदार, अपने आप जवाब') : enabled ? text('To your opponent · between rounds only', 'प्रतिद्वंद्वी को · सिर्फ़ राउंड के बीच') : text('Opponent stickers are unavailable on this server.', 'इस सर्वर पर प्रतिद्वंद्वी स्टिकर उपलब्ध नहीं हैं।')}</p>
    <div className="stadium-banter-feed" aria-live="polite" aria-atomic="true" role="status">{!muted && sticker && <span className="stadium-banter-speech"><span aria-hidden="true"><StickerGlyph id={sticker.id} /></span><span><small>{displayed?.playerId === selfId ? text('You', 'आप') : mode === 'bot' ? text('Practice bot', 'अभ्यास बॉट') : peerName}</small><strong>{hi ? sticker.hi : sticker.en}</strong></span></span>}</div>
    {!muted && enabled && <div className="stadium-banter-stickers">{STADIUM_STICKERS.map(item => <button type="button" key={item.id} disabled={!canSend} onClick={event => { void handleSend(item.id, event.timeStamp); }} aria-label={`${text('Send', 'भेजें')}: ${hi ? item.hi : item.en}`} data-sticker={item.id}><span aria-hidden="true"><StickerGlyph id={item.id} /></span><b>{hi ? item.hi : item.en}</b></button>)}</div>}
    {note.round === roundKey && note.text && <p className="stadium-banter-note">{note.text}</p>}
  </section>;
}
