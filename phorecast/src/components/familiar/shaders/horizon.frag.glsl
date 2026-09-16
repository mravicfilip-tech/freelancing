// The horizon band, in the design's own language.
//
// Figma renders this glow through a shader stack — halftone, lens distortion,
// Bayer dithering — and the CSS version is a blurred ellipse standing in for it.
// This layer puts the stack back: it reconstructs the field above the horizon
// curve, distorts it through a barrel lens, screens a rotated halftone grid over
// it and quantises the result through a 16x16 ordered dither. It is composited
// with `mix-blend-mode: screen` on top of the CSS glow, so it adds the grain and
// the crest bloom rather than replacing the silhouette: with no WebGL context the
// section is exactly the static design.

precision highp float;

varying vec2 vUv;

uniform vec2 uRes;      // canvas size, CSS pixels
uniform float uTime;    // seconds
uniform float uBloom;   // 0 -> 1, the entrance
uniform float uBreath;  // -1 -> 1, the slow swell
uniform float uCrest;   // y of the horizon crest at centre, CSS px from the top
uniform float uRx;      // horizon ellipse radii, CSS px
uniform float uRy;
uniform vec3 uWarm;     // colour at the crest
uniform vec3 uDeep;     // colour at the edge of the field

// Ordered dither, built up from the 2x2 Bayer cell: 2 -> 4 -> 8 -> 16.
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
#define BAYER4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
#define BAYER8(a) (BAYER4(0.5 * (a)) * 0.25 + bayer2(a))
#define BAYER16(a) (BAYER8(0.5 * (a)) * 0.25 + bayer2(a))

void main() {
  // three's uv has its origin bottom left; the layout thinks in pixels from the top.
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;

  // Lens: barrel distortion around the centre of the glow, just under the crest.
  vec2 centre = vec2(uRes.x * 0.5, uCrest);
  vec2 d = (px - centre) / uRes.y;
  px += (px - centre) * dot(d, d) * 0.06;

  // The field above the horizon. The curve is the top of the same ellipse the
  // stylesheet draws, so the halftone follows the crest rather than a flat line.
  float x = px.x - uRes.x * 0.5;
  float t = clamp(abs(x) / uRx, 0.0, 1.0);
  float crest = uCrest + uRy * (1.0 - sqrt(1.0 - t * t));
  float above = crest - px.y;

  float swell = 1.0 + 0.16 * uBreath;
  float v = exp(-max(above, 0.0) / (86.0 * swell));
  v *= smoothstep(0.0, 22.0, above);                    // nothing below the crest
  v *= mix(0.22, 1.0, exp(-pow(abs(x) / 700.0, 2.0)));  // brightest at centre
  v *= smoothstep(0.0, 64.0, px.y);                     // no seam at the band edge

  // Halftone: a rotated grid whose dots grow with the field, drifting upward.
  const float ANG = 0.42;
  mat2 rot = mat2(cos(ANG), -sin(ANG), sin(ANG), cos(ANG));
  vec2 cell = rot * (px + vec2(uTime * 3.0, uTime * -7.0)) / 7.0;
  float dist = length(fract(cell) - 0.5);
  float radius = 0.54 * sqrt(clamp(v, 0.0, 1.0));
  float dots = smoothstep(radius, radius - 0.16, dist);

  // Ordered dither, so the falloff bands the way the Figma stack does.
  float levels = 7.0;
  float q = floor(v * levels + BAYER16(px)) / levels;

  float ink = mix(q, q * dots, 0.62);
  vec3 col = mix(uDeep, uWarm, clamp(v * 1.25, 0.0, 1.0));
  float a = clamp(ink, 0.0, 1.0) * 0.42 * uBloom * (0.86 + 0.14 * uBreath);

  // Premultiplied: the renderer composites with "over", the element screens.
  gl_FragColor = vec4(col * a, a);
}
