'use client';
/**
 * Expedition finish — stamp, scorecard, calibration read-back, first-vs-best, recap.
 *
 * The stamp ceremony is opened through `useJuice()` with the 3D stamp medal in the slot; it closes
 * with Escape or Continue (handled by `<Ceremony>`), leaving the scorecard behind it.
 *
 * It opens on a first completion ONLY when the run did not finish below zero. With a -18 floor a
 * player who called Called on all six and missed all six would otherwise get a gold `aria-modal`
 * announcing a stamp and a run score of -18: a win-shaped ceremony minted by losing. The stamp
 * itself is still unconditional — what is conditional is the celebration around it, which below
 * zero becomes an inline cyan block and the `kept` cue.
 */
import { useEffect, useMemo, useRef } from 'react';
import { BookOpen, Check, ExternalLink, RotateCcw, Stamp, Swords, X } from 'lucide-react';
import { NumberCounter, reducedMotion, useFx, useJuice } from '@/components/fx';
import { LazyRewardMedal } from '@/components/three';
import { CONFIDENCE, CONFIDENCE_ORDER, runTally } from '@/lib/expeditions.mjs';
import {
  CONVICTION_TIERS,
  convictionCalls,
  convictionRiskCalls,
  convictionRiskLanded,
  XP,
} from '@/lib/progression.mjs';
import type { SeedEntry } from '../../use-player';
import { ExpeditionStamp, signed, useTap } from './parts';

/* Cyan token value: the 3D scene takes a colour, not a CSS variable. */
const CYAN = '#4ee1ff';

type Count = { n: number; correct: number };
type Tally = Record<string, Count>;
type Tier = { id: string; label: string; min: number };
type Stake = { name: string; correct: number; wrong: number; order: number };
type LogLine = { at: number; kind: string; meta?: { to?: string; rating?: number } };

/* The frozen tables come back from the .mjs modules as readonly unknown[] / unknown; this is the same
 * narrowing `rankTiers` does in use-progression-feedback, done once instead of at every use. */
const TIERS = CONVICTION_TIERS as readonly Tier[];
const PAY = CONFIDENCE as Record<string, Stake>;

/* Every count on this screen is 0..6, so the copy reads as prose rather than as a dashboard. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const word = (n: number) => WORDS[n] ?? String(n);
const sentence = (s: string) => s[0].toUpperCase() + s.slice(1);

const tierPoints = (id: string, t: Count) => t.correct * PAY[id].correct + (t.n - t.correct) * PAY[id].wrong;

/**
 * The right-hand column of the calibration block. Steady risks no run points, so a signed number
 * there reads as a payout for declining; when every Steady card landed the honest verdict is the
 * calibration fact itself. Bold and Called show the swing they actually caused.
 */
function verdict(id: string, t: Count) {
  if (!t.n) return 'not used';
  if (id === 'steady' && t.correct === t.n) return 'calibrated';
  return signed(tierPoints(id, t));
}

/**
 * The break-even hit rate for calling a card at tier `i` instead of the tier one step below it: the
 * p at which the two stakes pay the same, read off the stake table itself so a re-tune of §1.2 moves
 * it rather than leaving a stale literal here. Steady 0, Bold 1/2, Called 2/3 — the crossovers the
 * stake copy advertises. Returned as a ratio so the comparison stays integer-exact (2/3 of six cards
 * is four, not 3.9999999999999996); a table with no crossover comes back with `den` 0, which no run
 * with a miss in it can clear.
 */
function breakEven(i: number): { num: number; den: number } {
  if (i <= 0) return { num: 0, den: 1 };
  const b = PAY[CONFIDENCE_ORDER[i]];
  const a = PAY[CONFIDENCE_ORDER[i - 1]];
  const num = b.wrong - a.wrong;
  const den = a.correct - a.wrong - b.correct + b.wrong;
  if (den === 0) return { num: 1, den: 0 };
  return den < 0 ? { num: -num, den: -den } : { num, den };
}

/**
 * The calibration read-back line, §6.5. Exported because it is the one claim on this screen made
 * about the *player* rather than about a number, and it has to be provable from the tally alone.
 *
 * The trap it is written around: `n === correct` is satisfied *vacuously* by a tier with no cards,
 * so "every tier below the miss was clean" used to be true of a run that never played one. A player
 * who called Called on all six and missed all six — the single most miscalibrated run the game
 * allows, and a -18 floor score — was told "You were right about what you knew", the one thing the
 * evidence rules out, on the surface whose whole job is calibration honesty (§6.6 bans propping
 * esteem in exactly this state). So the praise branch now needs evidence for the claim: either a
 * lower tier was actually played and came back clean, or the tier that missed still cleared the hit
 * rate that made calling it the right bet. Neither holds for an all-Called 0/6 or an all-Bold 0/6,
 * both of which fall through to the true line; both hold for the §6.5 worked example and for a 5-of-6
 * Called run, which keep theirs.
 */
export function calibrationRead(tally: Tally): string {
  const above = tally.bold.n + tally.called.n;
  const misses = CONFIDENCE_ORDER.reduce((n: number, id: string) => n + tally[id].n - tally[id].correct, 0);
  /* The misses are what the player can act on, so the line has to be true about where they landed:
   * "your calls ran ahead" is false when every miss was a Steady card, and both spec branches are
   * false at 6/6. */
  const missTier = CONFIDENCE_ORDER.reduce(
    (top: number, id: string, i: number) => (tally[id].n > tally[id].correct ? i : top),
    -1,
  );
  const clean = (id: string) => tally[id].n === tally[id].correct;
  const lowerPlayed = CONFIDENCE_ORDER.slice(0, missTier).some((id: string) => tally[id].n > 0);
  const missed = missTier >= 0 ? tally[CONFIDENCE_ORDER[missTier]] : { n: 0, correct: 0 };
  const rate = breakEven(missTier);
  const heldItsOwnTier = missed.correct * rate.den >= rate.num * missed.n;
  const earned = lowerPlayed || heldItsOwnTier;
  const lowerClean =
    missTier > 0 &&
    earned &&
    CONFIDENCE_ORDER.slice(0, missTier).every(clean) &&
    CONFIDENCE_ORDER.slice(missTier + 1).every(clean);
  const missLabel = missTier >= 0 ? PAY[CONFIDENCE_ORDER[missTier]].name : '';
  const missCount = missed.n - missed.correct;
  return misses === 0
    ? 'Every card landed. Your calls and what you knew agreed on all six.'
    : above === tally.bold.correct + tally.called.correct
      ? `You did not over-call a single card. ${sentence(word(misses))} of the six ${misses === 1 ? 'is' : 'are'} worth a second look.`
      : lowerClean
        ? `You were right about what you knew — and right about what you did not. The ${word(missCount)} ${missLabel} card${missCount === 1 ? '' : 's'} that missed ${missCount === 1 ? 'is the fact' : 'are the facts'} worth re-reading.`
        : `Your calls ran ahead of what you knew this time. ${sentence(word(misses))} of the six ${misses === 1 ? 'is' : 'are'} worth a second look.`;
}

export function ExpeditionFinish({
  route,
  record,
  result,
  run,
  busy,
  loaded,
  firstRun,
  progression,
  onDone,
  onDuel,
  onReplay,
  onVault,
}: {
  route: any;
  record: any;
  result: { score: number; correct: number; bold: number };
  run: any;
  busy: boolean;
  loaded: boolean;
  firstRun: boolean;
  /** `player.progression`, for the §6.8 promotion block. Absent = the block simply never renders. */
  progression?: any;
  onDone: () => void;
  onDuel: () => void;
  onReplay: () => void;
  /**
   * Seed this deck into the review queue and route to the Vault. The deck travels with the call so
   * the seed is precisely the cards this run missed, in the order they are worth re-reading.
   * Absent = the misses are re-read in place, in the recap below.
   */
  onVault?: (deck: SeedEntry[]) => void | Promise<void>;
}) {
  const juice = useJuice();
  const fx = useFx();
  const tap = useTap();
  const heading = useRef<HTMLHeadingElement | null>(null);
  const opened = useRef(false);
  const myId = useRef<string | null>(null);
  const seen = useRef(false);
  const attempts = useRef(0);
  const calibration = useRef<HTMLElement | null>(null);
  const recap = useRef<HTMLElement | null>(null);
  const settled = useRef(false);
  const rang = useRef(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const tally: Tally = useMemo(() => runTally(run), [run]);
  const above = tally.bold.n + tally.called.n;
  const misses = CONFIDENCE_ORDER.reduce((n: number, id: string) => n + tally[id].n - tally[id].correct, 0);
  const cool = result.score < 0;

  const completionXp =
    XP.expeditionComplete + Math.max(0, result.score) * XP.expeditionScorePoint + XP.expeditionStamp;

  /* The stamp ceremony, once, on a first completion that did not finish below zero. `<FxProvider>`
   * shows one ceremony at a time and a new one REPLACES the open one, so: wait for a free overlay
   * (the same finish can also trigger a level-up from useProgressionFeedback), and if ours is
   * replaced before it ever reached the screen, arm it again. */
  const active = fx?.ceremony ?? null;
  const busyOverlay = !!active;
  useEffect(() => {
    if (!myId.current) return;
    if (active?.id === myId.current) seen.current = true;
    else if (!seen.current && attempts.current < 3) {
      myId.current = null;
      opened.current = false;
    }
  }, [active]);

  useEffect(() => {
    if (opened.current || !firstRun || cool || busyOverlay) return;
    const t = setTimeout(() => {
      if (opened.current) return;
      opened.current = true;
      attempts.current += 1;
      myId.current = juice.ceremony({
        kind: 'stamp',
        kicker: 'STAMP COLLECTED',
        title: route.stamp,
        subtitle: `${route.title} · ${result.correct}/6 correct`,
        rewards: [
          { label: 'Run score', value: signed(result.score) },
          { label: 'Completion XP', icon: '⚡', value: `+${completionXp}` },
        ],
        continueLabel: 'See your scorecard',
        slot: <LazyRewardMedal variant="stamp" accent={CYAN} replayKey={route.id} size={1.15} height={132} />,
      });
    }, 280);
    return () => clearTimeout(t);
  }, [
    firstRun,
    cool,
    busyOverlay,
    juice,
    completionXp,
    route.stamp,
    route.title,
    route.id,
    result.score,
    result.correct,
  ]);

  /* Below zero the beat is `settle` — one cyan ring and the `kept` cue, trimmed under `win`. It is
   * the quietest thing in the vocabulary that is still a beat, which is the whole point. */
  useEffect(() => {
    if (!cool || settled.current) return;
    settled.current = true;
    const t = setTimeout(() => juice.settle(calibration.current ?? undefined), 280);
    return () => clearTimeout(t);
  }, [cool, juice]);

  /* A conviction promotion can only land mid-run, so the reducer logs it and this screen reports it.
   * Never a ceremony: a full-screen gold overlay next to the following stake choice is escalation
   * reinforcement, and the overlay would ambush the player on whatever screen came next anyway. */
  const promotion = useMemo(() => {
    const log = progression?.log as LogLine[] | undefined;
    if (!Array.isArray(log)) return null;
    const entry = log.find(
      (e) => e.kind === 'rank' && TIERS.some((t) => t.id === e.meta?.to) && e.at >= run.startedAt,
    );
    const c = progression?.conviction;
    if (!entry || !c) return null;
    const tier = TIERS.find((t) => t.id === entry.meta?.to) as Tier;
    return {
      label: tier.label,
      rating: Number.isFinite(entry.meta?.rating) ? (entry.meta?.rating as number) : null,
      landed: convictionRiskLanded(c),
      riskCalls: convictionRiskCalls(c),
      calls: convictionCalls(c),
    };
  }, [progression, run.startedAt]);

  useEffect(() => {
    if (!promotion || rang.current) return;
    rang.current = true;
    juice.sound('unlock', { gain: 0.8 });
  }, [promotion, juice]);

  /* The deck §3.5 hands the Vault: the factIds this run missed, each carrying the `order` of the
   * tier it was called at. The order is what lets the deck put the calls above Steady first — a
   * confident miss is the highest-value card in the queue — without this screen ranking tiers itself
   * or the schedule module ever having to learn what a tier is. */
  const missedDeck: SeedEntry[] = useMemo(() => {
    const deck: SeedEntry[] = [];
    run.cards.forEach((f: { factId: string; correctIndex: number }, i: number) => {
      const answer = run.answers[i];
      if (answer && answer.choice !== f.correctIndex)
        deck.push({ factId: f.factId, order: PAY[answer.confidence]?.order ?? 0 });
    });
    return deck;
  }, [run]);

  /** No Vault route threaded in? The six cards are already on this screen — open the missed ones. */
  const reRead = () => {
    // Seeds first, navigates second: the deck is the whole point of the button, and a Vault opened
    // before the write landed would show yesterday's queue. No XP is paid for pressing it — §3.5 —
    // because reading an answer is not answering it.
    if (onVault) return void onVault(missedDeck);
    const node = recap.current;
    if (!node) return;
    node.querySelectorAll('details[data-miss="1"]').forEach((d) => d.setAttribute('open', ''));
    node.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };
  const vaultLabel = onVault
    ? `Take your ${word(misses)} miss${misses === 1 ? '' : 'es'} to the Vault`
    : `Re-read ${misses === 1 ? 'that one' : `those ${word(misses)}`}`;

  const first = record.first ?? result;
  const best = record.best ?? first;
  const repeat = record.completions > 1;

  const read = calibrationRead(tally);

  return (
    <div className="fd-exp-finish">
      <div className={`fd-exp-award${cool ? ' is-cool' : ''}`}>
        <ExpeditionStamp route={route} earned />
        <p className="fd-exp-eyebrow">EXPEDITION COMPLETE</p>
        <h1 ref={heading} tabIndex={-1}>
          {route.stamp}
        </h1>
        <p className="fd-exp-lede">
          {record.completions === 1 ? 'A new story in your collection.' : 'Another practice run, complete.'}
        </p>
        <span className="fd-exp-earned">
          <Check size={16} aria-hidden="true" />
          {record.completions === 1 ? 'Stamp earned' : 'Stamp already collected'}
        </span>
      </div>

      {firstRun && cool && (
        <section className="fd-keep fd-exp-kept" aria-labelledby="fd-exp-kept-head">
          <p className="fd-keep-kicker" id="fd-exp-kept-head">
            STAMP COLLECTED
          </p>
          <h2 className="fd-keep-title">{route.stamp}</h2>
          <ul className="fd-keep-list">
            <li style={{ ['--fd-keep-i' as string]: '0' }}>
              {route.title} · {result.correct}/6 correct
            </li>
            <li style={{ ['--fd-keep-i' as string]: '1' }}>+{completionXp} XP for finishing the route</li>
            <li style={{ ['--fd-keep-i' as string]: '2' }}>
              The stamp is for completing it, not for the score.
            </li>
          </ul>
        </section>
      )}

      <div className="fd-exp-scorecard">
        <div>
          <span>THIS RUN</span>
          <strong className="fd-mono">
            <NumberCounter
              value={result.score}
              from={0}
              duration={900}
              format={(n) => signed(Math.round(n))}
            />
            <small>points</small>
          </strong>
        </div>
        <div>
          <span>CORRECT</span>
          <strong className="fd-mono">
            <NumberCounter value={result.correct} from={0} duration={700} />
            <small>/ 6</small>
          </strong>
        </div>
        <div>
          <span>CALLS ABOVE STEADY</span>
          <strong className="fd-mono">
            <NumberCounter value={above} from={0} duration={700} />
            <small>/ 6</small>
          </strong>
        </div>
      </div>

      <section className="fd-keep fd-exp-calib" ref={calibration} aria-labelledby="fd-exp-calib-head">
        <p className="fd-keep-kicker" id="fd-exp-calib-head">
          YOUR CALL vs THE CARDS
        </p>
        <ul className="fd-exp-calib-rows">
          {CONFIDENCE_ORDER.map((id: string, i: number) => {
            const t = tally[id];
            return (
              <li key={id} style={{ ['--fd-keep-i' as string]: String(i) }}>
                <span className="fd-exp-calib-tier">{PAY[id].name}</span>
                <span className="fd-exp-calib-count">
                  {t.n ? `${t.correct} of ${t.n} right` : 'no cards this run'}
                </span>
                <span className="fd-mono fd-exp-calib-pts">{verdict(id, t)}</span>
              </li>
            );
          })}
        </ul>
        <p className="fd-keep-title">{read}</p>
        {misses > 0 && (
          <div className="fd-exp-calib-actions">
            {/* Below zero this same action is the primary cooling CTA further down; two buttons for
                one action would split it, so the weight goes there instead. */}
            {!cool && (
              <button type="button" className="fd-exp-secondary" onPointerDown={tap} onClick={reRead}>
                <BookOpen size={17} aria-hidden="true" />
                {vaultLabel}
              </button>
            )}
            <button type="button" className="fd-exp-ghost" onPointerDown={tap} onClick={onDone}>
              Back to expeditions
            </button>
          </div>
        )}
      </section>

      {promotion && (
        <section className="fd-keep fd-exp-conviction" aria-labelledby="fd-exp-conv-head">
          <p className="fd-keep-kicker" id="fd-exp-conv-head">
            CONVICTION · {promotion.label}
          </p>
          {promotion.riskCalls > 0 && (
            <p className="fd-keep-title">
              Calls above Steady: {promotion.landed} of {promotion.riskCalls} right, over {promotion.calls}{' '}
              distinct facts.
            </p>
          )}
          {promotion.rating !== null && (
            <ul className="fd-keep-list">
              <li style={{ ['--fd-keep-i' as string]: '0' }}>
                Earned at {promotion.rating} of 2000, on this device.
              </li>
            </ul>
          )}
        </section>
      )}

      <div className="fd-exp-compare">
        <span>
          First completed run
          <strong className="fd-mono">
            {first.correct}/6 · {signed(first.score)}
          </strong>
        </span>
        <span>
          {repeat ? 'Best completed run' : 'Completed runs'}
          <strong className="fd-mono">
            {repeat
              ? `${best.correct}/6 · ${signed(best.score)} · ${record.completions} runs`
              : '1 · first run saved'}
          </strong>
        </span>
      </div>

      <p className="fd-exp-note">
        Your stamp marks completion, whatever the score. Points are scored inside this run only — there is no
        wallet, nothing is spent and nothing can be bought. Replays use the same six questions with the
        options reshuffled each run; scores are a record on this device, not a ranking.
      </p>

      <div className="fd-exp-finish-actions">
        {cool ? (
          <>
            {/* Loss-chasing is re-entering immediately after a loss. This does not block the replay;
                it puts the thing that actually makes the next run better in front of it. */}
            <button type="button" className="fd-exp-primary" onPointerDown={tap} onClick={reRead}>
              <BookOpen size={19} aria-hidden="true" />
              Re-read the cards you called wrong
            </button>
            <button type="button" className="fd-exp-secondary" onPointerDown={tap} onClick={onDone}>
              <Check size={18} aria-hidden="true" />
              Done — back to expeditions
            </button>
          </>
        ) : (
          <button type="button" className="fd-exp-primary" onPointerDown={tap} onClick={onDone}>
            <Check size={19} aria-hidden="true" />
            Done — back to expeditions
          </button>
        )}
        <button type="button" className="fd-exp-secondary" onPointerDown={tap} onClick={onDuel}>
          <Swords size={18} aria-hidden="true" />
          Duel this topic
        </button>
        <button
          type="button"
          className="fd-exp-ghost"
          disabled={busy || !loaded}
          onPointerDown={tap}
          onClick={onReplay}
        >
          <RotateCcw size={17} aria-hidden="true" />
          {busy ? 'Opening…' : 'Replay for practice'}
        </button>
      </div>

      {cool && (
        <p className="fd-exp-note fd-exp-below">
          {signed(result.score)} points. Every one of these six is in your Vault, untimed, whenever you want
          it.
        </p>
      )}

      <section className="fd-exp-recap" ref={recap}>
        <h2>
          <Stamp size={17} aria-hidden="true" />
          The six facts you travelled through.
        </h2>
        {run.cards.map((f: any, i: number) => {
          const a = run.answers[i],
            hit = a.choice === f.correctIndex,
            pay = PAY[a.confidence],
            points = pay[hit ? 'correct' : 'wrong'];
          return (
            <details key={f.factId} data-miss={hit ? undefined : '1'}>
              <summary onPointerDown={tap}>
                <span className={hit ? 'fd-exp-hit' : 'fd-exp-miss'} aria-hidden="true">
                  {hit ? <Check size={15} /> : <X size={15} />}
                </span>
                <span className="fd-exp-recap-q">{f.question}</span>
                <strong className="fd-mono">{signed(points)}</strong>
              </summary>
              <div>
                <p>
                  <b>Your answer:</b> {f.options[a.choice]} · {pay.name}
                </p>
                <p>
                  <b>Correct answer:</b> {f.options[f.correctIndex]}
                </p>
                <p>{f.explanation}</p>
                <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {f.sourceLabel}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
