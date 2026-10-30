/** Public result-only copy: deliberately excludes private invites, IDs and member names. */
export function clubScorecardText(fixture) {
  if (fixture?.status !== 'finished' || fixture.settlementReason === 'no-contest') return null;
  const identity = team => `${team.name} #${team.tag}`;
  const home = fixture.homeTeam, away = fixture.awayTeam;
  const result = !fixture.winnerTeamId ? 'Honours shared.' : `${fixture.winnerTeamId === home.id ? home.name : away.name} wins${fixture.tieBreak === 'lower-seed' ? ' on the declared cup seed rule' : ''}.`;
  return `${identity(home)} ${fixture.homeScore.correct}–${fixture.awayScore.correct} ${identity(away)}\n${result} ${fixture.format === 'full' ? 'Full over · 6 rounds' : 'Mini over · 3 rounds'} · ${fixture.capacity} v ${fixture.capacity}.\nJaanta Hai Kya — your people, your innings.`;
}
