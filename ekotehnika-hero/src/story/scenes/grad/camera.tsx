// The camera of the Grad scene. A list of poses on the story time u (beat plus k), joined by cubic
// Hermite curves so the flight never kinks. A pose is the point the camera looks at, an azimuth from
// +z toward -x in degrees, an elevation, a distance and a field of view. The lights follow the focus.
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { StoryClock } from '../../clock';
import { C } from '../../../tokens';
import { uOf } from './plan';

export type Vec = [number, number, number];
export type Key = { u: number; t: Vec; az: number; el: number; d: number; fov?: number; stop?: boolean };

const rad = THREE.MathUtils.degToRad;

// How far right of centre the subject sits, as a share of the stage width. The shell panel covers
// the left 32 percent, so the middle of the free area is at 66 percent.
export const SUBJECT_X = 0.665;

// Flat list of numbers per key, for the Hermite maths
const flat = (k: Key) => [k.t[0], k.t[1], k.t[2], k.az, k.el, k.d, k.fov ?? 20];

export function makeCamera(keys: Key[]) {
  const ks = [...keys].sort((a, b) => a.u - b.u);
  const n = ks.length;
  const vals = ks.map(flat);
  // tangents, non uniform Catmull Rom, zero at a stop
  const tang = ks.map((k, i) => {
    if (k.stop || i === 0 || i === n - 1) return vals[i].map(() => 0);
    const a = i - 1;
    const b = i + 1;
    return vals[i].map((_, c) => (vals[b][c] - vals[a][c]) / (ks[b].u - ks[a].u));
  });
  const out = new Array(7).fill(0);
  return (u: number) => {
    const uu = Math.min(ks[n - 1].u, Math.max(ks[0].u, u));
    let i = 0;
    while (i < n - 2 && uu > ks[i + 1].u) i++;
    const h = ks[i + 1].u - ks[i].u;
    const s = h > 0 ? (uu - ks[i].u) / h : 0;
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    for (let c = 0; c < 7; c++) out[c] = h00 * vals[i][c] + h10 * h * tang[i][c] + h01 * vals[i + 1][c] + h11 * h * tang[i + 1][c];
    return out;
  };
}

export function camPosition(p: number[], target: THREE.Vector3, pos: THREE.Vector3) {
  const az = rad(p[3]);
  const el = rad(p[4]);
  target.set(p[0], p[1], p[2]);
  pos.set(p[0] - Math.sin(az) * Math.cos(el) * p[5], p[1] + Math.sin(el) * p[5], p[2] + Math.cos(az) * Math.cos(el) * p[5]);
}

export function Rig({ clock, keys }: { clock: StoryClock; keys: Key[] }) {
  const { camera, size, scene } = useThree();
  const light = useRef<THREE.DirectionalLight>(null);
  const cam = useMemo(() => makeCamera(keys), [keys]);
  const fog = useMemo(() => new THREE.Fog(C.hoverLightGrey, 150, 600), []);
  scene.fog = fog;
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const last = useRef({ w: 0, h: 0 });

  useFrame(() => {
    const c = camera as THREE.PerspectiveCamera;
    const u = uOf(clock);
    const p = cam(u);
    camPosition(p, tgt, pos);
    if (size.width !== last.current.w || size.height !== last.current.h) {
      last.current = { w: size.width, h: size.height };
    }
    // shift the picture so the target lands at SUBJECT_X, the free area right of the panel
    c.setViewOffset(size.width, size.height, -size.width * (SUBJECT_X - 0.5), size.height * 0.004, size.width, size.height);
    c.fov = p[6];
    c.position.copy(pos);
    c.lookAt(tgt);
    c.updateProjectionMatrix();
    const d = p[5];
    fog.near = d * 1.05;
    fog.far = d * 3.6 + 120;
    const L = light.current;
    if (L) {
      const half = THREE.MathUtils.clamp(d * 0.42, 34, 170);
      L.position.set(tgt.x + 92, tgt.y + 56, tgt.z + 50);
      L.target.position.copy(tgt);
      L.target.updateMatrixWorld();
      const sc = L.shadow.camera;
      sc.left = -half;
      sc.right = half;
      sc.top = half;
      sc.bottom = -half;
      sc.near = 10;
      sc.far = 140 + half * 2;
      sc.updateProjectionMatrix();
    }
  });

  return (
    <directionalLight
      ref={light}
      intensity={7.5}
      color={C.white}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0006}
      shadow-normalBias={0.04}
      shadow-radius={4}
    />
  );
}
