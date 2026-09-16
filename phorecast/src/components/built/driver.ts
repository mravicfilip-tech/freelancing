// The section's living layer: one rAF loop that owns every property the
// entrance timeline has finished with.
//
// Three inputs are mixed per frame — ambient time, scroll progress and a damped
// pointer — and each property has exactly one writer, so nothing ever fights
// anything else. Everything is transform/opacity, pushed through
// `gsap.quickSetter`; the loop is suspended the moment the section leaves the
// viewport and never starts at all under `prefers-reduced-motion`.

import { gsap } from 'gsap';
import type { GlowLayer } from './glow';

type Setter = (v: number) => void;
const q = (el: Element, prop: string, unit?: string) => gsap.quickSetter(el, prop, unit) as Setter;
// `quickSetter` has no "scale" shorthand — it resolves the alias to a property
// name and then tries to set an attribute — so drive both axes explicitly.
const qs = (el: Element): Setter => {
  const sx = q(el, 'scaleX');
  const sy = q(el, 'scaleY');
  return (v) => {
    sx(v);
    sy(v);
  };
};

/** Frame-rate independent approach. `k` is roughly "how many e-folds a second". */
const approach = (cur: number, to: number, k: number, dt: number) => cur + (to - cur) * (1 - Math.exp(-k * dt));
const clamp = (v: number, a = -1, b = 1) => (v < a ? a : v > b ? b : v);
const wave = (t: number, period: number, phase = 0) => Math.sin((t / period + phase) * Math.PI * 2);
const num = (el: Element, prop: string) => Number.parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;

const LOCK = { x: 226, y: 0 };

interface Part {
  /** Writes this part's contribution for the frame. */
  write: (t: number, col: ColumnState, dt: number) => void;
}

interface ColumnState {
  root: HTMLElement;
  card: HTMLElement;
  index: number;
  /** 0..1, how engaged this column is (pointer over it, or focus inside it). */
  hover: number;
  hoverTo: number;
  /** Damped pointer position in card space, -1..1. */
  px: number;
  py: number;
  pxTo: number;
  pyTo: number;
  /** css px of the card, refreshed on measure. */
  w: number;
  h: number;
  parts: Part[];
  card_: { y: Setter; rx: Setter; ry: Setter; s: Setter };
  glow_: { x: Setter; y: Setter; s: Setter; o: Setter; base: number };
  cursor_: { x: Setter; y: Setter; o: Setter; el: HTMLElement };
  title_?: Setter;
  cta_?: Setter;
}

export interface Driver {
  /** Called once the entrance timeline has cleared its inline styles. */
  start(): void;
  stop(): void;
  dispose(): void;
  /** Extra shader heat, 0..1, for the entrance bloom. */
  heat(v: number): void;
}

export function createDriver(section: HTMLElement, glow: GlowLayer | null): Driver {
  const sel = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = section) =>
    root.querySelector<T>(s);
  const all = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = section) =>
    Array.from(root.querySelectorAll<T>(s));

  /* ---------------------------------------------------------------- state */

  let t = 0;
  let raf = 0;
  let running = false;
  let visible = false;
  let started = false;
  let entranceHeat = 0;

  let scroll = 0;
  let scrollTo = 0;

  const columns: ColumnState[] = [];
  const cleanup: Array<() => void> = [];

  /* ------------------------------------------------------------ the glow */

  const cssGlow = sel('.built__glow');
  const glowSet = cssGlow && !glow ? { y: q(cssGlow, 'y', 'px'), s: qs(cssGlow), o: q(cssGlow, 'opacity') } : null;
  const glowBase = cssGlow ? Number(gsap.getProperty(cssGlow, 'opacity')) || 0.3 : 0.3;

  const head = sel('.built__head');
  const headY = head ? q(head, 'y', 'px') : null;

  /* ----------------------------------------------------- the travelling accent */

  const spark = document.createElement('span');
  spark.className = 'built__spark';
  spark.setAttribute('aria-hidden', 'true');
  section.appendChild(spark);
  const sparkSet = { x: q(spark, 'x', 'px'), y: q(spark, 'y', 'px'), o: q(spark, 'opacity'), s: qs(spark) };
  let sparkPath = { x0: 0, y0: 0, x1: 0, y1: 0, ok: false };
  cleanup.push(() => spark.remove());

  /* ------------------------------------------------------------- columns */

  all('.built__col').forEach((root, index) => {
    const card = sel('.bt-card', root);
    if (!card) return;
    const glowEl = sel('.bt-card__glow', root);
    if (!glowEl) return;

    // The pointer highlight is built here rather than in the markup: if this
    // script never runs, the card is simply the card, with nothing hidden.
    const cursor = document.createElement('span');
    cursor.className = 'bt-card__cursor';
    cursor.setAttribute('aria-hidden', 'true');
    card.appendChild(cursor);

    gsap.set(card, { transformPerspective: 1100, transformOrigin: '50% 50%' });
    gsap.set(glowEl, { transformOrigin: '50% 40%' });

    const state: ColumnState = {
      root,
      card,
      index,
      hover: 0,
      hoverTo: 0,
      px: 0,
      py: 0,
      pxTo: 0,
      pyTo: 0,
      w: 1,
      h: 1,
      parts: [],
      card_: { y: q(card, 'y', 'px'), rx: q(card, 'rotationX'), ry: q(card, 'rotationY'), s: qs(card) },
      glow_: {
        x: q(glowEl, 'x', 'px'),
        y: q(glowEl, 'y', 'px'),
        s: qs(glowEl),
        o: q(glowEl, 'opacity'),
        base: Number(gsap.getProperty(glowEl, 'opacity')) || 0.6,
      },
      cursor_: { x: q(cursor, 'x', 'px'), y: q(cursor, 'y', 'px'), o: q(cursor, 'opacity'), el: cursor },
    };

    const title = sel('.built__col-title', root);
    if (title) state.title_ = q(title, 'y', 'px');
    const cta = sel('.built__cta', root);
    if (cta) state.cta_ = q(cta, 'x', 'px');

    state.parts.push(...labelParts(all('.bt-label', card)));
    state.parts.push(...cardOneParts(card));
    state.parts.push(...cardTwoParts(card));

    // Pointer and keyboard drive the same engagement value.
    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      state.w = r.width || 1;
      state.h = r.height || 1;
      state.pxTo = clamp(((e.clientX - r.left) / state.w) * 2 - 1);
      state.pyTo = clamp(((e.clientY - r.top) / state.h) * 2 - 1);
    };
    const engage = () => {
      state.hoverTo = 1;
      wake();
    };
    const release = () => {
      state.hoverTo = 0;
      state.pxTo = 0;
      state.pyTo = 0;
    };
    root.addEventListener('pointerenter', engage);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', release);
    root.addEventListener('pointercancel', release);
    root.addEventListener('focusin', engage);
    root.addEventListener('focusout', release);
    cleanup.push(() => {
      root.removeEventListener('pointerenter', engage);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', release);
      root.removeEventListener('pointercancel', release);
      root.removeEventListener('focusin', engage);
      root.removeEventListener('focusout', release);
      cursor.remove();
    });

    columns.push(state);
  });

  /* ------------------------------------------------------------- measure */

  const measure = () => {
    const r = section.getBoundingClientRect();
    const vh = innerHeight || 1;
    // 0 when the section's centre is on the viewport's centre, ±1 at the edges.
    scrollTo = clamp(((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2));
    columns.forEach((c) => {
      const cr = c.card.getBoundingClientRect();
      c.w = cr.width || 1;
      c.h = cr.height || 1;
    });
    const a = columns[0]?.card.getBoundingClientRect();
    const b = columns[1]?.card.getBoundingClientRect();
    if (a && b) {
      const side = b.left >= a.right - 1;
      sparkPath = side
        ? { x0: a.right - r.left, y0: a.top + a.height / 2 - r.top, x1: b.left - r.left, y1: b.top + b.height / 2 - r.top, ok: true }
        : { x0: a.left + a.width / 2 - r.left, y0: a.bottom - r.top, x1: b.left + b.width / 2 - r.left, y1: b.top - r.top, ok: true };
    }
  };

  let measuring = false;
  const onScroll = () => {
    if (measuring) return;
    measuring = true;
    requestAnimationFrame(() => {
      measuring = false;
      measure();
    });
    wake();
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  cleanup.push(() => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
  });

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { measure(); glow?.resize(); }) : null;
  ro?.observe(section);
  cleanup.push(() => ro?.disconnect());

  /* ---------------------------------------------------------------- loop */

  let last = 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    t += dt;

    scroll = approach(scroll, scrollTo, 7, dt);

    // Section-level: the heading counter-moves, the light moves against it.
    if (headY) headY(scroll * -22);

    let heat = entranceHeat;
    for (const c of columns) {
      c.hover = approach(c.hover, c.hoverTo, c.hoverTo > c.hover ? 9 : 6, dt);
      c.px = approach(c.px, c.pxTo, 7, dt);
      c.py = approach(c.py, c.pyTo, 7, dt);
      heat = Math.max(heat, c.hover * 0.55);
      writeColumn(c, t, dt, scroll);
    }

    if (glowSet) {
      glowSet.y(scroll * 58);
      glowSet.s(1 + 0.045 * wave(t, 9) + 0.05 * heat);
      glowSet.o(glowBase * (1 + 0.07 * wave(t, 6.4, 0.3) + 0.22 * heat));
    }
    glow?.render(t, scroll, heat);

    writeSpark(t);
  };

  const writeSpark = (time: number) => {
    if (!sparkPath.ok) {
      sparkSet.o(0);
      return;
    }
    const PERIOD = 7.4;
    const TRAVEL = 1.5;
    const phase = (time % PERIOD) / TRAVEL;
    if (phase > 1) {
      sparkSet.o(0);
      return;
    }
    // Fast out of card one, long settle into card two.
    const e = 1 - Math.pow(1 - phase, 3);
    sparkSet.x(sparkPath.x0 + (sparkPath.x1 - sparkPath.x0) * e);
    sparkSet.y(sparkPath.y0 + (sparkPath.y1 - sparkPath.y0) * e);
    sparkSet.o(Math.sin(phase * Math.PI) * 0.85);
    sparkSet.s(0.7 + Math.sin(phase * Math.PI) * 0.6);
  };

  const wake = () => {
    if (running || !started || !visible) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  };

  const halt = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  // Idle work stops dead when the section is off screen.
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        measure();
        wake();
      } else halt();
    },
    { threshold: 0 },
  );
  io.observe(section);
  cleanup.push(() => io.disconnect());

  return {
    start() {
      if (started) return;
      started = true;
      measure();
      wake();
    },
    stop: halt,
    heat(v) {
      entranceHeat = v;
    },
    dispose() {
      halt();
      cleanup.forEach((fn) => fn());
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Per-column writing                                                          */
/* -------------------------------------------------------------------------- */

function writeColumn(c: ColumnState, t: number, dt: number, scroll: number) {
  const h = c.hover;
  const phase = c.index * 0.37;

  // Depth: the two cards travel at different rates, so they separate as the
  // page moves rather than sliding as one slab.
  const depth = c.index === 0 ? 16 : -11;
  c.card_.y(scroll * depth - 7 * h);
  c.card_.rx(-c.py * 4.2 * h);
  c.card_.ry(c.px * 5.4 * h);
  c.card_.s(1 + 0.008 * h);

  // The card's own light leans toward the cursor and swells a little.
  c.glow_.x(c.px * 16 * h);
  c.glow_.y(c.py * 11 * h);
  c.glow_.s(1 + 0.035 * wave(t, 7.6, phase) + 0.06 * h);
  c.glow_.o(c.glow_.base * (1 + 0.06 * wave(t, 9.1, phase + 0.2) + 0.2 * h));

  // Highlight tracking the pointer across the face.
  c.cursor_.x(((c.px + 1) / 2) * c.w);
  c.cursor_.y(((c.py + 1) / 2) * c.h);
  c.cursor_.o(h * 0.85);

  if (c.title_) c.title_(-3 * h);
  if (c.cta_) c.cta_(3 * h);

  for (const p of c.parts) p.write(t, c, dt);
}

/* -------------------------------------------------------------------------- */
/* Parts                                                                       */
/* -------------------------------------------------------------------------- */

/** Corner labels sit shallowest, so they barely lean. */
function labelParts(labels: HTMLElement[]): Part[] {
  return labels.map((el, i) => {
    const x = q(el, 'x', 'px');
    const y = q(el, 'y', 'px');
    const d = 3 + (i % 3);
    return {
      write: (_t, c) => {
        x(-c.px * d * c.hover);
        y(-c.py * d * 0.7 * c.hover);
      },
    };
  });
}

function cardOneParts(card: HTMLElement): Part[] {
  const group = card.querySelector<HTMLElement>('.bt1');
  if (!group) return [];
  const sel = <T extends HTMLElement>(s: string) => card.querySelector<T>(s);

  const parts: Part[] = [];

  // The diagram parallaxes inside the card; the read-out sits nearer the glass.
  const gx = q(group, 'x', 'px');
  const gy = q(group, 'y', 'px');
  parts.push({
    write: (_t, c) => {
      gx(c.px * 9 * c.hover);
      gy(c.py * 6 * c.hover);
    },
  });

  const text = sel('.bt1__text');
  if (text) {
    const tx = q(text, 'x', 'px');
    const ty = q(text, 'y', 'px');
    parts.push({
      write: (_t, c) => {
        tx(c.px * 18 * c.hover + 3 * c.hover);
        ty(c.py * 12 * c.hover);
      },
    });
  }

  const dot = sel('.bt1__dot');
  if (dot) {
    const s = qs(dot);
    parts.push({ write: (t, c) => s(1 + 0.02 * Math.max(0, wave(t, 2.6)) + 0.18 * c.hover) });
  }

  const line = sel('.bt1__line');
  if (line) {
    gsap.set(line, { transformOrigin: '0% 50%' });
    const sx = q(line, 'scaleX');
    parts.push({ write: (_t, c) => sx(1 + 0.045 * c.hover) });
  }

  // The pulse runs the link continuously, and runs harder when pointed at.
  const smear = sel('.bt1__smear');
  if (smear) {
    const x = q(smear, 'x', 'px');
    const sx = q(smear, 'scaleX');
    const o = q(smear, 'opacity');
    parts.push({
      write: (t, c) => {
        const trip = (t % 5.2) / 5.2;
        const e = 1 - Math.pow(1 - trip, 2.2);
        x(e * 96 + 26 * c.hover);
        sx(0.8 + 0.5 * Math.sin(trip * Math.PI) + 0.25 * c.hover);
        o(0.35 + 0.65 * Math.sin(trip * Math.PI) * (0.8 + 0.2 * c.hover));
      },
    });
  }

  // Rings breathe like a radar sweep, and ripple outward under the pointer —
  // each ring follows the hover value at its own rate so the ripple has order.
  const rings = ['.bt1__ring-disc', '.bt1__ring-mid', '.bt1__ring-outer']
    .map((s) => sel(s))
    .filter(Boolean) as HTMLElement[];
  rings.forEach((el, i) => {
    const s = qs(el);
    const amp = [0.006, 0.014, 0.022][i];
    const hoverAmp = [0.03, 0.06, 0.09][i];
    const k = [16, 10, 6.5][i];
    let lag = 0;
    parts.push({
      write: (t, c, dt) => {
        lag = approach(lag, c.hover, k, dt);
        s(1 + amp * wave(t, 4.4 + i * 1.3, i * 0.28) + hoverAmp * lag);
      },
    });
  });

  const coin = sel('.bt1__coin');
  if (coin) {
    const y = q(coin, 'y', 'px');
    const s = qs(coin);
    parts.push({
      write: (t, c) => {
        y(wave(t, 5.6) * 1.6);
        s(1 + 0.1 * c.hover);
      },
    });
  }

  return parts;
}

function cardTwoParts(card: HTMLElement): Part[] {
  const group = card.querySelector<HTMLElement>('.bt2');
  if (!group) return [];
  const sel = <T extends HTMLElement>(s: string) => card.querySelector<T>(s);
  const parts: Part[] = [];

  const gx = q(group, 'x', 'px');
  const gy = q(group, 'y', 'px');
  parts.push({
    write: (_t, c) => {
      gx(c.px * 7 * c.hover);
      gy(c.py * 5 * c.hover);
    },
  });

  const lock = sel<HTMLElement>('.bt2__node--lock');
  const nodes = Array.from(card.querySelectorAll<HTMLElement>('.bt2__node')).filter((n) => n !== lock);

  // Every market drifts on its own phase, leans by its own depth (bigger node =
  // nearer the glass) and, when the card is engaged, slides toward the lock —
  // furthest first, so the network visibly settles into self-custody.
  const spread = nodes.map((el) => {
    const dx = LOCK.x - num(el, '--x');
    const dy = LOCK.y - num(el, '--y');
    const len = Math.hypot(dx, dy) || 1;
    return { el, len, ux: dx / len, uy: dy / len, depth: (num(el, '--s') || 50) / 55 };
  });
  const far = Math.max(...spread.map((s) => s.len), 1);

  spread.forEach((n, i) => {
    const x = q(n.el, 'x', 'px');
    const y = q(n.el, 'y', 'px');
    const period = 4.6 + (i % 3) * 1.4;
    const phase = i * 0.41;
    const k = 5 + 7 * (n.len / far); // far nodes react first
    let lag = 0;
    parts.push({
      write: (t, c, dt) => {
        lag = approach(lag, c.hover, k, dt);
        const drift = wave(t, period, phase);
        x(n.ux * 4.6 * lag + c.px * 5 * n.depth * c.hover + drift * 0.9);
        y(n.uy * 4.6 * lag + c.py * 3.4 * n.depth * c.hover + drift * 2.1);
      },
    });
  });

  if (lock) {
    const x = q(lock, 'x', 'px');
    const y = q(lock, 'y', 'px');
    const s = qs(lock);
    parts.push({
      write: (t, c) => {
        x(c.px * 6 * c.hover);
        y(c.py * 4 * c.hover + wave(t, 6.2, 0.5) * 1.2);
        s(1 + 0.018 * wave(t, 3.9) + 0.07 * c.hover);
      },
    });
  }

  // Linework contracts toward the lock by the same few pixels the nodes move,
  // so the lines keep meeting the nodes they belong to.
  const main = sel('.bt2__main');
  if (main) {
    gsap.set(main, { transformOrigin: '100% 50%' });
    const sx = q(main, 'scaleX');
    parts.push({ write: (_t, c) => sx(1 - 0.011 * c.hover) });
  }
  const fan = sel('.bt2__fan');
  if (fan) {
    gsap.set(fan, { transformOrigin: '100% 50%' });
    const s = qs(fan);
    parts.push({ write: (_t, c) => s(1 - 0.013 * c.hover) });
  }

  const smear = sel('.bt2__smear');
  if (smear) {
    const x = q(smear, 'x', 'px');
    const sx = q(smear, 'scaleX');
    const o = q(smear, 'opacity');
    parts.push({
      write: (t, c) => {
        const trip = (t % 6.1) / 6.1;
        const e = 1 - Math.pow(1 - trip, 2.2);
        x(e * 150 + 24 * c.hover);
        sx(0.8 + 0.5 * Math.sin(trip * Math.PI) + 0.25 * c.hover);
        o(0.3 + 0.7 * Math.sin(trip * Math.PI) * (0.8 + 0.2 * c.hover));
      },
    });
  }

  return parts;
}
