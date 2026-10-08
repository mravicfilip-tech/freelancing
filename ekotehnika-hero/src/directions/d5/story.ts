// Direction 5, Nacrt. The 3D side of the blueprint story. One pallet's route, drawn on paper first
// and then built for real. Chapters 0 to 5 are white lines on Linde red, chapter 6 turns the
// drawing into the real flat shaded scene, chapter 7 is the finale on that scene.
//
// The solid material is not faded to nothing while the drawing shows. It keeps writing depth with
// colour off, so the lines of hidden edges stay hidden and the drawing reads as a clean hidden line
// plan. setSolidOpacity takes over for the materialise.

import * as THREE from 'three';
import { AISLE_Z, DOCK_X, PICK } from '../../three/warehouse';
import { addEdges, setSolidOpacity } from '../../three/edges';
import { material } from '../../three/tone';
import { C } from '../../tokens';
import { at, clamp01, rel, smooth, v, type BuildCtx, type Key, type Shot, type StoryDef, type TruckState } from '../../three/engine';

export const LAST = 7;
const R = Math.PI / 2;

// Story times the look changes at. Lines and bg fade over [LOOK0, LOOK1].
export const LOOK0 = 5.3;
export const LOOK1 = 6.0;

const A_POINT = v(2.2, 0, AISLE_Z);
const C_POINT = v(DOCK_X - 0.7, 0, AISLE_Z);

// The truck. Waits at the showroom, drives to the pick rack, lifts the order, backs out and
// drives the aisle to the dock, sets the order down and backs off.
const keys: Key[] = [
  { b: 0, x: -1.5, z: -2, h: 0, y: 0, lift: 0 },
  { b: 1.2, x: -1.5, z: -2, h: 0, y: 0, lift: 0, ease: 'i' },
  { b: 1.6, x: 7, z: -2, h: 0, y: 0, lift: 0, ease: 'o' },
  { b: 1.95, x: 10, z: -5.4, h: R, y: 0, lift: 0, ease: 'l' },
  { b: 2.35, x: 10, z: -5.4, h: R, y: 0, lift: 2.8, ease: 'l' },
  { b: 2.5, x: 10, z: -6.18, h: R, y: 0, lift: 2.8, ease: 'l' },
  { b: 2.72, x: 10, z: -6.18, h: R, y: 0, lift: 3.0 },
  { b: 3.0, x: 10, z: -4.0, h: R, y: 0, lift: 3.0, ease: 'l' },
  { b: 3.15, x: 10, z: -3.1, h: R, y: 0, lift: 0.4 },
  { b: 3.3, x: 13.5, z: -2, h: 0, y: 0, lift: 0.4, ease: 'l' },
  { b: 5.45, x: 36.8, z: -2, h: 0, y: 0, lift: 0.4, ease: 'o' },
  { b: 5.85, x: 38.4, z: -2, h: 0, y: 0, lift: 0.4 },
  { b: 5.97, x: 38.4, z: -2, h: 0, y: 0, lift: 0, ease: 'l' },
  { b: 6.1, x: 38.4, z: -2, h: 0, y: 0, lift: 0 },
  { b: 6.7, x: 33.5, z: -2, h: 0, y: 0, lift: 0 },
  { b: 7, x: 33.5, z: -2, h: 0, y: 0, lift: 0 },
];

// Straight down needs a hair of z so the camera keeps the back wall at the top of the frame.
const down = (x: number, z: number, h: number) => ({ cam: at(x, h, z + 0.02), look: at(x, 0, z) });

const shots: Shot[] = [
  // 0 intro plan, the whole floor in the lower part, headline above
  { ...down(18, -5.6, 96), fov: 22, hold: 0.4 },
  // 1 the route plan, a touch closer
  { ...down(19, -5.4, 88), fov: 22, hold: 0.3, arc: 4 },
  // 2 elevation from the east, far away and narrow so it reads as a section drawing
  { cam: at(90, 2.0, -6.4), look: at(10, 2.0, -6.4), fov: 7.2, offset: 0.16, hold: 0.7 },
  // 3 plan again, riding with the truck
  { cam: rel(5, 30, 0.02), look: rel(5, 0, 0), fov: 30, offset: 0.2, hold: 0.3, arc: 6 },
  // 4 plan of the service and approved zones
  { ...down(29, -1.6, 52), fov: 24, offset: 0.08, hold: 0.3 },
  // 5 the tilt, three quarter perspective of the lines
  { cam: at(20, 17, 22), look: at(28, 0.5, -3), fov: 30, hold: 0.25 },
  // 6 materialise, seen from outside the dock
  { cam: at(57, 8.5, 10), look: at(41, 2.2, -2.2), fov: 27, offset: 0.16, hold: 0.3 },
  // 7 finale on the real scene
  { cam: at(-7, 3.1, -1.2), look: at(41, 2.0, -2.4), fov: 38, offset: 0.18, hold: 0.3 },
];

// The route as a polyline in two legs. Showroom to the rack, then the rack to the dock.
const legA: [number, number][] = [
  [2.2, AISLE_Z],
  [7.6, AISLE_Z],
  [10, -4.4],
  [10, -7.0],
];
const legB: [number, number][] = [
  [10, -4.4],
  [12.4, AISLE_Z],
  [DOCK_X - 0.8, AISLE_Z],
];

function sample(legs: [number, number][][], step: number) {
  const out: { x: number; z: number; a: number }[] = [];
  for (const leg of legs) {
    let walked = 0;
    let next = 0;
    for (let i = 0; i < leg.length - 1; i++) {
      const [x0, z0] = leg[i];
      const [x1, z1] = leg[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      const a = Math.atan2(-(z1 - z0), x1 - x0);
      while (next < walked + len) {
        const t = (next - walked) / len;
        out.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, a });
        next += step;
      }
      walked += len;
    }
  }
  return out;
}

// Zone rectangles on the floor, x0 x1 z0 z1.
export const ZONES = {
  servis: [20.2, 27.8, -9.0, -4.0],
  polovni: [27.7, 35.3, 1.2, 5.7],
} as const;

function zoneLines(r: readonly [number, number, number, number], gap = 0.9) {
  const [x0, x1, z0, z1] = r;
  const pts: number[] = [];
  const w = x1 - x0;
  const d = z1 - z0;
  for (let k = gap; k < w + d; k += gap) {
    // a diagonal x + z' = k clipped to the rectangle
    const ax = Math.min(k, w);
    const az = k - ax;
    const bz = Math.min(k, d);
    const bx = k - bz;
    pts.push(x0 + ax, 0.02, z0 + az, x0 + bx, 0.02, z0 + bz);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

function outline(r: readonly [number, number, number, number], y = 0.03) {
  const [x0, x1, z0, z1] = r;
  const geo = new THREE.BufferGeometry().setFromPoints([v(x0, y, z0), v(x1, y, z0), v(x1, y, z1), v(x0, y, z1)]);
  return geo;
}

// Exposed so the DOM layer can fade with the same numbers.
export const mix = {
  paper: (b: number) => smooth(clamp01((b - LOOK0) / (LOOK1 - LOOK0))),
};

export function resetSolid() {
  material.colorWrite = true;
  material.polygonOffset = false;
  material.polygonOffsetFactor = 0;
  material.polygonOffsetUnits = 0;
  setSolidOpacity(material, 1);
  material.depthWrite = true;
}

function build({ scene, truck, order }: BuildCtx) {
  const white = C.white;
  const lineMats: THREE.LineBasicMaterial[] = [];
  const mk = (opacity = 1) => {
    const m = new THREE.LineBasicMaterial({ color: white, transparent: true, opacity });
    lineMats.push(m);
    return m;
  };

  // Hidden line mode for the solids. Colour off, depth on, pushed back so edges win the depth test.
  material.polygonOffset = true;
  material.polygonOffsetFactor = 2;
  material.polygonOffsetUnits = 2;

  const house = scene.children[0] as THREE.Group;
  house.updateMatrixWorld(true);
  const floor = house.children[0];
  const near = mk();
  const far = mk();
  const farMeshes: THREE.Mesh[] = [];
  const wp = new THREE.Vector3();
  house.children.forEach((child, ci) => {
    if (ci === 0) return; // the floor slab
    child.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.getWorldPosition(wp);
      // Floor markings join the far group, seen edge on in the section they only make noise.
      m.geometry.computeBoundingBox();
      const flat = m.geometry.boundingBox!.max.y - m.geometry.boundingBox!.min.y < 0.05;
      const isFar = wp.x > 12.9 || wp.x < 5.8 || flat;
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 20), isFar ? far : near);
      lines.renderOrder = 1;
      m.add(lines);
      if (isFar) farMeshes.push(m);
    });
  });

  // The truck and the order get their own outlines through the shared helper.
  const own: THREE.LineBasicMaterial[] = [];
  for (const g of Object.values(truck.parts)) own.push(addEdges(g, white));
  own.push(addEdges(order, white));
  lineMats.push(...own);

  // Drawing paper grid under everything.
  const gp: number[] = [];
  for (let x = -10; x <= 46; x += 2) gp.push(x, 0.004, -12, x, 0.004, 10);
  for (let z = -12; z <= 10; z += 2) gp.push(-10, 0.004, z, 46, 0.004, z);
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  const gridMat = new THREE.LineBasicMaterial({ color: white, transparent: true, opacity: 0.14 });
  scene.add(new THREE.LineSegments(gridGeo, gridMat));

  // Building footprint, drawn as a double line like a wall in plan.
  const foot = new THREE.Group();
  const footMat = new THREE.LineBasicMaterial({ color: white, transparent: true, opacity: 1 });
  for (const e of [0, 0.12]) {
    const r: [number, number, number, number] = [-7 + e, DOCK_X + 0.15 - e, -9.3 + e, 7.2 - e];
    foot.add(new THREE.LineLoop(outline(r, 0.01), footMat));
  }
  scene.add(foot);

  // The route, a row of flat dashes that appear one after another.
  const spots = sample([legA, legB], 1.15);
  const dashGeo = new THREE.PlaneGeometry(0.78, 0.26);
  dashGeo.rotateX(-Math.PI / 2);
  const dashMat = new THREE.MeshBasicMaterial({ color: white, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const dashes = new THREE.InstancedMesh(dashGeo, dashMat, spots.length);
  const mtx = new THREE.Matrix4();
  const rot = new THREE.Quaternion();
  spots.forEach((s, i) => {
    rot.setFromAxisAngle(v(0, 1, 0), s.a);
    mtx.compose(v(s.x, 0.05, s.z), rot, v(1, 1, 1));
    dashes.setMatrixAt(i, mtx);
  });
  dashes.count = 0;
  dashes.frustumCulled = false;
  dashes.renderOrder = 2;
  scene.add(dashes);

  // Zone outlines and hatching for Servis and Polovni.
  const zoneMat = new THREE.LineDashedMaterial({ color: white, transparent: true, opacity: 0, dashSize: 0.7, gapSize: 0.4 });
  const hatchMat = new THREE.LineBasicMaterial({ color: white, transparent: true, opacity: 0 });
  for (const r of Object.values(ZONES)) {
    const loop = new THREE.LineLoop(outline(r), zoneMat);
    loop.computeLineDistances();
    scene.add(loop);
    scene.add(new THREE.LineSegments(zoneLines(r), hatchMat));
  }

  // Ground line and hatching for the section.
  const gl: number[] = [];
  for (const y of [0, -0.05]) gl.push(10, y, -14, 10, y, 2);
  for (let z = -14; z < 2; z += 0.45) gl.push(10, -0.05, z + 0.4, 10, -0.5, z);
  const groundGeo = new THREE.BufferGeometry();
  groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3));
  const groundMat = new THREE.LineBasicMaterial({ color: white, transparent: true, opacity: 0 });
  scene.add(new THREE.LineSegments(groundGeo, groundMat));

  // The cut line of the section, seen on the plan before the camera swings round to it.
  const cutMat = new THREE.LineDashedMaterial({ color: white, transparent: true, opacity: 0, dashSize: 1.5, gapSize: 0.4 });
  const cut = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(PICK.x, 0.03, -10.0), v(PICK.x, 0.03, 4.4)]), cutMat);
  cut.computeLineDistances();
  scene.add(cut);

  // Axis triad for the tilt.
  const axMat = new THREE.LineBasicMaterial({ color: white, transparent: true, opacity: 0 });
  const ax = new THREE.BufferGeometry().setFromPoints([
    v(21, 0.02, 4.5), v(26, 0.02, 4.5),
    v(21, 0.02, 4.5), v(21, 4.5, 4.5),
    v(21, 0.02, 4.5), v(21, 0.02, -0.5),
  ]);
  scene.add(new THREE.LineSegments(ax, axMat));

  const bgRed = new THREE.Color(C.lindeRed);
  const bgPaper = new THREE.Color(C.hoverLightGrey);
  const bg = new THREE.Color();

  return (b: number, t: TruckState) => {
    void t;
    const paper = mix.paper(b);

    // Solids. Depth only while the drawing shows, then they fade in over the lines.
    const solid = smooth(clamp01((b - (LOOK0 + 0.1)) / (LOOK1 - LOOK0 - 0.1)));
    if (solid <= 0.001) {
      material.colorWrite = false;
      setSolidOpacity(material, 1);
    } else {
      material.colorWrite = true;
      setSolidOpacity(material, solid);
    }
    // The floor slab only joins in once the solids do, it would hide low parts of a section.
    floor.visible = solid > 0.001;
    scene.background = bg.copy(bgRed).lerp(bgPaper, paper);

    const lo = 1 - smooth(clamp01((b - (LOOK0 + 0.05)) / 0.5));
    // The section drawing hides everything off the pick rack.
    const sec = smooth(clamp01((b - 1.4) / 0.3)) * (1 - smooth(clamp01((b - 2.75) / 0.3)));
    const farO = lo * (1 - sec);
    for (const m of lineMats) m.opacity = lo;
    far.opacity = farO;
    for (const m of farMeshes) m.visible = farO > 0.03 || sec < 0.5;
    near.opacity = lo;
    gridMat.opacity = 0.14 * lo * (1 - sec);
    footMat.opacity = lo * (1 - sec);
    dashMat.opacity = lo * (1 - sec);
    foot.visible = footMat.opacity > 0.01;
    groundMat.opacity = lo * sec;
    cutMat.opacity = smooth(clamp01((b - 0.85) / 0.3)) * (1 - smooth(clamp01((b - 1.5) / 0.25))) * lo;

    // The route draws itself over the first chapter.
    const draw = smooth(clamp01((b - 0.35) / 0.7));
    dashes.count = Math.round(spots.length * draw);

    const zoneO = smooth(clamp01((b - 3.4) / 0.5)) * (1 - smooth(clamp01((b - 4.75) / 0.4)));
    zoneMat.opacity = zoneO;
    hatchMat.opacity = zoneO * 0.45;

    axMat.opacity = smooth(clamp01((b - 4.6) / 0.4)) * lo;
  };
}

export const STORY: StoryDef = {
  lastBeat: LAST,
  keys,
  shots,
  background: C.lindeRed,
  truckTone: undefined,
  pick: { b: 2.52, at: PICK, rotY: R },
  drop: 6.02,
  spot: [3.4, 5.3],
  spotColour: C.white,
  shutter: [5.1, 5.85],
  build,
};

export { A_POINT, C_POINT };
