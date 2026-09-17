'use client';
import { ArrowRight, Coins, Swords, Timer, Trophy, X, Zap } from 'lucide-react';
import { QUEUE_OFFER_PRACTICE_MS } from '@/lib/queue-client';
import type { Mode } from '../types';
import { modeReward } from './mode-cards';
import { useRivalQueue } from './opponent-picker';
import { usePlayJuice } from './press';
import { useLocale } from '../../use-locale';

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
  const { t, n, pick, topic } = useLocale();
  const modeName = pick(`modes.${mode.id}.name`, mode.name);
  const reward = modeReward(mode.id, t);
  const rival = useRivalQueue();
  const rivalMode = !joinView && !!rival?.selected;
  const search = rival?.search ?? { phase: 'idle' as const };
  const searching = rivalMode && search.phase === 'searching';
  const pairing = rivalMode && search.phase === 'paired';
  const label = joinView
    ? busy
      ? t('launch.joining')
      : t('launch.join')
    : rivalMode
      ? pairing
        ? t('launch.found')
        : searching
          ? t('launch.cancel')
          : !playerLoaded
            ? t('launch.loadingPlayer')
            : t('launch.find')
      : busy
        ? t('launch.setting')
        : !playerLoaded
          ? t('launch.loadingPlayer')
          : opponent === 'bot'
            ? t('launch.playMode', { mode: modeName })
            : t('launch.createFriend');
  const disabled = joinView
    ? !canJoin
    : rivalMode
      ? pairing || (!searching && (busy || !canPlay || !rival?.sport))
      : busy || !canPlay;
  const onClick = joinView ? onJoin : rivalMode ? (searching ? rival?.cancel : rival?.start) : onCreate;
  const entry = stake ? t('launch.entry', { n: stake }) : t('launch.noEntry');
  const offerPractice = searching && search.phase === 'searching' && search.elapsedMs >= QUEUE_OFFER_PRACTICE_MS;
  return (
    <div className="fd-launch" data-rival={rivalMode ? search.phase : undefined}>
      {!joinView && (
        <p className="fd-launch-context">
          <strong>{modeName}</strong>
          <span>
            {n('launch.rounds', mode.rounds)} ·{' '}
            {rivalMode ? t('launch.vsRival') : opponent === 'bot' ? t('launch.vsBot') : t('launch.vsFriend')}
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
          <span>{t('launch.friendDecides')}</span>
        ) : rivalMode && search.phase === 'searching' ? (
          offerPractice ? (
            <>
              <span>{t('launch.noRivalYet', { clock: clock(search.elapsedMs) })}</span>
              <button type="button" className="fd-link" {...press} onClick={rival?.practice}>
                {t('launch.practice')}
              </button>
            </>
          ) : (
            <>
              <span>
                {search.lane ? `${topic(search.lane.sport)} · ${modeName} · ${entry}` : t('launch.opening')}
              </span>
              <span>
                {search.waiting === null
                  ? t('launch.counting')
                  : search.waiting <= 1
                    ? t('launch.onlyYou')
                    : t('launch.inLane', { n: search.waiting })}
              </span>
              <span>
                <Timer size={13} aria-hidden="true" />
                {clock(search.elapsedMs)}
              </span>
            </>
          )
        ) : rivalMode && search.phase === 'paired' ? (
          <span>{t('launch.paired')}</span>
        ) : rivalMode && !rival?.sport ? (
          <span>{t('launch.pickSport')}</span>
        ) : (
          <>
            <span>
              <Timer size={13} aria-hidden="true" />
              {t('launch.perQ', { s: duration })}
            </span>
            <span>
              <Coins size={13} aria-hidden="true" />
              {rivalMode ? entry : stake ? t('launch.simCoins', { n: stake }) : t('launch.noEntry')}
            </span>
            {rivalMode && <span>{t('launch.nearest')}</span>}
          </>
        )}
      </p>
    </div>
  );
}
