'use client';
/**
 * app/screens/room/next-fixture.tsx — the next-fixture card at the end of a duel.
 *
 * The return hook the research asked for, kept honest: the soonest served-sport entry on the static
 * calendar, its name, and a whole-day line ("Starts in 3 days"). No kick-off time, no score, no
 * seconds counter, no reminder — there is no feed and no notification system, so the one control
 * simply opens the Events screen where the set will appear when its window opens. Renders nothing
 * when the calendar has nothing ahead.
 */
import { ArrowRight, CalendarClock } from 'lucide-react';
import { countdownCopy, fixturesAt } from '@/lib/fixtures.mjs';
import type { CalendarEvent } from '../types';
import { useCalendarNow } from '../events/clock';
import { TopicChip } from '../events/parts';
import { useEventsPress } from '../events/press';
import '../events/events.css';
import '../events/fixture.css';

export function NextFixture({ go }: { go: (tab: string) => void }) {
  const now = useCalendarNow();
  const { press } = useEventsPress();
  const tzOffsetMinutes = new Date(now).getTimezoneOffset();
  const { next } = fixturesAt(now, { tzOffsetMinutes }) as { next: CalendarEvent | null };
  if (!next) return null;
  const when = countdownCopy(next, now, { tzOffsetMinutes }) as string;
  return (
    <aside className="fd-events fd-fx-next" data-domain={next.domain} aria-labelledby="fd-fx-next-title">
      <p className="fd-fx-kicker">
        <CalendarClock aria-hidden="true" />
        Next fixture
      </p>
      <div className="fd-ev-card-top">
        <TopicChip topic={next.topic} domain={next.domain} />
        {when ? <span className="fd-ev-when">{when}</span> : null}
      </div>
      <h3 id="fd-fx-next-title" className="fd-ev-name">
        {next.name}
      </h3>
      <p className="fd-fx-note">
        A ten-card Kick-off set opens the day before it starts. From the curated calendar: no live scores here.
      </p>
      <button type="button" className="fd-ev-play fd-ev-pressable" data-kind="topic" {...press} onClick={() => go('events')}>
        <ArrowRight aria-hidden="true" />
        <span className="fd-ev-play-body">
          <strong>See the fixture</strong>
          <small>Events · {next.topic}</small>
        </span>
      </button>
    </aside>
  );
}
