'use client';
/**
 * The live question surface — the one screen with hard rules (design bible §"The timed question
 * surface"):
 *
 *   • the card mounts `visibility: hidden` and only becomes visible on the reveal marker
 *     (`shown`, set by the double-rAF useLayoutEffect in arena.tsx). No entrance animation, no
 *     layout shift, no canvas, no decorative motion while a question is live;
 *   • the timer track keeps `transition: none` so the bar can never lag the clock;
 *   • answers lock on pointer release or a 1–4 keypress. The press scale is CSS `:active`, so
 *     nothing defers the click;
 *   • option order is fixed, and correctness styling only appears once `round.result` exists.
 *
 * Juice happens on lock (press cue) and on the result (burst / float / shake) — never on mount.
 */
import { useEffect, useRef, useState } from 'react';
import { particles, useJuice } from '@/components/fx';
import { FORMAT_COPY } from '@/lib/duel-presentation.mjs';
import { Lock } from 'lucide-react';
import { AnswerButton, usePress } from './room-bits';
import { comboAt, roundXp, speedBonus } from './room-math';
import { useLocale } from '../../use-locale';

const HOT_MS = 3000;

export function QuestionStage({
  room,
  rd,
  question,
  shown,
  chosen,
  isLocked,
  answerPending,
  remaining,
  startMark,
  pendingAnswer,
  onAnswer,
  onExpire,
  onRetry,
}: {
  room: any;
  rd: any;
  question: any;
  shown: boolean;
  chosen: number | null;
  isLocked: boolean;
  answerPending: boolean;
  remaining: number;
  startMark: { current: { roundId: string; at: number } | null };
  pendingAnswer: { current: any };
  onAnswer: (choice: number) => void;
  onExpire: () => void;
  onRetry: () => void;
}) {
  const juice = useJuice();
  const press = usePress();
  const { t, pick, topic } = useLocale();
  const duration = room.config.duration * 1000;
  const result = rd?.result ?? null;
  const cardRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fired = useRef<Set<string>>(new Set());

  /* ---- clock: one 50 ms tick feeds the digits, the track and the speed bar ---- */
  const [left, setLeft] = useState(duration);
  const leftRef = useRef(duration);
  leftRef.current = left;
  const running = shown && !result;
  useEffect(() => {
    setLeft(duration);
    leftRef.current = duration;
  }, [rd.id, duration]);
  useEffect(() => {
    if (!running) return;
    let done = false;
    const tick = () => {
      const mark = startMark.current;
      if (!mark || mark.roundId !== rd.id) return;
      const value = Math.max(0, duration - (performance.now() - mark.at));
      setLeft(value);
      if (value === 0 && !done) {
        done = true;
        onExpire();
      }
    };
    tick();
    const timer = setInterval(tick, 50);
    return () => clearInterval(timer);
  }, [startMark, rd.id, duration, running, onExpire]);

  /* ---- the speed-bonus bar freezes the moment this device locks an answer ---- */
  const [lockedElapsed, setLockedElapsed] = useState<number | null>(null);
  useEffect(() => setLockedElapsed(null), [rd.id]);
  useEffect(() => {
    if (!isLocked) return;
    setLockedElapsed((v) => (v === null ? Math.max(0, duration - leftRef.current) : v));
  }, [isLocked, duration]);
  const elapsed = lockedElapsed ?? duration - left;
  const bonus = speedBonus(elapsed);

  /* ---- focus follows the lock: the audit found it dropping to <body> ----
   * Locking disables every answer button, so the browser drops focus to <body>. Move it to the
   * status line instead. Never steal focus from a modal (a ceremony overlay can be open over the
   * room) and never from somewhere the player moved it to deliberately. */
  useEffect(() => {
    if (!isLocked) return;
    const el = statusRef.current;
    if (!el || document.querySelector('[aria-modal="true"]')) return;
    const active = document.activeElement as HTMLElement | null;
    const inCard = !!active && !!cardRef.current?.contains(active);
    if (active && active !== document.body && !inCard) return;
    el.tabIndex = -1;
    el.focus({ preventScroll: true });
  }, [isLocked]);

  /* ---- result layer: exactly once per round id. Arena already plays win/loss/draw. ---- */
  const mine = result ? (rd.receipts?.[room.seat] ?? null) : null;
  const correct = mine?.correct === true;
  const xp = result ? roundXp(room, rd) : null;
  const combo = result && correct ? comboAt(room, rd.id) : 0;
  useEffect(() => {
    if (!result || fired.current.has(rd.id)) return;
    fired.current.add(rd.id);
    const target = (chosen !== null ? optionRefs.current[chosen] : null) ?? cardRef.current ?? document.body;
    if (correct) {
      juice.burst(target, 'correct');
      if (xp) juice.floatText(target, `+${xp.total} XP`);
    } else {
      juice.burst(target, 'wrong');
    }
    if (combo >= 3) {
      const r = target.getBoundingClientRect();
      particles.ringPulse({ x: r.left + r.width / 2, y: r.top + r.height / 2, radius: 82 });
      juice.sound('combo', { n: combo });
      juice.haptic('combo');
    }
  }, [result, rd.id, chosen, correct, combo, xp, juice]);

  const format = (FORMAT_COPY as any)[room.config.mode];
  const hot = !result && left <= HOT_MS;
  const seconds = (left / 1000).toFixed(1);
  return (
    <section className="fd-qstage" data-live={result ? 'false' : 'true'}>
      <div className="fd-qtop">
        <span className="fd-qtopic">
          {topic(question.topic)} <i aria-hidden="true">/</i> {question.subtopic}
        </span>
        <span className="fd-clock" data-hot={hot ? 'true' : 'false'} aria-hidden="true">
          {seconds}
          <small>s</small>
        </span>
      </div>
      <div className="fd-track timer-track" aria-hidden="true">
        <span style={{ width: `${(100 * left) / duration}%` }} />
      </div>
      <div className="fd-speed-row" aria-hidden="true">
        <div className="fd-speed" data-spent={bonus.xp ? 'false' : 'true'}>
          <span style={{ width: `${100 * bonus.fraction}%` }} />
        </div>
        <span className="fd-speed-label">{bonus.xp ? t('q.speed', { xp: bonus.xp }) : t('q.speedGone')}</span>
      </div>

      <div
        ref={cardRef}
        className="fd-qcard question-card"
        style={{ visibility: shown ? 'visible' : 'hidden' }}
        data-result={result ? (correct ? 'correct' : 'wrong') : 'none'}
      >
        <span className="fd-qtag">
          {format.tag}
          <i aria-hidden="true">·</i>
          <b>{pick(`difficulty.${question.difficulty}`, question.difficulty)}</b>
        </span>
        <h1>{question.question}</h1>
        <div className="fd-answers">
          {question.options.map((option: string, i: number) => {
            const isChosen = chosen === i;
            const isCorrect = result && question.correctIndex === i;
            const state = !result ? 'live' : isCorrect ? 'correct' : isChosen ? 'wrong' : 'muted';
            return (
              <AnswerButton
                key={`${question.id}-${i}`}
                buttonRef={(el) => {
                  optionRefs.current[i] = el;
                }}
                index={i}
                label={option}
                className="fd-answer"
                markClassName="fd-answer-mark"
                textClassName="fd-answer-text"
                hint
                state={state}
                chosen={isChosen}
                disabled={!shown || isLocked || remaining <= 0}
                onPointerDown={press}
                onClick={() => onAnswer(i)}
                end={
                  <span className="fd-answer-end" aria-hidden="true">
                    {isChosen && !result && <Lock size={16} />}
                    {result && isCorrect && (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                        <path
                          d="m4 12.6 5.2 5.2L20 6.6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {result && state === 'wrong' && (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                        <path d="M6 6l12 12M18 6 6 18" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                }
              />
            );
          })}
        </div>
      </div>

      <div
        ref={statusRef}
        className="fd-status answer-status"
        role="status"
        data-tone={result ? (correct ? 'correct' : 'wrong') : 'live'}
      >
        {result ? (
          <>
            <strong>{correct ? t('q.correct') : mine ? t('q.notThisTime') : t('q.noAnswer')}</strong>
            {correct && xp ? (
              <span>
                +{xp.total} XP{xp.speed ? t('q.speedPart', { n: xp.speed }) : ''}
                {xp.combo >= 2 ? t('q.comboPart', { n: xp.multiplier }) : ''}
                {xp.wild > 1 ? t('q.wildPart', { n: xp.wild }) : ''}
              </span>
            ) : (
              <span>{t('q.wasAnswer', { answer: question.options[question.correctIndex] })}</span>
            )}
          </>
        ) : isLocked ? (
          <>
            <Lock size={15} />
            {rd.answerLocked[room.seat] ? t('q.sealed') : answerPending ? t('q.sending') : t('q.lockedHere')}
          </>
        ) : remaining <= 0 ? (
          t('q.timeUp')
        ) : (
          t('q.tapOnce')
        )}
      </div>

      {isLocked && !result && (
        <p className="fd-note">
          {rd.answerLocked[1 - room.seat] ? t('q.bothIn') : t('q.waitingOther')}
        </p>
      )}
      {pendingAnswer.current && !rd.answerLocked[room.seat] && !answerPending && !result && (
        <button type="button" className="fd-btn fd-retry" onPointerDown={press} onClick={onRetry}>
          {t('q.retry')}
        </button>
      )}
      {!result && <p className="fd-note">{t('q.lockNote')}</p>}
    </section>
  );
}
