// A scroll story engine shared by every direction. A direction hands it a StoryDef, a truck
// timetable, camera shots and optional extra props, and calls setStory(b) as the scroll moves.
// Story time b runs 0 to lastBeat. Whole numbers are chapters.
//
// The engine owns the renderer, the warehouse (unless world is 'none'), the main truck, the
// order pallet's pick and drop, and the camera. Anything else a direction wants, extra trucks,
// labels pinned to 3D points, wireframe overlays, exploded parts, goes in build(), which gets
// the scene and returns a per frame update.

import * as THREE from 'three';
import { buildForklift, buildLoad, type Forklift } from './forklift';
import { buildWarehouse, type WarehouseTheme } from './warehouse';
import { block, RED, type Tone } from './tone';
import { C } from '../tokens';

export type TruckState = { x: number; z: number; h: number; y: number; lift: number };
export type Ease = 's' | 'l' | 'i' | 'o';
// One stop in the truck's timetable. h is the heading, 0 faces +x, PI/2 faces -z.
// ease shapes the segment that starts at this key, smooth by default.
export type Key = TruckState & { b: number; ease?: Ease };

// A camera chapter. cam and look get the truck's current state, so a shot can ride along.
// offset slides the subject sideways in frame, positive to the right, to leave room for copy.
// hold is the share of the chapter the camera stays put before moving on. arc lifts the camera
// in the middle of the move to the next shot.
export type Shot = {
  cam: (t: TruckState) => THREE.Vector3;
  look: (t: TruckState) => THREE.Vector3;
  fov: number;
  offset?: number;
  hold?: number;
  arc?: number;
  roll?: number;
};

export type BuildCtx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  truck: Forklift;
  order: THREE.Group;
};

export type StoryDef = {
  lastBeat: number;
  keys: Key[];
  shots: Shot[];
  background: string;
  world?: 'warehouse' | 'none';
  theme?: Partial<WarehouseTheme>;
  truckTone?: Tone;
  // the order pallet waits at pick.at until pick.b, rides the forks, and stays where it was let go at drop
  pick?: { b: number; at: THREE.Vector3; rotY: number };
  drop?: number;
  // b range where the truck's floor spot shows
  spot?: [number, number];
  spotColour?: string;
  // b range over which the dock shutter rolls up
  shutter?: [number, number];
  build?: (ctx: BuildCtx) => ((b: number, t: TruckState) => void) | void;
};

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const at = (x: number, y: number, z: number) => () => v(x, y, z);
export const rel = (x: number, y: number, z: number) => (t: TruckState) => v(t.x + x, y, t.z + z);

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeBy = (e: Ease | undefined, t: number) =>
  e === 'l' ? t : e === 'i' ? t * t : e === 'o' ? 1 - (1 - t) * (1 - t) : smooth(t);

export function makeTimetable(keys: Key[]) {
  const odo: number[] = [0];
  for (let k = 0; k < keys.length - 1; k++) {
    const a = keys[k];
    const c = keys[k + 1];
    const dx = c.x - a.x;
    const dz = c.z - a.z;
    const fwd = dx * Math.cos(a.h) - dz * Math.sin(a.h);
    odo.push(odo[k] + Math.sign(fwd || 1) * Math.hypot(dx, dz));
  }
  return (b: number): TruckState & { odo: number } => {
    let k = 0;
    while (k < keys.length - 2 && b >= keys[k + 1].b) k++;
    const a = keys[k];
    const c = keys[k + 1] ?? a;
    const t = easeBy(a.ease, clamp01((b - a.b) / (c.b - a.b || 1)));
    return {
      x: lerp(a.x, c.x, t),
      z: lerp(a.z, c.z, t),
      h: lerp(a.h, c.h, t),
      y: lerp(a.y, c.y, t),
      lift: lerp(a.lift, c.lift, t),
      odo: lerp(odo[k], odo[k + 1] ?? odo[k], t),
    };
  };
}

const WHITE: Tone = { top: C.white, front: C.white, side: C.white, back: C.white };

function buildOrder() {
  const g = buildLoad();
  const badge = new THREE.Group();
  badge.add(block(0.46, 0.02, 0.46, RED, 0, 0.9, 0));
  const l1 = block(0.07, 0.02, 0.2, WHITE, -0.07, 0.915, 0.03);
  l1.rotation.y = 0.8;
  const l2 = block(0.07, 0.02, 0.32, WHITE, 0.06, 0.915, -0.02);
  l2.rotation.y = -0.7;
  badge.add(l1, l2);
  badge.visible = false;
  g.add(badge);
  return { group: g, badge };
}

export class StoryEngine {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 600);
  readonly truck: Forklift;
  private renderer: THREE.WebGLRenderer;
  private story: StoryDef;
  private truckAt: ReturnType<typeof makeTimetable>;
  private order: ReturnType<typeof buildOrder>;
  private shutter: THREE.Group | null = null;
  private update: ((b: number, t: TruckState) => void) | void;
  private dropPos = new THREE.Vector3();
  private dropRot = new THREE.Quaternion();
  private look = new THREE.Vector3();
  private w = 1;
  private h = 1;
  private b = 0;

  constructor(canvas: HTMLCanvasElement, story: StoryDef) {
    this.story = story;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene.background = new THREE.Color(story.background);
    if (story.world !== 'none') {
      const house = buildWarehouse(story.theme);
      this.shutter = house.shutter;
      this.scene.add(house.group);
    }
    this.truck = buildForklift({ tone: story.truckTone, spotColour: story.spotColour });
    this.scene.add(this.truck.group);
    this.order = buildOrder();
    this.order.group.visible = Boolean(story.pick);
    this.scene.add(this.order.group);
    this.truckAt = makeTimetable(story.keys);

    if (story.drop !== undefined) {
      this.poseTruck(story.drop);
      this.truck.group.updateMatrixWorld(true);
      this.truck.anchor.getWorldPosition(this.dropPos);
      this.truck.anchor.getWorldQuaternion(this.dropRot);
    }
    this.update = story.build?.({ scene: this.scene, camera: this.camera, truck: this.truck, order: this.order.group });
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.setStory(this.b);
  }

  // Screen position in CSS pixels of a world point, for HTML labels pinned to the scene.
  project(p: THREE.Vector3) {
    const q = p.clone().project(this.camera);
    return { x: ((q.x + 1) / 2) * this.w, y: ((1 - q.y) / 2) * this.h, visible: q.z > -1 && q.z < 1 };
  }

  private poseTruck(b: number) {
    const s = this.truckAt(b);
    const t = this.truck;
    t.group.position.set(s.x, s.y, s.z);
    t.group.rotation.y = s.h;
    for (const w of t.wheels) w.g.rotation.z = -s.odo / w.r;
    t.carriage.position.y = s.lift;
    t.inner.position.y = s.lift / 2;
    const sp = this.story.spot;
    t.spot.visible = Boolean(sp && b > sp[0] && b < sp[1]);
    return s;
  }

  setStory(b: number) {
    const story = this.story;
    this.b = Math.min(story.lastBeat, Math.max(0, b));
    b = this.b;
    const s = this.poseTruck(b);

    const pick = story.pick;
    if (pick) {
      const o = this.order.group;
      if (b < pick.b) {
        o.position.copy(pick.at);
        o.rotation.set(0, pick.rotY, 0);
      } else if (story.drop === undefined || b < story.drop) {
        this.truck.group.updateMatrixWorld(true);
        this.truck.anchor.getWorldPosition(o.position);
        this.truck.anchor.getWorldQuaternion(o.quaternion);
      } else {
        o.position.copy(this.dropPos);
        o.quaternion.copy(this.dropRot);
      }
      this.order.badge.visible = story.drop !== undefined && b > story.drop + 0.15;
    }

    const sh = story.shutter;
    if (this.shutter) this.shutter.position.y = sh ? 3.9 * smooth(clamp01((b - sh[0]) / (sh[1] - sh[0]))) : 0;

    const shots = story.shots;
    const i = Math.min(shots.length - 2, Math.floor(b));
    const A = shots[i];
    const B = shots[i + 1] ?? A;
    const hold = A.hold ?? 0.35;
    const u = smooth(clamp01((b - i - hold) / (1 - hold || 1)));
    this.camera.position.lerpVectors(A.cam(s), B.cam(s), u);
    this.camera.position.y += Math.sin(Math.PI * u) * (A.arc ?? 0);
    this.look.lerpVectors(A.look(s), B.look(s), u);
    this.camera.fov = lerp(A.fov, B.fov, u);
    const off = lerp(A.offset ?? 0, B.offset ?? 0, u);
    this.camera.setViewOffset(this.w, this.h, -off * this.w, 0, this.w, this.h);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.look);
    const roll = lerp(A.roll ?? 0, B.roll ?? 0, u);
    if (roll) this.camera.rotateZ(roll);
    this.camera.updateProjectionMatrix();

    if (this.update) this.update(b, s);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
