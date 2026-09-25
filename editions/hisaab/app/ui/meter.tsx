/**
 * ui/meter.tsx — `h-meter` (bible §5): a 12px pill track with a syahi fill, optional ticks, and a
 * goal-gradient copy slot beside it ("180 XP to Prime-Time Loyalist" — see data.ts goalCopy).
 *
 *   <Meter value={3.4} max={5} ticks={5} label="Level progress in this band" copy={goalCopy(xp)} />
 */
import type { ReactNode } from 'react';
import { cx } from './cx';
import './meter.css';

export type MeterProps = {
  value: number;
  max: number;
  /** Accessible name of the progress bar. */
  label: string;
  /** Tick marks dividing the track (5 = the levels of a band). */
  ticks?: number;
  /** Goal-gradient copy, shown next to (phone: under) the track. */
  copy?: ReactNode;
  /** Text for aria-valuetext, e.g. "3 of 6 answered". */
  valueText?: string;
  /** 'span' inside links and buttons (phrasing content only); default 'div'. */
  as?: 'div' | 'span';
  className?: string;
};

export function Meter({ value, max, label, ticks, copy, valueText, as = 'div', className }: MeterProps) {
  const Box = as;
  const Copy = as === 'span' ? 'span' : 'p';
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.max(0, Math.min(safeMax, Number.isFinite(value) ? value : 0));
  const pct = (clamped / safeMax) * 100;
  return (
    <Box className={cx('h-meterrow', className)}>
      <Box
        className="h-meter"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(clamped * 100) / 100}
        aria-valuetext={valueText}
      >
        <span className="h-meter__fill" style={{ width: `${pct}%` }} />
        {ticks && ticks > 1
          ? Array.from({ length: ticks - 1 }, (_, i) => (
              <span key={i} className="h-meter__tick" style={{ left: `${((i + 1) / ticks) * 100}%` }} />
            ))
          : null}
      </Box>
      {copy ? <Copy className="h-meter__copy">{copy}</Copy> : null}
    </Box>
  );
}
