// A lorry with a plain white box trailer and no brand on it, built from boxes baked into a few geometries so three of them cost a dozen
// draws. Two bodies, the way an articulated lorry is, a trailer with its rear at the origin and a tractor with its fifth wheel at the
// origin, both facing +x. The trailer is hollow with its bed at 1.2 m, the height of the hall's platform, its rear doors hinged on two
// groups that fold back against the sides and swing shut, and its own pallets inside, so a forklift drives in from the dock. The tractor is a cab
// over in light grey. The plan that places them and works out the angle between them is najamdock.ts.
import { useMemo, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BRAND, K, brandPaths, brandView } from './kit';
import { beamFlange, beamWeb, black, cabGrey, mergeBoxes, rackGrey, trailerRoof, trailerWhite, tyre } from './najamkit';
import type { BoxItem } from './props';

export const BED = 1.2;
// the trailer's length and the places along it, the tractor's fifth wheel and the trailer's axles, the pivot of the pair
export const TRAILER_L = 9.8;
export const AXLE_X = 3.7;
export const PIVOT_X = 8.5;

export type LorryApi = { trailer: THREE.Group; tractor: THREE.Group; doorA: THREE.Group; doorB: THREE.Group; curtain: THREE.Group };

const wheelSet = (xs: number[], zs: number[], r: number, w: number) => {
  const tyres: THREE.BufferGeometry[] = [];
  const hubs: THREE.BufferGeometry[] = [];
  const caps: THREE.BufferGeometry[] = [];
  for (const x of xs)
    for (const z of zs) {
      const out = Math.sign(z) * (w / 2);
      // a round tyre of 24 sides, the rim a pale disc proud of its face and a dark cap on the rim, so the wheel reads as a tyre round a rim
      const t = new THREE.CylinderGeometry(r, r, w, 24);
      t.rotateX(Math.PI / 2);
      t.translate(x, r, z);
      tyres.push(t);
      const h = new THREE.CylinderGeometry(r * 0.66, r * 0.66, 0.04, 20);
      h.rotateX(Math.PI / 2);
      h.translate(x, r, z + out + Math.sign(z) * 0.01);
      hubs.push(h);
      const c = new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.07, 14);
      c.rotateX(Math.PI / 2);
      c.translate(x, r, z + out + Math.sign(z) * 0.03);
      caps.push(c);
    }
  return { tyres, hubs, caps };
};
const cat = (g: THREE.BufferGeometry[]) => mergeGeometries(g, false);

// The EKOTEHNIKA wordmark of public/brand/ekotehnika.svg as supplied, its grey letters and its red mark, every path of the file filled in its own colour
// into a canvas, on a clear ground so it prints on the white of the trailer. 5.5 m wide on the side of every trailer.
export const LOGO_W = 5.5;
let logoMat: THREE.MeshBasicMaterial | undefined;
let logoGeo: THREE.PlaneGeometry | undefined;
function logo() {
  if (logoMat && logoGeo) return { mat: logoMat, geo: logoGeo };
  const view = brandView(BRAND.wordmark);
  const W = 2048;
  const H = Math.round((W * view[3]) / view[2]);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.scale(W / view[2], H / view[3]);
  g.translate(-view[0], -view[1]);
  for (const p of brandPaths(BRAND.wordmark)) {
    g.fillStyle = p.fill;
    g.fill(new Path2D(p.d));
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  logoMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  logoGeo = new THREE.PlaneGeometry(LOGO_W, (LOGO_W * view[3]) / view[2]);
  return { mat: logoMat, geo: logoGeo };
}

let built: ReturnType<typeof build> | undefined;
function build() {
  // the trailer, a hollow box with the rear open, ribs on the sides, the chassis under the bed and the rear frame
  const white: BoxItem[] = [
    [9.77, 2.575, 0, 0.06, 2.75, 2.5],
  ];
  const grey: BoxItem[] = [
    [4.9, BED - 0.06, 0, 9.8, 0.12, 2.6],
    [4.9, 0.95, 0, 9.6, 0.2, 1.2],

    // the mudguards over the three axles, one each side, and the side skirt between the bed and the wheels
    [3.7, 1.09, -1.13, 3.5, 0.08, 0.64],
    [3.7, 1.09, 1.13, 3.5, 0.08, 0.64],
  ];
  // a side, a plain panel with its ribs outside it, in a frame with its front end at the origin and the rear at x minus 9.8, z out of the trailer. The
  // near side of the first lorry draws back like the curtain of a curtain sider, the far side stands
  const sideRibs: BoxItem[] = [];
  for (let x = 0.9; x < 9.6; x += 1.35) sideRibs.push([x - 9.8, 2.6, 0.04, 0.06, 2.65, 0.03]);
  const dark: BoxItem[] = [
    [0.35, 0.55, 0, 0.12, 0.14, 2.3],
    [0.35, 0.8, -1.05, 0.1, 0.5, 0.1],
    [0.35, 0.8, 1.05, 0.1, 0.5, 0.1],
    [6.6, 0.6, -1.0, 0.14, 1.2, 0.14],
    [6.6, 0.6, 1.0, 0.14, 1.2, 0.14],
    [5.9, 0.55, -1.12, 0.05, 0.6, 0.55],
    [5.9, 0.55, 1.12, 0.05, 0.6, 0.55],
  ];
  const lights: BoxItem[] = [
    [0.04, 1.4, -1.0, 0.04, 0.1, 0.22],
    [0.04, 1.4, 1.0, 0.04, 0.1, 0.22],
    [3, 1.35, -1.33, 0.2, 0.06, 0.04],
    [3, 1.35, 1.33, 0.2, 0.06, 0.04],
    [7.5, 1.35, -1.33, 0.2, 0.06, 0.04],
    [7.5, 1.35, 1.33, 0.2, 0.06, 0.04],
  ];
  const tw = wheelSet([2.4, 3.7, 5.0], [-1.12, 1.12], 0.5, 0.36);

  // the tractor in a frame with the fifth wheel at the origin, x - 12.3 from the frame the first Najam lorry was drawn in
  const T = (x: number) => x - 12.3;
  const tGrey: BoxItem[] = [[T(13.7), 0.95, 0, 6.2, 0.3, 1.0], [T(12.3), 1.3, 0, 1.4, 0.12, 1.5], [T(17.0), 0.55, 0, 0.3, 0.4, 2.3], [T(11.65), 1.09, -1.0, 2.5, 0.08, 0.62], [T(11.65), 1.09, 1.0, 2.5, 0.08, 0.62], [T(16.0), 1.09, -1.05, 1.4, 0.08, 0.62], [T(16.0), 1.09, 1.05, 1.4, 0.08, 0.62]];
  const tCab: BoxItem[] = [[T(15.5), 2.6, 0, 2.8, 2.8, 2.5], [T(16.0), 4.15, 0, 1.9, 0.5, 2.3]];
  const tGlass: BoxItem[] = [[T(16.92), 2.95, 0, 0.04, 1.1, 2.2], [T(15.6), 3.0, -1.26, 1.6, 0.9, 0.03], [T(15.6), 3.0, 1.26, 1.6, 0.9, 0.03]];
  const tGrille: BoxItem[] = [[T(16.94), 1.7, -0.85, 0.05, 0.22, 0.4], [T(16.94), 1.7, 0.85, 0.05, 0.22, 0.4], [T(16.94), 1.7, 0, 0.05, 0.5, 0.9]];
  const tWeb: BoxItem[] = [[T(15.0), 1.1, -1.25, 1.2, 0.12, 0.3], [T(15.0), 1.1, 1.25, 1.2, 0.12, 0.3], [T(12.9), 0.85, -1.2, 1.5, 0.7, 0.4], [T(12.9), 0.85, 1.2, 1.5, 0.7, 0.4]];
  const tBlack: BoxItem[] = [[T(14.1), 3.2, -1.3, 0.12, 0.3, 0.12], [T(14.1), 3.2, 1.3, 0.12, 0.3, 0.12], [T(14.2), 4.2, 1.18, 0.1, 1.5, 0.1]];
  const rear = wheelSet([T(11.0), T(12.3)], [-1.0, 1.0], 0.5, 0.36);
  const front = wheelSet([T(16.0)], [-1.05, 1.05], 0.5, 0.36);

  return {
    white: mergeBoxes(white),
    // the roof and the frame of the rear are lit to white all round, they are what a camera inside the trailer looks up at
    roof: mergeBoxes([[4.9, 3.98, 0, 9.9, 0.08, 2.64], [4.9, 3.99, 0, 9.9, 0.04, 2.7], [0.02, 2.6, -1.3, 0.1, 2.75, 0.1], [0.02, 2.6, 1.3, 0.1, 2.75, 0.1], [0.02, 3.95, 0, 0.1, 0.1, 2.7], [0.02, BED + 0.04, 0, 0.1, 0.1, 2.7]]),
    side: mergeBoxes([[-4.9, 2.575, 0, 9.8, 2.75, 0.06]]),
    sideRibs: mergeBoxes(sideRibs),
    grey: mergeBoxes(grey),
    dark: mergeBoxes(dark),
    lights: mergeBoxes(lights),
    tyres: cat(tw.tyres),
    hubs: cat(tw.hubs),
    caps: cat(tw.caps),
    tGrey: mergeBoxes(tGrey),
    tCab: mergeBoxes(tCab),
    tGlass: mergeBoxes(tGlass),
    tGrille: mergeBoxes(tGrille),
    tWeb: mergeBoxes(tWeb),
    tBlack: mergeBoxes(tBlack),
    tTyres: cat([...rear.tyres, ...front.tyres]),
    tHubs: cat([...rear.hubs, ...front.hubs]),
    tCaps: cat([...rear.caps, ...front.caps]),
    door: mergeBoxes([[0.65, 2.55, 0, 1.3, 2.6, 0.05], [0.65, 0.35, 0.04, 1.2, 0.04, 0.03]]),
  };
}

// One long side of a trailer, its panel, its ribs and the wordmark on the outside of the ribs, the logo reading from left to right as seen from
// outside. The near side (z out of the trailer is +z) hangs from the front end so it can draw back, the far side from the rear turned half a turn.
function TrailerSide({ b, front = false, group }: { b: ReturnType<typeof build>; front?: boolean; group?: (o: THREE.Group | null) => void }) {
  const l = logo();
  return (
    <group ref={group} position={front ? [TRAILER_L, 0, 1.27] : [0, 0, -1.27]} rotation={[0, front ? 0 : Math.PI, 0]}>
      <mesh geometry={b.side} material={trailerWhite} receiveShadow />
      <mesh geometry={b.sideRibs} material={beamFlange} />
      <mesh geometry={l.geo} material={l.mat} position={[-TRAILER_L / 2, 2.6, 0.062]} renderOrder={2} />
    </group>
  );
}

// One rear door of the trailer, hinged at its own group, the panel running along +x from the hinge when it stands folded back.
const Door = ({ g }: { g: (o: THREE.Group | null) => void }) => {
  const geo = (built ??= build()).door;
  return (
    <group ref={g}>
      <mesh geometry={geo} material={trailerWhite} castShadow />
    </group>
  );
};

export function Lorry({ apiRef, children }: { apiRef: MutableRefObject<LorryApi | null>; children?: ReactNode }) {
  const b = useMemo(() => (built ??= build()), []);
  const parts = useMemo(() => ({ trailer: null as THREE.Group | null, tractor: null as THREE.Group | null, doorA: null as THREE.Group | null, doorB: null as THREE.Group | null, curtain: null as THREE.Group | null }), []);
  const sync = () => {
    if (parts.trailer && parts.tractor && parts.doorA && parts.doorB && parts.curtain) apiRef.current = { trailer: parts.trailer, tractor: parts.tractor, doorA: parts.doorA, doorB: parts.doorB, curtain: parts.curtain };
  };
  return (
    <group>
      <group
        ref={(g) => {
          parts.trailer = g;
          sync();
        }}
      >
        <mesh geometry={b.white} material={trailerWhite} receiveShadow />
        <mesh geometry={b.roof} material={trailerRoof} />
        <TrailerSide b={b} front group={(o) => { parts.curtain = o; sync(); }} />
        <TrailerSide b={b} />
        <mesh geometry={b.grey} material={rackGrey} castShadow receiveShadow />
        <mesh geometry={b.dark} material={black} castShadow />
        <mesh geometry={b.lights} material={beamWeb} />
        <mesh geometry={b.tyres} material={tyre} castShadow />
        <mesh geometry={b.hubs} material={beamWeb} />
        <mesh geometry={b.caps} material={black} />
        {children}
        <group position={[0.03, 0, -1.36]}>
          <Door
            g={(o) => {
              parts.doorA = o;
              sync();
            }}
          />
        </group>
        <group position={[0.03, 0, 1.36]}>
          <Door
            g={(o) => {
              parts.doorB = o;
              sync();
            }}
          />
        </group>
      </group>
      <group
        ref={(g) => {
          parts.tractor = g;
          sync();
        }}
      >
        <mesh geometry={b.tGrey} material={rackGrey} castShadow />
        <mesh geometry={b.tCab} material={cabGrey} castShadow receiveShadow />
        <mesh geometry={b.tGlass} material={K.vanGlass} />
        <mesh geometry={b.tGrille} material={beamFlange} />
        <mesh geometry={b.tWeb} material={beamWeb} castShadow />
        <mesh geometry={b.tBlack} material={black} />
        <mesh geometry={b.tTyres} material={tyre} castShadow />
        <mesh geometry={b.tHubs} material={beamWeb} />
        <mesh geometry={b.tCaps} material={black} />
      </group>
    </group>
  );
}
