// Ring dots on a sphere, projected flat. Pure maths at module load, no randomness, so the
// picture is the same on every render. The viewBox is 800 by 800 with the sphere at the centre.
export type Dot = { cx: number; cy: number; rx: number; ry: number; rot: number; d: number; fill: boolean; glow: boolean };

const R = 372;
const C = 400;

export const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  const stepLat = 9;
  let i = 0;
  for (let lat = -81; lat <= 81; lat += stepLat) {
    const phi = (lat * Math.PI) / 180;
    const n = Math.max(1, Math.round((360 * Math.cos(phi)) / stepLat));
    for (let k = 0; k < n; k++) {
      const lon = ((k + (Math.round(lat / stepLat) % 2 === 0 ? 0 : 0.5)) * 360) / n - 180;
      const lam = (lon * Math.PI) / 180;
      const d = Math.cos(phi) * Math.cos(lam);
      i++;
      if (d < 0.12) continue;
      const x = C + R * Math.cos(phi) * Math.sin(lam);
      const y = C - R * Math.sin(phi);
      const r = 10;
      const rot = (Math.atan2(y - C, x - C) * 180) / Math.PI;
      const h = (i * 2654435761) % 1000;
      out.push({ cx: x, cy: y, rx: r * Math.max(d, 0.22), ry: r, rot, d, fill: h < 70, glow: h < 22 });
    }
  }
  return out;
})();
