/**
 * three/index.ts — the four physics set pieces (bible §10) and the gate they mount through.
 * STUBS with FINAL props: every component renders its 2D fallback today; the three lane plugs a lazy
 * Rapier scene into each via the `scene` prop / SceneHost without changing any caller.
 */
export { SceneHost, sceneCapability, type SceneHostProps, type SceneComponent } from './scene-host';
export { Tijori, TijoriArt, tijoriLabel, tijoriFill, type TijoriProps } from './tijori';
export { Tarazu, TarazuArt, tarazuAngle, tarazuLabel, type TarazuProps } from './tarazu';
export { Thappa, ThappaArt, type ThappaProps } from './thappa';
export { FilePile, FilePileArt, filePileLabel, filePileStamp, type FilePileProps, type FileResult } from './file-pile';
