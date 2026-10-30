'use client';
import { useMemo } from 'react';
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
import './over-entry.css';

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
  const { t, n, pick, locale, topic } = useLocale();
  const wallet = useWalletContext();
  const modeName = pick(`modes.${modeInfo.id}.name`, modeInfo.name);
  // Advice remains optional: opening setup must never increase a free entry.
  const suggested = useMemo(
    () => (wallet?.loaded ? defaultStake(wallet.wallet, offeredConfig(wallet.config)) : 0),
    [wallet],
  );
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
  return (
    <div className="fd-play jo-play">
      <header className="fd-play-head">
        <div>
          <p className="fd-play-eyebrow">{locale === 'hi' ? 'अपनी तरह खेलें' : 'Practice, your way'}</p>
          <h1>{locale === 'hi' ? 'अपना अगला ओवर चुनें' : 'Set your next over.'}</h1>
          <p className="jp-page-caption">{locale === 'hi' ? 'मिनी या फुल चुनें। विषय और दूसरी सेटिंग नीचे हैं।' : 'Choose Mini or Full. Topics and the finer details are below.'}</p>
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
          {catalogue && pool.length < modeInfo.rounds && !joinView && <div className="jo-launch-recovery" role="status"><p>{locale === 'hi' ? 'इस विषय चयन में पूरा ओवर नहीं बन सकता। सभी विषय चुनकर खेलें।' : 'This topic selection cannot fill your over. Choose all topics to play.'}</p><button type="button" onClick={clearFilters}>{t('play.useAll')}</button></div>}
          {!name.trim() && player.loaded && <div className="jo-launch-recovery"><label htmlFor="jo-nickname">{locale === 'hi' ? 'खेलने के लिए नाम' : 'Choose a playing name'}</label><input id="jo-nickname" autoComplete="nickname" maxLength={24} value={name} onChange={event => setName(event.target.value, joinView ? 'join' : 'create')} placeholder={locale === 'hi' ? 'आपका निकनेम' : 'Your nickname'} /></div>}
        </aside>
        <div className="fd-play-col">
          <div className="gc-match-summary"><b>{modeName} · {modeInfo.rounds} {locale === 'hi' ? 'सवाल' : 'questions'}</b><span>{config.topic === 'all' ? (locale === 'hi' ? 'सभी विषय' : 'All topics') : topic(config.topic)} · {config.opponent === 'bot' ? (locale === 'hi' ? 'अभ्यास बॉट' : 'Practice bot') : (locale === 'hi' ? 'दोस्त' : 'Friend')}</span><small>{locale === 'hi' ? 'अभी खेलें या नीचे ओवर बदलें। विषय और सेटिंग वैकल्पिक हैं।' : 'Start now, or change your over below. Topics and settings are optional.'}</small></div>
          {!joinView && <section className="jo-format-pick" aria-label={locale === 'hi' ? 'ओवर का आकार' : 'Over length'}>
            {MODES.filter((mode) => ['trilogy', 'gauntlet'].includes(mode.id)).map((mode) => <button type="button" key={mode.id} aria-pressed={config.mode === mode.id} disabled={busy} onClick={() => change({ mode: mode.id })}><strong>{pick(`modes.${mode.id}.name`, mode.name)}</strong><span>{mode.rounds} {locale === 'hi' ? 'राउंड' : 'rounds'}</span></button>)}
          </section>}
          <details className="gc-advanced" open={joinView || undefined}><summary>{locale === 'hi' ? 'विषय, प्रतिद्वंद्वी और वैकल्पिक सेटिंग' : 'Topics, opponent & optional settings'}</summary><div className="gc-advanced-body">
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
              onOpponent={(opponent) => change(opponent === 'bot' ? { opponent, stake: 0 } : { opponent, duration: config.duration > 10 ? 10 : config.duration })}
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

              </section>


            </>
          )}

          </div></details>
          <p className="fd-live-note">
            <Info size={15} aria-hidden="true" />
            {t('play.liveNote')}
            <button type="button" className="fd-link" {...press} onClick={() => go('rules')}>
              {t('play.fullRules')}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </p>
        </div>


      </div>
    </div>
  );
}
