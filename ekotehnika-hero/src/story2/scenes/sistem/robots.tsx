// The automation floor. In T the depot floor takes its warehouse lanes, racks rise from it and the bays fade. In AT the
// C-Matic 10 and the C-Matic HP drive at true scale (1.2 m, no enlargement) through an aisle between pallet racks, on
// routes drawn as precise system lines, 1px, dashed, with small arrowheads and stop markers in one info colour (LMH
// blue, 72 percent). A docking station sits at one end of the cross lane, a pallet pick at the other. Everything is laid
// out in plan metres from the middle of the frame, x to the right, y down, then mapped onto the floor seen from above.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { SceneProps } from '../../clock';
import { ATP } from './route';
import { Truck, type TruckApi } from './models';
import { BoxSet, type BoxItem } from './props';
import { Racking } from './yard';
import { G, K, ease, lam, lerp, lit, range, uOf } from './kit';

type V = [number, number];
const INFO = '#468cc4'; // LMH blue, 72 percent tint, the one info colour of the automation floor
const toWorld = (sx: number, sy: number, y: number): [number, number, number] => [ATP.x + sy, y, ATP.z - sx];

// Routes in plan metres. Each is a polyline, with stops along it. The aisle runs up the right of the frame between the
// racks, the cross lane runs along the bottom with the dock at its left end and the pallet pick at its right.
const AISLE_L = 4.45;
const AISLE_R = 5.95;
const CROSS = 4.55;
const DOCK1: V = [-5.2, CROSS];
const DOCK2: V = [-2.6, 6.0];
const PICK: V = [9.0, CROSS];
type Route = { name: 'cmatic10' | 'cmatichp'; pts: V[]; stops: V[]; off: number; wait: number };
const ROUTES: Route[] = [
  { name: 'cmatic10', pts: [DOCK1, [AISLE_L, CROSS], [AISLE_L, -6.2]], stops: [[AISLE_L, 1.2], [AISLE_L, -2.4], [AISLE_L, -5.6]], off: 0.0, wait: 0.15 },
  { name: 'cmatichp', pts: [PICK, [AISLE_R, CROSS], [AISLE_R, -6.2]], stops: [[AISLE_R, 0.4], [AISLE_R, -3.1], [AISLE_R, -5.6]], off: 0.32, wait: 0.15 },
  { name: 'cmatic10', pts: [DOCK2, [1.4, 6.0], [1.4, 3.0]], stops: [[1.4, 3.0]], off: 0.62, wait: 0.2 },
  { name: 'cmatichp', pts: [[9.0, 6.0], [7.3, 6.0], [7.3, 3.0]], stops: [[7.3, 3.0]], off: 0.85, wait: 0.2 },
];
const len = (pts: V[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const at = (pts: V[], d: number): { p: V; yaw: number } => {
  let rest = d;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (rest <= l || i === pts.length - 2) {
      const t = Math.min(1, rest / l);
      return { p: [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)], yaw: Math.atan2((pts[i + 1][0] - pts[i][0]) / l, (pts[i + 1][1] - pts[i][1]) / l) };
    }
    rest -= l;
  }
  return { p: pts[pts.length - 1], yaw: 0 };
};

// Dash a polyline into pairs, a world metre long dash and a short gap, then the arrowheads and the stop markers.
function routeGeometry() {
  const seg: number[] = [];
  const tri: number[] = [];
  const mark: number[] = [];
  const Y = ATP.y + 0.04;
  const push = (a: V, b: V) => {
    const p = toWorld(a[0], a[1], Y);
    const q = toWorld(b[0], b[1], Y);
    seg.push(...p, ...q);
  };
  ROUTES.forEach((r) => {
    const L = len(r.pts);
    for (let d = 0; d < L; d += 0.7) {
      const a = at(r.pts, d).p;
      const b = at(r.pts, Math.min(d + 0.46, L)).p;
      push(a, b);
    }
    // an arrowhead every 4 m, pointing along the route
    for (let d = 2.5; d < L - 0.3; d += 4) {
      const { p, yaw } = at(r.pts, d);
      const fx = Math.sin(yaw);
      const fy = Math.cos(yaw);
      const nx = -fy;
      const ny = fx;
      const tip: V = [p[0] + fx * 0.2, p[1] + fy * 0.2];
      const l: V = [p[0] - fx * 0.1 + nx * 0.11, p[1] - fy * 0.1 + ny * 0.11];
      const rr: V = [p[0] - fx * 0.1 - nx * 0.11, p[1] - fy * 0.1 - ny * 0.11];
      [tip, l, rr].forEach((v) => tri.push(...toWorld(v[0], v[1], Y + 0.002)));
    }
    // stop markers, a small square and a cross at each stop, and a ring at the start
    r.stops.forEach(([sx, sy]) => {
      const h = 0.3;
      const c: V[] = [[sx - h, sy - h], [sx + h, sy - h], [sx + h, sy + h], [sx - h, sy + h]];
      for (let i = 0; i < 4; i++) {
        const a = toWorld(c[i][0], c[i][1], Y);
        const b = toWorld(c[(i + 1) % 4][0], c[(i + 1) % 4][1], Y);
        mark.push(...a, ...b);
      }
      mark.push(...toWorld(sx - h * 0.55, sy, Y), ...toWorld(sx + h * 0.55, sy, Y), ...toWorld(sx, sy - h * 0.55, Y), ...toWorld(sx, sy + h * 0.55, Y));
    });
    const [sx, sy] = r.pts[0];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const b = ((i + 1) / 24) * Math.PI * 2;
      mark.push(...toWorld(sx + Math.cos(a) * 0.22, sy + Math.sin(a) * 0.22, Y), ...toWorld(sx + Math.cos(b) * 0.22, sy + Math.sin(b) * 0.22, Y));
    }
  });
  return { seg, tri, mark };
}

function laneItems() {
  const bands: BoxItem[] = [];
  const edges: BoxItem[] = [];
  const hatch: BoxItem[] = [];
  const Y = ATP.y;
  const W = (sx0: number, sx1: number, sy0: number, sy1: number, h: number, list: BoxItem[]) => {
    const [x, , z] = toWorld((sx0 + sx1) / 2, (sy0 + sy1) / 2, 0);
    // plan x is world -z, plan y is world +x
    list.push([x, Y + h, z, sy1 - sy0, 0.01, sx1 - sx0]);
  };
  // the robot aisle and the cross lane, as pale bands with painted edges
  W(3.3, 7.1, -12, 9, 0.012, bands);
  W(-16, 16, 3.35, 6.3, 0.012, bands);
  [3.3, 7.1].forEach((sx) => W(sx - 0.05, sx + 0.05, -12, 3.35, 0.02, edges));
  [3.35, 6.3].forEach((sy) => W(-16, 16, sy - 0.05, sy + 0.05, 0.02, edges));
  [3.3, 7.1].forEach((sx) => W(sx - 0.05, sx + 0.05, 6.3, 9, 0.02, edges));
  // walkway lines along the rack faces
  W(0.81, 0.89, -1.3, 3.0, 0.02, edges);
  W(9.86, 9.94, -12, 3.0, 0.02, edges);
  // hatched zones at the dock and the pallet pick
  const hatchZone = (cx: number, cy: number, w: number, h: number) => {
    W(cx - w / 2 - 0.04, cx - w / 2 + 0.04, cy - h / 2, cy + h / 2, 0.02, edges);
    W(cx + w / 2 - 0.04, cx + w / 2 + 0.04, cy - h / 2, cy + h / 2, 0.02, edges);
    for (let i = 0; i < 9; i++) {
      const t = -w / 2 + 0.2 + (i * (w - 0.4)) / 8;
      const [x, , z] = toWorld(cx + t, cy, 0);
      hatch.push([x, Y + 0.02, z, h * 0.9, 0.01, 0.07]);
    }
  };
  hatchZone(-5.2, CROSS, 2.2, 2.4);
  hatchZone(9.3, CROSS, 2.2, 2.4);
  return { bands, edges, hatch };
}

function Dock({ sx, sy }: { sx: number; sy: number }) {
  const [x, , z] = toWorld(sx, sy, ATP.y);
  return (
    <group position={[x, ATP.y, z]} rotation={[0, Math.PI / 2, 0]}>
      <RoundedBox args={[0.2, 0.9, 1.4]} radius={0.03} position={[-0.85, 0.46, 0]} material={lam(G.graphite)} castShadow />
      <mesh position={[-0.74, 0.2, 0]} material={lam(G.light)}>
        <boxGeometry args={[0.03, 0.05, 1.0]} />
      </mesh>
      <mesh position={[-0.74, 0.74, 0]} material={new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false })}>
        <boxGeometry args={[0.03, 0.04, 0.8]} />
      </mesh>
      <mesh position={[-0.1, 0.012, 0]} material={lam(G.light)}>
        <boxGeometry args={[1.5, 0.024, 1.1]} />
      </mesh>
    </group>
  );
}

function PalletPick({ sx, sy }: { sx: number; sy: number }) {
  const [x, , z] = toWorld(sx, sy, ATP.y);
  return (
    <group position={[x, ATP.y, z]}>
      <mesh position={[0, 0.08, 0]} material={lam(G.mid)} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.16, 1.2]} />
      </mesh>
      <RoundedBox args={[0.74, 0.8, 1.14]} radius={0.02} position={[0, 0.56, 0]} material={lam(G.white, { emissive: lit(G.white).multiplyScalar(0.5) })} castShadow />
      <mesh position={[0, 0.78, 0]} material={lam(G.light)}>
        <boxGeometry args={[0.76, 0.05, 1.16]} />
      </mesh>
      {[-0.82, 0.82].map((o) => (
        <mesh key={o} position={[-0.7, 0.4, o]} material={lam(G.dark)} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.8, 12]} />
        </mesh>
      ))}
    </group>
  );
}

export default function Robots({ clock }: SceneProps) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const robots = useRef<(THREE.Group | null)[]>([]);
  const apis = useMemo(() => ROUTES.map(() => ({ current: null as TruckApi | null })), []);
  const racks = useRef<THREE.Group>(null);
  const props = useRef<THREE.Group>(null);
  const geo = useMemo(routeGeometry, []);
  const lanes = useMemo(laneItems, []);
  const routeMat = useMemo(() => new LineMaterial({ color: new THREE.Color(INFO).getHex(), linewidth: 1, transparent: true, opacity: 1, toneMapped: false, depthWrite: false }), []);
  const markMat = useMemo(() => new LineMaterial({ color: new THREE.Color(INFO).getHex(), linewidth: 1, transparent: true, opacity: 1, toneMapped: false, depthWrite: false }), []);
  const routeLines = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array(geo.seg));
    const l = new LineSegments2(g, routeMat);
    l.frustumCulled = false;
    return l;
  }, [geo, routeMat]);
  const markLines = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array(geo.mark));
    const l = new LineSegments2(g, markMat);
    l.frustumCulled = false;
    return l;
  }, [geo, markMat]);
  const arrowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(geo.tri, 3));
    return g;
  }, [geo]);
  const arrowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: INFO, side: THREE.DoubleSide, transparent: true, toneMapped: false, depthWrite: false }), []);
  const bandMat = useMemo(() => new THREE.MeshBasicMaterial({ color: G.pale, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), []);
  const edgeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: G.mid, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), []);
  const hatchMat = useMemo(() => new THREE.MeshBasicMaterial({ color: G.light, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), []);
  const total = geo.seg.length / 6;

  useLayoutEffect(() => {
    robots.current.forEach((r) => r?.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).receiveShadow = true) : null)));
  }, []);

  useFrame(() => {
    routeMat.resolution.set(size.width * dpr, size.height * dpr);
    markMat.resolution.set(size.width * dpr, size.height * dpr);
    const lw = Math.max(1, size.height / 900) * dpr;
    routeMat.linewidth = markMat.linewidth = lw;
    const u = uOf(clock);
    // the warehouse lanes are drawn on while the bays fade, the racks rise from the floor
    const lane = ease(range(u, 13.0, 13.5));
    bandMat.opacity = 0.9 * lane;
    edgeMat.opacity = 0.85 * lane;
    hatchMat.opacity = 0.7 * lane;
    if (racks.current) {
      const rise = ease(range(u, 13.15, 13.75));
      racks.current.scale.y = Math.max(rise, 0.001);
      racks.current.visible = rise > 0.003;
    }
    if (props.current) props.current.visible = u > 13.3;
    // routes draw on, section by section
    const dp = ease(range(u, 13.6, 14.35));
    (routeLines.geometry as LineSegmentsGeometry & { instanceCount: number }).instanceCount = Math.max(0, Math.floor(total * dp));
    markMat.opacity = ease(range(u, 13.85, 14.2));
    arrowMat.opacity = ease(range(u, 13.85, 14.2));
    const tau = Math.max(0, u - 14);
    ROUTES.forEach((rt, i) => {
      const r = robots.current[i];
      if (!r) return;
      const L = len(rt.pts);
      // out along the route, a pause at the last stop, back again, a pause at the start
      const c = (((tau * 1.15 + rt.off) % 1) + 1) % 1;
      const out = 0.38;
      const w = rt.wait * 0.8;
      let d: number;
      let flip = 0;
      if (c < out) d = ease(c / out) * L;
      else if (c < out + w) {
        d = L;
        flip = Math.PI * ease((c - out) / w);
      } else if (c < out + w + out) {
        d = (1 - ease((c - out - w) / out)) * L;
        flip = Math.PI;
      } else {
        d = 0;
        flip = Math.PI + Math.PI * ease((c - 2 * out - w) / Math.max(1 - 2 * out - w, 0.05));
      }
      const { p, yaw } = at(rt.pts, d);
      const [x, y, z] = toWorld(p[0], p[1], ATP.y);
      r.position.set(x, y, z);
      r.rotation.y = yaw + flip;
      const cyc = Math.floor(tau * 1.15 + rt.off);
      apis[i].current?.set(0, cyc * 2 * L + d);
      const grow = ease(range(u, 13.9 + i * 0.03, 14.06 + i * 0.03));
      r.scale.setScalar(Math.max(grow, 0.001));
      r.visible = grow > 0.002;
    });
  });

  return (
    <group>
      <BoxSet items={lanes.bands} mat={bandMat} receive={false} />
      <BoxSet items={lanes.edges} mat={edgeMat} receive={false} />
      <BoxSet items={lanes.hatch} mat={hatchMat} receive={false} />
      {/* racks along both sides of the aisle, they rise from the floor in T */}
      <group ref={racks} visible={false}>
        <group position={[ATP.x, 0, ATP.z]} rotation={[0, 0, 0]}>
          <Racking x0={-1.2} x1={2.2} z={-2.65} />
          <Racking x0={-8.2} x1={2.2} z={-8.95} />
        </group>
      </group>
      <primitive object={routeLines} />
      <primitive object={markLines} />
      <mesh geometry={arrowGeo} material={arrowMat} />
      <group ref={props} visible={false}>
        <Dock sx={DOCK1[0]} sy={DOCK1[1]} />
        <Dock sx={DOCK2[0]} sy={DOCK2[1]} />
        <PalletPick sx={PICK[0] + 1.5} sy={PICK[1]} />
      </group>
      {ROUTES.map((rt, i) => (
        <group key={i} ref={(o) => { robots.current[i] = o; }}>
          <Truck name={rt.name} apiRef={apis[i]}>
            {rt.name === 'cmatic10' && (
              <group position={[0, 0.25, 0]}>
                <RoundedBox args={[0.62, 0.38, 0.5]} radius={0.02} position={[0, 0.19, 0]} material={K.carton} castShadow />
                <mesh position={[0, 0.385, 0]} material={K.tape}>
                  <boxGeometry args={[0.63, 0.01, 0.09]} />
                </mesh>
              </group>
            )}
          </Truck>
        </group>
      ))}
    </group>
  );
}
