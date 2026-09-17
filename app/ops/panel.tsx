/**
 * One dashboard panel. It owns the three honest states a source can be in and renders the
 * numbers only in the third:
 *
 *   not-connected — "Not connected — set <SECRET>", with the docs link. No figures.
 *   error         — the sentence the adapter gave, and when it was tried. No figures.
 *   ok            — the children, which are the only place a number is ever printed.
 *
 * The docs link goes to the repository file, because the Worker does not serve `docs/`.
 */
import type { ReactNode } from 'react';
import { CloudOff, PlugZap, TriangleAlert } from 'lucide-react';
import { stampUtc } from './format';
import type { PanelState } from './types';

export const DOCS_URL = 'https://github.com/occult-kranti/fact-duel/blob/main/docs/ops-dashboard.md';

type Props<T> = {
  id: string;
  eyebrow: string;
  title: string;
  tone: 'traffic' | 'search' | 'adsense' | 'game';
  state: PanelState<T> | null;
  /** A one-line note beside the title — a source caveat, a lag, a currency. */
  aside?: string;
  children: (data: T & { asOf: number }) => ReactNode;
};

export function Panel<T>({ id, eyebrow, title, tone, state, aside, children }: Props<T>) {
  return (
    <section className="fd-ops-panel" data-tone={tone} aria-labelledby={`${id}-title`}>
      <div className="fd-ops-panel-head">
        <div>
          <p className="fd-ops-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        {aside ? <span className="fd-ops-aside">{aside}</span> : null}
      </div>

      {state === null ? (
        <p className="fd-ops-empty" role="status">
          Waiting for the first read.
        </p>
      ) : state.kind === 'not-connected' ? (
        <div className="fd-ops-state" data-state="off" role="note">
          <PlugZap aria-hidden="true" />
          <div>
            <p className="fd-ops-state-title">{state.reason}</p>
            <p className="fd-ops-state-note">
              This panel has no data until the secret <code>{state.secret}</code> is set on the Worker.{' '}
              <a href={DOCS_URL} target="_blank" rel="noreferrer">
                How to mint and store it
              </a>
              .
            </p>
          </div>
        </div>
      ) : state.kind === 'error' ? (
        <div className="fd-ops-state" data-state="error" role="alert">
          <CloudOff aria-hidden="true" />
          <div>
            <p className="fd-ops-state-title">Connected, but the source did not answer</p>
            <p className="fd-ops-state-note">
              {state.error} Tried at {stampUtc(state.asOf)}. Nothing is shown rather than a stale or made-up number.
            </p>
          </div>
        </div>
      ) : (
        children(state.data)
      )}
    </section>
  );
}

/** A caveat row inside an ok panel — the panel is connected, and this is the thing to know. */
export function Caveat({ children }: { children: ReactNode }) {
  return (
    <p className="fd-ops-caveat" role="note">
      <TriangleAlert aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
