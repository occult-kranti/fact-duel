/**
 * ui/confidence-switch.tsx — the three-position confidence call (bible §2.1, §11.7):
 * Shayad (steady +2/0) · Lagta hai (bold +3/−1) · Pakka (called +4/−3), points always visible.
 *
 *   const [call, setCall] = useState<ConfidenceId>('steady');
 *   <ConfidenceSwitch value={call} onChange={setCall} disabled={locked} />
 *
 * Values are the engine's ids (lib/expeditions.mjs CONFIDENCE); only the names are the edition's.
 * A "confidence call", never a bet. Native radios: arrow keys work, the group has a legend.
 */
import { useId } from 'react';
import { CONFIDENCE_DISPLAY, type ConfidenceId } from '../data';
import { cx } from './cx';
import { useLang } from './lang';
import './confidence-switch.css';

export type { ConfidenceId };

export type ConfidenceSwitchProps = {
  value: ConfidenceId;
  onChange: (next: ConfidenceId) => void;
  disabled?: boolean;
  /** Legend text (default "How sure?" / "कितना पक्का?"). */
  legend?: string;
  className?: string;
};

export function ConfidenceSwitch({ value, onChange, disabled, legend, className }: ConfidenceSwitchProps) {
  const name = useId();
  const { t, isHi } = useLang();
  return (
    <fieldset className={cx('h-conf', className)} disabled={disabled}>
      <legend className="h-conf__legend">{legend ?? t('How sure?', 'कितना पक्का?')}</legend>
      <div className="h-conf__track">
        {CONFIDENCE_DISPLAY.map((c) => (
          <label key={c.id} className={cx('h-conf__opt', value === c.id && 'h-conf__opt--on')}>
            <input
              type="radio"
              className="h-conf__input"
              name={name}
              value={c.id}
              checked={value === c.id}
              onChange={() => onChange(c.id)}
            />
            <span className="h-conf__name" lang={isHi ? 'hi' : undefined}>
              {isHi ? c.hi : c.en}
            </span>
            <span className="h-conf__pts">
              <span aria-hidden="true">{c.points}</span>
              <span className="h-sr" lang={isHi ? 'hi' : undefined}>
                {isHi
                  ? `, सही होने पर ${c.correct} अंक, ग़लत होने पर ${c.wrong === 0 ? 'कुछ नहीं कटेगा' : `${Math.abs(c.wrong)} कटेंगे`}`
                  : `, ${c.correct} points if right, ${c.wrong === 0 ? 'nothing lost' : `${Math.abs(c.wrong)} lost`} if wrong`}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
