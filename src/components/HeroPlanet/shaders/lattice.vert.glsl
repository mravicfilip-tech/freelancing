// Latitude / longitude hairlines on the unit sphere.
varying float vFacing;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * position);
  vFacing = dot(n, normalize(-mv.xyz));
  gl_Position = projectionMatrix * mv;
}
