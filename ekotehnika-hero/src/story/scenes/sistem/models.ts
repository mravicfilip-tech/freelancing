// The vehicles and props the Sistem scene needs beyond the shared counterbalance forklift, built in
// metres in the same frame as src/r3f/Forklift.tsx. Forks point along +x, width along z, ground at
// y = 0. Red is the rear shell and counterweight only (M.paint), everything else is ink and grey.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M } from '../../../r3f/materials';
import { C } from '../../../tokens';

const rbox = (w: number, h: number, d: number, r = 0.04) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1));

function put(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const box = (parent: THREE.Object3D, w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, r = 0.03) => put(parent, rbox(w, h, d, r), mat, x, y, z);

// A wheel with its axle along z. Returns the group so it can spin.
function wheel(parent: THREE.Object3D, r: number, w: number, x: number, z: number, hub = M.steel) {
  const g = new THREE.Group();
  g.position.set(x, r, z);
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 30), M.rubber);
  tyre.rotation.x = Math.PI / 2;
  tyre.castShadow = true;
  g.add(tyre);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.58, r * 0.58, w * 1.04, 22), hub);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  parent.add(g);
  return g;
}

export type Built = { root: THREE.Group; wheels: { g: THREE.Group; r: number }[]; extra?: Record<string, THREE.Object3D> };

// ---------------------------------------------------------------------------------------------
// Reach truck, an R series style. Red rear shell, operator guard, a tall mast and two legs.
export function buildReach(): Built {
  const root = new THREE.Group();
  const wheels: Built['wheels'] = [];
  const track = (g: THREE.Group, r: number) => wheels.push({ g, r });
  // rear shell and the chassis plate
  box(root, 1.02, 1.08, 1.08, M.paint, -0.78, 0.66, 0, 0.12);
  box(root, 1.75, 0.16, 0.98, M.black, -0.3, 0.2, 0, 0.03);
  box(root, 0.5, 0.06, 0.9, M.cowl, 0.08, 0.34, 0, 0.02);
  // legs
  for (const z of [-0.43, 0.43]) {
    box(root, 1.5, 0.2, 0.2, M.black, 0.86, 0.22, z, 0.04);
    track(wheel(root, 0.17, 0.14, 1.36, z, M.steelLight), 0.17);
  }
  track(wheel(root, 0.24, 0.2, -0.92, 0, M.steelLight), 0.24);
  // operator guard over the deck beside the shell
  for (const x of [-0.22, 0.42]) for (const z of [-0.5, 0.5]) box(root, 0.06, 1.55, 0.06, M.black, x, 1.1, z, 0.02);
  for (const z of [-0.5, 0.5]) box(root, 0.7, 0.06, 0.06, M.black, 0.1, 1.88, z, 0.02);
  for (const x of [-0.22, 0.42]) box(root, 0.06, 0.06, 1.06, M.black, x, 1.88, 0, 0.02);
  for (const x of [-0.12, 0.08, 0.28]) box(root, 0.04, 0.03, 0.96, M.black, x, 1.9, 0, 0.01);
  // seat, backrest, console and steering
  box(root, 0.32, 0.12, 0.42, M.black, -0.02, 0.98, 0, 0.04);
  box(root, 0.08, 0.5, 0.42, M.black, -0.18, 1.26, 0, 0.04);
  box(root, 0.3, 0.7, 0.34, M.black, 0.34, 0.74, 0, 0.05);
  box(root, 0.16, 0.05, 0.3, M.steelLight, 0.34, 1.12, 0, 0.02);
  // mast, outer rails, cross members, inner rails
  const H = 4.3;
  for (const z of [-0.37, 0.37]) {
    box(root, 0.1, H, 0.1, M.black, 1.55, H / 2 + 0.1, z, 0.02);
    box(root, 0.07, H - 0.2, 0.07, M.steel, 1.66, (H - 0.2) / 2 + 0.2, z * 0.76, 0.02);
  }
  for (const y of [0.3, 1.5, 2.8, 4.1]) box(root, 0.1, 0.09, 0.84, M.steel, 1.55, y, 0, 0.02);
  // carriage and forks
  const car = new THREE.Group();
  car.position.y = 0.1;
  root.add(car);
  box(car, 0.07, 0.5, 0.92, M.black, 1.76, 0.3, 0, 0.02);
  for (const z of [-0.3, 0.3]) {
    box(car, 1.1, 0.06, 0.13, M.fork, 2.32, 0.05, z, 0.02);
    box(car, 0.07, 0.5, 0.13, M.fork, 1.82, 0.28, z, 0.02);
  }
  box(car, 0.04, 0.55, 0.9, M.steelLight, 1.8, 0.62, 0, 0.01);
  return { root, wheels, extra: { carriage: car } };
}

// ---------------------------------------------------------------------------------------------
// The MT15 C style pedestrian pallet truck. A short red housing, a tiller, two low forks.
export function buildPalletTruck(): Built {
  const root = new THREE.Group();
  const wheels: Built['wheels'] = [];
  box(root, 0.64, 0.76, 0.68, M.paint, -0.3, 0.5, 0, 0.1);
  box(root, 0.7, 0.11, 0.7, M.black, -0.25, 0.1, 0, 0.03);
  box(root, 0.5, 0.05, 0.5, M.cowl, -0.3, 0.9, 0, 0.02);
  box(root, 0.22, 0.34, 0.02, M.steelLight, 0.015, 0.55, 0, 0.01);
  for (const z of [-0.265, 0.265]) {
    box(root, 1.2, 0.07, 0.18, M.fork, 0.74, 0.075, z, 0.025);
    box(root, 0.14, 0.12, 0.2, M.black, 0.04, 0.1, z, 0.03);
    const w = wheel(root, 0.045, 0.1, 1.24, z * 0.9, M.steelLight);
    wheels.push({ g: w, r: 0.045 });
  }
  const dw = wheel(root, 0.125, 0.12, -0.3, 0.0, M.steelLight);
  wheels.push({ g: dw, r: 0.125 });
  for (const z of [-0.3, 0.3]) wheels.push({ g: wheel(root, 0.06, 0.07, -0.55, z, M.steelLight), r: 0.06 });
  // tiller, leaning back from the top of the housing, with its handle
  const tiller = new THREE.Group();
  tiller.position.set(-0.46, 0.86, 0);
  root.add(tiller);
  const dir = new THREE.Vector3(-0.56, 0.83, 0).normalize();
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 1.12, 14), M.black);
  arm.position.copy(dir).multiplyScalar(0.56);
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  arm.castShadow = true;
  tiller.add(arm);
  const head = new THREE.Group();
  head.position.copy(dir).multiplyScalar(1.12);
  tiller.add(head);
  put(head, rbox(0.14, 0.1, 0.4, 0.04), M.black, 0, 0, 0);
  for (const z of [-0.23, 0.23]) {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12), M.black);
    g.rotation.x = Math.PI / 2;
    g.position.set(0, 0, z * 1.0);
    head.add(g);
  }
  put(head, rbox(0.1, 0.04, 0.16, 0.015), M.steelLight, 0.02, 0.06, 0, false);
  return { root, wheels, extra: { tiller } };
}

// ---------------------------------------------------------------------------------------------
// A low level order picker. The operator platform rides the mast, the forks stay low.
export function buildPicker(): Built {
  const root = new THREE.Group();
  const wheels: Built['wheels'] = [];
  box(root, 1.1, 1.0, 1.04, M.paint, -0.78, 0.62, 0, 0.12);
  box(root, 2.4, 0.16, 0.98, M.black, -0.1, 0.2, 0, 0.03);
  for (const z of [-0.36, 0.36]) {
    box(root, 1.3, 0.09, 0.15, M.fork, 1.55, 0.07, z, 0.02);
    box(root, 0.1, 0.14, 0.17, M.black, 0.92, 0.13, z, 0.03);
    wheels.push({ g: wheel(root, 0.07, 0.12, 2.1, z, M.steelLight), r: 0.07 });
  }
  wheels.push({ g: wheel(root, 0.22, 0.2, -0.85, 0, M.steelLight), r: 0.22 });
  for (const z of [-0.5, 0.5]) wheels.push({ g: wheel(root, 0.15, 0.12, 0.88, z, M.steelLight), r: 0.15 });
  // mast
  const H = 4.5;
  for (const z of [-0.4, 0.4]) {
    box(root, 0.1, H, 0.1, M.black, 0.9, H / 2 + 0.1, z, 0.02);
    box(root, 0.07, H - 0.3, 0.07, M.steel, 0.99, (H - 0.3) / 2 + 0.25, z * 0.8, 0.02);
  }
  for (const y of [0.35, 1.7, 3.1, 4.5]) box(root, 0.1, 0.09, 0.9, M.steel, 0.9, y, 0, 0.02);
  // the operator platform and its guard rails
  const plat = new THREE.Group();
  plat.position.y = 1.15;
  root.add(plat);
  box(plat, 0.95, 0.07, 1.0, M.black, 0.34, 0, 0, 0.02);
  box(plat, 0.95, 0.03, 0.8, M.cowl, 0.34, 0.05, 0, 0.01);
  for (const z of [-0.5, 0.5]) {
    for (const x of [-0.12, 0.8]) box(plat, 0.05, 1.12, 0.05, M.black, x, 0.58, z, 0.015);
    box(plat, 0.95, 0.05, 0.05, M.black, 0.34, 1.14, z, 0.015);
    box(plat, 0.95, 0.05, 0.05, M.black, 0.34, 0.6, z, 0.015);
  }
  box(plat, 0.05, 0.05, 1.0, M.black, -0.12, 1.14, 0, 0.015);
  box(plat, 0.05, 0.05, 1.0, M.black, 0.8, 1.14, 0, 0.015);
  box(plat, 0.05, 0.05, 1.0, M.black, 0.8, 0.6, 0, 0.015);
  box(plat, 0.25, 0.5, 0.4, M.black, -0.02, 0.35, 0, 0.04);
  box(root, 0.07, 0.5, 0.9, M.black, 1.04, 0.35, 0, 0.02);
  return { root, wheels, extra: { platform: plat } };
}

// ---------------------------------------------------------------------------------------------
// The delivery truck, built as a silhouette. Cab and chassis are dark, the box body is a pane of
// dark glass with bright edges so what rides inside can be seen. Origin is the rear of the box at
// bed height, the cab is on -x, the ramp hinges at the rear and swings on the group `ramp`.
export const BED = 0.86;
export const TRUCK_BOX_LEN = 5.0;

export function buildDeliveryTruck() {
  const root = new THREE.Group();
  const wheels: { g: THREE.Group; r: number }[] = [];
  const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(C.lightGrey), transparent: true, opacity: 0.55, depthWrite: false });
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.ink).multiplyScalar(0.82), roughness: 0.55, metalness: 0.2 });
  const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ink).multiplyScalar(1.4), transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const edges = (mesh: THREE.Mesh, parent: THREE.Object3D) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), edgeMat);
    l.position.copy(mesh.position);
    l.quaternion.copy(mesh.quaternion);
    parent.add(l);
    return l;
  };
  const W = 2.4;
  // chassis frame and the bed
  put(root, new THREE.BoxGeometry(TRUCK_BOX_LEN + 1.4, 0.16, 1.5), dark, -(TRUCK_BOX_LEN + 1.4) / 2 + 0.1, BED - 0.4, 0);
  const bed = put(root, new THREE.BoxGeometry(TRUCK_BOX_LEN, 0.1, W), dark, -TRUCK_BOX_LEN / 2, BED - 0.05, 0);
  edges(bed, root);
  // the box, a pane per side with edges
  const boxH = 2.4;
  const shell = new THREE.Mesh(new THREE.BoxGeometry(TRUCK_BOX_LEN, boxH, W), glass);
  shell.position.set(-TRUCK_BOX_LEN / 2, BED + boxH / 2, 0);
  root.add(shell);
  edges(shell, root);
  // door ribs on the side panes
  for (let i = 1; i < 6; i++) {
    for (const z of [-W / 2, W / 2]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, boxH, 0.02), edgeMat);
      l.position.set(-i * (TRUCK_BOX_LEN / 6), BED + boxH / 2, z);
      root.add(l);
    }
  }
  // the cab, a side profile extruded across the width
  const s = new THREE.Shape();
  const cx = -TRUCK_BOX_LEN - 0.08;
  s.moveTo(cx, 0.78);
  s.lineTo(cx, 3.0);
  s.quadraticCurveTo(cx, 3.12, cx - 0.15, 3.12);
  s.lineTo(cx - 0.9, 3.12);
  s.lineTo(cx - 1.35, 2.3);
  s.lineTo(cx - 1.62, 2.15);
  s.lineTo(cx - 1.62, 0.78);
  s.closePath();
  const cabGeo = new THREE.ExtrudeGeometry(s, { depth: W - 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
  cabGeo.translate(0, 0, -(W - 0.12) / 2);
  const cab = new THREE.Mesh(cabGeo, dark);
  cab.castShadow = true;
  root.add(cab);
  edges(cab, root);
  // side windows as lit panes on both flanks of the cab
  const win = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lightGrey).multiplyScalar(0.5) });
  for (const z of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.62), win);
    sw.position.set(cx - 0.55, 2.62, z * (W / 2 + 0.01));
    if (z < 0) sw.rotation.y = Math.PI;
    root.add(sw);
  }
  // wheels
  for (const [x, r] of [
    [-5.9, 0.5],
    [-1.7, 0.5],
    [-0.65, 0.5],
  ] as const)
    for (const z of [-1.0, 1.0]) wheels.push({ g: wheel(root, r, 0.34, x, z * 1.0), r });
  // headlights and the tail lamp strip
  const lamp = new THREE.MeshBasicMaterial({ color: C.white });
  for (const z of [-0.78, 0.78]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.32), lamp);
    l.position.set(cx - 1.65, 1.2, z);
    root.add(l);
  }
  // the ramp, a plate hinged at the rear edge of the bed
  const ramp = new THREE.Group();
  ramp.position.set(0.02, BED - 0.02, 0);
  root.add(ramp);
  const RL = 2.9;
  const plate = put(ramp, new THREE.BoxGeometry(RL, 0.07, 1.9), M.steel, RL / 2, 0, 0);
  plate.castShadow = true;
  for (let i = 0; i < 9; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 1.8), M.black);
    rib.position.set(0.2 + i * 0.3, 0.045, 0);
    ramp.add(rib);
  }
  return { root, wheels, ramp, RL, cabX: cx - 1.65 };
}

// ---------------------------------------------------------------------------------------------
// A service van for the closing frame. Light grey body, dark glass, red nowhere.
export function buildVan(): Built {
  const root = new THREE.Group();
  const wheels: Built['wheels'] = [];
  const body = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.lightGrey), roughness: 0.42, metalness: 0.05 });
  const glassM = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.2, metalness: 0.4 });
  const s = new THREE.Shape();
  s.moveTo(-2.3, 0.5);
  s.lineTo(-2.3, 1.95);
  s.quadraticCurveTo(-2.3, 2.12, -2.1, 2.12);
  s.lineTo(0.7, 2.12);
  s.quadraticCurveTo(1.2, 2.1, 1.55, 1.62);
  s.lineTo(2.2, 1.28);
  s.quadraticCurveTo(2.36, 1.22, 2.36, 1.05);
  s.lineTo(2.36, 0.55);
  s.lineTo(2.2, 0.5);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.84, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.07, bevelSegments: 3, curveSegments: 14 });
  g.translate(0, 0, -0.92);
  const b = new THREE.Mesh(g, body);
  b.castShadow = true;
  b.receiveShadow = true;
  root.add(b);
  box(root, 4.7, 0.2, 1.6, M.black, 0, 0.5, 0, 0.04);
  // windows
  for (const z of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.ShapeGeometry(winShape()), glassM);
    w.position.set(0, 0, z * 1.0);
    if (z < 0) w.rotation.y = Math.PI;
    root.add(w);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.02), M.stripe);
    strip.position.set(-0.7, 1.05, z * 1.0);
    root.add(strip);
  }
  for (const x of [-1.38, 1.4]) for (const z of [-0.88, 0.88]) wheels.push({ g: wheel(root, 0.37, 0.26, x, z, M.steelLight), r: 0.37 });
  // a wrench plaque on the side, two crossed bars in ink
  for (const z of [-1, 1]) {
    const plaque = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.6 }));
    plaque.position.set(-0.8, 1.35, z * 1.015);
    if (z < 0) plaque.rotation.y = Math.PI;
    root.add(plaque);
    const wr = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.01), M.white);
    wr.position.set(-0.8, 1.35, z * 1.022);
    wr.rotation.z = Math.PI / 4;
    if (z < 0) wr.rotation.y = Math.PI;
    root.add(wr);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 16, Math.PI * 1.5), M.white);
    hd.position.set(-0.8 + 0.16 * z * z, 1.35 + 0.16, z * 1.022);
    if (z < 0) hd.rotation.y = Math.PI;
    root.add(hd);
  }
  for (const z of [-0.7, 0.7]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.24), M.lamp);
    hl.position.set(2.4, 0.95, z);
    root.add(hl);
  }
  return { root, wheels };
}
function winShape() {
  const w = new THREE.Shape();
  w.moveTo(0.1, 1.5);
  w.lineTo(0.1, 1.98);
  w.lineTo(0.72, 1.98);
  w.quadraticCurveTo(1.1, 1.96, 1.38, 1.6);
  w.lineTo(1.5, 1.5);
  w.closePath();
  return w;
}

// ---------------------------------------------------------------------------------------------
// The pit stop rig, a scissor lift. setLift(h) raises the deck h metres.
export function buildLift() {
  const root = new THREE.Group();
  const base = box(root, 4.6, 0.14, 2.4, M.black, 0, 0.07, 0, 0.03);
  const deck = new THREE.Group();
  root.add(deck);
  box(deck, 4.8, 0.14, 2.4, M.black, 0, 0, 0, 0.03);
  box(deck, 4.5, 0.03, 2.1, M.black, 0, 0.085, 0, 0.01);
  for (const z of [-1.1, 1.1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: C.white }));
    strip.position.set(0, 0.1, z);
    deck.add(strip);
  }
  const arms: THREE.Mesh[] = [];
  const armGeo = new THREE.BoxGeometry(1, 0.14, 0.14);
  for (const z of [-0.8, 0.8])
    for (let i = 0; i < 2; i++) {
      const a = new THREE.Mesh(armGeo, M.steel);
      a.position.z = z;
      a.castShadow = true;
      root.add(a);
      arms.push(a);
    }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.9, 14), M.steelLight);
  pin.rotation.x = Math.PI / 2;
  root.add(pin);
  const HX = 1.35;
  const setLift = (h: number) => {
    const y0 = 0.14;
    const dy = Math.max(0.02, h);
    const len = Math.hypot(2 * HX, dy);
    const ang = Math.atan2(dy, 2 * HX);
    arms.forEach((a, i) => {
      a.scale.x = len;
      a.position.y = y0 + dy / 2;
      a.position.x = 0;
      a.rotation.z = i % 2 === 0 ? ang : -ang;
    });
    pin.position.set(0, y0 + dy / 2, 0);
    deck.position.y = 0.14 + dy + 0.07;
  };
  setLift(0);
  void base;
  return { root, setLift };
}

// ---------------------------------------------------------------------------------------------
// Euro pallets with a taped carton, merged into three geometries so a whole pile is three draw calls.
export function palletParts() {
  const wood: THREE.BufferGeometry[] = [];
  const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => {
    g.translate(x, y, z);
    return g;
  };
  for (const z of [-0.42, 0, 0.42]) wood.push(at(new THREE.BoxGeometry(1.2, 0.04, 0.12), 0, 0.02, z));
  for (const x of [-0.5, 0, 0.5]) for (const z of [-0.36, 0, 0.36]) wood.push(at(new THREE.BoxGeometry(0.14, 0.07, 0.12), x, 0.07, z));
  for (const x of [-0.52, -0.26, 0, 0.26, 0.52]) wood.push(at(new THREE.BoxGeometry(0.13, 0.03, 0.95), x, 0.125, 0));
  const carton = at(rbox(1.08, 0.78, 0.86, 0.025), 0, 0.14 + 0.39, 0);
  const tape = at(new THREE.BoxGeometry(1.1, 0.79, 0.1), 0, 0.14 + 0.39, 0);
  return { wood: mergeGeometries(wood)!, carton, tape };
}

export class PalletSet {
  group = new THREE.Group();
  wood: THREE.InstancedMesh;
  carton: THREE.InstancedMesh;
  tape: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private e = new THREE.Euler();
  constructor(public count: number) {
    const parts = palletParts();
    const card = M.card.clone();
    card.color.multiplyScalar(0.34);
    const wood = M.pallet.clone();
    wood.color.multiplyScalar(0.8);
    this.wood = new THREE.InstancedMesh(parts.wood, wood, count);
    this.carton = new THREE.InstancedMesh(parts.carton, card, count);
    this.tape = new THREE.InstancedMesh(parts.tape, M.tape, count);
    for (const m of [this.wood, this.carton, this.tape]) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      this.group.add(m);
    }
    for (let i = 0; i < count; i++) this.set(i, 0, 0, 0, 0, 0);
    this.flush();
  }
  // Place pallet i. s of 0 hides it.
  set(i: number, x: number, y: number, z: number, ry: number, s = 1) {
    this.p.set(x, y, z);
    this.q.setFromEuler(this.e.set(0, ry, 0));
    this.s.setScalar(Math.max(1e-4, s));
    this.m.compose(this.p, this.q, this.s);
    this.wood.setMatrixAt(i, this.m);
    this.carton.setMatrixAt(i, this.m);
    this.tape.setMatrixAt(i, this.m);
  }
  flush() {
    this.wood.instanceMatrix.needsUpdate = true;
    this.carton.instanceMatrix.needsUpdate = true;
    this.tape.instanceMatrix.needsUpdate = true;
  }
}
