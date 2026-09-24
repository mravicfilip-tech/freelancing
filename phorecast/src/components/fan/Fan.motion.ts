/* "Where Every Outcome Connects." The band's load-in.
 *
 * Nothing slides; the lines are drawn. The sixteen arcs are in their final
 * places from the first frame and what arrives is the ink: a short bright dash
 * enters from the outer edge of each fan, runs inward along the line, and the
 * stroke exists behind it. The fans are mirrors, so a pair fires together, and
 * the pairs are spaced to be countable: EIGHT BEATS, one per depth per half,
 * upper then lower. The tile ignites on the last pair.
 *
 * THE SEQUENCE (2.4s end to end)
 *   0.00  The heading, and the sub-line 0.12s behind it, out of a 14px blur.
 *         The copy opens the band so a reader is not kept waiting for type.
 *   0.00  Beat 1: the innermost upper pair, left and right, 0.8s of travel.
 *   0.17  Beat 2: the lower pair at the same depth. Then a beat every 0.17s,
 *         beats 3 to 8 at 0.34 to 1.19.
 *   0.42  The twelve diamonds, outermost first, 0.07s apart, in the order the
 *         heads reach them.
 *   1.24  The six category pills, outermost first, ending with the last pair.
 *   1.64  THE TILE IGNITES as the last pair lands: a brightness flash falling
 *         back to rest over 0.75s.
 *
 * Below 900 the stylesheet drops the diamonds and three pills, and `shown()`
 * takes them out of the timeline; the timings are otherwise the same.
 *
 * WHY NOT `draw()` FROM lib/motion.ts. Each path is a whole ellipse about 2100
 * user units across, seen through an 863-wide `overflow: hidden` window, so a
 * full-perimeter sweep spends about four fifths of its duration off-frame.
 * Each path is sampled once for the stretch inside its window (`visibleSpan`)
 * and the whole tween is spent on that.
 *
 * WHY IT DRAWS BACKWARDS. All four files are traversed inward to outward (the
 * halves Figma rotated 180deg mirror the direction too), so a forward draw
 * would start at the tile. Backwards sends the head in from the edge. See
 * `drawArc`.
 *
 * Start states are written with `gsap.set` and everything animates with
 * `.to()`, so the `immediateRender` trap cannot apply. The one `fromTo`, the
 * tile's flash, carries `immediateRender: false` for that reason.
 *
 * Nothing here listens to the pointer.
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
 * found by bisection.
 *
 * `getPointAtLength` is the main cost of building this band, and it runs before
 * the timeline exists while the section is still hidden. Each arc is visible
 * over a contiguous 13 to 20% of its length, so a 48-step walk always lands
 * inside it, and bisecting each crossing costs nine calls: 67 calls a path
 * rather than 221 for a dense scan, and a more accurate boundary.
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
 * `getScreenCTM` (which carries the viewBox scale and every CSS transform
 * above the path, including the `rotate(180deg)` and `rotate(-179.01deg)` that
 * Figma's mirrors are built from, so no mirroring has to be reasoned about
 * here) and tested against the window's own client rect. The two crossings
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
    // A stretch narrower than a coarse step. None of the sixteen arcs is, but
    // returning the whole length instead would spend the tween off-frame.
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
 * With `stroke-dasharray: len` (one value, so the pattern is the whole line on
 * and the whole line off), a `stroke-dashoffset` of `-t` paints exactly the
 * stretch from `t` to the end and nothing before it. Start with `t` at the
 * span's far end and walk it down to the near end, and the line fills in
 * backwards: the head enters at the outer edge and the stroke follows it in.
 * The remainder, `[0, span0]`, is entirely off-frame, so it is completed in one
 * invisible `set` at the end rather than given any of the tween.
 *
 * The spark is the same path again carrying a short dash (`h` on, everything
 * else off), walked on the identical offset, so it sits pinned to the head with
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
 * Sections whose arrival has already been performed in this page's life.
 *
 * `useSectionMotion` rebuilds whenever its effect re-runs. Under StrictMode the
 * first build is reverted before a paint, so rebuilding must stay allowed. But a
 * rebuild also arrives on a hot update to `Fan.loop.ts` (on this component's
 * import path) with the band still on screen, and the entrance would play a
 * second time. Same mechanism as `Familiar.motion.ts`.
 *
 * The mark below is the last thing on the timeline, so only a build that ran to
 * completion sets it. A reverted build never does and the next one plays in
 * full; after a completed one the next build adds no tweens.
 *
 * Keyed on the element, so a new section node performs its arrival properly.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * Only the elements the stylesheet is actually rendering.
 *
 * Below 900 the band hides the twelve diamonds and three of the six pills with
 * `display: none`. A tween on a box that does not exist costs a slot in the
 * stagger and reads as a pause in a sequence meant to be counted. Asking the
 * layout rather than repeating the media query keeps the two in step.
 *
 * `getClientRects()`, not a visibility read: the band is `visibility: hidden`
 * while pending, which is exactly when this runs, and a hidden element still
 * has boxes. A `display: none` one has none.
 */
const shown = (els: HTMLElement[]) => els.filter((e) => e.getClientRects().length > 0);

export function buildFan({ el, q, tl }: SectionMotion) {
  // Already landed once and still on screen: settle, do not re-perform.
  if (LANDED.has(el)) return;

  /* The tile's ignition, read from the document inside the build, since
     `useSectionMotion` re-runs this on a theme change. The light block in
     `Fan.css` does not redefine these, so both themes use the same flash. */
  const igniteFrom = tok('--fan-tile-lit', 'brightness(2.6)');
  const igniteTo = tok('--fan-tile-rest', 'brightness(1)');
  /* Where the pills land. The stylesheet's own resting value, read rather than
     repeated, because light carries the pills a little stronger: dark ink on
     paper is less present per unit alpha than white on black. */
  const pillOp = Number(tok('--fan-pill-op', '0.7')) || 0.7;

  /* The sixteen lines, read out of the inlined SVGs. Each file is four whole
     ellipses in DOM order innermost to outermost, and `Fan.tsx` ships a
     `.fan__spark` twin immediately after each one, hence `:not()` here and
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

  /* 1. THE EIGHT BEATS. Both sides of one half at one depth per beat, upper
     then lower, so eight separate events are read rather than sixteen
     overlapping ones. Left and right share a beat because the band is a
     mirror. */
  arcs.forEach((a) => drawArc(tl, a, (a.depth * 2 + (a.half === 'lower' ? 1 : 0)) * BEAT));

  /* 2. The diamonds, outermost first, coming up roughly with the heads that
     pass them. They are six design pixels across, so the scale is what makes
     them read as arriving. `clearProps` hands the transform back to the
     stylesheet, where their `rotate(135deg)` lives. */
  fromEdges(el, diamonds).forEach((d, i) => {
    tl.to(d, {
      opacity: 1,
      scale: 1,
      duration: 0.28,
      ease: 'power3.out',
      clearProps: 'transform',
    }, DIAMOND_AT + i * DIAMOND_STEP);
  });

  /* 3. The category pills, outermost first, finishing under the last pair of
     arcs, and arriving at the stylesheet's `--fan-pill-op`. */
  fromEdges(el, pills).forEach((p, i) => {
    tl.to(p, {
      opacity: pillOp,
      scale: 1,
      duration: 0.36,
      ease: 'power3.out',
      clearProps: 'transform',
    }, PILLS_AT + i * PILL_STEP);
  });

  /* 4. The copy, out of blur, on the opening beat. The inner spans only: the
     blocks are centred with `translateX(-50%)`, which GSAP would resolve to a
     pixel value for the length of the tween. */
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

  /* 5. THE TILE IGNITES on the last pair of arcs landing: it comes up to size,
     and it flashes. The flash is a `fromTo` with `immediateRender: false`;
     without it the tile would sit at the lit value from build time through
     the whole entrance. */
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
