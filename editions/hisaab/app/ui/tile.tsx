/**
 * ui/tile.tsx — `h-tile`, one drawer of the records-room cartogram (bible §5, §11.3).
 *
 *   <Tile code="UP" name="Uttar Pradesh" state="progress" progress={{ done: 3, total: 6 }}
 *     selected={sel === 'UP'} onSelect={setSel} />
 *
 * Square, ≥ 44px. States carry a glyph, not just a fill: sealed (tape on the bottom edge), progress
 * (bar + fraction), cleared (syahi fill + ✓). The screen must offer a list view with the same data.
 * Layout constants for the 7 × 7 grid: data.ts CARTOGRAM / CARTOGRAM_CENTRE.
 */
import { Check } from 'lucide-react';
import { cx } from './cx';
import { useLang, type Locale } from './lang';
import './tile.css';

export type TileState = 'sealed' | 'progress' | 'cleared';

export type TileProps = {
  code: string;
  /** Full name (accessible name, and shown under the code when `showName`). */
  name: string;
  /** The Devanagari name, for the accessible name in the Hindi locale (the printed name stays `name`). */
  nameHi?: string;
  state: TileState;
  progress?: { done: number; total: number };
  selected?: boolean;
  onSelect?: (code: string) => void;
  /** Show the name under the code (desktop 72px tiles). */
  showName?: boolean;
  /** A wide drawer (the Centre spans 4 columns). */
  wide?: boolean;
  /**
   * Roving focus inside a grid that walks by arrow keys: pass 0 for the one tile in the Tab order
   * (the selected drawer) and -1 for the rest. Omitted, the tile is an ordinary button.
   */
  tabIndex?: 0 | -1;
  className?: string;
};

/**
 * The tile's accessible name. It starts with the visible code (WCAG 2.5.3 label in name: the tile shows
 * 'UP', so the name is 'UP, Uttar Pradesh, sealed'), and speaks Hindi in the Hindi locale.
 */
export function tileLabel(
  name: string,
  state: TileState,
  progress?: { done: number; total: number },
  code?: string,
  locale: Locale = 'en',
) {
  const who = code && code !== name ? `${code}, ${name}` : name;
  if (locale === 'hi') {
    if (state === 'cleared') return `${who}, फ़ाइल क्लियर`;
    if (state === 'progress' && progress) return `${who}, ${progress.total} में से ${progress.done} जवाब`;
    return `${who}, सीलबंद`;
  }
  if (state === 'cleared') return `${who}, file cleared`;
  if (state === 'progress' && progress) return `${who}, ${progress.done} of ${progress.total} answered`;
  return `${who}, sealed`;
}

export function Tile({ code, name, nameHi, state, progress, selected, onSelect, showName, wide, tabIndex, className }: TileProps) {
  const { locale } = useLang();
  const pct = progress && progress.total > 0 ? Math.min(100, (progress.done / progress.total) * 100) : 0;
  return (
    <button
      type="button"
      className={cx('h-tile', `h-tile--${state}`, wide && 'h-tile--wide', className)}
      aria-pressed={!!selected}
      aria-label={tileLabel(locale === 'hi' && nameHi ? nameHi : name, state, progress, code, locale)}
      tabIndex={tabIndex}
      onClick={onSelect ? () => onSelect(code) : undefined}
    >
      <span className="h-tile__code" aria-hidden="true">
        {code}
      </span>
      {showName ? (
        <span className="h-tile__name" aria-hidden="true">
          {name}
        </span>
      ) : null}
      {state === 'cleared' ? <Check className="h-tile__glyph" aria-hidden="true" size={14} strokeWidth={3.2} /> : null}
      {state === 'progress' && progress ? (
        <>
          <span className="h-tile__frac" aria-hidden="true">
            {progress.done}/{progress.total}
          </span>
          <span className="h-tile__bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
        </>
      ) : null}
      {state === 'sealed' ? <span className="h-tile__tape" aria-hidden="true" /> : null}
    </button>
  );
}
