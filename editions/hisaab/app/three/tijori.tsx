/**
 * three/tijori.tsx — TIJORI, the safe that fills with one coin per sourced receipt (bible §10).
 *
 *   <Tijori count={214} newCount={3} />
 *
 * Capable devices get the Rapier scene (tijori-scene.tsx) once the box is in view and the browser is
 * idle: every ten receipts are a manila packet tied with red tape, the rest are loose ₹ coins, so the
 * safe holds exactly `count` (packets beyond 72 rest as a full safe; the printed number stays true).
 * Only the `newCount` newest receipts (≤ 12) drop; everything older starts settled. Everyone else gets
 * the 2D art. Either way the TRUE count is printed beside the safe. Coins are not money.
 */
import { formatNumber } from '../data';
import { useLang } from '../ui/lang';
import { SceneHost, type SceneComponent } from './scene-host';
import { TijoriScene } from './scenes';

export type TijoriSceneProps = { count: number; newCount: number; shownNew: number };

export type TijoriProps = {
  /** Receipts collected (the real journal count). */
  count: number;
  /** Receipts added since the tijori was last opened: only these animate in 3D (≤ 12). */
  newCount?: number;
  /** Box height; default 280 (phone) / 360 (≥ 900px). */
  height?: number;
  /** Lazy 3D scene; defaults to the Rapier tijori. Pass `null` to force the 2D art. */
  scene?: SceneComponent<TijoriSceneProps> | null;
  /** 'visible' (default): load once scrolled into view and idle. 'mount': load at once (a tap opened it). */
  trigger?: 'mount' | 'visible';
  /** Sound/haptic twins (a coin ping per landing, a light tap on the first). Default true. */
  cues?: boolean;
  className?: string;
};

/** The box's accessible name with the TRUE count; `locale: 'hi'` for the Hindi locale (draft, for review). */
export const tijoriLabel = (count: number, locale: 'en' | 'hi' = 'en') =>
  locale === 'hi'
    ? `तिजोरी: ${formatNumber(count)} ${count === 1 ? 'रसीद' : 'रसीदें'}। 1 सिक्का = 1 सोर्स वाली रसीद। पैसा नहीं।`
    : `Tijori: ${formatNumber(count)} ${count === 1 ? 'receipt' : 'receipts'}. 1 coin = 1 sourced receipt. Not money.`;

/** Bar height for the 2D art: linear to 100, log-scaled after (bible §10). 0..1. */
export function tijoriFill(count: number): number {
  if (count <= 0) return 0;
  if (count <= 100) return 0.1 + 0.6 * (count / 100);
  return Math.min(1, 0.7 + 0.1 * Math.log10(count / 100) * 3);
}

/** The printed true count, shared by the 2D art and the 3D scene. */
export function TijoriCount({ count, newCount = 0 }: { count: number; newCount?: number }) {
  const { t } = useLang();
  return (
    <div className="h-tijori__count" aria-hidden="true">
      <span className="h-tijori__num">{formatNumber(count)}</span>
      <span className="h-tijori__unit">{count === 1 ? t('receipt', 'रसीद') : t('receipts', 'रसीदें')}</span>
      {newCount > 0 ? (
        <span className="h-tijori__new">
          +{formatNumber(newCount)} <span className="h-tijori__newword">{t('new', 'नई')}</span>
        </span>
      ) : null}
      <span className="h-tijori__note">{t('1 coin = 1 sourced receipt. Not money.', '1 सिक्का = 1 सोर्स वाली रसीद। पैसा नहीं।')}</span>
    </div>
  );
}

/** The 2D safe: a glass box with coin bars, height ∝ count (log-scaled after 100). */
export function TijoriSafe({ count }: { count: number }) {
  const fill = tijoriFill(count);
  const bars = [0.92, 1, 0.86, 0.97, 0.9];
  return (
    <div className="h-tijori__safe" aria-hidden="true">
      <div className="h-tijori__glass">
        {count > 0 ? bars.map((b, i) => <span key={i} className="h-tijori__bar" style={{ height: `${Math.round(fill * b * 100)}%` }} />) : null}
      </div>
      <span className="h-tijori__dial" />
    </div>
  );
}

export function TijoriArt({ count, newCount = 0 }: { count: number; newCount?: number }) {
  return (
    <div className="h-tijori">
      <TijoriSafe count={count} />
      <TijoriCount count={count} newCount={newCount} />
    </div>
  );
}

/** While the 3D chunk loads: the 3D layout, the 2D safe standing in the canvas slot. */
function TijoriHold({ count, newCount }: { count: number; newCount: number }) {
  return (
    <div className="h-t3 h-t3--tijori">
      <div className="h-t3__canvas h-t3__canvas--hold">
        <TijoriSafe count={count} />
      </div>
      <TijoriCount count={count} newCount={newCount} />
    </div>
  );
}

export function Tijori({ count, newCount = 0, height, scene, trigger = 'visible', cues = true, className }: TijoriProps) {
  const { locale } = useLang();
  const n = Math.max(0, Math.floor(count));
  // The printed "+n new" is the true number; only the newest 12 of them drop in 3D.
  const shown = Math.max(0, Math.min(Math.floor(newCount), n));
  const fresh = Math.min(12, shown);
  return (
    <SceneHost
      piece="tijori"
      label={tijoriLabel(n, locale)}
      fallback={<TijoriArt count={n} newCount={shown} />}
      loading={<TijoriHold count={n} newCount={shown} />}
      // An empty safe has nothing to drop or settle: the 2D art says it without loading the chunk.
      scene={scene === null || n === 0 ? undefined : (scene ?? TijoriScene)}
      props={{ count: n, newCount: fresh, shownNew: shown }}
      height={height}
      trigger={trigger}
      cues={cues}
      className={className}
    />
  );
}
