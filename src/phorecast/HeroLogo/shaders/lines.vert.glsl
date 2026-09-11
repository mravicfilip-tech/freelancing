// One quad per line segment, widened in screen space to a pixel width (see LogoScene.ts).
attribute vec3 aStart;
attribute vec3 aEnd;
attribute vec2 aT;         // path parameter (0-1) at the start / end of the segment
attribute vec2 aIntensity; // brightness at the start / end
attribute float aDelay;    // 0-1: how late this segment joins the draw-in

uniform vec2 uResolution;  // drawing-buffer size, device pixels
uniform float uWidth;      // line width, device pixels
uniform float uFeather;    // anti-alias margin, device pixels
uniform float uSpread;     // z multiplier: 1 at rest, > 1 pulls the slices apart

varying float vAcross;     // -1..1 across the line
varying float vT;
varying float vIntensity;
varying float vDelay;
varying float vViewZ;

void main() {
  vec3 s = vec3(aStart.xy, aStart.z * uSpread);
  vec3 e = vec3(aEnd.xy, aEnd.z * uSpread);
  vec4 vs = modelViewMatrix * vec4(s, 1.0);
  vec4 ve = modelViewMatrix * vec4(e, 1.0);
  vec4 cs = projectionMatrix * vs;
  vec4 ce = projectionMatrix * ve;

  // Direction of the segment on screen, in pixels.
  vec2 hres = uResolution * 0.5;
  vec2 ps = cs.xy / cs.w * hres;
  vec2 pe = ce.xy / ce.w * hres;
  vec2 dir = pe - ps;
  float len = length(dir);
  dir = len > 1e-4 ? dir / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);

  // position.x walks along the segment (0-1), position.y across it (-1..1). Butt caps: neighbouring
  // segments share an edge exactly, so the additive blend does not double up at the joins.
  vec4 clip = mix(cs, ce, position.x);
  vec2 offset = nrm * position.y * (uWidth + uFeather) * 0.5;
  clip.xy += offset / hres * clip.w;
  gl_Position = clip;

  vAcross = position.y;
  vT = mix(aT.x, aT.y, position.x);
  vIntensity = mix(aIntensity.x, aIntensity.y, position.x);
  vDelay = aDelay;
  vViewZ = mix(vs.z, ve.z, position.x);
}
