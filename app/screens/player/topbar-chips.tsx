'use client';
/**
 * app/screens/player/topbar-chips.tsx — the three compact progression readouts for the shell top
 * bar (design bible §5 "Layout & mobile": brand, streak flame, level ring, settings).
 *
 *   import { StreakChip, LevelRing } from './screens/player/topbar-chips';
 *   <Topbar streak={<StreakChip progression={player.progression} />}
 *           level={<LevelRing progression={player.progression} level={player.level} />} />
 *
 * Each is a 32px-tall inline chip: no layout of its own, no state, safe on the server. They render
 * nothing at all when there is nothing to show (a fresh profile has no streak), so the
 * top bar stays quiet until the player has earned something.
 */
import { Flame } from 'lucide-react';
import { levelForXp } from '@/lib/progression.mjs';
import { ProgressRing } from './shared';
import './player.css';

type LevelInfo = { level: number; into: number; toNext: number; progress: number; title: string };
type ChipProps = { progression?: any };

/** Day streak. Dim when today has not been credited yet; hidden at zero. */
export function StreakChip({ progression }: ChipProps) {
  const current: number = progression?.streak?.current ?? 0;
  if (current <= 0) return null;
  return (
    <span
      className="fd-chip-top fd-chip-top--streak"
      data-lit={current > 0}
      title={`${current}-day streak on this device`}
    >
      <Flame aria-hidden="true" />
      <span className="fd-chip-label">{current}</span>
      <span className="sr-only">day streak</span>
    </span>
  );
}


/** Level ring: the XP progress into the current level, with the level number beside it. */
export function LevelRing({ progression, level }: ChipProps & { level?: LevelInfo }) {
  const info: LevelInfo = level ?? (levelForXp(progression?.xp ?? 0) as LevelInfo);
  return (
    <span
      className="fd-chip-top fd-chip-top--level"
      title={`Level ${info.level} · ${info.title} · ${info.into}/${info.toNext} XP`}
    >
      <ProgressRing className="fd-chip-ring" progress={info.progress} size={26} stroke={3} />
      <span className="fd-chip-value">{info.level}</span>
      <span className="fd-chip-label">{info.title}</span>
      <span className="sr-only">level</span>
    </span>
  );
}
