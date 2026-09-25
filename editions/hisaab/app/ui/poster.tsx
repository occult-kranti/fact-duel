/**
 * ui/poster.tsx — the ONE poster line a screen may have (bible §2.2): Devanagari above in syahi,
 * Latin caps below in ink. Slogans, never data.
 *
 *   <Poster hi="जनता का पैसा।" en="Janta ka sawaal." swipe="sawaal" />
 */
import type { ReactNode } from 'react';
import { cx } from './cx';
import './poster.css';

export type PosterProps = {
  hi: string;
  en: string;
  /** One word of `en` to swipe with the highlighter (once per visit). */
  swipe?: string;
  /** Riso overprint on the Latin line. */
  overprint?: boolean;
  /** Heading level; the poster is often the screen's h1. */
  as?: 'h1' | 'h2' | 'p';
  size?: 'poster' | 'l';
  className?: string;
};

export function Poster({ hi, en, swipe, overprint = true, as: Tag = 'h1', size = 'poster', className }: PosterProps) {
  let latin: ReactNode = en;
  if (swipe) {
    const at = en.toLowerCase().indexOf(swipe.toLowerCase());
    if (at >= 0)
      latin = (
        <>
          {en.slice(0, at)}
          <mark className="h-poster__swipe">{en.slice(at, at + swipe.length)}</mark>
          {en.slice(at + swipe.length)}
        </>
      );
  }
  return (
    <Tag className={cx('h-poster', size === 'l' && 'h-poster--l', className)}>
      <span className="h-poster__hi" lang="hi">
        {hi}
      </span>
      <span className={cx('h-poster__en', overprint && 'h-poster__en--overprint')}>{latin}</span>
    </Tag>
  );
}
