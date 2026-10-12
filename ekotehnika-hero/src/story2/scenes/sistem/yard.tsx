// The Ekotehnika yard seen from above and from the flip. Concrete apron with slab joints, three halls with roofs, a
// gate with its house and a van, rows of parked Linde trucks in marked bays, floor pallet stacks, open racking,
// kerbed verges with trees and hedges, a zebra crossing and lane lines. Layout after the drone stills of the yard
// (reference only, nothing of the photos is used). Green is not a token, so verges are LMH light grey.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StoryClock } from '../../clock';
import { G, ease, lam, lit, range, rng, uOf } from './kit';
import { BoxSet, Hedge, Planter, Trees, Van, type BoxItem, type TreeSpec } from './props';
import { Roof, roofMaterials, type RoofSpec } from './roof';
import { ProxyTrucks, type TruckSpec } from './trucks';

const wall = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.6) });
const wallPale = lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.55) });
const trim = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.5) });
const edge = lam(G.mid);
const verge = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.45) });
const line = new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false });

let slabMat: THREE.Material | undefined;
// Concrete with a slab joint every 5 m, one tiling texture.
function slab() {
  if (slabMat) return slabMat;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#d8d8d8';
  g.fillRect(0, 0, 128, 2);
  g.fillRect(0, 0, 2, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.repeat.set(140 / 5, 100 / 5);
  slabMat = new THREE.MeshLambertMaterial({ map: t, color: lit(G.pale), emissive: lit(G.pale).multiplyScalar(0.4), toneMapped: false });
  return slabMat;
}

const roofMats = (() => {
  let m: ReturnType<typeof roofMaterials> | undefined;
  return () => (m ??= roofMaterials(false));
})();

type HallSpec = { x0: number; x1: number; z0: number; z1: number; eave: number; peak: number; doors?: 'near' | 'far' | 'both'; vents?: number; unit?: boolean };

function Hall({ x0, x1, z0, z1, eave, peak, doors, vents = 0, unit }: HallSpec) {
  const spec = useMemo<RoofSpec>(() => {
    const zc = (z0 + z1) / 2;
    const vs: RoofSpec['vents'] = [];
    for (let i = 0; i < vents; i++) vs.push({ side: i % 2 ? 1 : -1, x: x0 + 5 + i * ((x1 - x0 - 10) / Math.max(vents - 1, 1)), s: 1.4 });
    return {
      x0: x0 - 0.3, x1: x1 + 0.3, z0: z0 - 0.3, z1: z1 + 0.3, eave, peak, sky: 5.2, skyPhase: 2.6, vents: vs,
      units: unit ? [{ side: 1 as const, x: (x0 + x1) / 2 + 2, s: (z1 - zc) * 0.45 }] : [],
    };
  }, [x0, x1, z0, z1, eave, peak, vents, unit]);
  const w = x1 - x0;
  const d = z1 - z0;
  const doorItems = useMemo(() => {
    const items: BoxItem[] = [];
    const sides: number[] = doors === 'both' ? [z0, z1] : doors === 'near' ? [z1] : doors === 'far' ? [z0] : [];
    sides.forEach((zz) => {
      const s = zz === z1 ? 1 : -1;
      for (let x = x0 + 3; x < x1 - 3; x += 6) {
        items.push([x, 2.2, zz + s * 0.06, 4.0, 4.4, 0.12]);
      }
    });
    return items;
  }, [x0, x1, z0, z1, doors]);
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, eave / 2, (z0 + z1) / 2]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[w, eave, d]} />
      </mesh>
      <BoxSet items={[[(x0 + x1) / 2, 0.25, z1 + 0.05, w + 0.1, 0.5, 0.12], [(x0 + x1) / 2, 0.25, z0 - 0.05, w + 0.1, 0.5, 0.12]]} mat={trim} cast />
      <BoxSet items={doorItems} mat={wallPale} cast />
      <BoxSet items={doorItems.map(([x, , z]) => [x, 4.3, z + (z > (z0 + z1) / 2 ? 0.05 : -0.05), 4.0, 0.12, 0.08] as BoxItem)} mat={edge} />
      <Roof spec={spec} mats={roofMats()} />
    </group>
  );
}

// The two rows that flank the warehouse drive off along their forks inside Z, so the roof push ends on a clear yard and
// the P text never sits over a truck. Away from the building, in metres of z, and the stretch of u it takes.
const LEAVE_DZ = 18;
const LEAVE_FROM = 6.45;
const LEAVE_TO = 6.92;

// A row of parked trucks and the bay lines between them.
function Bays({ x0, x1, z, forks, step = 2.05, skip = [], clock }: { x0: number; x1: number; z: number; forks: 1 | -1; step?: number; skip?: number[]; clock?: StoryClock }) {
  const row = useRef<THREE.Group>(null);
  useFrame(() => {
    if (clock && row.current) row.current.position.z = forks * LEAVE_DZ * ease(range(uOf(clock), LEAVE_FROM, LEAVE_TO));
  });
  const trucks = useMemo(() => {
    const out: TruckSpec[] = [];
    let i = 0;
    for (let x = x0; x <= x1 + 0.01; x += step, i++) {
      if (skip.includes(i)) continue;
      out.push({ x, z: z + (((i * 37) % 5) - 2) * 0.04, yaw: forks > 0 ? -Math.PI / 2 : Math.PI / 2 });
    }
    return out;
  }, [x0, x1, z, forks, step, skip]);
  const lines = useMemo(() => {
    const items: BoxItem[] = [];
    for (let x = x0 - step / 2; x <= x1 + step / 2 + 0.01; x += step) items.push([x, 0.02, z, 0.09, 0.01, 5.6]);
    return items;
  }, [x0, x1, z, step]);
  return (
    <group>
      <group ref={row}>
        <ProxyTrucks items={trucks} />
      </group>
      <BoxSet items={lines} mat={line} receive={false} />
    </group>
  );
}

// A kerbed verge with its trees and a hedge or shrub strip.
function Island({ x0, x1, z0, z1, trees, hedge = true }: { x0: number; x1: number; z0: number; z1: number; trees: TreeSpec[]; hedge?: boolean }) {
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  return (
    <group>
      <BoxSet items={[[cx, 0.09, cz, x1 - x0, 0.18, z1 - z0]]} mat={verge} cast />
      <BoxSet
        items={[
          [cx, 0.2, z0, x1 - x0 + 0.3, 0.14, 0.3],
          [cx, 0.2, z1, x1 - x0 + 0.3, 0.14, 0.3],
          [x0, 0.2, cz, 0.3, 0.14, z1 - z0],
          [x1, 0.2, cz, 0.3, 0.14, z1 - z0],
        ]}
        mat={wallPale}
        cast
      />
      <Trees items={trees} mid />
      {hedge && x1 - x0 > 6 && <Hedge x={x0 + 0.8} z={cz + (z1 - z0) * 0.3} len={x1 - x0 - 1.6} />}
    </group>
  );
}

// Floor pallet stacks, a wooden base in grey, a wrapped load in white with a band round it.
export function Pallets({ x0, z0, cols, rows, dx = 1.55, dz = 1.35, seed = 1 }: { x0: number; z0: number; cols: number; rows: number; dx?: number; dz?: number; seed?: number }) {
  const set = useMemo(() => {
    const r = rng(seed);
    const base: BoxItem[] = [];
    const load: BoxItem[] = [];
    const band: BoxItem[] = [];
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        if (r() < 0.12) continue;
        const x = x0 + i * dx;
        const z = z0 + j * dz;
        const tiers = 1 + Math.floor(r() * 2.4);
        for (let t = 0; t < tiers; t++) {
          const y = t * 1.25;
          base.push([x, y + 0.08, z, 1.2, 0.16, 0.8]);
          const h = 0.9 + r() * 0.15;
          load.push([x, y + 0.16 + h / 2, z, 1.14, h, 0.76]);
          band.push([x, y + 0.16 + h * 0.62, z, 1.17, 0.05, 0.79], [x, y + 0.16 + h * 0.3, z, 1.17, 0.05, 0.79]);
        }
      }
    return { base, load, band };
  }, [x0, z0, cols, rows, dx, dz, seed]);
  return (
    <group>
      <BoxSet items={set.base} mat={lam(G.mid)} cast />
      <BoxSet items={set.load} mat={lam(G.white, { emissive: lit(G.white).multiplyScalar(0.5) })} cast />
      <BoxSet items={set.band} mat={lam(G.light)} />
    </group>
  );
}

// Open racking, two rows back to back, uprights every 2.7 m, two beam levels, wrapped loads on the top level.
export function Racking({ x0, x1, z }: { x0: number; x1: number; z: number }) {
  const set = useMemo(() => {
    const up: BoxItem[] = [];
    const beam: BoxItem[] = [];
    const load: BoxItem[] = [];
    const r = rng(Math.round(x0 * 7 + z));
    for (let row = 0; row < 2; row++) {
      const zz = z + row * 1.3;
      for (let x = x0; x <= x1 + 0.01; x += 2.7) {
        up.push([x, 2.1, zz - 0.45, 0.1, 4.2, 0.1], [x, 2.1, zz + 0.45, 0.1, 4.2, 0.1]);
        if (x + 2.7 <= x1 + 0.01) {
          for (const y of [1.5, 3.0, 4.2]) beam.push([x + 1.35, y, zz - 0.45, 2.6, 0.12, 0.06], [x + 1.35, y, zz + 0.45, 2.6, 0.12, 0.06]);
          for (const y of [0.15, 1.65]) {
            for (const dx of [-0.65, 0.65]) if (r() > 0.2) load.push([x + 1.35 + dx, y + 0.65, zz, 1.15, 1.0, 0.8]);
          }
          if (r() > 0.25) for (const dx of [-0.65, 0.65]) load.push([x + 1.35 + dx, 3.15 + 0.5, zz, 1.15, 0.95, 0.8]);
        }
      }
    }
    return { up, beam, load };
  }, [x0, x1, z]);
  return (
    <group>
      <BoxSet items={set.up} mat={lam(G.dark)} cast />
      <BoxSet items={set.beam} mat={lam(G.mid)} cast />
      <BoxSet items={set.load} mat={lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.4) })} cast />
    </group>
  );
}

function Zebra({ x, z0 = -1.5, z1 = 1.5 }: { x: number; z0?: number; z1?: number }) {
  const items = useMemo(() => {
    const out: BoxItem[] = [];
    for (let i = 0; i < 7; i++) out.push([x + i * 0.9, 0.025, (z0 + z1) / 2, 0.45, 0.01, z1 - z0]);
    return out;
  }, [x, z0, z1]);
  return <BoxSet items={items} mat={line} receive={false} />;
}

function Gate() {
  return (
    <group>
      {/* the gate house with its roof, a window band and a door */}
      <BoxSet items={[[63.8, 1.4, 3.7, 3.0, 2.8, 2.6]]} mat={wall} cast />
      <BoxSet items={[[63.8, 2.9, 3.7, 3.5, 0.16, 3.1]]} mat={wallPale} cast />
      <BoxSet items={[[63.8, 1.7, 2.38, 2.2, 1.0, 0.06]]} mat={lam(G.mid)} />
      <BoxSet items={[[63.8, 0.1, 2.0, 3.6, 0.2, 1.2]]} mat={trim} />
      {/* barrier housings either side of the road and the raised arms */}
      <BoxSet items={[[66.2, 0.55, 2.35, 0.4, 1.1, 0.4], [66.2, 0.55, -2.35, 0.4, 1.1, 0.4]]} mat={lam(G.dark)} cast />
      <BoxSet items={[[66.2, 1.6, 2.35, 0.1, 1.9, 0.1], [66.2, 1.6, -2.35, 0.1, 1.9, 0.1]]} mat={lam(G.white)} cast />
      {/* hatching before the gate */}
      <BoxSet items={Array.from({ length: 5 }, (_, i) => [69.4 + i * 1.1, 0.02, 3.6, 0.3, 0.01, 2.6] as BoxItem)} mat={line} receive={false} />
      <Van x={71.5} z={4.3} yaw={Math.PI} />
    </group>
  );
}

export default function Yard({ clock }: { clock?: StoryClock }) {
  const apronTrees = useMemo<TreeSpec[]>(() => {
    const r = rng(77);
    const t: TreeSpec[] = [];
    // along the far north and in the south, behind the halls and out past the lots
    for (let x = 58; x < 180; x += 6 + r() * 4) t.push({ x, z: -56 - r() * 6, h: 5 + r() * 3 });
    for (let x = 58; x < 180; x += 7 + r() * 4) t.push({ x, z: 36 + r() * 6, h: 5 + r() * 3 });
    for (let z = -50; z < 34; z += 7 + r() * 4) t.push({ x: 188 + r() * 3, z, h: 5 + r() * 3 });
    return t.map((tt, i) => ({ ...tt, v: i }));
  }, []);
  const islandTrees = (list: [number, number, number][]) => list.map(([x, z, h], i) => ({ x, z, h, v: i + 1 }));
  return (
    <group>
      {/* the concrete apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[118, 0.01, -8]} material={slab()} receiveShadow>
        <planeGeometry args={[140, 100]} />
      </mesh>
      <Hall x0={63} x1={80} z0={-26} z1={-6.5} eave={7.4} peak={8.5} doors="near" vents={3} unit />
      <Hall x0={88} x1={114} z0={-52} z1={-24} eave={8.6} peak={10.0} doors="near" vents={5} />
      <Hall x0={93} x1={116} z0={-6.5} z1={14} eave={8.6} peak={10.0} doors="far" vents={4} unit />
      <Gate />
      <Zebra x={74.5} />
      {/* truck rows, each in its marked bays */}
      <Bays x0={93.5} x1={114.5} z={-9.2} forks={-1} skip={[3, 8]} />
      <Bays x0={89.5} x1={113.5} z={-20.9} forks={1} skip={[5]} />
      <Bays x0={74.5} x1={84} z={5.9} forks={-1} />
      <Bays x0={74.5} x1={84} z={10.5} forks={1} skip={[2]} />
      <Bays x0={121} x1={160} z={-2.4} forks={1} step={2.05} skip={[4, 9, 15]} clock={clock} />
      <Bays x0={121} x1={160} z={-27.2} forks={-1} step={2.05} skip={[2, 11]} clock={clock} />
      {/* floor stacks and open racking */}
      <Racking x0={69.2} x1={79.7} z={-5.2} />
      <Pallets x0={120} z0={3.4} cols={14} rows={4} seed={3} />
      <Pallets x0={121} z0={-33} cols={12} rows={4} seed={5} />
      {/* verges, hedges and trees */}
      <Island x0={86.8} x1={91.2} z0={-12} z1={-3} trees={islandTrees([[88.5, -9.5, 5.2], [89.3, -5.2, 4.4]])} hedge={false} />
      <Island x0={86.4} x1={92} z0={1.5} z1={9.5} trees={islandTrees([[88.6, 4.6, 5.6], [89.8, 7.6, 4.8]])} />
      <Island x0={85} x1={88} z0={-23} z1={-17.4} trees={islandTrees([[86.5, -21, 4.8], [86.6, -18.4, 4.2]])} hedge={false} />
      <Island x0={118} x1={121} z0={-18} z1={-10} trees={islandTrees([[119.5, -15.6, 4.8]])} hedge={false} />
      <Planter x={62} z={-3.0} len={6} seed={4} d={1.4} />
      <Trees items={apronTrees} mid />
      <Trees mid items={islandTrees([[61.4, 1.2, 4.2], [60.4, -4.4, 5.0], [56, -10, 5.4], [57, 6, 5], [66, 13.5, 4.6], [76, 15, 5.2], [82.5, 14, 4.8]])} />
    </group>
  );
}
