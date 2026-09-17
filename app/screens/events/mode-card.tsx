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
import { useLocale } from '../../use-locale';

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
  const { t, pick, topic, locale, fmt } = useLocale();
  const state = modeState(mode, now);
  const duel = modeDuel(mode);
  const duelName = pick(`modes.${mode.duel.mode}.name`, duel.name);
  const duelTopic = topic(duel.topic);
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
          {t('modecard.limited')}
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
          <dt>{t('modecard.duel')}</dt>
          <dd>{duelName}</dd>
        </div>
        <div>
          <dt>
            <Timer aria-hidden="true" />
            {t('modecard.timer')}
          </dt>
          <dd className="fd-mono">{duel.timer}</dd>
        </div>
        <div>
          <dt>{t('modecard.topic')}</dt>
          <dd>{duelTopic}</dd>
        </div>
      </dl>

      {/* Both lines change once the badge is earned: the reducer pays a badge exactly once, so
          the card must stop advertising a bonus that will not arrive again. */}
      <ul className="fd-ev-rewards" data-earned={earned || undefined}>
        <li>
          <Zap aria-hidden="true" />
          <span>
            <b className="fd-mono">+{xp.total} XP</b> {earned ? t('modecard.alreadyPaid') : t('modecard.onceCleared')}
            <small>
              {earned
                ? t('modecard.paysOnce')
                : t('modecard.bonus', { base: xp.base, mult: xp.bonus.toFixed(2).replace(/\.?0+$/, '') })}
            </small>
          </span>
        </li>
        <li>
          {earned ? <BadgeCheck aria-hidden="true" /> : <Medal aria-hidden="true" />}
          <span>
            <b>{badge}</b> {t('modecard.badge')}
            <small>
              {earned
                ? t('modecard.earnedOn', {
                    day: locale === 'en' ? formatDay(isoOf(earnedAt)) : fmt.isoDay(isoOf(earnedAt), { day: 'numeric', month: 'short', year: 'numeric' }),
                  })
                : t('modecard.paysFirst')}
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
              <strong>{armed ? t('modecard.armedGo') : earned ? t('modecard.playAgain') : t('modecard.playMode')}</strong>
              <small>
                {duelName} · {duel.timer} · {duelTopic}
              </small>
            </span>
          </button>
        ) : (
          <p className="fd-ev-locked">
            <Lock aria-hidden="true" />
            <span>
              <strong>{state.reason}</strong>
              <small>{t('modecard.notPlayable')}</small>
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
