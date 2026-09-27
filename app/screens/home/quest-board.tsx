'use client';
/**
 * app/screens/home/quest-board.tsx — the three daily quests.
 * Auto-claimed by the reducer, so a card never asks for a tap to collect: it shows the meter, the
 * reward chips and, while it is open, the shortest route to finishing it.
 */
import { ArrowUpRight, Check, Target, Zap } from 'lucide-react';
import { XP } from '@/lib/progression.mjs';
import { visiblePracticeMissions } from '@/lib/jhk-online/practice-missions.mjs';
import { questHint, type QuestItem } from './util';
import { usePress } from './press';
import { useLocale } from '../../use-locale';

export type QuestBoardProps = {
  items: QuestItem[];
  resetIn: string;
  onOpen: (item: QuestItem) => void;
  practiceOnly?: boolean;
};

export function QuestBoard({ items, resetIn, onOpen, practiceOnly = false }: QuestBoardProps) {
  const { t, locale } = useLocale();
  const text = (en: string, hi: string) => locale === 'hi' ? hi : en;
  const visibleItems: QuestItem[] = practiceOnly ? visiblePracticeMissions(items) : items;
  const press = usePress();
  const doneCount = visibleItems.filter((q) => q.done).length;
  const allDone = visibleItems.length > 0 && doneCount === visibleItems.length;
  return (
    <section className="fd-hub-quests" aria-labelledby="fd-hub-quests-title">
      <header className="fd-hub-section-head">
        <div>
          <p className="fd-hub-eyebrow">
            <Target aria-hidden="true" />
            {practiceOnly ? text('PRACTICE MISSIONS', 'अभ्यास के काम') : t('quests.eyebrow')}
          </p>
          <h2 id="fd-hub-quests-title">
            {practiceOnly
              ? visibleItems.length ? t('quests.done', { done: doneCount, total: visibleItems.length }) : text('Keep learning at your pace.', 'अपनी रफ़्तार से सीखते रहें।')
              : allDone ? t('quests.allDone') : t('quests.done', { done: doneCount, total: items.length || 3 })}
          </h2>
        </div>
        <p className="fd-hub-section-note">
          {/* `resetIn` is empty until the client clock is known, so SSR and hydration agree. */}
          {resetIn && <>{t('quests.newSet', { time: resetIn })}</>}
          {practiceOnly ? text('Practice XP stays on this device.', 'अभ्यास XP इस डिवाइस पर रहता है।') : <>{t('quests.allPays')} <b className="fd-mono">+{XP.questBonus} XP</b></>}
        </p>
      </header>
      <ul className="fd-hub-quest-grid">
        {visibleItems.map((q) => {
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
                  aria-label={t('quests.meterAria', { label: q.label, progress: q.progress, target: q.target })}
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
        {practiceOnly && visibleItems.length === 0 && <li><span className="fd-hub-quest fd-hub-quest--empty"><strong className="fd-hub-quest-label">{text('No practice missions in today’s set.', 'आज के सेट में अभ्यास का कोई काम नहीं है।')}</strong><small>{text('Expeditions still earn practice XP and stamps.', 'अभियानों से अभ्यास XP और स्टैम्प मिलते रहेंगे।')}</small></span></li>}
        {!practiceOnly && items.length === 0 &&
          [0, 1, 2].map((i) => (
            <li key={i}>
              <span className="fd-hub-quest fd-hub-quest--empty">
                <strong className="fd-hub-quest-label">{t('quests.emptyTitle')}</strong>
                <small>{t('quests.emptyHint')}</small>
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}
