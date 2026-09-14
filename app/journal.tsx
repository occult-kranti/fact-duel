'use client';
/**
 * Vault — your history on this device, and the review queue that runs on it.
 *
 * Vault: header stat tiles, the "came back later" claim tile, then four sections in order — Due today
 * (the queue, capped at REVIEW_CAP), Shaky (missed last time, not due yet), Everything (the full fact
 * list behind eight filters) and Runs & matches (every run, duel and review session, expanded to its
 * per-card outcomes). Facts are listed out of `journal.cards` / `journal.facts`, which hold 300, rather
 * than out of the 200-round replay window; a fact whose round has rolled out still lists and still saves.
 * Recall Lab: an untimed pass over a snapshot of the deck it was started with — the deck never changes
 * underneath the player. Each answer dispatches `review`, which is the only write path that moves a box.
 *
 * Nothing on this screen scores the player. There is no mastery measure, no ranking and no per-fact
 * percentage: a four-option card has a 25% floor, so counts and dates are the only honest units. The
 * schedule is a schedule — when a card comes back — never a prediction about the person answering it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Brain,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Flag,
  History,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useJuice, useMounted } from '@/components/fx';
import { CONFIDENCE } from '@/lib/expeditions.mjs';
import { TOPIC_DOMAINS, uniqueFacts } from '@/lib/journal.mjs';
import { ATTEMPTS_PER_FACT, REVIEW_CAP, dueToday, isDue, nextAudit } from '@/lib/journal-review.mjs';
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
const SURFACE_LABEL: Record<string, string> = {
  duel: 'Duel',
  expedition: 'Expedition run',
  discovery: 'Discovery',
  recall: 'Review session',
  event: 'Limited mode',
};
/* The four original chips plus §3.3.3's four. `wrong`, `bold` and `fresh` read the fact record rather
 * than the round, so they can only answer for facts the learning store has actually seen. */
const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'saved', label: 'Saved' },
  { id: 'sports', label: 'Sports' },
  { id: 'science', label: 'Science' },
  { id: 'due', label: 'Due' },
  { id: 'wrong', label: 'Wrong last time' },
  { id: 'bold', label: 'Bold misses' },
  { id: 'fresh', label: 'Never revisited' },
];
/* A card and its attempt history are one entry in the list; the disclosure carries the shared rule of
 * .fd-disclose, so the two read as one block without a stylesheet this file does not own. */
const ENTRY: React.CSSProperties = { display: 'grid', gap: 8 };
const ATTEMPT_ROW: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
const NO_ATTEMPTS: Attempt[] = [];

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
/** A weekday inside the coming week, a date beyond it — "Next look: Tuesday" only while that is useful. */
const lookDate = (at: number, from: number) =>
  at - from < 6 * 864e5 && at >= from
    ? new Date(at).toLocaleDateString(undefined, { weekday: 'long' })
    : shortDate(at);

/** A card-store entry wearing a round's clothes, mirroring `roundFromCard` in lib/passport.mjs. */
function factFromCard(factId: string, card: any) {
  const correctAnswer = card?.options?.[card?.correctIndex];
  if (typeof correctAnswer !== 'string') return null;
  return {
    id: `card:${factId}`,
    factId,
    difficulty: card.difficulty,
    question: card.question,
    options: [...card.options],
    correctAnswer,
    explanation: card.explanation,
    topic: card.topic,
    subtopic: card.subtopic,
    sourceUrl: card.sourceUrl,
    sourceLabel: card.sourceLabel,
  };
}

/** One stored answer, as lib/journal.mjs sanitises it. `chose` is the option text, never an index. */
type Attempt = {
  id: string;
  factId: string;
  at: number;
  surface: string;
  contextId: string | null;
  index: number;
  chose: string | null;
  correct: boolean;
  confidence: string | null;
  revealed: boolean;
};
/** The learning aggregate for one fact. Counts and dates; the schedule owns box / due / retiredAt. */
type FactRecord = {
  topic: string;
  seen: number;
  correct: number;
  lastAt: number;
  lastCorrect: boolean;
  days: number;
  bySurface: Record<string, number>;
  boldWrong: number;
  firstMissAt: number | null;
  recoveredAt: number | null;
  box: number;
  due: number | null;
  retiredAt: number | null;
};

/** What the Recall Lab hands `player.review`. `chose` is the option text: every surface reshuffles. */
type ReviewAttempt = {
  factId: string;
  roundId: string | null;
  choice: number;
  chose: string;
  correct: boolean;
  revealed: boolean;
};
type Entry = { key: string; factId: string | null; fact: any; record: FactRecord | null };

export function Journal({
  journal,
  issues,
  onPlay,
  onSave,
  onOpen,
  onRecall,
  onReview,
  onExport,
  storageOK,
  epoch,
  loaded,
  passport,
}: {
  journal: any;
  issues: any[];
  onPlay: () => void;
  onSave: (s: string) => void;
  onOpen: (s: string) => void;
  onRecall: (s: string) => void;
  /** Optional only while the screen wrapper is still passing the legacy `onRecall`. */
  onReview?: (attempt: ReviewAttempt) => Promise<boolean>;
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
    [revealed, setRevealed] = useState(false),
    [deck, setDeck] = useState<any[]>([]),
    [results, setResults] = useState<boolean[]>([]),
    [wrapped, setWrapped] = useState(false);
  const heading = useRef<HTMLHeadingElement | null>(null);

  // One clock for the whole render: the queue, the Due chip and every "next look" line have to agree
  // with each other. Read after mount only — this build is a static export, and a prerendered "due"
  // count is a different number from the one the browser computes a moment later.
  const mounted = useMounted();
  const now = mounted ? Date.now() : 0;
  const records: Record<string, FactRecord> = journal.facts ?? {};
  const attempts: Attempt[] = useMemo(() => journal.attempts ?? [], [journal.attempts]);

  /* The list is the union of the round window and the card store: a legacy profile has rounds and no
   * cards, a long-lived one has facts whose rounds scrolled away, and both must list. */
  const entries: Entry[] = useMemo(() => {
    const out: Entry[] = [];
    const seen = new Set<string>();
    for (const r of uniqueFacts(journal.rounds)) {
      const id = typeof r.factId === 'string' ? r.factId : null;
      if (id) seen.add(id);
      out.push({ key: r.id, factId: id, fact: r, record: id ? ((journal.facts ?? {})[id] ?? null) : null });
    }
    for (const [id, card] of Object.entries(journal.cards ?? {})) {
      if (seen.has(id)) continue;
      const fact = factFromCard(id, card);
      if (fact) out.push({ key: fact.id, factId: id, fact, record: (journal.facts ?? {})[id] ?? null });
    }
    // Last answered first, with anything the queue wants pinned above it — `uniqueFacts` orders by the
    // round window alone, which cannot see a fact whose only recent answer was a review.
    return out
      .map((e, i) => ({ e, i }))
      .sort(
        (a, b) =>
          Number(isDue(b.e.record, now)) - Number(isDue(a.e.record, now)) ||
          (b.e.record?.lastAt ?? b.e.fact.at ?? 0) - (a.e.record?.lastAt ?? a.e.fact.at ?? 0) ||
          a.i - b.i,
      )
      .map((x) => x.e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal.rounds, journal.cards, journal.facts, mounted]);

  const byFact = useMemo(() => {
    const map = new Map<string, Attempt[]>();
    for (const a of attempts) {
      if (typeof a?.factId !== 'string') continue;
      const list = map.get(a.factId);
      if (list) list.push(a);
      else map.set(a.factId, [a]);
    }
    return map;
  }, [attempts]);

  /* Runs & matches: attempts grouped by the context they were answered in, then any match old enough
   * that its attempts have aged out of the rolling tail — or that predates the tail entirely. */
  const runs = useMemo(() => {
    const groups = new Map<string, any>();
    for (const a of attempts) {
      const key = typeof a?.contextId === 'string' && a.contextId ? a.contextId : `${a?.surface}:${a?.id}`;
      const g = groups.get(key);
      if (g) {
        g.items.push(a);
        g.n += 1;
        g.correct += a.correct ? 1 : 0;
        g.at = Math.max(g.at, a.at);
      } else {
        groups.set(key, {
          key,
          surface: a?.surface ?? 'duel',
          at: a?.at ?? 0,
          n: 1,
          correct: a?.correct ? 1 : 0,
          items: [a],
        });
      }
    }
    const rows = [...groups.values()].map((g) => ({
      ...g,
      // Attempts are stored newest first, so reversing a group replays it in the order it was answered.
      items: [...g.items].reverse(),
      match: (journal.matches ?? []).find((m: any) => m.id === g.key) ?? null,
    }));
    for (const m of journal.matches ?? []) {
      if (!groups.has(m.id))
        rows.push({ key: m.id, surface: 'duel', at: m.at, n: 0, correct: 0, items: [], match: m });
    }
    return rows.sort((a, b) => b.at - a.at).slice(0, 20);
  }, [attempts, journal.matches]);

  const dueIds: string[] = dueToday(journal, now, REVIEW_CAP);
  const dueTotal: number = dueToday(journal, now, Infinity).length;
  const dueSet = new Set(dueIds);
  const dueEntries = dueIds.map((id) => entries.find((e) => e.factId === id)).filter((e): e is Entry => !!e);
  const shaky = entries.filter(
    (e) => e.record && e.record.seen > 0 && e.record.lastCorrect === false && !dueSet.has(e.factId ?? ''),
  );
  const met = entries.length;
  const retired = entries.filter((e) => e.record?.retiredAt).length;
  const audit = nextAudit(journal, now);
  // §3.6's single claim tile, computed from the two write-once fields and never from `attempts`.
  const missed = Object.values(records).filter((f) => f?.firstMissAt).length;
  const recovered = Object.values(records).filter((f) => f?.recoveredAt).length;

  const matches = (e: Entry) => {
    const r = e.record;
    switch (filter) {
      case 'saved':
        return journal.saved.includes(e.fact.question);
      case 'sports':
      case 'science':
        return (TOPIC_DOMAINS as any)[e.fact.topic] === filter;
      case 'due':
        return dueSet.has(e.factId ?? '');
      case 'wrong':
        return r?.lastCorrect === false;
      case 'bold':
        return (r?.boldWrong ?? 0) > 0;
      case 'fresh':
        return (r?.bySurface?.recall ?? 0) === 0;
      default:
        return true;
    }
  };
  const counts: Record<string, number> = Object.fromEntries(FILTERS.map((f) => [f.id, 0]));
  for (const e of entries) {
    counts.all += 1;
    if (journal.saved.includes(e.fact.question)) counts.saved += 1;
    if ((TOPIC_DOMAINS as any)[e.fact.topic] === 'sports') counts.sports += 1;
    if ((TOPIC_DOMAINS as any)[e.fact.topic] === 'science') counts.science += 1;
    if (dueSet.has(e.factId ?? '')) counts.due += 1;
    if (e.record?.lastCorrect === false) counts.wrong += 1;
    if ((e.record?.boldWrong ?? 0) > 0) counts.bold += 1;
    if ((e.record?.bySurface?.recall ?? 0) === 0) counts.fresh += 1;
  }
  const shown = entries.filter(matches);
  const current = deck[index];
  /** A fact only earns XP the first time it is opened — mirror that in the float text. */
  const awards = (fact: any, field: 'opened' | 'recalled') => {
    const entry = fact?.factId ? passport?.facts?.[fact.factId] : null;
    return !!entry && entry[field] !== true;
  };
  /** One row of any of the three fact lists. */
  const row = (e: Entry) => (
    <FactEntry
      key={e.key}
      entry={e}
      saved={journal.saved.includes(e.fact.question)}
      openAwards={awards(e.fact, 'opened')}
      attempts={(e.factId ? byFact.get(e.factId) : null) ?? NO_ATTEMPTS}
      now={now}
      onOpen={onOpen}
      onSave={onSave}
      onReview={onReview}
      press={press}
    />
  );

  useEffect(() => {
    setStudy(false);
    setChoice(null);
    setRevealed(false);
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
    // The next time any card from this deck comes back. Read after the dispatches have landed, so it is
    // the schedule the player just wrote rather than the one they started with.
    const nextLook = deck
      .map((f: any) => records[f.factId]?.due ?? 0)
      .filter((d) => d > now)
      .sort((a, b) => a - b)[0];
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
              {wrapped ? 'Session complete.' : 'Take your time.'}
            </h1>
            <span className="fd-tag fd-tag--cool">
              <Brain />
              {wrapped ? `${deck.length} cards` : `${index + 1} / ${deck.length}`}
            </span>
          </div>
          <p className="fd-lede">
            Answer first, then read the explanation and the source. Answering a card that was due moves it
            along the schedule; showing yourself the answer records the attempt and leaves the schedule where
            it is.
          </p>
        </header>
        {wrapped ? (
          <div className="fd-qwrap">
            <div className="fd-summary">
              <span className="fd-summary__ring">
                {remembered}/{deck.length}
              </span>
              <h2>
                {remembered} of {deck.length} came back.
              </h2>
              <p>
                {nextLook
                  ? `Next look: ${lookDate(nextLook, now)}.`
                  : 'Nothing from this deck has a next look booked.'}{' '}
                {remembered === deck.length
                  ? 'Every card in this deck came back to you.'
                  : 'The ones that slipped are due again tomorrow, with their explanation and source.'}
              </p>
              <div className="fd-summary__scores">
                <span className="fd-tag fd-tag--cool">
                  <Check />
                  {remembered} came back
                </span>
                <span className="fd-tag">
                  <X />
                  {deck.length - remembered} due again
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
                  answer(current, i, right, el);
                }}
              />
              {choice === null && (
                <details
                  className="fd-disclose"
                  onToggle={(e) => {
                    if (e.currentTarget.open) setRevealed(true);
                  }}
                >
                  <summary onPointerDown={press}>
                    <ChevronRight className="fd-caret" aria-hidden="true" />
                    Just show me this one
                  </summary>
                  <div className="fd-disclose__body">
                    <p>
                      <b>Answer:</b> {current.correctAnswer}
                    </p>
                    <p>{current.explanation}</p>
                    <p className="fd-note">
                      This card is recorded as shown, so it keeps the schedule it already had.
                    </p>
                  </div>
                </details>
              )}
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
                  {revealed && <p className="fd-note">Answer shown first · schedule unchanged.</p>}
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
                          setRevealed(false);
                        }
                      }}
                    >
                      {last ? 'Finish session' : 'Next fact'}
                      <ArrowRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="fd-note">
              Same question, options reshuffled — that is memory for this card, not a test of the topic.
            </p>
          </div>
        )}
      </section>
    );
  }

  /**
   * One review answer. `review` writes the attempt, the aggregates and the box move in a single action,
   * and pays only when the card was genuinely due and the schedule actually moved — so the float waits
   * for the dispatch rather than promising XP the reducer may decline.
   */
  function answer(fact: any, i: number, right: boolean, el: HTMLButtonElement) {
    juice.burst(el, right ? 'correct' : 'wrong');
    const factId = typeof fact?.factId === 'string' ? fact.factId : null;
    if (!factId || !onReview) {
      onRecall(fact.id);
      if (awards(fact, 'recalled')) juice.floatText(el, `+${XP.recall} XP`);
      return;
    }
    const prior = records[factId];
    // The same predicate lib/progression.mjs reads off the before-profile: a finite due in the past,
    // and an attempt that was not shown to the player first.
    const pays = !revealed && !!prior && prior.due !== null && prior.due <= now;
    void onReview({
      factId,
      roundId: null,
      choice: i,
      chose: fact.options[i],
      correct: right,
      revealed,
    }).then((ok) => {
      if (ok && pays) juice.floatText(el, `+${right ? XP.reviewCorrect : XP.review} XP`);
    });
  }
  function leave() {
    setStudy(false);
    setChoice(null);
    setRevealed(false);
    setIndex(0);
    setResults([]);
    setWrapped(false);
  }
  function restart() {
    setIndex(0);
    setChoice(null);
    setRevealed(false);
    setResults([]);
    setWrapped(false);
  }
  function startPractice(cards: any[]) {
    if (!cards.length) return;
    restart();
    setDeck(cards);
    setStudy(true);
  }

  /* ---------------------------------------------------------------- Vault */
  return (
    <section className="fd-learn fd-vault">
      <header className="fd-learn__head">
        <p className="fd-eyebrow">YOUR VAULT · ON THIS DEVICE</p>
        <div className="fd-learn__title">
          <h1>Your history, on this device.</h1>
          {met > 0 && (
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
            </div>
          )}
        </div>
        <p className="fd-lede">
          Every fact you have answered, with your recent attempts on each. Kept in this browser, never sent
          anywhere. Meeting a fact is not the same as knowing it.
        </p>
        <div className="fd-stats">
          <StatTile icon={BookOpen} tone="cyan" value={met} label="Facts you have met" />
          <StatTile icon={Brain} tone="volt" value={dueTotal} label="Due for review" />
          <StatTile icon={Bookmark} tone="gold" value={counts.saved} label="Saved to revisit" />
        </div>
      </header>

      {!storageOK && (
        <p className="fd-alert">
          <TriangleAlert aria-hidden="true" />
          Device storage is unavailable. This vault will last only for this visit — export before you leave.
        </p>
      )}

      {missed > 0 && (
        <section className="fd-panel">
          <div className="fd-panel__head">
            <h2>Came back later</h2>
            <p>
              {recovered} of the {missed} facts you missed have since been answered correctly on a later day.
            </p>
          </div>
          <p className="fd-note">
            Same question, options reshuffled — that is memory for this card, not a test of the topic.
          </p>
        </section>
      )}

      {met === 0 ? (
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
        <>
          <section className="fd-panel" id="vault-due">
            <div className="fd-panel__head">
              <h2>Due today</h2>
              <p>
                {dueTotal > REVIEW_CAP
                  ? `${dueIds.length} of ${dueTotal} waiting · ${REVIEW_CAP} a day`
                  : `${dueIds.length} card${dueIds.length === 1 ? '' : 's'} · up to ${REVIEW_CAP} a day`}
              </p>
            </div>
            {dueEntries.length > 0 ? (
              <>
                <p className="fd-note">
                  Calls you made above Steady and missed come first, then anything you got wrong last time,
                  then whatever has waited longest.
                </p>
                <div className="fd-head-actions">
                  <button
                    type="button"
                    className="fd-btn fd-btn--primary"
                    onPointerDown={press}
                    onClick={() => startPractice(dueEntries.map((e) => e.fact))}
                  >
                    <Brain />
                    Review {dueEntries.length} card{dueEntries.length === 1 ? '' : 's'}
                  </button>
                </div>
                <div className="fd-facts">{dueEntries.map(row)}</div>
              </>
            ) : retired === met ? (
              <EmptyState
                icon={Check}
                title="Nothing is due."
                action={
                  <div className="fd-head-actions">
                    <a className="fd-btn" href="#vault-runs">
                      <History aria-hidden="true" />
                      Open Runs &amp; matches
                    </a>
                    <button
                      type="button"
                      className="fd-btn fd-btn--primary"
                      onPointerDown={press}
                      onClick={onPlay}
                    >
                      Meet new facts
                      <ArrowRight />
                    </button>
                  </div>
                }
              >
                All {met} facts you have met are retired from your review queue.
                {audit ? ` The next audit is ${shortDate(audit)}.` : ''} The queue is finite by design against
                the current bank.
              </EmptyState>
            ) : (
              <EmptyState icon={Check} title="Nothing is due right now.">
                Every card you have met has a later look booked. Browse Everything below whenever you like —
                reading a card never changes its schedule.
              </EmptyState>
            )}
          </section>

          {shaky.length > 0 && (
            <section className="fd-panel">
              <div className="fd-panel__head">
                <h2>Shaky</h2>
                <p>Wrong last time · not due yet</p>
              </div>
              <p className="fd-note">
                Here to browse, not to nag. These come back on their own when the schedule says so.
              </p>
              <div className="fd-facts">{shaky.slice(0, 12).map(row)}</div>
            </section>
          )}

          <section className="fd-panel">
            <div className="fd-panel__head">
              <h2>Everything</h2>
              <p>Last answered first</p>
            </div>
            <div className="fd-toolbar">
              <div className="fd-chips">
                {FILTERS.map((f) => (
                  <Chip
                    key={f.id}
                    active={filter === f.id}
                    count={counts[f.id]}
                    onClick={() => setFilter(f.id)}
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
              <>
                <div className="fd-head-actions">
                  <button
                    type="button"
                    className="fd-btn"
                    onPointerDown={press}
                    onClick={() => startPractice(shown.slice(0, REVIEW_CAP).map((e) => e.fact))}
                  >
                    <Brain />
                    Practise these {Math.min(shown.length, REVIEW_CAP)}
                  </button>
                </div>
                <div className="fd-facts">{shown.map(row)}</div>
              </>
            )}
          </section>
        </>
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

      {runs.length > 0 && (
        <section className="fd-panel" id="vault-runs">
          <div className="fd-panel__head">
            <h2>Runs &amp; matches</h2>
            <p>Last {runs.length} · newest first</p>
          </div>
          <div className="fd-issues">
            {runs.map((run: any) => (
              <details key={run.key} className="fd-issue">
                <summary onPointerDown={press}>
                  {run.match ? (
                    <span className="fd-wld" data-outcome={run.match.outcome} title={run.match.outcome}>
                      <span aria-hidden="true">{OUTCOME_LETTER[run.match.outcome] || '·'}</span>
                      <span className="sr-only">{run.match.outcome}</span>
                    </span>
                  ) : (
                    <Sparkles aria-hidden="true" width={15} height={15} />
                  )}
                  {run.match ? MODE_NAMES[run.match.mode] || run.match.mode : SURFACE_LABEL[run.surface]}
                  {run.match && <span className="fd-tag">{run.match.bot ? 'BOT' : 'Friend duel'}</span>}
                  <span className="fd-tag">
                    {run.n > 0
                      ? `${run.correct}/${run.n} · ${shortDate(run.at)}`
                      : `${run.match.scores[0]}–${run.match.scores[1]} · ${shortDate(run.at)}`}
                  </span>
                </summary>
                <div className="fd-disclose__body">
                  {run.items.length === 0 ? (
                    <p className="fd-note">
                      This match is older than the answers the vault keeps. Its result is still here; the
                      individual cards are not.
                    </p>
                  ) : (
                    <ol className="fd-matches">
                      {run.items.map((a: any) => (
                        <li className="fd-match" key={a.id}>
                          <span className="fd-wld" data-outcome={a.correct ? 'win' : 'loss'}>
                            <span aria-hidden="true">{a.correct ? '✓' : '✗'}</span>
                            <span className="sr-only">{a.correct ? 'correct' : 'wrong'}</span>
                          </span>
                          <span className="fd-match__name">
                            {(journal.cards ?? {})[a.factId]?.question ?? a.factId}
                            <span>
                              {a.chose ? `You picked: ${a.chose}` : 'No answer recorded'}
                              {a.revealed ? ' · answer shown first' : ''}
                            </span>
                          </span>
                          <span className="fd-match__score">
                            {a.confidence && (CONFIDENCE as any)[a.confidence] && (
                              <span>{(CONFIDENCE as any)[a.confidence].name}</span>
                            )}
                            <time dateTime={new Date(a.at).toISOString()}>{shortDate(a.at)}</time>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

/**
 * A fact card and, beneath it, the attempts the vault still holds for that fact — §3.6's per-fact
 * history. Counts and dates only: a four-option card has a 25% floor, so a percentage here would be
 * a claim the record cannot carry. Declared at module scope so a re-render never remounts the card
 * and closes a disclosure the player just opened.
 */
function FactEntry({
  entry,
  saved,
  openAwards,
  attempts,
  now,
  onOpen,
  onSave,
  onReview,
  press,
}: {
  entry: Entry;
  saved: boolean;
  openAwards: boolean;
  attempts: Attempt[];
  now: number;
  onOpen: (roundId: string) => void;
  onSave: (question: string) => void;
  onReview?: (attempt: ReviewAttempt) => Promise<boolean>;
  press: (e: React.PointerEvent) => void;
}) {
  const { fact, record } = entry;
  const trimmed = !!record && record.seen > attempts.length;
  return (
    <div style={ENTRY}>
      <FactCard
        fact={fact}
        saved={saved}
        openAwards={openAwards}
        reviewAwards={!!record && record.due !== null && record.due <= now}
        onOpen={onOpen}
        onSave={onSave}
        onReview={onReview}
      />
      {record && (
        <details className="fd-disclose">
          <summary onPointerDown={press}>
            <ChevronRight className="fd-caret" aria-hidden="true" />
            Your attempts ({attempts.length || record.seen})
          </summary>
          <div className="fd-disclose__body">
            {record.days > 0 && record.lastAt && (
              <p>
                Answered correctly on {record.days} separate day{record.days === 1 ? '' : 's'}, most recently{' '}
                {shortDate(record.lastAt)}.
              </p>
            )}
            {attempts.map((a) => (
              <p key={a.id} style={ATTEMPT_ROW}>
                {a.correct ? (
                  <Check aria-hidden="true" width={15} height={15} />
                ) : (
                  <X aria-hidden="true" width={15} height={15} />
                )}
                <span className="sr-only">{a.correct ? 'Correct' : 'Wrong'}</span>
                <span>{shortDate(a.at)}</span>
                <span className="fd-tag">{SURFACE_LABEL[a.surface] ?? a.surface}</span>
                {a.confidence && (CONFIDENCE as any)[a.confidence] && (
                  <span className="fd-tag">{(CONFIDENCE as any)[a.confidence].name}</span>
                )}
                {a.chose && <span>You picked: {a.chose}</span>}
              </p>
            ))}
            {trimmed && (
              <p className="fd-note">
                Showing your last {Math.min(attempts.length, ATTEMPTS_PER_FACT)} attempts · {record.seen}{' '}
                total.
              </p>
            )}
            <p className="fd-note">
              {record.retiredAt
                ? 'Retired from your review queue.'
                : isDue(record, now)
                  ? 'Due now.'
                  : record.due !== null
                    ? `Next look: ${lookDate(record.due, now)}.`
                    : 'No next look booked.'}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
