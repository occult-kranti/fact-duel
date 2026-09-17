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
import { useLocale, type LocaleApi } from '../../use-locale';
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

/** `label` is the English name; the rendered label is `boards.<id>` from the locale. */
const TABS: { id: TabId; label: string }[] = [
  { id: 'rivals', label: 'Rivals' },
  { id: 'week', label: 'This week' },
  { id: 'leagues', label: 'Leagues' },
];
const TIERS = RANK_TIERS as ReadonlyArray<Tier>;

const validAt = (at: number) => Number.isFinite(at) && at > 0;

/** "today", "yesterday", "N days ago" — whole local days between two timestamps. */
function daysAgo(at: number, then: number, t: LocaleApi['t']): string {
  if (!validAt(at) || !validAt(then)) return '';
  const days = Math.max(0, Math.floor((at - then) / 864e5));
  return days === 0 ? t('boards.today') : days === 1 ? t('boards.yesterday') : t('boards.daysAgo', { n: days });
}

export function Boards({ profile, at }: { profile: Profile; at: number }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<TabId>('rivals');
  const press = usePress();
  const head = rivals(profile) as { rows: RivalRow[]; unnamed: number; friendDuels: number; reason: string | null };
  return (
    <section className="fd-card fd-boards" aria-labelledby="fd-boards-h">
      <span className="fd-card-label" id="fd-boards-h">
        <Trophy aria-hidden="true" /> {t('boards.label')}
      </span>

      <div className="fd-chips fd-boards-tabs" role="tablist" aria-label={t('boards.tabAria')}>
        {TABS.map((tab_) => (
          <button
            key={tab_.id}
            type="button"
            role="tab"
            id={`fd-boards-tab-${tab_.id}`}
            aria-selected={tab === tab_.id}
            aria-controls="fd-boards-panel"
            className="fd-chip fd-btn"
            onPointerDown={press}
            onClick={() => setTab(tab_.id)}
          >
            {t(`boards.${tab_.id}`)}
            {tab_.id === 'rivals' && head.rows.length > 0 && <b>{head.rows.length}</b>}
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
  const { t, n } = useLocale();
  if (head.rows.length === 0) {
    return (
      <div className="fd-boards-empty">
        <span className="fd-boards-empty-icon" aria-hidden="true">
          <Users />
        </span>
        {head.reason === 'no-opponent-identity' ? (
          <p>
            {head.unnamed === 1 ? t('boards.unnamedOne') : t('boards.unnamedMany', { n: head.unnamed })}
            {t('boards.unnamedRest')}
          </p>
        ) : (
          <p>{t('boards.empty')}</p>
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
                {n('boards.duels', r.played)}
                {validAt(at) ? t('boards.last', { when: daysAgo(at, r.lastAt, t) }) : ''}
              </span>
            </span>
            <span
              className="fd-boards-record"
              aria-label={t('boards.recordAria', { w: r.wins, l: r.losses, d: r.draws })}
            >
              <b>{r.wins}</b>
              <i>–</i>
              <b>{r.losses}</b>
              <i>–</i>
              <b>{r.draws}</b>
              <small>{t('boards.wld')}</small>
            </span>
          </li>
        ))}
      </ol>
      <p className="fd-disclaimer">
        {head.unnamed > 0 ? n('boards.unnamedNote', head.unnamed) : t('boards.disclaimer')}
      </p>
    </>
  );
}

/* ---------- This week ---------- */

function Delta({ value, unit = '' }: { value: number | null; unit?: string }) {
  const { t } = useLocale();
  if (value === null || !Number.isFinite(value)) return <span className="fd-boards-delta" data-dir="none">{t('boards.noComparison')}</span>;
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'level';
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <span className="fd-boards-delta" data-dir={dir}>
      <Icon aria-hidden="true" />
      {value === 0
        ? t('boards.level')
        : t('boards.vsLast', { sign: value > 0 ? '+' : '−', n: Math.abs(value), unit })}
    </span>
  );
}

function WeekTab({ profile, at }: { profile: Profile; at: number }) {
  const { t, n, topic } = useLocale();
  if (!validAt(at)) {
    return (
      <div className="fd-boards-empty">
        <span className="fd-boards-empty-icon" aria-hidden="true">
          <CalendarRange />
        </span>
        <p>{t('boards.workingOut')}</p>
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
        <p>{t('boards.noDuels')}</p>
      </div>
    );
  }
  const w = y.week,
    l = y.last;
  return (
    <>
      <p className="fd-boards-weekline">
        <span className="fd-boards-weekkey">{y.weekKey}</span> {t('boards.against')}{' '}
        <span className="fd-boards-weekkey">{y.lastWeekKey}</span>
      </p>
      <dl className="fd-boards-stats">
        <div className="fd-boards-stat">
          <dt>{t('boards.duelsPlayed')}</dt>
          <dd>
            <b>{w.played}</b>
            <span>{t('boards.lastWeek', { n: l.played })}</span>
            <Delta value={y.delta.played} />
          </dd>
        </div>
        <div className="fd-boards-stat">
          <dt>{t('boards.wins')}</dt>
          <dd>
            <b>{w.wins}</b>
            <span>{t('boards.lastWeek', { n: l.wins })}</span>
            <Delta value={y.delta.wins} />
          </dd>
        </div>
        <div className="fd-boards-stat">
          <dt>{t('boards.accuracy')}</dt>
          <dd>
            <b>{w.accuracy === null ? '—' : `${w.accuracy}%`}</b>
            <span>
              {w.answered ? t('boards.ofRight', { c: w.correct, a: w.answered }) : t('boards.nothingAnswered')}
              {l.accuracy !== null ? t('boards.lastWeekPct', { n: l.accuracy }) : ''}
            </span>
            <Delta value={y.delta.accuracy} unit={t('boards.ptsUnit')} />
          </dd>
        </div>
        <div className="fd-boards-stat">
          <dt>{t('boards.bestSport')}</dt>
          <dd>
            <b className="fd-boards-sport">{w.bestSport ? topic(w.bestSport.topic) : '—'}</b>
            <span>
              {w.bestSport
                ? t('boards.ofRight', { c: w.bestSport.correct, a: w.bestSport.answered })
                : t('boards.noCorrect')}
            </span>
            <span className="fd-boards-delta" data-dir="none">
              {l.bestSport ? t('boards.lastWeekSport', { topic: topic(l.bestSport.topic) }) : t('boards.noBestSport')}
            </span>
          </dd>
        </div>
      </dl>
      {w.friendDuels > 0 && (
        <p className="fd-boards-note">
          <Swords aria-hidden="true" />
          {n('boards.friendOf', w.played, { n: w.friendDuels })}
        </p>
      )}
      <p className="fd-disclaimer">{t('boards.counted')}</p>
    </>
  );
}

/* ---------- Leagues ---------- */

function LeaguesTab({ profile }: { profile: Profile }) {
  const { t } = useLocale();
  const rank = profile?.progression?.rank ?? { points: 0, best: 'bronze' };
  const info = rankForPoints(rank.points) as { tier: string; label: string };
  const index = Math.max(
    0,
    TIERS.findIndex((tier) => tier.id === info.tier),
  );
  return (
    <div className="fd-boards-leagues">
      <h3>{ACCOUNTS_LIVE ? t('boards.leagueOf', { n: LEAGUE_SIZE }) : t('boards.leaguesOpen', { n: LEAGUE_SIZE })}</h3>
      <p>{t('boards.untilThen')}</p>
      <div className="fd-boards-tier">
        <span className="fd-rank-badge" data-tier={info.tier} aria-hidden="true">
          <TierShield pips={index + 1} />
        </span>
        <span className="fd-boards-tier-text">
          <strong>{info.label}</strong>
          <span>
            {t('boards.tierLine', { pts: rank.points, label: TIERS.find((tier) => tier.id === rank.best)?.label ?? info.label })}
          </span>
        </span>
      </div>
      <ul className="fd-boards-rules">
        <li>{t('boards.ruleOne', { n: LEAGUE_SIZE })}</li>
        <li>{t('boards.ruleTwo', { top: PROMOTE_TOP, bottom: RELEGATE_BOTTOM, min: RELEGATION_MIN })}</li>
        <li>{t('boards.ruleThree')}</li>
      </ul>
      <p className="fd-disclaimer">{t('boards.nothingLeaves')}</p>
    </div>
  );
}
