// Landed-conviction heat: the one number the brain hero pulses on. Pure and three-free on purpose, so
// the hero, its text twin and the tests share a single definition, and so the shader layer never has to
// reach into a profile to get it. Same honesty stance as lib/progression.mjs — this is decoration
// derived from calls that have already resolved, never a score and never a live position.
import { CONVICTION_WINDOW, convictionRating } from './progression.mjs';

// The only codes that count are the ones for a call above Steady that came off. A pending stake, the
// tier currently selected on the card in front of the player and an unanswered card are all
// structurally unreachable from here, which is how C10 is enforced rather than promised — and a missed
// call is not merely ignored, it drags the rating term down, so nothing here can be raised by losing.
const LANDED = Object.freeze(['b1', 'c1']);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const tallied = (t) => !!t && Number.isFinite(t.n) && Number.isFinite(t.correct);

/** How many of the last CONVICTION_WINDOW resolved expedition answers were above Steady AND correct. */
export function landedRecent(prog) {
  const recent = prog?.conviction?.recent;
  // R4 in the small: the reducer and the sanitiser both cap `recent` at CONVICTION_WINDOW, so the
  // reader caps it too. An over-long hand-edited ring would otherwise let the text twin claim more
  // landed calls than the window it names.
  const codes = (Array.isArray(recent) ? recent : []).slice(-CONVICTION_WINDOW);
  return { landed: codes.filter((c) => LANDED.includes(c)).length, window: CONVICTION_WINDOW };
}

/**
 * 0..1, weighted 60/40 between the recent window and the badge's own rating. The window is what moves
 * inside a run, so the brain speeds up as calls land; a miss adds no landed code and costs rating, so
 * it can only ever cool. The rating sets the floor that movement starts from, spanning the neutral
 * 1000 baseline to 1800 — past Dead eye's 1700 floor, so the top of the badge still has room to push.
 */
export function convictionHeat(prog) {
  const { landed, window } = landedRecent(prog);
  const c = prog?.conviction;
  // A profile written before the conviction block existed — or one hand-edited past the sanitiser —
  // has no tallies to rate, so the rating term rests at the value convictionRating() itself returns
  // with nothing called. A profile missing the block entirely therefore reads as 0 heat, not a throw.
  const rating = tallied(c?.steady) && tallied(c?.bold) && tallied(c?.called) ? convictionRating(c) : 1000;
  const progress = clamp01((rating - 1000) / 800);
  return clamp01(0.6 * (landed / window) + 0.4 * progress);
}
