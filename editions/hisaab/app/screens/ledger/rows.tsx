/**
 * screens/ledger/rows.tsx — the ledger itself, two ways over the same rows:
 *
 *   Timeline   year by year (a sticky year band), one paper entry per measure: when, where, the mode
 *              (icon + name), who passed it (a public act, charter §4b.1), who governed (a neutral chip,
 *              never a party colour), benefit, reach, cost, the poll it preceded with the gap and the
 *              official result, the outcome, the source ↗ and each bank item as a playable card (#/q/:id).
 *   Table      the same fields in an accessible <table> (row headers, a caption, a sideways-scrolling
 *              region that is keyboard reachable), for screen readers and for scanning.
 *
 * Strings are the rows' own, verbatim (the bank stays English: lang="en" in the Hindi locale).
 */
import { ExternalLink, Play, Timer } from 'lucide-react';
import { formatNumber, itemById, sourceHost, sourceKind } from '../../data';
import { href, Link } from '../../router';
import { Chip, GovtChip, SourceChip } from '../../ui/chip';
import { useLang } from '../../ui/lang';
import { enactedText, gapText, groupByYear, launchedText, launchYear, type LedgerRow } from './lib';
import { MODE_META, placeLine } from './meta';
import './ledger.css';

/** The rows shown so far, grouped by launch year; `yearTotals` counts every filtered row per year. */
export function Timeline({ rows, yearTotals }: { rows: readonly LedgerRow[]; yearTotals: ReadonlyMap<number, number> }) {
  const { t } = useLang();
  return (
    <div className="h-ledger__years">
      {groupByYear(rows).map((g) => {
        const total = yearTotals.get(g.year) ?? g.rows.length;
        return (
          <section key={g.year} className="h-ledger__year" aria-labelledby={`h-ledger-y${g.year}`}>
            <h2 className="h-ledger__yearhead" id={`h-ledger-y${g.year}`}>
              <span className="h-ledger__yearnum h-mono">{g.year}</span>
              <span className="h-ledger__yearcount">{t(`${total} ${total === 1 ? 'measure' : 'measures'}`, `${total} उपाय`)}</span>
            </h2>
            <ol className="h-ledger__rows">
              {g.rows.map((r) => (
                <li key={r.id}>
                  <RowCard row={r} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function PlayCards({ row, compact }: { row: LedgerRow; compact?: boolean }) {
  const { t } = useLang();
  const items = row.itemIds.map((id) => itemById(id)).filter((q): q is NonNullable<typeof q> => !!q);
  if (!items.length) return <span className="h-meta">{t('Cards not in this build', 'कार्ड इस संस्करण में नहीं')}</span>;
  return (
    <span className="h-lrow__cards">
      {!compact ? <span className="h-lrow__cardsk">{t(items.length === 1 ? 'Play as a card' : 'Play as cards', 'कार्ड खेलो')}</span> : null}
      {items.map((q, i) => (
        <Link
          key={q.id}
          to={href.taster(q.id)}
          className="h-lrow__card"
          aria-label={t(`Play card ${i + 1} of ${items.length}: ${q.question}`, `कार्ड ${i + 1}/${items.length} खेलो: ${q.question}`)}
        >
          <Play size={14} strokeWidth={2.8} aria-hidden="true" />
          <span className="h-mono">{items.length === 1 ? t('Card', 'कार्ड') : i + 1}</span>
        </Link>
      ))}
    </span>
  );
}

function SourceLink({ row }: { row: LedgerRow }) {
  const { t, isHi } = useLang();
  return (
    <a className="h-lrow__source" href={row.sourceUrl} target="_blank" rel="noopener noreferrer">
      <SourceChip kind={sourceKind(row)} />
      <span className="h-lrow__sourcetext" lang={isHi ? 'en' : undefined}>
        {row.sourceLabel}
      </span>
      <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" className="h-lrow__ext" />
      <span className="h-sr">{t(`(opens ${sourceHost(row.sourceUrl)} in a new tab)`, `(${sourceHost(row.sourceUrl)} नए टैब में)`)}</span>
    </a>
  );
}

export function RowCard({ row }: { row: LedgerRow }) {
  const { t, isHi } = useLang();
  const en = isHi ? 'en' : undefined;
  const mode = MODE_META[row.mode];
  const gap = row.poll?.gapDays;
  return (
    <article className="h-lrow" aria-labelledby={`h-lrow-${row.id}`}>
      <header className="h-lrow__head">
        <p className="h-lrow__when">
          <span className="h-mono" lang="en">
            {launchedText(row)}
          </span>
          <span aria-hidden="true"> · </span>
          <span>{placeLine(row, isHi)}</span>
        </p>
        <Chip kind="kind" icon={mode.icon(14)} lang={isHi ? 'hi' : 'en'}>
          {isHi ? mode.hi : mode.title}
        </Chip>
      </header>
      <h3 className="h-lrow__name" id={`h-lrow-${row.id}`} lang={en}>
        {row.name}
      </h3>
      <p className="h-lrow__benefit" lang={en}>
        {row.benefit}
      </p>
      <dl className="h-lrow__facts">
        <div className="h-lrow__fact">
          <dt>{t('Passed by', 'किसने दिया')}</dt>
          <dd lang={en}>
            {row.enactedBy.length ? (
              row.enactedBy.map((e) => (
                <span key={`${e.name}|${e.role}`} className="h-lrow__person">
                  {enactedText(e)}
                </span>
              ))
            ) : (
              <span className="h-lrow__none">{t('No one is named in the bank for this measure.', 'बैंक में किसी का नाम नहीं।')}</span>
            )}
          </dd>
        </div>
        <div className="h-lrow__fact">
          <dt>{t('Governed', 'सरकार')}</dt>
          <dd>
            <GovtChip govt={row.party} />
          </dd>
        </div>
        {row.reach ? (
          <div className="h-lrow__fact">
            <dt>{t('Reach', 'पहुँच')}</dt>
            <dd lang={en}>{row.reach}</dd>
          </div>
        ) : null}
        {row.annualCost ? (
          <div className="h-lrow__fact">
            <dt>{t('Cost', 'लागत')}</dt>
            <dd lang={en}>{row.annualCost}</dd>
          </div>
        ) : null}
        {row.poll ? (
          <div className="h-lrow__fact h-lrow__fact--poll">
            <dt>{t('Before the vote', 'चुनाव से पहले')}</dt>
            <dd>
              <span className="h-lrow__poll" lang={en}>
                <strong>{row.poll.label}</strong>
              </span>
              <span className="h-lrow__gap">
                <Timer size={14} strokeWidth={2.6} aria-hidden="true" />
                {typeof gap === 'number'
                  ? isHi
                    ? `मतदान से ${formatNumber(gap)} दिन पहले`
                    : gapText(gap)
                  : t('Gap in days not recorded for this measure', 'दिनों का अंतर दर्ज नहीं')}
              </span>
              <span className="h-lrow__result">
                <span className="h-lrow__resultk">{t('Official result:', 'आधिकारिक नतीजा:')}</span> <span lang={en}>{row.poll.result}</span>
              </span>
            </dd>
          </div>
        ) : null}
        <div className="h-lrow__fact">
          <dt>{t('Outcome', 'फिर क्या हुआ')}</dt>
          <dd lang={en}>{row.outcome}</dd>
        </div>
      </dl>
      {row.package || row.launchedApprox ? (
        <ul className="h-lrow__notes">
          {row.package ? (
            <li>{t('A bundle: its parts have rows of their own, so its costs overlap theirs. Do not add them up.', 'एक पैकेज: इसके हिस्सों की अपनी पंक्तियाँ हैं, लागत दोहराई गई है। जोड़ें नहीं।')}</li>
          ) : null}
          {row.launchedApprox ? (
            <li>
              {t(
                `The bank gives no launch date: ${launchYear(row)} is the earliest date it gives, so read it as "active by".`,
                `बैंक में शुरुआत की तारीख़ नहीं: ${launchYear(row)} सबसे पहली दी गई तारीख़ है।`,
              )}
            </li>
          ) : null}
        </ul>
      ) : null}
      <footer className="h-lrow__foot">
        <SourceLink row={row} />
        <PlayCards row={row} />
      </footer>
    </article>
  );
}

/** The table twin: the same rows and fields, in a keyboard-scrollable region. */
export function LedgerTable({ rows, total }: { rows: readonly LedgerRow[]; total: number }) {
  const { t, isHi } = useLang();
  const en = isHi ? 'en' : undefined;
  return (
    <div
      className="h-ltable"
      role="region"
      aria-label={t('The ledger as a table (scrolls sideways)', 'लेखा तालिका में (बगल में स्क्रॉल होती है)')}
      tabIndex={0}
    >
      <table className="h-ltable__table">
        <caption className="h-ltable__cap">
          {t(
            `The money ledger: ${formatNumber(rows.length)} of ${formatNumber(total)} matching measures, one per row. Scroll sideways for every column.`,
            `पैसे का लेखा: ${formatNumber(total)} में से ${formatNumber(rows.length)} उपाय। सारे कॉलम देखने के लिए बगल में स्क्रॉल करें।`,
          )}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('Launched', 'कब')}</th>
            <th scope="col">{t('Measure', 'उपाय')}</th>
            <th scope="col">{t('Mode', 'मोड')}</th>
            <th scope="col">{t('Where', 'कहाँ')}</th>
            <th scope="col">{t('Governed', 'सरकार')}</th>
            <th scope="col">{t('Passed by', 'किसने दिया')}</th>
            <th scope="col">{t('Benefit', 'लाभ')}</th>
            <th scope="col">{t('Reach', 'पहुँच')}</th>
            <th scope="col">{t('Cost', 'लागत')}</th>
            <th scope="col">{t('Poll it preceded', 'कौनसा चुनाव')}</th>
            <th scope="col">{t('Days before', 'कितने दिन पहले')}</th>
            <th scope="col">{t('Official result', 'आधिकारिक नतीजा')}</th>
            <th scope="col">{t('Outcome', 'फिर क्या हुआ')}</th>
            <th scope="col">{t('Source', 'स्रोत')}</th>
            <th scope="col">{t('Cards', 'कार्ड')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="h-mono h-ltable__nowrap" lang="en">
                {launchedText(r)}
              </td>
              <th scope="row" lang={en}>
                {r.name}
                {r.package ? <span className="h-ltable__flag">{t(' (bundle: overlaps its parts)', ' (पैकेज)')}</span> : null}
              </th>
              <td lang={isHi ? 'hi' : undefined}>{isHi ? MODE_META[r.mode].hi : MODE_META[r.mode].title}</td>
              <td>{placeLine(r, isHi)}</td>
              <td lang="en">{r.party}</td>
              <td lang={en}>{r.enactedBy.length ? r.enactedBy.map(enactedText).join('; ') : t('Not named in the bank', 'नाम नहीं')}</td>
              <td lang={en}>{r.benefit}</td>
              <td lang={en}>{r.reach ?? '—'}</td>
              <td lang={en}>{r.annualCost ?? '—'}</td>
              <td lang={en}>{r.poll ? `${r.poll.label} (${r.poll.month})` : '—'}</td>
              <td className="h-mono">{typeof r.poll?.gapDays === 'number' ? formatNumber(r.poll.gapDays) : r.poll ? t('not recorded', 'दर्ज नहीं') : '—'}</td>
              <td lang={en}>{r.poll?.result ?? '—'}</td>
              <td lang={en}>{r.outcome}</td>
              <td>
                <a className="h-ltable__link" href={r.sourceUrl} target="_blank" rel="noopener noreferrer" lang={en}>
                  {sourceHost(r.sourceUrl)} <ExternalLink size={14} strokeWidth={2.4} aria-hidden="true" />
                  <span className="h-sr">{`: ${r.sourceLabel}`}</span>
                </a>
              </td>
              <td>
                <PlayCards row={r} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
