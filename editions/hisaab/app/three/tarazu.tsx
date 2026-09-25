/**
 * three/tarazu.tsx — TARAZU, the balance scale on the match result (bible §10).
 * STUB: final props API + the 2D fallback (an SVG scale rotated by the TRUE angle).
 *
 *   <Tarazu scores={[2, 1]} names={['You', 'Babu-Bot · BOT']} winner={0} />
 *
 * Angle = score difference × 6°, max 24°, towards the winner; a draw settles level. Mount it 250 ms
 * after the verdict text renders; it never mounts during a round (SceneHost refuses while live), and
 * it must unmount before a rematch countdown.
 */
import { SceneHost, type SceneComponent } from './scene-host';

export type TarazuProps = {
  /** Round wins per seat, [seat 0, seat 1] — the true score. */
  scores: readonly [number, number];
  /** Display names, [seat 0, seat 1]. Use data.ts seatName: the bot is "Babu-Bot · BOT". */
  names: readonly [string, string];
  /** The winning seat, or null for a draw / no result. */
  winner: 0 | 1 | null;
  height?: number;
  scene?: SceneComponent<{ scores: readonly [number, number]; names: readonly [string, string]; winner: 0 | 1 | null; angle: number }>;
  className?: string;
};

/** The beam's final angle in degrees (negative tips left, towards seat 0). */
export function tarazuAngle(scores: readonly [number, number], winner: 0 | 1 | null): number {
  if (winner === null) return 0;
  const diff = Math.abs(scores[0] - scores[1]);
  const deg = Math.min(24, Math.max(6, diff * 6));
  return winner === 0 ? -deg : deg;
}

export function tarazuLabel(scores: readonly [number, number], names: readonly [string, string], winner: 0 | 1 | null) {
  if (winner === null) return `Scale level: ${names[0]} ${scores[0]}, ${names[1]} ${scores[1]}.`;
  const w = winner;
  const l = w === 0 ? 1 : 0;
  return `Scale tips to ${names[w]}: ${scores[w]} rounds to ${scores[l]}.`;
}

export function TarazuArt({ scores, names, winner }: Pick<TarazuProps, 'scores' | 'names' | 'winner'>) {
  const angle = tarazuAngle(scores, winner);
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
          <text className="h-tarazu__score" x="40" y="126" textAnchor="middle">
            {scores[0]}
          </text>
          <text className="h-tarazu__score" x="280" y="126" textAnchor="middle">
            {scores[1]}
          </text>
        </g>
        <text className="h-tarazu__name" x="40" y="196" textAnchor="middle">
          {names[0].slice(0, 14)}
        </text>
        <text className="h-tarazu__name" x="280" y="196" textAnchor="middle">
          {names[1].slice(0, 14)}
        </text>
      </svg>
    </div>
  );
}

export function Tarazu({ scores, names, winner, height, scene, className }: TarazuProps) {
  return (
    <SceneHost
      label={tarazuLabel(scores, names, winner)}
      fallback={<TarazuArt scores={scores} names={names} winner={winner} />}
      scene={scene}
      props={{ scores, names, winner, angle: tarazuAngle(scores, winner) }}
      height={height}
      className={className}
    />
  );
}
