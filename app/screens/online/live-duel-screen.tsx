'use client';
/** JHK human beta. All scores, coins and time decisions come from the isolated server. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, RefreshCw, Swords, Trophy, Users, Wifi } from 'lucide-react';
import { jhkOnline as online } from '@/lib/jhk-online/runtime';
import type { Board, OnlineMatch, PlayerSession, Words } from '@/lib/jhk-online/types';
import { useLocale } from '../../use-locale';
import { ProfileOptions } from './profile-options';
import { CompletionAdBreak } from './completion-ad-break';
import { STORAGE } from '@/lib/storage-names.mjs';
import './online.css';

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
const preferredFile = () => { try { const choices = JSON.parse(localStorage.getItem(STORAGE.favouriteTopics) || '[]'); const first = Array.isArray(choices) ? choices.find(value => FILES.some(file => file[0] === value)) : null; return first || 'all'; } catch { return 'all'; } };

export function LiveDuelScreen({ name, onPractice, onHome, onState, onRoundKey }: {
  name: string; onPractice: () => void; onHome: () => void; onState: (inMatch: boolean, playing: boolean) => void; onRoundKey?: (key: string | null) => void;
}) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const words = (value?: Words | null) => value ? hi ? value.hi || value.en : value.en : '';
  const fileLabel = (id: string) => { const row = FILES.find(f => f[0] === id) || FILES[0]; return row[hi ? 2 : 1]; };
  const [session, setSession] = useState<PlayerSession | null>(online.session);
  const [connected, setConnected] = useState(false);
  const [match, setMatch] = useState<OnlineMatch | null>(null);
  const [file, setFile] = useState(preferredFile);
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
  useEffect(() => { alive.current = true; return () => { alive.current = false; epoch.current++; }; }, []);
  useEffect(() => online.subscribe(() => setSession(online.session)), []);
  useEffect(() => { onState(!!match, !!match && ['countdown', 'question'].includes(match.phase)); }, [match?.id, match?.phase, terminal, onState]);
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
  async function leave() {
    const id = matchRef.current?.id; epoch.current++; setQuit(false);
    matchRef.current = null; setMatch(null); setPending(null); answerKey.current = ''; online.rememberRoom(null); setError('');
    if (id) { try { await online.request('leave', { roomId: id }); } catch { /* server applies absence policy */ } }
    try { const player = await online.connect(); if (alive.current) setSession(player); } catch (e) { fail(e); }
  }
  useEffect(() => {
    const requestLeave = () => { if (matchRef.current?.phase === 'waiting') void leave(); else setQuit(true); };
    window.addEventListener('jhk-live-request-leave', requestLeave);
    return () => window.removeEventListener('jhk-live-request-leave', requestLeave);
  }, [match?.id, match?.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  async function shareResult() {
    if (!match || match.phase !== 'finished') return;
    const share = `Jaanta Hai Kya · ${fileLabel(match.file)}\n${self?.nickname}: ${self?.score} / ${match.roundCount} · ${rival?.nickname}: ${rival?.score} / ${match.roundCount}\nA real human duel. Your turn?`;
    const url = `${location.origin}${location.pathname}#online`;
    try {
      if (navigator.share) await navigator.share({ title: 'Jaanta Hai Kya · duel result', text: share, url });
      else await navigator.clipboard.writeText(`${share}\n${url}`);
      setShareNote(text('Result ready to share.', 'नतीजा शेयर करने के लिए तैयार।'));
    } catch (e) { if ((e as Error).name !== 'AbortError') setShareNote(text('Sharing is unavailable here. You can copy this page’s address.', 'यहाँ शेयर उपलब्ध नहीं। पेज का पता कॉपी कर सकते हैं।')); }
  }

  const feedback = error && <div className="jhk-live-error" role="alert"><p>{error.replace(/^[A-Z_\d]+: /, '')}</p>{expired ? <button onClick={() => window.dispatchEvent(new Event('jhk-profile-recheck'))}>{text('Restore profile', 'प्रोफ़ाइल वापस लाएँ')}</button> : <button disabled={busy} onClick={() => match ? void act('snapshot', { roomId: match.id }) : void connect()}><RefreshCw size={16} />{text('Retry connection', 'फिर जुड़ें')}</button>}{pending && <button disabled={busy} onClick={() => void act('answer', pending)}>{text('Check locked answer', 'लॉक जवाब जाँचें')}</button>}</div>;
  if (match) {
    const receipt = match.receipt || (match.result ? { ...match.result, correct: false, xp: 0, elapsedMs: 30000 } : null);
    const source = sourceUrl(receipt?.sourceUrl);
    const outcome = !match.winnerId ? 'draw' : match.winnerId === match.selfId ? 'win' : 'loss';
    return <section className="jhk-live jhk-live-match" aria-label={text('Human duel', 'इंसानी मुक़ाबला')}>
      <header className="jhk-live-matchbar"><span><Swords size={18} /> {fileLabel(match.file)}</span><span><Wifi size={16} /> {connected ? text('Connected', 'जुड़े हैं') : text('Reconnecting', 'फिर जुड़ रहे हैं')}</span><button onClick={() => terminal || match.phase === 'waiting' ? void leave() : setQuit(true)}>{terminal ? text('Back to lobby', 'लॉबी वापस') : text('Leave', 'छोड़ें')}</button></header>
      <div className="jhk-live-scores">{match.players.map(p => <div key={p.id}><span>{p.id === match.selfId ? text('YOU', 'आप') : text('OPPONENT', 'प्रतिद्वंद्वी')}</span><strong>{p.nickname}</strong><b>{p.score}</b></div>)}</div>
      {feedback}
      {match.phase === 'waiting' && <div className="jhk-live-stage"><p className="jhk-live-kicker">{text('HUMAN VS HUMAN', 'इंसान बनाम इंसान')}</p><h1>{rival ? text(`${rival.nickname} is here.`, `${rival.nickname} आ गए।`) : text('Looking for a real rival.', 'असली प्रतिद्वंद्वी खोज रहे हैं।')}</h1><p>{text('Five rounds. Thirty seconds each. Both players confirm before the countdown.', 'पाँच राउंड। हर राउंड तीस सेकंड। उलटी गिनती से पहले दोनों तैयार हों।')}</p>
        {match.mode === 'private' && <><p className="jhk-live-code">{match.code}</p><button onClick={() => { const url = `${location.origin}${location.pathname}#online?code=${encodeURIComponent(match.code)}`; void navigator.clipboard?.writeText(url).then(() => setShareNote(text('Invite copied.', 'निमंत्रण कॉपी हुआ।'))).catch(() => setShareNote(text('Copy the code above.', 'ऊपर का कोड कॉपी करें।'))); }}><Copy size={16} />{text('Copy invite', 'निमंत्रण कॉपी')}</button><p role="status">{shareNote}</p></>}
        <p className="jhk-live-terms">{match.stake ? text(`${match.stake} coins each. Winner takes ${match.stake * 2}; a draw returns both stakes. Ready reserves your coins. After both are ready, leaving or 90 seconds away while your rival remains forfeits your stake. Pre-start, system cancellation or both absent: refund.`, `हर खिलाड़ी के ${match.stake} सिक्के। विजेता को ${match.stake * 2}; बराबरी पर वापसी। तैयार पर सिक्के सुरक्षित होंगे। दोनों तैयार होने के बाद छोड़ने या सामने वाले के रहते 90 सेकंड गायब रहने पर सिक्के जाएँगे। शुरू से पहले, सिस्टम रद्द या दोनों गायब: वापसी।`) : text('No stake. Zero coins? You can still play.', 'बिना सिक्के लगाए। शून्य सिक्के? खेल जारी।')}</p>
        {rival && <button className="jhk-live-primary" disabled={busy || self?.ready} onClick={() => void act('ready', { roomId: match.id, stake: match.stake })}>{self?.ready ? text('Ready · waiting for rival', 'तैयार · प्रतिद्वंद्वी का इंतज़ार') : match.stake ? text(`Confirm ${match.stake} coins & ready`, `${match.stake} सिक्के मंज़ूर · तैयार`) : text('Ready · no stake', 'तैयार · बिना सिक्के')}</button>}
        {!rival && <p className="jhk-live-muted">{text('No bot will take this seat. Cancel to invite a friend or choose practice.', 'इस जगह कोई बॉट नहीं आएगा। दोस्त को बुलाने या अभ्यास के लिए रद्द करें।')}</p>}
      </div>}
      {match.phase === 'countdown' && <div className="jhk-live-stage"><p className="jhk-live-kicker">{text(`ROUND ${match.round} / ${match.roundCount}`, `राउंड ${match.round} / ${match.roundCount}`)}</p><h1>{text('Get ready.', 'तैयार हो जाइए।')}</h1><p className="jhk-live-countdown">{Math.max(1, Math.ceil((match.startsAt - now) / 1000))}</p></div>}
      {match.phase === 'question' && !receipt && <div className="jhk-live-question"><div className="jhk-live-matchbar"><span>{text(`ROUND ${match.round} / ${match.roundCount}`, `राउंड ${match.round} / ${match.roundCount}`)}</span><span role="timer">{Math.ceil(remaining)} s</span></div><h1>{words(match.question?.prompt)}</h1><div className="jhk-live-answers">{match.question?.options.map((option, i) => <button key={i} disabled={!!pending || self?.answered || busy || remaining <= 0} aria-pressed={pending?.choice === i} onClick={() => void answer(i)}><b>{String.fromCharCode(65 + i)}</b><span>{words(option)}</span>{pending?.choice === i && <Check size={20} />}</button>)}</div><p className="jhk-live-muted" role={pending || remaining <= 0 ? "status" : undefined}>{pending ? text('Answer locked. Waiting for your receipt.', 'जवाब लॉक। रसीद का इंतज़ार।') : remaining <= 0 ? text('Time is up. Checking the server result.', 'समय पूरा। सर्वर का नतीजा आ रहा है।') : text(`${elapsed.toFixed(1)} s elapsed · first answer is final`, `${elapsed.toFixed(1)} सेकंड · पहला जवाब अंतिम`)}</p></div>}
      {receipt && <section className="jhk-live-receipt" data-correct={receipt.correct}><p className="jhk-live-kicker">{text('YOUR ANSWER RECEIPT', 'आपके जवाब की रसीद')}</p><h2>{receipt.correct ? text('Nailed it.', 'सही पकड़ा।') : text('One more fact in your pocket.', 'एक और तथ्य आपके साथ।')}</h2>{match.question && <p><strong>{text('Answer:', 'जवाब:')}</strong> {words(match.question.options[receipt.correctIndex])}</p>}<p>{words(receipt.explanation)}</p><p>+{receipt.xp} {text('online XP', 'ऑनलाइन XP')} · {(receipt.elapsedMs / 1000).toFixed(2)} s</p>{source && <a href={source} target="_blank" rel="noopener noreferrer">{text('Read the source', 'स्रोत पढ़ें')} ↗</a>}{match.phase === 'question' && <p className="jhk-live-muted">{text('Your answer is filed. The shared result follows the other answer or deadline.', 'आपका जवाब दर्ज है। साझा नतीजा दूसरे जवाब या समय सीमा के बाद।')}</p>}</section>}
      {match.phase === 'result' && <section className="jhk-live-stage"><h2>{match.result?.winnerId ? match.result.winnerId === match.selfId ? text('Your round.', 'राउंड आपका।') : text('Their round. Keep your curiosity.', 'राउंड उनका। जिज्ञासा आपकी।') : text('A shared round.', 'बराबरी का राउंड।')}</h2><ul className="jhk-live-results">{match.result?.answers.map(a => <li key={a.playerId}><strong>{match.players.find(p => p.id === a.playerId)?.nickname}</strong><span>{a.correct ? text('Correct', 'सही') : text('Incorrect / no answer', 'ग़लत / कोई जवाब नहीं')} · {(a.elapsedMs / 1000).toFixed(2)} s</span></li>)}</ul><button className="jhk-live-primary" disabled={busy || self?.ready} onClick={() => void act('next', { roomId: match.id })}>{self?.ready ? text('Ready for next round', 'अगले राउंड को तैयार') : text('Next round', 'अगला राउंड')}</button></section>}
      {terminal && <section className="jhk-live-stage jhk-live-finish" data-outcome={outcome}><p className="jhk-live-kicker">{text('MATCH COMPLETE', 'मुक़ाबला पूरा')}</p><h1>{match.phase === 'cancelled' ? text('The table has closed.', 'बैठक बंद हो गई।') : outcome === 'win' ? text('That one’s yours.', 'यह जीत आपकी।') : outcome === 'loss' ? text('Good duel. New knowledge.', 'अच्छा मुक़ाबला। नई सीख।') : text('Level on the scorecard.', 'स्कोरकार्ड पर बराबरी।')}</h1>{match.phase === 'finished' && <p className="jhk-live-finishmark" aria-hidden="true">{outcome === 'win' ? '✦' : outcome === 'loss' ? '✓' : '＝'}</p>}{match.phase === 'cancelled' && <p>{match.reason?.endsWith('-forfeit') ? text('A player left after the start. Their stake went to the remaining player; no completion reward or ranked result.', 'एक खिलाड़ी शुरू होने के बाद गया। उसके सिक्के दूसरे को मिले; पूरा खेलने का इनाम या रैंक नहीं।') : text('The match ended early. Any reserved stake was returned.', 'मुक़ाबला जल्दी बंद हुआ। सुरक्षित सिक्के वापस।')}</p>}
        {match.economy && <div className="jhk-live-settlement"><strong>{match.economy.balance} {text('server coins', 'सर्वर सिक्के')}</strong><p>{text(`Stake return / pot: +${match.economy.payout} · earned reward: +${match.economy.reward}`, `वापसी / पॉट: +${match.economy.payout} · इनाम: +${match.economy.reward}`)}</p></div>}
        <div className="jhk-live-actions"><button className="jhk-live-primary" onClick={() => void leave()}>{text('Back to lobby', 'लॉबी वापस')}</button>{match.phase === 'finished' && <button onClick={() => void shareResult()}>{text('Share your result', 'नतीजा शेयर करें')}</button>}</div><p role="status">{shareNote}</p>{match.phase === 'finished' && <CompletionAdBreak completionId={`online:${match.id}:${match.selfId}`} outcome={outcome} />}
      </section>}
      <p className="jhk-live-muted">{text('Correct answers first, then server-recorded total answer time. Within 0.12 s: a draw. Connection delay can affect timing.', 'पहले सही जवाब, फिर सर्वर पर दर्ज कुल समय। 0.12 सेकंड के भीतर बराबरी। कनेक्शन की देरी असर डाल सकती है।')}</p>
      {quit && <dialog ref={dialog} className="jhk-live-dialog" aria-labelledby="jhk-quit-title" onCancel={e => { e.preventDefault(); setQuit(false); }}><h2 id="jhk-quit-title">{text('Leave this duel?', 'मुक़ाबला छोड़ें?')}</h2><p>{match.stake ? text(`Your ${match.stake} reserved coins will go to your rival. This unfinished match earns no reward or rank.`, `आपके ${match.stake} सुरक्षित सिक्के प्रतिद्वंद्वी को मिलेंगे। अधूरा मुक़ाबला इनाम या रैंक नहीं देता।`) : text('This unfinished match earns no completion reward or rank.', 'अधूरा मुक़ाबला पूरा करने का इनाम या रैंक नहीं देता।')}</p><div className="jhk-live-actions"><button className="jhk-live-primary" autoFocus onClick={() => setQuit(false)}>{text('Keep playing', 'खेलते रहें')}</button><button onClick={() => void leave()}>{text('Leave duel', 'मुक़ाबला छोड़ें')}</button></div></dialog>}
    </section>;
  }
  return <section className="jhk-live" aria-labelledby="jhk-live-title">
    <header className="jhk-live-head"><p className="jhk-live-kicker">{text('JHK · HUMAN DUEL BETA', 'JHK · इंसानी मुक़ाबला बीटा')}</p><h1 id="jhk-live-title">{text('Know it. Prove it.', 'जानते हो? दिखाओ।')}</h1><p>{text('Sports or science. Same question, real rival. Five rounds. Your first answer counts.', 'खेल या विज्ञान। एक सवाल, असली प्रतिद्वंद्वी। पाँच राउंड। पहला जवाब गिना जाएगा।')}</p></header>
    <nav className="jhk-live-tabs" aria-label={text('Live duel sections', 'लाइव मुक़ाबले के हिस्से')}>{(['play', 'daily', 'weekly', 'savings'] as const).map(tab => <button key={tab} aria-pressed={view === tab} onClick={() => setView(tab)}>{tab === 'play' ? text('Play', 'खेलें') : tab === 'daily' ? text('Today’s board', 'आज की रैंकिंग') : tab === 'weekly' ? text('Weekly board', 'साप्ताहिक रैंकिंग') : text('Coin leaders', 'सिक्कों की रैंकिंग')}</button>)}</nav>
    {!online.configured ? <section className="jhk-live-empty"><h2>{text('The human server is not connected on this build.', 'इस बिल्ड का इंसानी सर्वर अभी नहीं जुड़ा।')}</h2><p>{text('A real opponent needs the shared game service. Practice remains available on this device.', 'असली प्रतिद्वंद्वी के लिए साझा सर्वर चाहिए। इस डिवाइस पर अभ्यास उपलब्ध है।')}</p><button className="jhk-live-primary" onClick={onPractice}>{text('Choose practice', 'अभ्यास चुनें')}</button></section> : <>
      {feedback}
      {!session || !connected ? <div className="jhk-live-identity"><h2>{text('Connect your player card.', 'खिलाड़ी पहचान से जुड़ें।')}</h2><p>{text('Set up or restore your profile to play. Your server progress stays with that profile.', 'खेलने के लिए प्रोफ़ाइल बनाएँ या वापस लाएँ। सर्वर प्रगति उसी प्रोफ़ाइल के साथ रहती है।')}</p><button className="jhk-live-primary" disabled={busy} onClick={() => { window.dispatchEvent(new Event('jhk-profile-recheck')); void connect(); }}>{text('Retry connection', 'फिर जुड़ें')}</button></div> : <>
        <div className="jhk-live-byline"><span><Users size={17} /> <strong>{session.nickname}</strong></span><span><strong>{session.balance ?? 0}</strong> {text('server coins', 'सर्वर सिक्के')}</span><span><strong>{session.onlineXp ?? 0}</strong> {text('online XP', 'ऑनलाइन XP')}</span><span><Wifi size={16} />{online.latencyMs !== null ? `${online.latencyMs} ms` : text('Connected', 'जुड़े हैं')}</span></div>
        {view === 'play' ? <div className="jhk-live-desk"><section className="jhk-live-main"><h2>{text('Choose your battleground.', 'अपना मैदान चुनें।')}</h2><label htmlFor="jhk-live-topic">{text('Topic', 'विषय')}</label><select id="jhk-live-topic" disabled={busy} value={file} onChange={e => setFile(e.target.value)}>{FILES.map(row => <option key={row[0]} value={row[0]}>{row[hi ? 2 : 1]}</option>)}</select>
          <fieldset className="jhk-live-stake"><legend>{text('Optional coin stake', 'वैकल्पिक सिक्के')}</legend><div className="jhk-live-actions">{[0, 10, 25].map(value => <button key={value} type="button" aria-pressed={stake === value} disabled={busy || value > balance} onClick={() => setStakeText(String(value))}>{value === 0 ? text('No stake', 'बिना सिक्के') : `${value} ${text('coins', 'सिक्के')}`}</button>)}</div><label htmlFor="jhk-live-stake">{text('Your amount', 'आपकी रकम')}</label><input id="jhk-live-stake" type="number" inputMode="numeric" min="0" max={Math.min(balance, 10000)} step="1" value={stakeText} disabled={busy} aria-invalid={!validStake} aria-describedby="jhk-live-stake-help" onChange={e => setStakeText(e.target.value)} /><p id="jhk-live-stake-help" className="jhk-live-muted">{validStake ? text(`${balance} available. 0 always lets you play. Both players confirm the same stake before starting.`, `${balance} उपलब्ध। 0 पर हमेशा खेल सकते हैं। शुरू होने से पहले दोनों बराबर सिक्के मंज़ूर करेंगे।`) : text(`Enter a whole number from 0 to ${Math.min(balance, 10000)}. Choose No stake to play free.`, `0 से ${Math.min(balance, 10000)} तक पूरा अंक लिखें। मुफ़्त खेलने के लिए बिना सिक्के चुनें।`)}</p></fieldset>
          <button className="jhk-live-primary" disabled={busy} onClick={() => { if (!validStake) { document.getElementById('jhk-live-stake')?.focus(); return; } void act('queue', { mode: 'ranked', file, stake }); }}><Swords size={20} />{busy ? text('Finding your table…', 'बैठक ढूँढ़ रहे हैं…') : text('Find a human rival', 'असली प्रतिद्वंद्वी ढूँढ़ें')}</button>
          <p className="jhk-live-muted">{text('Free simulated coins. No purchase, cash value, transfer or withdrawal.', 'मुफ़्त खेल के सिक्के। खरीद, नक़द मूल्य, ट्रांसफ़र या निकासी नहीं।')}</p>
        </section><aside className="jhk-live-side"><p className="jhk-live-kicker">{text('FRIENDS PLAY HERE', 'दोस्त यहाँ खेलें')}</p><h2>{text('Call your rival.', 'प्रतिद्वंद्वी को बुलाओ।')}</h2><p>{text('Create a room with your selected topic and stake, or enter a friend’s code. Both review the terms before Ready.', 'चुने विषय और सिक्कों के साथ रूम बनाएँ, या दोस्त का कोड डालें। तैयार होने से पहले दोनों शर्तें देखें।')}</p><button disabled={busy} onClick={() => { if (!validStake) { document.getElementById('jhk-live-stake')?.focus(); return; } void act('create', { file, stake }); }}>{text('Create private room', 'निजी रूम बनाएँ')}</button><form onSubmit={e => { e.preventDefault(); void act('join', { code: invite.trim().toUpperCase() }); }}><label htmlFor="jhk-live-code">{text('Room code', 'रूम कोड')}</label><input id="jhk-live-code" value={invite} onChange={e => setInvite(e.target.value)} required minLength={8} maxLength={16} autoComplete="off" autoCapitalize="characters" spellCheck={false} /><button type="submit" disabled={busy}>{text('Join friend', 'दोस्त से जुड़ें')}</button></form><div className="jhk-live-reward"><Trophy size={24} /><h3>{text('Knowledge pays.', 'ज्ञान कमाई है।')}</h3><p>{text('Earn 10 coins once per topic per UTC day after a completed human duel: both answer at least 3, with at least 1 correct answer for you.', 'UTC दिन में हर विषय पर पूरा इंसानी मुक़ाबला खेलकर 10 सिक्के: दोनों कम-से-कम 3 जवाब दें और आपका 1 सही हो।')}</p></div></aside></div> : <section className="jhk-live-board"><h2>{view === 'savings' ? text('Coin leaders', 'सिक्कों की रैंकिंग') : text('The human leaderboard', 'इंसानी लीडरबोर्ड')}</h2><p className="jhk-live-muted">{view === 'savings' ? text('Server coins, including reserved stakes. Earn a completion reward to join this board; starter coins alone do not qualify.', 'सुरक्षित सिक्कों सहित सर्वर सिक्के। इस बोर्ड में आने के लिए पूरा खेलने का इनाम कमाएँ; सिर्फ़ शुरुआती सिक्के काफ़ी नहीं।') : text('Win = 3 points, draw = 1. Qualify with 3 completed public matches against 3 different players; one per opponent per day. Private and abandoned matches do not count.', 'जीत = 3 अंक, बराबरी = 1। 3 अलग खिलाड़ियों से 3 पूरे सार्वजनिक मुक़ाबले; रोज़ प्रति प्रतिद्वंद्वी एक। निजी या अधूरे मुक़ाबले नहीं गिने जाते।')}</p>{!board ? <p role="status">{text('Loading standings…', 'रैंकिंग आ रही है…')}</p> : board.rows.length ? <div className="jhk-live-tablewrap"><table><caption className="sr-only">{text('JHK server standings', 'JHK सर्वर रैंकिंग')}</caption><thead><tr><th>#</th><th>{text('Player', 'खिलाड़ी')}</th><th>{view === 'savings' ? text('Coins', 'सिक्के') : text('Points', 'अंक')}</th></tr></thead><tbody>{board.rows.map(row => <tr key={row.id} data-self={row.id === session.id}><td>{row.rank}</td><th scope="row">{row.nickname}{row.id === session.id ? text(' · you', ' · आप') : ''}</th><td>{view === 'savings' ? row.savings : row.points}</td></tr>)}</tbody></table></div> : <p>{text('No qualifying players yet. Complete human duels to start the board.', 'अभी कोई योग्य खिलाड़ी नहीं। इंसानी मुक़ाबले पूरे करके शुरुआत करें।')}</p>}</section>}
      </>}
    </>}
    <details className="jhk-live-rules"><summary>{text('Timing, fairness & your progress', 'समय, निष्पक्षता और आपकी प्रगति')}</summary><p>{text('The server owns questions, first answers, start times, scores and coin settlement. Most correct answers wins; lower total server-recorded answer time breaks ties, with a 0.12 second dead heat. Network delay can affect timing. Profiles are not proof of unique people.', 'सर्वर सवाल, पहले जवाब, शुरू का समय, स्कोर और सिक्के तय करता है। सबसे अधिक सही जवाब जीतते हैं; बराबर हों तो कुल कम समय, 0.12 सेकंड में बराबरी। नेटवर्क असर डाल सकता है। प्रोफ़ाइल अलग असली लोगों का प्रमाण नहीं।')}</p><p>{text('Online XP and coins belong to this server profile. Existing practice XP, quests, medals and stamps stay on your device and remain available from Player. No local score is imported into online rank.', 'ऑनलाइन XP और सिक्के इस सर्वर प्रोफ़ाइल के हैं। अभ्यास XP, काम, मेडल और स्टैम्प डिवाइस पर रहते हैं और Player में मिलते हैं। स्थानीय स्कोर ऑनलाइन रैंक में नहीं आता।')}</p></details>
    <div className="jhk-live-actions"><button onClick={onPractice}>{text('Learn with expeditions', 'अभियानों से सीखें')}</button><button onClick={onHome}><ArrowLeft size={16} />{text('Home', 'होम')}</button></div>
  </section>;
}

export function LiveProgressCard({ onPlay }: { onPlay: () => void }) {
  const [session, setSession] = useState<PlayerSession | null>(online.session);
  useEffect(() => online.subscribe(() => setSession(online.session)), []);
  const { locale } = useLocale();
  return <section className="jhk-live jhk-live-profile"><p className="jhk-live-kicker">{locale === 'hi' ? 'इंसानी मुक़ाबलों की प्रगति' : 'HUMAN DUEL PROGRESS'}</p><h2>{session?.avatar && <span className="jhk-profile-avatar" aria-label={`${session.avatar} avatar`}>{({ spark: '✦', shield: '⬡', star: '★', bolt: 'ϟ', book: '▤', compass: '✥' } as Record<string, string>)[session.avatar] || '✦'}</span>}{session?.nickname || (locale === 'hi' ? 'आपकी सर्वर खिलाड़ी पहचान' : 'Your server player card')}</h2>{session ? <div className="jhk-live-byline"><span><strong>{session.onlineXp ?? 0}</strong> online XP</span><span><strong>{session.balance ?? 0}</strong> server coins</span></div> : <p>{locale === 'hi' ? 'प्रोफ़ाइल बनाकर इंसानी मुकाबले खेलें।' : 'Create a profile to build your human duel record.'}</p>}{session?.profileComplete && <ProfileOptions session={session} />}<p className="jhk-live-muted">{locale === 'hi' ? 'नीचे आपके डिवाइस के अभ्यास मेडल, XP और स्टैम्प हैं।' : 'Your device practice medals, XP and stamps continue below.'}</p><button onClick={onPlay}>{locale === 'hi' ? 'इंसानी मुक़ाबला खोलें' : 'Open human duels'}</button></section>;
}
