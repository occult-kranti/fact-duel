'use client';
/**
 * Expeditions container — atlas ⇄ brief ⇄ run. Owns the only network call on this surface
 * (`action: 'expedition'`) and the journey-start dispatch; every other write happens inside the run.
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { expeditionById, validExpeditionCards } from '@/lib/expeditions.mjs';
import { request } from '@/lib/duel-client';
import { ExpeditionAtlas } from './atlas';
import { ExpeditionBrief } from './brief';
import { useTap } from './parts';
import { ExpeditionRun } from './run';

export type ExpeditionsProps = {
  selected: string | null;
  onSelect: (id: string | null) => void;
  player: any;
  onDuel: (mode: string, topic?: string) => void;
  onBack: () => void;
  /** Route to the Vault, for the finish screen's seeded deck. Absent = the misses re-read in place. */
  onVault?: () => void;
  /** Legacy tone generator. Still accepted; feedback now runs through useJuice(). */
  signal: (s: string) => void;
};

export default function Expeditions({
  selected,
  onSelect,
  player,
  onDuel,
  onBack,
  onVault,
}: ExpeditionsProps) {
  const tap = useTap();
  const [busy, setBusy] = useState(false),
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

  if (!route) return <ExpeditionAtlas player={player} onSelect={onSelect} onBack={onBack} />;

  return (
    <section className="fd-exp fd-exp-view">
      <div className="fd-exp-topbar">
        <button type="button" className="fd-exp-ghost" onPointerDown={tap} onClick={() => onSelect(null)}>
          <ArrowLeft size={17} aria-hidden="true" />
          {record?.run && !record.folded && record.run.cursor < 6 ? 'Pause & browse' : 'All expeditions'}
        </button>
        <span className="fd-mono">SOLO · NO TIMER</span>
      </div>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {/* A folded run keeps its `run` so the reducer can refuse late answers; the route is released, so
          the brief — the only route back to `start()` — is what the player must see. */}
      {record?.run && !record.folded ? (
        <ExpeditionRun
          key={`${route.key}:${record.run.id}:${player.profile.epoch}`}
          route={route}
          record={record}
          player={player}
          onReplay={start}
          busy={busy}
          onDone={() => onSelect(null)}
          onDuel={() => onDuel('trilogy', route.topic)}
          onVault={onVault}
        />
      ) : (
        <ExpeditionBrief route={route} record={record} busy={busy} loaded={player.loaded} onStart={start} />
      )}
    </section>
  );
}
