'use client';
/**
 * Lobby (waiting) and the between-rounds panel.
 *
 * Waiting: a versus panel with both seats and their ready state, invite / add-bot actions and the
 * "I'm ready" CTA parked in the thumb zone.
 * Between rounds: the verdict headline, then the round review (the explanation the audit found
 * below the fold), and only then the "Start round N" button — sticky at the bottom on phones.
 */
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Check, Copy, Users } from 'lucide-react';
import { ReadyDot, usePress } from './room-bits';

function Seat({ player, you, waiting }: { player: any; you: boolean; waiting: boolean }) {
  const bot = player?.kind === 'bot';
  const name = player?.name?.replace(' · BOT', '') || 'Open seat';
  return (
    <div className="fd-seat" data-you={you ? 'true' : 'false'} data-empty={player ? 'false' : 'true'}>
      <span className="fd-seat-avatar" aria-hidden="true">
        {bot ? <Bot size={22} /> : player ? name.charAt(0).toUpperCase() : <Users size={20} />}
      </span>
      <small>{you ? 'YOU' : bot ? 'BOT' : player ? 'RIVAL' : 'WAITING'}</small>
      <strong>{name}</strong>
      <span className="fd-seat-ready" data-on={player?.ready ? 'true' : 'false'}>
        <ReadyDot ready={!!player?.ready} />
        {player?.ready ? 'Ready' : player ? 'Not ready' : waiting ? 'Open' : '—'}
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
}) {
  const press = usePress();
  const between = phase === 'between';
  const me = room.players[room.seat];
  const rival = room.players[1 - room.seat];
  const cta = busy
    ? 'Checking connection…'
    : me.ready
      ? 'Waiting for your rival…'
      : between
        ? `Start round ${room.roundIndex + 2}`
        : 'I’m ready';
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
              VS
            </span>
            <Seat player={rival} you={false} waiting={!rival} />
          </div>
        )}
        {!between && (invite || (!rival && room.seat === 0)) && (
          <div className="fd-lobby-actions">
            {invite && (
              <Button variant="outline" className="fd-btn" onPointerDown={press} onClick={onCopyInvite}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy room invitation'}
              </Button>
            )}
            {!rival && room.seat === 0 && (
              <Button
                variant="outline"
                className="fd-btn"
                onPointerDown={press}
                onClick={onAddBot}
                disabled={busy}
              >
                <Bot size={16} />
                Add practice bot
              </Button>
            )}
          </div>
        )}
      </section>
      {between && review}
      <div className="fd-sticky">
        <Button
          className="fd-btn fd-cta"
          onPointerDown={press}
          onClick={onReady}
          disabled={busy || !rival || me.ready}
        >
          {cta}
          <ArrowRight size={18} />
        </Button>
        <p className="fd-note">
          {between
            ? 'Your original match entry stays reserved. No new entry.'
            : `${room.config.stake} demo coins each, once per match. Draws refund both.`}
        </p>
      </div>
    </div>
  );
}
