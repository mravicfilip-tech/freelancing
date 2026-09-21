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
 * THE CHOREOGRAPHY IS THE CLIENT'S OWN, from `src/components/Manifesto.jsx` in
 * their portfolio, and the numbers below are theirs as written: the band pins,
 * the scroll it absorbs drives the fill, every word rests at 15% and brightens
 * to full in sequence with each word's fade overlapping its neighbour by half,
 * and the paragraph is FINISHED about three quarters of the way through and
 * holds at full while the band is still pinned. They are not re-tuned here.
 * One of them did not survive contact with this page and it is called out
 * where it is changed, with the measurement that forced it.
 *
 * THE PIN IS THE EFFECT. Without it the copy fills while travelling past the
 * reader, which is a different thing and is what the client rejected: the
 * band locks to the viewport, the paragraph fills IN PLACE, and the page moves
 * on only once it has been read.
 *
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
 * advances in the unit the reader is actually consuming. It is also the grain
 * the reference uses.
 *
 * WHY THE WORDS CARRY THEIR OWN PAINT, and this is the one piece of machinery
 * the reference does not need. Their words fill toward their own designed
 * colour, so plain opacity on a SplitText word is enough. Ours cannot:
 * `.ab-conv__statement` paints its type with a gradient clipped to the text
 * (About.css), and in Chromium a descendant that gets its own paint layer --
 * anything with an opacity, a filter or a transform -- is EXCLUDED from that
 * text clip. Measured on this page: wrapping the words and putting
 * `opacity: 0.2` on every other one does not dim "WE", "FOUNDED" and the rest
 * of the gradient-painted run, it DELETES them; only the words inside
 * `.ab-conv__rest`, which carry an opaque `-webkit-text-fill-color` of their
 * own, survive. So a word that is going to be animated has to paint itself.
 * `.ab-conv__w--lead` in About.conv.css reproduces the block's gradient per
 * word from `--ab-conv-gw` and `--ab-conv-gx`, which is what `anchorLead`
 * below measures: same stops, same block-width ramp, same last-letter
 * turnover, one element down.
 *
 * WHY NOT ANIMATE THE GRADIENT'S OWN STOPS, which is the obvious move: the
 * stops are percentages of the BLOCK, so the same pair of numbers is a
 * different word at every viewport, and a 90deg gradient has no idea where the
 * lines break -- it can sweep a rectangle and never a sentence.
 *
 * WHY `intoLines` IS NOT USED, and why SplitText is not either: `intoLines`
 * rebuilds an element from its `textContent`, which throws away the
 * `<span class="ab-conv__rest">` that carries the second half of the sentence
 * in a dimmer ink -- and SplitText would flatten it the same way, which is why
 * the reference can author its emphasis as an injected HTML string and we
 * cannot. `intoWords` below walks the tree instead, so the span -- and the two
 * colour regimes either side of it -- is still there afterwards.
 */

const WORD = 'ab-conv__w';
const LEAD = `${WORD}--lead`;

/* THE REFERENCE'S NUMBERS. Changing one of these changes the feel of the fill,
   which is settled; they are here as named constants so that is obvious. */

/** Where a word rests before the fill reaches it. Alpha over the band's own
 *  ground, so it is the same move on paper as on black and inverts nothing. */
const DIM = 0.15;
/** With a scrub the absolute values are irrelevant; `duration: 2` against
 *  `stagger: 1` just means each word's fade overlaps its neighbour by half --
 *  a soft wave rather than a hard word-by-word step. The reference's comment,
 *  and the half of the effect that is not the pin. */
const WORD_IN = 2;
const SPREAD = 1;
/** The empty tween after the fill: the hold at full, while still pinned.
 *  Sized from the word count rather than written down, because the reference's
 *  20 is 20 for ITS word count -- their fill runs `1 x (words - 1) + 2` = 57
 *  units and 20 of those is the last quarter. Ours is 41 units for 40 words,
 *  so the same last quarter is 41/3. */
const holdFor = (words: number) => (SPREAD * (words - 1) + WORD_IN) / 3;

/* THE TRIGGER'S GEOMETRY.
 *
 * `start` and `end` are the reference's: the band's top meets the top of the
 * screen, and the pin then absorbs 170% of a screen of scrolling. Stated
 * against the VIEWPORT rather than against anything inside the band, which is
 * what makes the pin immune to this band's one awkward property -- it is
 * `justify-content: center` in a 722-unit min-height and the statement's wrap
 * changes with width, so the eyebrow falls 110px below the band top at 1600,
 * 44 at 1100 and 24 at 390. Under a pin none of that reaches the trigger.
 *
 * THE ONE NUMBER THAT DID NOT SURVIVE CONTACT, and only at one width. Their
 * section is `100svh`, so `top top` always shows the whole of it. Ours is not
 * viewport-height: measured, the band is 668px tall in a 900 viewport at 1600,
 * 430 in 900 at 720 and 727 in 844 at 390 -- all comfortably inside -- but 813
 * in a 780 viewport at 360. Pinned at `top top` the bottom 33px of it are
 * below the fold for the whole 170%, and the inner's bottom padding at that
 * width is 24px, so 9px of the goal line is cut off and STAYS cut off while
 * the reader is held there.
 *
 * `bottom bottom` where the band is taller than the screen moves that 33px to
 * the TOP of the band, where it is the band's own `--ab-gap` padding -- 56px
 * of empty space at 360 -- so nothing that is drawn is lost. At every width
 * where the band fits, the two are the same pin and this reads exactly as the
 * reference's `top top`.
 *
 * THE OTHER CONSEQUENCE OF NOT BEING 100vh, which is left alone because the
 * measurement says it costs nothing. Where the band is SHORTER than the screen
 * -- 669 in 900 at 1600 -- the strip below it is not part of the pinned
 * element, so the next band climbs into the bottom of the frame over the last
 * stretch of the pin. Measured at 1600 x 900: the pin runs 1340 to 2870, the
 * statement is full at 2552 (79% of it) and the first pixel of HOW IT WORKS
 * appears at 2638 (85%). The paragraph is finished before anything else is on
 * screen, which is what the hold quarter is for, so the fill is never competing
 * with it. Closing the strip would mean either cutting the reference's 170% or
 * giving the band a viewport height, and the second is a layout decision in
 * About.css rather than a motion one. */
const START_FITS = 'top top';
const START_TALL = 'bottom bottom';
const END = '+=170%';
const SCRUB = 1;

/** How far past the end counts as "read it". A float comparison at the end of
 *  a scrub does not reliably land on exactly 1: measured over ten runs of the
 *  width sweep, an exact `=== 1` missed three times -- every word above 0.995
 *  at a progress of 0.9997 -- and the trigger stayed alive, so scrolling back
 *  up emptied the sentence again. */
const LATCH_AT = 0.999;
/** How long the latch waits between samples of the scroll position, and how
 *  many times it will wait. Two samples the same is what "the reader chose
 *  this position" means, so a reader who scrolls past and stops latches after
 *  about 0.4s; three seconds of a position that will not stop moving is given
 *  up on rather than spun on, because the next scroll calls the latch again. */
const SETTLE = 0.2;
const SETTLE_TRIES = 15;
/** How long scroll anchoring stays off around the pin's creation. Two frames
 *  at 60fps is 0.033; a tenth of a second is that with room for a slow one. */
const ANCHOR_OFF = 0.1;

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
 *       arrives at 15% -- present, legible as a shape, not yet read.
 * 1.10  The goal line, quieter and shallower, after the statement has settled.
 *
 * ...and then the band PINS, and the scroll it absorbs fills the statement
 * word by word, in place, and holds it full for the last quarter before the
 * page is allowed to move on.
 *
 * The fill is not a second arrival. The band's one arrival is still the
 * statement's, on the timeline above, and the two cannot overlap: the entrance
 * fires as the band crosses the shared -5% gate, which is most of a screen of
 * scrolling before its top reaches the top of the screen and the pin engages.
 * Nothing else in the band moves while the fill runs, and it only runs while
 * the reader is the one moving.
 *
 * The statement is animated AS ONE BLOCK for the entrance -- the travel, the
 * blur and the fade are on the <p>, unchanged -- and only the fill reaches
 * inside it.
 */
export function buildConviction({ el, q, tl }: SectionMotion) {
  const { cue } = schedule();
  const statement = q('.ab-conv__statement')[0];

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-conv__statement'), cue(0.24), { y: 24, blur: 12, duration: 1.2, fade: 0.4 });
  outOfBlur(tl, q('.ab-conv__goal'), cue(1.1), { y: 12, blur: 5, duration: 0.75, fade: 0.3 });

  if (!statement) return;
  const words = intoWords(statement);
  if (!words.length) return;
  anchorLead(statement);

  /* The reference's tween, and then its empty tween -- the hold at full while
   * the band is still pinned.
   *
   * `fromTo` and not `from`, per the house rule, and per the reference. The
   * `gsap.set` in front of it is this page's own and is NOT redundant: a
   * staggered tween whose later targets have not started yet can be left with
   * no inline value at all until their turn comes round, and a word of this
   * statement with no inline opacity computes to 1, not to DIM. Measured on an
   * earlier build of this band with an object stagger: the sentence read fully
   * lit from the moment it arrived and what travelled through it on scroll was
   * a wave of words DIMMING and coming back, the exact inverse of the move.
   * One `set` costs nothing and makes the resting state true of every word
   * from the first painted frame. */
  const fill = gsap.timeline({ paused: true });
  gsap.set(words, { opacity: DIM });
  fill
    .fromTo(words,
      { opacity: DIM },
      { opacity: 1, ease: 'none', duration: WORD_IN, stagger: SPREAD })
    .to({}, { duration: holdFor(words.length), ease: 'none' });

  /* THE PIN AND THE FILL ARE TWO TRIGGERS ON THE SAME GEOMETRY, and that is
   * this page's decision rather than the reference's shape.
   *
   * The reference carries both on one trigger because it has nothing that
   * needs to retire the fill. We do: this band's brief is that the statement
   * HOLDS at full once it has been read, including on the way back up, which
   * the reference's scrub does not do -- scroll back into its pinned section
   * and the paragraph un-fills. The only way to stop a scrub reversing is to
   * kill the trigger driving it, and killing a PINNED trigger removes its
   * spacer: the document would lose 170% of a screen under the reader's
   * thumb, mid-scroll, which is a page jump and not a hold.
   *
   * So the pin is its own trigger and is never killed, and the fill is its
   * own and is killed by the latch. Same trigger element, same start, same
   * end, so they pin and scrub over exactly the same stretch.
   */
  // A pixel of tolerance, because the band is now sized to be exactly a screen
  // and "exactly" is a subpixel question: `100svh` resolving to 900.4 against
  // an `innerHeight` of 900 would otherwise flip a band that fits into the
  // branch for one that does not, over nothing a reader could see.
  const start = () => (el.offsetHeight > window.innerHeight + 1 ? START_TALL : START_FITS);

  /* SCROLL ANCHORING MUST NOT COMPENSATE FOR THE SPACER, and it is switched
   * off for the two frames that takes and no longer.
   *
   * Creating the pin inserts ScrollTrigger's spacer, which grows the document
   * by the pin distance -- measured, 4704 to 6234 at 1600 x 900, which is
   * 1530 and is 170% of the viewport. If the reader is ALREADY inside what is
   * about to become the pinned range, every browser with scroll anchoring
   * moves them by exactly that amount to keep what is under their eye where
   * it was. Measured: ask for 1731, land at 3261, which is past the whole
   * band -- so the reader who jumped into the middle of the statement is put
   * out the other side of it and never sees the reveal at all. It is not a
   * rare path: a fast flick, a back-navigation, a restored scroll position and
   * a link into the middle of the page all arrive that way.
   *
   * Disabling anchoring for the insertion is the whole fix -- measured drift
   * goes from 1530 to 0 at every fraction of the pin -- and doing it for two
   * frames rather than for the life of the page is what keeps the cost at
   * nothing: anchoring is back on before anything else could need it.
   *
   * Narrower scopes do not work, and that was measured rather than assumed:
   * `overflow-anchor: none` on the spacer alone, or on the band alone, still
   * drifts 1530, because the node the browser anchors to is neither of them.
   * It has to be the scrolling element.
   *
   * `gsap.set` rather than touching `style` directly, so that both the switch
   * and its removal belong to the surrounding `gsap.context` and cannot be
   * stranded by an unmount landing between them. */
  gsap.set(document.documentElement, { overflowAnchor: 'none' });
  gsap.delayedCall(ANCHOR_OFF, () => {
    gsap.set(document.documentElement, { clearProps: 'overflowAnchor' });
  });

  ScrollTrigger.create({
    trigger: el,
    start,
    end: END,
    pin: el,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    /* REFRESH ORDER, and why this is not the reference's 2.
     *
     * Pins change document height, so they have to be measured top-down or a
     * pin inserted above another one leaves every position the lower one
     * computed stale. Theirs is 2 because their pinned section comes FIRST and
     * has a second pin below it to beat.
     *
     * Ours is the fourth of six bands and, measured, the only ScrollTrigger on
     * this page at all -- the landing hero's mark is the only other one in the
     * app and it lives on the other route. So there is nothing above this to
     * be ordered against and the reference's number has no counterpart here.
     * What 1 buys is local and real: it puts the pin ahead of the fill trigger
     * below, which reads the same start and end, and it leaves 2 and up free
     * for a band EARLIER in the document if this page ever gains a second pin.
     * A pin added above this one must take a higher number than this. */
    refreshPriority: 1,
  });

  /* ONCE FULL, IT STAYS FULL -- BUT ONLY FROM A SCROLL POSITION THE READER
   * ACTUALLY CHOSE, and that qualification is the whole of this block.
   *
   * THE DEFECT IT FIXES, because it was intermittent and it looked exactly
   * like "the effect does not run". When the band builds, ScrollTrigger
   * inserts the pin's spacer and the document grows by the pin distance --
   * measured here, 4704 to 6234, which is 1530 and is 170% of a 900 viewport.
   * If that happens while the reader is already below the band's top, the
   * browser moves the scroll position by the same amount to keep what is
   * under their eye where it was. ScrollTrigger's next update samples THAT
   * position: measured, scrollY 3699 against a trigger ending at 2878, so it
   * reports a progress of 1. The latch believed it, killed the fill and forced
   * the statement to full -- at 25% of the pin, before the reader had scrolled
   * a pixel of it. The scroll then settled back to 1731 and the fill trigger
   * was already gone, so the sentence sat fully lit and the reveal never
   * happened. One run in ten of the instant-arrival sweep, and in the wild it
   * fires whenever the band builds with the reader already inside what is
   * about to become the pinned range: a fast flick, a back-navigation, a
   * restored scroll position, a link into the middle of the page.
   *
   * WHAT MAKES IT LAST LONG ENOUGH TO MATTER is `scroll-behavior: smooth` on
   * `html` in global.css. Measured both ways: with it, the adjustment becomes
   * an ANIMATED excursion -- scrollY runs out to 3699 and takes about two
   * seconds to come back to 1731, so for most of that time every sample says
   * "past the end". With `scroll-behavior: auto` the document still grows but
   * the scroll does not move at all: peak scrollY equals the target, and there
   * is no excursion to misread. GSAP warns against smooth scrolling with
   * ScrollTrigger and this is why; it is a global rule and not this band's to
   * change, so the latch is built to survive it.
   *
   * THE FIX IS NOT A LONGER WAIT, because two seconds is not a number worth
   * guessing at and the excursion's length is the browser's business. It is
   * to ask what "a position the reader chose" actually means, and the answer
   * is: a position that has STOPPED MOVING. So the latch samples the scroll
   * twice, 0.2s apart, and only acts when the two agree and the reason it was
   * called still holds. Through the excursion the scroll moves every frame, so
   * it keeps waiting; when it settles back at 1731 the progress is no longer
   * past the end and it simply declines. A reader who scrolls past and stops
   * satisfies it in about 0.4s.
   *
   * Nothing is wrong on screen during the wait -- the scrub goes on doing its
   * job and self-corrects when the position settles, which is why the fill was
   * right in every run where the latch did not fire.
   *
   * Each caller hands in the condition that justified it, so the re-check is
   * the same question and not a proxy for it.
   *
   * `gsap.delayedCall` and not `setTimeout`: the delayed call is owned by the
   * surrounding `gsap.context` and is reverted with everything else when the
   * band unmounts. A bare timeout would outlive the band under the router,
   * and would then be holding a killed trigger.
   *
   * The finishing tween rather than a bare `progress(1)` is for the smoothing:
   * at the moment the end is crossed the scrub can still be behind, and
   * snapping the remainder on would be the one visible discontinuity in the
   * move. With the reference's hold quarter in front of it there is normally
   * nothing left to finish.
   *
   * `latch` takes the trigger from its own callback rather than closing over
   * the variable holding it, because the first `onRefresh` fires from INSIDE
   * `ScrollTrigger.create`, before that variable has been assigned. Closing
   * over it would be a temporal-dead-zone throw on the one path that matters
   * most: a band built when the reader is already past it. */
  let latched = false;
  let watching: gsap.core.Tween | null = null;

  const latch = (self: ScrollTrigger, stillTrue: () => boolean) => {
    if (latched || watching) return;
    let lastY = -1;
    let tries = 0;
    const check = () => {
      watching = null;
      if (latched) return;
      // The reason it was called has to still hold. A transient that has since
      // settled somewhere else fails here and nothing happens.
      if (!stillTrue()) return;
      const y = self.scroll();
      if (y !== lastY) {
        // Still moving, so this is not a position anybody has chosen yet.
        // Wait for it to stop -- but not forever: give up rather than spin,
        // because the next scroll will call this again anyway.
        if (tries >= SETTLE_TRIES) return;
        lastY = y;
        tries += 1;
        watching = gsap.delayedCall(SETTLE, check);
        return;
      }
      latched = true;
      // `kill(revert, allowAnimation)`, and the second argument is load-
      // bearing: left off, ScrollTrigger kills the timeline it was driving as
      // well, and the finishing tween below would be pushing progress into
      // something already dead. Only the FILL's trigger is killed -- the pin's
      // is untouched, because killing a pinned trigger removes its spacer and
      // the document would lose 170% of a screen under the reader's thumb.
      self.kill(false, true);
      gsap.to(fill, { progress: 1, duration: 0.25, ease: 'none', overwrite: true });
    };
    watching = gsap.delayedCall(SETTLE, check);
  };
  const atEnd = (self: ScrollTrigger) => () => self.progress >= LATCH_AT;

  const fillST = ScrollTrigger.create({
    animation: fill,
    trigger: el,
    start,
    end: END,
    scrub: SCRUB,
    invalidateOnRefresh: true,
    onRefresh: (self) => {
      // The lead words' gradient is measured, so it is re-measured whenever
      // anything that could move them has happened. A refresh is what a resize
      // and a font load both end in.
      anchorLead(statement);
      // A reveal that cannot complete is worse than one that completes at
      // once: if the page is ever too short to scroll to this trigger's end,
      // fill the sentence rather than strand it part-read.
      if (self.end > ScrollTrigger.maxScroll(self.scroller as Window)) {
        latch(self, () => self.end > ScrollTrigger.maxScroll(self.scroller as Window));
      }
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
    onUpdate: (self) => { if (self.progress >= LATCH_AT) latch(self, atEnd(self)); },
    onLeave: (self) => latch(self, atEnd(self)),
  });

  // The band can be built when it is already above the reader -- a theme
  // switch rebuilds every section wherever the page happens to be sitting, and
  // the router can land mid-page. ScrollTrigger sets the progress on creation
  // but raises no update for it, so ask once.
  if (fillST.progress >= LATCH_AT) latch(fillST, atEnd(fillST));

  /* The lead words' offsets are measured from laid-out text, so they are wrong
   * if they were taken against the fallback face. The reference splits after
   * `document.fonts.ready` for the same reason; we split before it -- the
   * split moves no text -- and re-measure after. Guarded, because the promise
   * can settle after the band has been unmounted and reverted, which is
   * StrictMode's discarded first mount and every route change. */
  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(() => {
      if (!statement.isConnected) return;
      anchorLead(statement);
      ScrollTrigger.refresh();
    });
  }
}
