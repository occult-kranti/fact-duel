'use client';
/**
 * Small shared pieces for the Vault / Discovery / Collections surfaces: counting stat tiles,
 * filter chips, progress dots, mastery mini-bars and the empty state. All press-feedback aware.
 */
import type { ReactNode } from 'react';
import { NumberCounter } from '@/components/fx';
import type { LucideIcon } from 'lucide-react';
import { usePress } from './press';

export type Tone = 'cyan' | 'gold' | 'volt' | 'magenta' | 'ember';
/* Two halves of one accent: the fill paints the rule down the tile, the text twin paints the icon
 * so it survives the light theme (tokens.css §2). */
const TONE_VAR: Record<Tone, string> = {
  cyan: 'var(--cyan)',
  gold: 'var(--gold)',
  volt: 'var(--volt)',
  magenta: 'var(--magenta)',
  ember: 'var(--ember)',
};
const TONE_TEXT_VAR: Record<Tone, string> = {
  cyan: 'var(--cyan-text)',
  gold: 'var(--gold-text)',
  volt: 'var(--volt-text)',
  magenta: 'var(--magenta-text)',
  ember: 'var(--ember-text)',
};

/** A header stat: icon, count-up number, label. */
export function StatTile({
  icon: Icon,
  value,
  label,
  tone = 'cyan',
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tone?: Tone;
}) {
  return (
    <article
      className="fd-stat"
      style={{ '--tone': TONE_VAR[tone], '--tone-text': TONE_TEXT_VAR[tone] } as React.CSSProperties}
    >
      <span className="fd-stat__icon">
        <Icon aria-hidden="true" />
      </span>
      <strong className="fd-stat__value">
        <NumberCounter value={value} from={0} duration={700} />
      </strong>
      <span className="fd-stat__label">{label}</span>
    </article>
  );
}

/** Pill filter chip with an optional count. The count is only ever the player's own tally (their
 * journal entries behind a filter), never how many items a bank or topic holds. */
export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  const press = usePress();
  return (
    <button type="button" className="fd-chip" aria-pressed={active} onPointerDown={press} onClick={onClick}>
      {children}
      {count !== undefined && <span className="fd-chip__n">{count}</span>}
    </button>
  );
}

/** Card-by-card progress dots. */
export function Dots({ total, index, label }: { total: number; index: number; label: string }) {
  return (
    <div className="fd-dots" role="img" aria-label={label}>
      {Array.from({ length: Math.max(0, total) }, (_, i) => (
        <span key={i} className="fd-dot" data-state={i < index ? 'done' : i === index ? 'current' : 'todo'} />
      ))}
    </div>
  );
}

/** One mastery mini-bar (encountered / opened / recalled). `total` is the player's own encountered
 * count for the topic, so the bars describe their record and never the size of the pool. */
export function MasteryBar({
  label,
  value,
  total,
  tone = 'cyan',
}: {
  label: string;
  value: number;
  total: number;
  tone?: Tone;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((100 * value) / total)) : 0;
  return (
    <span className="fd-mastery__row">
      <span>{label}</span>
      <span className="fd-mastery__track">
        <span
          className="fd-mastery__fill"
          style={{ width: `${pct}%`, '--bar': TONE_VAR[tone] } as React.CSSProperties}
        />
      </span>
      <span>{value}</span>
    </span>
  );
}

/** Invitation panel used when a surface has nothing to show yet. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="fd-empty">
      <span className="fd-empty__badge">
        <Icon aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
