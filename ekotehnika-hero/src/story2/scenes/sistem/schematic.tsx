// The servis stage. The X50 as a technical drawing, an orthographic side elevation on a dark ground. Silhouette and
// key edges only, 2px outline and 1px detail, built as 2D line geometry (fat lines, so the widths are real) from the
// projected outline of the real model, see x50Elevation.ts. Dashed centre lines through the axles and the mast,
// dimension lines with arrowheads and the X50 / 600 figures from the Linde data sheet DS_X35_X50_1254, a fine 24px
// measuring grid at 8 percent behind. Wheels turn with the story clock. No glow, no red, one info colour, LMH turquoise
// 72 percent, for the dimension lines. Everything is laid out in design pixels of a 1440 by 900 frame and anchored to the
// right edge, so the picture holds its place at other sizes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { SceneProps } from '../../clock';
import { X50 } from './x50Elevation';
import { useOverlayRoot } from './overlay';
import { ease, range, uOf } from './kit';

const TURQUOISE = '#7fbccd'; // LMH turquoise at 72 percent
const S = 0.2057; // design px per mm, 4376 mm of truck across 900 px
const X0 = 1063; // design x of the front axle
const GY = 696; // design y of the ground, on a grid line
const px = (X: number) => X0 + X * S;
const py = (Y: number) => GY - Y * S;
type Pt = [number, number];

// ---- builders -----------------------------------------------------------------------------------------------

class Lines {
  a: number[] = [];
  seg(x1: number, y1: number, x2: number, y2: number) {
    this.a.push(x1, -y1, 0, x2, -y2, 0);
  }
  poly(pts: Pt[], close = false) {
    for (let i = 0; i < pts.length - 1; i++) this.seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (close) this.seg(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]);
  }
  mm(flat: readonly number[]) {
    const pts: Pt[] = [];
    for (let i = 0; i < flat.length; i += 2) pts.push([px(flat[i]), py(flat[i + 1])]);
    this.poly(pts);
  }
  circle(cx: number, cy: number, r: number, n = 96) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = ((i + 1) / n) * Math.PI * 2;
      this.seg(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(b) * r, cy + Math.sin(b) * r);
    }
  }
  // A dash and dot centre line, long dash, gap, dot, gap.
  dashdot(x1: number, y1: number, x2: number, y2: number) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const pat = [14, 4, 3, 4];
    let t = 0;
    let i = 0;
    while (t < len) {
      const l = Math.min(pat[i % 4], len - t);
      if (i % 2 === 0) this.seg(x1 + ux * t, y1 + uy * t, x1 + ux * (t + l), y1 + uy * (t + l));
      t += pat[i % 4];
      i++;
    }
  }
}

type Arrow = [number, number, number]; // tip x, tip y, direction angle of the shaft in design px
type Label = { text: string; x: number; y: number; anchor: 'c' | 'l' | 'r' };

const FIG = {
  l1: '4373', // overall length, 4.19
  l2: '3173', // length including fork backs, 4.20
  y: '2120', // wheel base, 1.9
  h1: '2523', // height of mast, lowered, 4.2
  h6: '2495', // height above overhead guard, 4.7
  c: '600', // load centre distance, 1.6
  q: '4990', // load capacity in kg, 1.5, X50 / 600
};

function build() {
  const outline = new Lines();
  const detail = new Lines();
  const centre = new Lines();
  const dim = new Lines();
  const ground = new Lines();
  const arrows: Arrow[] = [];
  const labels: Label[] = [];

  // outline, the projected silhouette, and the tyres
  X50.silhouette.forEach((r) => outline.mm(r));
  const w = X50.wheels;
  [w.front, w.rear].forEach(([cx, cy, R]) => outline.circle(px(cx), py(cy), R * S, 120));
  // key edges, the parts of the model each merged into one outline
  [...X50.red, ...X50.grey, ...X50.mast, ...X50.carriage, ...X50.black].forEach((r) => detail.mm(r));
  X50.openings.forEach((r) => detail.mm(r));
  // the wheels, bead, rim, hub (static), lugs, webs and treads turn separately
  [w.front, w.rear].forEach(([cx, cy, R, r]) => {
    detail.circle(px(cx), py(cy), R * S * 0.8, 96);
    detail.circle(px(cx), py(cy), r * S, 72);
    detail.circle(px(cx), py(cy), r * S * 0.3, 40);
  });

  // ground line with hatching below it
  ground.seg(528, GY, 1432, GY);
  for (let x = 528; x < 1432; x += 12) ground.seg(x, GY, x - 8, GY + 8);

  // centre lines through the axles and the mast, and the wheel centres
  const top = py(2512) - 26;
  const bottom = GY + 30;
  [0, -2121].forEach((X) => centre.dashdot(px(X), top, px(X), bottom));
  const mastX = -172;
  centre.dashdot(px(mastX), top, px(mastX), bottom);
  [w.front, w.rear].forEach(([cx, cy, R]) => centre.dashdot(px(cx) - R * S - 24, py(cy), px(cx) + R * S + 24, py(cy)));

  // dimension helpers
  const hDim = (x1: number, x2: number, y: number, text: string, from: [number, number]) => {
    dim.seg(x1, from[0], x1, y + 8);
    dim.seg(x2, from[1], x2, y + 8);
    const tw = text.length * 9.2 + 14;
    const mid = (x1 + x2) / 2;
    dim.seg(x1, y, mid - tw / 2, y);
    dim.seg(mid + tw / 2, y, x2, y);
    arrows.push([x1, y, 0], [x2, y, Math.PI]);
    labels.push({ text, x: mid, y, anchor: 'c' });
  };
  const vDim = (x: number, y1: number, y2: number, text: string, from: [number, number], at = 0.5) => {
    dim.seg(from[0], y1, x + 8, y1);
    dim.seg(from[1], y2, x + 8, y2);
    const mid = y1 + (y2 - y1) * at;
    dim.seg(x, y1, x, mid - 12);
    dim.seg(x, mid + 12, x, y2);
    arrows.push([x, y1, -Math.PI / 2], [x, y2, Math.PI / 2]);
    labels.push({ text, x: x - 10, y: mid, anchor: 'r' });
  };
  const xr = X50.bounds[0];
  const xt = X50.bounds[2];
  // below, wheel base, length to the fork backs, overall length
  hDim(px(-2121), px(0), 744, `Y ${FIG.y}`, [py(381) + 18, py(414) + 18]);
  hDim(px(xr), px(xt - 1200), 768, `L2 ${FIG.l2}`, [GY + 6, GY + 6]);
  hDim(px(xr), px(xt), 792, `L1 ${FIG.l1}`, [GY + 6, GY + 6]);
  // right, mast lowered and the overhead guard, drawn from the ground
  const guardTop = py(X50.bounds[3]);
  const mastTop = py(2461);
  vDim(1360, GY, guardTop, `H6 ${FIG.h6}`, [px(160) + 8, px(160) + 8], 0.62);
  vDim(1296, GY, mastTop, `H1 ${FIG.h1}`, [px(423) + 8, px(423) + 8], 0.4);
  // the load centre on the forks
  const face = px(xt - 1200);
  const cx = px(xt - 1200 + 600);
  const cy = 556;
  dim.seg(face, py(110), face, cy + 8);
  dim.seg(cx, py(110), cx, cy + 8);
  const tw = (`C ${FIG.c}`.length * 9.2) + 14;
  dim.seg(face, cy, (face + cx) / 2 - tw / 2, cy);
  dim.seg((face + cx) / 2 + tw / 2, cy, cx, cy);
  arrows.push([face, cy, 0], [cx, cy, Math.PI]);
  labels.push({ text: `C ${FIG.c}`, x: (face + cx) / 2, y: cy, anchor: 'c' });
  labels.push({ text: `Q ${FIG.q} KG`, x: (face + cx) / 2, y: cy - 24, anchor: 'c' });
  // the load centre mark, a small cross and a ring on the forks
  dim.seg(cx - 8, py(110) - 4, cx + 8, py(110) - 4);
  dim.circle(cx, py(110) - 4, 4, 20);

  // the measuring grid, 24 px, fading towards the text column on the left and the bottom
  const grid: number[] = [];
  const gc: number[] = [];
  const fade = (x: number, y: number) => Math.min(1, Math.max(0, (x - 528) / 96)) * Math.min(1, Math.max(0, (840 - y) / 60)) * Math.min(1, Math.max(0, (y - 156) / 48));
  const addG = (x1: number, y1: number, x2: number, y2: number) => {
    grid.push(x1, -y1, 0, x2, -y2, 0);
    const a = fade(x1, y1);
    const b = fade(x2, y2);
    gc.push(a, a, a, b, b, b);
  };
  for (let x = 528; x <= 1440; x += 24) for (let y = 144; y < 840; y += 24) addG(x, y, x, y + 24);
  for (let y = 144; y <= 840; y += 24) for (let x = 528; x < 1440; x += 24) addG(x, y, x + 24, y);

  // rotating wheel parts, in each wheel's own frame
  const wheelParts = [w.front, w.rear].map(([, , R, r]) => {
    const l = new Lines();
    const Rp = R * S;
    const rp = r * S;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      l.seg(Math.cos(a) * Rp * 0.9, Math.sin(a) * Rp * 0.9, Math.cos(a) * Rp, Math.sin(a) * Rp);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      l.circle(Math.cos(a) * rp * 0.62, Math.sin(a) * rp * 0.62, rp * 0.075, 14);
      l.seg(Math.cos(a + 0.63) * rp * 0.36, Math.sin(a + 0.63) * rp * 0.36, Math.cos(a + 0.63) * rp * 0.88, Math.sin(a + 0.63) * rp * 0.88);
    }
    return l.a;
  });

  return { outline: outline.a, detail: detail.a, centre: centre.a, dim: dim.a, ground: ground.a, arrows, labels, grid, gc, wheelParts };
}

// ---- labels -------------------------------------------------------------------------------------------------

const FONT = '500 14px "Daxline Pro", Arial, sans-serif';
function labelTexture(text: string) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = FONT;
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.1px';
  const w = Math.ceil(g.measureText(text).width) + 4;
  const h = 20;
  c.width = w * 2;
  c.height = h * 2;
  g.scale(2, 2);
  g.font = FONT;
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.1px';
  g.fillStyle = TURQUOISE;
  g.textBaseline = 'middle';
  g.fillText(text, 2, h / 2 + 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { t, w, h };
}

const lineMat = (color: string, width: number, opacity = 1) => new LineMaterial({ color: new THREE.Color(color).getHex(), linewidth: width, transparent: true, opacity, toneMapped: false, depthWrite: false });
const seg2 = (pts: number[], mat: LineMaterial) => {
  const g = new LineSegmentsGeometry();
  g.setPositions(new Float32Array(pts));
  const l = new LineSegments2(g, mat);
  l.frustumCulled = false;
  return l;
};

export default function Schematic({ clock }: SceneProps) {
  const root = useOverlayRoot();
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const [fontsReady, setFontsReady] = useState(0);
  const data = useMemo(build, []);
  const mats = useMemo(
    () => ({
      outline: lineMat('#ffffff', 2, 1),
      detail: lineMat('#ffffff', 1, 0.8),
      centre: lineMat('#ffffff', 1, 0.5),
      dim: lineMat(TURQUOISE, 1, 1),
      ground: lineMat('#ffffff', 1, 0.55),
    }),
    [],
  );
  const objs = useMemo(
    () => ({
      outline: seg2(data.outline, mats.outline),
      detail: seg2(data.detail, mats.detail),
      centre: seg2(data.centre, mats.centre),
      dim: seg2(data.dim, mats.dim),
      ground: seg2(data.ground, mats.ground),
      wheels: data.wheelParts.map((p) => seg2(p, mats.detail)),
    }),
    [data, mats],
  );
  const gridGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(data.grid, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(data.gc, 3));
    return g;
  }, [data]);
  const gridMat = useMemo(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.08, toneMapped: false, depthWrite: false }), []);
  const arrowGeo = useMemo(() => {
    const p: number[] = [];
    data.arrows.forEach(([x, y, a]) => {
      const L = 11;
      const Wd = 3.6;
      const bx = x + Math.cos(a) * L;
      const by = y + Math.sin(a) * L;
      const nx = -Math.sin(a) * Wd;
      const ny = Math.cos(a) * Wd;
      p.push(x, -y, 0, bx + nx, -(by + ny), 0, bx - nx, -(by - ny), 0);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [data]);
  const arrowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: TURQUOISE, side: THREE.DoubleSide, transparent: true, toneMapped: false, depthWrite: false }), []);
  const labels = useMemo(
    () =>
      data.labels.map((l) => {
        const { t, w, h } = labelTexture(l.text);
        const x = l.anchor === 'c' ? l.x : l.anchor === 'l' ? l.x + w / 2 : l.x - w / 2;
        return { t, w, h, x, y: l.y };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, fontsReady],
  );
  const labelMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const wheelGroups = useRef<(THREE.Group | null)[]>([]);
  const grp = useRef<THREE.Group>(null);
  const [fw, fh] = [size.width, size.height];

  useEffect(() => {
    let live = true;
    document.fonts?.load(FONT).then(() => {
      if (live) {
        setFontsReady((n) => n + 1);
        invalidate();
      }
    });
    return () => {
      live = false;
    };
  }, [invalidate]);

  useEffect(() => {
    const f = fh / 900;
    Object.values(mats).forEach((m) => m.resolution.set(fw * dpr, fh * dpr));
    mats.outline.linewidth = 2 * f * dpr;
    mats.detail.linewidth = Math.max(1, f) * dpr;
    mats.centre.linewidth = Math.max(1, f) * dpr;
    mats.dim.linewidth = Math.max(1, f) * dpr;
    mats.ground.linewidth = Math.max(1, f) * dpr;
  }, [mats, fw, fh, dpr]);

  const WHEEL = [X50.wheels.front, X50.wheels.rear];
  const total = data.outline.length / 6;

  useFrame(() => {
    const u = uOf(clock);
    const pos = clock.pos.current;
    const g = grp.current;
    if (!g) return;
    const show = u >= 9.95 && u < 12.0;
    g.visible = show;
    if (!show) return;
    const f = fh / 900;
    g.scale.setScalar(1 / 450);
    g.position.set((fw / 2 - f * 1440) / (fh / 2), 1, -0.004);
    const lineIn = ease(range(u, 10.05, 10.4));
    const draw = ease(range(u, 10.1, 10.62));
    const det = ease(range(u, 10.45, 10.78));
    const dims = ease(range(u, 10.62, 10.95));
    gridMat.opacity = 0.08 * ease(range(u, 10.0, 10.35));
    mats.ground.opacity = 0.55 * lineIn;
    mats.centre.opacity = 0.5 * lineIn;
    mats.outline.opacity = Math.min(1, draw * 4);
    (objs.outline.geometry as LineSegmentsGeometry & { instanceCount: number }).instanceCount = Math.max(0, Math.floor(total * draw));
    mats.detail.opacity = 0.8 * det;
    mats.dim.opacity = dims;
    arrowMat.opacity = dims;
    labelMat.current.forEach((m) => m && (m.opacity = dims));
    const roll = (pos - 8000) * 0.011;
    wheelGroups.current.forEach((wg, i) => {
      if (wg) wg.rotation.z = -roll / (WHEEL[i][2] / 1000);
    });
  });

  return createPortal(
    <group ref={grp} visible={false} renderOrder={-2}>
      <lineSegments geometry={gridGeo} material={gridMat} renderOrder={-3} />
      <primitive object={objs.ground} />
      <primitive object={objs.centre} />
      <primitive object={objs.detail} />
      <primitive object={objs.outline} />
      {WHEEL.map(([cx, cy], i) => (
        <group key={i} renderOrder={-2} position={[px(cx), -py(cy), 0]} ref={(el) => { wheelGroups.current[i] = el; }}>
          <primitive object={objs.wheels[i]} />
        </group>
      ))}
      <primitive object={objs.dim} />
      <mesh geometry={arrowGeo} material={arrowMat} />
      {labels.map((l, i) => (
        <mesh key={`${i}${fontsReady}`} position={[l.x, -l.y, 0.01]}>
          <planeGeometry args={[l.w, l.h]} />
          <meshBasicMaterial ref={(m) => { if (m) labelMat.current[i] = m; }} map={l.t} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>,
    root,
  );
}
