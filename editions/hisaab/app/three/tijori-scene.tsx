/**
 * three/tijori-scene.tsx — TIJORI in Rapier (lazy chunk). Sibling of components/three/gem-vault.tsx.
 *
 * A glass-front steel safe. Every ten receipts are a manila packet tied with red tape; the remainder are
 * loose ₹ coins — so the safe holds exactly the count (packets past 72 wait behind a full safe; the
 * printed number carries the rest). Older packets are ONE static instanced stack with fixed colliders;
 * older loose coins start asleep on top. Only the newest receipts (≤ 12: new packets, then new coins)
 * drop through the slot. Bodies: ≤ 12 packets + ≤ 9 coins dynamic, 5 static walls + the stack.
 * Draw calls: safe, outline, glass, print-shadow, stack, packets, coins ×2 = ≤ 8 (budget 12; lab: 7–8).
 */
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, useRapier } from '@react-three/rapier';
import { useEffect, useMemo, useRef } from 'react';
import { useJuice, type Juice } from '@/components/fx';
import { HFrame, useStage } from './frame';
import {
  FitCamera,
  LandingWatch,
  Lights,
  STEP,
  bodyMatrix,
  clamp,
  coinFaceTexture,
  glintTexture,
  hullGeometry,
  merge,
  outlineMaterial,
  pacer,
  packetTexture,
  paint,
  place,
  seeded,
  toon,
  useDisposable,
  type RBody,
} from './kit';
import { threeStats, type SceneRuntime } from './runtime';
import { TijoriCount, type TijoriSceneProps } from './tijori';

// ---- dimensions (world units; floor of the safe at y = 0) ----
const W = 2.3;
const H = 2.6;
const D = 1.6;
const T = 0.14; // wall
const IN = { x0: -W / 2 + T, x1: W / 2 - T, y0: T, y1: H - T, z0: -D / 2 + T, z1: D / 2 - 0.16 };
const PK = { w: 0.6, h: 0.2, d: 0.36 }; // packet
const COLS = 3;
const ROWS = 3;
const LAYERS = 8;
export const TIJORI_CAP = COLS * ROWS * LAYERS; // 72 packets = 720 receipts on show
const COIN = { r: 0.13, h: 0.05 };

type Plan = {
  staticPackets: number;
  freshPackets: number;
  oldCoins: number;
  freshCoins: number;
};

export function planTijori(count: number, newCount: number, calm: boolean): Plan {
  const n = Math.max(0, Math.floor(count));
  const fresh = clamp(Math.floor(newCount), 0, Math.min(12, n));
  const packets = Math.floor(n / 10);
  const onShow = Math.min(packets, TIJORI_CAP);
  const loose = n % 10;
  const freshPackets = calm ? 0 : Math.min(onShow, 12, packets - Math.floor((n - fresh) / 10));
  const freshCoins = calm ? 0 : Math.min(loose, fresh);
  return { staticPackets: onShow - freshPackets, freshPackets, oldCoins: loose - freshCoins, freshCoins };
}

/** Slot k of the stack: layers bottom-up, back row first. Seeded jitter so it looks hand-stacked. */
function slot(k: number, rnd: () => number) {
  const layer = Math.floor(k / (COLS * ROWS));
  const idx = k % (COLS * ROWS);
  const row = Math.floor(idx / COLS);
  const col = idx % COLS;
  return {
    x: (col - 1) * 0.64 + (rnd() - 0.5) * 0.04,
    y: IN.y0 + PK.h / 2 + layer * PK.h,
    z: IN.z0 + 0.22 + row * 0.4 + (rnd() - 0.5) * 0.03,
    yaw: (rnd() - 0.5) * 0.12,
    col,
    row,
    layer,
  };
}

// ---- the safe (static art + fixed colliders) ----

function Safe() {
  const { tokens } = useStage();
  const { world, rapier } = useRapier();
  const v = tokens.version;
  const geometry = useDisposable(() => {
    const steel = tokens.color('--h-ink-2');
    const inner = tokens.color('--h-ground-2');
    const brass = tokens.color('--h-brass');
    const ink = tokens.color('--h-line');
    const box = (w: number, h: number, d: number, c: THREE.Color, pos: [number, number, number]) => place(paint(new THREE.BoxGeometry(w, h, d), c), pos);
    const parts = [
      box(W, T, D, steel, [0, T / 2, 0]),
      box(W, T, D, steel, [0, H - T / 2, 0]),
      box(T, H - 2 * T, D, steel, [-W / 2 + T / 2, H / 2, 0]),
      box(T, H - 2 * T, D, steel, [W / 2 - T / 2, H / 2, 0]),
      box(W - 2 * T, H - 2 * T, T, inner, [0, H / 2, -D / 2 + T / 2]),
      // Inner floor and side faces a shade of the well colour so the stack reads against them.
      box(W - 2 * T - 0.01, 0.01, D - T - 0.2, inner, [0, T + 0.006, -0.08]),
      // Front frame: slim left/top/bottom bars, a wide hinge bar on the right with the dial.
      box(0.16, H, 0.1, steel, [-W / 2 + 0.08, H / 2, D / 2 - 0.05]),
      box(W, 0.18, 0.1, steel, [0, H - 0.09, D / 2 - 0.05]),
      box(W, 0.18, 0.1, steel, [0, 0.09, D / 2 - 0.05]),
      box(0.5, H, 0.1, steel, [W / 2 - 0.25, H / 2, D / 2 - 0.05]),
      // Dial, handle, slot trim (brass) and the dark coin slot.
      place(paint(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 28), brass), [W / 2 - 0.25, H * 0.6, D / 2 + 0.03], [Math.PI / 2, 0, 0]),
      place(paint(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), ink), [W / 2 - 0.25, H * 0.6, D / 2 + 0.07], [Math.PI / 2, 0, 0]),
      box(0.08, 0.42, 0.08, brass, [W / 2 - 0.25, H * 0.38, D / 2 + 0.03]),
      box(0.74, 0.03, 0.2, brass, [0, H + 0.015, -0.05]),
      box(0.56, 0.035, 0.06, ink, [0, H + 0.02, -0.05]),
      // Feet.
      box(0.24, 0.1, 0.24, ink, [-W / 2 + 0.2, -0.05, D / 2 - 0.2]),
      box(0.24, 0.1, 0.24, ink, [W / 2 - 0.2, -0.05, D / 2 - 0.2]),
      box(0.24, 0.1, 0.24, ink, [-W / 2 + 0.2, -0.05, -D / 2 + 0.2]),
      box(0.24, 0.1, 0.24, ink, [W / 2 - 0.2, -0.05, -D / 2 + 0.2]),
    ];
    return merge(parts);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const hull = useDisposable(() => hullGeometry(geometry), [geometry]);
  const material = useDisposable(() => toon({ vertexColors: true }), []);
  const outline = useDisposable(() => outlineMaterial(0.028), []);
  const glint = useDisposable(() => glintTexture(), []);
  const glass = useDisposable(() => new THREE.MeshBasicMaterial({ map: glint, transparent: true, depthWrite: false, opacity: 1 }), [glint]);
  const glassTint = useDisposable(() => new THREE.PlaneGeometry(W - 0.66, H - 0.36), []);
  const shadowGeo = useDisposable(() => new THREE.PlaneGeometry(W, H + 0.1), []);
  const shadow = useDisposable(() => new THREE.MeshBasicMaterial({}), []);

  useEffect(() => {
    outline.color.copy(tokens.color('--h-line'));
    shadow.color.copy(tokens.color('--h-shadow-ink'));
    glass.color.copy(tokens.color('--h-paper'));
  }, [tokens, outline, shadow, glass]);

  // Five static walls (floor, back, left, right, glass front).
  useEffect(() => {
    const body = world.createRigidBody(rapier.RigidBodyDesc.fixed());
    const c = (hx: number, hy: number, hz: number, x: number, y: number, z: number) =>
      world.createCollider(rapier.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(0.7).setRestitution(0.2), body);
    c(W / 2, T / 2, D / 2, 0, T / 2, 0);
    c(W / 2, H / 2, T / 2, 0, H / 2, IN.z0 - T / 2);
    c(T / 2, H / 2, D / 2, IN.x0 - T / 2, H / 2, 0);
    c(T / 2, H / 2, D / 2, IN.x1 + T / 2, H / 2, 0);
    c(W / 2, H / 2, 0.05, 0, H / 2, IN.z1 + 0.05);
    // No cleanup: <Physics> frees the whole world on unmount (and runs its cleanup first).
  }, [world, rapier]);

  return (
    <group>
      <mesh geometry={shadowGeo} material={shadow} position={[0.16, H / 2 - 0.2, -D / 2 - 0.04]} />
      <mesh geometry={geometry} material={material} />
      <mesh geometry={hull} material={outline} />
      <mesh geometry={glassTint} material={glass} position={[-0.17, H / 2, D / 2 - 0.02]} renderOrder={3} />
    </group>
  );
}

// ---- the contents (packets + coins) ----

type Sim = {
  bodies: RBody[];
  stackTop: number;
  staticSlots: ReturnType<typeof slot>[];
  packets: RBody[]; // fresh packets (dynamic)
  coins: RBody[]; // old coins first, then fresh coins
  oldCoins: number;
  spawnAt: number[]; // sim time each fresh body appears (packets then coins); index into [packets, fresh coins]
  spawned: number;
  t: number;
  acc: number;
  quietFor: number;
  landed: boolean;
  done: boolean;
};

function Contents({ count, newCount, juice }: { count: number; newCount: number; juice: Juice }) {
  const stage = useStage();
  const { world, rapier } = useRapier();
  const calm = stage.reduced || stage.settled;
  const plan = useMemo(() => planTijori(count, newCount, calm), [count, newCount, calm]);
  const rnd = useMemo(() => seeded(`tijori:${count}`), [count]);
  const stackMesh = useRef<THREE.InstancedMesh>(null);
  const packetMesh = useRef<THREE.InstancedMesh>(null);
  const coinMesh = useRef<THREE.InstancedMesh>(null);
  const sim = useRef<Sim | null>(null);
  const landing = useMemo(() => new LandingWatch(1.2), []);
  const ping = useMemo(() => pacer(6), []);
  const tone = useMemo(() => seeded(`tijori-tone:${count}`), [count]);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const invalidate = useThree((st) => st.invalidate);

  const packetGeo = useDisposable(() => new THREE.BoxGeometry(PK.w, PK.h, PK.d), []);
  const packetTex = useDisposable(
    () => packetTexture(stage.tokens.raw('--h-manila') || 'tan', stage.tokens.raw('--h-manila-2') || 'peru', stage.tokens.raw('--h-tape') || 'red'),
    [stage.tokens.version], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const packetMat = useDisposable(() => toon({ map: packetTex }), [packetTex]);
  const coinGeo = useDisposable(() => {
    const g = new THREE.CylinderGeometry(COIN.r, COIN.r, COIN.h, 22, 1);
    // Side = group 0; both caps share group 1 (two draw calls, not three).
    const side = g.groups[0];
    const total = g.index ? g.index.count : g.getAttribute('position').count;
    g.clearGroups();
    g.addGroup(0, side.count, 0);
    g.addGroup(side.count, total - side.count, 1);
    return g;
  }, []);
  const coinFace = useDisposable(
    () => coinFaceTexture(stage.tokens.raw('--h-brass') || 'goldenrod', stage.tokens.raw('--h-brass-text') || 'saddlebrown', stage.tokens.raw('--h-font-mono') || 'monospace'),
    [stage.tokens.version], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const coinSide = useDisposable(() => toon({}), []);
  const coinCap = useDisposable(() => toon({ map: coinFace }), [coinFace]);
  const coinMats = useMemo(() => [coinSide, coinCap], [coinSide, coinCap]);

  useEffect(() => {
    coinSide.color.copy(stage.tokens.color('--h-brass-text')).lerp(stage.tokens.color('--h-brass'), 0.45);
  }, [stage.tokens, coinSide]);

  // Build the world once per plan (a new plan first removes the previous plan's bodies; on unmount
  // <Physics> frees the whole world, so there is no cleanup that could touch a freed world).
  useEffect(() => {
    const t0 = performance.now();
    world.timestep = STEP;
    for (const b of sim.current?.bodies ?? []) world.removeRigidBody(b);
    const bodies: RBody[] = [];
    const stack = world.createRigidBody(rapier.RigidBodyDesc.fixed());
    bodies.push(stack);
    const staticSlots: ReturnType<typeof slot>[] = [];
    for (let k = 0; k < plan.staticPackets; k++) {
      const s = slot(k, rnd);
      staticSlots.push(s);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.yaw, 0));
      world.createCollider(
        rapier.ColliderDesc.cuboid(PK.w / 2, PK.h / 2, PK.d / 2).setTranslation(s.x, s.y, s.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }).setFriction(0.8),
        stack,
      );
    }
    // Height of the stack's top above a column (for resting coins on it).
    const topAt = (col: number, row: number) => {
      let y = IN.y0;
      for (const s of staticSlots) if (s.col === col && s.row === row) y = Math.max(y, s.y + PK.h / 2);
      return y;
    };
    const stackTop = staticSlots.reduce((m, s) => Math.max(m, s.y + PK.h / 2), IN.y0);

    const dyn = (desc: ReturnType<typeof rapier.RigidBodyDesc.dynamic>) => {
      const b = world.createRigidBody(desc.setLinearDamping(0.1).setAngularDamping(0.5).setCcdEnabled(true));
      bodies.push(b);
      return b;
    };
    const packets: RBody[] = [];
    for (let i = 0; i < plan.freshPackets; i++) {
      const b = dyn(rapier.RigidBodyDesc.dynamic().setTranslation(0, -20 - i, 0));
      world.createCollider(rapier.ColliderDesc.cuboid(PK.w / 2, PK.h / 2, PK.d / 2).setDensity(1.4).setFriction(0.8).setRestitution(0.15), b);
      b.setEnabled(false);
      packets.push(b);
    }
    const coins: RBody[] = [];
    const coinCount = plan.oldCoins + plan.freshCoins;
    for (let i = 0; i < coinCount; i++) {
      const old = i < plan.oldCoins;
      let x = 0;
      let y = -30 - i;
      let z = 0;
      if (old) {
        const col = Math.floor(rnd() * COLS);
        const row = 1 + Math.floor(rnd() * (ROWS - 1));
        x = (col - 1) * 0.64 + (rnd() - 0.5) * 0.3;
        z = IN.z0 + 0.22 + row * 0.4 + (rnd() - 0.5) * 0.2;
        y = topAt(col, row) + COIN.h / 2 + 0.02 + i * 0.06;
      }
      // Coins settle fast (a coin rolling on its rim for seconds would keep the loop running).
      const b = dyn(rapier.RigidBodyDesc.dynamic().setTranslation(x, y, z));
      b.setAngularDamping(1.6);
      b.setLinearDamping(0.3);
      world.createCollider(rapier.ColliderDesc.cylinder(COIN.h / 2, COIN.r).setDensity(3).setFriction(0.65).setRestitution(0.25), b);
      if (!old) b.setEnabled(false);
      coins.push(b);
    }

    // Spawn times: packets first, then coins through the slot.
    const spawnAt: number[] = [];
    let at = 0.25;
    for (let i = 0; i < plan.freshPackets; i++) {
      spawnAt.push(at);
      at += 0.16;
    }
    for (let i = 0; i < plan.freshCoins; i++) {
      spawnAt.push(at);
      at += 0.12;
    }

    const s: Sim = { bodies, stackTop, staticSlots, packets, coins, oldCoins: plan.oldCoins, spawnAt, spawned: 0, t: 0, acc: 0, quietFor: 0, landed: false, done: false };
    sim.current = s;

    // Old coins settle off-screen (90 steps, the whole reduced-motion budget): the safe opens at rest.
    for (let k = 0; k < 90; k++) world.step();

    const stack3 = stackMesh.current;
    if (stack3) {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      staticSlots.forEach((sl, i) => {
        q.setFromEuler(new THREE.Euler(0, sl.yaw, 0));
        stack3.setMatrixAt(i, m.compose(new THREE.Vector3(sl.x, sl.y, sl.z), q, new THREE.Vector3(1, 1, 1)));
      });
      stack3.count = staticSlots.length;
      stack3.instanceMatrix.needsUpdate = true;
    }
    threeStats.put('tijori', { bodies: packets.length + coins.length + 1 + 1 });

    if (calm) {
      // Reduced motion / settled re-mount: everything is already in its final place; one frame.
      threeStats.put('tijori', { restMs: performance.now() - t0 });
      syncMeshes(s);
      stageRef.current.freeze();
    }
    syncMeshes(s);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, rapier, plan]);

  const tmp = useMemo(() => new THREE.Matrix4(), []);
  function syncMeshes(s: Sim) {
    const pm = packetMesh.current;
    if (pm) {
      let n = 0;
      for (const b of s.packets) {
        if (!b.isEnabled()) continue;
        pm.setMatrixAt(n++, bodyMatrix(b, tmp));
      }
      pm.count = n;
      pm.instanceMatrix.needsUpdate = true;
    }
    const cm = coinMesh.current;
    if (cm) {
      let n = 0;
      for (const b of s.coins) {
        if (!b.isEnabled()) continue;
        cm.setMatrixAt(n++, bodyMatrix(b, tmp));
      }
      cm.count = n;
      cm.instanceMatrix.needsUpdate = true;
    }
  }

  // Initial pose (asleep coins, the stack) before the loop starts.
  useEffect(() => {
    if (sim.current) syncMeshes(sim.current);
  });

  useFrame((_, delta) => {
    const s = sim.current;
    const st = stageRef.current;
    if (!s || s.done || st.frozen || calm || !st.active) return;
    s.acc += Math.min(delta, 1 / 20);
    while (s.acc >= STEP) {
      s.acc -= STEP;
      s.t += STEP;
      // Spawn on schedule.
      while (s.spawned < s.spawnAt.length && s.t >= s.spawnAt[s.spawned]) {
        const i = s.spawned++;
        const r = seeded(`tijori-drop:${count}:${i}`);
        const top = s.stackTop;
        if (i < s.packets.length) {
          const b = s.packets[i];
          const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, r() * Math.PI, (r() - 0.5) * 0.5));
          b.setEnabled(true);
          b.setTranslation({ x: (r() - 0.5) * 1.0, y: Math.min(IN.y1 - 0.2, top + 0.9), z: IN.z0 + 0.35 + r() * 0.45 }, true);
          b.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
          b.setLinvel({ x: 0, y: -1, z: 0 }, true);
        } else {
          const b = s.coins[s.oldCoins + (i - s.packets.length)];
          const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 2.4, r() * Math.PI, (r() - 0.5) * 2.4));
          b.setEnabled(true);
          b.setTranslation({ x: (r() - 0.5) * 0.3, y: IN.y1 - 0.12, z: -0.05 + (r() - 0.5) * 0.2 }, true);
          b.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
          b.setLinvel({ x: (r() - 0.5) * 0.6, y: -1.5, z: (r() - 0.5) * 0.6 }, true);
          b.setAngvel({ x: (r() - 0.5) * 10, y: (r() - 0.5) * 4, z: (r() - 0.5) * 10 }, true);
        }
      }
      world.step();
      // Landings → a coin ping (≤ 6/s, ±3 semitones) and one light tap on the first.
      const all = [...s.packets, ...s.coins];
      let moving = false;
      for (let k = 0; k < all.length; k++) {
        const b = all[k];
        if (!b.isEnabled()) continue;
        const lv = b.linvel();
        const av = b.angvel();
        if (!b.isSleeping() && (Math.abs(lv.x) + Math.abs(lv.y) + Math.abs(lv.z) > 0.15 || Math.abs(av.x) + Math.abs(av.y) + Math.abs(av.z) > 0.9)) moving = true;
        if (landing.check(k, lv.y) && st.cues && ping(performance.now())) {
          const semis = Math.round(tone() * 6) - 3;
          juice.sound('gem', { pitch: Math.pow(2, semis / 12), gain: 0.7 });
          if (!s.landed) juice.haptic('light');
          s.landed = true;
        }
      }
      const allSpawned = s.spawned >= s.spawnAt.length;
      s.quietFor = allSpawned && !moving ? s.quietFor + STEP : 0;
      const last = s.spawnAt.length ? s.spawnAt[s.spawnAt.length - 1] : 0;
      if ((allSpawned && s.quietFor > 0.25) || s.t > last + 1.5) {
        s.done = true;
        break;
      }
    }
    syncMeshes(s);
    if (s.done) st.freeze();
  });

  const maxStack = Math.max(1, plan.staticPackets);
  return (
    <group>
      <instancedMesh ref={stackMesh} args={[undefined, undefined, maxStack]} geometry={packetGeo} material={packetMat} frustumCulled={false} />
      <instancedMesh ref={packetMesh} args={[undefined, undefined, Math.max(1, plan.freshPackets)]} geometry={packetGeo} material={packetMat} frustumCulled={false} />
      <instancedMesh ref={coinMesh} args={[undefined, undefined, Math.max(1, plan.oldCoins + plan.freshCoins)]} geometry={coinGeo} material={coinMats} frustumCulled={false} />
    </group>
  );
}

export default function TijoriScene({ count, newCount, shownNew, ...runtime }: TijoriSceneProps & SceneRuntime) {
  const juice = useJuice();
  return (
    <div className="h-t3 h-t3--tijori">
      <HFrame piece="tijori" runtime={runtime} camera={{ fov: 28, position: [3, 4, 9] }}>
        <Lights />
        <FitCamera center={[0.05, H / 2 - 0.05, 0]} size={[W + 0.35, H + 0.25, D]} dir={[0.34, 0.3, 1]} margin={1.04} />
        <Physics paused gravity={[0, -14, 0]}>
          <Safe />
          <Contents count={count} newCount={newCount} juice={juice} />
        </Physics>
      </HFrame>
      <TijoriCount count={count} newCount={shownNew} />
    </div>
  );
}
