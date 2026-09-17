'use client';
/**
 * Player — ownership and accomplishment on one screen (design bible 10.5).
 *
 * Order: identity (level / Arena Rank / streak / Conviction) → topic record → achievements → stamp
 * case → the Locker → the legacy side quests and card finishes. Every number on this page comes from
 * `player.progression`; nothing is inferred or invented, and the "on this device" disclaimers sit on
 * the two cards that make a claim about the player — Arena Rank and Conviction.
 *
 * Conviction is the fourth hero card rather than a section of its own because it is identity: it is
 * the badge the expedition betting mode mints, and it belongs beside the other three things this
 * device knows about you, not down among the records.
 *
 * The equipped accent cosmetic is published to `document.documentElement.dataset.accent`, which the
 * `[data-accent='…']` rules in ./player/player.css turn into the app-wide --fd-accent highlight.
 */
import { useEffect, useState } from 'react';
import { emptyProgression } from '@/lib/progression.mjs';
import { SETTINGS_KEYS } from '../shell/settings-sheet';
import { Passport } from '../passport';
import { MeasurementLink } from './analytics/link-card';
import { Boards } from './player/boards';
import { Achievements } from './player/achievements';
import { ConvictionCard } from './player/conviction-card';
import { LevelCard } from './player/level-card';
import { Locker } from './player/locker';
import { Mastery } from './player/mastery';
import { RankCard } from './player/rank-card';
import { StampCase } from './player/stamp-case';
import { StreakCard } from './player/streak-card';
import { SupporterCard } from './player/supporter-card';
import type { PlayerScreenProps } from './types';
import { useLocale } from '../use-locale';
import './player/player.css';

export function PlayerScreen({ player, onOpenExpedition, onMissionAction, go }: PlayerScreenProps) {
  const { t } = useLocale();
  const progression = player.progression ?? emptyProgression();
  const accent: string = progression.cosmetics.equipped.accent;
  const [name, setName] = useState('');
  const boardsAt = useBoardsClock(player.profile.revision);

  // The player's name lives in the shell's settings (localStorage); read it for the monogram only.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setName(localStorage.getItem(SETTINGS_KEYS.name) ?? '');
    } catch {
      /* storage blocked — the card falls back to "Challenger". */
    }
  }, [player.profile.revision]);

  // Publish the equipped accent so every --fd-accent highlight picks it up.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  return (
    <div className="fd-player">
      <header className="fd-player-head">
        <div>
          <p className="fd-eyebrow">{t('player.eyebrow')}</p>
          <h1>{t('player.title')}</h1>
        </div>
      </header>

      {/* The Supporter Card is the identity hook: handle, allegiance per sport, per-sport rating and
          season, matchweek streak, the age band. All device-local; it says so itself. */}
      <SupporterCard player={player} />

      <div className="fd-player-hero">
        <LevelCard progression={progression} level={player.level} name={name} />
        <RankCard progression={progression} />
        <StreakCard progression={progression} />
        <ConvictionCard progression={progression} />
      </div>

      {/* The Arena Rank card above says "on this device"; this is where that claim can be checked. */}
      <MeasurementLink onOpen={() => go('analytics')} />
      <section className="fd-sec" aria-labelledby="fd-boards-sec-h">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">{t('player.boardsEyebrow')}</p>
            <h2 id="fd-boards-sec-h">{t('player.boards')}</h2>
          </div>
          <span>{t('player.boardsNote')}</span>
        </div>
        <Boards profile={player.profile} at={boardsAt} />
      </section>

      {/* Only `counters.byTopic` feeds these bars and only duel rounds write it, so the heading and
          the aside name what is counted instead of claiming strength the numbers cannot support. */}
      <section className="fd-sec" aria-labelledby="fd-topic-h">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">{t('player.topicEyebrow')}</p>
            <h2 id="fd-topic-h">{t('player.topic')}</h2>
          </div>
          <span>{t('player.topicNote')}</span>
        </div>
        <Mastery progression={progression} />
      </section>

      <section className="fd-sec" aria-labelledby="fd-ach-h">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">{t('player.achEyebrow')}</p>
            <h2 id="fd-ach-h">{t('player.ach')}</h2>
          </div>
          <span>{t('player.achNote')}</span>
        </div>
        <Achievements progression={progression} />
      </section>

      {/* ExpeditionCase brings its own "Your expedition stamps" heading; the 3D case sits above it. */}
      <section className="fd-sec">
        <StampCase player={player} onOpen={onOpenExpedition} />
      </section>

      <section className="fd-sec" aria-labelledby="fd-locker-sec-h">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">{t('player.lockerEyebrow')}</p>
            <h2 id="fd-locker-sec-h">{t('player.locker')}</h2>
          </div>
          <span>{t('player.lockerNote')}</span>
        </div>
        <Locker player={player} />
      </section>

      <Passport player={player} onAction={onMissionAction} />
    </div>
  );
}

/** The wall clock for the week boards, read in an effect so server and first client render agree. */
function useBoardsClock(revision: number): number {
  const [at, setAt] = useState(0);
  useEffect(() => {
    const read = () => setAt(Date.now());
    read();
    window.addEventListener('focus', read);
    return () => window.removeEventListener('focus', read);
  }, [revision]);
  return at;
}
