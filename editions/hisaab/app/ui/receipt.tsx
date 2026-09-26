/**
 * ui/receipt.tsx — `h-receipt`, the thermal slip that closes every answer (bible §5, §11.11).
 *
 *   <Receipt item={itemById(card.factId)} receiptNo={215} xp={32} xpNote="base 20 · fast +15" printing />
 *
 * Rows, in this order: RECEIPT # · XP (with the item's F.No. under it) / SOURCE (label + ↗,
 * source-type chip) / STATUS (the legal status VERBATIM in the neutral legal block + "as of") / OTHER
 * SIDE / GOVT THEN (neutral chip) — then, for money-trail items, ENACTED BY (name · role · party) and
 * RESULT (outcome + the poll line). Nothing funny happens inside a receipt: every row is plain and exact.
 *
 * The corrections route (bible §11.17): with an `item`, the receipt prints its F.No. (the id readers
 * cite) and closes with "Report an error" → the Rules page's report form, pre-filled with that id, in
 * a new tab (so a duel between rounds, a P2P room or a file in progress is not left behind).
 * A screen that already offers its own report action beside the receipt passes `report={false}`.
 *
 * Bank text stays English in the Hindi locale (bible §2.3), so the slip's rows are lang="en" (WCAG
 * 3.1.2); the as-of date inside them carries the reader's lang, and the report link is in the page's.
 */
import type { ReactNode } from 'react';
import { ExternalLink, Flag } from 'lucide-react';
import { enactedLine, formatNumber, pollLine, sourceKind, type BankItem } from '../data';
import { href, queryString } from '../router';
import { GovtChip, LegalStatus, SourceChip } from './chip';
import { cx } from './cx';
import { useLang } from './lang';
import './receipt.css';

export type ReceiptProps = {
  /** The bank item (itemById / itemForCard). Without it, pass the fields below yourself. */
  item?: BankItem | null;
  /** Receipt number (e.g. the journal count); rendered as a hash sign and four digits. */
  receiptNo?: number | string;
  /** XP this answer paid; omit for a replay that paid nothing. */
  xp?: number;
  /** The XP breakdown in plain words: 'base 20 · fast +15 · combo ×1.25'. */
  xpNote?: string;
  /**
   * The other side's answer in one clause, when the screen has it separately from the explanation
   * (bank items carry it inside `explanation`; the noting sheet shows that).
   */
  otherSide?: ReactNode;
  /** Rows reveal top-down once (motion #4). Never on the live question surface. */
  printing?: boolean;
  /** Extra rows at the end: [label, value]. */
  extra?: ReadonlyArray<readonly [string, ReactNode]>;
  /** Heading for screen readers (default "Receipt"). */
  label?: string;
  /** "Report an error" at the foot (default: on whenever `item` is set). */
  report?: boolean;
  className?: string;
};

/** The Rules page's report form, pre-filled with a bank item's id (bible §11.17). */
export const reportErrorHref = (id: string) => `${href.rules()}${queryString({ s: 'report', id })}`;

/** The F.No. a reader cites for a bank item: 'F.No. HSC001'. */
export const itemFileNo = (id: string) => `F.No. ${id.toUpperCase()}`;

function Row({ k, children, inline }: { k: ReactNode; children: ReactNode; inline?: boolean }) {
  return (
    <div className={cx('h-receipt__row', inline && 'h-receipt__row--inline')}>
      <dt className="h-receipt__k">{k}</dt>
      <dd className="h-receipt__v">{children}</dd>
    </div>
  );
}

export const receiptNumber = (n: number | string) => (typeof n === 'number' ? `#${String(Math.max(0, Math.floor(n))).padStart(4, '0')}` : n);

export function Receipt({ item, receiptNo, xp, xpNote, otherSide, printing, extra, label = 'Receipt', report, className }: ReceiptProps) {
  const { t } = useLang();
  const poll = pollLine(item);
  const fno = item?.id ? itemFileNo(item.id) : null;
  const numbered = receiptNo !== undefined || xp !== undefined;
  const showReport = (report ?? true) && !!item?.id;
  return (
    <section className={cx('h-receipt', printing && 'h-receipt--printing', className)} aria-label={label}>
      <dl className="h-receipt__rows" lang="en">
        {numbered ? (
          <Row
            inline
            k={
              <>
                {receiptNo !== undefined ? `RECEIPT ${receiptNumber(receiptNo)}` : 'RECEIPT'}
                {fno ? <span className="h-receipt__fno">{fno}</span> : null}
              </>
            }
          >
            {xp !== undefined ? <span className="h-receipt__xp">{`${xp >= 0 ? '+' : '−'}${formatNumber(Math.abs(xp))} XP`}</span> : '—'}
          </Row>
        ) : fno ? (
          <Row inline k="F.No.">
            <span className="h-receipt__fnov">{item!.id.toUpperCase()}</span>
          </Row>
        ) : null}
        {xpNote ? (
          <div className="h-receipt__row h-receipt__row--note">
            <dt className="h-sr">XP breakdown</dt>
            <dd className="h-receipt__note">{xpNote}</dd>
          </div>
        ) : null}
        {item ? (
          <Row k="SOURCE">
            <span className="h-receipt__source">
              <SourceChip kind={sourceKind(item)} />
              <a className="h-receipt__link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                {item.sourceLabel}
                <ExternalLink aria-hidden="true" size={14} strokeWidth={2.4} />
                <span className="h-sr">(opens the source in a new tab)</span>
              </a>
            </span>
          </Row>
        ) : null}
        {item?.status ? (
          <Row k="STATUS">
            <LegalStatus status={item.status} asOf={item.asOf} />
          </Row>
        ) : null}
        {otherSide ? <Row k="OTHER SIDE">{otherSide}</Row> : null}
        {item ? (
          <Row inline k="GOVT THEN">
            <GovtChip govt={item.govt} bare />
          </Row>
        ) : null}
        {item?.enactedBy?.length ? (
          <Row k="ENACTED BY">
            <ul className="h-receipt__list">
              {item.enactedBy.map((e) => (
                <li key={`${e.name}|${e.role}`}>{enactedLine(e)}</li>
              ))}
            </ul>
          </Row>
        ) : null}
        {item?.outcome || poll ? (
          <Row k="RESULT">
            {item?.outcome ? <span className="h-receipt__text">{item.outcome}</span> : null}
            {poll ? <span className="h-receipt__poll">{poll}</span> : null}
          </Row>
        ) : null}
        {extra?.map(([k, v]) => (
          <Row key={k} k={k}>
            {v}
          </Row>
        ))}
      </dl>
      {showReport ? (
        <p className="h-receipt__foot">
          {/* A new tab: a duel between rounds, a P2P room or a file in progress stays where it was. */}
          <a className="h-receipt__report" href={reportErrorHref(item!.id)} target="_blank" rel="noopener">
            <Flag aria-hidden="true" size={16} strokeWidth={2.4} />
            <span>{t('Report an error', 'ग़लती बताओ')}</span>
            <span className="h-sr">
              {' '}
              <span lang="en">{fno}</span> {t('(opens in a new tab)', '(नए टैब में)')}
            </span>
          </a>
        </p>
      ) : null}
    </section>
  );
}
