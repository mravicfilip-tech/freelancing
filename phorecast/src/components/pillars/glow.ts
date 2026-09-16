// The Pillars background glow, as GLSL.
//
// In Figma this frame's glow is a ShaderEffect stack — four stacked discs, then
// halftone, lens distortion and a Bayer 16x16 ordered dither. The CSS version in
// Pillars.css approximates the discs with blurred radial gradients and loses the
// whole second half of the stack. This module renders the real thing.
//
// It is strictly an upgrade path: the CSS layer is the baseline and stays in the
// DOM. `mountGlow` probes for a context, resolves to null if there is not one,
// and hands back a handle that puts the CSS layer back if the context is ever
// lost. Nothing here is on the critical path for the section being readable.

import { gsap } from 'gsap';

/** Disc geometry copied from Pillars.css, in design px from the section's top left. */
const R = 769.5; // 1539 / 2
const DISCS: Array<{ c: [number, number]; a: [number, number, number]; b?: [number, number, number] }> = [
  // .pillars__g--red: linear-gradient(168deg, #0f0e0d 30%, #7e0202 100%)
  { c: [1004 + R, -1032 + R], a: [0.059, 0.055, 0.051], b: [0.494, 0.008, 0.008] },
  { c: [1018 + R, -1369 + R], a: [0.820, 0.329, 0.110] }, // --orange #d1541c
  { c: [702 + R, -1490 + R], a: [0.976, 0.620, 0.341] },  // --peach  #f99e57
  { c: [1002 + R, -1647 + R], a: [1.0, 0.918, 0.855] },   // --cream  #ffeada
];

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2  uSize;      // section box in css px
  uniform float uTime;
  uniform float uHalftone;  // 0..1 strength
  uniform float uDither;    // 0..1 strength
  uniform float uDpr;

  uniform vec2 uC[4];
  uniform vec3 uA[4];
  uniform vec3 uB0;         // second stop of disc 0's gradient

  // CSS blur(109px) on a hard edge lands close to a smoothstep over ~1.8 sigma.
  const float SIGMA = 109.0;
  const float R     = 769.5;

  // Ordered Bayer built by the 2x2 recursion, four levels deep = 16x16.
  float bayer16(vec2 p) {
    vec2 q = floor(mod(p, 16.0));
    float v = 0.0;
    float f = 1.0 / 4.0;
    for (int i = 0; i < 4; i++) {
      vec2 b = mod(q, 2.0);
      float idx = b.x + 2.0 * b.y;
      float cell = idx < 0.5 ? 0.0 : idx < 1.5 ? 2.0 : idx < 2.5 ? 3.0 : 1.0;
      v += cell * f;
      f *= 0.25;
      q = floor(q * 0.5);
    }
    return v; // 0..~1
  }

  // Classic rotated-grid halftone: each cell holds a dot whose radius follows
  // the local luminance, so light areas open up and dark areas close over.
  float halftone(vec2 p, float lum, float cellPx, float angle) {
    float c = cos(angle), s = sin(angle);
    vec2 q = mat2(c, -s, s, c) * p / cellPx;
    vec2 cell = fract(q) - 0.5;
    float d = length(cell) * 2.0;
    float r = sqrt(clamp(1.0 - lum, 0.0, 1.0));
    float aa = 2.0 / cellPx;
    return smoothstep(r - aa, r + aa, d);
  }

  float disc(vec2 p, vec2 c, float grow) {
    float d = length(p - c);
    float e = 1.8 * SIGMA;
    return smoothstep(R + grow + e, R + grow - e, d);
  }

  void main() {
    vec2 px = vUv * uSize;
    px.y = uSize.y - px.y;              // three's uv origin is bottom left

    // Lens distortion, pulled around the glow's own centre of mass.
    vec2 focus = vec2(uSize.x * 0.86, -uSize.y * 0.35);
    vec2 d = (px - focus) / max(uSize.x, uSize.y);
    float k = 0.09 + 0.02 * sin(uTime * 0.17);
    vec2 wp = focus + (px - focus) * (1.0 + k * dot(d, d));

    // Four discs, composited bottom up exactly as the stacked spans are.
    vec3 col = vec3(0.0);
    float alpha = 0.0;

    for (int i = 0; i < 4; i++) {
      float breathe = 26.0 * sin(uTime * 0.11 + float(i) * 1.7);
      float a = disc(wp, uC[i], breathe);
      vec3 tint = uA[i];
      if (i == 0) {
        // 168deg linear-gradient across the disc, 30% -> 100%
        vec2 g = normalize(vec2(sin(radians(168.0)), -cos(radians(168.0))));
        float t = dot(wp - uC[i], g) / (2.0 * R) + 0.5;
        tint = mix(uA[0], uB0, smoothstep(0.3, 1.0, t));
      }
      col = mix(col, tint, a);
      alpha = alpha + a * (1.0 - alpha);
    }

    // Halftone, weighted by luminance so it bites in the mid tones and leaves
    // the hot core and the empty corners alone.
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    float cellPx = 2.9 + 0.7 * sin(uTime * 0.09);
    float ht = halftone(px * uDpr, lum, cellPx * uDpr, radians(27.0));
    float bite = uHalftone * smoothstep(0.02, 0.26, lum) * (1.0 - smoothstep(0.58, 0.96, lum));
    // Centred on 1.0 so the screen adds texture without dimming the field.
    col = mix(col, col * (0.80 + 0.40 * ht), bite);

    // Ordered dither, which is what keeps a wide dark gradient from banding.
    float b = bayer16(gl_FragCoord.xy) - 0.5;
    col += b * uDither;
    alpha += b * uDither * 0.6;

    gl_FragColor = vec4(max(col, 0.0), clamp(alpha, 0.0, 1.0));
  }
`;

export interface GlowHandle {
  /**
   * Draw one frame. The caller passes the box it has already measured this
   * frame, so this never reads layout back after the loop has written to it.
   */
  render(timeSeconds: number, rect: DOMRectReadOnly): void;
  dispose(): void;
}

export async function mountGlow(
  host: HTMLElement,
  cssLayer: HTMLElement[],
  canvas: HTMLCanvasElement,
): Promise<GlowHandle | null> {
  // Probe on a throwaway canvas first: a machine with no GL should never get as
  // far as downloading three.
  try {
    const probe = document.createElement('canvas');
    const ctx = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!ctx) return null;
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return null;
  }

  let THREE: typeof import('three');
  try {
    THREE = await import('three');
  } catch {
    return null;
  }

  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  const uniforms = {
    uSize: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uHalftone: { value: 0.30 },
    uDither: { value: 0.016 },
    uDpr: { value: 1 },
    uC: { value: DISCS.map((d) => new THREE.Vector2(d.c[0], d.c[1])) },
    uA: { value: DISCS.map((d) => new THREE.Vector3(...d.a)) },
    uB0: { value: new THREE.Vector3(...(DISCS[0].b as [number, number, number])) },
  };

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms,
      transparent: true, depthTest: false, depthWrite: false,
      // The shader composites the four discs itself and hands back colour that
      // is already multiplied by coverage, which is what this flag expects.
      premultipliedAlpha: true,
    }),
  );
  mesh.frustumCulled = false;
  scene.add(mesh);

  let disposed = false;
  let w = 0;
  let h = 0;

  const resize = (r: DOMRectReadOnly) => {
    const nw = Math.max(1, Math.round(r.width));
    const nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uSize.value.set(w, h);
    uniforms.uDpr.value = dpr;
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    // Hand the section back to the CSS glow rather than leaving a dead canvas.
    gsap.set(canvas, { opacity: 0 });
    gsap.set(cssLayer, { opacity: 1 });
  };
  canvas.addEventListener('webglcontextlost', onLost);

  resize(host.getBoundingClientRect());
  uniforms.uTime.value = 0;
  renderer.render(scene, camera);

  // Swap the CSS discs out for the shader. Slightly offset so the two never sum
  // to a brighter frame than either alone.
  gsap.to(cssLayer, { opacity: 0, duration: 0.5, ease: 'power2.inOut' });
  gsap.to(canvas, { opacity: 1, duration: 0.5, ease: 'power2.inOut', delay: 0.06 });

  return {
    render(t, rect) {
      if (disposed) return;
      resize(rect);
      uniforms.uTime.value = t;
      renderer.render(scene, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onLost);
      mesh.geometry.dispose();
      (mesh.material as import('three').ShaderMaterial).dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      gsap.set([...cssLayer, canvas], { clearProps: 'opacity' });
    },
  };
}
