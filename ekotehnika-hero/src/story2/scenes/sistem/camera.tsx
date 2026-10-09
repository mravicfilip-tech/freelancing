// The camera, the light rig and the dust. The camera is a pure function of the story clock, so a frozen clock
// always gives the same picture. It orbits a target for most beats, and flies free through the aisle.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { C } from '../../../tokens';
import { track } from '../../../story/scenes/sistem/tracks';
import type { SceneProps } from '../../clock';
import { ATP, BP, NP, WH_C, routeAt, truckS, AISLES } from './route';
import { ease, lerp, range, rad, softTexture, uOf, GROUND } from './kit';

export type CamState = { target: THREE.Vector3; d: number; shadow: number };

const ISO = { x: 134, y: 1, z: -14, d: 38, yaw: 20, pitch: -72 };
const ISO_YAW = ISO.yaw;
const ISO_PITCH = ISO.pitch;

// Outdoor channels over u. The truck stays at the same place on screen, the camera follows it.
const O_OX = track([[0, -0.45], [4, -0.45], [5, 0]]);
const O_OY = track([[0, 1.15], [2, 1.2], [4, 1.15], [5, 0]]);
const O_D = track([[0, 16], [0.8, 16], [1.6, 12.2], [2, 12.5], [3, 14], [4, 16], [5, 56], [6, 56]]);
const O_YAW = track([[0, 0], [4, 0], [5, 90], [6, 90]]);
const O_PITCH = track([[0, -7], [2, -7], [3, -8], [4, -8], [5, -90], [6, -90]]);
const O_SX = track([[0, 0.236], [0.8, 0.236], [2, -0.05], [3, -0.05], [4, 0.1], [5, 0.22], [6, 0.22]]);
const O_SY = track([[0, 0], [4, 0], [5, 0.12], [5.6, 0.1], [6, -0.12]]);

const A_YAW = track([[8, ISO_YAW], [8.3, 0], [8.5, 0], [8.75, 90], [10, 90]]);
const A_PITCH = track([[8, ISO_PITCH], [8.3, -10], [8.5, -9], [8.75, -3], [9, -3], [10, -1]]);
const T1X = track([[0, 124], [5300, 124], [6400, 129], [7000, 138], [7600, 150], [8000, 151.5], [12000, 151.5]]);
const SEP0 = 176 - T1X(7300);
const A_SEP = track([[8.75, SEP0], [9, 6.5], [9.55, 3.2], [10, 1.45]]);
const A_Y = track([[8.75, 2.2], [9, 1.65], [10, 1.25]]);


const orbit = (t: THREE.Vector3, d: number, yawDeg: number, pitchDeg: number, out = new THREE.Vector3()) => {
  const y = rad(yawDeg);
  const p = rad(pitchDeg);
  return out.set(t.x + d * Math.sin(y) * Math.cos(p), t.y - d * Math.sin(p), t.z + d * Math.cos(y) * Math.cos(p));
};

export type Pose = { pos: THREE.Vector3; yaw: number; pitch: number; sx: number; sy: number; target: THREE.Vector3; d: number; shadow: number };

const tmp = { t: new THREE.Vector3(), p0: new THREE.Vector3() };

export function poseAt(u: number, pos: number, out: Pose): Pose {
  const t = out.target;
  out.sx = 0;
  out.sy = 0;
  out.shadow = 10;
  if (u < 6) {
    const rp = routeAt(truckS(pos));
    t.set(rp.x + O_OX(u), O_OY(u), rp.z);
    out.d = O_D(u);
    out.yaw = O_YAW(u);
    out.pitch = O_PITCH(u);
    out.sx = O_SX(u);
    out.sy = O_SY(u);
    out.shadow = u < 4 ? 9 : 16;
    orbit(t, out.d, out.yaw, out.pitch, out.pos);
  } else if (u < 7) {
    const e = ease(u - 6);
    const rp = routeAt(truckS(4700));
    t.set(lerp(rp.x, WH_C.x, e), lerp(0, 10, e), lerp(rp.z, WH_C.z, e));
    out.d = lerp(56, 20, e);
    out.yaw = 90;
    out.pitch = -90;
    out.sx = lerp(0.22, 0, e);
    out.sy = lerp(-0.12, 0, e);
    out.shadow = 45;
    orbit(t, out.d, out.yaw, out.pitch, out.pos);
  } else if (u < 8) {
    const e = ease(range(u, 7.5, 8));
    t.set(lerp(WH_C.x, ISO.x, e), lerp(10, ISO.y, e), lerp(WH_C.z, ISO.z, e));
    out.d = lerp(20, ISO.d, e);
    out.yaw = lerp(90, ISO.yaw, e);
    out.pitch = lerp(-90, ISO.pitch, e);
    out.shadow = 45;
    orbit(t, out.d, out.yaw, out.pitch, out.pos);
  } else if (u < 10) {
    const x1 = T1X(pos);
    out.shadow = 14;
    if (u < 8.5) {
      const e = ease(range(u, 8, 8.3));
      t.set(lerp(ISO.x, x1 + 0.4, e), lerp(ISO.y, 1.3, e), lerp(ISO.z, AISLES[1], e));
      out.d = lerp(ISO.d, 13, e);
      out.yaw = A_YAW(u);
      out.pitch = A_PITCH(u);
      orbit(t, out.d, out.yaw, out.pitch, out.pos);
    } else {
      // free flight, out along the side, round the end of the aisle and in
      t.set(x1 + 0.4, 1.3, AISLES[1]);
      orbit(t, 13, 0, A_PITCH(8.5), tmp.p0);
      const e = ease(range(u, 8.5, 8.75));
      const endX = 176;
      const x = u < 8.75 ? lerp(tmp.p0.x, endX, e) : x1 + A_SEP(u);
      const y = u < 8.75 ? lerp(tmp.p0.y, A_Y(8.75), e) : A_Y(u);
      const z = lerp(tmp.p0.z, AISLES[1], e);
      out.pos.set(x, y, z);
      out.yaw = A_YAW(u);
      out.pitch = A_PITCH(u);
      t.set(x1, 1.3, AISLES[1]);
      out.d = 10;
    }
  } else if (u < 11.9) {
    t.set(BP.x + 0.4, 1.0, BP.z);
    out.d = 12;
    out.yaw = -35;
    out.pitch = -30;
    out.sx = 0.27;
    out.shadow = 8;
    orbit(t, out.d, out.yaw, out.pitch, out.pos);
  } else if (u < 13) {
    t.set(NP.x - 0.5, 0.9, NP.z);
    out.d = 33;
    out.yaw = 90;
    out.pitch = -24;
    out.sy = 0.17;
    out.shadow = 18;
    orbit(t, out.d, out.yaw, out.pitch, out.pos);
  } else if (u < 14) {
    const e = ease(range(u, 13.12, 13.95));
    t.set(lerp(NP.x - 0.5, ATP.x, e), lerp(0.9, ATP.y, e), 0);
    out.d = lerp(33, 61, e);
    out.yaw = 90;
    out.pitch = lerp(-24, -90, e);
    out.sy = lerp(0.17, 0, e);
    out.shadow = lerp(18, 30, e);
    orbit(t, out.d, out.yaw, out.pitch, out.pos);
  } else {
    t.set(ATP.x, ATP.y, 0);
    out.d = 61;
    out.yaw = 90;
    out.pitch = -90;
    out.shadow = 30;
    orbit(t, out.d, out.yaw, out.pitch, out.pos);
  }
  return out;
}

export function Rig({ clock, state }: SceneProps & { state: React.MutableRefObject<CamState> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const pose = useMemo<Pose>(() => ({ pos: new THREE.Vector3(), yaw: 0, pitch: 0, sx: 0, sy: 0, target: new THREE.Vector3(), d: 10, shadow: 10 }), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);
  const last = useRef({ sx: 9, sy: 9, w: 0, h: 0 });

  useEffect(() => {
    scene.add(camera);
  }, [camera, scene]);

  useFrame(() => {
    const u = uOf(clock);
    poseAt(u, clock.pos.current, pose);
    camera.position.copy(pose.pos);
    euler.set(rad(pose.pitch), rad(pose.yaw), 0);
    camera.quaternion.setFromEuler(euler);
    const l = last.current;
    if (Math.abs(l.sx - pose.sx) > 1e-5 || Math.abs(l.sy - pose.sy) > 1e-5 || l.w !== size.width || l.h !== size.height) {
      l.sx = pose.sx;
      l.sy = pose.sy;
      l.w = size.width;
      l.h = size.height;
      camera.setViewOffset(size.width, size.height, -pose.sx * size.width, -pose.sy * size.height, size.width, size.height);
    }
    state.current.target.copy(pose.target);
    state.current.d = pose.d;
    state.current.shadow = pose.shadow;
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = pose.d * 1.5 + 12;
      fog.far = fog.near + 120;
    }
  });
  return null;
}

// One key light with a soft shadow that follows what the camera is looking at, plus a cool rim from behind.
export function Lights({ clock, state }: SceneProps & { state: React.MutableRefObject<CamState> }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const shadowSize = useRef(0);
  useFrame(() => {
    const u = uOf(clock);
    const s = state.current;
    const k = key.current;
    const r = rim.current;
    if (!k || !r) return;
    k.target.position.copy(s.target);
    k.position.set(s.target.x - 5, s.target.y + 9 + s.shadow * 0.4, s.target.z + 7 + s.shadow * 0.3);
    k.target.updateMatrixWorld();
    const inWarehouse = u >= 6.3 && u < 10;
    const blueprint = u >= 10 && u < 11.9;
    k.intensity = blueprint ? 0.9 : inWarehouse ? 1.0 : u < 6.3 ? 2.4 : 2.2;
    if (Math.abs(shadowSize.current - s.shadow) > 0.5) {
      shadowSize.current = s.shadow;
      const cam = k.shadow.camera;
      cam.left = -s.shadow;
      cam.right = s.shadow;
      cam.top = s.shadow;
      cam.bottom = -s.shadow;
      cam.far = 40 + s.shadow * 3;
      cam.updateProjectionMatrix();
    }
    r.target.position.copy(s.target);
    r.position.set(s.target.x + 6, s.target.y + 4, s.target.z - 9);
    r.target.updateMatrixWorld();
    r.intensity = blueprint ? 0.5 : 1.6;
  });
  return (
    <>
      <directionalLight ref={key} castShadow intensity={3} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      <directionalLight ref={rim} intensity={1.6} color="#dfe6ea" />
      <hemisphereLight args={['#aeb9bd', GROUND, 0.12]} />
    </>
  );
}

// Slow dust in the light, around whatever the camera looks at.
export function Dust({ clock, state }: SceneProps & { state: React.MutableRefObject<CamState> }) {
  const ref = useRef<THREE.Points>(null);
  const N = 320;
  const base = useMemo(() => {
    const a = new Float32Array(N * 3);
    let s = 12345;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < N; i++) {
      a[i * 3] = (r() - 0.5) * 2;
      a[i * 3 + 1] = (r() - 0.5) * 2;
      a[i * 3 + 2] = (r() - 0.5) * 2;
    }
    return a;
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
    return g;
  }, [base]);
  const mat = useMemo(() => new THREE.PointsMaterial({ map: softTexture(), color: C.lightGrey, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const s = state.current;
    const scale = Math.min(Math.max(s.d * 0.9, 8), 40);
    g.position.copy(s.target);
    g.scale.setScalar(scale);
    mat.size = 0.09 * Math.min(1 + s.d / 14, 5);
    const t = st.clock.elapsedTime * 0.02;
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      p.setXYZ(i, base[i * 3] + Math.sin(t * 7 + i) * 0.02, ((base[i * 3 + 1] + t + 1) % 2) - 1, base[i * 3 + 2] + Math.cos(t * 5 + i * 1.3) * 0.02);
    }
    p.needsUpdate = true;
    const u = uOf(clock);
    mat.opacity = u >= 9.7 && u < 10.3 ? 0.1 : 0.4;
  });
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}
