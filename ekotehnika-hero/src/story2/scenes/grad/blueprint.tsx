// S, the dark blueprint. The same realistic Linde forklift as white lines (every edge of every part, drawn as
// fat line segments), standing still while its tyres turn. Two diagonal lines and faint lines at the side slide
// across the screen so the truck seems to drive.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { BP_Z, T, bpRoll, lift, seg, smooth } from './choreo';
import { ScreenSpace } from './screen';
import { useTruck } from './trucks';

const hidden = new THREE.MeshBasicMaterial({ visible: false });
export const lineMat = new THREE.LineBasicMaterial({ color: C.white, transparent: true, opacity: 0.78, depthTest: true });

// Every sharp edge of every part of the real X50, as thin white lines. The lines are children of the part they
// outline, so a turning tyre turns its own lines.
export function BlueprintTruck({ clock }: { clock: StoryClock }) {
  const t = useTruck('x50');
  const g = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const host = g.current;
    if (!host) return;
    host.add(t.root);
    const made: THREE.Object3D[] = [];
    const meshes: THREE.Mesh[] = [];
    t.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    const orig = meshes.map((m) => m.material);
    for (const mesh of meshes) {
      const e = new THREE.EdgesGeometry(mesh.geometry, 28);
      if (!e.getAttribute('position')?.count) continue;
      const ls = new THREE.LineSegments(e, lineMat);
      ls.renderOrder = 5;
      ls.frustumCulled = false;
      mesh.add(ls);
      made.push(ls);
      mesh.material = hidden;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
    return () => {
      made.forEach((o) => o.removeFromParent());
      meshes.forEach((m, i) => {
        m.material = orig[i];
      });
      t.root.removeFromParent();
    };
  }, [t]);
  useFrame(() => {
    const pos = clock.pos.current;
    t.setLift(0.45);
    t.roll(bpRoll(pos));
  });
  return <group ref={g} />;
}

/* ------------------------------------------------------------------ the diagonal lines */

const ANG = THREE.MathUtils.degToRad(40);
const NORM = new THREE.Vector2(-Math.sin(ANG), Math.cos(ANG));
const SP = 0.37;
const CENTRE = new THREE.Vector2(0.32, 0.0);
const N_LINES = 14;

export function Streaks({ clock, strength, rise }: { clock: StoryClock; strength: (pos: number) => number; rise: (pos: number) => number }) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(() => Array.from({ length: N_LINES }, () => new THREE.MeshBasicMaterial({ color: C.white, transparent: true, depthWrite: false, toneMapped: false })), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(6, 1), []);
  useFrame(() => {
    const pos = clock.pos.current;
    const off = (pos - T.S.start) * 0.0006;
    const base = NORM.dot(CENTRE);
    const k = strength(pos);
    const up = rise(pos);
    for (let i = 0; i < N_LINES; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      // lines sit at q = (i - 6.5 + 0.5) * SP, slid by off, wrapped over the span
      const span = N_LINES * SP;
      let q = (i - N_LINES / 2 + 0.5) * SP - off;
      q = ((((q + span / 2) % span) + span) % span) - span / 2;
      const env = Math.exp(-Math.pow(q / 0.34, 2));
      // fade the ends of the span so a line never pops in or out
      const edge = 1 - smooth(seg(Math.abs(q), span / 2 - SP, span / 2));
      const p = base + q;
      m.position.set(CENTRE.x + NORM.x * (p - base), CENTRE.y + NORM.y * (p - base) + up, 0);
      m.rotation.z = ANG;
      m.scale.y = 0.0016 + 0.0032 * env;
      mats[i].opacity = (0.16 + 0.84 * env) * edge * k;
    }
  });
  return (
    <ScreenSpace dist={9}>
      {mats.map((mat, i) => (
        <mesh key={i} ref={(m) => { meshes.current[i] = m; }} geometry={geo} material={mat} renderOrder={9} />
      ))}
    </ScreenSpace>
  );
}

// Group that carries a stage off the top of the screen as the next section lifts. shift is in screens.
export function useLifted(clock: StoryClock, group: React.RefObject<THREE.Group | null>, base: [number, number, number], shift: (pos: number) => number, dist: number) {
  const up = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    const cam = camera as THREE.PerspectiveCamera;
    cam.updateMatrixWorld();
    up.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
    const hh = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const s = shift(clock.pos.current) * 2 * hh;
    g.position.set(base[0] + up.x * s, base[1] + up.y * s, base[2] + up.z * s);
  });
}

export function BlueprintStage({ clock }: { clock: StoryClock }) {
  const g = useRef<THREE.Group>(null);
  // as the lifter rises, the dark section is carried up out of the frame with it
  useLifted(clock, g, [0, 0, BP_Z], (pos) => (lift(pos) + 1.2) / 2, 12.5);
  return (
    <>
      <group ref={g}>
        <BlueprintTruck clock={clock} />
      </group>
      <Streaks clock={clock} strength={() => 1} rise={(pos) => (lift(pos) + 1.2) / 2} />
    </>
  );
}

