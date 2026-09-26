/**
 * three/kit.tsx — shared helpers for the four scenes (lazy chunk only; imports three/fiber/rapier).
 *
 * The LAL FEETA look in 3D: flat token colours in a three-band toon ramp (the lit face IS the token
 * colour), ink outlines by inverted hull, hard offset "print" shadows, canvas-drawn decals (stamps,
 * ₹ faces, verdict flags) — no network textures. Rapier bodies are created through the raw world API
 * (`useRapier().world`) and synced to instanced meshes by hand: exact control of the fixed 1/60 step,
 * the reduced-motion "step to rest", and freezing.
 */
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { useRapier } from '@react-three/rapier';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useEffect, useLayoutEffect, useMemo, type DependencyList } from 'react';
import { hash32 } from '../ui/seed';

export type RapierCtx = ReturnType<typeof useRapier>;
export type RWorld = RapierCtx['world'];
export type RNS = RapierCtx['rapier'];
export type RBody = ReturnType<RWorld['createRigidBody']>;

export const STEP = 1 / 60;

// ---- small maths ----------------------------------------------------------------------------------------

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeInCubic = (t: number) => Math.pow(clamp(t, 0, 1), 3);
export const easeInOut = (t: number) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const deg = (d: number) => (d * Math.PI) / 180;

/** Seeded PRNG (mulberry32) from a string: the same layout for the same data, every time. */
export function seeded(seed: string): () => number {
  let a = hash32(seed) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Memoise a disposable three resource and dispose it when deps change or on unmount. */
export function useDisposable<T extends { dispose(): void }>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

// ---- materials ------------------------------------------------------------------------------------------

let ramp: THREE.DataTexture | null = null;
/** Three hard bands (shade / side / lit). With <Lights/>, a lit face renders exactly its token colour. */
export function toonRamp(): THREE.DataTexture {
  if (ramp) return ramp;
  ramp = new THREE.DataTexture(new Uint8Array([90, 171, 255]), 3, 1, THREE.RedFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

export function toon(params: THREE.MeshToonMaterialParameters = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ gradientMap: toonRamp(), ...params });
}

/** Ink outline by inverted hull: back faces pushed out along smooth normals (use `hullGeometry`). */
export function outlineMaterial(thickness: number): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n  transformed += normalize(normal) * ${thickness.toFixed(4)};`,
    );
  };
  m.customProgramCacheKey = () => `h-outline-${thickness.toFixed(4)}`;
  return m;
}

/** Position-only copy with welded vertices and smooth normals, for a gap-free outline hull. */
export function hullGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', source.getAttribute('position').clone());
  if (source.index) g.setIndex(source.index.clone());
  const nonIndexed = g.index ? g.toNonIndexed() : g;
  // Weld by rounding positions, then average face normals per welded vertex.
  const pos = nonIndexed.getAttribute('position');
  const key = (i: number) => `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
  const sums = new Map<string, THREE.Vector3>();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
    for (let k = 0; k < 3; k++) {
      const id = key(i + k);
      const s = sums.get(id) ?? new THREE.Vector3();
      s.add(n);
      sums.set(id, s);
    }
  }
  const normals = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const s = sums.get(key(i));
    const v = s && s.lengthSq() > 0 ? s.clone().normalize() : new THREE.Vector3(0, 1, 0);
    normals.set([v.x, v.y, v.z], i * 3);
  }
  nonIndexed.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (nonIndexed !== g) g.dispose();
  return nonIndexed;
}

/** Give a geometry a flat vertex colour (for merging multi-colour static parts into one draw call). */
export function paint(geometry: THREE.BufferGeometry, color: THREE.Color): THREE.BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g !== geometry) geometry.dispose();
  const count = g.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set([color.r, color.g, color.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  return g;
}

/** Merge painted parts (all non-indexed with position/normal/uv/color). */
export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) throw new Error('merge failed');
  return merged;
}

/** Place a geometry: translate / rotate (Euler, radians) in place. */
export function place(g: THREE.BufferGeometry, pos: [number, number, number], rot?: [number, number, number]): THREE.BufferGeometry {
  if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])));
  g.translate(pos[0], pos[1], pos[2]);
  return g;
}

/** Lights tuned to the toon ramp: lit faces = token colour, sides ≈ 85 %, shade ≈ 71 %. */
export function Lights() {
  return (
    <>
      <ambientLight intensity={1.73} />
      <directionalLight position={[-3, 7, 5]} intensity={1.43} />
    </>
  );
}

// ---- camera ---------------------------------------------------------------------------------------------

/**
 * Fit a box in view from direction `dir` (from the box centre towards the camera), for any canvas
 * aspect: a phone's narrow box and a desktop's wide one frame the same object. `shift` moves the
 * framed box inside the canvas ([-1..1] of the free space on each axis).
 */
export function FitCamera({
  center,
  size,
  dir,
  margin = 1.06,
}: {
  center: [number, number, number];
  size: [number, number, number];
  dir: [number, number, number];
  margin?: number;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  const [dx, dy, dz] = dir;
  useLayoutEffect(() => {
    const aspect = width / Math.max(1, height);
    const vf = THREE.MathUtils.degToRad(camera.fov);
    const tv = Math.tan(vf / 2);
    const th = tv * aspect;
    const d = new THREE.Vector3(dx, dy, dz).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize();
    const up = new THREE.Vector3().crossVectors(d, right).normalize();
    let dist = 0;
    const corner = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
      corner.set(((i & 1) * 2 - 1) * (sx / 2), (((i >> 1) & 1) * 2 - 1) * (sy / 2), (((i >> 2) & 1) * 2 - 1) * (sz / 2));
      const x = Math.abs(corner.dot(right));
      const y = Math.abs(corner.dot(up));
      const z = corner.dot(d);
      dist = Math.max(dist, z + x / th, z + y / tv);
    }
    dist *= margin;
    camera.position.set(cx + d.x * dist, cy + d.y * dist, cz + d.z * dist);
    camera.up.set(0, 1, 0);
    camera.lookAt(cx, cy, cz);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, width, height, cx, cy, cz, sx, sy, sz, dx, dy, dz, margin, invalidate]);
  return null;
}

// ---- canvas textures --------------------------------------------------------------------------------------

function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Relative luminance of a CSS colour (for picking the lighter of two tokens). */
export function luminance(css: string): number {
  const c = new THREE.Color();
  try {
    c.setStyle(css);
  } catch {
    return 0;
  }
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/**
 * A manila packet with a red-tape band (TIJORI's bundle of 10, TARAZU's file-block weight). The body
 * takes the lighter of the two manila tokens and the edge the darker, so packets read inside a dark
 * safe at night as well as by day.
 */
export function packetTexture(manilaA: string, manilaB: string, tape: string): THREE.CanvasTexture {
  const [manila, edge] = luminance(manilaA) >= luminance(manilaB) ? [manilaA, manilaB] : [manilaB, manilaA];
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = manila;
    g.fillRect(0, 0, 128, 64);
    g.strokeStyle = edge;
    g.lineWidth = 6;
    g.strokeRect(3, 3, 122, 58);
    g.fillStyle = tape;
    g.fillRect(56, 0, 16, 64);
  }
  return canvasTexture(c);
}

/** A coin face: brass disc, inner ring and ₹ (mono font). */
export function coinFaceTexture(brass: string, ink: string, font: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const t = canvasTexture(c);
  const draw = () => {
    const g = c.getContext('2d');
    if (!g) return;
    g.fillStyle = brass;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = ink;
    g.lineWidth = 7;
    g.beginPath();
    g.arc(64, 64, 50, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = ink;
    g.font = `700 64px ${font}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('₹', 64, 68);
    t.needsUpdate = true;
  };
  draw();
  void document.fonts?.load(`700 64px ${font}`, '₹').then(draw, () => undefined);
  return t;
}

export type Verdict = 'pass' | 'fail' | 'wait';

/** A verdict flag: solid fill with the icon twin (✓ / ✕ / hourglass) in the -ink colour. */
export function verdictTexture(kind: Verdict, fill: string, ink: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = fill;
    g.fillRect(0, 0, 64, 64);
    if (kind === 'fail') {
      // The hatching twin (wrong-chosen options are hatched too).
      g.strokeStyle = ink;
      g.globalAlpha = 0.25;
      g.lineWidth = 3;
      for (let x = -64; x < 128; x += 10) {
        g.beginPath();
        g.moveTo(x, 64);
        g.lineTo(x + 64, 0);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    g.save();
    g.translate(14, 14);
    g.scale(36 / 24, 36 / 24);
    g.strokeStyle = ink;
    g.lineWidth = 3.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const d of ICON_PATHS[kind]) g.stroke(new Path2D(d));
    g.restore();
  }
  return canvasTexture(c);
}

/** Two glints on glass (white stripes on transparent). */
export function glintTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = 'white';
    g.globalAlpha = 0.55;
    g.beginPath();
    g.moveTo(18, 128);
    g.lineTo(46, 128);
    g.lineTo(118, 0);
    g.lineTo(90, 0);
    g.closePath();
    g.fill();
    g.globalAlpha = 0.35;
    g.beginPath();
    g.moveTo(58, 128);
    g.lineTo(66, 128);
    g.lineTo(128, 18);
    g.lineTo(128, 4);
    g.closePath();
    g.fill();
  }
  return canvasTexture(c);
}

// Lucide paths (ISC), 24×24 viewBox — the same icons the 2D stamps use.
export const ICON_PATHS: Record<'pass' | 'fail' | 'wait' | 'noted', string[]> = {
  pass: ['M20 6 9 17l-5-5'],
  fail: ['M18 6 6 18', 'm6 6 12 12'],
  wait: [
    'M5 22h14',
    'M5 2h14',
    'M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22',
    'M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2',
  ],
  noted: [
    'M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13',
    'M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z',
    'M5 22h14',
  ],
};

export type StampKindName = 'pass' | 'fail' | 'wait' | 'noted';

/**
 * The stamp impression, drawn the way ui/stamp.css draws `h-stamp` (size l): 26px Akshar 700 caps,
 * 3px border, 1.5px outline 2px out, radius --h-r-s, icon + word. Returns the texture and its size in
 * CSS px (outline included) so the decal can match the 2D stamp it hands over to.
 */
export function stampTexture(opts: {
  text: string;
  kind: StampKindName;
  color: string;
  font: string;
  fontPx?: number;
  trackEm?: number;
  radiusPx?: number;
  /** The 2D stamp's own line breaks and border-box size (measured from the DOM), when known. */
  lines?: string[];
  box?: { w: number; h: number };
}): { texture: THREE.CanvasTexture; width: number; height: number; ready: Promise<void> } {
  const F = opts.fontPx ?? 26;
  const track = (opts.trackEm ?? 0.08) * F;
  const radius = opts.radiusPx ?? 8;
  const S = 3; // raster scale
  const M = 4; // outline margin (2px offset + 1.5px line)
  const border = 3;
  const words = opts.text.toUpperCase();
  const lines = opts.lines?.length ? opts.lines.map((l) => l.toUpperCase()) : [words];
  const fontSpec = `700 ${F}px ${opts.font}`;
  const c = document.createElement('canvas');
  const texture = canvasTexture(c);
  const measure = (g: CanvasRenderingContext2D, line: string) => {
    g.font = fontSpec;
    let w = 0;
    for (const ch of line) w += g.measureText(ch).width + track;
    return w;
  };
  const probe = document.createElement('canvas').getContext('2d');
  const textW = Math.max(...lines.map((l) => (probe ? measure(probe, l) : l.length * F * 0.55)));
  const padX = 0.45 * F;
  const padY = 0.12 * F;
  const gap = 0.3 * F;
  const lineH = 1.05 * F;
  const boxW = opts.box?.w ?? border * 2 + padX * 2 + F + gap + textW;
  const boxH = opts.box?.h ?? border * 2 + padY * 2 + lineH * lines.length;
  const width = boxW + M * 2;
  const height = boxH + M * 2;
  c.width = Math.ceil(width * S);
  c.height = Math.ceil(height * S);
  const draw = () => {
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(S, 0, 0, S, 0, 0);
    g.clearRect(0, 0, width, height);
    g.strokeStyle = opts.color;
    g.fillStyle = opts.color;
    // Border.
    g.lineWidth = border;
    g.beginPath();
    g.roundRect(M + border / 2, M + border / 2, boxW - border, boxH - border, radius);
    g.stroke();
    // Outline, 2px outside the border box.
    g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect(M - 2.75, M - 2.75, boxW + 5.5, boxH + 5.5, radius + 2.75);
    g.stroke();
    // Icon (1em, stroke 3 in a 24 box).
    const ix = M + border + padX;
    const iy = M + boxH / 2 - F / 2;
    g.save();
    g.translate(ix, iy);
    g.scale(F / 24, F / 24);
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const d of ICON_PATHS[opts.kind]) g.stroke(new Path2D(d));
    g.restore();
    // Words, line by line, the block centred like the flex item it copies.
    g.font = fontSpec;
    g.textBaseline = 'middle';
    const top = M + boxH / 2 - (lineH * lines.length) / 2;
    lines.forEach((line, k) => {
      let x = ix + F + gap;
      const y = top + lineH * (k + 0.5) + F * 0.04;
      for (const ch of line) {
        g.fillText(ch, x, y);
        x += g.measureText(ch).width + track;
      }
    });
    texture.needsUpdate = true;
  };
  draw();
  const ready = (document.fonts?.load(fontSpec, lines.join(' ')) ?? Promise.resolve([])).then(
    () => draw(),
    () => undefined,
  );
  return { texture, width, height, ready };
}

// ---- physics helpers -------------------------------------------------------------------------------------

/** "Landed" = was falling fast, now isn't (first contact of a drop). One event per fall. */
export class LandingWatch {
  private falling = new Set<number>();
  constructor(private readonly fast = 1.4) {}
  check(key: number, vy: number): boolean {
    if (vy < -this.fast) {
      this.falling.add(key);
      return false;
    }
    if (this.falling.has(key) && vy > -0.4) {
      this.falling.delete(key);
      return true;
    }
    return false;
  }
}

/** Throttle for cues: at most `perSecond` plays. */
export function pacer(perSecond: number) {
  let last = -Infinity;
  return (now: number) => {
    if (now - last < 1000 / perSecond) return false;
    last = now;
    return true;
  };
}

/** Copy a body's pose into a matrix (with an optional local offset/scale). */
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
export function bodyMatrix(body: RBody, out: THREE.Matrix4, scale?: THREE.Vector3): THREE.Matrix4 {
  const t = body.translation();
  const r = body.rotation();
  _p.set(t.x, t.y, t.z);
  _q.set(r.x, r.y, r.z, r.w);
  return out.compose(_p, _q, scale ?? _s);
}

/** All given bodies asleep (or parked). */
export function allAsleep(bodies: RBody[]): boolean {
  for (const b of bodies) if (!b.isSleeping() && b.isEnabled()) return false;
  return true;
}
