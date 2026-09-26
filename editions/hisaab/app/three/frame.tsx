/**
 * three/frame.tsx — HFrame, the canvas every set piece draws in (lazy chunk only; imports fiber).
 *
 * Modelled on components/three/scene-frame.tsx, restyled for LAL FEETA and tightened for the budgets:
 *  - dpr [1, 1.5], low-power context, transparent canvas (the page's paper shows through), flat colour
 *    (no tone mapping), pointer-events none (the set pieces are pictures of numbers, not toys);
 *  - pauses offscreen and in a hidden tab (IntersectionObserver + visibilitychange → frameloop 'never');
 *  - frameloop 'always' only while something moves; `stage.freeze()` → 'demand' (redraws only on resize
 *    or a theme change). Reduced motion and settled re-mounts start in 'demand': one frame;
 *  - WebGL context loss or a thrown scene → runtime.onFail → SceneHost shows the 2D art;
 *  - token colours are read from CSS (`--h-…`) on the box and re-read when the theme flips, so no hex
 *    lives in code and dark mode follows live;
 *  - rough stats (JS per frame, rAF interval, draw calls, triangles) for the lab.
 */
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import {
  Component,
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { threeStats, type SceneRuntime, type SetPiece } from './runtime';

// ---- Tokens ------------------------------------------------------------------------------------------

export type Tokens = {
  /** A token's colour (sRGB string from CSS → THREE.Color in the working space). */
  color: (name: string) => THREE.Color;
  /** A token's raw computed value ('' when missing). */
  raw: (name: string) => string;
  version: number;
};

function readTokens(el: HTMLElement | null, version: number): Tokens {
  const style = el ? getComputedStyle(el) : null;
  const cache = new Map<string, string>();
  const raw = (name: string) => {
    let v = cache.get(name);
    if (v === undefined) {
      v = style ? style.getPropertyValue(name).trim() : '';
      cache.set(name, v);
    }
    return v;
  };
  const color = (name: string) => {
    const v = raw(name);
    const c = new THREE.Color();
    try {
      c.setStyle(v || 'gray');
    } catch {
      c.setStyle('gray');
    }
    return c;
  };
  return { raw, color, version };
}

/** Re-read tokens whenever <html data-theme> changes or the OS scheme flips. */
function useTokenVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((n) => n + 1);
    const mo = new MutationObserver(bump);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', bump);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', bump);
    };
  }, []);
  return v;
}

// ---- Stage context --------------------------------------------------------------------------------------

export type Stage = {
  piece: SetPiece;
  /** In view and the tab is visible: the loop may run. */
  active: boolean;
  reduced: boolean;
  settled: boolean;
  cues: boolean;
  frozen: boolean;
  /** Stop the loop: frameloop → 'demand' (one more frame is drawn). */
  freeze: () => void;
  /** THAPPA: the canvas is done; the host unmounts it and leaves the 2D stamp. */
  exit: () => void;
  /** Give up on 3D (the host shows the 2D art). */
  fail: (reason: string) => void;
  tokens: Tokens;
};

const StageContext = createContext<Stage | null>(null);

export function useStage(): Stage {
  const s = useContext(StageContext);
  if (!s) throw new Error('useStage() outside <HFrame>');
  return s;
}

// ---- Pieces inside the canvas ----------------------------------------------------------------------------

function FirstFrame({ onFrame }: { onFrame: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    // After this frame reaches the screen.
    requestAnimationFrame(() => onFrame());
  });
  return null;
}

type Acc = { frames: number; js: number; jsMax: number; gap: number; gapMax: number; last: number; start: number };

/** Rough per-frame cost: JS from the first useFrame to the end of three's render call, and rAF gaps. */
function Meter({ piece, frozen }: { piece: SetPiece; frozen: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const acc = useRef<Acc>({ frames: 0, js: 0, jsMax: 0, gap: 0, gapMax: 0, last: 0, start: 0 });
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;

  useEffect(() => {
    const prev = scene.onAfterRender;
    scene.onAfterRender = () => {
      const a = acc.current;
      if (!a.start) return;
      const js = performance.now() - a.start;
      a.start = 0;
      if (frozenRef.current) return;
      a.frames++;
      a.js += js;
      a.jsMax = Math.max(a.jsMax, js);
      if (a.frames % 10 === 1) {
        threeStats.put(piece, {
          frames: a.frames,
          jsAvgMs: a.js / a.frames,
          jsMaxMs: a.jsMax,
          frameAvgMs: a.frames > 1 ? a.gap / (a.frames - 1) : 0,
          frameMaxMs: a.gapMax,
          drawCalls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          dpr: gl.getPixelRatio(),
        });
      }
    };
    return () => {
      scene.onAfterRender = prev;
    };
  }, [gl, scene, piece]);

  useFrame(() => {
    const a = acc.current;
    const now = performance.now();
    if (a.last && !frozenRef.current) {
      const gap = now - a.last;
      if (gap < 1000) {
        a.gap += gap;
        a.gapMax = Math.max(a.gapMax, gap);
      }
    }
    a.last = now;
    a.start = now;
  }, -1000);

  // Final numbers once frozen (draw calls of the settled frame).
  useEffect(() => {
    if (!frozen) return;
    const a = acc.current;
    threeStats.put(piece, {
      frames: a.frames,
      jsAvgMs: a.frames ? a.js / a.frames : 0,
      jsMaxMs: a.jsMax,
      frameAvgMs: a.frames > 1 ? a.gap / (a.frames - 1) : 0,
      frameMaxMs: a.gapMax,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      dpr: gl.getPixelRatio(),
    });
  }, [frozen, gl, piece]);
  return null;
}

/** Redraw once after a theme flip (the scenes recolour their materials in effects that run first). */
function Redraw({ on }: { on: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [on, invalidate]);
  return null;
}

class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
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

// ---- HFrame -----------------------------------------------------------------------------------------------

export type HFrameProps = {
  piece: SetPiece;
  runtime: SceneRuntime;
  /** Initial camera (FitCamera moves it to fit the stage). */
  camera: { fov: number; position: [number, number, number]; near?: number; far?: number };
  children: ReactNode;
  className?: string;
};

export function HFrame({ piece, runtime, camera, children, className }: HFrameProps) {
  const box = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const mountAt = useRef(0);
  const firstAt = useRef(0);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const [boxEl, setBoxEl] = useState<HTMLDivElement | null>(null);
  const version = useTokenVersion();
  const tokens = useMemo(() => readTokens(boxEl ?? (typeof document !== 'undefined' ? document.documentElement : null), version), [boxEl, version]);
  const { onFail, onReady, onExit } = runtime;

  useEffect(() => {
    alive.current = true;
    mountAt.current = performance.now();
    threeStats.reset(piece);
    setBoxEl(box.current);
    return () => {
      alive.current = false;
    };
  }, [piece]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1];
          if (e) setInView(e.isIntersecting);
        },
        { threshold: 0, rootMargin: '64px' },
      );
      io.observe(el);
    }
    const onVis = () => setPageVisible(document.visibilityState !== 'hidden');
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const active = inView && pageVisible;
  const calm = frozen || runtime.reduced || runtime.settled;
  const frameloop = !active ? 'never' : calm ? 'demand' : 'always';

  const freeze = useCallback(() => {
    if (!alive.current) return;
    setFrozen((was) => {
      if (!was && firstAt.current) threeStats.put(piece, { settleMs: performance.now() - firstAt.current });
      return true;
    });
  }, [piece]);

  const exit = useCallback(() => {
    if (alive.current) onExit();
  }, [onExit]);

  const stage = useMemo<Stage>(
    () => ({
      piece,
      active,
      reduced: runtime.reduced,
      settled: runtime.settled,
      cues: runtime.cues,
      frozen,
      freeze,
      exit,
      fail: onFail,
      tokens,
    }),
    [piece, active, runtime.reduced, runtime.settled, runtime.cues, frozen, freeze, exit, onFail, tokens],
  );

  const onCreated = useCallback(
    (state: RootState) => {
      state.gl.setClearColor(new THREE.Color(0, 0, 0), 0);
      state.gl.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        if (alive.current) onFail('context-lost');
      });
    },
    [onFail],
  );

  const onFirst = useCallback(() => {
    if (!alive.current) return;
    firstAt.current = performance.now();
    threeStats.put(piece, { firstFrameMs: firstAt.current - mountAt.current });
    onReady();
  }, [onReady, piece]);

  return (
    <div ref={box} className={className ? `h-t3__canvas ${className}` : 'h-t3__canvas'} data-frozen={frozen ? 'true' : 'false'}>
      <CanvasBoundary onError={() => alive.current && onFail('error')}>
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
          flat
          frameloop={frameloop}
          camera={{ near: 0.1, far: 80, ...camera }}
          shadows={false}
          resize={{ scroll: false, offsetSize: true, debounce: { scroll: 50, resize: 0 } }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          onCreated={onCreated}
        >
          <StageContext.Provider value={stage}>
            <Suspense fallback={null}>
              {children}
              <FirstFrame onFrame={onFirst} />
              <Meter piece={piece} frozen={frozen} />
              <Redraw on={tokens.version} />
            </Suspense>
          </StageContext.Provider>
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
