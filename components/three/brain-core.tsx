'use client';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSceneState } from './scene-frame';
import { PALETTE, clamp, hash01, mixHex, useDisposable } from './shared';

export interface BrainCoreProps {
  /** Hex accent; the middle yellow of the hero stays whatever the Locker says. */
  accent: string;
  /** Level-driven brightness from the orb scene. Unchanged meaning. */
  brightness: number;
  /** prefers-reduced-motion: pose one designed static frame and never tick. */
  reduced: boolean;
  /** 0..1 landed-conviction heat. Decoration only — never a score, never a pending stake. */
  heat?: number;
  /** 0..1 unlock progress. Below 1 the brain is a ghost inside the old core. Default 0. */
  unlock?: number;
  /** Play the 2.6 s wake sequence once. Default false. */
  ceremony?: boolean;
  /** Mesh subdivision level. Default 4. */
  detail?: 3 | 4;
}

// ---------------------------------------------------------------------------
// Perlin noise
// ---------------------------------------------------------------------------

// Ken Perlin's improved gradient hash, with the permutation shuffled from the repo's own hash01 so
// the brain is byte-identical on every device and every reload — the cavity map is baked from this
// field, so a drifting table would mean a differently-shaded brain per session.
const PERM = (() => {
  const source = new Uint8Array(256);
  for (let i = 0; i < 256; i++) source[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(hash01(i * 3 + 7) * (i + 1));
    const swap = source[i];
    source[i] = source[j];
    source[j] = swap;
  }
  const table = new Uint8Array(512);
  for (let i = 0; i < 512; i++) table[i] = source[i & 255];
  return table;
})();

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin(x: number, y: number, z: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const zi = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);
  const a = PERM[xi] + yi;
  const aa = PERM[a] + zi;
  const ab = PERM[a + 1] + zi;
  const b = PERM[xi + 1] + yi;
  const ba = PERM[b] + zi;
  const bb = PERM[b + 1] + zi;
  return mix(
    mix(
      mix(grad(PERM[aa], xf, yf, zf), grad(PERM[ba], xf - 1, yf, zf), u),
      mix(grad(PERM[ab], xf, yf - 1, zf), grad(PERM[bb], xf - 1, yf - 1, zf), u),
      v,
    ),
    mix(
      mix(grad(PERM[aa + 1], xf, yf, zf - 1), grad(PERM[ba + 1], xf - 1, yf, zf - 1), u),
      mix(grad(PERM[ab + 1], xf, yf - 1, zf - 1), grad(PERM[bb + 1], xf - 1, yf - 1, zf - 1), u),
      v,
    ),
    w,
  );
}

// ---------------------------------------------------------------------------
// Indexed icosphere (midpoint-cache subdivision)
// ---------------------------------------------------------------------------

/**
 * Hand-rolled because three's PolyhedronGeometry emits non-indexed geometry: welding it back with
 * BufferGeometryUtils.mergeVertices measured at 10.64 ms of a 14.6 ms build (80% of it) and pulls a
 * chunk into this route for nothing. Subdividing an indexed icosahedron emits welded geometry
 * directly, so computeVertexNormals() gives smooth normals with no weld pass at all.
 */
function icosphere(detail: number): { positions: Float32Array; index: Int32Array } {
  const t = (1 + Math.sqrt(5)) / 2;
  // Both totals are exact and known up front, so nothing here grows: one Float32Array of vertices and
  // two Int32Arrays of faces, swapped per level. The naive number[][] version spends two thirds of the
  // build allocating three-element arrays and handing them to the collector.
  const positions = new Float32Array((10 * 4 ** detail + 2) * 3);
  const base = [
    -1,
    t,
    0,
    1,
    t,
    0,
    -1,
    -t,
    0,
    1,
    -t,
    0,
    0,
    -1,
    t,
    0,
    1,
    t,
    0,
    -1,
    -t,
    0,
    1,
    -t,
    t,
    0,
    -1,
    t,
    0,
    1,
    -t,
    0,
    -1,
    -t,
    0,
    1,
  ];
  for (let i = 0; i < 12; i++) {
    const x = base[i * 3];
    const y = base[i * 3 + 1];
    const z = base[i * 3 + 2];
    const len = Math.hypot(x, y, z);
    positions[i * 3] = x / len;
    positions[i * 3 + 1] = y / len;
    positions[i * 3 + 2] = z / len;
  }
  let count = 12;

  let faces = Int32Array.of(
    0,
    11,
    5,
    0,
    5,
    1,
    0,
    1,
    7,
    0,
    7,
    10,
    0,
    10,
    11,
    1,
    5,
    9,
    5,
    11,
    4,
    11,
    10,
    2,
    10,
    7,
    6,
    7,
    1,
    8,
    3,
    9,
    4,
    3,
    4,
    2,
    3,
    2,
    6,
    3,
    6,
    8,
    3,
    8,
    9,
    4,
    9,
    5,
    2,
    4,
    11,
    6,
    2,
    10,
    8,
    6,
    7,
    9,
    8,
    1,
  );

  const cache = new Map<number, number>();
  const midpoint = (a: number, b: number) => {
    const key = a < b ? a * 100000 + b : b * 100000 + a;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const x = (positions[a * 3] + positions[b * 3]) / 2;
    const y = (positions[a * 3 + 1] + positions[b * 3 + 1]) / 2;
    const z = (positions[a * 3 + 2] + positions[b * 3 + 2]) / 2;
    const len = Math.hypot(x, y, z);
    positions[count * 3] = x / len;
    positions[count * 3 + 1] = y / len;
    positions[count * 3 + 2] = z / len;
    cache.set(key, count);
    return count++;
  };

  for (let level = 0; level < detail; level++) {
    const next = new Int32Array(faces.length * 4);
    let w = 0;
    for (let f = 0; f < faces.length; f += 3) {
      const a = faces[f];
      const b = faces[f + 1];
      const c = faces[f + 2];
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      next[w++] = a;
      next[w++] = ab;
      next[w++] = ca;
      next[w++] = b;
      next[w++] = bc;
      next[w++] = ab;
      next[w++] = c;
      next[w++] = ca;
      next[w++] = bc;
      next[w++] = ab;
      next[w++] = bc;
      next[w++] = ca;
    }
    faces = next;
    // Edges are never shared across levels, so the table starts empty each time instead of growing.
    cache.clear();
  }
  return { positions, index: faces };
}

// ---------------------------------------------------------------------------
// The brain field
// ---------------------------------------------------------------------------

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Fold frequency. 4.2 and 5.4 read as a walnut; above 7 the bands alias at 121 device px. */
const FOLD_S = 7.0;
/** Classic Perlin peaks near |0.7|, so the primary band would only ever reach two thirds of its
 *  amplitude and the midline would not cut as deep as the silhouette needs. */
const NOISE_GAIN = 1.4;
/** Keeps the field off the lattice origin, where every gradient is zero. */
const NOISE_OFFSET = [11.37, 4.19, 7.73] as const;

const unit = (x: number, y: number, z: number) => {
  const len = Math.hypot(x, y, z);
  return [x / len, y / len, z / len] as const;
};

/** Anatomy the silhouette is read from: the cerebellum bump, the stem, the temporal-lobe notch. */
const BUMPS = [
  { at: unit(-0.68, -0.62, 0), width: 0.34, amount: 0.115 },
  { at: unit(-0.2, -0.95, 0), width: 0.2, amount: 0.09 },
  { at: unit(0.22, -0.52, 0.82), width: 0.34, amount: 0.09 },
] as const;

/**
 * Radius of the brain in a unit direction. Three things here are load-bearing and none of them are
 * taste: the field samples |z| so the two hemispheres mirror exactly across the sagittal plane;
 * |noise|^p with a small p is used instead of ridged noise because the zero-set of a 3D noise field
 * is a family of closed curves — the topology of sulci — and the small exponent gives broad crowns
 * with narrow grooves rather than the coral you get from 1-|n|; and the x sample is compressed while
 * y and z are expanded so the folds elongate front-to-back like gyri instead of reading as warts.
 */
function brainField(x: number, y: number, z: number): number {
  const az = Math.abs(z);
  const n1 = clamp(
    perlin(
      x * 0.55 * FOLD_S + NOISE_OFFSET[0],
      y * 1.3 * FOLD_S + NOISE_OFFSET[1],
      az * 1.15 * FOLD_S + NOISE_OFFSET[2],
    ) * NOISE_GAIN,
    -1,
    1,
  );
  const n2 = clamp(
    perlin(
      x * 1.15 * FOLD_S + NOISE_OFFSET[1],
      y * 2.1 * FOLD_S + NOISE_OFFSET[2],
      az * 1.9 * FOLD_S + NOISE_OFFSET[0],
    ) * NOISE_GAIN,
    -1,
    1,
  );

  let r = 1 + Math.pow(Math.abs(n1), 0.5) * 0.105 + Math.pow(Math.abs(n2), 0.55) * 0.047;

  // Interhemispheric fissure. Deep enough that the radius drops ~1.14 -> ~0.85 across the midline,
  // which is the single cut that stops the shape reading as a lumpy rock.
  r -= 0.26 * Math.exp(-((az / 0.19) ** 2)) * smoothstep(-0.5, 0.05, y);

  // Sylvian fissure: obliquely up and back, on the lateral surface only, never near the midline.
  const syl = y + 0.06 - 0.3 * x;
  const lateralMask = smoothstep(0.22, 0.55, az) * smoothstep(-0.72, -0.3, x);
  r -= 0.15 * Math.exp(-((syl / 0.15) ** 2)) * lateralMask;

  // Transverse fissure: the line the cerebrum sits on above the cerebellum.
  const posteriorMask = smoothstep(-0.18, -0.52, x);
  r -= 0.11 * Math.exp(-(((y + 0.3) / 0.085) ** 2)) * posteriorMask;

  for (const bump of BUMPS) {
    const dx = x - bump.at[0];
    const dy = y - bump.at[1];
    const dz = az - bump.at[2];
    r += bump.amount * Math.exp(-(dx * dx + dy * dy + dz * dz) / (bump.width * bump.width));
  }
  return r;
}

// ---------------------------------------------------------------------------
// Geometry build + module-level cache
// ---------------------------------------------------------------------------

/** One ~150 KB buffer for the app's lifetime beats rebuilding on every remount, so this deliberately
 *  does not go through useDisposable and is never disposed. */
const CACHE = new Map<number, THREE.BufferGeometry>();

function buildBrain(detail: number): THREE.BufferGeometry {
  const { positions, index } = icosphere(detail);
  const count = positions.length / 3;
  const shaped = new Float32Array(positions.length);
  const field = new Float32Array(count);
  const flow = new Float32Array(count);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minFlow = Infinity;
  let maxFlow = -Infinity;

  for (let i = 0; i < count; i++) {
    const dx = positions[i * 3];
    const dy = positions[i * 3 + 1];
    const dz = positions[i * 3 + 2];
    const r = brainField(dx, dy, dz);
    field[i] = r;

    const px = dx * r * 1.18;
    let py = dy * r * 0.8;
    let pz = dz * r * 0.9;

    // The frontal pole is narrower and lower than the parietal vault.
    const taper = smoothstep(0.3, 1.2, px);
    pz *= 1 - 0.2 * taper;
    py *= 1 - 0.1 * taper;
    // A brain sits on the skull base; its inferior surface is flat, not a hemisphere.
    py += 0.14 * smoothstep(-0.55, -0.95, py);
    // ...and the vault carries higher over the parietal than an ellipsoid would.
    py += 0.05 * smoothstep(0.3, 0.7, py) * smoothstep(0.85, -0.1, px);

    shaped[i * 3] = px;
    shaped[i * 3 + 1] = py;
    shaped[i * 3 + 2] = pz;

    // Anterior-posterior with a slight upward tilt, so the low end lands on the stem rather than on
    // the occipital pole: this is the axis the travelling pulse runs along.
    const f = px * 0.94 + py * 0.34;
    flow[i] = f;
    if (f < minFlow) minFlow = f;
    if (f > maxFlow) maxFlow = f;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  // Centre it where the sphere it replaces was, then normalise so the long half-extent is exactly 1
  // and the caller's scale reads in world units.
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = Math.max(maxX - cx, cx - minX);
  const norm = 1 / half;
  for (let i = 0; i < count; i++) {
    shaped[i * 3] = (shaped[i * 3] - cx) * norm;
    shaped[i * 3 + 1] = (shaped[i * 3 + 1] - cy) * norm;
    shaped[i * 3 + 2] *= norm;
  }

  // The cavity map. There is no bloom, no shadow pass and no AO in this project, so a narrow deep
  // groove is invisible with diffuse + emissive alone — nothing darkens it. Percentile-stretch the
  // captured displacement rather than min/max it: the fissure is a long tail that would otherwise
  // push 65% of the vertices into the top decile and flatten the whole thing back into a blob.
  const sorted = Float32Array.from(field).sort();
  const lo = sorted[Math.floor(0.03 * (count - 1))];
  const hi = sorted[Math.floor(0.8 * (count - 1))];
  const span = hi - lo || 1;
  const colors = new Float32Array(count * 3);
  const spread = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const shade = 0.18 + clamp((field[i] - lo) / span, 0, 1);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
    spread[i] = (flow[i] - minFlow) / (maxFlow - minFlow || 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(shaped, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aFlow', new THREE.BufferAttribute(spread, 1));
  geometry.setIndex(
    count > 65535 ? new THREE.Uint32BufferAttribute(index, 1) : new THREE.Uint16BufferAttribute(index, 1),
  );
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** The brain mesh at a subdivision level, built at most once per page load. */
export function brainGeometry(detail: number): THREE.BufferGeometry {
  const level = clamp(Math.round(detail), 2, 5);
  const hit = CACHE.get(level);
  if (hit) return hit;
  const built = buildBrain(level);
  CACHE.set(level, built);
  return built;
}

// ---------------------------------------------------------------------------
// Pulse constants
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;
/** Long half-extent in world units: +24% on the 0.66-radius sphere it replaces, still no larger than
 *  a big app icon at 121 device px. */
const BRAIN_SCALE = 0.82;
/** Emissive comes down from the old core's 0.42 so the cavity map survives. */
const EMISSIVE_BASE = 0.3;
const REST_RATE = 0.27;
/** WCAG 2.3.1. Half the three-flashes-per-second general limit, and a hard ceiling: the travelling
 *  wave carries the perceived speed at high heat, which is why the rate never has to go higher. */
const MAX_RATE = 1.5;
/** Constant on purpose. The pulse never deepens with heat — only the rate and the wave move. */
const PULSE_DEPTH = 0.25;
const SCALE_REST = 0.012;
const SCALE_GAIN = 0.014;
const WAVE_AMP = 0.16;
const WAVE_SPEED = 1.6;
const RIM = 0.5;
/** The ember mix stops well short of saturated red; WCAG has a separate red-flash rule. */
const EMBER_MAX = 0.3;
/** Below this the brain is not built at all; at or above it, it forms inside the old core. */
const GHOST_UNLOCK = 0.5;
const GHOST_DETAIL = 3;
const GHOST_SCALE = 0.55;
const CEREMONY_S = 2.6;
/** The old core, preserved verbatim for the locked state: below two modes played this is exactly
 *  today's scene, down to the 1.7 rad/s breath. */
const CORE_EMISSIVE = 0.42;
const CORE_OPACITY = 0.55;

const rateFor = (heat: number) => REST_RATE + (MAX_RATE - REST_RATE) * Math.pow(heat, 0.75);

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

const FRAGMENT_DECLARATIONS = `
uniform float uTime;
uniform float uRate;
uniform float uWaveAmp;
uniform float uRim;
uniform vec3 uRimColor;
varying float vFlow;
`;

// color_fragment.glsl is `diffuseColor *= vColor;` — vertex colours modulate diffuse only, while
// totalEmissiveRadiance comes straight off a uniform. Left alone, the emissive floods every sulcus
// flat and cancels the cavity map, so the glow is modulated by vColor here too. The fresnel rim buys
// the silhouette back without the second BackSide shell, which was a sphere and could never hug this.
const EMISSIVE_PATCH = `
#include <emissivemap_fragment>
totalEmissiveRadiance *= vColor;
float fres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);
totalEmissiveRadiance += uRimColor * fres * uRim;
float wave = 0.5 + 0.5 * sin(vFlow * 6.2831 * 1.8 - uTime * uRate);
totalEmissiveRadiance *= 1.0 + uWaveAmp * wave;
`;

interface BrainUniforms {
  uTime: { value: number };
  uRate: { value: number };
  uWaveAmp: { value: number };
  uRim: { value: number };
  uRimColor: { value: THREE.Color };
}

function makeBrainMaterial(uniforms: BrainUniforms): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    metalness: 0.35, // wet tissue, not chrome
    roughness: 0.42,
    emissive: new THREE.Color(),
    emissiveIntensity: EMISSIVE_BASE,
    envMapIntensity: 1.1,
    vertexColors: true,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uRate = uniforms.uRate;
    shader.uniforms.uWaveAmp = uniforms.uWaveAmp;
    shader.uniforms.uRim = uniforms.uRim;
    shader.uniforms.uRimColor = uniforms.uRimColor;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aFlow;\nvarying float vFlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFlow = aFlow;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>${FRAGMENT_DECLARATIONS}`)
      .replace('#include <emissivemap_fragment>', EMISSIVE_PATCH);
  };
  material.customProgramCacheKey = () => 'fd-brain-v1';
  return material;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * The hero's inner core. Replaces the sphere + BackSide halo with one displaced, cavity-shaded mesh
 * whose emissive breathes and whose glow travels stem -> frontal pole.
 *
 * What it cannot see is the point: `heat` arrives as a plain number already computed by lib/heat.mjs
 * from calls that have already landed. There is no progression object here, no room, no confidence
 * state — the pending stake and the tier selected on the card in front of the player are
 * structurally unreachable, so "the pulse never reads an open position" is enforced, not promised.
 */
export function BrainCore({
  accent,
  brightness,
  reduced,
  heat = 0,
  unlock = 0,
  ceremony = false,
  detail = 4,
}: BrainCoreProps) {
  const invalidate = useThree((state) => state.invalidate);
  const { inView } = useSceneState();

  const target = clamp(heat, 0, 1);
  const progress = clamp(unlock, 0, 1);
  const awake = progress >= 1;
  const forming = !awake && progress >= GHOST_UNLOCK;
  const level = awake ? detail : GHOST_DETAIL;

  const [playing, setPlaying] = useState(false);
  const started = useRef(false);
  const elapsed = useRef(0);
  const showCore = !awake || playing;

  // Gate the build on first visibility so a hero scrolled past never pays for it. SceneFrame already
  // holds its skeleton over the canvas until the first drawn frame, so the one-shot build lands
  // behind an existing loading state rather than as a dropped frame in a running loop.
  const geometry = useMemo(
    () => ((awake || forming) && (inView || CACHE.has(level)) ? brainGeometry(level) : null),
    [level, inView, awake, forming],
  );

  const uniforms = useMemo<BrainUniforms>(
    () => ({
      uTime: { value: 0 },
      uRate: { value: TAU * REST_RATE * WAVE_SPEED },
      uWaveAmp: { value: 0 },
      uRim: { value: RIM },
      uRimColor: { value: new THREE.Color() },
    }),
    [],
  );

  // Deps [] on purpose: an accent change must mutate the material, not rebuild it, or every Locker
  // swap recompiles the shader and hitches the hero. Same pattern as GlowSprite.
  const material = useDisposable(() => makeBrainMaterial(uniforms), []);
  const coreGeometry = useDisposable(() => new THREE.SphereGeometry(0.66, 48, 32), []);
  const haloGeometry = useDisposable(() => new THREE.SphereGeometry(0.76, 32, 24), []);
  const coreMaterial = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        metalness: 0.9,
        roughness: 0.25,
        emissive: new THREE.Color(),
        emissiveIntensity: CORE_EMISSIVE,
        envMapIntensity: 1.3,
      }),
    [],
  );
  const haloMaterial = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    [],
  );

  const brain = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const damped = useRef(target);
  const pulse = useRef(0);
  const wave = useRef(0);

  useEffect(() => {
    material.color.set(mixHex(accent, PALETTE.midnight, 0.55));
    material.emissive.set(mixHex(accent, PALETTE.ember, EMBER_MAX * target));
    uniforms.uRimColor.value.set(accent);
    coreMaterial.color.set(mixHex(accent, PALETTE.midnight, 0.6));
    coreMaterial.emissive.set(accent);
    haloMaterial.color.set(accent);
  }, [material, coreMaterial, haloMaterial, uniforms, accent, target]);

  useEffect(() => {
    coreMaterial.transparent = forming || playing;
    coreMaterial.opacity = forming || playing ? CORE_OPACITY : 1;
    coreMaterial.emissiveIntensity = brightness * CORE_EMISSIVE;
  }, [coreMaterial, forming, playing, brightness]);

  // The resting pose, and under reduced motion the only pose there will ever be: the mean, never a
  // peak — no sine term, no scale offset, no wave. Heat is still expressed there, but as brightness,
  // so a player whose calls are landing gets a brighter brain and never a faster one.
  useEffect(() => {
    brain.current?.scale.setScalar(BRAIN_SCALE * (awake && !playing ? 1 : GHOST_SCALE));
    core.current?.scale.setScalar(1);
    if (!reduced) return;
    material.emissiveIntensity = brightness * EMISSIVE_BASE * (1 + 0.18 * target);
    uniforms.uWaveAmp.value = 0;
    uniforms.uRim.value = RIM;
  }, [material, uniforms, reduced, brightness, target, awake, playing, geometry]);

  // frameloop is 'demand' under reduced motion, so nothing repaints when heat or the unlock state
  // changes unless we ask for it.
  useEffect(() => invalidate(), [invalidate, heat, reduced, unlock]);

  useEffect(() => {
    if (!ceremony || reduced || started.current) return;
    started.current = true;
    elapsed.current = 0;
    setPlaying(true);
  }, [ceremony, reduced]);

  useFrame(({ clock }, dt) => {
    if (reduced) return;
    const d = Math.min(dt, 1 / 30);

    let wake = 1;
    let coreFade = forming ? CORE_OPACITY : 1;
    let coreScale = 1;
    let coreGlow = 1;
    let rim = RIM;

    if (playing) {
      elapsed.current += d;
      const t = elapsed.current;
      if (t < 0.5) {
        // An inhale.
        const k = t / 0.5;
        coreGlow = 1 + 1.5 * k;
        coreScale = 1 + 0.06 * k;
        coreFade = CORE_OPACITY;
        wake = GHOST_SCALE;
      } else if (t < 1.1) {
        const k = (t - 0.5) / 0.6;
        coreGlow = 2.5;
        coreScale = 1.06 + 0.19 * k;
        coreFade = CORE_OPACITY * (1 - k);
        wake = GHOST_SCALE + (1 - GHOST_SCALE) * k;
      } else {
        coreFade = 0;
        coreScale = 1.25;
        // Rim leads the first full pulse in, then settles.
        rim = RIM * (1 + 0.9 * Math.sin(Math.PI * clamp((t - 1.1) / (CEREMONY_S - 1.1), 0, 1)));
      }
      if (t >= CEREMONY_S) setPlaying(false);
    } else if (forming) {
      wake = GHOST_SCALE;
    }

    damped.current = THREE.MathUtils.damp(damped.current, target, 1.6, d);
    const hot = damped.current;
    // The ceremony's own beat is the resting one: a wake is not a hot run.
    const rate = playing ? REST_RATE : rateFor(hot);

    // Integrate the phase rather than multiplying a clock by a changing rate — heat damps over ~0.6 s
    // and a rate change against absolute time would jump the pulse mid-beat.
    pulse.current = (pulse.current + TAU * rate * d) % TAU;
    const swing = Math.sin(pulse.current);

    material.emissiveIntensity = brightness * EMISSIVE_BASE * (1 + PULSE_DEPTH * swing);
    material.emissive.set(mixHex(accent, PALETTE.ember, EMBER_MAX * hot));

    const waveRate = TAU * rate * WAVE_SPEED;
    wave.current = (wave.current + waveRate * d) % TAU;
    uniforms.uRate.value = waveRate;
    uniforms.uTime.value = wave.current / waveRate;
    uniforms.uWaveAmp.value = playing
      ? WAVE_AMP * hot * clamp((elapsed.current - 1.8) / 0.8, 0, 1)
      : WAVE_AMP * hot;
    uniforms.uRim.value = rim;

    brain.current?.scale.setScalar(BRAIN_SCALE * wake * (1 + (SCALE_REST + SCALE_GAIN * hot) * swing));
    if (core.current) {
      const t = clock.elapsedTime;
      // The locked core keeps its own breath so 0-1 modes is exactly today's scene.
      const idle = showCore && !playing;
      coreMaterial.emissiveIntensity =
        brightness * CORE_EMISSIVE * coreGlow * (idle ? 1 + 0.25 * Math.sin(t * 1.7) : 1);
      coreMaterial.opacity = coreFade;
      coreMaterial.transparent = coreFade < 1;
      core.current.scale.setScalar(coreScale * (idle ? 1 + 0.018 * Math.sin(t * 1.7 + 0.5) : 1));
    }
  });

  return (
    <group>
      {/* A fixed three-quarter turn, not a spin: the lateral silhouette and the midline groove are the
          only two things that read at 121 device px, and this is the one orientation showing both.
          The rig parallax at hero-orb.tsx is still the only thing that moves it. */}
      {geometry ? (
        <mesh ref={brain} geometry={geometry} material={material} rotation={[0.12, -0.62, 0.05]} />
      ) : null}
      {showCore ? (
        <group>
          <mesh ref={core} geometry={coreGeometry} material={coreMaterial} />
          <mesh geometry={haloGeometry} material={haloMaterial} />
        </group>
      ) : null}
    </group>
  );
}

export default BrainCore;
