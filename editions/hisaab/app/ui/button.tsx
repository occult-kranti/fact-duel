/**
 * ui/button.tsx — `h-btn` (bible §5). ONE `primary` per screen: it is that screen's primary action.
 *
 *   <Button variant="primary" onClick={start}>Open today's file</Button>
 *   <Button href={href.files()} variant="paper">All files</Button>        // a hash link styled as a button
 *   <Button variant="ghost" trailing={null}>Not now</Button>
 *   <IconButton label="Settings" icon={<Settings />} href={href.settings()} />
 *
 * Press = print down (translate 2px, shadow to 0) on :active within --h-dur-tap; it never delays the
 * click. Labels wrap to two lines rather than truncate (Hindi is ~30% wider).
 */
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { ArrowRight } from 'lucide-react';
import { cx } from './cx';
import './button.css';

export type ButtonVariant = 'primary' | 'paper' | 'ghost';
export type ButtonSize = 'm' | 's';

type Common = {
  variant?: ButtonVariant;
  /** 'm' = 52px (default), 's' = 44px for secondary actions inside cards. */
  size?: ButtonSize;
  /** Leading icon (lucide, 20px). */
  icon?: ReactNode;
  /** Trailing glyph. Default: an arrow on primary buttons, nothing otherwise. Pass null for none. */
  trailing?: ReactNode | null;
  /** Full width of its container. */
  block?: boolean;
  /** Shows a busy state and sets aria-busy; the button stays focusable. */
  busy?: boolean;
  children?: ReactNode;
};

export type ButtonProps = Common &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string; disabled?: boolean } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)
  );

/** The class list for an h-btn, for elements that cannot use <Button> (a <label>, a <summary>). */
export function buttonClass(variant: ButtonVariant = 'paper', size: ButtonSize = 'm', block = false, extra?: string) {
  return cx('h-btn', `h-btn--${variant}`, size === 's' && 'h-btn--s', block && 'h-btn--block', extra);
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(props, ref) {
  const { variant = 'paper', size = 'm', icon, trailing, block, busy, children, className, ...rest } = props as Common & {
    className?: string;
    href?: string;
    disabled?: boolean;
  } & Record<string, unknown>;
  const tail = trailing === undefined ? (variant === 'primary' ? <ArrowRight aria-hidden="true" size={20} strokeWidth={2.4} /> : null) : trailing;
  const inner = (
    <>
      {icon ? <span className="h-btn__icon" aria-hidden="true">{icon}</span> : null}
      <span className="h-btn__label">{children}</span>
      {tail ? <span className="h-btn__tail" aria-hidden="true">{tail}</span> : null}
    </>
  );
  const cls = buttonClass(variant, size, !!block, className as string | undefined);
  if (typeof rest.href === 'string') {
    const { href, disabled, ...anchor } = rest as { href: string; disabled?: boolean } & AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        {...anchor}
        ref={ref as Ref<HTMLAnchorElement>}
        href={disabled ? undefined : href}
        role={disabled ? 'link' : undefined}
        aria-disabled={disabled || undefined}
        aria-busy={busy || undefined}
        className={cls}
      >
        {inner}
      </a>
    );
  }
  const { type, ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...button} ref={ref as Ref<HTMLButtonElement>} type={type ?? 'button'} aria-busy={busy || undefined} className={cls}>
      {inner}
    </button>
  );
});

export type IconButtonProps = {
  /** The accessible name (required: the button shows only an icon). */
  label: string;
  icon: ReactNode;
  href?: string;
  pressed?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

/** A 44 × 44 icon-only control (top bar: mute, settings). */
export function IconButton({ label, icon, href, pressed, className, ...rest }: IconButtonProps) {
  const cls = cx('h-iconbtn', className);
  if (href)
    return (
      <a href={href} className={cls} aria-label={label} title={label}>
        <span aria-hidden="true">{icon}</span>
      </a>
    );
  return (
    <button {...rest} type={rest.type ?? 'button'} className={cls} aria-label={label} title={label} aria-pressed={pressed}>
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
