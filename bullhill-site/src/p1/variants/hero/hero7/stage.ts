// Everything hero 7 draws, built once, and set from p alone each frame. The room is a prefiltered cube
// of soft boxes in a dark box, as in hero 6, so nothing is fetched at runtime. The lights are the
// specimen's, a warm key from the upper left in front and a rim from behind, but no red light, the
// machine carries no red and the glow is the page's own gradient behind the canvas. The key casts one
// shadow map that follows the machine, drawn only on a frame where p moved, the way hero 6 does it.

import * as THREE from 'three';
import { buildGround, type GroundRig } from './Ground';
import { buildMachine } from './Machine';
import { buildSpoil } from './Spoil';
import { buildStory } from './Story';
import { KEY_Y, MZ, camDirs, makePose, solve, type V3 } from './world';

function buildEnv(gl: THREE.WebGLRenderer) {
  const { c, r } = camDirs();
  const at = (p: V3, ...terms: [V3, number][]): V3 => terms.reduce<V3>((a, [v, s]) => [a[0] + v[0] * s, a[1] + v[1] * s, a[2] + v[2] * s], p);
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(60, 60, 60), new THREE.MeshBasicMaterial({ color: '#070708', side: THREE.BackSide })));
  const panel = (w: number, h: number, col: string, k: number, pos: V3) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos);
    m.lookAt(0, 0.8, 0);
    s.add(m);
  };
  const up: V3 = [0, 1, 0];
  panel(10, 7, '#fff6ec', 6, at([0, 0, 0], [r, -9], [c, 5], [up, 9])); // key, upper left and in front
  panel(16, 16, '#ffffff', 0.9, at([0, 0, 0], [up, 13])); // overhead
  panel(1.6, 11, '#ffffff', 10, at([0, 0, 0], [c, -10], [r, 6], [up, 3])); // rim strip behind right
  panel(1.2, 9, '#ffffff', 3, at([0, 0, 0], [c, 7], [r, 9], [up, 2])); // front right edge strip
  panel(18, 5, '#c9c9cf', 1.6, at([0, 0, 0], [c, -12], [up, 1.6])); // a low grey strip behind, the red glow is the page's own
  panel(14, 4, '#ffffff', 0.45, at([0, 0, 0], [c, 11], [r, -3], [up, 2.5])); // soft fill from the front
  const pm = new THREE.PMREMGenerator(gl);
  const rt = pm.fromScene(s, 0.02, 0.1, 100);
  pm.dispose();
  s.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose?.();
    (m.material as THREE.Material | undefined)?.dispose?.();
  });
  return rt;
}

export type Stage = {
  group: THREE.Group;
  env: THREE.Texture;
  // Sets everything from p, and says whether anything that casts a shadow moved. `routeX` is how far the
  // route has been drawn at load, `rock` the idle rock of the house on its tracks, both 0 to 1 from the clock.
  update(p: number, routeX: number, rock: number, clock: number): boolean;
  ground: GroundRig;
  setScreen(dpr: number): void;
  dispose(): void;
};

// `shadow` is the shadow map's side, 2048 and 1024 on phones
export function buildStage(gl: THREE.WebGLRenderer, dpr: number, shadow = 2048): Stage {
  const { c, r } = camDirs();
  const group = new THREE.Group();
  const machine = buildMachine();
  const ground = buildGround(dpr);
  const story = buildStory(dpr);
  // the bucket is the last pivot of the arm, the load rides in its frame
  const bucket = machine.bucketPivot;
  const spoil = buildSpoil(dpr, bucket);
  group.add(ground.group, machine.root, spoil.points, story.group);

  const kx = -r[0] * 3 + c[0] * 8;
  const kz = -r[2] * 3 + c[2] * 8;
  // a warm key, a touch of orange in the white, the machine's greys stay greys
  const key = new THREE.DirectionalLight('#ffe4c8', 3.3);
  key.position.set(kx, KEY_Y, kz);
  key.castShadow = true;
  key.shadow.mapSize.set(shadow, shadow);
  const sc = key.shadow.camera;
  sc.left = -10;
  sc.right = 10;
  sc.top = 10;
  sc.bottom = -10;
  sc.near = 1;
  sc.far = 40;
  sc.updateProjectionMatrix();
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 3;
  const rim = new THREE.DirectionalLight('#ffffff', 1.7);
  rim.position.set(-c[0] * 8 + r[0] * 4, 4, -c[2] * 8 + r[2] * 4);
  const fill = new THREE.HemisphereLight('#dfe3ea', '#2a2a2d', 0.8);
  group.add(key, key.target, rim, rim.target, fill);

  // the light's right and up, for snapping its box to whole texels
  const kl = Math.hypot(kx, KEY_Y, kz);
  const kd: V3 = [kx / kl, KEY_Y / kl, kz / kl];
  const lrl = Math.hypot(kd[2], kd[0]);
  const lr: V3 = [kd[2] / lrl, 0, -kd[0] / lrl];
  const lu: V3 = [kd[1] * lr[2] - kd[2] * lr[1], kd[2] * lr[0] - kd[0] * lr[2], kd[0] * lr[1] - kd[1] * lr[0]];
  const TEXEL = 20 / shadow;
  const env = buildEnv(gl);
  const pose = makePose();
  let last = NaN;
  let lastRoute = NaN;
  let lastRock = 0;

  return {
    group,
    env: env.texture,
    ground,
    update(p, routeX, rock, clock) {
      const moved = p !== last || rock !== 0 || lastRock !== 0;
      if (moved) {
        last = p;
        solve(p, pose);
        machine.update(pose, rock, clock);
        ground.set(pose);
        spoil.set(pose);
      }
      lastRock = rock;
      if (routeX !== lastRoute || moved) {
        lastRoute = routeX;
        ground.setRoute(routeX);
        story.update(pose, routeX);
      }
      if (!moved) return false;
      // the shadow's box is centred ahead of the machine, over the arm, the trench and the heap, and snapped to
      // the shadow map's texels along the light's own axes, so the shadow's edges do not crawl while it travels
      let tx = pose.xm - 2.5;
      let ty = 0;
      let tz = MZ - 1.2;
      const du = tx * lr[0] + ty * lr[1] + tz * lr[2];
      const dv = tx * lu[0] + ty * lu[1] + tz * lu[2];
      const fu = du - Math.floor(du / TEXEL) * TEXEL;
      const fv = dv - Math.floor(dv / TEXEL) * TEXEL;
      tx -= lr[0] * fu + lu[0] * fv;
      ty -= lr[1] * fu + lu[1] * fv;
      tz -= lr[2] * fu + lu[2] * fv;
      key.target.position.set(tx, ty, tz);
      key.position.set(tx + kx, ty + KEY_Y, tz + kz);
      rim.position.set(pose.xm - c[0] * 8 + r[0] * 4, 4, MZ - c[2] * 8 + r[2] * 4);
      rim.target.position.set(pose.xm, 0, MZ);
      return true;
    },
    setScreen(d) {
      ground.setScreen(d);
      story.setScreen(d);
    },
    dispose() {
      ground.dispose();
      machine.dispose();
      spoil.dispose();
      story.dispose();
      key.shadow.map?.dispose();
      env.dispose();
    },
  };
}
