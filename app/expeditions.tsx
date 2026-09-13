'use client';
/**
 * Public entry for the Expeditions module. The screens live in `app/screens/expeditions/`;
 * this barrel keeps the historic import paths working:
 *
 *   import Expeditions, { Clubhouse, ExpeditionCase, RouteRail, ExpeditionStamp, EpisodeCard }
 *     from './expeditions';
 *
 * Styles: `app/expeditions.css` (imported once from app/layout.tsx with the other sheets).
 */
export { default } from './screens/expeditions';
export type { ExpeditionsProps } from './screens/expeditions';
export { Clubhouse } from './screens/expeditions/clubhouse';
export {
  EpisodeCard,
  ExpeditionCase,
  ExpeditionStamp,
  RouteArt,
  RouteRail,
  ScoringCards,
  signed,
} from './screens/expeditions/parts';
