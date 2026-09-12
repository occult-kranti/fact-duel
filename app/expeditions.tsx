'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  EXPEDITIONS,
  CONFIDENCE,
  expeditionById,
  expeditionStatus,
  runResult,
  validExpeditionCards,
} from '@/lib/expeditions.mjs';
import { request } from '@/lib/duel-client';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Flag,
  Flame,
  Shield,
  BookOpen,
  Bookmark,
  ExternalLink,
  Swords,
  Layers,
  RotateCcw,
  Trophy,
  Pause,
  ChevronRight,
  Atom,
  Zap,
  Bot,
  Users,
} from 'lucide-react';
import { TOPIC_STYLE } from './collections';
import { QuestionIssue } from './rivalry-widgets';

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const art = (route: any) => (route.domain === 'science' ? '/science-club.webp' : '/sports-club.webp');
export function ExpeditionStamp({ route, earned = false }: { route: any; earned?: boolean }) {
  const Icon = TOPIC_STYLE[route.topic]?.icon || Compass;
  return (
    <span className={`exp-stamp ${route.domain} ${earned ? 'earned' : ''}`} aria-hidden="true">
      <Icon />
      <span>{route.code}</span>
    </span>
  );
}
export function RouteRail({ route, cursor }: { route: any; cursor: number }) {
  return (
    <ol className="route-rail" aria-label="Expedition chapters">
      {route.chapters.map((title: string, i: number) => (
        <li
          key={title}
          className={cursor >= (i + 1) * 2 ? 'done' : Math.floor(cursor / 2) === i ? 'current' : ''}
          aria-current={Math.floor(cursor / 2) === i ? 'step' : undefined}
        >
          <span>{cursor >= (i + 1) * 2 ? <Check size={16} /> : String(i + 1).padStart(2, '0')}</span>
          <div>
            <strong>{title}</strong>
            <small>
              {cursor >= (i + 1) * 2
                ? 'Complete'
                : Math.floor(cursor / 2) === i
                  ? 'Current chapter'
                  : 'Up next'}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function Clubhouse({
  player,
  name,
  ready,
  busy,
  onRoute,
  onDuel,
  onSetup,
  onExplore,
  onPassport,
  onVault,
  onDiscovery,
  onShowroom,
}: {
  player: any;
  name: string;
  ready: boolean;
  busy: boolean;
  onRoute: (id: string | null) => void;
  onDuel: (mode: string, topic?: string) => void;
  onSetup: (intent?: 'friend' | 'join' | 'settings') => void;
  onExplore: () => void;
  onPassport: () => void;
  onVault: () => void;
  onDiscovery: () => void;
  onShowroom: () => void;
}) {
  const [world, setWorld] = useState('sports');
  const journeys = player.profile.journeys || {};
  const continuing = EXPEDITIONS.filter((r) => expeditionStatus(journeys[r.key]) === 'continue').sort(
    (a, b) => journeys[b.key].run.startedAt - journeys[a.key].run.startedAt,
  )[0];
  const featured =
    continuing || EXPEDITIONS.find((r) => r.id === (world === 'sports' ? 'football' : 'space'))!;
  const record = journeys[featured.key],
    isContinue = expeditionStatus(record) === 'continue';
  const earned = EXPEDITIONS.filter((r) => journeys[r.key]?.first);
  const nextRoutes = EXPEDITIONS.filter((r) => r.domain === world && r.id !== featured.id).slice(0, 3);
  return (
    <section className="clubhouse">
      <div className="clubhouse-heading">
        <div>
          <p className="eyebrow">THE CLUBHOUSE</p>
          <h1>What’s your home ground?</h1>
        </div>
        <button className="club-player" onClick={onPassport}>
          <span>{name.charAt(0).toUpperCase() || 'P'}</span>
          <div>
            <strong>{name}</strong>
            <small>{earned.length} / 9 expedition stamps</small>
          </div>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="clubhouse-grid">
        <section className={`featured-expedition ${featured.domain}`} aria-labelledby="featured-route">
          <img src={art(featured)} alt="" width="1536" height="1024" />
          <div className="feature-content">
            <div className="feature-topline">
              <span className="tag">
                <Compass size={15} />
                {isContinue ? 'YOUR UNFINISHED EXPEDITION' : 'SOLO EXPEDITION'}
              </span>
              <span>{featured.code}</span>
            </div>
            <div className="feature-title">
              <p>{featured.topic}</p>
              <h2 id="featured-route">{featured.title}</h2>
              <p>{featured.subtitle}</p>
            </div>
            <RouteRail route={featured} cursor={record?.run?.cursor || 0} />
            <div className="feature-launch">
              <Button disabled={!player.loaded} onClick={() => onRoute(featured.id)}>
                {isContinue
                  ? 'Continue expedition'
                  : record?.first
                    ? 'View your expedition'
                    : 'Start expedition'}
                <ArrowRight />
              </Button>
              <span>
                6 questions · no timer
                <br />
                {isContinue
                  ? `${record.run.answers.length} answers saved`
                  : 'Choose your confidence. Build your score.'}
              </span>
            </div>
            <p className="feature-save-note">
              {player.persistent
                ? 'Progress stays in this browser.'
                : 'Visit-only progress. Export before leaving.'}
            </p>
          </div>
        </section>
        <section className="club-duels">
          <div className="club-duels-title">
            <span className="duel-mark">
              <Swords />
            </span>
            <span className="eyebrow">FEELING COMPETITIVE?</span>
          </div>
          <h2>
            Settle it
            <br />
            in the arena.
          </h2>
          <p>
            Four choices. One rival.
            <br />
            Fastest correct answer wins the round.
          </p>
          <div className="duel-direct-list">
            {[
              ['quick', 'Quick Draw', '1 question'],
              ['trilogy', 'Triple Threat', 'Up to 3'],
              ['gauntlet', 'The Gauntlet', '5 questions'],
            ].map(([id, title, detail], i) => (
              <button
                key={id}
                className={i === 0 ? 'primary-duel' : ''}
                disabled={!ready || busy}
                onClick={() => onDuel(id)}
              >
                <span className="duel-direct-number">0{i + 1}</span>
                <span>
                  <strong>{title}</strong>
                  <small>{detail} · random bot</small>
                </span>
                <ArrowRight size={19} />
              </button>
            ))}
          </div>
          <p className="duel-timing-note">
            15s per question · free play
            <br />
            Stay on this screen during live rounds.
          </p>
          <div className="friend-shortcuts">
            <Button variant="outline" onClick={() => onSetup('friend')}>
              <Users size={17} />
              Invite friend
            </Button>
            <Button variant="ghost" onClick={() => onSetup('join')}>
              Join a duel
            </Button>
          </div>
          <button className="quiet-link" onClick={() => onSetup('settings')}>
            Topics, timer & match settings
            <ChevronRight size={15} />
          </button>
        </section>
      </div>
      <section className="exp-shelf">
        <div className="shelf-heading">
          <div>
            <p className="eyebrow">PICK AN OBSESSION</p>
            <h2>A little deeper. A lot more interesting.</h2>
          </div>
          <div className="world-switch" aria-label="Expedition world">
            {['sports', 'science'].map((id) => (
              <button key={id} aria-pressed={id === world} onClick={() => setWorld(id)}>
                {id === 'sports' ? <Flag size={15} /> : <Atom size={15} />}{' '}
                {id === 'sports' ? 'Sports' : 'Science'}
              </button>
            ))}
          </div>
        </div>
        <div className="episode-shelf">
          {nextRoutes.map((route) => (
            <EpisodeCard
              key={route.key}
              route={route}
              record={journeys[route.key]}
              onOpen={() => onRoute(route.id)}
            />
          ))}
        </div>
        <div className="shelf-foot">
          <button onClick={() => onRoute(null)}>
            All 9 expeditions
            <ArrowRight size={16} />
          </button>
          <button onClick={onExplore}>
            Browse duel topics
            <Layers size={16} />
          </button>
        </div>
      </section>
      <div className="clubhouse-bottom">
        <section className="stamp-shelf">
          <div>
            <p className="eyebrow">YOUR EXPEDITION CASE</p>
            <h2>
              {earned.length ? `${earned.length} stories collected.` : 'Every expedition leaves a mark.'}
            </h2>
            <p>Finish all six questions to earn a stamp, at any score.</p>
          </div>
          <div className="mini-stamps">
            {(earned.length ? earned.slice(-3) : EXPEDITIONS.slice(0, 3)).map((r) => (
              <button
                key={r.key}
                onClick={() => (earned.length ? onRoute(r.id) : onPassport())}
                aria-label={
                  earned.length ? `View ${r.stamp} completed expedition` : 'View your expedition case'
                }
              >
                <ExpeditionStamp route={r} earned={!!journeys[r.key]?.first} />
              </button>
            ))}
          </div>
          <button className="quiet-link" onClick={onPassport}>
            Open player card
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="club-tools">
          <button onClick={onVault}>
            <BookOpen />
            <span>
              <strong>Your fact vault</strong>
              <small>Answers, sources & saved questions</small>
            </span>
            <ArrowRight />
          </button>
          <button onClick={onDiscovery}>
            <Compass />
            <span>
              <strong>Just three facts</strong>
              <small>A short, unscored warm-up</small>
            </span>
            <ArrowRight />
          </button>
          <button onClick={onShowroom}>
            <Atom />
            <span>
              <strong>The arena object</strong>
              <small>Explore the optional 3D scene</small>
            </span>
            <ArrowRight />
          </button>
        </section>
      </div>
    </section>
  );
}
function EpisodeCard({ route, record, onOpen }: { route: any; record: any; onOpen: () => void }) {
  const status = expeditionStatus(record),
    Icon = TOPIC_STYLE[route.topic]?.icon || Compass;
  return (
    <button className={`episode-card ${route.domain} ${status}`} onClick={onOpen}>
      <div className="episode-top">
        <span>
          <Icon size={18} />
          {route.topic}
        </span>
        <span>{status === 'complete' ? <Check size={17} /> : route.code}</span>
      </div>
      <h3>{route.title}</h3>
      <p>{route.subtitle}</p>
      <div className="episode-card-bottom">
        <span>
          {status === 'continue'
            ? `${record.run.answers.length}/6 answered · continue`
            : status === 'complete'
              ? `Stamp earned · first run ${record.first.correct}/6 correct`
              : '3 chapters · 6 questions'}
        </span>
        <ArrowRight size={18} />
      </div>
      <div className="episode-progress" aria-hidden="true">
        <span style={{ width: `${((record?.run?.cursor || 0) / 6) * 100}%` }} />
      </div>
    </button>
  );
}
export function ExpeditionCase({ player, onOpen }: { player: any; onOpen: (id: string) => void }) {
  return (
    <section className="expedition-case">
      <div className="shelf-heading">
        <div>
          <p className="eyebrow">COLLECTED STORIES</p>
          <h2>Your expedition stamps.</h2>
        </div>
        <span>{EXPEDITIONS.filter((r) => player.profile.journeys?.[r.key]?.first).length} / 9</span>
      </div>
      <p>Earned for completing a route. Scores describe local practice; stamps do not certify expertise.</p>
      <div className="stamp-case-grid">
        {EXPEDITIONS.map((route) => {
          const record = player.profile.journeys?.[route.key];
          return (
            <button key={route.key} onClick={() => onOpen(route.id)}>
              <ExpeditionStamp route={route} earned={!!record?.first} />
              <strong>{route.stamp}</strong>
              <small>
                {record?.first
                  ? `First run ${record.first.correct}/6 correct · ${signed(record.first.score)} pts`
                  : 'Finish this expedition'}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
export default function Expeditions({
  selected,
  onSelect,
  player,
  onDuel,
  onBack,
  signal,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
  player: any;
  onDuel: (mode: string, topic?: string) => void;
  onBack: () => void;
  signal: (s: string) => void;
}) {
  const [world, setWorld] = useState('all'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const initiating = useRef(false),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    setError('');
  }, [selected, player.profile.epoch]);
  const route = expeditionById(selected),
    record = route ? player.profile.journeys?.[route.key] : null;
  async function start() {
    if (!route || !player.loaded || initiating.current) return;
    initiating.current = true;
    setBusy(true);
    setError('');
    const epoch = player.profile.epoch,
      previousRunId = record?.run?.id ?? null;
    try {
      const data = await request({ action: 'expedition', routeId: route.id });
      if (!live.current) return;
      if (data.version !== route.version || !validExpeditionCards(data.cards, route))
        throw new Error('This expedition’s cards could not be checked. Try again.');
      await player.dispatch({
        type: 'journey-start',
        epoch,
        routeId: route.id,
        runId: crypto.randomUUID(),
        previousRunId,
        cards: data.cards,
      });
    } catch (e: any) {
      if (live.current) setError(e.message || 'Could not open this expedition. Try again.');
    } finally {
      initiating.current = false;
      if (live.current) setBusy(false);
    }
  }
  if (!route)
    return (
      <section className="expedition-atlas">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NINE SMALL WORLDS</p>
            <h1>Find your next obsession.</h1>
          </div>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft />
            Clubhouse
          </Button>
        </div>
        <p className="atlas-intro">
          Six questions. Three chapters. Choose Steady or Bold, then commit to an answer. Finish a route to
          collect its stamp.
        </p>
        <div className="world-switch atlas-filter">
          {['all', 'sports', 'science'].map((id) => (
            <button key={id} aria-pressed={world === id} onClick={() => setWorld(id)}>
              {id === 'all' ? 'All expeditions' : id === 'sports' ? 'Sports' : 'Science'}
            </button>
          ))}
        </div>
        <div className="atlas-grid">
          {EXPEDITIONS.filter((r) => world === 'all' || r.domain === world).map((route) => (
            <EpisodeCard
              key={route.key}
              route={route}
              record={player.profile.journeys?.[route.key]}
              onOpen={() => onSelect(route.id)}
            />
          ))}
        </div>
        <p className="small-note">
          These routes use our existing 54-question sample. Levels are editorial, and repeat runs use the same
          questions. Your progress is local to this browser.
        </p>
      </section>
    );
  return (
    <section className={`expedition-view ${route.domain}`}>
      <div className="expedition-topbar">
        <Button variant="ghost" onClick={() => onSelect(null)}>
          <ArrowLeft />
          {record?.run && record.run.cursor < 6 ? 'Pause & browse' : 'All expeditions'}
        </Button>
        <span>
          {route.topic} <span aria-hidden="true">/</span> SOLO · NO TIMER
        </span>
      </div>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {record?.run ? (
        <ExpeditionRun
          key={`${route.key}:${record.run.id}:${player.profile.epoch}`}
          route={route}
          record={record}
          player={player}
          onReplay={start}
          busy={busy}
          onDone={() => onSelect(null)}
          onDuel={() => onDuel('trilogy', route.topic)}
          signal={signal}
        />
      ) : (
        <div className="expedition-brief">
          <div className="brief-art">
            <img src={art(route)} alt="" width="1536" height="1024" />
            <ExpeditionStamp route={route} />
            <span>{route.code}</span>
          </div>
          <div className="brief-content">
            <p className="eyebrow">YOUR NEXT EXPEDITION</p>
            <h1>{route.title}</h1>
            <p>{route.subtitle}</p>
            <RouteRail route={route} cursor={0} />
            <ScoringRules />
            <p className="stamp-contract">
              <Trophy size={19} />
              Complete six questions, at any score, to collect the <strong>{route.stamp}</strong> stamp.
            </p>
            <Button className="exp-start" disabled={busy || !player.loaded} onClick={start}>
              {busy ? 'Opening your expedition…' : 'Begin chapter 1'}
              <ArrowRight />
            </Button>
            <p className="small-note">
              No timer, entry fee or opponent. You can pause after any answer. This is local practice using
              the same sample as duels.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
function ScoringRules() {
  return (
    <div className="scoring-rules">
      <span>
        <Shield size={18} />
        <strong>Steady</strong> +2 correct · 0 wrong
      </span>
      <span>
        <Flame size={18} />
        <strong>Bold</strong> +3 correct · −1 wrong
      </span>
      <p>
        Choose before each answer. Your total can go below zero. These points only score this run; they are
        separate from coins and activity points.
      </p>
    </div>
  );
}
function ExpeditionRun({
  route,
  record,
  player,
  onReplay,
  busy,
  onDone,
  onDuel,
  signal,
}: {
  route: any;
  record: any;
  player: any;
  onReplay: () => void;
  busy: boolean;
  onDone: () => void;
  onDuel: () => void;
  signal: (s: string) => void;
}) {
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
    focusKey = useRef('');
  const sounded = useRef(new Set(run.answers.map((_: any, i: number) => i))),
    finishedSound = useRef(index === 6);
  useEffect(() => {
    run.answers.forEach((a: any, i: number) => {
      if (!sounded.current.has(i)) {
        sounded.current.add(i);
        signal(a.choice === run.cards[i].correctIndex ? 'correct' : 'learn');
      }
    });
    if (index === 6 && !finishedSound.current) {
      finishedSound.current = true;
      signal('stamp');
    }
  }, [run.answers, index, signal]);
  useEffect(() => {
    setConfidence('steady');
    locked.current = false;
    setIssueOpen(false);
  }, [index]);
  useEffect(() => {
    const key = `${index}:${!!answer}`;
    if (focusKey.current === key) return;
    focusKey.current = key;
    heading.current?.focus();
  }, [index, !!answer]);
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
    } finally {
      locked.current = false;
      setWriting(false);
    }
  }
  if (index === 6)
    return (
      <div className="expedition-finish">
        <div className="expedition-award">
          <ExpeditionStamp route={route} earned />
          <p className="eyebrow">EXPEDITION COMPLETE</p>
          <h1 ref={heading} tabIndex={-1}>
            {route.stamp}
          </h1>
          <p>
            {record.completions === 1 ? 'A new story in your collection.' : 'Another practice run, complete.'}
          </p>
          <span className="earned-pill">
            <Check size={16} />
            {record.completions === 1 ? 'Stamp earned' : 'Stamp already collected'}
          </span>
        </div>
        <div className="expedition-scorecard">
          <span>
            THIS RUN
            <strong>
              {signed(result.score)}
              <small>points</small>
            </strong>
          </span>
          <span>
            CORRECT
            <strong>
              {result.correct}
              <small>/ 6</small>
            </strong>
          </span>
          <span>
            BOLD PICKS
            <strong>
              {result.bold}
              <small>/ 6</small>
            </strong>
          </span>
        </div>
        <div className="run-comparison">
          <span>
            First completed run{' '}
            <strong>
              {signed(record.first?.score ?? result.score)} pts · {record.first?.correct ?? result.correct}/6
              correct
            </strong>
          </span>
          <span>
            {record.completions > 1 ? 'Best completed practice run' : 'Completed runs'}
            <strong>
              {record.completions > 1
                ? `${signed(record.best.score)} pts · ${record.completions} runs`
                : '1 · first run saved'}
            </strong>
          </span>
        </div>
        <p className="completion-note">
          Your stamp marks completion, regardless of score. Replay uses the same six questions; scores are
          local practice, not a ranking.
        </p>
        <div className="expedition-finish-actions">
          <Button onClick={onDone}>
            <Check />
            Done — back to expeditions
          </Button>
          <Button variant="outline" onClick={onDuel}>
            <Swords />
            Duel this topic
          </Button>
          <Button variant="ghost" disabled={busy || !player.loaded} onClick={onReplay}>
            <RotateCcw />
            {busy ? 'Opening…' : 'Replay for practice'}
          </Button>
        </div>
        <section className="expedition-recap">
          <h2>The six facts you travelled through.</h2>
          {run.cards.map((f: any, i: number) => {
            const a = run.answers[i],
              correct = a.choice === f.correctIndex,
              points = (CONFIDENCE as any)[a.confidence][correct ? 'correct' : 'wrong'];
            return (
              <details key={f.factId}>
                <summary>
                  <span className={correct ? 'recap-hit' : 'recap-miss'}>
                    {correct ? <Check size={16} /> : '×'}
                  </span>
                  <span>{f.question}</span>
                  <strong>{signed(points)}</strong>
                </summary>
                <div>
                  <p>
                    <b>Your answer:</b> {f.options[a.choice]} · {a.confidence === 'bold' ? 'Bold' : 'Steady'}
                  </p>
                  <p>
                    <b>Correct answer:</b> {f.options[f.correctIndex]}
                  </p>
                  <p>{f.explanation}</p>
                  <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {f.sourceLabel}
                    <ExternalLink size={14} />
                  </a>
                </div>
              </details>
            );
          })}
        </section>
      </div>
    );
  const correct = answer?.choice === fact.correctIndex,
    points = answer ? (CONFIDENCE as any)[answer.confidence][correct ? 'correct' : 'wrong'] : 0,
    roundId = `journey:${run.id}:${index}`;
  return (
    <div className="expedition-playing">
      <div className="expedition-run-heading">
        <div>
          <p className="eyebrow">{route.title}</p>
          <h1>{route.chapters[Math.floor(index / 2)]}</h1>
        </div>
        <div className="live-run-score">
          <span>RUN SCORE</span>
          <strong>{signed(result.score)}</strong>
        </div>
      </div>
      <RouteRail route={route} cursor={index} />
      <div className="expedition-question">
        <div className="exp-question-meta">
          <span>QUESTION {index + 1} / 6</span>
          <span>{['Opening level', 'Deeper cut', 'Final detail'][Math.floor(index / 2)]}</span>
        </div>
        <h2 ref={heading} tabIndex={-1}>
          {fact.question}
        </h2>
        <fieldset className="confidence-picker" disabled={!!answer || writing || !player.loaded}>
          <legend>How sure are you? Choose, then answer.</legend>
          {Object.entries(CONFIDENCE).map(([id, rule]: any) => (
            <button
              type="button"
              key={id}
              aria-pressed={(answer?.confidence || confidence) === id}
              onClick={() => setConfidence(id)}
              className={`${id} ${(answer?.confidence || confidence) === id ? 'selected' : ''}`}
            >
              {id === 'bold' ? <Flame size={18} /> : <Shield size={18} />}
              <span>
                <strong>{rule.name}</strong>
                <small>
                  +{rule.correct} correct · {rule.wrong === 0 ? '0' : '−1'} wrong
                </small>
              </span>
              {(answer?.confidence || confidence) === id && <Check size={17} />}
            </button>
          ))}
        </fieldset>
        <div className="answer-grid">
          {fact.options.map((option: string, i: number) => (
            <Button
              key={`${index}-${i}`}
              variant="outline"
              className={`answer-button ${answer?.choice === i ? 'chosen' : ''} ${answer && i === fact.correctIndex ? 'correct-option' : ''}`}
              disabled={!!answer || writing || !player.loaded}
              aria-pressed={answer?.choice === i}
              onClick={() => void act('journey-answer', { choice: i, confidence })}
            >
              <span className="option-label">{String.fromCharCode(65 + i)}</span>
              <span>{option}</span>
              {answer && i === fact.correctIndex && <Check />}
            </Button>
          ))}
        </div>
        {!answer && (
          <p className="answer-contract">Your first answer locks. Score can go below zero. No timer.</p>
        )}
        {answer && (
          <div className={`expedition-feedback ${correct ? 'correct' : 'incorrect'}`}>
            <div className="feedback-head">
              <strong role="status">{correct ? 'That’s the one.' : 'One to remember.'}</strong>
              <span>
                {signed(points)} points · {answer.confidence === 'bold' ? 'Bold' : 'Steady'}
              </span>
            </div>
            <p>
              <b>Correct answer:</b> {fact.options[fact.correctIndex]}
            </p>
            <details
              onToggle={(e) => {
                if (e.currentTarget.open) player.open(roundId);
              }}
            >
              <summary>
                <BookOpen size={17} />
                Why this answer?
              </summary>
              <p>{fact.explanation}</p>
            </details>
            <div className="expedition-fact-tools">
              <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
                Source
                <ExternalLink size={14} />
              </a>
              <Button
                variant="ghost"
                onClick={() => player.save(fact.question)}
                aria-pressed={player.journal.saved.includes(fact.question)}
              >
                <Bookmark size={16} />
                {player.journal.saved.includes(fact.question) ? 'Saved' : 'Save fact'}
              </Button>
              <Button variant="ghost" onClick={() => setIssueOpen(true)}>
                <Flag size={16} />
                Flag a concern
              </Button>
            </div>
            {index % 2 === 1 && (
              <p className="chapter-complete">
                <Check size={16} />
                {index === 5
                  ? 'All six questions answered. Finish to collect your stamp.'
                  : `Chapter ${Math.floor(index / 2) + 1} complete. Next: ${route.chapters[Math.floor(index / 2) + 1]}.`}
              </p>
            )}
            <Button
              className="exp-next"
              disabled={writing || !player.loaded}
              onClick={() => void act('journey-next')}
            >
              {writing
                ? 'Saving…'
                : index === 5
                  ? 'Finish & collect stamp'
                  : index % 2 === 1
                    ? `Begin chapter ${Math.floor(index / 2) + 2}`
                    : 'Next question'}
              {index === 5 ? <Trophy /> : <ArrowRight />}
            </Button>
          </div>
        )}
      </div>
      <div className="expedition-pause">
        <Button variant="ghost" disabled={writing} onClick={onDone}>
          <Pause size={16} />
          Pause expedition
        </Button>
        <span>
          {player.persistent
            ? 'Each answer saves in this browser.'
            : 'Visit-only progress. Export before leaving.'}
        </span>
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
