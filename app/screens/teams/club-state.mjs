/** Club membership and a match team sheet deliberately have different limits. */
/** @param {import('./types').Team} team */
export function selectedClubIds(team) {
  const ids = team.selectedMemberIds ?? (team.members.some(member => typeof member.isSelected === 'boolean')
    ? team.members.filter(member => member.isSelected).map(member => member.id)
    : team.members.slice(0, team.capacity).map(member => member.id));
  const members = new Set(team.members.map(member => member.id));
  return [...new Set(ids)].filter(id => members.has(id));
}
/** @param {import('./types').Team} team */
export function clubPermissions(team) {
  return team.permissions ?? { manageClub: team.role === 'captain', manageLineup: ['captain', 'vice-captain', 'coach'].includes(team.role), arrangeMatches: ['captain', 'vice-captain'].includes(team.role) };
}
/** @param {import('./types').TeamFixture} fixture @param {string} teamId */
export function ownFixtureLineup(fixture, teamId) {
  if (fixture.homeTeam.id === teamId) return fixture.lineups?.home;
  if (fixture.awayTeam.id === teamId) return fixture.lineups?.away;
  return [];
}
/** Frozen fixture membership takes precedence over the club's current selection. */
/** @param {import('./types').TeamFixture} fixture @param {import('./types').Team} team @param {string|undefined} playerId */
export function isFixturePlayer(fixture, team, playerId) {
  if (!playerId || ![fixture.homeTeam.id, fixture.awayTeam.id].includes(team.id)) return false;
  const lineup = ownFixtureLineup(fixture, team.id);
  // Legacy active fixtures did not publish their frozen sheet. The server checks access.
  return lineup ? lineup.some(member => member.id === playerId) : true;
}
/** @param {import('./types').TeamSummary} team */
export function selectedSummaryCount(team) { return team.selectedCount ?? Math.min(team.memberCount ?? 0, team.capacity); }
