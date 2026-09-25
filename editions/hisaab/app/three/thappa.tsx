/**
 * three/thappa.tsx — THAPPA, the rubber stamp that lands on a receipt, the label ceremony and the
 * certificate (bible §10). STUB: final props API + the 2D fallback (the CSS stamp slam, motion #3).
 *
 *   <Thappa text="ISSUED · RECEIPT MAANGO" kind="noted" seed="band-4" />
 */
import { Stamp, type StampKind } from '../ui/stamp';
import { SceneHost, type SceneComponent } from './scene-host';

export type ThappaProps = {
  /** The stamp's words, e.g. 'ISSUED · RECEIPT MAANGO' or 'FILE CLEARED · 18/24'. */
  text: string;
  kind: StampKind;
  /** Seed for the tilt (defaults to the text). */
  seed?: string;
  /** Called once the stamp has landed (2D: after the slam). */
  onDone?: () => void;
  height?: number;
  scene?: SceneComponent<{ text: string; kind: StampKind; onDone?: () => void }>;
  className?: string;
};

export function ThappaArt({ text, kind, seed, onDone }: Pick<ThappaProps, 'text' | 'kind' | 'seed' | 'onDone'>) {
  return (
    <div className="h-thappa" onAnimationEnd={onDone}>
      <Stamp kind={kind} seed={seed ?? text} text={text} size="l" animate />
    </div>
  );
}

export function Thappa({ text, kind, seed, onDone, height, scene, className }: ThappaProps) {
  return (
    <SceneHost
      label={`Stamped: ${text}.`}
      fallback={<ThappaArt text={text} kind={kind} seed={seed} onDone={onDone} />}
      scene={scene}
      props={{ text, kind, onDone }}
      height={height}
      className={className}
    />
  );
}
