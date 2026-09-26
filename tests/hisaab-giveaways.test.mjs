/**
 * HISAAB DO — no cross-item answer giveaways.
 *
 * Runs the detector in scripts/hisaab-giveaways.mjs against the live bank. Every pair it finds (an item
 * whose distinctive correct answer appears word for word in another same-subject item's text) must sit on
 * one of the editor groups' reviewed-false-positive lists (merged into REVIEWED_OK in the script). A real
 * giveaway is fixed by rewording the leaking text, never by listing it. Reviewed entries that no longer
 * match anything are stale and should be pruned. The detector takes ~15 s, so it is spawned once.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/hisaab-giveaways.mjs', import.meta.url));

test('giveaway detector: no unreviewed pair remains and no reviewed entry is stale', () => {
  const r = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const out = `${r.stdout}\n${r.stderr}`;
  const summary = /(\d+) giveaway pairs across (\d+) items: (\d+) reviewed as false positives, (\d+) unreviewed/.exec(r.stdout);
  assert.ok(summary, `detector printed no summary line\n${out}`);
  const [, total, itemCount, reviewed, unreviewed] = summary.map(Number);
  assert.ok(itemCount > 0, 'detector scanned the bank');
  assert.equal(reviewed + unreviewed, total);
  const leaks = r.stdout.split('\n').filter((l) => / gives away /.test(l)).map((l) => l.trim());
  assert.deepEqual(leaks, [], 'reword the leaking text; never add a real giveaway to a REVIEWED_OK list');
  assert.equal(unreviewed, 0, out);
  assert.equal(r.status, 0, `detector exited ${r.status}\n${out}`);
  assert.doesNotMatch(r.stdout, /stale reviewed entries/, 'prune reviewed entries that no longer match');
});
