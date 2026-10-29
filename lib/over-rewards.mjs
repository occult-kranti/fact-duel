/** JHK practice-over receipts. Cosmetics only: no effect on coins, odds or server ranking. */
export const OVER_REWARD_RULES = Object.freeze({
  trilogy: Object.freeze({ label: 'Mini over', rounds: 3, completionXp: 60, precisionXp: 30, clubPoints: 15 }),
  gauntlet: Object.freeze({ label: 'Full over', rounds: 6, completionXp: 150, precisionXp: 60, clubPoints: 45 }),
});
// Permanent receipt ids are separate from the rolling journal. At the cap, new bonuses stop;
// ids are never evicted and an old result can never become eligible again through journal trimming.
export const OVER_RECEIPT_LIMIT = 20_000;
export const LOCAL_TITLES = Object.freeze([
  { id: 'gully-starter', name: 'Gully Starter', overs: 0 },
  { id: 'mohalla-captain', name: 'Mohalla Captain', overs: 3 },
  { id: 'maidan-star', name: 'Maidan Star', overs: 10 },
  { id: 'maidan-veteran', name: 'Maidan Veteran', overs: 25 },
  { id: 'cricket-ustaad', name: 'Cricket Ustaad', overs: 60 },
].map((title) => Object.freeze(title)));
const validId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 100;
const nat = (n, cap = OVER_RECEIPT_LIMIT) => Number.isSafeInteger(n) && n > 0 ? Math.min(n, cap) : 0;
export function emptyOverRewards() { return { version: 1, ids: [], completed: 0, mini: 0, full: 0, clubPoints: 0 }; }
export function readOverRewards(value) {
  const next = emptyOverRewards();
  if (value?.version !== 1) return next;
  next.ids = [...new Set((Array.isArray(value.ids) ? value.ids : []).slice(0, OVER_RECEIPT_LIMIT).filter(validId))];
  next.completed = next.ids.length;
  next.full = Math.min(next.completed, nat(value.full));
  next.mini = next.completed - next.full;
  next.clubPoints = next.mini * OVER_REWARD_RULES.trilogy.clubPoints + next.full * OVER_REWARD_RULES.gauntlet.clubPoints;
  return next;
}
const recordFrom = (profile) => readOverRewards((profile?.progression ?? profile)?.overRewards);

/** Reads settled answer receipts, not score: a slower correct answer still counts as correct. */
export function getOverRewardSummary(room, profile = null) {
  const mode = room?.config?.mode;
  const rules = OVER_REWARD_RULES[mode];
  const record = recordFrom(profile);
  const seat = room?.seat === 1 ? 1 : 0;
  const rounds = new Map();
  for (const round of [...(Array.isArray(room?.completedRounds) ? room.completedRounds : []), room?.round]) {
    if (!round?.result || round.result.reason === 'timing-inconsistent') continue;
    const index = Number.isInteger(round.index) ? round.index : round === room?.round ? room.roundIndex : -1;
    if (!Number.isInteger(index) || index < 0 || index >= (rules?.rounds ?? 0)) continue;
    rounds.set(index, round);
  }
  let attempted = 0, correct = 0;
  for (const round of rounds.values()) {
    const receipt = round.receipts?.[seat];
    if (Number.isInteger(receipt?.choice) && receipt.choice >= 0 && receipt.choice < 4) {
      attempted += 1;
      if (receipt.correct === true) correct += 1;
    }
  }
  const eligible = !!rules && validId(room?.id) && room.phase === 'complete' && room.config.overRewardsVersion === 1 && rounds.size === rules.rounds && attempted === rules.rounds;
  const completionXp = eligible ? rules.completionXp : 0;
  const precisionXp = eligible && correct === rules.rounds ? rules.precisionXp : 0;
  return {
    matchId: validId(room?.id) ? room.id : null, mode, label: rules?.label ?? 'Over',
    rounds: rules?.rounds ?? 0, attempted, correct, eligible, modern: room?.config?.overRewardsVersion === 1,
    completionXp, precisionXp, totalBonusXp: completionXp + precisionXp,
    clubPoints: eligible ? rules.clubPoints : 0,
    credited: validId(room?.id) && record.ids.includes(room.id),
    recordFull: record.ids.length >= OVER_RECEIPT_LIMIT,
  };
}

/** Called inside the same profile transaction as XP. Repeat results retain exactly the same state. */
export function creditOverReward(value, summary) {
  const record = readOverRewards(value);
  if (!summary?.eligible || !validId(summary.matchId) || !Object.hasOwn(OVER_REWARD_RULES, summary.mode) || record.ids.includes(summary.matchId) || record.ids.length >= OVER_RECEIPT_LIMIT) return { record, credited: false };
  const full = record.full + (summary.mode === 'gauntlet' ? 1 : 0);
  return { record: readOverRewards({ ...record, ids: [...record.ids, summary.matchId], full }), credited: true };
}

/** Permanent earned identity; threshold proves completed overs with an answer on every round. */
export function localTitleProgress(profile) {
  const record = recordFrom(profile);
  const current = record.completed;
  let index = 0;
  for (let i = 1; i < LOCAL_TITLES.length; i++) if (current >= LOCAL_TITLES[i].overs) index = i;
  const title = LOCAL_TITLES[index], next = LOCAL_TITLES[index + 1] ?? null;
  return { title: title.name, titleId: title.id, nextTitle: next?.name ?? null, nextTitleId: next?.id ?? null, current, target: next?.overs ?? title.overs, remaining: next ? next.overs - current : 0, progress: next ? (current - title.overs) / (next.overs - title.overs) : 1 };
}

/** The current result's receipt includes only that room's answer/match/over XP, not other tabs. */
export function matchRewardXp(profile, matchId) {
  if (!validId(matchId)) return 0;
  const log = (profile?.progression ?? profile)?.log;
  return (Array.isArray(log) ? log : []).filter((entry) => entry?.meta?.matchId === matchId && Number.isSafeInteger(entry.xp) && entry.xp >= 0).reduce((sum, entry) => sum + entry.xp, 0);
}
