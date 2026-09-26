/**
 * screens/receipts/filters.tsx — the Vault's filters (design bible §11.15): search, status chips that
 * are always visible (All · Due for re-check · Legal status · Missed · Updated), and four selects
 * (sector, state, where you played it / which file, source type) in a panel that folds away on phones.
 * Options list only values the player actually holds, with their counts. Everything lives in the URL
 * (replace, so Back leaves the Vault instead of walking through filters).
 */
import { useId } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SECTOR_LIST, SOURCE_KIND_TEXT, SOURCE_KINDS, stateName, STATE_CODES } from '../../data';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { activeFilterCount, applyFilters, EMPTY_FILTERS, facet, MODE_FILTERS, STATUS_FILTERS, type Filters, type ModeFilter, type ReceiptRow, type StatusFilter } from './lib';

export type FiltersProps = {
  rows: readonly ReceiptRow[];
  value: Filters;
  onChange: (next: Filters) => void;
  /** Start the select panel open (desktop). */
  open: boolean;
  shown: number;
};

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="h-vfilter">
      <label className="h-vfilter__label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="h-vfilter__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

export function VaultFilters({ rows, value, onChange, open, shown }: FiltersProps) {
  const { t } = useLang();
  const searchId = useId();
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const sectors = facet(rows, (r) => r.topic);
  const states = facet(rows, (r) => r.state);
  const sources = facet(rows, (r) => r.sourceKind);
  // Counts come from the same predicate the list uses, so a chip never promises what the list won't show.
  const statusCount = (status: StatusFilter) => applyFilters(rows, { ...EMPTY_FILTERS, status }).length;
  const modeCount = (mode: ModeFilter) => applyFilters(rows, { ...EMPTY_FILTERS, mode }).length;
  const active = activeFilterCount(value);
  const chips: Array<{ id: StatusFilter | ''; en: string; hi: string; n: number }> = [
    { id: '', en: 'All', hi: 'सब', n: rows.length },
    ...STATUS_FILTERS.map((s) => ({ ...s, n: statusCount(s.id) })).filter((s) => s.n > 0 || s.id === 'due' || s.id === value.status),
  ];

  return (
    <div className="h-vfilters">
      <div className="h-vsearch">
        <label htmlFor={searchId} className="h-sr">
          {t('Search your receipts', 'अपनी रसीदें खोजो')}
        </label>
        <Search size={18} strokeWidth={2.4} aria-hidden="true" className="h-vsearch__icon" />
        <input
          id={searchId}
          className="h-vsearch__input"
          type="search"
          inputMode="search"
          value={value.q}
          placeholder={t('Search: scheme, case, state, id…', 'खोजो: योजना, मामला, राज्य…')}
          onChange={(e) => set({ q: e.target.value })}
        />
      </div>

      <div className="h-vchips" role="group" aria-label={t('Show', 'दिखाओ')}>
        {chips.map((c) => (
          <button
            key={c.id || 'all'}
            type="button"
            className={cx('h-vchip', c.id === 'due' && 'h-vchip--due')}
            aria-pressed={value.status === c.id}
            onClick={() => set({ status: c.id })}
          >
            {t(c.en, c.hi)} <span className="h-mono h-vchip__n">{c.n}</span>
          </button>
        ))}
      </div>

      <details className="h-vmore" open={open || active > 0 || undefined}>
        <summary className="h-vmore__sum">
          <SlidersHorizontal size={18} strokeWidth={2.4} aria-hidden="true" />
          {t('Filter by sector, state, file or source', 'सेक्टर, राज्य, फ़ाइल या स्रोत से छाँटो')}
          {active ? <span className="h-vmore__n">{active}</span> : null}
        </summary>
        <div className="h-vmore__body">
          <Select label={t('Sector', 'सेक्टर')} value={value.sector} onChange={(v) => set({ sector: v })}>
            <option value="">{t('Every sector', 'हर सेक्टर')}</option>
            {SECTOR_LIST.filter((s) => sectors.some((f) => f.value === s) || s === value.sector).map((s) => (
              <option key={s} value={s}>
                {s} ({sectors.find((f) => f.value === s)?.count ?? 0})
              </option>
            ))}
          </Select>
          <Select label={t('State', 'राज्य')} value={value.state} onChange={(v) => set({ state: v })}>
            <option value="">{t('Centre and every state', 'केंद्र और हर राज्य')}</option>
            {['IN', ...[...STATE_CODES].sort((a, b) => stateName(a).localeCompare(stateName(b)))]
              .filter((c) => states.some((f) => f.value === c) || c === value.state)
              .map((c) => (
                <option key={c} value={c}>
                  {stateName(c)} ({states.find((f) => f.value === c)?.count ?? 0})
                </option>
              ))}
          </Select>
          <Select label={t('Where you played it', 'कहाँ खेला')} value={value.mode} onChange={(v) => set({ mode: v as ModeFilter | '' })}>
            <option value="">{t('Anywhere', 'कहीं भी')}</option>
            <optgroup label={t('Played in', 'खेला')}>
              {MODE_FILTERS.filter((m) => m.group === 'played').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.en} ({modeCount(m.id)})
                </option>
              ))}
            </optgroup>
            <optgroup label={t('Belongs to', 'फ़ाइल')}>
              {MODE_FILTERS.filter((m) => m.group === 'file').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.en} ({modeCount(m.id)})
                </option>
              ))}
            </optgroup>
          </Select>
          <Select label={t('Source type', 'स्रोत का प्रकार')} value={value.src} onChange={(v) => set({ src: v as Filters['src'] })}>
            <option value="">{t('Every source type', 'हर स्रोत')}</option>
            {SOURCE_KINDS.filter((k) => sources.some((f) => f.value === k) || k === value.src).map((k) => (
              <option key={k} value={k}>
                {k} — {SOURCE_KIND_TEXT[k]} ({sources.find((f) => f.value === k)?.count ?? 0})
              </option>
            ))}
          </Select>
        </div>
      </details>

      <div className="h-vcount">
        <p className="h-vcount__text" role="status">
          {t(`${shown} of ${rows.length} ${rows.length === 1 ? 'receipt' : 'receipts'}`, `${rows.length} में से ${shown} ${shown === 1 ? 'रसीद' : 'रसीदें'}`)}
        </p>
        {active || value.status || value.q ? (
          <Button variant="ghost" size="s" icon={<X size={18} strokeWidth={2.4} />} trailing={null} onClick={() => onChange({ q: '', sector: '', state: '', mode: '', status: '', src: '' })}>
            {t('Clear filters', 'फ़िल्टर हटाओ')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
