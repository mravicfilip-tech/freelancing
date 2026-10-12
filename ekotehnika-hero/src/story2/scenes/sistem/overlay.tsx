// Things that live in front of the lens, in half screen heights so they fit any width. The black shutter for the
// push into the forklift, the plain band over the top row (hard edged on the top rule, nothing feathers into the scene
// anywhere), and the very large steel fork tine that lifts the rental section into view. Each beat's text sits on an
// empty part of the world itself, framed by the camera, never on a painted out ground.
// They sit one metre from the camera so nothing in the world hides them.
import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from '../../clock';
import { DARK_BG, PAPER, ease, lerp, range, uOf } from './kit';

const TAN = Math.tan((28 / 2) * (Math.PI / 180));
// The shell's top row turns light ink at scroll 7790, which is 190px into B, so u 9 + 190 / 400. The band under it goes dark with it.
const DARK_TOP_FROM = 9.475;

export function useOverlayRoot() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const root = useMemo(() => new THREE.Group(), []);
  useEffect(() => {
    scene.add(camera);
    camera.add(root);
    root.position.set(0, 0, -1);
    root.scale.setScalar(TAN);
    return () => {
      camera.remove(root);
    };
  }, [camera, scene, root]);
  return root;
}

// A steel fork tine in side view, a blade that thins to a bevelled tip, a heel bend and the shank with its hook rising
// behind it. Blade top at y = 0, so the section it lifts starts just under it. Colours are baked by face, a lit top
// edge, a steel front face that lightens upward, a dark underside, so it reads as metal in any light.
function forkGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-1.22, 0.62);
  s.lineTo(-1.22, -0.05);
  s.quadraticCurveTo(-1.22, -0.17, -1.1, -0.17);
  s.lineTo(3.0, -0.17);
  s.lineTo(3.45, -0.12);
  s.lineTo(3.45, -0.075);
  s.lineTo(2.1, 0.0);
  s.lineTo(-0.88, 0.0);
  s.quadraticCurveTo(-0.98, 0.0, -0.98, 0.1);
  s.lineTo(-0.98, 0.54);
  s.lineTo(-1.04, 0.62);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 14 });
  g.computeVertexNormals();
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const col = new Float32Array(p.count * 3);
  const lin = (v: number) => Math.pow(v, 2.2);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const nx = n.getX(i);
    const ny = n.getY(i);
    const nz = n.getZ(i);
    let v: number;
    if (nz > 0.5) {
      // the front face, a steel grey that brightens toward the top edge, with a thin lit line right on it
      const t = THREE.MathUtils.clamp((y + 0.17) / 0.17, 0, 1);
      v = 0.3 + 0.32 * Math.pow(t, 1.5);
      if (y > -0.03 && y < 0.03) v = 0.95;
      if (y > 0.2) v = 0.42 + 0.1 * Math.sin((p.getX(i) + 1.22) * 16);
    } else if (nz < -0.5) v = 0.25;
    else if (ny > 0.5) v = 0.96;
    else if (ny < -0.5) v = 0.2;
    else v = nx > 0 ? 0.5 : 0.36;
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = lin(v);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// A hard edged cell of plain ground for a text column the world cannot give an empty patch for. Pixel box of a frame
// (x0, x1 from the left edge, the top at the top rule, down to the bottom of the frame), on the grid lines, and it wipes in
// and out by its right edge, nothing fades. R is the one beat that needs it, the yard has no bare floor under its text.
type Cell = { x: [number, number]; top: number; open: (u: number) => number };
const CELLS: Cell[] = [{ x: [0, 972], top: 136, open: (u) => ease(range(u, 4.95, 5.12)) * (1 - ease(range(u, 5.9, 6.0))) }];

export default function Overlay({ clock }: SceneProps) {
  const root = useOverlayRoot();
  const size = useThree((s) => s.size);
  const fade = useRef<THREE.Mesh>(null);
  const maskGroup = useRef<THREE.Group>(null);
  const camera = useThree((st) => st.camera);
  const maskTop = useRef<THREE.Mesh>(null);
  const forkRef = useRef<THREE.Mesh>(null);
  const curtain = useRef<THREE.Mesh>(null);
  const cells = useRef<(THREE.Mesh | null)[]>([]);
  const fork = useMemo(forkGeometry, []);
  const mixCol = useMemo(() => new THREE.Color(), []);
  const lightCol = useMemo(() => new THREE.Color(PAPER.bg), []);
  const aspect = size.width / size.height;
  // The top row is a plain band, 136px tall, ending on the top rule of the grid in a hard edge.
  const topH = 272 / size.height;

  useFrame(() => {
    const u = uOf(clock);
    // Black for the push into the forklift, a hard edged shutter. The camera has already filled the frame with the dark mast, the
    // shutter rolls up from the bottom edge and covers the frame by u 9.9, then rolls away upward as the schematic lights up.
    const lo = u < 10 ? -1.05 : lerp(-1.05, 1.05, ease(range(u, 10.0, 10.25)));
    const hi = u < 10 ? lerp(-1.05, 1.05, ease(range(u, 9.55, 9.9))) : 1.05;
    if (fade.current) {
      fade.current.visible = hi - lo > 0.002;
      fade.current.position.y = (lo + hi) / 2;
      fade.current.scale.y = Math.max(hi - lo, 0.001) / 4;
    }
    // The masks stay on the screen whatever the lens shift is, so undo the shift for them.
    const v = camera.view;
    if (maskGroup.current && v) maskGroup.current.position.set((v.offsetX / v.fullWidth) * 2 * aspect, (-v.offsetY / v.fullHeight) * 2, 0);
    // The masks take the ground of the beat. The band over the top row goes dark where the shell turns the top row's ink
    // light (scroll 7790, u 9.475) and back to light under the fork's light ground, a hard step each way.
    const mc = u >= DARK_TOP_FROM && u < 11.8 ? mixCol.set(DARK_BG) : lightCol;
    if (maskTop.current) (maskTop.current.material as THREE.MeshBasicMaterial).color.copy(mc);
    CELLS.forEach((c, i) => {
      const m = cells.current[i];
      if (!m) return;
      const o = c.open(u);
      m.visible = o > 0.001;
      // px of this frame to half heights, x from the middle, y up from the middle
      const half = size.height / 2;
      const x0 = (c.x[0] - size.width / 2) / half;
      const x1 = x0 + ((c.x[1] - c.x[0]) / half) * o;
      const y0 = (half - c.top) / half;
      const y1 = -1;
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      m.scale.set(Math.max(x1 - x0, 1e-4), y0 - y1, 1);
      (m.material as THREE.MeshBasicMaterial).color.copy(mc);
    });
    // the fork and the section it carries
    const k = u - 11;
    const lifting = u >= 11 && u < 12;
    const yEdge = lerp(-1.8, 1.35, ease(range(k, 0, 0.9)));
    if (forkRef.current) {
      forkRef.current.visible = lifting && k < 0.97;
      forkRef.current.position.set(0, yEdge, 0.02);
    }
    if (curtain.current) {
      curtain.current.visible = lifting;
      curtain.current.position.set(0, yEdge - 0.14 - 5, -0.01);
    }
  });

  return createPortal(
    <>
      <group ref={maskGroup}>
      <mesh ref={maskTop} position={[0, 1 - topH / 2, 0]} scale={[1, 1, 1]} renderOrder={10}>
        <planeGeometry args={[aspect * 2 + 0.2, topH]} />
        <meshBasicMaterial transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      {CELLS.map((_, i) => (
        <mesh key={i} ref={(m) => { cells.current[i] = m; }} visible={false} renderOrder={10}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      </group>
      <mesh ref={fade} position={[0, 0, 0]} visible={false} renderOrder={30}>
        <planeGeometry args={[aspect * 4, 4]} />
        <meshBasicMaterial color="#000000" transparent opacity={1} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* The curtain and the tine draw after every dimension label, leader and arrowhead of the servis stage, which have no
          depth test, so the dimensions go under the light ground and the steel the moment those cover them. */}
      <mesh ref={curtain} visible={false} renderOrder={20}>
        <planeGeometry args={[aspect * 5, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh ref={forkRef} geometry={fork} visible={false} scale={[1, 1, 1]} renderOrder={21}>
        <meshBasicMaterial vertexColors transparent opacity={1} toneMapped={false} />
      </mesh>
    </>,
    root,
  );
}
