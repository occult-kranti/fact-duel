'use client';
/** Expeditions atlas — nine route cards as field notes, filtered by domain. */
import { useState, type CSSProperties } from 'react';
import { ArrowLeft, Atom, Compass, Flag, Layers } from 'lucide-react';
import { EXPEDITIONS, expeditionStatus } from '@/lib/expeditions.mjs';
import { EpisodeCard, useTap } from './parts';

const FILTERS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'sports', label: 'Sports', icon: Flag },
  { id: 'science', label: 'Science', icon: Atom },
] as const;

export function ExpeditionAtlas({
  player,
  onSelect,
  onBack,
}: {
  player: any;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const tap = useTap();
  const [world, setWorld] = useState<string>('all');
  const journeys = player.profile.journeys || {};
  const routes = EXPEDITIONS.filter((r: any) => world === 'all' || r.domain === world);
  const stamped = EXPEDITIONS.filter((r: any) => journeys[r.key]?.first).length;
  const open = EXPEDITIONS.filter((r: any) => expeditionStatus(journeys[r.key]) === 'continue').length;

  return (
    <section className="fd-exp fd-exp-atlas">
      <header className="fd-exp-head">
        <div>
          <p className="fd-exp-eyebrow">
            <Compass size={14} aria-hidden="true" />
            NINE SMALL WORLDS
          </p>
          <h1>Find your next obsession.</h1>
          <p className="fd-exp-lede">
            Six questions. Three chapters. Choose Steady or Bold, then commit. Finish a route — at any
            score — to collect its stamp.
          </p>
        </div>
        <button type="button" className="fd-exp-ghost" onPointerDown={tap} onClick={onBack}>
          <ArrowLeft size={17} aria-hidden="true" />
          Home
        </button>
      </header>

      <div className="fd-exp-atlas-bar">
        <div className="fd-exp-seg" role="group" aria-label="Filter expeditions">
          <span
            className="fd-exp-seg-thumb"
            aria-hidden="true"
            style={
              {
                '--n': FILTERS.length,
                '--i': FILTERS.findIndex((f) => f.id === world),
              } as CSSProperties
            }
          />
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className="fd-exp-seg-btn"
              aria-pressed={world === id}
              onPointerDown={tap}
              onClick={() => setWorld(id)}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <p className="fd-exp-tally" aria-live="polite">
          <strong>{stamped}</strong>/9 stamped
          {open > 0 && (
            <>
              {' · '}
              <strong>{open}</strong> in progress
            </>
          )}
        </p>
      </div>

      <div className="fd-exp-grid">
        {routes.map((route: any) => (
          <EpisodeCard
            key={route.key}
            route={route}
            record={journeys[route.key]}
            onOpen={() => onSelect(route.id)}
          />
        ))}
      </div>

      <p className="fd-exp-note">
        These routes use our existing 54-question sample. Levels are editorial, and repeat runs use the
        same questions. Your progress is local to this browser.
      </p>
    </section>
  );
}
