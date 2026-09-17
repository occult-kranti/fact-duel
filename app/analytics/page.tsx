import type { Metadata } from 'next';
import Arena from '../arena';

export const metadata: Metadata = {
  title: 'Measurement — Jaanta Hai Kya',
  description:
    'Everything Jaanta Hai Kya records about how this device is used: sessions, active days, the day-by-day activity record and whether you came back on day 1, 7 or 30. Stored only in this browser.',
};

/**
 * `/analytics` — the measurement screen as its own address.
 *
 * The game is one client orchestrator (app/arena.tsx) that routes screens as tabs, so this route
 * renders that same orchestrator with the measurement tab already selected rather than mounting a
 * second copy of the app shell. Arena keeps the address bar in step from there.
 */
export default function AnalyticsPage() {
  return <Arena initialTab="analytics" />;
}
