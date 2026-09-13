'use client';
/**
 * Discovery — three untimed teaching cards for the configured topic.
 *
 * No clock, no opponent, no coins: choose once, see the answer, open the explanation, keep the fact.
 * The practice dispatch, the explanation open and the save are exactly the ones the profile reducer
 * already understands; this screen only adds the Floodlight finish and the feedback.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  TriangleAlert,
  Vault,
  X,
} from 'lucide-react';
import { useJuice } from '@/components/fx';
import { request } from '@/lib/duel-client';
import { XP } from '@/lib/progression.mjs';
import { Choices, Dots, usePress } from './screens/vault';
import './screens/vault/vault.css';

export default function Discovery({
  topic,
  onBack,
  onVault,
  player,
}: {
  topic: string;
  onBack: () => void;
  onVault?: () => void;
  player: any;
}) {
  const juice = useJuice();
  const press = usePress();
  const [cards, setCards] = useState<any[]>([]),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState<number | null>(null),
    [results, setResults] = useState<boolean[]>([]),
    [error, setError] = useState(''),
    [finished, setFinished] = useState(false),
    [retry, setRetry] = useState(0);
  const session = useRef(''),
    locked = useRef(false),
    heading = useRef<HTMLHeadingElement | null>(null),
    explanation = useRef<HTMLElement | null>(null);
  const label = !topic || topic === 'all' ? 'Mixed' : topic;

  useEffect(() => {
    let alive = true;
    setError('');
    session.current = crypto.randomUUID();
    locked.current = false;
    setChoice(null);
    setResults([]);
    setCards([]);
    setIndex(0);
    setFinished(false);
    request({ action: 'practice', topic })
      .then((d) => {
        if (alive) {
          setCards(d.cards);
          setIndex(0);
          setFinished(false);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [topic, retry, player.profile.epoch]);
  useEffect(() => {
    heading.current?.focus();
  }, [index, finished, cards.length]);

  const fact = cards[index],
    roundId = fact ? `practice:${session.current}:${index}` : '';
  const saved = !!fact && player.journal.saved.includes(fact.question);
  const remembered = results.filter(Boolean).length;

  const answer = (selected: number, element: HTMLButtonElement) => {
    if (locked.current || !fact) return;
    locked.current = true;
    setChoice(selected);
    const right = selected === fact.correctIndex;
    setResults((r) => [...r, right]);
    void player.dispatch({ type: 'practice', epoch: player.profile.epoch, fact, choice: selected, roundId });
    juice.burst(element, right ? 'correct' : 'wrong');
    juice.floatText(element, `+${right ? XP.discoveryCorrect : XP.discovery} XP`);
  };

  return (
    <section className="fd-learn fd-discovery">
      <div>
        <button type="button" className="fd-btn fd-btn--ghost" onPointerDown={press} onClick={onBack}>
          <ArrowLeft />
          Back to Play
        </button>
      </div>
      <header className="fd-learn__head">
        <p className="fd-eyebrow">NO TIMER · NO OPPONENT</p>
        <div className="fd-learn__title">
          <h1 ref={heading} tabIndex={-1}>
            Discovery · {label}
          </h1>
          <span className="fd-tag fd-tag--cool">
            <Compass />3 facts · take your time
          </span>
        </div>
        <p className="fd-lede">
          {finished
            ? 'Session complete. Every card you attempted is in your Vault with its explanation and source.'
            : 'Follow your curiosity. Choose once to reveal the answer, open the explanation, and keep whatever is worth keeping.'}
        </p>
      </header>

      {finished ? (
        <div className="fd-qwrap">
          <div className="fd-summary">
            <span className="fd-summary__ring">
              {remembered}/{cards.length}
            </span>
            <h2>Three facts to take with you.</h2>
            <p>
              Your attempted cards and their sources are in the Vault. Exploration stamps describe curiosity,
              not mastery.
            </p>
            <div className="fd-summary__scores">
              <span className="fd-tag fd-tag--cool">
                <Check />
                {remembered} first-try
              </span>
              <span className="fd-tag">
                <BookOpen />
                {cards.length} facts kept
              </span>
            </div>
            <div className="fd-summary__actions">
              {onVault && (
                <button type="button" className="fd-btn" onPointerDown={press} onClick={onVault}>
                  <Vault />
                  Open your Vault
                </button>
              )}
              <button type="button" className="fd-btn fd-btn--primary" onPointerDown={press} onClick={onBack}>
                Back to Play
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="fd-qwrap" role="alert">
          <div className="fd-summary">
            <span className="fd-summary__ring">
              <TriangleAlert />
            </span>
            <h2>Couldn’t open these cards.</h2>
            <p>{error}</p>
            <div className="fd-summary__actions">
              <button
                type="button"
                className="fd-btn fd-btn--primary"
                onPointerDown={press}
                onClick={() => {
                  locked.current = false;
                  setChoice(null);
                  setRetry((n) => n + 1);
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : !fact ? (
        <p className="fd-note" role="status">
          Opening three sourced facts…
        </p>
      ) : (
        <div className="fd-qwrap">
          <Dots total={cards.length} index={index} label={`Fact ${index + 1} of ${cards.length}`} />
          <div className="fd-qcard">
            <div className="fd-qcard__meta">
              <span className="fd-tag">{fact.topic}</span>
              <span className="fd-tag">{fact.subtopic}</span>
            </div>
            <h2 className="fd-qcard__q">{fact.question}</h2>
            <p className="fd-note">Choose once to see the explanation. There is no time limit.</p>
            <Choices
              key={roundId}
              options={fact.options}
              correctIndex={fact.correctIndex}
              chosen={choice}
              disabled={!player.loaded}
              animate
              onChoose={answer}
            />
            {choice !== null && (
              <div className="fd-result" data-tone={choice === fact.correctIndex ? 'correct' : 'wrong'}>
                <strong className="fd-result__verdict" role="status">
                  {choice === fact.correctIndex ? <Check /> : <X />}
                  {choice === fact.correctIndex ? 'You found it.' : 'A new fact for the collection.'}
                </strong>
                <p className="fd-result__answer">
                  <b>Correct answer:</b> {fact.options[fact.correctIndex]}
                </p>
                <details
                  className="fd-disclose"
                  onToggle={(e) => {
                    if (!e.currentTarget.open) return;
                    const first = player.passport?.facts?.[fact.factId]?.opened !== true;
                    player.open(roundId);
                    juice.sound('reveal');
                    if (first && explanation.current) juice.floatText(explanation.current, `+${XP.open} XP`);
                  }}
                >
                  <summary ref={explanation} onPointerDown={press}>
                    <ChevronRight className="fd-caret" aria-hidden="true" />
                    Open the explanation
                  </summary>
                  <div className="fd-disclose__body">
                    <p>{fact.explanation}</p>
                    <a className="fd-source" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
                      Source: {fact.sourceLabel}
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </div>
                </details>
                <div className="fd-result__actions">
                  <button
                    type="button"
                    className="fd-btn"
                    aria-pressed={saved}
                    onPointerDown={press}
                    onClick={(e) => {
                      const el = e.currentTarget;
                      const adding = !saved;
                      player.save(fact.question);
                      if (adding) {
                        juice.burst(el, 'gem');
                        juice.floatText(el, `+${XP.save} XP`, 'var(--gold)');
                      }
                    }}
                  >
                    {saved ? <BookmarkCheck /> : <Bookmark />}
                    {saved ? 'Saved' : 'Save fact'}
                  </button>
                  <button
                    type="button"
                    className="fd-btn fd-btn--primary"
                    onPointerDown={press}
                    onClick={() => {
                      if (index + 1 < cards.length) {
                        locked.current = false;
                        setChoice(null);
                        setIndex(index + 1);
                      } else {
                        setFinished(true);
                        juice.sound('unlock');
                      }
                    }}
                  >
                    {index + 1 < cards.length ? 'Next fact' : 'Complete session'}
                    <ArrowRight />
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="fd-note">
            Open teaching cards share facts with the duel sample. Their answers are available to this practice
            screen; this is untimed exploration, not a ranked test.
          </p>
        </div>
      )}
    </section>
  );
}
