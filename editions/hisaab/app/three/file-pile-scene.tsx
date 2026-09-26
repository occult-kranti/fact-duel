/**
 * three/file-pile-scene.tsx — FILE PILE in Rapier (lazy chunk).
 *
 * Six manila covers (dynamic cuboids) drop 90 ms apart onto a desk, each with its front edge in the
 * TRUE result's colour (APPROVED green / OBJECTION red / PENDING ochre); a red-tape strap (kinematic)
 * comes down onto the pile and its ends drop to tie it; THAPPA stamps FILE CLEARED · n/m on the top
 * cover and lifts away. ≤ 2.2 s, then the loop stops. Bodies: 6 dynamic + 1 kinematic strap + the stamp
 * + the desk. Draw calls: desk, covers, cover outline, edges, strap top, strap ends, stamp (+ outline),
 * impression = ≤ 9 (budget 10; lab: 7 on the frozen frame).
 */
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, useRapier } from '@react-three/rapier';
import { useEffect, useMemo, useRef } from 'react';
import { useJuice, type Juice } from '@/components/fx';
import { stampAngle } from '../ui/seed';
import { HFrame, useStage } from './frame';
import {
  FitCamera,
  LandingWatch,
  Lights,
  STEP,
  bodyMatrix,
  easeInOut,
  easeOutCubic,
  hullGeometry,
  merge,
  outlineMaterial,
  paint,
  place,
  seeded,
  toon,
  useDisposable,
  type RBody,
} from './kit';
import { FilePileCaption, type FilePileSceneProps, type FileResult } from './file-pile';
import { threeStats, type SceneRuntime } from './runtime';
import { StampRig } from './stamp-rig';

const CV = { w: 2.2, h: 0.07, d: 1.5 };
const DESK = { w: 2.9, d: 2.1, h: 0.16 };
const GAP = 0.09;
const TAPE_W = 0.24;
const TAPE_X = -0.78; // the strap ties the left third; the stamp lands clear of it on the right
const KIND_TOKEN: Record<FileResult, string> = { pass: '--h-pass', fail: '--h-fail', wait: '--h-wait' };

type Phase = 'files' | 'strap' | 'stamp' | 'done';

type Sim = {
  covers: RBody[];
  strap: RBody;
  rig: StampRig | null;
  phase: Phase;
  t: number;
  acc: number;
  spawned: number;
  landed: number;
  quiet: number;
  strapAt: number;
  strapFrom: number;
  strapTo: number;
  ends: number; // 0..1 growth of the strap's ends
  stampAt: number;
};

function Pile({ results, title, stamp, juice }: FilePileSceneProps & { juice: Juice }) {
  const stage = useStage();
  const { world, rapier } = useRapier();
  const invalidate = useThree((s) => s.invalidate);
  const calm = stage.reduced || stage.settled;
  const six = useMemo(() => results.slice(0, 6), [results]);
  const sim = useRef<Sim | null>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const landing = useMemo(() => new LandingWatch(1.0), []);
  const holder = useMemo(() => new THREE.Group(), []);

  const coverMesh = useRef<THREE.InstancedMesh>(null);
  const hullMesh = useRef<THREE.InstancedMesh>(null);
  const edgeMesh = useRef<THREE.InstancedMesh>(null);
  const strapTop = useRef<THREE.Mesh>(null);
  const strapEnds = useRef<THREE.Mesh>(null);

  const v = stage.tokens.version;
  const deskGeo = useDisposable(() => {
    const paper = stage.tokens.color('--h-paper');
    const line = stage.tokens.color('--h-line');
    const shadow = stage.tokens.color('--h-shadow-ink');
    return merge([
      place(paint(new THREE.BoxGeometry(DESK.w, 0.02, DESK.d), shadow), [0.12, -DESK.h - 0.01, 0.12]),
      place(paint(new THREE.BoxGeometry(DESK.w + 0.06, DESK.h, DESK.d + 0.06), line), [0, -DESK.h / 2 - 0.005, 0]),
      place(paint(new THREE.BoxGeometry(DESK.w, 0.012, DESK.d), paper), [0, -0.006, 0]),
    ]);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const coverGeo = useDisposable(() => {
    const manila = stage.tokens.color('--h-manila');
    const tab = stage.tokens.color('--h-manila-2');
    return merge([
      paint(new THREE.BoxGeometry(CV.w, CV.h, CV.d), manila),
      place(paint(new THREE.BoxGeometry(0.62, CV.h * 0.9, 0.22), tab), [-CV.w / 2 + 0.5, 0, -CV.d / 2 - 0.1]),
    ]);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const coverHull = useDisposable(() => hullGeometry(coverGeo), [coverGeo]);
  const edgeGeo = useDisposable(() => new THREE.BoxGeometry(CV.w + 0.01, CV.h + 0.012, 0.05), []);
  const vc = useDisposable(() => toon({ vertexColors: true }), []);
  const outline = useDisposable(() => outlineMaterial(0.02), []);
  const edgeMat = useDisposable(() => toon({}), []);
  const tapeMat = useDisposable(() => toon({}), []);
  const tapeTopGeo = useDisposable(() => new THREE.BoxGeometry(TAPE_W, 0.014, CV.d + 0.08), []);
  const tapeEndGeo = useDisposable(() => {
    // Two hanging ends (front and back), 1 unit long, growing downwards from y = 0.
    const a = new THREE.BoxGeometry(TAPE_W, 1, 0.014);
    a.translate(0, -0.5, CV.d / 2 + 0.045);
    const b = new THREE.BoxGeometry(TAPE_W, 1, 0.014);
    b.translate(0, -0.5, -CV.d / 2 - 0.045);
    return merge([paint(a, new THREE.Color(1, 1, 1)), paint(b, new THREE.Color(1, 1, 1))]);
  }, []);
  useEffect(() => {
    outline.color.copy(stage.tokens.color('--h-line'));
    tapeMat.color.copy(stage.tokens.color('--h-tape'));
    if (stage.tokens.version > 0) sim.current?.rig?.retint(stage.tokens);
    edgeMat.color.set(1, 1, 1);
    const em = edgeMesh.current;
    if (em) {
      six.forEach((r, i) => em.setColorAt(i, stage.tokens.color(KIND_TOKEN[r])));
      if (em.instanceColor) em.instanceColor.needsUpdate = true;
    }
    invalidate();
  }, [stage.tokens, outline, tapeMat, edgeMat, six, invalidate]);

  useEffect(() => {
    const t0 = performance.now();
    world.timestep = STEP;
    const desk = world.createRigidBody(rapier.RigidBodyDesc.fixed());
    world.createCollider(rapier.ColliderDesc.cuboid(DESK.w / 2, 0.5, DESK.d / 2).setTranslation(0, -0.5, 0).setFriction(0.9).setRestitution(0.1), desk);
    const rnd = seeded(`pile:${title}:${six.join('')}`);
    const covers = six.map((_, i) => {
      const b = world.createRigidBody(rapier.RigidBodyDesc.dynamic().setTranslation(0, -20 - i, 0).setCcdEnabled(true).setLinearDamping(0.2).setAngularDamping(1.2));
      world.createCollider(rapier.ColliderDesc.cuboid(CV.w / 2, CV.h / 2, CV.d / 2).setDensity(1).setFriction(0.9).setRestitution(0.08), b);
      const off = { x: (rnd() - 0.5) * 0.22, z: (rnd() - 0.5) * 0.14, yaw: (rnd() - 0.5) * 0.16, tilt: (rnd() - 0.5) * 0.2 };
      b.userData = off;
      b.setEnabled(false);
      return b;
    });
    const strap = world.createRigidBody(rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(TAPE_X, 6, 0));
    world.createCollider(rapier.ColliderDesc.cuboid(TAPE_W / 2, 0.007, CV.d / 2 + 0.04).setFriction(0.9), strap);
    const s: Sim = { covers, strap, rig: null, phase: 'files', t: 0, acc: 0, spawned: 0, landed: 0, quiet: 0, strapAt: 0, strapFrom: 0, strapTo: 0, ends: 0, stampAt: 0 };
    sim.current = s;
    threeStats.put('pile', { bodies: covers.length + 1 + 1 + 1 });

    if (calm) {
      // Final state at once: the pile, the strap tied, the impression on top; one frame.
      covers.forEach((b, i) => placeCover(b, CV.h / 2 + i * CV.h + 0.002));
      for (let k = 0; k < 24; k++) world.step();
      const top = topY(s);
      s.strapTo = top + 0.008;
      strap.setTranslation({ x: TAPE_X, y: s.strapTo, z: 0 }, true);
      s.ends = 1;
      s.rig = makeRig(s, top);
      s.rig.settle();
      for (let k = 0; k < 6; k++) world.step();
      s.phase = 'done';
      sync(s);
      threeStats.put('pile', { restMs: performance.now() - t0 });
      stageRef.current.freeze();
    }
    sync(s);
    invalidate();
    // No cleanup: <Physics> frees the world on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, rapier]);

  useEffect(
    () => () => {
      sim.current?.rig?.dispose();
    },
    [],
  );

  function placeCover(b: RBody, y: number) {
    const off = b.userData as { x: number; z: number; yaw: number; tilt: number };
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(calm ? 0 : off.tilt * 0.4, off.yaw, calm ? 0 : off.tilt));
    b.setEnabled(true);
    b.setTranslation({ x: off.x, y, z: off.z }, true);
    b.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    b.setLinvel({ x: 0, y: calm ? 0 : -1.2, z: 0 }, true);
  }
  function topY(s: Sim) {
    let y = 0;
    for (const b of s.covers) if (b.isEnabled()) y = Math.max(y, b.translation().y + CV.h / 2);
    return y;
  }
  function makeRig(s: Sim, top: number) {
    const rig = new StampRig({
      world,
      rapier,
      tokens: stageRef.current.tokens,
      text: stamp,
      kind: 'noted',
      targetWidth: 1.45,
      yaw: (-stampAngle(`pile-${title}`) * Math.PI) / 180,
      at: { x: 0.3, z: 0.1 },
      floor: top,
      dropHeight: 0.8,
      follow: s.covers[s.covers.length - 1] ?? null,
      hold: 0.16,
      lift: 0.26,
    });
    holder.add(rig.group);
    return rig;
  }

  const tmp = useMemo(() => new THREE.Matrix4(), []);
  const edgeOffset = useMemo(() => new THREE.Matrix4().makeTranslation(0, 0, CV.d / 2 + 0.018), []);
  function sync(s: Sim) {
    const cm = coverMesh.current;
    const hm = hullMesh.current;
    const em = edgeMesh.current;
    let n = 0;
    s.covers.forEach((b) => {
      if (!b.isEnabled()) return;
      bodyMatrix(b, tmp);
      cm?.setMatrixAt(n, tmp);
      hm?.setMatrixAt(n, tmp);
      em?.setMatrixAt(n, tmp.clone().multiply(edgeOffset));
      n++;
    });
    for (const m of [cm, hm, em]) {
      if (!m) continue;
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
    }
    const st = strapTop.current;
    const se = strapEnds.current;
    const p = s.strap.translation();
    if (st) {
      st.visible = s.phase !== 'files' || s.ends > 0;
      st.position.set(p.x, p.y, p.z);
    }
    if (se) {
      se.visible = s.ends > 0.001;
      se.position.set(p.x, p.y, p.z);
      se.scale.set(1, Math.max(0.001, s.ends * Math.max(0.01, p.y)), 1);
    }
    s.rig?.sync();
  }

  useFrame((_, delta) => {
    const s = sim.current;
    const st = stageRef.current;
    if (!s || s.phase === 'done' || st.frozen || calm || !st.active) return;
    s.acc += Math.min(delta, 1 / 20);
    while (s.acc >= STEP) {
      s.acc -= STEP;
      s.t += STEP;
      // 1) Files, 90 ms apart, each from 0.8 above the place it will rest.
      while (s.spawned < s.covers.length && s.t >= 0.12 + s.spawned * GAP) {
        const i = s.spawned++;
        placeCover(s.covers[i], CV.h / 2 + i * CV.h + 0.8);
      }
      // 2) The strap, once every file has landed and (nearly) stopped: onto the pile, then the ends drop.
      const allDown = s.spawned >= s.covers.length && s.landed >= s.covers.length;
      if (s.phase === 'files' && ((allDown && s.quiet > 0.06) || s.t > 0.12 + s.covers.length * GAP + 0.55)) {
        s.phase = 'strap';
        s.strapAt = s.t;
        s.strapTo = topY(s) + 0.008;
        s.strapFrom = s.strapTo + 1.4;
        s.strap.setTranslation({ x: TAPE_X, y: s.strapFrom, z: 0 }, true);
        if (st.cues) juice.sound('whoosh', { gain: 0.7 });
      }
      if (s.phase === 'strap' || s.phase === 'stamp') {
        const k = (s.t - s.strapAt) / 0.16;
        const y = s.strapFrom + (s.strapTo - s.strapFrom) * easeOutCubic(k);
        s.strap.setNextKinematicTranslation({ x: TAPE_X, y, z: 0 });
        s.ends = easeInOut((s.t - s.strapAt - 0.14) / 0.1);
        if (s.phase === 'strap' && s.t - s.strapAt > 0.16) {
          // 3) THAPPA on the top cover.
          s.phase = 'stamp';
          s.stampAt = s.t;
          s.rig = makeRig(s, topY(s));
          s.rig.drop();
        }
      }
      world.step();
      // Landings: a tick per file, a light haptic for the first three.
      if (s.phase === 'files') {
        let moving = false;
        s.covers.forEach((b, i) => {
          if (!b.isEnabled()) return;
          const lv = b.linvel();
          if (!b.isSleeping() && (Math.abs(lv.y) > 0.12 || Math.abs(lv.x) + Math.abs(lv.z) > 0.12)) moving = true;
          if (landing.check(i, lv.y)) {
            s.landed++;
            if (st.cues) {
              juice.sound('tick', { pitch: 0.9 + 0.04 * i });
              if (s.landed <= 3) juice.haptic('light');
            }
          }
        });
        s.quiet = s.spawned >= s.covers.length && !moving ? s.quiet + STEP : 0;
      }
      if (s.rig) {
        const ev = s.rig.update(STEP);
        if (ev === 'contact' && st.cues) {
          juice.sound('stamp');
          juice.haptic('heavy');
        }
        if (ev === 'gone' || (s.phase === 'stamp' && s.t - s.stampAt > 1.0)) {
          s.phase = 'done';
          s.ends = 1;
          break;
        }
      }
      if (s.t > 2.05) {
        // Budget: whatever is still moving stops here; the rig leaves its impression.
        if (!s.rig) {
          s.rig = makeRig(s, topY(s));
          s.rig.settle();
        }
        s.ends = 1;
        s.phase = 'done';
        break;
      }
    }
    sync(s);
    if (s.phase === 'done') st.freeze();
  });

  return (
    <group>
      <mesh geometry={deskGeo} material={vc} />
      <instancedMesh ref={coverMesh} args={[undefined, undefined, 6]} geometry={coverGeo} material={vc} frustumCulled={false} />
      <instancedMesh ref={hullMesh} args={[undefined, undefined, 6]} geometry={coverHull} material={outline} frustumCulled={false} />
      <instancedMesh ref={edgeMesh} args={[undefined, undefined, 6]} geometry={edgeGeo} material={edgeMat} frustumCulled={false} />
      <mesh ref={strapTop} geometry={tapeTopGeo} material={tapeMat} visible={false} />
      <mesh ref={strapEnds} geometry={tapeEndGeo} material={tapeMat} visible={false} />
      <primitive object={holder} />
    </group>
  );
}

export default function FilePileScene({ results, title, stamp, ...runtime }: FilePileSceneProps & SceneRuntime) {
  const juice = useJuice();
  return (
    <div className="h-t3 h-t3--pile">
      <HFrame piece="pile" runtime={runtime} camera={{ fov: 30, position: [1, 5, 6] }}>
        <Lights />
        <FitCamera center={[0.05, 0.18, 0.05]} size={[DESK.w + 0.16, 0.5, DESK.d + 0.1]} dir={[0.16, 1.15, 0.8]} margin={1.0} />
        <Physics paused gravity={[0, -20, 0]}>
          <Pile results={results} title={title} stamp={stamp} juice={juice} />
        </Physics>
      </HFrame>
      <FilePileCaption results={results} title={title} stamp={stamp} />
    </div>
  );
}
