'use client';
/**
 * Shared Expeditions primitives — the "field notes" vocabulary.
 *
 * Everything here is drawn from gradients, hairlines and inline SVG: no image assets. The surface
 * is the COOL learning temperature (cyan accent, gold only for an earned stamp).
 */
import { useCallback, useId } from 'react';
import { ArrowRight, Check, Compass, Flame, Shield } from 'lucide-react';
import { useJuice } from '@/components/fx';
import { EXPEDITIONS, expeditionStatus } from '@/lib/expeditions.mjs';
import { TOPIC_STYLE } from '../../collections';

export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** Press feedback for any pressable element: tap cue + light haptic on pointerdown. */
export function useTap() {
  const juice = useJuice();
  return useCallback(() => {
    juice.sound('tap');
    juice.haptic('light');
  }, [juice]);
}

/* ---------------------------------------------------------------- route art */
const ART_W = 320;
const ART_H = 132;
const CAMP_X = [26, 118, 210, 294];

/** Deterministic 0..1 sequence (mulberry32) so server and client draw the same map. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function geometry(route: any) {
  const index = Math.max(0, EXPEDITIONS.findIndex((r: any) => r.id === route.id));
  const rand = seeded(index * 2654435761 + 1013904223);
  // Kept inside the middle band so a `slice` crop on wide hero panels never loses a camp.
  const ys = CAMP_X.map(() => 40 + rand() * 52);
  let path = `M ${CAMP_X[0]} ${ys[0].toFixed(1)}`;
  for (let i = 1; i < CAMP_X.length; i++) {
    const mid = (CAMP_X[i - 1] + CAMP_X[i]) / 2;
    path += ` C ${mid} ${ys[i - 1].toFixed(1)} ${mid} ${ys[i].toFixed(1)} ${CAMP_X[i]} ${ys[i].toFixed(1)}`;
  }
  const contours = [0, 1, 2, 3, 4].map((k) => {
    const base = 6 + k * 27 + rand() * 8;
    const a = (rand() - 0.5) * 26;
    const b = (rand() - 0.5) * 26;
    return `M -12 ${(base + 14).toFixed(1)} C 70 ${(base + a).toFixed(1)}, 150 ${(base + 24 + b).toFixed(
      1,
    )}, 226 ${(base + 6).toFixed(1)} S 312 ${(base - 6).toFixed(1)}, 336 ${(base + 12).toFixed(1)}`;
  });
  return { path, ys, contours };
}

/** Procedural route map: contour lines, a dashed route and three camps. */
export function RouteArt({ route, cursor = 0, className }: { route: any; cursor?: number; className?: string }) {
  const gid = `fdexp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { path, ys, contours } = geometry(route);
  return (
    <svg
      className={`fd-exp-art${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <rect width={ART_W} height={ART_H} fill={`url(#${gid})`} />
      <g className="fd-exp-art-contours">
        {contours.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path className="fd-exp-art-route" d={path} />
      <circle className="fd-exp-art-start" cx={CAMP_X[0]} cy={ys[0]} r="4" />
      {[1, 2, 3].map((i) => (
        <g key={i} className={`fd-exp-art-camp${cursor >= i * 2 ? ' is-done' : ''}`}>
          <circle className="fd-exp-art-camp-ring" cx={CAMP_X[i]} cy={ys[i]} r="7.5" />
          <circle className="fd-exp-art-camp-core" cx={CAMP_X[i]} cy={ys[i]} r="3.2" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------- stamp */
export function ExpeditionStamp({ route, earned = false }: { route: any; earned?: boolean }) {
  const Icon = TOPIC_STYLE[route.topic]?.icon || Compass;
  return (
    <span className={`fd-exp-stamp ${route.domain}${earned ? ' earned' : ''}`} aria-hidden="true">
      <Icon />
      <span>{route.code}</span>
    </span>
  );
}

/* -------------------------------------------------------------- route rail */
/** Chapter progress. `list` = the brief's chapter list, `rail` = the run's map-like line. */
export function RouteRail({
  route,
  cursor = 0,
  variant = 'list',
}: {
  route: any;
  cursor?: number;
  variant?: 'list' | 'rail';
}) {
  return (
    <ol className={`fd-exp-rail fd-exp-rail--${variant}`} aria-label="Expedition chapters">
      {route.chapters.map((title: string, i: number) => {
        const done = cursor >= (i + 1) * 2;
        const current = !done && Math.floor(cursor / 2) === i;
        return (
          <li
            key={title}
            className={done ? 'is-done' : current ? 'is-current' : ''}
            aria-current={current ? 'step' : undefined}
          >
            <span className="fd-exp-rail-camp">
              {done ? <Check size={15} aria-hidden="true" /> : <span>{i + 1}</span>}
            </span>
            <span className="fd-exp-rail-text">
              <strong>{title}</strong>
              <small>
                {done
                  ? variant === 'rail'
                    ? 'Reached'
                    : `Camp ${i + 1} reached`
                  : current
                    ? cursor === 0
                      ? variant === 'rail'
                        ? 'You are here'
                        : 'Starts here · 2 cards'
                      : `Card ${(cursor % 2) + 1} of 2`
                    : variant === 'rail'
                      ? '2 cards'
                      : '2 cards ahead'}
              </small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------- route card */
export function EpisodeCard({ route, record, onOpen }: { route: any; record: any; onOpen: () => void }) {
  const tap = useTap();
  const status = expeditionStatus(record);
  const cursor = record?.run?.cursor || 0;
  const Icon = TOPIC_STYLE[route.topic]?.icon || Compass;
  const best = record?.best?.score ?? record?.first?.score ?? 0;
  const statusLabel =
    status === 'continue' ? `Continue ${cursor}/6` : status === 'complete' ? 'Stamped' : 'New';
  return (
    <button type="button" className={`fd-exp-card is-${status}`} onPointerDown={tap} onClick={onOpen}>
      <span className="fd-exp-card-art">
        <RouteArt route={route} cursor={cursor} />
        <span className="fd-exp-card-code">{route.code}</span>
        <span className="fd-exp-card-flag">
          <Icon size={14} aria-hidden="true" />
          {route.topic}
        </span>
      </span>
      <span className="fd-exp-card-body">
        <span className="fd-exp-card-title">{route.title}</span>
        <span className="fd-exp-card-sub">{route.subtitle}</span>
        <span className="fd-exp-camps" aria-hidden="true">
          {route.chapters.map((title: string, i: number) => {
            const filled = Math.max(0, Math.min(2, cursor - i * 2));
            return (
              <span
                key={title}
                className={`fd-exp-camp${filled === 2 ? ' is-done' : filled > 0 ? ' is-current' : ''}`}
              >
                <span className="fd-exp-camp-track">
                  <span style={{ width: `${(filled / 2) * 100}%` }} />
                </span>
                <span className="fd-exp-camp-label">{title}</span>
              </span>
            );
          })}
        </span>
        <span className="fd-exp-card-foot">
          <span className={`fd-exp-status is-${status}`}>
            <span className="fd-exp-status-dot" aria-hidden="true" />
            {statusLabel}
            {status === 'complete' && <em>best {signed(best)}</em>}
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------ scoring cards */
/** The two stake rules as two clear cards (bible 10.4). */
export function ScoringCards({ active }: { active?: string }) {
  return (
    <div className="fd-exp-stakes">
      <div className={`fd-exp-stake fd-exp-stake--steady${active === 'steady' ? ' is-active' : ''}`}>
        <span className="fd-exp-stake-top">
          <Shield size={17} aria-hidden="true" />
          Steady
        </span>
        <span className="fd-exp-stake-score">
          <strong>+2</strong> correct
        </span>
        <span className="fd-exp-stake-score">
          <strong>0</strong> wrong
        </span>
        <p>Bank the safe points. Nothing to lose.</p>
      </div>
      <div className={`fd-exp-stake fd-exp-stake--bold${active === 'bold' ? ' is-active' : ''}`}>
        <span className="fd-exp-stake-top">
          <Flame size={17} aria-hidden="true" />
          Bold
        </span>
        <span className="fd-exp-stake-score">
          <strong>+3</strong> correct
        </span>
        <span className="fd-exp-stake-score">
          <strong>−1</strong> wrong
        </span>
        <p>Back yourself. Your run total can go below zero.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- answer shape */
const SHAPE_PATH = [
  'M12 3.2 21.2 20.4H2.8Z', // 1 triangle
  'M12 2.4 21.6 12 12 21.6 2.4 12Z', // 2 diamond
  '', // 3 circle
  'M4.2 4.2h15.6v15.6H4.2Z', // 4 square
];
export function AnswerShape({ index }: { index: number }) {
  return (
    <svg className="fd-exp-shape" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {index === 2 ? <circle cx="12" cy="12" r="8.8" /> : <path d={SHAPE_PATH[index] || SHAPE_PATH[3]} />}
    </svg>
  );
}

/* --------------------------------------------------------- stamp case (player) */
export function ExpeditionCase({ player, onOpen }: { player: any; onOpen: (id: string) => void }) {
  const tap = useTap();
  const journeys = player.profile.journeys || {};
  const earned = EXPEDITIONS.filter((r: any) => journeys[r.key]?.first).length;
  return (
    <section className="fd-exp fd-exp-case">
      <div className="fd-exp-head">
        <div>
          <p className="fd-exp-eyebrow">COLLECTED STORIES</p>
          <h2>Your expedition stamps.</h2>
        </div>
        <span className="fd-exp-count">
          <strong>{earned}</strong> / 9
        </span>
      </div>
      <p className="fd-exp-note">
        Earned for completing a route. Scores describe local practice; stamps do not certify expertise.
      </p>
      <div className="fd-exp-case-grid">
        {EXPEDITIONS.map((route: any) => {
          const record = journeys[route.key];
          return (
            <button
              type="button"
              key={route.key}
              className={record?.first ? 'is-earned' : ''}
              onPointerDown={tap}
              onClick={() => onOpen(route.id)}
            >
              <ExpeditionStamp route={route} earned={!!record?.first} />
              <strong>{route.stamp}</strong>
              <small>
                {record?.first
                  ? `First run ${record.first.correct}/6 correct · ${signed(record.first.score)} pts`
                  : 'Finish this expedition'}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
