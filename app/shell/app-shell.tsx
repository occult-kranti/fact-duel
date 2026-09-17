'use client';
import type { ReactNode } from 'react';
import { Topbar, type TopbarProps } from './topbar';
import { Nav, type NavTabId } from './nav';
import { FxProvider } from '@/components/fx/fx-provider';
import { useLocale } from '../use-locale';
import './shell.css';

export type AppShellProps = {
  /** Current tab id (used for aria-current on the nav). */
  tab: string;
  /** A room is open in any phase: the nav is not rendered at all and the frame is single-column. */
  inRoom: boolean;
  /** Phase is playing/scheduled: adds the legacy `.active-game` hook the room CSS relies on. */
  active: boolean;
  /** Passport card finish, kept as the legacy `skin-*` class for the existing screen CSS. */
  skin: string;
  onNavigate: (id: NavTabId) => void;
  topbar: Omit<TopbarProps, 'inRoom' | 'active'>;
  /** Rendered under the main column when no room is open. */
  footer?: ReactNode;
  /** Rendered inside the effects provider, before the shell chrome. Use for effect-driving
   *  components that must see the real FX context (toasts, ceremonies with 3D slots). */
  effects?: ReactNode;
  children: ReactNode;
};

/* Layout grid: topbar / (nav | main / footer). The legacy generation classes (site-shell,
 * arcade-shell, rivalry-shell, journey-shell, skin-*) stay on the root so the per-screen CSS
 * keeps matching until each screen is restyled. */
export function AppShell({
  tab,
  inRoom,
  active,
  skin,
  onNavigate,
  topbar,
  footer,
  effects,
  children,
}: AppShellProps) {
  const { t } = useLocale();
  const className = [
    'fd-shell',
    'site-shell',
    'arcade-shell',
    'rivalry-shell',
    'journey-shell',
    `skin-${skin}`,
    active ? 'active-game' : '',
    inRoom ? 'fd-shell--room' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={className}>
      {/* FX_PROVIDER_SLOT — the global effects provider (particle canvas, toasts, ceremonies)
          wraps the whole shell; it renders nothing of its own on the server. */}
      <FxProvider>
        {effects}
        <a className="skip-link" href="#main-content">
          {t('nav.skip')}
        </a>
        <Topbar {...topbar} inRoom={inRoom} active={active} />
        <div className="fd-frame">
          {!inRoom && <Nav tab={tab} onNavigate={onNavigate} />}
          <main id="main-content" className="fd-main">
            {children}
          </main>
          {!inRoom && footer}
        </div>
      </FxProvider>
    </div>
  );
}
