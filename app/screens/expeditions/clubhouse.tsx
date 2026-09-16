'use client';
/**
 * The Clubhouse — the Home tab's body. Owned by the Expeditions module because it is mostly
 * expedition surface; the Home screen imports it with these exact props.
 */
import { useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Atom,
  BookOpen,
  ChevronRight,
  Compass,
  Flag,
  Layers,
  Swords,
  Users,
} from 'lucide-react';
import { ACTIVE_EXPEDITIONS as EXPEDITIONS, expeditionStatus } from '@/lib/expeditions.mjs';
import { DOMAIN_CHIPS, ENABLED_DOMAINS, SINGLE_DOMAIN } from '@/lib/content.mjs';
import { EpisodeCard, ExpeditionStamp, RouteArt, RouteRail, useTap } from './parts';

const DUELS = [
  ['quick', 'Quick Draw', '1 question'],
  ['trilogy', 'Triple Threat', 'Up to 3'],
  ['gauntlet', 'The Gauntlet', '5 questions'],
] as const;

export function Clubhouse({
  player,
  name,
  ready,
  busy,
  onRoute,
  onDuel,
  onSetup,
  onExplore,
  onPassport,
  onVault,
  onDiscovery,
  onShowroom,
}: {
  player: any;
  name: string;
  ready: boolean;
  busy: boolean;
  onRoute: (id: string | null) => void;
  onDuel: (mode: string, topic?: string) => void;
  onSetup: (intent?: 'friend' | 'join' | 'settings') => void;
  onExplore: () => void;
  onPassport: () => void;
  onVault: () => void;
  onDiscovery: () => void;
  onShowroom: () => void;
}) {
  const tap = useTap();
  const [world, setWorld] = useState<string>(ENABLED_DOMAINS[0]);
  const journeys = player.profile.journeys || {};
  const continuing = EXPEDITIONS.filter((r: any) => expeditionStatus(journeys[r.key]) === 'continue').sort(
    (a: any, b: any) => journeys[b.key].run.startedAt - journeys[a.key].run.startedAt,
  )[0];
  const featured =
    continuing || EXPEDITIONS.find((r: any) => r.domain === world) || EXPEDITIONS[0];
  const record = journeys[featured.key],
    isContinue = expeditionStatus(record) === 'continue';
  const earned = EXPEDITIONS.filter((r: any) => journeys[r.key]?.first);
  const nextRoutes = EXPEDITIONS.filter((r: any) => r.domain === world && r.id !== featured.id).slice(0, 3);

  return (
    <section className="fd-exp fd-club">
      <div className="fd-exp-head">
        <div>
          <p className="fd-exp-eyebrow">THE CLUBHOUSE</p>
          <h1>What’s your home ground?</h1>
        </div>
        <button type="button" className="fd-club-player" onPointerDown={tap} onClick={onPassport}>
          <span className="fd-club-avatar">{name.charAt(0).toUpperCase() || 'P'}</span>
          <span>
            <strong>{name || 'Player'}</strong>
            <small>{earned.length} / 9 expedition stamps</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="fd-club-grid">
        <section className="fd-club-feature" aria-labelledby="fd-club-featured">
          <RouteArt route={featured} cursor={record?.run?.cursor || 0} className="fd-club-feature-art" />
          <div className="fd-club-feature-body">
            <p className="fd-exp-eyebrow">
              <Compass size={14} aria-hidden="true" />
              {isContinue ? 'YOUR UNFINISHED EXPEDITION' : 'SOLO EXPEDITION'}
              <span className="fd-exp-code">{featured.code}</span>
            </p>
            <h2 id="fd-club-featured">{featured.title}</h2>
            <p className="fd-exp-lede">{featured.subtitle}</p>
            <RouteRail route={featured} cursor={record?.run?.cursor || 0} variant="rail" />
            <div className="fd-exp-cta">
              <button
                type="button"
                className="fd-exp-primary"
                disabled={!player.loaded}
                onPointerDown={tap}
                onClick={() => onRoute(featured.id)}
              >
                {isContinue
                  ? 'Continue expedition'
                  : record?.first
                    ? 'View your expedition'
                    : 'Start expedition'}
                <ArrowRight size={19} aria-hidden="true" />
              </button>
              <span>
                6 questions · no timer
                <br />
                {isContinue
                  ? `${record.run.answers.length} answers saved`
                  : 'Choose your confidence. Build your score.'}
              </span>
            </div>
            <p className="fd-exp-note">
              {player.persistent
                ? 'Progress stays in this browser.'
                : 'Visit-only progress. Export before leaving.'}
            </p>
          </div>
        </section>

        <section className="fd-club-duels">
          <p className="fd-exp-eyebrow">
            <Swords size={14} aria-hidden="true" />
            FEELING COMPETITIVE?
          </p>
          <h2>Settle it in the arena.</h2>
          <p className="fd-exp-lede">Four choices. One rival. Fastest correct answer wins the round.</p>
          <div className="fd-club-duel-list">
            {DUELS.map(([id, title, detail], i) => (
              <button
                type="button"
                key={id}
                className={i === 0 ? 'is-primary' : ''}
                disabled={!ready || busy}
                onPointerDown={tap}
                onClick={() => onDuel(id)}
              >
                <span className="fd-mono">0{i + 1}</span>
                <span>
                  <strong>{title}</strong>
                  <small>{detail} · random BOT</small>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="fd-exp-note">
            15s per question · free play. Stay on this screen during live rounds.
          </p>
          <div className="fd-club-friends">
            <button type="button" className="fd-exp-secondary" onPointerDown={tap} onClick={() => onSetup('friend')}>
              <Users size={17} aria-hidden="true" />
              Invite friend
            </button>
            <button type="button" className="fd-exp-ghost" onPointerDown={tap} onClick={() => onSetup('join')}>
              Join a duel
            </button>
          </div>
          <button type="button" className="fd-exp-quiet" onPointerDown={tap} onClick={() => onSetup('settings')}>
            Topics, timer &amp; match settings
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </section>
      </div>

      <section className="fd-club-shelf">
        <div className="fd-exp-head">
          <div>
            <p className="fd-exp-eyebrow">PICK AN OBSESSION</p>
            <h2>A little deeper. A lot more interesting.</h2>
          </div>
          {/* One visible domain means there is nothing to switch between, so no switcher. */}
          {!SINGLE_DOMAIN && (
          <div className="fd-exp-seg" role="group" aria-label="Expedition world">
            <span
              className="fd-exp-seg-thumb"
              aria-hidden="true"
              style={{ '--n': ENABLED_DOMAINS.length, '--i': ENABLED_DOMAINS.indexOf(world) } as CSSProperties}
            />
            {DOMAIN_CHIPS.filter((c) => c.id !== 'all').map(({ id, label }) => {
              const Icon = id === 'science' ? Atom : Flag;
              return (
              <button
                type="button"
                key={id}
                className="fd-exp-seg-btn"
                aria-pressed={id === world}
                onPointerDown={tap}
                onClick={() => setWorld(id)}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
              );
            })}
          </div>
          )}
        </div>
        <div className="fd-exp-grid">
          {nextRoutes.map((route: any) => (
            <EpisodeCard
              key={route.key}
              route={route}
              record={journeys[route.key]}
              onOpen={() => onRoute(route.id)}
            />
          ))}
        </div>
        <div className="fd-club-shelf-foot">
          <button type="button" className="fd-exp-secondary" onPointerDown={tap} onClick={() => onRoute(null)}>
            All {EXPEDITIONS.length} expeditions
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="fd-exp-ghost" onPointerDown={tap} onClick={onExplore}>
            Browse duel topics
            <Layers size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <div className="fd-club-bottom">
        <section className="fd-club-stamps">
          <p className="fd-exp-eyebrow">YOUR EXPEDITION CASE</p>
          <h2>{earned.length ? `${earned.length} stories collected.` : 'Every expedition leaves a mark.'}</h2>
          <p className="fd-exp-lede">Finish all six questions to earn a stamp, at any score.</p>
          <div className="fd-club-mini-stamps">
            {(earned.length ? earned.slice(-3) : EXPEDITIONS.slice(0, 3)).map((r: any) => (
              <button
                type="button"
                key={r.key}
                onPointerDown={tap}
                onClick={() => (earned.length ? onRoute(r.id) : onPassport())}
                aria-label={
                  earned.length ? `View ${r.stamp} completed expedition` : 'View your expedition case'
                }
              >
                <ExpeditionStamp route={r} earned={!!journeys[r.key]?.first} />
              </button>
            ))}
          </div>
          <button type="button" className="fd-exp-quiet" onPointerDown={tap} onClick={onPassport}>
            Open player card
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
        <section className="fd-club-tools">
          {[
            [BookOpen, 'Your fact vault', 'Answers, sources & saved questions', onVault],
            [Compass, 'Just three facts', 'A short, unscored warm-up', onDiscovery],
            [Atom, 'The arena object', 'Explore the optional 3D scene', onShowroom],
          ].map(([Icon, title, detail, action]: any) => (
            <button type="button" key={title} onPointerDown={tap} onClick={action}>
              <Icon size={20} aria-hidden="true" />
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ))}
        </section>
      </div>
    </section>
  );
}
