// Everything inside the canvas. The light rig, the camera that flies the story, the fog and the
// white hotspot ring on the current stop.
import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { C } from '../../tokens';
import { clamp01, range } from '../../scroll/useScrollStory';
import { keys, stops, type Key } from './story';
import { World } from './World';

const rad = THREE.MathUtils.degToRad;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function keyPos(k: Key) {
  const az = rad(k.az);
  const el = rad(k.el);
  return new THREE.Vector3(k.t[0] - Math.sin(az) * Math.cos(el) * k.d, k.t[1] + Math.sin(el) * k.d, k.t[2] + Math.cos(az) * Math.cos(el) * k.d);
}

const stopIdx = keys.map((k, i) => (k.stop !== undefined ? i : -1)).filter((i) => i >= 0);
const HOLD = 0.022;

// Story progress to a continuous key index. The camera rests on each stop and flies through the
// keys in between without stopping.
export function keyParam(p: number) {
  for (let j = 0; j < stopIdx.length - 1; j++) {
    const a = keys[stopIdx[j]].p;
    const b = keys[stopIdx[j + 1]].p;
    if (p <= b || j === stopIdx.length - 2) {
      const e = inOut(range(p, a + HOLD, b - HOLD));
      return stopIdx[j] + e * (stopIdx[j + 1] - stopIdx[j]);
    }
  }
  return 0;
}

function Rig({ progress, reduced }: { progress: MutableRefObject<number>; reduced: boolean }) {
  const { camera, size, scene } = useThree();
  const light = useRef<THREE.DirectionalLight>(null);
  const curves = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(keys.map(keyPos), false, 'centripetal');
    const tgt = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.t)), false, 'centripetal');
    return { pos, tgt };
  }, []);
  const fog = useMemo(() => new THREE.Fog(C.hoverLightGrey, 150, 600), []);
  scene.fog = fog;
  const p = useMemo(() => new THREE.Vector3(), []);
  const t = useMemo(() => new THREE.Vector3(), []);
  const lastW = useRef(0);
  const intro = useRef(reduced ? 1 : 0);

  useFrame(({ clock }, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    if (size.width !== lastW.current) {
      lastW.current = size.width;
      // the scene centre sits right of the glass card, like the reel
      cam.setViewOffset(size.width, size.height, -size.width * 0.12, 0, size.width, size.height);
    }
    const u = keyParam(clamp01(progress.current));
    const n = keys.length - 1;
    curves.pos.getPoint(u / n, p);
    curves.tgt.getPoint(u / n, t);
    const i = Math.min(n - 1, Math.floor(u));
    const f = u - i;
    const d = THREE.MathUtils.lerp(keys[i].d, keys[i + 1].d, f);
    cam.fov = THREE.MathUtils.lerp(keys[i].fov, keys[i + 1].fov, f);

    // the opening drop in from higher up, once
    if (!reduced && intro.current < 1) intro.current = Math.min(1, intro.current + dt / 2.6);
    const k = 1 - inOut(intro.current);
    if (k > 0) {
      p.sub(t).multiplyScalar(1 + k * 0.5).add(t);
      p.y += k * 30;
    }
    if (!reduced) {
      const s = clock.elapsedTime;
      p.x += Math.sin(s * 0.13) * 1.6;
      p.y += Math.sin(s * 0.1 + 1) * 0.8;
      p.z += Math.cos(s * 0.11) * 1.2;
    }
    cam.position.copy(p);
    cam.lookAt(t);
    cam.updateProjectionMatrix();

    fog.near = d * 1.05;
    fog.far = d * 3.6 + 120;

    // the key light follows the focus so its shadow map covers what is on screen
    const L = light.current;
    if (L) {
      const half = THREE.MathUtils.clamp(d * 0.42, 34, 170);
      L.position.set(t.x + 92, t.y + 56, t.z + 50);
      L.target.position.copy(t);
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
    <>
      <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={0.07} />
      <hemisphereLight args={[C.white, C.lightGrey, 0.3]} />
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
    </>
  );
}

// The stop markers, a white disc with a soft halo and a plus, drawn in the scene so they keep a
// steady screen size and leave nothing behind when the canvas unmounts.
function Hotspots({ idx }: { idx: number }) {
  return (
    <>
      {stops.map((s, i) => (
        <Spot key={i} position={s.spot} on={i === idx} />
      ))}
    </>
  );
}

function Spot({ position, on }: { position: [number, number, number]; on: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const k = useRef(0);
  const p = useMemo(() => new THREE.Vector3(...position), [position]);
  useFrame(({ camera }, dt) => {
    const g = ref.current;
    if (!g) return;
    k.current += ((on ? 1 : 0) - k.current) * Math.min(1, dt * 6);
    // about 30 css px across at 900px tall, whatever the camera distance
    const persp = camera as THREE.PerspectiveCamera;
    const h = 2 * camera.position.distanceTo(p) * Math.tan(THREE.MathUtils.degToRad(persp.fov ?? 30) / 2);
    g.scale.setScalar(Math.max(0.0001, (h / 900) * 30 * (0.4 + 0.6 * k.current)));
    g.visible = k.current > 0.01;
  });
  return (
    <Billboard position={position}>
      <group ref={ref}>
        <mesh renderOrder={10}>
          <circleGeometry args={[0.7, 40]} />
          <meshBasicMaterial color={C.white} transparent opacity={0.35} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={11}>
          <circleGeometry args={[0.5, 40]} />
          <meshBasicMaterial color={C.white} transparent opacity={0.92} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={12}>
          <planeGeometry args={[0.34, 0.05]} />
          <meshBasicMaterial color={C.ink} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={12} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[0.34, 0.05]} />
          <meshBasicMaterial color={C.ink} depthTest={false} toneMapped={false} />
        </mesh>
      </group>
    </Billboard>
  );
}

export function Stage({ progress, reduced, idx }: { progress: MutableRefObject<number>; reduced: boolean; idx: number }) {
  return (
    <>
      <color attach="background" args={[C.hoverLightGrey]} />
      <Rig progress={progress} reduced={reduced} />
      <World reduced={reduced} />
      <Hotspots idx={idx} />
    </>
  );
}
