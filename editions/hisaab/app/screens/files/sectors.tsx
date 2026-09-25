/**
 * screens/files/sectors.tsx — Sector Files (bible §11.4): 13 manila files in a cabinet, one per sector
 * (Media & Speech is Kiska Media?'s press file). Phone: the files stack and a tap expands the brief
 * inline under that file — the next unfinished one starts expanded. ≥ 900px: a cabinet grid with a
 * sticky side brief. The brief holds the ONE primary action, Open file (→ #/route/:id).
 */
import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Banknote,
  Briefcase,
  Building2,
  Coins,
  Construction,
  GraduationCap,
  HeartPulse,
  Mountain,
  Newspaper,
  Shield,
  Tractor,
  Vote,
  Zap,
} from 'lucide-react';
import { useJuice } from '@/components/fx';
import { routesOfKind, type Route } from '../../../edition';
import { SECTOR_LIST, SECTOR_NAMES_HI, stateName, BANK_ITEMS } from '../../data';
import { href, Link, navigate, type AppRoute } from '../../router';
import { useScreenTitle } from '../../shell/chrome';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { Meter } from '../../ui/meter';
import { Page, ScreenHeader } from '../../ui/page';
import { Skeleton } from '../../ui/skeleton';
import { Stamp } from '../../ui/stamp';
import { Tape } from '../../ui/tape';
import { bestText, CARDS, fileNo, fileStatus, nextUnfinished, openWords, revealIfHidden, routeItems, statusWords, useMedia, usePlayerFiles, type FileStatus } from './lib';
import { FilesTabs } from './tabs';
import '../../ui/file-card.css';
import './sectors.css';

const MEDIA = 'Media & Speech';

const ICONS: Readonly<Record<string, ReactNode>> = {
  'Welfare & Subsidies': <Coins size={24} strokeWidth={2.2} />,
  'Farm & Food': <Tractor size={24} strokeWidth={2.2} />,
  Health: <HeartPulse size={24} strokeWidth={2.2} />,
  'Education & Exams': <GraduationCap size={24} strokeWidth={2.2} />,
  Infrastructure: <Construction size={24} strokeWidth={2.2} />,
  'Banking & Finance': <Banknote size={24} strokeWidth={2.2} />,
  'Energy & Mining': <Zap size={24} strokeWidth={2.2} />,
  'Defence & Security': <Shield size={24} strokeWidth={2.2} />,
  'Elections & Funding': <Vote size={24} strokeWidth={2.2} />,
  'Media & Speech': <Newspaper size={24} strokeWidth={2.2} />,
  'Governance & Institutions': <Building2 size={24} strokeWidth={2.2} />,
  'Jobs & Economy': <Briefcase size={24} strokeWidth={2.2} />,
  'Environment & Land': <Mountain size={24} strokeWidth={2.2} />,
};

/** One deadpan Hinglish line per sector (Latin script). Questions, never accusations. */
const QUIPS: Readonly<Record<string, string>> = {
  'Welfare & Subsidies': 'Kisko mila, kitna mila.',
  'Farm & Food': 'Khet se thali tak, hisaab kiska.',
  Health: 'Ilaaj ka bill, bhara kisne.',
  'Education & Exams': 'Paper se result tak, file kahan.',
  Infrastructure: 'Pul, sadak, aur unka bill.',
  'Banking & Finance': 'Loan liya kisne, chukaya kisne.',
  'Energy & Mining': 'Koyla, bijli, aur allocation.',
  'Defence & Security': 'Sauda kiska, file kahan.',
  'Elections & Funding': 'Chanda aaya kahan se.',
  'Media & Speech': 'Channel kiska, paisa kiska.',
  'Governance & Institutions': 'File kisne roki, kisne chalayi.',
  'Jobs & Economy': 'Naukri ke aankde, kiske paas.',
  'Environment & Land': 'Zameen kiski, jungle kiska.',
};

const slugOf = (sector: string) =>
  sector
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

type Folder = { sector: string; slug: string; route: Route | null; status: FileStatus; pool: number };

export function SectorsView({ route }: { route: AppRoute }) {
  const { t } = useLang();
  useScreenTitle('Sector Files');
  const juice = useJuice();
  const { journeys, loaded } = usePlayerFiles();
  const wide = useMedia('(min-width: 900px)');
  const sideRef = useRef<HTMLElement>(null);

  const folders = useMemo<Folder[]>(() => {
    const bySector = new Map(routesOfKind('sector').map((r) => [r.sector ?? r.topic, r]));
    const kiska = routesOfKind('media')[0] ?? null;
    return SECTOR_LIST.map((sector) => {
      const r = sector === MEDIA ? kiska : (bySector.get(sector) ?? null);
      return {
        sector,
        slug: slugOf(sector),
        route: r,
        status: fileStatus(r, journeys),
        pool: BANK_ITEMS.filter((q) => q.topic === sector).length,
      };
    });
  }, [journeys]);

  const fallback = useMemo(() => {
    const next = nextUnfinished(
      folders.flatMap((f) => (f.route ? [f.route] : [])),
      journeys,
    );
    return folders.find((f) => f.route && f.route === next)?.slug ?? folders[0]?.slug;
  }, [folders, journeys]);
  const [closed, setClosed] = useState(false);
  const asked = route.query.f;
  const selected = folders.find((f) => f.slug === asked)?.slug ?? fallback;
  const current = folders.find((f) => f.slug === selected) ?? null;
  const cleared = folders.filter((f) => f.status.state === 'cleared').length;

  const choose = (slug: string) => {
    juice.sound('tap');
    juice.haptic('light');
    if (!wide && slug === selected && !closed) {
      setClosed(true);
      return;
    }
    setClosed(false);
    navigate(href.files('sectors', { f: slug }), { replace: true });
    if (wide) return;
    requestAnimationFrame(() => revealIfHidden(document.getElementById(`h-sect-${slug}`)));
  };

  return (
    <Page screen="files-sectors" className="h-sect">
      <FilesTabs current="sectors" />
      <ScreenHeader
        kicker={`F.No. X/ALL · ${folders.length} ${t('files', 'फ़ाइलें')}`}
        titleHi="सेक्टर फ़ाइलें"
        title="Sector Files"
        lead={t('One file per sector, from the Centre and the states. Six cards each.', 'हर सेक्टर की एक फ़ाइल — केंद्र और राज्यों से। हर फ़ाइल में छह कार्ड।')}
      />
      <p className="h-sect__tally">
        {cleared ? (
          <>
            <span className="h-mono">
              {cleared}/{folders.length}
            </span>{' '}
            {t('files cleared', 'फ़ाइलें क्लियर')}
          </>
        ) : (
          'Koi file clear nahi. Abhi tak.'
        )}
      </p>

      <div className="h-sect__layout">
        <ul className="h-sect__cabinet" aria-label={t('Sector files', 'सेक्टर फ़ाइलें')}>
          {folders.map((f) => {
            const isSel = f.slug === selected;
            const expanded = !wide && isSel && !closed;
            return (
              <li key={f.slug} className={cx('h-sect__slot', expanded && 'h-sect__slot--open')} id={`h-sect-${f.slug}`}>
                {f.route ? (
                  <FolderButton folder={f} selected={isSel} expanded={expanded} wide={wide} onChoose={() => choose(f.slug)} />
                ) : (
                  <div className="h-typing">
                    <span className="h-typing__k">F.No. X/{f.slug.toUpperCase().slice(0, 8)}</span>
                    <span className="h-typing__t">{f.sector}</span>
                    <span>
                      {t(
                        `Being typed · ${f.pool} ${f.pool === 1 ? 'card' : 'cards'} so far. A file opens at ${CARDS}.`,
                        `टाइप हो रही है · अभी ${f.pool} कार्ड। ${CARDS} पर फ़ाइल खुलेगी।`,
                      )}
                    </span>
                  </div>
                )}
                {expanded && f.route ? <SectorBrief folder={f} loaded={loaded} inline /> : null}
              </li>
            );
          })}
        </ul>
        {wide ? (
          <aside className="h-sect__side" ref={sideRef}>
            {current?.route ? <SectorBrief folder={current} loaded={loaded} /> : null}
          </aside>
        ) : null}
      </div>
    </Page>
  );
}

function FolderButton({ folder, selected, expanded, wide, onChoose }: { folder: Folder; selected: boolean; expanded: boolean; wide: boolean; onChoose: () => void }) {
  const { t, isHi } = useLang();
  const { route: r, status, sector } = folder;
  if (!r) return null;
  const hi = SECTOR_NAMES_HI[sector];
  const isMedia = sector === MEDIA;
  return (
    <button
      type="button"
      className={cx('h-file', `h-file--${status.state === 'progress' ? 'open' : status.state}`, 'h-file--action', 'h-sect__file')}
      aria-expanded={wide ? undefined : expanded}
      aria-pressed={wide ? selected : undefined}
      aria-controls={wide ? 'h-sect-brief' : undefined}
      onClick={onChoose}
    >
      <span className="h-file__tab">{fileNo(r)}</span>
      <span className="h-file__head">
        <span className="h-file__icon" aria-hidden="true">
          {ICONS[sector]}
        </span>
        <span className="h-file__titles">
          {hi ? (
            <span className="h-file__titlehi" lang="hi">
              {hi}
            </span>
          ) : null}
          <span className="h-file__title">{isMedia ? (isHi ? 'किसका मीडिया?' : 'Kiska Media?') : sector}</span>
        </span>
        {status.state === 'cleared' ? <Stamp kind="noted" seed={r.id} text="CLEARED" size="s" className="h-file__stamp" /> : null}
      </span>
      <span className="h-file__meta">
        {isMedia ? `${t('Media & Speech', 'मीडिया और अभिव्यक्ति')} · ` : ''}
        {CARDS} {t('cards', 'कार्ड')} · {r.poolSize} {t('on file', 'फ़ाइल में')}
        {status.best ? ` · ${bestText(status.best)}` : ''}
      </span>
      {status.state === 'sealed' ? <span className="h-sr">Sealed. The tape is cut on the first card.</span> : null}
      {status.state === 'sealed' ? <Tape /> : null}
      {status.running ? (
        <Meter
          as="span"
          className="h-file__meter"
          value={status.done}
          max={CARDS}
          ticks={CARDS}
          label={t('Cards answered', 'जवाब दिए कार्ड')}
          valueText={`${status.done} of ${CARDS} answered`}
          copy={`${status.done} of ${CARDS} answered`}
        />
      ) : null}
    </button>
  );
}

function SectorBrief({ folder, loaded, inline }: { folder: Folder; loaded: boolean; inline?: boolean }) {
  const { t, isHi } = useLang();
  const headId = useId();
  const { route: r, status, sector } = folder;
  const items = useMemo(() => (r ? routeItems(r) : []), [r]);
  if (!r) return null;
  if (!loaded) return <Skeleton lines={4} label={t('Opening the file', 'फ़ाइल खुल रही है')} />;
  const places = [...new Set(items.map((q) => stateName(q.state)))];
  const isMedia = sector === MEDIA;
  return (
    <section
      id={inline ? undefined : 'h-sect-brief'}
      className={cx('h-sect__brief', inline && 'h-sect__brief--inline')}
      aria-labelledby={headId}
    >
      <p className="h-kicker">{t('File brief', 'फ़ाइल का ब्योरा')}</p>
      <h2 className="h-sect__brieftitle" id={headId}>
        {isHi && SECTOR_NAMES_HI[sector] ? <span lang="hi">{SECTOR_NAMES_HI[sector]}</span> : isMedia ? 'Kiska Media?' : sector}
      </h2>
      <p className="h-quip">
        {isMedia ? 'Kiska Media?' : sector}: {QUIPS[sector]}
      </p>
      <p className="h-sect__status">{statusWords(status, t)}</p>
      {status.running ? (
        <Meter value={status.done} max={CARDS} ticks={CARDS} label={t('Cards answered', 'जवाब दिए कार्ड')} valueText={`${status.done} of ${CARDS} answered`} />
      ) : null}
      <dl className="h-sect__facts">
        <div>
          <dt>{t('Cards', 'कार्ड')}</dt>
          <dd>
            {CARDS} {t('cards', 'कार्ड')} · {r.poolSize} {t('on file', 'फ़ाइल में')}
          </dd>
        </div>
        <div>
          <dt>{t('From', 'कहाँ से')}</dt>
          <dd>{places.join(' · ')}</dd>
        </div>
        <div>
          <dt>{t('Chapters', 'अध्याय')}</dt>
          <dd>{r.chapters.join(' → ')}</dd>
        </div>
        {status.best ? (
          <div>
            <dt>{t('Best', 'सर्वश्रेष्ठ')}</dt>
            <dd className="h-mono">{bestText(status.best).replace(/^Best /, '')}</dd>
          </div>
        ) : null}
      </dl>
      <Button variant="primary" block href={href.route(r.id)}>
        {isMedia && !status.running && status.state !== 'cleared' ? t('Open the press file', 'प्रेस फ़ाइल खोलो') : openWords(status, t)}
      </Button>
      {isMedia ? (
        <Link to={href.files('media')} className="h-link h-link--tap">
          {t('Who owns what: the Kiska Media? room', 'किसका मीडिया? — कौन किसका मालिक')}
        </Link>
      ) : null}
    </section>
  );
}
