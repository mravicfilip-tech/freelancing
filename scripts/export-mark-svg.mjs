// Exports the mark as SVGs in the hero's rest pose (slight perspective), for design tools.
// Usage: node scripts/export-mark-svg.mjs  →  exports/phorecast-mark-3d.svg, exports/phorecast-mark-3d-lined.svg
//
// Every shape is filled/stroked with one colour and shading is a separate black overlay layer,
// so the colour can be changed in Figma with a single fill edit.
import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { logoOutline } from '../src/phorecast/HeroLogo/logoPath.ts';

const COLOR = '#FF632A';
const SAMPLES = 360;
const DEPTH = 0.3;
const YAW = -0.32; // the hero's rest pose (config.ts)
const PITCH = 0.1;
const FOV = 32;
const SIZE = 1200; // output box, px
const FILL = 0.68; // mark height as a fraction of the box
const LIGHT = new THREE.Vector3(0.35, 0.6, 0.72).normalize();

const outline = logoOutline(SAMPLES);
const n = outline.length;
const rotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(PITCH, YAW, 0));
const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
const dist = 1 / FILL / (2 * tanHalf);
const camera = new THREE.Vector3(0, 0, dist);

const world = (p, z) => new THREE.Vector3(p.x, p.y, z).applyMatrix4(rotation);
const project = (v) => {
  const s = 1 / ((dist - v.z) * tanHalf);
  return [SIZE / 2 + v.x * s * (SIZE / 2), SIZE / 2 - v.y * s * (SIZE / 2)];
};
const fmt = (x) => x.toFixed(2);
const pathOf = (pts, close = true) => 'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + (close ? 'Z' : '');

// Outward normal: depends on the loop's winding.
let area = 0;
for (let i = 0; i < n; i++) {
  const a = outline[i], b = outline[(i + 1) % n];
  area += a.x * b.y - b.x * a.y;
}
const ccw = area > 0;

const front = outline.map((p) => world(p, DEPTH / 2));
const back = outline.map((p) => world(p, -DEPTH / 2));

// ---------- Solid: side strips (painter's order) with shading overlays, then the front face ----------
// Consecutive visible quads with near-equal shading merge into one strip: fewer shapes, no hairline seams.
const quads = [];
for (let i = 0; i < n; i++) {
  const j = (i + 1) % n;
  const d = outline[j].clone().sub(outline[i]);
  const normal2 = ccw ? new THREE.Vector2(d.y, -d.x) : new THREE.Vector2(-d.y, d.x);
  const normal = new THREE.Vector3(normal2.x, normal2.y, 0).normalize().applyMatrix4(rotation);
  const centre = front[i].clone().add(front[j]).add(back[i]).add(back[j]).multiplyScalar(0.25);
  const visible = normal.dot(camera.clone().sub(centre)) > 0;
  const lambert = Math.max(0, normal.dot(LIGHT));
  quads.push({ i, visible, depth: centre.z, shade: THREE.MathUtils.clamp(0.62 * (1 - lambert), 0.08, 0.62) });
}
const strips = [];
let run = null;
for (let k = 0; k < n; k++) {
  const q = quads[k];
  if (q.visible && run && Math.abs(q.shade - run.shade) < 0.03 && q.i === run.end) {
    run.end = (q.i + 1) % n;
    run.count++;
    run.depth = Math.min(run.depth, q.depth);
  } else {
    if (run) strips.push(run);
    run = q.visible ? { start: q.i, end: (q.i + 1) % n, count: 1, shade: q.shade, depth: q.depth } : null;
  }
}
if (run) strips.push(run);
for (const s of strips) {
  const idx = [];
  for (let k = 0; k <= s.count; k++) idx.push((s.start + k) % n);
  s.d = pathOf([...idx.map((i) => front[i]), ...idx.reverse().map((i) => back[i])].map(project));
}
strips.sort((a, b) => a.depth - b.depth); // far to near

const facePath = pathOf(front.map(project));
const solid = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <g id="sides">
${strips.map((q) => `    <path fill="${COLOR}" stroke="${COLOR}" stroke-width="0.6" stroke-linejoin="round" d="${q.d}"/>\n    <path fill="#000" fill-opacity="${q.shade.toFixed(3)}" d="${q.d}"/>`).join('\n')}
  </g>
  <path id="face" fill="${COLOR}" fill-rule="evenodd" d="${facePath}"/>
</svg>
`;

// ---------- Lined: outlines per slice, ribs at corners and at intervals ----------
const SLICES = 7;
const slicePaths = [];
for (let k = 0; k < SLICES; k++) {
  const f = k / (SLICES - 1);
  const z = (f - 0.5) * DEPTH;
  const cap = k === 0 || k === SLICES - 1;
  slicePaths.push({ z, opacity: cap ? 1 : 0.35, width: cap ? 2.5 : 1.25, d: pathOf(outline.map((p) => project(world(p, z)))) });
}
slicePaths.sort((a, b) => a.z - b.z);
const ribs = [];
for (let i = 0; i < n; i++) {
  const a = outline[(i - 1 + n) % n], b = outline[i], c = outline[(i + 1) % n];
  const u = b.clone().sub(a).normalize(), v = c.clone().sub(b).normalize();
  const corner = Math.acos(THREE.MathUtils.clamp(u.dot(v), -1, 1)) > 0.45;
  if (corner || i % 12 === 0) ribs.push(pathOf([project(back[i]), project(front[i])], false));
}
const lined = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" stroke="${COLOR}" stroke-linejoin="round" stroke-linecap="round">
  <g id="ribs" stroke-width="1.25" stroke-opacity="0.55">
${ribs.map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
  <g id="slices">
${slicePaths.map((s) => `    <path stroke-width="${s.width}" stroke-opacity="${s.opacity}" d="${s.d}"/>`).join('\n')}
  </g>
</svg>
`;

mkdirSync('exports', { recursive: true });
writeFileSync('exports/phorecast-mark-3d.svg', solid);
writeFileSync('exports/phorecast-mark-3d-lined.svg', lined);
console.log(`wrote exports/phorecast-mark-3d.svg (${strips.length} side strips) and exports/phorecast-mark-3d-lined.svg (${ribs.length} ribs)`);
