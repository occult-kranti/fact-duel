'use client';
/**
 * Expedition finish — stamp ceremony (first completion only), scorecard, first-vs-best, recap.
 *
 * The ceremony is opened through `useJuice()` with the 3D stamp medal in the slot; it closes with
 * Escape or Continue (handled by `<Ceremony>`), leaving the scorecard behind it.
 */
import { useEffect, useRef } from 'react';
import { Check, ExternalLink, RotateCcw, Stamp, Swords, X } from 'lucide-react';
import { NumberCounter, useFx, useJuice } from '@/components/fx';
import { LazyRewardMedal } from '@/components/three';
import { CONFIDENCE } from '@/lib/expeditions.mjs';
import { XP } from '@/lib/progression.mjs';
import { ExpeditionStamp, signed, useTap } from './parts';

/* Cyan token value: the 3D scene takes a colour, not a CSS variable. */
const CYAN = '#4ee1ff';

export function ExpeditionFinish({
  route,
  record,
  result,
  run,
  busy,
  loaded,
  firstRun,
  onDone,
  onDuel,
  onReplay,
}: {
  route: any;
  record: any;
  result: { score: number; correct: number; bold: number };
  run: any;
  busy: boolean;
  loaded: boolean;
  firstRun: boolean;
  onDone: () => void;
  onDuel: () => void;
  onReplay: () => void;
}) {
  const juice = useJuice();
  const fx = useFx();
  const tap = useTap();
  const heading = useRef<HTMLHeadingElement | null>(null);
  const opened = useRef(false);
  const myId = useRef<string | null>(null);
  const seen = useRef(false);
  const attempts = useRef(0);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  /* The stamp ceremony, once, on the first completion of this route. `<FxProvider>` shows one
   * ceremony at a time and a new one REPLACES the open one, so: wait for a free overlay (the same
   * finish can also trigger a level-up from useProgressionFeedback), and if ours is replaced before
   * it ever reached the screen, arm it again. */
  const active = fx?.ceremony ?? null;
  const busyOverlay = !!active;
  useEffect(() => {
    if (!myId.current) return;
    if (active?.id === myId.current) seen.current = true;
    else if (!seen.current && attempts.current < 3) {
      myId.current = null;
      opened.current = false;
    }
  }, [active]);

  useEffect(() => {
    if (opened.current || !firstRun || busyOverlay) return;
    const completionXp =
      XP.expeditionComplete + Math.max(0, result.score) * XP.expeditionScorePoint + XP.expeditionStamp;
    const t = setTimeout(() => {
      if (opened.current) return;
      opened.current = true;
      attempts.current += 1;
      myId.current = juice.ceremony({
        kind: 'stamp',
        kicker: 'STAMP COLLECTED',
        title: route.stamp,
        subtitle: `${route.title} · ${result.correct}/6 correct`,
        rewards: [
          { label: 'Run score', value: signed(result.score) },
          { label: 'Completion XP', icon: '⚡', value: `+${completionXp}` },
        ],
        continueLabel: 'See your scorecard',
        slot: (
          <LazyRewardMedal variant="stamp" accent={CYAN} replayKey={route.id} size={1.15} height={132} />
        ),
      });
    }, 280);
    return () => clearTimeout(t);
  }, [firstRun, busyOverlay, juice, route.stamp, route.title, route.id, result.score, result.correct]);

  const first = record.first ?? result;
  const best = record.best ?? first;
  const repeat = record.completions > 1;

  return (
    <div className="fd-exp-finish">
      <div className="fd-exp-award">
        <ExpeditionStamp route={route} earned />
        <p className="fd-exp-eyebrow">EXPEDITION COMPLETE</p>
        <h1 ref={heading} tabIndex={-1}>
          {route.stamp}
        </h1>
        <p className="fd-exp-lede">
          {record.completions === 1 ? 'A new story in your collection.' : 'Another practice run, complete.'}
        </p>
        <span className="fd-exp-earned">
          <Check size={16} aria-hidden="true" />
          {record.completions === 1 ? 'Stamp earned' : 'Stamp already collected'}
        </span>
      </div>

      <div className="fd-exp-scorecard">
        <div>
          <span>THIS RUN</span>
          <strong className="fd-mono">
            <NumberCounter
              value={result.score}
              from={0}
              duration={900}
              format={(n) => signed(Math.round(n))}
            />
            <small>points</small>
          </strong>
        </div>
        <div>
          <span>CORRECT</span>
          <strong className="fd-mono">
            <NumberCounter value={result.correct} from={0} duration={700} />
            <small>/ 6</small>
          </strong>
        </div>
        <div>
          <span>BOLD PICKS</span>
          <strong className="fd-mono">
            <NumberCounter value={result.bold} from={0} duration={700} />
            <small>/ 6</small>
          </strong>
        </div>
      </div>

      <div className="fd-exp-compare">
        <span>
          First completed run
          <strong className="fd-mono">
            {signed(first.score)} pts · {first.correct}/6
          </strong>
        </span>
        <span>
          {repeat ? 'Best completed run' : 'Completed runs'}
          <strong className="fd-mono">
            {repeat ? `${signed(best.score)} pts · ${record.completions} runs` : '1 · first run saved'}
          </strong>
        </span>
      </div>

      <p className="fd-exp-note">
        Your stamp marks completion, regardless of score. Replay uses the same six questions; scores are
        local practice, not a ranking.
      </p>

      <div className="fd-exp-finish-actions">
        <button type="button" className="fd-exp-primary" onPointerDown={tap} onClick={onDone}>
          <Check size={19} aria-hidden="true" />
          Done — back to expeditions
        </button>
        <button type="button" className="fd-exp-secondary" onPointerDown={tap} onClick={onDuel}>
          <Swords size={18} aria-hidden="true" />
          Duel this topic
        </button>
        <button
          type="button"
          className="fd-exp-ghost"
          disabled={busy || !loaded}
          onPointerDown={tap}
          onClick={onReplay}
        >
          <RotateCcw size={17} aria-hidden="true" />
          {busy ? 'Opening…' : 'Replay for practice'}
        </button>
      </div>

      <section className="fd-exp-recap">
        <h2>
          <Stamp size={17} aria-hidden="true" />
          The six facts you travelled through.
        </h2>
        {run.cards.map((f: any, i: number) => {
          const a = run.answers[i],
            hit = a.choice === f.correctIndex,
            points = (CONFIDENCE as any)[a.confidence][hit ? 'correct' : 'wrong'];
          return (
            <details key={f.factId}>
              <summary onPointerDown={tap}>
                <span className={hit ? 'fd-exp-hit' : 'fd-exp-miss'} aria-hidden="true">
                  {hit ? <Check size={15} /> : <X size={15} />}
                </span>
                <span className="fd-exp-recap-q">{f.question}</span>
                <strong className="fd-mono">{signed(points)}</strong>
              </summary>
              <div>
                <p>
                  <b>Your answer:</b> {f.options[a.choice]} · {a.confidence === 'bold' ? 'Bold' : 'Steady'}
                </p>
                <p>
                  <b>Correct answer:</b> {f.options[f.correctIndex]}
                </p>
                <p>{f.explanation}</p>
                <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {f.sourceLabel}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
