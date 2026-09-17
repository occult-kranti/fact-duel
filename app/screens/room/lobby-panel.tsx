'use client';
/**
 * Lobby (waiting) and the between-rounds panel.
 *
 * Waiting: a versus panel with both seats and their ready state, invite / add-bot actions and the
 * "I'm ready" CTA parked in the thumb zone.
 * Between rounds: the verdict headline, then the round review (the explanation the audit found
 * below the fold), and only then the start button — sticky at the bottom on phones. That button is
 * a courtesy, not a requirement: `auto` carries the auto-advance window from RoomScreen, so the
 * next round arrives on its own. Touching the fact panel, or Keep reading, hands the clock back.
 */
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Check, Copy, Users } from 'lucide-react';
import { feeFor, prizeFor } from '@/lib/economy/economy.mjs';
import { ReadyDot, usePress } from './room-bits';
import { AutoAdvance } from './auto-advance';
import { useLocale, type LocaleApi } from '../../use-locale';

/**
 * The coin line under the ready button. Entry and prize come from the economy's fee table, the
 * same numbers the launch screen showed, never from the room's escrow arithmetic. A ledger room
 * (`room.ledger`) plays for the coins in the player's wallet; a demo room plays for simulated ones.
 * `t` is the locale's lookup; without one the line is English.
 */
export function entryLine(room: { config: { stake: number }; ledger?: boolean }, t?: LocaleApi['t']): string {
  const stake: number = room.config.stake;
  const fee = feeFor(stake);
  const prize = prizeFor(stake);
  if (t) {
    if (!stake) return t('lobby.freeEntry');
    return t('lobby.entryLine', {
      stake,
      prize,
      fee: fee ? t('lobby.feePart', { fee }) : '',
      kind: room.ledger ? t('lobby.coins') : t('lobby.simCoins'),
    });
  }
  if (!stake) return 'Free entry. No coins move.';
  const kind = room.ledger ? 'coins' : 'simulated coins';
  return `Entry ${stake} · prize ${prize}${fee ? ` · arena fee ${fee}` : ''}. ${kind}, once per match. Draws refund both.`;
}

function Seat({ player, you, waiting }: { player: any; you: boolean; waiting: boolean }) {
  const { t } = useLocale();
  const bot = player?.kind === 'bot';
  const name = player?.name?.replace(' · BOT', '') || t('lobby.openSeat');
  return (
    <div className="fd-seat" data-you={you ? 'true' : 'false'} data-empty={player ? 'false' : 'true'}>
      <span className="fd-seat-avatar" aria-hidden="true">
        {bot ? <Bot size={22} /> : player ? name.charAt(0).toUpperCase() : <Users size={20} />}
      </span>
      <small>{you ? t('lobby.you') : bot ? t('lobby.bot') : player ? t('lobby.rival') : t('lobby.waiting')}</small>
      <strong>{name}</strong>
      <span className="fd-seat-ready" data-on={player?.ready ? 'true' : 'false'}>
        <ReadyDot ready={!!player?.ready} />
        {player?.ready ? t('lobby.ready') : player ? t('lobby.notReady') : waiting ? t('lobby.open') : '—'}
      </span>
    </div>
  );
}

export function LobbyPanel({
  phase,
  room,
  busy,
  copied,
  invite,
  onReady,
  onCopyInvite,
  onAddBot,
  headline,
  review,
  auto,
}: {
  phase: string;
  room: any;
  busy: boolean;
  copied: boolean;
  invite: boolean;
  onReady: () => void;
  onCopyInvite: () => void;
  onAddBot: () => void;
  headline: { eyebrow: string; title: string; body: string; tone: string };
  review: ReactNode;
  auto?: { totalMs: number; onHold: () => void; onFire: () => void } | null;
}) {
  const press = usePress();
  const { t } = useLocale();
  const between = phase === 'between';
  const me = room.players[room.seat];
  const rival = room.players[1 - room.seat];
  const counting = !!auto && !busy && !me.ready;
  const cta = busy
    ? t('lobby.checking')
    : me.ready
      ? t('lobby.waitingRival')
      : counting
        ? t('lobby.startNow')
        : between
          ? t('lobby.startRound', { n: room.roundIndex + 2 })
          : t('lobby.imReady');
  return (
    <div className="fd-lobby" data-phase={between ? 'between' : 'waiting'}>
      <section className="fd-panel fd-headline" data-tone={headline.tone}>
        <p className="fd-eyebrow">{headline.eyebrow}</p>
        <h1>{headline.title}</h1>
        <p className="fd-headline-body">{headline.body}</p>
        {!between && (
          <div className="fd-versus">
            <Seat player={me} you waiting={false} />
            <span className="fd-versus-mark" aria-hidden="true">
              {t('lobby.vs')}
            </span>
            <Seat player={rival} you={false} waiting={!rival} />
          </div>
        )}
        {!between && (invite || (!rival && room.seat === 0)) && (
          <div className="fd-lobby-actions">
            {invite && (
              <Button variant="outline" className="fd-btn" onPointerDown={press} onClick={onCopyInvite}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? t('lobby.copied') : t('lobby.copyInvite')}
              </Button>
            )}
            {/* A matched host holds no invitation: the seat belongs to the rival on the way, so no
                bot may take it. Only a friend room the host can share offers the bot. */}
            {!rival && room.seat === 0 && invite && (
              <Button
                variant="outline"
                className="fd-btn"
                onPointerDown={press}
                onClick={onAddBot}
                disabled={busy}
              >
                <Bot size={16} />
                {t('lobby.addBot')}
              </Button>
            )}
          </div>
        )}
      </section>
      {between && (
        <div className="fd-review-hold" onPointerDownCapture={auto?.onHold}>
          {review}
        </div>
      )}
      <div className="fd-sticky">
        <Button
          className="fd-btn fd-cta"
          data-counting={counting ? 'true' : 'false'}
          onPointerDown={press}
          onClick={onReady}
          disabled={busy || !rival || me.ready}
        >
          {counting && (
            <span
              className="fd-cta-fill"
              style={{ animationDuration: `${auto!.totalMs}ms` }}
              aria-hidden="true"
            />
          )}
          <span className="fd-cta-label">{cta}</span>
          <ArrowRight size={18} />
        </Button>
        {counting && <AutoAdvance totalMs={auto!.totalMs} onFire={auto!.onFire} onHold={auto!.onHold} />}
        <p className="fd-note">
          {between ? t('lobby.reserved') : entryLine(room, t)}
        </p>
      </div>
    </div>
  );
}
