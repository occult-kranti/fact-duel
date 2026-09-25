/**
 * three/tijori.tsx — TIJORI, the safe that fills with one coin per sourced receipt (bible §10).
 * STUB: final props API + the 2D fallback. The three lane adds the Rapier scene behind SceneHost
 * (reference: components/three/gem-vault.tsx) without changing these props.
 *
 *   <Tijori count={214} newCount={3} />
 *
 * The final state is the TRUE count, printed beside the art. Coins are not money.
 */
import { formatNumber } from '../data';
import { SceneHost, type SceneComponent } from './scene-host';

export type TijoriProps = {
  /** Receipts collected (the real journal count). */
  count: number;
  /** Receipts added since the tijori was last opened: only these animate in 3D (≤ 12). */
  newCount?: number;
  /** Box height; bible: 280 (phone) / 360 (desktop). */
  height?: number;
  /** Lazy 3D scene (the three lane). */
  scene?: SceneComponent<{ count: number; newCount: number }>;
  className?: string;
};

export const tijoriLabel = (count: number) => `Tijori: ${formatNumber(count)} ${count === 1 ? 'receipt' : 'receipts'}. 1 coin = 1 sourced receipt. Not money.`;

/** Bar height for the 2D art: linear to 100, log-scaled after (bible §10). 0..1. */
export function tijoriFill(count: number): number {
  if (count <= 0) return 0;
  if (count <= 100) return 0.1 + 0.6 * (count / 100);
  return Math.min(1, 0.7 + 0.1 * Math.log10(count / 100) * 3);
}

export function TijoriArt({ count, newCount = 0 }: { count: number; newCount?: number }) {
  const fill = tijoriFill(count);
  const bars = [0.92, 1, 0.86, 0.97, 0.9];
  return (
    <div className="h-tijori">
      <div className="h-tijori__safe" aria-hidden="true">
        <div className="h-tijori__glass">
          {count > 0 ? bars.map((b, i) => <span key={i} className="h-tijori__bar" style={{ height: `${Math.round(fill * b * 100)}%` }} />) : null}
        </div>
        <span className="h-tijori__dial" />
      </div>
      <div className="h-tijori__count" aria-hidden="true">
        <span className="h-tijori__num">{formatNumber(count)}</span>
        <span className="h-tijori__unit">{count === 1 ? 'receipt' : 'receipts'}</span>
        {newCount > 0 ? <span className="h-tijori__new">+{formatNumber(newCount)} new</span> : null}
        <span className="h-tijori__note">1 coin = 1 sourced receipt. Not money.</span>
      </div>
    </div>
  );
}

export function Tijori({ count, newCount = 0, height, scene, className }: TijoriProps) {
  return (
    <SceneHost
      label={tijoriLabel(count)}
      fallback={<TijoriArt count={count} newCount={newCount} />}
      scene={scene}
      props={{ count, newCount: Math.min(12, newCount) }}
      height={height}
      className={className}
    />
  );
}
