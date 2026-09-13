/**
 * The loudness ceiling, checked against measured output rather than against TRIM.
 *
 * TRIM is a gain multiplier applied to a peak that was chosen by ear, so it runs *inverse* to how
 * loud a cue was composed: `hover` carries one of the largest trims in the table and is the
 * quietest sound in the app. An assertion of the form `TRIM.loss < TRIM.win` therefore proves
 * nothing at all about what a player hears — two cues at TRIM 0.7 and 0.88 can come out in either
 * order depending on what they were composed at.
 *
 * lib/fx/sound-levels.ts holds the offline measurement (scripts/measure-cues.mjs, eight passes per
 * cue because the interaction cues randomise every trigger). Both tables are read as text: they are
 * TypeScript, and this suite is plain node:test with no build step.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const trims = () => {
  const block = read('../lib/fx/sound.ts').match(/export const TRIM[\s\S]*?\n\}\);/);
  assert.ok(block, 'TRIM table not found in lib/fx/sound.ts');
  return Object.fromEntries(
    [...block[0].matchAll(/^ {2}(\w+): ([\d.]+),/gm)].map((m) => [m[1], Number(m[2])]),
  );
};

const levels = () =>
  Object.fromEntries(
    [...read('../lib/fx/sound-levels.ts').matchAll(/^ {2}(\w+): \{ peak: ([\d.]+), rms: ([\d.]+) \}/gm)].map(
      (m) => [m[1], { peak: Number(m[2]), rms: Number(m[3]) }],
    ),
  );

const output = () => {
  const t = trims();
  const l = levels();
  return Object.fromEntries(Object.keys(l).map((cue) => [cue, l[cue].rms * t[cue]]));
};

test('every cue has both a trim and a measurement, and they agree on the cue list', () => {
  const t = Object.keys(trims()).sort();
  const l = Object.keys(levels()).sort();
  assert.deepEqual(l, t, 'lib/fx/sound-levels.ts is stale — run node scripts/measure-cues.mjs');
});

test('nothing you lost is allowed to out-shout something you won', () => {
  const db = output();
  // A loss celebration that reads as loud as a win is how a player learns to distrust the game.
  assert.ok(db.loss < db.win, `loss ${db.loss} !< win ${db.win}`);
  assert.ok(db.kept < db.win, `kept ${db.kept} !< win ${db.win}`);
  assert.ok(db.draw <= db.win, `draw ${db.draw} > win ${db.win}`);
});

test('the interaction cues sit below every reward cue', () => {
  const db = output();
  // tap fires hundreds of times a session. If it lands anywhere near the reward band the rewards
  // stop being events.
  const rewards = ['win', 'levelUp', 'stamp', 'unlock', 'gem', 'quest', 'streak', 'correct'];
  for (const press of ['tap', 'select', 'hover', 'detent', 'tick'])
    for (const reward of rewards)
      assert.ok(db[press] < db[reward], `${press} ${db[press]} !< ${reward} ${db[reward]}`);
});

test('no cue clips at master gain 1', () => {
  const t = trims();
  const l = levels();
  for (const [cue, m] of Object.entries(l))
    assert.ok(m.peak * t[cue] < 1, `${cue} peaks at ${(m.peak * t[cue]).toFixed(3)}`);
});

test('the three rebuilt interaction cues hit their measured loudness targets', () => {
  const db = output();
  const dbfs = (v) => 20 * Math.log10(v);
  // The bands the rebuild was designed to: a soft dry "tok", a confirmation, and a bare tick.
  assert.ok(dbfs(db.tap) > -27 && dbfs(db.tap) < -23, `tap at ${dbfs(db.tap).toFixed(1)} dBFS`);
  assert.ok(dbfs(db.select) > -25 && dbfs(db.select) < -20, `select at ${dbfs(db.select).toFixed(1)} dBFS`);
  for (const tick of ['hover', 'detent'])
    assert.ok(dbfs(db[tick]) > -40 && dbfs(db[tick]) < -33, `${tick} at ${dbfs(db[tick]).toFixed(1)} dBFS`);
});

test('the switch tick is neutral: detent and hover are the same cue at the same level', () => {
  // The conviction switch must not pay you for picking the riskiest tier, so its cue carries no
  // per-tier variation of any kind — it is literally the same builder as `hover`.
  const src = readFileSync(new URL('../lib/fx/sound.ts', import.meta.url), 'utf8');
  assert.match(src, /\n {2}hover: tick,\n {2}detent: tick,\n/);
  const db = output();
  assert.ok(Math.abs(20 * Math.log10(db.detent / db.hover)) < 2, 'detent and hover differ by > 2 dB');
});
