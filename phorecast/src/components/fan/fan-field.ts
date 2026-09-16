/**
 * The arc field.
 *
 * Figma draws this band through a ShaderEffect stack — halftone, then an
 * ordered Bayer dither — and the band is almost nothing but linework, so the
 * honest way to make it feel alive is to light the lines themselves rather
 * than to park decoration on top of them.
 *
 * This is a lazily-loaded WebGL layer that rides the *real* artwork: the arcs
 * are sampled straight off the exported SVG paths with `getPointAtLength`, so
 * every packet of light travels the exact ellipse the designer drew. It adds
 * light and never replaces the DOM arcs, which stay exactly as they were — if
 * there is no WebGL context, or `three` fails to load, nothing is added and
 * the section is the one that shipped.
 */

export interface SampledArc {
  /** x,y pairs in band-relative CSS pixels. */
  pts: Float32Array;
  /** Stroke-gradient weight per sample: 0 at the ends, 1 in the middle. */
  fade: Float32Array;
  /** The `.fan__arcs` box this arc lives in — x, y, w, h in band pixels. */
  clip: [number, number, number, number];
  /** 0 = left group, 1 = right group. Lets the two halves move apart. */
  group: number;
  /** Concentric ring index, 0 = innermost. */
  ring: number;
}

/**
 * Measures the arcs off the hidden draw layer. The layer has to be rendered
 * for `getPointAtLength`/`getBBox` to mean anything, so the caller switches it
 * on around this call.
 */
export function sampleArcs(section: HTMLElement, samples = 168): SampledArc[] {
  const band = section.querySelector<HTMLElement>('.fan__frame');
  if (!band) return [];
  const b = band.getBoundingClientRect();
  const out: SampledArc[] = [];

  section.querySelectorAll<HTMLElement>('.fan__arcs').forEach((groupEl, group) => {
    const g = groupEl.getBoundingClientRect();
    const clip: [number, number, number, number] = [g.left - b.left, g.top - b.top, g.width, g.height];

    groupEl.querySelectorAll<SVGPathElement>('.fan__draw path').forEach((p, ring) => {
      let len = 0;
      try { len = p.getTotalLength(); } catch { return; }
      if (!len) return;
      const box = p.getBBox();
      const m = p.getScreenCTM();
      if (!m || !box.width) return;

      const pts = new Float32Array(samples * 2);
      const fade = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const q = p.getPointAtLength((i / (samples - 1)) * len);
        pts[i * 2] = m.a * q.x + m.c * q.y + m.e - b.left;
        pts[i * 2 + 1] = m.b * q.x + m.d * q.y + m.f - b.top;
        /* The Figma stroke gradient runs transparent -> #FF632A -> transparent
           across the ellipse, which a half-sine tracks closely enough. */
        fade[i] = Math.sin(Math.PI * Math.min(1, Math.max(0, (q.x - box.x) / box.width)));
      }
      out.push({ pts, fade, clip, group, ring });
    });
  });
  return out;
}

export interface FanField {
  /** Canvas is appended to the host the caller passes in. */
  resize(width: number, height: number, arcs: SampledArc[]): void;
  /** `power` fades the whole layer up; pointer is band-relative px, or null. */
  render(time: number, power: number, pointer: [number, number] | null, offA: number, offB: number): void;
  dispose(): void;
}

const VERT = /* glsl */ `
  attribute float aSide, aT, aArc, aFade, aGroup;
  attribute vec4 aClip;
  uniform vec2 uRes;
  uniform vec2 uOffA, uOffB;
  varying float vSide, vT, vArc, vFade;
  varying vec2 vPos;
  varying vec4 vClip;
  void main() {
    vSide = aSide; vT = aT; vArc = aArc; vFade = aFade; vClip = aClip;
    /* The DOM arcs slide with scroll and the cursor; the field slides with
       them so a packet never leaves its line. The clip box does not move —
       that is the band the artwork is windowed through. */
    vec2 p = position.xy + (aGroup < 0.5 ? uOffA : uOffB);
    vPos = p;
    vec2 c = p / uRes * 2.0 - 1.0;
    gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime, uPower;
  uniform vec2 uPointer;
  uniform float uHasPointer;
  varying float vSide, vT, vArc, vFade;
  varying vec2 vPos;
  varying vec4 vClip;

  /* Ordered dither, built up 2x2 -> 16x16 the usual recursive way. */
  float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
  float bayer16(vec2 a) {
    float b = bayer2(a);
    b = bayer2(a * 0.5) * 0.25 + b;
    b = bayer2(a * 0.25) * 0.0625 + b;
    b = bayer2(a * 0.125) * 0.015625 + b;
    return b / 1.328125;
  }

  void main() {
    /* Window each arc to its own group box, and reproduce the band's top and
       bottom mask in the shader so the two always agree. */
    vec2 g = (vPos - vClip.xy) / vClip.zw;
    if (g.x < -0.02 || g.x > 1.02 || g.y < 0.0 || g.y > 1.0) discard;
    float mask = smoothstep(0.0, 0.18, g.y) * smoothstep(1.0, 0.82, g.y);
    if (mask <= 0.0) discard;

    float core = exp(-vSide * vSide * 5.5);

    /* Packets of light running the line, each arc on its own speed and phase
       so the field never falls into step with itself. */
    float sp = 0.050 + 0.034 * fract(vArc * 0.3713);
    float ph = fract(vArc * 0.6180);
    float u1 = fract(vT - uTime * sp + ph);
    float p1 = exp(-pow(min(u1, 1.0 - u1) / 0.028, 2.0));
    float u2 = fract(vT - uTime * sp * 0.61 + ph * 1.73 + 0.5);
    float p2 = 0.5 * exp(-pow(min(u2, 1.0 - u2) / 0.052, 2.0));
    /* and a low travelling shimmer, so the whole line reads as carrying current */
    float flow = 0.15 + 0.085 * sin(vT * 74.0 - uTime * 1.6 + vArc * 2.4);

    float lift = 1.0;
    if (uHasPointer > 0.5) {
      float d = length(vPos - uPointer);
      lift += 1.7 * exp(-d * d / 24000.0);
    }

    float i = (p1 + p2 + flow) * core * vFade * mask * uPower * lift;

    /* Halftone: a rotated dot screen, mixed with the smooth value rather than
       replacing it, which is how the Figma stack reads at this scale. */
    const float CA = 0.9659, SA = 0.2588;
    vec2 hp = mat2(CA, -SA, SA, CA) * vPos / 3.4;
    vec2 f = fract(hp) - 0.5;
    float dots = 1.0 - smoothstep(0.0, 0.52, length(f) / max(0.06, sqrt(clamp(i, 0.0, 1.0))));
    i = mix(i, i * dots, 0.42);

    if (i <= 0.002) discard;

    vec3 col = mix(vec3(1.0, 0.388, 0.165), vec3(1.0, 0.86, 0.70), smoothstep(0.45, 1.5, i));
    /* Bayer-dithered 6-bit quantise for the grain the design already has. */
    float b = (bayer16(gl_FragCoord.xy) - 0.5) / 64.0;
    vec3 rgb = floor((col * i + b) * 64.0 + 0.5) / 64.0;
    gl_FragColor = vec4(max(rgb, 0.0), clamp(i, 0.0, 1.0));
  }
`;

export async function createFanField(host: HTMLElement, maxDpr = 2): Promise<FanField | null> {
  /* Probe before paying for the import: a machine with no context should cost
     nothing at all. */
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;
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
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  canvas.className = 'fan__field-canvas';
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uPower: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uHasPointer: { value: 0 },
    uOffA: { value: new THREE.Vector2(0, 0) },
    uOffB: { value: new THREE.Vector2(0, 0) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  let mesh: import('three').Mesh | null = null;

  const build = (arcs: SampledArc[]) => {
    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh = null;
    }
    if (!arcs.length) return;

    const n = arcs[0].pts.length / 2;
    const verts = arcs.length * n * 2;
    const position = new Float32Array(verts * 3);
    const aSide = new Float32Array(verts);
    const aT = new Float32Array(verts);
    const aArc = new Float32Array(verts);
    const aFade = new Float32Array(verts);
    const aGroup = new Float32Array(verts);
    const aClip = new Float32Array(verts * 4);
    const index = new Uint32Array(arcs.length * (n - 1) * 6);

    const HALF = 7.5; // ribbon half-width in CSS px; the glow lives in here
    let v = 0;
    let ix = 0;
    arcs.forEach((arc, ai) => {
      const base = v;
      for (let i = 0; i < n; i++) {
        const p = Math.min(n - 1, i + 1);
        const m = Math.max(0, i - 1);
        let tx = arc.pts[p * 2] - arc.pts[m * 2];
        let ty = arc.pts[p * 2 + 1] - arc.pts[m * 2 + 1];
        const l = Math.hypot(tx, ty) || 1;
        tx /= l; ty /= l;
        for (let s = 0; s < 2; s++, v++) {
          const side = s ? 1 : -1;
          position[v * 3] = arc.pts[i * 2] + -ty * HALF * side;
          position[v * 3 + 1] = arc.pts[i * 2 + 1] + tx * HALF * side;
          aSide[v] = side;
          aT[v] = i / (n - 1);
          aArc[v] = ai;
          aFade[v] = arc.fade[i];
          aGroup[v] = arc.group;
          aClip.set(arc.clip, v * 4);
        }
      }
      for (let i = 0; i < n - 1; i++) {
        const a = base + i * 2;
        index[ix++] = a; index[ix++] = a + 1; index[ix++] = a + 2;
        index[ix++] = a + 1; index[ix++] = a + 3; index[ix++] = a + 2;
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geo.setAttribute('aSide', new THREE.BufferAttribute(aSide, 1));
    geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
    geo.setAttribute('aArc', new THREE.BufferAttribute(aArc, 1));
    geo.setAttribute('aFade', new THREE.BufferAttribute(aFade, 1));
    geo.setAttribute('aGroup', new THREE.BufferAttribute(aGroup, 1));
    geo.setAttribute('aClip', new THREE.BufferAttribute(aClip, 4));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.setDrawRange(0, ix);
    mesh = new THREE.Mesh(geo, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
  };

  return {
    resize(width, height, arcs) {
      renderer.setPixelRatio(Math.min(maxDpr, window.devicePixelRatio || 1));
      renderer.setSize(width, height, false);
      uniforms.uRes.value.set(width, height);
      build(arcs);
    },
    render(time, power, pointer, offA, offB) {
      uniforms.uTime.value = time;
      uniforms.uPower.value = power;
      uniforms.uHasPointer.value = pointer ? 1 : 0;
      if (pointer) uniforms.uPointer.value.set(pointer[0], pointer[1]);
      uniforms.uOffA.value.set(offA, 0);
      uniforms.uOffB.value.set(offB, 0);
      renderer.render(scene, camera);
    },
    dispose() {
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
      }
      material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
