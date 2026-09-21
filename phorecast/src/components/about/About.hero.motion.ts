/* One band of the About page, in its own file.
 *
 * The six entrances were written as one module. They are split per band so
 * that several people can work on the page at once without editing the same
 * file, which is the only reason -- the house language, the phone split and
 * the shared helpers all still live in About.motion.ts, which every one of
 * these imports from.
 *
 * WHAT THIS BAND IS. `.ab-ground` -- the frame's own 1154 light field, five
 * ellipses in one inline SVG under five gaussian filters at sigma 33.2284 --
 * and over it the headline, the lede and Get Started. There is no eyebrow
 * here, so the ground is what names the band: it is the first thing the page
 * shows and the only thing that speaks before the headline.
 *
 * NO LOOP, and nothing on this band could carry one. The rule is that a loop
 * has to be something genuinely doing its job over time; a light field and a
 * sentence are not that. (Nor is there anything else here to loop: there are
 * no sparkles, marks or figures over the ground -- `.ab-ground` is the clip,
 * the -90deg spin and the one <svg>, and that is all of it.)
 */

import { gsap } from 'gsap';
import { EASE, all, pop } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

/**
 * THE COST OF THIS BAND IS ONE PROPERTY, and it was worth measuring before
 * writing a single new tween. The ground is 1154 design px of inline SVG
 * under five real gaussian filters; at 1600 that is an 881 x 1355 drawing.
 *
 * Measured at 1600, dark, three runs each, frames sampled over the 2.5s from
 * the moment the section reveals (median):
 *
 *   no ground tween at all .................. 55.1 fps,  3 long frames
 *   opacity only ............................ 56.0 fps,  4
 *   opacity + translateY .................... 54.7 fps,  3
 *   opacity + scale (what shipped) .......... 32.2 fps, 19   <-- the whole band
 *   opacity + scale + will-change: transform  54.7 fps,  4
 *
 * So OPACITY AND TRANSLATE ARE FREE AND SCALE IS NOT, and the reason is that
 * a scale changes the layer's raster scale: Chromium re-runs five gaussian
 * blurs over the whole field on every frame of a 1.4s tween. The fix is not
 * to drop the beat, it is to tell the compositor the transform is coming so
 * it rasterises once and animates the finished texture. GSAP's own force3D
 * does not do this -- it adds translateZ(0), which promotes the layer but
 * says nothing about the scale changing, and the measurement above is WITH
 * that already applied.
 *
 * It is set through gsap.set rather than in About.hero.css on purpose: this
 * is a full-bleed filtered layer, a permanent `will-change` keeps it in GPU
 * memory for the life of the page, and the tween is 1.4s long. gsap.set
 * inside the section's context is also reverted for free on teardown, so a
 * theme switch or a StrictMode remount cannot strand the promotion.
 *
 * AND IT IS scaleY, NOT scale, WHICH IS A CORRECTNESS FIX AND NOT A TASTE
 * ONE. `.ab-ground` is `left: 0; right: 0` -- exactly as wide as the
 * document -- so a uniform 1.05 about a horizontal centre hangs 2.5% of the
 * viewport off EACH edge and the document's scrollWidth grows by 5% of its
 * own width for the length of the tween. Measured per frame at scroll top:
 * 40px at 1600, 9.75 at 390, 9 at 360, from the frame the section mounts
 * until the tween resolves, at every width and in both themes; with the
 * scale removed it is zero on every frame of four seconds. `body` carries
 * `overflow-x: hidden`, which propagates to the viewport and is why no
 * scrollbar was ever drawn -- but a page that reports a wider document than
 * it has is one stylesheet change away from drawing one, and the About page
 * is clean at every width otherwise.
 *
 * Nothing is lost by dropping the horizontal half. The beat is "the ember
 * grows up out of the page", the origin is the bottom edge, and 2.5% of
 * horizontal travel on a field whose every shape is a sigma-33 gaussian is
 * not a thing anyone can see. The vertical half is the whole of it, and it
 * cannot overflow: the growth is upward from the bottom edge, and a document
 * does not scroll into the space above its own top.
 */
const GROUND = { opacity: 0, scaleY: 1.05, duration: 1.4, ease: 'power2.out' } as const;

/* Up to this many visual lines get their own mask; past it the headline is
 * revealed as one. Three, because that is where the phone starts: the title
 * wraps to 2 lines at 1600 and 1100, 3 at 720 and 560, and 5 at 390 and 6 at
 * 360. Five or six masks is not the same sequence tighter, it is a different
 * sequence -- six staggered reveals on a 360 screen is the entrance standing
 * in front of the copy, which is the one thing the page's gate was re-cut to
 * stop. So a phone keeps the single mask that ships today. */
const MAX_LINES = 3;

/**
 * The headline's own sentence, parked on the element while its masks exist.
 *
 * ON THE ELEMENT AND NOT IN A MODULE-SCOPE MAP, which was worth one bug. A
 * WeakMap keyed on the <h1> is lost the moment this module is re-evaluated --
 * a hot reload, which on a page four people are editing at once happens
 * constantly -- and the rebuilt effect then reads its "original" back out of
 * an element that is already split into masks. The sentence comes back one
 * character short, because the space the browser broke at is not in any of
 * them, and it stays short. Caught once at 720 in a ten-load sweep, which is
 * exactly the frequency that gets a fault like this shipped.
 *
 * `unmask` removes the attribute with the masks, so the settled DOM carries
 * nothing that About.tsx did not render.
 */
const HELD = 'abText';

/**
 * Where the browser actually broke the line, character by character.
 *
 * `intoLines` in the shared layer splits on `\n`, which is right for a
 * headline that states its own breaks. This one does not: it is a single
 * sentence that wraps differently at every width, and hard-coding a break in
 * About.tsx would put it in the wrong place at five of the six widths this
 * page is swept at. So the breaks are read back out of layout -- a Range over
 * the text node, one character at a time, cut wherever the client rect's top
 * moves to a new line box.
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
 * Put the headline back the way About.tsx rendered it, once it has landed.
 *
 * TWO REASONS, and the first is the one that matters. The fonts are declared
 * `font-display: swap` and this entrance is `immediate: true`, so the split is
 * measured in a layout effect that can easily run before Manrope has arrived
 * -- the breaks would then be the fallback's, and a swap afterwards would
 * re-wrap text that is now hard-split into fixed spans. Restoring the text
 * node makes that self-healing: the worst case is a reveal staggered at
 * slightly different break points, and a second later the headline is wrapping
 * natively again. The second reason is resize, which has the same shape.
 *
 * Nothing shifts when it runs: each mask is a block box of one line at the
 * element's own line-height, with the descender padding cancelled by an equal
 * negative margin, so N masks and N wrapped lines are the same height.
 */
function unmask(el: HTMLElement) {
  const text = el.dataset[HELD];
  if (text && el.firstElementChild) el.textContent = text;
  delete el.dataset[HELD];
}

/**
 * 0.00  THE GROUND. The frame's light field, opacity and height together
 *       from the bottom of its own box, 1.4s -- slow, because it is a light
 *       coming up and not an element arriving, and because everything else
 *       in the band plays over it.
 *
 *       ONE OBJECT, and the five ellipses are deliberately not given any
 *       independence of their own. Two reasons, one of them measured. They
 *       are a single composition -- Figma's "Circle" group, rotated a quarter
 *       turn as a unit -- and at sigma 33 they overlap into one continuous
 *       field with no visible seam between them, so a stagger across five
 *       shapes a reader cannot separate is a field that brightens unevenly
 *       for no legible reason. And it is the single most expensive thing this
 *       band could do: staggering opacity across the five <g filter> groups
 *       measured 35.3 fps and 19 long frames at 1600 against 54.7 for the
 *       field as one object, because a change inside the layer repaints all
 *       five blurs every frame and throws away exactly what the promotion
 *       above buys. The landing hero does stagger its five glows -- but those
 *       are five separately-positioned `border-radius: 50%` divs under a CSS
 *       blur, which is a different object at a different price.
 *
 * 0.10  The nav, left to right. Furniture: it arrives quickly and quietly and
 *       is finished before the headline starts.
 * 0.30  THE HEADLINE, one mask per line, rising and sharpening on the way. It
 *       is the largest type on the page and the thing a reader came for, so
 *       it is the accent and it has the frame to itself for 0.65s.
 * 0.95  The lede, out of blur -- the page's own accent, and the treatment
 *       every other band on it uses for supporting copy.
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

  /* EXPLICITLY fromTo, NEVER `rise`, and this is not a style preference --
   * it was measured on this band. Two of the five nav items are `.btn`, which
   * carries `transition: ... transform 160ms ease` in global.css so its
   * `:active` press can ease. A `from` tween reads its END value off the
   * element, and writing the start value hands that transition a target, so
   * by the time the staggered sub-tweens took their reading the two buttons
   * had already transitioned to +8 -- and GSAP built them to animate 8 to 8.
   * Sampled at 1600 with the shipped code: the four nav links were home at
   * t=661ms while Login and Sign Up sat 8px low and motionless until 1216ms,
   * then slid home at 1467ms on the CSS transition alone once `clearProps`
   * dropped the inline transform. The nav's whole point is one clean sweep
   * left to right, and half of it was landing after the headline. Stating
   * both ends cannot be poisoned by a transition in flight. This is the same
   * fault entrance.ts records against the landing nav and lib/motion.ts's
   * pop() docstring records against the landing hero's Get Started button. */
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
    // A previous build may have left its masks behind -- a StrictMode remount
    // or a theme switch reverts the tweens, not the DOM -- so always measure a
    // plain text node, never whatever is currently in the element.
    if (title.firstElementChild) title.textContent = text;

    const found = visualLines(title, text);
    const parts = found.length >= 2 && found.length <= MAX_LINES ? found : [text];
    const lines = mask(title, parts);

    /* The mask reveal, which is the landing hero's treatment for the same
     * element and the one beat on this page that must not drop frames: half-
     * formed type reads as a fault. The opacity is a second, much shorter
     * tween rather than part of the first, for the reason recorded in
     * About.motion.ts's outOfBlur and in entrance.ts before it -- a blur
     * bleeds past its mask, so a line parked below the clip at full opacity
     * leaks a grey smudge of itself into the hero before its turn. */
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

  /* `pop`, not `rise`, and for both of the reasons this file already has.
   * It is a `.btn` with the same transform transition the nav buttons have,
   * and pop() is a fromTo -- lib/motion.ts's docstring for it is about this
   * exact element on the landing page. And it is the landing hero's own
   * ending for its own Get Started: the same 0.94 with the house ease rather
   * than pop's default back.out, because nothing on either page overshoots. */
  const cta = q('.ab-hero__cta');
  if (cta.length) {
    // `clearProps` overrides pop()'s own, which lists transform and opacity but
    // not the origin it writes alongside them -- an inert declaration, but an
    // inline one left on a button that otherwise belongs entirely to CSS.
    pop(tl, cta, cue(1.15), {
      scale: 0.94,
      duration: 0.55,
      ease: EASE,
      clearProps: 'transform,transformOrigin,opacity',
    });
  }
}
