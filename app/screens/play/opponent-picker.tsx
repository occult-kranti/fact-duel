'use client';
import { Bot, Link2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlayJuice } from './press';

export type OpponentPickerProps = {
  opponent: string;
  joinView: boolean;
  duration: number;
  onOpponent: (opponent: 'bot' | 'friend') => void;
  onJoinView: (open: boolean) => void;
};

/* Segmented Bot / Friend / Join plus the seat card for the chosen opponent. The three labels are
 * exactly "Bot", "Friend" and "Join" — the lobby end-to-end scripts click them by accessible name. */
export function OpponentPicker({
  opponent,
  joinView,
  duration,
  onOpponent,
  onJoinView,
}: OpponentPickerProps) {
  const { press } = usePlayJuice();
  const botSeat = !joinView && opponent === 'bot';
  const friendSeat = !joinView && opponent === 'friend';
  return (
    <>
      <div className="fd-seg" role="group" aria-label="Opponent">
        <button
          type="button"
          className="fd-seg-btn fd-pressable"
          aria-pressed={botSeat}
          {...press}
          onClick={() => {
            onJoinView(false);
            onOpponent('bot');
          }}
        >
          <Bot size={17} aria-hidden="true" />
          Bot
        </button>
        <button
          type="button"
          className="fd-seg-btn fd-pressable"
          aria-pressed={friendSeat}
          {...press}
          onClick={() => {
            onJoinView(false);
            onOpponent('friend');
          }}
        >
          <Users size={17} aria-hidden="true" />
          Friend
        </button>
        <button
          type="button"
          className="fd-seg-btn fd-pressable"
          aria-pressed={joinView}
          {...press}
          onClick={() => onJoinView(true)}
        >
          <Link2 size={17} aria-hidden="true" />
          Join
        </button>
      </div>
      {!joinView && (
        <div className="fd-rival" data-seat={opponent}>
          <span className="fd-rival-avatar" aria-hidden="true">
            {botSeat ? <Bot /> : <Users />}
          </span>
          <span className="fd-rival-body">
            <span className="fd-rival-top">
              <strong>{botSeat ? 'Lucky Guess' : 'Your friend'}</strong>
              <em className="fd-rival-badge">{botSeat ? 'BOT' : 'INVITE ONLY'}</em>
            </span>
            <small>
              {botSeat
                ? `Random 25% guesser · answers after 1–${Math.max(1, duration - 0.5)}s and never reacts to yours.`
                : 'Create the room, then send the invitation link from the lobby.'}
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
  return (
    <div className="fd-join">
      <div className="fd-field">
        <Label htmlFor="join-name">Your name</Label>
        <Input
          id="join-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={24}
          autoComplete="nickname"
        />
      </div>
      <div className="fd-field">
        <Label htmlFor="invite">Invitation link</Label>
        <Input
          id="invite"
          value={joinLink}
          onChange={(e) => onLink(e.target.value)}
          placeholder="Paste your friend’s invitation"
        />
      </div>
      <p className="fd-fine">
        Both screens need access to this private site. Room invitations do not grant site access.
      </p>
    </div>
  );
}
