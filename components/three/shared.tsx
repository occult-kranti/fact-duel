'use client';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei/core/Environment';
import { Lightformer } from '@react-three/drei/core/Lightformer';
import { memo, useEffect, useLayoutEffect, useMemo, type DependencyList } from 'react';

export type { LazySceneProps } from './lazy-scene';

/** Default palette (hex strings). */
export const PALETTE = {
  midnight: '#0b0f14',
  volt: '#d4ff3a',
  gold: '#ffc83d',
  cyan: '#4ee1ff',
  magenta: '#ff5ea8',
  bronze: '#d4874a',
  silver: '#dfe5ec',
  ember: '#ff6a2e',
} as const;

/** Memoise a disposable three resource and dispose it when deps change or on unmount. */
export function useDisposable<T extends { dispose(): void }>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/** Blend two hex colours (in linear space) and return a hex string. */
export function mixHex(a: string, b: string, t: number): string {
  return `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;
}

const GLOW_STOPS: Array<[number, string]> = [
  [0, 'rgba(255,255,255,1)'],
  [0.22, 'rgba(255,255,255,0.55)'],
  [0.55, 'rgba(255,255,255,0.14)'],
  [1, 'rgba(255,255,255,0)'],
];

/** Procedural radial-gradient sprite texture (no network). */
export function makeRadialTexture(
  size = 128,
  stops: Array<[number, string]> = GLOW_STOPS,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function useRadialTexture(size = 128): THREE.CanvasTexture {
  return useDisposable(() => makeRadialTexture(size), [size]);
}

/** Scale factor that keeps a design width (world units at z=0) inside narrow viewports. */
export function useViewportScale(designWidth: number, min = 0.55): number {
  const width = useThree((state) => state.viewport.width);
  return Math.min(1, Math.max(min, width / designWidth));
}

/** Point the default camera at a target once (R3F only positions it). */
export function LookAt({ target }: { target: [number, number, number] }) {
  const camera = useThree((state) => state.camera);
  const [x, y, z] = target;
  useLayoutEffect(() => {
    camera.lookAt(x, y, z);
    camera.updateProjectionMatrix();
  }, [camera, x, y, z]);
  return null;
}

export interface GlowSpriteProps {
  color: string;
  scale?: number;
  opacity?: number;
  position?: [number, number, number];
}

/** Additive radial glow billboard; sits behind the subject so the subject occludes its centre. */
export function GlowSprite({ color, scale = 3, opacity = 0.5, position = [0, 0, -0.6] }: GlowSpriteProps) {
  const map = useRadialTexture(128);
  const material = useDisposable(
    () =>
      new THREE.SpriteMaterial({
        map,
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [map],
  );
  useEffect(() => {
    material.color.set(color);
    material.opacity = opacity;
  }, [material, color, opacity]);
  return <sprite material={material} scale={scale} position={position} />;
}

export interface StudioLightsProps {
  accent?: string;
  intensity?: number;
  rim?: string;
  fill?: string;
}

/** Three coloured lights + a warm key: the shared "knowledge arena" rig. */
export const StudioLights = memo(function StudioLights({
  accent = PALETTE.volt,
  intensity = 1,
  rim = PALETTE.cyan,
  fill = PALETTE.magenta,
}: StudioLightsProps) {
  return (
    <>
      <ambientLight intensity={0.35 * intensity} color="#9fb4cc" />
      <directionalLight position={[2.5, 4, 3]} intensity={2.4 * intensity} color="#fff1d6" />
      <pointLight
        position={[-3.5, 1.5, 2.5]}
        intensity={22 * intensity}
        color={rim}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[3.5, -2, -2.5]}
        intensity={16 * intensity}
        color={fill}
        distance={16}
        decay={2}
      />
      <pointLight position={[0, -3, 2.5]} intensity={8 * intensity} color={accent} distance={12} decay={2} />
    </>
  );
});

export interface StudioEnvironmentProps {
  accent?: string;
  intensity?: number;
}

/**
 * Procedural reflection environment (drei Environment portal + Lightformers,
 * rendered once into a 128px cubemap; no HDR download). Memoised so the
 * cubemap is not re-rendered when parents re-render.
 */
export const StudioEnvironment = memo(function StudioEnvironment({
  accent = PALETTE.volt,
  intensity = 1,
}: StudioEnvironmentProps) {
  return (
    <Environment frames={1} resolution={128} background={false} environmentIntensity={intensity}>
      <color attach="background" args={['#06080c']} />
      <Lightformer form="rect" intensity={5} color="#ffffff" position={[0, 5, -2]} scale={[12, 5, 1]} />
      <Lightformer form="rect" intensity={2.5} color="#fff2d0" position={[3, 2, 4]} scale={[3, 6, 1]} />
      <Lightformer form="ring" intensity={4} color={PALETTE.cyan} position={[-6, 1, 2]} scale={5} />
      <Lightformer
        form="rect"
        intensity={3}
        color={PALETTE.magenta}
        position={[6, -1, -3]}
        scale={[4, 8, 1]}
      />
      <Lightformer form="rect" intensity={2} color={accent} position={[0, -6, 2]} scale={[10, 3, 1]} />
      {/* Front softbox behind the camera: flat faces that point at the viewer reflect this. */}
      <Lightformer form="rect" intensity={3.2} color="#fff6e6" position={[0, 1.5, 7]} scale={[8, 5, 1]} />
      <Lightformer
        form="rect"
        intensity={1.6}
        color={PALETTE.cyan}
        position={[-3.5, -2, 6]}
        scale={[3, 3, 1]}
      />
    </Environment>
  );
});

/** Semi-implicit Euler spring step; mutates and returns the state. */
export function springStep(
  state: { value: number; velocity: number },
  target: number,
  dt: number,
  stiffness = 40,
  damping = 7,
): { value: number; velocity: number } {
  const accel = -stiffness * (state.value - target) - damping * state.velocity;
  state.velocity += accel * dt;
  state.value += state.velocity * dt;
  return state;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Deterministic pseudo-random in [0,1) from an integer seed (stable across renders). */
export function hash01(seed: number): number {
  let x = (seed + 1) * 374761393;
  x = (x ^ (x >>> 13)) * 1274126177;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
