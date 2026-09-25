/**
 * editions/hisaab/node-aliases.mjs — the edition's alias table as a node module-resolution hook.
 *
 * Tests load the edition's module graph by registering this file before importing anything shared:
 *
 *   import { register } from 'node:module';
 *   register('../editions/hisaab/node-aliases.mjs', import.meta.url);
 *   const { dispatch } = await import('../lib/server/duel-service.mjs'); // deals from the civics bank
 *
 * Static imports are evaluated before `register` runs, so anything that must see the edition graph is
 * imported dynamically after it. Each test file runs in its own process, so JHK tests are unaffected.
 */
import { EDITION_ALIASES } from './aliases.mjs';

const root = new URL('../../', import.meta.url);
const table = new Map(EDITION_ALIASES.map((a) => [new URL(a.from, root).href, new URL(a.to, root).href]));

export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  const target = table.get(result.url);
  if (!target || context.parentURL === target) return result;
  return { ...result, url: target, shortCircuit: true };
}
