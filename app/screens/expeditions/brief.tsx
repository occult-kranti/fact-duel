'use client';
/** Expedition brief — hero art, stamp preview, chapters, the two stake rules, and the CTA. */
import { ArrowRight, Stamp } from 'lucide-react';
import { ExpeditionStamp, RouteArt, RouteRail, ScoringCards, useTap } from './parts';

export function ExpeditionBrief({
  route,
  record,
  busy,
  loaded,
  onStart,
}: {
  route: any;
  record: any;
  busy: boolean;
  loaded: boolean;
  onStart: () => void;
}) {
  const tap = useTap();
  const earned = !!record?.first;
  return (
    <div className="fd-exp-brief">
      <div className="fd-exp-hero">
        <RouteArt route={route} cursor={0} className="fd-exp-hero-art" />
        <div className="fd-exp-hero-copy">
          <p className="fd-exp-eyebrow">
            {earned ? 'REVISIT THIS EXPEDITION' : 'YOUR NEXT EXPEDITION'}
            <span className="fd-exp-code">{route.code}</span>
          </p>
          <h1>{route.title}</h1>
          <p className="fd-exp-lede">{route.subtitle}</p>
          <p className="fd-exp-hero-meta">3 chapters · 6 cards · no timer</p>
        </div>
        <div className={`fd-exp-hero-stamp${earned ? ' is-earned' : ''}`}>
          <ExpeditionStamp route={route} earned={earned} />
          <small>{earned ? 'Collected' : 'Stamp preview'}</small>
        </div>
      </div>

      <div className="fd-exp-brief-grid">
        <section className="fd-exp-panel">
          <h2 className="fd-exp-panel-title">The route</h2>
          {/* A folded run keeps its cursor so the reducer can refuse late answers, but the button below
              begins at card 1 — showing 3/6 above it would promise a resume that does not exist. */}
          <RouteRail route={route} cursor={record?.folded ? 0 : record?.run?.cursor || 0} variant="list" />
        </section>
        <section className="fd-exp-panel">
          <h2 className="fd-exp-panel-title">How points work</h2>
          <ScoringCards />
          <p className="fd-exp-panel-note">
            Choose before every card. These points score this run only — they are separate from XP, coins and
            activity points.
          </p>
        </section>
      </div>

      <p className="fd-exp-contract">
        <Stamp size={18} aria-hidden="true" />
        {/* One flex item, or the <strong> becomes a column of its own and the sentence breaks apart. */}
        <span>
          Complete six cards, at any score, to collect the <strong>{route.stamp}</strong> stamp.
        </span>
      </p>

      <div className="fd-exp-cta">
        <button
          type="button"
          className="fd-exp-primary"
          disabled={busy || !loaded}
          onPointerDown={tap}
          onClick={onStart}
        >
          {busy ? 'Opening your expedition…' : 'Begin chapter 1'}
          <ArrowRight size={19} aria-hidden="true" />
        </button>
        <span>No timer, entry fee or opponent. Pause after any answer.</span>
      </div>
    </div>
  );
}
