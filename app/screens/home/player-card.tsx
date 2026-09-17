'use client';
/**
 * app/screens/home/player-card.tsx — the ownership half of the hero row.
 * Monogram avatar in the equipped frame, level + title, an XP meter that fills on mount, and the
 * three numbers the daily loop runs on: streak (magenta), badges earned (gold) and the Arena Rank chip.
 */
import { Award, ChevronRight, Flame, Shield, Trophy } from 'lucide-react';
import { NumberCounter } from '@/components/fx';
import { cosmeticById } from '@/lib/progression.mjs';
import { FRAME_LABELS } from './util';
import { usePress } from './press';
import { useLocale } from '../../use-locale';

export type PlayerCardProps = {
  name: string;
  level: { level: number; into: number; toNext: number; progress: number; title: string };
  streak: { current: number; shields: number };
  /** Achievements earned on this device. */
  badges: number;
  rank: { label: string; tier: string; into: number; toNext: number; progress: number };
  points: number;
  frame: string;
  accentToken: string;
  titleId: string;
  onOpen: () => void;
};

export function PlayerCard({
  name,
  level,
  streak,
  badges,
  rank,
  points,
  frame,
  accentToken,
  titleId,
  onOpen,
}: PlayerCardProps) {
  const { t, n, fmt } = useLocale();
  const press = usePress();
  const monogram = (name.trim().charAt(0) || 'P').toUpperCase();
  const badge = cosmeticById(titleId);
  const pct = Math.round(Math.min(1, Math.max(0, level.progress)) * 100);
  return (
    <button
      type="button"
      className="fd-hub-player-card fd-hub-press"
      data-frame={frame}
      style={{ ['--fd-accent' as string]: accentToken }}
      onPointerDown={press}
      onClick={onOpen}
      aria-label={t('card.aria', { level: level.level, title: level.title, streak: streak.current, badges, rank: rank.label })}
    >
      <span className="fd-hub-player-top">
        <span className="fd-hub-avatar" aria-hidden="true">
          <span className="fd-hub-avatar-mono">{monogram}</span>
        </span>
        <span className="fd-hub-player-id">
          <strong className="fd-hub-player-name">{name || t('card.player')}</strong>
          <span className="fd-hub-player-sub">{t('card.level', { level: level.level, title: level.title })}</span>
          {badge && badge.id !== 'challenger' && <span className="fd-hub-player-badge">{badge.name}</span>}
        </span>
        <ChevronRight className="fd-hub-player-go" aria-hidden="true" />
      </span>

      <span className="fd-hub-xp">
        <span className="fd-hub-xp-head">
          <span className="fd-hub-xp-label">{t('card.xpTo', { level: level.level + 1 })}</span>
          <span className="fd-hub-xp-value fd-mono">
            <NumberCounter value={level.into} from={0} duration={1100} />
            <i>/{fmt.number(level.toNext)}</i>
          </span>
        </span>
        <span
          className="fd-hub-meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={level.toNext}
          aria-valuenow={level.into}
          aria-label={t('card.xpAria', { level: level.level + 1 })}
        >
          <i className="fd-hub-meter-fill" style={{ width: `${pct}%` }} />
        </span>
      </span>

      <span className="fd-hub-player-stats">
        <span className="fd-hub-stat fd-hub-stat--streak">
          <Flame aria-hidden="true" />
          <b className="fd-mono">{streak.current}</b>
          <small>{t('card.dayStreak')}</small>
          {streak.shields > 0 && (
            <span className="fd-hub-shields" title={n('card.shields', streak.shields)}>
              {Array.from({ length: streak.shields }, (_, i) => (
                <Shield key={i} aria-hidden="true" />
              ))}
              <em>{streak.shields}</em>
            </span>
          )}
        </span>
        <span className="fd-hub-stat fd-hub-stat--badges">
          <Award aria-hidden="true" />
          <b className="fd-mono">
            <NumberCounter value={badges} from={0} duration={900} />
          </b>
          <small>{t('card.badges')}</small>
        </span>
        <span className="fd-hub-stat fd-hub-stat--rank">
          <Trophy aria-hidden="true" />
          <b>{rank.label}</b>
          <small className="fd-mono">{t('card.pts', { n: points })}</small>
        </span>
      </span>
      {frame !== 'default' && (
        <span className="fd-hub-frame-name">{FRAME_LABELS[frame] ?? t('card.frame')}</span>
      )}
    </button>
  );
}
