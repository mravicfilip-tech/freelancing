// Direction 1, Nocna smena. The story, the camera and the night props.
// A client's forklift stops dead on the night shift and Ekotehnika gets them running again.
// Beats are chapters, 0 intro, 1 stop, 2 call, 3 swap truck, 4 pick, 5 carry, 6 service, 7 dawn, 8 finale.
// Every shot holds until i + 0.5 and the page rests at i + 0.3, so a rest always shows the settled frame.

import * as THREE from 'three';
import { at, clamp01, makeTimetable, smooth, v, lerp, type Key, type Shot, type StoryDef } from '../../three/engine';
import { buildForklift, buildLoad, type Forklift } from '../../three/forklift';
import { block, mesh, toned, GREY, INK, PALE, RED, STEEL, type Tone } from '../../three/tone';
import { AISLE_Z } from '../../three/warehouse';
import { C } from '../../tokens';

// The last chapter is beat 8, and the story runs 0.3 past it so its rest settles like every other.
export const CH_LAST = 8;
export const LAST = CH_LAST + 0.3;
export const REST = (i: number) => (i === 0 ? 0 : i + 0.3);

// Night dressing for the warehouse. Tokens only, the building drops to ink and text grey.
const NIGHT_FLOOR: Tone = { top: C.ink, front: C.textGrey, side: C.textGrey, back: C.textGrey };
const NIGHT_WALL: Tone = { top: C.tonedTextGrey, front: C.textGrey, side: C.textGrey, back: C.ink };
const NIGHT_DOCK: Tone = { top: C.tonedTextGrey, front: C.textGrey, side: C.ink, back: C.textGrey };
// The same pieces as the base warehouse paints them, for the dawn fade.
const DAY_FLOOR: Tone = { top: C.shadeGrey, front: C.lightGrey, side: C.lightGrey, back: C.lightGrey };
const DAY_WALL: Tone = { top: C.white, front: C.lightGrey, side: C.shadeGrey, back: C.shadeGrey };
const DAY_DOCK: Tone = { top: C.shadeGrey, front: C.lightGrey, side: C.white, back: C.lightGrey };
const NIGHT_APRON: Tone = { top: C.textGrey, front: C.ink, side: C.ink, back: C.ink };
const NIGHT_PLINTH: Tone = { top: C.tonedTextGrey, front: C.textGrey, side: C.ink, back: C.ink };
const NIGHT_PALE: Tone = { top: C.tonedTextGrey, front: C.textGrey, side: C.ink, back: C.ink };
const SIGN_RED: Tone = { top: C.tonedRed, front: C.tonedRed, side: C.tonedRed, back: C.tonedRed };
const WHITE: Tone = { top: C.white, front: C.white, side: C.white, back: C.white };

// Pieces the DOM layer reads each frame to pin tags to the 3D scene.
export const live: {
  red: THREE.Object3D | null;
  broken: THREE.Object3D | null;
  pallet: THREE.Object3D | null;
  van: THREE.Object3D | null;
} = { red: null, broken: null, pallet: null, van: null };

export const dawnAt = (b: number) => smooth(clamp01((b - 6.6) / 0.45));

// Story time to minutes after midnight, 02:14 at the stop to 06:00 at dawn.
const CLOCK: [number, number][] = [
  [0, 134],
  [1, 134],
  [2, 136],
  [3, 160],
  [4, 185],
  [5, 205],
  [6, 255],
  [7, 360],
  [8, 360],
];
export function clockAt(b: number) {
  let k = 0;
  while (k < CLOCK.length - 2 && b >= CLOCK[k + 1][0]) k++;
  const [b0, m0] = CLOCK[k];
  const [b1, m1] = CLOCK[k + 1];
  const m = Math.round(lerp(m0, m1, clamp01((b - b0) / (b1 - b0))));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Where the broken truck stops, and the pallet on its forks. The replacement picks it up from the dock side.
const STOP_X = 29;
const PALLET = v(STOP_X + 1.72, 0.08, AISLE_Z);
const PICK_X = PALLET.x + 1.72;
const LIFT_X = 24;
const LIFT_Z = -6.4;
const TAU = Math.PI * 2;

// The replacement Linde, from the dock to the pallet, away with it, and out again.
const RED_KEYS: Key[] = [
  { b: 0, x: 70, z: AISLE_Z, h: Math.PI, y: 0, lift: 0, ease: 'l' },
  { b: 2.4, x: 70, z: AISLE_Z, h: Math.PI, y: 0, lift: 0, ease: 'l' },
  { b: 3.3, x: 46.5, z: AISLE_Z, h: Math.PI, y: 0, lift: 0, ease: 'l' },
  { b: 3.75, x: 42, z: AISLE_Z, h: Math.PI, y: 0, lift: 0, ease: 'l' },
  { b: 4.1, x: PICK_X, z: AISLE_Z, h: Math.PI, y: 0, lift: 0, ease: 'o' },
  { b: 4.15, x: PICK_X, z: AISLE_Z, h: Math.PI, y: 0, lift: 0, ease: 'l' },
  { b: 4.4, x: PICK_X, z: AISLE_Z, h: Math.PI, y: 0, lift: 0.5, ease: 'l' },
  { b: 4.55, x: PICK_X, z: AISLE_Z, h: Math.PI, y: 0, lift: 0.5, ease: 's' },
  // back out, turn on the spot, and carry the pallet out through the dock
  { b: 4.9, x: 36, z: AISLE_Z, h: Math.PI, y: 0, lift: 0.5, ease: 's' },
  { b: 5.3, x: 36, z: AISLE_Z, h: TAU, y: 0, lift: 0.5, ease: 's' },
  { b: 5.8, x: 45, z: AISLE_Z, h: TAU, y: 0, lift: 0.5, ease: 'o' },
  { b: 5.9, x: 45, z: AISLE_Z, h: TAU, y: 0, lift: 0, ease: 'l' },
  { b: 6.1, x: 45, z: AISLE_Z, h: TAU, y: 0, lift: 0, ease: 's' },
  { b: 6.6, x: 42.6, z: AISLE_Z, h: TAU, y: 0, lift: 0, ease: 'l' },
  { b: LAST, x: 42.6, z: AISLE_Z, h: TAU, y: 0, lift: 0, ease: 'l' },
];

// The stranded truck. It runs in fast, stops dead, waits for the swap and then drives onto the lift.
const BROKEN_KEYS: Key[] = [
  { b: 0, x: 5.5, z: AISLE_Z, h: 0, y: 0, lift: 0, ease: 'i' },
  { b: 1.1, x: STOP_X, z: AISLE_Z, h: 0, y: 0, lift: 0, ease: 'l' },
  { b: 5.3, x: STOP_X, z: AISLE_Z, h: 0, y: 0, lift: 0, ease: 'l' },
  // reverses off the aisle and backs onto the lift
  { b: 5.65, x: 26.8, z: -4.2, h: -0.45, y: 0, lift: 0, ease: 'l' },
  { b: 5.95, x: LIFT_X, z: LIFT_Z, h: 0, y: 0, lift: 0, ease: 'o' },
  { b: LAST, x: LIFT_X, z: LIFT_Z, h: 0, y: 0, lift: 0, ease: 'l' },
];

const shots: Shot[] = [
  // 0 intro, down the night aisle from the showroom end
  { cam: at(-9, 2.7, 0.9), look: at(34, 1.3, -2.8), fov: 36, offset: 0.2, hold: 0.5 },
  // 1 low side view of the stopped truck
  { cam: at(37, 1.3, 9.5), look: at(29.6, 1.5, AISLE_Z), fov: 30, offset: 0.17, hold: 0.5 },
  // 2 straight down over the aisle
  { cam: at(34, 32, -1.3), look: at(34, 0, AISLE_Z), fov: 32, offset: 0.12, hold: 0.5 },
  // 3 outside the dock door looking in
  { cam: at(60, 2.5, 2.2), look: at(40, 1.9, AISLE_Z), fov: 38, offset: 0.13, hold: 0.5 },
  // 4 side view of the pick
  { cam: at(40, 1.7, 8.8), look: at(31.8, 1.3, AISLE_Z), fov: 28, offset: 0.18, hold: 0.5, arc: 4 },
  // 5 top down again for the carry
  { cam: at(36, 34, -1.3), look: at(36, 0, AISLE_Z), fov: 34, offset: 0.12, hold: 0.5 },
  // 6 the service bay from the front
  { cam: at(25, 5.2, 12), look: at(24, 1.8, -6), fov: 30, offset: 0.2, hold: 0.5 },
  // 7 dawn, outside the dock on the empty apron side
  { cam: at(76, 9, 9), look: at(46, 0.8, -1), fov: 34, offset: 0.18, hold: 0.5 },
  // 8 pulled out over the apron
  { cam: at(78, 17, 22), look: at(47, 0, -3), fov: 34, offset: 0.16, hold: 0.5 },
];

const flat = (g: THREE.BufferGeometry, tone: Tone) => Float32Array.from(toned(g.clone(), tone).attributes.color.array);

// A mesh whose vertex colours fade between a night and a day tone.
type Fader = { m: THREE.Mesh; night: Float32Array; day: Float32Array };
function fader(m: THREE.Mesh, night: Tone, day: Tone): Fader {
  return { m, night: flat(m.geometry, night), day: flat(m.geometry, day) };
}
function paint(f: Fader, d: number) {
  const a = f.m.geometry.attributes.color as THREE.BufferAttribute;
  const arr = a.array as Float32Array;
  for (let i = 0; i < arr.length; i++) arr[i] = f.night[i] + (f.day[i] - f.night[i]) * d;
  a.needsUpdate = true;
}

function beacon() {
  const g = new THREE.Group();
  g.add(block(0.08, 1.3, 0.08, INK, 0, 2.2, 0));
  const sign = new THREE.Group();
  const tri = new THREE.Shape();
  tri.moveTo(0, 0.62);
  tri.lineTo(-0.58, -0.4);
  tri.lineTo(0.58, -0.4);
  tri.closePath();
  const rim = new THREE.Shape();
  rim.moveTo(0, 0.82);
  rim.lineTo(-0.78, -0.5);
  rim.lineTo(0.78, -0.5);
  rim.closePath();
  sign.add(mesh(new THREE.ExtrudeGeometry(rim, { depth: 0.05, bevelEnabled: false }), WHITE, 0, 0, -0.025));
  sign.add(mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.06, bevelEnabled: false }), SIGN_RED, 0, 0, -0.03));
  for (const z of [0.045, -0.045]) {
    sign.add(block(0.09, 0.28, 0.01, WHITE, 0, -0.18, z));
    sign.add(block(0.09, 0.09, 0.01, WHITE, 0, -0.3, z));
  }
  // the exclamation bar sits above its dot
  sign.position.set(0, 3.55, 0);
  sign.scale.setScalar(0.8);
  g.add(sign);
  const lamp = block(0.34, 0.3, 0.34, SIGN_RED, 0, 0, 0);
  lamp.position.y = 2.88;
  g.add(lamp);
  const mat = new THREE.MeshBasicMaterial({ color: C.tonedRed, transparent: true, opacity: 0.2, depthWrite: false });
  const lineMat = new THREE.MeshBasicMaterial({ color: C.tonedRed, transparent: true, opacity: 0.9, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40), mat);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.22, 48), lineMat);
  for (const m of [disc, ring]) {
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.03;
    g.add(m);
  }
  return { g, sign, lamp, mats: [mat, lineMat] };
}

function wheel(r: number, x: number, z: number) {
  const w = mesh(new THREE.CylinderGeometry(r, r, 0.26, 18), INK, x, r, z);
  w.rotation.x = Math.PI / 2;
  return w;
}

// A small service van with a red stripe. Faces +x.
function van() {
  const g = new THREE.Group();
  g.add(block(4.2, 0.3, 1.8, INK, 0, 0.3, 0));
  g.add(block(2.9, 1.5, 1.8, PALE, -0.6, 0.6, 0));
  g.add(block(1.3, 1.0, 1.8, PALE, 1.5, 0.6, 0));
  g.add(block(0.9, 0.5, 1.82, STEEL, 1.65, 1.15, 0));
  g.add(block(2.92, 0.22, 1.84, RED, -0.6, 0.95, 0));
  g.add(block(1.3, 0.22, 1.84, RED, 1.5, 0.95, 0));
  for (const x of [-1.2, 1.4]) for (const z of [-0.8, 0.8]) g.add(wheel(0.36, x, z));
  return g;
}

function find(root: THREE.Object3D, test: (o: THREE.Object3D) => boolean) {
  const out: THREE.Object3D[] = [];
  root.traverse((o) => test(o) && out.push(o));
  return out;
}
const near = (a: number, b: number) => Math.abs(a - b) < 0.011;

export const STORY: StoryDef = {
  lastBeat: LAST,
  background: C.ink,
  world: 'warehouse',
  theme: { floor: NIGHT_FLOOR, wall: NIGHT_WALL, dock: NIGHT_DOCK },
  keys: RED_KEYS,
  shots,
  pick: { b: 4.15, at: PALLET, rotY: Math.PI },
  drop: 5.95,
  shutter: [2.2, 2.9],
  build: ({ scene, camera, truck, order }) => {
    try {
    const house = scene.children[0] as THREE.Group;
    live.red = truck.group;
    live.pallet = order;

    // The base service bay already parks a grey truck on a raised lift. Take both out, this story drives its own.
    for (const o of find(house, (o) => near(o.position.x, LIFT_X) && near(o.position.y, 1.04) && near(o.position.z, LIFT_Z))) o.visible = false;
    for (const o of find(house, (o) => (o as THREE.Mesh).isMesh && near(o.position.x, LIFT_X) && near(o.position.y, 0.97) && near(o.position.z, LIFT_Z))) o.visible = false;

    // Dawn faders, the building shell, the loading apron, the showroom plinth and the floor markings.
    const faders: Fader[] = [];
    const shell = [DAY_FLOOR, DAY_WALL, DAY_DOCK, DAY_DOCK, DAY_DOCK];
    const nights = [NIGHT_FLOOR, NIGHT_WALL, NIGHT_DOCK, NIGHT_DOCK, NIGHT_DOCK];
    shell.forEach((day, i) => faders.push(fader(house.children[i] as THREE.Mesh, nights[i], day)));
    const size = new THREE.Vector3();
    const markings: Fader[] = [];
    house.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.geometry.attributes.color || faders.some((f) => f.m === m)) return;
      new THREE.Box3().setFromObject(m).getSize(size);
      if (near(size.x, 6) && near(size.z, 7) && size.y < 0.03) faders.push(fader(m, NIGHT_APRON, PALE));
      else if (near(size.x, 6.4) && near(size.y, 0.2) && near(size.z, 5.2)) faders.push(fader(m, NIGHT_PLINTH, PALE));
      else if (size.y < 0.02 && m.geometry.attributes.color.getX(0) > 0.99 && m.geometry.attributes.color.getY(0) > 0.99) markings.push(fader(m, WHITE, { top: C.textGrey, front: C.textGrey, side: C.textGrey, back: C.textGrey }));
    });
    faders.push(...markings);

    // Lit white loads and panels go dark at night and come back at dawn. The order pallet stays white.
    const hover = new THREE.Color(C.hoverLightGrey);
    house.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.geometry.attributes.color || faders.some((f) => f.m === m)) return;
      const col = m.geometry.attributes.color as THREE.BufferAttribute;
      for (let i = 0; i < col.count; i++) {
        if (Math.abs(col.getX(i) - hover.r) < 0.004 && Math.abs(col.getY(i) - hover.g) < 0.004 && Math.abs(col.getZ(i) - hover.b) < 0.004) {
          faders.push(fader(m, NIGHT_PALE, PALE));
          return;
        }
      }
    });

    // The two showroom trucks stand right under the intro copy, so they stay out of this story.
    for (const child of house.children) {
      if (!(child as THREE.Group).isGroup) continue;
      const box = new THREE.Box3().setFromObject(child);
      if (Math.abs((box.min.x + box.max.x) / 2) < 1.5 && box.max.z < 3) {
        for (const o of child.children) if ((o as THREE.Group).isGroup) o.visible = false;
      }
    }

    // The used trucks bay sits between a side camera and the aisle, so it stays out of this story.
    for (const child of house.children) {
      if (!(child as THREE.Group).isGroup) continue;
      const box = new THREE.Box3().setFromObject(child);
      if ((box.min.z + box.max.z) / 2 > 0.8 && Math.abs((box.min.x + box.max.x) / 2 - 31.5) < 1.5) child.visible = false;
    }

    // The broken truck, a grey Linde with the pallet still on its forks.
    const broken: Forklift = buildForklift({ tone: GREY });
    scene.add(broken.group);
    live.broken = broken.group;
    const brokenAt = makeTimetable(BROKEN_KEYS);
    // Until it stops, the broken truck carries its own pallet. The order pallet takes over at the stop.
    const carried = buildLoad(1.72, 0.08, 0);
    carried.rotation.y = Math.PI;
    broken.carriage.add(carried);

    // The lift platform rides up with the truck.
    const platform = block(3.6, 0.14, 0.9, STEEL, LIFT_X, 0, LIFT_Z);
    scene.add(platform);

    const bc = beacon();
    scene.add(bc.g);

    const serviceVan = van();
    serviceVan.rotation.y = Math.PI;
    scene.add(serviceVan);
    live.van = serviceVan;

    const night = new THREE.Color(C.ink);
    const day = new THREE.Color(C.lightGrey);
    let lastDawn = -1;
    const wp = new THREE.Vector3();

    return (b) => {
      const s = brokenAt(b);
      carried.visible = b < 1.1;
      order.visible = b >= 1.1;
      const g = broken.group;
      const lift = smooth(clamp01((b - 6.0) / 0.3));
      const py = 0.9 * lift;
      platform.position.y = py;
      g.position.set(s.x, s.y + (b > 5.9 ? py + 0.14 : 0), s.z);
      g.rotation.y = s.h;
      for (const w of broken.wheels) w.g.rotation.z = -s.odo / w.r;

      // The warning marker blinks by story time, and always shows at the rests.
      const live3 = b > 1.1 && b < 5.45;
      const on = live3 && (b * 8) % 1 < 0.65;
      bc.g.visible = live3;
      bc.g.position.set(s.x, 0, s.z);
      bc.sign.getWorldPosition(wp);
      bc.sign.rotation.y = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z);
      bc.sign.visible = on;
      bc.lamp.visible = on;
      bc.mats[0].opacity = on ? 0.22 : 0.05;
      bc.mats[1].opacity = on ? 0.95 : 0.25;

      // The service van arrives at first light.
      const vt = smooth(clamp01((b - 6.4) / 0.9));
      serviceVan.visible = b > 6.4;
      serviceVan.position.set(lerp(84, 51, vt), 0, 7.4);

      const d = dawnAt(b);
      if (d !== lastDawn) {
        lastDawn = d;
        for (const f of faders) paint(f, d);
        (scene.background as THREE.Color).copy(night).lerp(day, d);
      }
    };
    } catch (e) { console.error('D1BUILD', e); throw e; }
  },
};
