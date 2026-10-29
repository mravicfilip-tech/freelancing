// The Ekotehnika site in daylight, white and the LMH greys. The company building with real windows, a door, a canopy
// and a roof edge, cladding seams, downpipes and a contact shadow along its foot, its name as the real wordmark extruded
// from the brand file, the service vans in their wrap, low poly trees in kerbed pits, hedges and shrubs, lamp posts,
// kerbs, and the road that turns into the grey S path. Everything is still, the truck drives past it, so the parallax comes from the camera.
// On load the road, the kerbs and the pavement draw along and everything else rises out of the ground (props.tsx).
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDING_X, ROUTE } from './route';
import { G, K, lam, lit, rng, wordmarkSign } from './kit';
import { BoxSet, Hedge, Kerb, LampPost, Planter, Rise, Trees, Van, introClock, introFront, stripShadowMaterial, type BoxItem, type TreeSpec } from './props';
import type { StoryClock } from '../../clock';
import Yard from './yard';

// Draws a strip built along the route on from the left during the build in. xs is the x of each of its route points,
// per the index count of one point's quad.
function useDrawAlong(geo: THREE.BufferGeometry, xs: number[], per = 6) {
  const landed = useRef(false);
  useFrame(() => {
    if (landed.current) return;
    const f = introFront(introClock());
    landed.current = f === Infinity;
    let k = 0;
    while (k < xs.length && xs[k] < f) k++;
    geo.setDrawRange(0, landed.current ? Infinity : Math.max(0, k - 1) * per);
  });
}

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
  const xs = useMemo(() => ROUTE.filter((_, i) => i % step === 0 || i === ROUTE.length - 1).map((p) => p.x), [step]);
  useDrawAlong(geo, xs);
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
  const xs = useMemo(() => ROUTE.filter((_, i) => i % 4 === 0 || i === ROUTE.length - 1).map((p) => p.x), []);
  useDrawAlong(geo, xs);
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
  const landed = useRef(false);
  useFrame(() => {
    if (!ref.current || landed.current) return;
    const f = introFront(introClock());
    landed.current = f === Infinity;
    let k = 0;
    while (k < pts.length && pts[k].x < f) k++;
    ref.current.count = landed.current ? pts.length : k;
  });
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
const pipeMat = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.3) });
const footMat = stripShadowMaterial(0.32);

// A soft contact shadow along the foot of a wall that faces +z, w long, its wall edge at z.
function WallFoot({ x, z, w, d = 1.3 }: { x: number; z: number; w: number; d?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[x, 0.024, z + d / 2]} material={footMat} renderOrder={1}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

// A downpipe from the roof edge to the ground, with its brackets and the shoe at the foot.
function Downpipe({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group position={[x, 0, z + 0.16]}>
      <mesh position={[0, h / 2, 0]} material={pipeMat} castShadow>
        <cylinderGeometry args={[0.055, 0.055, h, 10]} />
      </mesh>
      <BoxSet items={[0.9, h * 0.4, h * 0.75].map((y) => [0, y, -0.06, 0.16, 0.05, 0.12] as BoxItem)} mat={edgeMat} />
      <BoxSet items={[[0.06, 0.1, 0.04, 0.2, 0.08, 0.14]]} mat={pipeMat} />
    </group>
  );
}

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
      {/* a downpipe at each end, the shadow along the foot. The solid wing stays bare, the C1 title sits on it. */}
      <Downpipe x={x0 + 0.5} z={z} h={h} />
      <Downpipe x={x1 - 0.5} z={z} h={h} />
      <WallFoot x={(x0 + x1) / 2} z={z + 0.12} w={w + 0.4} />
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
      {/* a plain address plate beside the door and a lamp under the canopy */}
      <BoxSet items={[[1.95, 1.6, 0.08, 0.5, 0.34, 0.04]]} mat={edgeMat} />
      <BoxSet items={[[1.95, 1.6, 0.1, 0.44, 0.28, 0.02]]} mat={frameMat} />
      <BoxSet items={[[0, 2.69, 0.9, 0.6, 0.04, 0.2]]} mat={glassLight} />
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
      {/* the roller door's guide rails and head box, two bollards, a side door with its frame and handle */}
      <BoxSet items={[[x - 2.25, 2.1, front + 0.12, 0.1, 4.2, 0.1], [x + 2.25, 2.1, front + 0.12, 0.1, 4.2, 0.1], [x, 4.35, front + 0.18, 4.7, 0.3, 0.3]]} mat={pipeMat} cast />
      <BoxSet items={[[x - 2.7, 0.5, front + 0.5, 0.18, 1.0, 0.18], [x + 2.7, 0.5, front + 0.5, 0.18, 1.0, 0.18]]} mat={doorMat} cast />
      <BoxSet items={[[x - 2.7, 0.78, front + 0.5, 0.2, 0.1, 0.2], [x + 2.7, 0.78, front + 0.5, 0.2, 0.1, 0.2]]} mat={trim} />
      <BoxSet items={[[x + 4.6, 1.1, front + 0.05, 1.2, 2.2, 0.08]]} mat={edgeMat} cast />
      <BoxSet items={[[x + 4.6, 1.06, front + 0.1, 1.04, 2.1, 0.04]]} mat={frameMat} />
      <BoxSet items={[[x + 4.25, 1.05, front + 0.14, 0.04, 0.2, 0.05]]} mat={doorMat} />
      <WallFoot x={x} z={front + 0.1} w={w + 0.4} />
    </group>
  );
}

// The company name on the wall is the real wordmark of public/brand/ekotehnika.svg, extruded from the file's own paths
// with each path's own fill, the grey letters and tagline and the red mark, shaded as the rest of the scene is. It is
// 6.2 m wide, the free stretch of wall between the cladding band and the upper window sills holds 1.27 m of height, and
// its letters start at the left edge of the sign it replaced. Letters stand 0.2 m proud, the tagline 0.06 m.
const SIGN_W = 6.2;
const SIGN_BOTTOM = 3.2;

export function Building() {
  const sign = useMemo(() => {
    const { parts, s, view } = wordmarkSign(SIGN_W, 0.2, 0.06);
    return { parts: parts.map((p) => ({ ...p, material: lam(p.fill, { emissive: lit(p.fill).multiplyScalar(0.5) }) })), s, view };
  }, []);
  return (
    <group>
      <Rise x={BUILDING_X} depth={7.6}>
        <Facade x0={BX0} x1={BX1} h={6.4} doorX={BUILDING_X + 5.4} plain={11.5} />
        {/* the real wordmark, extruded from the brand file, the file's y runs down so the group is flipped */}
        <group position={[BUILDING_X + 0.2 - sign.s * sign.view[0], SIGN_BOTTOM + sign.s * (sign.view[1] + sign.view[3]), FRONT + 0.1]} scale={[sign.s, -sign.s, sign.s]}>
          {sign.parts.map((p, i) => (
            <mesh key={i} geometry={p.geo} material={p.material} castShadow />
          ))}
        </group>
      </Rise>
      <Rise x={BUILDING_X + 20.5} depth={5.8}>
        <Hall x={BUILDING_X + 20.5} w={14} h={4.6} d={9} zc={FRONT - 4.5} />
      </Rise>
    </group>
  );
}

// ---- trees and green ----------------------------------------------------------------------------------------

export function Greenery() {
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
  return <Trees items={trees} rise />;
}

export function FrontGarden() {
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
        <Rise key={h.x} x={h.x + h.len / 2} depth={1}>
          <Hedge x={h.x} z={-3.65} len={h.len} />
        </Rise>
      ))}
      {planters.map((p) => (
        <Rise key={p.x} x={p.x + p.len / 2} depth={1.2}>
          <Planter x={p.x} z={-3.65} len={p.len} seed={p.seed} s={0.95} d={1.2} />
        </Rise>
      ))}
    </group>
  );
}

export function Pavement() {
  // the sidewalk behind the road, the forecourt paving with its parking bays
  const bays = useMemo(() => {
    const items: BoxItem[] = [];
    for (const bx of [10.2, 16.4, 22.6]) items.push([bx, 0.012, -6.6, 0.07, 0.01, 5.0]);
    for (const bx of [48.2, 54.4, 60.6]) items.push([bx, 0.012, -6.6, 0.07, 0.01, 5.0]);
    return items;
  }, []);
  // the paving draws along from its left end at x -90 with the road, the bay lines show as the front passes them
  const pave = useRef<THREE.Group>(null);
  const lines = useRef<THREE.Group>(null);
  const landed = useRef(false);
  useFrame(() => {
    if (landed.current || !pave.current || !lines.current) return;
    const f = introFront(introClock());
    landed.current = f === Infinity;
    pave.current.scale.x = landed.current ? 1 : Math.max(0.0001, Math.min(1, (f + 90) / 170));
    lines.current.visible = f > 10.2;
  });
  return (
    <group>
      <group ref={pave} position={[-90, 0, 0]}>
        <BoxSet items={[[85, 0.03, -2.65, 170, 0.06, 1.1]]} mat={lam(G.pale)} />
        <BoxSet items={[[85, 0.006, -6.3, 170, 0.012, 5.4]]} mat={lam(G.pale)} />
      </group>
      <group ref={lines}>
        <BoxSet items={bays} mat={new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false })} receive={false} />
      </group>
    </group>
  );
}


export default function Outdoor({ clock }: { clock?: StoryClock }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, -0.02, -60]} material={K.ground} receiveShadow>
        <planeGeometry args={[550, 440]} />
      </mesh>
      <Road />
      <Kerb x0={-90} x1={78} z={-2.12} draw />
      <Kerb x0={-90} x1={78} z={2.12} draw />
      <Pavement />
      <Building />
      <FrontGarden />
      {[[13, -5.9, 0.03], [19.5, -7.4, -0.12], [52, -5.9, Math.PI]].map(([vx, vz, vy]) => (
        <Rise key={vx} x={vx} depth={3}>
          <Van x={vx} z={vz} yaw={vy} />
        </Rise>
      ))}
      <Greenery />
      {[-5.5, 14, 53, 70].map((lx) => (
        <Rise key={lx} x={lx} depth={5.6}>
          <LampPost x={lx} z={-2.9} h={4.1} />
        </Rise>
      ))}
      <Yard clock={clock} />
    </group>
  );
}
