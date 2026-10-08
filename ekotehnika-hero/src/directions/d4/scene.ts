// The Anatomija stage. A round turntable plinth, a fine technical grid on the floor, a pose
// table that pulls the truck apart one system at a time, and a camera rig that orbits it.
// The engine runs the truck timetable and a placeholder shot list. This file takes over the part
// positions and the camera inside its update, which runs after the engine and before the render.

import * as THREE from 'three';
import { type BuildCtx, type StoryDef, clamp01, lerp, smooth, v } from '../../three/engine';
import { addEdges } from '../../three/edges';
import { mesh, type Tone } from '../../three/tone';
import { C } from '../../tokens';

export const LAST = 7;
// Story time changes pose and camera between i + MOVE_FROM and i + 1. Scroll rests at i + REST.
export const MOVE_FROM = 0.4;
export const REST = 0.3;

type V3 = [number, number, number];
export type PoseKey =
  | 'mast' | 'inner' | 'carriage' | 'guard' | 'seat' | 'counterweight' | 'body' | 'chassis'
  | 'w0' | 'w1' | 'w2' | 'w3';
type Pose = Partial<Record<PoseKey, V3>> & { spotX?: number };

const SPOT_X = 4.2;
const KEYS_POSE: PoseKey[] = [
  'mast', 'inner', 'carriage', 'guard', 'seat', 'counterweight', 'body', 'chassis', 'w0', 'w1', 'w2', 'w3',
];

// One pose per chapter. Offsets are metres in the truck's own frame, x forward, y up, z to the side.
// The wheels order follows the truck, front near, front far, rear near, rear far.
const POSES: Pose[] = [
  {},
  { mast: [0.7, 0, 0], inner: [1.3, 0.5, 0], carriage: [1.9, 1.1, 0] },
  { guard: [0, 1.9, 0], seat: [0, 0.9, 0] },
  { counterweight: [-2, 0, 0] },
  { w0: [0, 0, 1.5], w1: [0, 0, -1.5], w2: [0, 0, 1.5], w3: [0, 0, -1.5] },
  {
    mast: [0.8, 0, 0], inner: [1.5, 0.5, 0], carriage: [2.2, 1, 0],
    guard: [0, 2.8, 0], seat: [0, 1.5, 0], counterweight: [-2.2, 0, 0], body: [0, 0.7, 0],
    w0: [0, 0, 1.9], w1: [0, 0, -1.9], w2: [0, 0, 1.9], w3: [0, 0, -1.9], spotX: 6.2,
  },
  {},
  {},
];

// The camera. az is the angle around the truck in degrees, 0 in front of the forks and 90 on the
// near side, el is the height angle, r the distance. off slides the truck in frame, positive right,
// to leave room for the copy on the left.
export type CamKey = { az: number; el: number; r: number; t: V3; fov: number; off: number; offY: number };
const CAMS: CamKey[] = [
  { az: 36, el: 15, r: 11.2, t: [0.45, 1.0, 0], fov: 30, off: 0.21, offY: 0.03 },
  { az: 64, el: 12, r: 13, t: [1.3, 1.3, 0], fov: 30, off: 0.15, offY: 0.02 },
  { az: 150, el: 36, r: 14.5, t: [-0.1, 1.7, 0], fov: 30, off: 0.15, offY: 0.02 },
  { az: 196, el: 6, r: 11, t: [-0.9, 0.95, 0], fov: 30, off: 0.15, offY: 0.02 },
  { az: 290, el: 9, r: 12, t: [0.4, 0.9, 0], fov: 30, off: 0.15, offY: 0.02 },
  { az: 300, el: 20, r: 20, t: [1.2, 2.0, 0], fov: 30, off: 0.13, offY: 0.0 },
  { az: 372, el: 9, r: 11.8, t: [0.5, 1.1, 0], fov: 30, off: 0.2, offY: 0.03 },
  { az: 405, el: 14, r: 11.2, t: [0.45, 1.0, 0], fov: 30, off: 0.21, offY: 0.03 },
];

// Progress of the move that leaves chapter i for chapter i + 1.
const seg = (b: number, i: number) => smooth(clamp01((b - i - MOVE_FROM) / (1 - MOVE_FROM)));

export function camAt(b: number): CamKey {
  const i = Math.min(CAMS.length - 2, Math.floor(b));
  const A = CAMS[i];
  const B = CAMS[i + 1];
  const u = seg(b, i);
  return {
    az: lerp(A.az, B.az, u),
    el: lerp(A.el, B.el, u),
    r: lerp(A.r, B.r, u),
    t: [lerp(A.t[0], B.t[0], u), lerp(A.t[1], B.t[1], u), lerp(A.t[2], B.t[2], u)],
    fov: lerp(A.fov, B.fov, u),
    off: lerp(A.off, B.off, u),
    offY: lerp(A.offY, B.offY, u),
  };
}

export function poseAt(b: number) {
  const i = Math.min(POSES.length - 2, Math.floor(b));
  const u = seg(b, i);
  const A = POSES[i];
  const B = POSES[i + 1];
  const out = {} as Record<PoseKey, V3>;
  for (const k of KEYS_POSE) {
    const a = A[k] ?? [0, 0, 0];
    const c = B[k] ?? [0, 0, 0];
    out[k] = [lerp(a[0], c[0], u), lerp(a[1], c[1], u), lerp(a[2], c[2], u)];
  }
  return { parts: out, spotX: lerp(A.spotX ?? SPOT_X, B.spotX ?? SPOT_X, u) };
}

const PLINTH: Tone = { top: C.white, front: C.lightGrey, side: C.shadeGrey, back: C.shadeGrey };

function line(points: number[], colour: string, opacity = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: colour, transparent: opacity < 1, opacity }));
}

function floorGrid(radius: number, y: number) {
  const group = new THREE.Group();
  const fine: number[] = [];
  const bold: number[] = [];
  for (let k = -radius; k <= radius; k++) {
    const half = Math.sqrt(Math.max(0, radius * radius - k * k));
    const out = k % 5 === 0 ? bold : fine;
    out.push(k, y, -half, k, y, half, -half, y, k, half, y, k);
  }
  group.add(line(fine, C.shadeGrey));
  group.add(line(bold, C.tonedTextGrey, 0.35));
  const rings: number[] = [];
  for (const rr of [radius, radius * 0.5]) {
    for (let a = 0; a < 96; a++) {
      const a0 = (a / 96) * Math.PI * 2;
      const a1 = ((a + 1) / 96) * Math.PI * 2;
      rings.push(Math.cos(a0) * rr, y, Math.sin(a0) * rr, Math.cos(a1) * rr, y, Math.sin(a1) * rr);
    }
  }
  group.add(line(rings, C.tonedTextGrey, 0.35));
  return group;
}

function plinth() {
  const group = new THREE.Group();
  group.position.x = 0.45;
  const R = 2.95;
  const H = 0.42;
  const disc = mesh(new THREE.CylinderGeometry(R, R, H, 64), PLINTH, 0, -H / 2, 0);
  group.add(disc);
  group.add(addEdgesTo(disc));
  // a red ring and degree ticks on the turntable top
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(R - 0.34, R - 0.28, 96),
    new THREE.MeshBasicMaterial({ color: C.lindeRed, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  group.add(ring);
  const ticks: number[] = [];
  for (let d = 0; d < 360; d += 5) {
    const a = (d * Math.PI) / 180;
    const long = d % 30 === 0;
    const r0 = R - 0.26;
    const r1 = R - (long ? 0.08 : 0.15);
    ticks.push(Math.cos(a) * r0, 0.006, Math.sin(a) * r0, Math.cos(a) * r1, 0.006, Math.sin(a) * r1);
  }
  group.add(line(ticks, C.textGrey));
  return group;
}

function addEdgesTo(m: THREE.Mesh) {
  const holder = new THREE.Group();
  holder.position.copy(m.position);
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(m.geometry, 20),
    new THREE.LineBasicMaterial({ color: C.tonedTextGrey }),
  );
  holder.add(lines);
  return holder;
}

function build({ camera, truck }: BuildCtx) {
  const scene = truck.group.parent!;
  scene.add(floorGrid(17, -0.42));
  scene.add(plinth());
  // hairline edges on every solid, so the truck reads as a technical drawing
  addEdges(truck.group, C.ink, 25).opacity = 0.5;

  const base = new Map<THREE.Object3D, THREE.Vector3>();
  truck.wheels.forEach((w) => base.set(w.g, w.g.position.clone()));
  const spotMats = truck.spot.children.map((c) => (c as THREE.Mesh).material as THREE.MeshBasicMaterial);
  const parts = truck.parts;
  const wheelParts = truck.wheels.map((w) => w.g);
  const target = new THREE.Vector3();

  // dashed guides from each part's home to where it floats
  truck.group.updateMatrixWorld(true);
  const groups: [THREE.Object3D, PoseKey][] = [
    [parts.mast, 'mast'], [parts.inner, 'inner'], [parts.carriage, 'carriage'], [parts.guard, 'guard'],
    [parts.seat, 'seat'], [parts.counterweight, 'counterweight'], [parts.body, 'body'],
    [wheelParts[0], 'w0'], [wheelParts[1], 'w1'], [wheelParts[2], 'w2'], [wheelParts[3], 'w3'],
  ];
  const guides = groups.map(([o, k]) => {
    const box = new THREE.Box3().setFromObject(o);
    const home = box.getCenter(new THREE.Vector3());
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(6).fill(0), 3));
    const l = new THREE.Line(
      geo,
      new THREE.LineDashedMaterial({ color: C.ink, dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0.55 }),
    );
    l.frustumCulled = false;
    scene.add(l);
    return { k, home, l };
  });

  return (b: number) => {
    const p = poseAt(b);
    const set = (o: THREE.Object3D, k: PoseKey) => o.position.set(...p.parts[k]);
    set(parts.mast, 'mast');
    set(parts.inner, 'inner');
    set(parts.carriage, 'carriage');
    set(parts.guard, 'guard');
    set(parts.seat, 'seat');
    set(parts.counterweight, 'counterweight');
    set(parts.body, 'body');
    set(parts.chassis, 'chassis');
    (['w0', 'w1', 'w2', 'w3'] as const).forEach((k, n) => {
      const o = wheelParts[n];
      o.position.copy(base.get(o)!).add(new THREE.Vector3(...p.parts[k]));
    });
    for (const g of guides) {
      const d = new THREE.Vector3(...p.parts[g.k]);
      g.l.visible = d.length() > 0.12;
      if (!g.l.visible) continue;
      const pos = g.l.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, g.home.x, g.home.y, g.home.z);
      pos.setXYZ(1, g.home.x + d.x, g.home.y + d.y, g.home.z + d.z);
      pos.needsUpdate = true;
      g.l.computeLineDistances();
    }
    truck.spot.position.x = p.spotX;
    // the floor spot fades in for the safety chapter and pulses a little
    const glow = smooth(clamp01((b - 4.5) / 0.4)) * (1 - smooth(clamp01((b - 5.55) / 0.35)));
    const pulse = 0.78 + 0.22 * Math.sin(performance.now() / 380);
    for (const m of spotMats) m.opacity = 0.9 * glow * pulse;
    truck.spot.scale.setScalar(1 + 0.04 * Math.sin(performance.now() / 380));

    // camera
    const c = camAt(b);
    const az = (c.az * Math.PI) / 180;
    const el = (c.el * Math.PI) / 180;
    target.set(...c.t);
    camera.position.set(
      target.x + Math.cos(az) * Math.cos(el) * c.r,
      target.y + Math.sin(el) * c.r,
      target.z + Math.sin(az) * Math.cos(el) * c.r,
    );
    const W = camera.view?.fullWidth ?? 1440;
    const H = camera.view?.fullHeight ?? 900;
    camera.setViewOffset(W, H, -c.off * W, c.offY * H, W, H);
    camera.fov = c.fov;
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  };
}

// The engine needs a shot list of at least two. The rig above overrides them every frame.
const still = { cam: () => v(10, 4, 10), look: () => v(0, 1, 0), fov: 30 };

export const story: StoryDef = {
  lastBeat: LAST,
  keys: [
    { b: 0, x: 0, z: 0, h: 0, y: 0, lift: 0 },
    { b: LAST, x: 0, z: 0, h: 0, y: 0, lift: 0 },
  ],
  shots: [still, still],
  background: C.white,
  world: 'none',
  spot: [4.5, 5.95],
  spotColour: C.lindeRed,
  build,
};
