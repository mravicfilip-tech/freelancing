// The servis map's geography, round 5, Filip's "Curug and Vrcin are the two service locations that pick ups cover the whole
// map of Serbia". Borders and rivers are Natural Earth 1:10m (public domain), cut to the region in serbia.json. Serbia is
// drawn with Kosovo inside one outer border, as a Serbian company's own map shows it, Filip's call (taste 2026-10-14 11:08).
import data from './serbia.json';

export type LonLat = [number, number];
export type Pt = [number, number];

export const MAP = data as unknown as {
  bbox: [number, number, number, number];
  serbia: LonLat[][];
  kosovo: LonLat[][];
  neighbours: LonLat[][];
  rivers: { name: string; sr: number; pts: LonLat[] }[];
};

// The two service centres. Vrčin from the company address, Moše Pijade 17b, Čurug in Bačka, Filip's two locations.
export const BASES = [
  { id: 'vrcin', name: 'Vrčin', ll: [20.61, 44.596] as LonLat },
  { id: 'curug', name: 'Čurug', ll: [20.0686, 45.4717] as LonLat },
];

// Towns the service vans reach, the seats of the districts. Natural Earth places where it has them, the rest from their
// town centres, to about 2 km, enough at this scale.
export const TOWNS: { name: string; ll: LonLat }[] = [
  { name: 'Beograd', ll: [20.4651, 44.8186] },
  { name: 'Novi Sad', ll: [19.8451, 45.2517] },
  { name: 'Niš', ll: [21.8958, 43.3209] },
  { name: 'Kragujevac', ll: [20.9114, 44.0128] },
  { name: 'Subotica', ll: [19.6656, 46.1003] },
  { name: 'Zrenjanin', ll: [20.3894, 45.3836] },
  { name: 'Čačak', ll: [20.3497, 43.8914] },
  { name: 'Pančevo', ll: [20.6403, 44.8708] },
  { name: 'Kikinda', ll: [20.4653, 45.8297] },
  { name: 'Sombor', ll: [19.1122, 45.7742] },
  { name: 'Sremska Mitrovica', ll: [19.6122, 44.9764] },
  { name: 'Šabac', ll: [19.69, 44.755] },
  { name: 'Valjevo', ll: [19.89, 44.2711] },
  { name: 'Smederevo', ll: [20.93, 44.665] },
  { name: 'Požarevac', ll: [21.1867, 44.62] },
  { name: 'Vršac', ll: [21.3, 45.1167] },
  { name: 'Jagodina', ll: [21.2614, 43.9775] },
  { name: 'Kraljevo', ll: [20.6873, 43.7258] },
  { name: 'Kruševac', ll: [21.3339, 43.58] },
  { name: 'Užice', ll: [19.8486, 43.8586] },
  { name: 'Novi Pazar', ll: [20.5122, 43.1367] },
  { name: 'Prokuplje', ll: [21.5881, 43.2342] },
  { name: 'Leskovac', ll: [21.9461, 42.9981] },
  { name: 'Vranje', ll: [21.9, 42.5514] },
  { name: 'Pirot', ll: [22.5861, 43.1531] },
  { name: 'Zaječar', ll: [22.2847, 43.9042] },
  { name: 'Bor', ll: [22.0958, 44.0747] },
  { name: 'Negotin', ll: [22.5308, 44.2264] },
  { name: 'Loznica', ll: [19.2258, 44.5333] },
  { name: 'Priština', ll: [21.1655, 42.6629] },
  { name: 'Prizren', ll: [20.7397, 42.2139] },
  { name: 'Peć', ll: [20.2887, 42.6593] },
];

// Equirectangular at Serbia's middle latitude, east is x, north is up, in degrees of latitude.
const LAT0 = 44.0;
const K = Math.cos((LAT0 * Math.PI) / 180);
const raw = ([lon, lat]: LonLat): Pt => [lon * K, -lat];

// The outer extent of Serbia with Kosovo, in raw units.
const ALL = [...MAP.serbia, ...MAP.kosovo].flat().map(raw);
const EXT = {
  x0: Math.min(...ALL.map((p) => p[0])),
  x1: Math.max(...ALL.map((p) => p[0])),
  y0: Math.min(...ALL.map((p) => p[1])),
  y1: Math.max(...ALL.map((p) => p[1])),
};
export const ASPECT = (EXT.x1 - EXT.x0) / (EXT.y1 - EXT.y0);

// A projection that fits Serbia into a w by h box with pad px all round, centred.
export function fit(w: number, h: number, pad = 0) {
  const s = Math.min((w - 2 * pad) / (EXT.x1 - EXT.x0), (h - 2 * pad) / (EXT.y1 - EXT.y0));
  const ox = (w - s * (EXT.x1 - EXT.x0)) / 2;
  const oy = (h - s * (EXT.y1 - EXT.y0)) / 2;
  return (ll: LonLat): Pt => {
    const [x, y] = raw(ll);
    return [ox + (x - EXT.x0) * s, oy + (y - EXT.y0) * s];
  };
}

// The same fit the other way, a px point in the box back to lon and lat.
export function unfit(w: number, h: number, pad = 0) {
  const s = Math.min((w - 2 * pad) / (EXT.x1 - EXT.x0), (h - 2 * pad) / (EXT.y1 - EXT.y0));
  const ox = (w - s * (EXT.x1 - EXT.x0)) / 2;
  const oy = (h - s * (EXT.y1 - EXT.y0)) / 2;
  return ([px, py]: Pt): LonLat => [((px - ox) / s + EXT.x0) / K, -((py - oy) / s + EXT.y0)];
}

export const pathOf = (rings: LonLat[][], P: (ll: LonLat) => Pt, close = true) =>
  rings.map((r) => r.map((ll, i) => `${i ? 'L' : 'M'}${P(ll)[0].toFixed(1)} ${P(ll)[1].toFixed(1)}`).join('') + (close ? 'Z' : '')).join('');

// Inside Serbia or Kosovo, even odd rule on lon and lat.
function inRing(r: LonLat[], [x, y]: LonLat) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export const inSerbia = (ll: LonLat) => [...MAP.serbia, ...MAP.kosovo].some((r) => inRing(r, ll));

// Great circle km, for which centre is nearer.
export function km(a: LonLat, b: LonLat) {
  const R = 6371;
  const t = Math.PI / 180;
  const dLat = (b[1] - a[1]) * t;
  const dLon = (b[0] - a[0]) * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * t) * Math.cos(b[1] * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const nearest = (ll: LonLat) => (km(ll, BASES[0].ll) <= km(ll, BASES[1].ll) ? BASES[0] : BASES[1]);
