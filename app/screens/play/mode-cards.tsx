'use client';
import { useRef } from 'react';
import { Check, Trophy } from 'lucide-react';
import { FORMAT_COPY } from '@/lib/duel-presentation.mjs';
import { XP } from '@/lib/progression.mjs';
import { PRESENCE_LIVE, presenceLineKey, queuedFormat, usePresence } from '@/lib/presence-client';
import type { Mode } from '../types';
import { useRivalQueue } from './opponent-picker';
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
 * the people waiting in that format and of the people playing it right now. Both numbers are
 * people. The rules are honesty rules, not styling ones:
 *  - the line's TEXT exists only once a real answer has arrived. While loading there is no
 *    sentence and no skeleton digit — only the empty box that holds one, so nothing below it
 *    jumps when the first poll lands — and in the static build `usePresence()` is null forever,
 *    so there is never a number on a build that cannot count one.
 *  - the count is per FORMAT, across every sport and entry, and the copy says so. Pairing needs a
 *    lane (sport, mode, entry), so the launch panel's number during a search is a subset of this
 *    one; the two are allowed to differ and neither is "rivals you can meet".
 *  - when the viewer's own live queue row is one of the rows counted, the line says "you
 *    included" (`presenceLineKey`). A player alone on the service must never be shown their own
 *    row as company.
 *  - zero is printed as zero. Nothing is padded or held over.
 *  - a last answer older than 15 s is not called live. The 6 px dot goes grey AND the line gains
 *    `presence.stale` in words, because a colour on an `aria-hidden` dot tells a screen-reader or
 *    colour-blind player nothing at all.
 *  - the numbers never animate. A counter ticking up would dramatise a figure that is simply a
 *    fact, and would read as activity that is not happening.
 * The lines share ONE `aria-live="polite"` region so a screen reader hears at most one update per
 * poll, and they sit outside the buttons so no card's accessible name changes every ten seconds. */
export function ModeCards({ modes, selected, onSelect }: ModeCardsProps) {
  const { press, cue } = usePlayJuice();
  const { t, n, pick: label } = useLocale();
  const presence = usePresence();
  // The format the viewer's own queue row is in, if any: the arena's rival search, read through
  // the context the launch panel already uses, so nothing new is threaded through the screen.
  const rival = useRivalQueue();
  const mine = queuedFormat(rival?.search, selected);
  const stale = !!presence && !presence.fresh;
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
              {/* Wherever there IS a server, the line's box is always in the tree, empty until an
                  answer arrives: reserved (play.css `min-height`) so the topic chips below do not
                  move under a thumb when the first poll lands, and empty because an empty box
                  states nothing. On a build with no server there is no box either — no line is
                  ever coming, so no space is held for one. */}
              {PRESENCE_LIVE ? (
                <p className="fd-mode-presence" data-live={here ? (stale ? 'off' : 'on') : 'none'}>
                  {here ? (
                    <>
                      <span className="fd-mode-dot" aria-hidden="true" />
                      <span className="fd-mode-say">
                        {t(presenceLineKey(here.inQueue, mine === m.id), { n: here.inQueue, m: here.inGame })}
                        {stale ? ` ${t('presence.stale')}` : ''}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
