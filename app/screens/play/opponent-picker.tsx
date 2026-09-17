'use client';
import { createContext, useContext } from 'react';
import { Bot, Link2, Swords, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QueueLane } from '@/lib/queue-client';
import { usePlayJuice } from './press';
import { useLocale } from '../../use-locale';

/* ---------- Find a rival: the queue state the arena provides ----------
 * The picker and the launch panel read it from context rather than props, so the play screen and
 * the shared DuelController types stay untouched (see scratchpad/requests/matchmaking.md for the
 * threaded version). `available` is false wherever there is no server — the static build, or a
 * worker without a database — and then the option is simply not rendered. */
export type RivalSearch =
  | { phase: 'idle' }
  | {
      phase: 'searching';
      /** The lane as the server confirmed it; null until the first answer. */
      lane: QueueLane | null;
      /** Live players in the lane right now, this one included. The server's count; null until it answers. */
      waiting: number | null;
      /** This device's stopwatch since the search began. */
      elapsedMs: number;
      /** The rating gap the server currently accepts; null until it answers. */
      window: number | null;
    }
  | { phase: 'paired' };
export type RivalQueue = {
  available: boolean;
  /** The "Find a rival" seat is the chosen one. */
  selected: boolean;
  /** The lane's sport, from the chosen topic; null when the topic is not one sport. */
  sport: string | null;
  search: RivalSearch;
  select: (on: boolean) => void;
  start: () => void;
  cancel: () => void;
  /** Give up on the queue and play a free practice duel against the bot instead. */
  practice: () => void;
};
export const RivalQueueContext = createContext<RivalQueue | null>(null);
/** The queue, when the arena offers one. */
export function useRivalQueue(): RivalQueue | null {
  const rival = useContext(RivalQueueContext);
  return rival?.available ? rival : null;
}

export type OpponentPickerProps = {
  opponent: string;
  joinView: boolean;
  duration: number;
  onOpponent: (opponent: 'bot' | 'friend') => void;
  onJoinView: (open: boolean) => void;
};

/* Segmented Bot / Friend / Join plus the seat card for the chosen opponent. The three labels are
 * exactly "Bot", "Friend" and "Join" — the lobby end-to-end scripts click them by accessible name.
 * With a server behind the page a fourth segment, "Rival", opens the matchmaking lane. */
export function OpponentPicker({
  opponent,
  joinView,
  duration,
  onOpponent,
  onJoinView,
}: OpponentPickerProps) {
  const { press } = usePlayJuice();
  const { t, topic } = useLocale();
  const rival = useRivalQueue();
  const rivalSeat = !joinView && !!rival?.selected;
  const botSeat = !joinView && !rivalSeat && opponent === 'bot';
  const friendSeat = !joinView && !rivalSeat && opponent === 'friend';
  const searching = rival?.search.phase === 'searching' || rival?.search.phase === 'paired';
  const pickSeat = (seat: 'bot' | 'friend') => {
    if (searching) rival?.cancel();
    rival?.select(false);
    onJoinView(false);
    onOpponent(seat);
  };
  return (
    <>
      <div className="fd-seg" role="group" aria-label={t('opp.aria')}>
        <button
          type="button"
          className="fd-seg-btn fd-pressable"
          aria-pressed={botSeat}
          {...press}
          onClick={() => pickSeat('bot')}
        >
          <Bot size={17} aria-hidden="true" />
          {t('opp.bot')}
        </button>
        <button
          type="button"
          className="fd-seg-btn fd-pressable"
          aria-pressed={friendSeat}
          {...press}
          onClick={() => pickSeat('friend')}
        >
          <Users size={17} aria-hidden="true" />
          {t('opp.friend')}
        </button>
        {rival && (
          <button
            type="button"
            className="fd-seg-btn fd-pressable"
            aria-pressed={rivalSeat}
            aria-label={t('opp.rivalAria')}
            {...press}
            onClick={() => {
              onJoinView(false);
              // A matched room is a friend room with a real person in the other seat; the entry
              // picker keeps working, so the lane's stake is whatever is chosen below.
              onOpponent('friend');
              rival.select(true);
            }}
          >
            <Swords size={17} aria-hidden="true" />
            {t('opp.rival')}
          </button>
        )}
        <button
          type="button"
          className="fd-seg-btn fd-pressable"
          aria-pressed={joinView}
          {...press}
          onClick={() => {
            if (searching) rival?.cancel();
            rival?.select(false);
            onJoinView(true);
          }}
        >
          <Link2 size={17} aria-hidden="true" />
          {t('opp.join')}
        </button>
      </div>
      {!joinView && rivalSeat && rival && (
        <div className="fd-rival" data-seat="rival">
          <span className="fd-rival-avatar" aria-hidden="true">
            <Swords />
          </span>
          <span className="fd-rival-body">
            <span className="fd-rival-top">
              <strong>{t('opp.findRival')}</strong>
              <em className="fd-rival-badge">{t('opp.humanBadge')}</em>
            </span>
            <small>{rival.sport ? t('opp.laneOpen', { sport: topic(rival.sport) }) : t('opp.pickSport')}</small>
          </span>
        </div>
      )}
      {!joinView && !rivalSeat && (
        <div className="fd-rival" data-seat={opponent}>
          <span className="fd-rival-avatar" aria-hidden="true">
            {botSeat ? <Bot /> : <Users />}
          </span>
          <span className="fd-rival-body">
            <span className="fd-rival-top">
              <strong>{botSeat ? t('opp.lucky') : t('opp.yourFriend')}</strong>
              <em className="fd-rival-badge">{botSeat ? t('opp.botBadge') : t('opp.inviteOnly')}</em>
            </span>
            <small>
              {botSeat ? t('opp.botDesc', { max: Math.max(1, duration - 0.5) }) : t('opp.friendDesc')}
            </small>
          </span>
        </div>
      )}
    </>
  );
}

export type JoinFormProps = {
  name: string;
  joinLink: string;
  onName: (value: string) => void;
  onLink: (value: string) => void;
};

/* Join view: the same two fields (ids `join-name` and `invite`) the join flow has always used. */
export function JoinForm({ name, joinLink, onName, onLink }: JoinFormProps) {
  const { t } = useLocale();
  return (
    <div className="fd-join">
      <div className="fd-field">
        <Label htmlFor="join-name">{t('opp.yourName')}</Label>
        <Input
          id="join-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={24}
          autoComplete="nickname"
        />
      </div>
      <div className="fd-field">
        <Label htmlFor="invite">{t('opp.inviteLink')}</Label>
        <Input
          id="invite"
          value={joinLink}
          onChange={(e) => onLink(e.target.value)}
          placeholder={t('opp.pasteInvite')}
        />
      </div>
      <p className="fd-fine">{t('opp.access')}</p>
    </div>
  );
}
