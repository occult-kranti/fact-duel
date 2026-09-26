/**
 * three/tarazu-scene.tsx — TARAZU in Rapier (lazy chunk).
 *
 * A fixed post; a dynamic beam on a revolute joint whose LIMITS are the true angle (round difference ×
 * 6°, max 24°, towards the winner; a draw may dip one step towards the first weight and comes back
 * level). A position motor pulls the beam towards the angle the landed weights have earned so far —
 * it overshoots into the joint stop like a real beam. The pans are kinematic bodies that hang level
 * under the beam ends; one manila file-block per round won drops into its seat's pan, the winner's
 * first, alternating, so the beam never leans the wrong way. Settles ≤ 2.5 s, then the exact true
 * angle is set and the loop stops. Bodies: 1 beam + ≤ 10 weights (+ 2 kinematic pans, fixed post).
 * Draw calls: print-shadow, stand + outline, beam + outline, pans, strings, weights = 8 (budget 8).
 */
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, useRapier } from '@react-three/rapier';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useJuice, type Juice } from '@/components/fx';
import { HFrame, useStage } from './frame';
import {
  FitCamera,
  LandingWatch,
  Lights,
  STEP,
  bodyMatrix,
  clamp,
  deg,
  hullGeometry,
  merge,
  outlineMaterial,
  packetTexture,
  paint,
  place,
  seeded,
  toon,
  useDisposable,
  type RBody,
} from './kit';
import { threeStats, type SceneRuntime } from './runtime';
import type { TarazuSceneProps } from './tarazu';

const PIVOT_Y = 2.55;
const ARM = 2.2;
const HANG = 1.55;
const PAN_R = 0.62;
const WT = { w: 0.46, h: 0.16, d: 0.3 };
const MAX_PER_SEAT = 5;

/** The drop order: winner first, alternating, so every intermediate lean is towards the final one. */
export function dropOrder(scores: readonly [number, number], winner: 0 | 1 | null): (0 | 1)[] {
  const a = Math.min(MAX_PER_SEAT, scores[0]);
  const b = Math.min(MAX_PER_SEAT, scores[1]);
  const first: 0 | 1 = winner ?? (a >= b ? 0 : 1);
  const left = { 0: a, 1: b } as Record<0 | 1, number>;
  const out: (0 | 1)[] = [];
  let turn: 0 | 1 = first;
  while (left[0] + left[1] > 0) {
    if (left[turn] > 0) {
      out.push(turn);
      left[turn]--;
    }
    turn = turn === 0 ? 1 : 0;
  }
  return out;
}

/** Three.js rotation (radians about z; + = left pan down) for a tarazuAngle (degrees; − = left down). */
const toRot = (angleDeg: number) => deg(-angleDeg);

function Stand() {
  const { tokens } = useStage();
  const v = tokens.version;
  const geometry = useDisposable(() => {
    const steel = tokens.color('--h-ink-2');
    const brass = tokens.color('--h-brass');
    const ink = tokens.color('--h-line');
    return merge([
      place(paint(new THREE.BoxGeometry(1.7, 0.16, 0.7), steel), [0, 0.08, 0]),
      place(paint(new THREE.BoxGeometry(0.22, PIVOT_Y - 0.1, 0.22), steel), [0, (PIVOT_Y + 0.1) / 2, -0.02]),
      place(paint(new THREE.ConeGeometry(0.2, 0.3, 4), brass), [0, PIVOT_Y + 0.1, -0.02], [0, Math.PI / 4, 0]),
      place(paint(new THREE.BoxGeometry(0.7, 0.05, 0.4), ink), [0, 0.185, 0]),
    ]);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const hull = useDisposable(() => hullGeometry(geometry), [geometry]);
  const material = useDisposable(() => toon({ vertexColors: true }), []);
  const outline = useDisposable(() => outlineMaterial(0.025), []);
  const shadowGeo = useDisposable(() => new THREE.PlaneGeometry(1.8, 0.24), []);
  const shadow = useDisposable(() => new THREE.MeshBasicMaterial({}), []);
  useEffect(() => {
    outline.color.copy(tokens.color('--h-line'));
    shadow.color.copy(tokens.color('--h-shadow-ink'));
  }, [tokens, outline, shadow]);
  return (
    <group>
      <mesh geometry={shadowGeo} material={shadow} position={[0.1, 0.02, -0.4]} />
      <mesh geometry={geometry} material={material} />
      <mesh geometry={hull} material={outline} />
    </group>
  );
}

type Sim = {
  beam: RBody;
  pans: [RBody, RBody];
  weights: RBody[];
  joint: { configureMotorPosition: (t: number, k: number, c: number) => void; setLimits: (lo: number, hi: number) => void };
  order: (0 | 1)[];
  spawnAt: number[];
  spawned: number;
  landed: [number, number];
  stack: [number, number];
  target: number;
  final: number;
  t: number;
  acc: number;
  calm: number;
  done: boolean;
};

function Balance({
  scores,
  winner,
  angle,
  juice,
  onSettled,
  onPans,
}: {
  scores: readonly [number, number];
  winner: 0 | 1 | null;
  angle: number;
  juice: Juice;
  onSettled?: () => void;
  onPans: (x0: number, x1: number, width: number) => void;
}) {
  const stage = useStage();
  const { world, rapier } = useRapier();
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const calm = stage.reduced || stage.settled;
  const order = useMemo(() => dropOrder(scores, winner), [scores, winner]);
  const final = toRot(angle);
  const sim = useRef<Sim | null>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const settledCb = useRef(onSettled);
  settledCb.current = onSettled;
  const landing = useMemo(() => new LandingWatch(1.0), []);

  const beamMesh = useRef<THREE.Mesh>(null);
  const beamHull = useRef<THREE.Mesh>(null);
  const panMesh = useRef<THREE.InstancedMesh>(null);
  const weightMesh = useRef<THREE.InstancedMesh>(null);
  const strings = useRef<THREE.LineSegments>(null);

  const v = stage.tokens.version;
  const beamGeo = useDisposable(() => {
    const steel = stage.tokens.color('--h-ink-2');
    const brass = stage.tokens.color('--h-brass');
    return merge([
      paint(new THREE.BoxGeometry(ARM * 2 + 0.2, 0.14, 0.16), steel),
      place(paint(new THREE.CylinderGeometry(0.17, 0.17, 0.24, 20), brass), [0, 0, 0], [Math.PI / 2, 0, 0]),
      place(paint(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 12), brass), [-ARM, 0, 0], [Math.PI / 2, 0, 0]),
      place(paint(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 12), brass), [ARM, 0, 0], [Math.PI / 2, 0, 0]),
    ]);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const beamHullGeo = useDisposable(() => hullGeometry(beamGeo), [beamGeo]);
  const panGeo = useDisposable(() => {
    const brass = stage.tokens.color('--h-brass');
    const rim = new THREE.CylinderGeometry(PAN_R, PAN_R * 0.8, 0.16, 28, 1, true);
    return merge([place(paint(rim, brass), [0, 0.08, 0]), place(paint(new THREE.CircleGeometry(PAN_R * 0.8, 28), brass), [0, 0.001, 0], [-Math.PI / 2, 0, 0])]);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const toonVC = useDisposable(() => toon({ vertexColors: true, side: THREE.DoubleSide }), []);
  const outline = useDisposable(() => outlineMaterial(0.022), []);
  const weightGeo = useDisposable(() => new THREE.BoxGeometry(WT.w, WT.h, WT.d), []);
  const weightTex = useDisposable(
    () => packetTexture(stage.tokens.raw('--h-manila') || 'tan', stage.tokens.raw('--h-manila-2') || 'peru', stage.tokens.raw('--h-tape') || 'red'),
    [v], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const weightMat = useDisposable(() => toon({ map: weightTex }), [weightTex]);
  const lineGeo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3));
    return g;
  }, []);
  const lineMat = useDisposable(() => new THREE.LineBasicMaterial({}), []);
  useEffect(() => {
    outline.color.copy(stage.tokens.color('--h-line'));
    lineMat.color.copy(stage.tokens.color('--h-line'));
  }, [stage.tokens, outline, lineMat]);

  // Name plates follow the pans on screen (the canvas fits any aspect).
  useLayoutEffect(() => {
    const p = new THREE.Vector3();
    const xs = [-ARM, ARM].map((x) => {
      p.set(x, PIVOT_Y - HANG, 0).project(camera);
      return ((p.x + 1) / 2) * size.width;
    });
    onPans(xs[0], xs[1], size.width);
  });

  useEffect(() => {
    const t0 = performance.now();
    world.timestep = STEP;
    const post = world.createRigidBody(rapier.RigidBodyDesc.fixed().setTranslation(0, PIVOT_Y, 0));
    const beam = world.createRigidBody(rapier.RigidBodyDesc.dynamic().setTranslation(0, PIVOT_Y, 0).setAngularDamping(0.2).setCanSleep(false));
    // The beam collides with nothing (weights land in the pans, not on it); it just carries mass.
    world.createCollider(rapier.ColliderDesc.cuboid(ARM + 0.1, 0.07, 0.08).setDensity(2).setCollisionGroups(0x00020000), beam);
    const jd = rapier.JointData.revolute({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    const joint = world.createImpulseJoint(jd, post, beam, true) as unknown as Sim['joint'];
    // Limits = the true angle (a draw may dip one 6° step towards the first weight, then returns).
    const lean = order.length ? (order[0] === 0 ? deg(6) : -deg(6)) : 0;
    const lo = angle !== 0 ? Math.min(0, final) : Math.min(0, lean);
    const hi = angle !== 0 ? Math.max(0, final) : Math.max(0, lean);
    joint.setLimits(lo - 1e-4, hi + 1e-4);
    const pan = (x: number) => {
      const b = world.createRigidBody(rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(x, PIVOT_Y - HANG, 0));
      world.createCollider(rapier.ColliderDesc.cylinder(0.04, PAN_R * 0.8).setTranslation(0, 0.0, 0).setFriction(1), b);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0));
        world.createCollider(
          rapier.ColliderDesc.cuboid(0.03, 0.12, 0.26)
            .setTranslation(Math.cos(a) * PAN_R * 0.85, 0.1, Math.sin(a) * PAN_R * 0.85)
            .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
            .setFriction(1),
          b,
        );
      }
      return b;
    };
    const pans: [RBody, RBody] = [pan(-ARM), pan(ARM)];
    const weights: RBody[] = order.map((_, i) => {
      const b = world.createRigidBody(rapier.RigidBodyDesc.dynamic().setTranslation(0, -20 - i, 0).setCcdEnabled(true).setAngularDamping(0.6));
      world.createCollider(rapier.ColliderDesc.cuboid(WT.w / 2, WT.h / 2, WT.d / 2).setDensity(1).setFriction(0.9).setRestitution(0.1), b);
      b.setEnabled(false);
      return b;
    });
    const n = order.length;
    const gap = n > 1 ? Math.min(0.42, 1.55 / (n - 1)) : 0.42;
    const spawnAt = order.map((_, i) => 0.3 + i * gap);
    const s: Sim = { beam, pans, weights, joint, order, spawnAt, spawned: 0, landed: [0, 0], stack: [0, 0], target: 0, final, t: 0, acc: 0, calm: 0, done: false };
    sim.current = s;
    joint.configureMotorPosition(0, 50, 4.2);
    threeStats.put('tarazu', { bodies: 1 + weights.length + 2 });

    if (calm) {
      // Final state at once: beam at the true angle, pans under its ends, the weights resting in
      // their pans; one frame.
      setBeam(s, final);
      joint.configureMotorPosition(final, 200, 30);
      const c = Math.cos(final);
      const sn = Math.sin(final);
      pans[0].setTranslation({ x: -ARM * c, y: PIVOT_Y - ARM * sn - HANG, z: 0 }, true);
      pans[1].setTranslation({ x: ARM * c, y: PIVOT_Y + ARM * sn - HANG, z: 0 }, true);
      order.forEach((seat, i) => {
        const b = weights[i];
        const k = s.stack[seat]++;
        const p = pans[seat].translation();
        b.setEnabled(true);
        b.setTranslation({ x: p.x + (k % 2 ? 0.05 : -0.05), y: p.y + 0.1 + WT.h / 2 + k * (WT.h + 0.01), z: 0 }, true);
      });
      for (let k = 0; k < 40; k++) {
        followPans(s);
        world.step();
      }
      setBeam(s, final);
      followPans(s);
      sync(s);
      s.done = true;
      threeStats.put('tarazu', { restMs: performance.now() - t0 });
      stageRef.current.freeze();
    }
    sync(s);
    invalidate();
    // No cleanup: <Physics> frees the world on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, rapier]);

  function setBeam(s: Sim, rot: number) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rot));
    s.beam.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    s.beam.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
  function beamRot(s: Sim) {
    const r = s.beam.rotation();
    return new THREE.Euler().setFromQuaternion(new THREE.Quaternion(r.x, r.y, r.z, r.w)).z;
  }
  function followPans(s: Sim) {
    const a = beamRot(s);
    const c = Math.cos(a);
    const sn = Math.sin(a);
    s.pans[0].setNextKinematicTranslation({ x: -ARM * c, y: PIVOT_Y - ARM * sn - HANG, z: 0 });
    s.pans[1].setNextKinematicTranslation({ x: ARM * c, y: PIVOT_Y + ARM * sn - HANG, z: 0 });
  }

  const tmp = useMemo(() => new THREE.Matrix4(), []);
  function sync(s: Sim) {
    const bm = beamMesh.current;
    if (bm) {
      const r = s.beam.rotation();
      bm.quaternion.set(r.x, r.y, r.z, r.w);
      beamHull.current?.quaternion.copy(bm.quaternion);
    }
    const pm = panMesh.current;
    if (pm) {
      pm.setMatrixAt(0, bodyMatrix(s.pans[0], tmp));
      pm.setMatrixAt(1, bodyMatrix(s.pans[1], tmp));
      pm.instanceMatrix.needsUpdate = true;
    }
    const wm = weightMesh.current;
    if (wm) {
      let n = 0;
      for (const b of s.weights) if (b.isEnabled()) wm.setMatrixAt(n++, bodyMatrix(b, tmp));
      wm.count = n;
      wm.instanceMatrix.needsUpdate = true;
    }
    const ls = strings.current;
    if (ls) {
      const pos = lineGeo.getAttribute('position') as THREE.BufferAttribute;
      const a = beamRot(s);
      let k = 0;
      ([0, 1] as const).forEach((seat) => {
        const ex = (seat === 0 ? -ARM : ARM) * Math.cos(a);
        const ey = PIVOT_Y + (seat === 0 ? -ARM : ARM) * Math.sin(a);
        const p = s.pans[seat].translation();
        for (const [dx, dz] of [
          [-PAN_R * 0.95, 0.05],
          [PAN_R * 0.95, 0.05],
          [0, -PAN_R * 0.9],
        ] as const) {
          pos.setXYZ(k++, ex, ey, 0);
          pos.setXYZ(k++, p.x + dx, p.y + 0.16, p.z + dz);
        }
      });
      pos.needsUpdate = true;
      lineGeo.computeBoundingSphere();
    }
  }

  useFrame((_, delta) => {
    const s = sim.current;
    const st = stageRef.current;
    if (!s || s.done || st.frozen || calm || !st.active) return;
    s.acc += Math.min(delta, 1 / 20);
    while (s.acc >= STEP) {
      s.acc -= STEP;
      s.t += STEP;
      while (s.spawned < s.order.length && s.t >= s.spawnAt[s.spawned]) {
        const i = s.spawned++;
        const seat = s.order[i];
        const b = s.weights[i];
        const r = seeded(`tarazu:${i}:${seat}`);
        const p = s.pans[seat].translation();
        const k = s.stack[seat]++;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, (r() - 0.5) * 0.6, (r() - 0.5) * 0.3));
        b.setEnabled(true);
        b.setTranslation({ x: p.x + (r() - 0.5) * 0.16, y: p.y + 0.62 + k * WT.h, z: (r() - 0.5) * 0.12 }, true);
        b.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
        b.setLinvel({ x: 0, y: -2.2, z: 0 }, true);
      }
      followPans(s);
      world.step();
      s.weights.forEach((b, i) => {
        if (!b.isEnabled()) return;
        if (!landing.check(i, b.linvel().y)) return;
        const seat = s.order[i];
        s.landed[seat]++;
        const d = s.landed[0] - s.landed[1];
        s.target = clamp(deg(6) * d, -deg(24), deg(24));
        s.joint.configureMotorPosition(s.target, 50, 4.2);
        if (st.cues) juice.sound('stamp', { pitch: 0.62, gain: 0.55 });
      });
      const allIn = s.spawned >= s.order.length && s.landed[0] + s.landed[1] >= s.order.length;
      if (allIn && Math.abs(s.target - s.final) > 1e-6) {
        s.target = s.final;
        s.joint.configureMotorPosition(s.final, 50, 4.2);
      }
      const w = s.beam.angvel().z;
      const settled = allIn && Math.abs(w) < 0.03 && Math.abs(beamRot(s) - s.final) < deg(0.3);
      s.calm = settled ? s.calm + STEP : 0;
      const last = s.spawnAt.length ? s.spawnAt[s.spawnAt.length - 1] : 0;
      if (s.calm > 0.25 || s.t > Math.max(2.4, last + 1.6)) {
        // Exact true angle, then a few steps so the weights sit in the pans' final place.
        setBeam(s, s.final);
        s.joint.configureMotorPosition(s.final, 200, 30);
        for (let k = 0; k < 12; k++) {
          followPans(s);
          world.step();
          setBeam(s, s.final);
        }
        s.done = true;
        break;
      }
    }
    sync(s);
    if (s.done) {
      st.freeze();
      if (st.cues) juice.haptic('medium');
      settledCb.current?.();
    }
  });

  return (
    <group>
      <group position={[0, PIVOT_Y, 0]}>
        <mesh ref={beamMesh} geometry={beamGeo} material={toonVC} />
        <mesh ref={beamHull} geometry={beamHullGeo} material={outline} />
      </group>
      <instancedMesh ref={panMesh} args={[undefined, undefined, 2]} geometry={panGeo} material={toonVC} frustumCulled={false} />
      <instancedMesh ref={weightMesh} args={[undefined, undefined, Math.max(1, order.length)]} geometry={weightGeo} material={weightMat} frustumCulled={false} />
      <lineSegments ref={strings} geometry={lineGeo} material={lineMat} frustumCulled={false} />
    </group>
  );
}

function Plates({ names, scores, pans }: { names: readonly [string, string]; scores: readonly [number, number]; pans: { x0: number; x1: number; width: number } | null }) {
  const refs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  const box = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    if (!pans) return;
    // Each plate is as wide as its words; centre it under its pan, never past the box's edges.
    const W = box.current?.offsetWidth ?? pans.width;
    const next = [pans.x0, pans.x1].map((x, i) => {
      const el = refs[i].current;
      const w = el ? el.offsetWidth : 80;
      const left = Math.min(Math.max(x - w / 2, 0), Math.max(0, W - w));
      const natural = i === 0 ? 0 : W / 2;
      return Math.round(left - natural);
    }) as [number, number];
    if (next[0] !== shift[0] || next[1] !== shift[1]) setShift(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pans, names]);
  return (
    <div className="h-t3__plates" aria-hidden="true" ref={box}>
      {([0, 1] as const).map((i) => (
        <span key={i} ref={refs[i]} className="h-t3__plate" style={{ transform: `translateX(${shift[i]}px)` } as CSSProperties}>
          <span className="h-t3__plate-name">{names[i]}</span>
          <span className="h-t3__plate-score">{scores[i]}</span>
        </span>
      ))}
    </div>
  );
}

export default function TarazuScene({ scores, names, winner, angle, onSettled, ...runtime }: TarazuSceneProps & SceneRuntime) {
  const juice = useJuice();
  const [pans, setPans] = useState<{ x0: number; x1: number; width: number } | null>(null);
  const onPans = useMemo(
    () => (x0: number, x1: number, width: number) =>
      setPans((p) => (p && Math.abs(p.x0 - x0) < 1 && Math.abs(p.x1 - x1) < 1 && p.width === width ? p : { x0, x1, width })),
    [],
  );
  return (
    <div className="h-t3 h-t3--tarazu">
      <HFrame piece="tarazu" runtime={runtime} camera={{ fov: 26, position: [0, 3, 12] }}>
        <Lights />
        <FitCamera center={[0, 1.55, 0]} size={[ARM * 2 + PAN_R * 2 + 0.2, 3.1, 1.4]} dir={[0, 0.12, 1]} margin={1.03} />
        <Physics paused gravity={[0, -12, 0]}>
          <Stand />
          <Balance scores={scores} winner={winner} angle={angle} juice={juice} onSettled={onSettled} onPans={onPans} />
        </Physics>
      </HFrame>
      <Plates names={names} scores={scores} pans={pans} />
    </div>
  );
}
