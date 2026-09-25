/**
 * screens/start/label-card.tsx — the player's label, inline (design bible §4.5, §11.1, §11.2).
 *
 *   <LabelCard xp={xp} intro />          first run, after the first receipt: "You start as ANDHBHAKT…"
 *   <LabelCard xp={xp} footer={streak} /> Home's label block: "You are · Level 7" + meter + goal copy
 *
 * Never a ceremony: the label appears in place. The Devanagari label sits above the Latin one, the
 * one-liner always travels with it, and the band meter carries the goal-gradient copy (data.goalCopy).
 * `intro` adds the first-sighting line under Andhbhakt, which keeps the rung about reading habits,
 * not about any party. Other lanes may import this card (e.g. a taster's first receipt).
 */
import type { ReactNode } from 'react';
import { bandProgress, FIRST_LABEL_NOTE, goalCopy, labelDisplay, standing } from '../../data';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { Meter } from '../../ui/meter';
import './label-card.css';

export type LabelCardProps = {
  /** Total XP (player.progression.xp). */
  xp: number;
  /** First-sighting framing: "You start as" + the Andhbhakt note. Only meaningful in band 0. */
  intro?: boolean;
  /** Heading level of the label (default h2). */
  as?: 'h2' | 'h3';
  /** Id for the label heading (for aria-labelledby on a wrapping section). */
  headingId?: string;
  /** Extra rows under the meter (streak, links). */
  footer?: ReactNode;
  className?: string;
};

export function LabelCard({ xp, intro, as: Heading = 'h2', headingId, footer, className }: LabelCardProps) {
  const { t, isHi } = useLang();
  const s = standing(xp);
  const label = labelDisplay(s.band);
  const progress = bandProgress(xp);
  const goal = goalCopy(xp);
  const introNow = !!intro && s.band === 0;
  const kicker = introNow
    ? t('YOU START AS', 'आपकी शुरुआत')
    : t(`YOU ARE · LEVEL ${s.level}`, `आप हैं · लेवल ${s.level}`);
  return (
    <div className={cx('h-labelcard', introNow && 'h-labelcard--intro', className)}>
      <p className="h-kicker h-labelcard__kicker" lang={isHi ? 'hi' : undefined}>
        {kicker}
      </p>
      <Heading className="h-labelcard__label" id={headingId}>
        <span className="h-labelcard__hi" lang="hi">
          {label.hi}
        </span>
        <span className="h-labelcard__en">
          {label.en}
          {label.aside ? <span className="h-labelcard__aside"> {label.aside}</span> : null}
        </span>
      </Heading>
      <p className="h-labelcard__line">{label.line}</p>
      {introNow ? <p className="h-labelcard__note">{FIRST_LABEL_NOTE}</p> : null}
      <Meter
        className="h-labelcard__meter"
        value={progress.value}
        max={progress.max}
        ticks={5}
        label={t('Progress to the next label', 'अगले लेबल तक')}
        valueText={`Level ${s.level}. ${goal}`}
        copy={goal}
      />
      {footer ? <div className="h-labelcard__foot">{footer}</div> : null}
    </div>
  );
}
