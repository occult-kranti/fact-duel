'use client';
/**
 * Boards — the only leaderboards this device can show truthfully (synthesis feature 16; gamification
 * lane recommendation 2). Three tabs:
 *
 *  - Rivals: head-to-head records against the real people this device has duelled, from
 *    `profile.journal.matches` with `bot === false`. No practice-bot rows, ever.
 *  - This week: you against you — this ISO week beside last week, from the journal.
 *  - Leagues: a plain card that says leagues of 30 need accounts, and shows the rank and tier this
 *    device does know. No table, no invented entrants, no "N playing now".
 *
 * `at` is the clock, passed in by the parent (Date.now() after mount) so the week boundary is
 * computed once and SSR never disagrees with the browser. Pass 0 before mount: the card renders
 * without week figures until it arrives.
 */
import { useState } from 'react';
import { ArrowDown, ArrowUp, CalendarRange, Minus, Swords, Trophy, Users } from 'lucide-react';
import {
  ACCOUNTS_LIVE,
  LEAGUE_SIZE,
  PROMOTE_TOP,
  RELEGATE_BOTTOM,
  RELEGATION_MIN,
  rivals,
  youVsYou,
} from '@/lib/leagues.mjs';
import { RANK_TIERS, rankForPoints } from '@/lib/progression.mjs';
import { TierShield, usePress } from './shared';
import './boards.css';

type TabId = 'rivals' | 'week' | 'leagues';
type RivalRow = {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  lastAt: number;
  lastOutcome: 'win' | 'loss' | 'draw';
};
type Week = {
  weekKey: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  friendDuels: number;
  answered: number;
  correct: number;
  accuracy: number | null;
  bestSport: { topic: string; correct: number; answered: number } | null;
};
type YouVsYou = {
  weekKey: string;
  lastWeekKey: string;
  week: Week;
  last: Week;
  delta: { played: number; wins: number; friendDuels: number; answered: number; accuracy: number | null };
  empty: boolean;
};
type Tier = { id: string; label: string; min: number };
/** The slice of `player.profile` this card reads. The lib functions re-check every field. */
type Profile = {
  journal?: { matches?: unknown[]; rounds?: unknown[] };
  progression?: { rank?: { points: number; best: string } };
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'rivals', label: 'Rivals' },
  { id: 'week', label: 'This week' },
  { id: 'leagues', label: 'Leagues' },
];
const TIERS = RANK_TIERS as ReadonlyArray<Tier>;

const validAt = (at: number) => Number.isFinite(at) && at > 0;

/** "today", "yesterday", "N days ago" — whole local days between two timestamps. */
function daysAgo(at: number, then: number): string {
  if (!validAt(at) || !validAt(then)) return '';
  const days = Math.max(0, Math.floor((at - then) / 864e5));
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

export function Boards({ profile, at }: { profile: Profile; at: number }) {
  const [tab, setTab] = useState<TabId>('rivals');
  const press = usePress();
  const head = rivals(profile) as { rows: RivalRow[]; unnamed: number; friendDuels: number; reason: string | null };
  return (
    <section className="fd-card fd-boards" aria-labelledby="fd-boards-h">
      <span className="fd-card-label" id="fd-boards-h">
        <Trophy aria-hidden="true" /> Boards
      </span>

      <div className="fd-chips fd-boards-tabs" role="tablist" aria-label="Board">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`fd-boards-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="fd-boards-panel"
            className="fd-chip fd-btn"
            onPointerDown={press}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'rivals' && head.rows.length > 0 && <b>{head.rows.length}</b>}
          </button>
        ))}
      </div>

      <div id="fd-boards-panel" role="tabpanel" aria-labelledby={`fd-boards-tab-${tab}`} className="fd-boards-panel">
        {tab === 'rivals' && <RivalsTab head={head} at={at} />}
        {tab === 'week' && <WeekTab profile={profile} at={at} />}
        {tab === 'leagues' && <LeaguesTab profile={profile} />}
      </div>
    </section>
  );
}

/* ---------- Rivals ---------- */

function RivalsTab({
  head,
  at,
}: {
  head: { rows: RivalRow[]; unnamed: number; friendDuels: number; reason: string | null };
  at: number;
}) {
  if (head.rows.length === 0) {
    return (
      <div className="fd-boards-empty">
        <span className="fd-boards-empty-icon" aria-hidden="true">
          <Users />
        </span>
        {head.reason === 'no-opponent-identity' ? (
          <p>
            {head.unnamed === 1 ? 'One friend duel is' : `${head.unnamed} friend duels are`} on this device without
            an opponent name attached, so there is no one to list yet. Rivals appear here from your next friend
            duel.
          </p>
        ) : (
          <p>Rivals appear here after your first friend duel. Share a room code from Play.</p>
        )}
      </div>
    );
  }
  return (
    <>
      <ol className="fd-boards-rivals">
        {head.rows.map((r) => (
          <li key={r.name.toLocaleLowerCase()} className="fd-boards-rival" data-last={r.lastOutcome}>
            <span className="fd-boards-rival-who">
              <strong>{r.name}</strong>
              <span>
                {r.played} {r.played === 1 ? 'duel' : 'duels'}
                {validAt(at) ? ` · last ${daysAgo(at, r.lastAt)}` : ''}
              </span>
            </span>
            <span
              className="fd-boards-record"
              aria-label={`${r.wins} wins, ${r.losses} losses, ${r.draws} draws`}
            >
              <b>{r.wins}</b>
              <i>–</i>
              <b>{r.losses}</b>
              <i>–</i>
              <b>{r.draws}</b>
              <small>W–L–D</small>
            </span>
          </li>
        ))}
      </ol>
      <p className="fd-disclaimer">
        {head.unnamed > 0
          ? `Friend duels only, counted on this device. ${head.unnamed} earlier ${
              head.unnamed === 1 ? 'duel carries' : 'duels carry'
            } no opponent name and ${head.unnamed === 1 ? 'is' : 'are'} not listed.`
          : 'Friend duels only, counted on this device. Practice duels against the bot never appear here.'}
      </p>
    </>
  );
}

/* ---------- This week ---------- */

function Delta({ value, unit = '' }: { value: number | null; unit?: string }) {
  if (value === null || !Number.isFinite(value)) return <span className="fd-boards-delta" data-dir="none">no comparison</span>;
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'level';
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <span className="fd-boards-delta" data-dir={dir}>
      <Icon aria-hidden="true" />
      {value === 0 ? 'level with last week' : `${value > 0 ? '+' : '−'}${Math.abs(value)}${unit} vs last week`}
    </span>
  );
}

function WeekTab({ profile, at }: { profile: Profile; at: number }) {
  if (!validAt(at)) {
    return (
      <div className="fd-boards-empty">
        <span className="fd-boards-empty-icon" aria-hidden="true">
          <CalendarRange />
        </span>
        <p>Working out which week it is.</p>
      </div>
    );
  }
  const y = youVsYou(profile, { at, tzOffsetMinutes: new Date(at).getTimezoneOffset() }) as YouVsYou;
  if (y.empty) {
    return (
      <div className="fd-boards-empty">
        <span className="fd-boards-empty-icon" aria-hidden="true">
          <CalendarRange />
        </span>
        <p>No duels this week or last. Play one and this card starts counting.</p>
      </div>
    );
  }
  const w = y.week,
    l = y.last;
  return (
    <>
      <p className="fd-boards-weekline">
        <span className="fd-boards-weekkey">{y.weekKey}</span> against <span className="fd-boards-weekkey">{y.lastWeekKey}</span>
      </p>
      <dl className="fd-boards-stats">
        <div className="fd-boards-stat">
          <dt>Duels played</dt>
          <dd>
            <b>{w.played}</b>
            <span>last week {l.played}</span>
            <Delta value={y.delta.played} />
          </dd>
        </div>
        <div className="fd-boards-stat">
          <dt>Wins</dt>
          <dd>
            <b>{w.wins}</b>
            <span>last week {l.wins}</span>
            <Delta value={y.delta.wins} />
          </dd>
        </div>
        <div className="fd-boards-stat">
          <dt>Accuracy</dt>
          <dd>
            <b>{w.accuracy === null ? '—' : `${w.accuracy}%`}</b>
            <span>
              {w.answered ? `${w.correct} of ${w.answered} right` : 'nothing answered yet'}
              {l.accuracy !== null ? ` · last week ${l.accuracy}%` : ''}
            </span>
            <Delta value={y.delta.accuracy} unit=" pts" />
          </dd>
        </div>
        <div className="fd-boards-stat">
          <dt>Best sport</dt>
          <dd>
            <b className="fd-boards-sport">{w.bestSport ? w.bestSport.topic : '—'}</b>
            <span>
              {w.bestSport
                ? `${w.bestSport.correct} of ${w.bestSport.answered} right`
                : 'no correct answer yet this week'}
            </span>
            <span className="fd-boards-delta" data-dir="none">
              {l.bestSport ? `last week ${l.bestSport.topic}` : 'no best sport last week'}
            </span>
          </dd>
        </div>
      </dl>
      {w.friendDuels > 0 && (
        <p className="fd-boards-note">
          <Swords aria-hidden="true" />
          {w.friendDuels} of this week&apos;s {w.played === 1 ? 'duel was' : 'duels were'} against a friend.
        </p>
      )}
      <p className="fd-disclaimer">
        Counted from the duels on this device, practice included. Weeks run Monday to Sunday.
      </p>
    </>
  );
}

/* ---------- Leagues ---------- */

function LeaguesTab({ profile }: { profile: Profile }) {
  const rank = profile?.progression?.rank ?? { points: 0, best: 'bronze' };
  const info = rankForPoints(rank.points) as { tier: string; label: string };
  const index = Math.max(
    0,
    TIERS.findIndex((t) => t.id === info.tier),
  );
  return (
    <div className="fd-boards-leagues">
      <h3>
        {ACCOUNTS_LIVE
          ? `Your league of ${LEAGUE_SIZE}`
          : `Leagues of ${LEAGUE_SIZE} open when accounts arrive.`}
      </h3>
      <p>Until then your rating and tier live on this card.</p>
      <div className="fd-boards-tier">
        <span className="fd-rank-badge" data-tier={info.tier} aria-hidden="true">
          <TierShield pips={index + 1} />
        </span>
        <span className="fd-boards-tier-text">
          <strong>{info.label}</strong>
          <span>
            {rank.points} pts · best reached {TIERS.find((t) => t.id === rank.best)?.label ?? info.label}
          </span>
        </span>
      </div>
      <ul className="fd-boards-rules">
        <li>Leagues of {LEAGUE_SIZE}, matched by tier and by who actually played. Weekly, Monday reset.</li>
        <li>Top {PROMOTE_TOP} go up. Bottom {RELEGATE_BOTTOM} go down, only in a league of {RELEGATION_MIN} or more.</li>
        <li>Real people only. No bots, no filler, no invented counts.</li>
      </ul>
      <p className="fd-disclaimer">
        Nothing here leaves this device. Rank points are counted locally and never verify skill.
      </p>
    </div>
  );
}
