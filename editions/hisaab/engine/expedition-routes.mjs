/**
 * editions/hisaab/engine/expedition-routes.mjs — the edition's stand-in for lib/expedition-routes.mjs.
 *
 * The build aliases the JHK route catalogue to this module, so lib/expeditions.mjs — validation,
 * the run reducer, scoring, readExpeditions — runs the edition's routes unchanged, and the duel
 * service's `expedition` action deals their cards from the civics bank. The routes are derived from
 * the served bank on load (engine/routes.mjs), so they grow as lanes are registered.
 */
import { QUESTIONS } from '../server/bank.mjs';
import { routeCatalogue } from './routes.mjs';

/**
 * The live routes, then a retired stub (domain 'retired', no cards) for every other route id the bank
 * could produce, so a finished file's record is never dropped when a bank edit retires or regroups its
 * route. ACTIVE_EXPEDITIONS (enabled domains only) is exactly `deriveRoutes(QUESTIONS)`.
 */
export const EXPEDITIONS = routeCatalogue(QUESTIONS);
