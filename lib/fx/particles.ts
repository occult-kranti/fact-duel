/**
 * lib/fx/particles.ts — Canvas2D particle engine with simple physics.
 *
 * One engine draws into a fixed, full-viewport canvas (mounted by `components/fx/fx-canvas.tsx`).
 * - A single requestAnimationFrame loop runs only while live particles exist and the document is
 *   visible; it stops itself otherwise (zero idle cost).
 * - Particles are pooled (fixed-size array of mutable records, no per-frame allocation).
 * - Device pixel ratio is capped at 2.
 * - Colours default to the CSS variables `--fx-1`..`--fx-5` on `:root`, read once per emit via
 *   getComputedStyle (fallbacks: #d4ff3a, #ffc83d, #4ee1ff, #ff5ea8, #ffffff).
 * - Reduced motion (pref OR media query): bursts/sparkles/fountains emit ≤ 6 short-lived
 *   particles; confetti is replaced by a single ring pulse; float text rises less.
 *
 * Units: CSS pixels, seconds. Gravity/acceleration in px/s²; `drag` is a per-frame (60 fps)
 * velocity multiplier (0.9 = heavy air, 1 = none).
 *
 * SSR-safe: nothing here touches `window`/`document` at module scope; emitters are no-ops until
 * `attach(canvas)` is called in the browser.
 */
import { reducedMotion } from './prefs';

export interface Point {
  x: number;
  y: number;
}

export type ParticleShape = 'circle' | 'square' | 'star' | 'coin' | 'spark' | 'text' | 'ring';

export interface Particle {
  alive: boolean;
  shape: ParticleShape;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Constant acceleration (gravity goes into `ay`). */
  ax: number;
  ay: number;
  /** Per-frame velocity multiplier at 60 fps. */
  drag: number;
  rot: number;
  /** Angular velocity, rad/s. */
  av: number;
  age: number;
  life: number;
  /** Radius for circles/stars/coins, half-side for squares, line width for sparks, font px for text, max radius for rings. */
  size: number;
  color: string;
  text: string;
  /** Sinusoidal horizontal drift amplitude (px/s) — confetti flutter. */
  flutter: number;
  phase: number;
  /** Flutter / flip frequency (rad/s). */
  wobble: number;
}

export interface BurstOptions {
  x: number;
  y: number;
  count?: number;
  colors?: string[];
  shapes?: ParticleShape[];
  /** Initial speed in px/s (randomised ±40%). */
  speed?: number;
  /** Cone spread in radians (2π = all directions). */
  spread?: number;
  /** Cone centre angle in radians (0 = right, -π/2 = up). Default: up. */
  angle?: number;
  gravity?: number;
  life?: number;
  size?: number;
}

export interface ConfettiOptions {
  count?: number;
  colors?: string[];
  from?: 'top' | 'point';
  x?: number;
  y?: number;
}

export interface SparkleOptions {
  x: number;
  y: number;
  count?: number;
  colors?: string[];
  /** Spawn radius around the point. */
  radius?: number;
}

export interface FloatTextOptions {
  x: number;
  y: number;
  text: string;
  color?: string;
  /** Font size in px (default 18). */
  size?: number;
}

export interface RingPulseOptions {
  x: number;
  y: number;
  color?: string;
  /** Final radius in px (default 56). */
  radius?: number;
}

export interface CoinFountainOptions {
  x: number;
  y: number;
  count?: number;
  color?: string;
}

/** Fallback palette when `--fx-1..5` are not defined. */
export const FX_FALLBACK_COLORS: readonly string[] = Object.freeze([
  '#d4ff3a',
  '#ffc83d',
  '#4ee1ff',
  '#ff5ea8',
  '#ffffff',
]);

const POOL_SIZE = 900;
const MAX_DPR = 2;
const MAX_DT = 0.05;
const TWO_PI = Math.PI * 2;

const rand = (min: number, max: number): number => min + Math.random() * (max - min);
const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

function blank(): Particle {
  return {
    alive: false,
    shape: 'circle',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    drag: 1,
    rot: 0,
    av: 0,
    age: 0,
    life: 1,
    size: 4,
    color: '#fff',
    text: '',
    flutter: 0,
    phase: 0,
    wobble: 0,
  };
}

/** Read the theme palette from `:root` (`--fx-1`..`--fx-5`) with fallbacks. */
export function fxColors(): string[] {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') return [...FX_FALLBACK_COLORS];
  const style = getComputedStyle(document.documentElement);
  return FX_FALLBACK_COLORS.map((fallback, i) => style.getPropertyValue(`--fx-${i + 1}`).trim() || fallback);
}

export class ParticleEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private readonly pool: Particle[] = [];
  private cursor = 0;
  private live = 0;
  private raf = 0;
  private lastTime = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private detachFns: Array<() => void> = [];

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) this.pool.push(blank());
  }

  /** Number of live particles (diagnostics / tests). */
  get liveCount(): number {
    return this.live;
  }

  /** True while the rAF loop is scheduled. */
  get running(): boolean {
    return this.raf !== 0;
  }

  get attached(): boolean {
    return this.canvas !== null;
  }

  /** Bind the engine to a canvas; sizes it to the viewport and listens for resize/visibility. */
  attach(canvas: HTMLCanvasElement): void {
    if (typeof window === 'undefined') return;
    if (this.canvas === canvas) return;
    this.detach();
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    const onResize = () => this.resize();
    const onVisibility = () => {
      if (document.hidden) this.stopLoop();
      else if (this.live > 0) this.startLoop();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    this.detachFns = [
      () => window.removeEventListener('resize', onResize),
      () => window.removeEventListener('orientationchange', onResize),
      () => document.removeEventListener('visibilitychange', onVisibility),
    ];
    this.resize();
    if (this.live > 0) this.startLoop();
  }

  /** Unbind from the canvas and stop the loop (particles are dropped). */
  detach(): void {
    this.stopLoop();
    for (const fn of this.detachFns) fn();
    this.detachFns = [];
    this.clear();
    this.canvas = null;
    this.ctx = null;
  }

  /** Kill every live particle. */
  clear(): void {
    for (const p of this.pool) p.alive = false;
    this.live = 0;
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private resize(): void {
    if (!this.canvas || !this.ctx) return;
    this.dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private spawn(): Particle {
    // Find a free slot starting at the cursor; if the pool is full, recycle the slot under it.
    for (let i = 0; i < POOL_SIZE; i++) {
      const idx = (this.cursor + i) % POOL_SIZE;
      const p = this.pool[idx];
      if (!p.alive) {
        this.cursor = (idx + 1) % POOL_SIZE;
        this.live++;
        return this.reset(p);
      }
    }
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    return this.reset(p);
  }

  private reset(p: Particle): Particle {
    p.alive = true;
    p.shape = 'circle';
    p.vx = p.vy = p.ax = p.ay = 0;
    p.drag = 1;
    p.rot = 0;
    p.av = 0;
    p.age = 0;
    p.life = 1;
    p.size = 4;
    p.text = '';
    p.flutter = 0;
    p.phase = 0;
    p.wobble = 0;
    return p;
  }

  private startLoop(): void {
    if (this.raf !== 0 || !this.ctx) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private stopLoop(): void {
    if (this.raf !== 0) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private readonly frame = (now: number): void => {
    this.raf = 0;
    const ctx = this.ctx;
    if (!ctx) return;
    const dt = Math.min(MAX_DT, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;
    ctx.clearRect(0, 0, this.width, this.height);
    let live = 0;
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.alive = false;
        continue;
      }
      if (p.shape !== 'ring') {
        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        if (p.drag !== 1) {
          const k = Math.pow(p.drag, dt * 60);
          p.vx *= k;
          p.vy *= k;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.flutter !== 0) p.x += Math.sin(p.phase + p.age * p.wobble) * p.flutter * dt;
        p.rot += p.av * dt;
        // Cull far off-screen particles early (keeps the loop short after a big confetti rain).
        if (p.y > this.height + 80 || p.x < -120 || p.x > this.width + 120) {
          p.alive = false;
          continue;
        }
      }
      live++;
      this.draw(ctx, p);
    }
    this.live = live;
    if (live > 0) this.raf = requestAnimationFrame(this.frame);
    else ctx.clearRect(0, 0, this.width, this.height);
  };

  private draw(ctx: CanvasRenderingContext2D, p: Particle): void {
    const t = p.age / p.life;
    const alpha = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    switch (p.shape) {
      case 'circle': {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
        ctx.fill();
        break;
      }
      case 'square': {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // Flip around the long axis so confetti glints as it tumbles.
        const flip = p.wobble !== 0 ? Math.cos(p.phase * 1.7 + p.age * p.wobble * 1.3) : 1;
        ctx.scale(Math.max(0.12, Math.abs(flip)), 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
        ctx.restore();
        break;
      }
      case 'star': {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? p.size : p.size * 0.45;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'coin': {
        ctx.save();
        ctx.translate(p.x, p.y);
        const rx = p.size * Math.max(0.15, Math.abs(Math.cos(p.rot)));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, p.size, 0, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(-rx * 0.25, -p.size * 0.3, rx * 0.35, p.size * 0.25, 0, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'spark': {
        const speed = Math.hypot(p.vx, p.vy) || 1;
        const len = Math.max(4, Math.min(28, speed * 0.05));
        const ux = p.vx / speed;
        const uy = p.vy / speed;
        ctx.strokeStyle = p.color;
        ctx.lineCap = 'round';
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - ux * len, p.y - uy * len);
        ctx.stroke();
        break;
      }
      case 'text': {
        ctx.save();
        ctx.translate(p.x, p.y);
        const pop = p.age < 0.14 ? 0.6 + (p.age / 0.14) * 0.5 : 1.1 - Math.min(0.1, (p.age - 0.14) * 0.3);
        ctx.scale(pop, pop);
        ctx.font = `800 ${p.size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
        break;
      }
      case 'ring': {
        const e = 1 - Math.pow(1 - t, 3);
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.5 * (1 - e) + 0.75;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * e), 0, TWO_PI);
        ctx.stroke();
        break;
      }
    }
    ctx.globalAlpha = 1;
  }

  private emitReady(): boolean {
    if (!this.ctx) return false;
    return true;
  }

  private afterEmit(): void {
    this.startLoop();
  }

  /** Radial burst from a point. */
  burst(o: BurstOptions): void {
    if (!this.emitReady()) return;
    const reduced = reducedMotion();
    const colors = o.colors?.length ? o.colors : fxColors();
    const shapes = o.shapes?.length ? o.shapes : (['circle', 'star', 'spark'] as ParticleShape[]);
    const count = reduced ? Math.min(6, o.count ?? 6) : (o.count ?? 24);
    const speed = (o.speed ?? 360) * (reduced ? 0.5 : 1);
    const spread = o.spread ?? TWO_PI;
    const angle = o.angle ?? -Math.PI / 2;
    const gravity = o.gravity ?? 900;
    const life = reduced ? Math.min(0.45, o.life ?? 0.45) : (o.life ?? 0.9);
    const size = o.size ?? 4;
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      const a = angle + (Math.random() - 0.5) * spread;
      const v = speed * rand(0.6, 1.4);
      p.shape = pick(shapes);
      p.x = o.x;
      p.y = o.y;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.ay = gravity;
      p.drag = 0.96;
      p.rot = Math.random() * TWO_PI;
      p.av = rand(-8, 8);
      p.life = life * rand(0.7, 1.15);
      p.size = size * rand(0.6, 1.4) * (p.shape === 'spark' ? 0.6 : 1);
      p.color = pick(colors);
    }
    this.afterEmit();
  }

  /** Confetti rain (from the top edge) or a confetti cannon (from a point). Reduced motion → ring pulse. */
  confetti(o: ConfettiOptions = {}): void {
    if (!this.emitReady()) return;
    const from = o.from ?? 'top';
    const x = o.x ?? this.width / 2;
    const y = o.y ?? this.height * 0.4;
    if (reducedMotion()) {
      this.ringPulse({ x, y, color: (o.colors ?? fxColors())[1] });
      return;
    }
    const colors = o.colors?.length ? o.colors : fxColors();
    const count = o.count ?? (from === 'top' ? 140 : 90);
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      p.shape = Math.random() < 0.82 ? 'square' : 'circle';
      p.color = pick(colors);
      p.size = rand(3.5, 6.5);
      p.rot = Math.random() * TWO_PI;
      p.av = rand(-6, 6);
      p.flutter = rand(40, 110);
      p.phase = Math.random() * TWO_PI;
      p.wobble = rand(4, 9);
      p.ay = 260;
      p.drag = 0.985;
      if (from === 'top') {
        p.x = rand(-20, this.width + 20);
        p.y = rand(-140, -10);
        p.vx = rand(-40, 40);
        p.vy = rand(60, 220);
        p.life = rand(2.4, 3.6);
      } else {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const v = rand(380, 820);
        p.x = x;
        p.y = y;
        p.vx = Math.cos(a) * v;
        p.vy = Math.sin(a) * v;
        p.drag = 0.955;
        p.ay = 520;
        p.life = rand(1.8, 2.8);
      }
    }
    this.afterEmit();
  }

  /** Twinkling stars around a point. */
  sparkle(o: SparkleOptions): void {
    if (!this.emitReady()) return;
    const reduced = reducedMotion();
    const colors = o.colors?.length ? o.colors : [fxColors()[4], fxColors()[1], fxColors()[2]];
    const count = reduced ? Math.min(6, o.count ?? 6) : (o.count ?? 14);
    const radius = o.radius ?? 28;
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      const a = Math.random() * TWO_PI;
      const d = Math.sqrt(Math.random()) * radius;
      p.shape = 'star';
      p.x = o.x + Math.cos(a) * d;
      p.y = o.y + Math.sin(a) * d;
      p.vx = Math.cos(a) * rand(10, 40);
      p.vy = Math.sin(a) * rand(10, 40) - 30;
      p.ay = 60;
      p.av = rand(-4, 4);
      p.rot = Math.random() * TWO_PI;
      p.life = reduced ? rand(0.3, 0.45) : rand(0.5, 0.9);
      p.size = rand(3, 7);
      p.color = pick(colors);
    }
    this.afterEmit();
  }

  /** Floating label such as "+25 XP" that rises ~80 px and fades. */
  floatText(o: FloatTextOptions): void {
    if (!this.emitReady()) return;
    const reduced = reducedMotion();
    const p = this.spawn();
    p.shape = 'text';
    p.text = o.text;
    p.x = o.x;
    p.y = o.y;
    p.vy = reduced ? -35 : -95;
    p.ay = reduced ? 10 : 30;
    p.drag = 1;
    p.life = reduced ? 0.8 : 1.1;
    p.size = o.size ?? 18;
    p.color = o.color ?? fxColors()[0];
    this.afterEmit();
  }

  /** Expanding ring stroke. Cheap, so it is the reduced-motion stand-in for confetti. */
  ringPulse(o: RingPulseOptions): void {
    if (!this.emitReady()) return;
    const p = this.spawn();
    p.shape = 'ring';
    p.x = o.x;
    p.y = o.y;
    p.size = o.radius ?? 56;
    p.life = reducedMotion() ? 0.4 : 0.6;
    p.color = o.color ?? fxColors()[1];
    this.afterEmit();
  }

  /** Gold coins arcing up and falling back — for coin/stake payouts. */
  coinFountain(o: CoinFountainOptions): void {
    if (!this.emitReady()) return;
    const reduced = reducedMotion();
    const count = reduced ? Math.min(6, o.count ?? 6) : (o.count ?? 18);
    const color = o.color ?? fxColors()[1];
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
      const v = rand(420, 700) * (reduced ? 0.5 : 1);
      p.shape = 'coin';
      p.x = o.x + rand(-6, 6);
      p.y = o.y;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.ay = 1500;
      p.drag = 0.995;
      p.rot = Math.random() * TWO_PI;
      p.av = rand(6, 14) * (Math.random() < 0.5 ? -1 : 1);
      p.life = reduced ? 0.45 : rand(1.0, 1.4);
      p.size = rand(5, 8);
      p.color = color;
    }
    this.afterEmit();
  }
}

/** Shared engine — one canvas per page. */
export const particles = new ParticleEngine();
