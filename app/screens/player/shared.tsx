'use client';
/**
 * Small pieces shared by the Player screen cards: the SVG progress ring used by the level card and
 * the top-bar chip, the tier/medal glyphs, a meter, and the press-feedback handler every
 * interactive element on this screen uses (tap cue + light haptic on pointerdown).
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useJuice } from '@/components/fx';

/** Ring geometry shared by the avatar ring and the top-bar level ring. */
export function ProgressRing({
  progress,
  size = 104,
  stroke = 5,
  className,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return (
    <svg className={className} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
      <circle className="fd-ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
      <circle
        className="fd-ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
      />
    </svg>
  );
}

/** A token-coloured progress bar. `tone` sets --meter; otherwise the equipped accent is used. */
export function Meter({ value, tone, label }: { value: number; tone?: string; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100);
  return (
    <div
      className="fd-meter"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={tone ? ({ '--meter': tone } as CSSProperties) : undefined}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

const pipRow = (pips: number) => {
  const n = Math.max(1, Math.min(5, pips));
  return Array.from({ length: n }, (_, i) => ({ key: i, cx: 24 + (i - (n - 1) / 2) * 7 }));
};

/** Arena-rank shield. One shape for every tier; the tier colour and the pip count differ. */
export function TierShield({ pips }: { pips: number }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        d="M24 3.5 42 10v13.5C42 33.8 34.6 42.3 24 45 13.4 42.3 6 33.8 6 23.5V10Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {pipRow(pips).map(({ key, cx }) => (
        <circle key={key} cx={cx} cy={24} r={2.6} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Achievement medal: a ribboned disc. Locked tiles render it as a flat silhouette. */
export function BadgeMedal({ locked }: { locked: boolean }) {
  return (
    <svg className="fd-badge-medal" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M16 4h6l3 12h-8Z" fill="currentColor" fillOpacity={locked ? 0.35 : 0.55} />
      <path d="M32 4h-6l-3 12h8Z" fill="currentColor" fillOpacity={locked ? 0.35 : 0.55} />
      <circle
        cx="24"
        cy="30"
        r="13"
        fill="currentColor"
        fillOpacity={locked ? 0.18 : 0.28}
        stroke="currentColor"
        strokeWidth="2"
      />
      {!locked && (
        <path
          d="m18.5 30.4 3.8 3.8 7.3-7.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {locked && <circle cx="24" cy="30" r="4.5" fill="currentColor" fillOpacity="0.3" />}
    </svg>
  );
}

/** Tap cue + light haptic on pointerdown, for every button on this screen. */
export function usePress() {
  const juice = useJuice();
  return () => {
    juice.sound('tap');
    juice.haptic('light');
  };
}

export function SectionHead({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="fd-sec-head">
      <div>
        {eyebrow && <p className="fd-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {aside}
      {children}
    </div>
  );
}

/** True when the browser can create a WebGL context (probed once, in the browser only). */
export function useWebGL(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const canvas = document.createElement('canvas');
      setOk(!!(canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

/** `matchMedia` as a hook. False during SSR and on the first client frame. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return matches;
}
