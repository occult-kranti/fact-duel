/** Public club tags are generated separately from private invite and recovery codes. */
export function normalizeTeamTag(value) {
  if (typeof value !== 'string') return null;
  const tag = value.trim().replace(/^#/, '').toUpperCase();
  return /^[A-Z0-9]{1,4}-[A-F0-9]{4}$/.test(tag) ? tag : null;
}

/** A display label only: the player's stored nickname is never changed. */
export function teamIdentityText(name, teamTag) {
  const nickname = typeof name === 'string' ? name : '';
  const tag = normalizeTeamTag(teamTag);
  return tag ? `#${tag}${nickname ? ` ${nickname}` : ''}` : nickname;
}
