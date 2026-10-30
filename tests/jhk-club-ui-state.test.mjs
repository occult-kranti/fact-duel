import test from 'node:test';
import assert from 'node:assert/strict';
import { selectedClubIds, clubPermissions, ownFixtureLineup, isFixturePlayer, selectedSummaryCount } from '../app/screens/teams/club-state.mjs';

const member = id => ({ id, nickname: id, isCaptain: id === 'a' });
const team = { id: 'home', capacity: 5, role: 'captain', members: ['a','b','c','d','e','reserve'].map(member), selectedMemberIds: ['a','b','c','d','e'] };
const fixture = { homeTeam: { id: 'home' }, awayTeam: { id: 'away' }, status: 'active', lineups: { home: ['a','b','c','d','reserve'].map(member), away: [member('opponent')] } };

test('a club can have reserves while its five-player sheet is complete', () => {
  assert.equal(team.members.length, 6);
  assert.deepEqual(selectedClubIds(team), ['a','b','c','d','e']);
  assert.equal(selectedSummaryCount({ capacity: 5, memberCount: 22, selectedCount: 4 }), 4);
});
test('an empty authoritative sheet never falls back to putting every member in play', () => {
  assert.deepEqual(selectedClubIds({ ...team, selectedMemberIds: [] }), []);
  assert.deepEqual(selectedClubIds({ ...team, selectedMemberIds: ['a','a','removed'] }), ['a']);
});
test('legacy teams use the playing format while new boolean selection remains authoritative', () => {
  assert.deepEqual(selectedClubIds({ ...team, selectedMemberIds: undefined }), ['a','b','c','d','e']);
  assert.deepEqual(selectedClubIds({ ...team, selectedMemberIds: undefined, members: team.members.map(member => ({ ...member, isSelected: member.id === 'reserve' })) }), ['reserve']);
});
test('fixture eligibility follows the locked team sheet, not today’s default selection', () => {
  assert.equal(isFixturePlayer(fixture, team, 'reserve'), true);
  assert.equal(isFixturePlayer(fixture, team, 'e'), false);
  assert.equal(isFixturePlayer(fixture, team, undefined), false);
  assert.equal(isFixturePlayer(fixture, { ...team, id: 'spectator' }, 'reserve'), false);
  assert.deepEqual(ownFixtureLineup(fixture, 'away'), [member('opponent')]);
});
test('legacy active fixtures retain server-checked play access without a published sheet', () => {
  assert.equal(isFixturePlayer({ ...fixture, lineups: undefined }, team, 'a'), true);
  assert.equal(isFixturePlayer({ ...fixture, lineups: { home: [], away: [] } }, team, 'a'), false);
});
test('club roles separate identity administration, fixtures and team sheets', () => {
  assert.deepEqual(clubPermissions({ ...team, role: 'coach' }), { manageClub: false, manageLineup: true, arrangeMatches: false });
  assert.deepEqual(clubPermissions({ ...team, role: 'vice-captain' }), { manageClub: false, manageLineup: true, arrangeMatches: true });
  assert.deepEqual(clubPermissions({ ...team, role: 'member', permissions: { manageClub: false, manageLineup: false, arrangeMatches: false } }), { manageClub: false, manageLineup: false, arrangeMatches: false });
});
