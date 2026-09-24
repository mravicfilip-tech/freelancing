/* Entrance for the About hero.
 *
 * The page's entrances are split one file per band. The shared schedule and
 * helpers live in About.motion.ts.
 *
 * The band is `.ab-ground` (Figma 531:149: five ellipses in one inline SVG
 * under five gaussian filters at sigma 33.2284) with the headline, lede and
 * Get Started over it. There is no eyebrow, so the ground opens the band.
 * No loop: a light field and a sentence have nothing to do over time.
 */

import { gsap } from 'gsap';
import { EASE, all, pop } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

/**
 * The ground's opening tween: opacity plus a vertical scale from the bottom.
 *
 * SCALE NEEDS `will-change: transform`. Opacity and translate are cheap, but a
 * scale changes the layer's raster scale, so without the hint Chromium re-runs
 * all five gaussian blurs every frame of the 1.4s tween (roughly halving the
 * frame rate at 1600). GSAP's force3D promotes the layer but does not prevent
 * this. The hint is applied with `gsap.set` rather than in About.hero.css so
 * it only lives for the tween and is reverted on teardown (theme switch,
 * StrictMode remount).
 *
 * scaleY, NOT scale. `.ab-ground` is exactly as wide as the document, so a
 * uniform scale overhangs both edges and widens the document's scrollWidth
 * for the length of the tween. `body { overflow-x: hidden }` hides that, but
 * it should not rely on it. Growth upward from the bottom edge cannot
 * overflow, and the horizontal half of a scale on a sigma-33 blur is not
 * visible anyway.
 */
const GROUND = { opacity: 0, scaleY: 1.05, duration: 1.4, ease: 'power2.out' } as const;

/* Up to this many visual lines get their own mask; past that the headline is
 * revealed as one. The title wraps to 2 or 3 lines down to 560 and to 5 or 6
 * on a phone, where six staggered reveals would hold the copy back too long.
 * So phones get the single mask. */
const MAX_LINES = 3;

/**
 * The headline's original sentence, stored on the element while its masks
 * exist.
 *
 * On the element, not in a module-scope map: a hot reload re-evaluates the
 * module and loses the map, and the rebuilt effect would then read its
 * "original" out of an already split element, one character short (the space
 * at each wrap is in no mask).
 *
 * `unmask` removes the attribute, so the settled DOM matches About.tsx.
 */
const HELD = 'abText';

/**
 * Where the browser actually broke the line, character by character.
 *
 * `intoLines` in the shared layer splits on `\n`. This headline is one
 * sentence that wraps differently at every width, so the breaks are read
 * from layout instead: a Range over the text node, one character at a time,
 * cut wherever the rect's top moves to a new line box.
 */
function visualLines(el: HTMLElement, text: string): string[] {
  const node = el.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return [text];

  const range = document.createRange();
  const cuts: number[] = [];
  let top: number | null = null;

  for (let i = 0; i < text.length; i += 1) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getBoundingClientRect();
    // A space collapsed at a wrap has no box; it belongs to neither line and
    // asking it which one it is on gives the wrong answer.
    if (!r.width && !r.height) continue;
    if (top === null) top = r.top;
    else if (r.top - top > 1) { cuts.push(i); top = r.top; }
  }

  const parts: string[] = [];
  let from = 0;
  for (const cut of [...cuts, text.length]) {
    const part = text.slice(from, cut).trim();
    if (part) parts.push(part);
    from = cut;
  }
  return parts.length ? parts : [text];
}

/** Rebuild the element as one mask per part, in the shared layer's own markup
 *  so About.css's `.ab-hero__title .line` rules and the pending-state hide
 *  apply to these exactly as they do to `intoLines`'s. */
function mask(el: HTMLElement, parts: string[]): HTMLElement[] {
  el.textContent = '';
  for (const part of parts) {
    const inner = document.createElement('span');
    inner.className = 'line__in';
    inner.textContent = part;
    const line = document.createElement('span');
    line.className = 'line';
    line.appendChild(inner);
    el.appendChild(line);
  }
  return all(el, '.line__in');
}

/**
 * Put the headline back as a plain text node once it has landed.
 *
 * The fonts use `font-display: swap` and this entrance is `immediate`, so the
 * split can be measured before Manrope arrives; a later swap would re-wrap
 * text that is hard-split into spans. Restoring the text node lets it wrap
 * natively again, and the same applies after a resize.
 *
 * Nothing shifts: each mask is one line at the element's line-height, with
 * its descender padding cancelled by an equal negative margin.
 */
function unmask(el: HTMLElement) {
  const text = el.dataset[HELD];
  if (text && el.firstElementChild) el.textContent = text;
  delete el.dataset[HELD];
}

/**
 * 0.00  THE GROUND: opacity and height together from the bottom of its box,
 *       1.4s. Slow, because it is light coming up and everything else plays
 *       over it. It moves as ONE object: the five ellipses blend into one
 *       field, and animating them separately would repaint all five blurs
 *       every frame and undo the promotion above.
 * 0.10  The nav, left to right, finished before the headline starts.
 * 0.30  THE HEADLINE, one mask per line, rising and sharpening. It holds the
 *       frame alone for 0.65s.
 * 0.95  The lede, out of blur.
 * 1.15  Get Started, last, so the eye ends on the thing to press.
 */
export function buildAboutHero({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();
  const ground = q('.ab-ground')[0];
  const title = q('.ab-hero__title')[0];

  if (ground) {
    gsap.set(ground, { willChange: 'transform' });
    tl.from(ground, {
      ...GROUND,
      transformOrigin: '50% 100%',
      clearProps: 'transform,transformOrigin,opacity,willChange',
    }, 0);
  }

  /* fromTo, NEVER `rise`. Login and Sign Up are `.btn`, which carries a CSS
   * `transform` transition (global.css). A `from` tween reads its end value
   * off the element after writing the start value, so the transition is
   * already in flight and GSAP builds an 8px-to-8px tween; the buttons then
   * land late on the CSS transition alone. Stating both ends avoids it. The
   * `pop()` docstring in src/lib/motion.ts records a related fault. */
  const nav = q('.nav .logo, .nav__links > *, .nav__actions > *, .nav__burger');
  if (nav.length) {
    tl.fromTo(nav,
      { y: 8, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: step(0.05),
        ease: EASE,
        clearProps: 'transform,opacity',
      }, cue(0.1));
  }

  if (title) {
    const text = title.dataset[HELD] ?? title.textContent ?? '';
    title.dataset[HELD] = text;
    // A previous build may have left its masks behind (a StrictMode remount
    // or theme switch reverts the tweens, not the DOM), so always measure a
    // plain text node.
    if (title.firstElementChild) title.textContent = text;

    const found = visualLines(title, text);
    const parts = found.length >= 2 && found.length <= MAX_LINES ? found : [text];
    const lines = mask(title, parts);

    /* The mask reveal, the landing hero's treatment for the same element.
     * Opacity is a second, shorter tween because a blur bleeds past its mask:
     * a line parked below the clip at full opacity would leak a grey smudge
     * before its turn (see outOfBlur in About.motion.ts). */
    const dur = 1.05;
    const gap = step(0.13);
    tl.from(lines, {
      yPercent: 108,
      filter: 'blur(10px)',
      duration: dur,
      stagger: gap,
      ease: 'power4.out',
      clearProps: 'transform,filter',
    }, cue(0.3));
    tl.from(lines, {
      opacity: 0,
      duration: 0.3,
      stagger: gap,
      ease: 'none',
      clearProps: 'opacity',
    }, cue(0.3));

    tl.call(unmask, [title], cue(0.3) + dur + (lines.length - 1) * gap + 0.05);
  }

  outOfBlur(tl, q('.ab-hero__lede'), cue(0.95), { y: 14, blur: 6, duration: 0.8, fade: 0.32 });

  /* `pop`, not `rise`: it is a `.btn` with the same transform transition as
   * the nav buttons, and pop() is a fromTo. It matches the landing hero's Get
   * Started: 0.94 with the house ease rather than pop's default back.out,
   * because nothing on either page overshoots. */
  const cta = q('.ab-hero__cta');
  if (cta.length) {
    // `clearProps` overrides pop()'s own, which omits the transformOrigin it
    // writes, so no inline style is left on the button.
    pop(tl, cta, cue(1.15), {
      scale: 0.94,
      duration: 0.55,
      ease: EASE,
      clearProps: 'transform,transformOrigin,opacity',
    });
  }
}
