'use client';
/**
 * Player — ownership and accomplishment on one screen (design bible 10.5).
 *
 * Order: identity (level / Arena Rank / streak) → mastery → achievements → stamp case → the Locker
 * → the legacy side quests and card finishes. Every number on this page comes from
 * `player.progression`; nothing is inferred or invented, and the one "on this device" disclaimer
 * lives on the Arena Rank card.
 *
 * The equipped accent cosmetic is published to `document.documentElement.dataset.accent`, which the
 * `[data-accent='…']` rules in ./player/player.css turn into the app-wide --fd-accent highlight.
 */
import { useEffect, useState } from 'react';
import { emptyProgression } from '@/lib/progression.mjs';
import { SETTINGS_KEYS } from '../shell/settings-sheet';
import { Passport } from '../passport';
import { MeasurementLink } from './analytics/link-card';
import { Achievements } from './player/achievements';
import { LevelCard } from './player/level-card';
import { Locker } from './player/locker';
import { Mastery } from './player/mastery';
import { RankCard } from './player/rank-card';
import { StampCase } from './player/stamp-case';
import { StreakCard } from './player/streak-card';
import type { PlayerScreenProps } from './types';
import './player/player.css';

export function PlayerScreen({ player, onOpenExpedition, onMissionAction, go }: PlayerScreenProps) {
  const progression = player.progression ?? emptyProgression();
  const accent: string = progression.cosmetics.equipped.accent;
  const [name, setName] = useState('');

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
          <p className="fd-eyebrow">KNOW IT. PROVE IT.</p>
          <h1>Your player record</h1>
        </div>
      </header>

      <div className="fd-player-hero">
        <LevelCard progression={progression} level={player.level} name={name} />
        <RankCard progression={progression} />
        <StreakCard progression={progression} />
      </div>

      {/* The Arena Rank card above says "on this device"; this is where that claim can be checked. */}
      <MeasurementLink onOpen={() => go('analytics')} />

      <section className="fd-sec" aria-labelledby="fd-mastery-h">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">WHERE YOU ARE STRONG</p>
            <h2 id="fd-mastery-h">Mastery</h2>
          </div>
          <span>Correct answers ÷ rounds played</span>
        </div>
        <Mastery progression={progression} />
      </section>

      <section className="fd-sec" aria-labelledby="fd-ach-h">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">THE BADGE CASE</p>
            <h2 id="fd-ach-h">Achievements</h2>
          </div>
          <span>Two are hidden until you find them</span>
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
            <p className="fd-eyebrow">DRESS THE CARD</p>
            <h2 id="fd-locker-sec-h">Locker</h2>
          </div>
          <span>Cosmetics only · free simulated gems</span>
        </div>
        <Locker player={player} />
      </section>

      <Passport player={player} onAction={onMissionAction} />
    </div>
  );
}
