// Things that live in front of the lens, in half screen heights so they fit any width. The black fade for the
// push into the forklift, the diagonal lines that make the blueprint feel like driving, and the very large fork
// that lifts the rental section into view. They sit one metre from the camera so nothing in the world hides them.
import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { C } from '../../../tokens';
import type { SceneProps } from '../../clock';
import { ease, lerp, range, smooth, uOf } from './kit';

const TAN = Math.tan((28 / 2) * (Math.PI / 180));

function useOverlayRoot() {
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

function forkGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-1.28, -0.07);
  s.lineTo(-1.16, 0.0);
  s.lineTo(-0.9, 0.0);
  s.lineTo(3.4, 0.0);
  s.lineTo(3.4, -0.17);
  s.lineTo(-0.5, -0.17);
  s.quadraticCurveTo(-1.0, -0.17, -1.22, -0.12);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 12 });
  const p = g.getAttribute('position');
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp((p.getY(i) + 0.17) / 0.17, 0, 1); // 0 bottom, 1 top
    const v = 0.34 + 0.66 * Math.pow(t, 0.8);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// A dark mask with soft edges. alpha(x, y) in half screen heights, x right and y up, drawn at 160 by 80 samples.
function maskTexture(w: number, h: number, x0: number, x1: number, y0: number, y1: number, alpha: (x: number, y: number) => number) {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 80;
  const g = c.getContext('2d')!;
  const img = g.createImageData(160, 80);
  for (let j = 0; j < 80; j++)
    for (let i = 0; i < 160; i++) {
      const x = x0 + ((i + 0.5) / 160) * (x1 - x0);
      const y = y1 - ((j + 0.5) / 80) * (y1 - y0);
      const k = (j * 160 + i) * 4;
      img.data[k] = 9;
      img.data[k + 1] = 10;
      img.data[k + 2] = 11;
      img.data[k + 3] = Math.round(255 * Math.min(1, Math.max(0, alpha(x, y))));
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  void w;
  void h;
  return t;
}

function curtainTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 190, 10, 128, 190, 200);
  grd.addColorStop(0, '#2a3235');
  grd.addColorStop(1, '#14181a');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Where the blueprint's driving lines run, as offsets across their own direction.
const STRONG = [-0.17, 0.17];
const FAINT = [-1.9, -1.45, -1.0, -0.62, 0.62, 1.0, 1.45, 1.9];
const PERIOD = 4.1;
const ANGLE = (40 * Math.PI) / 180;

export default function Overlay({ clock }: SceneProps) {
  const root = useOverlayRoot();
  const size = useThree((s) => s.size);
  const fade = useRef<THREE.Mesh>(null);
  const maskGroup = useRef<THREE.Group>(null);
  const camera = useThree((st) => st.camera);
  const maskTop = useRef<THREE.Mesh>(null);
  const maskH = useRef<THREE.Mesh>(null);
  const forkRef = useRef<THREE.Mesh>(null);
  const curtain = useRef<THREE.Mesh>(null);
  const lines = useRef<(THREE.Mesh | null)[]>([]);
  const diag = useRef<THREE.Group>(null);
  const fork = useMemo(forkGeometry, []);
  const cTex = useMemo(curtainTexture, []);
  const aspect = size.width / size.height;
  // The top 110px stays dark at every beat, easing out by 210px, so the nav always sits on plain dark.
  const topTex = useMemo(() => maskTexture(0, 0, -1, 1, 1 - 0.467, 1, (_x, y) => 1 - smooth(Math.min(1, Math.max(0, (1 - y - 0.244) / 0.223)))), []);
  // At the hero the left 55 percent from y 470 to 840 stays plain dark for the headline.
  const hTex = useMemo(
    () =>
      maskTexture(0, 0, -2.4, 0.5, -1.0, 0.2, (x, y) => {
        const ax = 1 - smooth(Math.min(1, Math.max(0, (x + 0.15) / 0.31)));
        const ay = smooth(Math.min(1, Math.max(0, (0.12 - y) / 0.16)));
        return ax * ay;
      }),
    [],
  );
  const items = useMemo(() => [...STRONG.map((o) => ({ o, w: 0.0085, a: 0.95 })), ...FAINT.map((o) => ({ o, w: 0.0032, a: 0.2 }))], []);

  useFrame(() => {
    const u = uOf(clock);
    const pos = clock.pos.current;
    // black for the push into the forklift, clear again as the blueprint lights up
    const black = u < 10 ? ease(range(u, 9.45, 9.95)) : 1 - ease(range(u, 10.0, 10.25));
    if (fade.current) {
      (fade.current.material as THREE.MeshBasicMaterial).opacity = black;
      fade.current.visible = black > 0.002;
    }
    // The masks stay on the screen whatever the lens shift is, so undo the shift for them.
    const v = camera.view;
    if (maskGroup.current && v) maskGroup.current.position.set((v.offsetX / v.fullWidth) * 2 * aspect, (-v.offsetY / v.fullHeight) * 2, 0);
    if (maskH.current) {
      const m = 1 - ease(range(u, 0.9, 1.3));
      (maskH.current.material as THREE.MeshBasicMaterial).opacity = m;
      maskH.current.visible = m > 0.003;
    }
    // driving lines, S and the first of L
    const on = u >= 10 && u < 11.9;
    if (diag.current) diag.current.visible = on;
    if (on) {
      const travel = (pos - 8000) * 0.0042;
      items.forEach((it, i) => {
        const m = lines.current[i];
        if (!m) return;
        const o = ((((it.o + travel + PERIOD / 2) % PERIOD) + PERIOD) % PERIOD) - PERIOD / 2;
        const edge = 1 - smooth(range(Math.abs(o), PERIOD / 2 - 0.5, PERIOD / 2));
        const show = ease(range(u, 10.05, 10.4)) * (1 - smooth(range(u, 11.3, 11.75)));
        (m.material as THREE.MeshBasicMaterial).opacity = it.a * edge * show;
        m.position.set(-Math.sin(ANGLE) * o, Math.cos(ANGLE) * o, 0);
      });
    }
    // the fork and the section it carries
    const k = u - 11;
    const lifting = u >= 11 && u < 12;
    const yEdge = lerp(-1.25, 1.35, ease(range(k, 0, 0.9)));
    if (forkRef.current) {
      forkRef.current.visible = lifting && k < 0.97;
      forkRef.current.position.set(0, yEdge, 0.02);
    }
    if (curtain.current) {
      curtain.current.visible = lifting;
      curtain.current.position.set(0, yEdge - 0.14 - 5, -0.01);
      (curtain.current.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(range(k, 0.93, 1));
    }
  });

  return createPortal(
    <>
      <group ref={maskGroup}>
      <mesh ref={maskTop} position={[0, 1 - 0.2335, 0.52]} scale={[1, 1, 1]}>
        <planeGeometry args={[aspect * 2 + 0.2, 0.467]} />
        <meshBasicMaterial map={topTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={maskH} position={[(-2.4 + 0.5) / 2 - 0.0, (-1.0 + 0.2) / 2, 0.5]}>
        <planeGeometry args={[2.9, 1.2]} />
        <meshBasicMaterial map={hTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      </group>
      <mesh ref={fade} position={[0, 0, 0.55]} visible={false}>
        <planeGeometry args={[aspect * 4, 4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={diag} visible={false}>
        {items.map((it, i) => (
          <mesh key={i} ref={(m) => { lines.current[i] = m; }} rotation={[0, 0, ANGLE]}>
            <planeGeometry args={[9, it.w]} />
            <meshBasicMaterial color={C.white} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh ref={curtain} visible={false}>
        <planeGeometry args={[aspect * 5, 10]} />
        <meshBasicMaterial map={cTex} transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh ref={forkRef} geometry={fork} visible={false} scale={[1, 1, 1]}>
        <meshStandardMaterial vertexColors color="#b9c4c8" roughness={0.4} metalness={0.75} />
      </mesh>
    </>,
    root,
  );
}
