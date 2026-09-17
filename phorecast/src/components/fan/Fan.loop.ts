/**
 * "Your Funds Stay in Your Control" — the ambient loop.
 *
 * The section's load-in belongs to `Fan.motion.ts`. This file owns what happens
 * *after* it has landed: it reads the markup the component ships, adds one
 * overlay of its own — a clip inside the glass and the bar of light in it — and
 * removes it on teardown.
 *
 * THE STORY — 05 CROSSFEED, one band straight through, twice, every 13s
 * ---------------------------------------------------------------------
 * The chosen loop is not an arrival. It is a pass: settlement going *through*
 * your custody rather than stopping at it.
 *
 *   0.60s  A front enters past the left edge of the band and starts across.
 *          It is one x, moving, and everything in the section answers to it.
 *   ~1.0s  It is on the left fan: a short bright head rides each of the eight
 *          arcs there, ON the line, at exactly the point of the curve that
 *          stands at the front's x.
 *   ~1.8s  SPORT, then CRYPTO, then FINANCE turn over as the front reaches
 *          them — each diamond and each pill fires at the frame the front's
 *          centre is at its x, solved back through the ease, not staggered by
 *          eye. The diamonds on the path flare; the pills change colour.
 *   ~2.5s  It crosses the tile. A bar of light runs across the mark's face in
 *          the direction of travel, the frosted panel behind it fills, the
 *          photograph under the glass lifts, and the hairline rim goes warm —
 *          the light goes through the vault.
 *   ~3.3s  The right fan, ELECTIONS, GEOPOLITICS, TECH, and out past the right
 *          edge at 4.4s. The tile lets go over two seconds behind it.
 *   7.00s  The return pass, mirrored: in at the right, out at the left.
 *   11.4s  Everything is the Figma frame again, and stays there to 13s.
 *
 * THE LIGHT IS ON THE CURVE, NOT IN A BOX ACROSS IT
 * -------------------------------------------------
 * The arcs ship inlined now, sixteen addressable paths with a `.fan__spark`
 * twin beside each one — same geometry, flat `#ffc0a4`, held at opacity 0 by
 * the stylesheet. So the band of light is not a travelling window holding a
 * brightened clone of the arcs, as it had to be while they were `<img>`: each
 * spark carries a short `stroke-dasharray` head and the head is placed by
 * `stroke-dashoffset`, so the light is genuinely painted along the wire.
 *
 * Which needs the inverse of the map the entrance uses. The entrance walks the
 * dash by arc length; this has to walk it by *screen x*, because x is what the
 * whole section shares. Each spark is therefore sampled once — its longest
 * unbroken run inside its group's `overflow: hidden` window, the same problem
 * `Fan.motion.ts` solves for the draw — and that run is stored as a paired
 * (length, design-x) table. The visible run of each of these ellipses is a
 * single quadrant, so x along it is monotonic and the table inverts cleanly:
 * `sAt(x)` is a binary search and a lerp, evaluated sixteen times a frame.
 *
 * It also has no rectangle to leak. The window it replaces was a box holding a
 * brightened clone of the arcs, screened over the originals, and on a near-black
 * ground a `brightness()` multiplier lifts the whole box rather than only the
 * strokes inside it — which is what was showing as three maroon panels over the
 * left fan. A dash on a path cannot do that: the lit region IS the stroke.
 *
 * The cost is that a dash offset moves no bounding box, so
 * `scripts/amplitude.mjs` reads the arcs as static however bright they are, and
 * the one element this file creates is created too late for it to see. The lit
 * point's travel is measured directly instead; the figures are in the report.
 *
 * WHAT ELSE TAKES PART
 * --------------------
 * Four things in this band used to sit out the whole cycle, and now do not:
 *
 *   the sparks    The sixteen `.fan__spark` twins are lit once by the entrance
 *                 and then dead for the rest of the page's life. They now carry
 *                 the whole beat, which is also what makes the light line-shaped
 *                 rather than box-shaped.
 *   the fans      Each group's own opacity lifts 0.70 → 0.82 while the front
 *                 is inside it and falls again behind it. The group conducts;
 *                 it does not breathe, and it is flat whenever nothing is
 *                 crossing it.
 *   the tile art  `.fan__tile-bg` lifts as the front passes through, so the
 *                 light is transmitted by the vault rather than applied to its
 *                 front face. It is also, now, most of the tile's beat: there
 *                 is no shadow ramp and no bloom on the tile or its glass, by
 *                 standing instruction — nothing in this band gets a halo.
 *   the sub-head  The one line of copy with headroom in it (#9d9d9d) warms as
 *                 the front crosses and cools behind it — the same plain
 *                 colour transition the pills make, nothing else.
 *
 * NOTHING IN THIS BAND GLOWS
 * --------------------------
 * A standing preference, and the one place this departs from the lab twice
 * over. The lab's 05 ramps the tile's red `box-shadow` alpha and blur as its
 * landing beat and hangs a drop-shadow on the mark; both are gone, along with
 * the stylesheet's own two red shadows. What is left of the arrival is the
 * shine crossing the mark's face, the glass filling, the photograph under it
 * lifting and the rim changing colour — a light passing through a thing, with
 * no aura around it anywhere.
 *
 * The pills are the same instruction one element down. A pill is
 * a flat chip of the brand red for as long as the front is on it: background
 * to `--orange-100`, contents to `--white-font`, and back. No halo, no bloom,
 * no drop-shadow, no scale, and `filter` on the pill itself is never written
 * at all. The one exception is noted at `PILL_ICON_LIT`.
 *
 * Nothing here floats, breathes, drifts, or reacts to the pointer. Reduced
 * motion runs none of it.
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
 * Every colour and every lift this loop applies, read from the document at
 * BUILD time — which is to say inside `start()` below, beside the
 * `getComputedStyle` rest reads that were already there, and never at module
 * scope. `useSectionMotion` takes the theme epoch as a dependency, so a theme
 * change tears this loop down and builds it again and these run afresh; read
 * once at module scope they would freeze to whichever palette happened to be
 * live when the bundle evaluated, and the band would cool to dark-mode
 * colours on paper for the life of the page.
 *
 * The fallbacks are the literals this file shipped with, so a missing custom
 * property yields today's dark value — the safest failure mode there is for
 * the regression gate.
 *
 * DIRECTION. Five of these are lifts, and in dark every one of them means
 * BRIGHTER: the diamonds flare, the photograph under the glass lifts, the rim
 * and the frosted panel go pale, the sub-head warms towards white, and the
 * bar that crosses the mark is very nearly white. On paper brighter is less —
 * each of those would climb towards the page and the beat would stop being
 * visible without a single thing stopping working. The inversion is in the
 * light half of `Fan.css`; what matters here is only that nothing is baked.
 */
const read = () => ({
  /* The lit pill: a flat chip of the brand red carrying its own label colour.
     --on-accent does not flip — it is read against --accent, which is dark in
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

/**
 * The pill icons are `<img>` elements holding grey (#9d9d9d) SVG files, so the
 * `color` that turns the label white cannot reach their pixels. A hard two-step
 * remap is the only way to make them white without owning `Fan.tsx`: it is a
 * paint operation with no blur, no spread and no shadow — the glyph is white or
 * it is grey, and it is never brighter than white. The pill element itself gets
 * no filter at any point. When the icons are inlined this becomes
 * `fill: currentColor` and the filter goes.
 */
const PILL_ICON_REST = 'brightness(1) invert(0)';
const PILL_ICON_LIT = 'brightness(0) invert(1)';

/** Length of the head riding each arc, in design px of screen arc. */
const HEAD = 132;
/** Design px over which a head fades in at the end of its own arc. */
const HEAD_FADE = 70;
/** How much thicker the lit head is than the `.fan__spark` attribute's 2.4. */
const HEAD_WEIGHT = 1.5;
/** Samples per spark when the (length, x) table is built. */
const SAMPLES = 220;

const px = (n: number) => `${n}px`;
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
  const pills = qa('.fan__pill');
  const diamonds = qa('.fan__diamond');
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
     Everything below is in design px — the 1920 x 675 screenshot space the
     stylesheet's `--f` scales from, or 1000 x 620 under the breakpoint. Live
     rects are divided back into it, so a pill's x is the same number at every
     width and only a breakpoint crossing invalidates the timeline. */
  let DW = 1920;
  let f = 1;
  let box = frame.getBoundingClientRect();

  const measureFrame = () => {
    box = frame.getBoundingClientRect();
    DW = matchMedia('(max-width: 900px)').matches ? 1000 : 1920;
    f = box.width / DW || 1;
  };
  /** A client rect's centre, in design px relative to the frame. */
  const cx = (el: Element) => {
    const r = el.getBoundingClientRect();
    return (r.left + r.width / 2 - box.left) / f;
  };

  /* -------------------------------------------------------------- the sparks
     The table is (length along the path, design x), over the longest unbroken
     run of the path that its group's window actually shows. Sampling is the
     only way in: these are whole ellipses about 2100 units across, seen through
     an 863-wide clip, so five sixths of each path is off screen and a dash
     walked over the whole perimeter would be invisible for most of its travel.
     Because the visible run is a single quadrant, x along it is monotonic, and
     the table inverts. */
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

        const ls: number[] = [];
        const xs: number[] = [];
        const ys: boolean[] = [];
        for (let i = 0; i <= SAMPLES; i += 1) {
          const l = (len * i) / SAMPLES;
          const p = el.getPointAtLength(l);
          const sx = p.x * m.a + p.y * m.c + m.e;
          const sy = p.x * m.b + p.y * m.d + m.f;
          ls.push(l);
          xs.push((sx - box.left) / f);
          ys.push(sx >= win.left && sx <= win.right && sy >= win.top && sy <= win.bottom);
        }

        // Longest unbroken visible run, one sample either side so the head
        // enters and leaves just outside the window instead of on its edge.
        let best: [number, number] | null = null;
        let run: [number, number] | null = null;
        for (let i = 0; i <= SAMPLES; i += 1) {
          if (ys[i]) run = run ? [run[0], i] : [i, i];
          else {
            if (run && (!best || run[1] - run[0] > best[1] - best[0])) best = run;
            run = null;
          }
        }
        if (run && (!best || run[1] - run[0] > best[1] - best[0])) best = run;
        if (!best || best[1] === best[0]) return;
        const lo = Math.max(0, best[0] - 1);
        const hi = Math.min(SAMPLES, best[1] + 1);

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
     One, and it lives inside the glass, which clips it to the mark's face.

     There is deliberately nothing else. An earlier draft of this loop carried a
     wide soft warm wash travelling with the front under the whole band, to keep
     the pass alive over the 330 design px between the two fans where there are
     no arcs. It went, with the tile's shadows and the pills' halo: any element
     that fills an area of the background reads as a maroon patch on this ground
     however soft its edges are, and this band is not to glow anywhere. The gap
     is the tile's, and the tile takes the light as the front reaches it. */
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

  /** Overlay sizes are the only thing here that is not resolution-independent. */
  const sizeOverlays = () => {
    if (bar) {
      bar.style.width = px(18 * f);
      bar.style.filter = `blur(${px(2.5 * f)})`;
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
  /** `clearProps` on `filter` leaves `filter: none` sitting in the attribute. */
  const dropFilter = (els: HTMLElement[]) => {
    gsap.set(els, { clearProps: 'filter' });
    els.forEach((el) => el.style.removeProperty('filter'));
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
    // The entrance leaves each `.fan__spark` holding its own `opacity: 0` and a
    // dash pair. Invisible either way, but the rest band is meant to be one
    // value per element and that is two, so the sixteen are handed back to the
    // stylesheet before the first pass rather than on the frame the front first
    // reaches each of them.
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
    const pillIcons = pills.map((p) => Array.from(p.querySelectorAll<HTMLElement>('img')));

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, paused: true });
      cycle = tl;

      /**
       * One pass. `dir` 1 runs left to right, -1 right to left. Everything in
       * the band is scheduled off `when`, which asks the ease when the front's
       * centre is at a given design x — so a pill turns over on the frame the
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

        /* 1 — the front crosses, and the arcs, the fans and the ground with it.
           `immediateRender: false` on both: a delayed `fromTo` writes its start
           values when the timeline is BUILT, not when the playhead arrives, and
           without it the second pass would slam the front back to its own start
           at t=0 and hold it there through the first. */
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

        /* 2 — the diamonds on the path catch the front as it reaches them.
           They are six design px across, so size is what makes one readable as
           having fired at all. */
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

        /* 3 — the pills turn over. A flat chip of the brand red and back: no
           halo, no bloom, no shadow, no scale, and no filter on the pill. The
           opacity goes with the colour because it is part of it — at the
           stylesheet's 0.7 over this ground #e5331e renders as rgb(167,42,27),
           which is not the brand colour but 70% of it. */
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

          if (pillIcons[i].length) {
            tl.fromTo(pillIcons[i], { filter: PILL_ICON_REST }, {
              filter: PILL_ICON_LIT, duration: 0.3, ease: 'sine.out', immediateRender: false,
            }, t)
              .to(pillIcons[i], {
                filter: PILL_ICON_REST, duration: 0.95, ease: 'sine.inOut',
                onComplete: () => dropFilter(pillIcons[i]),
              }, t + 0.42);
          }
        });

        /* 4 — the tile transmits. It takes the light in, carries it across the
           mark in the direction of travel, and lets it out the far side; the
           fall is two seconds, because a vault is not a strobe. */
        const hit = when(tileX);
        if (tile && tileBorder) {
          // The rim only. No shadow, no bloom and nothing outside the tile's own
          // 100 design px: the rim is a hairline changing colour, the same plain
          // transition the pills make, and the light itself is the bar below.
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
          // The photograph under the glass, lifting as the light goes through
          // it — the one part of the tile that used to sit out the whole cycle.
          tl.fromTo(tileArt, { filter: C.artRest }, {
            filter: C.artLit, duration: 0.3, ease: 'power2.out', immediateRender: false,
          }, hit - 0.3)
            .to(tileArt, {
              filter: C.artRest, duration: 1.8, ease: 'sine.inOut',
              onComplete: () => gsap.set(tileArt, { clearProps: 'filter' }),
            }, hit + 0.45);
        }
        if (bar) {
          const x0 = (dir > 0 ? -26 : 92) * f;
          const x1 = (dir > 0 ? 92 : -26) * f;
          tl.fromTo(bar, { x: x0, opacity: 0 },
            { opacity: 0.95, duration: 0.18, ease: 'none', immediateRender: false }, hit - 0.2)
            .to(bar, { x: x1, duration: 0.72, ease: 'power1.inOut' }, hit - 0.2)
            .to(bar, { opacity: 0, duration: 0.2, ease: 'none' }, hit + 0.34);
        }

        /* 5 — the sub-head warms as the front crosses it. The only line of copy
           in the band with headroom in it, and the same plain colour change the
           pills make. Nothing moves; the type is not touched otherwise. */
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

      /* The rest of the cycle is rest. Two hooks sit in it: off screen the loop
         stops here rather than wherever the scroll happened to leave it, so the
         section is never parked on a lit pill with a bright head halfway down a
         fan for as long as it takes someone to come back. A beat is four
         seconds; it is allowed to finish. */
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
    // away and rebuilt — from rest, which `settle` has just established.
    ctx?.revert();
    ctx = undefined;
    cycle = undefined;
    started = false;
    mine.splice(0).forEach((el) => el.remove());
    bar = null;
    start();
  };

  /* -------------------------------------------------------------- the gate
     `useSectionMotion` passes this function as its `idle` option and calls it
     from the entrance's `onComplete`, one line after `done()` — so
     `data-motion-done` is already set by the time this runs and the first
     branch below fires at once. Called any earlier (a direct call, a lab
     harness) the `motion:done` event is still ahead of us and is the best
     signal there is, and under both sits the question that is true either way:
     is anything still animating inside this section? */
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
    // through GSAP — sixteen dash offsets a frame is the hot path here — so
    // `revert` has never heard of them and they are handed back by name.
    sparks.forEach(clearSpark);
    fans.forEach(clearFan);

    // Then each tweened target, and only the properties this file ever wrote. A
    // blanket `clearProps: 'all'` is not safe here: it empties the style
    // attribute, and that attribute is where `Fan.tsx` puts each pill's and
    // diamond's `--x` / `--y` / `--w` — clearing it collapses every one of them
    // onto 0,0. The diamonds also carry their colour in a `background`
    // shorthand, which `backgroundColor` would expand and drop.
    const give = (el: Element | null, props: string) => {
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: props });
    };
    pills.forEach((el) => {
      give(el, 'backgroundColor,color,opacity');
      const icons = Array.from(el.querySelectorAll<HTMLElement>('img'));
      icons.forEach((i) => gsap.killTweensOf(i));
      dropFilter(icons);
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
