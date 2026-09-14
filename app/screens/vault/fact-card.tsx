'use client';
/**
 * A single Vault fact: difficulty-tinted finish, topic tag, the question, an expandable explanation
 * (first open awards XP and floats it) and a bookmark toggle (a save bursts a gem). Every dispatch is
 * passed in by the Vault screen; this component only adds the feedback.
 *
 * The face asks rather than tells. Printing the correct answer on it made the primary learning
 * surface a restudy surface — the option that tests worse at every delay past five minutes and feels
 * better while you do it. The answer now sits behind an attempt, or behind a secondary "Just show
 * me". Anything the player read before answering travels with the attempt as `revealed`, and a
 * revealed attempt is recorded in full while the review schedule stays exactly where it was: seeing
 * the answer is not recall, so it is never scored as recall.
 */
import { useId, useRef, useState } from 'react';
import { Bookmark, ChevronRight, Check, ExternalLink, Eye, X } from 'lucide-react';
import { useJuice } from '@/components/fx';
import { XP } from '@/lib/progression.mjs';
import { finishOf, FINISH_LABEL } from './difficulty';
import { Choices } from './choices';
import { usePress } from './press';

/** The shape `app/use-player.ts` takes: `chose` is the option text, because options reshuffle. */
export type FactCardAttempt = {
  factId: string;
  roundId: string | null;
  choice: number;
  chose: string;
  correct: boolean;
  revealed: boolean;
};

export type FactCardProps = {
  fact: any;
  saved: boolean;
  /** This fact has never been opened, so opening it will award XP.open. */
  openAwards: boolean;
  /** This fact is due, so a remembered answer will be paid. Defaults to claiming nothing. */
  reviewAwards?: boolean;
  onOpen: (roundId: string) => unknown;
  onSave: (question: string) => unknown;
  /** Records the attempt. Omitted while the screen is unwired: the self-test still works, silently. */
  onReview?: (attempt: FactCardAttempt) => unknown;
};

const thenable = (v: unknown): v is Promise<unknown> =>
  typeof v === 'object' && v !== null && typeof (v as { then?: unknown }).then === 'function';

/**
 * A dispatch that finds nothing hands back the same profile, so the XP it looks like it paid was
 * never paid. The reward waits for the promise and stays quiet on a refusal; a dispatcher that still
 * returns `undefined` is taken at its word, as it was before.
 */
function paid(result: unknown, reward: () => void) {
  if (!thenable(result)) return reward();
  void result.then((ok) => {
    if (ok !== false) reward();
  });
}

/**
 * `choices.tsx` answers the 1–4 keys from a listener on the window, and the Vault renders a list of
 * these cards rather than the Recall Lab's single one — one key press would otherwise click the
 * matching option on every unanswered card on screen at once and bury a dozen facts. A card accepts a
 * choice only while it is the one the player last touched or focused, which is also what the keys
 * should mean in a list.
 */
let armed: object | null = null;

export function FactCard({ fact, saved, openAwards, reviewAwards, onOpen, onSave, onReview }: FactCardProps) {
  const juice = useJuice();
  const press = usePress();
  const summaryRef = useRef<HTMLElement | null>(null);
  const self = useRef({});
  const [choice, setChoice] = useState<number | null>(null);
  // Two ways to have read the answer before answering, and they count the same: the explanation names
  // it as often as not, so an open is a reveal.
  const [shown, setShown] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const finish = finishOf(fact.difficulty);
  const headingId = useId();

  const options: string[] = Array.isArray(fact.options) ? fact.options : [];
  const stored = Number.isInteger(fact.correctIndex)
    ? fact.correctIndex
    : options.indexOf(fact.correctAnswer);
  const correctIndex = stored >= 0 && stored < options.length ? stored : -1;
  // A card journalled before the option snapshot existed cannot be a prompt. It gets the reveal and
  // nothing else, rather than a quiz with no answer in it.
  const quiz = options.length === 4 && correctIndex >= 0;
  const answer: string =
    typeof fact.correctAnswer === 'string' ? fact.correctAnswer : (options[correctIndex] ?? '');
  const revealed = shown || peeked;
  const answered = choice !== null;
  const right = answered && choice === correctIndex;
  const resolved = answered || shown;

  return (
    <article className="fd-fact" data-finish={finish} aria-labelledby={headingId}>
      <div className="fd-fact__head">
        <span className="fd-tag">{fact.topic}</span>
        {finish !== 'plain' && <span className="fd-badge">{FINISH_LABEL[finish]}</span>}
        <button
          type="button"
          className="fd-icon-btn"
          aria-label={saved ? 'Remove saved fact' : 'Save fact'}
          aria-pressed={saved}
          onPointerDown={press}
          onClick={(e) => {
            const el = e.currentTarget;
            const adding = !saved;
            const sent = onSave(fact.question);
            if (adding)
              paid(sent, () => {
                juice.burst(el, 'gem');
                juice.floatText(el, `+${XP.save} XP`, 'var(--gold-text)');
              });
          }}
        >
          <Bookmark fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <h3 className="fd-fact__q" id={headingId}>
        {fact.question}
      </h3>
      {quiz && (
        <div
          onPointerDownCapture={() => {
            armed = self.current;
          }}
          onFocusCapture={() => {
            armed = self.current;
          }}
        >
          <Choices
            options={options}
            correctIndex={correctIndex}
            chosen={choice}
            onChoose={(i, el) => {
              if (armed !== self.current || answered) return;
              const correct = i === correctIndex;
              setChoice(i);
              // The verdict is feedback and is true whatever the store does with it, so it fires now.
              juice.burst(el, correct ? 'correct' : 'wrong');
              // No `factId` means a card journalled before the fact store, which the review writer
              // cannot place: it self-tests, it records nothing, and it claims nothing.
              const factId = typeof fact.factId === 'string' ? fact.factId : null;
              if (!factId || !onReview) return;
              const sent = onReview({
                factId,
                // A Vault attempt is not a round, and reusing the round id would make every later
                // review of this card an id the writer has already seen and drops.
                roundId: null,
                choice: i,
                chose: options[i],
                correct,
                revealed,
              });
              // Only a due card answered cold is paid, so only that one is allowed to say so — and
              // only once the dispatch it depends on has actually come back.
              if (correct && !revealed && reviewAwards)
                paid(sent, () => juice.floatText(el, `+${XP.reviewCorrect} XP`));
            }}
          />
        </div>
      )}
      {!resolved && (
        <button
          type="button"
          className="fd-btn fd-btn--ghost"
          aria-label={`Just show me the answer to: ${fact.question}`}
          onPointerDown={press}
          onClick={() => {
            setShown(true);
            juice.sound('reveal');
          }}
        >
          <Eye aria-hidden="true" />
          Just show me
        </button>
      )}
      {resolved ? (
        <div className="fd-result" data-tone={answered ? (right ? 'correct' : 'wrong') : undefined}>
          <strong className="fd-result__verdict" role="status">
            {answered ? right ? <Check /> : <X /> : <Eye aria-hidden="true" />}
            {answered ? (right ? 'You remembered.' : 'One to revisit.') : 'Shown, not recalled.'}
          </strong>
          {(!answered || !right) && (
            <p className="fd-result__answer">
              <b>Answer:</b> {answer}
            </p>
          )}
          {revealed && (
            <p className="fd-note">
              You had the answer in front of you, so this one keeps its place in the review queue. Answer it
              cold on another day and it moves.
            </p>
          )}
          <p className="fd-note">{fact.explanation}</p>
          <a className="fd-source" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
            {fact.sourceLabel}
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      ) : (
        <details
          className="fd-disclose"
          onToggle={(e) => {
            if (!e.currentTarget.open) return;
            onOpen(fact.id);
            juice.sound('reveal');
            if (openAwards && summaryRef.current) juice.floatText(summaryRef.current, `+${XP.open} XP`);
            setPeeked(true);
          }}
        >
          <summary ref={summaryRef} onPointerDown={press}>
            <ChevronRight className="fd-caret" aria-hidden="true" />
            Explanation &amp; source
          </summary>
          <div className="fd-disclose__body">
            <p>{fact.explanation}</p>
            <a className="fd-source" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
              {fact.sourceLabel}
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </details>
      )}
    </article>
  );
}
