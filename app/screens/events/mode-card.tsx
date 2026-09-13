'use client';
/**
 * app/screens/events/mode-card.tsx — one limited-time mode for this month.
 *
 * Everything the card claims comes from the mode object: the template's name and tagline, the exact
 * duel it sets up, the XP the reducer will pay (`XP.eventMode` × the template multiplier), the badge
 * it mints and the window it is playable in. A closed mode is locked and says why; an earned badge
 * says so too, because the reducer pays a badge exactly once.
 */
import { BadgeCheck, Check, Clock3, Lock, Medal, Play, Timer, Zap } from 'lucide-react';
import type { EventMode } from '../types';
import { TopicChip } from './parts';
import { useEventsPress } from './press';
import { badgeLabel, formatDay, isoOf, modeDuel, modeState, modeXp } from './util';

export type ModeCardProps = {
  mode: EventMode;
  now: number;
  /** Timestamp the badge was first earned, or 0. */
  earnedAt: number;
  armed: boolean;
  onChoose: (mode: EventMode) => void;
};

export function ModeCard({ mode, now, earnedAt, armed, onChoose }: ModeCardProps) {
  const { press, cue } = useEventsPress();
  const state = modeState(mode, now);
  const duel = modeDuel(mode);
  const xp = modeXp(mode.xpBonus);
  const badge = badgeLabel(mode.badge);
  const earned = earnedAt > 0;
  const reasonId = `fd-ev-mode-why-${mode.id.replace(/[^a-z0-9]+/gi, '-')}`;

  return (
    <article
      className="fd-ev-mode"
      data-domain={mode.duel.domain}
      data-open={state.open || undefined}
      data-armed={armed || undefined}
    >
      <header className="fd-ev-mode-head">
        <p className="fd-ev-mode-kicker">
          {state.open ? <Zap aria-hidden="true" /> : <Lock aria-hidden="true" />}
          Limited mode
        </p>
        <h3>{mode.template.name}</h3>
        <p className="fd-ev-mode-tagline">{mode.template.tagline}</p>
      </header>

      <div className="fd-ev-mode-event">
        <TopicChip topic={mode.event.topic} domain={mode.event.domain} />
        <span className="fd-ev-mode-event-name">{mode.event.name}</span>
      </div>

      <dl className="fd-ev-specs">
        <div>
          <dt>Duel</dt>
          <dd>{duel.name}</dd>
        </div>
        <div>
          <dt>
            <Timer aria-hidden="true" />
            Timer
          </dt>
          <dd className="fd-mono">{duel.timer}</dd>
        </div>
        <div>
          <dt>Topic</dt>
          <dd>{duel.topic}</dd>
        </div>
      </dl>

      {/* Both lines change once the badge is earned: the reducer pays a badge exactly once, so
          the card must stop advertising a bonus that will not arrive again. */}
      <ul className="fd-ev-rewards" data-earned={earned || undefined}>
        <li>
          <Zap aria-hidden="true" />
          <span>
            <b className="fd-mono">+{xp.total} XP</b> {earned ? 'already paid' : 'once cleared'}
            <small>
              {earned
                ? 'The event bonus pays once per badge.'
                : `${xp.base} × ${xp.bonus.toFixed(2).replace(/\.?0+$/, '')} event bonus`}
            </small>
          </span>
        </li>
        <li>
          {earned ? <BadgeCheck aria-hidden="true" /> : <Medal aria-hidden="true" />}
          <span>
            <b>{badge}</b> badge
            <small>
              {earned ? `Earned ${formatDay(isoOf(earnedAt))}` : 'Pays once, the first time you clear it'}
            </small>
          </span>
        </li>
      </ul>

      {/* A <div>, not a <footer>: a legacy bare `footer {}` rule in app/globals.css indents every
          footer element by the old sidebar width and draws a rule above it. */}
      <div className="fd-ev-mode-foot">
        {state.open ? (
          <button
            type="button"
            className="fd-ev-play fd-ev-pressable"
            data-kind="mode"
            data-armed={armed || undefined}
            aria-describedby={reasonId}
            {...press}
            onClick={() => {
              cue('select', 'medium');
              onChoose(mode);
            }}
          >
            {armed ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}
            <span className="fd-ev-play-body">
              <strong>{armed ? 'Armed — go to Play' : earned ? 'Play it again' : 'Play this mode'}</strong>
              <small>
                {duel.name} · {duel.timer} · {duel.topic}
              </small>
            </span>
          </button>
        ) : (
          <p className="fd-ev-locked">
            <Lock aria-hidden="true" />
            <span>
              <strong>{state.reason}</strong>
              <small>Not playable today</small>
            </span>
          </p>
        )}
        <p className="fd-ev-window" id={reasonId}>
          <Clock3 aria-hidden="true" />
          <span className="fd-mono">{state.window}</span>
          {state.open ? <b>{state.reason}</b> : null}
        </p>
      </div>
    </article>
  );
}
