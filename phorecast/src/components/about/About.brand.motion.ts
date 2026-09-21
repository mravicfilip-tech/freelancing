/* One band of the About page, in its own file.
 *
 * The six entrances were written as one module. They are split per band so
 * that several people can work on the page at once without editing the same
 * file, which is the only reason -- the house language, the phone split and
 * the shared helpers all still live in About.motion.ts, which every one of
 * these imports from.
 *
 * ---------------------------------------------------------------------------
 * THE SHOT LEADS, AND THE MARK IS PART OF THE CAPTION.
 *
 * The band has two candidates for the one object that comes out first: the
 * Phorcast mark, and the dashboard. It is the dashboard, for two reasons and
 * neither of them is taste.
 *
 *   The mark cannot hold a frame. It is 33.827 x 39.432 design px -- about 30
 *   CSS px at 1600 and 24 at 390, where About.css floors it. The house rule is
 *   that the one thing the band is about arrives ALONE and has the frame to
 *   itself for the better part of a second. A 30px glyph alone on a 1550px
 *   card for 0.78s is not an accent, it is a pause with nothing in it.
 *
 *   The dashboard is the band's subject. Everything else on this card is a
 *   caption to it: the mark says whose product it is and the two paragraphs
 *   say what the product does. Captions follow their picture.
 *
 * So the plate arrives, then the shot alone, and then the mark and the two
 * paragraphs come in as ONE tight stagger -- mark, first paragraph, second
 * paragraph, 0.1s apart, in DOM order. The mark heading that stagger rather
 * than getting a beat of its own is the point: it is the first line of the
 * caption, not a second subject. Nothing here is ever two things at once.
 *
 * ---------------------------------------------------------------------------
 * THE SHOT IS ONE OBJECT AND IS ANIMATED AS ONE OBJECT.
 *
 * `.ab-brand__visual` holds three separate PNGs -- the laptop body and the two
 * dashboard panels -- positioned as percentages of the layer so that they read
 * as a single photograph at every width (About.css argues the percentages).
 * Two things follow from that and both are enforced here by the single line
 * that tweens the layer and nothing inside it:
 *
 *   Never move the three independently. They are one composite; 1px of drift
 *   between the laptop lid and the panel sitting in it is a broken photograph,
 *   and it is drift the reader can see precisely because the panels are meant
 *   to be screwed to the body.
 *
 *   Moving them together means moving a large bitmap, so the tween may only
 *   touch properties the compositor can serve from the already-rasterised
 *   layer. TRANSFORM AND OPACITY, AND NOTHING ELSE.
 *
 * WHICH IS WHY THE SHOT DOES NOT ARRIVE OUT OF BLUR, and that is a removal
 * from what this band used to do. `filter: blur()` is not a compositor
 * property: it re-rasterises the whole three-layer stack every frame of the
 * tween, and at 1600 that stack is 772 x 367 CSS px of the three largest
 * rasters on the site. About.tsx already spent this budget once -- the three
 * are `loading="lazy"` and `decoding="async"` for exactly this reason, after a
 * measurement in which decoding them eagerly left the CHOOSE band's sampler
 * 16 frames in five seconds. Handing them back a per-frame blur would buy that
 * problem back at the one moment the band is trying to look expensive. Lag
 * smoothing is on (src/lib/motion.ts says why), so the cost would not show up
 * as a dropped entrance; it would show up as a late one.
 *
 * There is a second reason, and it is the light-mode mask. CSS resolves
 * `filter` BEFORE `mask`, and `mask-clip` is border-box by default -- so on a
 * masked element a blur's bleed is clipped at the layer's own edges, and on an
 * unmasked one it is not. About.css states the mask for light only. The same
 * blur tween therefore has two different silhouettes on the two grounds. No
 * blur, no divergence.
 *
 * The band's soft-to-sharp accent is not lost: the card under the shot still
 * arrives out of blur, which is what About.motion.ts's header actually claims
 * for the page -- type and CARDS resolve out of blur. A photograph is neither.
 *
 * ---------------------------------------------------------------------------
 * THE LIGHT-MODE LEFT EDGE, WHICH IS THE THING IN THIS BAND MOST EASILY
 * BROKEN BY MOTION.
 *
 * The shot's left edge at the card's 871 mark is where Figma stopped
 * compositing. On the dark card it is invisible; on paper it is a hard black
 * vertical edge down a #f7f0ea card, and About.css dissolves it in light mode
 * only with `mask-image: linear-gradient(to right, transparent 0%, #000 13%)`
 * on `.ab-brand__visual`. Three rules keep that mask doing its job through the
 * whole beat and not merely at rest:
 *
 *   The tween's target is `.ab-brand__visual` ITSELF -- the element the mask
 *   is on. A mask travels with its own element and applies to all of its
 *   descendants, so translating the layer carries the fade with it and the
 *   edge is soft wherever the beat has put it. Tween a child instead and the
 *   fade stays behind.
 *
 *   NO CLIP-PATH, and no wipe. CSS order is filter, then clip-path, then mask:
 *   a clip is applied to the element BEFORE the mask is, so an `inset()` wipe
 *   opening left to right cuts its own hard edge at, say, 30% -- well past the
 *   13% where the mask has already gone fully opaque -- and the mask has
 *   nothing left to soften. Measured: strip luminance steps 5.3/255 across
 *   that edge with the mask intact and 102/255 with a 30% inset wipe on it.
 *   That is the black slab, marching.
 *
 *   NOTHING HERE WRITES `mask` OR `-webkit-mask`. An inline mask from GSAP
 *   would override the stylesheet's and, on `clearProps`, would take the
 *   stylesheet's with it.
 *
 * Opacity is safe and is used: fading the layer up scales the masked result,
 * so the edge is softest exactly while the layer is faintest.
 *
 * ---------------------------------------------------------------------------
 * THE SHOT TRAVELS ALONG WHICHEVER AXIS THE LAYOUT PUT IT ON.
 *
 * Above 1100 the shot is the card's right half and bleeds off the card's right
 * edge, so it arrives from that edge: x, the one horizontal move on the page,
 * running the way the composition already points.
 *
 * At 1100 and below About.css stacks the card and the shot becomes its bottom
 * half, under the copy rather than beside it -- and About.css turns the
 * frame's 531:234 field off at the same breakpoint, because the gap beside the
 * photograph that the field showed in no longer exists. A sideways entrance
 * there is arriving from nowhere: there is no right-hand edge to come off any
 * more, the reader's eye is travelling down the card, and the card's own
 * `overflow: hidden` would eat half the travel on the wrong side. So below the
 * breakpoint the same beat is a rise, which is the house move for a thing that
 * sits under the thing above it. Same object, same moment, same duration --
 * only the axis follows the layout.
 *
 * The query is asked per build for the reason `schedule()` gives in
 * About.motion.ts: a module-scope matchMedia is answered once, when the bundle
 * is parsed, and a rotation or a resize would keep whichever answer the page
 * happened to load under.
 *
 * ---------------------------------------------------------------------------
 * THE TWO PARAGRAPHS ARE NOT SPLIT INTO LINES, and this is the one place the
 * decision is closest.
 *
 * They are the only real prose on the page, and a masked line-by-line reveal
 * is the treatment the hero's headline gets. `intoLines` cannot have them:
 *
 *   The first paragraph opens `<strong>Phorcast</strong>` -- the band's own
 *   subject, set in the display face at full ink, and About.css calls it the
 *   frame's one emphasis in this block. `intoLines` rebuilds an element from
 *   its `textContent`, so it would throw that element away: the paragraph
 *   would animate correctly and come to rest one flat weight in one flat ink,
 *   permanently. This is exactly the hazard About.conv.motion.ts records for
 *   the statement's `<span class="ab-conv__rest">`.
 *
 *   The second paragraph carries a literal `<br />`. A `<br>` contributes
 *   nothing to `textContent`, so `intoLines` -- which splits on newlines in
 *   `textContent` -- would weld the two halves into the single run "...no
 *   margin calls.Your maximum loss is..." and the design's line break would be
 *   gone for good. Faq.motion.ts records this one, on its own heading, and
 *   declines the split for the same reason.
 *
 * Even without the markup it would be the wrong move here. A line mask is a
 * reveal that asks to be watched, and by 1.36s the reader is already watching
 * a dashboard finish arriving three inches to the right. Eight masked lines
 * climbing beside it is a second event competing with the band's subject --
 * the thing this page's one rule exists to prevent. The paragraphs rise as two
 * objects, a caption to a picture, which is what they are.
 *
 * No blur on them either, for the reason About.cmp.motion.ts gives about its
 * logos and badges: body copy at 16-24px has nothing to resolve FROM, and at
 * that size a blur is a smudge rather than a focus pull.
 *
 * ---------------------------------------------------------------------------
 * NO LOOP, NO HOVER, NOTHING LISTENING TO THE POINTER. The shot is a
 * photograph of a dashboard, not a dashboard: there is nothing here doing its
 * job over time, so there is nothing for a loop to say. The field behind the
 * card is never touched -- it rides the plate's entrance and gains no light of
 * its own.
 *
 * THIS MODULE HAS NO COLOUR IN IT, so it needed nothing for light mode. It
 * tweens x, y, opacity and -- on the card alone -- filter: blur(), and reads
 * no resting colour out of getComputedStyle to freeze against whichever
 * palette happened to be live (src/lib/theme.ts explains that hazard). No beat
 * here lifts anything by making it brighter, which is the move that would have
 * to invert on paper.
 */

import { rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

/** The plate. Furniture, and it arrives the way CHOOSE's and COMPARE's do. */
const PLATE_AT = 0.22;
/** THE PRODUCT SHOT, alone. */
const SHOT_AT = 0.58;
/** The caption. 0.78s after the shot, which is the frame the shot gets to
 *  itself -- the longest hold on this page, because the shot is the largest
 *  single object on it. */
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

/* Asked per build, not at module scope -- see the header. */
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

  // One target, and it is the element the light-mode mask is on. Transform and
  // opacity only: see the header on both counts.
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
