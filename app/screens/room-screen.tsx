'use client';
import { useEffect, useRef, useState } from 'react';
import { completedRounds } from '@/lib/duel-presentation.mjs';
import { DuelHUD, MatchFinish, RoundReview } from '../rivalry-widgets';
import { useLocale } from '../use-locale';
import type { RoomScreenProps } from './types';
import { RoomChrome } from './room/room-chrome';
import { LobbyPanel } from './room/lobby-panel';
import { CountdownStage } from './room/countdown-stage';
import { BanterTray } from './room/banter-tray';
import { QuestionStage } from './room/question-stage';
import './room/room.css';

/* Room presentation keeps answer input stable. Local practice shows the resolved answer for
 * 900 ms then starts the next ball. Review, focus, banter or a hidden tab pauses that advance;
 * Next remains available and the full question/source review survives in the finish screen. */
const REVEAL_MS = 900;
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

  const { t, pick, topic, locale } = useLocale();
  const botPractice = room.players[1]?.kind === 'bot';
  const roundKey = rd?.id ?? null;
  const hasResult = !!rd?.result;
  const playedLive = useRef<Set<string>>(new Set());
  const [endedFor, setEndedFor] = useState<string | null>(null);
  const [heldFor, setHeldFor] = useState<string | null>(null);
  const [firedFor, setFiredFor] = useState<string | null>(null);
  const heldRef = useRef<string | null>(null);
  const firedRef = useRef<string | null>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const hold = () => {
    heldRef.current = roundKey;
    setHeldFor(roundKey);
  };
  const startNext = () => {
    if (!roundKey || firedRef.current === roundKey) return;
    firedRef.current = roundKey;
    setFiredFor(roundKey);
    void readyRef.current();
  };
  useEffect(() => {
    if (question && shown && !hasResult && roundKey) playedLive.current.add(roundKey);
  }, [question, shown, roundKey, hasResult]);
  useEffect(() => {
    if (!hasResult || !roundKey || !playedLive.current.has(roundKey)) return;
    const pauseIfHidden = () => {
      if (document.visibilityState !== 'visible') {
        heldRef.current = roundKey;
        setHeldFor(roundKey);
      }
    };
    pauseIfHidden();
    document.addEventListener('visibilitychange', pauseIfHidden);
    const timer = setTimeout(() => {
      setEndedFor(roundKey);
      if (botPractice && phase === 'between' && heldRef.current !== roundKey && firedRef.current !== roundKey && document.visibilityState === 'visible') {
        firedRef.current = roundKey;
        setFiredFor(roundKey);
        void readyRef.current();
      }
    }, botPractice ? REVEAL_MS : 1900);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', pauseIfHidden);
    };
  }, [roundKey, hasResult, botPractice, phase]);
  const revealing = hasResult && !!question && !!roundKey && playedLive.current.has(roundKey) && endedFor !== roundKey;
  const lobby = !revealing && ['waiting', 'between'].includes(phase);
  const counting = !revealing && ['scheduled', 'playing'].includes(phase) && !question;
  const live = !!question && (!hasResult || revealing);
  const finished = !revealing && ['complete', 'cancelled'].includes(phase);
  const mine = hasResult ? (rd.receipts?.[room.seat] ?? null) : null;
  const armed = !botPractice && lobby && phase === 'between' && !!roundKey && !!room.players[1] && !room.players[room.seat]?.ready && !room.settled && heldFor !== roundKey && firedFor !== roundKey;
  const auto = armed ? { totalMs: AUTO_ADVANCE_MS, onHold: hold, onFire: startNext } : null;

  const headline =
    phase === 'between'
      ? {
          eyebrow: t('room.learnEyebrow'),
          tone: rd.result.winner === null ? 'draw' : rd.result.winner === room.seat ? 'win' : 'loss',
          title:
            rd.result.winner === null
              ? t('room.even')
              : rd.result.winner === room.seat
                ? t('room.yours')
                : t('room.nextTime'),
          body: mine?.correct ? t('room.bodyCorrect') : t('room.bodyOther'),
        }
      : {
          eyebrow: t('room.setEyebrow'),
          tone: 'neutral',
          title: room.players[1] ? t('room.readyQ') : t('room.invite'),
          body:
            room.players[1]?.kind === 'bot'
              ? t('room.botReady')
              : room.players[1]
                ? t('room.bothDecide')
                : t('room.shareLink'),
        };

  return (
    <section
      className="fd-room"
      data-room-phase={phase}
      data-round-id={roundKey ?? undefined}
      data-human-locked={rd?.answerLocked?.[room.seat] ? "true" : "false"}
      data-bot-locked={botPractice && rd?.answerLocked?.[1] ? "true" : "false"}
      data-stage={live ? 'question' : counting ? 'countdown' : finished ? 'finish' : 'lobby'}
    >
      <RoomChrome
        settled={room.settled}
        modeName={pick(`modes.${matchMode.id}.name`, matchMode.name)}
        roundIndex={room.roundIndex}
        rounds={room.roundCount || matchMode.rounds}
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
        <div
          onPointerDownCapture={hasResult ? hold : undefined}
          onFocusCapture={hasResult ? (event) => {
            // Arena moves focus to the result heading automatically. Only an actual review control
            // pauses play; otherwise that accessibility hand-off would stop every automatic round.
            if ((event.target as HTMLElement).matches('a,button,input,summary,[role="button"]')) hold();
          } : undefined}
        >
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
          {botPractice && !room.settled && (
            <div className="fd-flow-controls" aria-label="Round flow">
              <button
                type="button"
                className="fd-flow-pause"
                aria-pressed={heldFor === roundKey}
                onClick={() => {
                  if (heldFor === roundKey && !hasResult) {
                    heldRef.current = null;
                    setHeldFor(null);
                  } else hold();
                }}
              >
                {heldFor === roundKey
                  ? (locale === 'hi' ? 'रिव्यू के लिए रुका' : 'Paused for review')
                  : (locale === 'hi' ? 'इस गेंद के बाद रुकें' : 'Pause after this ball')}
              </button>
              {hasResult && phase === 'between' && (
                <button type="button" className="fd-flow-next" onClick={startNext} disabled={busy || firedFor === roundKey}>
                  {locale === 'hi' ? 'अगली गेंद' : 'Next ball'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {botPractice && (
        <BanterTray
          key={room.id}
          active={(lobby || revealing) && !!room.players[1]}
          matchKey={room.id}
          roundKey={`${room.id}:${room.roundIndex}`}
          mode="bot"
          onInteract={hold}
        />
      )}
      {finished && (
        <div className="fd-final final-panel">
          <MatchFinish
            compact
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
              go('home');
            }}
          />
          <p className="fd-final-brand">
            {t('room.brand', {
              topic: room.config.topic && room.config.topic !== 'all' ? topic(room.config.topic) : t('topic.Sports'),
            })}
          </p>
          {completedRounds(room).length > 0 && <details className="fd-result-details">
            <summary>{locale === 'hi' ? 'सवाल और स्रोत देखें' : 'Review questions & sources'}</summary>
            <RoundReview room={room} player={player} />
          </details>}
          {/* Local rooms live in memory. The H5 provider reloads on close, so only the
              server-backed LiveDuelScreen may offer that recoverable ad break. */}
        </div>
      )}
    </section>
  );
}
