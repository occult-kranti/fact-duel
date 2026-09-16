'use client';
/** Expeditions atlas — the visible route cards as field notes, filtered by domain when there is more than one. */
import { useState, type CSSProperties } from 'react';
import { ArrowLeft, Atom, Compass, Flag, Layers } from 'lucide-react';
import { ACTIVE_EXPEDITIONS, expeditionStatus } from '@/lib/expeditions.mjs';
import { DOMAIN_CHIPS, SINGLE_DOMAIN } from '@/lib/content.mjs';
import { EpisodeCard, useTap } from './parts';

const ICONS: Record<string, typeof Layers> = { all: Layers, sports: Flag, science: Atom };
/* Only the domains the product currently shows, and no switcher at all when there is one. */
const FILTERS = DOMAIN_CHIPS.map((c) => ({ ...c, icon: ICONS[c.id] ?? Layers }));

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
  const [world, setWorld] = useState<string>(FILTERS[0].id);
  const journeys = player.profile.journeys || {};
  const routes = ACTIVE_EXPEDITIONS.filter((r: any) => world === 'all' || r.domain === world);
  const stamped = ACTIVE_EXPEDITIONS.filter((r: any) => journeys[r.key]?.first).length;
  const open = ACTIVE_EXPEDITIONS.filter((r: any) => expeditionStatus(journeys[r.key]) === 'continue').length;

  return (
    <section className="fd-exp fd-exp-atlas">
      <header className="fd-exp-head">
        <div>
          <p className="fd-exp-eyebrow">
            <Compass size={14} aria-hidden="true" />
            {ACTIVE_EXPEDITIONS.length} SMALL WORLDS
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
        {!SINGLE_DOMAIN && (
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
        )}
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
