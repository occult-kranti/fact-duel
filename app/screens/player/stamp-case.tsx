'use client';
/**
 * Stamp case — the 2D `ExpeditionCase` shelf, with the 3D case floating above it on wide screens
 * that can actually draw it. The R3F chunk is only requested at ≥ 900px with WebGL available, so
 * phones and software-only renderers never pay for it; the 2D case below is always the real record.
 */
import { LazyStampCase3D } from '@/components/three';
import { EXPEDITIONS } from '@/lib/expeditions.mjs';
import { ExpeditionCase } from '../../expeditions';
import { useMediaQuery, useWebGL } from './shared';

type Route = { id: string; key: string; domain: string; stamp: string };
const ROUTES = EXPEDITIONS as ReadonlyArray<Route>;
/* Enamel colours for the 3D discs: three.js needs literal hex, not CSS variables. */
const SPORTS = ['#ff7a2f', '#ffa45c', '#ff9a3d', '#ffc83d', '#ff7f50'];
const SCIENCE = ['#4ee1ff', '#8ef0c2', '#9d8bff', '#5ad1ff'];

export function StampCase({ player, onOpen }: { player: any; onOpen: (id: string) => void }) {
  const wide = useMediaQuery('(min-width: 900px)');
  const webgl = useWebGL();
  const stamps = ROUTES.map((route, i) => ({
    id: route.id,
    color: route.domain === 'sports' ? SPORTS[i % SPORTS.length] : SCIENCE[i % SCIENCE.length],
    earned: !!player.profile.journeys?.[route.key]?.first,
  }));
  const earned = stamps.filter((s) => s.earned).length;
  return (
    <>
      {wide && webgl && (
        <LazyStampCase3D
          className="fd-stampcase-3d"
          stamps={stamps}
          height={320}
          onSelect={onOpen}
          label={`Stamp case: ${earned} of ${stamps.length} routes stamped`}
          fallback={null}
        />
      )}
      <ExpeditionCase player={player} onOpen={onOpen} />
    </>
  );
}
