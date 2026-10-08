// The Rendgen story. One warehouse, three trucks, and a single move into ink where the solids
// fade out, the outlines come in, the routes draw on the floor and the safety circles open
// under each truck. Then everything goes back to solid.

import * as THREE from 'three';
import type { BuildCtx, Key, Shot, StoryDef, TruckState } from '../../three/engine';
import { at, clamp01, lerp, makeTimetable, rel, smooth, v } from '../../three/engine';
import { addEdges, setSolidOpacity } from '../../three/edges';
import { buildForklift, buildLoad } from '../../three/forklift';
import { block, material, type Tone } from '../../three/tone';
import { C } from '../../tokens';

export const LAST = 6;

// The story times where each phase of the x-ray starts and ends.
const XRAY_IN: [number, number] = [1.55, 2.2];
const XRAY_OUT: [number, number] = [4.6, 5.05];
const ROUTES: [number, number] = [2.45, 3.0];
const SAFETY_IN: [number, number] = [3.55, 4.05];

// Where the three trucks are right now, for the HTML tags pinned to them.
export const tracks = [v(0, 0, 0), v(0, 0, 0), v(0, 0, 0), v(25.3, 0, -2.6)];

const ramp = (b: number, a: number, z: number) => smooth(clamp01((b - a) / (z - a)));

// 0 in solid chapters, 1 while the building is drawn as lines on ink.
export const xray = (b: number) => ramp(b, XRAY_IN[0], XRAY_IN[1]) * (1 - ramp(b, XRAY_OUT[0], XRAY_OUT[1]));

// A light floor so the solid chapters stay quiet.
const FLOOR_LIGHT: Tone = { top: C.hoverLightGrey, front: C.lightGrey, side: C.lightGrey, back: C.lightGrey };

const INK_COLOUR = new THREE.Color(C.ink);
const LIGHT_COLOUR = new THREE.Color(C.white);

// The main truck's timetable. It drives down the front lane, then turns toward the service bay.
const KEYS: Key[] = [
  { b: 0, x: 6.4, z: -1.2, h: 0, y: 0, lift: 0.1 },
  { b: 1, x: 11, z: -1.2, h: 0, y: 0, lift: 0.1, ease: 'l' },
  { b: 2, x: 14.8, z: -1.2, h: 0, y: 0, lift: 0.1, ease: 'l' },
  { b: 3, x: 18.6, z: -1.2, h: 0, y: 0, lift: 0.1, ease: 'l' },
  { b: 4, x: 21, z: -1.2, h: 0, y: 0, lift: 0.1 },
  { b: 5, x: 24, z: -3.5, h: Math.PI / 2, y: 0, lift: 0.1 },
  { b: 6, x: 24, z: -3.6, h: Math.PI / 2, y: 0, lift: 0.1 },
];

const SHOTS: Shot[] = [
  // 0 intro, low three quarter view of the red truck, riding along with it
  { cam: rel(7.4, 2.4, 9.4), look: rel(0.4, 2.2, 0), fov: 30, hold: 0.4 },
  // 1 pull up to an aerial of the whole floor
  { cam: at(23.5, 38, 26), look: at(23.5, 0, -11.5), fov: 30, hold: 0.35, arc: 4 },
  // 2 x-ray, a little higher and closer
  { cam: at(23, 33, 19), look: at(23, 0, -10), fov: 30, hold: 0.35 },
  // 3 straight down for the routes
  { cam: at(23.5, 45, -4.4), look: at(23.5, 0, -5.4), fov: 30, hold: 0.35 },
  // 4 safety, tilting back toward the aerial, all three circles in frame
  { cam: at(23.5, 40, 16), look: at(23.5, 0, -10.5), fov: 30, hold: 0.35 },
  // 5 back to solid, low and close on the main truck at the service bay
  { cam: rel(4.6, 1.5, 8.2), look: rel(0.2, 1.5, -1.2), fov: 30, hold: 0.4 },
  // 6 the panel covers the lower half, the truck sits in the top half
  { cam: rel(-3.6, 2.7, 12.8), look: rel(0.8, -1.3, -2), fov: 30, hold: 0.4 },
];

// Two more trucks run closed loops, each made of a lane along the aisle, a turn and a lane back.
const LOOP_B: [number, number][] = [
  [7.5, -2.9],
  [13, -2.9],
  [17.4, -2.9],
  [19.4, -4.2],
  [17.4, -5.5],
  [13, -5.5],
  [7.5, -5.5],
  [5.5, -4.2],
];
const LOOP_C: [number, number][] = [
  [29, -3.1],
  [33.4, -3.1],
  [36.6, -3.1],
  [38.2, -1.5],
  [36.6, 0.1],
  [33.4, 0.1],
  [29, 0.1],
  [27.4, -1.5],
];

type Runner = { curve: THREE.CatmullRomCurve3; length: number; speed: number; phase: number; group: THREE.Group; wheels: { g: THREE.Group; r: number }[] };

function loopCurve(pts: [number, number][]) {
  return new THREE.CatmullRomCurve3(
    pts.map(([x, z]) => v(x, 0, z)),
    true,
    'centripetal',
  );
}

// A flat ribbon along a polyline. setDrawRange reveals it from the start.
function ribbon(points: THREE.Vector3[], width: number, mat: THREE.Material) {
  const n = points.length;
  const pos = new Float32Array(n * 6);
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * (width / 2);
    const nz = (dx / len) * (width / 2);
    const p = points[i];
    pos.set([p.x + nx, 0.05, p.z + nz, p.x - nx, 0.05, p.z - nz], i * 6);
    if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 3;
  mesh.frustumCulled = false;
  return { mesh, segments: n - 1 };
}

function strip(root: THREE.Object3D) {
  const lines: THREE.Object3D[] = [];
  root.traverse((o) => {
    if ((o as THREE.LineSegments).isLineSegments) lines.push(o);
  });
  for (const l of lines) l.parent?.remove(l);
}

// A person on foot, plain boxes, so the x-ray has someone to warn.
function walker() {
  const g = new THREE.Group();
  const t: Tone = { top: C.white, front: C.white, side: C.white, back: C.white };
  g.add(block(0.16, 0.82, 0.2, t, 0, 0, -0.1));
  g.add(block(0.16, 0.82, 0.2, t, 0, 0, 0.1));
  g.add(block(0.26, 0.7, 0.5, t, 0, 0.82, 0));
  g.add(block(0.24, 0.24, 0.24, t, 0, 1.56, 0));
  return g;
}

function build({ scene, truck }: BuildCtx) {
  const house = scene.children[0];
  const main = truck;

  // Outlines, once. The floor slab and the truck's warning spot stay solid colour only.
  const wallLines = addEdges(house, C.tonedTextGrey);
  const mainLines = addEdges(main.group, C.tonedRed);
  strip(main.spot);
  const floorSlab = house.children[0];
  strip(floorSlab);

  const runners: Runner[] = [];
  const whiteLines: THREE.LineBasicMaterial[] = [];
  const make = (pts: [number, number][], speed: number, phase: number, withLoad: boolean) => {
    const f = buildForklift();
    if (withLoad) f.carriage.add(buildLoad(1.72, 0.08));
    scene.add(f.group);
    whiteLines.push(addEdges(f.group, C.white));
    strip(f.spot);
    const curve = loopCurve(pts);
    runners.push({ curve, length: curve.getLength(), speed, phase, group: f.group, wheels: f.wheels });
    return f;
  };
  const truckB = make(LOOP_B, 0.09, 0.19, true);
  const truckC = make(LOOP_C, 0.07, 0.05, false);
  const bodies = [main, truckB, truckC];

  // The person standing where the main truck's warning spot lands.
  const person = walker();
  person.position.set(25.3, 0, -2.6);
  person.rotation.y = -0.5;
  scene.add(person);
  const personLines = addEdges(person, C.white);

  // Routes, one per truck. The main truck's is sampled from its timetable.
  const mainAt = makeTimetable(KEYS);
  const mainPts: THREE.Vector3[] = [];
  for (let b = 0.6; b <= 5.05; b += 0.03) {
    const s = mainAt(b);
    mainPts.push(v(s.x, 0, s.z));
  }
  const loopPts = (c: THREE.CatmullRomCurve3) => {
    const pts = c.getSpacedPoints(160);
    pts[pts.length - 1] = pts[0].clone();
    return pts;
  };
  const routeMat = new THREE.MeshBasicMaterial({ color: C.tonedRed, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const haloMat = new THREE.MeshBasicMaterial({ color: C.tonedRed, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
  const routes = [
    { r: ribbon(mainPts, 0.2, routeMat), h: ribbon(mainPts, 0.7, haloMat), lag: 0 },
    { r: ribbon(loopPts(runners[0].curve), 0.2, routeMat), h: ribbon(loopPts(runners[0].curve), 0.7, haloMat), lag: 0.06 },
    { r: ribbon(loopPts(runners[1].curve), 0.2, routeMat), h: ribbon(loopPts(runners[1].curve), 0.7, haloMat), lag: 0.12 },
  ];
  const routeGroup = new THREE.Group();
  for (const k of routes) routeGroup.add(k.h.mesh, k.r.mesh);
  scene.add(routeGroup);

  // Pen heads that ride the end of each route while it draws.
  const penMat = new THREE.MeshBasicMaterial({ color: C.white, transparent: true, depthWrite: false });
  const pens = routes.map(() => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), penMat);
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 4;
    routeGroup.add(m);
    return m;
  });
  const routePoints = [mainPts, loopPts(runners[0].curve), loopPts(runners[1].curve)];

  // Safety circles under each truck, a quiet fill, a ring and one ring that keeps expanding.
  const fillMat = new THREE.MeshBasicMaterial({ color: C.tonedRed, transparent: true, opacity: 0, depthWrite: false });
  const ringMat = new THREE.MeshBasicMaterial({ color: C.tonedRed, transparent: true, opacity: 0, depthWrite: false });
  const waveMat = new THREE.MeshBasicMaterial({ color: C.tonedRed, transparent: true, opacity: 0, depthWrite: false });
  const circles = bodies.map(() => {
    const g = new THREE.Group();
    const fill = new THREE.Mesh(new THREE.CircleGeometry(2.5, 48), fillMat);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.52, 64), ringMat);
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 64), waveMat);
    for (const m of [fill, ring, wave]) {
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = 2;
      g.add(m);
    }
    g.position.y = 0.04;
    scene.add(g);
    return { g, wave };
  });

  // A white studio wall behind the truck for the intro. It sinks into the floor as the camera
  // pulls up, which is what shows the warehouse.
  const cyc = new THREE.Mesh(new THREE.PlaneGeometry(110, 14), new THREE.MeshBasicMaterial({ color: C.white }));
  cyc.position.set(22, 7, -4.3);
  scene.add(cyc);

  const bg = new THREE.Color();

  const put = (r: Runner, b: number) => {
    const s = (b * r.speed + r.phase) % 1;
    const p = r.curve.getPointAt(s);
    const tg = r.curve.getTangentAt(s);
    r.group.position.set(p.x, 0, p.z);
    r.group.rotation.y = Math.atan2(-tg.z, tg.x);
    const odo = (b * r.speed + r.phase) * r.length;
    for (const w of r.wheels) w.g.rotation.z = -odo / w.r;
    return p;
  };

  return (b: number, t: TruckState) => {
    const x = xray(b);
    const drop = ramp(b, 0.45, 1.0);
    cyc.position.y = 7 - 14.5 * drop;
    cyc.visible = drop < 0.99;
    setSolidOpacity(material, 1 - x);
    bg.copy(LIGHT_COLOUR).lerp(INK_COLOUR, x);
    (scene.background as THREE.Color).copy(bg);

    const lines = x * (1 - ramp(b, XRAY_OUT[0], XRAY_OUT[1] - 0.1));
    const setLines = (m: THREE.LineBasicMaterial, o: number) => {
      m.opacity = o;
      m.visible = o > 0.01;
    };
    setLines(wallLines, lines * 0.85);
    setLines(mainLines, lines);
    for (const m of whiteLines) setLines(m, lines);
    setLines(personLines, lines);

    const centres = [put(runners[0], b), put(runners[1], b)];
    // the two extra trucks join as the camera pulls up
    const join = ramp(b, 0.55, 1.0);
    for (const r of runners) {
      r.group.visible = join > 0.01;
      r.group.scale.setScalar(Math.max(0.001, join));
    }

    // the person is only there in the x-ray, behind the racks and out of the driver's sight
    person.visible = x > 0.02;
    person.scale.y = Math.max(0.001, x);

    // routes
    const routeOpacity = ramp(b, ROUTES[0] - 0.1, ROUTES[0] + 0.2) * (1 - ramp(b, XRAY_OUT[0], XRAY_OUT[0] + 0.3));
    routeMat.opacity = routeOpacity;
    haloMat.opacity = 0.16 * routeOpacity;
    penMat.opacity = routeOpacity;
    routeGroup.visible = routeOpacity > 0.01;
    routes.forEach((k, i) => {
      const p = clamp01((ramp(b, ROUTES[0] + k.lag, ROUTES[1] + k.lag)));
      const n = Math.round(p * k.r.segments);
      k.r.mesh.geometry.setDrawRange(0, n * 6);
      k.h.mesh.geometry.setDrawRange(0, n * 6);
      const pts = routePoints[i];
      const head = pts[Math.min(pts.length - 1, n)];
      pens[i].position.set(head.x, 0.06, head.z);
      pens[i].visible = p > 0.01 && p < 0.995;
    });

    // safety circles follow their trucks
    const open = ramp(b, SAFETY_IN[0], SAFETY_IN[1]) * (1 - ramp(b, XRAY_OUT[0], XRAY_OUT[0] + 0.3));
    fillMat.opacity = 0.2 * open;
    ringMat.opacity = 0.95 * open;
    const pulse = (b * 1.4) % 1;
    waveMat.opacity = 0.6 * open * (1 - pulse);
    const pos = [v(t.x, 0, t.z), v(centres[0].x, 0, centres[0].z), v(centres[1].x, 0, centres[1].z)];
    pos.forEach((q, i) => tracks[i].copy(q));
    circles.forEach((c, i) => {
      c.g.visible = open > 0.01;
      c.g.position.x = pos[i].x;
      c.g.position.z = pos[i].z;
      c.g.scale.setScalar(lerp(0.4, 1, open));
      c.wave.scale.setScalar(lerp(1.0, 2.6, pulse));
    });

    // the main truck's spot grows in rather than popping
    main.spot.scale.setScalar(lerp(0.3, 1, ramp(b, 3.5, 3.9)));
  };
}

export const STORY: StoryDef = {
  lastBeat: LAST,
  keys: KEYS,
  shots: SHOTS,
  background: C.white,
  theme: { floor: FLOOR_LIGHT },
  spot: [3.45, 4.95],
  spotColour: C.tonedRed,
  build,
};
