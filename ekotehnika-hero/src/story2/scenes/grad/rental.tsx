// L and N. The fork blade that lifts the next section and the rental depot, bays and front on forklifts filling row by
// row across the whole width. All the light grounds here are unlit, so the lifting panel and the depot floor are exactly one
// colour and the swap between them can never show.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTruck, type Truck, type TruckName } from './trucks';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { decalMaterial } from '../../../variants/v4/look';
import { GRID_Z, T, easeOut, gridExit, gridFill, lerp, lift, seg, smooth } from './choreo';
import { ScreenSpace } from './screen';
import { Inst, type It } from './kit';
import { G, flat } from './look';

export const LIGHT = new THREE.MeshBasicMaterial({ color: C.lightGrey, toneMapped: false });
export const DARK = new THREE.MeshBasicMaterial({ color: C.ink, toneMapped: false });

/* ------------------------------------------------------------------ the blade and the wipe */

const bladeMat = new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.34, metalness: 0.55 });
// The blade seen from the side, a long flat steel tongue with a tapered tip at the left. Units are screens high.
function bladeGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.66, 0);
  s.lineTo(2.6, 0);
  s.lineTo(2.6, -0.078);
  s.lineTo(-0.16, -0.078);
  s.quadraticCurveTo(-0.5, -0.07, -0.66, -0.028);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 20 });
  g.translate(0, 0, -0.05);
  return g;
}

export function Wipe({ clock }: { clock: StoryClock }) {
  const panel = useRef<THREE.Mesh>(null);
  const blade = useRef<THREE.Group>(null);
  const geo = useMemo(bladeGeometry, []);
  const tip = useMemo(() => new THREE.PlaneGeometry(4, 0.1), []);
  useFrame(() => {
    const pos = clock.pos.current;
    const p = panel.current;
    const b = blade.current;
    if (!p || !b) return;
    // only L, the light section rides up on the fork blade, and the top of the panel is a hard edge. T has no panel, the hall
    // of the robots is drawn by the director under its own hard edge.
    let top = -9;
    let withBlade = false;
    if (pos >= T.L.start && pos < T.N.start) {
      top = lift(pos);
      withBlade = pos < T.L.end - 5;
    }
    p.visible = top > -8;
    p.material = LIGHT;
    // the panel hangs below its top edge, top in screens
    p.position.y = top / 2 - 2;
    b.visible = withBlade;
    b.position.y = top / 2;
  });
  return (
    <ScreenSpace dist={8}>
      <mesh ref={panel} geometry={tip} scale={[1, 40, 1]} material={LIGHT} renderOrder={20} />
      <group ref={blade} position={[0, 0, 0.02]}>
        <mesh geometry={geo} material={bladeMat} renderOrder={22} />
      </group>
    </ScreenSpace>
  );
}

/* ------------------------------------------------------------------ the grid */

const M4 = new THREE.Matrix4();

// The depot runs the whole width. Eleven bays across in the three middle rows hold the range for rent, a few bays stand empty as
// trucks out on hire, and the bays go on to both edges of the frame and to the rows in front and behind.
const COLS = 11;
const ROWS = 3;
const MID = (COLS - 1) / 2;
const GX = 3.3;
const GZ = 5.4;
// the range for rent, counterbalance trucks mostly, and a few of the others
const KINDS: TruckName[] = ['x50', 'h30d', 'x50', 'r16', 'h30d', 'x50', 'd12', 'x50', 'h30d', 'n20', 'x50'];

type Slot = { x: number; z: number; r: number; c: number; ci: number; kind: TruckName; left: boolean; rank: number };
// the empty bays, trucks out on hire, by row from the far one, none side by side and every row stays mostly full
const OUT = [[2, 7], [4, 9], [1, 5, 8]];
const EMPTY = (ci: number, r: number) => OUT[r].includes(ci);
const slots: Slot[] = [];
for (let r = 0; r < ROWS; r++)
  for (let ci = 0; ci < COLS; ci++) {
    if (EMPTY(ci, r)) continue;
    const c = ci - MID;
    slots.push({ x: c * GX, z: (r - 1) * GZ, r, c, ci, kind: KINDS[(ci + r * 4) % KINDS.length], left: c < 0 || (c === 0 && r % 2 === 0), rank: Math.abs(c) });
  }

// one truck of the grid, its own clone of the shared model
function GridTruck({ name, gref }: { name: TruckName; gref: (g: THREE.Group, t: Truck) => void }) {
  const t = useTruck(name);
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.add(t.root);
    gref(g, t);
    return () => {
      t.root.removeFromParent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  return <group ref={ref} />;
}

// The bays of the rental depot, one marked rectangle per slot, the lines painted on the floor in mid grey
const bayItems = (): It[] => {
  const out: It[] = [];
  const hw = GX / 2 - 0.12;
  const hd = GZ / 2 - 0.4;
  // bays across the whole depot, 21 across and five rows, past both edges of the frame
  const all: { x: number; z: number }[] = [];
  for (let c = -10; c <= 10; c++) for (let r = -2; r <= 2; r++) all.push({ x: c * GX, z: r * GZ });
  all.forEach((sl) => {
    out.push([sl.x - hw, 0.012, sl.z, 0.08, 0.01, hd * 2], [sl.x + hw, 0.012, sl.z, 0.08, 0.01, hd * 2]);
    out.push([sl.x, 0.012, sl.z - hd, hw * 2 + 0.08, 0.01, 0.08], [sl.x, 0.012, sl.z + hd, hw * 2 + 0.08, 0.01, 0.08]);
    // the wheel stop at the back of the bay
    out.push([sl.x, 0.012, sl.z - hd + 0.55, hw * 1.2, 0.01, 0.1]);
  });
  return out;
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

export function GridStage({ clock }: { clock: StoryClock }) {
  const g = useRef<THREE.Group>(null);
  const bays = useMemo(bayItems, []);
  const bayMat = useMemo(() => flat(G.mid), []);
  const trucks = useRef<{ g: THREE.Group; t: Truck }[]>([]);
  const poolRef = useRef<THREE.InstancedMesh>(null);
  const poolGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useLayoutEffect(() => {
    if (poolRef.current) poolRef.current.frustumCulled = false;
  }, []);
  const rot = useMemo(() => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const pos = clock.pos.current;
    const f = gridFill(pos);
    const ex = gridExit(pos);
    slots.forEach((sl, i) => {
      const tr = trucks.current[i];
      if (!tr) return;
      // the bays fill from the middle out, row by row
      const t0 = sl.r * 0.2 + sl.rank * 0.06;
      const t = seg(f, t0, t0 + 0.24);
      // in T every truck turns to its own side and drives off, the outer ones first
      const e0 = (MID - sl.rank) * 0.045 + sl.r * 0.04;
      const te = seg(ex, e0, e0 + 0.5);
      if (t <= 0 || te >= 1) {
        tr.g.visible = false;
        M4.compose(v.set(0, -80, 0), rot, s.set(0.001, 0.001, 1));
        poolRef.current?.setMatrixAt(i, M4);
        return;
      }
      // trucks come in from the side they park on, drive in, turn to face the camera
      const xIn = lerp(sl.left ? sl.x - 24 : sl.x + 24, sl.x, easeOut(t));
      const turn = smooth(seg(t, 0.5, 1));
      const turnOut = smooth(seg(te, 0, 0.35));
      const side = sl.left ? -1 : 1;
      const x = xIn + side * 26 * te * te;
      const yaw = sl.left
        ? lerp(0, -Math.PI / 2, turn) + (Math.PI / 2) * -turnOut
        : lerp(Math.PI, (3 * Math.PI) / 2, turn) + (Math.PI / 2) * turnOut;
      tr.g.visible = true;
      tr.g.position.set(x, 0, sl.z);
      tr.g.rotation.y = yaw;
      tr.t.roll(x * 1.2 + t * 6);
      const along = Math.abs(Math.cos(yaw));
      M4.compose(v.set(x, 0.03, sl.z), rot, s.set(lerp(1.7, 3.6, along), lerp(2.8, 1.7, along), 1));
      poolRef.current?.setMatrixAt(i, M4);
    });
    if (poolRef.current) poolRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={g} position={[0, 0, GRID_Z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} material={LIGHT}>
        <planeGeometry args={[600, 600]} />
      </mesh>
      <Inst geo={boxGeo} mat={bayMat} items={bays} cast={false} receive={false} />
      <instancedMesh ref={poolRef} args={[poolGeo, decalMaterial(), slots.length]} renderOrder={1} />
      {slots.map((sl, i) => (
        <GridTruck
          key={i}
          name={sl.kind}
          gref={(grp, t) => {
            trucks.current[i] = { g: grp, t };
          }}
        />
      ))}
    </group>
  );
}
