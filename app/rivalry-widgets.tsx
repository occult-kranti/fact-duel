'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Bot,
  Check,
  Lock,
  Flag,
  Bookmark,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Trophy,
  ShieldCheck,
  BookOpen,
  Download,
} from 'lucide-react';
import { completedRounds, FORMAT_COPY, matchVerdict, roundReason } from '@/lib/duel-presentation.mjs';

export function DuelHUD({ room }: { room: any }) {
  const me = room.seat,
    other = 1 - me,
    format = (FORMAT_COPY as any)[room.config.mode],
    rounds = completedRounds(room),
    max = room.config.mode === 'quick' ? 1 : room.config.mode === 'trilogy' ? 3 : 5;
  return (
    <div className={`duel-hud format-${room.config.mode}`}>
      <div className="hud-player">
        <span className="hud-avatar">{room.players[me].name.charAt(0).toUpperCase()}</span>
        <span>
          <small>YOU</small>
          <strong>{room.players[me].name}</strong>
        </span>
      </div>
      <div className="hud-center">
        <div className="hud-score">
          <b>{room.scores[me]}</b>
          <span>:</span>
          <b>{room.scores[other]}</b>
        </div>
        <span>
          {room.config.mode === 'trilogy'
            ? 'FIRST TO TWO'
            : room.config.mode === 'gauntlet'
              ? 'FIVE-ROUND MATCH'
              : 'ONE-SHOT DUEL'}
        </span>
      </div>
      <div className="hud-player hud-rival">
        <span>
          <small>{room.players[other]?.kind === 'bot' ? 'RANDOM BOT' : 'RIVAL'}</small>
          <strong>{room.players[other]?.name?.replace(' · BOT', '') || 'Open seat'}</strong>
        </span>
        <span className="hud-avatar">
          {room.players[other]?.kind === 'bot' ? (
            <Bot />
          ) : (
            room.players[other]?.name?.charAt(0).toUpperCase() || '?'
          )}
        </span>
      </div>
      <div className="round-rail" aria-label="Match rounds">
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
            <span key={i} className={`rail-${status}`} aria-label={`Round ${i + 1}: ${status}`}>
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
        <small>
          {format.short} · {room.config.duration}s each
        </small>
      </div>
    </div>
  );
}
export function MatchFinish({
  room,
  onReplay,
  onVault,
  onFinish,
}: {
  room: any;
  onReplay: () => void;
  onVault: () => void;
  onFinish: () => void;
}) {
  const v = matchVerdict(room),
    rounds = completedRounds(room),
    scored = rounds.filter((r: any) => r.result.reason !== 'timing-inconsistent'),
    mine = scored.map((r: any) => r.receipts?.[room.seat]).filter(Boolean),
    correct = mine.filter((a: any) => a.correct).length;
  return (
    <div className={`match-finish finish-${v.key}`}>
      <div className="finish-kicker">
        <span>
          {room.config.mode === 'quick'
            ? 'QUICK DRAW'
            : room.config.mode === 'trilogy'
              ? 'TRIPLE THREAT'
              : 'THE GAUNTLET'}
        </span>
        <span>{room.players.some((p: any) => p?.kind === 'bot') ? 'VS RANDOM BOT' : 'FRIEND DUEL'}</span>
      </div>
      <div className="finish-verdict">
        <span className="finish-medallion">
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
        <div>
          <h1>{v.title}</h1>
          <p>{v.subtitle}</p>
        </div>
      </div>
      <div className="finish-receipt">
        <div>
          <small>YOUR SCORE</small>
          <strong>
            {room.scores[room.seat]}
            <span> – {room.scores[1 - room.seat]}</span>
          </strong>
        </div>
        <div>
          <small>CORRECT ANSWERS</small>
          <strong>
            {correct}
            <span> / {scored.length} resolved</span>
          </strong>
        </div>
        <div>
          <small>COINS</small>
          <strong>
            {room.phase === 'cancelled' || room.winner === null
              ? 'Refunded'
              : room.config.stake
                ? `${room.winner === room.seat ? '+' : '−'}${room.config.stake}`
                : 'Free play'}
          </strong>
        </div>
      </div>
      <p className="receipt-note">
        {v.detail}{' '}
        {scored.length > mine.length
          ? `${scored.length - mine.length} completed rounds had no answer from you.`
          : ''}
        {rounds.length < room.roundIndex + (room.round?.result ? 1 : 0)
          ? ' Earlier round details may be unavailable for an older room.'
          : ''}
      </p>
      <div className="finish-actions">
        <Button onClick={onReplay} className="primary-action">
          {room.config.opponent === 'bot' ? 'Play again' : 'Set up rematch'}
          <ArrowRight />
        </Button>
        <Button variant="outline" onClick={onVault}>
          <BookOpen />
          Review my facts
        </Button>
        <Button variant="ghost" onClick={onFinish}>
          Done for now
        </Button>
      </div>
    </div>
  );
}
export function RoundReview({ room, player }: { room: any; player: any }) {
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
  return (
    <section className="round-review">
      <div className="review-title">
        <h2>{rounds.length > 1 ? 'The match, question by question.' : 'Here’s how it was decided.'}</h2>
        <span>
          {rounds.length} {rounds.length === 1 ? 'fact' : 'facts'}
        </span>
      </div>
      {rounds.length > 1 && (
        <div className="recap-tabs" aria-label="Choose a completed round">
          {rounds.map((row: any) => (
            <Button
              key={row.id}
              variant="ghost"
              aria-pressed={row.id === r.id}
              onClick={() => setSelected(row.id)}
            >
              Round {row.index + 1}
              <span>
                {row.result.reason === 'timing-inconsistent'
                  ? '—'
                  : row.result.winner === null
                    ? 'D'
                    : row.result.winner === room.seat
                      ? 'W'
                      : 'L'}
              </span>
            </Button>
          ))}
        </div>
      )}
      <div className="round-reason">
        <Check size={18} />
        <p>{roundReason(r, room.seat)}</p>
      </div>
      <div className="answer-receipt">
        {[
          [my, 'You'],
          [rival, room.players[1 - room.seat]?.kind === 'bot' ? 'Lucky Guess · bot' : 'Your rival'],
        ].map(([a, label]: any, i) => (
          <div key={i} className={a?.correct ? 'receipt-correct' : 'receipt-wrong'}>
            <span>{label}</span>
            <strong>{a ? (a.correct ? 'Correct' : 'Incorrect') : 'No answer'}</strong>
            <span>{a ? `${(a.elapsedMs / 1000).toFixed(3)} s` : '—'}</span>
            <p>{a ? q.options[a.choice] : 'No answer submitted'}</p>
            <small>
              {a?.simulated ? 'Scheduled bot time' : a ? 'Browser-reported time' : 'No response time'}
            </small>
          </div>
        ))}
      </div>
      <article className="fact-reveal">
        <div className="fact-reveal-top">
          <span>
            {q.topic} / {q.subtopic}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={saved ? 'Remove saved fact' : 'Save this fact'}
            aria-pressed={saved}
            onClick={() => player.save(q.question)}
          >
            <Bookmark fill={saved ? 'currentColor' : 'none'} />
          </Button>
        </div>
        <h3>{q.question}</h3>
        <p className="revealed-answer">
          <Check />
          {q.options[q.correctIndex]}
        </p>
        <details
          key={r.id}
          className="fact-explanation"
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
        <div className="fact-source-actions">
          <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">
            {q.sourceLabel}
            <ExternalLink size={14} />
          </a>
          <Button variant="ghost" onClick={() => setReportOpen(true)}>
            <Flag size={15} />
            {received ? 'Issue saved locally' : 'Question an answer'}
          </Button>
        </div>
      </article>
      <details className="timing-receipt">
        <summary>
          Timing & coin details
          <ChevronDown size={16} />
        </summary>
        <p className="small-note">
          Human times are reported by each browser. Bot times are scheduled randomly. A {room.tieMs} ms draw
          band applies when both answers are correct; these checks do not prove client honesty.
        </p>
        <div className="table-scroll">
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
        <p className="small-note">
          {room.config.stake} simulated coins each, reserved once. Current room balances:{' '}
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
