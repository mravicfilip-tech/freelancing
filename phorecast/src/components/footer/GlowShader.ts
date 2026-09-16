// The footer glow, as the Figma frame actually specifies it.
//
// In the file the band is a ShaderEffect stack over four blurred discs:
// halftone -> lens distortion -> Bayer 16x16 ordered dither. The CSS version in
// Footer.css approximates the discs with blurred radial gradients and drops the
// three effects, because CSS has no way to express them. This module does the
// real thing in GLSL, keeping the same four discs in the same places so the band
// still reads as the design, and adds the halftone screen, the lens warp and the
// ordered dither on top — plus a very slow drift, which is what stops the
// footer sitting completely dead at the bottom of the page.
//
// It is strictly an upgrade path: `three` is imported lazily, a WebGL context is
// probed for first, and if anything fails the caller keeps the CSS gradients.
// Nothing here is loaded at all under `prefers-reduced-motion: reduce`.

import type * as THREE_NS from 'three';

export interface GlowHandle {
  /** Re-reads the host box; cheap enough to call on every resize. */
  resize(): void;
  /** One frame. `t` is seconds, `intensity` a 0..1 master level. */
  render(t: number, intensity: number): void;
  dispose(): void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec2  uSize;       // band size in CSS pixels
  uniform float uTime;       // seconds
  uniform float uIntensity;  // master level, 0..1
  varying vec2  vUv;

  // ---- Bayer 16x16, built by recursion rather than a 256-entry lookup -------
  float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
  #define BAYER4(a)  (bayer2(0.5  * (a)) * 0.25 + bayer2(a))
  #define BAYER8(a)  (BAYER4(0.5  * (a)) * 0.25 + bayer2(a))
  #define BAYER16(a) (BAYER8(0.5  * (a)) * 0.25 + bayer2(a))

  // ---- the four discs ------------------------------------------------------
  float disc(vec2 p, vec2 c, float r, float feather) {
    return 1.0 - smoothstep(r - feather, r + feather, distance(p, c));
  }

  void over(inout vec3 col, inout float a, float cover, vec3 c, float o) {
    float k = clamp(cover * o, 0.0, 1.0);
    col = mix(col, c, k);
    a = mix(a, 1.0, k);
  }

  // Geometry mirrors Footer.css: same widths, same offsets, same blur radius,
  // expressed against the band's own pixel box. Breathing is a few pixels of
  // drift per disc, slow enough to read as light rather than as movement.
  vec4 field(vec2 p) {
    float W = uSize.x;
    float t = uTime;
    vec3 col = vec3(0.0);
    float a = 0.0;

    // red: linear-gradient(150deg, #0f0e0d 28%, #8c0303 100%)
    vec2 cRed = vec2(W * 1.14 - 650.0 + sin(t * 0.07) * 26.0, 650.0 + cos(t * 0.05) * 18.0);
    float g = clamp((dot(p - cRed, normalize(vec2(0.5, 0.866))) / 1300.0 + 0.5 - 0.28) / 0.72, 0.0, 1.0);
    vec3 red = mix(vec3(0.059, 0.055, 0.051), vec3(0.549, 0.012, 0.012), g);
    over(col, a, disc(p, cRed, 650.0, 175.0), red, 1.0);

    vec2 cOrange = vec2(-0.06 * W + 700.0 + cos(t * 0.06) * 30.0, 680.0 + sin(t * 0.045) * 22.0);
    over(col, a, disc(p, cOrange, 700.0, 185.0), vec3(0.820, 0.329, 0.110), 0.90);

    vec2 cPeach = vec2(0.12 * W + 650.0 + sin(t * 0.083 + 1.7) * 34.0, 970.0 + cos(t * 0.062) * 26.0);
    over(col, a, disc(p, cPeach, 650.0, 175.0), vec3(0.976, 0.620, 0.341), 0.65);

    vec2 cCream = vec2(0.24 * W + 500.0 + cos(t * 0.095 + 0.6) * 28.0, 1010.0 + sin(t * 0.071) * 20.0);
    over(col, a, disc(p, cCream, 500.0, 155.0), vec3(1.000, 0.918, 0.855), 0.60);

    return vec4(col, a);
  }

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;

    // ---- lens distortion -------------------------------------------------
    // Centred on the bottom middle, where the light source sits, so the band
    // bows outward the way a wide lens renders a bright source near the edge.
    vec2 uv = p / uSize;
    vec2 d = uv - vec2(0.5, 1.25);
    vec2 warped = (vec2(0.5, 1.25) + d * (1.0 + 0.16 * dot(d, d))) * uSize;

    vec4 f = field(warped);
    vec3 col = f.rgb;
    float a = f.a;

    // ---- halftone --------------------------------------------------------
    // A rotated dot screen whose dots grow with local luminance. Mixed at a
    // fraction so it modulates the light rather than posterising it.
    float ca = cos(0.42), sa = sin(0.42);
    vec2 rp = mat2(ca, -sa, sa, ca) * p;
    float cell = 5.0;
    vec2 g2 = mod(rp, cell) - cell * 0.5;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    float rad = cell * 0.62 * sqrt(clamp(lum * 1.35, 0.0, 1.0));
    float dotv = 1.0 - smoothstep(rad - 0.9, rad + 0.9, length(g2));
    col *= mix(1.0, 0.70 + 0.52 * dotv, 0.38);

    col *= uIntensity;
    a *= uIntensity;

    // ---- Bayer 16x16 ordered dither --------------------------------------
    float th = BAYER16(gl_FragCoord.xy) - 0.5;
    col = floor(col * 26.0 + 0.5 + th) / 26.0;
    a = floor(a * 30.0 + 0.5 + th) / 30.0;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), clamp(a, 0.0, 1.0));
  }
`;

/** `?devtools` reports why the shader stood down, matching HeroLogo's convention. */
const DEBUG = typeof window !== 'undefined' && window.location.search.includes('devtools');
const note = (...a: unknown[]) => {
  if (DEBUG) console.warn('[footer glow]', ...a);
};

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    // Give the probe context straight back; browsers cap how many may be live.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export async function createGlow(host: HTMLElement): Promise<GlowHandle | null> {
  if (!hasWebGL()) {
    note('no webgl context available');
    return null;
  }

  let THREE: typeof THREE_NS;
  try {
    THREE = await import('three');
  } catch (e) {
    note('three failed to load', e);
    return null;
  }

  let renderer: THREE_NS.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (e) {
    note('renderer construction failed', e);
    return null;
  }

  // Device pixels, not CSS pixels: an ordered dither is only honest at 1:1.
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // values are already sRGB
  renderer.setClearAlpha(0);

  const canvas = renderer.domElement;
  canvas.className = 'footer__glow-gl';

  const uniforms = {
    uSize: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uIntensity: { value: 1 },
  };
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();

  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    host.removeAttribute('data-gl');
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const resize = () => {
    const w = Math.max(1, Math.round(host.clientWidth));
    const h = Math.max(1, Math.round(host.clientHeight));
    renderer.setSize(w, h, false);
    uniforms.uSize.value.set(w, h);
  };

  host.appendChild(canvas);
  resize();

  // One frame up front: if the driver is going to fail it fails here, before we
  // have told the CSS layer to stand down.
  try {
    renderer.render(scene, camera);
  } catch (e) {
    note('first render failed', e);
    canvas.remove();
    renderer.dispose();
    geometry.dispose();
    material.dispose();
    return null;
  }
  if (renderer.getContext().isContextLost()) {
    note('context lost during first render');
    canvas.remove();
    renderer.dispose();
    geometry.dispose();
    material.dispose();
    return null;
  }
  host.setAttribute('data-gl', 'on');

  return {
    resize,
    render(t, intensity) {
      if (lost) return;
      uniforms.uTime.value = t;
      uniforms.uIntensity.value = intensity;
      renderer.render(scene, camera);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      host.removeAttribute('data-gl');
      canvas.remove();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
