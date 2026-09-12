'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FORMAT_COPY, completedRounds } from '@/lib/duel-presentation.mjs';
import { DuelHUD, MatchFinish, RoundReview } from '../rivalry-widgets';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  Radio,
  Timer,
  Users,
  Wifi,
} from 'lucide-react';
import type { RoomScreenProps } from './types';

/* Room: chrome (leave / mode tag / connection), HUD, lobby & between-round panel, countdown, the
 * live question and the final panel. Pure presentation over the DuelController.
 *
 * Timing contract (README): the question card mounts with `visibility: hidden` until the reveal
 * marker (`shown`, set by the double-rAF useLayoutEffect in arena.tsx). No entrance animation, no
 * layout shift, no extra work before the marker; the timer track has `transition: none`. */
export function RoomScreen({ duel, player }: RoomScreenProps) {
  const {
    room,
    phase,
    rd,
    question,
    shown,
    chosen,
    isLocked,
    answerPending,
    remaining,
    countdown,
    connected,
    busy,
    copied,
    credentials,
    matchMode,
    startMark,
    pendingAnswer,
    actions,
  } = duel;
  const {
    answer,
    ready,
    copyInvite,
    addBot,
    leaveOrBack,
    resetLocal,
    create,
    sendPending,
    expire,
    go,
    setConfig,
  } = actions;
  return (
    <section className="room-screen">
      <div className="room-bar">
        <Button variant="ghost" onClick={leaveOrBack}>
          <ArrowLeft />
          {room.settled ? 'Back to play' : 'Leave'}
        </Button>
        <span className="tag">
          {matchMode.name} · {room.roundIndex + 1} / {matchMode.rounds}
        </span>
        <span className={`connection ${connected ? '' : 'disconnected'}`}>
          <Wifi size={15} />
          <span className="connection-text">{connected ? 'Connected' : 'Reconnecting…'}</span>
        </span>
      </div>
      <DuelHUD room={room} />
      {['waiting', 'between'].includes(phase) && (
        <>
          <div className="ready-panel">
            <span className="round-symbol">
              {phase === 'between' ? <CheckCircle2 /> : room.players[1]?.kind === 'bot' ? <Bot /> : <Users />}
            </span>
            <p className="eyebrow">{phase === 'between' ? 'A MOMENT TO LEARN' : 'THE CHALLENGE IS SET'}</p>
            <h1>
              {phase === 'between'
                ? rd.result.winner === null
                  ? 'Honours even.'
                  : rd.result.winner === room.seat
                    ? 'That round is yours.'
                    : 'A fact for next time.'
                : room.players[1]
                  ? 'Ready for the first question?'
                  : 'Invite your rival.'}
            </h1>
            <p>
              {phase === 'between'
                ? 'Review the explanation below, then start the next round when you are ready.'
                : room.players[1]?.kind === 'bot'
                  ? 'Lucky Guess is ready. Its choices and response times are random.'
                  : room.players[1]
                    ? 'You both decide when to begin. One attempt each after the countdown. Stay here during play; switching away cancels the match.'
                    : 'Share the link with someone who can access this private site, or add a practice bot.'}
            </p>
            <div className="ready-actions">
              {credentials?.invite && room.players[1]?.kind !== 'bot' && (
                <Button variant="outline" onClick={copyInvite}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copied' : 'Copy room invitation'}
                </Button>
              )}
              {!room.players[1] && room.seat === 0 && (
                <Button variant="outline" onClick={addBot} disabled={busy}>
                  <Bot />
                  Add practice bot
                </Button>
              )}
            </div>
            <div className="ready-status">
              {room.players.map((p: any, i: number) => (
                <span key={i}>
                  <span className={`ready-indicator ${p?.ready ? 'ready' : ''}`}>
                    {p?.ready ? <Check size={12} /> : null}
                  </span>
                  {p?.name || 'Open seat'} · {p?.ready ? 'Ready' : p ? 'Not ready' : 'Waiting'}
                </span>
              ))}
            </div>
            <Button
              className="primary-action"
              onClick={ready}
              disabled={busy || !room.players[1] || room.players[room.seat].ready}
            >
              {busy
                ? 'Checking connection…'
                : room.players[room.seat].ready
                  ? 'Waiting for your rival…'
                  : phase === 'between'
                    ? `Start round ${room.roundIndex + 2}`
                    : 'I’m ready'}
              <ArrowRight />
            </Button>
            <p className="small-note">
              {phase === 'waiting'
                ? `${room.config.stake} demo coins each, once per match. Draws refund both.`
                : 'Your original match entry stays reserved. No new entry.'}
            </p>
          </div>
          {phase === 'between' && rd?.result && <RoundReview room={room} player={player} />}
        </>
      )}
      {['scheduled', 'playing'].includes(phase) && !question && (
        <div className="countdown-panel">
          <p className="eyebrow">ONE QUESTION. ONE ATTEMPT.</p>
          <h1>{countdown > 0 ? 'Here we go.' : 'Opening your question…'}</h1>
          <strong aria-hidden="true">{countdown > 0 ? countdown : <Radio />}</strong>
          <p role="status">
            {countdown > 0 ? 'Get ready for your question.' : 'Waiting for the question to arrive.'}
          </p>
        </div>
      )}
      {['scheduled', 'playing'].includes(phase) && question && !rd.result && (
        <div className="question-area">
          <RoundClock
            label={`${question.topic} / ${question.subtopic}`}
            start={startMark}
            roundId={rd.id}
            duration={room.config.duration * 1000}
            running={shown}
            onExpire={expire}
          />
          <div className="question-card" style={{ visibility: shown ? 'visible' : 'hidden' }}>
            <span className="question-mode-label">
              {(FORMAT_COPY as any)[room.config.mode].tag}
              <span>{question.difficulty}</span>
            </span>
            <h1>{question.question}</h1>
            <div className="answer-grid">
              {question.options.map((option: string, i: number) => (
                <Button
                  key={`${question.id}-${i}`}
                  variant="outline"
                  className={`answer-button ${chosen === i ? 'chosen' : ''}`}
                  aria-pressed={chosen === i}
                  disabled={!shown || isLocked || remaining <= 0}
                  onClick={() => answer(i)}
                >
                  <kbd>{i + 1}</kbd>
                  <span>{option}</span>
                  {chosen === i && <Lock size={17} />}
                </Button>
              ))}
            </div>
          </div>
          <div className="answer-status" role="status">
            {isLocked ? (
              <>
                <Lock size={16} />
                {rd.answerLocked[room.seat]
                  ? 'Received. Your answer is sealed.'
                  : answerPending
                    ? 'Sending your locked answer…'
                    : 'Your choice is locked on this device.'}
              </>
            ) : remaining <= 0 ? (
              'Time is up. Waiting for the round to close.'
            ) : (
              'Tap once or press 1–4. Your first answer locks.'
            )}
          </div>
          {isLocked && (
            <p className="waiting-note">
              {rd.answerLocked[1 - room.seat]
                ? 'Both answers are in. Comparing…'
                : 'Waiting for the other attempt or its time limit.'}
            </p>
          )}
          {pendingAnswer.current && !rd.answerLocked[room.seat] && !answerPending && (
            <Button className="retry-button" variant="outline" onClick={sendPending}>
              Retry sending this answer
            </Button>
          )}
          <p className="small-note">
            Answers lock on tap/click release or a 1–4 keypress. You get one attempt. A close result can be a
            draw.
          </p>
        </div>
      )}
      {['complete', 'cancelled'].includes(phase) && (
        <div className="final-panel">
          <MatchFinish
            room={room}
            onReplay={() => {
              const next = { ...room.config };
              setConfig(next);
              resetLocal();
              go('arena');
              if (next.opponent === 'bot') void create(next);
            }}
            onVault={() => {
              resetLocal();
              go('journal');
            }}
            onFinish={() => {
              resetLocal();
              go('passport');
            }}
          />
          {completedRounds(room).length > 0 && <RoundReview room={room} player={player} />}
        </div>
      )}
    </section>
  );
}

function RoundClock({
  label,
  start,
  roundId,
  duration,
  running,
  onExpire,
}: {
  label: string;
  start: { current: { roundId: string; at: number } | null };
  roundId: string;
  duration: number;
  running: boolean;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(duration);
  useEffect(() => {
    setLeft(duration);
    if (!running) return;
    let done = false;
    const tick = () => {
      const mark = start.current;
      if (!mark || mark.roundId !== roundId) return;
      const remaining = Math.max(0, duration - (performance.now() - mark.at));
      setLeft(remaining);
      if (remaining === 0 && !done) {
        done = true;
        onExpire();
      }
    };
    tick();
    const timer = setInterval(tick, 50);
    return () => clearInterval(timer);
  }, [start, roundId, duration, running, onExpire]);
  return (
    <>
      <div className="question-top">
        <span>{label}</span>
        <span className="count-timer" aria-hidden="true">
          <Timer />
          {(left / 1000).toFixed(1)}
          <small>s</small>
        </span>
      </div>
      <div className="timer-track" aria-hidden="true">
        <span style={{ width: `${(100 * left) / duration}%` }} />
      </div>
    </>
  );
}
