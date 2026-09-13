'use client';
/**
 * Arena Rank card — bronze → diamond tier badge, points, progress to the next tier and the
 * floor-protection note. This card carries the screen's single "on this device" disclaimer.
 */
import { ShieldCheck } from 'lucide-react';
import { NumberCounter } from '@/components/fx';
import { RANK_TIERS, rankForPoints } from '@/lib/progression.mjs';
import { Meter, TierShield } from './shared';

type Tier = { id: string; label: string; min: number };
const TIERS = RANK_TIERS as ReadonlyArray<Tier>;
const tierLabel = (id: string) => TIERS.find((t) => t.id === id)?.label ?? id;

export function RankCard({ progression }: { progression: any }) {
  const rank = progression.rank;
  const info = rankForPoints(rank.points) as {
    tier: string;
    label: string;
    into: number;
    toNext: number;
    progress: number;
  };
  const index = Math.max(
    0,
    TIERS.findIndex((t) => t.id === info.tier),
  );
  const next = TIERS[index + 1] ?? null;
  return (
    <section className="fd-card" aria-labelledby="fd-rank-h">
      <span className="fd-card-label" id="fd-rank-h">
        <TierShieldIcon /> Arena Rank
      </span>
      <div className="fd-rank-top">
        <span className="fd-rank-badge" data-tier={info.tier} aria-hidden="true">
          <TierShield pips={index + 1} />
        </span>
        <span className="fd-rank-name">
          <strong>{info.label}</strong>
          <span>Best reached: {tierLabel(rank.best)}</span>
        </span>
      </div>
      <p className="fd-rank-points">
        <NumberCounter value={rank.points} />
        <small>PTS</small>
      </p>
      <Meter
        value={info.progress}
        tone="var(--fd-accent)"
        label={next ? `Progress to ${next.label}` : 'Top tier reached'}
      />
      <p className="fd-rank-foot" style={{ color: 'var(--muted)' }}>
        <ShieldCheck aria-hidden="true" />
        <span>
          {next ? `${Math.max(0, next.min - rank.points)} points to ${next.label}. ` : 'Top tier reached. '}
          Demotion protection holds you at {rank.floor} points, the {tierLabel(rank.best)} floor — a losing
          run never costs you a tier you have already earned.
        </span>
      </p>
      <p className="fd-disclaimer">Rank points are counted on this device and never verify skill.</p>
    </section>
  );
}

/* Tiny inline glyph for the card label (the big shield lives in the badge). */
function TierShieldIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M8 1.3 14 3.6v4.6c0 3.4-2.5 6.2-6 7.1-3.5-.9-6-3.7-6-7.1V3.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
