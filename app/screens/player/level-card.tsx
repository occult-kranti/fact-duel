'use client';
/**
 * Level card — the ownership piece of the Player screen (design bible 10.5).
 * Monogram avatar inside the equipped frame, the SVG level ring, the band title from
 * LEVEL_TITLES, and the XP bar with a counting total and the goal-gradient line
 * ("N XP to level M"). The equipped banner tints the card; the equipped accent drives
 * every highlight through --fd-accent.
 */
import { Sparkles } from 'lucide-react';
import { NumberCounter } from '@/components/fx';
import { cosmeticById } from '@/lib/progression.mjs';
import { Meter, ProgressRing } from './shared';

type LevelInfo = { level: number; into: number; toNext: number; progress: number; title: string };

/** Up to two initials from the player's name; "FD" when they have not named themselves yet. */
export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return 'FD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function LevelCard({
  progression,
  level,
  name,
}: {
  progression: any;
  level: LevelInfo;
  name: string;
}) {
  const equipped = progression.cosmetics.equipped;
  const title = cosmeticById(equipped.title) as { name: string } | undefined;
  const frame = cosmeticById(equipped.frame) as { name: string } | undefined;
  const banner = cosmeticById(equipped.banner) as { name: string } | undefined;
  const remaining = Math.max(0, level.toNext - level.into);
  const display = name.trim() || 'Your player card';
  // The shell's default player name is "Challenger", which is also the default title cosmetic:
  // show the title chip only when it says something the name does not.
  const titleName = title?.name ?? '';
  const showTitle = !!titleName && titleName.toLowerCase() !== display.toLowerCase();
  const c = progression.counters;
  const record: [string, number][] = [
    ['Duels', c.matches],
    ['Wins', c.wins],
    ['Facts met', c.facts],
  ];
  return (
    <section className="fd-card fd-levelcard" data-banner={equipped.banner} aria-labelledby="fd-level-name">
      <div className="fd-levelcard-top">
        <div className="fd-avatar" data-frame={equipped.frame}>
          <ProgressRing className="fd-avatar-ring" progress={level.progress} size={104} stroke={5} />
          <span className="fd-avatar-disc" aria-hidden="true">
            {monogram(name)}
          </span>
          <span className="fd-avatar-badge" aria-hidden="true">
            {level.level}
          </span>
        </div>
        <div className="fd-levelcard-id">
          <p className="fd-eyebrow">
            LEVEL {level.level} · {level.title.toUpperCase()}
          </p>
          <h2 id="fd-level-name">{display}</h2>
          {showTitle && (
            <span className="fd-levelcard-title">
              <Sparkles aria-hidden="true" />
              {titleName}
            </span>
          )}
          <p className="fd-levelcard-sub">
            {frame?.name ?? 'Standard'} frame · {banner?.name ?? 'Midnight'} banner
          </p>
        </div>
      </div>
      <div className="fd-xp">
        <div className="fd-xp-row">
          <b>
            <NumberCounter value={progression.xp} /> XP
          </b>
          <span>
            {level.into.toLocaleString()} / {level.toNext.toLocaleString()} into level {level.level}
          </span>
        </div>
        <Meter value={level.progress} label={`Level ${level.level} progress`} />
        <div className="fd-xp-row">
          <span>
            {remaining.toLocaleString()} XP to level {level.level + 1}
          </span>
          <span>{Math.round(level.progress * 100)}%</span>
        </div>
      </div>
      <dl className="fd-record">
        {record.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <NumberCounter value={value ?? 0} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
