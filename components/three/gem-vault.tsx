'use client';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  CuboidCollider,
  CylinderCollider,
  InstancedRigidBodies,
  Physics,
  RigidBody,
  useRapier,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
} from '@react-three/rapier';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { DEFAULT_GEM_COLORS, GemVaultFallback } from './gem-vault-fallback';
import { SceneFrame, useSceneState } from './scene-frame';
import {
  LookAt,
  PALETTE,
  StudioEnvironment,
  StudioLights,
  clamp,
  hash01,
  mixHex,
  useDisposable,
  useRadialTexture,
  useViewportScale,
  type LazySceneProps,
} from './shared';

export { DEFAULT_GEM_COLORS, GemVaultFallback } from './gem-vault-fallback';

export interface GemVaultProps extends LazySceneProps {
  /** Number of gems that should be in the vault (0..maxGems). Increments drop in one by one. */
  count?: number;
  /** Gem palette (hex). Default volt / gold / cyan / magenta. */
  colors?: string[];
  /** Bowl tint. Default cyan. */
  accent?: string;
  /** Rigid-body budget; older gems are recycled beyond it. Default 120 (max 120). */
  maxGems?: number;
  /** Impulse multiplier for tap / click nudges. Default 1. */
  nudgeStrength?: number;
  label?: string;
}

const FLOOR_R = 1.0;
const TOP_R = 1.9;
const HEIGHT = 1.05;
const PARK_Y = -40;
const SPAWN_GAP = 0.09;

function bowlProfile(): THREE.Vector2[] {
  const points = [new THREE.Vector2(0, 0), new THREE.Vector2(FLOOR_R, 0)];
  const steps = 7;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    points.push(new THREE.Vector2(FLOOR_R + (TOP_R - FLOOR_R) * t, HEIGHT * Math.pow(t, 1.7)));
  }
  return points;
}

interface WallDef {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  args: [number, number, number];
}

function bowlWalls(profile: THREE.Vector2[]): WallDef[] {
  const walls: WallDef[] = [];
  const segments = 18;
  const yAxis = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const qy = new THREE.Quaternion();
  const qx = new THREE.Quaternion();
  for (let s = 1; s < profile.length - 1; s++) {
    const a = profile[s];
    const b = profile[s + 1];
    const rc = (a.x + b.x) / 2;
    const yc = (a.y + b.y) / 2;
    const len = a.distanceTo(b);
    const phi = Math.atan2(b.x - a.x, b.y - a.y);
    const chord = (2 * Math.PI * rc) / segments;
    for (let k = 0; k < segments; k++) {
      const theta = (k / segments) * Math.PI * 2;
      const q = qy.setFromAxisAngle(yAxis, theta).clone().multiply(qx.setFromAxisAngle(xAxis, phi));
      walls.push({
        position: [rc * Math.sin(theta), yc, rc * Math.cos(theta)],
        quaternion: [q.x, q.y, q.z, q.w],
        args: [chord * 0.62, len / 2 + 0.02, 0.04],
      });
    }
  }
  // Invisible guard ring so nudged gems cannot escape the tray.
  const guardR = TOP_R + 0.12;
  const guardSegments = 12;
  for (let k = 0; k < guardSegments; k++) {
    const theta = (k / guardSegments) * Math.PI * 2;
    const q = qy.setFromAxisAngle(yAxis, theta).clone();
    walls.push({
      position: [guardR * Math.sin(theta), HEIGHT + 0.6, guardR * Math.cos(theta)],
      quaternion: [q.x, q.y, q.z, q.w],
      args: [(2 * Math.PI * guardR) / guardSegments / 2 + 0.05, 0.9, 0.04],
    });
  }
  return walls;
}

function Bowl({ accent }: { accent: string }) {
  const profile = useMemo(bowlProfile, []);
  const walls = useMemo(() => bowlWalls(profile), [profile]);
  const glass = useDisposable(() => new THREE.LatheGeometry(profile, 72), [profile]);
  const glassMaterial = useDisposable(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: mixHex(accent, '#ffffff', 0.35),
        transparent: true,
        opacity: 0.2,
        roughness: 0.08,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
        envMapIntensity: 1.6,
      }),
    [accent],
  );
  const rim = useDisposable(() => new THREE.TorusGeometry(TOP_R + 0.01, 0.032, 10, 96), []);
  const rimMaterial = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: mixHex(accent, '#ffffff', 0.45),
        metalness: 1,
        roughness: 0.2,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 0.18,
      }),
    [accent],
  );
  const base = useDisposable(() => new THREE.CylinderGeometry(1.15, 1.35, 0.18, 64), []);
  const baseMaterial = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#161c25', metalness: 0.9, roughness: 0.35 }),
    [],
  );
  const baseRing = useDisposable(() => new THREE.TorusGeometry(1.36, 0.014, 6, 96), []);
  const baseRingMaterial = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }),
    [accent],
  );
  const floorGlow = useDisposable(() => new THREE.PlaneGeometry(6, 6), []);
  const glowMap = useRadialTexture(128);
  const floorGlowMaterial = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowMap,
        color: accent,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [glowMap, accent],
  );
  return (
    <group>
      <mesh
        geometry={floorGlow}
        material={floorGlowMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.2, 0]}
      />
      <mesh geometry={base} material={baseMaterial} position={[0, -0.11, 0]} />
      <mesh
        geometry={baseRing}
        material={baseRingMaterial}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
      />
      <mesh geometry={rim} material={rimMaterial} rotation={[Math.PI / 2, 0, 0]} position={[0, HEIGHT, 0]} />
      <RigidBody type="fixed" colliders={false} friction={0.6} restitution={0.2}>
        <CylinderCollider args={[0.06, FLOOR_R + 0.15]} position={[0, -0.06, 0]} />
        {walls.map((w, i) => (
          <CuboidCollider key={i} args={w.args} position={w.position} quaternion={w.quaternion} />
        ))}
      </RigidBody>
      <mesh geometry={glass} material={glassMaterial} renderOrder={2} />
    </group>
  );
}

interface GemApi {
  nudge: (point: THREE.Vector3, strength: number) => void;
}

interface Sim {
  ready: boolean;
  active: number[];
  free: number[];
  target: number;
  lastSpawn: number;
  frame: number;
}

function Gems({
  count,
  colors,
  max,
  reduced,
  api,
}: {
  count: number;
  colors: string[];
  max: number;
  reduced: boolean;
  api: MutableRefObject<GemApi | null>;
}) {
  const bodies = useRef<(RapierRigidBody | null)[]>([]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { step } = useRapier();
  const sim = useRef<Sim>({ ready: false, active: [], free: [], target: 0, lastSpawn: 0, frame: 0 });
  const geometry = useDisposable(() => {
    const g = new THREE.OctahedronGeometry(0.15, 0);
    g.scale(1, 1.4, 1);
    return g;
  }, []);
  const material = useDisposable(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.15,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        flatShading: true,
        envMapIntensity: 0.75,
      }),
    [],
  );
  const instances = useMemo<InstancedRigidBodyProps[]>(
    () =>
      Array.from({ length: max }, (_, i) => ({
        key: i,
        position: [(i % 12) * 0.5 - 3, PARK_Y - Math.floor(i / 12) * 0.5, 0] as [number, number, number],
      })),
    [max],
  );

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const color = new THREE.Color();
    for (let i = 0; i < max; i++) m.setColorAt(i, color.set(colors[i % colors.length] ?? PALETTE.volt));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [colors, max]);

  useEffect(() => {
    sim.current.target = clamp(Math.round(count), 0, max);
  }, [count, max]);

  const spawn = (index: number, at: [number, number, number], settle: boolean) => {
    const body = bodies.current[index];
    if (!body) return;
    const seed = index * 13 + sim.current.frame;
    const euler = new THREE.Euler(
      hash01(seed) * Math.PI * 2,
      hash01(seed + 1) * Math.PI * 2,
      hash01(seed + 2) * Math.PI * 2,
    );
    const q = new THREE.Quaternion().setFromEuler(euler);
    body.setEnabled(true);
    body.setTranslation({ x: at[0], y: at[1], z: at[2] }, true);
    body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    body.setLinvel({ x: 0, y: settle ? 0 : -1.5, z: 0 }, true);
    body.setAngvel(
      { x: (hash01(seed + 3) - 0.5) * 8, y: (hash01(seed + 4) - 0.5) * 8, z: (hash01(seed + 5) - 0.5) * 8 },
      true,
    );
    body.wakeUp();
  };

  const park = (index: number) => {
    const body = bodies.current[index];
    if (!body) return;
    body.setLinvel({ x: 0, y: 0, z: 0 }, false);
    body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    body.setTranslation({ x: (index % 12) * 0.5 - 3, y: PARK_Y - Math.floor(index / 12) * 0.5, z: 0 }, false);
    body.setEnabled(false);
  };

  const dropPoint = (seed: number): [number, number, number] => [
    (hash01(seed) - 0.5) * 0.8,
    2.4 + hash01(seed + 1) * 0.5,
    (hash01(seed + 2) - 0.5) * 0.8,
  ];

  const addOne = (settle: boolean, at?: [number, number, number]) => {
    const s = sim.current;
    let index = s.free.pop();
    if (index === undefined) {
      index = s.active.shift();
      if (index === undefined) return;
    }
    s.active.push(index);
    spawn(index, at ?? dropPoint(index * 7 + s.frame), settle);
  };

  useEffect(() => {
    api.current = {
      nudge: (point, strength) => {
        const s = sim.current;
        const radius = 1.3;
        for (const index of s.active) {
          const body = bodies.current[index];
          if (!body) continue;
          const p = body.translation();
          const dx = p.x - point.x;
          const dz = p.z - point.z;
          const dist = Math.hypot(dx, dz);
          if (dist > radius) continue;
          const falloff = 1 - dist / radius;
          const mass = body.mass() || 0.01;
          const push = (2.6 + falloff * 1.4) * strength * mass;
          const lateral = dist > 1e-4 ? 0.55 * strength * mass : 0;
          body.applyImpulse(
            { x: (dx / (dist || 1)) * lateral, y: push, z: (dz / (dist || 1)) * lateral },
            true,
          );
        }
      },
    };
    return () => {
      api.current = null;
    };
  }, [api]);

  useFrame((state) => {
    const s = sim.current;
    s.frame++;
    const list = bodies.current;
    if (!s.ready) {
      if (list.length < max || list.some((b) => !b)) {
        if (reduced) state.invalidate();
        return;
      }
      for (let i = max - 1; i >= 0; i--) {
        park(i);
        s.free.push(i);
      }
      s.ready = true;
      if (reduced) {
        const n = s.target;
        for (let i = 0; i < n; i++) {
          const angle = i * 2.39996;
          const r = 0.25 + 0.9 * Math.sqrt(i / Math.max(1, n));
          addOne(true, [Math.cos(angle) * r, 0.4 + i * 0.02, Math.sin(angle) * r]);
        }
        for (let k = 0; k < 240; k++) step(1 / 60);
        state.invalidate();
        return;
      }
    }
    const now = performance.now() / 1000;
    if (s.active.length < s.target) {
      if (now - s.lastSpawn >= SPAWN_GAP) {
        addOne(false);
        s.lastSpawn = now;
      }
    } else if (s.active.length > s.target) {
      const index = s.active.pop();
      if (index !== undefined) {
        park(index);
        s.free.push(index);
      }
    }
    if (s.frame % 30 === 0) {
      for (const index of s.active) {
        const body = list[index];
        if (!body) continue;
        const y = body.translation().y;
        if (y < -2 || y > 6) spawn(index, dropPoint(index * 11 + s.frame), false);
      }
    }
  });

  return (
    <InstancedRigidBodies
      ref={bodies}
      instances={instances}
      colliders="hull"
      restitution={0.32}
      friction={0.55}
      linearDamping={0.15}
      angularDamping={0.25}
      canSleep
      ccd
    >
      <instancedMesh ref={mesh} args={[geometry, material, max]} frustumCulled={false} count={max} />
    </InstancedRigidBodies>
  );
}

function TapPlane({ onTap }: { onTap: (point: THREE.Vector3) => void }) {
  const geometry = useDisposable(() => new THREE.CircleGeometry(2.6, 24), []);
  const material = useDisposable(
    () => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    [],
  );
  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.3, 0]}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onTap(e.point);
      }}
    />
  );
}

export interface GemVaultSceneProps {
  count?: number;
  colors?: string[];
  accent?: string;
  maxGems?: number;
  nudgeStrength?: number;
}

/** The vault without a SceneFrame (must still be rendered inside a SceneFrame for pausing). */
export function GemVaultScene({
  count = 12,
  colors = DEFAULT_GEM_COLORS,
  accent = PALETTE.cyan,
  maxGems = 120,
  nudgeStrength = 1,
}: GemVaultSceneProps) {
  const { active, reduced } = useSceneState();
  const api = useRef<GemApi | null>(null);
  const scale = useViewportScale(5.2, 0.62);
  const max = clamp(Math.round(maxGems), 1, 120);
  return (
    <>
      <LookAt target={[0, 0.35, 0]} />
      <StudioLights accent={accent} intensity={1.1} />
      <StudioEnvironment accent={accent} intensity={1.2} />
      <pointLight position={[0, 0.5, 0]} intensity={5} color={accent} distance={5} decay={2} />
      <group scale={scale}>
        <Physics gravity={[0, -9.81, 0]} paused={!active} timeStep={1 / 60} interpolate>
          <Bowl accent={accent} />
          <Gems count={count} colors={colors} max={max} reduced={reduced} api={api} />
          <TapPlane onTap={(point) => api.current?.nudge(point, nudgeStrength)} />
        </Physics>
      </group>
    </>
  );
}

/** Physics showpiece (self-contained: wraps its own SceneFrame; CSS pile fallback). */
export default function GemVault({
  count = 12,
  colors = DEFAULT_GEM_COLORS,
  accent = PALETTE.cyan,
  maxGems = 120,
  nudgeStrength = 1,
  fallback,
  height = 400,
  className,
  style,
  label,
}: GemVaultProps) {
  const fallbackNode = fallback ?? (
    <GemVaultFallback count={count} colors={colors} accent={accent} height={height} />
  );
  return (
    <SceneFrame
      fallback={fallbackNode}
      height={height}
      className={className}
      style={style}
      label={label ?? `Vault holding ${Math.round(count)} gems`}
      camera={{ fov: 34, position: [0, 3.3, 5.8], near: 0.1, far: 60 }}
    >
      <GemVaultScene
        count={count}
        colors={colors}
        accent={accent}
        maxGems={maxGems}
        nudgeStrength={nudgeStrength}
      />
    </SceneFrame>
  );
}
