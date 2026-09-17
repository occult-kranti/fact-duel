'use client';
/**
 * Supporter Card — the identity hook at the top of the Player screen (lane-gamification finding 1).
 *
 * Handle, one allegiance per sport (free text the player types; no club list, no crests), the
 * per-sport rating and tier with a provisional mark, the real-calendar season and its days left,
 * the matchweek streak with its earned shields, the seven-step completeness bar and the age band.
 *
 * Honesty rules on this card: every number comes from `player.profile.supporter` on this device; a
 * sport with no rated duel says "Not yet rated" instead of showing 1000; the guest line says plainly
 * that accounts do not exist yet; the age question has no pre-selected answer; and nothing here
 * takes coins or an ad — a lost matchweek streak stays lost unless an earned shield covered it.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Check, Flame, Pencil, ShieldCheck, UserRound, X } from 'lucide-react';
import {
  AGE_BANDS,
  ALLEGIANCE_MAX,
  HANDLE_RE,
  PROVISIONAL_DUELS,
  SEASON_TIERS,
  SPORTS,
  cardProgress,
  emptySupporter,
  nextTier,
  seasonFor,
  tierFor,
} from '@/lib/season.mjs';
import type { Player } from '../types';
import { Meter, usePress } from './shared';
import './supporter.css';

type Tier = { id: string; label: string; min: number };
type Rating = { rating: number; ratedGames: number; provisional: boolean; duels: number };
type Streak = { current: number; best: number; shields: number; shieldProgressDays: number };
type Season =
  | { offSeason: false; id: string; label: string; end: string; daysLeft: number; note?: string }
  | { offSeason: true; label: string; next: { label: string; start: string } | null; daysUntil: number | null };
type Op =
  | { type: 'allegiance'; sport: string; team: string }
  | { type: 'handle'; handle: string }
  | { type: 'age-band'; band: string };

const AGE_LABELS: Record<string, string> = {
  'under-18': 'Under 18',
  '18-plus': '18 or over',
  'prefer-not': 'Prefer not to say',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2027-08-21' → '21 Aug 2027', with no Date object so SSR and the browser agree. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m || 1) - 1]} ${y}`;
}
const tiers = SEASON_TIERS as ReadonlyArray<Tier>;

export function SupporterCard({ player }: { player: Player }) {
  const sup = player.profile.supporter ?? emptySupporter();
  const clock = useClock(player.profile.revision);
  const progress = cardProgress(sup, player.profile) as {
    done: number;
    total: number;
    steps: { id: string; label: string; done: boolean }[];
  };
  const press = usePress();
  const act = (op: Op) => void player.dispatch({ type: 'supporter', op });

  return (
    <section className="fd-card fd-supporter" aria-labelledby="fd-sup-h">
      <span className="fd-card-label" id="fd-sup-h">
        <UserRound aria-hidden="true" /> Supporter Card
      </span>

      <HandleRow handle={sup.handle} onSave={(handle) => act({ type: 'handle', handle })} press={press} />

      <div className="fd-sup-progress">
        <div className="fd-sup-progress-row">
          <span>Card complete</span>
          <b>
            {progress.done} of {progress.total}
          </b>
        </div>
        <Meter value={progress.done / progress.total} label={`Card ${progress.done} of ${progress.total} complete`} />
        <ul className="fd-sup-steps">
          {progress.steps.map((s) => (
            <li key={s.id} data-done={s.done}>
              {s.done ? <Check aria-hidden="true" /> : <span className="fd-sup-step-dot" aria-hidden="true" />}
              <span>{s.label}</span>
              <span className="fd-sr">{s.done ? ' — done' : ' — not yet'}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="fd-sup-rows" aria-label="Your sports">
        {SPORTS.map((sport: string) => (
          <SportRow
            key={sport}
            sport={sport}
            team={sup.allegiance[sport] ?? ''}
            rating={sup.ratings[sport] ?? null}
            streak={sup.streaks[sport] ?? null}
            season={clock ? (seasonFor(sport, clock.now, clock.tz) as Season) : null}
            onTeam={(team) => act({ type: 'allegiance', sport, team })}
            press={press}
          />
        ))}
      </ul>

      <fieldset className="fd-sup-age">
        <legend>Age band</legend>
        <p className="fd-sup-age-why">
          Used for one thing: keeping any ads non-personalised for under-18s. It stays on this device.
        </p>
        <div className="fd-sup-age-opts" role="group" aria-label="Age band">
          {(AGE_BANDS as ReadonlyArray<string>).map((band) => (
            <button
              key={band}
              type="button"
              className="fd-sup-age-btn fd-btn"
              aria-pressed={sup.ageBand === band}
              onPointerDown={press}
              onClick={() => act({ type: 'age-band', band })}
            >
              {AGE_LABELS[band]}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="fd-disclaimer">
        Jaanta Hai Kya ratings count human duels only and live on this device. Shields are earned by
        playing seven days running in a sport; nothing here can be bought or won back from an ad.
      </p>
    </section>
  );
}

/**
 * The local clock, read after mount and again on every profile write, so the server render and the
 * first client frame agree (no season line) and the days-left figure follows the latest duel.
 */
function useClock(revision: number): { now: number; tz: number } | null {
  const [clock, setClock] = useState<{ now: number; tz: number } | null>(null);
  useEffect(() => {
    const read = () => setClock({ now: Date.now(), tz: -new Date().getTimezoneOffset() });
    read();
    window.addEventListener('focus', read);
    return () => window.removeEventListener('focus', read);
  }, [revision]);
  return clock;
}

/* ---------- handle ---------- */
function HandleRow({
  handle,
  onSave,
  press,
}: {
  handle: string | null;
  onSave: (handle: string) => void;
  press: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const valid = draft === '' || HANDLE_RE.test(draft);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave(draft);
    setEditing(false);
  };
  return (
    <div className="fd-sup-head">
      <div className="fd-sup-id">
        <h2>{handle ?? 'Guest'}</h2>
        {!handle && (
          <p className="fd-sup-guest">
            Your card lives on this device. Sign-in arrives with accounts — nothing you earn is lost then.
          </p>
        )}
      </div>
      {editing ? (
        <form className="fd-sup-edit" onSubmit={submit}>
          <label className="fd-sr" htmlFor="fd-sup-handle">
            Handle
          </label>
          <input
            id="fd-sup-handle"
            className="fd-sup-input"
            value={draft}
            maxLength={24}
            autoComplete="off"
            autoFocus
            placeholder="Letters, digits, underscore"
            aria-invalid={!valid}
            onChange={(e) => setDraft(e.target.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 24))}
          />
          <button type="submit" className="fd-sup-icon-btn fd-btn" aria-label="Save handle" onPointerDown={press}>
            <Check aria-hidden="true" />
          </button>
          <button
            type="button"
            className="fd-sup-icon-btn fd-btn"
            aria-label="Cancel"
            onPointerDown={press}
            onClick={() => setEditing(false)}
          >
            <X aria-hidden="true" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="fd-sup-action fd-btn"
          onPointerDown={press}
          onClick={() => {
            setDraft(handle ?? '');
            setEditing(true);
          }}
        >
          <Pencil aria-hidden="true" />
          {handle ? 'Change handle' : 'Choose a handle'}
        </button>
      )}
    </div>
  );
}

/* ---------- one sport ---------- */
function SportRow({
  sport,
  team,
  rating,
  streak,
  season,
  onTeam,
  press,
}: {
  sport: string;
  team: string;
  rating: Rating | null;
  streak: Streak | null;
  season: Season | null;
  onTeam: (team: string) => void;
  press: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const rated = !!rating && rating.ratedGames > 0;
  const tier = rated ? tierFor(rating.rating) : null;
  const next = rated ? (nextTier(rating.rating) as Tier | null) : null;
  const tierIndex = tier ? Math.max(0, tiers.findIndex((t) => t.id === tier.id)) : -1;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onTeam(draft);
    setEditing(false);
  };
  const sportId = sport.toLowerCase().replace(/\s+/g, '-');
  return (
    <li className="fd-sup-row" data-rated={rated}>
      <div className="fd-sup-row-top">
        <span className="fd-sup-sport">{sport}</span>
        {editing ? (
          <form className="fd-sup-edit" onSubmit={submit}>
            <label className="fd-sr" htmlFor={`fd-sup-side-${sportId}`}>
              Who you support in {sport}
            </label>
            <input
              id={`fd-sup-side-${sportId}`}
              className="fd-sup-input"
              value={draft}
              maxLength={ALLEGIANCE_MAX}
              autoComplete="off"
              autoFocus
              placeholder={sport === 'Formula 1' ? 'Driver or team' : 'Club, side or team'}
              onChange={(e) => setDraft(e.target.value.slice(0, ALLEGIANCE_MAX))}
            />
            <button type="submit" className="fd-sup-icon-btn fd-btn" aria-label="Save" onPointerDown={press}>
              <Check aria-hidden="true" />
            </button>
            <button
              type="button"
              className="fd-sup-icon-btn fd-btn"
              aria-label="Cancel"
              onPointerDown={press}
              onClick={() => setEditing(false)}
            >
              <X aria-hidden="true" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="fd-sup-side fd-btn"
            data-set={!!team}
            onPointerDown={press}
            onClick={() => {
              setDraft(team);
              setEditing(true);
            }}
            aria-label={team ? `${sport}: you support ${team}. Change` : `Pick a side in ${sport}`}
          >
            {team || 'Pick a side'}
            <Pencil aria-hidden="true" />
          </button>
        )}
      </div>
      <dl className="fd-sup-stats">
        <div className="fd-sup-stat">
          <dt>Rating</dt>
          <dd>
            {rated && tier ? (
              <>
                <b>{rating.rating}</b>
                <span className="fd-sup-tier" data-tier={tier.id}>
                  <TierPips n={tierIndex + 1} />
                  {tier.label}
                </span>
                {rating.provisional && (
                  <span className="fd-pill" title={`Settles after ${PROVISIONAL_DUELS} rated duels`}>
                    provisional · {rating.ratedGames}/{PROVISIONAL_DUELS}
                  </span>
                )}
              </>
            ) : (
              <span className="fd-sup-muted">
                Not yet rated
                {rating && rating.duels > 0
                  ? ` · ${rating.duels} practice ${rating.duels === 1 ? 'duel' : 'duels'}`
                  : ''}
              </span>
            )}
          </dd>
          {rated && next && (
            <dd className="fd-sup-next">
              {next.min - rating.rating} to {next.label}
            </dd>
          )}
        </div>
        <div className="fd-sup-stat">
          <dt>
            <CalendarDays aria-hidden="true" /> Season
          </dt>
          <dd>{season ? <SeasonLine season={season} /> : <span className="fd-sup-muted">…</span>}</dd>
        </div>
        <div className="fd-sup-stat">
          <dt>
            <Flame aria-hidden="true" /> Matchweeks
          </dt>
          <dd>
            <b>{streak?.current ?? 0}</b>
            <span className="fd-sup-muted">{streak?.current === 1 ? ' week' : ' weeks'}</span>
            {!!streak?.best && streak.best > (streak.current ?? 0) && (
              <span className="fd-sup-muted"> · best {streak.best}</span>
            )}
            <span className={streak?.shields ? 'fd-pill fd-pill--shield' : 'fd-pill'}>
              <ShieldCheck aria-hidden="true" />
              {streak?.shields ?? 0} {streak?.shields === 1 ? 'shield' : 'shields'}
            </span>
          </dd>
        </div>
      </dl>
    </li>
  );
}

function SeasonLine({ season }: { season: Season }) {
  if (!season.offSeason)
    return (
      <>
        <b>{season.label}</b>
        <span className="fd-sup-muted">
          {' '}
          · {season.daysLeft} {season.daysLeft === 1 ? 'day' : 'days'} left
        </span>
      </>
    );
  return (
    <>
      <b>{season.label}</b>
      <span className="fd-sup-muted">
        {season.next ? ` · ${season.next.label} from ${shortDate(season.next.start)}` : ' · no season in the calendar yet'}
      </span>
    </>
  );
}

/** Tier glyph: one to five pips, the same shape for every tier so the label carries the meaning. */
function TierPips({ n }: { n: number }) {
  const count = Math.max(1, Math.min(5, n));
  return (
    <svg viewBox="0 0 40 10" aria-hidden="true" focusable="false">
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={5 + i * 7.5} cy={5} r={3} fill="currentColor" />
      ))}
    </svg>
  );
}
