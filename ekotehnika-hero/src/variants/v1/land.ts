// Land dots for the globe. The land-110m outline is drawn once into an equirectangular mask canvas,
// then a lat lon grid with even spacing on the sphere keeps only the points that fall on land.
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import landTopo from 'world-atlas/land-110m.json';

const DEG = Math.PI / 180;

// A point on the unit sphere. Longitude 0 and latitude 0 face +z, north is +y.
export function ll(lat: number, lon: number, r = 1): [number, number, number] {
  const la = lat * DEG;
  const lo = lon * DEG;
  return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
}

export const VRCIN = { lat: 44.676, lon: 20.607 };

function drawMask(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
  const fc = feature(topo, topo.objects.land) as unknown as FeatureCollection<Polygon | MultiPolygon>;
  const X = (lon: number) => ((lon + 180) / 360) * w;
  const Y = (lat: number) => ((90 - lat) / 180) * h;
  // The atlas is not cut at the antimeridian, so longitudes are unwrapped and the ring is drawn a
  // second time one world over when it runs past either edge.
  const ring = (pts: Position[], shift: number) => {
    let prev = pts[0][0];
    let acc = prev;
    pts.forEach(([lon, lat], i) => {
      if (i) {
        let d = lon - prev;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        acc += d;
        prev = lon;
      }
      const x = X(acc + shift);
      const y = Y(lat);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.closePath();
  };
  for (const f of fc.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      if (poly[0].every(([, lat]) => lat < -60)) continue;
      for (const shift of [-360, 0, 360]) {
        g.beginPath();
        poly.forEach((r) => ring(r, shift));
        g.fill('evenodd');
      }
    }
  }
  return g.getImageData(0, 0, w, h).data;
}

let mask: Uint8ClampedArray | null = null;
const MW = 2048;
const MH = 1024;
const cache = new Map<string, Float32Array>();

// Returns xyz triples on the unit sphere, one per land dot. Rows run along latitude like the reel.
// With a patch, only dots within patch.r degrees of the patch centre are kept, for the close up.
export function landDots(stepDeg = 0.75, patch?: { lat: number; lon: number; r: number }): Float32Array {
  const key = `${stepDeg}:${patch ? `${patch.lat},${patch.lon},${patch.r}` : ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  mask ??= drawMask(MW, MH);
  const W = MW;
  const H = MH;
  const out: number[] = [];
  const lat0 = patch ? patch.lat - patch.r : -84;
  const lat1 = patch ? patch.lat + patch.r : 84;
  const cr = patch ? Math.cos(patch.r * DEG) : -2;
  const pc = patch ? ll(patch.lat, patch.lon) : [0, 0, 0];
  for (let row = Math.ceil(lat0 / stepDeg); row * stepDeg <= lat1; row++) {
    const lat = row * stepDeg;
    const n = Math.max(1, Math.round((360 / stepDeg) * Math.cos(lat * DEG)));
    const shift = row % 2 ? 0.5 : 0;
    for (let i = 0; i < n; i++) {
      const lon = -180 + ((i + shift) / n) * 360;
      const px = Math.min(W - 1, Math.floor(((lon + 180) / 360) * W));
      const py = Math.min(H - 1, Math.floor(((90 - lat) / 180) * H));
      if (mask[(py * W + px) * 4] <= 127) continue;
      const v = ll(lat, lon);
      if (patch && v[0] * pc[0] + v[1] * pc[1] + v[2] * pc[2] < cr) continue;
      out.push(...v);
    }
  }
  const arr = new Float32Array(out);
  cache.set(key, arr);
  return arr;
}
