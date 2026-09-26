/**
 * screens/ledger/vote.tsx — "Before the vote": for every poll a filtered measure preceded, how many days
 * before polling it came (a dot on a shared day axis, polling day at the right) beside the official
 * result, verbatim. Charter §4b.2–3: timing is a fact, motive is not, and the result is stated, never
 * explained — the caveat says so in plain words above the chart, and nothing here classifies a result
 * as a win or a loss for anyone. Party appears only as text ("Govt then: …").
 *
 * The dots are decoration over the list under each poll, which carries every value in words (the
 * accessible equivalent); pointing at a dot marks its line.
 */
import { useMemo, useState } from 'react';
import { Info, Timer } from 'lucide-react';
import { formatNumber } from '../../data';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { GapBands } from './chart';
import { gapDomain, gapSummary, gapText, gapTicks, monthText, pollGroups, type LedgerRow, type PollMeasure } from './lib';
import { placeLine } from './meta';
import './chart.css';

const POLL_PAGE = 12;

/** The measures with a recorded gap, each with its stack level (0, 1, …) among dots on the same day. */
function stacked(measures: readonly PollMeasure[]): { m: PollMeasure; level: number }[] {
  const seen = new Map<number, number>();
  return measures
    .filter((m) => m.gapDays !== null)
    .map((m) => {
      const level = seen.get(m.gapDays as number) ?? 0;
      seen.set(m.gapDays as number, level + 1);
      return { m, level };
    });
}
const stackDepth = (measures: readonly PollMeasure[]) => Math.max(1, ...stacked(measures).map((s) => s.level + 1));

export function VoteView({ rows, filterKey }: { rows: readonly LedgerRow[]; filterKey: string }) {
  const { t, isHi } = useLang();
  const en = isHi ? 'en' : undefined;
  const groups = useMemo(() => pollGroups(rows), [rows]);
  const summary = useMemo(() => gapSummary(rows), [rows]);
  const domain = gapDomain(summary.max);
  const ticks = gapTicks(domain);
  const [page, setPage] = useState({ key: filterKey, n: POLL_PAGE });
  const shown = page.key === filterKey ? page.n : POLL_PAGE;
  const [hot, setHot] = useState<string | null>(null);
  const pos = (gap: number) => `${(gap / domain) * 100}%`;
  // Every band edge the axis reaches is labelled, except 30 on a long axis (it would sit on the 0).
  const tickLabel = (d: number) => (d === 30 && domain > 180 ? '' : formatNumber(d));

  return (
    <section className="h-lvote" aria-labelledby="h-lvote-title">
      <h2 className="h-lvote__title" id="h-lvote-title">
        <span className="h-lvote__titlehi" lang="hi">
          चुनाव से पहले
        </span>
        <span lang="en">Before the vote</span>
      </h2>
      <div className="h-lvote__caveat" role="note">
        <Info size={20} strokeWidth={2.4} aria-hidden="true" />
        <p>
          <strong>{t('Timing, not cause.', 'समय, कारण नहीं।')}</strong>{' '}
          {t(
            'This shows how many days before polling each measure came, and the official result of that poll. It does not show that a measure changed a result, and nothing on this page claims one did. The ledger covers whoever governed, at the Centre and in the states.',
            'यह बताता है कि हर उपाय मतदान से कितने दिन पहले आया, और उस चुनाव का आधिकारिक नतीजा। यह नहीं बताता कि किसी उपाय ने नतीजा बदला, और यह पन्ना ऐसा दावा नहीं करता। लेखे में केंद्र और राज्यों की हर सरकार शामिल है।',
          )}
        </p>
      </div>

      {groups.length ? (
        <>
          <GapBands summary={summary} />
          <p className="h-lvote__lead">
            {t(
              `${formatNumber(summary.withPoll)} ${summary.withPoll === 1 ? 'measure' : 'measures'} before ${formatNumber(groups.length)} ${groups.length === 1 ? 'poll' : 'polls'}, newest poll first. Each dot is one measure, placed by the days from it to polling day (0, the right edge).`,
              `${formatNumber(groups.length)} चुनावों से पहले ${formatNumber(summary.withPoll)} उपाय, नया चुनाव पहले। हर बिंदु एक उपाय, मतदान के दिन (0, दायाँ सिरा) से दूरी के हिसाब से।`,
            )}
          </p>
          <ol className="h-lvote__polls">
            {groups.slice(0, shown).map((g) => (
              <li key={g.key} className="h-lvote__poll">
                <h3 className="h-lvote__name">
                  <span lang={en}>{g.label}</span> <span className="h-lvote__month h-mono">{monthText(g.month)}</span>
                </h3>
                <div className="h-lvote__result">
                  <span className="h-lvote__k">{t('Official result', 'आधिकारिक नतीजा')}</span>
                  {g.results.map((r) => (
                    <span key={r} className="h-lvote__r" lang={en}>
                      {r}
                    </span>
                  ))}
                </div>
                <div className="h-lvote__chart" aria-hidden="true">
                  <div className="h-lvote__strip" style={{ ['--stacks' as string]: String(stackDepth(g.measures)) }}>
                    {ticks.map((d) => (
                      <span key={d} className={cx('h-lvote__grid', d === 0 && 'h-lvote__grid--zero')} style={{ right: pos(d) }} />
                    ))}
                    {stacked(g.measures).map(({ m, level }) => (
                      <span
                        key={m.row.id}
                        className={cx('h-lvote__dot', hot === m.row.id && 'h-lvote__dot--on')}
                        style={{ right: pos(m.gapDays as number), ['--level' as string]: String(level) }}
                        onPointerEnter={() => setHot(m.row.id)}
                        onPointerLeave={() => setHot(null)}
                        onPointerDown={() => setHot(m.row.id)}
                      />
                    ))}
                  </div>
                  <div className="h-lvote__ticks">
                    {ticks.map((d) =>
                      tickLabel(d) ? (
                        <span key={d} className={cx('h-lvote__tick', d === 0 && 'h-lvote__tick--zero', d === domain && d !== 0 && 'h-lvote__tick--end')} style={{ right: pos(d) }}>
                          {tickLabel(d)}
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>
                <ul className="h-lvote__measures">
                  {g.measures.map((m) => (
                    <li key={m.row.id} className={cx('h-lvote__m', hot === m.row.id && 'h-lvote__m--on')}>
                      <span className="h-lvote__mname" lang={en}>
                        {m.row.name}
                      </span>
                      <span className="h-lvote__mmeta">
                        {placeLine(m.row, isHi)} · <span lang="en">Govt then: {m.row.party}</span>
                      </span>
                      <span className={cx('h-lvote__gap', m.gapDays === null && 'h-lvote__gap--none')}>
                        <Timer size={14} strokeWidth={2.6} aria-hidden="true" />
                        {m.gapDays === null ? t('Gap not recorded', 'अंतर दर्ज नहीं') : isHi ? `मतदान से ${formatNumber(m.gapDays)} दिन पहले` : gapText(m.gapDays)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {groups.length > shown ? (
            <div className="h-lvote__more">
              <Button variant="paper" onClick={() => setPage({ key: filterKey, n: shown + POLL_PAGE })}>
                {t(`Show ${Math.min(POLL_PAGE, groups.length - shown)} more polls`, `${Math.min(POLL_PAGE, groups.length - shown)} और चुनाव`)}
              </Button>
              <span className="h-meta">
                {t(`${formatNumber(shown)} of ${formatNumber(groups.length)} polls shown`, `${formatNumber(groups.length)} में से ${formatNumber(shown)} चुनाव`)}
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <p className="h-lvote__none">
          {rows.length
            ? t(
                rows.length === 1 ? 'This measure names no poll it came before.' : `None of these ${formatNumber(rows.length)} measures names a poll it came before.`,
                `इन ${formatNumber(rows.length)} उपायों में से कोई किसी चुनाव से पहले का नहीं बताया गया।`,
              )
            : t('No measure matches these filters.', 'इन फ़िल्टरों पर कोई उपाय नहीं।')}
        </p>
      )}
    </section>
  );
}
