// Things that live in front of the lens, in half screen heights so they fit any width. The black shutter for the
// push into the forklift, the plain band over the top row (hard edged on the top rule, nothing feathers into the scene
// anywhere), and the very large steel fork tine that lifts the rental section into view. Each beat's text sits on an
// empty part of the world itself, framed by the camera, never on a painted out ground.
// They sit one metre from the camera so nothing in the world hides them.
import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from '../../clock';
import { DARK_BG, PAPER, ease, lerp, range, rng, uOf } from './kit';
import { darkTopAt } from './darkTop';
import { BACK_FROM, BACK_TO, NEAR, forkX } from './forkTip';
import { gridXs } from '../../shell/Grid';

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

// A steel fork tine in side view, built like a real hook mount fork. A forged blade that thins to a bevelled tip, a wide
// heel bend, the shank, the top hook plate that hangs on the carriage bar with its locking pin and pull ring, and the
// bottom hook. Blade top at y = 0, so the section it lifts starts just under it. Every edge carries a 45 degree chamfer.
// Shading is baked per face from one key light up and to the left, so the chamfers catch a bright line on top and fall
// dark underneath, and a brushed grain runs along the blade and up the shank. It reads as steel on the dark stage and on
// the light ground alike, with no light in the scene.
const KEY = new THREE.Vector3(-0.35, 0.75, 0.55).normalize();
const HALF = KEY.clone().add(new THREE.Vector3(0, 0, 1)).normalize();
const SHANK_X = -0.98;

function bakeSteel(g: THREE.BufferGeometry) {
  g.computeVertexNormals();
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const col = new Float32Array(p.count * 3);
  const uv = new Float32Array(p.count * 2);
  const nv = new THREE.Vector3();
  const lin = (v: number) => Math.pow(v, 2.2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    nv.set(n.getX(i), n.getY(i), n.getZ(i));
    const shank = x < SHANK_X + 0.001 && y > 0.07;
    let v = 0.2 + 0.55 * Math.max(0, nv.dot(KEY)) + 0.45 * Math.pow(Math.max(0, nv.dot(HALF)), 12);
    if (nv.z > 0.95) {
      // the flat front face, a soft reflected sky band near the top of the blade and down the light side of the shank
      if (shank) v = 0.5 + 0.24 * THREE.MathUtils.smoothstep(x, -1.22, -1.06) - 0.1 * THREE.MathUtils.smoothstep(x, -1.06, SHANK_X);
      else {
        const t = THREE.MathUtils.clamp((y + 0.17) / 0.17, 0, 1);
        v = 0.46 + 0.2 * t + 0.2 * Math.exp(-Math.pow((t - 0.72) / 0.12, 2));
      }
    }
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = lin(Math.min(v, 0.97));
    // the grain runs along the blade and up the shank, the way the forging is ground
    uv[i * 2] = shank ? y * 0.5 : x * 0.25;
    uv[i * 2 + 1] = shank ? x * 2.4 : y * 2.4;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

const CHAMFER = { bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: 16 };

function forkGeometry() {
  const s = new THREE.Shape();
  // the underside of the blade, the tip, then the top of the blade back to the heel
  s.moveTo(3.0, -0.17);
  s.lineTo(3.45, -0.125);
  s.lineTo(3.45, -0.085);
  s.lineTo(2.1, 0.0);
  s.lineTo(-0.91, 0.0);
  // the inside of the heel bend, then the shank's front edge up to the top hook
  s.quadraticCurveTo(SHANK_X, 0.0, SHANK_X, 0.07);
  s.lineTo(SHANK_X, 0.6);
  s.lineTo(-1.02, 0.66);
  // the top hook plate, wider than the shank, with its lip coming down behind the carriage bar
  s.lineTo(-1.37, 0.66);
  s.lineTo(-1.41, 0.62);
  s.lineTo(-1.41, 0.46);
  s.lineTo(-1.38, 0.43);
  s.lineTo(-1.34, 0.43);
  s.lineTo(-1.34, 0.5);
  s.lineTo(-1.22, 0.5);
  // the shank's back edge down to the bottom hook, its claw turned up under the lower bar
  s.lineTo(-1.22, 0.25);
  s.lineTo(-1.3, 0.25);
  s.lineTo(-1.3, 0.31);
  s.lineTo(-1.36, 0.31);
  s.lineTo(-1.36, 0.19);
  s.lineTo(-1.32, 0.16);
  s.lineTo(-1.22, 0.16);
  // the outside of the heel bend, a wide forged radius
  s.lineTo(-1.22, 0.1);
  s.quadraticCurveTo(-1.22, -0.17, -0.95, -0.17);
  s.closePath();
  return bakeSteel(new THREE.ExtrudeGeometry(s, { depth: 0.12, ...CHAMFER }));
}

// The locking pin housing on top of the hook plate and the pull ring that frees it.
function pinGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-1.33, 0.66);
  s.lineTo(-1.33, 0.695);
  s.lineTo(-1.315, 0.705);
  s.lineTo(-1.255, 0.705);
  s.lineTo(-1.24, 0.695);
  s.lineTo(-1.24, 0.66);
  s.closePath();
  const box = new THREE.ExtrudeGeometry(s, { depth: 0.08, ...CHAMFER, bevelSize: 0.006, bevelThickness: 0.006 });
  box.translate(0, 0, 0.02);
  return bakeSteel(box);
}
function ringGeometry() {
  const g = new THREE.TorusGeometry(0.026, 0.0075, 8, 28);
  g.translate(-1.285, 0.738, 0.07);
  return bakeSteel(g.toNonIndexed());
}

// The brushed grain, fine streaks of slightly different greys with a few long scratches, drawn once into a canvas, no
// download.
function brushedTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  const r = rng(53);
  for (let y = 0; y < 256; y++) {
    const v = 236 + Math.floor(r() * 20);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 70; i++) {
    const v = r() < 0.5 ? 255 : 214;
    g.fillStyle = `rgba(${v},${v},${v},0.55)`;
    g.fillRect(Math.floor(r() * 512), Math.floor(r() * 256), 40 + Math.floor(r() * 220), 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// The fork's tag on the shank, a small riveted steel plate with struck rule lines and no figures, since the site carries no
// numbers beyond the company's own claims (README, settled 2026-10-12 for the lift branch's question).
function tagTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 192;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c4c4c4';
  g.fillRect(0, 0, 128, 192);
  g.strokeStyle = '#8a8a8a';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 125, 189);
  const rivet = (x: number, y: number) => {
    g.fillStyle = '#e9e9e9';
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#7a7a7a';
    g.beginPath();
    g.arc(x + 1.5, y + 1.5, 6, 0, Math.PI);
    g.fill();
  };
  rivet(64, 16);
  rivet(64, 176);
  // three struck rules, the lower edge of each catches the light and the groove sits in shadow
  for (const y of [56, 92, 128]) {
    g.fillStyle = '#ececec';
    g.fillRect(30, y + 1.5, 68, 3);
    g.fillStyle = '#6b6b6b';
    g.fillRect(30, y, 68, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// A hard edged cell of plain ground for a text column the world cannot give an empty patch for. Pixel box of a frame
// (x0, x1 from the left edge, the top at the top rule, down to the bottom of the frame), on the grid lines, and it wipes in
// and out by its right edge, nothing fades. R is the one beat that needs it, the yard has no bare floor under its text.
type Cell = { x: [number, number]; top: number; open: (u: number) => number };
// x[0] is the left edge in pixels. The right edge is the centre grid line of the stage at any width (gridXs in Grid.tsx), so the
// cut sits on a drawn line at 2560 as at 1920 (round 4 item 9, it stopped at 972 whatever the width).
const CELLS: Cell[] = [{ x: [0, 0], top: 136, open: (u) => ease(range(u, 4.95, 5.12)) * (1 - ease(range(u, 5.9, 6.0))) }];

export default function Overlay({ clock }: SceneProps) {
  const root = useOverlayRoot();
  const size = useThree((s) => s.size);
  const fade = useRef<THREE.Mesh>(null);
  const maskGroup = useRef<THREE.Group>(null);
  const camera = useThree((st) => st.camera);
  const maskTop = useRef<THREE.Mesh>(null);
  const forkRef = useRef<THREE.Group>(null);
  const curtain = useRef<THREE.Mesh>(null);
  const cells = useRef<(THREE.Mesh | null)[]>([]);
  const fork = useMemo(forkGeometry, []);
  const pin = useMemo(pinGeometry, []);
  const ring = useMemo(ringGeometry, []);
  const steel = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, map: brushedTexture(), transparent: true, toneMapped: false }), []);
  const tag = useMemo(() => new THREE.MeshBasicMaterial({ map: tagTexture(), transparent: true, toneMapped: false }), []);
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
    // The masks take the ground of the beat. The band over the top row goes dark on the same story pixels the shell turns
    // the top row's ink light, from the one span in darkTop.ts, and back to light under the fork's light ground, a hard step each way.
    const mc = darkTopAt(clock.pos.current) ? mixCol.set(DARK_BG) : lightCol;
    if (maskTop.current) (maskTop.current.material as THREE.MeshBasicMaterial).color.copy(mc);
    CELLS.forEach((c, i) => {
      const m = cells.current[i];
      if (!m) return;
      const o = c.open(u);
      m.visible = o > 0.001;
      // px of this frame to half heights, x from the middle, y up from the middle
      const half = size.height / 2;
      const x0 = (c.x[0] - size.width / 2) / half;
      const right = gridXs(size.width)[2];
      const x1 = x0 + ((right - c.x[0]) / half) * o;
      const y0 = (half - c.top) / half;
      const y1 = -1;
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      m.scale.set(Math.max(x1 - x0, 1e-4), y0 - y1, 1);
      (m.material as THREE.MeshBasicMaterial).color.copy(mc);
    });
    // The fork and the section it carries, moved the way a forklift sets a load down. The tine rises from under the frame
    // with the light section's top edge flush on its blade, and docks with the blade's top face on the top rule at k 0.5,
    // under the top row, which draws over the steel so the nav and the logo are never covered. It then lowers 8px so
    // the section rests on the rule, and backs out to the left until its tip leaves the frame by k 0.9. The hook plate's
    // back edge rides on the outer grid line until it backs out. Where it is comes from forkTip.ts, which the shell reads too,
    // so Najam's page is cut at the very same tip.
    const k = u - 11;
    const ox = v ? (v.offsetX / v.fullWidth) * 2 * aspect : 0;
    const oy = v ? (-v.offsetY / v.fullHeight) * 2 : 0;
    const rule = 1 - topH;
    // the steel's front face sits 0.15 nearer the lens than the masks, so its screen x and y grow by 1 / (1 - 0.15 TAN),
    // and y is scaled back the same way so the blade's top face lands on the rule and not 16px into the top row
    const near = NEAR;
    // the blade top less its chamfer, so the steel's outer edge and not the shape's line meets the rule
    const dock = rule - CHAMFER.bevelSize / near;
    const settle = 16 / size.height;
    const yEdge = k < 0.5 ? lerp(-1.8, dock, ease(range(k, 0, 0.5))) : dock - settle * ease(range(k, 0.5, 0.56));
    if (forkRef.current) {
      forkRef.current.visible = u >= 11 && k < 0.9;
      forkRef.current.position.set(forkX(k, size.width, size.height) + ox * near, (yEdge + oy) * near, 0.02);
    }
    // The light ground the tine lifted. Once the tine backs out its right edge is cut at the blade's tip, so Najam's world comes
    // in behind the tip and the frame is never one plain page. It sits 0.01 behind the masks, so its x is scaled out by as much.
    if (curtain.current) {
      const left = -aspect - 0.5;
      const right = k < BACK_FROM ? aspect + 0.5 : ((forkX(k, size.width, size.height) + 3.462) / near) * (1 + 0.01 * TAN);
      curtain.current.visible = u >= 11 && k < BACK_TO + 0.02 && right > left;
      curtain.current.scale.x = Math.max(right - left, 1e-4);
      curtain.current.position.set(ox + (left + right) / 2, (k < 0.5 ? yEdge + rule - dock : rule) - 5 + oy, -0.01);
    }
  });

  return createPortal(
    <>
      <group ref={maskGroup}>
      {/* The band over the top row draws after the fork and the curtain, so no steel ever crosses into the top row. */}
      <mesh ref={maskTop} position={[0, 1 - topH / 2, 0]} scale={[1, 1, 1]} renderOrder={25}>
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
        <planeGeometry args={[1, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} toneMapped={false} />
      </mesh>
      <group ref={forkRef} visible={false}>
        <mesh geometry={fork} material={steel} renderOrder={21} />
        <mesh geometry={pin} material={steel} renderOrder={21} />
        <mesh geometry={ring} material={steel} renderOrder={21} />
        <mesh position={[-1.1, 0.36, 0.134]} material={tag} renderOrder={22}>
          <planeGeometry args={[0.15, 0.225]} />
        </mesh>
      </group>
    </>,
    root,
  );
}
