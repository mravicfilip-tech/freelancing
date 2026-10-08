// The warehouse diorama. Open top and open front, like a cut away model, so the camera can look
// in from the side, from above or straight down. Stations run along +x in pillar order.
// Only Novi is dressed for the beat 1 and 2 checkpoint. Racks and the Najam dock are roughed in.

import * as THREE from 'three';
import { buildForklift, buildLoad } from './forklift';
import { block, FLOOR, mesh, PALE, RED, RED_LINE, STEEL, WALL, WHITE_LINE, INK } from './tone';

export const LANE_Z = 1.5;

export function buildWarehouse() {
  const g = new THREE.Group();

  g.add(block(110, 0.1, 60, FLOOR, 25, -0.1, 0));
  g.add(block(110, 6, 0.3, WALL, 25, 0, -9));

  // lane edges, dashed, either side of the truck's path
  // The near edge starts past beat 1's frame, where a dash this close to the lens reads as a glitch.
  for (let x = -16; x < 60; x += 1.6) {
    g.add(block(0.8, 0.01, 0.08, WHITE_LINE, x, 0, LANE_Z - 1.15));
    if (x > 12) g.add(block(0.8, 0.01, 0.08, WHITE_LINE, x, 0, LANE_Z + 1.15));
  }

  g.add(novi());
  // stock racks between the showroom and the dock, kept off the left of beat 1 where the copy sits
  for (const x of [12.5, 15.3, 18.1]) g.add(rack(x));
  g.add(najamRough());
  return g;
}

function rack(x0: number) {
  const g = new THREE.Group();
  const w = 2.7;
  for (const x of [x0, x0 + w]) for (const z of [-8.5, -7.3]) g.add(block(0.1, 4.3, 0.1, STEEL, x, 0, z));
  const levels = [1.4, 2.8, 4.15];
  levels.forEach((y, i) => {
    for (const z of [-8.5, -7.3]) g.add(block(w, 0.12, 0.08, RED, x0 + w / 2, y, z));
    if (i < 2 || x0 % 2 === 0) g.add(buildLoad(x0 + 0.75, y + 0.12, -7.9));
    if (i !== 1) g.add(buildLoad(x0 + 2.0, y + 0.12, -7.9));
  });
  g.add(buildLoad(x0 + 0.75, 0, -7.9));
  return g;
}

function star() {
  const s = new THREE.Shape();
  const pts = 8;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 === 0 ? 0.62 : 0.2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return new THREE.ShapeGeometry(s);
}

// Novi viljuskari. A showroom plinth with two new trucks under the red sign, stock racks behind.
function novi() {
  const g = new THREE.Group();

  g.add(block(7.4, 0.16, 4.4, PALE, 7.2, 0, -5.2));
  g.add(block(7.44, 0.17, 0.08, RED_LINE, 7.2, 0, -2.98));
  const a = buildForklift({ load: false });
  a.group.position.set(5.4, 0.16, -5.3);
  a.group.rotation.y = 0.55;
  const b = buildForklift({ load: false });
  b.group.position.set(9.2, 0.16, -5.6);
  b.group.rotation.y = -0.45;
  g.add(a.group, b.group);

  g.add(block(2.4, 2.4, 0.12, RED, 7.2, 3.2, -8.78));
  g.add(mesh(star(), WHITE_LINE, 7.2, 4.4, -8.71));
  return g;
}

// Najam. The dock wall with an open shutter, roughed in so the aerial view has a neighbour.
function najamRough() {
  const g = new THREE.Group();
  g.add(block(3.4, 3.6, 0.06, INK, 27.5, 0, -8.82));
  g.add(block(3.4, 1.5, 0.08, PALE, 27.5, 2.1, -8.78));
  g.add(block(3.8, 0.5, 1.2, STEEL, 27.5, 0, -8.2));
  for (let i = 0; i < 4; i++) g.add(block(1.2, 0.14, 0.95, STEEL, 23.6, i * 0.15, -7.4));
  g.add(buildLoad(30.6, 0, -7.6));
  g.add(buildLoad(31.9, 0, -7.6));
  return g;
}
