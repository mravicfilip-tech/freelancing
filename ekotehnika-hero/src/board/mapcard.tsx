// The dark rounded map card for the S2 frame. The Serbia outline is the real one, from the world-atlas
// countries-50m file via topojson-client, Serbia is id 688. Natural Earth cuts Kosovo out of that
// shape, so the Kosovo polygon is merged back in and the outline is the whole of Serbia as the client
// draws it. Neighbours are drawn dim for context. Mercator, plain maths, no d3.
import { feature, merge } from 'topojson-client';
import type { Topology, Polygon, MultiPolygon } from 'topojson-specification';
import world from 'world-atlas/countries-50m.json';
import { C } from '../tokens';
import { Van } from './vehicles';
import { FONT, lerp } from './scene';

type Geo = { id?: string; properties: { name: string } } & (Polygon | MultiPolygon);
const topo = world as unknown as Topology;
const geoms = (topo.objects.countries as unknown as { geometries: Geo[] }).geometries;

const CARD = { x: 504, y: 92, w: 896, h: 696, r: 28 };
const CENTER = { lon: 20.8, lat: 44.05 };
const PX_PER_DEG = 99;

const merc = (lat: number) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const cx0 = CARD.x + CARD.w / 2;
const cy0 = CARD.y + CARD.h / 2 + 6;
export const proj = (lon: number, lat: number): [number, number] => [cx0 + (lon - CENTER.lon) * PX_PER_DEG, cy0 - (merc(lat) - merc(CENTER.lat)) * PX_PER_DEG];

type Ring = number[][];
const ringPath = (ring: Ring) => 'M' + ring.map(([lo, la]) => proj(lo, la).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';
const polys = (g: { type: string; coordinates: unknown }): Ring[][] => (g.type === 'Polygon' ? [g.coordinates as Ring[]] : (g.coordinates as Ring[][]));
const shapeD = (g: { type: string; coordinates: unknown }) => polys(g).map((p) => p.map(ringPath).join('')).join('');

const byId = (id: string) => geoms.find((g) => g.id === id)!;
const kosovo = geoms.find((g) => g.properties.name === 'Kosovo')!;
const serbiaD = shapeD(merge(topo, [byId('688') as Polygon, kosovo as Polygon]));
const neighbours = ['348', '642', '100', '807', '008', '499', '070', '191'].map((id) => ({
  id,
  d: shapeD(feature(topo, byId(id) as Polygon).geometry as { type: string; coordinates: unknown }),
}));

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
const pts = WAYPOINTS.map(([lo, la]) => proj(lo, la));

function smooth(points: [number, number][]) {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 0.05) {
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
const line = smooth(pts);
const cum = line.reduce<number[]>((a, p, i) => (a.push(i ? a[i - 1] + Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) : 0), a), []);
const total = cum[cum.length - 1];

function at(k: number): { x: number; y: number; upto: [number, number][] } {
  const d = total * k;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  const x = lerp(line[i - 1][0], line[i][0], f);
  const y = lerp(line[i - 1][1], line[i][1], f);
  return { x, y, upto: [...line.slice(0, i), [x, y]] };
}

const poly = (p: [number, number][]) => 'M' + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 14} ${y - 38})`}>
      <path d="M14 38 C14 38 2 24 2 14 A12 12 0 0 1 26 14 C26 24 14 38 14 38 Z" fill={C.white} />
      <circle cx={14} cy={14} r={4.6} fill={C.ink} />
    </g>
  );
}

const places: { name: string; lon: number; lat: number; left?: boolean }[] = [
  { name: 'Novi Sad', lon: 19.83, lat: 45.25 },
  { name: 'Kragujevac', lon: 20.92, lat: 44.01, left: true },
  { name: 'Kraljevo', lon: 20.69, lat: 43.72 },
];

export function MapCard({ k }: { k: number }) {
  const van = at(k);
  const start = pts[0];
  const end = pts[pts.length - 1];
  return (
    <g>
      <clipPath id="bd-map-clip">
        <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={CARD.r} />
      </clipPath>
      <pattern id="bd-map-dots" width={28} height={28} patternUnits="userSpaceOnUse">
        <circle cx={14} cy={14} r={1} fill={C.white} opacity={0.08} />
      </pattern>
      <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={CARD.r} fill={C.ink} />
      <g clipPath="url(#bd-map-clip)">
        <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} fill="url(#bd-map-dots)" />
        {neighbours.map((n) => (
          <path key={n.id} d={n.d} fill={C.white} fillOpacity={0.035} stroke={C.tonedTextGrey} strokeOpacity={0.55} strokeWidth={1} strokeLinejoin="round" />
        ))}
        <path d={serbiaD} fill="#33363c" stroke={C.tonedTextGrey} strokeWidth={1.8} strokeLinejoin="round" />
        {places.map((p) => {
          const [x, y] = proj(p.lon, p.lat);
          return (
            <g key={p.name}>
              <circle cx={x} cy={y} r={3.4} fill={C.lightGrey} fillOpacity={0.62} />
              <text x={p.left ? x - 10 : x + 10} y={y + 5} fontFamily={FONT} fontSize={15} fill={C.lightGrey} fillOpacity={0.62} textAnchor={p.left ? 'end' : 'start'}>
                {p.name}
              </text>
            </g>
          );
        })}
        <text x={proj(19.95, 43.75)[0]} y={proj(19.95, 43.75)[1]} fontFamily={FONT} fontSize={15} fill={C.lightGrey} fillOpacity={0.62} textAnchor="middle" letterSpacing={0.4}>
          Srbija
        </text>
        {/* the route, dashed to the end, solid white to the van */}
        <path d={poly(line)} fill="none" stroke={C.lightGrey} strokeOpacity={0.5} strokeWidth={3.4} strokeLinecap="round" strokeDasharray="0.1 9" />
        {k > 0 && <path d={poly(van.upto)} fill="none" stroke={C.white} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={start[0]} cy={start[1]} r={7} fill={C.white} />
        <Pin x={end[0]} y={end[1]} />
        <Pin x={start[0]} y={start[1]} />
        <text x={start[0] - 26} y={start[1] - 14} fontFamily={FONT} fontSize={20} fontWeight={500} fill={C.lightGrey} textAnchor="end">
          Vrčin
        </text>
        <text x={end[0] - 26} y={end[1] - 14} fontFamily={FONT} fontSize={20} fontWeight={500} fill={C.lightGrey} textAnchor="end">
          vaše skladište
        </text>
        {/* the van rides beside the line, ink halo so it lifts off the map */}
        <g transform={`translate(${van.x + 62} ${van.y - 6})`}>
          <ellipse cx={0} cy={26} rx={44} ry={5} fill={C.ink} opacity={0.5} />
          <Van x={-44} y={-186 + 22} w={88} />
        </g>
      </g>
    </g>
  );
}
