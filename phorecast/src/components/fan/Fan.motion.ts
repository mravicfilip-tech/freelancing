/* "You Can Never Lose More Than You Stake" — the band's load-in.
 *
 * 02 TRACE, chosen from the five in `fan-loadin-lab.html`:
 *
 *   "Nothing slides; the lines are drawn. A bright head runs the length of each
 *    arc and leaves the line behind it, one mirrored pair at a time, so you can
 *    follow the order. The tile ignites on the last pair."
 *
 * Nothing in this band translates. The sixteen arcs are already in their final
 * places from the first frame; what arrives is the ink. A short bright dash
 * enters from the outer edge of each fan, runs inward along the line, and the
 * stroke exists behind it. The two fans are mirrors, so a pair fires together
 * and the pairs are spaced far enough apart to be counted: EIGHT BEATS, one per
 * depth per half, upper then lower.
 *
 * THE SEQUENCE (2.4s end to end)
 *   0.00  THE HEADING, and the sub-line 0.12s behind it, resolving out of a
 *         14px blur. It opens the band rather than closing it: the arcs are
 *         what the section is made of, but the sentence is what it says, and a
 *         reader who has just arrived should not have to wait two seconds for
 *         a line of type. The rest of the sequence is unchanged around it.
 *   0.00  Beat 1. The innermost pair of the upper halves is drawn, left and
 *         right together, 0.8s of travel each.
 *   0.17  Beat 2, the lower halves at the same depth. Then a beat every 0.17s
 *         through all four depths — beats 3 to 8 at 0.34 … 1.19.
 *   0.42  The twelve diamonds, outermost first, 0.07s apart: they are on the
 *         path the heads are running, so they light in the order it reaches
 *         them.
 *   1.24  The six category pills, also outermost first, ending with the last
 *         pair of arcs.
 *
 *         Both of those counts are the wide band's. Below 900 the stylesheet
 *         drops the diamonds outright and keeps three pills, and `shown()`
 *         below takes them out of the timeline with it, so the sequence there
 *         is eight beats of arcs, three pills, the copy and the tile — the
 *         same shape and the same timings, with nothing tweening a box that is
 *         not on the page.
 *   1.64  THE TILE IGNITES. It arrives on the last pair landing and flashes to
 *         brightness 2.6, falling back to 1 over 0.75s. The band's one moment
 *         of real light, and it is the thing the arcs have been converging on.
 *
 * WHAT CHANGED, AND WHY. This used to run 3.25s from the first beat, with the
 * copy at 2.13 and the tile at 2.28 — and, before any of it, three quarters of
 * a second of main thread spent measuring the arcs (see COARSE). Scrolled to
 * on a phone, the band therefore held an empty frame for ~0.9s, drew lines for
 * two seconds more, and only then said anything. The eight beats are still
 * eight beats and still counted inward from the edges; they are simply quicker
 * (0.17 apart, 0.8 of travel), and the sentence no longer waits behind them.
 *
 * WHY NOT `draw()` FROM lib/motion.ts. Each of these paths is a whole ellipse
 * roughly 2100 user units across, and the band shows one sliver of it through
 * an 863-wide `overflow: hidden` window. A tip-to-tail `stroke-dashoffset`
 * sweep over the full perimeter therefore spends about four fifths of its
 * duration drawing off-frame: the head crosses the visible piece in a fraction
 * of the tween and the line then sits there while the tween finishes. So each
 * path is sampled once for the stretch that is actually inside its window
 * (`visibleSpan`) and the whole tween is spent on that.
 *
 * AND WHY IT DRAWS BACKWARDS. All four of these files are traversed
 * inward-to-outward — the two halves Figma rotated 180deg mirror the direction
 * along with the geometry, so it holds for all sixteen lines — which means a
 * forward draw would start at the tile and run out to the edge. Backwards is
 * what sends the head IN from the edge. See `drawArc`.
 *
 * DISCIPLINE. Start states are written with `gsap.set` and everything is
 * animated with `.to()`, so the `immediateRender` trap — a `fromTo` writing its
 * start values when the timeline is BUILT rather than when the playhead arrives
 * — structurally cannot apply. The one `fromTo` here, the tile's brightness
 * flash, carries `immediateRender: false` for exactly that reason.
 *
 * No hover, no pointer tracking, nothing here listens to the mouse.
 */
import type { SectionMotion, Timeline } from '../../lib/motion';
import { gsap } from 'gsap';
import { tok } from '../../lib/theme';

/** One beat. Eight of them, and they have to be countable. */
const BEAT = 0.17;
/** How long one head takes to cross its own visible stretch. */
const DRAW = 0.8;
/** The last pair finishes here; the tile hangs off it. */
const LAST = 7 * BEAT + DRAW;

/** The heading opens the band, so there is something to read at once. */
const COPY_AT = 0;
const COPY_STEP = 0.12;
const COPY_DUR = 0.75;

const DIAMOND_AT = 0.42;
const DIAMOND_STEP = 0.07;
const PILLS_AT = LAST - 0.75;
const PILL_STEP = 0.06;
const TILE_AT = LAST - 0.35;
/** The ignition's fall back to rest. */
const FLASH = 0.75;

/**
 * Bracketing the visible stretch: coarse steps first, then the two boundaries
 * walked down by bisection.
 *
 * `getPointAtLength` is the whole cost of building this band, and it used to be
 * paid 221 times per path across sixteen paths. Measured at 390 wide on the dev
 * server that was a 764ms block of main thread between the scroll and the
 * section revealing itself -- three quarters of a second in which the band is
 * still `visibility: hidden` and the reader is looking at nothing. It is also
 * the one part of the entrance that no amount of timeline tuning can reach,
 * because it happens before the timeline exists.
 *
 * Every one of these arcs is on screen over a contiguous 13-20% of its own
 * length (measured, all sixteen, at 390), so a 48-step walk always lands
 * several samples inside it, and bisecting the two crossings costs nine calls
 * each. 67 calls a path instead of 221, and the boundary it returns is more
 * accurate than the dense scan's rather than less: the dense scan could only
 * ever report the first SAMPLE that was inside, up to a full step late.
 */
/** Coarse steps when bracketing. */
const COARSE = 48;
/** Bisection steps per boundary. */
const REFINE = 9;
/** A dense fallback, for a path the coarse walk finds nothing on. */
const DENSE = 220;
/** How far outside the window a sample still counts, in CSS pixels. */
const PAD = 6;

interface Arc {
  path: SVGPathElement;
  /** The bright head: the same geometry again, shipped beside it by `Fan.tsx`. */
  spark: SVGPathElement | null;
  /** Index of this ellipse inside its own file, 0 (innermost) to 3. */
  depth: number;
  half: 'upper' | 'lower';
  len: number;
  /** The arc-length range this line is actually on screen over. */
  span: [number, number];
}

/**
 * The stretch of one path that the band actually shows, as a pair of lengths
 * along it.
 *
 * The path is walked at `COARSE` even steps, each point pushed through
 * `getScreenCTM` — which carries the viewBox scale and every CSS transform
 * above the path, including the `rotate(180deg)` and `rotate(-179.01deg)` that
 * Figma's mirrors are built from, so no mirroring has to be reasoned about
 * here — and tested against the window's own client rect. The two crossings
 * are then bisected to a fraction of a step and padded a whisker either side,
 * so the draw starts and ends just outside the window rather than popping into
 * existence on its edge.
 *
 * A line with no hits at all is drawn over its whole length: it cannot be seen
 * either way, and a zero-length span would divide by nothing downstream.
 */
function visibleSpan(path: SVGPathElement, win: DOMRect, len: number): [number, number] {
  const m = path.getScreenCTM();
  if (!m) return [0, len];

  const inside = (l: number) => {
    const p = path.getPointAtLength(l);
    const x = p.x * m.a + p.y * m.c + m.e;
    const y = p.x * m.b + p.y * m.d + m.f;
    return x >= win.left - PAD && x <= win.right + PAD && y >= win.top - PAD && y <= win.bottom + PAD;
  };

  /** First and last step index that is inside the window, at `n` steps. */
  const bracket = (n: number): [number, number] | null => {
    let first = -1;
    let last = -1;
    for (let i = 0; i <= n; i++) {
      if (inside((len * i) / n)) {
        if (first < 0) first = i;
        last = i;
      }
    }
    return first < 0 ? null : [first, last];
  };

  let n = COARSE;
  let hit = bracket(n);
  if (!hit) {
    // A stretch narrower than a coarse step. Not a case any of the sixteen
    // arcs is in at any width measured, but a fan drawn differently might be,
    // and the alternative -- returning the whole length -- spends the tween
    // drawing off-frame, which is the exact fault this file was written to
    // avoid.
    n = DENSE;
    hit = bracket(n);
  }
  if (!hit) return [0, len];

  const step = len / n;
  /** The crossing between a length known outside and one known inside. */
  const edge = (out: number, into: number) => {
    let lo = out;
    let hi = into;
    for (let i = 0; i < REFINE; i++) {
      const mid = (lo + hi) / 2;
      if (inside(mid)) hi = mid; else lo = mid;
    }
    return hi;
  };

  const first = hit[0] === 0 ? 0 : edge((hit[0] - 1) * step, hit[0] * step);
  const last = hit[1] === n ? len : edge((hit[1] + 1) * step, hit[1] * step);

  // A whisker either side, so the draw starts and ends just outside the window
  // rather than popping into existence on its edge.
  const pad = len / DENSE;
  return [Math.max(0, first - pad), Math.min(len, last + pad)];
}

/**
 * Draw one arc, head first, inward from the edge of the band.
 *
 * With `stroke-dasharray: len` — one value, so the pattern is the whole line on
 * and the whole line off — a `stroke-dashoffset` of `-t` paints exactly the
 * stretch from `t` to the end and nothing before it. Start with `t` at the
 * span's far end and walk it down to the near end, and the line fills in
 * backwards: the head enters at the outer edge and the stroke follows it in.
 * The remainder, `[0, span0]`, is entirely off-frame, so it is completed in one
 * invisible `set` at the end rather than given any of the tween.
 *
 * The spark is the same path again carrying a short dash — `h` on, everything
 * else off — walked on the identical offset, so it sits pinned to the head with
 * the drawn stroke behind it. It fades out before the line lands.
 */
function drawArc(tl: Timeline, a: Arc, at: number) {
  const [s0, s1] = a.span;
  const head = Math.min((s1 - s0) * 0.3, 240);

  gsap.set(a.path, { strokeDasharray: a.len, strokeDashoffset: -s1 });
  tl.to(a.path, { strokeDashoffset: -s0, duration: DRAW, ease: 'power2.inOut' }, at);
  // Off-frame and instant: the line is whole from here on, and a plain
  // `stroke-dashoffset: 0` with the dash still set paints exactly as no dash.
  tl.set(a.path, { strokeDashoffset: 0 }, at + DRAW);

  if (!a.spark) return;
  gsap.set(a.spark, { strokeDasharray: `${head} ${a.len + head}`, strokeDashoffset: -s1, opacity: 0.95 });
  tl.to(a.spark, { strokeDashoffset: -s0, duration: DRAW, ease: 'power2.inOut' }, at);
  tl.to(a.spark, { opacity: 0, duration: 0.4, ease: 'power2.out' }, at + DRAW * 0.72);
}

/**
 * Outermost first: order by how far each element's middle sits from the band's,
 * furthest away leading.
 *
 * Read off live rects rather than the authored design coordinates, because
 * below 900 the band is a different composition and not a scaled one: the arc
 * groups are re-placed from the painted extent and the surviving pills leave
 * their absolute coordinates for a centred row. The authored x would put the
 * stagger in the wrong order there; a live rect is right at every width.
 */
function fromEdges(el: HTMLElement, els: HTMLElement[]): HTMLElement[] {
  const box = el.getBoundingClientRect();
  const mid = box.left + box.width / 2;
  const off = (n: HTMLElement) => {
    const r = n.getBoundingClientRect();
    return Math.abs(r.left + r.width / 2 - mid);
  };
  return [...els].sort((a, b) => off(b) - off(a));
}

/**
 * Sections whose arrival has already been performed, start to finish, in this
 * page's life.
 *
 * `useSectionMotion` rebuilds whenever its effect re-runs, and that is right:
 * React mounts, tears down and mounts again inside a single frame, and the
 * first build is reverted before a paint, so refusing to rebuild would leave
 * the band settled and silent. But a rebuild also arrives when vite hot-updates
 * this component, and `Fan.tsx` imports `Fan.loop.ts` for the `idle` option —
 * which puts the loop's module on this component's import path, so saving that
 * file re-mounts the section on the same DOM node with the band still on
 * screen, the observer fires at once, and the entrance performs itself a second
 * time in front of someone who has already watched it. That fault was diagnosed
 * and fixed on the familiar band; `Familiar.motion.ts` carries the measurements.
 *
 * The two cases are told apart by whether the previous timeline actually
 * reached its end. The mark below is the LAST thing on the timeline, so a build
 * reverted mid-flight — StrictMode's, always — never sets it and the next build
 * plays in full. One that ran to completion does, and the next build adds no
 * tweens at all: the hook reveals the section, the empty timeline completes on
 * the next tick, and the loop is handed the band exactly as it would have been.
 *
 * Keyed on the element, so a genuinely new section node performs its arrival
 * properly. Editing this file resets the set with the module, which is what you
 * want while working on the motion itself.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * Only the elements the stylesheet is actually rendering.
 *
 * Below 900 the band drops the twelve diamonds and three of the six pills with
 * `display: none` — a mobile composition, not a rescale of the 1920 one. A
 * tween aimed at a box that does not exist is dead motion: it costs a beat of
 * the stagger, it holds a slot in `fromEdges`, and it reads as a pause in a
 * sequence whose whole point is that it can be counted. Asking the layout
 * rather than repeating the media query here means the two cannot drift: hide
 * anything in `Fan.css` at any width and it leaves the entrance with it.
 *
 * `getClientRects()`, not `offsetParent` or a visibility read, because the
 * band is `visibility: hidden` while `data-motion="pending"` — which is
 * exactly when this runs. A `visibility: hidden` element still has boxes; a
 * `display: none` one has none.
 */
const shown = (els: HTMLElement[]) => els.filter((e) => e.getClientRects().length > 0);

export function buildFan({ el, q, tl }: SectionMotion) {
  // Already landed once and still on screen: settle, do not re-perform.
  if (LANDED.has(el)) return;

  /* The tile's ignition, read from the document rather than baked, and read
     HERE — inside the build — because `useSectionMotion` takes the theme epoch
     as a dependency and runs this again when the theme changes. In dark the
     flash is `brightness(2.6)`: the band's one moment of real light. On paper
     that washes a 100px plate to nothing, so light supplies the other
     direction from `Fan.css` and this line does not care which it gets. */
  const igniteFrom = tok('--fan-tile-lit', 'brightness(2.6)');
  const igniteTo = tok('--fan-tile-rest', 'brightness(1)');
  /* Where the pills land. The stylesheet's own resting value, read rather than
     repeated, because light carries the pills a little stronger: dark ink on
     paper is less present per unit alpha than white on black. */
  const pillOp = Number(tok('--fan-pill-op', '0.7')) || 0.7;

  /* The sixteen lines, read out of the inlined SVGs. Each file is four whole
     ellipses in DOM order innermost to outermost, and `Fan.tsx` ships a
     `.fan__spark` twin immediately after each one — hence `:not()` here and
     `nextElementSibling` for the head. */
  const arcs: Arc[] = [];
  q('.fan__arcs').forEach((group) => {
    const win = group.getBoundingClientRect();
    (['upper', 'lower'] as const).forEach((half) => {
      const svg = group.querySelector(`.fan__lines--${half}`);
      if (!svg) return;
      svg.querySelectorAll<SVGPathElement>('path:not(.fan__spark)').forEach((path, depth) => {
        const len = path.getTotalLength();
        if (!len) return;
        const next = path.nextElementSibling;
        arcs.push({
          path,
          spark: next instanceof SVGPathElement && next.classList.contains('fan__spark') ? next : null,
          depth,
          half,
          len,
          span: visibleSpan(path, win, len),
        });
      });
    });
  });

  const diamonds = shown(q('.fan__diamond'));
  const pills = shown(q('.fan__pill'));
  const tile = q('.fan__tile')[0];
  const copy = q('.fan__title .fan__in, .fan__sub .fan__in');

  /* Start states, all of them written here with `set` so that every tween below
     can be a plain `.to()`. Nothing is parked off to one side: this entrance
     moves nothing positionally, and the only thing the diamonds and pills do is
     come up to size on the spot. */
  gsap.set(diamonds, { opacity: 0, scale: 0.4 });
  gsap.set(pills, { opacity: 0, scale: 0.94 });
  gsap.set(copy, { opacity: 0, y: 10, filter: 'blur(14px)' });
  if (tile) gsap.set(tile, { opacity: 0, scale: 0.8 });

  /* 1 — THE EIGHT BEATS. Both sides of one half at one depth per beat, upper
     then lower, so what is read is eight separate events rather than sixteen
     overlapping ones. Left and right share a beat because the band is a mirror
     and opening one side ahead of the other would tip it. */
  arcs.forEach((a) => drawArc(tl, a, (a.depth * 2 + (a.half === 'lower' ? 1 : 0)) * BEAT));

  /* 2 — the diamonds, outermost first. They sit along the arcs, so they come up
     roughly with the heads that are passing them. Six design pixels across, so
     the scale is what makes them readable as arriving at all; it settles rather
     than overshoots. `clearProps` hands the transform back to the stylesheet,
     which is where their `rotate(135deg)` lives. */
  fromEdges(el, diamonds).forEach((d, i) => {
    tl.to(d, {
      opacity: 1,
      scale: 1,
      duration: 0.28,
      ease: 'power3.out',
      clearProps: 'transform',
    }, DIAMOND_AT + i * DIAMOND_STEP);
  });

  /* 3 — the category pills, outermost first as well, finishing under the last
     pair of arcs. They are the labels on the field, not a fourth statement, so
     they arrive quietly and at their stylesheet's 0.7. */
  fromEdges(el, pills).forEach((p, i) => {
    tl.to(p, {
      opacity: pillOp,
      scale: 1,
      duration: 0.36,
      ease: 'power3.out',
      clearProps: 'transform',
    }, PILLS_AT + i * PILL_STEP);
  });

  /* 4 — the copy, out of blur, on the opening beat. The inner spans, never the
     blocks: both are centred with `translateX(-50%)` and GSAP would resolve
     that centring to a pixel value for the length of the tween. */
  copy.forEach((c, i) => {
    tl.to(c, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: COPY_DUR,
      ease: 'expo.out',
      clearProps: 'transform,filter,opacity',
    }, COPY_AT + i * COPY_STEP);
  });

  /* 5 — THE TILE IGNITES, on the last pair of arcs landing. Two tweens: it
     comes up to size, and it flashes.

     The flash is the only `fromTo` in this file, and it carries
     `immediateRender: false` because a `fromTo` writes its start values the
     moment the tween is BUILT rather than when the playhead arrives — without
     it the tile would sit at brightness 2.6 from build time, through every beat
     before this one, which is the whole entrance. */
  if (tile) {
    tl.to(tile, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: 'back.out(2)',
      clearProps: 'transform',
    }, TILE_AT);
    tl.fromTo(tile,
      { filter: igniteFrom },
      { filter: igniteTo, duration: FLASH, ease: 'power2.out', immediateRender: false, clearProps: 'filter' },
      TILE_AT);
  }

  // Last on the timeline, so it is only reached if the arrival was actually
  // performed. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
