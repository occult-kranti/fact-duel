import { normalizeTeamTag } from '@/lib/team-identity.mjs';
import './team-identity.css';

/** A public prefix, never a join code or an extra badge. */
export function TeamTag({ tag, teamName, className = '' }: { tag?: string | null; teamName?: string | null; className?: string }) {
  const normalized = normalizeTeamTag(tag);
  if (!normalized) return null;
  return <span className={`jhk-team-prefix ${className}`.trim()} title={teamName ? `${teamName} · #${normalized}` : `Public club tag #${normalized}`}><span className="jhk-identity-sr">Club </span>#{normalized}<span className="jhk-identity-sr">, </span></span>;
}

/** CSS may shorten a long visual label; the full human name remains in the DOM. */
export function TeamIdentity({ name, teamTag, teamName, wrap = false, className = '' }: { name: string; teamTag?: string | null; teamName?: string | null; wrap?: boolean; className?: string }) {
  return <span className={`jhk-tagged-name${wrap ? ' jhk-tagged-name--wrap' : ''} ${className}`.trim()}><TeamTag tag={teamTag} teamName={teamName}/><span className="jhk-tagged-name-text" title={name}>{name}</span></span>;
}
