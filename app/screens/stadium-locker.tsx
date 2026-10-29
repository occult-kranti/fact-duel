'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Flame, Gem, Lamp, Landmark, Shirt, Sparkles, Trophy, Type } from 'lucide-react';
import { activeClubBadges, CLUB_ITEMS, clubBalance, createClubRecord, transactClub, transactClubMemory } from '@/lib/stadium-collection.mjs';
import { useLocale } from '../use-locale';
import { STORAGE } from '@/lib/storage-names.mjs';
import type { Player } from './types';
import './stadium-locker.css';

type ClubRecord = ReturnType<typeof createClubRecord>;
type ClubResult = { record: ClubRecord; status: string };
type Action = { type: string; id: string } | null;
const GROUPS = [
  { id: 'build', name: 'Build', hi: 'मैदान', icon: Landmark, slots: ['stand', 'light', 'board'] },
  { id: 'title', name: 'Titles', hi: 'खिताब', icon: Type, slots: ['title'] },
  { id: 'card', name: 'Cards', hi: 'कार्ड', icon: Shirt, slots: ['card'] },
];

/** Real equipped pieces are composed into one tiny ground, with no canvas or GPU dependency. */
export function ClubGround({ equipped }: { equipped: Record<string, string> }) {
  const pavilion = equipped.stand === 'stand-pavilion';
  const lit = equipped.light === 'light-floodlights';
  const screen = equipped.board === 'board-screen';
  return <svg className="sc-ground" viewBox="0 0 400 225" aria-hidden="true">
    <ellipse cx="200" cy="165" rx="161" ry="42" fill="#000" opacity=".17" />
    <path d="M42 130 Q200 52 358 130 L358 150 Q200 233 42 150Z" fill="#15382e" />
    <ellipse cx="200" cy="130" rx="158" ry="70" fill="#266d47" />
    <ellipse cx="200" cy="129" rx="139" ry="59" fill="#3f8d51" stroke="#d9f5c0" strokeWidth="2" />
    <ellipse cx="200" cy="129" rx="98" ry="41" fill="none" stroke="#b4df8b" strokeWidth="1" strokeDasharray="5 5" />
    <path d="M171 105 L213 105 L232 153 L188 153Z" fill="#ddc994" />
    <path d="M175 115 L217 115 M184 144 L228 144" stroke="#fff9db" strokeWidth="2" />
    <path d="M194 106 L195 97 M200 106 L201 97 M206 106 L207 97 M202 151 L203 142 M208 151 L209 142 M214 151 L215 142" stroke="#f5e8c0" strokeWidth="2" />
    <g fill="#c5cdb9" stroke="#789a89" strokeWidth="1.5">
      <path d="M53 103 L95 80 L145 95 L104 120Z" /><path d="M53 103 L53 117 L104 137 L104 120Z" fill="#7f9280" /><path d="M104 120 L145 95 L145 109 L104 137Z" fill="#a5b5a1" />
    </g>
    {pavilion && <g><path d="M53 85 L96 64 L145 78 L104 103Z" fill="#f0ecda" /><path d="M53 85 L53 103 L104 121 L104 103Z" fill="#c5bdaa" /><path d="M104 103 L145 78 L145 95 L104 121Z" fill="#e2dac6" /><path d="M45 84 L95 57 L153 77 L104 105Z" fill="#ee8053" /><path d="M95 57 L95 38" stroke="#f5f0df" strokeWidth="2" /><path d="M96 38 L117 42 L96 49Z" fill="#d7fa78" /><path d="M63 91 L64 106 M78 96 L79 112 M94 101 L94 117 M114 99 L114 113 M131 88 L131 102" stroke="#666b60" strokeWidth="4" /></g>}
    <g transform="translate(280 64)"><path d="M-21 24 L-21 52 M21 24 L21 52" stroke="#b2bcb7" strokeWidth="4" /><path d="M-38 -3 L32 -3 L32 36 L-38 36Z" fill={screen ? '#142c43' : '#dfd6b5'} stroke="#869d8f" strokeWidth="4" /><text x="-3" y="24" textAnchor="middle" fill={screen ? '#d8ff72' : '#345148'} fontSize={screen ? '23' : '16'} fontWeight="800" fontFamily="sans-serif">{screen ? 'JHK' : '05 / 0'}</text></g>
    {lit && [[55, 142], [132, 64], [305, 137], [336, 92]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}><path d="M0 0 L0 -65" stroke="#adc5bd" strokeWidth="3" /><path d="M-11 -65 L12 -65 L12 -76 L-11 -76Z" fill="#f4ffe7" stroke="#adc5bd" strokeWidth="2" /><path d="M-7 -72 L8 -72 M-7 -68 L8 -68" stroke="#d8ff72" strokeWidth="2" /></g>)}
  </svg>;
}

export function StadiumLocker({ player, name = 'Challenger' }: { player: Player; name?: string }) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const [record, setRecord] = useState<ClubRecord>(() => createClubRecord(player.profile?.epoch));
  const [category, setCategory] = useState('build');
  const [busy, setBusy] = useState(true);
  const [persistent, setPersistent] = useState(true);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(0);
  const current = useRef(record);
  const profile = useRef(player.profile);
  const storage = useRef(true);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const channel = useRef<BroadcastChannel | null>(null);
  const live = useRef(true);
  const actionLock = useRef(false);
  useEffect(() => { profile.current = player.profile; }, [player.profile]);

  const apply = useCallback((action: Action = null) => {
    const snapshot = profile.current;
    const requestEpoch = snapshot?.epoch;
    if (action && actionLock.current) return;
    if (action) actionLock.current = true;
    setBusy(true);
    queue.current = queue.current.then(async () => {
      let result: ClubResult;
      try {
        if (!storage.current) throw new Error('Session storage');
        result = await transactClub(snapshot, action) as ClubResult;
      } catch {
        storage.current = false;
        result = transactClubMemory(snapshot, action, current.current);
        if (live.current) setPersistent(false);
      }
      if (!live.current || requestEpoch !== profile.current?.epoch) return;
      current.current = result.record;
      setRecord(result.record);
      if (action) {
        const label = CLUB_ITEMS.find((i) => i.id === action.id)?.name ?? (action.id === 'none' ? 'Badge hidden' : 'Badge');
        setMessage(result.status === 'insufficient' ? (hi ? 'और क्लब पॉइंट कमाने के लिए खेलें।' : 'Play a little more to earn the remaining Club points.') : result.status === 'bought' ? `${label} · ${hi ? 'खरीदा और लगाया' : 'bought & equipped'}` : `${label} · ${hi ? 'लगाया' : 'equipped'}`);
        channel.current?.postMessage('changed');
      }
      window.dispatchEvent(new CustomEvent('jhk-club-equipped', { detail: result.record.equipped }));
    }).finally(() => { actionLock.current = false; if (live.current) setBusy(false); });
  }, [hi]);

  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => { if (player.loaded) apply(); }, [player.loaded, player.profile?.revision, player.profile?.epoch, apply]);
  useEffect(() => {
    const refresh = () => { setNow(Date.now()); if (player.loaded) apply(); };
    const clock = () => setNow(Date.now());
    clock();
    const timer = window.setInterval(clock, 30_000);
    window.addEventListener('focus', refresh);
    if (typeof BroadcastChannel !== 'undefined') { channel.current = new BroadcastChannel(STORAGE.stadiumClubChannel); channel.current.onmessage = refresh; }
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); channel.current?.close(); channel.current = null; };
  }, [player.loaded, apply]);

  const balance = clubBalance(record);
  const selected = GROUPS.find((g) => g.id === category)!;
  const title = CLUB_ITEMS.find((i) => i.id === record.equipped.title)?.name ?? 'Gully captain';
  const badges = activeClubBadges(player.profile, now);
  const badge = badges.find((b) => b.id === record.badge);
  const expiry = (at: number) => { const minutes = Math.max(1, Math.ceil((at - now) / 60_000)); return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`; };
  const copyCard = async () => {
    const text = `${name} / ${title}${badge ? ` / ${badge.name} (${expiry(badge.expiresAt)} left)` : ''}\nMy JHK club: ${['stand', 'light', 'board'].map((slot) => CLUB_ITEMS.find((i) => i.id === record.equipped[slot])?.name).join(' · ')}\nDevice-local practice card · ${player.progression?.counters?.matches ?? 0} matches. Play: https://occult-kranti.github.io/fact-duel/`;
    try { await navigator.clipboard.writeText(text); setMessage(hi ? 'कार्ड की जानकारी कॉपी हो गई।' : 'Card details copied. Share them wherever you like.'); }
    catch { setMessage(hi ? 'कॉपी उपलब्ध नहीं है। अपने कार्ड का स्क्रीनशॉट लें।' : 'Copy is unavailable here. You can take a screenshot of your card.'); }
  };

  return <section className="sc-locker" aria-labelledby="sc-locker-title">
    <header className="sc-heading"><div><p className="sc-eyebrow">{hi ? 'अपना मैदान। अपना अंदाज़।' : 'YOUR GROUND. YOUR REPUTATION.'}</p><h2 id="sc-locker-title">{hi ? 'क्लब बनाओ।' : 'Build your brag.'}</h2></div><span className="sc-balance"><Gem size={18} aria-hidden="true" /><b data-testid="club-balance">{balance}</b><small>{hi ? 'क्लब पॉइंट' : 'Club points'}</small></span></header>
    <div className="sc-layout">
      <div className="sc-showcase">
        <article className="sc-player-card" data-finish={record.equipped.card} data-testid="club-card">
          <div className="sc-card-top"><span>JHK / CLUB ID</span><span>{hi ? 'इस डिवाइस पर' : 'ON THIS DEVICE'}</span></div>
          <div className="sc-card-name"><span className="sc-monogram" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span><div><h3>{name}</h3><p>{title}</p></div><Trophy size={26} aria-hidden="true" /></div>
          <ClubGround equipped={record.equipped} />
          <div className="sc-card-bottom"><span><b>{player.progression?.counters?.matches ?? 0}</b>{hi ? 'मैच' : 'matches'}</span><span><b>{player.progression?.counters?.correct ?? 0}</b>{hi ? 'सही जवाब' : 'correct'}</span><span><b>{record.owned.filter((id) => (CLUB_ITEMS.find((i) => i.id === id)?.price ?? 0) > 0).length}</b>{hi ? 'अपग्रेड' : 'upgrades'}</span></div>
          {badge && <div className="sc-active-badge"><Flame size={16} aria-hidden="true" /><strong>{badge.name}</strong><span>{expiry(badge.expiresAt)} {hi ? 'बाकी' : 'left'}</span></div>}
        </article>
        <button className="sc-copy" type="button" onClick={copyCard}><Copy size={16} aria-hidden="true" />{hi ? 'कार्ड शेयर करने के लिए कॉपी करें' : 'Copy my player card'}<ArrowUpRight size={16} aria-hidden="true" /></button>
        <p className="sc-scope">{hi ? 'स्थानीय अभ्यास की पहचान। ऑनलाइन रैंक नहीं।' : 'Your local practice identity. Not an online rank.'}</p>
        <details className="sc-badge-panel"><summary><Flame size={18} aria-hidden="true" />{hi ? 'समय वाले बैज' : 'Limited-time flex'}<span>{badges.length} {hi ? 'सक्रिय' : 'active'}</span></summary>
          <p>{hi ? 'जीत का बैज 24 घंटे रहता है। पिछली तीन जीत 24 घंटे में हों तो Hat-trick heat मिलता है।' : 'A win earns Fresh victory for 24 hours. Win your latest three matches within 24 hours for Hat-trick heat. Practice wins count.'}</p>
          {badges.map((b) => <button key={b.id} type="button" disabled={busy} aria-pressed={record.badge === b.id} onClick={() => apply({ type: 'badge', id: b.id })}><span>{b.name}<small>{expiry(b.expiresAt)} {hi ? 'बाकी' : 'left'}</small></span>{record.badge === b.id ? <Check size={16} /> : <Sparkles size={16} />}</button>)}
          {!badges.length && <span className="sc-badge-empty">{hi ? 'अगली जीत से शुरू करें।' : 'Your next win starts the clock.'}</span>}
          <button type="button" disabled={busy} aria-pressed={record.badge === 'none'} onClick={() => apply({ type: 'badge', id: 'none' })}>{hi ? 'बैज छिपाएँ' : 'Hide timed badge'}{record.badge === 'none' && <Check size={16} />}</button>
        </details>
      </div>
      <div className="sc-shop">
        <div className="sc-categories" aria-label={hi ? 'क्लब की श्रेणी' : 'Club shop category'}>{GROUPS.map(({ id, name: label, hi: hindi, icon: Icon }) => <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}><Icon size={18} aria-hidden="true" />{hi ? hindi : label}</button>)}</div>
        <p className="sc-earn">{hi ? 'हर पूरा मैच +30 · हर सही जवाब +3। पॉइंट मुफ्त हैं; नकद मूल्य नहीं।' : '+30 per completed match · +3 per correct answer. Free points; no cash value.'}</p>
        <div className="sc-items">{CLUB_ITEMS.filter((i) => selected.slots.includes(i.slot)).map((entry) => {
          const owned = record.owned.includes(entry.id);
          const equipped = record.equipped[entry.slot] === entry.id;
          const afford = balance >= entry.price;
          const Icon = entry.slot === 'light' ? Lamp : entry.slot === 'title' ? Type : entry.slot === 'card' ? Shirt : Landmark;
          return <article key={entry.id} className="sc-item" data-equipped={equipped} data-item-id={entry.id}><span className="sc-item-icon" data-slot={entry.slot}><Icon size={24} aria-hidden="true" /></span><div className="sc-item-info"><h3>{entry.name}</h3><p>{entry.description}</p><span>{entry.price ? `${entry.price} ${hi ? 'क्लब पॉइंट' : 'Club points'}` : hi ? 'शुरुआती आइटम' : 'Starter edition'}</span></div><button type="button" disabled={busy || !player.loaded || equipped || (!owned && !afford)} aria-label={`${equipped ? 'Equipped' : owned ? 'Equip' : 'Buy'} ${entry.name}${!owned ? ` for ${entry.price} Club points` : ''}`} onClick={() => apply({ type: owned ? 'equip' : 'buy', id: entry.id })}>{equipped ? <><Check size={15} aria-hidden="true" />{hi ? 'लगा है' : 'Equipped'}</> : owned ? (hi ? 'लगाएँ' : 'Equip') : afford ? (hi ? 'खरीदें' : 'Buy & equip') : `${hi ? 'और चाहिए' : 'Need'} ${entry.price - balance}`}</button></article>;
        })}</div>
      </div>
    </div>
    <p className="sc-status" role="status" aria-live="polite">{message}</p>
    {!persistent && <p className="sc-storage" role="status">{hi ? 'ब्राउज़र में सेव नहीं हो रहा। ये बदलाव इस विज़िट तक रहेंगे।' : 'Browser storage is unavailable. These club changes last for this visit only.'}</p>}
  </section>;
}
