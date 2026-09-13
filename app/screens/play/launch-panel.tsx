'use client';
import { ArrowRight, Coins, Timer, Trophy, Zap } from 'lucide-react';
import type { Mode } from '../types';
import { modeReward } from './mode-cards';
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

/* The one launch control: a sticky bar above the tab bar on phones, the top of the right column on
 * desktop. Disabled states and busy labels are exactly the ones the configurator has always used. */
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
  const label = joinView
    ? busy
      ? 'Joining…'
      : 'Join the duel'
    : busy
      ? 'Setting the arena…'
      : !playerLoaded
        ? 'Loading your player…'
        : opponent === 'bot'
          ? 'Play Lucky Guess'
          : 'Create friend duel';
  return (
    <div className="fd-launch">
      {!joinView && (
        <p className="fd-launch-context">
          <strong>{mode.name}</strong>
          <span>
            {mode.rounds === 1 ? '1 round' : `${mode.rounds} rounds`} ·{' '}
            {opponent === 'bot' ? 'vs Lucky Guess (BOT)' : 'vs your friend'}
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
        disabled={joinView ? !canJoin : busy || !canPlay}
        {...press}
        onClick={joinView ? onJoin : onCreate}
      >
        {!joinView && <Zap size={18} aria-hidden="true" />}
        {label}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      <p className="fd-launch-terms">
        {joinView ? (
          <span>Your friend’s room decides the format, timer and entry.</span>
        ) : (
          <>
            <span>
              <Timer size={13} aria-hidden="true" />
              {duration}s per question
            </span>
            <span>
              <Coins size={13} aria-hidden="true" />
              {stake ? `${stake} simulated coins` : 'No entry cost'}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
