// The tech sequence. A lit Linde forklift at dusk, scanned into glowing edges, dissolved into a
// particle cloud that swirls and settles into a receding floor of rounded tiles, with smoke beams
// converging on it. Everything reads one progress value p from 0 to 1.
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Forklift, Pallet, type ForkliftApi } from '../../r3f/Forklift';
import { Glow } from '../../r3f/Studio';
import { Environment } from '@react-three/drei';
import { M } from '../../r3f/materials';
import { C } from '../../tokens';
import { band, range, smooth, clamp01 } from '../../scroll/useScrollStory';
import * as S from './shaders';

export type Clock = { p: () => number };

const col = (hex: string) => new THREE.Color().setStyle(hex, THREE.NoColorSpace);
const ink = col(C.ink);
const red = col(C.lindeRed);
const toned = col(C.tonedRed);
const deep = col(C.primary900);
const white = col(C.white);

// Camera keys. Positions run through a Catmull Rom curve so the move never stops between keys.
const KEYS: { p: number; pos: [number, number, number]; tgt: [number, number, number] }[] = [
  { p: 0.0, pos: [0.9, 0.8, 10.2], tgt: [0.6, 1.5, 0] },
  { p: 0.06, pos: [2.2, 1.25, 9.6], tgt: [0.5, 1.2, 0] },
  { p: 0.14, pos: [6.4, 3.4, 7.6], tgt: [0.4, 0.95, 0] },
  { p: 0.24, pos: [7.6, 5.0, 3.6], tgt: [0.2, 0.9, 0] },
  { p: 0.34, pos: [3.6, 7.6, 7.4], tgt: [0.0, 0.6, -0.5] },
  { p: 0.45, pos: [0.4, 11.0, 6.4], tgt: [0.0, 0.0, -0.6] },
  { p: 0.56, pos: [0.0, 9.4, 4.4], tgt: [0.0, 0.0, -2.1] },
  { p: 0.68, pos: [0.0, 8.6, 2.9], tgt: [0.0, 0.0, -3.4] },
  { p: 1.0, pos: [0.0, 8.3, 2.4], tgt: [0.0, 0.0, -3.7] },
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal');
const tgtCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.tgt)), false, 'centripetal');
function keyParam(p: number) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (p <= KEYS[i + 1].p) return (i + (p - KEYS[i].p) / (KEYS[i + 1].p - KEYS[i].p)) / (KEYS.length - 1);
  }
  return 1;
}

function Rig({ clock }: { clock: Clock }) {
  const camera = useThree((s) => s.camera);
  const v = useMemo(() => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3() }), []);
  useFrame(({ clock: c }) => {
    const p = clock.p();
    const u = keyParam(clamp01(p));
    posCurve.getPoint(u, v.pos);
    tgtCurve.getPoint(u, v.tgt);
    const t = c.elapsedTime;
    v.pos.x += Math.sin(t * 0.21) * 0.08;
    v.pos.y += Math.sin(t * 0.17) * 0.05;
    camera.position.copy(v.pos);
    camera.lookAt(v.tgt);
  });
  return null;
}

function Sky({ clock }: { clock: Clock }) {
  const camera = useThree((s) => s.camera);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: S.skyVert,
        fragmentShader: S.skyFrag,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uHorizon: { value: 0 },
          uSky: { value: 1 },
          uInk: { value: ink },
          uRed: { value: red },
          uToned: { value: toned },
          uDeep: { value: deep },
          uWhite: { value: white },
        },
      }),
    [],
  );
  const far = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = clock.p();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    far.copy(camera.position).addScaledVector(dir, 2000);
    far.y = 0;
    far.project(camera);
    mat.uniforms.uHorizon.value = far.y;
    mat.uniforms.uSky.value = 1 - smooth(range(p, 0.04, 0.17));
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

// A dark ground that fades out with distance so it meets the sky at the horizon.
function Ground({ clock }: { clock: Clock }) {
  const alpha = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, '#fff');
    grd.addColorStop(0.55, '#fff');
    grd.addColorStop(1, '#000');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.92, metalness: 0, envMapIntensity: 0.15, transparent: true, alphaMap: alpha, depthWrite: false }),
    [alpha],
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const o = 1 - smooth(range(clock.p(), 0.17, 0.3));
    mat.opacity = o;
    mat.color.set(C.ink).multiplyScalar(0.16);
    if (ref.current) ref.current.visible = o > 0.001;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} receiveShadow material={mat} renderOrder={-5}>
      <planeGeometry args={[60, 60]} />
    </mesh>
  );
}

type Built = { lines: THREE.BufferGeometry; points: THREE.BufferGeometry };

const N_POINTS = 17000;

function buildTruck(root: THREE.Group, plane: THREE.Plane): Built {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const meshes: { mesh: THREE.Mesh; m: THREE.Matrix4; red: boolean }[] = [];
  const clones = new Map<THREE.Material, THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.material as THREE.Material;
    const orig = (src.userData.src as THREE.Material | undefined) ?? src;
    let c = clones.get(orig);
    if (!c) {
      c = orig.clone();
      c.userData.src = orig;
      c.clippingPlanes = [plane];
      c.clipShadows = true;
      clones.set(orig, c);
    }
    mesh.material = c;
    const isRed = orig === M.paint || orig === M.beacon;
    meshes.push({ mesh, m: new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld), red: isRed });
  });

  // Edges, red on the painted body, white elsewhere.
  const edgeList: THREE.BufferGeometry[] = [];
  const cRed = col(C.tonedRed).multiplyScalar(1.15);
  const cWhite = new THREE.Color(0.82, 0.82, 0.84);
  for (const { mesh, m, red: isRed } of meshes) {
    const e = new THREE.EdgesGeometry(mesh.geometry, 24);
    e.applyMatrix4(m);
    const n = e.attributes.position.count;
    const colours = new Float32Array(n * 3);
    const cc = isRed ? cRed : cWhite;
    for (let i = 0; i < n; i++) cc.toArray(colours, i * 3);
    e.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    edgeList.push(e);
  }
  const lines = mergeGeometries(edgeList, false)!;
  edgeList.forEach((g) => g.dispose());

  // Surface samples, weighted by area.
  const samplers = meshes.map((x) => {
    const s = new MeshSurfaceSampler(x.mesh).build();
    const d = (s as unknown as { distribution: Float32Array }).distribution;
    return { ...x, s, area: d[d.length - 1] };
  });
  const total = samplers.reduce((a, b) => a + b.area, 0);
  const pos = new Float32Array(N_POINTS * 3);
  const colours = new Float32Array(N_POINTS * 3);
  const rand = new Float32Array(N_POINTS * 3);
  const target = new Float32Array(N_POINTS * 3);
  const v = new THREE.Vector3();
  let k = 0;
  for (let si = 0; si < samplers.length && k < N_POINTS; si++) {
    const x = samplers[si];
    const want = si === samplers.length - 1 ? N_POINTS - k : Math.round((x.area / total) * N_POINTS);
    for (let j = 0; j < want && k < N_POINTS; j++, k++) {
      x.s.sample(v);
      v.applyMatrix4(x.m);
      v.toArray(pos, k * 3);
      const c = x.red && Math.random() < 0.55 ? cRed : white;
      c.toArray(colours, k * 3);
    }
  }
  for (let i = 0; i < N_POINTS; i++) {
    rand[i * 3] = Math.random();
    rand[i * 3 + 1] = Math.random();
    rand[i * 3 + 2] = Math.random();
    // Settle onto the gaps between tiles, denser near the centre.
    const along = (Math.random() * 2 - 1) * 13 * Math.sqrt(Math.random());
    const line = Math.round((Math.random() * 2 - 1) * 12 * Math.sqrt(Math.random())) + 0.5;
    const onX = Math.random() < 0.5;
    target[i * 3] = onX ? line : along;
    target[i * 3 + 1] = 0.03;
    target[i * 3 + 2] = (onX ? along : line) - 0.6;
  }
  const points = new THREE.BufferGeometry();
  points.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  points.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  points.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
  points.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
  points.computeBoundingSphere();
  points.boundingSphere!.radius = 40;
  return { lines, points };
}

function lineMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: S.lineVert,
    fragmentShader: S.lineFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uSweep: { value: 10 }, uOpacity: { value: 0 }, uTime: { value: 0 } },
  });
}

function pointMaterial(dpr: number) {
  return new THREE.ShaderMaterial({
    vertexShader: S.pointVert,
    fragmentShader: S.pointFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uScatter: { value: 0 },
      uSwirl: { value: 0 },
      uSettle: { value: 0 },
      uSize: { value: 30 },
      uDpr: { value: dpr },
      uOpacity: { value: 0 },
    },
  });
}

const GHOSTS: { pos: [number, number, number]; rot: number }[] = [
  { pos: [-5.5, 0, -7.5], rot: 0.5 },
  { pos: [7.5, 0, -6.0], rot: -0.9 },
  { pos: [-9.0, 0, 1.5], rot: 1.6 },
];

function Truck({ clock }: { clock: Clock }) {
  const api = useRef<ForkliftApi | null>(null);
  const gl = useThree((s) => s.gl);
  const dpr = useThree((s) => s.viewport.dpr);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10), []);
  const [built, setBuilt] = useState<Built | null>(null);
  const lineMat = useMemo(lineMaterial, []);
  const ghostLineMat = useMemo(lineMaterial, []);
  const pointMat = useMemo(() => pointMaterial(dpr), [dpr]);
  const ghostPointMat = useMemo(() => pointMaterial(dpr), [dpr]);
  const sheetMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: S.beamVert,
        fragmentShader: S.sheetFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uOpacity: { value: 0 } },
      }),
    [],
  );
  const solid = useRef<THREE.Group>(null);
  const sheet = useRef<THREE.Group>(null);

  useEffect(() => {
    gl.localClippingEnabled = true;
    const id = requestAnimationFrame(() => {
      const root = api.current?.root;
      if (root) setBuilt(buildTruck(root, plane));
    });
    return () => cancelAnimationFrame(id);
  }, [gl, plane]);

  useEffect(
    () => () => {
      built?.lines.dispose();
      built?.points.dispose();
    },
    [built],
  );

  useFrame(({ clock: c }) => {
    const p = clock.p();
    const t = c.elapsedTime;
    // The scan runs from the fork tips to the counterweight.
    const sw = smooth(range(p, 0.065, 0.165));
    const sweep = THREE.MathUtils.lerp(2.6, -1.75, sw);
    plane.constant = sw <= 0 ? 10 : sw >= 1 ? -10 : sweep;
    if (solid.current) solid.current.visible = sw < 1;
    if (sheet.current) {
      sheet.current.position.x = sweep;
      sheet.current.visible = sw > 0 && sw < 1;
    }
    sheetMat.uniforms.uOpacity.value = Math.sin(Math.PI * sw);

    lineMat.uniforms.uSweep.value = sw <= 0 ? 10 : sw >= 1 ? -10 : sweep;
    lineMat.uniforms.uOpacity.value = smooth(range(p, 0.065, 0.09)) * (1 - smooth(range(p, 0.2, 0.27)));
    lineMat.uniforms.uTime.value = t;
    ghostLineMat.uniforms.uSweep.value = -10;
    ghostLineMat.uniforms.uOpacity.value = band(p, 0.15, 0.22, 0.3, 0.38) * 0.22;
    ghostLineMat.uniforms.uTime.value = t;

    const pu = pointMat.uniforms;
    pu.uTime.value = t;
    pu.uScatter.value = smooth(range(p, 0.21, 0.37));
    pu.uSwirl.value = smooth(range(p, 0.26, 0.5)) * 2.4;
    pu.uSettle.value = smooth(range(p, 0.43, 0.56));
    pu.uOpacity.value = smooth(range(p, 0.16, 0.21)) * (1 - 0.45 * smooth(range(p, 0.5, 0.58))) * (1 - smooth(range(p, 0.66, 0.72)));
    const gu = ghostPointMat.uniforms;
    gu.uTime.value = t;
    gu.uOpacity.value = band(p, 0.16, 0.23, 0.32, 0.4) * 0.45;
    gu.uScatter.value = smooth(range(p, 0.28, 0.4)) * 0.6;
  });

  return (
    <group>
      <group ref={solid}>
        <Forklift apiRef={api} lift={0.32}>
          <Pallet position={[1.74, 0.05, 0]} />
        </Forklift>
      </group>
      <group ref={sheet} visible={false}>
        <mesh rotation-y={Math.PI / 2} position={[0, 1.35, 0]} material={sheetMat}>
          <planeGeometry args={[1.9, 2.9]} />
        </mesh>
        <Glow colour={C.white} size={1.4} opacity={0.35} position={[0, 0.25, 0]} />
      </group>
      {built && (
        <>
          <lineSegments geometry={built.lines} material={lineMat} frustumCulled={false} />
          <points geometry={built.points} material={pointMat} frustumCulled={false} />
          {GHOSTS.map((g, i) => (
            <group key={i} position={g.pos} rotation-y={g.rot}>
              <lineSegments geometry={built.lines} material={ghostLineMat} frustumCulled={false} />
              <points geometry={built.points} material={ghostPointMat} frustumCulled={false} />
            </group>
          ))}
        </>
      )}
    </group>
  );
}

// Fine dust in the dark volume.
function Dust({ clock }: { clock: Clock }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geo = useMemo(() => {
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const rand = new Float32Array(n * 3);
    const colours = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 22;
      pos[i * 3 + 1] = Math.random() * 9 + 0.1;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 20 - 4;
      rand[i * 3] = Math.random();
      rand[i * 3 + 1] = Math.random();
      rand[i * 3 + 2] = Math.random();
      (Math.random() < 0.12 ? toned : white).toArray(colours, i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
    g.setAttribute('aTarget', new THREE.BufferAttribute(pos.slice(), 3));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = pointMaterial(dpr);
    m.uniforms.uSize.value = 22;
    return m;
  }, [dpr]);
  useFrame(({ clock: c }) => {
    const p = clock.p();
    mat.uniforms.uTime.value = c.elapsedTime;
    mat.uniforms.uScatter.value = 1;
    mat.uniforms.uSwirl.value = p * 0.8;
    mat.uniforms.uOpacity.value = band(p, 0.1, 0.22, 0.55, 0.68) * 0.7;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

const GRID = 52;

function Tiles({ clock }: { clock: Clock }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    const phase = new Float32Array(GRID * GRID);
    for (let i = 0; i < phase.length; i++) phase[i] = Math.random();
    g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: S.tileVert,
        fragmentShader: S.tileFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uReveal: { value: 0 },
          uOpacity: { value: 1 },
          uTime: { value: 0 },
          uSweep: { value: new THREE.Vector2(-14, -2) },
          uSweepOn: { value: 0 },
          uRed: { value: toned },
          uFace: { value: col(C.ink).multiplyScalar(0.62) },
        },
      }),
    [],
  );
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    let i = 0;
    for (let x = 0; x < GRID; x++)
      for (let z = 0; z < GRID; z++) {
        m.makeTranslation(x - GRID / 2, 0.004, z - GRID / 2 - 0.6);
        mesh.setMatrixAt(i++, m);
      }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame(({ clock: c }) => {
    const p = clock.p();
    const t = c.elapsedTime;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uReveal.value = smooth(range(p, 0.28, 0.52));
    mat.uniforms.uOpacity.value = 1 - smooth(range(p, 0.68, 0.74));
    const s = range(p, 0.42, 0.7);
    mat.uniforms.uSweep.value.set(THREE.MathUtils.lerp(-13, 13, smooth(s)) + Math.sin(t * 0.4) * 0.8, -2.4 + Math.sin(t * 0.3 + s * 4) * 1.6);
    mat.uniforms.uSweepOn.value = smooth(range(p, 0.38, 0.46));
    if (ref.current) ref.current.visible = p > 0.26;
  });
  return <instancedMesh ref={ref} args={[geo, mat, GRID * GRID]} frustumCulled={false} renderOrder={-4} />;
}

// Smoke beams curving in from the four screen corners to one point on the grid.
const BEAM_CAM = new THREE.Vector3(0.4, 11, 6.4);
const BEAM_HEAD = new THREE.Vector3(0, 0.25, -0.6);
// Angles are around the head on the floor, negative z is the top of the screen.
const BEAMS = [
  { a: -2.45, r: 12.5, y: 2.2, bend: 0.85, w: 2.2, seed: 0.1, red: false },
  { a: -0.7, r: 12.0, y: 2.0, bend: -0.85, w: 2.1, seed: 2.3, red: false },
  { a: 2.3, r: 6.2, y: 1.2, bend: -0.6, w: 1.2, seed: 4.1, red: true },
  { a: 0.85, r: 6.4, y: 1.3, bend: 0.65, w: 1.3, seed: 6.7, red: false },
  { a: -1.65, r: 15.0, y: 3.2, bend: 0.45, w: 1.6, seed: 8.2, red: false },
];

function ribbon(curve: THREE.Curve<THREE.Vector3>, w0: number, w1: number, segs = 72) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const to = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPoint(t, p);
    curve.getTangent(t, tan);
    to.copy(BEAM_CAM).sub(p).normalize();
    side.crossVectors(tan, to).normalize();
    const w = THREE.MathUtils.lerp(w0, w1, Math.pow(t, 0.6));
    pos.push(p.x + side.x * w, p.y + side.y * w, p.z + side.z * w, p.x - side.x * w, p.y - side.y * w, p.z - side.z * w);
    uv.push(t, 0, t, 1);
    if (i < segs) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function Beams({ clock }: { clock: Clock }) {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      BEAMS.map((b) => {
        const start = new THREE.Vector3(Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r - 0.6);
        const ctrl = new THREE.Vector3(Math.cos(b.a + b.bend) * b.r * 0.5, b.y * 0.8, Math.sin(b.a + b.bend) * b.r * 0.5 - 0.6);
        const end = BEAM_HEAD.clone().add(new THREE.Vector3(Math.cos(b.a) * 0.35, 0, Math.sin(b.a) * 0.35));
        const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
        const geo = ribbon(curve, b.w, 0.05);
        const mat = new THREE.ShaderMaterial({
          vertexShader: S.beamVert,
          fragmentShader: S.beamFrag,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uOpacity: { value: 0 },
            uGrow: { value: 0 },
            uSeed: { value: b.seed },
            uColor: { value: b.red ? col(C.tonedRed) : new THREE.Color(0.92, 0.92, 0.94) },
          },
        });
        return { geo, mat, red: b.red };
      }),
    [],
  );
  const glow = useRef<THREE.Group>(null);
  useFrame(({ clock: c }) => {
    const p = clock.p();
    const t = c.elapsedTime;
    const on = band(p, 0.3, 0.4, 0.56, 0.66);
    items.forEach((it, i) => {
      it.mat.uniforms.uTime.value = t;
      it.mat.uniforms.uOpacity.value = on * (it.red ? 1.25 : 1);
      it.mat.uniforms.uGrow.value = 0.06 + 0.94 * smooth(range(p, 0.3 + i * 0.012, 0.43 + i * 0.012));
    });
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.12) * 0.08 + (p - 0.47) * 1.1;
      group.current.visible = on > 0.001;
    }
    if (glow.current) {
      glow.current.visible = on > 0.001;
      glow.current.scale.setScalar(0.8 + 0.2 * Math.sin(t * 1.3));
    }
  });
  return (
    <>
      <group ref={group} position={[0, 0, -0.6]}>
        <group position={[0, 0, 0.6]}>
          {items.map((it, i) => (
            <mesh key={i} geometry={it.geo} material={it.mat} frustumCulled={false} />
          ))}
        </group>
      </group>
      <group ref={glow} position={BEAM_HEAD}>
        <Glow colour={C.white} size={1.1} opacity={0.32} />
        <Glow colour={C.tonedRed} size={3.2} opacity={0.18} />
      </group>
    </>
  );
}

// Back light behind the truck on the horizon, gone once the sky goes dark.
function Horizon({ clock }: { clock: Clock }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const o = 1 - smooth(range(clock.p(), 0.03, 0.14));
    if (ref.current) {
      ref.current.visible = o > 0.001;
      ref.current.children.forEach((s) => {
        const m = (s as THREE.Sprite).material as THREE.SpriteMaterial;
        m.opacity = o * (s.userData.o as number);
      });
    }
  });
  return (
    <group ref={ref}>
      <Glow colour={C.tonedRed} size={14} opacity={0.35} position={[2.5, 0.4, -14]} userData={{ o: 0.35 }} />
      <Glow colour={C.white} size={5} opacity={0.2} position={[4.5, 0.2, -10]} userData={{ o: 0.2 }} />
    </group>
  );
}

export function SceneContents({ clock, invalidateRef }: { clock: Clock; invalidateRef?: MutableRefObject<(() => void) | null> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (invalidateRef) invalidateRef.current = invalidate;
  }, [invalidate, invalidateRef]);
  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <Rig clock={clock} />
      <Sky clock={clock} />
      <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={0.22} />
      <directionalLight
        position={[7.5, 3.4, 6.5]}
        intensity={4.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-3, 4, -8]} intensity={2.2} color={C.white} />
      <directionalLight position={[-6, 2, 4]} intensity={0.5} color={C.tonedRed} />
      <Horizon clock={clock} />
      <Ground clock={clock} />
      <Tiles clock={clock} />
      <Truck clock={clock} />
      <Dust clock={clock} />
      <Beams clock={clock} />
    </>
  );
}
