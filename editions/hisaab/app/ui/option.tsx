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
 *
 * Keys 1–4 / A–D (WCAG 2.1.4): they answer ONLY while keyboard focus is inside the question — the
 * list's question container (`[data-h-question]`, `.h-qcard`, `.h-live__card`, `.h-pass__play`,
 * `.h-dobara`, else its nearest section). A dictated word or a stray key elsewhere never locks an
 * answer. Screens move focus to the stem when a card appears (tabIndex -1), so the keys work at once.
 *
 * Labels are bank text, which stays English in the Hindi locale (bible §2.3): `.h-opt__label` carries
 * lang="en" (WCAG 3.1.2) unless `labelLang` says otherwise.
 */
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Check, Lock, X } from 'lucide-react';
import { cx } from './cx';
import { useLang } from './lang';
import './option.css';

export type OptionState = 'idle' | 'locked' | 'correct' | 'wrong-chosen' | 'correct-unchosen' | 'other';
export type OptionIndex = 0 | 1 | 2 | 3;

export const OPTION_SLOTS = Object.freeze([
  { slot: 'a', letter: 'A', letterHi: 'क', shape: 'triangle', shapeHi: 'त्रिकोण' },
  { slot: 'b', letter: 'B', letterHi: 'ख', shape: 'diamond', shapeHi: 'हीरा' },
  { slot: 'c', letter: 'C', letterHi: 'ग', shape: 'circle', shapeHi: 'गोला' },
  { slot: 'd', letter: 'D', letterHi: 'घ', shape: 'square', shapeHi: 'चौकोर' },
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
  /** Language of the label (default 'en': bank text). Pass null to inherit the page's language. */
  labelLang?: string | null;
  state?: OptionState;
  onChoose?: (index: number) => void;
  disabled?: boolean;
  className?: string;
};

export function Option({ index, label, labelLang = 'en', state = 'idle', onChoose, disabled, className }: OptionProps) {
  const { isHi, t } = useLang();
  const slot = OPTION_SLOTS[index] ?? OPTION_SLOTS[0];
  const letter = isHi ? slot.letterHi : slot.letter;
  // Screen-reader words follow the locale (the visible letter is क in Hindi, so is the name's).
  const hiLang = isHi ? 'hi' : undefined;
  const mark =
    state === 'locked' ? (
      <>
        <Lock aria-hidden="true" size={18} strokeWidth={2.4} />
        <span lang={hiLang}>{t('Locked', 'लॉक')}</span>
      </>
    ) : state === 'correct' ? (
      <>
        <Check aria-hidden="true" size={20} strokeWidth={3} />
        <span className="h-sr" lang={hiLang}>
          {t('Correct answer, your pick', 'सही जवाब, आपका चुनाव')}
        </span>
      </>
    ) : state === 'correct-unchosen' ? (
      <>
        <Check aria-hidden="true" size={20} strokeWidth={3} />
        <span className="h-sr" lang={hiLang}>
          {t('Correct answer', 'सही जवाब')}
        </span>
      </>
    ) : state === 'wrong-chosen' ? (
      <>
        <X aria-hidden="true" size={20} strokeWidth={3} />
        <span className="h-sr" lang={hiLang}>
          {t('Your pick, wrong', 'आपका चुनाव, ग़लत')}
        </span>
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
      <span className="h-sr" lang={hiLang}>
        {isHi ? `विकल्प ${slot.letterHi}, ${slot.shapeHi}:` : `Option ${slot.letter}, ${slot.shape}:`}
      </span>
      <span className="h-opt__label" lang={labelLang ?? undefined}>
        {label}
      </span>
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
  /** Answer with keys 1–4 / A–D while this list is enabled AND focus is inside its question. */
  keys?: boolean;
  /** Language of the option labels (default 'en': bank text). Pass null to inherit. */
  labelLang?: string | null;
  /** Accessible name of the group (default "Answers"). */
  label?: string;
  className?: string;
};

/** The open modal on top (showModal, or role=dialog aria-modal like the ceremony), if any. */
function openModal(): Element | null {
  const aria = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (aria) return aria;
  for (const d of Array.from(document.querySelectorAll('dialog[open]'))) {
    try {
      if (d.matches(':modal')) return d;
    } catch {
      return d; // no :modal support: treat an open <dialog> as modal
    }
  }
  return null;
}

/** The containers a question's shortcut keys belong to (the screens' question cards). */
export const QUESTION_SCOPE = '[data-h-question], .h-qcard, .h-live__card, .h-pass__play, .h-dobara';

/** The question container around `el` — a known card, else its nearest section, else its parent. */
export function questionScope(el: Element | null): Element | null {
  if (!el) return null;
  return el.closest(QUESTION_SCOPE) ?? el.closest('section, article, [role="dialog"], dialog') ?? el.parentElement;
}

/**
 * True when keyboard focus sits inside `scope` (an element, or a selector matched from the focused
 * element outwards). The gate for any single-key shortcut (WCAG 2.1.4): a route's "N / →" for the
 * next card uses `focusWithin('.h-play')`, so a dictated "n" elsewhere does nothing.
 */
export function focusWithin(scope: Element | string | null | undefined): boolean {
  if (typeof document === 'undefined' || !scope) return false;
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  return typeof scope === 'string' ? !!active.closest(scope) : scope.contains(active);
}

export function OptionList({ options, chosen = null, correctIndex = null, onChoose, disabled, keys = true, labelLang = 'en', label = 'Answers', className }: OptionListProps) {
  const choose = useRef(onChoose);
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    choose.current = onChoose;
  });
  useEffect(() => {
    if (!keys || disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const own = list.current;
      // Only while focus is inside this question (WCAG 2.1.4): never from the page at large.
      if (!own || !focusWithin(questionScope(own))) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // A modal is on top (a <dialog open>, an aria-modal sheet, the ceremony) and this list is not in
      // it: its keys are its own.
      const inDialog = t?.closest?.('dialog[open], [aria-modal="true"]');
      if (inDialog && !inDialog.contains(own)) return;
      const modal = openModal();
      if (modal && !modal.contains(own)) return;
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
    <div ref={list} className={cx('h-optlist', className)} role="group" aria-label={label}>
      {options.map((text, i) => (
        <Option key={i} index={i} label={text} labelLang={labelLang} state={optionState(i, chosen, correctIndex)} onChoose={onChoose} disabled={disabled} />
      ))}
    </div>
  );
}
