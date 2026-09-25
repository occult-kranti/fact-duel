/**
 * screens/files/register.tsx — a register (रजिस्टर) of bank entries that fills as the player collects
 * receipts: Kiska Media?'s "who owns what", Forward Court's rulings, and each money-trail khaata.
 *
 * Why sealed entries: an entry's body is the card's answer (the owner, the ruling, who passed the
 * scheme). Printing it on a hub would answer the file's questions before they are asked. An entry opens
 * once its card is in the player's journal — by playing the file, the daily, a duel, or the one-card
 * taster a sealed entry links to. Nothing is invented: every open entry prints bank text verbatim,
 * with the legal status and its as-of date where the item has one.
 */
import { useId, type ReactNode } from 'react';
import { ChevronDown, ExternalLink, Lock } from 'lucide-react';
import { asOfText, sourceKind, type BankItem } from '../../data';
import { href, Link } from '../../router';
import { LegalStatus, SourceChip } from '../../ui/chip';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { Meter } from '../../ui/meter';
import './register.css';

export type RegisterEntry = {
  item: BankItem;
  /** Mono line above the title: 'IN · 2022'. Latin only. */
  kicker: string;
  /** The entry's name: an outlet, a scheme, a claim. Safe to show sealed (it never holds the answer). */
  title: string;
  /** What an open entry shows between the title and the receipt rows. */
  body?: ReactNode;
};

export type RegisterProps = {
  title: string;
  titleHi?: string;
  /** One line under the title: how entries open. */
  lead: ReactNode;
  entries: readonly RegisterEntry[];
  /** Fact ids the player holds (journal). */
  held: ReadonlySet<string>;
  /** Sealed entries as links to their one-card taster ('links'), or one counted line ('count'). */
  sealedAs?: 'links' | 'count';
  /** Line when nothing is open yet. */
  emptyLine: ReactNode;
  className?: string;
};

export function Register({ title, titleHi, lead, entries, held, sealedAs = 'links', emptyLine, className }: RegisterProps) {
  const { t } = useLang();
  const headId = useId();
  const open = entries.filter((e) => held.has(e.item.id));
  const sealed = entries.filter((e) => !held.has(e.item.id));
  return (
    <section className={cx('h-reg', className)} aria-labelledby={headId}>
      <header className="h-reg__head">
        <h2 className="h-reg__title" id={headId}>
          {titleHi ? (
            <span className="h-reg__titlehi" lang="hi">
              {titleHi}
            </span>
          ) : null}
          <span className="h-reg__titleen">{title}</span>
        </h2>
        <p className="h-reg__count h-mono">
          {open.length}/{entries.length} {t('open', 'खुले')}
        </p>
      </header>
      <p className="h-reg__lead">{lead}</p>
      <Meter
        value={open.length}
        max={Math.max(1, entries.length)}
        label={t(`${title}: entries open`, `${title}: खुली प्रविष्टियाँ`)}
        valueText={`${open.length} of ${entries.length} open`}
      />
      {open.length ? (
        <ul className="h-reg__list">
          {open.map((e) => (
            <li key={e.item.id}>
              <OpenEntry entry={e} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="h-reg__empty">{emptyLine}</p>
      )}
      {sealed.length ? (
        sealedAs === 'links' ? (
          <div className="h-reg__sealed">
            <p className="h-reg__sealedhead">
              <Lock size={16} strokeWidth={2.4} aria-hidden="true" /> {t(`Sealed · ${sealed.length}`, `सील · ${sealed.length}`)}
              <span className="h-reg__sealednote">{t('Answer the card to open its entry.', 'कार्ड का जवाब दो, प्रविष्टि खुलेगी।')}</span>
            </p>
            <ul className="h-reg__seals">
              {sealed.map((e) => (
                <li key={e.item.id}>
                  <Link to={href.taster(e.item.id)} className="h-reg__seal" aria-label={`${e.title}, sealed. Answer this card to open the entry.`}>
                    <span className="h-reg__sealk" aria-hidden="true">
                      {e.kicker}
                    </span>
                    <span className="h-reg__sealt" aria-hidden="true">
                      {e.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="h-reg__sealedhead">
            <Lock size={16} strokeWidth={2.4} aria-hidden="true" />{' '}
            {t(
              `${sealed.length} ${sealed.length === 1 ? 'entry' : 'entries'} sealed. Every card you answer here opens its entry.`,
              `${sealed.length} प्रविष्टियाँ सील। हर जवाब एक प्रविष्टि खोलता है।`,
            )}
          </p>
        )
      ) : null}
    </section>
  );
}

function OpenEntry({ entry }: { entry: RegisterEntry }) {
  const { t, locale } = useLang();
  const { item } = entry;
  const status = item.status ?? null;
  return (
    <details className="h-reg__row">
      <summary className="h-reg__summary">
        <span className="h-reg__rowk h-mono">{entry.kicker}</span>
        <span className="h-reg__rowt">{entry.title}</span>
        <ChevronDown className="h-reg__chev" size={20} strokeWidth={2.4} aria-hidden="true" />
      </summary>
      <div className="h-reg__body">
        {entry.body}
        {status ? (
          <LegalStatus status={status} asOf={item.asOf} />
        ) : (
          <p className="h-reg__asof h-mono">{asOfText(item.asOf, locale)}</p>
        )}
        <p className="h-reg__source">
          <SourceChip kind={sourceKind(item)} />
          <a className="h-link h-reg__srclink" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
            {item.sourceLabel}
            <ExternalLink size={14} strokeWidth={2.4} aria-hidden="true" />
            <span className="h-sr">{t(' (opens the source in a new tab)', ' (स्रोत नए टैब में खुलेगा)')}</span>
          </a>
        </p>
      </div>
    </details>
  );
}
