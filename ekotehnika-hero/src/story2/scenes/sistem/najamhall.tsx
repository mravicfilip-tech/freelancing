// The Najam hall and the site around it, everything that stands still. The hall is a cutaway on a platform 1.2 m over the yard, the
// height of a lorry's bed. The two far walls stand the full 9.6 m with their columns, an eave beam and the edge of the roof drawn as a thin
// slab on top of them, so the camera always looks in and no column stands without the beam it carries. The two near walls are a low
// plinth, and the four dock doors stand in the dock wall. The floor carries its markings edge to edge, the aisle lines, the lane
// arrows, the staging lanes in front of the docks with their pallets, the hatched walkway, the dock bays and the bays of the floor
// storage. A charging corner, a small office, stacks of empty pallets and a wrapping station fill the floor the racks leave. Outside
// the docks a paved yard has a marked bay at every door, a yard road with a kerb that runs out to the frame edge, and a hedge and a
// line of the site's low poly trees closing it off, with the marked bays of a car park on the forecourt in front of the hall. All of it is instanced and
// in the light ground and the LMH greys. The hall's metres are the ones of najamplan.ts, the platform top is y 0 in them.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ModelName } from './models';
import { BoxSet, Hedge, Kerb, LampPost, Trees, Van, type BoxItem, type TreeSpec } from './props';
import { Barrier, GateHouse } from './yard';
import { K, lam, lit, rng, wordmarkSign } from './kit';
import { HALL } from './najamplan';
import { Slats, apron, arrow, beamFlange, beamWeb, black, claddingMat, copingMat, darkGrey, doorMat, frameMat, hatch, jointLine, leafMat, line, lineFaint, lineWhite, loadMats, officeGlass, palletBase, pilasterMat, plinthMat, rackGrey, roadMat, roofMat, skylightMat, slab, underMat, wallBase, wallMat, wrapBand, wrapShell, type SlatItem } from './najamkit';

// ---- the hall's measures ----------------------------------------------------------------------------------------------

export const DOOR_W = 3.6;
export const DOOR_H = 3.9;
export const WALL_T = 0.4;
export const PLINTH = 1.0;
export const WALL_H = 10;
// the wordmark on the long wall that faces the forecourt, 24 m wide and 4.9 m high, on the wall left of the office block, so the letters are
// 3 m tall and read from the high views of N1 and N4. It stands low enough on the wall to pass under the facts row in the flight down to N2, and
// it is drawn out while the camera of the third flight rises over the roof, see signFade, since there every part of the building crosses the
// title of the terms
export const SIGN_W = 24;
const SIGN_Y = 1.9;
const SIGN_X = -26;
export const BACK_X = HALL.backX;
export const FRONT_Z = 15.6;
// the platform, a little proud of the walls
const PX0 = BACK_X - 0.3;
const PX1 = HALL.dockX + WALL_T;
const PZ0 = HALL.sideZ - 0.3;
const PZ1 = FRONT_Z + 0.3;
const MIDZ = (PZ0 + PZ1) / 2;
// the face of the dock wall the lorries back onto, and the walls' footprints
export const DOCK_OUT = PX1 + 0.35;

// The rented trucks that wait at their bays along the far wall, facing the docks. Model, x, heading in radians. The row runs the length
// of the wall, five trucks and the empty bay nearest the door, so the strip in front of it reads as a depot's bays and not as a few trucks left
// about, and the camera that comes in through the door of dock 1 has no truck within 12 m of it.
export const PARK_Z = -14.5;
export const PARKED: [ModelName, number, number][] = [
  ['x50', -2.4, 0],
  ['n20', -8.0, 0],
  ['r16', -13.6, 0],
  ['x50', -19.2, 0],
  ['d12', -24.8, 0],
];
// No charging corner and no wrapping station any more. The inside is seen from the dock end of the work aisle in N3, where the whole left of the frame
// is the long wall of the hall and the words lie over it, so the left of the hall is left as floor and its markings.
export const CHARGING: [ModelName, number, number, number][] = [];
// the two lanes of the dock bays the trucks of the plan work in, see najamdock.ts
export const DOCK_LANE_X = 10.4;

// ---- pallets standing on the floor ------------------------------------------------------------------------------------

export type PalletSets = { base: BoxItem[]; loads: BoxItem[][]; shell: BoxItem[]; bands: BoxItem[] };
export const newSets = (): PalletSets => ({ base: [], loads: [[], [], []], shell: [], bands: [] });

// A loaded pallet on the floor, 1.2 m along x or, turned, along z.
export function loadedPallet(s: PalletSets, r: () => number, x: number, z: number, turned = false, y0 = 0) {
  const h = 0.9 + r() * 0.4;
  const [a, b] = turned ? [0.82, 1.2] : [1.2, 0.82];
  const [la, lb] = turned ? [0.88, 1.08] : [1.08, 0.88];
  s.base.push([x, y0 + 0.07, z, a, 0.14, b]);
  s.loads[Math.floor(r() * 3)].push([x, y0 + 0.14 + h / 2, z, la, h, lb]);
  s.shell.push([x, y0 + 0.14 + h / 2, z, la + 0.05, h + 0.03, lb + 0.05]);
  s.bands.push([x, y0 + 0.14 + h * 0.3, z, la + 0.07, 0.07, lb + 0.07], [x, y0 + 0.14 + h * 0.68, z, la + 0.07, 0.07, lb + 0.07]);
}

export function PalletSet({ s }: { s: PalletSets }) {
  return (
    <group>
      <BoxSet items={s.base} mat={palletBase} cast />
      {s.loads.map((l, i) => (
        <BoxSet key={i} items={l} mat={loadMats[i]} cast />
      ))}
      <BoxSet items={s.shell} mat={wrapShell} receive={false} />
      <BoxSet items={s.bands} mat={wrapBand} receive={false} />
    </group>
  );
}

// ---- the lanes of the staging floor -----------------------------------------------------------------------------------

// In front of every dock two lanes run along x from the walkway toward the racks, 1.3 m wide with three pallet places each. The lanes of
// dock 4 are one, the office takes the place of the other. Between the doors the wall lane holds what has just come off a lorry, 1.2 m
// pallets turned along the wall.
const LANE_X0 = 2.8;
const LANE_X1 = 6.8;
export const LANE_W = 1.3;
export const laneZ = (dock: number, side: -1 | 1) => HALL.docks[dock] + side * 1.55;
export const WALL_LANE_X = 13.15;
// the places of the wall lane between dock i and i + 1, three of them 1.3 m apart on the middle of the gap
export const wallLaneZ = (gap: number, slot: number) => (HALL.docks[gap] + HALL.docks[gap + 1]) / 2 + (slot - 1) * 1.3;

// ---- the hall ---------------------------------------------------------------------------------------------------------

// inside is the group of what lies on the hall's floor and is swapped for the automation aisle's in T, its markings, the pallets in the lanes, the empty
// stacks, the chargers and the office cabin
export type HallRefs = { doors: React.MutableRefObject<(THREE.Group | null)[]>; roofHatch: React.RefObject<THREE.Group | null>; inside: React.RefObject<THREE.Group | null>; signFade: React.MutableRefObject<number> };

export function Hall({ doors, roofHatch, inside, signFade }: HallRefs) {
  const signGroup = useRef<THREE.Group>(null);
  const sign = useMemo(() => {
    const { parts, s, view } = wordmarkSign(SIGN_W, 0.25, 0.08);
    return { parts: parts.map((p) => ({ ...p, material: lam(p.fill, { emissive: lit(p.fill).multiplyScalar(0.5), transparent: true }) })), s, view };
  }, []);
  useFrame(() => {
    const a = signFade.current;
    sign.parts.forEach((p) => (p.material.opacity = a));
    if (signGroup.current) signGroup.current.visible = a > 0.01;
  });
  const d = useMemo(() => {
    // the platform and its kerb, the floor is its top face
    const platform: BoxItem[] = [[(PX0 + PX1) / 2, -0.6, MIDZ, PX1 - PX0, 1.2, PZ1 - PZ0]];
    const kerb: BoxItem[] = [
      [(PX0 + PX1) / 2, 0.03, PZ1 - 0.07, PX1 - PX0, 0.06, 0.14],
      [PX1 - 0.07, 0.03, MIDZ, 0.14, 0.06, PZ1 - PZ0],
    ];

    // the shell, closed on four sides. The back wall, the far side wall and the near side wall are a panel 10 m high with a column every 6 m on
    // their inside faces, the dock wall is a facade of piers between the doors with a lintel over each door, a plinth band round the foot of all
    // four, a parapet round the roof and a roof of slabs with a long roof light between them. The inside shows only to a camera that has gone
    // through a door or a roof light. None of it casts a shadow, so the hall is lit as brightly as the yard.
    const wall: BoxItem[] = [];
    const cols: BoxItem[] = [];
    const lenZ = PZ1 - PZ0;
    const lenX = PX1 - PX0;
    wall.push([BACK_X + 0.15, WALL_H / 2, MIDZ, 0.3, WALL_H, lenZ]);
    wall.push([(PX0 + PX1) / 2 + 0.15, WALL_H / 2, HALL.sideZ - 0.15, lenX - 0.3, WALL_H, 0.3]);
    wall.push([(BACK_X + PX1) / 2, WALL_H / 2, FRONT_Z + 0.15, PX1 - BACK_X, WALL_H, 0.3]);
    for (let z = HALL.sideZ + 1.2; z < PZ1; z += 6) cols.push([BACK_X + 0.5, WALL_H / 2, z, 0.4, WALL_H, 0.4]);
    // columns on the back wall and the far side wall only, the near long wall stays plain, the words of N3 lie over it
    for (let x = BACK_X + 1.5; x < HALL.dockX - 2; x += 6) cols.push([x, WALL_H / 2, HALL.sideZ + 0.2, 0.4, WALL_H, 0.4]);
    // the dock wall, piers between the doors and a lintel over each, the skin and the plinth of the outside are the Facade below
    const wx = HALL.dockX + WALL_T / 2;
    const edges = [HALL.sideZ, ...HALL.docks.flatMap((z) => [z - DOOR_W / 2, z + DOOR_W / 2]), FRONT_Z];
    for (let i = 0; i < edges.length; i += 2) {
      const zc = (edges[i] + edges[i + 1]) / 2;
      const len = edges[i + 1] - edges[i];
      wall.push([wx, WALL_H / 2, zc, WALL_T, WALL_H, len]);
    }
    wall.push([wx, WALL_H / 2, FRONT_Z + 0.15, WALL_T, WALL_H, 0.3]);
    HALL.docks.forEach((z) => wall.push([wx, (DOOR_H + WALL_H) / 2, z, WALL_T, WALL_H - DOOR_H, DOOR_W]));
    // the roof, slabs along z between the five long roof lights, 1.8 m wide, a parapet round it with a light cap, and the roof units
    const roofS: BoxItem[] = [];
    const lightsX = LIGHTS_X;
    let x0 = PX0;
    lightsX.forEach((lx) => {
      roofS.push([(x0 + lx - 0.9) / 2, WALL_H + 0.2, MIDZ, lx - 0.9 - x0, 0.4, lenZ]);
      x0 = lx + 0.9;
    });
    roofS.push([(x0 + PX1) / 2, WALL_H + 0.2, MIDZ, PX1 - x0, 0.4, lenZ]);
    // the roof membrane, a seam every 1.5 m along z and a lap every 5 m along x between the roof lights, so a roof seen from above is a surface with a
    // grain and not a plain white plane (round 7)
    const seams: BoxItem[] = [];
    let sx0 = PX0 + 1.2;
    [...lightsX, PX1 + 0.9].forEach((lx) => {
      const xe = Math.min(lx - 1.2, PX1 - 1.2);
      for (let x = sx0 + 0.75; x < xe; x += 1.5) seams.push([x, WALL_H + 0.41, MIDZ, 0.05, 0.01, lenZ - 2.4]);
      for (let z = PZ0 + 5; z < PZ1 - 2; z += 5) seams.push([(sx0 + xe) / 2, WALL_H + 0.41, z, xe - sx0, 0.01, 0.05]);
      sx0 = lx + 1.2;
    });
    const lights = lightsX.map((lx) => [[lx, WALL_H + 0.16, MIDZ, 1.8, 0.1, lenZ - 0.6] as BoxItem]);
    // the roof lights stand in a raised curb of the light grey, a frame round each pane, so they read as glazed strips and not as a seam, and a
    // gutter runs along the foot of the parapet with a drain of the medium grey every 12 m
    const curb: BoxItem[] = [];
    const roofTrim: BoxItem[] = [];
    const drains: BoxItem[] = [];
    lightsX.forEach((lx) => {
      curb.push([lx - 0.93, WALL_H + 0.46, MIDZ, 0.14, 0.12, lenZ - 0.4], [lx + 0.93, WALL_H + 0.46, MIDZ, 0.14, 0.12, lenZ - 0.4]);
      curb.push([lx, WALL_H + 0.46, MIDZ - (lenZ - 0.5) / 2, 2.0, 0.12, 0.14], [lx, WALL_H + 0.46, MIDZ + (lenZ - 0.5) / 2, 2.0, 0.12, 0.14]);
    });
    roofTrim.push([(PX0 + PX1) / 2, WALL_H + 0.43, PZ0 + 0.5, lenX - 0.7, 0.06, 0.26], [(PX0 + PX1) / 2, WALL_H + 0.43, PZ1 - 0.5, lenX - 0.7, 0.06, 0.26], [PX1 - 0.5, WALL_H + 0.43, MIDZ, 0.26, 0.06, lenZ - 0.7], [PX0 + 0.5, WALL_H + 0.43, MIDZ, 0.26, 0.06, lenZ - 0.7]);
    for (let x = PX0 + 6; x < PX1 - 3; x += 12) drains.push([x, WALL_H + 0.47, PZ0 + 0.5, 0.4, 0.05, 0.4], [x, WALL_H + 0.47, PZ1 - 0.5, 0.4, 0.05, 0.4]);
    for (let z = PZ0 + 6; z < PZ1 - 3; z += 12) drains.push([PX1 - 0.5, WALL_H + 0.47, z, 0.4, 0.05, 0.4], [PX0 + 0.5, WALL_H + 0.47, z, 0.4, 0.05, 0.4]);
    const para: BoxItem[] = [
      [PX0 + 0.1, WALL_H + 0.7, MIDZ, 0.3, 0.6, lenZ],
      [PX1 - 0.15, WALL_H + 0.7, MIDZ, 0.3, 0.6, lenZ],
      [(PX0 + PX1) / 2, WALL_H + 0.7, PZ0 + 0.15, lenX, 0.6, 0.3],
      [(PX0 + PX1) / 2, WALL_H + 0.7, PZ1 - 0.15, lenX, 0.6, 0.3],
    ];
    // the coping, a band of the medium grey 0.2 m deep over the whole parapet, the darkest line of the roof edge
    const paraCap: BoxItem[] = [
      [PX0 + 0.1, WALL_H + 1.1, MIDZ, 0.46, 0.2, lenZ + 0.1],
      [PX1 - 0.15, WALL_H + 1.1, MIDZ, 0.46, 0.2, lenZ + 0.1],
      [(PX0 + PX1) / 2, WALL_H + 1.1, PZ0 + 0.15, lenX, 0.2, 0.46],
      [(PX0 + PX1) / 2, WALL_H + 1.1, PZ1 - 0.15, lenX, 0.2, 0.46],
    ];
    // They stand on the near half of the roof, the half that lies below the facts row in the high views of N1 and N4, and their curbs, louvres and
    // fans are the light greys, so nothing on the roof is darker than a step of grey behind a word in the flight down to N2.
    // the roof units, each on a curb of the medium grey with a fan hole in its top, an intake of louvres on the faces that look at the camera
    // and a duct that leaves it, a plant of its own and not a bare box
    const units: BoxItem[] = [];
    const unitFans: BoxItem[] = [];
    const unitCurbs: BoxItem[] = [];
    const louvres: BoxItem[] = [];
    ([[-19.5, 12, 3.4, 2.0, 1.7], [-9, 5, 2.6, 1.7, 1.5], [7, -9, 3.0, 1.9, 1.6], [-1, 12, 2.2, 2.2, 1.3], [9, 10, 2.4, 1.5, 1.3], [-3, -6, 1.6, 1.6, 2.4], [-10, -9, 2.4, 1.6, 1.4], [-20, -4, 2.0, 1.8, 1.5], [-2, 2, 2.6, 1.8, 1.6], [7.5, -3, 2.2, 1.6, 1.4]] as const).forEach(([x, z, w, dd, h]) => {
      units.push([x, WALL_H + 0.4 + h / 2, z, w, h, dd]);
      unitFans.push([x, WALL_H + 0.4 + h + 0.03, z, w * 0.6, 0.06, dd * 0.6]);
      unitCurbs.push([x, WALL_H + 0.5, z, w + 0.3, 0.2, dd + 0.3]);
      for (let i = 0; i < 4; i++) {
        const y = WALL_H + 0.4 + h * (0.28 + i * 0.16);
        louvres.push([x, y, z + dd / 2 + 0.02, w * 0.7, 0.05, 0.04], [x + w / 2 + 0.02, y, z, 0.04, 0.05, dd * 0.7]);
      }
      unitCurbs.push([x - w / 2 - 0.9, WALL_H + 0.65, z, 1.8, 0.35, 0.5]);
    });
    // the ceiling seen from inside, a truss every 6 m with its lamps hung below and a line of lamps between
    const trusses: BoxItem[] = [];
    const ceilLamps: BoxItem[] = [];
    for (let x = BACK_X + 3; x < HALL.dockX; x += 6) trusses.push([x, WALL_H - 0.5, MIDZ, 0.3, 0.9, lenZ - 0.6]);
    for (let x = BACK_X + 6; x < HALL.dockX - 1; x += 6) for (let z = HALL.sideZ + 3; z < FRONT_Z - 1; z += 5) ceilLamps.push([x, WALL_H - 1.2, z, 0.3, 0.1, 3.2]);
    // the slat each door rolls up into and the leveller plate behind it, the frames, seals, bumpers, canopies and lights of the doors are the
    // Facade below
    const door: BoxItem[] = [];
    const lev: BoxItem[] = [];
    HALL.docks.forEach((z) => {
      door.push([HALL.dockX + 0.2, DOOR_H + 0.2, z, 0.1, 0.2, DOOR_W]);
      lev.push([HALL.dockX - 1.2, 0.04, z, 2.4, 0.08, 2.4]);
    });
    void edges;

    // ---- the floor, slab joints every 6 m and the markings of the whole of it
    const joints: BoxItem[] = [];
    for (let x = BACK_X + 3; x < HALL.dockX; x += 6) joints.push([x, 0.02, MIDZ, 0.04, 0.01, FRONT_Z - HALL.sideZ]);
    for (let z = HALL.sideZ + 4; z < FRONT_Z; z += 6) joints.push([(HALL.dockX + BACK_X) / 2, 0.02, z, HALL.dockX - BACK_X, 0.01, 0.04]);

    const marks: BoxItem[] = [];
    const slats: SlatItem[] = [];
    const hl = (x0: number, x1: number, z: number, t = 0.1) => marks.push([(x0 + x1) / 2, 0.03, z, x1 - x0, 0.01, t]);
    const vl = (x: number, z0: number, z1: number, t = 0.1) => marks.push([x, 0.03, (z0 + z1) / 2, t, 0.01, z1 - z0]);
    const rect = (x0: number, x1: number, z0: number, z1: number) => {
      hl(x0, x1, z0);
      hl(x0, x1, z1);
      vl(x0, z0, z1);
      vl(x1, z0, z1);
    };
    const dashH = (x0: number, x1: number, z: number, dash = 1.4, gap = 1.4) => {
      for (let x = x0; x + dash <= x1; x += dash + gap) marks.push([x + dash / 2, 0.03, z, dash, 0.01, 0.1]);
    };
    const dashV = (x: number, z0: number, z1: number, dash = 1.4, gap = 1.4) => {
      for (let z = z0; z + dash <= z1; z += dash + gap) marks.push([x, 0.03, z + dash / 2, 0.1, 0.01, dash]);
    };
    // the three aisles, an edge line on each side from the back wall to the mouth, a dashed middle and an arrow every 9 m, pointing the
    // way in on one side of the middle and out on the other
    HALL.aisles.forEach((za) => {
      hl(BACK_X, X_MOUTH, za - 2.3);
      hl(BACK_X, X_MOUTH, za + 2.3);
      dashH(BACK_X + 0.4, X_MOUTH, za);
      for (let x = -4; x > BACK_X + 3; x -= 9) {
        slats.push(...arrow(x, za - 1.15, Math.PI));
        slats.push(...arrow(x - 4.5, za + 1.15, 0));
      }
    });
    // the cross aisle behind the last bay, two edges and an arrow down the middle every 6 m, and the hatched keep clear at the walls
    const back = HALL.rackX0 - HALL.bays * HALL.bay;
    vl(back - 0.9, PZ0 + 0.2, PZ1 - 0.2);
    vl(back - 5.4, PZ0 + 0.2, PZ1 - 0.2);
    for (let z = HALL.sideZ + 3; z < FRONT_Z - 2; z += 6) slats.push(...arrow(back - 3.15, z, z % 12 < 6 ? Math.PI / 2 : -Math.PI / 2));
    slats.push(...hatch(back - 5.4, back - 0.9, PZ0 + 0.3, PZ0 + 1.5, 0.8), ...hatch(back - 5.4, back - 0.9, PZ1 - 1.5, PZ1 - 0.3, 0.8));
    // the hatched walkway along the dock wall, 1.2 m wide with an edge line on each side and a bar every 0.7 m
    vl(7.0, PZ0 + 0.2, PZ1 - 0.2);
    vl(8.2, PZ0 + 0.2, PZ1 - 0.2);
    slats.push(...hatch(7.0, 8.2, PZ0 + 0.2, PZ1 - 0.2, 0.7));
    // a dock bay in front of each door, two side lines and a dashed stop line with an arrow in
    HALL.docks.forEach((z) => {
      hl(DOCK_LANE_X, HALL.dockX - 0.05, z - 1.9);
      hl(DOCK_LANE_X, HALL.dockX - 0.05, z + 1.9);
      dashV(DOCK_LANE_X, z - 1.9, z + 1.9, 0.5, 0.35);
      slats.push(...arrow(DOCK_LANE_X + 1.6, z, 0, 1.8));
    });
    // the wall lane between the doors, a cell for each pallet
    for (let g = 0; g < 3; g++) {
      const a = HALL.docks[g] + 2.0;
      const b = HALL.docks[g + 1] - 2.0;
      rect(WALL_LANE_X - 0.8, WALL_LANE_X + 0.8, a, b);
      for (let s = 0; s < 4; s++) hl(WALL_LANE_X - 0.8, WALL_LANE_X + 0.8, a + ((b - a) / 3) * s * 0.9999 + 0.0, 0.06);
    }
    // the staging lanes in front of the docks, closed cells with an arrow at the walkway end
    HALL.docks.forEach((_, i) => {
      for (const side of [-1, 1] as const) {
        if (i === 3 && side === 1) continue;
        const zc = laneZ(i, side);
        rect(LANE_X0, LANE_X1, zc - LANE_W / 2, zc + LANE_W / 2);
        slats.push(...arrow(LANE_X1 - 0.6, zc, Math.PI, 1.0));
      }
    });
    // the far corner of the wall lane, where the second pallet of the lorry is set down
    rect(WALL_LANE_X - 0.8, WALL_LANE_X + 0.8, HALL.docks[0] - 4.0, HALL.docks[0] - 2.2);
    // the edge of the staging floor where the racks begin
    vl(X_MOUTH + 0.1, PZ0 + 0.2, PZ1 - 0.2, 0.14);
    // the floor storage of the front lane, five bays of 2.5 by 2.2 m, and the corner of the chargers hatched
    for (let x = -12.5; x < 0; x += 2.5) vl(x, 12.9, 15.1);
    hl(-12.5, 0, 12.9);
    hl(-12.5, 0, 15.1);
    // and a row of seven bays of 2.6 by 2.4 m along the open edge of the work aisle, where a rack block would have stood, pallets two high
    for (let x = -24.0; x <= -5.8; x += 2.6) vl(x, 10.5, 12.9);
    hl(-24.0, -5.8, 10.5);
    hl(-24.0, -5.8, 12.9);
    rect(-29.2, -21.4, 12.2, 15.2);
    slats.push(...hatch(-29.2, -21.4, 12.2, 15.2, 1.1));
    // a bay for each of the rented trucks that stand along the far wall
    [3.0, ...PARKED.map((p) => p[1])].forEach((x) => rect(x - 2.3, x + 2.3, PARK_Z - 1.1, PARK_Z + 1.1));

    // ---- what stands on the floor, pallets in the lanes, in the wall lane and in the floor storage
    const r = rng(77);
    const pal = newSets();
    HALL.docks.forEach((_, i) => {
      for (const side of [-1, 1] as const) {
        if (i === 3 && side === 1) continue;
        // the lanes of the first two docks stay empty, the camera of the flight in goes through the door of the first and along the wall past the
        // second, and a pallet in them would be within 6 m of it, the pallets that come off the lorry are set down in the aisle, see najamdock.ts
        // of the others only the lane of the third dock on the side of the work aisle holds pallets, the lanes on its left lie under the term cards in N3
        if (i < 2 || (HALL.docks[i] > 0 && !(i === 2 && side < 0))) continue;
        const n = i === 0 ? 2 : side < 0 ? 3 : 2;
        for (let p = 0; p < n; p++) loadedPallet(pal, r, LANE_X0 + 0.8 + p * 1.3, laneZ(i, side), false);
      }
    });
    // empty pallets in stacks of eight, by the back wall's corner and by the front wall
    const empties: BoxItem[] = [];
    const stackOf = (x: number, z: number, n: number, turned = false) => {
      for (let i = 0; i < n; i++) empties.push([x + (i % 2) * 0.02, 0.07 + i * 0.15, z, turned ? 0.82 : 1.2, 0.14, turned ? 1.2 : 0.82]);
    };
    stackOf(-27.5, -13.2, 10, true);
    stackOf(-27.5, -11.8, 10, true);
    stackOf(-26.1, -13.2, 8, true);

    // the chargers of the charging corner, a cabinet with a lamp on its top, and the cable
    const chargers: BoxItem[] = [];
    const lamps: BoxItem[] = [];
    CHARGING.forEach(([, x]) => {
      chargers.push([x, 0.7, 15.1, 0.7, 1.4, 0.4], [x + 0.9, 0.03, 14.3, 0.04, 0.03, 1.6]);
      lamps.push([x, 1.5, 15.1, 0.2, 0.1, 0.2]);
    });


    // the office cabin, 1.9 by 4.4 m and 2.7 m high in the corner behind the racks, out of the way of the cross aisle, its roof proud all
    // round, a door and two windows on the side that faces the hall, and two steps
    const cx = -29.7;
    const cz = -13.4;
    const cabin: BoxItem[] = [[cx, 1.4, cz, 1.9, 2.8, 4.4]];
    const cabinRoof: BoxItem[] = [[cx, 2.9, cz, 2.3, 0.14, 4.8]];
    const cabinGlass: BoxItem[] = [[cx + 0.96, 1.75, cz - 1.2, 0.04, 0.8, 1.6], [cx + 0.96, 1.75, cz + 0.5, 0.04, 0.8, 0.8]];
    const cabinDoor: BoxItem[] = [[cx + 0.96, 1.05, cz + 1.6, 0.05, 2.1, 0.9]];
    const cabinStep: BoxItem[] = [[cx + 1.25, 0.1, cz + 1.6, 0.55, 0.2, 1.2], [cx + 1.13, 0.25, cz + 1.6, 0.3, 0.1, 1.2]];
    return { platform, kerb, wall, cols, roofS, seams, lights, curb, roofTrim, drains, para, paraCap, units, unitFans, unitCurbs, louvres, trusses, ceilLamps, door, lev, joints, marks, slats, pal, empties, chargers, lamps, cabin, cabinRoof, cabinGlass, cabinDoor, cabinStep };
  }, []);
  return (
    <group>
      <BoxSet items={d.platform} mat={slab} />
      <BoxSet items={d.kerb} mat={wallBase} receive={false} />
      <BoxSet items={d.wall} mat={wallMat} />
      <BoxSet items={d.cols} mat={wallMat} />
      <BoxSet items={d.door} mat={leafMat} />
      <BoxSet items={d.lev} mat={beamWeb} />
      <Facade />
      <Office />
      {/* the doors roll up into their slat, hung from the head of the frame so each slides up into the wall over it */}
      {HALL.docks.map((z, i) => (
        <group key={i} ref={(g) => { doors.current[i] = g; }} position={[HALL.dockX + 0.2, DOOR_H, z]}>
          <BoxSet items={[[0, -DOOR_H / 2, 0, 0.1, DOOR_H, DOOR_W]]} mat={leafMat} />
          <BoxSet items={[1, 2, 3, 4, 5].map((g) => [0.06, -(DOOR_H / 6) * g, 0, 0.04, 0.05, DOOR_W - 0.1] as BoxItem)} mat={frameMat} receive={false} />
          <BoxSet items={[-0.5, -0.17, 0.17, 0.5].map((c) => [0.06, -DOOR_H / 12, c * DOOR_W * 0.8, 0.04, 0.22, 0.5] as BoxItem)} mat={darkGrey} receive={false} />
        </group>
      ))}
      {/* the wordmark on the front wall, extruded from the brand file the way the Kompanija building has it, reading from the forecourt */}
      <group ref={signGroup} position={[SIGN_X, SIGN_Y, PZ1 + 0.04]}>
        <group position={[-sign.s * sign.view[0], sign.s * (sign.view[1] + sign.view[3]), 0]} scale={[sign.s, -sign.s, sign.s]}>
          {sign.parts.map((p, i) => (
            <mesh key={i} geometry={p.geo} material={p.material} />
          ))}
        </group>
      </group>
      {/* the roof, with the roof lights and the units on it, the trusses and lamps under it. The last roof light is a hatch on a hinge along its east edge */}
      <group>
        <BoxSet items={d.roofS} mat={roofMat} />
        <BoxSet items={d.seams} mat={jointLine} receive={false} />
        <BoxSet items={d.para} mat={wallMat} />
        <BoxSet items={d.paraCap} mat={copingMat} receive={false} />
        <BoxSet items={d.curb} mat={pilasterMat} receive={false} />
        <BoxSet items={d.roofTrim} mat={plinthMat} receive={false} />
        <BoxSet items={d.drains} mat={copingMat} receive={false} />
        <BoxSet items={d.units} mat={wallMat} />
        <BoxSet items={d.unitCurbs} mat={pilasterMat} receive={false} />
        <BoxSet items={d.louvres} mat={pilasterMat} receive={false} />
        <BoxSet items={d.unitFans} mat={plinthMat} receive={false} />
        <BoxSet items={d.trusses} mat={wallMat} />
        <BoxSet items={d.ceilLamps} mat={K.white} receive={false} />
        {d.lights.slice(0, 4).map((l, i) => (
          <BoxSet key={i} items={l} mat={skylightMat} receive={false} />
        ))}
        <group ref={roofHatch} position={[lightsAt(4) + 0.9, WALL_H + 0.16, MIDZ]}>
          <BoxSet items={[[-0.9, 0, 0, 1.8, 0.1, PZ1 - PZ0 - 0.6]]} mat={skylightMat} receive={false} />
        </group>
      </group>
      {/* the floor's markings stay in the aisle, a floor with its lanes, arrows and bays and not a blank field */}
      <BoxSet items={d.joints} mat={lineFaint} receive={false} />
      <BoxSet items={d.marks} mat={line} receive={false} />
      <Slats items={d.slats} mat={line} />
      <group ref={inside}>
        <PalletSet s={d.pal} />
        <BoxSet items={d.empties} mat={palletBase} cast />
        <BoxSet items={d.chargers} mat={darkGrey} cast />
        <BoxSet items={d.lamps} mat={lineWhite} receive={false} />
        <BoxSet items={d.cabin} mat={wallMat} cast />
        <BoxSet items={d.cabinRoof} mat={roofMat} cast />
        <BoxSet items={d.cabinGlass} mat={K.vanGlass} receive={false} />
        <BoxSet items={d.cabinDoor} mat={doorMat} />
        <BoxSet items={d.cabinStep} mat={beamFlange} />
      </group>
    </group>
  );
}
// ---- the outside of the hall ------------------------------------------------------------------------------------------

// The walls are bare slabs inside, the outside is a skin of its own, so what the camera of N3 sees on the inside is as it was. Light grey
// sandwich cladding with a joint every 1.1 m, a pilaster at every 6 m bay and a corner post, a concrete plinth 1.2 m high round the foot on a
// foundation skirt down to the yard, and at every dock a darker frame round the opening, a black seal and two black bumpers, a dock light, the
// leveller lip and a canopy with its underside and an edge. Each face is a different step of tone, the roof lightest, then the cladding, then
// the pilasters, the plinth and the coping, so an edge reads against the ground without a line drawn on it.
const SKIN = 0.05;
const PL_H = 1.2;
const PL_OUT = 0.25;
const GY = -1.2;
const JOINTS = [1, 2, 3, 4, 5, 6, 7].map((i) => PL_H + (i * (WALL_H - PL_H)) / 8);
// the office block at the dock end of the long wall, two storeys on the ground of the yard, its east face in the plane of the dock wall
const OFF = { x0: 0.8, x1: PX1, z0: PZ1, z1: PZ1 + 7.2, roof: 5.8, slab: 2.3, door: 10.4 };

function Facade() {
  const f = useMemo(() => {
    const skin: BoxItem[] = [];
    const pil: BoxItem[] = [];
    const plinth: BoxItem[] = [];
    const joint: BoxItem[] = [];
    const pipes: BoxItem[] = [];
    const frames: BoxItem[] = [];
    const seals: BoxItem[] = [];
    const lamps: BoxItem[] = [];
    const lenses: BoxItem[] = [];
    const tops: BoxItem[] = [];
    const unders: BoxItem[] = [];
    const edges: BoxItem[] = [];
    const ym = (PL_H + WALL_H) / 2;
    const yh = WALL_H - PL_H;
    // a run of the skin along x on the front or far wall at z, facing sd, and along z on a face at x
    const alongX = (xa: number, xb: number, z: number, sd: 1 | -1) => {
      skin.push([(xa + xb) / 2, ym, z + (sd * SKIN) / 2, xb - xa, yh, SKIN]);
      JOINTS.forEach((y) => joint.push([(xa + xb) / 2, y, z + sd * (SKIN + 0.01), xb - xa, 0.045, 0.02]));
    };
    const alongZ = (za: number, zb: number, x: number, sd: 1 | -1) => {
      skin.push([x + (sd * SKIN) / 2, ym, (za + zb) / 2, SKIN, yh, zb - za]);
      JOINTS.forEach((y) => joint.push([x + sd * (SKIN + 0.01), y, (za + zb) / 2, 0.02, 0.045, zb - za]));
    };
    alongX(BACK_X, OFF.x0, PZ1, 1);
    alongX(BACK_X, PX1, PZ0, -1);
    alongZ(PZ0, PZ1, BACK_X, -1);
    // the dock wall, a pier between the doors and a lintel over each door
    const cuts = [PZ0, ...HALL.docks.flatMap((z) => [z - DOOR_W / 2, z + DOOR_W / 2]), PZ1];
    for (let i = 0; i < cuts.length; i += 2) alongZ(cuts[i], cuts[i + 1], PX1, 1);
    HALL.docks.forEach((z) => {
      const za = z - DOOR_W / 2;
      const zb = z + DOOR_W / 2;
      skin.push([PX1 + SKIN / 2, (DOOR_H + WALL_H) / 2, z, SKIN, WALL_H - DOOR_H, DOOR_W]);
      JOINTS.filter((y) => y > DOOR_H + 0.3).forEach((y) => joint.push([PX1 + SKIN + 0.01, y, z, 0.02, 0.045, zb - za]));
    });

    // a pilaster at every bay of 6 m, 0.55 wide and 0.2 proud, on the three long faces and on the piers between the doors, and a corner post
    // at each corner that is not the office's
    for (let x = PX1 - 1.4; x > BACK_X + 1; x -= 6) {
      pil.push([x, ym, PZ0 - SKIN - 0.1, 0.55, yh, 0.2]);
      if (x < OFF.x0 - 0.5) pil.push([x, ym, PZ1 + SKIN + 0.1, 0.55, yh, 0.2]);
    }
    for (let z = PZ0 + 3.3; z < PZ1 - 1; z += 6) pil.push([BACK_X - SKIN - 0.1, ym, z, 0.2, yh, 0.55]);
    [-7.7, 0, 7.7].forEach((z) => {
      pil.push([PX1 + SKIN + 0.1, ym, z, 0.2, yh, 0.55]);
      // a downpipe on each, down from the roof gutter to the plinth
      pipes.push([PX1 + SKIN + 0.28, ym - 0.15, z, 0.16, yh - 0.3, 0.16]);
    });
    pil.push([PX1 - 0.2, ym, PZ0 + 0.2, 0.8, yh, 0.8], [BACK_X + 0.2, ym, PZ0 + 0.2, 0.8, yh, 0.8], [BACK_X + 0.2, ym, PZ1 - 0.2, 0.8, yh, 0.8]);

    // the plinth, round the foot of the three outer faces and between the dock doors, and the skirt of the platform down to the yard
    plinth.push([(BACK_X - PL_OUT + OFF.x0) / 2, PL_H / 2, PZ1 + PL_OUT / 2, OFF.x0 - BACK_X + PL_OUT, PL_H, PL_OUT]);
    plinth.push([(BACK_X - PL_OUT + PX1 + PL_OUT) / 2, PL_H / 2, PZ0 - PL_OUT / 2, PX1 - BACK_X + 2 * PL_OUT, PL_H, PL_OUT]);
    plinth.push([BACK_X - PL_OUT / 2, PL_H / 2, MIDZ, PL_OUT, PL_H, PZ1 - PZ0]);
    for (let i = 0; i < cuts.length; i += 2) plinth.push([PX1 + PL_OUT / 2, PL_H / 2, (cuts[i] + cuts[i + 1]) / 2, PL_OUT, PL_H, cuts[i + 1] - cuts[i]]);
    const skirt: BoxItem[] = [
      [(PX0 + PX1) / 2, GY / 2, PZ0 - 0.03, PX1 - PX0 + 0.06, -GY, 0.06],
      [(PX0 + OFF.x0) / 2, GY / 2, PZ1 + 0.03, OFF.x0 - PX0, -GY, 0.06],
      [PX0 - 0.03, GY / 2, MIDZ, 0.06, -GY, PZ1 - PZ0],
      [PX1 + 0.03, GY / 2, MIDZ, 0.06, -GY, PZ1 - PZ0],
    ];

    HALL.docks.forEach((z) => {
      const hw = DOOR_W / 2;
      // the frame, a jamb each side and a head, of the dark grey 0.3 m wide and 0.12 proud, round the opening, the head only 0.12 m so the top of the
      // door stays under the facts row of N2
      frames.push([PX1 + 0.06, (DOOR_H + 0.12) / 2, z - hw - 0.15, 0.12, DOOR_H + 0.12, 0.3], [PX1 + 0.06, (DOOR_H + 0.12) / 2, z + hw + 0.15, 0.12, DOOR_H + 0.12, 0.3], [PX1 + 0.06, DOOR_H + 0.06, z, 0.12, 0.12, DOOR_W + 0.6]);
      // the dock seal, black rubber pads down both jambs and across the head, 0.3 deep so it stops short of the trailer at DOCK_OUT
      seals.push([PX1 + 0.15, 1.8, z - hw + 0.17, 0.3, 3.6, 0.34], [PX1 + 0.15, 1.8, z + hw - 0.17, 0.3, 3.6, 0.34], [PX1 + 0.15, DOOR_H - 0.17, z, 0.3, 0.34, DOOR_W]);
      // two black bumpers under the sill, where the trailer's bed meets the platform
      for (const sd of [-1.35, 1.35]) seals.push([PX1 + 0.18, -0.35, z + sd, 0.36, 0.5, 0.36]);
      // the leveller's lip, a plate of the dark grey that lies out over the sill, short of the trailer
      frames.push([PX1 - 0.1, 0.03, z, 0.6, 0.05, 2.3]);
      // the dock light on its arm beside the door, a graphite housing with a white lens
      lamps.push([PX1 + 0.13, 3.3, z + 2.45, 0.24, 0.3, 0.3]);
      lenses.push([PX1 + 0.27, 3.3, z + 2.45, 0.04, 0.14, 0.14]);
      // the canopy, a slab 2.6 m deep with its underside a step darker and a deep fascia on the edge, the slabs stop at the back of the fascia so no
      // two faces share a plane
      tops.push([PX1 + 1.25, 5.07, z, 2.5, 0.12, 5.4]);
      unders.push([PX1 + 1.25, 4.97, z, 2.5, 0.1, 5.4]);
      edges.push([PX1 + 2.55, 4.85, z, 0.1, 0.5, 5.4], [PX1 + 2.58, 4.58, z, 0.14, 0.06, 5.44]);
    });
    return { skin, pil, plinth, skirt, joint, pipes, frames, seals, lamps, lenses, tops, unders, edges };
  }, []);
  return (
    <group>
      <BoxSet items={f.skin} mat={claddingMat} receive={false} />
      <BoxSet items={f.joint} mat={jointLine} receive={false} />
      <BoxSet items={f.pil} mat={pilasterMat} receive={false} />
      <BoxSet items={f.plinth} mat={plinthMat} receive={false} />
      <BoxSet items={f.skirt} mat={plinthMat} receive={false} />
      <BoxSet items={f.pipes} mat={copingMat} receive={false} />
      <BoxSet items={f.frames} mat={frameMat} receive={false} />
      <BoxSet items={f.seals} mat={black} receive={false} />
      <BoxSet items={f.lamps} mat={darkGrey} receive={false} />
      <BoxSet items={f.lenses} mat={lineWhite} receive={false} />
      <BoxSet items={f.tops} mat={roofMat} receive={false} />
      <BoxSet items={f.unders} mat={underMat} receive={false} />
      <BoxSet items={f.edges} mat={pilasterMat} receive={false} />
    </group>
  );
}

// The office block, two storeys of 3.5 m with a band of glazing on each, mullions every 1.5 m, a slab band between them, a parapet with the
// coping, the main entrance with its canopy on the front face and a plant unit on the roof. The glass is the graphite, the frames the dark
// grey, so the bands read as glazing against the pale cladding from the high view.
function Office() {
  const o = useMemo(() => {
    const { x0, x1, z0, z1, roof, slab: sl, door } = OFF;
    const xc = (x0 + x1) / 2;
    const zc = (z0 + z1) / 2;
    const body: BoxItem[] = [[xc, (GY + roof) / 2, zc, x1 - x0, roof - GY, z1 - z0]];
    const joint: BoxItem[] = [];
    for (const y of [0.4, 1.4, 3.4, 4.4]) joint.push([xc, y, z1 + 0.01, x1 - x0, 0.04, 0.02], [x1 + 0.01, y, zc, 0.02, 0.04, z1 - z0]);
    const plinth: BoxItem[] = [[xc, GY + 0.45, z1 + 0.07, x1 - x0 + 0.14, 0.9, 0.14], [x1 + 0.07, GY + 0.45, zc, 0.14, 0.9, z1 - z0 + 0.14]];
    const band: BoxItem[] = [[xc, sl, z1 + 0.06, x1 - x0 + 0.12, 0.4, 0.12], [x1 + 0.06, sl, zc, 0.12, 0.4, z1 - z0 + 0.12]];
    const glass: BoxItem[] = [];
    const frame: BoxItem[] = [];
    // a band of glazing between a sill and a head, in runs along the front and along the east face, the front broken by the entrance
    const bandOf = (y0: number, y1: number, gap = false) => {
      const yc = (y0 + y1) / 2;
      const h = y1 - y0;
      const front = gap ? [[x0 + 0.6, door - 1.9], [door + 1.9, x1 - 0.6]] : [[x0 + 0.6, x1 - 0.6]];
      front.forEach(([a, b]) => {
        glass.push([(a + b) / 2, yc, z1 + 0.03, b - a, h, 0.06]);
        frame.push([(a + b) / 2, y0, z1 + 0.05, b - a + 0.1, 0.1, 0.1], [(a + b) / 2, y1, z1 + 0.05, b - a + 0.1, 0.1, 0.1]);
        for (let x = a; x <= b + 0.01; x += (b - a) / Math.max(1, Math.round((b - a) / 1.5))) frame.push([x, yc, z1 + 0.05, 0.1, h, 0.1]);
      });
      const a = z0 + 0.7;
      const b = z1 - 0.7;
      glass.push([x1 + 0.03, yc, (a + b) / 2, 0.06, h, b - a]);
      frame.push([x1 + 0.05, y0, (a + b) / 2, 0.1, 0.1, b - a + 0.1], [x1 + 0.05, y1, (a + b) / 2, 0.1, 0.1, b - a + 0.1]);
      for (let z = a; z <= b + 0.01; z += (b - a) / Math.max(1, Math.round((b - a) / 1.5))) frame.push([x1 + 0.05, yc, z, 0.1, h, 0.1]);
    };
    bandOf(-0.2, 1.9, true);
    bandOf(2.9, 4.9);
    // the entrance, a glazed double door with its fanlight in a dark frame, a canopy over it on two posts with an underside and an edge
    glass.push([door, 0.35, z1 + 0.03, 2.8, 3.1, 0.06]);
    frame.push([door - 1.4, 0.35, z1 + 0.06, 0.14, 3.2, 0.12], [door + 1.4, 0.35, z1 + 0.06, 0.14, 3.2, 0.12], [door, 0.35, z1 + 0.06, 0.08, 3.1, 0.12], [door, 1.95, z1 + 0.06, 2.9, 0.14, 0.12], [door, 0.0, z1 + 0.06, 2.8, 0.08, 0.12]);
    const top: BoxItem[] = [[door, 2.2, z1 + 1.2, 4.4, 0.16, 2.4], [xc, roof + 0.1, zc, x1 - x0 + 0.1, 0.2, z1 - z0 + 0.1]];
    const under: BoxItem[] = [[door, 2.08, z1 + 1.2, 4.4, 0.1, 2.4]];
    const edge: BoxItem[] = [[door, 1.95, z1 + 2.42, 4.5, 0.3, 0.1]];
    const posts: BoxItem[] = [[door - 2.0, 0.5, z1 + 2.3, 0.14, 3.4, 0.14], [door + 2.0, 0.5, z1 + 2.3, 0.14, 3.4, 0.14]];
    const para: BoxItem[] = [[xc, roof + 0.4, z1 - 0.1, x1 - x0, 0.6, 0.2], [x1 - 0.1, roof + 0.4, zc, 0.2, 0.6, z1 - z0], [x0 + 0.1, roof + 0.4, zc, 0.2, 0.6, z1 - z0]];
    const coping: BoxItem[] = [[xc, roof + 0.75, z1 - 0.1, x1 - x0 + 0.08, 0.14, 0.4], [x1 - 0.1, roof + 0.75, zc, 0.4, 0.14, z1 - z0 + 0.08], [x0 + 0.1, roof + 0.75, zc, 0.4, 0.14, z1 - z0 + 0.08]];
    const unit: BoxItem[] = [[4.2, roof + 0.2 + 0.65, 19.4, 3.0, 1.3, 2.0]];
    const unitTop: BoxItem[] = [[4.2, roof + 0.2 + 1.33, 19.4, 1.8, 0.06, 1.2]];
    return { body, joint, plinth, band, glass, frame, top, under, edge, posts, para, coping, unit, unitTop };
  }, []);
  return (
    <group>
      <BoxSet items={o.body} mat={claddingMat} receive={false} />
      <BoxSet items={o.joint} mat={jointLine} receive={false} />
      <BoxSet items={o.plinth} mat={plinthMat} receive={false} />
      <BoxSet items={o.band} mat={pilasterMat} receive={false} />
      <BoxSet items={o.glass} mat={officeGlass} receive={false} />
      <BoxSet items={o.frame} mat={frameMat} receive={false} />
      <BoxSet items={o.top} mat={roofMat} receive={false} />
      <BoxSet items={o.under} mat={underMat} receive={false} />
      <BoxSet items={o.edge} mat={copingMat} receive={false} />
      <BoxSet items={o.posts} mat={frameMat} receive={false} />
      <BoxSet items={o.para} mat={claddingMat} receive={false} />
      <BoxSet items={o.coping} mat={copingMat} receive={false} />
      <BoxSet items={o.unit} mat={wallMat} receive={false} />
      <BoxSet items={o.unitTop} mat={darkGrey} receive={false} />
    </group>
  );
}

// the long roof lights along z, 1.8 m wide, the last one over the dock end of the hall opens in the third flight for the camera to leave through
const LIGHTS_X = [-24, -15, -6, 3, 12];
const lightsAt = (i: number) => LIGHTS_X[i];
// the x where the aisles open on the staging floor
const X_MOUTH = HALL.rackX0 + 0.4;

// ---- the yard and the forecourt ---------------------------------------------------------------------------------------

// Hall metres in x and z, y 0 is the ground, so the yard sits 1.2 m under the hall's floor. The paved site runs 98 m behind the back wall, far
// enough that the haze takes it and no edge or hedge shows at the horizon of N3, to 47 m out from the docks and 27 m behind the far wall to
// 36 m in front of the near one. The yard road runs along z at x 34, 7 m wide,
// through a gap in the hedge at each end and on to the edge of any frame, with a kerb on both sides outside the hedge.
export const YARD = { x0: -400, x1: 47, z0: -27, z1: 36, road: 34, roadW: 8 };
// the gate through the fence, a lorry that turns out of the yard swings its cab 1.1 m wide of its lane, so the barriers stand 7 m from the road's middle
const GATE = 7;
const WORLD = 420;

export function Yard() {
  const y = useMemo(() => {
    // the paving runs on to 420 m each way, so the haze takes it and no slab edge ever shows, and so does the road
    const paving: BoxItem[] = [[0, 0.02, 0, WORLD * 2, 0.04, WORLD * 2]];
    const roadLong = WORLD * 2;
    const road: BoxItem[] = [[YARD.road, 0.04, 0, YARD.roadW, 0.04, roadLong]];
    const marks: BoxItem[] = [];
    const white: BoxItem[] = [];
    const hl = (x0: number, x1: number, z: number, t = 0.12) => marks.push([(x0 + x1) / 2, 0.066, z, x1 - x0, 0.01, t]);
    const vl = (x: number, z0: number, z1: number, t = 0.12) => marks.push([x, 0.066, (z0 + z1) / 2, t, 0.01, z1 - z0]);
    // the lorry bay at every dock, 3.6 m wide and 14.5 m long from the bumpers, with a wheel line across the end of it
    HALL.docks.forEach((z) => {
      hl(DOCK_OUT, DOCK_OUT + 14.5, z - 1.8);
      hl(DOCK_OUT, DOCK_OUT + 14.5, z + 1.8);
      vl(DOCK_OUT + 14.5, z - 1.8, z + 1.8);
      for (let g = 0; g < 4; g++) white.push([DOCK_OUT + 2.5 + g * 3.4, 0.07, z, 0.1, 0.01, 3.4]);
    });
    // the road's edge lines and a dashed middle, white
    for (const s of [-1, 1]) white.push([YARD.road + s * (YARD.roadW / 2 - 0.3), 0.075, 0, 0.14, 0.01, roadLong]);
    for (let z = -WORLD; z < WORLD; z += 6) white.push([YARD.road, 0.075, z + 1.5, 0.14, 0.01, 3]);
    // the apron's lanes between the bays and the road, a hatched strip along the platform's foot so no bay opens on bare paving
    const slats: SlatItem[] = [];
    slats.push(...hatch(PX1 + 0.1, PX1 + 0.6, YARD.z0 + 0.3, YARD.z1 - 0.3, 0.8, 0.066));

    // the car park on the forecourt in front of the hall, bays 2.6 m wide, 5 m deep, marked and empty, with a footpath along the wall
    const bays: BoxItem[] = [];
    // it runs from the dock end only 28 m along the wall, since from the high view of the last beat a longer strip lay behind the lede
    // the office block stands on the dock end of it, from x 0.8, so the bays stop short of the block
    for (let x = -14; x <= 0.01; x += 2.6) bays.push([x, 0.066, 20.6, 0.1, 0.01, 5]);
    bays.push([-6.9, 0.066, 18.1, 14.2, 0.01, 0.1], [-6.9, 0.066, 23.1, 14.2, 0.01, 0.1]);
    // a footpath along the front wall, edge lines and a dashed middle
    bays.push([-16.3, 0.066, 17.0, 31.4, 0.01, 0.1]);
    // the fence round the yard, posts 4 m apart with two rails, along the east side and 40 m either side of each gate on the north and south sides
    const fence: BoxItem[] = [];
    const run = (x0: number, x1: number, z0: number, z1: number) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 4));
      for (let i = 0; i <= n; i++) fence.push([x0 + ((x1 - x0) * i) / n, 1.0, z0 + ((z1 - z0) * i) / n, 0.1, 2.0, 0.1]);
      for (const h of [0.55, 1.75]) fence.push([(x0 + x1) / 2, h, (z0 + z1) / 2, Math.max(x1 - x0, 0.05), 0.05, Math.max(z1 - z0, 0.05)]);
    };
    run(YARD.x1 + 0.2, YARD.x1 + 0.2, YARD.z0, YARD.z1);
    for (const zz of [YARD.z0 - 0.05, YARD.z1 + 0.05]) {
      run(YARD.road - 44, YARD.road - GATE - 0.3, zz, zz);
      run(YARD.road + GATE + 0.3, YARD.x1 + 0.2, zz, zz);
    }
    // low buildings of the neighbours in the haze round the site, plain boxes of 6 to 14 m in the pale grey
    const near: BoxItem[] = [];
    const nr = rng(61);
    const lot = (xa: number, xb: number, za: number, zb: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const w = 18 + nr() * 30;
        const dd = 14 + nr() * 22;
        const h = 6 + nr() * 8;
        near.push([xa + nr() * (xb - xa), h / 2, za + nr() * (zb - za), w, h, dd]);
      }
    };
    lot(-300, 300, -170, -70, 14);
    lot(-300, 300, 80, 180, 14);
    lot(75, 190, -70, 80, 8);
    lot(-300, -75, -70, 80, 10);
    return { paving, road, marks, white, slats, bays, fence, near };
  }, []);

  // trees in a line behind the hedge, 7 m apart, none across the road's gap and none along the forecourt, which is the left of the frame
  // in N3 and N4 where the words lie
  const trees = useMemo(() => {
    const out: TreeSpec[] = [];
    const gap = (v: number) => Math.abs(v - YARD.road) < 6;
    for (let x = YARD.x0 + 3; x < YARD.x1 + 4; x += 7) {
      // the north line stops short of the road's west side, the N2 camera looks over it into the words
      if (x > YARD.road && !gap(x)) out.push({ x, z: YARD.z0 - 3.2, h: 4.4 + ((x * 7) % 5) * 0.28, v: out.length });
    }
    for (let z = YARD.z0 + 3; z < YARD.z1; z += 7) out.push({ x: YARD.x1 + 3.2, z, h: 4.2 + ((z * 5) % 4) * 0.3, v: out.length });
    return out;
  }, []);

  const HG = GATE + 0.7;
  return (
    <group>
      <BoxSet items={y.paving} mat={apron} />
      <BoxSet items={y.road} mat={roadMat} />
      <BoxSet items={y.marks} mat={line} receive={false} />
      <BoxSet items={y.white} mat={lineWhite} receive={false} />
      <BoxSet items={y.bays} mat={line} receive={false} />
      <Slats items={y.slats} mat={line} />
      {/* the hedge closes the yard off, along the forecourt's front, the yard's far end and its two sides, with a gap for the road */}
      <Hedge x={YARD.x0} z={YARD.z1 + 0.6} len={YARD.road - HG - YARD.x0} />
      <Hedge x={YARD.road + HG} z={YARD.z1 + 0.6} len={YARD.x1 - YARD.road - HG} />
      <Hedge x={YARD.x0} z={YARD.z0 - 0.6} len={YARD.road - HG - YARD.x0} />
      <Hedge x={YARD.road + HG} z={YARD.z0 - 0.6} len={YARD.x1 - YARD.road - HG} />
      <group position={[YARD.x1 + 0.6, 0, YARD.z1]} rotation={[0, Math.PI / 2, 0]}>
        <Hedge x={0} z={0} len={YARD.z1 - YARD.z0} />
      </group>
      <Trees items={trees} pit={false} />
      {/* the kerb of the road beyond the hedge, a stone run on each side, north and south */}
      <group position={[YARD.road, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Kerb x0={-WORLD} x1={-YARD.z1 - 1} z={-YARD.roadW / 2} />
        <Kerb x0={-WORLD} x1={-YARD.z1 - 1} z={YARD.roadW / 2} />
        <Kerb x0={-YARD.z0 + 1} x1={WORLD} z={-YARD.roadW / 2} />
        <Kerb x0={-YARD.z0 + 1} x1={WORLD} z={YARD.roadW / 2} />
      </group>
      <BoxSet items={y.fence} mat={rackGrey} />
      <BoxSet items={y.near} mat={wallMat} />
      {/* the gate on the south side of the yard, a gate house east of the road with its window to the road, two barriers with their arms
          raised and the hatching before them, and a second pair of barriers on the north side. The lamp posts stand along the road
          inside the yard and along its east side */}
      <group position={[YARD.road + GATE + 3.2, 0, YARD.z1 - 3.4]} rotation={[0, Math.PI / 2, 0]}>
        <GateHouse x={0} z={0} />
      </group>
      <Barrier x={YARD.road - GATE} z={YARD.z1 - 2.2} />
      <Barrier x={YARD.road + GATE} z={YARD.z1 - 2.2} />
      <Barrier x={YARD.road - GATE} z={YARD.z0 + 2.2} />
      <Barrier x={YARD.road + GATE} z={YARD.z0 + 2.2} />
      {[-20, 6, 22].map((z) => (
        <LampPost key={z} x={YARD.road + GATE + 1.3} z={z} rot={Math.PI} />
      ))}
      {[-18, 4, 26].map((z) => (
        <LampPost key={`e${z}`} x={YARD.x1 - 3} z={z} rot={Math.PI} />
      ))}
      {/* cars of the staff and a van of the service on the east side of the yard and by the gate house */}
      <Van x={YARD.x1 - 3.5} z={-8} yaw={Math.PI / 2} />
      <Van x={YARD.x1 - 3.5} z={-3.2} yaw={Math.PI / 2} />
      <Van x={YARD.x1 - 3.5} z={12} yaw={Math.PI / 2} />
      <Van x={YARD.road + 9.5} z={YARD.z1 - 8} yaw={Math.PI} />
    </group>
  );
}

export { PX0, PX1, PZ0, PZ1 };
