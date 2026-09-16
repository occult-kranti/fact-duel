// Server-only. The question bank the game actually serves: every editorial file, assembled, then cut
// down to the enabled content domains. Never import this from client components.
//
// `questions.mjs` is the original reviewed sample and stays untouched; the per-sport files are the
// bank the sports-only product runs on. Both are data. The one decision made here is the domain
// filter, and it is made once, at the only place the duel service reads questions from — so a hidden
// domain cannot leak through practice, expeditions, the catalogue or a mode duel, because all four
// read this list and nothing else.
import { QUESTIONS as SAMPLE } from './questions.mjs';
import { FOOTBALL } from './questions/football.mjs';
import { CRICKET } from './questions/cricket.mjs';
import { BASEBALL } from './questions/baseball.mjs';
import { FORMULA_1 } from './questions/formula-1.mjs';
import { BASKETBALL } from './questions/basketball.mjs';
import { enabledOnly } from '../content.mjs';

/**
 * The five sport banks, authored 16 September 2026 — sixty questions per sport (cricket fifty-nine
 * after QA), twenty per difficulty, every fact checked against a fetched source and the whole set
 * validated by a separate QA pass (schema, uniqueness across all files, reachable sources,
 * difficulty balance, spot-checked extremes). tests/bank.test.mjs keeps that contract.
 */
const SPORT_BANKS = [FOOTBALL, CRICKET, BASEBALL, FORMULA_1, BASKETBALL];

/** Every question the repo carries, regardless of whether the product shows it. */
export const ALL_QUESTIONS = Object.freeze([...SAMPLE, ...SPORT_BANKS.flat()]);

/** What the product serves. Frozen, filtered, and the only export the duel service should use. */
export const QUESTIONS = Object.freeze(enabledOnly(ALL_QUESTIONS));

/** How many the filter hid, for the catalogue and for anyone wondering where the science went. */
export const HIDDEN_COUNT = ALL_QUESTIONS.length - QUESTIONS.length;
