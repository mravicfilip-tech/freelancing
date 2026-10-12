// The Ekotehnika yard seen from above, for R and the flip. A paved apron with slab joints that runs under the whole S path,
// a south strip of empty marked bays (the text of R lands on that pavement), pallet stacks and rows of parked trucks in their
// bays between and north of the path legs, a kerbed verge with trees, and a pitched hall roof with skylights and vents at
// the west end. Everything is a hard edged object on the apron, nothing fades. Metres, x east, z south.
import { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Inst, rng, type It, type Rect } from './kit';
import { G, flat, mat } from './look';
import { ProxyTrucks, type TruckSpec } from './proxy';

const apron = mat(G.pale, 0.35, 0.95, false);
const joint = flat(G.light);
const bayLine = flat(G.white);
const palletBase = mat(G.mid, 0.2);
const palletLoad = mat(G.white, 0.4);
const palletBand = mat(G.light, 0.3);
const kerb = mat(G.white, 0.4);
const verge = mat(G.light, 0.3);
const hedge = mat(G.mid, 0.2);
const trunk = mat(G.dark, 0.2);
const crown = mat(G.light, 0.25);
const crownDark = mat(G.mid, 0.2);
const hallWall = mat(G.white, 0.45, 0.9);
const roofNear = mat(G.white, 0.45, 0.8, false);
const roofFar = mat(G.pale, 0.4, 0.8, false);
const seamMat = mat(G.light, 0.3, 0.8, false);
const skyMat = new THREE.MeshStandardMaterial({ color: G.mid, emissive: G.light, emissiveIntensity: 0.55, roughness: 0.3 });
const frameMat = mat(G.dark, 0.2, 0.8, false);
const unit = new THREE.BoxGeometry(1, 1, 1);
const ico = new THREE.IcosahedronGeometry(1, 0);
const cylg = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);

export const YARD = { x0: 96, x1: 205, z0: -50, z1: 40 };

// Rows of bay lines, a post line every `step` metres across `len`, depth along z
function bayRow(x0: number, x1: number, zc: number, depth: number, step: number): It[] {
  const out: It[] = [];
  for (let x = x0; x <= x1 + 0.01; x += step) out.push([x, 0.04, zc, 0.09, 0.01, depth]);
  out.push([(x0 + x1) / 2, 0.04, zc - depth / 2, x1 - x0, 0.01, 0.09], [(x0 + x1) / 2, 0.04, zc + depth / 2, x1 - x0, 0.01, 0.09]);
  return out;
}

// A pitched hall roof seen from above, two slopes either side of a ridge along x, seams down each slope, skylight strips,
// round vents at the ridge. x0..x1 along the ridge, z0..z1 across it.
function HallRoof({ x0, x1, z0, z1, eave, peak }: { x0: number; x1: number; z0: number; z1: number; eave: number; peak: number }) {
  const zc = (z0 + z1) / 2;
  const half = (z1 - z0) / 2;
  const rise = peak - eave;
  const theta = Math.atan2(rise, half);
  const L = Math.hypot(half, rise);
  const W = x1 - x0;
  const set = useMemo(() => {
    const seams: It[] = [];
    const sky: It[] = [];
    const skyF: It[] = [];
    for (let x = 0.31; x < W; x += 0.62) seams.push([x - W / 2, 0.03, L / 2, 0.04, 0.06, L]);
    for (let x = 3; x + 2.4 < W; x += 6) {
      sky.push([x + 1.2 - W / 2, 0.05, L * 0.5, 2.4, 0.06, L * 0.5]);
      for (const o of [-1.2, 1.2]) skyF.push([x + 1.2 - W / 2 + o, 0.07, L * 0.5, 0.07, 0.09, L * 0.5 + 0.1]);
      for (const zz of [0.25, 0.75]) skyF.push([x + 1.2 - W / 2, 0.07, L * zz, 2.4, 0.09, 0.07]);
    }
    return { seams, sky, skyF };
  }, [W, L]);
  const vents = useMemo<It[]>(() => Array.from({ length: Math.floor(W / 9) }, (_, i) => [x0 + 6 + i * 9, peak + 0.3, zc, 0.8, 0.5, 0.8]), [W, x0, peak, zc]);
  return (
    <group>
      {[1, -1].map((side) => (
        <group key={side} position={[(x0 + x1) / 2, peak, zc]} rotation={[side * theta, 0, 0]}>
          <mesh position={[0, 0, side * (L / 2)]} material={side > 0 ? roofNear : roofFar} castShadow receiveShadow>
            <boxGeometry args={[W + 0.5, 0.1, L]} />
          </mesh>
          <group scale={[1, 1, side]}>
            <Inst geo={unit} mat={seamMat} items={set.seams} cast={false} />
            <Inst geo={unit} mat={skyMat} items={set.sky} cast={false} />
            <Inst geo={unit} mat={frameMat} items={set.skyF} cast={false} />
          </group>
        </group>
      ))}
      <Inst geo={cylg} mat={frameMat} items={vents} />
    </group>
  );
}

export default function Yard() {
  const data = useMemo(() => {
    const r = rng(41);
    // slab joints every 5 m
    const joints: It[] = [];
    for (let x = YARD.x0; x <= YARD.x1; x += 5) joints.push([x, 0.03, (YARD.z0 + YARD.z1) / 2, 0.04, 0.005, YARD.z1 - YARD.z0]);
    for (let z = YARD.z0; z <= YARD.z1; z += 5) joints.push([(YARD.x0 + YARD.x1) / 2, 0.03, z, YARD.x1 - YARD.x0, 0.005, 0.04]);
    // the south strip, two rows of empty marked bays the text of R lands on
    const bays: It[] = [...bayRow(104, 200, 6.6, 5.2, 2.4), ...bayRow(104, 200, 12.2, 5.2, 2.4)];
    // north of the second leg, a row of parked trucks nose to the kerb, and its bay lines
    bays.push(...bayRow(126, 168, -14.6, 5.4, 2.1));
    // between the legs and south of the second leg, one row nose to the lane
    bays.push(...bayRow(132, 168, -4.9, 5.0, 2.1));
    const north: TruckSpec[] = [];
    const south: TruckSpec[] = [];
    for (let x = 133; x < 168; x += 2.1) if (r() > 0.62) south.push({ x: x + 1.05, z: -4.9 + (r() - 0.5) * 0.2, yaw: -Math.PI / 2 });
    // floor pallet stacks
    const base: It[] = [];
    const load: It[] = [];
    const band: It[] = [];
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 3; j++) {
        if (r() < 0.2) continue;
        const x = 136 + i * 1.6;
        const z = -1.9 + j * 1.15;
        const tiers = 1 + Math.floor(r() * 2);
        for (let t = 0; t < tiers; t++) {
          const y = t * 1.25;
          base.push([x, y + 0.08, z, 1.2, 0.16, 0.8]);
          const h = 0.9 + r() * 0.15;
          load.push([x, y + 0.16 + h / 2, z, 1.14, h, 0.76]);
          band.push([x, y + 0.16 + h * 0.6, z, 1.17, 0.05, 0.79]);
        }
      }
    for (let i = 0; i < 20; i++)
      for (let j = 0; j < 3; j++) {
        if (r() < 0.25) continue;
        const x = 127 + i * 2.1;
        const z = -12.4 - j * 1.5;
        const tiers = 1 + Math.floor(r() * 2);
        for (let t = 0; t < tiers; t++) {
          const yy = t * 1.25;
          base.push([x, yy + 0.08, z, 1.2, 0.16, 0.8]);
          const h = 0.9 + r() * 0.15;
          load.push([x, yy + 0.16 + h / 2, z, 1.14, h, 0.76]);
          band.push([x, yy + 0.16 + h * 0.6, z, 1.17, 0.05, 0.79]);
        }
      }
    // the verge north of the north row, a kerb and a hedge, trees along it
    const verges: It[] = [[150, 0.1, -19.6, 90, 0.2, 3.6]];
    const hedges: It[] = [[150, 0.6, -19.0, 90, 1.0, 0.8]];
    const crowns: It[] = [];
    const crownsD: It[] = [];
    const trunks: It[] = [];
    for (let x = 100; x < 205; x += 6.5 + r() * 2) {
      const h = 4.2 + r() * 1.6;
      const w = 2.6 + r() * 1.2;
      trunks.push([x, h * 0.3, -20.4, 0.3, h * 0.6, 0.3]);
      crowns.push([x, h * 0.78, -20.4, w, h * 0.46, w, r() * 6]);
      crownsD.push([x + 0.3, h * 1.0, -20.4 + 0.3, w * 0.62, h * 0.3, w * 0.62, r() * 6]);
    }
    // the gate end, kerb islands in the south strip
    const islands: It[] = [[100, 0.1, 9.4, 3.2, 0.2, 18.4]];
    return { joints, bays, north, south, base, load, band, verges, hedges, crowns, crownsD, trunks, islands };
  }, []);
  const rect: Rect = [YARD.x0, YARD.z0, YARD.x1, YARD.z1];
  return (
    <group>
      <Box a={rect} y={0.005} h={0.03} m={apron} cast={false} />
      <Inst geo={unit} mat={joint} items={data.joints} cast={false} receive={false} />
      <Inst geo={unit} mat={bayLine} items={data.bays} cast={false} receive={false} />
      <ProxyTrucks items={data.north} />
      <ProxyTrucks items={data.south} />
      <Inst geo={unit} mat={palletBase} items={data.base} />
      <Inst geo={unit} mat={palletLoad} items={data.load} />
      <Inst geo={unit} mat={palletBand} items={data.band} cast={false} />
      <Inst geo={unit} mat={verge} items={data.verges} />
      <Inst geo={unit} mat={hedge} items={data.hedges} />
      <Inst geo={unit} mat={kerb} items={data.islands} />
      <Inst geo={unit} mat={trunk} items={data.trunks} />
      <Inst geo={ico} mat={crown} items={data.crowns} />
      <Inst geo={ico} mat={crownDark} items={data.crownsD} />
      <Box a={[98, -17, 116, -4.6]} h={6.4} m={hallWall} />
      <HallRoof x0={98} x1={116} z0={-17} z1={-4.6} eave={6.4} peak={8.0} />
    </group>
  );
}
