'use client';
import type { ReactNode } from 'react';
import { Zap, Lock, Volume2, VolumeX, Settings } from 'lucide-react';

export type TopbarProps = {
  /** A room is open (any phase): brand click leaves/backs instead of going home. */
  inRoom: boolean;
  /** Phase is playing/scheduled: settings are locked so nothing interrupts the timed surface. */
  active: boolean;
  sound: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onBrand: () => void;
  /** Right-hand slots. The player screen agent fills these with streak / gems / level nodes. */
  streak?: ReactNode;
  gems?: ReactNode;
  level?: ReactNode;
};

export function Topbar({
  inRoom,
  active,
  sound,
  onToggleSound,
  onOpenSettings,
  onBrand,
  streak,
  gems,
  level,
}: TopbarProps) {
  return (
    <header className="fd-topbar">
      <a
        href="/"
        className="fd-brand"
        aria-label="Fact Duel home"
        onClick={(e) => {
          e.preventDefault();
          onBrand();
        }}
      >
        <Zap aria-hidden="true" />
        <span>
          FACT<em>{'//'}</em>DUEL
        </span>
      </a>
      <div className="fd-topbar-right">
        {(streak || gems || level) && (
          <div className="fd-topbar-slots">
            {streak}
            {gems}
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
