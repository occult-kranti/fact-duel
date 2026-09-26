/**
 * three/runtime.ts — the small, three-free half of the set pieces: the contract between SceneHost and a
 * lazy scene, the capability probes, and a tiny stats store the lab reads. Nothing here imports three,
 * fiber or rapier, so the main bundle can use it without pulling the 3D chunk.
 */
import { getPrefs, systemReducedMotion } from '@/lib/fx/prefs';

/** Which set piece a host carries (sets the default box height; bible §10). */
export type SetPiece = 'tijori' | 'tarazu' | 'thappa' | 'pile';

/**
 * What SceneHost hands every lazy scene on top of its own props.
 *  - `reduced`: step the world to rest off-screen, draw one frame, then only redraw on resize/theme.
 *  - `settled`: a re-mount (it scrolled away and back): start at the final state, no drop.
 *  - `cues`: play the sound/haptic twins (callers that already cue the moment pass false).
 *  - `onReady` after the first painted frame; `onFail` on context loss or a thrown scene (→ 2D);
 *    `onExit` when a scene is done and wants to leave (THAPPA's ≤ 1.4 s canvas).
 */
export type SceneRuntime = {
  reduced: boolean;
  settled: boolean;
  cues: boolean;
  onReady: () => void;
  onFail: (reason: string) => void;
  onExit: () => void;
};

export type Capability = { ok: boolean; reason: string };

/** Effects not Off, no Save-Data, enough memory. (WebGL is probed after paint by the host.) */
export function sceneCapability(): Capability {
  if (typeof window === 'undefined') return { ok: false, reason: 'server' };
  const prefs = getPrefs();
  if (prefs.motion === 'off') return { ok: false, reason: 'effects-off' };
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return { ok: false, reason: 'save-data' };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return { ok: false, reason: 'low-memory' };
  return { ok: true, reason: 'ok' };
}

/** Effects = Reduced, or the OS asks for less motion: 3D shows one settled frame (bible §6, §10). */
export function sceneReduced(): boolean {
  if (typeof window === 'undefined') return true;
  return getPrefs().motion !== 'full' || systemReducedMotion();
}

let webgl: boolean | null = null;

/** Cached WebGL probe: one throw-away context, released at once. Call after paint, never in render. */
export function probeWebGL(): boolean {
  if (webgl !== null) return webgl;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ?? (canvas.getContext('webgl') as WebGLRenderingContext | null);
    webgl = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

// ---- Stats (rough frame timing for the lab; bible §10 budgets) ----------------------------------------

export type SceneStats = {
  piece: SetPiece;
  /** Mount → first painted frame (includes the lazy chunk and the Rapier WASM on a cold start). */
  firstFrameMs: number;
  /** First frame → freeze (the animation's length). */
  settleMs: number | null;
  /** Reduced motion / settled re-mount: the off-screen "step to rest" (bible: ≤ 180 steps, < 30 ms). */
  restMs: number | null;
  frames: number;
  /** JS per frame (physics step + scene logic + three's render submission), averaged / worst. */
  jsAvgMs: number;
  jsMaxMs: number;
  /** rAF interval while animating, averaged / worst. */
  frameAvgMs: number;
  frameMaxMs: number;
  drawCalls: number;
  triangles: number;
  bodies: number;
  dpr: number;
};

type Listener = () => void;
const stats = new Map<SetPiece, SceneStats>();
const listeners = new Set<Listener>();

export const threeStats = {
  get: (piece: SetPiece) => stats.get(piece) ?? null,
  all: () => Array.from(stats.values()),
  put(piece: SetPiece, patch: Partial<SceneStats>) {
    const prev = stats.get(piece) ?? {
      piece,
      firstFrameMs: 0,
      settleMs: null,
      restMs: null,
      frames: 0,
      jsAvgMs: 0,
      jsMaxMs: 0,
      frameAvgMs: 0,
      frameMaxMs: 0,
      drawCalls: 0,
      triangles: 0,
      bodies: 0,
      dpr: 1,
    };
    stats.set(piece, { ...prev, ...patch });
    for (const fn of Array.from(listeners)) fn();
  },
  reset(piece: SetPiece) {
    stats.delete(piece);
    for (const fn of Array.from(listeners)) fn();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
