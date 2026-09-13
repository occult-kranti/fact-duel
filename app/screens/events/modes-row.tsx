'use client';
/**
 * app/screens/events/modes-row.tsx — the "Event modes" row above the format cards on Play.
 *
 * Only modes that are open today appear here; choosing one writes the duel config through the
 * existing controller action and brings the launch control into view. Nothing is shown when the
 * month has no open mode, so the row never occupies space it has not earned.
 */
import { ArrowRight, Check, Zap } from 'lucide-react';
import { CALENDAR_ASOF, activeModes } from '@/lib/events.mjs';
import type { EventMode } from '../types';
import { useCalendarNow } from './clock';
import { topicIcon } from './parts';
import { useEventsPress } from './press';
import { formatDay, modeDuel, modeState, modeXp } from './util';
import './events.css';

export type ModesRowProps = {
  /** Currently armed mode id, or ''. */
  activeId: string;
  onChoose: (mode: EventMode) => void;
  go: (tab: string) => void;
};

export function ModesRow({ activeId, onChoose, go }: ModesRowProps) {
  const now = useCalendarNow();
  const { press, cue } = useEventsPress();
  const modes = activeModes(now) as readonly EventMode[];
  if (!modes.length) return null;

  return (
    <section className="fd-events fd-ev-row" aria-labelledby="fd-ev-row-title">
      <div className="fd-ev-row-head">
        <h2 id="fd-ev-row-title">Event modes</h2>
        <button
          type="button"
          className="fd-ev-row-all fd-ev-pressable"
          {...press}
          onClick={() => go('events')}
        >
          All events
          <ArrowRight aria-hidden="true" />
        </button>
      </div>

      <ul className="fd-ev-row-list">
        {modes.map((mode) => {
          const Icon = topicIcon(mode.event.topic, mode.event.domain);
          const duel = modeDuel(mode);
          const armed = activeId === mode.id;
          return (
            <li key={mode.id}>
              <button
                type="button"
                className="fd-ev-row-item fd-ev-pressable"
                data-domain={mode.duel.domain}
                data-armed={armed || undefined}
                aria-pressed={armed}
                {...press}
                onClick={() => {
                  cue('select', 'medium');
                  onChoose(mode);
                }}
              >
                <span className="fd-ev-row-icon" aria-hidden="true">
                  {armed ? <Check /> : <Icon />}
                </span>
                <span className="fd-ev-row-body">
                  <strong>{mode.template.name}</strong>
                  <small>
                    {duel.name} · <span className="fd-mono">{duel.timer}</span> · {duel.topic}
                  </small>
                  <em className="fd-ev-row-event">{mode.event.name}</em>
                </span>
                <span className="fd-ev-row-xp fd-mono">
                  <Zap aria-hidden="true" />+{modeXp(mode.xpBonus).total}
                </span>
              </button>
              <span className="fd-ev-row-window fd-mono">{modeState(mode, now).reason}</span>
            </li>
          );
        })}
      </ul>

      <p className="fd-ev-row-note">
        Curated calendar, checked by hand on {formatDay(CALENDAR_ASOF as string)}. No live scores or results
        feeds.
      </p>
    </section>
  );
}
