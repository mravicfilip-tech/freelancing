// What the Najam hall, its yard and its lorries are made of, the materials, the instanced plates and turned slats, the loaded pallet and
// the labels. najam.tsx holds the racks, the trucks and the lorries, najamhall.tsx the hall and the yard around it. Everything is
// light ground and the LMH greys with the red of the Linde trucks, the same set as warehouse.tsx and nothing brought in from outside.
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { labelTexture } from './warehouse';
import { G, lam, lit } from './kit';
import type { BoxItem } from './props';

// ---- materials --------------------------------------------------------------------------------------------------------

// The greys of the racks of the Prodaja warehouse, one step lighter all through, since the text of N3 and N4 lies over the racks and
// graphite uprights through a title read as strokes of the letters.
export const rackGrey = lam(G.mid);
export const beamWeb = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.4) });
export const beamFlange = lam(G.mid);
export const palletBase = lam(G.mid);
export const loadMats = [G.white, G.pale, G.light].map((c) => lam(c, { emissive: lit(c).multiplyScalar(0.3) }));
export const wrapShell = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.6), transparent: true, opacity: 0.3, toneMapped: false, depthWrite: false });
export const wrapBand = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.7), transparent: true, opacity: 0.75, toneMapped: false, depthWrite: false });
export const wallMat = lam(G.pale, { emissive: new THREE.Color().setScalar(0.56) });
export const wallBase = lam(G.light, { emissive: new THREE.Color().setScalar(0.46) });
export const apron = lam(G.light, { emissive: new THREE.Color().setScalar(0.2) });
export const slab = lam(G.white, { emissive: new THREE.Color().setScalar(0.26) });
export const doorMat = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.7) });
export const columnMat = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.8) });
export const roofMat = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.85) });
export const lipMat = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.8) });
export const glazing = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.2) });
export const roadMat = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.45) });
export const line = new THREE.MeshBasicMaterial({ color: G.mid, opacity: 0.62, transparent: true, toneMapped: false, depthWrite: false });
export const lineFaint = new THREE.MeshBasicMaterial({ color: G.light, opacity: 0.7, transparent: true, toneMapped: false, depthWrite: false });
export const lineWhite = new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false, depthWrite: false });
export const black = lam(G.black);
export const trailerWhite = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.5) });
export const cabGrey = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.4) });
export const tyre = lam('#111111');
export const darkGrey = lam(G.dark);

// ---- labels -----------------------------------------------------------------------------------------------------------

// Shipping and rack labels, the white plates of the Prodaja racks, built once.
const labelMats: THREE.Material[] = [];
export const labelMat = (i: number) => (labelMats[i] ??= new THREE.MeshBasicMaterial({ map: labelTexture(['A 12 03', 'B 07 02', 'C 21 04', 'D 03 01', 'N 01', 'N 02'][i], 71 + i * 7), toneMapped: false }));

// ---- instanced parts --------------------------------------------------------------------------------------------------

type Plate = [number, number, number, number, number];

// Instanced flat plates, each item a centre x, y, z and a width and height, all turned the same way about the y axis. yaw 0 faces +z.
export function Plates({ items, yaw, mat }: { items: Plate[]; yaw: number; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    items.forEach(([x, y, z, w, h], i) => ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, 1))));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items, yaw]);
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, Math.max(items.length, 1)]} count={items.length} material={mat} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

// A box and the turn of it about the y axis in radians, for the hatching of a walkway and the arrows on the floor.
export type SlatItem = [...BoxItem, yaw: number];

// Many turned boxes of one material in one draw.
export function Slats({ items, mat, cast = false, receive = false }: { items: SlatItem[]; mat: THREE.Material; cast?: boolean; receive?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    items.forEach(([x, y, z, w, h, d, yaw], i) => ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(0, yaw, 0)), new THREE.Vector3(w, h, d))));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, Math.max(items.length, 1)]} count={items.length} material={mat} castShadow={cast} receiveShadow={receive} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

// An arrow lying on the floor, a shaft and a head of two bars, pointing along +x turned by yaw, for lane and aisle markings.
export function arrow(x: number, z: number, yaw: number, len = 1.8, y = 0.03): SlatItem[] {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const at = (dx: number, dz: number) => [x + dx * c + dz * s, y, z - dx * s + dz * c] as const;
  const head = len * 0.3;
  const out: SlatItem[] = [];
  const sh = at(-head * 0.15, 0);
  out.push([sh[0], y, sh[2], len * 0.8, 0.01, 0.14, yaw]);
  for (const side of [-1, 1]) {
    const p = at(len * 0.5 - head * 0.5, side * head * 0.45);
    out.push([p[0], y, p[2], head * 1.25, 0.01, 0.14, yaw + side * 0.78]);
  }
  return out;
}

// Diagonal hatching over a rectangle, bars every pitch metres at 45 degrees, kept inside the rectangle by cutting each bar to it.
export function hatch(x0: number, x1: number, z0: number, z1: number, pitch = 0.7, y = 0.03): SlatItem[] {
  const out: SlatItem[] = [];
  const w = x1 - x0;
  const d = z1 - z0;
  // bars run along (1, 1), the offset c = z - x steps by pitch, and a bar is cut where it enters and leaves the rectangle
  for (let c = z0 - x1 + pitch / 2; c < z1 - x0; c += pitch * Math.SQRT2) {
    const a = Math.max(x0, z0 - c);
    const b = Math.min(x1, z1 - c);
    if (b - a < 0.15) continue;
    const mx = (a + b) / 2;
    out.push([mx, y, mx + c, (b - a) * Math.SQRT2, 0.01, 0.12, -Math.PI / 4]);
  }
  void w;
  void d;
  return out;
}

// ---- merged bodies ----------------------------------------------------------------------------------------------------

// Boxes baked into one geometry, so a lorry or a cabin is a draw or two and not a hundred. Each item is a centre, a size and an optional
// turn about y.
export function mergeBoxes(items: (BoxItem | SlatItem)[]) {
  const parts = items.map((it) => {
    const g = new THREE.BoxGeometry(it[3], it[4], it[5]);
    const yaw = (it as SlatItem)[6] ?? 0;
    if (yaw) g.rotateY(yaw);
    g.translate(it[0], it[1], it[2]);
    return g;
  });
  const out = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return out;
}

// ---- a loaded pallet --------------------------------------------------------------------------------------------------

// A loaded pallet in the frame of a truck's forks, x along the forks and z across them, its bottom at the origin. The same loads as
// the racks, a dark base, a wrapped white or grey load with two bands and a label plate on each aisle face.
export function Load({ h = 1.05, colour = 0 }: { h?: number; colour?: number }) {
  return (
    <group>
      <mesh position={[0, 0.07, 0]} material={palletBase} castShadow>
        <boxGeometry args={[0.82, 0.14, 1.2]} />
      </mesh>
      <mesh position={[0, 0.14 + h / 2, 0]} material={loadMats[colour]} castShadow>
        <boxGeometry args={[0.88, h, 1.08]} />
      </mesh>
      <mesh position={[0, 0.14 + h / 2, 0]} material={wrapShell}>
        <boxGeometry args={[0.93, h + 0.03, 1.13]} />
      </mesh>
      {[0.3, 0.68].map((f) => (
        <mesh key={f} position={[0, 0.14 + h * f, 0]} material={wrapBand}>
          <boxGeometry args={[0.95, 0.07, 1.15]} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.445, 0.14 + h * 0.6, -s * 0.2]} rotation={[0, (s * Math.PI) / 2, 0]} material={labelMat(s > 0 ? 0 : 1)}>
          <planeGeometry args={[0.34, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}
