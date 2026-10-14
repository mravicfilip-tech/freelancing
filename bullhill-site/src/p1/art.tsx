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
          <rect x={x} y={y} width={w} height={58} fill="#111111" />
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

// ---------------------------------------------------------------------------------------------
// The trench cut open, round 3 note 2. A real cross section on an oblique block. Front face is the
// cut, top and right faces give it depth. Layers top to bottom are the surface slab, the base
// course, backfill, warning tape, and the duct bundle on its sand bed, the trench sits in native
// earth. Every part has its own texture so each reads on its own. One stroke weight, 1px.
// Coordinates are viewBox units. The labels are HTML and sit on the two edges CUT_EDGE, so every
// leader line starts exactly on a label edge, runs level, and ends on a dot inside its part.

export const CUT_VB = { x: 0, y: 80, w: 1080, h: 390 };
// Left labels end at x 170, right labels start at x 900. Phone and tablet crop to x 110 to 960 and
// show a numbered square in place of each label, same edge, same leader line.
export const CUT_EDGE = { l: 170, r: 900 };
export const CUT_CROP = { x: 110, w: 850 };

export type CutId = 'surface' | 'base' | 'tape' | 'backfill' | 'ducts' | 'sand';
export const CUT_PINS: Record<CutId, { side: 'l' | 'r'; tx: number; ty: number }> = {
  surface: { side: 'l', tx: 252, ty: 145 },
  base: { side: 'r', tx: 748, ty: 180 },
  tape: { side: 'r', tx: 604, ty: 306 },
  backfill: { side: 'l', tx: 412, ty: 256 },
  ducts: { side: 'l', tx: 482, ty: 365 },
  sand: { side: 'r', tx: 592, ty: 404 },
};

// Block geometry. The front face runs X0 to X1, the trench T0 to T1, the oblique depth is DX, DY.
const X0 = 200;
const X1 = 800;
const T0 = 360;
const T1 = 640;
const DX = 70;
const DY = -36;
const Y_TOP = 130;
const Y_SLAB = 160;
const Y_BASE = 200;
const Y_TAPE0 = 300;
const Y_TAPE1 = 312;
const Y_SAND = 342;
const Y_TRENCH = 420;
const Y_BOT = 450;
const DUCT_R = 15;
const DUCTS: [number, number, boolean][] = [
  [464, 396, false],
  [500, 396, false],
  [536, 396, false],
  [482, 365, true],
  [518, 365, false],
];

const dstr = (pts: [number, number][], close = false) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L') + (close ? ' Z' : '');

function cutTextures() {
  const r = rng(7);
  // Surface slab, short level dashes.
  let surface = '';
  for (let i = 0; i < 46; i++) {
    const x = X0 + 10 + r() * (X1 - X0 - 40);
    const y = Y_TOP + 6 + r() * (Y_SLAB - Y_TOP - 12);
    surface += `M${f1(x)} ${f1(y)} h${f1(5 + r() * 9)} `;
  }
  // Base course, small stones.
  const stones: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 150 && stones.length < 70; i++) {
    const s = { x: X0 + 8 + r() * (X1 - X0 - 16), y: Y_SLAB + 7 + r() * (Y_BASE - Y_SLAB - 14), r: 1.4 + r() * 1.8 };
    if (stones.every((o) => (o.x - s.x) ** 2 + (o.y - s.y) ** 2 > (o.r + s.r + 4) ** 2)) stones.push(s);
  }
  // Backfill, compacted fines. Kept clear of the tape band.
  const fill: { x: number; y: number; r: number }[] = [];
  for (let y = Y_BASE + 9; y < Y_SAND - 4; y += 13) {
    if (y > Y_TAPE0 - 8 && y < Y_TAPE1 + 8) continue;
    for (let x = T0 + 9 + ((y / 13) % 2) * 6; x < T1 - 6; x += 12) fill.push({ x: x + (r() - 0.5) * 5, y: y + (r() - 0.5) * 5, r: 0.9 + r() * 0.8 });
  }
  // Sand, a fine stipple around the ducts.
  const sand: { x: number; y: number }[] = [];
  for (let y = Y_SAND + 5; y < Y_TRENCH - 3; y += 6.5) {
    for (let x = T0 + 6 + ((y / 6.5) % 2) * 3; x < T1 - 3; x += 7) {
      const px = x + (r() - 0.5) * 3;
      const py = y + (r() - 0.5) * 3;
      if (DUCTS.some(([cx, cy]) => (cx - px) ** 2 + (cy - py) ** 2 < (DUCT_R + 4) ** 2)) continue;
      sand.push({ x: px, y: py });
    }
  }
  // Earth, 45 degree hatching, drawn long and clipped to the earth shapes.
  let hatch = '';
  for (let x = X0 - 340; x < X1 + DX; x += 16) hatch += `M${x} ${Y_BOT + 40} L${x + 336} ${Y_BASE + DY - 10} `;
  // Tape, hazard slashes.
  let slashes = '';
  for (let x = T0 + 4; x < T1 - 8; x += 14) slashes += `M${x} ${Y_TAPE1} L${x + 10} ${Y_TAPE0} `;
  // Top face dashes.
  let top = '';
  for (let i = 0; i < 40; i++) {
    const u = r();
    const v = r();
    const x = X0 + u * (X1 - X0) + v * DX + 4;
    const y = Y_TOP + v * DY + 4;
    if (x + 12 > X1 + DX - 4 || x < X0 + v * DX + 4) continue;
    top += `M${f1(x)} ${f1(y)} h${f1(5 + r() * 8)} `;
  }
  return { surface, stones, fill, sand, hatch, slashes, top };
}

const CUT = cutTextures();

// Trace stage of a part, read by r3-process.css as --s.
const stage = (n: number) => ({ '--s': n }) as React.CSSProperties;

// The block's structure lines, one entry per run of a layer, [stage, points, closed]. Split so each
// layer draws in its turn from the surface down, ducts last. Joined, they are the same lines as one
// outline, the top face, the front face, the right face, the two joints and the trench walls.
type Pt = [number, number];
const EDGES: [number, Pt[], boolean][] = [
  [0, [[X0, Y_SLAB], [X0, Y_TOP], [X1, Y_TOP], [X1, Y_SLAB]], false],
  [0, [[X0, Y_TOP], [X0 + DX, Y_TOP + DY], [X1 + DX, Y_TOP + DY], [X1, Y_TOP]], false],
  [0, [[X1 + DX, Y_TOP + DY], [X1 + DX, Y_SLAB + DY]], false],
  [0, [[X0, Y_SLAB], [X1, Y_SLAB], [X1 + DX, Y_SLAB + DY]], false],
  [1, [[X0, Y_SLAB], [X0, Y_BASE]], false],
  [1, [[X1, Y_SLAB], [X1, Y_BASE]], false],
  [1, [[X1 + DX, Y_SLAB + DY], [X1 + DX, Y_BASE + DY]], false],
  [1, [[X0, Y_BASE], [X1, Y_BASE], [X1 + DX, Y_BASE + DY]], false],
  [2, [[X0, Y_BASE], [X0, Y_BOT]], false],
  [2, [[X1, Y_BASE], [X1, Y_BOT]], false],
  [2, [[X1 + DX, Y_BASE + DY], [X1 + DX, Y_BOT + DY]], false],
  [2, [[T0, Y_BASE], [T0, Y_TRENCH]], false],
  [2, [[T1, Y_BASE], [T1, Y_TRENCH]], false],
  [3, [[T0, Y_TAPE0], [T1, Y_TAPE0]], false],
  [3, [[T0, Y_TAPE1], [T1, Y_TAPE1]], false],
  [4, [[T0, Y_SAND], [T1, Y_SAND]], false],
  [4, [[T0, Y_TRENCH], [T1, Y_TRENCH]], false],
  [4, [[X0, Y_BOT], [X1, Y_BOT]], false],
  [4, [[X1 + DX, Y_BOT + DY], [X1, Y_BOT]], false],
];

export function TrenchCut({ className }: { className?: string }) {
  const earthFront = dstr(
    [
      [X0, Y_BASE],
      [T0, Y_BASE],
      [T0, Y_TRENCH],
      [T1, Y_TRENCH],
      [T1, Y_BASE],
      [X1, Y_BASE],
      [X1, Y_BOT],
      [X0, Y_BOT],
    ],
    true,
  );
  const earthSide = dstr(
    [
      [X1, Y_BASE],
      [X1 + DX, Y_BASE + DY],
      [X1 + DX, Y_BOT + DY],
      [X1, Y_BOT],
    ],
    true,
  );
  const pins = Object.entries(CUT_PINS) as [CutId, (typeof CUT_PINS)[CutId]][];
  return (
    <svg
      className={className}
      viewBox={`${CUT_VB.x} ${CUT_VB.y} ${CUT_VB.w} ${CUT_VB.h}`}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <defs>
        <clipPath id="cut-earth">
          <path d={earthFront} />
        </clipPath>
        <clipPath id="cut-earth-side">
          <path d={earthSide} />
        </clipPath>
      </defs>

      {/* Trace order. Each part carries its stage in --s, 0 surface, 1 base course, 2 backfill and the
          earth, 3 tape, 4 sand bed and the floor, 5 ducts. .cut__d parts draw, .cut__f parts fade in
          with their stage. The css is in r3-process.css and runs only with motion on. */}

      {/* native earth, hatched, front and right face */}
      <g className="cut__f" style={stage(2)}>
        <g opacity="0.2" clipPath="url(#cut-earth)">
          <path d={CUT.hatch} vectorEffect="non-scaling-stroke" />
        </g>
        <g opacity="0.2" clipPath="url(#cut-earth-side)">
          <path d={CUT.hatch} vectorEffect="non-scaling-stroke" />
        </g>
      </g>

      {/* surface slab */}
      <g className="cut__f" style={stage(0)}>
        <path d={CUT.surface} opacity="0.42" vectorEffect="non-scaling-stroke" />
      </g>
      {/* base course, stones */}
      <g className="cut__f" style={stage(1)}>
        <g opacity="0.5">
          {CUT.stones.map((s, i) => (
            <circle key={i} cx={f1(s.x)} cy={f1(s.y)} r={f1(s.r)} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </g>
      {/* backfill, fines */}
      <g className="cut__f" style={stage(2)}>
        <g stroke="none" fill="currentColor" opacity="0.5">
          {CUT.fill.map((s, i) => (
            <circle key={i} cx={f1(s.x)} cy={f1(s.y)} r={f1(s.r)} />
          ))}
        </g>
      </g>
      {/* sand bed, stipple */}
      <g className="cut__f" style={stage(4)}>
        <g stroke="none" fill="currentColor" opacity="0.55">
          {CUT.sand.map((s, i) => (
            <circle key={i} cx={f1(s.x)} cy={f1(s.y)} r="0.7" />
          ))}
        </g>
      </g>
      {/* warning tape, band with slashes */}
      <g className="cut__f" style={stage(3)}>
        <path d={CUT.slashes} opacity="0.7" vectorEffect="non-scaling-stroke" />
      </g>

      {/* the block, structure lines, split by layer so each layer draws in its turn */}
      {/* cut__whole is the outline as it was drawn before the trace, the settled page shows it, since
          a closed rect and open runs do not antialias alike. cut__split is the same lines in runs,
          shown instead of it only while the trace is on. */}
      <g className="cut__whole" opacity="0.92">
        <path d={dstr([[X0, Y_TOP], [X1, Y_TOP], [X1, Y_BOT], [X0, Y_BOT]], true)} vectorEffect="non-scaling-stroke" />
        <path d={dstr([[X0, Y_TOP], [X0 + DX, Y_TOP + DY], [X1 + DX, Y_TOP + DY], [X1, Y_TOP]])} vectorEffect="non-scaling-stroke" />
        <path d={dstr([[X1 + DX, Y_TOP + DY], [X1 + DX, Y_BOT + DY], [X1, Y_BOT]])} vectorEffect="non-scaling-stroke" />
        {/* layer joints across the face and down the right face */}
        <path d={dstr([[X0, Y_SLAB], [X1, Y_SLAB], [X1 + DX, Y_SLAB + DY]])} vectorEffect="non-scaling-stroke" />
        <path d={dstr([[X0, Y_BASE], [X1, Y_BASE], [X1 + DX, Y_BASE + DY]])} vectorEffect="non-scaling-stroke" />
        {/* trench walls and floor */}
        <path d={dstr([[T0, Y_BASE], [T0, Y_TRENCH], [T1, Y_TRENCH], [T1, Y_BASE]])} vectorEffect="non-scaling-stroke" />
        {/* tape band */}
        <path d={dstr([[T0, Y_TAPE0], [T1, Y_TAPE0]])} vectorEffect="non-scaling-stroke" />
        <path d={dstr([[T0, Y_TAPE1], [T1, Y_TAPE1]])} vectorEffect="non-scaling-stroke" />
        {/* top of the sand bed */}
        <path d={dstr([[T0, Y_SAND], [T1, Y_SAND]])} vectorEffect="non-scaling-stroke" />
      </g>
      <g className="cut__split" opacity="0.92">
        {EDGES.map(([n, pts, close], i) => (
          <path key={i} className="cut__d" style={stage(n)} pathLength={1} d={dstr(pts, close)} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      {/* where the trench runs under the surface, along the top face */}
      <g className="cut__f" style={stage(0)}>
        <g opacity="0.45" strokeDasharray="3 5">
          <path d={dstr([[T0, Y_TOP], [T0 + DX, Y_TOP + DY]])} vectorEffect="non-scaling-stroke" />
          <path d={dstr([[T1, Y_TOP], [T1 + DX, Y_TOP + DY]])} vectorEffect="non-scaling-stroke" />
        </g>
      </g>
      <g className="cut__f" style={stage(0)}>
        <g opacity="0.35">
          <path d={CUT.top} vectorEffect="non-scaling-stroke" />
        </g>
      </g>

      {/* ducts, ring with a wall. The one in bull-red is the duct the label names. */}
      {DUCTS.map(([cx, cy, red], i) => (
        <g key={i}>
          <g className="cut__f cut__f--q" style={stage(5)}>
            <circle cx={cx} cy={cy} r={DUCT_R} stroke="none" style={red ? { fill: 'var(--bh-red)' } : { fill: 'var(--bh-grey-975)' }} />
            <circle cx={cx} cy={cy} r={DUCT_R - 4.5} opacity="0.7" vectorEffect="non-scaling-stroke" />
          </g>
          <circle className="cut__d" style={stage(5)} pathLength={1} cx={cx} cy={cy} r={DUCT_R} fill="none" vectorEffect="non-scaling-stroke" />
        </g>
      ))}

      {/* leader lines, level, from the label edge to the dot inside the part. --li is the layer's
          place in the list, it sets when the line and its label arrive. */}
      <g className="cut__leads">
        {pins.map(([id, p], li) => (
          <g key={id} className={`cut__lead cut__lead--${id}`} style={{ '--li': li } as React.CSSProperties}>
            <path className="cut__ld" pathLength={1} d={`M${CUT_EDGE[p.side]} ${p.ty} H${p.tx}`} vectorEffect="non-scaling-stroke" />
            <circle className="cut__dot" cx={p.tx} cy={p.ty} r="3.5" style={{ fill: '#fff', stroke: 'var(--bh-grey-975)', strokeWidth: 1.5 }} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>
    </svg>
  );
}
