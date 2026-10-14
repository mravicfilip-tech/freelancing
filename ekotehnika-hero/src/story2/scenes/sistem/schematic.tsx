// The servis stage. The real X50 lit in the scene on the dark ground, finished like the hero forklift, in three quarter
// perspective on the right of the frame. Its own Linde parts, real tyres with tread on grey rims and hubs that turn with the
// story clock, the shell in the brand red and every other part in an LMH grey. The studio environment is turned to light
// it low key, a soft top light from the front left and a bright edge along the far side, so the dark truck reads on the
// dark ground. One clean outline on the silhouette only, 2px white at 90 percent, drawn from a mask of the whole truck in
// screen space so no inner edge is ever drawn. The ground is pure black (Filip round 5) with a 0.5 m floor grid edge to edge
// and the truck's shadow on it, the grid kept on his "we lost the grid here on this page".
// Three dimension lines with the X50 / 600 figures from the Linde data sheet DS_X35_X50_1254, each held inside one cell of
// the page grid at 1440 and 1920, so none crosses a vertical or meets the stage edge. They draw on once the shutter of B
// has rolled away. Nothing fades.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { SceneProps } from '../../clock';
import { useGLTF } from '@react-three/drei';
import { prepare, SPEC, modelUrl } from './models';
import { BP } from './route';
import { G, ease, range, uOf } from './kit';

const RED = '#a00020';
const INK = G.mid; // dimension and extension lines
const TEXT = G.pale; // dimension figures
const GROUND = 0.012;
// The studio environment at 80 percent, turned 1.2 rad about the vertical so its soft box sits high on the front left of
// the truck and its bright strip runs along the far edges. Low key, the body stays dark between the highlights.
const ENV = 0.8;
const ROT = 1.2;
const FIG = { y: '2120', h1: '2523', c: '600', q: '4990' };

// Each Linde material of the X50 gets one copy for this stage, its colour set to the shell red or an LMH grey. The hero
// truck keeps the shared originals.
const RECOLOUR: Record<string, string> = {
  Linde_Red_bump: RED,
  Linde_grau: G.graphite,
  Linde_Silver: G.light,
  Linde_White: G.pale,
  lambert1: G.mid,
  linde_gelb: G.mid,
};

// ---- dimension lines ---------------------------------------------------------------------------------------------------

type Dim = { segs: number[][]; tris: number[]; label: { text: string; p: number[]; c: [number, number] }[] };

// In truck metres, X forward, Y up, Z to the near side, the side the camera sees. The places were measured against the
// page grid at 1440 by 900 and 1920 by 1080 with the camera of camera.tsx, so each dimension stays inside one cell.
// Y, the wheelbase, on the floor beside the near tyres, in the cell under the cab.
// H1, the mast lowered, standing on the floor ahead of the forks, in the cell on the right.
// C and Q, the load centre from the fork face and the capacity, beside the near fork, in the same cell.
function dimensions(): Dim[] {
  const arrow = (tris: number[], tip: number[], dir: number[], normal: 'y' | 'z') => {
    const len = 0.13;
    const w = 0.04;
    const base = [tip[0] + dir[0] * len, tip[1] + dir[1] * len, tip[2] + dir[2] * len];
    const side = normal === 'y' ? [-dir[2], 0, dir[0]] : [-dir[1], dir[0], 0];
    tris.push(...tip, base[0] + side[0] * w, base[1] + side[1] * w, base[2] + side[2] * w, base[0] - side[0] * w, base[1] - side[1] * w, base[2] - side[2] * w);
  };
  // Y, from the rear axle to the front axle
  const y: Dim = { segs: [], tris: [], label: [] };
  {
    const z = 1.08;
    const [x0, x1] = [-2.121, 0];
    y.segs.push([x0, GROUND, 0.86, x0, GROUND, z + 0.08], [x1, GROUND, 0.86, x1, GROUND, z + 0.08], [x0, GROUND, z, x1, GROUND, z]);
    arrow(y.tris, [x0, GROUND, z], [1, 0, 0], 'y');
    arrow(y.tris, [x1, GROUND, z], [-1, 0, 0], 'y');
    y.label.push({ text: `Y ${FIG.y}`, p: [(x0 + x1) / 2, GROUND, z], c: [0.5, 1.35] });
  }
  // H1, from the floor to the top of the mast
  const h: Dim = { segs: [], tris: [], label: [] };
  {
    const [x, z, top] = [2.4, 0.4, 2.523];
    h.segs.push([x, GROUND, z, x, top, z], [0.86, top, z, x + 0.1, top, z], [x - 0.1, GROUND, z, x + 0.1, GROUND, z]);
    arrow(h.tris, [x, GROUND, z], [0, 1, 0], 'z');
    arrow(h.tris, [x, top, z], [0, -1, 0], 'z');
    h.label.push({ text: `H1 ${FIG.h1}`, p: [x, top * 0.55, z], c: [-0.12, 0.5] });
  }
  // C, from the fork face to the load centre, beside the near fork, and the capacity under it, both clear of the tines
  const c: Dim = { segs: [], tris: [], label: [] };
  {
    const [x0, yc, z] = [0.536, 0.12, 1.06];
    const x1 = x0 + 0.6;
    c.segs.push([x0, yc, 0.86, x0, yc, z + 0.08], [x1, yc, 0.86, x1, yc, z + 0.08], [x0, yc, z, x1, yc, z]);
    arrow(c.tris, [x0, yc, z], [1, 0, 0], 'y');
    arrow(c.tris, [x1, yc, z], [-1, 0, 0], 'y');
    c.label.push({ text: `C ${FIG.c}`, p: [(x0 + x1) / 2, yc, z], c: [0.5, 1.35] });
    c.label.push({ text: `Q ${FIG.q} KG`, p: [(x0 + x1) / 2, yc, z], c: [0.5, 2.45] });
  }
  return [y, h, c];
}

// Each segment drawn from its first point up to p of its length.
function partial(dims: Dim[], p: number) {
  const out: number[] = [];
  dims.forEach((d) =>
    d.segs.forEach((s) => {
      out.push(s[0], s[1], s[2], s[0] + (s[3] - s[0]) * p, s[1] + (s[4] - s[1]) * p, s[2] + (s[5] - s[2]) * p);
    }),
  );
  return new Float32Array(out);
}

const FONT = '500 15px "Daxline Pro", Arial, sans-serif';
const LABEL_H = 22;
function labelSprite(text: string, center: [number, number]) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  const spaced = (x: CanvasRenderingContext2D) => ((x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.1px');
  g.font = FONT;
  spaced(g);
  const w = Math.ceil(g.measureText(text).width) + 6;
  c.width = w * 3;
  c.height = LABEL_H * 3;
  g.scale(3, 3);
  g.font = FONT;
  spaced(g);
  g.fillStyle = TEXT;
  g.textBaseline = 'middle';
  g.fillText(text, 3, LABEL_H / 2 + 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  // a fixed size on screen, so a figure is 15px at every width and every distance
  const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, sizeAttenuation: false });
  const s = new THREE.Sprite(mat);
  s.center.set(center[0], center[1]);
  s.renderOrder = 4;
  s.frustumCulled = false;
  return { sprite: s, w };
}

// A black contact shadow under the truck. The kit's blob is ink grey, lighter than this ground, so it would glow here.
function contactMaterial() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,1)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.6)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false });
}

// ---- the outline -------------------------------------------------------------------------------------------------------

// A white mask of the whole truck is drawn into a target each frame, then one pass over the screen lights the pixels just
// outside the mask. Only the outer contour can come out of it, never an edge inside the truck.
function outlineMaterial(mask: THREE.Texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: { uMask: { value: mask }, uRes: { value: new THREE.Vector2(1, 1) }, uThick: { value: 2 }, uOpacity: { value: 0.9 } },
    vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D uMask; uniform vec2 uRes; uniform float uThick; uniform float uOpacity;
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        float c = texture2D(uMask, uv).r;
        if (c > 0.995) discard;
        float m = 0.0;
        for (int i = 0; i < 16; i++) {
          float a = float(i) * 0.3926991;
          vec2 d = vec2(cos(a), sin(a)) / uRes;
          m = max(m, texture2D(uMask, uv + d * uThick).r);
          m = max(m, texture2D(uMask, uv + d * uThick * 0.5).r);
        }
        float k = clamp(m - c, 0.0, 1.0);
        if (k < 0.004) discard;
        gl_FragColor = vec4(vec3(1.0), k * uOpacity);
      }`,
  });
}

function Stage({ clock }: SceneProps) {
  const spec = SPEC.x50;
  const gltf = useGLTF(modelUrl('x50')) as unknown as { scene: THREE.Group };
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const [fonts, setFonts] = useState(0);
  const root = useRef<THREE.Group>(null);
  const drawn = useRef(-1);
  const warm = useRef(false);

  // the truck in its own copies of the Linde materials, lit by the turned studio environment
  const mats = useMemo(() => new Map<THREE.Material, THREE.MeshStandardMaterial>(), []);
  const model = useMemo(() => {
    const s = prepare(gltf.scene, 'x50');
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const src = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
      let mat = mats.get(src);
      if (!mat) {
        mat = src.clone();
        const hex = RECOLOUR[src.name];
        if (hex) mat.color.set(hex);
        // paint on the shell, plain rubber on the tyres, so neither turns into a mirror of the studio
        if (src.name === 'Linde_Red_bump') {
          mat.metalness = 0.05;
          mat.roughness = 0.42;
        }
        if (src.name === 'rubber') {
          mat.metalness = 0;
          mat.roughness = 0.85;
        }
        mat.envMapRotation.set(0, ROT, 0);
        mats.set(src, mat);
      }
      m.material = mat;
    });
    return s;
  }, [gltf, mats]);
  const wheelNodes = useMemo(() => spec.wheels.map((w) => ({ obj: model.getObjectByName(w.node)!, r: w.r })), [model, spec]);

  // the mask, a second copy of the truck in one white material, in a scene of its own
  const mask = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, depthBuffer: true });
    const sc = new THREE.Scene();
    sc.overrideMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const holder = new THREE.Group();
    holder.position.set(BP.x, spec.ground, BP.z);
    holder.rotation.y = spec.yaw;
    holder.add(prepare(gltf.scene, 'x50'));
    sc.add(holder);
    sc.updateMatrixWorld(true);
    return { rt, sc };
  }, [gltf, spec]);
  const outline = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const m = new THREE.Mesh(g, outlineMaterial(mask.rt.texture));
    m.frustumCulled = false;
    m.renderOrder = 2;
    return m;
  }, [mask]);

  // the floor, a 0.5 m grid at 8 percent over the whole visible floor, a shadow catcher and the contact shadow
  const grid = useMemo(() => {
    // short 0.5 m segments, as a line that passes under the camera is dropped whole. The camera looks toward +x and -z
    // from about (-7, 7, 10), so this box holds every bit of floor up to the top edge of the frame.
    const p: number[] = [];
    const [x0, x1, z0, z1] = [-36, 36, -36, 12];
    for (let x = x0; x <= x1 + 0.001; x += 0.5) for (let z = z0; z < z1; z += 0.5) p.push(x, 0, z, x, 0, z + 0.5);
    for (let z = z0; z <= z1 + 0.001; z += 0.5) for (let x = x0; x < x1; x += 0.5) p.push(x, 0, z, x + 0.5, 0, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, []);
  const gridMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, toneMapped: false, depthWrite: false }), []);
  const shadowMat = useMemo(() => new THREE.ShadowMaterial({ color: '#000000', opacity: 0.7, depthWrite: false }), []);
  const blob = useMemo(contactMaterial, []);

  // dimensions
  const dims = useMemo(dimensions, []);
  const lineMat = useMemo(() => new LineMaterial({ color: new THREE.Color(INK).getHex(), linewidth: 1, toneMapped: false, depthWrite: false }), []);
  const lines = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(partial(dims, 0.001));
    const l = new LineSegments2(g, lineMat);
    l.frustumCulled = false;
    l.renderOrder = 3;
    return l;
  }, [dims, lineMat]);
  const arrows = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(dims.flatMap((d) => d.tris), 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
    m.renderOrder = 3;
    m.frustumCulled = false;
    return m;
  }, [dims]);
  const labels = useMemo(
    () =>
      dims.flatMap((d) =>
        d.label.map((l) => {
          const s = labelSprite(l.text, l.c);
          s.sprite.position.set(l.p[0], l.p[1], l.p[2]);
          return s;
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dims, fonts],
  );

  useEffect(() => {
    let live = true;
    Promise.all([document.fonts?.load(FONT, 'Y H C Q KG'), document.fonts?.load(FONT, '0123456789')]).then(() => {
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
    const f = Math.max(1, size.height / 900);
    lineMat.resolution.set(size.width * dpr, size.height * dpr);
    lineMat.linewidth = f * dpr;
    mask.rt.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr));
    const u = (outline.material as THREE.ShaderMaterial).uniforms;
    u.uRes.value.set(Math.round(size.width * dpr), Math.round(size.height * dpr));
    u.uThick.value = 2 * dpr;
    // sprites of a fixed size, LABEL_H css px tall whatever the frame height, fov 28
    const k = (2 * Math.tan((28 / 2) * (Math.PI / 180))) / size.height;
    labels.forEach((l) => l.sprite.scale.set(l.w * k, LABEL_H * k, 1));
    invalidate();
  }, [lineMat, mask, outline, labels, size, dpr, invalidate]);

  useEffect(
    () => () => {
      mask.rt.dispose();
    },
    [mask],
  );

  useFrame(() => {
    const u = uOf(clock);
    const pos = clock.pos.current;
    // gone at 10.5, half way through S, where the servis map takes the black stage (round 5), so the truck, its floor and its
    // labels never stand behind the map
    const show = u >= 9.95 && u < 10.5;
    // Once the story is in B, the truck takes the studio environment and every shader of the stage is compiled while it
    // is still hidden, so the first frame of S does not stall on them.
    const env = scene.environment;
    if (!warm.current && env && u >= 8.5 && u < 11.9 && root.current) {
      mats.forEach((m) => {
        m.envMap = env;
        m.envMapIntensity = ENV;
        m.needsUpdate = true;
      });
      const r = root.current;
      r.visible = true;
      gl.compile(r, camera, scene);
      warm.current = true;
    }
    if (root.current) root.current.visible = show;
    if (!show) return;
    // the truck is there in full under the black shutter of B, the dimensions draw on once it has gone at 10.125 and are drawn
    // by 10.25, so they hold in full until the map takes the stage at 10.5
    const p = ease(range(u, 10.13, 10.25));
    const q = Math.max(p, 0.001);
    if (Math.abs(q - drawn.current) > 1e-4) {
      drawn.current = q;
      (lines.geometry as LineSegmentsGeometry).setPositions(partial(dims, q));
    }
    arrows.visible = p >= 0.999;
    labels.forEach((l) => (l.sprite.visible = p >= 0.6));
    const roll = (pos - 8000) * 0.011;
    wheelNodes.forEach((w) => (w.obj.rotation.z = (spec.spin * roll) / w.r));
    // the mask of the truck, drawn with the camera this frame was posed with
    const prev = gl.getRenderTarget();
    const clear = gl.getClearAlpha();
    const col = gl.getClearColor(new THREE.Color());
    gl.setRenderTarget(mask.rt);
    gl.setClearColor(0x000000, 1);
    gl.clear(true, true, false);
    gl.render(mask.sc, camera);
    gl.setRenderTarget(prev);
    gl.setClearColor(col, clear);
  });

  return (
    <group ref={root} visible={false} position={[BP.x, 0, BP.z]}>
      <lineSegments geometry={grid} material={gridMat} renderOrder={-3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} material={shadowMat} receiveShadow renderOrder={-2}>
        <planeGeometry args={[16, 16]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[spec.foot[2], 0.006, 0]} material={blob} renderOrder={-1}>
        <planeGeometry args={[spec.foot[0], spec.foot[1]]} />
      </mesh>
      <group position={[0, spec.ground, 0]} rotation={[0, spec.yaw, 0]}>
        <primitive object={model} />
      </group>
      <primitive object={outline} />
      <primitive object={lines} />
      <primitive object={arrows} />
      {labels.map((l, i) => (
        <primitive key={`${i}${fonts}`} object={l.sprite} />
      ))}
    </group>
  );
}

// Nothing of the stage is built on page load. It is put together once the story reaches B, while the truck and the shutter
// still cover the frame, so the first frame of the page does no work for S.
export default function Schematic({ clock }: SceneProps) {
  const [ready, setReady] = useState(false);
  const invalidate = useThree((s) => s.invalidate);
  useFrame(() => {
    if (!ready && uOf(clock) >= 8.5) {
      setReady(true);
      invalidate();
    }
  });
  return ready ? <Stage clock={clock} /> : null;
}
