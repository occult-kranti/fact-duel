/**
 * screens/ledger/filters.tsx — the one filter row above everything it scopes (the chart, the timeline,
 * the table and the before-the-vote view all read the same slice). Mode and level are toggle buttons;
 * state, party and era are menus; search is free text. Every option shows the count it would give under
 * the other filters, so a zero is visible before it is picked. Filters live in the URL (replace, so Back
 * leaves the screen rather than walking through every tap).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { MONEY_ERAS, MONEY_YEARS } from '../../../edition';
import { formatNumber } from '../../data';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import {
  activeFilters,
  LEDGER_LEVELS,
  LEDGER_MODES,
  partyOptions,
  Q_MAX,
  stateOptions,
  type Facets,
  type LedgerFilters,
  type LedgerRow,
} from './lib';
import { LEVEL_WORDS, MODE_META, placeName } from './meta';
import './ledger.css';

export type FiltersProps = {
  all: readonly LedgerRow[];
  filters: LedgerFilters;
  facets: Facets;
  onChange: (next: Partial<LedgerFilters>) => void;
  onClear: () => void;
};

const n = (x: number | undefined) => formatNumber(x ?? 0);

export function LedgerFilters({ all, filters, facets, onChange, onClear }: FiltersProps) {
  const { t, isHi } = useLang();
  const ids = useId();
  const active = activeFilters(filters).length;
  return (
    <section className="h-lfilter" aria-label={t('Filter the ledger', 'लेखा छाँटो')}>
      <fieldset className="h-lfilter__set">
        <legend className="h-lfilter__legend">{t('Mode', 'मोड')}</legend>
        <div className="h-lfilter__modes">
          <Toggle pressed={!filters.mode} onClick={() => onChange({ mode: null })} count={facets.all.mode}>
            {t('All modes', 'सभी मोड')}
          </Toggle>
          {LEDGER_MODES.map((m) => (
            <Toggle key={m} pressed={filters.mode === m} onClick={() => onChange({ mode: filters.mode === m ? null : m })} count={facets.mode.get(m)} icon={MODE_META[m].icon(18)}>
              <span lang={isHi ? 'hi' : undefined}>{isHi ? MODE_META[m].hi : MODE_META[m].title}</span>
            </Toggle>
          ))}
        </div>
      </fieldset>

      <fieldset className="h-lfilter__set">
        <legend className="h-lfilter__legend">{t('Level', 'स्तर')}</legend>
        <div className="h-lfilter__levels">
          <Toggle pressed={!filters.level} onClick={() => onChange({ level: null })} count={facets.all.level}>
            {t('Both', 'दोनों')}
          </Toggle>
          {LEDGER_LEVELS.map((l) => (
            <Toggle key={l} pressed={filters.level === l} onClick={() => onChange({ level: filters.level === l ? null : l })} count={facets.level.get(l)}>
              {isHi ? LEVEL_WORDS[l].hi : LEVEL_WORDS[l].en}
            </Toggle>
          ))}
        </div>
      </fieldset>

      <div className="h-lfilter__grid">
        <Menu
          id={`${ids}-state`}
          label={t('State', 'राज्य')}
          value={filters.state ?? ''}
          onChange={(v) => onChange({ state: v || null })}
          options={[
            { value: '', label: `${t('All states and the Centre', 'सभी राज्य और केंद्र')} (${n(facets.all.state)})` },
            ...stateOptions(all).map((c) => ({ value: c, label: `${placeName(c, isHi)} (${n(facets.state.get(c))})` })),
          ]}
        />
        <Menu
          id={`${ids}-party`}
          label={t('Party that governed', 'सरकार किसकी थी')}
          value={filters.party ?? ''}
          onChange={(v) => onChange({ party: v || null })}
          options={[
            { value: '', label: `${t('Every party', 'सभी दल')} (${n(facets.all.party)})` },
            ...partyOptions(all).map((p) => ({ value: p, label: `${p} (${n(facets.party.get(p))})` })),
          ]}
        />
        <Menu
          id={`${ids}-era`}
          label={t('Years', 'साल')}
          value={filters.era ?? ''}
          onChange={(v) => onChange({ era: v || null })}
          options={[
            { value: '', label: `${MONEY_YEARS.from}–${MONEY_YEARS.to} (${n(facets.all.era)})` },
            ...MONEY_ERAS.map((e) => ({ value: e.id, label: `${e.from}–${e.to} (${n(facets.era.get(e.id))})` })),
          ]}
        />
        <SearchBox id={`${ids}-q`} value={filters.q} onChange={(q) => onChange({ q })} />
      </div>
      <p className="h-lfilter__note">
        {t(
          'Party is who governed at that level when the measure came: NDA or UPA for the Centre. A label for finding rows, not a verdict.',
          'पार्टी = उस स्तर पर उस समय जिसकी सरकार थी (केंद्र के लिए NDA या UPA)। पंक्तियाँ ढूँढने का लेबल, फ़ैसला नहीं।',
        )}
      </p>
      {active ? (
        <div className="h-lfilter__clear">
          <Button variant="ghost" size="s" icon={<X size={18} strokeWidth={2.4} />} onClick={onClear}>
            {t(`Clear ${active === 1 ? 'the filter' : `all ${active} filters`}`, 'सभी फ़िल्टर हटाओ')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function Toggle({ pressed, onClick, count, icon, children }: { pressed: boolean; onClick: () => void; count?: number; icon?: ReactNode; children: ReactNode }) {
  const { t } = useLang();
  return (
    <button type="button" className={cx('h-lfilter__opt', !count && !pressed && 'h-lfilter__opt--zero')} aria-pressed={pressed} onClick={onClick}>
      {icon ? <span className="h-lfilter__icon">{icon}</span> : null}
      <span className="h-lfilter__optlabel">{children}</span>
      <span className="h-lfilter__count h-mono">
        {n(count)}
        <span className="h-sr">{t(' measures', ' उपाय')}</span>
      </span>
    </button>
  );
}

function Menu({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="h-lfilter__field">
      <label className="h-lfilter__label" htmlFor={id}>
        {label}
      </label>
      <span className="h-lfilter__select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="h-lfilter__chev" size={18} strokeWidth={2.4} aria-hidden="true" />
      </span>
    </div>
  );
}

/** Free text, debounced into the URL; the box follows the URL when filters are cleared elsewhere. */
function SearchBox({ id, value, onChange }: { id: string; value: string; onChange: (q: string) => void }) {
  const { t } = useLang();
  const [text, setText] = useState(value);
  const sent = useRef(value);
  useEffect(() => {
    if (value !== sent.current) {
      sent.current = value;
      setText(value);
    }
  }, [value]);
  useEffect(() => {
    const q = text.replace(/\s+/g, ' ').trim();
    if (q === sent.current) return;
    const timer = window.setTimeout(() => {
      sent.current = q;
      onChange(q);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [text, onChange]);
  return (
    <div className="h-lfilter__field h-lfilter__field--search">
      <label className="h-lfilter__label" htmlFor={id}>
        {t('Search', 'खोजो')}
      </label>
      <span className="h-lfilter__select h-lfilter__search">
        <Search className="h-lfilter__glass" size={18} strokeWidth={2.4} aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={text}
          maxLength={Q_MAX}
          placeholder={t('Scheme, person, state…', 'योजना, नाम, राज्य…')}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
      </span>
    </div>
  );
}
