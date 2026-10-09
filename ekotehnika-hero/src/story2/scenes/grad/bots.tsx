// AT, the dark floor of a warehouse seen from straight above. Dotted paths draw on in T, then small Linde style
// robots shuttle between stations on them, carrying a carton out and a carton back, driven by the scroll.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { BOTS_Z, botPhase, lerp, pathDraw, seg, smooth } from './choreo';
import { DARK } from './rental';
import { CartonModel } from './models';
import { useTruck, type TruckName } from './trucks';

type Lane = { a: [number, number]; b: [number, number]; off: number };
// Diagonal lanes in metres, x east, z south, the camera looks straight down with north up
const LANES: Lane[] = [
  { a: [-5.2, -0.1], b: [-6.5, 2.8], off: 0.0 },
  { a: [-2.7, 1.7], b: [-4.1, 4.4], off: 0.37 },
  { a: [1.9, 1.3], b: [0.5, 4.3], off: 0.62 },
  { a: [5.3, -0.2], b: [3.9, 2.6], off: 0.18 },
  { a: [6.8, 0.8], b: [5.3, 4.3], off: 0.81 },
  { a: [-1.2, 2.0], b: [-2.4, 4.7], off: 0.5 },
];
const CYCLES = 1.5;
// the C-Matic range, the low AGV and the one with forks
const KINDS: TruckName[] = ['cmatic10', 'cmatichp', 'cmatic10', 'cmatic10', 'cmatichp', 'cmatic10'];

function Bot({ name, reg }: { name: TruckName; reg: (g: THREE.Group, h: number) => void }) {
  const t = useTruck(name);
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.add(t.root);
    reg(g, t.height);
    return () => {
      t.root.removeFromParent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  return <group ref={ref} />;
}

const padMat = new THREE.MeshBasicMaterial({ color: C.textGrey, toneMapped: false, transparent: true, opacity: 0.55 });
const dotMat = new THREE.MeshBasicMaterial({ color: C.white, toneMapped: false, transparent: true, opacity: 0.9 });

// the position along a lane, 0 at a and 1 at b, and the heading, by the phase of one round trip
function leg(phase: number) {
  const t = ((phase % 1) + 1) % 1;
  if (t < 0.42) return { u: smooth(t / 0.42), dir: 1 };
  if (t < 0.5) return { u: 1, dir: 1 };
  if (t < 0.92) return { u: 1 - smooth((t - 0.5) / 0.42), dir: -1 };
  return { u: 0, dir: -1 };
}

export function BotsStage({ clock }: { clock: StoryClock }) {
  const dots = useRef<THREE.InstancedMesh>(null);
  const bots = useRef<(THREE.Group | null)[]>([]);
  const heights = useRef<number[]>([]);
  const cartons = useRef<(THREE.Group | null)[]>([]);
  const pads = useRef<THREE.InstancedMesh>(null);

  // dots, interleaved over the lanes so every lane draws on at the same rate
  const dotPts = useMemo(() => {
    const per = LANES.map((l) => {
      const len = Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]);
      const n = Math.floor(len / 0.3);
      return Array.from({ length: n + 1 }, (_, j) => [lerp(l.a[0], l.b[0], j / n), lerp(l.a[1], l.b[1], j / n)] as [number, number]);
    });
    const out: [number, number][] = [];
    const max = Math.max(...per.map((p) => p.length));
    for (let j = 0; j < max; j++) for (const p of per) if (p[j]) out.push(p[j]);
    return out;
  }, []);
  const dotGeo = useMemo(() => new THREE.CircleGeometry(0.045, 8).rotateX(-Math.PI / 2), []);
  const padGeo = useMemo(() => new THREE.RingGeometry(0.34, 0.5, 40).rotateX(-Math.PI / 2), []);

  useLayoutEffect(() => {
    const m = dots.current;
    if (m) {
      const mat = new THREE.Matrix4();
      dotPts.forEach(([x, z], i) => m.setMatrixAt(i, mat.makeTranslation(x, 0.012, z)));
      m.instanceMatrix.needsUpdate = true;
      m.frustumCulled = false;
    }
    const p = pads.current;
    if (p) {
      const mat = new THREE.Matrix4();
      LANES.forEach((l, i) => {
        p.setMatrixAt(i * 2, mat.makeTranslation(l.a[0], 0.01, l.a[1]));
        p.setMatrixAt(i * 2 + 1, mat.makeTranslation(l.b[0], 0.01, l.b[1]));
      });
      p.instanceMatrix.needsUpdate = true;
      p.frustumCulled = false;
    }
  }, [dotPts]);

  useFrame(() => {
    const pos = clock.pos.current;
    const draw = pathDraw(pos);
    if (dots.current) dots.current.count = Math.floor(dotPts.length * draw);
    const ph = botPhase(pos);
    const show = smooth(seg(pos, 10900, 11000));
    LANES.forEach((l, i) => {
      const b = bots.current[i];
      const c = cartons.current[i];
      const { u, dir } = leg(ph * CYCLES + l.off);
      const x = lerp(l.a[0], l.b[0], u);
      const z = lerp(l.a[1], l.b[1], u);
      const yaw = Math.atan2(-(l.b[1] - l.a[1]) * dir, (l.b[0] - l.a[0]) * dir);
      if (b) {
        b.position.set(x, 0, z);
        b.rotation.set(0, yaw, 0);
        b.scale.setScalar(Math.max(0.001, show));
      }
      if (c) {
        c.position.set(x, heights.current[i] ?? 0.33, z);
        c.rotation.set(0, yaw, 0);
        c.scale.setScalar(Math.max(0.001, show));
      }
    });
  });

  return (
    <group position={[0, 0, BOTS_Z]}>
      <mesh rotation-x={-Math.PI / 2} material={DARK}>
        <planeGeometry args={[600, 600]} />
      </mesh>
      <instancedMesh ref={pads} args={[padGeo, padMat, LANES.length * 2]} />
      <instancedMesh ref={dots} args={[dotGeo, dotMat, dotPts.length]} />
      {LANES.map((_, i) => (
        <group key={i}>
          <Bot
            name={KINDS[i]}
            reg={(g, h) => {
              bots.current[i] = g;
              heights.current[i] = h;
            }}
          />
          <group ref={(g) => { cartons.current[i] = g; }}>
            <CartonModel />
          </group>
        </group>
      ))}
    </group>
  );
}
