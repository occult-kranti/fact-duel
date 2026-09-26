/**
 * three/index.ts — the four physics set pieces (bible §10) and the gate they mount through.
 *
 * Every component renders its 2D art until SceneHost allows a canvas (capable device, Effects not Off,
 * no round live, WebGL), then swaps in its lazy Rapier scene (scenes.ts). Nothing here imports three,
 * fiber or rapier: those arrive with the first scene chunk, never on first paint.
 *
 * `ThreeLab` is a hidden demo of all four for #/dev/three (not linked; the integrator mounts it).
 */
import { lazy } from 'react';

export { SceneHost, sceneCapability, type SceneHostProps, type SceneComponent, type SceneRuntime, type SetPiece } from './scene-host';
export { Tijori, TijoriArt, TijoriCount, TijoriSafe, tijoriLabel, tijoriFill, type TijoriProps, type TijoriSceneProps } from './tijori';
export { Tarazu, TarazuArt, tarazuAngle, tarazuLabel, type TarazuProps, type TarazuSceneProps } from './tarazu';
export { Thappa, ThappaArt, type ThappaProps, type ThappaSceneProps } from './thappa';
export {
  FilePile,
  FilePileArt,
  FilePileCaption,
  FilePileTally,
  filePileLabel,
  filePileStamp,
  type FilePileProps,
  type FilePileSceneProps,
  type FileResult,
} from './file-pile';
export { preloadSetPiece, setPieceLoaded } from './scenes';
export { sceneReduced, threeStats, type SceneStats } from './runtime';

/** The hidden set-piece lab (ScreenProps-compatible default export) — mount at #/dev/three. */
export const ThreeLab = lazy(() => import('./lab'));
