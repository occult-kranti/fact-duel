'use client';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei/core/RoundedBox';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SceneFrame, useSceneState } from './scene-frame';
import {
  GlowSprite,
  PALETTE,
  StudioEnvironment,
  StudioLights,
  mixHex,
  useDisposable,
  useViewportScale,
  type LazySceneProps,
} from './shared';

export interface StampInfo {
  id: string;
  /** Route accent (hex) used for the enamel top. */
  color: string;
  earned?: boolean;
}

export interface StampCase3DProps extends LazySceneProps {
  /** Up to 9 route stamps. Defaults to a demo set. */
  stamps?: StampInfo[];
  accent?: string;
  /** Grid columns. Default 3. */
  columns?: number;
  /** Tap / click on a stamp. */
  onSelect?: (id: string) => void;
  label?: string;
}

const DEMO_COLORS = [
  PALETTE.volt,
  PALETTE.gold,
  PALETTE.cyan,
  PALETTE.magenta,
  '#8ef0c2',
  '#ff9a3d',
  '#9d8bff',
  '#ffe27a',
  '#5ad1ff',
];

export const DEMO_STAMPS: StampInfo[] = DEMO_COLORS.map((color, i) => ({
  id: `route-${i + 1}`,
  color,
  earned: i % 3 !== 2,
}));

const SPACING = 1.08;
const DISC_R = 0.42;
const UNEARNED_BODY = '#1a212b';
const EARNED_BODY = '#cfd6de';

function starShape(outer: number, inner: number): THREE.Shape {
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

export interface StampCaseSceneProps {
  stamps?: StampInfo[];
  accent?: string;
  columns?: number;
  onSelect?: (id: string) => void;
}

/** The case without a SceneFrame, for composing into a shared canvas. */
export function StampCaseScene({
  stamps = DEMO_STAMPS,
  accent = PALETTE.volt,
  columns = 3,
  onSelect,
}: StampCaseSceneProps) {
  const { reduced } = useSceneState();
  const pointer = useThree((state) => state.pointer);
  const rig = useRef<THREE.Group>(null);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<THREE.InstancedMesh>(null);
  const emblems = useRef<THREE.InstancedMesh>(null);
  const slots = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  hoveredRef.current = hovered;
  const lifts = useRef<Float32Array>(new Float32Array(0));

  const list = useMemo(() => stamps.slice(0, 9), [stamps]);
  const count = list.length;
  const rows = Math.max(1, Math.ceil(count / columns));
  const width = columns * SPACING;
  const height = rows * SPACING;
  const scale = useViewportScale(width + 1.2, 0.6);

  const layout = useMemo(
    () =>
      list.map((_, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        return {
          x: (col - (columns - 1) / 2) * SPACING,
          y: ((rows - 1) / 2 - row) * SPACING,
        };
      }),
    [list, columns, rows],
  );

  const bodyGeometry = useDisposable(() => new THREE.CylinderGeometry(DISC_R, DISC_R, 0.09, 48), []);
  const topGeometry = useDisposable(
    () => new THREE.CylinderGeometry(DISC_R - 0.07, DISC_R - 0.07, 0.03, 48),
    [],
  );
  const ringGeometry = useDisposable(() => new THREE.TorusGeometry(DISC_R - 0.012, 0.009, 8, 64), []);
  const emblemGeometry = useDisposable(
    () =>
      new THREE.ExtrudeGeometry(starShape(0.17, 0.075), {
        depth: 0.025,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.005,
        bevelSegments: 1,
      }),
    [],
  );
  const bodyMaterial = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.26 }),
    [],
  );
  const topMaterial = useDisposable(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.05,
        roughness: 0.42,
        clearcoat: 0.6,
        clearcoatRoughness: 0.35,
        envMapIntensity: 0.3,
      }),
    [],
  );
  const ringMaterial = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    [],
  );
  const emblemMaterial = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#ffe6a8', metalness: 0.9, roughness: 0.3 }),
    [],
  );
  const slotMaterial = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#0d1218', metalness: 0.35, roughness: 0.78 }),
    [],
  );
  const panelMaterial = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#0f151d', metalness: 0.85, roughness: 0.42 }),
    [],
  );

  useEffect(() => {
    lifts.current = new Float32Array(count);
    const color = new THREE.Color();
    const paint = (mesh: THREE.InstancedMesh | null, pick: (s: StampInfo) => string) => {
      if (!mesh) return;
      list.forEach((s, i) => mesh.setColorAt(i, color.set(pick(s))));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    paint(bodies.current, (s) => (s.earned ? EARNED_BODY : UNEARNED_BODY));
    paint(tops.current, (s) => (s.earned ? mixHex(s.color, '#000000', 0.2) : '#0b1016'));
    paint(rings.current, (s) =>
      s.earned ? mixHex(s.color, '#ffffff', 0.35) : mixHex(accent, '#000000', 0.55),
    );
    paint(emblems.current, () => '#fff6da');
  }, [list, count, accent]);

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 1 / 30);
    if (rig.current) {
      const tx = reduced ? 0 : -pointer.y * 0.26;
      const ty = reduced ? 0 : pointer.x * 0.32;
      rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, tx, 4, d);
      rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, ty, 4, d);
    }
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const identity = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const zero = new THREE.Vector3(0, 0, 0);
    const pos = new THREE.Vector3();
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const target = hoveredRef.current === i ? 0.22 : 0;
      lifts.current[i] = THREE.MathUtils.damp(lifts.current[i] ?? 0, target, 8, d);
      const idle = reduced ? 0 : Math.sin(t * 1.1 + i * 0.9) * 0.012;
      const z = lifts.current[i] + idle;
      const { x, y } = layout[i];
      const earned = !!list[i].earned;
      bodies.current?.setMatrixAt(i, m.compose(pos.set(x, y, z), q, earned ? one : zero));
      slots.current?.setMatrixAt(i, m.compose(pos.set(x, y, z - 0.03), q, earned ? zero : one));
      tops.current?.setMatrixAt(i, m.compose(pos.set(x, y, z + 0.05), q, earned ? one : zero));
      rings.current?.setMatrixAt(i, m.compose(pos.set(x, y, z + 0.066), identity, one));
      emblems.current?.setMatrixAt(i, m.compose(pos.set(x, y, z + 0.066), identity, earned ? one : zero));
    }
    for (const mesh of [bodies.current, slots.current, tops.current, rings.current, emblems.current]) {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId !== undefined && e.instanceId !== hoveredRef.current) setHovered(e.instanceId);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return;
    e.stopPropagation();
    onSelect?.(list[e.instanceId].id);
  };

  return (
    <>
      <StudioLights accent={accent} intensity={1} />
      <StudioEnvironment accent={accent} intensity={1.1} />
      <group scale={scale}>
        <GlowSprite
          color={accent}
          scale={Math.max(width, height) + 2.4}
          opacity={0.22}
          position={[0, 0, -1.2]}
        />
        <group ref={rig}>
          <RoundedBox
            args={[width + 0.5, height + 0.5, 0.16]}
            radius={0.12}
            smoothness={4}
            position={[0, 0, -0.1]}
            material={panelMaterial}
          />
          <instancedMesh
            ref={bodies}
            args={[bodyGeometry, bodyMaterial, count]}
            frustumCulled={false}
            onPointerMove={handleMove}
            onPointerOut={() => setHovered(null)}
            onClick={handleClick}
          />
          <instancedMesh
            ref={slots}
            args={[bodyGeometry, slotMaterial, count]}
            frustumCulled={false}
            onPointerMove={handleMove}
            onPointerOut={() => setHovered(null)}
            onClick={handleClick}
          />
          <instancedMesh ref={tops} args={[topGeometry, topMaterial, count]} frustumCulled={false} />
          <instancedMesh ref={rings} args={[ringGeometry, ringMaterial, count]} frustumCulled={false} />
          <instancedMesh ref={emblems} args={[emblemGeometry, emblemMaterial, count]} frustumCulled={false} />
        </group>
      </group>
    </>
  );
}

/** Nine route stamps as 3D discs that tilt toward the pointer (self-contained). */
export default function StampCase3D({
  stamps = DEMO_STAMPS,
  accent = PALETTE.volt,
  columns = 3,
  onSelect,
  fallback,
  height = 380,
  className,
  style,
  label = 'Stamp case with route stamps',
}: StampCase3DProps) {
  return (
    <SceneFrame
      fallback={fallback}
      height={height}
      className={className}
      style={style}
      label={label}
      camera={{ fov: 30, position: [0, 0, 7.2], near: 0.1, far: 40 }}
    >
      <StampCaseScene stamps={stamps} accent={accent} columns={columns} onSelect={onSelect} />
    </SceneFrame>
  );
}
