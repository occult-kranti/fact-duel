'use client';
/**
 * app/screens/home/hero-stage.tsx — the Knowledge Core hero.
 * The 3D orb is client-only and level-driven; `/art/rivalry-stage.webp` is both the poster that
 * holds the box while the chunk loads and the fallback when WebGL is missing or the context dies.
 */
import { LazyHeroOrb } from '@/components/three';
import { useReducedMotion } from '@/components/fx';

const STAGE_ART = '/art/rivalry-stage.webp';
const STAGE_ALT = 'Floodlit arena stage: a lightning token and a sports sphere in luminous orbits';

export function HeroStage({ level, accent }: { level: number; accent: string }) {
  const reduced = useReducedMotion();
  return (
    <div className="fd-hub-hero-stage">
      <img
        className="fd-hub-hero-poster"
        src={STAGE_ART}
        alt=""
        aria-hidden="true"
        width="1672"
        height="941"
      />
      <LazyHeroOrb
        level={level}
        accent={accent}
        parallax={!reduced}
        height="var(--fd-orb-h)"
        label={`Your knowledge core at level ${level}: it gains rings and brightness as you climb`}
        fallback={
          <img className="fd-hub-hero-fallback" src={STAGE_ART} alt={STAGE_ALT} width="1672" height="941" />
        }
      />
      <span className="fd-hub-hero-badge fd-mono">LV {level}</span>
    </div>
  );
}
