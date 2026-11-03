// Stand-ins for rows of Linde counterbalance trucks seen from above, from the flip or from far away, round 8. A truck is built as the real
// one is, a counterweight with its curved back and a hood over the engine in the red, the seat on the hood and the steering wheel on its
// column ahead of it, the overhead guard on four posts with its rails and eight bars, the mast with two channels each side and the chains
// between them, the fork carriage with its backrest and two forks, and four tyres on their hubs. Red is on the counterweight and the hood
// only, as on the real truck, the rest is graphite, black and the greys. Every part of one material is merged into one geometry of the
// truck, and that geometry is drawn instanced for every truck of the rows, so forty trucks cost six draws. Forks point along +x before the yaw.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { G, lam, lit } from './kit';

type Mat = 'red' | 'graphite' | 'black' | 'steel' | 'tyre' | 'fork';

// A part is made indexless and without uvs so every part of every kind merges into one geometry.
const flat = (g: THREE.BufferGeometry) => {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute('uv');
  return out;
};

// A box from its two corners in x, y and z.
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  flat(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));

// A cylinder lying across the truck on the z axis, for a tyre and its hub, with its centre at x and y.
const wheel = (x: number, y: number, z: number, r: number, w: number, seg = 16) => flat(new THREE.CylinderGeometry(r, r, w, seg).rotateX(Math.PI / 2).translate(x, y, z));

// A slab of a footprint with its rear corners rounded, a bevel on its edges so the top curves down into the sides, from y0 to y1. The shape is
// drawn in x and z and stood up, rear at x0, front at x1, half width hw and the corner radius rr behind and rf in front.
function slab(x0: number, x1: number, hw: number, y0: number, y1: number, rr: number, rf: number, bevel = 0.05) {
  const s = new THREE.Shape();
  s.moveTo(x1 - rf, -hw);
  s.lineTo(x0 + rr, -hw);
  s.quadraticCurveTo(x0, -hw, x0, -hw + rr);
  s.lineTo(x0, hw - rr);
  s.quadraticCurveTo(x0, hw, x0 + rr, hw);
  s.lineTo(x1 - rf, hw);
  s.quadraticCurveTo(x1, hw, x1, hw - rf);
  s.lineTo(x1, -hw + rf);
  s.quadraticCurveTo(x1, -hw, x1 - rf, -hw);
  const h = y1 - y0 - bevel * 2;
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 5 });
  // extruded along z and drawn in x and y, stand it so the shape lies on the floor and the depth runs up
  g.rotateX(-Math.PI / 2).translate(0, y0 + bevel, 0);
  return flat(g);
}

// The truck's parts by material, in metres with the truck's middle at the origin, rear at -2.19, forks to 2.19, 1.36 wide at the counterweight.
function truckParts(): Record<Mat, THREE.BufferGeometry[]> {
  const red: THREE.BufferGeometry[] = [
    // the counterweight, the curved back
    slab(-2.19, -1.07, 0.68, 0.3, 1.12, 0.5, 0.06),
    // the hood over the engine, narrower and lower
    slab(-1.07, 0.1, 0.55, 0.5, 1.0, 0.06, 0.1, 0.04),
  ];
  const graphite: THREE.BufferGeometry[] = [
    // the frame under the cab and its floor plate, the dash that carries the column
    box(-1.65, 0.85, 0.28, 0.7, -0.5, 0.5),
    box(0.1, 0.85, 0.7, 0.76, -0.5, 0.5),
    box(0.28, 0.58, 0.76, 1.2, -0.22, 0.22),
    // the outer channel of each side of the mast, a web with two flanges, from the frame to the head
    ...[-1, 1].flatMap((s) => [
      box(0.7, 0.8, 0.2, 2.2, s * 0.46 - 0.07, s * 0.46 + 0.07),
      box(0.62, 0.7, 0.2, 2.2, s * 0.46 - 0.07, s * 0.46 - 0.04),
      box(0.62, 0.7, 0.2, 2.2, s * 0.46 + 0.04, s * 0.46 + 0.07),
      // the tilt cylinder from the frame up to the mast
      box(0.4, 0.5, 0.7, 1.5, s * 0.34 - 0.04, s * 0.34 + 0.04),
    ]),
    // the cross beam low on the mast and the carriage with its bars and its backrest of five uprights
    box(0.62, 0.9, 0.28, 0.4, -0.5, 0.5),
    box(1.04, 1.2, 0.22, 0.34, -0.64, 0.64),
    box(1.04, 1.2, 0.7, 0.8, -0.64, 0.64),
    ...[-0.52, -0.26, 0, 0.26, 0.52].map((z) => box(1.14, 1.2, 0.34, 1.2, z - 0.035, z + 0.035)),
  ];
  const black: THREE.BufferGeometry[] = [
    // the overhead guard, four posts, the frame round the top and a cross bar at each end
    ...[-1, 1].flatMap((s) => [box(-1.13, -1.05, 1.0, 2.06, s * 0.55 - 0.04, s * 0.55 + 0.04), box(0.56, 0.64, 1.0, 2.06, s * 0.55 - 0.04, s * 0.55 + 0.04)]),
    ...[-1, 1].map((s) => box(-1.15, 0.66, 2.02, 2.1, s * 0.55 - 0.045, s * 0.55 + 0.045)),
    box(-1.15, -1.07, 2.02, 2.1, -0.6, 0.6),
    box(0.58, 0.66, 2.02, 2.1, -0.6, 0.6),
    // nine bars from the front to the back of the guard and two across them
    ...Array.from({ length: 9 }, (_, i) => box(-1.1, 0.62, 2.04, 2.08, -0.46 + i * 0.115 - 0.015, -0.46 + i * 0.115 + 0.015)),
    box(-0.5, -0.46, 2.04, 2.08, -0.55, 0.55),
    box(0.1, 0.14, 2.04, 2.08, -0.55, 0.55),
    // the seat on the hood with its back and an arm rest each side
    box(-0.7, 0.05, 1.0, 1.1, -0.26, 0.26),
    flat(new THREE.BoxGeometry(0.08, 0.5, 0.5).rotateZ(0.14).translate(-0.74, 1.35, 0)),
    ...[-1, 1].map((s) => box(-0.5, -0.05, 1.1, 1.16, s * 0.3 - 0.03, s * 0.3 + 0.03)),
    // the steering column and its wheel, a ring tilted back towards the driver
    flat(new THREE.BoxGeometry(0.05, 0.4, 0.05).rotateZ(-0.35).translate(0.45, 1.35, 0)),
    flat(new THREE.TorusGeometry(0.17, 0.022, 4, 14).rotateX(Math.PI / 2).rotateZ(0.5).translate(0.4, 1.56, 0)),
    // the head of the mast across the two channels
    box(0.62, 0.9, 2.16, 2.26, -0.5, 0.5),
  ];
  const steel: THREE.BufferGeometry[] = [
    // the inner channel of each side, lifted, and a chain on each of the two lifting sides between them, with the hubs of the tyres
    ...[-1, 1].flatMap((s) => [
      box(0.82, 0.9, 0.3, 2.0, s * 0.46 - 0.05, s * 0.46 + 0.05),
      box(0.76, 0.82, 0.3, 2.0, s * 0.46 - 0.05, s * 0.46 - 0.03),
      box(0.76, 0.82, 0.3, 2.0, s * 0.46 + 0.03, s * 0.46 + 0.05),
      box(0.9, 0.94, 0.4, 2.1, s * 0.2 - 0.025, s * 0.2 + 0.025),
      wheel(0.45, 0.415, s * 0.64, 0.2, 0.27, 10),
      wheel(-1.67, 0.38, s * 0.62, 0.18, 0.26, 10),
    ]),
  ];
  const tyre: THREE.BufferGeometry[] = [
    // the drive tyres under the mast and the steer tyres under the counterweight
    ...[-1, 1].flatMap((s) => [wheel(0.45, 0.415, s * 0.64, 0.415, 0.24), wheel(-1.67, 0.38, s * 0.62, 0.38, 0.24)]),
  ];
  const fork: THREE.BufferGeometry[] = [
    // the two forks, the blade and the shank that stands up the carriage
    ...[-1, 1].flatMap((s) => [box(1.2, 2.19, 0.03, 0.1, s * 0.3 - 0.08, s * 0.3 + 0.08), box(1.2, 1.3, 0.03, 1.1, s * 0.3 - 0.08, s * 0.3 + 0.08)]),
  ];
  return { red, graphite, black, steel, tyre, fork };
}

let built: { mats: Record<Mat, THREE.Material>; geos: Record<Mat, THREE.BufferGeometry> } | undefined;
const getBuilt = () => {
  if (built) return built;
  const parts = truckParts();
  const geos = {} as Record<Mat, THREE.BufferGeometry>;
  (Object.keys(parts) as Mat[]).forEach((k) => (geos[k] = mergeGeometries(parts[k], false)));
  const mats: Record<Mat, THREE.Material> = {
    red: lam('#a00020'),
    graphite: lam(G.graphite),
    black: lam('#222222'),
    steel: lam(G.mid),
    tyre: lam('#111111'),
    fork: lam(G.dark),
  };
  return (built = { mats, geos });
};

export type TruckSpec = { x: number; z: number; yaw: number; s?: number };

export function ProxyTrucks({ items, cast = true }: { items: TruckSpec[]; cast?: boolean }) {
  const refs = useRef<Record<string, THREE.InstancedMesh | null>>({});
  const { mats, geos } = useMemo(getBuilt, []);
  const names = Object.keys(geos) as Mat[];
  useLayoutEffect(() => {
    const T = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    names.forEach((name) => {
      const mesh = refs.current[name]!;
      items.forEach((t, i) => {
        e.set(0, t.yaw, 0);
        const s = t.s ?? 1;
        mesh.setMatrixAt(i, T.compose(new THREE.Vector3(t.x, 0, t.z), q.setFromEuler(e), new THREE.Vector3(s, s, s)));
      });
      mesh.count = items.length;
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [items, names]);
  return (
    <group>
      {names.map((name) => (
        <instancedMesh
          key={name + items.length}
          ref={(r) => {
            refs.current[name] = r;
          }}
          args={[geos[name], mats[name], items.length]}
          castShadow={cast}
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

export { lit };
