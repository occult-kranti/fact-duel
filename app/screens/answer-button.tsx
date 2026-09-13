'use client';
/**
 * The one answer button, shared by every surface that asks a multiple-choice question: the live
 * room (`app/screens/room/question-stage.tsx`), an expedition card (`expeditions/run.tsx`) and the
 * untimed learning surfaces (`screens/vault/choices.tsx`, used by Discovery and the Recall Lab).
 *
 * Four redundant channels per option, exactly as the design bible asks — and now on all three
 * surfaces, not just the room:
 *   1. position (option order never changes inside a question),
 *   2. shape    (1 triangle, 2 diamond, 3 circle, 4 square — inline SVG, survives any palette),
 *   3. colour   (ember / cyan / gold / magenta, and never load-bearing on its own),
 *   4. text     (a visually hidden "Triangle, option 1" twin for screen readers) + a 1–4 key hint.
 *
 * The component owns markup only. Each surface keeps its own class names, its own state vocabulary
 * and its own press feedback, so no CSS moves and the room's DOM is byte-for-byte what it was:
 * same order, same attributes, no entrance animation, and nothing that defers the click.
 */
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

export const OPTION_SHAPES = ['triangle', 'diamond', 'circle', 'square'] as const;
export const OPTION_ACCENTS = ['ember', 'cyan', 'gold', 'magenta'] as const;
export const OPTION_SHAPE_NAMES = ['Triangle', 'Diamond', 'Circle', 'Square'] as const;

/** Inline glyph for answer option `index` (0–3). Decorative: the option text carries the meaning. */
export function AnswerGlyph({
  index,
  size = 20,
  className = 'fd-glyph',
}: {
  index: number;
  size?: number;
  className?: string;
}) {
  const i = ((index % 4) + 4) % 4;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {i === 0 && <path d="M12 3.2 22 20.4H2Z" />}
      {i === 1 && <path d="M12 2.2 21.8 12 12 21.8 2.2 12Z" />}
      {i === 2 && <circle cx="12" cy="12" r="9.2" />}
      {i === 3 && <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3" />}
    </svg>
  );
}

/** The screen-reader twin for the shape + position coding. */
export function AnswerShapeName({ index }: { index: number }) {
  return (
    <span className="fd-sr">
      {OPTION_SHAPE_NAMES[((index % 4) + 4) % 4]}, option {index + 1}
    </span>
  );
}

export type AnswerButtonProps = {
  /** 0-based option index: drives the shape, the colour hook and the key hint. */
  index: number;
  /** The option text. */
  label: string;
  /** Surface-specific state word, published as `data-state` (e.g. live / correct / wrong / muted). */
  state?: string;
  /** True when this is the option the player locked. */
  chosen?: boolean;
  disabled?: boolean;
  /** Root class names — each surface keeps its own (`fd-answer`, `fd-exp-answer o3`, `fd-choice`). */
  className: string;
  /** Wrapper for the glyph. Omit to render the glyph as a direct child. */
  markClassName?: string;
  textClassName: string;
  /** Override the glyph (a surface with its own shape sheet passes its own SVG). */
  glyph?: ReactNode;
  /** Trailing slot: the lock / check / cross marks. */
  end?: ReactNode;
  /** Show the `1`–`4` key hint. Only pass it where the key actually answers. */
  hint?: boolean;
  style?: CSSProperties;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function AnswerButton({
  index,
  label,
  state,
  chosen,
  disabled,
  className,
  markClassName,
  textClassName,
  glyph,
  end,
  hint,
  style,
  buttonRef,
  onPointerDown,
  onClick,
}: AnswerButtonProps) {
  const mark = glyph ?? <AnswerGlyph index={index} />;
  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      data-opt={index}
      data-state={state}
      data-chosen={chosen === undefined ? undefined : chosen ? 'true' : 'false'}
      aria-pressed={chosen}
      disabled={disabled}
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {markClassName ? (
        <span className={markClassName} aria-hidden="true">
          {mark}
        </span>
      ) : (
        mark
      )}
      {hint && <kbd aria-hidden="true">{index + 1}</kbd>}
      <span className={textClassName}>{label}</span>
      {end}
      <AnswerShapeName index={index} />
    </button>
  );
}
