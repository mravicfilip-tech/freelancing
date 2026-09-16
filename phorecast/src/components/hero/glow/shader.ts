// The hero glow, as the Figma file actually builds it: a stack of soft discs
// run through a halftone screen, a lens warp and a 16x16 Bayer ordered dither.
// The CSS in Hero.css approximates the same stack with blurred radial
// gradients and stays as the fallback; this is the real thing.
//
// Everything is computed in design space — the 1920 x 1080 frame the hero was
// drawn in — so the disc coordinates below are the same numbers as the CSS.

export const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2  uRes;        // drawing-buffer size, px
  uniform float uPixel;      // device pixels per CSS px
  uniform float uUnit;       // CSS px per design px
  uniform float uTime;       // seconds
  uniform float uIntro;      // 0 -> 1 entrance bloom
  uniform float uScroll;     // 0 at rest, 1 when the hero has left
  uniform float uDepth;      // pointer depth, -1..1 on each axis
  uniform vec2  uPointer;    // pointer in design space
  uniform float uPointerIn;  // 0..1, is the pointer over the hero
  uniform float uX[5];       // per-disc left edge, design px (slide anchored)
  uniform float uBreath;     // ambient 0..1
  uniform float uFade;       // master opacity

  const vec3 BG     = vec3(0.059, 0.055, 0.051);  // #0f0e0d
  const vec3 EMBER_A = vec3(0.059, 0.055, 0.051); // #0f0e0d
  const vec3 EMBER_B = vec3(0.494, 0.008, 0.008); // #7e0202
  const vec3 ORANGE = vec3(0.878, 0.345, 0.110);  // #e0581c
  const vec3 CORE   = vec3(1.000, 0.478, 0.227);  // #ff7a3a
  const vec3 PEACH  = vec3(0.976, 0.620, 0.341);  // #f99e57
  const vec3 CREAM  = vec3(1.000, 0.918, 0.855);  // #ffeada

  /* A CSS blurred disc. A CSS blur of radius b is a gaussian of sigma b/2,
     whose edge profile is an erf; tanh is within a percent of it and costs one
     instruction. Keeping the long tails is what makes this read as the CSS
     stack rather than as a hard-edged circle. */
  float disc(vec2 p, vec2 c, vec2 r, float blur) {
    vec2 q = (p - c) / r;
    float e = (length(q) - 1.0) * min(r.x, r.y);
    return 0.5 - 0.5 * tanh(1.7 * e / blur);
  }

  /* Recursive Bayer matrix — bayer16 is four levels of the 2x2 kernel. */
  float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
  float bayer16(vec2 a) { return bayer8(0.5 * a) * 0.25 + bayer2(a); }

  /* Photoshop soft-light, the blend mode the halftone layer uses in Figma. */
  vec3 softLight(vec3 a, vec3 b) {
    return mix(2.0 * a * b + a * a * (1.0 - 2.0 * b),
               2.0 * a * (1.0 - b) + sqrt(a) * (2.0 * b - 1.0),
               step(0.5, b));
  }

  void main() {
    /* CSS pixels, then design pixels with y measured from the top of the layer. */
    vec2 css = vec2(vUv.x, 1.0 - vUv.y) * uRes / uPixel;
    vec2 p = css / uUnit;

    /* Lens distortion: a gentle barrel around the sun, pulled by the pointer.
       This is the "lens" pass of the Figma shader stack. */
    vec2 sun = vec2(uX[1] + 769.5, 1590.5);
    vec2 d = (p - sun) / 1600.0;
    float k = 0.028 + 0.014 * sin(uTime * 0.21) + 0.022 * uDepth;
    p += d * dot(d, d) * k * 1600.0;

    /* Ambient: the whole field breathes, and drifts a little with the pointer
       and with scroll, so the hero is never sitting still. */
    float breath = 1.0 + 0.016 * sin(uTime * 0.31) + 0.008 * sin(uTime * 0.53 + 1.7);
    p -= vec2(uPointer.x * 0.012, uPointer.y * 0.008) * uPointerIn * 90.0;
    p.y -= uScroll * 150.0;

    float bloom = mix(0.86, 1.0, uIntro);
    vec2 pivot = vec2(uX[1] + 769.5, 1400.0);
    p = pivot + (p - pivot) / (breath * bloom);

    vec3 col = BG;

    /* 1. ember — a dark red disc, its own 170deg gradient inside. */
    vec2 emberC = vec2(uX[0] + 769.5, 494.0 + 769.5);
    float aEmber = disc(p, emberC, vec2(769.5), 110.0);
    float g = clamp(((p.y - emberC.y) / 1539.0 + 0.5 - 0.2) / 0.4, 0.0, 1.0);
    col = mix(col, mix(EMBER_A, EMBER_B, g), aEmber);

    /* 2. peach spill. */
    col = mix(col, PEACH, disc(p, vec2(uX[3] + 769.5, 952.0 + 769.5), vec2(769.5), 110.0) * 0.85);

    /* 3. the sun, screened through the halftone. */
    float aSun = disc(p, vec2(uX[1] + 769.5, 821.0 + 769.5), vec2(769.5), 110.0);
    float cell = 6.0 * uPixel;
    vec2 gridUv = fract(gl_FragCoord.xy / cell) - 0.5;
    float dot9 = 1.0 - smoothstep(0.13, 0.26, length(gridUv));
    vec3 sunCol = softLight(ORANGE, mix(vec3(0.5), vec3(1.0, 0.88, 0.78), dot9 * 0.5));
    col = mix(col, sunCol, aSun);

    /* 4. hot core, with the breathing carried in its opacity. */
    float aCore = disc(p, vec2(uX[2] + 600.0, 860.0 + 350.0), vec2(600.0, 350.0), 90.0);
    col = mix(col, CORE, aCore * (0.55 + 0.05 * sin(uTime * 0.37 + 0.9) * uBreath));

    /* 5. cream rim. */
    col = mix(col, CREAM, disc(p, vec2(uX[4] + 769.5, 1109.0 + 769.5), vec2(769.5), 110.0));

    /* A slow specular band travelling across the sun, and a soft light that
       follows the pointer. Both ride on the glow, never on the black. */
    float lit = max(aSun, aCore);
    float sweepX = mix(-900.0, 2900.0, fract(uTime * 0.042));
    float sweep = exp(-pow((p.x - sweepX) / 460.0, 2.0));
    col += vec3(1.0, 0.72, 0.48) * sweep * lit * 0.10;
    float lamp = exp(-length(p - uPointer) / 460.0);
    col += vec3(1.0, 0.60, 0.33) * lamp * uPointerIn * 0.07 * (0.25 + lit);

    /* 6. the horizon that cuts the whole stack. */
    col = mix(col, BG, disc(p, vec2(924.0, 892.0 + 1334.0), vec2(3018.0, 1334.0), 50.0));

    /* Ordered dither: quantise to a shallow palette against the Bayer matrix so
       the gradients band the way the Figma render does, rather than smearing. */
    float th = bayer16(gl_FragCoord.xy / max(uPixel, 1.0));
    float levels = 46.0;
    col = floor(col * levels + th) / levels;

    gl_FragColor = vec4(col, uFade);
  }
`;
