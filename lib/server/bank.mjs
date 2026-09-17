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
import { CRICKET_INDIA_1 } from './questions/cricket-india-1.mjs';
import { CRICKET_INDIA_2 } from './questions/cricket-india-2.mjs';
import { CRICKET_INDIA_3 } from './questions/cricket-india-3.mjs';
import { CRICKET_INDIA_4 } from './questions/cricket-india-4.mjs';
import { CRICKET_INDIA_5 } from './questions/cricket-india-5.mjs';
import { CRICKET_INDIA_6 } from './questions/cricket-india-6.mjs';
import { CRICKET_INDIA_7 } from './questions/cricket-india-7.mjs';
import { CRICKET_INDIA_8 } from './questions/cricket-india-8.mjs';
import { CRICKET_INDIA_9 } from './questions/cricket-india-9.mjs';
import { CRICKET_INDIA_10 } from './questions/cricket-india-10.mjs';
import { enabledOnly } from '../content.mjs';

/**
 * The five sport banks, authored 16 September 2026 — sixty questions per sport (cricket fifty-nine
 * after QA), twenty per difficulty, every fact checked against a fetched source and the whole set
 * validated by a separate QA pass (schema, uniqueness across all files, reachable sources,
 * difficulty balance, spot-checked extremes). tests/bank.test.mjs keeps that contract. The Indian
 * cricket bank below adds five hundred more on 17 September 2026.
 */
/**
 * The Indian cricket bank, authored 17 September 2026 in ten themed tranches of fifty (origins to
 * 1971, 1972–88, 1989–99, 2000–07, 2008–13, 2014–19, 2020–26, the IPL, women's cricket history,
 * records/grounds/domestic/controversies), every fact checked against a fetched page by its author
 * and validated to the same schema. Ids cr100–cr599.
 */
const CRICKET_INDIA = [
  CRICKET_INDIA_1,
  CRICKET_INDIA_2,
  CRICKET_INDIA_3,
  CRICKET_INDIA_4,
  CRICKET_INDIA_5,
  CRICKET_INDIA_6,
  CRICKET_INDIA_7,
  CRICKET_INDIA_8,
  CRICKET_INDIA_9,
  CRICKET_INDIA_10,
].flat();

const SPORT_BANKS = [FOOTBALL, CRICKET, CRICKET_INDIA, BASEBALL, FORMULA_1, BASKETBALL];

/** Every question the repo carries, regardless of whether the product shows it. */
export const ALL_QUESTIONS = Object.freeze([...SAMPLE, ...SPORT_BANKS.flat()]);

/** What the product serves. Frozen, filtered, and the only export the duel service should use. */
export const QUESTIONS = Object.freeze(enabledOnly(ALL_QUESTIONS));

/** How many the filter hid, for the catalogue and for anyone wondering where the science went. */
export const HIDDEN_COUNT = ALL_QUESTIONS.length - QUESTIONS.length;
