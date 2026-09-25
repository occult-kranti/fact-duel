/**
 * screens/home/file-entries.tsx — Home's entry points into the files (design bible §11.2 "four small
 * files", charter §6 game modes): the records room (Rajya Rounds, Sector Files, Kiska Media?, Forward
 * Court) and the money trail, 2000–2026 (Seedha Khaate Mein, Rahat Kosh, Chunav Se Pehle,
 * Saal-dar-Saal). Small manila covers, each a whole-card link; counts are the real route counts
 * (a mode whose lanes are not registered yet says so, never a padded number).
 */
import type { ReactNode } from 'react';
import { Banknote, CalendarRange, Gavel, Grid3x3, Layers, LifeBuoy, Newspaper, Vote } from 'lucide-react';
import { formatNumber } from '../../data';
import { href } from '../../router';
import { useLang } from '../../ui/lang';
import { moneyEntries, recordsEntries, type Entry, type JourneysLike } from './home-data';

const ICONS: Readonly<Record<string, ReactNode>> = {
  rajya: <Grid3x3 size={20} strokeWidth={2.2} />,
  sector: <Layers size={20} strokeWidth={2.2} />,
  media: <Newspaper size={20} strokeWidth={2.2} />,
  forward: <Gavel size={20} strokeWidth={2.2} />,
  distribution: <Banknote size={20} strokeWidth={2.2} />,
  relief: <LifeBuoy size={20} strokeWidth={2.2} />,
  'pre-election': <Vote size={20} strokeWidth={2.2} />,
  years: <CalendarRange size={20} strokeWidth={2.2} />,
};

function MiniFile({ entry }: { entry: Entry }) {
  const { t } = useLang();
  const files =
    entry.files === 0
      ? t('No files yet', 'अभी कोई फ़ाइल नहीं')
      : entry.files === 1
        ? t('1 file · 6 cards', '1 फ़ाइल · 6 कार्ड')
        : t(`${formatNumber(entry.files)} files`, `${formatNumber(entry.files)} फ़ाइलें`);
  const cleared =
    entry.cleared > 0
      ? t(` · ${formatNumber(entry.cleared)} cleared`, ` · ${formatNumber(entry.cleared)} पूरी`)
      : '';
  return (
    <li className="h-mini">
      <a className="h-mini__link" href={entry.to}>
        <span className="h-mini__tab">{entry.fno}</span>
        <span className="h-mini__head">
          <span className="h-mini__icon" aria-hidden="true">
            {ICONS[entry.id]}
          </span>
          <span className="h-mini__hi" lang="hi">
            {entry.titleHi}
          </span>
        </span>
        <span className="h-mini__title">{entry.title}</span>
        <span className="h-mini__gloss">{entry.gloss}</span>
        <span className="h-mini__meta">
          {files}
          {cleared}
          {entry.span ? ` · ${entry.span}` : ''}
        </span>
      </a>
    </li>
  );
}

export function FileEntries({ journeys }: { journeys: JourneysLike }) {
  const { t } = useLang();
  const records = recordsEntries(journeys);
  const money = moneyEntries(journeys);
  return (
    <div className="h-home__filegroups">
      <h2 className="h-sr" id="h-home-files">
        {t('Files', 'फ़ाइलें')}
      </h2>
      <div className="h-home__group">
        <div className="h-home__grouphead">
          <h3 className="h-home__h3">
            <span lang="hi" className="h-home__h3hi">
              रिकॉर्ड रूम
            </span>{' '}
            <span className="h-home__h3en">Records room</span>
          </h3>
          <a className="h-link h-link--tap h-home__grouplink" href={href.files()}>
            {t('All files', 'सारी फ़ाइलें')}
          </a>
        </div>
        <ul className="h-mini-grid" role="list">
          {records.map((e) => (
            <MiniFile key={e.id} entry={e} />
          ))}
        </ul>
      </div>
      <div className="h-home__group">
        <div className="h-home__grouphead">
          <h3 className="h-home__h3">
            <span lang="hi" className="h-home__h3hi">
              पैसा कहाँ गया?
            </span>{' '}
            <span className="h-home__h3en">The money trail · 2000–2026</span>
          </h3>
          <a className="h-link h-link--tap h-home__grouplink" href={href.money()}>
            {t('Open the trail', 'पूरा हिसाब')}
          </a>
        </div>
        <p className="h-meta h-home__groupline">
          {t(
            'Who passed it, which party, what happened next.',
            'किसने पास किया, कौन-सी पार्टी, फिर क्या हुआ।',
          )}
        </p>
        <ul className="h-mini-grid" role="list">
          {money.map((e) => (
            <MiniFile key={e.id} entry={e} />
          ))}
        </ul>
      </div>
    </div>
  );
}
