/* Entrance for the ABOUT PHORCAST band.
 *
 * The page's entrances are split one file per band. The shared schedule and
 * helpers live in About.motion.ts.
 *
 * ORDER. The card arrives as a plate, then the product shot alone, then the
 * mark and the two paragraphs as one tight stagger in DOM order. The shot
 * leads because it is the band's subject; the mark (about 30px at 1600) is
 * too small to hold the frame on its own, so it opens the caption instead.
 *
 * THE SHOT IS ONE OBJECT. `.ab-brand__visual` holds a single exported image
 * of Figma node 531:233, and the tween targets the layer itself.
 *   - Transform and opacity only, so the compositor can move the rasterised
 *     layer. No `filter: blur()`: it would re-rasterise a large bitmap every
 *     frame and stretch the entrance under lag smoothing (src/lib/motion.ts).
 *   - The dark theme puts a `mask-image` on this element above 1100px to fade
 *     its left edge (the light theme insets the box instead and has no mask).
 *     Targeting the masked element makes the fade travel with it. Never tween
 *     `clip-path` (it is applied before the mask and would cut a hard edge
 *     through the fade) and never write `mask` inline (`clearProps` would take
 *     the stylesheet's mask with it). Opacity is safe.
 *
 * AXIS. Above 1100 the shot bleeds off the card's right edge, so it slides in
 * from the right. At 1100 and below About.css stacks the card and the shot
 * sits under the copy, so the same beat becomes a rise. The media query is
 * read per build (see `schedule()` in About.motion.ts for why).
 *
 * THE PARAGRAPHS ARE NOT SPLIT INTO LINES. `intoLines` rebuilds an element
 * from its `textContent`, which would drop the `<strong>Phorcast</strong>` in
 * the first paragraph and weld the second paragraph across its `<br />`.
 * They rise as two objects, with no blur: at 18px a blur reads as a smudge.
 *
 * No loop, no hover, no colour. The module tweens x, y, opacity and (on the
 * card only) blur, and reads no resting colour, so it behaves the same in
 * both themes (src/lib/theme.ts explains the hazard it avoids).
 */

import { rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

/** The plate, arriving the way the CHOOSE and COMPARE cards do. */
const PLATE_AT = 0.22;
/** THE PRODUCT SHOT, alone. */
const SHOT_AT = 0.58;
/** The caption. The 0.78s gap is the time the shot holds the frame alone. */
const CAPTION_AT = 1.36;
/** Inside the caption: mark, first paragraph, second paragraph. */
const CAPTION_STEP = 0.1;

/** The shot's travel. 52 across when it bleeds off the card's right edge, 22
 *  up when it is the card's bottom half instead. */
const SHOT_X = 52;
const SHOT_Y = 22;
const SHOT_DUR = 1;

/** Where About.css stops putting the copy and the shot on one row. */
const STACKED = '(max-width: 1100px)';

/* Read per build, not at module scope; see the header. */
function stacked() {
  return typeof matchMedia !== 'undefined' && matchMedia(STACKED).matches;
}

/**
 * 0.00  The band names itself.
 * 0.22  The card, out of blur. A plate with the frame's own field on it and
 *       nothing else yet.
 * 0.58  THE PRODUCT SHOT, alone, as one object: in from the card's right edge
 *       where it bleeds off it, or up from under the copy where the card has
 *       stacked. It has the frame to itself for 0.78s.
 * 1.36  The caption, 0.1s apart, in DOM order:
 *         1.36  the mark
 *         1.46  "Phorcast is a prediction market platform..."
 *         1.56  "Every contract is simple..."
 */
export function buildBrand({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();
  const flat = stacked();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });

  outOfBlur(tl, q('.ab-brand__card'), cue(PLATE_AT), { y: 20, blur: 9, duration: 0.95, fade: 0.4 });

  // One target: the element the dark-theme mask is on. Transform and opacity
  // only; see the header.
  const shot = q('.ab-brand__visual');
  if (shot.length) {
    rise(tl, shot, cue(SHOT_AT), {
      x: flat ? 0 : SHOT_X,
      y: flat ? SHOT_Y : 0,
      duration: SHOT_DUR,
      clearProps: 'transform,opacity',
    });
  }

  // Mark, then the two paragraphs, as one stagger. `q` returns them in DOM
  // order, which is the order they are read in.
  const caption = q('.ab-brand__mark, .ab-brand__prose > *');
  if (caption.length) {
    rise(tl, caption, cue(CAPTION_AT), {
      y: 10,
      duration: 0.6,
      stagger: step(CAPTION_STEP),
      clearProps: 'transform,opacity',
    });
  }
}
