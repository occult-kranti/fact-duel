#!/usr/bin/env node
// Validate one or more HISAAB DO bank lane files against the charter contract.
//
//   node scripts/hisaab-validate.mjs editions/hisaab/bank/schemes.mjs [more files…]
//
// Prints each problem and a per-lane summary (count, difficulty, kind, state, govt spread), and
// exits 1 when anything is wrong. With no arguments it checks every lane in the bank directory.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkBank } from '../editions/hisaab/bank/schema.mjs';

const dir = path.resolve('editions/hisaab/bank');
const SKIP = new Set(['schema.mjs', 'index.mjs']);
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(dir).filter((f) => f.endsWith('.mjs') && !SKIP.has(f)).map((f) => path.join(dir, f));

const lanes = {};
for (const file of files) {
  const mod = await import(pathToFileURL(path.resolve(file)).href);
  const arrays = Object.values(mod).filter(Array.isArray);
  if (arrays.length !== 1) {
    console.error(`${file}: expected exactly one exported array, found ${arrays.length}`);
    process.exitCode = 1;
    continue;
  }
  lanes[path.basename(file, '.mjs')] = arrays[0];
}

const tally = (items, key) =>
  Object.entries(items.reduce((acc, q) => ((acc[q[key]] = (acc[q[key]] ?? 0) + 1), acc), {}))
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k}:${n}`)
    .join(' ');

for (const [name, items] of Object.entries(lanes)) {
  console.log(`\n${name}: ${items.length} items`);
  console.log(`  difficulty ${tally(items, 'difficulty')}`);
  console.log(`  kind       ${tally(items, 'kind')}`);
  console.log(`  state      ${tally(items, 'state')}`);
  console.log(`  govt       ${tally(items, 'govt')}`);
  console.log(`  topic      ${tally(items, 'topic')}`);
  console.log(`  answer     ${[0, 1, 2, 3].map((i) => items.filter((q) => q.correctIndex === i).length).join('/')}`);
}

const problems = checkBank(lanes);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exitCode = 1;
} else {
  console.log('\nOK — no problems.');
}
