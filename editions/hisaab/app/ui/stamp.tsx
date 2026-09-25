/**
 * ui/stamp.tsx — `h-stamp` (bible §5): a verdict word + icon in a rotated double-border stamp.
 *
 *   <Stamp kind="pass" seed={item.id} />                 SAHI · APPROVED ✓
 *   <Stamp kind="fail" seed={item.id} animate />         GALAT · OBJECTION ✕ (slams once)
 *   <Stamp kind="noted" seed="cert" text="ISSUED · 25 SEP 2026" size="l" />
 *
 * The tilt is seeded (item id), never random per render. ≥ 20px bold; use size "l" (≥ 24px) on
 * manila. Colour is never alone: the word and the icon carry the verdict.
 */
import { Check, Hourglass, Stamp as StampIcon, X } from 'lucide-react';
import { cx } from './cx';
import { stampAngle } from './seed';
import './stamp.css';

export type StampKind = 'pass' | 'fail' | 'wait' | 'noted';

/** The default words (bible §2.1). */
export const STAMP_WORDS: Readonly<Record<StampKind, string>> = Object.freeze({
  pass: 'SAHI · APPROVED',
  fail: 'GALAT · OBJECTION',
  wait: 'PENDING',
  noted: 'NOTED',
});

const ICONS = { pass: Check, fail: X, wait: Hourglass, noted: StampIcon } as const;

export type StampProps = {
  kind: StampKind;
  /** Seed for the tilt (item id, route id, band). */
  seed: string;
  /** Override the words (keep them short and uppercase). */
  text?: string;
  /** 'm' = 20px (paper, receipts), 'l' = 26px (manila, ceremonies), 's' = 16px minis in lists. */
  size?: 's' | 'm' | 'l';
  /** Play the slam once on mount (motion #3). Off on the live question surface — always. */
  animate?: boolean;
  /** Extra words for screen readers ("Correct", "File cleared"). */
  label?: string;
  className?: string;
};

export function Stamp({ kind, seed, text, size = 'm', animate = false, label, className }: StampProps) {
  const Icon = ICONS[kind];
  const words = text ?? STAMP_WORDS[kind];
  return (
    <span
      className={cx('h-stamp', `h-stamp--${kind}`, `h-stamp--${size}`, animate && 'h-stamp--animate', className)}
      style={{ ['--h-stamp-rot' as string]: `${stampAngle(seed)}deg` }}
      role="img"
      aria-label={label ? `${label}: ${words}` : words}
    >
      <Icon aria-hidden="true" className="h-stamp__icon" strokeWidth={3} />
      <span className="h-stamp__word" aria-hidden="true">
        {words}
      </span>
    </span>
  );
}
