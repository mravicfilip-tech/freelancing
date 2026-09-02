// Elevated great-circle arcs between points on the sphere; aT runs 0..1 along each arc.
attribute float aT;
attribute float aArc;

uniform float uCenterViewZ;

varying float vT;
varying float vArc;
varying float vDepth;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vT = aT;
  vArc = aArc;
  vDepth = mv.z - uCenterViewZ;
  gl_Position = projectionMatrix * mv;
}
