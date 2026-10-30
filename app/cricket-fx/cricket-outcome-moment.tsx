'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefs, useReducedMotion } from '@/components/fx/use-prefs';
import { reducedMotion, subscribePrefs } from '@/lib/fx/prefs';
import { CRICKET_MOMENT_MS, createCricketMomentGate, cricketOutcome } from '@/lib/cricket-outcomes.mjs';
import { playCricketCue, type CricketMomentKind } from './cricket-audio';
import './cricket-outcomes.css';

const momentGate = createCricketMomentGate();
const copy: Record<CricketMomentKind, { title: string; caption: string }> = {
  boundary: { title: 'Raise your bat!', caption: 'A winning shot. Take a bow.' },
  wicket: { title: 'Back to the crease.', caption: 'A wicket moment. A fresh innings awaits.' },
  'run-out': { title: 'Almost home.', caption: 'A close finish. The next innings is yours to try.' },
  level: { title: 'Bats raised together.', caption: 'Honours shared. Well played.' },
};

export type CricketOutcomeMomentProps = {
  /** Stable result ID, including viewer/team identity if several perspectives share a page. */
  eventId: string;
  /** The result authority decides this; this component never calculates the match winner. */
  outcome: 'win' | 'loss' | 'draw' | 'cancelled';
  settled: boolean;
  /** Correct-answer scores only. Missing scores get a neutral loss moment, never a near-win claim. */
  ourScore?: number;
  theirScore?: number;
  forfeit?: boolean;
};

function Ball({ className = '', cx = 146, cy = 60 }: { className?: string; cx?: number; cy?: number }) {
  return <g className={className}><circle cx={cx} cy={cy} r="7" fill="#bd3c39" stroke="#7b282c" strokeWidth="1.3" /><path d={`M${cx - 2} ${cy - 6}q6 6 0 12`} stroke="#fff0d8" strokeWidth="1.1" fill="none" strokeDasharray="1.5 1" /></g>;
}

function Bat({ className = '', transform = '' }: { className?: string; transform?: string }) {
  return <g transform={transform}><g className={className}><rect x="-4" y="-53" width="8" height="25" rx="3" fill="#087f7a" stroke="#123d42" strokeWidth="1.5" /><path d="M-4-29L-10-22L-11 27Q0 32 11 27L10-22L4-29Z" fill="#ffc878" stroke="#73513c" strokeWidth="1.5" /><path d="M-4-17L-4 22M2-19L2 23" stroke="#e9a757" strokeWidth="1.5" /><path d="M-3-46H3M-3-40H3M-3-34H3" stroke="#5fb5a7" strokeWidth="1.3" /></g></g>;
}

function Stumps({ runOut = false }: { runOut?: boolean }) {
  return <g className="cricket-stumps" transform={runOut ? 'translate(153 30)' : 'translate(101 30)'}>
    {[0, 13, 26].map(x => <rect key={x} x={x} y="12" width="6" height="55" rx="2" fill="#f5c179" stroke="#78583b" strokeWidth="1.5" />)}
    <g className="cricket-bail cricket-bail-left"><rect x="-1" y="8" width="17" height="4" rx="1.5" fill="#ffc878" stroke="#78583b" /></g>
    <g className="cricket-bail cricket-bail-right"><rect x="13" y="8" width="20" height="4" rx="1.5" fill="#ffc878" stroke="#78583b" /></g>
  </g>;
}

function CricketScene({ kind }: { kind: CricketMomentKind }) {
  return <svg className="cricket-scene" viewBox="0 0 240 118" aria-hidden="true" focusable="false">
    <ellipse cx="119" cy="100" rx="107" ry="12" fill="#087f7a" opacity=".13" />
    <path d="M25 99H218" stroke="#087f7a" strokeWidth="3" strokeLinecap="round" opacity=".6" />
    {kind === 'boundary' && <>
      <path d="M87 77Q134 8 205 30" stroke="#f1af46" strokeWidth="2" strokeDasharray="4 6" fill="none" className="cricket-trajectory" />
      <path d="M189 47Q199 71 204 99" stroke="#f7f1e6" strokeWidth="3" fill="none" />
      <path d="M198 48V31L215 36L198 43M218 70V51L233 56L218 64" fill="#ffbd59" stroke="#976630" strokeWidth="1" />
      <Bat transform="translate(70 67)" className="cricket-bat-swing" />
      <Ball className="cricket-boundary-ball" cx={202} cy={29} />
      <g className="cricket-cheers" fill="#087f7a"><path d="M136 89l-3-12h4l3 12zM149 90l3-17h4l-3 17zM164 91l5-11h4l-5 11z" /></g>
    </>}
    {kind === 'wicket' && <><Stumps /><Ball className="cricket-wicket-ball" cx={139} cy={86} /><path d="M145 62l6-5M148 70l10-1M142 55l1-7" stroke="#ffbd59" strokeWidth="2.5" strokeLinecap="round" className="cricket-impact" /></>}
    {kind === 'run-out' && <>
      <path d="M145 95L145 109" stroke="#fffaf0" strokeWidth="4" />
      <Bat transform="translate(94 86) rotate(-82)" className="cricket-bat-slide" />
      <Stumps runOut /><Ball className="cricket-runout-ball" cx={175} cy={84} />
      <path d="M29 89h29M39 82h21" stroke="#d5ab74" strokeWidth="2" strokeLinecap="round" className="cricket-dust" />
    </>}
    {kind === 'level' && <>
      <Bat transform="translate(86 66) rotate(-18)" className="cricket-bat-raise cricket-bat-raise-left" />
      <Bat transform="translate(157 66) rotate(18)" className="cricket-bat-raise cricket-bat-raise-right" />
      <Ball cx={121} cy={93} />
      <path d="M115 27h13M121.5 20v14" stroke="#ffbd59" strokeWidth="2" strokeLinecap="round" />
    </>}
  </svg>;
}

/** A finite inline cricket moment. Replay/share/navigation remain available immediately. */
export function CricketOutcomeMoment(props: CricketOutcomeMomentProps) {
  const kind = cricketOutcome(props);
  const prefs = usePrefs();
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!kind) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The deferred claim survives StrictMode's setup/cleanup probe without duplicate playback.
    const frame = requestAnimationFrame(() => {
      setActiveId(null);
      if (!momentGate.claim(props.eventId) || document.hidden) return;
      try { stopRef.current = playCricketCue(kind); } catch { /* Optional sound must never interrupt a result. */ }
      if (!reducedMotion()) {
        setActiveId(props.eventId);
        timer = setTimeout(() => { setActiveId(null); stopRef.current(); }, CRICKET_MOMENT_MS);
      }
    });
    return () => { cancelAnimationFrame(frame); if (timer) clearTimeout(timer); stopRef.current(); };
  }, [props.eventId, kind]);

  const running = activeId === props.eventId && !reduce && prefs.motion === 'full';
  useEffect(() => subscribePrefs(() => {
    if (reducedMotion()) setActiveId(null);
  }), []);

  if (!kind) return null;
  const text = copy[kind];
  return <section className={`cricket-outcome cricket-outcome-${kind}${running ? ' cricket-outcome-running' : ''}`} aria-label="Cricket result moment">
    <CricketScene kind={kind} />
    <div className="cricket-moment-copy"><span>At the pavilion</span><strong>{text.title}</strong><p>{text.caption}</p></div>
    <button type="button" className="cricket-moment-skip" style={{ visibility: running ? 'visible' : 'hidden' }} tabIndex={running ? 0 : -1} aria-label="Skip cricket animation" onClick={() => { setActiveId(null); stopRef.current(); }}>Skip</button>
  </section>;
}
