'use client';
import { House, Compass, Swords, UserRound, Vault, type LucideIcon } from 'lucide-react';
import { JhkMark } from './brand-mark';
import { useLocale } from '../use-locale';

export type NavTabId = 'home' | 'journeys' | 'arena' | 'passport' | 'journal';

/** `label` is the English name; the rendered label comes from the locale dictionary (`nav.<id>`). */
export const NAV_TABS: { id: NavTabId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'journeys', label: 'Expeditions', icon: Compass },
  { id: 'arena', label: 'Play', icon: Swords },
  { id: 'passport', label: 'Player', icon: UserRound },
  { id: 'journal', label: 'Vault', icon: Vault },
];

export type NavProps = {
  tab: string;
  onNavigate: (id: NavTabId) => void;
};

/* Bottom tab bar ≤ 899px, left icon rail ≥ 900px (labels inline ≥ 1200px). During a room the
 * shell does not render this component at all. */
export function Nav({ tab, onNavigate }: NavProps) {
  const { t } = useLocale();
  return (
    <nav className="fd-nav" aria-label={t('nav.label')}>
      {/* Decorative: the mark heads the desktop rail (shell.css hides it in the bottom tab bar). The
          topbar brand link is the one that goes home. */}
      <span className="fd-nav-mark">
        <JhkMark size={24} />
      </span>
      {NAV_TABS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="fd-nav-btn"
          data-nav={id}
          aria-current={tab === id ? 'page' : undefined}
          onClick={() => onNavigate(id)}
        >
          <span className="fd-nav-icon">
            <Icon aria-hidden="true" />
          </span>
          <span className="fd-nav-label">{t(`nav.${id}`)}</span>
        </button>
      ))}
    </nav>
  );
}
