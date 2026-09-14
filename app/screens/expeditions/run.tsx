'use client';
/**
 * The expedition run: map rail, three-way stake switch, shape-coded answers, explanation card.
 *
 * Untimed surface, so entrances are allowed here (unlike the live duel question). All feedback goes
 * through `useJuice()`; the legacy `signal` prop is still accepted by the module but no longer used
 * for correct / learn / stamp so nothing double-fires.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ExternalLink,
  Flag,
  Flame,
  Pause,
  Shield,
  Target,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { reducedMotion, useJuice, useMounted } from '@/components/fx';
import { gatePress } from '@/lib/fx/press-gate';
import { CONFIDENCE, CONFIDENCE_ORDER, runResult, runTally } from '@/lib/expeditions.mjs';
import { XP, convictionRiskCalls, convictionRiskLanded, dayKey } from '@/lib/progression.mjs';
import { QuestionIssue } from '../../rivalry-widgets';
import { ExpeditionFinish } from './finish';
import { AnswerButton } from '../answer-button';
import { AnswerShape, RouteRail, useTap } from './parts';

/* Every number a stake announces is written with an ASCII hyphen-minus. U+2212 is announced as
 * nothing by NVDA and JAWS, which would turn "Called +4 / -3" into "Called plus 4 slash 3" — a bet
 * disclosed to sighted players only. It is allowed in aria-hidden display text and nowhere else. */
const STAKE_COPY: Record<string, string> = {
  steady:
    'Steady: +2 if you are right, 0 if you are not. No run points at risk — and the card still counts toward your Conviction average.',
  bold: 'Bold: +3 if you are right, -1 if you are not. Worth it above a coin flip.',
  called: 'Called: +4 if you are right, -3 if you are not. Worth it when you are two-thirds sure.',
};

/* The payout has to be in the accessible name: aria-pressed announces the toggle state and nothing
 * else, so without this a screen-reader user places a -3 call having never been told it risks
 * anything. Words, not glyphs, and the same three-part shape at every tier so the ear can compare. */
const STAKE_LABEL: Record<string, string> = {
  steady: 'Steady: plus 2 if right, no change if wrong',
  bold: 'Bold: plus 3 if right, minus 1 if wrong',
  called: 'Called: plus 4 if right, minus 3 if wrong',
};

const TIER_ICON: Record<string, typeof Shield> = { steady: Shield, bold: Flame, called: Target };

/* The loss lines price the call truthfully and then point at the thing that just became valuable: a
 * high-confidence miss is the most correctable error there is, which is what the Vault is for. */
const VERDICT: Record<string, { correct: string; wrong: string }> = {
  steady: {
    correct: 'That’s the one. +2',
    wrong: 'A fact for the vault. 0 points - you called it Steady.',
  },
  bold: { correct: 'Called it. +3', wrong: 'Bold, and wrong. -1. The fact is yours now.' },
  called: {
    correct: 'You knew it. +4',
    wrong:
      'Called, and wrong. -3. That is the price of the call - and this is the card most worth re-reading.',
  },
};

export function ExpeditionRun({
  route,
  record,
  player,
  onReplay,
  busy,
  onDone,
  onDuel,
  onVault,
}: {
  route: any;
  record: any;
  player: any;
  onReplay: () => void;
  busy: boolean;
  onDone: () => void;
  onDuel: () => void;
  /** Navigate to the Vault. Absent = the finish screen re-reads the misses where they already are. */
  onVault?: () => void;
}) {
  const juice = useJuice();
  const tap = useTap();
  const run = record.run,
    index = run.cursor,
    fact = run.cards[index],
    answer = run.answers[index],
    result = runResult(run);
  const [confidence, setConfidence] = useState('steady'),
    [writing, setWriting] = useState(false),
    [issueOpen, setIssueOpen] = useState(false);
  const locked = useRef(false),
    heading = useRef<HTMLHeadingElement | null>(null),
    focusKey = useRef(''),
    burstTarget = useRef<Element | null>(null),
    card = useRef<HTMLDivElement | null>(null),
    feedback = useRef<HTMLDivElement | null>(null),
    nextButton = useRef<HTMLButtonElement | null>(null),
    optionRefs = useRef<(HTMLButtonElement | null)[]>([]),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Answers already on screen when this run mounted have had their feedback: never replay them.
  const celebrated = useRef(new Set<number>(run.answers.map((_: any, i: number) => i)));
  const finished = useRef(index === 6);
  /* The R1 ledger as it stood when this run mounted. By the time the result effect runs, the answer
   * has already pushed its fact into `counted`, so the live array can never say "first encounter". */
  const seen = useRef(new Set<string>(player.progression?.conviction?.counted ?? []));
  // Dates are local: only day-key in the browser so SSR and hydration agree. Empty hides the fold.
  const today = useMounted() ? (dayKey(Date.now()) as string) : '';

  /* The stake switch gets the neutral `detent`, never `select`: the three tiers must sound
   * identical, because a tier that sounds like a small win is the app paying you to bet. */
  const detent = useCallback(
    (event?: unknown) =>
      gatePress(event, () => {
        juice.sound('detent');
        juice.haptic('light');
      }),
    [juice],
  );

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  // Result juice, fired once per answer as it lands in the profile (never on re-render or resume).
  useEffect(() => {
    run.answers.forEach((a: any, i: number) => {
      if (celebrated.current.has(i)) return;
      celebrated.current.add(i);
      const hit = a.choice === run.cards[i].correctIndex;
      const target = burstTarget.current ?? card.current;
      burstTarget.current = null;
      if (!target) return;
      if (hit) {
        juice.burst(target, 'correct');
        /* R2: per-card XP is identical at every tier, so the float never reads `a.confidence`.
         * R1 is the only thing that moves it — a fact already in the ledger pays the repeat rate. */
        const xp = seen.current.has(run.cards[i].factId) ? XP.expeditionRepeat : XP.expeditionCorrect;
        timers.current.push(setTimeout(() => juice.floatText(target, `+${xp} XP`), 150));
      } else {
        juice.burst(target, 'wrong');
      }
    });
  }, [run.answers, run.cards, juice]);

  useEffect(() => {
    setConfidence('steady');
    locked.current = false;
    setIssueOpen(false);
  }, [index]);

  const answered = !!answer;
  // Bring the explanation (and its Next button) into the thumb zone once an answer lands.
  useEffect(() => {
    if (!answered) return;
    const t = setTimeout(() => {
      // Scroll the Next button itself clear of the bottom tab bar: scrolling the feedback block
      // left the CTA under the nav, where a tap hit a nav tab instead.
      (nextButton.current ?? feedback.current)?.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'end',
      });
    }, 280);
    return () => clearTimeout(t);
  }, [answered, index]);
  useEffect(() => {
    const key = `${index}:${answered}`;
    if (focusKey.current === key) return;
    focusKey.current = key;
    heading.current?.focus();
  }, [index, answered]);

  /* 1–4 answers this card, the way it does in the room — the buttons advertise the key, so it has
   * to work. Clicking the button is what actually answers: the key just forwards to it. */
  const keyable = !answered && !writing && player.loaded;
  useEffect(() => {
    if (!keyable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
      const i = Number(e.key) - 1;
      if (!Number.isInteger(i) || i < 0 || i > 3) return;
      const button = optionRefs.current[i];
      if (!button || button.disabled) return;
      e.preventDefault();
      burstTarget.current = button;
      button.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyable, index]);

  async function act(type: string, extra: any = {}) {
    if (locked.current || !player.loaded) return;
    locked.current = true;
    setWriting(true);
    try {
      await player.dispatch({
        type,
        routeId: route.id,
        runId: run.id,
        index,
        epoch: player.profile.epoch,
        ...extra,
      });
      /* Measurement (lib/analytics.mjs): one expedition card, counted where the card is actually
       * answered. `locked` guards re-entrancy and the options are disabled once the card is
       * answered, so this runs once per card and never on a re-render. */
      if (type === 'journey-answer') player.noteCount({ cards: 1 });
    } finally {
      locked.current = false;
      setWriting(false);
    }
  }

  /* Fold is the honest exit from a run you are not enjoying: it costs nothing, keeps every card
   * already resolved, and frees the route for a fresh start. The run id travels with it so a button
   * left on screen across a restart cannot end the run that replaced it. */
  async function foldRun() {
    if (locked.current || !player.loaded) return;
    locked.current = true;
    setWriting(true);
    try {
      if (await player.fold(route.id, run.id)) onDone();
    } finally {
      locked.current = false;
      setWriting(false);
    }
  }

  if (index === 6)
    return (
      <ExpeditionFinish
        route={route}
        record={record}
        result={result}
        run={run}
        busy={busy}
        loaded={player.loaded}
        progression={player.progression}
        firstRun={!finished.current && record.completions === 1}
        onDone={onDone}
        onDuel={onDuel}
        onReplay={onReplay}
        onVault={
          onVault &&
          (async (deck) => {
            /* Every profile write on this surface is dispatched from the run, so the seed is too. It
               is awaited before the route changes: the Vault reads its queue out of the profile, and
               a navigation that raced the write would land on a queue that does not hold these yet. */
            try {
              await player.seedReview(deck);
            } catch {
              /* The dispatcher already surfaces a failed write as `player.storageError`; the player
                 asked to go to the Vault, so the route still opens rather than the button dying. */
            }
            onVault();
          })
        }
      />
    );

  const correct = answer?.choice === fact.correctIndex,
    roundId = `journey:${run.id}:${index}`,
    chapter = Math.floor(index / 2),
    active = answer?.confidence || confidence,
    goal = index >= 4,
    saved = player.journal.saved.includes(fact.question);
  /* Calls landed comes from the tally, not from `result.bold`: that key is the bold-TIER count and
   * has been since before Called existed. */
  const tally = runTally(run),
    callsMade = tally.bold.n + tally.called.n,
    callsLanded = tally.bold.correct + tally.called.correct;
  const conviction = player.progression?.conviction ?? null,
    riskCalls = conviction ? convictionRiskCalls(conviction) : 0,
    riskLanded = conviction ? convictionRiskLanded(conviction) : 0;
  /* From card 2 onward, once today's fold on this route is unused — the day cap is what keeps fold
   * from being a four-second one-card loop. */
  const foldable =
    index >= 1 && run.answers.length >= 1 && !record.folded && today !== '' && record.foldedDay !== today;

  return (
    <div className={`fd-exp-run${goal ? ' is-goal' : ''}`} ref={card}>
      <div className="fd-exp-run-top">
        <div>
          <p className="fd-exp-eyebrow">{route.title}</p>
          <h1>{route.chapters[chapter]}</h1>
        </div>
        {/* No running signed total: at -9 with three cards left it reads as a hole only Called can
         * dig you out of, which is chasing pressure manufactured by a number rather than a rule.
         * The signed score appears once, on the scorecard, where the calibration block frames it. */}
        <div className="fd-exp-runscore">
          <div className="fd-exp-runstat">
            <span>CARDS RIGHT</span>
            <strong className="fd-mono">
              {result.correct} / {run.answers.length}
            </strong>
          </div>
          <div className="fd-exp-runstat">
            <span>CALLS LANDED</span>
            <strong className="fd-mono">
              {callsLanded} / {callsMade}
            </strong>
          </div>
        </div>
      </div>

      <RouteRail route={route} cursor={index} variant="rail" />

      <div className="fd-exp-question">
        <div className="fd-exp-qmeta">
          <span className="fd-mono">CARD {index + 1} / 6</span>
          <span>{['Opening level', 'Deeper cut', 'Final detail'][chapter]}</span>
        </div>
        <h2 ref={heading} tabIndex={-1}>
          {fact.question}
        </h2>

        <fieldset className="fd-exp-conf" disabled={!!answer || writing || !player.loaded}>
          <legend>How well do you know this one?</legend>
          <p className="fd-exp-stake-line fd-exp-stake-note">
            Call it. Steady +2 / 0 · Bold +3 / -1 · Called +4 / -3.
            <br />
            Points in this run only. Nothing is spent and nothing can be bought.
          </p>
          {/* The tier order is CONFIDENCE_ORDER's, never the key order of the frozen object. */}
          <div className="fd-exp-switch" data-on={active}>
            <span className="fd-exp-switch-thumb" aria-hidden="true" />
            {(CONFIDENCE_ORDER as string[]).map((id) => {
              const Icon = TIER_ICON[id];
              return (
                <button
                  type="button"
                  key={id}
                  className="fd-exp-switch-btn"
                  aria-pressed={active === id}
                  aria-label={STAKE_LABEL[id]}
                  onPointerDown={detent}
                  onClick={() => setConfidence(id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {(CONFIDENCE as any)[id].name}
                </button>
              );
            })}
          </div>
          <p className="fd-exp-stake-line" aria-live="polite">
            {STAKE_COPY[active]}
          </p>
          {/* Never a nudge, and never a suggested tier: before there is a record to show, the line
           * says what the menu is for; after, it shows the player their own number. */}
          <p className="fd-exp-stake-line fd-exp-stake-calls">
            {riskCalls < 5
              ? 'Called pays most when you are sure. There is nothing here for bluffing.'
              : `Your Bold and Called cards so far: ${riskLanded} of ${riskCalls} right.`}
          </p>
        </fieldset>

        <div className="fd-exp-answers">
          {fact.options.map((option: string, i: number) => {
            const chosen = answer?.choice === i;
            const isKey = !!answer && i === fact.correctIndex;
            return (
              <AnswerButton
                key={`${index}-${i}`}
                buttonRef={(el) => {
                  optionRefs.current[i] = el;
                }}
                index={i}
                label={option}
                className={`fd-exp-answer o${i + 1}${chosen ? ' is-chosen' : ''}${
                  isKey ? ' is-key' : ''
                }${answer && !chosen && !isKey ? ' is-dim' : ''}`}
                textClassName="fd-exp-answer-text"
                glyph={<AnswerShape index={i} />}
                hint
                style={{ animationDelay: `${i * 45}ms` }}
                disabled={!!answer || writing || !player.loaded}
                chosen={chosen}
                state={answer ? (isKey ? 'correct' : chosen ? 'wrong' : 'muted') : 'live'}
                onPointerDown={(e) => {
                  burstTarget.current = e.currentTarget;
                  tap();
                }}
                onClick={() => void act('journey-answer', { choice: i, confidence })}
                end={
                  <>
                    {isKey && <Check size={19} aria-hidden="true" className="fd-exp-answer-mark" />}
                    {chosen && !isKey && <X size={19} aria-hidden="true" className="fd-exp-answer-mark" />}
                  </>
                }
              />
            );
          })}
        </div>

        {!answer && (
          <p className="fd-exp-contract-line">
            {goal
              ? index === 5
                ? 'Last card. Answer it to finish the route and collect your stamp.'
                : 'Two cards from the stamp. Keep going.'
              : 'Your first answer locks. No timer — take your time.'}
          </p>
        )}

        {answer && (
          <div ref={feedback} className={`fd-exp-feedback${correct ? ' is-correct' : ' is-wrong'}`}>
            <div className="fd-exp-feedback-top" role="status">
              <strong>{VERDICT[answer.confidence][correct ? 'correct' : 'wrong']}</strong>
              <span className="fd-mono">{(CONFIDENCE as any)[answer.confidence].name}</span>
            </div>
            <p className="fd-exp-key">
              <b>Correct answer:</b> {fact.options[fact.correctIndex]}
            </p>
            <details
              className="fd-exp-why"
              onToggle={(e) => {
                if (e.currentTarget.open) player.open(roundId);
              }}
            >
              <summary onPointerDown={tap}>
                <BookOpen size={17} aria-hidden="true" />
                Why this answer?
              </summary>
              <p>{fact.explanation}</p>
            </details>
            <div className="fd-exp-tools">
              <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" onPointerDown={tap}>
                <ExternalLink size={15} aria-hidden="true" />
                {fact.sourceLabel}
              </a>
              <button
                type="button"
                aria-pressed={saved}
                className={saved ? 'is-on' : ''}
                onPointerDown={tap}
                onClick={() => player.save(fact.question)}
              >
                <Bookmark size={16} aria-hidden="true" />
                {saved ? 'Saved' : 'Save fact'}
              </button>
              <button type="button" onPointerDown={tap} onClick={() => setIssueOpen(true)}>
                <Flag size={16} aria-hidden="true" />
                Flag a concern
              </button>
            </div>
            {index === 0 && (
              <p className="fd-exp-endowed">
                <Check size={15} aria-hidden="true" />
                Camp 1 reached — you are on the map.
              </p>
            )}
            {index % 2 === 1 && (
              <p className="fd-exp-endowed">
                <Check size={15} aria-hidden="true" />
                {index === 5
                  ? 'All six cards answered. Finish to collect your stamp.'
                  : `Chapter ${chapter + 1} complete. Next: ${route.chapters[chapter + 1]}.`}
              </p>
            )}
            <button
              type="button"
              ref={nextButton}
              className="fd-exp-primary fd-exp-next"
              disabled={writing || !player.loaded}
              onPointerDown={tap}
              onClick={() => void act('journey-next')}
            >
              {writing
                ? 'Saving…'
                : index === 5
                  ? 'Finish & collect stamp'
                  : index % 2 === 1
                    ? `Begin chapter ${chapter + 2}`
                    : 'Next card'}
              {index === 5 ? (
                <Trophy size={19} aria-hidden="true" />
              ) : (
                <ArrowRight size={19} aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="fd-exp-pause">
        <button
          type="button"
          className="fd-exp-ghost"
          disabled={writing}
          onPointerDown={tap}
          onClick={onDone}
        >
          <Pause size={16} aria-hidden="true" />
          Pause expedition
        </button>
        {foldable && (
          <button
            type="button"
            className="fd-exp-ghost"
            disabled={writing || !player.loaded}
            onPointerDown={tap}
            onClick={() => void foldRun()}
          >
            <XCircle size={16} aria-hidden="true" />
            Fold this run
          </button>
        )}
        <span>
          {player.persistent
            ? 'Each answer saves in this browser.'
            : 'Visit-only progress. Export before leaving.'}
        </span>
        {foldable && (
          <span>
            Folding ends this run and frees the route. The cards you have answered keep their XP and their
            place in your Vault; there is no stamp. Once per route per day.
          </span>
        )}
      </div>

      <QuestionIssue
        open={issueOpen}
        onOpenChange={setIssueOpen}
        fact={fact}
        roundId={roundId}
        player={player}
      />
    </div>
  );
}
