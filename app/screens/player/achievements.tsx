'use client';
/**
 * Achievements gallery — every entry of ACHIEVEMENTS as a badge tile in its bronze / silver / gold
 * finish. Unlocked tiles carry the date they were earned. Locked tiles are silhouettes, but not
 * thirty identical grey discs: the rim and the medal take the badge's tier, and every countable
 * badge shows how close you are ("12 / 50 wins") straight from `progression.counters`, which is
 * the goal-gradient half of Octalysis drive 2. Hidden-and-locked tiles stay "???" — no name, no
 * description and no progress — so the surprise survives.
 */
import { useMemo, useState } from 'react';
import { TOPIC_DOMAINS } from '@/lib/journal.mjs';
import { ACHIEVEMENTS, levelForXp } from '@/lib/progression.mjs';
import { BadgeMedal, Meter, usePress } from './shared';

type Achievement = {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  xp: number;
  gems: number;
  hidden: boolean;
};
const ALL = ACHIEVEMENTS as ReadonlyArray<Achievement>;
type Filter = 'all' | 'unlocked' | 'locked';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unlocked', label: 'Unlocked' },
  { id: 'locked', label: 'Locked' },
];

const dateFormat = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/* How far along a countable badge is. The numbers mirror the predicates in lib/progression.mjs —
 * this reads the same counters they do, and nothing here can grant or change a badge. Badges whose
 * rule is not a running total (a comeback, a sub-1.5 s answer, an hour of the day) are absent on
 * purpose: a bar would have to invent a number. One-shot rules (target 1) are absent too — the
 * tile already says what to do. */
const domains = TOPIC_DOMAINS as Record<string, string>;
/** Only the slice of a progression these goals read. */
type Progression = {
  xp: number;
  wallet: { lifetimeGems: number };
  streak: { best: number };
  counters: {
    wins: number;
    bestCombo: number;
    stamps: number;
    facts: number;
    saves: number;
    opens: number;
    questsDone: number;
    byTopic: Record<string, { correct: number }>;
    byMode: Record<string, { played: number }>;
  };
};
const domainCorrect = (p: Progression, domain: string) =>
  Object.entries(p.counters.byTopic).reduce(
    (n, [topic, t]) => (domains[topic] === domain ? n + t.correct : n),
    0,
  );
const GOALS: Record<string, { target: number; unit: string; value: (p: Progression) => number }> = {
  'wins-10': { target: 10, unit: 'wins', value: (p) => p.counters.wins },
  'wins-50': { target: 50, unit: 'wins', value: (p) => p.counters.wins },
  'wins-200': { target: 200, unit: 'wins', value: (p) => p.counters.wins },
  'streak-3': { target: 3, unit: 'day streak', value: (p) => p.streak.best },
  'streak-7': { target: 7, unit: 'day streak', value: (p) => p.streak.best },
  'streak-30': { target: 30, unit: 'day streak', value: (p) => p.streak.best },
  'combo-3': { target: 3, unit: 'best combo', value: (p) => p.counters.bestCombo },
  'combo-5': { target: 5, unit: 'best combo', value: (p) => p.counters.bestCombo },
  'mode-tour': {
    target: 3,
    unit: 'modes played',
    value: (p) => Object.values(p.counters.byMode).filter((m) => m.played > 0).length,
  },
  'all-routes': { target: 9, unit: 'stamps', value: (p) => p.counters.stamps },
  'scholar-50': { target: 50, unit: 'facts met', value: (p) => p.counters.facts },
  'scholar-200': { target: 200, unit: 'facts met', value: (p) => p.counters.facts },
  'vault-25': { target: 25, unit: 'saved', value: (p) => p.counters.saves },
  'curious-25': { target: 25, unit: 'explanations', value: (p) => p.counters.opens },
  'sports-fan': { target: 50, unit: 'correct', value: (p) => domainCorrect(p, 'sports') },
  'lab-coat': { target: 50, unit: 'correct', value: (p) => domainCorrect(p, 'science') },
  'quest-streak-10': { target: 10, unit: 'quests done', value: (p) => p.counters.questsDone },
  'level-10': { target: 10, unit: 'levels', value: (p) => levelForXp(p.xp).level },
  'level-25': { target: 25, unit: 'levels', value: (p) => levelForXp(p.xp).level },
  'level-40': { target: 40, unit: 'levels', value: (p) => levelForXp(p.xp).level },
  'gem-hoarder': { target: 500, unit: 'gems earned', value: (p) => p.wallet.lifetimeGems },
};

function badgeProgress(id: string, progression: Progression) {
  const goal = GOALS[id];
  if (!goal) return null;
  const raw = Number(goal.value(progression));
  const current = Math.max(0, Math.min(goal.target, Number.isFinite(raw) ? raw : 0));
  return { current, target: goal.target, unit: goal.unit, fraction: current / goal.target };
}

export function Achievements({ progression }: { progression: any }) {
  const [filter, setFilter] = useState<Filter>('all');
  const press = usePress();
  const earned: Record<string, number> = progression.achievements ?? {};
  const counts = useMemo(() => {
    const unlocked = ALL.filter((a) => Object.hasOwn(earned, a.id)).length;
    return { all: ALL.length, unlocked, locked: ALL.length - unlocked };
  }, [earned]);
  const shown = ALL.filter((a) => {
    const has = Object.hasOwn(earned, a.id);
    return filter === 'all' ? true : filter === 'unlocked' ? has : !has;
  });
  return (
    <>
      <div className="fd-chips" role="group" aria-label="Filter achievements">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="fd-chip fd-btn"
            aria-pressed={filter === f.id}
            onPointerDown={press}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            <b>{counts[f.id]}</b>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="fd-player-note">
          {filter === 'unlocked'
            ? 'No badges yet. Finish a duel and the first one is already in reach.'
            : 'Every badge is unlocked. Nothing left in the case.'}
        </p>
      ) : (
        <ul className="fd-badges">
          {shown.map((a) => {
            const at = earned[a.id];
            const locked = at === undefined;
            const secret = locked && a.hidden;
            const progress = locked && !a.hidden ? badgeProgress(a.id, progression) : null;
            return (
              <li className="fd-badge" key={a.id} data-tier={a.tier} data-locked={locked}>
                <BadgeMedal locked={locked} />
                <strong>{secret ? '???' : a.name}</strong>
                {locked ? (
                  <small>{secret ? 'Hidden badge — keep playing to reveal it.' : a.description}</small>
                ) : (
                  <>
                    <small>{a.description}</small>
                    <time dateTime={new Date(at).toISOString()}>{dateFormat(at)}</time>
                  </>
                )}
                {locked && !secret && progress && (
                  <span className="fd-badge-progress">
                    <Meter
                      value={progress.fraction}
                      label={`${a.name}: ${progress.current} of ${progress.target} ${progress.unit}`}
                    />
                    <b>
                      {progress.current.toLocaleString()} / {progress.target.toLocaleString()} {progress.unit}
                    </b>
                  </span>
                )}
                <span className="fd-badge-tier">
                  {a.tier} · +{a.xp} XP · +{a.gems} gems
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
