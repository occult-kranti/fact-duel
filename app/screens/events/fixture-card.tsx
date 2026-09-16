'use client';
/**
 * app/screens/events/fixture-card.tsx — the Fixtures strip: one card per open Kick-off or Full-time
 * set, plus the free "Yesterday" recap when an event ended yesterday.
 *
 * Everything on a card comes from the static calendar through lib/fixtures.mjs and from the device
 * wallet: the label, the card count (FIXTURE_SIZE), an honest whole-day line ("Starts tomorrow"),
 * and for the recap whether today's free run is still there. There is no live feed, so no card ever
 * claims a score, a whistle or a kick-off time, and nothing on the strip counts down in seconds.
 * "Play the set" arms the deal and moves to Discovery, which asks the duel service for the cards.
 */
import { CalendarClock, Gift, Play, Timer, Trophy } from 'lucide-react';
import { FIXTURE_SIZE, countdownCopy, fixtureLabel, fixturesAt } from '@/lib/fixtures.mjs';
import { armFixtureDeal, type FixtureKind } from '../../fixture-deal';
import { useWalletContext } from '../../use-wallet';
import type { CalendarEvent } from '../types';
import { TopicChip } from './parts';
import { useEventsPress } from './press';
import './fixture.css';

export type { FixtureKind };

type Fixtures = {
  kickoff: readonly CalendarEvent[];
  fulltime: readonly CalendarEvent[];
  recap: CalendarEvent | null;
  next: CalendarEvent | null;
};

const SIZE = FIXTURE_SIZE as Record<FixtureKind, number>;

/** The strip. Renders nothing at all when no set is open — an empty fixtures box would be noise. */
export function FixtureStrip({ now, tzOffsetMinutes, go }: { now: number; tzOffsetMinutes: number; go: (tab: string) => void }) {
  const fixtures = fixturesAt(now, { tzOffsetMinutes }) as Fixtures;
  const cards: { event: CalendarEvent; kind: FixtureKind }[] = [
    ...(fixtures.recap ? [{ event: fixtures.recap, kind: 'recap' as const }] : []),
    ...fixtures.kickoff.map((event) => ({ event, kind: 'kickoff' as const })),
    ...fixtures.fulltime.map((event) => ({ event, kind: 'fulltime' as const })),
  ];
  if (!cards.length) return null;
  return (
    <section className="fd-ev-section fd-fx-strip" aria-labelledby="fd-ev-fixtures-title">
      <div className="fd-ev-section-head">
        <h2 id="fd-ev-fixtures-title">
          <span className="fd-ev-section-icon" aria-hidden="true">
            <Timer />
          </span>
          Fixtures
        </h2>
        <span className="fd-ev-section-note">{cards.length === 1 ? '1 set open' : `${cards.length} sets open`}</span>
      </div>
      <p className="fd-ev-section-lede">
        Sets cut from the calendar: ten cards the day before a fixture starts, ten the day after it ends, and a
        free five-card recap the morning after. Untimed, no opponent.
      </p>
      <div className="fd-ev-grid fd-fx-grid">
        {cards.map(({ event, kind }) => (
          <FixtureCard key={`${kind}:${event.id}`} event={event} kind={kind} now={now} tzOffsetMinutes={tzOffsetMinutes} go={go} />
        ))}
      </div>
    </section>
  );
}

export function FixtureCard({
  event,
  kind,
  now,
  tzOffsetMinutes,
  go,
}: {
  event: CalendarEvent;
  kind: FixtureKind;
  now: number;
  tzOffsetMinutes: number;
  go: (tab: string) => void;
}) {
  const { press, cue } = useEventsPress();
  const wallet = useWalletContext();
  const label = fixtureLabel(event, kind) as string;
  const when = countdownCopy(event, now, { tzOffsetMinutes }) as string;
  const size = SIZE[kind];
  const recap = kind === 'recap';
  // The recap's price line is the wallet's truth: free until played today, then the ordinary
  // practice entry, priced in coins from the config and never sprung at the tap.
  const free = recap && (!wallet || !wallet.loaded || wallet.recapFree);
  const entry = wallet?.config.practiceEntry ?? 10;
  const price = recap
    ? free
      ? 'Free today'
      : `Recap played today. Play it again for ${entry} coins or one ad`
    : `${entry} coins or one ad`;

  const play = () => {
    cue('select', 'medium');
    armFixtureDeal({ eventId: event.id, kind, label, topic: event.topic, size });
    go('discovery');
  };

  return (
    <article className="fd-ev-card fd-fx-card" data-domain={event.domain} data-kind={kind}>
      <div className="fd-ev-card-top">
        <TopicChip topic={event.topic} domain={event.domain} />
        {when ? <span className="fd-ev-when">{when}</span> : null}
      </div>
      <p className="fd-fx-kicker">
        {recap ? <Gift aria-hidden="true" /> : kind === 'kickoff' ? <CalendarClock aria-hidden="true" /> : <Trophy aria-hidden="true" />}
        {recap ? 'Yesterday' : kind === 'kickoff' ? 'Kick-off set' : 'Full-time set'}
      </p>
      <h3 className="fd-ev-name">{event.name}</h3>
      <p className="fd-fx-meta">
        <span className="fd-mono">{size} cards</span>
        <span aria-hidden="true">·</span>
        <span data-free={free || undefined}>{price}</span>
      </p>
      <div className="fd-ev-card-foot">
        <button type="button" className="fd-ev-play fd-ev-pressable" data-kind={recap && free ? 'mode' : 'topic'} {...press} onClick={play}>
          <Play aria-hidden="true" />
          <span className="fd-ev-play-body">
            <strong>Play the set</strong>
            <small>{label}</small>
          </span>
        </button>
      </div>
    </article>
  );
}
