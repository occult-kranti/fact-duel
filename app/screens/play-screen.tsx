'use client';
import { useMemo } from 'react';
import { ArrowRight, ChevronRight, Info } from 'lucide-react';
import { rankForPoints } from '@/lib/progression.mjs';
import type { PlayScreenProps } from './types';
import { LaunchPanel } from './play/launch-panel';
import { MatchSettings } from './play/match-settings';
import { ModeCards } from './play/mode-cards';
import { JoinForm, OpponentPicker } from './play/opponent-picker';
import { usePlayJuice } from './play/press';
import { TopicChips } from './play/topic-chips';
import './play/play.css';

/* Play tab — "two taps from the lobby to the question" (design bible 10.2): format, opponent,
 * subject, then one launch control that is always in the thumb zone. Pure presentation over the
 * DuelController; every piece of state still lives in arena.tsx. */
export function PlayScreen({ duel, player, catalogue, joinView, joinLink }: PlayScreenProps) {
  const { config, name, busy, modeInfo, MODES, actions } = duel;
  const { go, change, create, join, setName, setJoinView, setJoinLink, clearFilters, chooseCollection } =
    actions;
  const { press } = usePlayJuice();
  const facets = catalogue?.facets || [];
  const pool = useMemo(
    () =>
      facets.filter((q: any) =>
        ['domain', 'region', 'topic', 'subtopic', 'difficulty'].every(
          (k) => (config as any)[k] === 'all' || q[k] === (config as any)[k],
        ),
      ),
    [facets, config],
  );
  const subtopics = useMemo(
    () => [
      ...new Set<string>(
        facets
          .filter(
            (q: any) =>
              (config.topic === 'all' || q.topic === config.topic) &&
              (config.domain === 'all' || q.domain === config.domain),
          )
          .map((q: any) => q.subtopic),
      ),
    ],
    [facets, config.topic, config.domain],
  );
  const canPlay = player.loaded && !!catalogue && pool.length >= modeInfo.rounds && !!name.trim();
  const canJoin = player.loaded && !busy && !!name.trim() && !!joinLink.trim();
  const rank = rankForPoints(player.progression?.rank?.points ?? 0);
  const level = player.level;
  const recent = player.journal.matches.slice(0, 5).reverse();
  return (
    <div className="fd-play">
      <header className="fd-play-head">
        <div>
          <p className="fd-play-eyebrow">THE KNOWLEDGE ARENA</p>
          <h1>Play</h1>
        </div>
        <button
          type="button"
          className="fd-player-chip fd-pressable"
          aria-label={`${name} — level ${level.level} ${level.title}, ${rank.label} rank on this device. Open your player.`}
          {...press}
          onClick={() => go('passport')}
        >
          <span className="fd-player-monogram" aria-hidden="true">
            {name.charAt(0).toUpperCase() || 'P'}
          </span>
          <span className="fd-player-body" aria-hidden="true">
            <strong>{name}</strong>
            <small>
              Lv {level.level} {level.title} · {rank.label}
            </small>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="fd-play-grid">
        <div className="fd-play-col">
          {!joinView && (
            <section id="formats" tabIndex={-1} className="fd-block" aria-labelledby="match-setup">
              <div className="fd-block-head">
                <h2 id="match-setup">Choose your format</h2>
                <span className="fd-block-note">One attempt per question</span>
              </div>
              <ModeCards
                modes={MODES}
                selected={config.mode}
                onSelect={(mode) => {
                  setJoinView(false);
                  change({ mode });
                }}
              />
            </section>
          )}

          <section className="fd-block" aria-labelledby="play-opponent">
            <div className="fd-block-head">
              <h2 id="play-opponent">Choose your opponent</h2>
            </div>
            <OpponentPicker
              opponent={config.opponent}
              joinView={joinView}
              duration={config.duration}
              onOpponent={(opponent) => change({ opponent })}
              onJoinView={setJoinView}
            />
            {joinView && (
              <JoinForm
                name={name}
                joinLink={joinLink}
                onName={(value) => setName(value, 'join')}
                onLink={setJoinLink}
              />
            )}
          </section>

          {!joinView && (
            <>
              <TopicChips
                catalogue={catalogue}
                domain={config.domain}
                topic={config.topic}
                onChoose={chooseCollection}
                onAll={() => go('collections')}
              />

              <section className="fd-block" aria-label="Match settings">
                <MatchSettings
                  config={config}
                  name={name}
                  subtopics={subtopics}
                  onChange={change}
                  onName={(value) => setName(value, 'create')}
                />
                <div className="fd-pool">
                  <span>
                    {catalogue ? `${pool.length} questions in this selection` : 'Loading questions…'}
                  </span>
                  <span>{modeInfo.rounds} needed</span>
                </div>
                {catalogue && pool.length < modeInfo.rounds && (
                  <div className="fd-warn" role="status">
                    <span>Not enough questions for {modeInfo.name}.</span>
                    <button type="button" className="fd-link" {...press} onClick={clearFilters}>
                      Use all topics
                    </button>
                    {pool.length > 0 && config.mode !== 'quick' && (
                      <button
                        type="button"
                        className="fd-link"
                        {...press}
                        onClick={() => change({ mode: 'quick' })}
                      >
                        Play one question
                      </button>
                    )}
                  </div>
                )}
              </section>

              <section className="fd-block" aria-labelledby="play-record">
                <div className="fd-block-head">
                  <h2 id="play-record">Your record</h2>
                  <button type="button" className="fd-link" {...press} onClick={() => go('journal')}>
                    Match history
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="fd-form">
                  <span className="fd-form-label">LAST FIVE</span>
                  {recent.length ? (
                    recent.map((m: any) => (
                      <span
                        key={m.id}
                        className="fd-form-dot"
                        data-outcome={m.outcome}
                        title={`${m.bot ? 'Bot' : 'Friend'} match: ${m.outcome}`}
                      >
                        {m.outcome === 'win' ? 'W' : m.outcome === 'loss' ? 'L' : 'D'}
                      </span>
                    ))
                  ) : (
                    <span className="fd-form-empty">Your first result goes here.</span>
                  )}
                </div>
                <p className="fd-fine">Level, rank and XP are kept on this device.</p>
              </section>
            </>
          )}

          <p className="fd-live-note">
            <Info size={15} aria-hidden="true" />
            Live rounds: stay on this screen. Switching away cancels and refunds.
            <button type="button" className="fd-link" {...press} onClick={() => go('rules')}>
              Full rules &amp; timing
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </p>
        </div>

        <aside className="fd-play-aside">
          <LaunchPanel
            joinView={joinView}
            busy={busy}
            playerLoaded={player.loaded}
            canPlay={canPlay}
            canJoin={canJoin}
            opponent={config.opponent}
            mode={modeInfo}
            duration={config.duration}
            stake={config.stake}
            onCreate={() => create()}
            onJoin={join}
          />
          <div className="fd-poster">
            <img
              src="/art/rivalry-stage.webp"
              alt="Polished lightning token and a metallic sports sphere surrounded by luminous science orbits"
              width="1672"
              height="941"
              loading="lazy"
              decoding="async"
            />
            <div className="fd-poster-copy">
              <span>SPORTS × SCIENCE</span>
              <strong>KNOW IT. PROVE IT.</strong>
            </div>
            <button type="button" className="fd-link fd-pressable" {...press} onClick={() => go('showroom')}>
              Enter the 3D arena
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
