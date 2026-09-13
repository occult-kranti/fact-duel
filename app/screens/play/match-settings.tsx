'use client';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Config } from '../types';
import { usePlayJuice } from './press';

const TIMERS = [10, 15, 30];
const STAKES = [0, 10, 25, 50, 100];

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
};

/* Everything you rarely change, folded away: name, timer, entry coins, region, level, subtopic. */
export function MatchSettings({ config, name, subtopics, onChange, onName }: MatchSettingsProps) {
  const { press } = usePlayJuice();
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
        </div>
        <div className="fd-field">
          <Label id="stake-label">Entry · once per match</Label>
          <div className="fd-opts" role="group" aria-labelledby="stake-label">
            {STAKES.map((stake) => (
              <button
                key={stake}
                type="button"
                className="fd-opt fd-pressable"
                aria-pressed={stake === config.stake}
                {...press}
                onClick={() => onChange({ stake })}
              >
                {stake || 'Free'}
              </button>
            ))}
          </div>
          <p className="fd-fine">
            Free simulated coins with no cash value. Draws refund the entry, and every new room starts with
            1,000 per player.
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
