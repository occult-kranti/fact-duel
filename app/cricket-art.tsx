'use client';

import { useId } from 'react';

/** Original vector stage. No image downloads, WebGL contexts or render loop are needed. */
export function CricketArt({ className = '' }: { className?: string }) {
  const key = useId().replaceAll(':', '');
  return (
    <div className={`cr-art ${className}`} aria-hidden="true">
      <svg className="cr-stadium" viewBox="0 0 660 550" fill="none" focusable="false">
        <defs>
          <radialGradient id={`${key}-ground`} cx=".5" cy=".35" r=".75">
            <stop stopColor="var(--cr-turf-light)" />
            <stop offset="1" stopColor="var(--cr-turf)" />
          </radialGradient>
          <linearGradient id={`${key}-ball`} x1="0" x2="1" y2="1">
            <stop stopColor="#f89570" />
            <stop offset=".42" stopColor="#d94335" />
            <stop offset="1" stopColor="#7f2428" />
          </linearGradient>
          <linearGradient id={`${key}-bat`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f8e4b7" />
            <stop offset=".5" stopColor="#d5ac6f" />
            <stop offset="1" stopColor="#ad7546" />
          </linearGradient>
          <linearGradient id={`${key}-beam`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--cr-light)" stopOpacity=".22" />
            <stop offset="1" stopColor="var(--cr-light)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="cr-stadium-lights">
          <path d="M117 101 16 350 390 347 167 104Z" fill={`url(#${key}-beam)`} />
          <path d="m498 90-249 263 378 19L548 90Z" fill={`url(#${key}-beam)`} />
          <path d="m139 118 20 204M526 104l-15 198" stroke="var(--cr-structure)" strokeWidth="6" />
          <g transform="translate(105 78) rotate(-5 38 24)">
            <rect width="76" height="44" rx="3" fill="var(--cr-structure)" />
            {[0, 1, 2, 3].map(x => [0, 1].map(y => <rect key={`${x}-${y}`} x={7 + x * 17} y={7 + y * 17} width="11" height="11" rx="1.5" fill="var(--cr-light)" />))}
          </g>
          <g transform="translate(491 61) rotate(5 38 24)">
            <rect width="76" height="44" rx="3" fill="var(--cr-structure)" />
            {[0, 1, 2, 3].map(x => [0, 1].map(y => <rect key={`${x}-${y}`} x={7 + x * 17} y={7 + y * 17} width="11" height="11" rx="1.5" fill="var(--cr-light)" />))}
          </g>
        </g>
        <ellipse cx="332" cy="374" rx="283" ry="131" fill="var(--cr-stadium-shadow)" />
        <path d="M41 302c0-70 132-124 291-124s291 54 291 124v45c0 73-130 135-291 135S41 420 41 347Z" fill="var(--cr-stands)" />
        <ellipse cx="332" cy="302" rx="291" ry="124" stroke="var(--cr-structure)" strokeWidth="2" />
        {[0, 1, 2, 3].map(row => <ellipse key={row} cx="332" cy={306 + row * 10} rx={279 - row * 8} ry={116 - row * 7} stroke="var(--cr-seat)" strokeWidth="2" strokeDasharray="2 9" />)}
        <ellipse cx="332" cy="326" rx="250" ry="106" fill={`url(#${key}-ground)`} />
        {[0, 1, 2, 3, 4].map(ring => <ellipse key={ring} cx="332" cy="326" rx={225 - ring * 35} ry={93 - ring * 15} stroke="var(--cr-stripe)" strokeWidth="16" opacity=".35" />)}
        <ellipse cx="332" cy="326" rx="223" ry="90" stroke="var(--cr-chalk)" strokeWidth="1.5" strokeDasharray="4 5" />
        <path d="m302 286 36-4 27 89-38 4Z" fill="var(--cr-pitch)" />
        <path d="m299 297 45-5m-23 69 45-5" stroke="var(--cr-chalk)" strokeWidth="2" />
        <g stroke="var(--cr-chalk)" strokeWidth="2.3" strokeLinecap="round">
          <path d="m317 281 1 14m3-14 1 14m3-14 1 14m-10-15 11-1M339 345l1 15m3-16 1 15m3-15 1 15m-10-15 11-1" />
        </g>
        <path d="M104 418c61 50 175 78 291 64" stroke="var(--cr-chalk)" strokeWidth="1" opacity=".35" />
        <g className="cr-bat" transform="translate(421 110) rotate(31)">
          <path d="M-10 0c0-5 20-5 20 0v76h-20Z" fill="var(--cr-grip)" />
          {[14, 24, 34, 44, 54, 64].map(y => <path key={y} d={`M-9 ${y}H9`} stroke="var(--cr-chalk)" strokeWidth="1" opacity=".35" />)}
          <path d="m-10 76-20 28v138q0 12 12 12h36q12 0 12-12V104L10 76Z" fill={`url(#${key}-bat)`} stroke="#bb8c57" strokeWidth="2" />
          <path d="M-20 111v126M20 111v126M0 101v139" stroke="#fae9c4" opacity=".6" />
          <path d="M-28 135h56v48h-56Z" fill="var(--cr-grip)" />
          <path d="m-14 151 14 17 14-17" stroke="var(--cr-light)" strokeWidth="4" />
        </g>
        <g className="cr-ball">
          <ellipse cx="220" cy="418" rx="65" ry="13" fill="var(--cr-stadium-shadow)" opacity=".55" />
          <circle cx="218" cy="361" r="56" fill={`url(#${key}-ball)`} />
          <path d="M202 309c34 24 43 74 20 108" stroke="#fadbb8" strokeWidth="2" />
          <path d="M196 311c34 24 43 74 20 108M208 307c34 24 43 74 20 108" stroke="#fadbb8" strokeWidth="1.8" strokeDasharray="3 4" />
          <path d="M179 342c0-10 8-19 15-21" stroke="#ffb28b" strokeWidth="3" strokeLinecap="round" opacity=".6" />
        </g>
        <g className="cr-orbit" stroke="var(--cr-orbit)" strokeWidth="1.5">
          <path d="m577 206 10-10m-5-5v20m-10-10h20M96 201h13m-6-7v14" />
          <circle cx="453" cy="453" r="5" />
          <circle cx="220" cy="158" r="3" />
        </g>
        <text x="513" y="443" fill="var(--cr-chalk)" fontFamily="ui-monospace, monospace" fontSize="12" letterSpacing="3">JHK / 06</text>
      </svg>
      <span className="cr-art-caption">THE KNOWLEDGE GAME</span>
    </div>
  );
}

export function CricketMark({ kind = 'ball', className = '' }: { kind?: 'ball' | 'bat' | 'wicket' | 'trophy'; className?: string }) {
  return <svg className={`cr-mark ${className}`} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === 'ball' && <><circle cx="24" cy="24" r="17" /><path d="M18 8c12 10 16 23 8 32M14 10c12 10 16 23 8 32" strokeDasharray="2 3" /></>}
    {kind === 'bat' && <g transform="rotate(35 24 24)"><path d="M21 4h6v14l7 8v16H14V26l7-8Z" /><path d="M21 8h6m-6 4h6m-11 17h16m-16 8h16" /></g>}
    {kind === 'wicket' && <><path d="M14 40V11m10 29V11m10 29V11M10 9h16m-4 0h16M9 41h30" /><circle cx="34" cy="31" r="4" fill="var(--cr-accent)" stroke="none" /></>}
    {kind === 'trophy' && <><path d="M16 7h16v13c0 12-16 12-16 0ZM16 12H8v5c0 7 8 9 10 9m14-14h8v5c0 7-8 9-10 9M24 29v10m-8 3h16m-12-4h8" /></>}
  </svg>;
}
