'use client';
/**
 * Events — the calendar surface (spec: Events screen & limited-time modes).
 *
 * Four sections in the order they matter: what is on right now, the limited modes this month builds
 * from them, what is coming, what has just finished. Everything on screen is read from the curated
 * dataset in lib/events-data.mjs through the pure engine in lib/events.mjs — there is no feed, no
 * score service and no results lookup anywhere in this app, and the header says so once.
 */
import type { ReactNode } from 'react';
import { ArrowLeft, CalendarCheck2, CalendarDays, Flame, History, Sparkles, Zap } from 'lucide-react';
import { CALENDAR_ASOF, activeModes, groupEvents, monthKey, monthlyModes } from '@/lib/events.mjs';
import type { CalendarEvent, EventMode, EventsScreenProps } from './types';
import { useCalendarNow } from './events/clock';
import { EventCard } from './events/event-card';
import { ModeCard } from './events/mode-card';
import { useEventsPress } from './events/press';
import { formatDay, modeForEvent, monthLabel } from './events/util';
import './events/events.css';

export function EventsScreen({ player, ready, busy, onDuel, onMode, activeModeId, go }: EventsScreenProps) {
  const now = useCalendarNow();
  const { press } = useEventsPress();

  const groups = groupEvents(now) as {
    live: readonly CalendarEvent[];
    upcoming: readonly CalendarEvent[];
    recent: readonly CalendarEvent[];
  };
  const modes = monthlyModes(now) as readonly EventMode[];
  const openCount = activeModes(now).length;
  const month = monthLabel(monthKey(now));
  const badges: Record<string, number> = player.progression?.eventBadges ?? {};

  return (
    <section className="fd-events fd-events-screen" aria-labelledby="fd-ev-title">
      <header className="fd-ev-head">
        <button type="button" className="fd-ev-back fd-ev-pressable" {...press} onClick={() => go('home')}>
          <ArrowLeft aria-hidden="true" />
          Home
        </button>
        <p className="fd-ev-eyebrow">
          <CalendarDays aria-hidden="true" />
          CURATED CALENDAR · {month.toUpperCase()}
        </p>
        <h1 id="fd-ev-title">Events</h1>
        <p className="fd-ev-lede">
          Real sports moments — just finished, on right now, and coming up. Each one can turn into
          a limited-time duel.
        </p>

        <dl className="fd-ev-stats">
          <div>
            <dt>On now</dt>
            <dd className="fd-mono">{groups.live.length}</dd>
          </div>
          <div>
            <dt>Modes open</dt>
            <dd className="fd-mono">{openCount}</dd>
          </div>
          <div>
            <dt>Coming up</dt>
            <dd className="fd-mono">{groups.upcoming.length}</dd>
          </div>
        </dl>

        {/* The one honesty line this screen is allowed, and the one it must carry. */}
        <p className="fd-ev-asof" role="note">
          <CalendarCheck2 aria-hidden="true" />
          <span>
            This calendar is curated and static. A human last checked every date and source on{' '}
            <b>{formatDay(CALENDAR_ASOF as string)}</b>. There are no live score or results feeds here:
            nothing on this screen updates on its own, and anything after that date may have moved.
          </span>
        </p>
      </header>

      <Section
        id="live"
        icon={<Flame aria-hidden="true" />}
        title="Live now"
        note={groups.live.length ? `${groups.live.length} on the go` : ''}
        empty="Nothing on the calendar is running right now."
        count={groups.live.length}
      >
        <div className="fd-ev-grid fd-ev-grid--live">
          {groups.live.map((event) => {
            const mode = modeForEvent(modes, event.id);
            return (
              <EventCard
                key={event.id}
                event={event}
                status="live"
                variant="live"
                now={now}
                mode={mode}
                armed={!!mode && mode.id === activeModeId}
                ready={ready}
                busy={busy}
                onMode={onMode}
                onDuel={onDuel}
              />
            );
          })}
        </div>
      </Section>

      <Section
        id="modes"
        icon={<Zap aria-hidden="true" />}
        title="Limited modes"
        note={openCount ? `${openCount} playable today` : 'None open today'}
        empty="No event on the calendar fits this month. The set is rebuilt when the month turns over."
        count={modes.length}
      >
        <p className="fd-ev-section-lede">
          {month}: four modes built from the calendar. Each one sets up an exact duel, pays a one-off XP bonus
          and mints a badge the first time you clear it.
        </p>
        <div className="fd-ev-grid fd-ev-grid--modes">
          {modes.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              now={now}
              earnedAt={badges[mode.badge] ?? 0}
              armed={mode.id === activeModeId}
              onChoose={onMode}
            />
          ))}
        </div>
      </Section>

      <Section
        id="upcoming"
        icon={<Sparkles aria-hidden="true" />}
        title="Coming up"
        note={groups.upcoming.length ? 'Soonest first' : ''}
        empty="Nothing else is scheduled on this calendar for the next eight months."
        count={groups.upcoming.length}
      >
        <div className="fd-ev-grid fd-ev-grid--tight">
          {groups.upcoming.map((event) => (
            <EventCard key={event.id} event={event} status="upcoming" now={now} />
          ))}
        </div>
      </Section>

      <Section
        id="recent"
        icon={<History aria-hidden="true" />}
        title="Recently finished"
        note={groups.recent.length ? 'Newest first' : ''}
        empty="Nothing on this calendar has wrapped up in the last four months."
        count={groups.recent.length}
      >
        <div className="fd-ev-grid fd-ev-grid--tight">
          {groups.recent.map((event) => (
            <EventCard key={event.id} event={event} status="past" now={now} />
          ))}
        </div>
      </Section>
    </section>
  );
}

type SectionProps = {
  id: string;
  icon: ReactNode;
  title: string;
  note?: string;
  empty: string;
  count: number;
  children: ReactNode;
};

/** One titled section with its own empty state — the sections never silently disappear. */
function Section({ id, icon, title, note, empty, count, children }: SectionProps) {
  return (
    <section className="fd-ev-section" aria-labelledby={`fd-ev-${id}-title`}>
      <div className="fd-ev-section-head">
        <h2 id={`fd-ev-${id}-title`}>
          <span className="fd-ev-section-icon" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h2>
        {note ? <span className="fd-ev-section-note">{note}</span> : null}
      </div>
      {count ? children : <p className="fd-ev-empty">{empty}</p>}
    </section>
  );
}
