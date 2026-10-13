// S, the servis schematic. The real X50 as a technical drawing in three quarter perspective on the dark ground, drawn
// with hidden line removal. The model is drawn as solid ink fills that write depth, so nothing behind a surface shows.
// On top, the hard edges of each part (55 degrees, bits under 12 cm dropped) as 1px lines at 55 percent white, depth tested,
// and an inverted hull pass gives the outer contour one crisp 2px line at 90 percent white. The tyres are not edged, each
// outer wheel face is one clean tyre circle, a hub circle and five lugs, turning with the story clock. Dashed centre lines,
// and dimension lines in LMH turquoise 72 percent with the X50 / 600 figures from the
// Linde data sheet DS_X35_X50_1254. Dimension lines end in small ticks, never arrowheads. No glow.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { useGLTF } from '@react-three/drei';
import type { StoryClock } from '../../clock';
import { bpRoll, drawOn, seg } from './choreo';
import { X50, bodyEdges, prepareX50 } from './edges';
import { INFO } from './look';

const GROUND = 0.012;
const FIG = { l1: '4373', l2: '3173', y: '2120', h1: '2523', h6: '2495', c: '600', q: '4990' };

// ---- small drawing helpers ---------------------------------------------------------------------------------------------

class L {
  a: number[] = [];
  seg(p: number[], q: number[]) {
    this.a.push(p[0], p[1], p[2], q[0], q[1], q[2]);
  }
  circle(c: number[], r: number, n = 72) {
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * Math.PI * 2;
      const t1 = ((i + 1) / n) * Math.PI * 2;
      this.seg([c[0] + Math.cos(t0) * r, c[1] + Math.sin(t0) * r, c[2]], [c[0] + Math.cos(t1) * r, c[1] + Math.sin(t1) * r, c[2]]);
    }
  }
  // a dash and dot centre line, long dash, gap, dot, gap
  dashdot(p: number[], q: number[]) {
    const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const len = Math.hypot(...d);
    const u = d.map((v) => v / len);
    const pat = [0.2, 0.06, 0.04, 0.06];
    let t = 0;
    let i = 0;
    while (t < len) {
      const l = Math.min(pat[i % 4], len - t);
      if (i % 2 === 0) this.seg([p[0] + u[0] * t, p[1] + u[1] * t, p[2] + u[2] * t], [p[0] + u[0] * (t + l), p[1] + u[1] * (t + l), p[2] + u[2] * (t + l)]);
      t += pat[i % 4];
      i++;
    }
  }
}

const FONT = '500 14px "Daxline Pro", Arial, sans-serif';
function labelSprite(text: string) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = FONT;
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.1px';
  const w = Math.ceil(g.measureText(text).width) + 6;
  const h = 22;
  c.width = w * 2;
  c.height = h * 2;
  g.scale(2, 2);
  g.font = FONT;
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.1px';
  g.fillStyle = INFO;
  g.textBaseline = 'middle';
  g.fillText(text, 3, h / 2 + 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, opacity: 0 });
  return { mat, w, h };
}

const lineMat = (opacity: number, width: number, color = '#ffffff', depthTest = true) =>
  new LineMaterial({ color: new THREE.Color(color).getHex(), linewidth: width, transparent: true, opacity, toneMapped: false, depthWrite: false, depthTest });
const seg2 = (pts: number[], mat: LineMaterial) => {
  const g = new LineSegmentsGeometry();
  g.setPositions(new Float32Array(pts.length ? pts : [0, 0, 0, 0, 0, 0]));
  const l = new LineSegments2(g, mat);
  l.frustumCulled = false;
  return l;
};

// Dimension lines in world metres relative to the truck, X forward, Y up, Z to the near side, the side the camera sees.
function dimensions() {
  const dim = new L();
  const labels: { text: string; p: number[] }[] = [];
  const T = 0.07; // half the length of an end tick
  // along x on the ground, the line broken for its label, a tick at each end
  const gx = (x1: number, x2: number, z: number, text: string, extFrom: [number, number]) => {
    dim.seg([x1, GROUND, extFrom[0]], [x1, GROUND, z + 0.1]);
    dim.seg([x2, GROUND, extFrom[1]], [x2, GROUND, z + 0.1]);
    const mid = (x1 + x2) / 2;
    const gap = 0.07 * text.length * 0.5 + 0.12;
    dim.seg([x1, GROUND, z], [mid - gap, GROUND, z]);
    dim.seg([mid + gap, GROUND, z], [x2, GROUND, z]);
    [x1, x2].forEach((x) => dim.seg([x - T, GROUND, z - T], [x + T, GROUND, z + T]));
    labels.push({ text, p: [mid, 0.1, z] });
  };
  const L1x = -2.64;
  const tip = 1.736;
  gx(L1x, tip, 2.45, `L1 ${FIG.l1}`, [0.78, 0.2]);
  gx(L1x, tip - 1.2, 2.05, `L2 ${FIG.l2}`, [0.78, 0.2]);
  gx(-2.121, 0, 1.65, `Y ${FIG.y}`, [0.78, 0.7]);
  // heights, vertical lines beside the truck with their extension lines in a horizontal plane
  const gy = (x: number, z: number, top: number, text: string, from: number[], at: number) => {
    dim.seg(from, [x, top, z]);
    dim.seg([x, GROUND, z], [x, GROUND + (top - GROUND) * at - 0.14, z]);
    dim.seg([x, GROUND + (top - GROUND) * at + 0.14, z], [x, top, z]);
    dim.seg([x - 0.12, GROUND, z], [x + 0.12, GROUND, z]);
    [GROUND, top].forEach((y) => dim.seg([x - T, y - T, z], [x + T, y + T, z]));
    labels.push({ text, p: [x + 0.06, GROUND + (top - GROUND) * at, z] });
  };
  gy(1.0, 1.25, 2.458, `H1 ${FIG.h1}`, [0.42, 2.458, 0.52], 0.3);
  gy(-2.95, 1.25, 2.511, `H6 ${FIG.h6}`, [-1.55, 2.511, 0.68], 0.62);
  // the load centre over the near fork, and the capacity
  const x0 = tip - 1.2;
  const x1 = x0 + 0.6;
  const zf = 0.3;
  const yc = 0.95;
  dim.seg([x0, 0.12, zf], [x0, yc + 0.08, zf]);
  dim.seg([x1, 0.12, zf], [x1, yc + 0.08, zf]);
  const gap = 0.07 * 5 * 0.5 + 0.12;
  const mid = (x0 + x1) / 2;
  dim.seg([x0, yc, zf], [mid - gap, yc, zf]);
  dim.seg([mid + gap, yc, zf], [x1, yc, zf]);
  [x0, x1].forEach((x) => dim.seg([x - T, yc - T, zf], [x + T, yc + T, zf]));
  labels.push({ text: `C ${FIG.c}`, p: [mid, yc, zf] });
  labels.push({ text: `Q ${FIG.q} KG`, p: [mid, yc + 0.3, zf] });
  return { dim: dim.a, labels };
}

// The inverted hull, back faces pushed out along their normals by a fixed number of pixels, drawn white. Only the rim
// that sticks out past the front faces survives the depth test, which is the outer contour.
function hullMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    uniforms: { uThick: { value: 2 }, uRes: { value: new THREE.Vector2(1440, 900) }, uOpacity: { value: 0 } },
    vertexShader: `
      uniform float uThick; uniform vec2 uRes;
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vec4 cn = projectionMatrix * vec4(n, 0.0);
        vec2 d = cn.xy; float l = length(d);
        vec2 off = l > 1e-5 ? d / l * uThick / uRes * 2.0 * clip.w : vec2(0.0);
        gl_Position = clip + vec4(off, 0.0, 0.0);
      }`,
    fragmentShader: `uniform float uOpacity; void main() { gl_FragColor = vec4(vec3(1.0), uOpacity); }`,
  });
}

export default function Schematic({ clock }: { clock: StoryClock }) {
  const gltf = useGLTF('/models/linde/x50.glb') as unknown as { scene: THREE.Group };
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const [fonts, setFonts] = useState(0);
  const root = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);

  const mats = useMemo(
    () => ({
      detail: lineMat(0.55, 1, '#ffffff', true),
      wheelO: lineMat(0.9, 2, '#ffffff', true),
      wheelD: lineMat(0.55, 1, '#ffffff', true),
      centre: lineMat(0.5, 1, '#ffffff', false),
      dim: lineMat(1, 1, INFO, false),
    }),
    [],
  );
  const hull = useMemo(hullMaterial, []);
  const fill = useMemo(() => new THREE.MeshBasicMaterial({ color: '#171717', polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2, toneMapped: false }), []);
  // the model as ink fills, every mesh but the tyres also gets its hull
  const model = useMemo(() => {
    const s = prepareX50(gltf.scene);
    const meshes: THREE.Mesh[] = [];
    s.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    meshes.forEach((m) => {
      m.material = fill;
      m.castShadow = m.receiveShadow = false;
      for (let p: THREE.Object3D | null = m; p; p = p.parent) if (X50.wheels.some((w) => w.node === p!.name)) return;
      const h = new THREE.Mesh(m.geometry, hull);
      h.renderOrder = -1;
      m.add(h);
    });
    return s;
  }, [gltf, fill, hull]);
  const wheelNodes = useMemo(() => X50.wheels.map((w) => ({ obj: model.getObjectByName(w.node)!, r: w.r })), [model]);
  // the body edges sorted from the ground up, so drawing the first n of them builds the truck from its wheels to its guard
  const edges = useMemo(() => {
    const raw = bodyEdges(gltf.scene, 55, 0.12);
    const segs: number[][] = [];
    for (let i = 0; i < raw.length; i += 6) segs.push(raw.slice(i, i + 6));
    segs.sort((p, q) => Math.min(p[1], p[4]) - Math.min(q[1], q[4]));
    return seg2(segs.flat(), mats.detail);
  }, [gltf, mats]);
  // wheel faces, in the wheel's own frame (unit tyre radius), on the outer face of each tyre
  const wheelLines = useMemo(
    () =>
      wheelNodes.map((w) => {
        const sign = Math.sign(w.obj.position.z) || 1;
        const z = sign * 0.3;
        const o = new L();
        const d = new L();
        o.circle([0, 0, z], 1, 96);
        d.circle([0, 0, z], 0.4, 48);
        d.circle([0, 0, z], 0.16, 32);
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + 0.3;
          d.circle([Math.cos(a) * 0.28, Math.sin(a) * 0.28, z], 0.045, 12);
        }
        return { outline: seg2(o.a, mats.wheelO), detail: seg2(d.a, mats.wheelD) };
      }),
    [wheelNodes, mats],
  );
  const centre = useMemo(() => {
    const c = new L();
    [0, -2.121].forEach((x) => c.dashdot([x, 0.414, -1.0], [x, 0.414, 1.0]));
    c.dashdot([-2.9, GROUND, 0], [2.0, GROUND, 0]);
    c.dashdot([-0.17, GROUND, 0], [-0.17, 2.85, 0]);
    return seg2(c.a, mats.centre);
  }, [mats]);
  const dims = useMemo(dimensions, []);
  const dimLines = useMemo(() => seg2(dims.dim, mats.dim), [dims, mats]);
  const labels = useMemo(
    () => dims.labels.map((l) => ({ ...l, ...labelSprite(l.text) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dims, fonts],
  );
  useEffect(() => {
    let live = true;
    Promise.all([document.fonts?.load(FONT, 'L1 Y KGHCQ'), document.fonts?.load(FONT, '0123456789')]).then(() => {
      if (live) {
        setFonts((n) => n + 1);
        invalidate();
      }
    });
    return () => {
      live = false;
    };
  }, [invalidate]);

  // every line sits at one fixed strength, 2px outlines at 90 percent, 1px detail at 55 percent
  useEffect(() => {
    mats.centre.opacity = 0.5;
    mats.dim.opacity = 1;
    mats.wheelO.opacity = 0.9;
    mats.detail.opacity = 0.55;
    mats.wheelD.opacity = 0.55;
    hull.uniforms.uOpacity.value = 0.9;
    labels.forEach((l) => (l.mat.opacity = 1));
  }, [mats, hull, labels]);

  useEffect(() => {
    const f = Math.max(1, size.height / 900) * dpr;
    Object.values(mats).forEach((m) => m.resolution.set(size.width * dpr, size.height * dpr));
    mats.detail.linewidth = f;
    mats.wheelO.linewidth = 2 * f;
    mats.wheelD.linewidth = f;
    mats.centre.linewidth = f;
    mats.dim.linewidth = f;
    hull.uniforms.uRes.value.set(size.width, size.height);
    hull.uniforms.uThick.value = 2 * Math.max(1, size.height / 900);
  }, [mats, hull, size, dpr]);

  useFrame(() => {
    const pos = clock.pos.current;
    // the drawing is drawn on in B, each set of lines shows its first n segments, so lines are added and never faded. The contour
    // (the hull) is there from the cut, then centre lines, edges, wheels, dimensions, and each figure once its dimension line is in
    const d = drawOn(pos);
    const part = (l: LineSegments2, a: number, b: number) => {
      const g = l.geometry as LineSegmentsGeometry;
      const n = (g.attributes.instanceStart as THREE.InterleavedBufferAttribute | undefined)?.count ?? 0;
      g.instanceCount = Math.round(n * seg(d, a, b));
      l.visible = g.instanceCount > 0;
    };
    part(centre, 0, 0.25);
    part(edges, 0.08, 0.75);
    wheelLines.forEach((w) => {
      part(w.outline, 0.3, 0.6);
      part(w.detail, 0.45, 0.75);
    });
    part(dimLines, 0.7, 0.97);
    labels.forEach((l, i) => (l.mat.visible = d >= 0.72 + (0.25 * (i + 1)) / labels.length));
    const roll = bpRoll(pos) * 0.42;
    wheelNodes.forEach((w, i) => {
      const a = (X50.spin * roll) / w.r;
      w.obj.rotation.z = a;
      const g = wheelRefs.current[i];
      if (g) g.rotation.z = a;
    });
    model.updateMatrixWorld(true);
  });

  // the figures are 14px canvas text drawn about 15.5px tall at 1080, so below 1080 they grow with the frame and never drop under 14px
  const lab = Math.max(1, 1080 / size.height);
  return (
    <group ref={root}>
      <group position={[0, X50.ground, 0]} rotation={[0, X50.yaw, 0]}>
        <primitive object={model} renderOrder={-2} />
        <primitive object={edges} renderOrder={1} />
        {wheelNodes.map((w, i) => (
          <group
            key={i}
            ref={(g) => {
              wheelRefs.current[i] = g;
            }}
            position={w.obj.position}
            scale={w.obj.scale}
            renderOrder={1}
          >
            <primitive object={wheelLines[i].detail} />
            <primitive object={wheelLines[i].outline} />
          </group>
        ))}
      </group>
      <primitive object={centre} />
      <primitive object={dimLines} />
      {labels.map((l, i) => (
        <sprite key={`${i}${fonts}`} position={l.p as [number, number, number]} material={l.mat} scale={[(l.w / 150) * lab, (l.h / 150) * lab, 1]} renderOrder={4} />
      ))}
    </group>
  );
}

