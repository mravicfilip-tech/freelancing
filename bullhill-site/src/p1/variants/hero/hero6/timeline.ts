import { clamp01, smooth } from './geometry';

// Hero 6 beats 1 to 3, briefs/website/hero6-story.md. One clock for the load, so the scene, the
// overlay and the headline read the same time.
//
//   beat 1  load      0 to 1.2s   headline lines rise out of their mask, then the lede and the buttons
//   beat 2  assemble  0.6 to 2.8s the seam drops, the schematic draws, the dots settle, the render wipes
//   beat 3  idle      loop        a slow drift, a tilt towards the pointer, light across the fibre ends
//
// `?t=<ms>` freezes the clock at that time, the way `?p=` freezes the scroll. Past 2800 the extra
// time is idle time, so `?t=5800` is three seconds into the idle loop.

export const A0 = 600;
export const A1 = 2800;
export const ASSEMBLE = A1 - A0;

// cubic-bezier(x1, y1, x2, y2) as a function of x, the same curve as --m-ease
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x;
      if (Math.abs(e) < 1e-5) return Y(t);
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const e = X(t) - x;
      if (Math.abs(e) < 1e-5) break;
      if (e > 0) hi = t;
      else lo = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}

export const riseEase = bezier(0.2, 0.7, 0.1, 1);

export function urlFreeze(): number | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('t');
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

const win = (a: number, start: number, len: number) => clamp01((a - start) / len);

export type Assemble = {
  seam: number; // the seam line drops from the top of the specimen
  edges: number; // share of the schematic's lines drawn
  dots: number; // the soil dots fly in, each with its own delay inside this
  wipe: number; // the render wipes out from the seam
  tags: number; // the two seam tags
  leader: (i: number) => number; // leader i draws from its label to its layer
};

// a is the time since assemble began, in ms. Everything is 1 at ASSEMBLE, which is beat 4's p 0.
export function assembleAt(a: number): Assemble {
  return {
    seam: riseEase(win(a, 0, 800)),
    edges: smooth(win(a, 100, 1600)),
    dots: win(a, 250, 1950),
    wipe: riseEase(win(a, 700, 1500)),
    tags: win(a, 1100, 500),
    leader: (i) => riseEase(win(a, 900 + i * 110, 750)),
  };
}
export const SETTLED = assembleAt(Infinity);

// ---- beat 3, idle
const DRIFT_YAW = 1.25; // degrees each side, 2.5 swing
const DRIFT_PITCH = 0.4;
const TILT_YAW = 1.4;
const TILT_PITCH = 0.9;
export const PULSE_EVERY = 5000;
const PULSE_AT = 1000;
const PULSE_LEN = 1500;

// how far the pointer tilt has come, smoothed
const tau = 240;

export function idlePulse(idle: number) {
  const ph = idle % PULSE_EVERY;
  const s = (ph - PULSE_AT) / PULSE_LEN;
  return idle >= PULSE_AT && s >= 0 && s <= 1 ? s : -1;
}
// level 0 to 1 for a fibre sitting at u along the row, while a pulse is at s
export function pulseLevel(s: number, u: number) {
  if (s < 0) return 0;
  const head = -0.25 + 1.5 * s;
  const d = (head - u) / 0.18;
  return Math.exp(-d * d);
}
export function msToNextPulse(idle: number) {
  const ph = idle % PULSE_EVERY;
  return ph < PULSE_AT ? PULSE_AT - ph : PULSE_EVERY - ph + PULSE_AT;
}

export class LoadClock {
  readonly frozen: number | null;
  readonly t0 = performance.now();
  private a0: number | null;
  private skipped = false;
  private idleBase = 0;
  private idleSince: number | null = null;
  private visible = true;
  private timer = 0;
  private subs = new Set<() => void>();
  pointer = { x: 0, y: 0 };
  private tilt = { x: 0, y: 0 };
  tilting = false;
  // the camera yaw and pitch in degrees, written by the scene each frame, read by the overlay
  view = { yaw: 0, pitch: 0 };

  constructor(freeze: number | null) {
    this.frozen = freeze;
    this.a0 = freeze !== null ? A0 : null;
  }

  t() {
    return this.frozen ?? performance.now() - this.t0;
  }
  get begun() {
    return this.a0 !== null;
  }
  // the assemble starts when the scene has drawn its first frame, and not before 0.6s
  begin() {
    if (this.a0 !== null) return;
    this.a0 = Math.max(A0, this.t());
    this.timer = window.setTimeout(() => this.change(), ASSEMBLE + 20);
    this.change();
  }
  // time since the assemble began, -1 before it has
  a() {
    if (this.skipped) return Infinity;
    if (this.a0 === null) return -1;
    return this.t() - this.a0;
  }
  assembled() {
    return this.a() >= ASSEMBLE;
  }
  // scroll before the assemble ends, it completes at once
  skip() {
    if (this.skipped || this.assembled() || this.frozen !== null) return;
    this.skipped = true;
    window.clearTimeout(this.timer);
    this.change();
  }
  skippedNow() {
    return this.skipped;
  }
  setVisible(v: boolean) {
    if (v === this.visible) return;
    this.visible = v;
    this.change();
  }
  isVisible() {
    return this.visible;
  }
  // idle time, ms, counted while the hero is on screen
  idle() {
    if (this.frozen !== null) return Math.max(0, this.frozen - A1);
    const now = performance.now();
    const on = this.assembled() && this.visible;
    if (on && this.idleSince === null) this.idleSince = this.skipped || this.a0 === null ? now : Math.min(now, this.t0 + this.a0 + ASSEMBLE);
    if (!on && this.idleSince !== null) {
      this.idleBase += now - this.idleSince;
      this.idleSince = null;
    }
    return this.idleBase + (this.idleSince !== null ? now - this.idleSince : 0);
  }
  idleRun() {
    return this.assembled() && this.visible;
  }
  on(fn: () => void) {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  }
  // ask the scene for a frame, for the pointer
  poke() {
    this.change();
  }
  private change() {
    this.idle();
    this.subs.forEach((f) => f());
  }

  // Drift plus the pointer tilt, with amp 0 to 1 (0 once beat 4 has moved on). Returns true while
  // something still moves, so the scene knows to ask for another frame.
  stepView(dt: number, amp: number, idle: number, run: boolean) {
    const w = (Math.PI * 2 * idle) / 16000;
    const w2 = (Math.PI * 2 * idle) / 11000;
    const dyaw = run ? DRIFT_YAW * Math.sin(w) : 0;
    const dpitch = run ? DRIFT_PITCH * Math.sin(w2 + 1) - DRIFT_PITCH * Math.sin(1) : 0;
    let moving = run && amp > 0;
    this.tilting = false;
    if (this.frozen === null) {
      const k = 1 - Math.exp(-dt / tau);
      const tx = this.pointer.x * TILT_YAW;
      const ty = this.pointer.y * TILT_PITCH;
      this.tilt.x += (tx - this.tilt.x) * k;
      this.tilt.y += (ty - this.tilt.y) * k;
      if (amp > 0 && (Math.abs(tx - this.tilt.x) > 0.002 || Math.abs(ty - this.tilt.y) > 0.002)) {
        moving = true;
        this.tilting = true;
      }
    }
    this.view.yaw = amp * (dyaw + this.tilt.x);
    this.view.pitch = amp * (dpitch + this.tilt.y);
    return moving;
  }
}
