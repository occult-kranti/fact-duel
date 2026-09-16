/**
 * app/fixture-deal.ts — the one-shot hand-off from a fixture card to the Discovery drill.
 *
 * The Events screen arms a deal, then navigates with `go('discovery')`; Discovery peeks at it on
 * mount and clears it, so a later, ordinary drill (from Play or a quest) never inherits a fixture
 * by accident. Nothing here is persisted: a reload simply opens the plain drill, and the strip on
 * Events offers the set again. A module slot rather than a route parameter because the tab router
 * in app/arena.tsx carries no per-tab state, and this is the only screen that needs one value.
 */
export type FixtureKind = 'kickoff' | 'fulltime' | 'recap';

export type FixtureDeal = {
  eventId: string;
  kind: FixtureKind;
  /** "Kick-off set · Name" — printed as the drill's title. */
  label: string;
  topic: string;
  /** Cards the set holds, from FIXTURE_SIZE; the drill prints the real count once dealt. */
  size: number;
};

let armed: FixtureDeal | null = null;

export function armFixtureDeal(deal: FixtureDeal | null) {
  armed = deal;
}

/** The armed deal, without clearing it (a render must be pure; the clear is an effect's job). */
export function peekFixtureDeal(): FixtureDeal | null {
  return armed;
}

export function clearFixtureDeal() {
  armed = null;
}
