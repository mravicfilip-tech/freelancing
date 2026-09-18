/**
 * Card two — "Experienced Trader?" — the ambient loop.
 *
 * The illustration is a constellation: five market nodes (BTC / USD, TSLA,
 * DAX 40, EUR / USD, XAU / USD) wired to one self-custody padlock on the right.
 * The card's argument is *many markets, one settlement you hold*, so that is
 * the only thing this beat says.
 *
 * THE STORY — one delivery, every 8.5s
 * ------------------------------------
 *   0.82s  BTC leans a dozen design pixels along its own wire and, at 1.00s,
 *          lets a bead of value go. It is the farthest market out, 441 design
 *          px from the padlock, so it goes first.
 *   1.43 → EUR / USD, TSLA, XAU / USD and DAX 40 follow, each at the moment its
 *   2.12s  own distance says it must leave. Every bead travels the wire at the
 *          same speed, so the five departures are a wave whose shape is the
 *          field's real geometry — nearest market last, 1.12s behind BTC.
 *   2.75s  All five arrive at the padlock *together*. Five separate markets
 *          resolving into a single place: that convergence is the whole point,
 *          and it is solved, not staggered by eye — the departures are
 *          `arrival − distance / speed`.
 *   2.63s  The lock answers as they touch its rim: it leans into the delivery,
 *          takes it, and seats. SELF-CUSTODY goes brand red for a beat.
 *   3.45 → The circuit cools outward from the lock, nearest market first, and
 *   4.3s   every label, node and bead is back to the Figma frame.
 *   4.3 →  Nothing moves. The card is the design again for four seconds, and
 *   8.5s   for the 0.8s lead of the next cycle — 5.0s of an 8.5s period still.
 *
 * THE SAME BEAT IN A PORTRAIT FRAME
 * ---------------------------------
 * Below 700px Built.css re-lays this card into 320 x 356: the five markets in
 * one row across the top, the padlock 194 design px beneath them, and five
 * wires running straight down into it. Nothing in the story changes — the
 * farthest market still leaves first, all five still arrive together — but four
 * numbers in this file were true of the landscape frame only, and each is now
 * asked rather than assumed:
 *
 *   the frame          was `const DW = 640, DH = 254`, used to divide live
 *                      pixels back into design units and to place the beads.
 *                      It is read from `--fw` / `--fh` on the card.
 *   the leans          12 and 6 design px are 1.9% and 0.9% of a 640 card and
 *                      would be 3.8% and 1.9% of a 320 one. Scaled by the frame.
 *   the bead           scaled too, but with a floor: proportion alone would put
 *                      it under two device pixels tall on a phone.
 *   the lock's lean    was `x: -LEAN_IN`, i.e. "the markets are to my left".
 *                      It is now along the mean of the wires that exist.
 *
 * WHAT THE PORTRAIT GEOMETRY DOES TO THE DEPARTURE WAVE, said plainly: the five
 * distances go from 441 / 309 / 158 / 333 / 204 to 231 / 204 / 194 / 204 / 231.
 * The wave is therefore much tighter — 0.28s from first to last rather than
 * 1.12s — and symmetric, so it opens as two pairs and a centre rather than as
 * five separate departures. That is the real geometry of a row of markets over
 * a padlock and it is not corrected for: faking a spread the layout does not
 * have is exactly the kind of number this pass is removing.
 *
 * WHAT THE BEADS ARE, AND WHY
 * ---------------------------
 * The wires ship as two `<img>` SVGs — `.bt2__fan` (four straight paths in the
 * landscape frame, five in the portrait one) and `.bt2__main` (BTC's, and not
 * on the card at all in portrait) — so nothing inside them is addressable and
 * `stroke-dashoffset` is off the table: there is no way to put light *on* the
 * stroke the way the fan section does. Rather than fake it with something that
 * moves no pixels (a clip-path window, a mask-position or a background-position
 * all animate a zero-travel bounding box and read as static on this project's
 * own check), this module creates five beads and flies them along the real
 * lines. Each is positioned as a percentage of the card and travels in
 * `xPercent`/`yPercent` of its own box, which is sized in `var(--c)`; both are
 * pure ratios, so the whole beat survives a resize without being rebuilt.
 *
 * They are inserted *behind* the nodes, so a bead leaves from under its market's
 * disc and is taken under the padlock's — it rides the full wire, occluded at
 * both ends, instead of docking at a rim.
 *
 * THE NODES MOVE IN PIXELS, AND THE BEADS IN PERCENT
 * --------------------------------------------------
 * Not an oversight. `.bt2__node` is centred on its mark by a stylesheet
 * `transform: translate(-50%, -50%)`, and GSAP parses that into its own
 * `xPercent`/`yPercent` cache — so a tween that writes `xPercent` REPLACES the
 * centring rather than adding to it, and the node jumps half its own width.
 * Measured: a 12px lean asked for in percent moved BTC 41.7px across and 32px
 * down, which is the 32px half-width of a 64px disc plus the lean. Pixels are
 * added on top of the centring, so the nodes lean in `x`/`y` scaled by the
 * measured design unit. The beads carry no stylesheet transform of their own
 * and so keep the resize-proof percentages.
 *
 * WHAT THIS MUST NOT DO
 * ---------------------
 * 1. No glow, bloom, halo or drop-shadow — standing rule for this site. A bead
 *    is a flat warm capsule; the answer at the lock is scale, position and
 *    colour and nothing else. `filter` is never written here.
 * 2. No `clearProps: 'all'`. Every `.bt2__node` carries BOTH of its positions in
 *    inline custom properties (`--x`/`--y`/`--s` landscape, `--mx`/`--my`/`--ms`
 *    portrait, plus the two mark sizes); emptying the style attribute drops all
 *    of them and collapses the constellation onto the card's centre. Only
 *    `transform` and `color` are ever cleared, by name.
 * 3. No pointer response of any kind, nothing that floats or breathes between
 *    beats, and no motion at all under `prefers-reduced-motion`.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { tok } from '../../../lib/theme';

/** The card's design frame, as a FALLBACK. Its `aspect-ratio` locks both axes
 *  to one scale, and below 700px that frame is 320 x 356 rather than 640 x 254
 *  -- so these two numbers are read from `--fw` / `--fh` on the card itself
 *  (Built.css) and these constants are only what a missing property yields.
 *  They are integers in both frames, so the division back into design units
 *  stays exact. */
const DW_FALLBACK = 640;
const DH_FALLBACK = 254;

/** One cycle, in GSAP time. Wall-clock is longer whenever lag smoothing bites. */
const PERIOD = 8.5;
/** Stillness at the top of a cycle, before the farthest market moves. */
const LEAD = 0.82;
/** How long the longest wire takes; every other journey is that speed. */
const RUN = 1.75;

/** The send: design px a node leans along its own wire, and the pulse's halves.
 *  A lean is a proportion of the card, not an absolute distance, so it is
 *  scaled by the frame below: 12 units of 640 and 6 units of 320 are the same
 *  1.9% of the card either way. */
const LUNGE = 12;
const UP = 0.18;
const BACK = 0.62;
/** Design px the padlock leans into the delivery as the beads reach it. Scaled
 *  the same way, and aimed by the wires rather than assumed to point left. */
const LEAN_IN = 6;

/** The bead, in design px of the 640-wide frame, and the smallest it is allowed
 *  to become in design px of whatever frame it lands in.
 *
 *  Scaling it with the frame like the leans above would give a 7 x 1.3 capsule
 *  on the phone -- proportionally identical and, at roughly one and a half
 *  device pixels tall, not a thing anyone would see travelling. A lean that
 *  small is still a lean; a mark that small is gone. So the bead scales and
 *  then stops: 14 x 2.6 at 640, 9 x 1.9 at 320. */
const BEAD_W = 14;
const BEAD_H = 2.6;
const BEAD_W_MIN = 9;
const BEAD_H_MIN = 1.9;

/* THE THREE COLOURS THIS FILE WRITES, as dark fallbacks. Each is read from its
   role token inside the build below, where `tok()` can see the theme that is
   actually on the document; each constant here is the exact hex the token
   resolves to in dark, so a missing property yields today's value.

   Only one of the three is a direction flip, and it is worth saying which,
   because "lit" does not mean the same thing twice on this card:

   BEAD_BG is --accent-lift, the same warm the gradient's light stop uses. It
   is a chromatic object on a neutral wire, not a brightness -- 4.57:1 on the
   dark card, 4.78:1 on the light one. It needs no flip, only the token.

   SEALED is --bt-seal, and it is the one value here that a role token could
   not carry. SELF-CUSTODY rests at --ink and goes brand red for the length of
   the settlement. In dark that is #fffbf8 -> #e5331e, a step of 4.23:1. Read
   as --accent in light it would be #1a1512 -> #a21605, a step of 2.29:1 --
   both ends are dark on paper, so 46% of the beat goes missing while the loop
   still runs and every check still passes. --bt-seal is #e5331e in dark, the
   same hex --accent resolves to, and --accent-lift's #c4361c in light, which
   puts the step back at 3.36:1. Built.css carries the reasoning.

   LIT is the flip. A market's label goes from --ink-2 to --ink while its value
   is in flight, and --ink is "as far from the page as ink goes" -- #fffbf8 on
   the dark card and #1a1512 on the light one. Taking the literal #fffbf8 into
   light would have moved the label from 6.4:1 to 1.02:1: the loop would still
   run, the gate would still pass, and the label would simply vanish at the
   moment it was meant to answer. */
const BEAD_BG = '#e9513f';
const LIT = '#fffbf8';
const SEALED = '#e5331e';

/** The moment every bead is at the padlock's centre. */
const ARRIVE = LEAD + UP + RUN;
/** The lock answers as the beads reach its rim, a frame or two earlier. */
const SEAL = ARRIVE - 0.12;
/** The cooling wave, and the end of the beat. */
const COOL = SEAL + 0.82;
const STORY = COOL + 0.85;

export function bt2Loop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const card = root.querySelector<HTMLElement>('.bt-card--two');
  if (!card) return () => {};

  const stage = card.querySelector<HTMLElement>('.bt2');
  const lock = card.querySelector<HTMLElement>('.bt2__node--lock');
  const lockLabel = lock?.querySelector<HTMLElement>('.bt2__label');
  const nodes = Array.from(card.querySelectorAll<HTMLElement>('.bt2__node:not(.bt2__node--lock)'));
  if (!stage || !lock || !lockLabel || nodes.length === 0) return () => {};

  /* ------------------------------------------------------------- geometry
     Measured, never assumed: the illustration is laid out in the card's own
     container unit, so live rects are the only honest source at any width.
     Everything is divided back into the 640 x 254 design frame, where the
     numbers are the ones in Figma and are the same at every breakpoint. */
  const cb = card.getBoundingClientRect();
  const cs = getComputedStyle(card);
  const DW = Number(cs.getPropertyValue('--fw')) || DW_FALLBACK;
  const DH = Number(cs.getPropertyValue('--fh')) || DH_FALLBACK;
  const u = cb.width / DW;
  if (!(u > 0)) return () => {};

  /* Every distance this file states in design px is stated for the 640-wide
     frame, so anything that is a PROPORTION of the card is scaled here. The
     distances it MEASURES -- the five wire lengths, the directions they run --
     are already in the frame's own units and need nothing. */
  const S = DW / 640;
  const lunge = LUNGE * S;
  const leanIn = LEAN_IN * S;
  const beadW = Math.max(BEAD_W * S, BEAD_W_MIN);
  const beadH = Math.max(BEAD_H * S, BEAD_H_MIN);

  const centre = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - cb.left + r.width / 2) / u,
      y: (r.top - cb.top + r.height / 2) / u,
    };
  };

  const hub = centre(lock);
  const markets = nodes.map((el) => {
    const c = centre(el);
    const dx = hub.x - c.x;
    const dy = hub.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    const label = el.querySelector<HTMLElement>('.bt2__label');
    return {
      el,
      label,
      // Read, not assumed: a label cools back to the colour the stylesheet gives
      // it, so a token change carries through without this file being touched.
      cool: label ? getComputedStyle(label).color : '',
      c,
      dx,
      dy,
      d,
      ux: dx / d,
      uy: dy / d,
    };
  });
  const lockCool = getComputedStyle(lockLabel).color;

  /* The mean direction the delivery arrives from, as a unit vector. See the
     lock's lean below. Normalised after averaging, so a market that is nearly
     opposite another cancels rather than dominating. */
  const aim = (() => {
    const sx = markets.reduce((a, m) => a + m.ux, 0) / markets.length;
    const sy = markets.reduce((a, m) => a + m.uy, 0) / markets.length;
    const len = Math.hypot(sx, sy) || 1;
    return { x: sx / len, y: sy / len };
  })();

  /* Read beside the rest colours above, for the same reason they are read
     here: this function is the build, so it runs after the theme is on the
     document and runs again when useSectionMotion rebuilds on a theme flip. */
  const beadBg = tok('--accent-lift', BEAD_BG);
  const litInk = tok('--ink', LIT);
  const sealed = tok('--bt-seal', SEALED);

  /* One speed for every wire, set by the longest of them. The departures fall
     out of it: a market leaves early exactly in proportion to how far it is. */
  const longest = markets.reduce((m, n) => Math.max(m, n.d), 0);
  const speed = longest / RUN;

  /* ---------------------------------------------------------------- beads
     Created here, removed in the teardown. Sized in `var(--c)` so the box
     scales with the card, and centred by negative margins rather than a
     translate, which keeps the transform GSAP writes purely the animation. */
  const beads: HTMLElement[] = [];
  const firstNode = nodes[0];
  for (const m of markets) {
    const bead = document.createElement('span');
    bead.className = 'bt2__bead';
    bead.setAttribute('aria-hidden', 'true');
    bead.style.cssText = [
      'position:absolute',
      `left:${(m.c.x / DW) * 100}%`,
      `top:${(m.c.y / DH) * 100}%`,
      `width:calc(${beadW} * var(--c))`,
      `height:calc(${beadH} * var(--c))`,
      `margin:calc(${-beadH / 2} * var(--c)) 0 0 calc(${-beadW / 2} * var(--c))`,
      `border-radius:calc(${beadH / 2} * var(--c))`,
      `background:${beadBg}`,
      'opacity:0',
      'pointer-events:none',
    ].join(';');
    stage.insertBefore(bead, firstNode);
    beads.push(bead);
  }

  let offscreen = false;
  let loop: gsap.core.Timeline | undefined;
  const inBeat = (t: number) => t > LEAD - 0.1 && t < STORY + 0.1;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ paused: true, repeat: -1 });
    loop = tl;

    /* The resting frame, restated rather than trusted. */
    beads.forEach((b, i) => {
      gsap.set(b, {
        xPercent: 0,
        yPercent: 0,
        scaleX: 1,
        opacity: 0,
        rotation: (Math.atan2(markets[i].dy, markets[i].dx) * 180) / Math.PI,
        transformOrigin: '50% 50%',
      });
    });

    markets.forEach((m, i) => {
      const bead = beads[i];
      const travel = m.d / speed;
      const depart = ARRIVE - travel;
      const lean = depart - UP;

      /* 1 — the market leans along its own wire and lets the value go. Both
         ends of the lean are stated, and the transform goes back to the
         stylesheet afterwards: an inline identity transform still promotes the
         node to its own layer, and these discs carry a backdrop filter. */
      tl.to(m.el, {
        x: lunge * m.ux * u,
        y: lunge * m.uy * u,
        scale: 1.07,
        duration: UP,
        ease: 'sine.out',
      }, lean)
        .to(m.el, {
          x: 0, y: 0, scale: 1, duration: BACK, ease: 'sine.inOut',
        }, lean + UP)
        .set(m.el, { clearProps: 'transform' }, lean + UP + BACK + 0.02);

      if (m.label) {
        tl.to(m.label, { color: litInk, duration: 0.26, ease: 'sine.out' }, lean);
      }

      /* 2 — the bead rides the wire. `fromTo` states both ends so a stranded
         value from an earlier cycle cannot poison it, and `immediateRender` is
         off because GSAP writes a fromTo's start the moment it is BUILT, not
         when the playhead arrives — without it every bead would sit parked at
         the padlock from the first frame. */
      tl.set(bead, { xPercent: 0, yPercent: 0, scaleX: 0.55, opacity: 0 }, depart)
        .fromTo(bead,
          { xPercent: 0, yPercent: 0 },
          {
            xPercent: (m.dx / beadW) * 100,
            yPercent: (m.dy / beadH) * 100,
            duration: travel,
            ease: 'none',
            immediateRender: false,
          }, depart)
        .to(bead, { opacity: 1, scaleX: 1, duration: Math.min(0.22, travel * 0.4), ease: 'power1.out' }, depart)
        // Taken under the padlock's disc: it does not stop at the rim, it goes in.
        .to(bead, { opacity: 0, duration: 0.14, ease: 'power2.in' }, ARRIVE - 0.14)
        .set(bead, { xPercent: 0, yPercent: 0, scaleX: 1, opacity: 0 }, ARRIVE + 0.02);
    });

    /* 3 — the lock takes the delivery: it leans into the incoming line, seats,
       and its label goes brand red for the length of the settlement.

       IT LEANS ALONG THE WIRES, not leftward. `x: -LEAN_IN` was true of exactly
       one layout -- the landscape frame, where all five markets are away to the
       left and the mean of their directions is (0.996, 0.087). In the portrait
       frame they are in a row ABOVE it and that mean is (0, -1): the same
       declaration would have had the padlock lean sideways, away from nothing,
       while five beads arrived from overhead. `aim` is that mean unit vector,
       computed from the wires that are actually on the card, and it reproduces
       the old cue to within half a design pixel at 1600. */
    tl.to(lock, {
      x: -leanIn * aim.x * u,
      y: -leanIn * aim.y * u,
      scale: 1.13,
      duration: 0.2,
      ease: 'sine.out',
    }, SEAL)
      .to(lock, { x: 0, y: 0, scale: 1, duration: BACK, ease: 'sine.inOut' }, SEAL + 0.2)
      .set(lock, { clearProps: 'transform' }, SEAL + 0.2 + BACK + 0.02)
      .to(lockLabel, { color: sealed, duration: 0.2, ease: 'sine.out' }, SEAL)
      .to(lockLabel, {
        color: lockCool, duration: 0.5, ease: 'sine.inOut',
        onComplete: () => gsap.set(lockLabel, { clearProps: 'color' }),
      }, COOL + 0.2);

    /* 4 — the circuit cools outward from the lock, nearest market first, so the
       beat closes in the same measured order it opened in, reversed. */
    [...markets]
      .sort((a, b) => a.d - b.d)
      .forEach((m, i) => {
        if (!m.label) return;
        const label = m.label;
        tl.to(label, {
          color: m.cool, duration: 0.4, ease: 'sine.inOut',
          onComplete: () => gsap.set(label, { clearProps: 'color' }),
        }, COOL + i * 0.09);
      });

    /* Off screen the loop stops here rather than wherever the scroll left it,
       so the card is never parked mid-delivery. A beat is under four seconds;
       it is allowed to finish. */
    tl.call(() => { if (offscreen) tl.pause(); }, undefined, STORY + 0.1);
    tl.to({}, { duration: 0.01 }, PERIOD - 0.01);
  }, card);

  /* Pause the moment the card leaves the screen, wake when it comes back. The
     margin is generous so the beat is not caught half-open on the way in. */
  const io = new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    if (!offscreen) loop?.play();
    else if (loop && !inBeat(loop.time())) loop.pause();
  }, { rootMargin: '120px' });
  io.observe(card);

  return () => {
    io.disconnect();
    // Reverts every tween this module built, which hands each element's style
    // attribute back exactly as it was found — mid-beat included.
    ctx.revert();
    for (const bead of beads) bead.remove();
    beads.length = 0;
  };
}
