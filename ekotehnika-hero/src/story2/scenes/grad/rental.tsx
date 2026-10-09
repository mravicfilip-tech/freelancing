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
import { GRID_Z, T, darkRise, easeOut, gridDrop, gridFill, lerp, lift, regionAt, seg, smooth } from './choreo';
import { ScreenSpace } from './screen';
import { useLifted } from './blueprint';

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

export function Wipe({ clock }: { clock: StoryClock }) {
  const panel = useRef<THREE.Mesh>(null);
  const blade = useRef<THREE.Group>(null);
  const edge = useRef<THREE.Mesh>(null);
  const geo = useMemo(bladeGeometry, []);
  const tip = useMemo(() => new THREE.PlaneGeometry(4, 0.1), []);
  useFrame(() => {
    const pos = clock.pos.current;
    const p = panel.current;
    const b = blade.current;
    const e = edge.current;
    if (!p || !b || !e) return;
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
  });
  return (
    <ScreenSpace dist={8}>
      <mesh ref={panel} geometry={tip} scale={[1, 40, 1]} material={LIGHT} renderOrder={20} />
      <mesh ref={edge} geometry={tip} material={shadeMat} scale={[1, 1.0, 1]} renderOrder={21} />
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

export function GridStage({ clock }: { clock: StoryClock }) {
  const g = useRef<THREE.Group>(null);
  useLifted(clock, g, [0, 0, GRID_Z], (pos) => -gridDrop(pos) * 1.45, 44);
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
    const f = gridFill(clock.pos.current);
    slots.forEach((sl, i) => {
      const tr = trucks.current[i];
      if (!tr) return;
      const t0 = sl.r * 0.31 + sl.rank * 0.05;
      const t = seg(f, t0, t0 + 0.24);
      if (t <= 0) {
        tr.g.visible = false;
        M4.compose(v.set(0, -80, 0), rot, s.set(0.001, 0.001, 1));
        poolRef.current?.setMatrixAt(i, M4);
        return;
      }
      const start = sl.left ? sl.x - 17 : sl.x + 17;
      const x = lerp(start, sl.x, easeOut(t));
      const turn = smooth(seg(t, 0.5, 1));
      const from = sl.left ? 0 : Math.PI;
      const to = sl.left ? -Math.PI / 2 : (3 * Math.PI) / 2;
      const yaw = lerp(from, to, turn);
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
    <group ref={g}>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} material={LIGHT}>
        <planeGeometry args={[600, 600]} />
      </mesh>
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
