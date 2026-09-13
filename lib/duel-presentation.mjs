/** Pure presentation rules. Never chooses a winner or changes a room. */
export const FORMAT_COPY = {
  quick: {
    label: 'QUICK DRAW',
    tag: 'ONE SHOT',
    rule: 'One question. Fastest correct answer wins.',
    short: 'One question',
    duration: 'A single decisive round',
    number: '01',
  },
  trilogy: {
    label: 'TRIPLE THREAT',
    tag: 'FIRST TO TWO',
    rule: 'First to two wins, otherwise the higher score after three rounds.',
    short: 'Up to 3 rounds',
    duration: 'A comeback has room to happen',
    number: '03',
  },
  gauntlet: {
    label: 'THE GAUNTLET',
    tag: 'GO THE DISTANCE',
    rule: 'Play all five questions. Highest final score wins.',
    short: 'All 5 rounds',
    duration: 'Consistency takes the match',
    number: '05',
  },
};
export function completedRounds(room) {
  if (Array.isArray(room?.completedRounds) && room.completedRounds.length) return room.completedRounds;
  if (!room?.round?.result) return [];
  return [
    {
      index: room.roundIndex,
      id: room.round.id,
      question: room.round.question,
      result: room.round.result,
      receipts: room.round.receipts,
    },
  ];
}
export function matchVerdict(room) {
  if (room?.phase === 'cancelled')
    return {
      key: 'cancelled',
      title: 'MATCH REFUNDED',
      subtitle:
        {
          'timing-inconsistent': 'A response fell outside the timing bounds.',
          'player-left': 'A player left, reloaded or switched away.',
          'player-not-connected': 'A player could not open the question.',
          'room-expired': 'This room expired.',
        }[room.reason] || 'This match ended before a valid result.',
      detail: 'Both simulated entries are returned.',
    };
  const mine = room.scores[room.seat],
    rival = room.scores[1 - room.seat];
  if (room.winner === null)
    return {
      key: 'draw',
      title: 'IT’S A DRAW',
      subtitle: `${mine}–${rival}. Nothing between you this time.`,
      detail: 'Both simulated entries are returned.',
    };
  const won = room.winner === room.seat;
  return {
    key: won ? 'win' : 'loss',
    title: won ? 'YOU WIN' : 'RIVAL WINS',
    subtitle: `${won ? 'You take' : 'Your rival takes'} the match ${Math.max(mine, rival)}–${Math.min(mine, rival)}.`,
    detail: room.config.stake
      ? `${won ? '+' : '−'}${room.config.stake} simulated coins for you.`
      : 'Free match. No coins spent.',
  };
}
export function roundReason(round, seat) {
  const result = round?.result;
  if (!result) return '';
  if (result.reason === 'timing-inconsistent') return 'Timing checks did not pass. The match was refunded.';
  const a = round.receipts?.[seat],
    b = round.receipts?.[1 - seat];
  if (result.reason === 'no-correct-answer') return 'Neither player answered correctly. No point awarded.';
  if (result.reason === 'close-result')
    return `Both correct. Compared times are within the ${result.tieMs} ms draw band.`;
  if (result.reason === 'screen-time') {
    const simulated = a?.simulated || b?.simulated;
    return `Both correct. ${result.winner === seat ? 'Your' : 'Your rival’s'} ${result.winner === seat ? (a.simulated ? 'scheduled' : 'reported') : b.simulated ? 'scheduled' : 'reported'} time was ${(Math.abs(a.elapsedMs - b.elapsedMs) / 1000).toFixed(3)} s faster.${simulated ? ' The bot time is a simulation.' : ''}`;
  }
  return result.winner === seat
    ? 'You had the only correct answer.'
    : 'Your rival had the only correct answer.';
}
