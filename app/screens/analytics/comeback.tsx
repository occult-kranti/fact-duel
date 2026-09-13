'use client';
/**
 * The comeback cards — day 1, day 7, day 30 for THIS device.
 *
 * `retention()` answers each window with `true | false | null`, and the whole point of this
 * component is that the three states stay three states on screen. A window that has not elapsed is
 * `null`, and `null` reads as "still ahead", never as 0 and never as a rate: one device cannot
 * divide by a cohort it does not have.
 */
import { Check, Clock, CircleDashed, Minus } from 'lucide-react';
import { plural } from './util';

export type Comebacks = {
  readonly d1: boolean | null;
  readonly d7: boolean | null;
  readonly d30: boolean | null;
};

type State = 'back' | 'missed' | 'open' | 'unknown';

const WINDOWS = [
  { key: 'd1', day: 1 },
  { key: 'd7', day: 7 },
  { key: 'd30', day: 30 },
] as const;

const LABEL: Record<State, string> = {
  back: 'Came back',
  missed: 'Did not come back',
  open: 'Window still open',
  unknown: 'Not in the record',
};

const ICON = { back: Check, missed: Minus, open: Clock, unknown: CircleDashed };

/** The three states, plus the one case where `null` is not "still ahead" but "no longer stored". */
function read(value: boolean | null, day: number, daysSinceInstall: number, installed: boolean) {
  if (value === true) return 'back' as State;
  if (value === false) return 'missed' as State;
  if (!installed) return 'unknown' as State;
  return daysSinceInstall <= day ? ('open' as State) : ('unknown' as State);
}

function sentence(state: State, day: number, daysSinceInstall: number) {
  if (state === 'back') return `This device was used again on day ${day}.`;
  if (state === 'missed') return `Day ${day} came and went with no session on this device.`;
  if (state === 'unknown')
    return `Day ${day} is older than the 120 days this device keeps. Not stored is not the same as did not happen.`;
  const left = day - daysSinceInstall;
  if (left <= 0) return `Day ${day} is today — the window is still open.`;
  return `Day ${day} is still ahead: ${plural(left, 'day')} to go.`;
}

export function Comeback({
  returned,
  daysSinceInstall,
  installed,
}: {
  returned: Comebacks;
  daysSinceInstall: number;
  installed: boolean;
}) {
  return (
    <ul className="fd-an-comeback">
      {WINDOWS.map(({ key, day }) => {
        const state = read(returned[key], day, daysSinceInstall, installed);
        const Icon = ICON[state];
        return (
          <li key={key} className="fd-an-comeback-card" data-state={state}>
            <p className="fd-an-comeback-day">Day {day}</p>
            <p className="fd-an-comeback-state">
              <Icon aria-hidden="true" />
              {LABEL[state]}
            </p>
            <p className="fd-an-comeback-note">{sentence(state, day, daysSinceInstall)}</p>
          </li>
        );
      })}
    </ul>
  );
}
