/**
 * three/thappa-scene.tsx — THAPPA in Rapier (lazy chunk).
 *
 * Seen from above (a 22° tilt), so the stamp grows towards you and falls away onto the paper — the 3D
 * cousin of the CSS slam. Before the drop, the scene measures the invisible 2D stamp the host keeps
 * underneath (its line breaks, border-box size and centre), so the ink impression is drawn at exactly
 * that size, place and seeded tilt; when the canvas unmounts (≤ 1.4 s after its first frame) the
 * static `h-stamp` that replaces it sits on the same spot. Bodies: 1 dynamic compound + 1 static
 * plane. Draw calls: stamp, its outline, impression = 3.
 */
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, useRapier } from '@react-three/rapier';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useJuice, type Juice } from '@/components/fx';
import { stampAngle } from '../ui/seed';
import { HFrame, useStage } from './frame';
import { Lights, STEP } from './kit';
import { threeStats, type SceneRuntime } from './runtime';
import { StampRig } from './stamp-rig';
import type { ThappaSceneProps } from './thappa';

const FOV = 30;
const DIST = 9;
const TILT = 0.4; // camera leans back ≈ 22° (the impression is stretched by 1/cos to compensate)
const COS = 1 / Math.sqrt(1 + TILT * TILT);
const LIFETIME = 1.35; // s of simulation, whatever happens

type Measure = { lines: string[]; box: { w: number; h: number }; dx: number; dy: number };

/** Read the 2D stamp's line breaks from the DOM (one Range per word; tops group into lines). */
function measureStamp(host: Element): Measure | null {
  const stamp = host.querySelector<HTMLElement>('.h-scenehost__under .h-stamp');
  const word = stamp?.querySelector('.h-stamp__word');
  const node = word?.firstChild;
  if (!stamp || !word || !node || node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent ?? '';
  const range = document.createRange();
  const lines: string[][] = [];
  let lastTop = -Infinity;
  const lh = parseFloat(getComputedStyle(word).fontSize) || 26;
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    range.setStart(node, m.index);
    range.setEnd(node, m.index + m[0].length);
    const top = range.getBoundingClientRect().top;
    if (top - lastTop > lh * 0.5) {
      lines.push([m[0]]);
      lastTop = top;
    } else lines[lines.length - 1].push(m[0]);
  }
  const hr = host.getBoundingClientRect();
  const sr = stamp.getBoundingClientRect();
  if (!lines.length || !sr.width) return null;
  return {
    lines: lines.map((l) => l.join(' ')),
    box: { w: stamp.offsetWidth, h: stamp.offsetHeight },
    dx: sr.left + sr.width / 2 - (hr.left + hr.width / 2),
    dy: sr.top + sr.height / 2 - (hr.top + hr.height / 2),
  };
}

function Drop({ text, kind, seed, onDone, juice, measure }: ThappaSceneProps & { juice: Juice; measure: Measure }) {
  const stage = useStage();
  const { world, rapier } = useRapier();
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const rig = useRef<StampRig | null>(null);
  const clock = useRef({ t: 0, acc: 0, contact: false, gone: false });
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const holder = useMemo(() => new THREE.Group(), []);

  useLayoutEffect(() => {
    const d = new THREE.Vector3(0, 1, TILT).normalize();
    camera.fov = FOV;
    camera.position.copy(d.multiplyScalar(DIST));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  useEffect(() => {
    world.timestep = STEP;
    // The paper: one static plane.
    const paper = world.createRigidBody(rapier.RigidBodyDesc.fixed());
    world.createCollider(rapier.ColliderDesc.cuboid(20, 0.5, 20).setTranslation(0, -0.5, 0).setRestitution(0.3).setFriction(0.9), paper);
    // CSS px → world units at the paper (distance DIST): the impression matches the 2D stamp's size.
    const worldPerPx = (2 * DIST * Math.tan((FOV * Math.PI) / 360)) / Math.max(1, size.height);
    const r = new StampRig({
      world,
      rapier,
      tokens: stage.tokens,
      text,
      kind,
      worldPerPx,
      lines: measure.lines,
      box: measure.box,
      // ui/stamp rotates clockwise on screen for +deg; seen from above that is −deg about +y.
      yaw: (-stampAngle(seed) * Math.PI) / 180,
      depthScale: 1 / COS,
      at: { x: measure.dx * worldPerPx, z: (measure.dy * worldPerPx) / COS },
      floor: 0,
      dropHeight: 2.4,
    });
    rig.current = r;
    holder.add(r.group);
    r.drop();
    threeStats.put('thappa', { bodies: 2 });
    invalidate();
    return () => {
      holder.remove(r.group);
      r.dispose();
      rig.current = null;
    };
    // Build once: the canvas is short-lived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, rapier]);

  useFrame((_, delta) => {
    const r = rig.current;
    const st = stageRef.current;
    const c = clock.current;
    if (!r || c.gone || !st.active) return;
    c.acc += Math.min(delta, 1 / 20);
    while (c.acc >= STEP) {
      c.acc -= STEP;
      c.t += STEP;
      world.step();
      const ev = r.update(STEP);
      if (ev === 'contact' && !c.contact) {
        c.contact = true;
        if (st.cues) {
          juice.sound('stamp');
          if (kind === 'pass' || /ISSUED/.test(text)) juice.sound('correct');
          else if (kind === 'fail') juice.sound('wrong');
          juice.haptic('heavy');
        }
        doneRef.current?.();
      }
      if (ev === 'gone' || c.t > LIFETIME) {
        c.gone = true;
        break;
      }
    }
    r.sync();
    if (c.gone) {
      if (!c.contact) doneRef.current?.();
      st.freeze();
      st.exit();
    }
  });

  return <primitive object={holder} />;
}

export default function ThappaScene({ text, kind, seed, onDone, ...runtime }: ThappaSceneProps & SceneRuntime) {
  const juice = useJuice();
  const root = useRef<HTMLDivElement>(null);
  const [measure, setMeasure] = useState<Measure | null>(null);
  const { onFail } = runtime;
  useLayoutEffect(() => {
    const host = root.current?.closest('.h-scenehost');
    const m = host ? measureStamp(host) : null;
    if (m) setMeasure(m);
    else onFail('measure');
  }, [onFail]);
  return (
    <div className="h-t3 h-t3--thappa" ref={root}>
      {measure ? (
        <HFrame piece="thappa" runtime={runtime} camera={{ fov: FOV, position: [0, DIST, DIST * TILT] }}>
          <Lights />
          <Physics paused gravity={[0, -30, 0]}>
            <Drop text={text} kind={kind} seed={seed} onDone={onDone} juice={juice} measure={measure} />
          </Physics>
        </HFrame>
      ) : null}
    </div>
  );
}
