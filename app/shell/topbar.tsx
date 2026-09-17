'use client';
import type { ReactNode } from 'react';
import { Lock, Volume2, VolumeX, Settings } from 'lucide-react';
import { JhkMark, JhkWordmark } from './brand-mark';
import { useLocale } from '../use-locale';

export type TopbarProps = {
  /** A room is open (any phase): brand click leaves/backs instead of going home. */
  inRoom: boolean;
  /** Phase is playing/scheduled: settings are locked so nothing interrupts the timed surface. */
  active: boolean;
  sound: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onBrand: () => void;
  /** Right-hand slots. The player screen agent fills these with streak / level nodes. */
  streak?: ReactNode;
  level?: ReactNode;
  /** The coin count (app/screens/economy/wallet-chip.tsx): the one place the balance is shown. */
  wallet?: ReactNode;
};

export function Topbar({
  inRoom,
  active,
  sound,
  onToggleSound,
  onOpenSettings,
  onBrand,
  streak,
  level,
  wallet,
}: TopbarProps) {
  const { t, locale } = useLocale();
  return (
    <header className="fd-topbar">
      <a
        href="/"
        className="fd-brand"
        aria-label={t('top.brandHome')}
        onClick={(e) => {
          e.preventDefault();
          onBrand();
        }}
      >
        <JhkMark size={32} tile className="fd-brand-mark" />
        {/* The wordmark is decorative here: the link's own label already names the product. At
            359px and below (app/shell/shell.css) the CSS hides it and the tile alone carries the
            brand; every width from 360px up — the 375px iPhones included — keeps it. Under the
            Hindi locale the Devanagari wordmark takes its place (docs/brand.md §5). */}
        <JhkWordmark height={16} title="" variant={locale === 'hi' ? 'hi' : 'full'} className="fd-brand-word" />
      </a>
      <div className="fd-topbar-right">
        {(streak || level || wallet) && (
          <div className="fd-topbar-slots">
            {streak}
            {wallet}
            {level}
          </div>
        )}
        {!active && (
          <span className="fd-private">
            <Lock size={13} aria-hidden="true" />
            {t('top.private')}
          </span>
        )}
        <button
          type="button"
          className="fd-iconbtn"
          onClick={onToggleSound}
          aria-label={sound ? t('top.mute') : t('top.unmute')}
          aria-pressed={sound}
        >
          {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="fd-iconbtn"
          onClick={onOpenSettings}
          aria-label={t('top.settings')}
          disabled={active}
          data-in-room={inRoom || undefined}
        >
          <Settings aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
