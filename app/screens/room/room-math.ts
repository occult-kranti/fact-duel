/**
 * Pure maths the Room screen quotes back to the player. Everything here re-uses the *same*
 * tunables the progression reducer uses (lib/progression.mjs XP / DIFFICULTY_MULTIPLIER /
 * comboMultiplier / wildRound), so a number shown on screen is the number that was awarded.
 * Nothing here mutates a room or a profile.
 */
import { DIFFICULTY_MULTIPLIER, XP, comboMultiplier, rankForPoints, wildRound } from '@/lib/progression.mjs';
import { completedRounds } from '@/lib/duel-presentation.mjs';

export type RoundXp = {
  /** XP the reducer awards for this round. */
  total: number;
  base: number;
  speed: number;
  difficulty: number;
  combo: number;
  multiplier: number;
  wild: number;
  correct: boolean;
};

const isBotMatch = (room: any): boolean => room?.players?.some((p: any) => p?.kind === 'bot') === true;

/** Completed rounds ordered by round index — the order progression counts combos in. */
export function orderedRounds(room: any): any[] {
  return [...completedRounds(room)]
    .filter((r: any) => r && r.result)
    .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0));
}

/**
 * Consecutive correct answers by the local seat. With `roundId`, the run as it stood at that
 * round; without one, the run after the last completed round (what the HUD shows).
 */
export function comboAt(room: any, roundId?: string | null): number {
  let run = 0,
    at = 0;
  for (const r of orderedRounds(room)) {
    run = r.receipts?.[room.seat]?.correct === true ? run + 1 : 0;
    if (roundId && r.id === roundId) at = run;
  }
  return roundId ? at : run;
}

/** XP for one resolved round, broken down the way the reducer builds it. */
export function roundXp(room: any, round: any): RoundXp | null {
  if (!room || !round?.result) return null;
  const me = round.receipts?.[room.seat] ?? null;
  const correct = me?.correct === true;
  const ms = correct && Number.isFinite(me?.elapsedMs) ? Math.round(me.elapsedMs) : null;
  const base = correct ? (isBotMatch(room) ? XP.roundCorrectBot : XP.roundCorrectHuman) : XP.roundWrong;
  const speed = ms === null ? 0 : ms < 2000 ? XP.speedFast : ms < 4000 ? XP.speedQuick : 0;
  const difficulty = (DIFFICULTY_MULTIPLIER as any)[round.question?.difficulty] ?? 1;
  const combo = correct ? Math.max(1, comboAt(room, round.id)) : 0;
  const multiplier = comboMultiplier(combo);
  const raw = wildRound(round.id);
  const wild = raw === 2 || raw === 3 ? raw : 1;
  return {
    total: Math.round((base + speed) * difficulty * multiplier) * wild,
    base,
    speed,
    difficulty,
    combo,
    multiplier,
    wild,
    correct,
  };
}

/** The speed bonus still on the table `elapsed` ms into a round, and how long it lasts. */
export function speedBonus(elapsedMs: number): { xp: number; window: number; fraction: number } {
  const window = 4000;
  const xp = elapsedMs < 2000 ? XP.speedFast : elapsedMs < window ? XP.speedQuick : 0;
  return { xp, window, fraction: Math.max(0, Math.min(1, 1 - elapsedMs / window)) };
}

const MATCH_XP_KINDS = new Set(['round', 'match', 'wild']);

/** XP logged on this device since the room was created (round / match / wild entries only). */
export function matchXp(player: any, room: any): number {
  const since = Number.isFinite(room?.createdAt) ? room.createdAt : 0;
  const log = player?.progression?.log;
  if (!Array.isArray(log) || !since) return 0;
  return log.reduce(
    (sum: number, e: any) =>
      e && MATCH_XP_KINDS.has(e.kind) && Number.isFinite(e.at) && e.at >= since
        ? sum + (Number.isFinite(e.xp) ? e.xp : 0)
        : sum,
    0,
  );
}

export type MatchRank = {
  /** Rank points this match moved, after the demotion floor. */
  delta: number;
  /** A loss that the tier floor absorbed. */
  held: boolean;
  points: number;
  label: string;
  tier: string;
  into: number;
  toNext: number;
  progress: number;
};

/** Arena Rank now, plus the points this match was worth (0 when the tier floor held a loss). */
export function matchRank(room: any, progression: any): MatchRank {
  const mode = room?.config?.mode;
  const outcome = room?.winner === null ? 'draw' : room?.winner === room?.seat ? 'win' : 'loss';
  let delta =
    outcome === 'win'
      ? ((XP.rankWin as any)[mode] ?? XP.rankWin.quick)
      : outcome === 'loss'
        ? XP.rankLoss
        : XP.rankDraw;
  if (!isBotMatch(room) && delta > 0) delta = Math.round(delta * XP.humanMultiplier);
  const points = Number.isFinite(progression?.rank?.points) ? progression.rank.points : 0;
  const floor = Number.isFinite(progression?.rank?.floor) ? progression.rank.floor : 0;
  const held = delta < 0 && points <= floor;
  return { ...rankForPoints(points), points, delta: held ? 0 : delta, held };
}

/** Rounds won, and for a loss the true per-round time gap read straight off the receipts. */
export function marginLine(room: any): string {
  const seat = room.seat;
  const rounds = orderedRounds(room).filter((r: any) => r.result?.reason !== 'timing-inconsistent');
  if (!rounds.length) return 'No rounds were resolved in this match.';
  const won = rounds.filter((r: any) => r.result.winner === seat).length;
  const tied = rounds.filter(
    (r: any) => r.result.winner === null && r.result.reason === 'close-result',
  ).length;
  const blank = rounds.filter(
    (r: any) => r.result.winner === null && r.result.reason === 'no-correct-answer',
  ).length;
  const tail = [
    tied ? `${tied} inside the draw band` : '',
    blank ? `${blank} with no correct answer` : '',
  ].filter(Boolean);
  const base = `${won} of ${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'} to you${
    tail.length ? ` — ${tail.join(', ')}` : ''
  }.`;
  if (room.winner === seat || room.winner === null) return base;
  const gaps = rounds
    .filter(
      (r: any) =>
        r.result.reason === 'screen-time' &&
        r.result.winner === 1 - seat &&
        r.receipts?.[seat] &&
        r.receipts?.[1 - seat],
    )
    .map((r: any) => ({
      index: r.index ?? 0,
      gap: Math.abs(r.receipts[seat].elapsedMs - r.receipts[1 - seat].elapsedMs),
      simulated: r.receipts[1 - seat].simulated === true,
    }));
  if (!gaps.length) return base;
  const closest = gaps.reduce((a: any, b: any) => (b.gap < a.gap ? b : a));
  return `${base} Closest call: round ${closest.index + 1} went the other way by ${(
    closest.gap / 1000
  ).toFixed(3)} s${closest.simulated ? ' — a scheduled bot time' : ''}.`;
}
