/**
 * screens/files/tabs.tsx — the Files tab's segmented control (bible §11.3): Rajya · Sector · Kiska
 * Media? · Forward Court, plus the money trail (charter §6), which also lives under the Files tab.
 * Links, not buttons: every section has its own URL. The current one carries aria-current="page".
 *
 * MoneyTabs is the second row inside the money trail: Seedha Khaate Mein · Rahat Kosh · Chunav Se
 * Pehle · Saal-dar-Saal.
 */
import type { ReactNode } from 'react';
import { CalendarRange, Gavel, IndianRupee, Layers, LayoutGrid, LifeBuoy, Newspaper, Vote, Wallet } from 'lucide-react';
import { useJuice } from '@/components/fx';
import { href, Link } from '../../router';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import './files.css';

export type FilesSection = 'states' | 'sectors' | 'media' | 'forwards' | 'money';

const SECTIONS: ReadonlyArray<{ id: FilesSection; to: string; short: string; long: string; hi: string; icon: ReactNode }> = [
  { id: 'states', to: href.files('states'), short: 'Rajya', long: 'Rajya Rounds', hi: 'राज्य', icon: <LayoutGrid size={20} strokeWidth={2.2} /> },
  { id: 'sectors', to: href.files('sectors'), short: 'Sector', long: 'Sector Files', hi: 'सेक्टर', icon: <Layers size={20} strokeWidth={2.2} /> },
  { id: 'media', to: href.files('media'), short: 'Media', long: 'Kiska Media?', hi: 'मीडिया', icon: <Newspaper size={20} strokeWidth={2.2} /> },
  { id: 'forwards', to: href.files('forwards'), short: 'Forwards', long: 'Forward Court', hi: 'फ़ॉरवर्ड', icon: <Gavel size={20} strokeWidth={2.2} /> },
  { id: 'money', to: href.money(), short: 'Paisa', long: 'Money trail', hi: 'पैसा', icon: <IndianRupee size={20} strokeWidth={2.2} /> },
];

/** A press on a tab: the bible's `tap` cue + a light haptic (silent until the first tap anyway). */
function usePressCue() {
  const juice = useJuice();
  return () => {
    juice.sound('tap');
    juice.haptic('light');
  };
}

export function FilesTabs({ current }: { current: FilesSection }) {
  const { t, isHi } = useLang();
  const cue = usePressCue();
  return (
    <nav className="h-ftabs" aria-label={t('File sections', 'फ़ाइलों के खंड')}>
      <ul className="h-ftabs__list">
        {SECTIONS.map((s) => (
          <li key={s.id} className="h-ftabs__item">
            <Link to={s.to} className="h-ftabs__link" aria-current={s.id === current ? 'page' : undefined} onClick={cue}>
              <span className="h-ftabs__icon" aria-hidden="true">
                {s.icon}
              </span>
              {isHi ? (
                <span className="h-ftabs__label" lang="hi">
                  {s.hi}
                </span>
              ) : (
                <>
                  <span className="h-ftabs__label h-ftabs__label--short">{s.short}</span>
                  <span className="h-ftabs__label h-ftabs__label--long">{s.long}</span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type MoneySection = 'distribution' | 'relief' | 'pre-election' | 'years';

const MONEY_SECTIONS: ReadonlyArray<{ id: MoneySection; en: string; hi: string; icon: ReactNode }> = [
  { id: 'distribution', en: 'Seedha Khaate Mein', hi: 'सीधे खाते में', icon: <Wallet size={18} strokeWidth={2.2} /> },
  { id: 'relief', en: 'Rahat Kosh', hi: 'राहत कोष', icon: <LifeBuoy size={18} strokeWidth={2.2} /> },
  { id: 'pre-election', en: 'Chunav Se Pehle', hi: 'चुनाव से पहले', icon: <Vote size={18} strokeWidth={2.2} /> },
  { id: 'years', en: 'Saal-dar-Saal', hi: 'साल-दर-साल', icon: <CalendarRange size={18} strokeWidth={2.2} /> },
];

export function MoneyTabs({ current }: { current: MoneySection | null }) {
  const { t, isHi } = useLang();
  const cue = usePressCue();
  return (
    <nav className="h-mtabs" aria-label={t('Money-trail modes', 'पैसे के हिसाब के मोड')}>
      <ul className="h-mtabs__list">
        {MONEY_SECTIONS.map((s) => (
          <li key={s.id}>
            <Link
              to={href.money(s.id)}
              className={cx('h-mtabs__link')}
              aria-current={s.id === current ? 'page' : undefined}
              onClick={cue}
            >
              <span className="h-mtabs__icon" aria-hidden="true">
                {s.icon}
              </span>
              <span className="h-mtabs__label" lang={isHi ? 'hi' : undefined}>
                {isHi ? s.hi : s.en}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
