/**
 * lib/fx/sound.ts — procedural Web Audio synth for the juice system. No audio files.
 *
 * Every cue is built on the fly from oscillators (sine / triangle / sawtooth / square), cached
 * white & pink noise buffers, biquad filters and ADSR-ish gain envelopes. All cues are ≤ 1.2 s,
 * tuned to be tasteful (soft attacks, low-passed harsh waveforms, gentle "wrong"/"error"),
 * and loudness-normalised with a per-cue trim table measured offline (see `render()`).
 *
 * Behaviour:
 * - The AudioContext is created lazily on the first `play()`/`unlock()` — browsers require a
 *   user gesture, so `<FxProvider>` calls `sound.unlock()` from a capturing pointerdown/keydown
 *   listener.
 * - Master gain follows the `fact-duel-volume` pref; playback is skipped when sound is off,
 *   volume is 0, or the document is hidden. The same cue is throttled to ≥ 40 ms.
 * - Master chain: cue → master gain → soft compressor → destination, so stacked cues cannot clip.
 * - `sound.test()` plays every cue in sequence (for a "Preview sounds" button); `sound.stop()`
 *   cancels it. `sound.render(cue)` renders a cue into an OfflineAudioContext for analysis.
 *
 * SSR-safe: nothing touches `window`/`document` at module scope; on the server `play()` is a
 * silent no-op.
 */
import { getPrefs, subscribePrefs } from './prefs';

export type Cue =
  | 'tap'
  | 'hover'
  | 'select'
  | 'correct'
  | 'wrong'
  | 'combo'
  | 'countdown'
  | 'go'
  | 'reveal'
  | 'win'
  | 'loss'
  | 'draw'
  | 'levelUp'
  | 'quest'
  | 'gem'
  | 'stamp'
  | 'streak'
  | 'unlock'
  | 'xp'
  | 'tick'
  | 'whoosh'
  | 'error';

export interface PlayOptions {
  /** Frequency multiplier (1 = as designed). 2 = one octave up. */
  pitch?: number;
  /** Gain multiplier (1 = as designed). */
  gain?: number;
  /** Cue-specific count: combo depth for `combo`, XP amount for `xp`. */
  n?: number;
}

/** Ordered list of all cues (also the order used by `sound.test()`). */
export const CUES: readonly Cue[] = [
  'tap',
  'hover',
  'select',
  'correct',
  'wrong',
  'combo',
  'countdown',
  'go',
  'reveal',
  'win',
  'loss',
  'draw',
  'levelUp',
  'quest',
  'gem',
  'stamp',
  'streak',
  'unlock',
  'xp',
  'tick',
  'whoosh',
  'error',
];

/** Minimum gap between two plays of the same cue. */
export const CUE_THROTTLE_MS = 40;

type NoiseColor = 'white' | 'pink';

interface ToneParams {
  type?: OscillatorType;
  /** Start frequency in Hz (multiplied by the cue pitch). */
  freq: number;
  /** Glide target frequency (exponential ramp over `glide` seconds, default = `dur`). */
  to?: number;
  glide?: number;
  /** Offset from the cue start, seconds. */
  at?: number;
  /** Attack seconds (linear). */
  a?: number;
  /** Decay seconds (exponential, to `s` × peak). */
  d?: number;
  /** Sustain level 0..1 of peak. */
  s?: number;
  /** Seconds from note start until release begins (≥ a + d). */
  dur: number;
  /** Release seconds (exponential to silence). */
  r?: number;
  /** Peak gain (before trims). */
  peak: number;
  /** Detune in cents. */
  detune?: number;
  /** Low-pass cutoff (Hz) and optional sweep target. */
  lp?: number;
  lpTo?: number;
  q?: number;
}

interface NoiseParams {
  color?: NoiseColor;
  at?: number;
  a?: number;
  dur: number;
  r?: number;
  peak: number;
  filter?: { type: BiquadFilterType; from: number; to?: number; q?: number };
}

const SILENT = 0.0001;

/** Small helper that schedules voices into a context and tracks the cue's total length. */
class Voice {
  /** Cue length in seconds (max end time of any scheduled voice). */
  length = 0;

  constructor(
    private readonly ac: BaseAudioContext,
    private readonly out: AudioNode,
    private readonly t0: number,
    private readonly pitch: number,
    private readonly gain: number,
    private readonly noiseBuffer: (color: NoiseColor) => AudioBuffer,
  ) {}

  private track(end: number): number {
    this.length = Math.max(this.length, end);
    return end;
  }

  tone(p: ToneParams): number {
    const ac = this.ac;
    const t = this.t0 + (p.at ?? 0);
    const a = p.a ?? 0.006;
    const d = p.d ?? 0;
    const s = p.s ?? 1;
    const r = p.r ?? 0.08;
    const peak = Math.max(SILENT, p.peak * this.gain);
    const osc = ac.createOscillator();
    osc.type = p.type ?? 'sine';
    const f0 = Math.min(18000, Math.max(20, p.freq * this.pitch));
    osc.frequency.setValueAtTime(f0, t);
    if (p.to !== undefined) {
      const f1 = Math.min(18000, Math.max(20, p.to * this.pitch));
      osc.frequency.exponentialRampToValueAtTime(f1, t + (p.glide ?? p.dur));
    }
    if (p.detune) osc.detune.setValueAtTime(p.detune, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(SILENT, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    let level = peak;
    if (d > 0 && s < 1) {
      level = Math.max(SILENT, peak * s);
      g.gain.exponentialRampToValueAtTime(level, t + a + d);
    }
    const relStart = t + Math.max(p.dur, a + d);
    g.gain.setValueAtTime(level, relStart);
    g.gain.exponentialRampToValueAtTime(SILENT, relStart + r);
    let head: AudioNode = osc;
    if (p.lp !== undefined) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.Q.value = p.q ?? 0.7;
      f.frequency.setValueAtTime(p.lp, t);
      if (p.lpTo !== undefined) f.frequency.exponentialRampToValueAtTime(p.lpTo, t + p.dur);
      head.connect(f);
      head = f;
    }
    head.connect(g);
    g.connect(this.out);
    osc.start(t);
    const end = relStart + r + 0.02;
    osc.stop(end);
    return this.track(end - this.t0);
  }

  noise(p: NoiseParams): number {
    const ac = this.ac;
    const t = this.t0 + (p.at ?? 0);
    const a = p.a ?? 0.005;
    const r = p.r ?? 0.08;
    const peak = Math.max(SILENT, p.peak * this.gain);
    const src = ac.createBufferSource();
    const buffer = this.noiseBuffer(p.color ?? 'white');
    src.buffer = buffer;
    let head: AudioNode = src;
    if (p.filter) {
      const f = ac.createBiquadFilter();
      f.type = p.filter.type;
      f.Q.value = p.filter.q ?? 1;
      f.frequency.setValueAtTime(Math.min(18000, p.filter.from * this.pitch), t);
      if (p.filter.to !== undefined) {
        f.frequency.exponentialRampToValueAtTime(Math.min(18000, p.filter.to * this.pitch), t + p.dur);
      }
      head.connect(f);
      head = f;
    }
    const g = ac.createGain();
    g.gain.setValueAtTime(SILENT, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + Math.max(p.dur, a));
    g.gain.exponentialRampToValueAtTime(SILENT, t + Math.max(p.dur, a) + r);
    head.connect(g);
    g.connect(this.out);
    const total = Math.max(p.dur, a) + r + 0.02;
    // Random offset into the buffer so repeated hits don't sound identical.
    const maxOffset = Math.max(0, buffer.duration - total - 0.01);
    src.start(t, Math.random() * maxOffset);
    src.stop(t + total);
    return this.track(t + total - this.t0);
  }
}

type CueBuilder = (v: Voice, n: number) => void;

const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.51;
const G6 = 1567.98;
const A4 = 440;
const G4 = 392;
const EB4 = 311.13;

/**
 * Cue designs. Peaks are "as composed"; the TRIM table below normalises loudness.
 */
const BUILDERS: Record<Cue, CueBuilder> = {
  tap: (v) => {
    v.tone({ type: 'sine', freq: 1300, to: 720, glide: 0.03, a: 0.002, dur: 0.03, r: 0.045, peak: 0.5 });
  },
  hover: (v) => {
    v.tone({ type: 'sine', freq: 1500, a: 0.004, dur: 0.018, r: 0.03, peak: 0.14 });
  },
  select: (v) => {
    v.tone({ type: 'sine', freq: 660, a: 0.003, dur: 0.045, r: 0.05, peak: 0.36 });
    v.tone({ type: 'sine', freq: 880, at: 0.06, a: 0.003, dur: 0.06, r: 0.09, peak: 0.36 });
  },
  correct: (v) => {
    [C5, E5, G5].forEach((f, i) =>
      v.tone({
        type: 'triangle',
        freq: f,
        at: i * 0.07,
        a: 0.005,
        d: 0.08,
        s: 0.5,
        dur: 0.16,
        r: 0.16,
        peak: 0.4,
      }),
    );
    v.noise({ at: 0.14, dur: 0.05, r: 0.16, peak: 0.1, filter: { type: 'bandpass', from: 6000, q: 1.2 } });
  },
  wrong: (v) => {
    v.tone({ type: 'triangle', freq: G4, to: 380, a: 0.008, dur: 0.14, r: 0.12, peak: 0.36, lp: 1200 });
    v.tone({
      type: 'triangle',
      freq: EB4,
      to: 300,
      at: 0.15,
      a: 0.01,
      dur: 0.18,
      r: 0.16,
      peak: 0.34,
      lp: 900,
    });
  },
  combo: (v, n) => {
    const depth = Math.min(24, Math.max(0, Math.round(n)));
    const base = C5 * Math.pow(2, depth / 12);
    v.tone({ type: 'triangle', freq: base, a: 0.004, d: 0.05, s: 0.6, dur: 0.09, r: 0.14, peak: 0.36 });
    v.tone({ type: 'sine', freq: base, a: 0.004, dur: 0.08, r: 0.1, peak: 0.2 });
    if (depth >= 4) {
      v.tone({ type: 'sine', freq: base * 3, at: 0.02, a: 0.003, dur: 0.04, r: 0.25, peak: 0.1 });
      v.noise({
        at: 0.01,
        dur: 0.04,
        r: 0.2,
        peak: 0.07,
        filter: { type: 'bandpass', from: Math.min(9000, base * 8), q: 1.5 },
      });
    }
  },
  countdown: (v) => {
    v.tone({ type: 'sine', freq: 1000, a: 0.001, dur: 0.02, r: 0.05, peak: 0.45 });
    v.tone({ type: 'square', freq: 2000, a: 0.001, dur: 0.006, r: 0.012, peak: 0.1, lp: 6000 });
  },
  go: (v) => {
    v.tone({
      type: 'sawtooth',
      freq: 220,
      to: 880,
      glide: 0.24,
      a: 0.01,
      dur: 0.24,
      r: 0.18,
      peak: 0.26,
      lp: 600,
      lpTo: 3200,
    });
    v.tone({ type: 'triangle', freq: 880, at: 0.22, a: 0.004, dur: 0.1, r: 0.2, peak: 0.3 });
  },
  reveal: (v) => {
    v.noise({
      a: 0.03,
      dur: 0.38,
      r: 0.15,
      peak: 0.36,
      filter: { type: 'bandpass', from: 300, to: 3000, q: 0.9 },
    });
  },
  win: (v) => {
    [C5, E5, G5, C6].forEach((f, i) => {
      const last = i === 3;
      const at = i * 0.11;
      const dur = last ? 0.45 : 0.16;
      const r = last ? 0.3 : 0.18;
      v.tone({ type: 'sawtooth', freq: f, detune: -6, at, a: 0.006, dur, r, peak: 0.1, lp: 2400 });
      v.tone({ type: 'sawtooth', freq: f, detune: 6, at, a: 0.006, dur, r, peak: 0.1, lp: 2400 });
      v.tone({ type: 'triangle', freq: f, at, a: 0.006, dur, r, peak: 0.28 });
    });
    v.tone({ type: 'sine', freq: 2093, at: 0.36, a: 0.003, dur: 0.05, r: 0.35, peak: 0.12 });
    v.tone({ type: 'sine', freq: 3136, at: 0.42, a: 0.003, dur: 0.04, r: 0.3, peak: 0.07 });
    v.noise({ at: 0.36, dur: 0.1, r: 0.35, peak: 0.07, filter: { type: 'bandpass', from: 7000, q: 1 } });
  },
  loss: (v) => {
    [E5, C5, A4].forEach((f, i) => {
      const last = i === 2;
      v.tone({
        type: 'triangle',
        freq: f,
        at: i * 0.16,
        a: 0.012,
        dur: last ? 0.3 : 0.18,
        r: last ? 0.35 : 0.22,
        peak: 0.3,
        lp: 1500,
      });
    });
  },
  draw: (v) => {
    v.tone({ type: 'triangle', freq: A4, a: 0.005, dur: 0.1, r: 0.15, peak: 0.35 });
    v.tone({ type: 'triangle', freq: A4, at: 0.15, a: 0.005, dur: 0.1, r: 0.15, peak: 0.35 });
  },
  levelUp: (v) => {
    [C5, D5, E5, G5, C6].forEach((f, i) =>
      v.tone({ type: 'triangle', freq: f, at: i * 0.07, a: 0.004, dur: 0.1, r: 0.12, peak: 0.32 }),
    );
    v.tone({ type: 'sine', freq: G6, at: 0.36, a: 0.003, dur: 0.08, r: 0.5, peak: 0.3 });
    v.tone({ type: 'sine', freq: G6 * 2.4, at: 0.36, a: 0.003, dur: 0.03, r: 0.35, peak: 0.1 });
    v.tone({ type: 'sine', freq: G6 * 4.1, at: 0.36, a: 0.003, dur: 0.02, r: 0.25, peak: 0.04 });
    v.noise({ at: 0.36, dur: 0.06, r: 0.3, peak: 0.06, filter: { type: 'bandpass', from: 8000, q: 1.2 } });
  },
  quest: (v) => {
    v.tone({ type: 'sine', freq: E6, a: 0.003, dur: 0.06, r: 0.5, peak: 0.3 });
    v.tone({ type: 'sine', freq: E6 * 2.76, a: 0.003, dur: 0.02, r: 0.3, peak: 0.08 });
    [C5, E5, G5].forEach((f) =>
      v.tone({ type: 'triangle', freq: f, at: 0.05, a: 0.02, dur: 0.3, r: 0.3, peak: 0.14, lp: 2000 }),
    );
  },
  gem: (v) => {
    v.tone({ type: 'sine', freq: 2093, a: 0.002, dur: 0.03, r: 0.12, peak: 0.35 });
    v.tone({ type: 'sine', freq: 4186, a: 0.002, dur: 0.02, r: 0.08, peak: 0.06 });
    v.tone({ type: 'sine', freq: 2349, at: 0.09, a: 0.002, dur: 0.03, r: 0.16, peak: 0.35 });
  },
  stamp: (v) => {
    v.tone({ type: 'sine', freq: 130, to: 45, glide: 0.12, a: 0.003, dur: 0.1, r: 0.12, peak: 0.6 });
    v.noise({ dur: 0.03, r: 0.06, peak: 0.3, filter: { type: 'lowpass', from: 250, q: 0.8 } });
    [G4, C5, E5].forEach((f) =>
      v.tone({ type: 'triangle', freq: f, at: 0.05, a: 0.01, dur: 0.22, r: 0.28, peak: 0.16, lp: 2500 }),
    );
  },
  streak: (v) => {
    [0, 0.05, 0.09, 0.14, 0.2, 0.27].forEach((at, i) =>
      v.noise({
        at,
        a: 0.002,
        dur: 0.012,
        r: 0.03,
        peak: 0.22 + (i % 2) * 0.06,
        filter: { type: 'bandpass', from: 2500 + i * 250, q: 2 },
      }),
    );
    v.tone({ type: 'sine', freq: 440, to: 880, glide: 0.32, a: 0.02, dur: 0.32, r: 0.2, peak: 0.28 });
  },
  unlock: (v) => {
    [C6, E6, G6].forEach((f, i) => {
      v.tone({ type: 'sine', freq: f, at: i * 0.04, a: 0.003, dur: 0.1, r: 0.55, peak: 0.26 });
      v.tone({ type: 'sine', freq: f * 2, at: i * 0.04, a: 0.003, dur: 0.03, r: 0.3, peak: 0.05 });
    });
  },
  xp: (v, n) => {
    const amount = Math.max(1, n);
    const f = 620 * Math.pow(2, Math.min(1.2, Math.max(0, Math.log2(amount) / 8)));
    v.tone({ type: 'sine', freq: f, a: 0.002, dur: 0.025, r: 0.06, peak: 0.38 });
  },
  tick: (v) => {
    v.tone({ type: 'sine', freq: 1800, a: 0.001, dur: 0.008, r: 0.03, peak: 0.3 });
  },
  whoosh: (v) => {
    v.noise({
      color: 'pink',
      a: 0.06,
      dur: 0.22,
      r: 0.16,
      peak: 0.9,
      filter: { type: 'bandpass', from: 500, to: 2200, q: 0.8 },
    });
  },
  error: (v) => {
    v.tone({ type: 'square', freq: 196, a: 0.006, dur: 0.1, r: 0.06, peak: 0.16, lp: 700 });
    v.tone({ type: 'square', freq: 165, at: 0.13, a: 0.006, dur: 0.14, r: 0.1, peak: 0.16, lp: 600 });
  },
};

/**
 * Loudness trims (linear gain) applied per cue so that all cues land in a similar perceived
 * loudness band. Derived by rendering each cue offline (`sound.render`, master gain 1) and
 * measuring RMS over the active part of the cue, then targeting ≈ -15 dBFS (short pings a
 * touch hotter to offset temporal integration; hover/tick intentionally softer; loss gentler).
 */
export const TRIM: Readonly<Record<Cue, number>> = Object.freeze({
  tap: 1.15,
  hover: 1.6, // designed very soft (≈ -24 dB)
  select: 0.8,
  correct: 0.94,
  wrong: 0.73,
  combo: 1.1,
  countdown: 1.35,
  go: 1.02,
  reveal: 1.75,
  win: 0.88, // climax cues sit ≈ 1 dB hotter
  loss: 0.7, // deliberately gentle
  draw: 0.9,
  levelUp: 0.98,
  quest: 1.03,
  gem: 1.12,
  stamp: 0.93,
  streak: 0.83,
  unlock: 1.06,
  xp: 1.4,
  tick: 1.5, // designed subtle (≈ -22 dB)
  whoosh: 1.8,
  error: 0.98,
});

/** Default cue-specific `n` when the caller passes none. */
const DEFAULT_N: Partial<Record<Cue, number>> = { combo: 1, xp: 25 };

const NOISE_SECONDS = 1.5;

function makeNoise(ac: BaseAudioContext, color: NoiseColor): AudioBuffer {
  const length = Math.floor(ac.sampleRate * NOISE_SECONDS);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  if (color === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
  // Pink noise — Paul Kellet's refined method.
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

interface Chain {
  master: GainNode;
  out: AudioNode;
}

function buildChain(ac: BaseAudioContext, masterGain: number): Chain {
  const master = ac.createGain();
  master.gain.value = masterGain;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.12;
  master.connect(comp);
  comp.connect(ac.destination);
  return { master, out: master };
}

const wait = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      resolve();
    });
  });

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private chain: Chain | null = null;
  private noise: Partial<Record<NoiseColor, AudioBuffer>> = {};
  private lastPlayed = new Map<Cue, number>();
  private prefsBound = false;
  private testRun: AbortController | null = null;

  /** All cue names, in audition order. */
  readonly cues = CUES;

  /** The underlying AudioContext (null until first play/unlock, and always null on the server). */
  get context(): AudioContext | null {
    return this.ctx;
  }

  /** True once an AudioContext exists and is running. */
  get ready(): boolean {
    return this.ctx?.state === 'running';
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) return this.ctx;
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    this.chain = buildChain(this.ctx, getPrefs().volume);
    if (!this.prefsBound) {
      this.prefsBound = true;
      subscribePrefs((p) => {
        if (this.ctx && this.chain) {
          this.chain.master.gain.setTargetAtTime(p.volume, this.ctx.currentTime, 0.02);
        }
      });
    }
    return this.ctx;
  }

  /**
   * Create/resume the AudioContext. Call from a user-gesture handler (pointerdown, keydown);
   * `<FxProvider>` installs one for you. Safe to call repeatedly.
   */
  unlock(): void {
    const ac = this.ensure();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume().catch(() => undefined);
  }

  private noiseFor(ac: BaseAudioContext): (color: NoiseColor) => AudioBuffer {
    return (color) => {
      if (ac !== this.ctx) return makeNoise(ac, color); // offline contexts get fresh buffers
      const cached = this.noise[color];
      if (cached) return cached;
      const made = makeNoise(ac, color);
      this.noise[color] = made;
      return made;
    };
  }

  /**
   * Play a cue. Returns the cue length in seconds, or 0 when nothing was scheduled (prefs off,
   * hidden tab, throttled, unsupported, server).
   */
  play(cue: Cue, opts: PlayOptions = {}): number {
    if (typeof document === 'undefined') return 0;
    const prefs = getPrefs();
    if (!prefs.sound || prefs.volume <= 0 || document.hidden) return 0;
    const builder = BUILDERS[cue];
    if (!builder) return 0;
    const now = performance.now();
    const last = this.lastPlayed.get(cue);
    if (last !== undefined && now - last < CUE_THROTTLE_MS) return 0;
    this.lastPlayed.set(cue, now);
    const ac = this.ensure();
    if (!ac || !this.chain) return 0;
    if (ac.state === 'suspended') void ac.resume().catch(() => undefined);
    try {
      const voice = new Voice(
        ac,
        this.chain.out,
        ac.currentTime + 0.005,
        opts.pitch ?? 1,
        (opts.gain ?? 1) * TRIM[cue],
        this.noiseFor(ac),
      );
      builder(voice, opts.n ?? DEFAULT_N[cue] ?? 1);
      return voice.length;
    } catch (err) {
      console.error('[fx/sound] failed to play', cue, err);
      return 0;
    }
  }

  /**
   * Render a cue into an OfflineAudioContext (mono, 1.3 s) — used for loudness analysis and
   * tests. Ignores prefs. Resolves to null where Web Audio is unavailable.
   */
  async render(cue: Cue, opts: PlayOptions = {}, sampleRate = 44100): Promise<AudioBuffer | null> {
    if (typeof window === 'undefined') return null;
    const Ctor: typeof OfflineAudioContext | undefined =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    if (!Ctor) return null;
    const ac = new Ctor(1, Math.ceil(sampleRate * 1.3), sampleRate);
    const chain = buildChain(ac, 1);
    const voice = new Voice(ac, chain.out, 0.01, opts.pitch ?? 1, (opts.gain ?? 1) * TRIM[cue], (c) =>
      makeNoise(ac, c),
    );
    BUILDERS[cue](voice, opts.n ?? DEFAULT_N[cue] ?? 1);
    return ac.startRendering();
  }

  /**
   * Audition every cue in sequence (≈ 12 s). Resolves when done or when `stop()` is called.
   * Used by the settings dialog "Preview sounds" button.
   */
  async test(gapMs = 260): Promise<void> {
    this.stop();
    const run = new AbortController();
    this.testRun = run;
    this.unlock();
    for (const cue of CUES) {
      if (run.signal.aborted) break;
      const seconds = this.play(cue, cue === 'combo' ? { n: 5 } : cue === 'xp' ? { n: 50 } : {});
      await wait(Math.max(120, seconds * 1000) + gapMs, run.signal);
    }
    if (this.testRun === run) this.testRun = null;
  }

  /** Cancel an in-progress `test()` run. */
  stop(): void {
    this.testRun?.abort();
    this.testRun = null;
  }

  /** True while `test()` is running. */
  get testing(): boolean {
    return this.testRun !== null;
  }
}

/** Shared engine — one AudioContext per page. */
export const sound = new SoundEngine();
