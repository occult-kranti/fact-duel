// Loaded only after an explicit 3D request. No renderer is mounted in a room.
/** @param {HTMLCanvasElement} canvas @param {{onLost?:()=>void,reduced?:boolean,signal?:AbortSignal}} options */
export async function createArcadeScene(canvas, { onLost = () => {}, reduced = false, signal } = {}) {
  const THREE = await import('three');
  if (signal?.aborted) return null;
  if (typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined')
    throw new Error('Static artwork required');
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  camera.position.set(4, 3.4, 8.3);
  camera.lookAt(0, 0.1, 0);
  const group = new THREE.Group();
  scene.add(group);
  const materials = new Set(),
    geometries = new Set();
  let cleanup = () => {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
  try {
    function mesh(geometry, color, position, scale = 1) {
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.26, metalness: 0.68 });
      materials.add(material);
      geometries.add(geometry);
      const item = new THREE.Mesh(geometry, material);
      item.position.set(...position);
      item.scale.setScalar(scale);
      item.castShadow = true;
      item.receiveShadow = true;
      group.add(item);
      return item;
    }
    const pedestal = mesh(new THREE.CylinderGeometry(2.7, 2.8, 0.23, 64), 0x10211c, [0, -0.84, 0]);
    const token = mesh(new THREE.CylinderGeometry(1.04, 1.04, 0.15, 64), 0x455952, [-0.82, 0.33, 0.18]);
    token.rotation.set(Math.PI / 2, 0, 0.18);
    const rim = mesh(new THREE.TorusGeometry(1.04, 0.035, 10, 80), 0xdcfc67, [-0.82, 0.33, 0.28]);
    rim.rotation.set(0, 0, 0.18);
    const bolt = new THREE.Shape();
    bolt.moveTo(0.08, 0.67);
    bolt.lineTo(-0.38, -0.04);
    bolt.lineTo(-0.02, -0.04);
    bolt.lineTo(-0.15, -0.68);
    bolt.lineTo(0.43, 0.16);
    bolt.lineTo(0.05, 0.16);
    bolt.closePath();
    const mark = mesh(
      new THREE.ExtrudeGeometry(bolt, {
        depth: 0.05,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.015,
      }),
      0xdcfc67,
      [-0.82, 0.33, 0.29],
    );
    mark.rotation.z = 0.18;
    const orb = mesh(new THREE.IcosahedronGeometry(0.61, 2), 0x52362b, [1.05, 0.17, 0.14]);
    const seamSource = new THREE.IcosahedronGeometry(0.617, 1),
      wireGeo = new THREE.EdgesGeometry(seamSource);
    seamSource.dispose();
    geometries.add(wireGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xd3b79a });
    materials.add(wireMat);
    orb.add(new THREE.LineSegments(wireGeo, wireMat));
    const ring = mesh(new THREE.TorusGeometry(0.99, 0.025, 10, 80), 0xdcfc67, [1.05, 0.17, 0.14]);
    ring.rotation.set(1.05, 0.4, 0.4);
    const ring2 = mesh(new THREE.TorusGeometry(0.84, 0.018, 10, 80), 0xffa285, [1.05, 0.17, 0.14]);
    ring2.rotation.set(0.4, -0.3, -0.6);
    mesh(new THREE.SphereGeometry(0.1, 14, 12), 0xdcfc67, [1.92, 0.55, 0.12]);
    scene.add(new THREE.HemisphereLight(0xd7f8de, 0x071712, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(-3, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.normalBias = 0.04;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xff8866, 3.2);
    fill.position.set(4, 3, -3);
    scene.add(fill);
    let frame = 0,
      dead = false,
      spin = false,
      visible = true,
      last = 0,
      drag = null;
    const render = () => {
      if (dead || document.hidden || !visible) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const w = Math.min(900, Math.round(rect.width)),
        h = Math.min(600, Math.round(rect.height));
      if (
        canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
        canvas.height !== Math.floor(h * renderer.getPixelRatio())
      ) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
    };
    const animate = (time) => {
      frame = 0;
      if (dead || !spin || document.hidden || !visible || reduced) return;
      if (time - last >= 1000 / 30) {
        group.rotation.y += 0.004;
        render();
        last = time;
      }
      frame = requestAnimationFrame(animate);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      render();
      if (spin && !reduced && !document.hidden && visible) frame = requestAnimationFrame(animate);
    };
    const resize = new ResizeObserver(restart);
    resize.observe(canvas);
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        restart();
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);
    const lost = (e) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      onLost();
    };
    const down = (e) => {
      if (e.button === 0) drag = { x: e.clientX, y: e.clientY, rotation: group.rotation.y };
    };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (Math.abs(dy) > Math.abs(dx) + 12) {
        drag = null;
        return;
      }
      group.rotation.y = drag.rotation + dx * 0.008;
      render();
    };
    const up = () => {
      drag = null;
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    document.addEventListener('visibilitychange', restart);
    cleanup = () => {
      dead = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.removeEventListener('visibilitychange', restart);
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
    render();
    return {
      rotate(direction) {
        group.rotation.y += direction * 0.35;
        render();
      },
      spin(value) {
        spin = value;
        restart();
      },
      dispose() {
        cleanup();
      },
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
