/**
 * Everything that happens after the entrance has landed.
 *
 * One rAF loop drives the whole band. That is deliberate: the arcs, pills and
 * diamonds each carry three separate contributions at once — an endless
 * ambient wander, a scroll-linked depth offset, and a damped pointer reaction —
 * and three tween systems fighting over the same `transform` is how a section
 * ends up janky and off-design. Composing them by hand means one write per
 * element per frame, and an exact, reproducible neutral state to return to.
 *
 * `drift()` and `parallax()` from the shared library are deliberately not used
 * here: `drift` always writes `rotate`, which would flatten the diamonds' CSS
 * `rotate(135deg)` into squares, and `parallax` owns `y` outright, which leaves
 * nowhere for the scroll planes and the wander to add up.
 */

import { gsap } from 'gsap';
import type { FanField, SampledArc } from './fan-field';

export interface ConductorHosts {
  section: HTMLElement;
  arcs: HTMLElement[]; // the two masked group boxes
  lines: HTMLElement[]; // the four <img> sheets of linework
  diamonds: HTMLElement[];
  pills: HTMLElement[];
  tile: HTMLElement | null;
  aura: HTMLElement | null;
  field: HTMLElement | null;
}

export interface Conductor {
  stop(): void;
  /** Re-measure after a resize; the field needs fresh arc samples. */
  remeasure(arcs: SampledArc[], w: number, h: number): void;
  /** The WebGL layer arrives late — it is an await away — so it is plugged in
      once it exists rather than held up by it. */
  attachField(f: FanField | null): void;
}

const TAU = Math.PI * 2;
/** Incommensurate periods, so a frame at 10s never repeats at 20s. */
const golden = (i: number) => ((i * 0.6180339887) % 1) * TAU;

export function startConductor(h: ConductorHosts, initialField: FanField | null = null): Conductor {
  let field = initialField;
  const { section, arcs, lines, diamonds, pills, tile, aura } = h;

  /* --- scroll ------------------------------------------------------------ */
  let progress = 0.5;        // 0 = section entering from below, 1 = leaving above
  let rectDirty = true;
  const readRect = () => {
    const r = section.getBoundingClientRect();
    const span = innerHeight + r.height;
    progress = span > 0 ? Math.min(1, Math.max(0, (innerHeight - r.top) / span)) : 0.5;
    rectDirty = false;
  };
  const onScroll = () => { rectDirty = true; };

  /* --- pointer ----------------------------------------------------------- */
  let ptrX = 0, ptrY = 0;          // band px, raw target
  let curX = 0, curY = 0;          // damped
  let ptrIn = 0, ptrInCur = 0;     // presence, damped
  const onMove = (e: PointerEvent) => {
    const r = section.getBoundingClientRect();
    ptrX = e.clientX - r.left;
    ptrY = e.clientY - r.top;
    ptrIn = 1;
  };
  const onLeave = () => { ptrIn = 0; };

  /* --- per-element hover ------------------------------------------------- */
  const hover = new Map<HTMLElement, { want: number; now: number }>();
  const hoverables = [...pills, ...(tile ? [tile] : [])];
  const enter = (e: Event) => { const s = hover.get(e.currentTarget as HTMLElement); if (s) s.want = 1; };
  const exit = (e: Event) => { const s = hover.get(e.currentTarget as HTMLElement); if (s) s.want = 0; };
  hoverables.forEach((el) => {
    hover.set(el, { want: 0, now: 0 });
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', exit);
  });

  /* --- writers ----------------------------------------------------------- */
  /* The arcs keep their stylesheet rotation, so gsap composes those two; the
     small elements are written as one transform string, which is a single
     style write instead of four gsap transform rebuilds per element. */
  const lineX = lines.map((n) => {
    gsap.set(n, { x: 0, y: 0, force3D: false });
    return gsap.quickSetter(n, 'x', 'px') as (v: number) => void;
  });
  const lineY = lines.map((n) => gsap.quickSetter(n, 'y', 'px') as (v: number) => void);

  let running = true;
  let raf = 0;
  let t0 = performance.now();
  let last = t0;
  let power = 0;                      // the field fades itself up once
  const bandOf = () => {
    const f = section.querySelector<HTMLElement>('.fan__frame');
    return f ? f.getBoundingClientRect() : section.getBoundingClientRect();
  };
  let band = bandOf();
  /* Diamond centres are measured once, never per frame: reading offsetLeft in
     the loop would force a layout on every element on every frame. */
  let dCentre = diamonds.map((el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2 - band.left, r.top + r.height / 2 - band.top] as const;
  });

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;

    if (rectDirty) readRect();
    const dep = (progress - 0.5) * 2;           // -1 .. 1 across the pass

    const k = 1 - Math.exp(-dt * 7.5);          // damping toward the cursor
    curX += (ptrX - curX) * k;
    curY += (ptrY - curY) * k;
    ptrInCur += (ptrIn - ptrInCur) * (1 - Math.exp(-dt * 4));
    power += (1 - power) * (1 - Math.exp(-dt * 1.6));

    const nx = band.width ? (curX / band.width - 0.5) * 2 : 0;   // -1 .. 1
    const ny = band.height ? (curY / band.height - 0.5) * 2 : 0;

    /* Arcs: the two groups pass each other as the section crosses the
       viewport, lean against the cursor, and breathe on top of both. */
    let offA = 0, offB = 0;
    for (let i = 0; i < lines.length; i++) {
      const left = i < 2;
      const dir = left ? 1 : -1;
      const sheet = i % 2 ? 1 : -1;
      const x = dir * dep * -34 + dir * nx * ptrInCur * 11 + Math.sin(t * 0.21 + golden(i)) * 4.5;
      const y = sheet * dep * 13 + ny * ptrInCur * 5 * dir + Math.sin(t * 0.17 + golden(i + 7)) * 3.2;
      lineX[i](x);
      lineY[i](y);
      if (left) offA = x; else offB = x;
    }

    for (let i = 0; i < diamonds.length; i++) {
      const el = diamonds[i];
      const depth = 0.35 + ((i * 5) % 7) * 0.13;
      /* scatter: pushed gently away from the cursor, falling off with distance */
      const dx = curX - dCentre[i][0];
      const dy = curY - dCentre[i][1];
      const d2 = dx * dx + dy * dy;
      const push = ptrInCur * 900 / (d2 + 2600);
      const x = Math.sin(t * 0.43 + golden(i)) * 3.4 - dx * push;
      const y = dep * depth * 44 + Math.sin(t * 0.37 + golden(i + 3)) * 4.2 - dy * push;
      /* every mark twinkles on its own period, none of them together */
      const tw = 0.5 + 0.5 * Math.sin(t * (0.9 + (i % 5) * 0.21) + golden(i * 3));
      const sc = 0.88 + 0.26 * tw;
      const op = 0.55 + 0.45 * tw;
      const rot = 135 + Math.sin(t * 0.29 + golden(i + 11)) * 9;
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      el.style.opacity = op.toFixed(3);
    }

    for (let i = 0; i < pills.length; i++) {
      const el = pills[i];
      const st = hover.get(el);
      if (st) st.now += (st.want - st.now) * (1 - Math.exp(-dt * 11));
      const hv = st ? st.now : 0;
      const depth = 0.4 + (i % 3) * 0.26;
      const x = Math.sin(t * 0.33 + golden(i + 2)) * 2.6 + nx * ptrInCur * 3.2;
      const y = dep * depth * 20 + Math.sin(t * 0.27 + golden(i + 5)) * 2.8 - hv * 3;
      const sc = 1 + hv * 0.055;
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${sc.toFixed(3)})`;
      el.style.opacity = (0.7 + hv * 0.3).toFixed(3);
    }

    if (tile) {
      const st = hover.get(tile);
      if (st) st.now += (st.want - st.now) * (1 - Math.exp(-dt * 11));
      const hv = st ? st.now : 0;
      const breathe = Math.sin(t * 0.63) * 0.5 + 0.5;
      const sc = 1 + breathe * 0.008 + hv * 0.03;
      const y = dep * -9;
      tile.style.transform = `translate(0px, ${y.toFixed(2)}px) scale(${sc.toFixed(4)})`;
      if (aura) {
        aura.style.opacity = (0.30 + breathe * 0.34 + hv * 0.3).toFixed(3);
        aura.style.transform = `translate(0px, ${y.toFixed(2)}px) scale(${(2.3 + breathe * 0.28 + hv * 0.22).toFixed(3)})`;
      }
    }

    if (field) {
      field.render(t, power, ptrInCur > 0.02 ? [curX, curY] : null, offA, offB);
    }
  };

  addEventListener('scroll', onScroll, { passive: true });
  section.addEventListener('pointermove', onMove, { passive: true });
  section.addEventListener('pointerleave', onLeave);
  readRect();
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      hoverables.forEach((el) => {
        el.removeEventListener('pointerenter', enter);
        el.removeEventListener('pointerleave', exit);
      });
      /* Hand every element back to the stylesheet, exactly as it was. */
      gsap.set(lines, { clearProps: 'transform' });
      [...diamonds, ...pills, ...(tile ? [tile] : []), ...(aura ? [aura] : [])].forEach((el) => {
        el.style.transform = '';
        el.style.opacity = '';
      });
      arcs.forEach((el) => { el.style.transform = ''; });
    },
    attachField(f) {
      field = f;
    },
    remeasure(samples, w, hgt) {
      band = bandOf();
      rectDirty = true;
      dCentre = diamonds.map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2 - band.left, r.top + r.height / 2 - band.top] as const;
      });
      field?.resize(w, hgt, samples);
    },
  };
}
