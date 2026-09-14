'use client';
/**
 * Mastery — accuracy per topic straight from `progression.counters.byTopic`, grouped into the two
 * domains and painted in the domain colours (sports = ember, science = cyan). Topics with no rounds
 * yet show an empty bar and say so rather than implying a score.
 */
import { Atom, Trophy } from 'lucide-react';
import { TOPIC_DOMAINS } from '@/lib/journal.mjs';
import { Meter } from './shared';

/* The bars are data, so they take the accent's text twin (identical in dark, legible on light). */
const DOMAINS = [
  { id: 'sports', label: 'Sports', icon: Trophy, tone: 'var(--ember-text)' },
  { id: 'science', label: 'Science', icon: Atom, tone: 'var(--cyan-text)' },
] as const;

const domains = TOPIC_DOMAINS as Record<string, string>;

export function Mastery({ progression }: { progression: any }) {
  const byTopic: Record<string, { rounds: number; correct: number }> = progression.counters.byTopic ?? {};
  return (
    <div className="fd-mastery">
      {DOMAINS.map(({ id, label, icon: Icon, tone }) => {
        const topics = Object.keys(byTopic).filter((t) => domains[t] === id);
        const rounds = topics.reduce((n, t) => n + byTopic[t].rounds, 0);
        const correct = topics.reduce((n, t) => n + byTopic[t].correct, 0);
        return (
          <section className="fd-card fd-mastery-card" data-domain={id} key={id}>
            <span className="fd-card-label">
              <Icon aria-hidden="true" /> {label}
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                {rounds ? `${Math.round((100 * correct) / rounds)}% of ${rounds}` : 'No rounds yet'}
              </span>
            </span>
            <div>
              {topics.map((topic) => {
                const t = byTopic[topic];
                const pct = t.rounds ? t.correct / t.rounds : 0;
                return (
                  <div className="fd-topic" key={topic}>
                    <strong>{topic}</strong>
                    <span>{t.rounds ? `${t.correct}/${t.rounds}` : '—'}</span>
                    <Meter value={pct} tone={tone} label={`${topic} accuracy`} />
                  </div>
                );
              })}
            </div>
            {!rounds && (
              <p className="fd-disclaimer">
                Nothing recorded yet — a duel round in any {label.toLowerCase()} topic starts these bars.
                Expedition cards are recorded in your Vault and your Conviction, not here.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
