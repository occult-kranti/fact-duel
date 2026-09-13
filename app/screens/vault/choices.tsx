'use client';
/**
 * Shape-coded answer buttons for the untimed learning surfaces (Recall Lab, Discovery).
 *
 * Position + colour + shape encode each option (1 triangle/ember, 2 diamond/cyan, 3 circle/gold,
 * 4 square/magenta) so meaning never rests on hue alone. After a choice the correct option gains a
 * volt outline and a check; a wrong pick gains a cross and desaturates. Press feedback fires on
 * pointerdown so it never delays the click.
 */
import { Check, X } from 'lucide-react';
import { usePress } from './press';

const SHAPES = [
  <polygon key="t" points="12,3 22,20 2,20" />,
  <polygon key="d" points="12,2 22,12 12,22 2,12" />,
  <circle key="c" cx="12" cy="12" r="9.5" />,
  <rect key="s" x="3" y="3" width="18" height="18" rx="3" />,
];

function Glyph({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {SHAPES[index % SHAPES.length]}
    </svg>
  );
}

export type ChoicesProps = {
  options: string[];
  correctIndex: number;
  /** Index the player locked, or null while the card is still open. */
  chosen: number | null;
  disabled?: boolean;
  /** Stagger the options in (off for reduced motion via CSS). */
  animate?: boolean;
  onChoose: (index: number, element: HTMLButtonElement) => void;
};

export function Choices({ options, correctIndex, chosen, disabled, animate, onChoose }: ChoicesProps) {
  const press = usePress();
  const locked = chosen !== null;
  return (
    <div className="fd-choices" data-animate={animate ? 'on' : 'off'} role="group">
      {options.map((option, i) => {
        const state = !locked ? 'idle' : i === correctIndex ? 'correct' : i === chosen ? 'wrong' : 'muted';
        return (
          <button
            key={`${option}-${i}`}
            type="button"
            className="fd-choice"
            style={{ '--i': i } as React.CSSProperties}
            data-state={state}
            aria-pressed={chosen === i}
            disabled={locked || disabled}
            onPointerDown={press}
            onClick={(e) => onChoose(i, e.currentTarget)}
          >
            <span className="fd-choice__shape">
              <Glyph index={i} />
            </span>
            <span className="fd-choice__text">{option}</span>
            <span className="fd-choice__mark" aria-hidden="true">
              {state === 'correct' && <Check />}
              {state === 'wrong' && <X />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
