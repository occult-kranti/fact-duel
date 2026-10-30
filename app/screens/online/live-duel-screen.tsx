'use client';
/** JHK human beta. All scores, coins and time decisions come from the isolated server. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, RefreshCw, Swords, Wifi } from 'lucide-react';
import { jhkOnline as online } from '@/lib/jhk-online/runtime';
import type { Board, OnlineMatch, PlayerSession, Words } from '@/lib/jhk-online/types';
import { useLocale } from '../../use-locale';
import { BanterTray } from '../room/banter-tray';
import { ShareMoment } from '../room/share-moment';
import { ProfileOptions } from './profile-options';
import { CompletionAdBreak } from './completion-ad-break';
import { STORAGE } from '@/lib/storage-names.mjs';
import { startMatchSearch, BOT_FALLBACK_MS } from '@/lib/jhk-online/match-search.mjs';
import './online.css';
import { CricketOutcomeMoment } from '../../cricket-fx/cricket-outcome-moment';

const FILES = [
  ['all', 'Mixed sports & science', 'खेल और विज्ञान'], ['sports', 'Sports', 'खेल'], ['science', 'Science', 'विज्ञान'],
  ['cricket', 'Cricket', 'क्रिकेट'], ['football', 'Football', 'फ़ुटबॉल'], ['basketball', 'Basketball', 'बास्केटबॉल'],
  ['baseball', 'Baseball', 'बेसबॉल'], ['formula-1', 'Formula 1', 'फ़ॉर्मूला 1'], ['space', 'Space', 'अंतरिक्ष'],
  ['physics', 'Physics', 'भौतिकी'], ['biology', 'Biology', 'जीव विज्ञान'], ['computing', 'Computing', 'कंप्यूटिंग'],
] as const;
const isTerminal = (match: OnlineMatch | null) => !!match && ['finished', 'cancelled'].includes(match.phase);
const codeOf = (error: unknown) => (error as { code?: string })?.code;
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'The server could not complete this action.';
const sourceUrl = (value?: string) => { try { return value && new URL(value).protocol === 'https:' ? value : null; } catch { return null; } };
const STATIC_BASE = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.BASE_URL || '/').replace(/\/?$/, '/');
const preferredFile = () => { try { const choices = JSON.parse(localStorage.getItem(STORAGE.favouriteTopics) || '[]'); const first = Array.isArray(choices) ? choices.find(value => FILES.some(file => file[0] === value)) : null; return first || 'cricket'; } catch { return 'cricket'; } };

export function LiveDuelScreen({ name, onPractice, onHome, onState, onRoundKey, onBot, initialFile, initialIntent = 'play' }: {
  initialFile?: string; initialIntent?: 'play' | 'friend' | 'join'; name: string; onPractice: () => void; onHome: () => void; onBot?: (file: string, format?: 'mini' | 'full') => void; onState: (inMatch: boolean, playing: boolean) => void; onRoundKey?: (key: string | null) => void;
}) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const words = (value?: Words | null) => value ? hi ? value.hi || value.en : value.en : '';
  const fileLabel = (id: string) => { const row = FILES.find(f => f[0] === id) || FILES[0]; return row[hi ? 2 : 1]; };
  const [session, setSession] = useState<PlayerSession | null>(online.session);
  const [connected, setConnected] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(5);
  const [adult, setAdult] = useState(false);
  const searchRef = useRef<ReturnType<typeof startMatchSearch> | null>(null);
  const [match, setMatch] = useState<OnlineMatch | null>(null);
  const [file, setFile] = useState(() => FILES.some(row => row[0] === initialFile) ? initialFile! : preferredFile());
  const friendSection = useRef<HTMLElement>(null);
  const [format, setFormat] = useState<'mini' | 'full'>('mini');
  const formatLabel = (count: number) => count === 3 ? text('Mini over', 'मिनी ओवर') : count === 6 ? text('Full over', 'फुल ओवर') : text('Classic duel', 'क्लासिक मुक़ाबला');
  const [stakeText, setStakeText] = useState('0');
  const [invite, setInvite] = useState(() => new URLSearchParams(location.hash.split('?')[1] || '').get('code') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [view, setView] = useState<'play' | 'daily' | 'weekly' | 'savings'>('play');
  const [board, setBoard] = useState<Board | null>(null);
  const [now, setNow] = useState(online.now());
  const [pending, setPending] = useState<{ roomId: string; round: number; choice: number; requestId: string } | null>(null);
  const [quit, setQuit] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const alive = useRef(true), working = useRef(false), epoch = useRef(0);
  const matchRef = useRef<OnlineMatch | null>(null), answerKey = useRef('');
  const autoReadyRoom = useRef<string | null>(null);
  const balance = session?.balance ?? 0;
  const stake = Number(stakeText);
  const validStake = stakeText.trim() !== '' && Number.isSafeInteger(stake) && stake >= 0 && stake <= Math.min(balance, 10000);
  const terminal = isTerminal(match);
  const self = match?.players.find(p => p.id === match.selfId);
  const rival = match?.players.find(p => p.id !== match.selfId);
  const remaining = match ? Math.max(0, (match.deadlineAt - now) / 1000) : 0;
  const elapsed = match ? Math.max(0, Math.min(30, (now - match.startsAt) / 1000)) : 0;
  const expired = ['SESSION_EXPIRED', 'INVALID_SESSION', 'UNAUTHORIZED'].includes((error as string).split(':')[0]);

  const apply = useCallback((data: { match?: OnlineMatch; serverNow?: number }) => {
    const incoming = data.match;
    if (!incoming) return;
    const next = { ...incoming, serverNow: data.serverNow ?? incoming.serverNow };
    const previous = matchRef.current;
    if (previous?.id === next.id && previous.serverNow > next.serverNow) return;
    if (previous?.id !== next.id || previous?.round !== next.round) { answerKey.current = ''; setPending(null); }
    if (next.receipt) { answerKey.current = `${next.id}:${next.round}`; setPending(null); }
    matchRef.current = next; setMatch(next); setConnected(true); setError('');
    online.rememberRoom(isTerminal(next) ? null : next.id);
  }, []);
  const fail = useCallback((e: unknown) => {
    if (!alive.current || codeOf(e) === 'CANCELLED') return;
    setError(`${codeOf(e) || 'ERROR'}: ${messageOf(e)}`);
    if (['NETWORK', 'SESSION_EXPIRED', 'INVALID_SESSION', 'UNAUTHORIZED'].includes(codeOf(e) || 'NETWORK')) setConnected(false);
  }, []);
  useEffect(() => { alive.current = true; return () => { alive.current = false; epoch.current++; searchRef.current?.cancel(); }; }, []);
  useEffect(() => online.subscribe(() => setSession(online.session)), []);
  useEffect(() => { onState(!!match || searching, !!match && ['countdown', 'question'].includes(match.phase)); }, [match?.id, match?.phase, terminal, searching, onState]);
  useEffect(() => () => onState(false, false), [onState]);
  useEffect(() => { onRoundKey?.(match && !terminal ? `${match.id}:${match.round}` : null); return () => onRoundKey?.(null); }, [match?.id, match?.round, terminal, onRoundKey]);

  async function connect() {
    if (working.current) return;
    working.current = true; setBusy(true); setError(''); const turn = epoch.current;
    try {
      const player = await online.connect();
      if (!alive.current || turn !== epoch.current) return;
      setSession(player); setConnected(true);
      const saved = online.rememberedRoom();
      if (saved) {
        try { const data = await online.request('snapshot', { roomId: saved }); if (alive.current && turn === epoch.current) apply(data); }
        catch (e) { if (['ROOM_NOT_FOUND', 'MATCH_NOT_FOUND'].includes(codeOf(e) || '')) online.rememberRoom(null); else throw e; }
      }
    } catch (e) { fail(e); }
    finally { working.current = false; if (alive.current) setBusy(false); }
  }
  useEffect(() => { if (online.configured && online.session && !connected && !working.current) void connect(); }, [session?.id, session?.profileComplete, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialFile && FILES.some(row => row[0] === initialFile)) setFile(initialFile);
  }, [initialFile]);
  useEffect(() => {
    if (initialIntent === 'play') return;
    const frame = requestAnimationFrame(() => {
      const section = friendSection.current;
      section?.scrollIntoView({ block: 'start', behavior: 'auto' });
      const target = initialIntent === 'join' ? section?.querySelector<HTMLInputElement>('#jhk-live-code') : section?.querySelector<HTMLButtonElement>('button');
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialIntent]);
  function playAgain() {
    const nextFile = matchRef.current?.file || file;
    matchRef.current = null; setMatch(null); setPending(null); answerKey.current = '';
    online.rememberRoom(null); setError(''); setShareNote(''); setFile(nextFile);
    const nextFormat = match?.roundCount === 6 ? 'full' : 'mini';
    setFormat(nextFormat);
    quickPlay(0, nextFile, nextFormat);
  }
  function cancelSearch() {
    searchRef.current?.cancel(); searchRef.current = null;
    working.current = false; setSearching(false); setBusy(false); setError('');
    online.rememberRoom(null);
  }
  function quickPlay(stakeAmount = 0, fileOverride?: string, formatOverride?: 'mini' | 'full') {
    if (working.current || searching) return;
    if (online.configured && !(session?.adultConfirmed && session?.termsVersion === 'beta-1') && !adult) {
      setError(text('Confirm the beta terms to look for a human rival, or play a practice bot.', 'इंसानी प्रतिद्वंद्वी के लिए बीटा शर्तें स्वीकार करें, या अभ्यास बॉट से खेलें।'));
      document.getElementById('jhk-live-adult')?.focus(); return;
    }
    working.current = true; setBusy(false); setSearching(true); setSearchSeconds(5); setError(''); setView('play');
    const selectedFile = fileOverride || file;
    const selectedFormat = formatOverride || format;
    searchRef.current = startMatchSearch({
      queue: async (isActive: () => boolean) => {
        const player = await online.ensureGuest({ nickname: name?.trim() || 'Cricket fan', adultConfirmed: true, termsVersion: 'beta-1' });
        if (!isActive()) return null;
        if (alive.current) { setSession(player); setConnected(true); }
        return online.request('queue', { mode: 'ranked', file: selectedFile, stake: stakeAmount, format: selectedFormat });
      },
      snapshot: (roomId: string) => online.request('snapshot', { roomId }),
      leave: (roomId: string) => online.request('leave', { roomId }),
      onHuman: (data: { match?: OnlineMatch; serverNow?: number }) => {
        if (!alive.current) return;
        working.current = false; setSearching(false); searchRef.current = null; apply(data);
      },
      onBot: () => {
        if (!alive.current) return;
        working.current = false; setSearching(false); searchRef.current = null;
        online.rememberRoom(null); setError('');
        if (onBot) onBot(selectedFile, selectedFormat); else onPractice();
      },
      onError: () => { /* the fixed deadline keeps play moving when the network is unavailable */ },
    });
  }
  useEffect(() => {
    if (!searching) return;
    const started = performance.now();
    const timer = setInterval(() => setSearchSeconds(Math.max(0, Math.ceil((BOT_FALLBACK_MS - performance.now() + started) / 1000))), 100);
    return () => clearInterval(timer);
  }, [searching]);
  async function friendAction(action: 'create' | 'join', payload: Record<string, unknown>) {
    if (working.current) return;
    if (online.configured && !(session?.adultConfirmed && session?.termsVersion === 'beta-1') && !adult) {
      setError(text('Confirm the beta terms above to play a human rival.', 'इंसानी प्रतिद्वंद्वी से खेलने के लिए ऊपर बीटा शर्तें स्वीकार करें।'));
      document.getElementById('jhk-live-adult')?.focus(); return;
    }
    working.current = true; setBusy(true); setError(''); const turn = epoch.current;
    try {
      const player = await online.ensureGuest({ nickname: name?.trim() || 'Cricket fan', adultConfirmed: true, termsVersion: 'beta-1' });
      if (!alive.current || turn !== epoch.current) return;
      setSession(player); setConnected(true);
      const data = await online.request(action, payload);
      if (alive.current && turn === epoch.current) apply(data);
      else if (data.match?.id) void online.request('leave', { roomId: data.match.id }).catch(() => {});
    } catch (failure) { fail(failure); }
    finally { working.current = false; if (alive.current) setBusy(false); }
  }
  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (working.current) return;
    working.current = true; setBusy(true); setError(''); const turn = epoch.current;
    try { const data = await online.request(action, payload); if (alive.current && turn === epoch.current) { apply(data); setSession(online.session); } }
    catch (e) { fail(e); }
    finally { working.current = false; if (alive.current) setBusy(false); }
  }
  useEffect(() => {
    if (!match || terminal) return;
    const controller = new AbortController(); let stopped = false; let timer: ReturnType<typeof setTimeout>; const turn = epoch.current; const id = match.id;
    const poll = async () => {
      try { const data = await online.request('snapshot', { roomId: id }, { signal: controller.signal }); if (!stopped && turn === epoch.current) apply(data); }
      catch (e) { if (!stopped) fail(e); }
      if (!stopped) timer = setTimeout(poll, document.hidden ? 5000 : matchRef.current?.phase === 'waiting' ? 1500 : 650);
    };
    timer = setTimeout(poll, 650);
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => { stopped = true; clearTimeout(timer); controller.abort(); window.removeEventListener('beforeunload', warn); };
  }, [match?.id, match?.phase, terminal, apply, fail]);
  useEffect(() => {
    if (match?.phase !== 'waiting' || match.mode === 'private' || match.stake !== 0 || match.players.length !== 2 || self?.ready || working.current || autoReadyRoom.current === match.id) return;
    autoReadyRoom.current = match.id;
    void act('ready', { roomId: match.id, stake: 0 });
  }, [match?.id, match?.phase, match?.players.length, self?.ready, busy]);
  useEffect(() => { if (!match) return; const timer = setInterval(() => setNow(online.now()), 100); return () => clearInterval(timer); }, [match?.id]);
  useEffect(() => {
    if (!session || !connected || view === 'play' || match) return;
    const controller = new AbortController(); let current = true;
    setBoard(null);
    online.request('leaderboards', { period: view }, { signal: controller.signal }).then(data => { if (current) setBoard(data as Board); }).catch(fail);
    return () => { current = false; controller.abort(); };
  }, [view, session?.id, connected, match?.id, fail]);
  useEffect(() => {
    if (!quit) return;
    const element = dialog.current; const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); if (previous?.isConnected) previous.focus(); };
  }, [quit]);
  async function answer(choice: number) {
    const current = matchRef.current;
    if (!current || working.current || current.phase !== 'question' || current.receipt || answerKey.current === `${current.id}:${current.round}`) return;
    answerKey.current = `${current.id}:${current.round}`;
    const payload = { roomId: current.id, round: current.round, choice, requestId: crypto.randomUUID() };
    setPending(payload); await act('answer', payload);
  }
  async function sendSticker(sticker: string, requestId: string) {
    const current = matchRef.current;
    if (!current || !current.reactionsEnabled || !['waiting', 'result'].includes(current.phase)) throw new Error('Banter closed.');
    const data = await online.request('reaction', { roomId: current.id, sticker, requestId });
    if (alive.current && matchRef.current?.id === current.id) apply(data);
  }
  async function leave() {
    const id = matchRef.current?.id; epoch.current++; setQuit(false);
    matchRef.current = null; setMatch(null); setPending(null); answerKey.current = ''; online.rememberRoom(null); setError('');
    if (id) { try { await online.request('leave', { roomId: id }); } catch { /* server applies absence policy */ } }
    try { const player = await online.connect(); if (alive.current) setSession(player); } catch (e) { fail(e); }
  }
  useEffect(() => {
    const requestLeave = () => { if (searchRef.current?.state === 'searching') cancelSearch(); else if (matchRef.current?.phase === 'waiting') void leave(); else setQuit(true); };
    window.addEventListener('jhk-live-request-leave', requestLeave);
    return () => window.removeEventListener('jhk-live-request-leave', requestLeave);
  }, [match?.id, match?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const feedback = error && <div className="jhk-live-error" role="alert"><p>{error.replace(/^[A-Z_\d]+: /, '')}</p>{expired ? <button onClick={() => window.dispatchEvent(new Event('jhk-profile-open'))}>{text('Restore profile', 'प्रोफ़ाइल वापस लाएँ')}</button> : <button disabled={busy} onClick={() => match ? void act('snapshot', { roomId: match.id }) : void connect()}><RefreshCw size={16} />{text('Retry connection', 'फिर जुड़ें')}</button>}{pending && <button disabled={busy} onClick={() => void act('answer', pending)}>{text('Check locked answer', 'लॉक जवाब जाँचें')}</button>}</div>;
  if (match) {
    const receipt = match.receipt || (match.result ? { ...match.result, correct: false, xp: 0, elapsedMs: 30000 } : null);
    const source = sourceUrl(receipt?.sourceUrl);
    const outcome = !match.winnerId ? 'draw' : match.winnerId === match.selfId ? 'win' : 'loss';
    return <section className="jhk-live jhk-live-match" aria-label={text('Human duel', 'इंसानी मुक़ाबला')}>
      <header className="jhk-live-matchbar"><span><Swords size={18} /> {formatLabel(match.roundCount)} · {fileLabel(match.file)}</span><span><Wifi size={16} /> {connected ? text('Connected', 'जुड़े हैं') : text('Reconnecting', 'फिर जुड़ रहे हैं')}</span><button onClick={() => terminal || match.phase === 'waiting' ? void leave() : setQuit(true)}>{terminal ? text('Back to lobby', 'लॉबी वापस') : text('Leave', 'छोड़ें')}</button></header>
      <div className="jhk-live-scores">{match.players.map(p => <div key={p.id}><span>{p.id === match.selfId ? text('YOU', 'आप') : text('OPPONENT', 'प्रतिद्वंद्वी')}</span><strong>{p.nickname}</strong><b>{p.score}</b></div>)}</div>
      {feedback}
      {match.phase === 'waiting' && <div className="jhk-live-stage"><p className="jhk-live-kicker">{text('HUMAN VS HUMAN', 'इंसान बनाम इंसान')}</p><h1>{rival ? text(`${rival.nickname} is here.`, `${rival.nickname} आ गए।`) : text('Looking for a real rival.', 'असली प्रतिद्वंद्वी खोज रहे हैं।')}</h1><p>{text(`${formatLabel(match.roundCount)} · ${match.roundCount} rounds. Thirty seconds each.`, `${formatLabel(match.roundCount)} · ${match.roundCount} राउंड। हर राउंड तीस सेकंड।`)}</p>
        {match.mode === 'private' && <><p className="jhk-live-code">{match.code}</p><button onClick={() => { const url = `${location.origin}${location.pathname}#online?code=${encodeURIComponent(match.code)}`; void navigator.clipboard?.writeText(url).then(() => setShareNote(text('Invite copied.', 'निमंत्रण कॉपी हुआ।'))).catch(() => setShareNote(text('Copy the code above.', 'ऊपर का कोड कॉपी करें।'))); }}><Copy size={16} />{text('Copy invite', 'निमंत्रण कॉपी')}</button><p role="status">{shareNote}</p></>}
        <p className="jhk-live-terms">{match.stake ? text(`${match.stake} coins each. Winner takes ${match.stake * 2}; a draw returns both stakes. Ready reserves your coins. After both are ready, leaving or 90 seconds away while your rival remains forfeits your stake. Pre-start, system cancellation or both absent: refund.`, `हर खिलाड़ी के ${match.stake} सिक्के। विजेता को ${match.stake * 2}; बराबरी पर वापसी। तैयार पर सिक्के सुरक्षित होंगे। दोनों तैयार होने के बाद छोड़ने या सामने वाले के रहते 90 सेकंड गायब रहने पर सिक्के जाएँगे। शुरू से पहले, सिस्टम रद्द या दोनों गायब: वापसी।`) : text('No stake. Zero coins? You can still play.', 'बिना सिक्के लगाए। शून्य सिक्के? खेल जारी।')}</p>
        {rival && <button className="jhk-live-primary" disabled={busy || self?.ready} onClick={() => void act('ready', { roomId: match.id, stake: match.stake })}>{self?.ready ? text('Ready · waiting for rival', 'तैयार · प्रतिद्वंद्वी का इंतज़ार') : match.stake ? text(`Confirm ${match.stake} coins & ready`, `${match.stake} सिक्के मंज़ूर · तैयार`) : text('Ready · no stake', 'तैयार · बिना सिक्के')}</button>}
        {!rival && <p className="jhk-live-muted">{text('Private rooms stay open for your invited friend. Leave to play a practice bot.', 'निजी रूम आपके बुलाए दोस्त के लिए खुले रहते हैं। अभ्यास बॉट खेलने के लिए वापस जाएँ।')}</p>}
      </div>}
      {match.phase === 'countdown' && <div className="jhk-live-stage"><p className="jhk-live-kicker">{text(`ROUND ${match.round} / ${match.roundCount}`, `राउंड ${match.round} / ${match.roundCount}`)}</p><h1>{text('Get ready.', 'तैयार हो जाइए।')}</h1><p className="jhk-live-countdown">{Math.max(1, Math.ceil((match.startsAt - now) / 1000))}</p></div>}
      {match.phase === 'question' && !receipt && <div className="jhk-live-question"><div className="jhk-live-matchbar"><span>{text(`ROUND ${match.round} / ${match.roundCount}`, `राउंड ${match.round} / ${match.roundCount}`)}</span><span role="timer">{Math.ceil(remaining)} s</span></div><h1>{words(match.question?.prompt)}</h1><div className="jhk-live-answers">{match.question?.options.map((option, i) => <button key={i} disabled={!!pending || self?.answered || busy || remaining <= 0} aria-pressed={pending?.choice === i} onClick={() => void answer(i)}><b>{String.fromCharCode(65 + i)}</b><span>{words(option)}</span>{pending?.choice === i && <Check size={20} />}</button>)}</div><p className="jhk-live-muted" role={pending || remaining <= 0 ? "status" : undefined}>{pending ? text('Answer locked. Waiting for your receipt.', 'जवाब लॉक। रसीद का इंतज़ार।') : remaining <= 0 ? text('Time is up. Checking the server result.', 'समय पूरा। सर्वर का नतीजा आ रहा है।') : text(`${elapsed.toFixed(1)} s elapsed · first answer is final`, `${elapsed.toFixed(1)} सेकंड · पहला जवाब अंतिम`)}</p></div>}
      {receipt && <section className="jhk-live-receipt" data-correct={receipt.correct}><p className="jhk-live-kicker">{text('YOUR ANSWER RECEIPT', 'आपके जवाब की रसीद')}</p><h2>{receipt.correct ? text('Nailed it.', 'सही पकड़ा।') : text('One more fact in your pocket.', 'एक और तथ्य आपके साथ।')}</h2>{match.question && <p><strong>{text('Answer:', 'जवाब:')}</strong> {words(match.question.options[receipt.correctIndex])}</p>}<p>{words(receipt.explanation)}</p><p>+{receipt.xp} {text('online XP', 'ऑनलाइन XP')} · {(receipt.elapsedMs / 1000).toFixed(2)} s</p>{source && <a href={source} target="_blank" rel="noopener noreferrer">{text('Read the source', 'स्रोत पढ़ें')} ↗</a>}{match.phase === 'question' && <p className="jhk-live-muted">{text('Your answer is filed. The shared result follows the other answer or deadline.', 'आपका जवाब दर्ज है। साझा नतीजा दूसरे जवाब या समय सीमा के बाद।')}</p>}</section>}
      {match.phase === 'result' && <section className="jhk-live-stage"><p className="jhk-live-muted">{text('Next round starts automatically.', 'अगला राउंड अपने आप शुरू होगा।')}</p><h2>{match.result?.winnerId ? match.result.winnerId === match.selfId ? text('Your round.', 'राउंड आपका।') : text('Their round. Keep your curiosity.', 'राउंड उनका। जिज्ञासा आपकी।') : text('A shared round.', 'बराबरी का राउंड।')}</h2><ul className="jhk-live-results">{match.result?.answers.map(a => <li key={a.playerId}><strong>{match.players.find(p => p.id === a.playerId)?.nickname}</strong><span>{a.correct ? text('Correct', 'सही') : text('Incorrect / no answer', 'ग़लत / कोई जवाब नहीं')} · {(a.elapsedMs / 1000).toFixed(2)} s</span></li>)}</ul><button className="jhk-live-primary" disabled={busy || self?.ready} onClick={() => void act('next', { roomId: match.id })}>{self?.ready ? text('Ready for next round', 'अगले राउंड को तैयार') : text('Next round', 'अगला राउंड')}</button></section>}
      <BanterTray key={match.id} active={!!rival && ['waiting', 'result'].includes(match.phase)} matchKey={match.id} roundKey={`${match.id}:${match.round}`} mode="human" selfId={match.selfId} peerName={rival?.nickname} events={match.reactions} serverNow={now} enabled={match.reactionsEnabled === true} onSend={sendSticker} />
      {terminal && <section className="jhk-live-stage jhk-live-finish" data-outcome={outcome}><p className="jhk-live-kicker">{text('MATCH COMPLETE', 'मुक़ाबला पूरा')}</p><h1>{match.phase === 'cancelled' ? text('The table has closed.', 'बैठक बंद हो गई।') : outcome === 'win' ? text('That one’s yours.', 'यह जीत आपकी।') : outcome === 'loss' ? text('Good duel. New knowledge.', 'अच्छा मुक़ाबला। नई सीख।') : text('Level on the scorecard.', 'स्कोरकार्ड पर बराबरी।')}</h1>{match.phase === 'finished' && <p className="jhk-live-finishmark" aria-hidden="true">{outcome === 'win' ? '✦' : outcome === 'loss' ? '✓' : '＝'}</p>}{match.phase === 'cancelled' && <p>{match.reason?.endsWith('-forfeit') ? text('A player left after the start. Their stake went to the remaining player; no completion reward or ranked result.', 'एक खिलाड़ी शुरू होने के बाद गया। उसके सिक्के दूसरे को मिले; पूरा खेलने का इनाम या रैंक नहीं।') : text('The match ended early. Any reserved stake was returned.', 'मुक़ाबला जल्दी बंद हुआ। सुरक्षित सिक्के वापस।')}</p>}
        <div className="jhk-live-actions"><button className="jhk-live-primary" onClick={playAgain}>{text('Play again', 'फिर खेलें')}</button></div>
        {match.phase === 'finished' && <CricketOutcomeMoment eventId={`online:${match.id}:${match.selfId}`} outcome={outcome} settled ourScore={self?.score} theirScore={rival?.score} forfeit={/forfeit|abandoned|no.contest/.test(match.reason || '')} />}
        {match.phase === 'finished' && match.progression && <div className="jhk-live-xp" aria-label={text('Earned XP', 'कमाया XP')}><strong>+{match.progression.answerXp + match.progression.completionXp + match.progression.perfectXp} XP</strong><p>{text(`Answers ${match.progression.answerXp} · completed over ${match.progression.completionXp} · perfect over ${match.progression.perfectXp}`, `जवाब ${match.progression.answerXp} · पूरा ओवर ${match.progression.completionXp} · सभी सही ${match.progression.perfectXp}`)}</p>{match.progression.completionXp === 0 && <p>{text('Completion XP needs an answer on every round. Your accepted answer XP is kept.', 'पूरा करने का XP हर राउंड में जवाब देने पर मिलता है। आपके जवाब का XP सुरक्षित है।')}</p>}</div>}
        {match.economy && <div className="jhk-live-settlement"><strong>{match.economy.balance} {text('server coins', 'सर्वर सिक्के')}</strong><p>{text(`Stake return / pot: +${match.economy.payout} · earned reward: +${match.economy.reward}`, `वापसी / पॉट: +${match.economy.payout} · इनाम: +${match.economy.reward}`)}</p></div>}
        <p role="status">{shareNote}</p>{match.phase === 'finished' && match.roundCount !== 5 && <ShareMoment nickname={self?.nickname} title={text('Human challenger', 'इंसानी चुनौतीबाज़')} rounds={match.roundCount} correct={self?.score || 0} xp={(match.progression?.answerXp || 0) + (match.progression?.completionXp || 0) + (match.progression?.perfectXp || 0)} human />}{match.phase === 'finished' && <CompletionAdBreak completionId={`online:${match.id}:${match.selfId}`} outcome={outcome} />}
      </section>}
      <p className="jhk-live-muted">{text('Correct answers first, then server-recorded total answer time. Within 0.12 s: a draw. Connection delay can affect timing.', 'पहले सही जवाब, फिर सर्वर पर दर्ज कुल समय। 0.12 सेकंड के भीतर बराबरी। कनेक्शन की देरी असर डाल सकती है।')}</p>
      {quit && <dialog ref={dialog} className="jhk-live-dialog" aria-labelledby="jhk-quit-title" onCancel={e => { e.preventDefault(); setQuit(false); }}><h2 id="jhk-quit-title">{text('Leave this duel?', 'मुक़ाबला छोड़ें?')}</h2><p>{match.stake ? text(`Your ${match.stake} reserved coins will go to your rival. This unfinished match earns no reward or rank.`, `आपके ${match.stake} सुरक्षित सिक्के प्रतिद्वंद्वी को मिलेंगे। अधूरा मुक़ाबला इनाम या रैंक नहीं देता।`) : text('This unfinished match earns no completion reward or rank.', 'अधूरा मुक़ाबला पूरा करने का इनाम या रैंक नहीं देता।')}</p><div className="jhk-live-actions"><button className="jhk-live-primary" autoFocus onClick={() => setQuit(false)}>{text('Keep playing', 'खेलते रहें')}</button><button onClick={() => void leave()}>{text('Leave duel', 'मुक़ाबला छोड़ें')}</button></div></dialog>}
    </section>;
  }
  return <section className="jhk-live" aria-labelledby="jhk-live-title">
    <header className="jhk-live-head"><p className="jhk-live-kicker">{text('THE MATCH DESK', 'मुक़ाबले की तैयारी')}</p><h1 id="jhk-live-title">{text('Your next innings starts here.', 'अगला प्रतिद्वंद्वी तैयार है।')}</h1><p>{text('Mini over: 3 rounds. Full over: 6. Find a player or face a practice bot after five seconds.', 'मिनी ओवर: 3 राउंड। फुल ओवर: 6। खिलाड़ी खोजें; पाँच सेकंड में न मिले तो अभ्यास बॉट से खेलें।')}</p></header>
    <nav className="jhk-live-tabs" aria-label={text('Live duel sections', 'लाइव मुक़ाबले के हिस्से')}>{(['play', 'daily', 'weekly'] as const).map(tab => <button key={tab} aria-pressed={view === tab} disabled={searching} onClick={() => setView(tab)}>{tab === 'play' ? text('Play', 'खेलें') : tab === 'daily' ? text('Today’s board', 'आज की रैंकिंग') : text('Weekly board', 'साप्ताहिक रैंकिंग')}</button>)}</nav>
    {feedback}
    {searching ? <section className="jhk-live-stage jhk-live-search" aria-label={text('Finding a rival', 'प्रतिद्वंद्वी खोज रहे हैं')}><p className="jhk-live-kicker">{text('HUMAN FIRST', 'पहले इंसानी प्रतिद्वंद्वी')}</p><h2>{text('Finding your opponent…', 'प्रतिद्वंद्वी खोज रहे हैं…')}</h2><p role="status">{text('No player available? Your practice bot starts automatically.', 'खिलाड़ी नहीं मिला? अभ्यास बॉट अपने आप शुरू होगा।')}</p><strong className="jhk-live-search-countdown" role="timer">{searchSeconds}s</strong><div className="jhk-live-search-track" aria-hidden="true"><span /></div><p className="jhk-live-muted">{text('Bot matches use no coins and do not affect the human leaderboard.', 'बॉट मुक़ाबले में सिक्के नहीं लगते और इंसानी रैंकिंग पर असर नहीं होता।')}</p><button type="button" onClick={cancelSearch}>{text('Cancel search', 'खोज रोकें')}</button></section> : view === 'play' ? <div className="jhk-live-desk" data-intent={initialIntent}><section className="jhk-live-main"><h2>{text('Choose your over.', 'अपना ओवर चुनें।')}</h2><div className="jhk-live-formats" role="group" aria-label={text('Over length', 'ओवर की लंबाई')}>{(['mini', 'full'] as const).map(value => <button type="button" key={value} aria-pressed={format === value} disabled={busy} onClick={() => setFormat(value)}><strong>{formatLabel(value === 'mini' ? 3 : 6)}</strong><span>{value === 'mini' ? text('3 rounds · +60 completion XP', '3 राउंड · पूरा करने पर +60 XP') : text('6 rounds · +150 completion XP', '6 राउंड · पूरा करने पर +150 XP')}</span></button>)}</div><p className="jhk-live-muted">{text('Answer every round to earn the completion XP, win or lose. Correct answers add XP; a perfect over adds 30 / 60.', 'हर राउंड का जवाब दें और जीत या हार पर पूरा करने का XP पाएँ। सही जवाब का XP अलग; सभी सही पर 30 / 60 और।')}</p><label htmlFor="jhk-live-topic">{text('Topic', 'विषय')}</label><select id="jhk-live-topic" disabled={busy} value={file} onChange={e => setFile(e.target.value)}>{FILES.map(row => <option key={row[0]} value={row[0]}>{row[hi ? 2 : 1]}</option>)}</select>
      {online.configured && !(session?.adultConfirmed && session?.termsVersion === 'beta-1') && <label className="jhk-live-attest" htmlFor="jhk-live-adult"><input id="jhk-live-adult" type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /><span>{text('For human duels, I’m 18+ and accept the ', 'इंसानी मुक़ाबलों के लिए मैं 18+ हूँ और ')}<a href={`${STATIC_BASE}terms.html`} target="_blank" rel="noopener noreferrer">{text('beta terms', 'बीटा शर्तें')}</a>{text(' and ', ' और ')}<a href={`${STATIC_BASE}privacy.html`} target="_blank" rel="noopener noreferrer">{text('privacy notice', 'निजता सूचना')}</a>.</span></label>}
      <button className="jhk-live-primary" disabled={busy} onClick={() => quickPlay()}><Swords size={20} />{text(`Play ${formatLabel(format === 'mini' ? 3 : 6)}`, `${formatLabel(format === 'mini' ? 3 : 6)} खेलें`)}</button><p className="jhk-live-muted">{text('No email. No signup. Human rival first; practice bot in 5 seconds. Zero stake.', 'ईमेल नहीं। साइनअप नहीं। पहले खिलाड़ी; 5 सेकंड में अभ्यास बॉट। बिना सिक्के।')}</p>
      <button type="button" disabled={busy} onClick={() => onBot ? onBot(file, format) : onPractice()}>{text('Practice with a bot', 'बॉट के साथ अभ्यास')}</button>
      {session && connected && <details className="jhk-live-rules"><summary>{text('Optional coin stakes', 'वैकल्पिक सिक्के')}</summary><p className="jhk-live-muted">{text('Human duels only. No fallback bot will ever use a stake.', 'सिर्फ़ इंसानी मुक़ाबले। अभ्यास बॉट में सिक्के नहीं लगेंगे।')}</p><fieldset className="jhk-live-stake"><legend>{text('Game coins', 'खेल के सिक्के')}</legend><label htmlFor="jhk-live-stake">{text('Your amount', 'आपकी रकम')}</label><input id="jhk-live-stake" type="number" inputMode="numeric" min="0" max={Math.min(balance, 10000)} step="1" value={stakeText} disabled={busy} aria-invalid={!validStake} onChange={e => setStakeText(e.target.value)} /><p className="jhk-live-muted">{text(`${balance} available. Free simulated coins; no cash value.`, `${balance} उपलब्ध। मुफ़्त खेल के सिक्के; नक़द मूल्य नहीं।`)}</p></fieldset><button disabled={busy || !validStake} onClick={() => quickPlay(stake)}>{text('Find human · chosen stake', 'खिलाड़ी खोजें · चुने सिक्के')}</button></details>}
    </section><aside className="jhk-live-side" ref={friendSection} aria-labelledby="jhk-friend-title"><p className="jhk-live-kicker">{text('FRIENDS PLAY HERE', 'दोस्त यहाँ खेलें')}</p><h2 id="jhk-friend-title">{text('Settle it with a friend.', 'दोस्त से मुक़ाबला करें।')}</h2><p>{text('A private table. The same questions. Your own room code.', 'निजी मैदान। समान सवाल। अपना रूम कोड।')}</p>{<><button disabled={busy || !online.configured} onClick={() => void friendAction('create', { file, stake: 0, format })}>{text('Create room', 'रूम बनाएँ')}</button><form onSubmit={e => { e.preventDefault(); void friendAction('join', { code: invite.trim().toUpperCase() }); }}><label htmlFor="jhk-live-code">{text('Room code', 'रूम कोड')}</label><input id="jhk-live-code" value={invite} onChange={e => setInvite(e.target.value)} required minLength={8} maxLength={16} autoComplete="off" autoCapitalize="characters" spellCheck={false} /><button type="submit" disabled={busy || !online.configured}>{text('Join friend', 'दोस्त से जुड़ें')}</button></form></>}{!online.configured && <p className="jhk-live-muted">{text('Friend rooms need the shared server connection on this build. Practice bot play is available.', 'इस बिल्ड पर दोस्तों के रूम के लिए साझा सर्वर चाहिए। अभ्यास बॉट उपलब्ध है।')}</p>}<p className="jhk-live-muted">{text('Private rooms stay human-only. Invite links never include your private player credentials.', 'निजी रूम सिर्फ़ इंसानों के हैं। निमंत्रण लिंक में आपकी निजी खिलाड़ी पहचान नहीं जाती।')}</p></aside></div> : <section className="jhk-live-board"><h2>{text('The human leaderboard', 'इंसानी लीडरबोर्ड')}</h2><p className="jhk-live-muted">{text('Win = 3 points, draw = 1. Qualify with 3 completed public matches against 3 different players. Bot practice never changes this board.', 'जीत = 3 अंक, बराबरी = 1। 3 अलग खिलाड़ियों से 3 पूरे सार्वजनिक मुक़ाबले। अभ्यास बॉट इस रैंकिंग को नहीं बदलता।')}</p>{!session || !connected ? <p>{text('Play a human duel to connect your guest player card and see standings.', 'अतिथि पहचान से जुड़ने और रैंकिंग देखने के लिए इंसानी मुक़ाबला खेलें।')}</p> : !board ? <p role="status">{text('Loading standings…', 'रैंकिंग आ रही है…')}</p> : board.rows.length ? <div className="jhk-live-tablewrap"><table><caption className="sr-only">{text('JHK server standings', 'JHK सर्वर रैंकिंग')}</caption><thead><tr><th>#</th><th>{text('Player', 'खिलाड़ी')}</th><th>{text('Points', 'अंक')}</th></tr></thead><tbody>{board.rows.map(row => <tr key={row.id} data-self={row.id === session.id}><td>{row.rank}</td><th scope="row">{row.nickname}{row.id === session.id ? text(' · you', ' · आप') : ''}</th><td>{row.points}</td></tr>)}</tbody></table></div> : <p>{text('No qualifying players yet. Complete human duels to start the board.', 'अभी कोई योग्य खिलाड़ी नहीं। इंसानी मुक़ाबले पूरे करके शुरुआत करें।')}</p>}</section>}
    <details className="jhk-live-rules"><summary>{text('Timing & fairness', 'समय और निष्पक्षता')}</summary><p>{text('Human duels are scored by the server: correct answers, then total answer time. Within 0.12 seconds is a draw. Network delay can affect timing. Bot practice is clearly labeled, uses no server coins and earns no human rank.', 'इंसानी मुक़ाबले सर्वर गिनता है: पहले सही जवाब, फिर कुल समय। 0.12 सेकंड में बराबरी। नेटवर्क असर डाल सकता है। अभ्यास बॉट साफ़ बताया जाता है, सर्वर सिक्के नहीं लगते और इंसानी रैंक नहीं मिलती।')}</p></details>
    <button className="jhk-live-back" onClick={onHome}><ArrowLeft size={16} />{text('Back home', 'होम वापस')}</button>
  </section>;
}

export function LiveProgressCard({ onPlay }: { onPlay: () => void }) {
  const [session, setSession] = useState<PlayerSession | null>(online.session);
  useEffect(() => online.subscribe(() => setSession(online.session)), []);
  const { locale } = useLocale();
  return <section className="jhk-live jhk-live-profile"><p className="jhk-live-kicker">{locale === 'hi' ? 'इंसानी मुक़ाबलों की प्रगति' : 'HUMAN DUEL PROGRESS'}</p><h2>{session?.avatar && <span className="jhk-profile-avatar" aria-label={`${session.avatar} avatar`}>{({ spark: '✦', shield: '⬡', star: '★', bolt: 'ϟ', book: '▤', compass: '✥' } as Record<string, string>)[session.avatar] || '✦'}</span>}{session?.nickname || (locale === 'hi' ? 'आपकी सर्वर खिलाड़ी पहचान' : 'Your server player card')}</h2>{session ? <div className="jhk-live-byline"><span><strong>{session.onlineXp ?? 0}</strong> online XP</span><span><strong>{session.balance ?? 0}</strong> server coins</span></div> : <p>{locale === 'hi' ? 'ईमेल के बिना अतिथि बनकर इंसानी मुकाबले खेलें।' : 'Play as a guest to build your human duel record. No email needed.'}</p>}{session?.profileComplete && <ProfileOptions session={session} />}<p className="jhk-live-muted">{locale === 'hi' ? 'नीचे आपके डिवाइस के अभ्यास मेडल, XP और स्टैम्प हैं।' : 'Your device practice medals, XP and stamps continue below.'}</p><button onClick={onPlay}>{locale === 'hi' ? 'इंसानी मुक़ाबला खोलें' : 'Open human duels'}</button></section>;
}
