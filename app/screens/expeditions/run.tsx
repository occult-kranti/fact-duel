'use client';
/**
 * The expedition run: map rail, Steady/Bold switch, shape-coded answers, explanation card.
 *
 * Untimed surface, so entrances are allowed here (unlike the live duel question). All feedback goes
 * through `useJuice()`; the legacy `signal` prop is still accepted by the module but no longer used
 * for correct / learn / stamp so nothing double-fires.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ExternalLink,
  Flag,
  Flame,
  Pause,
  Shield,
  Trophy,
  X,
} from 'lucide-react';
import { reducedMotion, useJuice } from '@/components/fx';
import { CONFIDENCE, runResult } from '@/lib/expeditions.mjs';
import { XP } from '@/lib/progression.mjs';
import { QuestionIssue } from '../../rivalry-widgets';
import { ExpeditionFinish } from './finish';
import { AnswerShape, RouteRail, signed, useTap } from './parts';

const STAKE_COPY: Record<string, string> = {
  steady: 'Steady: +2 if you are right, nothing lost if you are not.',
  bold: 'Bold: +3 if you are right, −1 if you are not.',
};

export function ExpeditionRun({
  route,
  record,
  player,
  onReplay,
  busy,
  onDone,
  onDuel,
}: {
  route: any;
  record: any;
  player: any;
  onReplay: () => void;
  busy: boolean;
  onDone: () => void;
  onDuel: () => void;
}) {
  const juice = useJuice();
  const tap = useTap();
  const run = record.run,
    index = run.cursor,
    fact = run.cards[index],
    answer = run.answers[index],
    result = runResult(run);
  const [confidence, setConfidence] = useState('steady'),
    [writing, setWriting] = useState(false),
    [issueOpen, setIssueOpen] = useState(false);
  const locked = useRef(false),
    heading = useRef<HTMLHeadingElement | null>(null),
    focusKey = useRef(''),
    burstTarget = useRef<Element | null>(null),
    card = useRef<HTMLDivElement | null>(null),
    feedback = useRef<HTMLDivElement | null>(null),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Answers already on screen when this run mounted have had their feedback: never replay them.
  const celebrated = useRef(new Set<number>(run.answers.map((_: any, i: number) => i)));
  const finished = useRef(index === 6);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  // Result juice, fired once per answer as it lands in the profile (never on re-render or resume).
  useEffect(() => {
    run.answers.forEach((a: any, i: number) => {
      if (celebrated.current.has(i)) return;
      celebrated.current.add(i);
      const hit = a.choice === run.cards[i].correctIndex;
      const target = burstTarget.current ?? card.current;
      burstTarget.current = null;
      if (!target) return;
      if (hit) {
        juice.burst(target, 'correct');
        const xp = a.confidence === 'bold' ? XP.expeditionBoldCorrect : XP.expeditionCorrect;
        timers.current.push(setTimeout(() => juice.floatText(target, `+${xp} XP`), 150));
      } else {
        juice.burst(target, 'wrong');
      }
    });
  }, [run.answers, run.cards, juice]);

  useEffect(() => {
    setConfidence('steady');
    locked.current = false;
    setIssueOpen(false);
  }, [index]);

  const answered = !!answer;
  // Bring the explanation (and its Next button) into the thumb zone once an answer lands.
  useEffect(() => {
    if (!answered) return;
    const t = setTimeout(() => {
      feedback.current?.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }, 280);
    return () => clearTimeout(t);
  }, [answered, index]);
  useEffect(() => {
    const key = `${index}:${answered}`;
    if (focusKey.current === key) return;
    focusKey.current = key;
    heading.current?.focus();
  }, [index, answered]);

  async function act(type: string, extra: any = {}) {
    if (locked.current || !player.loaded) return;
    locked.current = true;
    setWriting(true);
    try {
      await player.dispatch({
        type,
        routeId: route.id,
        runId: run.id,
        index,
        epoch: player.profile.epoch,
        ...extra,
      });
    } finally {
      locked.current = false;
      setWriting(false);
    }
  }

  if (index === 6)
    return (
      <ExpeditionFinish
        route={route}
        record={record}
        result={result}
        run={run}
        busy={busy}
        loaded={player.loaded}
        firstRun={!finished.current && record.completions === 1}
        onDone={onDone}
        onDuel={onDuel}
        onReplay={onReplay}
      />
    );

  const correct = answer?.choice === fact.correctIndex,
    points = answer ? (CONFIDENCE as any)[answer.confidence][correct ? 'correct' : 'wrong'] : 0,
    roundId = `journey:${run.id}:${index}`,
    chapter = Math.floor(index / 2),
    active = answer?.confidence || confidence,
    goal = index >= 4,
    saved = player.journal.saved.includes(fact.question);

  return (
    <div className={`fd-exp-run${goal ? ' is-goal' : ''}`} ref={card}>
      <div className="fd-exp-run-top">
        <div>
          <p className="fd-exp-eyebrow">{route.title}</p>
          <h1>{route.chapters[chapter]}</h1>
        </div>
        <div className="fd-exp-runscore">
          <span>RUN SCORE</span>
          <strong className="fd-mono">{signed(result.score)}</strong>
        </div>
      </div>

      <RouteRail route={route} cursor={index} variant="rail" />

      <div className="fd-exp-question">
        <div className="fd-exp-qmeta">
          <span className="fd-mono">CARD {index + 1} / 6</span>
          <span>{['Opening level', 'Deeper cut', 'Final detail'][chapter]}</span>
        </div>
        <h2 ref={heading} tabIndex={-1}>
          {fact.question}
        </h2>

        <fieldset className="fd-exp-conf" disabled={!!answer || writing || !player.loaded}>
          <legend>How sure are you?</legend>
          <div className="fd-exp-switch" data-on={active}>
            <span className="fd-exp-switch-thumb" aria-hidden="true" />
            {(['steady', 'bold'] as const).map((id) => (
              <button
                type="button"
                key={id}
                className="fd-exp-switch-btn"
                aria-pressed={active === id}
                onPointerDown={tap}
                onClick={() => setConfidence(id)}
              >
                {id === 'bold' ? (
                  <Flame size={16} aria-hidden="true" />
                ) : (
                  <Shield size={16} aria-hidden="true" />
                )}
                {(CONFIDENCE as any)[id].name}
              </button>
            ))}
          </div>
          <p className="fd-exp-stake-line">{STAKE_COPY[active]}</p>
        </fieldset>

        <div className="fd-exp-answers">
          {fact.options.map((option: string, i: number) => {
            const chosen = answer?.choice === i;
            const isKey = !!answer && i === fact.correctIndex;
            return (
              <button
                type="button"
                key={`${index}-${i}`}
                className={`fd-exp-answer o${i + 1}${chosen ? ' is-chosen' : ''}${
                  isKey ? ' is-key' : ''
                }${answer && !chosen && !isKey ? ' is-dim' : ''}`}
                style={{ animationDelay: `${i * 45}ms` }}
                disabled={!!answer || writing || !player.loaded}
                aria-pressed={chosen}
                onPointerDown={(e) => {
                  burstTarget.current = e.currentTarget;
                  tap();
                }}
                onClick={() => void act('journey-answer', { choice: i, confidence })}
              >
                <AnswerShape index={i} />
                <span className="fd-exp-answer-text">{option}</span>
                {isKey && <Check size={19} aria-hidden="true" className="fd-exp-answer-mark" />}
                {chosen && !isKey && <X size={19} aria-hidden="true" className="fd-exp-answer-mark" />}
              </button>
            );
          })}
        </div>

        {!answer && (
          <p className="fd-exp-contract-line">
            {goal
              ? index === 5
                ? 'Last card. Answer it to finish the route and collect your stamp.'
                : 'Two cards from the stamp. Keep going.'
              : 'Your first answer locks. No timer — take your time.'}
          </p>
        )}

        {answer && (
          <div ref={feedback} className={`fd-exp-feedback${correct ? ' is-correct' : ' is-wrong'}`}>
            <div className="fd-exp-feedback-top" role="status">
              <strong>{correct ? 'That’s the one.' : 'A fact for the vault.'}</strong>
              <span className="fd-mono">
                {signed(points)} pts · {answer.confidence === 'bold' ? 'Bold' : 'Steady'}
              </span>
            </div>
            <p className="fd-exp-key">
              <b>Correct answer:</b> {fact.options[fact.correctIndex]}
            </p>
            <details
              className="fd-exp-why"
              onToggle={(e) => {
                if (e.currentTarget.open) player.open(roundId);
              }}
            >
              <summary onPointerDown={tap}>
                <BookOpen size={17} aria-hidden="true" />
                Why this answer?
              </summary>
              <p>{fact.explanation}</p>
            </details>
            <div className="fd-exp-tools">
              <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" onPointerDown={tap}>
                <ExternalLink size={15} aria-hidden="true" />
                {fact.sourceLabel}
              </a>
              <button
                type="button"
                aria-pressed={saved}
                className={saved ? 'is-on' : ''}
                onPointerDown={tap}
                onClick={() => player.save(fact.question)}
              >
                <Bookmark size={16} aria-hidden="true" />
                {saved ? 'Saved' : 'Save fact'}
              </button>
              <button type="button" onPointerDown={tap} onClick={() => setIssueOpen(true)}>
                <Flag size={16} aria-hidden="true" />
                Flag a concern
              </button>
            </div>
            {index === 0 && (
              <p className="fd-exp-endowed">
                <Check size={15} aria-hidden="true" />
                Camp 1 reached — you are on the map.
              </p>
            )}
            {index % 2 === 1 && (
              <p className="fd-exp-endowed">
                <Check size={15} aria-hidden="true" />
                {index === 5
                  ? 'All six cards answered. Finish to collect your stamp.'
                  : `Chapter ${chapter + 1} complete. Next: ${route.chapters[chapter + 1]}.`}
              </p>
            )}
            <button
              type="button"
              className="fd-exp-primary fd-exp-next"
              disabled={writing || !player.loaded}
              onPointerDown={tap}
              onClick={() => void act('journey-next')}
            >
              {writing
                ? 'Saving…'
                : index === 5
                  ? 'Finish & collect stamp'
                  : index % 2 === 1
                    ? `Begin chapter ${chapter + 2}`
                    : 'Next card'}
              {index === 5 ? (
                <Trophy size={19} aria-hidden="true" />
              ) : (
                <ArrowRight size={19} aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="fd-exp-pause">
        <button type="button" className="fd-exp-ghost" disabled={writing} onPointerDown={tap} onClick={onDone}>
          <Pause size={16} aria-hidden="true" />
          Pause expedition
        </button>
        <span>
          {player.persistent
            ? 'Each answer saves in this browser.'
            : 'Visit-only progress. Export before leaving.'}
        </span>
      </div>

      <QuestionIssue
        open={issueOpen}
        onOpenChange={setIssueOpen}
        fact={fact}
        roundId={roundId}
        player={player}
      />
    </div>
  );
}
