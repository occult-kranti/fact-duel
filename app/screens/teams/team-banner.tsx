'use client';
import { Crown, Zap, Star } from 'lucide-react';
import type { Emblem, TeamPalette, TeamSummary } from './types';

export const EMBLEMS: { id: Emblem; label: string }[] = [{ id: 'bat', label: 'Crossed bats' }, { id: 'bolt', label: 'Lightning' }, { id: 'crown', label: 'Crown' }, { id: 'star', label: 'Star' }];
export const PALETTES: { id: TeamPalette; label: string }[] = [{ id: 'teal', label: 'Pavilion teal' }, { id: 'saffron', label: 'Marigold' }, { id: 'berry', label: 'Jamun' }, { id: 'blue', label: 'Evening blue' }];

/** Original cricket crest; a visual identity only. */
export function TeamCrest({ emblem = 'bat', palette = 'teal', small = false }: { emblem?: Emblem; palette?: TeamPalette; small?: boolean }) {
  return <span className={`jhk-team-crest${small ? ' is-small' : ''}`} data-palette={palette} aria-hidden="true">
    <svg viewBox="0 0 80 92" fill="none" className="jhk-team-shield"><path d="M5 8 40 2l35 6v42c0 18-19 32-35 40C24 82 5 68 5 50Z" fill="currentColor"/><path d="m11 14 29-5 29 5v35c0 14-15 27-29 34-14-7-29-20-29-34Z" stroke="var(--team-crest-foil)" strokeWidth="2"/></svg>
    <span className="jhk-team-symbol">{emblem === 'bat' ? <svg viewBox="0 0 40 40" fill="none"><path d="m12 6 5 3-3 5 15 19-5 4L9 17l-4 2-3-5Z" fill="currentColor"/><path d="m28 6-5 3 3 5-15 19 5 4 15-20 4 2 3-5Z" fill="currentColor"/></svg> : emblem === 'bolt' ? <Zap fill="currentColor"/> : emblem === 'crown' ? <Crown/> : <Star fill="currentColor"/>}</span>
  </span>;
}
export function TeamBanner({ team, subtitle, action, headingLevel = 1 }: { team: Pick<TeamSummary, 'name' | 'tag' | 'capacity' | 'emblem' | 'palette'> & { level?: number }; subtitle?: string; action?: React.ReactNode; headingLevel?: 1 | 2 }) {
  return <header className={`jhk-team-banner${(team.level || 0) >= 4 ? ' has-legacy-frame' : ''}`} data-palette={team.palette}>
    <span className="jhk-team-banner-rule" aria-hidden="true"/>
    <TeamCrest emblem={team.emblem} palette={team.palette}/>
    <div className="jhk-team-banner-copy"><p>{team.capacity === 11 ? 'PLAYING XI' : 'PLAYING 5'} · A CLUB OF UP TO 22</p>{headingLevel === 1 ? <h1>{team.name}</h1> : <h2>{team.name}</h2>}<span className="jhk-team-tag">#{team.tag.replace(/^#/, '')}</span>{subtitle && <small>{subtitle}</small>}</div>
    {action}
    {(team.level || 0) >= 4 && <span className="jhk-team-legacy-label">Legacy frame</span>}
  </header>;
}
