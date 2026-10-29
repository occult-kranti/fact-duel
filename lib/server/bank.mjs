// Server-only. The question bank the game actually serves: every editorial file, assembled, then cut
// down to the enabled content domains. Never import this from client components.
//
// `questions.mjs` is the original reviewed sample and stays untouched; the per-sport files are the
// editorial archive. Domain visibility and question curation are applied together at this boundary,
// so retired rules/basic cards cannot leak through practice, expeditions, catalogue or mode duels.
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
import { CRICKET_SPICY } from './questions/cricket-spicy.mjs';
import { curatedQuestions } from './question-curation.mjs';

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

const SPORT_BANKS = [FOOTBALL, CRICKET, CRICKET_INDIA, CRICKET_SPICY, BASEBALL, FORMULA_1, BASKETBALL];

/** Every question the repo carries, regardless of whether the product shows it. */
export const ALL_QUESTIONS = Object.freeze([...SAMPLE, ...SPORT_BANKS.flat()]);

/** What the product serves. Frozen, filtered, and the only export the duel service should use. */
export const QUESTIONS = Object.freeze(curatedQuestions(enabledOnly(ALL_QUESTIONS)));

/** Domain-hidden plus editorially retired cards; the complete source archive remains available. */
export const HIDDEN_COUNT = ALL_QUESTIONS.length - QUESTIONS.length;
