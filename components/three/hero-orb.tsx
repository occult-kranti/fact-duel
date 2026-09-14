'use client';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SceneFrame, useSceneState } from './scene-frame';
import { usePrefersReducedMotion } from './reduced-motion';
import { BrainCore } from './brain-core';
import {
  GlowSprite,
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

export interface HeroOrbProps extends LazySceneProps {
  /** Player level 1..60: more rings, brighter core, more particles. Default 1. */
  level?: number;
  /** Accent hex colour. Default volt #d4ff3a. */
  accent?: string;
  /** Overall glow multiplier. Default 1. */
  intensity?: number;
  /** Subtle pointer / touch parallax. Default true. */
  parallax?: boolean;
  /** Distinct game modes played, 0..6. The brain wakes at 4. Default 0. */
  modesPlayed?: number;
  /** 0..1 landed-conviction heat. Decoration only — never a score, never a pending stake. */
  heat?: number;
  /** Accessible label for the scene box. Defaults to the state-appropriate sentence below. */
  label?: string;
}

type SatelliteKind = 'ball' | 'atom' | 'gem' | 'spark';

interface RingDef {
  radius: number;
  tilt: [number, number, number];
  speed: number;
  satellite: SatelliteKind;
  metal: string;
  phase: number;
}

const RINGS: RingDef[] = [
  { radius: 1.3, tilt: [1.05, 0.15, 0.4], speed: 0.3, satellite: 'ball', metal: '#e9ecf0', phase: 0.4 },
  {
    radius: 1.58,
    tilt: [-0.55, 0.85, 0.25],
    speed: -0.22,
    satellite: 'atom',
    metal: PALETTE.gold,
    phase: 2.6,
  },
  { radius: 1.86, tilt: [0.3, -0.6, 1.25], speed: 0.17, satellite: 'gem', metal: '#cfd6dd', phase: 4.4 },
  { radius: 2.1, tilt: [1.35, 0.4, -0.5], speed: -0.13, satellite: 'spark', metal: '#b9c2cc', phase: 1.5 },
  { radius: 2.32, tilt: [-0.25, 1.3, 0.9], speed: 0.1, satellite: 'spark', metal: '#a9b3bd', phase: 3.7 },
];

const clampLevel = (level: number | undefined) => clamp(Math.round(level ?? 1), 1, 60);

/** Four of the six ways to play wakes the brain: breadth, not a grind counter. */
const WAKE_MODES = 4;
/**
 * The wake is a presentation event, not an earned award, so it stays out of the profile's
 * exactly-once ledger and out of ACHIEVEMENTS entirely. A player who clears site data may see it
 * once more; that is the documented price of leaving the achievement count alone.
 */
const AWOKE_KEY = 'fd.brain.awoke';
/** The shell tightens onto the brain forming inside it between 1.1 s and 1.8 s of the wake. */
const SNAP_FROM = 1.1;
const SNAP_TO = 1.8;
/** 1.12 -> 1.02 and back, expressed as a scale so the edge buffer is never rebuilt. */
const SNAP_DEPTH = 1 - 1.02 / 1.12;

function WireShell({ accent, reduced, ceremony }: { accent: string; reduced: boolean; ceremony: boolean }) {
  const group = useRef<THREE.Group>(null);
  const edges = useDisposable(() => {
    const source = new THREE.IcosahedronGeometry(1.12, 1);
    const geometry = new THREE.EdgesGeometry(source);
    source.dispose();
    return geometry;
  }, []);
  const nodes = useMemo(() => {
    const source = new THREE.IcosahedronGeometry(1.12, 1);
    const seen = new Map<string, THREE.Vector3>();
    const array = source.getAttribute('position').array as ArrayLike<number>;
    for (let i = 0; i < array.length; i += 3) {
      const key = `${array[i].toFixed(3)}|${array[i + 1].toFixed(3)}|${array[i + 2].toFixed(3)}`;
      if (!seen.has(key)) seen.set(key, new THREE.Vector3(array[i], array[i + 1], array[i + 2]));
    }
    source.dispose();
    return [...seen.values()];
  }, []);
  const lineMaterial = useDisposable(
    () => new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.5, toneMapped: false }),
    [accent],
  );
  const nodeGeometry = useDisposable(() => new THREE.SphereGeometry(0.022, 8, 6), []);
  const nodeMaterial = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }),
    [accent],
  );
  const instanced = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = instanced.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    nodes.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    mesh.instanceMatrix.needsUpdate = true;
  }, [nodes]);
  // Negative means "not running", so the shell costs nothing on every frame that is not a wake.
  const snap = useRef(-1);
  useEffect(() => {
    if (ceremony && !reduced) snap.current = 0;
  }, [ceremony, reduced]);
  useFrame(({ clock }, dt) => {
    if (reduced || !group.current) return;
    group.current.rotation.y += 0.09 * Math.min(dt, 0.05);
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.21) * 0.28;
    if (snap.current < 0) return;
    snap.current += Math.min(dt, 0.05);
    const k = Math.sin(Math.PI * clamp((snap.current - SNAP_FROM) / (SNAP_TO - SNAP_FROM), 0, 1));
    group.current.scale.setScalar(1 - SNAP_DEPTH * k);
    lineMaterial.opacity = 0.5 + 0.4 * k;
    nodeMaterial.color.set(mixHex(accent, PALETTE.silver, k));
    if (snap.current >= SNAP_TO) {
      snap.current = -1;
      group.current.scale.setScalar(1);
      lineMaterial.opacity = 0.5;
      nodeMaterial.color.set(accent);
    }
  });
  return (
    <group ref={group} rotation={[0.2, 0.6, 0]}>
      <lineSegments geometry={edges} material={lineMaterial} />
      <instancedMesh
        ref={instanced}
        args={[nodeGeometry, nodeMaterial, nodes.length]}
        frustumCulled={false}
      />
    </group>
  );
}

function SportsBall({ reduced }: { reduced: boolean }) {
  const ball = useRef<THREE.Group>(null);
  const geometry = useDisposable(() => new THREE.SphereGeometry(0.12, 24, 16), []);
  const material = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#f4f5f2', metalness: 0.12, roughness: 0.42 }),
    [],
  );
  const seam = useDisposable(() => {
    const curve = new THREE.EllipseCurve(0, 0, 0.123, 0.123, 0, Math.PI * 2, false, 0);
    return new THREE.BufferGeometry().setFromPoints(
      curve.getPoints(72).map((p) => new THREE.Vector3(p.x, p.y, 0)),
    );
  }, []);
  const seamMaterial = useDisposable(() => new THREE.LineBasicMaterial({ color: '#ff5a3c' }), []);
  useFrame((_, dt) => {
    if (reduced || !ball.current) return;
    ball.current.rotation.y += 1.4 * Math.min(dt, 0.05);
    ball.current.rotation.x += 0.6 * Math.min(dt, 0.05);
  });
  return (
    <group ref={ball} rotation={[0.4, 0.3, 0]}>
      <mesh geometry={geometry} material={material} />
      <lineLoop geometry={seam} material={seamMaterial} rotation={[Math.PI / 2, 0.5, 0]} />
      <lineLoop geometry={seam} material={seamMaterial} rotation={[Math.PI / 2, -0.5, Math.PI / 2]} />
    </group>
  );
}

function Atom({ reduced }: { reduced: boolean }) {
  const orbits = useRef<Array<THREE.Group | null>>([]);
  const nucleusGeometry = useDisposable(() => new THREE.IcosahedronGeometry(0.062, 1), []);
  const nucleusMaterial = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.magenta,
        emissive: new THREE.Color(PALETTE.magenta),
        emissiveIntensity: 1.3,
        metalness: 0.3,
        roughness: 0.35,
      }),
    [],
  );
  const orbitGeometry = useDisposable(() => new THREE.TorusGeometry(0.17, 0.0045, 4, 48), []);
  const orbitMaterial = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        color: PALETTE.cyan,
        transparent: true,
        opacity: 0.8,
        toneMapped: false,
      }),
    [],
  );
  const electronGeometry = useDisposable(() => new THREE.SphereGeometry(0.02, 8, 6), []);
  const electronMaterial = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: '#dff8ff', toneMapped: false }),
    [],
  );
  const tilts: Array<[number, number, number]> = [
    [0, 0, 0],
    [1.05, 0, 0.6],
    [-1.05, 0, -0.6],
  ];
  useFrame((_, dt) => {
    if (reduced) return;
    const d = Math.min(dt, 0.05);
    orbits.current.forEach((orbit, i) => {
      if (orbit) orbit.rotation.z += (2.2 + i * 0.7) * d;
    });
  });
  return (
    <group>
      <mesh geometry={nucleusGeometry} material={nucleusMaterial} />
      {tilts.map((tilt, i) => (
        <group key={i} rotation={tilt}>
          <mesh geometry={orbitGeometry} material={orbitMaterial} />
          <group
            ref={(el) => {
              orbits.current[i] = el;
            }}
            rotation={[0, 0, i * 2.1]}
          >
            <mesh geometry={electronGeometry} material={electronMaterial} position={[0.17, 0, 0]} />
          </group>
        </group>
      ))}
    </group>
  );
}

function Gem({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useDisposable(() => {
    const g = new THREE.OctahedronGeometry(0.11, 0);
    g.scale(1, 1.35, 1);
    return g;
  }, []);
  const material = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.gold,
        metalness: 1,
        roughness: 0.15,
        emissive: new THREE.Color(PALETTE.gold),
        emissiveIntensity: 0.25,
        flatShading: true,
      }),
    [],
  );
  useFrame((_, dt) => {
    if (reduced || !mesh.current) return;
    mesh.current.rotation.y += 1.1 * Math.min(dt, 0.05);
  });
  return <mesh ref={mesh} geometry={geometry} material={material} rotation={[0.3, 0, 0.2]} />;
}

function Spark({ accent }: { accent: string }) {
  const geometry = useDisposable(() => new THREE.SphereGeometry(0.05, 12, 8), []);
  const material = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }),
    [accent],
  );
  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <GlowSprite color={accent} scale={0.5} opacity={0.7} position={[0, 0, 0]} />
    </group>
  );
}

function Satellite({ kind, accent, reduced }: { kind: SatelliteKind; accent: string; reduced: boolean }) {
  switch (kind) {
    case 'ball':
      return <SportsBall reduced={reduced} />;
    case 'atom':
      return <Atom reduced={reduced} />;
    case 'gem':
      return <Gem reduced={reduced} />;
    default:
      return <Spark accent={accent} />;
  }
}

function OrbitRing({ def, accent, reduced }: { def: RingDef; accent: string; reduced: boolean }) {
  const spin = useRef<THREE.Group>(null);
  const geometry = useDisposable(() => new THREE.TorusGeometry(def.radius, 0.016, 8, 128), [def.radius]);
  const material = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: def.metal,
        metalness: 1,
        roughness: 0.22,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 0.1,
      }),
    [def.metal, accent],
  );
  useFrame((_, dt) => {
    if (reduced || !spin.current) return;
    spin.current.rotation.z += def.speed * Math.min(dt, 0.05);
  });
  return (
    <group rotation={def.tilt}>
      <mesh geometry={geometry} material={material} />
      <group ref={spin} rotation={[0, 0, def.phase]}>
        <group position={[def.radius, 0, 0]}>
          <Satellite kind={def.satellite} accent={accent} reduced={reduced} />
        </group>
      </group>
    </group>
  );
}

function Particles({ count, accent, reduced }: { count: number; accent: string; reduced: boolean }) {
  const points = useRef<THREE.Points>(null);
  const map = useRadialTexture(64);
  const geometry = useDisposable(() => {
    const positions = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = hash01(i * 3);
      const v = hash01(i * 3 + 1);
      const r = 1.25 + hash01(i * 3 + 2) * 1.6;
      const theta = u * Math.PI * 2;
      const y = (v * 2 - 1) * 0.8;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const x = Math.cos(theta) * ring * r;
      const z = Math.sin(theta) * ring * r;
      positions.set([x, y * r, z], i * 3);
      base.set([x, y * r, z], i * 3);
      phase[i] = hash01(i * 7 + 11) * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.userData = { base, phase };
    return g;
  }, [count]);
  const material = useDisposable(
    () =>
      new THREE.PointsMaterial({
        size: 0.1,
        map,
        color: accent,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [map, accent],
  );
  useFrame(({ clock }, dt) => {
    if (reduced || !points.current) return;
    points.current.rotation.y += 0.05 * Math.min(dt, 0.05);
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    const { base, phase } = geometry.userData as { base: Float32Array; phase: Float32Array };
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.7 + phase[i]) * 0.07;
    }
    attribute.needsUpdate = true;
  });
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

export interface HeroOrbSceneProps {
  level?: number;
  accent?: string;
  intensity?: number;
  parallax?: boolean;
  /** Distinct game modes played, 0..6. The brain wakes at 4. Default 0. */
  modesPlayed?: number;
  /** 0..1 landed-conviction heat. Decoration only — never a score, never a pending stake. */
  heat?: number;
}

/** The orb without a SceneFrame, for composing into a shared canvas. */
export function HeroOrbScene({
  level = 1,
  accent = PALETTE.volt,
  intensity = 1,
  parallax = true,
  modesPlayed = 0,
  heat = 0,
}: HeroOrbSceneProps) {
  const { reduced } = useSceneState();
  const rig = useRef<THREE.Group>(null);
  const pointer = useThree((state) => state.pointer);
  const scale = useViewportScale(5.4, 0.62);
  const lvl = clampLevel(level);
  const ringCount = lvl >= 45 ? 5 : lvl >= 25 ? 4 : 3;
  const brightness = (0.85 + (lvl / 60) * 0.6) * intensity;
  const particleCount = Math.round(150 + (lvl / 60) * 110);
  // BrainCore reads the whole locked / forming / awake staging off one 0..1 number, so the three
  // stages are this division and nothing else: 0-1 modes builds no geometry, 2-3 ghosts it inside
  // the old core, 4 wakes it.
  const unlock = Math.min(1, clamp(Math.round(modesPlayed), 0, 6) / WAKE_MODES);

  // Decided once at mount, not in an effect: the wake is a one-shot, and the read has to happen
  // before the first frame the brain is drawn on. A blocked store reads as "already seen", because
  // replaying the sequence on every mount is worse than never playing it.
  const [ceremony] = useState(() => {
    if (unlock < 1 || typeof window === 'undefined') return false;
    try {
      return !window.localStorage.getItem(AWOKE_KEY);
    } catch {
      return false;
    }
  });
  // The flag is written even under reduced motion, where BrainCore skips the sequence: the brain is
  // then simply present, and the moment is not owed back on a later visit.
  useEffect(() => {
    if (!ceremony) return;
    try {
      window.localStorage.setItem(AWOKE_KEY, '1');
    } catch {
      // Nothing to do: the next mount reads it as unseen and plays again.
    }
  }, [ceremony]);

  useFrame((_, dt) => {
    if (!rig.current) return;
    const d = Math.min(dt, 1 / 30);
    const tx = parallax && !reduced ? -pointer.y * 0.14 : 0;
    const ty = parallax && !reduced ? pointer.x * 0.22 : 0;
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, tx, 3.2, d);
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, ty, 3.2, d);
  });

  return (
    <>
      <StudioLights accent={accent} intensity={intensity} />
      <StudioEnvironment accent={accent} intensity={1.1} />
      <group scale={scale}>
        <group ref={rig}>
          <GlowSprite
            color={accent}
            scale={4.4 * Math.min(1.35, brightness)}
            opacity={0.65}
            position={[0, 0, -0.7]}
          />
          <BrainCore
            accent={accent}
            brightness={brightness}
            reduced={reduced}
            heat={heat}
            unlock={unlock}
            ceremony={ceremony}
          />
          <WireShell accent={accent} reduced={reduced} ceremony={ceremony} />
          {RINGS.slice(0, ringCount).map((def) => (
            <OrbitRing key={def.radius} def={def} accent={accent} reduced={reduced} />
          ))}
          <Particles count={particleCount} accent={accent} reduced={reduced} />
        </group>
      </group>
    </>
  );
}

/** Before the wake there is no brain in the box, so the locked scene keeps its own description. */
const LOCKED_LABEL = 'Glowing knowledge core with orbiting sports and science satellites';

/**
 * What the pulse reports, said out loud. The last sentence is not padding: a glowing brain that
 * beats faster is one bad label away from claiming the player got smarter, and this is the only
 * place a screen reader hears what the movement actually counts.
 */
function orbLabel(level: number, awake: boolean, reduced: boolean): string {
  if (!awake) return LOCKED_LABEL;
  const movement = reduced
    ? 'It brightens the more of your recent calls land above Steady.'
    : 'It pulses faster the more of your recent calls land above Steady.';
  return `Your brain core at level ${level}. ${movement} It shows how your calls have been landing, not how much you know.`;
}

/** Home hero "knowledge core" (self-contained: wraps its own SceneFrame). */
export default function HeroOrb({
  level = 1,
  accent = PALETTE.volt,
  intensity = 1,
  parallax = true,
  modesPlayed = 0,
  heat = 0,
  fallback,
  height = 420,
  className,
  style,
  label,
}: HeroOrbProps) {
  // SceneFrame owns the reduced-motion state inside the canvas, but the label is read from outside
  // it, so the preference is queried again here rather than plumbed back out.
  const reduced = usePrefersReducedMotion();
  const awake = clamp(Math.round(modesPlayed), 0, 6) >= WAKE_MODES;
  return (
    <SceneFrame
      fallback={fallback}
      height={height}
      className={className}
      style={style}
      label={label ?? orbLabel(clampLevel(level), awake, reduced)}
      camera={{ fov: 38, position: [0, 0.15, 5.8], near: 0.1, far: 40 }}
    >
      <HeroOrbScene
        level={level}
        accent={accent}
        intensity={intensity}
        parallax={parallax}
        modesPlayed={modesPlayed}
        heat={heat}
      />
    </SceneFrame>
  );
}
