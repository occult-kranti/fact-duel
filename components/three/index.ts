'use client';
// Public entry for the 3D layer. This module must stay free of static
// three / fiber / drei / rapier imports: pages evaluate it during SSR, and the
// scenes are only ever loaded in the browser through `lazyScene`.
import { lazyScene } from './lazy-scene';
import type { HeroOrbProps } from './hero-orb';
import type { RewardMedalProps } from './reward-medal';
import type { GemVaultProps } from './gem-vault';
import type { StampCase3DProps } from './stamp-case-3d';

export { lazyScene, SceneSkeleton } from './lazy-scene';
export type { LazySceneProps } from './lazy-scene';
export { usePrefersReducedMotion, prefersReducedMotion } from './reduced-motion';
export { GemVaultFallback, DEFAULT_GEM_COLORS } from './gem-vault-fallback';
export type { GemVaultFallbackProps } from './gem-vault-fallback';
export type { HeroOrbProps } from './hero-orb';
export type { RewardMedalProps, MedalVariant, MedalTier } from './reward-medal';
export type { GemVaultProps } from './gem-vault';
export type { StampCase3DProps, StampInfo } from './stamp-case-3d';

/** Home hero "knowledge core". Client-only; renders a skeleton until the chunk lands. */
export const LazyHeroOrb = lazyScene<HeroOrbProps>(() => import('./hero-orb'));

/** Ceremony medal: 'level' | 'achievement' (tier) | 'stamp' (accent) | 'streak'. */
export const LazyRewardMedal = lazyScene<RewardMedalProps>(() => import('./reward-medal'));

/** Rapier physics gem tray; the WASM chunk loads only when this mounts. */
export const LazyGemVault = lazyScene<GemVaultProps>(() => import('./gem-vault'));

/** 3x3 route stamp case that tilts toward the pointer. */
export const LazyStampCase3D = lazyScene<StampCase3DProps>(() => import('./stamp-case-3d'));
