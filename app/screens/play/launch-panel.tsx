'use client';
import { ArrowRight, Coins, Swords, Timer, Trophy, X, Zap } from 'lucide-react';
import { QUEUE_OFFER_PRACTICE_MS } from '@/lib/queue-client';
import type { Mode } from '../types';
import { modeReward } from './mode-cards';
import { useRivalQueue } from './opponent-picker';
import { usePlayJuice } from './press';

export type LaunchPanelProps = {
  joinView: boolean;
  busy: boolean;
  playerLoaded: boolean;
  canPlay: boolean;
  canJoin: boolean;
  opponent: string;
  mode: Mode;
  duration: number;
  stake: number;
  onCreate: () => void;
  onJoin: () => void;
};

const clock = (ms: number) => {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/* The one launch control: a sticky bar above the tab bar on phones, the top of the right column on
 * desktop. Disabled states and busy labels are exactly the ones the configurator has always used.
 * With the "Rival" seat chosen the same bar runs the search: the button starts and cancels it, and
 * the terms line shows only what the server reported — the lane, who is really in it, the clock. */
export function LaunchPanel({
  joinView,
  busy,
  playerLoaded,
  canPlay,
  canJoin,
  opponent,
  mode,
  duration,
  stake,
  onCreate,
  onJoin,
}: LaunchPanelProps) {
  const { press } = usePlayJuice();
  const reward = modeReward(mode.id);
  const rival = useRivalQueue();
  const rivalMode = !joinView && !!rival?.selected;
  const search = rival?.search ?? { phase: 'idle' as const };
  const searching = rivalMode && search.phase === 'searching';
  const pairing = rivalMode && search.phase === 'paired';
  const label = joinView
    ? busy
      ? 'Joining…'
      : 'Join the duel'
    : rivalMode
      ? pairing
        ? 'Rival found. Entering the room…'
        : searching
          ? 'Cancel search'
          : !playerLoaded
            ? 'Loading your player…'
            : 'Find a rival'
      : busy
        ? 'Setting the arena…'
        : !playerLoaded
          ? 'Loading your player…'
          : opponent === 'bot'
            ? `Play ${mode.name}`
            : 'Create friend duel';
  const disabled = joinView
    ? !canJoin
    : rivalMode
      ? pairing || (!searching && (busy || !canPlay || !rival?.sport))
      : busy || !canPlay;
  const onClick = joinView ? onJoin : rivalMode ? (searching ? rival?.cancel : rival?.start) : onCreate;
  const entry = stake ? `${stake} coins entry` : 'No entry cost';
  const offerPractice = searching && search.phase === 'searching' && search.elapsedMs >= QUEUE_OFFER_PRACTICE_MS;
  return (
    <div className="fd-launch" data-rival={rivalMode ? search.phase : undefined}>
      {!joinView && (
        <p className="fd-launch-context">
          <strong>{mode.name}</strong>
          <span>
            {mode.rounds === 1 ? '1 round' : `${mode.rounds} rounds`} ·{' '}
            {rivalMode ? 'vs a matched rival' : opponent === 'bot' ? 'vs Lucky Guess (BOT)' : 'vs your friend'}
          </span>
          <span className="fd-launch-reward">
            <Trophy size={13} aria-hidden="true" />
            {reward.label}
          </span>
        </p>
      )}
      <button
        type="button"
        className="fd-launch-btn fd-pressable"
        disabled={disabled}
        aria-busy={pairing || undefined}
        {...press}
        onClick={onClick}
      >
        {!joinView && (searching ? <X size={18} aria-hidden="true" /> : rivalMode ? <Swords size={18} aria-hidden="true" /> : <Zap size={18} aria-hidden="true" />)}
        {label}
        {!searching && <ArrowRight size={18} aria-hidden="true" />}
      </button>
      <p className="fd-launch-terms" role={rivalMode ? 'status' : undefined} aria-live={rivalMode ? 'polite' : undefined}>
        {joinView ? (
          <span>Your friend’s room decides the format, timer and entry.</span>
        ) : rivalMode && search.phase === 'searching' ? (
          offerPractice ? (
            <>
              <span>No rival yet ({clock(search.elapsedMs)}). Keep waiting, or</span>
              <button type="button" className="fd-link" {...press} onClick={rival?.practice}>
                play a free practice duel
              </button>
            </>
          ) : (
            <>
              <span>
                {search.lane ? `${search.lane.sport} · ${mode.name} · ${entry}` : 'Opening the lane…'}
              </span>
              <span>
                {search.waiting === null
                  ? 'Counting the lane…'
                  : search.waiting <= 1
                    ? 'Only you in this lane right now'
                    : `${search.waiting} in this lane, you included`}
              </span>
              <span>
                <Timer size={13} aria-hidden="true" />
                {clock(search.elapsedMs)}
              </span>
            </>
          )
        ) : rivalMode && search.phase === 'paired' ? (
          <span>A real player took the other seat. Setting the arena…</span>
        ) : rivalMode && !rival?.sport ? (
          <span>Pick one sport to open a lane.</span>
        ) : (
          <>
            <span>
              <Timer size={13} aria-hidden="true" />
              {duration}s per question
            </span>
            <span>
              <Coins size={13} aria-hidden="true" />
              {rivalMode ? entry : stake ? `${stake} simulated coins` : 'No entry cost'}
            </span>
            {rivalMode && <span>Nearest rating first, window widens while you wait</span>}
          </>
        )}
      </p>
    </div>
  );
}
