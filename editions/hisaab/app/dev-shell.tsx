'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- placeholder shell over untyped .mjs engine records */
/**
 * editions/hisaab/app/dev-shell.tsx — PLACEHOLDER UI. Proves the engine end to end in the edition
 * build and nothing more: it lists the routes, plays a route card, runs a bot Quick Draw to its
 * result, shows level + label, previews today's five and self-tests the P2P protocol in-page.
 * Unstyled on purpose; the UI lane replaces it (docs/hisaab/ENGINE.md is the API it should use).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { request } from '@/lib/duel-client';
import { usePlayer } from '@/app/use-player';
import { expeditionStatus, validExpeditionCards } from '@/lib/expeditions.mjs';
import { STORAGE } from '@/lib/storage-names.mjs';
import { EDITION, ROUTES, standing, todaysFive, DUEL_FORMATS, type Route } from '../edition';
import { useDuel, useQuestionShown } from './use-duel';
import { P2P_TRUST } from '../p2p/protocol.mjs';
import { createDuelController } from '../engine/duel-controller.mjs';

const box: React.CSSProperties = { border: '1px solid #8886', borderRadius: 8, padding: 12, margin: '12px 0' };

function Standing({ player }: { player: ReturnType<typeof usePlayer> }) {
  const s = standing(player.progression?.xp ?? 0);
  const quests = player.progression?.quests?.items ?? [];
  const streak = player.progression?.streak ?? { current: 0, best: 0 };
  return (
    <section style={box} aria-label="Standing" data-testid="standing">
      <h2>
        Level <span data-testid="level">{s.level}</span> · <span data-testid="label">{s.label.label}</span>
      </h2>
      <p>
        {s.label.line} — XP <span data-testid="xp">{player.progression?.xp ?? 0}</span> ({s.into}/{s.toNext} to
        next) · streak {streak.current} (best {streak.best}) · engine band “{s.title}”
      </p>
      <ul>
        {quests.map((q: any) => (
          <li key={q.id}>
            {q.label}: {q.progress}/{q.target}
            {q.done ? ' ✓' : ''}
          </li>
        ))}
      </ul>
      {!player.persistent && <p role="alert">{player.storageError}</p>}
    </section>
  );
}

function RoutePlayer({ route, player, onClose }: { route: Route; player: ReturnType<typeof usePlayer>; onClose: () => void }) {
  const record = player.profile.journeys?.[route.key];
  const run = record?.run && !record.folded ? record.run : null;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await request({ action: 'expedition', routeId: route.id });
      if (data.version !== route.version || !validExpeditionCards(data.cards, route))
        throw new Error('The route’s cards could not be checked.');
      await player.dispatch({
        type: 'journey-start',
        routeId: route.id,
        runId: crypto.randomUUID(),
        previousRunId: record?.run?.id ?? null,
        cards: data.cards,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const act = (type: string, extra: Record<string, unknown> = {}) =>
    player.dispatch({ type, routeId: route.id, runId: run.id, index: run.cursor, ...extra });

  if (!run || run.cursor === 6)
    return (
      <section style={box} data-testid="route-player">
        <h3>{route.title}</h3>
        <p>
          {route.subtitle} ({route.code}) — status {expeditionStatus(record)}
          {record?.last ? `, last score ${record.last.score} (${record.last.correct}/6)` : ''}
        </p>
        <button type="button" disabled={busy || !player.loaded} onClick={start} data-testid="route-start">
          {record?.first ? 'Replay route' : 'Start route'}
        </button>{' '}
        <button type="button" onClick={onClose}>
          Back
        </button>
        {error && <p role="alert">{error}</p>}
      </section>
    );

  const card = run.cards[run.cursor];
  const answer = run.answers[run.cursor];
  return (
    <section style={box} data-testid="route-player">
      <h3>
        {route.title} · {route.chapters[Math.floor(run.cursor / 2)]} · card {run.cursor + 1}/6
      </h3>
      <p data-testid="route-question">{card.question}</p>
      <ol>
        {card.options.map((option: string, i: number) => (
          <li key={option}>
            <button
              type="button"
              data-testid={`route-option-${i}`}
              disabled={!!answer}
              onClick={() => void act('journey-answer', { choice: i, confidence: 'steady' })}
            >
              {option}
              {answer && i === card.correctIndex ? ' ✓' : ''}
              {answer && answer.choice === i && i !== card.correctIndex ? ' ✗' : ''}
            </button>
          </li>
        ))}
      </ol>
      {answer && (
        <div data-testid="route-feedback">
          <p>
            <b>{answer.choice === card.correctIndex ? 'Correct.' : 'Not quite.'}</b> {card.explanation}
          </p>
          <p>
            Source:{' '}
            <a href={card.sourceUrl} target="_blank" rel="noreferrer">
              {card.sourceLabel}
            </a>
          </p>
          <button type="button" data-testid="route-next" onClick={() => void act('journey-next')}>
            {run.cursor === 5 ? 'Finish & collect stamp' : 'Next card'}
          </button>
        </div>
      )}
    </section>
  );
}

function BotDuel({ player, onRoom }: { player: ReturnType<typeof usePlayer>; onRoom: (room: any, epoch: string | null) => void }) {
  const { controller, snapshot } = useDuel(request);
  useQuestionShown(controller, snapshot);
  const [epoch, setEpoch] = useState<string | null>(null);
  const room = snapshot?.room;
  useEffect(() => onRoom(room ?? null, epoch), [room, epoch, onRoom]);
  const quick = DUEL_FORMATS[0];
  const start = async () => {
    if (!controller) return;
    controller.reset();
    const e = player.epoch();
    setEpoch(e);
    let name = 'Player';
    try {
      name = localStorage.getItem(STORAGE.name)?.trim().slice(0, 24) || name;
    } catch {}
    await controller.createBot({ name, config: { mode: quick.mode, duration: quick.duration } }).catch(() => {});
  };
  const rd = room?.round;
  const me = room?.seat ?? 0;
  return (
    <section style={box} data-testid="duel">
      <h2>Duel vs Bot — {quick.name}</h2>
      <button type="button" data-testid="duel-start" disabled={!controller || !player.loaded || snapshot?.busy} onClick={start}>
        Start {quick.name} vs Lucky Guess (BOT)
      </button>
      {snapshot?.error && <p role="alert">{snapshot.error}</p>}
      {room && (
        <div>
          <p data-testid="duel-phase">
            Phase: {room.phase} · {room.players.map((p: any) => p?.name ?? '…').join(' vs ')} · score{' '}
            {room.scores.join('–')}
          </p>
          {rd && !rd.question && snapshot?.countdownMs != null && (
            <p data-testid="duel-countdown">Question in {Math.ceil(snapshot.countdownMs / 1000)}…</p>
          )}
          {rd?.question && (
            <div>
              <p data-testid="duel-question">{rd.question.question}</p>
              {snapshot?.remainingMs != null && <p>Time left: {(snapshot.remainingMs / 1000).toFixed(1)} s</p>}
              <ol>
                {rd.question.options.map((option: string, i: number) => (
                  <li key={option}>
                    <button
                      type="button"
                      data-testid={`duel-option-${i}`}
                      disabled={!!rd.result || !!snapshot?.locked || snapshot?.shownRoundId !== rd.id}
                      onClick={() => void controller?.answer(i)}
                    >
                      {option}
                      {rd.result && i === rd.question.correctIndex ? ' ✓' : ''}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {rd?.result && (
            <div data-testid="duel-result">
              <p>
                Round: {rd.result.winner === null ? 'draw' : rd.result.winner === me ? 'you win' : 'bot wins'} (
                {rd.result.reason})
              </p>
              <ul>
                {(rd.receipts ?? []).map((r: any, i: number) => (
                  <li key={i}>
                    {room.players[i]?.name}:{' '}
                    {r ? `${r.correct ? 'correct' : 'wrong'} in ${Math.round(r.elapsedMs)} ms${r.simulated ? ' (scheduled bot)' : ''}` : 'no answer'}
                  </li>
                ))}
              </ul>
              {rd.question?.sourceUrl && (
                <p>
                  Source:{' '}
                  <a href={rd.question.sourceUrl} target="_blank" rel="noreferrer">
                    {rd.question.sourceLabel}
                  </a>
                </p>
              )}
            </div>
          )}
          {room.settled && (
            <p data-testid="duel-verdict">
              Match {room.reason}: {room.winner === null ? 'draw' : room.winner === me ? 'you won' : 'the bot won'}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function P2PSelfTest() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    setLog(['Pairing host and guest over the in-memory transport…']);
    try {
      const p2p = await import('../p2p/index.mjs');
      const [a, b] = p2p.createMemoryPair();
      const code = p2p.makeRoomCode();
      const host = p2p.createP2PHost({ transport: a, code, name: 'Host', config: { mode: 'quick' } });
      const guest = p2p.createP2PGuest({ transport: b, code, name: 'Guest' });
      const created = await host.start();
      const joined = await guest.join();
      const hc = createDuelController({ request: host.request });
      const gc = createDuelController({ request: guest.request });
      hc.adopt(created);
      gc.adopt(joined);
      host.onPoke(() => void hc.refresh());
      guest.onPoke(() => void gc.refresh());
      await Promise.all([hc.calibrate(3), gc.calibrate(3)]);
      await hc.ready();
      await gc.ready();
      setLog((l) => [...l, `Room ${code}: both ready, countdown running.`]);
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          for (const [c, right] of [
            [hc, true],
            [gc, false],
          ] as const) {
            const r = c.room;
            if (r?.round?.question && !r.round.result && c.snapshot().shownRoundId !== r.round.id) {
              c.markShown();
              const key = guest.expectedDeck(r.config)[r.roundIndex].correctIndex;
              setTimeout(() => void c.answer(right ? key : (key + 1) % 4), 250);
            }
          }
          if (hc.room?.settled && gc.room?.settled) {
            clearInterval(timer);
            resolve();
          }
        }, 50);
      });
      const r = gc.room;
      setLog((l) => [
        ...l,
        `Guest sees: ${r.round.result.reason}, winner seat ${r.winner}, score ${r.scores.join('–')}; deal verified: ${guest.verify(r)}.`,
      ]);
      hc.dispose();
      gc.dispose();
      await host.close();
      await guest.close();
    } catch (e: any) {
      setLog((l) => [...l, `Failed: ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };
  return (
    <section style={box} data-testid="p2p">
      <h2>Duel a Friend — protocol self-test</h2>
      <p>
        <b>{P2P_TRUST.label}.</b> {P2P_TRUST.body}
      </p>
      <button type="button" data-testid="p2p-run" disabled={running} onClick={run}>
        Run host + guest in this tab
      </button>
      <ul data-testid="p2p-log">
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export function DevShell() {
  const [duelRoom, setDuelRoom] = useState<{ room: any; epoch: string | null }>({ room: null, epoch: null });
  const player = usePlayer(duelRoom.room, duelRoom.epoch ?? undefined);
  const [open, setOpen] = useState<string | null>(null);
  const onRoom = useCallback((room: any, epoch: string | null) => setDuelRoom({ room, epoch }), []);
  const daily = useMemo(() => todaysFive(), []);
  const selected = ROUTES.find((r) => r.id === open) ?? null;
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '16px', font: '16px/1.5 system-ui, sans-serif' }}>
      <h1 ref={heading}>
        {EDITION.name} <small lang="hi">{EDITION.nameDevanagari}</small>
      </h1>
      <p>
        {EDITION.tagline} <i>{EDITION.motto}</i> — engine preview (placeholder UI) · {EDITION.questionCount} questions ·
        progress saved on this device only.
      </p>
      <Standing player={player} />
      <section style={box} aria-label="Routes" data-testid="routes">
        <h2>Routes ({ROUTES.length})</h2>
        <ul>
          {ROUTES.map((route) => (
            <li key={route.id} data-testid={`route-${route.id}`}>
              <button type="button" onClick={() => setOpen(route.id)} data-testid={`route-open-${route.id}`}>
                {route.title}
              </button>{' '}
              <small>
                {route.kind} · {route.code} · {route.ownCount}/6 own · {expeditionStatus(player.profile.journeys?.[route.key])}
              </small>
            </li>
          ))}
        </ul>
        {selected && <RoutePlayer key={selected.id} route={selected} player={player} onClose={() => setOpen(null)} />}
      </section>
      <BotDuel player={player} onRoom={onRoom} />
      <section style={box} aria-label="Aaj Ka Hisaab" data-testid="daily">
        <h2>Aaj Ka Hisaab — {daily.day}</h2>
        <ol>
          {daily.cards.map((card) => (
            <li key={card.factId}>
              {card.question} <small>({card.topic}, {card.difficulty})</small>
            </li>
          ))}
        </ol>
      </section>
      <P2PSelfTest />
    </main>
  );
}
