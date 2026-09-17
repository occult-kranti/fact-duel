'use client';
/**
 * app/screens/events/event-card.tsx — one entry from the curated calendar.
 *
 * Two shapes from one component:
 *  - `live`: the full card — pulsing marker, dates, the dataset's blurb, and one control that
 *    either arms this event's limited mode or opens a Quick Draw on its topic.
 *  - `compact`: Coming up / Recently finished — chip, name, dates and the source. A finished event
 *    shows its `headline` when the dataset has one and nothing else: results are never inferred
 *    from anywhere but that field.
 */
import { CalendarDays, Play, Sparkles, Trophy } from 'lucide-react';
import type { CalendarEvent, EventMode } from '../types';
import { LiveDot, SourceLink, TopicChip } from './parts';
import { useEventsPress } from './press';
import { formatRange, modeDuel, modeState, modeXp, whenLabel } from './util';
import { useLocale } from '../../use-locale';

export type EventCardProps = {
  event: CalendarEvent;
  status: 'live' | 'upcoming' | 'past';
  now: number;
  variant?: 'live' | 'compact';
  /** This month's mode built on this event, when the generator picked one. */
  mode?: EventMode | null;
  armed?: boolean;
  ready?: boolean;
  busy?: boolean;
  onMode?: (mode: EventMode) => void;
  onDuel?: (mode: string, topic?: string) => void;
};

export function EventCard({
  event,
  status,
  now,
  variant = 'compact',
  mode = null,
  armed = false,
  ready = false,
  busy = false,
  onMode,
  onDuel,
}: EventCardProps) {
  const { press, cue } = useEventsPress();
  const { t, when: localWhen, topic, pick } = useLocale();
  const when = localWhen(whenLabel(event, status, now));
  const dates = formatRange(event.start, event.end);
  const state = mode ? modeState(mode, now) : null;
  const playable = !!(mode && state?.open && onMode);
  const duel = mode ? modeDuel(mode) : null;

  const play = () => {
    if (playable && mode) {
      cue('select', 'medium');
      onMode?.(mode);
    } else if (onDuel && ready && !busy) {
      cue('select', 'light');
      onDuel('quick', event.topic);
    }
  };

  return (
    <article className="fd-ev-card" data-domain={event.domain} data-variant={variant} data-status={status}>
      <div className="fd-ev-card-top">
        <TopicChip topic={event.topic} domain={event.domain} />
        {status === 'live' ? <LiveDot /> : when ? <span className="fd-ev-when">{when}</span> : null}
      </div>

      <h3 className="fd-ev-name">{event.name}</h3>

      {variant === 'live' ? (
        <p className="fd-ev-dates">
          <CalendarDays aria-hidden="true" />
          <span className="fd-mono">{dates}</span>
          {when ? <b>{when}</b> : null}
        </p>
      ) : null}

      {variant === 'live' && event.blurb ? <p className="fd-ev-blurb">{event.blurb}</p> : null}

      {status === 'past' && event.headline ? (
        <p className="fd-ev-headline">
          <Trophy aria-hidden="true" />
          {event.headline}
        </p>
      ) : null}

      <div className="fd-ev-card-foot">
        {variant === 'compact' ? (
          <p className="fd-ev-dates">
            <CalendarDays aria-hidden="true" />
            <span className="fd-mono">{dates}</span>
          </p>
        ) : null}
        <SourceLink href={event.sourceUrl} name={event.name} />
        {variant === 'live' ? (
          <button
            type="button"
            className="fd-ev-play fd-ev-pressable"
            data-kind={playable ? 'mode' : 'topic'}
            data-armed={armed || undefined}
            disabled={!playable && (!ready || busy || !onDuel)}
            {...press}
            onClick={play}
          >
            <Play aria-hidden="true" />
            <span className="fd-ev-play-body">
              <strong>{playable ? (armed ? t('evcard.modeArmed') : t('evcard.playMode')) : t('evcard.playTopic')}</strong>
              <small>
                {playable && mode && duel ? (
                  <>
                    {mode.template.name} · {pick(`modes.${mode.duel.mode}.name`, duel.name)} · {duel.timer} · +
                    {modeXp(mode.xpBonus).total} XP
                  </>
                ) : (
                  t('evcard.quickVs', { topic: topic(event.topic) })
                )}
              </small>
            </span>
            {playable ? <Sparkles className="fd-ev-play-spark" aria-hidden="true" /> : null}
          </button>
        ) : null}
      </div>
    </article>
  );
}
