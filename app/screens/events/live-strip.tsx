'use client';
/**
 * app/screens/events/live-strip.tsx — the slim "Live now / Next up" strip on Home.
 *
 * At most two entries: whatever is on right now, then the next thing on the calendar. Each one is a
 * button into the Events screen; nothing here starts a duel, so nothing here makes a promise the
 * strip cannot keep. One badge counts the modes open this month, and the strip carries the honesty
 * line once, in its own short form.
 *
 * It renders even when both entries are empty. With five nav tabs this strip and the Play row are
 * the only ways into the Events screen, and the Play row hides itself when no mode is open — so a
 * calendar that has run out must still leave a door open.
 */
import { ArrowRight, CalendarClock, Zap } from 'lucide-react';
import { CALENDAR_ASOF, activeModes, groupEvents } from '@/lib/events.mjs';
import type { CalendarEvent } from '../types';
import { useCalendarNow } from './clock';
import { topicIcon } from './parts';
import { useEventsPress } from './press';
import { formatDay, formatRange, whenLabel } from './util';
import './events.css';

export function LiveStrip({ go }: { go: (tab: string) => void }) {
  const now = useCalendarNow();
  const { press } = useEventsPress();
  const groups = groupEvents(now);
  const open = activeModes(now).length;

  /* Live first, then the next thing coming — and a second live entry only when nothing is due. */
  const entries: { event: CalendarEvent; status: 'live' | 'upcoming' }[] = [];
  if (groups.live[0]) entries.push({ event: groups.live[0] as CalendarEvent, status: 'live' });
  if (groups.upcoming[0]) entries.push({ event: groups.upcoming[0] as CalendarEvent, status: 'upcoming' });
  else if (groups.live[1]) entries.push({ event: groups.live[1] as CalendarEvent, status: 'live' });

  return (
    <section className="fd-events fd-ev-strip" aria-labelledby="fd-ev-strip-title">
      <div className="fd-ev-strip-head">
        <h2 id="fd-ev-strip-title">
          <CalendarClock aria-hidden="true" />
          On the calendar
        </h2>
        {open > 0 && (
          <span className="fd-ev-count">
            <Zap aria-hidden="true" />
            {open} {open === 1 ? 'mode' : 'modes'} open
          </span>
        )}
        <button
          type="button"
          className="fd-ev-strip-all fd-ev-pressable"
          {...press}
          onClick={() => go('events')}
        >
          All events
          <ArrowRight aria-hidden="true" />
        </button>
      </div>

      {!entries.length && (
        // The strip is the Events screen's home on the tab bar, so it stays even with nothing on:
        // hiding it would leave the calendar with no way in.
        <p className="fd-ev-strip-empty">
          {groups.recent.length
            ? 'Nothing on the calendar right now. What just finished is still worth a duel.'
            : 'Nothing on the calendar right now.'}
        </p>
      )}

      <ul className="fd-ev-strip-list">
        {entries.map(({ event, status }) => {
          const Icon = topicIcon(event.topic, event.domain);
          const when = whenLabel(event, status, now);
          return (
            <li key={event.id}>
              <button
                type="button"
                className="fd-ev-strip-item fd-ev-pressable"
                data-domain={event.domain}
                {...press}
                onClick={() => go('events')}
              >
                <span className="fd-ev-strip-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="fd-ev-strip-body">
                  <span className="fd-ev-strip-kicker">
                    {status === 'live' ? (
                      <>
                        <i className="fd-ev-live-dot" aria-hidden="true" />
                        Live now
                      </>
                    ) : (
                      'Next up'
                    )}
                    {when && <em>{when}</em>}
                  </span>
                  <strong>{event.name}</strong>
                  <small className="fd-mono">{formatRange(event.start, event.end)}</small>
                </span>
                <ArrowRight className="fd-ev-strip-go" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="fd-ev-strip-note">
        Curated calendar, checked by hand on {formatDay(CALENDAR_ASOF as string)}. No live scores or results
        feeds.
      </p>
    </section>
  );
}
