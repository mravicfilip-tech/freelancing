/* One band of the About page, in its own file.
 *
 * The six entrances were written as one module. They are split per band so
 * that several people can work on the page at once without editing the same
 * file -- the house language, the phone split and the shared helpers all
 * still live in About.motion.ts, which every one of these imports from.
 *
 * WHAT THIS BAND IS. One sentence, in 40px uppercase display type, with the
 * band's four arcs above it and a quiet goal line under it. The sentence is
 * the band: it is the only thing in it that carries an argument, and the
 * whole of the band's 722-unit min-height exists to give it a frame.
 *
 * THE ONE THING THIS BAND DOES THAT THE OTHERS DO NOT: the sentence FILLS AS
 * THE READER SCROLLS, word by word, and stays filled. That is a scroll-linked
 * scrub and not an entrance, so it is the only ScrollTrigger on this page
 * outside the landing hero's mark. Everything about why it is per-word, why
 * the words carry their own paint, and where the trigger starts and ends is
 * argued below, next to the thing it decides.
 *
 * NO LOOP. Nothing in this band is a thing doing its job over time -- a
 * sentence and four arcs are not that -- and the fill is not a loop either:
 * it runs once, in one direction, and the reader drives it.
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
 * Per LINE is the other defensible grain and it was rejected on a measurement.
 * Counted on the page, the statement wraps to 6 lines at 1600 and at 1100, 8
 * at 720, 18 at 390 and 21 at 360 -- so a per-line reveal is a six-step move
 * on a desktop and a twenty-one-step one on a phone, from one piece of copy,
 * and the reader who sees both sees two different animations. It is also the
 * coarsest thing the copy can be cut into: nothing happens until a whole
 * line's worth of scroll has been spent, and then a whole line of 40px display
 * type switches on at once, which is a block appearing and not a fill.
 *
 * Per CHARACTER is the opposite failure: ~250 spans on a sentence set in 24 to
 * 40px uppercase, where the eye is reading the front of the wave and not the
 * letters inside it. It buys nothing over the word and costs six times the
 * elements, each of them composited.
 *
 * The word is the only grain that is width-invariant. Forty words is forty
 * words at 1600 and at 360, so the reveal has the same texture on a phone as
 * on a desktop while the line count triples underneath it, and the wave
 * advances in the unit the reader is actually consuming.
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
 * THE END IS TWO RULES AND THE EARLIER ONE WINS, and it is two because the
 * statement is not the same shape at both ends of the range: measured, it is
 * 288px tall in a 900 viewport at 1600 -- a third of the screen -- and 605 in
 * a 780 viewport at 360, which is more than three quarters of it.
 *
 * CENTRED reads best and is the rule that governs at the wide widths: finish
 * when the sentence's own centre reaches 45% of the screen, and it comes to
 * rest a little above the middle with room above and below. Applied to the
 * phone it is too late -- a sentence that is 78% of the screen tall, centred,
 * has 87px of headroom and 250ms of the reader's own scrolling eats most of
 * it, so the first line is grazing the top edge as the last word lands.
 *
 * So the second rule is a ceiling on that: never later than the point where
 * the first line has climbed to 12% of the screen. At 1600 the centre rule is
 * the earlier of the two and wins by 153px; at 360 the ceiling is. Both are
 * stated against the statement's own box, so both mean the same thing at every
 * width.
 *
 * DRIVEN AND MEASURED, in both themes, at the moment the last word lands --
 * the statement's top and bottom against the viewport, and the scroll spent
 * getting there:
 *
 *   1600 x 900   6 lines, 288 tall    213..501 of 900    625px
 *   1100 x 850   6 lines, 198 tall    218..441 of 850    600px
 *    720 x 900   8 lines, 230 tall    238..468 of 900    600px
 *    390 x 844  18 lines, 518 tall     81..599 of 844    700px
 *    360 x 780  21 lines, 605 tall     41..646 of 780    675px
 *
 * Every line of the sentence is on screen at every one of them, and the fill
 * is spent over two thirds to four fifths of a screen of scrolling wherever it
 * runs. The numbers sit inside the trigger's own end because the reader keeps
 * scrolling through the quarter-second the latch takes to finish the last
 * words; at 360 the end itself puts the top line 94px clear and what is
 * measured is 41.
 *
 * `end` is therefore a function returning a scroll position rather than one of
 * ScrollTrigger's strings -- a string can say one of these and not the lesser
 * of them -- and being a function it is re-evaluated on every refresh, which
 * is what resize and font-load both end in.
 */
const START = 'top 88%';
/** Where the sentence's centre has got to when the fill is done. */
const END_CENTRE = 0.45;
/** ...unless its first line has got this high first. */
const END_CEILING = 0.12;
/** A little smoothing, so a trackpad's jitter does not read in the type. Kept
 *  short: what the scrub lags by is what the reader scrolls past before the
 *  last words land, and on the phone that is headroom at the top of the
 *  sentence. */
const SCRUB = 0.3;

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
 *
 * ...and then, ON SCROLL AND NOT ON THE CLOCK, the statement fills word by
 * word from the first to the last, and stays filled.
 *
 * The fill is not a second arrival. The band's one arrival is still the
 * statement's, on the timeline above, and the fill cannot overlap it: the
 * entrance is over long before the reader has scrolled the statement up to
 * where the trigger starts. Nothing else in the band moves while the fill
 * runs, and it only runs while the reader is the one moving.
 *
 * The statement is animated AS ONE BLOCK for the entrance -- the travel, the
 * blur and the fade are on the <p>, unchanged -- and only the fill reaches
 * inside it.
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
    // `kill(revert, allowAnimation)`, and the second argument is the load-
    // bearing one: left off, ScrollTrigger kills the timeline it was driving
    // as well, and the finishing tween below would then be pushing progress
    // into something already dead.
    self.kill(false, true);
    gsap.to(fill, { progress: 1, duration: 0.25, ease: 'none', overwrite: true });
  };

  const st = ScrollTrigger.create({
    animation: fill,
    trigger: statement,
    start: START,
    // The lesser of the two rules argued above, as an absolute scroll
    // position. Read from the live rect every refresh; differences of the
    // element's own box, so the entrance's translate cancels out of it.
    end: () => {
      const r = statement.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const vh = window.innerHeight;
      return Math.min(top + r.height / 2 - vh * END_CENTRE, top - vh * END_CEILING);
    },
    scrub: SCRUB,
    // Deliberately NOT `invalidateOnRefresh`. A refresh recomputes start and
    // end whatever this says; all the flag adds is `invalidate()` on the
    // animation, which would re-record each word's start value from whatever
    // opacity it is wearing at that instant. Resize the window halfway through
    // the fill and every word in the wave would take its own half-lit state as
    // its beginning and never be able to go back.
    onRefresh: (self) => {
      anchorLead(statement);
      // A reveal that cannot complete is worse than one that completes at
      // once: if the page is too short to scroll to this trigger's end, fill
      // the sentence rather than strand it part-read.
      if (self.end > ScrollTrigger.maxScroll(self.scroller as Window)) latch(self);
    },
    /* TWO WAYS IN, because one of them is not reliable on its own. `onUpdate`
     * with an exact `progress === 1` is a float comparison at the end of a
     * scrub, and measured over ten runs of the width sweep it missed three
     * times -- the sentence read as full (every word above 0.995 at a progress
     * of 0.9997) while the trigger was still alive, so scrolling back up
     * emptied it again. `onLeave` is the event for "the scroll has passed the
     * end" and does not depend on a number landing exactly; the epsilon on
     * `onUpdate` catches the case where the reader stops ON the end and never
     * leaves. `latch` is idempotent, so both firing is free. */
    onUpdate: (self) => { if (self.progress >= 0.999) latch(self); },
    onLeave: (self) => latch(self),
  });

  // The band can be built when it is already above the reader -- a theme
  // switch rebuilds every section wherever the page happens to be sitting, and
  // the router can land mid-page. ScrollTrigger sets the progress on creation
  // but raises no update for it, so ask once.
  if (st.progress >= 1) latch(st);
}
