// The section glow, as the shader stack the Figma file actually describes.
//
// Figma renders this glow through halftone -> lens distortion -> Bayer 16x16
// dither. The CSS layer in Built.css approximates it with a blurred radial
// gradient; this replaces that with the real thing in a WebGL fragment shader,
// matched to the same geometry and the same colour ramp so the design does not
// move — it only gains the grain and the ordered dither it was drawn with.
//
// Everything here is optional. `three` is imported lazily, a context is probed
// for first, and any failure leaves the CSS glow exactly as authored.

export interface GlowLayer {
  canvas: HTMLCanvasElement;
  /** Draws one frame. `t` is seconds, `scroll` is -1..1, `heat` is 0..1. */
  render: (t: number, scroll: number, heat: number) => void;
  resize: () => void;
  dispose: () => void;
}

const VERT = `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// The ramp below is the CSS gradient's stops, and the geometry constants are
// the CSS box solved in pixels, so the two layers land on the same light.
const FRAG = `
precision highp float;

uniform vec2  uRes;     // css pixels of the glow box
uniform float uDpr;     // device pixels per css pixel
uniform float uTime;
uniform float uScroll;  // -1..1, section travel through the viewport
uniform float uHeat;    // 0..1, bloom on entrance / lift on interaction

const vec3 C0 = vec3(1.000, 0.847, 0.722); // #ffd8b8
const vec3 C1 = vec3(0.976, 0.620, 0.341); // #f99e57
const vec3 C2 = vec3(0.820, 0.329, 0.110); // #d1541c
const vec3 C3 = vec3(0.494, 0.008, 0.008); // #7e0202

// Colour ramp of the CSS radial-gradient, by normalised distance from the core.
vec4 ramp(float d) {
  vec3 c;
  float a;
  if (d < 0.14)      { c = mix(C0, C1, smoothstep(0.0, 0.14, d));  a = 1.0; }
  else if (d < 0.30) { c = mix(C1, C2, smoothstep(0.14, 0.30, d)); a = 1.0; }
  else if (d < 0.50) { c = mix(C2, C3, smoothstep(0.30, 0.50, d)); a = 1.0; }
  else               { c = C3; a = 1.0 - smoothstep(0.50, 0.66, d); }
  return vec4(c, a);
}

// Ordered 16x16 Bayer, built from the recursive 2x2 rule so it stays cheap.
float bayer(vec2 p) {
  float sum = 0.0;
  float div = 1.0;
  vec2 q = floor(mod(p, 16.0));
  for (int i = 0; i < 4; i++) {
    vec2 b = mod(q, 2.0);
    div *= 4.0;
    sum += (b.x + 2.0 * b.y * (1.0 - 2.0 * b.x) + 1.0) / div;
    q = floor(q * 0.5);
  }
  return sum - 0.5;
}

void main() {
  vec2 px = gl_FragCoord.xy / uDpr;      // work in css pixels
  vec2 uv = vec2(px.x, uRes.y - px.y);   // top-left origin, like CSS

  // The CSS box: a 900px circle at right:-20% bottom:-46%, rotated -45deg,
  // whose bright core sits 101.8px to the left of the circle's centre.
  float S = min(uRes.x, 1600.0) / 1600.0;
  float R = 900.0 * max(S, 0.62);
  vec2 centre = vec2(uRes.x * 1.2 - R * 0.5, uRes.y * 1.46 - R * 0.5);
  vec2 core = centre + vec2(-0.1131 * R, 0.0);

  // Ambient: the light breathes and drifts instead of sitting still.
  float breath = sin(uTime * 0.31) * 0.5 + sin(uTime * 0.17 + 1.7) * 0.5;
  float swell = 1.0 + 0.045 * breath + 0.09 * uHeat;
  core += vec2(sin(uTime * 0.13) * 26.0, cos(uTime * 0.11) * 18.0 - uScroll * 70.0);

  vec2 d = uv - core;

  // Lens distortion, pinned on the core: the barrel term pushes the outer
  // falloff out and keeps the hot centre tight.
  float extent = 0.820 * R * swell;          // farthest-corner radius of the CSS gradient
  float r = length(d) / extent;
  float k = 0.16 + 0.05 * sin(uTime * 0.09);
  d *= 1.0 - k * r * r;

  float dist = length(d) / extent;
  vec4 g = ramp(dist);

  // Halftone: a rotated dot grid whose dots grow with the local brightness.
  float lum = clamp(1.0 - dist / 0.66, 0.0, 1.0);
  float a = 0.4712389;                        // 27deg
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  float cell = 5.0;
  vec2 hp = rot * (uv + vec2(uTime * 3.0, uTime * -2.0)) / cell;
  vec2 f = fract(hp) - 0.5;
  float dot_ = 1.0 - smoothstep(0.16, 0.5, length(f) / max(lum, 0.001) * 0.5);
  float halftone = mix(1.0, 0.72 + 0.46 * dot_, 0.34 * smoothstep(0.02, 0.5, lum));

  float alpha = g.a * lum * 0.92 * halftone * (0.3 + 0.10 * uHeat + 0.02 * breath);
  vec3 col = g.rgb;

  // Bayer dither, applied before the 8-bit quantise so the falloff bands the
  // way the Figma stack does instead of going smooth-and-plastic.
  float b = bayer(gl_FragCoord.xy) * (1.0 / 40.0);
  col += b;
  alpha += b * 0.5 * step(0.002, alpha);

  gl_FragColor = vec4(col * alpha, clamp(alpha, 0.0, 1.0));
}
`;

/** True when a WebGL context can actually be created and kept. */
function probe(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export async function createGlowLayer(host: HTMLElement): Promise<GlowLayer | null> {
  if (!probe()) return null;

  let THREE: typeof import('three');
  try {
    THREE = await import('three');
  } catch {
    return null;
  }

  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    return null;
  }

  const canvas = renderer.domElement;
  canvas.className = 'built__glow-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  renderer.setClearAlpha(0);

  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: 1 },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uHeat: { value: 0 },
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
  const mesh = new THREE.Mesh(geometry, material);
  // The vertex shader writes clip space directly, so there is no frustum for
  // three to cull against — without this the quad is thrown away.
  mesh.frustumCulled = false;
  scene.add(mesh);

  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    // Put the CSS gradient back rather than leaving a hole where the glow was.
    canvas.remove();
    host.closest('.built')?.classList.remove('built--shaded');
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const resize = () => {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uDpr.value = dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    uniforms.uRes.value.set(w, h);
  };

  host.appendChild(canvas);
  resize();
  renderer.render(scene, camera);
  if (renderer.getContext().isContextLost?.()) {
    canvas.remove();
    renderer.dispose();
    return null;
  }

  return {
    canvas,
    render(t, scroll, heat) {
      if (lost) return;
      uniforms.uTime.value = t;
      uniforms.uScroll.value = scroll;
      uniforms.uHeat.value = heat;
      renderer.render(scene, camera);
    },
    resize,
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.remove();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
}
