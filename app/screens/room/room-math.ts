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

/**
 * How loud this win is allowed to be.
 *
 * Confetti on every win is ten confetti storms in a session, which is habituation, which ends with
 * the player turning sound off. The tier is decided by what was actually at stake, never randomised:
 * an unpredictable *intensity* is a reinforcement schedule, whereas unpredictable *true content* is
 * a reason to read the screen.
 */
export type WinTier = 'routine' | 'notable' | 'ceremonial';

/** Log kinds that already open the full-screen ceremony; confetti must never stack behind one. */
const CEREMONIAL_KINDS = new Set(['level', 'achievement', 'rank']);

export function winTier(room: any, player: any): WinTier {
  const since = Number.isFinite(room?.createdAt) ? room.createdAt : 0;
  const log = player?.progression?.log;
  if (
    since &&
    Array.isArray(log) &&
    log.some((e: any) => e && CEREMONIAL_KINDS.has(e.kind) && Number.isFinite(e.at) && e.at >= since)
  )
    return 'ceremonial';
  const human = !isBotMatch(room);
  // A first duel against a human is a milestone whatever the scoreline looked like.
  if (human && (player?.progression?.counters?.humanMatches ?? 0) <= 1) return 'ceremonial';
  if (human || room?.config?.mode !== 'quick') return 'notable';
  return bestCombo(room) >= 3 ? 'notable' : 'routine';
}

/** The longest run of correct answers by the local seat in this match. */
export function bestCombo(room: any): number {
  let run = 0,
    best = 0;
  for (const r of orderedRounds(room)) {
    run = r.receipts?.[room.seat]?.correct === true ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

export type KeepBlock = { title: string; bullets: string[] };

/**
 * What a lost match actually left behind, with every number read off this room and this profile.
 *
 * The rule is that encouragement names what happened and hands over what was earned; it never rates
 * the player and never claims a hold that did not occur. Two bullets in particular are gated on the
 * hold really happening: the rank floor only absorbs a loss when the points were already at it (a
 * Gold player on 300 who loses goes to 290 — ten real points, no protection), and the daily streak is
 * credited once per day on any activity, so on the second match of a day this loss held nothing.
 * Every line below renders only when it is true, title lines included.
 */
export function whatYouKeep(room: any, player: any): KeepBlock {
  const seat = room.seat;
  const rounds = orderedRounds(room).filter((r: any) => r.result?.reason !== 'timing-inconsistent');
  const n = rounds.length;
  const mine = rounds.map((r: any) => r.receipts?.[seat] ?? null);
  const correct = mine.filter((a: any) => a?.correct).length;
  const plural = n === 1 ? 'fact' : 'facts';

  // Title: first true case wins.
  let title = `${n} ${plural} you have now answered at least once.`;
  if (correct === 0 && n > 0) title = `${n} ${plural}, then. That is the trade.`;
  if (n > 0 && correct === n) title = 'You were right every time. They were faster.';
  else {
    // A topic that accounts for the losses is a controllable, unstable cause — the kind of
    // attribution the persistence literature says sustains a next attempt.
    const byTopic = new Map<string, { lost: number; total: number }>();
    for (const r of rounds) {
      const topic = r.question?.topic;
      if (!topic) continue;
      const slot = byTopic.get(topic) ?? { lost: 0, total: 0 };
      slot.total += 1;
      if (!r.receipts?.[seat]?.correct) slot.lost += 1;
      byTopic.set(topic, slot);
    }
    const lost = n - correct;
    for (const [topic, slot] of byTopic)
      // "Accounts for" is two-thirds of the losses or more, concentrated in a topic that is not
      // simply the whole match — otherwise the line says nothing the scoreline did not.
      if (lost >= 2 && slot.lost >= 2 && slot.lost * 3 >= lost * 2 && slot.total < n) {
        title = `${topic} is where this went. ${slot.lost} of ${slot.total} ${topic} rounds got away.`;
        break;
      }
  }

  const bullets: string[] = [];
  if (n > 0) bullets.push(`${n} ${plural} in your Vault`);

  const fastest = rounds
    .map((r: any, i: number) => ({ ms: r.receipts?.[seat]?.correct ? r.receipts[seat].elapsedMs : null, i }))
    .filter((x: any) => Number.isFinite(x.ms))
    .sort((a: any, b: any) => a.ms - b.ms)[0];
  if (fastest)
    bullets.push(`Fastest correct answer: ${(fastest.ms / 1000).toFixed(2)} s, round ${fastest.i + 1}`);

  const since = Number.isFinite(room?.createdAt) ? room.createdAt : 0;
  const log = player?.progression?.log;
  const creditedStreak =
    since &&
    Array.isArray(log) &&
    log.some((e: any) => e && e.kind === 'streak' && Number.isFinite(e.at) && e.at >= since);
  const day = player?.progression?.streak?.current ?? 0;
  if (creditedStreak && day > 0) bullets.push(`Day ${day} streak held`);

  const xp = matchXp(player, room);
  if (xp > 0) bullets.push(`+${xp} XP`);

  const rank = matchRank(room, player?.progression);
  if (rank.held) bullets.push(`Arena Rank protected at the ${rank.label} floor`);
  else if (rank.delta !== 0)
    bullets.push(`${rank.delta > 0 ? '+' : ''}${rank.delta} rank points · still ${rank.label}`);

  return { title, bullets };
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
