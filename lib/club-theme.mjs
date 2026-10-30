/** Display state only. Membership and permission checks remain on the server. */
export const CLUB_PALETTES = Object.freeze(['teal','saffron','berry','blue']);
export const CLUB_COLOUR_MODES = Object.freeze(['club','default']);
export const validClubTag = value => typeof value === 'string' && /^[A-Z0-9]{1,4}-[A-F0-9]{4}$/.test(value) ? value : null;
export const clubColourMode = value => value === 'default' ? 'default' : 'club';
export function emptyClubIdentity(identityId = null) {
  return { identityId, serverNow:-1, teamId:null, teamTag:null, teamName:null, teamSize:null, teamPalette:null, verified:false, source:'none' };
}
/** Reject older responses and a previous profile's membership, including delayed recover races. */
export function reconcileClubIdentity(previous, data, { identityId, action = 'profile' } = {}) {
  const current = previous?.identityId === identityId ? previous : emptyClubIdentity(identityId);
  if (!identityId || (data?.session && data.session.id !== identityId)) return current;
  const stamp = Number.isFinite(data?.serverNow) ? data.serverNow : 0;
  if (stamp < current.serverNow || (stamp === current.serverNow && current.source === 'team' && action !== 'team')) return current;
  const hasTeam = action === 'team' && Object.hasOwn(data || {},'team');
  const profile = data?.session;
  if (!hasTeam && !Object.hasOwn(profile || {},'teamTag')) return current;
  const team = hasTeam ? data.team : null;
  // A team projection must actually contain the authenticated member. Public opponent teams never qualify.
  if (team && (!Array.isArray(team.members) || !team.members.some(member => member.id === identityId))) return current;
  const tag = validClubTag(hasTeam ? team?.tag : profile.teamTag);
  const palette = hasTeam ? team?.palette : profile.teamPalette;
  return { identityId, serverNow:stamp, teamId:tag && hasTeam ? team.id : tag === current.teamTag ? current.teamId : null,
    teamTag:tag, teamName:tag ? String((hasTeam ? team?.name : profile.teamName) || '').slice(0,32) || null : null,
    teamSize:tag && [5,11].includes(hasTeam ? team?.capacity : profile.teamSize) ? (hasTeam ? team.capacity : profile.teamSize) : null,
    teamPalette:tag && CLUB_PALETTES.includes(palette) ? palette : tag === current.teamTag && !hasTeam && !Object.hasOwn(profile || {},'teamPalette') ? current.teamPalette : null,
    verified:true, source:hasTeam ? 'team' : 'profile' };
}
export function activeClubPalette(club, mode = 'club') {
  return clubColourMode(mode) === 'club' && club?.verified && validClubTag(club.teamTag) && CLUB_PALETTES.includes(club.teamPalette) ? club.teamPalette : null;
}
export function clubSessionFields(club) {
  return {teamTag:club.teamTag,teamName:club.teamName,teamSize:club.teamSize,teamPalette:club.teamPalette};
}
/** Changes only the accent attribute; day/night, motion and art preferences remain independent. */
export function applyClubPalette(root, palette) {
  if (CLUB_PALETTES.includes(palette)) root.dataset.clubPalette = palette;
  else delete root.dataset.clubPalette;
}
