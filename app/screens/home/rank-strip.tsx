'use client';
/**
 * app/screens/home/rank-strip.tsx — Arena Rank at a glance.
 * Tier, points, distance to the next tier, and the screen's single honesty line: rank is a
 * device-local record, not a leaderboard position.
 */
import { Trophy } from 'lucide-react';
import { NumberCounter } from '@/components/fx';
import { RANK_TIERS } from '@/lib/progression.mjs';

type Tier = { id: string; label: string; min: number };
const TIERS = RANK_TIERS as readonly Tier[];

export type RankStripProps = {
  points: number;
  rank: { tier: string; label: string; into: number; toNext: number; progress: number };
};

export function RankStrip({ points, rank }: RankStripProps) {
  const next: Tier | null = TIERS[TIERS.findIndex((t) => t.id === rank.tier) + 1] ?? null;
  const pct = Math.round(Math.min(1, Math.max(0, rank.progress)) * 100);
  return (
    <section className="fd-hub-rank" aria-labelledby="fd-hub-rank-title">
      <div className="fd-hub-rank-badge" data-tier={rank.tier} aria-hidden="true">
        <Trophy />
      </div>
      <div className="fd-hub-rank-body">
        <div className="fd-hub-rank-head">
          <h2 id="fd-hub-rank-title">
            {rank.label} <span>Arena Rank</span>
          </h2>
          <span className="fd-hub-rank-points fd-mono">
            <NumberCounter value={points} from={0} duration={900} /> pts
          </span>
        </div>
        <div
          className="fd-hub-meter fd-hub-meter--rank"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={rank.toNext || 1}
          aria-valuenow={rank.into}
          aria-label={next ? `Progress to ${next.label}` : 'Top tier reached'}
        >
          <i className="fd-hub-meter-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="fd-hub-rank-note">
          {next ? (
            <>
              <b className="fd-mono">{Math.max(0, rank.toNext - rank.into)}</b> points to {next.label}.
            </>
          ) : (
            <>Top tier held.</>
          )}{' '}
          Rank and XP are kept on this device.
        </p>
      </div>
    </section>
  );
}
