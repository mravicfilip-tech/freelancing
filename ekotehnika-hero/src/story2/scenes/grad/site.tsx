// The Ekotehnika site in Vrčin, in the city style of variant 4. A straight yard lane along z = 0, the office
// building behind it with the company name in sign letters, vans, parked forklifts, trees, lamps and a fence
// for the side on drive, then the S shaped path and open land for the top down view. Metres, x east, z south.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { C } from '../../../tokens';
import { W, withAO } from '../../../variants/v4/look';
import { Fleet, useBaked, type Placement } from '../../../variants/v4/bake';
import { SignWord } from '../../../variants/v4/models';
import { Box, Inst, Pools, ico, dode, rng, ribbonGeometry, unit, type It, type Pool, type Rect } from './kit';
import { G, mat } from './look';
import Yard from './yard';
import { ARC_R, END_X, JOG, S_X, routePoints } from './choreo';
import { VanModel } from './models';
import { useTruck } from './trucks';

// A Linde H30 parked in the yard, its own clone of the shared model
function Parked({ at }: { at: Placement }) {
  const t = useTruck('h30d');
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.add(t.root);
    return () => {
      t.root.removeFromParent();
    };
  }, [t]);
  return <group ref={ref} position={[at[0], at[1], at[2]]} rotation={[0, at[3], 0]} />;
}

// The lane and the path are one grey ribbon, with a white kerb either side
const laneMat = withAO(new THREE.MeshStandardMaterial({ color: G.dark, roughness: 0.96, emissive: G.dark, emissiveIntensity: 0.3 }), 0.3, 0.9);
const kerbMat = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.9 });
const markMat = W.mark.clone();

// big walls, with a little light of their own so the shaded faces stay pale and the top of the frame stays plain
const wallBright = new THREE.MeshStandardMaterial({ color: C.white, emissive: C.white, emissiveIntensity: 0.32, roughness: 0.9 });
const lawnMat = new THREE.MeshStandardMaterial({ color: C.hoverLightGrey, roughness: 1 });

// The office block runs the whole picture at C1, a plain white wall that the title of C1 lands on, glazing on the ground
// floor under it and on the upper floor from the right half on, the sign over the entrance. It is taller than the frame.
const BLOCK_A: Rect = [34, -24, 108, -10];
// the glazed office wing starts on the column 7 line of the page, the wing to its left is a plain white wall
const WING_X = 64.6;
const BLOCK_O: Rect = [WING_X, -24, 108, -9.7];
const BLOCK_H = 13;
// the upper floor glazing starts here, to the right of the C1 text columns
const UP_X = 65.2;
const glassMat = new THREE.MeshPhysicalMaterial({ color: G.mid, roughness: 0.15, metalness: 0.2, clearcoat: 1, envMapIntensity: 2, emissive: G.mid, emissiveIntensity: 0.2 });
const glassDark = new THREE.MeshPhysicalMaterial({ color: G.dark, roughness: 0.15, metalness: 0.2, clearcoat: 1, envMapIntensity: 2, emissive: G.dark, emissiveIntensity: 0.15 });
const officeWall = mat(G.pale, 0.4, 0.9, false);
const plinthMat = mat(G.light, 0.3);
const frameMat = mat(G.white, 0.45);
const doorMat = mat(G.graphite, 0.15, 0.6);
const hedgeMat = mat(G.mid, 0.2);
const hedgeLight = mat(G.light, 0.3);
const SHED: Rect = [112, -52, 140, -34];
const YARD_SHED: Rect = [-34, -35, 14, -20];

export function Site() {
  const lane = useMemo(() => {
    const pts = routePoints.filter((p) => p.x > -70);
    return { road: ribbonGeometry(pts, 3.7, 0.045), kerb: ribbonGeometry(pts, 4.5, 0.03) };
  }, []);

  const data = useMemo(() => {
    const r = rng(7);
    const marks: It[] = [];
    // centre dashes down the lane
    for (let x = -66; x < S_X - 2; x += 5) marks.push([x, 0.06, 0, 2.2, 0.02, 0.14]);
    // leg two of the path, dashes
    for (let x = S_X + 2 * ARC_R + 4; x < END_X - 3; x += 5) marks.push([x, 0.06, -JOG, 2.2, 0.02, 0.14]);
    // the facade, a storefront band of glazing on the ground floor all along, the upper floor from UP_X on, white frames
    const glass: It[] = [];
    const glassLow: It[] = [];
    const frames: It[] = [];
    const mull: It[] = [];
    for (let x = UP_X; x < BLOCK_A[2] - 2; x += 3.7) {
      if (x + 3 > 68.9 && x < 74.2) continue; // the entrance
      glassLow.push([x + 1.5, 1.5, -9.63, 3.0, 1.9, 0.12]);
      frames.push([x + 1.5, 1.5, -9.67, 3.3, 2.15, 0.1]);
      mull.push([x + 1.5, 1.5, -9.58, 0.07, 1.9, 0.14]);
    }
    for (let x = UP_X; x < BLOCK_A[2] - 2; x += 3.7) {
      glass.push([x + 1.5, 5.3, -9.63, 3.0, 1.9, 0.12]);
      frames.push([x + 1.5, 5.3, -9.67, 3.3, 2.15, 0.1]);
      mull.push([x + 1.5, 5.3, -9.58, 0.07, 1.9, 0.14]);
    }
    // the entrance, a pair of tall doors and the glazing round them
    glassLow.push([71.6, 1.3, -9.63, 5.0, 2.5, 0.12]);
    frames.push([71.6, 1.3, -9.67, 5.4, 2.7, 0.1]);
    mull.push([70.1, 1.3, -9.58, 0.09, 2.5, 0.14], [71.6, 1.3, -9.58, 0.12, 2.5, 0.14], [73.1, 1.3, -9.58, 0.09, 2.5, 0.14]);
    // a low hedge along the foot of the facade in two greys, with a break at the doors
    const hedges: It[] = [];
    const hedgesL: It[] = [];
    for (let x = 36; x < BLOCK_A[2] - 2; x += 3.2) {
      if (x > 67 && x < 76) continue;
      (r() < 0.5 ? hedges : hedgesL).push([x + 1.5, 0.3 + r() * 0.1, -8.9, 3.0, 0.6 + r() * 0.2, 0.8]);
    }
    // trees, a near row behind the building, far clusters
    const dark: It[] = [];
    const light: It[] = [];
    const trunks: It[] = [];
    const tree = (x: number, z: number, sc = 1) => {
      const h = (2.6 + r() * 2.2) * sc;
      const w = (1.6 + r() * 0.9) * sc;
      (r() < 0.6 && x > 118 ? dark : light).push([x, h, z, w, h * 0.62, w, r() * 6]);
      // a second, smaller crown on the first, so a tree reads as a trunk and two masses
      light.push([x + w * 0.12, h * 1.35, z - w * 0.1, w * 0.62, h * 0.36, w * 0.62, r() * 6]);
      trunks.push([x, h * 0.32, z, 0.24 * sc, h * 0.64, 0.24 * sc]);
    };
    const clear = (x: number, z: number, m = 0) => {
      const inR = ([x0, z0, x1, z1]: Rect) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m;
      if ([BLOCK_A, SHED, YARD_SHED].some(inR)) return false;
      if (x < S_X + 3 && Math.abs(z) < 5 + m) return false;
      if (x > 28 && x < 112 && z < -6) return false; // behind the office block
      if (x > 96 && x < 215 && z > -52 && z < 40) return false; // the yard apron of R
      if (x > 150 && x < 215 && z > -26 && z < 8) return false;
      // the S path, a margin round it
      if (x > S_X - 6 && x < END_X + 6 && z < 6 && z > -JOG - 6) return false;
      return true;
    };
    for (let x = -80; x < -38; x += 9) tree(x + r() * 2, -10 - r() * 3, 0.65);
    for (let x = -80; x < 215; x += 9.5) {
      const z = -36 - r() * 14;
      if (clear(x, z)) tree(x, z, 0.7 + r() * 0.15);
    }
    for (let k = 0; k < 70; k++) {
      const x = -90 + r() * 330;
      const z = -26 - r() * 70;
      if (clear(x, z, 2)) tree(x, z, x > 118 ? 0.9 + r() * 0.7 : 0.7 + r() * 0.15);
    }
    // a few near the south side, and beside the S path at a distance
    for (let k = 0; k < 24; k++) {
      const x = -80 + r() * 300;
      const z = 22 + r() * 40;
      if (clear(x, z, 2)) tree(x, z, 0.9 + r() * 0.6);
    }
    // lamp posts on the south side of the lane, arms toward it
    const poles: It[] = [];
    const arms: It[] = [];
    const heads: It[] = [];
    // a fence between the lane and the lawn, rails and posts
    const fenceP: It[] = [];
    const fenceR: It[] = [];
    for (let x = 30; x < 100; x += 2) fenceP.push([x, 0.5, -3.7, 0.08, 1.0, 0.08]);
    fenceR.push([65, 0.88, -3.7, 70, 0.07, 0.05], [65, 0.55, -3.7, 70, 0.07, 0.05]);
    // low shrubs on the south side, close to the camera
    const south: It[] = [];
    for (let x = -72; x < 118; x += 4.4) {
      if (r() < 0.35) continue;
      const s = 0.6 + r() * 0.5;
      south.push([x + r() * 2, s * 0.14, 8 + r() * 2, s * 0.4, s * 0.26, s * 0.38, r() * 6]);
    }
    // far hangars
    const hang: It[] = [];
    for (let x = -80; x < 220; x += 34) hang.push([x + r() * 12, 2.2 + r(), -72 - r() * 14, 22 + r() * 10, 4.4 + r() * 2, 12 + r() * 5]);
    return { marks, glass, glassLow, frames, mull, hedges, hedgesL, dark, light, trunks, poles, arms, heads, fenceP, fenceR, south, hang };
  }, []);

  const pools = useMemo<Pool[]>(() => {
    const p: Pool[] = [
      [57, -16, 38 + 5, 12 + 5],
      [86, -15, 20 + 4, 10 + 4],
      [-10, -27, 48 + 5, 15 + 5],
    ];
    return p;
  }, []);

  // vans parked along the front, forklifts in the yard beside the shed
  const van = useBaked('g-van', <VanModel />, (m) => m);
  const vans = useMemo<Placement[]>(
    () => [
      [92.5, 0, -5.8, 0],
      [-31, 0, -5.4, Math.PI],
      [16, 0, -5.6, 0],
    ],
    [],
  );
  const parked = useMemo<Placement[]>(() => {
    const o: Placement[] = [];
    for (let i = 0; i < 10; i++) o.push([-29 + i * 3.1, 0, -14.5, -Math.PI / 2 + (i % 3) * 0.05]);
    for (let i = 0; i < 6; i++) o.push([-24 + i * 4.4, 0, -17.3, -Math.PI / 2 - (i % 2) * 0.07]);
    for (let i = 0; i < 4; i++) o.push([83 + i * 3.1, 0, -8.0, -Math.PI / 2 + (i % 2) * 0.05]);
    return o;
  }, []);
  const vanPools = useMemo<Pool[]>(() => [...vans.map(([x, , z]) => [x - 0.3, z, 8, 3.4] as Pool), ...parked.map(([x, , z]) => [x, z, 2.4, 4.6] as Pool)], [vans, parked]);

  return (
    <group>
      {van.source}
      {/* the ground, the lane and the path */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={W.ground}>
        <planeGeometry args={[2200, 2200]} />
      </mesh>
      <Box a={[30, -9, 100, -3.9]} y={0.01} h={0.03} m={lawnMat} cast={false} />
      <mesh geometry={lane.kerb} material={kerbMat} receiveShadow />
      <mesh geometry={lane.road} material={laneMat} receiveShadow />
      <Inst mat={markMat} items={data.marks} cast={false} />

      {/* the office block, a plain white wall with its glazing, the shed and the yard shed behind */}
      <Box a={BLOCK_A} h={BLOCK_H} m={wallBright} />
      <Box a={BLOCK_O} h={BLOCK_H} m={officeWall} />
      <Box a={[BLOCK_A[0], BLOCK_A[1], WING_X, -9.85]} h={0.7} m={plinthMat} />
      <Box a={SHED} h={6.5} m={wallBright} />
      <Box a={YARD_SHED} h={4.6} m={wallBright} />
      <Box a={[-34.2, -35, 14.2, -19.8]} y={4.5} h={0.3} m={wallBright} />
      {/* the roller doors of the yard shed, a row facing the lane */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} geometry={unit} material={doorMat} position={[-29 + i * 8, 1.8, -19.9]} scale={[4.2, 3.6, 0.12]} />
      ))}
      <Inst mat={frameMat} items={data.frames} cast={false} />
      <Inst mat={glassMat} items={data.glass} cast={false} />
      <Inst mat={glassDark} items={data.glassLow} cast={false} />
      <Inst mat={frameMat} items={data.mull} cast={false} />
      {/* entrance canopy on two posts, with the company name above it */}
      <Box a={[68.4, -9.7, 74.8, -7.4]} y={2.6} h={0.2} m={wallBright} />
      {[68.8, 74.4].map((x) => (
        <mesh key={x} geometry={unit} material={wallBright} position={[x, 1.3, -7.6]} scale={[0.16, 2.6, 0.16]} castShadow />
      ))}
      <Box a={[67.9, -9.76, 73.2, -9.6]} y={3.1} h={0.8} m={W.ink} cast={false} />
      <SignWord word="EKOTEHNIKA" h={0.45} position={[70.55, 3.27, -9.6]} />

      {/* the yard seen from above, south of and around the S path */}
      <Yard />

      {/* greenery in front, a fence and the lamps */}
      <Inst mat={hedgeMat} items={data.hedges} />
      <Inst mat={hedgeLight} items={data.hedgesL} />
      <Inst geo={dode} mat={W.tree} items={data.dark} />
      <Inst geo={ico} mat={W.treeLight} items={data.light} />
      <Inst mat={W.trunk} items={data.trunks} />
      <Inst mat={W.wall} items={data.fenceP} />
      <Inst mat={W.wall} items={data.fenceR} />
      <Inst mat={W.ink} items={data.poles} />
      <Inst mat={W.ink} items={data.arms} />
      <Inst mat={W.lamp} items={data.heads} cast={false} />
      <Inst mat={W.wallShade} items={data.hang} />
      <Pools items={pools} />
      <Pools items={vanPools} />
      <Fleet parts={van.parts} items={vans} />
      {parked.map((p, i) => (
        <Parked key={i} at={p} />
      ))}
    </group>
  );
}
