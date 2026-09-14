'use client';
/**
 * app/screens/home/hero-stage.tsx — the Knowledge Core hero.
 * The 3D object is client-only and level-driven; `/art/rivalry-stage.webp` is both the poster that
 * holds the box while the chunk loads and the fallback when WebGL is missing or the context dies.
 * The brain wakes on breadth rather than grind, and every claim its pulse makes is also written
 * here in words: a beat rate is not readable by everyone, and under reduced motion there is no
 * beat at all.
 */
import { LazyHeroOrb } from '@/components/three';
import { useReducedMotion } from '@/components/fx';
import { CONVICTION_CODES, CONVICTION_WINDOW, MODES } from '@/lib/progression.mjs';
import { convictionHeat, landedRecent } from '@/lib/heat.mjs';

const STAGE_ART = '/art/rivalry-stage.webp';
const STAGE_ALT = 'Floodlit arena stage: a lightning token and a sports sphere in luminous orbits';

/** Four of the six ways to play. Breadth is reachable in one session and teaches the whole app. */
const WAKE_MODES = 4;
const SPELLED = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];

/**
 * Only the corner of the progression record this screen reads, and every field is optional: a
 * profile written before the conviction block existed still loads, and it renders the locked
 * state rather than throwing.
 */
export type HeroProgression = {
  counters?: {
    byMode?: Record<string, { played?: number } | undefined>;
    expeditions?: number;
    discoveries?: number;
    eventModes?: number;
  };
  conviction?: unknown;
};

const once = (n: unknown) => (typeof n === 'number' && n > 0 ? 1 : 0);

/**
 * Distinct modes played, 0..6 — the duel modes plus expeditions, discoveries and limited-time
 * modes. The duel ids come off the exported `MODES` array rather than a local list, so a mode
 * added to the engine is counted here without anyone remembering to come back.
 */
function countModes(prog?: HeroProgression): number {
  const counters = prog?.counters;
  if (!counters) return 0;
  const duels = MODES.reduce((n: number, mode: string) => n + once(counters.byMode?.[mode]?.played), 0);
  return duels + once(counters.expeditions) + once(counters.discoveries) + once(counters.eventModes);
}

/**
 * The denominator the text twin is allowed to name. `landedRecent` reports the fixed
 * CONVICTION_WINDOW, which is the right divisor for the pulse but a claim about twenty resolved calls
 * that a profile four duel modes deep has never made — the brain wakes on breadth, not on expeditions.
 * So the sentence counts the codes that actually exist, whitelisted and capped exactly as the reducer
 * and the sanitiser cap the ring, and it can never name a scope the record does not hold.
 */
function resolvedCalls(prog?: HeroProgression): number {
  const recent = (prog?.conviction as { recent?: unknown } | undefined)?.recent;
  const codes = Array.isArray(recent) ? recent : [];
  return codes.filter((c) => CONVICTION_CODES.includes(c)).slice(-CONVICTION_WINDOW).length;
}

export function HeroStage({
  level,
  accent,
  progression,
}: {
  level: number;
  accent: string;
  progression?: HeroProgression;
}) {
  const reduced = useReducedMotion();
  const modesPlayed = countModes(progression);
  const awake = modesPlayed >= WAKE_MODES;
  // Decoration derived from calls that already resolved and came off. The tier selected on the card
  // in front of the player, and any unanswered card, are unreachable from here by construction.
  const heat = convictionHeat(progression);
  const { landed } = landedRecent(progression);
  const resolved = resolvedCalls(progression);

  /* The text twin. It names the number, its denominator and its scope, and it stays true when the
     brain is a still frame — which is exactly the state the pulse cannot speak for. The locked
     line carries its own explanation instead of hiding one in a `title`, which no touch device
     shows and no rotor reaches. */
  const note = awake
    ? resolved === 0
      ? 'No expedition calls resolved yet — the count starts with your first call above Steady that lands.'
      : `${landed} of your last ${resolved} expedition ${resolved === 1 ? 'call' : 'calls'} landed above Steady`
    : `Four of the six ways to play wakes it. ${
        modesPlayed === 0 ? 'You have not played any yet.' : `You have played ${SPELLED[modesPlayed]}.`
      }`;

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
      {/* `label` is deliberately left off: hero-orb writes the state-appropriate sentence from the
          same reduced-motion read SceneFrame uses to decide whether the scene animates, so what a
          screen reader is told and what moves on the glass cannot drift apart. */}
      <LazyHeroOrb
        level={level}
        accent={accent}
        parallax={!reduced}
        modesPlayed={modesPlayed}
        heat={heat}
        height="var(--fd-orb-h)"
        fallback={
          <img className="fd-hub-hero-fallback" src={STAGE_ART} alt={STAGE_ALT} width="1672" height="941" />
        }
      />
      <span className="fd-hub-hero-badge fd-mono">LV {level}</span>
      <span className="fd-hub-hero-chip fd-mono" data-state={awake ? 'awake' : 'locked'}>
        {awake ? 'BRAIN AWAKE' : `BRAIN ${modesPlayed}/${WAKE_MODES}`}
      </span>
      <p className="fd-hub-hero-note">{note}</p>
    </div>
  );
}
