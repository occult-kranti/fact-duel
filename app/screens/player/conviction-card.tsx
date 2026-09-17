'use client';
/**
 * Conviction card — the badge the expedition betting mode mints, and the only surface on the
 * profile that states what that badge measures.
 *
 * Two properties of the underlying numbers shape every line here.
 *
 * The badge is a high-water mark and the number beside it is not, so the two can disagree: 30 Called
 * cards at 28 right earns Dead eye, and 30 more at 40% drops the live number to 1313 without taking
 * the badge back. A card printing `Dead eye 1313` with nothing explaining it is the defect this
 * layout exists to prevent, so both are printed, both are labelled, and the disagreement gets its
 * own sentence (spec §2.4, §2.5).
 *
 * And this device has never seen another player's answers, so nothing here may read as a ranking.
 * Every fraction carries its denominator and its scope in the same sentence; no percentage is
 * offered at all; and a fraction is never printed over a zero denominator — the copy switches to a
 * sentence instead, so `0 of 0` is unreachable however the tallies fall (spec §2.5, §2.6).
 *
 * Laid out from tokens rather than from Arena Rank's class names: those are a rank's vocabulary, and
 * this badge is not a rank.
 */
import { Crosshair } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  CONVICTION_MIN_CALLS,
  CONVICTION_MIN_CARDS,
  CONVICTION_TIERS,
  convictionCalls,
  convictionIndex,
  convictionRating,
  convictionRiskCalls,
  convictionRiskLanded,
  convictionTier,
} from '@/lib/progression.mjs';
import { Meter } from './shared';

type Tier = { id: string; label: string; min: number };
const TIERS = CONVICTION_TIERS as ReadonlyArray<Tier>;
const CEILING = 2000; // convictionRating clamps here, so it is the denominator every number carries

const HEAD: CSSProperties = { display: 'flex', alignItems: 'center', gap: 13 };
const MARK: CSSProperties = {
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  width: 54,
  height: 54,
  color: 'var(--cyan-text)',
};
const NAME: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 };
const BADGE: CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-22)', lineHeight: 1.1 };
const SUB: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  // A sentence ("Your badge appears at N called facts"), not a label: the mobile gate holds body
  // text at 14px and an inline style is the one place CSS cannot reach (scripts/mobile-gate.mjs).
  fontSize: 'var(--fs-14)',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--muted)',
};
const LINES: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 'var(--fs-14)',
  fontVariantNumeric: 'tabular-nums',
};
const QUIET: CSSProperties = { color: 'var(--muted)' };

/** Only the six tallies and the high-water mark are read; `recent` and `counted` belong elsewhere. */
type Conviction = {
  steady: { n: number; correct: number };
  bold: { n: number; correct: number };
  called: { n: number; correct: number };
  best: string;
  bestAt: number | null;
};

export function ConvictionCard({ progression }: { progression: { conviction: Conviction } }) {
  const c = progression.conviction;
  const calls: number = convictionCalls(c);
  const riskCalls: number = convictionRiskCalls(c);
  const landed: number = convictionRiskLanded(c);
  const rating: number = convictionRating(c);
  const steadyCalls: number = c.steady.n;
  const steadyLanded: number = c.steady.correct;
  const badgeIndex: number = convictionIndex(c.best);
  const badge = TIERS[badgeIndex];
  // The tier today's tallies actually support. Below CONVICTION_MIN_CALLS it is the ceiling the
  // Steady-only rule is stated against, which is what keeps that sentence true at 30 cards, where
  // the cap is Hunch rather than Provisional.
  const cap = convictionTier(c) as Tier;
  const earned = calls >= CONVICTION_MIN_CARDS;
  const atRisk = riskCalls > 0;
  return (
    <section className="fd-card" aria-labelledby="fd-conviction-h">
      <span className="fd-card-label" id="fd-conviction-h">
        <Crosshair aria-hidden="true" /> Conviction
      </span>
      <div style={HEAD}>
        <span style={MARK} aria-hidden="true">
          <ConvictionMark steps={badgeIndex} />
        </span>
        <span style={NAME}>
          <strong style={BADGE}>{badge.label}</strong>
          <span style={SUB}>
            {c.bestAt === null
              ? `Your badge appears at ${CONVICTION_MIN_CARDS} called facts`
              : `Best reached · earned at ${c.bestAt} of ${CEILING}`}
          </span>
        </span>
      </div>

      {earned ? (
        <>
          <Meter
            value={rating / CEILING}
            tone="var(--cyan-text)"
            label={`Conviction now ${rating} of ${CEILING}`}
          />
          <div style={LINES}>
            <p>
              {atRisk ? `Calls above Steady: ${landed} of ${riskCalls} right.` : 'No calls above Steady yet.'}
            </p>
            <p>{steadyCalls > 0 ? `Steady: ${steadyLanded} of ${steadyCalls}.` : 'No Steady cards yet.'}</p>
            <p>
              Conviction now: {rating} of {CEILING} — the average points your calls have scored, on this
              device.
            </p>
            {rating < badge.min && (
              <p style={QUIET}>
                Your badge keeps the highest tier you have reached; the number moves with your recent calls.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <Meter
            value={calls / CONVICTION_MIN_CARDS}
            tone="var(--cyan-text)"
            label={`${calls} of ${CONVICTION_MIN_CARDS} distinct expedition facts called`}
          />
          <div style={LINES}>
            <p>
              {calls} of {CONVICTION_MIN_CARDS} distinct expedition facts called. Your badge appears at{' '}
              {CONVICTION_MIN_CARDS}.
            </p>
            <p>
              Of those, {riskCalls} were called above Steady — the badge needs {CONVICTION_MIN_CALLS}
              {riskCalls >= CONVICTION_MIN_CALLS ? ', already met' : ''}.
            </p>
            {/* The line above already states the zero; a `0 of 0` is unreachable here because the
                fraction is only printed once a call above Steady has actually resolved. */}
            {atRisk && (
              <p>
                Calls above Steady so far: {landed} of {riskCalls}.
              </p>
            )}
            <p style={QUIET}>Earned on this device. Replays do not count.</p>
          </div>
        </>
      )}

      {/* Spec §2.4 writes "nothing yet to be right or wrong about" for the Steady-only player, and it
          is only true of that player: once a call has resolved, the block above has already printed how
          many of them landed, and the same sentence would deny the fraction beside it. */}
      {riskCalls < CONVICTION_MIN_CALLS && (
        <p className="fd-disclaimer">
          {riskCalls === 0
            ? `Conviction is about the calls you make above Steady. Steady-only play stays ${cap.label} — there is nothing yet to be right or wrong about.`
            : `Conviction is about the calls you make above Steady: ${riskCalls} of the ${CONVICTION_MIN_CALLS} the badge needs so far.`}
        </p>
      )}
      <p className="fd-disclaimer">
        Counts the first time each fact appears in an expedition; replays never move it. Facts you learned
        elsewhere first still count — this measures whether your calls match what you know, not how you came
        to know it.
      </p>
      <p className="fd-disclaimer">
        On this device · not a comparison against other players — there is no leaderboard.
      </p>
    </section>
  );
}

/* One tick per tier step, so Provisional is a bare ring and Dead eye is a full five. The badge name
   sits beside it in text: the ticks repeat that, they never carry it alone. */
function ConvictionMark({ steps }: { steps: number }) {
  const n = Math.max(0, Math.min(TIERS.length - 1, steps));
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
      <circle
        cx="24"
        cy="24"
        r="19"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="24"
        cy="24"
        r="11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <circle cx="24" cy="24" r="3.2" fill="currentColor" />
      {Array.from({ length: n }, (_, i) => {
        const a = (-90 + i * 72) * (Math.PI / 180);
        return (
          <circle key={i} cx={24 + 19 * Math.cos(a)} cy={24 + 19 * Math.sin(a)} r="2.6" fill="currentColor" />
        );
      })}
    </svg>
  );
}
