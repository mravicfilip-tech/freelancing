// The shader field behind each panel.
//
// Figma builds the glows in these frames out of a ShaderEffect stack —
// halftone, lens distortion, then a Bayer dither — and the CSS approximation in
// Steps.css can only manage a blurred radial gradient. This puts the real thing
// back: a soft field, screened through rotating halftone cells and a 16×16
// ordered dither, drifting slowly under the line work.
//
// It is strictly additive ambience. `three` is imported only when a panel
// actually wants one, the context is probed first, and every failure path
// leaves an empty transparent canvas over the CSS glow that is already there —
// which is the design. Nothing here is loaded at all under reduced motion.

import { REDUCED } from '../../lib/motion';

export interface FieldOptions {
  /** Field colour, 0–1 linear-ish RGB. */
  tint: [number, number, number];
  /** Centre of the field in panel space, 0–1. */
  center: [number, number];
  /** Radius as a fraction of the panel's width. */
  radius: number;
  /** Peak alpha. Kept low — this sits under artwork, it is not the artwork. */
  strength: number;
  /** Halftone cell size in device pixels. */
  cell?: number;
}

const VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// bayer4 is the classic 4×4 matrix; nesting it in itself gives the 16×16
// threshold map the Figma stack uses, without a texture upload.
const FRAG = `
  precision mediump float;
  varying vec2 vUv;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uEnter;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform float uCell;
  uniform vec3 uTint;
  uniform float uStrength;

  float bayer4(vec2 p) {
    vec2 c = mod(floor(p), 4.0);
    float i = c.y * 4.0 + c.x;
    float t = 0.0;
    t += step(abs(i -  0.0), 0.5) *  0.0;  t += step(abs(i -  1.0), 0.5) *  8.0;
    t += step(abs(i -  2.0), 0.5) *  2.0;  t += step(abs(i -  3.0), 0.5) * 10.0;
    t += step(abs(i -  4.0), 0.5) * 12.0;  t += step(abs(i -  5.0), 0.5) *  4.0;
    t += step(abs(i -  6.0), 0.5) * 14.0;  t += step(abs(i -  7.0), 0.5) *  6.0;
    t += step(abs(i -  8.0), 0.5) *  3.0;  t += step(abs(i -  9.0), 0.5) * 11.0;
    t += step(abs(i - 10.0), 0.5) *  1.0;  t += step(abs(i - 11.0), 0.5) *  9.0;
    t += step(abs(i - 12.0), 0.5) * 15.0;  t += step(abs(i - 13.0), 0.5) *  7.0;
    t += step(abs(i - 14.0), 0.5) * 13.0;  t += step(abs(i - 15.0), 0.5) *  5.0;
    return t / 16.0;
  }

  float bayer16(vec2 p) { return (bayer4(p * 0.25) * 16.0 + bayer4(p)) / 16.0; }

  mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }

  void main() {
    vec2 px = vUv * uRes;
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = vec2((vUv.x - uCenter.x) * aspect, vUv.y - uCenter.y);

    // Two slow wobbles so the field never repeats on a visible beat.
    p += vec2(sin(uTime * 0.21) * 0.035, cos(uTime * 0.17) * 0.028);

    float d = length(p) / uRadius;
    // A lens-ish falloff rather than a linear one: bright core, long tail.
    float field = pow(max(0.0, 1.0 - d), 2.2);
    field *= 0.72 + 0.28 * sin(uTime * 0.35 + d * 3.1);

    // Halftone: rotated cells, dot radius driven by the field.
    vec2 cell = rot(0.47 + sin(uTime * 0.06) * 0.09) * px / max(uCell, 2.0);
    vec2 g = fract(cell) - 0.5;
    float dot = 1.0 - smoothstep(0.08, 0.46, length(g) / max(field, 0.001));

    float a = field * dot * uStrength * uEnter;
    // Ordered dither, so the falloff bands the way the Figma stack does.
    a *= step(bayer16(px), clamp(a * 6.0, 0.0, 1.0)) * 0.55 + 0.45;

    if (a <= 0.002) discard;
    gl_FragColor = vec4(uTint * (0.6 + 0.4 * field), a);
  }
`;

/**
 * Mounts the field on `canvas`. Resolves to a disposer; resolves to a no-op
 * disposer if reduced motion is on, WebGL is missing or three fails to load.
 */
export async function mountField(canvas: HTMLCanvasElement, o: FieldOptions): Promise<() => void> {
  const noop = () => {};
  if (REDUCED) return noop;

  // Probe on a throwaway canvas: a failed getContext on the real one would
  // poison it for any later attempt.
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return noop;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return noop;
  }

  let THREE: typeof import('three');
  try {
    THREE = await import('three');
  } catch {
    return noop;
  }
  if (!canvas.isConnected) return noop;

  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    return noop;
  }

  renderer.setClearAlpha(0);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);

  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uEnter: { value: 0 },
    uCenter: { value: new THREE.Vector2(o.center[0], 1 - o.center[1]) },
    uRadius: { value: o.radius },
    uCell: { value: (o.cell ?? 7) * dpr },
    uTint: { value: new THREE.Vector3(...o.tint) },
    uStrength: { value: o.strength },
  };

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(geometry, material));

  const size = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth));
    const h = Math.max(1, Math.round(canvas.clientHeight));
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * dpr, h * dpr);
  };
  size();

  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  // Only runs while the panel is on screen, and at half rate: this is a slow
  // field, and the budget belongs to the line work in front of it.
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  const t0 = performance.now();
  let frame = 0;
  let tick = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    if (!visible || (tick++ & 1)) return;
    const t = (performance.now() - t0) / 1000;
    uniforms.uTime.value = t;
    // The field brightens as the panel assembles, so a swap reads here too.
    uniforms.uEnter.value = Math.min(1, t / 0.9) ** 2;
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    io.disconnect();
    ro.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
