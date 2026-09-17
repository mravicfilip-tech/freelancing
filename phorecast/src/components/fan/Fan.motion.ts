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
 * THE SEQUENCE (3.35s end to end)
 *   0.00  THE TILE. One object, alone, resolving out of blur as it rises and
 *         grows the last 14% into place. Nothing else has moved yet.
 *   0.30  The mark inside it, a beat behind the glass that holds it.
 *   0.45  THE HEADLINE, rising out of its own mask and sharpening on the way.
 *   0.80  The sub-copy, same treatment, shallower and softer.
 *   1.05  The arcs sweep outward, each half drawn from its own centre-facing
 *         seam while its group drifts the last two dozen design pixels out.
 *   1.55  The twelve diamonds, nearest the middle first.
 *   2.05  The six category pills, also middle outward, last and quickest.
 *
 * Every tween is a `from` — the resting markup is the finished state, so a
 * build that never runs leaves the band simply present. The four arc wipes are
 * the exception and carry `immediateRender: false`: a `fromTo` writes its start
 * values the moment the timeline is BUILT, not when the playhead arrives, so
 * without the flag the arcs would be clipped at build time and the rest of the
 * opening would play against blank margins. The `tl.set` at 0 puts the clip
 * back deliberately, on the timeline, where rewinding can undo it.
 *
 * The blur carries its own lesson, recorded in src/components/hero/entrance.ts
 * and again in Pillars.motion.ts: an element parked at full opacity while still
 * blurred paints a visible smudge of itself before its turn. So opacity is
 * always a second, much shorter tween rather than riding the whole blur
 * duration — the thing is invisible while it is at its softest and has resolved
 * most of its blur by the time it is fully opaque.
 *
 * THE ARCS. `fan-upper.svg` and `fan-lower.svg` are `<img>`, so nothing inside
 * them is addressable and `draw()`/`stroke-dashoffset` are not available. Of
 * the two precedents on the hero slides — slide 3 re-importing the asset `?raw`
 * for per-path access, slide 4 keeping the `<img>` and wiping it with a
 * clip-path — this takes slide 4's. Each of these four images is a 2100 x 1200
 * set of four whole ellipses, of which the band shows a slice about 40% wide
 * through a masked, overflow-hidden 863-wide window; per-path access would buy
 * a dash offset along paths whose start point is far off-screen, while the
 * visible slice runs close enough to horizontal that a horizontal wipe reads as
 * the line extending. Inlining four copies of a file carrying a `filter:` and
 * gradient `<defs>` would also put duplicate ids in the document for no gain.
 * Nothing about the markup changes, and `clearProps` takes the clip off at the
 * end, so the settled render is the one the CSS already produced.
 *
 * Each half's seam is worked out from its own box rather than written down —
 * see `wipeRange`, and the reason there for not wiping the whole image.
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
const DIAMONDS_AT = 1.55;
const PILLS_AT = 2.05;

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
 * The clip range a single arc image is drawn through, as an `inset()` pair.
 *
 * Derived rather than written down, because only ~43% of each 2100px image is
 * ever on screen: the rest hangs outside the 863-wide window its group clips
 * to. A hand-written `inset(0% 100% 0% 0%)` -> `inset(0% 0% 0% 0%)` wipe would
 * therefore spend well over half its duration sweeping across margin nobody can
 * see, which is exactly the "it runs and nothing moves" failure. These two
 * values bracket the visible slice instead, so the whole 1.35s is spent on the
 * part of the arc that is actually painted.
 *
 * `clip-path` applies in the element's own box BEFORE its transform, so the
 * maths is in the image's untransformed layout box: `offsetLeft`/`offsetWidth`
 * against the window's `clientWidth`, both relative to the same offset parent.
 * The only thing the transform contributes is its direction -- two of the four
 * images are Figma mirrors carrying `rotate(180deg)` / `rotate(-179.01deg)`,
 * which reverses local x against window x. The computed matrix's first
 * component is the rotation's cosine, so a negative one is the flip.
 *
 * `centre` names which edge of the window faces the middle of the band: the
 * left group opens from its right edge, the right group from its left. The
 * reveal runs from there outward, so the field spreads from the tile rather
 * than closing in on it.
 */
function wipeRange(group: HTMLElement, half: HTMLElement, centre: 'left' | 'right'): { from: string; to: string } | null {
  const w = half.offsetWidth;
  const c = group.clientWidth;
  if (!w || !c) return null;

  const left = half.offsetLeft;
  const matrix = getComputedStyle(half).transform;
  const flipped = Number(matrix.slice(matrix.indexOf('(') + 1).split(',')[0]) < 0;
  // Window x -> the image's own untransformed x.
  const local = (x: number) => (flipped ? left + w - x : x - left);
  const clamp = (n: number) => Math.min(w, Math.max(0, n));

  const start = clamp(local(centre === 'right' ? c : 0));
  const far = clamp(local(centre === 'right' ? 0 : c));
  // A little past the far end, so the last of the slice is fully uncovered a
  // fraction before the tween lands rather than exactly as it lands.
  const finish = clamp(far + Math.sign(far - start) * w * 0.03);

  const pct = (n: number) => `${((n / w) * 100).toFixed(3)}%`;
  return start < finish
    // Growing with local x: the seam is the image's own left edge.
    ? { from: `inset(0% ${pct(w - start)} 0% 0%)`, to: `inset(0% ${pct(w - finish)} 0% 0%)` }
    // Shrinking: the seam is its right edge.
    : { from: `inset(0% 0% 0% ${pct(start)})`, to: `inset(0% 0% 0% ${pct(finish)})` };
}

export function buildFan({ el, q, tl }: SectionMotion) {
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
      clearProps: 'transform,opacity',
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

  /* 5 — the arcs, sweeping outward from the middle. Each half is drawn with a
     clip wipe from its own centre-facing seam (see the header), and the window
     it lives in drifts the last couple of dozen design pixels outward at the
     same time, so the field reads as spreading rather than switching on. */
  arcGroups.forEach((group, i) => {
    const outward = group.classList.contains('fan__arcs--left') ? 1 : -1;
    tl.from(group, {
      x: 24 * u * outward,
      opacity: 0,
      duration: 1.4,
      ease: EASE,
      clearProps: 'transform,opacity',
    }, ARCS_AT + i * 0.06);

    const halves = [
      group.querySelector<HTMLElement>('.fan__lines--lower'),
      group.querySelector<HTMLElement>('.fan__lines--upper'),
    ];
    halves.forEach((half, j) => {
      if (!half) return;
      const seam = wipeRange(group, half, outward > 0 ? 'right' : 'left');
      if (!seam) return;
      const at = ARCS_AT + i * 0.06 + j * 0.12;
      // Held closed on the timeline rather than by the tween, because the tween
      // below cannot write its own start value at build time — see the header.
      tl.set(half, { clipPath: seam.from }, 0);
      tl.fromTo(half,
        { clipPath: seam.from },
        { clipPath: seam.to, duration: 1.35, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
        at);
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
}
