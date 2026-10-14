// The schematic half of hero 6. The same geometry as the render, drawn as white hairlines for
// every edge, the hidden ones fainter, with dots for the sand, backfill and asphalt and small
// outlines for the gravel. A separate THREE.Scene, drawn with the same camera as the render.

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { DUCTS, H, L, R, RING_X, WALL, W, Y, rng, type V3 } from './geometry';

type Segs = number[];
const seg = (a: Segs, p: V3, q: V3) => a.push(p[0], p[1], p[2], q[0], q[1], q[2]);

function circle(a: Segs, x: number, y: number, z: number, r: number, n = 64) {
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * Math.PI * 2;
    const t1 = ((i + 1) / n) * Math.PI * 2;
    seg(a, [x, y + Math.sin(t0) * r, z + Math.cos(t0) * r], [x, y + Math.sin(t1) * r, z + Math.cos(t1) * r]);
  }
}

// Beat 2. Each dot starts off its place, with its own delay, and settles. uFly runs 0 to 1, and 1
// puts every dot exactly where it was drawn before, so the settled scene is unchanged.
function dots(pts: number[], size: number, opacity: number, tex: THREE.Texture, fly: { value: number }, seed: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const fr = rng(seed);
  const off = new Float32Array((pts.length / 3) * 4);
  for (let i = 0; i < pts.length / 3; i++) {
    off[i * 4] = (fr() - 0.75) * 2.4;
    off[i * 4 + 1] = (fr() - 0.2) * 2.2 + 0.5;
    off[i * 4 + 2] = (fr() - 0.3) * 1.8;
    off[i * 4 + 3] = fr() * 0.45;
  }
  g.setAttribute('aFly', new THREE.BufferAttribute(off, 4));
  const m = new THREE.PointsMaterial({ color: '#ffffff', size, sizeAttenuation: false, map: tex, alphaTest: 0.05, transparent: true, opacity, depthTest: false, depthWrite: false });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFly = fly;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aFly;\nuniform float uFly;\nvarying float vFlyK;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nfloat fk = clamp((uFly - aFly.w) / 0.55, 0.0, 1.0);\ntransformed += aFly.xyz * pow(1.0 - fk, 3.0);\nvFlyK = smoothstep(0.0, 0.35, fk);',
      );
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFlyK;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vFlyK;');
  };
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

// k scales the dots, thin drops every other ring and two of the four lines on each duct
export function buildSchematic(dpr: number, k = 1, thin = false) {
  const scene = new THREE.Scene();
  const vis: Segs = [];
  const hid: Segs = [];
  const x0 = -L / 2;
  const x1 = L / 2;
  const z0 = -W / 2;
  const z1 = W / 2;

  // outer block, nine edges touch a face the camera sees (top, long front, near end)
  const E = (a: V3, b: V3, v: boolean) => seg(v ? vis : hid, a, b);
  E([x0, H, z1], [x1, H, z1], true);
  E([x0, H, z0], [x1, H, z0], true);
  E([x0, 0, z1], [x1, 0, z1], true);
  E([x0, 0, z0], [x1, 0, z0], false);
  E([x1, 0, z1], [x1, H, z1], true);
  E([x1, 0, z0], [x1, H, z0], true);
  E([x0, 0, z1], [x0, H, z1], true);
  E([x0, 0, z0], [x0, H, z0], false);
  E([x1, H, z0], [x1, H, z1], true);
  E([x1, 0, z0], [x1, 0, z1], true);
  E([x0, H, z0], [x0, H, z1], true);
  E([x0, 0, z0], [x0, 0, z1], false);

  // layer joints and the two edges of the tape, round all four sides
  const joint = (y: number) => {
    E([x0, y, z1], [x1, y, z1], true);
    E([x1, y, z0], [x1, y, z1], true);
    E([x0, y, z0], [x1, y, z0], false);
    E([x0, y, z0], [x0, y, z1], false);
  };
  [Y.sand, Y.backfill, Y.base, Y.tape - Y.tapeT / 2, Y.tape + Y.tapeT / 2].forEach(joint);

  // ducts, rings and four lines each. Inside the block they read as seen through it.
  const ringSet = (x: number, d: (typeof DUCTS)[number], v: boolean, r: number) => circle(v ? vis : hid, x, d.y, d.z, r);
  for (const d of DUCTS) {
    const xa = x0 - d.far;
    const xb = x1 + d.near;
    for (const q of thin ? [0, 2] : [0, 1, 2, 3]) {
      const a = (q / 4) * Math.PI * 2;
      const o: V3 = [0, Math.sin(a) * R, Math.cos(a) * R];
      const P = (x: number): V3 => [x, d.y + o[1], d.z + o[2]];
      seg(vis, P(xa), P(x0));
      seg(hid, P(x0), P(x1));
      seg(vis, P(x1), P(xb));
    }
    RING_X.forEach((x, i) => {
      if (thin && i % 2) return;
      if (x > x0 + 0.01 && x < x1 - 0.01) ringSet(x, d, false, R);
    });
    ringSet(x0, d, true, R);
    ringSet(x1, d, true, R);
    ringSet(xa, d, true, R);
    ringSet(xb, d, true, R);
    ringSet(xb, d, true, R - WALL);
    for (let x = x1 + 0.4; x < xb - 0.05; x += 0.4) ringSet(x, d, true, R);
    for (let x = x0 - 0.4; x > xa + 0.05; x -= 0.4) ringSet(x, d, true, R);
  }

  // layer strata hairlines as stones, outlines for the gravel
  const r = rng(7);
  const poly = (face: 'f' | 'e', u: number, v: number, rad: number) => {
    const n = 5 + Math.floor(r() * 3);
    const rot = r() * Math.PI;
    const pts: V3[] = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.4;
      const m = rad * (0.75 + r() * 0.3);
      const pu = u + Math.cos(a) * m;
      const pv = v + Math.sin(a) * m * 0.72;
      pts.push(face === 'f' ? [pu, pv, z1] : [x1, pv, pu]);
    }
    for (let i = 0; i < n; i++) seg(vis, pts[i], pts[(i + 1) % n]);
  };
  {
    const yb0 = Y.backfill + 0.035;
    const yb1 = Y.base - 0.035;
    for (let u = x0 + 0.1; u < x1 - 0.08; u += 0.1) for (let v = yb0; v < yb1 + 0.01; v += 0.075) poly('f', u + (r() - 0.5) * 0.05, v + (r() - 0.5) * 0.03, 0.036 + r() * 0.012);
    for (let u = z0 + 0.1; u < z1 - 0.08; u += 0.1) for (let v = yb0; v < yb1 + 0.01; v += 0.075) poly('e', u + (r() - 0.5) * 0.05, v + (r() - 0.5) * 0.03, 0.036 + r() * 0.012);
  }

  // dots
  const tex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 15);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  const sand: number[] = [];
  const back: number[] = [];
  const back2: number[] = [];
  const asph: number[] = [];
  const topd: number[] = [];
  const inDuct = (z: number, y: number) => DUCTS.some((d) => Math.hypot(z - d.z, y - d.y) < R + 0.02);
  const fill = (out: number[], y0: number, y1: number, step: number, jit: number, skipDuct: boolean) => {
    for (let v = y0; v <= y1; v += step) {
      for (let u = x0 + step * 0.5; u < x1 - step * 0.3; u += step) {
        const uu = u + (r() - 0.5) * jit;
        const vv = v + (r() - 0.5) * jit;
        if (vv < y0 || vv > y1) continue;
        out.push(uu, vv, z1);
      }
      for (let u = z0 + step * 0.5; u < z1 - step * 0.3; u += step) {
        const uu = u + (r() - 0.5) * jit;
        const vv = v + (r() - 0.5) * jit;
        if (vv < y0 || vv > y1) continue;
        if (skipDuct && inDuct(uu, vv)) continue;
        out.push(x1, vv, uu);
      }
    }
  };
  fill(sand, 0.025, Y.sand - 0.025, 0.05, 0.034, true);
  fill(back, Y.sand + 0.03, Y.tape - 0.03, 0.078, 0.06, false);
  fill(back2, Y.tape + 0.03, Y.backfill - 0.03, 0.078, 0.06, false);
  fill(asph, Y.base + 0.025, Y.surface - 0.02, 0.034, 0.02, false);
  for (let v = z0 + 0.03; v < z1 - 0.02; v += 0.05) for (let u = x0 + 0.03; u < x1 - 0.02; u += 0.05) topd.push(u + (r() - 0.5) * 0.03, H, v + (r() - 0.5) * 0.03);
  const fly = { value: 1 };
  scene.add(dots(sand, 1.6 * k, 0.62, tex, fly, 101), dots(back, 2.1 * k, 0.8, tex, fly, 102), dots(back2, 3 * k, 0.7, tex, fly, 103), dots(asph, 1.6 * k, 0.55, tex, fly, 104), dots(topd, 1.6 * k, 0.5, tex, fly, 105));

  const mats: LineMaterial[] = [];
  const lines: { g: LineSegmentsGeometry; n: number }[] = [];
  const mkLines = (a: Segs, opacity: number) => {
    const g = new LineSegmentsGeometry();
    g.setPositions(a);
    const m = new LineMaterial({ color: 0xffffff, linewidth: Math.max(1, dpr), transparent: true, opacity, depthTest: false, depthWrite: false });
    mats.push(m);
    lines.push({ g, n: a.length / 6 });
    const l = new LineSegments2(g, m);
    l.frustumCulled = false;
    scene.add(l);
  };
  mkLines(hid, 0.34);
  mkLines(vis, 0.95);

  return {
    scene,
    // beat 2, the share of lines drawn and the dots' flight, both 1 when settled
    setAssemble(edges: number, flight: number) {
      for (const l of lines) l.g.instanceCount = Math.ceil(l.n * edges);
      fly.value = flight;
    },
    setResolution(w: number, h: number) {
      for (const m of mats) m.resolution.set(w, h);
    },
    dispose() {
      scene.traverse((o) => {
        const x = o as THREE.Mesh;
        x.geometry?.dispose?.();
        (x.material as THREE.Material | undefined)?.dispose?.();
      });
      tex.dispose();
    },
  };
}
