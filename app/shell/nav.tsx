'use client';
import { House, Compass, UsersRound, UserRound, Vault, type LucideIcon } from 'lucide-react';
import { JhkMark } from './brand-mark';
import { useLocale } from '../use-locale';

export type NavTabId = 'home' | 'teams' | 'journeys' | 'arena' | 'passport' | 'journal';

/** Familiar route IDs preserve saved state; task labels describe each group. */
export const NAV_TABS: { id: NavTabId; label: string; hindi: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Play', hindi: 'खेलें', icon: House },
  { id: 'teams', label: 'Teams', hindi: 'टीमें', icon: UsersRound },
  { id: 'journeys', label: 'Explore', hindi: 'खोजें', icon: Compass },
  { id: 'passport', label: 'My club', hindi: 'मेरा क्लब', icon: UserRound },
  { id: 'journal', label: 'Answers', hindi: 'जवाब', icon: Vault },
];

export function navParent(tab: string): NavTabId {
  if (['online', 'practice', 'arena'].includes(tab)) return 'home';
  if (tab === 'teams') return 'teams';
  if (['journeys', 'collections', 'discovery', 'events'].includes(tab)) return 'journeys';
  if (['passport', 'analytics', 'showroom'].includes(tab)) return 'passport';
  if (tab === 'journal') return 'journal';
  return 'home';
}

export type NavProps = {
  tab: string;
  onNavigate: (id: NavTabId) => void;
};

/* Bottom tab bar ≤ 899px, left icon rail ≥ 900px (labels inline ≥ 1200px). During a room the
 * shell does not render this component at all. */
export function Nav({ tab, onNavigate }: NavProps) {
  const { t, locale } = useLocale();
  const current = navParent(tab);
  return (
    <nav className="fd-nav" aria-label={t('nav.label')}>
      {/* Decorative: the mark heads the desktop rail (shell.css hides it in the bottom tab bar). The
          topbar brand link is the one that goes home. */}
      <span className="fd-nav-mark">
        <JhkMark size={24} />
      </span>
      {NAV_TABS.map(({ id, label, hindi, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="fd-nav-btn"
          data-nav={id}
          aria-current={current === id ? 'page' : undefined}
          onClick={() => onNavigate(id)}
        >
          <span className="fd-nav-icon">
            <Icon aria-hidden="true" />
          </span>
          <span className="fd-nav-label">{locale === 'hi' ? hindi : label}</span>
        </button>
      ))}
    </nav>
  );
}
