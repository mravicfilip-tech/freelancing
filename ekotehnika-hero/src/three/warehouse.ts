// The warehouse diorama for the delivery story. Open top and open front, like a cut away model,
// so the camera can look in from the side, from below the racks, straight down or from outside
// the dock door. The route runs left to right along the main aisle at z = AISLE_Z.
//
//   showroom plinth  x 0       Novi viljuskari, the truck starts here
//   pick rack        x 10      the order pallet waits on the second beam
//   safety aisle     x 12..38  red floor line, the truck projects its warning spot
//   service bay      x 24      a truck up on the lift, tool wall, charger
//   approved bay     x 31.5    checked used trucks under the warranty shields
//   dock door        x 41      Najam and delivery, the shutter rolls up

import * as THREE from 'three';
import { buildForklift, buildLoad } from './forklift';
import { block, FLOOR, GREY, INK, mesh, PALE, RED, RED_LINE, STEEL, WALL, WHITE_LINE, type Tone } from './tone';
import { C } from '../tokens';

export const AISLE_Z = -2;
export const PICK = new THREE.Vector3(10, 2.92, -7.9);
export const DOCK_X = 41;

const WHITE: Tone = { top: C.white, front: C.white, side: C.white, back: C.white };
// White cladding and a red frame make the dock door read from outside, and keep copy legible on it.
const DOCK: Tone = { top: C.shadeGrey, front: C.lightGrey, side: C.white, back: C.lightGrey };

export function buildWarehouse() {
  const g = new THREE.Group();

  g.add(block(140, 0.1, 80, FLOOR, 20, -0.1, 0));

  // back wall, and the dock wall with a door opening at z -4 to 0
  g.add(block(50, 6, 0.3, WALL, 16, 0, -9.15));
  g.add(block(0.3, 6, 5, DOCK, DOCK_X, 0, -6.5));
  g.add(block(0.3, 6, 9, DOCK, DOCK_X, 0, 4.5));
  g.add(block(0.3, 1.8, 4, DOCK, DOCK_X, 4.2, -2));
  g.add(block(0.4, 0.3, 4.6, RED, DOCK_X, 3.95, -2));
  for (const z of [-4.15, 0.15]) g.add(block(0.4, 4.1, 0.3, RED, DOCK_X, 0, z));

  // aisle edges and the safety line down the middle
  for (let x = 4; x < 40; x += 1.6) {
    g.add(block(0.8, 0.012, 0.08, WHITE_LINE, x, 0, AISLE_Z - 1.35));
    g.add(block(0.8, 0.012, 0.08, WHITE_LINE, x, 0, AISLE_Z + 1.35));
  }
  for (let x = 12; x < 40.5; x += 0.9) g.add(block(0.5, 0.014, 0.06, RED_LINE, x, 0, AISLE_Z));

  g.add(showroom());
  g.add(pickRack());
  for (const x of [15, 17.8]) g.add(stockRack(x));
  g.add(serviceBay());
  g.add(approvedBay());
  g.add(dockOutside());

  const shutter = new THREE.Group();
  shutter.add(block(0.12, 4, 4, PALE, 0, 0, 0));
  for (let y = 0.3; y < 4; y += 0.4) shutter.add(block(0.14, 0.03, 4, GREY, 0, y, 0));
  shutter.position.set(DOCK_X - 0.05, 0, -2);
  g.add(shutter);

  return { group: g, shutter };
}

function sign(x: number, z: number, icon: THREE.Object3D, size = 2.2, y = 3.4) {
  const g = new THREE.Group();
  g.add(block(size, size, 0.1, RED, 0, 0, 0));
  icon.position.z = 0.06;
  icon.position.y = size / 2;
  g.add(icon);
  g.position.set(x, y, z);
  return g;
}

function shapeMesh(shape: THREE.Shape, tone: Tone = WHITE, scale = 1) {
  const m = mesh(new THREE.ShapeGeometry(shape), tone);
  m.scale.setScalar(scale);
  return m;
}

function starShape() {
  const s = new THREE.Shape();
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 === 0 ? 0.62 : 0.2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}

function shieldShape(w = 0.5, h = 0.62) {
  const s = new THREE.Shape();
  s.moveTo(0, h);
  s.lineTo(w, h * 0.78);
  s.lineTo(w, h * 0.1);
  s.quadraticCurveTo(w * 0.9, -h * 0.6, 0, -h);
  s.quadraticCurveTo(-w * 0.9, -h * 0.6, -w, h * 0.1);
  s.lineTo(-w, h * 0.78);
  s.closePath();
  return s;
}

function wrench() {
  const g = new THREE.Group();
  const handle = block(0.2, 1.1, 0.02, WHITE, 0, -0.55, 0);
  handle.rotation.z = -0.78;
  const head = new THREE.Shape();
  head.absarc(0, 0, 0.32, 0, Math.PI * 2, false);
  const jaw = new THREE.Path();
  jaw.moveTo(-0.1, 0.05);
  jaw.lineTo(-0.1, 0.4);
  jaw.lineTo(0.1, 0.4);
  jaw.lineTo(0.1, 0.05);
  head.holes.push(jaw);
  const h = shapeMesh(head);
  h.rotation.z = -0.78;
  h.position.set(0.34, 0.34, 0);
  g.add(handle, h);
  return g;
}

function clock() {
  const g = new THREE.Group();
  const ring = new THREE.Shape();
  ring.absarc(0, 0, 0.62, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.48, 0, Math.PI * 2, true);
  ring.holes.push(hole);
  g.add(shapeMesh(ring));
  g.add(block(0.09, 0.36, 0.02, WHITE, 0, 0, 0));
  const hand = block(0.09, 0.3, 0.02, WHITE, 0, 0, 0);
  hand.rotation.z = -2.1;
  g.add(hand);
  return g;
}

// Novi viljuskari. A white plinth with a red edge, two new trucks beside it under the star sign.
function showroom() {
  const g = new THREE.Group();
  g.add(block(6.4, 0.2, 5.2, PALE, 0, 0, -0.6));
  g.add(block(6.44, 0.21, 0.08, RED_LINE, 0, 0, 2.0));
  g.add(block(0.08, 0.21, 5.24, RED_LINE, 3.22, 0, -0.6));
  for (const [x, z, r] of [
    [-3.4, -6.2, 0.7],
    [1.6, -6.6, -0.5],
  ]) {
    const t = buildForklift();
    t.group.position.set(x, 0, z);
    t.group.rotation.y = r;
    g.add(t.group);
  }
  // on the back wall behind the plinth's right corner, where no chapter puts copy over it
  g.add(sign(3, -9, shapeMesh(starShape())));
  return g;
}

// The rack the order is picked from. One pallet per beam so the order sits centred at PICK.
function pickRack() {
  const g = new THREE.Group();
  const x0 = PICK.x - 1.35;
  for (const x of [x0, x0 + 2.7]) for (const z of [-8.5, -7.3]) g.add(block(0.1, 4.6, 0.1, STEEL, x, 0, z));
  for (const y of [1.4, 2.8, 4.15]) for (const z of [-8.5, -7.3]) g.add(block(2.7, 0.12, 0.08, RED, PICK.x, y, z));
  g.add(buildLoad(PICK.x, 0, -7.9));
  g.add(buildLoad(PICK.x, 4.27, -7.9));
  g.add(buildLoad(PICK.x, 1.52, -7.9));
  return g;
}

function stockRack(x0: number) {
  const g = new THREE.Group();
  const w = 2.7;
  for (const x of [x0, x0 + w]) for (const z of [-8.5, -7.3]) g.add(block(0.1, 4.6, 0.1, STEEL, x, 0, z));
  [1.4, 2.8, 4.15].forEach((y, i) => {
    for (const z of [-8.5, -7.3]) g.add(block(w, 0.12, 0.08, RED, x0 + w / 2, y, z));
    if (i !== 1 || x0 > 16) g.add(buildLoad(x0 + 0.75, y + 0.12, -7.9));
    g.add(buildLoad(x0 + 2.0, y + 0.12, -7.9));
  });
  g.add(buildLoad(x0 + 1.35, 0, -7.9));
  return g;
}

// Servis. A grey truck raised on the lift, tool wall and charger behind, wrench sign above.
function serviceBay() {
  const g = new THREE.Group();
  const cx = 24;
  g.add(block(6.6, 0.012, 0.1, RED_LINE, cx, 0, -4.2));
  for (const x of [cx - 1.6, cx + 1.6]) g.add(block(0.22, 3.2, 0.22, INK, x, 0, -6.4));
  g.add(block(3.6, 0.14, 0.5, STEEL, cx, 0.9, -6.4));
  const t = buildForklift({ tone: GREY });
  t.group.position.set(cx, 1.04, -6.4);
  t.group.rotation.y = Math.PI;
  g.add(t.group);
  g.add(block(4.6, 2.2, 0.06, PALE, cx, 1.4, -8.95));
  for (let i = 0; i < 5; i++) g.add(block(0.12, 0.9 - (i % 2) * 0.3, 0.05, INK, cx - 1.6 + i * 0.8, 2.2, -8.9));
  g.add(block(1.2, 1.0, 0.7, RED, cx + 2.9, 0, -8.4));
  for (let i = 0; i < 3; i++) g.add(block(1.0, 0.04, 0.02, WHITE, cx + 2.9, 0.25 + i * 0.28, -8.04));
  g.add(block(0.7, 1.7, 0.6, STEEL, cx - 3, 0, -8.5));
  g.add(block(0.36, 0.22, 0.02, WHITE, cx - 3, 1.3, -8.19));
  g.add(sign(cx, -9, wrench()));
  return g;
}

// Polovni. Two checked trucks in a marked bay, each under a red warranty shield on a post.
function approvedBay() {
  const g = new THREE.Group();
  const cx = 31.5;
  for (const x of [cx - 3.6, cx, cx + 3.6]) g.add(block(0.08, 0.012, 4.2, WHITE_LINE, x, 0, 3.4));
  g.add(block(7.28, 0.012, 0.08, WHITE_LINE, cx, 0, 1.3));
  for (const x of [cx - 1.8, cx + 1.8]) {
    const t = buildForklift();
    t.group.position.set(x, 0, 3.6);
    t.group.rotation.y = Math.PI / 2;
    g.add(t.group);
    g.add(block(0.06, 2.6, 0.06, STEEL, x - 1.2, 0, 1.9));
    const sh = shapeMesh(shieldShape(), RED_LINE);
    sh.position.set(x - 1.2, 3.0, 1.95);
    const check = new THREE.Shape();
    check.moveTo(-0.22, 0.02);
    check.lineTo(-0.08, -0.14);
    check.lineTo(0.24, 0.2);
    check.lineTo(0.18, 0.26);
    check.lineTo(-0.08, -0.02);
    check.lineTo(-0.16, 0.08);
    check.closePath();
    const ck = shapeMesh(check);
    ck.position.set(x - 1.2, 3.02, 1.97);
    g.add(sh, ck);
  }
  return g;
}

// Outside the dock. A loading apron with bumpers and the clock sign for 24 hour delivery.
function dockOutside() {
  const g = new THREE.Group();
  g.add(block(6, 0.02, 7, PALE, DOCK_X + 3.2, 0, -2));
  for (const z of [-4.3, 0.3]) g.add(block(0.3, 0.6, 0.4, INK, DOCK_X + 0.3, 0.3, z));
  for (let z = -5; z <= 1; z += 1) g.add(block(0.5, 0.014, 0.12, RED_LINE, DOCK_X + 4.5, 0, z));
  const s = sign(DOCK_X + 0.2, -6.2, clock(), 1.8, 3.6);
  s.rotation.y = Math.PI / 2;
  g.add(s);
  return g;
}
