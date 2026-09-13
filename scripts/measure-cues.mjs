/**
 * scripts/measure-cues.mjs — measure every cue's true peak and RMS, and freeze the table.
 *
 * `TRIM` is not a loudness measurement. It is a gain multiplier applied to a peak that was chosen
 * by ear, so it runs *inverse* to how loud a cue was composed: `hover` carries the largest trim in
 * the table and is one of the quietest sounds in the app. Any assertion of the form
 * `TRIM.loss < TRIM.win` therefore proves nothing about what a player hears.
 *
 * This renders each cue offline at master gain 1 through the real chain, measures the output, and
 * writes lib/fx/sound-levels.ts. The honesty test then compares `outputLevel`, which is the thing
 * the rule is actually about.
 *
 *   pnpm dev                       # in another terminal
 *   node scripts/measure-cues.mjs  # [baseUrl]
 */
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:5173';
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = 'lib/fx/sound-levels.ts';
/** Anything below this is silence, not part of the cue. */
const FLOOR = 10 ** (-60 / 20);

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage();
try {
  await page.goto(`${BASE}/fx-lab`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => '__fdSound' in window, undefined, { timeout: 20000 });
  const trims = await page.evaluate(() => ({ ...window.__fdTrim }));
  const levels = await page.evaluate(
    async ([floor, trims]) => {
      const engine = window.__fdSound;
      const out = {};
      // The interaction cues randomise pitch, velocity and layer offsets on every trigger, so one
      // render is a sample, not a measurement. Average a handful and keep the worst peak.
      const PASSES = 8;
      for (const cue of engine.cues) {
        let rmsSum = 0;
        let peak = 0;
        for (let pass = 0; pass < PASSES; pass++) {
          // render() already multiplies by TRIM[cue]. Divide it back out so the table holds the
          // *composed* level and `outputLevel = rms * TRIM` is a single application, not two.
          const opts = { gain: 1 / trims[cue] };
          if (cue === 'combo') opts.n = 3;
          const buffer = await engine.render(cue, opts);
          const data = buffer.getChannelData(0);
          let first = -1;
          let last = -1;
          for (let i = 0; i < data.length; i++) {
            const v = Math.abs(data[i]);
            if (v > peak) peak = v;
            if (v >= floor) {
              if (first < 0) first = i;
              last = i;
            }
          }
          let sum = 0;
          const from = first < 0 ? 0 : first;
          const to = last < 0 ? data.length - 1 : last;
          for (let i = from; i <= to; i++) sum += data[i] * data[i];
          rmsSum += Math.sqrt(sum / Math.max(1, to - from + 1));
        }
        out[cue] = { peak: Number(peak.toFixed(5)), rms: Number((rmsSum / PASSES).toFixed(5)) };
      }
      return out;
    },
    [FLOOR, trims],
  );

  const db = (v) => (v > 0 ? `${(20 * Math.log10(v)).toFixed(1)} dBFS` : '-inf');
  const rows = Object.entries(levels)
    .map(([cue, l]) => `  ${cue}: { peak: ${l.peak}, rms: ${l.rms} }, // ${db(l.rms)} RMS`)
    .join('\n');
  writeFileSync(
    OUT,
    `/**
 * lib/fx/sound-levels.ts — GENERATED. Do not edit by hand.
 *
 * True peak and RMS of each cue as *composed* — rendered offline through the real chain with the
 * cue's own TRIM divided back out, averaged over 8 passes because the interaction cues randomise
 * every trigger, with RMS taken over the active window (first to last sample above -60 dBFS).
 * Multiply by TRIM to get what a player hears; that is what \`outputLevel\` does. Regenerate with
 * \`node scripts/measure-cues.mjs\` whenever a builder changes.
 *
 * These are the numbers the loudness ceiling is checked against; TRIM alone cannot express it,
 * because TRIM is inverse to how loud a cue was composed.
 */
import { TRIM, type Cue } from './sound';

export const CUE_LEVEL: Readonly<Record<Cue, { peak: number; rms: number }>> = Object.freeze({
${rows}
});

/** What a player actually hears, at master gain 1: the measured RMS after its trim. */
export const outputLevel = (cue: Cue): number => CUE_LEVEL[cue].rms * TRIM[cue];
`,
  );
  const loud = Object.entries(levels)
    .map(([cue, l]) => [cue, l.rms])
    .sort((a, b) => b[1] - a[1]);
  console.log(`wrote ${OUT} — ${loud.length} cues`);
  console.log(
    `loudest composed: ${loud
      .slice(0, 3)
      .map(([c, v]) => `${c} ${db(v)}`)
      .join(', ')}`,
  );
} finally {
  await browser.close();
}
