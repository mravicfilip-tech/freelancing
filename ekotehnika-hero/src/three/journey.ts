// The delivery story. One order pallet waits on a rack. A new Linde truck rolls off the showroom
// plinth, picks the order from the second beam, carries it down the safety aisle past the service
// bay and the approved used trucks, and sets it down at the dock door. Then the camera pulls up
// over the whole warehouse.
//
// Story time b runs 0 to LAST_BEAT. Whole numbers are chapters. In each chapter the camera holds
// for a moment, then moves to the next chapter's viewpoint. The truck keeps its own timetable on
// the same clock, so it drives through the camera moves rather than waiting for them.

import * as THREE from 'three';
import { buildForklift, buildLoad, type Forklift } from './forklift';
import { buildWarehouse, PICK } from './warehouse';
import { block, RED, type Tone } from './tone';
import { C } from '../tokens';

export const LAST_BEAT = 8;

type TruckState = { x: number; z: number; h: number; y: number; lift: number };
type Ease = 's' | 'l' | 'i' | 'o';
type Key = TruckState & { b: number; ease?: Ease };

const HALF_PI = Math.PI / 2;
const PICK_B = 3.6;
const DROP_B = 7.35;

// The truck's timetable. ease shapes the segment that starts at that key.
const KEYS: Key[] = [
  { b: 0, x: 0, z: 0, h: 0, y: 0.2, lift: 0.1 },
  { b: 1.3, x: 0, z: 0, h: 0, y: 0.2, lift: 0.1 },
  { b: 1.9, x: 4, z: -0.5, h: 0.25, y: 0, lift: 0.1 },
  { b: 2.4, x: 8, z: -2, h: 0.9, y: 0, lift: 0.1 },
  { b: 2.75, x: PICK.x, z: -3.6, h: HALF_PI, y: 0, lift: 0.1 },
  { b: 3.05, x: PICK.x, z: -4.6, h: HALF_PI, y: 0, lift: 2.75 },
  { b: 3.4, x: PICK.x, z: PICK.z + 1.72, h: HALF_PI, y: 0, lift: 2.75 },
  { b: PICK_B, x: PICK.x, z: PICK.z + 1.72, h: HALF_PI, y: 0, lift: 2.84 },
  { b: 3.75, x: PICK.x, z: PICK.z + 1.72, h: HALF_PI, y: 0, lift: 3.0 },
  { b: 3.9, x: PICK.x, z: -4.3, h: HALF_PI, y: 0, lift: 3.0 },
  { b: 4.0, x: PICK.x, z: -3.6, h: HALF_PI, y: 0, lift: 0.35 },
  { b: 4.12, x: 11.2, z: -2.3, h: 0.5, y: 0, lift: 0.35, ease: 'i' },
  { b: 4.3, x: 13, z: -2, h: 0, y: 0, lift: 0.35, ease: 'l' },
  { b: 5.6, x: 22, z: -2, h: 0, y: 0, lift: 0.35, ease: 'l' },
  { b: 6.6, x: 31, z: -2, h: 0, y: 0, lift: 0.35, ease: 'o' },
  { b: 7.05, x: 37, z: -2, h: 0, y: 0, lift: 0.35 },
  { b: 7.2, x: 38.2, z: -2, h: 0, y: 0, lift: 0.35 },
  { b: DROP_B, x: 38.2, z: -2, h: 0, y: 0, lift: 0 },
  { b: 7.6, x: 36.4, z: -2, h: 0, y: 0, lift: 0.1 },
  { b: LAST_BEAT, x: 36.4, z: -2, h: 0, y: 0, lift: 0.1 },
];

// Camera chapters. A chapter is either fixed in the world or rides along with the truck.
// offset slides the subject sideways in frame, positive to the right, so the copy has room.
type Shot = {
  cam: (t: TruckState) => THREE.Vector3;
  look: (t: TruckState) => THREE.Vector3;
  fov: number;
  offset: number;
  hold: number;
  arc: number;
};

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const at = (x: number, y: number, z: number) => () => v(x, y, z);
const rel = (x: number, y: number, z: number) => (t: TruckState) => v(t.x + x, y, t.z + z);

export const SHOTS: Shot[] = [
  // 0 intro, low and close on the new truck on its plinth
  { cam: at(8.8, 2.3, 10.4), look: at(0.4, 1.0, -0.3), fov: 30, offset: 0.24, hold: 0.35, arc: 1.5 },
  // 1 Novi, swung round to the other side and up, the showroom behind
  { cam: at(-9.4, 4.4, 8.6), look: at(0.2, 0.9, -1.2), fov: 32, offset: -0.24, hold: 0.35, arc: 2 },
  // 2 the order, riding behind and above as the truck heads for the rack
  { cam: rel(-7.5, 4.4, 6.5), look: rel(3, 0.8, -2), fov: 38, offset: -0.2, hold: 0.3, arc: 1 },
  // 3 the pick, from the floor looking up at the second beam
  { cam: at(17.6, 0.9, 2.4), look: at(PICK.x, 2.4, -7), fov: 40, offset: 0.2, hold: 0.4, arc: 2.5 },
  // 4 safety, straight down on the truck and the spot it projects ahead
  { cam: rel(0.8, 17, 3.4), look: rel(2.4, 0, 0), fov: 38, offset: -0.2, hold: 0.35, arc: 0 },
  // 5 Servis, low across the aisle into the service bay
  { cam: at(18.4, 1.8, 5.6), look: at(24, 1.6, -6.2), fov: 38, offset: -0.16, hold: 0.35, arc: 1.5 },
  // 6 Polovni, from behind the racks out over the approved bay
  { cam: at(26.8, 4.4, -7.6), look: at(31.5, 0.8, 3), fov: 40, offset: 0.16, hold: 0.35, arc: 2 },
  // 7 Najam and delivery, from outside the dock looking in through the door
  { cam: at(48, 2.6, -8.5), look: at(39, 1.3, -2), fov: 36, offset: 0.26, hold: 0.55, arc: 6 },
  // 8 the whole warehouse from above
  { cam: at(15, 40, 33), look: at(19, 0, -2), fov: 36, offset: 0.2, hold: 0, arc: 0 },
];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (e: Ease | undefined, t: number) => (e === 'l' ? t : e === 'i' ? t * t : e === 'o' ? 1 - (1 - t) * (1 - t) : smooth(t));

function segment(b: number) {
  let k = 0;
  while (k < KEYS.length - 2 && b >= KEYS[k + 1].b) k++;
  const a = KEYS[k];
  const c = KEYS[k + 1];
  const t = ease(a.ease, clamp01((b - a.b) / (c.b - a.b || 1)));
  return { k, a, c, t };
}

// Signed distance along each segment, forward or reversing, for turning the wheels.
const ODO: number[] = [0];
for (let k = 0; k < KEYS.length - 1; k++) {
  const a = KEYS[k];
  const c = KEYS[k + 1];
  const dx = c.x - a.x;
  const dz = c.z - a.z;
  const fwd = dx * Math.cos(a.h) - dz * Math.sin(a.h);
  ODO.push(ODO[k] + Math.sign(fwd || 1) * Math.hypot(dx, dz));
}

export function truckAt(b: number): TruckState & { odo: number } {
  const { k, a, c, t } = segment(b);
  return {
    x: lerp(a.x, c.x, t),
    z: lerp(a.z, c.z, t),
    h: lerp(a.h, c.h, t),
    y: lerp(a.y, c.y, t),
    lift: lerp(a.lift, c.lift, t),
    odo: lerp(ODO[k], ODO[k + 1], t),
  };
}

const WHITE: Tone = { top: C.white, front: C.white, side: C.white, back: C.white };

function buildOrder() {
  const g = buildLoad();
  // the delivered badge, a red square with a white tick on the box lid
  const badge = new THREE.Group();
  badge.add(block(0.46, 0.02, 0.46, RED, 0, 0.9, 0));
  const tick = new THREE.Group();
  const l1 = block(0.07, 0.02, 0.2, WHITE, -0.07, 0.915, 0.03);
  l1.rotation.y = 0.8;
  const l2 = block(0.07, 0.02, 0.32, WHITE, 0.06, 0.915, -0.02);
  l2.rotation.y = -0.7;
  tick.add(l1, l2);
  badge.add(tick);
  badge.visible = false;
  g.add(badge);
  return { group: g, badge };
}

export class Journey {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
  private truck: Forklift;
  private shutter: THREE.Group;
  private order: ReturnType<typeof buildOrder>;
  private dropPos = new THREE.Vector3();
  private dropRot = new THREE.Quaternion();
  private w = 1;
  private h = 1;
  private b = 0;
  private tmp = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene.background = new THREE.Color(C.hoverLightGrey);
    const house = buildWarehouse();
    this.shutter = house.shutter;
    this.scene.add(house.group);
    this.truck = buildForklift({ load: false });
    this.scene.add(this.truck.group);
    this.order = buildOrder();
    this.scene.add(this.order.group);

    // Where the order lands, read off the truck's own pose at the moment it lets go.
    this.poseTruck(DROP_B);
    this.truck.group.updateMatrixWorld(true);
    this.truck.anchor.getWorldPosition(this.dropPos);
    this.truck.anchor.getWorldQuaternion(this.dropRot);
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.setStory(this.b);
  }

  private poseTruck(b: number) {
    const s = truckAt(b);
    const t = this.truck;
    t.group.position.set(s.x, s.y, s.z);
    t.group.rotation.y = s.h;
    for (const w of t.wheels) w.g.rotation.z = -s.odo / w.r;
    t.carriage.position.y = s.lift;
    t.inner.position.y = s.lift / 2;
    t.spot.visible = b > 4.15 && b < 7.15;
    return s;
  }

  setStory(b: number) {
    this.b = Math.min(LAST_BEAT, Math.max(0, b));
    b = this.b;
    const s = this.poseTruck(b);

    // The order, on the rack, on the forks, then on the dock floor.
    const o = this.order.group;
    if (b < PICK_B) {
      o.position.copy(PICK);
      o.rotation.set(0, HALF_PI, 0);
    } else if (b < DROP_B) {
      this.truck.group.updateMatrixWorld(true);
      this.truck.anchor.getWorldPosition(o.position);
      this.truck.anchor.getWorldQuaternion(o.quaternion);
    } else {
      o.position.copy(this.dropPos);
      o.quaternion.copy(this.dropRot);
    }
    this.order.badge.visible = b > DROP_B + 0.15;

    // The dock shutter rolls up as the truck comes down the aisle.
    this.shutter.position.y = 3.9 * smooth(clamp01((b - 6.4) / 0.5));

    // Camera, holding on chapter i, then moving to chapter i + 1.
    const i = Math.min(SHOTS.length - 2, Math.floor(b));
    const f = b - i;
    const A = SHOTS[i];
    const B = SHOTS[i + 1];
    const u = smooth(clamp01((f - A.hold) / (1 - A.hold)));
    this.camera.position.lerpVectors(A.cam(s), B.cam(s), u);
    this.camera.position.y += Math.sin(Math.PI * u) * A.arc;
    this.tmp.lerpVectors(A.look(s), B.look(s), u);
    this.camera.fov = lerp(A.fov, B.fov, u);
    this.camera.setViewOffset(this.w, this.h, -lerp(A.offset, B.offset, u) * this.w, 0, this.w, this.h);
    this.camera.lookAt(this.tmp);
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
