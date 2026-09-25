/**
 * ui/noting-sheet.tsx — `h-sheet`, the green noting sheet with the red margin rule (bible §5):
 * explanations, rules, the Corrections page.
 *
 *   <NotingSheet>{item.explanation}</NotingSheet>
 *   <NotingSheet collapsible summary="Read the noting">…</NotingSheet>      (duels: collapsed)
 *   <NotingSheet hand="Noted. Pl. forward.">…</NotingSheet>                (one Kalam line per screen, max)
 */
import { useEffect, useState, type ReactNode } from 'react';
import { loadHandFont } from './fonts';
import { cx } from './cx';
import './noting-sheet.css';

export type NotingSheetProps = {
  children: ReactNode;
  /** Heading (default "Noting"). */
  title?: ReactNode;
  /** Render as a <details> that starts closed. */
  collapsible?: boolean;
  /** The summary text when collapsible. */
  summary?: ReactNode;
  defaultOpen?: boolean;
  /** One marginal note in the Kalam hand (the font loads lazily on first use). */
  hand?: string;
  className?: string;
};

export function NotingSheet({ children, title = 'Noting', collapsible, summary = 'Read the noting', defaultOpen, hand, className }: NotingSheetProps) {
  const [handReady, setHandReady] = useState(false);
  useEffect(() => {
    if (!hand) return;
    let live = true;
    void loadHandFont().then(() => live && setHandReady(true));
    return () => {
      live = false;
    };
  }, [hand]);
  const body = (
    <>
      <div className="h-sheet__body">{children}</div>
      {hand ? <p className={cx('h-sheet__hand', handReady && 'h-sheet__hand--ready')}>{hand}</p> : null}
    </>
  );
  if (collapsible)
    return (
      <details className={cx('h-sheet', 'h-sheet--collapsible', className)} open={defaultOpen}>
        <summary className="h-sheet__summary">{summary}</summary>
        {body}
      </details>
    );
  return (
    <section className={cx('h-sheet', className)}>
      <h2 className="h-sheet__title">{title}</h2>
      {body}
    </section>
  );
}
