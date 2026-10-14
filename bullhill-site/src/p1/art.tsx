// Dot art for the Foundry pathway. Everything is generated from small deterministic functions and
// drawn as inline SVG circles. Nothing here is read by a screen reader, so every svg is aria-hidden.
// Tones 1 to 3 run from near to far, tone r is the one line of bull-red dots. The container sets
// --d1, --d2, --d3 and --dr, so the same art works on dark, light and red grounds.

type Tone = 1 | 2 | 3 | 'r';
type Dot = { x: number; y: number; r: number; o: number; t: Tone };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n: number) => Math.round(n * 10) / 10;

function Dots({ dots }: { dots: Dot[] }) {
  return (
    <>
      {dots.map((d, i) => (
        <circle key={i} cx={f1(d.x)} cy={f1(d.y)} r={f1(d.r)} opacity={d.o === 1 ? undefined : Math.round(d.o * 100) / 100} className={`d${d.t}`} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// The hill. A dotted terrain mesh with two rises, like the two hill lines in the logo, and one
// trench of red dots cut up the near slope.

function hillHeight(x: number, z: number) {
  const g = (cx: number, cz: number, sx: number, sz: number, a: number) =>
    a * Math.exp(-((x - cx) ** 2 / (2 * sx * sx) + (z - cz) ** 2 / (2 * sz * sz)));
  return g(-0.05, 0.05, 0.34, 0.3, 1) + g(0.62, -0.25, 0.2, 0.22, 0.5) + g(-0.72, 0.35, 0.22, 0.2, 0.38) + 0.018 * Math.sin(x * 11 + z * 5) * Math.cos(z * 9);
}
const trenchX = (z: number) => -0.16 + 0.3 * Math.sin((z + 1) * 2.4);

type Cam = { yaw: number; tilt: number; hz: number; sx: number; sy: number; cx: number; cy: number; rMax: number; rMin: number };

function project(x: number, z: number, h: number, cam: Cam) {
  const c = Math.cos(cam.yaw);
  const s = Math.sin(cam.yaw);
  const xr = x * c - z * s;
  const zr = x * s + z * c;
  const p = 1 / (1 + 0.22 * zr);
  const dn = Math.min(1, Math.max(0, (zr + 1.4) / 2.8));
  return {
    x: cam.cx + xr * cam.sx * p,
    y: cam.cy - (zr * cam.tilt + h * cam.hz) * cam.sy * p,
    dn,
    p,
  };
}

function hillDots(cam: Cam, nx: number, nz: number): Dot[] {
  const out: Dot[] = [];
  const red: Dot[] = [];
  for (let j = 0; j < nz; j++) {
    const z = -1 + (2 * j) / (nz - 1);
    for (let i = 0; i < nx; i++) {
      const x = -1.1 + (2.2 * (i + (j % 2) * 0.5)) / (nx - 1);
      if ((x / 1.05) ** 2 + (z / 0.9) ** 2 > 1) continue;
      const inTrench = z > -0.97 && z < 0.06;
      const dx = Math.abs(x - trenchX(z));
      if (inTrench && dx < 0.045) continue;
      const h = hillHeight(x, z) - (inTrench ? 0.05 * Math.exp(-(dx * dx) / (2 * 0.04 * 0.04)) : 0);
      const q = project(x, z, h, cam);
      const near = 1 - q.dn;
      out.push({ x: q.x, y: q.y, r: cam.rMin + (cam.rMax - cam.rMin) * near, o: 0.4 + 0.6 * near, t: q.dn < 0.38 ? 1 : q.dn < 0.7 ? 2 : 3 });
    }
  }
  const steps = 46;
  for (let k = 0; k <= steps; k++) {
    const z = -0.95 + (1.0 * k) / steps;
    const x = trenchX(z);
    const q = project(x, z, hillHeight(x, z) - 0.05, cam);
    red.push({ x: q.x, y: q.y, r: Math.max(1.4, cam.rMax * 0.95 * q.p * 0.9), o: 1, t: 'r' });
  }
  return [...out, ...red];
}

const HERO_CAM: Cam = { yaw: 0.3, tilt: 0.2, hz: 1.2, sx: 520, sy: 400, cx: 600, cy: 520, rMax: 2.4, rMin: 1 };
const CLOSE_CAM: Cam = { yaw: -0.55, tilt: 0.34, hz: 0.85, sx: 300, sy: 300, cx: 340, cy: 430, rMax: 2.4, rMin: 1 };

let heroCache: Dot[] | undefined;
let closeCache: Dot[] | undefined;

export function HillArt({ className, variant = 'hero' }: { className?: string; variant?: 'hero' | 'close' }) {
  const dots = variant === 'hero' ? (heroCache ??= hillDots(HERO_CAM, 58, 40)) : (closeCache ??= hillDots(CLOSE_CAM, 44, 32));
  return (
    <svg className={className} viewBox={variant === 'hero' ? '0 0 1200 700' : '0 140 680 480'} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <Dots dots={dots} />
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// A wave of terrain, long and low, for the end of the dark sections.

function waveDots(w: number, h: number, nx: number, nz: number, seed: number): Dot[] {
  const rand = rng(seed);
  const cam: Cam = { yaw: 0.18, tilt: 0.42, hz: 1, sx: w * 0.52, sy: h * 1.2, cx: w / 2, cy: h * 0.62, rMax: 2.2, rMin: 1 };
  const out: Dot[] = [];
  for (let j = 0; j < nz; j++) {
    const z = -1 + (2 * j) / (nz - 1);
    for (let i = 0; i < nx; i++) {
      const x = -1.1 + (2.2 * (i + (j % 2) * 0.5)) / (nx - 1);
      const y = 0.16 * Math.sin(x * 4.2 + z * 1.7) + 0.09 * Math.sin(x * 9.5 - z * 2.4) + 0.06 * Math.cos(z * 3.3 + x * 2) + 0.04 * (rand() - 0.5);
      const q = project(x, z, y + 0.1 * (1 - Math.abs(x)), cam);
      if (q.x < -10 || q.x > w + 10) continue;
      const near = 1 - q.dn;
      out.push({ x: q.x, y: q.y, r: 1 + 1.2 * near, o: 0.35 + 0.65 * near, t: q.dn < 0.4 ? 1 : q.dn < 0.7 ? 2 : 3 });
    }
  }
  return out;
}

const waveCache = new Map<string, Dot[]>();
export function WaveArt({ className, w, h }: { className?: string; w: number; h: number }) {
  const key = `${w}x${h}`;
  let dots = waveCache.get(key);
  if (!dots) {
    dots = waveDots(w, h, Math.round(w / 15), Math.round(h / 13), 7);
    waveCache.set(key, dots);
  }
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Dots dots={dots} />
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// The radial field behind the process title, elliptical rings that grow outward.

function radialDots(w: number, h: number, innerX: number): Dot[] {
  const out: Dot[] = [];
  const cx = w / 2;
  const cy = h * 0.42;
  const rings = 24;
  const outer = Math.hypot(w, h) * 0.62;
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const rx = innerX + Math.pow(t, 1.25) * (outer - innerX);
    const ry = rx * 0.6;
    const gap = 16 + t * 34;
    const n = Math.max(12, Math.round((2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) / gap));
    const off = i * 0.55;
    for (let k = 0; k < n; k++) {
      const a = off + (k / n) * Math.PI * 2;
      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
      out.push({ x, y, r: 0.9 + t * 2.3, o: 0.35 + 0.55 * t, t: t < 0.4 ? 3 : t < 0.7 ? 2 : 1 });
    }
  }
  return out;
}

const radialCache = new Map<string, Dot[]>();
export function RadialField({ className, w, h, inner }: { className?: string; w: number; h: number; inner: number }) {
  const key = `${w}x${h}x${inner}`;
  let dots = radialCache.get(key);
  if (!dots) {
    dots = radialDots(w, h, inner);
    radialCache.set(key, dots);
  }
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Dots dots={dots} />
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// A scattered cloud for the audience sections, dense in the middle, a few big dots on the edge.

function scatterDots(w: number, h: number, seed: number): Dot[] {
  const rand = rng(seed);
  const out: Dot[] = [];
  const n = 340;
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.pow(rand(), 0.7);
    const x = w / 2 + Math.cos(a) * rr * (w / 2);
    const y = h / 2 + Math.sin(a) * rr * (h / 2);
    const big = Math.pow(rand(), 4);
    out.push({ x, y, r: 1 + big * 3 + rr * 0.6, o: 0.25 + rand() * 0.5, t: big > 0.4 ? 1 : rand() > 0.5 ? 2 : 3 });
  }
  return out;
}

const scatterCache = new Map<number, Dot[]>();
export function ScatterField({ className, seed }: { className?: string; seed: number }) {
  let dots = scatterCache.get(seed);
  if (!dots) {
    dots = scatterDots(720, 960, seed);
    scatterCache.set(seed, dots);
  }
  return (
    <svg className={className} viewBox="0 0 720 960" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Dots dots={dots} />
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// The four service cards. Each is drawn in a 240 by 300 box.

function trenchDots(): Dot[] {
  const out: Dot[] = [];
  const cols = 16;
  const rows = 22;
  for (let row = 0; row < rows; row++) {
    const c = row < 9 ? 6 : row < 13 ? 7 : 8;
    for (let col = 0; col < cols; col++) {
      const x = 24 + col * 12 + 6;
      const y = 16 + row * 12;
      const base = 1.1 + (row / rows) * 1.1;
      if (col === c) {
        out.push({ x, y, r: 2.2, o: 1, t: 'r' });
        continue;
      }
      if (Math.abs(col - c) === 1) continue;
      const wall = Math.abs(col - c) === 2;
      out.push({ x: x + (col < c ? -1.5 : 1.5) * (wall ? 1 : 0), y, r: wall ? base + 0.7 : base, o: wall ? 1 : 0.85, t: 1 });
    }
  }
  return out;
}

function ductDots(): Dot[] {
  const out: Dot[] = [];
  const ring = (cx: number, cy: number, rad: number, n: number, r: number, t: Tone, o = 1) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      out.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, r, o, t });
    }
  };
  ring(120, 150, 106, 64, 1.3, 2, 0.6);
  ring(120, 150, 92, 56, 1.7, 1, 0.9);
  const d = 40;
  const spots: [number, number][] = [[0, 0], [d, 0], [-d, 0], [d / 2, d * 0.866], [-d / 2, d * 0.866], [d / 2, -d * 0.866], [-d / 2, -d * 0.866]];
  spots.forEach(([dx, dy], i) => {
    ring(120 + dx, 150 + dy, 17, 14, 1.6, i === 0 ? 'r' : 1, 1);
  });
  return out;
}

function houseDots(): Dot[] {
  const out: Dot[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number, step: number, r: number, t: Tone, o = 1) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k <= n; k++) out.push({ x: x1 + ((x2 - x1) * k) / n, y: y1 + ((y2 - y1) * k) / n, r, o, t });
  };
  for (let i = 0; i <= 10; i++) {
    const x = 24 + i * 19.2;
    const n = 11;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1);
      out.push({ x: x + (120 - x) * u * 0.84, y: 6 + (96 - 6) * u * 0.84, r: 1 + u * 0.7, o: 0.6 + 0.4 * u, t: 1 });
    }
  }
  line(70, 158, 120, 104, 9, 1.7, 2);
  line(120, 104, 170, 158, 9, 1.7, 2);
  line(70, 158, 70, 238, 9, 1.7, 2);
  line(170, 158, 170, 238, 9, 1.7, 2);
  line(70, 238, 170, 238, 9, 1.7, 2);
  line(106, 238, 106, 198, 8, 1.5, 2);
  line(134, 238, 134, 198, 8, 1.5, 2);
  line(106, 198, 134, 198, 8, 1.5, 2);
  line(14, 280, 70, 224, 8, 2.2, 'r');
  line(70, 224, 70, 224, 8, 2.2, 'r');
  return out;
}

function layerDots(): Dot[] {
  const out: Dot[] = [];
  const gaps = [0.66, 0.54, 0.42, 0.3, 0.18, 0, 0, 0];
  gaps.forEach((g, k) => {
    const y0 = 30 + k * 32;
    const half = (g * 192) / 2;
    for (let x = 24; x <= 216; x += 8) {
      const dx = Math.abs(x - 120);
      const y = y0 + Math.sin(x * 0.05 + k) * 3;
      if (dx < half) continue;
      out.push({ x, y, r: 1.6 + k * 0.15, o: 1, t: 1 });
    }
    if (k === 5) for (let x = 100; x <= 140; x += 8) out.push({ x, y: y0 + Math.sin(x * 0.05 + k) * 3, r: 2.2, o: 1, t: 'r' });
  });
  return out;
}

const serviceDots = { trench: trenchDots, ducts: ductDots, house: houseDots, layers: layerDots };
const serviceCache: Partial<Record<keyof typeof serviceDots, Dot[]>> = {};

export function ServiceArt({ kind, className }: { kind: keyof typeof serviceDots; className?: string }) {
  const dots = (serviceCache[kind] ??= serviceDots[kind]());
  return (
    <svg className={className} viewBox="0 0 240 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <Dots dots={dots} />
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// Pixel icons for the audience cards, 8 by 8 squares of 4 units, 32 units wide.

const PIXELS: Record<string, string[]> = {
  bars: ['........', '......#.', '....#.#.', '....#.#.', '..#.#.#.', '..#.#.#.', '#.#.#.#.', '#.#.#.#.'],
  records: ['########', '#......#', '#.####.#', '#......#', '#.####.#', '#......#', '#.##...#', '########'],
  lead: ['..####..', '.#....#.', '#..##..#', '#.####.#', '#.####.#', '#..##..#', '.#....#.', '..####..'],
  machine: ['..#..#..', '.######.', '########', '##....##', '##....##', '########', '.######.', '..#..#..'],
  check: ['........', '.......#', '......##', '#....##.', '##..##..', '.####...', '..##....', '........'],
  bolt: ['....###.', '...###..', '..###...', '.######.', '..####..', '...##...', '..##....', '.#......'],
};

export function PixelIcon({ name, className }: { name: keyof typeof PIXELS; className?: string }) {
  const rows = PIXELS[name];
  return (
    <svg className={className} viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
      {rows.flatMap((row, y) =>
        row.split('').map((ch, x) => (ch === '#' ? <rect key={`${x}-${y}`} x={x * 4} y={y * 4} width="3.5" height="3.5" rx="0.5" fill="currentColor" /> : null)),
      )}
    </svg>
  );
}
export type PixelName = keyof typeof PIXELS;

// ---------------------------------------------------------------------------------------------
// Black rounded duct ends, in place of the reference's black pills.

export function DuctEnds({ className }: { className?: string }) {
  const pills: [number, number, number][] = [[0, 0, 174], [174, 58, 116], [0, 116, 174], [174, 174, 116], [0, 232, 116]];
  return (
    <svg className={className} viewBox="0 0 290 290" aria-hidden="true" focusable="false">
      {pills.map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={58} rx={29} fill="#111111" />
          <circle cx={x + w - 29} cy={y + 29} r={13} fill="none" stroke="#3d3d3d" strokeWidth="2" />
          <circle cx={x + w - 29} cy={y + 29} r={5} fill="#3d3d3d" />
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// Small line icons, stroke 1.5 on a 24 box.

export function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.500 15.500 0 0 1 4.500 5.500a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function Arrow({ dir }: { dir: 'left' | 'right' | 'down' }) {
  const rot = dir === 'left' ? 180 : dir === 'down' ? 90 : 0;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true" focusable="false">
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}
