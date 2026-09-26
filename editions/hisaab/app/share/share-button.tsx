/**
 * share/share-button.tsx — a button that runs a share and reports the outcome ON ITSELF (bible §9:
 * "Copied ✓" is inline, never a toast).
 *
 *   <ShareButton run={() => shareReceipt(item, 'receipt')} />                      // "Forward this — it's actually sourced"
 *   <ShareButton run={() => shareCertificate(input)} variant="primary">Share certificate</ShareButton>
 *
 * While the card is being drawn the button is busy; afterwards it says "Shared ✓" / "Copied ✓" /
 * "Image saved · text copied ✓" / "Could not share. Try again" for a few seconds (aria-live polite),
 * then returns to its label. A cancelled share says nothing.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Share2 } from 'lucide-react';
import { Button, type ButtonVariant } from '../ui/button';
import { useLang } from '../ui/lang';
import { SHARE_CTA, SHARE_CTA_HI, shareOutcomeWords, type ShareOutcome } from './index';
import './share-button.css';

export type ShareButtonProps = {
  /** Starts the share (shareReceipt / shareCertificate / …) and resolves with its outcome. */
  run: () => Promise<ShareOutcome>;
  /** Label; default "Forward this — it's actually sourced". */
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: 'm' | 's';
  block?: boolean;
  /** Leading icon; default the share glyph. Pass null for none. */
  icon?: ReactNode | null;
  className?: string;
  /** Called with every outcome (e.g. to log it). */
  onOutcome?: (outcome: ShareOutcome) => void;
  disabled?: boolean;
};

const HOLD_MS = 3200;

export function ShareButton({ run, children, variant = 'paper', size = 'm', block, icon, className, onOutcome, disabled }: ShareButtonProps) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [words, setWords] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setWords(null);
    let outcome: ShareOutcome;
    try {
      outcome = await run();
    } catch {
      outcome = { ok: false, method: 'none', reason: 'failed' };
    }
    if (!live.current) return;
    setBusy(false);
    onOutcome?.(outcome);
    setWords(shareOutcomeWords(outcome, t));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => live.current && setWords(null), HOLD_MS);
  };

  const label = children ?? t(SHARE_CTA, SHARE_CTA_HI);
  return (
    <Button
      variant={variant}
      size={size}
      block={block}
      busy={busy}
      disabled={disabled}
      icon={icon === null ? undefined : (icon ?? <Share2 size={20} strokeWidth={2.4} />)}
      trailing={variant === 'primary' ? undefined : null}
      className={className}
      onClick={() => void onClick()}
    >
      <span className="h-sharebtn__words" aria-live="polite">
        {words ?? label}
      </span>
    </Button>
  );
}
