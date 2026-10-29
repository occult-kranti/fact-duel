/** Only a final, settled local result may count toward a natural between-match ad break.
 * Bot practice shares the same quiet two-win/three-loss cadence as human duels. It remains
 * optional and cannot alter scores, balances or human rankings.
 */
/** @returns {{ completionId: string, outcome: 'win'|'loss'|'draw' } | null} */
export function roomAdCompletion(room) {
  if (!room || room.phase !== 'complete' || room.settled !== true || typeof room.id !== 'string' || !room.id
    || ![0, 1].includes(room.seat) || ![null, 0, 1].includes(room.winner)) return null;
  return {
    completionId: `${room.config?.opponent === 'bot' ? 'bot' : 'friend'}:${room.id}:${room.seat}`,
    outcome: room.winner === null ? 'draw' : room.winner === room.seat ? 'win' : 'loss',
  };
}
