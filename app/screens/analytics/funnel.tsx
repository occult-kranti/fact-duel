'use client';
/**
 * The first-time funnel: five ordered steps, each with the day it happened or "Not yet".
 *
 * Every step is one stamp in `analytics.funnel`, written the first time the matching counter moved
 * — so the wording here describes the event that actually writes the stamp, not a nicer-sounding
 * one. A step that has not happened prints "Not yet"; it never borrows a date from a later step.
 */
import { formatStamp } from './util';

export type Funnel = {
  readonly firstOpenAt: number;
  readonly firstAnswerAt: number;
  readonly firstMatchAt: number;
  readonly firstExpeditionAt: number;
  readonly firstReturnAt: number;
};

const STEPS = [
  {
    key: 'firstOpenAt',
    title: 'First open',
    note: 'The first time the app was opened in this browser.',
  },
  {
    key: 'firstAnswerAt',
    title: 'First answer',
    note: 'The first duel round played through to its reveal.',
  },
  { key: 'firstMatchAt', title: 'First match', note: 'The first duel that reached a final result.' },
  {
    key: 'firstExpeditionAt',
    title: 'First expedition card',
    note: 'The first expedition card answered.',
  },
  {
    key: 'firstReturnAt',
    title: 'First return',
    note: 'The first session on a later day than install day.',
  },
] as const;

export function FunnelList({ funnel }: { funnel: Readonly<Partial<Funnel>> }) {
  return (
    <ol className="fd-an-funnel">
      {STEPS.map((step, i) => {
        const at = funnel[step.key] ?? 0;
        const done = at > 0;
        return (
          <li key={step.key} className="fd-an-funnel-step" data-done={done ? 'on' : undefined}>
            <span className="fd-an-funnel-dot fd-mono" aria-hidden="true">
              {i + 1}
            </span>
            <span className="fd-an-funnel-body">
              <span className="fd-an-funnel-title">{step.title}</span>
              <span className="fd-an-funnel-note">{step.note}</span>
            </span>
            <span className="fd-an-funnel-when fd-mono">{done ? formatStamp(at) : 'Not yet'}</span>
          </li>
        );
      })}
    </ol>
  );
}
