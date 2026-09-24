/**
 * "Where Every Outcome Connects." The ambient loop.
 *
 * The load-in belongs to `Fan.motion.ts`. This file owns what happens after it
 * lands: it reads the shipped markup, adds one overlay of its own (a clip
 * inside the glass holding a bar of light) and removes it on teardown.
 *
 * THE STORY: one front crossing the band, twice, every 13s
 *   0.6s   A front enters past the left edge. It is one x, moving, and
 *          everything in the section answers to it.
 *   ~1.0s  On the left fan, a short bright head rides each arc at the point of
 *          the curve under the front.
 *   ~1.8s  Pills and diamonds fire as the front reaches them, timed by solving
 *          the ease for each one's x rather than by a stagger.
 *   ~2.5s  It crosses the tile: a bar of light runs across the mark, the glass
 *          fills, the photograph under it lifts and the rim warms.
 *   ~3.3s  The right fan and its pills, then out past the right edge at 4.4s.
 *   7.0s   The return pass, mirrored.
 *   ~11.4s Everything is the design again, and stays there to 13s.
 * Below 900 the diamonds and three pills are hidden and drop out of the pass.
 *
 * THE LIGHT IS ON THE CURVE. Each arc has a `.fan__spark` twin (see Fan.tsx).
 * The head is a short `stroke-dasharray` placed by `stroke-dashoffset`, so the
 * lit region is the stroke itself and nothing box-shaped can show. That needs
 * a map from screen x to length along each path: each spark is sampled once
 * over its visible run into a (length, design x) table, monotonic in x
 * because the run is a single quadrant, and `sAt(x)` inverts it.
 *
 * Also taking part: each fan group's opacity lifts 0.70 to 0.82 while the
 * front is inside it, and the sub-head warms as it passes.
 *
 * Design decision: nothing in this band glows. No box-shadow, bloom, halo or
 * drop-shadow on the tile, the mark or the pills. A lit pill is a flat chip of
 * `--accent` with `--on-accent` contents, and `filter` is never written on a
 * pill or anything inside one.
 *
 * Nothing floats, drifts or reacts to the pointer. Reduced motion runs none
 * of it.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../lib/motion';
import { tok } from '../../lib/theme';

/** One full cycle, in GSAP time: two passes and then the band at rest. */
const PERIOD = 13;
/** How long after the entrance lands before the first pass. */
const SETTLE = 1.2;

/* The two passes, in seconds from the top of a cycle, and how long one takes. */
const PASS_A = 0.6;
const PASS_B = 7.0;
const DUR = 3.8;
const EASE = 'power1.inOut';

/** Where the front starts and ends, as design px either side of the band. */
const OVERRUN = 250;

/**
 * Every colour and lift this loop applies, read inside `start()` and never at
 * module scope: a theme change tears the loop down and rebuilds it, so these
 * re-read the live palette. Fallbacks are the dark values.
 *
 * In dark every lift means brighter. Light turns around the ones that meet the
 * page (diamonds, rim, sub-head) in `Fan.css`; the ones inside the tile keep
 * their direction because they sit over the photograph.
 */
const read = () => ({
  /* The lit pill: a flat chip of the brand red carrying its own label colour.
     --on-accent does not flip: it is read against --accent, which is dark in
     both themes. */
  pillLitBg: tok('--accent', '#e5331e'),
  pillLitFg: tok('--on-accent', '#fffbf8'),
  diaRest: tok('--fan-dia-rest', 'brightness(1) saturate(1)'),
  diaLit: tok('--fan-dia-lit', 'brightness(2.4) saturate(1)'),
  rimLit: tok('--fan-rim-lit', 'rgba(255, 244, 236, 0.9)'),
  glassLit: tok('--fan-glass-lit', 'rgba(255, 239, 227, 0.32)'),
  artRest: tok('--fan-art-rest', 'brightness(1) contrast(1)'),
  artLit: tok('--fan-art-lit', 'brightness(1.5) contrast(1)'),
  subLit: tok('--fan-sub-lit', 'rgb(201, 194, 189)'),
  barEdge: tok('--fan-bar-edge', 'rgba(255, 251, 248, 0)'),
  barCore: tok('--fan-bar-core', 'rgba(255, 243, 234, 0.95)'),
});

/** Length of the head riding each arc, in design px of screen arc. */
const HEAD = 132;
/** Design px over which a head fades in at the end of its own arc. */
const HEAD_FADE = 70;
/** How much thicker the lit head is than the `.fan__spark` attribute's 2.4. */
const HEAD_WEIGHT = 1.5;
/**
 * Samples per spark when the (length, x) table is built, in two passes.
 *
 * Most of each ellipse is off screen, so the path is walked coarsely once to
 * bracket the visible run and then sampled densely over that run alone. This
 * runs in one block as the loop opens, while the band is being read, so it is
 * kept cheap: 114 calls a path rather than 221 for one flat pass, and a finer
 * table.
 */
const COARSE = 48;
const FINE = 64;

const px = (n: number) => `${n}px`;
/**
 * Only the elements the stylesheet is actually rendering.
 *
 * Below 900 the diamonds and three pills are `display: none`. Their rects are
 * all zeros, so `cx()` would place them at the left edge and fire them together
 * as the front enters. Asking the layout keeps the loop and the stylesheet in
 * step. `getClientRects()`, not a visibility read: the band is
 * `visibility: hidden` until its entrance runs, and hidden elements have boxes.
 */
const shown = (els: HTMLElement[]) => els.filter((e) => e.getClientRects().length > 0);
/** 0..1 with both ends flat, for presence curves that must not have corners. */
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Inverse of a GSAP ease: the progress p where ease(p) === v. */
function invEase(name: string, v: number): number {
  const e = gsap.parseEase(name);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (e(mid) < v) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** One arc's bright twin, plus the map from design x to length along it. */
interface Spark {
  el: SVGPathElement;
  len: number;
  /** Paired samples over the visible run; `xs` is monotonic. */
  ls: number[];
  xs: number[];
  x0: number;
  x1: number;
  /** Head length in this path's own user units, sized to HEAD on screen. */
  head: number;
  lit: boolean;
}

/** An arc group, and the stretch of the band it occupies. */
interface Fan {
  el: HTMLElement;
  x0: number;
  x1: number;
  lit: boolean;
}

export function fanLoop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const qa = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));

  /* ------------------------------------------------------------- handles
     Every one of these is optional. A missing hook costs its own beat and
     nothing else; the rest of the pass still crosses the band. */
  const frame = q('.fan__frame') ?? root;
  const groups = qa('.fan__arcs');
  let pills = shown(qa('.fan__pill'));
  let diamonds = shown(qa('.fan__diamond'));
  const tile = q('.fan__tile');
  const tileArt = q('.fan__tile-bg');
  const glass = q('.fan__glass');
  const sub = q('.fan__sub');

  let ctx: gsap.Context | undefined;
  let cycle: gsap.core.Timeline | undefined;
  let io: IntersectionObserver | undefined;
  let ro: ResizeObserver | undefined;
  let watcher: MutationObserver | undefined;
  let ready = 0;
  let probe = 0;
  let resizer = 0;
  let started = false;
  let stopped = false;
  let offscreen = false;
  let rebuild = false;
  const mine: HTMLElement[] = [];
  const heard = () => open();

  /* --------------------------------------------------------------- the frame
     Everything below is in design px: the 1920-wide space `--f` scales from,
     or 1440 below 900 where the band is re-laid out as a column. Live rects
     are divided back into it, so only a breakpoint crossing invalidates the
     timeline. */
  let DW = 1920;
  let f = 1;
  let box = frame.getBoundingClientRect();
  /* The mark's face, in CSS px. Below 900 the tile has a real size rather than
     100 design px, so the bar that crosses it is sized as a fraction of the
     glass it lives in. On desktop the glass is 65.12 * f. */
  let face = 65.12;

  const measureFrame = () => {
    box = frame.getBoundingClientRect();
    /* Read, not branched on: `Fan.css` owns the design width (1920, or 1440
       below 900), and every baked time in the timeline depends on it. Keep it
       in one place. */
    DW = Number(getComputedStyle(frame).getPropertyValue('--fan-dw')) || 1920;
    f = box.width / DW || 1;
    face = (glass?.getBoundingClientRect().width || 0) || 65.12 * f;
  };
  /** A client rect's centre, in design px relative to the frame. */
  const cx = (el: Element) => {
    const r = el.getBoundingClientRect();
    return (r.left + r.width / 2 - box.left) / f;
  };

  /* -------------------------------------------------------------- the sparks
     The table is (length along the path, design x) over the longest unbroken
     run of the path its group's window shows. These are whole ellipses about
     2100 units across seen through an 863-wide clip, so sampling is the only
     way in. The visible run is a single quadrant, so x is monotonic along it
     and the table inverts. */
  const sparks: Spark[] = [];
  const fans: Fan[] = [];

  const buildTables = () => {
    sparks.length = 0;
    fans.length = 0;

    groups.forEach((group) => {
      const win = group.getBoundingClientRect();
      const twins = Array.from(group.querySelectorAll<SVGPathElement>('path.fan__spark'));
      let gx0 = Infinity;
      let gx1 = -Infinity;

      twins.forEach((el) => {
        const len = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 0;
        const m = el.getScreenCTM();
        if (!len || !m) return;

        /** `n + 1` even samples of this path between two lengths along it. */
        const walk = (from: number, to: number, n: number) => {
          const ls: number[] = [];
          const xs: number[] = [];
          const ys: boolean[] = [];
          for (let i = 0; i <= n; i += 1) {
            const l = from + ((to - from) * i) / n;
            const p = el.getPointAtLength(l);
            const sx = p.x * m.a + p.y * m.c + m.e;
            const sy = p.x * m.b + p.y * m.d + m.f;
            ls.push(l);
            xs.push((sx - box.left) / f);
            ys.push(sx >= win.left && sx <= win.right && sy >= win.top && sy <= win.bottom);
          }
          return { ls, xs, ys };
        };

        /** Longest unbroken visible run in a walk, as a pair of indices. */
        const longest = (ys: boolean[]) => {
          let best: [number, number] | null = null;
          let run: [number, number] | null = null;
          for (let i = 0; i < ys.length; i += 1) {
            if (ys[i]) run = run ? [run[0], i] : [i, i];
            else {
              if (run && (!best || run[1] - run[0] > best[1] - best[0])) best = run;
              run = null;
            }
          }
          if (run && (!best || run[1] - run[0] > best[1] - best[0])) best = run;
          return best;
        };

        // Coarse pass: where along this path is the window, roughly.
        const rough = walk(0, len, COARSE);
        const bracket = longest(rough.ys);
        if (!bracket || bracket[1] === bracket[0]) return;
        // A step either side, so the dense pass cannot start inside the run
        // and miss its own edge.
        const from = rough.ls[Math.max(0, bracket[0] - 1)];
        const to = rough.ls[Math.min(COARSE, bracket[1] + 1)];

        // Dense pass, over that stretch only.
        const { ls, xs, ys } = walk(from, to, FINE);
        const best = longest(ys);
        if (!best || best[1] === best[0]) return;
        // One sample either side so the head enters and leaves just outside
        // the window instead of on its edge.
        const lo = Math.max(0, best[0] - 1);
        const hi = Math.min(FINE, best[1] + 1);

        const rl = ls.slice(lo, hi + 1);
        const rx = xs.slice(lo, hi + 1);
        // The table is searched with x ascending; a run that walks right to
        // left is simply reversed, which leaves the pairing intact.
        if (rx[rx.length - 1] < rx[0]) { rl.reverse(); rx.reverse(); }

        const span = rl[rl.length - 1] - rl[0];
        const width = rx[rx.length - 1] - rx[0];
        if (!(width > 1) || !(Math.abs(span) > 1)) return;

        // Design px of screen arc per user unit, so a 132px head is 132px on
        // every one of the sixteen however long that ellipse happens to be.
        let screen = 0;
        for (let i = 1; i < rx.length; i += 1) screen += Math.abs(rx[i] - rx[i - 1]);

        gx0 = Math.min(gx0, rx[0]);
        gx1 = Math.max(gx1, rx[rx.length - 1]);
        sparks.push({
          el,
          len,
          ls: rl,
          xs: rx,
          x0: rx[0],
          x1: rx[rx.length - 1],
          head: Math.abs(span) * (HEAD / Math.max(screen, 1)),
          lit: false,
        });
      });

      if (gx0 < gx1) fans.push({ el: group, x0: gx0, x1: gx1, lit: false });
    });
  };

  /** Length along a spark at design x, or null if the front is not on it. */
  const sAt = (s: Spark, x: number): number | null => {
    if (x < s.x0 || x > s.x1) return null;
    let lo = 0;
    let hi = s.xs.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (s.xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    const span = s.xs[hi] - s.xs[lo] || 1;
    const t = (x - s.xs[lo]) / span;
    return s.ls[lo] + (s.ls[hi] - s.ls[lo]) * t;
  };

  /* ---------------------------------------------------------------- overlay
     One, inside the glass, which clips it to the mark's face. Deliberately
     nothing else: any element that fills an area of the background reads as a
     maroon patch on this ground, however soft its edges. */
  let bar: HTMLElement | null = null;

  const buildOverlays = (barEdge: string, barCore: string) => {
    if (!glass) return;
    const clip = document.createElement('i');
    clip.setAttribute('aria-hidden', 'true');
    clip.style.cssText =
      'position:absolute;inset:0;overflow:hidden;pointer-events:none;' +
      'border-radius:inherit;';
    const b = document.createElement('b');
    b.style.cssText =
      'position:absolute;top:-25%;height:150%;left:0;opacity:0;will-change:transform,opacity;' +
      `background:linear-gradient(90deg,${barEdge} 0%,${barCore} 50%,${barEdge} 100%);`;
    clip.appendChild(b);
    glass.appendChild(clip);
    mine.push(clip);
    bar = b;
  };

  /** Overlay sizes are the only thing here that is not resolution-independent.
      Both are the Figma fractions of the 65.12-px glass rather than multiples
      of `--f`, so they follow the tile at whichever size the breakpoint gave
      it. At 1920 the two are the same number. */
  const sizeOverlays = () => {
    if (bar) {
      bar.style.width = px((18 / 65.12) * face);
      bar.style.filter = `blur(${px((2.5 / 65.12) * face)})`;
    }
  };

  /* ----------------------------------------------------------------- the pass
     One driver object carries the front's design x and one carries the pass's
     overall strength; `paint` is the only thing that writes the arcs and the
     fan groups, so the two are guaranteed to agree on where the front is. */
  const front = { x: -OVERRUN };
  const power = { v: 0 };

  const clearSpark = (s: Spark) => {
    s.el.style.removeProperty('opacity');
    s.el.style.removeProperty('stroke-linecap');
    s.el.style.removeProperty('stroke-width');
    s.el.style.removeProperty('stroke-dasharray');
    s.el.style.removeProperty('stroke-dashoffset');
    s.lit = false;
  };
  const clearFan = (g: Fan) => {
    g.el.style.removeProperty('opacity');
    g.lit = false;
  };

  const paint = () => {
    const x = front.x;
    const p = power.v;

    for (const s of sparks) {
      const l = p > 0.001 ? sAt(s, x) : null;
      if (l === null) { if (s.lit) clearSpark(s); continue; }
      // Its own ends are soft, so a head is never switched on or off mid-arc.
      const edge = smooth(Math.min(x - s.x0, s.x1 - x) / HEAD_FADE);
      const o = p * edge;
      if (o <= 0.004) { if (s.lit) clearSpark(s); continue; }
      s.el.style.strokeDasharray = `${s.head}px ${s.len}px`;
      s.el.style.strokeDashoffset = `${-(l - s.head / 2)}px`;
      // The head puts on weight as it comes up, so the line under it is lit
      // rather than merely recoloured. Removing the property hands the width
      // back to the `stroke-width="2.4"` the markup ships.
      s.el.style.strokeWidth = (2.4 * (1 + (HEAD_WEIGHT - 1) * o)).toFixed(2);
      // Round tips, so the head does not end on a square cut mid-arc.
      s.el.style.strokeLinecap = 'round';
      s.el.style.opacity = o.toFixed(3);
      s.lit = true;
    }

    for (const g of fans) {
      // Presence: full while the front is inside the group, easing off over
      // 260 design px either side so the lift arrives and leaves with it.
      const d = x < g.x0 ? g.x0 - x : x > g.x1 ? x - g.x1 : 0;
      const near = p * smooth(1 - d / 260);
      if (near <= 0.004) { if (g.lit) clearFan(g); continue; }
      g.el.style.opacity = (0.7 + 0.12 * near).toFixed(3);
      g.lit = true;
    }
  };

  /** The band exactly as the stylesheet has it, with nothing of this file on it. */
  const rest = () => {
    front.x = -OVERRUN;
    power.v = 0;
    sparks.forEach(clearSpark);
    fans.forEach(clearFan);
    if (bar) { bar.style.opacity = '0'; bar.style.transform = 'translate3d(0,0,0)'; }
  };

  /* ---------------------------------------------------------------- the cycle */
  const start = () => {
    if (started || stopped) return;
    started = true;

    measureFrame();
    // Read before the overlay is built: the bar's gradient is baked into its
    // style attribute, so it has to know the palette first.
    const C = read();
    buildOverlays(C.barEdge, C.barCore);
    sizeOverlays();
    buildTables();
    // The entrance leaves each `.fan__spark` with an inline opacity and dash
    // pair. Hand them back to the stylesheet before the first pass.
    rest();

    // Resting values are read now, with the entrance finished and its
    // `clearProps` already run, so every lift has something true to return to.
    const css = (el: Element | null, prop: string) =>
      (el ? getComputedStyle(el).getPropertyValue(prop) : '') || '';
    const pillBg = css(pills[0] ?? null, 'background-color') || 'rgb(0, 0, 0)';
    const pillFg = css(pills[0] ?? null, 'color') || C.pillLitFg;
    const pillOp = Number(css(pills[0] ?? null, 'opacity') || '0.7') || 0.7;
    const tileBorder = css(tile, 'border-color');
    const glassBg = css(glass, 'background-color');
    const subFg = css(sub, 'color');

    const pillXs = pills.map(cx);
    const diaXs = diamonds.map(cx);
    const tileX = tile ? cx(tile) : DW / 2;
    const subX = sub ? cx(sub) : DW / 2;
    // `.icon`, not `img`: the glyphs are masked spans.
    const pillIcons = pills.map((p) => Array.from(p.querySelectorAll<HTMLElement>('.icon')));
    // One read for all eight; they are the same grey in every pill, and it is
    // their own colour rather than the label's, so the pill's `color` tween
    // does not reach them and they need a tween of their own.
    const iconFg = css(pillIcons.flat()[0] ?? null, 'color') || tok('--fan-icon', '#9d9d9d');

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, paused: true });
      cycle = tl;

      /**
       * One pass. `dir` 1 runs left to right, -1 right to left. Everything in
       * the band is scheduled off `when`, which asks the ease when the front's
       * centre is at a given design x, so a pill turns over on the frame the
       * light is on it and not a frame either side, at any duration.
       */
      const pass = (at: number, dir: 1 | -1) => {
        const a = dir > 0 ? -OVERRUN : DW + OVERRUN;
        const b = dir > 0 ? DW + OVERRUN : -OVERRUN;
        const when = (x: number) => {
          const v = (x - a) / (b - a);
          if (v <= 0) return at;
          if (v >= 1) return at + DUR;
          return at + DUR * invEase(EASE, v);
        };

        /* 1. The front crosses, and the arcs and fans with it.
           `immediateRender: false` on both: a delayed `fromTo` writes its start
           values when the timeline is built, and without it the second pass
           would snap the front to its own start and hold it through the first. */
        tl.fromTo(front, { x: a }, {
          x: b, duration: DUR, ease: EASE, immediateRender: false, onUpdate: paint,
        }, at)
          .fromTo(power, { v: 0 }, {
            v: 1, duration: 0.5, ease: 'sine.out', immediateRender: false, onUpdate: paint,
          }, at)
          .to(power, {
            v: 0, duration: 0.7, ease: 'sine.in', onUpdate: paint,
            // Back to nothing the instant the pass is over, so the rest band
            // holds one value per element rather than two.
            onComplete: rest,
          }, at + DUR - 0.7);

        /* 2. The diamonds catch the front as it reaches them. At six design
           px across, size is what makes one read as having fired. */
        diamonds.forEach((d, i) => {
          const t = when(diaXs[i]);
          tl.fromTo(d, { scale: 1, filter: C.diaRest }, {
            scale: 2, filter: C.diaLit,
            duration: 0.24, ease: 'power2.out', immediateRender: false,
          }, t)
            .to(d, {
              scale: 1, filter: C.diaRest, duration: 0.85, ease: 'sine.inOut',
              onComplete: () => gsap.set(d, { clearProps: 'transform,transformOrigin,filter' }),
            }, t + 0.26);
        });

        /* 3. The pills turn over: a flat chip of the brand red and back, with
           no halo, shadow, scale or filter. Opacity goes to 1 with the colour,
           because at the stylesheet's resting opacity #e5331e would render as
           a dimmed red rather than the brand colour. */
        pills.forEach((el, i) => {
          const t = when(pillXs[i]) - 0.14;
          tl.to(el, {
            backgroundColor: C.pillLitBg, color: C.pillLitFg, opacity: 1,
            duration: 0.3, ease: 'sine.out',
          }, t)
            .to(el, {
              backgroundColor: pillBg, color: pillFg, opacity: pillOp,
              duration: 0.95, ease: 'sine.inOut',
              onComplete: () => gsap.set(el, { clearProps: 'backgroundColor,color,opacity' }),
            }, t + 0.42);

          // The glyph follows the label on the same two beats and the same
          // two eases. Plain `.to()` like the pill above, so the
          // `immediateRender` trap structurally cannot apply.
          if (pillIcons[i].length) {
            tl.to(pillIcons[i], {
              color: C.pillLitFg, duration: 0.3, ease: 'sine.out',
            }, t)
              .to(pillIcons[i], {
                color: iconFg, duration: 0.95, ease: 'sine.inOut',
                onComplete: () => gsap.set(pillIcons[i], { clearProps: 'color' }),
              }, t + 0.42);
          }
        });

        /* 4. The tile transmits: the light comes in, crosses the mark in the
           direction of travel and leaves; the fall takes about two seconds. */
        const hit = when(tileX);
        if (tile && tileBorder) {
          // The rim only: a hairline changing colour, nothing outside the
          // tile's own box.
          tl.to(tile, {
            borderColor: C.rimLit, duration: 0.35, ease: 'power2.out',
          }, hit - 0.3)
            .to(tile, {
              borderColor: tileBorder, duration: 1.6, ease: 'sine.inOut',
              onComplete: () => gsap.set(tile, { clearProps: 'borderColor' }),
            }, hit + 0.45);
        }
        if (glass && glassBg) {
          tl.to(glass, {
            backgroundColor: C.glassLit, duration: 0.3, ease: 'power2.out',
          }, hit - 0.3)
            .to(glass, {
              backgroundColor: glassBg, duration: 1.8, ease: 'sine.inOut',
              onComplete: () => gsap.set(glass, { clearProps: 'backgroundColor' }),
            }, hit + 0.45);
        }
        if (tileArt) {
          // The photograph under the glass lifts as the light goes through.
          tl.fromTo(tileArt, { filter: C.artRest }, {
            filter: C.artLit, duration: 0.3, ease: 'power2.out', immediateRender: false,
          }, hit - 0.3)
            .to(tileArt, {
              filter: C.artRest, duration: 1.8, ease: 'sine.inOut',
              onComplete: () => gsap.set(tileArt, { clearProps: 'filter' }),
            }, hit + 0.45);
        }
        if (bar) {
          // -26 .. 92 across a 65.12-wide face: fully off one side to fully off
          // the other, as fractions of the face for the same reason as above.
          const x0 = ((dir > 0 ? -26 : 92) / 65.12) * face;
          const x1 = ((dir > 0 ? 92 : -26) / 65.12) * face;
          tl.fromTo(bar, { x: x0, opacity: 0 },
            { opacity: 0.95, duration: 0.18, ease: 'none', immediateRender: false }, hit - 0.2)
            .to(bar, { x: x1, duration: 0.72, ease: 'power1.inOut' }, hit - 0.2)
            .to(bar, { opacity: 0, duration: 0.2, ease: 'none' }, hit + 0.34);
        }

        /* 5. The sub-head warms as the front crosses it: a plain colour
           change, nothing moves. */
        if (sub && subFg) {
          const t = when(subX) - 0.2;
          tl.to(sub, { color: C.subLit, duration: 0.35, ease: 'sine.out' }, t)
            .to(sub, {
              color: subFg, duration: 1.2, ease: 'sine.inOut',
              onComplete: () => gsap.set(sub, { clearProps: 'color' }),
            }, t + 0.5);
        }
      };

      pass(PASS_A, 1);
      pass(PASS_B, -1);

      /* The rest of the cycle is rest. Off screen, the loop pauses at one of
         these two points rather than mid-pass, so the band is never left on a
         lit pill or a head halfway down a fan. A pass is allowed to finish. */
      const settle = () => {
        rest();
        // Deferred: this runs inside the timeline's own tick, and `remeasure`
        // throws that timeline away.
        if (rebuild) { rebuild = false; window.setTimeout(remeasure, 0); }
        if (offscreen) tl.pause();
      };
      tl.call(settle, undefined, PASS_B - 1.4);
      tl.call(settle, undefined, PERIOD - 0.05);
      tl.to({}, { duration: 0.01 }, PERIOD - 0.01);

      tl.play();
    }, root);

    // `remeasure` comes back through here: drop the previous pair first.
    io?.disconnect();
    ro?.disconnect();
    io = new IntersectionObserver(([entry]) => {
      offscreen = !entry.isIntersecting;
      if (!offscreen) cycle?.play();
      else if (cycle && !inBeat(cycle.time())) cycle.pause();
    }, { rootMargin: '120px' });
    io.observe(root);

    ro = new ResizeObserver(() => {
      window.clearTimeout(resizer);
      resizer = window.setTimeout(() => {
        const wide = DW;
        measureFrame();
        sizeOverlays();
        // Design coordinates survive a resize; a breakpoint crossing changes
        // the design space itself, and with it every time the timeline baked.
        if (wide !== DW) rebuild = true;
        else if (!inBeat(cycle?.time() ?? 0)) buildTables();
        else rebuild = true;
      }, 250);
    });
    ro.observe(frame);
  };

  /** Is the playhead inside a pass rather than in one of the two rest bands? */
  const inBeat = (t: number) =>
    (t > PASS_A - 0.1 && t < PASS_B - 1.4) || (t > PASS_B - 0.1 && t < PERIOD - 0.05);

  /** Re-derive everything a breakpoint crossing invalidated, and start again. */
  const remeasure = () => {
    measureFrame();
    sizeOverlays();
    buildTables();
    // The baked times are wrong at the new design width, so the cycle is thrown
    // away and rebuilt from rest, which `settle` has just established.
    ctx?.revert();
    ctx = undefined;
    cycle = undefined;
    started = false;
    mine.splice(0).forEach((el) => el.remove());
    bar = null;
    // The breakpoint also changes which pills and diamonds are displayed.
    pills = shown(qa('.fan__pill'));
    diamonds = shown(qa('.fan__diamond'));
    start();
  };

  /* -------------------------------------------------------------- the gate
     `useSectionMotion` calls this as its `idle` option from the entrance's
     `onComplete`, after `done()`, so `data-motion-done` is already set and
     the first branch below fires at once. If called earlier (directly, for
     example) the `motion:done` event is still ahead and is listened for.
     Under both sits a fallback: is anything still animating in this section? */
  const open = () => {
    if (stopped || ready) return;
    window.clearInterval(probe);
    probe = 0;
    watcher?.disconnect();
    root.removeEventListener('motion:done', heard);
    ready = window.setTimeout(start, SETTLE * 1000);
  };

  let quiet = 0;
  let waited = 0;
  const busy = () =>
    gsap.globalTimeline.getChildren(true, true, true).some((a) => {
      if (!a.isActive()) return false;
      const targets = (a as gsap.core.Tween).targets?.() ?? [];
      return targets.some((t) => t instanceof Node && (t === root || root.contains(t)));
    });
  const watch = () => {
    probe = window.setInterval(() => {
      waited += 1;
      quiet = busy() ? 0 : quiet + 1;
      // The cap is a backstop, not the plan.
      if (quiet >= 3 || waited >= 40) { window.clearInterval(probe); probe = 0; open(); }
    }, 250);
  };

  root.addEventListener('motion:done', heard);

  if (root.dataset.motionDone) open();
  else if (root.dataset.motion !== 'pending') watch();
  else {
    watcher = new MutationObserver(() => {
      if (root.dataset.motion !== 'pending') { watcher?.disconnect(); watch(); }
    });
    watcher.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  return () => {
    stopped = true;
    window.clearTimeout(ready);
    window.clearTimeout(resizer);
    window.clearInterval(probe);
    root.removeEventListener('motion:done', heard);
    watcher?.disconnect();
    io?.disconnect();
    ro?.disconnect();
    cycle?.kill();
    // Reverts every colour and filter this loop tweened, whatever the playhead
    // was in the middle of.
    ctx?.revert();

    // The sparks and the fan groups are written straight to `style` rather than
    // through GSAP (sixteen dash offsets a frame is the hot path here), so
    // `revert` has never heard of them and they are handed back by name.
    sparks.forEach(clearSpark);
    fans.forEach(clearFan);

    // Then each tweened target, only the properties this file wrote. Do not use
    // `clearProps: 'all'`: it empties the style attribute, which holds each
    // pill's and diamond's `--x` / `--y` / `--w` and each glyph's `--icon`,
    // and collapses them all onto 0,0.
    const give = (el: Element | null, props: string) => {
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: props });
    };
    pills.forEach((el) => {
      give(el, 'backgroundColor,color,opacity');
      el.querySelectorAll<HTMLElement>('.icon').forEach((i) => give(i, 'color'));
    });
    diamonds.forEach((el) => give(el, 'transform,transformOrigin,filter'));
    give(tile, 'borderColor');
    give(tileArt, 'filter');
    give(glass, 'backgroundColor');
    give(sub, 'color');

    mine.splice(0).forEach((el) => el.remove());
    bar = null;
  };
}
