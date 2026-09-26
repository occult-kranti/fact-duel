/**
 * ui/chip.tsx — `h-chip` (bible §5): 28px, mono 12px caps. Every legal status uses the ONE neutral
 * legal pair, whatever it says (never red for "alleged", never green for "acquitted").
 *
 *   <Chip kind="source">CAG</Chip>   <SourceChip kind={sourceKind(item)} />
 *   <GovtChip govt="NDA" />          → "Govt then: NDA" (neutral, never a party colour)
 *   <LegalStatus status={item.status} asOf={item.asOf} />   the status line VERBATIM + "as of Sep 2026"
 */
import type { ReactNode } from 'react';
import { Scale } from 'lucide-react';
import { asOfText, govtText, SOURCE_KIND_TEXT, type SourceKind } from '../data';
import { cx } from './cx';
import { useLang } from './lang';
import './chip.css';

export type ChipKind = 'legal' | 'source' | 'govt' | 'kind' | 'plain';

/**
 * `lang`: the chip's language when it differs from the page's. A Latin code chip (COURT, NDA) passes
 * 'en' so it keeps the mono face and its tracking in the Hindi locale; a Hindi chip reads in the UI
 * face (base.css: no Devanagari in mono, bible §4.4).
 */
export function Chip({ kind = 'plain', icon, children, title, lang, className }: { kind?: ChipKind; icon?: ReactNode; children: ReactNode; title?: string; lang?: string; className?: string }) {
  return (
    <span className={cx('h-chip', `h-chip--${kind}`, className)} title={title} lang={lang}>
      {icon ? (
        <span className="h-chip__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="h-chip__text">{children}</span>
    </span>
  );
}

/** The source-type chip on a receipt (COURT, CAG, SANSAD, PIB, ECI, RBI, AGENCY, … PRESS). */
export function SourceChip({ kind }: { kind: SourceKind }) {
  return (
    <Chip kind="source" title={SOURCE_KIND_TEXT[kind]} lang="en">
      <span aria-hidden="true">{kind}</span>
      <span className="h-sr">Source type: {SOURCE_KIND_TEXT[kind]}</span>
    </Chip>
  );
}

/**
 * "Govt then: NDA" — who governed at that level then. Neutral for every party. `bare` prints only
 * "NDA" (the receipt's GOVT THEN row already says the rest; screen readers still hear it).
 */
export function GovtChip({ govt, bare }: { govt: string; bare?: boolean }) {
  if (!bare)
    return (
      <Chip kind="govt" lang="en">
        {govtText(govt)}
      </Chip>
    );
  return (
    <Chip kind="govt" lang="en">
      <span className="h-sr">Govt then: </span>
      {govt}
    </Chip>
  );
}

export type LegalStatusProps = {
  /** The item's `status`, rendered verbatim. */
  status: string;
  /** The item's `asOf` (YYYY-MM). */
  asOf: string;
  className?: string;
};

/**
 * The legal status block: neutral legal chip + the status line exactly as written + its as-of date.
 * Long lines wrap (statuses run to ~240 characters); nothing is truncated.
 */
export function LegalStatus({ status, asOf, className }: LegalStatusProps) {
  const { locale, isHi } = useLang();
  return (
    <div className={cx('h-legal', className)}>
      <p className="h-legal__head">
        <Chip kind="legal" icon={<Scale size={14} strokeWidth={2.4} />} lang="en">
          Legal status
        </Chip>
        <span className="h-legal__asof" lang={isHi ? 'hi' : 'en'}>
          {asOfText(asOf, locale)}
        </span>
      </p>
      <p className="h-legal__line" lang="en">
        {status}
      </p>
    </div>
  );
}
