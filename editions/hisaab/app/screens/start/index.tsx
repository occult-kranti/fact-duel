/**
 * screens/start/index.tsx — First run (design bible §11.1). No account; a name is never asked for here
 * (it is optional, and only needed later for a certificate or a room).
 *
 * Phone: a full-height poster — kicker F.No. 00/IN/<year>, हिसाब दो / SHOW US THE ACCOUNTS, the motto,
 * three typed lines with real counts, the EN/हिं toggle — then the action card: ONE violet primary
 * (Open today's file) and three text links (a state, the money trail, a duel code). Footer: "No account.
 * Stored on this device. Rules & sources". Desktop: the poster on a halftone patch with static TIJORI art
 * (7 cols) | the action card (5 cols).
 *
 * After the first receipt the action card carries the inline label card ("You start as ANDHBHAKT…"),
 * never a ceremony. Silent: no sound until the first tap, no toasts, no WebGL (the tijori art is 2D).
 */
import { useEffect, useMemo } from 'react';
import { Coins, Grid3x3, KeyRound } from 'lucide-react';
import { STATE_CODES, SECTOR_LIST } from '../../data';
import { todaysFive } from '../../../edition';
import { href, type ScreenProps } from '../../router';
import { useAppPlayer } from '../../shell/player';
import { TijoriArt, tijoriLabel } from '../../three';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { Page } from '../../ui/page';
import { Poster } from '../../ui/poster';
import { dailyStatus, receiptStats } from '../home/home-data';
import { usePressCue } from '../home/press-cue';
import { isFreshProfile, markStartShown } from './first-run';
import { LabelCard } from './label-card';
import './start.css';

export default function StartScreen(_props: ScreenProps) {
  const player = useAppPlayer();
  const { t, isHi, locale, setLocale } = useLang();
  const onPointerDown = usePressCue();
  useEffect(() => markStartShown(), []);

  const profile = player.profile;
  const started = player.loaded && !isFreshProfile(profile);
  const receipts = useMemo(() => receiptStats(profile.journal).count, [profile.journal]);
  const daily = useMemo(() => todaysFive(), []);
  const today = useMemo(() => dailyStatus(profile.journal, daily.day, daily.cards.length), [profile.journal, daily]);
  const xp = player.progression?.xp ?? 0;
  const year = new Date().getFullYear();

  const primary = !today.done
    ? { to: href.aaj(), label: today.answered > 0 ? t("Continue today's file", 'आज की फ़ाइल जारी रखो') : t("Open today's file", 'आज की फ़ाइल खोलो') }
    : { to: href.home(), label: t('Go to your desk', 'अपनी डेस्क पर चलो') };

  const lines = [
    t('Every answer comes with a receipt.', 'हर जवाब के साथ रसीद।'),
    t(
      `${STATE_CODES.length} states, ${SECTOR_LIST.length} sectors, one daily file.`,
      `${STATE_CODES.length} राज्य, ${SECTOR_LIST.length} सेक्टर, रोज़ एक फ़ाइल।`,
    ),
    t('Satire on labels. Facts from sources.', 'व्यंग्य लेबलों पर। तथ्य स्रोतों से।'),
  ];

  return (
    <Page screen="start" className="h-start">
      <div className="h-start__root" onPointerDown={onPointerDown}>
        <section className="h-start__poster" aria-label={t('Hisaab Do — show us the accounts', 'हिसाब दो')}>
          <div className="h-start__head">
            <p className="h-kicker h-start__fno">F.No. 00/IN/{year}</p>
            <div className="h-start__lang" role="group" aria-label={t('Language', 'भाषा')}>
              <button type="button" className="h-start__langbtn" aria-pressed={locale === 'en'} onClick={() => setLocale('en')} lang="en">
                EN
              </button>
              <button type="button" className="h-start__langbtn" aria-pressed={locale === 'hi'} onClick={() => setLocale('hi')} lang="hi">
                हिं
              </button>
            </div>
          </div>
          <div className="h-start__patch">
            <Poster as="h1" hi="हिसाब दो" en="Show us the accounts" swipe="accounts" className="h-start__title" />
          </div>
          <p className="h-start__motto">
            Janta ka paisa. Janta ka sawaal.
            <span className="h-start__gloss">{t("The people's money. The people's question.", 'जनता का पैसा। जनता का सवाल।')}</span>
          </p>
          <ul className={cx('h-start__typed', isHi && 'h-start__typed--hi')}>
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="h-start__art" role="img" aria-label={tijoriLabel(receipts)}>
            <TijoriArt count={receipts} />
          </div>
        </section>

        <section className="h-start__action" aria-labelledby="h-start-action">
          {started ? (
            <LabelCard xp={xp} intro headingId="h-start-action" className="h-start__label" />
          ) : (
            <div className="h-start__pitch">
              <h2 className="h-start__h2" id="h-start-action">
                Account? Zaroorat nahi. Seedha sawaal.
              </h2>
              <p className="h-start__sub">
                {t(
                  "Today's file: 5 questions, the same for everyone. No sign-up, no name needed.",
                  'आज की फ़ाइल: 5 सवाल, सबके लिए एक जैसे। न साइन-अप, न नाम।',
                )}
              </p>
            </div>
          )}
          <Button variant="primary" block href={primary.to}>
            {primary.label}
          </Button>
          <ul className="h-start__links">
            <li>
              <a className="h-start__link" href={href.files('states')}>
                <Grid3x3 aria-hidden="true" size={20} strokeWidth={2.2} />
                <span>{t('Pick a state instead', 'कोई राज्य चुनो')}</span>
              </a>
            </li>
            <li>
              <a className="h-start__link" href={href.money()}>
                <Coins aria-hidden="true" size={20} strokeWidth={2.2} />
                <span>{t('Follow the money, 2000–2026', 'पैसे का हिसाब, 2000–2026')}</span>
              </a>
            </li>
            <li>
              <a className="h-start__link" href={href.friend()}>
                <KeyRound aria-hidden="true" size={20} strokeWidth={2.2} />
                <span>{t('Have a duel code?', 'मुक़ाबले का कोड है?')}</span>
              </a>
            </li>
          </ul>
        </section>

        <footer className="h-start__foot">
          <p>
            {t('No account. Stored on this device.', 'कोई अकाउंट नहीं। सब इसी डिवाइस पर।')}{' '}
            <a className="h-link h-link--tap" href={href.rules()}>
              {t('Rules & sources', 'नियम और स्रोत')}
            </a>
          </p>
        </footer>
      </div>
    </Page>
  );
}
