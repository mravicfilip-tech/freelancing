// L, N and T. The fork blade that lifts the next section, the grid of fifteen front on forklifts filling row by
// row, and the wipe that lets the dark floor rise under the grid. All the light grounds here are unlit, so the
// lifting panel and the grid's floor are exactly one colour and the swap between them can never show.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTruck, type Truck, type TruckName } from './trucks';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { decalMaterial } from '../../../variants/v4/look';
import { GRID_Z, T, darkRise, easeOut, gridExit, gridFill, lerp, lift, regionAt, seg, smooth } from './choreo';
import { ScreenSpace } from './screen';
import { Inst, type It } from './kit';
import { G, flat } from './look';

export const LIGHT = new THREE.MeshBasicMaterial({ color: C.lightGrey, toneMapped: false });
export const DARK = new THREE.MeshBasicMaterial({ color: C.ink, toneMapped: false });

/* ------------------------------------------------------------------ the blade and the wipe */

const bladeMat = new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.34, metalness: 0.55 });
const shadeTex = (() => {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.5)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 64);
  return new THREE.CanvasTexture(c);
})();
const shadeMat = new THREE.MeshBasicMaterial({ map: shadeTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.55, color: C.ink });

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

// Diagonal bars in white on the dark floor, one tile per 0.035 screens, so the stripes are square
let band: THREE.MeshBasicMaterial | null = null;
function hazardBand() {
  if (band) return band;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(255,255,255,0.34)';
  for (let i = -1; i < 2; i++) {
    g.beginPath();
    g.moveTo(i * 64, 64);
    g.lineTo(i * 64 + 32, 64);
    g.lineTo(i * 64 + 96, 0);
    g.lineTo(i * 64 + 64, 0);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4 / 0.035, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  band = new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false });
  return band;
}

export function Wipe({ clock }: { clock: StoryClock }) {
  const panel = useRef<THREE.Mesh>(null);
  const blade = useRef<THREE.Group>(null);
  const edge = useRef<THREE.Mesh>(null);
  const geo = useMemo(bladeGeometry, []);
  const tip = useMemo(() => new THREE.PlaneGeometry(4, 0.1), []);
  const bandRef = useRef<THREE.Mesh>(null);
  const bandGeo = useMemo(() => new THREE.PlaneGeometry(4, 0.035), []);
  useFrame(() => {
    const pos = clock.pos.current;
    const p = panel.current;
    const b = blade.current;
    const e = edge.current;
    const bd = bandRef.current;
    if (!p || !b || !e || !bd) return;
    let top = -9;
    let dark = false;
    let withBlade = false;
    if (pos >= T.L.start && pos < T.N.start) {
      top = lift(pos);
      withBlade = pos < T.L.end - 5;
    } else if (pos >= T.T.start && regionAt(pos) === 'grid') {
      top = darkRise(pos);
      dark = true;
    }
    p.visible = top > -8;
    p.material = dark ? DARK : LIGHT;
    // the panel hangs below its top edge, top in screens
    p.position.y = top / 2 - 2;
    b.visible = withBlade;
    b.position.y = top / 2;
    e.visible = withBlade;
    e.position.y = top / 2 - 0.07;
    // the rising dark floor carries a hazard band along its leading edge, the first lane marking of the warehouse floor
    bd.visible = dark;
    bd.position.y = top / 2 - 0.0175 - 0.02;
  });
  return (
    <ScreenSpace dist={8}>
      <mesh ref={panel} geometry={tip} scale={[1, 40, 1]} material={LIGHT} renderOrder={20} />
      <mesh ref={edge} geometry={tip} material={shadeMat} scale={[1, 1.0, 1]} renderOrder={21} />
      <mesh ref={bandRef} geometry={bandGeo} material={hazardBand()} renderOrder={21} visible={false} />
      <group ref={blade} position={[0, 0, 0.02]}>
        <mesh geometry={geo} material={bladeMat} renderOrder={22} />
      </group>
    </ScreenSpace>
  );
}

/* ------------------------------------------------------------------ the grid */

const M4 = new THREE.Matrix4();

const COLS = 5;
const ROWS = 3;
const GX = 3.3;
const GZ = 5.4;
// the range for rent, counterbalance trucks mostly, and a few of the others
const KINDS: TruckName[] = [
  'x50', 'h30d', 'r16', 'x50', 'h30d',
  'h30d', 'x50', 'x50', 'd12', 'x50',
  'x50', 'r16', 'h30d', 'x50', 'n20',
];

type Slot = { x: number; z: number; r: number; c: number; left: boolean; rank: number };
const slots: Slot[] = Array.from({ length: COLS * ROWS }, (_, i) => {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  return { x: (c - 2) * GX, z: (r - 1) * GZ, r, c, left: c <= 2, rank: Math.abs(c - 2) };
});

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
  // bays across the whole depot, 13 across and five rows, the fleet takes the middle five of the middle three
  const all: { x: number; z: number }[] = [];
  for (let c = -6; c <= 6; c++) for (let r = -2; r <= 2; r++) all.push({ x: c * GX, z: r * GZ });
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
      const t0 = sl.r * 0.31 + (COLS - 1 - sl.c) * 0.05;
      const t = seg(f, t0, t0 + 0.24);
      // in T every truck turns east and drives off to the right, the rightmost first
      const e0 = (COLS - 1 - sl.c) * 0.07 + sl.r * 0.05;
      const te = seg(ex, e0, e0 + 0.5);
      if (t <= 0 || te >= 1) {
        tr.g.visible = false;
        M4.compose(v.set(0, -80, 0), rot, s.set(0.001, 0.001, 1));
        poolRef.current?.setMatrixAt(i, M4);
        return;
      }
      // trucks come in from the side they park on, drive in, turn to face the camera
      const xIn = lerp(sl.left ? sl.x - 17 : sl.x + 17, sl.x, easeOut(t));
      const turn = smooth(seg(t, 0.5, 1));
      const turnOut = smooth(seg(te, 0, 0.35));
      const side = sl.left ? -1 : 1;
      const x = xIn + side * 22 * te * te;
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
      {KINDS.map((k, i) => (
        <GridTruck
          key={i}
          name={k}
          gref={(grp, t) => {
            trucks.current[i] = { g: grp, t };
          }}
        />
      ))}
    </group>
  );
}
