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
import { FixtureStrip } from './events/fixture-card';
import { ModeCard } from './events/mode-card';
import { useEventsPress } from './events/press';
import { formatDay, modeForEvent, monthLabel } from './events/util';
import { useLocale } from '../use-locale';
import './events/events.css';

export function EventsScreen({ player, ready, busy, onDuel, onMode, activeModeId, go }: EventsScreenProps) {
  const now = useCalendarNow();
  const { press } = useEventsPress();
  const { t, locale, fmt } = useLocale();

  const groups = groupEvents(now) as {
    live: readonly CalendarEvent[];
    upcoming: readonly CalendarEvent[];
    recent: readonly CalendarEvent[];
  };
  const modes = monthlyModes(now) as readonly EventMode[];
  const openCount = activeModes(now).length;
  const month = locale === 'en' ? monthLabel(monthKey(now)) : fmt.month(monthKey(now) ?? '');
  const asOf = locale === 'en' ? formatDay(CALENDAR_ASOF as string) : fmt.isoDay(CALENDAR_ASOF as string);
  const badges: Record<string, number> = player.progression?.eventBadges ?? {};
  // Fixture windows are cut in the viewer's local day; the offset is read from the same `now` the
  // rest of the screen renders against, so the server and the browser agree on the hydration frame.
  const tzOffsetMinutes = new Date(now).getTimezoneOffset();

  return (
    <section className="fd-events fd-events-screen" aria-labelledby="fd-ev-title">
      <header className="fd-ev-head">
        <button type="button" className="fd-ev-back fd-ev-pressable" {...press} onClick={() => go('home')}>
          <ArrowLeft aria-hidden="true" />
          {t('events.home')}
        </button>
        <p className="fd-ev-eyebrow">
          <CalendarDays aria-hidden="true" />
          {t('events.eyebrow', { month: locale === 'en' ? month.toUpperCase() : month })}
        </p>
        <h1 id="fd-ev-title">{t('events.title')}</h1>
        <p className="fd-ev-lede">{t('events.lede')}</p>

        <dl className="fd-ev-stats">
          <div>
            <dt>{t('events.onNow')}</dt>
            <dd className="fd-mono">{groups.live.length}</dd>
          </div>
          <div>
            <dt>{t('events.modesOpen')}</dt>
            <dd className="fd-mono">{openCount}</dd>
          </div>
          <div>
            <dt>{t('events.comingUp')}</dt>
            <dd className="fd-mono">{groups.upcoming.length}</dd>
          </div>
        </dl>

        {/* The one honesty line this screen is allowed, and the one it must carry. */}
        <p className="fd-ev-asof" role="note">
          <CalendarCheck2 aria-hidden="true" />
          <span>
            {t('events.asofA')}
            <b>{asOf}</b>
            {t('events.asofB')}
          </span>
        </p>
      </header>

      {/* Fixture sets first: they are the calendar's time-boxed offer, and the strip renders nothing
          when no window is open, so the page never carries an empty box. */}
      <FixtureStrip now={now} tzOffsetMinutes={tzOffsetMinutes} go={go} />

      <Section
        id="live"
        icon={<Flame aria-hidden="true" />}
        title={t('events.live')}
        note={groups.live.length ? t('events.onTheGo', { n: groups.live.length }) : ''}
        empty={t('events.liveEmpty')}
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
        title={t('events.limited')}
        note={openCount ? t('events.playableToday', { n: openCount }) : t('events.noneOpen')}
        empty={t('events.modesEmpty')}
        count={modes.length}
      >
        <p className="fd-ev-section-lede">{t('events.modesLede', { month })}</p>
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
        title={t('events.comingUp')}
        note={groups.upcoming.length ? t('events.soonest') : ''}
        empty={t('events.upcomingEmpty')}
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
        title={t('events.recent')}
        note={groups.recent.length ? t('events.newest') : ''}
        empty={t('events.recentEmpty')}
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
