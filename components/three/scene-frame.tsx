'use client';
import { Canvas, useFrame, type CanvasProps, type RootState } from '@react-three/fiber';
import type { WebGLRendererParameters } from 'three';
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
  type CSSProperties,
  type ReactNode,
} from 'react';
import { SceneSkeleton, cssSize, type LazySceneProps } from './lazy-scene';
import { usePrefersReducedMotion } from './reduced-motion';

export { lazyScene, SceneSkeleton } from './lazy-scene';
export type { LazySceneProps } from './lazy-scene';

export interface SceneState {
  /** Container intersects the viewport and the document is visible: the loop runs. */
  active: boolean;
  /** prefers-reduced-motion: scenes pose a designed static frame and skip animation. */
  reduced: boolean;
  /** Container intersects the viewport (ignores document visibility). */
  inView: boolean;
}

const SceneContext = createContext<SceneState>({ active: true, reduced: false, inView: true });

/** Read visibility / reduced-motion state from inside a scene. */
export const useSceneState = () => useContext(SceneContext);

let webglSupport: boolean | null = null;

/** Cached WebGL capability probe (creates one throw-away context on first call). */
export function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    webglSupport = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

export interface SceneFrameProps extends LazySceneProps {
  children: ReactNode;
  /** Device pixel ratio clamp. Default [1, 1.5]. */
  dpr?: [number, number];
  camera?: CanvasProps['camera'];
  /** Extra WebGLRenderer parameters merged over the low-power defaults. */
  gl?: Omit<WebGLRendererParameters, 'canvas'>;
  /** Accessible description; the box becomes role="img". */
  label?: string;
  /** ACES tone-mapping exposure. Default 1.1. */
  exposure?: number;
  /** Pointer events reach the scene (parallax, taps). Default true. */
  interactive?: boolean;
  /** Called once the first frame has been drawn. */
  onReady?: () => void;
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function FirstFrame({ onFrame }: { onFrame: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onFrame();
  });
  return null;
}

/**
 * Client-only wrapper around an R3F Canvas: WebGL detection, reduced-motion
 * static frame, IntersectionObserver + document-visibility pausing, low-power
 * renderer defaults, loading skeleton, error boundary -> fallback, disposal on
 * unmount (R3F force-loses the context and disposes the scene graph).
 */
export function SceneFrame({
  children,
  fallback,
  height,
  className,
  style,
  dpr = [1, 1.5],
  camera,
  gl,
  label,
  exposure = 1.1,
  interactive = true,
  onReady,
}: SceneFrameProps) {
  const box = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;

  const reduced = usePrefersReducedMotion();
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    alive.current = true;
    setWebgl(supportsWebGL());
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (entry) setInView(entry.isIntersecting);
        },
        { threshold: 0.02, rootMargin: '48px' },
      );
      observer.observe(el);
    }
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const active = inView && pageVisible;
  const frameloop: CanvasProps['frameloop'] = !active ? 'never' : reduced ? 'demand' : 'always';
  const sceneState = useMemo<SceneState>(() => ({ active, reduced, inView }), [active, reduced, inView]);

  const handleCreated = useCallback(
    (state: RootState) => {
      state.gl.toneMappingExposure = exposure;
      const canvas = state.gl.domElement;
      canvas.style.touchAction = 'pan-y';
      canvas.addEventListener('webglcontextlost', () => {
        if (alive.current) setFailed(true);
      });
    },
    [exposure],
  );

  const handleFirstFrame = useCallback(() => {
    if (!alive.current) return;
    setPainted(true);
    readyCallback.current?.();
  }, []);

  const glParams = useMemo<CanvasProps['gl']>(
    () => ({ antialias: true, powerPreference: 'low-power', alpha: true, ...gl }),
    [gl],
  );

  const showFallback = webgl === false || failed;
  const boxStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: cssSize(height),
    overflow: 'hidden',
    touchAction: 'pan-y',
    ...style,
  };

  return (
    <div
      ref={box}
      className={className}
      style={boxStyle}
      role={label ? 'img' : undefined}
      aria-label={label}
      data-scene-frame={showFallback ? 'fallback' : painted ? 'ready' : 'loading'}
    >
      {showFallback ? (
        (fallback ?? <SceneSkeleton overlay quiet />)
      ) : webgl ? (
        <SceneErrorBoundary onError={() => alive.current && setFailed(true)}>
          <Suspense fallback={null}>
            <Canvas
              dpr={dpr}
              gl={glParams}
              frameloop={frameloop}
              camera={camera}
              flat={false}
              shadows={false}
              resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
              style={{ position: 'absolute', inset: 0, pointerEvents: interactive ? 'auto' : 'none' }}
              onCreated={handleCreated}
            >
              <SceneContext.Provider value={sceneState}>
                {children}
                <FirstFrame onFrame={handleFirstFrame} />
              </SceneContext.Provider>
            </Canvas>
          </Suspense>
        </SceneErrorBoundary>
      ) : null}
      {!showFallback && <SceneSkeleton overlay hidden={painted} />}
    </div>
  );
}
