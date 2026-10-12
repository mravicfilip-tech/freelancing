// Things that live in front of the lens, in half screen heights so they fit any width. The black fade for the
// push into the forklift, the plain ground masks that keep the text columns clear (the top 150px at every beat, the
// hero headline, the R text column), and the very large steel fork tine that lifts the rental section into view.
// They sit one metre from the camera so nothing in the world hides them.
import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from '../../clock';
import { DARK_BG, PAPER, ease, isDark, lerp, range, smooth, uOf } from './kit';

const TAN = Math.tan((28 / 2) * (Math.PI / 180));

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
      img.data[k] = 255;
      img.data[k + 1] = 255;
      img.data[k + 2] = 255;
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
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(1, '#f3f3f3');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Plain ground the text columns need, as rectangles in design pixels of a 1440 by 900 frame. Each fades its soft sides over
// `feather` px (left, top, right, bottom) and is on for a stretch of the story, drawn in the ground colour of the beat.
type Rect = { rect: [number, number, number, number]; feather: [number, number, number, number]; on: (u: number) => number };
const win = (u: number, a: number, b: number, c: number, d: number) => ease(range(u, a, b)) * (1 - ease(range(u, c, d)));
const RECTS: Rect[] = [
  // H, the headline column
  { rect: [0, 150, 760, 820], feather: [0, 0, 110, 70], on: (u) => 1 - ease(range(u, 0.9, 1.3)) },
  // C1, the title and lede
  { rect: [0, 140, 720, 460], feather: [0, 0, 70, 60], on: (u) => win(u, 1.75, 2.0, 2.8, 3.05) },
  // R, the text column
  { rect: [0, 0, 520, 900], feather: [0, 0, 90, 0], on: (u) => win(u, 4.9, 5.1, 5.9, 6.0) },
  // N, the title, lede and spec row across the top
  { rect: [0, 0, 1440, 540], feather: [0, 0, 0, 40], on: (u) => win(u, 11.9, 12.0, 12.95, 13.2) },
  // AT, the text block and spec row
  { rect: [0, 0, 1100, 360], feather: [0, 0, 80, 50], on: (u) => ease(range(u, 13.7, 13.95)) },
];
const expand = (r: Rect): [number, number, number, number] => [r.rect[0] - r.feather[0], r.rect[1] - r.feather[1], r.rect[2] + r.feather[2], r.rect[3] + r.feather[3]];
function rectMask(r: Rect) {
  const [x0, y0, x1, y1] = expand(r);
  const W = 256;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const ramp = (p: number, lo: number, hi: number, f: number, first: boolean) => (f <= 0 ? 1 : first ? smooth(Math.min(1, Math.max(0, (p - lo) / f))) : smooth(Math.min(1, Math.max(0, (hi - p) / f))));
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const x = x0 + ((i + 0.5) / W) * (x1 - x0);
      const y = y0 + ((j + 0.5) / H) * (y1 - y0);
      const a = ramp(x, x0, x1, r.feather[0], true) * ramp(y, y0, y1, r.feather[1], true) * ramp(x, x0, x1, r.feather[2], false) * ramp(y, y0, y1, r.feather[3], false);
      const k = (j * W + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(255 * a);
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function Overlay({ clock }: SceneProps) {
  const root = useOverlayRoot();
  const size = useThree((s) => s.size);
  const fade = useRef<THREE.Mesh>(null);
  const maskGroup = useRef<THREE.Group>(null);
  const camera = useThree((st) => st.camera);
  const maskTop = useRef<THREE.Mesh>(null);
  const forkRef = useRef<THREE.Mesh>(null);
  const curtain = useRef<THREE.Mesh>(null);
  const rects = useRef<(THREE.Mesh | null)[]>([]);
  const fork = useMemo(forkGeometry, []);
  const cTex = useMemo(curtainTexture, []);
  const mixCol = useMemo(() => new THREE.Color(), []);
  const lightCol = useMemo(() => new THREE.Color(PAPER.bg), []);
  const aspect = size.width / size.height;
  // The top 150px stays plain at every beat, easing out by 250px, so the nav always sits on plain dark.
  const topTex = useMemo(() => maskTexture(0, 0, -1, 1, 1 - 0.556, 1, (_x, y) => 1 - smooth(Math.min(1, Math.max(0, (1 - y - 0.333) / 0.223)))), []);
  const rectTex = useMemo(() => RECTS.map((r) => rectMask(r)), []);

  useFrame(() => {
    const u = uOf(clock);
    // black for the push into the forklift, fully black by pos 7790 (u 9.475), clear again as the schematic lights up
    const black = u < 10 ? ease(range(u, 9.12, 9.47)) : 1 - ease(range(u, 10.0, 10.25));
    if (fade.current) {
      (fade.current.material as THREE.MeshBasicMaterial).opacity = black;
      fade.current.visible = black > 0.002;
    }
    // The masks stay on the screen whatever the lens shift is, so undo the shift for them.
    const v = camera.view;
    if (maskGroup.current && v) maskGroup.current.position.set((v.offsetX / v.fullWidth) * 2 * aspect, (-v.offsetY / v.fullHeight) * 2, 0);
    // The masks take the ground of the beat, light everywhere but the servis blueprint.
    const mc = isDark(u) ? mixCol.set(DARK_BG).lerp(lightCol, ease(range(u, 11.7, 11.8))) : lightCol;
    if (maskTop.current) (maskTop.current.material as THREE.MeshBasicMaterial).color.copy(mc);
    RECTS.forEach((r, i) => {
      const m = rects.current[i];
      if (!m) return;
      const a = r.on(u);
      (m.material as THREE.MeshBasicMaterial).color.copy(mc);
      (m.material as THREE.MeshBasicMaterial).opacity = a;
      m.visible = a > 0.003;
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
      (curtain.current.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(range(k, 0.93, 1));
    }
  });

  return createPortal(
    <>
      <group ref={maskGroup}>
      <mesh ref={maskTop} position={[0, 1 - 0.278, 0.52]} scale={[1, 1, 1]}>
        <planeGeometry args={[aspect * 2 + 0.2, 0.556]} />
        <meshBasicMaterial map={topTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {RECTS.map((r, i) => {
        const [x0, y0, x1, y1] = expand(r);
        return (
          <mesh key={i} ref={(m) => { rects.current[i] = m; }} position={[((x0 + x1) / 2 - 720) / 450, (450 - (y0 + y1) / 2) / 450, 0.5 + i * 0.001]} visible={false}>
            <planeGeometry args={[(x1 - x0) / 450, (y1 - y0) / 450]} />
            <meshBasicMaterial map={rectTex[i]} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
      </group>
      <mesh ref={fade} position={[0, 0, 0.55]} visible={false}>
        <planeGeometry args={[aspect * 4, 4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={curtain} visible={false}>
        <planeGeometry args={[aspect * 5, 10]} />
        <meshBasicMaterial map={cTex} transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh ref={forkRef} geometry={fork} visible={false} scale={[1, 1, 1]}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
    </>,
    root,
  );
}
