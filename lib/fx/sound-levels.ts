/**
 * lib/fx/sound-levels.ts — GENERATED. Do not edit by hand.
 *
 * True peak and RMS of each cue as *composed* — rendered offline through the real chain with the
 * cue's own TRIM divided back out, averaged over 8 passes because the interaction cues randomise
 * every trigger, with RMS taken over the active window (first to last sample above -60 dBFS).
 * Multiply by TRIM to get what a player hears; that is what `outputLevel` does. Regenerate with
 * `node scripts/measure-cues.mjs` whenever a builder changes.
 *
 * These are the numbers the loudness ceiling is checked against; TRIM alone cannot express it,
 * because TRIM is inverse to how loud a cue was composed.
 */
import { TRIM, type Cue } from './sound';

export const CUE_LEVEL: Readonly<Record<Cue, { peak: number; rms: number }>> = Object.freeze({
  tap: { peak: 0.09751, rms: 0.02929 }, // -30.7 dBFS RMS
  hover: { peak: 0.02999, rms: 0.00582 }, // -44.7 dBFS RMS
  select: { peak: 0.15283, rms: 0.04417 }, // -27.1 dBFS RMS
  correct: { peak: 0.83206, rms: 0.19793 }, // -14.1 dBFS RMS
  wrong: { peak: 0.52697, rms: 0.24068 }, // -12.4 dBFS RMS
  combo: { peak: 0.56808, rms: 0.21337 }, // -13.4 dBFS RMS
  countdown: { peak: 0.37463, rms: 0.13233 }, // -17.6 dBFS RMS
  go: { peak: 0.67527, rms: 0.16867 }, // -15.5 dBFS RMS
  reveal: { peak: 0.40192, rms: 0.07319 }, // -22.7 dBFS RMS
  win: { peak: 0.78242, rms: 0.23429 }, // -12.6 dBFS RMS
  loss: { peak: 0.73116, rms: 0.21931 }, // -13.2 dBFS RMS
  draw: { peak: 0.49886, rms: 0.20043 }, // -14.0 dBFS RMS
  levelUp: { peak: 0.82167, rms: 0.2119 }, // -13.5 dBFS RMS
  quest: { peak: 0.69946, rms: 0.17315 }, // -15.2 dBFS RMS
  gem: { peak: 0.48998, rms: 0.15855 }, // -16.0 dBFS RMS
  stamp: { peak: 0.86645, rms: 0.22786 }, // -12.8 dBFS RMS
  streak: { peak: 0.61427, rms: 0.22019 }, // -13.1 dBFS RMS
  unlock: { peak: 0.79281, rms: 0.17517 }, // -15.1 dBFS RMS
  xp: { peak: 0.35155, rms: 0.12422 }, // -18.1 dBFS RMS
  tick: { peak: 0.16445, rms: 0.05826 }, // -24.7 dBFS RMS
  detent: { peak: 0.03381, rms: 0.00598 }, // -44.5 dBFS RMS
  kept: { peak: 0.3842, rms: 0.15458 }, // -16.2 dBFS RMS
  whoosh: { peak: 0.35612, rms: 0.07177 }, // -22.9 dBFS RMS
  error: { peak: 0.26255, rms: 0.15085 }, // -16.4 dBFS RMS
});

/** What a player actually hears, at master gain 1: the measured RMS after its trim. */
export const outputLevel = (cue: Cue): number => CUE_LEVEL[cue].rms * TRIM[cue];
