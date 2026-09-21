/* One band of the About page, in its own file.
 *
 * The six entrances were written as one module. They are split per band so
 * that several people can work on the page at once without editing the same
 * file, which is the only reason -- nothing about the motion changed in the
 * split, and the house language, the phone split and the shared helpers all
 * still live in About.motion.ts, which every one of these imports from.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { all, rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

// LogoScene.ts's pattern: named import from the plugin's own entry point, and
// registered at module scope. Registering twice is a no-op in GSAP, so the two
// call sites do not have to know about each other.
gsap.registerPlugin(ScrollTrigger);

/* THE STATEMENT FILLS AS YOU SCROLL, AND THE GRAIN IS THE WORD.
 * ---------------------------------------------------------------------------
 * Per LINE is the other defensible grain and it was rejected on a measurement:
 * the statement wraps to 6 lines at 1600, 7 at 1100 and 11 at 390, so a
 * per-line reveal has a different number of steps at every width -- eleven
 * beats on a phone and six on a desktop, from one piece of copy. It also
 * cannot start filling until a whole line's worth of scroll has been spent,
 * which at 48px display type is a visible block switching on rather than
 * something filling. Per CHARACTER is ~250 units on a sentence whose type is
 * 48px and uppercase; at that size the eye reads the wave, not the letters,
 * and 250 composited spans buys nothing over 47.
 *
 * The word is the only grain that is width-invariant: 47 words at 1600 and 47
 * at 390, so the reveal has the same texture on a phone as on a desktop, and
 * the wave advances in the unit the reader is actually consuming.
 *
 * WHY THE WORDS CARRY THEIR OWN PAINT. `.ab-conv__statement` paints its type
 * with a gradient clipped to the text (About.css), and in Chromium a
 * descendant that gets its own paint layer -- anything with an opacity, a
 * filter or a transform -- is EXCLUDED from that text clip. Measured on this
 * page: wrapping the words and putting `opacity: 0.2` on every other one does
 * not dim "WE", "FOUNDED" and the rest of the gradient-painted run, it deletes
 * them; only the words inside `.ab-conv__rest`, which carry an opaque
 * `-webkit-text-fill-color` of their own, survive. So a word that is going to
 * be animated has to paint itself. `.ab-conv__w--lead` in About.conv.css
 * reproduces the block's gradient per word from `--ab-conv-gw` and
 * `--ab-conv-gx`, which is what `anchorLead` below measures: same stops, same
 * block-width ramp, same last-letter turnover, one element down.
 *
 * WHY NOT ANIMATE THE GRADIENT'S OWN STOPS, which is the obvious move: the
 * stops are percentages of the BLOCK, so the same pair of numbers is a
 * different word at every viewport, and a 90deg gradient has no idea where the
 * lines break -- it can sweep a rectangle and never a sentence.
 *
 * WHY `intoLines` IS NOT USED, restated because the reason survived the
 * rewrite: it rebuilds an element from its `textContent`, which throws away
 * the `<span class="ab-conv__rest">` that carries the second half of the
 * sentence in a dimmer ink. `intoWords` below walks the tree instead, so the
 * span -- and the two colour regimes either side of it -- is still there
 * afterwards.
 */

const WORD = 'ab-conv__w';
const LEAD = `${WORD}--lead`;

/** Where a word sits before the fill reaches it. Alpha over the band's own
 *  ground, so it is the same move on paper as on black and inverts nothing. */
const DIM = 0.22;
/** How long one word takes, and how far apart the first and last words start.
 *  The wave that travels through the sentence is `WORD_IN / SPREAD` of it --
 *  0.3 against 1 is twelve of the forty words in transition at any moment.
 *  Long enough that no single word pops on, short enough that the opening has
 *  resolved while the last line is still a ghost, which is the whole reading
 *  of the move. */
const WORD_IN = 0.3;
const SPREAD = 1;

/* THE TRIGGER'S GEOMETRY, and the reason it is stated against the STATEMENT
 * rather than against the band.
 *
 * `.ab-conv__inner` is `justify-content: center` in a 722-unit min-height and
 * the statement's wrap changes with width, so where the copy sits inside the
 * band is not a fixed fraction of it: the eyebrow falls 110px below the band
 * top at 1600, 44 at 1100 and 24 at 390 (About.css records the measurement).
 * Any start/end phrased as a fraction of the BAND therefore means a different
 * place in the copy at every width. Phrased against the statement's own box it
 * means the same thing everywhere.
 *
 * END IS `center 45%`, NOT A BOTTOM EDGE. The fill has to finish while the
 * whole sentence is still comfortably in frame, and the sentence is 289px tall
 * at 1600 and 288 at 390 -- an end tied to its bottom edge completes with the
 * first lines already gone off the top at the tall widths. Tied to its centre,
 * the sentence is centred slightly above the middle of the screen at the
 * moment it completes, which at every width tested puts every line of it on
 * screen with room above and below. The distance scrubbed is
 * `0.43 * viewport + height/2` -- 531px at 1600 and 507 at 390 -- so the
 * reveal is paced the same fraction of a screen everywhere.
 */
const START = 'top 88%';
const END = 'center 45%';
/** A little smoothing, so a trackpad's jitter does not read in the type. */
const SCRUB = 0.45;

/**
 * Split a statement into per-word spans WITHOUT flattening it.
 *
 * Idempotent, like `intoLines`: called again on an element it has already
 * split it hands back the spans that are there. It has to be, because
 * `gsap.context().revert()` on unmount undoes inline styles and not DOM, so a
 * band that mounts, unmounts and mounts again under the client-side router
 * meets its own spans on the way back in.
 *
 * `lead` tracks whether the walk is still outside `.ab-conv__rest`, which is
 * the boundary between the two colour regimes: bright ink turning over into
 * the accent before it, one flat muted ink after.
 */
function intoWords(p: HTMLElement): HTMLElement[] {
  if (p.dataset.words) return all(p, `.${WORD}`);

  const rest = p.querySelector('.ab-conv__rest');
  const walk = (node: Node, lead: boolean) => {
    for (const n of Array.from(node.childNodes)) {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        // Keep the whitespace as its own text node: the gaps are what the line
        // breaks on, and a word span that swallowed its trailing space would
        // wrap as one unbreakable unit with it.
        for (const token of (n.nodeValue ?? '').split(/(\s+)/)) {
          if (!token) continue;
          if (/^\s+$/.test(token)) {
            frag.appendChild(document.createTextNode(token));
            continue;
          }
          const span = document.createElement('span');
          span.className = lead ? `${WORD} ${LEAD}` : WORD;
          span.textContent = token;
          frag.appendChild(span);
        }
        (n as ChildNode).replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        walk(n, lead && n !== rest);
      }
    }
  };
  walk(p, true);

  p.dataset.words = 'true';
  return all(p, `.${WORD}`);
}

/**
 * Hand each lead word the block's gradient, offset to its own position in the
 * block, so that a word painting itself paints exactly the pixels the block
 * would have painted for it.
 *
 * Differences of rects, never absolutes: the statement carries a translate for
 * the length of its entrance, and the block and the words inside it are
 * carried by it equally, so a difference is unaffected while either absolute
 * would be 24px out.
 *
 * Re-run on every ScrollTrigger refresh, which is what resize and font-load
 * both end in.
 */
function anchorLead(p: HTMLElement) {
  const leads = all(p, `.${LEAD}`);
  if (!leads.length) return;

  const cs = getComputedStyle(p);
  const box = p.getBoundingClientRect();
  const padLeft = parseFloat(cs.paddingLeft) || 0;
  const inner = box.width - padLeft - (parseFloat(cs.paddingRight) || 0);
  if (inner <= 0) return;

  p.style.setProperty('--ab-conv-gw', `${inner}px`);
  for (const w of leads) {
    const x = w.getBoundingClientRect().left - box.left - padLeft;
    w.style.setProperty('--ab-conv-gx', `${-x}px`);
  }
}

/**
 * 0.00  The band names itself.
 * 0.24  THE STATEMENT, out of the deepest blur on the page and travelling
 *       furthest. It is the only thing in the band and it is the band. It
 *       arrives at 22% -- present, legible as a shape, not yet read.
 * 1.10  The goal line, quieter and shallower, after the statement has settled.
 *       then, ON SCROLL and not on the clock, the statement fills word by word
 *       from the first to the last and stays filled.
 *
 * The entrance is still the band's one arrival and the fill is not a second
 * one: nothing else in the band moves while it runs, and it runs only once the
 * reader is the one moving. The statement is animated AS ONE BLOCK for the
 * entrance -- the travel, the blur and the fade are on the <p> -- and only the
 * fill reaches inside it.
 */
export function buildConviction({ q, tl }: SectionMotion) {
  const { cue } = schedule();
  const statement = q('.ab-conv__statement')[0];

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-conv__statement'), cue(0.24), { y: 24, blur: 12, duration: 1.2, fade: 0.4 });
  outOfBlur(tl, q('.ab-conv__goal'), cue(1.1), { y: 12, blur: 5, duration: 0.75, fade: 0.3 });

  if (!statement) return;
  const words = intoWords(statement);
  if (!words.length) return;
  anchorLead(statement);

  /* THE DIM STATE IS SET ON EVERY WORD UP FRONT, and that is not belt and
   * braces -- a staggered `fromTo` does not do it. Measured here: with the
   * words in one `fromTo`, only the FIRST target had its start value written;
   * every later word had no inline opacity at all and computed to 1 until its
   * own turn in the stagger came round. The sentence therefore read as fully
   * lit from the moment the band arrived, and what travelled through it on
   * scroll was a wave of words DIMMING to 22% and coming back -- the exact
   * inverse of the move. Setting first and tweening `to` states both ends the
   * way the house rule about `from` asks for, and it cannot be undone by a
   * stagger's render order. */
  const fill = gsap.timeline({ paused: true });
  gsap.set(words, { opacity: DIM });
  fill.to(words, { opacity: 1, duration: WORD_IN, ease: 'none', stagger: { amount: SPREAD, ease: 'none' } });

  /* ONCE FULL, IT STAYS FULL. Up to that point the fill follows the scroll in
   * both directions, which is what "follows the scroll" means; past it the
   * trigger is killed and the timeline is finished off, so scrolling back up
   * into the band and down again finds a sentence that has already been read
   * rather than one that un-reads itself. The finishing tween rather than a
   * bare `progress(1)` is for the smoothing: at the moment the end is crossed
   * the scrub is still a few words behind, and snapping those on would be the
   * one visible discontinuity in the whole move.
   *
   * It takes the trigger from its own callback rather than closing over the
   * variable holding it, because the first `onRefresh` fires from INSIDE
   * `ScrollTrigger.create` -- before that variable has been assigned. Closing
   * over it would be a temporal-dead-zone throw on the one path that matters
   * most: a band built when the reader is already past it. */
  let latched = false;
  const latch = (self: ScrollTrigger) => {
    if (latched) return;
    latched = true;
    self.kill();
    gsap.to(fill, { progress: 1, duration: 0.25, ease: 'none', overwrite: true });
  };

  const st = ScrollTrigger.create({
    animation: fill,
    trigger: statement,
    start: START,
    end: END,
    scrub: SCRUB,
    invalidateOnRefresh: true,
    onRefresh: (self) => {
      anchorLead(statement);
      // A reveal that cannot complete is worse than one that completes at
      // once: if the page is too short to scroll to this trigger's end, fill
      // the sentence rather than strand it part-read.
      if (self.end > ScrollTrigger.maxScroll(self.scroller as Window)) latch(self);
    },
    onUpdate: (self) => { if (self.progress >= 1) latch(self); },
  });

  // The band can be built when it is already above the reader -- a theme
  // switch rebuilds every section wherever the page happens to be sitting, and
  // the router can land mid-page. ScrollTrigger sets the progress on creation
  // but raises no update for it, so ask once.
  if (st.progress >= 1) latch(st);
}
