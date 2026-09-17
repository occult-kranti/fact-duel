'use client';
import { useRef } from 'react';
import { Check, Trophy } from 'lucide-react';
import { FORMAT_COPY } from '@/lib/duel-presentation.mjs';
import { XP } from '@/lib/progression.mjs';
import { usePresence } from '@/lib/presence-client';
import type { Mode } from '../types';
import { usePlayJuice } from './press';
import { useLocale } from '../../use-locale';

/**
 * Reward preview straight from the XP tunables the reducer uses (lib/progression.mjs). `t` is
 * the locale's lookup; without one the label is the English line.
 */
export function modeReward(id: string, t?: (key: string, vars?: Record<string, string | number>) => string) {
  const xp = (XP.matchWin as Record<string, number>)[id] ?? XP.matchWin.quick;
  const rp = (XP.rankWin as Record<string, number>)[id] ?? XP.rankWin.quick;
  return { xp, rp, label: t ? t('launch.reward', { xp, rp }) : `Win: +${xp} XP · +${rp} RP` };
}

export type ModeCardsProps = {
  modes: Mode[];
  selected: string;
  onSelect: (id: string) => void;
};

/* Radiogroup of the three formats. Arrows / Home / End move and select (WAI-ARIA radio group);
 * only the checked card is in the tab order.
 *
 * Under each card, one muted line of live presence (lib/presence-client.ts): the server's count of
 * people waiting in that format and of matches running in it right now. The rules are honesty
 * rules, not styling ones:
 *  - the line exists only once a real answer has arrived. While loading there is no line and no
 *    skeleton digit, and in the static build `usePresence()` is null forever, so there is never a
 *    number on a build that cannot count one.
 *  - zero is printed as zero ("Nobody in queue · In game 0"). Nothing is padded or held over.
 *  - the 6 px dot is volt only while the last successful poll is under 15 s old; after that it
 *    goes grey and the numbers stand as the last thing the server actually said.
 *  - the numbers never animate. A counter ticking up would dramatise a figure that is simply a
 *    fact, and would read as activity that is not happening.
 * The lines share ONE `aria-live="polite"` region so a screen reader hears at most one update per
 * poll, and they sit outside the buttons so no card's accessible name changes every ten seconds. */
export function ModeCards({ modes, selected, onSelect }: ModeCardsProps) {
  const { press, cue } = usePlayJuice();
  const { t, n, pick: label } = useLocale();
  const presence = usePresence();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pick = (index: number, focus = true) => {
    const mode = modes[index];
    if (!mode) return;
    if (focus) refs.current[index]?.focus();
    if (mode.id !== selected) cue('select', 'light');
    onSelect(mode.id);
  };
  return (
    <div className="fd-modes-live" role="group" aria-live="polite" aria-label={t('presence.aria')}>
      <div className="fd-modes" role="radiogroup" aria-label={t('modes.aria')}>
        {modes.map((m, i) => {
          const on = selected === m.id;
          const reward = modeReward(m.id, t);
          const Icon = m.icon;
          const here = presence?.modes[m.id];
          return (
            <div className="fd-mode-cell" key={m.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="fd-mode fd-pressable"
                data-mode={m.id}
                title={(FORMAT_COPY as Record<string, { rule?: string } | undefined>)[m.id]?.rule}
                {...press}
                onKeyDown={(e) => {
                  const last = modes.length - 1;
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    pick(i === last ? 0 : i + 1);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    pick(i === 0 ? last : i - 1);
                  } else if (e.key === 'Home') {
                    e.preventDefault();
                    pick(0);
                  } else if (e.key === 'End') {
                    e.preventDefault();
                    pick(last);
                  }
                }}
                onClick={() => pick(i, false)}
              >
                <span className="fd-mode-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="fd-mode-body">
                  <span className="fd-mode-top">
                    <strong>{label(`modes.${m.id}.name`, m.name)}</strong>
                    <em className="fd-mode-rounds">{n('launch.rounds', m.rounds)}</em>
                  </span>
                  <span className="fd-mode-short">{label(`modes.${m.id}.short`, m.short)}</span>
                  <span className="fd-mode-reward">
                    <Trophy size={13} aria-hidden="true" />
                    {reward.label}
                  </span>
                </span>
                <span className="fd-mode-mark" aria-hidden="true">
                  <Check size={15} />
                </span>
              </button>
              {here ? (
                <p className="fd-mode-presence" data-live={presence?.fresh ? 'on' : 'off'}>
                  <span className="fd-mode-dot" aria-hidden="true" />
                  {here.inQueue === 0
                    ? t('presence.lineZero', { m: here.inGame })
                    : t('presence.line', { n: here.inQueue, m: here.inGame })}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
