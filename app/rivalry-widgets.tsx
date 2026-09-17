'use client';
/**
 * Room widgets: the match HUD, the finish stage, the round review and the "question an answer"
 * dialog. Styling lives in app/screens/room/room.css (imported by the Room screen).
 *
 * Copy from lib/duel-presentation.mjs (matchVerdict / roundReason / FORMAT_COPY) is quoted
 * verbatim — tests pin it. QuestionIssue keeps its export and props: app/expeditions.tsx uses it.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Bot,
  Check,
  Flag,
  Bookmark,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Trophy,
  ShieldCheck,
  BookOpen,
  Download,
  Flame,
  Timer,
} from 'lucide-react';
import { NumberCounter, useJuice } from '@/components/fx';
import { completedRounds, FORMAT_COPY, matchVerdict, roundReason } from '@/lib/duel-presentation.mjs';
import { comboMultiplier, levelForXp } from '@/lib/progression.mjs';
import { prizeFor } from '@/lib/economy/economy.mjs';
import { comboAt, marginLine, matchRank, matchXp, whatYouKeep, winTier } from './screens/room/room-math';
import { usePress } from './screens/room/room-bits';

/* Consecutive routine wins this session. Module scope, so it resets on reload and never reaches
   storage: this is about habituation inside one sitting, not a durable player stat. */
let routineWins = 0;
/** After this many identical routine celebrations, the next ones are medallion + counter only. */
const ROUTINE_CELEBRATIONS = 3;

const MODE_LABEL: Record<string, string> = {
  quick: 'QUICK DRAW',
  trilogy: 'TRIPLE THREAT',
  gauntlet: 'THE GAUNTLET',
};

export function DuelHUD({ room }: { room: any }) {
  const me = room.seat,
    other = 1 - me,
    format = (FORMAT_COPY as any)[room.config.mode],
    rounds = completedRounds(room),
    max = room.config.mode === 'quick' ? 1 : room.config.mode === 'trilogy' ? 3 : 5;
  const combo = comboAt(room);
  const rivalName = room.players[other]?.name?.replace(' · BOT', '') || 'Open seat';
  return (
    <div className="fd-hud" data-mode={room.config.mode}>
      <div className="fd-hud-seat">
        <span className="fd-hud-avatar">{room.players[me].name.charAt(0).toUpperCase()}</span>
        <span className="fd-hud-id">
          <small>YOU</small>
          <strong>{room.players[me].name}</strong>
        </span>
      </div>
      <div className="fd-hud-score">
        <span className="fd-hud-nums">
          <b>{room.scores[me]}</b>
          <i aria-hidden="true">:</i>
          <b>{room.scores[other]}</b>
        </span>
        <small>
          {room.config.mode === 'trilogy'
            ? 'FIRST TO TWO'
            : room.config.mode === 'gauntlet'
              ? 'FIVE-ROUND MATCH'
              : 'ONE-SHOT DUEL'}
        </small>
      </div>
      <div className="fd-hud-seat fd-hud-rival">
        <span className="fd-hud-id">
          <small>{room.players[other]?.kind === 'bot' ? 'BOT' : 'RIVAL'}</small>
          <strong>{rivalName}</strong>
        </span>
        <span className="fd-hud-avatar">
          {room.players[other]?.kind === 'bot' ? <Bot size={18} /> : rivalName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="fd-hud-rail">
        <div className="fd-rail" aria-label="Match rounds">
          {Array.from({ length: max }, (_, i) => {
            const done = rounds.find((r: any) => r.index === i),
              status = done
                ? done.result.reason === 'timing-inconsistent'
                  ? 'void'
                  : done.result.winner === null
                    ? 'draw'
                    : done.result.winner === me
                      ? 'win'
                      : 'loss'
                : i === room.roundIndex && !room.settled
                  ? 'current'
                  : 'pending';
            return (
              <span key={i} data-status={status} aria-label={`Round ${i + 1}: ${status}`}>
                {status === 'win'
                  ? 'W'
                  : status === 'loss'
                    ? 'L'
                    : status === 'draw'
                      ? 'D'
                      : status === 'void'
                        ? '—'
                        : i + 1}
              </span>
            );
          })}
        </div>
        {combo >= 1 ? (
          <span className="fd-combo" data-hot={combo >= 3 ? 'true' : 'false'}>
            <Flame size={13} />
            COMBO {combo}
            {combo >= 2 && <b>×{comboMultiplier(combo)}</b>}
          </span>
        ) : (
          <small className="fd-hud-format">
            {format.short} · {room.config.duration}s each
          </small>
        )}
      </div>
    </div>
  );
}

export function MatchFinish({
  room,
  player,
  onReplay,
  onVault,
  onFinish,
}: {
  room: any;
  player: any;
  onReplay: () => void;
  onVault: () => void;
  onFinish: () => void;
}) {
  const juice = useJuice();
  const press = usePress();
  const celebrated = useRef<string | null>(null);
  const v = matchVerdict(room),
    rounds = completedRounds(room),
    scored = rounds.filter((r: any) => r.result.reason !== 'timing-inconsistent'),
    mine = scored.map((r: any) => r.receipts?.[room.seat]).filter(Boolean),
    correct = mine.filter((a: any) => a.correct).length;
  const xpGained = matchXp(player, room);
  const rank = matchRank(room, player.progression);
  const level = levelForXp(player.progression?.xp ?? 0);
  const settledOk = room.phase === 'complete';
  const notes = [
    scored.length > mine.length
      ? `${scored.length - mine.length} completed rounds had no answer from you.`
      : '',
    rounds.length < room.roundIndex + (room.round?.result ? 1 : 0)
      ? 'Earlier round details may be unavailable for an older room.'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  const keep = v.key === 'loss' ? whatYouKeep(room, player) : null;
  const tier = v.key === 'win' ? winTier(room, player) : null;
  useEffect(() => {
    if (celebrated.current === room.id) return;
    if (v.key === 'win') {
      celebrated.current = room.id;
      // Ceremonial wins already have the overlay; stacking confetti behind one is two celebrations
      // for one event. Routine bot wins decay across a session so the tenth does not look like the
      // first — the *content* varies, never the volume, because randomised intensity is a
      // reinforcement schedule and randomised true content is a reason to read the screen.
      if (tier === 'ceremonial') return;
      if (tier === 'notable') {
        routineWins = 0;
        juice.confetti('win');
        return;
      }
      routineWins += 1;
      if (routineWins <= ROUTINE_CELEBRATIONS)
        juice.sound('win', { gain: Math.max(0.55, 1 - 0.12 * (routineWins - 1)) });
      return;
    }
    if (v.key === 'loss') {
      celebrated.current = room.id;
      routineWins = 0;
      // Second beat, after the verdict has landed and been announced. Never before it.
      const id = setTimeout(() => juice.settle(), 400);
      return () => clearTimeout(id);
    }
  }, [v.key, tier, room.id, juice]);
  return (
    <div className="fd-finish" data-verdict={v.key}>
      <section className="fd-verdict">
        <div className="fd-verdict-kicker">
          <span>{MODE_LABEL[room.config.mode] ?? room.config.mode.toUpperCase()}</span>
          <span>{room.players.some((p: any) => p?.kind === 'bot') ? 'VS BOT' : 'FRIEND DUEL'}</span>
        </div>
        <span className="fd-medallion" aria-hidden="true">
          {v.key === 'cancelled' ? (
            <ShieldCheck />
          ) : v.key === 'win' ? (
            <Trophy />
          ) : v.key === 'draw' ? (
            <span>=</span>
          ) : (
            <span>GG</span>
          )}
        </span>
        <h1>{v.title}</h1>
        <p className="fd-verdict-sub">{v.subtitle}</p>
        <div
          className="fd-scoreline"
          aria-label={`Score ${room.scores[room.seat]} to ${room.scores[1 - room.seat]}`}
        >
          <NumberCounter className="fd-scorenum" value={room.scores[room.seat]} from={0} duration={700} />
          <i aria-hidden="true">–</i>
          <NumberCounter
            className="fd-scorenum fd-scorenum-rival"
            value={room.scores[1 - room.seat]}
            from={0}
            duration={700}
          />
        </div>
        <p className="fd-margin">{marginLine(room)}</p>
      </section>

      {keep && (
        <section className="fd-keep" aria-labelledby="fd-keep-head">
          <p className="fd-keep-kicker" id="fd-keep-head">
            WHAT YOU KEEP
          </p>
          <h2 className="fd-keep-title">{keep.title}</h2>
          <ul className="fd-keep-list">
            {keep.bullets.map((line, i) => (
              <li key={line} style={{ ['--fd-keep-i' as string]: String(i) }}>
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Highest-intent moment in the loop: the next action sits straight under the verdict, not
          under four stat tiles where only ~19px of it was visible at 390x844. */}
      <div className="fd-finish-actions">
        <Button className="fd-btn fd-cta" onPointerDown={press} onClick={onReplay}>
          {room.config.opponent === 'bot' ? 'Play again' : 'Set up rematch'}
          <ArrowRight size={18} />
        </Button>
        <div className="fd-finish-secondary">
          <Button variant="outline" className="fd-btn" onPointerDown={press} onClick={onVault}>
            <BookOpen size={16} />
            Review my facts
          </Button>
          <Button variant="ghost" className="fd-btn" onPointerDown={press} onClick={onFinish}>
            Done for now
          </Button>
        </div>
      </div>

      <div className="fd-tiles">
        <div className="fd-tile" data-accent="gold">
          <small>XP THIS MATCH</small>
          <strong>
            +<NumberCounter value={xpGained} from={0} duration={900} />
          </strong>
          <span>
            Level {level.level} · {level.title} · on this device
          </span>
        </div>
        <div className="fd-tile" data-accent="volt">
          <small>CORRECT ANSWERS</small>
          <strong>
            <NumberCounter value={correct} from={0} duration={600} />
            <i> / {scored.length}</i>
          </strong>
          <span>{scored.length === 1 ? '1 round resolved' : `${scored.length} rounds resolved`}</span>
        </div>
        <div className="fd-tile" data-accent="cyan">
          <small>ARENA RANK</small>
          <strong>
            {rank.label}
            {settledOk && rank.delta !== 0 && (
              <i data-dir={rank.delta > 0 ? 'up' : 'down'}>
                {rank.delta > 0 ? '+' : '−'}
                {Math.abs(rank.delta)}
              </i>
            )}
          </strong>
          <span>
            {rank.points} pts
            {settledOk && rank.held ? ' · held at the tier floor' : ''}
          </span>
        </div>
        <div className="fd-tile" data-accent="ember">
          <small>COINS</small>
          <strong>
            {room.phase === 'cancelled' || room.winner === null
              ? 'Refunded'
              : room.config.stake
                ? room.winner === room.seat
                  ? `+${prizeFor(room.config.stake) - room.config.stake}`
                  : `−${room.config.stake}`
                : 'Free play'}
          </strong>
          <span>{room.ledger ? 'Coins from ads. No monetary value.' : 'Free simulated coins. No monetary value.'}</span>
        </div>
      </div>

      {/* One disclaimer slot per screen (bible §9): the coins line lives on the COINS tile, so
          `v.detail` — which repeats it word for word — is not printed again here. */}
      {!!notes && <p className="fd-note">{notes}</p>}
    </div>
  );
}

export function RoundReview({
  room,
  player,
  factFirst = false,
}: {
  room: any;
  player: any;
  /** Between rounds the fact and its explanation lead, so the learning moment is not below the
   *  sticky "Start round N" bar. On the finish stage the match breakdown leads as before. */
  factFirst?: boolean;
}) {
  const press = usePress();
  const rounds = completedRounds(room),
    [selected, setSelected] = useState<string | null>(null),
    [reportOpen, setReportOpen] = useState(false);
  const r = rounds.find((r: any) => r.id === selected) || rounds.at(-1),
    q = r?.question;
  if (!q || q.correctIndex === undefined) return null;
  const saved = player.journal.saved.includes(q.question),
    my = r.receipts?.[room.seat],
    rival = r.receipts?.[1 - room.seat];
  const received = player.profile.issues?.some((i: any) => i.fact.id === r.id);
  const breakdown = (
    <>
      <div className="fd-review-top">
        <h2>{rounds.length > 1 ? 'The match, question by question.' : 'Here’s how it was decided.'}</h2>
        <span className="fd-review-count">
          {rounds.length} {rounds.length === 1 ? 'fact' : 'facts'}
        </span>
      </div>
      {rounds.length > 1 && (
        <div className="fd-review-tabs" aria-label="Choose a completed round">
          {rounds.map((row: any) => (
            <button
              key={row.id}
              type="button"
              className="fd-review-tab"
              aria-pressed={row.id === r.id}
              onPointerDown={press}
              onClick={() => setSelected(row.id)}
            >
              Round {row.index + 1}
              <span
                data-status={
                  row.result.reason === 'timing-inconsistent'
                    ? 'void'
                    : row.result.winner === null
                      ? 'draw'
                      : row.result.winner === room.seat
                        ? 'win'
                        : 'loss'
                }
              >
                {row.result.reason === 'timing-inconsistent'
                  ? '—'
                  : row.result.winner === null
                    ? 'D'
                    : row.result.winner === room.seat
                      ? 'W'
                      : 'L'}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="fd-reason">
        <Timer size={17} />
        <p>{roundReason(r, room.seat)}</p>
      </div>
      <div className="fd-receipts">
        {[
          [my, 'You'],
          [rival, room.players[1 - room.seat]?.kind === 'bot' ? 'Lucky Guess · BOT' : 'Your rival'],
        ].map(([a, label]: any, i) => (
          <div key={i} className="fd-receipt" data-ok={a ? (a.correct ? 'true' : 'false') : 'none'}>
            <span className="fd-receipt-who">{label}</span>
            <strong>{a ? (a.correct ? 'Correct' : 'Incorrect') : 'No answer'}</strong>
            <span className="fd-receipt-time">{a ? `${(a.elapsedMs / 1000).toFixed(3)} s` : '—'}</span>
            <p>{a ? q.options[a.choice] : 'No answer submitted'}</p>
            <small>
              {a?.simulated ? 'Scheduled bot time' : a ? 'Browser-reported time' : 'No response time'}
            </small>
          </div>
        ))}
      </div>
    </>
  );
  const factCard = (
    <article className="fd-fact">
      <div className="fd-fact-top">
        <span>
          {q.topic} <i aria-hidden="true">/</i> {q.subtopic}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="fd-btn"
          aria-label={saved ? 'Remove saved fact' : 'Save this fact'}
          aria-pressed={saved}
          onPointerDown={press}
          onClick={() => player.save(q.question)}
        >
          <Bookmark fill={saved ? 'currentColor' : 'none'} />
        </Button>
      </div>
      <h3>{q.question}</h3>
      <p className="fd-fact-answer">
        <Check size={18} />
        {q.options[q.correctIndex]}
      </p>
      <details
        key={r.id}
        className="fd-fact-why"
        onToggle={(e) => {
          if (e.currentTarget.open) player.open(r.id);
        }}
      >
        <summary>
          Why this is the answer
          <ChevronDown size={16} />
        </summary>
        <p>{q.explanation}</p>
      </details>
      <div className="fd-fact-actions">
        <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">
          {q.sourceLabel}
          <ExternalLink size={14} />
        </a>
        <Button variant="ghost" className="fd-btn" onPointerDown={press} onClick={() => setReportOpen(true)}>
          <Flag size={15} />
          {received ? 'Issue saved locally' : 'Question an answer'}
        </Button>
      </div>
    </article>
  );
  return (
    <section className="fd-review">
      {factFirst ? (
        <>
          {factCard}
          {breakdown}
        </>
      ) : (
        <>
          {breakdown}
          {factCard}
        </>
      )}
      <details className="fd-timing">
        <summary>
          Timing &amp; coin details
          <ChevronDown size={16} />
        </summary>
        <p className="fd-note">
          Human times are reported by each browser. Bot times are scheduled randomly. A {room.tieMs} ms draw
          band applies when both answers are correct; these checks do not prove client honesty.
        </p>
        <div className="fd-table">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Reported time</th>
                <th>Server / simulation</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {room.players.map((p: any, i: number) => {
                const a = r.receipts[i];
                return (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{a ? `${(a.elapsedMs / 1000).toFixed(3)} s` : 'No answer'}</td>
                    <td>
                      {a
                        ? a.simulated
                          ? 'Scheduled bot'
                          : `${(a.serverElapsedMs / 1000).toFixed(3)} s`
                        : '—'}
                    </td>
                    <td>{a ? (a.correct ? 'Correct' : 'Incorrect') : 'No answer'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="fd-note">
          {room.config.stake} {room.ledger ? 'coins' : 'simulated coins'} each, reserved once. Current balances:{' '}
          {room.players.map((p: any, i: number) => `${p.name}: ${room.balances[i]}`).join(' · ')}. Coins have
          no monetary value.
        </p>
      </details>
      <QuestionIssue
        key={r.id}
        open={reportOpen}
        onOpenChange={setReportOpen}
        fact={q}
        roundId={r.id}
        player={player}
      />
    </section>
  );
}
export function QuestionIssue({
  open,
  onOpenChange,
  fact,
  roundId,
  player,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fact: any;
  roundId: string;
  player: any;
}) {
  const [reason, setReason] = useState('incorrect'),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState('');
  const existing = player.profile.issues?.find((i: any) => i.fact.id === roundId && i.reason === reason);
  useEffect(() => {
    if (open) {
      setSaved(false);
      setError('');
      setNote(existing?.note || '');
    }
  }, [open, reason, roundId, player.profile.epoch]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="question-issue">
        <DialogHeader>
          <DialogTitle>Question the answer.</DialogTitle>
          <DialogDescription>
            Keep the fact and your concern together. This saves an issue on this device; it is not sent to a
            support team and does not change the score.
          </DialogDescription>
        </DialogHeader>
        {saved ? (
          <div className="issue-confirmed">
            <Check />
            <h3>Saved on this device.</h3>
            <p>
              {player.persistent
                ? 'The issue is included in your activity export.'
                : 'Storage is unavailable; export this visit’s activity before leaving.'}{' '}
              Find it in your Vault.
            </p>
            <Button variant="outline" onClick={player.exportAll}>
              <Download />
              Export activity
            </Button>
            <Button onClick={() => onOpenChange(false)}>Back to the result</Button>
          </div>
        ) : (
          <>
            <p className="issue-fact">{fact.question}</p>
            <label className="issue-label">
              What needs a closer look?
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="incorrect">The accepted answer seems incorrect</option>
                <option value="ambiguous">More than one answer could fit</option>
                <option value="source">The source is missing or unclear</option>
                <option value="other">Something else</option>
              </select>
            </label>
            <label className="issue-label">
              Your note (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={800}
                rows={3}
                placeholder="What would you change, and why?"
              />
            </label>
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            <Button
              disabled={busy || !player.loaded}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  const ok = await player.report(roundId, reason, note);
                  if (ok) setSaved(true);
                  else setError('The fact has not finished saving. Try again in a moment.');
                } catch {
                  setError('Could not save this issue. Keep your note and try again.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Saving…' : existing ? 'Update saved issue' : 'Save issue on this device'}
              <Flag />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
