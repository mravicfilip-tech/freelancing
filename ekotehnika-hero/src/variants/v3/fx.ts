// Shaders and geometry builders for variant 3. The sky, the dissolve that turns the main truck into
// a wireframe, glowing edge lines, dust points, the tile grid and the light trails. Every colour
// comes from the tokens. Additive effects write display values straight to the screen.
import * as THREE from 'three';
import { C } from '../../tokens';

// Token hex to a display space vector, for shaders that skip colour management.
export const disp = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
// Token hex to a linear colour scaled for light, for shaders that go through tone mapping.
export const lin = (hex: string, k = 1) => new THREE.Color(hex).multiplyScalar(k);

export const HASH = /* glsl */ `
float v3hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float v3hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
`;

// Shared uniforms for one mounted scene.
export function makeUniforms() {
  return {
    cut: { value: 10 },
    time: { value: 0 },
    lineMain: { value: 0 },
    lineWorld: { value: 0 },
    pointMain: { value: 0 },
    pointWorld: { value: 0 },
    drift: { value: 0 },
    grid: { value: 0 },
    beam: { value: 0 },
    beamOpacity: { value: 0 },
    noCut: { value: -1000 },
  };
}
export type V3Uniforms = ReturnType<typeof makeUniforms>;

// The sky dome. A gradient by elevation from a hot toned red horizon through Linde red to ink, a
// wide halo and a hot core around the sun, all run through the same tone mapping as the scene so
// the fog melts into the horizon.
export function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSun: { value: new THREE.Vector3(0.3, 0.07, -1).normalize() },
      cZen: { value: lin(C.ink, 0.25) },
      cMid: { value: lin(C.primary900, 0.5) },
      cLow: { value: lin(C.lindeRed, 0.75) },
      cHor: { value: lin(C.tonedRed, 1.0) },
      cGlow: { value: new THREE.Color(C.tonedRed).lerp(new THREE.Color(C.white), 0.18) },
      cInk: { value: lin(C.ink, 0.12) },
      uDark: { value: 0 },
      uGlow: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun, cZen, cMid, cLow, cHor, cGlow, cInk;
      uniform float uDark, uGlow;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float e = max(d.y, 0.0);
        vec3 col = mix(cHor, cLow, smoothstep(0.0, 0.06, e));
        col = mix(col, cMid, smoothstep(0.04, 0.17, e));
        col = mix(col, cZen, smoothstep(0.14, 0.5, e));
        float s = max(dot(d, uSun), 0.0);
        vec3 flat3 = normalize(vec3(d.x, 0.0, d.z));
        vec3 sunFlat = normalize(vec3(uSun.x, 0.0, uSun.z));
        float az = max(dot(flat3, sunFlat), 0.0);
        float band = pow(az, 3.0) * (1.0 - smoothstep(0.0, 0.3, e));
        col += cGlow * uGlow * (band * 0.55 + pow(s, 10.0) * 0.7 + pow(s, 120.0) * 1.6) + vec3(1.0) * uGlow * (pow(s, 600.0) * 2.5 + pow(s, 4000.0) * 30.0);
        col = mix(col, cInk, uDark);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

// Clones a lit material so its fragments dissolve front to back as the cut plane passes, with a
// hot red seam at the edge. The cut runs along world x.
export function dissolve(mat: THREE.Material, cut: { value: number }) {
  const m = mat.clone();
  m.onBeforeCompile = (s) => {
    s.uniforms.uCut = cut;
    s.vertexShader = 'varying vec3 vW3;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vW3 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader =
      'uniform float uCut;\nvarying vec3 vW3;\n' +
      HASH +
      s.fragmentShader
        .replace('void main() {', 'void main() {\n  float n3 = v3hash(floor(vW3 * 16.0));\n  float d3 = uCut - (vW3.x + n3 * 0.5);\n  if (d3 < 0.0) discard;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.rgb += vec3(0.9, 0.54, 0.58) * (1.0 - smoothstep(0.0, 0.1, d3)) * 1.4;');
  };
  m.customProgramCacheKey = () => 'v3-dissolve';
  return m;
}

// Glowing edge lines. Visible behind the cut, with a bright scan front at the cut itself.
export function lineMaterial(hex: string, opacity: { value: number }, cut: { value: number }, gain = 1) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
    uniforms: { uColor: { value: disp(hex) }, uOpacity: opacity, uCut: cut, uGain: { value: gain } },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity, uCut, uGain;
      varying vec3 vW;
      void main() {
        float d = vW.x - uCut;
        float on = smoothstep(-0.4, 0.15, d);
        float front = exp(-abs(d) * 5.0);
        float a = uOpacity * uGain * (on * 0.75 + front * 1.4);
        gl_FragColor = vec4(uColor * (1.0 + front * 0.6), a);
      }
    `,
  });
}

// Dust points. They twinkle, gather at the cut front, and drift up and apart in the dark chapter.
export function pointMaterial(hex: string, opacity: { value: number }, cut: { value: number }, u: V3Uniforms, size = 3) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
    uniforms: { uColor: { value: disp(hex) }, uOpacity: opacity, uCut: cut, uTime: u.time, uDrift: u.drift, uSize: { value: size } },
    vertexShader: /* glsl */ `
      attribute float aR;
      uniform float uTime, uDrift, uSize, uCut, uOpacity;
      varying float vA;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        float d = w.x - uCut;
        float on = smoothstep(-0.5, 0.3, d);
        vec3 p = w.xyz + vec3(sin(aR * 40.0 + uTime * 0.5), 0.5 + aR * 1.4, cos(aR * 31.0 + uTime * 0.4)) * uDrift * (0.4 + aR * 1.8);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.5 + aR) * clamp(12.0 / -mv.z, 0.35, 3.0);
        float tw = 0.5 + 0.5 * sin(uTime * 2.2 + aR * 70.0);
        vA = uOpacity * (on * (0.35 + 0.65 * tw) + exp(-abs(d) * 4.0) * 1.6);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.0, r));
      }
    `,
  });
}

// The dark tile grid of the last chapter. Ink tiles with thin lit seams, revealed from the centre
// outward, the seams catching light near the middle where the trails land.
export function gridMaterial(u: V3Uniforms) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    uniforms: { uGrid: u.grid, uTime: u.time, uBeam: u.beam, cInk: { value: disp(C.ink) }, cLine: { value: disp(C.white) }, cRed: { value: disp(C.tonedRed) } },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader:
      HASH +
      /* glsl */ `
      uniform float uGrid, uTime, uBeam;
      uniform vec3 cInk, cLine, cRed;
      varying vec3 vW;
      void main() {
        vec2 c0 = vW.xz - vec2(0.6, -0.6);
        vec2 g = c0 / 2.2;
        vec2 cell = floor(g);
        vec2 f = fract(g);
        float r = length(c0);
        float h = v3hash2(cell);
        float hx = v3hash2(cell + 17.0);
        // lit seams, only some edges, like light caught on bevels
        float top = (1.0 - smoothstep(0.0, 0.018, f.y)) * step(0.45, h);
        float side = (1.0 - smoothstep(0.0, 0.018, f.x)) * step(0.5, hx);
        float seam = max(top, side);
        float gap = 1.0 - smoothstep(0.0, 0.03, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
        float fall = exp(-r * 0.05);
        float pulse = 0.75 + 0.25 * sin(uTime * 1.5 + h * 20.0);
        vec3 col = cInk * (0.32 + 0.12 * h) * (1.0 - gap * 0.6);
        col += cLine * seam * fall * 0.8 * pulse;
        col += cRed * gap * fall * 0.18 * uBeam;
        float front = uGrid * 46.0;
        float a = smoothstep(front, front - 6.0, r) * smoothstep(48.0, 30.0, r);
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

// A light trail along a tube. A soft trail behind a hot head that runs to the centre.
export function beamMaterial(u: V3Uniforms, delay: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
    side: THREE.DoubleSide,
    uniforms: { uBeam: u.beam, uOpacity: u.beamOpacity, uDelay: { value: delay }, uColor: { value: disp(C.white) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vF;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vF = abs(dot(n, normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uBeam, uOpacity, uDelay;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vF;
      void main() {
        float head = clamp(uBeam * 1.25 - uDelay, 0.0, 1.0);
        float u = vUv.x;
        float trail = smoothstep(head - 0.7, head, u) * (1.0 - smoothstep(head, head + 0.015, u));
        float tip = exp(-abs(u - head) * 28.0) * step(0.001, head);
        float a = (trail * trail * 0.38 + tip * 1.1) * pow(vF, 2.4) * uOpacity * smoothstep(0.0, 0.25, u);
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
}

// Collects the hard edges of every mesh under root into one world space segment list. Instanced
// meshes contribute one copy per instance. A cache keeps one EdgesGeometry per source geometry.
const edgeCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
function edgesOf(g: THREE.BufferGeometry, angle: number) {
  let e = edgeCache.get(g);
  if (!e) {
    e = new THREE.EdgesGeometry(g, angle);
    edgeCache.set(g, e);
  }
  return e;
}

export function collectEdges(root: THREE.Object3D, angle = 28, relativeTo?: THREE.Object3D) {
  root.updateWorldMatrix(true, true);
  const inv = relativeTo ? relativeTo.matrixWorld.clone().invert() : new THREE.Matrix4();
  const out: number[] = [];
  const v = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const im = new THREE.Matrix4();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.noEdges) return;
    const e = edgesOf(mesh.geometry, angle);
    const pos = e.attributes.position;
    const inst = (mesh as THREE.InstancedMesh).isInstancedMesh ? (mesh as THREE.InstancedMesh) : null;
    const count = inst ? inst.count : 1;
    for (let k = 0; k < count; k++) {
      m.multiplyMatrices(inv, mesh.matrixWorld);
      if (inst) {
        inst.getMatrixAt(k, im);
        m.multiply(im);
      }
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m);
        out.push(v.x, v.y, v.z);
      }
    }
  });
  return new Float32Array(out);
}

// Points spread along a segment list, jittered a little, with a random attribute per point.
export function pointsAlong(seg: Float32Array, step = 0.12, jitter = 0.02, keep = 1) {
  const out: number[] = [];
  const r: number[] = [];
  for (let i = 0; i < seg.length; i += 6) {
    const ax = seg[i], ay = seg[i + 1], az = seg[i + 2];
    const bx = seg[i + 3], by = seg[i + 4], bz = seg[i + 5];
    const len = Math.hypot(bx - ax, by - ay, bz - az);
    const n = Math.max(1, Math.floor(len / step));
    for (let k = 0; k < n; k++) {
      if (Math.random() > keep) continue;
      const t = (k + Math.random()) / n;
      out.push(ax + (bx - ax) * t + (Math.random() - 0.5) * jitter, ay + (by - ay) * t + (Math.random() - 0.5) * jitter, az + (bz - az) * t + (Math.random() - 0.5) * jitter);
      r.push(Math.random());
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1));
  return g;
}

export function segmentsGeometry(seg: Float32Array) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(seg, 3));
  return g;
}

// A soft radial texture for the sun spill on the ground.
export function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
