/**
 * three/scene-host.tsx — the gate every 3D set piece mounts through (bible §10).
 *
 *   const TijoriScene = lazy(() => import('./tijori-scene'));        // at MODULE scope, never in render
 *   <SceneHost label="Tijori: 214 receipts. 1 coin = 1 sourced receipt. Not money." fallback={<TijoriArt …/>}
 *     scene={TijoriScene} props={{ count: 214 }} height={280} />
 *
 * It renders the 2D `fallback` (same numbers, same label) unless ALL of these hold:
 *  - the notification budget is not live (countdown → round.result) — while live it REFUSES to mount
 *    and unmounts a mounted scene;
 *  - Effects = Full (lib/fx/prefs motion 'full') and the OS does not ask for reduced motion… except
 *    that a reduced-motion player still gets one settled frame if the scene supports `reduced`;
 *  - no Save-Data, and `navigator.deviceMemory` ≥ 4 where reported;
 *  - WebGL is available (components/three/scene-frame `supportsWebGL`);
 *  - a `scene` component was given — a React.lazy() made at module scope (the three lane adds them;
 *    until then every set piece is 2D).
 * One canvas at a time: a new SceneHost that mounts takes the slot and the previous one falls back.
 * The box is role="img" with `label` either way.
 */
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { getPrefs, subscribePrefs } from '@/lib/fx/prefs';
import { useLiveRound } from '../budget';
import { cx } from '../ui/cx';
import './three.css';

/** A 3D scene component: `lazy(() => import('./x-scene'))`, created once at module scope. */
export type SceneComponent<P> = ComponentType<P>;

export type SceneHostProps<P extends object> = {
  /** Accessible description with the TRUE numbers; the fallback carries the same label. */
  label: string;
  /** The 2D art (always rendered when 3D is not allowed, and while the scene loads). */
  fallback: ReactNode;
  /** Lazy 3D scene (the three lane), created at module scope. Omit → always 2D. */
  scene?: SceneComponent<P>;
  /** Props for the scene. */
  props?: P;
  /** Box height (px or CSS length). */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
};

type Capability = { ok: boolean; reason: string };

/** Effects = Full, no Save-Data, enough memory. (WebGL is probed by the scene's own SceneFrame.) */
export function sceneCapability(): Capability {
  if (typeof window === 'undefined') return { ok: false, reason: 'server' };
  const prefs = getPrefs();
  if (prefs.motion !== 'full') return { ok: false, reason: `effects-${prefs.motion}` };
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return { ok: false, reason: 'save-data' };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return { ok: false, reason: 'low-memory' };
  return { ok: true, reason: 'ok' };
}

// One canvas at a time: the most recent host to ask holds the slot.
let slotOwner: symbol | null = null;
const slotListeners = new Set<() => void>();
const claim = (me: symbol) => {
  slotOwner = me;
  for (const fn of Array.from(slotListeners)) fn();
};
const free = (me: symbol) => {
  if (slotOwner !== me) return;
  slotOwner = null;
  for (const fn of Array.from(slotListeners)) fn();
};
const subscribeSlot = (fn: () => void) => {
  slotListeners.add(fn);
  return () => {
    slotListeners.delete(fn);
  };
};

const usePrefsVersion = () => useSyncExternalStore(subscribePrefs, getPrefs, getPrefs);

export function SceneHost<P extends object>({ label, fallback, scene, props, height, className, style }: SceneHostProps<P>) {
  const live = useLiveRound();
  const prefs = usePrefsVersion();
  const [me] = useState(() => Symbol('scene'));
  const owner = useSyncExternalStore(subscribeSlot, () => slotOwner, () => null);
  // Capability re-reads when prefs change (the prefs object identity changes with them).
  const capable = useMemo(() => sceneCapability().ok, [prefs]); // eslint-disable-line react-hooks/exhaustive-deps
  const wants = !!scene && !live && capable;

  useEffect(() => {
    if (!wants) return;
    claim(me);
    return () => free(me);
  }, [wants, me]);

  const Scene = scene ?? null;
  const mounted = wants && owner === me && Scene;
  const box: CSSProperties = { ...style, ...(height !== undefined ? { ['--h-scene-h' as string]: typeof height === 'number' ? `${height}px` : height } : null) };

  return (
    <div className={cx('h-scenehost', className)} role="img" aria-label={label} style={box} data-scene={mounted ? '3d' : '2d'}>
      {mounted && Scene ? (
        <Suspense fallback={<div className="h-scenehost__fallback">{fallback}</div>}>
          <Scene {...(props as P)} />
        </Suspense>
      ) : (
        <div className="h-scenehost__fallback">{fallback}</div>
      )}
    </div>
  );
}
