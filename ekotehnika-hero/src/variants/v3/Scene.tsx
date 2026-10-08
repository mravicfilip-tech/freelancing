// The 3D film for variant 3. A Linde truck in side profile against a red sky at the last minute of
// daylight, the camera pulling back and rising over a yard, the truck turning to glowing lines, the
// yard going dark into dust, and a lit tile grid where light trails land.
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Forklift, Pallet, setPose, type ForkliftApi } from '../../r3f/Forklift';
import { Glow } from '../../r3f/Studio';
import { M } from '../../r3f/materials';
import { C } from '../../tokens';
import { band, range, smooth } from '../../scroll/useScrollStory';
import {
  beamMaterial,
  collectEdges,
  dissolve,
  gridMaterial,
  lin,
  lineMaterial,
  pointMaterial,
  pointsAlong,
  radialTexture,
  segmentsGeometry,
  skyMaterial,
  type V3Uniforms,
} from './fx';

type Prog = MutableRefObject<number>;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Camera keys. Positions and targets are relative to the main truck, which drives in from the
// left until the aerial key and then stays put.
const KEYS = [
  { p: 0.0, pos: [0.7, 0.3, 11.5], tgt: [0.7, 1.12, 0], fov: 24 },
  { p: 0.16, pos: [1.6, 1.7, 13.5], tgt: [1.0, 0.95, -1], fov: 25 },
  { p: 0.4, pos: [6.5, 12.5, 15.0], tgt: [3.0, 0.0, -7.6], fov: 32 },
  { p: 0.52, pos: [5.0, 4.6, 8.2], tgt: [0.7, 0.7, -0.8], fov: 32 },
  { p: 0.68, pos: [4.0, 12.0, 13.5], tgt: [2.5, 0.0, -7], fov: 36 },
  { p: 0.86, pos: [0.6, 19.5, 3.4], tgt: [0.6, 0.0, -0.6], fov: 42 },
  { p: 1.0, pos: [0.6, 15.5, 2.4], tgt: [0.6, 0.0, -0.5], fov: 40 },
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...(k.pos as [number, number, number]))), false, 'centripetal');
const tgtCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...(k.tgt as [number, number, number]))), false, 'centripetal');

function keyParam(p: number) {
  const n = KEYS.length - 1;
  for (let i = 0; i < n; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (p <= b.p) {
      const t = (p - a.p) / (b.p - a.p);
      return { u: (i + t) / n, fov: lerp(a.fov, b.fov, smooth(t)) };
    }
  }
  return { u: 1, fov: KEYS[n].fov };
}

// Where the truck is along its drive, metres on x.
const START_X = -30;
export const truckX = (p: number) => START_X - START_X * smooth(range(p, 0, 0.42));

// The sun. Low behind the cab at the start, swinging to the front left as the camera rises so the
// yard gets long raking shadows.
const SUN0 = new THREE.Vector3(0.05, 0.1, -1).normalize();
const SUN1 = new THREE.Vector3(-0.86, 0.36, 0.3).normalize();
const sunDir = (p: number, out: THREE.Vector3) => out.copy(SUN0).lerp(SUN1, smooth(range(p, 0.1, 0.36))).normalize();

export function Film({ progress, reduced, u }: { progress: Prog; reduced: boolean; u: V3Uniforms }) {
  const { camera, scene, gl } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const truck = useRef<THREE.Group>(null);
  const api = useRef<ForkliftApi | null>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const sky = useRef<THREE.Mesh>(null);
  const glowA = useRef<THREE.Sprite>(null);
  const glowB = useRef<THREE.Sprite>(null);
  const glowC = useRef<THREE.Sprite>(null);
  const solids = useRef<THREE.Group>(null);
  const lamps = useRef<THREE.Group>(null);
  const skyMat = useMemo(skyMaterial, []);
  const fog = useMemo(() => new THREE.Fog(lin(C.tonedRed, 1.0), 22, 160), []);
  const v = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), s: new THREE.Vector3(), f: new THREE.Vector3() }), []);
  const cHot = useMemo(() => lin(C.tonedRed, 1.0), []);
  const cInk = useMemo(() => lin(C.ink, 0.12), []);
  const cAerial = useMemo(() => new THREE.Color(C.tonedRed).multiplyScalar(0.42), []);
  const landBase = useMemo(() => new THREE.Color(C.ink), []);
  const land = useMemo(() => new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.8, specularIntensity: 0.12 }), []);

  useLayoutEffect(() => {
    scene.fog = fog;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog, gl]);

  useFrame((_, dt) => {
    const p = progress.current;
    if (!reduced) u.time.value += Math.min(dt, 0.05);
    const t = u.time.value;

    // the truck drives in, then holds
    const x = truckX(p);
    if (truck.current) truck.current.position.x = x;
    setPose(api.current, { lift: 0.32, roll: x - START_X });
    const F = v.f.set(x, 0, 0);

    // camera on the key curve, with a slow breath
    const { u: k, fov } = keyParam(p);
    posCurve.getPoint(k, v.a).add(F);
    tgtCurve.getPoint(k, v.b).add(F);
    if (!reduced) {
      v.a.x += Math.sin(t * 0.35) * 0.06;
      v.a.y += Math.sin(t * 0.5) * 0.03;
    }
    cam.position.copy(v.a);
    cam.lookAt(v.b);
    if (Math.abs(cam.fov - fov) > 0.001) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // light, sky and fog through the chapters
    const dark = smooth(range(p, 0.52, 0.63));
    const aerial = band(p, 0.14, 0.36, 0.5, 0.6);
    sunDir(p, v.s);
    if (sun.current) {
      sun.current.position.copy(F).addScaledVector(v.s, 40).add(new THREE.Vector3(3, 0, -4));
      sun.current.target.position.set(F.x + 3, 0, -4);
      sun.current.target.updateMatrixWorld();
      sun.current.intensity = (6.5 + aerial * 2.5) * (1 - dark);
    }
    if (rim.current) {
      rim.current.position.set(F.x - 1, 9, -12);
      rim.current.target.position.set(F.x, 1, 0);
      rim.current.target.updateMatrixWorld();
      rim.current.intensity = 6 * (1 - dark) * (1 - aerial * 0.6);
    }
    if (fill.current) {
      fill.current.position.set(F.x - 10, 7, 14);
      fill.current.target.position.set(F.x + 2, 0, -3);
      fill.current.target.updateMatrixWorld();
      fill.current.intensity = (0.1 + aerial * 0.5) * (1 - dark);
    }
    scene.environmentIntensity = (0.1 - aerial * 0.04) * (1 - dark);

    const su = skyMat.uniforms;
    (su.uSun.value as THREE.Vector3).copy(v.s);
    su.uDark.value = dark;
    if (sky.current) sky.current.position.copy(cam.position);
    fog.color.copy(cHot).lerp(cAerial, aerial).lerp(cInk, dark);
    fog.near = lerp(45, 20, smooth(range(p, 0.08, 0.38)));
    fog.far = lerp(320, 110, smooth(range(p, 0.08, 0.38)));
    land.color.copy(landBase).multiplyScalar(lerp(0.25, 1, smooth(range(p, 0.05, 0.3))));

    // the sun flare sits behind the cab, so the truck itself occludes it
    const sunVis = (1 - dark) * (1 - smooth(range(p, 0.12, 0.3)));
    const flick = reduced ? 1 : 0.94 + Math.sin(t * 1.7) * 0.04 + Math.sin(t * 4.3) * 0.02;
    for (const [g, d] of [[glowA, 22], [glowB, 21], [glowC, 21.5]] as const) {
      if (!g.current) continue;
      g.current.position.copy(cam.position).addScaledVector(v.s, d);
      (g.current.material as THREE.SpriteMaterial).opacity = sunVis * flick * (g === glowA ? 0.9 : g === glowB ? 1 : 0.3);
      g.current.visible = sunVis > 0.001;
    }

    // the dissolve and the wire chapters
    if (lamps.current) lamps.current.visible = p < 0.47;
    u.cut.value = lerp(3.3, -2.2, smooth(range(p, 0.45, 0.565)));
    u.lineMain.value = smooth(range(p, 0.44, 0.47)) * (1 - smooth(range(p, 0.8, 0.88)));
    u.pointMain.value = smooth(range(p, 0.45, 0.49)) * (1 - 0.7 * smooth(range(p, 0.84, 0.95)));
    u.lineWorld.value = smooth(range(p, 0.55, 0.63)) * (1 - smooth(range(p, 0.77, 0.86))) * 0.2;
    u.pointWorld.value = smooth(range(p, 0.53, 0.62)) * (1 - 0.75 * smooth(range(p, 0.82, 0.94)));
    u.drift.value = smooth(range(p, 0.64, 0.86)) * 2.2;
    u.grid.value = smooth(range(p, 0.73, 0.9));
    u.beam.value = range(p, 0.79, 0.98);
    u.beamOpacity.value = smooth(range(p, 0.79, 0.83));
    // in the dark the solids go, so the wire reads see through
    const show = p < 0.64;
    if (solids.current && solids.current.userData.shown !== show) {
      solids.current.userData.shown = show;
      solids.current.traverse((o) => {
        if (o.userData.wire) return;
        if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite) {
          let w: THREE.Object3D | null = o;
          while (w && !w.userData.wire) w = w.parent;
          if (!w) o.visible = show;
        }
      });
    }
  });

  const spill = useMemo(radialTexture, []);

  return (
    <>
      <Environment files="/hdri/venice_sunset_1k.hdr" environmentIntensity={0.28} environmentRotation={[0, Math.PI * 0.85, 0]} />
      <directionalLight
        ref={sun}
        color={new THREE.Color(C.white).lerp(new THREE.Color(C.tonedRed), 0.6)}
        intensity={6.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={rim} color={new THREE.Color(C.white).lerp(new THREE.Color(C.tonedRed), 0.12)} intensity={6} />
      <directionalLight ref={fill} color={new THREE.Color(C.white).lerp(new THREE.Color(C.lindeRed), 0.35)} intensity={0.3} />

      <mesh ref={sky} material={skyMat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[400, 48, 24]} />
      </mesh>

      <Glow ref={glowA} colour={C.tonedRed} size={16} />
      <Glow ref={glowB} colour={C.white} size={1.6} />
      <Glow ref={glowC} colour={C.white} size={1} scale={[34, 0.22, 1]} />

      <group ref={solids}>
        <Ground spill={spill} land={land} />
        <Yard u={u} />
        <Others u={u} progress={progress} />
      </group>

      <group ref={truck} position={[START_X, 0, 0]}>
        <Forklift apiRef={api} lift={0.32}>
          <Pallet position={[1.74, 0.05, 0]} />
        </Forklift>
        <group ref={lamps}>
          <Glow colour={C.white} size={0.55} opacity={0.75} position={[0.66, 2.08, 0.46]} />
          <Glow colour={C.white} size={0.55} opacity={0.75} position={[0.66, 2.08, -0.46]} />
          <Glow colour={C.tonedRed} size={0.5} opacity={0.9} position={[-0.55, 2.33, 0.42]} />
        </group>
      </group>
      <MainWire api={api} u={u} />

      <Grid u={u} />
      <Beams u={u} />
    </>
  );
}

// The ground. Near black land, and the yard slab lighter so the raking sun reads on it.
function Ground({ spill, land }: { spill: THREE.Texture; land: THREE.Material }) {
  const slab = useMemo(() => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(C.lightGrey).multiplyScalar(0.3), roughness: 0.95, specularIntensity: 0.2 }), []);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} material={land} receiveShadow userData={{ noEdges: true }}>
        <planeGeometry args={[600, 600]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[22, 0.005, -4]} material={slab} receiveShadow userData={{ noEdges: true }}>
        <planeGeometry args={[52, 34]} />
      </mesh>
      {/* sun spill on the land behind the truck in the opening */}
      <mesh rotation-x={-Math.PI / 2} position={[-28, 0.01, -9]} userData={{ noEdges: true }}>
        <planeGeometry args={[30, 10]} />
        <meshBasicMaterial map={spill} color={C.tonedRed} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

// Attaches glowing edge lines and dust points to a group, computed in its own space so they move
// with it. Lines and points fade with the world uniforms.
function useWire(ref: MutableRefObject<THREE.Group | null>, u: V3Uniforms, opts: { step?: number; keep?: number; angle?: number } = {}) {
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const seg = collectEdges(g, opts.angle ?? 28, g);
    const lines = new THREE.LineSegments(segmentsGeometry(seg), lineMaterial(C.white, u.lineWorld, u.noCut));
    const pts = new THREE.Points(pointsAlong(seg, opts.step ?? 0.35, 0.05, opts.keep ?? 0.8), pointMaterial(C.white, u.pointWorld, u.noCut, u, 3.4));
    lines.frustumCulled = false;
    pts.frustumCulled = false;
    lines.renderOrder = 5;
    pts.renderOrder = 6;
    const holder = new THREE.Group();
    holder.userData.wire = true;
    holder.add(lines, pts);
    g.add(holder);
    return () => {
      holder.removeFromParent();
      lines.geometry.dispose();
      pts.geometry.dispose();
      (lines.material as THREE.Material).dispose();
      (pts.material as THREE.Material).dispose();
    };
    // the wire is built once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// One random stream, seeded, so the yard is the same on every load.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// The yard. A long warehouse with lit dock doors under a ribbed canopy, painted bays, a fence and
// blocks of pallet stacks. Repeated parts are instanced.
function Yard({ u }: { u: V3Uniforms }) {
  const ref = useRef<THREE.Group>(null);
  useWire(ref, u, { step: 0.14, keep: 1 });

  const mats = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.85, metalness: 0.1 }),
      roof: new THREE.MeshStandardMaterial({ color: C.tonedTextGrey, roughness: 0.5, metalness: 0.45 }),
      door: new THREE.MeshStandardMaterial({ color: C.ink, emissive: new THREE.Color(C.white).lerp(new THREE.Color(C.tonedRed), 0.3), emissiveIntensity: 0.55, roughness: 0.9 }),
      frame: new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.6 }),
      paint: new THREE.MeshStandardMaterial({ color: C.lightGrey, roughness: 0.9 }),
      wrapRed: new THREE.MeshPhysicalMaterial({ color: C.lindeRed, roughness: 0.55, clearcoat: 0.3 }),
    }),
    [],
  );

  // stacks, x z height
  const stacks = useMemo(() => {
    const r = rng(7);
    const out: { x: number; z: number; h: number; ry: number; red: boolean }[] = [];
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 4; j++) {
        if (r() < 0.12) continue;
        out.push({ x: 9 + i * 1.45 + (i > 4 ? 1.6 : 0), z: -3.6 + j * 1.25, h: 1 + Math.floor(r() * 3), ry: (r() - 0.5) * 0.06, red: r() < 0.18 });
      }
    for (let i = 0; i < 11; i++)
      for (let j = 0; j < 2; j++) out.push({ x: 2 + i * 1.45, z: 8.2 + j * 1.25, h: 2 + Math.floor(r() * 2), ry: (r() - 0.5) * 0.05, red: r() < 0.15 });
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) if (r() > 0.2) out.push({ x: -7 + i * 1.45, z: -13.2 + j * 1.25, h: 1 + Math.floor(r() * 3), ry: (r() - 0.5) * 0.08, red: r() < 0.2 });
    return out;
  }, []);

  const deck = useRef<THREE.InstancedMesh>(null);
  const box = useRef<THREE.InstancedMesh>(null);
  const boxRed = useRef<THREE.InstancedMesh>(null);
  const ribs = useRef<THREE.InstancedMesh>(null);
  const posts = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.InstancedMesh>(null);
  const fence = useRef<THREE.InstancedMesh>(null);

  const levels = useMemo(() => stacks.flatMap((s) => Array.from({ length: s.h }, (_, l) => ({ ...s, y: l * 1.02 }))), [stacks]);
  const nRed = levels.filter((l) => l.red).length;
  const DOORS = 9;
  const doorX = (i: number) => 1.5 + i * 4.6;
  const stripes = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number }[] = [];
    for (let i = 0; i <= DOORS; i++) out.push({ x: doorX(i) - 2.3, z: -12.5, w: 0.12, d: 7 });
    for (let i = 0; i < 18; i++) out.push({ x: -4 + i * 2.6, z: 5.6, w: 1.4, d: 0.14 });
    return out;
  }, []);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    let a = 0, b = 0, c = 0;
    for (const l of levels) {
      o.position.set(l.x, l.y + 0.07, l.z);
      o.rotation.set(0, l.ry, 0);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      deck.current!.setMatrixAt(a++, o.matrix);
      o.position.y = l.y + 0.14 + 0.43;
      o.updateMatrix();
      if (l.red) boxRed.current!.setMatrixAt(c++, o.matrix);
      else box.current!.setMatrixAt(b++, o.matrix);
    }
    deck.current!.count = a;
    box.current!.count = b;
    boxRed.current!.count = c;
    for (let i = 0; i < 70; i++) {
      o.position.set(-0.8 + i * 0.66, 6.62, -13.2);
      o.rotation.set(0, 0, 0);
      o.updateMatrix();
      ribs.current!.setMatrixAt(i, o.matrix);
    }
    for (let i = 0; i < 6; i++) {
      o.position.set(-0.6 + i * 9.0, 3.1, -10.6);
      o.updateMatrix();
      posts.current!.setMatrixAt(i, o.matrix);
    }
    stripes.forEach((s, i) => {
      o.position.set(s.x, 0.012, s.z);
      o.scale.set(s.w, 1, s.d);
      o.updateMatrix();
      lines.current!.setMatrixAt(i, o.matrix);
    });
    o.scale.set(1, 1, 1);
    for (let i = 0; i < 14; i++) {
      o.position.set(-10.5, 1.0, -15 + i * 1.8);
      o.updateMatrix();
      fence.current!.setMatrixAt(i, o.matrix);
    }
    for (const m of [deck, box, boxRed, ribs, posts, lines, fence]) {
      m.current!.instanceMatrix.needsUpdate = true;
      m.current!.computeBoundingSphere();
    }
  }, [levels, stripes]);

  return (
    <group ref={ref}>
      {/* warehouse body and dock face */}
      <mesh position={[20, 4.2, -20]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[44, 8.4, 8]} />
      </mesh>
      <mesh position={[20, 8.55, -20]} material={mats.roof} castShadow>
        <boxGeometry args={[44.4, 0.3, 8.4]} />
      </mesh>
      {Array.from({ length: DOORS }, (_, i) => (
        <group key={i} position={[doorX(i), 0, -15.98]}>
          <mesh position={[0, 1.95, 0]} material={mats.frame}>
            <boxGeometry args={[3.3, 3.5, 0.12]} />
          </mesh>
          <mesh position={[0, 1.95, 0.07]} material={mats.door} userData={{ noEdges: true }}>
            <planeGeometry args={[2.9, 3.1]} />
          </mesh>
          <mesh position={[0, 0.55, 0.32]} material={mats.frame} castShadow>
            <boxGeometry args={[3.0, 1.1, 0.5]} />
          </mesh>
        </group>
      ))}
      {/* canopy over the docks, ribbed */}
      <mesh position={[20, 6.4, -13.2]} rotation-x={0.06} material={mats.roof} castShadow receiveShadow>
        <boxGeometry args={[44.2, 0.22, 5.8]} />
      </mesh>
      <instancedMesh ref={ribs} args={[undefined, undefined, 70]} material={mats.roof} castShadow userData={{ noEdges: true }}>
        <boxGeometry args={[0.14, 0.12, 5.8]} />
      </instancedMesh>
      <instancedMesh ref={posts} args={[undefined, undefined, 6]} material={mats.frame} castShadow>
        <boxGeometry args={[0.22, 6.2, 0.22]} />
      </instancedMesh>
      {/* painted bays and the lane line */}
      <instancedMesh ref={lines} args={[undefined, undefined, stripes.length]} material={mats.paint} receiveShadow>
        <boxGeometry args={[1, 0.01, 1]} />
      </instancedMesh>
      {/* a mesh fence on the yard edge */}
      <instancedMesh ref={fence} args={[undefined, undefined, 14]} material={mats.frame} castShadow>
        <boxGeometry args={[0.07, 2.0, 0.07]} />
      </instancedMesh>
      <mesh position={[-10.5, 1.9, -3.3]} material={mats.frame} castShadow>
        <boxGeometry args={[0.05, 0.05, 23.4]} />
      </mesh>
      <mesh position={[-10.5, 0.2, -3.3]} material={mats.frame} castShadow>
        <boxGeometry args={[0.05, 0.05, 23.4]} />
      </mesh>
      {/* pallet stacks */}
      <instancedMesh ref={deck} args={[undefined, undefined, levels.length]} material={M.pallet} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.14, 1.0]} />
      </instancedMesh>
      <instancedMesh ref={box} args={[undefined, undefined, levels.length]} material={M.card} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.86, 0.92]} />
      </instancedMesh>
      <instancedMesh ref={boxRed} args={[undefined, undefined, Math.max(1, nRed)]} material={mats.wrapRed} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.86, 0.92]} />
      </instancedMesh>
      {/* dock lamps */}
      {Array.from({ length: DOORS }, (_, i) => (
        <Glow key={i} colour={C.white} size={2.6} opacity={0.35} position={[doorX(i), 5.6, -15.4]} />
      ))}
    </group>
  );
}

// Two more trucks at work in the yard, each with its own wire for the dark chapter.
function Others({ u, progress }: { u: V3Uniforms; progress: Prog }) {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const apiA = useRef<ForkliftApi | null>(null);
  const apiB = useRef<ForkliftApi | null>(null);
  useWire(a, u, { step: 0.3, keep: 0.9 });
  useWire(b, u, { step: 0.3, keep: 0.9 });
  useFrame(() => {
    const p = progress.current;
    const ta = smooth(range(p, 0.12, 0.5));
    const tb = smooth(range(p, 0.18, 0.55));
    if (a.current) a.current.position.z = lerp(-4.5, -9.6, ta);
    if (b.current) b.current.position.x = lerp(25.5, 21.5, tb);
    setPose(apiA.current, { lift: 0.55, roll: ta * 5.1 });
    setPose(apiB.current, { lift: 0.12, roll: tb * 4 });
  });
  return (
    <>
      <group ref={a} position={[11.2, 0, -4.5]} rotation-y={Math.PI / 2}>
        <Forklift apiRef={apiA} lift={0.55}>
          <Pallet position={[1.74, 0.05, 0]} />
        </Forklift>
      </group>
      <group ref={b} position={[25.5, 0, 3.4]} rotation-y={Math.PI}>
        <Forklift apiRef={apiB} lift={0.12}>
          <Pallet position={[1.74, 0.05, 0]} />
        </Forklift>
      </group>
    </>
  );
}

// The main truck's wire. Its materials are swapped for dissolving clones, every mesh gets a child
// line set so the wire follows the wheels and forks, and dust points ride along.
function MainWire({ api, u }: { api: MutableRefObject<ForkliftApi | null>; u: V3Uniforms }) {
  useEffect(() => {
    let raf = 0;
    let undo: (() => void) | null = null;
    const build = () => {
      const a = api.current;
      if (!a) {
        raf = requestAnimationFrame(build);
        return;
      }
      const root = a.root;
      const cache = new Map<THREE.Material, THREE.Material>();
      const meshes: THREE.Mesh[] = [];
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
      });
      const white = lineMaterial(C.white, u.lineMain, u.cut, 0.9);
      const red = lineMaterial(C.tonedRed, u.lineMain, u.cut, 1.3);
      const before = meshes.map((m) => m.material as THREE.Material);
      const added: THREE.LineSegments[] = [];
      for (const m of meshes) {
        const src = m.material as THREE.Material;
        let d = cache.get(src);
        if (!d) {
          d = dissolve(src, u.cut);
          cache.set(src, d);
        }
        m.material = d;
        const isRed = src === M.paint;
        const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 24), isRed ? red : white);
        l.renderOrder = 5;
        m.add(l);
        added.push(l);
      }
      const seg = collectEdges(root, 24, root);
      const pts = new THREE.Points(pointsAlong(seg, 0.07, 0.03, 0.8), pointMaterial(C.white, u.pointMain, u.cut, u, 3.2));
      pts.renderOrder = 6;
      pts.frustumCulled = false;
      root.add(pts);
      undo = () => {
        meshes.forEach((m, i) => (m.material = before[i]));
        added.forEach((l) => {
          l.removeFromParent();
          l.geometry.dispose();
        });
        pts.removeFromParent();
        pts.geometry.dispose();
        cache.forEach((m) => m.dispose());
        white.dispose();
        red.dispose();
      };
    };
    build();
    return () => {
      cancelAnimationFrame(raf);
      undo?.();
    };
  }, [api, u]);
  return null;
}

// The tile grid of the last chapter.
function Grid({ u }: { u: V3Uniforms }) {
  const mat = useMemo(() => gridMaterial(u), [u]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} material={mat} renderOrder={2}>
      <planeGeometry args={[110, 110]} />
    </mesh>
  );
}

// Light trails that sweep in from the dark and land on the grid centre.
function Beams({ u }: { u: V3Uniforms }) {
  const beams = useMemo(() => {
    const c = new THREE.Vector3(0.6, 0.15, -0.6);
    const ends = [
      [-13, 7, -11],
      [12, 8, -12],
      [-12, 6, 10],
      [13, 7, 9],
    ];
    return ends.map((e, i) => {
      const s = new THREE.Vector3(...(e as [number, number, number]));
      const mid = s.clone().lerp(c, 0.55);
      mid.y = s.y * 0.35;
      mid.x += (i % 2 ? -1 : 1) * 1.6;
      const dir = s.clone().setY(0).sub(c.clone().setY(0)).normalize();
      const end = c.clone().addScaledVector(dir, 1.6);
      end.y = 0.6;
      const near = c.clone().addScaledVector(dir, 4.5);
      near.y = 1.4;
      const curve = new THREE.CatmullRomCurve3([s, mid, near, end]);
      return { geo: new THREE.TubeGeometry(curve, 90, 0.22, 12, false), mat: beamMaterial(u, i * 0.06) };
    });
  }, [u]);
  return (
    <>
      {beams.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={b.mat} renderOrder={7} frustumCulled={false} />
      ))}
    </>
  );
}

