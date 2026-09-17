'use client';
/**
 * app/shell/brand-mark.tsx — the Jaanta Hai Kya (JHK) mark and wordmark as inline SVG.
 *
 * One drawing, three sizes: the same paths are written to public/brand/*.svg by the brand
 * generator and embedded here so the in-app mark follows the theme tokens (currentColor and the
 * volt fill) instead of a fixed hex. Geometry: the mark is a question mark whose tail is the K's
 * leg, with one dot, on a 64-unit grid; the wordmark is a hand-drawn monoline geometric sans
 * (cap height 100, stroke 20, no font dependency). See docs/brand.md before changing either.
 */
import type { SVGProps } from 'react';

const MARK_HOOK = "M18 20C18 12 24 7 31 7C38 7 44 12 44 19C44 25 39 28 36 30C33 32 31 34 31 38V44";
const MARK_LEG = "M31 44L45 58";
const MARK_DOT = {"cx":21,"cy":56,"r":4.5};

type Glyph = { x: number; d: string; dots?: number[][] };
/** Laid-out glyphs of "Jaanta Hai Kya" in a 0..954 × 0..128 box. */
const WORD: Glyph[] = [
  { x: 10, d: "M40 10V70A20 20 0 0 1 0 70" },
  { x: 82, d: "M50 65a25 25 0 1 0 -50 0a25 25 0 1 0 50 0M50 40V90" },
  { x: 164, d: "M50 65a25 25 0 1 0 -50 0a25 25 0 1 0 50 0M50 40V90" },
  { x: 246, d: "M0 90V40M0 65A25 25 0 0 1 50 65V90" },
  { x: 328, d: "M15 15V75A15 15 0 0 0 30 90M0 40H35" },
  { x: 395, d: "M50 65a25 25 0 1 0 -50 0a25 25 0 1 0 50 0M50 40V90" },
  { x: 511, d: "M0 10V90M50 10V90M0 50H50" },
  { x: 593, d: "M50 65a25 25 0 1 0 -50 0a25 25 0 1 0 50 0M50 40V90" },
  { x: 675, d: "M0 40V90", dots: [[0,14]] },
  { x: 741, d: "M0 10V90M45 10L0 55L45 90" },
  { x: 818, d: "M0 40L22 90M44 40L9.7 118" },
  { x: 894, d: "M50 65a25 25 0 1 0 -50 0a25 25 0 1 0 50 0M50 40V90" },
];
const WORD_W = 954;
/** Laid-out glyphs of "JHK" in a 0..231 × 0..128 box. */
const JHK: Glyph[] = [
  { x: 10, d: "M40 10V70A20 20 0 0 1 0 70" },
  { x: 88, d: "M0 10V90M50 10V90M0 50H50" },
  { x: 176, d: "M0 10V90M45 10L0 55L45 90" },
];
const JHK_W = 231;
const STROKE = 20;

export type JhkMarkProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /** Rendered size in px (the SVG is square). */
  size?: number;
  /** Draw the dark app-icon tile behind the glyph. Without it the glyph paints in currentColor. */
  tile?: boolean;
  /** Accessible name; omit for a decorative mark (aria-hidden is set). */
  title?: string;
};

/** The JHK mark. With `tile` it is the app icon (always a dark tile, always a volt glyph). */
export function JhkMark({ size = 24, tile = false, title, ...rest }: JhkMarkProps) {
  const color = tile ? 'var(--volt)' : 'currentColor';
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {tile && <rect width="64" height="64" rx="14" fill="#0a0e14" stroke="var(--line)" strokeWidth="1" />}
      <g fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d={MARK_HOOK} />
        <path d={MARK_LEG} />
      </g>
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill={color} />
    </svg>
  );
}

function Glyphs({ glyphs }: { glyphs: Glyph[] }) {
  return (
    <g fill="currentColor" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <g fill="none">
        {glyphs.map((g, i) => (
          <path key={i} transform={`translate(${g.x} 0)`} d={g.d} />
        ))}
      </g>
      <g stroke="none">
        {glyphs.flatMap((g, i) => (g.dots ?? []).map(([cx, cy], k) => <circle key={`${i}-${k}`} cx={g.x + cx} cy={cy} r={STROKE / 2} />))}
      </g>
    </g>
  );
}

export type JhkWordmarkProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /** Rendered height in px; the width follows the drawing's ratio. */
  height?: number;
  /** `short` draws the JHK lockup letters instead of the full name. */
  variant?: 'full' | 'short';
  title?: string;
};

/** The wordmark in currentColor. Padding of half a stroke keeps round caps inside the box. */
export function JhkWordmark({ height = 18, variant = 'full', title = 'Jaanta Hai Kya', ...rest }: JhkWordmarkProps) {
  const glyphs = variant === 'short' ? JHK : WORD;
  const w = (variant === 'short' ? JHK_W : WORD_W) + STROKE;
  const h = 128 + STROKE;
  return (
    <svg
      viewBox={`${-STROKE / 2} ${-STROKE / 2} ${w} ${h}`}
      height={height}
      width={(height * w) / h}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      <Glyphs glyphs={glyphs} />
    </svg>
  );
}
