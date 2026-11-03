import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';
import { toCreasedNormals } from '../vendor/three/BufferGeometryUtils.js';
import * as paint from './textures.js';

function tex(canvas, repeat, isColor = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (isColor) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createMaterials(sources) {
  return {
    linen: new THREE.MeshStandardMaterial({
      color: 0xc9bca4,
      map: tex(sources.linen, 2),
      bumpMap: tex(sources.linen, 2, false),
      bumpScale: 1,
      roughness: 0.95,
    }),
    oak: new THREE.MeshStandardMaterial({ map: tex(sources.oak, 1), roughness: 0.55 }),
    stone: new THREE.MeshStandardMaterial({
      map: tex(sources.travertine, 1),
      bumpMap: tex(sources.travertine, 1, false),
      bumpScale: 2,
      roughness: 0.85,
    }),
    steel: new THREE.MeshStandardMaterial({ color: 0x16130f, metalness: 0.7, roughness: 0.45 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xf1e7d3, emissive: 0xffc27a, emissiveIntensity: 0.05, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xb08a70, map: tex(sources.limewash, 1), roughness: 1 }),
    block: new THREE.MeshStandardMaterial({
      map: tex(sources.travertine, 1),
      bumpMap: tex(sources.travertine, 1, false),
      bumpScale: 2,
      roughness: 0.85,
    }),
    floor: new THREE.MeshStandardMaterial({ map: tex(sources.planks, 2.5), roughness: 0.5 }),
    rug: new THREE.MeshStandardMaterial({
      color: 0xd4c9b5,
      map: tex(sources.boucle, 5),
      bumpMap: tex(sources.boucle, 5, false),
      bumpScale: 2,
      roughness: 1,
    }),
    frame: new THREE.MeshStandardMaterial({ color: 0x1c1712, roughness: 0.6 }),
  };
}

function solid(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const soft = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 6, r);

// Plan-view shape pushed up into a soft-edged volume
function extruded(shape, height, bevel) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: height - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 10,
    curveSegments: 48,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return toCreasedNormals(g, Math.PI / 2.5);
}

function leg(material, x, z, h, top, bottom, splay = 0.1) {
  const m = solid(new THREE.CylinderGeometry(top, bottom, h, 24), material, x, h / 2, z);
  m.rotation.x = z > 0 ? splay : -splay;
  m.rotation.z = x > 0 ? -splay : splay;
  return m;
}

export function sofa(m) {
  const g = new THREE.Group();
  g.add(solid(soft(2.1, 0.12, 0.84, 0.03), m.oak, 0, 0.17, 0));
  for (const [x, z] of [[-0.96, 0.34], [0.96, 0.34], [-0.96, -0.34], [0.96, -0.34]]) {
    g.add(leg(m.oak, x, z, 0.12, 0.03, 0.022, 0));
  }
  for (const x of [-0.52, 0.52]) {
    g.add(solid(soft(1.0, 0.2, 0.74, 0.08), m.linen, x, 0.33, 0.04));
    g.add(solid(soft(1.0, 0.44, 0.22, 0.1), m.linen, x, 0.6, -0.27));
  }
  for (const x of [-1.04, 1.04]) g.add(solid(soft(0.16, 0.42, 0.84, 0.075), m.linen, x, 0.42, 0));
  return g;
}

export function table(m) {
  const g = new THREE.Group();
  g.add(solid(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 72), m.oak, 0, 0.46, 0));

  // Fluted stone drum
  const drum = new THREE.CylinderGeometry(0.24, 0.3, 0.44, 144, 1);
  const p = drum.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const k = 1 + Math.abs(Math.sin(a * 11)) * 0.06;
    p.setX(i, p.getX(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  drum.computeVertexNormals();
  g.add(solid(drum, m.stone, 0, 0.22, 0));
  return g;
}

export function lamp(m) {
  const g = new THREE.Group();
  g.add(solid(new THREE.CylinderGeometry(0.17, 0.19, 0.06, 40), m.stone, 0, 0.03, 0));
  g.add(solid(new THREE.CylinderGeometry(0.012, 0.012, 1.38, 12), m.steel, 0, 0.72, 0));
  const shade = solid(new THREE.SphereGeometry(0.26, 48, 32), m.paper, 0, 1.56, 0);
  shade.castShadow = false;
  g.add(shade);
  return g;
}

export function sideboard(m) {
  const g = new THREE.Group();
  g.add(solid(soft(1.5, 0.56, 0.44, 0.015), m.oak, 0, 0.46, 0));
  for (let i = 0; i < 37; i++) {
    const r = solid(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 10), m.oak, -0.72 + i * 0.04, 0.46, 0.222);
    g.add(r);
  }
  for (const [x, z] of [[-0.68, 0.16], [0.68, 0.16], [-0.68, -0.16], [0.68, -0.16]]) {
    g.add(leg(m.steel, x, z, 0.18, 0.012, 0.012, 0));
  }
  return g;
}

export function chair(m) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.19, 0.19], [0.19, 0.19], [-0.19, -0.19], [0.19, -0.19]]) {
    g.add(leg(m.oak, x, z, 0.44, 0.02, 0.013, 0.05));
  }
  const seat = new THREE.Shape();
  seat.absarc(0, 0, 0.235, 0, Math.PI * 2);
  g.add(solid(extruded(seat, 0.035, 0.012), m.linen, 0, 0.43, 0));

  const back = new THREE.Shape();
  back.absarc(0, 0, 0.24, Math.PI * 0.12, Math.PI * 0.88, false);
  back.absarc(0, 0, 0.21, Math.PI * 0.88, Math.PI * 0.12, true);
  back.closePath();
  g.add(solid(extruded(back, 0.13, 0.01), m.oak, 0, 0.72, 0));
  for (const x of [-0.17, 0.17]) g.add(solid(new THREE.CylinderGeometry(0.012, 0.014, 0.32, 10), m.oak, x, 0.6, -0.145));
  return g;
}

export function plinth(m) {
  const g = new THREE.Group();
  // Top sits at y = 0
  m.block.map.repeat.set(1.6, 5);
  m.block.bumpMap.repeat.set(1.6, 5);
  g.add(solid(new THREE.BoxGeometry(1.5, 5, 1.5), m.block, 0, -2.5, 0));
  return g;
}

export function paintSources() {
  return {
    boucle: paint.boucle(),
    linen: paint.linen(),
    oak: paint.oak(),
    travertine: paint.travertine(),
    limewash: paint.limewash(),
    planks: paint.planks(),
  };
}
