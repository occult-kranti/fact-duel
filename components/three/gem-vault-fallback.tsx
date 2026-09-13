'use client';
import type { CSSProperties } from 'react';

export const DEFAULT_GEM_COLORS = ['#d4ff3a', '#ffc83d', '#4ee1ff', '#ff5ea8'];

export interface GemVaultFallbackProps {
  count?: number;
  colors?: string[];
  accent?: string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

function hash(i: number): number {
  let x = (i + 1) * 2654435761;
  x = (x ^ (x >>> 15)) * 2246822519;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

/** Pure CSS pile illustration shown when WebGL or physics are unavailable (no three.js). */
export function GemVaultFallback({
  count = 12,
  colors = DEFAULT_GEM_COLORS,
  accent = '#4ee1ff',
  height = 380,
  className,
  style,
}: GemVaultFallbackProps) {
  const shown = Math.max(0, Math.min(48, Math.round(count)));
  const gems = Array.from({ length: shown }, (_, i) => {
    const layer = Math.floor(i / 10);
    const spread = 46 - layer * 7;
    const x = 50 + (hash(i) - 0.5) * spread;
    const y = 79 - layer * 6 - hash(i + 97) * 2.5;
    const color = colors[i % colors.length] ?? accent;
    return { x, y, color, rot: 35 + hash(i + 31) * 20, size: 11 + hash(i + 7) * 5 };
  });
  return (
    <div
      className={className}
      role="img"
      aria-label={`${Math.round(count)} gems in the vault`}
      style={{
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
        background: `radial-gradient(ellipse 55% 40% at 50% 74%, ${accent}22, transparent 70%)`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '44%',
          width: '64%',
          maxWidth: 420,
          aspectRatio: '2 / 1',
          transform: 'translateX(-50%)',
          borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          border: `1px solid ${accent}88`,
          borderTop: `2px solid ${accent}cc`,
          background: `linear-gradient(180deg, ${accent}10, ${accent}2a)`,
          boxShadow: `inset 0 -18px 40px ${accent}22, 0 24px 60px rgba(0,0,0,0.45)`,
        }}
      />
      {gems.map((g, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: g.size,
            height: g.size,
            marginLeft: -g.size / 2,
            marginTop: -g.size / 2,
            transform: `rotate(${g.rot}deg)`,
            background: `linear-gradient(135deg, #ffffff 0%, ${g.color} 45%, ${g.color}99 100%)`,
            boxShadow: `0 0 10px ${g.color}88`,
            borderRadius: 2,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '80%',
          width: '52%',
          maxWidth: 340,
          height: 10,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #2a3340, #0b0f14)',
          boxShadow: `0 0 24px ${accent}44`,
        }}
      />
    </div>
  );
}
