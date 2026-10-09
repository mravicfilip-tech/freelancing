// Serbia on the studio floor. The outline is the real one, from world-atlas countries-50m through
// topojson-client, the same source and the same Kosovo merge as src/board/mapcard.tsx. Mercator,
// plain maths. Ground is y = 0, north is -z, one degree of longitude is SCALE metres.
import * as THREE from 'three';
import { feature, merge } from 'topojson-client';
import type { Topology, Polygon, MultiPolygon } from 'topojson-specification';
import world from 'world-atlas/countries-50m.json';

type Geo = { id?: string; properties: { name: string } } & (Polygon | MultiPolygon);
const topo = world as unknown as Topology;
const geoms = (topo.objects.countries as unknown as { geometries: Geo[] }).geometries;

export const SCALE = 2.0;
const CENTER = { lon: 20.8, lat: 44.05 };
const merc = (lat: number) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
export const proj = (lon: number, lat: number, y = 0.02): THREE.Vector3 => new THREE.Vector3((lon - CENTER.lon) * SCALE, y, -(merc(lat) - merc(CENTER.lat)) * SCALE);

type Ring = number[][];
const polys = (g: { type: string; coordinates: unknown }): Ring[][] => (g.type === 'Polygon' ? [g.coordinates as Ring[]] : (g.coordinates as Ring[][]));
const ringPts = (ring: Ring, y = 0.02) => ring.map(([lo, la]) => proj(lo, la, y));

const byId = (id: string) => geoms.find((g) => g.id === id)!;
const kosovo = geoms.find((g) => g.properties.name === 'Kosovo')!;
const serbiaGeo = merge(topo, [byId('688') as Polygon, kosovo as Polygon]);
const NEIGHBOURS = ['348', '642', '100', '807', '008', '499', '070', '191'];

// The road from Vrčin to a customer in the south, hand placed on the E 75 corridor, then smoothed.
const WAYPOINTS: [number, number][] = [
  [20.6, 44.65],
  [20.7, 44.44],
  [21.0, 44.27],
  [21.26, 43.98],
  [21.41, 43.86],
  [21.7, 43.55],
  [21.9, 43.32],
];

let cache: ReturnType<typeof buildMapData> | null = null;
// The map is the same for every stage on the page, build it once.
export const mapData = () => (cache ??= buildMapData());

function buildMapData() {
  const serbiaRings = polys(serbiaGeo).flatMap((p) => p.map((r) => ringPts(r, 0.045)));
  const neighbourRings = NEIGHBOURS.flatMap((id) => polys(feature(topo, byId(id) as Polygon).geometry as { type: string; coordinates: unknown }).flatMap((p) => p.map((r) => ringPts(r))));
  // the filled land, a shape per polygon with its holes
  const fills = polys(serbiaGeo).map((p) => {
    const toV2 = (r: Ring) => r.map(([lo, la]) => {
      const v = proj(lo, la);
      return new THREE.Vector2(v.x, -v.z);
    });
    const shape = new THREE.Shape(toV2(p[0]));
    for (let i = 1; i < p.length; i++) shape.holes.push(new THREE.Path(toV2(p[i])));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const wp = WAYPOINTS.map(([lo, la]) => proj(lo, la, 0.03));
  const curve = new THREE.CatmullRomCurve3(wp, false, 'catmullrom', 0.5);
  const route = curve.getSpacedPoints(160);
  const places = [
    { name: 'Novi Sad', pos: proj(19.83, 45.25), left: false },
    { name: 'Kragujevac', pos: proj(20.92, 44.01), left: false },
    { name: 'Kraljevo', pos: proj(20.69, 43.72), left: false },
  ];
  return { serbiaRings, neighbourRings, fills, route, start: wp[0], end: wp[wp.length - 1], places, name: proj(20.15, 43.45) };
}

// A flat ribbon along a polyline on the floor, w metres wide. drawRange grows it along its length.
export function ribbon(points: THREE.Vector3[], w: number, closed = false) {
  const pts = closed ? [...points, points[0]] : points;
  const n = pts.length;
  const pos = new Float32Array(n * 6);
  const idx: number[] = [];
  const t = new THREE.Vector2();
  const prev = new THREE.Vector2();
  const next = new THREE.Vector2();
  const nrm = new THREE.Vector2();
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[i];
    const c = pts[Math.min(n - 1, i + 1)];
    prev.set(b.x - a.x, b.z - a.z);
    next.set(c.x - b.x, c.z - b.z);
    if (prev.lengthSq() > 0) prev.normalize();
    if (next.lengthSq() > 0) next.normalize();
    t.copy(prev).add(next);
    if (t.lengthSq() < 1e-8) t.copy(next.lengthSq() ? next : prev);
    t.normalize();
    nrm.set(-t.y, t.x);
    // keep the corner width near w, clamp the mitre so tight turns do not spike
    const d = Math.max(0.5, nrm.dot(new THREE.Vector2(-next.y, next.x)));
    const half = w / 2 / d;
    pos.set([b.x + nrm.x * half, b.y, b.z + nrm.y * half, b.x - nrm.x * half, b.y, b.z - nrm.y * half], i * 6);
    if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

// How far along a polyline, 0 to 1 by length, as a point and the count of whole segments before it.
export function along(pts: THREE.Vector3[], f: number) {
  let total = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    total += pts[i].distanceTo(pts[i - 1]);
    cum.push(total);
  }
  const d = total * Math.min(1, Math.max(0, f));
  let i = 1;
  while (i < pts.length - 1 && cum[i] < d) i++;
  const s = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return { p: pts[i - 1].clone().lerp(pts[i], s), seg: i - 1, frac: s };
}
