'use client';
import type { ReactNode } from 'react';
import { Lock, Volume2, VolumeX, Settings } from 'lucide-react';
import { JhkMark, JhkWordmark } from './brand-mark';

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
  return (
    <header className="fd-topbar">
      <a
        href="/"
        className="fd-brand"
        aria-label="Jaanta Hai Kya home"
        onClick={(e) => {
          e.preventDefault();
          onBrand();
        }}
      >
        <JhkMark size={32} tile className="fd-brand-mark" />
        {/* The wordmark is decorative here: the link's own label already names the product. Under
            360px the CSS hides it and the tile alone carries the brand. */}
        <JhkWordmark height={16} title="" className="fd-brand-word" />
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
            Private playtest
          </span>
        )}
        <button
          type="button"
          className="fd-iconbtn"
          onClick={onToggleSound}
          aria-label={sound ? 'Mute sounds' : 'Enable sounds'}
          aria-pressed={sound}
        >
          {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="fd-iconbtn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          disabled={active}
          data-in-room={inRoom || undefined}
        >
          <Settings aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
