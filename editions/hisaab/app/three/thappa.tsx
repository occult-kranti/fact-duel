/**
 * three/thappa.tsx — THAPPA, the rubber stamp that lands on the Aaj finish, the label ceremony and the
 * certificate (bible §10).
 *
 *   <Thappa text="ISSUED · RECEIPT MAANGO" kind="noted" seed="band-4" />
 *
 * 3D (capable devices, Effects Full): a wooden stamp drops (restitution 0.3), leaves an ink impression
 * drawn exactly like the 2D `h-stamp` on first contact, and lifts away; the canvas lives ≤ 1.4 s and
 * then unmounts, leaving the static 2D stamp in the same place. If the scene cannot paint within
 * 1.2 s (a cold chunk + Rapier start), the 2D slam plays instead — never both. Reduced motion: the
 * stamp simply appears (2D). `onDone` fires once, when the stamp has landed.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useJuice } from '@/components/fx';
import { Stamp, type StampKind } from '../ui/stamp';
import { SceneHost, type SceneComponent } from './scene-host';
import { ThappaScene } from './scenes';

export type ThappaSceneProps = { text: string; kind: StampKind; seed: string; onDone?: () => void };

export type ThappaProps = {
  /** The stamp's words, e.g. 'ISSUED · RECEIPT MAANGO' or 'FILE CLEARED · 18/24'. */
  text: string;
  kind: StampKind;
  /** Seed for the tilt (defaults to the text). */
  seed?: string;
  /** Called once the stamp has landed (2D: after the slam). */
  onDone?: () => void;
  /** Box height (default 180). */
  height?: number;
  /** Lazy 3D scene; defaults to the Rapier stamp. Pass `null` to force the 2D art. */
  scene?: SceneComponent<ThappaSceneProps> | null;
  /** Sound/haptic twins (stamp + correct/wrong, one heavy haptic). Default true. */
  cues?: boolean;
  className?: string;
};

/** The 2D stamp: the CSS slam (motion #3) or, with animate={false}, the stamp at rest. */
export function ThappaArt({
  text,
  kind,
  seed,
  onDone,
  animate = true,
  cues = false,
  ghost = false,
}: Pick<ThappaProps, 'text' | 'kind' | 'seed' | 'onDone'> & { animate?: boolean; cues?: boolean; ghost?: boolean }) {
  const juice = useJuice();
  useEffect(() => {
    if (!animate || !cues || ghost) return;
    juice.sound('stamp');
    if (kind === 'pass' || /ISSUED/.test(text)) juice.sound('correct');
    else if (kind === 'fail') juice.sound('wrong');
    juice.haptic('heavy');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={ghost ? 'h-thappa h-thappa--ghost' : 'h-thappa'} onAnimationEnd={animate && !ghost ? onDone : undefined}>
      <Stamp kind={kind} seed={seed ?? text} text={text} size="l" animate={animate && !ghost} />
    </div>
  );
}

export function Thappa({ text, kind, seed, onDone, height, scene, cues = true, className }: ThappaProps) {
  const s = seed ?? text;
  const fired = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;
  const once = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    done.current?.();
  }, []);
  return (
    <SceneHost
      piece="thappa"
      label={`Stamped: ${text}.`}
      fallback={<ThappaArt text={text} kind={kind} seed={s} onDone={once} cues={cues} />}
      loading={<ThappaArt text={text} kind={kind} seed={s} animate={false} ghost />}
      after={<ThappaArt text={text} kind={kind} seed={s} animate={false} />}
      deadlineMs={1200}
      reducedFallback
      scene={scene === null ? undefined : (scene ?? ThappaScene)}
      props={{ text, kind, seed: s, onDone: once }}
      height={height}
      cues={cues}
      className={className}
    />
  );
}
