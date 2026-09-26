/**
 * three/scene-host.tsx — the gate every 3D set piece mounts through (bible §10).
 *
 *   <SceneHost piece="tijori" label="Tijori: 214 receipts. 1 coin = 1 sourced receipt. Not money."
 *     fallback={<TijoriArt …/>} scene={TijoriScene} props={{ count: 214, newCount: 3 }} trigger="visible" />
 *
 * It renders the 2D `fallback` (same numbers, same label) unless ALL of these hold:
 *  - no round is live (countdown → round.result): while live it REFUSES to mount and unmounts a
 *    mounted scene; and no ceremony covers the box (it waits for Continue, showing its stand-in);
 *  - Effects is not Off, no Save-Data, `navigator.deviceMemory` ≥ 4 where reported (`sceneCapability`);
 *  - WebGL works (probed once, after paint);
 *  - a `scene` was given (a module-scope React.lazy — see scenes.ts).
 * Effects = Reduced or the OS reduced-motion setting: the scene draws ONE settled frame (or, with
 * `reducedFallback`, the 2D art — THAPPA, whose settled state is just the stamp).
 *
 * One canvas at a time: the newest host that wants a canvas takes the slot and the previous one shows
 * its 2D art. A mounted scene that stays out of view for 4 s is unmounted (its GPU memory freed) and
 * comes back settled — no second drop. Context loss, a thrown scene or a missed `deadlineMs` → 2D.
 * The box is role="img" with `label` either way; the scenes also print the true numbers beside the art.
 */
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { getPrefs, subscribePrefs } from '@/lib/fx/prefs';
import { useBudgetSnapshot } from '../budget';
import { cx } from '../ui/cx';
import { probeWebGL, sceneCapability, sceneReduced, type SceneRuntime, type SetPiece } from './runtime';
import './three.css';
import './stage.css';

export { sceneCapability, type Capability, type SceneRuntime, type SetPiece } from './runtime';

/** A 3D scene: `lazy(() => import('./x-scene'))`, created once at module scope. Gets SceneRuntime too. */
export type SceneComponent<P> = ComponentType<P & SceneRuntime>;

export type SceneHostProps<P extends object> = {
  /** Accessible description with the TRUE numbers; the fallback carries the same label. */
  label: string;
  /** The 2D art (rendered whenever 3D is not allowed). */
  fallback: ReactNode;
  /** Lazy 3D scene, created at module scope. Omit → always 2D. */
  scene?: SceneComponent<P>;
  /** Props for the scene. */
  props?: P;
  /** Box height (px or CSS length). Default per piece: 280/360, 240/320, 180, 260/340. */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  /** Which set piece (default heights, stats). */
  piece?: SetPiece;
  /** 'mount' (default): load as soon as allowed. 'visible': once scrolled into view, after idle. */
  trigger?: 'mount' | 'visible';
  /** Shown under the scene until its first frame (default: `fallback`). */
  loading?: ReactNode;
  /** No first frame by then (ms after mount) → the 2D fallback for good. */
  deadlineMs?: number;
  /** Reduced motion → the 2D fallback instead of one settled 3D frame. */
  reducedFallback?: boolean;
  /** Still art shown once the scene has played and left (exited, parked, or lost the slot). THAPPA
   *  leaves its static stamp; FILE PILE its still pile. Default: `fallback`. */
  after?: ReactNode;
  /** Sound/haptic twins (default true). */
  cues?: boolean;
};

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

const PARK_AFTER_MS = 4000;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SceneHost<P extends object>({
  label,
  fallback,
  scene,
  props,
  height,
  className,
  style,
  piece,
  trigger = 'mount',
  loading,
  deadlineMs,
  reducedFallback = false,
  after,
  cues = true,
}: SceneHostProps<P>) {
  const snapshot = useBudgetSnapshot();
  const live = snapshot.live;
  const prefs = usePrefsVersion();
  const [me] = useState(() => Symbol('scene'));
  const owner = useSyncExternalStore(subscribeSlot, () => slotOwner, () => null);
  const box = useRef<HTMLDivElement>(null);

  // Capability and reduced motion re-read when prefs change (the prefs object identity changes with them).
  const capable = useMemo(() => sceneCapability().ok, [prefs]); // eslint-disable-line react-hooks/exhaustive-deps
  const reduced = useMemo(() => sceneReduced(), [prefs]); // eslint-disable-line react-hooks/exhaustive-deps

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [inView, setInView] = useState(trigger === 'mount');
  const [armed, setArmed] = useState(false);
  const [parked, setParked] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [exited, setExited] = useState(false);
  const [inCeremony, setInCeremony] = useState(false);

  // A ceremony over the page covers this box: wait (the ceremony's own THAPPA gets the canvas, and a
  // FILE PILE drops after Continue, where it can be seen). A host inside the ceremony is not covered.
  useEffect(() => {
    setInCeremony(!!box.current?.closest('.h-ceremony'));
  }, []);
  const covered = snapshot.ceremony !== null && !inCeremony;

  const wants = !!scene && !live && capable && !(reduced && reducedFallback) && webgl !== false && !failed && !exited;

  // WebGL probe after paint (never during render: creating a context can take tens of ms).
  useEffect(() => {
    if (!scene || !capable || webgl !== null) return;
    setWebgl(probeWebGL());
  }, [scene, capable, webgl]);

  // Visibility: the 'visible' trigger, parking after 4 s out of view, and the settled comeback.
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (e) setInView(e.isIntersecting);
      },
      { rootMargin: '64px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Arm: 'mount' at once; 'visible' once in view and the browser is idle.
  useEffect(() => {
    if (armed || !wants || webgl !== true) return;
    if (trigger === 'mount') {
      setArmed(true);
      return;
    }
    if (!inView) return;
    const w = window as IdleWindow;
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setArmed(true), { timeout: 800 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setArmed(true), 200);
    return () => window.clearTimeout(id);
  }, [armed, wants, webgl, trigger, inView]);

  const eligible = wants && armed && webgl === true && !parked && !covered;

  useEffect(() => {
    if (!eligible) return;
    claim(me);
    return () => free(me);
  }, [eligible, me]);

  // A freed slot goes to a host still waiting for it (e.g. the one a finished THAPPA displaced).
  useEffect(() => {
    if (eligible && owner === null) claim(me);
  }, [eligible, owner, me]);

  const mounted = eligible && owner === me;

  // A scene that already played comes back settled — after parking, or after losing the slot — never
  // a second drop. Decided once per mount, in render, so the scene never sees it flip.
  const played = useRef(false);
  const wasMounted = useRef(false);
  const settled = useRef(false);
  if (mounted && !wasMounted.current) settled.current = played.current;
  wasMounted.current = mounted;

  // Park a mounted scene that stays out of view; bring it back settled.
  useEffect(() => {
    if (inView) {
      if (parked) setParked(false);
      return;
    }
    if (!mounted) return;
    const id = window.setTimeout(() => setParked(true), PARK_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [inView, mounted, parked]);

  // A fresh mount has not painted yet.
  useEffect(() => {
    if (!mounted) setReady(false);
  }, [mounted]);

  // Deadline: no first frame in time → 2D for good (THAPPA would otherwise stamp twice). It only runs
  // while the box is in view: an offscreen canvas does not draw, and that is not slowness.
  useEffect(() => {
    if (!mounted || ready || !deadlineMs || !inView) return;
    const id = window.setTimeout(() => setFailed('slow'), deadlineMs);
    return () => window.clearTimeout(id);
  }, [mounted, ready, deadlineMs, inView]);

  const onReady = useCallback(() => {
    played.current = true;
    setReady(true);
  }, []);
  const onFail = useCallback((reason: string) => setFailed(reason || 'failed'), []);
  const onExit = useCallback(() => setExited(true), []);

  const Scene = scene ?? null;
  const state = mounted ? '3d' : exited ? 'done' : wants && !parked ? 'pending' : '2d';
  const box3d: CSSProperties = {
    ...style,
    ...(height !== undefined ? { ['--h-scene-h' as string]: typeof height === 'number' ? `${height}px` : height } : null),
  };

  let body: ReactNode;
  if (mounted && Scene) {
    body = (
      <>
        <div className="h-scenehost__under" data-ready={ready ? 'true' : 'false'} aria-hidden="true">
          {loading ?? fallback}
        </div>
        <SceneBoundary onError={() => onFail('error')}>
          <Suspense fallback={null}>
            <Scene
              {...(props as P)}
              reduced={reduced}
              settled={settled.current}
              cues={cues}
              onReady={onReady}
              onFail={onFail}
              onExit={onExit}
            />
          </Suspense>
        </SceneBoundary>
      </>
    );
  } else if ((exited || played.current) && after !== undefined) {
    // Once a scene has played (then exited, parked, or lost the slot), the still `after` art stands
    // in — never the animated, cued fallback a second time.
    body = <div className="h-scenehost__fallback">{after}</div>;
  } else if (wants && covered) {
    // Waiting behind a ceremony for its turn: the quiet stand-in, not the animated (and cued) 2D.
    body = <div className="h-scenehost__fallback">{loading ?? fallback}</div>;
  } else {
    body = <div className="h-scenehost__fallback">{fallback}</div>;
  }

  return (
    <div
      ref={box}
      className={cx('h-scenehost', piece && `h-scenehost--${piece}`, className)}
      role="img"
      aria-label={label}
      style={box3d}
      data-scene={state}
      data-scene-ready={mounted && ready ? 'true' : undefined}
      data-scene-reason={failed ?? undefined}
    >
      {body}
    </div>
  );
}
