import * as THREE from 'three';
import { watchQuality } from './quality.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import * as build from './furniture.js';
import { buildSheetModel } from './sheet3d.js';

const PLINTH_TOP = 0.7;
const SPOTS = {
  sofa: { x: -0.25, z: -1.35, rot: 0 },
  table: { x: -0.35, z: 0.35, rot: 0 },
  lamp: { x: 2.35, z: -1.5, rot: 0 },
  side: { x: -2.7, z: -0.1, rot: Math.PI / 2 },
  stool: { x: -1.75, z: 1.3, rot: 0.9 },
};
const CHAIR_SPOT = { x: 1.55, z: 0.45, rot: -0.75 };

export function createRoom(canvas, { isSmall, sources }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;

  const m = build.createMaterials(sources);

  const sun = new THREE.DirectionalLight(0xfff0d8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const lampLight = new THREE.PointLight(0xffb368, 0, 9, 1.6);
  lampLight.castShadow = !isSmall;
  lampLight.shadow.mapSize.set(1024, 1024);
  scene.add(lampLight);

  // Room shell
  const room = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.24, 4), [
    m.frame, m.frame, m.floor, m.frame, m.frame, m.frame,
  ]);
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.015, 72), m.rug);
  rug.position.set(-0.35, 0.008, 0.35);
  rug.receiveShadow = true;
  const ground = new THREE.Group();
  ground.add(floor, rug);
  room.add(ground);

  const walls = new THREE.Group();
  const wallPart = (w, h, d, x, y, z) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m.wall);
    box.position.set(x, y, z);
    box.castShadow = true;
    box.receiveShadow = true;
    walls.add(box);
    return box;
  };
  wallPart(6.2, 2.9, 0.2, 0, 1.45, -2.1);
  // Left wall with a window hole, built around the opening
  wallPart(0.2, 2.9, 0.9, -3.1, 1.45, -1.55);
  wallPart(0.2, 2.9, 1.4, -3.1, 1.45, 1.3);
  wallPart(0.2, 0.75, 1.9, -3.1, 0.375, -0.15);
  wallPart(0.2, 0.35, 1.9, -3.1, 2.725, -0.15);
  room.add(walls);
  scene.add(room);

  // Hero plinth and chair
  const plinth = build.plinth(m);
  const armchair = new THREE.Group();
  scene.add(plinth, armchair);

  // The armchair is shaped from the turnaround sheet, and only its fabric colour changes
  const fabric = new THREE.Color(0xa4ae66);
  buildSheetModel({
    src: 'assets/img/F-02.webp', sideFacesRight: false, power: 2.6, limbDepth: 1.2, step: isSmall ? 0.03 : 0.022,
  }).then((model) => {
    model.material.uniforms.uRecolor.value = 1;
    model.material.uniforms.uTint.value = fabric;
    model.mesh.scale.setScalar(0.49);
    model.mesh.position.y = 0.49;
    armchair.add(model.mesh);
  });

  const builders = { sofa: build.sofa, table: build.table, lamp: build.lamp, side: build.sideboard, stool: build.chair };
  const pieces = {};
  for (const name in builders) {
    const group = builders[name](m);
    group.visible = false;
    group.position.set(SPOTS[name].x, 0, SPOTS[name].z);
    group.rotation.y = SPOTS[name].rot;
    scene.add(group);
    pieces[name] = group;
  }

  const state = {
    camX: 0, camY: 1.2, camZ: 5, lookX: 0, lookY: 1, spinChair: 0.5,
    move: 0, ground: 0, walls: 0, sun: 0, dusk: 0,
    sofa: 0, table: 0, lamp: 0, side: 0, stool: 0,
  };

  const pointer = { x: 0, y: 0, sx: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth - 0.5;
  }, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();
  watchQuality(renderer, resize);

  const lerp = (a, b, t) => a + (b - a) * t;
  const sunDay = new THREE.Color(0xfff2dc);
  const sunEve = new THREE.Color(0xff8a3c);
  const v = new THREE.Vector3();
  let labels = [];

  function place() {
    const t = state.move;
    armchair.position.set(
      lerp(0, CHAIR_SPOT.x, t),
      lerp(PLINTH_TOP, 0, t),
      lerp(0, CHAIR_SPOT.z, t),
    );
    armchair.rotation.y = lerp(state.spinChair + pointer.sx * 0.6, CHAIR_SPOT.rot, t);
    plinth.position.y = PLINTH_TOP - t * 5.5;
    plinth.visible = t < 0.98;

    ground.visible = state.ground > 0.001;
    ground.scale.set(state.ground, 1, state.ground);
    walls.visible = state.walls > 0.001;
    walls.scale.y = Math.max(state.walls, 0.001);

    for (const name in pieces) {
      const p = state[name];
      pieces[name].visible = p > 0.001;
      pieces[name].position.y = (1 - p) * 3.4;
    }
  }

  function light() {
    const s = state.sun;
    const d = state.dusk;
    // The sun travels past the window from morning to evening
    sun.position.set(-11, lerp(6.5, 2.6, s), lerp(-5.5, 7, s));
    sun.target.position.set(0, 0.3, 0);
    sun.color.copy(sunDay).lerp(sunEve, Math.min(1, s * 1.1));
    sun.intensity = lerp(5.2, 3.4, s) * (1 - d);
    scene.environmentIntensity = lerp(0.62, 0.1, d);

    const g = pieces.lamp.position;
    lampLight.position.set(g.x, g.y + 1.56, g.z);
    lampLight.intensity = d * 7;
    m.paper.emissiveIntensity = 0.05 + d * 2.6;
  }

  function frame() {
    pointer.sx += (pointer.x - pointer.sx) * 0.06;
    place();
    light();
    camera.position.set(state.camX, state.camY, state.camZ);
    camera.lookAt(state.lookX, state.lookY, 0);
    renderer.render(scene, camera);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (const { el, group, y, z, fade } of labels) {
      v.set(group.position.x, group.position.y + y, group.position.z + z);
      v.project(camera);
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
      el.style.opacity = fade();
    }
  }

  return {
    state,
    frame,
    setFabric(hex) {
      const { r, g, b } = new THREE.Color(hex);
      window.gsap.to(fabric, { r, g, b, duration: 0.6, ease: 'power2.out' });
    },
    setLabels(items) {
      labels = items.map(({ el, name, y, z = 0, fade }) => ({ el, group: name === 'chair' ? armchair : pieces[name], y, z, fade }));
    },
  };
}
