// The excavator of hero 7, built from primitives and posed from p. A crawler. Two tracks with a loop of
// shoes that travels round the sprocket and the idler, rollers, the track frames, a slew ring, and on it
// the turning house with a rounded counterweight, an engine hood with louvres, a handrail, the cab with
// framed dark glass and mirrors, and the boom, the stick and the bucket as nested pivots with pins at
// every joint and a hydraulic cylinder, barrel and rod, at each of the three. The side profile follows
// the BullHill mark (public/brand/mark-on-dark.svg), a gooseneck boom that rises, bends and hands over to
// a stick that hangs nearly upright, a bucket with a row of teeth, the cab at the front of the house and
// a rounded counterweight at the back. Greys only, the specimen's own, graphite body, darker tracks,
// steel bucket, and no red.
//
// Everything that moves with the same transform is merged into one mesh, so the machine is sixteen
// draw calls. Edges are bevelled in the geometry and the normals creased, so a bevel catches light
// where a hard edge would not. The local frame is x forward, y up, z to the operator's right, and the
// root is turned half a turn so the machine faces the camera's end of the route.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Bag, box, cylX, cylY, cylZ, planSlab, prism, ribbon, sq } from './geo';
import { E0, HOUSE_Y, L2, MZ, PIV, XM0, type Pose } from './world';

// ---- the track loop, the path of the outer face of the shoes. Two straight runs and a half turn at each
// end, driven by the travel of the machine so the shoes roll round as it reverses.
const TR_X = 1.4; // the centres of the two ends
const TR_R = 0.44; // the end radius, to the grouser tips
const RUN = 2 * TR_X;
const LOOP = 2 * RUN + 2 * Math.PI * TR_R;
const SHOES = 42;
const PITCH = LOOP / SHOES;
const TRACK_Z = 0.95; // the centre of each track
const _m = new THREE.Matrix4();
function shoeAt(s: number, zc: number, out: THREE.Matrix4) {
  let x: number;
  let y: number;
  let tx: number;
  let ty: number;
  const arcL = Math.PI * TR_R;
  if (s < RUN) {
    x = -TR_X + s;
    y = 0;
    tx = 1;
    ty = 0;
  } else if (s < RUN + arcL) {
    const f = -Math.PI / 2 + (s - RUN) / TR_R;
    x = TR_X + TR_R * Math.cos(f);
    y = TR_R + TR_R * Math.sin(f);
    tx = -Math.sin(f);
    ty = Math.cos(f);
  } else if (s < 2 * RUN + arcL) {
    x = TR_X - (s - RUN - arcL);
    y = 2 * TR_R;
    tx = -1;
    ty = 0;
  } else {
    const f = Math.PI / 2 + (s - 2 * RUN - arcL) / TR_R;
    x = -TR_X + TR_R * Math.cos(f);
    y = TR_R + TR_R * Math.sin(f);
    tx = -Math.sin(f);
    ty = Math.cos(f);
  }
  // x along the track, y out of it, z mirrored so the turn stays a proper one
  out.set(tx, ty, 0, x, ty, -tx, 0, y, 0, 0, -1, zc, 0, 0, 0, 1);
  return out;
}

// the greys, the specimen's own
const GRAPHITE = '#44444a';
const PANEL = '#55555c';
const DEEP = '#2e2e34';
const TRIM = '#121214';
const STEEL = '#b4b4ba';
const STEEL_D = '#85858c';
const HUB = '#55555c';

// a hash of a position, 0 to 1, the same every time, for the dust and the dirt
const hash = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
};

// a small tiling noise for the roughness, clouds and fine speckle and a few long scuffs, from 0.5 to 1.
// Only its green channel is read.
function noiseTexture() {
  const n = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const c = cv.getContext('2d')!;
  c.fillStyle = 'rgb(205,205,205)';
  c.fillRect(0, 0, n, n);
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  // soft clouds, wrapped so the tile has no seam
  for (let i = 0; i < 160; i++) {
    const x = rnd() * n;
    const y = rnd() * n;
    const r = 8 + rnd() * 34;
    const v = Math.floor(120 + rnd() * 135);
    for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) {
      const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, `rgba(${v},${v},${v},0.5)`);
      g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      c.fillStyle = g;
      c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  // fine speckle and a few scuffs
  for (let i = 0; i < 2600; i++) {
    const v = Math.floor(110 + rnd() * 140);
    c.fillStyle = `rgba(${v},${v},${v},0.35)`;
    c.fillRect(rnd() * n, rnd() * n, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  c.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const v = Math.floor(90 + rnd() * 60);
    c.strokeStyle = `rgba(${v},${v},${v},0.4)`;
    const x = rnd() * n;
    const y = rnd() * n;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 10 + rnd() * 30, y + (rnd() - 0.5) * 6);
    c.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export type MachineRig = {
  root: THREE.Group;
  bucketPivot: THREE.Object3D;
  update(p: Pose, rock?: number, clock?: number): void;
  dispose(): void;
};

export function buildMachine(): MachineRig {
  const geos: THREE.BufferGeometry[] = [];
  const keep = <G extends THREE.BufferGeometry>(g: G) => (geos.push(g), g);
  // the paint is not one roughness. A soft noise lifts and drops it across the panels, so the clearcoat
  // breaks up where the paint is chalked and thin, and a sheen lightens the grazing edges
  const grain = noiseTexture();
  const paintMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, roughnessMap: grain, metalness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.24, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color('#9a9aa2') });
  const darkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, roughnessMap: grain, metalness: 0.2 });
  const steelMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.52, roughnessMap: grain, metalness: 0.85 });
  const shoeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, roughnessMap: grain, metalness: 0.55 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: '#34343a', roughness: 0.45, metalness: 0.5 });
  const rodMat = new THREE.MeshStandardMaterial({ color: '#d2d2d6', roughness: 0.2, metalness: 1 });
  const glass = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 });
  const mats = [paintMat, darkMat, steelMat, shoeMat, barrelMat, rodMat, glass];
  type Fn = (x: number, y: number, z: number) => number;
  const mesh = (b: Bag, m: THREE.Material, cast = true, shade?: Fn, opt?: { dirt?: Fn; edge?: number }) => {
    const o = new THREE.Mesh(keep(b.build(shade, opt)), m);
    o.castShadow = cast;
    o.receiveShadow = true;
    return o;
  };

  const root = new THREE.Group();
  root.position.set(XM0, 0, MZ);
  root.rotation.y = Math.PI;

  // ---- the undercarriage, static
  const under = new Bag();
  for (const s of [-1, 1]) {
    const zc = s * TRACK_Z;
    // the track frame between the two faces of the shoes
    under.add(box(2.9, 0.46, 0.14, 0.06), '#2a2a2f', [0, 0.46, zc]);
    // the rear sprocket and the front idler, a disc, a rim and a hub
    for (const [x, r] of [[-TR_X, 0.3], [TR_X, 0.31]] as const) {
      under.add(cylZ(r, 0.34, 28), '#34343a', [x, TR_R, zc]);
      under.add(cylZ(r + 0.012, 0.05, 28), '#1d1d20', [x, TR_R, zc - 0.19]);
      under.add(cylZ(r + 0.012, 0.05, 28), '#1d1d20', [x, TR_R, zc + 0.19]);
      under.add(cylZ(0.15, 0.4, 14), HUB, [x, TR_R, zc]);
      under.add(cylZ(0.07, 0.43, 10), STEEL_D, [x, TR_R, zc]);
    }
    // five track rollers, each with a flange, and one carrier on the top run
    for (const x of [-0.92, -0.46, 0, 0.46, 0.92]) {
      under.add(cylZ(0.115, 0.3, 16), '#3a3a40', [x, 0.25, zc]);
      under.add(cylZ(0.145, 0.04, 16), '#202024', [x, 0.25, zc - 0.1]);
      under.add(cylZ(0.145, 0.04, 16), '#202024', [x, 0.25, zc + 0.1]);
      under.add(cylZ(0.045, 0.37, 8), STEEL_D, [x, 0.25, zc]);
    }
    under.add(cylZ(0.075, 0.26, 12), '#3a3a40', [0.05, 0.69, zc]);
    // the guard over the front of the track, a plate that keeps stones off the idler
    under.add(box(0.46, 0.05, 0.36, 0.02), '#202024', [TR_X + 0.02, 0.9, zc]);
  }
  // the lower frame between the tracks and the slew ring it carries
  under.add(box(2.5, 0.52, 1.5, 0.07), '#2b2b30', [0, 0.6, 0]);
  under.add(box(1.5, 0.26, 1.78, 0.06), '#26262a', [0, 0.52, 0]);
  under.add(cylY(1.06, 0.12, 40), '#222226', [0, 0.89, 0]);
  under.add(cylY(1.09, 0.025, 40), STEEL_D, [0, 0.935, 0]);
  // the undercarriage has been on a verge, dust and soil to the height of the track and a little higher
  const dust: Fn = (x, y, z) => Math.min(0.3, Math.max(0, 0.42 - y * 0.4)) * (0.55 + 0.9 * hash(x * 9, y * 5, z * 7));
  const underMesh = mesh(under, darkMat, true, undefined, { dirt: dust });
  root.add(underMesh);

  // the loop of shoes, 42 a side, in one instanced draw. A plate, a grouser ridge on its outer face and
  // a link bar down each edge.
  const shoe = new Bag();
  shoe.add(sq(0.185, 0.035, 0.5), '#35353b', [0, -0.0675, 0]);
  shoe.add(sq(0.032, 0.05, 0.47), '#6f6a60', [0, -0.025, 0]);
  for (const s of [-1, 1]) shoe.add(sq(0.185, 0.07, 0.05), '#26262b', [0, -0.09, s * 0.225]);
  const shoeG = keep(shoe.build(undefined, { dirt: (x, y, z) => (y > -0.045 ? 0.3 : 0.16) * (0.5 + 0.9 * hash(x * 31, y * 17, z * 23)), edge: 0.3 }));
  const shoes = new THREE.InstancedMesh(shoeG, shoeMat, SHOES * 2);
  shoes.castShadow = true;
  shoes.receiveShadow = true;
  shoes.frustumCulled = false;
  root.add(shoes);
  const shoeTravel = { last: NaN };
  const setShoes = (travel: number) => {
    if (travel === shoeTravel.last) return;
    shoeTravel.last = travel;
    for (let side = 0; side < 2; side++) {
      const zc = side === 0 ? -TRACK_Z : TRACK_Z;
      for (let i = 0; i < SHOES; i++) {
        let s = (i * PITCH + travel) % LOOP;
        if (s < 0) s += LOOP;
        shoes.setMatrixAt(side * SHOES + i, shoeAt(s, zc, _m));
      }
    }
    shoes.instanceMatrix.needsUpdate = true;
  };
  setShoes(0);

  // ---- the house, deck at y 0 on the slew ring
  const house = new THREE.Group();
  house.position.y = HOUSE_Y;
  root.add(house);
  const body = new Bag();
  const metal = new Bag();
  const gl = new Bag();

  // the deck and the skirt under the house
  body.add(planSlab(-2.1, 1.52, 1.15, 0.85, 0, 0.2, 0.04), DEEP);
  // the rounded counterweight at the back, and the engine hood in front of it
  body.add(planSlab(-2.12, -0.85, 1.14, 0.8, 0.12, 1.06, 0.09), '#35353a');
  body.add(box(1.4, 0.86, 2.08, 0.13, 3), GRAPHITE, [-0.2, 0.62, 0]);
  // the front deck the cab and the boom foot stand on, and the hydraulic tank on the right of it
  body.add(box(1.34, 0.4, 2.3, 0.06), '#3a3a3f', [0.88, 0.36, 0]);
  body.add(box(1.05, 0.5, 0.4, 0.05), PANEL, [0.8, 0.8, 0.93]);
  metal.add(cylY(0.055, 0.05, 12), STEEL_D, [0.5, 1.07, 0.93]);
  // the cab, a lower body, four pillars and a middle pillar a side, a roof with a visor
  body.add(box(1.62, 0.5, 0.92, 0.05), GRAPHITE, [0.64, 0.81, -0.66]);
  for (const x of [1.42, -0.1]) for (const z of [-1.1, -0.22]) body.add(box(0.1, 0.92, 0.1, 0.025), DEEP, [x, 1.5, z]);
  for (const z of [-1.1, -0.22]) body.add(box(0.07, 0.9, 0.07, 0.02), DEEP, [0.64, 1.5, z]);
  body.add(box(1.9, 0.12, 1.16, 0.05), PANEL, [0.66, 2.01, -0.7]);
  body.add(box(0.2, 0.06, 1.1, 0.025), DEEP, [1.64, 1.98, -0.7]);
  // the glass, a front pane, two a side and a rear pane, dark blue grey, lighter at the top where it
  // gives back the sky, with a slanted streak of light across each
  gl.add(sq(0.03, 0.82, 0.78), '#262a32', [1.42, 1.5, -0.66]);
  gl.add(sq(0.03, 0.82, 0.78), '#262a32', [-0.1, 1.5, -0.66]);
  for (const z of [-1.1, -0.22]) {
    gl.add(sq(0.66, 0.82, 0.03), '#262a32', [1.03, 1.5, z]);
    gl.add(sq(0.6, 0.82, 0.03), '#262a32', [0.27, 1.5, z]);
    const sz = z + (z < -0.5 ? -0.022 : 0.022);
    gl.add(prism([[-0.2, -0.4], [-0.08, -0.4], [0.2, 0.4], [0.08, 0.4]], 0.004, 0), '#5b6270', [1.03, 1.5, sz]);
    gl.add(prism([[-0.2, -0.4], [-0.08, -0.4], [0.2, 0.4], [0.08, 0.4]], 0.004, 0), '#5b6270', [0.27, 1.5, sz]);
  }
  gl.add(prism([[-0.22, -0.4], [-0.1, -0.4], [0.18, 0.4], [0.06, 0.4]], 0.004, 0), '#5b6270', [1.445, 1.5, -0.66], [0, Math.PI / 2, 0]);
  // door line, handle, and a grab bar on the left of the cab
  body.add(sq(0.014, 0.46, 0.012), TRIM, [0.95, 0.81, -1.125]);
  body.add(sq(0.014, 0.46, 0.012), TRIM, [0.0, 0.81, -1.125]);
  metal.add(box(0.14, 0.03, 0.03, 0.012, 1), STEEL, [0.82, 0.93, -1.13]);
  metal.add(cylY(0.018, 0.5, 8), STEEL, [1.38, 1.0, -1.17]);
  // the mirrors and the roof lights
  metal.add(sq(0.025, 0.025, 0.3), STEEL_D, [1.46, 1.8, -1.2]);
  body.add(box(0.06, 0.22, 0.14, 0.02, 1), TRIM, [1.46, 1.82, -1.38]);
  metal.add(box(0.1, 0.07, 0.17, 0.02, 1), '#dcdce0', [1.6, 2.1, -1.0]);
  metal.add(box(0.1, 0.07, 0.17, 0.02, 1), '#dcdce0', [1.6, 2.1, -0.4]);
  // louvres in the hood on both sides, a dark recess with a row of slats, and the vents on top
  for (const s of [-1, 1]) {
    const z = s * 1.05;
    body.add(box(0.62, 0.46, 0.03, 0.01, 1), TRIM, [-0.5, 0.7, z]);
    for (let i = 0; i < 7; i++) body.add(sq(0.56, 0.03, 0.03), '#34343a', [-0.5, 0.52 + i * 0.065, z + s * 0.012]);
    body.add(sq(0.012, 0.5, 0.012), TRIM, [-0.14, 0.62, z]);
    body.add(sq(0.012, 0.5, 0.012), TRIM, [-0.86, 0.62, z]);
  }
  for (let i = 0; i < 7; i++) body.add(sq(0.5, 0.02, 0.03), TRIM, [-0.3, 1.06, -0.55 + i * 0.12]);
  // the rear grille, slots across the back of the counterweight
  for (let i = 0; i < 5; i++) body.add(sq(0.03, 0.05, 0.6), TRIM, [-2.22, 0.9 - i * 0.12, 0]);
  // the handrail along the left of the hood, three posts and a rail with its returns
  for (const x of [-1.55, -0.85, -0.2]) metal.add(cylY(0.022, 0.3, 8), STEEL_D, [x, 1.2, -0.92]);
  metal.add(cylX(0.024, 1.5, 8), STEEL_D, [-0.88, 1.35, -0.92]);
  metal.add(cylZ(0.024, 0.24, 8), STEEL_D, [-1.63, 1.35, -0.8]);
  metal.add(cylZ(0.024, 0.24, 8), STEEL_D, [-0.12, 1.35, -0.8]);
  // the exhaust
  metal.add(cylY(0.07, 0.58, 12), '#2a2a2e', [-1.25, 1.35, 0.78]);
  metal.add(cylY(0.09, 0.05, 12), STEEL_D, [-1.25, 1.66, 0.78]);
  // the boom foot, two plates and the pin boss between them, and the cylinder base pin on the deck
  for (const s of [-1, 1]) body.add(box(0.74, 0.96, 0.09, 0.03), PANEL, [PIV[0], 0.98, PIV[2] + s * 0.31]);
  metal.add(cylZ(0.15, 0.82, 16), STEEL_D, [PIV[0], PIV[1], PIV[2]]);
  metal.add(cylZ(0.055, 0.95, 10), STEEL, [PIV[0] - 0.7, PIV[1] - 0.4, PIV[2]]);
  body.add(box(0.2, 0.2, 0.9, 0.03), PANEL, [PIV[0] - 0.7, PIV[1] - 0.48, PIV[2]]);
  // darker low on the house and under the cab and the roof's edge, lighter on the tops
  const houseAo = (_x: number, y: number) => 0.5 + 0.5 * Math.min(1, Math.max(0, (y - 0.1) / 1.1));
  house.add(mesh(body, paintMat, true, houseAo, { dirt: (x, y, z) => Math.min(0.26, Math.max(0, 0.34 - y * 0.5)) * (0.45 + 1.0 * hash(x * 11, y * 3, z * 13)), edge: 0.4 }), mesh(metal, steelMat, false), mesh(gl, glass, false, (_x, y) => 0.3 + 0.7 * Math.min(1, Math.max(0, (y - 1.05) / 0.9))));

  // ---- the arm, the boom foot sits on the house, every joint a pivot
  const armBase = new THREE.Group();
  armBase.position.set(PIV[0], PIV[1], PIV[2]);
  house.add(armBase);

  // the boom, a gooseneck. Pin bosses at the foot and the elbow, a lug for the lift cylinders on its rear
  // face and one on its top for the stick cylinder.
  const boomB = new Bag();
  boomB.add(ribbon([[0, 0], [0.28, 0.95], [0.55, 1.75], [1.05, 2.18], [1.85, 2.48], [E0[0], E0[1]]], [0.5, 0.47, 0.43, 0.38, 0.33, 0.28], 0.5), GRAPHITE);
  // a spine of a lighter panel along the top of the boom
  boomB.add(ribbon([[0.5, 2.12], [0.86, 2.49], [1.76, 2.79], [2.6, 2.91]], [0.03, 0.03, 0.03, 0.03], 0.34, 3, 0.02), PANEL);
  boomB.add(ribbon([[0.25, 0.9], [0.55, 1.75], [1.05, 2.18], [1.85, 2.48], [2.35, 2.58]], [0.2, 0.2, 0.17, 0.15, 0.13], 0.58, 3, 0.03), PANEL);
  boomB.add(box(0.16, 0.32, 0.9, 0.04), PANEL, [-0.22, 1.0, 0]);
  boomB.add(box(0.14, 0.34, 0.1, 0.03), PANEL, [1.15, 2.74, 0]);
  const boomM = new Bag();
  boomM.add(cylZ(0.2, 0.62, 18), STEEL_D, [0, 0, 0]);
  boomM.add(cylZ(0.17, 0.62, 18), STEEL_D, [E0[0], E0[1], 0]);
  boomM.add(cylZ(0.065, 0.98, 10), STEEL, [-0.25, 1.0, 0]);
  boomM.add(cylZ(0.055, 0.26, 10), STEEL, [1.15, 2.85, 0]);
  const boom = new THREE.Group();
  armBase.add(boom);
  boom.add(mesh(boomB, paintMat, true, (_x, y) => 0.72 + 0.28 * Math.min(1, Math.max(0, (y - 0.4) / 2.2)), { edge: 0.35, dirt: (x, y, z) => Math.max(0, 0.22 - y * 0.1) * hash(x * 7, y * 7, z * 7) }), mesh(boomM, steelMat, false));

  // the stick, with the ear that carries its cylinder behind the elbow and a lug for the bucket cylinder
  const stickB = new Bag();
  stickB.add(ribbon([[0, 0], [L2 * 0.5, 0], [L2, 0]], [0.28, 0.23, 0.19], 0.4), GRAPHITE);
  stickB.add(ribbon([[0.5, 0], [L2 * 0.5, 0], [L2 - 0.4, 0]], [0.11, 0.1, 0.08], 0.48, 3, 0.025), PANEL);
  stickB.add(prism([[0.12, 0.18], [-0.3, 0.3], [-0.6, 0.62], [-0.38, 0.8], [0.14, 0.5]], 0.14, 0.025), PANEL);
  stickB.add(prism([[0.55, 0.2], [0.8, 0.5], [1.0, 0.2]], 0.12, 0.02), PANEL, [0, 0, 0]);
  const stickM = new Bag();
  stickM.add(cylZ(0.14, 0.52, 16), STEEL_D, [0, 0, 0]);
  stickM.add(cylZ(0.055, 0.3, 10), STEEL, [-0.5, 0.6, 0]);
  stickM.add(cylZ(0.05, 0.3, 10), STEEL, [0.8, 0.3, 0]);
  stickM.add(cylZ(0.15, 0.52, 16), STEEL_D, [L2, 0, 0]);
  const stick = new THREE.Group();
  stick.position.set(E0[0], E0[1], 0);
  boom.add(stick);
  stick.add(mesh(stickB, paintMat, true, (x) => 0.78 + 0.22 * Math.min(1, Math.max(0, x / 1.6)), { edge: 0.35, dirt: (x, y, z) => Math.max(0, 0.18 * (x / 2.4)) * hash(x * 9, y * 5, z * 9) }), mesh(stickM, steelMat, false));

  // the bucket, mouth towards the machine. Two side plates, the shell, the lip with five teeth and the side
  // cutters, two ribs on the back and the ears at the pin.
  const bk = new Bag();
  const SHELL: [number, number][] = [[0.4, 0.1], [0.5, -0.25], [0.47, -0.62], [0.32, -0.96], [0.04, -1.17], [-0.28, -1.25]];
  const side: [number, number][] = [...SHELL, [-0.34, -1.2], [-0.3, 0.0]];
  for (const s of [-1, 1]) bk.add(prism(side, 0.06, 0.02), '#9a9aa1', [0, 0, s * 0.5]);
  // the shell, offset inwards by its thickness, as a thin crescent across the full width
  const inner: [number, number][] = [[0.34, 0.08], [0.43, -0.25], [0.4, -0.6], [0.27, -0.9], [0.02, -1.1], [-0.28, -1.17]];
  bk.add(prism([...SHELL, [-0.28, -1.17], ...[...inner].reverse().slice(1)], 0.98, 0.02, 1), '#a4a4ab');
  // the lip plate, bolted along the cutting edge
  bk.add(prism([[-0.2, -1.19], [-0.36, -1.14], [-0.4, -1.27], [-0.2, -1.29]], 1.02, 0.015, 1), '#7f7f86');
  for (let i = 0; i < 5; i++) bk.add(prism([[-0.3, -1.13], [-0.5, -1.185], [-0.53, -1.215], [-0.3, -1.27]], 0.12, 0.012, 1), '#d2d2d6', [0, 0, -0.4 + i * 0.2]);
  for (const s of [-1, 1]) bk.add(prism([[-0.22, -1.06], [-0.5, -1.22], [-0.47, -1.3], [-0.14, -1.3]], 0.09, 0.015, 1), '#c8c8cd', [0, 0, s * 0.535]);
  // ribs on the back and the ears that hold the pin
  for (const s of [-1, 1]) bk.add(prism([[0.42, 0.0], [0.52, -0.25], [0.5, -0.62], [0.35, -0.97], [0.06, -1.19], [0.05, -1.14], [0.3, -0.93], [0.44, -0.6], [0.46, -0.25]], 0.06, 0.012, 1), '#8f8f96', [0, 0, s * 0.2]);
  for (const s of [-1, 1]) bk.add(prism([[-0.2, 0.0], [0.0, 0.22], [0.28, 0.6], [0.5, 0.52], [0.54, 0.15], [0.3, -0.2], [-0.2, -0.18]], 0.07, 0.02), '#8f8f96', [0, 0, s * 0.27]);
  bk.add(cylZ(0.09, 0.66, 14), STEEL, [0, 0, 0]);
  bk.add(cylZ(0.06, 0.66, 10), STEEL, [0.4, 0.5, 0]);
  const bucket = new THREE.Group();
  bucket.position.set(L2, 0, 0);
  stick.add(bucket);
  bucket.add(mesh(bk, steelMat, true, undefined, { edge: 0.25, dirt: (x, y, z) => Math.min(0.6, Math.max(0, (-y - 0.35) / 0.6)) * Math.min(1, Math.max(0, (y + 1.2) / 0.12)) * (0.5 + 0.9 * hash(x * 13, y * 9, z * 11)) }));

  // ---- the three hydraulic cylinders, a barrel and a rod each, a unit length cylinder standing on y that
  // is moved, turned and stretched in the arm plane every frame. The boom pair is two cylinders in one mesh.
  const cylinderSet = (zs: number[], rb: number, rr: number) => {
    const barrelB: THREE.BufferGeometry[] = [];
    const rodB: THREE.BufferGeometry[] = [];
    for (const z of zs) {
      const a = new THREE.CylinderGeometry(rb, rb, 1, 12);
      a.translate(0, 0.5, z);
      barrelB.push(a.toNonIndexed());
      const b = new THREE.CylinderGeometry(rr, rr, 1, 10);
      b.translate(0, 0.5, z);
      rodB.push(b.toNonIndexed());
    }
    const barrel = new THREE.Mesh(keep(mergeGeometries(barrelB)!), barrelMat);
    const rod = new THREE.Mesh(keep(mergeGeometries(rodB)!), rodMat);
    barrel.castShadow = false;
    rod.castShadow = false;
    armBase.add(barrel, rod);
    return { barrel, rod };
  };
  const cBoom = cylinderSet([-0.36, 0.36], 0.085, 0.052);
  const cStick = cylinderSet([0], 0.08, 0.05);
  const cBucket = cylinderSet([0], 0.07, 0.045);

  // a cylinder from a to b. The barrel is a fixed share of its shortest length, the rod runs on from there.
  const stretch = (c: { barrel: THREE.Mesh; rod: THREE.Mesh }, ax: number, ay: number, bx: number, by: number, bl: number) => {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const rz = Math.atan2(dy, dx) - Math.PI / 2;
    c.barrel.position.set(ax, ay, 0);
    c.barrel.rotation.z = rz;
    c.barrel.scale.set(1, bl, 1);
    const k = bl - 0.08;
    c.rod.position.set(ax + (dx / len) * k, ay + (dy / len) * k, 0);
    c.rod.rotation.z = rz;
    c.rod.scale.set(1, Math.max(0.05, len - k), 1);
  };

  return {
    root,
    bucketPivot: bucket,
    update(p: Pose, rock = 0, clock = 0) {
      root.position.x = p.xm;
      setShoes(p.xm - XM0);
      house.rotation.y = -p.psi;
      // the house idles on its tracks, a slow sway on two axes and a faint engine tremor, a fraction of a
      // degree, its size set by rock, 0 to 1, and its phase by the clock
      const w1 = clock * 0.00264;
      const w2 = clock * 0.00195;
      const w3 = clock * 0.0302;
      house.rotation.x = rock * (0.0042 * Math.sin(w1) + 0.0007 * Math.sin(w3 * 1.3));
      house.rotation.z = rock * (0.0036 * Math.sin(w2 + 1) + 0.001 * Math.sin(w3));
      house.position.y = HOUSE_Y + rock * 0.004 * Math.sin(w3 * 0.9);
      boom.rotation.z = p.boom;
      stick.rotation.z = p.stick - p.boom;
      bucket.rotation.z = p.bucket - p.stick;
      const cb = Math.cos(p.boom);
      const sb = Math.sin(p.boom);
      const cs = Math.cos(p.stick);
      const ss = Math.sin(p.stick);
      const ck = Math.cos(p.bucket);
      const sk = Math.sin(p.bucket);
      // the lift pair, from the base pin on the deck to the lug on the boom's rear face
      stretch(cBoom, -0.7, -0.4, -0.25 * cb - 1.0 * sb, -0.25 * sb + 1.0 * cb, 0.74);
      // the stick cylinder, from the lug on the boom's top to the ear behind the elbow
      stretch(cStick, 1.15 * cb - 2.85 * sb, 1.15 * sb + 2.85 * cb, p.ex - 0.5 * cs - 0.6 * ss, p.ey - 0.5 * ss + 0.6 * cs, 0.78);
      // the bucket cylinder, from the lug on the stick to the ear on the bucket
      stretch(cBucket, p.ex + 0.8 * cs - 0.3 * ss, p.ey + 0.8 * ss + 0.3 * cs, p.wx + 0.4 * ck - 0.5 * sk, p.wy + 0.4 * sk + 0.5 * ck, 0.62);
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      grain.dispose();
      shoes.dispose();
    },
  };
}
