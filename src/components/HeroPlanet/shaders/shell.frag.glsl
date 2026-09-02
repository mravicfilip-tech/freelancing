// Solid sphere: ink → indigo by light, fresnel rim, soft top-left highlight.
precision highp float;

uniform vec3  uColorDark;
uniform vec3  uColorLight;
uniform vec3  uColorRim;
uniform vec3  uLightDir;
uniform float uSpecular;
uniform float uProgress;

varying vec3 vN;
varying vec3 vV;

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  vec3 L = normalize(uLightDir);
  float lit = clamp(dot(N, L), 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
  vec3 col = mix(uColorDark, uColorLight, smoothstep(0.0, 1.0, lit * 0.9 + 0.08));
  col = mix(col, uColorRim, fres * 0.85);
  vec3 H = normalize(L + V);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 48.0) * uSpecular;
  col += spec;
  gl_FragColor = vec4(col, uProgress);
}
