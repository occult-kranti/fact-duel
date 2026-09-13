'use client';
/**
 * useProgressionFeedback — turns progression state changes into feedback exactly once.
 *
 * Diffs `player.progression` between renders with `progressionDiff`, then:
 *  - toasts quests, quest bonuses, streak days, rank changes, cosmetics and expedition completions;
 *  - opens ceremonies for level-ups, achievements, rank-ups and streak milestones (queued by the
 *    FxProvider, one at a time) with a 3D medal in the slot;
 *  - stays completely quiet while a question is live (`quiet.toasts`) and defers ceremonies until the
 *    player is out of a room (`quiet.ceremonies`), flushing when the gate opens.
 * Round/match/fact XP is shown inline by the screens themselves (float text), so it is not toasted here.
 */
import { useEffect, useRef } from 'react';
import { useJuice } from '@/components/fx';
import { LazyRewardMedal } from '@/components/three';
import { achievementById, levelForXp, progressionDiff, RANK_TIERS } from '@/lib/progression.mjs';

type LogEntry = { id: string; at: number; kind: string; xp?: number; gems?: number; label?: string };
type Diff = ReturnType<typeof progressionDiff> & { logEntries: LogEntry[] };
type Quiet = { toasts: boolean; ceremonies: boolean };

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 50, 100]);
const TOASTED_KINDS = new Set(['quest', 'quests-bonus', 'streak', 'rank', 'cosmetic', 'expedition-complete']);

const rankTiers = RANK_TIERS as ReadonlyArray<{ id: string; label: string; min: number }>;
const rankLabel = (id: string) => rankTiers.find((t) => t.id === id)?.label ?? id;

export function useProgressionFeedback(progression: any, quiet: Quiet) {
  const juice = useJuice();
  const prev = useRef<any>(null);
  const toastQueue = useRef<LogEntry[]>([]);
  const ceremonyQueue = useRef<Array<() => void>>([]);
  const handled = useRef(new Set<string>());
  const streakCurrent = useRef<number | null>(null);

  // Diff on every progression change; queue the feedback.
  useEffect(() => {
    if (!progression) return;
    if (prev.current === null) {
      prev.current = progression;
      streakCurrent.current = progression.streak?.current ?? 0;
      return;
    }
    if (prev.current === progression) return;
    const diff = progressionDiff(prev.current, progression) as Diff;
    prev.current = progression;

    for (const entry of diff.logEntries) {
      if (handled.current.has(entry.id) || !TOASTED_KINDS.has(entry.kind)) continue;
      handled.current.add(entry.id);
      toastQueue.current.push(entry);
    }
    if (diff.leveledUp) {
      const { to } = diff.leveledUp;
      const info = levelForXp(progression.xp);
      ceremonyQueue.current.push(() =>
        juice.ceremony({
          kind: 'level',
          kicker: 'LEVEL UP',
          title: `Level ${to}`,
          subtitle: `${info.title} · keep the floodlights on`,
          rewards: [{ label: 'Gems', icon: '💎', value: `+${25 * (to - diff.leveledUp!.from)}` }],
          slot: <LazyRewardMedal variant="level" replayKey={to} size={1.1} />,
        }),
      );
    }
    for (const id of diff.newAchievements) {
      const a = achievementById(id) as
        | {
            id: string;
            name: string;
            description: string;
            tier: 'bronze' | 'silver' | 'gold';
            xp: number;
            gems: number;
          }
        | undefined;
      if (!a) continue;
      ceremonyQueue.current.push(() =>
        juice.ceremony({
          kind: 'achievement',
          kicker: `${a.tier.toUpperCase()} BADGE`,
          title: a.name,
          subtitle: a.description,
          rewards: [
            { label: 'XP', icon: '⚡', value: `+${a.xp}` },
            { label: 'Gems', icon: '💎', value: `+${a.gems}` },
          ],
          slot: <LazyRewardMedal variant="achievement" tier={a.tier} replayKey={a.id} />,
        }),
      );
    }
    if (diff.rankUp) {
      const { to } = diff.rankUp;
      ceremonyQueue.current.push(() =>
        juice.ceremony({
          kind: 'level',
          kicker: 'RANK UP',
          title: `${rankLabel(to)} tier`,
          subtitle: 'Arena Rank on this device. Your floor is protected from here.',
          slot: (
            <LazyRewardMedal
              variant="achievement"
              tier={to === 'diamond' || to === 'platinum' ? 'gold' : to === 'gold' ? 'gold' : 'silver'}
              replayKey={to}
            />
          ),
        }),
      );
    }
    const current = progression.streak?.current ?? 0;
    if (diff.streakChanged && current > (streakCurrent.current ?? 0) && STREAK_MILESTONES.has(current)) {
      ceremonyQueue.current.push(() =>
        juice.ceremony({
          kind: 'streak',
          kicker: 'STREAK MILESTONE',
          title: `${current} days`,
          subtitle:
            current >= 7
              ? 'A shield is yours for the next missed day.'
              : 'Come back tomorrow to keep it alight.',
          slot: <LazyRewardMedal variant="streak" replayKey={current} />,
        }),
      );
    }
    streakCurrent.current = current;
  }, [progression, juice]);

  // Flush when allowed.
  useEffect(() => {
    if (!quiet.toasts && toastQueue.current.length) {
      const entries = toastQueue.current.splice(0);
      for (const entry of entries) {
        const xp = entry.xp ? `+${entry.xp} XP` : '';
        const gems = entry.gems ? `${entry.gems > 0 ? '+' : '−'}${Math.abs(entry.gems)} gems` : '';
        const body = [xp, gems].filter(Boolean).join(' · ');
        const kind =
          entry.kind === 'quest' || entry.kind === 'quests-bonus'
            ? 'quest'
            : entry.kind === 'streak'
              ? 'streak'
              : entry.kind === 'cosmetic'
                ? 'gem'
                : entry.kind === 'rank'
                  ? 'achievement'
                  : 'xp';
        juice.toast({
          id: `prog:${entry.id}`,
          kind,
          title: entry.label || entry.kind,
          body: body || undefined,
        });
      }
    }
    if (!quiet.ceremonies && ceremonyQueue.current.length) {
      const open = ceremonyQueue.current.splice(0);
      for (const fn of open) fn();
    }
  }, [quiet.toasts, quiet.ceremonies, progression, juice]);
}
