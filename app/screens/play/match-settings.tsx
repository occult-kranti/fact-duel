'use client';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DURATIONS, MODE_DURATION } from '@/lib/server/room-engine.mjs';
import { DEFAULT_CONFIG } from '@/lib/economy/economy.mjs';
import { advise, closedReason, evCopy } from '@/lib/economy/stake-advice.mjs';
import type { WalletApi } from '../../use-wallet';
import { MODES } from '../types';
import type { Config } from '../types';
import { usePlayJuice } from './press';

const TIMERS = DURATIONS;

/**
 * The room engine's `normalizeConfig` accepts entries up to this tier (its demo-entry list is
 * 0, 10, 25, 50, 100), so the picker offers the economy's tiers only up to here. The economy's
 * larger tiers (250, 500) wait for the engine to take them; nothing here hard-codes the list.
 */
export const ROOM_MAX_STAKE = 100;

/** The economy config narrowed to the tiers a room can be created at. */
export function offeredConfig(config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG): typeof DEFAULT_CONFIG {
  return { ...config, stakes: config.stakes.filter((tier) => tier <= ROOM_MAX_STAKE) };
}

function Picker({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: [string, string][];
  onChange: (value: string) => void;
}) {
  const { cue } = usePlayJuice();
  return (
    <div className="fd-field">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          cue('tap', 'light');
          onChange(next);
        }}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([v, t]) => (
            <SelectItem value={v} key={v}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export type MatchSettingsProps = {
  config: Config;
  name: string;
  subtopics: string[];
  onChange: (patch: Partial<Config>) => void;
  onName: (value: string) => void;
  /** The device wallet, when one is provided; null keeps the picker as it was before the economy. */
  wallet?: WalletApi | null;
  /** The tier `defaultStake` chose for this wallet (0 for free); marked "Suggested" on the picker. */
  suggested?: number;
};

/* Everything you rarely change, folded away: name, timer, entry coins, region, level, subtopic. */
export function MatchSettings({
  config,
  name,
  subtopics,
  onChange,
  onName,
  wallet = null,
  suggested = 0,
}: MatchSettingsProps) {
  const { press } = usePlayJuice();
  const economy = useMemo(() => offeredConfig(wallet?.config ?? DEFAULT_CONFIG), [wallet?.config]);
  const stakes = useMemo(() => [0, ...economy.stakes], [economy]);
  const loaded = !!wallet?.loaded;
  const coins = wallet?.wallet;
  const bot = config.opponent === 'bot';
  // The loss-streak lever: after the configured run of staked losses, a short runway at the chosen
  // tier is pointed one tier down. Nothing about the contest changes; only this line appears.
  const advice = loaded && coins && !bot ? advise(coins, config.stake, economy) : null;
  const closed = (tier: number) => (loaded && coins && tier > 0 ? closedReason(coins, tier, economy) : '');
  const doubleOwed = loaded && !bot && !!wallet?.doubleOwed;
  return (
    <details className="fd-settings">
      <summary className="fd-pressable" {...press}>
        <span className="fd-settings-title">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Match settings
        </span>
        <span className="fd-settings-summary">
          <em>{config.duration}s</em>
          <em>{config.stake ? `${config.stake} coins` : 'Free entry'}</em>
          <ChevronDown className="fd-settings-chevron" size={16} aria-hidden="true" />
        </span>
      </summary>
      <div className="fd-settings-body">
        <div className="fd-field">
          <Label htmlFor="player-name">Your player name</Label>
          <Input
            id="player-name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={24}
            autoComplete="nickname"
            placeholder="Choose a name"
          />
        </div>
        <div className="fd-field">
          <Label id="timer-label">Time per question</Label>
          <div className="fd-opts" role="group" aria-labelledby="timer-label">
            {TIMERS.map((duration) => (
              <button
                key={duration}
                type="button"
                className="fd-opt fd-pressable"
                aria-pressed={duration === config.duration}
                {...press}
                onClick={() => onChange({ duration })}
              >
                {duration}s
              </button>
            ))}
          </div>
          <p className="fd-field-note">
            {MODES.find((m) => m.id === config.mode)?.name ?? 'This format'} opens on{' '}
            {MODE_DURATION[config.mode as keyof typeof MODE_DURATION] ?? MODE_DURATION.quick}s. A round also
            ends the moment both answers are in.
          </p>
        </div>
        <div className="fd-field">
          <Label id="stake-label">Entry · once per match</Label>
          <div className="fd-opts" role="group" aria-labelledby="stake-label">
            {stakes.map((stake) => {
              const why = closed(stake);
              const open = !why;
              const isSuggested = loaded && !bot && stake === suggested;
              return (
                <button
                  key={stake}
                  type="button"
                  className="fd-opt fd-pressable"
                  aria-pressed={stake === config.stake}
                  /* A practice bot never plays for coins (room-engine couples the two), so the paid
                     tiers are unavailable rather than refused after the tap. */
                  disabled={bot && stake !== 0}
                  /* A tier the wallet cannot enter stays in the row (so the ladder reads whole) but
                     does nothing, and says why on hover and to a screen reader. */
                  aria-disabled={open ? undefined : true}
                  aria-describedby={why ? `stake-why-${stake}` : undefined}
                  title={why || undefined}
                  {...press}
                  onClick={() => {
                    if (open) onChange({ stake });
                  }}
                >
                  {stake || 'Free'}
                  {isSuggested && <small className="fd-opt-tag">Suggested</small>}
                  {why && (
                    <span id={`stake-why-${stake}`} className="sr-only">
                      {why}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {advice && advice.kind !== 'ok' && (
            <p className="fd-stake-advice" role="status">
              <span>{advice.reason}</span>
              <button type="button" className="fd-link" {...press} onClick={() => onChange({ stake: advice.suggested })}>
                {advice.suggested ? `Play for ${advice.suggested}` : 'Play free'}
              </button>
            </p>
          )}
          {doubleOwed && (
            <p className="fd-field-note">A double-coin ad is open today. It is on the coins card in the top bar.</p>
          )}
          <p className="fd-fine">
            {bot
              ? 'Practice bots play for free. Entries are for duels with a friend.'
              : config.stake
                ? `${evCopy(config.stake, economy)} Draws refund the entry.`
                : 'Free simulated coins with no cash value. Draws refund the entry, and every new room starts with 1,000 per player.'}
          </p>
        </div>
        <div className="fd-fields">
          <Picker
            label="Region"
            value={config.region}
            onChange={(region) => onChange({ region })}
            items={['all', 'US', 'India', 'Europe', 'Global'].map((v) => [
              v,
              v === 'all' ? 'All regions' : v,
            ])}
          />
          <Picker
            label="Level"
            value={config.difficulty}
            onChange={(difficulty) => onChange({ difficulty })}
            items={['all', 'simple', 'expert', 'extreme'].map((v) => [v, v === 'all' ? 'All levels' : v])}
          />
          <Picker
            label="Subtopic"
            value={config.subtopic}
            onChange={(subtopic) => onChange({ subtopic })}
            items={[['all', 'Any subtopic'], ...subtopics.map((v) => [v, v] as [string, string])]}
          />
        </div>
      </div>
    </details>
  );
}
