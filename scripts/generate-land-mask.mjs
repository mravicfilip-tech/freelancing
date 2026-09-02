// Rasterises Natural Earth land polygons (world-atlas, 50m) into an equirectangular
// greyscale PNG used by the globe: public/land-mask.png (white = land).
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { createRequire } from 'node:module';
import * as topojson from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/land-50m.json');
const land = topojson.feature(topo, topo.objects.land);

const W = 1024, H = 512;
const px = new Uint8Array(W * H);
const rows = Array.from({ length: H }, () => []);

for (const feature of land.features) {
  const polys = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length; i++) {
        const [lon0, lat0] = ring[i];
        const [lon1, lat1] = ring[(i + 1) % ring.length];
        const x0 = ((lon0 + 180) / 360) * W, y0 = ((90 - lat0) / 180) * H;
        const x1 = ((lon1 + 180) / 360) * W, y1 = ((90 - lat1) / 180) * H;
        if (y0 === y1) continue;
        const [ya, yb, xa, xb] = y0 < y1 ? [y0, y1, x0, x1] : [y1, y0, x1, x0];
        for (let y = Math.ceil(ya - 0.5); y + 0.5 < yb; y++) {
          if (y < 0 || y >= H) continue;
          const t = (y + 0.5 - ya) / (yb - ya);
          rows[y].push(xa + (xb - xa) * t);
        }
      }
    }
  }
}
for (let y = 0; y < H; y++) {
  const xs = rows[y].sort((a, b) => a - b);
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const from = Math.max(0, Math.round(xs[i])), to = Math.min(W, Math.round(xs[i + 1]));
    px.fill(255, y * W + from, y * W + to);
  }
}

// Minimal PNG encoder (8-bit greyscale).
const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (buf) => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const raw = Buffer.alloc((W + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W + 1)] = 0; Buffer.from(px.buffer, y * W, W).copy(raw, y * (W + 1) + 1); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
writeFileSync('public/land-mask.png', png);
const landFrac = px.reduce((a, v) => a + (v ? 1 : 0), 0) / px.length;
console.log(`wrote public/land-mask.png ${W}x${H}, ${Math.round(png.length / 1024)} KB, land ${(landFrac * 100).toFixed(1)}% of texels`);
