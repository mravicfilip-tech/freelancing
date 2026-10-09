// The Ekotehnika site at dusk, built from light and simple silhouettes. The building outline with its live 3D
// name, vans, trees, lamps and the lit road that turns into the grey S path. Everything is still, the truck
// drives past it, so the parallax comes from the camera.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { C } from '../../../tokens';
import { BUILDING_X, ROUTE } from './route';
import { K, poolMaterial, rng, signGeometry, softTexture } from './kit';

const lineMat = (opacity: number) => new THREE.LineBasicMaterial({ color: C.lightGrey, transparent: true, opacity, toneMapped: false });
const edgesOf = (geo: THREE.BufferGeometry, opacity = 0.3) => new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), lineMat(opacity));

function Ribbon({ half, y, material, step = 4 }: { half: number; y: number; material: THREE.Material; step?: number }) {
  const geo = useMemo(() => {
    const pts = ROUTE.filter((_, i) => i % step === 0 || i === ROUTE.length - 1);
    const pos: number[] = [];
    const idx: number[] = [];
    pts.forEach((p, i) => {
      const nx = Math.sin(p.yaw);
      const nz = Math.cos(p.yaw);
      pos.push(p.x + nx * half, y, p.z + nz * half, p.x - nx * half, y, p.z - nz * half);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    g.setIndex(idx);
    return g;
  }, [half, y, step]);
  return <mesh geometry={geo} material={material} receiveShadow />;
}

// An edge line of the road, a thin lit ribbon.
function RoadEdge({ offset }: { offset: number }) {
  const geo = useMemo(() => {
    const pts = ROUTE.filter((_, i) => i % 4 === 0 || i === ROUTE.length - 1);
    const pos: number[] = [];
    const idx: number[] = [];
    const w = 0.07;
    pts.forEach((p, i) => {
      const nx = Math.sin(p.yaw);
      const nz = Math.cos(p.yaw);
      const o1 = offset + w;
      const o2 = offset - w;
      pos.push(p.x + nx * o1, 0.015, p.z + nz * o1, p.x + nx * o2, 0.015, p.z + nz * o2);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return g;
  }, [offset]);
  return <mesh geometry={geo} material={K.glowSoft} />;
}

function Road() {
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#12171a', emissive: '#242d31' }), []);
  return (
    <group>
      <Ribbon half={1.85} y={0.005} material={mat} />
      <RoadEdge offset={1.7} />
      <RoadEdge offset={-1.7} />
    </group>
  );
}

function Windows({ items, mat }: { items: [number, number, number][]; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const bar = useRef<THREE.InstancedMesh>(null);
  const bar2 = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    items.forEach(([x, y, z], i) => {
      ref.current!.setMatrixAt(i, m.makeTranslation(x, y, z));
      bar.current!.setMatrixAt(i, m.makeTranslation(x, y, z + 0.07));
      bar2.current!.setMatrixAt(i, m.makeTranslation(x, y, z + 0.07));
    });
    [ref, bar, bar2].forEach((r) => (r.current!.instanceMatrix.needsUpdate = true));
  }, [items]);
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, items.length]} material={mat}>
        <boxGeometry args={[1.5, 1.45, 0.12]} />
      </instancedMesh>
      <instancedMesh ref={bar} args={[undefined, undefined, items.length]} material={K.silhouette}>
        <boxGeometry args={[0.07, 1.5, 0.05]} />
      </instancedMesh>
      <instancedMesh ref={bar2} args={[undefined, undefined, items.length]} material={K.silhouette}>
        <boxGeometry args={[1.55, 0.07, 0.05]} />
      </instancedMesh>
    </group>
  );
}

function Block({ x, z, w, d, h, mat = K.silhouette, lines = 0.55 }: { x: number; z: number; w: number; d: number; h: number; mat?: THREE.Material; lines?: number }) {
  const geo = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
  const edges = useMemo(() => edgesOf(geo, lines), [geo, lines]);
  return (
    <group position={[x, h / 2, z]}>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      <primitive object={edges} />
    </group>
  );
}

function Building() {
  const sign = useMemo(() => signGeometry('EKOTEHNIKA', 1.15, 0.28), []);
  const front = -9;
  const { on, dim, door } = useMemo(() => {
    const r = rng(7);
    const on: [number, number, number][] = [];
    const dim: [number, number, number][] = [];
    for (let i = 0; i < 9; i++) {
      const x = BUILDING_X - 11 + i * 2.7;
      for (const y of [1.7, 5.0]) {
        if (y < 3 && i >= 4 && i <= 6) continue; // the entrance glazing
        if (y > 3 && x > BUILDING_X - 3.2 && x < BUILDING_X + 9) continue; // behind the sign
        (r() < 0.78 ? on : dim).push([x, y, front + 0.04]);
      }
    }
    // the extension and the hall, lower and plainer
    for (let i = 0; i < 5; i++) {
      (r() < 0.7 ? on : dim).push([BUILDING_X + 16 + i * 2.7, 1.9, front - 0.45 + 0.04]);
    }
    return { on, dim, door: [BUILDING_X + 2.6, 1.8, front + 0.05] as [number, number, number] };
  }, []);
  const hallLines = useMemo(() => Array.from({ length: 14 }, (_, i) => 63.8 + i * 0.85), []);
  return (
    <group>
      <Block x={BUILDING_X} z={front - 5.5} w={26} d={11} h={7.6} />
      <Block x={BUILDING_X + 20} z={front - 4.5} w={14} d={9} h={5.2} />
      <Block x={69} z={-14} w={12} d={16} h={7.2} mat={K.silhouetteFar} lines={0.25} />
      {hallLines.map((x) => (
        <mesh key={x} position={[x, 3.5, -5.95]} material={K.glowSoft}>
          <boxGeometry args={[0.03, 6.6, 0.02]} />
        </mesh>
      ))}
      <Windows items={on} mat={K.windowOn} />
      <Windows items={dim} mat={K.windowDim} />
      {/* entrance, a lit glass door under a canopy */}
      <mesh position={[door[0], door[1], door[2]]} material={K.windowOn}>
        <boxGeometry args={[6, 2.8, 0.1]} />
      </mesh>
      <RoundedBox args={[8, 0.22, 2.2]} radius={0.05} position={[door[0], 3.15, front + 0.9]} material={K.metalGrey} castShadow />
      {/* the live 3D name, Geist caps in white, lit from within */}
      <mesh geometry={sign} material={K.sign} position={[BUILDING_X - 2.4, 3.75, front + 0.05]} />
      <mesh position={[BUILDING_X + 3.0, 5.0, front + 0.02]}>
        <planeGeometry args={[14.5, 3.0]} />
        <meshBasicMaterial map={softTexture()} color={C.lightGrey} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Van({ x, z, yaw = 0, scale = 1 }: { x: number; z: number; yaw?: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]} scale={scale}>
      <RoundedBox args={[3.5, 1.65, 1.8]} radius={0.12} position={[-0.55, 1.18, 0]} material={K.van} castShadow receiveShadow />
      <RoundedBox args={[1.5, 1.25, 1.8]} radius={0.16} position={[1.55, 0.98, 0]} material={K.van} castShadow />
      <RoundedBox args={[0.7, 0.62, 1.74]} radius={0.06} position={[1.62, 1.42, 0]} material={K.vanGlass} />
      <mesh position={[2.32, 0.78, 0.55]} material={K.glow}>
        <boxGeometry args={[0.05, 0.16, 0.3]} />
      </mesh>
      <mesh position={[2.32, 0.78, -0.55]} material={K.glow}>
        <boxGeometry args={[0.05, 0.16, 0.3]} />
      </mesh>
      {[-1.2, 1.55].map((wx) =>
        [-0.9, 0.9].map((wz) => (
          <mesh key={`${wx}${wz}`} position={[wx, 0.38, wz]} rotation={[Math.PI / 2, 0, 0]} material={K.tyre} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.26, 20]} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Trees() {
  const cyp = useRef<THREE.InstancedMesh>(null);
  const bush = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const r = rng(21);
    const cy: [number, number, number, number][] = [
      [BUILDING_X - 13, 0, -3.4, 4.2], [BUILDING_X - 12.2, 0, -3.1, 3.2], [BUILDING_X + 9, 0, -3.0, 3.6], [BUILDING_X + 12.5, 0, -3.4, 2.8], [BUILDING_X - 17, 0, -4, 4.5],
    ];
    for (let i = 0; i < 46; i++) cy.push([-60 + i * 3.1 + r() * 2, 0, -16 - r() * 22, 3.5 + r() * 4]);
    const bu: [number, number, number, number][] = [];
    for (let i = 0; i < 22; i++) bu.push([-40 + i * 4.6 + r() * 2, 0, -2.6 - r() * 1.2, 0.35 + r() * 0.3]);
    return { cy, bu };
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    items.cy.forEach(([x, , z, h], i) => cyp.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(1, h / 5, 1))));
    items.bu.forEach(([x, , z, s], i) => bush.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, s * 0.6, z), q, new THREE.Vector3(s * 1.5, s, s * 1.2))));
    cyp.current!.instanceMatrix.needsUpdate = true;
    bush.current!.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <group>
      <instancedMesh ref={cyp} args={[undefined, undefined, items.cy.length]} material={K.silhouetteFar} castShadow>
        <coneGeometry args={[0.85, 5, 7]} />
      </instancedMesh>
      <instancedMesh ref={bush} args={[undefined, undefined, items.bu.length]} material={K.silhouette}>
        <sphereGeometry args={[0.8, 10, 8]} />
      </instancedMesh>
    </group>
  );
}

function Lamps() {
  const xs = [-8, 14, 44, 62];
  const pool = useMemo(() => poolMaterial(0.5, C.lightGrey), []);
  const tex = softTexture();
  return (
    <group>
      {xs.map((x) => (
        <group key={x} position={[x, 0, -2.7]}>
          <mesh position={[0, 2.6, 0]} material={K.metalGrey} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 5.2, 8]} />
          </mesh>
          <mesh position={[0, 5.18, 0.3]} material={K.glow}>
            <boxGeometry args={[0.7, 0.06, 0.28]} />
          </mesh>
          <sprite position={[0, 5.15, 0.3]} scale={[4.2, 4.2, 1]}>
            <spriteMaterial map={tex} color={C.lightGrey} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1.2]} material={pool}>
            <planeGeometry args={[11, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Kerb lights, a dotted line along the front edge of the yard.
function Kerb() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const xs = useMemo(() => Array.from({ length: 36 }, (_, i) => -50 + i * 2.8), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    xs.forEach((x, i) => ref.current!.setMatrixAt(i, m.makeTranslation(x, 0.04, -2.05)));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [xs]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, xs.length]} material={K.glow}>
      <boxGeometry args={[0.5, 0.06, 0.07]} />
    </instancedMesh>
  );
}

// Parked trucks in the yard, only their raised masts show against the sky.
function Yard() {
  const items = [[56, -10.5], [58.4, -11.6], [60.7, -10.8], [63.2, -9.4], [65, -12], [53.5, -9.8]];
  return (
    <group>
      {items.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, (i % 3) * 0.25, 0]}>
          {[-0.3, 0.3].map((dz) => (
            <mesh key={dz} position={[0, 2.5 + (i % 2) * 0.4, dz]} material={K.silhouetteFar} castShadow>
              <boxGeometry args={[0.14, 5 + (i % 2) * 0.8, 0.12]} />
            </mesh>
          ))}
          <mesh position={[-1.1, 1.2, 0]} material={K.silhouetteFar} castShadow>
            <boxGeometry args={[2.4, 1.7, 1.15]} />
          </mesh>
          <mesh position={[-1.1, 2.4, 0]} material={K.silhouetteFar}>
            <boxGeometry args={[1.6, 0.08, 1.2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// A band of haze along the horizon, so the site reads against the dark.
function Horizon() {
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  const mat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createLinearGradient(0, 256, 0, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.26, 'rgba(255,255,255,0)');
    grd.addColorStop(0.37, 'rgba(255,255,255,0.45)');
    grd.addColorStop(0.72, 'rgba(255,255,255,0.1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t, color: '#6f7b7f', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
  }, []);
  useFrame(() => {
    if (ref.current) ref.current.position.x = camera.position.x;
  });
  return (
    <mesh ref={ref} position={[0, 26, -230]} material={mat} renderOrder={-5}>
      <planeGeometry args={[900, 110]} />
    </mesh>
  );
}

export default function Outdoor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, -0.02, -60]} material={K.ground} receiveShadow>
        <planeGeometry args={[550, 440]} />
      </mesh>
      <Road />
      <Kerb />
      <Building />
      <Van x={13} z={-6.5} yaw={0.04} />
      <Van x={19.5} z={-7.6} yaw={-0.12} />
      <Van x={52} z={-6.5} yaw={Math.PI} />
      <Trees />
      <Lamps />
      <Yard />
      <Horizon />
    </group>
  );
}
