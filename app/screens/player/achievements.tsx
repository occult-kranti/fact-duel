'use client';
/**
 * Achievements gallery — every entry of ACHIEVEMENTS as a badge tile in its bronze / silver / gold
 * finish. Unlocked tiles carry the date they were earned; locked tiles are silhouettes with the
 * description; hidden-and-locked tiles show "???" so the surprise survives. Filter chips narrow the
 * grid to All / Unlocked / Locked.
 */
import { useMemo, useState } from 'react';
import { ACHIEVEMENTS } from '@/lib/progression.mjs';
import { BadgeMedal, usePress } from './shared';

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
