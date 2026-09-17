/* "Your Funds Stay in Your Control" — the band's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates for
 * effect. The band's own accent is the soft-to-sharp resolve borrowed from the
 * hero's headline, so the tile and the type arrive out of blur rather than
 * simply fading.
 *
 * The section's argument is that the funds are yours, so the logo tile is what
 * the eye lands on and everything else is the field it sits in. The sequence
 * therefore opens on the tile alone, hands the sentence to the headline, and
 * only then spreads the arcs, the diamonds and the category pills outward from
 * the middle — the market arranging itself around the thing at the centre.
 *
 * THE SEQUENCE (3.7s end to end)
 *   0.00  THE TILE. One object, alone, resolving out of blur as it rises and
 *         grows the last 14% into place. Nothing else has moved yet.
 *   0.30  The mark inside it, a beat behind the glass that holds it.
 *   0.45  THE HEADLINE, rising out of its own mask and sharpening on the way.
 *   0.80  The sub-copy, same treatment, shallower and softer.
 *   1.05  The arcs sweep IN from the two edges of the band, sixteen of them,
 *         one every 0.11s, each drawn from its outer end toward the middle
 *         while its fan drifts the last few design pixels inward.
 *   1.90  The twelve diamonds, nearest the middle first.
 *   2.40  The six category pills, also middle outward, last and quickest.
 *
 * Every tween is a `from` — the resting markup is the finished state, so a
 * build that never runs leaves the band simply present. The sixteen arc draws
 * are the exception and carry `immediateRender: false`; the reason is in
 * `drawArc`.
 *
 * The blur carries its own lesson, recorded in src/components/hero/entrance.ts
 * and again in Pillars.motion.ts: an element parked at full opacity while still
 * blurred paints a visible smudge of itself before its turn. So opacity is
 * always a second, much shorter tween rather than riding the whole blur
 * duration — the thing is invisible while it is at its softest and has resolved
 * most of its blur by the time it is fully opaque.
 *
 * THE ARCS. They have to arrive one line at a time, and nothing inside an
 * `<img>` is addressable, so `Fan.tsx` now inlines the two files with Vite's
 * `?raw` and renders them in a span that keeps the box the image had — hero
 * slide 3's route (`SlideBonus.tsx`), rather than slide 4's clip-path wipe,
 * which can only ever move a whole fan at once. Both files are used twice, so
 * each copy's ids are suffixed; see `withIds` there.
 *
 * That buys the sixteen `<path>` elements, and with them a real
 * `stroke-dashoffset` draw. `draw()` in lib/motion.ts is not usable as-is: it
 * runs the offset over a path's whole length, and these paths are whole
 * ellipses about 2100 units across of which the band shows one arc through an
 * 863-wide window, so most of such a draw would happen off screen. `visibleRun`
 * below finds the stretch that is actually on screen and `drawArc` confines the
 * dash to it.
 *
 * No hover, no pointer tracking, nothing here listens to the mouse.
 */
import { EASE, intoLines } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/* Beat marks, in seconds. */
const TILE_AT = 0;
const MARK_AT = 0.3;
const TITLE_AT = 0.45;
const SUB_AT = 0.8;
const ARCS_AT = 1.05;
const DIAMONDS_AT = 1.9;
const PILLS_AT = 2.4;
/** One arc after the next, and the gap between a fan's lower half and its upper. */
const ARC_STEP = 0.11;
const HALF_STEP = 0.14;
const ARC_DRAW = 1.2;

/** The design frame the CSS lays this band out in; `--f` is one of its pixels. */
const ARCS_DESIGN_W = 863;

/**
 * Rise out of blur: the travel and the softening on one tween, the opacity on
 * its own much shorter one starting at the same moment. See the note above —
 * this pairing is the whole reason the blur does not smear.
 */
function outOfBlur(
  tl: Timeline,
  targets: gsap.TweenTarget,
  at: number,
  vars: { y?: number; scale?: number; blur?: number; duration?: number; stagger?: number | object; fade?: number },
) {
  const { y = 12, scale, blur = 8, duration = 0.9, stagger = 0, fade = 0.35 } = vars;
  const from: gsap.TweenVars = {
    y,
    filter: `blur(${blur}px)`,
    duration,
    stagger,
    ease: EASE,
    clearProps: 'transform,transformOrigin,filter',
  };
  if (scale !== undefined) {
    from.scale = scale;
    from.transformOrigin = '50% 50%';
  }
  tl.from(targets, from, at);
  tl.from(targets, { opacity: 0, duration: fade, stagger, ease: 'none', clearProps: 'opacity' }, at);
}

/**
 * Order elements by how far their middle sits from the band's, nearest first,
 * so a stagger runs outward from the centre in both directions at once. Read
 * off live rects rather than the authored design coordinates, so it stays right
 * at the narrow breakpoint, where the two arc groups move but the pills do not.
 */
function fromCentre(section: HTMLElement, els: HTMLElement[]): HTMLElement[] {
  const box = section.getBoundingClientRect();
  const mid = box.left + box.width / 2;
  return [...els].sort((a, b) => {
    const da = Math.abs(a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2 - mid);
    const db = Math.abs(b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2 - mid);
    return da - db;
  });
}

/**
 * The stretch of one arc that the band actually shows, as a pair of lengths
 * along the path, plus which of the two ends faces the outside of the section.
 *
 * Each of these files is four whole ellipses about 2100 user units across; the
 * band shows a slice of them through an 863-wide `overflow: hidden` window, and
 * the visible slice is a different arc of each ellipse. A dash offset run over
 * the whole perimeter would therefore spend most of its duration drawing off
 * screen, which is exactly the "it runs and nothing moves" failure. So the path
 * is sampled, the run of samples that land inside the window is found, and the
 * draw is confined to it.
 *
 * `getScreenCTM` carries the viewBox scale and every CSS transform above the
 * path -- two of the four spans are Figma mirrors on `rotate(180deg)` and
 * `rotate(-179.01deg)` -- so the sampled points are in the same client
 * coordinates as the window's own rect and no mirroring has to be reasoned
 * about here.
 */
interface Visible { a: number; b: number; outer: 'a' | 'b'; len: number }

/** Samples per path. 240 over ~5000 units is a point every 20 or so. */
const SAMPLES = 240;

function visibleRun(path: SVGPathElement, win: DOMRect, mid: number): Visible | null {
  const len = path.getTotalLength();
  const ctm = path.getScreenCTM();
  if (!len || !ctm) return null;

  const pts: Array<{ l: number; x: number; in: boolean }> = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const l = (len * i) / SAMPLES;
    const p = path.getPointAtLength(l);
    const x = p.x * ctm.a + p.y * ctm.c + ctm.e;
    const y = p.x * ctm.b + p.y * ctm.d + ctm.f;
    pts.push({ l, x, in: x >= win.left && x <= win.right && y >= win.top && y <= win.bottom });
  }

  // The longest unbroken run of visible samples. Taken as a run rather than
  // just the first and last hit, because an ellipse can clip the window twice.
  let best: { from: number; to: number } | null = null;
  let run: { from: number; to: number } | null = null;
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].in) run = run ? { from: run.from, to: i } : { from: i, to: i };
    else {
      if (run && (!best || run.to - run.from > best.to - best.from)) best = run;
      run = null;
    }
  }
  if (run && (!best || run.to - run.from > best.to - best.from)) best = run;
  if (!best || best.to === best.from) return null;

  // One sample either side, so the draw starts and ends just outside the window
  // rather than popping into existence on its edge.
  const lo = Math.max(0, best.from - 1);
  const hi = Math.min(pts.length - 1, best.to + 1);
  // Whichever end sits further from the middle of the band is the outer one.
  const outer = Math.abs(pts[lo].x - mid) >= Math.abs(pts[hi].x - mid) ? 'a' : 'b';
  return { a: pts[lo].l, b: pts[hi].l, len, outer };
}

/**
 * Draw one arc inward from the edge of the band.
 *
 * `stroke-dasharray: <d> <len>` with `stroke-dashoffset: -<s>` paints exactly
 * the stretch from `s` to `s + d` and nothing else, the gap being long enough
 * that the pattern never repeats. Growing `d` from zero is the draw; which end
 * it grows from is whether `s` is held still or walked back with it.
 *
 * `immediateRender: false`, because a `fromTo` writes its start values the
 * moment the timeline is BUILT rather than when the playhead arrives -- without
 * it every arc would be dashed to nothing at build time, which is right, and
 * then *un*-dashed by the next tween built after it, which is not. The `set` at
 * 0 is what holds them closed, on the timeline, where a rewind can undo it.
 */
function drawArc(tl: Timeline, path: SVGPathElement, v: Visible, at: number, duration: number) {
  const span = v.b - v.a;
  const closed = { strokeDasharray: `0px ${v.len}px`, strokeDashoffset: `${-(v.outer === 'a' ? v.a : v.b)}px` };
  const open = {
    strokeDasharray: `${span}px ${v.len}px`,
    // Drawing from `b` walks the dash's start back to `a`; drawing from `a`
    // leaves it where it is and only the length grows.
    strokeDashoffset: `${-v.a}px`,
    duration,
    ease: 'power2.inOut',
    clearProps: 'strokeDasharray,strokeDashoffset',
    immediateRender: false,
  };
  tl.set(path, closed, 0);
  tl.fromTo(path, closed, open, at);
}

/**
 * Sections whose arrival has already been performed, start to finish, in this
 * page's life.
 *
 * `useSectionMotion` rebuilds whenever its effect re-runs, and that is right:
 * React mounts, tears down and mounts again inside a single frame, and the
 * first build is reverted before a paint, so refusing to rebuild would leave
 * the band settled and silent. But a rebuild also arrives when vite hot-updates
 * this component, and `Fan.tsx` imports `Fan.loop.ts` for the `idle` option --
 * which puts the loop on this component's import path, so saving that file
 * remounts this section on the same node with the band still on screen, the
 * observer fires at once and the entrance performs itself a second time in
 * front of someone who has already watched it. That is the fault diagnosed and
 * fixed on the familiar section (`Familiar.motion.ts`); the guard is the same.
 *
 * The two cases are told apart by whether the previous timeline actually
 * reached its end. The mark below is the last thing on the timeline, so a build
 * reverted mid-flight -- StrictMode's, always -- never sets it and the next
 * build plays in full. One that ran to completion does, and the next build adds
 * no tweens at all: the hook reveals the section, the empty timeline completes
 * on the next tick, and the loop is handed the band exactly as it would have
 * been.
 *
 * Keyed on the element, so a genuinely new section node performs its arrival
 * properly. Editing this file resets the set with the module, which is what you
 * want while working on the motion itself.
 */
const LANDED = new WeakSet<HTMLElement>();

export function buildFan({ el, q, tl }: SectionMotion) {
  // Already landed once and still on screen: settle, do not re-perform.
  if (LANDED.has(el)) return;

  // One design pixel as the band is currently drawn. `--f` is a `calc()` on a
  // container query unit, which `getComputedStyle` hands back unresolved, so it
  // is read off the thing whose design width is known and the same at both
  // breakpoints: an arc window is 863 design px wide.
  const arcGroups = q('.fan__arcs');
  const u = arcGroups.length
    ? (arcGroups[0].getBoundingClientRect().width || ARCS_DESIGN_W) / ARCS_DESIGN_W
    : 1;

  const tile = q('.fan__tile')[0];
  const mark = q('.fan__glass img')[0];
  const title = q('.fan__title')[0];
  const sub = q('.fan__sub')[0];

  /* 1 — the tile. The one object the band opens with, and the only thing
     moving for the first half second. It grows the last sixth of the way in
     rather than popping: the house forbids the overshoot, and a 100px plate
     that overshot would read as a button anyway. */
  if (tile) {
    outOfBlur(tl, tile, TILE_AT, { y: 20 * u, scale: 0.86, blur: 14, duration: 1.15, fade: 0.34 });
  }

  /* 2 — the mark inside the glass, a beat behind the plate that carries it, so
     the tile reads as filling rather than arriving whole. The glass itself is
     left alone: it is centred with `translate(-50%, -50%)`, and GSAP would
     rewrite that transform in resolved pixels for the length of the tween. */
  if (mark) {
    tl.from(mark, {
      scale: 0.6,
      opacity: 0,
      transformOrigin: '50% 50%',
      duration: 0.7,
      ease: EASE,
      clearProps: 'transform,transformOrigin,opacity',
    }, MARK_AT);
  }

  /* 3 — the headline, rising out of its own mask and sharpening on the way.
     The largest single movement in the band and the thing the eye should land
     on after the tile.

     The mask spans, not the heading itself: `.fan__title` is centred with
     `translateX(-50%)` and animating it directly would hand that centring to
     GSAP as a pixel value for the length of the tween. `intoLines` is
     idempotent, so a StrictMode remount reuses the spans already there. */
  if (title) {
    const lines = intoLines(title);
    tl.from(lines, {
      yPercent: 108,
      filter: 'blur(10px)',
      duration: 1.15,
      ease: 'power4.out',
      clearProps: 'transform,filter',
    }, TITLE_AT);
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none', clearProps: 'opacity' }, TITLE_AT);
  }

  /* 4 — the sub-copy. Same treatment, shallower and softer: it is set much
     smaller, so the headline's 10px of blur would wash it out entirely. */
  if (sub) {
    const lines = intoLines(sub);
    tl.from(lines, {
      yPercent: 106,
      filter: 'blur(6px)',
      duration: 0.9,
      ease: 'power4.out',
      clearProps: 'transform,filter',
    }, SUB_AT);
    tl.from(lines, { opacity: 0, duration: 0.28, ease: 'none', clearProps: 'opacity' }, SUB_AT);
  }

  /* 5 — the arcs, sweeping IN from the sides. Each of the sixteen ellipses is
     drawn on its own, from the end of it nearest the edge of the band toward
     the middle, one after the next, so the fans arrive line by line rather than
     as two blocks. The window each fan lives in drifts the last few design
     pixels inward at the same time, so the whole side settles toward the tile
     the arcs are converging on. */
  const band = el.getBoundingClientRect();
  const mid = band.left + band.width / 2;

  arcGroups.forEach((group) => {
    // The two sides run together, mirrored -- the band is symmetrical and
    // opening one side before the other would tip it.
    const inward = group.classList.contains('fan__arcs--left') ? -1 : 1;
    tl.from(group, {
      x: 18 * u * inward,
      opacity: 0,
      duration: 1.5,
      ease: EASE,
      clearProps: 'transform,opacity',
    }, ARCS_AT);

    const win = group.getBoundingClientRect();
    // Lower fan first, upper a beat behind it: they meet at the band's waist,
    // so starting them together would read as one thick line rather than two.
    const halves = [
      group.querySelector<HTMLElement>('.fan__lines--lower'),
      group.querySelector<HTMLElement>('.fan__lines--upper'),
    ];
    halves.forEach((half, j) => {
      if (!half) return;
      const paths = Array.from(half.querySelectorAll<SVGPathElement>('path'));
      paths.forEach((path, k) => {
        const v = visibleRun(path, win, mid);
        if (!v) return;
        drawArc(tl, path, v, ARCS_AT + j * HALF_STEP + k * ARC_STEP, ARC_DRAW);
      });
    });
  });

  /* 6 — the diamonds, nearest the middle first. Six design pixels across, so
     they need real travel of their own to be seen arriving at all; the scale is
     there to make them read as settling, not to overshoot. */
  const diamonds = fromCentre(el, q('.fan__diamond'));
  if (diamonds.length) {
    tl.from(diamonds, {
      y: 16 * u,
      scale: 0.45,
      duration: 0.8,
      stagger: 0.045,
      ease: EASE,
      clearProps: 'transform',
    }, DIAMONDS_AT);
    tl.from(diamonds, { opacity: 0, duration: 0.3, stagger: 0.045, ease: 'none', clearProps: 'opacity' }, DIAMONDS_AT);
  }

  /* 7 — the category pills, last and quickest, also middle outward. They are
     the labels on the field, not a fourth statement, so they arrive after
     everything they label. Their resting opacity is 0.7, which `clearProps`
     inside `outOfBlur` hands back to CSS. */
  const pills = fromCentre(el, q('.fan__pill'));
  if (pills.length) {
    outOfBlur(tl, pills, PILLS_AT, { y: 18 * u, blur: 6, duration: 0.85, stagger: 0.09, fade: 0.32 });
  }

  // Last on the timeline, so it is only reached if the arrival was actually
  // performed. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
