/**
 * ui/option.tsx — `h-opt`, the answer button (bible §5): letter + shape + tint, colour-blind safe.
 *
 *   <OptionList options={q.options} chosen={locked} correctIndex={revealed ? q.correctIndex : null}
 *     onChoose={(i) => controller.answer(i)} disabled={!!locked} keys />
 *
 * Or one at a time: <Option index={0} label="…" state="idle" onChoose={…} />.
 *
 * Slot 1 A/क ▲ triangle · 2 B/ख ◆ diamond · 3 C/ग ● circle · 4 D/घ ■ square. Fixed order — never
 * reshuffle what the engine dealt. Accessible name: "Option A, triangle: <label>".
 * LIVE-SURFACE SAFE: no mount animation, no correctness styling until you pass `correctIndex`
 * (only after `round.result`); press feedback and the lock state are the only motion.
 */
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Check, Lock, X } from 'lucide-react';
import { cx } from './cx';
import { useLang } from './lang';
import './option.css';

export type OptionState = 'idle' | 'locked' | 'correct' | 'wrong-chosen' | 'correct-unchosen' | 'other';
export type OptionIndex = 0 | 1 | 2 | 3;

export const OPTION_SLOTS = Object.freeze([
  { slot: 'a', letter: 'A', letterHi: 'क', shape: 'triangle' },
  { slot: 'b', letter: 'B', letterHi: 'ख', shape: 'diamond' },
  { slot: 'c', letter: 'C', letterHi: 'ग', shape: 'circle' },
  { slot: 'd', letter: 'D', letterHi: 'घ', shape: 'square' },
] as const);

/** The SVG shape twin for a slot (16px, currentColor). */
export function OptionShape({ index, size = 16 }: { index: number; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16', 'aria-hidden': true as const, focusable: 'false' as const };
  switch (index) {
    case 0:
      return (
        <svg {...common}>
          <path d="M8 1.5 15 14.5H1z" fill="currentColor" />
        </svg>
      );
    case 1:
      return (
        <svg {...common}>
          <path d="M8 .8 15.2 8 8 15.2.8 8z" fill="currentColor" />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="1.5" y="1.5" width="13" height="13" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * The state of option `index` given what was chosen and — only once the result is in — the key.
 * Before the reveal, pass correctIndex = null: the chosen option is 'locked', the rest 'idle'.
 */
export function optionState(index: number, chosen: number | null | undefined, correctIndex: number | null | undefined): OptionState {
  const picked = chosen === index;
  if (correctIndex === null || correctIndex === undefined) return picked ? 'locked' : 'idle';
  if (index === correctIndex) return picked ? 'correct' : 'correct-unchosen';
  return picked ? 'wrong-chosen' : 'other';
}

export type OptionProps = {
  index: number;
  label: ReactNode;
  state?: OptionState;
  onChoose?: (index: number) => void;
  disabled?: boolean;
  className?: string;
};

export function Option({ index, label, state = 'idle', onChoose, disabled, className }: OptionProps) {
  const { isHi } = useLang();
  const slot = OPTION_SLOTS[index] ?? OPTION_SLOTS[0];
  const letter = isHi ? slot.letterHi : slot.letter;
  const mark =
    state === 'locked' ? (
      <>
        <Lock aria-hidden="true" size={18} strokeWidth={2.4} />
        <span>Locked</span>
      </>
    ) : state === 'correct' ? (
      <>
        <Check aria-hidden="true" size={20} strokeWidth={3} />
        <span className="h-sr">Correct answer, your pick</span>
      </>
    ) : state === 'correct-unchosen' ? (
      <>
        <Check aria-hidden="true" size={20} strokeWidth={3} />
        <span className="h-sr">Correct answer</span>
      </>
    ) : state === 'wrong-chosen' ? (
      <>
        <X aria-hidden="true" size={20} strokeWidth={3} />
        <span className="h-sr">Your pick, wrong</span>
      </>
    ) : null;
  const glyph = state === 'correct' || state === 'correct-unchosen' ? <Check aria-hidden="true" size={16} strokeWidth={3.2} /> : state === 'wrong-chosen' ? <X aria-hidden="true" size={16} strokeWidth={3.2} /> : null;
  return (
    <button
      type="button"
      className={cx('h-opt', `h-opt--${slot.slot}`, className)}
      data-state={state}
      disabled={disabled}
      onClick={onChoose ? () => onChoose(index) : undefined}
    >
      <span className="h-opt__tab" aria-hidden="true">
        <span className="h-opt__letter" lang={isHi ? 'hi' : undefined}>
          {letter}
        </span>
        <span className="h-opt__shape">
          {glyph}
          <OptionShape index={index} />
        </span>
      </span>
      <span className="h-sr">
        Option {slot.letter}, {slot.shape}:
      </span>
      <span className="h-opt__label">{label}</span>
      {mark ? <span className="h-opt__mark">{mark}</span> : null}
    </button>
  );
}

export type OptionListProps = {
  options: readonly ReactNode[];
  /** The player's pick (null before a tap). */
  chosen?: number | null;
  /** The key — pass it ONLY after the result is in. */
  correctIndex?: number | null;
  onChoose?: (index: number) => void;
  /** Disable further taps (after the lock, or while waiting). */
  disabled?: boolean;
  /** Answer with keys 1–4 / A–D while this list is mounted and enabled. */
  keys?: boolean;
  /** Accessible name of the group (default "Answers"). */
  label?: string;
  className?: string;
};

export function OptionList({ options, chosen = null, correctIndex = null, onChoose, disabled, keys = true, label = 'Answers', className }: OptionListProps) {
  const choose = useRef(onChoose);
  useLayoutEffect(() => {
    choose.current = onChoose;
  });
  useEffect(() => {
    if (!keys || disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const k = e.key.toLowerCase();
      const i = '1234'.indexOf(k) !== -1 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
      if (i < 0 || i >= options.length) return;
      e.preventDefault();
      choose.current?.(i);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keys, disabled, options.length]);
  return (
    <div className={cx('h-optlist', className)} role="group" aria-label={label}>
      {options.map((text, i) => (
        <Option key={i} index={i} label={text} state={optionState(i, chosen, correctIndex)} onChoose={onChoose} disabled={disabled} />
      ))}
    </div>
  );
}
