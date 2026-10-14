// Everything hero 7 draws, built once, and set from p alone each frame. The room is a prefiltered cube
// of soft boxes in a dark box, as in hero 6, so nothing is fetched at runtime. The lights are the
// specimen's, a warm key from the upper left in front and a rim from behind, but no red light, the
// machine carries no red and the glow is the page's own gradient behind the canvas. No shadow maps, the machine's contact shade is in
// the ground's shader.

import * as THREE from 'three';
import { buildGround } from './Ground';
import { buildMachine } from './Machine';
import { buildSpoil } from './Spoil';
import { MZ, camDirs, makePose, solve, type V3 } from './world';

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
  update(p: number): void;
  dispose(): void;
};

export function buildStage(gl: THREE.WebGLRenderer, dpr: number): Stage {
  const { c, r } = camDirs();
  const group = new THREE.Group();
  const machine = buildMachine();
  const ground = buildGround(dpr);
  // the bucket is the last pivot of the arm, the load rides in its frame
  const bucket = machine.bucketPivot;
  const spoil = buildSpoil(dpr, bucket);
  group.add(ground.group, machine.root, spoil.points);

  const key = new THREE.DirectionalLight('#fff1e2', 3.2);
  key.position.set(-r[0] * 3 + c[0] * 8, 8, -r[2] * 3 + c[2] * 8);
  const rim = new THREE.DirectionalLight('#ffffff', 1.7);
  rim.position.set(-c[0] * 8 + r[0] * 4, 4, -c[2] * 8 + r[2] * 4);
  const fill = new THREE.HemisphereLight('#dfe3ea', '#2a2a2d', 0.8);
  group.add(key, key.target, rim, rim.target, fill);

  const env = buildEnv(gl);
  const pose = makePose();
  let last = NaN;

  return {
    group,
    env: env.texture,
    update(p) {
      if (p === last) return;
      last = p;
      solve(p, pose);
      machine.update(pose);
      ground.set(pose.seam, pose.xf, pose.xm);
      spoil.set(pose);
      // the lights ride with the machine, so every frame is lit the same way
      key.position.set(pose.xm - r[0] * 3 + c[0] * 8, 8, MZ - r[2] * 3 + c[2] * 8);
      key.target.position.set(pose.xm, 0, MZ);
      rim.position.set(pose.xm - c[0] * 8 + r[0] * 4, 4, MZ - c[2] * 8 + r[2] * 4);
      rim.target.position.set(pose.xm, 0, MZ);
    },
    dispose() {
      ground.dispose();
      machine.dispose();
      spoil.dispose();
      env.dispose();
    },
  };
}
