/**
 * three/scenes.ts — the four Rapier scenes as module-scope React.lazy chunks, plus warm-up.
 *
 * Nothing loads until a SceneHost decides a scene may mount (capable device, Effects not Off, no round
 * live) — never on first paint. A screen that knows a set piece is coming (the last route card, a
 * ceremony about to open) may call `preloadSetPiece('pile')` to fetch the chunk early; it does not
 * start WebGL or Rapier.
 */
import { lazy } from 'react';
import type { SetPiece } from './runtime';

const importers = {
  tijori: () => import('./tijori-scene'),
  tarazu: () => import('./tarazu-scene'),
  thappa: () => import('./thappa-scene'),
  pile: () => import('./file-pile-scene'),
} as const;

const loaded: Partial<Record<SetPiece, boolean>> = {};

function tracked<K extends SetPiece>(piece: K) {
  const p = importers[piece]() as ReturnType<(typeof importers)[K]>;
  p.then(
    () => {
      loaded[piece] = true;
    },
    () => undefined,
  );
  return p;
}

export const TijoriScene = lazy(() => tracked('tijori'));
export const TarazuScene = lazy(() => tracked('tarazu'));
export const ThappaScene = lazy(() => tracked('thappa'));
export const FilePileScene = lazy(() => tracked('pile'));

/** Fetch a set piece's chunk ahead of time (no WebGL, no Rapier init). Safe to call repeatedly. */
export function preloadSetPiece(piece: SetPiece | 'all'): void {
  if (typeof window === 'undefined') return;
  const list: SetPiece[] = piece === 'all' ? ['tijori', 'tarazu', 'thappa', 'pile'] : [piece];
  for (const p of list) if (!loaded[p]) void tracked(p).catch(() => undefined);
}

/** True once a set piece's chunk has arrived in this session. */
export const setPieceLoaded = (piece: SetPiece): boolean => !!loaded[piece];
