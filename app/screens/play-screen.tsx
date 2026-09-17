'use client';
import { SUBJECT_LINE } from '@/lib/content.mjs';
import { useEffect, useMemo, useRef } from 'react';
import { ArrowRight, ChevronRight, Info } from 'lucide-react';
import { rankForPoints } from '@/lib/progression.mjs';
import { defaultStake } from '@/lib/economy/stake-advice.mjs';
import { useWalletContext } from '../use-wallet';
import { useLocale } from '../use-locale';
import type { PlayScreenProps } from './types';
import { LaunchPanel } from './play/launch-panel';
import { MatchSettings, offeredConfig } from './play/match-settings';
import { ModeCards } from './play/mode-cards';
import { ModesRow } from './events/modes-row';
import { JoinForm, OpponentPicker } from './play/opponent-picker';
import { usePlayJuice } from './play/press';
import { TopicChips } from './play/topic-chips';
import './play/play.css';

/* Play tab — "two taps from the lobby to the question" (design bible 10.2): format, opponent,
 * subject, then one launch control that is always in the thumb zone. Pure presentation over the
 * DuelController; every piece of state still lives in arena.tsx. */
export function PlayScreen({ duel, player, catalogue, joinView, joinLink }: PlayScreenProps) {
  const { config, name, busy, modeInfo, MODES, actions } = duel;
  const {
    go,
    change,
    create,
    join,
    setName,
    setJoinView,
    setJoinLink,
    clearFilters,
    chooseCollection,
    chooseEventMode,
  } = actions;
  const { press } = usePlayJuice();
  const { t, n, pick } = useLocale();
  const wallet = useWalletContext();
  const modeName = pick(`modes.${modeInfo.id}.name`, modeInfo.name);
  /* The entry tier the wallet suggests (lib/economy/stake-advice.mjs): the highest offered tier it
   * covers five times over, else the lowest it can afford, else free. Applied to the configurator
   * ONCE, the first time the wallet is loaded while a friend duel is being set up at a free entry,
   * and never after the player has touched the picker. It never raises a tier already chosen. */
  const suggested = useMemo(
    () => (wallet?.loaded ? defaultStake(wallet.wallet, offeredConfig(wallet.config)) : 0),
    [wallet],
  );
  const stakeTouched = useRef(false);
  const stakeApplied = useRef(false);
  const friendAtFree = config.opponent === 'friend' && config.stake === 0;
  useEffect(() => {
    if (!wallet?.loaded || stakeApplied.current || stakeTouched.current || !friendAtFree) return;
    stakeApplied.current = true;
    if (suggested > 0) change({ stake: suggested });
  }, [wallet?.loaded, friendAtFree, suggested, change]);
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
          <p className="fd-play-eyebrow">{t('play.eyebrow')}</p>
          <h1>{t('play.title')}</h1>
        </div>
        <button
          type="button"
          className="fd-player-chip fd-pressable"
          aria-label={t('play.chipAria', { name, level: level.level, title: level.title, rank: rank.label })}
          {...press}
          onClick={() => go('passport')}
        >
          <span className="fd-player-monogram" aria-hidden="true">
            {name.charAt(0).toUpperCase() || 'P'}
          </span>
          <span className="fd-player-body" aria-hidden="true">
            <strong>{name}</strong>
            <small>{t('play.lv', { level: level.level, title: level.title, rank: rank.label })}</small>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="fd-play-grid">
        <div className="fd-play-col">
          {!joinView && <ModesRow activeId={duel.eventModeId} onChoose={chooseEventMode} go={go} />}

          {!joinView && (
            <section id="formats" tabIndex={-1} className="fd-block" aria-labelledby="match-setup">
              <div className="fd-block-head">
                <h2 id="match-setup">{t('play.formatH')}</h2>
                <span className="fd-block-note">{t('play.oneAttempt')}</span>
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
              <h2 id="play-opponent">{t('play.opponentH')}</h2>
            </div>
            <OpponentPicker
              opponent={config.opponent}
              joinView={joinView}
              duration={config.duration}
              onOpponent={(opponent) => change(opponent === 'bot' ? { opponent, stake: 0 } : { opponent })}
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

              <section className="fd-block" aria-label={t('play.matchSettings')}>
                <MatchSettings
                  config={config}
                  name={name}
                  subtopics={subtopics}
                  onChange={(patch) => {
                    if ('stake' in patch) stakeTouched.current = true;
                    change(patch);
                  }}
                  onName={(value) => setName(value, 'create')}
                  wallet={wallet}
                  suggested={suggested}
                />
                <div className="fd-pool">
                  <span>
                    {catalogue ? n('play.questions', modeInfo.rounds) : t('play.loading')}
                  </span>
                </div>
                {catalogue && pool.length < modeInfo.rounds && (
                  <div className="fd-warn" role="status">
                    <span>{t('play.notEnough', { mode: modeName })}</span>
                    <button type="button" className="fd-link" {...press} onClick={clearFilters}>
                      {t('play.useAll')}
                    </button>
                    {pool.length > 0 && config.mode !== 'quick' && (
                      <button
                        type="button"
                        className="fd-link"
                        {...press}
                        onClick={() => change({ mode: 'quick' })}
                      >
                        {t('play.playOne')}
                      </button>
                    )}
                  </div>
                )}
              </section>

              <section className="fd-block" aria-labelledby="play-record">
                <div className="fd-block-head">
                  <h2 id="play-record">{t('play.record')}</h2>
                  <button type="button" className="fd-link" {...press} onClick={() => go('journal')}>
                    {t('play.history')}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="fd-form">
                  <span className="fd-form-label">{t('play.lastFive')}</span>
                  {recent.length ? (
                    recent.map((m: any) => (
                      <span
                        key={m.id}
                        className="fd-form-dot"
                        data-outcome={m.outcome}
                        title={t('play.matchTitle', {
                          who: m.bot ? t('play.bot') : t('play.friend'),
                          outcome: pick(`outcome.${m.outcome}`, m.outcome),
                        })}
                      >
                        {m.outcome === 'win' ? 'W' : m.outcome === 'loss' ? 'L' : 'D'}
                      </span>
                    ))
                  ) : (
                    <span className="fd-form-empty">{t('play.firstResult')}</span>
                  )}
                </div>
                <p className="fd-fine">{t('play.kept')}</p>
              </section>
            </>
          )}

          <p className="fd-live-note">
            <Info size={15} aria-hidden="true" />
            {t('play.liveNote')}
            <button type="button" className="fd-link" {...press} onClick={() => go('rules')}>
              {t('play.fullRules')}
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
              alt={t('play.posterAlt')}
              width="1672"
              height="941"
              loading="lazy"
              decoding="async"
            />
            <div className="fd-poster-copy">
              <span>{SUBJECT_LINE}</span>
              <strong>{t('footer.tagline')}</strong>
            </div>
            <button type="button" className="fd-link fd-pressable" {...press} onClick={() => go('showroom')}>
              {t('play.enter3d')}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
