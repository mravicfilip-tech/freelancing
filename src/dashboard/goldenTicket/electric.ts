/**
 * The electric border, ported from the presale dashboard's Mystery-box prize cards and set in gold.
 *
 * Every frame the ticket's outline — rounded corners and a notch on each short side — is traced at a
 * few pixels a step and pushed in and out along its normal by layered 1-D noise that drifts with
 * time, so the edge crawls like a live wire. It is stroked as a stack: wide faint halos, a gold
 * glow, a white-hot core, and the whole thing flickers a little. On top of that, short arcs jump off
 * the edge and throw sparks that fall under gravity, which is what makes it crackle rather than
 * merely glow. The dashboard draws its cards at 30 frames a second and so does this: the stepped
 * motion is part of what reads as electricity.
 *
 * It draws into a canvas that sits inside the ticket's own transformed box, `pad` larger on every
 * side, so it rotates, tilts and scales with the ticket for free.
 */

export type Electric = {
  /** sparks from `n` random points on the edge, or from one point in the ticket's own pixels */
  burst(n: number, at?: [number, number]): void;
  /** a surge: the wire brightens and crackles harder for a moment */
  surge(k?: number): void;
  /** how much of the outline is drawn, 0–1, for the loading trace */
  setDraw(p: number): void;
  /** run or pause the loop */
  setRunning(on: boolean): void;
  stop(): void;
};

const GOLD_HALO = [255, 178, 58];
const GOLD_GLOW = [255, 210, 116];
const CORE = [255, 247, 224];
const rgba = ([r, g, b]: number[], a: number) => `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;

const fract = (x: number) => x - Math.floor(x);
const hash = (x: number) => {
  let v = fract(x * 0.1031);
  v *= v + 33.33;
  v *= v + v;
  return fract(v);
};
const vnoise = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) + (hash(i + 1) - hash(i)) * u;
};
/** the dashboard's noise: three octaves drifting against each other */
const fbm = (d: number, t: number) => vnoise(d * 0.05 + t * 18) - 0.5 + (vnoise(d * 0.15 - t * 32) - 0.5) * 0.5 + (vnoise(d * 0.45 + t * 50) - 0.5) * 0.25;

type Seg = { len: number; at: (s: number) => [number, number, number, number] };
export type Outline = { L: number; at: (d: number) => [number, number, number, number] };

/** An outline from a closed, clockwise polyline in the host's pixels; normals from the tangent. */
export function fromPolyline(pts: [number, number][]): Outline {
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i % pts.length];
    cum.push(cum[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const L = cum[cum.length - 1];
  const point = (d: number): [number, number] => {
    const x = ((d % L) + L) % L;
    let lo = 0;
    let hi = pts.length;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= x) lo = mid;
      else hi = mid;
    }
    const [x0, y0] = pts[lo];
    const [x1, y1] = pts[(lo + 1) % pts.length];
    const f = (x - cum[lo]) / (cum[lo + 1] - cum[lo] || 1);
    return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
  };
  return {
    L,
    at: (d) => {
      const [x, y] = point(d);
      const [ax, ay] = point(d - 1.5);
      const [bx, by] = point(d + 1.5);
      const tl = Math.hypot(bx - ax, by - ay) || 1;
      // clockwise on a y-down screen: the outward normal is the tangent turned a quarter left
      return [x, y, (by - ay) / tl, -(bx - ax) / tl];
    },
  };
}

export type ElectricOptions = {
  /** the canvas overhang on every side, as a share of the host's width */
  pad?: number;
  /** the outline to trace, in the host's pixels; the ticket's own notched card by default */
  shape?: (W: number, H: number) => Outline;
  /** points of the outline that are hidden (behind a hand, say) are not drawn and do not spark */
  visible?: (x: number, y: number, W: number, H: number) => boolean;
  /** what one design pixel of the stroke is, for this host width */
  unit?: (W: number) => number;
  /** how far the wire crawls off the edge, and how wide its halo is (1 = the dashboard's) */
  amp?: number;
  /** how much a surge adds to the crawl (1 = the dashboard's); below 1 a surge is mostly light */
  surgeAmp?: number;
  halo?: number;
  /** whether the wire throws spark particles; without them a burst is a surge */
  sparks?: boolean;
  /** how much of the outline is drawn to begin with (1 by default) */
  draw?: number;
};

/** The ticket's outline, clockwise from the top edge: each point with its outward normal. */
function outline(W: number, H: number, r: number, n: number) {
  const segs: Seg[] = [];
  const line = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    segs.push({ len, at: (s) => [x0 + ((x1 - x0) * s) / len, y0 + ((y1 - y0) * s) / len, nx, ny] });
  };
  /* `sign` 1 for a corner (normal away from its centre), -1 for a notch (normal into the notch,
     which is outside the ticket). */
  const arc = (cx: number, cy: number, rad: number, a0: number, a1: number, sign: number) => {
    const len = Math.abs(a1 - a0) * rad;
    segs.push({
      len,
      at: (s) => {
        const a = a0 + ((a1 - a0) * s) / len;
        const c = Math.cos(a);
        const si = Math.sin(a);
        return [cx + rad * c, cy + rad * si, sign * c, sign * si];
      },
    });
  };
  const h = H / 2;
  line(r, 0, W - r, 0, 0, -1);
  arc(W - r, r, r, -Math.PI / 2, 0, 1);
  line(W, r, W, h - n, 1, 0);
  arc(W, h, n, -Math.PI / 2, (-3 * Math.PI) / 2, -1);
  line(W, h + n, W, H - r, 1, 0);
  arc(W - r, H - r, r, 0, Math.PI / 2, 1);
  line(W - r, H, r, H, 0, 1);
  arc(r, H - r, r, Math.PI / 2, Math.PI, 1);
  line(0, H - r, 0, h + n, -1, 0);
  arc(0, h, n, Math.PI / 2, -Math.PI / 2, -1);
  line(0, h - n, 0, r, -1, 0);
  arc(r, r, r, Math.PI, (3 * Math.PI) / 2, 1);
  const L = segs.reduce((s, g) => s + g.len, 0);
  const at = (d: number): [number, number, number, number] => {
    let x = ((d % L) + L) % L;
    for (const g of segs) {
      if (x <= g.len) return g.at(x);
      x -= g.len;
    }
    return segs[0].at(0);
  };
  return { L, at };
}

/** The notch and corner radii as shares of the ticket's height, shared with the CSS mask. */
export const NOTCH = 0.085;
export const CORNER = 0.075;

type Spark = { x: number; y: number; vx: number; vy: number; born: number; ttl: number; r: number; white: boolean };
type Arc = { d: number; len: number; born: number; ttl: number; seed: number };

export function electric(canvas: HTMLCanvasElement, host: HTMLElement, opts: ElectricOptions = {}): Electric {
  const padShare = opts.pad ?? 0.16;
  const seen = (x: number, y: number) => !opts.visible || opts.visible(x, y, W, H);
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0;
  let H = 0;
  let pad = 0;
  let k = 1;
  let ratio = 1;
  let shape: Outline = outline(1, 1, 0, 0);
  let draw = opts.draw ?? 1;
  let intensity = 1;
  let surgeTo = 1;
  let running = false;
  let raf = 0;
  let last = 0;
  let prev = performance.now();
  let sparks: Spark[] = [];
  let arcs: Arc[] = [];
  const t0 = performance.now();

  const resize = () => {
    W = host.offsetWidth;
    H = host.offsetHeight;
    if (!W || !H) return;
    pad = Math.round(W * padShare);
    k = opts.unit ? opts.unit(W) : W / 440;
    ratio = Math.min(3, (window.devicePixelRatio || 1) * 1.4);
    canvas.style.left = canvas.style.top = `${-pad}px`;
    canvas.style.width = `${W + 2 * pad}px`;
    canvas.style.height = `${H + 2 * pad}px`;
    canvas.width = Math.round((W + 2 * pad) * ratio);
    canvas.height = Math.round((H + 2 * pad) * ratio);
    shape = opts.shape ? opts.shape(W, H) : outline(W, H, H * CORNER, H * NOTCH);
    paint(performance.now());
  };

  const trace = (t: number, amp: number, upTo: number) => {
    if (!ctx) return;
    const { L, at } = shape;
    const end = L * upTo;
    const step = 3;
    ctx.beginPath();
    let pen = false;
    let gaps = false;
    for (let d = 0; d <= end + 0.01; d += step) {
      const [x, y, nx, ny] = at(Math.min(d, end));
      if (!seen(x, y)) {
        pen = false;
        gaps = true;
        continue;
      }
      /* blend the noise into its own start over the last stretch, so the seam does not jump */
      const w = Math.max(0, Math.min(1, (d - (L - 40)) / 40));
      const nz = fbm(d, t) * (1 - w) + fbm(d - L, t) * w;
      const m = still ? 0 : Math.sign(nz) * Math.abs(nz) ** 1.15 * amp;
      if (!pen) ctx.moveTo(x + nx * m, y + ny * m);
      else ctx.lineTo(x + nx * m, y + ny * m);
      pen = true;
    }
    if (upTo >= 1 && !gaps) ctx.closePath();
  };

  const stroke = (flicker: number, gain: number) => {
    if (!ctx) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const J = 20.83 * k * (opts.halo ?? 1);
    for (const [w, a] of [
      [J * 1.6, 0.05],
      [J * 1.1, 0.08],
      [J * 0.7, 0.12],
      [J * 0.4, 0.18],
      [6 * k, 0.34],
    ]) {
      ctx.strokeStyle = rgba(GOLD_HALO, a * flicker * gain);
      ctx.lineWidth = w;
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(GOLD_GLOW, 0.9 * flicker);
    ctx.lineWidth = 2.2 * k;
    ctx.stroke();
    ctx.strokeStyle = rgba(CORE, 0.95 * flicker);
    ctx.lineWidth = 1.1 * k;
    ctx.stroke();
  };

  const spawnSparks = (n: number, x: number, y: number, nx: number, ny: number, power = 1) => {
    if (opts.sparks === false) return;
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(ny, nx) + (Math.random() - 0.5) * 2.2;
      const v = (120 + Math.random() * 340) * power * k;
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 60 * k,
        born: now,
        ttl: 600 + Math.random() * 700,
        r: (1.2 + Math.random() * 2.2) * k,
        white: Math.random() < 0.35,
      });
    }
  };

  const paint = (now: number) => {
    if (!ctx || !W) return;
    const t = ((now - t0) / 1000) * 0.7;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, W + 2 * pad, H + 2 * pad);
    ctx.translate(pad, pad);
    if (draw <= 0) return;
    const gain = intensity;
    const flicker = still ? 1 : 0.9 + 0.1 * Math.sin(now / 1000 * 9) + (Math.random() < 0.04 ? -0.25 : 0);
    const amp = (2.1 + 2.4 * (intensity - 1) * (opts.surgeAmp ?? 1)) * k * (opts.amp ?? 1);
    trace(t, amp, draw);
    stroke(flicker, gain);

    // the loading trace has a white-hot head
    const head = shape.at(shape.L * draw);
    if (draw < 1 && seen(head[0], head[1])) {
      const [hx, hy, nx, ny] = head;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 26 * k);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.25, rgba(GOLD_GLOW, 0.7));
      g.addColorStop(1, rgba(GOLD_HALO, 0));
      ctx.fillStyle = g;
      ctx.fillRect(hx - 26 * k, hy - 26 * k, 52 * k, 52 * k);
      if (!still && Math.random() < 0.6) spawnSparks(2, hx, hy, nx, ny, 0.7);
    }

    if (!still) {
      // arcs jump off the edge
      const ad = Math.random() * shape.L;
      const ap = shape.at(ad);
      if (draw >= 1 && seen(ap[0], ap[1]) && Math.random() < 0.09 * intensity * intensity) {
        arcs.push({ d: ad, len: (10 + Math.random() * 22) * k * (0.8 + 0.3 * intensity), born: now, ttl: 110 + Math.random() * 120, seed: Math.random() * 1000 });
      }
      arcs = arcs.filter((a) => now - a.born < a.ttl);
      for (const a of arcs) {
        const [x, y, nx, ny] = shape.at(a.d);
        const tx = -ny;
        const ty = nx;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const segs = 5;
        let ex = x;
        let ey = y;
        for (let i = 1; i <= segs; i++) {
          const s = (a.len * i) / segs;
          const j = (hash(a.seed + i * 7.3 + Math.floor(now / 40)) - 0.5) * 9 * k;
          ex = x + nx * s + tx * j;
          ey = y + ny * s + ty * j;
          ctx.lineTo(ex, ey);
        }
        const on = Math.random() < 0.85 ? 1 : 0.3;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = rgba(GOLD_HALO, 0.16 * on);
        ctx.lineWidth = 9 * k;
        ctx.stroke();
        ctx.strokeStyle = rgba(GOLD_GLOW, 0.75 * on);
        ctx.lineWidth = 2 * k;
        ctx.stroke();
        ctx.strokeStyle = rgba(CORE, 0.95 * on);
        ctx.lineWidth = 0.9 * k;
        ctx.stroke();
        if (now - a.born < 20) spawnSparks(3, ex, ey, nx, ny, 0.6);
      }

      // sparks fall under gravity
      const dt = Math.min(0.05, (now - prev) / 1000);
      sparks = sparks.filter((s) => now - s.born < s.ttl);
      for (const s of sparks) {
        s.vy += 520 * k * dt;
        s.vx *= 0.985;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const e = (now - s.born) / s.ttl;
        const a = e < 0.7 ? 1 : 1 - (e - 0.7) / 0.3;
        const r = s.r * (1 - e * 0.5);
        ctx.fillStyle = rgba(GOLD_HALO, 0.22 * a);
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = s.white ? `rgba(255,255,255,${a})` : rgba(GOLD_GLOW, a);
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // a surge eases back down
    intensity += (surgeTo - intensity) * 0.18;
    surgeTo += (1 - surgeTo) * 0.06;
    prev = now;
  };

  const loop = (now: number) => {
    raf = 0;
    if (!running) return;
    if (!document.hidden && now - last >= 30) {
      last = now;
      paint(now);
    }
    raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (running && !raf && !still) raf = requestAnimationFrame(loop);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  return {
    burst(n, at) {
      if (still || !W) return;
      if (opts.sparks === false) {
        surgeTo = Math.max(surgeTo, 1.6 + Math.min(1.2, n / 60));
        kick();
        return;
      }
      for (let i = 0; i < n; i++) {
        if (at) spawnSparks(1, at[0], at[1], Math.random() - 0.5, -1, 1);
        else {
          for (let tries = 0; tries < 8; tries++) {
            const [x, y, nx, ny] = shape.at(Math.random() * shape.L);
            if (!seen(x, y)) continue;
            spawnSparks(1, x, y, nx, ny, 1);
            break;
          }
        }
      }
      kick();
    },
    surge(kk = 1.8) {
      surgeTo = Math.max(surgeTo, kk);
      kick();
    },
    setDraw(p) {
      draw = p;
      paint(performance.now());
    },
    setRunning(on) {
      running = on;
      if (on) kick();
      else paint(performance.now());
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
