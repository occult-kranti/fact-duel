'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MoveUpRight, RotateCcw, Sparkles } from 'lucide-react';
import { CONTACT_MS, DELIVERY_MS, sampleFlight, shotForTiming } from '@/lib/stadium-physics.mjs';
import { useLocale } from '../use-locale';
import './stadium-scene.css';

const motionQuery = '(prefers-reduced-motion: reduce)';
function motionSubscribe(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', callback);
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  return () => { query.removeEventListener('change', callback); observer.disconnect(); };
}
function useReducedMotion() {
  return useSyncExternalStore(motionSubscribe, () => window.matchMedia(motionQuery).matches || ['reduced', 'off'].includes(document.documentElement.dataset.motion || ''), () => true);
}

/** Decorative depth is progressive enhancement; neither image nor animation is needed to play. */
export function StadiumScene({ className = '', compact = false, interactive = true }: {
  className?: string;
  compact?: boolean;
  interactive?: boolean;
}) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLSpanElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const started = useRef(0);
  const raf = useRef(0);
  const shotRef = useRef<ReturnType<typeof shotForTiming> | null>(null);
  const phaseRef = useRef<'ready' | 'delivery' | 'flight' | 'result'>('ready');
  const [phase, setPhase] = useState<'ready' | 'delivery' | 'flight' | 'result'>('ready');
  const [result, setResult] = useState<ReturnType<typeof shotForTiming> | null>(null);
  const [aim, setAim] = useState(50);
  const [interrupted, setInterrupted] = useState(false);

  function transition(next: typeof phase) { phaseRef.current = next; setPhase(next); }
  function reset() {
    cancelAnimationFrame(raf.current);
    phaseRef.current = 'ready'; setPhase('ready'); setResult(null); setInterrupted(false);
    if (ball.current) ball.current.style.transform = '';
    if (cursor.current) cursor.current.style.left = '0%';
  }
  function swing() {
    if (phaseRef.current !== 'delivery') return;
    const shot = shotForTiming(reduced ? (aim / 100) * DELIVERY_MS : performance.now() - started.current);
    shotRef.current = shot; setResult(shot); started.current = performance.now();
    transition(reduced ? 'result' : 'flight');
  }
  function play() {
    if (phaseRef.current === 'delivery') { swing(); return; }
    if (phaseRef.current === 'flight') return;
    setResult(null); setInterrupted(false); started.current = performance.now();
    if (reduced) {
      const shot = shotForTiming((aim / 100) * DELIVERY_MS);
      shotRef.current = shot; setResult(shot); transition('result');
    } else transition('delivery');
  }

  useEffect(() => {
    if (phase !== 'delivery' && phase !== 'flight') return;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - started.current);
      if (phaseRef.current === 'delivery') {
        const t = Math.min(1, elapsed / DELIVERY_MS);
        if (cursor.current) cursor.current.style.left = `${t * 100}%`;
        if (ball.current) ball.current.style.transform = `translate3d(${(t - .5) * 12}px, ${t * 93}px, ${t * 42}px) scale(${.4 + t * .7})`;
        if (elapsed >= DELIVERY_MS) {
          const missed = shotForTiming(DELIVERY_MS + 500);
          setResult(missed); phaseRef.current = 'result'; setPhase('result'); return;
        }
      } else if (phaseRef.current === 'flight' && shotRef.current) {
        const shot = shotRef.current;
        const flight = sampleFlight(shot, elapsed / 1000 * 1.65);
        if (ball.current) ball.current.style.transform = `translate3d(${flight.x * 2.3}px, ${60 - flight.height * 13 - flight.x * .8}px, 0) scale(${Math.max(.25, 1 - flight.x / 75)})`;
        if (flight.done) { phaseRef.current = 'result'; setPhase('result'); return; }
      }
      raf.current = requestAnimationFrame(tick);
    };
    if (!reduced) raf.current = requestAnimationFrame(tick);
    const pause = () => {
      if (!document.hidden) return;
      cancelAnimationFrame(raf.current);
      phaseRef.current = 'ready'; setPhase('ready'); setResult(null); setInterrupted(true);
    };
    document.addEventListener('visibilitychange', pause);
    return () => { cancelAnimationFrame(raf.current); document.removeEventListener('visibilitychange', pause); };
  }, [phase, reduced]);

  // Motion preferences can change while a shot is in flight. Finish it without moving the scene.
  useEffect(() => {
    if (!reduced || (phaseRef.current !== 'flight' && phaseRef.current !== 'delivery')) return;
    const id = requestAnimationFrame(() => {
      cancelAnimationFrame(raf.current);
      phaseRef.current = 'ready'; setPhase('ready'); setResult(null);
    });
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const resultLabel = result ? result.runs === 6 ? (hi ? 'छक्का। क्या टाइमिंग है!' : 'SIX. Sweetly timed.') : result.runs === 4 ? (hi ? 'चार। बाउंड्री के पार।' : 'FOUR. Found the gap.') : result.runs === 1 ? (hi ? 'एक रन। फिर कोशिश करो।' : 'A single. Go again.') : (hi ? 'मिस हुआ। एक और गेंद?' : 'Beaten. One more ball?') : '';

  return <div className={`st-scene ${compact ? 'st-scene--compact' : ''} ${className}`} data-shot={phase}>
    <div className="st-scene-view" ref={stage} onPointerMove={event => {
      if (reduced || event.pointerType !== 'mouse') return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--look-x', `${((event.clientX - rect.left) / rect.width - .5) * 7}deg`);
      event.currentTarget.style.setProperty('--look-y', `${((event.clientY - rect.top) / rect.height - .5) * -4}deg`);
    }} onPointerLeave={event => { event.currentTarget.style.setProperty('--look-x', '0deg'); event.currentTarget.style.setProperty('--look-y', '0deg'); }}>
      <div className="st-scene-art" aria-hidden="true">
        <img className="st-scene-day" src="/art/stadium-day.webp" width="1200" height="1200" alt="" decoding="async" fetchPriority="high" />
        <img className="st-scene-night" src="/art/stadium-night.webp" width="1200" height="1200" alt="" decoding="async" loading="lazy" />
      </div>
      <div className="st-scene-depth" aria-hidden="true">
        <span className="st-scene-orbit" />
        <span className="st-scene-pitch"><i /><i /></span>
        <span className="st-scene-wickets"><i /><i /><i /><b /></span>
        <span className="st-scene-ball" ref={ball} />
        <span className="st-scene-bat" />
      </div>
      <div className="st-scene-caption"><span className="st-scene-lamp" /><span className="st-day-label">{hi ? 'दिन का खेल' : 'DAY SESSION'}</span><span className="st-night-label">{hi ? 'फ़्लडलाइट्स चालू' : 'UNDER THE LIGHTS'}</span><span className="st-scene-coordinate">22 YARDS. YOUR WORLD.</span></div>
      {phase === 'result' && result && <div className="st-scene-shot-mark" aria-hidden="true">{result.runs === 0 ? '·' : result.runs}<small>{result.runs === 6 ? 'OUT OF THE PARK' : result.runs === 4 ? 'BOUNDARY' : 'NET PRACTICE'}</small></div>}
    </div>
    {interactive && <details className="st-nets" onToggle={event => { if (!event.currentTarget.open && phaseRef.current !== 'ready') reset(); }}>
      <summary><Sparkles size={16} aria-hidden="true" /><span>{hi ? 'नेट प्रैक्टिस' : 'Net practice'}<small>{hi ? 'एक शॉट आज़माएँ' : 'A little warm-up'}</small></span><MoveUpRight size={17} aria-hidden="true" /></summary>
      <div className="st-nets-content">
        <p>{reduced ? (hi ? 'टाइमिंग चुनें, फिर शॉट खेलें।' : 'Choose your timing, then play a shot.') : (hi ? 'गेंद डालें। निशान हरे हिस्से में आए तो शॉट खेलें।' : 'Start the delivery. Swing when the marker reaches the green zone.')}</p>
        {reduced ? <label className="st-nets-aim">{hi ? 'शॉट टाइमिंग' : 'Shot timing'}<input type="range" min="0" max="100" value={aim} onChange={e => setAim(Number(e.target.value))} aria-valuetext={`${aim} percent, sweet spot around 65 percent`} /><span>{hi ? 'जल्दी' : 'Early'}<b>{hi ? 'सही समय ≈ 65%' : 'Sweet spot ≈ 65%'}</b>{hi ? 'देर' : 'Late'}</span></label> : <div className="st-nets-timing" aria-hidden="true"><span className="st-nets-zone" style={{left:`${(CONTACT_MS / DELIVERY_MS) * 100 - 8}%`}} /><span ref={cursor} className="st-nets-cursor" /></div>}
        <div className="st-nets-actions"><button className="st-nets-play" type="button" disabled={phase === 'flight'} onClick={play}>{phase === 'delivery' ? (hi ? 'शॉट खेलें!' : 'Swing!') : phase === 'flight' ? (hi ? 'गेंद हवा में…' : 'Ball in flight…') : reduced ? (hi ? 'शॉट खेलें' : 'Play shot') : (hi ? 'गेंद डालें' : 'Start delivery')}<MoveUpRight size={18} aria-hidden="true" /></button><button type="button" className="st-nets-reset" onClick={reset} aria-label={hi ? 'प्रैक्टिस रीसेट करें' : 'Reset net practice'}><RotateCcw size={18} aria-hidden="true" /></button></div>
        <p className="st-nets-result" role="status" aria-live="polite">{resultLabel || (interrupted ? (hi ? 'प्रैक्टिस रुकी। फिर से शुरू करें।' : 'Practice paused. Start a fresh delivery.') : (hi ? 'सिर्फ़ वार्म-अप। क्विज़ स्कोर नहीं बदलता।' : 'Just a warm-up. Your quiz score stays the same.'))}{result && result.runs > 0 && <span>{Math.round(result.distance)}m {hi ? 'सिमुलेटेड शॉट' : 'simulated shot'}</span>}</p>
      </div>
    </details>}
  </div>;
}

/** Only mount after an answer result is final; decorative movement never crosses the options. */
export function StadiumOutcome({ correct, roundKey = '' }: { correct: boolean; roundKey?: string }) {
  const { locale } = useLocale();
  return <div key={roundKey} className="st-outcome" data-correct={correct ? 'true' : 'false'}>
    <span className="st-outcome-icon" aria-hidden="true">{correct ? '6' : '·'}<i /></span>
    <span><b>{correct ? (locale === 'hi' ? 'सीधे स्वीट स्पॉट पर।' : 'Right in the sweet spot.') : (locale === 'hi' ? 'अगली गेंद आपकी।' : 'The next ball is yours.')}</b><small>{correct ? (locale === 'hi' ? 'जानकारी की बाउंड्री।' : 'A boundary for your brain.') : (locale === 'hi' ? 'जवाब जानें, फिर वापसी करें।' : 'Read the answer. Come back stronger.')}</small></span>
  </div>;
}
