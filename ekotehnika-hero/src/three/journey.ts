// Renders the warehouse and moves the camera along the scroll story. Progress p runs 0 to 1.
// Each beat is a camera position, a look-at point, a field of view and a sideways frame offset
// that keeps the subject clear of the copy on the left at scroll zero.

import * as THREE from 'three';
import { buildForklift, type Forklift } from './forklift';
import { buildWarehouse, LANE_Z } from './warehouse';
import { C } from '../tokens';

type Beat = { cam: THREE.Vector3; look: THREE.Vector3; fov: number; offset: number; truckX: number; lift: number };

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Beat 1, close three-quarter on the truck. Beat 2, pulled back and up over the showroom.
export const BEATS: Beat[] = [
  { cam: v(5.2, 3.0, 10.6), look: v(-0.8, 0.95, LANE_Z), fov: 30, offset: 0.22, truckX: -1.2, lift: 0.12 },
  { cam: v(15, 13, 17), look: v(5.2, 0, -2.4), fov: 32, offset: 0.16, truckX: 2.4, lift: 0.4 },
];

// Extra control points shape the path between beats, so the camera arcs instead of sliding.
const CAM_PATH = new THREE.CatmullRomCurve3([BEATS[0].cam, v(11, 6, 14.5), BEATS[1].cam], false, 'centripetal');

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class Journey {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  private truck: Forklift;
  private w = 1;
  private h = 1;
  private p = 0;
  private look = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene.background = new THREE.Color(C.hoverLightGrey);
    this.scene.add(buildWarehouse());
    this.truck = buildForklift();
    this.truck.group.position.set(BEATS[0].truckX, 0, LANE_Z);
    this.scene.add(this.truck.group);
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.setProgress(this.p);
  }

  setProgress(p: number) {
    this.p = clamp01(p);
    const t = smooth(this.p);
    const [a, b] = BEATS;

    this.camera.position.copy(CAM_PATH.getPoint(t));
    this.look.lerpVectors(a.look, b.look, t);
    this.camera.fov = lerp(a.fov, b.fov, t);
    // A positive offset slides the subject right, clear of the copy on the left.
    this.camera.setViewOffset(this.w, this.h, -lerp(a.offset, b.offset, t) * this.w, 0, this.w, this.h);
    this.camera.lookAt(this.look);
    this.camera.updateProjectionMatrix();

    // The truck rolls forward while the camera rises, wheels turning with the distance covered.
    const drive = smooth(clamp01((this.p - 0.08) / 0.84));
    const x = lerp(a.truckX, b.truckX, drive);
    this.truck.group.position.x = x;
    const dist = x - a.truckX;
    for (const w of this.truck.wheels) w.g.rotation.z = -dist / w.r;
    const lift = lerp(a.lift, b.lift, drive);
    this.truck.carriage.position.y = lift - 0.12;
    this.truck.inner.position.y = (lift - 0.12) / 2;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
