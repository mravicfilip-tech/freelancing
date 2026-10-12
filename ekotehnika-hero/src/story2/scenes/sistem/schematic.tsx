// The servis stage. The real X50 as a technical illustration in three quarter perspective on the dark ground, drawn with
// hidden line removal. The model is drawn as solid #0b0b0b fills that write depth, so nothing behind a surface shows.
// On top, the hard edges of each mesh (30 to 40 degrees, short bits dropped) as 1px fat lines at 55 percent white, depth
// tested, and an inverted hull pass gives the outer contour a crisp 2px line at 90 percent white. The tyre meshes are not
// edged, each outer wheel face is one clean tyre circle, a hub circle and five lugs, turning with the story clock.
// Dashed centre lines, a 0.5 m ground grid at 8 percent and dimension lines in 3D in LMH turquoise 72 percent with the
// X50 / 600 figures from the Linde data sheet DS_X35_X50_1254. No glow.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { SceneProps } from '../../clock';
import { useGLTF } from '@react-three/drei';
import { bakeEdges } from './bake';
import { prepare, SPEC, modelUrl } from './models';
import { BP } from './route';
import { ease, range, uOf } from './kit';

const TURQUOISE = '#7fbccd'; // LMH turquoise at 72 percent
const GROUND = 0.012;
const FIG = { l1: '4373', l2: '3173', y: '2120', h1: '2523', h6: '2495', c: '600', q: '4990' };

// ---- small drawing helpers ---------------------------------------------------------------------------------------------

class L {
  a: number[] = [];
  seg(p: number[], q: number[]) {
    this.a.push(p[0], p[1], p[2], q[0], q[1], q[2]);
  }
  circle(c: number[], r: number, plane: 'xy' | 'xz' | 'yz', n = 72) {
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * Math.PI * 2;
      const t1 = ((i + 1) / n) * Math.PI * 2;
      const f = (t: number) => {
        const u = Math.cos(t) * r;
        const v = Math.sin(t) * r;
        return plane === 'xy' ? [c[0] + u, c[1] + v, c[2]] : plane === 'xz' ? [c[0] + u, c[1], c[2] + v] : [c[0], c[1] + u, c[2] + v];
      };
      this.seg(f(t0), f(t1));
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
  g.fillStyle = TURQUOISE;
  g.textBaseline = 'middle';
  g.fillText(text, 3, h / 2 + 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, opacity: 0 });
  return { mat, w, h };
}

const lineMat = (opacity: number, width: number, color = '#ffffff', depthTest = true) => new LineMaterial({ color: new THREE.Color(color).getHex(), linewidth: width, transparent: true, opacity, toneMapped: false, depthWrite: false, depthTest });
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
  const tris: number[] = [];
  const labels: { text: string; p: number[] }[] = [];
  const arrow = (tip: number[], dir: number[], normal: 'y' | 'z') => {
    const len = 0.14;
    const w = 0.045;
    const base = [tip[0] + dir[0] * len, tip[1] + dir[1] * len, tip[2] + dir[2] * len];
    const side = normal === 'y' ? [-dir[2], 0, dir[0]] : [-dir[1], dir[0], 0];
    tris.push(...tip, base[0] + side[0] * w, base[1] + side[1] * w, base[2] + side[2] * w, base[0] - side[0] * w, base[1] - side[1] * w, base[2] - side[2] * w);
  };
  // along x on the ground, the line broken for its label
  const gx = (x1: number, x2: number, z: number, text: string, extFrom: [number, number]) => {
    dim.seg([x1, GROUND, extFrom[0]], [x1, GROUND, z + 0.1]);
    dim.seg([x2, GROUND, extFrom[1]], [x2, GROUND, z + 0.1]);
    const mid = (x1 + x2) / 2;
    const gap = 0.07 * text.length * 0.5 + 0.12;
    dim.seg([x1, GROUND, z], [mid - gap, GROUND, z]);
    dim.seg([mid + gap, GROUND, z], [x2, GROUND, z]);
    arrow([x1, GROUND, z], [1, 0, 0], 'y');
    arrow([x2, GROUND, z], [-1, 0, 0], 'y');
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
    arrow([x, GROUND, z], [0, 1, 0], 'z');
    arrow([x, top, z], [0, -1, 0], 'z');
    labels.push({ text, p: [x + 0.06, GROUND + (top - GROUND) * at, z] });
  };
  gy(1.0, 1.25, 2.458, `H1 ${FIG.h1}`, [0.42, 2.458, 0.52], 0.3);
  gy(1.95, 1.25, 2.511, `H6 ${FIG.h6}`, [-1.55, 2.511, 0.68], 0.68);
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
  arrow([x0, yc, zf], [1, 0, 0], 'z');
  arrow([x1, yc, zf], [-1, 0, 0], 'z');
  labels.push({ text: `C ${FIG.c}`, p: [mid, yc, zf] });
  labels.push({ text: `Q ${FIG.q} KG`, p: [mid, yc + 0.3, zf] });
  return { dim: dim.a, tris, labels };
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

// Three wheels turn, the outer face of each wheel: tyre circle, hub circle, five lugs. Wheel centre in the model frame.
const WHEEL_NODES = SPEC.x50.wheels;

export default function Schematic({ clock }: SceneProps) {
  const spec = SPEC.x50;
  const gltf = useGLTF(modelUrl('x50')) as unknown as { scene: THREE.Group };
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
      dim: lineMat(1, 1, TURQUOISE, false),
    }),
    [],
  );
  const hull = useMemo(hullMaterial, []);
  const fill = useMemo(() => new THREE.MeshBasicMaterial({ color: '#0b0b0b', polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2, toneMapped: false }), []);
  // the model as black fills, every mesh also gets its hull
  const model = useMemo(() => {
    const s = prepare(gltf.scene, 'x50');
    const meshes: THREE.Mesh[] = [];
    s.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    meshes.forEach((m) => {
      m.material = fill;
      m.castShadow = m.receiveShadow = false;
      // the tyres get no hull, their clean circle is the outline
      for (let p: THREE.Object3D | null = m; p; p = p.parent) if (WHEEL_NODES.some((w) => w.node === p!.name)) return;
      const h = new THREE.Mesh(m.geometry, hull);
      h.renderOrder = -1;
      m.add(h);
    });
    return s;
  }, [gltf, fill, hull]);
  const wheelNodes = useMemo(() => WHEEL_NODES.map((w) => ({ obj: model.getObjectByName(w.node)!, r: w.r })), [model]);
  // hard edges of the body, mast and forks, short bits dropped, a higher threshold on the busy body
  const edges = useMemo(() => {
    const keep = (pts: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < pts.length; i += 6) {
        if (Math.hypot(pts[i] - pts[i + 3], pts[i + 1] - pts[i + 4], pts[i + 2] - pts[i + 5]) >= 0.03) out.push(...pts.slice(i, i + 6));
      }
      return out;
    };
    return seg2(keep(bakeEdges(gltf.scene, 'x50', 40).body), mats.detail);
  }, [gltf, mats]);
  // wheel faces, in the wheel's own frame (unit tyre radius), on the outer face of each tyre
  const wheelLines = useMemo(
    () =>
      wheelNodes.map((w) => {
        const sign = Math.sign(w.obj.position.z) || 1;
        const z = sign * 0.3;
        const o = new L();
        const d = new L();
        o.circle([0, 0, z], 1, 'xy', 96);
        d.circle([0, 0, z], 0.4, 'xy', 48);
        d.circle([0, 0, z], 0.16, 'xy', 32);
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + 0.3;
          d.circle([Math.cos(a) * 0.28, Math.sin(a) * 0.28, z], 0.045, 'xy', 12);
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
  const arrowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(dims.tris, 3));
    return g;
  }, [dims]);
  const arrowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: TURQUOISE, side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }), []);
  const labels = useMemo(
    () => dims.labels.map((l) => ({ ...l, ...labelSprite(l.text) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dims, fonts],
  );
  const grid = useMemo(() => {
    const p: number[] = [];
    const c: number[] = [];
    const R = 7;
    const add = (a: number[], b: number[]) => {
      p.push(...a, ...b);
      for (const q of [a, b]) {
        const k = Math.max(0, 1 - Math.hypot(q[0] + 0.5, q[2]) / R);
        c.push(k, k, k);
      }
    };
    for (let x = -7; x <= 6.001; x += 0.5) for (let z = -6; z < 6; z += 0.5) add([x, 0, z], [x, 0, z + 0.5]);
    for (let z = -6; z <= 6.001; z += 0.5) for (let x = -7; x < 6; x += 0.5) add([x, 0, z], [x + 0.5, 0, z]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    return g;
  }, []);
  const gridMat = useMemo(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), []);

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
    const u = uOf(clock);
    const pos = clock.pos.current;
    // gone by 11.9, where the light curtain of L has covered the stage, so no label can reach the rental floor behind it
    const show = u >= 9.95 && u < 11.9;
    if (root.current) root.current.visible = show;
    if (!show) return;
    // the guides and the dimensions are there from the first light, the truck draws in after them
    const guides = ease(range(u, 10.0, 10.3));
    const draw = ease(range(u, 10.1, 10.55));
    const det = ease(range(u, 10.3, 10.7));
    gridMat.opacity = 0.08 * guides;
    mats.centre.opacity = 0.5 * guides;
    mats.dim.opacity = guides;
    arrowMat.opacity = guides;
    labels.forEach((l) => (l.mat.opacity = guides));
    hull.uniforms.uOpacity.value = 0.9 * draw;
    mats.wheelO.opacity = 0.9 * draw;
    mats.detail.opacity = 0.55 * det;
    mats.wheelD.opacity = 0.55 * det;
    const roll = (pos - 8000) * 0.011;
    wheelNodes.forEach((w, i) => {
      const a = (spec.spin * roll) / w.r;
      w.obj.rotation.z = a;
      const g = wheelRefs.current[i];
      if (g) g.rotation.z = a;
    });
    model.updateMatrixWorld(true);
  });

  return (
    <group ref={root} visible={false} position={[BP.x, 0, BP.z]}>
      <lineSegments geometry={grid} material={gridMat} renderOrder={-3} />
      <group position={[0, spec.ground, 0]} rotation={[0, spec.yaw, 0]}>
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
      <mesh geometry={arrowGeo} material={arrowMat} renderOrder={3} />
      {labels.map((l, i) => (
        <sprite key={`${i}${fonts}`} position={l.p as [number, number, number]} material={l.mat} scale={[l.w / 150, l.h / 150, 1]} renderOrder={4} />
      ))}
    </group>
  );
}
