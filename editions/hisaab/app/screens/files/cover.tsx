/**
 * screens/files/cover.tsx — the files lane's manila file cover: ui/FileCard's anatomy (F.No. tab,
 * Devanagari over Latin title, meta, tape / meter), with the CLEARED stamp moved off the title row to
 * the cover's bottom-right corner, where the tape was, at the bible's manila size (≥ 24px — `l`).
 * On a phone the title keeps the full width, so "FARM & FOOD" does not break around a stamp.
 * (ui/FileCard puts a 16px stamp beside the title; see the lane report.)
 *
 * A whole-card link (href) or a button (onClick) — nothing interactive inside it.
 */
import type { ReactNode } from 'react';
import { Meter } from '../../ui/meter';
import { Stamp } from '../../ui/stamp';
import { Tape } from '../../ui/tape';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import '../../ui/file-card.css';
import './cover.css';

export type FileCoverProps = {
  fno: string;
  title: ReactNode;
  titleHi?: string;
  icon?: ReactNode;
  meta?: ReactNode;
  state: 'sealed' | 'open' | 'cleared';
  progress?: { value: number; max: number; label: string; ticks?: number };
  seed: string;
  children?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Button-only a11y: aria-expanded (phone inline brief) or aria-pressed (desktop side brief). */
  expanded?: boolean;
  pressed?: boolean;
  controls?: string;
  className?: string;
};

export function FileCover({ fno, title, titleHi, icon, meta, state, progress, seed, children, href, onClick, expanded, pressed, controls, className }: FileCoverProps) {
  const { t } = useLang();
  const cls = cx('h-file', `h-file--${state}`, 'h-file--action', 'h-cover', className);
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
      {children ? <span className="h-file__extra">{children}</span> : null}
      {progress ? (
        <Meter
          as="span"
          className="h-file__meter"
          value={progress.value}
          max={progress.max}
          ticks={progress.ticks}
          label={progress.label}
          valueText={progress.label}
          copy={progress.label}
        />
      ) : null}
      {state === 'sealed' ? (
        <>
          <span className="h-sr">{t('Sealed. The tape is cut on the first card.', 'सील। पहले कार्ड पर फ़ीता कटेगा।')}</span>
          <Tape />
        </>
      ) : null}
      {state === 'cleared' ? (
        <span className="h-cover__stamp">
          <Stamp kind="noted" seed={seed} text="CLEARED" size="l" label={t('File cleared', 'फ़ाइल क्लियर')} />
        </span>
      ) : null}
    </>
  );
  if (href)
    return (
      <a className={cls} href={href}>
        {body}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={onClick} aria-expanded={expanded} aria-pressed={pressed} aria-controls={controls}>
      {body}
    </button>
  );
}
