/**
 * screens/ledger/chart.tsx — the ledger's compact chart: measures per launch year, one small multiple
 * per mode (dataviz method: small multiples on ONE shared y-scale, so the three strips compare on a
 * common baseline, instead of a stacked bar whose middle segments float). One hue for every strip —
 * the syahi token — because identity is carried by each strip's printed name and icon, not a colour.
 * Party is never encoded here at all.
 *
 * Marks: columns ≤ 24px wide, 2px gaps, a rounded data-end and a square baseline; values in text ink
 * (the busiest year of each strip is labelled; any year's split is in the readout, pointed or tapped);
 * the table twin sits one tap below (the WCAG-clean equivalent of the whole chart).
 */
import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatNumber } from '../../data';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { yearModeCounts, type GapSummary, type LedgerMode, type LedgerRow } from './lib';
import { MODE_META } from './meta';
import './chart.css';

export function YearChart({ rows, years, modes }: { rows: readonly LedgerRow[]; years: readonly number[]; modes: readonly LedgerMode[] }) {
  const { t, isHi } = useLang();
  const counts = useMemo(() => yearModeCounts(rows, years), [rows, years]);
  const max = Math.max(1, ...counts.flatMap((c) => modes.map((m) => c.by[m])));
  const [at, setAt] = useState<number | null>(null);
  const focus = counts.find((c) => c.year === at) ?? null;
  const shown = counts.reduce((s, c) => s + modes.reduce((a, m) => a + c.by[m], 0), 0);
  const busiest = counts.reduce((a, b) => (b.total > a.total ? b : a), counts[0]);
  const first = years[0];
  const last = years[years.length - 1];
  const labelled = (y: number) => years.length <= 9 || y === first || y === last || (y % 5 === 0 && y - first >= 3 && last - y >= 3);
  const name = (m: LedgerMode) => (isHi ? MODE_META[m].hi : MODE_META[m].title);

  const readout = focus
    ? `${focus.year}: ${formatNumber(modes.reduce((a, m) => a + focus.by[m], 0))} ${t('measures', 'उपाय')} — ${modes.map((m) => `${name(m)} ${focus.by[m]}`).join(' · ')}`
    : t('Point at or tap a year for its split.', 'किसी साल पर उँगली रखो।');

  return (
    <figure className="h-lchart" onPointerLeave={(e) => e.pointerType === 'mouse' && setAt(null)}>
      <figcaption className="h-lchart__cap">
        <span className="h-lchart__title">{t('Measures per year, by mode', 'हर साल के उपाय, मोड के हिसाब से')}</span>
        <span className="h-lchart__sub">
          {t(
            `${formatNumber(shown)} launched ${first}–${last} · one shared scale · launch year as the bank dates it`,
            `${first}–${last} में ${formatNumber(shown)} · एक ही पैमाना · बैंक की दी हुई तारीख़`,
          )}
        </span>
        <span className="h-lchart__readout" aria-hidden="true">
          {readout}
        </span>
      </figcaption>
      <p className="h-sr">
        {t(
          `Column chart, one strip per mode, of measures by launch year from ${first} to ${last}: ${formatNumber(shown)} in all. The busiest year is ${busiest?.year} with ${busiest?.total}. Every count is in the table below.`,
          `${first} से ${last} तक हर साल के उपाय, हर मोड की अलग पट्टी: कुल ${formatNumber(shown)}। सबसे ज़्यादा ${busiest?.year} में, ${busiest?.total}। हर गिनती नीचे की तालिका में है।`,
        )}
      </p>
      <div className="h-lchart__strips" aria-hidden="true" style={{ ['--cols' as string]: String(years.length) }}>
        {modes.map((m) => {
          const rowMax = Math.max(0, ...counts.map((c) => c.by[m]));
          const peak = counts.find((c) => c.by[m] === rowMax && rowMax > 0)?.year;
          const total = counts.reduce((a, c) => a + c.by[m], 0);
          return (
            <div className="h-lchart__strip" key={m}>
              <p className="h-lchart__label">
                <span className="h-lchart__icon">{MODE_META[m].icon(16)}</span>
                <span lang={isHi ? 'hi' : undefined}>{name(m)}</span>
                <span className="h-lchart__total h-mono">{formatNumber(total)}</span>
              </p>
              <div className="h-lchart__plot">
                {counts.map((c) => {
                  const v = c.by[m];
                  const on = at === c.year;
                  return (
                    <span
                      key={c.year}
                      className={cx('h-lchart__col', on && 'h-lchart__col--on')}
                      onPointerEnter={() => setAt(c.year)}
                      onPointerDown={() => setAt(c.year)}
                    >
                      {v > 0 && (c.year === peak || on) ? <span className="h-lchart__val">{v}</span> : null}
                      {v > 0 ? <span className="h-lchart__bar" style={{ ['--v' as string]: String(v / max) }} /> : null}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="h-lchart__axis">
          {years.map((y) => (
            // Narrow columns (the full 27 years): the end labels hug the edges so they stay inside the card.
            <span key={y} className={cx('h-lchart__tick', years.length > 9 && y === first && 'h-lchart__tick--first', years.length > 9 && y === last && 'h-lchart__tick--last')}>
              {labelled(y) ? y : ''}
            </span>
          ))}
        </div>
      </div>
      <details className="h-lchart__fold">
        <summary className="h-lchart__summary">
          <span>{t('The counts as a table', 'गिनती तालिका में')}</span>
          <ChevronRight className="h-lchart__chev" size={20} strokeWidth={2.4} aria-hidden="true" />
        </summary>
        <div className="h-lchart__tablewrap">
          <table className="h-lchart__table">
            <caption className="h-sr">{t('Measures per launch year, by mode', 'हर साल के उपाय, मोड के हिसाब से')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('Year', 'साल')}</th>
                {modes.map((m) => (
                  <th scope="col" key={m} lang={isHi ? 'hi' : undefined}>
                    {name(m)}
                  </th>
                ))}
                {modes.length > 1 ? <th scope="col">{t('All', 'कुल')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {counts.map((c) => (
                <tr key={c.year}>
                  <th scope="row" className="h-mono">
                    {c.year}
                  </th>
                  {modes.map((m) => (
                    <td key={m} className="h-mono">
                      {c.by[m]}
                    </td>
                  ))}
                  {modes.length > 1 ? <td className="h-mono">{modes.reduce((a, m) => a + c.by[m], 0)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** How long before polling day: the five gap bands as a one-hue bar list, the count at each bar's tip. */
export function GapBands({ summary }: { summary: GapSummary }) {
  const { t } = useLang();
  const max = Math.max(1, ...summary.bands.map((b) => b.count));
  const hi: Record<string, string> = { d30: '30 दिन के अंदर', d90: '31–90 दिन', d180: '91–180 दिन', d365: '181–365 दिन', d366: 'एक साल से ज़्यादा' };
  return (
    <figure className="h-lbands">
      <figcaption className="h-lbands__cap">
        <span className="h-lchart__title">{t('How long before polling day', 'मतदान से कितने दिन पहले')}</span>
        <span className="h-lchart__sub">
          {summary.withGap
            ? t(
                `${formatNumber(summary.withGap)} of ${formatNumber(summary.withPoll)} measures record the gap · median ${formatNumber(summary.median ?? 0)} days · ${formatNumber(summary.min ?? 0)} to ${formatNumber(summary.max ?? 0)}`,
                `${formatNumber(summary.withPoll)} में से ${formatNumber(summary.withGap)} में अंतर दर्ज · माध्यिका ${formatNumber(summary.median ?? 0)} दिन`,
              )
            : t('No measure in this view records the gap in days.', 'इस दृश्य में किसी उपाय का अंतर दर्ज नहीं।')}
        </span>
      </figcaption>
      {summary.withGap ? (
        <ul className="h-lbands__list">
          {summary.bands.map((b) => (
            <li key={b.id} className="h-lbands__row">
              <span className="h-lbands__label">{t(b.label, hi[b.id])}</span>
              <span className="h-lbands__track" aria-hidden="true">
                {b.count ? <span className="h-lbands__bar" style={{ ['--v' as string]: String(b.count / max) }} /> : null}
              </span>
              <span className="h-lbands__val h-mono">{formatNumber(b.count)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
