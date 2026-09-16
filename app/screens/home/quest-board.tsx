'use client';
/**
 * app/screens/home/quest-board.tsx — the three daily quests.
 * Auto-claimed by the reducer, so a card never asks for a tap to collect: it shows the meter, the
 * reward chips and, while it is open, the shortest route to finishing it.
 */
import { ArrowUpRight, Check, Target, Zap } from 'lucide-react';
import { XP } from '@/lib/progression.mjs';
import { questHint, type QuestItem } from './util';
import { usePress } from './press';

export type QuestBoardProps = {
  items: QuestItem[];
  resetIn: string;
  onOpen: (item: QuestItem) => void;
};

export function QuestBoard({ items, resetIn, onOpen }: QuestBoardProps) {
  const press = usePress();
  const doneCount = items.filter((q) => q.done).length;
  const allDone = items.length > 0 && doneCount === items.length;
  return (
    <section className="fd-hub-quests" aria-labelledby="fd-hub-quests-title">
      <header className="fd-hub-section-head">
        <div>
          <p className="fd-hub-eyebrow">
            <Target aria-hidden="true" />
            DAILY QUESTS
          </p>
          <h2 id="fd-hub-quests-title">
            {allDone ? 'All three cleared.' : `${doneCount} of ${items.length || 3} done today.`}
          </h2>
        </div>
        <p className="fd-hub-section-note">
          {/* `resetIn` is empty until the client clock is known, so SSR and hydration agree. */}
          {resetIn && <>New set in {resetIn} · </>}all three pays{' '}
          <b className="fd-mono">+{XP.questBonus} XP</b>
        </p>
      </header>
      <ul className="fd-hub-quest-grid">
        {items.map((q) => {
          const pct = Math.round(Math.min(1, q.progress / Math.max(1, q.target)) * 100);
          return (
            <li key={q.id}>
              <button
                type="button"
                className="fd-hub-quest fd-hub-press"
                data-done={q.done || undefined}
                onPointerDown={press}
                onClick={() => onOpen(q)}
              >
                <span className="fd-hub-quest-top">
                  <span className="fd-hub-quest-mark" aria-hidden="true">
                    {q.done ? <Check /> : <span className="fd-mono">{q.progress}</span>}
                  </span>
                  <span className="fd-hub-quest-rewards">
                    <span className="fd-hub-chip fd-hub-chip--xp">
                      <Zap aria-hidden="true" />+{q.xp} XP
                    </span>
                  </span>
                </span>
                <strong className="fd-hub-quest-label">{q.label}</strong>
                <span
                  className="fd-hub-meter fd-hub-meter--quest"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={q.target}
                  aria-valuenow={q.progress}
                  aria-label={`${q.label}: ${q.progress} of ${q.target}`}
                >
                  <i className="fd-hub-meter-fill" style={{ width: `${pct}%` }} />
                </span>
                <span className="fd-hub-quest-foot">
                  <small>{questHint(q)}</small>
                  <small className="fd-mono">
                    {q.progress}/{q.target}
                  </small>
                  {!q.done && <ArrowUpRight aria-hidden="true" />}
                </span>
              </button>
            </li>
          );
        })}
        {items.length === 0 &&
          [0, 1, 2].map((i) => (
            <li key={i}>
              <span className="fd-hub-quest fd-hub-quest--empty">
                <strong className="fd-hub-quest-label">Today’s quests arrive with your first visit.</strong>
                <small>Three every day: one easy, one medium, one hard.</small>
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}
