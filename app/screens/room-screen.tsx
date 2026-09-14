'use client';
import { useEffect, useRef, useState } from 'react';
import { completedRounds } from '@/lib/duel-presentation.mjs';
import { DuelHUD, MatchFinish, RoundReview } from '../rivalry-widgets';
import type { RoomScreenProps } from './types';
import { RoomChrome } from './room/room-chrome';
import { LobbyPanel } from './room/lobby-panel';
import { CountdownStage } from './room/countdown-stage';
import { QuestionStage } from './room/question-stage';
import './room/room.css';

/* Room: chrome (leave / mode · round / connection), HUD, lobby & between-round panel, countdown,
 * the live question, the reveal hold and the finish stage. Pure presentation over the
 * DuelController — every piece of state lives in arena.tsx.
 *
 * Timing contract (README): the question card mounts with `visibility: hidden` until the reveal
 * marker (`shown`, set by the double-rAF useLayoutEffect in arena.tsx). No entrance animation, no
 * layout shift, no extra work before the marker; the timer track has `transition: none`.
 *
 * Reveal hold: the server flips the phase to `between` / `complete` the instant a round resolves,
 * so the card would vanish under the result juice. We keep the stage mounted for REVEAL_MS after a
 * round we actually played, purely so the correct answer, the XP float and the burst land on the
 * button that was pressed. Nothing about the live round changes.
 *
 * Auto-advance: a multi-round match runs itself. Once the between-round panel is up we arm a single
 * AUTO_ADVANCE_MS window and then send `ready` on the player's behalf, so Triple Threat and the
 * Gauntlet never ask for a click to keep going. It fires at most once per round — a failed send
 * leaves the manual button and its error in place rather than retrying forever — and any deliberate
 * touch inside the fact panel, or the Keep reading control, cancels it for that round. */
const REVEAL_MS = 1900;
const AUTO_ADVANCE_MS = 5000;

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

  /* Only hold on a round this device actually watched go live. */
  const playedLive = useRef<Set<string>>(new Set());
  const [holdId, setHoldId] = useState<string | null>(null);
  useEffect(() => {
    if (question && shown && !rd?.result && rd?.id) playedLive.current.add(rd.id);
  }, [question, shown, rd?.id, rd?.result]);
  useEffect(() => {
    if (!rd?.result || !question || !playedLive.current.has(rd.id)) return;
    setHoldId(rd.id);
    const timer = setTimeout(() => setHoldId(null), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [rd?.id, rd?.result, question]);
  const revealing = !!rd?.result && !!question && holdId === rd.id;

  const lobby = !revealing && ['waiting', 'between'].includes(phase);
  const counting = !revealing && ['scheduled', 'playing'].includes(phase) && !question;
  const live = !!question && (!rd?.result || revealing);
  const finished = !revealing && ['complete', 'cancelled'].includes(phase);
  const mine = rd?.result ? (rd.receipts?.[room.seat] ?? null) : null;

  /* Auto-advance: after the reveal hold, the between-round panel starts the next round by itself.
   * Both switches are per-round state rather than refs because `armed` is read during render — a
   * deliberate hold, and the one shot we allow. A failed send leaves the manual button and its
   * error in place rather than retrying on a loop. */
  const roundKey = rd?.id ?? null;
  const [heldFor, setHeldFor] = useState<string | null>(null);
  const [firedFor, setFiredFor] = useState<string | null>(null);
  const armed =
    lobby &&
    phase === 'between' &&
    !!roundKey &&
    !!room.players[1] &&
    !room.players[room.seat]?.ready &&
    !room.settled &&
    heldFor !== roundKey &&
    firedFor !== roundKey;
  const auto = armed
    ? {
        totalMs: AUTO_ADVANCE_MS,
        onHold: () => setHeldFor(roundKey),
        onFire: () => {
          setFiredFor(roundKey);
          void ready();
        },
      }
    : null;

  const headline =
    phase === 'between'
      ? {
          eyebrow: 'A MOMENT TO LEARN',
          tone: rd.result.winner === null ? 'draw' : rd.result.winner === room.seat ? 'win' : 'loss',
          title:
            rd.result.winner === null
              ? 'Honours even.'
              : rd.result.winner === room.seat
                ? 'That round is yours.'
                : 'A fact for next time.',
          body: mine?.correct
            ? 'Your answer was correct. The fact is right below — the next round starts on its own.'
            : 'The answer and its explanation are right below. The next round starts on its own.',
        }
      : {
          eyebrow: 'THE CHALLENGE IS SET',
          tone: 'neutral',
          title: room.players[1] ? 'Ready for the first question?' : 'Invite your rival.',
          body:
            room.players[1]?.kind === 'bot'
              ? 'Lucky Guess is ready. Its choices and response times are random.'
              : room.players[1]
                ? 'You both decide when to begin. One attempt each after the countdown. Stay here during play; switching away cancels the match.'
                : 'Share the link with someone who can access this private site, or add a practice bot.',
        };

  return (
    <section
      className="fd-room"
      data-stage={live ? 'question' : counting ? 'countdown' : finished ? 'finish' : 'lobby'}
    >
      <RoomChrome
        settled={room.settled}
        modeName={matchMode.name}
        roundIndex={room.roundIndex}
        rounds={matchMode.rounds}
        connected={connected}
        onLeave={leaveOrBack}
      />
      <DuelHUD room={room} />
      {lobby && (
        <LobbyPanel
          phase={phase}
          room={room}
          busy={busy}
          copied={copied}
          invite={!!credentials?.invite && room.players[1]?.kind !== 'bot'}
          onReady={ready}
          onCopyInvite={copyInvite}
          onAddBot={addBot}
          headline={headline}
          auto={auto}
          review={
            phase === 'between' && rd?.result ? <RoundReview room={room} player={player} factFirst /> : null
          }
        />
      )}
      {counting && <CountdownStage countdown={countdown} roundId={rd?.id} />}
      {live && (
        <QuestionStage
          room={room}
          rd={rd}
          question={question}
          shown={shown}
          chosen={chosen}
          isLocked={isLocked}
          answerPending={answerPending}
          remaining={remaining}
          startMark={startMark}
          pendingAnswer={pendingAnswer}
          onAnswer={answer}
          onExpire={expire}
          onRetry={sendPending}
        />
      )}
      {finished && (
        <div className="fd-final final-panel">
          <MatchFinish
            room={room}
            player={player}
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
