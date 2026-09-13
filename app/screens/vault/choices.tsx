'use client';
/**
 * Shape-coded answer buttons for the untimed learning surfaces (Recall Lab, Discovery).
 *
 * The markup — glyph, 1–4 key hint, option text, result mark and the visually hidden
 * "Triangle, option 1" twin — comes from the shared `AnswerButton`, so this surface carries the
 * same four redundant channels the room does. Only the class names and the state vocabulary are
 * local: position + colour + shape encode each option (1 triangle/ember, 2 diamond/cyan,
 * 3 circle/gold, 4 square/magenta) so meaning never rests on hue alone. After a choice the correct
 * option gains a volt outline and a check; a wrong pick gains a cross and desaturates. Press
 * feedback fires on pointerdown so it never delays the click.
 */
import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { AnswerButton } from '../answer-button';
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
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* The buttons advertise 1–4, so the keys answer here too. The key forwards to the button's own
   * click, which keeps every guard and every cue on one path. */
  const keyable = !locked && !disabled;
  useEffect(() => {
    if (!keyable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
      const i = Number(e.key) - 1;
      if (!Number.isInteger(i) || i < 0 || i >= optionRefs.current.length) return;
      const button = optionRefs.current[i];
      if (!button || button.disabled) return;
      e.preventDefault();
      button.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyable]);

  return (
    <div className="fd-choices" data-animate={animate ? 'on' : 'off'} role="group">
      {options.map((option, i) => {
        const state = !locked ? 'idle' : i === correctIndex ? 'correct' : i === chosen ? 'wrong' : 'muted';
        return (
          <AnswerButton
            key={`${option}-${i}`}
            buttonRef={(el) => {
              optionRefs.current[i] = el;
            }}
            index={i}
            label={option}
            className="fd-choice"
            textClassName="fd-choice__text"
            markClassName="fd-choice__shape"
            glyph={<Glyph index={i} />}
            hint
            style={{ '--i': i } as React.CSSProperties}
            state={state}
            chosen={chosen === i}
            disabled={locked || disabled}
            onPointerDown={press}
            onClick={(e) => onChoose(i, e.currentTarget)}
            end={
              <span className="fd-choice__mark" aria-hidden="true">
                {state === 'correct' && <Check />}
                {state === 'wrong' && <X />}
              </span>
            }
          />
        );
      })}
    </div>
  );
}
