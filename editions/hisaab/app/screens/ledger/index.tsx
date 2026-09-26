/**
 * screens/ledger/index.tsx — "Paisa Kahan Gaya?", the money ledger (#/money/ledger): every measure in
 * editions/hisaab/data/money-ledger.json (389 rows, 2000–2026) on one timeline. Charter §4a, §4b.
 *
 *   #/money/ledger?mode=pre-election&level=state&s=UP&p=BJP&era=2020-2026&q=ladli&v=table&sort=old
 *
 * Top to bottom: the header; "Take the ledger" (the screen's ONE primary: the CSV; the XLSX beside it);
 * the one filter row (mode · level · state · party · era · search) that scopes everything below it; an
 * honest count ("23 of 389 measures"); the compact chart (measures per year, a small multiple per mode);
 * the view switch — Timeline (default) · Table (the accessible twin) · Before the vote (gap in days vs
 * the official result, with the timing-not-cause caveat) — then "How to read the ledger".
 *
 * Quiet screen (bible §9): no toast, no ceremony, no sound. Party is text, never a colour (charter §2.9);
 * every row links its source and plays its bank items as cards (#/q/:id).
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CalendarArrowDown, CalendarArrowUp, Download, FileSpreadsheet, LayoutList, Table2, Vote } from 'lucide-react';
import LEDGER_JSON from '../../../data/money-ledger.json';
import { EDITION } from '../../../edition';
import { formatNumber, itemById, monthLabel } from '../../data';
import { href, Link, navigate, type ScreenProps } from '../../router';
import { useScreenTitle } from '../../shell/chrome';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { NotingSheet } from '../../ui/noting-sheet';
import { EmptyState, InlineNote, Page, ScreenHeader } from '../../ui/page';
import { FilesTabs } from '../files/tabs';
import { YearChart } from './chart';
import { LedgerFilters } from './filters';
import {
  activeFilters,
  facetCounts,
  filterRows,
  filtersQuery,
  launchYear,
  LEDGER_MODES,
  NO_FILTERS,
  parseFilters,
  relaxHint,
  sortRows,
  yearsFor,
  type FilterKey,
  type LedgerFilters as Filters,
  type LedgerRow,
  type SortOrder,
} from './lib';
import { LedgerTable, Timeline } from './rows';
import { VoteView } from './vote';
import './ledger.css';

const ROWS = LEDGER_JSON as unknown as readonly LedgerRow[];
const PAGE = 30;

/** The latest as-of month of the bank items behind the rows ('2026-09'). */
const AS_OF = (() => {
  let latest = '';
  for (const r of ROWS)
    for (const id of r.itemIds) {
      const a = itemById(id)?.asOf;
      if (a && a > latest) latest = a;
    }
  return latest;
})();

const DOWNLOADS = {
  csv: `${EDITION.base}downloads/hisaab-money-ledger.csv`,
  xlsx: `${EDITION.base}downloads/hisaab-money-ledger.xlsx`,
};

type View = 'timeline' | 'table' | 'vote';
const VIEWS: readonly View[] = ['timeline', 'table', 'vote'];

/** The ledger's URL for a set of filters, a view and an order (defaults left out). */
const ledgerHref = (f: Filters, v: View, sort: SortOrder) =>
  href.ledger({ ...filtersQuery(f), ...(v !== 'timeline' ? { v } : {}), ...(sort !== 'new' ? { sort } : {}) });

const FILTER_WORDS: Readonly<Record<FilterKey, { en: string; hi: string }>> = {
  mode: { en: 'mode', hi: 'मोड' },
  level: { en: 'level', hi: 'स्तर' },
  state: { en: 'state', hi: 'राज्य' },
  party: { en: 'party', hi: 'दल' },
  era: { en: 'years', hi: 'साल' },
  q: { en: 'search', hi: 'खोज' },
};

export default function LedgerScreen({ route }: ScreenProps) {
  const { t } = useLang();
  useScreenTitle('Paisa Kahan Gaya?');
  const { filters, ignored } = useMemo(() => parseFilters(route.query, ROWS), [route.query]);
  const view: View = VIEWS.find((v) => v === route.query.v) ?? 'timeline';
  const order: SortOrder = route.query.sort === 'old' ? 'old' : 'new';
  const rows = useMemo(() => sortRows(filterRows(ROWS, filters), order), [filters, order]);
  const facets = useMemo(() => facetCounts(ROWS, filters), [filters]);
  const years = useMemo(() => yearsFor(filters), [filters]);
  const modes = filters.mode ? [filters.mode] : LEDGER_MODES;
  const yearTotals = useMemo(() => {
    const m = new Map<number, number>();
    for (const r of rows) m.set(launchYear(r), (m.get(launchYear(r)) ?? 0) + 1);
    return m;
  }, [rows]);
  const polled = useMemo(() => rows.filter((r) => r.poll).length, [rows]);
  const filterKey = JSON.stringify(filtersQuery(filters));
  const pageKey = `${filterKey}|${order}|${view}`;
  const [page, setPage] = useState({ key: pageKey, n: PAGE });
  const shown = page.key === pageKey ? page.n : PAGE;

  const go = useCallback(
    (next: Filters, extra: { sort?: SortOrder } = {}) => navigate(ledgerHref(next, view, extra.sort ?? order), { replace: true }),
    [view, order],
  );
  const onChange = useCallback((patch: Partial<Filters>) => go({ ...filters, ...patch }), [go, filters]);
  const onClear = useCallback(() => go(NO_FILTERS), [go]);
  const viewHref = (v: View) => ledgerHref(filters, v, order);

  const active = activeFilters(filters);
  const hint = rows.length ? null : relaxHint(ROWS, filters);
  const asOf = monthLabel(AS_OF);

  return (
    <Page screen="money-ledger" className="h-ledger">
      <FilesTabs current="money" />
      <ScreenHeader
        kicker={`F.No. P/LEDGER/2000–2026`}
        titleHi="पैसा कहाँ गया?"
        title="Paisa Kahan Gaya?"
        lead={t(
          `The money ledger: ${formatNumber(ROWS.length)} measures that handed out public money, 2000 to 2026. Who passed each one, which party governed, the benefit, reach and cost, the poll it came before, and what happened next. Every row has its source and plays as a card.`,
          `पैसे का लेखा: 2000 से 2026 तक जनता का पैसा बाँटने वाले ${formatNumber(ROWS.length)} उपाय। किसने दिया, किसकी सरकार थी, क्या मिला, कितनों को, कितने में, किस चुनाव से पहले, और फिर क्या हुआ। हर पंक्ति का स्रोत है और हर पंक्ति कार्ड बनकर खेली जा सकती है।`,
        )}
      />
      <p className="h-quip h-ledger__quip">{t('Har rupaye ki tareekh. Har tareekh ki receipt.', 'हर रुपये की तारीख़। हर तारीख़ की रसीद।')}</p>

      <section className="h-ledger__take" aria-labelledby="h-ledger-take">
        <div className="h-ledger__taketext">
          <h2 className="h-ledger__h2" id="h-ledger-take">
            {t('Take the ledger', 'पूरा लेखा ले जाओ')}
          </h2>
          <p className="h-meta">
            {t(
              `${formatNumber(ROWS.length)} rows, one per measure, with each source URL in its own column and a README sheet on sources. Facts as of ${asOf}. The files hold the whole ledger; the filters below do not apply to them.`,
              `${formatNumber(ROWS.length)} पंक्तियाँ, हर उपाय की एक, हर स्रोत का लिंक अलग कॉलम में। तथ्य ${asOf} तक। फ़ाइलों में पूरा लेखा है; नीचे के फ़िल्टर उन पर लागू नहीं।`,
            )}
          </p>
        </div>
        <div className="h-ledger__takebtns">
          <Button variant="primary" href={DOWNLOADS.csv} download="hisaab-money-ledger.csv" icon={<Download size={20} strokeWidth={2.4} />} trailing={null}>
            {t('Download CSV', 'CSV डाउनलोड')}
          </Button>
          <Button variant="paper" href={DOWNLOADS.xlsx} download="hisaab-money-ledger.xlsx" icon={<FileSpreadsheet size={20} strokeWidth={2.4} />}>
            {t('Excel (.xlsx)', 'एक्सेल (.xlsx)')}
          </Button>
        </div>
      </section>

      <LedgerFilters all={ROWS} filters={filters} facets={facets} onChange={onChange} onClear={onClear} />

      <div className="h-ledger__status">
        <p className="h-ledger__count" role="status">
          {rows.length === ROWS.length
            ? t(`All ${formatNumber(ROWS.length)} measures`, `सभी ${formatNumber(ROWS.length)} उपाय`)
            : t(`${formatNumber(rows.length)} of ${formatNumber(ROWS.length)} measures match`, `${formatNumber(ROWS.length)} में से ${formatNumber(rows.length)} उपाय`)}
          {rows.length ? t(` · ${formatNumber(polled)} came before a poll`, ` · ${formatNumber(polled)} चुनाव से पहले`) : ''}
        </p>
        {ignored.length ? (
          <InlineNote tone="wait">
            {t(`Ignored a filter this ledger has no value for: ${ignored.join(', ')}.`, `यह फ़िल्टर लेखे में नहीं मिला: ${ignored.join(', ')}।`)}
          </InlineNote>
        ) : null}
      </div>

      {rows.length ? (
        <>
          <YearChart rows={rows} years={years} modes={modes} />

          <div className="h-ledger__bar">
            <nav className="h-ledger__views" aria-label={t('Ledger views', 'लेखे के दृश्य')}>
              <ViewLink to={viewHref('timeline')} current={view === 'timeline'} icon={<LayoutList size={18} strokeWidth={2.4} />}>
                {t('Timeline', 'समयरेखा')}
              </ViewLink>
              <ViewLink to={viewHref('table')} current={view === 'table'} icon={<Table2 size={18} strokeWidth={2.4} />}>
                {t('Table', 'तालिका')}
              </ViewLink>
              <ViewLink to={viewHref('vote')} current={view === 'vote'} icon={<Vote size={18} strokeWidth={2.4} />}>
                {t('Before the vote', 'चुनाव से पहले')}
              </ViewLink>
            </nav>
            {view !== 'vote' ? (
              <div className="h-ledger__sort" role="group" aria-label={t('Order', 'क्रम')}>
                <button type="button" className="h-ledger__sortbtn" aria-pressed={order === 'new'} onClick={() => go(filters, { sort: 'new' })}>
                  <CalendarArrowDown size={18} strokeWidth={2.4} aria-hidden="true" />
                  {t('Newest first', 'नया पहले')}
                </button>
                <button type="button" className="h-ledger__sortbtn" aria-pressed={order === 'old'} onClick={() => go(filters, { sort: 'old' })}>
                  <CalendarArrowUp size={18} strokeWidth={2.4} aria-hidden="true" />
                  {t('Oldest first', 'पुराना पहले')}
                </button>
              </div>
            ) : null}
          </div>

          {view === 'vote' ? (
            <VoteView rows={rows} filterKey={filterKey} />
          ) : (
            <div className="h-ledger__list">
              {view === 'table' ? <LedgerTable rows={rows.slice(0, shown)} total={rows.length} /> : <Timeline rows={rows.slice(0, shown)} yearTotals={yearTotals} />}
              {rows.length > shown ? (
                <div className="h-ledger__more">
                  <Button variant="paper" onClick={() => setPage({ key: pageKey, n: shown + PAGE })}>
                    {t(`Show ${Math.min(PAGE, rows.length - shown)} more`, `${Math.min(PAGE, rows.length - shown)} और दिखाओ`)}
                  </Button>
                  <span className="h-meta">
                    {t(`${formatNumber(shown)} of ${formatNumber(rows.length)} shown`, `${formatNumber(rows.length)} में से ${formatNumber(shown)}`)}
                  </span>
                </div>
              ) : (
                <p className="h-meta h-ledger__end">
                  {t(`End of the ledger for this view: ${formatNumber(rows.length)} ${rows.length === 1 ? 'measure' : 'measures'}.`, `इस दृश्य का लेखा ख़त्म: ${formatNumber(rows.length)} उपाय।`)}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          className="h-ledger__empty"
          line={
            <>
              {t('Is filter mein koi hisaab nahi. No measure matches all of these filters.', 'इन सब फ़िल्टरों पर कोई उपाय नहीं।')}
              {hint ? (
                <span className="h-ledger__hint">
                  {t(
                    ` Without the ${FILTER_WORDS[hint.key].en} filter: ${formatNumber(hint.count)} ${hint.count === 1 ? 'measure' : 'measures'}.`,
                    ` ${FILTER_WORDS[hint.key].hi} फ़िल्टर हटाने पर: ${formatNumber(hint.count)} उपाय।`,
                  )}
                </span>
              ) : null}
            </>
          }
          action={
            <div className="h-ledger__emptyact">
              {hint ? (
                <Button variant="paper" onClick={() => onChange(hint.key === 'q' ? { q: '' } : { [hint.key]: null })}>
                  {t(`Drop the ${FILTER_WORDS[hint.key].en} filter`, `${FILTER_WORDS[hint.key].hi} फ़िल्टर हटाओ`)}
                </Button>
              ) : null}
              {active.length ? (
                <Button variant="ghost" onClick={onClear}>
                  {t('Clear all filters', 'सभी फ़िल्टर हटाओ')}
                </Button>
              ) : null}
            </div>
          }
        />
      )}

      <NotingSheet title={t('How to read the ledger', 'लेखा कैसे पढ़ें')} className="h-ledger__noting">
        <ul className="h-ledger__notes">
          <li>
            {t(
              'Each row is one measure: a launch, or a later decision that changed the money or came with its own date before a poll (a hike, an expansion, a special payout). Audits, reach counts and renamings fold into the launch row.',
              'हर पंक्ति एक उपाय है: शुरुआत, या बाद का कोई फ़ैसला जिसने पैसा बदला या चुनाव से पहले अपनी तारीख़ के साथ आया। ऑडिट, पहुँच और नाम-बदल उसी पंक्ति में।',
            )}
          </li>
          <li>
            {t(
              '“Passed by” names who announced, presented or passed it: a public act, not an allegation. “Governed” is the party or coalition in power at that level then (NDA or UPA for the Centre), not a verdict. The counts reflect what the question bank covers, not which party spends more.',
              '“किसने दिया” यानी जिसने घोषणा की, पेश किया या पास किया: सार्वजनिक काम, आरोप नहीं। “सरकार” उस समय उस स्तर पर सत्ता में दल या गठबंधन है, फ़ैसला नहीं।',
            )}
          </li>
          <li>
            {t(
              'Costs carry their own qualifiers (“a year”, “(2025-26)”, “in all”) and are not comparable across rows. Do not add them up; bundle rows overlap their parts.',
              'लागत के साथ उसकी शर्त लिखी है (“सालाना”, “(2025-26)”, “कुल”); पंक्तियों के बीच तुलना या जोड़ न करें।',
            )}
          </li>
          <li>
            {t(
              'Dates are as the bank gives them; a month appears only when a source states it. “by 2000” means the bank gives no launch date, only a later one.',
              'तारीख़ें बैंक के अनुसार; महीना तभी जब स्रोत बताए। “by 2000” = शुरुआत की तारीख़ नहीं, बाद की दी गई है।',
            )}
          </li>
          <li>
            {t(
              'Days before polling run from the event the bank names (the announcement, the cabinet decision or the first payment) to the first polling day. Timing is a fact; motive is not. No row says what caused an election result, and words like “freebie” or “revdi” appear only when quoting whoever said them.',
              'मतदान से पहले के दिन बैंक के बताए दिन (घोषणा, कैबिनेट फ़ैसला या पहला भुगतान) से पहले मतदान दिवस तक गिने गए हैं। समय तथ्य है, इरादा नहीं। कोई पंक्ति चुनावी नतीजे का कारण नहीं बताती।',
            )}
          </li>
          <li>
            {t(
              `Every row is built from sourced, fact-checked question-bank items: the ↗ link is the page that states the core fact, and each card plays one of those items. Facts as of ${asOf}.`,
              `हर पंक्ति स्रोत-सहित, जाँचे हुए बैंक सवालों से बनी है: ↗ लिंक वह पन्ना है जिसमें मूल तथ्य है। तथ्य ${asOf} तक।`,
            )}{' '}
            <Link to={href.rules()} className="h-link">
              {t('Rules, sources and corrections', 'नियम, स्रोत और सुधार')}
            </Link>
          </li>
        </ul>
      </NotingSheet>
    </Page>
  );
}

function ViewLink({ to, current, icon, children }: { to: string; current: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} replace className={cx('h-ledger__view')} aria-current={current ? 'page' : undefined}>
      <span className="h-ledger__viewicon" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </Link>
  );
}
