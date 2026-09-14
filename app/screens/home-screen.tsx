'use client';
/**
 * Home — the Arena Hub (design bible §10.1).
 * Hero row (knowledge core + player card) → primary CTA → daily quests → the expedition you left
 * open → Arena Rank → a bento row of recent XP and your stamp case. Everything on this screen is
 * read from the device-local progression record; nothing here talks to the server.
 */
import { ArrowRight, Bot, Sliders, Sparkles, Zap } from 'lucide-react';
import { EXPEDITIONS, expeditionStatus } from '@/lib/expeditions.mjs';
import { emptyProgression, levelForXp, rankForPoints } from '@/lib/progression.mjs';
import type { HomeScreenProps } from './types';
import { HeroStage } from './home/hero-stage';
import { PlayerCard } from './home/player-card';
import { QuestBoard } from './home/quest-board';
import { ExpeditionCard } from './home/expedition-card';
import { RankStrip } from './home/rank-strip';
import { StampShelf, XpLog, type LogEntry, type StampRoute } from './home/activity';
import { LiveStrip } from './events/live-strip';
import { accentOf, questRoute, untilReset, type QuestItem } from './home/util';
import { usePress } from './home/press';
import { useNow } from './home/use-now';
import './home/home.css';

export function HomeScreen({ player, name, ready, busy, onRoute, onDuel, onSetup, go }: HomeScreenProps) {
  const press = usePress();
  const now = useNow();

  const prog = player.progression ?? emptyProgression();
  const level = player.level ?? levelForXp(prog.xp);
  const rank = rankForPoints(prog.rank.points);
  const accent = accentOf(prog.cosmetics.equipped.accent);

  /* The expedition slot: an unfinished run always wins it (Zeigarnik), newest first — the same
     rule the Clubhouse used — otherwise the next route without a stamp. */
  const journeys = player.profile.journeys || {};
  const continuing = EXPEDITIONS.filter(
    (r: { key: string }) => expeditionStatus(journeys[r.key]) === 'continue',
  ).sort(
    (a: { key: string }, b: { key: string }) => journeys[b.key].run.startedAt - journeys[a.key].run.startedAt,
  )[0];
  const featured =
    continuing ?? EXPEDITIONS.find((r: { key: string }) => !journeys[r.key]?.first) ?? EXPEDITIONS[0];
  const record = journeys[featured.key];
  const isContinue = expeditionStatus(record) === 'continue';

  const earned = (EXPEDITIONS as StampRoute[])
    .filter((r) => journeys[r.key]?.first)
    .sort((a, b) => (journeys[b.key].first.at ?? 0) - (journeys[a.key].first.at ?? 0));
  const shelf = (earned.length ? earned.slice(0, 3) : (EXPEDITIONS as StampRoute[]).slice(0, 3)).map(
    (route) => ({ route, correct: journeys[route.key]?.first?.correct ?? null }),
  );

  const quests: QuestItem[] = prog.quests.items ?? [];
  const log: LogEntry[] = (prog.log ?? []).slice(0, 5);

  const playNow = () => onDuel('quick');
  const openQuest = (quest: QuestItem) => {
    const route = questRoute(quest);
    if (route.kind === 'duel' && ready && !busy) onDuel(route.mode, route.topic);
    else if (route.kind === 'expedition') onRoute(continuing?.id ?? null);
    else if (route.kind === 'tab') go(route.tab);
    else onSetup(route.kind === 'setup' ? route.intent : 'settings');
  };

  return (
    <section className="fd-home" aria-labelledby="fd-hub-title">
      <h1 id="fd-hub-title" className="fd-hub-sr">
        Arena hub
      </h1>

      <div className="fd-hub-hero">
        <HeroStage level={level.level} accent={accent.hex} progression={prog} />
        <PlayerCard
          name={name}
          level={level}
          streak={prog.streak}
          gems={prog.wallet.gems}
          rank={rank}
          points={prog.rank.points}
          frame={prog.cosmetics.equipped.frame}
          titleId={prog.cosmetics.equipped.title}
          accentToken={accent.token}
          onOpen={() => go('passport')}
        />
      </div>

      <div className="fd-hub-cta">
        <button
          type="button"
          className="fd-hub-btn fd-hub-btn--primary fd-hub-press"
          disabled={!ready || busy}
          onPointerDown={press}
          onClick={playNow}
        >
          <Zap aria-hidden="true" />
          <span className="fd-hub-cta-main">
            <strong>Play now</strong>
            <small>
              Quick Draw · one question vs Lucky Guess <i className="fd-hub-bot">BOT</i>
            </small>
          </span>
          <ArrowRight className="fd-hub-cta-arrow" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="fd-hub-btn fd-hub-btn--ghost fd-hub-press"
          onPointerDown={press}
          onClick={() => onSetup('settings')}
        >
          <Sliders aria-hidden="true" />
          Choose a match
        </button>
        <p className="fd-hub-cta-note">
          <Sparkles aria-hidden="true" />
          Some rounds come up wild and pay double or triple XP.
          <Bot aria-hidden="true" />
          Bots are always labelled.
        </p>
      </div>

      {/* The calendar, one line above the quests: what is on, what is next, how many modes are open. */}
      <LiveStrip go={go} />

      <QuestBoard items={quests} resetIn={now ? untilReset(now) : ''} onOpen={openQuest} />

      <ExpeditionCard
        route={featured}
        cursor={record?.run?.cursor ?? 0}
        answers={record?.run?.answers?.length ?? 0}
        continuing={isContinue}
        stamped={!!record?.first}
        onOpen={() => onRoute(featured.id)}
      />

      <RankStrip points={prog.rank.points} rank={rank} />

      <div className="fd-hub-bento">
        <XpLog entries={log} now={now} />
        <StampShelf
          stamps={shelf}
          total={EXPEDITIONS.length}
          earnedCount={earned.length}
          onOpen={(id) => onRoute(id)}
          onAll={() => onRoute(null)}
        />
      </div>
    </section>
  );
}
