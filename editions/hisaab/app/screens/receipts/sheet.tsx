/**
 * screens/receipts/sheet.tsx — a modal sheet: bottom sheet on phones, a centred panel from 600px.
 * role="dialog" aria-modal, focus moves in and is trapped, Esc and the scrim close it, focus returns
 * to what opened it, the page behind stops scrolling. Rendered into <body> (a portal). While open it counts as a new visit for the
 * notification budget (bible §9.1: "a sheet open = new visit").
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useVisit } from '../../budget';
import { IconButton } from '../../ui/button';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible title (also shown in the sheet head). */
  title: ReactNode;
  kicker?: ReactNode;
  children: ReactNode;
  /** Budget visit key. */
  visitKey: string;
  className?: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, title, kicker, children, visitKey, className }: SheetProps) {
  const { t } = useLang();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useVisit(open, visitKey);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const body = document.body;
    const overflow = body.style.overflow;
    body.style.overflow = 'hidden';
    // Focus the panel itself (not the first link) so a screen reader starts at the title.
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      body.style.overflow = overflow;
      before?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;
  // Portalled to <body>: the routed screen animates in with a transform, which would otherwise make it
  // the containing block of this fixed sheet (and cap its stacking under the top bar and nav).
  return createPortal(
    <div className={cx('h-vsheet', className)} role="presentation">
      <div className="h-vsheet__scrim" aria-hidden="true" onClick={() => close.current()} />
      <div className="h-vsheet__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={panel}>
        <div className="h-vsheet__head">
          <div className="h-vsheet__titles">
            {kicker ? <p className="h-kicker">{kicker}</p> : null}
            <h2 className="h-vsheet__title" id={titleId}>
              {title}
            </h2>
          </div>
          <IconButton label={t('Close', 'बंद करो')} icon={<X size={22} strokeWidth={2.4} />} onClick={() => close.current()} />
        </div>
        <div className="h-vsheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
