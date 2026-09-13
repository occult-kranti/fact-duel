'use client';
/**
 * Vault — the fact vault and the Recall Lab.
 *
 * Vault: header stat tiles (facts / saved / recalled), All · Saved · Sports · Science filters, fact
 * cards with a difficulty-tinted finish, the flagged-question list and recent matches as W/L/D rows.
 * Recall Lab: an untimed, card-by-card pass over a snapshot of whatever the filter was showing when
 * practice started — the deck never changes underneath the player.
 *
 * Every dispatch (open / recall / save / export) is handed in by the screen wrapper; this file only
 * decides when to fire them and what feedback to play.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Brain,
  Check,
  Download,
  ExternalLink,
  Flag,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useJuice } from '@/components/fx';
import { TOPIC_DOMAINS, uniqueFacts } from '@/lib/journal.mjs';
import { XP } from '@/lib/progression.mjs';
import { Chip, Choices, Dots, EmptyState, FactCard, StatTile, usePress } from './screens/vault';
import './screens/vault/vault.css';

const MODE_NAMES: Record<string, string> = {
  quick: 'Quick Draw',
  trilogy: 'Triple Threat',
  gauntlet: 'The Gauntlet',
};
const ISSUE_REASONS: Record<string, string> = {
  incorrect: 'Answer concern',
  ambiguous: 'Ambiguous',
  source: 'Source concern',
  other: 'Other concern',
};
const OUTCOME_LETTER: Record<string, string> = { win: 'W', loss: 'L', draw: 'D' };
const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'saved', label: 'Saved' },
  { id: 'sports', label: 'Sports' },
  { id: 'science', label: 'Science' },
];

export function Journal({
  journal,
  issues,
  onPlay,
  onSave,
  onOpen,
  onRecall,
  onExport,
  storageOK,
  epoch,
  loaded,
  passport,
  summary,
}: {
  journal: any;
  issues: any[];
  onPlay: () => void;
  onSave: (s: string) => void;
  onOpen: (s: string) => void;
  onRecall: (s: string) => void;
  onExport: () => void;
  storageOK: boolean;
  epoch: string;
  loaded: boolean;
  passport?: any;
  summary?: any;
}) {
  const juice = useJuice();
  const press = usePress();
  const [filter, setFilter] = useState('all'),
    [study, setStudy] = useState(false),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState<number | null>(null),
    [deck, setDeck] = useState<any[]>([]),
    [results, setResults] = useState<boolean[]>([]),
    [wrapped, setWrapped] = useState(false);
  const heading = useRef<HTMLHeadingElement | null>(null);

  const facts: any[] = useMemo(() => uniqueFacts(journal.rounds), [journal.rounds]);
  const savedCount = facts.filter((f) => journal.saved.includes(f.question)).length;
  const counts = {
    all: facts.length,
    saved: savedCount,
    sports: facts.filter((f) => (TOPIC_DOMAINS as any)[f.topic] === 'sports').length,
    science: facts.filter((f) => (TOPIC_DOMAINS as any)[f.topic] === 'science').length,
  } as Record<string, number>;
  const shown = facts.filter((f) =>
    filter === 'saved'
      ? journal.saved.includes(f.question)
      : filter === 'all' || (TOPIC_DOMAINS as any)[f.topic] === filter,
  );
  const current = deck[index];
  /** A fact only earns XP the first time it is opened / recalled — mirror that in the float text. */
  const awards = (fact: any, field: 'opened' | 'recalled') => {
    const entry = fact?.factId ? passport?.facts?.[fact.factId] : null;
    return !!entry && entry[field] !== true;
  };

  useEffect(() => {
    setStudy(false);
    setChoice(null);
    setDeck([]);
    setIndex(0);
    setResults([]);
    setWrapped(false);
  }, [epoch]);
  useEffect(() => {
    if (study) heading.current?.focus();
  }, [study, index, wrapped]);

  /* ---------------------------------------------------------------- Recall Lab */
  if (study && (wrapped || current)) {
    const remembered = results.filter(Boolean).length;
    const correctIndex = current ? current.options.indexOf(current.correctAnswer) : -1;
    const last = index + 1 >= deck.length;
    return (
      <section className="fd-learn fd-recall">
        <div>
          <button type="button" className="fd-btn fd-btn--ghost" onPointerDown={press} onClick={leave}>
            <ArrowLeft />
            Back to the vault
          </button>
        </div>
        <header className="fd-learn__head">
          <p className="fd-eyebrow">RECALL LAB · NO TIMER</p>
          <div className="fd-learn__title">
            <h1 ref={heading} tabIndex={-1}>
              {wrapped ? 'Practice complete.' : 'Take your time.'}
            </h1>
            <span className="fd-tag fd-tag--cool">
              <Brain />
              {wrapped ? `${deck.length} cards` : `${index + 1} / ${deck.length}`}
            </span>
          </div>
          <p className="fd-lede">
            Facts you have already met, replayed without coins, opponents or a clock. Recall practice is for
            you — nothing here changes a past score.
          </p>
        </header>
        {wrapped ? (
          <div className="fd-qwrap">
            <div className="fd-summary">
              <span className="fd-summary__ring">
                {remembered}/{deck.length}
              </span>
              <h2>{remembered === deck.length ? 'All of them stuck.' : 'Good pass.'}</h2>
              <p>
                {remembered === deck.length
                  ? 'Every card came back to you. Try a wider filter next time for a harder run.'
                  : `You remembered ${remembered} of ${deck.length}. The ones that slipped are still in your vault with their explanation and source.`}
              </p>
              <div className="fd-summary__scores">
                <span className="fd-tag fd-tag--cool">
                  <Check />
                  {remembered} remembered
                </span>
                <span className="fd-tag">
                  <X />
                  {deck.length - remembered} to revisit
                </span>
              </div>
              <div className="fd-summary__actions">
                <button type="button" className="fd-btn" onPointerDown={press} onClick={restart}>
                  <Brain />
                  Run it again
                </button>
                <button
                  type="button"
                  className="fd-btn fd-btn--primary"
                  onPointerDown={press}
                  onClick={leave}
                >
                  Back to the vault
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="fd-qwrap">
            <Dots total={deck.length} index={index} label={`Card ${index + 1} of ${deck.length}`} />
            <div className="fd-qcard">
              <div className="fd-qcard__meta">
                <span className="fd-tag">{current.topic}</span>
                {current.subtopic && <span className="fd-tag">{current.subtopic}</span>}
              </div>
              <h2 className="fd-qcard__q">{current.question}</h2>
              <Choices
                key={current.id}
                options={current.options}
                correctIndex={correctIndex}
                chosen={choice}
                animate
                onChoose={(i, el) => {
                  if (choice !== null) return;
                  setChoice(i);
                  const right = i === correctIndex;
                  setResults((r) => [...r, right]);
                  onRecall(current.id);
                  juice.burst(el, right ? 'correct' : 'wrong');
                  if (awards(current, 'recalled')) juice.floatText(el, `+${XP.recall} XP`);
                }}
              />
              {choice !== null && (
                <div className="fd-result" data-tone={choice === correctIndex ? 'correct' : 'wrong'}>
                  <strong className="fd-result__verdict" role="status">
                    {choice === correctIndex ? <Check /> : <X />}
                    {choice === correctIndex ? 'You remembered.' : 'One to revisit.'}
                  </strong>
                  {choice !== correctIndex && (
                    <p className="fd-result__answer">
                      <b>Answer:</b> {current.correctAnswer}
                    </p>
                  )}
                  <p className="fd-note">{current.explanation}</p>
                  <a className="fd-source" href={current.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {current.sourceLabel || 'Check the source'}
                    <ExternalLink aria-hidden="true" />
                  </a>
                  <div className="fd-result__actions">
                    <button
                      type="button"
                      className="fd-btn fd-btn--primary"
                      onPointerDown={press}
                      onClick={() => {
                        if (last) {
                          setWrapped(true);
                          juice.sound('unlock');
                        } else {
                          setIndex(index + 1);
                          setChoice(null);
                        }
                      }}
                    >
                      {last ? 'Finish practice' : 'Next fact'}
                      <ArrowRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="fd-note">
              Recall practice replays facts you have already seen. It is untimed exploration, not a ranked
              test.
            </p>
          </div>
        )}
      </section>
    );
  }

  function leave() {
    setStudy(false);
    setChoice(null);
    setIndex(0);
    setResults([]);
    setWrapped(false);
  }
  function restart() {
    setIndex(0);
    setChoice(null);
    setResults([]);
    setWrapped(false);
  }
  function startPractice() {
    setIndex(0);
    setChoice(null);
    setResults([]);
    setWrapped(false);
    setDeck(shown);
    setStudy(true);
  }

  /* ---------------------------------------------------------------- Vault */
  return (
    <section className="fd-learn fd-vault">
      <header className="fd-learn__head">
        <p className="fd-eyebrow">YOUR VAULT · ON THIS DEVICE</p>
        <div className="fd-learn__title">
          <h1>Every fact you kept.</h1>
          {facts.length > 0 && (
            <div className="fd-head-actions">
              <button
                type="button"
                className="fd-btn"
                disabled={!loaded}
                onPointerDown={press}
                onClick={onExport}
              >
                <Download />
                Export
              </button>
              <button
                type="button"
                className="fd-btn fd-btn--primary"
                disabled={!shown.length}
                onPointerDown={press}
                onClick={startPractice}
              >
                <Brain />
                Recall practice
              </button>
            </div>
          )}
        </div>
        <p className="fd-lede">
          Match history and every fact you have met, stored in this browser. Revisit an explanation, bookmark
          the ones worth keeping, then practise recall whenever you like. Activity is not measured mastery.
        </p>
        <div className="fd-stats">
          <StatTile icon={BookOpen} tone="cyan" value={facts.length} label="Facts encountered" />
          <StatTile icon={Bookmark} tone="gold" value={savedCount} label="Saved to revisit" />
          <StatTile icon={Sparkles} tone="volt" value={summary?.recalled ?? 0} label="Recalled untimed" />
        </div>
      </header>

      {!storageOK && (
        <p className="fd-alert">
          <TriangleAlert aria-hidden="true" />
          Device storage is unavailable. This vault will last only for this visit — export before you leave.
        </p>
      )}

      {facts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your first fact is waiting."
          action={
            <button type="button" className="fd-btn fd-btn--primary" onPointerDown={press} onClick={onPlay}>
              Try untimed Discovery
              <ArrowRight />
            </button>
          }
        >
          Three untimed Discovery cards — or one duel — and their explanations, sources and difficulty
          finishes land right here.
        </EmptyState>
      ) : (
        <section className="fd-panel">
          <div className="fd-toolbar">
            <div className="fd-chips">
              {FILTERS.map((f) => (
                <Chip
                  key={f.id}
                  active={filter === f.id}
                  count={counts[f.id]}
                  onClick={() => {
                    setFilter(f.id);
                    setIndex(0);
                  }}
                >
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title={filter === 'saved' ? 'Nothing saved yet.' : 'Nothing in this collection yet.'}
            >
              {filter === 'saved'
                ? 'Tap the bookmark on any fact card to keep it here.'
                : 'Play or explore this side of the bank and its facts will appear here.'}
            </EmptyState>
          ) : (
            <div className="fd-facts">
              {shown.map((f) => (
                <FactCard
                  key={f.id}
                  fact={f}
                  saved={journal.saved.includes(f.question)}
                  openAwards={awards(f, 'opened')}
                  onOpen={onOpen}
                  onSave={onSave}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {issues?.length > 0 && (
        <section className="fd-panel">
          <div className="fd-panel__head">
            <h2>Questions you flagged</h2>
            <p>Kept in this browser · never sent</p>
          </div>
          <p className="fd-note">
            These notes keep the original fact and source. They are not in a support queue and do not change
            past scores.
          </p>
          <div className="fd-issues">
            {issues.map((issue: any) => (
              <details key={issue.id} className="fd-issue">
                <summary onPointerDown={press}>
                  <Flag aria-hidden="true" width={15} height={15} />
                  {issue.fact.question}
                  <span className="fd-tag">{ISSUE_REASONS[issue.reason] || 'Concern'}</span>
                </summary>
                <div className="fd-disclose__body">
                  <p>{issue.note || 'No additional note.'}</p>
                  <p className="fd-note">Accepted answer: {issue.fact.correctAnswer}</p>
                  <a
                    className="fd-source"
                    href={issue.fact.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open original source
                    <ExternalLink aria-hidden="true" />
                  </a>
                  <p className="fd-note">Saved {new Date(issue.at).toLocaleDateString()}</p>
                </div>
              </details>
            ))}
          </div>
          <div className="fd-head-actions">
            <button
              type="button"
              className="fd-btn"
              onPointerDown={press}
              onClick={onExport}
              disabled={!loaded}
            >
              <Download />
              Export issues &amp; activity
            </button>
          </div>
        </section>
      )}

      {journal.matches.length > 0 && (
        <section className="fd-panel">
          <div className="fd-panel__head">
            <h2>Recent matches</h2>
            <p>Last {Math.min(10, journal.matches.length)} · newest first</p>
          </div>
          <ol className="fd-matches">
            {journal.matches.slice(0, 10).map((m: any) => (
              <li className="fd-match" key={m.id}>
                <span className="fd-wld" data-outcome={m.outcome} title={m.outcome}>
                  <span aria-hidden="true">{OUTCOME_LETTER[m.outcome] || '·'}</span>
                  <span className="sr-only">{m.outcome}</span>
                </span>
                <span className="fd-match__name">
                  {MODE_NAMES[m.mode] || m.mode}
                  <span>{m.bot ? 'BOT' : 'Friend duel'}</span>
                </span>
                <span className="fd-match__score">
                  <span>
                    {m.scores[0]}–{m.scores[1]}
                  </span>
                  <time dateTime={new Date(m.at).toISOString()}>
                    {new Date(m.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </time>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
