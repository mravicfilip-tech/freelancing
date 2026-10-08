// A counterbalance forklift built from plain shapes, sized in metres like a 2.5 t truck.
// Forks point along +x, width runs along z, the ground is y = 0.
//
// Every part sits in its own group under group, at the origin, so a direction can move parts
// apart for an exploded view by setting parts.<name>.position. The carriage and inner mast also
// carry the lift, which the story engine sets each frame.

import * as THREE from 'three';
import { block, INK, mesh, PALE, GREY, RED, STEEL, type Tone } from './tone';
import { C } from '../tokens';

export type ForkliftParts = {
  chassis: THREE.Group;
  body: THREE.Group;
  counterweight: THREE.Group;
  seat: THREE.Group;
  guard: THREE.Group;
  mast: THREE.Group;
  inner: THREE.Group;
  carriage: THREE.Group;
  wheels: THREE.Group;
};

export type Forklift = {
  group: THREE.Group;
  parts: ForkliftParts;
  wheels: { g: THREE.Group; r: number }[];
  inner: THREE.Group;
  carriage: THREE.Group;
  // where a carried pallet's bottom centre sits, inside the carriage
  anchor: THREE.Object3D;
  // the warning spot projected on the floor ahead of the forks, hidden by default
  spot: THREE.Group;
};

const WHITE: Tone = { top: C.white, front: C.white, side: C.white, back: C.white };

function wheel(r: number, w: number, x: number, z: number) {
  const g = new THREE.Group();
  const tyre = mesh(new THREE.CylinderGeometry(r, r, w, 20), INK);
  tyre.rotation.x = Math.PI / 2;
  const hub = mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 14), STEEL);
  hub.rotation.x = Math.PI / 2;
  const mark = mesh(new THREE.BoxGeometry(r * 0.5, r * 0.14, w + 0.04), WHITE, 0, r * 0.3, 0);
  g.add(tyre, hub, mark);
  g.position.set(x, r, z);
  return g;
}

export function buildForklift({
  load = false,
  tone = RED,
  spotColour = C.lindeRed,
}: { load?: boolean; tone?: Tone; spotColour?: string } = {}): Forklift {
  const group = new THREE.Group();
  const part = () => {
    const g = new THREE.Group();
    group.add(g);
    return g;
  };
  const parts: ForkliftParts = {
    chassis: part(),
    body: part(),
    counterweight: part(),
    seat: part(),
    guard: part(),
    mast: part(),
    inner: part(),
    carriage: part(),
    wheels: part(),
  };

  parts.chassis.add(block(2.3, 0.32, 1.1, INK, -0.15, 0.12, 0));
  parts.body.add(block(1.6, 0.62, 1.1, tone, -0.05, 0.44, 0));
  parts.body.add(block(0.9, 0.08, 1.0, tone, -0.3, 1.06, 0));
  parts.body.add(block(0.34, 0.12, 0.01, WHITE, 0.1, 0.72, 0.555));
  parts.body.add(block(0.34, 0.12, 0.01, WHITE, 0.1, 0.72, -0.555));
  parts.counterweight.add(block(0.62, 0.9, 1.14, tone, -1.05, 0.22, 0));
  parts.counterweight.add(block(0.16, 0.2, 1.0, INK, -1.38, 0.18, 0));

  parts.seat.add(block(0.44, 0.12, 0.5, INK, -0.38, 1.14, 0));
  parts.seat.add(block(0.1, 0.52, 0.5, INK, -0.62, 1.14, 0));
  const column = block(0.08, 0.44, 0.08, INK, 0.36, 1.06, 0);
  column.rotation.z = 0.35;
  parts.seat.add(column);
  const steer = mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 18), INK, 0.28, 1.52, 0);
  steer.rotation.y = Math.PI / 2;
  steer.rotation.x = 0.5;
  parts.seat.add(steer);

  for (const x of [-0.78, 0.64]) for (const z of [-0.5, 0.5]) parts.guard.add(block(0.07, 1.1, 0.07, INK, x, 1.06, z));
  for (const z of [-0.5, 0.5]) parts.guard.add(block(1.5, 0.06, 0.07, INK, -0.07, 2.16, z));
  for (const x of [-0.78, 0.64]) parts.guard.add(block(0.07, 0.06, 1.1, INK, x, 2.16, 0));
  for (const z of [-0.25, 0, 0.25]) parts.guard.add(block(1.4, 0.03, 0.05, STEEL, -0.07, 2.17, z));

  const wheels = [
    { g: wheel(0.36, 0.26, 0.46, 0.5), r: 0.36 },
    { g: wheel(0.36, 0.26, 0.46, -0.5), r: 0.36 },
    { g: wheel(0.28, 0.22, -0.86, 0.48), r: 0.28 },
    { g: wheel(0.28, 0.22, -0.86, -0.48), r: 0.28 },
  ];
  for (const w of wheels) parts.wheels.add(w.g);

  for (const z of [-0.33, 0.33]) parts.mast.add(block(0.1, 2.3, 0.1, STEEL, 0.94, 0.05, z));
  parts.mast.add(block(0.1, 0.1, 0.76, STEEL, 0.94, 2.25, 0));
  parts.mast.add(block(0.1, 0.12, 0.76, STEEL, 0.94, 0.2, 0));
  for (const z of [-0.26, 0.26]) parts.inner.add(block(0.08, 2.2, 0.08, INK, 1.03, 0.08, z));
  parts.inner.add(block(0.08, 0.08, 0.6, INK, 1.03, 2.2, 0));

  const carriage = parts.carriage;
  carriage.add(block(0.07, 0.42, 0.86, INK, 1.1, 0.1, 0));
  for (let z = -0.36; z <= 0.37; z += 0.18) carriage.add(block(0.04, 0.62, 0.04, INK, 1.1, 0.52, z));
  carriage.add(block(0.04, 0.05, 0.8, INK, 1.1, 1.12, 0));
  for (const z of [-0.28, 0.28]) {
    carriage.add(block(0.05, 0.5, 0.12, INK, 1.16, 0.03, z));
    carriage.add(block(1.1, 0.05, 0.12, INK, 1.71, 0.03, z));
  }
  if (load) carriage.add(buildLoad(1.72, 0.08));
  const anchor = new THREE.Object3D();
  anchor.position.set(1.72, 0.08, 0);
  carriage.add(anchor);

  const spot = new THREE.Group();
  const spotMat = new THREE.MeshBasicMaterial({ color: spotColour, transparent: true, opacity: 0.85, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), spotMat);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 36), spotMat);
  for (const m of [disc, ring]) {
    m.rotation.x = -Math.PI / 2;
    spot.add(m);
  }
  spot.position.set(4.2, 0.03, 0);
  spot.visible = false;
  group.add(spot);

  return { group, parts, wheels, inner: parts.inner, carriage, anchor, spot };
}

// A pallet with one taped order on it, bottom at y.
export function buildLoad(x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.add(block(1.2, 0.14, 0.95, GREY, 0, 0, 0));
  g.add(block(1.0, 0.76, 0.8, PALE, 0, 0.14, 0));
  g.add(block(1.02, 0.77, 0.1, RED, 0, 0.14, 0));
  g.add(block(0.32, 0.18, 0.01, WHITE, 0.24, 0.42, 0.405));
  g.position.set(x, y, z);
  return g;
}
