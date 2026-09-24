/* Entrance and scroll fill for the CAST YOUR CONVICTION band.
 *
 * The page's entrances are split one file per band. The shared schedule and
 * helpers live in About.motion.ts.
 *
 * The band is one statement in uppercase display type at `--h2-size` (32px,
 * 28px on a phone), with the four arcs above it and a quieter goal line
 * below. After its entrance the band PINS and the scroll it absorbs fills the
 * statement word by word; once full it stays full. This band is the page's
 * only use of ScrollTrigger. No loop: the fill runs once, driven by the
 * reader.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { all, rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

// Registered at module scope, as in HeroLogo/LogoScene.ts. Registering twice
// is a no-op in GSAP, so the two call sites need not know about each other.
gsap.registerPlugin(ScrollTrigger);

/* THE STATEMENT FILLS AS YOU SCROLL, ONE WORD AT A TIME.
 *
 * The timing values follow the reference animation the design was approved
 * against and are not re-tuned here: the band pins, every word rests at 15%
 * and brightens to full in sequence with each fade overlapping the next by
 * half, and the fill finishes about three quarters of the way through the
 * pin and holds while the band is still pinned. The pin is the effect: the
 * paragraph fills in place rather than while travelling past the reader.
 *
 * Why the word: per line gives a different number of steps at every width
 * (6 lines on a desktop, around 20 on a phone) and switches whole lines on at
 * once; per character means ~250 composited spans for no visible gain. The
 * word count is the same at every width.
 *
 * All words share one ink, so each word is a span with an opacity and nothing
 * else. Note for future changes: in Chromium a descendant with its own paint
 * layer (opacity, filter, transform) drops out of a parent's
 * `background-clip: text`, so a gradient-clipped statement would need every
 * word to repaint the gradient itself.
 *
 * `intoLines` and SplitText both rebuild from `textContent` and would drop
 * the `<span class="ab-conv__rest">` in the markup; `intoWords` walks the
 * tree instead and keeps it.
 */

const WORD = 'ab-conv__w';

/* The fill's timing. Changing any of these changes the feel of the fill. */

/** Where a word rests before the fill reaches it. Plain alpha, so it works
 *  the same on either theme. */
const DIM = 0.15;
/** Under a scrub only the ratio matters: `duration: 2` against `stagger: 1`
 *  overlaps each word's fade with its neighbour's by half, a soft wave rather
 *  than a hard word-by-word step. */
const WORD_IN = 2;
const SPREAD = 1;
/** The empty tween after the fill: the hold at full while still pinned.
 *  Derived from the word count so the hold is always the last quarter of the
 *  timeline (a third of the fill's length). */
const holdFor = (words: number) => (SPREAD * (words - 1) + WORD_IN) / 3;

/* THE TRIGGER'S GEOMETRY.
 *
 * The band's top meets the top of the screen, and the pin absorbs 170% of a
 * screen of scrolling. Both are stated against the viewport, so the band's
 * centred content and width-dependent wrap never reach the trigger.
 *
 * About.css makes the band at least a screen tall, so at most widths it fits
 * and `top top` shows all of it. Where the statement wraps taller than the
 * screen (around 360px wide) `top top` would leave the goal line below the
 * fold for the whole pin, so `bottom bottom` is used instead; the overflow
 * then falls on the band's top padding.
 */
const START_FITS = 'top top';
const START_TALL = 'bottom bottom';
const END = '+=170%';
const SCRUB = 1;

/** How far past the end counts as "read it". A scrub does not reliably land
 *  on exactly 1 (0.9997 is common), and a missed latch leaves the trigger
 *  alive, so scrolling back up would empty the sentence again. */
const LATCH_AT = 0.999;
/** How long the latch waits between scroll samples, and how many times.
 *  Two equal samples mean the reader chose this position (about 0.4s after
 *  stopping). After three seconds of movement it gives up; the next scroll
 *  calls the latch again. */
const SETTLE = 0.2;
const SETTLE_TRIES = 15;
/** How long scroll anchoring stays off around the pin's creation: two frames
 *  at 60fps with room for a slow one. */
const ANCHOR_OFF = 0.1;

/**
 * Split a statement into per-word spans WITHOUT flattening its markup.
 *
 * Idempotent, like `intoLines`: `gsap.context().revert()` undoes inline
 * styles but not DOM, so a band that remounts under the client-side router
 * meets its own spans again and gets them back.
 */
function intoWords(p: HTMLElement): HTMLElement[] {
  if (p.dataset.words) return all(p, `.${WORD}`);

  const walk = (node: Node) => {
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
          span.className = WORD;
          span.textContent = token;
          frag.appendChild(span);
        }
        (n as ChildNode).replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        walk(n);
      }
    }
  };
  walk(p);

  p.dataset.words = 'true';
  return all(p, `.${WORD}`);
}


/**
 * 0.00  The band names itself.
 * 0.24  THE STATEMENT, as one block, out of the deepest blur on the page. Its
 *       words are already at 15%: present, not yet read.
 * 1.10  The goal line, quieter, after the statement has settled.
 *
 * Then the band pins and the scroll fills the statement word by word, holding
 * it full for the last quarter. The entrance fires at the shared -5% gate,
 * most of a screen before the pin engages, so the two never overlap.
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

  /* The fill, then the empty hold tween.
   *
   * The `gsap.set` is NOT redundant: in a staggered tween, words whose turn
   * has not come may have no inline value yet, and a word with no inline
   * opacity computes to 1, not DIM. Without it the sentence reads fully lit
   * on arrival and the scroll sends a wave of dimming through it. */
  const fill = gsap.timeline({ paused: true });
  gsap.set(words, { opacity: DIM });
  fill
    .fromTo(words,
      { opacity: DIM },
      { opacity: 1, ease: 'none', duration: WORD_IN, stagger: SPREAD })
    .to({}, { duration: holdFor(words.length), ease: 'none' });

  /* THE PIN AND THE FILL ARE TWO TRIGGERS ON THE SAME GEOMETRY.
   *
   * Design decision: once read, the statement stays full, including on the
   * way back up. The only way to stop a scrub reversing is to kill its
   * trigger, and killing a PINNED trigger removes its spacer, which would
   * drop 170% of a screen out of the document mid-scroll. So the pin is its
   * own trigger and is never killed; the fill is separate and the latch
   * kills it. Same element, start and end, so they cover the same stretch.
   */
  // A pixel of tolerance: the band is sized to be exactly a screen, and a
  // subpixel difference (`100svh` at 900.4 against an `innerHeight` of 900)
  // must not flip a band that fits into the tall branch.
  const start = () => (el.offsetHeight > window.innerHeight + 1 ? START_TALL : START_FITS);

  /* SCROLL ANCHORING IS SWITCHED OFF WHILE THE PIN IS CREATED.
   *
   * The pin is inserted lazily, when the band builds. Its spacer grows the
   * document by the pin distance (170% of the viewport), and if the reader
   * is already inside what becomes the pinned range, Chromium's scroll
   * anchoring moves them by that same amount to keep the content under their
   * eye in place. That relocates them past the whole band, so they never see
   * the fill. It happens on fast flicks, back navigation, restored scroll
   * positions and in-page links.
   *
   * `overflow-anchor: none` on the root for about two frames stops it; it has
   * to be the scrolling element, as the spacer or band alone still drift.
   * `gsap.set` keeps both the switch and its removal inside the surrounding
   * `gsap.context`, so an unmount cannot strand it. */
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
    /* REFRESH ORDER. Pins change document height, so they are refreshed top
     * down. This is currently the page's only pin; 1 puts it ahead of the
     * fill trigger below, which shares its start and end. A pin added above
     * this band must take a higher number. */
    refreshPriority: 1,
  });

  /* ONCE FULL, IT STAYS FULL, BUT ONLY FROM A SCROLL POSITION THE READER
   * CHOSE.
   *
   * When the pin's spacer is inserted with the reader already inside the
   * range, the browser's scroll adjustment can briefly report a position past
   * the trigger's end. `scroll-behavior: smooth` on `html` (global.css) turns
   * that adjustment into an animated excursion lasting a couple of seconds,
   * so an immediate latch would kill the fill before the reader had scrolled
   * any of it. GSAP advises against smooth scrolling with ScrollTrigger, but
   * that rule is global, so the latch is built to survive it.
   *
   * So the latch samples the scroll position 0.2s apart and acts only when two
   * samples agree AND the caller's condition still holds. During the
   * excursion the position keeps moving, so it waits, and when it settles
   * back inside the pin the condition fails and nothing happens.
   *
   * `gsap.delayedCall`, not `setTimeout`, so the wait is reverted with the
   * band's context on unmount. The finishing tween (rather than a bare
   * `progress(1)`) avoids a visible snap if the scrub is still catching up.
   * `latch` takes the trigger as an argument because the first `onRefresh`
   * fires inside `ScrollTrigger.create`, before `fillST` is assigned. */
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
        // Still moving. Wait for it to stop, but not forever: the next
        // scroll will call this again anyway.
        if (tries >= SETTLE_TRIES) return;
        lastY = y;
        tries += 1;
        watching = gsap.delayedCall(SETTLE, check);
        return;
      }
      latched = true;
      // `kill(revert, allowAnimation)`: without the second argument the
      // timeline dies too and the finishing tween below has nothing to drive.
      // Only the fill's trigger is killed; the pin's must survive (see above).
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
      // A reveal that cannot complete is worse than one that completes at
      // once: if the page is ever too short to scroll to this trigger's end,
      // fill the sentence rather than strand it part-read.
      if (self.end > ScrollTrigger.maxScroll(self.scroller as Window)) {
        latch(self, () => self.end > ScrollTrigger.maxScroll(self.scroller as Window));
      }
    },
    /* TWO WAYS IN. `onLeave` covers scrolling past the end; the epsilon on
     * `onUpdate` covers a reader who stops ON the end and never leaves.
     * `latch` is idempotent, so both firing is harmless. */
    onUpdate: (self) => { if (self.progress >= LATCH_AT) latch(self, atEnd(self)); },
    onLeave: (self) => latch(self, atEnd(self)),
  });

  // The band can be built when it is already above the reader: a theme
  // switch rebuilds every section wherever the page is, and the router can
  // land mid-page. ScrollTrigger sets the progress on creation but raises no
  // update for it, so ask once.
  if (fillST.progress >= LATCH_AT) latch(fillST, atEnd(fillST));

}
