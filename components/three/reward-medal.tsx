'use client';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei/core/Float';
import { Sparkles } from '@react-three/drei/core/Sparkles';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { SceneFrame, useSceneState } from './scene-frame';
import {
  GlowSprite,
  LookAt,
  PALETTE,
  StudioEnvironment,
  StudioLights,
  mixHex,
  springStep,
  useDisposable,
  useViewportScale,
  type LazySceneProps,
} from './shared';

export type MedalVariant = 'level' | 'achievement' | 'stamp' | 'streak';
export type MedalTier = 'bronze' | 'silver' | 'gold';

export interface RewardMedalProps extends LazySceneProps {
  /** 'level' (gold star), 'achievement' (tiered bolt), 'stamp' (enamel disc), 'streak' (ember flame). */
  variant?: MedalVariant;
  /** Metal tier for 'achievement'. Default gold. */
  tier?: MedalTier;
  /** Route accent for 'stamp' (enamel colour). Default volt. */
  accent?: string;
  /** Change this value to replay the flip-in. */
  replayKey?: string | number;
  /** Uniform scale. Default 1. */
  size?: number;
  /** drei Sparkles around the medal. Default true. */
  sparkles?: boolean;
  label?: string;
}

interface MedalTheme {
  body: string;
  face: string;
  emblem: string;
  glow: string;
  sparkle: string;
  emblemEmissive?: string;
  enamel?: boolean;
  faceMetal: number;
  faceRough: number;
}

const GOLD: MedalTheme = {
  body: PALETTE.gold,
  face: '#9c6a12',
  emblem: '#ffe7a3',
  glow: '#ffb640',
  sparkle: '#ffe08a',
  faceMetal: 0.9,
  faceRough: 0.5,
};

function medalTheme(variant: MedalVariant, tier: MedalTier, accent: string): MedalTheme {
  switch (variant) {
    case 'achievement':
      if (tier === 'bronze')
        return {
          body: '#c8823f',
          face: '#5a3418',
          emblem: '#f4b27a',
          glow: '#e08a4a',
          sparkle: '#ffc48f',
          faceMetal: 0.9,
          faceRough: 0.5,
        };
      if (tier === 'silver')
        return {
          body: '#dfe5ec',
          face: '#5f6a76',
          emblem: '#ffffff',
          glow: '#a9c6e6',
          sparkle: '#e6f0ff',
          faceMetal: 0.9,
          faceRough: 0.45,
        };
      return GOLD;
    case 'stamp':
      return {
        body: '#3a4653',
        face: accent,
        emblem: '#f2f6fa',
        glow: accent,
        sparkle: mixHex(accent, '#ffffff', 0.4),
        enamel: true,
        faceMetal: 0.05,
        faceRough: 0.35,
      };
    case 'streak':
      return {
        body: '#4a2820',
        face: '#22100b',
        emblem: '#ff8a2e',
        emblemEmissive: '#ff5a1e',
        glow: '#ff6a2e',
        sparkle: '#ffb36a',
        faceMetal: 0.85,
        faceRough: 0.55,
      };
    default:
      return GOLD;
  }
}

function starShape(outer = 0.46, inner = 0.2): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function boltShape(scale = 0.72): THREE.Shape {
  const pts: Array<[number, number]> = [
    [0.08, 0.67],
    [-0.38, -0.04],
    [-0.02, -0.04],
    [-0.15, -0.68],
    [0.43, 0.16],
    [0.05, 0.16],
  ];
  const shape = new THREE.Shape();
  pts.forEach(([x, y], i) =>
    i === 0 ? shape.moveTo(x * scale, y * scale) : shape.lineTo(x * scale, y * scale),
  );
  shape.closePath();
  return shape;
}

function slashShapes(): THREE.Shape[] {
  const slash = (x0: number) => {
    const s = new THREE.Shape();
    s.moveTo(x0, -0.36);
    s.lineTo(x0 + 0.15, -0.36);
    s.lineTo(x0 + 0.38, 0.36);
    s.lineTo(x0 + 0.23, 0.36);
    s.closePath();
    return s;
  };
  return [slash(-0.35), slash(-0.04)];
}

function flameShape(): THREE.Shape {
  const f = new THREE.Shape();
  f.moveTo(0, -0.48);
  f.bezierCurveTo(0.42, -0.48, 0.5, -0.1, 0.27, 0.13);
  f.bezierCurveTo(0.36, 0.06, 0.34, 0.3, 0.09, 0.5);
  f.bezierCurveTo(0.12, 0.3, -0.02, 0.24, -0.06, 0.1);
  f.bezierCurveTo(-0.14, 0.24, -0.34, 0.2, -0.3, 0.02);
  f.bezierCurveTo(-0.48, -0.12, -0.42, -0.48, 0, -0.48);
  const hole = new THREE.Path();
  hole.moveTo(0, -0.3);
  hole.bezierCurveTo(0.17, -0.3, 0.2, -0.12, 0.08, 0.02);
  hole.bezierCurveTo(0.02, -0.04, -0.05, -0.04, -0.07, 0.03);
  hole.bezierCurveTo(-0.2, -0.1, -0.16, -0.3, 0, -0.3);
  f.holes.push(hole);
  return f;
}

function emblemShapes(variant: MedalVariant): THREE.Shape | THREE.Shape[] {
  switch (variant) {
    case 'achievement':
      return boltShape();
    case 'stamp':
      return slashShapes();
    case 'streak':
      return flameShape();
    default:
      return starShape();
  }
}

/** Coin profile (radius, height): recessed face, raised bevelled rim. */
const PROFILE: Array<[number, number]> = [
  [0, -0.06],
  [0.8, -0.06],
  [0.86, -0.078],
  [0.96, -0.078],
  [1, -0.05],
  [1, 0.05],
  [0.96, 0.078],
  [0.86, 0.078],
  [0.8, 0.06],
  [0, 0.06],
];

function useFlipSpring(replayKey: string | number | undefined, reduced: boolean) {
  const spring = useRef({
    rot: { value: 0, velocity: 0 },
    scale: { value: 1, velocity: 0 },
    y: { value: 0, velocity: 0 },
    playing: false,
  });
  useEffect(() => {
    const s = spring.current;
    if (reduced) {
      s.rot.value = 0;
      s.scale.value = 1;
      s.y.value = 0;
      s.rot.velocity = s.scale.velocity = s.y.velocity = 0;
      s.playing = false;
      return;
    }
    s.rot = { value: -Math.PI * 2, velocity: 0 };
    s.scale = { value: 0.35, velocity: 0 };
    s.y = { value: -0.6, velocity: 0 };
    s.playing = true;
  }, [replayKey, reduced]);
  return spring;
}

export interface RewardMedalSceneProps {
  variant?: MedalVariant;
  tier?: MedalTier;
  accent?: string;
  replayKey?: string | number;
  size?: number;
  sparkles?: boolean;
}

/** The medal without a SceneFrame, for composing into a shared canvas. */
export function RewardMedalScene({
  variant = 'level',
  tier = 'gold',
  accent = PALETTE.volt,
  replayKey,
  size = 1,
  sparkles = true,
}: RewardMedalSceneProps) {
  const { reduced } = useSceneState();
  const theme = useMemo(() => medalTheme(variant, tier, accent), [variant, tier, accent]);
  const scale = useViewportScale(3.6, 0.7) * size;
  const spring = useFlipSpring(replayKey, reduced);
  const medal = useRef<THREE.Group>(null);

  const body = useDisposable(
    () =>
      new THREE.LatheGeometry(
        PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
        96,
      ),
    [],
  );
  const bodyMaterial = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: theme.body,
        metalness: 1,
        roughness: variant === 'stamp' ? 0.3 : 0.22,
        emissive: new THREE.Color(theme.glow),
        emissiveIntensity: variant === 'streak' ? 0.18 : 0.05,
      }),
    [theme.body, theme.glow, variant],
  );
  const face = useDisposable(() => new THREE.CircleGeometry(0.805, 72), []);
  const faceMaterial = useDisposable(
    () =>
      theme.enamel
        ? new THREE.MeshPhysicalMaterial({
            color: theme.face,
            metalness: theme.faceMetal,
            roughness: theme.faceRough,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
          })
        : new THREE.MeshStandardMaterial({
            color: theme.face,
            metalness: theme.faceMetal,
            roughness: theme.faceRough,
          }),
    [theme.face, theme.enamel, theme.faceMetal, theme.faceRough],
  );
  const inlay = useDisposable(() => new THREE.TorusGeometry(0.72, 0.012, 8, 96), []);
  const inlayMaterial = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: theme.emblem, metalness: 0.9, roughness: 0.28 }),
    [theme.emblem],
  );
  const emblem = useDisposable(
    () =>
      new THREE.ExtrudeGeometry(emblemShapes(variant), {
        depth: 0.035,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.01,
        bevelSegments: 2,
        curveSegments: 10,
      }),
    [variant],
  );
  const emblemMaterial = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: theme.emblem,
        metalness: theme.emblemEmissive ? 0.6 : 0.9,
        roughness: theme.emblemEmissive ? 0.35 : 0.28,
        emissive: new THREE.Color(theme.emblemEmissive ?? '#000000'),
        emissiveIntensity: theme.emblemEmissive ? 1.6 : 0,
        envMapIntensity: 1.2,
      }),
    [theme.emblem, theme.emblemEmissive],
  );
  const reverseRing = useDisposable(() => new THREE.TorusGeometry(0.5, 0.02, 8, 80), []);
  const reverseRingSmall = useDisposable(() => new THREE.TorusGeometry(0.28, 0.02, 8, 64), []);

  useFrame((_, dt) => {
    const g = medal.current;
    const s = spring.current;
    if (!g) return;
    if (!s.playing) {
      g.rotation.y = s.rot.value;
      g.scale.setScalar(s.scale.value * scale);
      g.position.y = s.y.value;
      return;
    }
    const d = Math.min(dt, 1 / 30);
    springStep(s.rot, 0, d, 34, 6.2);
    springStep(s.scale, 1, d, 70, 9);
    springStep(s.y, 0, d, 60, 9);
    g.rotation.y = s.rot.value;
    g.scale.setScalar(s.scale.value * scale);
    g.position.y = s.y.value;
    if (
      Math.abs(s.rot.value) < 0.002 &&
      Math.abs(s.rot.velocity) < 0.01 &&
      Math.abs(s.scale.value - 1) < 0.002
    ) {
      s.rot.value = 0;
      s.scale.value = 1;
      s.y.value = 0;
      s.playing = false;
    }
  });

  const medalGroup = (
    <group ref={medal} scale={scale}>
      <mesh geometry={body} material={bodyMaterial} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={face} material={faceMaterial} position={[0, 0, 0.064]} />
      <mesh geometry={inlay} material={inlayMaterial} position={[0, 0, 0.066]} />
      <mesh geometry={emblem} material={emblemMaterial} position={[0, 0, 0.066]} />
      <group rotation={[0, Math.PI, 0]}>
        <mesh geometry={face} material={faceMaterial} position={[0, 0, 0.064]} />
        <mesh geometry={reverseRing} material={inlayMaterial} position={[0, 0, 0.066]} />
        <mesh geometry={reverseRingSmall} material={inlayMaterial} position={[0, 0, 0.066]} />
      </group>
    </group>
  );

  const wrapped: ReactNode = reduced ? (
    medalGroup
  ) : (
    <Float speed={1.5} rotationIntensity={0.28} floatIntensity={0.5} floatingRange={[-0.06, 0.06]}>
      {medalGroup}
    </Float>
  );

  return (
    <>
      <LookAt target={[0, 0, 0]} />
      <StudioLights accent={theme.glow} intensity={1.05} />
      <StudioEnvironment accent={theme.glow} intensity={1.15} />
      {variant === 'streak' && (
        <pointLight position={[0, -1.4, 1.6]} intensity={12} color="#ff7a2e" distance={8} decay={2} />
      )}
      <GlowSprite color={theme.glow} scale={4.6 * scale} opacity={0.55} position={[0, 0, -1]} />
      {wrapped}
      {sparkles && (
        <Sparkles
          count={64}
          scale={[3.4 * scale, 3.4 * scale, 1.4]}
          size={2.4}
          speed={reduced ? 0 : 0.35}
          opacity={0.75}
          color={theme.sparkle}
          noise={0.5}
        />
      )}
    </>
  );
}

/** Ceremony centerpiece medal (self-contained: wraps its own SceneFrame). */
export default function RewardMedal({
  variant = 'level',
  tier = 'gold',
  accent = PALETTE.volt,
  replayKey,
  size = 1,
  sparkles = true,
  fallback,
  height = 380,
  className,
  style,
  label,
}: RewardMedalProps) {
  return (
    <SceneFrame
      fallback={fallback}
      height={height}
      className={className}
      style={style}
      label={label ?? `${variant} medal`}
      camera={{ fov: 34, position: [0, 0.1, 4.4], near: 0.1, far: 40 }}
    >
      <RewardMedalScene
        variant={variant}
        tier={tier}
        accent={accent}
        replayKey={replayKey}
        size={size}
        sparkles={sparkles}
      />
    </SceneFrame>
  );
}
