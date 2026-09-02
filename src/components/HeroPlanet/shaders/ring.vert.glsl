uniform float uCenterViewZ;   // planet centre in view space
varying float vDepth;         // view-space z relative to the planet centre (negative = behind)

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = mv.z - uCenterViewZ;
  gl_Position = projectionMatrix * mv;
}
