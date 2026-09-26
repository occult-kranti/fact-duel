/**
 * ui/certificate.tsx — `h-cert`, the Certificate of Labelling frame (bible §11.14). Always the LIGHT
 * theme (it is an export), 4:5 (1080 × 1350 when exported), scaling with its container.
 *
 *   <Certificate name={player.name} receipts={214} band={4} issuedOn={Date.now()} />
 *
 * The name passes through data.ts `certificateName`: empty or matching anyone in the bank's `people` /
 * `enactedBy` → "Anonymous Janta", so nobody can certify a real politician. The footer always says
 * "Satire. Not a government document." — no emblem, seal or letterhead imitation.
 */
import { useEffect, useState } from 'react';
import { certificateName, formatNumber, labelDisplay, LADDER_DISPLAY } from '../data';
import { loadHandFont } from './fonts';
import { Stamp } from './stamp';
import { cx } from './cx';
import './certificate.css';

export const CERT_FOOTER = 'Satire. Not a government document. Every question sourced.';
export const CERT_SITE = 'occult-kranti.github.io/fact-duel/hisaab';

export type CertificateProps = {
  /** The player's name as typed; the frame applies the certificate name rule itself. */
  name: string | null | undefined;
  /** Sourced receipts collected (the real journal count). */
  receipts: number;
  /** The band being certified (0–8). */
  band: number;
  /** Issue date (the promotion date, or today). */
  issuedOn: Date | number;
  /** File number; default `L-<band>/<year>-<receipts>`. */
  fno?: string;
  /** DOM id, for the share lane's PNG capture. */
  id?: string;
  className?: string;
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const certificateDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** Labels longer than this (in Latin characters) print one size down. */
const LONG_LABEL = 18;

export function Certificate({ name, receipts, band, issuedOn, fno, id, className }: CertificateProps) {
  const label = labelDisplay(band);
  const date = new Date(issuedOn);
  const shownName = certificateName(name);
  const number = fno ?? `L-${label.band}/${date.getFullYear()}-${String(Math.max(0, receipts)).padStart(4, '0')}`;
  const [hand, setHand] = useState(false);
  useEffect(() => {
    let live = true;
    void loadHandFont().then(() => live && setHand(true));
    return () => {
      live = false;
    };
  }, []);
  return (
    <div data-theme="light" className={cx('h-certwrap', className)}>
      <article className="h-cert" id={id} aria-label={`Certificate of labelling: ${shownName}, ${label.en}`}>
        <header className="h-cert__head">
          <span>CERTIFICATE OF LABELLING</span>
          <span>F.No. {number}</span>
        </header>
        <p className="h-cert__certify">
          This is to certify that <strong className="h-cert__name">{shownName}</strong> has, after{' '}
          <strong>{formatNumber(receipts)} sourced receipts</strong>, been officially labelled
        </p>
        {/* Long rungs ('WhatsApp University Fresher') step down a size so the 4:5 frame keeps its room. */}
        <h2 className={cx('h-cert__label', label.en.length > LONG_LABEL && 'h-cert__label--long')}>
          <span className="h-cert__labelhi" lang="hi">
            {label.hi}
          </span>
          <span className="h-cert__labelen">
            {label.en}
            {label.aside ? <small> {label.aside}</small> : null}
          </span>
        </h2>
        <p className="h-cert__line">{label.line}</p>
        <div className="h-cert__stamprow">
          <Stamp kind="noted" seed={`cert-${label.band}`} text={`ISSUED · ${certificateDate(date)}`} size="l" className="h-cert__stamp" />
          <p className={cx('h-cert__hand', hand && 'h-cert__hand--ready')}>Noted. Pl. forward.</p>
        </div>
        <p className="h-cert__rungs" aria-label={`Rung ${label.band + 1} of ${LADDER_DISPLAY.length}`}>
          {LADDER_DISPLAY.map((r) => (
            <span key={r.band} className={cx('h-cert__dot', r.band <= label.band && 'h-cert__dot--on')} aria-hidden="true" />
          ))}
          <span className="h-cert__rungtext" aria-hidden="true">
            {label.band + 1} of {LADDER_DISPLAY.length}
          </span>
        </p>
        <footer className="h-cert__foot">
          <span>{CERT_FOOTER}</span>
          <span>{CERT_SITE}</span>
        </footer>
      </article>
    </div>
  );
}
