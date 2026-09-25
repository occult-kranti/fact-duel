/**
 * shell/top-bar.tsx — `h-top` (bible §5): 56px + safe-area top. Wordmark हिसाब दो (home), the level
 * chip (→ profile), mute, settings. Replaced by the round header in a live room (chrome 'none').
 */
import { useSyncExternalStore } from 'react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { getPrefs, setPref, subscribePrefs } from '@/lib/fx/prefs';
import { standing } from '../../edition';
import { labelDisplay } from '../data';
import { href } from '../router';
import { IconButton } from '../ui/button';
import { useLang } from '../ui/lang';
import { useAppPlayer } from './player';

/** `inert` while a ceremony covers the page (the shell passes it). */
export function TopBar({ inert }: { inert?: boolean }) {
  const { t, isHi } = useLang();
  const player = useAppPlayer();
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, getPrefs);
  const s = standing(player.progression?.xp ?? 0);
  const label = labelDisplay(s.band);
  const muted = !prefs.sound;
  return (
    <header className="h-top" inert={inert || undefined}>
      <a className="h-wordmark" href={href.home()} aria-label={t('Hisaab Do — home', 'हिसाब दो — होम')}>
        <span lang="hi" aria-hidden="true">
          हिसाब दो
        </span>
      </a>
      <span className="h-top__spacer" />
      <a
        className="h-levelchip"
        href={href.me()}
        aria-label={`${t('Level', 'लेवल')} ${s.level}, ${label.en}. ${t('Your profile', 'आपकी प्रोफ़ाइल')}`}
      >
        <span className="h-levelchip__lv" aria-hidden="true">
          LV {player.loaded ? s.level : '–'}
        </span>
        <span className="h-levelchip__label" aria-hidden="true" lang={isHi ? 'hi' : undefined}>
          {isHi ? label.hi : label.en}
        </span>
      </a>
      <IconButton
        label={t('Mute sound', 'आवाज़ बंद')}
        pressed={muted}
        icon={muted ? <VolumeX size={22} strokeWidth={2.2} /> : <Volume2 size={22} strokeWidth={2.2} />}
        onClick={() => setPref('sound', muted)}
      />
      <IconButton label={t('Settings', 'सेटिंग्स')} icon={<Settings size={22} strokeWidth={2.2} />} href={href.settings()} />
    </header>
  );
}
