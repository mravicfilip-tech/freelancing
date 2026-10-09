// The real Linde models from public/models/linde. Every truck is cloned from the loaded file (geometry and
// materials are shared), turned so the forks point along +x like the rest of the scene, and moved so its box
// stands on y = 0 with its middle at the origin. The files keep their own Linde materials.
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BASE = '/models/linde/';
export type TruckName = 'x50' | 'h30d' | 'r16' | 'n20' | 'mt15c' | 'd12' | 'cmatic10' | 'cmatichp';
const NAMES: TruckName[] = ['x50', 'h30d', 'r16', 'n20', 'mt15c', 'd12', 'cmatic10', 'cmatichp'];
NAMES.forEach((n) => useGLTF.preload(`${BASE}${n}.glb`));

export type Wheel = { o: THREE.Object3D; r: number };
export type Truck = {
  root: THREE.Group; // unturned, put it where the truck stands and give it its heading
  wheels: Wheel[];
  forks: THREE.Object3D | null;
  forksY0: number;
  len: number;
  width: number;
  height: number;
  tip: number; // x of the fork tips
  roll: (dist: number) => void;
  setLift: (m: number) => void;
};

const box = new THREE.Box3();
const size = new THREE.Vector3();
const ctr = new THREE.Vector3();

function build(src: THREE.Object3D, name: TruckName): Truck {
  const c = src.clone(true);
  c.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    // another brand's mark on the robot
    if (/quicktron/i.test(o.name)) o.visible = false;
  });
  c.updateMatrixWorld(true);
  const wheels: Wheel[] = [];
  let forks: THREE.Object3D | null = null;
  c.traverse((o) => {
    if (/(^|_)wheel/i.test(o.name) && !/Black/i.test(o.name)) {
      box.setFromObject(o);
      box.getSize(size);
      wheels.push({ o, r: Math.max(0.05, size.y / 2) });
    }
    if (/^(gabel|gabeln|C_matic_gabel)$/i.test(o.name)) forks = o;
  });
  // size the visible truck, leaving the hidden marks out
  box.makeEmpty();
  c.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && o.visible && !/quicktron/i.test(o.name)) box.expandByObject(o, true);
  });
  box.getSize(size);
  box.getCenter(ctr);
  const pivot = new THREE.Group();
  pivot.rotation.y = Math.PI;
  c.position.set(-ctr.x, -box.min.y, -ctr.z);
  pivot.add(c);
  const root = new THREE.Group();
  root.add(pivot);
  const f = forks as THREE.Object3D | null;
  const forksY0 = f ? f.position.y : 0;
  void name;
  return {
    root,
    wheels,
    forks: f,
    forksY0,
    len: size.x,
    width: size.z,
    height: size.y,
    tip: size.x / 2,
    // the files point their forks along -x, so forward travel turns a wheel about +z
    roll: (dist) => wheels.forEach((w) => (w.o.rotation.z = dist / w.r)),
    setLift: (m) => {
      if (f) f.position.y = forksY0 + m;
    },
  };
}

export function useTruck(name: TruckName): Truck {
  const g = useGLTF(`${BASE}${name}.glb`);
  return useMemo(() => build(g.scene, name), [g, name]);
}
