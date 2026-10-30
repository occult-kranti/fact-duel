'use client';
import { useState } from 'react';
import { CalendarDays, Check, Clock3, Flag, ShieldCheck, Swords, Trophy } from 'lucide-react';
import type { Team, TeamFixture } from './types';
import { clubPermissions, ownFixtureLineup, selectedClubIds } from './club-state.mjs';
import { LineupEditor, playingLabel, roleLabel } from './club-roster';

const dateTime = (value?: number | null) => value ? new Date(value).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'Waiting for acceptance';
const until = (value: number | null | undefined, now: number) => { if (!value) return ''; const minutes = Math.max(0, Math.ceil((value - now) / 60_000)); return minutes > 59 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`; };

export function WarPhaseStrip({ fixture }: { fixture: TeamFixture }) {
  const phase = fixture.status === 'finished' ? 2 : fixture.status === 'active' ? 1 : 0;
  return <ol className="jhk-club-war-strip" aria-label="Fixture phases">{[{ label: 'Preparation', detail: 'Select · substitute', icon: ShieldCheck }, { label: 'Battle', detail: 'One over each', icon: Swords }, { label: 'Result', detail: 'Final scorecard', icon: Trophy }].map((item, index) => <li key={item.label} data-state={index < phase ? 'done' : index === phase ? 'current' : 'pending'} aria-current={index === phase ? 'step' : undefined}><item.icon size={19}/><strong>{item.label}</strong><small>{item.detail}</small></li>)}</ol>;
}

export function FixturePreparation({ fixture, team, selfId, now, busy, onAction }: { fixture: TeamFixture; team: Team; selfId?: string; now: number; busy: boolean; onAction: (op: string, values?: Record<string, unknown>) => void }) {
  const ownSide = fixture.homeTeam.id === team.id ? 'home' : 'away';
  const otherSide = ownSide === 'home' ? 'away' : 'home';
  const permissions = clubPermissions(team);
  const lineup = ownFixtureLineup(fixture, team.id) || team.members.filter(member => selectedClubIds(team).includes(member.id));
  const ownReady = !!fixture.ready?.[ownSide];
  const locked = !!fixture.prepEndsAt && fixture.prepEndsAt <= now;
  const [subOut, setSubOut] = useState('');
  const [subIn, setSubIn] = useState('');
  const reserveMembers = team.members.filter(member => !lineup.some(player => player.id === member.id));
  return <section className="jhk-team-card jhk-club-preparation">
    <p className="jhk-team-eyebrow">PREPARATION · {until(fixture.prepEndsAt, now)} LEFT</p><h2>Set your side. Back your people.</h2>
    <p>Choose your {playingLabel(fixture.capacity).toLowerCase()} before the sheet locks. Reserves can step in during preparation; everyone in the club keeps their place.</p>
    <div className="jhk-club-match-clock"><Clock3 size={20}/><div><strong>Team sheet locks & battle opens</strong><time dateTime={fixture.prepEndsAt ? new Date(fixture.prepEndsAt).toISOString() : undefined}>{dateTime(fixture.prepEndsAt)}</time><small>Your local time · then 24 hours to play</small></div></div>
    <div className="jhk-club-ready-state"><span><Check size={17}/>{team.name}: {ownReady ? 'ready for an early start' : 'preparing'}</span><span><Flag size={17}/>{fixture[otherSide === 'home' ? 'homeTeam' : 'awayTeam'].name}: {fixture.ready?.[otherSide] ? 'ready for an early start' : 'preparing'}</span></div>
    {permissions.manageLineup && <details className="jhk-team-disclosure"><summary>Edit this fixture’s team sheet · {lineup.length}/{fixture.capacity}</summary><LineupEditor key={`${fixture.id}:${lineup.map(member => member.id).join(',')}:${team.members.map(member => member.id).join(',')}`} team={team} initialIds={lineup.map(member => member.id)} busy={busy || locked} label="Save fixture team sheet" onSave={memberIds => onAction('fixtureLineup', { fixtureId: fixture.id, memberIds })}/></details>}
    {permissions.manageLineup && reserveMembers.length > 0 && <details className="jhk-team-disclosure"><summary>Make a substitute before lock</summary><form className="jhk-team-form" onSubmit={event => { event.preventDefault(); onAction('substitute', { fixtureId: fixture.id, outMemberId: subOut, inMemberId: subIn }); setSubOut(''); setSubIn(''); }}><label htmlFor="jhk-club-sub-out">Player coming off the sheet</label><select id="jhk-club-sub-out" value={subOut} disabled={busy || locked} onChange={event => setSubOut(event.target.value)}><option value="">Choose a selected player</option>{lineup.map(member => <option key={member.id} value={member.id}>{member.nickname}</option>)}</select><label htmlFor="jhk-club-sub-in">Reserve coming onto the sheet</label><select id="jhk-club-sub-in" value={subIn} disabled={busy || locked} onChange={event => setSubIn(event.target.value)}><option value="">Choose a reserve</option>{reserveMembers.map(member => <option key={member.id} value={member.id}>{member.nickname}</option>)}</select><button className="jhk-team-secondary" disabled={busy || locked || !subOut || !subIn}>Confirm substitute<UsersSubIcon/></button></form></details>}
    <details className="jhk-team-disclosure"><summary>View selected {playingLabel(fixture.capacity).toLowerCase()}</summary><ol className="jhk-club-frozen-sheet">{lineup.map(member => <li key={member.id}><span>{member.nickname}{member.id === selfId ? ' · You' : ''}</span><small>{roleLabel(member.role)}</small></li>)}</ol></details>
    {permissions.arrangeMatches ? <><button className="jhk-team-primary" disabled={busy || locked || lineup.length !== fixture.capacity} onClick={() => onAction('readyLineup', { fixtureId: fixture.id, ready: !ownReady })}>{ownReady ? 'Withdraw early-start readiness' : 'Ready to start early'}<Check size={18}/></button><p className="jhk-team-field-hint">Both teams choosing ready opens battle immediately and locks both sheets. Editing a team sheet clears both teams’ early-start readiness. Otherwise battle opens at the time above.</p></> : <p className="jhk-team-help">Your captain or vice captain can confirm an early start. Your {lineup.some(member => member.id === selfId) ? 'over will open with battle.' : 'reserve place stays in the club.'}</p>}
    <p className="jhk-club-reserve-note">No substitutions after battle opens. Joining during battle gives a reserve place for a later fixture.</p>
  </section>;
}
function UsersSubIcon() { return <Swords size={18}/>; }

export function WeeklyChoice({ checked, onChange, disabled = false, accepting = false }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; accepting?: boolean }) {
  return <div className="jhk-club-weekly-choice"><label className="jhk-team-check-row"><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)}/><span><CalendarDays size={19}/><strong>{accepting ? 'Agree to weekly rematch drafts' : 'Invite a weekly rematch'}</strong></span></label><p className="jhk-team-field-hint">Optional. After this fixture settles, one draft appears for the next weekly slot. Each rematch needs a fresh acceptance and team sheet. Either captain or vice captain can stop the series.</p></div>;
}

export function FixtureCalendar({ fixture, team, busy, onAction, onOpenNext }: { fixture: TeamFixture; team: Team; busy: boolean; onAction: (op: string, values?: Record<string, unknown>) => void; onOpenNext?: (id: string) => void }) {
  const [confirmStop, setConfirmStop] = useState(false);
  if (fixture.recurrence?.cadence !== 'weekly') return null;
  return <section className="jhk-team-card jhk-club-calendar"><p className="jhk-team-eyebrow">YOUR CLUB CALENDAR</p><h2><CalendarDays size={22}/>{fixture.recurrence.stopped ? 'Weekly series stopped' : fixture.recurrence.confirmed === false ? 'Weekly rivalry requested' : 'Weekly rivalry'}</h2><p>{fixture.recurrence.stopped ? 'No future drafts will be created for this series. Any already accepted fixture keeps its own window.' : fixture.recurrence.confirmed === false ? 'Future weekly drafts need both clubs to agree. Accepting only this fixture is always an option.' : fixture.recurrence.nextDraftAt ? `Next draft slot: ${dateTime(fixture.recurrence.nextDraftAt)}.` : 'One upcoming rematch draft is scheduled when this result settles.'} A draft never starts or signs your team up by itself.</p>{fixture.recurrence.nextFixtureId && onOpenNext && <button className="jhk-team-secondary" onClick={() => onOpenNext(fixture.recurrence!.nextFixtureId!)}>View upcoming draft</button>}{!fixture.recurrence.stopped && clubPermissions(team).arrangeMatches && <>{confirmStop ? <div className="jhk-team-inline-confirm"><p>Stop future weekly drafts for both teams? An accepted fixture keeps its own preparation and battle window.</p><button className="jhk-team-secondary" disabled={busy} onClick={() => { onAction('stopRecurrence', { fixtureId: fixture.id }); setConfirmStop(false); }}>Stop weekly series</button><button className="jhk-team-text-button" onClick={() => setConfirmStop(false)}>Keep weekly drafts</button></div> : <button className="jhk-team-text-button" disabled={busy} onClick={() => setConfirmStop(true)}>Stop weekly series</button>}</>}</section>;
}
