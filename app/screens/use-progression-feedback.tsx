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
 *
 * Nothing here decides how many pop-ups the player sees: every item is handed to the overlay budget
 * (`components/fx/overlay-budget.ts`), one request at a time, and the budget paces them — two on
 * screen at most, 1200 ms apart, a ceremony alone and ahead of any queued toast. The ceremony block
 * below runs BEFORE the toast block for the same reason: the headline of a burst should be asked
 * for first, so nothing has to be pulled off the screen to make room for it.
 *
 * What this file owns is the WORDS: when the budget merges a burst of same-kind toasts,
 * `mergeProgressToasts` writes the combined line ("+3 quests · 140 XP") from the `meta` each toast
 * carries. The count in that line is the number of entries of the HEADLINE KIND, never the number
 * of log rows, so the all-quests bonus can never be counted as a quest the player finished.
 *
 * `quiet.toasts` is also pushed down to the budget itself, so a live question silences every
 * overlay in the app — the wallet's, an expedition's, anyone's — not just the ones raised here.
 */
import { useEffect, useRef } from 'react';
import { useFx, useJuice, type ToastInput } from '@/components/fx';
import { LazyRewardMedal } from '@/components/three';
import { achievementById, levelForXp, progressionDiff, RANK_TIERS } from '@/lib/progression.mjs';
import { badgeLabel } from './events/util';

type LogEntry = {
  id: string;
  at: number;
  kind: string;
  xp?: number;
  label?: string;
  meta?: { badge?: string };
};
type Diff = ReturnType<typeof progressionDiff> & { logEntries: LogEntry[] };
type Quiet = { toasts: boolean; ceremonies: boolean };

/** The ceremony hero slot is a 132px circle; without this the medal canvas covers the card. */
const MEDAL_HEIGHT = 132;

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 50, 100]);
const TOASTED_KINDS = new Set([
  'quest',
  'quests-bonus',
  'streak',
  'rank',
  'cosmetic',
  'expedition-complete',
  'event',
]);

const rankTiers = RANK_TIERS as ReadonlyArray<{ id: string; label: string; min: number }>;
const rankLabel = (id: string) => rankTiers.find((t) => t.id === id)?.label ?? id;

/**
 * Which log kinds are allowed to collapse into one toast, and the noun their count reads with.
 * A rank move and a streak day are one-off moments and stay on their own line; three quests
 * finishing together are one sentence, not three pop-ups.
 *
 * `quests-bonus` has its OWN key on purpose. `lib/progression.mjs` awards it in the same reducer
 * call that completes the last daily quest, so the two always arrive in one burst: sharing a key
 * made a single finished quest read "+2 quests". The bonus is a one-off like rank and streak, and
 * on its own it keeps its real label ("All daily quests complete") — a group of one never merges.
 *
 * Exported so `tests/overlay-budget.test.mjs` can pin that split against the shipped table.
 */
export const MERGE_GROUPS: Record<string, { key: string; one: string; many: string }> = {
  quest: { key: 'quest', one: 'quest', many: 'quests' },
  'quests-bonus': { key: 'quest-bonus', one: 'bonus', many: 'bonuses' },
  cosmetic: { key: 'cosmetic', one: 'unlock', many: 'unlocks' },
  event: { key: 'event', one: 'badge', many: 'badges' },
  'expedition-complete': { key: 'expedition', one: 'expedition', many: 'expeditions' },
};

type MergeMeta = { xp?: number; one?: string; many?: string; label?: string; kind?: string };

/**
 * The merge copy. The budget groups a burst and hands the whole group back; these are the words.
 * Three quests worth 60, 50 and 30 XP become one toast: "+3 quests · 140 XP", with the first two
 * quest names underneath and the rest counted. Only real numbers appear — the XP is summed from
 * the log entries that actually landed, and the COUNT is the number of entries whose kind matches
 * the one the noun names (the group's first item), never the number of rows in the group. A
 * headline that says "+3 quests" when the player finished two is a fabricated number.
 *
 * Exported for `tests/overlay-budget.test.mjs`, which runs the shipped function.
 */
export function mergeProgressToasts(items: ToastInput[]): ToastInput {
  const head = items[0];
  const metas = items.map((i) => (i.meta ?? {}) as MergeMeta);
  const xp = metas.reduce((sum, m) => sum + (typeof m.xp === 'number' ? m.xp : 0), 0);
  const kind = metas[0].kind;
  const n = kind ? metas.filter((m) => m.kind === kind).length : items.length;
  const noun = (n === 1 ? metas[0].one : metas[0].many) ?? 'rewards';
  const labels = metas.map((m, i) => m.label ?? items[i].title).filter(Boolean);
  const shown = labels.slice(0, 2).join(' · ');
  const more = labels.length - 2;
  return {
    ...head,
    title: xp > 0 ? `+${n} ${noun} · ${xp} XP` : `+${n} ${noun}`,
    body: (more > 0 ? `${shown} · +${more} more` : shown) || undefined,
  };
}

export function useProgressionFeedback(progression: any, quiet: Quiet) {
  const juice = useJuice();
  const setOverlaysQuiet = useFx()?.setQuiet;
  const prev = useRef<any>(null);
  const toastQueue = useRef<LogEntry[]>([]);
  // Each entry is one candidate ceremony. A single reward burst (level + badge + rank at the end of
  // a match) shows only the most significant one; the rest arrive as toasts, so the player is never
  // walked through a stack of full-screen modals.
  const ceremonyQueue = useRef<Array<{ rank: number; open: () => void; toast: ToastInput }>>([]);
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
      ceremonyQueue.current.push({
        rank: 3,
        toast: { kind: 'xp', title: `Level ${to}`, body: info.title },
        open: () =>
          juice.ceremony({
            kind: 'level',
            kicker: 'LEVEL UP',
            title: `Level ${to}`,
            subtitle: `${info.title} · keep the floodlights on`,
            slot: <LazyRewardMedal variant="level" replayKey={to} size={1.1} height={MEDAL_HEIGHT} />,
          }),
      });
    }
    for (const id of diff.newAchievements) {
      const a = achievementById(id) as
        | {
            id: string;
            name: string;
            description: string;
            tier: 'bronze' | 'silver' | 'gold';
            xp: number;
          }
        | undefined;
      if (!a) continue;
      ceremonyQueue.current.push({
        rank: 2,
        toast: { kind: 'achievement', title: a.name, body: a.description },
        open: () =>
          juice.ceremony({
            kind: 'achievement',
            kicker: `${a.tier.toUpperCase()} BADGE`,
            title: a.name,
            subtitle: a.description,
            rewards: [{ label: 'XP', icon: '⚡', value: `+${a.xp}` }],
            slot: (
              <LazyRewardMedal variant="achievement" tier={a.tier} replayKey={a.id} height={MEDAL_HEIGHT} />
            ),
          }),
      });
    }
    if (diff.rankUp) {
      const { to } = diff.rankUp;
      ceremonyQueue.current.push({
        rank: 1,
        toast: { kind: 'achievement', title: `${rankLabel(to)} tier`, body: 'Arena Rank, on this device' },
        open: () =>
          juice.ceremony({
            kind: 'level',
            kicker: 'RANK UP',
            title: `${rankLabel(to)} tier`,
            subtitle: 'Arena Rank on this device. Your floor is protected from here.',
            slot: (
              <LazyRewardMedal
                variant="achievement"
                tier={to === 'bronze' || to === 'silver' ? 'silver' : 'gold'}
                replayKey={to}
              />
            ),
          }),
      });
    }
    const current = progression.streak?.current ?? 0;
    if (diff.streakChanged && current > (streakCurrent.current ?? 0) && STREAK_MILESTONES.has(current)) {
      ceremonyQueue.current.push({
        rank: 0,
        toast: { kind: 'streak', title: `${current}-day streak`, body: 'Keep it alight tomorrow' },
        open: () =>
          juice.ceremony({
            kind: 'streak',
            kicker: 'STREAK MILESTONE',
            title: `${current} days`,
            subtitle:
              current >= 7
                ? 'A shield is yours for the next missed day.'
                : 'Come back tomorrow to keep it alight.',
            slot: <LazyRewardMedal variant="streak" replayKey={current} height={MEDAL_HEIGHT} />,
          }),
      });
    }
    streakCurrent.current = current;
  }, [progression, juice]);

  // A live question silences every overlay in the app, not only the ones raised here.
  useEffect(() => {
    setOverlaysQuiet?.(quiet.toasts);
  }, [setOverlaysQuiet, quiet.toasts]);

  // Hand what is waiting to the budget when the gate opens. The budget decides the pacing from here.
  // The ceremony goes FIRST: leaving a room lifts both gates in one commit, and whichever block
  // asks first is what the player sees first. The headline of a burst is the ceremony, so it takes
  // the budget before its own footnotes do — the budget would otherwise have to pull a toast back
  // off the screen to make room for it.
  useEffect(() => {
    if (!quiet.ceremonies && ceremonyQueue.current.length) {
      const pending = ceremonyQueue.current.splice(0);
      pending.sort((a, b) => b.rank - a.rank);
      const [headline, ...rest] = pending;
      headline.open();
      for (const item of rest) juice.toast({ ...item.toast, silent: true });
    }
    if (!quiet.toasts && toastQueue.current.length) {
      const entries = toastQueue.current.splice(0);
      for (const entry of entries) {
        const body = entry.xp ? `+${entry.xp} XP` : '';
        const kind =
          entry.kind === 'quest' || entry.kind === 'quests-bonus'
            ? 'quest'
            : entry.kind === 'streak'
              ? 'streak'
              : entry.kind === 'cosmetic' || entry.kind === 'rank' || entry.kind === 'event'
                ? 'achievement'
                : 'xp';
        // A cleared limited mode leads with the badge it minted; the log label becomes the body.
        const badge = entry.kind === 'event' && entry.meta?.badge ? badgeLabel(entry.meta.badge) : '';
        const group = MERGE_GROUPS[entry.kind];
        const title = badge ? `${badge} badge` : entry.label || entry.kind;
        juice.toast({
          id: `prog:${entry.id}`,
          kind,
          title,
          body: (badge ? [entry.label, body].filter(Boolean).join(' · ') : body) || undefined,
          // Same-kind entries from one burst collapse into a single pop-up; `meta` is what
          // `mergeProgressToasts` counts and sums when they do.
          mergeKey: group ? `prog:${group.key}` : undefined,
          meta: group
            ? { xp: entry.xp ?? 0, one: group.one, many: group.many, label: title, kind: entry.kind }
            : undefined,
          merge: group ? mergeProgressToasts : undefined,
        });
      }
    }
  }, [quiet.toasts, quiet.ceremonies, progression, juice]);
}

/**
 * Renders nothing; exists so the hook runs *inside* `<FxProvider>`. Called from outside it,
 * `useJuice()` falls back to the event bus, which cannot carry a React `slot`, and every ceremony
 * loses its 3D medal.
 */
export function ProgressionFeedback({ progression, quiet }: { progression: any; quiet: Quiet }) {
  useProgressionFeedback(progression, quiet);
  return null;
}
