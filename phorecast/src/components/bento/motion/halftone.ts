/**
 * A small raw-WebGL layer that reproduces the Figma glow stack the bento cards
 * were designed with: halftone dots → lens distortion → 16×16 Bayer ordered
 * dither. Written against the GL context directly rather than pulling Three.js
 * into the marketing bundle — the whole thing is one full-screen triangle pair
 * and about 40 lines of GLSL.
 *
 * Internal to src/components/bento/motion; onboard.ts and bonus.ts are the
 * public entry points.
 */

export interface HalftoneOptions {
  /** Glow colour, 0–1 linear-ish RGB. */
  color: [number, number, number];
  /** Halftone cell size in CSS px. Smaller = finer dots. */
  cell?: number;
  /** Peak opacity of the layer. */
  alpha?: number;
  /** Strength of the always-on drifting field, 0 = only reacts to the pointer. */
  ambient?: number;
  /** Radius in CSS px of the bloom that follows the pointer. */
  reach?: number;
  /** Lens pinch around the pointer. 0 = flat, .35 = a noticeable bulge. */
  lens?: number;
  /** Clip the field to below a curve supplied as 256 normalised heights. */
  heights?: Float32Array;
}

export interface HalftoneLayer {
  canvas: HTMLCanvasElement;
  /** Tween this — the pointer bloom's strength. */
  hover: { value: number };
  /** Tween this — the ambient field's strength. */
  swell: { value: number };
  /** Pointer position in CSS px relative to the canvas, top-left origin. */
  setPointer(x: number, y: number): void;
  /** Fire an expanding dithered ring from a CSS-px point. */
  ripple(x: number, y: number): void;
  resize(): void;
  render(seconds: number): void;
  dispose(): void;
}

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = (useHeights: boolean) => `
precision mediump float;
uniform vec2  uRes;        // drawing-buffer size, device px
uniform float uDpr;
uniform float uTime;
uniform vec2  uPointer;    // device px, y up
uniform float uHover;
uniform float uSwell;
uniform float uCell;
uniform float uAlpha;
uniform float uLens;
uniform float uReach;
uniform vec3  uColor;
uniform vec3  uRipples[4]; // xy in device px, z = birth time
${useHeights ? 'uniform sampler2D uHeights;' : ''}

/* 16×16 ordered Bayer threshold, built from the 2×2 recursion instead of a
   256-entry lookup: bayer(2n) = 4·bayer(n) on the high bits + {0,2,3,1}. */
float bayer16(vec2 p){
  vec2 q = floor(mod(p, 16.0));
  float v = 0.0;
  float s = 64.0;
  for (int i = 0; i < 4; i++) {
    vec2 b = mod(q, 2.0);
    v += (2.0 * b.x + 3.0 * b.y - 4.0 * b.x * b.y) * s;
    s *= 0.25;
    q = floor(q * 0.5);
  }
  return (v + 0.5) / 256.0;
}

/* Classic halftone: a rotated dot grid whose dot radius tracks intensity. */
float halftone(vec2 css, float v, float cell, float ang){
  float c = cos(ang), s = sin(ang);
  vec2 r = vec2(c * css.x - s * css.y, s * css.x + c * css.y) / cell;
  float d = length(fract(r) - 0.5);
  float radius = sqrt(clamp(v, 0.0, 1.0)) * 0.62;
  return smoothstep(radius, radius - 0.16, d);
}

/* Lens distortion: pull samples toward the pointer so the field magnifies
   under the cursor, falling off smoothly with distance. */
vec2 lens(vec2 p, vec2 c, float reach, float k){
  vec2 d = p - c;
  float r = length(d) / max(reach, 1.0);
  return c + d * (1.0 - k * exp(-r * r * 1.8));
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 css  = frag / uDpr;

  ${useHeights ? `
  // Only paint under the curve; the height texture holds y/height per column.
  float lineY = texture2D(uHeights, vec2(css.x / (uRes.x / uDpr), 0.5)).r * (uRes.y / uDpr);
  float below = (uRes.y / uDpr - css.y) - lineY - 2.0;
  if (below < 0.0) discard;
  ` : ''}

  vec2 warped = lens(frag, uPointer, uReach * uDpr, uLens * uHover);

  // drifting ambient field — two slow blobs on incommensurable periods, so the
  // card never repeats itself inside a screenshot's worth of time
  vec2 a1 = vec2(0.30 + 0.11 * sin(uTime * 0.21), 0.52 + 0.14 * cos(uTime * 0.17)) * uRes;
  vec2 a2 = vec2(0.74 + 0.13 * cos(uTime * 0.127), 0.34 + 0.11 * sin(uTime * 0.109)) * uRes;
  float f = uSwell * (
      smoothstep(0.55 * uRes.x, 0.0, distance(warped, a1)) * 0.85 +
      smoothstep(0.42 * uRes.x, 0.0, distance(warped, a2)) * 0.62);

  // pointer bloom
  f += uHover * smoothstep(uReach * uDpr, 0.0, distance(warped, uPointer)) * 0.95;

  // click rings
  for (int i = 0; i < 4; i++) {
    float born = uRipples[i].z;
    if (born < 0.0) continue;
    float t = uTime - born;
    if (t < 0.0 || t > 1.4) continue;
    float d = distance(frag, uRipples[i].xy);
    f += smoothstep(46.0 * uDpr, 0.0, abs(d - t * 520.0 * uDpr)) * (1.0 - t / 1.4);
  }

  ${useHeights ? 'f *= smoothstep(120.0, 0.0, below);' : ''}

  float v = clamp(f, 0.0, 1.0);
  if (v <= 0.004) discard;

  float a = v * halftone(css, v, uCell, 0.41);
  a *= step(bayer16(frag), v * 1.08);
  if (a <= 0.004) discard;

  gl_FragColor = vec4(uColor, a * uAlpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * Builds the layer and appends its canvas to `host`. Returns null when WebGL
 * is unavailable or the program fails to link — callers fall back to CSS.
 */
export function createHalftone(host: HTMLElement, opts: HalftoneOptions): HalftoneLayer | null {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    zIndex: '0', pointerEvents: 'none', display: 'block',
  });

  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true })
      || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  } catch { gl = null; }
  if (!gl) return null;

  const useHeights = !!opts.heights;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG(useHeights));
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl!.getUniformLocation(prog, n);
  const loc = {
    res: u('uRes'), dpr: u('uDpr'), time: u('uTime'), pointer: u('uPointer'),
    hover: u('uHover'), swell: u('uSwell'), cell: u('uCell'), alpha: u('uAlpha'),
    lens: u('uLens'), reach: u('uReach'), color: u('uColor'), ripples: u('uRipples[0]'),
    heights: u('uHeights'),
  };

  let tex: WebGLTexture | null = null;
  if (opts.heights) {
    const n = opts.heights.length;
    const data = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = Math.max(0, Math.min(255, Math.round(opts.heights[i] * 255)));
      data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
    }
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(loc.heights, 0);
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform3f(loc.color, opts.color[0], opts.color[1], opts.color[2]);
  gl.uniform1f(loc.cell, opts.cell ?? 5.2);
  gl.uniform1f(loc.alpha, opts.alpha ?? 0.5);
  gl.uniform1f(loc.lens, opts.lens ?? 0.34);
  gl.uniform1f(loc.reach, opts.reach ?? 210);

  const hover = { value: 0 };
  const swell = { value: opts.ambient ?? 0.35 };
  const ripples = new Float32Array([0, 0, -99, 0, 0, -99, 0, 0, -99, 0, 0, -99]);
  let slot = 0;
  let dpr = 1;
  let pointer: [number, number] = [-9999, -9999];
  let w = 0, h = 0;
  let clock = 0;

  const resize = () => {
    const r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(r.width * dpr));
    h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    gl!.viewport(0, 0, w, h);
    gl!.uniform2f(loc.res, w, h);
    gl!.uniform1f(loc.dpr, dpr);
  };

  host.prepend(canvas);
  resize();

  return {
    canvas, hover, swell,
    setPointer(x, y) {
      const r = canvas.getBoundingClientRect();
      pointer = [x * dpr, (r.height - y) * dpr];
    },
    ripple(x, y) {
      const r = canvas.getBoundingClientRect();
      ripples[slot * 3] = x * dpr;
      ripples[slot * 3 + 1] = (r.height - y) * dpr;
      ripples[slot * 3 + 2] = clock;
      slot = (slot + 1) % 4;
    },
    resize,
    render(seconds) {
      clock = seconds;
      gl!.useProgram(prog);
      if (tex) { gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, tex); }
      gl!.uniform1f(loc.time, seconds);
      gl!.uniform2f(loc.pointer, pointer[0], pointer[1]);
      gl!.uniform1f(loc.hover, hover.value);
      gl!.uniform1f(loc.swell, swell.value);
      gl!.uniform3fv(loc.ripples, ripples);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    },
    dispose() {
      try {
        gl!.deleteBuffer(buf);
        gl!.deleteProgram(prog);
        gl!.deleteShader(vs);
        gl!.deleteShader(fs);
        if (tex) gl!.deleteTexture(tex);
        const lose = gl!.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      } catch { /* context already gone */ }
      canvas.remove();
    },
  };
}
