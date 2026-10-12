// The Ekotehnika site in daylight, white and the LMH greys. The company building with real windows, a door, a canopy
// and a roof edge, its live 3D name in black, the van with its graphite livery, low poly trees, hedges and shrubs,
// lamp posts, kerbs, and the road that turns into the grey S path. Everything is still, the truck drives past it,
// so the parallax comes from the camera.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDING_X, ROUTE } from './route';
import { G, K, lam, lit, rng, signGeometry } from './kit';
import { BoxSet, Hedge, Kerb, LampPost, Planter, Trees, Van, type BoxItem, type TreeSpec } from './props';
import type { StoryClock } from '../../clock';
import Yard from './yard';

function Ribbon({ half, y, material, step = 4 }: { half: number; y: number; material: THREE.Material; step?: number }) {
  const geo = useMemo(() => {
    const pts = ROUTE.filter((_, i) => i % step === 0 || i === ROUTE.length - 1);
    const pos: number[] = [];
    const idx: number[] = [];
    pts.forEach((p, i) => {
      const nx = Math.sin(p.yaw);
      const nz = Math.cos(p.yaw);
      pos.push(p.x + nx * half, y, p.z + nz * half, p.x - nx * half, y, p.z - nz * half);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    g.setIndex(idx);
    return g;
  }, [half, y, step]);
  return <mesh geometry={geo} material={material} receiveShadow />;
}

// An edge line of the road, a thin lit ribbon.
function RoadEdge({ offset }: { offset: number }) {
  const geo = useMemo(() => {
    const pts = ROUTE.filter((_, i) => i % 4 === 0 || i === ROUTE.length - 1);
    const pos: number[] = [];
    const idx: number[] = [];
    const w = 0.07;
    pts.forEach((p, i) => {
      const nx = Math.sin(p.yaw);
      const nz = Math.cos(p.yaw);
      const o1 = offset + w;
      const o2 = offset - w;
      pos.push(p.x + nx * o1, 0.035, p.z + nz * o1, p.x + nx * o2, 0.035, p.z + nz * o2);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return g;
  }, [offset]);
  return <mesh geometry={geo} material={K.white} />;
}

// A white dashed centre line along the whole path.
function Centre() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(() => ROUTE.filter((_, i) => i % 16 === 0), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    pts.forEach((p, i) => {
      e.set(0, p.yaw, 0);
      q.setFromEuler(e);
      ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(p.x, 0.04, p.z), q, new THREE.Vector3(1, 1, 1)));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [pts]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]} material={K.white}>
      <boxGeometry args={[1.8, 0.01, 0.14]} />
    </instancedMesh>
  );
}

function Road() {
  const mat = K.road;
  return (
    <group>
      <Ribbon half={1.85} y={0.025} material={mat} />
      <RoadEdge offset={1.7} />
      <RoadEdge offset={-1.7} />
      <Centre />
    </group>
  );
}


// ---- the company building ---------------------------------------------------------------------------------

const wall = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.62) });
const wallPale = lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.6) });
const trim = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.5) });
const frameMat = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.5) });
const glassMat = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.85) });
const glassLight = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.75) });
const edgeMat = lam(G.mid);
const doorMat = lam(G.dark);

const FRONT = -9;
const BX0 = BUILDING_X - 13;
const BX1 = BUILDING_X + 13;

// A run of window modules on a facade. Each is a pale frame, a glass pane set back, a mullion and a transom.
function windowRun(xs: number[], w: number, y0: number, y1: number, z: number) {
  const h = y1 - y0;
  const frame: BoxItem[] = [];
  const glass: BoxItem[] = [];
  const bars: BoxItem[] = [];
  const sills: BoxItem[] = [];
  const reveal: BoxItem[] = [];
  xs.forEach((x) => {
    frame.push([x, y0 + h / 2, z + 0.03, w, h, 0.1]);
    glass.push([x, y0 + h / 2, z + 0.07, w - 0.16, h - 0.16, 0.04]);
    bars.push([x, y0 + h / 2, z + 0.11, 0.07, h - 0.1, 0.05]);
    bars.push([x, y0 + h * 0.72, z + 0.11, w - 0.1, 0.06, 0.05]);
    sills.push([x, y0 - 0.06, z + 0.1, w + 0.22, 0.1, 0.22]);
    reveal.push([x, y1 + 0.04, z + 0.08, w + 0.12, 0.08, 0.16]);
  });
  return { frame, glass, bars, sills, reveal };
}

function Facade({ x0, x1, h, z = FRONT, doorX, band = true, plain = 0 }: { x0: number; x1: number; h: number; z?: number; doorX?: number; band?: boolean; plain?: number }) {
  const set = useMemo(() => {
    const w = 2.3;
    const gap = 0.55;
    const pitch = w + gap;
    const xs: number[] = [];
    for (let x = x0 + 1.6 + w / 2; x < x1 - 1.4; x += pitch) {
      if (doorX !== undefined && Math.abs(x - doorX) < 2.6) continue;
      // the first wing is a solid wall, so the C1 title and lede sit on bare facade and not on window rows
      if (plain && x < x0 + plain) continue;
      xs.push(x);
    }
    const lower = windowRun(xs, w, 0.95, 2.45, z);
    const upper = band ? windowRun(xs, w, h - 1.85, h - 0.75, z) : null;
    return { lower, upper, xs };
  }, [x0, x1, h, z, doorX, plain, band]);
  const pilasters = useMemo(() => {
    const items: BoxItem[] = [];
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 4) items.push([x, h / 2, z + 0.06, 0.34, h, 0.14]);
    return items;
  }, [x0, x1, h, z]);
  const w = x1 - x0;
  const all = (k: 'frame' | 'glass' | 'bars' | 'sills' | 'reveal') => [...set.lower[k], ...(set.upper ? set.upper[k] : [])];
  return (
    <group>
      {/* the wall, a plinth, the floor slab edge and the roof edge with its shadow gap */}
      <mesh position={[(x0 + x1) / 2, h / 2, z - 5.5]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[w, h, 11]} />
      </mesh>
      <BoxSet items={[[(x0 + x1) / 2, 0.24, z + 0.05, w + 0.1, 0.48, 0.12]]} mat={trim} cast />
      <BoxSet items={[[(x0 + x1) / 2, 2.95, z + 0.07, w + 0.1, 0.4, 0.14]]} mat={wallPale} cast />
      <BoxSet items={[[(x0 + x1) / 2, 2.72, z + 0.02, w, 0.05, 0.04]]} mat={edgeMat} />
      <BoxSet items={[[(x0 + x1) / 2, h + 0.1, z + 0.12, w + 0.5, 0.22, 0.62]]} mat={wallPale} cast />
      <BoxSet items={[[(x0 + x1) / 2, h - 0.12, z + 0.02, w, 0.05, 0.04]]} mat={edgeMat} />
      <BoxSet items={pilasters} mat={wallPale} cast />
      <BoxSet items={all('frame')} mat={frameMat} cast />
      <BoxSet items={all('glass')} mat={glassMat} />
      <BoxSet items={all('bars')} mat={frameMat} />
      <BoxSet items={all('sills')} mat={trim} cast />
      <BoxSet items={all('reveal')} mat={trim} cast />
      {/* glass lines, a lighter band high in each pane so the glass reads as glass */}
      <BoxSet items={all('glass').map(([x, y, zz, ww, hh, d]) => [x, y + hh * 0.3, zz + 0.03, ww, hh * 0.28, d] as BoxItem)} mat={glassLight} />
      {doorX !== undefined && <Door x={doorX} z={z} />}
    </group>
  );
}

function Door({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <BoxSet items={[[0, 1.2, 0.04, 2.9, 2.5, 0.12]]} mat={frameMat} cast />
      <BoxSet items={[[-0.64, 1.1, 0.1, 1.2, 2.2, 0.05], [0.64, 1.1, 0.1, 1.2, 2.2, 0.05]]} mat={glassMat} />
      <BoxSet items={[[0, 2.32, 0.1, 2.6, 0.28, 0.05]]} mat={glassLight} />
      <BoxSet items={[[0, 1.1, 0.13, 0.06, 2.2, 0.05], [-0.62, 1.1, 0.13, 0.04, 2.2, 0.04], [0.62, 1.1, 0.13, 0.04, 2.2, 0.04]]} mat={doorMat} />
      <BoxSet items={[[-0.14, 1.05, 0.2, 0.04, 0.5, 0.05], [0.14, 1.05, 0.2, 0.04, 0.5, 0.05]]} mat={frameMat} />
      {/* canopy and its two posts, a step */}
      <BoxSet items={[[0, 2.78, 0.62, 3.8, 0.14, 1.5]]} mat={wallPale} cast />
      <BoxSet items={[[0, 2.7, 1.36, 3.8, 0.06, 0.04]]} mat={edgeMat} />
      <BoxSet items={[[-1.8, 1.38, 1.3, 0.07, 2.76, 0.07], [1.8, 1.38, 1.3, 0.07, 2.76, 0.07]]} mat={edgeMat} cast />
      <BoxSet items={[[0, 0.05, 0.9, 3.6, 0.1, 1.5]]} mat={trim} />
    </group>
  );
}

// The extension and the hall, plainer. A ribbed face, a roller door and a roof edge.
function Hall({ x, w, h, d, zc }: { x: number; w: number; h: number; d: number; zc: number }) {
  const front = zc + d / 2;
  const ribs = useMemo(() => {
    const items: BoxItem[] = [];
    for (let i = 0; i <= Math.floor(w / 0.9); i++) items.push([x - w / 2 + 0.3 + i * 0.9, h / 2, front + 0.02, 0.05, h - 0.5, 0.05]);
    return items;
  }, [x, w, h, front]);
  return (
    <group>
      <mesh position={[x, h / 2, zc]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <BoxSet items={ribs} mat={trim} />
      <BoxSet items={[[x, 0.2, front + 0.04, w + 0.1, 0.4, 0.1]]} mat={trim} cast />
      <BoxSet items={[[x, h + 0.1, front + 0.1, w + 0.4, 0.22, 0.5]]} mat={wallPale} cast />
      <BoxSet items={[[x, h - 0.14, front + 0.02, w, 0.05, 0.04]]} mat={edgeMat} />
      {/* roller door, a frame and slats */}
      <BoxSet items={[[x, 2.1, front + 0.05, 4.4, 4.2, 0.1]]} mat={frameMat} cast />
      <BoxSet items={Array.from({ length: 14 }, (_, i) => [x, 0.45 + i * 0.28, front + 0.12, 4.0, 0.03, 0.04] as BoxItem)} mat={edgeMat} />
    </group>
  );
}

function Building() {
  const sign = useMemo(() => signGeometry('EKOTEHNIKA', 0.9, 0.2), []);
  return (
    <group>
      <Facade x0={BX0} x1={BX1} h={6.4} doorX={BUILDING_X + 5.4} plain={11.5} />
      <Hall x={BUILDING_X + 20.5} w={14} h={4.6} d={9} zc={FRONT - 4.5} />
      {/* the live 3D name, Daxline caps, the one dark element on the wall */}
      <mesh geometry={sign} material={K.sign} position={[BUILDING_X + 0.2, 3.45, FRONT + 0.1]} castShadow />
    </group>
  );
}

// ---- trees and green ----------------------------------------------------------------------------------------

function Greenery() {
  const trees = useMemo<TreeSpec[]>(() => {
    const r = rng(21);
    const near: TreeSpec[] = [];
    // a tree row behind the front hedge, left of the building and on the far side of the hall
    for (let x = -62; x < BX0 - 3; x += 5 + r() * 3.5) near.push({ x, z: -5.4 - r() * 1.2, h: 4.4 + r() * 1.8 });
    near.push({ x: BX1 + 2, z: -6.1, h: 5.2 }, { x: BX1 + 6.2, z: -6.0, h: 4.4 });
    for (let x = 80; x < 96; x += 6 + r() * 3) near.push({ x, z: -5.8 - r() * 1.4, h: 4.6 + r() * 1.5 });
    // the far wood, a backdrop
    for (let i = 0; i < 44; i++) near.push({ x: -62 + i * 3.4 + r() * 2.5, z: -17 - r() * 22, h: 3.8 + r() * 2.6 });
    return near.map((t, i) => ({ ...t, v: i }));
  }, []);
  return <Trees items={trees} />;
}

function FrontGarden() {
  // hedge runs along the sidewalk, planters between them, a gap for the entrance path
  const hedges: { x: number; len: number }[] = [];
  const planters: { x: number; len: number; seed: number }[] = [];
  let x = -62;
  let i = 0;
  while (x < 84) {
    const hl = 9 + (i % 3) * 1.8;
    const pl = 3.6;
    if (x + hl > BUILDING_X + 7.4 && x < BUILDING_X + 12.4) {
      x = BUILDING_X + 12.6;
      continue;
    }
    hedges.push({ x, len: hl });
    planters.push({ x: x + hl + 0.3, len: pl, seed: i + 3 });
    x += hl + pl + 0.6;
    i++;
  }
  return (
    <group>
      {hedges.map((h) => (
        <Hedge key={h.x} x={h.x} z={-3.65} len={h.len} />
      ))}
      {planters.map((p) => (
        <Planter key={p.x} x={p.x} z={-3.65} len={p.len} seed={p.seed} s={0.95} d={1.2} />
      ))}
    </group>
  );
}

function Pavement() {
  // the sidewalk behind the road, the forecourt paving with its parking bays
  const bays = useMemo(() => {
    const items: BoxItem[] = [];
    for (const bx of [10.2, 16.4, 22.6]) items.push([bx, 0.012, -6.6, 0.07, 0.01, 5.0]);
    for (const bx of [48.2, 54.4, 60.6]) items.push([bx, 0.012, -6.6, 0.07, 0.01, 5.0]);
    return items;
  }, []);
  return (
    <group>
      <BoxSet items={[[-5, 0.03, -2.65, 170, 0.06, 1.1]]} mat={lam(G.pale)} />
      <BoxSet items={[[-5, 0.006, -6.3, 170, 0.012, 5.4]]} mat={lam(G.pale)} />
      <BoxSet items={bays} mat={new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false })} receive={false} />
    </group>
  );
}


// A band of haze along the horizon, so the site reads against the sky.
function Horizon() {
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  const mat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createLinearGradient(0, 256, 0, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.26, 'rgba(255,255,255,0)');
    grd.addColorStop(0.37, 'rgba(255,255,255,0.45)');
    grd.addColorStop(0.72, 'rgba(255,255,255,0.1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t, color: G.light, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false, fog: false });
  }, []);
  useFrame(() => {
    if (ref.current) ref.current.position.x = camera.position.x;
  });
  return (
    <mesh ref={ref} position={[0, 26, -230]} material={mat} renderOrder={-5}>
      <planeGeometry args={[900, 110]} />
    </mesh>
  );
}

export default function Outdoor({ clock }: { clock?: StoryClock }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, -0.02, -60]} material={K.ground} receiveShadow>
        <planeGeometry args={[550, 440]} />
      </mesh>
      <Road />
      <Kerb x0={-90} x1={78} z={-2.12} />
      <Kerb x0={-90} x1={78} z={2.12} />
      <Pavement />
      <Building />
      <FrontGarden />
      <Van x={13} z={-5.9} yaw={0.03} />
      <Van x={19.5} z={-7.4} yaw={-0.12} />
      <Van x={52} z={-5.9} yaw={Math.PI} />
      <Greenery />
      {[-5.5, 14, 53, 70].map((lx) => (
        <LampPost key={lx} x={lx} z={-2.9} h={4.1} />
      ))}
      <Yard clock={clock} />
      <Horizon />
    </group>
  );
}
