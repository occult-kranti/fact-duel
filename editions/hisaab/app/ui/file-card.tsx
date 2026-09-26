/**
 * ui/file-card.tsx — `h-file`, the manila file: the tappable unit for modes, routes and states
 * (bible §5). A whole-card link or button; nothing interactive may sit inside a linked card.
 *
 *   <FileCard fno="F.No. S/UP" title="Uttar Pradesh" titleHi="उत्तर प्रदेश" meta="6 cards · 3 sectors"
 *     state="sealed" href={href.route('state-up')} />
 *   <FileCard fno="F.No. D/2026-09-25" title="Today's file" state="open" emphasis
 *     progress={{ value: 2, max: 5, label: '2 of 5 answered' }} onClick={open} />
 *
 * States: sealed (red tape band, "Sealed" in words), open (meter), cleared (✓ CLEARED stamp at the manila
 * size in the bottom-right corner, syahi tab).
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { Meter } from './meter';
import { Stamp } from './stamp';
import { Tape } from './tape';
import { cx } from './cx';
import './file-card.css';

export type FileState = 'sealed' | 'open' | 'cleared';

export type FileCardProps = {
  /** The typed tab, e.g. 'F.No. S/UP' (mono caps). */
  fno: string;
  title: ReactNode;
  /** Devanagari title shown above the Latin one (lang="hi" is set). */
  titleHi?: string;
  /** One line of meta under the title (UI 14px). */
  meta?: ReactNode;
  /** Leading icon (lucide, 24px) beside the title. */
  icon?: ReactNode;
  state?: FileState;
  /** A meter at the foot of the card. */
  progress?: { value: number; max: number; label: string; copy?: ReactNode };
  /** Red tape across the card. Defaults to state === 'sealed'. */
  tape?: boolean;
  /** Snap the tape (first card of a route). */
  tapeSnapping?: boolean;
  /** --h-shadow-3 (Today's file). */
  emphasis?: boolean;
  /** Seed for the CLEARED stamp's tilt (defaults to fno). */
  seed?: string;
  /** Words on the cleared stamp. */
  clearedText?: string;
  /** Extra content under the meta (static text only when the card is a link). */
  children?: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Accessible name override (defaults to the card's text). */
  ariaLabel?: string;
  /** Marks the selected file in a picker. */
  current?: boolean;
  className?: string;
};

export function FileCard({
  fno,
  title,
  titleHi,
  meta,
  icon,
  state = 'open',
  progress,
  tape,
  tapeSnapping,
  emphasis,
  seed,
  clearedText = 'CLEARED',
  children,
  href,
  onClick,
  ariaLabel,
  current,
  className,
}: FileCardProps) {
  const showTape = tape ?? state === 'sealed';
  const cls = cx('h-file', `h-file--${state}`, emphasis && 'h-file--emphasis', (href || onClick) && 'h-file--action', className);
  const body = (
    <>
      <span className="h-file__tab">{fno}</span>
      <span className="h-file__head">
        {icon ? (
          <span className="h-file__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="h-file__titles">
          {titleHi ? (
            <span className="h-file__titlehi" lang="hi">
              {titleHi}
            </span>
          ) : null}
          <span className="h-file__title">{title}</span>
        </span>
      </span>
      {meta ? <span className="h-file__meta">{meta}</span> : null}
      {state === 'sealed' ? <span className="h-sr">Sealed. The tape is cut on the first card.</span> : null}
      {showTape ? <Tape state={tapeSnapping ? 'snapping' : 'idle'} /> : null}
      {children ? <span className="h-file__extra">{children}</span> : null}
      {progress ? (
        <Meter as="span" className="h-file__meter" value={progress.value} max={progress.max} label={progress.label} valueText={progress.label} copy={progress.copy} />
      ) : null}
      {state === 'cleared' ? (
        // Bottom-right corner, where the tape sat, at the manila size (≥ 24px, bible §5): the title
        // keeps the full width on a phone.
        <span className="h-file__corner">
          <Stamp kind="noted" seed={seed ?? fno} text={clearedText} size="l" className="h-file__stamp" />
        </span>
      ) : null}
    </>
  );
  if (href)
    return (
      <a className={cls} href={href} aria-label={ariaLabel} aria-current={current ? 'true' : undefined}>
        {body}
      </a>
    );
  if (onClick)
    return (
      <button type="button" className={cls} onClick={onClick} aria-label={ariaLabel} aria-pressed={current}>
        {body}
      </button>
    );
  return (
    <div className={cls} aria-label={ariaLabel}>
      {body}
    </div>
  );
}
