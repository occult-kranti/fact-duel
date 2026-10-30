'use client';
import { useState } from 'react';
import { Check, ChevronRight, Crown, ShieldCheck, Users } from 'lucide-react';
import type { Team, TeamBadge, TeamMember, TeamRole } from './types';
import { clubPermissions, selectedClubIds } from './club-state.mjs';

type Action = (op: string, values?: Record<string, unknown>) => void;
export const roleLabel = (role?: TeamRole) => role === 'captain' ? 'Captain' : role === 'vice-captain' ? 'Vice captain' : role === 'coach' ? 'Coach' : 'Club member';
const badgeLabel = (badge?: TeamBadge) => badge === 'bottle-boy' ? 'Bottle boy' : badge === 'cheer-captain' ? 'Cheer captain' : badge && badge !== 'none' ? badge[0].toUpperCase() + badge.slice(1) : '';
export const playingLabel = (capacity: number) => capacity === 11 ? 'Playing XI' : 'Playing 5';

export function MemberIdentity({ member, selfId }: { member: TeamMember; selfId?: string }) {
  const role = member.role || (member.isCaptain ? 'captain' : 'member');
  return <><span className="jhk-team-member-avatar" aria-hidden="true">{member.nickname.slice(0, 1).toUpperCase()}</span><span className="jhk-club-member-name"><strong>{member.nickname}{member.id === selfId ? <small> · You</small> : null}</strong><span className="jhk-club-member-tags"><span className="jhk-club-role-badge" data-role={role === 'vice-captain' ? 'vc' : role}>{roleLabel(role)}</span>{member.funBadgeConsent && badgeLabel(member.funBadge) && <span className="jhk-club-role-badge" data-role="fun">{badgeLabel(member.funBadge)}</span>}</span></span>{member.isCaptain && <Crown size={16} aria-label="Captain"/>}</>;
}

export function LineupEditor({ team, initialIds, busy, label, onSave }: { team: Team; initialIds: string[]; busy: boolean; label: string; onSave: (ids: string[]) => void }) {
  const [ids, setIds] = useState(initialIds);
  const initialKey = [...initialIds].sort().join(',');
  const changed = [...ids].sort().join(',') !== initialKey;
  return <form className="jhk-club-lineup-editor" onSubmit={event => { event.preventDefault(); if (ids.length === team.capacity && changed) onSave(ids); }}>
    <p className="jhk-team-help">Choose exactly {team.capacity}. Everyone else stays in your club as a reserve. Roles do not select a player.</p>
    <p className="jhk-club-selection-count" role="status"><ShieldCheck size={18}/>{ids.length} / {team.capacity} selected</p>
    <fieldset disabled={busy}><legend className="sr-only">{label}</legend>{team.members.map(member => <label className={`jhk-club-select-member${ids.includes(member.id) ? ' is-selected' : ''}`} key={member.id}><input type="checkbox" checked={ids.includes(member.id)} onChange={event => setIds(current => event.target.checked ? [...current, member.id] : current.filter(id => id !== member.id))}/><span><strong>{member.nickname}</strong><small>{roleLabel(member.role || (member.isCaptain ? 'captain' : 'member'))}</small></span>{ids.includes(member.id) && <Check size={18}/>}</label>)}</fieldset>
    <button className="jhk-team-secondary" disabled={busy || ids.length !== team.capacity || !changed}>{busy ? 'Saving team sheet…' : label}<Check size={18}/></button>
    {ids.length !== team.capacity && <p className="jhk-team-field-hint">{ids.length < team.capacity ? `Select ${team.capacity - ids.length} more.` : `Remove ${ids.length - team.capacity} from this sheet.`} No changes are saved yet.</p>}
  </form>;
}

export function ClubRoster({ team, selfId, busy, onAction, invite, lineupLocked = false, onOpenPreparation }: { team: Team; selfId?: string; busy: boolean; onAction: Action; invite: React.ReactNode; lineupLocked?: boolean; onOpenPreparation?: () => void }) {
  const [tab, setTab] = useState<'playing' | 'reserves'>('playing');
  const selectedIds = selectedClubIds(team);
  const selected = team.members.filter(member => selectedIds.includes(member.id));
  const reserves = team.members.filter(member => !selectedIds.includes(member.id));
  const members = tab === 'playing' ? selected : reserves;
  const permissions = clubPermissions(team);
  return <section className="jhk-team-card jhk-team-roster jhk-club-roster jhk-club-lineup-sheet">
    <div className="jhk-team-section-heading"><div><p className="jhk-team-eyebrow">YOUR CLUB. ROOM TO BELONG.</p><h2>{team.members.length} <span>/ {team.rosterLimit || 22}</span> club members</h2></div><Users size={24}/></div>
    <p className="jhk-team-field-hint">{playingLabel(team.capacity)}: {selected.length}/{team.capacity} · Reserves: {reserves.length} · {Math.max(0, (team.rosterLimit || 22) - team.members.length)} club places open</p>
    <div className="jhk-club-roster-tabs" role="group" aria-label="View team sheet"><button type="button" aria-pressed={tab === 'playing'} onClick={() => setTab('playing')}>{playingLabel(team.capacity)}<b>{selected.length}</b></button><button type="button" aria-pressed={tab === 'reserves'} onClick={() => setTab('reserves')}>Reserves<b>{reserves.length}</b></button></div>
    {members.length ? <ol className="jhk-club-member-list">{members.slice(0, 3).map(member => <li key={member.id}><MemberIdentity member={member} selfId={selfId}/></li>)}</ol> : <p className="jhk-club-reserve-note">{tab === 'reserves' ? 'Your next club members can join as reserves. They can be selected before a fixture locks.' : 'Your captain, vice captain or coach can select the match team.'}</p>}
    {members.length > 3 && <details className="jhk-team-disclosure"><summary>See all {members.length} {tab === 'reserves' ? 'reserves' : 'selected players'}</summary><ol className="jhk-club-member-list" start={4}>{members.slice(3).map(member => <li key={member.id}><MemberIdentity member={member} selfId={selfId}/></li>)}</ol></details>}
    <p className="jhk-club-reserve-note">This is the default sheet for new fixtures. A battle’s locked team sheet stays unchanged.</p>
    {permissions.manageLineup && (lineupLocked ? <div className="jhk-club-reserve-note"><p className="jhk-team-field-hint">The default sheet is paused during a match or active cup. Make fixture changes in preparation, before battle opens.</p>{onOpenPreparation && <button className="jhk-team-text-button" onClick={onOpenPreparation}>Open fixture preparation<ChevronRight size={17}/></button>}</div> : <details className="jhk-team-disclosure"><summary>Edit default {playingLabel(team.capacity).toLowerCase()}</summary><LineupEditor key={`${selectedIds.join(',')}:${team.members.map(member => member.id).join(',')}`} team={team} initialIds={selectedIds} busy={busy} label="Save default team sheet" onSave={memberIds => onAction('selectLineup', { memberIds })}/></details>)}
    <ClubRoles team={team} selfId={selfId} busy={busy} onAction={onAction}/>
    {invite}
  </section>;
}

function ClubRoles({ team, selfId, busy, onAction }: { team: Team; selfId?: string; busy: boolean; onAction: Action }) {
  const [memberId, setMemberId] = useState('');
  const member = team.members.find(item => item.id === memberId);
  const self = team.members.find(item => item.id === selfId);
  const captain = clubPermissions(team).manageClub;
  return <details className="jhk-team-disclosure jhk-club-roles"><summary>Roles & optional team tags</summary>
    <dl className="jhk-club-role-guide"><div><dt>Captain</dt><dd>Club settings, roles, team sheets and fixtures.</dd></div><div><dt>Vice captain</dt><dd>Team sheets and fixtures. One vice captain per club.</dd></div><div><dt>Coach</dt><dd>Team sheets only. One coach per club.</dd></div><div><dt>Fun tags</dt><dd>Optional identity only. They give no controls or score advantage.</dd></div></dl>
    {self && <div className="jhk-club-consent"><label className="jhk-team-check-row"><input type="checkbox" disabled={busy} checked={!!self.funBadgeConsent} onChange={event => onAction('roleConsent', { consent: event.target.checked })}/><span>Allow my captain to give me a fun tag</span></label><p className="jhk-team-field-hint">Includes Keeper, Finisher, Analyst, Cheer captain and Bottle boy. Switch off to remove your tag at any time.</p>{self.funBadge && self.funBadge !== 'none' && <button className="jhk-team-text-button" disabled={busy} onClick={() => onAction('assignBadge', { memberId: self.id, badge: 'none' })}>Remove my {badgeLabel(self.funBadge)} tag</button>}</div>}
    {captain && <div className="jhk-club-role-editor"><label htmlFor="jhk-club-role-member">Choose a club member</label><select id="jhk-club-role-member" value={memberId} disabled={busy} onChange={event => setMemberId(event.target.value)}><option value="">Choose a teammate</option>{team.members.map(item => <option key={item.id} value={item.id}>{item.nickname}{item.isCaptain ? ' · Captain' : ''}</option>)}</select>{member && <MemberRoleEditor key={`${member.id}:${member.role}:${member.funBadge}:${member.funBadgeConsent}`} member={member} members={team.members} busy={busy} onAction={onAction}/>}</div>}
  </details>;
}

function MemberRoleEditor({ member, members, busy, onAction }: { member: TeamMember; members: TeamMember[]; busy: boolean; onAction: Action }) {
  const memberId = member.id;
  const [role, setRole] = useState<'member' | 'vice-captain' | 'coach'>(member.role === 'vice-captain' || member.role === 'coach' ? member.role : 'member');
  const [badge, setBadge] = useState<TeamBadge>(member.funBadge || 'none');
  const previousHolder = role !== 'member' ? members.find(item => item.id !== member.id && item.role === role) : null;
  return <>
      {!member.isCaptain && <form className="jhk-team-form" onSubmit={event => { event.preventDefault(); onAction('assignRole', { memberId, role }); }}><label htmlFor="jhk-club-role">Club role</label><select id="jhk-club-role" value={role} disabled={busy} onChange={event => setRole(event.target.value as typeof role)}><option value="member">Club member</option><option value="vice-captain">Vice captain</option><option value="coach">Coach</option></select>{previousHolder && <p className="jhk-team-field-hint">{member.nickname} becomes the club’s only {roleLabel(role).toLowerCase()}. {previousHolder.nickname} returns to club member with no role controls.</p>}<button className="jhk-team-secondary" disabled={busy || role === (member.role || 'member')}>Save club role<ChevronRight size={18}/></button></form>}
      <form className="jhk-team-form" onSubmit={event => { event.preventDefault(); onAction('assignBadge', { memberId, badge }); }}><label htmlFor="jhk-club-badge">Optional fun tag</label><select id="jhk-club-badge" value={badge} disabled={busy || !member.funBadgeConsent} onChange={event => setBadge(event.target.value as TeamBadge)}><option value="none">No fun tag</option><option value="analyst">Analyst</option><option value="keeper">Keeper</option><option value="finisher">Finisher</option><option value="cheer-captain">Cheer captain</option><option value="bottle-boy">Bottle boy</option></select>{!member.funBadgeConsent && <p className="jhk-team-field-hint">{member.nickname} needs to allow fun tags on their own device first.</p>}<button className="jhk-team-secondary" disabled={busy || !member.funBadgeConsent || badge === (member.funBadge || 'none')}>Save optional tag<Check size={18}/></button></form>
    </>;
}
