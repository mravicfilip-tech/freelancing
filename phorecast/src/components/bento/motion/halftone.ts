/**
 * The Figma glow stack, as an actual shader instead of a CSS blur: a drifting
 * field → halftone dots → lens distortion → 16×16 Bayer ordered dither.
 *
 * Written against a raw WebGL context rather than pulling Three.js into the
 * marketing bundle — it is one full-screen triangle and about 40 lines of GLSL.
 * It is ambient only, by MOTION.md: there is no pointer input of any kind.
 *
 * Internal to src/components/bento/motion; onboard.ts and bonus.ts are the
 * public entry points.
 */

export interface HalftoneOptions {
  /** Glow colour, 0–1 RGB. */
  color: [number, number, number];
  /** Halftone cell size in CSS px. Smaller = finer dots. */
  cell?: number;
  /** Peak opacity of the layer. */
  alpha?: number;
  /** Starting strength of the drifting field. Tween `swell` to breathe it. */
  ambient?: number;
  /** Barrel strength of the lens stage, 0–0.4. */
  lens?: number;
  /** Clip the field to below a curve, as N normalised heights across the width. */
  heights?: Float32Array;
}

export interface HalftoneLayer {
  canvas: HTMLCanvasElement;
  /** Tween this — the field's strength. The only input the layer has. */
  swell: { value: number };
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
uniform float uSwell;
uniform float uCell;
uniform float uAlpha;
uniform float uLens;
uniform vec3  uColor;
${useHeights ? 'uniform sampler2D uHeights;' : ''}

/* 16×16 ordered Bayer threshold, built from the 2×2 recursion rather than a
   256-entry lookup: each bit pair contributes {0,2,3,1} at a falling weight. */
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

/* Lens distortion about the centre of the layer, breathing on its own slow
   period so the field never sits still. */
vec2 lens(vec2 p, vec2 c, float k){
  vec2 d = (p - c) / max(c.x, 1.0);
  return c + (p - c) * (1.0 - k * (1.0 - dot(d, d)));
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

  vec2 centre = uRes * 0.5;
  float k = uLens * (0.55 + 0.45 * sin(uTime * 0.19));
  vec2 warped = lens(frag, centre, k);

  // two slow blobs on mismatched periods, so the field never repeats inside a
  // screenshot's worth of time
  vec2 a1 = vec2(0.30 + 0.11 * sin(uTime * 0.153), 0.52 + 0.14 * cos(uTime * 0.117)) * uRes;
  vec2 a2 = vec2(0.74 + 0.13 * cos(uTime * 0.091), 0.34 + 0.11 * sin(uTime * 0.073)) * uRes;
  float f = uSwell * (
      smoothstep(0.55 * uRes.x, 0.0, distance(warped, a1)) * 0.9 +
      smoothstep(0.42 * uRes.x, 0.0, distance(warped, a2)) * 0.65);

  ${useHeights ? 'f *= smoothstep(130.0, 0.0, below);' : ''}

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
 * Builds the layer and prepends its canvas to `host`. Returns null when WebGL
 * is unavailable or the program fails to link — callers simply run without it.
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
    res: u('uRes'), dpr: u('uDpr'), time: u('uTime'), swell: u('uSwell'),
    cell: u('uCell'), alpha: u('uAlpha'), lens: u('uLens'), color: u('uColor'),
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
  gl.uniform1f(loc.alpha, opts.alpha ?? 0.45);
  gl.uniform1f(loc.lens, opts.lens ?? 0.18);

  const swell = { value: opts.ambient ?? 0.28 };

  const resize = () => {
    const r = host.getBoundingClientRect();
    // DPR capped at 2, per MOTION.md
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl!.viewport(0, 0, w, h);
    gl!.uniform2f(loc.res, w, h);
    gl!.uniform1f(loc.dpr, dpr);
  };

  host.prepend(canvas);
  resize();

  return {
    canvas, swell, resize,
    render(seconds) {
      gl!.useProgram(prog);
      if (tex) { gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, tex); }
      gl!.uniform1f(loc.time, seconds);
      gl!.uniform1f(loc.swell, swell.value);
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
