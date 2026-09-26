/**
 * three/stamp-rig.ts — the rubber stamp both THAPPA and FILE PILE drop (lazy chunk).
 *
 * One dynamic compound body (a base block + a handle cylinder), restitution 0.3. It falls, bounces, and
 * on its FIRST contact leaves an ink decal (a canvas texture drawn like ui/stamp's `h-stamp`, seeded
 * tilt and all); then it turns kinematic and lifts away. Two draw calls: the stamp, the decal.
 * Driven by the owning scene's fixed-step loop (`update` once per 1/60 s step).
 */
import * as THREE from 'three';
import type { Tokens } from './frame';
import { easeInCubic, hullGeometry, merge, outlineMaterial, paint, place, stampTexture, toon, type RBody, type RNS, type RWorld, type StampKindName } from './kit';

export type RigEvent = 'contact' | 'gone' | null;

export type StampRigOptions = {
  world: RWorld;
  rapier: RNS;
  tokens: Tokens;
  text: string;
  kind: StampKindName;
  /** World units per CSS px of the stamp impression (sets the decal's real size)… */
  worldPerPx?: number;
  /** …or the impression's width in world units. */
  targetWidth?: number;
  /** Stretch along z so a tilted camera sees the impression at its true height (1 / cos tilt). */
  depthScale?: number;
  /** Seconds pressed before lifting, and the lift's length (defaults 0.3 / 0.36). */
  hold?: number;
  lift?: number;
  /** Rotation about +y in radians (the 2D stamp's seeded tilt, mirrored for a top-down view). */
  yaw: number;
  /** Where the impression lands (x, z) and the height it falls from above `floor`. */
  at: { x: number; z: number };
  floor: number;
  dropHeight: number;
  /** A body the impression rides on (FILE PILE's top cover). */
  follow?: RBody | null;
  /** The 2D stamp's line breaks and border-box size in CSS px (THAPPA measures the DOM). */
  lines?: string[];
  box?: { w: number; h: number };
};

const KIND_TOKEN: Record<StampKindName, string> = { pass: '--h-pass', fail: '--h-fail', wait: '--h-wait', noted: '--h-noted' };

export class StampRig {
  readonly group = new THREE.Group();
  readonly body: RBody;
  readonly width: number; // decal size in world units
  readonly depth: number;
  readonly widthPx: number;
  private readonly stampMesh: THREE.Mesh;
  private readonly decalMesh: THREE.Mesh;
  private readonly decalMat: THREE.MeshBasicMaterial;
  private readonly disposables: { dispose(): void }[] = [];
  private state: 'idle' | 'falling' | 'pressed' | 'lifting' | 'gone' = 'idle';
  private since = 0;
  private wasFast = false;
  private liftFrom = new THREE.Vector3();
  private decalLocal: THREE.Matrix4 | null = null;
  private readonly opts: StampRigOptions;
  private readonly tmp = new THREE.Matrix4();

  constructor(opts: StampRigOptions) {
    this.opts = opts;
    const { world, rapier, tokens } = opts;
    const ink = tokens.raw(KIND_TOKEN[opts.kind]) || 'purple';
    const tex = stampTexture({
      text: opts.text,
      kind: opts.kind,
      color: ink,
      font: tokens.raw('--h-font-display') || 'sans-serif',
      trackEm: parseFloat(tokens.raw('--h-track-stamp')) || 0.08,
      radiusPx: parseFloat(tokens.raw('--h-r-s')) || 8,
      lines: opts.lines,
      box: opts.box,
    });
    this.widthPx = tex.width;
    const perPx = opts.targetWidth ? opts.targetWidth / tex.width : (opts.worldPerPx ?? 0.01);
    this.width = tex.width * perPx;
    this.depth = tex.height * perPx * (opts.depthScale ?? 1);

    // Decal (ink impression): hidden until first contact.
    const decalGeo = new THREE.PlaneGeometry(this.width, this.depth);
    decalGeo.rotateX(-Math.PI / 2);
    this.decalMat = new THREE.MeshBasicMaterial({ map: tex.texture, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.decalMesh = new THREE.Mesh(decalGeo, this.decalMat);
    this.decalMesh.visible = false;
    this.decalMesh.renderOrder = 2;
    this.disposables.push(decalGeo, this.decalMat, tex.texture);

    // The stamp: wooden block + rubber sole in the ink colour + handle + knob (one geometry).
    const bw = this.width + 0.12;
    const bd = this.depth + 0.12;
    const short = Math.min(bw, bd);
    const bh = Math.max(0.18, short * 0.32);
    const hr = Math.max(0.07, short * 0.14);
    const hh = Math.max(0.55, short * 0.9);
    const wood = tokens.color('--h-manila-2');
    const inkC = tokens.color(KIND_TOKEN[opts.kind]);
    const knob = tokens.color('--h-line');
    const parts = [
      place(paint(new THREE.BoxGeometry(bw, 0.05, bd), inkC), [0, 0.025, 0]),
      place(paint(new THREE.BoxGeometry(bw, bh, bd), wood), [0, 0.05 + bh / 2, 0]),
    ];
    if (bw > bd * 1.8) {
      // A long stamp: a T-grip — two posts and a rounded bar along the length.
      const span = bw * 0.5;
      for (const x of [-span / 2, span / 2]) parts.push(place(paint(new THREE.CylinderGeometry(hr * 0.7, hr * 0.8, hh * 0.7, 12), wood), [x, 0.05 + bh + hh * 0.35, 0]));
      parts.push(place(paint(new THREE.CylinderGeometry(hr * 1.1, hr * 1.1, span + hr * 3, 16), knob), [0, 0.05 + bh + hh * 0.7 + hr * 0.6, 0], [0, 0, Math.PI / 2]));
    } else {
      parts.push(place(paint(new THREE.CylinderGeometry(hr * 0.8, hr, hh, 16), wood), [0, 0.05 + bh + hh / 2, 0]));
      parts.push(place(paint(new THREE.SphereGeometry(hr * 1.7, 16, 12), knob), [0, 0.05 + bh + hh + hr * 0.9, 0]));
    }
    const geo = merge(parts);
    const mat = toon({ vertexColors: true });
    this.stampMesh = new THREE.Mesh(geo, mat);
    this.stampMesh.visible = false;
    const hull = hullGeometry(geo);
    const line = outlineMaterial(0.022);
    line.color.copy(tokens.color('--h-line'));
    this.stampMesh.add(new THREE.Mesh(hull, line));
    this.disposables.push(geo, mat, hull, line);
    this.group.add(this.decalMesh, this.stampMesh);

    // Physics: compound (sole+block cuboid, handle cylinder). Origin = the sole's bottom face.
    this.body = world.createRigidBody(
      rapier.RigidBodyDesc.dynamic()
        .setTranslation(opts.at.x, -40, opts.at.z)
        .setCcdEnabled(true)
        .setAngularDamping(2.5),
    );
    world.createCollider(
      rapier.ColliderDesc.cuboid(bw / 2, (bh + 0.05) / 2, bd / 2)
        .setTranslation(0, (bh + 0.05) / 2, 0)
        .setDensity(3)
        .setRestitution(0.3)
        .setFriction(0.8),
      this.body,
    );
    world.createCollider(rapier.ColliderDesc.cylinder(hh / 2, hr).setTranslation(0, 0.05 + bh + hh / 2, 0).setDensity(0.6).setRestitution(0.3), this.body);
    this.body.setEnabled(false);
  }

  /** Redraw the impression in the current theme's ink (a theme flip after the stamp has landed). */
  retint(tokens: Tokens) {
    const tex = stampTexture({
      text: this.opts.text,
      kind: this.opts.kind,
      color: tokens.raw(KIND_TOKEN[this.opts.kind]) || 'purple',
      font: tokens.raw('--h-font-display') || 'sans-serif',
      trackEm: parseFloat(tokens.raw('--h-track-stamp')) || 0.08,
      radiusPx: parseFloat(tokens.raw('--h-r-s')) || 8,
      lines: this.opts.lines,
      box: this.opts.box,
    });
    const old = this.decalMat.map;
    this.decalMat.map = tex.texture;
    this.decalMat.needsUpdate = true;
    this.disposables.push(tex.texture);
    old?.dispose();
  }

  /** Begin the fall. */
  drop() {
    const { at, floor, dropHeight, yaw } = this.opts;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, yaw, -0.04));
    this.body.setEnabled(true);
    this.body.setTranslation({ x: at.x, y: floor + dropHeight, z: at.z }, true);
    this.body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    this.body.setLinvel({ x: 0, y: -1, z: 0 }, true);
    this.stampMesh.visible = true;
    this.state = 'falling';
    this.since = 0;
  }

  /** Reduced motion / settled: the impression is already there; no stamp in sight. */
  settle() {
    this.placeDecal(this.opts.at.x, this.opts.floor, this.opts.at.z);
    this.decalMat.opacity = 0.94;
    this.stampMesh.visible = false;
    this.body.setEnabled(false);
    this.state = 'gone';
  }

  get busy() {
    return this.state === 'falling' || this.state === 'pressed' || this.state === 'lifting';
  }

  private placeDecal(x: number, y: number, z: number) {
    const world = new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.004, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.opts.yaw, 0)), new THREE.Vector3(1, 1, 1));
    const f = this.opts.follow;
    if (f) {
      const t = f.translation();
      const r = f.rotation();
      const fm = new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y, t.z), new THREE.Quaternion(r.x, r.y, r.z, r.w), new THREE.Vector3(1, 1, 1));
      this.decalLocal = fm.invert().multiply(world);
    } else {
      this.decalMesh.matrix.copy(world);
    }
    this.decalMesh.matrixAutoUpdate = false;
    this.decalMesh.matrixWorldNeedsUpdate = true;
    this.decalMesh.visible = true;
    this.syncDecal();
  }

  private syncDecal() {
    const f = this.opts.follow;
    if (!f || !this.decalLocal) return;
    const t = f.translation();
    const r = f.rotation();
    this.tmp.compose(new THREE.Vector3(t.x, t.y, t.z), new THREE.Quaternion(r.x, r.y, r.z, r.w), new THREE.Vector3(1, 1, 1));
    this.decalMesh.matrix.multiplyMatrices(this.tmp, this.decalLocal);
    this.decalMesh.matrixWorldNeedsUpdate = true;
  }

  /** One fixed step. Returns 'contact' on the first touch, 'gone' when it has lifted out of view. */
  update(dt: number): RigEvent {
    let event: RigEvent = null;
    this.since += dt;
    if (this.state === 'falling') {
      const vy = this.body.linvel().y;
      if (vy < -1.2) this.wasFast = true;
      if (this.wasFast && vy > -0.3) {
        const p = this.body.translation();
        this.placeDecal(p.x, this.opts.floor, p.z);
        this.state = 'pressed';
        this.since = 0;
        event = 'contact';
      }
    } else if (this.state === 'pressed') {
      this.decalMat.opacity = Math.min(0.94, this.decalMat.opacity + dt / 0.06);
      if (this.since > (this.opts.hold ?? 0.3)) {
        const p = this.body.translation();
        this.liftFrom.set(p.x, p.y, p.z);
        this.body.setBodyType(this.opts.rapier.RigidBodyType.KinematicPositionBased, true);
        this.state = 'lifting';
        this.since = 0;
      }
    } else if (this.state === 'lifting') {
      this.decalMat.opacity = Math.min(0.94, this.decalMat.opacity + dt / 0.06);
      const len = this.opts.lift ?? 0.36;
      const k = easeInCubic(this.since / (len - 0.02));
      this.body.setNextKinematicTranslation({ x: this.liftFrom.x + k * 0.6, y: this.liftFrom.y + k * 4, z: this.liftFrom.z - k * 0.4 });
      if (this.since >= len) {
        this.state = 'gone';
        this.stampMesh.visible = false;
        this.body.setEnabled(false);
        event = 'gone';
      }
    }
    return event;
  }

  /** Copy physics into the meshes (after the world stepped). */
  sync() {
    if (this.stampMesh.visible) {
      const t = this.body.translation();
      const r = this.body.rotation();
      this.stampMesh.position.set(t.x, t.y, t.z);
      this.stampMesh.quaternion.set(r.x, r.y, r.z, r.w);
    }
    if (this.decalMesh.visible) this.syncDecal();
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}
