'use client';
/**
 * Streak card — flame, current / best, shields, and a 14-day dot calendar.
 *
 * Honesty rule (design bible §9): the profile stores only `streak.lastDay`, so exactly two days can
 * be drawn truthfully — today, and the last day that was credited. Every other dot renders hollow
 * and the legend says why. No history is invented from `current`.
 */
import { Flame, ShieldCheck, Trophy } from 'lucide-react';
import { useMounted } from '@/components/fx';
import { dayKey } from '@/lib/progression.mjs';

const DAYS = 14;

/** The last 14 local calendar day keys, oldest first, ending today. */
function recentDays(now: number): string[] {
  const out: string[] = [];
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  for (let i = DAYS - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    out.push(dayKey(day.getTime()) as string);
  }
  return out;
}

export function StreakCard({ progression }: { progression: any }) {
  const streak = progression.streak;
  const mounted = useMounted();
  // Dates are local: only build the calendar in the browser so SSR and hydration agree.
  const days = mounted ? recentDays(Date.now()) : new Array<string>(DAYS).fill('');
  const today = mounted ? (dayKey(Date.now()) as string) : '';
  const lit = streak.current > 0 && streak.lastDay === today;
  return (
    <section className="fd-card" aria-labelledby="fd-streak-h">
      <span className="fd-card-label" id="fd-streak-h">
        <Flame aria-hidden="true" /> Day streak
      </span>
      <div className="fd-streak-top">
        <span className="fd-flame" data-lit={lit} aria-hidden="true">
          <Flame />
        </span>
        <span>
          <span className="fd-streak-figures">
            <b>{streak.current}</b>
            <span>{streak.current === 1 ? 'DAY' : 'DAYS'}</span>
          </span>
          <span className="fd-streak-meta" style={{ marginTop: 6 }}>
            <span className="fd-pill">
              <Trophy aria-hidden="true" />
              Best {streak.best}
            </span>
            <span className={streak.shields > 0 ? 'fd-pill fd-pill--shield' : 'fd-pill'}>
              <ShieldCheck aria-hidden="true" />
              {streak.shields} shield{streak.shields === 1 ? '' : 's'}
            </span>
          </span>
        </span>
      </div>
      <ul
        className="fd-cal"
        role="img"
        aria-label={
          streak.lastDay
            ? `Last ${DAYS} days. ${streak.lastDay} is the only day recorded on this device; earlier days are not stored.`
            : `Last ${DAYS} days. No day has been recorded on this device yet.`
        }
      >
        {days.map((day, i) => {
          const state = !day
            ? 'unknown'
            : day === streak.lastDay
              ? 'active'
              : day === today
                ? 'today'
                : 'unknown';
          return (
            <li
              key={day || i}
              className="fd-cal-day"
              data-state={state}
              title={
                day
                  ? state === 'active'
                    ? `${day} — recorded`
                    : state === 'today'
                      ? `${day} — today, not yet credited`
                      : `${day} — not recorded on this device`
                  : undefined
              }
            />
          );
        })}
      </ul>
      <p className="fd-legend">
        <span>
          <i data-state="active" />
          Recorded day
        </span>
        <span>
          <i data-state="today" />
          Today
        </span>
        <span>
          <i />
          Not recorded
        </span>
      </p>
      <p className="fd-disclaimer">
        {streak.shields > 0
          ? 'A shield covers your next missed day automatically — nothing to spend, nothing to lose.'
          : 'Seven days running earns a shield that covers a missed day (two at most).'}{' '}
        Only today and your last credited day are stored, so earlier dots stay hollow.
      </p>
    </section>
  );
}
