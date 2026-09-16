'use client';
/**
 * app/screens/home/activity.tsx — the bento row: what you just earned, and what you have kept.
 * Left: the last five XP log entries with relative stamps. Right: the three most recent stamps.
 */
import {
  Award,
  BookOpen,
  Bookmark,
  Brain,
  Compass,
  Flag,
  Flame,
  Gift,
  Map,
  Palette,
  ScrollText,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { TOPIC_STYLE } from '../../collections';
import { relativeTime } from './util';
import { usePress } from './press';

export type LogEntry = { id: string; at: number; kind: string; xp: number; label: string };

const LOG_ICON: Record<string, LucideIcon> = {
  round: Zap,
  match: Swords,
  discovery: Compass,
  'expedition-answer': Map,
  'expedition-complete': Flag,
  fact: ScrollText,
  open: BookOpen,
  recall: Brain,
  save: Bookmark,
  streak: Flame,
  quest: Target,
  'quests-bonus': Gift,
  level: Sparkles,
  achievement: Award,
  rank: Trophy,
  cosmetic: Palette,
};
/** Temperature per log kind: rewards gold, streak magenta, competition ember, learning cyan. */
const LOG_TONE: Record<string, string> = {
  round: 'ember',
  match: 'ember',
  rank: 'ember',
  discovery: 'cyan',
  'expedition-answer': 'cyan',
  'expedition-complete': 'cyan',
  fact: 'cyan',
  open: 'cyan',
  recall: 'cyan',
  save: 'cyan',
  streak: 'magenta',
  quest: 'gold',
  'quests-bonus': 'gold',
  level: 'gold',
  achievement: 'gold',
  cosmetic: 'gold',
};

export function XpLog({ entries, now }: { entries: LogEntry[]; now: number }) {
  return (
    <section className="fd-hub-log" aria-labelledby="fd-hub-log-title">
      <header className="fd-hub-section-head fd-hub-section-head--tight">
        <div>
          <p className="fd-hub-eyebrow">
            <Zap aria-hidden="true" />
            RECENT XP
          </p>
          <h2 id="fd-hub-log-title">Your last five moves.</h2>
        </div>
      </header>
      {entries.length === 0 ? (
        <p className="fd-hub-empty">Answer one question and the record starts here.</p>
      ) : (
        <ul className="fd-hub-log-list">
          {entries.map((e) => {
            const Icon = LOG_ICON[e.kind] ?? Zap;
            return (
              <li key={e.id} data-tone={LOG_TONE[e.kind] ?? 'ember'}>
                <span className="fd-hub-log-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="fd-hub-log-label">{e.label}</span>
                <span className="fd-hub-log-gain fd-mono">
                  {e.xp > 0 && <b>+{e.xp} XP</b>}
                </span>
                <time className="fd-hub-log-time" dateTime={new Date(e.at).toISOString()}>
                  {now ? relativeTime(e.at, now) : ''}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export type StampRoute = {
  id: string;
  key: string;
  code: string;
  topic: string;
  domain: string;
  stamp: string;
};

export function StampShelf({
  stamps,
  total,
  earnedCount,
  onOpen,
  onAll,
}: {
  stamps: { route: StampRoute; correct: number | null }[];
  total: number;
  earnedCount: number;
  onOpen: (id: string) => void;
  onAll: () => void;
}) {
  const press = usePress();
  return (
    <section className="fd-hub-stamps" aria-labelledby="fd-hub-stamps-title">
      <header className="fd-hub-section-head fd-hub-section-head--tight">
        <div>
          <p className="fd-hub-eyebrow fd-hub-eyebrow--cool">
            <Compass aria-hidden="true" />
            STAMP CASE
          </p>
          <h2 id="fd-hub-stamps-title">
            {earnedCount ? `${earnedCount} of ${total} stories collected.` : 'Every route leaves a mark.'}
          </h2>
        </div>
      </header>
      <ul className="fd-hub-stamp-row">
        {stamps.map(({ route, correct }) => {
          const Icon = TOPIC_STYLE[route.topic]?.icon ?? Compass;
          return (
            <li key={route.key}>
              <button
                type="button"
                className="fd-hub-stamp fd-hub-press"
                data-domain={route.domain}
                data-earned={correct !== null || undefined}
                onPointerDown={press}
                onClick={() => onOpen(route.id)}
              >
                <Icon aria-hidden="true" />
                <span className="fd-mono">{route.code}</span>
                <small>{correct !== null ? `${correct}/6 first run` : 'Not yet earned'}</small>
                <span className="fd-hub-sr">{route.stamp}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="fd-hub-quiet fd-hub-press" onPointerDown={press} onClick={onAll}>
        All {total} expeditions
      </button>
    </section>
  );
}
