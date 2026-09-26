/**
 * three/tarazu.tsx — TARAZU, the balance scale on the match result (bible §10).
 *
 *   <Tarazu scores={[2, 1]} names={['You', 'Babu-Bot · BOT']} winner={0} />
 *
 * One file-block weight drops into a seat's pan per round won; the beam (a Rapier revolute joint) tips
 * and its limits are the TRUE angle: score difference × 6°, at most 24°, towards the winner; a draw
 * settles level. Mount it 250 ms after the verdict text renders; it never mounts during a round
 * (SceneHost refuses while live) and must unmount before a rematch countdown. Names and scores are
 * printed under the pans. 2D fallback: the same scale in SVG at the same angle.
 */
import { SceneHost, type SceneComponent } from './scene-host';
import { TarazuScene } from './scenes';

export type TarazuSceneProps = { scores: readonly [number, number]; names: readonly [string, string]; winner: 0 | 1 | null; angle: number; onSettled?: () => void };

export type TarazuProps = {
  /** Round wins per seat, [seat 0, seat 1] — the true score. */
  scores: readonly [number, number];
  /** Display names, [seat 0, seat 1]. Use data.ts seatName: the bot is "Babu-Bot · BOT". */
  names: readonly [string, string];
  /** The winning seat, or null for a draw / no result. */
  winner: 0 | 1 | null;
  /** Box height; default 240 (phone) / 320 (≥ 900px). */
  height?: number;
  /** Lazy 3D scene; defaults to the Rapier scale. Pass `null` to force the 2D art. */
  scene?: SceneComponent<TarazuSceneProps> | null;
  /** Sound/haptic twins (a low thump per weight, medium haptic on settle). Default true. */
  cues?: boolean;
  /** Called once the beam has settled at the true angle (3D), for a settle cue. */
  onSettled?: () => void;
  className?: string;
};

/**
 * The beam's final angle in degrees (negative tips left, towards seat 0): the TRUE round difference
 * × 6°, capped at 24°. Level on a draw, with no winner, or if the score does not favour `winner`.
 */
export function tarazuAngle(scores: readonly [number, number], winner: 0 | 1 | null): number {
  if (winner === null) return 0;
  const diff = (scores[winner] ?? 0) - (scores[winner === 0 ? 1 : 0] ?? 0);
  if (!(diff > 0)) return 0;
  const deg = Math.min(24, diff * 6);
  return winner === 0 ? -deg : deg;
}

export function tarazuLabel(scores: readonly [number, number], names: readonly [string, string], winner: 0 | 1 | null) {
  if (winner === null || tarazuAngle(scores, winner) === 0) return `Scale level: ${names[0]} ${scores[0]}, ${names[1]} ${scores[1]}.`;
  const w = winner;
  const l = w === 0 ? 1 : 0;
  return `Scale tips to ${names[w]}: ${scores[w]} ${scores[w] === 1 ? 'round' : 'rounds'} to ${scores[l]}.`;
}

/** A pan prints ≤ 14 characters: a longer name is cut at 13 with an ellipsis, never mid-word silently. */
export const panName = (name: string) => {
  const n = String(name ?? '').trim();
  return n.length > 14 ? `${n.slice(0, 13).trimEnd()}…` : n;
};

export function TarazuArt({ scores, names, winner, level = false }: Pick<TarazuProps, 'scores' | 'names' | 'winner'> & { level?: boolean }) {
  const angle = level ? 0 : tarazuAngle(scores, winner);
  return (
    <div className="h-tarazu" aria-hidden="true">
      <svg viewBox="0 0 320 200" focusable="false">
        <rect className="h-tarazu__post" x="155" y="40" width="10" height="130" rx="3" />
        <rect className="h-tarazu__post" x="110" y="168" width="100" height="10" rx="4" />
        <g className="h-tarazu__beam" style={{ transform: `rotate(${angle}deg)` }}>
          <line className="h-tarazu__line" x1="40" y1="40" x2="280" y2="40" />
          <circle className="h-tarazu__post" cx="160" cy="40" r="7" />
          <path className="h-tarazu__line" d="M40 40 L15 110 M40 40 L65 110 M280 40 L255 110 M280 40 L305 110" />
          <path className="h-tarazu__pan" d="M5 110 H75 Q72 132 40 132 Q8 132 5 110 Z" />
          <path className="h-tarazu__pan" d="M245 110 H315 Q312 132 280 132 Q248 132 245 110 Z" />
          {level ? null : (
            <>
              <text className="h-tarazu__score" x="40" y="126" textAnchor="middle">
                {scores[0]}
              </text>
              <text className="h-tarazu__score" x="280" y="126" textAnchor="middle">
                {scores[1]}
              </text>
            </>
          )}
        </g>
        <text className="h-tarazu__name" x="40" y="196" textAnchor="middle">
          {panName(names[0])}
        </text>
        <text className="h-tarazu__name" x="280" y="196" textAnchor="middle">
          {panName(names[1])}
        </text>
      </svg>
    </div>
  );
}

export function Tarazu({ scores, names, winner, height, scene, cues = true, onSettled, className }: TarazuProps) {
  const safe: [number, number] = [Math.max(0, Math.floor(scores[0] ?? 0)), Math.max(0, Math.floor(scores[1] ?? 0))];
  return (
    <SceneHost
      piece="tarazu"
      label={tarazuLabel(safe, names, winner)}
      fallback={<TarazuArt scores={safe} names={names} winner={winner} />}
      loading={<TarazuArt scores={safe} names={names} winner={winner} level />}
      deadlineMs={2600}
      scene={scene === null ? undefined : (scene ?? TarazuScene)}
      props={{ scores: safe, names, winner, angle: tarazuAngle(safe, winner), onSettled }}
      height={height}
      cues={cues}
      className={className}
    />
  );
}
